import { fix } from '../lib/svg.js';
const r = String.raw;

// ── trefoil knot diagram: find crossings numerically, alternate over/under, split into 3 arcs ──
const TX = (t) => Math.sin(t) + 2 * Math.sin(2 * t);
const TY = (t) => Math.cos(t) - 2 * Math.cos(2 * t);
const TREFOIL = (() => {
  const N = 720, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = (2 * Math.PI * i) / N;
    pts.push([TX(t), TY(t), t]);
  }
  const hits = [];
  const seg = (i) => [pts[i], pts[i + 1]];
  for (let i = 0; i < N; i++) {
    for (let j = i + 2; j < N; j++) {
      if (i === 0 && j === N - 1) continue;
      const [[x1, y1, t1], [x2, y2]] = seg(i), [[x3, y3, t3], [x4, y4]] = seg(j);
      const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
      if (Math.abs(d) < 1e-12) continue;
      const u = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
      const v = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
      if (u >= 0 && u < 1 && v >= 0 && v < 1) hits.push([t1 + (u * 2 * Math.PI) / N, t3 + (v * 2 * Math.PI) / N]);
    }
  }
  const occ = hits.flat().sort((a, b) => a - b); // 6 passes through crossings, in order along the curve
  const unders = occ.filter((_, k) => k % 2 === 1); // alternate: over, under, over, under…
  // arcs run from one under-pass to the next
  const arcs = unders.map((u, k) => [u, k + 1 < unders.length ? unders[k + 1] : unders[0] + 2 * Math.PI]);
  return { arcs, crossings: hits };
})();
const COLS = ['coral', 'blue', 'teal'];
const NAMES = ['coral', 'blue', 'teal'];

// ── morphing a polygon or star into a circle ──
const polyR = (n, th) => { const a = (2 * Math.PI) / n, m = ((th % a) + a) % a; return Math.cos(Math.PI / n) / Math.cos(m - Math.PI / n); };
const SHAPES = [
  { name: 'square', r: (th) => polyR(4, th - Math.PI / 4) },
  { name: 'triangle', r: (th) => polyR(3, th - Math.PI / 2) },
  { name: 'star', r: (th) => 0.62 + 0.38 * Math.cos(5 * (th - Math.PI / 2)) },
];
const morphR = (p, th) => (1 - p.t) * SHAPES[p.shape].r(th) + p.t * 0.85;

// ── a paper band with k half-twists, viewed from above at an angle ──
const BAND_W = 0.45;
const band = (k, u, v) => { const c = Math.cos((k * (u - Math.PI / 2)) / 2), sn = Math.sin((k * (u - Math.PI / 2)) / 2), r = 1 + v * BAND_W * c; return [r * Math.cos(u), r * Math.sin(u), v * BAND_W * sn]; };
const view = ([x, y, z]) => [x, 0.5 * y + 0.85 * z, y]; // screen x, screen y, depth (larger = further away)
const bandExtra = ({ plot, s }, k, bugT) => {
  const n = 120, quads = [];
  for (let i = 0; i < n; i++) {
    const u0 = (2 * Math.PI * i) / n, u1 = (2 * Math.PI * (i + 1)) / n;
    for (const [v0, v1] of [[-1, 0], [0, 1]]) {
      const P = [band(k, u0, v0), band(k, u1, v0), band(k, u1, v1), band(k, u0, v1)].map(view);
      const area = (P[1][0] - P[0][0]) * (P[3][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[3][0] - P[0][0]);
      quads.push({ P, depth: (P[0][2] + P[1][2] + P[2][2] + P[3][2]) / 4, front: area > 0, edge: v0 === -1 ? [P[0], P[1]] : [P[3], P[2]] });
    }
  }
  quads.sort((a, b) => b.depth - a.depth);
  const pt = (q) => `${plot.X(q[0]).toFixed(1)} ${plot.Y(q[1]).toFixed(1)}`;
  const els = quads.map(({ P, front, edge }) => {
    const fill = front ? 'var(--blue-soft)' : 'var(--coral-soft)';
    return s('g', {}, [
      s('path', { d: `M${P.map(pt).join('L')}Z`, fill, stroke: fill, 'stroke-width': 1 }),
      s('path', { d: `M${pt(edge[0])}L${pt(edge[1])}`, stroke: 'var(--amber)', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    ]);
  });
  if (bugT !== undefined) {
    let d = '';
    for (let i = 0; i <= 200; i++) d += `${i ? 'L' : 'M'}${pt(view(band(k, (bugT * i) / 200, 1)))}`;
    els.push(s('path', { d, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    const [bx, by] = view(band(k, 0, 1));
    els.push(s('circle', { cx: plot.X(bx), cy: plot.Y(by), r: 5, fill: 'var(--card)', stroke: 'var(--coral)', 'stroke-width': 2.5 }));
    const [x, y] = view(band(k, bugT, 1));
    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 8, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2.5 }));
  }
  return els;
};

// ── a square with glued edges: single arrows (bottom/top) and double arrows (left/right) ──
const glueArrows = ({ plot, s }, kleinFlip) => {
  const head = (x, y, dx, dy) => { const X = plot.X(x), Y = plot.Y(y), L = 9; return `M${X - dx * L - dy * L * 0.7} ${Y + dy * L - dx * L * 0.7}L${X} ${Y}L${X - dx * L + dy * L * 0.7} ${Y + dy * L + dx * L * 0.7}`; };
  let d = head(0.55, 0, 1, 0) + head(0.55, 1, 1, 0);
  d += head(0, 0.5, 0, 1) + head(0, 0.58, 0, 1);
  d += kleinFlip ? head(1, 0.5, 0, -1) + head(1, 0.42, 0, -1) : head(1, 0.5, 0, 1) + head(1, 0.58, 0, 1);
  return [
    s('rect', { x: plot.X(0), y: plot.Y(1), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1), fill: 'var(--surface-2)', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
    s('path', { d, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ];
};
// path of a ship in the glued square [0,1]²; with klein, crossing the left/right edges flips it top-to-bottom
const shipPath = (x0, y0, th, dist, klein) => {
  let x = x0, y = y0, dx = Math.cos(th), dy = Math.sin(th), flip = false;
  const segs = [[[x, y]]], step = 0.004;
  for (let d = 0; d < dist - 1e-9; d += step) {
    const h = Math.min(step, dist - d);
    x += dx * h; y += dy * h;
    let wrap = false;
    if (x >= 1 - 1e-12 || x < 0) { x = x >= 1 - 1e-12 ? x - 1 : x + 1; wrap = true; if (klein) { y = 1 - y; dy = -dy; flip = !flip; } }
    if (y >= 1 || y < 0) { y = y >= 1 ? y - 1 : y + 1; wrap = true; }
    if (wrap) segs.push([]);
    segs[segs.length - 1].push([x, y]);
  }
  return { segs, x, y, dx, dy, flip };
};
const shipExtra = (ctx, x0, y0, th, dist, klein) => {
  const { plot, s } = ctx, P = shipPath(x0, y0, th, dist, klein);
  const d = P.segs.filter((g) => g.length > 1).map((g) => 'M' + g.map(([x, y]) => `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('L')).join('');
  // the ship is a letter F: its "up" direction is perpendicular to its heading, reversed when mirrored
  const f = [P.dx, P.dy], g = [-P.dy * (P.flip ? -1 : 1), P.dx * (P.flip ? -1 : 1)], sz = 0.055;
  const loc = (a, b) => `${plot.X(P.x + sz * (a * f[0] + b * g[0])).toFixed(1)} ${plot.Y(P.y + sz * (a * f[1] + b * g[1])).toFixed(1)}`;
  return [
    ...glueArrows(ctx, klein),
    s('path', { d, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    s('circle', { cx: plot.X(x0), cy: plot.Y(y0), r: 5, fill: 'var(--card)', stroke: 'var(--coral)', 'stroke-width': 2.5 }),
    s('path', { d: `M${loc(-0.3, -1)}L${loc(-0.3, 1)}L${loc(0.5, 1)}M${loc(-0.3, 0.1)}L${loc(0.3, 0.1)}`, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ];
};

// ── figure-eight knot: x = (2 + cos 2t) cos 3t, y = (2 + cos 2t) sin 3t, height z = sin 4t ──
const FX = (t) => (2 + Math.cos(2 * t)) * Math.cos(3 * t), FY = (t) => (2 + Math.cos(2 * t)) * Math.sin(3 * t), FZ = (t) => Math.sin(4 * t);
const FIG8 = (() => {
  const N = 1440, pts = [];
  for (let i = 0; i <= N; i++) { const t = (2 * Math.PI * i) / N; pts.push([FX(t), FY(t), t]); }
  const hits = [];
  for (let i = 0; i < N; i++) for (let j = i + 2; j < N; j++) {
    if (i === 0 && j === N - 1) continue;
    const [x1, y1, t1] = pts[i], [x2, y2] = pts[i + 1], [x3, y3, t3] = pts[j], [x4, y4] = pts[j + 1];
    const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
    if (Math.abs(d) < 1e-12) continue;
    const u = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d, v = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
    if (u >= 0 && u < 1 && v >= 0 && v < 1) { const a = t1 + (u * 2 * Math.PI) / N, b = t3 + (v * 2 * Math.PI) / N; hits.push(FZ(a) > FZ(b) ? { over: a, under: b } : { over: b, under: a }); }
  }
  const unders = hits.map((h) => h.under).sort((a, b) => a - b);
  const arcs = unders.map((u, k) => [u, k + 1 < unders.length ? unders[k + 1] : unders[0] + 2 * Math.PI]);
  const arcOf = (t) => arcs.findIndex(([a, b]) => (t >= a && t < b) || (t + 2 * Math.PI >= a && t + 2 * Math.PI < b));
  // each crossing: [over arc, incoming under arc, outgoing under arc]
  const crossings = hits.map(({ over, under }) => { const k = unders.indexOf(under); return [arcOf(over), (k + arcs.length - 1) % arcs.length, k]; });
  return { arcs, crossings };
})();

// ── vector fields with a zero at the origin, and the index of a loop around a point ──
const FIELDS = [
  { name: 'source', f: (x, y) => [x, y] },
  { name: 'sink', f: (x, y) => [-x, -y] },
  { name: 'vortex', f: (x, y) => [-y, x] },
  { name: 'saddle', f: (x, y) => [x, -y] },
  { name: 'dipole', f: (x, y) => [x * x - y * y, 2 * x * y] },
  { name: 'monkey saddle', f: (x, y) => [x * x - y * y, -2 * x * y] },
];
const fieldIndex = (f, cx, cy, r) => {
  let tot = 0, prev = null;
  for (let i = 0; i <= 720; i++) {
    const t = (2 * Math.PI * i) / 720, [u, v] = f(cx + r * Math.cos(t), cy + r * Math.sin(t)), a = Math.atan2(v, u);
    if (prev !== null) { let d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; tot += d; }
    prev = a;
  }
  return Math.round(tot / (2 * Math.PI));
};
const fieldExtra = ({ plot, s, arrow }, f, cx, r) => {
  const els = [], L = 0.32;
  for (let x = -3; x <= 3.01; x += 0.6) for (let y = -3; y <= 3.01; y += 0.6) {
    const [u, v] = f(x, y), m = Math.hypot(u, v);
    if (m < 1e-9) continue;
    els.push(arrow(plot.X(x - (L * u) / m / 2), plot.Y(y - (L * v) / m / 2), plot.X(x + (L * u) / m / 2), plot.Y(y + (L * v) / m / 2), { color: 'var(--ink-3)', width: 2, head: 7 }));
  }
  els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(0), r: plot.X(r) - plot.X(0), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
  for (let i = 0; i < 12; i++) {
    const t = (2 * Math.PI * i) / 12, x = cx + r * Math.cos(t), y = r * Math.sin(t), [u, v] = f(x, y), m = Math.hypot(u, v);
    if (m < 1e-9) continue;
    els.push(arrow(plot.X(x), plot.Y(y), plot.X(x + (0.5 * u) / m), plot.Y(y + (0.5 * v) / m), { color: 'var(--coral)', width: 3, head: 9 }));
  }
  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-ink' }));
  return els;
};

// ── fixed points of a piecewise-linear function through (0,y0), (¼,y1), …, (1,y4) ──
const pwY = (p) => [p.y0, p.y1, p.y2, p.y3, p.y4];
const pwF = (x, p) => { const ys = pwY(p), i = Math.min(3, Math.floor(x * 4)), u = x * 4 - i; return ys[i] + (ys[i + 1] - ys[i]) * u; };
const pwFixed = (p) => {
  const ys = pwY(p), g = ys.map((y, k) => y - k / 4), out = [];
  for (let k = 0; k < 5; k++) if (Math.abs(g[k]) < 1e-9) out.push(k / 4);
  for (let k = 0; k < 4; k++) {
    if (Math.abs(g[k]) < 1e-9 && Math.abs(g[k + 1]) < 1e-9) return null; // a whole segment on the diagonal
    if (g[k] * g[k + 1] < 0 && Math.abs(g[k]) > 1e-9 && Math.abs(g[k + 1]) > 1e-9) out.push(k / 4 + (0.25 * g[k]) / (g[k] - g[k + 1]));
  }
  return out.sort((a, b) => a - b);
};

// ── a map of a square park, shrunk, turned and dropped inside the park ──
const PARK = { pond: [1.1, 2.9, 0.55], path: [[0, 0.9], [1.2, 1.3], [2.4, 1.1], [4, 2.3]], trees: [[3, 3.2], [3.4, 2.8], [2.7, 3.5], [0.6, 0.4]] };
const mapPt = (p, [x, y]) => { const a = (p.th * Math.PI) / 180, X = x - 2, Y = y - 2; return [p.cx + p.s * (X * Math.cos(a) - Y * Math.sin(a)), p.cy + p.s * (X * Math.sin(a) + Y * Math.cos(a))]; };
const mapFixed = (p) => {
  const a = (p.th * Math.PI) / 180, dr = 1 - p.s * Math.cos(a), di = -p.s * Math.sin(a), nr = p.cx - 2, ni = p.cy - 2, den = dr * dr + di * di;
  return [2 + (nr * dr + ni * di) / den, 2 + (ni * dr - nr * di) / den];
};
const parkDraw = ({ plot, s }, T, strong) => {
  const P = (q) => { const [x, y] = T(q); return `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; };
  const w = strong ? 2.5 : 2, els = [];
  els.push(s('path', { d: `M${P([0, 0])}L${P([4, 0])}L${P([4, 4])}L${P([0, 4])}Z`, fill: strong ? 'var(--card)' : 'var(--teal-soft)', stroke: strong ? 'var(--ink)' : 'var(--teal)', 'stroke-width': w, opacity: strong ? 0.92 : 1 }));
  let pond = '';
  for (let i = 0; i <= 40; i++) { const t = (2 * Math.PI * i) / 40; pond += `${i ? 'L' : 'M'}${P([PARK.pond[0] + PARK.pond[2] * Math.cos(t), PARK.pond[1] + PARK.pond[2] * Math.sin(t)])}`; }
  els.push(s('path', { d: pond + 'Z', fill: 'var(--blue-soft)', stroke: 'var(--blue)', 'stroke-width': w }));
  els.push(s('path', { d: 'M' + PARK.path.map(P).join('L'), fill: 'none', stroke: 'var(--amber)', 'stroke-width': strong ? 3 : 5, 'stroke-linecap': 'round' }));
  for (const t of PARK.trees) { const [x, y] = T(t); els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: strong ? 4 : 9, class: 'fl-green' })); }
  return els;
};

// a park 4 by 3; the map is the park shrunk by k, turned by θ, and laid with its centre at m
const parkMap = (t) => { const th = 0.5 + 0.9 * Math.sin(0.31 * t), k = 0.36, mx = 2 + 0.9 * Math.cos(0.23 * t), my = 1.5 + 0.6 * Math.sin(0.41 * t); return { th, k, mx, my }; };
const parkT = ({ th, k, mx, my }, [x, y]) => { const dx = x - 2, dy = y - 1.5, c = k * Math.cos(th), s = k * Math.sin(th); return [mx + c * dx - s * dy, my + s * dx + c * dy]; };
const parkFixed = (m) => { let z = [2, 1.5]; for (let i = 0; i < 60; i++) z = parkT(m, z); return z; };

export default {
  id: 'topology',
  subject: 'math',
  title: 'Topology',
  level: 'Advanced',
  cover: 'topology',
  tagline: 'Rubber-sheet geometry: holes, twists, knots, hairy balls and fixed points.',
  description: r`In topology, a coffee mug and a doughnut are the same shape. Explore what survives stretching and bending: holes, one-sided surfaces like the Möbius strip, the Euler characteristic, knots that can't be untied, the theorem that says you can't comb a hairy ball flat, worlds built by gluing the edges of a square, and why every map of a park laid inside that park has one point exactly over the spot it shows.`,
  prereq: 'Graph Theory',
  chapters: [
    {
      title: 'Stretchy Shapes',
      summary: 'What survives bending.',
      lessons: [
        {
          id: 'rubber',
          title: 'Rubber-Sheet Geometry',
          summary: 'A mug is a doughnut',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Forget lengths and angles',
              body: r`In **topology**, shapes are made of infinitely stretchy rubber. You may stretch, squash, bend and twist them, but not **tear**, **cut** or **glue**. Two shapes are the same (**homeomorphic**) if one can be deformed into the other.

So a cube is the same as a sphere, and a coffee mug (one hole, in the handle) is the same as a doughnut. Topologists joke that they can't tell their breakfast from their coffee.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Squashing into a circle',
              body: r`A square, a triangle and a star are all the same to a topologist: each can be smoothly deformed into a circle. Choose a shape and slide the deformation. The coloured dots show that every point has a partner on the circle: nothing tears or overlaps.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 380,
                params: {
                  shape: { min: 0, max: 2, step: 1, value: 0, label: 'shape', color: 'violet', format: (v) => SHAPES[v].name },
                  t: { min: 0, max: 1, step: 0.01, value: 0, label: 'deform', color: 'teal', format: (v) => `${Math.round(v * 100)}%` },
                },
                curves: [{ param: { x: (th, p) => morphR(p, th) * Math.cos(th), y: (th, p) => morphR(p, th) * Math.sin(th), t0: 0, t1: 2 * Math.PI }, color: 'violet', width: 3.5, n: 400 }],
                points: ['coral', 'amber', 'teal', 'blue', 'pink', 'green', 'coral', 'amber'].map((c, k) => ({ x: (p) => morphR(p, (k * Math.PI) / 4 + 0.3) * Math.cos((k * Math.PI) / 4 + 0.3), y: (p) => morphR(p, (k * Math.PI) / 4 + 0.3) * Math.sin((k * Math.PI) / 4 + 0.3), color: c })),
                readout: (p) => (p.t === 1 ? `The ${SHAPES[p.shape].name} has become a circle ✓` : p.t === 0 ? `A ${SHAPES[p.shape].name}: corners and straight sides…` : '…which don’t matter in topology'),
              },
              after: r`Corners, straight edges and lengths all vanish in topology. A **homeomorphism** is exactly this kind of continuous, reversible deformation: nearby points stay nearby, and no two points are merged. What can't vanish is a **hole**: no deformation turns a circle into a filled disc or into a figure 8.`,
            },
            {
              type: 'mcq',
              title: 'Letters',
              prompt: r`Treat capital letters as shapes made of thin wire. Which letter is topologically the same as **O**?`,
              cols: 2,
              choices: [
                { t: 'D', ok: true },
                { t: 'B', why: 'B has two holes. O has one.' },
                { t: 'C', why: 'C has no hole: it can be straightened into a line, but O can’t without cutting.' },
                { t: 'X', why: 'X has a point where four strands meet. O has no such junction.' },
              ],
              explain: r`O and D are both a single loop. (P and A are trickier: each has one loop plus a tail or legs, so they're not the same as O.) Counting holes and junctions is a first step toward classifying shapes topologically.`,
            },
            {
              type: 'multi',
              title: 'Letters with a junction',
              prompt: r`Again treat letters (in a plain font) as wire. Which letters are topologically the same as **T**? Select all.`,
              cols: 3,
              choices: [
                { t: 'Y', ok: true },
                { t: 'E', ok: true },
                { t: 'F', ok: true },
                { t: 'K', why: 'In K, four strands meet at one point, like X. T has a junction of three strands.' },
                { t: 'H', why: 'H has two junctions where three strands meet. T has only one.' },
                { t: 'L', why: 'L has no junction at all: its corner can be straightened, so L is the same as I.' },
              ],
              explain: r`What matters is the number of **junctions** and how many strands meet at each. T, Y, E and F each have exactly one point where three strands meet (in E and F the corners are just bends, which can be straightened). Bends don't count; branch points do.`,
            },
            {
              type: 'mcq',
              title: 'Holes in things',
              prompt: r`How many holes does a drinking straw have, topologically?`,
              cols: 2,
              choices: [
                { t: 'One', ok: true },
                { t: 'Two: one at each end', why: 'Squash the straw shorter and shorter: it becomes a flat ring, a single hole.' },
                { t: 'None', why: 'You can’t shrink the straw to a solid lump without tearing it. A loop around it can’t be removed.' },
              ],
              explain: r`Squash a straw down and it becomes a ring with one hole, like a doughnut. The "two ends" are two openings of the **same** hole. (This question famously divides the internet, but topologists agree: one.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Holes in a T-shirt',
              prompt: r`A T-shirt has four openings: the waist, the neck and two sleeves. Topologically, how many holes does it have?`,
              cols: 2,
              choices: [
                { t: '3', ok: true },
                { t: '4', why: 'Stretch the waist opening out wide and lay the shirt flat. The waist becomes the outer rim, not a hole.' },
                { t: '2', why: 'The neck and both sleeves stay as separate holes once the waist is stretched into the rim.' },
                { t: '1', why: 'Count the openings left inside the flattened shape.' },
              ],
              explain: r`Stretch the waist opening outward until the shirt lies flat like a disc: its rim is the old waist, and the neck and two sleeves become **three holes** in the disc. (The straw works the same way: two openings, one hole.)`,
            },
          ],
          recap: [
            'Topology allows stretching and bending, but not tearing or gluing.',
            'A mug and a doughnut are the same: both have one hole.',
            'Counting holes is a key topological invariant.',
          ],
        },
        {
          id: 'mobius',
          title: 'The Möbius Strip',
          summary: 'A surface with one side',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Half a twist',
              body: r`Take a strip of paper, give one end a **half twist**, and tape the ends together. This is a **Möbius strip** (August Möbius, 1858).

Draw a line along the middle without lifting your pen. You come back to the start having covered **both** "sides" of the paper. The Möbius strip has only **one side** and only **one edge**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Count the twists',
              body: r`Here is a paper band with any number of **half twists**. The edge is drawn in amber, and the two colours show which way each piece of paper faces you. Count the sides and edges for each number of twists.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 520,
                params: { k: { min: 0, max: 3, step: 1, value: 1, label: 'half twists', color: 'violet' } },
                extra: (ctx) => bandExtra(ctx, ctx.p.k),
                readout: (p) => (p.k % 2 ? `${p.k} half twist${p.k > 1 ? 's' : ''}: **one** side and **one** edge` : `${p.k} half twists: **two** sides and **two** edges`),
              },
              after: r`With an **even** number of half twists the band has two sides and two edges, like an ordinary loop. With an **odd** number it has only one of each, like the Möbius strip. The one-sided bands with 1 and 3 half twists are topologically the same surface; they differ only in how they sit in space.`,
            },
            {
              type: 'interactive',
              title: 'One edge',
              body: r`A bug walks along the amber edge of a Möbius strip (one half twist). Move it along until it first returns to its starting point (the hollow circle).`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 520,
                params: { t: { min: 0, max: 6 * Math.PI, step: Math.PI / 24, value: 0, label: 'walk', color: 'coral', format: (v) => `${(v / (2 * Math.PI)).toFixed(2)} laps` } },
                extra: (ctx) => bandExtra(ctx, 1, ctx.p.t),
                readout: (p) => { const laps = p.t / (2 * Math.PI); return Math.abs(laps - 2) < 0.01 ? 'Back at the start, after going around the strip **twice** ✓' : Math.abs(laps - 1) < 0.01 ? 'Around once… but on the **opposite** edge of the paper from where it began' : `${laps.toFixed(2)} laps around the strip`; },
                goal: (p) => Math.abs(p.t - 4 * Math.PI) < 0.01,
                hint: 'After one lap the bug is directly across the paper from its start. Keep going.',
                solution: { t: 4 * Math.PI },
              },
              explain: r`It takes **two** laps around the strip. The Möbius strip's single edge is one closed loop twice as long as the centre line. That's why cutting along the centre doesn't split the strip: the cut never meets the edge, and the two "halves" are joined end to end.`,
            },
            {
              type: 'mcq',
              title: 'Cut it in half',
              prompt: r`Cut a Möbius strip lengthwise along its centre line. What do you get?`,
              choices: [
                { t: 'One long loop (with two full twists)', ok: true },
                { t: 'Two separate Möbius strips', why: 'Surprisingly, it stays in one piece. Try it with paper!' },
                { t: 'Two separate ordinary loops', why: 'The single edge means the cut can’t separate it into two pieces.' },
              ],
              explain: r`It stays in **one piece**: a loop twice as long, with two full twists, and it's no longer a Möbius strip (it has two sides). Cutting a third of the way in from the edge is even stranger: you get two **linked** loops, a thin Möbius strip and a long two-sided loop.`,
            },
            {
              type: 'numeric',
              title: 'A full twist',
              prompt: r`Now take a band with **two** half twists (one full twist) and cut it lengthwise down the middle. How many separate pieces do you get?`,
              answer: 2,
              wrong: [{ v: 1, why: 'That happens with an odd number of half twists. With two half twists the band has two edges, and the cut separates them.' }],
              explain: r`**Two** pieces, each a band with a full twist, and the two are **linked** together like a chain. A band with an even number of half twists has two edges, so a cut between them separates it. Try it with a strip of paper: it's a great party trick.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Orientation',
              prompt: r`A tiny flat creature with a left hand walks once around the centre line of a Möbius strip. When it returns to its starting point, what has happened?`,
              choices: [
                { t: 'It has become its own mirror image: its left hand is now on the right', ok: true },
                { t: 'Nothing has changed', why: 'The half twist flips anything carried around the strip.' },
                { t: 'It is upside down but not mirrored', why: 'For a creature living **in** the surface, the half twist acts as a reflection.' },
              ],
              explain: r`Carried once around, the creature returns mirror-reversed. Surfaces like this are called **non-orientable**: there's no consistent way to tell clockwise from anticlockwise. The Klein bottle is a closed surface with the same property.`,
            },
          ],
          recap: [
            'A Möbius strip has one side and one edge.',
            'Cutting it down the middle leaves one long, two-sided loop.',
            'It’s non-orientable: travelling around it flips left and right.',
          ],
        },
      ],
    },
    {
      title: 'Invariants',
      summary: 'Numbers that can’t be changed.',
      lessons: [
        {
          id: 'euler-char',
          title: 'The Euler Characteristic',
          summary: 'V − E + F counts holes',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Beyond polyhedra',
              body: r`For any polyhedron shaped like a sphere, $V - E + F = 2$ (vertices − edges + faces), as in the 3D Shapes course. This number, the **Euler characteristic** $\chi$, doesn't change however you stretch or subdivide the surface: it's a topological invariant.

Draw a grid on a **doughnut** (torus) instead, and you get a different value.`,
            },
            {
              type: 'numeric',
              title: 'A grid on a doughnut',
              prompt: r`A torus is covered by a 4 × 4 grid of squares (wrapping around both ways), giving 16 faces, 16 vertices and 32 edges. What is $V - E + F$?`,
              lhs: r`$\chi =$`,
              answer: 0,
              wrong: [{ v: 2, why: r`That's for a sphere. Compute: $16 - 32 + 16$.` }, { v: 64, why: r`It's $V - E + F$: subtract the edges.` }],
              explain: r`$16 - 32 + 16 = 0$. Every way of drawing a grid on a torus gives $\chi = 0$. In general, a surface with $g$ holes has $\chi = 2 - 2g$: 2 for a sphere, 0 for a torus, $-2$ for a two-holed doughnut.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Any grid on a torus',
              body: r`Roll a square into a tube (gluing top to bottom), then bend the tube round and glue its ends: you get a torus. So a grid drawn on a square, with matching edges glued (shown by the arrows), is a grid on a torus. Change the grid and count.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.12, xmax: 1.12, ymin: -0.12, ymax: 1.12, grid: false, axes: false, maxWidth: 380,
                params: { m: { min: 1, max: 7, step: 1, value: 4, label: 'columns', color: 'blue' }, n: { min: 1, max: 7, step: 1, value: 3, label: 'rows', color: 'teal' } },
                extra: (ctx) => { const { plot, p, s } = ctx; let d = ''; for (let i = 1; i < p.m; i++) d += `M${plot.X(i / p.m)} ${plot.Y(0)}V${plot.Y(1)}`; for (let j = 1; j < p.n; j++) d += `M${plot.X(0)} ${plot.Y(j / p.n)}H${plot.X(1)}`; const dots = []; for (let i = 0; i < p.m; i++) for (let j = 0; j < p.n; j++) dots.push(s('circle', { cx: plot.X(i / p.m), cy: plot.Y(j / p.n), r: 5, class: 'fl-coral' })); return [...glueArrows(ctx, false), s('path', { d, stroke: 'var(--blue)', 'stroke-width': 2 }), ...dots]; },
                readout: (p) => `$V = ${p.m * p.n}$, $E = ${2 * p.m * p.n}$, $F = ${p.m * p.n}$, so $V - E + F = ${p.m * p.n - 2 * p.m * p.n + p.m * p.n}$`,
              },
              after: r`Because the edges are glued, the right and top sides are the **same** as the left and bottom, so only the coral vertices are distinct. Each vertex has one edge going right and one going up, so $E = 2V$, and each vertex is the bottom-left corner of one square, so $F = V$. Hence $\chi = V - 2V + V = 0$, whatever the grid.`,
            },
            {
              type: 'numeric',
              title: 'A picture frame',
              prompt: r`A triangular picture frame (a triangular slab with a triangular tunnel through it), made of flat faces, has 12 vertices and 24 edges. It's a torus, so $\chi = 0$. How many faces does it have?`,
              lhs: r`$F =$`,
              answer: 12,
              wrong: [{ v: 14, why: r`That would make $V - E + F = 2$, the sphere's value. A frame has a hole, so $\chi = 0$.` }],
              explain: r`$12 - 24 + F = 0$ gives $F = 12$: three trapezoids on the front, three on the back, three outer walls and three tunnel walls. Euler's famous $V - E + F = 2$ fails for the frame. Mathematicians in the 1800s were puzzled by such "exceptions" until they realised the formula counts holes.`,
            },
            {
              type: 'numeric',
              title: 'An open box',
              prompt: r`Take the surface of a cube and remove the top face, leaving an open box. What is $V - E + F$ now?`,
              lhs: r`$\chi =$`,
              answer: 1,
              wrong: [{ v: 2, why: r`The cube has $8 - 12 + 6 = 2$, but you've removed a face: $F = 5$.` }, { v: 0, why: 'The vertices and edges are all still there. Only one face is gone.' }],
              explain: r`$8 - 12 + 5 = 1$. An open box can be flattened into a disc, and every disc has $\chi = 1$. Each hole cut in a surface lowers $\chi$ by 1. A Möbius strip, for instance, has $\chi = 0$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Pretzels',
              prompt: r`A pretzel-shaped surface (three holes) is covered with a mesh. What will $V - E + F$ be?`,
              cols: 2,
              choices: [
                { t: '−4', ok: true },
                { t: '−6', why: r`Use $\chi = 2 - 2g$ with $g = 3$: $2 - 6$.` },
                { t: '0', why: 'That’s for one hole (a torus).' },
                { t: '2', why: 'That’s for a sphere, with no holes.' },
              ],
              explain: r`$\chi = 2 - 2 \times 3 = -4$. Remarkably, $\chi$ (together with orientability) completely classifies closed surfaces: two closed, orientable surfaces are the same exactly when they have the same Euler characteristic.`,
            },
          ],
          recap: [
            r`Euler characteristic $\chi = V - E + F$ is a topological invariant.`,
            r`Sphere: 2. Torus: 0. A surface with $g$ holes: $2 - 2g$.`,
            'χ classifies closed orientable surfaces.',
          ],
        },
        {
          id: 'knots',
          title: 'Knots',
          summary: 'Proving a knot can’t be untied',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Mathematical knots',
              body: r`Tie a knot in a string, then glue the ends together so it can't slip off. That's a mathematical **knot**: a closed loop in space. The simplest is the **unknot** (a plain circle). Next is the **trefoil**, with three crossings.

Can the trefoil be wiggled, without cutting, into a plain circle? Trying and failing proves nothing. We need an **invariant**: a property that no wiggling can change.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tricolouring',
              prompt: r`A knot diagram is **tricolourable** if you can colour its arcs (the unbroken strands) with **at least two** of three colours so that at every crossing the three strands meeting there are either **all the same** or **all different**. Colour the trefoil's three arcs to make a valid tricolouring.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.4, xmax: 3.4, ymin: -3.4, ymax: 3.1, grid: false, axes: false, maxWidth: 400,
                params: {
                  c0: { min: 0, max: 2, step: 1, value: 0, label: 'arc 1', color: 'ink', format: (v) => NAMES[v] },
                  c1: { min: 0, max: 2, step: 1, value: 0, label: 'arc 2', color: 'ink', format: (v) => NAMES[v] },
                  c2: { min: 0, max: 2, step: 1, value: 1, label: 'arc 3', color: 'ink', format: (v) => NAMES[v] },
                },
                extra: ({ plot, p, s }) => TREFOIL.arcs.map(([a, b], k) => {
                  let d = '';
                  const gap = 0.16, n = 160;
                  for (let i = 0; i <= n; i++) {
                    const t = a + gap + ((b - a - 2 * gap) * i) / n;
                    d += `${i ? 'L' : 'M'}${plot.X(TX(t)).toFixed(1)} ${plot.Y(TY(t)).toFixed(1)}`;
                  }
                  return s('path', { d, fill: 'none', stroke: `var(--${COLS[p[`c${k}`]]})`, 'stroke-width': 9, 'stroke-linecap': 'round' });
                }),
                readout: (p) => {
                  const c = [p.c0, p.c1, p.c2];
                  const distinct = new Set(c).size;
                  return distinct === 3 ? 'All three colours meet at every crossing: a valid tricolouring ✓' : distinct === 1 ? 'Only one colour is used: that doesn’t count.' : 'At each crossing, two strands share a colour and the third differs: not allowed.';
                },
                goal: (p) => new Set([p.c0, p.c1, p.c2]).size === 3,
                hint: 'Every crossing involves all three arcs, so they must be all the same or all different.',
                solution: { c0: 0, c1: 1, c2: 2 },
              },
              explain: r`Each of the trefoil's three crossings involves all three arcs, so giving every arc a different colour works. The trefoil is **tricolourable**. A plain circle, though, has just one arc, so it can only ever use one colour: the unknot is **not** tricolourable.`,
            },
            {
              type: 'mcq',
              title: 'So what?',
              prompt: r`Tricolourability is unchanged by any wiggling of the string (this can be checked for each of the basic moves, called Reidemeister moves). What does that prove?`,
              choices: [
                { t: 'The trefoil can never be untied into a circle', ok: true },
                { t: 'Every tricolourable knot is a trefoil', why: 'Many different knots are tricolourable. The invariant shows knots are different, but not that they’re the same.' },
                { t: 'Nothing: knots can always be untied', why: 'An invariant that differs between two knots proves that no amount of wiggling turns one into the other.' },
              ],
              explain: r`If wiggling could turn the trefoil into the unknot, they'd have to agree on every invariant. They don't (one is tricolourable and the other isn't), so the trefoil is **genuinely knotted**. Knot theory now helps biologists understand how enzymes untangle DNA.`,
            },
            {
              type: 'numeric',
              title: 'Counting colourings',
              prompt: r`Count **all** the ways to colour the trefoil's three arcs with three colours so that every crossing is all-same or all-different, including the three one-colour colourings.`,
              answer: 9,
              wrong: [{ v: 6, why: 'You’ve counted the all-different colourings. Add the 3 one-colour ones.' }, { v: 27, why: 'That’s every colouring, valid or not. Each crossing uses all three arcs, so they must be all the same or all different.' }, { v: 3, why: 'Those are the one-colour colourings. Add the all-different ones: 3 × 2 × 1 = 6.' }],
              explain: r`3 one-colour colourings plus $3 \times 2 \times 1 = 6$ all-different ones makes **9**. The unknot has only 3. This count is itself an invariant (and always a power of 3), so it gives the same verdict: the trefoil isn't the unknot.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The figure-eight knot',
              body: r`The next simplest knot is the **figure-eight knot**, with four crossings and four arcs. Try to tricolour it: use at least two colours so every crossing is all-same or all-different.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.4, xmax: 3.4, ymin: -3.4, ymax: 3.4, grid: false, axes: false, maxWidth: 400,
                params: Object.fromEntries([0, 1, 2, 3].map((k) => [`c${k}`, { min: 0, max: 2, step: 1, value: k === 3 ? 1 : 0, label: `arc ${k + 1}`, color: 'ink', format: (v) => NAMES[v] }])),
                extra: ({ plot, p, s }) => {
                  const els = FIG8.arcs.map(([a, b], k) => {
                    let d = '';
                    const gap = 0.12, n = 200;
                    for (let i = 0; i <= n; i++) { const t = a + gap + ((b - a - 2 * gap) * i) / n; d += `${i ? 'L' : 'M'}${plot.X(FX(t)).toFixed(1)} ${plot.Y(FY(t)).toFixed(1)}`; }
                    const [mx, my] = [FX((a + b) / 2), FY((a + b) / 2)];
                    return [s('path', { d, fill: 'none', stroke: `var(--${COLS[p[`c${k}`]]})`, 'stroke-width': 9, 'stroke-linecap': 'round' }), s('text', { x: plot.X(mx * 1.18), y: plot.Y(my * 1.18) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:22px;font-weight:600', text: String(k + 1) })];
                  });
                  return els;
                },
                readout: (p) => { const c = [p.c0, p.c1, p.c2, p.c3]; const bad = FIG8.crossings.filter((x) => new Set(x.map((a) => c[a])).size === 2).length; return new Set(c).size === 1 ? 'Only one colour is used: that doesn’t count.' : bad ? `${bad} crossing${bad > 1 ? 's' : ''} break${bad > 1 ? '' : 's'} the rule` : 'Valid tricolouring ✓'; },
              },
              after: r`However hard you try, some crossing always breaks the rule: there are 81 colourings, and only the 3 one-colour ones are valid. The figure-eight knot is **not** tricolourable.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'What did we learn?',
              prompt: r`Neither the figure-eight knot nor the unknot is tricolourable. What does that tell us?`,
              choices: [
                { t: 'Nothing about whether the figure-eight knot can be untied: we need a stronger invariant', ok: true },
                { t: 'The figure-eight knot can be untied', why: 'Agreeing on one invariant doesn’t make two knots the same. (In fact the figure-eight is genuinely knotted.)' },
                { t: 'The figure-eight knot is the same as the trefoil', why: 'The trefoil is tricolourable and the figure-eight isn’t, so these two are definitely different.' },
              ],
              explain: r`An invariant can prove two knots **different**, never the same. Tricolourability does prove that the figure-eight differs from the trefoil, but it can't separate it from the unknot. Stronger invariants do: generalising to $p$ colours (the figure-eight is 5-colourable), or the **Jones polynomial** (1984), which won Vaughan Jones a Fields Medal. Whether the Jones polynomial alone can tell every knot from the unknot is still an open problem.`,
            },
          ],
          recap: [
            'A mathematical knot is a closed loop in space.',
            'Tricolourability is an invariant: it never changes under wiggling.',
            'The trefoil is tricolourable and the unknot isn’t, so the trefoil can’t be untied.',
          ],
        },
        {
          id: 'hairy-ball',
          title: 'The Hairy Ball Theorem',
          summary: 'You can’t comb a coconut',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Combing a sphere',
              body: r`Imagine a ball covered in hair. Try to comb all of it flat against the surface, smoothly, with no partings or tufts. The **hairy ball theorem** (proved by L. E. J. Brouwer in 1912) says it's **impossible**: there must always be at least one spot where the hair stands straight up or swirls around a point, like the crown on a person's head.

In maths language: every continuous tangent vector field on a sphere has a zero somewhere.`,
            },
            {
              type: 'mcq',
              title: 'Wind on Earth',
              prompt: r`Think of the horizontal wind at every point on Earth's surface as "hair". What does the theorem guarantee?`,
              choices: [
                { t: 'At every moment, somewhere on Earth the horizontal wind speed is zero', ok: true },
                { t: 'Somewhere it’s always stormy', why: 'The theorem guarantees a point of **zero** horizontal wind, not a strong one.' },
                { t: 'The wind always blows from west to east', why: 'Any such smooth, everywhere-nonzero pattern is exactly what the theorem forbids.' },
              ],
              explain: r`The wind pattern is (roughly) a continuous tangent field on a sphere, so it must vanish somewhere: there's always at least one calm spot, often at the eye of a cyclone.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Counting tufts',
              body: r`Zoom in on a tuft: the hair near it forms one of a few patterns. To measure a tuft, walk once anticlockwise around the violet loop and count how many full turns the hair direction (coral arrows) makes. That number is the **index**. Move the loop off the tuft too.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.3, xmax: 3.3, ymin: -3.3, ymax: 3.3, grid: false, axes: false, maxWidth: 420,
                params: {
                  kind: { min: 0, max: 5, step: 1, value: 0, label: 'pattern', color: 'violet', format: (v) => FIELDS[v].name },
                  cx: { min: -2.25, max: 2.25, step: 0.25, value: 0, label: 'loop', color: 'coral' },
                },
                extra: (ctx) => fieldExtra(ctx, FIELDS[ctx.p.kind].f, ctx.p.cx, 0.9),
                readout: (p) => { const i = fieldIndex(FIELDS[p.kind].f, p.cx, 0, 0.9); return Math.abs(p.cx) > 0.9 ? `The loop misses the tuft: index **${Math.abs(i)}**` : `${FIELDS[p.kind].name}: the arrows turn ${i < 0 ? 'clockwise' : 'anticlockwise'} ${Math.abs(i)} time${Math.abs(i) === 1 ? '' : 's'}, index **${i > 0 ? '+' : i < 0 ? '−' : ''}${Math.abs(i)}**`; },
              },
              after: r`Sources, sinks and vortices have index $+1$; a **saddle** (hair flowing in from two sides and out the other two) has index $-1$; the dipole $+2$ and the monkey saddle $-2$. A loop around no tuft always gives 0, because the field turns smoothly and returns to where it began.`,
            },
            {
              type: 'numeric',
              title: 'North to south',
              prompt: r`Comb a hairy ball along lines of longitude, every hair pointing from the North Pole toward the South Pole. There are two tufts: a **source** at the North Pole and a **sink** at the South Pole. What is the total index?`,
              answer: 2,
              wrong: [{ v: 0, why: 'A sink has index +1, not −1. Both the source and the sink count +1.' }, { v: 1, why: 'There are two tufts, each with index +1.' }],
              explain: r`$+1 + 1 = 2$, which is exactly the Euler characteristic of the sphere. The **Poincaré–Hopf theorem** says this always happens: for any combing with finitely many tufts, the indices add up to $\chi$. Since the sphere has $\chi = 2 \ne 0$, at least one tuft is unavoidable. That's the hairy ball theorem.`,
            },
            {
              type: 'numeric',
              title: 'Vortices and saddles',
              prompt: r`A wind pattern on the whole Earth has three cyclones (vortices, index $+1$ each), some saddle points (index $-1$ each), and no other calm points. How many saddles are there?`,
              answer: 1,
              wrong: [{ v: 3, why: r`The indices must add up to $\chi = 2$, not 0.` }, { v: 5, why: r`Saddles **subtract** 1 each: $3 - s = 2$.` }],
              explain: r`The indices must total $\chi = 2$: $3 - s = 2$, so $s = 1$. Weather maps obey this: the numbers of highs, lows and saddle points (called "cols") are always linked by the sphere's topology.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A hairy doughnut',
              prompt: r`Can a hairy **doughnut** (torus) be combed flat with no bald spots or tufts?`,
              cols: 2,
              choices: [
                { t: 'Yes', ok: true },
                { t: 'No', why: 'Comb every hair around the doughnut the long way, like rings on a finger: nothing goes wrong anywhere.' },
              ],
              explain: r`Comb all the hair around the torus in the same direction, the long way around: it lies flat everywhere. The difference is topological: a deep theorem (Poincaré–Hopf) says the number of unavoidable "tufts" relates to the Euler characteristic. The sphere has $\chi = 2 \ne 0$, so it must have tufts; the torus has $\chi = 0$, so it doesn't need any.`,
            },
          ],
          recap: [
            'Hairy ball theorem: a continuous tangent field on a sphere vanishes somewhere.',
            'So there’s always a calm point in Earth’s horizontal wind.',
            'A torus (χ = 0) can be combed flat. The sphere (χ = 2) can’t.',
          ],
        },
      ],
    },
    {
      title: 'Gluing and Fixing',
      summary: 'Surfaces from squares, and points that can’t move.',
      lessons: [
        {
          id: 'gluing',
          title: 'Worlds from a Square',
          summary: 'Tori, Klein bottles and video games',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A video-game world',
              body: r`In old arcade games like *Asteroids*, a ship that flies off the right edge reappears on the left, and off the top reappears at the bottom. The arrows show which edges are glued together. Steer the ship and fly it.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.08, xmax: 1.08, ymin: -0.08, ymax: 1.08, grid: false, axes: false, maxWidth: 400,
                params: {
                  th: { min: 0, max: 90, step: 1, value: 25, label: 'heading', color: 'violet', format: (v) => `${v}°` },
                  d: { min: 0, max: 8, step: 0.05, value: 1.5, label: 'distance', color: 'coral', format: (v) => v.toFixed(2) },
                },
                extra: (ctx) => shipExtra(ctx, 0.1, 0.2, (ctx.p.th * Math.PI) / 180, ctx.p.d, false),
                readout: (p) => `Heading ${p.th}°, distance flown ${p.d.toFixed(2)} screen widths`,
              },
              after: r`The ship never hits a wall, yet the world is finite. Most headings make the trail wind round and round, filling the screen with parallel lines. Headings like 0°, 45° or 90° give a path that closes up quickly.`,
            },
            {
              type: 'mcq',
              title: 'What shape is the world?',
              prompt: r`Glue the top edge of the square to the bottom, and the left edge to the right (without twisting). What surface do you get?`,
              choices: [
                { t: 'A torus (doughnut)', ok: true },
                { t: 'A sphere', why: 'Gluing top to bottom gives a tube. Then gluing the tube’s two ends together leaves a hole through the middle.' },
                { t: 'A Möbius strip', why: 'A Möbius strip needs a flip in the gluing, and it has an edge. This surface has no edge at all.' },
              ],
              explain: r`Top to bottom makes a cylinder; bending the cylinder round to join its ends makes a **torus**. The Asteroids world is a flat torus: a creature living in it would find it has no edges, and could circle it two independent ways, which is why the torus has $\chi = 0$ and one hole.`,
            },
            {
              type: 'numeric',
              title: 'Closing the loop',
              prompt: r`On the flat torus, a ship flies in a straight line with slope $\tfrac23$ (it climbs 2 for every 3 across), starting from a corner. How many times does it cross the right edge before its path closes up?`,
              answer: 3,
              wrong: [{ v: 2, why: 'It crosses the top edge 2 times. Count the crossings of the right edge.' }, { v: 6, why: 'The path closes when it has gone 3 across and 2 up at the same time.' }],
              explain: r`After moving 3 across and 2 up, the ship is back at a corner: it crossed the right edge **3** times and the top edge 2 times. Any rational slope gives a closed loop. An **irrational** slope, like $\sqrt 2$, never closes: the path comes arbitrarily close to every point of the torus (a theorem of Kronecker).`,
            },
            {
              type: 'interactive',
              title: 'A world with a twist',
              body: r`Now the left and right edges are glued **with a flip**: fly off the right edge near the top, and you reappear on the left near the bottom. Watch the letter F as it crosses. Choose a starting height so that the ship's path closes up after crossing the right edge only **once**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.08, xmax: 1.08, ymin: -0.08, ymax: 1.08, grid: false, axes: false, maxWidth: 400,
                params: {
                  y0: { min: 0.05, max: 0.95, step: 0.05, value: 0.25, label: 'start height', color: 'violet', format: (v) => v.toFixed(2) },
                  d: { min: 0, max: 2, step: 0.02, value: 1.3, label: 'laps', color: 'coral', format: (v) => v.toFixed(2) },
                },
                extra: (ctx) => shipExtra(ctx, 0.05, ctx.p.y0, 0, ctx.p.d, true),
                readout: (p) => { const P = shipPath(0.05, p.y0, 0, p.d, true); return `${P.flip ? 'The F is **mirrored**' : 'The F is the right way round'}; height now ${P.y.toFixed(2)}`; },
                goal: (p) => Math.abs(p.y0 - 0.5) < 1e-6,
                hint: 'After one lap, height y becomes 1 − y. When are they equal?',
                solution: { y0: 0.5, d: 1 },
              },
              explain: r`At height $\tfrac12$ the flip sends the ship straight back to where it started, but **mirrored**: the path is the centre line of a Möbius strip hiding inside this world. Any other height needs two laps to close up. This surface is the **Klein bottle**: closed like a torus, but one-sided like a Möbius strip.`,
            },
            {
              type: 'mcq',
              title: 'Building a Klein bottle',
              prompt: r`Gluing the Klein bottle's square in 3D, the final step forces the tube to pass through its own wall. Which other construction also gives a Klein bottle?`,
              choices: [
                { t: 'Gluing two Möbius strips together along their edges', ok: true },
                { t: 'Gluing two discs together along their edges', why: 'Two discs glued along their rims make a sphere.' },
                { t: 'Gluing the ends of a cylinder together without a twist', why: 'That’s the torus.' },
              ],
              explain: r`Cut a Klein bottle along a line and it falls into two Möbius strips (the limerick says: "A mathematician named Klein / thought the Möbius band was divine…"). In four dimensions the Klein bottle can be built without passing through itself; our 3D glass models have to cheat with a self-intersection.`,
            },
            {
              type: 'numeric',
              title: 'The projective plane',
              prompt: r`Glue **both** pairs of opposite edges with a flip. The four corners of the square become 2 points, the four edges become 2 edges, and there is 1 face. What is $V - E + F$?`,
              lhs: r`$\chi =$`,
              answer: 1,
              wrong: [{ v: 0, why: r`$V = 2$, $E = 2$, $F = 1$: $2 - 2 + 1$.` }, { v: 2, why: 'That’s the sphere. Subtract the edges: 2 − 2 + 1.' }],
              explain: r`$2 - 2 + 1 = 1$. This surface is the **projective plane**, another one-sided closed surface. By contrast, the torus and the Klein bottle squares have 1 vertex, 2 edges and 1 face: $\chi = 0$ for both.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Telling surfaces apart',
              prompt: r`Every closed surface is a sphere, a torus with some holes, or built from projective planes. Which two surfaces can **not** be told apart by the Euler characteristic alone?`,
              choices: [
                { t: 'The torus and the Klein bottle', ok: true },
                { t: 'The sphere and the torus', why: r`The sphere has $\chi = 2$, the torus $\chi = 0$.` },
                { t: 'The Klein bottle and the projective plane', why: r`The Klein bottle has $\chi = 0$ and the projective plane $\chi = 1$.` },
              ],
              explain: r`Both have $\chi = 0$. What separates them is **orientability**: the torus is two-sided and the Klein bottle one-sided. The **classification of surfaces** says these two facts together, $\chi$ and orientability, identify every closed surface completely.`,
            },
          ],
          recap: [
            'Gluing opposite edges of a square gives a torus, or with a flip, a Klein bottle.',
            'Straight paths on a flat torus close up exactly when the slope is rational.',
            r`$\chi$ plus orientability classifies every closed surface.`,
          ],
        },
        {
          id: 'fixedpoint',
          title: 'Fixed Points',
          summary: 'Brouwer’s theorem and the park map',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Stir your coffee',
              body: r`Stir a cup of coffee gently, without splashing, and let it settle. **Brouwer's fixed point theorem** (proved around 1910) guarantees that at least one point of the coffee ends up exactly where it started.

More precisely: any continuous map from a disc (or a ball, or a square) to itself has a **fixed point**, a point $x$ with $f(x) = x$. It's a pure existence theorem: it tells you the point exists, not where it is.`,
            },
            {
              type: 'interactive',
              title: 'One dimension',
              body: r`The simplest case is a line segment. Drag the five points to make a function from $[0, 1]$ to $[0, 1]$. Fixed points are where the graph meets the dashed line $y = x$. Make a function with exactly **three** fixed points, and notice you can never make one with **none**.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: 0.25, height: 380, maxWidth: 420, axes: { xlabel: 'x', ylabel: 'f(x)' },
                params: Object.fromEntries([0.8, 0.9, 0.7, 0.4, 0.3].map((v, k) => [`y${k}`, { min: 0, max: 1, step: 0.01, value: v, slider: false }])),
                curves: [{ f: (x) => x, color: 'muted', dash: true }, { f: (x, p) => pwF(x, p), color: 'blue', width: 3.5, n: 200 }],
                points: [0, 1, 2, 3, 4].map((k) => ({ x: () => k / 4, y: (p) => p[`y${k}`], drag: { y: `y${k}` }, color: 'blue' })),
                extra: ({ plot, p, s }) => (pwFixed(p) || []).map((x) => s('circle', { cx: plot.X(x), cy: plot.Y(x), r: 8, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 })),
                readout: (p) => { const f = pwFixed(p); return f === null ? 'Infinitely many fixed points!' : `**${f.length}** fixed point${f.length === 1 ? '' : 's'}`; },
                goal: (p) => { const f = pwFixed(p); return f !== null && f.length === 3; },
                hint: 'Weave the graph back and forth across the dashed diagonal.',
                solution: { y0: 0.2, y1: 0.1, y2: 0.6, y3: 0.6, y4: 0.9 },
              },
              explain: r`You can make as many fixed points as you like, but never zero. The graph starts on or above the diagonal (at $x = 0$, $f(0) \ge 0$) and ends on or below it (at $x = 1$, $f(1) \le 1$), so somewhere in between it has to cross.`,
            },
            {
              type: 'mcq',
              title: 'Why it must cross',
              prompt: r`Which theorem from calculus proves that every continuous $f: [0,1] \to [0,1]$ has a fixed point?`,
              choices: [
                { t: r`The intermediate value theorem, applied to $g(x) = f(x) - x$`, ok: true },
                { t: 'Pythagoras’ theorem', why: 'There are no right triangles here. Think about a function that changes sign.' },
                { t: 'The fundamental theorem of calculus', why: 'No integrals are needed: $f$ needn’t even be differentiable.' },
              ],
              explain: r`$g(0) = f(0) \ge 0$ and $g(1) = f(1) - 1 \le 0$. A continuous function that goes from $\ge 0$ to $\le 0$ hits zero somewhere, and there $f(x) = x$. In two or more dimensions the theorem is much harder; one beautiful proof uses the fact that the board game **Hex** can never end in a draw.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'You are here',
              body: r`Drop a map of a park on the ground somewhere inside the park, at any angle. Brouwer says some point on the map lies **exactly** over the real spot it represents. Drag the map by its corner, turn it and resize it: the coral pin marks that point.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.1, xmax: 4.1, ymin: -0.1, ymax: 4.1, grid: false, axes: false, maxWidth: 420,
                params: {
                  cx: { min: 1.5, max: 2.5, step: 0.01, value: 2.35, slider: false },
                  cy: { min: 1.5, max: 2.5, step: 0.01, value: 1.7, slider: false },
                  th: { min: 0, max: 360, step: 1, value: 40, label: 'turn', color: 'violet', format: (v) => `${v}°` },
                  s: { min: 0.25, max: 0.5, step: 0.01, value: 0.4, label: 'map size', color: 'teal', format: (v) => `${Math.round(v * 100)}%` },
                },
                extra: (ctx) => { const { plot, p, s } = ctx; const [fx, fy] = mapFixed(p); return [...parkDraw(ctx, (q) => q, false), ...parkDraw(ctx, (q) => mapPt(p, q), true), s('circle', { cx: plot.X(fx), cy: plot.Y(fy), r: 7, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2.5 })]; },
                points: [{ x: (p) => mapPt(p, [4, 4])[0], y: (p) => mapPt(p, [4, 4])[1], drag: { fn: (x, y, p) => { const [qx, qy] = mapPt(p, [4, 4]); return { cx: p.cx + x - qx, cy: p.cy + y - qy }; }, key: 'cx' }, color: 'ink', r: 7 }],
                readout: (p) => { const [fx, fy] = mapFixed(p); return `The map point at $(${fx.toFixed(2)}, ${fy.toFixed(2)})$ lies right on top of the real spot $(${fx.toFixed(2)}, ${fy.toFixed(2)})$`; },
              },
              after: r`There is always exactly one such point here, because the map shrinks distances: each step "map of the map of the map…" closes in on it. Shopping-centre "You are here" maps are a fixed point you can stand on. Crumple the map instead of laying it flat, and Brouwer still promises a fixed point, though now there could be several.`,
            },
            { /*anim:topology*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Maps within maps',
              body: r`The park has a {blue:pond} and a {coral:path}. The map, a shrunken copy of the park, lies somewhere inside it. But then the map shows itself too, so there's a smaller map on the map, and a smaller one on that, and so on. As the map is moved around, follow the {ink:black dot}.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.15, xmax: 4.15, ymin: -0.15, ymax: 3.15, grid: false, axes: false, maxWidth: 480,
                animate: { param: 't', speed: 1, max: 1000, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const m = parkMap(p.t), els = [];
                  const draw = (f, level) => {
                    const P = (pts) => pts.map((q, i) => { const [x, y] = f(q); return `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; }).join('');
                    const pond = []; for (let i = 0; i <= 24; i++) { const a = (2 * Math.PI * i) / 24; pond.push([2.9 + 0.55 * Math.cos(a), 2.1 + 0.4 * Math.sin(a)]); }
                    const path = []; for (let i = 0; i <= 24; i++) { const x = (4 * i) / 24; path.push([x, 0.8 + 0.45 * Math.sin(1.6 * x)]); }
                    const w = Math.max(0.6, 2.4 - 0.5 * level);
                    els.push(s('path', { d: P([[0, 0], [4, 0], [4, 3], [0, 3]]) + 'Z', class: level ? 'fl-card' : 'fl-teal-soft', stroke: 'var(--ink-2)', 'stroke-width': w }));
                    els.push(s('path', { d: P(pond) + 'Z', class: 'fl-blue', opacity: 0.6 }));
                    els.push(s('path', { d: P(path), fill: 'none', stroke: 'var(--coral)', 'stroke-width': w + 0.6 }));
                  };
                  let f = (q) => q;
                  for (let level = 0; level < 6; level++) { draw(f, level); const g = f; f = (q) => g(parkT(m, q)); }
                  const [zx, zy] = parkFixed(m);
                  els.push(s('circle', { cx: plot.X(zx), cy: plot.Y(zy), r: 5, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => { const [zx, zy] = parkFixed(parkMap(p.t)); return `the one spot that is exactly where the map says it is: (${fix(zx, 2)}, ${fix(zy, 2)})`; },
              },
              after: r`Each map sits inside the previous one, shrinking towards a single point. That point is in every map, and on each map it marks its own location, so it's the "you are here" point, the fixed point of the map. Wherever you lay the map, the nested copies close in on one: for shrinking maps like this one, there's exactly one, and repeating the map from any starting point homes in on it.`,
            },
            {
              type: 'numeric',
              title: 'Finding the fixed point',
              prompt: r`A road map of a 10 km road is printed at half scale, then placed 3 km along the road. A point $x$ km along the road appears on the map at position $\tfrac{x}{2} + 3$. Which point lies over its own picture?`,
              lhs: r`$x =$`,
              unit: 'km',
              answer: 6,
              wrong: [{ v: 3, why: r`Check: at $x = 3$, the map shows $1.5 + 3 = 4.5$. Solve $x = \tfrac x2 + 3$.` }, { v: 2, why: r`Solve $x = \tfrac x2 + 3$: subtract $\tfrac x2$ from both sides.` }],
              explain: r`$x = \tfrac x2 + 3$ gives $\tfrac x2 = 3$, so $x = 6$ km: the map shows the 6 km point at $3 + 3 = 6$. Repeatedly applying the map from any start (0, 3, 4.5, 5.25, …) homes in on 6, which is how many numerical methods find solutions.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'When Brouwer fails',
              prompt: r`Brouwer's theorem needs the shape to have **no holes**. Which of these continuous maps has **no** fixed point?`,
              choices: [
                { t: 'Rotating a ring (an annulus) by 90° about its centre', ok: true },
                { t: 'Rotating a solid disc by 90° about its centre', why: 'The centre of the disc stays put: that’s a fixed point.' },
                { t: 'Shrinking a square towards one corner', why: 'The corner it shrinks toward stays where it is.' },
                { t: 'Folding a segment in half onto itself', why: 'The intermediate value theorem guarantees a fixed point for any segment.' },
              ],
              explain: r`Every point of the ring moves a quarter turn, and the only point that could stay put (the centre) has been cut out. The hole is exactly what breaks the theorem, which is why Brouwer is a **topological** fact: it depends on the shape having no holes, not on its size or exact form.`,
            },
          ],
          recap: [
            'Brouwer: every continuous map of a disc (or ball) to itself has a fixed point.',
            'In one dimension it follows from the intermediate value theorem.',
            'Shapes with holes, like a ring, can be rotated with no fixed point.',
          ],
        },
      ],
    },
  ],
};
