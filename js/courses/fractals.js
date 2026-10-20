import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 3 decimals, so they never change length (DESIGN.md, Live numbers)
const f3 = (v) => fix(v, 3);

// Sierpinski triangle to depth n, as SVG triangles
function sierpinski(plot, s, n) {
  const out = [];
  const rec = (a, b, c, d) => {
    if (d === 0) {
      out.push(s('path', { d: `M${plot.X(a[0])} ${plot.Y(a[1])} L${plot.X(b[0])} ${plot.Y(b[1])} L${plot.X(c[0])} ${plot.Y(c[1])} Z`, class: 'fl-violet', opacity: 0.85 }));
      return;
    }
    const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const ab = m(a, b), bc = m(b, c), ca = m(c, a);
    rec(a, ab, ca, d - 1); rec(ab, b, bc, d - 1); rec(ca, bc, c, d - 1);
  };
  rec([0, 0], [2, 0], [1, Math.sqrt(3)], n);
  return out;
}
// Koch curve points from p to q at depth n
function koch(p, q, n) {
  if (n === 0) return [p, q];
  const d = [(q[0] - p[0]) / 3, (q[1] - p[1]) / 3];
  const a = [p[0] + d[0], p[1] + d[1]], b = [p[0] + 2 * d[0], p[1] + 2 * d[1]];
  const ang = Math.PI / 3;
  const peak = [a[0] + d[0] * Math.cos(ang) - d[1] * Math.sin(ang), a[1] + d[0] * Math.sin(ang) + d[1] * Math.cos(ang)];
  return [...koch(p, a, n - 1).slice(0, -1), ...koch(a, peak, n - 1).slice(0, -1), ...koch(peak, b, n - 1).slice(0, -1), ...koch(b, q, n - 1)];
}
const logistic = (rr, x0, n) => { const xs = [x0]; for (let i = 0; i < n; i++) xs.push(rr * xs[xs.length - 1] * (1 - xs[xs.length - 1])); return xs; };

// a fractal tree as one SVG path: trunk from (0,0) up, each branch splits in two
function treePath(plot, ang, ratio, depth) {
  let d = '';
  const rec = (x, y, dir, len, k) => {
    const x2 = x + len * Math.cos(dir), y2 = y + len * Math.sin(dir);
    d += `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}L${plot.X(x2).toFixed(1)} ${plot.Y(y2).toFixed(1)}`;
    if (k > 0) { rec(x2, y2, dir + ang, len * ratio, k - 1); rec(x2, y2, dir - ang, len * ratio, k - 1); }
  };
  rec(0, 0, Math.PI / 2, 1, depth);
  return d;
}
// densely sampled Koch curve on [0, 1], for box counting
let KOCH_PTS = null;
const kochPts = () => {
  if (KOCH_PTS) return KOCH_PTS;
  const P = koch([0, 0], [1, 0], 6), out = [];
  for (let i = 0; i < P.length - 1; i++) for (let t = 0; t < 4; t++) out.push([P[i][0] + ((P[i + 1][0] - P[i][0]) * t) / 4, P[i][1] + ((P[i + 1][1] - P[i][1]) * t) / 4]);
  out.push(P[P.length - 1]);
  return (KOCH_PTS = out);
};
const kochBoxes = (k) => { const e = 1 / 2 ** k, set = new Map(); for (const [x, y] of kochPts()) { const i = Math.floor(x / e - 1e-9), j = Math.floor(y / e + 1e-9); set.set(`${i},${j}`, [i, j]); } return [...set.values()]; };
// seeded random numbers, so pictures don't flicker when redrawn
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// chaos game: n corners of a regular polygon; each move shrinks the distance to a random corner by factor sc
function chaosPath(plot, n, sc, N) {
  const R = rng(7), V = Array.from({ length: n }, (_, k) => [Math.cos(Math.PI / 2 + (2 * Math.PI * k) / n), Math.sin(Math.PI / 2 + (2 * Math.PI * k) / n)]);
  let x = 0.1, y = 0.05, d = '';
  for (let i = 0; i < N + 20; i++) {
    const v = V[Math.floor(R() * n)];
    x = v[0] + sc * (x - v[0]); y = v[1] + sc * (y - v[1]);
    if (i >= 20) d += `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`;
  }
  return { d, V };
}
// logistic map: cobweb path, and the long-run cycle length
function cobweb(plot, rr, x0, n) {
  let x = x0, d = `M${plot.X(x)} ${plot.Y(0)}`;
  for (let i = 0; i < n; i++) { const y = rr * x * (1 - x); d += `L${plot.X(x)} ${plot.Y(y)}L${plot.X(y)} ${plot.Y(y)}`; x = y; }
  return d;
}
function period(rr) {
  let x = 0.2;
  for (let i = 0; i < 3000; i++) x = rr * x * (1 - x);
  const x0 = x;
  for (let k = 1; k <= 64; k++) { x = rr * x * (1 - x); if (Math.abs(x - x0) < 1e-6) return k; }
  return 0;
}
let BIF = null;
const bifurcation = () => {
  if (BIF) return BIF;
  const cols = [];
  for (let c = 0; c <= 480; c++) {
    const rr = 2.8 + (1.2 * c) / 480;
    let x = 0.3;
    for (let i = 0; i < 400; i++) x = rr * x * (1 - x);
    const ys = [];
    for (let i = 0; i < 120; i++) { x = rr * x * (1 - x); ys.push(x); }
    cols.push([rr, ys]);
  }
  return (BIF = cols);
};
// Lorenz system: two runs starting 1e-5 apart (RK4, dt = 0.01)
let LORENZ = null;
const lorenz = () => {
  if (LORENZ) return LORENZ;
  const f = ([x, y, z]) => [10 * (y - x), x * (28 - z) - y, x * y - (8 / 3) * z];
  const run = (p) => {
    const out = [p];
    for (let i = 0; i < 4000; i++) {
      const h = 0.01, k1 = f(p), k2 = f(p.map((v, j) => v + (h / 2) * k1[j])), k3 = f(p.map((v, j) => v + (h / 2) * k2[j])), k4 = f(p.map((v, j) => v + h * k3[j]));
      p = p.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      out.push(p);
    }
    return out;
  };
  return (LORENZ = [run([1, 1, 20]), run([1 + 1e-5, 1, 20])]);
};

// points of the Koch curve from a to b, only where they can be seen in the window [x0, x1] (to the given depth)
function kochZoomPts(a, b, depth, x0, x1, out) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (Math.max(a[0], b[0]) + len * 0.3 < x0 || Math.min(a[0], b[0]) - len * 0.3 > x1) { if (out[out.length - 1]) out.push(null); return; } // nothing visible here: break the line
  if (depth === 0) { out.push(b); return; }
  const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3, p1 = [a[0] + dx, a[1] + dy], p3 = [a[0] + 2 * dx, a[1] + 2 * dy];
  const p2 = [p1[0] + dx / 2 - (Math.sqrt(3) / 2) * dy, p1[1] + dy / 2 + (Math.sqrt(3) / 2) * dx];
  kochZoomPts(a, p1, depth - 1, x0, x1, out); kochZoomPts(p1, p2, depth - 1, x0, x1, out); kochZoomPts(p2, p3, depth - 1, x0, x1, out); kochZoomPts(p3, b, depth - 1, x0, x1, out);
}

export default {
  id: 'fractals',
  subject: 'math',
  title: 'Fractals & Chaos',
  level: 'Intermediate',
  cover: 'fractals',
  tagline: 'Infinite detail, fractional dimensions, the butterfly effect, and the road to chaos.',
  description: r`Explore shapes with endless detail, measure dimensions that aren't whole numbers, watch a simple rule explode into chaos, zoom into the Mandelbrot set and its Julia sets, follow period doubling to chaos, and draw perfect fractals with random moves.`,
  prereq: 'Sequences & Series, and Complex Numbers (for the Mandelbrot and Julia set lessons)',
  chapters: [
    {
      title: 'Fractals',
      summary: 'Self-similar shapes.',
      lessons: [
        {
          id: 'self-similar',
          title: 'Infinite Detail',
          summary: 'Sierpinski and Koch',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The Sierpinski triangle',
              body: r`Start with a triangle. Cut out the middle quarter, leaving 3 smaller triangles. Repeat on each of those, forever.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.1, xmax: 2.1, ymin: -0.1, ymax: 1.85, grid: false, axes: false, maxWidth: 460,
                params: { n: { min: 0, max: 7, step: 1, value: 3, label: 'steps', color: 'violet', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => sierpinski(plot, s, p.n),
                readout: (p) => r`$3^{${p.n}} = ${3 ** p.n}$ triangles, covering $\left(\tfrac34\right)^{${p.n}} = ${f3(0.75 ** p.n)}$ of the original area`,
              },
              after: r`Zoom into any corner and you see a copy of the whole shape. That's **self-similarity**, the hallmark of a **fractal**. The remaining area shrinks toward zero, yet the shape never disappears.`,
            },
            {
              type: 'numeric',
              title: 'Area left',
              prompt: 'What fraction of the original area remains after 2 steps? (A fraction like 9/16 is fine.)',
              answer: 9 / 16,
              tol: 0.001,
              wrong: [{ v: 0.5, why: r`Each step keeps $\tfrac34$ of the area: $\left(\tfrac34\right)^2$.` }, { v: 0.75, why: 'That’s after 1 step. Multiply by ¾ again.' }],
              explain: r`Each step keeps 3 of 4 equal pieces: $\left(\tfrac34\right)^2 = \tfrac{9}{16}$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The Koch snowflake',
              body: r`Start with a triangle. On each side, replace the middle third with a spike (two sides of a smaller equilateral triangle). Repeat.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.75, xmax: 0.75, ymin: -0.62, ymax: 0.8, grid: false, axes: false, maxWidth: 440,
                params: { n: { min: 0, max: 5, step: 1, value: 2, label: 'steps', color: 'blue', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const R = 0.6, A = [-R * Math.sin(Math.PI / 3), -R / 2], B = [R * Math.sin(Math.PI / 3), -R / 2], C = [0, R];
                  const pts = [...koch(A, C, p.n).slice(0, -1), ...koch(C, B, p.n).slice(0, -1), ...koch(B, A, p.n)];
                  return [s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-linejoin': 'round' })];
                },
                readout: (p) => r`perimeter $\times \left(\tfrac43\right)^{${p.n}} = ${f3((4 / 3) ** p.n)}$`,
              },
            },
            { /*anim:fractals*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Zooming forever',
              body: r`Here's the edge of the snowflake (a Koch curve), and we keep zooming in on its left end. Watch closely: every time the zoom reaches 3 times, the picture is exactly the same as when we started.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.02, xmax: 1.0, ymin: -0.05, ymax: 0.32, grid: false, axes: false, clipExtra: true,
                animate: { param: 't', speed: 0.3, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const z = 3 ** (p.t % 1), out = [[0, 0]];
                  // drawing the curve scaled by z about the left end = viewing the window [0, 1/z]
                  kochZoomPts([0, 0], [z, 0], z < 1.7 ? 6 : 7, -0.05, 1.05, out); // about a pixel per segment
                  return [s('path', { d: out.map((q, i) => (q ? `${i && out[i - 1] ? 'L' : 'M'}${plot.X(q[0]).toFixed(1)} ${plot.Y(q[1]).toFixed(1)}` : '')).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-linejoin': 'round' })];
                },
                readout: (p) => `${Math.floor(p.t)} full ×3 zooms so far, plus ×${fix(3 ** (p.t % 1), 2)} · the picture repeats at every ×3`,
              },
              after: r`The left third of a Koch curve is a copy of the whole curve, shrunk by a factor of 3, and its left third is a copy too, and so on forever. So zooming in by 3 brings back exactly the same picture, however far you go: there is never a smooth bit, which is why the curve has no tangent anywhere and infinite length. Real coastlines, clouds and ferns are self-similar too, though only roughly and only over a limited range of zooms.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Fractal trees',
              body: r`A tree is self-similar too: each branch looks like a smaller tree. Here every branch splits into two, turned by an angle and shrunk by a ratio. Change the rules.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.2, xmax: 2.2, ymin: -0.1, ymax: 3.3, grid: false, axes: false, maxWidth: 460,
                params: {
                  ang: { min: 10, max: 90, step: 1, value: 28, label: 'angle', color: 'green', format: (v) => `${v}°` },
                  ratio: { min: 0.4, max: 0.75, step: 0.01, value: 0.68, label: 'ratio', color: 'amber' },
                },
                extra: ({ plot, p, s }) => [s('path', { d: treePath(plot, (p.ang * Math.PI) / 180, p.ratio, 10), fill: 'none', stroke: 'var(--success)', 'stroke-width': 1.6, 'stroke-linecap': 'round' })],
                readout: (p) => `Each branch is ${p.ratio.toFixed(2)} times its parent, turned ±${p.ang}°.`,
              },
              after: r`Two numbers produce a whole forest of shapes. Lungs, blood vessels, rivers and lightning all branch like this, because branching packs a huge surface or reach into a small volume. The branching airways in your lungs end in about 70 square metres of surface for gas exchange.`,
            },
            {
              type: 'numeric',
              title: 'Total length',
              prompt: r`A tree's trunk is 1 m long, and every branch splits into 2 branches, each $0.4$ times as long. If it branched forever, what would the total length of all its branches be (trunk included)?`,
              unit: 'm',
              answer: 5,
              tol: 0.01,
              wrong: [{ v: 1.6667, tol: 0.01, why: r`That's $\frac{1}{1 - 0.4}$, a single line of branches. Each level has twice as many branches: the levels total $1, 0.8, 0.64, \ldots$` }, { v: 1.8, tol: 0.01, why: 'That’s just the first two levels. Keep adding: it’s a geometric series.' }],
              hint: r`Level $k$ has $2^k$ branches of length $0.4^k$, so the levels total $0.8^k$. Sum the geometric series.`,
              explain: r`The levels add $1 + 0.8 + 0.64 + \cdots = \frac{1}{1 - 0.8} = 5$ m. With a ratio above $0.5$, each level would be longer than the last and the total length would be infinite, even though the tree stays a finite size.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Infinite coastline',
              prompt: 'Each step multiplies the snowflake’s perimeter by 4/3. What happens to its perimeter and area as the steps go on forever?',
              choices: [
                { t: 'Infinite perimeter, but finite area', ok: true },
                { t: 'Both stay finite', why: r`$(\tfrac43)^n$ grows without limit. The perimeter is infinite.` },
                { t: 'Both become infinite', why: 'The snowflake always fits inside a circle, so its area is finite: it approaches 8/5 of the starting triangle.' },
              ],
              explain: r`The perimeter grows like $(\tfrac43)^n \to \infty$, yet the whole shape fits inside a circle, so its area stays finite (it approaches $\tfrac85$ of the original triangle). Real coastlines behave like this: the finer your ruler, the longer the coast measures.`,
            },
          ],
          recap: [
            'Fractals repeat their pattern at every scale (self-similarity).',
            'Sierpinski: the area shrinks to zero, but the shape persists.',
            'Koch snowflake: infinite perimeter enclosing a finite area.',
          ],
        },
        {
          id: 'dimension',
          title: 'Fractal Dimension',
          summary: 'Between 1 and 2',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Scaling copies',
              prompt: 'Double the side of a cube. How many copies of the original cube fit inside the new one?',
              answer: 8,
              wrong: [{ v: 4, why: 'That’s for a square (2D). A cube is 3D: 2 × 2 × 2.' }],
              explain: r`$2^3 = 8$. For a line it's $2^1 = 2$ copies, and for a square $2^2 = 4$. The exponent is the **dimension**: scaling by $s$ makes $N = s^D$ copies.`,
            },
            {
              type: 'explain',
              title: 'Dimension from scaling',
              body: r`If shrinking a shape by a factor $s$ gives $N$ copies that rebuild it, then $N = s^D$, so
$$D = \frac{\log N}{\log s}.$$

**Sierpinski triangle:** halve it ($s = 2$) and you get $N = 3$ copies:
$$D = \frac{\log 3}{\log 2} \approx 1.585$$
It's more than a line, but less than a filled-in area. A fractional dimension is what makes it a fractal.`,
            },
            {
              type: 'numeric',
              title: 'Koch dimension',
              prompt: 'The Koch curve is made of 4 copies of itself, each scaled down by a factor of 3. What is its dimension? (Give a decimal.)',
              answer: Math.log(4) / Math.log(3),
              tol: 0.005,
              wrong: [{ v: Math.log(3) / Math.log(4), tol: 0.005, why: r`$D = \frac{\log N}{\log s} = \frac{\log 4}{\log 3}$, not the other way round.` }, { v: 4 / 3, tol: 0.005, why: r`Use logarithms: D = log 4 ÷ log 3.` }],
              explain: r`$D = \frac{\log 4}{\log 3} \approx 1.262$. The Koch curve is "rougher" than a line, but less space-filling than the Sierpinski triangle.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Box counting',
              body: r`Most fractals aren't made of exact copies, so how do we measure their dimension? Cover the shape with a grid of boxes and count how many boxes it touches. Halve the box size and see how the count grows.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.03, xmax: 1.03, ymin: -0.03, ymax: 0.53, grid: false, axes: false, maxWidth: 600,
                params: { k: { min: 2, max: 7, step: 1, value: 3, label: 'box size', color: 'teal', format: (v) => `1/${2 ** v}` } },
                extra: ({ plot, p, s }) => {
                  const e = 1 / 2 ** p.k, w = plot.X(e) - plot.X(0);
                  const boxes = kochBoxes(p.k).map(([i, j]) => `M${plot.X(i * e).toFixed(1)} ${plot.Y((j + 1) * e).toFixed(1)}h${w.toFixed(1)}v${w.toFixed(1)}h${(-w).toFixed(1)}Z`).join('');
                  const P = koch([0, 0], [1, 0], 5);
                  return [
                    s('path', { d: boxes, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 1 }),
                    s('path', { d: P.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5 }),
                  ];
                },
                readout: (p) => { const N = kochBoxes(p.k).length; return r`$N = ${N}$ boxes of size $\frac{1}{${2 ** p.k}}$ · estimate $D \approx \frac{\log ${N}}{\log ${2 ** p.k}} = ${(Math.log(N) / Math.log(2 ** p.k)).toFixed(2)}$`; },
              },
              after: r`For a line, halving the boxes doubles the count ($N \propto 1/\varepsilon$); for an area it quadruples ($N \propto 1/\varepsilon^2$). In general $N \propto 1/\varepsilon^D$. For the Koch curve the estimates wobble around 1.26–1.30, close to the exact $\log 4 / \log 3 \approx 1.262$. Scientists use exactly this method on photos of coastlines, clouds and lungs.`,
            },
            {
              type: 'numeric',
              title: 'The Sierpinski carpet',
              prompt: r`Divide a square into a $3 \times 3$ grid and remove the middle square, leaving 8. Repeat on each remaining square forever. What is the dimension of the resulting carpet? (3 decimal places.)`,
              answer: Math.log(8) / Math.log(3),
              tol: 0.003,
              wrong: [{ v: Math.log(3) / Math.log(8), tol: 0.003, why: r`Upside down: $D = \frac{\log(\text{copies})}{\log(\text{scale factor})} = \frac{\log 8}{\log 3}$.` }, { v: 2, tol: 0.003, why: 'Removing squares at every scale makes it less than a full area.' }, { v: 8 / 3, tol: 0.003, why: 'Use logarithms: D = log 8 ÷ log 3.' }],
              explain: r`8 copies, each scaled by $\frac13$: $D = \frac{\log 8}{\log 3} \approx 1.893$, nearly but not quite a full area. The 3D version, the **Menger sponge** (20 cubes kept out of 27), has $D = \frac{\log 20}{\log 3} \approx 2.727$: infinite surface area with zero volume.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How long is Britain’s coast?',
              body: r`In 1967, Benoît Mandelbrot asked "How long is the coast of Britain?" Measuring with a shorter ruler always gives a longer answer, because the ruler follows more and more bays and inlets.`,
              prompt: 'What does this suggest about coastlines?',
              choices: [
                { t: 'They behave like fractals, with a dimension a little above 1', ok: true },
                { t: 'Measuring is just inaccurate', why: 'The effect is systematic, not random error: the measured length keeps growing as the ruler shrinks.' },
                { t: 'Britain’s coast is infinitely long in reality', why: 'Physically there’s a limit at the scale of individual rocks and grains. But across a huge range of scales, coastlines behave like fractals.' },
              ],
              explain: r`Over a wide range of scales, coastlines look statistically self-similar. The west coast of Britain has a fractal dimension of about 1.25. That's why the "length of a coastline" depends on how you measure it.`,
            },
          ],
          recap: [
            r`Dimension $D$: scaling by $s$ gives $N = s^D$ copies, so $D = \log N / \log s$.`,
            'Sierpinski ≈ 1.585, Koch ≈ 1.262: fractals have non-whole dimensions.',
            'Coastlines, clouds and ferns are approximately fractal.',
          ],
        },
      ],
    },
    {
      title: 'Chaos',
      summary: 'Simple rules, unpredictable results.',
      lessons: [
        {
          id: 'logistic',
          title: 'The Logistic Map',
          summary: 'From order to chaos',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A simple population model',
              body: r`A population (as a fraction of its maximum, $x$) changes each year by the rule
$$x_{\text{next}} = r\,x\,(1 - x).$$
Small populations grow (by the factor $r$), but crowding $(1 - x)$ holds them back. Change the growth rate $r$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 1, grid: 5, gridY: 0.25, height: 300, axes: { xlabel: 'year', ylabel: 'x' },
                params: { rr: { min: 1, max: 4, step: 0.01, value: 2.8, label: '$r$', color: 'coral', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => {
                  const xs = logistic(p.rr, 0.2, 50);
                  return [
                    s('path', { d: xs.map((x, i) => `${i ? 'L' : 'M'}${plot.X(i)} ${plot.Y(x)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2 }),
                    ...xs.map((x, i) => s('circle', { cx: plot.X(i), cy: plot.Y(x), r: 2.5, class: 'fl-coral' })),
                  ];
                },
                readout: (p) => (p.rr < 3 ? 'Settles to a single steady value.' : p.rr < 3.449 ? 'Flips back and forth between 2 values.' : p.rr < 3.57 ? 'Cycles through 4, then 8, 16… values as r grows.' : 'Chaos: it never settles or repeats.'),
              },
              after: r`Below $r = 3$ the population settles. Just above 3 it oscillates between **two** values, then 4, 8, 16… (period doubling). Beyond about $r \approx 3.57$ the behaviour becomes **chaotic**: completely deterministic, yet never repeating.`,
            },
            {
              type: 'numeric',
              title: 'Steady state',
              prompt: r`For $r = 2$, the population settles to a steady value where $x = 2x(1 - x)$. What is that value (other than 0)?`,
              answer: 0.5,
              wrong: [{ v: 1, why: r`Check: $2 \times 1 \times 0 = 0 \ne 1$.` }],
              explain: r`$x = 2x(1 - x)$. Divide by $x$: $1 = 2(1 - x)$, so $x = \tfrac12$. In general the steady state is $x^* = 1 - \frac1r$.`,
            },
            {
              type: 'numeric',
              title: 'A healthier population',
              prompt: r`The steady state is $x^* = 1 - \frac1r$. What is it for $r = 2.5$?`,
              answer: 0.6,
              tol: 0.001,
              wrong: [{ v: 0.4, tol: 0.001, why: r`That's $\frac1r$. Subtract it from 1.` }],
              explain: r`$1 - \frac{1}{2.5} = 0.6$. Check: $2.5 \times 0.6 \times 0.4 = 0.6$ ✓. A faster-growing species settles at a higher level, up to the point ($r = 3$) where it starts to overshoot.`,
            },
            {
              type: 'mcq',
              title: 'Slow breeders',
              prompt: r`What happens in the long run if $r = 0.8$?`,
              choices: [
                { t: 'The population dies out', ok: true },
                { t: 'It settles at a small positive value', why: r`The formula $1 - \frac1r$ gives $-0.25$, which is impossible for a population. Each year multiplies $x$ by at most $0.8$.` },
                { t: 'It oscillates', why: 'With r below 1 every year shrinks the population.' },
              ],
              explain: r`Each year multiplies $x$ by $r(1 - x) < 0.8$, so the population shrinks towards 0. A species needs $r > 1$ (more than one surviving offspring per adult) just to persist.`,
            },
            {
              type: 'numeric',
              title: 'One step',
              prompt: r`Apply the logistic map $x \to 2.5x(1 - x)$ once to $x = 0.5$. What do you get?`,
              answer: 0.625,
              tol: 0.0001,
              explain: r`$2.5 \times 0.5 \times 0.5 = 0.625$. Keep going and the values settle at the fixed point $1 - \frac{1}{2.5} = 0.6$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Deterministic but unpredictable',
              prompt: 'At r = 4, the rule has no randomness at all. Why is long-term prediction still practically impossible?',
              choices: [
                { t: 'Tiny differences in the starting value grow exponentially, so any measurement error ruins the forecast', ok: true },
                { t: 'The rule secretly uses random numbers', why: 'There’s no randomness: the same starting value always gives exactly the same sequence.' },
                { t: 'Computers can’t multiply accurately', why: 'Computers multiply very accurately. The problem is that any tiny uncertainty grows explosively.' },
              ],
              explain: r`This is **sensitive dependence on initial conditions**. Next lesson, you'll see two nearly identical starting values race apart.`,
            },
          ],
          recap: [
            r`Logistic map: $x \to rx(1 - x)$, a one-line population model.`,
            'As r increases: a steady value, then cycles of 2, 4, 8…, then chaos (r ≳ 3.57).',
            'Chaos is deterministic, yet unpredictable in practice.',
          ],
        },
        {
          id: 'butterfly',
          title: 'The Butterfly Effect',
          summary: 'Small causes, big effects',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Two almost identical starts',
              body: r`Run the logistic map at $r = 4$ from two starting values that differ by a tiny amount $\delta$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 1, grid: 5, gridY: 0.25, height: 300, axes: { xlabel: 'step', ylabel: 'x' },
                params: { e: { min: 1, max: 9, step: 1, value: 6, label: r`$\delta = 10^{-?}$`, color: 'violet', format: (v) => `10⁻${v}` } },
                extra: ({ plot, p, s }) => {
                  const a = logistic(4, 0.2, 40), b = logistic(4, 0.2 + 10 ** -p.e, 40);
                  return [
                    s('path', { d: a.map((x, i) => `${i ? 'L' : 'M'}${plot.X(i)} ${plot.Y(x)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2.5 }),
                    s('path', { d: b.map((x, i) => `${i ? 'L' : 'M'}${plot.X(i)} ${plot.Y(x)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
                  ];
                },
                readout: (p) => {
                  const a = logistic(4, 0.2, 60), b = logistic(4, 0.2 + 10 ** -p.e, 60);
                  const k = a.findIndex((x, i) => Math.abs(x - b[i]) > 0.3);
                  return r`The two runs separate after about ${k} steps`;
                },
              },
              after: r`The paths agree for a while, then suddenly diverge completely. Making the difference 1000 times smaller only buys about 10 more steps. At $r = 4$, errors roughly **double** each step, and $2^{10} \approx 1000$.`,
            },
            {
              type: 'explain',
              title: 'Lorenz’s discovery',
              body: r`In 1961, meteorologist Edward Lorenz reran a weather simulation, typing in a value rounded from 0.506127 to 0.506. The new forecast soon bore no resemblance to the original.

He later asked whether the flap of a butterfly's wings in Brazil could set off a tornado in Texas: the **butterfly effect**. That's why detailed weather forecasts lose their skill after roughly a week or two, however good the computers.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The Lorenz attractor',
              body: r`Lorenz boiled weather down to three equations for air circulating in a heated layer:
$$\dot x = 10(y - x), \quad \dot y = x(28 - z) - y, \quad \dot z = xy - \tfrac83 z.$$
Here are two runs whose starting points differ by $0.00001$. Run time forward.`,
              widget: {
                kind: 'graph', equal: true, xmin: -24, xmax: 24, ymin: 0, ymax: 52, grid: false, axes: false, maxWidth: 440,
                params: { T: { min: 1, max: 40, step: 0.5, value: 8, label: 'time', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const n = Math.round(p.T * 100), [A, B] = lorenz();
                  const path = (L) => L.slice(0, n + 1).map(([x, , z], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(z).toFixed(1)}`).join('');
                  return [
                    s('path', { d: path(A), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 1.2, opacity: 0.8 }),
                    s('path', { d: path(B), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 1.2, opacity: 0.8 }),
                    s('circle', { cx: plot.X(A[n][0]), cy: plot.Y(A[n][2]), r: 6, class: 'fl-blue' }),
                    s('circle', { cx: plot.X(B[n][0]), cy: plot.Y(B[n][2]), r: 6, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => { const n = Math.round(p.T * 100), [A, B] = lorenz(), d = Math.hypot(...A[n].map((v, j) => v - B[n][j])); return `Distance between the two runs: **${d < 0.01 ? d.toExponential(1) : d.toFixed(2)}**`; },
              },
              after: r`Both runs trace the same butterfly-shaped **strange attractor**, looping around two lobes, but once the tiny difference has grown, by about time 13, they switch lobes at different times and go their separate ways. The attractor itself is a fractal, with dimension about 2.06.`,
            },
            {
              type: 'mcq',
              title: 'Weather versus climate',
              prompt: 'If weather is chaotic and unpredictable beyond two weeks, how can scientists predict the climate decades ahead?',
              choices: [
                { t: 'Climate is the statistics of weather (averages, ranges), and those can be predictable even when the day-to-day path isn’t', ok: true },
                { t: 'They can’t: climate predictions are guesses', why: 'Statistics of a chaotic system can be quite stable. In the Lorenz system, individual paths diverge, but both stay on the same attractor.' },
                { t: 'Climate isn’t chaotic because it’s slower', why: 'Speed isn’t the point. Long-run averages are predictable even though individual paths are not.' },
              ],
              explain: r`In the Lorenz system, you can't say which lobe the path will be on next month, but you can say how much time it spends on each lobe in the long run. Similarly, nobody can forecast the weather on a day in 2050, but the average temperature of the 2040s responds predictably to changes such as more greenhouse gases.`,
            },
            {
              type: 'numeric',
              title: 'From a whisper to a storm',
              prompt: r`Suppose a tiny error grows by a factor $e$ every day (a Lyapunov exponent of 1 per day). Starting from an error of one millionth, after how many days does it reach size 1? (1 decimal place.)`,
              unit: 'days',
              answer: Math.log(1e6),
              tol: 0.1,
              explain: r`$\ln(10^6) \approx 13.8$ days. Improving the initial measurement a thousandfold would gain only $\ln 1000 \approx 6.9$ days.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Buying time',
              prompt: 'If errors double every day, how many extra days of good forecast do you gain by measuring the starting weather 1000 times more precisely?',
              unit: 'days',
              answer: 10,
              tol: 0.5,
              wrong: [{ v: 1000, why: r`Errors grow exponentially, so precision only buys time logarithmically: $2^{10} \approx 1000$.` }],
              explain: r`An error 1000 times smaller takes $\log_2 1000 \approx 10$ more doublings to grow to the same size: about 10 extra days. A huge improvement in measurement buys only a modest gain in forecast time. That's the frustrating arithmetic of chaos.`,
            },
          ],
          recap: [
            'In chaotic systems, tiny initial differences grow exponentially (the butterfly effect).',
            'More precise measurements only add time logarithmically.',
            'Weather is chaotic, which limits detailed forecasts to about one to two weeks.',
          ],
        },
        {
          id: 'mandelbrot',
          title: 'The Mandelbrot Set',
          summary: 'Infinite complexity from z² + c',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'A simple rule',
              body: r`Pick a complex number $c$. Start at $z = 0$ and repeat
$$z \to z^2 + c.$$
If $z$ stays bounded forever, $c$ belongs to the **Mandelbrot set**. If $z$ flies off to infinity, it doesn't.

For example, $c = -1$: $0 \to -1 \to 0 \to -1 \to \cdots$ stays bounded, so it's in. But $c = 1$: $0 \to 1 \to 2 \to 5 \to 26 \to \cdots$ escapes, so it's out.`,
            },
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'In or out?',
              prompt: r`Is $c = i$ in the Mandelbrot set? (Iterate: $0 \to i \to i^2 + i \to \cdots$)`,
              cols: 2,
              choices: [
                { t: 'Yes', ok: true },
                { t: 'No', why: r`Compute: $0 \to i \to -1 + i \to (-1 + i)^2 + i = -i \to (-i)^2 + i = -1 + i \to \cdots$ It cycles forever without escaping.` },
              ],
              explain: r`$0 \to i \to -1 + i \to -i \to -1 + i \to -i \to \cdots$ It falls into a repeating cycle and stays bounded, so $c = i$ is in the set.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Zoom in',
              body: r`Black points are in the set. The colours show how quickly the outside points escape. **Tap anywhere to zoom in** (×3). Try the edges, and raise the detail when you zoom deep.`,
              widget: { kind: 'mandel', iter: 80, needZooms: 2 },
              gate: true,
              after: r`However far you zoom into the boundary, new detail appears, including tiny copies of the whole set. One line of algebra produces infinite complexity. Benoît Mandelbrot's computer images of it, from around 1980, helped launch the study of fractals.`,
            },
            {
              type: 'numeric',
              title: 'How fast does it escape?',
              prompt: r`For $c = 1$, the sequence goes $0 \to 1 \to 2 \to 5 \to \cdots$. After how many steps is $|z|$ first **greater than** 2?`,
              unit: 'steps',
              answer: 3,
              wrong: [{ v: 2, why: r`After 2 steps $z = 2$, which is not *greater* than 2.` }],
              explain: r`Step 1: 1. Step 2: 2. Step 3: 5, which is greater than 2, so the escape is certain from here on. Pictures of the set colour each outside point by this escape count, producing the coloured bands around the black set.`,
            },
            {
              type: 'mcq',
              title: 'Area and edge',
              prompt: 'Which is true of the Mandelbrot set?',
              choices: [
                { t: 'Its area is finite (about 1.5), but its boundary is so wiggly that its dimension is 2', ok: true },
                { t: 'Its area is infinite', why: r`It fits inside the circle $|c| \le 2$, so its area is finite: about 1.506.` },
                { t: 'Its boundary has dimension 1, like a smooth curve', why: 'The boundary is as wiggly as a curve can be: in 1991 Mitsuhiro Shishikura proved its dimension is 2.' },
              ],
              explain: r`The set fits inside $|c| \le 2$, and its area is estimated at about 1.506. In 1991 Mitsuhiro Shishikura proved that its boundary has fractal dimension exactly 2: a curve so crinkled that it is as "thick" as an area.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Escape test',
              prompt: r`Once $|z| > 2$, the sequence is guaranteed to escape to infinity. Is $c = -2$ in the set?`,
              choices: [
                { t: r`Yes: 0 → −2 → 2 → 2 → 2… stays at 2`, ok: true },
                { t: 'No: it reaches 2', why: r`Reaching |z| = 2 isn’t enough to escape: it has to go strictly past 2. Here it stays at exactly 2 forever.` },
              ],
              explain: r`$0 \to -2 \to 4 - 2 = 2 \to 4 - 2 = 2 \to \cdots$ It sticks at 2, so it's bounded and $c = -2$ is in the set: it's the leftmost tip of the Mandelbrot set.`,
            },
          ],
          recap: [
            r`Mandelbrot set: the values $c$ for which $z \to z^2 + c$ (starting from 0) stays bounded.`,
            r`If $|z|$ ever exceeds 2, the sequence escapes.`,
            'Its boundary has endless detail, with tiny copies of the whole set.',
          ],
        },
      ],
    },
    {
      title: 'Deeper into Chaos',
      summary: 'Period doubling, the chaos game and Julia sets.',
      lessons: [
        {
          id: 'doubling',
          title: 'Period Doubling',
          summary: 'The road to chaos',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Cobwebs',
              body: r`A **cobweb diagram** shows the logistic map in action. From $x$, go up to the curve $y = rx(1 - x)$ to get the next value, then across to the diagonal $y = x$ to use it as the new input. Repeat. Change $r$ and watch the web.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: 0.25, maxWidth: 420, axes: { xlabel: 'x', ylabel: 'next x' },
                params: { rr: { min: 1, max: 4, step: 0.01, value: 2.8, label: '$r$', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x, p) => p.rr * x * (1 - x), color: 'blue', width: 2.5 }, { f: (x) => x, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => [s('path', { d: cobweb(plot, p.rr, 0.2, 80), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 1.3, opacity: 0.85 })],
                readout: (p) => { const k = period(p.rr); return k === 1 ? 'The web spirals in to one point: a **steady state**.' : k ? `The web settles into a loop: a cycle of **${k}** values.` : 'The web never settles: **chaos**.'; },
              },
              after: r`The steady state is where the curve crosses the diagonal. Whether the web spirals **into** that point or **away** from it depends on how steep the curve is there.`,
            },
            {
              type: 'numeric',
              title: 'When does it wobble?',
              body: r`A steady state $x^*$ is stable when the slope of the curve there is between $-1$ and $1$. For the logistic map, the slope at $x^* = 1 - \frac1r$ works out to be $2 - r$.`,
              prompt: r`At what value of $r$ does the slope reach $-1$, so that the steady state stops being stable?`,
              answer: 3,
              wrong: [{ v: 1, why: r`At $r = 1$ the slope is $+1$: that's where the population first survives. Solve $2 - r = -1$.` }, { v: 4, why: r`At $r = 4$ the slope is $-2$, well past the limit. Solve $2 - r = -1$.` }],
              explain: r`$2 - r = -1$ gives $r = 3$. Beyond it each overshoot is bigger than the last, so the population can't settle: it bounces between two values instead. That's exactly where the first **period doubling** happens.`,
            },
            {
              type: 'interactive',
              title: 'The bifurcation diagram',
              body: r`For each $r$ (left to right), the dots show the values the population keeps visiting in the long run. One branch means a steady state; two means a 2-cycle, and so on. Hidden in the chaos are calm **windows**. Move the marker to find one where the population cycles through exactly **3** values.`,
              widget: {
                kind: 'graph', xmin: 2.8, xmax: 4, ymin: 0, ymax: 1, grid: false, height: 320, axes: { xlabel: 'r', ylabel: 'x', xticks: 0.2, yticks: 0.5 },
                params: { rr: { min: 2.8, max: 4, step: 0.001, value: 3.2, label: '$r$', color: 'coral', format: (v) => v.toFixed(3) } },
                extra: ({ plot, p, s }) => {
                  let d = '';
                  for (const [rr, ys] of bifurcation()) for (const y of ys) d += `M${plot.X(rr).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`;
                  return [
                    s('path', { d, stroke: 'var(--blue)', 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.6 }),
                    s('line', { x1: plot.X(p.rr), x2: plot.X(p.rr), y1: plot.Y(0), y2: plot.Y(1), stroke: 'var(--coral)', 'stroke-width': 2 }),
                  ];
                },
                readout: (p) => { const k = period(p.rr); return k ? `At $r = ${p.rr.toFixed(3)}$: a cycle of **${k}**` : `At $r = ${p.rr.toFixed(3)}$: chaos`; },
                goal: (p) => period(p.rr) === 3,
                hint: 'Look for the widest white gap in the chaotic region, a little above r = 3.8.',
                solution: { rr: 3.835 },
              },
              explain: r`The period-3 window opens at $r = 1 + \sqrt8 \approx 3.828$. Inside it the 3-cycle itself period-doubles (6, 12, …) back into chaos. Zoom into any window and you find a miniature copy of the whole diagram: the bifurcation diagram is a fractal too.`,
            },
            {
              type: 'explain',
              title: 'Period three implies chaos',
              body: r`In 1975 Tien-Yien Li and James Yorke proved a startling theorem, in a paper titled *Period Three Implies Chaos*: if a map like this has a cycle of length 3, it has cycles of **every** length, and chaotic behaviour too. (The Ukrainian mathematician Oleksandr Sharkovsky had proved an even stronger result in 1964, unknown in the West.)

The paper also gave the field its name: this is where the word **chaos** entered mathematics.`,
            },
            {
              type: 'numeric',
              title: 'The edge of chaos',
              prompt: r`Period doublings in the logistic map come faster and faster, piling up at $r_\infty \approx 3.5699$. Beyond that, chaos is common. What is $r_\infty$ to 2 decimal places?`,
              answer: 3.57,
              tol: 0.005,
              explain: r`$r_\infty \approx 3.57$. The gaps between successive doublings shrink by Feigenbaum’s factor 4.669 each time, so infinitely many doublings fit before 3.57.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Feigenbaum’s constant',
              body: r`The period doublings happen at $r_1 = 3$ (2-cycle begins), $r_2 = 3.4495$ (4-cycle) and $r_3 = 3.5441$ (8-cycle), getting closer and closer together.`,
              prompt: r`Compute the ratio of successive gaps, $\dfrac{r_2 - r_1}{r_3 - r_2}$. (2 decimal places.)`,
              answer: (3.4495 - 3) / (3.5441 - 3.4495),
              tol: 0.02,
              wrong: [{ v: 0.21, tol: 0.02, why: 'That’s the ratio the other way up. Divide the bigger gap by the smaller one.' }],
              explain: r`$\frac{0.4495}{0.0946} \approx 4.75$. Later ratios approach $\delta = 4.6692\ldots$, which Mitchell Feigenbaum discovered in 1975 with a pocket calculator. Amazingly, the **same** constant appears for every smooth single-humped map, and even in experiments on dripping taps, electronic circuits and convecting fluids. It is as universal in chaos as $\pi$ is in geometry.`,
            },
          ],
          recap: [
            'A steady state is stable while the slope there lies between −1 and 1; for the logistic map that fails at r = 3.',
            'Period doubling (2, 4, 8, …) leads to chaos at r ≈ 3.57, with calm windows inside.',
            'Period three implies chaos (Li and Yorke, 1975).',
            'The doublings close in by Feigenbaum’s universal ratio, δ ≈ 4.669.',
          ],
        },
        {
          id: 'chaosgame',
          title: 'The Chaos Game',
          summary: 'Random moves, perfect fractals',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A random walk',
              body: r`Mark the three corners of a triangle and put a dot anywhere. Now repeat: pick one of the three corners at random, and move the dot **halfway** towards it, leaving a mark.`,
              prompt: 'After thousands of moves, what picture do the marks make?',
              choices: [
                { t: 'A Sierpinski triangle', ok: true },
                { t: 'A random scatter filling the triangle', why: 'Surprisingly, large regions are never visited at all. Try it on the next screen.' },
                { t: 'Three clusters, one near each corner', why: 'The dot never settles near one corner: each move is towards a random one.' },
                { t: 'A circle', why: 'Try it on the next screen!' },
              ],
              explain: r`The random moves draw a perfect Sierpinski triangle. Michael Barnsley popularised this "chaos game" in 1988. See it happen next.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Play the chaos game',
              body: r`Each dot is one move of the game. Add more moves.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.05, xmax: 1.05, ymin: -0.6, ymax: 1.08, grid: false, axes: false, maxWidth: 440,
                params: { N: { min: 100, max: 20000, step: 100, value: 1000, label: 'moves', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const { d, V } = chaosPath(plot, 3, 0.5, p.N);
                  return [s('path', { d, stroke: 'var(--violet)', 'stroke-width': 1.6, 'stroke-linecap': 'round' }), ...V.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5, class: 'fl-coral' }))];
                },
                readout: (p) => `${p.N.toLocaleString()} moves`,
              },
              after: r`Randomness decides the **order** in which points appear, but not the final picture. That is always the same Sierpinski triangle.`,
            },
            {
              type: 'mcq',
              title: 'Why the holes?',
              prompt: 'Why does the dot never land in the big empty triangle in the middle (after the first few moves)?',
              choices: [
                { t: 'Halving the distance to a corner always lands in that corner’s half-size triangle, never in the middle', ok: true },
                { t: 'It does land there, just rarely', why: 'Once the dot is in the triangle, a halfway move towards a corner always lands in the half-size triangle at that corner. The middle is never reached.' },
                { t: 'The random numbers avoid it', why: 'Every corner is chosen fairly. The geometry of halving is what avoids the middle.' },
              ],
              explain: r`Moving halfway towards corner A shrinks the whole triangle by $\frac12$ towards A, onto the corner triangle at A. So each move lands in one of the three corner triangles, never the middle one. Applying the same argument to the smaller triangles explains every hole, at every scale.`,
            },
            {
              type: 'interactive',
              title: 'Other shapes',
              body: r`Now choose the number of corners and the **shrink factor** (how much of the distance to the chosen corner remains after a move: $0.5$ means halfway). Make a pattern of **five separate copies** around a pentagon, with clear gaps between them.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.1, xmax: 1.1, ymin: -1.1, ymax: 1.1, grid: false, axes: false, maxWidth: 440,
                params: {
                  n: { min: 3, max: 6, step: 1, value: 4, label: 'corners', color: 'blue' },
                  sc: { min: 0.3, max: 0.7, step: 0.01, value: 0.5, label: 'shrink factor', color: 'coral' },
                },
                extra: ({ plot, p, s }) => {
                  const { d, V } = chaosPath(plot, p.n, p.sc, 15000);
                  return [s('path', { d, stroke: 'var(--blue)', 'stroke-width': 1.4, 'stroke-linecap': 'round' }), ...V.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5, class: 'fl-coral' }))];
                },
                readout: (p) => `${p.n} corners, shrink factor ${p.sc.toFixed(2)}`,
                goal: (p) => p.n === 5 && p.sc <= 0.4,
                hint: 'Choose 5 corners, then lower the shrink factor until the five copies stop overlapping.',
                solution: { n: 5, sc: 0.38 },
              },
              explain: r`With 5 corners and a shrink factor of about $0.38$ or less, the five copies separate into a lacy pentagonal fractal. The value $0.382 = 1/\varphi^2$ (with $\varphi$ the golden ratio) makes neighbouring copies just touch. Larger factors make the copies overlap and blur together.`,
            },
            {
              type: 'mcq',
              title: 'Four corners, halfway',
              prompt: 'What does the chaos game produce with 4 corners (a square) and a shrink factor of exactly 0.5?',
              choices: [
                { t: 'The dots fill the whole square evenly', ok: true },
                { t: 'A square version of the Sierpinski triangle, with holes', why: 'Four half-size squares fit together exactly into the big square, leaving no hole to repeat.' },
                { t: 'Four dots at the corners', why: 'The dot keeps moving around; it never sticks to a corner.' },
              ],
              explain: r`Four half-size copies of a square tile it perfectly with no gaps, so nothing is ever left out: the dots fill the square, with dimension $\frac{\log 4}{\log 2} = 2$. A fractal needs the copies to leave gaps (or overlap in a special way).`,
            },
            {
              type: 'explain',
              title: 'Barnsley’s fern',
              body: r`The chaos game can use any shrinking moves, not just "towards a corner". Barnsley found that **four** simple moves (each a stretch, shrink, rotation and shift), chosen at random with probabilities 85%, 7%, 7% and 1%, draw a startlingly realistic fern.

This is an **iterated function system**. Each move maps the whole fern onto one part of itself: one onto everything above the lowest pair of leaves, two onto those leaves, and one squashes it flat into the stem. In the 1990s this idea drove "fractal image compression", which stored pictures as a handful of moves.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A pentagonal fractal',
              prompt: r`The five-corner pattern with shrink factor $0.382$ is made of 5 copies of itself, each scaled by $0.382$. What is its dimension? (2 decimal places.)`,
              answer: Math.log(5) / Math.log(1 / 0.382),
              tol: 0.01,
              wrong: [{ v: Math.log(0.382) / Math.log(5), tol: 0.01, why: r`Use $D = \frac{\log N}{\log s}$ with $N = 5$ copies and scale factor $s = \frac{1}{0.382}$.` }, { v: 5 * 0.382, tol: 0.01, why: 'Dimension uses logarithms: log 5 ÷ log(1/0.382).' }],
              explain: r`$D = \frac{\log 5}{\log (1/0.382)} = \frac{\log 5}{\log 2.618} \approx 1.67$. It is a bit more space-filling than the Sierpinski triangle (1.585), as you'd expect from 5 copies each a little smaller than half size.`,
            },
          ],
          recap: [
            'The chaos game: jump part of the way to a random corner, over and over.',
            'Random order, but always the same final fractal (Sierpinski for 3 corners, halfway).',
            'Copies must leave gaps: 4 corners at halfway just fill the square.',
            'Iterated function systems draw ferns and other natural shapes.',
          ],
        },
        {
          id: 'julia',
          title: 'Julia Sets',
          summary: 'The Mandelbrot set’s family',
          icon: 'eye',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'The simplest case',
              body: r`Instead of starting at $0$ and varying $c$, fix $c$ and vary the **starting point** $z$. With $c = 0$ the rule is just $z \to z^2$: starting at $0.9$ gives $0.81, 0.66, 0.43, \ldots$ (shrinking to 0), while $1.1$ gives $1.21, 1.46, 2.14, \ldots$ (escaping).`,
              prompt: r`For $z \to z^2$, the starting points that stay bounded form a disc. What is its radius?`,
              answer: 1,
              wrong: [{ v: 2, why: r`Squaring a number bigger than 1 makes it bigger, so starting points with $|z| > 1$ escape.` }],
              explain: r`Points with $|z| < 1$ shrink towards 0, points with $|z| > 1$ escape, and points with $|z| = 1$ stay on the unit circle forever. That circle is the **Julia set** of $z^2$: the boundary between staying and escaping. For other values of $c$ the boundary becomes a fractal.`,
            },
            {
              type: 'interactive',
              title: 'Choose your c',
              body: r`Every point $c$ has its own Julia set. Choose $c$ on the small map of the Mandelbrot set and watch its Julia set change. Black points stay bounded forever. Find a $c$ whose Julia set shatters into **dust**.`,
              widget: { kind: 'julia', c: [-0.123, 0.745], goal: 'dust', solution: [0.4, 0.4] },
              hint: 'Try points just outside the black region of the map.',
              explain: r`For $c$ inside the Mandelbrot set the Julia set is one connected piece; for $c$ outside it breaks into infinitely many specks, a "Cantor dust". The Mandelbrot set is exactly a map of which Julia sets hold together. Near its boundary, the Julia sets look like the nearby part of the Mandelbrot set itself.`,
            },
            {
              type: 'mcq',
              title: 'A dictionary',
              prompt: 'Which statement links the Mandelbrot set to Julia sets?',
              choices: [
                { t: 'c is in the Mandelbrot set exactly when the Julia set of z² + c is connected', ok: true },
                { t: 'The Mandelbrot set is the Julia set for c = 0', why: 'The Julia set for c = 0 is just a circle. The Mandelbrot set lives in the space of c values, not z values.' },
                { t: 'They are unrelated: one varies c, the other z', why: 'They are deeply related. Testing whether 0 stays bounded decides whether the Julia set is connected.' },
              ],
              explain: r`Pierre Fatou and Gaston Julia proved around 1919 that the Julia set of $z^2 + c$ is connected exactly when the orbit of $0$ stays bounded, which is the definition of the Mandelbrot set. They worked this out by hand, sixty years before computers could draw the pictures.`,
            },
            {
              type: 'explain',
              title: 'A gallery',
              body: r`Some Julia sets have nicknames:

- $c = -1$: the **basilica**, an infinite chain of bubbles (points cycle $0 \to -1 \to 0$).
- $c = -0.123 + 0.745i$: **Douady's rabbit**, with three-eared bubbles (a 3-cycle).
- $c = i$: a **dendrite**, all branches and no inside at all.
- $c = 0.25$, at the cusp of the Mandelbrot set: the **cauliflower**.

Gaston Julia was badly wounded in the First World War and wrote much of his prize-winning work while recovering. Interest faded until Mandelbrot's computer pictures revived it around 1980.`,
            },
            {
              type: 'numeric',
              title: 'A short cycle',
              prompt: r`For $z \to z^2 - 1$, start at $z = 0$: you get $0, -1, 0, -1, \dots$ What is the period of this cycle?`,
              answer: 2,
              explain: r`$0 \to -1 \to 0$: period 2. Because the critical point 0 stays bounded, the Julia set of $z^2 - 1$ is connected (it’s the "basilica"), and $c = -1$ lies in the Mandelbrot set.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The interval',
              body: r`For $c = -2$ the rule is $z \to z^2 - 2$.`,
              prompt: r`Does the real starting point $z = 1.5$ stay bounded?`,
              choices: [
                { t: r`Yes: for any $x$ between $-2$ and $2$, $x^2 - 2$ is again between $-2$ and $2$`, ok: true },
                { t: r`No: it escapes after a few steps`, why: r`$1.5 \to 0.25 \to -1.94 \to 1.75 \to 1.08 \to \ldots$: it bounces around inside $[-2, 2]$ forever.` },
                { t: 'It depends on rounding', why: 'Mathematically it stays in [−2, 2] forever: if −2 ≤ x ≤ 2 then 0 ≤ x² ≤ 4, so −2 ≤ x² − 2 ≤ 2.' },
              ],
              explain: r`If $-2 \le x \le 2$ then $0 \le x^2 \le 4$, so $-2 \le x^2 - 2 \le 2$: the interval maps into itself and nothing in it escapes. In fact the whole Julia set of $z^2 - 2$ is exactly this interval, the thinnest possible connected Julia set. ($c = -2$ is the leftmost tip of the Mandelbrot set.) The values bounce around chaotically, just like the logistic map at $r = 4$, which is the same map in disguise.`,
            },
          ],
          recap: [
            r`Fix $c$, vary the starting point: the Julia set is the boundary between bounded and escaping points.`,
            'c in the Mandelbrot set ⇔ its Julia set is connected; outside, it is dust.',
            r`$z^2$ gives a circle, $z^2 - 2$ an interval, and other values of $c$ give fractals.`,
          ],
        },
      ],
    },
  ],
};
