/* ===========================================================
   Crosswords Ahoy! — puzzle gameplay
   Renders the crossword and handles typing, navigation, combos,
   golden stars, power-ups, timers, and the win / time-up flow.
   Meta-game (rewards, screens) lives in app.js.
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
  const now = () => performance.now();

  const PIP = {
    start: ["Ahoy! Let's crack this puzzle! 🧩", "Pick a clue, any clue! 👀", "I believe in you, matey! 💪", "Ready, set, spell! ✨", "Words ahoy! Let's go! ⛵"],
    word: ["Nice one! 🎯", "Boom! Nailed it! 💥", "You're a natural! 🌟", "Wordtastic! 🤩", "Squawk! Brilliant! 🦜", "Keep it rolling! 🎳"],
    combo: ["COMBO! You're on fire! 🔥", "Unstoppable! ☄️", "Whoa, speedy brain! ⚡", "Combo king! 👑", "Can't stop, won't stop! 🚀"],
    wrong: ["Hmm, one letter is sneaky… 🤔", "Close! Check those letters 🔍", "Almost! Try a different letter 💡", "Oops, not quite! You got this 💪"],
    golden: ["Shiny! A golden star! 🌟", "Ooh, treasure! ✨", "Golden star grabbed! 🪙"],
    idle: ["Tip: tap a clue in the list to jump to it 👉", "Tip: try the shortest words first 🐣", "Tip: crossing letters are great clues! ➕", "Stuck? A 💡 Hint can help!", "Tip: tap a square twice to switch direction ↔️"],
    hint: ["Here's a little help! 💡", "Psst… try this letter 🤫"],
    bomb: ["KABOOM! 💣", "Letters everywhere! 💥"],
    freeze: ["Brrr! Time is frozen! ❄️", "Chill out, clock! 🧊"],
    lowtime: ["Hurry, hurry! ⏰", "Quick! The clock is ticking! ⚡"],
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const state = {
    theme: "regular", level: "easy", mode: "classic", seed: null, shared: false, ctx: {},
    layout: null, cells: {}, cellEls: {}, activeKey: null, dir: "across",
    solved: new Set(), revealedKeys: new Set(), golden: new Set(), goldenGot: new Set(), extra: {},
    score: 0, combo: 0, comboExpire: 0, comboWindow: 30000, bestCombo: 0, helpUsed: 0,
    elapsed: 0, lastTick: 0, frozenUntil: 0, timeLeft: 0, timerId: null,
    finished: false, lastInput: 0, idleSaid: false, lowTimeSaid: false, lastSecond: -1,
  };

  // ---------- Theme & pool helpers ----------
  function themeMeta(key) { return key === "mix" ? MIX_THEME : THEMES[key]; }
  function levelMeta(id) { return DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[0]; }

  function getPool(theme, level) {
    const src = theme === "mix" ? Object.keys(THEMES) : [theme];
    const out = [];
    const seen = new Set();
    src.forEach((k) => {
      const L = THEMES[k].levels;
      const lists = level === "mega" ? [L.medium, L.tricky] : [L[level]];
      lists.forEach((list) => list.forEach((e) => {
        if (seen.has(e.a)) return;
        seen.add(e.a);
        out.push({ a: e.a, c: e.c, t: k });
      }));
    });
    return out;
  }

  function buildLayout(theme, level, seed) {
    const pool = getPool(theme, level);
    const want = levelMeta(level).words;
    let layout = null;
    for (let i = 0; i < 6; i++) {
      const cand = CrosswordGen.generate(pool, want, seed + "#" + i);
      if (cand && cand.clues.length >= Math.min(want, 5)) { layout = cand; break; }
      if (cand && (!layout || cand.clues.length > layout.clues.length)) layout = cand;
    }
    return layout;
  }

  function newSeed() { return Math.floor(Math.random() * 2176782336).toString(36); }

  // Try a few seeds and keep the one with the most words the player hasn't met yet.
  function freshSeed(theme, level) {
    let best = null;
    for (let i = 0; i < 6; i++) {
      const seed = newSeed();
      const lay = buildLayout(theme, level, seed);
      if (!lay) continue;
      const unseen = lay.clues.filter((c) => !Store.isSeen(c.t, c.answer)).length;
      const score = unseen * 10 + lay.clues.length;
      if (!best || score > best.score) best = { seed, score, lay };
      if (unseen === lay.clues.length) break;
    }
    return best;
  }

  // ---------- Model ----------
  const clueId = (clue) => clue.dir + ":" + clue.number;
  function clueKeys(clue) {
    const keys = [];
    for (let i = 0; i < clue.len; i++) {
      keys.push((clue.row + (clue.dir === "down" ? i : 0)) + "," + (clue.col + (clue.dir === "across" ? i : 0)));
    }
    return keys;
  }
  function buildCells() {
    state.cells = {};
    state.layout.clues.forEach((clue) => {
      clueKeys(clue).forEach((key, i) => {
        const [r, c] = key.split(",").map(Number);
        if (!state.cells[key]) state.cells[key] = { letter: clue.answer[i], input: "", r, c };
        if (i === 0) state.cells[key].number = clue.number;
        state.cells[key][clue.dir === "across" ? "acrossClue" : "downClue"] = clue;
      });
    });
    // Golden star squares (deterministic per seed so shared puzzles match).
    const rnd = CrosswordGen.rng(state.seed + "|gold");
    const keys = CrosswordGen.shuffle(Object.keys(state.cells), rnd);
    state.golden = new Set(keys.slice(0, levelMeta(state.level).golden));
  }
  const isLocked = (key) => {
    const info = state.cells[key];
    return !!info && ((info.acrossClue && state.solved.has(clueId(info.acrossClue))) || (info.downClue && state.solved.has(clueId(info.downClue))));
  };

  // ---------- Rendering ----------
  function renderGrid() {
    const board = $("crossword");
    board.innerHTML = "";
    state.cellEls = {};
    const { rows, cols } = state.layout;
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    board.style.width = `min(calc(100vw - 28px), ${cols * 46}px, 600px)`;
    board.style.setProperty("--cols", cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = r + "," + c;
        const info = state.cells[key];
        if (!info) { board.appendChild(el("div", "cell block")); continue; }
        const cell = el("div", "cell in-word deal");
        cell.dataset.key = key;
        cell.style.setProperty("--d", ((r + c) * 22) + "ms");
        if (info.number) cell.appendChild(el("span", "cell-num", String(info.number)));
        if (state.golden.has(key)) { cell.classList.add("golden"); cell.appendChild(el("span", "gold-star", "★")); }
        cell.appendChild(el("span", "cell-letter"));
        cell.addEventListener("click", (e) => { e.stopPropagation(); onCellClick(key); });
        board.appendChild(cell);
        state.cellEls[key] = cell;
      }
    }
    setTimeout(() => Object.values(state.cellEls).forEach((c) => c.classList.remove("deal")), 900 + (rows + cols) * 22);
  }

  function setLetter(key, ch) {
    state.cells[key].input = ch;
    const cellEl = state.cellEls[key];
    cellEl.querySelector(".cell-letter").textContent = ch;
    cellEl.classList.remove("wrong", "correct");
  }

  function renderClues() {
    const across = $("across-clues");
    const down = $("down-clues");
    across.innerHTML = ""; down.innerHTML = "";
    state.layout.clues.forEach((clue) => {
      const li = el("li");
      li.dataset.clue = clueId(clue);
      const tag = state.theme === "mix" && THEMES[clue.t] ? `<span class="ctag" title="${THEMES[clue.t].name}">${THEMES[clue.t].emoji}</span>` : "";
      li.innerHTML = `<span class="cnum">${clue.number}.</span><span class="ctext"></span>${tag}<span class="clen">(${clue.len})</span>`;
      li.querySelector(".ctext").textContent = clue.clue;
      li.addEventListener("click", () => selectClue(clue));
      (clue.dir === "across" ? across : down).appendChild(li);
    });
  }

  // ---------- Selection / navigation ----------
  function activeClue() {
    const info = state.cells[state.activeKey];
    if (!info) return null;
    if (state.dir === "across" && info.acrossClue) return info.acrossClue;
    if (state.dir === "down" && info.downClue) return info.downClue;
    return info.acrossClue || info.downClue;
  }
  function onCellClick(key) {
    const info = state.cells[key];
    if (state.activeKey === key) {
      if (info.acrossClue && info.downClue) state.dir = state.dir === "across" ? "down" : "across";
    } else {
      if (state.dir === "across" && !info.acrossClue) state.dir = "down";
      if (state.dir === "down" && !info.downClue) state.dir = "across";
    }
    state.activeKey = key;
    FX.play("move");
    focusInput();
    updateHighlight();
  }
  function selectClue(clue, noFocus) {
    state.dir = clue.dir;
    const keys = clueKeys(clue);
    state.activeKey = keys.find((k) => !state.cells[k].input && !isLocked(k)) || keys.find((k) => !isLocked(k)) || keys[0];
    if (!noFocus) focusInput();
    updateHighlight();
  }
  function updateHighlight() {
    Object.values(state.cellEls).forEach((c) => c.classList.remove("active", "cursor"));
    document.querySelectorAll(".clue-list li.active").forEach((li) => li.classList.remove("active"));
    const clue = activeClue();
    if (clue) {
      clueKeys(clue).forEach((k) => state.cellEls[k] && state.cellEls[k].classList.add("active"));
      const li = document.querySelector(`.clue-list li[data-clue="${clueId(clue)}"]`);
      if (li) {
        li.classList.add("active");
        const panel = li.closest(".clues-panel");
        if (panel && panel.scrollHeight > panel.clientHeight + 4) {
          // Scroll only the clue panel (not the whole page).
          const top = li.offsetTop - panel.clientHeight / 2;
          panel.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
      }
      const cur = $("current-clue");
      cur.innerHTML = `<span class="cc-num">${clue.number} ${clue.dir === "across" ? "Across →" : "Down ↓"} · ${clue.len} letters</span><span class="cc-text"></span>`;
      cur.querySelector(".cc-text").textContent = clue.clue;
      const extras = extraClues(clue).slice(0, state.extra[clueId(clue)] || 0);
      if (extras.length) {
        const box = el("span", "cc-extras");
        extras.forEach((x, i) => {
          const chip = el("span", "cc-extra" + (i === extras.length - 1 && state.justExtra ? " fresh" : ""));
          chip.innerHTML = `<i>${x.icon}</i> ${x.label} <b></b>`;
          chip.querySelector("b").textContent = x.value;
          box.appendChild(chip);
        });
        cur.appendChild(box);
      }
      state.justExtra = false;
      const more = $("more-clues-btn");
      if (more) {
        const used = state.extra[clueId(clue)] || 0;
        more.disabled = used >= EXTRA_TIERS;
        more.querySelector(".mc-count").textContent = used >= EXTRA_TIERS ? "all shown" : `${EXTRA_TIERS - used} left`;
      }
    }
    if (state.activeKey && state.cellEls[state.activeKey]) state.cellEls[state.activeKey].classList.add("active", "cursor");
  }
  function focusInput() {
    const input = $("hidden-input");
    input.value = "";
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
  }
  function stepInWord(step, skipLocked) {
    const clue = activeClue();
    if (!clue) return false;
    const keys = clueKeys(clue);
    let idx = keys.indexOf(state.activeKey) + step;
    while (idx >= 0 && idx < keys.length) {
      if (!skipLocked || !isLocked(keys[idx])) { state.activeKey = keys[idx]; updateHighlight(); return true; }
      idx += step;
    }
    updateHighlight();
    return false;
  }
  function nextUnsolvedClue(from) {
    const clues = state.layout.clues;
    let idx = from ? clues.indexOf(from) : -1;
    for (let i = 1; i <= clues.length; i++) {
      const c = clues[(idx + i + clues.length) % clues.length];
      if (!state.solved.has(clueId(c))) return c;
    }
    return null;
  }
  function moveCursor(dr, dc) {
    if (!state.activeKey) return;
    if (dr !== 0) state.dir = "down";
    if (dc !== 0) state.dir = "across";
    const [r, c] = state.activeKey.split(",").map(Number);
    let nr = r + dr, nc = c + dc;
    for (let i = 0; i < 30; i++) {
      const k = nr + "," + nc;
      if (state.cells[k]) { state.activeKey = k; FX.play("move"); updateHighlight(); return; }
      nr += dr; nc += dc;
      if (nr < 0 || nc < 0 || nr > 60 || nc > 60) break;
    }
    updateHighlight();
  }
  function jumpToNextClue(step) {
    const clues = state.layout.clues;
    const cur = activeClue();
    let idx = cur ? clues.indexOf(cur) : -1;
    idx = (idx + step + clues.length) % clues.length;
    selectClue(clues[idx]);
  }

  // ---------- Typing ----------
  function typeLetter(ch) {
    if (!state.activeKey || state.finished) return;
    state.lastInput = now(); state.idleSaid = false;
    let key = state.activeKey;
    if (isLocked(key)) {
      if (!stepInWord(1, true)) return;
      key = state.activeKey;
    }
    const info = state.cells[key];
    const letter = ch.toUpperCase();
    setLetter(key, letter);
    const cellEl = state.cellEls[key];
    cellEl.classList.remove("just-filled"); void cellEl.offsetWidth; cellEl.classList.add("just-filled");
    FX.play("key");

    if (letter === info.letter && state.golden.has(key) && !state.goldenGot.has(key) && !state.revealedKeys.has(key)) collectGolden(key);

    const before = activeClue();
    const solvedNow = evaluate([key], key);
    if (before && state.solved.has(clueId(before))) {
      const next = nextUnsolvedClue(before);
      if (next) setTimeout(() => { if (!state.finished) selectClue(next, true); }, solvedNow ? 120 : 0);
    } else {
      stepInWord(1, true);
    }
    maybeWin();
  }

  function backspace() {
    if (!state.activeKey || state.finished) return;
    state.lastInput = now();
    const key = state.activeKey;
    if (!isLocked(key) && state.cells[key].input) {
      setLetter(key, "");
      FX.play("back");
      return;
    }
    if (stepInWord(-1, true)) {
      const k = state.activeKey;
      if (!isLocked(k)) { setLetter(k, ""); FX.play("back"); }
    }
  }

  // ---------- Solving ----------
  // Check every word touching the given cells. Returns true if any word got solved.
  function evaluate(keys, typedKey) {
    let any = false;
    const seen = new Set();
    keys.forEach((key) => {
      const info = state.cells[key];
      [info.acrossClue, info.downClue].forEach((clue) => {
        if (!clue || seen.has(clue) || state.solved.has(clueId(clue))) return;
        seen.add(clue);
        const ks = clueKeys(clue);
        const full = ks.every((k) => state.cells[k].input);
        if (!full) return;
        if (ks.every((k) => state.cells[k].input === state.cells[k].letter)) { solveWord(clue); any = true; }
        else if (typedKey && clue === activeClue()) wrongWord(clue);
      });
    });
    updateSolvedCount();
    return any;
  }

  function solveWord(clue) {
    state.solved.add(clueId(clue));
    const ks = clueKeys(clue);
    ks.forEach((k, i) => {
      const c = state.cellEls[k];
      c.classList.add("locked");
      c.classList.remove("solved-wave"); void c.offsetWidth;
      c.style.setProperty("--w", (i * 55) + "ms");
      c.classList.add("solved-wave");
      setTimeout(() => c.classList.remove("solved-wave"), 900 + i * 55);
    });
    const li = document.querySelector(`.clue-list li[data-clue="${clueId(clue)}"]`);
    if (li) li.classList.add("done");
    const isNew = Store.markSeen(clue.t, clue.answer);

    const earned = ks.filter((k) => !state.revealedKeys.has(k)).length;
    const lastEl = state.cellEls[ks[ks.length - 1]];
    const midEl = state.cellEls[ks[Math.floor(ks.length / 2)]];
    if (earned > 0) {
      const t = now();
      state.combo = t < state.comboExpire ? state.combo + 1 : 1;
      state.combo = Math.min(state.combo, 8);
      state.comboExpire = t + state.comboWindow;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      Store.recordCombo(state.combo);
      const pts = (earned * 25 + (earned === ks.length ? 50 : 0)) * state.combo;
      state.score += pts;
      FX.floatText(lastEl, "+" + pts, state.combo >= 2 ? "big" : "");
      FX.burstAt(midEl, { count: 14 + state.combo * 4, speed: 3 + state.combo * 0.5 });
      FX.play("word", state.combo);
      Store.recordWord();
      App.notifyQuest("word", 1);
      App.notifyQuest("combo", state.combo);
      if (state.combo >= 2) { showComboBanner(state.combo); say(pick(PIP.combo)); }
      else say(pick(PIP.word));
    } else {
      FX.play("pop");
    }
    if (isNew) setTimeout(() => FX.floatText(midEl, "📚 New word!", "new"), 350);
    // Time Attack: every solved word adds bonus seconds.
    if (state.mode === "ta" && !state.finished) {
      const bonus = 6 + Math.round(clue.len * 0.8);
      state.timeLeft += bonus * 1000;
      FX.floatText($("timer"), `+${bonus}s`, "time");
    }
    updateScore();
    Store.save();
  }

  function wrongWord(clue) {
    clueKeys(clue).forEach((k) => {
      const c = state.cellEls[k];
      c.classList.remove("wrong-word"); void c.offsetWidth;
      c.classList.add("wrong-word");
      setTimeout(() => c.classList.remove("wrong-word"), 600);
    });
    FX.play("wrong");
    if (state.combo > 1) FX.floatText(state.cellEls[clueKeys(clue)[0]], "Combo lost", "lost");
    state.combo = 0; state.comboExpire = 0;
    say(pick(PIP.wrong), "worried");
  }

  function collectGolden(key) {
    state.goldenGot.add(key);
    const c = state.cellEls[key];
    c.classList.add("golden-got");
    const star = c.querySelector(".gold-star");
    if (star) star.remove();
    state.score += 100;
    Store.addCoins(10);
    Store.recordGolden();
    App.notifyQuest("golden", 1);
    FX.play("golden");
    FX.burstAt(c, { count: 22, colors: ["#ffd23f", "#ffb300", "#fff3a0"], shape: "star", speed: 4 });
    FX.floatText(c, "+10 🪙", "gold");
    say(pick(PIP.golden));
    App.refreshCoins();
    updateScore();
  }

  function showComboBanner(n) {
    const b = $("combo-banner");
    b.textContent = n >= 5 ? `MEGA COMBO x${n}! ☄️` : `COMBO x${n}! 🔥`;
    b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
    FX.play("combo", n);
  }

  function updateSolvedCount() {
    const total = state.layout.clues.length;
    $("solved-count").textContent = `${state.solved.size}/${total}`;
    $("progress-fill").style.width = (state.solved.size / total * 100) + "%";
    return { solved: state.solved.size, total };
  }
  function updateScore() {
    const s = $("score");
    s.textContent = state.score.toLocaleString();
    s.classList.remove("bump"); void s.offsetWidth; s.classList.add("bump");
  }

  // "Check" button: mark right/wrong letters for a moment (free).
  function checkAnswers() {
    if (state.finished) return;
    let wrong = 0, filled = 0;
    Object.keys(state.cells).forEach((key) => {
      const info = state.cells[key];
      const c = state.cellEls[key];
      c.classList.remove("correct", "wrong");
      if (!info.input || isLocked(key)) return;
      filled++;
      if (info.input === info.letter) c.classList.add("correct");
      else { c.classList.add("wrong"); wrong++; }
    });
    if (!filled) say("Fill in some letters first, then I'll check! 🔍");
    else if (!wrong) say("Every letter you filled is correct! 🌟");
    else { say(`${wrong} letter${wrong > 1 ? "s are" : " is"} off — the red ones need another try!`, "worried"); FX.play("wrong"); }
    setTimeout(() => Object.values(state.cellEls).forEach((c) => c.classList.remove("correct", "wrong")), 1600);
  }

  // ---------- More Clues (bonus clues that don't fill in any letters) ----------
  const EXTRA_TIERS = 3;
  function scramble(word) {
    if (new Set(word).size < 2) return word.split("");
    const rnd = CrosswordGen.rng(state.seed + "|mix|" + word);
    for (let i = 0; i < 8; i++) {
      const s = CrosswordGen.shuffle(word.split(""), rnd);
      if (s.join("") !== word) return s;
    }
    return word.split("").reverse();
  }
  function extraClues(clue) {
    const a = clue.answer;
    return [
      { icon: "🔤", label: "Starts with", value: a[0] },
      { icon: "🔚", label: "Ends with", value: a[a.length - 1] },
      { icon: "🔀", label: "Scrambled letters:", value: scramble(a).join(" ") },
    ];
  }
  function moreClues() {
    if (state.finished) return;
    const clue = activeClue();
    if (!clue) { say("Tap a word first, then I'll give you more clues! 👆"); return; }
    const id = clueId(clue);
    const used = state.extra[id] || 0;
    if (state.solved.has(id)) { say("You already solved that one! 🎉"); return; }
    if (used >= EXTRA_TIERS) { say("That's every bonus clue I have! Try a 💡 Hint 😉", "worried"); return; }
    state.extra[id] = used + 1;
    state.helpUsed++; // free, but it's no longer a "no help" perfect win
    state.justExtra = true;
    const li = document.querySelector(`.clue-list li[data-clue="${id}"]`);
    if (li) li.classList.add("has-extra");
    FX.play("hint");
    say(["Here's a bonus clue! 🔎", "Ooh, another clue! 🕵️", "Last bonus clue: unscramble it! 🔀"][used]);
    updateHighlight();
    FX.burstAt($("current-clue"), { count: 10, colors: ["#a78bfa", "#38bdf8", "#fde68a"], speed: 2.5 });
  }

  // ---------- Power-ups ----------
  function revealCell(key, cls, delay) {
    const info = state.cells[key];
    state.revealedKeys.add(key);
    if (state.golden.has(key) && !state.goldenGot.has(key)) {
      const star = state.cellEls[key].querySelector(".gold-star");
      if (star) star.remove();
      state.cellEls[key].classList.remove("golden");
    }
    setLetter(key, info.letter);
    const c = state.cellEls[key];
    c.classList.add("revealed");
    c.style.setProperty("--rd", (delay || 0) + "ms");
    c.classList.remove(cls); void c.offsetWidth; c.classList.add(cls);
    setTimeout(() => c.classList.remove(cls), 800 + (delay || 0));
  }

  function canAfford(id) {
    const inv = Store.data.inv[id] || 0;
    return inv > 0 || Store.data.coins >= Store.POWERUPS[id].price;
  }
  function consume(id) {
    if ((Store.data.inv[id] || 0) > 0) return Store.usePower(id);
    const p = Store.POWERUPS[id];
    if (Store.buyPower(id, 1)) {
      Store.usePower(id);
      FX.toast(p.e, `Bought ${p.name}`, `-${p.price} 🪙`);
      App.refreshCoins();
      return true;
    }
    return false;
  }
  function usePowerup(id) {
    if (state.finished) return;
    const btn = document.querySelector(`.power-btn[data-power="${id}"]`);
    const deny = (msg) => {
      say(msg, "worried");
      if (btn) { btn.classList.remove("nope"); void btn.offsetWidth; btn.classList.add("nope"); }
    };
    const clue = activeClue();
    if ((id === "hint" || id === "reveal") && (!clue || state.solved.has(clueId(clue)))) return deny("Tap a word that isn't solved yet first! 👆");
    if (id === "freeze" && now() < state.frozenUntil) return deny("The clock is already frozen! ❄️");
    if (!canAfford(id)) return deny("Not enough coins! Solve puzzles or spin the wheel 🪙");
    if (!consume(id)) return deny("Not enough coins! 🪙");
    state.helpUsed++;
    App.notifyQuest("power", 1);

    if (id === "hint") {
      const target = clueKeys(clue).find((k) => state.cells[k].input !== state.cells[k].letter);
      revealCell(target, "hinted");
      FX.play("hint");
      FX.burstAt(state.cellEls[target], { count: 10, colors: ["#fff3a0", "#ffd23f"], speed: 2.5 });
      say(pick(PIP.hint));
      afterReveal([target]);
    } else if (id === "reveal") {
      const ks = clueKeys(clue).filter((k) => state.cells[k].input !== state.cells[k].letter);
      ks.forEach((k, i) => revealCell(k, "hinted", i * 70));
      FX.play("hint");
      afterReveal(ks);
    } else if (id === "bomb") {
      const unsolved = CrosswordGen.shuffle(state.layout.clues.filter((c) => !state.solved.has(clueId(c))));
      const targets = [];
      unsolved.slice(0, 4).forEach((c) => {
        const cand = clueKeys(c).filter((k) => state.cells[k].input !== state.cells[k].letter && !targets.includes(k));
        if (cand.length) targets.push(cand[Math.floor(Math.random() * cand.length)]);
      });
      targets.forEach((k, i) => {
        revealCell(k, "boom", i * 90);
        setTimeout(() => FX.burstAt(state.cellEls[k], { count: 12, emoji: ["💥", "✨"], speed: 3.5, size: 18 }), i * 90);
      });
      FX.play("boom");
      const board = $("crossword");
      board.classList.remove("shake"); void board.offsetWidth; board.classList.add("shake");
      say(pick(PIP.bomb));
      afterReveal(targets);
    } else if (id === "freeze") {
      if (state.mode === "ta") {
        state.timeLeft += 20000;
        FX.floatText($("timer"), "+20s", "gold");
      }
      state.frozenUntil = now() + (state.mode === "ta" ? 8000 : 30000);
      document.body.classList.add("frozen");
      FX.play("freeze");
      FX.emojiRain(["❄️", "❅", "❆"], 24);
      say(pick(PIP.freeze));
    }
    updatePowerBar();
  }
  function afterReveal(keys) {
    const before = activeClue();
    evaluate(keys);
    if (before && state.solved.has(clueId(before))) {
      const next = nextUnsolvedClue(before);
      if (next) selectClue(next, true);
    } else updateHighlight();
    maybeWin();
  }

  function updatePowerBar() {
    document.querySelectorAll(".power-btn").forEach((b) => {
      const id = b.dataset.power;
      const n = Store.data.inv[id] || 0;
      const badge = b.querySelector(".pw-count");
      badge.textContent = n > 0 ? n : Store.POWERUPS[id].price + "🪙";
      badge.classList.toggle("buy", n <= 0);
    });
  }

  // ---------- Pip the parrot ----------
  let sayTimer = null;
  function say(text, mood) {
    const bubble = $("pip-bubble");
    const pip = $("pip");
    if (!bubble) return;
    bubble.textContent = text;
    pip.classList.remove("talk", "worried"); void pip.offsetWidth;
    pip.classList.add("talk");
    if (mood === "worried") pip.classList.add("worried");
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => pip.classList.remove("talk"), 3500);
  }

  // ---------- Timer & combo meter ----------
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
  function tick() {
    const t = now();
    const dt = t - state.lastTick;
    state.lastTick = t;
    if (state.finished || document.hidden || App.modalOpen()) return;
    const frozen = t < state.frozenUntil;
    if (!frozen) {
      state.elapsed += dt;
      if (state.mode === "ta") state.timeLeft -= dt;
    } else if (state.frozenUntil - t < 150) {
      document.body.classList.remove("frozen");
    }
    // Timer readout
    const timerEl = $("timer");
    if (state.mode === "ta") {
      const secs = state.timeLeft / 1000;
      timerEl.textContent = fmt(secs);
      const low = secs <= 10;
      $("timer-stat").classList.toggle("low", low);
      const whole = Math.ceil(secs);
      if (low && whole !== state.lastSecond && !frozen) { state.lastSecond = whole; FX.play("tick"); }
      if (low && !state.lowTimeSaid) { state.lowTimeSaid = true; say(pick(PIP.lowtime), "worried"); }
      if (state.timeLeft <= 0) { timeUp(); return; }
    } else if (state.mode === "zen") {
      timerEl.textContent = "∞";
    } else {
      timerEl.textContent = fmt(state.elapsed / 1000);
    }
    // Combo meter drains over the combo window.
    const meter = $("combo-meter");
    const left = Math.max(0, state.comboExpire - t);
    if (state.combo > 0 && left > 0) {
      meter.classList.add("on");
      $("combo-fill").style.width = (left / state.comboWindow * 100) + "%";
      $("combo-label").textContent = `🔥 x${state.combo}`;
      meter.dataset.level = Math.min(state.combo, 5);
    } else {
      if (state.combo > 0 && left <= 0) state.combo = 0;
      meter.classList.remove("on");
      $("combo-fill").style.width = "0%";
      $("combo-label").textContent = "Combo";
    }
    // Idle tip
    if (!state.idleSaid && t - state.lastInput > 30000) { state.idleSaid = true; say(pick(PIP.idle)); }
  }
  function startTimer() {
    stopTimer();
    state.lastTick = now();
    state.timerId = setInterval(tick, 100);
    tick();
  }
  function stopTimer() { if (state.timerId) clearInterval(state.timerId); state.timerId = null; }

  // ---------- Win / lose ----------
  function maybeWin() {
    if (state.finished) return;
    if (state.solved.size === state.layout.clues.length) finish();
  }
  function finish() {
    state.finished = true;
    stopTimer();
    document.body.classList.remove("frozen");
    const seconds = Math.round(state.elapsed / 1000);
    const lm = levelMeta(state.level);
    const totalCells = Object.keys(state.cells).length;
    const revealed = state.revealedKeys.size;
    const helpRatio = revealed / totalCells;
    const stars = helpRatio > 0.35 ? 1 : helpRatio > 0.1 ? 2 : 3;
    const perfect = state.helpUsed === 0 && revealed === 0;
    let timeBonus = 0;
    if (state.mode === "classic") timeBonus = Math.max(0, state.layout.clues.length * 25 - seconds) * 4;
    if (state.mode === "ta") timeBonus = Math.ceil(Math.max(0, state.timeLeft) / 1000) * 10;
    const perfectBonus = perfect ? 500 : 0;
    const total = Math.round((state.score + timeBonus + perfectBonus) * lm.mult);
    const result = {
      win: true, theme: state.theme, level: state.level, mode: state.mode, seed: state.seed, ctx: state.ctx,
      seconds, base: state.score, timeBonus, perfectBonus, mult: lm.mult, score: total, stars, perfect,
      words: state.layout.clues.length, golden: state.goldenGot.size, bestCombo: state.bestCombo, revealed,
    };
    // Victory wave across the board.
    Object.values(state.cellEls).forEach((c) => {
      const [r, cc] = c.dataset.key.split(",").map(Number);
      c.style.setProperty("--w", ((r + cc) * 35) + "ms");
      c.classList.remove("solved-wave"); void c.offsetWidth;
      c.classList.add("victory");
    });
    say(themeMeta(state.theme).cheer || "Amazing!");
    FX.play("win");
    FX.confetti(140);
    setTimeout(() => App.onWin(result), 1100);
  }
  function timeUp() {
    state.finished = true;
    stopTimer();
    $("timer").textContent = "0:00";
    FX.play("lose");
    Object.keys(state.cells).forEach((k) => {
      const info = state.cells[k];
      if (info.input !== info.letter) {
        state.cellEls[k].classList.add("missed");
        state.cellEls[k].querySelector(".cell-letter").textContent = info.letter;
      }
    });
    say("Time's up! So close! ⏰", "worried");
    const result = { win: false, theme: state.theme, level: state.level, mode: state.mode, seed: state.seed, ctx: state.ctx, solved: state.solved.size, words: state.layout.clues.length, score: Math.round(state.score * levelMeta(state.level).mult) };
    setTimeout(() => App.onLose(result), 1500);
  }

  // ---------- Start / stop ----------
  function start(opts) {
    opts = opts || {};
    state.theme = opts.theme || state.theme;
    state.level = opts.level || state.level;
    state.mode = opts.mode || "classic";
    state.shared = !!opts.shared;
    state.ctx = opts.ctx || {};
    let layout = null;
    if (opts.seed) {
      state.seed = String(opts.seed);
      layout = buildLayout(state.theme, state.level, state.seed);
    } else {
      const f = freshSeed(state.theme, state.level);
      if (f) { state.seed = f.seed; layout = f.lay; }
    }
    if (!layout) { alert("Oops! Could not build a puzzle. Please try another theme or level."); return false; }
    state.layout = layout;
    buildCells();

    const lm = levelMeta(state.level);
    Object.assign(state, {
      solved: new Set(), revealedKeys: new Set(), goldenGot: new Set(), extra: {},
      score: 0, combo: 0, comboExpire: 0, comboWindow: lm.comboWindow * 1000, bestCombo: 0, helpUsed: 0,
      elapsed: 0, frozenUntil: 0, finished: false, activeKey: null, dir: "across",
      lastInput: now(), idleSaid: false, lowTimeSaid: false, lastSecond: -1,
    });
    // Time Attack budget: generous for little ones, tighter for bosses.
    const letters = layout.clues.reduce((s, c) => s + c.len, 0);
    state.timeLeft = (30 + letters * 3.2 + layout.clues.length * 6) * 1000 * (opts.ctx && opts.ctx.boss ? 0.85 : 1);

    const tm = themeMeta(state.theme);
    $("game-theme-label").textContent = `${tm.emoji} ${tm.name}`;
    $("game-level-label").textContent = `${lm.stars} ${lm.label}`;
    const modeLabel = { classic: "🧩 Classic", ta: "⚡ Time Attack", zen: "🧘 Zen" }[state.mode];
    let ctxLabel = modeLabel;
    if (state.ctx.adventure != null) ctxLabel = `🗺️ Stage ${state.ctx.adventure + 1}${state.ctx.boss ? " · BOSS" : ""}`;
    if (state.ctx.daily) ctxLabel = "📅 Daily Challenge";
    $("game-mode-label").textContent = ctxLabel;
    $("timer-stat").classList.remove("low");
    $("timer-stat").classList.toggle("ta", state.mode === "ta");
    $("timer-stat").hidden = false;
    $("share-banner").hidden = !state.shared;
    document.body.classList.remove("frozen");

    renderGrid();
    renderClues();
    updateSolvedCount();
    $("score").textContent = "0";
    updatePowerBar();
    App.updateUrl(shareLink());
    selectClue(layout.clues[0], true);
    startTimer();
    setTimeout(() => say(state.mode === "ta" ? "Beat the clock! Every word adds time ⏱️" : pick(PIP.start)), 400);
    return true;
  }
  function stop() { stopTimer(); state.finished = true; document.body.classList.remove("frozen"); }

  function shareLink() {
    const base = location.origin + location.pathname;
    let url = `${base}?game=${state.theme}-${state.level}-${state.seed}`;
    if (state.mode !== "classic") url += `&m=${state.mode}`;
    return url;
  }

  // ---------- Input wiring ----------
  function wireInput() {
    const input = $("hidden-input");
    document.addEventListener("keydown", (e) => {
      if ($("game-screen").hidden || App.modalOpen()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) { typeLetter(e.key); e.preventDefault(); }
      else if (e.key === "Backspace" || e.key === "Delete") { backspace(); e.preventDefault(); }
      else if (e.key === "ArrowRight") { moveCursor(0, 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { moveCursor(0, -1); e.preventDefault(); }
      else if (e.key === "ArrowDown") { moveCursor(1, 0); e.preventDefault(); }
      else if (e.key === "ArrowUp") { moveCursor(-1, 0); e.preventDefault(); }
      else if (e.key === "Tab" || e.key === "Enter") { jumpToNextClue(e.shiftKey ? -1 : 1); e.preventDefault(); }
      else if (e.key === "?") { moreClues(); e.preventDefault(); }
      else if (e.key === " ") {
        const info = state.cells[state.activeKey];
        if (info && info.acrossClue && info.downClue) { state.dir = state.dir === "across" ? "down" : "across"; updateHighlight(); }
        e.preventDefault();
      }
    });
    // Mobile soft keyboard via hidden input.
    input.addEventListener("input", () => {
      const v = input.value;
      const last = v.slice(-1);
      if (/[a-zA-Z]/.test(last)) typeLetter(last);
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      // Some Android keyboards only send keydown "Unidentified"; Backspace still arrives.
      if (e.key === "Backspace" && !input.value) { backspace(); e.preventDefault(); e.stopPropagation(); }
    });
    $("crossword").addEventListener("click", () => focusInput());
    $("check-btn").addEventListener("click", checkAnswers);
    $("more-clues-btn").addEventListener("click", () => { moreClues(); focusInput(); });
    document.querySelectorAll(".power-btn").forEach((b) => b.addEventListener("click", () => usePowerup(b.dataset.power)));
  }

  global.Game = {
    start, stop, wireInput, shareLink, themeMeta, levelMeta, getPool, updatePowerBar, say,
    get state() { return state; },
  };
})(window);
