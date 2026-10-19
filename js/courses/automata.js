const r = String.raw;

// elementary cellular automaton from a single live cell
const caCache = new Map();
function ca(rule, width = 63, rows = 31) {
  if (caCache.has(rule)) return caCache.get(rule);
  let row = new Array(width).fill(0);
  row[Math.floor(width / 2)] = 1;
  const out = [row];
  for (let t = 1; t < rows; t++) {
    const next = row.map((_, i) => {
      const l = row[(i - 1 + width) % width], c = row[i], rr = row[(i + 1) % width];
      return (rule >> ((l << 2) | (c << 1) | rr)) & 1;
    });
    out.push(next);
    row = next;
  }
  caCache.set(rule, out);
  return out;
}
const caExtra = ({ plot, p, s }) => {
  const g = ca(p.rule), els = [];
  const w = plot.X(1) - plot.X(0), hgt = plot.Y(0) - plot.Y(1);
  g.forEach((row, t) => row.forEach((v, i) => { if (v) els.push(s('rect', { x: plot.X(i), y: plot.Y(31 - t), width: w + 0.4, height: hgt + 0.4, class: 'fl-ink' })); }));
  return els;
};
const ruleBits = (rule) => [7, 6, 5, 4, 3, 2, 1, 0].map((k) => `${k.toString(2).padStart(3, '0').replace(/0/g, '□').replace(/1/g, '■')}→${(rule >> k) & 1 ? '■' : '□'}`).join('  ');

// Game of Life on a 22 × 16 wrapping board
const LW = 22, LH = 16;
const LIFE = (() => {
  let g = Array.from({ length: LH }, () => new Array(LW).fill(0));
  const put = (cells) => cells.forEach(([x, y]) => (g[y][x] = 1));
  put([[2, 1], [3, 2], [1, 3], [2, 3], [3, 3]]); // glider
  put([[15, 3], [16, 3], [17, 3]]); // blinker
  put([[16, 11], [17, 11], [16, 12], [17, 12]]); // block
  const states = [g];
  for (let t = 0; t < 40; t++) {
    g = g.map((row, y) => row.map((v, x) => {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += g[(y + dy + LH) % LH][(x + dx + LW) % LW];
      return n === 3 || (v && n === 2) ? 1 : 0;
    }));
    states.push(g);
  }
  return states;
})();

// Rule 184 traffic on a ring road of 60 cells, random start with density rho (seeded)
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ROAD = 60, TROWS = 30;
const trafficCache = new Map();
function traffic(rho) {
  const key = rho.toFixed(2);
  if (trafficCache.has(key)) return trafficCache.get(key);
  const u = seeded(Math.round(rho * 100) + 7);
  const n = Math.round(rho * ROAD), idx = Array.from({ length: ROAD }, (_, i) => i);
  for (let i = ROAD - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  let row = new Array(ROAD).fill(0);
  idx.slice(0, n).forEach((i) => (row[i] = 1));
  const rows = [row];
  let moves = 0;
  for (let t = 1; t < TROWS; t++) {
    const next = row.map((v, i) => {
      const l = row[(i - 1 + ROAD) % ROAD], rr = row[(i + 1) % ROAD];
      return (184 >> ((l << 2) | (v << 1) | rr)) & 1;
    });
    if (t > TROWS / 2) moves += row.filter((v, i) => v && !row[(i + 1) % ROAD]).length;
    rows.push(next);
    row = next;
  }
  const out = { rows, flow: moves / ((TROWS - 1 - TROWS / 2) * ROAD) };
  trafficCache.set(key, out);
  return out;
}
// Langton's ant: black cells after n steps
const antCache = { n: 0, black: new Set(), x: 0, y: 0, dir: 0 };
function ant(n) {
  if (n < antCache.n) Object.assign(antCache, { n: 0, black: new Set(), x: 0, y: 0, dir: 0 });
  const D = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  while (antCache.n < n) {
    const k = `${antCache.x},${antCache.y}`;
    if (antCache.black.has(k)) { antCache.dir = (antCache.dir + 3) % 4; antCache.black.delete(k); }
    else { antCache.dir = (antCache.dir + 1) % 4; antCache.black.add(k); }
    antCache.x += D[antCache.dir][0]; antCache.y += D[antCache.dir][1];
    antCache.n++;
  }
  return antCache;
}

// Abelian sandpile on an SN × SN grid; grains dropped one at a time on the centre (cells with 4+ grains topple)
const SN = 51;
const sandCache = [{ g: new Uint8Array(SN * SN), topples: 0, lost: 0 }];
function sandpile(n) {
  const k = Math.round(n / 50);
  while (sandCache.length <= k) {
    const prev = sandCache[sandCache.length - 1], g = prev.g.slice();
    let topples = prev.topples, lost = prev.lost;
    const c = ((SN - 1) / 2) * SN + (SN - 1) / 2;
    for (let i = 0; i < 50; i++) {
      g[c]++;
      const stack = g[c] >= 4 ? [c] : [];
      while (stack.length) {
        const j = stack.pop();
        if (g[j] < 4) continue;
        const q = g[j] >> 2;
        g[j] -= 4 * q; topples += q;
        const x = j % SN, y = (j / SN) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= SN || Y >= SN) { lost += q; continue; }
          const m = Y * SN + X; g[m] += q; if (g[m] >= 4) stack.push(m);
        }
      }
    }
    sandCache.push({ g, topples, lost });
  }
  return sandCache[k];
}
// avalanche sizes: 4000 random drops on a 25 × 25 pile that starts full (3 grains everywhere) and has settled with 2000 warm-up drops
const AVAL = (() => {
  const N = 25, g = new Uint8Array(N * N).fill(3);
  let a = 2024; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const drop = () => {
    const c = (u() * N * N) | 0; g[c]++; let size = 0; const st = g[c] >= 4 ? [c] : [];
    while (st.length) { const j = st.pop(); if (g[j] < 4) continue; g[j] -= 4; size++; if (g[j] >= 4) st.push(j); const x = j % N, y = (j / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const m = Y * N + X; g[m]++; if (g[m] >= 4) st.push(m); } }
    return size;
  };
  for (let i = 0; i < 2000; i++) drop();
  const sizes = []; for (let i = 0; i < 4000; i++) sizes.push(drop());
  return sizes;
})();
// Schelling model on a 30 × 30 wrapping grid: 0 empty, 1 and 2 two groups; an agent is unhappy if under a fraction t of its neighbours match it
const SCH = 30;
const schCache = new Map();
function schelling(t) {
  t = Math.round(t * 100) / 100;
  const key = t.toFixed(2);
  if (schCache.has(key)) return schCache.get(key);
  let a = 77; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const g = new Uint8Array(SCH * SCH);
  for (let i = 0; i < g.length; i++) { const r = u(); g[i] = r < 0.1 ? 0 : r < 0.55 ? 1 : 2; }
  const nb = (i) => { const x = i % SCH, y = (i / SCH) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) out.push(((y + dy + SCH) % SCH) * SCH + ((x + dx + SCH) % SCH)); return out; };
  const NB = Array.from({ length: g.length }, (_, i) => nb(i));
  const stats = (g) => { let sim = 0, cnt = 0, unhappy = 0; for (let i = 0; i < g.length; i++) { if (!g[i]) continue; let same = 0, occ = 0; for (const j of NB[i]) if (g[j]) { occ++; if (g[j] === g[i]) same++; } if (occ) { sim += same / occ; cnt++; if (same / occ < t) unhappy++; } } return { sim: sim / cnt, unhappy }; };
  const frames = [{ g: g.slice(), ...stats(g) }];
  for (let r = 0; r < 30; r++) {
    const movers = [];
    for (let i = 0; i < g.length; i++) { if (!g[i]) continue; let same = 0, occ = 0; for (const j of NB[i]) if (g[j]) { occ++; if (g[j] === g[i]) same++; } if (occ && same / occ < t) movers.push(i); }
    for (let k = movers.length - 1; k > 0; k--) { const j = (u() * (k + 1)) | 0; [movers[k], movers[j]] = [movers[j], movers[k]]; }
    for (const i of movers) { const empties = []; for (let j = 0; j < g.length; j++) if (!g[j]) empties.push(j); const e = empties[(u() * empties.length) | 0]; g[e] = g[i]; g[i] = 0; }
    frames.push({ g: g.slice(), ...stats(g) });
  }
  schCache.set(key, frames);
  return frames;
}

// Bill Gosper's glider gun (1970), run on a large hidden board so gliders never hit an edge
const GUN = [[1, 5], [1, 6], [2, 5], [2, 6], [11, 5], [11, 6], [11, 7], [12, 4], [12, 8], [13, 3], [13, 9], [14, 3], [14, 9], [15, 6], [16, 4], [16, 8], [17, 5], [17, 6], [17, 7], [18, 6], [21, 3], [21, 4], [21, 5], [22, 3], [22, 4], [22, 5], [23, 2], [23, 6], [25, 1], [25, 2], [25, 6], [25, 7], [35, 3], [35, 4], [36, 3], [36, 4]];
let GUN_GENS = null;
const gunGens = () => GUN_GENS || (GUN_GENS = (() => {
  const W = 90, H = 70, out = [];
  let g = new Uint8Array(W * H);
  for (const [x, y] of GUN) g[(y + 1) * W + x + 1] = 1;
  for (let t = 0; t <= 150; t++) {
    out.push(g);
    const n = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) c += g[(y + dy) * W + x + dx];
      n[y * W + x] = c === 3 || (g[y * W + x] && c === 2) ? 1 : 0;
    }
    g = n;
  }
  return out;
})());

export default {
  id: 'automata',
  subject: 'math',
  title: 'Cellular Automata',
  level: 'Intermediate',
  cover: 'automata',
  tagline: 'Simple rules, complex behaviour: Rule 30, the Game of Life, traffic jams and Langton’s ant.',
  description: r`A row of cells, each on or off, updating by a tiny rule. What could be simpler? Yet such systems produce fractals, chaos, moving creatures and even full-blown computers. Explore Stephen Wolfram's elementary rules and John Conway's Game of Life, model traffic jams with Rule 184, and follow Langton's ant from chaos to order, then watch a sandpile organise itself to the brink of avalanches and see how mild preferences can segregate a whole city.`,
  prereq: 'Binary & Information',
  chapters: [
    {
      title: 'One Dimension',
      summary: 'Rows of cells.',
      lessons: [
        {
          id: 'elementary',
          title: 'Elementary Rules',
          summary: '256 tiny universes',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'The setup',
              body: r`Take a row of cells, each black (1) or white (0). At each time step, every cell looks at itself and its two neighbours, three cells in all, and a **rule** says whether it will be black or white in the next row.

Three cells have $2^3 = 8$ possible patterns, and the rule gives an output for each one. Writing the 8 outputs as a binary number gives the rule's name: Rule 0 to Rule 255.`,
            },
            {
              type: 'numeric',
              title: 'Counting rules',
              prompt: r`Each of the 8 neighbourhood patterns can map to black or white. How many different rules are there?`,
              answer: 256,
              wrong: [{ v: 16, why: r`Each of the 8 patterns has 2 choices: $2^8$, not $2 \times 8$.` }, { v: 8, why: 'That’s the number of patterns. Each pattern can have either output.' }],
              explain: r`$2^8 = 256$ rules, which is why they're numbered 0 to 255. Stephen Wolfram studied all of them systematically in the 1980s.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Name a rule',
              prompt: r`Rule 30 turns a cell black for these neighbourhoods: 100, 011, 010 and 001 (and white for the rest). Set the output bits under each neighbourhood. What number does the row of outputs spell?`,
              widget: {
                kind: 'bits', n: 8, value: 0, places: false,
                labels: ['111', '110', '101', '100', '011', '010', '001', '000'],
                readout: (v) => `outputs read as a binary number: **${v}**`,
                goal: (v) => v === 30,
                hint: 'Switch on the bits under 100, 011, 010 and 001.',
                solution: 30,
              },
              explain: r`The outputs read $00011110_2 = 16 + 8 + 4 + 2 = 30$. That's where the name comes from: list the neighbourhoods from 111 down to 000, and the outputs form the rule number in binary.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch them grow',
              body: r`Each picture starts from a single black cell at the top, with time running down the page. Try Rule 90, Rule 30, Rule 110 and Rule 184.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 63, ymin: 0, ymax: 31, grid: false, axes: false, maxWidth: 620, pad: 8,
                params: { rule: { min: 0, max: 255, step: 1, value: 90, label: 'rule', color: 'violet', format: (v) => `${v}` } },
                extra: caExtra,
                readout: (p) => `Rule ${p.rule}: ${ruleBits(p.rule)}`,
              },
              after: r`Rule 90 draws a perfect **Sierpiński triangle**, a fractal. Rule 30 looks random. Rule 110 builds intricate interacting structures. Many rules just die out or repeat. Simple rules can produce wildly different behaviours.`,
            },
            {
              type: 'numeric',
              title: 'A shifting rule',
              prompt: r`Which rule number makes every cell simply copy its **left** neighbour (so patterns slide right)? Neighbourhoods are ordered 111, 110, 101, 100, 011, 010, 001, 000.`,
              answer: 240,
              explain: r`The new cell equals the left bit: $1, 1, 1, 1, 0, 0, 0, 0$, which is $11110000_2 = 240$. Rule 170 copies the right neighbour instead.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Rule 90',
              prompt: r`In Rule 90, a cell becomes black exactly when **one** (but not both) of its two neighbours was black. Which arithmetic does that match?`,
              choices: [
                { t: 'Adding the two neighbours mod 2 (XOR), which builds Pascal’s triangle mod 2', ok: true },
                { t: 'Multiplying the neighbours', why: 'Multiplying gives 1 only when both are 1. Rule 90 needs exactly one.' },
                { t: 'Counting all three cells', why: 'Rule 90 ignores the centre cell completely.' },
              ],
              explain: r`Each new cell is the XOR of its neighbours: addition mod 2. That's exactly how Pascal's triangle is built, but keeping only odd versus even. Colour the odd entries of Pascal's triangle and you get the Sierpiński triangle.`,
            },
          ],
          recap: [
            'An elementary cellular automaton updates each cell from its 3-cell neighbourhood.',
            'There are 256 rules, numbered by their binary output table.',
            'Rule 90 makes the Sierpiński triangle, using addition mod 2.',
          ],
        },
        {
          id: 'rule30',
          title: 'Chaos from Order',
          summary: 'Rule 30 and Rule 110',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              title: 'Randomness from a rule',
              prompt: r`The centre column of Rule 30 looks so random that it was used as a random number generator in the software Mathematica. Is it truly random?`,
              choices: [
                { t: 'No: it’s completely determined by the rule, but it passes many statistical tests for randomness', ok: true },
                { t: 'Yes: the rule contains randomness', why: 'The rule is fixed and deterministic: run it again and you get exactly the same pattern.' },
                { t: 'No: it repeats with a short period', why: 'No short repetition has ever been found in the centre column.' },
              ],
              explain: r`Rule 30 is perfectly **deterministic**, yet its output looks patternless. Like chaos in physics, simple deterministic rules can produce behaviour that's practically unpredictable without running every step. Whether its centre column ever becomes periodic is still an open question.`,
            },
            {
              type: 'mcq',
              title: 'A one-dimensional computer',
              prompt: r`In 2004, Matthew Cook published a proof about Rule 110. What did he show?`,
              choices: [
                { t: 'It is Turing complete: with the right starting row, it can carry out any computation', ok: true },
                { t: 'It always dies out', why: 'Rule 110 is known for long-lived, interacting structures, not for dying out.' },
                { t: 'It is identical to Rule 30', why: 'They’re different rules with very different behaviour.' },
              ],
              explain: r`Rule 110's moving structures can be arranged to act like signals and logic gates, so this tiny rule can, in principle, compute anything a computer can (very slowly). Universal computation can emerge from astonishingly simple ingredients.`,
            },
            {
              type: 'numeric',
              title: 'Growing triangle',
              prompt: r`Starting from a single black cell, Rule 30's pattern spreads by one cell to each side per step. How wide is it after 100 steps?`,
              unit: 'cells',
              answer: 201,
              wrong: [{ v: 200, why: 'Don’t forget the original centre cell: 1 + 2 × 100.' }, { v: 101, why: 'It spreads to **both** sides each step.' }],
              explain: r`$1 + 2 \times 100 = 201$ cells. Information can travel at most one cell per step (the "speed of light" of the automaton), so no rule can spread faster.`,
            },
            {
              type: 'mcq',
              title: 'Four classes',
              prompt: r`Wolfram sorted the behaviours of cellular automata into four classes: dying out or uniform (1), simple repetition (2), chaos (3), and complex localised structures (4). Which rules fit classes 3 and 4?`,
              choices: [
                { t: 'Rule 30 is class 3 (chaotic); Rule 110 is class 4 (complex structures)', ok: true },
                { t: 'Both are class 1', why: 'Neither dies out: both keep producing new patterns.' },
                { t: 'Rule 90 is class 4', why: 'Rule 90 is a regular fractal, usually grouped with the simpler (or chaotic, depending on the start) rules.' },
              ],
              explain: r`Class 4, "the edge of chaos", sits between order and randomness, and that's where computation tends to live: Rule 110's gliders can carry and process information.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Coin flips from a rule',
              body: r`Rule 30, started from a single black cell. The highlighted centre column has been used as a source of random bits. Grow more generations and check the balance of 0s and 1s.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 161, ymin: -80, ymax: 0, grid: false, axes: false, maxWidth: 600, height: 300,
                params: { g: { min: 10, max: 80, step: 1, value: 40, label: 'generations', color: 'violet' } },
                extra: ({ plot, p, s }) => { const W = 161; let row = new Uint8Array(W); row[80] = 1; let d = '', c = ''; const cw = plot.X(1) - plot.X(0), ch = plot.Y(-1) - plot.Y(0); for (let g = 0; g < p.g; g++) { for (let i = 0; i < W; i++) if (row[i]) { const seg = `M${plot.X(i).toFixed(1)} ${plot.Y(-g).toFixed(1)}h${cw.toFixed(2)}v${ch.toFixed(2)}h${(-cw).toFixed(2)}Z`; if (i === 80) c += seg; else d += seg; } const nx = new Uint8Array(W); for (let i = 0; i < W; i++) { const k = ((i > 0 ? row[i - 1] : 0) << 2) | (row[i] << 1) | (i < W - 1 ? row[i + 1] : 0); nx[i] = (30 >> k) & 1; } row = nx; } return [s('rect', { x: plot.X(80), y: plot.Y(0), width: cw, height: plot.Y(-p.g) - plot.Y(0), class: 'fl-amber-soft' }), s('path', { d, class: 'fl-violet', opacity: 0.75 }), s('path', { d: c, class: 'fl-coral' })]; },
                readout: (p) => { const W = 161; let row = new Uint8Array(W); row[80] = 1; let bits = ''; for (let g = 0; g < p.g; g++) { bits += row[80]; const nx = new Uint8Array(W); for (let i = 0; i < W; i++) { const k = ((i > 0 ? row[i - 1] : 0) << 2) | (row[i] << 1) | (i < W - 1 ? row[i + 1] : 0); nx[i] = (30 >> k) & 1; } row = nx; } const ones = [...bits].filter((b) => b === '1').length; return `centre column: ${bits.slice(0, 24)}${bits.length > 24 ? '…' : ''} · **${ones} ones, ${p.g - ones} zeros**`; },
              },
              after: r`The left side of the pattern is regular, but the centre column passes statistical tests for randomness, which is why Mathematica used it as a random number generator for years. Yet it is completely determined by an 8-bit rule: "random-looking" and "unpredictable without running it" are not the same as truly random.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Seashells',
              prompt: r`The cone snail *Conus textile* has shell patterns strikingly like Rule 30's triangles. Why might that be?`,
              choices: [
                { t: 'The shell grows one edge at a time, and pigment cells along the edge switch on or off depending on their neighbours, like a 1D automaton', ok: true },
                { t: 'The snail copies the pattern from its parents', why: 'The patterns are generated during growth, not copied.' },
                { t: 'It’s a coincidence with no mechanism', why: 'Biologists model these patterns with local activation and inhibition along the growing edge.' },
              ],
              explain: r`The growing lip of the shell is a row of cells; each new row of pigment depends on the previous row nearby, so the shell records the automaton's history, just like our pictures with time running down the page.`,
            },
          ],
          recap: [
            'Rule 30 is deterministic but looks random.',
            'Rule 110 is Turing complete: it can perform any computation.',
            'Complexity can emerge from the simplest rules.',
          ],
        },
      ],
    },
    {
      title: 'The Game of Life',
      summary: 'Two dimensions and emergent creatures.',
      lessons: [
        {
          id: 'life',
          title: 'Conway’s Game of Life',
          summary: 'Birth, survival and gliders',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Three simple rules',
              body: r`In 1970, the mathematician John Conway invented a cellular automaton on a square grid. Each cell is alive or dead and looks at its 8 neighbours:
- **Birth:** a dead cell with exactly **3** live neighbours comes alive.
- **Survival:** a live cell with **2 or 3** live neighbours stays alive.
- **Death:** every other live cell dies (of loneliness or overcrowding).`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Step through time',
              body: r`This board starts with three famous patterns: a **glider** (top left), a **blinker** (top right) and a **block** (bottom right). The board wraps around at the edges. Step through the generations.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: LW, ymin: 0, ymax: LH, grid: false, axes: false, maxWidth: 560, pad: 8,
                params: { t: { min: 0, max: 40, step: 1, value: 0, label: 'generation', color: 'teal', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('rect', { x: plot.X(0), y: plot.Y(LH), width: plot.X(LW) - plot.X(0), height: plot.Y(0) - plot.Y(LH), class: 'fl-surface', stroke: 'var(--line-2)' })];
                  const w = plot.X(1) - plot.X(0);
                  LIFE[p.t].forEach((row, y) => row.forEach((v, x) => { if (v) els.push(s('rect', { x: plot.X(x) + 1, y: plot.Y(LH - y) + 1, width: w - 2, height: w - 2, rx: 3, class: 'fl-teal' })); }));
                  return els;
                },
                readout: (p) => `generation ${p.t}: ${LIFE[p.t].flat().reduce((a, b) => a + b, 0)} live cells`,
              },
              after: r`The **block** never changes (a "still life"). The **blinker** flips between horizontal and vertical forever. And the **glider** walks diagonally across the board, shifting one cell every 4 generations. Nobody programmed "movement": it emerges from the rules.`,
            },
            {
              type: 'numeric',
              title: 'Blinker',
              prompt: r`The blinker is three live cells in a row. Apply the rules: how many generations does it take to return to its original shape?`,
              unit: 'generations',
              answer: 2,
              wrong: [{ v: 1, why: 'After one generation it’s vertical, not horizontal. One more step flips it back.' }, { v: 4, why: 'That’s the glider’s period. The blinker is simpler.' }],
              explain: r`The middle cell has 2 neighbours (survives), the end cells have 1 (die), and the cells above and below the middle have 3 (born). So the row becomes a column, and then back again: **period 2**.`,
            },
            {
              type: 'numeric',
              title: 'Overcrowding',
              prompt: r`A live cell has 4 live neighbours. How many live neighbours would it need to survive? Give the smallest number.`,
              answer: 2,
              wrong: [{ v: 4, why: 'With 4 neighbours it dies of overcrowding. Survival needs 2 or 3.' }],
              explain: r`Survival needs 2 or 3 live neighbours; 4 or more kills it, as does 0 or 1.`,
            },
            {
              type: 'numeric',
              title: 'Glider speed',
              prompt: r`A glider moves one cell diagonally every 4 generations. How many cells has it travelled (diagonally) after 40 generations?`,
              unit: 'cells',
              answer: 10,
              wrong: [{ v: 40, why: 'It moves only once every 4 generations.' }, { v: 160, why: 'Divide by 4, don’t multiply.' }],
              explain: r`$40 \div 4 = 10$ cells. Life enthusiasts call this speed $c/4$, where $c$ (one cell per generation) is the fastest anything can move in Life.`,
            },
            {
              type: 'mcq',
              title: 'Computers in Life',
              prompt: r`In 1970, Bill Gosper found the "glider gun", a pattern that fires a new glider every 30 generations. Why was this so important?`,
              choices: [
                { t: 'It showed patterns can grow forever, and streams of gliders can act as signals for building logic gates, so Life can compute', ok: true },
                { t: 'It proved Life always dies out', why: 'The opposite: a gun keeps producing gliders forever, so the population grows without limit.' },
                { t: 'It was the first pattern that never changes', why: 'Still lifes like the block were known from the start.' },
              ],
              explain: r`Conway had offered a prize for a pattern that grows without limit, and the gun won it. Glider streams can carry information, and colliding streams act like logic gates. It's now known that the Game of Life is **Turing complete**: people have built working computers, and even a simulation of the Game of Life, inside it.`,
            },
            { /*anim:automata*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The glider gun',
              body: r`Here is Gosper's glider gun. Two "shuttles" bounce back and forth between two still blocks, and every time they collide, a new glider is born and flies off to the lower right.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 48, ymin: 0, ymax: 34, grid: false, axes: false, pad: 4,
                animate: { param: 't', speed: 8, max: 151, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const k = Math.min(150, Math.floor(p.t)), g = gunGens()[k], W = 90, w = plot.X(1) - plot.X(0);
                  let d = '';
                  for (let y = 0; y < 34; y++) for (let x = 0; x < 48; x++) if (g[y * W + x]) d += `M${plot.X(x).toFixed(1)} ${plot.Y(34 - y).toFixed(1)}h${(w - 1).toFixed(1)}v${(w - 1).toFixed(1)}h${(1 - w).toFixed(1)}z`;
                  return [s('rect', { x: plot.X(0), y: plot.Y(34), width: plot.X(48) - plot.X(0), height: plot.Y(0) - plot.Y(34), class: 'fl-surface' }), s('path', { d, class: 'fl-ink' })];
                },
                readout: (p) => { const k = Math.min(150, Math.floor(p.t)); return `generation ${k} · gliders fired: ${Math.floor(k / 30)}`; },
              },
              after: r`The gun repeats itself every 30 generations, adding one more glider each time, so the number of live cells grows forever: this settled Conway's question of whether any pattern could grow without limit. Streams of gliders can act as signals, and where streams cross they can act like logic gates. That's the first step towards building a whole computer inside the Game of Life.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Unpredictable',
              prompt: r`Can you write a program that looks at any Life pattern and decides whether it will eventually die out completely?`,
              choices: [
                { t: 'No: since Life can simulate any computer, this would solve the halting problem, which is impossible', ok: true },
                { t: 'Yes: just run it until it dies', why: 'If it never dies, you would wait forever without knowing whether it might still die later.' },
                { t: 'Yes, because the rules are simple', why: 'Simple rules can still produce undecidable behaviour.' },
              ],
              explain: r`Because Life is Turing complete, questions about its long-term future are **undecidable** in general: there's no shortcut better than watching, and sometimes watching never ends. The Computability course explains why.`,
            },
          ],
          recap: [
            'Life: birth with exactly 3 neighbours, survival with 2 or 3.',
            'Still lifes, oscillators and gliders emerge from these rules.',
            'Glider guns make Life Turing complete.',
          ],
        },
      ],
    },
    {
      title: 'Automata in the World',
      summary: 'Traffic jams and a wandering ant.',
      lessons: [
        {
          id: 'traffic',
          title: 'Traffic Jams',
          summary: 'Rule 184 and the flow of cars',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Cars as cells',
              body: r`Treat a road as a row of cells, each holding a car (1) or empty (0). Every step, each car moves forward one cell **if the cell ahead is empty**; otherwise it waits. This is exactly elementary **Rule 184**.

Every car obeys the same simple rule, yet jams form, move and dissolve.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch the jams',
              body: r`Each row is the road at one moment, with time running down the page (a ring road, so cars leaving the right reappear on the left). Change how crowded the road is.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: ROAD, ymin: 0, ymax: TROWS, grid: false, axes: false, maxWidth: 620, pad: 8,
                params: { rho: { min: 0.1, max: 0.9, step: 0.1, value: 0.3, label: 'density', color: 'coral', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => {
                  const g = traffic(p.rho).rows, els = [], w = plot.X(1) - plot.X(0);
                  g.forEach((row, t) => row.forEach((v, i) => { if (v) els.push(s('rect', { x: plot.X(i), y: plot.Y(TROWS - t), width: w, height: w, class: 'fl-coral' })); }));
                  return els;
                },
                readout: (p) => `density ${Math.round(p.rho * 100)}%: measured flow ${traffic(p.rho).flow.toFixed(2)} cars per cell per step`,
              },
              after: r`At low density, cars soon spread out and all move every step (diagonal streaks). Above 50%, jams appear as solid blocks that drift **backwards**, against the traffic, just like real stop-and-go waves on motorways.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Maximum flow',
              prompt: r`In the long run, Rule 184 traffic has flow $\min(\rho, 1 - \rho)$ cars passing a point per step, where $\rho$ is the density. Find the density that carries the **most** traffic.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 0.6, grid: 0.1, gridY: 0.1, height: 260, axes: { xlabel: 'density ρ', ylabel: 'flow', xfmt: (v) => v.toFixed(1) },
                params: { r: { min: 0, max: 1, step: 0.05, value: 0.2, slider: false } },
                curves: [{ f: (x) => Math.min(x, 1 - x), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.r, y: (p) => Math.min(p.r, 1 - p.r), drag: { x: 'r' }, color: 'coral' }],
                readout: (p) => r`$\rho = ${p.r.toFixed(2)}$: flow $= ${Math.min(p.r, 1 - p.r).toFixed(2)}$ ${p.r > 0.5 ? '(jammed: adding cars reduces flow)' : '(free flow)'}`,
                goal: (p) => Math.abs(p.r - 0.5) < 1e-9,
                hint: 'Below the peak, every car moves; above it, empty space is the bottleneck.',
                solution: { r: 0.5 },
              },
              explain: r`Flow peaks at $\rho = 0.5$. Below it, every car moves each step (flow = density). Above it, cars must wait for gaps, and the gaps move backwards, so flow = the density of **empty** cells. This "fundamental diagram" of traffic, rising then falling, matches real motorway data.`,
            },
            {
              type: 'mcq',
              title: 'Jams from nowhere',
              prompt: r`In a 2008 Japanese experiment, 22 cars drove round a circular track at steady speed, with no obstacles. What happened?`,
              choices: [
                { t: 'A stop-and-go jam formed spontaneously and travelled backwards around the track', ok: true },
                { t: 'They all kept moving smoothly forever', why: 'Small fluctuations in drivers’ speed grew into a jam.' },
                { t: 'They crashed', why: 'No crashes: just a "phantom jam" with no cause other than the drivers themselves.' },
              ],
              explain: r`Once the density is high enough, tiny variations amplify: one driver brakes slightly, the next brakes a bit more, and a jam wave forms. Variable speed limits on motorways try to smooth traffic before this happens.`,
            },
            {
              type: 'numeric',
              title: 'Light traffic',
              prompt: r`A ring road in the Rule 184 model has 100 cells and only 40 cars. In the long run, how many cars move forward each step?`,
              unit: 'cars',
              answer: 40,
              wrong: [{ v: 60, why: r`That's the number of empty cells. Below half density, the flow is set by the cars, not the gaps.` }],
              explain: r`Density 0.4 is below one half, so the flow is $\min(0.4, 0.6) = 0.4$ per cell: $0.4 \times 100 = 40$. After a short while every car has an empty cell in front of it, so **all 40** move every step and no jams survive.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A busy road',
              prompt: r`A ring road in the Rule 184 model has 100 cells and 70 cars. In the long run, how many cars move forward each step?`,
              unit: 'cars',
              answer: 30,
              wrong: [{ v: 70, why: 'Not all cars can move: each needs an empty cell ahead.' }, { v: 50, why: 'Flow = min(ρ, 1 − ρ) per cell: with 30 empty cells, at most 30 cars can move.' }],
              explain: r`Density 0.7 means flow $1 - 0.7 = 0.3$ per cell, so $0.3 \times 100 = 30$ cars move per step, one into each empty cell. The 30 gaps flow backwards through the traffic.`,
            },
          ],
          recap: [
            'Rule 184: a car moves if the cell ahead is empty.',
            r`Long-run flow is $\min(\rho, 1 - \rho)$, peaking at half density.`,
            'Above the peak, jams form and travel backwards.',
          ],
        },
        {
          id: 'ant',
          title: 'Langton’s Ant',
          summary: 'Chaos, then a highway',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'An ant with two rules',
              body: r`An ant sits on an infinite grid of white squares. Each step:
- On a **white** square: turn 90° **right**, paint the square black, move forward one square.
- On a **black** square: turn 90° **left**, paint it white, move forward one square.

Chris Langton invented this in 1986. What does the ant do over thousands of steps?`,
            },
            {
              type: 'numeric',
              title: 'The first few steps',
              prompt: r`The ant starts on a white grid. For its first 4 steps, it's always on a white square, so it turns right each time. After 4 steps, how many black squares are there?`,
              answer: 4,
              wrong: [{ v: 0, why: 'Each white square it leaves is painted black.' }],
              explain: r`Four right turns make it walk round a small square, blackening 4 cells. On step 5 it arrives back on its first (now black) square and turns left: the pattern starts to get complicated.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch it wander',
              body: r`Move through the ant's first 11,000 steps.`,
              widget: {
                kind: 'graph', equal: true, xmin: -45, xmax: 45, ymin: -45, ymax: 45, grid: false, axes: false, maxWidth: 480, pad: 8,
                params: { n: { min: 0, max: 11000, step: 100, value: 500, label: 'steps', color: 'violet', format: (v) => v.toLocaleString('en-GB') } },
                extra: ({ plot, p, s }) => {
                  const A = ant(p.n), w = plot.X(1) - plot.X(0), els = [s('rect', { x: plot.X(-45), y: plot.Y(45), width: plot.X(45) - plot.X(-45), height: plot.Y(-45) - plot.Y(45), class: 'fl-surface' })];
                  let d = '';
                  for (const k of A.black) { const [x, y] = k.split(',').map(Number); if (Math.abs(x) < 45 && Math.abs(y) < 45) d += `M${(plot.X(x) - w / 2).toFixed(1)} ${(plot.Y(y) - w / 2).toFixed(1)}h${w.toFixed(2)}v${w.toFixed(2)}h${(-w).toFixed(2)}z`; }
                  els.push(s('path', { d, class: 'fl-ink' }));
                  els.push(s('circle', { cx: plot.X(A.x), cy: plot.Y(A.y), r: 4, class: 'fl-coral' }));
                  return els;
                },
                readout: (p) => `${p.n.toLocaleString('en-GB')} steps: ${ant(p.n).black.size.toLocaleString('en-GB')} black squares`,
              },
              after: r`For a few hundred steps the ant draws neat symmetric shapes, then a chaotic blob for about 10,000 steps. Then, suddenly, it starts building a diagonal **highway**, repeating a 104-step cycle forever.`,
            },
            {
              type: 'mcq',
              title: 'Always a highway?',
              prompt: r`If you start the ant on a grid that already has some black squares scattered on it (a finite number), does it still end up building a highway?`,
              choices: [
                { t: 'It always has in every experiment, but nobody has proved it must', ok: true },
                { t: 'Yes, and it was proved in 1986', why: 'Despite the simple rules, no proof is known.' },
                { t: 'No, it usually gets trapped', why: 'In all known experiments, it eventually builds a highway.' },
              ],
              explain: r`What *has* been proved is that the ant's trail is always unbounded: it can never stay trapped in a finite region. Whether it always settles into a highway is an open problem, a reminder that simple rules can resist mathematical proof.`,
            },
            {
              type: 'numeric',
              title: 'The fifth step',
              prompt: r`After 4 steps the ant is back on its starting square, which is now black. On a black square it turns **left**, flips the square back to white and moves forward. After this 5th step, how many black squares are there?`,
              answer: 3,
              wrong: [{ v: 5, why: 'The 5th square it stands on was already black, and the ant turns it white again.' }, { v: 4, why: 'The ant repaints the black square it is standing on white.' }],
              explain: r`Four squares were black, and the 5th step turns one of them (the starting square) white again: **3** black squares. From here the turns stop being all the same, and the pattern starts to get complicated.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Highway speed',
              prompt: r`On the highway, the ant's 104-step cycle moves it 2 squares diagonally. How many cycles does it take to travel 50 squares along the diagonal?`,
              answer: 25,
              wrong: [{ v: 50, why: 'Each cycle moves 2 squares, not 1.' }, { v: 2600, why: 'That’s the number of steps (25 × 104). The question asks for cycles.' }],
              explain: r`$50 \div 2 = 25$ cycles, which is $25 \times 104 = 2{,}600$ steps. The highway grows at a steady, predictable speed, in contrast to the chaos before it.`,
            },
          ],
          recap: [
            'Langton’s ant: turn right on white, left on black, flipping the colour.',
            'After about 10,000 chaotic steps, it builds an endless highway.',
            'Nobody has proved it always does: simple rules, hard proofs.',
          ],
        },
      ],
    },
    {
      title: 'Self-Organisation',
      summary: 'Sandpiles and segregation: big patterns from local rules.',
      lessons: [
        {
          id: 'sandpile',
          title: 'Sandpiles & Avalanches',
          summary: 'Self-organised criticality',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Grains on a grid',
              body: r`In 1987 the physicists Per Bak, Chao Tang and Kurt Wiesenfeld invented a toy sandpile. Each square of a grid holds some grains of sand. The rule:
- if a square holds **4 or more** grains, it **topples**: it loses 4 grains and passes one to each of its four neighbours;
- grains passed off the edge of the grid are lost.

A toppling can push a neighbour to 4 grains, which then topples too, and so on: an **avalanche**. When no square has 4 or more, the pile is **stable**, and we drop the next grain.`,
            },
            {
              type: 'numeric',
              title: 'One topple',
              prompt: r`A square holds 6 grains and topples once. How many grains are left on it?`,
              answer: 2,
              wrong: [{ v: 5, why: 'A toppling sends one grain to **each** of the four neighbours, so it loses 4, not 1.' }, { v: 0, why: 'Only 4 grains leave: one per neighbour.' }],
              explain: r`It keeps $6 - 4 = 2$ grains, and each of its four neighbours gains one. With 2 grains it is now stable.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A pile from one spot',
              body: r`Drop grains one at a time onto the **centre** of a large empty grid, letting every avalanche finish before the next grain. Colours show 0 (blank), 1, 2 or 3 grains.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 51, ymin: 0, ymax: 51, grid: false, axes: false, maxWidth: 420, pad: 6,
                params: { n: { min: 0, max: 3000, step: 50, value: 1000, label: 'grains dropped', color: 'amber' } },
                extra: ({ plot, p, s }) => { const st = sandpile(p.n), w = plot.X(1) - plot.X(0), hh = plot.Y(0) - plot.Y(1), d = ['', '', '', '']; for (let i = 0; i < st.g.length; i++) { const v = st.g[i]; if (!v) continue; d[v] += `M${plot.X(i % SN).toFixed(1)} ${plot.Y(((i / SN) | 0) + 1).toFixed(1)}h${(w + 0.3).toFixed(2)}v${(hh + 0.3).toFixed(2)}h${(-w - 0.3).toFixed(2)}Z`; } return [s('path', { d: d[1], class: 'fl-teal-soft' }), s('path', { d: d[2], class: 'fl-teal' }), s('path', { d: d[3], class: 'fl-violet' })]; },
                readout: (p) => { const st = sandpile(p.n); return `${p.n.toLocaleString('en-US')} grains · **${st.topples.toLocaleString('en-US')} topplings** so far`; },
              },
              after: r`A single rule, applied locally, builds an intricate pattern with fourfold symmetry and fractal-like detail. Notice the work involved: a few thousand grains needed well over a hundred thousand topplings.`,
            },
            {
              type: 'mcq',
              title: 'Does order matter?',
              prompt: r`Two grains are dropped on a stable pile, one at square A and one at square B, and each avalanche is allowed to finish. Does the final pile depend on which grain was dropped first?`,
              choices: [
                { t: 'No: the final stable pile is the same either way', ok: true },
                { t: 'Yes: the first avalanche changes where the second one goes', why: 'The avalanches do look different, but the final stable pile is always the same.' },
                { t: 'Only if A and B are next to each other', why: 'Even neighbouring drops give the same final pile in either order.' },
              ],
              explain: r`This is why it is called the **Abelian** sandpile (after Niels Abel; "Abelian" means order doesn't matter). Each toppling just moves grains around, and any square that can topple will eventually topple, whichever order you do it in. Even the total number of topplings is the same.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Avalanche sizes',
              body: r`Now drop 4,000 grains at **random** places on a 25 × 25 pile that has already settled into its steady state, and record how many topplings each grain set off. The bars count avalanches by size, in doubling bands (1, 2–3, 4–7, …), on **logarithmic** scales.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 10.5, ymin: -2, ymax: 3.4, grid: false, height: 280, axes: { xlabel: 'avalanche size (start of band)', ylabel: 'count per unit size (power of 10)', xticks: 1, yticks: 1, xfmt: (v) => String(2 ** v), xAt: -0.5, yAt: -2 },
                params: { b: { min: 0, max: 9, step: 1, value: 3, label: 'band', color: 'violet', format: (v) => `${2 ** v}–${2 ** (v + 1) - 1}` } },
                extra: ({ plot, p, s }) => { const out = []; for (let b = 0; b <= 10; b++) { const n = AVAL.filter((x) => x >= 2 ** b && x < 2 ** (b + 1)).length; if (!n) continue; const y = Math.log10(n / 2 ** b); out.push(s('rect', { x: plot.X(b - 0.35), y: plot.Y(y), width: plot.X(0.7) - plot.X(0), height: plot.Y(-2) - plot.Y(y), rx: 3, class: b === p.b ? 'fl-coral' : 'fl-violet' })); } return out; },
                readout: (p) => { const n = AVAL.filter((x) => x >= 2 ** p.b && x < 2 ** (p.b + 1)).length, z = AVAL.filter((x) => x === 0).length; return `sizes ${2 ** p.b}–${2 ** (p.b + 1) - 1}: **${n}** avalanches · ${z} of the 4,000 grains set off none · largest: ${Math.max(...AVAL)} topplings`; },
              },
              after: r`On log–log scales the bars fall roughly along a straight line: a **power law**. There is no typical avalanche size. Most grains do nothing, a few trigger small slides, and occasionally one grain sets off an avalanche that sweeps the whole pile.`,
            },
            {
              type: 'mcq',
              title: 'Self-organised criticality',
              prompt: r`Nobody tuned the sandpile to produce power-law avalanches: steady dropping drives it there on its own and keeps it there. Bak called this **self-organised criticality**. Which real phenomenon has been compared to it?`,
              choices: [
                { t: 'Earthquakes: stress builds slowly and is released in quakes of every size, following a power law', ok: true },
                { t: 'A pendulum clock', why: 'A clock is regular and predictable, the opposite of a critical system with events of all sizes.' },
                { t: 'Water boiling in a kettle at exactly 100 °C', why: 'Boiling needs no fine-tuning, but it doesn’t produce bursts of every size with a power-law distribution.' },
              ],
              explain: r`Earthquake sizes follow the Gutenberg–Richter power law, and forest fires, solar flares and even stock-market crashes have been modelled in the same spirit. The lesson of the sandpile: a system driven slowly can organise itself to the brink, where the next small push might do nothing, or might set off a catastrophe.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A one-dimensional pile',
              prompt: r`A row of 5 empty cells. A cell with **2** or more grains topples, sending one grain to each side (grains that leave the ends are lost). You drop 6 grains, one at a time, on the **middle** cell, letting each avalanche finish. How many grains fall off the ends in total?`,
              answer: 2,
              wrong: [{ v: 0, why: 'Try it step by step: the 4th grain already sets off an avalanche that reaches both ends.' }, { v: 4, why: 'That’s how many stay on the row. The question asks how many fall off.' }],
              hint: r`Each cell can hold at most 1 grain when the row is stable, so the row can never hold more than 5.`,
              explain: r`Working through it (in any order, by the Abelian property): after 3 grains the row is $0,1,1,1,0$; the 4th sets off topplings ending at $1,1,0,1,1$; the 5th fills the middle to $1,1,1,1,1$; the 6th triggers a long avalanche ending at $1,1,0,1,1$ again. That holds 4 grains, so $6 - 4 = 2$ fell off.`,
            },
          ],
          recap: [
            'A square with 4 or more grains topples, giving one to each neighbour.',
            'The final pile doesn’t depend on the order of topplings (Abelian property).',
            'Avalanche sizes follow a power law: self-organised criticality.',
          ],
        },
        {
          id: 'schelling',
          title: 'Schelling’s Segregation Model',
          summary: 'Mild preferences, strong patterns',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Coins on a chessboard',
              body: r`In 1971 the economist Thomas Schelling moved coins of two colours around a chessboard to model a city. The rules:
- each agent (coin) looks at its up to 8 neighbours;
- it is **happy** if at least a fraction $t$ of its occupied neighbouring squares hold its own colour, and **unhappy** otherwise;
- unhappy agents move to a random empty square.

Repeat until (perhaps) everyone is happy. The threshold $t$ measures how strongly agents want neighbours like themselves.`,
            },
            {
              type: 'numeric',
              title: 'How many like me?',
              prompt: r`An agent has 8 occupied neighbouring squares and a threshold of $t = \frac13$. What is the smallest number of neighbours of its own colour that keeps it happy?`,
              answer: 3,
              wrong: [{ v: 2, why: r`$\frac28 = 25\%$, which is less than a third.` }, { v: 4, why: r`That works, but $\frac38 = 37.5\%$ is already at least a third.` }],
              explain: r`$\frac{8}{3} \approx 2.67$, so it needs **3** like neighbours ($37.5\%$). This agent would be perfectly happy as part of a minority on its street.`,
            },
            {
              type: 'mcq',
              title: 'Predict the city',
              prompt: r`Start with the two colours scattered at random (on average about half of each agent’s neighbours match it). Every agent is content to be in a **minority**, needing only $t = 30\%$ of neighbours like itself. What do you expect after the moves settle down?`,
              choices: [
                { t: 'Clearly separated neighbourhoods: about three-quarters of neighbours end up matching', ok: true },
                { t: 'Still well mixed: nobody minds being in a minority', why: 'Surprisingly not. Try it on the next screen.' },
                { t: 'Complete separation: every neighbour matches', why: 'It segregates strongly, but not completely: there is no pressure to move once you are content.' },
              ],
              explain: r`Schelling’s surprise: mild individual preferences produce strong collective segregation. Each move by an unhappy agent makes its old neighbourhood slightly less like it, and can make other agents unhappy in turn, a cascade that sorts the city.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Run the city',
              prompt: r`A 30 × 30 city: two groups (coral and blue) and 10% empty squares. Choose the tolerance threshold and step through 30 rounds of moves. Find the **lowest** threshold for which the final city is more than **70%** segregated (agents’ neighbours matching them, on average).`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 30, ymin: 0, ymax: 30, grid: false, axes: false, maxWidth: 380, pad: 6,
                params: { t: { min: 0, max: 0.8, step: 0.05, value: 0.2, label: 'threshold t', color: 'violet', format: (v) => `${Math.round(v * 100)}%` }, r: { min: 0, max: 30, step: 1, value: 30, label: 'round', color: 'ink' } },
                extra: ({ plot, p, s }) => { const F = schelling(p.t)[p.r], w = plot.X(1) - plot.X(0), hh = plot.Y(0) - plot.Y(1), d = ['', '', '']; for (let i = 0; i < F.g.length; i++) { const v = F.g[i]; if (!v) continue; d[v] += `M${(plot.X(i % SCH) + 1).toFixed(1)} ${(plot.Y(((i / SCH) | 0) + 1) + 1).toFixed(1)}h${(w - 2).toFixed(2)}v${(hh - 2).toFixed(2)}h${(2 - w).toFixed(2)}Z`; } return [s('path', { d: d[1], class: 'fl-coral' }), s('path', { d: d[2], class: 'fl-blue' })]; },
                readout: (p) => { const F = schelling(p.t)[p.r]; return `round ${p.r}: neighbours matching **${Math.round(F.sim * 100)}%** on average · **${F.unhappy}** unhappy agents`; },
                goal: (p) => Math.abs(p.t - 0.3) < 0.01 && p.r === 30,
                hint: 'Leave the round at 30 and raise the threshold one step at a time from 0.',
                solution: { t: 0.3, r: 30 },
              },
              explain: r`At $t = 30\%$ the city ends about **74%** segregated, from a random start of about 49%; at 25% it barely changes (58%). Go higher and it sorts almost completely. But past about 75%, so many agents are unhappy that they keep moving and never settle: the city stays churning and mixed.`,
            },
            {
              type: 'mcq',
              title: 'A tipping point',
              prompt: r`Between thresholds of 25% and 30% the final city jumps from mildly to strongly segregated. What does this sharp change suggest?`,
              choices: [
                { t: 'Small changes in individual attitudes can trigger large changes in the overall pattern', ok: true },
                { t: 'The simulation must have a bug', why: 'Sharp transitions are typical of systems where each change affects its neighbours: one move can trigger a cascade of others.' },
                { t: 'People at 30% are far more prejudiced than at 25%', why: 'The individual preferences barely differ. It’s the collective outcome that changes sharply.' },
              ],
              explain: r`Like a phase transition in physics, the collective state can shift abruptly once a threshold is crossed. Schelling called this the problem of **micromotives and macrobehaviour**: you can’t read off the behaviour of a system from the wishes of its parts.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'What can you conclude?',
              prompt: r`A city is observed to be strongly segregated. Based on Schelling’s model, which conclusion is justified?`,
              choices: [
                { t: 'Strong segregation does not prove that individuals hold strong preferences: mild ones can produce it', ok: true },
                { t: 'Its residents must strongly prefer neighbours like themselves', why: 'The model shows strong segregation can emerge from preferences as mild as "at least 30% like me".' },
                { t: 'Segregation is harmless, since it comes from mild preferences', why: 'The model says nothing about harm, and real segregation also has other causes such as discrimination and income.' },
              ],
              explain: r`The model doesn’t say what does cause segregation in any real city: that takes data. What it shows is that the pattern alone can’t tell you the strength of the motives behind it. Schelling shared the 2005 Nobel Prize in economics, partly for this insight.`,
            },
          ],
          recap: [
            'Agents move if fewer than a fraction t of their neighbours match them.',
            'Even t = 30% produces about 74% segregation from a random start.',
            'Mild individual preferences can produce strong collective patterns.',
          ],
        },
      ],
    },
  ],
};
