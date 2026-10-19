import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed d decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d);
const XY = { xlabel: 'x', ylabel: 'y' };

// Numerically trace the solution of dy/dx = F(x, y) through (x0, y0), using RK4.
// Returns a function of x (NaN where the solution has left the window).
const traceCache = new Map();
function trace(key, F, x0, y0, xmin, xmax, lim = 60) {
  const k = `${key}|${x0}|${y0}|${xmin}|${xmax}`;
  if (traceCache.has(k)) return traceCache.get(k);
  const h = 0.01;
  const run = (dir) => {
    const pts = [[x0, y0]];
    let x = x0, y = y0;
    while ((dir > 0 ? x < xmax : x > xmin) && Math.abs(y) < lim) {
      const s = dir * h;
      const k1 = F(x, y), k2 = F(x + s / 2, y + (s * k1) / 2), k3 = F(x + s / 2, y + (s * k2) / 2), k4 = F(x + s, y + s * k3);
      y += (s * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
      x += s;
      pts.push([x, y]);
    }
    return pts;
  };
  const pts = [...run(-1).reverse(), ...run(1).slice(1)];
  const fn = (x) => {
    if (x < pts[0][0] || x > pts[pts.length - 1][0]) return NaN;
    const i = Math.min(pts.length - 2, Math.max(0, Math.floor((x - pts[0][0]) / h)));
    const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
    return ya + ((yb - ya) * (x - xa)) / (xb - xa || 1);
  };
  traceCache.set(k, fn);
  return fn;
}

// short slope segments at grid points
function slopeField(plot, s, F, { step = 0.5, len = 0.32 } = {}) {
  const els = [];
  for (let x = Math.ceil(plot.xmin / step) * step; x <= plot.xmax + 1e-9; x += step) {
    for (let y = Math.ceil(plot.ymin / step) * step; y <= plot.ymax + 1e-9; y += step) {
      const m = F(x, y);
      if (!isFinite(m)) continue;
      const dx = len / Math.sqrt(1 + m * m) / 2, dy = m * dx;
      els.push(s('line', { x1: plot.X(x - dx), y1: plot.Y(y - dy), x2: plot.X(x + dx), y2: plot.Y(y + dy), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 }));
    }
  }
  return els;
}

const FIELDS = [
  { tex: r`\dfrac{dy}{dx} = x`, F: (x) => x },
  { tex: r`\dfrac{dy}{dx} = y`, F: (x, y) => y },
  { tex: r`\dfrac{dy}{dx} = x - y`, F: (x, y) => x - y },
];

// damped oscillator x'' + 2g x' + w0^2 x = 0, x(0) = 1, x'(0) = 0
function damped(t, g, w0) {
  if (g < w0 - 1e-9) {
    const wd = Math.sqrt(w0 * w0 - g * g);
    return Math.exp(-g * t) * (Math.cos(wd * t) + (g / wd) * Math.sin(wd * t));
  }
  if (Math.abs(g - w0) <= 1e-9) return Math.exp(-g * t) * (1 + g * t);
  const q = Math.sqrt(g * g - w0 * w0), r1 = -g + q, r2 = -g - q;
  return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

// pendulum θ'' = −sin θ (units where g/L = 1): trajectory from (θ0, ω0), RK4
function pendulumPath(th0, w0, T = 14, h = 0.02) {
  const f = (th, w) => [w, -Math.sin(th)];
  let th = th0, w = w0;
  const pts = [[th, w]];
  for (let t = 0; t < T; t += h) {
    const [a1, b1] = f(th, w), [a2, b2] = f(th + (h / 2) * a1, w + (h / 2) * b1), [a3, b3] = f(th + (h / 2) * a2, w + (h / 2) * b2), [a4, b4] = f(th + h * a3, w + h * b3);
    th += (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
    w += (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
    pts.push([th, w]);
    if (Math.abs(th) > 4) break;
  }
  return pts;
}
const pendE = (th, w) => (w * w) / 2 - Math.cos(th);

// exact solutions of y' = y(3 - y): y = 3y0 e^{3t} / (3 - y0 + y0 e^{3t})
const LOGI_START = [-0.06, 0.04, 0.3, 0.9, 1.6, 2.3, 2.8, 3.4, 4.1, 4.8];
const logiY = (y0, t) => { const g = Math.exp(3 * t), d = 3 - y0 + y0 * g; return d <= 0 ? -Infinity : (3 * y0 * g) / d; };

export default {
  id: 'diffeq',
  subject: 'math',
  title: 'Differential Equations',
  level: 'Advanced',
  cover: 'diffeq',
  tagline: 'Equations about change: growth, cooling, populations, oscillations, phase portraits and mixing.',
  description: r`Most laws of nature don't say what something **is**. They say how it **changes**. Learn to read slope fields, put the number $e$ to work, model cooling coffee, growing populations and mixing tanks, solve equations step by step with Euler's method, see why springs bounce and shock absorbers don't, and draw the phase portrait of a pendulum.`,
  prereq: 'Calculus: Integrals',
  chapters: [
    {
      title: 'Equations About Change',
      summary: 'Slope fields and exponentials.',
      lessons: [
        {
          id: 'slope-fields',
          title: 'Slope Fields',
          summary: 'Following the arrows',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'An equation for a rate',
              body: r`A **differential equation** links a quantity to its rate of change. For example,
$$\frac{dy}{dx} = x$$
says "at every point, the slope of $y$ equals $x$". Its solution isn't a number. It's a whole **function**, and here $y = \tfrac12 x^2 + C$ works for any constant $C$: its derivative is $x$.

So there's a whole **family** of solutions. Picking a starting point picks one member of the family.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Slope fields',
              body: r`At each grid point, a short dash shows the slope the equation demands there. A solution curve must follow the dashes everywhere. Drag the starting point and switch equations.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3, ymax: 3, grid: 1, axes: XY, maxWidth: 600,
                params: {
                  i: { min: 0, max: 2, step: 1, value: 2, label: 'equation', color: 'violet', format: (v) => ['dy/dx = x', 'dy/dx = y', 'dy/dx = x − y'][v] },
                  x0: { min: -4, max: 4, step: 0.25, value: -2, slider: false },
                  y0: { min: -3, max: 3, step: 0.25, value: 2, slider: false },
                },
                curves: [{ f: (x, p) => trace(p.i, FIELDS[p.i].F, p.x0, p.y0, -4.2, 4.2)(x), color: 'blue', width: 4 }],
                extra: ({ plot, p, s }) => slopeField(plot, s, FIELDS[p.i].F),
                points: [{ x: (p) => p.x0, y: (p) => p.y0, drag: { x: 'x0', y: 'y0' }, color: 'coral' }],
                readout: (p) => r`$${FIELDS[p.i].tex}$, starting at $(${f2(p.x0)}, ${f2(p.y0)})$`,
              },
              after: r`For $\dfrac{dy}{dx} = x - y$, every solution is drawn toward the line $y = x - 1$, wherever it starts. A slope field shows the behaviour of **all** solutions at once, before you solve anything.`,
            },
            {
              type: 'interactive',
              title: 'Hit the target',
              prompt: r`For $\dfrac{dy}{dx} = x$, drag the starting point up or down the $y$-axis so that the solution passes through the green point $(2, 3)$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3, ymax: 4, grid: 1, axes: XY, maxWidth: 600,
                params: { y0: { min: -3, max: 4, step: 0.5, value: -1, slider: false } },
                curves: [{ f: (x, p) => 0.5 * x * x + p.y0, color: 'blue', width: 4 }],
                extra: ({ plot, s }) => [...slopeField(plot, s, (x) => x), s('circle', { cx: plot.X(2), cy: plot.Y(3), r: 9, class: 'fl-green' })],
                points: [{ x: () => 0, y: (p) => p.y0, drag: { y: 'y0' }, color: 'coral' }],
                readout: (p) => r`$y = \tfrac12 x^2 ${p.y0 < 0 ? '-' : '+'} ${f2(Math.abs(p.y0), 1)}$`,
                goal: (p) => p.y0 === 1,
                hint: r`The solutions are $y = \tfrac12 x^2 + C$. What $C$ gives $y = 3$ at $x = 2$?`,
                solution: { y0: 1 },
              },
              explain: r`$3 = \tfrac12(2)^2 + C = 2 + C$, so $C = 1$. A starting condition like this is called an **initial condition**: it picks out one curve from the family.`,
            },
            {
              type: 'numeric',
              title: 'Read a slope',
              prompt: r`For the differential equation $\dfrac{dy}{dx} = x + y$, what is the slope of the solution curve passing through the point $(1, 2)$?`,
              answer: 3,
              wrong: [{ v: 2, why: r`The slope depends on both $x$ and $y$: $1 + 2$.` }],
              explain: r`Just substitute: $\frac{dy}{dx} = 1 + 2 = 3$. A differential equation tells you the slope at every point, without telling you the curve. Drawing those slopes everywhere gives the slope field.`,
            },
            {
              type: 'numeric',
              title: 'Equilibrium lines',
              prompt: r`For $\frac{dy}{dt} = y(3 - y)$, the slope is zero along horizontal lines where solutions stay constant. Apart from $y = 0$, at what value of $y$ is there such an equilibrium?`,
              answer: 3,
              explain: r`$y(3 - y) = 0$ when $y = 0$ or $y = 3$. In the slope field these lines are flat; solutions between them rise towards 3, which is a stable equilibrium (a carrying capacity).`,
            },
            { /*anim:diffeq*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Flowing along the field',
              body: r`The slope field of $\dfrac{dy}{dt} = y(3 - y)$, with ten solutions released at once from different starting values. Watch where they go.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3, ymin: -1, ymax: 5.2, grid: false, height: 320, clipExtra: true, axes: { xlabel: 't', ylabel: 'y' },
                animate: { param: 't', speed: 0.6, max: 3.8, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const T = Math.min(3, p.t), els = [];
                  for (let t = 0.15; t < 3; t += 0.3) for (let y = -0.75; y < 5.2; y += 0.5) {
                    const dx = plot.X(t + 0.01) - plot.X(t), dy = plot.Y(y + 0.01 * y * (3 - y)) - plot.Y(y), L = Math.hypot(dx, dy) / 8;
                    els.push(s('line', { x1: plot.X(t) - dx / L, y1: plot.Y(y) - dy / L, x2: plot.X(t) + dx / L, y2: plot.Y(y) + dy / L, stroke: 'var(--line-2)', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
                  }
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(3), y1: plot.Y(3), y2: plot.Y(3), stroke: 'var(--teal)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(3), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
                  for (const y0 of LOGI_START) {
                    const pts = [];
                    for (let i = 0; i <= 120; i++) { const t = (T * i) / 120, y = logiY(y0, t); if (y < -1.5) break; pts.push(`${i ? 'L' : 'M'}${plot.X(t).toFixed(1)} ${plot.Y(y).toFixed(1)}`); }
                    els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2.5 }));
                    const y = logiY(y0, T);
                    if (y > -1.5) els.push(s('circle', { cx: plot.X(T), cy: plot.Y(y), r: 5, class: 'fl-blue' }));
                  }
                  return els;
                },
                readout: (p) => { const T = Math.min(3, p.t), k = LOGI_START.filter((y0) => Math.abs(logiY(y0, T) - 3) < 0.05).length; return `$t = ${fix(T, 2)}$ · ${k} of 10 solutions within 0.05 of {teal:y = 3}`; },
              },
              after: r`Every solution that starts above 0, even a tiny bit above, is drawn to the {teal:line $y = 3$}, from below and from above: a **stable** equilibrium. The {coral:line $y = 0$} is also an equilibrium, but an **unstable** one: solutions starting near it are pushed away, upwards or (below it) down and off the bottom of the picture. You can read all this from the field's arrows without solving anything.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Translate the words',
              prompt: r`"A population $P$ grows at a rate proportional to its size." Which equation says this?`,
              cols: 2,
              choices: [
                { t: r`$\dfrac{dP}{dt} = kP$`, ok: true },
                { t: r`$P = kt$`, why: 'That says the population itself is proportional to time. The statement is about the growth rate.' },
                { t: r`$\dfrac{dP}{dt} = k$`, why: 'That’s a constant growth rate, the same no matter how big P is.' },
                { t: r`$\dfrac{dP}{dt} = kt$`, why: 'That makes the rate depend on time, not on the population’s size.' },
              ],
              explain: r`"The rate of change of $P$" is $\dfrac{dP}{dt}$, and "proportional to its size" means it equals $kP$ for some constant $k$. This is the most important differential equation of all. Let's solve it next.`,
            },
          ],
          recap: [
            'A differential equation relates a function to its derivatives. Its solutions are functions.',
            'A slope field draws the required slope everywhere. Solutions follow it.',
            'An initial condition picks one solution out of the family.',
          ],
        },
        {
          id: 'exponential',
          title: 'Growth, Decay and e',
          summary: 'The function that is its own slope',
          icon: 'flame',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'Tune the growth rate',
              prompt: r`Recall from the Derivatives course that $e^x$ is its own derivative. The graph shows $y = e^{kt}$, growth at rate $k$ per year. Adjust $k$ until the quantity takes exactly **10 years** to double.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 9, grid: false, height: 320, axes: { xlabel: 'years', ylabel: 'y', xticks: 5, yticks: 1 },
                params: { k: { min: 0.02, max: 0.2, step: 0.0005, value: 0.1, label: '$k$', color: 'blue', format: (v) => v.toFixed(4) } },
                curves: [{ f: (t, p) => Math.exp(p.k * t), color: 'blue', width: 3 }, { f: () => 2, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => { const T = Math.log(2) / p.k; if (T > plot.xmax) return []; return [s('line', { x1: plot.X(T), x2: plot.X(T), y1: plot.Y(0), y2: plot.Y(2), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }), s('circle', { cx: plot.X(T), cy: plot.Y(2), r: 6, class: 'fl-coral' })]; },
                readout: (p) => r`Doubling time: $${(Math.log(2) / p.k).toFixed(2)}$ years`,
                goal: (p) => Math.abs(Math.log(2) / p.k - 10) < 0.1,
                hint: r`Doubling needs $e^{10k} = 2$, so $10k = \ln 2 \approx 0.693$.`,
                solution: { k: 0.0693 },
              },
              explain: r`$e^{10k} = 2$ gives $k = \frac{\ln 2}{10} \approx 0.0693$: growing at about 7% per year doubles in 10 years. Notice the doubling time doesn't depend on where you start: from 1 to 2, or from 4 to 8, always 10 years.`,
            },
            {
              type: 'explain',
              title: 'Solving dy/dt = ky',
              body: r`Speeding up time by a factor $k$ multiplies every slope by $k$, so
$$\frac{d}{dt}e^{kt} = k\,e^{kt}$$
That means $y = y_0 e^{kt}$ solves
$$\frac{dy}{dt} = ky, \qquad y(0) = y_0$$
- $k > 0$: **exponential growth** (bacteria, compound interest, chain reactions).
- $k < 0$: **exponential decay** (radioactivity, drug levels in the blood).

The amount **doubles** (or **halves**) in a fixed time, whatever the current size: $T = \dfrac{\ln 2}{|k|} \approx \dfrac{0.693}{|k|}$.`,
            },
            {
              type: 'numeric',
              title: 'Bacteria',
              prompt: r`A culture of 100 bacteria doubles every 20 minutes. How many are there after 2 hours?`,
              answer: 6400,
              wrong: [{ v: 600, why: 'Doubling is multiplying by 2 each time, not adding 100.' }, { v: 1200, why: r`2 hours is 6 doublings: $100 \times 2^6$, not $100 \times 2 \times 6$.` }, { v: 12800, why: r`Count again: 120 min ÷ 20 min = 6 doublings.` }],
              explain: r`2 hours is $120 / 20 = 6$ doubling times, so $100 \times 2^6 = 6400$.`,
            },
            {
              type: 'numeric',
              title: 'The rule of 70',
              prompt: r`Money grows continuously at 7% a year ($k = 0.07$). About how many years does it take to double?`,
              unit: 'years',
              answer: 9.9,
              tol: 0.15,
              wrong: [{ v: 14.3, tol: 0.2, why: r`That's $1/0.07$. The doubling time is $\ln 2 / k$.` }, { v: 0.0485, tol: 0.002, why: r`That's $k \ln 2$. Divide instead: $\ln 2 / k$.` }],
              explain: r`$T = \dfrac{\ln 2}{0.07} \approx \dfrac{0.693}{0.07} \approx 9.9$ years. That's the **rule of 70**: doubling time ≈ 70 ÷ (percentage growth rate).`,
            },
            {
              type: 'numeric',
              title: 'Half-life from the rate',
              prompt: r`A substance decays with $k = 0.1$ per year ($y = y_0e^{-0.1t}$). What is its half-life, in years? (2 decimal places.)`,
              unit: 'years',
              answer: Math.log(2) / 0.1,
              tol: 0.01,
              explain: r`$t_{1/2} = \frac{\ln 2}{k} = \frac{0.693}{0.1} \approx 6.93$ years. Doubling times and half-lives both equal $\frac{\ln 2}{|k|}$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Radioactive iodine',
              prompt: r`Iodine-131, used in medicine, has a half-life of about 8 days. A patient receives 80 mg. How much remains after 24 days?`,
              unit: 'mg',
              answer: 10,
              wrong: [{ v: 26.7, tol: 0.2, why: r`That's $80 \div 3$. Instead, halve once per half-life: $80 \to 40 \to 20 \to 10$.` }, { v: 20, why: '24 days is 3 half-lives, not 2.' }, { v: 0, why: 'Exponential decay never quite reaches zero. Halve three times.' }],
              explain: r`24 days is 3 half-lives: $80 \times \left(\tfrac12\right)^3 = 10$ mg.`,
            },
          ],
          recap: [
            r`$\dfrac{d}{dx}e^x = e^x$, where $e \approx 2.718$.`,
            r`$\dfrac{dy}{dt} = ky$ has solution $y = y_0 e^{kt}$.`,
            r`Doubling time or half-life: $T = \ln 2 / |k|$.`,
          ],
        },
        {
          id: 'cooling',
          title: 'Newton’s Law of Cooling',
          summary: 'Approaching equilibrium',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Cooling coffee',
              body: r`A hot drink cools faster when it's much hotter than the room, and more slowly as it gets close. **Newton's law of cooling** says the rate is proportional to the temperature **difference**:
$$\frac{dT}{dt} = -k\,(T - T_{\text{room}})$$
The difference $D = T - T_{\text{room}}$ obeys $\dfrac{dD}{dt} = -kD$, which is exponential decay! So
$$T(t) = T_{\text{room}} + (T_0 - T_{\text{room}})\,e^{-kt}$$`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Cooling curves',
              body: r`Coffee starts at 90 °C. Change the room temperature and the cooling constant $k$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 100, grid: 10, gridY: 20, height: 330, axes: { xlabel: 'minutes', ylabel: '°C' },
                params: {
                  Tr: { min: 0, max: 40, step: 5, value: 20, label: 'room', color: 'teal', format: (v) => `${v} °C` },
                  k: { min: 0.02, max: 0.2, step: 0.01, value: 0.07, label: '$k$', color: 'coral', format: (v) => `${v.toFixed(2)} /min` },
                },
                curves: [{ f: (t, p) => p.Tr + (90 - p.Tr) * Math.exp(-p.k * t), color: 'coral' }, { f: (t, p) => p.Tr, color: 'teal', dash: true }],
                readout: (p) => r`after 10 min: $${f2(p.Tr + (90 - p.Tr) * Math.exp(-p.k * 10))}$ °C; the gap halves every $${f2(Math.LN2 / p.k)}$ min`,
              },
              after: r`The coffee never quite reaches room temperature: the gap keeps shrinking by the same **fraction** in each equal stretch of time.`,
            },
            {
              type: 'numeric',
              title: 'Halving the gap',
              prompt: r`Coffee at 90 °C sits in a 20 °C room. After 10 minutes it's at 55 °C. How many minutes (from the start) until it reaches 37.5 °C?`,
              unit: 'min',
              answer: 20,
              wrong: [{ v: 15, why: r`Cooling isn't linear. Look at the gap: 70 → 35 → 17.5. Each halving takes 10 minutes.` }, { v: 10, why: 'That gets you to 55 °C. You need another halving of the gap.' }, { v: 30, why: r`The gap is $37.5 - 20 = 17.5$, a quarter of 70: two halvings, not three.` }],
              explain: r`The gap from the room is 70 °C at the start and 35 °C after 10 min: it halves every 10 minutes. 37.5 °C is a gap of 17.5 = 70 ÷ 4, two halvings, so **20 minutes**.`,
            },
            {
              type: 'numeric',
              title: 'Finding the constant',
              prompt: r`Coffee at 90 °C sits in a 20 °C room and cools to 50 °C in 10 minutes. In Newton’s law the gap shrinks as $e^{-kt}$, so $70\,e^{-10k} = 30$. What is $k$, per minute? (3 decimal places.)`,
              unit: '/min',
              answer: Math.log(70 / 30) / 10,
              tol: 0.001,
              wrong: [{ v: 0.4, tol: 0.05, why: r`Work with the gaps above room temperature (70 and 30), not the temperatures themselves.` }],
              explain: r`$k = \frac{\ln(70/30)}{10} \approx 0.085$ per minute. A bigger $k$ means faster cooling: a thin metal mug has a larger $k$ than an insulated flask.`,
            },
            {
              type: 'numeric',
              title: 'After one time constant',
              prompt: r`A cooling object has $k = 0.1$ per minute and starts 60 °C above room temperature. How far above room temperature is it after 10 minutes? (1 decimal place.)`,
              unit: '°C',
              answer: 60 * Math.exp(-1),
              tol: 0.1,
              explain: r`$60e^{-0.1 \times 10} = 60e^{-1} \approx 22.1$ °C. After one **time constant** $\frac1k$, the gap has shrunk to $\frac1e \approx 37\%$ of its starting value.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Half an hour',
              prompt: r`Same coffee: what is its temperature after 30 minutes?`,
              unit: '°C',
              answer: 28.75,
              tol: 0.1,
              wrong: [{ v: 11.25, tol: 0.1, why: r`That's $90 / 8$. Only the **gap** above room temperature halves: add the 20 °C back.` }, { v: 8.75, tol: 0.1, why: 'That’s the gap. Add the room temperature.' }],
              explain: r`Three halvings: gap $= 70 / 8 = 8.75$ °C, so $T = 20 + 8.75 = 28.75$ °C. Forensic scientists run this calculation backwards to estimate time of death from body temperature.`,
            },
          ],
          recap: [
            r`Newton's law: $\dfrac{dT}{dt} = -k(T - T_{\text{room}})$.`,
            'The temperature gap decays exponentially and halves at regular intervals.',
            'The object approaches room temperature but never quite reaches it.',
          ],
        },
      ],
    },
    {
      title: 'Models and Methods',
      summary: 'Limits, steps and springs.',
      lessons: [
        {
          id: 'logistic',
          title: 'Logistic Growth',
          summary: 'Growth that levels off',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Room to grow',
              body: r`Real populations can't grow exponentially forever: food and space run out. The **logistic equation** adds a brake:
$$\frac{dP}{dt} = rP\left(1 - \frac{P}{K}\right)$$
When $P$ is small, the bracket is about 1, so growth is roughly exponential. As $P$ approaches the **carrying capacity** $K$, the bracket shrinks to 0 and growth stops.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The S-curve',
              body: r`Adjust the growth rate, the carrying capacity and the starting population.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 1200, grid: 2, gridY: 200, height: 330, padL: 58, axes: { xlabel: 'time', ylabel: 'P' },
                params: {
                  r: { min: 0.2, max: 1.5, step: 0.1, value: 0.6, label: '$r$', color: 'coral', format: (v) => v.toFixed(1) },
                  K: { min: 400, max: 1100, step: 100, value: 1000, label: '$K$', color: 'teal', format: (v) => `${v}` },
                  P0: { min: 10, max: 1200, step: 10, value: 20, label: '$P_0$', color: 'blue', format: (v) => `${v}` },
                },
                curves: [
                  { f: (t, p) => p.K / (1 + ((p.K - p.P0) / p.P0) * Math.exp(-p.r * t)), color: 'blue' },
                  { f: (t, p) => p.K, color: 'teal', dash: true },
                  { f: (t, p) => p.P0 * Math.exp(p.r * t), color: 'coral', dash: true, visible: (p) => p.P0 < p.K },
                ],
                readout: (p) => (p.P0 > p.K ? r`Starting above $K$: the population shrinks down to $K = ${p.K}$` : r`The blue curve levels off at $K = ${p.K}$. The dashed coral line is pure exponential growth.`),
              },
              after: r`Start small and you get an **S-shaped** curve: exponential at first, then levelling off at $K$. Start above $K$ and the population falls back down to $K$. Either way, $K$ is where it ends up.`,
            },
            {
              type: 'mcq',
              title: 'Equilibria',
              prompt: r`At which population sizes does $\dfrac{dP}{dt} = rP\left(1 - \dfrac{P}{K}\right)$ equal zero, so the population stays constant?`,
              cols: 2,
              choices: [
                { t: r`$P = 0$ and $P = K$`, ok: true },
                { t: r`Only $P = K$`, why: r`If $P = 0$, there's nobody to reproduce, so $\frac{dP}{dt} = 0$ too.` },
                { t: r`$P = K/2$`, why: r`At $K/2$ the growth rate is at its **largest**, not zero.` },
                { t: 'Never', why: 'Set each factor to zero: P = 0 or 1 − P/K = 0.' },
              ],
              explain: r`The product is zero when $P = 0$ or $P = K$. $K$ is **stable**: populations nearby move toward it. $0$ is **unstable**: a few individuals grow away from it.`,
            },
            {
              type: 'numeric',
              title: 'A fifth full',
              prompt: r`A population follows $\dfrac{dP}{dt} = 0.5\,P\left(1 - \dfrac{P}{1000}\right)$. How fast is it growing when $P = 200$?`,
              unit: 'per unit time',
              answer: 80,
              wrong: [{ v: 100, why: r`Don't forget the crowding factor $1 - \frac{200}{1000} = 0.8$.` }, { v: 0, why: 'It’s only at 1000 that growth stops.' }],
              explain: r`$0.5 \times 200 \times 0.8 = 80$. At $P = 800$ it's $0.5 \times 800 \times 0.2 = 80$ too: logistic growth is symmetric about half-full, with too few breeders on one side and too little room on the other.`,
            },
            {
              type: 'numeric',
              title: 'Halfway there',
              prompt: r`A population follows $N(t) = \frac{K}{1 + 9e^{-t}}$ with $K = 100$, starting at $N(0) = 10$. When does it reach half the carrying capacity? (2 decimal places.)`,
              answer: Math.log(9),
              tol: 0.01,
              explain: r`$N = 50$ when $9e^{-t} = 1$, so $t = \ln 9 \approx 2.20$. That’s also the moment of fastest growth, the inflection point of the S-curve.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Fastest growth',
              prompt: r`With $r = 0.5$ per year and $K = 1000$, the growth rate $\dfrac{dP}{dt}$ is largest when $P = K/2$. What is that maximum rate, in individuals per year?`,
              unit: '/year',
              answer: 125,
              wrong: [{ v: 250, why: r`Don't forget the bracket: $1 - \frac{500}{1000} = \frac12$.` }, { v: 500, why: r`That's $P$ itself. Compute $rP(1 - P/K)$.` }],
              explain: r`$\dfrac{dP}{dt} = 0.5 \times 500 \times \left(1 - \tfrac{500}{1000}\right) = 0.5 \times 500 \times 0.5 = 125$ per year. In general, the maximum is $rK/4$, at the S-curve's inflection point. Fisheries use this idea to estimate a sustainable catch.`,
            },
          ],
          recap: [
            r`Logistic: $\dfrac{dP}{dt} = rP(1 - P/K)$, with carrying capacity $K$.`,
            r`Equilibria at $0$ (unstable) and $K$ (stable).`,
            r`Fastest growth at $P = K/2$, where the rate is $rK/4$.`,
          ],
        },
        {
          id: 'euler',
          title: 'Euler’s Method',
          summary: 'Solving by taking small steps',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'When formulas run out',
              body: r`Most differential equations can't be solved with a neat formula. But a computer can still follow the slope field, step by step. **Euler's method**:
1. Start at $(x_0, y_0)$.
2. Compute the slope there: $m = F(x_0, y_0)$.
3. Walk a short distance $h$ along that slope: $y_1 = y_0 + h\,m$, $x_1 = x_0 + h$.
4. Repeat from the new point.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Estimating e',
              body: r`Solve $\dfrac{dy}{dx} = y$ with $y(0) = 1$ from $x = 0$ to $x = 1$. The true answer is $y(1) = e$. Change the number of steps.`,
              widget: {
                kind: 'graph', xmin: -0.1, xmax: 1.15, ymin: 0.8, ymax: 2.9, grid: 0.25, gridY: 0.5, height: 340, axes: XY,
                params: { n: { min: 1, max: 20, step: 1, value: 2, label: 'steps', color: 'coral', format: (v) => `${v}` } },
                curves: [{ f: (x) => Math.exp(x), color: 'blue' }],
                extra: ({ plot, p, s }) => {
                  const h = 1 / p.n;
                  const pts = [[0, 1]];
                  for (let i = 0; i < p.n; i++) pts.push([(i + 1) * h, pts[i][1] * (1 + h)]);
                  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('');
                  return [s('path', { d, fill: 'none', class: 'st-coral', 'stroke-width': 3 }), ...pts.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 4, class: 'fl-coral' }))];
                },
                readout: (p) => r`Euler: $y(1) \approx \left(1 + \tfrac{1}{${p.n}}\right)^{${p.n}} = ${((1 + 1 / p.n) ** p.n).toFixed(4)}$ $\quad$ true: $e = 2.7183$`,
              },
              after: r`Each step multiplies $y$ by $(1 + h)$, so $n$ steps give $\left(1 + \frac1n\right)^n$, which creeps up toward $e$ as the steps shrink. Euler's method always falls a little short here, because $e^x$ curves upward and each straight step undershoots the curve.`,
            },
            {
              type: 'numeric',
              title: 'Two steps by hand',
              prompt: r`Use Euler's method with 2 steps ($h = 0.5$) on $\dfrac{dy}{dx} = y$, $y(0) = 1$. What is the estimate of $y(1)$?`,
              answer: 2.25,
              wrong: [{ v: 2, why: r`That's one step of size 1. With $h = 0.5$: $1 \to 1.5 \to 2.25$.` }, { v: 2.5, why: r`The second step uses the new slope, 1.5: $1.5 + 0.5 \times 1.5 = 2.25$.` }],
              explain: r`Step 1: slope 1, so $y = 1 + 0.5 \times 1 = 1.5$. Step 2: slope 1.5, so $y = 1.5 + 0.5 \times 1.5 = 2.25$.`,
            },
            {
              type: 'mcq',
              title: 'Halving the step',
              prompt: r`Euler's method gives an error of 0.12 when estimating $y(1)$ with step $h = 0.1$. Roughly what error should you expect with $h = 0.05$?`,
              choices: [
                { t: '0.06', ok: true },
                { t: '0.03', why: 'That would be the behaviour of a method whose error goes like h². Euler’s error is proportional to h.' },
                { t: '0.12', why: 'Smaller steps follow the curve more closely, so the error drops.' },
              ],
              explain: r`Euler's method is **first order**: its total error is roughly proportional to $h$, so halving $h$ halves the error (at twice the work). Runge–Kutta methods have error $\propto h^4$: halving the step makes them 16 times more accurate, which is why they're used in practice.`,
            },
            {
              type: 'numeric',
              title: 'Decay by Euler',
              prompt: r`Use Euler’s method on $\frac{dy}{dt} = -2y$, $y(0) = 1$, with two steps of $h = 0.25$. What value do you get at $t = 0.5$?`,
              answer: 0.25,
              tol: 0.001,
              explain: r`Each step multiplies by $1 - 2h = 0.5$: $1 \to 0.5 \to 0.25$. The exact value is $e^{-1} \approx 0.368$. (With $h = 0.5$ you’d get exactly 0 in one step, and with $h > 1$ the "solution" would oscillate wildly: step size matters.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A new equation',
              prompt: r`Use Euler's method on $\dfrac{dy}{dx} = x + y$ with $y(0) = 1$ and $h = 0.1$. What is $y$ after **two** steps (at $x = 0.2$)?`,
              answer: 1.22,
              tol: 0.002,
              wrong: [{ v: 1.1, tol: 0.002, why: 'That’s after one step. Take another.' }, { v: 1.21, tol: 0.002, why: r`The second slope is $x + y = 0.1 + 1.1 = 1.2$, not 1.1: include $x$.` }],
              explain: r`Step 1: slope $0 + 1 = 1$, so $y = 1 + 0.1(1) = 1.1$ at $x = 0.1$. Step 2: slope $0.1 + 1.1 = 1.2$, so $y = 1.1 + 0.1(1.2) = 1.22$. (The exact answer is about $1.2428$. Smaller steps, or smarter methods like Runge–Kutta, do better.)`,
            },
          ],
          recap: [
            r`Euler's method: $y_{n+1} = y_n + h\,F(x_n, y_n)$.`,
            'Smaller steps are more accurate (the error shrinks roughly in proportion to h).',
            r`On $y' = y$ it gives $(1 + 1/n)^n \to e$.`,
          ],
        },
        {
          id: 'oscillators',
          title: 'Springs & Damping',
          summary: 'Second-order equations',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Newton’s second law is a differential equation',
              body: r`A mass $m$ on a spring with stiffness $k$ feels a force $-kx$. Since $F = ma$ and acceleration is the **second** derivative of position:
$$m\frac{d^2x}{dt^2} = -kx \quad\Rightarrow\quad \frac{d^2x}{dt^2} = -\omega^2 x, \qquad \omega = \sqrt{k/m}$$
Which function's second derivative is minus itself (times a constant)? Sine and cosine! $x = \cos(\omega t)$ has $x'' = -\omega^2\cos(\omega t)$. The mass oscillates forever, with period $T = 2\pi/\omega$.`,
            },
            {
              type: 'numeric',
              title: 'Period of a spring',
              prompt: r`A 1 kg mass hangs on a spring with $k = 16$ N/m. What is its period of oscillation? (2 decimal places.)`,
              unit: 's',
              answer: Math.PI / 2,
              tol: 0.01,
              wrong: [{ v: 4, why: r`That's $\omega = \sqrt{16/1}$ in rad/s. The period is $2\pi/\omega$.` }, { v: 0.39, tol: 0.01, why: r`That's $2\pi/16$: you used $k$ in place of $\omega = \sqrt{k/m} = 4$.` }],
              explain: r`$\omega = \sqrt{16/1} = 4$ rad/s, so $T = \dfrac{2\pi}{4} \approx 1.57$ s.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Adding friction',
              body: r`Real springs lose energy. A damping force proportional to velocity gives
$$x'' + 2\gamma x' + \omega^2 x = 0$$
Here $\omega = 2$. The mass is pulled to $x = 1$ and released. Increase the damping $\gamma$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -1.1, ymax: 1.2, grid: 1, gridY: 0.5, height: 300, axes: { xlabel: 't', ylabel: 'x' },
                params: { g: { min: 0, max: 4, step: 0.1, value: 0.3, label: r`$\gamma$`, color: 'coral', format: (v) => v.toFixed(1) } },
                curves: [{ f: (t, p) => damped(t, p.g, 2), color: 'blue' }],
                readout: (p) => (p.g === 0 ? 'No damping: it oscillates forever.' : p.g < 2 ? r`**Underdamped** ($\gamma < \omega$): oscillations that die away.` : p.g === 2 ? r`**Critically damped** ($\gamma = \omega$): the fastest return without overshooting.` : r`**Overdamped** ($\gamma > \omega$): it creeps back slowly.`),
              },
              after: r`Light damping gives oscillations that shrink. Heavy damping gives a slow, oozing return. Right in between, at $\gamma = \omega$, is **critical damping**: the quickest return to rest without overshooting.`,
            },
            {
              type: 'numeric',
              title: 'Dying away',
              prompt: r`A damped oscillator’s amplitude halves every 3 seconds. What fraction of the starting amplitude remains after 9 seconds?`,
              answer: 0.125,
              tol: 0.001,
              wrong: [{ v: 0.333, tol: 0.01, why: r`It halves three times, not divides by 3.` }],
              explain: r`Three halvings: $\left(\frac12\right)^3 = \frac18 = 0.125$. Exponential decay is the signature of linear damping; a car’s shock absorbers are tuned so the bounce dies away in about one oscillation.`,
            },
            {
              type: 'numeric',
              title: 'Natural frequency',
              prompt: r`A 1 kg mass hangs on a spring with $k = 100$ N/m. Its angular frequency is $\omega = \sqrt{k/m}$. What is its frequency $f = \frac{\omega}{2\pi}$ in hertz? (2 decimal places.)`,
              unit: 'Hz',
              answer: 10 / (2 * Math.PI),
              tol: 0.01,
              explain: r`$\omega = 10$ rad/s, so $f = \frac{10}{2\pi} \approx 1.59$ Hz, about one and a half bounces per second. Quadrupling the mass would halve the frequency.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Shock absorbers',
              prompt: r`A car's shock absorbers should stop the car bouncing after a bump, without making the ride feel stiff and slow to recover. Which damping should engineers aim for?`,
              choices: [
                { t: 'Somewhat less than critical: settle after about one small bounce', ok: true },
                { t: 'Zero damping', why: 'The car would bounce up and down long after every bump.' },
                { t: 'Very heavy overdamping', why: 'The suspension would take a long time to recover, and the ride would feel harsh.' },
                { t: 'Exactly critical damping, never any overshoot', why: 'Close, but in practice a little less damping gives a softer, more comfortable ride while still settling quickly.' },
              ],
              explain: r`Car suspensions are usually tuned **underdamped**, but not by much: the body settles after a small overshoot or so. Full critical damping would feel stiff, and heavy overdamping would leave the car slow to recover from each bump. Worn-out shocks have too little damping, which is why an old car keeps bouncing after a bump.`,
            },
          ],
          recap: [
            r`$x'' = -\omega^2 x$ gives oscillation $x = \cos(\omega t)$, with $\omega = \sqrt{k/m}$.`,
            r`Damping: $x'' + 2\gamma x' + \omega^2 x = 0$.`,
            'Underdamped oscillates and decays. Critical returns fastest. Overdamped creeps back.',
          ],
        },
      ],
    },
    {
      title: 'Seeing Solutions',
      summary: 'Phase portraits and mixing tanks.',
      lessons: [
        {
          id: 'phase',
          title: 'Phase Portraits',
          summary: 'Position and velocity together',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'What do you need to know?',
              prompt: 'A pendulum obeys Newton’s second law. To predict its whole future motion, what do you need to know at the start?',
              choices: [
                { t: 'Its position and its velocity', ok: true },
                { t: 'Just its position', why: 'A pendulum at the bottom could be at rest or swinging fast. You need the velocity too.' },
                { t: 'Its whole past motion', why: 'Newton’s law is second order: position and velocity now are enough to determine everything after.' },
              ],
              explain: r`Newton's second law gives the **acceleration**, so a second-order equation needs two starting numbers: position and velocity. Together they form the **state**. Plotting the state as a point, with position across and velocity up, gives the **phase plane**, and the motion becomes a path through it.`,
            },
            {
              type: 'explain',
              title: 'The phase plane',
              body: r`For a mass on a spring, $x'' = -x$, the solution $x = A\cos t$, $v = -A\sin t$ traces a **circle** in the phase plane: moving right at the top (positive velocity), left at the bottom. Bigger circles mean bigger swings, and every circle takes the same time.

Phase portraits show **all** the solutions of an equation at once, often without solving it. The trick is to look for a quantity that stays constant. For the spring it's the energy $\frac12 v^2 + \frac12 x^2$, so each path stays on a circle of constant energy.`,
            },
            {
              type: 'interactive',
              title: 'The pendulum’s portrait',
              body: r`A pendulum obeys $\theta'' = -\sin\theta$ (in suitable units). Grey curves are paths of constant energy. Drag the starting state (angle $\theta_0$, angular velocity $\omega_0$) and watch the path. Find a start that sends the pendulum **over the top**.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 4, ymin: -3.2, ymax: 3.2, grid: false, height: 340, axes: { xlabel: 'θ', ylabel: 'ω', xticks: Math.PI / 2, yticks: 1, xfmt: (v) => ['−π', '−π/2', '0', 'π/2', 'π'][Math.round(v / (Math.PI / 2)) + 2] ?? '' },
                params: { th: { min: -3.1, max: 3.1, step: 0.01, value: 1, slider: false }, w: { min: -3, max: 3, step: 0.01, value: 0, slider: false } },
                curves: [
                  ...[-0.8, -0.4, 0.2, 0.6, 1.5, 2.2].flatMap((E) => [1, -1].map((sg) => ({ f: (x) => { const q = 2 * (E + Math.cos(x)); return q >= 0 ? sg * Math.sqrt(q) : NaN; }, color: 'muted', width: 1, n: 400 }))),
                  { f: (x) => 2 * Math.cos(x / 2), from: -Math.PI, to: Math.PI, color: 'violet', width: 2, dash: true },
                  { f: (x) => -2 * Math.cos(x / 2), from: -Math.PI, to: Math.PI, color: 'violet', width: 2, dash: true },
                ],
                extra: ({ plot, p, s }) => [s('path', { d: pendulumPath(p.th, p.w).map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 })],
                points: [{ x: (p) => p.th, y: (p) => p.w, drag: { x: 'th', y: 'w' }, color: 'coral' }],
                readout: (p) => { const E = pendE(p.th, p.w); return Math.abs(E - 1) < 0.01 ? 'Exactly on the dividing line: it creeps up towards the top and balances there.' : E < 1 ? `Energy ${E.toFixed(2)} < 1: it **swings** back and forth.` : `Energy ${E.toFixed(2)} > 1: it goes **over the top**, round and round.`; },
                goal: (p) => pendE(p.th, p.w) > 1.01,
                hint: 'Start at the bottom (θ = 0) and give it a big push: drag the point straight up.',
                solution: { th: 0, w: 2.4 },
              },
              explain: r`With energy $\frac12\omega^2 - \cos\theta$ below 1, the path is a closed loop: the pendulum swings. Above 1, it never turns back: it whirls over the top. The dashed violet **separatrix** divides the two behaviours; on it, the pendulum takes forever to approach the upside-down balance point.`,
            },
            {
              type: 'numeric',
              title: 'Over the top',
              prompt: r`The energy $E = \frac12\omega^2 - \cos\theta$ is constant. Starting at the bottom ($\theta = 0$), what is the smallest $\omega_0$ that just reaches the top ($\theta = \pi$, $\omega = 0$)?`,
              answer: 2,
              wrong: [{ v: Math.sqrt(2), tol: 0.01, why: r`At the top $E = 0 - \cos\pi = 1$. At the bottom $E = \frac12\omega_0^2 - 1$. Set them equal.` }, { v: 4, why: r`$\frac12\omega_0^2 = 2$ gives $\omega_0^2 = 4$, so $\omega_0 = 2$.` }],
              hint: r`At the top: $E = -\cos\pi = 1$. At the bottom: $E = \frac12\omega_0^2 - 1$.`,
              explain: r`$\frac12\omega_0^2 - 1 = 1$, so $\omega_0 = 2$. In everyday units the condition is $v^2 = 4gL$: a 1 m pendulum needs a speed of about 6.3 m/s at the bottom, exactly the energy to rise 2 m.`,
            },
            {
              type: 'mcq',
              title: 'Small and large swings',
              prompt: r`Near the bottom, the closed loops are almost perfect ellipses, like the spring's circles. What does that tell us about small swings?`,
              choices: [
                { t: r`For small angles $\sin\theta \approx \theta$, so the pendulum behaves like a spring, with a period that doesn't depend on the size of the swing`, ok: true },
                { t: 'Small swings are impossible', why: 'The small loops around the centre are perfectly good motions: gentle swings.' },
                { t: 'Small swings take longer than big ones', why: 'Near the bottom the period is nearly constant. It’s the big swings, near the separatrix, that take longer.' },
              ],
              explain: r`For small $\theta$, $\sin\theta \approx \theta$, so $\theta'' \approx -\theta$: the spring equation, with the same period for every small swing. That's why Galileo found pendulums keep good time. But big swings, whose loops approach the separatrix, take noticeably longer, so pendulum clocks are built to swing only a few degrees.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Adding friction',
              prompt: 'Now add a little air resistance. What happens to the paths in the phase plane?',
              choices: [
                { t: 'They spiral inwards towards the point θ = 0, ω = 0', ok: true },
                { t: 'They stay on the same closed loops', why: 'Friction drains energy, so the path can’t stay on one energy level.' },
                { t: 'They spiral outwards', why: 'That would need energy to be added, like pushing a swing.' },
              ],
              explain: r`Friction steadily drains energy, so the path drifts inwards across the energy curves, spiralling into the resting state at the bottom, a **stable equilibrium**. The upside-down state is an **unstable equilibrium**: paths approach it along some directions but are flung away along others. Classifying equilibria like this is the heart of the qualitative theory of differential equations, begun by Henri Poincaré in the 1880s.`,
            },
          ],
          recap: [
            'The phase plane plots velocity against position: each solution is a path.',
            'Conserved energy makes paths follow energy curves: loops for swings, open curves for whirling.',
            'The separatrix divides behaviours; friction makes paths spiral into a stable equilibrium.',
          ],
        },
        {
          id: 'mixing',
          title: 'Tanks and Mixing',
          summary: 'In, out, and the approach to balance',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Salt flowing in',
              prompt: r`Brine containing 2 grams of salt per litre flows into a tank at 5 litres per minute. How many grams of salt enter per minute?`,
              unit: 'g/min',
              answer: 10,
              wrong: [{ v: 2.5, why: 'Multiply, don’t divide: 5 litres each carrying 2 g.' }],
              explain: r`$5 \text{ L/min} \times 2 \text{ g/L} = 10$ g/min. Flow rate times concentration gives the rate at which stuff arrives.`,
            },
            {
              type: 'explain',
              title: 'Building the equation',
              body: r`A 100 L tank starts with pure water. Brine (2 g/L) flows in at $r$ L/min, the tank is stirred, and the mixture drains at the same rate. If $S(t)$ is the salt in the tank, then

$$\frac{dS}{dt} = \underbrace{2r}_{\text{in}} - \underbrace{r \cdot \frac{S}{100}}_{\text{out}}.$$

Salt leaves at the tank's **current** concentration, $\frac{S}{100}$. The solution climbs towards the balance where in = out, at $S = 200$ g (concentration 2 g/L):
$$S(t) = 200\left(1 - e^{-rt/100}\right).$$
The quantity $\frac{100}{r}$ (volume ÷ flow rate) is the **time constant**: how long it takes to replace one tankful.`,
            },
            {
              type: 'interactive',
              title: 'Fill it fast enough',
              body: r`The graph shows the concentration in the tank over an hour. Choose the flow rate so that the tank reaches **90%** of the incoming concentration (1.8 g/L) within **30 minutes**, using as little brine as possible.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 2.2, grid: false, height: 300, padL: 46, axes: { xlabel: 'minutes', ylabel: 'g/L', xticks: 10, yticks: 0.5 },
                params: { r: { min: 1, max: 15, step: 0.1, value: 4, label: 'flow rate', color: 'blue', format: (v) => `${v.toFixed(1)} L/min` } },
                curves: [{ f: (t, p) => 2 * (1 - Math.exp((-p.r * t) / 100)), color: 'blue', width: 3 }, { f: () => 1.8, color: 'muted', dash: true }, { f: () => 2, color: 'teal', dash: true }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(30), x2: plot.X(30), y1: plot.Y(0), y2: plot.Y(2.2), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }), s('circle', { cx: plot.X(30), cy: plot.Y(2 * (1 - Math.exp((-p.r * 30) / 100))), r: 6, class: 'fl-coral' })],
                readout: (p) => { const c = 2 * (1 - Math.exp((-p.r * 30) / 100)); return `At 30 minutes: **${c.toFixed(2)} g/L** (${Math.round(50 * c)}% of the way)`; },
                goal: (p) => 2 * (1 - Math.exp((-p.r * 30) / 100)) >= 1.8 && p.r <= 8,
                hint: r`You need $e^{-30r/100} \le 0.1$, so $30r/100 \ge \ln 10 \approx 2.3$.`,
                solution: { r: 7.7 },
              },
              explain: r`Reaching 90% needs $e^{-30r/100} = 0.1$, so $r = \frac{100 \ln 10}{30} \approx 7.7$ L/min. Notice that in 30 minutes you pour in 230 litres, more than two tankfuls, because the outflow keeps carrying away salt you've just added.`,
            },
            {
              type: 'numeric',
              title: 'One time constant',
              prompt: r`With a flow of 5 L/min into the 100 L tank, the time constant is 20 minutes. What percentage of the final concentration has been reached after 20 minutes?`,
              unit: '%',
              answer: 100 * (1 - Math.exp(-1)),
              tol: 0.5,
              wrong: [{ v: 50, why: r`It's not halfway: $1 - e^{-1} \approx 0.632$.` }, { v: 100, why: 'The approach is exponential: it never quite gets there.' }],
              explain: r`$1 - e^{-1} \approx 63\%$. After 2 time constants, 86%; after 3, 95%; after 5, 99.3%. The same rule applies to a charging capacitor, a cooling cup of tea and a drug building up in the bloodstream: all are "fill towards a balance" equations.`,
            },
            {
              type: 'mcq',
              title: 'A steady drip',
              prompt: r`A drug is given by continuous drip at 10 mg/hour, and the body removes 20% of the drug present per hour: $\frac{dA}{dt} = 10 - 0.2A$. What happens to the amount in the body?`,
              choices: [
                { t: 'It levels off at 50 mg, where intake equals removal', ok: true },
                { t: 'It keeps rising forever', why: 'Removal grows as the amount grows, so eventually it matches the intake.' },
                { t: 'It levels off at 10 mg', why: r`At balance $10 = 0.2A$, so $A = 50$ mg.` },
              ],
              explain: r`Balance when $10 = 0.2A$: $A = 50$ mg, approached with time constant $\frac{1}{0.2} = 5$ hours. Doctors use exactly this model to choose drip rates and to know how long until a drug reaches a steady level (about 4 to 5 time constants).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Cleaning a lake',
              body: r`A polluted lake holds 50 km³ of water. Clean river water flows in, and lake water flows out, at 10 km³ per year, and the lake stays well mixed. All pollution stops today.`,
              prompt: 'How many years until the pollution falls to 10% of today’s level? (1 decimal place.)',
              unit: 'years',
              answer: 5 * Math.log(10),
              tol: 0.1,
              wrong: [{ v: 4.5, tol: 0.1, why: 'The pollutant doesn’t drain out at a constant rate: as it gets diluted, less leaves each year.' }, { v: 5, why: r`That's one time constant, which leaves $e^{-1} \approx 37\%$. You need $e^{-t/5} = 0.1$.` }],
              hint: r`The time constant is $\frac{50}{10} = 5$ years, and the amount falls like $e^{-t/5}$.`,
              explain: r`$e^{-t/5} = 0.1$ gives $t = 5 \ln 10 \approx 11.5$ years, more than twice the time to replace the lake's water once. Real lakes are worse: they aren't well mixed, and pollutants settle into the mud. Lake Superior's water takes about 190 years to replace.`,
            },
          ],
          recap: [
            r`Rate of change = rate in − rate out; outflow carries the current concentration.`,
            r`The solution approaches balance exponentially, with time constant (volume ÷ flow).`,
            'After one time constant 63% of the way; after about five, essentially there.',
          ],
        },
      ],
    },
  ],
};
