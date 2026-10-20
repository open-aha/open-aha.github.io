import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed d decimals, so they never change length (DESIGN.md, Live numbers)
const f3 = (v, d = 3) => fix(v, d);
const XY = { xlabel: 'x', ylabel: 'y' };
const sq = (x) => x * x;
const cubic = (x) => (x * x * x) / 3 - x; // f'(x) = x² − 1
const dcubic = (x) => x * x - 1;

// tangent line through (a, f(a)) with slope m, drawn across the plot
const tangent = (f, df) => (x, p) => f(p.a) + df(p.a) * (x - p.a);

// slope of b^x at x = 0, estimated with a tiny step
const slopeAt0 = (b) => (b ** 1e-6 - 1) / 1e-6;

// f(x) = x³ − 3x² + 1: peak at 0, valley at 2, and it bends the other way at x = 1
const hill = (x) => x ** 3 - 3 * x * x + 1;
const dhill = (x) => 3 * x * x - 6 * x;

export default {
  id: 'derivatives',
  subject: 'math',
  title: 'Calculus: Derivatives',
  level: 'Advanced',
  cover: 'calculus',
  tagline: 'Zoom in until curves look straight, measure change at an instant, and meet e.',
  description: r`How fast is something changing **right now**? Shrink secant lines into tangents, discover the power rule, read the shape of a graph from its slope, discover why $e$ is special, master the product and chain rules, and use derivatives to find the best possible answer to real problems.`,
  prereq: 'Functions & Graphs',
  chapters: [
    {
      title: 'The Idea of a Derivative',
      summary: 'From average change to change at an instant.',
      lessons: [
        {
          id: 'instantaneous',
          title: 'Speed at an Instant',
          summary: 'Secants shrink into tangents',
          icon: 'clock',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Average speed',
              body: r`A ball rolls down a ramp. After $t$ seconds it has travelled $d(t) = t^2$ metres.`,
              prompt: 'What is its average speed between t = 1 s and t = 3 s?',
              unit: 'm/s',
              answer: 4,
              wrong: [
                { v: 8, why: 'That’s the distance covered (9 − 1). Divide by the time taken.' },
                { v: 3, why: r`Average speed is the change in distance over the change in time: $\frac{9 - 1}{3 - 1}$.` },
              ],
              explain: r`It travels from $d(1) = 1$ m to $d(3) = 9$ m: 8 m in 2 s, an average of 4 m/s.`,
            },
            {
              type: 'mcq',
              title: 'Right now',
              prompt: 'A speedometer shows your speed at one instant. How could you work out the ball’s speed at exactly t = 1 s from the formula?',
              choices: [
                { t: 'Find the average speed over shorter and shorter time intervals starting at t = 1', ok: true },
                { t: 'Divide the distance by the time: d(1) ÷ 1', why: 'That’s the average speed from t = 0 to t = 1. The ball was speeding up, so it’s not the speed at t = 1.' },
                { t: 'It can’t be done: speed needs a time interval', why: 'It can be done, by seeing what the average speed approaches as the interval shrinks. That’s the big idea of calculus.' },
              ],
              explain: r`Over a single instant, distance and time are both zero, and $\frac{0}{0}$ tells us nothing. But we can look at average speeds over shorter and shorter intervals and see what number they **approach**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Shrink the interval',
              body: r`The {violet:secant line} connects the points at $t = 1$ and $t = 1 + h$. Its slope is the average speed over that interval. Shrink $h$ toward 0.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 3.5, ymin: -1, ymax: 9.5, grid: 0.5, gridY: 1, height: 360, axes: { xlabel: 't', ylabel: 'd' },
                params: { h: { min: 0.01, max: 2, step: 0.01, value: 2, label: '$h$', color: 'violet' } },
                curves: [
                  { f: sq, color: 'blue' },
                  { f: (x, p) => 1 + ((sq(1 + p.h) - 1) / p.h) * (x - 1), color: 'violet', width: 2.5 },
                ],
                points: [{ x: () => 1, y: () => 1, color: 'blue' }, { x: (p) => 1 + p.h, y: (p) => sq(1 + p.h), color: 'violet' }],
                readout: (p) => r`slope $= \dfrac{(1 + h)^2 - 1^2}{h} = ${f3((sq(1 + p.h) - 1) / p.h)}$`,
              },
              after: r`As $h \to 0$, the slope approaches **2**, and the secant line becomes the **tangent** line, which just touches the curve at $t = 1$. The ball's speed at that instant is 2 m/s.`,
            },
            {
              type: 'explain',
              title: 'Why it approaches 2',
              body: r`Do the algebra for a general $h$:
$$\frac{(1 + h)^2 - 1}{h} = \frac{1 + 2h + h^2 - 1}{h} = \frac{2h + h^2}{h} = 2 + h$$
As $h$ shrinks to 0, $2 + h$ gets as close to 2 as we like. We write
$$\lim_{h \to 0} \frac{(1 + h)^2 - 1}{h} = 2.$$
This **limit** is the slope of the tangent line, the **instantaneous rate of change**.`,
            },
            { /*anim:derivatives*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Zoom until it’s straight',
              body: r`Here is the {blue:graph of $d(t) = t^2$} around the point $(1, 1)$, with the {violet:line of slope 2} through it. We zoom in on the point, keeping the same scale on both axes.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 1, ymin: -1, ymax: 1, grid: false, axes: false, maxWidth: 360, clipExtra: true,
                animate: { param: 't', speed: 1, max: 8, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const u = Math.min(1, Math.max(0, (p.t - 0.6) / 6)), w = 1.5 * 1000 ** -u, pts = [], els = [];
                  // screen coordinates: (t - 1) / w across, (t² - 1) / w up
                  for (let i = 0; i <= 160; i++) { const X = -1.1 + (2.2 * i) / 160, tt = 1 + X * w; pts.push(`${i ? 'L' : 'M'}${plot.X(X).toFixed(1)} ${plot.Y((tt * tt - 1) / w).toFixed(1)}`); }
                  els.push(s('line', { x1: plot.X(-1), x2: plot.X(1), y1: plot.Y(-2), y2: plot.Y(2), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '7 5' }));
                  els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5.5, class: 'fl-coral' }));
                  els.push(s('rect', { x: plot.X(-1), y: plot.Y(1), width: plot.X(1) - plot.X(-1), height: plot.Y(-1) - plot.Y(1), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5 }));
                  return els;
                },
                readout: (p) => { const u = Math.min(1, Math.max(0, (p.t - 0.6) / 6)), w = 1.5 * 1000 ** -u; return `zoom ×${fix(1.5 / w, 0)} · showing $t$ from ${fix(1 - w, 4)} to ${fix(1 + w, 4)}`; },
              },
              after: r`At first the curve bends visibly away from the line. Zoom in 100 times and it's hard to tell them apart; at 1000 times they're the same line. A smooth curve, looked at closely enough, **is** a straight line, and the derivative is that line's slope. Not every graph does this: $|t|$ has a corner at 0 that stays a corner however far you zoom, so it has no derivative there.`,
            },
            {
              type: 'numeric',
              title: 'At t = 3',
              prompt: r`Using the same method, what is the ball's speed at exactly $t = 3$ s? (Hint: simplify $\frac{(3 + h)^2 - 9}{h}$.)`,
              unit: 'm/s',
              answer: 6,
              wrong: [
                { v: 9, why: r`That's the distance at $t = 3$. You want the slope there.` },
                { v: 4, why: 'That’s the average speed from 1 to 3 s. The ball is going faster by t = 3.' },
                { v: 3, why: r`That's $d(3)/3$, the average speed from $t = 0$. You need the limit as $h \to 0$.` },
              ],
              explain: r`$\frac{(3 + h)^2 - 9}{h} = \frac{6h + h^2}{h} = 6 + h \to 6$ m/s.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Find the flat spot',
              body: r`Drag the point along $y = x^2 - 4x + 5$. The line shows the tangent at that point. Find where the tangent is perfectly **horizontal** (slope 0).`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 5, ymin: -1, ymax: 8, grid: 1, height: 340, axes: XY,
                params: { a: { min: -0.5, max: 4.5, step: 0.25, value: 3.5, slider: false } },
                curves: [{ f: (x) => x * x - 4 * x + 5, color: 'blue' }, { f: tangent((x) => x * x - 4 * x + 5, (x) => 2 * x - 4), color: 'coral', width: 2.5 }],
                points: [{ x: (p) => p.a, y: (p) => p.a * p.a - 4 * p.a + 5, drag: { x: 'a' }, color: 'coral' }],
                readout: (p) => r`slope at $x = ${f3(p.a, 2)}$: $\;${f3(2 * p.a - 4, 1)}$`,
                goal: (p) => p.a === 2,
                hint: 'The tangent is flat at the very bottom of the curve.',
                solution: { a: 2 },
              },
              explain: r`At the bottom of the curve, $x = 2$, the tangent is flat: slope 0. To the left the curve goes downhill (negative slope), and to the right it goes uphill (positive slope).`,
            },
          ],
          recap: [
            'The average rate of change is the slope of a secant line.',
            'Shrinking the interval turns secants into the tangent line: the instantaneous rate.',
            r`For $d = t^2$, the speed at time $t$ comes out as $2t$.`,
          ],
        },
        {
          id: 'derivative',
          title: 'The Derivative',
          summary: 'A slope for every point',
          icon: 'sigma',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Spot the pattern',
              body: r`For $f(x) = x^2$ you found tangent slopes of 2 at $x = 1$ and 6 at $x = 3$.`,
              prompt: r`What do you guess the slope is at any $x$?`,
              cols: 2,
              choices: [
                { t: r`$2x$`, ok: true },
                { t: r`$x^2$`, why: r`At $x = 1$ that gives 1, not 2.` },
                { t: r`$x + 1$`, why: r`At $x = 3$ that gives 4, not 6.` },
                { t: r`$x^2 - 2x + 3$`, why: r`It does give 2 at $x = 1$ and 6 at $x = 3$! But try $x = 0$: the parabola is flat at its bottom (slope 0), while this gives 3.` },
              ],
              explain: r`The slope of $x^2$ at any point $x$ is $2x$. Proof: $\frac{(x + h)^2 - x^2}{h} = \frac{2xh + h^2}{h} = 2x + h \to 2x$.`,
            },
            {
              type: 'explain',
              title: 'The derivative function',
              body: r`The **derivative** of $f$ is a new function, $f'$, whose value at each $x$ is the slope of $f$ there:
$$f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$$
Drag the point. The {coral:tangent slope} at each $x$ gets plotted as the height of the {violet:derivative graph}.`,
              widget: {
                kind: 'graph', xmin: -2.5, xmax: 2.5, ymin: -3, ymax: 4, grid: 1, height: 380, axes: XY,
                params: { a: { min: -2.2, max: 2.2, step: 0.05, value: -1.6, slider: false } },
                curves: [
                  { f: cubic, color: 'blue' },
                  { f: tangent(cubic, dcubic), color: 'coral', width: 2 },
                  { f: dcubic, color: 'violet', width: 2.5, to: (p) => p.a },
                  { f: dcubic, color: 'violet', width: 1.5, dash: true },
                ],
                points: [
                  { x: (p) => p.a, y: (p) => cubic(p.a), drag: { x: 'a' }, color: 'coral' },
                  { x: (p) => p.a, y: (p) => dcubic(p.a), color: 'violet', r: 6 },
                ],
                readout: (p) => r`$f(x) = \tfrac13 x^3 - x$, $\quad$ slope at $x = ${f3(p.a, 2)}$: $\;f'(x) = ${f3(dcubic(p.a))}$`,
              },
              after: r`Where $f$ climbs, $f'$ is positive. Where $f$ falls, $f'$ is negative. Where $f$ has a peak or a valley, $f' = 0$.`,
            },
            {
              type: 'numeric',
              title: 'Use the definition',
              prompt: r`For $f(x) = 3x + 2$, simplify $\frac{f(x + h) - f(x)}{h}$. What is $f'(x)$?`,
              lhs: r`$f'(x) =$`,
              answer: 3,
              wrong: [
                { v: 2, why: r`The $+2$ cancels: $(3x + 3h + 2) - (3x + 2) = 3h$.` },
                { v: 5, why: r`$\frac{(3(x + h) + 2) - (3x + 2)}{h} = \frac{3h}{h}$.` },
              ],
              explain: r`$\frac{3(x + h) + 2 - (3x + 2)}{h} = \frac{3h}{h} = 3$. A straight line has the same slope everywhere, and the derivative is that slope.`,
            },
            {
              type: 'mcq',
              title: 'Constant',
              prompt: r`What is the derivative of the constant function $f(x) = 7$?`,
              cols: 2,
              choices: [
                { t: '0', ok: true },
                { t: '7', why: r`$f(x+h) - f(x) = 7 - 7 = 0$. A flat line has slope 0.` },
                { t: '1', why: r`Its graph is a horizontal line, with slope 0.` },
                { t: r`$7x$`, why: r`That goes the other way: the derivative of $7x$ is 7.` },
              ],
              explain: r`A constant never changes, so its rate of change is zero: its graph is flat.`,
            },
            {
              type: 'numeric',
              title: 'Slope of a cubic',
              prompt: r`The derivative of $x^3$ is $3x^2$. What is the slope of $y = x^3$ at $x = -1$?`,
              answer: 3,
              explain: r`$3 \times (-1)^2 = 3$: positive, the same as at $x = 1$. The cubic rises everywhere except momentarily at $x = 0$, where the slope is 0.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Cube it',
              prompt: r`Using $(x + h)^3 = x^3 + 3x^2h + 3xh^2 + h^3$, find the slope of $f(x) = x^3$ at $x = 2$.`,
              answer: 12,
              wrong: [
                { v: 8, why: r`That's $f(2) = 2^3$, the height. You want the slope.` },
                { v: 6, why: r`The derivative is $3x^2$, so at $x = 2$ it's $3 \times 4$.` },
              ],
              explain: r`$\frac{(x + h)^3 - x^3}{h} = 3x^2 + 3xh + h^2 \to 3x^2$. At $x = 2$: $3 \times 4 = 12$.`,
            },
          ],
          recap: [
            r`$f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$ is the slope of $f$ at $x$.`,
            r`Lines: $f'$ is the constant slope. Constants: $f' = 0$. $(x^2)' = 2x$ and $(x^3)' = 3x^2$.`,
            r`$f' > 0$ where $f$ is increasing, $f' < 0$ where it's decreasing, and $f' = 0$ at peaks and valleys.`,
          ],
        },
      ],
    },
    {
      title: 'Rules and Graphs',
      summary: 'Shortcuts, and reading shapes.',
      lessons: [
        {
          id: 'power-rule',
          title: 'The Power Rule',
          summary: 'Derivatives without limits',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Pattern',
              body: r`So far: $(x)' = 1$, $(x^2)' = 2x$, $(x^3)' = 3x^2$.`,
              prompt: r`What do you predict for $(x^4)'$?`,
              cols: 2,
              choices: [
                { t: r`$4x^3$`, ok: true },
                { t: r`$4x^4$`, why: r`In each case the power drops by one: $x^3 \to 3x^2$.` },
                { t: r`$x^3$`, why: r`The old power also comes down in front as a multiplier.` },
                { t: r`$3x^4$`, why: r`The power comes down in front, and the new power is one less.` },
              ],
              explain: r`The pattern: bring the power down in front, then lower the power by 1. $(x^4)' = 4x^3$.`,
            },
            {
              type: 'explain',
              title: 'The power rule',
              body: r`::: key
$$\frac{d}{dx}\, x^n = n\,x^{n-1}$$
:::

This works for **any** power $n$: negative ones and fractions too. Two more rules make it powerful:

- **Constants multiply through:** $(c\,f)' = c\,f'$. For example, $(5x^3)' = 15x^2$.
- **Sums split up:** $(f + g)' = f' + g'$. Differentiate term by term.

The notation $\frac{d}{dx}$ means "the derivative with respect to $x$". It's the limit of $\frac{\Delta y}{\Delta x}$.`,
            },
            {
              type: 'numeric',
              title: 'Practice',
              prompt: r`If $f(x) = 5x^3$, what is $f'(2)$?`,
              answer: 60,
              wrong: [
                { v: 40, why: r`That's $f(2) = 5 \times 8$. The derivative is $15x^2$.` },
                { v: 30, why: r`$f'(x) = 15x^2$, so $f'(2) = 15 \times 4$.` },
              ],
              explain: r`$f'(x) = 5 \cdot 3x^2 = 15x^2$, so $f'(2) = 15 \times 4 = 60$.`,
            },
            {
              type: 'mcq',
              title: 'Term by term',
              prompt: r`What is the derivative of $f(x) = x^4 - 3x^2 + 6x - 2$?`,
              choices: [
                { t: r`$4x^3 - 6x + 6$`, ok: true },
                { t: r`$4x^3 - 6x + 6 - 2$`, why: r`The constant $-2$ has derivative 0, so it disappears.` },
                { t: r`$4x^3 - 3x + 6$`, why: r`$(3x^2)' = 3 \cdot 2x = 6x$.` },
                { t: r`$x^3 - 6x + 6$`, why: r`$(x^4)' = 4x^3$: the 4 comes down in front.` },
              ],
              explain: r`Term by term: $4x^3$, then $-6x$, then $+6$, then $0$. Result: $4x^3 - 6x + 6$.`,
            },
            {
              type: 'numeric',
              title: 'Negative powers',
              prompt: r`The power rule works for negative powers too. What is the derivative of $f(x) = \dfrac{1}{x} = x^{-1}$ at $x = 2$?`,
              answer: -0.25,
              wrong: [
                { v: 0.25, why: r`$(x^{-1})' = -1 \cdot x^{-2}$. Don't drop the minus sign: $1/x$ is decreasing.` },
                { v: -0.5, why: r`$-x^{-2}$ at $x = 2$ is $-\frac{1}{4}$, not $-\frac12$.` },
              ],
              explain: r`$(x^{-1})' = -x^{-2} = -\frac{1}{x^2}$. At $x = 2$: $-\frac14 = -0.25$. It's negative because $1/x$ decreases as $x$ grows.`,
            },
            {
              type: 'numeric',
              title: 'Square roots',
              prompt: r`What is the slope of $f(x) = \sqrt{x} = x^{1/2}$ at $x = 9$? Give a decimal or a fraction.`,
              answer: 1 / 6,
              tol: 0.002,
              wrong: [
                { v: 3, why: r`That's $\sqrt9$, the height. The slope is $\frac{1}{2}x^{-1/2}$.` },
                { v: 1.5, tol: 0.002, why: r`It's $\frac12 x^{-1/2} = \frac{1}{2\sqrt x}$, so you divide by $\sqrt9$, not multiply.` },
              ],
              explain: r`$(x^{1/2})' = \tfrac12 x^{-1/2} = \frac{1}{2\sqrt x}$. At $x = 9$: $\frac{1}{2 \cdot 3} = \frac16 \approx 0.167$.`,
            },
            {
              type: 'interactive',
              title: 'Find the steep spot',
              body: r`The tangent to $y = x^3$ at $x = a$ has slope $3a^2$ by the power rule. Slide the point along the curve and find where (for $a > 0$) the tangent’s slope is exactly **12**.`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 3, ymin: -12, ymax: 20, grid: false, height: 280, axes: { xticks: 1, yticks: 4 },
                params: { a: { min: -2.8, max: 2.8, step: 0.01, value: 1, label: 'a', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => x ** 3, color: 'violet', width: 3 }, { f: (x, p) => p.a ** 3 + 3 * p.a ** 2 * (x - p.a), color: 'coral', width: 2 }],
                points: [{ x: (p) => p.a, y: (p) => p.a ** 3, drag: { x: 'a' }, color: 'coral' }],
                readout: (p) => `point (${p.a.toFixed(2)}, ${(p.a ** 3).toFixed(2)}) · tangent slope 3a² = **${(3 * p.a * p.a).toFixed(2)}**`,
                goal: (p) => Math.abs(p.a - 2) < 0.006,
                hint: 'Solve 3a² = 12.',
                solution: { a: 2 },
              },
              explain: r`$3a^2 = 12$ gives $a = 2$ (and $a = -2$, where the curve is equally steep). At $a = 0$ the slope is 0: the curve flattens for an instant without turning round.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Tangent line',
              prompt: r`The tangent to $y = x^2$ at the point $(3, 9)$ has equation $y = mx + b$. What is $b$?`,
              lhs: r`$b =$`,
              answer: -9,
              wrong: [
                { v: 9, why: r`Use $y = 9 + 6(x - 3) = 6x - 9$.` },
                { v: 3, why: r`The slope is $m = 6$. Then $9 = 6(3) + b$.` },
              ],
              explain: r`The slope is $m = 2(3) = 6$. The line passes through $(3, 9)$: $9 = 6 \cdot 3 + b$, so $b = -9$. The tangent is $y = 6x - 9$.`,
            },
          ],
          recap: [
            r`Power rule: $\frac{d}{dx}x^n = n x^{n-1}$, for any power $n$.`,
            'Constant multiples carry through, sums split term by term, and constants have derivative 0.',
            r`The tangent at $x = a$ is $y = f(a) + f'(a)(x - a)$.`,
          ],
        },
        {
          id: 'reading-graphs',
          title: 'Reading Shapes',
          summary: 'What f′ says about f',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Uphill',
              prompt: r`On an interval where $f'(x) > 0$, what does the graph of $f$ do?`,
              cols: 2,
              choices: [
                { t: 'It rises', ok: true },
                { t: 'It falls', why: 'A negative slope means falling. Positive means rising.' },
                { t: 'It’s above the x-axis', why: r`$f' > 0$ says $f$ is rising, not that $f$ itself is positive. A rising graph can be below the axis.` },
              ],
              explain: r`Positive slope means uphill (from left to right). Note that $f' > 0$ tells you about the **direction** of $f$, not its sign: $f$ can be negative and still rising.`,
            },
            {
              type: 'mcq',
              title: 'Match the derivative',
              body: r`The {blue:blue curve} is $f$. Which description fits its derivative $f'$?`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 3, ymin: -3, ymax: 3, grid: 1, height: 300, axes: XY,
                curves: [{ f: (x) => -(x * x) + 2, color: 'blue' }],
              },
              prompt: r`$f$ is a downward parabola with its peak at $x = 0$. Its derivative is…`,
              choices: [
                { t: r`A line falling from left to right, crossing zero at $x = 0$`, ok: true },
                { t: r`A downward parabola`, why: r`The derivative of a parabola is a **line** (one power lower): $(-x^2 + 2)' = -2x$.` },
                { t: r`A line rising from left to right`, why: r`Left of the peak $f$ climbs ($f' > 0$), right of it $f$ falls ($f' < 0$). So $f'$ goes from positive to negative.` },
                { t: r`Zero everywhere`, why: 'Only a flat line has zero slope everywhere.' },
              ],
              explain: r`$f(x) = -x^2 + 2$ gives $f'(x) = -2x$: positive on the left (where $f$ climbs), zero at the peak, negative on the right (where $f$ falls).`,
            },
            {
              type: 'explain',
              title: 'Critical points',
              body: r`Peaks (**local maxima**) and valleys (**local minima**) of a smooth function happen where $f'(x) = 0$. These are called **critical points**.

To tell which is which, check the sign of $f'$ on each side:
- $+$ then $-$: the graph rises then falls, so it's a **maximum**.
- $-$ then $+$: the graph falls then rises, so it's a **minimum**.

Careful: $f' = 0$ doesn't guarantee a peak or valley. $y = x^3$ has $f'(0) = 0$, but it just flattens for a moment and keeps rising.`,
            },
            {
              type: 'numeric',
              title: 'Find the valley',
              prompt: r`Where does $f(x) = x^2 - 6x + 11$ have its minimum?`,
              lhs: r`$x =$`,
              answer: 3,
              wrong: [
                { v: 2, why: r`That's the minimum *value*, $f(3) = 2$. The question asks where (which $x$).` },
                { v: 6, why: r`Set $f'(x) = 2x - 6 = 0$.` },
                { v: -3, why: r`$2x - 6 = 0$ gives $x = +3$.` },
              ],
              explain: r`$f'(x) = 2x - 6 = 0$ gives $x = 3$. The slope changes from negative to positive there, so it's a minimum, with value $f(3) = 9 - 18 + 11 = 2$.`,
            },
            {
              type: 'multi',
              title: 'Critical points of a cubic',
              prompt: r`Where does $f(x) = \tfrac13 x^3 - x$ have critical points? Select all that apply.`,
              choices: [
                { t: r`$x = -1$`, ok: true },
                { t: r`$x = 1$`, ok: true },
                { t: r`$x = 0$`, why: r`$f'(0) = 0 - 1 = -1 \ne 0$.` },
                { t: r`$x = \sqrt3$`, why: r`That's where $f(x) = 0$ (a root of $f$), not where $f' = 0$.` },
              ],
              explain: r`$f'(x) = x^2 - 1 = 0$ gives $x = \pm 1$. At $x = -1$ the slope goes $+ \to -$ (a local maximum). At $x = 1$ it goes $- \to +$ (a local minimum). You can see both on the derivative graph in the earlier lesson, The Derivative.`,
            },
            { /*ix:derivatives.reading-graphs*/
              type: 'interactive',
              kicker: 'Try it',
              title: 'Steepest on the way down',
              body: r`Here is $f(x) = x^3 - 3x^2 + 1$. It is {coral:coral} where it bends like a cap and {blue:blue} where it bends like a cup. Drag the point along the curve and watch the tangent. Find where the curve is falling **most steeply**.`,
              widget: {
                kind: 'graph', xmin: -1.2, xmax: 3.4, ymin: -3.8, ymax: 3.4, grid: 1, height: 320, axes: { ...XY, yticks: 2 },
                params: { a: { min: -1, max: 3.2, step: 0.05, value: 2.6, slider: false } },
                curves: [
                  { f: (x, p) => hill(p.a) + dhill(p.a) * (x - p.a), color: 'amber', width: 2, from: (p) => p.a - 1.1, to: (p) => p.a + 1.1 },
                  { f: hill, color: 'coral', width: 3, from: () => -1.2, to: () => 1 },
                  { f: hill, color: 'blue', width: 3, from: () => 1, to: () => 3.4 },
                ],
                points: [{ x: (p) => p.a, y: (p) => hill(p.a), drag: { x: 'a' }, color: 'ink' }],
                readout: (p) => r`slope $f'(${fix(p.a, 2)}) = ${fix(dhill(p.a), 2)}$ · ${Math.abs(p.a - 1) < 1e-6 ? 'the bend changes here' : p.a < 1 ? 'bending like a cap' : 'bending like a cup'}`,
                goal: (p) => Math.abs(p.a - 1) < 1e-6,
                hint: 'Going downhill from the peak at x = 0, the tangent tilts more and more steeply, then starts to flatten out again. Find the turning point.',
                solution: { a: 1 },
              },
              explain: r`The steepest descent is at $x = 1$, with slope $f'(1) = -3$, exactly where the curve switches from a cap to a cup. That's no accident. Steepest means $f'$ is at its lowest, so $f'$ has a critical point there: $f''(1) = 6 \times 1 - 6 = 0$. A point where the bending changes direction is called an **inflection point**. Before it the slope keeps falling; after it the slope rises again.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The second derivative',
              body: r`The derivative of $f'$ is the **second derivative**, $f''$. It measures how the slope itself is changing: whether the curve bends upward (like a cup) or downward (like a cap).`,
              prompt: r`At a critical point, $f''(a) < 0$. What kind of point is it?`,
              choices: [
                { t: 'A local maximum', ok: true },
                { t: 'A local minimum', why: r`$f'' < 0$ means the slope is decreasing: going from positive, to 0, to negative. That's a peak.` },
                { t: 'Can’t tell', why: r`When $f'' \ne 0$ you can tell: $f'' < 0$ means the curve bends downward, like a cap.` },
              ],
              explain: r`A negative $f''$ means the slope is decreasing as you pass through $a$: positive, then zero, then negative. That's a peak. (When $f''(a) = 0$, this test can't decide.)`,
            },
          ],
          recap: [
            r`$f' > 0$: rising. $\;f' < 0$: falling. $\;f' = 0$: a critical point.`,
            r`If the sign of $f'$ goes $+ \to -$ it's a maximum. If it goes $- \to +$ it's a minimum.`,
            r`Second derivative test: $f'' < 0$ at a critical point means a maximum, $f'' > 0$ a minimum.`,
          ],
        },
      ],
    },
    {
      title: 'Using Derivatives',
      summary: 'Best answers, and the physics of motion.',
      lessons: [
        {
          id: 'optimization',
          title: 'Optimization',
          summary: 'Finding the best',
          icon: 'trophy',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'The open box',
              body: r`Start with a 12 × 12 cm sheet of card. Cut a square of side $x$ from each corner and fold up the sides to make an open box. Its volume is
$$V(x) = x(12 - 2x)^2.$$
Drag to find the cut that gives the **largest** volume.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6.2, ymin: 0, ymax: 150, grid: 1, gridY: 25, height: 320, axes: { xlabel: 'x (cm)', ylabel: 'V (cm³)' },
                params: { x: { min: 0.5, max: 5.5, step: 0.25, value: 0.75, slider: false } },
                curves: [{ f: (x) => x * (12 - 2 * x) ** 2, color: 'blue', from: () => 0, to: () => 6 }],
                points: [{ x: (p) => p.x, y: (p) => p.x * (12 - 2 * p.x) ** 2, drag: { x: 'x' }, color: 'coral' }],
                readout: (p) => r`$x = ${f3(p.x, 2)}$ cm: $\;V = ${f3(p.x * (12 - 2 * p.x) ** 2)}$ cm³`,
                goal: (p) => p.x === 2,
                hint: 'Find the highest point of the curve.',
                solution: { x: 2 },
              },
              explain: r`The volume peaks at $x = 2$ cm, giving a box $8 \times 8 \times 2$ with volume 128 cm³. Next, let's find that without guessing.`,
            },
            {
              type: 'explain',
              title: 'The recipe',
              body: r`To find the best value of a quantity:

1. Write the quantity as a function of one variable.
2. Take the derivative and set it equal to zero.
3. Solve, then check that it's really a maximum (or minimum).

For the box: $V = x(12 - 2x)^2 = 4x^3 - 48x^2 + 144x$, so
$$V'(x) = 12x^2 - 96x + 144 = 12(x - 2)(x - 6).$$
$V' = 0$ at $x = 2$ or $x = 6$. At $x = 6$ there's nothing left of the card (the volume is 0), so the maximum is at $x = 2$.`,
            },
            {
              type: 'numeric',
              title: 'Fence, revisited',
              body: r`You have 40 m of fence for a rectangular pen. If the width is $w$, the length is $20 - w$, and the area is $A = w(20 - w)$.`,
              prompt: 'What width gives the largest area?',
              unit: 'm',
              answer: 10,
              wrong: [
                { v: 20, why: r`With $w = 20$ the length is 0. Set $A'(w) = 20 - 2w = 0$.` },
                { v: 100, why: 'That’s the maximum area (in m²), not the width.' },
              ],
              explain: r`$A = 20w - w^2$, so $A' = 20 - 2w = 0$ gives $w = 10$. The best rectangle is a 10 × 10 square with area 100 m².`,
            },
            {
              type: 'numeric',
              title: 'Pricing',
              body: r`A shop sells $q = 100 - 2p$ T-shirts per week at a price of $p$ dollars. Its revenue is $R = pq = p(100 - 2p)$.`,
              prompt: 'Which price maximizes revenue?',
              unit: 'dollars',
              answer: 25,
              wrong: [
                { v: 50, why: r`At \$50 they sell zero shirts. Set $R'(p) = 100 - 4p = 0$.` },
                { v: 1250, why: 'That’s the maximum revenue. The question asks for the price.' },
              ],
              explain: r`$R = 100p - 2p^2$, so $R' = 100 - 4p = 0$ gives $p = 25$. They sell 50 shirts, for \$1250 of revenue.`,
            },
            {
              type: 'numeric',
              title: 'Least sum of squares',
              prompt: r`Two numbers add up to 10. What is the smallest possible value of the sum of their squares?`,
              answer: 50,
              explain: r`With $x$ and $10 - x$: $f(x) = x^2 + (10 - x)^2$ has $f'(x) = 4x - 20 = 0$ at $x = 5$, giving $25 + 25 = 50$. Splitting evenly minimises the sum of squares.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Cheapest can',
              body: r`A cylindrical can must hold $V$ cm³. Using the least metal (the smallest surface area) leads to $\frac{d}{dr}\left(2\pi r^2 + \frac{2V}{r}\right) = 0$, which gives $V = 2\pi r^3$. Since $V = \pi r^2 h$, this means $\pi r^2 h = 2\pi r^3$.`,
              prompt: 'For the most economical can, what is the ratio of height to radius, h/r?',
              answer: 2,
              wrong: [{ v: 1, why: r`Divide $\pi r^2 h = 2\pi r^3$ by $\pi r^2$: $h = 2r$.` }],
              explain: r`$\pi r^2 h = 2\pi r^3$ gives $h = 2r$: the height equals the **diameter**. The ideal can looks square from the side. Real cans are often taller, for reasons like labels, stacking and how they feel in the hand.`,
            },
          ],
          recap: [
            r`To optimize: write the quantity as a function, set its derivative to 0, solve, and check.`,
            'Check the endpoints and what makes sense physically, not just where f′ = 0.',
            'Calculus explains why squares maximize fenced area, and the best shape for a can.',
          ],
        },
        {
          id: 'motion-calculus',
          title: 'Calculus of Motion',
          summary: 'Velocity and acceleration as derivatives',
          icon: 'play',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Connect the ideas',
              prompt: 'If x(t) is position, what is its derivative x′(t)?',
              cols: 2,
              choices: [
                { t: 'Velocity', ok: true },
                { t: 'Acceleration', why: 'Acceleration is the rate of change of velocity, one derivative further.' },
                { t: 'Distance travelled', why: 'Distance is (related to) position itself. Its rate of change is velocity.' },
              ],
              explain: r`Velocity is the rate of change of position, $v = x'(t)$. And acceleration is the rate of change of velocity, $a = v'(t) = x''(t)$.`,
            },
            {
              type: 'explain',
              title: 'Position, velocity, acceleration',
              body: r`A ball thrown upward has height $h(t) = 20t - 5t^2$ metres (taking $g \approx 10$ m/s²). Then
$$v(t) = h'(t) = 20 - 10t, \qquad a(t) = v'(t) = -10.$$
Drag through time and compare the three graphs.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4.2, ymin: -22, ymax: 22, grid: 0.5, gridY: 5, height: 360, axes: { xlabel: 't (s)', ylabel: '' },
                params: { t: { min: 0, max: 4, step: 0.05, value: 1, label: '$t$', color: 'ink', format: (v) => `${v.toFixed(2)} s` } },
                curves: [
                  { f: (t) => 20 * t - 5 * t * t, color: 'blue', from: () => 0, to: () => 4 },
                  { f: (t) => 20 - 10 * t, color: 'coral', from: () => 0, to: () => 4 },
                  { f: () => -10, color: 'violet', from: () => 0, to: () => 4 },
                ],
                points: [
                  { x: (p) => p.t, y: (p) => 20 * p.t - 5 * p.t * p.t, color: 'blue' },
                  { x: (p) => p.t, y: (p) => 20 - 10 * p.t, color: 'coral' },
                  { x: (p) => p.t, y: () => -10, color: 'violet' },
                ],
                readout: (p) => r`$\blue{h = ${f3(20 * p.t - 5 * p.t * p.t)}}$ m $\quad \coral{v = ${f3(20 - 10 * p.t)}}$ m/s $\quad \violet{a = -10}$ m/s²`,
              },
              after: r`At the top ($t = 2$), $v = 0$: the height's tangent is flat. The acceleration stays $-10$ the whole time, as you found in the Motion course.`,
            },
            {
              type: 'numeric',
              title: 'Velocity at a moment',
              prompt: r`A car's position is $x(t) = 3t^2 + 2t$ metres. What is its velocity at $t = 4$ s?`,
              unit: 'm/s',
              answer: 26,
              wrong: [
                { v: 56, why: r`That's the position $x(4)$. Velocity is $x'(t) = 6t + 2$.` },
                { v: 24, why: r`Don't forget the derivative of $2t$, which is $+2$.` },
              ],
              explain: r`$v(t) = x'(t) = 6t + 2$, so $v(4) = 26$ m/s.`,
            },
            {
              type: 'numeric',
              title: 'Acceleration',
              prompt: r`For the same car, $x(t) = 3t^2 + 2t$, what is its acceleration?`,
              unit: 'm/s²',
              answer: 6,
              wrong: [{ v: 3, why: r`$a = v'(t) = (6t + 2)' = 6$.` }],
              explain: r`$a = v'(t) = 6$ m/s², constant. Compare with $x = v_0 t + \tfrac12 a t^2$: here $v_0 = 2$ and $\tfrac12 a = 3$, so $a = 6$. ✓`,
            },
            {
              type: 'explain',
              title: 'Where the motion equations come from',
              body: r`With constant acceleration $a$, the position is $x(t) = x_0 + v_0 t + \tfrac12 a t^2$. Differentiate:
$$x'(t) = v_0 + a t = v(t), \qquad v'(t) = a.$$
The equations from the Motion course are calculus in disguise. Newton invented calculus largely to do physics like this.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'When does it stop?',
              prompt: r`A particle moves along a line with $x(t) = t^3 - 6t^2 + 9t$. At what time $t > 1$ is it momentarily at rest?`,
              unit: 's',
              answer: 3,
              wrong: [
                { v: 1, why: r`That's the other time it's at rest. The question asks for $t > 1$.` },
                { v: 0, why: r`$x(0) = 0$ is its position, but its velocity at $t = 0$ is $9 \ne 0$.` },
              ],
              explain: r`$v(t) = 3t^2 - 12t + 9 = 3(t - 1)(t - 3)$. So $v = 0$ at $t = 1$ and at $t = 3$. It moves forward, stops at $t = 1$, reverses, then stops again at $t = 3$ and moves forward once more.`,
            },
          ],
          recap: [
            r`Velocity is the derivative of position, and acceleration is the derivative of velocity.`,
            r`At the top of a throw, $v = h'(t) = 0$.`,
            'The constant-acceleration equations follow directly from differentiating.',
          ],
        },
      ],
    },
    {
      title: 'More Rules',
      summary: 'Sines, exponentials, products and chains.',
      lessons: [
        {
          id: 'trig-exp',
          title: 'Sines and Exponentials',
          summary: 'Where e comes from',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Slope of sine at 0',
              prompt: r`For small angles (in radians), $\sin x \approx x$. What is the slope of $y = \sin x$ at $x = 0$?`,
              cols: 2,
              choices: [
                { t: '1', ok: true },
                { t: '0', why: r`Near 0 the graph looks like $y = x$, which has slope 1, not a flat line.` },
                { t: r`$\pi$`, why: r`Near 0, $\sin x \approx x$: the graph looks like the line $y = x$.` },
                { t: 'Undefined', why: 'The sine curve is smooth, so it has a slope everywhere.' },
              ],
              explain: r`Near 0 the sine curve is almost the line $y = x$, so its slope there is 1. (This is the famous limit $\frac{\sin x}{x} \to 1$ in disguise.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Tracing the slope',
              body: r`Drag the point along $y = \sin x$. The tangent line shows the slope, and the coral curve records the slope at every point you've passed. What familiar curve appears?`,
              widget: {
                kind: 'graph', xmin: -0.3, xmax: 6.6, ymin: -1.4, ymax: 1.4, grid: false, height: 300, axes: { ...XY, xticks: 1, yticks: 1 },
                params: { a: { min: 0, max: 6.28, step: 0.01, value: 2, slider: false } },
                curves: [
                  { f: (x) => Math.sin(x), color: 'blue', width: 3 },
                  { f: (x) => Math.cos(x), from: 0, to: (p) => p.a, color: 'coral', width: 2.5 },
                  { f: (x, p) => Math.sin(p.a) + Math.cos(p.a) * (x - p.a), from: (p) => p.a - 0.9, to: (p) => p.a + 0.9, color: 'ink', width: 1.5 },
                ],
                points: [
                  { x: (p) => p.a, y: (p) => Math.sin(p.a), drag: { x: 'a' }, color: 'blue' },
                  { x: (p) => p.a, y: (p) => Math.cos(p.a), color: 'coral' },
                ],
                readout: (p) => r`At $x = ${p.a.toFixed(2)}$: slope $= ${f3(Math.cos(p.a))}$`,
              },
              after: r`The slope of $\sin x$ traces out $\cos x$:
$$\frac{d}{dx}\sin x = \cos x, \qquad \frac{d}{dx}\cos x = -\sin x.$$
(Only in **radians**! In degrees an awkward factor of $\frac{\pi}{180}$ appears, one reason mathematicians love radians.)`,
            },
            {
              type: 'numeric',
              title: 'A slope on the sine wave',
              prompt: r`What is the slope of $y = \sin x$ at $x = \frac{\pi}{3}$?`,
              answer: 0.5,
              tol: 0.002,
              wrong: [{ v: Math.sqrt(3) / 2, tol: 0.002, why: r`That's $\sin\frac\pi3$, the height. The slope is $\cos\frac\pi3$.` }],
              explain: r`The slope is $\cos\frac\pi3 = \frac12$: at that point the curve rises half a unit for every unit across.`,
            },
            {
              type: 'interactive',
              title: 'The perfect base',
              body: r`Exponential curves $y = b^x$ all pass through $(0, 1)$. Their slope there depends on the base $b$: about 0.69 for $b = 2$ and 1.10 for $b = 3$. Find the base whose slope at $x = 0$ is exactly **1**.`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 2, ymin: -0.5, ymax: 5, grid: 1, height: 300, axes: XY,
                params: { b: { min: 1.5, max: 4, step: 0.001, value: 2, label: '$b$', color: 'violet', format: (v) => v.toFixed(3) } },
                curves: [
                  { f: (x, p) => p.b ** x, color: 'violet', width: 3 },
                  { f: (x, p) => 1 + slopeAt0(p.b) * x, color: 'ink', width: 1.5 },
                  { f: (x) => 1 + x, color: 'muted', dash: true },
                ],
                points: [{ x: () => 0, y: () => 1, color: 'violet' }],
                readout: (p) => r`Slope of $${p.b.toFixed(3)}^x$ at $x = 0$: $${slopeAt0(p.b).toFixed(4)}$`,
                goal: (p) => Math.abs(slopeAt0(p.b) - 1) < 0.002,
                hint: 'It’s between 2 and 3, a bit closer to 3. The dashed line has slope 1.',
                solution: { b: 2.718 },
              },
              explain: r`The special base is $e = 2.71828\ldots$, the same number that turns up in compound interest. Its slope at 0 is exactly 1, and that makes $e^x$ the cleanest exponential to differentiate.`,
            },
            {
              type: 'explain',
              title: 'Its own derivative',
              body: r`Every exponential grows at a rate proportional to its own size: zooming from $x$ to $x + h$ multiplies $b^x$ by $b^h$, so
$$\frac{d}{dx} b^x = b^x \times (\text{slope of } b^x \text{ at } 0).$$
For $b = e$ that slope is 1, so

::: key
$$\frac{d}{dx} e^x = e^x.$$
:::

The height of the curve **is** its slope, everywhere. That's why $e^x$ describes anything that grows (or decays) in proportion to itself: populations, bank balances, radioactive atoms, and cooling cups of tea.`,
            },
            {
              type: 'numeric',
              title: 'Steepness of e^x',
              prompt: r`What is the slope of $y = e^x$ at $x = 2$? (2 decimal places.)`,
              answer: Math.exp(2),
              tol: 0.01,
              wrong: [{ v: 2 * Math.E, tol: 0.01, why: r`That's $2 \times e$. But the slope of $e^x$ is $e^x$ itself, so at $x = 2$ it's $e^2$.` }, { v: 1, why: 'That’s the slope at x = 0.' }],
              explain: r`The slope equals the height: $e^2 \approx 7.39$. By $x = 10$ the slope is over 22,000.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Slope of cosine',
              prompt: r`What is the slope of $y = \cos x$ at $x = \frac{\pi}{2}$?`,
              answer: -1,
              wrong: [{ v: 0, why: r`That's the height, $\cos\frac\pi2 = 0$. The slope is $-\sin\frac\pi2$.` }, { v: 1, why: r`The cosine curve is going **down** at $\frac\pi2$: the derivative of $\cos x$ is $-\sin x$.` }],
              explain: r`$\frac{d}{dx}\cos x = -\sin x$, and $-\sin\frac\pi2 = -1$. The cosine curve crosses zero at $\frac\pi2$ heading downwards as steeply as it ever gets. Notice the cycle: $\sin \to \cos \to -\sin \to -\cos \to \sin$; four derivatives bring you back. That's why sines describe vibrations (see the Differential Equations course).`,
            },
          ],
          recap: [
            r`$\frac{d}{dx}\sin x = \cos x$ and $\frac{d}{dx}\cos x = -\sin x$ (in radians).`,
            r`$e \approx 2.718$ is the base whose exponential has slope 1 at 0.`,
            r`$\frac{d}{dx}e^x = e^x$: the slope equals the height.`,
          ],
        },
        {
          id: 'chain',
          title: 'Products and Chains',
          summary: 'Combining rates of change',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A tempting mistake',
              prompt: r`Is the derivative of a product $f(x)\,g(x)$ equal to $f'(x)\,g'(x)$? Test it with $f(x) = g(x) = x$.`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`With $f = g = x$, the product is $x^2$, whose derivative is $2x$. But $f' g' = 1 \times 1 = 1$.` },
              ],
              explain: r`$x \cdot x = x^2$ has derivative $2x$, but $f'g' = 1$. So products need a different rule. A picture of a growing rectangle shows what it is.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A growing rectangle',
              body: r`A rectangle has sides $f$ and $g$, and both are growing. In a small time, $f$ grows by $\Delta f$ and $g$ by $\Delta g$. Shrink the time step and watch which pieces of new area matter.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 5.3, ymin: -0.3, ymax: 4.3, grid: false, axes: false, maxWidth: 440,
                params: { h: { min: 0.02, max: 1, step: 0.01, value: 0.7, label: 'time step', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const f = 3, g = 2.5, df = 1.4 * p.h, dg = 1.2 * p.h;
                  const R = (x, y, w, hh, cls) => s('rect', { x: plot.X(x), y: plot.Y(y + hh), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(hh), class: cls, stroke: 'var(--ink)', 'stroke-width': 1.5 });
                  return [
                    R(0, 0, f, g, 'fl-surface'), R(f, 0, df, g, 'fl-blue-soft'), R(0, g, f, dg, 'fl-coral-soft'), R(f, g, df, dg, 'fl-amber'),
                    s('text', { x: plot.X(f / 2), y: plot.Y(g / 2) + 5, class: 'lbl', 'text-anchor': 'middle', text: 'f · g' }),
                  ];
                },
                readout: (p) => { const df = 1.4 * p.h, dg = 1.2 * p.h; return r`New area: $\blue{g\,\Delta f} = ${(2.5 * df).toFixed(3)}$, $\;\coral{f\,\Delta g} = ${(3 * dg).toFixed(3)}$, $\;\amber{\Delta f\,\Delta g} = ${(df * dg).toFixed(4)}$`; },
              },
              after: r`The new area is $g\,\Delta f + f\,\Delta g + \Delta f\,\Delta g$. As the time step shrinks, the corner piece $\Delta f\,\Delta g$ shrinks much faster than the strips (it's a product of two small things). Dividing by the time and taking the limit gives the **product rule**:
$$(fg)' = f'g + fg'.$$`,
            },
            {
              type: 'numeric',
              title: 'Use the product rule',
              prompt: r`Find the derivative of $(x^2 + 1)\,x^3$ at $x = 1$.`,
              answer: 8,
              wrong: [{ v: 6, why: r`That's just $f'g'$ = $2x \cdot 3x^2$. Use $f'g + fg'$.` }, { v: 2, why: r`Don't forget the second term, $f g' = (x^2 + 1) \cdot 3x^2 = 6$ at $x = 1$.` }],
              hint: r`$f = x^2 + 1$, $f' = 2x$; $g = x^3$, $g' = 3x^2$.`,
              explain: r`$f'g + fg' = 2x \cdot x^3 + (x^2 + 1) \cdot 3x^2 = 2 + 6 = 8$ at $x = 1$. Check by expanding: $x^5 + x^3$ has derivative $5x^4 + 3x^2 = 8$ ✓.`,
            },
            {
              type: 'explain',
              title: 'The chain rule',
              body: r`Now feed one function into another: $y = f(u)$ where $u = g(x)$. If $u$ changes 2 times as fast as $x$, and $y$ changes 3 times as fast as $u$, then $y$ changes $3 \times 2 = 6$ times as fast as $x$. Rates of change **multiply**, like gears in a chain:

::: key
$$\frac{dy}{dx} = \frac{dy}{du} \cdot \frac{du}{dx}, \qquad \text{or} \qquad \big(f(g(x))\big)' = f'(g(x))\, g'(x).$$
:::

The chain rule is the engine behind training neural networks, where "backpropagation" multiplies rates through thousands of layers.`,
            },
            {
              type: 'numeric',
              title: 'A power of a bracket',
              prompt: r`Find the derivative of $(3x + 1)^5$ at $x = 0$.`,
              answer: 15,
              wrong: [{ v: 5, why: r`That's the outer derivative only, $5(3x+1)^4 = 5$. Multiply by the inner derivative, 3.` }, { v: 3, why: r`Multiply by the outer derivative too: $5(3x + 1)^4 \times 3$.` }],
              hint: r`Outer: $5u^4$ with $u = 3x + 1$. Inner: $u' = 3$.`,
              explain: r`$5(3x + 1)^4 \times 3 = 5 \times 1 \times 3 = 15$. Expanding $(3x + 1)^5$ would give the same answer with far more work.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The sliding ladder',
              body: r`A 5 m ladder leans against a wall. Its foot is pulled away from the wall at a steady 1 m/s. How fast does the top slide down? Since $x^2 + y^2 = 25$ at all times, differentiating with the chain rule gives $2x\,\dot x + 2y\,\dot y = 0$, so $\dot y = -\dfrac{x}{y}\dot x$. Move the foot.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.6, xmax: 5.6, ymin: -0.4, ymax: 5.4, grid: false, axes: false, maxWidth: 400,
                params: { x: { min: 0.3, max: 4.9, step: 0.05, value: 1.5, label: 'foot distance', color: 'blue', format: (v) => `${v.toFixed(2)} m` } },
                extra: ({ plot, p, s }) => {
                  const y = Math.sqrt(25 - p.x * p.x);
                  return [
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(5.3), stroke: 'var(--ink)', 'stroke-width': 4 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(5.5), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 4 }),
                    s('line', { x1: plot.X(p.x), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(y), stroke: 'var(--amber)', 'stroke-width': 7, 'stroke-linecap': 'round' }),
                    s('circle', { cx: plot.X(p.x), cy: plot.Y(0), r: 7, class: 'fl-blue' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(y), r: 7, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => { const y = Math.sqrt(25 - p.x * p.x); return r`Top at height $${y.toFixed(2)}$ m, sliding down at $\frac{${p.x.toFixed(2)}}{${y.toFixed(2)}} = ${(p.x / y).toFixed(2)}$ m/s`; },
              },
              after: r`At first the top barely moves, but as the ladder nears the floor the top falls faster and faster: in this idealised model its speed grows without limit as $y \to 0$. (In reality the top leaves the wall before that.) Problems like this, where linked quantities change together, are called **related rates**.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ladder speed',
              prompt: r`When the foot of the 5 m ladder is 3 m from the wall (and moving away at 1 m/s), how fast is the top sliding down?`,
              unit: 'm/s',
              answer: 0.75,
              tol: 0.005,
              wrong: [{ v: 1, why: r`The top and foot don't move at the same speed: $\dot y = -\frac{x}{y}\dot x$.` }, { v: 4 / 3, tol: 0.005, why: r`Upside down: the top's speed is $\frac{x}{y} = \frac34$ times the foot's.` }],
              hint: r`First find the height: $y = \sqrt{25 - 9}$.`,
              explain: r`$y = \sqrt{25 - 9} = 4$, so $\dot y = -\frac34 \times 1 = -0.75$ m/s: the top slides down at $0.75$ m/s. Notice we never needed a formula for $x$ or $y$ in terms of time; the chain rule linked their rates directly.`,
            },
          ],
          recap: [
            r`Product rule: $(fg)' = f'g + fg'$ (the corner piece vanishes in the limit).`,
            r`Chain rule: $(f(g(x)))' = f'(g(x))\,g'(x)$: rates multiply.`,
            'Related rates: differentiate an equation linking quantities to link their rates.',
          ],
        },
      ],
    },
  ],
};
