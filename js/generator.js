/*
 * Crossword layout generator.
 *
 * Takes a list of { a: ANSWER, c: clue, t?: themeKey } entries and arranges the
 * words on a grid so they interlock at shared letters.
 *
 * Strategy:
 *   1. Shuffle + pick a working set (longest first tends to interlock best).
 *   2. Place the first word horizontally near the origin.
 *   3. For every other word, scan all placed letters for a matching letter and
 *      try to cross there. Validate that the placement does not collide or
 *      illegally touch other words. Keep the placement with the most crossings
 *      (ties broken toward a compact grid).
 *   4. Run several attempts and return the layout that places the most words.
 *
 * Everything is driven by a seeded RNG, so the same seed always reproduces the
 * exact same puzzle (used for Play Together links, the Daily Challenge, and
 * Adventure stages).
 */

(function (global) {
  "use strict";

  // Hash any string/number into a 32-bit integer (FNV-1a).
  function hashSeed(str) {
    str = String(str);
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // mulberry32: tiny deterministic PRNG, identical across all JS engines.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rng(seed) {
    return (seed === undefined || seed === null) ? Math.random : mulberry32(hashSeed(seed));
  }

  function shuffle(arr, rnd) {
    rnd = rnd || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildAttempt(entries, maxWords) {
    const cells = new Map(); // "r,c" -> { ch }
    const placed = [];
    const used = new Set();
    const key = (r, c) => r + "," + c;
    const getCell = (r, c) => cells.get(key(r, c));
    let minR = 0, maxR = 0, minC = 0, maxC = 0;

    // Returns number of crossings, or -1 if the placement is invalid.
    function canPlace(word, row, col, dir) {
      let crossings = 0;
      const dr = dir === "down" ? 1 : 0;
      const dc = dir === "across" ? 1 : 0;
      if (getCell(row - dr, col - dc)) return -1;
      if (getCell(row + dr * word.length, col + dc * word.length)) return -1;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        const existing = getCell(r, c);
        if (existing) {
          if (existing.ch !== word[i]) return -1;
          crossings++;
        } else if (dir === "across") {
          if (getCell(r - 1, c) || getCell(r + 1, c)) return -1;
        } else if (getCell(r, c - 1) || getCell(r, c + 1)) {
          return -1;
        }
      }
      return crossings;
    }

    function commit(entry, row, col, dir) {
      const word = entry.a;
      const dr = dir === "down" ? 1 : 0;
      const dc = dir === "across" ? 1 : 0;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (!cells.has(key(r, c))) cells.set(key(r, c), { ch: word[i] });
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
      used.add(word);
      placed.push({ answer: word, clue: entry.c, t: entry.t, row, col, dir, len: word.length });
    }

    // Area the grid would have if this placement were committed.
    function areaWith(word, row, col, dir) {
      const endR = dir === "down" ? row + word.length - 1 : row;
      const endC = dir === "across" ? col + word.length - 1 : col;
      const h = Math.max(maxR, endR) - Math.min(minR, row) + 1;
      const w = Math.max(maxC, endC) - Math.min(minC, col) + 1;
      return h * w + Math.abs(h - w) * 3;
    }

    entries.forEach((entry, idx) => {
      if (placed.length >= maxWords) return;
      const word = entry.a;
      if (used.has(word)) return;
      if (idx === 0) { commit(entry, 0, 0, "across"); return; }

      let best = null;
      for (let li = 0; li < word.length; li++) {
        const letter = word[li];
        for (const [k, cell] of cells) {
          if (cell.ch !== letter) continue;
          const [cr, cc] = k.split(",").map(Number);
          const options = [
            { row: cr - li, col: cc, dir: "down" },
            { row: cr, col: cc - li, dir: "across" },
          ];
          for (const o of options) {
            const cross = canPlace(word, o.row, o.col, o.dir);
            if (cross <= 0) continue;
            const score = cross * 1000 - areaWith(word, o.row, o.col, o.dir);
            if (!best || score > best.score) best = { ...o, score };
          }
        }
      }
      if (best) commit(entry, best.row, best.col, best.dir);
    });

    return placed;
  }

  function normalize(placed) {
    let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
    placed.forEach((p) => {
      const endR = p.row + (p.dir === "down" ? p.len - 1 : 0);
      const endC = p.col + (p.dir === "across" ? p.len - 1 : 0);
      minR = Math.min(minR, p.row); minC = Math.min(minC, p.col);
      maxR = Math.max(maxR, endR); maxC = Math.max(maxC, endC);
    });
    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;
    const shifted = placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }));

    const grid = [];
    for (let r = 0; r < rows; r++) grid.push(new Array(cols).fill(null));
    shifted.forEach((p) => {
      for (let i = 0; i < p.len; i++) {
        grid[p.row + (p.dir === "down" ? i : 0)][p.col + (p.dir === "across" ? i : 0)] = p.answer[i];
      }
    });

    // Number clue starts in reading order like real puzzles.
    const starts = Array.from(new Set(shifted.map((p) => p.row + "," + p.col)))
      .map((k) => k.split(",").map(Number))
      .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
    const numberAt = {};
    starts.forEach(([r, c], i) => { numberAt[r + "," + c] = i + 1; });

    const clues = shifted.map((p) => ({
      number: numberAt[p.row + "," + p.col],
      answer: p.answer, clue: p.clue, t: p.t,
      row: p.row, col: p.col, dir: p.dir, len: p.len,
    }));
    clues.sort((a, b) => (a.number - b.number) || (a.dir === "across" ? -1 : 1));
    return { rows, cols, grid, numberAt, clues };
  }

  // Generate the best layout from a pool of entries.
  function generate(pool, wantCount, seed) {
    const rnd = rng(seed);
    let best = null;
    const attempts = wantCount >= 12 ? 60 : 45;
    const cap = wantCount >= 12 ? 15 : wantCount >= 10 ? 13 : wantCount >= 9 ? 12 : 11;
    for (let t = 0; t < attempts; t++) {
      const working = shuffle(pool, rnd)
        .slice(0, Math.min(pool.length, wantCount + 7))
        .sort((a, b) => b.a.length - a.a.length);
      const placed = buildAttempt(working, wantCount);
      if (placed.length < 2) continue;
      const layout = normalize(placed);
      const longest = Math.max(layout.rows, layout.cols);
      const area = layout.rows * layout.cols;
      // Maximize words placed, then prefer compact grids that fit on phones.
      const score = placed.length * 1000 - area - longest * 25 - Math.max(0, longest - cap) * 150;
      if (!best || score > best.score) best = { score, layout };
      if (placed.length >= wantCount && longest <= cap) break;
    }
    return best ? best.layout : null;
  }

  const api = { generate, rng, shuffle, hashSeed };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.CrosswordGen = api;
})(typeof window !== "undefined" ? window : globalThis);
