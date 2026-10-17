import { fix } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const TAU = 2 * Math.PI;

// ---------- fields ----------
const FIELDS = [
  { name: '(1, 0.5)', f: () => [1, 0.5] },
  { name: '(x, y)', f: (x, y) => [x, y] },
  { name: '(−y, x)', f: (x, y) => [-y, x] },
  { name: '(y, 0)', f: (x, y) => [y, 0] },
  { name: '(x, −y)', f: (x, y) => [x, -y] },
  { name: '(−x, −y)', f: (x, y) => [-x, -y] },
];
// draw a field as arrows on a grid; arrow length grows with |F| but is capped so arrows never overlap
function fieldArrows({ plot, arrow }, f, { step = 1, x0 = plot.xmin, x1 = plot.xmax, y0 = plot.ymin, y1 = plot.ymax, scale = 0.42, color = 'var(--blue)', faint = false } = {}) {
  const els = [];
  for (let x = Math.ceil(x0 / step) * step; x <= x1 + 1e-9; x += step) for (let y = Math.ceil(y0 / step) * step; y <= y1 + 1e-9; y += step) {
    const [u, v] = f(x, y), m = Math.hypot(u, v);
    if (!isFinite(m) || m < 1e-9) continue;
    const len = step * scale * Math.min(1.6, 0.5 + 0.5 * Math.log1p(m)) / m;
    const ax = x - (u * len) / 2, ay = y - (v * len) / 2, bx = x + (u * len) / 2, by = y + (v * len) / 2;
    const g = arrow(plot.X(ax), plot.Y(ay), plot.X(bx), plot.Y(by), { color, width: 2, head: 8 });
    if (faint) g.setAttribute('opacity', '0.45');
    els.push(g);
  }
  return els;
}
// trace a flow line from (x, y) with small RK2 steps
function flowLine(f, x, y, { T = 12, h = 0.02, xmin = -6, xmax = 6, ymin = -5, ymax = 5 } = {}) {
  const pts = [[x, y]];
  for (let t = 0; t < T; t += h) {
    const [u1, v1] = f(x, y), xm = x + (h / 2) * u1, ym = y + (h / 2) * v1, [u2, v2] = f(xm, ym);
    x += h * u2; y += h * v2;
    pts.push([x, y]);
    if (x < xmin || x > xmax || y < ymin || y > ymax || !isFinite(x)) break;
  }
  return pts;
}
const pathD = (plot, pts) => 'M' + pts.map(([x, y]) => `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('L');

// a stream: uniform flow past a cylinder of radius 1 (centred at the origin)
const CYL = (x, y) => { const r2 = x * x + y * y; if (r2 < 1) return [0, 0]; const a = 1 / (r2 * r2); return [1 - a * (x * x - y * y), -a * 2 * x * y]; };

// work along y = b(1 − x²/4) from (−2, 0) to (2, 0) in the whirl F = (−y, x)
const workParabola = (b) => (-16 * b) / 3;

// potential for the conservative-field lesson
const PHI = (x, y) => x * x - y * y;

// a probe box for divergence: net outward flux through a small square of half-width h, centred at (x, y)
function boxFlux(f, x, y, h = 0.5, n = 20) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    const t = -h + ((i + 0.5) * 2 * h) / n, ds = (2 * h) / n;
    total += f(x + h, y + t)[0] * ds - f(x - h, y + t)[0] * ds + f(x + t, y + h)[1] * ds - f(x + t, y - h)[1] * ds;
  }
  return total;
}
function probeBox({ plot, s, arrow }, f, x, y, h = 0.5) {
  const els = [s('rect', { x: plot.X(x - h), y: plot.Y(y + h), width: plot.X(x + h) - plot.X(x - h), height: plot.Y(y - h) - plot.Y(y + h), fill: 'var(--violet-soft)', 'fill-opacity': 0.6, stroke: 'var(--violet)', 'stroke-width': 2.5 })];
  for (const [nx, ny] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const px = x + nx * h, py = y + ny * h, [u, v] = f(px, py), out = u * nx + v * ny, L = Math.max(-0.6, Math.min(0.6, out * 0.35));
    if (Math.abs(L) < 0.02) continue;
    const a0 = L > 0 ? [px, py] : [px - nx * L, py - ny * L], a1 = L > 0 ? [px + nx * L, py + ny * L] : [px, py];
    els.push(arrow(plot.X(a0[0]), plot.Y(a0[1]), plot.X(a1[0]), plot.Y(a1[1]), { color: out > 0 ? 'var(--coral)' : 'var(--teal)', width: 3.5, head: 10 }));
  }
  return els;
}
// a paddle wheel spinning at half the curl
function paddle({ plot, s }, x, y, ang, R = 0.55) {
  const els = [s('circle', { cx: plot.X(x), cy: plot.Y(y), r: plot.X(R) - plot.X(0), fill: 'var(--card)', 'fill-opacity': 0.7, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' })];
  for (let k = 0; k < 4; k++) {
    const a = ang + (k * Math.PI) / 2;
    els.push(s('line', { x1: plot.X(x), y1: plot.Y(y), x2: plot.X(x + R * Math.cos(a)), y2: plot.Y(y + R * Math.sin(a)), stroke: k ? 'var(--ink)' : 'var(--coral)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  }
  els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5, class: 'fl-ink' }));
  return els;
}
// curl by finite differences
const curlAt = (f, x, y, h = 1e-4) => (f(x + h, y)[1] - f(x - h, y)[1]) / (2 * h) - (f(x, y + h)[0] - f(x, y - h)[0]) / (2 * h);
const divAt = (f, x, y, h = 1e-4) => (f(x + h, y)[0] - f(x - h, y)[0]) / (2 * h) + (f(x, y + h)[1] - f(x, y - h)[1]) / (2 * h);

const SWIRL = (x, y) => [0, x * x - 1];
const SPREAD = (x, y) => [x * x - 1, y];

export default {
  id: 'vectorcalc',
  subject: 'math',
  title: 'Vector Calculus',
  level: 'Advanced',
  cover: 'vectorcalc',
  tagline: 'Fields of arrows: flow lines, work, potentials, flux, divergence, curl and Maxwell’s equations.',
  description: r`Wind, water currents, gravity and electric forces are vector fields: an arrow at every point in space. Follow flow lines, add up work along paths, discover when a field has a potential, measure how much flows through a net, and probe fields with tiny boxes and paddle wheels to find sources and swirls. It all comes together in Green's theorem and Maxwell's equations of electromagnetism.`,
  prereq: 'Multivariable Calculus',
  chapters: [
    {
      title: 'Fields and Flows',
      summary: 'Arrows everywhere.',
      lessons: [
        {
          id: 'fields',
          title: 'Vector Fields',
          summary: 'An arrow at every point',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Arrows everywhere',
              body: r`A **vector field** assigns an arrow to every point: the wind velocity over a map, the current in a river, the force on a charge. In 2D it's a pair of functions, $\mathbf F(x, y) = (P(x, y), Q(x, y))$. Pick a field to see it drawn. (Arrow lengths are compressed so that big values don't swamp the picture.)`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.5, xmax: 4.5, ymin: -3.5, ymax: 3.5, grid: false, axes: { xticks: 1, yticks: 1 }, maxWidth: 520, clipExtra: true,
                params: { k: { min: 0, max: 5, step: 1, value: 1, label: '$\\mathbf F =$', color: 'violet', format: (v) => FIELDS[v].name } },
                extra: (ctx) => fieldArrows(ctx, FIELDS[ctx.p.k].f, { step: 0.75 }),
                readout: (p) => ['the same arrow everywhere: a **uniform** field', 'arrows point away from the origin: a **source**', 'arrows circle the origin: a **whirl**', 'flowing sideways, faster further up: a **shear**', 'in along y, out along x: a **saddle**', 'arrows point into the origin: a **sink**'][p.k],
              },
              after: r`Six basic patterns. Real fields mix them: weather maps show sources and sinks (high and low pressure) with whirls around them. The rest of this course is about measuring these features: how much a field pushes along a path, how much flows out of a region, and how much it swirls.`,
            },
            {
              type: 'numeric',
              title: 'Read an arrow',
              prompt: r`For $\mathbf F(x, y) = (xy,\ x - y)$, what is the $x$-component of the arrow at the point $(2, 3)$?`,
              answer: 6,
              wrong: [{ v: -1, why: 'That’s the y-component, x − y.' }, { v: 5, why: r`The $x$-component is $xy = 2 \times 3$.` }],
              explain: r`$\mathbf F(2, 3) = (2 \times 3,\ 2 - 3) = (6, -1)$: an arrow pointing mostly right and slightly down, with length $\sqrt{37} \approx 6.1$.`,
            },
            {
              type: 'mcq',
              title: 'Which way round?',
              prompt: r`Which field circles the origin **clockwise**?`,
              choices: [
                { t: r`$(y, -x)$`, ok: true },
                { t: r`$(-y, x)$`, why: r`At $(1, 0)$ this gives $(0, 1)$, pointing up: anticlockwise.` },
                { t: r`$(x, y)$`, why: 'That points straight out from the origin, not around it.' },
              ],
              explain: r`Test a point: at $(1, 0)$ (right of the origin), $(y, -x) = (0, -1)$ points down. Moving down on the right-hand side is clockwise. Checking one or two simple points is the quickest way to read a formula.`,
            },
            {
              type: 'interactive',
              title: 'Build a saddle',
              prompt: r`The field $\mathbf F = (ax, by)$ depends on two numbers. Choose $a$ and $b$ to make a **saddle** with arrows pointing **in** along the $x$-axis and **out** along the $y$-axis.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.5, xmax: 4.5, ymin: -3.5, ymax: 3.5, grid: false, axes: { xticks: 1, yticks: 1 }, maxWidth: 520, clipExtra: true,
                params: { a: { min: -1, max: 1, step: 0.5, value: 1, label: '$a$', color: 'blue', format: (v) => fix(v, 1) }, b: { min: -1, max: 1, step: 0.5, value: 1, label: '$b$', color: 'coral', format: (v) => fix(v, 1) } },
                extra: (ctx) => fieldArrows(ctx, (x, y) => [ctx.p.a * x, ctx.p.b * y], { step: 0.75 }),
                readout: (p) => r`$\mathbf F = (${fix(p.a, 1)}x,\ ${fix(p.b, 1)}y)$`,
                goal: (p) => p.a < 0 && p.b > 0,
                solution: { a: -1, b: 1 },
                hint: r`On the $x$-axis, $y = 0$, so the arrow is $(ax, 0)$. For it to point in towards the origin, $ax$ must have the opposite sign to $x$.`,
              },
              explain: r`With $a < 0$ and $b > 0$, e.g. $\mathbf F = (-x, y)$: on the $x$-axis the arrows point back towards the origin, and on the $y$-axis away from it. Fluid flowing like this is squeezed in one direction and stretched in the other, like batter between two meeting streams.`,
            },
            {
              type: 'mcq',
              title: 'Gravity as a field',
              prompt: r`Near Earth, the gravitational field (force per kilogram) points straight down with strength 9.8 N/kg. Far out in space, around the whole planet, what kind of field is it?`,
              choices: [
                { t: 'A sink: arrows point towards Earth’s centre, weakening with distance', ok: true },
                { t: 'A uniform field everywhere', why: 'It looks uniform only over a small area. Over the whole Earth, the arrows point to the centre from every side.' },
                { t: 'A whirl around Earth', why: 'Gravity pulls inwards; it doesn’t push things around in circles (orbits come from the moving object’s own speed).' },
              ],
              explain: r`Gravity points to the centre from every direction, with strength falling as $\frac{1}{r^2}$: a 3D **sink**. The "uniform" field near the ground is a close-up view of a tiny patch of it, just as a small patch of a sphere looks flat.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Where is it calm?',
              prompt: r`At which point $(x, y)$ is the field $\mathbf F = (x - 2,\ y + 1)$ zero? Give $x + y$.`,
              answer: 1,
              wrong: [{ v: 3, why: r`$y + 1 = 0$ means $y = -1$, not $+1$.` }, { v: -1, why: r`$x - 2 = 0$ gives $x = 2$, and $y = -1$: the sum is $2 + (-1)$.` }],
              explain: r`Both components vanish at $x = 2$, $y = -1$, so $x + y = 1$. This is the source field $(x, y)$ moved so that its centre sits at $(2, -1)$. Points where a field is zero (equilibria, or **critical points**) organise the whole picture around them.`,
            },
          ],
          recap: [
            'A vector field puts an arrow F(x, y) = (P, Q) at every point.',
            'Basic patterns: uniform, source, sink, whirl, shear, saddle.',
            'Test simple points to read a field’s formula.',
          ],
        },
        {
          id: 'flowlines',
          title: 'Flow Lines',
          summary: 'Following the arrows',
          icon: 'play',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A stream around a post',
              body: r`Water flows past a round post. A **flow line** (or streamline) is the path a tiny floating leaf would take: at every moment it moves along the local arrow. Drag the starting point on the left to release a leaf.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -3, ymax: 3, grid: false, axes: false, maxWidth: 580, clipExtra: true,
                params: { y0: { min: -2.8, max: 2.8, step: 0.1, value: 0.6, slider: false } },
                under: ({ plot, s }) => [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 })],
                extra: (ctx) => {
                  const lines = [-2.4, -1.6, -0.9, -0.35, 0.35, 0.9, 1.6, 2.4].map((y) => ctx.s('path', { d: pathD(ctx.plot, flowLine(CYL, -5, y, { T: 14, xmin: -5.5, xmax: 5.5 })), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.4, opacity: 0.6 }));
                  return [...lines, ...fieldArrows(ctx, CYL, { step: 0.8, faint: true, color: 'var(--blue)' }), ctx.s('path', { d: pathD(ctx.plot, flowLine(CYL, -4.8, ctx.p.y0, { T: 14, xmin: -5.5, xmax: 5.5 })), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3.5 })];
                },
                points: [{ x: () => -4.8, y: (p) => p.y0, drag: { y: 'y0' }, color: 'coral' }],
                readout: (p) => `leaf released at height ${fix(p.y0, 1)}`,
              },
              after: r`Leaves released near the middle swerve around the post; ones far away hardly notice it. The flow is fastest at the top and bottom of the post, where the lines bunch together. Flow lines never cross: at each point there's only one arrow to follow.`,
            },
            {
              type: 'numeric',
              title: 'Circular flow',
              prompt: r`In the whirl $\mathbf F = (-y, x)$, flow lines are circles around the origin. What is the radius of the flow line through $(3, 4)$?`,
              answer: 5,
              wrong: [{ v: 7, why: 'Distance from the origin uses Pythagoras: √(3² + 4²).' }, { v: 25, why: 'That’s the radius squared.' }],
              explain: r`The arrow $(-y, x)$ is always perpendicular to the position $(x, y)$ (their dot product is $-xy + yx = 0$), so motion never changes the distance from the origin. The flow line through $(3, 4)$ is the circle of radius $5$.`,
            },
            {
              type: 'interactive',
              title: 'Hit the target',
              prompt: r`In the flow $\mathbf F = (1, \sin x)$, release a leaf from the left edge so that it passes through the green target.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -3, ymax: 3, grid: 1, axes: false, maxWidth: 580, clipExtra: true,
                params: { y0: { min: -2.8, max: 2.8, step: 0.1, value: -1, slider: false } },
                extra: (ctx) => [...fieldArrows(ctx, (x) => [1, Math.sin(x)], { step: 0.8, faint: true }), ctx.s('circle', { cx: ctx.plot.X(3), cy: ctx.plot.Y(1.5), r: 14, class: 'fl-green', opacity: 0.35 }), ctx.s('path', { d: pathD(ctx.plot, flowLine((x) => [1, Math.sin(x)], -4.8, ctx.p.y0, { T: 11, xmin: -5.5, xmax: 5.5 })), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3.5 })],
                points: [{ x: () => -4.8, y: (p) => p.y0, drag: { y: 'y0' }, color: 'coral' }],
                readout: (p) => `the leaf crosses $x = 3$ at height ${fix(p.y0 + Math.cos(-4.8) - Math.cos(3), 2)}`,
                goal: (p) => Math.abs(p.y0 + Math.cos(-4.8) - Math.cos(3) - 1.5) < 0.12,
                solution: { y0: Math.round((1.5 - Math.cos(-4.8) + Math.cos(3)) * 10) / 10 },
                hint: r`Every leaf follows the same wavy shape, just shifted up or down: $y = y_0 + \cos(-4.8) - \cos x$.`,
              },
              explain: r`Here the flow lines satisfy $\frac{dy}{dx} = \frac{\sin x}{1}$, so $y = C - \cos x$: identical waves shifted up and down. Solving for a flow line is solving a differential equation, and choosing the start picks the constant $C$.`,
            },
            {
              type: 'mcq',
              title: 'Can they cross?',
              prompt: 'Can two different flow lines of a smooth vector field cross each other at a point where the field isn’t zero?',
              choices: [
                { t: 'No: a leaf at the crossing point would have to follow two different arrows at once', ok: true },
                { t: 'Yes, wherever the flow is fast', why: 'Speed doesn’t matter: at each point there’s exactly one arrow to follow.' },
                { t: 'Yes, at the edges of the flow', why: 'At any non-zero point the direction is uniquely fixed, edges included.' },
              ],
              explain: r`Through each point with a non-zero arrow passes exactly one flow line, a consequence of the uniqueness of solutions to differential equations. Flow lines can only meet at **zeros** of the field, like the centre of a source or the crossing point of a saddle.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Spreading out',
              prompt: r`In the source field $\mathbf F = (x, y)$, a leaf starts at $(1, 0)$. Its position obeys $\frac{dx}{dt} = x$. Where is it at time $t = 2$? Give $x$ to 2 decimal places.`,
              answer: Math.exp(2),
              tol: 0.01,
              wrong: [{ v: 3, why: r`The speed grows with distance: $\frac{dx}{dt} = x$ gives exponential growth, $x = e^t$.` }, { v: 2, why: r`$\frac{dx}{dt} = x$ with $x(0) = 1$ gives $x = e^t$.` }],
              explain: r`$\frac{dx}{dt} = x$ gives $x = e^t$, so at $t = 2$ the leaf is at $e^2 \approx 7.39$. In a source field, flow lines are straight rays, but leaves speed up exponentially as they move outwards.`,
            },
          ],
          recap: [
            'A flow line follows the arrows: dx/dt = P, dy/dt = Q.',
            'Flow lines never cross except at zeros of the field.',
            'Finding flow lines means solving differential equations.',
          ],
        },
      ],
    },
    {
      title: 'Along a Path',
      summary: 'Work and potentials.',
      lessons: [
        {
          id: 'work',
          title: 'Work Along a Path',
          summary: 'Line integrals',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Adding up pushes',
              body: r`Walking through a wind field, how much does the wind help you? Over a short step $d\mathbf r$, the wind's work is $\mathbf F \cdot d\mathbf r$: the push along your direction times the distance. Adding up all the steps of a path $C$ gives the **line integral**
$$W = \int_C \mathbf F \cdot d\mathbf r = \int_C (P\,dx + Q\,dy)$$
Tailwind counts positive, headwind negative, and crosswind (perpendicular) counts nothing.`,
            },
            {
              type: 'numeric',
              title: 'A constant force',
              prompt: r`A constant force $\mathbf F = (3, 4)$ N pushes an object along a straight displacement of $(2, 1)$ m. How much work does it do?`,
              unit: 'J',
              answer: 10,
              wrong: [{ v: 11.18, tol: 0.05, why: 'That multiplies the lengths. Work uses the dot product, which counts only the part of the force along the motion.' }, { v: 7, why: r`Multiply matching components: $3 \times 2 + 4 \times 1$.` }],
              explain: r`$\mathbf F \cdot \Delta\mathbf r = 3 \times 2 + 4 \times 1 = 10$ J. For a constant force and a straight path, the line integral is just one dot product.`,
            },
            {
              type: 'interactive',
              title: 'The path matters',
              prompt: r`In the whirl $\mathbf F = (-y, x)$, travel from $A = (-2, 0)$ to $B = (2, 0)$ along the parabola $y = b\left(1 - \frac{x^2}{4}\right)$. Choose the path so that the field does **8** units of work on you.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.5, xmax: 3.5, ymin: -2.6, ymax: 2.6, grid: 1, axes: false, maxWidth: 520, clipExtra: true,
                params: { b: { min: -2, max: 2, step: 0.25, value: 1, label: '$b$', color: 'coral', format: (v) => fix(v, 2) } },
                extra: (ctx) => {
                  const pts = Array.from({ length: 81 }, (_, i) => { const x = -2 + i / 20; return [x, ctx.p.b * (1 - (x * x) / 4)]; });
                  const els = fieldArrows(ctx, (x, y) => [-y, x], { step: 0.7, faint: true });
                  els.push(ctx.s('path', { d: pathD(ctx.plot, pts), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 }));
                  for (const [x, lab] of [[-2, 'A'], [2, 'B']]) els.push(ctx.s('circle', { cx: ctx.plot.X(x), cy: ctx.plot.Y(0), r: 7, class: 'fl-ink' }), ctx.s('text', { x: ctx.plot.X(x), y: ctx.plot.Y(0) + 26, 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(16), text: lab }));
                  return els;
                },
                readout: (p) => `work done by the field: **${fix(workParabola(p.b), 2)}**`,
                goal: (p) => Math.abs(workParabola(p.b) - 8) < 1e-9,
                solution: { b: -1.5 },
                hint: 'Going over the top runs against the anticlockwise whirl; going underneath runs with it.',
              },
              explain: r`Along this family $W = -\frac{16}{3}b$, so $b = -1.5$: the path dips below the axis, where the anticlockwise whirl pushes you to the right. The straight path ($b = 0$) gets no work at all. Same start, same finish, different work: in this field, the path matters.`,
            },
            {
              type: 'numeric',
              title: 'Once around',
              prompt: r`Walk once anticlockwise around the circle of radius 3 centred at the origin in the whirl $\mathbf F = (-y, x)$. On the circle, $\mathbf F$ points along your direction with magnitude 3. How much work does the field do?`,
              answer: 18 * Math.PI,
              tol: 0.05,
              wrong: [{ v: 0, why: 'You end where you started, but the field pushed you forwards the whole way round.' }, { v: 6 * Math.PI, tol: 0.05, why: 'That’s the circumference. Multiply by the force along the path, 3.' }],
              explain: r`Force along the path 3, distance $2\pi \times 3 = 6\pi$: work $= 18\pi \approx 56.5$. A closed loop with non-zero work means energy can be gained by going round and round, like a water wheel in a whirlpool. Fields like this can't come from a potential energy.`,
            },
            {
              type: 'mcq',
              title: 'Crossing the wind',
              prompt: 'You walk due north while a steady wind blows due east. How much work does the wind do on you along your path?',
              choices: [
                { t: 'None: the force is perpendicular to the motion', ok: true },
                { t: 'Positive, since the wind is pushing you', why: 'It pushes sideways, so the dot product with your northward steps is zero.' },
                { t: 'Negative, since it pushes you off course', why: 'Work measures the push along the motion. Sideways forces do zero work.' },
              ],
              explain: r`$\mathbf F \cdot d\mathbf r = 0$ for perpendicular directions. (The wind does change your path if you let it, but along the path you actually take, northwards, it does no work.) Magnetic forces are always perpendicular to motion, which is why they never change a charged particle's speed.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'An integral by hand',
              prompt: r`Compute $\int_C \mathbf F \cdot d\mathbf r$ for $\mathbf F = (y, x)$ along the straight segment from $(0, 0)$ to $(2, 2)$. (On it, $x = y = t$ for $t$ from 0 to 2.)`,
              answer: 4,
              wrong: [{ v: 2, why: r`$P\,dx + Q\,dy = t\,dt + t\,dt = 2t\,dt$, which integrates to $t^2$.` }, { v: 8, why: r`$\int_0^2 2t\,dt = [t^2]_0^2 = 4$.` }],
              explain: r`With $x = y = t$: $P\,dx + Q\,dy = t\,dt + t\,dt$, and $\int_0^2 2t\,dt = 4$. This field is special: $(y, x) = \nabla(xy)$, so the answer is just $xy$ at the end minus at the start: $4 - 0$. That's the next lesson.`,
            },
          ],
          recap: [
            'Work along a path: W = ∫ F · dr = ∫ (P dx + Q dy).',
            'Only the part of F along the path counts.',
            'In some fields, like whirls, the work depends on the path.',
          ],
        },
        {
          id: 'potential',
          title: 'Potentials',
          summary: 'When the path doesn’t matter',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Downhill fields',
              body: r`Some fields are the **gradient** of a function: $\mathbf F = \nabla\phi = \left(\frac{\partial\phi}{\partial x}, \frac{\partial\phi}{\partial y}\right)$. Then $\phi$ is a **potential**, and the work along any path is just the change in $\phi$:
$$\int_C \nabla\phi \cdot d\mathbf r = \phi(B) - \phi(A)$$
the **fundamental theorem for line integrals**. The path doesn't matter, and the work around any closed loop is zero. Such fields are called **conservative**: gravity and electrostatic forces are examples, and $-\phi$ is their potential energy.`,
            },
            {
              type: 'numeric',
              title: 'Work from a potential',
              prompt: r`For $\mathbf F = \nabla\phi$ with $\phi(x, y) = x^2 + y$, how much work does $\mathbf F$ do from $(0, 0)$ to $(2, 3)$, by any path?`,
              answer: 7,
              wrong: [{ v: 5, why: r`$\phi(2, 3) = 2^2 + 3$, not $2 + 3$.` }, { v: 13, why: r`$\phi = x^2 + y$, so $\phi(2, 3) = 4 + 3$; the $y$ isn't squared.` }],
              explain: r`$\phi(2, 3) - \phi(0, 0) = (4 + 3) - 0 = 7$. No integral needed, whatever the route.`,
            },
            {
              type: 'interactive',
              title: 'Climb by 3',
              prompt: r`The field $\mathbf F = \nabla\phi$ with $\phi = x^2 - y^2$ is drawn with contour lines of $\phi$. Drag $B$ so that the field does exactly **3** units of work from $A = (1, 1)$ to $B$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.5, xmax: 3.5, ymin: -2.6, ymax: 2.6, grid: false, axes: { xticks: 1, yticks: 1 }, maxWidth: 520, clipExtra: true,
                params: { bx: { min: -3, max: 3, step: 1, value: -1, slider: false }, by: { min: -2, max: 2, step: 1, value: 2, slider: false } },
                under: ({ plot, s }) => {
                  const els = [];
                  for (const c of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
                    // x² − y² = c, drawn as branches
                    if (c >= 0) for (const sg of [1, -1]) els.push(s('path', { d: pathD(plot, Array.from({ length: 81 }, (_, i) => { const y = -2.6 + (5.2 * i) / 80; return [sg * Math.sqrt(c + y * y), y]; })), fill: 'none', stroke: c === 3 ? 'var(--teal)' : 'var(--ink-3)', 'stroke-width': c === 3 ? 2.5 : 1, opacity: c === 3 ? 1 : 0.5 }));
                    else for (const sg of [1, -1]) els.push(s('path', { d: pathD(plot, Array.from({ length: 81 }, (_, i) => { const x = -3.5 + (7 * i) / 80; return [x, sg * Math.sqrt(-c + x * x)]; })), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1, opacity: 0.5 }));
                  }
                  return els;
                },
                extra: (ctx) => [...fieldArrows(ctx, (x, y) => [2 * x, -2 * y], { step: 0.7, faint: true, color: 'var(--violet)' }), ctx.s('path', { d: pathD(ctx.plot, [[1, 1], [ctx.p.bx, ctx.p.by]]), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' })],
                points: [{ x: () => 1, y: () => 1, color: 'ink', r: 6, label: 'A' }, { x: (p) => p.bx, y: (p) => p.by, drag: { x: 'bx', y: 'by' }, color: 'coral', label: 'B' }],
                readout: (p) => r`$\phi(B) - \phi(A) = ${PHI(p.bx, p.by)} - 0 = ${PHI(p.bx, p.by)}$`,
                goal: (p) => PHI(p.bx, p.by) === 3,
                solution: { bx: 2, by: 1 },
                hint: r`$\phi(A) = 1 - 1 = 0$. You need a grid point where $x^2 - y^2 = 3$: it's on the teal contour.`,
              },
              explain: r`$B = (2, 1)$ or $(\pm 2, \pm 1)$: $x^2 - y^2 = 4 - 1 = 3$. Every point on the teal contour $\phi = 3$ works, and the arrows always cross the contours at right angles: the gradient points straight uphill.`,
            },
            {
              type: 'mcq',
              title: 'A quick test',
              prompt: r`A 2D field $(P, Q)$ with a potential must satisfy $\frac{\partial Q}{\partial x} = \frac{\partial P}{\partial y}$ (both equal $\frac{\partial^2\phi}{\partial x\partial y}$). Which field **cannot** have a potential?`,
              choices: [
                { t: r`$(-y, x)$`, ok: true },
                { t: r`$(y, x)$`, why: r`$\frac{\partial Q}{\partial x} = 1 = \frac{\partial P}{\partial y}$ ✓. Its potential is $xy$.` },
                { t: r`$(2x, 2y)$`, why: r`Both cross-derivatives are 0 ✓. Its potential is $x^2 + y^2$.` },
              ],
              explain: r`For $(-y, x)$: $\frac{\partial Q}{\partial x} = 1$ but $\frac{\partial P}{\partial y} = -1$. The test fails, matching what we found: work around a loop isn't zero. The difference $\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}$ measures the swirl, and gets its own name later: the **curl**.`,
            },
            {
              type: 'numeric',
              title: 'Find the potential',
              prompt: r`$\mathbf F = (2xy,\ x^2 + 1)$ has a potential $\phi$ with $\phi(0, 0) = 0$. What is $\phi(2, 3)$? (Find $\phi$ by asking which function has these partial derivatives.)`,
              answer: 15,
              wrong: [{ v: 12, why: r`$\phi = x^2y + y$: don't forget the $y$ term, whose $y$-derivative supplies the $+1$.` }, { v: 13, why: r`$\phi = x^2 y + y$, so $\phi(2, 3) = 4 \times 3 + 3$.` }],
              explain: r`$\frac{\partial\phi}{\partial x} = 2xy$ suggests $\phi = x^2y + g(y)$; then $\frac{\partial\phi}{\partial y} = x^2 + g'(y) = x^2 + 1$, so $g = y$. So $\phi = x^2y + y$ and $\phi(2, 3) = 12 + 3 = 15$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Free energy?',
              prompt: 'An inventor claims a machine that moves a weight around a closed loop in Earth’s gravity and gains energy every lap. Why is that impossible?',
              choices: [
                { t: 'Gravity is conservative: the work around any closed loop is zero', ok: true },
                { t: 'Machines always waste some energy as heat', why: 'True, but even a perfect frictionless machine couldn’t gain energy from gravity around a loop.' },
                { t: 'The weight would fall off the loop', why: 'The problem is fundamental, not practical: the total work around a loop is zero.' },
              ],
              explain: r`Gravity has a potential, so $\oint \mathbf F \cdot d\mathbf r = \phi(\text{end}) - \phi(\text{start}) = 0$ when the end is the start. Many perpetual-motion designs hide a closed loop in a conservative field. To gain energy around a loop you need a non-conservative field, like the changing magnetic fields in a generator.`,
            },
          ],
          recap: [
            'F = ∇φ: work = φ(B) − φ(A), whatever the path.',
            'Conservative fields do zero work around closed loops.',
            'Test in 2D: ∂Q/∂x = ∂P/∂y.',
          ],
        },
      ],
    },
    {
      title: 'Sources and Swirls',
      summary: 'Flux, divergence and curl.',
      lessons: [
        {
          id: 'flux',
          title: 'Flux',
          summary: 'How much flows through',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Catching the flow',
              body: r`Hold a net in a stream. How much water passes through it per second? Only the flow **across** the net counts; flow sliding along it doesn't go through. For a straight net of length $L$ with unit normal $\mathbf n$ (perpendicular to it) in a uniform flow $\mathbf F$:
$$\text{flux} = (\mathbf F \cdot \mathbf n)\,L$$
For a curved net, add up $\mathbf F \cdot \mathbf n\,ds$ along it. In 3D, flux through a surface is the same idea, with area instead of length.`,
            },
            {
              type: 'interactive',
              title: 'Angle the net',
              prompt: r`In a uniform flow $\mathbf F = (2, 1)$, turn a net of length 2 to catch the **most** flux.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.5, xmax: 3.5, ymin: -2.6, ymax: 2.6, grid: false, axes: false, maxWidth: 500, clipExtra: true,
                params: { a: { min: 0, max: 175, step: 5, value: 20, label: 'net angle', color: 'violet', format: (v) => `${v}°` } },
                extra: (ctx) => {
                  const t = (ctx.p.a * Math.PI) / 180, c = Math.cos(t), sn = Math.sin(t);
                  return [...fieldArrows(ctx, () => [2, 1], { step: 0.8, faint: true }), ctx.s('line', { x1: ctx.plot.X(-c), y1: ctx.plot.Y(-sn), x2: ctx.plot.X(c), y2: ctx.plot.Y(sn), stroke: 'var(--violet)', 'stroke-width': 6, 'stroke-linecap': 'round' }), ctx.arrow(ctx.plot.X(0), ctx.plot.Y(0), ctx.plot.X(-0.9 * sn), ctx.plot.Y(0.9 * c), { color: 'var(--coral)', width: 3, head: 10 })];
                },
                readout: (p) => { const t = (p.a * Math.PI) / 180; return `flux through the net: $(\\mathbf F \\cdot \\mathbf n) \\times 2 =$ **${fix(Math.abs(2 * -Math.sin(t) + 1 * Math.cos(t)) * 2, 2)}**`; },
                goal: (p) => Math.abs(Math.abs(-2 * Math.sin((p.a * Math.PI) / 180) + Math.cos((p.a * Math.PI) / 180)) * 2 - 2 * Math.sqrt(5)) < 0.03,
                solution: { a: 115 },
                hint: 'The flux is greatest when the net faces the flow head-on: its normal (coral) parallel to the flow.',
              },
              explain: r`The best angle puts the net perpendicular to the flow (its normal along $(2, 1)$), catching $|\mathbf F| \times L = \sqrt5 \times 2 \approx 4.47$. Turned edge-on (parallel to the flow), it catches nothing. Solar panels, sails and wind turbines are all aimed by this cosine rule.`,
            },
            {
              type: 'numeric',
              title: 'A source through a circle',
              prompt: r`The source field $\mathbf F = (x, y)$ points straight out of the origin. On the circle of radius 2, it is perpendicular to the circle with magnitude 2. What is the total flux out through the circle?`,
              answer: 8 * Math.PI,
              tol: 0.05,
              wrong: [{ v: 4 * Math.PI, tol: 0.05, why: 'That’s the circumference. Multiply by the outward flow, 2.' }, { v: 4, why: r`Flux = (outward component) × (length) $= 2 \times 4\pi$.` }],
              explain: r`Flux $= 2 \times (2\pi \times 2) = 8\pi \approx 25.1$. For radius $R$ it's $R \times 2\pi R = 2\pi R^2$: bigger circles catch more, because this field keeps producing more flow everywhere inside (it has a source spread across the whole plane).`,
            },
            {
              type: 'numeric',
              title: 'A point source',
              prompt: r`Now take a field that weakens with distance: $\mathbf F = \frac{(x, y)}{x^2 + y^2}$, pointing outwards with magnitude $\frac1r$. What is the flux out through the circle of radius 5?`,
              answer: TAU,
              tol: 0.02,
              wrong: [{ v: 2 * Math.PI * 25, tol: 0.5, why: r`The magnitude on the circle is $\frac15$, not 5.` }, { v: 0.2, tol: 0.01, why: r`Multiply the outward flow $\frac15$ by the circumference $10\pi$.` }],
              explain: r`$\frac15 \times 2\pi \times 5 = 2\pi$, the same for **every** radius: weaker flow over a longer circle, exactly balancing. All the flow comes from a single point source at the origin. In 3D the field must weaken as $\frac{1}{r^2}$ for the same balance over spheres, which is exactly how gravity and electric fields from point sources behave.`,
            },
            {
              type: 'mcq',
              title: 'Flux through a closed curve',
              prompt: 'Water flows steadily and nothing is added or removed anywhere inside a region. What is the total flux out through the region’s boundary?',
              choices: [
                { t: 'Zero: whatever flows in must flow out', ok: true },
                { t: 'Positive', why: 'Positive net outflow would need a source inside, creating water.' },
                { t: 'It depends on the shape of the boundary', why: 'With no sources or sinks inside, the net flow out is zero for any shape.' },
              ],
              explain: r`Water can't pile up or vanish, so the net flux through a closed boundary measures what's **created** inside. That idea, made precise for tiny regions, is the divergence in the next lesson.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A square net',
              prompt: r`In the uniform flow $\mathbf F = (3, 0)$, what is the total flux **out** of the square with corners $(0, 0)$ and $(2, 2)$? (Add the flux out of all four sides; inflow counts as negative.)`,
              answer: 0,
              wrong: [{ v: 6, why: r`The right side lets out $3 \times 2 = 6$, but the left side lets in 6.` }, { v: 12, why: 'Inflow through the left side counts negative.' }],
              explain: r`Right side: $+3 \times 2 = 6$. Left side: $-6$ (flowing in). Top and bottom: 0 (parallel). Total: 0. A uniform field has no sources: everything that enters leaves.`,
            },
          ],
          recap: [
            'Flux = flow across a curve: ∫ F · n ds.',
            'Only the component perpendicular to the net counts.',
            'Net flux out of a closed curve measures what’s produced inside.',
          ],
        },
        {
          id: 'divergence',
          title: 'Divergence',
          summary: 'Sources and sinks',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A tiny box',
              body: r`Drag the small box around the field $\mathbf F = (x^2 - 1,\ y)$. {coral:Coral arrows} show flow out of each side, {teal:teal arrows} flow in. The readout gives the net outflow divided by the box's area.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.4, ymax: 2.4, grid: false, axes: { xticks: 1, yticks: 1 }, maxWidth: 520, clipExtra: true,
                params: { px: { min: -2.5, max: 2.5, step: 0.1, value: 1.5, slider: false }, py: { min: -1.9, max: 1.9, step: 0.1, value: 0.5, slider: false } },
                extra: (ctx) => [...fieldArrows(ctx, SPREAD, { step: 0.6, faint: true }), ...probeBox(ctx, SPREAD, ctx.p.px, ctx.p.py, 0.4)],
                points: [{ x: (p) => p.px, y: (p) => p.py, drag: { x: 'px', y: 'py' }, color: 'violet' }],
                readout: (p) => `net outflow ÷ area: **${fix(boxFlux(SPREAD, p.px, p.py, 0.4) / 0.64, 2)}** · formula $2x + 1$ gives ${fix(2 * p.px + 1, 2)}`,
              },
              after: r`Shrink the box to a point and this ratio becomes the **divergence**:
$$\nabla \cdot \mathbf F = \frac{\partial P}{\partial x} + \frac{\partial Q}{\partial y}$$
Here $\nabla\cdot\mathbf F = 2x + 1$: positive (a source) to the right of $x = -\frac12$, negative (a sink) to the left. The $\frac{\partial P}{\partial x}$ term measures flow stretching out horizontally; $\frac{\partial Q}{\partial y}$ vertically.`,
            },
            {
              type: 'numeric',
              title: 'Compute a divergence',
              prompt: r`What is the divergence of $\mathbf F = (x^2,\ xy)$ at the point $(1, 2)$?`,
              answer: 3,
              wrong: [{ v: 4, why: r`$\frac{\partial}{\partial y}(xy) = x$, not $y$.` }, { v: 2, why: r`Add both terms: $\frac{\partial}{\partial x}(x^2) = 2x$ and $\frac{\partial}{\partial y}(xy) = x$.` }],
              explain: r`$\nabla\cdot\mathbf F = 2x + x = 3x$, which is $3$ at $(1, 2)$: a source of strength 3 per unit area there.`,
            },
            {
              type: 'interactive',
              title: 'Neither source nor sink',
              prompt: r`In the same field $\mathbf F = (x^2 - 1,\ y)$, drag the box to a place where the net outflow is **zero**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.4, ymax: 2.4, grid: false, axes: { xticks: 1, yticks: 1 }, maxWidth: 520, clipExtra: true,
                params: { px: { min: -2.5, max: 2.5, step: 0.1, value: 1.5, slider: false }, py: { min: -1.9, max: 1.9, step: 0.1, value: -1, slider: false } },
                extra: (ctx) => [...fieldArrows(ctx, SPREAD, { step: 0.6, faint: true }), ...probeBox(ctx, SPREAD, ctx.p.px, ctx.p.py, 0.4)],
                points: [{ x: (p) => p.px, y: (p) => p.py, drag: { x: 'px', y: 'py' }, color: 'violet' }],
                readout: (p) => `net outflow ÷ area: **${fix(boxFlux(SPREAD, p.px, p.py, 0.4) / 0.64, 2)}**`,
                goal: (p) => Math.abs(2 * p.px + 1) < 0.05,
                solution: { px: -0.5, py: 0 },
                hint: 'The divergence 2x + 1 doesn’t depend on y. Find the x where it’s zero.',
              },
              explain: r`Anywhere on the line $x = -\frac12$: there the horizontal flow squeezes in exactly as fast as the vertical flow spreads out. Notice the arrows themselves are not zero there; zero divergence means balance, not stillness.`,
            },
            {
              type: 'mcq',
              title: 'Water in a pipe',
              prompt: 'Water (practically incompressible) flows steadily through a pipe that narrows. What is the divergence of its velocity field?',
              choices: [
                { t: 'Zero everywhere', ok: true },
                { t: 'Positive where the pipe narrows, because the water speeds up', why: 'Speeding up along the flow is balanced by the flow squeezing in from the sides. No water is created.' },
                { t: 'Negative where the pipe narrows', why: 'The water isn’t being destroyed or compressed; the flow just rearranges.' },
              ],
              explain: r`Incompressible flow has $\nabla\cdot\mathbf v = 0$: what flows into any small region flows out. The water speeds up in the narrow part because the same volume per second must pass through a smaller cross-section, the continuity equation in the Fluids course.`,
            },
            {
              type: 'numeric',
              title: 'An outflowing square',
              prompt: r`The field $\mathbf F = (3x,\ 2y)$ has divergence $3 + 2 = 5$ everywhere. Using "net outflow = divergence × area", what is the total flux out of the square $0 \le x \le 2$, $0 \le y \le 2$?`,
              answer: 20,
              wrong: [{ v: 5, why: 'Multiply the divergence by the area of the square, 4.' }, { v: 10, why: r`The area is $2 \times 2 = 4$, so the flux is $5 \times 4$.` }],
              explain: r`$5 \times 4 = 20$. Check by the sides: the right side ($x = 2$) lets out $6 \times 2 = 12$, the top ($y = 2$) lets out $4 \times 2 = 8$, and the left and bottom edges have zero normal flow. Total $20$ ✓.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Electric charges',
              prompt: r`Gauss's law for electricity says $\nabla\cdot\mathbf E = \frac{\rho}{\varepsilon_0}$, where $\rho$ is the charge density. What does that mean?`,
              choices: [
                { t: 'Electric field lines start on positive charges and end on negative charges', ok: true },
                { t: 'Electric fields swirl around charges', why: 'Divergence measures spreading out, not swirling. Swirling is curl.' },
                { t: 'Electric fields are zero wherever there’s no charge', why: 'Zero divergence means no field lines begin or end there; the field itself can be strong.' },
              ],
              explain: r`Positive charge is a source of electric field, negative charge a sink. In empty space the divergence is zero: field lines pass through without starting or stopping. Integrating over a region gives "flux out = charge inside $\div\ \varepsilon_0$", the form of Gauss's law used to find fields of charged spheres and wires.`,
            },
          ],
          recap: [
            'Divergence ∇ · F = ∂P/∂x + ∂Q/∂y: outflow per unit area.',
            'Positive divergence: a source; negative: a sink.',
            'Incompressible flow has zero divergence.',
          ],
        },
        {
          id: 'curl',
          title: 'Curl',
          summary: 'How much it swirls',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A paddle wheel',
              body: r`Drop a tiny paddle wheel into a flow. If the flow pushes harder on one side than the other, it spins. Pick a field, drag the wheel around and press Play.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.4, ymax: 2.4, grid: false, axes: { xticks: 1, yticks: 1 }, maxWidth: 520, clipExtra: true,
                params: {
                  k: { min: 2, max: 3, step: 1, value: 3, label: 'field', color: 'violet', format: (v) => FIELDS[v].name },
                  px: { min: -2.4, max: 2.4, step: 0.1, value: 1, slider: false }, py: { min: -1.8, max: 1.8, step: 0.1, value: 1, slider: false },
                  t: { min: 0, max: 1000, step: 0.01, value: 0, slider: false },
                },
                animate: { param: 't', speed: 1, max: 1000, loop: true },
                extra: (ctx) => { const f = FIELDS[ctx.p.k].f; return [...fieldArrows(ctx, f, { step: 0.6, faint: true }), ...paddle(ctx, ctx.p.px, ctx.p.py, (curlAt(f, ctx.p.px, ctx.p.py) / 2) * ctx.p.t)]; },
                points: [{ x: (p) => p.px, y: (p) => p.py, drag: { x: 'px', y: 'py' }, color: 'coral', r: 6 }],
                readout: (p) => { const c = curlAt(FIELDS[p.k].f, p.px, p.py); return `curl here: **${fix(c, 2)}** · the wheel spins ${Math.abs(c) < 1e-6 ? 'not at all' : c > 0 ? 'anticlockwise' : 'clockwise'}`; },
              },
              after: r`In the whirl $(-y, x)$ the wheel spins anticlockwise everywhere, at the same rate. Surprisingly, in the shear flow $(y, 0)$, where every arrow points straight sideways, the wheel spins **clockwise**: the flow above it is faster than below. The spin rate (times 2) is the **curl**:
$$\text{curl}\,\mathbf F = \frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}$$`,
            },
            {
              type: 'numeric',
              title: 'Curl of a whirl',
              prompt: r`What is the curl of $\mathbf F = (-y, x)$?`,
              answer: 2,
              wrong: [{ v: 0, why: r`$\frac{\partial Q}{\partial x} = \frac{\partial x}{\partial x} = 1$ and $\frac{\partial P}{\partial y} = \frac{\partial(-y)}{\partial y} = -1$: subtract.` }, { v: 1, why: r`$1 - (-1) = 2$.` }],
              explain: r`$\frac{\partial}{\partial x}(x) - \frac{\partial}{\partial y}(-y) = 1 + 1 = 2$. The field is a rigid rotation with angular speed 1, and the curl is **twice** the angular speed: that's why the paddle wheel turns at half the curl.`,
            },
            {
              type: 'interactive',
              title: 'Find the calm spot',
              prompt: r`In the field $\mathbf F = (0,\ x^2 - 1)$, drag the paddle wheel to a place where it **doesn't spin**, though the water is moving there.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.4, ymax: 2.4, grid: false, axes: { xticks: 1, yticks: 1 }, maxWidth: 520, clipExtra: true,
                params: {
                  px: { min: -2.4, max: 2.4, step: 0.1, value: 1.5, slider: false }, py: { min: -1.8, max: 1.8, step: 0.1, value: 0.5, slider: false },
                  t: { min: 0, max: 1000, step: 0.01, value: 0, slider: false },
                },
                animate: { param: 't', speed: 1, max: 1000, loop: true, autoplay: true },
                extra: (ctx) => [...fieldArrows(ctx, SWIRL, { step: 0.6, faint: true }), ...paddle(ctx, ctx.p.px, ctx.p.py, (curlAt(SWIRL, ctx.p.px, ctx.p.py) / 2) * ctx.p.t)],
                points: [{ x: (p) => p.px, y: (p) => p.py, drag: { x: 'px', y: 'py' }, color: 'coral', r: 6 }],
                readout: (p) => `curl here: **${fix(2 * p.px, 2)}** · water speed ${fix(Math.abs(p.px * p.px - 1), 2)}`,
                goal: (p) => Math.abs(p.px) < 0.05 ? true : { ok: false, msg: 'The wheel still spins here.' },
                solution: { px: 0, py: 0.5 },
                hint: r`The curl is $\frac{\partial}{\partial x}(x^2 - 1) = 2x$.`,
              },
              explain: r`On the line $x = 0$ the curl $2x$ is zero: the flow there (speed 1, pointing down) is at its fastest-downward point, the same just left and right, so the paddles are pushed equally. Flow and spin are different things: straight flows can spin wheels, and moving flows can leave them still.`,
            },
            {
              type: 'mcq',
              title: 'A whirlpool without spin',
              prompt: r`The field $\mathbf F = \frac{(-y, x)}{x^2 + y^2}$ circles the origin, getting faster closer in. Its curl is **zero** everywhere except at the origin. What does a small paddle wheel do as it’s carried around?`,
              choices: [
                { t: 'It travels around the centre but doesn’t spin about its own axis', ok: true },
                { t: 'It spins anticlockwise, like the flow', why: 'The flow outside is slower than inside by just enough to cancel: the curl is zero away from the centre.' },
                { t: 'It spins clockwise', why: 'Zero curl means no spin, in either direction.' },
              ],
              explain: r`This is an idealised **vortex** (like water draining from a bath): everything circles, but a floating matchstick keeps pointing the same way as it goes round. All the curl is concentrated at the centre. Circulating around a loop and spinning at a point are different measurements.`,
            },
            {
              type: 'numeric',
              title: 'Curl of a shear',
              prompt: r`What is the curl of the shear flow $\mathbf F = (3y, 0)$?`,
              answer: -3,
              wrong: [{ v: 3, why: r`The curl is $\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y} = 0 - 3$.` }, { v: 0, why: 'The arrows all point the same way, but they’re faster higher up, which turns the wheel.' }],
              explain: r`$0 - \frac{\partial}{\partial y}(3y) = -3$: clockwise spin. Rivers are faster in the middle than at the banks, so floating logs near a bank rotate as they drift.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Curl and potentials',
              prompt: 'What is the curl of any gradient field ∇φ (with φ smooth)?',
              choices: [
                { t: 'Zero', ok: true },
                { t: 'The Laplacian of φ', why: 'That’s the divergence of ∇φ. The curl is the difference of the mixed partials.' },
                { t: 'It depends on φ', why: 'For any smooth φ, the mixed partial derivatives are equal, so the curl vanishes.' },
              ],
              explain: r`$\text{curl}\,\nabla\phi = \frac{\partial^2\phi}{\partial x\,\partial y} - \frac{\partial^2\phi}{\partial y\,\partial x} = 0$. That's the cross-derivative test from the potentials lesson in new clothes: conservative fields don't swirl. (On a region without holes, the converse holds too.)`,
            },
          ],
          recap: [
            'Curl = ∂Q/∂x − ∂P/∂y: twice the local spin rate.',
            'Straight shear flows can have curl; circling vortices can have none.',
            'Gradient fields have zero curl.',
          ],
        },
        {
          id: 'theorems',
          title: 'Green’s Theorem & Maxwell',
          summary: 'Inside and around',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Adding up tiny spins',
              body: r`Chop a region $R$ into tiny squares. The circulation around each square is its curl times its area. Add them all up: along every shared inner edge, neighbouring squares go round in opposite directions and cancel, leaving only the outer boundary. That's **Green's theorem**:
$$\oint_{\partial R} \mathbf F \cdot d\mathbf r = \iint_R \left(\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}\right) dA$$
Circulation around the edge equals the total curl inside. The same cancelling trick with flux gives the **divergence theorem**: flux out of the edge equals the total divergence inside.`,
            },
            {
              type: 'interactive',
              title: 'Circulation from area',
              prompt: r`In the whirl $\mathbf F = (-y, x)$ (curl 2 everywhere), size the rectangle so that the circulation around its edge is **24**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3, ymax: 3, grid: 1, axes: false, maxWidth: 520, clipExtra: true,
                params: { w: { min: 1, max: 6, step: 1, value: 2, label: 'width', color: 'blue' }, h: { min: 1, max: 5, step: 1, value: 2, label: 'height', color: 'coral' } },
                under: ({ plot, p, s }) => [s('rect', { x: plot.X(-p.w / 2), y: plot.Y(p.h / 2), width: plot.X(p.w / 2) - plot.X(-p.w / 2), height: plot.Y(-p.h / 2) - plot.Y(p.h / 2), fill: 'var(--violet-soft)', 'fill-opacity': 0.55, stroke: 'var(--violet)', 'stroke-width': 3 })],
                extra: (ctx) => fieldArrows(ctx, (x, y) => [-y, x], { step: 0.8, faint: true }),
                readout: (p) => `circulation = curl × area = 2 × ${p.w * p.h} = **${2 * p.w * p.h}**`,
                goal: (p) => 2 * p.w * p.h === 24,
                solution: { w: 4, h: 3 },
                hint: 'You need an area of 12.',
              },
              explain: r`Any rectangle of area 12 ($4 \times 3$, $6 \times 2$, …) gives circulation 24, wherever the rectangle sits. Checking one directly: for a $4 \times 3$ rectangle centred at the origin, each side contributes (field along it) × (length), adding up to $2 \times 12$ ✓. Green's theorem turned a line integral into an area.`,
            },
            {
              type: 'numeric',
              title: 'Area by walking',
              prompt: r`Green's theorem gives a way to measure area by walking around a boundary: with $\mathbf F = \frac12(-y, x)$ (curl 1), the circulation equals the area. Walking once anticlockwise around the edge of a farmer's field (lengths in metres), the circulation comes out as 350. What is the area of the farmer's field?`,
              unit: 'm²',
              answer: 350,
              wrong: [{ v: 175, why: r`This $\mathbf F$ has curl $\frac12 + \frac12 = 1$, so circulation and area are equal.` }, { v: 700, why: 'With curl 1, there’s no factor of 2.' }],
              explain: r`Curl 1 means circulation = area: 350 m². This is how the **planimeter** works, a mechanical instrument that measures the area of any shape on a map just by tracing its outline: Green's theorem in brass.`,
            },
            {
              type: 'numeric',
              title: 'Flux by divergence',
              prompt: r`Use the divergence theorem: what is the flux of $\mathbf F = (x, y)$ out of the disc of radius 3? ($\nabla\cdot\mathbf F = 2$.)`,
              answer: 18 * Math.PI,
              tol: 0.05,
              wrong: [{ v: 9 * Math.PI, tol: 0.05, why: 'That’s the area. Multiply by the divergence, 2.' }, { v: 6 * Math.PI, tol: 0.05, why: 'Divergence × area, not × circumference.' }],
              explain: r`$2 \times \pi \times 3^2 = 18\pi \approx 56.5$, matching the direct calculation $2\pi R^2$ from the flux lesson. Two very different calculations, one answer: the theorems guarantee it.`,
            },
            {
              type: 'explain',
              title: 'Maxwell’s equations',
              body: r`In 1865 James Clerk Maxwell summed up all of electricity and magnetism in four equations about divergence and curl:
- $\nabla\cdot\mathbf E = \frac{\rho}{\varepsilon_0}$: electric field lines start and end on charges.
- $\nabla\cdot\mathbf B = 0$: there are no magnetic charges; magnetic field lines never begin or end.
- $\nabla\times\mathbf E = -\frac{\partial\mathbf B}{\partial t}$: a changing magnetic field makes the electric field swirl (Faraday's law: how generators work).
- $\nabla\times\mathbf B = \mu_0\mathbf J + \mu_0\varepsilon_0\frac{\partial\mathbf E}{\partial t}$: currents, and changing electric fields, make the magnetic field swirl.

The last two feed each other: changing fields create swirling fields, which change... Maxwell found these self-sustaining ripples travel at $\frac{1}{\sqrt{\mu_0\varepsilon_0}}$, the speed of light. Light is an electromagnetic wave.`,
            },
            {
              type: 'mcq',
              title: 'Which equation?',
              prompt: 'Cutting a bar magnet in half never gives a separate north pole and south pole: each piece has both. Which of Maxwell’s equations expresses this?',
              choices: [
                { t: r`$\nabla\cdot\mathbf B = 0$`, ok: true },
                { t: r`$\nabla\cdot\mathbf E = \frac{\rho}{\varepsilon_0}$`, why: 'That one is about electric charges, which do exist separately.' },
                { t: r`$\nabla\times\mathbf E = -\frac{\partial\mathbf B}{\partial t}$`, why: 'That’s Faraday’s law of induction, about changing magnetic fields.' },
              ],
              explain: r`Zero divergence everywhere means magnetic field lines have no sources or sinks: they always form closed loops, running out of the north end of a magnet and back in at the south. A lone magnetic pole (a "monopole") would be a source of $\mathbf B$; despite long searches, none has ever been found.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Light from constants',
              prompt: r`With $\mu_0 = 4\pi \times 10^{-7}$ and $\varepsilon_0 = 8.854 \times 10^{-12}$ (SI units), compute $\frac{1}{\sqrt{\mu_0\varepsilon_0}}$ in metres per second. (Answer like 3.0e8.)`,
              unit: 'm/s',
              answer: 1 / Math.sqrt(4 * Math.PI * 1e-7 * 8.854e-12),
              relTol: 0.01,
              wrong: [{ v: 1 / (4 * Math.PI * 1e-7 * 8.854e-12), tol: 1e15, why: 'Take the square root of the product before dividing.' }],
              explain: r`$\mu_0\varepsilon_0 \approx 1.113 \times 10^{-17}$, whose square root is $3.336 \times 10^{-9}$, giving $\approx 3.00 \times 10^8$ m/s: the measured speed of light. Constants found from magnets and capacitors on a lab bench predicted the speed of light, one of the great unifications in physics.`,
            },
          ],
          recap: [
            'Green: circulation around a boundary = total curl inside.',
            'Divergence theorem: flux out of a boundary = total divergence inside.',
            'Maxwell’s equations are statements about divergence and curl of E and B.',
          ],
        },
      ],
    },
  ],
};
