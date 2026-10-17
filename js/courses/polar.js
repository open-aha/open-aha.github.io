import { fix } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const TAU = 2 * Math.PI;
const D = Math.PI / 180;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// faint polar grid: circles every `step` out to R, rays every 30°
function polarGrid({ plot, s }, R, step = 1, { labels = true } = {}) {
  const els = [];
  const px = (v) => plot.X(v) - plot.X(0);
  for (let k = step; k <= R + 1e-9; k += step) els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: px(k), fill: 'none', stroke: 'var(--grid)', 'stroke-width': 1.5 }));
  for (let a = 0; a < 360; a += 30) els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(R * Math.cos(a * D)), y2: plot.Y(R * Math.sin(a * D)), stroke: 'var(--grid)', 'stroke-width': 1.5 }));
  if (labels) for (const a of [0, 90, 180, 270]) {
    const lx = (R + 0.12 * R) * Math.cos(a * D), ly = (R + 0.12 * R) * Math.sin(a * D);
    els.push(s('text', { x: plot.X(lx), y: plot.Y(ly) + 5, 'text-anchor': 'middle', class: 'tick', text: `${a}°` }));
  }
  return els;
}
// a polar curve r = f(θ) swept from 0 to `upto`, as a path string
function polarPath(plot, f, upto, n = 360) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (upto * i) / n, rr = f(t);
    d += (i ? 'L' : 'M') + plot.X(rr * Math.cos(t)).toFixed(1) + ' ' + plot.Y(rr * Math.sin(t)).toFixed(1);
  }
  return d;
}
function sweepMarks({ plot, s }, f, th, color = 'coral') {
  const rr = f(th), x = rr * Math.cos(th), y = rr * Math.sin(th);
  return [
    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(y), stroke: `var(--${color})`, 'stroke-width': 2.5, 'stroke-dasharray': '5 5' }),
    s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 7, class: `fl-${color}`, stroke: 'var(--card)', 'stroke-width': 2.5 }),
  ];
}

// ---------- parametric choices ----------
const PARAMS = [
  { name: '(cos t, sin t)', x: (t) => Math.cos(t), y: (t) => Math.sin(t) },
  { name: '(cos t, −sin t)', x: (t) => Math.cos(t), y: (t) => -Math.sin(t) },
  { name: '(−sin t, cos t)', x: (t) => -Math.sin(t), y: (t) => Math.cos(t) },
  { name: '(sin t, cos t)', x: (t) => Math.sin(t), y: (t) => Math.cos(t) },
];

// ---------- spirograph (hypotrochoid): gear of radius g rolling inside a ring of radius R, pen at d·g ----------
function spiro(R, g, d, t) {
  const k = (R - g) / g;
  return [(R - g) * Math.cos(t) + d * g * Math.cos(k * t), (R - g) * Math.sin(t) - d * g * Math.sin(k * t)];
}
function spiroWidget({ R = 60, g = 18, d = 0.8, gRange = [4, 56], showD = true, goal, solution, hint }) {
  return {
    kind: 'graph', equal: true, xmin: -66, xmax: 66, ymin: -64, ymax: 64, grid: false, axes: false, maxWidth: 420,
    params: {
      g: { min: gRange[0], max: gRange[1], step: 1, value: g, label: 'gear radius', color: 'violet' },
      d: { min: 0, max: 1, step: 0.05, value: d, label: 'pen', color: 'coral', format: (v) => `${fix(v * 100, 0)}% of radius`, slider: showD },
      u: { min: 0, max: 1, step: 0.001, value: 1, slider: false },
    },
    animate: { param: 'u', speed: 0.05, max: 1, loop: true },
    under: ({ plot, s }) => [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(R) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 })],
    extra: ({ plot, p, s }) => {
      const turns = p.g / gcd(R, p.g), T = TAU * turns, n = Math.min(4000, 120 * turns + 200);
      let full = '', part = '';
      const upto = Math.max(1, Math.round(n * p.u));
      for (let i = 0; i <= n; i++) {
        const [x, y] = spiro(R, p.g, p.d, (T * i) / n);
        const seg = (i ? 'L' : 'M') + plot.X(x).toFixed(1) + ' ' + plot.Y(y).toFixed(1);
        full += seg;
        if (i <= upto) part += seg;
      }
      const t = T * p.u, cx = (R - p.g) * Math.cos(t), cy = (R - p.g) * Math.sin(t);
      const [px, py] = spiro(R, p.g, p.d, t);
      return [
        s('path', { d: full, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 1.4, opacity: 0.35 }),
        s('path', { d: part, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 2.2 }),
        s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: plot.X(p.g) - plot.X(0), fill: 'var(--violet-soft)', 'fill-opacity': 0.45, stroke: 'var(--violet)', 'stroke-width': 2 }),
        s('line', { x1: plot.X(cx), y1: plot.Y(cy), x2: plot.X(px), y2: plot.Y(py), stroke: 'var(--violet)', 'stroke-width': 2 }),
        s('circle', { cx: plot.X(px), cy: plot.Y(py), r: 5.5, class: 'fl-coral' }),
      ];
    },
    readout: (p) => {
      const q = gcd(R, p.g);
      return `ring ${R}, gear ${p.g}: **${R / q}** points · the gear goes round the ring **${p.g / q}** time${p.g / q > 1 ? 's' : ''} before the pattern repeats`;
    },
    goal, solution, hint,
  };
}

// ---------- polar graph families ----------
const FAMS = [
  { name: 'r = 2', f: () => 2 },
  { name: 'r = 4 cos θ', f: (t) => 4 * Math.cos(t) },
  { name: 'r = 2(1 + cos θ)', f: (t) => 2 * (1 + Math.cos(t)) },
  { name: 'r = 1 + 2 cos θ', f: (t) => 1 + 2 * Math.cos(t) },
  { name: 'r = θ / 2', f: (t) => t / 2 },
];
// microphone pickup pattern
const mic = (A, t) => A + (1 - A) * Math.cos(t);

export default {
  id: 'polar',
  subject: 'math',
  title: 'Polar & Parametric Curves',
  level: 'Intermediate',
  cover: 'polar',
  tagline: 'Curves drawn by moving points: Lissajous figures, spirographs, roses, spirals and microphone patterns.',
  description: r`Describe curves the way you'd draw them: by moving a point. Parametric equations give the position at each moment, making circles, figure eights and spirograph patterns. Polar coordinates measure distance and direction from a centre, which turns circles, cardioids, roses and spirals into simple formulas, and describes how microphones and antennas pick up sound and signals.`,
  prereq: 'Trigonometry',
  chapters: [
    {
      title: 'Moving Points',
      summary: 'Parametric curves.',
      lessons: [
        {
          id: 'parametric',
          title: 'Motion as a Curve',
          summary: 'Position at each moment',
          icon: 'play',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A point on the move',
              body: r`Instead of a rule linking $y$ to $x$, give **both** coordinates as functions of time $t$:
$$x = \cos t, \qquad y = \sin t$$
These are **parametric equations**, and $t$ is the **parameter**. Drag the time slider to move the point.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 440,
                under: ({ plot, s }) => [s('line', { x1: plot.X(-1.6), x2: plot.X(1.6), y1: plot.Y(0), y2: plot.Y(0), class: 'axis-line', opacity: 0.6 }), s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.3), y2: plot.Y(1.3), class: 'axis-line', opacity: 0.6 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--grid)', 'stroke-width': 2 })],
                params: { t: { min: 0, max: 6.28, step: 0.01, value: 1, label: '$t$', color: 'violet', format: (v) => fix(v, 2) } },
                curves: [{ param: { x: (t) => Math.cos(t), y: (t) => Math.sin(t), t0: 0, t1: (p) => Math.max(p.t, 0.001) }, color: 'teal', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const x = Math.cos(p.t), y = Math.sin(p.t);
                  return [
                    s('line', { x1: plot.X(x), y1: plot.Y(y), x2: plot.X(x), y2: plot.Y(0), stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
                    s('line', { x1: plot.X(x), y1: plot.Y(y), x2: plot.X(0), y2: plot.Y(y), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
                    s('circle', { cx: plot.X(x), cy: plot.Y(0), r: 5, class: 'fl-blue' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(y), r: 5, class: 'fl-coral' }),
                    s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 8, class: 'fl-ink', stroke: 'var(--card)', 'stroke-width': 3 }),
                  ];
                },
                readout: (p) => r`$t = ${fix(p.t, 2)}$ · $\blue{x = ${fix(Math.cos(p.t), 2)}}$ · $\coral{y = ${fix(Math.sin(p.t), 2)}}$`,
              },
              after: r`The point goes round the unit circle anticlockwise, completing a lap at $t = 2\pi \approx 6.28$. Its {blue:shadow on the $x$-axis} swings back and forth like $\cos t$, and its {coral:shadow on the $y$-axis} like $\sin t$. A parametric curve carries more information than its shape: it also says **where** the point is **when**.`,
            },
            {
              type: 'mcq',
              title: 'Same circle, different motion',
              prompt: r`How does the motion $x = \cos 2t$, $y = \sin 2t$ differ from $x = \cos t$, $y = \sin t$?`,
              choices: [
                { t: 'Same circle, travelled twice as fast', ok: true },
                { t: 'A circle twice as big', why: r`The coordinates are still between $-1$ and $1$, so the circle has the same radius.` },
                { t: 'Half of the circle', why: r`As $t$ goes from 0 to $2\pi$, the angle $2t$ goes all the way to $4\pi$: two whole laps.` },
              ],
              explain: r`Both paths satisfy $x^2 + y^2 = 1$, but at time $t$ the second point has gone through angle $2t$: twice as far. Different parametric equations can trace the same shape at different speeds, directions or starting points.`,
            },
            {
              type: 'interactive',
              title: 'Start at the top, go clockwise',
              prompt: r`Pick the parametric equations $(x, y)$ for a point that **starts at the top** of the unit circle at $t = 0$ and moves **clockwise**. Press Play to watch your choice.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 440,
                under: ({ plot, s }) => [s('line', { x1: plot.X(-1.6), x2: plot.X(1.6), y1: plot.Y(0), y2: plot.Y(0), class: 'axis-line', opacity: 0.6 }), s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.3), y2: plot.Y(1.3), class: 'axis-line', opacity: 0.6 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--grid)', 'stroke-width': 2 })],
                params: {
                  k: { min: 0, max: 3, step: 1, value: 0, label: 'equations', color: 'violet', format: (v) => PARAMS[v].name },
                  t: { min: 0, max: 6.28, step: 0.01, value: 0, slider: false },
                },
                animate: { param: 't', speed: 1.4, max: TAU, loop: true },
                curves: [{ param: { x: (t, p) => PARAMS[p.k].x(t), y: (t, p) => PARAMS[p.k].y(t), t0: 0, t1: (p) => Math.max(p.t, 0.001) }, color: 'teal', width: 3 }],
                points: [
                  { x: (p) => PARAMS[p.k].x(0), y: (p) => PARAMS[p.k].y(0), color: 'muted', r: 6, label: 'start' },
                  { x: (p) => PARAMS[p.k].x(p.t), y: (p) => PARAMS[p.k].y(p.t), color: 'coral' },
                ],
                readout: (p) => r`at $t = 0$ the point is at $(${fix(PARAMS[p.k].x(0), 0)}, ${fix(PARAMS[p.k].y(0), 0)})$`,
                goal: (p) => p.k === 3,
                solution: { k: 3 },
                hint: r`At $t = 0$ the top of the circle is $(0, 1)$. Which choices give that? Then check which way each goes as $t$ grows.`,
              },
              explain: r`$(\sin t, \cos t)$ starts at $(\sin 0, \cos 0) = (0, 1)$, the top. A moment later $x$ becomes positive and $y$ drops: the point heads right and down, clockwise. $(-\sin t, \cos t)$ also starts at the top but heads left: anticlockwise. Swapping or negating the coordinates reflects the motion.`,
            },
            {
              type: 'numeric',
              title: 'Crossing the axis',
              prompt: r`A point moves along $x = 1 + 2t$, $y = 3 - t$. What is its $x$-coordinate when it crosses the $x$-axis?`,
              answer: 7,
              wrong: [{ v: 3, why: r`$t = 3$ is the time it crosses. Substitute it into $x = 1 + 2t$.` }, { v: 1, why: r`That's where it starts ($t = 0$). It crosses the $x$-axis when $y = 0$.` }],
              explain: r`On the $x$-axis, $y = 0$, so $3 - t = 0$ and $t = 3$. Then $x = 1 + 2 \times 3 = 7$. The point starts at $(1, 3)$ and moves 2 right and 1 down per unit of time: a straight line.`,
            },
            {
              type: 'explain',
              title: 'Getting rid of the parameter',
              body: r`To find the shape of a parametric curve, **eliminate** $t$: solve one equation for $t$ and substitute into the other.

From $x = 1 + 2t$ we get $t = \frac{x - 1}{2}$, so
$$y = 3 - \frac{x - 1}{2} = \frac{7 - x}{2}$$
a straight line. For the circle, we use the identity $\cos^2 t + \sin^2 t = 1$ instead: $x^2 + y^2 = 1$.

Eliminating the parameter keeps the **shape** but forgets the **motion**: which way, how fast, and where it starts.`,
            },
            {
              type: 'numeric',
              title: 'A squashed circle',
              prompt: r`The point $x = 3\cos t$, $y = 2\sin t$ traces an ellipse. What is the value of $\dfrac{x^2}{9} + \dfrac{y^2}{4}$ at every point of it?`,
              answer: 1,
              wrong: [{ v: 13, why: r`Divide first: $\frac{x^2}{9} = \cos^2 t$ and $\frac{y^2}{4} = \sin^2 t$.` }, { v: 0, why: r`$\cos^2 t + \sin^2 t$ is never 0.` }],
              explain: r`$\frac{x^2}{9} = \cos^2 t$ and $\frac{y^2}{4} = \sin^2 t$, which add to 1. So the curve is the ellipse $\frac{x^2}{9} + \frac{y^2}{4} = 1$: stretched to reach $x = \pm 3$ and $y = \pm 2$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A thrown ball',
              prompt: r`A ball's position (in metres, $t$ in seconds) is $x = 10t$, $y = 20t - 5t^2$. How far away does it land (where $y = 0$ again)?`,
              unit: 'm',
              answer: 40,
              wrong: [{ v: 4, why: r`$t = 4$ s is the landing time. The distance is $x = 10t$ at that time.` }, { v: 20, why: r`That's where the ball is highest ($t = 2$). It lands at $t = 4$.` }],
              explain: r`$20t - 5t^2 = 5t(4 - t) = 0$ at $t = 0$ (launch) and $t = 4$ (landing). Then $x = 10 \times 4 = 40$ m. Parametric equations are natural for projectiles: the horizontal and vertical motions are separate, each with its own simple rule.`,
            },
          ],
          recap: [
            'Parametric equations give x and y as functions of a parameter t.',
            'The same shape can be traced at different speeds and in different directions.',
            'Eliminate t to find the shape: substitute, or use cos² + sin² = 1.',
          ],
        },
        {
          id: 'lissajous',
          title: 'Lissajous Figures',
          summary: 'Two vibrations at once',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Wobbling in two directions',
              body: r`Make $x$ and $y$ vibrate at different frequencies:
$$x = \sin(at + \delta), \qquad y = \sin(bt)$$
In the 1850s Jules Lissajous reflected light off two vibrating tuning forks set at right angles, and saw these curves on a wall. Try different $a$, $b$ and phase shifts $\delta$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 400,
                params: {
                  a: { min: 1, max: 5, step: 1, value: 3, label: '$a$', color: 'blue' },
                  b: { min: 1, max: 5, step: 1, value: 2, label: '$b$', color: 'coral' },
                  dl: { min: 0, max: 180, step: 15, value: 90, label: '$\\delta$', color: 'violet', format: (v) => `${v}°` },
                },
                under: ({ plot, s }) => [s('rect', { x: plot.X(-1), y: plot.Y(1), width: plot.X(1) - plot.X(-1), height: plot.Y(-1) - plot.Y(1), fill: 'none', stroke: 'var(--grid)', 'stroke-width': 2 })],
                curves: [{ param: { x: (t, p) => Math.sin(p.a * t + p.dl * D), y: (t, p) => Math.sin(p.b * t), t0: 0, t1: TAU }, color: 'teal', width: 3, n: 600 }],
                readout: (p) => `frequency ratio ${p.a} : ${p.b}`,
              },
              after: r`The curve fills a square and touches its edges: $b$ times on the top (and on the bottom), because $y$ reaches its peak $b$ times per cycle, and $a$ times on each side, for the same reason. (Count the touching points of the 3 : 2 figure: 2 on top, 3 on the right.) Before digital meters, engineers compared frequencies by reading these figures on an **oscilloscope** screen.`,
            },
            {
              type: 'interactive',
              title: 'A figure eight',
              prompt: r`With $\delta = 0$, choose $a$ and $b$ to draw a **figure eight** standing upright (two loops, one above the other).`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 400,
                params: {
                  a: { min: 1, max: 5, step: 1, value: 3, label: '$a$', color: 'blue' },
                  b: { min: 1, max: 5, step: 1, value: 3, label: '$b$', color: 'coral' },
                },
                under: ({ plot, s }) => [s('rect', { x: plot.X(-1), y: plot.Y(1), width: plot.X(1) - plot.X(-1), height: plot.Y(-1) - plot.Y(1), fill: 'none', stroke: 'var(--grid)', 'stroke-width': 2 })],
                curves: [{ param: { x: (t, p) => Math.sin(p.a * t), y: (t, p) => Math.sin(p.b * t), t0: 0, t1: TAU }, color: 'teal', width: 3, n: 600 }],
                readout: (p) => `$x = \\sin ${p.a === 1 ? '' : p.a}t$, $y = \\sin ${p.b === 1 ? '' : p.b}t$`,
                goal: (p) => p.a === 2 && p.b === 1,
                solution: { a: 2, b: 1 },
                hint: 'An upright eight touches the top and bottom once each, and each side twice.',
              },
              explain: r`$a = 2$, $b = 1$: $x$ vibrates twice while $y$ vibrates once, so the point swings side to side twice during each up-and-down trip, making one loop in the top half and one in the bottom half. Swapping to $a = 1$, $b = 2$ lays the eight on its side.`,
            },
            {
              type: 'interactive',
              title: 'From a line to a circle',
              prompt: r`With $a = b = 1$ and no phase shift, the "curve" is a diagonal line. Change the phase $\delta$ to turn it into a **circle**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 400,
                params: { dl: { min: 0, max: 180, step: 15, value: 0, label: '$\\delta$', color: 'violet', format: (v) => `${v}°` } },
                under: ({ plot, s }) => [s('rect', { x: plot.X(-1), y: plot.Y(1), width: plot.X(1) - plot.X(-1), height: plot.Y(-1) - plot.Y(1), fill: 'none', stroke: 'var(--grid)', 'stroke-width': 2 })],
                curves: [{ param: { x: (t, p) => Math.sin(t + p.dl * D), y: (t) => Math.sin(t), t0: 0, t1: TAU }, color: 'teal', width: 3 }],
                readout: (p) => r`$x = \sin(t + ${p.dl}°)$, $y = \sin t$`,
                goal: (p) => p.dl === 90,
                solution: { dl: 90 },
                hint: r`A circle needs $x = \cos t$ and $y = \sin t$. How far must $\sin$ be shifted to become $\cos$?`,
              },
              explain: r`$\sin(t + 90°) = \cos t$, so $\delta = 90°$ gives $x = \cos t$, $y = \sin t$: the unit circle. In between, the line opens into tilted ellipses, and at $180°$ it closes back into the other diagonal. Engineers read **phase differences** between two signals from exactly these ellipses.`,
            },
            {
              type: 'mcq',
              title: 'Read the ratio',
              prompt: r`A Lissajous figure touches the top edge of its square **4** times and the right edge **3** times. What is the frequency ratio $a : b$ of the horizontal motion to the vertical one (for $x = \sin(at + \delta)$, $y = \sin bt$)?`,
              choices: [
                { t: '3 : 4', ok: true },
                { t: '4 : 3', why: r`The top edge is where $y = 1$, the peak of the **vertical** motion. Four touches there means $y$ peaks 4 times: $b = 4$.` },
                { t: '7 : 1', why: 'The ratio comes from the two counts separately, not their sum.' },
              ],
              explain: r`Each touch of the top edge is a peak of $y$, so $y$ completes 4 cycles: $b = 4$. Each touch of the right edge is a peak of $x$: $a = 3$. The ratio is $3 : 4$, and the vertical motion is the faster one. Check it with the explorer set to $a = 3$, $b = 4$.`,
            },
            {
              type: 'numeric',
              title: 'Tuning by eye',
              prompt: r`An oscilloscope shows a steady Lissajous figure of ratio $3 : 2$ between an unknown signal (horizontal) and a 400 Hz reference (vertical). What is the unknown frequency?`,
              unit: 'Hz',
              answer: 600,
              wrong: [{ v: 267, tol: 1, why: r`The horizontal signal is the 3 in $3 : 2$: it vibrates faster than the reference.` }, { v: 1200, why: r`Scale the ratio: $\frac{3}{2} \times 400$.` }],
              explain: r`The horizontal frequency is $\frac{3}{2}$ of the vertical one: $\frac32 \times 400 = 600$ Hz. A **steady** figure means the ratio is exactly $3 : 2$; if the frequencies are slightly off, the figure slowly rotates and morphs, and the rate of drift measures the error.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Never closing',
              prompt: r`What happens to the curve $x = \sin(\sqrt2\, t)$, $y = \sin t$ as $t$ keeps growing?`,
              choices: [
                { t: 'It never repeats, and gradually fills the whole square', ok: true },
                { t: 'It closes up after a while, like the other figures', why: r`To close, both motions must return to their start together: $\sqrt2\, t$ and $t$ would both have to be whole numbers of cycles, making $\sqrt2$ a fraction.` },
                { t: 'It settles onto a fixed ellipse', why: 'Nothing slows the motion down: the point keeps sweeping new paths.' },
              ],
              explain: r`The figure closes only when the frequency ratio is a **fraction**: after $q$ cycles of one and $p$ of the other, both are back at the start. Since $\sqrt2$ is irrational, that never happens, and the curve passes arbitrarily close to every point of the square. Irrational numbers, from this angle, are ratios that never repeat.`,
            },
          ],
          recap: [
            'Lissajous figures: x and y vibrate at frequencies a and b.',
            'Touches on the top = b (vertical frequency), on a side = a; phase changes the shape.',
            'The figure closes only if a : b is a ratio of whole numbers.',
          ],
        },
        {
          id: 'spirograph',
          title: 'Spirographs',
          summary: 'Gears rolling inside rings',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A gear inside a ring',
              body: r`A Spirograph gear rolls around inside a ring, with a pen through a hole in the gear. Here the ring has radius 60. Change the gear and the pen hole, and press Play to watch it roll.`,
              widget: spiroWidget({ g: 24, d: 0.8 }),
              after: r`The pen's path is a **hypotrochoid**: the gear's centre goes round a circle while the gear itself spins backwards. As parametric equations (ring $R$, gear $g$, pen at distance $p$ from the gear's centre):
$$x = (R - g)\cos t + p\cos\left(\tfrac{R - g}{g}t\right), \quad y = (R - g)\sin t - p\sin\left(\tfrac{R - g}{g}t\right)$$`,
            },
            {
              type: 'explain',
              title: 'Counting the points',
              body: r`When does the pattern close? The gear's teeth must line up with the ring's teeth exactly where they started. With a ring of radius $R$ and gear of radius $g$ (both whole numbers, proportional to tooth counts), let $c = \gcd(R, g)$, their greatest common divisor. Then:
- the pattern has $\dfrac{R}{c}$ points (loops or petals),
- the gear goes round the ring $\dfrac{g}{c}$ times before the pattern repeats.

For example, $R = 60$ and $g = 24$: $\gcd = 12$, so 5 points and 2 trips round the ring.`,
            },
            {
              type: 'interactive',
              title: 'A five-pointed pattern',
              prompt: r`The ring has radius 60. Choose a gear that makes a pattern with exactly **5** points, but **not** the 24 from the example.`,
              widget: spiroWidget({ g: 20, d: 0.8, goal: (p) => 60 / gcd(60, p.g) === 5 && p.g !== 24, solution: { g: 12 }, hint: 'You need gcd(60, g) = 12: g must be a multiple of 12.' }),
              explain: r`$\frac{60}{\gcd(60, g)} = 5$ needs $\gcd(60, g) = 12$: the gears 12, 36 and 48 work (as well as 24). They differ in how many times they travel round: once for 12, three times for 36, four times for 48. Gears sharing fewer factors with the ring make far more intricate patterns: try 59.`,
            },
            {
              type: 'numeric',
              title: 'A bigger ring',
              prompt: r`A ring of radius 105 and a gear of radius 30. How many points does the pattern have?`,
              unit: 'points',
              answer: 7,
              wrong: [{ v: 3.5, why: r`Divide by the greatest common divisor, not by the gear: $\gcd(105, 30) = 15$.` }, { v: 21, why: r`$105 \div 5 = 21$, but 5 isn't the *greatest* common divisor: 15 is.` }],
              explain: r`$\gcd(105, 30) = 15$, so the pattern has $105 \div 15 = 7$ points, and the gear goes round $30 \div 15 = 2$ times.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Half-size gear',
              body: r`Now the gear's radius is exactly half the ring's (30 inside 60). Put the pen on the rim (100%) and press Play.`,
              widget: spiroWidget({ g: 30, d: 1, gRange: [26, 34] }),
              after: r`With the pen on the rim, a point on a circle rolling inside a circle twice its size moves in a **straight line**, back and forth along a diameter! The 13th-century astronomer Nasir al-Din al-Tusi discovered this "Tusi couple" to make circular motions add up to straight-line motion. Any other pen position gives an ellipse.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sharp corners',
              prompt: r`With the pen exactly on the gear's rim, the curve has sharp points called **cusps**. A gear one quarter the ring's radius gives an **astroid** with 4 cusps. How many cusps does a gear one **third** the ring's radius give?`,
              unit: 'cusps',
              answer: 3,
              wrong: [{ v: 4, why: 'That’s the quarter-size gear. Count R ÷ gcd(R, g) for g = R/3.' }, { v: 6, why: r`With $g = \frac{R}{3}$, $\gcd(R, g) = g$, so the count is $R \div g = 3$.` }],
              explain: r`With $g = \frac R3$, the gear divides the ring evenly, so the count is $\frac{R}{g} = 3$: the curve is a **deltoid**, a curved triangle. Try ring 60 with gear 20 at 100%. The gear goes round once, rolling 3 of its circumferences along the ring, and the pen touches the ring 3 times: once at each cusp.`,
            },
          ],
          recap: [
            'A spirograph traces a hypotrochoid: a circle rolling inside a circle.',
            'Points = R ÷ gcd(R, g); trips round the ring = g ÷ gcd(R, g).',
            'A half-size gear draws straight lines (the Tusi couple).',
          ],
        },
      ],
    },
    {
      title: 'Polar Coordinates',
      summary: 'Distance and direction.',
      lessons: [
        {
          id: 'coords',
          title: 'Distance and Direction',
          summary: 'Polar coordinates',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Another way to say where',
              body: r`A radar screen doesn't say "3 km east, 4 km north". It says "**5 km away, at an angle of 53°**". That's **polar coordinates**: a distance $r$ from the centre (the **pole**) and an angle $\theta$ measured anticlockwise from the positive $x$-axis.

Converting uses the right triangle with hypotenuse $r$:
$$x = r\cos\theta, \qquad y = r\sin\theta$$
$$r = \sqrt{x^2 + y^2}, \qquad \tan\theta = \frac{y}{x}$$`,
            },
            {
              type: 'interactive',
              title: 'Find the spot',
              prompt: r`Drag the point to the polar coordinates $r = 3$, $\theta = 120°$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.8, xmax: 4.8, ymin: -4.4, ymax: 4.4, grid: false, axes: false, maxWidth: 440,
                params: { rr: { min: 0, max: 4, step: 0.5, value: 2, slider: false }, th: { min: 0, max: 345, step: 15, value: 30, slider: false } },
                under: (ctx) => polarGrid(ctx, 4),
                extra: ({ plot, p, s }) => {
                  const x = p.rr * Math.cos(p.th * D), y = p.rr * Math.sin(p.th * D), R0 = 0.8;
                  let arc = `M${plot.X(R0)} ${plot.Y(0)}`;
                  for (let a = 0; a <= p.th; a += 3) arc += `L${plot.X(R0 * Math.cos(a * D)).toFixed(1)} ${plot.Y(R0 * Math.sin(a * D)).toFixed(1)}`;
                  return [s('path', { d: arc, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 }), s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(y), stroke: 'var(--coral)', 'stroke-width': 3 })];
                },
                points: [{ x: (p) => p.rr * Math.cos(p.th * D), y: (p) => p.rr * Math.sin(p.th * D), drag: { fn: (x, y) => ({ rr: Math.min(4, Math.hypot(x, y)), th: ((Math.atan2(y, x) / D) + 360) % 360 }), key: 'th' }, color: 'coral' }],
                readout: (p) => r`$r = ${fix(p.rr, 1)}$, $\theta = ${p.th}°$ · $(x, y) = (${fix(p.rr * Math.cos(p.th * D), 2)}, ${fix(p.rr * Math.sin(p.th * D), 2)})$`,
                goal: (p) => p.rr === 3 && p.th === 120,
                solution: { rr: 3, th: 120 },
                hint: 'Go out to the third circle, then 30° past straight up (towards the left).',
              },
              explain: r`$120°$ is $30°$ past straight up, and $r = 3$ is the third circle. In Cartesian coordinates that's $x = 3\cos 120° = -1.5$ and $y = 3\sin 120° \approx 2.60$. Polar coordinates describe the same plane with a different grid: circles and rays instead of horizontal and vertical lines.`,
            },
            {
              type: 'numeric',
              title: 'Polar to Cartesian',
              prompt: r`The point with polar coordinates $r = 2$, $\theta = 60°$ has Cartesian coordinates $(x, y)$. What is $x$?`,
              answer: 1,
              wrong: [{ v: 1.732, tol: 0.01, why: r`That's $y = 2\sin 60°$. For $x$, use cosine.` }, { v: 2, why: r`$x = r\cos\theta$, and $\cos 60° = \frac12$.` }],
              explain: r`$x = 2\cos 60° = 2 \times \frac12 = 1$, and $y = 2\sin 60° = \sqrt3 \approx 1.73$.`,
            },
            {
              type: 'numeric',
              title: 'Cartesian to polar',
              prompt: r`The point $(-3, 3)$ in polar coordinates has angle $\theta$ between $0°$ and $360°$. What is $\theta$?`,
              unit: '°',
              answer: 135,
              wrong: [{ v: -45, why: r`$\tan^{-1}\left(\frac{3}{-3}\right) = -45°$ on a calculator, but the point is up and to the **left**, in the second quadrant.` }, { v: 45, why: r`$45°$ points up and to the right. This point has negative $x$.` }, { v: 315, why: 'That’s down and to the right. The point (−3, 3) is up and to the left.' }],
              explain: r`The point is up and to the left, so $\theta$ is between $90°$ and $180°$: $\theta = 135°$, with $r = \sqrt{9 + 9} = 3\sqrt2 \approx 4.24$. A calculator's $\tan^{-1}$ only returns angles between $-90°$ and $90°$, so always check which quadrant the point is in.`,
            },
            {
              type: 'multi',
              title: 'Many names for one point',
              prompt: r`Which polar coordinates describe the **same point** as $(r, \theta) = (2, 30°)$?`,
              choices: [
                { t: r`$(2, 390°)$`, ok: true },
                { t: r`$(-2, 210°)$`, ok: true },
                { t: r`$(2, 210°)$`, why: r`That's the opposite point, on the other side of the pole.` },
                { t: r`$(-2, 30°)$`, why: r`A negative $r$ means "go backwards": this is the point at $210°$, the opposite one.` },
                { t: r`$(2, -330°)$`, ok: true },
              ],
              explain: r`Adding or subtracting $360°$ gives the same direction, so $(2, 390°)$ and $(2, -330°)$ match. A **negative** $r$ means stepping backwards from the angle's direction, so $(-2, 210°)$ (face $210°$, walk 2 backwards) also lands at $(2, 30°)$. Unlike Cartesian coordinates, every point has infinitely many polar names.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two radar blips',
              prompt: r`Radar shows one aircraft at $(r, \theta) = (3\text{ km}, 0°)$ and another at $(5\text{ km}, 60°)$. How far apart are they? (2 decimal places.)`,
              unit: 'km',
              answer: Math.sqrt(19),
              tol: 0.01,
              wrong: [{ v: 2, why: 'That subtracts the distances, but the aircraft are in different directions.' }, { v: Math.sqrt(34), tol: 0.01, why: r`That's Pythagoras, but the angle between them is $60°$, not $90°$. Use the law of cosines.` }],
              hint: r`The pole and the two aircraft form a triangle with sides 3 and 5 and the angle $60°$ between them.`,
              explain: r`By the law of cosines: $d^2 = 3^2 + 5^2 - 2(3)(5)\cos 60° = 9 + 25 - 15 = 19$, so $d = \sqrt{19} \approx 4.36$ km. The formula $d^2 = r_1^2 + r_2^2 - 2r_1r_2\cos(\theta_2 - \theta_1)$ gives the distance between any two points in polar form.`,
            },
          ],
          recap: [
            'Polar coordinates: distance r from the pole and angle θ from the x-axis.',
            'x = r cos θ, y = r sin θ; r = √(x² + y²); check the quadrant for θ.',
            'Each point has many polar names: add 360°, or use negative r.',
          ],
        },
        {
          id: 'polargraphs',
          title: 'Polar Graphs',
          summary: 'Circles, cardioids and limaçons',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Sweeping a radius',
              body: r`A polar graph $r = f(\theta)$ is drawn by a radius that sweeps round: at each angle, mark the point at distance $f(\theta)$. Pick a curve and press Play to watch it being drawn.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.6, xmax: 4.6, ymin: -3.8, ymax: 3.8, grid: false, axes: false, maxWidth: 460,
                params: { k: { min: 0, max: 4, step: 1, value: 2, label: 'curve', color: 'violet', format: (v) => FAMS[v].name }, th: { min: 0, max: TAU, step: 0.01, value: TAU, slider: false } },
                animate: { param: 'th', speed: 1.1, max: TAU, loop: true },
                under: (ctx) => polarGrid(ctx, 4, 1, { labels: false }),
                extra: (ctx) => [ctx.s('path', { d: polarPath(ctx.plot, FAMS[ctx.p.k].f, ctx.p.th), fill: 'none', stroke: 'var(--teal)', 'stroke-width': 3.5 }), ...sweepMarks(ctx, FAMS[ctx.p.k].f, ctx.p.th)],
                readout: (p) => r`$\theta = ${fix(p.th / D, 0)}°$ · $r = ${fix(FAMS[p.k].f(p.th), 2)}$`,
              },
              after: r`$r = 2$ is a circle (constant distance). $r = 4\cos\theta$ is also a circle, through the pole. $r = 2(1 + \cos\theta)$ is a heart-shaped **cardioid**. $r = 1 + 2\cos\theta$ has a small inner loop: there $r$ is negative and the point is plotted backwards. And $r = \frac{\theta}{2}$ spirals outwards.`,
            },
            {
              type: 'interactive',
              title: 'Find the cardioid',
              prompt: r`The **limaçon** $r = 1 + b\cos\theta$ changes shape with $b$. Find the value of $b$ where the curve just reaches the pole with a sharp point: the cardioid.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.4, xmax: 4.4, ymin: -3.2, ymax: 3.2, grid: false, axes: false, maxWidth: 460,
                params: { b: { min: 0, max: 2.5, step: 0.1, value: 0.4, label: '$b$', color: 'coral', format: (v) => fix(v, 1) } },
                under: (ctx) => polarGrid(ctx, 3, 1, { labels: false }),
                extra: (ctx) => [ctx.s('path', { d: polarPath(ctx.plot, (t) => 1 + ctx.p.b * Math.cos(t), TAU), fill: 'var(--teal-soft)', 'fill-opacity': 0.5, 'fill-rule': 'nonzero', stroke: 'var(--teal)', 'stroke-width': 3.5 }), ctx.s('circle', { cx: ctx.plot.X(0), cy: ctx.plot.Y(0), r: 4, class: 'fl-ink' })],
                readout: (p) => r`smallest $r$: $1 - ${fix(p.b, 1)} = ${fix(1 - p.b, 1)}$ (at $\theta = 180°$)${p.b > 1 ? ' · negative: an inner loop' : ''}`,
                goal: (p) => Math.abs(p.b - 1) < 1e-9,
                solution: { b: 1 },
                hint: r`At $\theta = 180°$, $r = 1 - b$. When is that exactly zero?`,
              },
              explain: r`At $b = 1$, $r = 1 + \cos\theta$ is zero at $\theta = 180°$: the curve comes into the pole and turns sharply, a cusp. For $b < 1$ it's a dimpled oval; for $b > 1$, $r$ goes negative and an inner loop appears. The cardioid is the borderline case, the same curve traced by a point on a coin rolling round another coin of the same size.`,
            },
            {
              type: 'numeric',
              title: 'A hidden circle',
              prompt: r`The graph of $r = 4\cos\theta$ is a circle. What is its radius?`,
              answer: 2,
              wrong: [{ v: 4, why: r`The farthest point is 4 from the pole, but the pole is on the circle: 4 is the diameter.` }],
              explain: r`Multiply by $r$: $r^2 = 4r\cos\theta$, which in Cartesian form is $x^2 + y^2 = 4x$, or $(x - 2)^2 + y^2 = 4$. A circle of radius 2 centred at $(2, 0)$, passing through the pole. In polar form, circles through the pole have this especially simple equation.`,
            },
            {
              type: 'mcq',
              title: 'A constant angle',
              prompt: r`In polar coordinates, what is the graph of $\theta = 45°$ (every point whose angle is $45°$, with any $r$)?`,
              choices: [
                { t: 'A straight line through the pole', ok: true },
                { t: 'A circle', why: r`A circle is $r = $ constant. Here the angle is fixed and $r$ varies.` },
                { t: 'A single point', why: r`Every value of $r$ is allowed, so there are infinitely many points.` },
              ],
              explain: r`All points in the direction $45°$, at every distance (and, with negative $r$, the opposite direction $225°$ too): the line $y = x$. In polar coordinates the "simple" graphs swap roles: constant $r$ gives circles, constant $\theta$ gives lines through the pole.`,
            },
            {
              type: 'numeric',
              title: 'Where the inner loop starts',
              prompt: r`For the limaçon $r = 1 + 2\cos\theta$, at what angle between $0°$ and $180°$ does $r$ first become zero?`,
              unit: '°',
              answer: 120,
              wrong: [{ v: 90, why: r`At $90°$, $\cos\theta = 0$ so $r = 1$, not 0.` }, { v: 60, why: r`$\cos 60° = +\frac12$ gives $r = 2$. You need $\cos\theta = -\frac12$.` }],
              explain: r`$1 + 2\cos\theta = 0$ gives $\cos\theta = -\frac12$, so $\theta = 120°$. Between $120°$ and $240°$, $r$ is negative and the curve draws its inner loop on the opposite side.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A cardioid standing up',
              prompt: r`What is the highest $y$-coordinate reached by the cardioid $r = 2 + 2\sin\theta$?`,
              answer: 4,
              wrong: [{ v: 2, why: r`At $\theta = 90°$, $\sin\theta = 1$, so $r = 4$.` }, { v: 2.598, tol: 0.01, why: 'The top of the curve is straight up from the pole, at θ = 90°.' }],
              explain: r`At $\theta = 90°$, $r = 2 + 2 = 4$, and the point is straight above the pole: $y = 4$. Replacing $\cos$ with $\sin$ rotates the cardioid by $90°$, so this one points up, with its cusp at the pole underneath.`,
            },
          ],
          recap: [
            'A polar graph r = f(θ) is drawn by a sweeping radius.',
            'r = constant is a circle; θ = constant is a line through the pole.',
            'Limaçons r = 1 + b cos θ: dimpled (b < 1), cardioid (b = 1), inner loop (b > 1).',
          ],
        },
        {
          id: 'roses',
          title: 'Polar Roses',
          summary: 'Petals from cosines',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Petals',
              body: r`The curve $r = \cos(k\theta)$ is a **rose**. Choose $k$ and press Play to see the petals drawn one by one.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 420,
                params: { k: { min: 1, max: 8, step: 1, value: 3, label: '$k$', color: 'coral' }, th: { min: 0, max: TAU, step: 0.01, value: TAU, slider: false } },
                animate: { param: 'th', speed: 0.9, max: TAU, loop: true },
                under: (ctx) => polarGrid(ctx, 1, 0.5, { labels: false }),
                extra: (ctx) => [ctx.s('path', { d: polarPath(ctx.plot, (t) => Math.cos(ctx.p.k * t), ctx.p.th, 720), fill: 'none', stroke: 'var(--pink)', 'stroke-width': 3 }), ...sweepMarks(ctx, (t) => Math.cos(ctx.p.k * t), ctx.p.th, 'violet')],
                readout: (p) => `$k = ${p.k}$: **${p.k % 2 ? p.k : 2 * p.k}** petals`,
              },
              after: r`Odd $k$ gives $k$ petals; even $k$ gives $2k$. Why? Each petal is drawn while $\cos(k\theta)$ goes from 0 up to 1 and back to 0, or down to $-1$ and back. Negative $r$ draws a petal on the opposite side. For odd $k$, those backward petals land exactly on top of forward ones, so the curve retraces itself in the second half of the sweep.`,
            },
            {
              type: 'interactive',
              title: 'Eight petals',
              prompt: r`Choose $k$ so that $r = \cos(k\theta)$ has exactly **8** petals.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 420,
                params: { k: { min: 1, max: 9, step: 1, value: 8, label: '$k$', color: 'coral' } },
                under: (ctx) => polarGrid(ctx, 1, 0.5, { labels: false }),
                extra: (ctx) => [ctx.s('path', { d: polarPath(ctx.plot, (t) => Math.cos(ctx.p.k * t), TAU, 720), fill: 'var(--pink-soft)', 'fill-opacity': 0.6, stroke: 'var(--pink)', 'stroke-width': 3 })],
                readout: (p) => `$k = ${p.k}$: **${p.k % 2 ? p.k : 2 * p.k}** petals`,
                goal: (p) => p.k === 4,
                solution: { k: 4 },
                hint: 'Eight is even, so it must come from an even k, which doubles.',
              },
              explain: r`$k = 4$ gives $2 \times 4 = 8$ petals. The obvious guess, $k = 8$, gives 16, because even values of $k$ double the count.`,
            },
            {
              type: 'numeric',
              title: 'Sine roses',
              prompt: r`How many petals does $r = \sin 5\theta$ have?`,
              unit: 'petals',
              answer: 5,
              wrong: [{ v: 10, why: '5 is odd, so the backward petals land on top of the forward ones.' }],
              explain: r`Switching $\cos$ to $\sin$ just rotates the rose. The rule is the same: $k = 5$ is odd, so 5 petals.`,
            },
            {
              type: 'numeric',
              title: 'Between the petals',
              prompt: r`The rose $r = \cos 3\theta$ has 3 petals spaced evenly around the pole. What is the angle between the tips of neighbouring petals?`,
              unit: '°',
              answer: 120,
              wrong: [{ v: 60, why: r`Tips happen where $\cos 3\theta = \pm 1$, every $60°$, but every other one is a negative-$r$ tip plotted opposite, on top of a positive one.` }],
              explain: r`3 petals spread evenly around $360°$: $120°$ apart. The tips are at $0°$, $120°$ and $240°$ (where $\cos 3\theta = 1$). The angles $60°$, $180°$, $300°$ give $r = -1$, which plots at $240°$, $0°$ and $120°$: the same tips again.`,
            },
            {
              type: 'mcq',
              title: 'Tracing twice',
              prompt: r`As $\theta$ goes from $0°$ to $360°$, how many times does $r = \cos 3\theta$ trace its three petals?`,
              choices: [
                { t: 'Twice: once in the first 180°, again in the second', ok: true },
                { t: 'Once', why: 'Watch the explorer with k = 3: after half a turn the curve starts retracing the petals it already drew.' },
                { t: 'Three times', why: 'Each petal is drawn twice over the full turn, not three times.' },
              ],
              explain: r`For odd $k$, $\cos(k(\theta + 180°)) = -\cos(k\theta)$: half a turn later, the radius is reversed, and a reversed radius pointing the opposite way lands on the same point. So the whole rose is drawn by $180°$ and redrawn in the second half.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'An impossible rose',
              prompt: r`With $k$ a whole number, which number of petals can the rose $r = \cos(k\theta)$ **never** have?`,
              choices: [
                { t: '6', ok: true },
                { t: '5', why: 'k = 5 is odd and gives exactly 5 petals.' },
                { t: '8', why: 'k = 4 is even and gives 8 petals.' },
                { t: '12', why: 'k = 6 is even and gives 12 petals.' },
              ],
              explain: r`Odd $k$ gives an **odd** number of petals, and even $k$ gives $2k$, a **multiple of 4**. So petal counts like 2, 6, 10, 14 (even but not multiples of 4) never appear. To get 6 petals you need a different formula, such as $r = |\cos 3\theta|$.`,
            },
          ],
          recap: [
            'Roses r = cos kθ: k petals for odd k, 2k petals for even k.',
            'Negative r plots on the opposite side; odd roses retrace themselves.',
            'Petal counts of 2, 6, 10, … are impossible with whole k.',
          ],
        },
      ],
    },
    {
      title: 'Curves at Work',
      summary: 'Spirals and patterns.',
      lessons: [
        {
          id: 'spirals',
          title: 'Spirals',
          summary: 'Even steps or growing ones',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Archimedes’ spiral',
              body: r`In polar form, the simplest spiral is $r = a\theta$: the distance grows steadily as the angle turns. (Here $\theta$ is in radians, so one full turn adds $2\pi$ to it.) Change $a$ and the number of turns.`,
              widget: {
                kind: 'graph', equal: true, xmin: -13, xmax: 13, ymin: -11, ymax: 11, grid: false, axes: false, maxWidth: 460,
                under: ({ plot, s }) => [s('line', { x1: plot.X(0), x2: plot.X(13), y1: plot.Y(0), y2: plot.Y(0), class: 'axis-line', opacity: 0.6 })],
                params: {
                  a: { min: 0.1, max: 1, step: 0.05, value: 0.4, label: '$a$', color: 'coral', format: (v) => fix(v, 2) },
                  n: { min: 1, max: 6, step: 1, value: 4, label: 'turns', color: 'violet' },
                },
                extra: ({ plot, p, s }) => {
                  const els = [s('path', { d: polarPath(plot, (t) => p.a * t, TAU * p.n, 160 * p.n), fill: 'none', stroke: 'var(--teal)', 'stroke-width': 3 })];
                  for (let k = 1; k <= p.n; k++) if (p.a * TAU * k <= 13) els.push(s('circle', { cx: plot.X(p.a * TAU * k), cy: plot.Y(0), r: 5, class: 'fl-coral' }));
                  return els;
                },
                readout: (p) => `gap between turns along any ray: $2\\pi a = ${fix(TAU * p.a, 2)}$`,
              },
              after: r`Each full turn adds the same distance $2\pi a$: the coils are **evenly spaced**, like a rolled-up carpet, a coiled rope or the groove on a vinyl record. The coral dots, where the spiral crosses the positive $x$-axis, are equally spaced.`,
            },
            {
              type: 'interactive',
              title: 'Space the coils',
              prompt: r`Set $a$ so that neighbouring coils of $r = a\theta$ are exactly **2** units apart.`,
              widget: {
                kind: 'graph', equal: true, xmin: -13, xmax: 13, ymin: -11, ymax: 11, grid: false, axes: false, maxWidth: 460,
                under: ({ plot, s }) => [s('line', { x1: plot.X(0), x2: plot.X(13), y1: plot.Y(0), y2: plot.Y(0), class: 'axis-line', opacity: 0.6 })],
                params: { a: { min: 0.1, max: 0.6, step: 0.01, value: 0.5, label: '$a$', color: 'coral', format: (v) => fix(v, 2) } },
                extra: ({ plot, p, s }) => [s('path', { d: polarPath(plot, (t) => p.a * t, TAU * 5, 800), fill: 'none', stroke: 'var(--teal)', 'stroke-width': 3 }), ...[1, 2, 3, 4, 5].filter((k) => p.a * TAU * k <= 13).map((k) => s('circle', { cx: plot.X(p.a * TAU * k), cy: plot.Y(0), r: 5, class: 'fl-coral' }))],
                readout: (p) => `gap $2\\pi a = ${fix(TAU * p.a, 2)}$`,
                goal: (p) => Math.abs(TAU * p.a - 2) < 0.04,
                solution: { a: 0.32 },
                hint: r`You need $2\pi a = 2$.`,
              },
              explain: r`$2\pi a = 2$ gives $a = \frac{1}{\pi} \approx 0.32$. The coral dots now sit at $2, 4, 6, 8, 10$ on the $x$-axis.`,
            },
            {
              type: 'numeric',
              title: 'A roll of paper',
              prompt: r`A roll of paper 0.1 mm thick is wound from a 20 mm core radius out to a 60 mm outer radius. Treating each turn as a circle of the average radius, roughly how long is the paper in metres?`,
              unit: 'm',
              answer: 400 * TAU * 40 / 1000,
              relTol: 0.03,
              wrong: [{ v: 0.4, why: 'That’s the 40 mm of thickness. Each of the 400 turns is a whole circumference long.' }, { v: 50, tol: 3, why: r`That uses the core radius (20 mm) for every turn. Use the average radius, 40 mm: circumference $= 2\pi \times 40$.` }],
              hint: r`Number of turns: $\frac{60 - 20}{0.1}$. Average circumference: $2\pi \times 40$ mm.`,
              explain: r`There are $\frac{40}{0.1} = 400$ turns, each about $2\pi \times 40 \approx 251$ mm long: $400 \times 251 \approx 100{,}500$ mm, about **100 m**. That's how long a whole roll is, even though it looks small. Equivalently, the paper's side area (length × thickness) equals the ring's area $\pi(60^2 - 20^2)$.`,
            },
            {
              type: 'explain',
              title: 'Spirals that grow',
              body: r`In a **logarithmic spiral** $r = e^{b\theta}$, each turn **multiplies** the distance by the same factor $e^{2\pi b}$, instead of adding a fixed amount. So the coils get farther and farther apart, and every part of the spiral is a scaled copy of every other part.

That self-similarity is why growing things make log spirals: a nautilus shell grows by adding to its edge without changing shape. Spiral galaxies and the bands of hurricanes approximate them too. (The Famous Curves course explores this spiral further.)`,
            },
            {
              type: 'numeric',
              title: 'Growth per turn',
              prompt: r`A logarithmic spiral grows by a factor of 1.5 every full turn. By what factor has its distance from the centre grown after 4 turns?`,
              answer: 1.5 ** 4,
              tol: 0.005,
              wrong: [{ v: 6, why: 'That adds 1.5 four times. The log spiral multiplies: 1.5 × 1.5 × 1.5 × 1.5.' }, { v: 3, why: r`Each turn multiplies by 1.5: four turns give $1.5^4$.` }],
              explain: r`$1.5^4 = 5.0625$. In an Archimedean spiral distance grows by **adding** each turn; in a logarithmic one it grows by **multiplying**, like compound interest.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'In the groove',
              prompt: r`One side of an LP record plays for about 20 minutes at $33\tfrac13$ revolutions per minute. The groove spirals inwards from a radius of 146 mm to 60 mm. What is the average spacing between neighbouring turns of the groove, in mm? (3 decimal places.)`,
              unit: 'mm',
              answer: 86 / (20 * 100 / 3),
              tol: 0.002,
              wrong: [{ v: 4.3, why: 'That divides by the 20 minutes. Divide by the number of turns: 20 × 33⅓.' }, { v: 2.58, tol: 0.02, why: 'Divide the 86 mm by the number of turns, about 667, not by 33⅓.' }],
              hint: r`Number of turns $= 20 \times 33\tfrac13 \approx 667$. They fill $146 - 60 = 86$ mm.`,
              explain: r`$20 \times 33\tfrac13 \approx 667$ turns fill 86 mm, so the spacing is about $86 \div 667 \approx 0.129$ mm: about the thickness of a human hair. Cutting lathes even varied the spacing ("variable pitch"), packing quiet passages tighter to fit more music.`,
            },
          ],
          recap: [
            'Archimedean spiral r = aθ: evenly spaced coils, 2πa apart.',
            'Logarithmic spiral r = e^(bθ): each turn multiplies r by e^(2πb).',
            'Coiled objects (rolls, records) follow Archimedean spirals.',
          ],
        },
        {
          id: 'patterns',
          title: 'Polar Plots at Work',
          summary: 'Microphones and antennas',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Which way is a microphone listening?',
              body: r`A microphone's **polar pattern** shows its sensitivity to sound arriving from each direction: the distance from the centre at angle $\theta$ is how strongly it picks up sound from that direction. The mic points along $0°$ (to the right). Most patterns are mixes:
$$r = A + (1 - A)\cos\theta$$
Change the mix $A$, and drag the {amber:noise source} around.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.45, xmax: 1.45, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 440,
                params: {
                  A: { min: 0, max: 1, step: 0.05, value: 0.5, label: '$A$', color: 'violet', format: (v) => `${fix(v, 2)} ${v === 1 ? '(omni)' : v === 0.5 ? '(cardioid)' : v === 0 ? '(figure 8)' : ''}` },
                  ph: { min: 0, max: 355, step: 5, value: 150, slider: false },
                },
                under: (ctx) => polarGrid(ctx, 1, 0.25),
                extra: ({ plot, p, s }) => {
                  const f = (t) => Math.abs(mic(p.A, t));
                  const els = [s('path', { d: polarPath(plot, (t) => Math.abs(mic(p.A, t)), TAU, 360), fill: 'var(--blue-soft)', 'fill-opacity': 0.55, stroke: 'var(--blue)', 'stroke-width': 3 })];
                  const t = p.ph * D;
                  els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(1.05 * Math.cos(t)), y2: plot.Y(1.05 * Math.sin(t)), stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
                  els.push(s('circle', { cx: plot.X(f(t) * Math.cos(t)), cy: plot.Y(f(t) * Math.sin(t)), r: 5, class: 'fl-ink' }));
                  els.push(s('rect', { x: plot.X(0) - 9, y: plot.Y(0) - 6, width: 26, height: 12, rx: 6, class: 'fl-ink' }));
                  return els;
                },
                points: [{ x: (p) => 1.05 * Math.cos(p.ph * D), y: (p) => 1.05 * Math.sin(p.ph * D), drag: { fn: (x, y) => ({ ph: ((Math.atan2(y, x) / D) + 360) % 360 }), key: 'ph' }, color: 'amber' }],
                readout: (p) => `noise from ${p.ph}°: picked up at **${fix(Math.abs(mic(p.A, p.ph * D)) * 100, 0)}%** of full strength`,
              },
              after: r`$A = 1$ is **omnidirectional**: equally sensitive all round. $A = 0.5$ is the **cardioid** (heart-shaped, the polar graph from earlier!): sensitive in front, deaf at the back. $A = 0$ is a **figure eight**: front and back, but deaf at the sides. Where the formula goes negative (the back lobe of the figure eight), the mic still hears the sound, just with its signal flipped upside down, so the plot shows the size $|r|$. Sound engineers choose patterns to pick up a singer while ignoring the crowd or the speakers.`,
            },
            {
              type: 'interactive',
              title: 'Deaf at the back',
              prompt: r`A loudspeaker sits **directly behind** the microphone ($\theta = 180°$). Choose $A$ so that the mic picks up **nothing** from it.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.45, xmax: 1.45, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 440,
                params: { A: { min: 0, max: 1, step: 0.05, value: 0.8, label: '$A$', color: 'violet', format: (v) => fix(v, 2) } },
                under: (ctx) => polarGrid(ctx, 1, 0.25, { labels: false }),
                extra: ({ plot, p, s }) => [
                  s('path', { d: polarPath(plot, (t) => Math.abs(mic(p.A, t)), TAU, 360), fill: 'var(--blue-soft)', 'fill-opacity': 0.55, stroke: 'var(--blue)', 'stroke-width': 3 }),
                  s('rect', { x: plot.X(-1.2) - 12, y: plot.Y(0) - 16, width: 24, height: 32, rx: 5, class: 'fl-amber' }),
                  s('rect', { x: plot.X(0) - 9, y: plot.Y(0) - 6, width: 26, height: 12, rx: 6, class: 'fl-ink' }),
                ],
                readout: (p) => `pick-up from behind: $r(180°) = 2A - 1 = ${fix(2 * p.A - 1, 2)}$`,
                goal: (p) => Math.abs(p.A - 0.5) < 1e-9,
                solution: { A: 0.5 },
                hint: r`$\cos 180° = -1$, so $r(180°) = A - (1 - A)$.`,
              },
              explain: r`$r(180°) = A - (1 - A) = 2A - 1 = 0$ gives $A = \frac12$: the cardioid, $r = \frac12(1 + \cos\theta)$. That's why cardioid mics are the standard on stage: the monitor speakers aim at the performer, which puts them behind the mic.`,
            },
            {
              type: 'numeric',
              title: 'From the side',
              prompt: r`How strongly does a cardioid mic ($A = 0.5$) pick up sound arriving from the side ($\theta = 90°$), as a fraction of the front?`,
              answer: 0.5,
              wrong: [{ v: 0, why: r`The cardioid is zero only at $180°$. At $90°$, $\cos\theta = 0$ leaves $r = A$.` }, { v: 1, why: r`$r(90°) = 0.5 + 0.5 \times 0 = 0.5$.` }],
              explain: r`$r(90°) = 0.5 + 0.5\cos 90° = 0.5$: half the sensitivity of the front. In sound-engineering units that's $20\log_{10} 0.5 \approx -6$ dB.`,
            },
            {
              type: 'interactive',
              title: 'Aim the null',
              prompt: r`Two stage monitors sit at $\pm 120°$. Choose $A$ so the pattern's **null** (zero pick-up) points at $120°$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.45, xmax: 1.45, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 440,
                params: { A: { min: 0, max: 0.6, step: 0.01, value: 0.5, label: '$A$', color: 'violet', format: (v) => fix(v, 2) } },
                under: (ctx) => polarGrid(ctx, 1, 0.25, { labels: false }),
                extra: ({ plot, p, s }) => {
                  const els = [s('path', { d: polarPath(plot, (t) => Math.abs(mic(p.A, t)), TAU, 720), fill: 'var(--blue-soft)', 'fill-opacity': 0.55, stroke: 'var(--blue)', 'stroke-width': 3 })];
                  for (const a of [120, 240]) els.push(s('rect', { x: plot.X(1.1 * Math.cos(a * D)) - 10, y: plot.Y(1.1 * Math.sin(a * D)) - 10, width: 20, height: 20, rx: 4, class: 'fl-amber' }));
                  const c = -p.A / (1 - p.A);
                  if (c >= -1) for (const sg of [1, -1]) { const t = sg * Math.acos(c); els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(1.2 * Math.cos(t)), y2: plot.Y(1.2 * Math.sin(t)), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '4 5' })); }
                  els.push(s('rect', { x: plot.X(0) - 9, y: plot.Y(0) - 6, width: 26, height: 12, rx: 6, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => { const c = -p.A / (1 - p.A); return c >= -1 ? `nulls (coral) at **±${fix(Math.acos(c) / D, 1)}°**` : 'no null'; },
                goal: (p) => Math.abs(Math.acos(-p.A / (1 - p.A)) / D - 120) < 1.5,
                solution: { A: 0.33 },
                hint: r`A null is where $A + (1 - A)\cos\theta = 0$. At $120°$, $\cos\theta = -\frac12$.`,
              },
              explain: r`$A + (1 - A)(-\frac12) = 0$ gives $A = \frac13$. Patterns between the cardioid and the figure eight (the **supercardioid** and **hypercardioid**) have two nulls angled backwards, which is exactly where engineers place the monitors.`,
            },
            {
              type: 'mcq',
              title: 'Antennas too',
              prompt: r`A simple vertical radio antenna radiates in a pattern like $r = \sin\theta$, where $\theta$ is measured from the antenna's own (vertical) axis. Where does it send almost no signal?`,
              choices: [
                { t: 'Straight up and straight down, along the antenna', ok: true },
                { t: 'Horizontally, towards the horizon', why: r`At $\theta = 90°$ (horizontal), $\sin\theta = 1$: the strongest direction.` },
                { t: 'Equally in all directions', why: r`$\sin\theta$ changes with direction: it's a figure-eight (in 3D, a doughnut).` },
              ],
              explain: r`$\sin 0° = \sin 180° = 0$: nothing along the axis, and the most at the horizon. In 3D the pattern is a doughnut around the antenna, which is just right for broadcast towers: signal goes out to listeners all around, not wasted on the sky.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Half power',
              prompt: r`A figure-eight microphone has pattern $r = |\cos\theta|$. At what angle from the front (between $0°$ and $90°$) does its sensitivity drop to $\frac{1}{\sqrt2} \approx 0.707$ (the "−3 dB" point, half the power)?`,
              unit: '°',
              answer: 45,
              wrong: [{ v: 60, why: r`$\cos 60° = 0.5$: that's the −6 dB point. You want $\cos\theta = 0.707$.` }, { v: 30, why: r`$\cos 30° \approx 0.87$, still above 0.707.` }],
              explain: r`$\cos\theta = \frac{1}{\sqrt2}$ at $\theta = 45°$. Engineers quote a pattern's **beamwidth** as the angle between its −3 dB points: here $90°$ for the front lobe. Narrow beams (dish antennas, shotgun mics) pick out one direction and ignore the rest.`,
            },
          ],
          recap: [
            'A polar pattern plots sensitivity against direction.',
            'r = A + (1 − A) cos θ: omni (1), cardioid (½), figure eight (0).',
            'Nulls point where r = 0; the −3 dB points set the beamwidth.',
          ],
        },
      ],
    },
  ],
};
