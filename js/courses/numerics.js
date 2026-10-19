import { fix, sig } from '../lib/svg.js';

const r = String.raw;
const f = (x) => x * x - 2;
const bisect = (k) => {
  let a = 1, b = 2;
  const out = [[a, b]];
  for (let i = 0; i < k; i++) {
    const m = (a + b) / 2;
    if (f(m) > 0) b = m;
    else a = m;
    out.push([a, b]);
  }
  return out;
};
const newton = (x0, k) => {
  const xs = [x0];
  for (let i = 0; i < k; i++) xs.push(xs[i] - f(xs[i]) / (2 * xs[i]));
  return xs;
};
const sci = (e) => {
  if (e >= 0.001) return e.toFixed(4);
  const [m, ex] = e.toExponential(1).split('e');
  return `${m} \\times 10^{${Number(ex)}}`;
};
const trap = (n) => {
  let s = 0;
  for (let k = 0; k <= n; k++) s += (k === 0 || k === n ? 0.5 : 1) * Math.sin((k * Math.PI) / n);
  return (s * Math.PI) / n;
};

const simpson = (n) => { const h = Math.PI / n; let s = 0; for (let k = 0; k <= n; k++) s += (k === 0 || k === n ? 1 : k % 2 ? 4 : 2) * Math.sin(k * h); return (s * h) / 3; };
const newtonAtan = (x0, k) => { const xs = [x0]; for (let i = 0; i < k; i++) { const x = xs[i]; xs.push(x - Math.atan(x) * (1 + x * x)); } return xs; };
// seeded random numbers
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const DARTS = (() => { const R = rng(2024); return Array.from({ length: 20000 }, () => [R() * 2 - 1, R() * 2 - 1]); })();
const runge = (x) => 1 / (1 + 25 * x * x);
const nodes = (n, cheb) => Array.from({ length: n }, (_, i) => (cheb ? Math.cos(((2 * i + 1) * Math.PI) / (2 * n)) : -1 + (2 * i) / (n - 1)));
const lagrange = (xs, x) => xs.reduce((sum, xi, i) => sum + runge(xi) * xs.reduce((L, xj, j) => (j === i ? L : (L * (x - xj)) / (xi - xj)), 1), 0);
const maxErr = (n, cheb) => { const xs = nodes(n, cheb); let m = 0; for (let k = 0; k <= 400; k++) { const x = -1 + k / 200; m = Math.max(m, Math.abs(lagrange(xs, x) - runge(x))); } return m; };

// x'' = -x as x' = v, v' = -x, from (1, 0), steps of h = 0.2: Euler and midpoint
const SPRING_STEPS = (() => {
  const h = 0.2, E = [[1, 0]], M = [[1, 0]];
  for (let n = 0; n < 48; n++) {
    const [x, v] = E[n];
    E.push([x + h * v, v - h * x]);
    const [a, b] = M[n], am = a + (h / 2) * b, bm = b - (h / 2) * a;
    M.push([a + h * bm, b - h * am]);
  }
  return { h, E, M };
})();

export default {
  id: 'numerics',
  subject: 'math',
  title: 'Numerical Methods',
  level: 'Advanced',
  cover: 'numerics',
  tagline: 'How computers find roots, compute integrals, use randomness, fit curves, and sometimes get arithmetic wrong.',
  description: r`Most equations can't be solved with a neat formula, so computers approximate. Squeeze a root with bisection, race towards it with Newton's method, add up areas with trapezoids and parabolas, estimate π by throwing random darts, fit curves through data (and see how that can go wrong), and discover why $0.1 + 0.2$ isn't exactly $0.3$ on a computer, and how such tiny errors have had real consequences.`,
  prereq: 'Calculus: Integrals',
  chapters: [
    {
      title: 'Finding Roots',
      summary: 'Solving equations by approximation.',
      lessons: [
        {
          id: 'bisection',
          title: 'Bisection',
          summary: 'Trap the root and halve',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Squeeze it',
              body: r`To solve $x^2 = 2$, look for a root of $f(x) = x^2 - 2$. Since $f(1) = -1 < 0$ and $f(2) = 2 > 0$, and $f$ is continuous, a root must lie between 1 and 2.

**Bisection**: check the midpoint. Whichever half still has a sign change contains the root; keep that half and repeat. Each step halves the interval.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Halving the interval',
              body: r`Step through the bisection of $x^2 - 2$ on $[1, 2]$.`,
              widget: {
                kind: 'graph', xmin: 0.9, xmax: 2.1, ymin: -1.4, ymax: 2.2, grid: 0.25, gridY: 1, height: 300, axes: { xAt: 0.9, xfmt: (v) => v.toFixed(2) },
                params: { k: { min: 0, max: 8, step: 1, value: 0, label: 'steps', color: 'teal' } },
                curves: [{ f, color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const iv = bisect(p.k), els = [];
                  iv.forEach(([a, b], i) => {
                    const y = -0.55 - i * 0.09, last = i === iv.length - 1; // below the tick numbers
                    els.push(s('line', { x1: plot.X(a), x2: plot.X(b), y1: plot.Y(y), y2: plot.Y(y), stroke: last ? 'var(--coral)' : 'var(--ink-3)', 'stroke-width': last ? 5 : 3, 'stroke-linecap': 'round' }));
                  });
                  const [a, b] = iv[iv.length - 1];
                  els.push(s('line', { x1: plot.X(a), x2: plot.X(a), y1: plot.Y(f(a)), y2: plot.Y(0), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  els.push(s('line', { x1: plot.X(b), x2: plot.X(b), y1: plot.Y(f(b)), y2: plot.Y(0), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  return els;
                },
                readout: (p) => {
                  const [a, b] = bisect(p.k)[p.k];
                  return r`root in $[${fix(a, 4)}, ${fix(b, 4)}]$, width $${sig(b - a, 3)}$`;
                },
              },
              after: r`After 8 steps the root is trapped in $[1.4140625, 1.41796875]$, and $\sqrt2 = 1.41421\ldots$ is indeed inside. Bisection is slow but **guaranteed**: as long as you start with a sign change, it can't fail.`,
            },
            {
              type: 'numeric',
              title: 'How many steps?',
              prompt: r`Starting with an interval of width 1, how many bisection steps are needed to make the width smaller than 0.001?`,
              unit: 'steps',
              answer: 10,
              wrong: [{ v: 1000, why: 'Each step halves the width, so it shrinks like 2⁻ⁿ. You need 2ⁿ > 1000.' }, { v: 9, why: r`$2^{-9} = \frac{1}{512} \approx 0.00195$: not small enough yet.` }],
              explain: r`$2^{-10} = \frac{1}{1024} < 0.001$, so **10 steps**. Every 10 steps gains about 3 decimal digits.`,
            },
            {
              type: 'mcq',
              title: 'When bisection can’t start',
              prompt: r`Can bisection find the root of $f(x) = (x - 1)^2$, which touches zero at $x = 1$ without crossing?`,
              choices: [
                { t: 'No: f is never negative, so there’s no sign change to trap', ok: true },
                { t: 'Yes, starting from [0, 2]', why: r`$f(0) = 1$ and $f(2) = 1$ are both positive: no sign change, so bisection has nothing to work with.` },
                { t: 'Yes, but slowly', why: 'Bisection needs a sign change to keep halving towards. Here there is none.' },
              ],
              explain: r`Bisection needs $f(a)$ and $f(b)$ of opposite signs. A root where the graph just touches zero (a **double root**) never changes sign, so bisection can't even begin. Newton's method can still find it, though more slowly than usual.`,
            },
            {
              type: 'numeric',
              title: 'Three midpoints',
              prompt: r`Bisection on $f(x) = x^2 - 2$ starts with $[1, 2]$. The first midpoint, 1.5, gives $f > 0$, so the root is in $[1, 1.5]$; the second, 1.25, gives $f < 0$, so it’s in $[1.25, 1.5]$. What is the third midpoint?`,
              answer: 1.375,
              tol: 0.0001,
              explain: r`$\frac{1.25 + 1.5}{2} = 1.375$, and $1.375^2 = 1.89 < 2$, so the root ($\sqrt2 \approx 1.414$) is in $[1.375, 1.5]$. Each step gains one binary digit of accuracy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Six decimal places',
              prompt: r`Starting from an interval of width 1, how many bisection steps make the width smaller than $10^{-6}$?`,
              unit: 'steps',
              answer: 20,
              wrong: [{ v: 6, why: r`Each step only halves the width. You need $2^n > 10^6$.` }, { v: 19, why: r`$2^{19} = 524{,}288 < 10^6$. One more step.` }],
              hint: r`$2^{10} \approx 1000$, so $2^{20} \approx 10^6$.`,
              explain: r`$2^{20} = 1{,}048{,}576 > 10^6$, so 20 steps. Bisection always gains about 1 decimal digit every 3.3 steps, no matter how nice the function is. Newton's method from a good start would need just 3 or 4.`,
            },
          ],
          recap: [
            'If a continuous function changes sign on an interval, a root lies inside.',
            'Bisection halves the interval each step; it always works but is slow.',
            r`After $n$ steps the width is $2^{-n}$ of the original.`,
          ],
        },
        {
          id: 'newton',
          title: 'Newton’s Method',
          summary: 'Ride the tangent',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Follow the tangent line',
              body: r`From a guess $x_n$, draw the tangent line to $f$ and see where it hits zero. That's the next guess:
$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$$
For $f(x) = x^2 - 2$, with $f'(x) = 2x$, this becomes $x_{n+1} = \frac12\left(x_n + \frac{2}{x_n}\right)$: "average your guess with 2 divided by your guess". This square-root recipe was known in antiquity and is often called Heron's method.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Tangent steps',
              body: r`Start at $x_0 = 3$ and take Newton steps.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3.4, ymin: -2.5, ymax: 8, grid: 0.5, gridY: 2, height: 300,
                params: { k: { min: 0, max: 4, step: 1, value: 0, label: 'steps', color: 'coral' } },
                curves: [{ f, color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const xs = newton(3, p.k), els = [];
                  for (let i = 0; i < p.k; i++) {
                    const x = xs[i], nx = xs[i + 1];
                    els.push(s('line', { x1: plot.X(x), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(f(x)), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                    els.push(s('line', { x1: plot.X(x), y1: plot.Y(f(x)), x2: plot.X(nx), y2: plot.Y(0), stroke: 'var(--coral)', 'stroke-width': 2.5 }));
                  }
                  xs.forEach((x, i) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(0), r: i === xs.length - 1 ? 7 : 4, class: i === xs.length - 1 ? 'fl-coral' : 'fl-ink' })));
                  return els;
                },
                readout: (p) => {
                  const x = newton(3, p.k)[p.k];
                  return r`$x_{${p.k}} = ${x.toFixed(10)}$, $\;$ error $${sci(Math.abs(x - Math.SQRT2))}$`;
                },
              },
              after: r`The errors go roughly 1.6, 0.42, 0.048, 0.0008, 0.0000002: once close, the number of correct digits roughly **doubles** each step. This is called **quadratic convergence**, and it's why calculators and computers use Newton-style methods for square roots and much more.`,
            },
            {
              type: 'numeric',
              title: 'One step by hand',
              prompt: r`Using $x_{n+1} = \frac12\left(x_n + \frac{2}{x_n}\right)$, compute the next guess after $x_n = 1.5$. (5 decimal places.)`,
              answer: 17 / 12,
              tol: 0.000006,
              wrong: [{ v: 1.75, tol: 0.0001, why: r`Compute $\frac{2}{1.5} = 1.3333$ first, then average it with 1.5.` }],
              explain: r`$\frac12\left(1.5 + 1.33333\right) = 1.41667$. One more step gives $1.4142157$, already correct to 5 decimal places.`,
            },
            {
              type: 'interactive',
              title: 'Overshoot',
              body: r`Newton's method on $f(x) = \arctan x$, whose only root is $x = 0$. Drag the starting point $x_0$ and watch the first few tangent steps. Find a start from which the method **runs away** instead of converging.`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 6, ymin: -1.8, ymax: 1.8, grid: false, height: 300, axes: { xticks: 1, yticks: 1 },
                params: { x0: { min: -2.5, max: 2.5, step: 0.01, value: 1, slider: false } },
                curves: [{ f: (x) => Math.atan(x), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.x0, y: () => 0, drag: { x: 'x0' }, color: 'coral' }],
                extra: ({ plot, p, s }) => {
                  const xs = newtonAtan(p.x0, 4), els = [];
                  for (let i = 0; i < 4; i++) {
                    const x = xs[i], nx = xs[i + 1];
                    if (Math.abs(x) > 50) break;
                    els.push(s('line', { x1: plot.X(x), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(Math.atan(x)), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                    els.push(s('line', { x1: plot.X(x), y1: plot.Y(Math.atan(x)), x2: plot.X(Math.max(-60, Math.min(60, nx))), y2: plot.Y(0), stroke: 'var(--coral)', 'stroke-width': 2 }));
                  }
                  return els;
                },
                readout: (p) => { const xs = newtonAtan(p.x0, 6); const fmt = (v) => (Math.abs(v) > 1e4 ? v.toExponential(1) : v.toFixed(3)); return `$x_0 = ${p.x0.toFixed(2)}$ → ${xs.slice(1, 5).map(fmt).join(', ')}${Math.abs(xs[6]) > 10 ? ' · **running away!**' : Math.abs(xs[6]) < 1e-3 ? ' · converging to 0' : ''}`; },
                goal: (p) => Math.abs(newtonAtan(p.x0, 6)[6]) > 10,
                hint: 'Starts close to 0 converge. Try starting further out, beyond about 1.4.',
                solution: { x0: 1.6 },
              },
              explain: r`For $|x_0|$ beyond about $1.39$, the curve is so flat that each tangent line overshoots to the other side, further out than before, and the guesses grow explosively. Closer in, Newton converges beautifully. Newton's method is only **locally** convergent: it needs a good enough first guess.`,
            },
            {
              type: 'numeric',
              title: 'Cube root of 10',
              prompt: r`Use one Newton step on $f(x) = x^3 - 10$ (so $f'(x) = 3x^2$), starting from $x_0 = 2$. What is $x_1$? (4 decimal places.)`,
              answer: 2 - (8 - 10) / 12,
              tol: 0.0001,
              wrong: [{ v: 2 - (8 - 10) / 6, tol: 0.0002, why: r`$f'(2) = 3 \times 2^2 = 12$, not 6.` }, { v: 2 - (8 - 10) / 12 - 2 * 0.1667, tol: 0.001, why: r`$x_1 = 2 - \frac{f(2)}{f'(2)} = 2 - \frac{-2}{12}$: subtracting a negative adds.` }],
              explain: r`$x_1 = 2 - \frac{8 - 10}{12} = 2 + \frac16 \approx 2.1667$. The true cube root is $2.15443\ldots$, and one more step gives $2.15450$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'When Newton fails',
              prompt: r`Newton's method on $f(x) = x^3 - 2x + 2$, starting at $x_0 = 0$, gives $x_1 = 1$, then $x_2 = 0$, then $x_3 = 1$, … What's happening?`,
              choices: [
                { t: 'It’s stuck in a cycle: the tangent from each point leads back to the other, never approaching the root', ok: true },
                { t: 'It’s converging slowly', why: 'It alternates between exactly 0 and 1 forever. Neither is a root, and it gets no closer.' },
                { t: 'The function has no root', why: r`It does have one real root, near $x \approx -1.77$. Newton's method just can't reach it from here.` },
              ],
              explain: r`Newton's method is fast **when it works**, but it has no guarantee: a bad starting point can cycle, wander off, or hit a point where $f' = 0$. Practical solvers often combine the two ideas: bisection's safety with Newton's speed.`,
            },
          ],
          recap: [
            r`Newton: $x_{n+1} = x_n - f(x_n)/f'(x_n)$, using the tangent line.`,
            'Near a root, correct digits roughly double each step (quadratic convergence).',
            'Bad starting points can make Newton’s method cycle or fail.',
          ],
        },
      ],
    },
    {
      title: 'Approximations Everywhere',
      summary: 'Integrals and computer arithmetic.',
      lessons: [
        {
          id: 'trapezoid',
          title: 'Numerical Integration',
          summary: 'Trapezoids and Simpson',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Trapezoids',
              body: r`Many integrals have no formula, so we add up simple shapes. The **trapezoidal rule** splits $[a, b]$ into $n$ strips of width $h$ and replaces the curve on each strip with a straight line:
$$\int_a^b f(x)\,dx \approx h\left(\tfrac12 f(x_0) + f(x_1) + \dots + f(x_{n-1}) + \tfrac12 f(x_n)\right)$$
Doubling $n$ makes the error about **4 times** smaller.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How many strips?',
              prompt: r`The exact value of $\int_0^\pi \sin x\,dx$ is 2. Find the **fewest** strips for which the trapezoidal estimate is within 0.01 of the exact value.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: Math.PI, ymin: 0, ymax: 1.15, grid: false, height: 280, axes: { xticks: Math.PI / 4, xfmt: (v) => ['0', 'π/4', 'π/2', '3π/4', 'π'][Math.round(v / (Math.PI / 4))] ?? '' },
                params: { n: { min: 1, max: 20, step: 1, value: 2, label: 'strips', color: 'teal' } },
                curves: [{ f: (x) => Math.sin(x), color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const els = [], h = Math.PI / p.n;
                  for (let k = 0; k < p.n; k++) {
                    const x0 = k * h, x1 = (k + 1) * h;
                    els.push(s('path', { d: `M${plot.X(x0)} ${plot.Y(0)} L${plot.X(x0)} ${plot.Y(Math.sin(x0))} L${plot.X(x1)} ${plot.Y(Math.sin(x1))} L${plot.X(x1)} ${plot.Y(0)} Z`, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 1.5, opacity: 0.85 }));
                  }
                  return els;
                },
                readout: (p) => r`estimate $${trap(p.n).toFixed(5)}$, $\;$ error $${(2 - trap(p.n)).toFixed(5)}$`,
                goal: (p) => p.n === 13,
                hint: 'The error must drop below 0.01. Check 12 and 13 strips.',
                solution: { n: 13 },
              },
              explain: r`With 12 strips the error is about 0.0114; with **13** it's 0.0097. The trapezoids always sit below this curve (it bends downwards), so the estimate is always a little too small.`,
            },
            {
              type: 'numeric',
              title: 'Simpson’s rule',
              prompt: r`**Simpson's rule** fits parabolas instead of straight lines: with two strips of width $h$, $\int_a^b f \approx \frac{h}{3}\big(f(x_0) + 4f(x_1) + f(x_2)\big)$. Use it for $\int_0^2 x^2\,dx$ with $h = 1$. (3 decimal places.)`,
              answer: 8 / 3,
              tol: 0.0006,
              wrong: [{ v: 3, why: 'That’s the trapezoidal rule. Simpson uses weights 1, 4, 1 and the factor h/3.' }],
              explain: r`$\frac13(0 + 4 \times 1 + 4) = \frac83 \approx 2.667$: exactly right, because Simpson's rule fits parabolas, and $x^2$ **is** a parabola. Remarkably, it's exact for cubics too. The trapezoidal rule with the same points gives 3.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Trapezoids versus Simpson',
              body: r`Compare the errors of the two rules on $\int_0^\pi \sin x\,dx = 2$ as the number of strips grows (Simpson needs an even number).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: false, axes: false, height: 120, pad: 10,
                params: { n: { min: 2, max: 40, step: 2, value: 4, label: 'strips', color: 'teal' } },
                extra: ({ plot, p, s }) => [
                  s('text', { x: plot.X(0.27), y: plot.Y(0.62), class: 'lbl', 'text-anchor': 'middle', text: 'Trapezoids' }),
                  s('text', { x: plot.X(0.27), y: plot.Y(0.22), class: 'lbl', 'text-anchor': 'middle', style: 'font-size:22px', text: Math.abs(2 - trap(p.n)).toExponential(2) }),
                  s('text', { x: plot.X(0.73), y: plot.Y(0.62), class: 'lbl', 'text-anchor': 'middle', text: 'Simpson' }),
                  s('text', { x: plot.X(0.73), y: plot.Y(0.22), class: 'lbl', 'text-anchor': 'middle', style: 'font-size:22px', text: Math.abs(2 - simpson(p.n)).toExponential(2) }),
                ],
                readout: (p) => `Errors with ${p.n} strips. Doubling the strips divides the trapezoid error by about 4, and Simpson's by about 16.`,
              },
              after: r`The trapezoid error shrinks like $\frac{1}{n^2}$, Simpson's like $\frac{1}{n^4}$. With 40 strips, Simpson is accurate to about 7 digits, while trapezoids manage 3. Choosing a smarter method beats brute force.`,
            },
            {
              type: 'numeric',
              title: 'Two trapezoids',
              prompt: r`Estimate $\int_0^1 x^2\,dx$ with the trapezoid rule using 2 strips ($h = 0.5$): $\frac{h}{2}\left[f(0) + 2f(0.5) + f(1)\right]$.`,
              answer: 0.375,
              tol: 0.0001,
              explain: r`$\frac{0.5}{2}(0 + 0.5 + 1) = 0.375$, versus the exact $\frac13$. Trapezoids overestimate here because the curve sags below the straight tops. Simpson’s rule gets $\frac13$ exactly.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Simpson on a sine',
              prompt: r`Apply Simpson's rule with just 2 strips ($h = \frac\pi2$) to $\int_0^\pi \sin x\,dx$. (3 decimal places.)`,
              answer: (Math.PI / 6) * 4,
              tol: 0.001,
              wrong: [{ v: Math.PI / 2, tol: 0.001, why: r`That's the trapezoidal rule. Simpson: $\frac{h}{3}\left(f(0) + 4f(\frac\pi2) + f(\pi)\right)$.` }, { v: 2, why: 'That’s the exact value. Simpson’s 2-strip estimate is close, but not exact.' }],
              hint: r`$\frac{h}{3}(0 + 4 \times 1 + 0)$ with $h = \frac{\pi}{2}$.`,
              explain: r`$\frac{\pi/2}{3} \times 4 = \frac{2\pi}{3} \approx 2.094$, off by only 0.094 using just three points. The trapezoidal rule with the same points gives $\frac{\pi}{2} \approx 1.571$, off by 0.43.`,
            },
          ],
          recap: [
            'The trapezoidal rule approximates a curve with straight segments.',
            'Its error shrinks by about 4× each time the number of strips doubles.',
            'Simpson’s rule uses parabolas and is far more accurate for smooth functions.',
          ],
        },
        {
          id: 'floating',
          title: 'Computer Arithmetic',
          summary: 'Why 0.1 + 0.2 ≠ 0.3',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Binary fractions',
              body: r`Computers store numbers in binary **floating point**: a binary fraction times a power of 2, with about 16 significant decimal digits.

But many simple decimals have no exact binary form. Just as $\frac13 = 0.333\ldots$ never ends in decimal, $0.1$ in binary is $0.000110011001100\ldots$, repeating forever. The computer stores the nearest value it can, very slightly off. So in most programming languages, adding $0.1 + 0.2$ gives $0.30000000000000004$.`,
            },
            {
              type: 'mcq',
              title: 'Checking equality',
              prompt: r`A program tests whether $a + b = 0.3$ exactly, with $a = 0.1$ and $b = 0.2$, and finds that it's false. What's the safer way to compare?`,
              choices: [
                { t: 'Check whether the difference is tiny: |a + b − 0.3| < 10⁻⁹', ok: true },
                { t: 'Use a stricter equality test', why: 'Any exact equality test compares the stored binary values, which differ slightly.' },
                { t: 'Convert both to text and compare the strings', why: 'That depends on how many digits get printed, and it hides the real issue. Compare with a tolerance.' },
              ],
              explain: r`Floating-point numbers should be compared with a **tolerance**. (Money is usually stored as whole numbers of cents for exactly this reason.)`,
            },
            {
              type: 'interactive',
              title: 'Catastrophic cancellation',
              body: r`For small $x$, $\dfrac{1 - \cos x}{x^2}$ should be very close to $\frac12$. Shrink $x$ and compare the computer's answer for this formula with the equivalent formula $\dfrac{2\sin^2(x/2)}{x^2}$. Find an $x$ where the first formula gives a completely wrong answer.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: false, axes: false, height: 120, pad: 10,
                params: { k: { min: 1, max: 10, step: 0.5, value: 2, label: 'x', color: 'coral', format: (v) => `$10^{-${fix(v, 1)}}$` } },
                extra: ({ plot, p, s }) => {
                  const x = 10 ** -p.k, a = (1 - Math.cos(x)) / (x * x), b = (2 * Math.sin(x / 2) ** 2) / (x * x);
                  return [
                    s('text', { x: plot.X(0.27), y: plot.Y(0.62), class: 'lbl', 'text-anchor': 'middle', text: '(1 − cos x)/x²' }),
                    s('text', { x: plot.X(0.27), y: plot.Y(0.2), class: 'lbl', 'text-anchor': 'middle', style: 'font-size:22px', text: a.toFixed(10) }),
                    s('text', { x: plot.X(0.73), y: plot.Y(0.62), class: 'lbl', 'text-anchor': 'middle', text: '2 sin²(x/2)/x²' }),
                    s('text', { x: plot.X(0.73), y: plot.Y(0.2), class: 'lbl', 'text-anchor': 'middle', style: 'font-size:22px', text: b.toFixed(10) }),
                  ];
                },
                readout: (p) => { const x = 10 ** -p.k, a = (1 - Math.cos(x)) / (x * x); return Math.abs(a - 0.5) > 0.1 ? 'The first formula has lost **all** its accuracy.' : Math.abs(a - 0.5) > 1e-6 ? 'The first formula is starting to go wrong.' : 'Both agree.'; },
                goal: (p) => Math.abs((1 - Math.cos(10 ** -p.k)) / 10 ** (-2 * p.k) - 0.5) > 0.1,
                hint: 'Keep shrinking x. Below about 10⁻⁸, cos x rounds to exactly 1.',
                solution: { k: 8 },
              },
              explain: r`When $x$ is tiny, $\cos x$ is so close to 1 that it rounds to exactly $1$ in floating point, and $1 - \cos x$ becomes 0: all its significant digits **cancel**. The second formula never subtracts nearly equal numbers, so it stays accurate. Rearranging formulas to avoid such subtractions is a basic skill of numerical programming.`,
            },
            {
              type: 'mcq',
              title: 'Order matters',
              prompt: r`A computer adds one million copies of $10^{-16}$ to the number $1$, one at a time, rounding after each addition. What does it get?`,
              choices: [
                { t: 'Exactly 1: each tiny addition is rounded away', ok: true },
                { t: r`$1.0000000001$`, why: r`That's the true answer, but $1 + 10^{-16}$ rounds back to 1 every time, since doubles only hold about 16 significant digits.` },
                { t: 'An error message', why: 'There’s no error: the additions silently round away.' },
              ],
              explain: r`Near 1, doubles are spaced about $2.2 \times 10^{-16}$ apart, so $1 + 10^{-16}$ rounds back to 1, a million times over. Add the tiny numbers to each other **first** (getting $10^{-10}$) and then add 1, and you get the right answer. In floating point, addition isn't associative: the order matters.`,
            },
            {
              type: 'numeric',
              title: 'Digits of precision',
              prompt: r`A 64-bit floating-point number has a 53-bit mantissa, so its relative precision is about $2^{-53} \approx 1.1 \times 10^{-16}$. Roughly how many significant decimal digits is that?`,
              answer: 16,
              tol: 1,
              explain: r`$\log_{10} 2^{53} \approx 15.95$, so about 16 digits (15 always reliable). Plenty for most purposes, until subtracting nearly equal numbers throws most of them away.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A deadly drift',
              prompt: r`During the 1991 Gulf War, a Patriot missile battery counted time in tenths of a second, but its stored value of 0.1 was too small by about $9.5 \times 10^{-8}$ seconds. After 100 hours of continuous running, how large had the clock error grown, in seconds? (2 decimal places.)`,
              unit: 's',
              answer: 100 * 3600 * 10 * 9.5e-8,
              tol: 0.006,
              wrong: [{ v: 100 * 3600 * 9.5e-8, tol: 0.001, why: 'The clock ticked 10 times per second, so multiply by the number of tenths, not seconds.' }],
              explain: r`$100 \times 3600 \times 10 = 3.6$ million ticks, each off by $9.5 \times 10^{-8}$ s: about **0.34 s**. A Scud missile travels over 500 m in that time. On 25 February 1991, the battery at Dhahran failed to intercept an incoming Scud, which killed 28 soldiers. A tiny rounding error, accumulated, became a tragedy.`,
            },
          ],
          recap: [
            'Computers store numbers in binary floating point with limited precision.',
            'Decimals like 0.1 can’t be stored exactly, so tiny errors appear.',
            'Compare floating-point numbers with a tolerance, and watch for accumulated errors.',
          ],
        },
      ],
    },
    {
      title: 'Randomness and Curve Fitting',
      summary: 'Monte Carlo methods and interpolation.',
      lessons: [
        {
          id: 'montecarlo',
          title: 'Monte Carlo',
          summary: 'Computing with random numbers',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Darts at a square',
              body: r`A circle of radius 1 sits inside a $2 \times 2$ square. You throw darts that land uniformly at random in the square.`,
              prompt: 'What fraction of the darts should land inside the circle?',
              choices: [
                { t: r`$\frac{\pi}{4} \approx 0.785$`, ok: true },
                { t: r`$\frac12$`, why: r`The circle fills much more than half of the square: compare areas, $\pi \times 1^2$ against $2 \times 2$.` },
                { t: r`$\frac{\pi}{2}$`, why: r`That's more than 1! The fraction is (circle area) ÷ (square area) $= \frac{\pi}{4}$.` },
              ],
              explain: r`The fraction is $\frac{\text{circle area}}{\text{square area}} = \frac{\pi}{4}$. So counting darts gives a way to **estimate** $\pi$: multiply the fraction inside by 4. Using randomness to compute a definite number is called the **Monte Carlo method**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Throw the darts',
              body: r`Each dot is a random point in the square. Throw more and watch the estimate of $\pi$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.05, xmax: 1.05, ymin: -1.05, ymax: 1.05, grid: false, axes: false, maxWidth: 380,
                params: { N: { min: 10, max: 20000, step: 10, value: 200, label: 'darts', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  let din = '', dout = '';
                  for (let i = 0; i < p.N; i++) { const [x, y] = DARTS[i], seg = `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`; if (x * x + y * y <= 1) din += seg; else dout += seg; }
                  const w = p.N > 3000 ? 1.6 : 3;
                  return [
                    s('rect', { x: plot.X(-1), y: plot.Y(1), width: plot.X(1) - plot.X(-1), height: plot.Y(-1) - plot.Y(1), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }),
                    s('path', { d: din, stroke: 'var(--blue)', 'stroke-width': w, 'stroke-linecap': 'round' }),
                    s('path', { d: dout, stroke: 'var(--coral)', 'stroke-width': w, 'stroke-linecap': 'round' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }),
                  ];
                },
                readout: (p) => { let k = 0; for (let i = 0; i < p.N; i++) { const [x, y] = DARTS[i]; if (x * x + y * y <= 1) k++; } const est = (4 * k) / p.N; return r`${k} of ${p.N} inside: $\pi \approx 4 \times \frac{${k}}{${p.N}} = ${est.toFixed(4)}$ (error $${Math.abs(est - Math.PI).toFixed(4)}$)`; },
              },
              after: r`The estimate wanders but slowly homes in. With 20,000 darts it's typically within about 0.01 of $\pi$: correct to only two decimal places. Monte Carlo is easy but slow to converge.`,
            },
            {
              type: 'numeric',
              title: 'From a count',
              prompt: r`In an experiment, 7,854 out of 10,000 random darts landed inside the circle. What is the estimate of $\pi$?`,
              answer: 3.1416,
              tol: 0.0001,
              wrong: [{ v: 0.7854, tol: 0.0001, why: 'That’s the fraction inside. Multiply by 4.' }],
              explain: r`$4 \times 0.7854 = 3.1416$. (A lucky run: with 10,000 darts the typical error is about 0.016.)`,
            },
            {
              type: 'numeric',
              title: 'The square-root law',
              body: r`The typical error of a Monte Carlo estimate shrinks like $\dfrac{1}{\sqrt N}$, where $N$ is the number of random samples.`,
              prompt: 'How many times more samples do you need to make the error 10 times smaller?',
              unit: '×',
              answer: 100,
              wrong: [{ v: 10, why: r`Error $\propto \frac{1}{\sqrt N}$. To divide it by 10, $\sqrt N$ must grow 10 times, so $N$ must grow $10^2$ times.` }, { v: 1000, why: r`$\sqrt{100} = 10$: 100 times the samples is enough.` }],
              explain: r`$\sqrt{100} = 10$, so 100 times the samples gives 10 times less error: each extra correct digit costs 100 times more work. That's terrible for computing $\pi$, but Monte Carlo has a superpower: the same $\frac{1}{\sqrt N}$ law holds in any number of dimensions.`,
            },
            {
              type: 'explain',
              title: 'Born at Los Alamos',
              body: r`In 1946 the mathematician Stanisław Ulam, recovering from an illness, wondered about the chance of winning a game of patience (solitaire). Rather than calculating, he imagined simply playing many games and counting. With John von Neumann he turned this into a way of simulating neutrons in nuclear weapons research on the first electronic computers, code-named after the Monte Carlo casino.

Today Monte Carlo methods price financial options, render light in animated films (by tracing random light rays), predict weather ensembles and estimate integrals in hundreds of dimensions, where grid methods like Simpson's rule are hopeless: a grid of just 10 points per dimension in 100 dimensions has $10^{100}$ points.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Volume of a ball',
              body: r`Random points are thrown into the cube $-1 \le x, y, z \le 1$, of volume 8. About 52.4% of them land inside the ball of radius 1.`,
              prompt: 'What is the estimated volume of the ball? (2 decimal places.)',
              answer: 0.524 * 8,
              tol: 0.01,
              wrong: [{ v: 0.524 * 4, tol: 0.01, why: 'The cube has side 2, so its volume is 2³ = 8.' }],
              explain: r`$0.524 \times 8 \approx 4.19$, matching $\frac43\pi \approx 4.189$. In 10 dimensions, only about 0.25% of the cube lies inside the ball, and in 20 dimensions about 0.0000025%: high-dimensional balls are mostly empty corners of the cube. Monte Carlo handles these spaces where intuition fails.`,
            },
          ],
          recap: [
            'Monte Carlo: estimate a quantity by random sampling (e.g. π from random darts).',
            r`The error shrinks like $1/\sqrt N$: each extra digit costs 100× more samples.`,
            'Its strength is high dimensions, where grids are hopeless.',
          ],
        },
        {
          id: 'interpolation',
          title: 'Fitting Curves',
          summary: 'Through the points, and the danger at the edges',
          icon: 'pencil',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Between two readings',
              prompt: r`A thermometer reads 12 °C at 9:00 and 18 °C at 11:00. Assuming the temperature changed steadily, what was it at 10:30?`,
              unit: '°C',
              answer: 16.5,
              wrong: [{ v: 15, why: 'That’s at 10:00, halfway. 10:30 is three-quarters of the way.' }],
              explain: r`10:30 is $\frac34$ of the way from 9:00 to 11:00, so $12 + \frac34 \times 6 = 16.5$ °C. Estimating between known values like this is **interpolation**; here, **linear** interpolation.`,
            },
            {
              type: 'explain',
              title: 'One curve through all the points',
              body: r`Through any 2 points there's exactly one straight line; through any 3 (with different $x$ values) exactly one parabola; and in general:

::: key
Through $n$ points with different $x$ values passes exactly one polynomial of degree at most $n - 1$, the **interpolating polynomial**.
:::

Joseph-Louis Lagrange gave a formula for it in 1795. It seems natural that more points should mean a better fit to the underlying function. Surprisingly, that can go badly wrong.`,
            },
            {
              type: 'interactive',
              title: 'Runge’s phenomenon',
              body: r`The violet curve is $f(x) = \dfrac{1}{1 + 25x^2}$. The coral curve is the polynomial through $n$ points sampled from it. With **equally spaced** points, adding more makes the wiggles at the edges worse! Switch to **Chebyshev** points (bunched near the ends) and find a setting with **11** points and a maximum error below **0.2**.`,
              widget: {
                kind: 'graph', xmin: -1.05, xmax: 1.05, ymin: -0.6, ymax: 1.6, grid: false, height: 300, axes: { xticks: 0.5, yticks: 0.5 },
                params: {
                  n: { min: 3, max: 15, step: 1, value: 11, label: 'points', color: 'coral' },
                  ch: { min: 0, max: 1, step: 1, value: 0, label: 'spacing', color: 'blue', format: (v) => (v ? 'Chebyshev' : 'equal') },
                },
                curves: [
                  { f: (x) => runge(x), color: 'violet', width: 3 },
                  { f: (x, p) => lagrange(nodes(p.n, p.ch), x), from: -1, to: 1, color: 'coral', width: 2, n: 400 },
                ],
                extra: ({ plot, p, s }) => nodes(p.n, p.ch).map((x) => s('circle', { cx: plot.X(x), cy: plot.Y(runge(x)), r: 5, class: 'fl-ink' })),
                readout: (p) => `Maximum error: **${maxErr(p.n, p.ch).toFixed(3)}**`,
                goal: (p) => p.n === 11 && maxErr(p.n, p.ch) < 0.2,
                hint: 'Keep 11 points, but change the spacing.',
                solution: { n: 11, ch: 1 },
              },
              explain: r`With 11 equally spaced points the polynomial swings to an error of almost 2 near the ends, and with 15 points about 7. Carl Runge discovered this in 1901. **Chebyshev points**, $x_k = \cos\frac{(2k+1)\pi}{2n}$, crowd towards the ends just enough to tame the wiggles: 11 of them give an error of about 0.1, and more points always help.`,
            },
            {
              type: 'mcq',
              title: 'Splines',
              prompt: 'Designers and computer graphics programs usually draw smooth curves through many points with **splines**: separate low-degree polynomials (often cubics) between neighbouring points, joined smoothly. Why?',
              choices: [
                { t: 'Each piece only depends on nearby points, so there are no wild swings across the whole curve', ok: true },
                { t: 'A single high-degree polynomial can’t pass through all the points', why: 'It can: there’s always exactly one. The trouble is that it may wiggle wildly between the points.' },
                { t: 'Cubics are the only polynomials computers can evaluate', why: 'Computers evaluate any polynomial easily. Splines avoid the instability of one high-degree polynomial.' },
              ],
              explain: r`A spline keeps each piece simple and local, so moving one point only affects the curve nearby. The name comes from the thin flexible strips of wood that shipbuilders bent through pegs to draw smooth hull curves. Fonts, car bodies and animation paths are all built from splines.`,
            },
            {
              type: 'numeric',
              title: 'A parabola through three points',
              prompt: r`The parabola $y = ax^2 + bx + c$ passes through $(0, 1)$, $(1, 2)$ and $(2, 5)$. What is the value of $y$ at $x = 3$?`,
              answer: 10,
              wrong: [{ v: 8, why: r`That continues the differences 1, 3 as if they kept going up by 3s. Find $a$, $b$, $c$: $c = 1$, then $a + b = 1$ and $4a + 2b = 4$.` }, { v: 9, why: r`Find the parabola: $c = 1$, $a + b = 1$, $4a + 2b = 4$ give $a = 1$, $b = 0$.` }],
              hint: r`$c = 1$ from the first point. Then $a + b + 1 = 2$ and $4a + 2b + 1 = 5$.`,
              explain: r`$c = 1$, $a + b = 1$, $4a + 2b = 4$, so $a = 1$, $b = 0$: $y = x^2 + 1$, giving $y(3) = 10$. (The differences 1, 3, 5 go up by 2 each time, the hallmark of a parabola.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Beyond the data',
              prompt: r`A company fits a degree-5 polynomial exactly through six years of sales figures, and uses it to forecast next year's sales. Why is this risky?`,
              choices: [
                { t: 'Outside the data range, high-degree polynomials can shoot off wildly; a perfect fit to past data says nothing about the future', ok: true },
                { t: 'Polynomials can’t be evaluated outside the data range', why: 'They can be evaluated anywhere. The problem is that the values there are often nonsense.' },
                { t: 'There is no risk: an exact fit means the model is perfect', why: 'Six points always have an exact degree-5 fit, even if they’re pure noise. Fitting exactly is not the same as understanding the trend.' },
              ],
              explain: r`Six points always have an exact degree-5 fit, even pure noise, so the fit proves nothing. Beyond the data (**extrapolation**) the polynomial is controlled by its highest power and can swing anywhere, just like Runge's wiggles at the edges. A simpler model that doesn't pass through every point usually forecasts far better: this is the problem of **overfitting**, central to statistics and machine learning.`,
            },
          ],
          recap: [
            'n points determine exactly one polynomial of degree ≤ n − 1.',
            'With equally spaced points, high-degree interpolation can wiggle wildly (Runge’s phenomenon); Chebyshev points fix it.',
            'Splines join simple local pieces; exact fits extrapolate badly (overfitting).',
          ],
        },
        {
          id: 'ode-steps',
          title: 'Stepping Through Time',
          summary: 'Solving differential equations numerically',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Follow the slope',
              body: r`A differential equation $y' = f(t, y)$ tells you the slope at every point. To follow a solution numerically, take small time steps $h$. The simplest method, **Euler’s method**, pretends the slope stays constant during each step:
$$y_{n+1} = y_n + h\,f(t_n, y_n).$$
The **midpoint method** is smarter: it takes a half step to estimate the slope in the middle of the interval, then uses that slope for the full step.`,
            },
            {
              type: 'numeric',
              title: 'Two Euler steps',
              prompt: r`Solve $y' = y$ with $y(0) = 1$ using Euler’s method with two steps of $h = 0.5$. What value do you get for $y(1)$? (The exact answer is $e \approx 2.718$.)`,
              answer: 2.25,
              tol: 0.001,
              explain: r`Step 1: $1 + 0.5 \times 1 = 1.5$. Step 2: $1.5 + 0.5 \times 1.5 = 2.25$. Euler underestimates here because the true slope keeps increasing during each step.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How many steps?',
              prompt: r`Use $N$ equal steps to go from $t = 0$ to $t = 1$ for $y' = y$. Euler (coral) and midpoint (violet) are compared with the exact curve (dashed). Find the **smallest** $N$ for which Euler’s answer is within **1%** of $e$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0.8, ymax: 2.9, grid: false, height: 260, axes: { xlabel: 't', yticks: 0.5, xticks: 0.2, yAt: 0.8 },
                params: { N: { min: 1, max: 80, step: 1, value: 4, label: 'steps N', color: 'coral' } },
                curves: [{ f: (x) => Math.exp(x), color: 'muted', dash: true, width: 2 }],
                extra: ({ plot, p, s }) => { const h = 1 / p.N; let ye = 1, ym = 1, de = `M${plot.X(0)} ${plot.Y(1)}`, dm = de; for (let i = 1; i <= p.N; i++) { ye += h * ye; ym = ym * (1 + h + (h * h) / 2); de += `L${plot.X(i * h).toFixed(1)} ${plot.Y(ye).toFixed(1)}`; dm += `L${plot.X(i * h).toFixed(1)} ${plot.Y(ym).toFixed(1)}`; } return [s('path', { d: de, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 }), s('path', { d: dm, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 })]; },
                readout: (p) => { const h = 1 / p.N, ye = (1 + h) ** p.N, ym = (1 + h + (h * h) / 2) ** p.N; return `Euler **${ye.toFixed(4)}** (error ${((100 * (Math.E - ye)) / Math.E).toFixed(2)}%) · midpoint ${ym.toFixed(4)} (error ${((100 * (Math.E - ym)) / Math.E).toFixed(3)}%)`; },
                goal: (p) => p.N === 50,
                hint: 'Euler’s error is roughly e/(2N).',
                solution: { N: 50 },
              },
              explain: r`It takes **50** Euler steps to get within 1% ($(1 + \frac{1}{50})^{50} \approx 2.692$). The midpoint method is within 1% with only 4 steps, and within 0.01% with 50. Better methods aren’t just a bit better: their errors shrink much faster as $h$ shrinks.`,
            },
            { /*anim:numerics*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Euler spirals out',
              body: r`A mass on a spring, $x'' = -x$, drawn in the **phase plane**: position across, velocity up. The true motion goes round the {ink:dashed circle} for ever. Here are {coral:Euler's method} and the {violet:midpoint method}, both with steps of $h = 0.2$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.7, xmax: 2.7, ymin: -2.7, ymax: 2.7, grid: false, axes: false, maxWidth: 420, clipExtra: true,
                animate: { param: 't', speed: 4, max: 52, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { E, M } = SPRING_STEPS, n = Math.min(48, Math.floor(p.t)), els = [];
                  const P = (pts) => pts.map(([x, v], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(v).toFixed(1)}`).join('');
                  els.push(s('line', { x1: plot.X(-2.7), x2: plot.X(2.7), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-2.7), y2: plot.Y(2.7), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  els.push(s('text', { x: plot.X(2.65), y: plot.Y(0) - 8, 'text-anchor': 'end', class: 'axis-label', text: 'position x' }));
                  els.push(s('text', { x: plot.X(0) + 8, y: plot.Y(2.55), class: 'axis-label', text: 'velocity v' }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  for (const [pts, col] of [[E, 'coral'], [M, 'violet']]) {
                    els.push(s('path', { d: P(pts.slice(0, n + 1)), fill: 'none', stroke: `var(--${col})`, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
                    for (let i = 0; i <= n; i++) els.push(s('circle', { cx: plot.X(pts[i][0]), cy: plot.Y(pts[i][1]), r: i === n ? 5.5 : 2.5, class: `fl-${col}` }));
                  }
                  return els;
                },
                readout: (p) => { const { h, E, M } = SPRING_STEPS, n = Math.min(48, Math.floor(p.t)), e = (q) => q[0] * q[0] + q[1] * q[1]; return `${n} steps (time ${fix(n * h, 1)}) · energy compared with the start: {coral:Euler ×${fix(e(E[n]), 3)}} · {violet:midpoint ×${fix(e(M[n]), 3)}}`; },
              },
              after: r`Each Euler step moves along the tangent of the circle, and a tangent always leads slightly **outwards**, so every step multiplies the energy by exactly $1 + h^2 = 1.04$. After 48 steps the swing is more than twice as wide: the simulated spring has gained energy from nowhere. The midpoint method's error per step is far smaller ($1 + h^4/4$), so it stays on the circle much longer. For long simulations (planets, molecules) people use special methods built to conserve energy.`,
            },
            {
              type: 'mcq',
              title: 'Orders of accuracy',
              prompt: r`If you halve the step size $h$, how does the error at $t = 1$ change for Euler’s method and for the midpoint method?`,
              choices: [
                { t: 'Euler’s error halves; the midpoint error drops to about a quarter', ok: true },
                { t: 'Both halve', why: r`The midpoint method is second order: its error scales like $h^2$.` },
                { t: 'Both drop to a quarter', why: r`Euler is only first order: error $\propto h$.` },
              ],
              explain: r`Euler is a **first-order** method (error $\propto h$) and the midpoint method **second-order** (error $\propto h^2$). The classic Runge–Kutta method (RK4), used everywhere from weather models to video games, is fourth order.`,
            },
            {
              type: 'numeric',
              title: 'Fourth order',
              prompt: r`For a fourth-order method like RK4, the error scales like $h^4$. By what factor does the error shrink when the step size is halved?`,
              answer: 16,
              explain: r`$2^4 = 16$. Halving the step costs twice the work but gives 16 times the accuracy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A tenth of a percent',
              prompt: r`Euler’s error for this problem is about $\frac{e}{2N}$, as a fraction of $e$ it is about $\frac{1}{2N}$. Roughly how many Euler steps are needed for an error of **0.1%**?`,
              answer: 500,
              tol: 5,
              explain: r`$\frac{1}{2N} = 0.001$ gives $N = 500$ (and $(1 + \frac{1}{500})^{500}$ is indeed within 0.1% of $e$). Ten times the accuracy costs ten times the steps for a first-order method, which is why serious simulations use higher-order methods.`,
            },
          ],
          recap: [
            r`Euler’s method: $y_{n+1} = y_n + h f(t_n, y_n)$; error $\propto h$.`,
            r`The midpoint method samples the slope halfway; error $\propto h^2$.`,
            'Higher-order methods like RK4 reach high accuracy with far fewer steps.',
          ],
        },
      ],
    },
  ],
};
