/*
 * Player progress, rewards, and meta-game rules.
 * Everything is saved in localStorage so progress survives page reloads.
 */
(function (global) {
  "use strict";

  const KEY = "cwahoy.save.v2";

  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayNumber(d) {
    d = d || new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }
  function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); }

  const defaults = () => ({
    name: "",
    xp: 0,
    coins: 120,
    inv: { hint: 5, bomb: 2, reveal: 2, freeze: 2 },
    stats: { puzzles: 0, words: 0, perfect: 0, bestCombo: 0, golden: 0, taWins: 0, mega: 0, themesWon: {}, powerups: 0, chests: 0, bestScore: 0, spins: 0 },
    best: {},          // "theme-level" -> stars
    seen: {},          // "theme:ANSWER" -> 1 (Wordopedia)
    stickers: {},      // id -> count
    badges: {},        // id -> timestamp
    daily: { lastSpin: null, streak: 0, lastDone: null, best: 0 },
    quests: { date: null, list: [], bonusClaimed: false },
    adventure: { stars: {} },
    pid: Math.random().toString(36).slice(2, 10), // anonymous player id (for trades)
    trades: { out: {}, accepted: {}, done: {}, count: 0 },
    skin: "classic",
    skins: ["classic"],
    muted: false,
    welcomed: false,
  });

  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function merge(base, extra) {
    if (!isObj(extra)) return base;
    Object.keys(extra).forEach((k) => {
      if (isObj(base[k]) && isObj(extra[k])) base[k] = merge(base[k], extra[k]);
      else base[k] = extra[k];
    });
    return base;
  }

  let data;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return merge(defaults(), JSON.parse(raw));
    } catch (e) { /* ignore corrupt saves */ }
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ } }
  data = load();
  save(); // persist a freshly generated player id right away

  // ---------------- Player level ----------------
  const TITLES = [
    "Word Sprout", "Letter Explorer", "Clue Cadet", "Spelling Scout", "Puzzle Pal",
    "Word Wizard", "Grid Guardian", "Riddle Ranger", "Clue Commander", "Crossword Captain",
    "Vocab Viking", "Brainy Buccaneer", "Lexicon Legend", "Word Superstar", "Grand Word Master",
  ];
  function needFor(level) { return 120 + (level - 1) * 60; }
  function levelInfo(xp) {
    let level = 1, rem = xp == null ? data.xp : xp;
    while (rem >= needFor(level)) { rem -= needFor(level); level++; }
    return { level, into: rem, need: needFor(level), title: TITLES[Math.min(TITLES.length - 1, level - 1)] };
  }
  function addXP(n) {
    const before = levelInfo();
    data.xp += Math.max(0, Math.round(n));
    const after = levelInfo();
    const levelsGained = after.level - before.level;
    if (levelsGained > 0) {
      // Level-up gift.
      data.coins += 50 * levelsGained;
      data.inv.bomb += levelsGained;
      data.inv.hint += 2 * levelsGained;
    }
    save();
    return { before, after, levelsGained };
  }

  function addCoins(n) { data.coins = Math.max(0, data.coins + Math.round(n)); save(); return data.coins; }
  function spendCoins(n) { if (data.coins < n) return false; data.coins -= n; save(); return true; }

  // ---------------- Power-ups & shop ----------------
  const POWERUPS = {
    hint:   { e: "💡", name: "Hint",        price: 15, desc: "Reveal one letter in the selected word" },
    reveal: { e: "📖", name: "Reveal Word", price: 30, desc: "Fill in the whole selected word" },
    bomb:   { e: "💣", name: "Letter Bomb", price: 40, desc: "Blast open a letter in up to 4 words" },
    freeze: { e: "❄️", name: "Time Freeze", price: 25, desc: "Stop the clock for 30s (+20s in Time Attack)" },
  };
  const SKINS = [
    { id: "classic", e: "🟦", name: "Classic", price: 0, desc: "The original tiles" },
    { id: "candy",   e: "🍬", name: "Candy Pop", price: 150, desc: "Sweet bubblegum tiles" },
    { id: "chalk",   e: "🖍️", name: "Chalkboard", price: 200, desc: "Write like the teacher" },
    { id: "neon",    e: "🌈", name: "Neon Glow", price: 300, desc: "Glowing arcade tiles" },
    { id: "wood",    e: "🪵", name: "Treehouse", price: 250, desc: "Cozy wooden blocks" },
    { id: "gold",    e: "👑", name: "Royal Gold", price: 600, desc: "Fit for a word king or queen" },
  ];
  function usePower(id) { if ((data.inv[id] || 0) <= 0) return false; data.inv[id]--; data.stats.powerups++; save(); return true; }
  function buyPower(id, qty) {
    qty = qty || 1;
    const p = POWERUPS[id];
    if (!p || !spendCoins(p.price * qty)) return false;
    data.inv[id] = (data.inv[id] || 0) + qty; save(); return true;
  }
  function buySkin(id) {
    const s = SKINS.find((x) => x.id === id);
    if (!s || data.skins.includes(id)) return false;
    if (!spendCoins(s.price)) return false;
    data.skins.push(id); data.skin = id; save(); return true;
  }
  function equipSkin(id) { if (data.skins.includes(id)) { data.skin = id; save(); } }

  // ---------------- Stickers (prize chests) ----------------
  const RARITY = {
    common:    { label: "Common",    color: "#64748b", dupe: 5 },
    rare:      { label: "Rare",      color: "#2563eb", dupe: 15 },
    epic:      { label: "Epic",      color: "#9333ea", dupe: 40 },
    legendary: { label: "Legendary", color: "#f59e0b", dupe: 100 },
  };
  const STICKERS = [];
  function addStickers(rarity, list) {
    list.split(",").forEach((pair) => {
      const [e, n] = pair.split(":");
      STICKERS.push({ id: rarity[0] + STICKERS.length, e: e.trim(), name: n.trim(), rarity });
    });
  }
  addStickers("common", "🐶:Puppy,🐱:Kitty,🐰:Bunny,🐸:Froggy,🐥:Chick,🐢:Turtle,🐝:Busy Bee,🐞:Ladybug,🦋:Butterfly,🐠:Fishy,🌻:Sunflower,🌈:Rainbow,⭐:Gold Star,🍎:Apple,🍕:Pizza Slice,🍦:Ice Cream,🍩:Donut,🎈:Balloon,⚽:Soccer Ball,🎨:Paint Palette,📚:Book Stack,✏️:Pencil,🌙:Crescent Moon,☀️:Sunshine,🍄:Mushroom,🌵:Cactus,🐌:Snail,🐧:Penguin,🦆:Duck,🐷:Piggy");
  addStickers("rare", "🦊:Fox,🐼:Panda,🦁:Lion,🐯:Tiger,🐨:Koala,🦉:Owl,🐙:Octopus,🦀:Crab,🐬:Dolphin,🦒:Giraffe,🦓:Zebra,🚀:Rocket,🎸:Guitar,🏆:Trophy,🎃:Jack-o'-lantern,🎄:Holiday Tree,💎:Diamond,🧁:Cupcake");
  addStickers("epic", "🦄:Unicorn,🐉:Dragon,🦖:T-Rex,🧚:Fairy,🧞:Genie,🪐:Ringed Planet,🌋:Volcano,🏰:Castle,🧙:Wizard");
  addStickers("legendary", "👑:Crown of Words,🌌:Galaxy,🔮:Crystal Orb,🦚:Royal Peacock");

  const CHEST_ODDS = {
    normal: { common: 70, rare: 23, epic: 6, legendary: 1 },
    gold:   { common: 35, rare: 40, epic: 19, legendary: 6 },
    daily:  { common: 0,  rare: 62, epic: 30, legendary: 8 },
  };
  function rollSticker(tier) {
    const odds = CHEST_ODDS[tier] || CHEST_ODDS.normal;
    let roll = Math.random() * 100, rarity = "common";
    for (const r of ["legendary", "epic", "rare", "common"]) {
      if (roll < odds[r]) { rarity = r; break; }
      roll -= odds[r];
    }
    const pool = STICKERS.filter((s) => s.rarity === rarity);
    const sticker = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !data.stickers[sticker.id];
    data.stickers[sticker.id] = (data.stickers[sticker.id] || 0) + 1;
    data.stats.chests++;
    let bonus = 0;
    if (!isNew) { bonus = RARITY[rarity].dupe; data.coins += bonus; }
    save();
    return { sticker, isNew, bonus, rarity: RARITY[rarity] };
  }
  function stickerCount() { return Object.keys(data.stickers).length; }
  function stickerById(id) { return STICKERS.find((s) => s.id === id) || null; }
  function giveSticker(id, n) {
    data.stickers[id] = (data.stickers[id] || 0) + (n == null ? 1 : n);
    if (data.stickers[id] <= 0) delete data.stickers[id];
  }

  // ---------------- Sticker trading (via share links) ----------------
  // There is no server, so trades travel as signed codes inside links:
  //   1. Offer: the giver's sticker is set aside (escrow) and an offer code is made.
  //   2. Accept: the partner swaps stickers and gets a reply code to send back.
  //   3. Claim: the giver opens the reply and receives the requested sticker.
  const TRADE_SALT = "cwahoy-trade-v1";
  function b64e(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64d(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return decodeURIComponent(escape(atob(str)));
  }
  function sign(json) { return global.CrosswordGen.hashSeed(json + TRADE_SALT).toString(36); }
  function encodeTrade(obj) { const json = JSON.stringify(obj); return b64e(json) + "." + sign(json); }
  function decodeTrade(code) {
    try {
      code = String(code || "").trim();
      const m = code.match(/[?&]trade=([^&#\s]+)/);
      if (m) code = decodeURIComponent(m[1]);
      const [body, sig] = code.split(".");
      if (!body || !sig) return null;
      const json = b64d(body);
      if (sign(json) !== sig) return null;
      const o = JSON.parse(json);
      if (!o || o.v !== 1 || (o.k !== "offer" && o.k !== "reply")) return null;
      if (!/^[a-z0-9]{4,16}$/.test(o.id) || !stickerById(o.g)) return null;
      if (o.w != null && !stickerById(o.w)) return null;
      o.n = String(o.n || "A friend").replace(/[<>]/g, "").slice(0, 18) || "A friend";
      return o;
    } catch (e) { return null; }
  }
  function playerName() { return data.name || "A friend"; }

  function createOffer(giveId, wantId) {
    if (!stickerById(giveId) || !(data.stickers[giveId] > 0)) return null;
    if (wantId != null && !stickerById(wantId)) return null;
    const id = Math.random().toString(36).slice(2, 10);
    giveSticker(giveId, -1);
    data.trades.out[id] = { g: giveId, w: wantId || null, t: Date.now() };
    save();
    return { id, code: encodeTrade({ v: 1, k: "offer", id, n: playerName(), f: data.pid, g: giveId, w: wantId || null }) };
  }
  function offerCode(id) {
    const t = data.trades.out[id];
    return t ? encodeTrade({ v: 1, k: "offer", id, n: playerName(), f: data.pid, g: t.g, w: t.w }) : null;
  }
  function cancelOffer(id) {
    const t = data.trades.out[id];
    if (!t) return false;
    giveSticker(t.g, 1);
    delete data.trades.out[id];
    save();
    return true;
  }
  // Look at a decoded code and describe what would happen, without changing anything.
  function inspectTrade(o) {
    if (o.k === "offer") {
      if (o.f === data.pid) return { status: "own" };
      if (data.trades.accepted[o.id]) return { status: "accepted", reply: data.trades.accepted[o.id] };
      if (o.w && !(data.stickers[o.w] > 0)) return { status: "missing" };
      return { status: "ok" };
    }
    // reply
    if (data.trades.done[o.id]) return { status: "claimed" };
    const t = data.trades.out[o.id];
    if (!t || o.to !== data.pid || t.g !== o.g || t.w !== o.w) return { status: "unknown" };
    return { status: "ok" };
  }
  function acceptOffer(o) {
    if (o.k !== "offer" || inspectTrade(o).status !== "ok") return null;
    if (o.w) giveSticker(o.w, -1);
    const isNew = !data.stickers[o.g];
    giveSticker(o.g, 1);
    const reply = o.w ? encodeTrade({ v: 1, k: "reply", id: o.id, n: playerName(), to: o.f, g: o.g, w: o.w }) : "gift";
    data.trades.accepted[o.id] = reply;
    data.trades.count++;
    save();
    return { reply: o.w ? reply : null, isNew };
  }
  function claimReply(o) {
    if (o.k !== "reply" || inspectTrade(o).status !== "ok") return null;
    const isNew = !data.stickers[o.w];
    giveSticker(o.w, 1);
    delete data.trades.out[o.id];
    data.trades.done[o.id] = 1;
    data.trades.count++;
    save();
    return { isNew };
  }
  function pendingOffers() {
    return Object.keys(data.trades.out).map((id) => ({ id, ...data.trades.out[id] })).sort((a, b) => b.t - a.t);
  }

  // ---------------- Words discovered (Wordopedia) ----------------
  function markSeen(theme, answer) {
    const k = theme + ":" + answer;
    if (data.seen[k]) return false;
    data.seen[k] = 1; return true;
  }
  function isSeen(theme, answer) { return !!data.seen[theme + ":" + answer]; }
  function seenCount() { return Object.keys(data.seen).length; }

  // ---------------- Badges ----------------
  const themeKeys = () => Object.keys(global.THEMES || {});
  const BADGES = [
    { id: "first", e: "🎉", n: "First Win", d: "Solve your first puzzle", t: (s) => s.stats.puzzles >= 1 },
    { id: "ten", e: "🔟", n: "Puzzle Pal", d: "Solve 10 puzzles", t: (s) => s.stats.puzzles >= 10 },
    { id: "fifty", e: "🏅", n: "Puzzle Pro", d: "Solve 50 puzzles", t: (s) => s.stats.puzzles >= 50 },
    { id: "hundred", e: "💯", n: "Centurion", d: "Solve 100 puzzles", t: (s) => s.stats.puzzles >= 100 },
    { id: "w100", e: "📖", n: "Word Collector", d: "Solve 100 words", t: (s) => s.stats.words >= 100 },
    { id: "w500", e: "📚", n: "Bookworm", d: "Solve 500 words", t: (s) => s.stats.words >= 500 },
    { id: "w1000", e: "🧠", n: "Walking Dictionary", d: "Solve 1,000 words", t: (s) => s.stats.words >= 1000 },
    { id: "perfect", e: "✨", n: "No Help Needed", d: "Win without hints or power-ups", t: (s) => s.stats.perfect >= 1 },
    { id: "perfect10", e: "🌟", n: "Flawless Ten", d: "Win 10 puzzles with no help", t: (s) => s.stats.perfect >= 10 },
    { id: "combo3", e: "🔥", n: "On Fire", d: "Reach a x3 combo", t: (s) => s.stats.bestCombo >= 3 },
    { id: "combo5", e: "☄️", n: "Unstoppable", d: "Reach a x5 combo", t: (s) => s.stats.bestCombo >= 5 },
    { id: "speedy", e: "⚡", n: "Lightning Fingers", d: "Finish an Easy puzzle in under 60 seconds", t: (s, c) => c && c.level === "easy" && c.mode !== "zen" && c.seconds < 60 },
    { id: "brainy", e: "🦉", n: "Big Brain", d: "Finish a Tricky puzzle in under 4 minutes", t: (s, c) => c && c.level === "tricky" && c.mode !== "zen" && c.seconds < 240 },
    { id: "mega", e: "🐘", n: "Mega Mind", d: "Win a Mega puzzle", t: (s) => s.stats.mega >= 1 },
    { id: "ta", e: "⏱️", n: "Beat the Clock", d: "Win a Time Attack", t: (s) => s.stats.taWins >= 1 },
    { id: "ta10", e: "🏎️", n: "Speed Racer", d: "Win 10 Time Attacks", t: (s) => s.stats.taWins >= 10 },
    { id: "score3k", e: "💥", n: "Score Smasher", d: "Score 3,000+ in one puzzle", t: (s) => s.stats.bestScore >= 3000 },
    { id: "themes5", e: "🗺️", n: "Explorer", d: "Win in 5 different themes", t: (s) => Object.keys(s.stats.themesWon).length >= 5 },
    { id: "themesAll", e: "🌍", n: "World Traveler", d: "Win in every theme", t: (s) => themeKeys().every((k) => s.stats.themesWon[k]) },
    { id: "golden10", e: "🌠", n: "Star Catcher", d: "Collect 10 golden stars", t: (s) => s.stats.golden >= 10 },
    { id: "golden50", e: "💫", n: "Stardust Hoarder", d: "Collect 50 golden stars", t: (s) => s.stats.golden >= 50 },
    { id: "streak3", e: "📅", n: "Daily Habit", d: "Daily Challenge 3 days in a row", t: (s) => s.daily.best >= 3 },
    { id: "streak7", e: "🗓️", n: "Week Warrior", d: "Daily Challenge 7 days in a row", t: (s) => s.daily.best >= 7 },
    { id: "stick10", e: "📒", n: "Sticker Starter", d: "Collect 10 different stickers", t: () => stickerCount() >= 10 },
    { id: "stick30", e: "🖼️", n: "Sticker Fan", d: "Collect 30 different stickers", t: () => stickerCount() >= 30 },
    { id: "stickAll", e: "🏛️", n: "Museum Curator", d: "Collect every sticker", t: () => stickerCount() >= STICKERS.length },
    { id: "trade1", e: "🤝", n: "Swap Buddy", d: "Complete a sticker trade", t: (s) => s.trades.count >= 1 },
    { id: "trade5", e: "🔁", n: "Super Trader", d: "Complete 5 sticker trades", t: (s) => s.trades.count >= 5 },
    { id: "legend", e: "👑", n: "Legendary Luck", d: "Find a legendary sticker", t: (s) => STICKERS.some((x) => x.rarity === "legendary" && s.stickers[x.id]) },
    { id: "rich", e: "💰", n: "Treasure Keeper", d: "Have 1,000 coins at once", t: (s) => s.coins >= 1000 },
    { id: "lvl5", e: "🎖️", n: "Rising Star", d: "Reach player level 5", t: () => levelInfo().level >= 5 },
    { id: "lvl10", e: "🏆", n: "Word Champion", d: "Reach player level 10", t: () => levelInfo().level >= 10 },
    { id: "adv10", e: "🧭", n: "Trailblazer", d: "Clear 10 Adventure stages", t: (s) => Object.keys(s.adventure.stars).length >= 10 },
    { id: "advAll", e: "🏝️", n: "Legend of the Map", d: "Clear every Adventure stage", t: (s) => Object.keys(s.adventure.stars).length >= ADVENTURE_LENGTH },
    { id: "words250", e: "🔎", n: "Word Hunter", d: "Discover 250 different words", t: () => seenCount() >= 250 },
    { id: "words750", e: "🗝️", n: "Word Archaeologist", d: "Discover 750 different words", t: () => seenCount() >= 750 },
    { id: "night", e: "🌙", n: "Night Owl", d: "Win a puzzle after 8 PM", t: (s, c) => c && new Date().getHours() >= 20 },
    { id: "early", e: "🌅", n: "Early Bird", d: "Win a puzzle before 8 AM", t: (s, c) => c && new Date().getHours() < 8 },
    { id: "spooky", e: "🎃", n: "Spooky Solver", d: "Win a Halloween puzzle", t: (s) => !!s.stats.themesWon.halloween },
    { id: "mix", e: "🎲", n: "Wild Card", d: "Win a Surprise Mix puzzle", t: (s) => !!s.stats.themesWon.mix },
    { id: "shopper", e: "🛍️", n: "Style Star", d: "Buy a tile skin", t: (s) => s.skins.length > 1 },
    { id: "spinner", e: "🎡", n: "Lucky Spinner", d: "Spin the Prize Wheel 5 times", t: (s) => s.stats.spins >= 5 },
  ];
  function checkBadges(ctx) {
    const fresh = [];
    BADGES.forEach((b) => {
      if (data.badges[b.id]) return;
      let ok = false;
      try { ok = b.t(data, ctx); } catch (e) { ok = false; }
      if (ok) { data.badges[b.id] = Date.now(); fresh.push(b); }
    });
    if (fresh.length) save();
    return fresh;
  }

  // ---------------- Daily quests ----------------
  const QUESTS = [
    { id: "solve2", e: "🧩", d: "Solve 2 puzzles", goal: 2, ev: "win", r: { coins: 60, xp: 40 } },
    { id: "solve3", e: "🧩", d: "Solve 3 puzzles", goal: 3, ev: "win", r: { coins: 90, xp: 60 } },
    { id: "words15", e: "🔤", d: "Solve 15 words", goal: 15, ev: "word", r: { coins: 50, xp: 40 } },
    { id: "words30", e: "🔤", d: "Solve 30 words", goal: 30, ev: "word", r: { coins: 90, xp: 70 } },
    { id: "combo3", e: "🔥", d: "Hit a x3 combo", goal: 3, ev: "combo", max: true, r: { coins: 60, xp: 50 } },
    { id: "combo4", e: "☄️", d: "Hit a x4 combo", goal: 4, ev: "combo", max: true, r: { coins: 90, xp: 70 } },
    { id: "golden3", e: "🌟", d: "Collect 3 golden stars", goal: 3, ev: "golden", r: { coins: 50, xp: 40 } },
    { id: "perfect", e: "✨", d: "Win a puzzle with no help", goal: 1, ev: "perfect", r: { coins: 80, xp: 60 } },
    { id: "hard", e: "🧠", d: "Win a Tricky or Mega puzzle", goal: 1, ev: "hard", r: { coins: 80, xp: 70 } },
    { id: "ta", e: "⏱️", d: "Win a Time Attack", goal: 1, ev: "ta", r: { coins: 80, xp: 60 } },
    { id: "themes2", e: "🎨", d: "Win in 2 different themes", goal: 2, ev: "themeWin", unique: true, r: { coins: 70, xp: 50 } },
    { id: "score2k", e: "💥", d: "Score 2,000+ in one puzzle", goal: 2000, ev: "score", max: true, r: { coins: 80, xp: 60 } },
    { id: "daily", e: "📅", d: "Finish the Daily Challenge", goal: 1, ev: "daily", r: { coins: 60, xp: 50 } },
    { id: "power", e: "💣", d: "Use 2 power-ups", goal: 2, ev: "power", r: { coins: 30, xp: 20 } },
    { id: "adventure", e: "🗺️", d: "Clear an Adventure stage", goal: 1, ev: "adventure", r: { coins: 70, xp: 50 } },
  ];
  function ensureQuests() {
    const today = dateKey();
    if (data.quests.date === today && data.quests.list.length) return data.quests;
    const rnd = global.CrosswordGen.rng("quests-" + today);
    const picked = [];
    const evs = new Set();
    const pool = global.CrosswordGen.shuffle(QUESTS, rnd);
    for (const q of pool) {
      if (picked.length >= 3) break;
      if (evs.has(q.ev)) continue; // one quest per event type
      evs.add(q.ev); picked.push({ id: q.id, progress: 0, done: false, claimed: false, meta: [] });
    }
    data.quests = { date: today, list: picked, bonusClaimed: false };
    save();
    return data.quests;
  }
  function questDef(id) { return QUESTS.find((q) => q.id === id); }
  // Report progress; returns quests that just became complete.
  function questEvent(ev, amount, extra) {
    ensureQuests();
    const done = [];
    data.quests.list.forEach((q) => {
      const def = questDef(q.id);
      if (!def || q.done || def.ev !== ev) return;
      if (def.unique) {
        if (extra && !q.meta.includes(extra)) q.meta.push(extra);
        q.progress = q.meta.length;
      } else if (def.max) {
        q.progress = Math.max(q.progress, amount || 0);
      } else {
        q.progress += amount == null ? 1 : amount;
      }
      if (q.progress >= def.goal) { q.progress = def.goal; q.done = true; done.push(def); }
    });
    save();
    return done;
  }
  function claimQuest(id) {
    const q = data.quests.list.find((x) => x.id === id);
    const def = questDef(id);
    if (!q || !def || !q.done || q.claimed) return null;
    q.claimed = true;
    data.coins += def.r.coins;
    save();
    const xp = addXP(def.r.xp);
    return { def, xp };
  }
  function allQuestsClaimed() { return data.quests.list.length && data.quests.list.every((q) => q.claimed); }
  function claimQuestBonus() {
    if (!allQuestsClaimed() || data.quests.bonusClaimed) return false;
    data.quests.bonusClaimed = true; save(); return true;
  }
  function questsReady() { ensureQuests(); return data.quests.list.filter((q) => q.done && !q.claimed).length; }

  // ---------------- Daily challenge & spin ----------------
  function dailyInfo() {
    const today = dateKey();
    const keys = themeKeys();
    const dn = dayNumber();
    const dow = new Date().getDay();
    const theme = keys[dn % keys.length];
    const level = (dow === 0 || dow === 6) ? "tricky" : "medium";
    const done = data.daily.lastDone === today;
    const streakAlive = data.daily.lastDone === today || data.daily.lastDone === yesterdayKey();
    return { today, theme, level, seed: "daily" + today.replace(/-/g, ""), done, streak: streakAlive ? data.daily.streak : 0 };
  }
  function completeDaily() {
    const info = dailyInfo();
    if (info.done) return null;
    data.daily.streak = data.daily.lastDone === yesterdayKey() ? data.daily.streak + 1 : 1;
    data.daily.lastDone = info.today;
    data.daily.best = Math.max(data.daily.best, data.daily.streak);
    save();
    return data.daily.streak;
  }
  function canSpin() { return data.daily.lastSpin !== dateKey(); }
  function markSpin() { data.daily.lastSpin = dateKey(); data.stats.spins++; save(); }

  // Seasonal events: bonus coins for the featured theme.
  function seasonalEvent(d) {
    d = d || new Date();
    const m = d.getMonth() + 1, day = d.getDate();
    if ((m === 10 && day >= 20) || (m === 11 && day <= 2)) return { theme: "halloween", title: "🎃 Spooky Season!", text: "Halloween puzzles give DOUBLE coins", mult: 2 };
    if (m === 12 && day <= 31) return { theme: "christmas", title: "🎄 Winter Wonderland!", text: "Christmas puzzles give DOUBLE coins", mult: 2 };
    if (m === 2 && day <= 15) return { theme: "valentines", title: "💝 Sweetheart Week!", text: "Valentine's puzzles give DOUBLE coins", mult: 2 };
    if (m >= 6 && m <= 8) return { theme: "ocean", title: "🏖️ Summer Splash!", text: "Under the Sea puzzles give DOUBLE coins", mult: 2 };
    return null;
  }

  // ---------------- Adventure map ----------------
  const ADV_ORDER = ["regular", "ocean", "jungle", "farm", "food", "bugs", "space", "dinos", "weather", "sports",
    "music", "magic", "vehicles", "science", "body", "world", "pirates", "halloween", "christmas", "valentines"];
  const ADVENTURE_LENGTH = 40;
  const ADV_LEVELS = ["easy", "medium", "tricky", "mega"];
  function adventureStage(i) {
    const keys = ADV_ORDER.filter((k) => global.THEMES && global.THEMES[k]);
    const tier = Math.min(3, Math.floor(i / 10));
    const boss = i % 10 === 9;
    return {
      index: i,
      theme: keys[i % keys.length],
      level: ADV_LEVELS[tier],
      mode: boss ? "ta" : "classic",
      boss,
      seed: "adv" + (i + 1),
      region: ["Sunny Meadows", "Coral Coast", "Misty Mountains", "Starlight Summit"][tier],
    };
  }
  function adventureProgress() {
    const stars = data.adventure.stars;
    let unlocked = 0;
    while (unlocked < ADVENTURE_LENGTH && stars[unlocked]) unlocked++;
    return { stars, current: Math.min(unlocked, ADVENTURE_LENGTH - 1), cleared: Object.keys(stars).length, finished: unlocked >= ADVENTURE_LENGTH };
  }
  function recordAdventure(i, stars) {
    const first = !data.adventure.stars[i];
    data.adventure.stars[i] = Math.max(data.adventure.stars[i] || 0, stars);
    save();
    return first;
  }

  // ---------------- Win bookkeeping ----------------
  function recordWin(r) {
    const s = data.stats;
    s.puzzles++;
    if (r.perfect) s.perfect++;
    if (r.level === "mega") s.mega++;
    if (r.mode === "ta") s.taWins++;
    s.bestCombo = Math.max(s.bestCombo, r.bestCombo || 0);
    s.bestScore = Math.max(s.bestScore, r.score || 0);
    s.themesWon[r.theme] = (s.themesWon[r.theme] || 0) + 1;
    const k = r.theme + "-" + r.level;
    data.best[k] = Math.max(data.best[k] || 0, r.stars);
    save();
  }
  function recordWord() { data.stats.words++; }
  function recordGolden() { data.stats.golden++; }
  function recordCombo(c) { data.stats.bestCombo = Math.max(data.stats.bestCombo, c); }

  function setName(n) { data.name = String(n || "").replace(/[<>]/g, "").trim().slice(0, 18); save(); }
  function setMuted(m) { data.muted = !!m; save(); }
  function resetAll() { data = defaults(); save(); }

  global.Store = {
    get data() { return data; },
    save, dateKey, levelInfo, addXP, addCoins, spendCoins,
    POWERUPS, SKINS, usePower, buyPower, buySkin, equipSkin,
    STICKERS, RARITY, rollSticker, stickerCount, stickerById,
    decodeTrade, inspectTrade, createOffer, offerCode, cancelOffer, acceptOffer, claimReply, pendingOffers,
    markSeen, isSeen, seenCount,
    BADGES, checkBadges,
    QUESTS, ensureQuests, questDef, questEvent, claimQuest, allQuestsClaimed, claimQuestBonus, questsReady,
    dailyInfo, completeDaily, canSpin, markSpin, seasonalEvent,
    ADVENTURE_LENGTH, adventureStage, adventureProgress, recordAdventure,
    recordWin, recordWord, recordGolden, recordCombo,
    setName, setMuted, resetAll,
  };
})(typeof window !== "undefined" ? window : globalThis);
