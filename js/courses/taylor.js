import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
const XY = { xlabel: 'x', ylabel: 'y' };
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

const SERIES = [
  { name: 'eˣ', tex: 'e^x', f: Math.exp, T: (x, N) => { let s = 0; for (let k = 0; k < N; k++) s += x ** k / fact(k); return s; }, term: (N) => (N === 1 ? '1' : `\\dfrac{x^{${N - 1}}}{${N - 1}!}`) },
  { name: 'sin x', tex: '\\sin x', f: Math.sin, T: (x, N) => { let s = 0; for (let k = 0; k < N; k++) s += ((-1) ** k * x ** (2 * k + 1)) / fact(2 * k + 1); return s; }, term: (N) => `\\dfrac{x^{${2 * N - 1}}}{${2 * N - 1}!}` },
  { name: 'cos x', tex: '\\cos x', f: Math.cos, T: (x, N) => { let s = 0; for (let k = 0; k < N; k++) s += ((-1) ** k * x ** (2 * k)) / fact(2 * k); return s; }, term: (N) => (N === 1 ? '1' : `\\dfrac{x^{${2 * N - 2}}}{${2 * N - 2}!}`) },
  { name: 'ln(1 + x)', tex: '\\ln(1 + x)', f: (x) => (x > -1 ? Math.log(1 + x) : NaN), T: (x, N) => { let s = 0; for (let k = 1; k <= N; k++) s += ((-1) ** (k + 1) * x ** k) / k; return s; }, term: (N) => `\\dfrac{x^{${N}}}{${N}}` },
];

// degree-3 Taylor polynomial of sin around a
const sinT3 = (x, a) => Math.sin(a) + Math.cos(a) * (x - a) - (Math.sin(a) * (x - a) ** 2) / 2 - (Math.cos(a) * (x - a) ** 3) / 6;
// exact pendulum period ÷ small-angle period, via the arithmetic–geometric mean
const agm = (a, b) => { for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return a; };
const periodRatio = (deg) => 1 / agm(1, Math.cos((deg * Math.PI) / 360));

const EULER_THETAS = [Math.PI, 1, 2.5];
const eulerState = (t) => { const k = Math.floor(t / 9) % 3, n = Math.min(14, Math.floor(Math.max(0, (t % 9) - 0.5) / 0.45)); return { th: EULER_THETAS[k], n }; };

export default {
  id: 'taylor',
  subject: 'math',
  title: 'Taylor Series',
  level: 'Advanced',
  cover: 'taylor',
  tagline: 'Approximating any smooth function with polynomials, and the physics hiding in the first few terms.',
  description: r`How does a calculator find $\sin(0.3)$? Learn to approximate curves with lines, then parabolas, then polynomials of any degree. Build the famous series for $e^x$, $\sin x$ and $\cos x$, choose the best centre, see where approximations break down, measure their errors, and use them to uncover $E = mc^2 + \tfrac12 mv^2$ and Euler's formula.`,
  prereq: 'Calculus: Derivatives',
  chapters: [
    {
      title: 'Approximating Curves',
      summary: 'Lines, then parabolas, then more.',
      lessons: [
        {
          id: 'linear',
          title: 'Tangent Line Approximations',
          summary: 'Zoom in until it’s straight',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Close to the point',
              body: r`Near any point, a smooth curve looks almost straight, so its **tangent line** is a good approximation there:
$$f(x) \approx f(a) + f'(a)(x - a)$$
Here $f(x) = \sqrt{x}$. Drag the point to move $a$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 9, ymin: -0.5, ymax: 3.6, grid: 1, axes: XY, maxWidth: 600,
                params: { a: { min: 0.5, max: 8, step: 0.25, value: 4, slider: false } },
                curves: [
                  { f: (x) => (x >= 0 ? Math.sqrt(x) : NaN), color: 'blue' },
                  { f: (x, p) => Math.sqrt(p.a) + (x - p.a) / (2 * Math.sqrt(p.a)), color: 'coral', dash: true },
                ],
                points: [{ x: (p) => p.a, y: (p) => Math.sqrt(p.a), drag: { x: 'a' }, color: 'coral' }],
                readout: (p) => r`at $a = ${f2(p.a)}$: $\;\sqrt{x} \approx ${f2(Math.sqrt(p.a))} + \dfrac{x - ${f2(p.a)}}{${f2(2 * Math.sqrt(p.a))}}$`,
              },
              after: r`Near $a$ the dashed line and the curve almost coincide. Farther away they drift apart, because the line can't bend.`,
            },
            {
              type: 'numeric',
              title: 'Estimate a root',
              prompt: r`Use the tangent line to $\sqrt{x}$ at $a = 4$ to estimate $\sqrt{4.4}$. (Recall $\tfrac{d}{dx}\sqrt{x} = \tfrac{1}{2\sqrt{x}}$.)`,
              answer: 2.1,
              tol: 0.002,
              wrong: [{ v: 2.2, why: r`The slope at 4 is $\frac{1}{2\sqrt4} = \frac14$, so add $0.4 \times \frac14 = 0.1$.` }, { v: 2.098, tol: 0.001, why: 'That’s the true value. The tangent line gives a slightly larger, simpler estimate.' }],
              explain: r`$\sqrt{4.4} \approx 2 + \tfrac14(0.4) = 2.1$. The true value is $2.0976\ldots$, so the error is only about 0.002.`,
            },
            {
              type: 'numeric',
              title: 'Compound interest in your head',
              prompt: r`Near $x = 0$, $(1 + x)^n \approx 1 + nx$. Use this to estimate $1.01^{10}$.`,
              answer: 1.1,
              tol: 0.001,
              wrong: [{ v: 1.1046, tol: 0.0005, why: 'That’s the exact value. The linear approximation gives a rounder number.' }, { v: 1.01, tol: 0.001, why: r`Multiply $x = 0.01$ by $n = 10$: $1 + 10 \times 0.01$.` }],
              explain: r`$1 + 10 \times 0.01 = 1.1$. The true value is $1.1046$: the approximation ignores the small "interest on interest", which is what the next terms of the series would add.`,
            },
            {
              type: 'numeric',
              title: 'A cube root',
              prompt: r`Use the tangent line to $\sqrt[3]{x}$ at $a = 8$ to estimate $\sqrt[3]{8.12}$. (Recall $\tfrac{d}{dx}x^{1/3} = \tfrac13 x^{-2/3}$.) (3 decimal places.)`,
              answer: 2.01,
              tol: 0.0005,
              wrong: [{ v: 2.04, tol: 0.0005, why: r`The slope at 8 is $\frac13 \times 8^{-2/3} = \frac13 \times \frac14 = \frac{1}{12}$, not $\frac13$.` }],
              explain: r`The slope at 8 is $\frac{1}{3 \times 4} = \frac{1}{12}$, so $\sqrt[3]{8.12} \approx 2 + \frac{0.12}{12} = 2.01$. The true value is $2.00995\ldots$: an error of only about 0.00005.`,
            },
            {
              type: 'numeric',
              title: 'Dividing without dividing',
              prompt: r`The rule $(1 + x)^n \approx 1 + nx$ works for $n = -1$ too: $\frac{1}{1 + x} \approx 1 - x$. Use it to estimate $\frac{1}{1.04}$.`,
              answer: 0.96,
              tol: 0.0005,
              wrong: [{ v: 1.04, tol: 0.0005, why: r`With $n = -1$, the correction is $-x$: subtract 0.04.` }],
              explain: r`$1 - 0.04 = 0.96$. The true value is $0.9615\ldots$; the next term, $+x^2 = 0.0016$, closes most of the gap. A price rise of 4% followed by a fall of 4% doesn't quite get you back, for the same reason.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Small angles',
              prompt: r`What is the tangent-line approximation of $\sin x$ at $a = 0$?`,
              cols: 2,
              choices: [
                { t: r`$\sin x \approx x$`, ok: true },
                { t: r`$\sin x \approx 1$`, why: r`$\sin 0 = 0$, not 1. And the slope is $\cos 0 = 1$.` },
                { t: r`$\sin x \approx 0$`, why: r`That ignores the slope, $\cos 0 = 1$.` },
                { t: r`$\sin x \approx 1 - x$`, why: r`$\sin 0 = 0$ and the slope is $+1$.` },
              ],
              explain: r`$\sin 0 = 0$ and $\sin'(0) = \cos 0 = 1$, so $\sin x \approx x$ for small $x$ (in radians). Physicists use this constantly: it's how the pendulum formula $T = 2\pi\sqrt{L/g}$ is derived, which is why that formula is only accurate for small swings.`,
            },
          ],
          recap: [
            r`Tangent line approximation: $f(x) \approx f(a) + f'(a)(x - a)$.`,
            'It works well close to a, and gets worse farther away.',
            r`For small $x$ in radians, $\sin x \approx x$.`,
          ],
        },
        {
          id: 'matching',
          title: 'Matching Derivatives',
          summary: 'The Taylor recipe',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Add some bend',
              body: r`A line matches the function's **value** and **slope** at $a$. To do better, also match the **curvature** (the second derivative) using a parabola. Then the third derivative with a cubic, and so on.

For a polynomial $p(x) = c_0 + c_1 x + c_2 x^2 + c_3 x^3 + \dots$ around $0$, differentiating $n$ times and setting $x = 0$ leaves just $n!\,c_n$. So to match $f$:
$$c_n = \frac{f^{(n)}(0)}{n!}$$
This gives the **Taylor series** (around 0, also called a Maclaurin series):
$$f(x) = f(0) + f'(0)x + \frac{f''(0)}{2!}x^2 + \frac{f'''(0)}{3!}x^3 + \dots$$`,
            },
            {
              type: 'numeric',
              title: 'Cosine’s parabola',
              prompt: r`For $f(x) = \cos x$: $f(0) = 1$, $f'(0) = 0$ and $f''(0) = -1$. The quadratic approximation is $1 + c_2 x^2$. What is $c_2$?`,
              lhs: r`$c_2 =$`,
              answer: -0.5,
              wrong: [{ v: -1, why: r`Divide by $2! = 2$: $c_2 = \frac{f''(0)}{2!}$.` }, { v: 0.5, why: r`$f''(0) = -1$, so $c_2 = -\frac12$.` }],
              explain: r`$c_2 = \dfrac{-1}{2!} = -\tfrac12$, so $\cos x \approx 1 - \dfrac{x^2}{2}$ near 0.`,
            },
            {
              type: 'numeric',
              title: 'Use it',
              prompt: r`Use $\cos x \approx 1 - \dfrac{x^2}{2}$ to estimate $\cos(0.2)$. (4 decimal places.)`,
              answer: 0.98,
              tol: 0.00005,
              wrong: [{ v: 0.9801, tol: 0.00005, why: 'That’s the true value (to 4 places). The quadratic approximation gives exactly 1 − 0.04/2.' }, { v: 0.9, why: r`$x^2 = 0.04$, so subtract $0.02$.` }, { v: 0.96, why: r`Divide $x^2$ by 2: $1 - \frac{0.04}{2}$.` }],
              explain: r`$1 - \dfrac{0.2^2}{2} = 1 - 0.02 = 0.98$. The true value is $0.980067\ldots$: an error of less than 0.0001 from a tiny calculation.`,
            },
            {
              type: 'interactive',
              title: 'Match the curve',
              body: r`Find the parabola $y = a + bx + cx^2$ that best hugs $y = e^x$ at $x = 0$: same value, same slope and same bend there. (For $e^x$, the value, slope and second derivative at 0 are all 1.)`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 2, ymin: -0.5, ymax: 5, grid: 1, height: 300, axes: XY,
                params: {
                  a: { min: 0, max: 2, step: 0.5, value: 0.5, label: 'a', color: 'blue' },
                  b: { min: -1, max: 2, step: 0.5, value: 0, label: 'b', color: 'violet' },
                  c: { min: -1, max: 1.5, step: 0.25, value: 0, label: 'c', color: 'coral' },
                },
                curves: [{ f: (x) => Math.exp(x), color: 'ink', width: 3 }, { f: (x, p) => p.a + p.b * x + p.c * x * x, color: 'coral', width: 2.5 }],
                readout: (p) => r`At $x = 0$: value $${fix(p.a, 1)}$, slope $${fix(p.b, 1)}$, second derivative $${fix(2 * p.c, 1)}$`,
                goal: (p) => p.a === 1 && p.b === 1 && p.c === 0.5,
                hint: r`The second derivative of $cx^2$ is $2c$, so match $2c = 1$.`,
                solution: { a: 1, b: 1, c: 0.5 },
              },
              explain: r`$a = 1$, $b = 1$, $c = \frac12$: the parabola $1 + x + \frac{x^2}{2}$. The coefficient of $x^2$ is **half** the second derivative, because differentiating $x^2$ twice gives 2. In general the coefficient of $x^n$ is $\frac{f^{(n)}(a)}{n!}$.`,
            },
            {
              type: 'numeric',
              title: 'A quadratic for eˣ',
              prompt: r`The Taylor polynomial $1 + x + \frac{x^2}{2}$ approximates $e^x$ near 0. What does it give at $x = 0.5$? (3 decimal places.)`,
              answer: 1.625,
              tol: 0.001,
              explain: r`$1 + 0.5 + 0.125 = 1.625$, versus $e^{0.5} \approx 1.6487$. Adding $\frac{x^3}{6} \approx 0.021$ gets within 0.003.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The x³ coefficient',
              prompt: r`For $f(x) = \sin x$, $f'''(0) = -1$. What is the coefficient of $x^3$ in its Taylor series? (Give a fraction or decimal.)`,
              answer: -1 / 6,
              tol: 0.002,
              wrong: [{ v: -1 / 3, tol: 0.002, why: r`Divide by $3! = 6$, not 3.` }, { v: 1 / 6, tol: 0.002, why: r`$f'''(0) = -1$, so the coefficient is negative.` }, { v: -1, why: r`Divide by $3! = 6$.` }],
              explain: r`$c_3 = \dfrac{f'''(0)}{3!} = -\dfrac16$. So $\sin x \approx x - \dfrac{x^3}{6}$, much better than $\sin x \approx x$ alone.`,
            },
          ],
          recap: [
            'Match the value, slope, curvature and higher derivatives at a point.',
            r`Taylor coefficients: $c_n = f^{(n)}(0)/n!$.`,
            r`$\cos x \approx 1 - \tfrac{x^2}{2}$ and $\sin x \approx x - \tfrac{x^3}{6}$ near 0.`,
          ],
        },
        {
          id: 'famous',
          title: 'The Famous Series',
          summary: 'eˣ, sin x and cos x',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Three classics',
              body: r`Apply the recipe to the most important functions:
$$e^x = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \frac{x^4}{4!} + \dots$$
$$\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \frac{x^7}{7!} + \dots$$
$$\cos x = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \frac{x^6}{6!} + \dots$$
Every derivative of $e^x$ is $e^x$, which equals 1 at 0, so every coefficient is $\tfrac{1}{n!}$. The derivatives of $\sin$ and $\cos$ cycle through $\sin, \cos, -\sin, -\cos$, which is why the signs alternate and every other power is missing.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Adding terms',
              body: r`Choose a function and add terms. Watch the polynomial (coral) wrap itself around the function (blue).`,
              widget: {
                kind: 'graph', xmin: -7, xmax: 7, ymin: -3, ymax: 3.5, grid: 1, axes: XY, height: 340,
                params: {
                  i: { min: 0, max: 3, step: 1, value: 1, label: 'function', color: 'blue', format: (v) => SERIES[v].name },
                  N: { min: 1, max: 12, step: 1, value: 2, label: 'terms', color: 'coral', format: (v) => `${v}` },
                },
                curves: [
                  { f: (x, p) => SERIES[p.i].f(x), color: 'blue', width: 4 },
                  { f: (x, p) => SERIES[p.i].T(x, p.N), color: 'coral', width: 3 },
                ],
                readout: (p) => r`$${SERIES[p.i].tex} \approx$ the first ${p.N} term${p.N > 1 ? 's' : ''}, ending with $${SERIES[p.i].term(p.N)}$`,
              },
              after: r`For $e^x$, $\sin x$ and $\cos x$, adding terms makes the approximation good over a wider and wider range. With enough terms, these series work for **every** $x$. But try $\ln(1 + x)$: beyond $x = 1$ the polynomials flail wildly, no matter how many terms you add. More about that next.`,
            },
            {
              type: 'numeric',
              title: 'Computing e',
              prompt: r`Add the first five terms of the series for $e^x$ at $x = 1$: $1 + 1 + \tfrac12 + \tfrac16 + \tfrac1{24}$. (4 decimal places.)`,
              answer: 1 + 1 + 0.5 + 1 / 6 + 1 / 24,
              tol: 0.0001,
              wrong: [{ v: 2.7183, tol: 0.0001, why: 'That’s e itself. Five terms give a slightly smaller number.' }, { v: 2.6667, tol: 0.0002, why: 'That’s four terms. Add 1/24 too.' }],
              explain: r`$1 + 1 + 0.5 + 0.1667 + 0.0417 \approx 2.7083$, already within 0.01 of $e = 2.71828\ldots$ The factorials grow so fast that each new term is tiny: ten terms give $e$ to 7 digits.`,
            },
            {
              type: 'numeric',
              title: 'A sine by hand',
              prompt: r`Using the first two terms, $\sin x \approx x - \frac{x^3}{6}$, estimate $\sin(0.1)$. (6 decimal places.)`,
              answer: 0.1 - 0.001 / 6,
              tol: 0.0000006,
              wrong: [{ v: 0.1, tol: 0.0000006, why: r`That's just the first term. Subtract $\frac{0.1^3}{6}$.` }, { v: 0.1 - 0.001 / 3, tol: 0.000001, why: r`It's $3! = 6$ in the denominator, not 3.` }],
              explain: r`$0.1 - \frac{0.001}{6} = 0.0998333\ldots$, within $10^{-7}$ of the true value $0.0998334\ldots$ The next term, $\frac{x^5}{120} \approx 8 \times 10^{-8}$, is tiny. That's roughly how calculators compute sines: shrink the angle first, then sum a few terms.`,
            },
            {
              type: 'numeric',
              title: 'A logarithm by hand',
              prompt: r`Using $\ln(1 + x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \cdots$, estimate $\ln 1.1$ with three terms. (4 decimal places.)`,
              answer: 0.1 - 0.005 + 0.001 / 3,
              tol: 0.0001,
              explain: r`$0.1 - 0.005 + 0.000333 \approx 0.0953$, matching $\ln 1.1 = 0.09531$ to four places. For small $x$ the series converges fast.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Odd and even',
              prompt: r`The series for $\sin x$ has only odd powers of $x$, and the series for $\cos x$ only even powers. Why?`,
              choices: [
                { t: r`$\sin(-x) = -\sin x$ (odd function) and $\cos(-x) = \cos x$ (even function)`, ok: true },
                { t: 'Coincidence', why: 'It’s forced: odd powers change sign when x does, even powers don’t, matching each function’s symmetry.' },
                { t: 'Because π is irrational', why: 'It comes from symmetry: sin is an odd function and cos is even.' },
              ],
              explain: r`Replacing $x$ by $-x$ flips the sign of odd powers and leaves even powers alone. Since $\sin$ is odd, its series can only contain odd powers; $\cos$ is even, so only even powers. $e^x$, with no symmetry, needs all of them, and indeed $e^x$'s odd terms form $\sinh x$ and its even terms $\cosh x$.`,
            },
          ],
          recap: [
            r`$e^x = \sum \frac{x^n}{n!}$.`,
            r`$\sin x$ and $\cos x$ use alternating odd and even powers.`,
            'These three series work for every x. Factorials make the terms shrink fast.',
          ],
        },
      ],
    },
    {
      title: 'Using Series',
      summary: 'Limits and payoffs.',
      lessons: [
        {
          id: 'convergence',
          title: 'Where Series Work',
          summary: 'Radius of convergence',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A familiar series',
              body: r`The geometric series from the Sequences & Series course is a Taylor series too:
$$\frac{1}{1 - x} = 1 + x + x^2 + x^3 + \dots$$
It **converges** (adds up to a finite number) only when $|x| < 1$. At $x = 2$, the right side is $1 + 2 + 4 + 8 + \dots$, which grows without bound, even though $\tfrac{1}{1 - 2} = -1$ is perfectly finite.

Each series has a **radius of convergence** $R$: it works for $|x - a| < R$ and fails beyond.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Partial sums that explode',
              body: r`The series $1 - x^2 + x^4 - x^6 + \cdots$ is the Taylor series of $\frac{1}{1 + x^2}$ (black). Add more terms and watch what happens inside and outside $|x| < 1$.`,
              widget: {
                kind: 'graph', xmin: -1.6, xmax: 1.6, ymin: -1, ymax: 2, grid: false, height: 280, axes: { ...XY, xticks: 0.5, yticks: 1 },
                params: { N: { min: 1, max: 30, step: 1, value: 4, label: 'terms', color: 'coral' } },
                curves: [
                  { f: (x) => 1 / (1 + x * x), color: 'ink', width: 3 },
                  { f: (x, p) => { let s = 0; for (let k = 0; k < p.N; k++) s += (-1) ** k * x ** (2 * k); return s; }, color: 'coral', width: 2.5, n: 400 },
                ],
                extra: ({ plot, s }) => [-1, 1].map((x) => s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(-1), y2: plot.Y(2), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 })),
                readout: (p) => `${p.N} terms`,
              },
              after: r`Inside $|x| < 1$ the partial sums close in on the curve. Outside, they swing more and more wildly with every term, even though the function itself is perfectly smooth there.`,
            },
            {
              type: 'numeric',
              title: 'Inside the radius',
              prompt: r`What does $1 + x + x^2 + x^3 + \cdots$ add up to when $x = 0.5$?`,
              answer: 2,
              wrong: [{ v: 1.5, why: r`$\frac{1}{1 - 0.5} = 2$. The terms are $1 + 0.5 + 0.25 + \cdots$.` }],
              explain: r`$\frac{1}{1 - 0.5} = 2$: inside the radius of convergence, the series really does equal the function.`,
            },
            {
              type: 'mcq',
              title: 'What’s the obstacle?',
              prompt: r`The series for $\dfrac{1}{1 - x}$ around 0 stops working at distance 1. What happens to the function at $x = 1$?`,
              choices: [
                { t: 'It blows up: there’s a vertical asymptote', ok: true },
                { t: 'Nothing special', why: r`$\frac{1}{1 - x}$ has a division by zero at $x = 1$.` },
                { t: 'It equals zero', why: r`At $x = 1$ the denominator is zero, so the function isn't defined there at all.` },
              ],
              explain: r`The series can't reach past the nearest point where the function misbehaves. For $\ln(1 + x)$, that's $x = -1$ (where $\ln 0$ is undefined), so its series around 0 also has radius 1, which is why it went haywire beyond $x = 1$.`,
            },
            {
              type: 'numeric',
              title: 'Another radius',
              prompt: r`$\frac{1}{2 - x} = \frac12 \cdot \frac{1}{1 - x/2} = \frac12\left(1 + \frac x2 + \frac{x^2}{4} + \cdots\right)$. What is the radius of convergence of this series?`,
              answer: 2,
              explain: r`The geometric series converges when $\left|\frac x2\right| < 1$, so $|x| < 2$. The radius is the distance from the centre (0) to the trouble spot ($x = 2$, where the function blows up).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A hidden obstacle',
              prompt: r`$\dfrac{1}{1 + x^2}$ is smooth for **every** real $x$, yet its series $1 - x^2 + x^4 - \dots$ only converges for $|x| < 1$. Why?`,
              choices: [
                { t: r`It blows up at the complex numbers $x = \pm i$, which are a distance 1 from 0`, ok: true },
                { t: 'The series was computed wrongly', why: r`It's a geometric series in $-x^2$, valid for $x^2 < 1$.` },
                { t: 'Every series has radius 1', why: r`$e^x$, $\sin x$ and $\cos x$ converge for all $x$.` },
              ],
              explain: r`$1 + x^2 = 0$ when $x = \pm i$. Those points lie off the real line, at distance 1 from 0 in the **complex plane**, and the series "feels" them. The radius of convergence is really a **circle** in the complex plane, a hint that power series are most naturally understood using complex numbers.`,
            },
          ],
          recap: [
            r`A series converges only within its radius of convergence.`,
            'The radius reaches out to the nearest problem point, possibly a complex one.',
            r`$e^x$, $\sin x$ and $\cos x$ converge everywhere.`,
          ],
        },
        {
          id: 'payoffs',
          title: 'Series at Work',
          summary: 'Relativity and Euler’s formula',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Hidden inside E = mc²',
              body: r`In relativity, a moving object's energy is $E = \gamma mc^2$, where $\gamma = \dfrac{1}{\sqrt{1 - v^2/c^2}}$.

Use the series $(1 - u)^{-1/2} \approx 1 + \tfrac12 u$ for small $u$, with $u = v^2/c^2$:
$$E \approx mc^2\left(1 + \frac{v^2}{2c^2}\right) = mc^2 + \tfrac12 mv^2$$
The first term is the **rest energy**, and the second is Newton's kinetic energy! Newtonian physics is the first-order Taylor approximation of relativity.`,
            },
            {
              type: 'numeric',
              title: 'How good is it?',
              prompt: r`Using $\gamma \approx 1 + \tfrac12 \dfrac{v^2}{c^2}$, estimate $\gamma$ for a spacecraft at 10% of light speed ($v/c = 0.1$).`,
              lhs: r`$\gamma \approx$`,
              answer: 1.005,
              tol: 0.0002,
              wrong: [{ v: 1.05, why: r`$\frac{v^2}{c^2} = 0.01$, and half of that is 0.005.` }, { v: 1.01, why: r`Remember the $\frac12$: $1 + \frac12(0.01)$.` }],
              explain: r`$1 + \tfrac12(0.1)^2 = 1.005$. The exact value is $1/\sqrt{0.99} = 1.00504\ldots$: the approximation is excellent at everyday (and even quite fast) speeds.`,
            },
            {
              type: 'explain',
              title: 'Euler’s formula from series',
              body: r`Put an imaginary number into the series for $e^x$. Using $i^2 = -1$, $i^3 = -i$ and $i^4 = 1$:
$$e^{i\theta} = 1 + i\theta - \frac{\theta^2}{2!} - i\frac{\theta^3}{3!} + \frac{\theta^4}{4!} + \dots$$
Collect the real and imaginary parts:
$$e^{i\theta} = \underbrace{\left(1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \dots\right)}_{\cos\theta} + i\underbrace{\left(\theta - \frac{\theta^3}{3!} + \dots\right)}_{\sin\theta}$$
That's **Euler's formula**, $e^{i\theta} = \cos\theta + i\sin\theta$, falling straight out of the series.`,
            },
            { /*anim:taylor*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The series as a walk',
              body: r`Draw each term of $e^{i\theta} = 1 + i\theta + \frac{(i\theta)^2}{2!} + \cdots$ as an arrow, nose to tail. Multiplying by $i$ turns an arrow a quarter turn anticlockwise, so each arrow turns $90°$ from the last, and the lengths are $1, \theta, \frac{\theta^2}{2!}, \frac{\theta^3}{3!}, \ldots$ The {coral:coral arrows} are real terms and the {blue:blue arrows} imaginary ones.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.6, xmax: 2.2, ymin: -2.6, ymax: 3.6, grid: true, axes: false, maxWidth: 420,
                animate: { param: 't', speed: 1, max: 27, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { th, n } = eulerState(p.t), els = [];
                  els.push(s('line', { x1: plot.X(-4.6), x2: plot.X(2.2), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.3 }), s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-2.6), y2: plot.Y(3.6), stroke: 'var(--axis)', 'stroke-width': 1.3 }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
                  els.push(s('circle', { cx: plot.X(Math.cos(th)), cy: plot.Y(Math.sin(th)), r: 7, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  let x = 0, y = 0, len = 1;
                  for (let k = 0; k <= n; k++) {
                    if (k > 0) len *= th / k;
                    const d = [[1, 0], [0, 1], [-1, 0], [0, -1]][k % 4], x1 = x + len * d[0], y1 = y + len * d[1];
                    const X0 = plot.X(x), Y0 = plot.Y(y), X1 = plot.X(x1), Y1 = plot.Y(y1), a = Math.atan2(Y1 - Y0, X1 - X0), hd = Math.min(9, 0.5 * Math.hypot(X1 - X0, Y1 - Y0));
                    els.push(s('path', { d: `M${X0} ${Y0}L${X1} ${Y1}M${X1 - hd * Math.cos(a - 0.45)} ${Y1 - hd * Math.sin(a - 0.45)}L${X1} ${Y1}L${X1 - hd * Math.cos(a + 0.45)} ${Y1 - hd * Math.sin(a + 0.45)}`, fill: 'none', stroke: `var(--${k % 2 ? 'blue' : 'coral'})`, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
                    x = x1; y = y1;
                  }
                  return els;
                },
                readout: (p) => { const { th, n } = eulerState(p.t); let x = 0, y = 0, len = 1; for (let k = 0; k <= n; k++) { if (k > 0) len *= th / k; const d = [[1, 0], [0, 1], [-1, 0], [0, -1]][k % 4]; x += len * d[0]; y += len * d[1]; } return `$\\theta = ${th === Math.PI ? '\\pi' : fix(th, 1)}$ · ${n + 1} terms: $${fix(x, 3)} ${y < 0 ? '-' : '+'} ${fix(Math.abs(y), 3)}\\,i$ · target $\\cos\\theta + i\\sin\\theta = ${fix(Math.cos(th), 3)} ${Math.sin(th) < 0 ? '-' : '+'} ${fix(Math.abs(Math.sin(th)), 3)}\\,i$`; },
              },
              after: r`The walk spirals in on a point of the **unit circle**: the one at angle $\theta$, exactly $\cos\theta + i\sin\theta$. For $\theta = \pi$ it overshoots wildly at first (the third arrow is almost 5 long), then the factorials take over and it homes in on $-1$. The horizontal arrows add up to the cosine series and the vertical ones to the sine series.`,
            },
            {
              type: 'numeric',
              title: 'Beyond Newton',
              prompt: r`One more term of the series gives the kinetic energy $(\gamma - 1)mc^2 \approx \tfrac12 mv^2\left(1 + \tfrac34\tfrac{v^2}{c^2}\right)$. At $v = 0.2c$, by about what percentage does Newton's $\tfrac12 mv^2$ underestimate the true kinetic energy?`,
              unit: '%',
              answer: 3,
              tol: 0.15,
              wrong: [{ v: 4, tol: 0.1, why: r`That's $\frac{v^2}{c^2}$ itself. Multiply by $\frac34$.` }],
              explain: r`$\frac34 \times 0.2^2 = 0.03$: about 3% (the exact figure is 3.1%). At jet-plane speeds the correction is around $10^{-12}$, which is why Newton's formula served perfectly for two centuries. Particle accelerators, where $v$ is close to $c$, need the full formula.`,
            },
            {
              type: 'interactive',
              title: 'How many terms?',
              body: r`The Taylor series $\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \cdots$ (violet) is compared with the true sine (dashed). Find the **fewest** terms that keep the error below **0.01** everywhere from $0$ to $\pi$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3.5, ymin: -1.5, ymax: 1.5, grid: false, height: 260, axes: { xticks: 0.5, yticks: 0.5 },
                params: { n: { min: 1, max: 7, step: 1, value: 2, label: 'terms', color: 'violet' } },
                curves: [{ f: (x) => Math.sin(x), color: 'muted', dash: true, width: 3 }, { f: (x, p) => { let t = x, sum = 0; for (let k = 0; k < p.n; k++) { sum += t; t *= (-x * x) / ((2 * k + 2) * (2 * k + 3)); } return sum; }, color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(Math.PI), x2: plot.X(Math.PI), y1: plot.Y(-1.5), y2: plot.Y(1.5), stroke: 'var(--ink-3)', 'stroke-dasharray': '3 4' })],
                readout: (p) => { let worst = 0; for (let i = 0; i <= 200; i++) { const x = (Math.PI * i) / 200; let t = x, sum = 0; for (let k = 0; k < p.n; k++) { sum += t; t *= (-x * x) / ((2 * k + 2) * (2 * k + 3)); } worst = Math.max(worst, Math.abs(sum - Math.sin(x))); } return `last term x^${2 * p.n - 1}/${2 * p.n - 1}! · worst error on [0, π]: **${worst < 1e-4 ? worst.toExponential(1) : worst.toFixed(4)}**`; },
                goal: (p) => p.n === 5,
                hint: 'The error is worst at the right-hand end, x = π.',
                solution: { n: 5 },
              },
              explain: r`Five terms (up to $x^9/9!$) keep the error under 0.007 on $[0, \pi]$; four terms are off by 0.075 at $\pi$. Calculators do better still by first using symmetry to shrink $x$ to a small range, where just a few terms are extremely accurate.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The most beautiful equation',
              prompt: r`Put $\theta = \pi$ into Euler's formula. What do you get?`,
              cols: 2,
              choices: [
                { t: r`$e^{i\pi} = -1$`, ok: true },
                { t: r`$e^{i\pi} = 1$`, why: r`$\cos\pi = -1$, not 1.` },
                { t: r`$e^{i\pi} = i$`, why: r`$\sin\pi = 0$, so there's no imaginary part.` },
                { t: r`$e^{i\pi} = 0$`, why: r`$e^{i\theta}$ always has size 1: it can never be 0.` },
              ],
              explain: r`$e^{i\pi} = \cos\pi + i\sin\pi = -1$, often written $e^{i\pi} + 1 = 0$. It links five fundamental constants ($e$, $i$, $\pi$, 1 and 0) in one line, all thanks to Taylor series.`,
            },
          ],
          recap: [
            r`Taylor expanding $\gamma mc^2$ gives $mc^2 + \tfrac12 mv^2$.`,
            r`Euler's formula $e^{i\theta} = \cos\theta + i\sin\theta$ follows from the series.`,
            r`$e^{i\pi} + 1 = 0$.`,
          ],
        },
      ],
    },
    {
      title: 'Series in Practice',
      summary: 'Choosing the centre, and approximations in physics.',
      lessons: [
        {
          id: 'centres',
          title: 'Moving the Centre',
          summary: 'Expand where it helps most',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'No series at zero',
              prompt: r`Why can't $\ln x$ have a Taylor series centred at $x = 0$?`,
              choices: [
                { t: r`$\ln x$ isn't defined at 0 (it plunges to $-\infty$), so there's no value or slope to match`, ok: true },
                { t: 'Logarithms have no derivatives', why: r`They do: $\frac{d}{dx}\ln x = \frac1x$. The trouble is at $x = 0$ itself.` },
                { t: 'It can; the series is 1 + x + x² + …', why: r`That's $\frac{1}{1 - x}$. At $x = 0$, $\ln x$ has no value to match.` },
              ],
              explain: r`There's nothing to match at 0. So expand somewhere else: around $x = 1$, where $\ln 1 = 0$, we get $\ln x = (x - 1) - \frac{(x-1)^2}{2} + \frac{(x-1)^3}{3} - \cdots$, the series for $\ln(1 + u)$ with $u = x - 1$.`,
            },
            {
              type: 'explain',
              title: 'Taylor series anywhere',
              body: r`Around any point $a$ where $f$ is smooth:

::: key
$$f(x) = f(a) + f'(a)(x - a) + \frac{f''(a)}{2!}(x - a)^2 + \frac{f^{(3)}(a)}{3!}(x - a)^3 + \cdots$$
:::

Each term matches one more derivative at $a$. The approximation is best near $a$ and gets worse as $x$ moves away, so it pays to centre the series close to where you need it.`,
            },
            {
              type: 'interactive',
              title: 'Pick the best centre',
              body: r`The coral curve is the degree-3 Taylor polynomial of $\sin x$ centred at $a$ (the coral dot). You want to estimate $\sin(2.5)$ (dashed line). Move the centre until the estimate is within **0.001** of the true value.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 4, ymin: -1.5, ymax: 1.6, grid: false, height: 280, axes: { ...XY, xticks: 1, yticks: 1 },
                params: { a: { min: 0, max: 3.1, step: 0.05, value: 0, label: 'centre a', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => Math.sin(x), color: 'ink', width: 3 }, { f: (x, p) => sinT3(x, p.a), color: 'coral', width: 2.5 }],
                extra: ({ plot, p, s }) => [
                  s('line', { x1: plot.X(2.5), x2: plot.X(2.5), y1: plot.Y(-1.5), y2: plot.Y(1.6), stroke: 'var(--ink-3)', 'stroke-dasharray': '5 4', 'stroke-width': 1.5 }),
                  s('circle', { cx: plot.X(p.a), cy: plot.Y(Math.sin(p.a)), r: 6, class: 'fl-coral' }),
                ],
                readout: (p) => r`Estimate $${sinT3(2.5, p.a).toFixed(5)}$ · true $\sin 2.5 = ${Math.sin(2.5).toFixed(5)}$ · error $${Math.abs(sinT3(2.5, p.a) - Math.sin(2.5)).toFixed(5)}$`,
                goal: (p) => Math.abs(sinT3(2.5, p.a) - Math.sin(2.5)) < 0.001,
                hint: 'Bring the centre close to 2.5.',
                solution: { a: 2.2 },
              },
              explain: r`Centred at 0, the cubic is off by 0.7 at $x = 2.5$; centred at 2.2 it's off by only 0.0003. The error is roughly the first missing term, $\frac{|x - a|^4}{24}$, which shrinks fast as the centre approaches $x$. Calculators exploit this: they reduce every angle to a small range near a convenient centre before summing the series.`,
            },
            {
              type: 'numeric',
              title: 'A logarithm by hand',
              prompt: r`Use the first two terms of the series for $\ln x$ around $x = 1$, $(x - 1) - \frac{(x - 1)^2}{2}$, to estimate $\ln 0.9$. (3 decimal places.)`,
              answer: -0.105,
              tol: 0.0002,
              wrong: [{ v: -0.1, tol: 0.0006, why: r`That's only the first term. Subtract $\frac{(-0.1)^2}{2} = 0.005$.` }, { v: -0.095, tol: 0.0002, why: r`$(x - 1)^2 = (-0.1)^2 = +0.01$, so the second term is $-0.005$: the estimate gets more negative.` }],
              explain: r`$-0.1 - 0.005 = -0.105$, against the true $-0.10536$. Below 1 every term is negative, so the partial sums creep down towards the answer. Before calculators, tables of logarithms were computed with series like this.`,
            },
            {
              type: 'explain',
              title: 'How big is the error?',
              body: r`When you stop a Taylor series after the $x^n$ term, the error is about the size of the **first term you left out**, more precisely:

::: key
**Lagrange's remainder:** error $= \dfrac{f^{(n+1)}(c)}{(n+1)!}(x - a)^{n+1}$ for some $c$ between $a$ and $x$.
:::

The $(n+1)!$ in the denominator grows ferociously fast, which is why series for $e^x$, $\sin x$ and $\cos x$ converge so quickly near their centre.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Six decimal places of e',
              prompt: r`$e = 1 + 1 + \frac{1}{2!} + \frac{1}{3!} + \cdots$. The error after stopping is a little more than the first term left out. How many terms (counting the first 1) do you need so that the first omitted term, $\frac{1}{k!}$, is below $10^{-6}$?`,
              unit: 'terms',
              answer: 10,
              wrong: [{ v: 9, why: r`With 9 terms the first omitted term is $\frac{1}{9!} \approx 2.8 \times 10^{-6}$, still too big.` }, { v: 6, why: r`$\frac{1}{6!} = \frac{1}{720}$ is far bigger than $10^{-6}$.` }],
              hint: r`$9! = 362{,}880$ and $10! = 3{,}628{,}800$.`,
              explain: r`10 terms ($\frac{1}{0!}$ to $\frac{1}{9!}$) leave $\frac{1}{10!} \approx 2.8 \times 10^{-7}$ as the first omitted term, so the sum $2.718281\ldots$ is correct to 6 decimal places. Factorials make $e$'s series one of the fastest-converging in mathematics.`,
            },
          ],
          recap: [
            'Taylor series can be centred at any point a where the function is smooth.',
            'Centre the series near where you need it: the error grows like |x − a|ⁿ⁺¹.',
            'Lagrange’s remainder: the error is about the size of the first omitted term.',
          ],
        },
        {
          id: 'physics',
          title: 'Physics Approximations',
          summary: 'The physicist’s favourite trick',
          icon: 'atom',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A square root without a calculator',
              prompt: r`Use $\sqrt{1 + x} \approx 1 + \frac{x}{2}$ to estimate $\sqrt{1.02}$.`,
              answer: 1.01,
              tol: 0.0001,
              wrong: [{ v: 1.02, tol: 0.0001, why: r`Halve the small part: $1 + \frac{0.02}{2}$.` }, { v: 1.04, tol: 0.0001, why: r`That would be $(1 + x)^2$. For a square root, the exponent is $\frac12$.` }],
              explain: r`$1 + 0.01 = 1.01$; the true value is $1.00995$. The **binomial approximation** $(1 + x)^n \approx 1 + nx$ works for any power $n$, including $\frac12$ and $-1$, as long as $x$ is small.`,
            },
            {
              type: 'explain',
              title: 'Keep the first terms',
              body: r`Physicists constantly face equations too hard to solve exactly. A standard trick: expand in a small quantity and keep only the first one or two terms. The results are often famous formulas:

- $\sin\theta \approx \theta$ turns the pendulum's equation into simple harmonic motion.
- Expanding relativistic energy $\gamma mc^2$ gives $mc^2 + \frac12 mv^2$: Newton's kinetic energy is the first correction.
- Expanding Newton's law of gravity near the ground gives $U \approx mgh$.

The approximations are excellent when the small quantity really is small, and knowing **when** they fail is just as important.`,
            },
            {
              type: 'numeric',
              title: 'Where g comes from',
              body: r`Gravitational potential energy is $U = -\frac{GMm}{R + h}$. For a height $h$ much smaller than Earth's radius $R$, expanding gives $U \approx -\frac{GMm}{R} + \frac{GMm}{R^2}h$: a constant plus $mgh$, with $g = \frac{GM}{R^2}$.`,
              prompt: r`With $GM = 3.99 \times 10^{14}$ m³/s² and $R = 6.37 \times 10^6$ m, what is $g$, in m/s²? (2 decimal places.)`,
              unit: 'm/s²',
              answer: 3.99e14 / 6.37e6 ** 2,
              tol: 0.01,
              wrong: [{ v: 3.99e14 / 6.37e6 / 1e6, tol: 0.05, why: r`Divide by $R^2 = (6.37 \times 10^6)^2 = 4.06 \times 10^{13}$.` }],
              explain: r`$\frac{3.99 \times 10^{14}}{4.06 \times 10^{13}} \approx 9.83$ m/s². The familiar $mgh$ is just the first-order Taylor approximation of Newton's law. It's excellent for a ball or a building, but for satellites hundreds of kilometres up you need the full formula.`,
            },
            {
              type: 'interactive',
              title: 'Big swings',
              body: r`For small swings a pendulum's period is $T_0 = 2\pi\sqrt{L/g}$, whatever the amplitude. The exact period is longer for big swings; the next term of the series gives $T \approx T_0\left(1 + \frac{\theta_0^2}{16}\right)$. Find the amplitude at which the simple formula $T_0$ is **1%** too short.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 180, ymin: 0.95, ymax: 1.6, grid: false, height: 280, padL: 50, axes: { xlabel: 'amplitude (°)', ylabel: 'T / T₀', xticks: 30, yticks: 0.1 },
                params: { th: { min: 1, max: 170, step: 1, value: 60, label: 'amplitude', color: 'violet', format: (v) => `${v}°` } },
                curves: [
                  { f: (d) => (d < 179 ? periodRatio(d) : NaN), color: 'ink', width: 3, from: 0.5, to: 178 },
                  { f: (d) => 1 + (d * Math.PI / 180) ** 2 / 16, color: 'coral', dash: true },
                  { f: () => 1, color: 'muted', dash: true },
                ],
                points: [{ x: (p) => p.th, y: (p) => periodRatio(p.th), color: 'violet' }],
                readout: (p) => `Exact: **${periodRatio(p.th).toFixed(4)}** $T_0$ · with the $\\theta_0^2/16$ correction: ${(1 + (p.th * Math.PI / 180) ** 2 / 16).toFixed(4)} $T_0$`,
                goal: (p) => periodRatio(p.th) >= 1.01 && p.th <= 25,
                hint: r`Solve $\frac{\theta_0^2}{16} = 0.01$ for $\theta_0$ in radians, then convert to degrees.`,
                solution: { th: 23 },
              },
              explain: r`$\frac{\theta_0^2}{16} = 0.01$ gives $\theta_0 = 0.4$ rad $\approx 23°$. Up to about $20°$ the simple formula is good to 1%, and with the correction term it stays within about 0.15% even at $45°$. Near $180°$ (balanced upside down) the true period shoots up to infinity, which no polynomial can follow.`,
            },
            {
              type: 'mcq',
              title: 'Why linearise?',
              prompt: r`Why are approximations like $\sin\theta \approx \theta$ so valuable in physics?`,
              choices: [
                { t: 'They turn hard nonlinear equations into linear ones, which can be solved exactly', ok: true },
                { t: 'Because the exact equations are wrong', why: 'The exact equations are right, just often unsolvable by formula. Linear approximations are solvable.' },
                { t: 'They make every answer exact', why: 'They’re approximations, accurate only when the neglected terms are small.' },
              ],
              explain: r`$\theta'' = -\frac{g}{L}\sin\theta$ has no solution in elementary functions, but $\theta'' = -\frac{g}{L}\theta$ is solved by sines and cosines. Small vibrations of almost anything (bridges, molecules, guitar strings) are analysed this way, which is why simple harmonic motion is everywhere in physics.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A limit by series',
              prompt: r`Use $\sin x = x - \frac{x^3}{6} + \frac{x^5}{120} - \cdots$ to find $\displaystyle\lim_{x \to 0} \frac{\sin x - x}{x^3}$. (Give a decimal, 4 places.)`,
              answer: -1 / 6,
              tol: 0.0002,
              wrong: [{ v: 1 / 6, tol: 0.0002, why: r`$\sin x - x = -\frac{x^3}{6} + \cdots$: mind the sign.` }, { v: 0, why: r`After subtracting $x$, the leading term is $-\frac{x^3}{6}$, which matches the $x^3$ below.` }],
              explain: r`$\frac{\sin x - x}{x^3} = \frac{-x^3/6 + x^5/120 - \cdots}{x^3} = -\frac16 + \frac{x^2}{120} - \cdots \to -\frac16 \approx -0.1667$. Series turn tricky $\frac00$ limits into simple algebra: just compare the leading terms.`,
            },
          ],
          recap: [
            r`Binomial approximation: $(1 + x)^n \approx 1 + nx$ for small $x$.`,
            'Keeping the first terms gives famous formulas: mgh, ½mv², simple harmonic motion.',
            'Series also evaluate 0/0 limits by comparing leading terms.',
          ],
        },
      ],
    },
  ],
};
