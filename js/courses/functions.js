import { machine } from './_figs.js';
import { fix } from '../lib/svg.js';

const r = String.raw;
// f2: number for KaTeX (ASCII minus); t2: number for SVG text (typographic minus). Both show a
// fixed d decimals, so live readouts never change length as a value moves (DESIGN.md, Live numbers).
const f2 = (v, d = 2) => fix(v, d).replace('−', '-');
const t2 = (v, d = 2) => fix(v, d);
// signed term for formulas like "x − 3" or "x + 2"
const sgn = (v, sym = '', d = 1) => (v === 0 ? '' : v > 0 ? ` + ${f2(v, d)}${sym}` : ` - ${f2(-v, d)}${sym}`);
const XY = { xlabel: 'x', ylabel: 'y' };

export default {
  id: 'functions',
  subject: 'math',
  title: 'Functions & Graphs',
  level: 'Intermediate',
  cover: 'functions',
  tagline: 'Machines, lines, parabolas and exponential growth, seen as shapes.',
  description: r`See functions as machines and as pictures. Read slopes, move graphs around, find the best fence for your field, and discover why exponential growth beats everything in the end.`,
  prereq: 'Solving Equations',
  chapters: [
    {
      title: 'Functions and Lines',
      summary: 'Inputs, outputs, and the simplest graphs.',
      lessons: [
        {
          id: 'input-output',
          title: 'Input → Output',
          summary: 'Functions as machines',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Feed the machine',
              widget: machine(['×2', '+1'], { input: '5', output: '?' }),
              prompt: 'You feed 5 into this machine. What comes out?',
              answer: 11,
              wrong: [
                { v: 12, why: r`The machine doubles first, then adds 1: $5 \times 2 = 10$, then $10 + 1$.` },
                { v: 15, why: r`It multiplies by 2, not by 3.` },
              ],
              explain: r`$5 \times 2 = 10$, then $10 + 1 = 11$.`,
            },
            {
              type: 'explain',
              title: 'Function notation',
              body: r`A **function** is a rule that turns each input into exactly one output. We give it a name, like $f$, and write the rule as
$$f(x) = 2x + 1$$
Read $f(x)$ as "$f$ of $x$": the output when the input is $x$. So $f(5) = 2 \cdot 5 + 1 = 11$.

::: callout
$f(x)$ does **not** mean $f$ times $x$. The brackets hold the input.
:::`,
            },
            {
              type: 'numeric',
              title: 'Evaluate',
              prompt: r`If $g(x) = x^2 - 3$, what is $g(4)$?`,
              lhs: r`$g(4) =$`,
              answer: 13,
              wrong: [
                { v: 5, why: r`$x^2$ means $x \times x$, not $2x$. So $4^2 = 16$.` },
                { v: 1, why: r`Substitute 4 for $x$: $4^2 - 3$.` },
              ],
              explain: r`$g(4) = 4^2 - 3 = 16 - 3 = 13$.`,
            },
            {
              type: 'numeric',
              title: 'Careful with negatives',
              prompt: r`With the same $g(x) = x^2 - 3$, what is $g(-2)$?`,
              lhs: r`$g(-2) =$`,
              answer: 1,
              wrong: [
                { v: -7, why: r`Squaring a negative number gives a positive one: $(-2)^2 = (-2)(-2) = +4$.` },
                { v: -1, why: r`$(-2)^2 = 4$, then $4 - 3$.` },
              ],
              explain: r`Put the whole input in brackets: $g(-2) = (-2)^2 - 3 = 4 - 3 = 1$.`,
            },
            {
              type: 'mcq',
              title: 'Find the rule',
              body: r`A function gives these outputs:

<table style="border-collapse:collapse;margin:8px 0;font-variant-numeric:tabular-nums"><tr><td style="padding:6px 14px;border-bottom:2px solid var(--line-2)"><b>x</b></td><td style="padding:6px 14px;border-bottom:2px solid var(--line-2)">1</td><td style="padding:6px 14px;border-bottom:2px solid var(--line-2)">2</td><td style="padding:6px 14px;border-bottom:2px solid var(--line-2)">3</td><td style="padding:6px 14px;border-bottom:2px solid var(--line-2)">4</td></tr><tr><td style="padding:6px 14px"><b>f(x)</b></td><td style="padding:6px 14px">3</td><td style="padding:6px 14px">5</td><td style="padding:6px 14px">7</td><td style="padding:6px 14px">9</td></tr></table>`,
              prompt: 'Which rule fits every column?',
              cols: 2,
              choices: [
                { t: r`$f(x) = 2x + 1$`, ok: true },
                { t: r`$f(x) = x + 2$`, why: r`It works for $x = 1$, but $f(2)$ would be 4, not 5.` },
                { t: r`$f(x) = 3x$`, why: r`It works for $x = 1$, but $f(2)$ would be 6, not 5.` },
                { t: r`$f(x) = x^2 + 2$`, why: r`It works for $x = 1$, but $f(2)$ would be 6, not 5.` },
              ],
              explain: r`Each time $x$ goes up by 1, the output goes up by 2, so the rule contains $2x$. Then $2(1) + 1 = 3$ fixes the $+1$. Always test a rule on more than one column!`,
            },
            {
              type: 'explain',
              title: 'Graphs are pictures of functions',
              body: r`Every input–output pair $(x, f(x))$ is a point. Plot all of them and you get the function's **graph**. Drag the point along the graph of $f(x) = \tfrac12 x^2$:`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 4, ymin: -1, ymax: 8, grid: 1, height: 340, axes: XY,
                params: { a: { min: -3.5, max: 3.5, step: 0.5, value: 2, slider: false } },
                curves: [{ f: (x) => 0.5 * x * x, color: 'blue' }],
                points: [{ x: (p) => p.a, y: (p) => 0.5 * p.a * p.a, drag: { x: 'a' }, color: 'coral', label: (p) => `(${t2(p.a, 1)}, ${t2(0.5 * p.a * p.a)})` }],
                extra: ({ plot, p, s }) => [
                  s('line', { x1: plot.X(p.a), x2: plot.X(p.a), y1: plot.Y(0), y2: plot.Y(0.5 * p.a * p.a), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
                ],
                readout: (p) => r`$f(${f2(p.a, 1)}) = \tfrac12 (${f2(p.a, 1)})^2 = ${f2(0.5 * p.a * p.a)}$`,
              },
              after: 'The height of the graph above each $x$ is the output for that input.',
            },
            {
              type: 'multi',
              title: 'Function or not?',
              body: r`A function must give **exactly one** output for each input.`,
              prompt: 'Which of these rules are functions? Select all that apply.',
              choices: [
                { t: 'Each person → their date of birth', ok: true },
                { t: 'Each number → its square', ok: true },
                { t: 'Each date → the person born on it', why: 'Many people share a birthday, so one input can have many outputs.' },
                { t: 'Each positive number → a number that squares to it', why: r`9 has two such numbers, $3$ and $-3$. That's two outputs for one input.` },
              ],
              explain: r`Each person has exactly one birthday, and each number has exactly one square. But a date can belong to many people, and a positive number has two square roots ($\pm$). Those break the "one output" rule.`,
            },
            {
              type: 'mcq',
              title: 'The vertical line test',
              widget: {
                kind: 'graph', equal: true, xmin: -4.5, xmax: 4.5, ymin: -4, ymax: 5, grid: 1, height: 340, axes: XY,
                curves: [
                  { param: { x: (t) => 3 * Math.cos(t), y: (t) => 3 * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'blue' },
                  { f: (x) => x * x - 3, color: 'coral' },
                ],
                params: { v: { min: -4, max: 4, step: 0.1, value: 1.5, slider: false } },
                points: [{ x: (p) => p.v, y: () => -3.6, drag: { x: 'v' }, color: 'ink', r: 7, label: 'drag' }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.v), x2: plot.X(p.v), y1: plot.top, y2: plot.bottom, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 5' })],
              },
              prompt: 'Drag the vertical line around. Which curve is **not** the graph of a function?',
              fixed: true,
              choices: [
                { t: 'The blue circle', ok: true },
                { t: 'The coral parabola', why: 'Wherever you put the vertical line, it crosses the parabola at most once. So each $x$ has only one $y$.' },
                { t: 'Both are functions', why: 'Put the line through the circle: it crosses it twice.' },
              ],
              explain: r`A vertical line marks one input $x$. If it hits a curve **twice**, that input has two outputs, so the curve isn't a function. The circle fails this test; the parabola passes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Run it backwards',
              prompt: r`$f(x) = 3x - 4$. For which input is the output 11?`,
              lhs: r`$x =$`,
              answer: 5,
              wrong: [
                { v: 29, why: r`That's $f(11)$. The question gives you the *output*, 11, and asks for the input.` },
                { v: 7 / 3, tol: 0.01, why: r`Undo the $-4$ by **adding** 4: $3x = 15$.` },
              ],
              explain: r`Solve $3x - 4 = 11$: add 4 to get $3x = 15$, then $x = 5$. Check: $f(5) = 15 - 4 = 11$. ✓`,
            },
          ],
          recap: [
            r`A function turns each input into exactly one output. $f(x)$ is the output for input $x$.`,
            r`The graph is all the points $(x, f(x))$.`,
            'A curve is a function’s graph only if every vertical line crosses it at most once.',
          ],
        },
        {
          id: 'lines',
          title: 'Lines',
          summary: 'Slope and intercept',
          icon: 'pencil',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Growing plant',
              body: r`A plant is 4 cm tall and grows 3 cm every week.`,
              prompt: 'How tall is it after 5 weeks?',
              unit: 'cm',
              answer: 19,
              wrong: [
                { v: 15, why: 'That’s how much it grew. It was already 4 cm tall at the start.' },
                { v: 35, why: r`It grows 3 cm per week, so the 4 cm start doesn't get multiplied by 5.` },
              ],
              explain: r`Height $= 4 + 3 \times 5 = 19$ cm. In general, after $w$ weeks the height is $h = 3w + 4$.`,
            },
            {
              type: 'explain',
              title: 'y = mx + b',
              body: r`Every straight line (except vertical ones) can be written as
$$y = \blue{m}x + \coral{b}$$

- $\blue{m}$, the **slope**, is how much $y$ changes when $x$ goes up by 1. For the plant, that's 3 cm per week.
- $\coral{b}$, the **intercept**, is the value of $y$ when $x = 0$: where the line crosses the $y$-axis. For the plant, that's 4 cm.

Play with both sliders:`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -6, ymax: 6, grid: 1, height: 360, axes: XY,
                params: { m: { min: -3, max: 3, step: 0.5, value: 1, label: '$m$', color: 'blue' }, b: { min: -4, max: 4, step: 0.5, value: 1, label: '$b$', color: 'coral' } },
                curves: [{ f: (x, p) => p.m * x + p.b, color: 'blue' }],
                points: [{ x: () => 0, y: (p) => p.b, color: 'coral' }],
                readout: (p) => r`$y = ${f2(p.m, 1)}x ${p.b < 0 ? '-' : '+'} ${f2(Math.abs(p.b), 1)}$`,
              },
              after: 'A negative slope tilts the line downhill. A slope of zero makes it flat.',
            },
            {
              type: 'interactive',
              title: 'Thread the needle',
              body: r`Set $m$ and $b$ so the line passes through **both** points.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 6, ymin: -1, ymax: 8, grid: 1, height: 380, axes: XY,
                params: { m: { min: -4, max: 4, step: 0.5, value: 0.5, label: '$m$', color: 'blue' }, b: { min: -5, max: 5, step: 0.5, value: 0, label: '$b$', color: 'coral' } },
                curves: [{ f: (x, p) => p.m * x + p.b, color: 'blue' }],
                points: [{ x: () => 1, y: () => 3, color: 'teal', label: '(1, 3)' }, { x: () => 3, y: () => 7, color: 'teal', label: '(3, 7)' }],
                readout: (p) => r`$y = ${f2(p.m, 1)}x ${p.b < 0 ? '-' : '+'} ${f2(Math.abs(p.b), 1)}$`,
                goal: (p) => p.m === 2 && p.b === 1,
                hint: 'Going from (1, 3) to (3, 7), how much does y rise for each step in x?',
                solution: { m: 2, b: 1 },
              },
              explain: r`From $(1, 3)$ to $(3, 7)$, $x$ goes up by 2 and $y$ goes up by 4, so the slope is $\frac{4}{2} = 2$. Then $3 = 2(1) + b$ gives $b = 1$. The line is $y = 2x + 1$.`,
            },
            {
              type: 'explain',
              title: 'Slope from two points',
              body: r`For any two points on a line,
$$m = \frac{\text{rise}}{\text{run}} = \frac{y_2 - y_1}{x_2 - x_1}$$
Drag either point and watch the slope triangle.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -6, ymax: 6, grid: 1, height: 380, axes: XY,
                params: {
                  x1: { min: -5, max: 5, step: 1, value: -3, slider: false }, y1: { min: -5, max: 5, step: 1, value: -2, slider: false },
                  x2: { min: -5, max: 5, step: 1, value: 2, slider: false }, y2: { min: -5, max: 5, step: 1, value: 3, slider: false },
                },
                curves: [{ f: (x, p) => (p.x2 === p.x1 ? NaN : p.y1 + ((p.y2 - p.y1) / (p.x2 - p.x1)) * (x - p.x1)), color: 'blue' }],
                extra: ({ plot, p, s }) => [
                  s('line', { x1: plot.X(p.x1), y1: plot.Y(p.y1), x2: plot.X(p.x2), y2: plot.Y(p.y1), stroke: 'var(--teal)', 'stroke-width': 3, 'stroke-dasharray': '6 4' }),
                  s('line', { x1: plot.X(p.x2), y1: plot.Y(p.y1), x2: plot.X(p.x2), y2: plot.Y(p.y2), stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-dasharray': '6 4' }),
                  s('text', { x: ((mx) => (Math.abs(mx - plot.X(0)) < 56 ? plot.X(0) + (mx < plot.X(0) ? -58 : 58) : mx))((plot.X(p.x1) + plot.X(p.x2)) / 2), y: plot.Y(p.y1) + (p.y2 >= p.y1 ? 20 : -10), 'text-anchor': 'middle', class: 'lbl fl-teal halo-text', text: `run ${t2(p.x2 - p.x1, 0)}` }), // stepped aside from the y-axis numbers
                  s('text', { x: plot.X(p.x2) + 8, y: (plot.Y(p.y1) + plot.Y(p.y2)) / 2, class: 'lbl fl-coral', text: `rise ${t2(p.y2 - p.y1, 0)}` }),
                ],
                points: [
                  { x: (p) => p.x1, y: (p) => p.y1, drag: { x: 'x1', y: 'y1' }, color: 'blue' },
                  { x: (p) => p.x2, y: (p) => p.y2, drag: { x: 'x2', y: 'y2' }, color: 'blue' },
                ],
                readout: (p) => (p.x2 === p.x1 ? r`Vertical line: the run is 0, so the slope is undefined.` : r`$m = \dfrac{${f2(p.y2 - p.y1, 0)}}{${f2(p.x2 - p.x1, 0)}} = ${f2((p.y2 - p.y1) / (p.x2 - p.x1))}$`),
              },
            },
            {
              type: 'numeric',
              title: 'Compute a slope',
              prompt: r`What is the slope of the line through $(-1, 5)$ and $(3, -3)$?`,
              lhs: r`$m =$`,
              answer: -2,
              wrong: [
                { v: 2, why: 'The line goes *down* from left to right, so the slope is negative.' },
                { v: -0.5, why: r`That's run over rise. Slope is rise over run: $\frac{-8}{4}$.` },
                { v: -4, why: r`The run is $3 - (-1) = 4$, not 2.` },
              ],
              explain: r`$$m = \frac{-3 - 5}{3 - (-1)} = \frac{-8}{4} = -2$$`,
            },
            {
              type: 'mcq',
              title: 'Steeper?',
              prompt: r`Which line is steeper: $y = -3x + 1$ or $y = 2x + 5$?`,
              choices: [
                { t: r`$y = -3x + 1$`, ok: true },
                { t: r`$y = 2x + 5$`, why: r`Steepness is the size of the slope, ignoring its sign. $|-3| = 3$ is bigger than $|2| = 2$.` },
                { t: 'They are equally steep', why: r`The slopes have different sizes: 3 and 2.` },
              ],
              explain: r`Steepness is the size of the slope. $y = -3x + 1$ drops 3 for every step right, while $y = 2x + 5$ rises only 2. The sign just says uphill or downhill.`,
            },
            {
              type: 'mcq',
              title: 'Parallel lines',
              prompt: r`Which line is parallel to $y = 2x - 3$?`,
              cols: 2,
              choices: [
                { t: r`$y = 2x + 7$`, ok: true },
                { t: r`$y = -2x - 3$`, why: 'That one slopes downhill while the original slopes uphill.' },
                { t: r`$y = \tfrac12 x - 3$`, why: r`Its slope is $\tfrac12$, not 2. Parallel lines need equal slopes.` },
                { t: r`$y = -\tfrac12 x + 1$`, why: r`That line is actually **perpendicular** to $y = 2x - 3$: the slopes multiply to $-1$.` },
              ],
              explain: r`Parallel lines never meet, so they rise at the same rate: equal slopes. $y = 2x + 7$ has slope 2, just shifted up.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Find the intercept',
              prompt: r`A line has slope 3 and passes through $(2, 5)$. What is its $y$-intercept $b$?`,
              lhs: r`$b =$`,
              answer: -1,
              wrong: [
                { v: 11, why: r`Moving from $x = 2$ back to $x = 0$ means going 2 steps **left**, so $y$ drops by $2 \times 3 = 6$.` },
                { v: 5, why: r`5 is the $y$-value at $x = 2$. The intercept is the $y$-value at $x = 0$.` },
              ],
              explain: r`Substitute into $y = 3x + b$: $5 = 3(2) + b$, so $b = -1$.

Or picture it: walk 2 steps left from $(2, 5)$ to reach $x = 0$. Each step drops $y$ by 3, so $y = 5 - 6 = -1$.`,
            },
          ],
          recap: [
            r`$y = mx + b$: slope $m$ (change in $y$ per unit of $x$) and intercept $b$ (the value at $x = 0$).`,
            r`Slope from two points: $m = \dfrac{y_2 - y_1}{x_2 - x_1}$.`,
            'Parallel lines have equal slopes. Steepness is the size of the slope.',
          ],
        },
      ],
    },
    {
      title: 'Moving Graphs',
      summary: 'Shift, stretch and flip, then put parabolas to work.',
      lessons: [
        {
          id: 'transformations',
          title: 'Shifts & Stretches',
          summary: 'Move any graph around',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Lifting a graph',
              body: r`Here is $y = x^2$ (dashed) and $y = x^2 + \coral{k}$ (solid). Move the slider.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: -5, ymax: 8, grid: 1, height: 340, axes: XY,
                params: { k: { min: -4, max: 4, step: 0.5, value: 2, label: '$k$', color: 'coral' } },
                curves: [{ f: (x) => x * x, color: 'muted', dash: true, width: 2 }, { f: (x, p) => x * x + p.k, color: 'blue' }],
                readout: (p) => r`$y = x^2 ${sgn(p.k)}$`,
              },
              after: r`Adding $\coral{k}$ to the output moves every point up by $k$ (or down, if $k$ is negative).`,
            },
            {
              type: 'mcq',
              title: 'Predict',
              prompt: r`Compared with $y = x^2$, what does the graph of $y = (x - 3)^2$ look like?`,
              choices: [
                { t: 'Shifted 3 units right', ok: true },
                { t: 'Shifted 3 units left', why: r`That's the natural guess, because of the minus sign. Try $x = 3$: $y = (3 - 3)^2 = 0$, so the lowest point is at $x = +3$.` },
                { t: 'Shifted 3 units up', why: r`Shifting up would be $x^2 + 3$, which changes the output. Here the 3 is inside, with the input.` },
                { t: 'Shifted 3 units down', why: r`That would be $x^2 - 3$, which changes the output. Here the 3 is inside, with the input.` },
              ],
              explain: r`The lowest point of $y = x^2$ is where the input is 0. For $y = (x - 3)^2$, the squared part is 0 when $x = 3$, so the lowest point moves to $x = 3$: three units **right**.`,
            },
            {
              type: 'explain',
              title: 'Inside moves sideways',
              body: r`Replacing $x$ with $x - \teal{h}$ shifts the graph **right** by $\teal{h}$. Everything the old graph did at $x$, the new graph now does at $x + h$: it happens later.`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 6, ymin: -2, ymax: 8, grid: 1, height: 320, axes: XY,
                params: { h: { min: -4, max: 4, step: 0.5, value: 3, label: '$h$', color: 'teal' } },
                curves: [{ f: (x) => x * x, color: 'muted', dash: true, width: 2 }, { f: (x, p) => (x - p.h) ** 2, color: 'blue' }],
                points: [{ x: (p) => p.h, y: () => 0, color: 'teal' }],
                readout: (p) => (p.h === 0 ? r`$y = x^2$` : r`$y = (x ${sgn(-p.h)})^2$`),
              },
              after: r`::: key
$f(x) + k$ shifts **up** by $k$. $\;f(x - h)$ shifts **right** by $h$.
:::`,
            },
            {
              type: 'interactive',
              title: 'Land on the star',
              body: r`Move the parabola $y = (x - h)^2 + k$ so its lowest point (the **vertex**) lands on the star at $(2, -2)$.`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 6, ymin: -5, ymax: 7, grid: 1, height: 360, axes: XY,
                params: { h: { min: -4, max: 4, step: 0.5, value: -1, label: '$h$', color: 'teal' }, k: { min: -4, max: 4, step: 0.5, value: 2, label: '$k$', color: 'coral' } },
                curves: [{ f: (x, p) => (x - p.h) ** 2 + p.k, color: 'blue' }],
                points: [{ x: () => 2, y: () => -2, color: 'amber', r: 9, label: '(2, −2)', labelDy: 26 }],
                readout: (p) => r`$y = (x ${sgn(-p.h)})^2 ${sgn(p.k)}$`,
                goal: (p) => p.h === 2 && p.k === -2,
                hint: 'h moves the vertex left and right. k moves it up and down.',
                solution: { h: 2, k: -2 },
              },
              explain: r`The vertex of $y = (x - h)^2 + k$ is at $(h, k)$. For $(2, -2)$ that's $y = (x - 2)^2 - 2$.`,
            },
            {
              type: 'explain',
              title: 'Stretch and flip',
              body: r`Multiplying the output by $\violet{a}$ stretches the graph vertically.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: -6, ymax: 6, grid: 1, height: 340, axes: XY,
                params: { a: { min: -3, max: 3, step: 0.25, value: 2, label: '$a$', color: 'violet' } },
                curves: [{ f: (x) => x * x, color: 'muted', dash: true, width: 2 }, { f: (x, p) => p.a * x * x, color: 'violet' }],
                readout: (p) => r`$y = ${f2(p.a)}x^2$`,
              },
              after: r`- $a > 1$: narrower (stretched).
- $0 < a < 1$: wider (squashed).
- $a < 0$: flipped upside down.`,
            },
            {
              type: 'interactive',
              title: 'Match the curve',
              body: r`Use all three sliders to make $y = a(x - h)^2 + k$ lie exactly on the dashed curve.`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 6, ymin: -5, ymax: 6, grid: 1, height: 380, axes: XY,
                params: {
                  a: { min: -2, max: 2, step: 0.5, value: 1, label: '$a$', color: 'violet' },
                  h: { min: -4, max: 4, step: 0.5, value: 0, label: '$h$', color: 'teal' },
                  k: { min: -4, max: 4, step: 0.5, value: 0, label: '$k$', color: 'coral' },
                },
                curves: [{ f: (x) => -0.5 * (x + 1) ** 2 + 3, color: 'ink', dash: true, width: 3 }, { f: (x, p) => p.a * (x - p.h) ** 2 + p.k, color: 'blue' }],
                readout: (p) => r`$y = ${f2(p.a, 1)}(x ${sgn(-p.h)})^2 ${sgn(p.k)}$`,
                goal: (p) => p.a === -0.5 && p.h === -1 && p.k === 3,
                hint: 'Find the vertex first (that fixes h and k). Then: does it open up or down, and how wide is it?',
                solution: { a: -0.5, h: -1, k: 3 },
              },
              explain: r`The dashed curve's vertex is $(-1, 3)$, so $h = -1$ and $k = 3$. It opens downward and is wider than $x^2$: one step from the vertex it drops only $\tfrac12$. So $a = -\tfrac12$, giving $y = -\tfrac12(x + 1)^2 + 3$.`,
            },
            {
              type: 'mcq',
              title: 'Shift left',
              prompt: r`The graph of $y = f(x)$ is shifted 4 units to the **left**. What is the new equation?`,
              cols: 2,
              choices: [
                { t: r`$y = f(x + 4)$`, ok: true },
                { t: r`$y = f(x - 4)$`, why: r`$f(x - 4)$ shifts **right**. Left needs $x - (-4) = x + 4$.` },
                { t: r`$y = f(x) + 4$`, why: 'Adding to the output shifts the graph up, not sideways.' },
                { t: r`$y = f(x) - 4$`, why: 'Subtracting from the output shifts the graph down, not sideways.' },
              ],
              explain: r`Shifting right by $h$ gives $f(x - h)$. Shifting left by 4 is shifting right by $-4$: $f(x - (-4)) = f(x + 4)$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two moves',
              prompt: r`The graph of $y = x^2$ is shifted 1 unit right and 2 units up. On the new graph, what is $y$ when $x = 4$?`,
              lhs: r`$y =$`,
              answer: 11,
              wrong: [
                { v: 27, why: r`Shifting right means $(x - 1)^2$, not $(x + 1)^2$.` },
                { v: 18, why: r`That's $4^2 + 2$. Don't forget the shift to the right: $(4 - 1)^2 + 2$.` },
                { v: 7, why: r`That's $(4 - 1)^2 - 2$. Shifting **up** adds 2.` },
              ],
              explain: r`The new graph is $y = (x - 1)^2 + 2$. At $x = 4$: $(4 - 1)^2 + 2 = 9 + 2 = 11$.`,
            },
          ],
          recap: [
            r`$f(x) + k$: up by $k$. $\;f(x - h)$: right by $h$, which is the opposite of what the sign suggests.`,
            r`$a \cdot f(x)$: vertical stretch by $a$, and a flip if $a < 0$.`,
            r`$y = a(x - h)^2 + k$ has its vertex at $(h, k)$.`,
          ],
        },
        {
          id: 'composition',
          title: 'Combining & Undoing',
          summary: 'Composition and inverse functions',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Machines in a row',
              body: r`Feed the output of one function into another and you get a **composition**: $(f \circ g)(x) = f(g(x))$, "do $g$ first, then $f$". Order matters: putting on socks then shoes is not the same as shoes then socks.

If $g(x) = x + 3$ and $f(x) = 2x$, then $f(g(x)) = 2(x + 3) = 2x + 6$, while $g(f(x)) = 2x + 3$.`,
              widget: machine(['+3', '×2'], { input: 'x', output: '2(x + 3)' }),
            },
            {
              type: 'numeric',
              title: 'Inside out',
              prompt: r`With $f(x) = x^2$ and $g(x) = x - 4$, what is $f(g(7))$?`,
              answer: 9,
              wrong: [{ v: 45, why: r`That's $g(f(7)) = 49 - 4$. Work from the inside out: $g$ first.` }, { v: 3, why: r`$g(7) = 3$, then apply $f$: $3^2$.` }],
              explain: r`Inside first: $g(7) = 3$. Then $f(3) = 9$. (The other order, $g(f(7)) = 49 - 4 = 45$, is different.)`,
            },
            {
              type: 'explain',
              title: 'Undo buttons',
              body: r`An **inverse function** $f^{-1}$ undoes $f$: if $f$ sends 3 to 10, then $f^{-1}$ sends 10 back to 3. For $f(x) = 2x + 4$ ("double, then add 4"), undo in reverse order: subtract 4, then halve:
$$f^{-1}(x) = \frac{x - 4}{2}$$
On a graph, swapping inputs and outputs swaps $x$ and $y$: the graph of $f^{-1}$ is the **reflection** of $f$'s graph in the line $y = x$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Reflect a point',
              prompt: r`The point $(1, 6)$ is on the graph of $f(x) = 2x + 4$. Drag the coral point to the matching point on the graph of $f^{-1}$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 8, ymin: -1, ymax: 8, grid: 1, maxWidth: 440, axes: XY,
                params: { x: { min: -1, max: 8, step: 0.5, value: 3, slider: false }, y: { min: -1, max: 8, step: 0.5, value: 4, slider: false } },
                curves: [{ f: (x) => 2 * x + 4, color: 'blue', width: 3 }, { f: (x) => (x - 4) / 2, color: 'coral', width: 3, dash: true }, { f: (x) => x, color: 'ink', width: 1.5, dash: true }],
                points: [{ x: () => 1, y: () => 6, color: 'blue' }, { x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral' }],
                readout: (p) => r`coral point: $(${fix(p.x, 1)}, ${fix(p.y, 1)})$${p.x === 6 && p.y === 1 ? ' on the inverse ✓' : ''}`,
                goal: (p) => p.x === 6 && p.y === 1,
                hint: 'The inverse swaps input and output.',
                solution: { x: 6, y: 1 },
              },
              explain: r`$(1, 6) \to (6, 1)$: since $f(1) = 6$, $f^{-1}(6) = 1$. Every point flips across the line $y = x$, carrying the blue line onto the dashed coral one.`,
            },
            {
              type: 'mcq',
              title: 'Not always undoable',
              prompt: r`Why doesn't $f(x) = x^2$ (for all real $x$) have an inverse function?`,
              choices: [
                { t: 'Different inputs give the same output (3 and −3 both give 9), so you can’t tell which to go back to', ok: true },
                { t: 'Because squares can’t be undone', why: 'Square roots undo squaring for non-negative numbers. The problem is that two inputs share each output.' },
                { t: 'It does: the inverse is √x', why: r`$\sqrt{9} = 3$ recovers only one of the two inputs. Restricting $f$ to $x \ge 0$ fixes this.` },
              ],
              explain: r`A function has an inverse only if each output comes from exactly **one** input (it's **one-to-one**): every horizontal line meets the graph at most once. Restrict $x^2$ to $x \ge 0$, and $\sqrt{x}$ becomes its inverse.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Undo the temperature',
              prompt: r`$F(C) = 1.8C + 32$ converts Celsius to Fahrenheit. Its inverse converts back. What is $F^{-1}(212)$?`,
              answer: 100,
              wrong: [{ v: 413.6, tol: 0.1, why: r`That's $F(212)$. The inverse goes the other way: $\frac{212 - 32}{1.8}$.` }],
              explain: r`$F^{-1}(y) = \frac{y - 32}{1.8}$, so $F^{-1}(212) = \frac{180}{1.8} = 100$: water boils at 212 °F = 100 °C.`,
            },
          ],
          recap: [
            r`Composition $f(g(x))$: apply $g$ first, then $f$; order matters.`,
            r`An inverse undoes a function; its graph is the reflection in $y = x$.`,
            'Only one-to-one functions have inverses (horizontal line test).',
          ],
        },
        {
          id: 'piecewise',
          title: 'Piecewise & Absolute Value',
          summary: 'Functions with different rules',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Different rules in different places',
              body: r`Some functions follow different formulas on different parts of their domain. A parking garage charges £3 for up to an hour and £2 for each extra hour; tax rates jump at income thresholds; postage jumps at weight limits. These are **piecewise** functions.

The most famous is the **absolute value** $|x|$, the distance from 0:
$$|x| = \begin{cases} x & x \ge 0 \\ -x & x < 0 \end{cases}$$
Its graph is a V shape.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Move the V',
              prompt: r`The graph of $y = a|x - h|$ is a V with its corner at $(h, 0)$. Adjust $a$ and $h$ to match the dashed V.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: -1, ymax: 8, grid: 1, height: 280, axes: XY,
                params: {
                  a: { min: 0.5, max: 3, step: 0.5, value: 1, label: 'a', color: 'violet' },
                  h: { min: -4, max: 4, step: 0.5, value: 0, label: 'h', color: 'teal' },
                },
                curves: [{ f: (x) => 2 * Math.abs(x - 1.5), color: 'ink', dash: true, width: 2 }, { f: (x, p) => p.a * Math.abs(x - p.h), color: 'violet', width: 3 }],
                readout: (p) => r`$y = ${fix(p.a, 1)}\,|x ${p.h >= 0 ? '-' : '+'} ${fix(Math.abs(p.h), 1)}|$`,
                goal: (p) => p.a === 2 && p.h === 1.5,
                hint: 'The corner tells you h; the steepness of each arm tells you a.',
                solution: { a: 2, h: 1.5 },
              },
              explain: r`$y = 2|x - 1.5|$: the corner sits at $x = 1.5$, and each arm has slope $\pm 2$. The same shift-and-stretch rules work for every function.`,
            },
            {
              type: 'numeric',
              title: 'Income tax',
              prompt: r`A simplified tax system: no tax on the first £12,000, 20% on income between £12,000 and £50,000, and 40% above £50,000. How much tax does someone earning £60,000 pay?`,
              unit: '£',
              answer: 0.2 * 38000 + 0.4 * 10000,
              wrong: [{ v: 24000, why: 'Only the income above £50,000 is taxed at 40%. Each band has its own rate.' }, { v: 12000, why: 'That’s 20% of everything. The first £12,000 is tax-free, and the top £10,000 is taxed at 40%.' }],
              explain: r`20% of £38,000 (from £12k to £50k) is £7,600; 40% of the £10,000 above £50k is £4,000. Total: **£11,600**, an average rate of about 19%, even though the top rate is 40%. Moving into a higher band only raises the tax on the extra pounds.`,
            },
            {
              type: 'mcq',
              title: 'A myth about tax bands',
              prompt: r`Someone refuses a pay rise from £49,000 to £51,000 because it would "push them into the 40% band". Under the system above, are they right to worry?`,
              choices: [
                { t: 'No: only the £1,000 above £50,000 is taxed at 40%, so they still take home more', ok: true },
                { t: 'Yes: all their income would be taxed at 40%', why: 'Rates apply band by band. Only income above the threshold pays the higher rate.' },
              ],
              explain: r`The tax function is piecewise but **continuous**: it has no jumps, only kinks where the slope (the rate) changes. Of the £2,000 rise, £1,000 is taxed at 20% and £1,000 at 40%, leaving £1,400 more after tax.`,
            },
            {
              type: 'numeric',
              title: 'Which rule applies?',
              prompt: r`$f(x) = x^2$ for $x < 0$ and $f(x) = 2x + 1$ for $x \ge 0$. What is $f(-3)$?`,
              answer: 9,
              explain: r`$-3 < 0$, so use the first rule: $(-3)^2 = 9$. (Note that $f(0) = 1$, using the second rule: the graph jumps at 0.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Solving with |x|',
              prompt: r`How many solutions does $|x - 3| = 5$ have? Enter the **sum** of all solutions.`,
              answer: 6,
              wrong: [{ v: 8, why: r`$x - 3 = 5$ gives 8, but $x - 3 = -5$ gives another solution, $-2$.` }, { v: 2, why: 'That’s the number of solutions. The question asks for their sum.' }],
              explain: r`$|x - 3| = 5$ means $x$ is 5 away from 3: $x = 8$ or $x = -2$. Their sum is 6 (twice the centre, 3). Absolute value equations usually have two solutions, one on each arm of the V.`,
            },
          ],
          recap: [
            'Piecewise functions use different rules on different intervals.',
            r`$|x|$ is the distance from 0; $a|x - h|$ is a V with corner at $(h, 0)$.`,
            'Tax bands apply rates only to income within each band.',
          ],
        },
        {
          id: 'parabolas',
          title: 'Parabolas at Work',
          summary: 'Roots, vertices and the best fence',
          icon: 'target',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'The best field',
              body: r`You have **20 m** of fence to make a rectangular pen. If one side is $w$ metres, the other side is $10 - w$ metres (half the fence goes on each pair of sides).

The graph shows the area $A = w(10 - w)$. Drag the point to find the width that gives the **biggest** area.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10.5, ymin: 0, ymax: 30, grid: 1, gridY: 5, height: 340, axes: { xlabel: 'w (m)', ylabel: 'A (m²)' },
                params: { w: { min: 0.5, max: 9.5, step: 0.5, value: 2, slider: false } },
                curves: [{ f: (x) => x * (10 - x), color: 'blue', from: () => 0, to: () => 10 }],
                points: [{ x: (p) => p.w, y: (p) => p.w * (10 - p.w), drag: { x: 'w' }, color: 'coral' }],
                extra: ({ plot, p, s }) => {
                  // little rectangle preview
                  const sc = 9, x0 = plot.right - 140, y0 = plot.top + 6;
                  return [s('rect', { x: x0, y: y0, width: p.w * sc, height: (10 - p.w) * sc, rx: 3, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 })];
                },
                readout: (p) => r`$w = ${f2(p.w, 1)}$ m, other side $= ${f2(10 - p.w, 1)}$ m, $\;A = ${f2(p.w * (10 - p.w))}$ m²`,
                goal: (p) => p.w === 5,
                hint: 'Look for the highest point on the curve.',
                solution: { w: 5 },
              },
              explain: r`The area peaks at $w = 5$: a **square**, 5 m by 5 m, with area 25 m². Any other shape with the same perimeter encloses less.`,
            },
            {
              type: 'explain',
              title: 'Symmetry',
              body: r`The area graph $A = w(10 - w)$ is a parabola. It is zero at $w = 0$ and at $w = 10$ (a pen with no width has no area). These zeros are called the **roots**.

Parabolas are **symmetric**, so the vertex sits exactly halfway between the roots: at $w = \frac{0 + 10}{2} = 5$.

::: key
The vertex of a parabola is halfway between its roots.
:::`,
            },
            {
              type: 'mcq',
              title: 'Roots from factors',
              prompt: r`Where does $y = (x - 2)(x + 4)$ cross the $x$-axis?`,
              cols: 2,
              choices: [
                { t: r`$x = 2$ and $x = -4$`, ok: true },
                { t: r`$x = -2$ and $x = 4$`, why: r`Try $x = -2$: $(-2 - 2)(-2 + 4) = (-4)(2) = -8 \ne 0$. Watch the signs.` },
                { t: r`$x = 2$ and $x = 4$`, why: r`Try $x = 4$: $(2)(8) = 16 \ne 0$.` },
                { t: r`$x = -8$ only`, why: r`$-8$ is the $y$-intercept, the value when $x = 0$.` },
              ],
              explain: r`A product is zero exactly when one of its factors is zero. $x - 2 = 0$ gives $x = 2$, and $x + 4 = 0$ gives $x = -4$.`,
            },
            {
              type: 'numeric',
              title: 'Find the vertex',
              prompt: r`What is the $x$-coordinate of the vertex of $y = (x - 2)(x + 4)$?`,
              lhs: r`$x =$`,
              answer: -1,
              wrong: [
                { v: 1, why: r`Halfway between 2 and $-4$ is $\frac{2 + (-4)}{2}$.` },
                { v: 3, why: r`That's halfway between 2 and 4, but the roots are 2 and $-4$.` },
              ],
              explain: r`Halfway between the roots: $\frac{2 + (-4)}{2} = -1$.`,
            },
            {
              type: 'numeric',
              title: 'How low?',
              prompt: r`What is the lowest value of $y = (x - 2)(x + 4)$?`,
              lhs: r`$y =$`,
              answer: -9,
              wrong: [
                { v: -8, why: r`$-8$ is the value at $x = 0$. The lowest point is at the vertex, $x = -1$.` },
                { v: 9, why: r`At the vertex, $(x - 2)$ is negative and $(x + 4)$ is positive, so the product is negative.` },
              ],
              explain: r`Substitute the vertex $x = -1$: $(-1 - 2)(-1 + 4) = (-3)(3) = -9$.`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 4, ymin: -10, ymax: 8, grid: 1, gridY: 2, height: 320, axes: XY,
                curves: [{ f: (x) => (x - 2) * (x + 4), color: 'blue' }],
                points: [{ x: () => 2, y: () => 0, color: 'teal' }, { x: () => -4, y: () => 0, color: 'teal' }],
              },
            },
            {
              type: 'explain',
              title: 'Standard form',
              body: r`Expanding gives the **standard form**: $(x - 2)(x + 4) = x^2 + 2x - 8$.

For any $y = ax^2 + bx + c$, the vertex is at
$$x = -\frac{b}{2a}$$
Check: $-\frac{2}{2 \cdot 1} = -1$. ✓ (This comes from the halfway-between-the-roots idea.)`,
            },
            {
              type: 'numeric',
              title: 'Up and down',
              body: r`A ball is thrown upward. Its height after $t$ seconds is $h(t) = 20t - 5t^2$ metres.`,
              prompt: 'What is the maximum height?',
              unit: 'm',
              answer: 20,
              wrong: [
                { v: 2, why: 'That’s *when* it reaches the top. Now find the height at that moment.' },
                { v: 4, why: 'That’s when it lands again. The top is halfway there.' },
              ],
              hint: r`The roots are $t = 0$ and $t = 4$ (from $5t(4 - t) = 0$). The top is halfway between them.`,
              explain: r`Factor: $h = 5t(4 - t)$, with roots $t = 0$ and $t = 4$. Halfway is $t = 2$, so the maximum height is $h(2) = 40 - 20 = 20$ m.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How many roots?',
              prompt: 'How many times can a parabola cross the x-axis?',
              choices: [
                { t: '0, 1 or 2 times', ok: true },
                { t: 'Always exactly 2 times', why: r`$y = x^2 + 1$ never touches the $x$-axis: it's always at least 1.` },
                { t: '1 or 2 times', why: r`$y = x^2 + 1$ stays above the axis and never crosses it.` },
                { t: 'Any number of times', why: 'A parabola goes down then up (or up then down), so it can’t cross a horizontal line more than twice.' },
              ],
              explain: r`Slide $y = x^2 + k$ up and down. For $k < 0$ it crosses twice. For $k = 0$ it just touches once, at the vertex. For $k > 0$ it never reaches the axis.`,
            },
          ],
          recap: [
            r`Factored form $a(x - p)(x - q)$ shows the roots $p$ and $q$.`,
            r`The vertex is halfway between the roots. In standard form it's at $x = -b/(2a)$.`,
            'Maximum and minimum problems are often about finding a vertex.',
          ],
        },
      ],
    },
    {
      title: 'Growth',
      summary: 'Exponentials and their undo button.',
      lessons: [
        {
          id: 'exponential',
          title: 'Exponential Growth',
          summary: 'Multiplying, not adding',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Take the deal?',
              body: r`Which prize would you rather have?

- **A:** \$1,000 every day for 30 days.
- **B:** 1 cent on day 1, then double the previous day's amount every day. You keep only the day 30 payment.`,
              prompt: 'Which is worth more?',
              choices: [
                { t: 'B, the doubling pennies', ok: true },
                { t: r`A, \$1,000 a day`, why: r`Option A totals \$30,000. Doubling 29 times turns 1 cent into $2^{29}$ cents. Work out what that is!` },
                { t: 'They are about equal', why: 'One is about 180 times the other.' },
              ],
              explain: r`Option A totals \$30,000. In option B, the day-30 payment is $0.01 \times 2^{29} = \$5{,}368{,}709.12$. Doubling starts slowly, then explodes.`,
            },
            {
              type: 'explain',
              title: 'Adding vs. multiplying',
              body: r`**Linear** growth adds the same amount each step. **Exponential** growth multiplies by the same factor each step:
$$y = a \cdot b^{x}$$
where $a$ is the starting value and $b$ is the growth factor. Stretch the window and compare $y = 2^x$ with the straight line $y = 10x$:`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 120, grid: 1, gridY: 20, height: 340, axes: XY,
                params: { X: { min: 1, max: 9, step: 0.5, value: 3, label: '$x$', color: 'ink' } },
                curves: [{ f: (x) => 10 * x, color: 'teal' }, { f: (x) => 2 ** x, color: 'coral' }],
                points: [
                  { x: (p) => p.X, y: (p) => 10 * p.X, color: 'teal' },
                  { x: (p) => p.X, y: (p) => Math.min(2 ** p.X, 119), color: 'coral' },
                ],
                readout: (p) => r`$10x = ${f2(10 * p.X, 0)}$ $\quad 2^x = ${f2(2 ** p.X)}$`,
              },
              after: r`The line starts ahead, but $2^x$ overtakes it a little before $x = 6$ and never looks back. **Any** exponential with $b > 1$ eventually beats any line.`,
            },
            {
              type: 'numeric',
              title: 'Bacteria',
              body: r`A colony of 100 bacteria doubles every hour.`,
              prompt: 'How many bacteria are there after 5 hours?',
              answer: 3200,
              wrong: [
                { v: 1000, why: r`Doubling isn't adding 100 each hour. Each hour **multiplies** by 2.` },
                { v: 500, why: r`Doubling 5 times multiplies by $2^5 = 32$, not by 5.` },
                { v: 1600, why: 'Count the doublings: there’s one for each of the 5 hours.' },
              ],
              explain: r`$100 \times 2^5 = 100 \times 32 = 3200$.`,
            },
            {
              type: 'numeric',
              title: 'Compound interest',
              body: r`\$1000 is invested at 10% interest per year, compounded yearly.`,
              prompt: 'How much is it worth after 2 years?',
              unit: 'dollars',
              answer: 1210,
              wrong: [{ v: 1200, why: r`In year 2 you earn interest on the interest too: 10% of \$1100, not of \$1000.` }],
              explain: r`Growing by 10% means multiplying by 1.1 each year: $1000 \times 1.1^2 = 1000 \times 1.21 = \$1210$.`,
            },
            {
              type: 'mcq',
              title: 'The long race',
              prompt: r`For very large $x$, which is bigger: $x^{10}$ or $1.1^x$?`,
              cols: 2,
              choices: [
                { t: r`$1.1^x$`, ok: true },
                { t: r`$x^{10}$`, why: r`$x^{10}$ does win for a long time. But $1.1^x$ multiplies by 1.1 every step, while $x^{10}$ grows by smaller and smaller percentages.` },
              ],
              explain: r`At $x = 1000$, $x^{10} = 10^{30}$, but $1.1^{1000} \approx 2.5 \times 10^{41}$. An exponential with any base above 1 eventually beats any power of $x$, though it can take a while.`,
            },
            { /*anim:functions*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Zooming out on the race',
              body: r`Plot {blue:$x^{10}$} and {coral:$1.1^x$} together, then keep zooming out. The vertical axis rescales every moment so the larger curve always just fits.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1.08, grid: false, axes: false, height: 300, padL: 20,
                animate: { param: 't', speed: 0.11, max: 1.15, autoplay: true },
                curves: [
                  { f: (u, p) => { const X = 20 * 50 ** Math.min(1, p.t), M = Math.max(10 * Math.log(X), X * Math.log(1.1)); return u <= 0 ? 0 : Math.exp(10 * Math.log(u * X) - M); }, color: 'blue', width: 3 },
                  { f: (u, p) => { const X = 20 * 50 ** Math.min(1, p.t), M = Math.max(10 * Math.log(X), X * Math.log(1.1)); return Math.exp(u * X * Math.log(1.1) - M); }, color: 'coral', width: 3 },
                ],
                extra: ({ plot, p, s }) => {
                  const X = 20 * 50 ** Math.min(1, p.t), els = [];
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(1), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.6 }));
                  for (const u of [0, 0.25, 0.5, 0.75, 1]) {
                    els.push(s('line', { x1: plot.X(u), x2: plot.X(u), y1: plot.Y(0), y2: plot.Y(0) + 5, stroke: 'var(--axis)', 'stroke-width': 1.4 }));
                    els.push(s('text', { x: plot.X(u), y: plot.Y(0) + 20, 'text-anchor': u === 1 ? 'end' : u === 0 ? 'start' : 'middle', class: 'tick', text: `x = ${Math.round(u * X)}` }));
                  }
                  return els;
                },
                readout: (p) => { const X = 20 * 50 ** Math.min(1, p.t), a = 10 * Math.log10(X), b = X * Math.log10(1.1); const sci = (e) => `${fix(10 ** (e - Math.floor(e)), 1)} \\times 10^{${Math.floor(e)}}`; return r`at $x = ${Math.round(X)}$: $\;\blue{x^{10}} \approx ${sci(a)}$, $\;\coral{1.1^x} \approx ${sci(b)}$`; },
              },
              after: r`For a long time $x^{10}$ wins so hugely that $1.1^x$ looks like a flat line on the floor. But near $x \approx 685$ they cross, and from then on the exponential leaves the power behind for good: by $x = 1000$ it is about 250 billion times bigger. A power of $x$ grows by a **shrinking** percentage each step ($x^{10}$ grows by only about 1% from $x = 1000$ to $1001$), while $1.1^x$ always grows by 10%.`,
            },
            {
              type: 'numeric',
              title: 'Half-life',
              body: r`The amount of a medicine in the bloodstream halves every 6 hours. A patient starts with 80 mg.`,
              prompt: 'How much is left after 24 hours?',
              unit: 'mg',
              answer: 5,
              wrong: [
                { v: 20, why: r`24 hours is **four** half-lives, not two: $24 \div 6 = 4$.` },
                { v: 0, why: 'Halving never reaches zero. Halve 80 four times.' },
              ],
              explain: r`24 hours is $24 / 6 = 4$ half-lives: $80 \to 40 \to 20 \to 10 \to 5$ mg. As a formula: $80 \times (\tfrac12)^4 = 5$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The rule of 72',
              body: r`Bankers estimate doubling time with the **rule of 72**: divide 72 by the percentage growth rate.`,
              prompt: 'About how many years does money take to double at 6% per year?',
              unit: 'years',
              answer: 12,
              tol: 0.5,
              wrong: [{ v: 16.7, tol: 0.5, why: 'That would be simple interest (100 ÷ 6). Compounding makes it faster.' }],
              explain: r`$72 / 6 = 12$ years. Check: $1.06^{12} \approx 2.01$. ✓ The exact answer is about 11.9 years. The rule works because $\ln 2 \approx 0.69$, and 72 is a nearby number with lots of divisors.`,
            },
          ],
          recap: [
            r`Exponential: $y = a \cdot b^x$ multiplies by $b$ each step. Linear adds the same amount each step.`,
            'Growing by r% means multiplying by (1 + r/100) each period.',
            'Exponential growth eventually beats any line or power. Halving gives exponential decay.',
          ],
        },
        {
          id: 'logarithms',
          title: 'Logarithms',
          summary: 'Undoing exponentials',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Powers of two',
              prompt: r`2 raised to what power equals 32?`,
              lhs: r`$2^{?} = 32 \quad ? =$`,
              answer: 5,
              wrong: [{ v: 16, why: r`$32 \div 2 = 16$, but the question asks how many 2's multiply together to make 32.` }],
              explain: r`$2 \times 2 \times 2 \times 2 \times 2 = 32$, so $2^5 = 32$. The answer is 5.`,
            },
            {
              type: 'explain',
              title: 'What a logarithm is',
              body: r`A **logarithm** answers exactly that question: what power do I need?
$$\log_b y = x \quad\text{means}\quad b^x = y$$
So $\log_2 32 = 5$, because $2^5 = 32$. And $\log_{10} 1000 = 3$, because $10^3 = 1000$.

Logarithms **undo** exponentials, just as subtraction undoes addition.`,
            },
            {
              type: 'numeric',
              title: 'Compute',
              prompt: r`What is $\log_3 81$?`,
              answer: 4,
              wrong: [{ v: 27, why: r`$81 \div 3 = 27$. The logarithm asks for the power: $3^? = 81$.` }],
              explain: r`$3^4 = 3 \cdot 3 \cdot 3 \cdot 3 = 81$, so $\log_3 81 = 4$.`,
            },
            {
              type: 'mcq',
              title: 'The log of 1',
              prompt: r`What is $\log_2 1$?`,
              cols: 2,
              choices: [
                { t: '0', ok: true },
                { t: '1', why: r`$2^1 = 2$, not 1.` },
                { t: r`$\tfrac12$`, why: r`$2^{1/2} = \sqrt2 \approx 1.41$.` },
                { t: 'Undefined', why: r`It's defined: there is a power of 2 that equals 1.` },
              ],
              explain: r`Any nonzero number to the power 0 is 1: $2^0 = 1$. So $\log_2 1 = 0$, and the same is true in every base.`,
            },
            {
              type: 'explain',
              title: 'Multiplying becomes adding',
              body: r`When you multiply powers of the same base, the exponents **add**: $2^3 \cdot 2^2 = 2^5$. Logarithms are exponents, so:
$$\log(xy) = \log x + \log y$$

Before calculators, people used this to turn hard multiplications into easy additions. They looked up logarithms in printed tables, or used a **slide rule**, a ruler marked with a logarithmic scale.`,
            },
            {
              type: 'numeric',
              title: 'Use the rule',
              prompt: r`Simplify $\log_2 8 + \log_2 4$.`,
              answer: 5,
              wrong: [
                { v: 12, why: r`$\log_2 8 = 3$ and $\log_2 4 = 2$. Add those exponents.` },
                { v: 32, why: r`$32 = 8 \times 4$, which is the inside of the log. The log itself is $\log_2 32$.` },
              ],
              explain: r`$\log_2 8 + \log_2 4 = 3 + 2 = 5$. Or use the rule: $\log_2 (8 \cdot 4) = \log_2 32 = 5$.`,
            },
            {
              type: 'explain',
              title: 'Mirror images',
              body: r`Because $\log_2$ undoes $2^x$, their graphs are **reflections** of each other in the line $y = x$. If $(3, 8)$ is on $y = 2^x$, then $(8, 3)$ is on $y = \log_2 x$. Drag the point:`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 9, ymin: -3, ymax: 9, grid: 1, height: 400, axes: XY,
                params: { a: { min: -2, max: 3, step: 0.25, value: 2, slider: false } },
                curves: [
                  { f: (x) => x, color: 'muted', dash: true, width: 2 },
                  { f: (x) => 2 ** x, color: 'coral' },
                  { f: (x) => (x > 0 ? Math.log2(x) : NaN), color: 'blue', from: () => 0.01 },
                ],
                points: [
                  { x: (p) => p.a, y: (p) => 2 ** p.a, drag: { x: 'a' }, color: 'coral', label: (p) => `(${t2(p.a)}, ${t2(2 ** p.a)})`, labelDx: -100 },
                  { x: (p) => 2 ** p.a, y: (p) => p.a, color: 'blue', label: (p) => `(${t2(2 ** p.a)}, ${t2(p.a)})` },
                ],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.a), y1: plot.Y(2 ** p.a), x2: plot.X(2 ** p.a), y2: plot.Y(p.a), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' })],
              },
              after: r`{coral:$y = 2^x$} and {blue:$y = \log_2 x$}. Swapping $x$ and $y$ undoes the function.`,
            },
            {
              type: 'numeric',
              title: 'When?',
              body: r`A single bacterium doubles every hour.`,
              prompt: 'After how many hours will there be 1024 bacteria?',
              unit: 'hours',
              answer: 10,
              wrong: [{ v: 512, why: r`That's $1024 \div 2$. You want the number of doublings: $2^? = 1024$.` }],
              explain: r`We need $2^t = 1024$, so $t = \log_2 1024 = 10$ hours.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Earthquakes',
              body: r`On the Richter magnitude scale, each step of 1 means the seismograph's wave **amplitude** is 10 times larger.`,
              prompt: 'How does the amplitude of a magnitude 7 earthquake compare with a magnitude 5 one?',
              cols: 2,
              choices: [
                { t: '100 times larger', ok: true },
                { t: '2 times larger', why: 'The scale multiplies by 10 per step. It doesn’t add.' },
                { t: '20 times larger', why: r`Two steps multiply: $10 \times 10$, not $10 + 10$.` },
                { t: '1.4 times larger', why: r`$7/5 = 1.4$, but the scale is logarithmic: each step multiplies by 10.` },
              ],
              explain: r`Two steps of 10: $10^2 = 100$. Log scales like this squeeze huge ranges into small numbers. The same idea is behind decibels for sound and pH for acidity.`,
            },
          ],
          recap: [
            r`$\log_b y$ is the power $b$ must be raised to in order to get $y$.`,
            r`$\log(xy) = \log x + \log y$: multiplication turns into addition.`,
            r`$y = b^x$ and $y = \log_b x$ are inverses, mirror images in the line $y = x$.`,
          ],
        },
      ],
    },
  ],
};
