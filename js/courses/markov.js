import { fix } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const matVec = (x, P) => P[0].map((_, j) => x.reduce((s, xi, i) => s + xi * P[i][j], 0));
const step = (x, P, n) => { let y = x; for (let k = 0; k < n; k++) y = matVec(y, P); return y; };

// ---------- drawing chains: nodes in plot coordinates, curved arrows with probabilities ----------
const NR = 26; // node radius in px
function arrowHead(s, x, y, ux, uy, col, size = 11) {
  const bx = x - ux * size, by = y - uy * size, hw = size * 0.55;
  return s('path', { d: `M${x} ${y} L${bx - uy * hw} ${by + ux * hw} L${bx + uy * hw} ${by - ux * hw} Z`, style: `fill:${col}` });
}
function edge(s, A, B, { bend = 0.25, col = 'var(--ink-3)', w = 2.5, label = '', lcol = 'var(--ink-2)' } = {}) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const mx = (A[0] + B[0]) / 2 - uy * bend * L, my = (A[1] + B[1]) / 2 + ux * bend * L;
  // start and end points pulled back from the node centres along the curve's end tangents
  const t0x = mx - A[0], t0y = my - A[1], t0 = Math.hypot(t0x, t0y);
  const t1x = B[0] - mx, t1y = B[1] - my, t1 = Math.hypot(t1x, t1y);
  const sx = A[0] + (t0x / t0) * NR, sy = A[1] + (t0y / t0) * NR;
  const ex = B[0] - (t1x / t1) * (NR + 2), ey = B[1] - (t1y / t1) * (NR + 2);
  const els = [
    s('path', { d: `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${(ex - (t1x / t1) * 8).toFixed(1)} ${(ey - (t1y / t1) * 8).toFixed(1)}`, fill: 'none', stroke: col, 'stroke-width': w }),
    arrowHead(s, ex, ey, t1x / t1, t1y / t1, col),
  ];
  if (label) {
    const lx = 0.25 * A[0] + 0.5 * mx + 0.25 * B[0], ly = 0.25 * A[1] + 0.5 * my + 0.25 * B[1];
    // push the label outwards, on the side the curve bulges towards
    const sg = bend < 0 ? -1 : 1;
    els.push(s('text', { x: lx - uy * 15 * sg, y: ly + ux * 15 * sg + 5, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:${lcol};${FS(15)}`, text: label }));
  }
  return els;
}
function loop(s, A, { dir = -1, col = 'var(--ink-3)', w = 2.5, label = '', lcol = 'var(--ink-2)' } = {}) {
  // a self-loop above (dir = −1) or below (dir = 1) the node
  const sx = A[0] - 14, sy = A[1] + dir * (NR - 6), ex = A[0] + 14, ey = A[1] + dir * (NR - 6);
  const els = [
    s('path', { d: `M${sx} ${sy} C ${A[0] - 40} ${A[1] + dir * (NR + 44)}, ${A[0] + 40} ${A[1] + dir * (NR + 44)}, ${ex + 3} ${ey + dir * 9}`, fill: 'none', stroke: col, 'stroke-width': w }),
    arrowHead(s, ex, ey, -0.15, -dir * 1, col, 10),
  ];
  if (label) els.push(s('text', { x: A[0], y: A[1] + dir * (NR + 42) + (dir < 0 ? -6 : 18), 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:${lcol};${FS(15)}`, text: label }));
  return els;
}
function node(s, A, label, { fill = 'var(--card)', stroke = 'var(--ink)', weight = null } = {}) {
  const els = [s('circle', { cx: A[0], cy: A[1], r: NR, fill, stroke, 'stroke-width': 3 })];
  els.push(s('text', { x: A[0], y: A[1] + 6, 'text-anchor': 'middle', class: 'lbl', style: FS(17), text: label }));
  if (weight != null) els.push(s('text', { x: A[0], y: A[1] + NR + 22, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--violet);${FS(15)}`, text: weight }));
  return els;
}
// probability bars inside a figure: values in [0, 1]
function probBars(s, x0, y0, w, h, vals, labels, cols) {
  const n = vals.length, bw = w / n, els = [];
  vals.forEach((v, i) => {
    const bh = v * h;
    els.push(s('rect', { x: x0 + i * bw + bw * 0.2, y: y0 - bh, width: bw * 0.6, height: bh, rx: 4, class: `fl-${cols[i % cols.length]}` }));
    els.push(s('text', { x: x0 + i * bw + bw / 2, y: y0 - bh - 7, 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(14), text: fix(v, 2) }));
    els.push(s('text', { x: x0 + i * bw + bw / 2, y: y0 + 19, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(14)}`, text: labels[i] }));
  });
  els.push(s('line', { x1: x0, x2: x0 + w, y1: y0, y2: y0, stroke: 'var(--axis)', 'stroke-width': 1.6 }));
  return els;
}

// ---------- weather ----------
const SUN = 'var(--amber)', RAIN = 'var(--blue)';
function weatherDays(pSS, pRS, seed, n = 60) {
  const u = rng(seed * 7919 + 13), days = [1];
  for (let i = 1; i < n; i++) days.push(days[i - 1] ? (u() < pSS ? 1 : 0) : (u() < pRS ? 1 : 0));
  return days;
}
function weatherDiagram(s, pSS, pRS, A = [190, 95], B = [410, 95]) {
  return [
    ...edge(s, A, B, { bend: -0.28, label: fix(1 - pSS, 2) }),
    ...edge(s, B, A, { bend: -0.28, label: fix(pRS, 2) }),
    ...loop(s, A, { label: fix(pSS, 2) }),
    ...loop(s, B, { label: fix(1 - pRS, 2) }),
    ...node(s, A, '☀', { fill: 'var(--amber-soft)', stroke: SUN }),
    ...node(s, B, '☂', { fill: 'var(--blue-soft)', stroke: RAIN }),
  ];
}
function dayStrip(s, days, y, x0 = 30, w = 540) {
  const cw = w / days.length;
  return days.map((d, i) => s('rect', { x: x0 + i * cw + 0.5, y, width: cw - 1, height: 26, rx: 2, fill: d ? SUN : RAIN, opacity: 0.85 }));
}
const runsOf = (days) => { const runs = []; let k = 1; for (let i = 1; i < days.length; i++) { if (days[i] === days[i - 1]) k++; else { if (days[i - 1]) runs.push(k); k = 1; } } if (days[days.length - 1]) runs.push(k); return runs; };

// ---------- lily pads (3 states) ----------
const PADS = [[0.5, 0.5, 0], [0.25, 0.5, 0.25], [0, 0.5, 0.5]];
const PAD_XY = [[150, 95], [300, 95], [450, 95]];
// a 3-cycle where each step either stays (probability s) or moves on
const cyc = (st) => [[st, 1 - st, 0], [0, st, 1 - st], [1 - st, 0, st]];

// ---------- a board game: squares 0..12, move 1 or 2 by coin toss, snake 10 → 3, optional ladder ----------
const BOARD_N = 12;
function boardJumps(ladder) { const j = { 10: 3 }; if (ladder) j[ladder] = ladder + 4; return j; }
function landOn(sq, jumps) { if (sq >= BOARD_N) return BOARD_N; return jumps[sq] != null ? landOn(jumps[sq], jumps) : sq; }
function expectedTurns(ladder) {
  const jumps = boardJumps(ladder);
  let E = new Array(BOARD_N + 1).fill(0);
  for (let it = 0; it < 3000; it++) {
    const E2 = E.slice();
    for (let sq = BOARD_N - 1; sq >= 0; sq--) E2[sq] = jumps[sq] != null ? 0 : 1 + 0.5 * E[landOn(sq + 1, jumps)] + 0.5 * E[landOn(sq + 2, jumps)];
    E2[BOARD_N] = 0;
    E = E2;
  }
  return E[0];
}
// probability of finishing on each turn 1..T
function finishDist(ladder, T = 40) {
  const jumps = boardJumps(ladder);
  let x = new Array(BOARD_N + 1).fill(0);
  x[0] = 1;
  const out = [];
  for (let t = 1; t <= T; t++) {
    const y = new Array(BOARD_N + 1).fill(0);
    for (let sq = 0; sq < BOARD_N; sq++) if (x[sq]) { y[landOn(sq + 1, jumps)] += x[sq] / 2; y[landOn(sq + 2, jumps)] += x[sq] / 2; }
    out.push(y[BOARD_N]);
    y[BOARD_N] = 0;
    x = y;
  }
  return out;
}
function boardDraw(s, ladder, { snake = true, y = 112 } = {}) {
  const els = [], cw = 42, x0 = 300 - (13 * cw) / 2;
  const cx = (sq) => x0 + sq * cw + cw / 2;
  for (let sq = 0; sq <= BOARD_N; sq++) {
    els.push(s('rect', { x: x0 + sq * cw + 2, y: y - 18, width: cw - 4, height: 36, rx: 6, class: sq === BOARD_N ? 'fl-teal-soft' : 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 }));
    els.push(s('text', { x: cx(sq), y: y + 6, 'text-anchor': 'middle', class: 'lbl', style: FS(14), text: sq === BOARD_N ? '★' : String(sq) }));
  }
  // snake 10 → 3 (below the row), ladder (above it)
  if (snake) {
    const a = cx(10), b = cx(3);
    els.push(s('path', { d: `M${a} ${y + 18} C ${a - 40} ${y + 80}, ${b + 40} ${y + 30}, ${b} ${y + 18}`, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    els.push(s('path', { d: `M${a - 6} ${y + 22} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0`, class: 'fl-coral' })); // the snake's head
  }
  if (ladder) {
    const l0 = cx(ladder), l1 = cx(ladder + 4), top = y - 95;
    for (const off of [-5, 5]) els.push(s('path', { d: `M${l0 + off} ${y - 18} Q ${(l0 + l1) / 2} ${top + off} ${l1 + off} ${y - 18}`, fill: 'none', stroke: 'var(--success)', 'stroke-width': 3 }));
    for (let k = 1; k < 6; k++) { const t = k / 6, xx = (1 - t) ** 2 * l0 + 2 * t * (1 - t) * ((l0 + l1) / 2) + t * t * l1, yy = (1 - t) ** 2 * (y - 18) + 2 * t * (1 - t) * top + t * t * (y - 18); els.push(s('line', { x1: xx - 6, x2: xx + 6, y1: yy - 1, y2: yy + 1, stroke: 'var(--success)', 'stroke-width': 3 })); }
  }
  return els;
}

// ---------- coin patterns ----------
function waitFor(pattern, seed) {
  const u = rng(seed), seq = [];
  while (seq.length < 400) { seq.push(u() < 0.5 ? 'H' : 'T'); if (seq.slice(-pattern.length).join('') === pattern) return seq.length; }
  return seq.length;
}
const AVG = (() => { let c = null; return () => { if (c) return c; c = {}; for (const pt of ['HH', 'HT']) { let t = 0; for (let k = 1; k <= 4000; k++) t += waitFor(pt, k * 31 + 7); c[pt] = t / 4000; } return c; }; })();
function flipsOf(seed, n = 24) { const u = rng(seed * 104729 + 3); return Array.from({ length: n }, () => (u() < 0.5 ? 'H' : 'T')); }
const firstAt = (flips, pt) => { for (let i = pt.length; i <= flips.length; i++) if (flips.slice(i - pt.length, i).join('') === pt) return i; return null; };
// probability that pattern a turns up before pattern b (3 flips each)
function penney(a, b) {
  const suff = ['', 'H', 'T', 'HH', 'HT', 'TH', 'TT'];
  let P = Object.fromEntries(suff.map((x) => [x, 0.5]));
  for (let it = 0; it < 400; it++) {
    const P2 = {};
    for (const st of suff) { let v = 0; for (const c of 'HT') { const t = st + c; v += 0.5 * (t.endsWith(a) ? 1 : t.endsWith(b) ? 0 : P[t.slice(-2)]); } P2[st] = v; }
    P = P2;
  }
  return P[''];
}
const PATS = ['HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];

// ---------- a tiny web ----------
const WEB = { names: ['A', 'B', 'C', 'D', 'E'], xy: [[130, 80], [300, 40], [240, 200], [440, 190], [510, 90]], links: [[1, 2], [2], [0], [2, 4], [3]] };
function pagerank(links, d = 0.85) {
  const n = links.length;
  let rk = new Array(n).fill(1 / n);
  for (let it = 0; it < 200; it++) {
    const r2 = new Array(n).fill((1 - d) / n);
    for (let i = 0; i < n; i++) for (const j of links[i]) r2[j] += (d * rk[i]) / links[i].length;
    rk = r2;
  }
  return rk;
}
function webDraw(s, links, ranks, hi = -1) {
  const els = [];
  links.forEach((out, i) => out.forEach((j) => { const both = links[j].includes(i); els.push(...edge(s, WEB.xy[i], WEB.xy[j], { bend: both ? 0.18 : 0.12, col: i === hi && j === 4 ? 'var(--coral)' : 'var(--ink-3)', w: i === hi && j === 4 ? 3.5 : 2.2 })); }));
  WEB.xy.forEach((xy, i) => els.push(...node(s, xy, WEB.names[i], { fill: i === 4 ? 'var(--violet-soft)' : 'var(--card)', weight: fix(ranks[i], 3) })));
  return els;
}

// ---------- text from a chain ----------
const CORPUS = 'the cat sat on the mat . the dog sat on the log . the cat saw the dog .';
const BIGRAMS = (() => { const w = CORPUS.split(' '), m = {}; for (let i = 0; i + 1 < w.length; i++) (m[w[i]] ||= []).push(w[i + 1]); return m; })();
const SENTENCES = new Set(CORPUS.split(' . ').map((x) => x.replace(/ \.$/, '').trim()));
function babble(seed) {
  const u = rng(seed * 5779 + 11), out = ['the'];
  while (out.length < 16) { const nx = BIGRAMS[out[out.length - 1]]; const w = nx[Math.floor(u() * nx.length)]; if (w === '.') return out.join(' '); out.push(w); }
  return out.join(' ') + ' …';
}
const shown = (b) => (b.endsWith('…') ? b : b + ' .');
// a sentence as up to three centred lines of text
function sentence({ plot, s }, str) {
  const lines = [], words = str.split(' ');
  let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > 34 && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  const y0 = plot.Y(0.5) + 8 - ((lines.length - 1) * 30) / 2;
  return lines.map((t, i) => s('text', { x: plot.X(5), y: y0 + i * 30, 'text-anchor': 'middle', class: 'lbl', style: FS(22), text: t }));
}

// one long random surf with d = 0.85: follow a random link, or (15% of the time) jump to a random page
let SURF = null;
const surfRun = () => {
  if (SURF) return SURF;
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pages = [2], counts = [[0, 0, 1, 0, 0]];
  for (let k = 0; k < 12000; k++) {
    const at = pages[k], out = WEB.links[at];
    const nx = rnd() < 0.85 ? out[Math.floor(rnd() * out.length)] : Math.floor(rnd() * 5);
    pages.push(nx);
    const c = counts[k].slice(); c[nx]++; counts.push(c);
  }
  return (SURF = { pages, counts });
};
// slow hops at first, then faster and faster
const surfHop = (t) => (t < 12 ? t / 0.6 : Math.min(12000, 20 + 25 * (t - 12) ** 2));

export default {
  id: 'markov',
  subject: 'math',
  title: 'Markov Chains',
  level: 'Advanced',
  cover: 'markov',
  tagline: 'Random processes with a short memory: weather, board games, coin patterns, web search and babbling text.',
  description: r`A Markov chain hops between states at random, where the next step depends only on where it is now. That simple rule models weather, board games and queues, predicts the long run with a matrix, explains why some coin patterns take longer to appear than others, ranked the early web for Google, and generates surprisingly plausible nonsense text.`,
  prereq: 'Probability, and Linear Algebra',
  chapters: [
    {
      title: 'Hopping Between States',
      summary: 'Transitions and matrices.',
      lessons: [
        {
          id: 'states',
          title: 'States and Transitions',
          summary: 'A memory of one day',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Tomorrow’s weather',
              body: r`A toy weather model: if today is **sunny**, tomorrow is sunny with probability $0.8$; if today is **rainy**, tomorrow is sunny with probability $0.4$. The diagram shows every possible change (**transition**) with its probability. Below, a simulated two months; try different random runs.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 280, grid: false, axes: false, height: 280,
                params: { seed: { min: 1, max: 30, step: 1, value: 1, label: 'new run', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ p, s }) => { const days = weatherDays(0.8, 0.4, p.seed); return [...weatherDiagram(s, 0.8, 0.4), ...dayStrip(s, days, 200)]; },
                readout: (p) => { const days = weatherDays(0.8, 0.4, p.seed), sunny = days.reduce((a, b) => a + b, 0), runs = runsOf(days); return `sunny on ${sunny} of 60 days · average sunny spell ${fix(runs.reduce((a, b) => a + b, 0) / runs.length, 1)} days`; },
              },
              after: r`The arrows out of each state add up to 1: something must happen tomorrow. The key assumption is that tomorrow depends **only on today**, not on the whole history. That's the **Markov property**, named after Andrey Markov, who began studying such chains in 1906. (One of his first applications, in 1913, was the pattern of vowels and consonants in Pushkin's verse novel *Eugene Onegin*.)`,
            },
            {
              type: 'numeric',
              title: 'Rain tomorrow',
              prompt: r`In this model, today is sunny. What is the probability that it rains tomorrow?`,
              answer: 0.2,
              tol: 0.001,
              wrong: [{ v: 0.4, why: 'That’s the chance of sun after a rainy day.' }, { v: 0.6, why: 'That’s the chance rain continues after a rainy day.' }],
              explain: r`From sunny there are only two possibilities: sunny (0.8) or rainy. So rain has probability $1 - 0.8 = 0.2$.`,
            },
            {
              type: 'numeric',
              title: 'A sunny week',
              prompt: r`Today is sunny. What is the probability that the next **3** days are all sunny too? (3 decimal places.)`,
              answer: 0.512,
              tol: 0.001,
              wrong: [{ v: 2.4, why: 'Probabilities of a sequence multiply, not add.' }, { v: 0.8, why: 'That’s just tomorrow. Each of the three days must stay sunny.' }],
              explain: r`Each day stays sunny with probability 0.8, given the day before was sunny, so the chance is $0.8^3 = 0.512$. Multiplying along a path through the diagram is the basic calculation of Markov chains.`,
            },
            {
              type: 'interactive',
              title: 'Longer spells',
              prompt: r`A sunny spell ends the first day the weather turns, so its average length is $\dfrac{1}{1 - p}$, where $p$ is the chance that sun continues. Set $p$ so that sunny spells last **5 days** on average.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 280, grid: false, axes: false, height: 280,
                params: { p: { min: 0.05, max: 0.95, step: 0.05, value: 0.5, label: 'sun → sun', color: 'amber', format: (v) => fix(v, 2) } },
                extra: ({ p, s }) => [...weatherDiagram(s, p.p, 0.4), ...dayStrip(s, weatherDays(p.p, 0.4, 3), 200)],
                readout: (p) => `average sunny spell: $\\frac{1}{1 - ${fix(p.p, 2)}} = ${fix(1 / (1 - p.p), 2)}$ days`,
                goal: (p) => Math.abs(p.p - 0.8) < 1e-9,
                solution: { p: 0.8 },
                hint: r`You need $1 - p = \frac15$.`,
              },
              explain: r`$\frac{1}{1 - p} = 5$ gives $p = 0.8$. Each day the spell ends with probability $0.2$, so the length is a geometric random variable with mean $\frac{1}{0.2} = 5$. The strip shows spells getting longer as $p$ grows.`,
            },
            {
              type: 'mcq',
              title: 'Is it Markov?',
              prompt: 'Which of these is **not** a Markov chain (where the next state depends only on the current one)?',
              choices: [
                { t: 'Drawing cards from a deck without replacement, where the state is the last card drawn', ok: true },
                { t: 'Your position on a snakes-and-ladders board, moving by dice rolls', why: 'Where you go next depends only on your square and the roll: Markov.' },
                { t: 'A random walk on a grid', why: 'Each step depends only on where you are: Markov.' },
              ],
              explain: r`What's left in the deck depends on **all** the cards drawn so far, not just the last one. It can be made Markov by choosing a bigger state: the whole set of cards drawn. Choosing what the "state" includes is the main modelling decision.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rain, then sun',
              prompt: r`Today is rainy. What is the probability that tomorrow is rainy and the day after is sunny? (2 decimal places.)`,
              answer: 0.6 * 0.4,
              tol: 0.002,
              wrong: [{ v: 0.4, why: 'That’s only the second step. First it must stay rainy (0.6).' }, { v: 0.12, tol: 0.002, why: r`From rain, staying rainy is $0.6$ (not $0.2$ or $0.3$), and rain → sun is $0.4$.` }],
              explain: r`Follow the path rain → rain → sun: $0.6 \times 0.4 = 0.24$. Because of the Markov property, each step's probability depends only on the state it starts from, so a path's probability is just the product of its arrows.`,
            },
          ],
          recap: [
            'A Markov chain moves between states with fixed transition probabilities.',
            'Markov property: the next state depends only on the current one.',
            'A path’s probability is the product of its transition probabilities.',
          ],
        },
        {
          id: 'matrices',
          title: 'Transition Matrices',
          summary: 'Many steps at once',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'The chain as a matrix',
              body: r`Collect the transition probabilities in a **transition matrix** $P$: row = today, column = tomorrow. For the weather (states sunny, rainy):
$$P = \begin{pmatrix} 0.8 & 0.2 \\ 0.4 & 0.6 \end{pmatrix}$$
Every row adds up to 1. If today's probabilities are a row vector $x = (x_S, x_R)$, tomorrow's are
$$x P = (0.8x_S + 0.4x_R,\ 0.2x_S + 0.6x_R)$$
and the day after's are $xP^2$. Matrix multiplication adds up all the paths automatically.`,
            },
            {
              type: 'numeric',
              title: 'Two days ahead',
              prompt: r`Today is sunny. What is the probability that it is sunny **two** days from now? (Add the two paths: sun → sun → sun and sun → rain → sun.)`,
              answer: 0.72,
              tol: 0.001,
              wrong: [{ v: 0.64, tol: 0.001, why: r`That's only the path that stays sunny. It could also rain tomorrow and clear up: $0.2 \times 0.4$.` }, { v: 0.8, why: 'That’s one day ahead.' }],
              explain: r`$0.8 \times 0.8 + 0.2 \times 0.4 = 0.64 + 0.08 = 0.72$. That's the top-left entry of $P^2$: row "sunny" times column "sunny".`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Forgetting the start',
              body: r`The bars show the chance of sun and rain $n$ days from now, starting from a sunny day (left pair) or a rainy day (right pair).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 250, grid: false, axes: false, height: 250,
                params: { n: { min: 0, max: 10, step: 1, value: 1, label: 'days ahead $n$', color: 'violet' } },
                extra: ({ p, s }) => {
                  const P = [[0.8, 0.2], [0.4, 0.6]], a = step([1, 0], P, p.n), b = step([0, 1], P, p.n);
                  return [...probBars(s, 40, 200, 240, 150, a, ['☀', '☂'], ['amber', 'blue']), ...probBars(s, 320, 200, 240, 150, b, ['☀', '☂'], ['amber', 'blue']),
                    s('text', { x: 160, y: 236, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: 'starting sunny' }), s('text', { x: 440, y: 236, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: 'starting rainy' })];
                },
                readout: (p) => { const P = [[0.8, 0.2], [0.4, 0.6]]; return `chance of sun in ${p.n} days: ${fix(step([1, 0], P, p.n)[0], 3)} (from sun) vs ${fix(step([0, 1], P, p.n)[0], 3)} (from rain)`; },
              },
              after: r`After a week the two starting points give almost the same forecast: about $\frac23$ sunny. The chain **forgets** where it started. The gap shrinks by a factor of $0.4$ each day: that's the second eigenvalue of $P$ ($0.8 - 0.4 = 0.4$).`,
            },
            {
              type: 'interactive',
              title: 'Tune the rain',
              prompt: r`Keep sunny days as before ($0.8$ stays sunny), but change how persistent rain is: $q$ = the chance that a rainy day is followed by another. Choose $q$ so that, starting from a rainy day, the chance of rain **two days later** is exactly **0.44**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 200, grid: false, axes: false, height: 200,
                params: { q: { min: 0, max: 0.95, step: 0.05, value: 0.3, label: '$q$ (rain → rain)', color: 'blue', format: (v) => fix(v, 2) } },
                extra: ({ p, s }) => weatherDiagram(s, 0.8, 1 - p.q, [190, 110], [410, 110]),
                readout: (p) => r`$P(\text{rain in 2 days} \mid \text{rain}) = q^2 + (1 - q)(0.2) = ${fix(p.q * p.q + (1 - p.q) * 0.2, 4)}$`,
                goal: (p) => Math.abs(p.q * p.q + (1 - p.q) * 0.2 - 0.44) < 1e-6,
                solution: { q: 0.6 },
                hint: 'Two paths end in rain: rain → rain → rain, and rain → sun → rain.',
              },
              explain: r`$q^2 + 0.2(1 - q) = 0.44$ gives $q^2 - 0.2q - 0.24 = 0$, so $q = 0.6$: back to our original model. In matrix terms, you were setting the bottom-right entry of $P^2$.`,
            },
            {
              type: 'mcq',
              title: 'Rows and columns',
              prompt: r`In a transition matrix, what must be true of every **row**?`,
              choices: [
                { t: 'Its entries add up to 1', ok: true },
                { t: 'Its entries are all equal', why: 'Some transitions can be much more likely than others.' },
                { t: 'Its entries add up to the number of states', why: 'A row lists the probabilities of all the possible next states, which must total 1.' },
              ],
              explain: r`Row $i$ lists where the chain can go from state $i$, so its probabilities add to 1. Columns have no such rule: a popular state can receive more than 1 in total from all the others.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Mixed start',
              prompt: r`The forecast for today is 50% sunny, 50% rainy. Using the original model, what is the probability of sun **tomorrow**?`,
              answer: 0.6,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'The chain moves the probabilities: compute xP.' }, { v: 1.2, why: 'Weight each row by today’s probability: 0.5 × 0.8 + 0.5 × 0.4.' }],
              explain: r`$xP = (0.5, 0.5)\begin{pmatrix} 0.8 & 0.2 \\ 0.4 & 0.6\end{pmatrix} = (0.6, 0.4)$. Tomorrow is 60% sunny: a weighted average of the rows, weighted by today's uncertainty.`,
            },
          ],
          recap: [
            'The transition matrix P has rows summing to 1.',
            'Tomorrow’s probabilities are xP; n days ahead, xPⁿ.',
            'Entries of Pⁿ add up all n-step paths.',
          ],
        },
        {
          id: 'longrun',
          title: 'The Long Run',
          summary: 'Stationary distributions',
          icon: 'clock',
          steps: [
            {
              type: 'interactive',
              title: 'A forecast that never changes',
              prompt: r`Choose today's chance of sun $x$ so that **tomorrow's chance of sun is the same**. (Original model: sunny → sunny 0.8, rainy → sunny 0.4.)`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 240, grid: false, axes: false, height: 240,
                params: { x: { min: 0, max: 1, step: 0.01, value: 0.4, label: 'today: chance of sun', color: 'amber', format: (v) => fix(v, 2) } },
                extra: ({ p, s }) => { const t = matVec([p.x, 1 - p.x], [[0.8, 0.2], [0.4, 0.6]]); return [...probBars(s, 40, 190, 240, 150, [p.x, 1 - p.x], ['☀', '☂'], ['amber', 'blue']), ...probBars(s, 320, 190, 240, 150, t, ['☀', '☂'], ['amber', 'blue']), s('text', { x: 160, y: 226, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: 'today' }), s('text', { x: 440, y: 226, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: 'tomorrow' })]; },
                readout: (p) => `tomorrow: chance of sun $0.8x + 0.4(1 - x) = ${fix(0.4 + 0.4 * p.x, 3)}$`,
                goal: (p) => Math.abs(0.4 + 0.4 * p.x - p.x) < 0.005,
                solution: { x: 0.67 },
                hint: r`Solve $0.4 + 0.4x = x$.`,
              },
              explain: r`$0.8x + 0.4(1 - x) = x$ gives $x = \frac23$. The distribution $\pi = (\frac23, \frac13)$ satisfies $\pi P = \pi$: it's the **stationary distribution**. It's also where every forecast ends up after many days, whatever the start.`,
            },
            {
              type: 'numeric',
              title: 'A drier climate',
              prompt: r`In a drier climate, sunny days stay sunny with probability 0.9, and rainy days turn sunny with probability 0.3. What fraction of days are sunny in the long run?`,
              answer: 0.75,
              tol: 0.001,
              wrong: [{ v: 0.9, why: r`That's one transition. Balance the flows: $\pi_S \times 0.1 = \pi_R \times 0.3$.` }, { v: 0.6, why: r`Solve $\pi_S = 0.9\pi_S + 0.3(1 - \pi_S)$.` }],
              explain: r`In the long run, the flow from sun to rain must balance the flow from rain to sun: $0.1\,\pi_S = 0.3\,\pi_R$. So $\pi_S = 3\pi_R$, giving $\pi_S = \frac34$. For a two-state chain, $\pi_S = \frac{a}{a + b}$ where $a$ = P(rain → sun) and $b$ = P(sun → rain).`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A frog on three lily pads',
              body: r`A frog on three lily pads in a row stays put half the time; otherwise it jumps to a neighbouring pad (from the middle pad, left or right equally). Start it on any pad and watch where it's likely to be after $n$ jumps.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 330, grid: false, axes: false, height: 330,
                params: {
                  st: { min: 0, max: 2, step: 1, value: 0, label: 'start', color: 'teal', format: (v) => ['left', 'middle', 'right'][v] },
                  n: { min: 0, max: 12, step: 1, value: 1, label: 'jumps $n$', color: 'violet' },
                },
                extra: ({ p, s }) => {
                  const x = step([0, 1, 2].map((i) => (i === p.st ? 1 : 0)), PADS, p.n), els = [];
                  els.push(...edge(s, PAD_XY[0], PAD_XY[1], { bend: -0.25, label: '0.5' }), ...edge(s, PAD_XY[1], PAD_XY[0], { bend: -0.25, label: '0.25' }), ...edge(s, PAD_XY[1], PAD_XY[2], { bend: -0.25, label: '0.25' }), ...edge(s, PAD_XY[2], PAD_XY[1], { bend: -0.25, label: '0.5' }));
                  PAD_XY.forEach((xy, i) => els.push(...loop(s, xy, { label: '0.5' }), ...node(s, xy, ['L', 'M', 'R'][i], { fill: 'var(--teal-soft)', stroke: 'var(--teal)' })));
                  els.push(...probBars(s, 90, 300, 420, 120, x, ['left', 'middle', 'right'], ['teal']));
                  return els;
                },
                readout: (p) => { const x = step([0, 1, 2].map((i) => (i === p.st ? 1 : 0)), PADS, p.n); return `after ${p.n} jumps: ${x.map((v) => fix(v, 3)).join(' · ')}`; },
              },
              after: r`Whatever the start, the probabilities settle to $\left(\frac14, \frac12, \frac14\right)$: the frog spends half its time on the middle pad, which is easiest to reach. Check: $\pi P = \pi$ for $\pi = \left(\frac14, \frac12, \frac14\right)$.`,
            },
            {
              type: 'numeric',
              title: 'Check the balance',
              prompt: r`For the frog, check that the middle pad is stationary: in the long run, the probability of being on the middle pad **next** step is $\frac14 \times 0.5 + \frac12 \times 0.5 + \frac14 \times 0.5$. What is that?`,
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: 0.25, why: r`Add all three contributions: $0.125 + 0.25 + 0.125$.` }],
              explain: r`$0.125 + 0.25 + 0.125 = 0.5 = \pi_M$ ✓. Probability flows into the middle pad exactly as fast as it flows out, which is what "stationary" means: the distribution is in balance, even though the frog never stops jumping.`,
            },
            {
              type: 'mcq',
              title: 'Time averages',
              prompt: 'You watch one frog for a very long time and record which pad it’s on after each jump. What fraction of the jumps end on the middle pad?',
              choices: [
                { t: 'About one half: the stationary probability', ok: true },
                { t: 'About one third: there are three pads', why: 'The pads aren’t equally easy to reach. The middle pad has two neighbours feeding it.' },
                { t: 'It depends on where the frog started', why: 'Over a long time, the starting pad is forgotten.' },
              ],
              explain: r`The **ergodic theorem** for Markov chains: for a well-behaved chain, the long-run fraction of time spent in each state equals its stationary probability. So you can learn $\pi$ by watching one long run, or by solving $\pi P = \pi$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rainy days per year',
              prompt: r`In the original weather model ($\pi = \frac23$ sunny, $\frac13$ rainy), about how many rainy days are there in a year of 365 days? (Nearest whole number.)`,
              unit: 'days',
              answer: 365 / 3,
              tol: 0.6,
              wrong: [{ v: 73, why: 'That’s 365 × 0.2, the chance of rain after one sunny day. Use the long-run fraction, 1/3.' }, { v: 243, why: 'That’s the number of sunny days.' }],
              explain: r`$365 \times \frac13 \approx 122$ rainy days. The long-run fraction ignores today's weather entirely: over a year, the start is forgotten.`,
            },
          ],
          recap: [
            'A stationary distribution satisfies πP = π.',
            'Two states: π_S = a/(a + b), balancing the flows.',
            'Long-run fraction of time in each state = its stationary probability.',
          ],
        },
        {
          id: 'settle',
          title: 'When Chains Don’t Settle',
          summary: 'Cycles and traps',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Going round in circles',
              body: r`A token moves round three states A → B → C → A. Each step it either **stays** (probability $s$) or moves on. Start at A and change $s$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 360, grid: false, axes: false, height: 360,
                params: {
                  sv: { min: 0, max: 0.9, step: 0.05, value: 0, label: 'stay $s$', color: 'teal', format: (v) => fix(v, 2) },
                  n: { min: 0, max: 20, step: 1, value: 4, label: 'steps $n$', color: 'violet' },
                },
                extra: ({ p, s }) => {
                  const xy = [[300, 50], [400, 160], [200, 160]], els = [];
                  for (let i = 0; i < 3; i++) els.push(...edge(s, xy[i], xy[(i + 1) % 3], { bend: 0.12, label: fix(1 - p.sv, 2) }));
                  const x = step([1, 0, 0], cyc(p.sv), p.n);
                  xy.forEach((q, i) => els.push(...node(s, q, 'ABC'[i], { fill: 'var(--violet-soft)', stroke: 'var(--violet)' })));
                  els.push(...probBars(s, 120, 330, 360, 100, x, ['A', 'B', 'C'], ['violet']));
                  return els;
                },
                readout: (p) => { const x = step([1, 0, 0], cyc(p.sv), p.n); return `after ${p.n} steps: ${x.map((v) => fix(v, 3)).join(' · ')}`; },
              },
              after: r`With $s = 0$ the token cycles A, B, C, A, … with certainty, and the distribution never settles: it rotates forever. This chain is **periodic**. Any chance of staying put breaks the rhythm, and the distribution then flattens out to $\left(\frac13, \frac13, \frac13\right)$.`,
            },
            {
              type: 'interactive',
              title: 'Settle quickly',
              prompt: r`Choose the staying probability $s$ so that after **20 steps** from A, every state's probability is within **0.01** of $\frac13$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 1, grid: false, height: 280, axes: { xlabel: 'steps', ylabel: 'P(at A)', xticks: 5, yticks: 0.25 },
                params: { sv: { min: 0, max: 0.95, step: 0.05, value: 0.95, label: 'stay $s$', color: 'teal', format: (v) => fix(v, 2) } },
                curves: [{ f: () => 1 / 3, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => Array.from({ length: 21 }, (_, n) => s('circle', { cx: plot.X(n), cy: plot.Y(step([1, 0, 0], cyc(p.sv), n)[0]), r: 5, class: 'fl-violet' })),
                readout: (p) => { const x = step([1, 0, 0], cyc(p.sv), 20); return `after 20 steps: largest gap from 1/3 is **${fix(Math.max(...x.map((v) => Math.abs(v - 1 / 3))), 4)}**`; },
                goal: (p) => Math.max(...step([1, 0, 0], cyc(p.sv), 20).map((v) => Math.abs(v - 1 / 3))) < 0.01,
                solution: { sv: 0.5 },
                hint: 'Never staying keeps the cycle going; almost always staying makes the token too slow. Try something in between.',
              },
              explain: r`Anything from about $s = 0.15$ to $0.85$ works, and $s = 0.5$ is fastest. Too little staying and the rotation dies out slowly; too much and the token hardly moves. Shuffling cards, sampling with computers and mixing paint all need chains that forget their start quickly, and **how fast** a chain mixes is a deep research question.`,
            },
            {
              type: 'mcq',
              title: 'Two separate worlds',
              prompt: 'A chain has states {1, 2} and {3, 4}, with no arrows between the two groups. What happens in the long run?',
              choices: [
                { t: 'It depends on the start: a chain starting in {1, 2} stays there forever', ok: true },
                { t: 'It spreads evenly over all four states', why: 'It can never cross between the groups, so it can’t reach the other two states.' },
                { t: 'It ends up in group {3, 4}', why: 'With no arrows from {1, 2} to {3, 4}, a chain in {1, 2} can never get there.' },
              ],
              explain: r`The chain is **reducible**: it's really two separate chains. Each has its own stationary distribution, and the long run depends on where you start. A chain settles to a unique long-run distribution when every state can reach every other (**irreducible**) and it isn't stuck in a fixed rhythm (**aperiodic**).`,
            },
            {
              type: 'mcq',
              title: 'An absorbing state',
              prompt: 'In a board game, the final square has no way out: once there, you stay. What is the long-run distribution?',
              choices: [
                { t: 'All the probability ends up on the final square', ok: true },
                { t: 'Spread evenly over the board', why: 'Probability flows into the final square and never leaves, so it accumulates there.' },
                { t: 'It never settles', why: 'It does settle, on the final square.' },
              ],
              explain: r`A state you can't leave is **absorbing**. If it can be reached from everywhere, the chain ends up there with probability 1. The interesting questions become: how long does it take, and (with several absorbing states) which one wins? That's the next lesson.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Periodic but fair',
              prompt: r`A token alternates deterministically: A, B, A, B, … Its distribution never settles. But over a long time, what **fraction of steps** does it spend at A?`,
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: 1, why: 'It’s at A only every other step.' }, { v: 0, why: 'It visits A every other step.' }],
              explain: r`Exactly half. Even when the distribution oscillates, time averages can still converge, here to the stationary distribution $\left(\frac12, \frac12\right)$, which does satisfy $\pi P = \pi$. Periodicity spoils the convergence of the probabilities, not of the long-run fractions.`,
            },
          ],
          recap: [
            'Periodic chains rotate instead of settling; a little laziness fixes that.',
            'Reducible chains split into separate parts; the start matters.',
            'Absorbing states trap all the probability in the end.',
          ],
        },
      ],
    },
    {
      title: 'Chains at Work',
      summary: 'Games, patterns, search and text.',
      lessons: [
        {
          id: 'absorbing',
          title: 'How Long Until…?',
          summary: 'First-step analysis',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'First-step analysis',
              body: r`How many tosses does it take, on average, to get heads? Call the answer $E$. Toss once: with probability $\frac12$ it's heads and you're done; otherwise you're back where you started, needing $E$ more on average. So
$$E = 1 + \tfrac12 \cdot 0 + \tfrac12 E \quad\Rightarrow\quad E = 2$$
This trick, **first-step analysis**, works for any absorbing Markov chain: write one equation per state ("one step, plus the average of where you land"), and solve.`,
            },
            {
              type: 'numeric',
              title: 'Waiting for a six',
              prompt: r`On average, how many rolls of a fair die does it take to roll a six?`,
              unit: 'rolls',
              answer: 6,
              wrong: [{ v: 3.5, why: 'That’s the average value of a roll, not the waiting time.' }, { v: 5, why: r`Solve $E = 1 + \frac56 E$.` }],
              explain: r`$E = 1 + \frac56 E$ gives $\frac16 E = 1$, so $E = 6$. In general, waiting for an event of probability $p$ takes $\frac1p$ tries on average.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A board game',
              body: r`A short board game: start on square 0 and toss a coin each turn: heads, move 1; tails, move 2. Reach square 12 (★) to finish. Landing on 10 sends you down the snake to 3. The bars show the chance of finishing on each turn, and with first-step analysis we get the average exactly.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 0.35, grid: false, height: 420, padT: 190, axes: { xlabel: 'turn', ylabel: 'P(finish)', xticks: 5, yticks: 0.1 },
                params: { lad: { min: 0, max: 1, step: 1, value: 0, label: 'snake', color: 'coral', format: (v) => (v ? 'removed' : 'on square 10') } },
                under: ({ plot, p, s }) => {
                  const dist = p.lad ? finishDistNoSnake() : finishDist(0);
                  return dist.map((v, i) => s('rect', { x: plot.X(i + 0.65), y: plot.Y(Math.min(v, 0.35)), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(Math.min(v, 0.35)), class: 'fl-blue', opacity: 0.8 }));
                },
                extra: ({ p, s }) => boardDraw(s, 0, { snake: !p.lad }),
                readout: (p) => `average length: **${fix(p.lad ? expectedNoSnake() : expectedTurns(0), 2)}** turns`,
              },
              after: r`Without the snake the game takes about 8.2 turns. The snake more than doubles the average to about 17.6, and stretches out a long tail of very long games: unlucky players can slide down again and again.`,
            },
            {
              type: 'interactive',
              title: 'Place the ladder',
              prompt: r`You may add one **ladder** that climbs 4 squares (from square $a$ up to $a + 4$). Where should its foot go to make the game **as short as possible** on average?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 0.5, grid: false, height: 420, padT: 190, axes: { xlabel: 'turn', ylabel: 'P(finish)', xticks: 5, yticks: 0.1 },
                params: { a: { min: 1, max: 7, step: 1, value: 1, label: 'ladder foot $a$', color: 'green' } },
                under: ({ plot, p, s }) => finishDist(p.a).map((v, i) => s('rect', { x: plot.X(i + 0.65), y: plot.Y(Math.min(v, 0.5)), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(Math.min(v, 0.5)), class: 'fl-blue', opacity: 0.8 })),
                extra: ({ p, s }) => boardDraw(s, p.a),
                readout: (p) => `ladder ${p.a} → ${p.a + 4}: average game **${fix(expectedTurns(p.a), 2)}** turns`,
                goal: (p) => p.a === 7,
                solution: { a: 7 },
                hint: 'Look at what the ladder lets you skip, and where it lands you.',
              },
              explain: r`The ladder from 7 to 11 is best (about 7.5 turns), because it jumps clean over the snake on 10. The ladder from 6 lands **on** square 10, straight onto the snake: the worst choice, over 25 turns! Expected values like these come from solving the first-step equations, one per square.`,
            },
            {
              type: 'numeric',
              title: 'Two hits',
              prompt: r`A video-game boss needs **two** hits. Each turn you hit with probability 0.3. On average, how many turns does the fight last? (2 decimal places.)`,
              unit: 'turns',
              answer: 2 / 0.3,
              tol: 0.01,
              wrong: [{ v: 3.33, tol: 0.01, why: 'That’s the wait for one hit. You need two, one after the other.' }, { v: 0.6, tol: 0.01, why: 'That’s the expected number of hits in two turns. Waiting times use 1/p.' }],
              explain: r`States: "0 hits" and "1 hit". From each, the wait for the next hit is $\frac{1}{0.3} \approx 3.33$ turns. Total: $\frac{2}{0.3} \approx 6.67$ turns. First-step analysis gives $E_1 = 1 + 0.7E_1$ and $E_0 = 1 + 0.7E_0 + 0.3E_1$, with the same answer.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Back to the start',
              prompt: r`A token moves on states 0, 1, 2: from 0 it always moves to 1; from 1 it moves to 2 or back to 0 with probability $\frac12$ each; state 2 is the end. Starting at 0, how many moves does it take on average to reach 2?`,
              unit: 'moves',
              answer: 4,
              wrong: [{ v: 2, why: 'That’s the shortest path. Half the time the token is sent back to 0 from state 1.' }, { v: 3, why: r`Set up the equations: $E_0 = 1 + E_1$ and $E_1 = 1 + \frac12 E_0$.` }],
              explain: r`$E_0 = 1 + E_1$ and $E_1 = 1 + \frac12 \cdot 0 + \frac12 E_0$. Substituting: $E_1 = 1 + \frac12(1 + E_1)$, so $E_1 = 3$ and $E_0 = 4$. Two equations replace an infinite sum over all possible histories.`,
            },
          ],
          recap: [
            'First-step analysis: E = 1 + the average of the E-values where you land.',
            'Waiting for an event of probability p takes 1/p tries on average.',
            'One equation per state gives exact expected times to absorption.',
          ],
        },
        {
          id: 'patterns',
          title: 'Waiting for Patterns',
          summary: 'HH, HT and Penney’s game',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Which comes first on average?',
              body: r`Toss a coin until you see **two heads in a row** (HH). Separately, toss until you see **heads then tails** (HT). Both patterns have probability $\frac14$ at any given spot, so you might expect the same average wait. Here are some sequences, with the first HH and HT marked.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 120, grid: false, axes: false, height: 120,
                params: { seed: { min: 1, max: 40, step: 1, value: 1, label: 'new tosses', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ p, s }) => {
                  const f = flipsOf(p.seed), hh = firstAt(f, 'HH'), ht = firstAt(f, 'HT'), cw = 24, x0 = 12, els = [];
                  f.forEach((c, i) => {
                    els.push(s('rect', { x: x0 + i * cw + 1, y: 40, width: cw - 2, height: 30, rx: 5, class: c === 'H' ? 'fl-amber-soft' : 'fl-surface', stroke: 'var(--line-2)' }));
                    els.push(s('text', { x: x0 + i * cw + cw / 2, y: 61, 'text-anchor': 'middle', class: 'lbl', style: FS(14), text: c }));
                  });
                  if (hh) els.push(s('rect', { x: x0 + (hh - 2) * cw, y: 36, width: 2 * cw, height: 38, rx: 7, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 }), s('text', { x: x0 + (hh - 1) * cw, y: 26, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--coral);${FS(13)}`, text: `HH at ${hh}` }));
                  if (ht) els.push(s('rect', { x: x0 + (ht - 2) * cw, y: 34, width: 2 * cw, height: 42, rx: 7, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 3, 'stroke-dasharray': '5 4' }), s('text', { x: x0 + (ht - 1) * cw, y: 96, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--teal);${FS(13)}`, text: `HT at ${ht}` }));
                  return els;
                },
                readout: () => { const a = AVG(); return `over 4,000 simulated games: HH takes **${fix(a.HH, 2)}** tosses on average, HT **${fix(a.HT, 2)}**`; },
              },
              after: r`HH takes about **6** tosses on average, HT only about **4**! The patterns overlap differently. After a head, a miss for HT (another head) still leaves you one step away; a miss for HH (a tail) sends you right back to the start.`,
            },
            {
              type: 'numeric',
              title: 'Waiting for HT',
              prompt: r`Use the chain: to get HT, first wait for an H (2 tosses on average). After that, you're in state "have H": each toss either gives T (done) or H (still in state "have H"). How many tosses does the whole wait take on average?`,
              unit: 'tosses',
              answer: 4,
              wrong: [{ v: 6, why: 'That’s HH. For HT, a second head doesn’t set you back.' }, { v: 3, why: 'From state “have H”, waiting for the T takes 2 tosses on average, not 1.' }],
              explain: r`Wait for H: 2 tosses. Then wait for T, ignoring further heads: another 2. Total $2 + 2 = 4$.`,
            },
            {
              type: 'numeric',
              title: 'Waiting for HH',
              prompt: r`For HH, let $E_0$ = average tosses from scratch and $E_1$ = average from state "just had H". Then $E_0 = 1 + \frac12 E_1 + \frac12 E_0$ and $E_1 = 1 + \frac12 \cdot 0 + \frac12 E_0$. Solve for $E_0$.`,
              unit: 'tosses',
              answer: 6,
              wrong: [{ v: 4, why: 'That’s HT. Here a tail after H sends you back to the start.' }, { v: 3, why: r`Substitute $E_1 = 1 + \frac12E_0$ into the first equation: $\frac12E_0 = 1 + \frac12 + \frac14E_0$.` }],
              explain: r`From the first equation, $\frac12E_0 = 1 + \frac12E_1$, so $E_0 = 2 + E_1$. Substituting $E_1 = 1 + \frac12E_0$: $E_0 = 3 + \frac12E_0$, giving $E_0 = 6$ and $E_1 = 4$. (For HHH the same method gives 14.)`,
            },
            {
              type: 'interactive',
              title: 'Penney’s game',
              prompt: r`Your opponent picks **HHH**. You pick a different three-toss pattern, and the coin is tossed until one of the two patterns appears. Choose the pattern that gives you the **best** chance of winning.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 7, ymin: 0, ymax: 1, grid: false, height: 260, axes: { ylabel: 'your chance of winning', yticks: 0.25, xticks: 0 },
                params: { k: { min: 0, max: 6, step: 1, value: 0, label: 'your pattern', color: 'violet', format: (v) => PATS[v] } },
                under: ({ plot, p, s }) => PATS.flatMap((pt, i) => { const v = penney(pt, 'HHH'); return [s('rect', { x: plot.X(i + 0.2), y: plot.Y(v), width: plot.X(0.6) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 4, class: i === p.k ? 'fl-violet' : 'fl-surface', stroke: i === p.k ? 'none' : 'var(--line-2)' })]; }),
                extra: ({ plot, s }) => PATS.map((pt, i) => s('text', { x: plot.X(i + 0.5), y: plot.Y(0) + 20, 'text-anchor': 'middle', class: 'lbl', style: FS(13), text: pt })),
                readout: (p) => `${PATS[p.k]} beats HHH with probability **${fix(penney(PATS[p.k], 'HHH'), 3)}**`,
                goal: (p) => PATS[p.k] === 'THH',
                solution: { k: 3 },
                hint: 'Think about how HHH can happen. Unless it happens in the first three tosses, what must come just before it?',
              },
              explain: r`**THH** wins with probability $\frac78$. Unless the very first three tosses are HHH (probability $\frac18$), the first HHH must be preceded by a T, and that T followed by HH completes THH **first**. Overlap, not frequency, decides these races.`,
            },
            {
              type: 'mcq',
              title: 'Rock, paper, scissors',
              prompt: 'In Penney’s game, is there one best pattern that beats all the others?',
              choices: [
                { t: 'No: whatever pattern you choose, there’s another that beats it more than half the time', ok: true },
                { t: 'Yes: THH beats everything', why: 'THH beats HHH, but TTH beats THH (with probability 2/3).' },
                { t: 'Yes: all patterns are equally likely, so they tie', why: 'Equally likely at any position doesn’t mean equally likely to come first in a race.' },
              ],
              explain: r`Penney's game is **non-transitive**, like rock-paper-scissors: THH beats HHT, HHT beats HTT, HTT beats TTH, and TTH beats THH. So the second player always has the advantage, which is how this coin game can con people who choose first.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Against HHT',
              prompt: r`If your opponent picks **HHT**, the best reply is **THH**. What is the probability that THH appears first? (2 decimal places.)`,
              answer: penney('THH', 'HHT'),
              tol: 0.006,
              wrong: [{ v: 0.875, tol: 0.006, why: 'That’s against HHH. Against HHT, THH wins less often.' }, { v: 0.5, why: 'The race isn’t even: overlaps favour one pattern.' }],
              explain: r`$\frac34$. HHT can only win if the tosses **start** with HH (probability $\frac14$): then HHT is certain to come before THH, since the run of heads ends in HHT. Otherwise, the first HH is preceded by a T, so THH completes first. There's a lovely general method by John Conway for any pair of patterns.`,
            },
          ],
          recap: [
            'Average waits: HT takes 4 tosses, HH 6, HHH 14.',
            'How a pattern overlaps itself decides how long it takes to appear.',
            'Penney’s game is non-transitive: every pattern can be beaten.',
          ],
        },
        {
          id: 'pagerank',
          title: 'PageRank',
          summary: 'The random surfer',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Ranking the web',
              body: r`In 1998, Sergey Brin and Larry Page ranked web pages by imagining a **random surfer**. On each page, the surfer clicks one of its links at random. With probability $1 - d$ (typically $d = 0.85$), they get bored and jump to a random page anywhere.

That's a Markov chain on web pages. A page's **PageRank** is its stationary probability: the fraction of time the surfer spends there. Pages linked from many pages, or from important pages, rank high. Google's first search engine was built on this.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A web of five pages',
              body: r`Arrows are links. The violet number under each page is its PageRank. Change the damping factor $d$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 260, grid: false, axes: false, height: 260,
                params: { d: { min: 0.05, max: 0.95, step: 0.05, value: 0.85, label: 'damping $d$', color: 'violet', format: (v) => fix(v, 2) } },
                extra: ({ p, s }) => webDraw(s, WEB.links, pagerank(WEB.links, p.d)),
                readout: (p) => { const rk = pagerank(WEB.links, p.d); return `highest: page **${WEB.names[rk.indexOf(Math.max(...rk))]}** · ranks add up to ${fix(rk.reduce((a, b) => a + b, 0), 2)}`; },
              },
              after: r`C ranks highest: three pages link to it. A is close behind with just **one** incoming link, because it's from C, the top page, which links nowhere else: C passes all its rank to A. With low damping the surfer mostly jumps at random, and every page approaches $\frac15$.`,
            },
            { /*anim:markov*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The random surfer',
              body: r`A {coral:surfer} wanders the same web: at each step, 85% of the time it clicks a random link on its page, and 15% of the time it jumps to a random page. The number under each page is now the **fraction of its visits** so far. It starts slowly, then speeds up.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 260, grid: false, axes: false, height: 260,
                animate: { param: 't', speed: 1, max: 34, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { pages, counts } = surfRun(), h = surfHop(p.t), k = Math.floor(h), c = counts[k], tot = k + 1;
                  const els = webDraw(s, WEB.links, c.map((v) => v / tot));
                  const a = WEB.xy[pages[k]], b = WEB.xy[pages[Math.min(12000, k + 1)]], f = k < 20 ? Math.min(1, Math.max(0, ((h - k) - 0.3) / 0.5)) : 0;
                  // the surfer rides just above its page, but never above the top of the drawing (page B is near the top)
                  els.push(s('circle', { cx: a[0] + (b[0] - a[0]) * f, cy: Math.max(plot.Y(260) + 9, a[1] + (b[1] - a[1]) * f - 30), r: 8, class: 'fl-coral' }));
                  return els;
                },
                readout: (p) => { const { counts } = surfRun(), k = Math.floor(surfHop(p.t)), rk = pagerank(WEB.links, 0.85); let gap = 0; counts[k].forEach((v, i) => { gap = Math.max(gap, Math.abs(v / (k + 1) - rk[i])); }); return `${k} clicks · largest difference from the PageRanks: ${fix(gap, 3)}`; },
              },
              after: r`At first the visit fractions jump around, but as the clicks pile up they settle onto exactly the PageRanks from before (C about 0.35, A about 0.33). That's the meaning of a stationary distribution: the long-run share of time a random walker spends in each state, whatever page it started on.`,
            },
            {
              type: 'interactive',
              title: 'Get a good link',
              prompt: r`You run page **E**. You can persuade **one** of the pages A, B or C to add a link to you. Which one raises E's PageRank the most?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 260, grid: false, axes: false, height: 260,
                params: { k: { min: 0, max: 2, step: 1, value: 0, label: 'link from', color: 'coral', format: (v) => 'ABC'[v] } },
                extra: ({ p, s }) => { const L = WEB.links.map((x) => x.slice()); L[p.k].push(4); return webDraw(s, L, pagerank(L), p.k); },
                readout: (p) => { const L = WEB.links.map((x) => x.slice()); L[p.k].push(4); return `E's PageRank: **${fix(pagerank(L)[4], 3)}** (was ${fix(pagerank(WEB.links)[4], 3)})`; },
                goal: (p) => p.k === 2,
                solution: { k: 2 },
                hint: 'A link is worth more from a high-ranking page that has few other links.',
              },
              explain: r`A link from **C** lifts E from about 0.067 to 0.248. C is the highest-ranked page and has only one other link, so E gets half of C's vote. A link from B is weaker: B ranks low. This is why links from respected sites are so valuable, and why people try to fake them.`,
            },
            {
              type: 'numeric',
              title: 'A page nobody links to',
              prompt: r`With $n = 5$ pages and damping $d = 0.85$, a page with **no** incoming links can only be reached by a random jump. What is its PageRank? (Each jump picks one of the $n$ pages; jumps happen a fraction $1 - d$ of the time.)`,
              answer: 0.15 / 5,
              tol: 0.0005,
              wrong: [{ v: 0, why: 'Random jumps can land anywhere, including on pages with no links in.' }, { v: 0.15, tol: 0.001, why: 'That’s the total jump probability, shared among all 5 pages.' }],
              explain: r`$\frac{1 - d}{n} = \frac{0.15}{5} = 0.03$, the minimum possible PageRank. The random jump guarantees every page is reachable, which makes the chain irreducible and aperiodic: a unique stationary distribution exists.`,
            },
            {
              type: 'mcq',
              title: 'Why jump at all?',
              prompt: 'What would go wrong with a random surfer who never jumps ($d = 1$)?',
              choices: [
                { t: 'They could get stuck in a group of pages that only link to each other, or at a page with no links out', ok: true },
                { t: 'Nothing: the ranks would just be more accurate', why: 'Without jumps the chain can be reducible or have dead ends, and the ranks may not be well defined.' },
                { t: 'The surfer would visit every page equally often', why: 'Links are uneven, so visits are too, and some pages might never be reached at all.' },
              ],
              explain: r`Real webs have **dead ends** and **traps** (clusters with no links out). Without random jumps, all the probability can drain into them: exactly the reducible-chain problem from earlier. Damping keeps the chain well behaved and the ranks unique.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Link farms',
              prompt: 'A spammer creates 1,000 pages that all link to their shop. Why doesn’t this buy a high PageRank?',
              choices: [
                { t: 'The fake pages have almost no rank themselves (no one links to them), so their votes are nearly worthless', ok: true },
                { t: 'PageRank only counts the first link to each page', why: 'Every link counts, weighted by the rank of the page it comes from.' },
                { t: 'Search engines ignore pages with many links', why: 'Popular pages have many links. The defence is in how links are weighted.' },
              ],
              explain: r`Each fake page gets only the minimum rank $\frac{1 - d}{n}$ from random jumps, and passes on a fraction $d$ of it. So a link farm adds a little, not a lot. (Real search engines added many more signals over the years, partly because spammers kept finding cleverer tricks.)`,
            },
          ],
          recap: [
            'PageRank = stationary distribution of a random surfer.',
            'Links from high-ranked pages with few links are worth most.',
            'Random jumps (damping) make the chain irreducible: unique ranks.',
          ],
        },
        {
          id: 'text',
          title: 'Writing with Chains',
          summary: 'Words that follow words',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'A chain of words',
              body: r`In 1948, Claude Shannon generated text by a Markov chain on **words**: pick each next word at random, with the probabilities it follows the current word in real text. Here's a tiny training text:

*the cat sat on the mat . the dog sat on the log . the cat saw the dog .*

After "the", the next word is cat (2 times), dog (2), mat (1) or log (1). After "sat" it's always "on".`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Babbling',
              body: r`Each sentence below starts with "the" and follows the chain until it reaches a full stop. Generate a few.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 150,
                params: { seed: { min: 1, max: 60, step: 1, value: 1, label: 'new sentence', color: 'blue', format: (v) => `#${v}` } },
                extra: (ctx) => sentence(ctx, shown(babble(ctx.p.seed))),
                readout: (p) => { const b = babble(p.seed); return b.endsWith('…') ? 'still going after 16 words: cut off here' : SENTENCES.has(b) ? 'this sentence is in the training text' : '**new**: this sentence never appears in the training text'; },
              },
              after: r`Every pair of neighbouring words appeared in the training text, so the output sounds locally right. But the chain has no idea what it's saying: it can produce "the cat sat on the dog sat on the mat", wandering in loops. With a memory of one word, it can't keep track of a sentence.`,
            },
            {
              type: 'numeric',
              title: 'A transition probability',
              prompt: r`In the training text, what is the probability that "the" is followed by "cat"?`,
              answer: 1 / 3,
              tol: 0.002,
              wrong: [{ v: 0.5, why: 'Count every word that follows "the": cat, mat, dog, log, cat, dog (6 in all).' }, { v: 0.25, why: r`Four different words follow "the", but not equally often: cat appears 2 times out of 6.` }],
              explain: r`"the" is followed 6 times: cat twice, dog twice, mat once and log once. So $P(\text{cat} \mid \text{the}) = \frac26 = \frac13$. Counting pairs like this is how the chain is "trained".`,
            },
            {
              type: 'numeric',
              title: 'A whole sentence',
              prompt: r`Starting from "the", what's the probability the chain generates exactly "the cat sat on the mat ." ? Multiply: $P(\text{cat}|\text{the}) \cdot P(\text{sat}|\text{cat}) \cdot P(\text{on}|\text{sat}) \cdot P(\text{the}|\text{on}) \cdot P(\text{mat}|\text{the}) \cdot P(.|\text{mat})$. (4 decimal places.)`,
              answer: 1 / 36,
              tol: 0.0004,
              wrong: [{ v: 1 / 6, tol: 0.001, why: r`Don't forget $P(\text{sat}|\text{cat}) = \frac12$ ("cat" is followed by "sat" once and "saw" once) and $P(\text{mat}|\text{the}) = \frac16$.` }, { v: 1 / 18, tol: 0.001, why: r`$P(\text{mat}|\text{the}) = \frac16$, not $\frac13$.` }],
              explain: r`$\frac13 \times \frac12 \times 1 \times 1 \times \frac16 \times 1 = \frac{1}{36} \approx 0.028$. A sentence's probability is the product along its path, exactly as for weather sequences.`,
            },
            {
              type: 'interactive',
              title: 'Something new',
              prompt: r`Find a generated sentence that **doesn't** appear in the training text, but is grammatical and sensible (it's fine if it's a bit odd). Try the sentence slider until the readout says **new**, and the sentence ends in four to six words.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 150,
                params: { seed: { min: 1, max: 60, step: 1, value: 7, label: 'sentence', color: 'blue', format: (v) => `#${v}` } },
                extra: (ctx) => sentence(ctx, shown(babble(ctx.p.seed))),
                readout: (p) => { const b = babble(p.seed), n = b.split(' ').length; return b.endsWith('…') ? 'too long: cut off' : `${SENTENCES.has(b) ? 'in the training text' : '**new**'} · ${n} words`; },
                goal: (p) => { const b = babble(p.seed), n = b.split(' ').length; return !b.endsWith('…') && !SENTENCES.has(b) && n >= 4 && n <= 6; },
                solution: { seed: 4 },
                hint: 'Short new sentences mix two training sentences, like a cat on a log.',
              },
              explain: r`Sentences like "the dog sat on the mat" or "the cat sat on the log" are new combinations of familiar pieces. That's the creative side of these chains, and also their weakness: they recombine without understanding.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Longer memories',
              prompt: 'What happens if the chain remembers the previous **two** words instead of one, trained on this same tiny text?',
              choices: [
                { t: 'It mostly just repeats the training sentences: there’s too little text for longer contexts to have more than one continuation', ok: true },
                { t: 'It writes more varied and creative sentences', why: 'With a longer memory, almost every two-word context has only one continuation in this tiny text.' },
                { t: 'It can no longer produce any sentence', why: 'Every context it reaches did appear in the training text, so it always has a next word.' },
              ],
              explain: r`Longer memory gives more coherent text but needs vastly more training data, since each longer context appears more rarely. Phone keyboards use short chains to suggest your next word. Modern AI language models are a far more powerful descendant of the same goal, predicting the next word, using neural networks that can take thousands of previous words into account.`,
            },
          ],
          recap: [
            'A word-level Markov chain picks each word from those that followed the last one.',
            'Transition probabilities come from counting word pairs.',
            'Longer memories give more coherent text but need far more data.',
          ],
        },
      ],
    },
  ],
};

// the board game without its snake, for comparison
function finishDistNoSnake(T = 40) {
  let x = new Array(BOARD_N + 1).fill(0);
  x[0] = 1;
  const out = [];
  for (let t = 1; t <= T; t++) {
    const y = new Array(BOARD_N + 1).fill(0);
    for (let sq = 0; sq < BOARD_N; sq++) if (x[sq]) { y[Math.min(BOARD_N, sq + 1)] += x[sq] / 2; y[Math.min(BOARD_N, sq + 2)] += x[sq] / 2; }
    out.push(y[BOARD_N]);
    y[BOARD_N] = 0;
    x = y;
  }
  return out;
}
function expectedNoSnake() {
  const E = new Array(BOARD_N + 2).fill(0);
  for (let sq = BOARD_N - 1; sq >= 0; sq--) E[sq] = 1 + 0.5 * E[Math.min(BOARD_N, sq + 1)] + 0.5 * E[Math.min(BOARD_N, sq + 2)];
  return E[0];
}
