import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
const f4 = (v) => fix(v, 4);
const XY = { xlabel: 'x', ylabel: 'y' };

// bisection on f(x) = x³ − x − 1 starting from [1, 2]
const cubic = (x) => x ** 3 - x - 1;
function bisect(steps) {
  let a = 1, b = 2;
  for (let i = 0; i < steps; i++) {
    const m = (a + b) / 2;
    if (cubic(a) * cubic(m) <= 0) b = m;
    else a = m;
  }
  return [a, b];
}

const seqA = (n) => 1 + (-1) ** n / n;
const polyPts = (n, R, rot) => Array.from({ length: n + 1 }, (_, k) => [R * Math.cos(rot + (2 * Math.PI * k) / n), R * Math.sin(rot + (2 * Math.PI * k) / n)]);

export default {
  id: 'limits',
  subject: 'math',
  title: 'Limits & Continuity',
  level: 'Advanced',
  cover: 'limits',
  tagline: 'Getting closer and closer: the foundation of calculus, from sequences to Archimedes’ π.',
  description: r`What value does a function approach, even where it isn't defined? Explore holes, the famous limit $\frac{\sin x}{x} \to 1$, behaviour at infinity, the intermediate value theorem that guarantees roots, the precise ε–δ definition that finally made calculus rigorous, the limits of sequences, and how Archimedes squeezed π.`,
  prereq: 'Functions & Graphs',
  chapters: [
    {
      title: 'Approaching',
      summary: 'What limits mean.',
      lessons: [
        {
          id: 'approaching',
          title: 'Getting Closer',
          summary: 'Limits and holes',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A function with a hole',
              body: r`$f(x) = \dfrac{x^2 - 1}{x - 1}$ isn't defined at $x = 1$ (that would be $\tfrac00$). But what happens **near** 1? Drag the point toward $x = 1$.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 3, ymin: -0.5, ymax: 4.5, grid: 0.5, gridY: 0.5, height: 320, axes: XY,
                params: { x: { min: 0, max: 2, step: 0.01, value: 0.5, slider: false } },
                curves: [{ f: (x) => (Math.abs(x - 1) < 1e-9 ? NaN : (x * x - 1) / (x - 1)), color: 'blue' }],
                extra: ({ plot, s }) => [s('circle', { cx: plot.X(1), cy: plot.Y(2), r: 7, class: 'fl-card', stroke: 'var(--blue)', 'stroke-width': 3 })],
                points: [{ x: (p) => p.x, y: (p) => (Math.abs(p.x - 1) < 1e-9 ? 2 : (p.x * p.x - 1) / (p.x - 1)), drag: { x: 'x' }, color: 'coral' }],
                readout: (p) => (Math.abs(p.x - 1) < 1e-9 ? r`At exactly $x = 1$: $f(1) = \frac00$ is **undefined**. But nearby values approach 2.` : r`$x = ${p.x.toFixed(2)}$: $\;f(x) = ${f4((p.x * p.x - 1) / (p.x - 1))}$`),
              },
              after: r`As $x$ gets close to 1 from either side, $f(x)$ gets close to 2. We write
$$\lim_{x \to 1} \frac{x^2 - 1}{x - 1} = 2$$
The limit describes where the function is **heading**, not what happens exactly at the point. Factoring shows why: $\dfrac{(x - 1)(x + 1)}{x - 1} = x + 1$ (for $x \ne 1$), a straight line with one missing point.`,
            },
            {
              type: 'numeric',
              title: 'Cancel and substitute',
              prompt: r`Find $\displaystyle\lim_{x \to 3} \frac{x^2 - 9}{x - 3}$.`,
              answer: 6,
              wrong: [{ v: 0, why: r`Plugging in gives $\frac00$, which tells you nothing yet. Factor: $x^2 - 9 = (x - 3)(x + 3)$.` }, { v: 3, why: r`After cancelling, you get $x + 3$. At $x = 3$ that's 6.` }],
              explain: r`$\dfrac{x^2 - 9}{x - 3} = \dfrac{(x - 3)(x + 3)}{x - 3} = x + 3 \to 6$.`,
            },
            {
              type: 'numeric',
              title: 'A cubic hole',
              prompt: r`Find $\displaystyle\lim_{x \to 2} \frac{x^3 - 8}{x - 2}$.`,
              hint: r`$x^3 - 8 = (x - 2)(x^2 + 2x + 4)$.`,
              answer: 12,
              wrong: [{ v: 4, why: r`After cancelling you get $x^2 + 2x + 4$, not $x^2$. At $x = 2$ that's $4 + 4 + 4$.` }, { v: 0, why: r`Substituting gives $\frac00$, which is undecided. Factor first.` }],
              explain: r`$\dfrac{(x - 2)(x^2 + 2x + 4)}{x - 2} = x^2 + 2x + 4 \to 4 + 4 + 4 = 12$. (Later you'll recognise this as the slope of $x^3$ at $x = 2$: limits like this are exactly what derivatives are made of.)`,
            },
            {
              type: 'mcq',
              title: 'Redefine the point',
              body: r`Define $g(x) = \dfrac{x^2 - 1}{x - 1}$ for $x \ne 1$, and **also** set $g(1) = 5$.`,
              prompt: r`What is $\displaystyle\lim_{x \to 1} g(x)$?`,
              cols: 2,
              choices: [
                { t: '2', ok: true },
                { t: '5', why: 'The limit ignores what happens exactly at x = 1. Nearby values still approach 2.' },
                { t: 'It doesn’t exist', why: 'From both sides the values approach 2, so the limit exists. It just doesn’t match g(1).' },
              ],
              explain: r`The limit only looks at values **near** 1, never at 1 itself, so it's still 2. The graph is the line $y = x + 1$ with the point at $x = 1$ moved up to 5. The limit and the value disagree, which, as you'll see, means $g$ isn't **continuous** at 1.`,
            },
            {
              type: 'numeric',
              title: 'A square-root hole',
              prompt: r`Find $\displaystyle\lim_{x \to 4} \frac{\sqrt{x} - 2}{x - 4}$. (Hint: $x - 4 = (\sqrt{x} - 2)(\sqrt{x} + 2)$.)`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 0, why: r`Substituting gives $\frac00$, which tells you nothing. Factor the bottom first.` }],
              explain: r`$\dfrac{\sqrt{x} - 2}{(\sqrt{x} - 2)(\sqrt{x} + 2)} = \dfrac{1}{\sqrt{x} + 2} \to \dfrac{1}{4}$. The same "factor and cancel" idea works whenever the trouble comes from a common factor hiding in disguise.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Different sides',
              prompt: r`The function $f(x) = \dfrac{|x|}{x}$ equals $-1$ for $x < 0$ and $+1$ for $x > 0$. What is $\displaystyle\lim_{x \to 0} f(x)$?`,
              choices: [
                { t: 'It doesn’t exist', ok: true },
                { t: '0', why: r`$f$ is never near 0: it's always $-1$ or $+1$.` },
                { t: '1', why: 'From the left, the values are all −1.' },
              ],
              explain: r`Approaching from the right gives $+1$, and from the left gives $-1$. A limit must be the **same** from both sides, so it doesn't exist. (The one-sided limits do exist: $\lim_{x \to 0^+} = 1$ and $\lim_{x \to 0^-} = -1$.)`,
            },
          ],
          recap: [
            'A limit is the value a function approaches, not necessarily its value at the point.',
            r`For $\frac00$ forms, simplify (for example, factor and cancel) first.`,
            'If the left and right limits differ, the limit doesn’t exist.',
          ],
        },
        {
          id: 'famous-limits',
          title: 'Famous Limits',
          summary: 'sin x / x and infinity',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'sin x over x',
              body: r`$\dfrac{\sin x}{x}$ is $\tfrac00$ at $x = 0$, and there's no factoring trick. Drag the point toward 0 and watch the value.`,
              widget: {
                kind: 'graph', xmin: -10, xmax: 10, ymin: -0.4, ymax: 1.3, grid: 2, gridY: 0.25, height: 300, axes: XY,
                params: { x: { min: -9, max: 9, step: 0.01, value: 3, slider: false } },
                curves: [{ f: (x) => (x === 0 ? NaN : Math.sin(x) / x), color: 'violet' }],
                extra: ({ plot, s }) => [s('circle', { cx: plot.X(0), cy: plot.Y(1), r: 6, class: 'fl-card', stroke: 'var(--violet)', 'stroke-width': 3 })],
                points: [{ x: (p) => p.x, y: (p) => (p.x === 0 ? 1 : Math.sin(p.x) / p.x), drag: { x: 'x' }, color: 'coral' }],
                readout: (p) => (p.x === 0 ? r`undefined at exactly 0, but the limit is 1` : r`$\dfrac{\sin(${p.x.toFixed(2)})}{${p.x.toFixed(2)}} = ${f4(Math.sin(p.x) / p.x)}$`),
              },
              after: r`The values approach **1**:
$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$
This is the same fact as $\sin x \approx x$ for small angles (in radians). It's the key step in proving that the derivative of $\sin x$ is $\cos x$.`,
            },
            {
              type: 'explain',
              title: 'The squeeze',
              body: r`How can we be sure the limit is exactly 1? Geometry on the unit circle shows that for small $x > 0$:
$$\cos x \le \frac{\sin x}{x} \le 1$$
As $x \to 0$, $\cos x \to 1$. The middle is **squeezed** between two things that both approach 1, so it must approach 1 too. This is the **squeeze theorem**.`,
            },
            {
              type: 'numeric',
              title: 'Compound interest',
              prompt: r`On a calculator, $\left(1 + \frac1n\right)^n$ is $2.5937$ for $n = 10$, $2.7048$ for $n = 100$ and $2.7169$ for $n = 1000$. What is its limit as $n \to \infty$? (3 decimal places.)`,
              answer: Math.E,
              tol: 0.001,
              wrong: [{ v: 1, why: r`It's tempting to say $1^\infty = 1$, but the base and the exponent change together. The values above are clearly heading past 2.7.` }],
              explain: r`The limit is $e = 2.71828\ldots$ Jacob Bernoulli found it in 1683 by asking what happens to a loan when interest is compounded more and more often: $(1 + \frac1n)^n$ is £1 at 100% a year, compounded $n$ times. Like $\frac{\sin x}{x}$, it's a tug of war (the base shrinks towards 1 while the power grows) that settles on a famous constant.`,
            },
            {
              type: 'numeric',
              title: 'A stretched sine',
              prompt: r`Using $\lim_{u \to 0} \frac{\sin u}{u} = 1$, find $\displaystyle\lim_{x \to 0} \frac{\sin 3x}{x}$.`,
              answer: 3,
              wrong: [{ v: 1, why: r`Write $\frac{\sin 3x}{x} = 3 \cdot \frac{\sin 3x}{3x}$.` }, { v: 1 / 3, tol: 0.01, why: r`Multiply, don't divide: $\frac{\sin 3x}{x} = 3 \cdot \frac{\sin 3x}{3x}$.` }],
              explain: r`$\dfrac{\sin 3x}{x} = 3 \cdot \dfrac{\sin 3x}{3x}$. As $x \to 0$, $u = 3x \to 0$ too, so the fraction tends to 1 and the whole thing to 3. For small $x$, $\sin 3x \approx 3x$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Wild oscillation',
              body: r`Not every function settles down. $\sin\frac1x$ wiggles faster and faster as $x \to 0$. Multiplying by $x$ changes everything. Zoom in towards 0.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 1, ymin: -1.2, ymax: 1.2, grid: false, height: 300, axes: { ...XY, origin: false },
                params: {
                  z: { min: 0, max: 3, step: 0.05, value: 0, label: 'zoom', color: 'violet', format: (v) => `×${Math.round(10 ** v)}` },
                  w: { min: 0, max: 1, step: 1, value: 0, label: 'function', color: 'coral', format: (v) => (v ? 'x sin(1/x)' : 'sin(1/x)') },
                },
                curves: [
                  { f: (x, p) => { const X = x / 10 ** p.z; if (X === 0) return NaN; const y = p.w ? X * Math.sin(1 / X) : Math.sin(1 / X); return p.w ? y * 10 ** p.z : y; }, color: 'blue', width: 1.5, n: 3000 },
                  { f: (x, p) => (p.w ? Math.abs(x) : NaN), color: 'muted', dash: true },
                  { f: (x, p) => (p.w ? -Math.abs(x) : NaN), color: 'muted', dash: true },
                ],
                readout: (p) => (p.w ? `Showing $x \\sin(1/x)$ for $|x| < ${(1 / 10 ** p.z).toPrecision(2)}$ (stretched vertically by the same zoom): trapped between $\\pm|x|$.` : `Showing $\\sin(1/x)$ for $|x| < ${(1 / 10 ** p.z).toPrecision(2)}$: still swinging between $-1$ and $1$.`),
              },
              after: r`However far you zoom, $\sin\frac1x$ keeps swinging between $-1$ and $1$: it has **no limit** at 0. But $x \sin \frac1x$ is squeezed between $-|x|$ and $|x|$, so by the squeeze theorem $\lim_{x \to 0} x \sin\frac1x = 0$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which wins?',
              prompt: r`What is $\displaystyle\lim_{x \to \infty} \frac{x^{100}}{2^x}$?`,
              cols: 2,
              choices: [
                { t: '0', ok: true },
                { t: '∞', why: r`$x^{100}$ is huge for a while, but exponentials eventually outgrow every power.` },
                { t: '1', why: 'The two don’t grow at the same rate: the exponential wins.' },
              ],
              explain: r`Every exponential $b^x$ (with $b > 1$) eventually beats every power $x^n$. Each step from $x$ to $x + 1$ doubles $2^x$, but multiplies $x^{100}$ by only $\left(1 + \tfrac1x\right)^{100} \to 1$. So the ratio tends to **0**, although it first rises to astronomical heights.`,
            },
          ],
          recap: [
            r`$\lim_{x \to 0} \frac{\sin x}{x} = 1$, proved by the squeeze theorem.`,
            'At infinity, compare the leading terms.',
            'Exponentials outgrow every power.',
          ],
        },
      ],
    },
    {
      title: 'Continuity and Rigour',
      summary: 'No jumps, and precise definitions.',
      lessons: [
        {
          id: 'continuity',
          title: 'Continuity',
          summary: 'Drawing without lifting your pen',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'No breaks',
              body: r`A function is **continuous** at $a$ if its limit there equals its value: $\lim_{x \to a} f(x) = f(a)$. Informally, you can draw its graph through $a$ without lifting your pen.

Things that break continuity: a **hole** (a missing point), a **jump** (like $\tfrac{|x|}{x}$), or a **vertical asymptote** (like $\tfrac1x$ at 0). Polynomials, $\sin$, $\cos$ and $e^x$ are continuous everywhere.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hunting a root',
              body: r`$f(x) = x^3 - x - 1$ is negative at $x = 1$ and positive at $x = 2$. A continuous function can't get from negative to positive without crossing zero: that's the **intermediate value theorem**. To find the crossing, use **bisection**: check the midpoint, keep the half where the sign changes, and repeat.`,
              widget: {
                kind: 'graph', xmin: 0.8, xmax: 2.1, ymin: -2, ymax: 5.5, grid: 0.25, gridY: 1, height: 320, axes: XY,
                params: { k: { min: 0, max: 12, step: 1, value: 0, label: 'steps', color: 'violet', format: (v) => `${v}` } },
                curves: [{ f: cubic, color: 'blue' }],
                extra: ({ plot, p, s }) => {
                  const [a, b] = bisect(p.k);
                  return [
                    s('rect', { x: plot.X(a), y: plot.Y(5.5), width: Math.max(2, plot.X(b) - plot.X(a)), height: plot.Y(-2) - plot.Y(5.5), class: 'fl-amber', opacity: 0.25 }),
                    s('circle', { cx: plot.X(a), cy: plot.Y(cubic(a)), r: 6, class: 'fl-coral' }),
                    s('circle', { cx: plot.X(b), cy: plot.Y(cubic(b)), r: 6, class: 'fl-teal' }),
                  ];
                },
                readout: (p) => {
                  const [a, b] = bisect(p.k);
                  return r`root is in $[${f4(a)}, ${f4(b)}]$, width $${(b - a).toPrecision(3)}$`;
                },
              },
              after: r`Each step halves the interval. After 10 steps it's narrower than $\tfrac{1}{1000}$. The root is $1.3247\ldots$ (the "plastic number"). Bisection is slow but guaranteed to work, all thanks to continuity.`,
            },
            {
              type: 'numeric',
              title: 'How narrow?',
              prompt: r`Bisection starts with an interval of width 1. How wide is it after 3 steps?`,
              answer: 0.125,
              wrong: [{ v: 0.333, tol: 0.01, why: 'Each step halves the interval, not divides it into thirds.' }, { v: 0.5, why: r`That's after one step. After three: $\left(\frac12\right)^3$.` }],
              explain: r`$1 \times \tfrac12 \times \tfrac12 \times \tfrac12 = \tfrac18 = 0.125$.`,
            },
            {
              type: 'interactive',
              title: 'Join the pieces',
              body: r`A function is defined in two pieces: $f(x) = x^2$ for $x < 1$, and $f(x) = ax - 1$ for $x \ge 1$. Choose $a$ so the pieces meet and $f$ is continuous.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 3, ymin: -3.5, ymax: 5, grid: 1, height: 320, axes: XY,
                params: { a: { min: -2, max: 4, step: 0.1, value: 0.5, label: '$a$', color: 'coral', format: (v) => v.toFixed(1) } },
                curves: [{ f: (x) => x * x, to: 1, color: 'blue', width: 3 }, { f: (x, p) => p.a * x - 1, from: 1, color: 'coral', width: 3 }],
                extra: ({ plot, p, s }) => [
                  s('circle', { cx: plot.X(1), cy: plot.Y(1), r: 6, class: 'fl-card', stroke: 'var(--blue)', 'stroke-width': 3 }),
                  s('circle', { cx: plot.X(1), cy: plot.Y(p.a - 1), r: 6, class: 'fl-coral' }),
                ],
                readout: (p) => (Math.abs(p.a - 2) < 1e-9 ? 'The pieces meet at $(1, 1)$: **continuous**.' : `Jump at $x = 1$: from $1$ to $${(p.a - 1).toFixed(1)}$.`),
                goal: (p) => Math.abs(p.a - 2) < 1e-9,
                hint: r`At $x = 1$ the left piece approaches $1^2 = 1$. Make $a \cdot 1 - 1$ equal to 1.`,
                solution: { a: 2 },
              },
              explain: r`Continuity at 1 needs $\lim_{x \to 1^-} x^2 = 1$ to equal $f(1) = a - 1$, so $a = 2$. (With $a = 2$ the pieces even meet at the same slope, since $x^2$ has slope 2 at $x = 1$: the join is smooth, not just continuous.)`,
            },
            {
              type: 'mcq',
              title: 'cos x = x',
              prompt: r`Does the equation $\cos x = x$ have a solution between $0$ and $1$?`,
              choices: [
                { t: 'Yes: g(x) = cos x − x is positive at 0 and negative at 1', ok: true },
                { t: 'No: cos x is never equal to x', why: r`Try $g(x) = \cos x - x$: $g(0) = 1 > 0$ and $g(1) = \cos 1 - 1 \approx -0.46 < 0$.` },
                { t: 'We can’t know without solving it exactly', why: 'The intermediate value theorem guarantees a solution without finding it.' },
              ],
              explain: r`$g(x) = \cos x - x$ is continuous with $g(0) = 1$ and $g(1) \approx -0.46$, so it crosses 0 in between, at $x \approx 0.739$. (Press "cos" repeatedly on a calculator in radian mode and you'll converge to it.) Existence proofs like this, without a formula, are typical of continuity arguments.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Opposite points',
              prompt: r`Is there always a pair of points on opposite sides of the equator (directly through the Earth from each other) with exactly the same temperature, assuming temperature varies continuously?`,
              choices: [
                { t: 'Yes, always', ok: true },
                { t: 'Only by coincidence', why: 'Consider the temperature difference between a point and its opposite as you go around the equator.' },
                { t: 'No: one hemisphere is always warmer', why: 'Even so, the difference between opposite points must change sign somewhere along the equator.' },
              ],
              explain: r`Let $d(\theta)$ be the temperature at angle $\theta$ minus the temperature at the opposite point. Going halfway around swaps the two points, so $d$ changes sign: $d(\theta + 180°) = -d(\theta)$. By the intermediate value theorem, $d = 0$ somewhere in between. A clever use of continuity, with no measurements needed!`,
            },
          ],
          recap: [
            r`Continuous at $a$: $\lim_{x \to a} f(x) = f(a)$.`,
            'Intermediate value theorem: a continuous function that changes sign must cross zero.',
            'Bisection uses this to trap a root, halving the interval each step.',
          ],
        },
        {
          id: 'epsilon-delta',
          title: 'Epsilon and Delta',
          summary: 'Making “close” precise',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A challenge game',
              body: r`For 150 years, calculus ran on intuition about "getting close". In the 1800s, Cauchy and Weierstrass made it precise with a **challenge game**:

- A skeptic picks any tolerance $\varepsilon > 0$ (epsilon): "get $f(x)$ within $\varepsilon$ of $L$."
- You must answer with a $\delta > 0$ (delta): "keep $x$ within $\delta$ of $a$ (but not equal to it), and you'll be within $\varepsilon$."

If you can always win, however small $\varepsilon$ is, then $\lim_{x \to a} f(x) = L$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Win the game',
              prompt: r`$f(x) = 2x + 1$ approaches $L = 3$ as $x \to 1$. The skeptic picks $\varepsilon = 0.5$ (the green band). Choose a $\delta$ so that the part of the graph above $(1 - \delta,\ 1 + \delta)$ stays inside the band.`,
              widget: {
                kind: 'graph', xmin: -0.2, xmax: 2.2, ymin: 1.4, ymax: 4.6, grid: 0.5, axes: XY, height: 340,
                params: { d: { min: 0.05, max: 0.8, step: 0.05, value: 0.6, label: r`$\delta$`, color: 'blue', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => 2 * x + 1, color: 'ink' }],
                extra: ({ plot, p, s }) => {
                  const ok = 2 * p.d <= 0.5 + 1e-9;
                  return [
                    s('rect', { x: plot.X(-0.2), y: plot.Y(3.5), width: plot.X(2.2) - plot.X(-0.2), height: plot.Y(2.5) - plot.Y(3.5), class: 'fl-green', opacity: 0.18 }),
                    s('rect', { x: plot.X(1 - p.d), y: plot.Y(4.6), width: plot.X(1 + p.d) - plot.X(1 - p.d), height: plot.Y(1.4) - plot.Y(4.6), class: 'fl-blue', opacity: 0.12 }),
                    s('line', { x1: plot.X(1 - p.d), x2: plot.X(1 + p.d), y1: plot.Y(1 + 2 * (1 - p.d)), y2: plot.Y(1 + 2 * (1 + p.d)), stroke: ok ? 'var(--success)' : 'var(--coral)', 'stroke-width': 6, 'stroke-linecap': 'round' }),
                  ];
                },
                readout: (p) => (2 * p.d <= 0.5 + 1e-9 ? r`For $|x - 1| < ${p.d.toFixed(2)}$: $f(x)$ stays within $(${f2(3 - 2 * p.d)}, ${f2(3 + 2 * p.d)})$, inside the band ✓` : r`For $|x - 1| < ${p.d.toFixed(2)}$: $f(x)$ ranges over $(${f2(3 - 2 * p.d)}, ${f2(3 + 2 * p.d)})$, which leaves the band ✗`),
                goal: (p) => 2 * p.d <= 0.5 + 1e-9,
                hint: 'The line has slope 2, so f changes twice as fast as x.',
                solution: { d: 0.25 },
              },
              explain: r`Since $|f(x) - 3| = |2x - 2| = 2|x - 1|$, we need $2\delta \le 0.5$, so any $\delta \le 0.25$ wins. In general, for **any** $\varepsilon$ the answer $\delta = \varepsilon/2$ works, so the limit really is 3.`,
            },
            {
              type: 'interactive',
              title: 'A curved graph',
              body: r`Now $f(x) = x^2$, with limit $L = 1$ as $x \to 1$, and the skeptic picks $\varepsilon = 0.3$. Find a $\delta$ that wins. Watch out: the curve is steeper on the right.`,
              widget: {
                kind: 'graph', xmin: 0.4, xmax: 1.6, ymin: 0.3, ymax: 2, grid: 0.2, axes: XY, height: 340,
                params: { d: { min: 0.02, max: 0.4, step: 0.01, value: 0.3, label: r`$\delta$`, color: 'blue', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => x * x, color: 'ink' }, { f: (x) => x * x, from: (p) => 1 - p.d, to: (p) => 1 + p.d, color: 'coral', width: 6 }],
                extra: ({ plot, p, s }) => [
                  s('rect', { x: plot.X(0.4), y: plot.Y(1.3), width: plot.X(1.6) - plot.X(0.4), height: plot.Y(0.7) - plot.Y(1.3), class: 'fl-green', opacity: 0.18 }),
                  s('rect', { x: plot.X(1 - p.d), y: plot.Y(2), width: plot.X(1 + p.d) - plot.X(1 - p.d), height: plot.Y(0.3) - plot.Y(2), class: 'fl-blue', opacity: 0.12 }),
                ],
                readout: (p) => { const lo = (1 - p.d) ** 2, hi = (1 + p.d) ** 2, ok = hi <= 1.3 + 1e-9 && lo >= 0.7 - 1e-9; return r`For $|x - 1| < ${p.d.toFixed(2)}$: $f(x)$ is between $${f4(lo)}$ and $${f4(hi)}$ ${ok ? '✓' : '✗'}`; },
                goal: (p) => (1 + p.d) ** 2 <= 1.3 + 1e-9,
                hint: r`The right side is the tight one: you need $(1 + \delta)^2 \le 1.3$.`,
                solution: { d: 0.14 },
              },
              explain: r`On the left, $(1 - \delta)^2 \ge 0.7$ allows $\delta$ up to $0.163$; on the right, $(1 + \delta)^2 \le 1.3$ needs $\delta \le \sqrt{1.3} - 1 \approx 0.140$. The steeper side decides, so any $\delta \le 0.14$ wins. For curves, the best $\delta$ depends on the shape near the point, not just on $\varepsilon$.`,
            },
            {
              type: 'mcq',
              title: 'An unwinnable game',
              prompt: r`For the jump function $\frac{|x|}{x}$ near 0, someone claims the limit is $L = 1$. The skeptic picks $\varepsilon = 0.5$. Can you find a $\delta$?`,
              choices: [
                { t: 'No: every interval around 0 contains negative x, where the function is −1', ok: true },
                { t: 'Yes: a tiny δ like 0.001 works', why: r`Even within $0.001$ of 0, the negative values of $x$ give $-1$, which is 2 away from $L = 1$.` },
                { t: 'Yes, but only for δ > 1', why: 'Bigger δ only includes more negative x.' },
              ],
              explain: r`Any interval around 0 includes negative $x$, where the function is $-1$, a distance 2 from $L = 1$. So no $\delta$ beats $\varepsilon = 0.5$, and the claim fails. The same happens for every candidate $L$: that's what "the limit doesn't exist" means precisely.`,
            },
            {
              type: 'numeric',
              title: 'A steeper line',
              prompt: r`For $f(x) = 5x$ near $x = 1$, how small must $\delta$ be to guarantee $|f(x) - 5| < 0.1$ whenever $|x - 1| < \delta$? (Give the largest such $\delta$.)`,
              answer: 0.02,
              tol: 0.0001,
              explain: r`$|5x - 5| = 5|x - 1| < 0.1$ needs $|x - 1| < 0.02$. For a line of slope $m$, $\delta = \frac{\varepsilon}{|m|}$ always works: steeper lines need tighter $\delta$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A lopsided curve',
              prompt: r`For $f(x) = \frac1x$ near $x = 1$ (limit 1), the skeptic picks $\varepsilon = 0.1$. What is the **largest** $\delta$ that guarantees $|f(x) - 1| < \varepsilon$? (3 decimal places.)`,
              lhs: r`$\delta =$`,
              answer: 1 / 11,
              tol: 0.0005,
              wrong: [{ v: 0.1, tol: 0.0005, why: r`That works on the right of 1 (it's even generous there), but on the left $\frac1x$ climbs faster: $\frac{1}{0.9} \approx 1.111$ is outside the band.` }, { v: 1 / 9, tol: 0.0005, why: r`That's the limit on the right side. The left side, where the curve is steeper, is stricter.` }],
              explain: r`On the left, $\frac1x < 1.1$ needs $x > \frac{1}{1.1} \approx 0.9091$, so $\delta \le 0.0909$. On the right, $\frac1x > 0.9$ needs $x < \frac{1}{0.9} \approx 1.111$, so $\delta \le 0.111$. The stricter side wins: $\delta = \frac{1}{11} \approx 0.091$. As with $x^2$, the steeper side of the curve sets the answer.`,
            },
          ],
          recap: [
            r`$\lim_{x \to a} f(x) = L$: for every $\varepsilon > 0$ there's a $\delta > 0$ with $|f(x) - L| < \varepsilon$ whenever $0 < |x - a| < \delta$.`,
            r`For a line of slope $m$, $\delta = \varepsilon / |m|$ works.`,
            'The ε–δ definition turned intuition about “closeness” into rigorous mathematics.',
          ],
        },
      ],
    },
    {
      title: 'Limits of Sequences',
      summary: 'Endless lists, and squeezing π.',
      lessons: [
        {
          id: 'sequences',
          title: 'Sequences',
          summary: 'Where does a list end up?',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Halving forever',
              prompt: r`The sequence $1, \tfrac12, \tfrac14, \tfrac18, \ldots$ keeps halving. What number do its terms approach?`,
              answer: 0,
              wrong: [{ v: 2, why: 'That’s what their **sum** approaches. The terms themselves get smaller and smaller.' }],
              explain: r`The terms $\frac{1}{2^n}$ get as close to 0 as you like (though never reach it), so the sequence **converges** to 0. Careful: the **sum** $1 + \frac12 + \frac14 + \cdots$ approaches 2, a different question (see the Sequences & Series course).`,
            },
            {
              type: 'explain',
              title: 'Converging sequences',
              body: r`A sequence $a_1, a_2, a_3, \ldots$ **converges** to $L$ if its terms eventually stay as close to $L$ as anyone demands. It's the same challenge game as before, with a whole number $N$ instead of $\delta$:

::: key
$a_n \to L$ if for every $\varepsilon > 0$ there is an $N$ such that $|a_n - L| < \varepsilon$ for **all** $n \ge N$.
:::

"Eventually" matters: the first million terms can do anything. Only the tail counts.`,
            },
            {
              type: 'interactive',
              title: 'Find N',
              body: r`The sequence $a_n = 1 + \dfrac{(-1)^n}{n}$ hops from one side of 1 to the other: $0, 1.5, 0.67, 1.25, \ldots$ The skeptic picks $\varepsilon = 0.05$ (the green band). Find the **smallest** $N$ such that every term from $a_N$ onwards lies inside the band.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 41, ymin: 0.5, ymax: 1.6, grid: false, height: 300, padL: 46, axes: { xlabel: 'n', ylabel: 'aₙ', xticks: 5, yticks: 0.25, yAt: 0.5 },
                params: { N: { min: 1, max: 40, step: 1, value: 10, label: '$N$', color: 'violet' } },
                extra: ({ plot, p, s }) => [
                  s('rect', { x: plot.X(0), y: plot.Y(1.05), width: plot.X(41) - plot.X(0), height: plot.Y(0.95) - plot.Y(1.05), class: 'fl-green', opacity: 0.2 }),
                  s('line', { x1: plot.X(p.N - 0.5), x2: plot.X(p.N - 0.5), y1: plot.Y(0.5), y2: plot.Y(1.6), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }),
                  ...Array.from({ length: 40 }, (_, i) => i + 1).filter((n) => seqA(n) > 0.5).map((n) => s('circle', { cx: plot.X(n), cy: plot.Y(seqA(n)), r: 4, class: n >= p.N ? (Math.abs(seqA(n) - 1) < 0.05 ? 'fl-green' : 'fl-coral') : 'fl-muted' })),
                ],
                readout: (p) => { const bad = []; for (let n = p.N; n <= 1000; n++) if (Math.abs(seqA(n) - 1) >= 0.05) bad.push(n); return bad.length ? `From $n = ${p.N}$ on, ${bad.length} term${bad.length > 1 ? 's are' : ' is'} still outside the band (first: $a_{${bad[0]}}$).` : `Every term from $a_{${p.N}}$ on is inside the band.`; },
                goal: (p) => p.N === 21,
                hint: r`$|a_n - 1| = \frac1n$. When is $\frac1n < 0.05$?`,
                solution: { N: 21 },
              },
              explain: r`$|a_n - 1| = \frac1n < 0.05$ exactly when $n > 20$, so $N = 21$. For any $\varepsilon$, $N = \lceil 1/\varepsilon \rceil + 1$ works, so $a_n \to 1$. (At $N = 20$, the term $a_{20} = 1.05$ sits exactly on the edge of the band, which doesn't count as inside.)`,
            },
            {
              type: 'mcq',
              title: 'Flip-flop',
              prompt: r`Does the sequence $(-1)^n = -1, 1, -1, 1, \ldots$ converge?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes, to 0', why: r`The terms are never near 0: they're always at distance 1 from it.` },
              ],
              explain: r`Whatever $L$ you propose, choose $\varepsilon = 0.5$: the terms keep landing on both $-1$ and $1$, which can't both be within $0.5$ of $L$. A sequence can be **bounded** without converging.`,
            },
            {
              type: 'numeric',
              title: 'Leading terms',
              prompt: r`Find the limit of $a_n = \dfrac{2n + 1}{n + 3}$ as $n \to \infty$.`,
              answer: 2,
              wrong: [{ v: 1 / 3, tol: 0.01, why: 'For large n the constants hardly matter. Compare the n terms.' }, { v: 0.5, why: 'Upside down: the numerator is about 2n and the denominator about n.' }],
              explain: r`Divide top and bottom by $n$: $\dfrac{2 + 1/n}{1 + 3/n} \to \dfrac{2}{1} = 2$. For example $a_{1000} = \frac{2001}{1003} \approx 1.995$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Always growing, never escaping',
              prompt: 'A sequence keeps increasing, but never goes above 10. What can we conclude?',
              choices: [
                { t: 'It converges, to some number no bigger than 10', ok: true },
                { t: 'It must converge to exactly 10', why: r`It could level off earlier: $3 - \frac1n$ increases, stays below 10, and converges to 3.` },
                { t: 'It might keep wobbling without settling', why: 'An increasing sequence never comes back down, and with a ceiling it has to pile up somewhere.' },
              ],
              explain: r`An increasing sequence with an upper bound converges to its smallest upper bound: the **monotone convergence theorem**. It's one way to state the completeness of the real numbers, which have no "gaps". In the rationals it fails: $1, 1.4, 1.41, 1.414, \ldots$ increases towards $\sqrt2$, which isn't rational.`,
            },
          ],
          recap: [
            r`$a_n \to L$: for every $\varepsilon > 0$ there's an $N$ with $|a_n - L| < \varepsilon$ for all $n \ge N$.`,
            'Bounded sequences can fail to converge, like (−1)ⁿ.',
            'An increasing sequence with an upper bound always converges (monotone convergence).',
          ],
        },
        {
          id: 'archimedes',
          title: 'Squeezing π',
          summary: 'Archimedes’ limit',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A hexagon inside',
              body: r`A regular hexagon fits inside a circle of radius 1, with its corners on the circle. Its six sides each have length 1 (it's made of six equilateral triangles).`,
              prompt: r`What does this tell us about $\pi$? (The circle's circumference is $2\pi$.)`,
              choices: [
                { t: r`$\pi > 3$, since the hexagon's perimeter, 6, is shorter than the circle's`, ok: true },
                { t: r`$\pi = 3$`, why: 'The hexagon cuts corners, so its perimeter is strictly less than the circle’s.' },
                { t: r`$\pi < 3$`, why: r`The hexagon is inside the circle, so its perimeter $6$ is less than $2\pi$.` },
              ],
              explain: r`Perimeter $6 < 2\pi$, so $\pi > 3$. A polygon **outside** the circle gives an upper bound in the same way. Squeezing $\pi$ between the two is how Archimedes computed it around 250 BC.`,
            },
            {
              type: 'interactive',
              title: 'More and more sides',
              body: r`Inside and outside polygons with $n$ sides squeeze the circle. Half their perimeters give lower and upper bounds for $\pi$. Add sides until the bounds are less than $0.01$ apart.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 400,
                params: { n: { min: 3, max: 100, step: 1, value: 6, label: 'sides', color: 'blue' } },
                extra: ({ plot, p, s }) => {
                  const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('');
                  return [
                    s('path', { d: path(polyPts(p.n, 1 / Math.cos(Math.PI / p.n), Math.PI / 2)), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2 }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                    s('path', { d: path(polyPts(p.n, 1, Math.PI / 2)), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2 }),
                  ];
                },
                readout: (p) => { const lo = p.n * Math.sin(Math.PI / p.n), hi = p.n * Math.tan(Math.PI / p.n); return r`$${lo.toFixed(5)} < \pi < ${hi.toFixed(5)}$, gap $${(hi - lo).toFixed(5)}$`; },
                goal: (p) => p.n * (Math.tan(Math.PI / p.n) - Math.sin(Math.PI / p.n)) < 0.01,
                hint: 'Doubling the sides cuts the gap to about a quarter. Try around 40.',
                solution: { n: 40 },
              },
              explain: r`With 40 sides, $3.1384 < \pi < 3.1481$. The gap shrinks like $\frac{1}{n^2}$: double the sides and it falls to about a quarter. Both bounds converge to the same limit, and that limit **is** $\pi$, half the circumference of the unit circle.`,
            },
            {
              type: 'numeric',
              title: 'The outside hexagon',
              prompt: r`A regular hexagon drawn around a circle of radius 1 has perimeter $4\sqrt3$. What upper bound does it give for $\pi$? (3 decimal places.)`,
              answer: 2 * Math.sqrt(3),
              tol: 0.001,
              wrong: [{ v: 4 * Math.sqrt(3), tol: 0.002, why: r`The circumference is $2\pi$, so $\pi$ is less than **half** the perimeter.` }],
              explain: r`$2\pi < 4\sqrt3$, so $\pi < 2\sqrt3 \approx 3.464$. So $3 < \pi < 3.464$ from hexagons alone.`,
            },
            {
              type: 'explain',
              title: 'Archimedes’ 96-gon',
              body: r`Archimedes didn't have trigonometry or decimals. Starting from hexagons, he found a way to compute the perimeter of a polygon with **twice** as many sides from the one before, using only square roots (which he estimated by hand as fractions). He went from 6 sides to 12, 24, 48 and finally **96**, and proved
$$3\tfrac{10}{71} < \pi < 3\tfrac17,$$
that is, $3.1408 < \pi < 3.1429$. This was the best estimate of $\pi$ for centuries, and it's an early example of a limit: a quantity pinned down by an endless sequence of better and better approximations.`,
            },
            {
              type: 'numeric',
              title: 'Archimedes’ gap',
              prompt: r`How wide is the interval $3\tfrac{10}{71} < \pi < 3\tfrac17$? (4 decimal places.)`,
              answer: 1 / 7 - 10 / 71,
              tol: 0.0001,
              wrong: [{ v: 0.1429, tol: 0.0002, why: r`Subtract the two bounds: $\frac17 - \frac{10}{71}$.` }],
              explain: r`$\frac17 - \frac{10}{71} = \frac{71 - 70}{497} = \frac{1}{497} \approx 0.0020$. The upper bound, $\frac{22}{7}$, is still a popular approximation of $\pi$ today.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The staircase paradox',
              body: r`Walk from one corner of a unit square to the opposite corner along a staircase of $n$ tiny steps, each going right then up. As $n$ grows, the staircase hugs the diagonal more and more closely.`,
              prompt: r`What happens to the staircase's length?`,
              choices: [
                { t: r`It stays exactly 2, even though the staircase approaches the diagonal, of length $\sqrt2$`, ok: true },
                { t: r`It approaches $\sqrt2$, the diagonal's length`, why: 'Add up the steps: n steps right of 1/n each, and n steps up of 1/n each. That’s 2, whatever n is.' },
                { t: 'It grows without limit', why: 'There are more steps, but each is smaller: the total right-moves and up-moves are each exactly 1.' },
              ],
              explain: r`The horizontal pieces always add to 1 and the vertical pieces to 1, so the length is 2 for every $n$, even though the staircase's **shape** approaches the diagonal. The limit of the lengths (2) is not the length of the limit ($\sqrt2$). Archimedes' polygons work because they also approach the circle's **direction** at every point; staircases never do. Limits must be handled with care.`,
            },
          ],
          recap: [
            'Inside and outside polygons squeeze π from both sides.',
            'Archimedes used 96-gons: 3 10/71 < π < 3 1/7.',
            'The limit of the lengths need not equal the length of the limit (the staircase paradox).',
          ],
        },
        {
          id: 'infinity-limits',
          title: 'Limits at Infinity',
          summary: 'Where functions settle down',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'What happens far out?',
              body: r`We write $\lim_{x \to \infty} f(x) = L$ if $f(x)$ gets as close as we like to $L$ once $x$ is large enough. Graphically, the curve approaches the horizontal line $y = L$: a **horizontal asymptote**.

For a fraction of polynomials, only the **leading terms** matter far out. For example
$$\frac{3x^2 + x}{x^2 + 1} = \frac{3 + \frac1x}{1 + \frac{1}{x^2}} \to \frac{3}{1} = 3.$$`,
            },
            {
              type: 'numeric',
              title: 'Leading terms',
              prompt: r`Find $\lim_{x \to \infty} \dfrac{6x^3 - 4x}{3x^3 + 7}$.`,
              answer: 2,
              wrong: [{ v: 0, why: r`Top and bottom both grow like $x^3$, so their ratio settles at a finite, non-zero value.` }],
              explain: r`Divide top and bottom by $x^3$: $\frac{6 - 4/x^2}{3 + 7/x^3} \to \frac63 = 2$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Close enough?',
              prompt: r`$f(x) = \dfrac{3x^2 + x}{x^2 + 1}$ approaches 3. Find the point beyond which $f(x)$ stays within **0.01** of 3 forever.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 200, ymin: 2.9, ymax: 3.2, grid: false, height: 260, axes: { xlabel: 'x', yticks: 0.05, xticks: 25, yAt: 2.9 },
                params: { x: { min: 1, max: 200, step: 0.1, value: 30, label: 'x', color: 'coral', format: (v) => v.toFixed(1) } },
                curves: [{ f: (x) => (3 * x * x + x) / (x * x + 1), color: 'violet', width: 3, from: 1 }, { f: () => 3.01, color: 'teal', dash: true }, { f: () => 2.99, color: 'teal', dash: true }],
                points: [{ x: (p) => p.x, y: (p) => Math.min(3.2, (3 * p.x * p.x + p.x) / (p.x * p.x + 1)), color: 'coral' }],
                readout: (p) => { const f = (3 * p.x * p.x + p.x) / (p.x * p.x + 1); return `f(${p.x.toFixed(1)}) = ${f.toFixed(4)} · distance from 3: **${Math.abs(f - 3).toFixed(4)}**`; },
                goal: (p) => p.x >= 96.85 && p.x <= 97.05,
                hint: r`$f(x) - 3 = \frac{x - 3}{x^2 + 1}$. Solve $\frac{x - 3}{x^2 + 1} = 0.01$.`,
                solution: { x: 96.9 },
              },
              explain: r`$f(x) - 3 = \frac{x - 3}{x^2 + 1}$, which falls below 0.01 once $x^2 - 100x + 301 > 0$, that is for $x > 96.9$. This is exactly the $\varepsilon$–$N$ definition of a limit: for the tolerance $\varepsilon = 0.01$ we found $N \approx 97$. A smaller tolerance would need a larger $N$, but one always exists.`,
            },
            {
              type: 'mcq',
              title: 'Which goes where?',
              prompt: r`As $x \to \infty$, what happens to $\dfrac{2x}{x^2 + 1}$?`,
              choices: [
                { t: 'It tends to 0', ok: true },
                { t: 'It tends to 2', why: r`The bottom has the higher power: $\frac{2x}{x^2} = \frac2x \to 0$.` },
                { t: 'It grows without limit', why: 'The denominator grows faster than the numerator.' },
              ],
              explain: r`When the denominator has the higher degree, the limit is 0; equal degrees give the ratio of leading coefficients; a higher degree on top means no finite limit (it grows without bound).`,
            },
            {
              type: 'numeric',
              title: 'An asymptote',
              prompt: r`What horizontal asymptote does $y = \dfrac{5x - 2}{2x + 7}$ approach?`,
              answer: 2.5,
              tol: 0.001,
              explain: r`Equal degrees: the ratio of leading coefficients, $\frac52 = 2.5$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A difference of large numbers',
              prompt: r`Find $\lim_{x \to \infty} \left(\sqrt{x^2 + 6x} - x\right)$.`,
              answer: 3,
              wrong: [{ v: 0, why: r`Both terms grow, but their difference doesn’t vanish. Multiply by $\frac{\sqrt{x^2 + 6x} + x}{\sqrt{x^2 + 6x} + x}$.` }, { v: 6, why: r`After rationalising you get $\frac{6x}{\sqrt{x^2 + 6x} + x}$, and the bottom is about $2x$.` }],
              explain: r`Multiply by the conjugate: $\frac{(x^2 + 6x) - x^2}{\sqrt{x^2 + 6x} + x} = \frac{6x}{\sqrt{x^2 + 6x} + x} = \frac{6}{\sqrt{1 + 6/x} + 1} \to \frac{6}{2} = 3$.`,
            },
          ],
          recap: [
            'A limit at infinity describes where f(x) settles for large x: a horizontal asymptote.',
            'For rational functions, compare the leading terms.',
            'ε–N: for any tolerance, beyond some N the function stays that close.',
          ],
        },
      ],
    },
  ],
};
