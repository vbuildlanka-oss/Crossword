/* ===========================================================
   Crosswords Ahoy! — app shell & meta-game
   Screens, rewards, prize chests, level-ups, the prize wheel,
   quests, sticker album, badges, shop, Wordopedia, adventure map.
   =========================================================== */
(function (global) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const SCREENS = ["home", "setup", "game", "adventure", "album", "trade", "badges", "shop", "words"];
  const MODES = [
    { id: "classic", e: "🧩", name: "Classic", desc: "Solve at your own pace" },
    { id: "ta", e: "⚡", name: "Time Attack", desc: "Race the clock — words add time" },
    { id: "zen", e: "🧘", name: "Zen", desc: "No timer, no pressure" },
  ];

  const app = {
    theme: "regular", level: "easy", mode: "classic",
    lastStart: null, chestPending: null, lastResult: null,
  };

  // ---------------- Theme painting ----------------
  const DEFAULT_PAL = { card: "#ffffff", cell: "#ffffff", line: "#b9c6d8", shadow: "0 10px 30px rgba(36, 59, 83, 0.12)" };
  function applyTheme(key) {
    const meta = Game.themeMeta(key) || THEMES.regular;
    const p = meta.pal;
    const s = document.body.style;
    s.setProperty("--bg-1", p.bg1); s.setProperty("--bg-2", p.bg2);
    s.setProperty("--accent", p.accent); s.setProperty("--accent-2", p.accent2);
    s.setProperty("--accent-soft", p.soft);
    s.setProperty("--cell-word", p.word); s.setProperty("--cell-active", p.active || "#ffe39e");
    s.setProperty("--ink", p.ink); s.setProperty("--ink-soft", p.inkSoft);
    s.setProperty("--card", p.card || DEFAULT_PAL.card);
    s.setProperty("--cell", p.cell || DEFAULT_PAL.cell);
    s.setProperty("--cell-line", p.line || DEFAULT_PAL.line);
    s.setProperty("--shadow", p.dark ? "0 10px 30px rgba(0,0,0,0.5)" : DEFAULT_PAL.shadow);
    document.body.dataset.theme = key;
    document.body.classList.toggle("dark", !!p.dark);
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute("content", p.accent);
    FX.setAmbient(meta.fx);
  }

  // ---------------- Screens ----------------
  function show(name) {
    SCREENS.forEach((s) => { $(s + "-screen").hidden = s !== name; });
    document.body.dataset.screen = name;
    if (name !== "game") Game.stop();
    if (name === "home") renderHome();
    try { global.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { global.scrollTo(0, 0); }
  }
  function modalOpen() { return [...document.querySelectorAll(".modal-overlay")].some((m) => !m.hidden); }
  function openModal(id) { $(id).hidden = false; FX.play("pop"); }
  function closeModal(id) { $(id).hidden = true; }

  // ---------------- Home ----------------
  function renderProfile() {
    const d = Store.data;
    const li = Store.levelInfo();
    $("p-name").textContent = d.name || "Puzzler";
    $("p-title").textContent = li.title;
    $("p-level").textContent = li.level;
    $("p-xp-fill").style.width = (li.into / li.need * 100) + "%";
    $("p-xp-text").textContent = `${li.into} / ${li.need} XP`;
    $("p-coins").textContent = d.coins.toLocaleString();
    $("p-streak").textContent = Store.dailyInfo().streak;
  }
  function renderHome() {
    applyTheme(app.theme);
    renderProfile();
    const adv = Store.adventureProgress();
    $("hub-adv").textContent = adv.finished ? "All clear! 🏝️" : `Stage ${adv.current + 1} of ${Store.ADVENTURE_LENGTH}`;
    const daily = Store.dailyInfo();
    const dm = Game.themeMeta(daily.theme);
    $("hub-daily").textContent = daily.done ? `Done! 🔥 ${daily.streak}` : `${dm.emoji} ${dm.name}`;
    $("dot-daily").hidden = daily.done;
    $("hub-spin").textContent = Store.canSpin() ? "Free spin!" : "Come back tomorrow";
    $("dot-spin").hidden = !Store.canSpin();
    const q = Store.ensureQuests();
    const qDone = q.list.filter((x) => x.done).length;
    $("hub-quests").textContent = `${qDone}/3 done`;
    $("dot-quests").hidden = Store.questsReady() === 0 && !(Store.allQuestsClaimed() && !q.bonusClaimed);
    $("hub-album").textContent = `${Store.stickerCount()} / ${Store.STICKERS.length}`;
    $("hub-badges").textContent = `${Object.keys(Store.data.badges).length} / ${Store.BADGES.length}`;
    $("hub-words").textContent = `${Store.seenCount()} / ${totalWords()} found`;
    const ev = Store.seasonalEvent();
    const banner = $("event-banner");
    if (ev) {
      const tm = THEMES[ev.theme];
      banner.hidden = false;
      banner.innerHTML = `<span class="ev-emoji">${tm.emoji}</span><span class="ev-text"><b>${esc(ev.title)}</b><small>${esc(ev.text)} — play now!</small></span><span class="ev-go">Play ▶</span>`;
      banner.onclick = () => { app.theme = ev.theme; app.mode = "classic"; openSetup(); };
    } else banner.hidden = true;
  }
  function refreshCoins() {
    const c = Store.data.coins.toLocaleString();
    $("game-coins").textContent = c;
    $("p-coins").textContent = c;
    $("shop-coins").textContent = c;
  }

  let _totalWords = null;
  function themeWords(key) {
    const set = new Set();
    const L = THEMES[key].levels;
    ["easy", "medium", "tricky"].forEach((lv) => L[lv].forEach((e) => set.add(e.a)));
    return set;
  }
  function totalWords() {
    if (_totalWords == null) _totalWords = Object.keys(THEMES).reduce((s, k) => s + themeWords(k).size, 0);
    return _totalWords;
  }

  // ---------------- Setup screen ----------------
  function openSetup() {
    renderSetup();
    show("setup");
    applyTheme(app.theme);
  }
  function renderSetup() {
    const modeRow = $("mode-row");
    modeRow.innerHTML = "";
    MODES.forEach((m) => {
      const b = el("button", "mode-card");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(m.id === app.mode));
      b.innerHTML = `<span class="m-e">${m.e}</span><span class="m-name">${m.name}</span><span class="m-desc">${m.desc}</span>`;
      b.addEventListener("click", () => { app.mode = m.id; FX.play("click"); renderSetup(); });
      modeRow.appendChild(b);
    });

    const grid = $("theme-grid");
    grid.innerHTML = "";
    const ev = Store.seasonalEvent();
    const keys = Object.keys(THEMES).concat(["mix"]);
    $("theme-count").textContent = `· ${keys.length} worlds · ${totalWords().toLocaleString()} words`;
    keys.forEach((key) => {
      const t = Game.themeMeta(key);
      const card = el("button", "theme-card");
      card.type = "button";
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", String(key === app.theme));
      card.dataset.theme = key;
      card.style.setProperty("--tc", t.pal.accent);
      card.style.setProperty("--tbg", t.pal.soft);
      const best = Store.data.best[key + "-" + app.level] || 0;
      const words = key === "mix" ? totalWords() : themeWords(key).size;
      card.innerHTML =
        (ev && ev.theme === key ? `<span class="t-event">2× 🪙</span>` : "") +
        `<span class="t-emoji">${t.emoji}</span>` +
        `<span class="t-name">${esc(t.name)}</span>` +
        `<span class="t-blurb">${esc(t.blurb)}</span>` +
        `<span class="t-foot"><span class="t-stars">${"★".repeat(best)}${"☆".repeat(3 - best)}</span><span class="t-words">${words} words</span></span>`;
      card.addEventListener("click", () => {
        app.theme = key;
        FX.play("click");
        applyTheme(key);
        [...grid.children].forEach((c) => c.setAttribute("aria-checked", String(c.dataset.theme === key)));
      });
      grid.appendChild(card);
    });

    const row = $("difficulty-row");
    row.innerHTML = "";
    const lvl = Store.levelInfo().level;
    DIFFICULTIES.forEach((d) => {
      const locked = d.unlockLevel && lvl < d.unlockLevel;
      const card = el("button", "diff-card" + (locked ? " locked" : "") + (d.id === "mega" ? " mega" : ""));
      card.type = "button";
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", String(d.id === app.level));
      card.innerHTML =
        `<div class="d-stars">${locked ? "🔒" : d.stars}</div>` +
        `<div class="d-label">${d.label}</div>` +
        `<div class="d-desc">${locked ? `Unlocks at player level ${d.unlockLevel}` : `${d.words} words · ${d.desc}`}</div>`;
      card.addEventListener("click", () => {
        if (locked) { FX.play("wrong"); FX.toast("🔒", "Mega is locked", `Reach player level ${d.unlockLevel} to unlock it!`); return; }
        app.level = d.id; FX.play("click"); renderSetup();
      });
      row.appendChild(card);
    });
  }

  // ---------------- Starting puzzles ----------------
  function startPuzzle(opts) {
    app.lastStart = opts;
    applyTheme(opts.theme);
    show("game");
    refreshCoins();
    const ok = Game.start(opts);
    if (!ok) show("home");
  }
  function startClassic(seed, shared) {
    startPuzzle({ theme: app.theme, level: app.level, mode: app.mode, seed, shared });
  }
  function startDaily() {
    const d = Store.dailyInfo();
    app.theme = d.theme;
    startPuzzle({ theme: d.theme, level: d.level, mode: "classic", seed: d.seed, ctx: { daily: true } });
  }
  function startAdventure(i) {
    const st = Store.adventureStage(i);
    startPuzzle({ theme: st.theme, level: st.level, mode: st.mode, seed: st.seed, ctx: { adventure: i, boss: st.boss } });
  }

  // ---------------- Quests notifications ----------------
  function notifyQuest(ev, amount, extra) {
    const done = Store.questEvent(ev, amount, extra);
    done.forEach((q) => FX.toast(q.e, "Quest complete!", `${q.d} — claim it in Quests`, "quest"));
  }

  // ---------------- Win ----------------
  function chestTierFor(r) {
    if (r.ctx && r.ctx.daily) return "daily";
    if ((r.ctx && r.ctx.boss) || r.perfect || (r.stars === 3 && (r.level === "tricky" || r.level === "mega"))) return "gold";
    return "normal";
  }
  async function onWin(r) {
    app.lastResult = r;
    Store.recordWin(r);
    const ev = Store.seasonalEvent();
    const evMult = ev && ev.theme === r.theme ? ev.mult : 1;
    let coins = Math.round((20 + r.words * 4 + r.stars * 10) * r.mult) * evMult;
    const xp = Math.round((40 + r.words * 6 + r.stars * 15) * r.mult);
    const chips = [];
    chips.push(`<span class="chip coin">+${coins} 🪙${evMult > 1 ? " (2× event!)" : ""}</span>`);
    chips.push(`<span class="chip xp">+${xp} XP</span>`);
    if (r.golden) chips.push(`<span class="chip gold">🌟 ×${r.golden} (+${r.golden * 10} 🪙)</span>`);

    // Quests
    notifyQuest("win", 1);
    if (r.perfect) notifyQuest("perfect", 1);
    if (r.level === "tricky" || r.level === "mega") notifyQuest("hard", 1);
    if (r.mode === "ta") notifyQuest("ta", 1);
    notifyQuest("themeWin", 1, r.theme);
    notifyQuest("score", r.score);

    if (r.ctx && r.ctx.daily) {
      const streak = Store.completeDaily();
      if (streak) {
        const bonus = 100 + Math.min(streak, 7) * 15;
        coins += bonus;
        chips.push(`<span class="chip streak">🔥 ${streak}-day streak! +${bonus} 🪙</span>`);
        notifyQuest("daily", 1);
      }
    }
    if (r.ctx && r.ctx.adventure != null) {
      const first = Store.recordAdventure(r.ctx.adventure, r.stars);
      if (first) {
        const bonus = 40 + r.ctx.adventure * 5;
        coins += bonus;
        chips.push(`<span class="chip adv">🗺️ Stage cleared! +${bonus} 🪙</span>`);
        notifyQuest("adventure", 1);
      }
    }
    Store.addCoins(coins);
    const xpRes = Store.addXP(xp);
    const badges = Store.checkBadges(r);

    // ----- Fill the modal -----
    const titles = ["", "🎉 You did it! 🎉", "🌟 Great job! 🌟", r.perfect ? "🏆 PERFECT! 🏆" : "🎉 Superstar! 🎉"];
    $("win-title").textContent = titles[r.stars];
    const meta = Game.themeMeta(r.theme);
    $("win-message").textContent = (meta.cheer || "Awesome job!") + (r.perfect ? " You solved every square all by yourself!" : "");
    $("win-time").textContent = r.mode === "zen" ? "∞" : fmtTime(r.seconds);
    $("win-combo").textContent = "x" + Math.max(1, r.bestCombo);
    $("win-score").textContent = "0";
    const parts = [`Words ${r.base.toLocaleString()}`];
    if (r.timeBonus) parts.push(`Time +${r.timeBonus.toLocaleString()}`);
    if (r.perfectBonus) parts.push(`Perfect +${r.perfectBonus}`);
    if (r.mult !== 1) parts.push(`× ${r.mult} level bonus`);
    $("win-breakdown").textContent = parts.join(" · ");
    $("win-rewards").innerHTML = chips.join("");
    const wb = $("win-badges");
    wb.innerHTML = badges.map((b) => `<span class="badge-chip" title="${esc(b.d)}">${b.e} ${esc(b.n)}</span>`).join("");
    wb.hidden = !badges.length;
    [...$("win-stars").children].forEach((s) => s.classList.remove("on"));

    app.chestPending = chestTierFor(r);
    $("chest-btn").hidden = false;
    $("chest-btn").textContent = app.chestPending === "gold" ? "👑 Open golden chest!" : app.chestPending === "daily" ? "🌈 Open daily chest!" : "🎁 Open your prize!";
    const adv = r.ctx && r.ctx.adventure != null;
    const nextAdv = adv && r.ctx.adventure + 1 < Store.ADVENTURE_LENGTH;
    $("play-again-btn").textContent = adv ? (nextAdv ? "Next Stage ▶" : "Back to Map 🗺️") : r.ctx && r.ctx.daily ? "Keep Playing ▶" : "Play Again ▶";

    // XP bar starts at the old value.
    $("win-level").textContent = "Lv " + xpRes.before.level;
    const fill = $("win-xp-fill");
    fill.style.transition = "none";
    fill.style.width = (xpRes.before.into / xpRes.before.need * 100) + "%";

    openModal("win-modal");
    renderProfile();
    refreshCoins();

    // ----- Animate -----
    for (let i = 0; i < 3; i++) {
      await wait(300);
      if (i < r.stars) {
        $("win-stars").children[i].classList.add("on");
        FX.play("star", i);
        FX.burstAt($("win-stars").children[i], { count: 14, colors: ["#ffd23f", "#ffb300", "#fff3a0"], shape: "star" });
      }
    }
    FX.countUp($("win-score"), r.score, 900);
    await wait(500);
    fill.style.transition = "width 0.9s cubic-bezier(.2,.8,.2,1)";
    if (xpRes.levelsGained > 0) {
      fill.style.width = "100%";
      await wait(950);
      fill.style.transition = "none";
      fill.style.width = "0%";
      $("win-level").textContent = "Lv " + xpRes.after.level;
      void fill.offsetWidth;
      fill.style.transition = "width 0.6s ease";
    }
    fill.style.width = (xpRes.after.into / xpRes.after.need * 100) + "%";
    badges.forEach((b, i) => setTimeout(() => FX.toast(b.e, "Badge unlocked!", b.n, "badge"), i * 400));
    if (xpRes.levelsGained > 0) { await wait(700); await showLevelUp(xpRes); }
  }

  async function ensureChestOpened() {
    if (!app.chestPending) return;
    const tier = app.chestPending;
    app.chestPending = null;
    $("chest-btn").hidden = true;
    await openChest(tier);
    const fresh = Store.checkBadges();
    fresh.forEach((b) => FX.toast(b.e, "Badge unlocked!", b.n, "badge"));
  }

  // ---------------- Lose (Time Attack) ----------------
  function onLose(r) {
    app.lastResult = r;
    const coins = r.solved * 3;
    Store.addCoins(coins);
    const xp = Store.addXP(r.solved * 6);
    $("lose-message").textContent = r.solved ? `You solved ${r.solved} word${r.solved > 1 ? "s" : ""}. Try again — you're getting faster!` : "The clock won this time. Shake it off and try again!";
    $("lose-solved").textContent = `${r.solved}/${r.words}`;
    $("lose-score").textContent = r.score.toLocaleString();
    $("lose-coins").textContent = "+" + coins;
    openModal("lose-modal");
    if (xp.levelsGained > 0) setTimeout(() => showLevelUp(xp), 600);
  }

  // ---------------- Prize chest ----------------
  let chestResolve = null;
  function openChest(tier) {
    return new Promise((resolve) => {
      chestResolve = resolve;
      const modal = $("chest-modal");
      modal.dataset.tier = tier;
      $("chest").hidden = false;
      $("chest").classList.remove("opening");
      $("chest-reveal").hidden = true;
      $("chest-title").textContent = tier === "gold" ? "👑 A golden chest! Tap it!" : tier === "daily" ? "🌈 A rainbow chest! Tap it!" : "🎁 Tap the chest!";
      openModal("chest-modal");
    });
  }
  async function crackChest() {
    const chest = $("chest");
    if (chest.classList.contains("opening")) return;
    chest.classList.add("opening");
    FX.play("click");
    await wait(900);
    const tier = $("chest-modal").dataset.tier;
    const res = Store.rollSticker(tier);
    chest.hidden = true;
    const reveal = $("chest-reveal");
    reveal.hidden = false;
    reveal.style.setProperty("--rc", res.rarity.color);
    reveal.dataset.rarity = res.sticker.rarity;
    $("chest-sticker").textContent = res.sticker.e;
    $("chest-rarity").textContent = res.rarity.label;
    $("chest-name").textContent = res.sticker.name;
    $("chest-note").textContent = res.isNew ? "✨ NEW STICKER! ✨" : `Duplicate · +${res.bonus} 🪙`;
    $("chest-title").textContent = res.sticker.rarity === "legendary" ? "🤯 LEGENDARY!!" : res.sticker.rarity === "epic" ? "😲 EPIC find!" : "You got…";
    FX.play(res.sticker.rarity === "legendary" || res.sticker.rarity === "epic" ? "legendary" : "chest");
    FX.burstAt($("chest-sticker"), { count: res.sticker.rarity === "common" ? 24 : 50, speed: 6, colors: [res.rarity.color, "#ffd23f", "#ffffff"] });
    if (res.sticker.rarity === "legendary") FX.confetti(200);
    refreshCoins();
  }
  function closeChest() {
    closeModal("chest-modal");
    if (chestResolve) { const r = chestResolve; chestResolve = null; r(); }
  }

  // ---------------- Level up ----------------
  let levelResolve = null;
  function showLevelUp(xpRes) {
    return new Promise((resolve) => {
      levelResolve = resolve;
      const n = xpRes.levelsGained;
      $("lvl-num").textContent = xpRes.after.level;
      $("lvl-title").textContent = xpRes.after.title;
      $("lvl-rewards").innerHTML = `<span class="chip coin">+${50 * n} 🪙</span><span class="chip">+${n} 💣</span><span class="chip">+${2 * n} 💡</span>`;
      const megaLevel = DIFFICULTIES.find((d) => d.id === "mega").unlockLevel;
      const unlock = xpRes.before.level < megaLevel && xpRes.after.level >= megaLevel;
      $("lvl-unlock").hidden = !unlock;
      $("lvl-unlock").textContent = unlock ? "🔥 NEW: Mega level unlocked! Huge grids, huge rewards!" : "";
      openModal("level-modal");
      FX.play("level");
      FX.confetti(120);
      renderProfile();
    });
  }

  // ---------------- Prize wheel ----------------
  const WHEEL = [
    { label: "25", icon: "🪙", color: "#ffd166", w: 24, give: { coins: 25 }, text: "25 coins" },
    { label: "×2", icon: "💡", color: "#7dd3fc", w: 18, give: { inv: { hint: 2 } }, text: "2 Hints" },
    { label: "50", icon: "🪙", color: "#fca5a5", w: 20, give: { coins: 50 }, text: "50 coins" },
    { label: "×1", icon: "💣", color: "#c4b5fd", w: 12, give: { inv: { bomb: 1 } }, text: "a Letter Bomb" },
    { label: "100", icon: "🪙", color: "#86efac", w: 10, give: { coins: 100 }, text: "100 coins" },
    { label: "×2", icon: "❄️", color: "#a5f3fc", w: 10, give: { inv: { freeze: 2 } }, text: "2 Time Freezes" },
    { label: "Chest", icon: "👑", color: "#fdba74", w: 5, give: { chest: "gold" }, text: "a GOLDEN CHEST" },
    { label: "250", icon: "💰", color: "#f9a8d4", w: 1, give: { coins: 250 }, text: "the 250 coin JACKPOT" },
  ];
  let wheelRot = 0;
  let spinning = false;
  function buildWheel() {
    const wheel = $("wheel");
    const seg = 360 / WHEEL.length;
    wheel.style.background = `conic-gradient(${WHEEL.map((s, i) => `${s.color} ${i * seg}deg ${(i + 1) * seg}deg`).join(",")})`;
    wheel.innerHTML = "";
    WHEEL.forEach((s, i) => {
      const lab = el("div", "wheel-label");
      lab.style.transform = `rotate(${i * seg + seg / 2}deg)`;
      lab.innerHTML = `<span><i>${s.icon}</i>${s.label}</span>`;
      wheel.appendChild(lab);
    });
  }
  function msToMidnight() { const d = new Date(); const m = new Date(d); m.setHours(24, 0, 0, 0); return m - d; }
  function renderSpin() {
    const can = Store.canSpin();
    $("spin-btn").disabled = !can || spinning;
    $("spin-btn").textContent = can ? "SPIN" : "✓";
    if (!can && !spinning) {
      const ms = msToMidnight();
      $("spin-msg").textContent = `Next free spin in ${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
    } else if (!spinning) $("spin-msg").textContent = "One free spin every day!";
  }
  function openSpin() {
    buildWheel();
    $("spin-result").textContent = "";
    renderSpin();
    openModal("spin-modal");
  }
  function spin() {
    if (spinning || !Store.canSpin()) return;
    spinning = true;
    Store.markSpin();
    renderSpin();
    const total = WHEEL.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total, idx = 0;
    for (; idx < WHEEL.length; idx++) { if (roll < WHEEL[idx].w) break; roll -= WHEEL[idx].w; }
    idx = Math.min(idx, WHEEL.length - 1);
    const seg = 360 / WHEEL.length;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const targetMod = (360 - (idx * seg + seg / 2 + jitter) + 360) % 360;
    const base = wheelRot - (wheelRot % 360);
    wheelRot = base + 360 * 6 + targetMod;
    const wheel = $("wheel");
    const dur = FX.reduceMotion ? 300 : 4800;
    wheel.style.transition = `transform ${dur}ms cubic-bezier(0.17, 0.67, 0.12, 1)`;
    wheel.style.transform = `rotate(${wheelRot}deg)`;
    // Tick sound each time a segment passes the pointer.
    let lastSeg = -1;
    const t0 = performance.now();
    (function watch() {
      const m = getComputedStyle(wheel).transform;
      if (m && m !== "none") {
        const v = m.split("(")[1].split(")")[0].split(",").map(Number);
        const ang = (Math.atan2(v[1], v[0]) * 180 / Math.PI + 360) % 360;
        const s = Math.floor(ang / seg);
        if (s !== lastSeg) { lastSeg = s; FX.play("tick"); }
      }
      if (performance.now() - t0 < dur) requestAnimationFrame(watch);
    })();
    setTimeout(async () => {
      spinning = false;
      const prize = WHEEL[idx];
      const g = prize.give;
      if (g.coins) Store.addCoins(g.coins);
      if (g.inv) { Object.keys(g.inv).forEach((k) => { Store.data.inv[k] = (Store.data.inv[k] || 0) + g.inv[k]; }); Store.save(); }
      $("spin-result").textContent = `🎉 You won ${prize.text}!`;
      FX.play(g.coins >= 100 || g.chest ? "legendary" : "coin");
      FX.confetti(g.coins >= 100 || g.chest ? 180 : 80);
      renderSpin();
      refreshCoins();
      renderProfile();
      Store.checkBadges().forEach((b) => FX.toast(b.e, "Badge unlocked!", b.n, "badge"));
      if (g.chest) { await wait(900); await openChest(g.chest); }
    }, dur + 80);
  }

  // ---------------- Quests ----------------
  function renderQuests() {
    const q = Store.ensureQuests();
    const list = $("quest-list");
    list.innerHTML = "";
    q.list.forEach((item) => {
      const def = Store.questDef(item.id);
      if (!def) return;
      const pct = Math.min(100, item.progress / def.goal * 100);
      const row = el("div", "quest" + (item.done ? " done" : "") + (item.claimed ? " claimed" : ""));
      const prog = def.max && def.goal > 100 ? `${item.progress.toLocaleString()} / ${def.goal.toLocaleString()}` : `${item.progress} / ${def.goal}`;
      row.innerHTML =
        `<span class="q-e">${def.e}</span>` +
        `<span class="q-body"><b>${esc(def.d)}</b><span class="q-bar"><i style="width:${pct}%"></i></span><small>${prog} · 🪙${def.r.coins} · ${def.r.xp} XP</small></span>`;
      const btn = el("button", "btn " + (item.claimed ? "btn-ghost" : item.done ? "btn-primary" : "btn-ghost"));
      btn.type = "button";
      btn.textContent = item.claimed ? "✓" : item.done ? "Claim!" : "…";
      btn.disabled = !item.done || item.claimed;
      btn.addEventListener("click", async () => {
        const res = Store.claimQuest(item.id);
        if (!res) return;
        FX.play("coin");
        FX.burstAt(btn, { count: 20, colors: ["#ffd23f", "#ffb300"] });
        FX.toast("🪙", `+${def.r.coins} coins, +${def.r.xp} XP`, def.d);
        renderQuests(); renderProfile(); refreshCoins();
        if (res.xp.levelsGained > 0) await showLevelUp(res.xp);
      });
      row.appendChild(btn);
      list.appendChild(row);
    });
    const bonus = $("quest-bonus");
    if (q.bonusClaimed) bonus.innerHTML = `<span class="qb-done">👑 Golden chest claimed! New quests tomorrow.</span>`;
    else if (Store.allQuestsClaimed()) {
      bonus.innerHTML = "";
      const b = el("button", "btn btn-primary btn-chest", "👑 Open bonus golden chest!");
      b.type = "button";
      b.addEventListener("click", async () => {
        if (!Store.claimQuestBonus()) return;
        renderQuests();
        await openChest("gold");
        renderHome();
      });
      bonus.appendChild(b);
    } else bonus.innerHTML = `<span class="qb-lock">🔒 Claim all 3 quests to unlock a golden chest</span>`;
  }

  // ---------------- Album ----------------
  function renderAlbum() {
    const box = $("album");
    box.innerHTML = "";
    $("album-count").textContent = `${Store.stickerCount()}/${Store.STICKERS.length}`;
    const pending = Store.pendingOffers().length;
    $("trade-pending-pill").textContent = pending ? `⏳ ${pending} waiting` : "Trade ▶";
    ["legendary", "epic", "rare", "common"].forEach((rar) => {
      const R = Store.RARITY[rar];
      const list = Store.STICKERS.filter((s) => s.rarity === rar);
      const owned = list.filter((s) => Store.data.stickers[s.id]).length;
      const sec = el("div", "album-section");
      sec.style.setProperty("--rc", R.color);
      sec.innerHTML = `<h3 class="section-title"><span class="rar-dot"></span>${R.label} <small>${owned}/${list.length}</small></h3>`;
      const grid = el("div", "sticker-grid");
      list.forEach((s) => {
        const n = Store.data.stickers[s.id] || 0;
        const card = el("button", "sticker" + (n ? " owned" : " missing"));
        card.type = "button";
        card.dataset.rarity = rar;
        card.innerHTML = `<span class="st-e">${s.e}</span><span class="st-name">${n ? esc(s.name) : "???"}</span>${n > 1 ? `<span class="st-count">×${n}</span>` : ""}`;
        card.addEventListener("click", () => {
          if (!n) { FX.play("back"); return; }
          FX.play("pop");
          card.classList.remove("wiggle"); void card.offsetWidth; card.classList.add("wiggle");
          FX.burstAt(card, { count: 10, colors: [R.color, "#ffffff"] });
        });
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      box.appendChild(sec);
    });
  }

  // ---------------- Sticker trading ----------------
  const trade = { give: null, want: null, filter: "missing" };
  const tradeLink = (code) => `${location.origin}${location.pathname}?trade=${code}`;

  function fillSlot(slot, label, sticker, fallback) {
    const R = sticker ? Store.RARITY[sticker.rarity] : null;
    slot.style.setProperty("--rc", R ? R.color : "var(--cell-line)");
    slot.classList.toggle("filled", !!sticker);
    slot.querySelector("small").textContent = label;
    slot.querySelector(".ts-e").textContent = sticker ? sticker.e : fallback.e;
    slot.querySelector("b").textContent = sticker ? `${sticker.name} · ${R.label}` : fallback.n;
  }

  function stickerButton(s, opts) {
    const R = Store.RARITY[s.rarity];
    const n = Store.data.stickers[s.id] || 0;
    const b = el("button", "sticker owned trade-pick" + (opts.selected ? " selected" : ""));
    b.type = "button";
    b.dataset.rarity = s.rarity;
    b.style.setProperty("--rc", R.color);
    b.innerHTML = `<span class="st-e">${s.e}</span><span class="st-name">${esc(s.name)}</span>` +
      (opts.count ? `<span class="st-count">×${n}</span>` : "") +
      (opts.need ? `<span class="st-need">Need!</span>` : "");
    b.addEventListener("click", opts.onClick);
    return b;
  }

  function renderTrade() {
    const give = trade.give && Store.stickerById(trade.give);
    const want = trade.want && Store.stickerById(trade.want);
    fillSlot($("slot-give"), "You give", give, { e: "❔", n: "Pick below" });
    fillSlot($("slot-want"), "You get", want, trade.want === "gift" ? { e: "🎁", n: "Nothing, it's a gift!" } : { e: "❔", n: "Pick below" });
    $("slot-want").classList.toggle("filled", !!want || trade.want === "gift");

    // Give grid: stickers you own.
    const gGrid = $("trade-give");
    gGrid.innerHTML = "";
    const owned = Store.STICKERS.filter((s) => Store.data.stickers[s.id] > 0);
    $("give-hint").textContent = owned.length ? "Spare duplicates (×2 or more) are the best to trade" : "";
    if (!owned.length) gGrid.innerHTML = `<p class="empty-note">No stickers yet! Win puzzles to open prize chests 🎁</p>`;
    owned.sort((a, b) => (Store.data.stickers[b.id] - Store.data.stickers[a.id]));
    owned.forEach((s) => gGrid.appendChild(stickerButton(s, {
      count: true, selected: trade.give === s.id,
      onClick: () => { trade.give = s.id; FX.play("pop"); renderTrade(); },
    })));

    // Want grid: gift option + stickers.
    document.querySelectorAll("[data-want-filter]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.wantFilter === trade.filter)));
    const wGrid = $("trade-want");
    wGrid.innerHTML = "";
    const gift = el("button", "sticker owned trade-pick gift-pick" + (trade.want === "gift" ? " selected" : ""));
    gift.type = "button";
    gift.innerHTML = `<span class="st-e">🎁</span><span class="st-name">Just a gift</span>`;
    gift.addEventListener("click", () => { trade.want = "gift"; FX.play("pop"); renderTrade(); });
    wGrid.appendChild(gift);
    const list = Store.STICKERS.filter((s) => s.id !== trade.give && (trade.filter === "all" || !Store.data.stickers[s.id]));
    list.forEach((s) => wGrid.appendChild(stickerButton(s, {
      need: !Store.data.stickers[s.id] && trade.filter === "all", selected: trade.want === s.id,
      onClick: () => { trade.want = s.id; FX.play("pop"); renderTrade(); },
    })));

    // Create button + fairness note.
    const ready = !!give && (trade.want === "gift" || !!want);
    $("trade-create").disabled = !ready;
    const order = ["common", "rare", "epic", "legendary"];
    let note = "";
    if (give && want) {
      const d = order.indexOf(give.rarity) - order.indexOf(want.rarity);
      note = d > 0 ? "💛 You're giving a rarer sticker. That's very generous!" : d < 0 ? "🤔 You're asking for a rarer sticker. Your partner might say no!" : "⚖️ Fair swap, same rarity!";
    }
    if (give && Store.data.stickers[give.id] === 1) note += (note ? " " : "") + "⚠️ That's your only one.";
    $("trade-note").textContent = note;

    // Pending offers.
    const pend = Store.pendingOffers();
    $("trade-pending-wrap").hidden = !pend.length;
    const box = $("trade-pending");
    box.innerHTML = "";
    pend.forEach((p) => {
      const g = Store.stickerById(p.g);
      const w = p.w && Store.stickerById(p.w);
      const row = el("div", "pending-row");
      row.innerHTML = `<span class="pr-pair">${g.e} ⇄ ${w ? w.e : "🎁"}</span><span class="pr-text"><b></b><small>${new Date(p.t).toLocaleDateString()}</small></span>`;
      row.querySelector("b").textContent = w ? `${g.name} for ${w.name}` : `${g.name} (gift)`;
      const resend = el("button", "btn btn-secondary", "🔗 Link");
      const cancel = el("button", "btn btn-ghost", "✖ Cancel");
      resend.type = cancel.type = "button";
      resend.addEventListener("click", () => showOfferLink(p.id));
      cancel.addEventListener("click", () => {
        if (!confirm(`Cancel this trade and get your ${g.name} sticker back?\n\nOnly cancel if your partner has NOT accepted it yet.`)) return;
        Store.cancelOffer(p.id);
        FX.play("back");
        FX.toast(g.e, "Trade cancelled", `${g.name} is back in your album`);
        renderTrade();
      });
      row.append(resend, cancel);
      box.appendChild(row);
    });
  }

  function openTrade() { trade.give = null; trade.want = null; renderTrade(); show("trade"); }

  function createTrade() {
    const res = Store.createOffer(trade.give, trade.want === "gift" ? null : trade.want);
    if (!res) { FX.play("wrong"); return; }
    trade.give = null; trade.want = null;
    FX.play("chest");
    renderTrade();
    showOfferLink(res.id, true);
  }

  // ----- Trade dialog helpers -----
  function tmShow(o) {
    $("tm-title").textContent = o.title;
    $("tm-message").textContent = o.message;
    $("tm-pair").hidden = !o.left;
    if (o.left) {
      fillSlot($("tm-left"), o.left.label, o.left.s, o.left.fb || { e: "🎁", n: "A gift" });
      fillSlot($("tm-right"), o.right.label, o.right.s, o.right.fb || { e: "🎁", n: "Nothing, it's a gift!" });
    }
    $("tm-link-wrap").hidden = !o.link;
    $("tm-copy-status").textContent = "";
    if (o.link) $("tm-link").value = o.link;
    const actions = $("tm-actions");
    actions.innerHTML = "";
    (o.buttons || []).forEach((b) => {
      const btn = el("button", "btn " + (b.cls || "btn-ghost"), b.text);
      btn.type = "button";
      btn.addEventListener("click", b.onClick);
      actions.appendChild(btn);
    });
    openModal("trade-modal");
  }
  const closeTm = () => closeModal("trade-modal");
  function linkButtons(link, text) {
    const btns = [{ text: "📋 Copy link", cls: "btn-primary", onClick: () => copyText(link, $("tm-copy-status")) }];
    if (navigator.share) btns.push({ text: "Share…", cls: "btn-secondary", onClick: () => navigator.share({ title: "Crosswords Ahoy! sticker trade", text, url: link }).catch(() => {}) });
    btns.push({ text: "Done", onClick: closeTm });
    return btns;
  }
  function copyText(text, status) {
    const ok = () => { status.textContent = "Copied! Now send it to your partner 🎉"; FX.play("coin"); };
    const fallback = () => {
      try { $("tm-link").focus(); $("tm-link").select(); document.execCommand("copy"); ok(); }
      catch (e) { status.textContent = "Press and hold the link to copy it."; }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok).catch(fallback);
    else fallback();
  }

  function showOfferLink(id, fresh) {
    const t = Store.data.trades.out[id];
    if (!t) return;
    const g = Store.stickerById(t.g);
    const w = t.w && Store.stickerById(t.w);
    const link = tradeLink(Store.offerCode(id));
    tmShow({
      title: fresh ? "📦 Trade ready!" : "🔗 Your trade link",
      message: `Your ${g.name} sticker is packed and waiting. Send this link to your partner. When they accept, they'll send you a link back.`,
      left: { label: "You give", s: g }, right: { label: "You get", s: w },
      link, buttons: linkButtons(link, `Want to swap stickers? I'll trade my ${g.e} ${g.name}!`),
    });
    if (fresh) FX.burstAt($("tm-left"), { count: 20 });
  }

  // Opening a code (from a link or pasted).
  function handleTradeCode(code) {
    const o = Store.decodeTrade(code);
    if (!o) {
      FX.play("wrong");
      tmShow({ title: "🤔 Hmm…", message: "That trade code doesn't look right. Ask your partner to copy the whole link again.", buttons: [{ text: "OK", cls: "btn-primary", onClick: closeTm }] });
      return;
    }
    const g = Store.stickerById(o.g);
    const w = o.w && Store.stickerById(o.w);
    const info = Store.inspectTrade(o);

    if (o.k === "offer") {
      if (info.status === "own") {
        const link = Store.data.trades.out[o.id] ? tradeLink(Store.offerCode(o.id)) : null;
        if (!link) { tmShow({ title: "📦 Your old trade", message: "This trade was already finished or cancelled.", buttons: [{ text: "OK", cls: "btn-primary", onClick: closeTm }] }); return; }
        tmShow({ title: "📦 That's your own trade!", message: "Send this link to your partner so they can accept it.", left: { label: "You give", s: g }, right: { label: "You get", s: w }, link, buttons: linkButtons(link, "Want to swap stickers?") });
        return;
      }
      if (info.status === "accepted") {
        if (info.reply === "gift") { tmShow({ title: "🎁 Already opened", message: `You already got this gift from ${o.n}.`, buttons: [{ text: "OK", cls: "btn-primary", onClick: closeTm }] }); return; }
        const link = tradeLink(info.reply);
        tmShow({ title: "✅ Already traded", message: `You already accepted this trade. Here's the link for ${o.n} again, so they can get their sticker:`, left: { label: "You got", s: g }, right: { label: "You gave", s: w }, link, buttons: linkButtons(link, "Here's your sticker!") });
        return;
      }
      if (info.status === "missing") {
        tmShow({
          title: `🔁 Trade from ${o.n}`,
          message: `${o.n} wants your ${w.name} sticker, but you don't have it yet. Keep playing to find one, then open this link again!`,
          left: { label: "You'd get", s: g }, right: { label: "They want", s: w },
          buttons: [{ text: "OK", cls: "btn-primary", onClick: closeTm }],
        });
        return;
      }
      const yours = w ? Store.data.stickers[w.id] : 0;
      tmShow({
        title: w ? `🔁 ${o.n} wants to trade!` : `🎁 A gift from ${o.n}!`,
        message: w ? `${o.n} will give you ${g.name} for your ${w.name} (you have ${yours}).` : `${o.n} is sending you a sticker. How kind!`,
        left: { label: "You get", s: g }, right: { label: "You give", s: w },
        buttons: [
          { text: w ? "✅ Accept trade" : "🎁 Open gift", cls: "btn-primary", onClick: () => acceptTrade(o) },
          { text: w ? "No thanks" : "Later", onClick: closeTm },
        ],
      });
      return;
    }

    // Reply
    if (info.status === "claimed") { tmShow({ title: "✅ Already collected", message: `You already got your ${w.name} from this trade.`, buttons: [{ text: "OK", cls: "btn-primary", onClick: closeTm }] }); return; }
    if (info.status === "unknown") { tmShow({ title: "🤔 Not your trade", message: "This reply belongs to a trade made on another device (or one you cancelled). Open it on the device that made the trade.", buttons: [{ text: "OK", cls: "btn-primary", onClick: closeTm }] }); return; }
    const res = Store.claimReply(o);
    celebrateTrade(w, res && res.isNew);
    tmShow({
      title: "🎉 Trade complete!",
      message: `${o.n} accepted! ${w.name} is now in your album${res && res.isNew ? " (NEW!)" : ""}.`,
      left: { label: "You gave", s: g }, right: { label: "You got", s: w },
      buttons: [{ text: "📒 See album", cls: "btn-primary", onClick: () => { closeTm(); renderAlbum(); show("album"); } }, { text: "Close", onClick: closeTm }],
    });
  }

  function acceptTrade(o) {
    const res = Store.acceptOffer(o);
    if (!res) { FX.play("wrong"); return; }
    const g = Store.stickerById(o.g);
    const w = o.w && Store.stickerById(o.w);
    celebrateTrade(g, res.isNew);
    if (!res.reply) {
      tmShow({ title: "🎁 Gift opened!", message: `${g.name} is now in your album${res.isNew ? " (NEW!)" : ""}. Say thank you to ${o.n}!`, left: { label: "You got", s: g }, right: { label: "You gave", s: null },
        buttons: [{ text: "📒 See album", cls: "btn-primary", onClick: () => { closeTm(); renderAlbum(); show("album"); } }, { text: "Close", onClick: closeTm }] });
      return;
    }
    const link = tradeLink(res.reply);
    tmShow({
      title: "🎉 Swapped!",
      message: `You got ${g.name}${res.isNew ? " (NEW!)" : ""}! Now send this link back to ${o.n} so they get your ${w.name}.`,
      left: { label: "You got", s: g }, right: { label: "You gave", s: w },
      link, buttons: linkButtons(link, `I accepted your trade! Here's my ${w.e} ${w.name}`),
    });
  }

  function celebrateTrade(sticker, isNew) {
    FX.play(isNew ? "legendary" : "chest");
    FX.confetti(isNew ? 140 : 70);
    Store.checkBadges().forEach((b) => FX.toast(b.e, "Badge unlocked!", b.n, "badge"));
    if (sticker) FX.toast(sticker.e, isNew ? "New sticker!" : "Sticker added", sticker.name);
    if (!$("album-screen").hidden) renderAlbum();
    if (!$("trade-screen").hidden) renderTrade();
    if (!$("home-screen").hidden) renderHome();
  }

  // ---------------- Badges ----------------
  function renderBadges() {
    const grid = $("badge-grid");
    grid.innerHTML = "";
    const got = Store.data.badges;
    $("badge-count").textContent = `${Object.keys(got).length}/${Store.BADGES.length}`;
    const sorted = Store.BADGES.slice().sort((a, b) => (got[b.id] ? 1 : 0) - (got[a.id] ? 1 : 0));
    sorted.forEach((b) => {
      const card = el("div", "badge" + (got[b.id] ? " got" : ""));
      card.innerHTML = `<span class="b-e">${b.e}</span><b>${esc(b.n)}</b><small>${esc(b.d)}</small>${got[b.id] ? `<span class="b-date">${new Date(got[b.id]).toLocaleDateString()}</span>` : ""}`;
      grid.appendChild(card);
    });
  }

  // ---------------- Shop ----------------
  function renderShop() {
    refreshCoins();
    const pw = $("shop-powers");
    pw.innerHTML = "";
    Object.keys(Store.POWERUPS).forEach((id) => {
      const p = Store.POWERUPS[id];
      const card = el("div", "shop-card");
      const bulk = Math.round(p.price * 5 * 0.85);
      card.innerHTML = `<span class="sh-e">${p.e}</span><b>${p.name}</b><small>${p.desc}</small><span class="sh-own">You have <b>${Store.data.inv[id] || 0}</b></span>`;
      const row = el("div", "sh-buttons");
      const b1 = el("button", "btn btn-secondary", `Buy 1 · ${p.price}🪙`);
      const b5 = el("button", "btn btn-primary", `Buy 5 · ${bulk}🪙`);
      b1.type = b5.type = "button";
      b1.disabled = Store.data.coins < p.price;
      b5.disabled = Store.data.coins < bulk;
      b1.addEventListener("click", () => buy(id, 1, p.price, b1));
      b5.addEventListener("click", () => buy(id, 5, bulk, b5));
      row.append(b1, b5);
      card.appendChild(row);
      pw.appendChild(card);
    });
    function buy(id, qty, cost, btn) {
      if (!Store.spendCoins(cost)) { FX.play("wrong"); return; }
      Store.data.inv[id] = (Store.data.inv[id] || 0) + qty;
      Store.save();
      FX.play("coin");
      FX.burstAt(btn, { count: 16 });
      FX.toast(Store.POWERUPS[id].e, `+${qty} ${Store.POWERUPS[id].name}`, `-${cost} 🪙`);
      renderShop();
    }

    const sk = $("shop-skins");
    sk.innerHTML = "";
    Store.SKINS.forEach((s) => {
      const owned = Store.data.skins.includes(s.id);
      const on = Store.data.skin === s.id;
      const card = el("div", "shop-card skin-card" + (on ? " equipped" : ""));
      card.innerHTML = `<div class="skin-preview" data-skin-preview="${s.id}"><span class="cell in-word">W</span><span class="cell in-word active">O</span><span class="cell in-word active cursor">R</span><span class="cell in-word locked">D</span></div><b>${s.e} ${s.name}</b><small>${s.desc}</small>`;
      const btn = el("button", "btn " + (on ? "btn-ghost" : owned ? "btn-secondary" : "btn-primary"));
      btn.type = "button";
      btn.textContent = on ? "✓ Equipped" : owned ? "Equip" : `Buy · ${s.price}🪙`;
      btn.disabled = on || (!owned && Store.data.coins < s.price);
      btn.addEventListener("click", () => {
        if (owned) Store.equipSkin(s.id);
        else if (!Store.buySkin(s.id)) { FX.play("wrong"); return; }
        else { FX.play("legendary"); FX.confetti(90); Store.checkBadges().forEach((b) => FX.toast(b.e, "Badge unlocked!", b.n, "badge")); }
        document.body.dataset.skin = Store.data.skin;
        FX.play("pop");
        renderShop();
      });
      card.appendChild(btn);
      sk.appendChild(card);
    });
  }

  // ---------------- Wordopedia ----------------
  function renderWords(themeKey) {
    const list = $("words-list");
    list.innerHTML = "";
    $("words-count").textContent = `${Store.seenCount()} / ${totalWords()}`;
    if (!themeKey) {
      $("words-title").textContent = "📚 Wordopedia";
      $("words-sub").textContent = "Every word you solve is saved here. Collect them all!";
      $("words-back").textContent = "‹ Home";
      $("words-back").onclick = () => show("home");
      Object.keys(THEMES).forEach((k) => {
        const t = THEMES[k];
        const words = [...themeWords(k)];
        const found = words.filter((w) => Store.isSeen(k, w)).length;
        const row = el("button", "wtheme");
        row.type = "button";
        row.style.setProperty("--tc", t.pal.accent);
        row.innerHTML = `<span class="wt-e">${t.emoji}</span><span class="wt-body"><b>${esc(t.name)}</b><span class="q-bar"><i style="width:${found / words.length * 100}%"></i></span></span><span class="wt-count">${found}/${words.length}</span>`;
        row.addEventListener("click", () => { FX.play("click"); renderWords(k); });
        list.appendChild(row);
      });
      return;
    }
    const t = THEMES[themeKey];
    $("words-title").textContent = `${t.emoji} ${t.name}`;
    $("words-back").textContent = "‹ All themes";
    $("words-back").onclick = () => renderWords(null);
    const entries = [];
    const seen = new Set();
    ["easy", "medium", "tricky"].forEach((lv) => t.levels[lv].forEach((e) => { if (!seen.has(e.a)) { seen.add(e.a); entries.push({ ...e, lv }); } }));
    const found = entries.filter((e) => Store.isSeen(themeKey, e.a)).length;
    $("words-sub").textContent = `${found} of ${entries.length} discovered. Locked words show how many letters they have.`;
    entries.sort((a, b) => (Store.isSeen(themeKey, b.a) - Store.isSeen(themeKey, a.a)) || a.a.localeCompare(b.a));
    const grid = el("div", "word-cards");
    entries.forEach((e) => {
      const got = Store.isSeen(themeKey, e.a);
      const card = el("div", "word-card" + (got ? " got" : ""));
      card.innerHTML = got
        ? `<b>${e.a}</b><small></small><span class="wl">${e.lv}</span>`
        : `<b class="blanks">${"▢".repeat(e.a.length)}</b><small>Not found yet</small><span class="wl">${e.lv}</span>`;
      if (got) card.querySelector("small").textContent = e.c;
      grid.appendChild(card);
    });
    list.appendChild(grid);
  }

  // ---------------- Adventure map ----------------
  function renderAdventure() {
    const map = $("adv-map");
    map.innerHTML = "";
    const prog = Store.adventureProgress();
    $("adv-count").textContent = `${prog.cleared}/${Store.ADVENTURE_LENGTH}`;
    let region = null, path = null;
    for (let i = 0; i < Store.ADVENTURE_LENGTH; i++) {
      const st = Store.adventureStage(i);
      if (st.region !== region) {
        region = st.region;
        const lv = DIFFICULTIES.find((d) => d.id === st.level);
        const head = el("div", "adv-region", `<b>${["🌼", "🐚", "⛰️", "🌠"][Math.floor(i / 10)]} ${esc(region)}</b><small>${lv.stars} ${lv.label} stages</small>`);
        map.appendChild(head);
        path = el("div", "adv-path");
        map.appendChild(path);
      }
      const stars = prog.stars[i] || 0;
      const unlocked = i <= prog.current || stars > 0;
      const current = i === prog.current && !prog.finished;
      const tm = THEMES[st.theme];
      const node = el("button", "adv-node" + (stars ? " cleared" : "") + (current ? " current" : "") + (!unlocked ? " locked" : "") + (st.boss ? " boss" : ""));
      node.type = "button";
      node.style.setProperty("--x", (Math.sin(i * 0.9) * 34) + "%");
      node.style.setProperty("--tc", tm.pal.accent);
      node.innerHTML =
        `<span class="an-circle">${!unlocked ? "🔒" : st.boss ? "👑" : tm.emoji}</span>` +
        `<span class="an-label">${st.boss ? "BOSS " : ""}${i + 1}</span>` +
        `<span class="an-stars">${unlocked ? "★".repeat(stars) + "☆".repeat(3 - stars) : ""}</span>` +
        (current ? `<span class="an-pip">🦜</span>` : "");
      node.title = `${tm.name}${st.boss ? " · Time Attack boss" : ""}`;
      node.addEventListener("click", () => {
        if (!unlocked) { FX.play("wrong"); FX.toast("🔒", "Locked", `Clear stage ${prog.current + 1} first!`); return; }
        FX.play("click");
        startAdventure(i);
      });
      path.appendChild(node);
    }
    setTimeout(() => {
      const cur = map.querySelector(".adv-node.current");
      if (cur) cur.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 250);
  }

  // ---------------- Share ----------------
  function openShareModal() {
    const st = Game.state;
    $("share-link").value = Game.shareLink();
    const t = Game.themeMeta(st.theme);
    const d = Game.levelMeta(st.level);
    $("share-puzzle-label").textContent = `${t.emoji} ${t.name} · ${d.label}`;
    $("copy-status").textContent = "";
    $("native-share-btn").hidden = !(navigator && navigator.share);
    openModal("share-modal");
    setTimeout(() => { const inp = $("share-link"); inp.focus(); if (inp.select) inp.select(); }, 50);
  }
  function copyLink() {
    const link = $("share-link").value;
    const ok = () => { $("copy-status").textContent = "Link copied! Send it to your friend. 🎉"; FX.play("coin"); };
    const fallback = () => {
      try { $("share-link").focus(); $("share-link").select(); document.execCommand("copy"); ok(); }
      catch (e) { $("copy-status").textContent = "Press and hold the link above to copy it."; }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ok).catch(fallback);
    else fallback();
  }
  function nativeShare() {
    if (navigator.share) navigator.share({ title: "Crosswords Ahoy!", text: "Let's play this crossword together! 🧩", url: $("share-link").value }).catch(() => {});
  }
  function updateUrl(url) { try { history.replaceState(null, "", url); } catch (e) { /* ignore */ } }
  function clearUrl() { try { history.replaceState(null, "", location.pathname); } catch (e) { /* ignore */ } }
  function parseGameParam() {
    try {
      const params = new URLSearchParams(location.search);
      const g = params.get("game");
      if (!g) return null;
      const parts = g.split("-");
      if (parts.length < 3) return null;
      const theme = parts[0], level = parts[1], seed = parts.slice(2).join("-");
      if (!(THEMES[theme] || theme === "mix")) return null;
      if (!DIFFICULTIES.some((d) => d.id === level)) return null;
      if (!/^[a-z0-9]{1,24}$/i.test(seed)) return null;
      const m = params.get("m");
      const mode = MODES.some((x) => x.id === m) ? m : "classic";
      return { theme, level, seed, mode };
    } catch (e) { return null; }
  }

  // ---------------- Leaving the game ----------------
  function leaveGame() {
    Game.stop();
    clearUrl();
    const ctx = (app.lastStart && app.lastStart.ctx) || {};
    if (ctx.adventure != null) { renderAdventure(); show("adventure"); applyTheme("regular"); }
    else if (ctx.daily) show("home");
    else openSetup();
  }

  // ---------------- Wiring ----------------
  function wire() {
    $("logo-btn").addEventListener("click", () => { clearUrl(); show("home"); });
    $("sound-btn").addEventListener("click", () => {
      Store.setMuted(!Store.data.muted);
      $("sound-btn").textContent = Store.data.muted ? "🔇" : "🔊";
      FX.play("pop");
    });
    document.querySelectorAll(".back-home").forEach((b) => b.addEventListener("click", () => { FX.play("click"); show("home"); }));
    $("quick-play-btn").addEventListener("click", () => { FX.play("click"); if (app.mode === "ta") app.mode = "classic"; openSetup(); });
    document.querySelectorAll(".hub-tile").forEach((t) => t.addEventListener("click", () => {
      FX.play("click");
      const go = t.dataset.go;
      if (go === "adventure") { renderAdventure(); show("adventure"); }
      else if (go === "daily") {
        if (Store.dailyInfo().done) FX.toast("📅", "Daily done!", "You can replay it, but the streak bonus is once a day.");
        startDaily();
      }
      else if (go === "ta") { app.mode = "ta"; openSetup(); }
      else if (go === "spin") openSpin();
      else if (go === "quests") { renderQuests(); openModal("quests-modal"); }
      else if (go === "album") { renderAlbum(); show("album"); }
      else if (go === "badges") { renderBadges(); show("badges"); }
      else if (go === "shop") { renderShop(); show("shop"); }
      else if (go === "words") { renderWords(null); show("words"); }
    }));
    $("avatar-btn").addEventListener("click", () => { $("name-title").textContent = "Change your name"; $("name-input").value = Store.data.name; openModal("name-modal"); });
    $("name-save").addEventListener("click", saveName);
    $("name-input").addEventListener("keydown", (e) => { if (e.key === "Enter") saveName(); });

    $("start-btn").addEventListener("click", () => startClassic());
    $("back-btn").addEventListener("click", leaveGame);
    $("new-btn").addEventListener("click", () => {
      const st = Game.state;
      app.theme = st.theme; app.level = st.level; app.mode = st.mode;
      startClassic();
    });
    $("play-together-btn").addEventListener("click", openShareModal);
    $("win-share-btn").addEventListener("click", openShareModal);
    $("copy-link-btn").addEventListener("click", copyLink);
    $("native-share-btn").addEventListener("click", nativeShare);
    $("share-close-btn").addEventListener("click", () => closeModal("share-modal"));

    $("chest-btn").addEventListener("click", () => ensureChestOpened());
    $("play-again-btn").addEventListener("click", async () => {
      await ensureChestOpened();
      closeModal("win-modal");
      const ctx = (app.lastStart && app.lastStart.ctx) || {};
      if (ctx.adventure != null) {
        if (ctx.adventure + 1 < Store.ADVENTURE_LENGTH) startAdventure(ctx.adventure + 1);
        else { renderAdventure(); show("adventure"); }
      } else if (ctx.daily) { app.mode = "classic"; openSetup(); }
      else startClassic();
    });
    $("menu-btn").addEventListener("click", async () => {
      await ensureChestOpened();
      closeModal("win-modal");
      clearUrl();
      show("home");
    });
    $("retry-btn").addEventListener("click", () => {
      closeModal("lose-modal");
      const s = app.lastStart;
      if (s && (s.ctx && (s.ctx.adventure != null || s.ctx.daily))) startPuzzle(s);
      else startClassic();
    });
    $("lose-menu-btn").addEventListener("click", () => { closeModal("lose-modal"); clearUrl(); show("home"); });

    $("chest").addEventListener("click", crackChest);
    $("chest-close").addEventListener("click", closeChest);
    $("lvl-close").addEventListener("click", () => {
      closeModal("level-modal");
      if (levelResolve) { const r = levelResolve; levelResolve = null; r(); }
    });
    $("spin-btn").addEventListener("click", spin);
    $("spin-close").addEventListener("click", () => { if (spinning) return; closeModal("spin-modal"); renderHome(); });
    $("quests-close").addEventListener("click", () => { closeModal("quests-modal"); renderHome(); });

    // Sticker trading.
    $("open-trade-btn").addEventListener("click", () => { FX.play("click"); openTrade(); });
    $("trade-back").addEventListener("click", () => { FX.play("click"); renderAlbum(); show("album"); });
    $("trade-create").addEventListener("click", createTrade);
    document.querySelectorAll("[data-want-filter]").forEach((b) => b.addEventListener("click", () => {
      trade.filter = b.dataset.wantFilter; FX.play("click"); renderTrade();
    }));
    const openPasted = () => {
      const v = $("trade-code-input").value.trim();
      if (!v) return;
      $("trade-code-input").value = "";
      handleTradeCode(v);
    };
    $("trade-code-open").addEventListener("click", openPasted);
    $("trade-code-input").addEventListener("keydown", (e) => { if (e.key === "Enter") openPasted(); });

    // Escape closes simple dialogs.
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      ["share-modal", "quests-modal", "trade-modal"].forEach((id) => { if (!$(id).hidden) closeModal(id); });
      if (!$("spin-modal").hidden && !spinning) closeModal("spin-modal");
    });
  }

  function saveName() {
    const v = $("name-input").value.trim();
    Store.setName(v || "Puzzler");
    const first = !Store.data.welcomed;
    Store.data.welcomed = true;
    Store.save();
    closeModal("name-modal");
    renderProfile();
    if (first) {
      FX.confetti(120);
      FX.play("win");
      FX.toast("🎁", `Welcome aboard, ${Store.data.name}!`, "Here's 120 🪙 and a bag of power-ups to start");
    }
  }

  // ---------------- Init ----------------
  function init() {
    document.body.dataset.skin = Store.data.skin;
    $("sound-btn").textContent = Store.data.muted ? "🔇" : "🔊";
    Store.ensureQuests();
    wire();
    Game.wireInput();
    const tradeParam = new URLSearchParams(location.search).get("trade");
    const shared = parseGameParam();
    if (tradeParam) {
      clearUrl();
      renderAlbum();
      show("album");
      setTimeout(() => {
        handleTradeCode(tradeParam);
        if (!Store.data.welcomed) FX.toast("🦜", "Tip", "Tap your avatar on the Home screen to set your name");
      }, 350);
    } else if (shared) {
      app.theme = shared.theme; app.level = shared.level; app.mode = shared.mode;
      startClassic(shared.seed, true);
    } else {
      show("home");
      if (!Store.data.welcomed) setTimeout(() => { $("name-input").value = ""; openModal("name-modal"); setTimeout(() => $("name-input").focus(), 60); }, 500);
    }
  }

  global.App = { onWin, onLose, notifyQuest, refreshCoins, modalOpen, updateUrl };
  document.addEventListener("DOMContentLoaded", init);
})(window);
