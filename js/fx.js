/*
 * Effects: synthesized sound, ambient theme particles, confetti & bursts,
 * floating score text, and toast notifications. No external assets needed.
 */
(function (global) {
  "use strict";

  const reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ====================== SOUND (Web Audio synth) ======================
  let ctx = null;
  let master = null;
  function audio() {
    if (Store.data.muted) return null;
    try {
      if (!ctx) {
        const AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.32;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  function tone(freq, dur, opts) {
    const a = audio();
    if (!a) return;
    opts = opts || {};
    const t0 = a.currentTime + (opts.delay || 0);
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
    const vol = opts.vol == null ? 0.5 : opts.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  function noise(dur, opts) {
    const a = audio();
    if (!a) return;
    opts = opts || {};
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = opts.freq || 900;
    const g = a.createGain(); g.gain.value = opts.vol || 0.5;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(a.currentTime + (opts.delay || 0));
  }
  const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
  const sfx = {
    key()   { tone(660 + Math.random() * 80, 0.06, { type: "triangle", vol: 0.18 }); },
    back()  { tone(320, 0.07, { type: "triangle", vol: 0.15 }); },
    move()  { tone(900, 0.03, { type: "sine", vol: 0.06 }); },
    word(combo) {
      const base = Math.min(combo || 1, 5) - 1;
      [0, 2, 4].forEach((n, i) => tone(NOTES[Math.min(NOTES.length - 1, n + base)], 0.18, { type: "triangle", vol: 0.32, delay: i * 0.07 }));
    },
    wrong() { tone(220, 0.18, { type: "square", vol: 0.12, slide: 140 }); tone(180, 0.22, { type: "square", vol: 0.1, delay: 0.1, slide: 110 }); },
    coin()  { tone(1318, 0.07, { type: "square", vol: 0.12 }); tone(1760, 0.16, { type: "square", vol: 0.12, delay: 0.06 }); },
    golden(){ [0, 2, 4, 7].forEach((n, i) => tone(NOTES[Math.min(7, n)] * 1.5, 0.12, { type: "sine", vol: 0.25, delay: i * 0.05 })); },
    hint()  { tone(880, 0.12, { type: "sine", vol: 0.25, slide: 1320 }); },
    boom()  { noise(0.5, { freq: 600, vol: 0.7 }); tone(120, 0.35, { type: "sine", vol: 0.5, slide: 40 }); },
    freeze(){ [1760, 1568, 1318, 1568, 1760].forEach((f, i) => tone(f, 0.12, { type: "sine", vol: 0.15, delay: i * 0.05 })); },
    pop()   { tone(520, 0.08, { type: "sine", vol: 0.3, slide: 900 }); },
    click() { tone(1000, 0.025, { type: "square", vol: 0.05 }); },
    tick()  { tone(1400, 0.02, { type: "square", vol: 0.07 }); },
    win()   { [0, 2, 4, 5, 7].forEach((n, i) => tone(NOTES[n], 0.25, { type: "triangle", vol: 0.32, delay: i * 0.11 })); tone(NOTES[7], 0.6, { type: "triangle", vol: 0.32, delay: 0.6 }); },
    lose()  { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, { type: "triangle", vol: 0.25, delay: i * 0.18 })); },
    star(i) { tone(NOTES[2 + (i || 0) * 2], 0.25, { type: "triangle", vol: 0.32 }); },
    level() { [0, 4, 7].forEach((n, i) => tone(NOTES[Math.min(7, n)], 0.35, { type: "sawtooth", vol: 0.12, delay: i * 0.12 })); tone(NOTES[7] * 1.5, 0.7, { type: "triangle", vol: 0.25, delay: 0.4 }); },
    chest() { noise(0.25, { freq: 1500, vol: 0.3 }); [0, 2, 4, 7].forEach((n, i) => tone(NOTES[Math.min(7, n)] * 2, 0.15, { type: "sine", vol: 0.2, delay: 0.15 + i * 0.06 })); },
    legendary() { [0, 2, 4, 5, 7].forEach((n, i) => tone(NOTES[n] * 2, 0.3, { type: "sine", vol: 0.25, delay: i * 0.09 })); },
    combo(c) { tone(NOTES[Math.min(7, c + 1)], 0.1, { type: "square", vol: 0.1 }); tone(NOTES[Math.min(7, c + 3)], 0.18, { type: "square", vol: 0.1, delay: 0.08 }); },
  };
  function play(name, arg) { try { if (sfx[name]) sfx[name](arg); } catch (e) { /* audio is optional */ } }

  // ====================== AMBIENT PARTICLES ======================
  const amb = { canvas: null, c2: null, parts: [], cfg: null, raf: null, last: 0, w: 0, h: 0, dpr: 1 };
  function sizeCanvas(cv, holder) {
    holder.dpr = Math.min(2, global.devicePixelRatio || 1);
    holder.w = global.innerWidth; holder.h = global.innerHeight;
    cv.width = holder.w * holder.dpr; cv.height = holder.h * holder.dpr;
    cv.style.width = holder.w + "px"; cv.style.height = holder.h + "px";
  }
  function spawnAmbient(initial) {
    const cfg = amb.cfg;
    const e = cfg.e[Math.floor(Math.random() * cfg.e.length)];
    const size = 14 + Math.random() * 22;
    const p = { e, size, x: Math.random() * amb.w, y: 0, vx: 0, vy: 0, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02, a: 0.18 + Math.random() * 0.22, phase: Math.random() * 6.28, life: 0 };
    if (cfg.mode === "fall") { p.y = initial ? Math.random() * amb.h : -40; p.vy = 0.25 + Math.random() * 0.5; p.vx = (Math.random() - 0.5) * 0.3; }
    else if (cfg.mode === "rise") { p.y = initial ? Math.random() * amb.h : amb.h + 40; p.vy = -(0.25 + Math.random() * 0.45); }
    else if (cfg.mode === "twinkle") { p.y = Math.random() * amb.h; p.vx = (Math.random() - 0.5) * 0.08; p.vy = (Math.random() - 0.5) * 0.08; p.size *= 0.7; }
    else { p.y = Math.random() * amb.h; p.x = initial ? Math.random() * amb.w : -40; p.vx = 0.15 + Math.random() * 0.3; p.vy = (Math.random() - 0.5) * 0.1; }
    return p;
  }
  function ambientLoop(ts) {
    amb.raf = global.requestAnimationFrame(ambientLoop);
    if (ts - amb.last < 33) return; // ~30fps is plenty
    amb.last = ts;
    const c = amb.c2;
    c.setTransform(amb.dpr, 0, 0, amb.dpr, 0, 0);
    c.clearRect(0, 0, amb.w, amb.h);
    c.textAlign = "center"; c.textBaseline = "middle";
    amb.parts.forEach((p, i) => {
      p.life += 1;
      p.x += p.vx + Math.sin((p.life + p.phase * 50) / 60) * 0.25;
      p.y += p.vy;
      p.rot += p.vr;
      let alpha = p.a;
      if (amb.cfg.mode === "twinkle") alpha = p.a * (0.5 + 0.5 * Math.sin(p.life / 25 + p.phase));
      const out = p.y > amb.h + 50 || p.y < -60 || p.x > amb.w + 60 || p.x < -60;
      if (out) amb.parts[i] = spawnAmbient(false);
      c.save();
      c.globalAlpha = alpha;
      c.translate(p.x, p.y); c.rotate(p.rot);
      c.font = p.size + "px serif";
      c.fillStyle = "#ffffff";
      c.fillText(p.e, 0, 0);
      c.restore();
    });
  }
  function setAmbient(cfg) {
    if (!amb.canvas) {
      amb.canvas = document.getElementById("ambient");
      if (!amb.canvas) return;
      amb.c2 = amb.canvas.getContext("2d");
      sizeCanvas(amb.canvas, amb);
      global.addEventListener("resize", () => sizeCanvas(amb.canvas, amb));
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) { global.cancelAnimationFrame(amb.raf); amb.raf = null; }
        else if (!amb.raf && amb.cfg && !reduceMotion) amb.raf = global.requestAnimationFrame(ambientLoop);
      });
    }
    amb.cfg = cfg || { e: ["⭐"], mode: "drift" };
    if (reduceMotion) return;
    const count = amb.w < 600 ? 10 : 18;
    amb.parts = [];
    for (let i = 0; i < count; i++) amb.parts.push(spawnAmbient(true));
    if (!amb.raf) amb.raf = global.requestAnimationFrame(ambientLoop);
  }

  // ====================== BURSTS & CONFETTI ======================
  const fx = { canvas: null, c2: null, parts: [], raf: null, w: 0, h: 0, dpr: 1 };
  function fxInit() {
    if (fx.canvas) return true;
    fx.canvas = document.getElementById("fx-canvas");
    if (!fx.canvas) return false;
    fx.c2 = fx.canvas.getContext("2d");
    sizeCanvas(fx.canvas, fx);
    global.addEventListener("resize", () => sizeCanvas(fx.canvas, fx));
    return true;
  }
  function fxLoop() {
    const c = fx.c2;
    c.setTransform(fx.dpr, 0, 0, fx.dpr, 0, 0);
    c.clearRect(0, 0, fx.w, fx.h);
    fx.parts = fx.parts.filter((p) => p.life < p.max);
    fx.parts.forEach((p) => {
      p.life++;
      p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const k = 1 - p.life / p.max;
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, k * 1.6));
      c.translate(p.x, p.y); c.rotate(p.rot);
      if (p.e) {
        c.font = p.size + "px serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(p.e, 0, 0);
      } else if (p.shape === "star") {
        c.fillStyle = p.color;
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? p.size * 0.45 : p.size;
          c.lineTo(Math.cos((i * Math.PI) / 5) * r, Math.sin((i * Math.PI) / 5) * r);
        }
        c.closePath(); c.fill();
      } else {
        c.fillStyle = p.color;
        c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 + Math.abs(Math.sin(p.life / 6)) * p.size / 2);
      }
      c.restore();
    });
    if (fx.parts.length) fx.raf = global.requestAnimationFrame(fxLoop);
    else { fx.raf = null; c.clearRect(0, 0, fx.w, fx.h); }
  }
  function addParts(list) {
    if (reduceMotion || !fxInit()) return;
    fx.parts.push(...list);
    if (fx.parts.length > 600) fx.parts.splice(0, fx.parts.length - 600);
    if (!fx.raf) fx.raf = global.requestAnimationFrame(fxLoop);
  }
  const COLORS = ["#ff4d8d", "#ffd166", "#06d6a0", "#3b82f6", "#ff7a18", "#7c5cff", "#22d3ee"];
  function burst(x, y, opts) {
    opts = opts || {};
    const n = opts.count || 18;
    const list = [];
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (opts.speed || 4) * (0.4 + Math.random());
      list.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (opts.lift || 1),
        g: opts.gravity == null ? 0.12 : opts.gravity, drag: 0.97, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        size: (opts.size || 7) * (0.6 + Math.random() * 0.8), color: (opts.colors || COLORS)[i % (opts.colors || COLORS).length],
        shape: opts.shape || (Math.random() < 0.4 ? "star" : "rect"), e: opts.emoji ? opts.emoji[i % opts.emoji.length] : null,
        life: 0, max: opts.life || 55 + Math.random() * 25,
      });
    }
    addParts(list);
  }
  function burstAt(elm, opts) {
    if (!elm) return;
    const r = elm.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }
  function confetti(amount) {
    if (!fxInit()) return;
    const n = amount || 160;
    const list = [];
    for (let i = 0; i < n; i++) {
      const fromLeft = i % 2 === 0;
      list.push({
        x: fromLeft ? -10 : fx.w + 10, y: fx.h * (0.55 + Math.random() * 0.35),
        vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 9), vy: -(9 + Math.random() * 9),
        g: 0.22, drag: 0.985, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        size: 8 + Math.random() * 7, color: COLORS[i % COLORS.length], shape: Math.random() < 0.25 ? "star" : "rect",
        life: 0, max: 160 + Math.random() * 60,
      });
    }
    addParts(list);
  }
  function emojiRain(emojis, n) {
    if (!fxInit()) return;
    const list = [];
    for (let i = 0; i < (n || 30); i++) {
      list.push({ x: Math.random() * fx.w, y: -30 - Math.random() * 200, vx: (Math.random() - 0.5) * 1.5, vy: 2 + Math.random() * 3, g: 0.05, drag: 1, rot: 0, vr: (Math.random() - 0.5) * 0.05, size: 24 + Math.random() * 16, e: emojis[i % emojis.length], life: 0, max: 200 });
    }
    addParts(list);
  }

  // ====================== FLOATING TEXT ======================
  function floatText(elm, text, cls) {
    const layer = document.getElementById("float-layer");
    if (!layer || !elm) return;
    const r = elm.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = "float-text " + (cls || "");
    f.textContent = text;
    f.style.left = r.left + r.width / 2 + "px";
    f.style.top = r.top + "px";
    layer.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }

  // ====================== TOASTS ======================
  function toast(icon, title, sub, kind) {
    const box = document.getElementById("toasts");
    if (!box) return;
    const t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.innerHTML = `<span class="toast-icon"></span><span class="toast-body"><strong></strong><small></small></span>`;
    t.querySelector(".toast-icon").textContent = icon;
    t.querySelector("strong").textContent = title;
    t.querySelector("small").textContent = sub || "";
    box.appendChild(t);
    setTimeout(() => t.classList.add("out"), 3400);
    setTimeout(() => t.remove(), 3900);
  }

  // Animate a number counting up inside an element.
  function countUp(elm, to, ms, fmt) {
    if (!elm) return;
    const start = performance.now();
    const from = 0;
    fmt = fmt || ((v) => v.toLocaleString());
    if (reduceMotion) { elm.textContent = fmt(to); return; }
    function step(now) {
      const k = Math.min(1, (now - start) / (ms || 900));
      const eased = 1 - Math.pow(1 - k, 3);
      elm.textContent = fmt(Math.round(from + (to - from) * eased));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  global.FX = { play, setAmbient, burst, burstAt, confetti, emojiRain, floatText, toast, countUp, reduceMotion };
})(window);
