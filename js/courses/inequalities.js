import { fix } from '../lib/svg.js';

const r = String.raw;
const A = [1, 3], B = [7, 2];
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
// rearrangement: three products with prices, three quantities to assign
const PRICE = [5, 3, 2], QTY = [40, 25, 10];
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const revenue = (k) => PERMS[k].reduce((t, j, i) => t + PRICE[i] * QTY[j], 0);

export default {
  id: 'inequalities',
  subject: 'math',
  title: 'Inequalities',
  level: 'Intermediate',
  cover: 'inequalities',
  tagline: 'Find the best possible without calculus: squares, AM–GM, triangles and Cauchy–Schwarz.',
  description: r`Some of the most useful facts in mathematics are inequalities. Starting from the humble fact that squares are never negative, discover the AM–GM inequality and its geometric proof, solve fencing and averaging puzzles, find shortest paths with reflections, and meet the Cauchy–Schwarz inequality.`,
  prereq: 'Quadratics & Polynomials',
  chapters: [
    {
      title: 'Means',
      summary: 'From squares to AM–GM.',
      lessons: [
        {
          id: 'squares',
          title: 'Squares Are Never Negative',
          summary: 'The root of all inequalities',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'A simple start',
              body: r`For any real number $t$, $t^2 \ge 0$. That's almost too obvious to say, yet it powers a huge number of inequalities. Take $t = a - b$:
$$(a - b)^2 \ge 0 \quad\Longrightarrow\quad a^2 + b^2 \ge 2ab$$
with equality exactly when $a = b$. For a positive $x$, put $a = \sqrt x$ and $b = \frac{1}{\sqrt x}$:
$$x + \frac1x \ge 2$$
A positive number plus its reciprocal is always at least 2.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the minimum',
              prompt: r`Drag the point to find the smallest value of $f(x) = x + \dfrac{4}{x}$ for $x > 0$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 8, ymin: 0, ymax: 10, grid: 1, gridY: 2, height: 300,
                params: { x: { min: 0.5, max: 8, step: 0.05, value: 6, slider: false } },
                curves: [{ f: (x) => x + 4 / x, from: () => 0.4, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.x, y: (p) => p.x + 4 / p.x, drag: { x: 'x' }, color: 'coral' }],
                readout: (p) => r`$f(${p.x.toFixed(2)}) = ${(p.x + 4 / p.x).toFixed(3)}$`,
                goal: (p) => Math.abs(p.x - 2) < 0.026,
                hint: r`Write $x + \frac4x = \left(\sqrt x - \frac{2}{\sqrt x}\right)^2 + 4$. When is the square zero?`,
                solution: { x: 2 },
              },
              explain: r`The minimum is **4**, at $x = 2$. Proof without calculus: $x + \frac4x - 4 = \left(\sqrt x - \frac{2}{\sqrt x}\right)^2 \ge 0$, with equality when $\sqrt x = \frac{2}{\sqrt x}$, i.e. $x = 2$.`,
            },
            {
              type: 'numeric',
              title: 'Your turn',
              prompt: r`What is the smallest value of $x + \dfrac{9}{x}$ for $x > 0$?`,
              answer: 6,
              wrong: [{ v: 3, why: r`That's where the minimum occurs ($x = 3$). The minimum value is $3 + \frac93$.` }, { v: 10, why: r`That's at $x = 1$. Try $x = 3$.` }],
              explain: r`By the same trick, $x + \frac9x \ge 2\sqrt{9} = 6$, reached at $x = 3$. In general, $x + \frac{k}{x} \ge 2\sqrt k$.`,
            },
            {
              type: 'numeric',
              title: 'Complete the square',
              prompt: r`What is the smallest value of $x^2 - 6x + 13$?`,
              answer: 4,
              wrong: [{ v: 13, why: r`That’s the value at $x = 0$. Complete the square: $(x - 3)^2 + 4$.` }, { v: 3, why: r`That’s where the minimum occurs. The minimum value is $(3-3)^2 + 4$.` }],
              explain: r`$x^2 - 6x + 13 = (x - 3)^2 + 4$. A square is never negative, so the minimum is **4**, at $x = 3$. Completing the square turns minimising into reading off a number.`,
            },
            {
              type: 'numeric',
              title: 'Two variables',
              prompt: r`Complete both squares to find the smallest value of $x^2 + y^2 - 2x + 4y + 10$.`,
              answer: 5,
              explain: r`$x^2 - 2x + y^2 + 4y + 10 = (x - 1)^2 + (y + 2)^2 + 5$. Both squares are at least 0, so the minimum is **5**, at $(1, -2)$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A fourth-power puzzle',
              prompt: r`What is the smallest value of $x^4 - 4x^2 + 7$ (for any real $x$)?`,
              answer: 3,
              wrong: [{ v: 7, why: r`That's the value at $x = 0$, but other values of $x$ do better. Treat $x^2$ as the unknown and complete the square.` }, { v: 2, why: r`That's the value of $x^2$ at the minimum. Substitute it back in.` }],
              explain: r`Treat $x^2$ as a single unknown: $x^4 - 4x^2 + 7 = (x^2 - 2)^2 + 3 \ge 3$, with equality when $x^2 = 2$, i.e. $x = \pm\sqrt2$. "Write it as a square plus something" works even when the thing being squared is itself a square.`,
            },
          ],
          recap: [
            r`$(a - b)^2 \ge 0$ gives $a^2 + b^2 \ge 2ab$.`,
            r`For $x > 0$: $x + \frac{k}{x} \ge 2\sqrt k$, with equality at $x = \sqrt k$.`,
            'Equality cases tell you where the optimum is.',
          ],
        },
        {
          id: 'amgm',
          title: 'The AM–GM Inequality',
          summary: 'Averages and products',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A picture proof',
              body: r`The **arithmetic mean** of two positive numbers is $\frac{a + b}{2}$; their **geometric mean** is $\sqrt{ab}$. Lay $a$ and $b$ end to end as the diameter of a semicircle. The radius is the arithmetic mean. The perpendicular at the join reaches up to the circle at height $\sqrt{ab}$, the geometric mean. Move the join.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 10.5, ymin: -1.2, ymax: 5.6, grid: false, axes: false, equal: true, maxWidth: 540,
                params: { a: { min: 0.5, max: 9.5, step: 0.5, value: 2, label: 'a', color: 'blue', format: (v) => `a = ${fix(v, 1)}, b = ${fix(10 - v, 1)}` } },
                extra: ({ plot, p, s }) => {
                  const g = Math.sqrt(p.a * (10 - p.a)), u = plot.X(1) - plot.X(0);
                  return [
                    s('path', { d: `M${plot.X(0)} ${plot.Y(0)} A${5 * u} ${5 * u} 0 0 1 ${plot.X(10)} ${plot.Y(0)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }),
                    s('line', { x1: plot.X(0), x2: plot.X(p.a), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--blue)', 'stroke-width': 5 }),
                    s('line', { x1: plot.X(p.a), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--coral)', 'stroke-width': 5 }),
                    s('line', { x1: plot.X(5), x2: plot.X(5), y1: plot.Y(0), y2: plot.Y(5), stroke: 'var(--teal)', 'stroke-width': 3.5, 'stroke-dasharray': '7 5' }),
                    s('line', { x1: plot.X(p.a), x2: plot.X(p.a), y1: plot.Y(0), y2: plot.Y(g), stroke: 'var(--violet)', 'stroke-width': 4 }),
                    s('circle', { cx: plot.X(p.a), cy: plot.Y(g), r: 6, class: 'fl-violet' }),
                    s('text', { x: plot.X(5) + 8, y: plot.Y(4.4), class: 'lbl', style: 'fill: var(--teal)', text: 'AM' }),
                    s('text', { x: plot.X(p.a) + (p.a < 5 ? -10 : 10), y: plot.Y(g / 2), class: 'lbl', 'text-anchor': p.a < 5 ? 'end' : 'start', style: 'fill: var(--violet)', text: 'GM' }),
                  ];
                },
                readout: (p) => r`$\text{AM} = \frac{${fix(p.a, 1)} + ${fix(10 - p.a, 1)}}{2} = 5$, $\quad \text{GM} = \sqrt{${fix(p.a, 1)} \times ${fix(10 - p.a, 1)}} = ${Math.sqrt(p.a * (10 - p.a)).toFixed(3)}$`,
              },
              after: r`A half-chord can never be longer than the radius, so
$$\frac{a + b}{2} \ge \sqrt{ab}$$
with equality only when $a = b$ (the chord passes through the centre). Algebraically, it's just $(\sqrt a - \sqrt b)^2 \ge 0$ again.`,
            },
            { /*anim:inequalities*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Four rectangles in a square',
              body: r`A second picture proof. Take four {blue:$a \times b$ rectangles} and arrange them like a pinwheel inside a square of side $a + b$. Watch as $a$ and $b$ change, keeping $a + b = 10$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.7, xmax: 10.7, ymin: -0.7, ymax: 10.7, grid: false, axes: false, maxWidth: 380,
                animate: { param: 't', speed: 0.6, max: 2 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const a = 5 + 3.5 * Math.cos(p.t), b = 10 - a;
                  const R = (x0, y0, w, h, o) => s('rect', { x: plot.X(Math.min(x0, x0 + w)), y: plot.Y(Math.max(y0, y0 + h)), width: Math.abs(plot.X(w) - plot.X(0)), height: Math.abs(plot.Y(0) - plot.Y(h)), stroke: 'var(--card)', 'stroke-width': 2, ...o });
                  const els = [R(0, 0, 10, 10, { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 })];
                  // pinwheel: each rectangle a long and b high, rotated a quarter turn from the last
                  els.push(R(0, 0, a, b, { class: 'fl-blue', opacity: 0.75 }));
                  els.push(R(10, 0, -b, a, { class: 'fl-blue', opacity: 0.6 }));
                  els.push(R(10, 10, -a, -b, { class: 'fl-blue', opacity: 0.75 }));
                  els.push(R(0, 10, b, -a, { class: 'fl-blue', opacity: 0.6 }));
                  const lo = Math.min(a, b), hi = Math.max(a, b);
                  if (hi - lo > 0.02) els.push(R(lo, lo, hi - lo, hi - lo, { class: 'fl-coral', opacity: 0.85 }));
                  return els;
                },
                readout: (p) => { const a = 5 + 3.5 * Math.cos(p.t), b = 10 - a; return r`$a = ${fix(a, 2)},\ b = ${fix(b, 2)}$: $\;\blue{4ab} = ${fix(4 * a * b, 2)}$, $\;\coral{(a - b)^2} = ${fix((a - b) ** 2, 2)}$, total $(a + b)^2 = 100.00$`; },
              },
              after: r`The four rectangles plus the {coral:hole in the middle} fill the big square: $4ab + (a - b)^2 = (a + b)^2$. The hole can't have negative area, so $4ab \le (a + b)^2$, which is $\sqrt{ab} \le \frac{a + b}{2}$. The hole vanishes only when $a = b$: that's exactly when the two means are equal.`,
            },
            {
              type: 'numeric',
              title: 'The best rectangle',
              prompt: r`A rectangle has perimeter 20 m. What is the largest area it can have?`,
              unit: 'm²',
              answer: 25,
              wrong: [{ v: 100, why: 'A 10 × 10 square has perimeter 40, not 20.' }, { v: 24, why: 'A 4 × 6 rectangle has area 24, but you can do better.' }],
              explain: r`Sides $x$ and $y$ with $x + y = 10$. By AM–GM, $\sqrt{xy} \le \frac{x + y}{2} = 5$, so $xy \le 25$, with equality when $x = y = 5$: a square.`,
            },
            {
              type: 'interactive',
              title: 'A number plus its reciprocal',
              body: r`For positive $x$, how small can $x + \dfrac{4}{x}$ be? Slide $x$ to find the minimum.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 8, ymin: 0, ymax: 12, grid: false, height: 280, axes: { xlabel: 'x', ylabel: 'x + 4/x', xticks: 1, yticks: 2 },
                params: { x: { min: 0.5, max: 8, step: 0.05, value: 4, label: '$x$', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => (x > 0.3 ? x + 4 / x : NaN), color: 'violet', width: 3 }, { f: () => 4, color: 'teal', dash: true }],
                points: [{ x: (p) => p.x, y: (p) => p.x + 4 / p.x, color: 'coral' }],
                readout: (p) => `$x + 4/x = ${(p.x + 4 / p.x).toFixed(3)}$`,
                goal: (p) => Math.abs(p.x - 2) < 1e-9,
                hint: 'AM–GM says the sum is smallest when the two terms are equal.',
                solution: { x: 2 },
              },
              explain: r`By AM–GM, $x + \frac4x \ge 2\sqrt{x \cdot \frac4x} = 2\sqrt4 = 4$, with equality when $x = \frac4x$, i.e. $x = 2$. No calculus needed: AM–GM finds the minimum and proves it's the minimum.`,
            },
            {
              type: 'numeric',
              title: 'Three numbers',
              prompt: r`AM–GM works for any number of terms: $\frac{a + b + c}{3} \ge \sqrt[3]{abc}$. If three positive numbers multiply to 27, what's the smallest their sum can be?`,
              answer: 9,
              wrong: [{ v: 27, why: 'That would be 27 + 1 + 1 type sums. Make the three numbers equal.' }, { v: 3, why: 'That’s the cube root of 27, the smallest possible average. The sum is 3 times that.' }],
              explain: r`$a + b + c \ge 3\sqrt[3]{27} = 9$, reached when $a = b = c = 3$. The same idea shows a cube has the least surface area of all boxes with a given volume.`,
            },
            {
              type: 'numeric',
              title: 'Biggest product',
              prompt: r`Two positive numbers add up to 20. Using AM–GM, what is the largest their product can be?`,
              answer: 100,
              explain: r`$\sqrt{ab} \le \frac{a + b}{2} = 10$, so $ab \le 100$, with equality when $a = b = 10$. For a fixed sum, the product is greatest when the parts are equal.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Fencing by a river',
              prompt: r`A farmer has 100 m of fence to enclose a rectangle along a straight river (no fence needed on the river side). What's the largest possible area?`,
              unit: 'm²',
              answer: 1250,
              wrong: [{ v: 2500, why: r`With sides $x$ (along the river) and $y$ (two of them), the fence needs $x + 2y = 100$, so a $50 \times 50$ field would need 150 m.` }, { v: 1111, tol: 1, why: r`That's a $33.3 \times 33.3$ square. With one side free, the best shape is twice as long as it is wide.` }],
              explain: r`With $x + 2y = 100$, apply AM–GM to $x$ and $2y$: $x \cdot 2y \le \left(\frac{x + 2y}{2}\right)^2 = 2500$, so $xy \le 1250$. Equality when $x = 2y$: a 50 m × 25 m field.`,
            },
          ],
          recap: [
            r`AM–GM: $\frac{a + b}{2} \ge \sqrt{ab}$, with equality when $a = b$.`,
            'A semicircle shows it: a half-chord never exceeds the radius.',
            'Fixed sum → product is largest when the parts are equal.',
          ],
        },
        {
          id: 'means',
          title: 'A Family of Means',
          summary: 'Harmonic, geometric, arithmetic',
          icon: 'clock',
          steps: [
            {
              type: 'numeric',
              title: 'Average speed',
              prompt: r`You drive to a town at 60 km/h and return along the same road at 40 km/h. What's your average speed for the round trip?`,
              unit: 'km/h',
              answer: 48,
              wrong: [{ v: 50, why: 'You spend longer driving at 40 km/h, so the average leans towards 40. Use total distance ÷ total time.' }],
              explain: r`Take a 120 km trip each way: 2 h out, 3 h back, so 240 km in 5 h $= 48$ km/h. This is the **harmonic mean** $\frac{2}{\frac{1}{60} + \frac{1}{40}}$, which is always at most the arithmetic mean.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Four means',
              body: r`Choose two positive numbers and compare their harmonic, geometric, arithmetic and quadratic means.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5, ymin: 0, ymax: 11, grid: false, axes: false, height: 240,
                params: { a: { min: 1, max: 10, step: 0.5, value: 2, label: 'a', color: 'blue' }, b: { min: 1, max: 10, step: 0.5, value: 8, label: 'b', color: 'coral' } },
                extra: ({ plot, p, s }) => {
                  const m = [2 / (1 / p.a + 1 / p.b), Math.sqrt(p.a * p.b), (p.a + p.b) / 2, Math.sqrt((p.a * p.a + p.b * p.b) / 2)];
                  const names = ['HM', 'GM', 'AM', 'QM'], cols = ['teal', 'violet', 'amber', 'pink'];
                  return m.flatMap((v, i) => [
                    s('rect', { x: plot.X(i + 0.65), y: plot.Y(v), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 4, class: `fl-${cols[i]}` }),
                    s('text', { x: plot.X(i + 1), y: plot.Y(v) - 8, class: 'tick', 'text-anchor': 'middle', text: v.toFixed(2) }),
                    s('text', { x: plot.X(i + 1), y: plot.Y(0) + 18, class: 'lbl', 'text-anchor': 'middle', text: names[i] }),
                  ]);
                },
                readout: (p) => (p.a === p.b ? 'All four means are equal when a = b.' : 'HM ≤ GM ≤ AM ≤ QM, always.'),
              },
              after: r`The bars always climb from left to right, and they all meet when $a = b$. The more different $a$ and $b$ are, the more the means spread apart.`,
            },
            {
              type: 'explain',
              title: 'The chain of means',
              body: r`For positive numbers $a$ and $b$:
$$\underbrace{\frac{2}{\frac1a + \frac1b}}_{\text{harmonic}} \;\le\; \underbrace{\sqrt{ab}}_{\text{geometric}} \;\le\; \underbrace{\frac{a + b}{2}}_{\text{arithmetic}} \;\le\; \underbrace{\sqrt{\frac{a^2 + b^2}{2}}}_{\text{quadratic}}$$
All four are equal exactly when $a = b$. For 60 and 40: $48 \le 48.99 \le 50 \le 50.99$.

AM–GM also works for more numbers: $\frac{a_1 + \dots + a_n}{n} \ge \sqrt[n]{a_1 a_2 \cdots a_n}$.`,
            },
            {
              type: 'numeric',
              title: 'The harmonic mean',
              prompt: r`The harmonic mean of $a$ and $b$ is $\frac{2ab}{a + b}$. What is the harmonic mean of 2 and 6?`,
              answer: 3,
              wrong: [{ v: 4, why: r`That’s the arithmetic mean.` }],
              explain: r`$\frac{2 \times 2 \times 6}{8} = 3$, less than the geometric mean $\sqrt{12} \approx 3.46$ and the arithmetic mean 4. The harmonic mean is the right average for rates over equal distances, like average speed.`,
            },
            {
              type: 'numeric',
              title: 'Geometric mean',
              prompt: r`What is the geometric mean of 2 and 18?`,
              answer: 6,
              explain: r`$\sqrt{2 \times 18} = \sqrt{36} = 6$, less than the arithmetic mean $10$, as AM–GM promises. Growth rates combine by the geometric mean: 100% growth then −50% averages to $\sqrt{2 \times 0.5} = 1$, no growth at all.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Three numbers',
              prompt: r`Three positive numbers add up to 12. What's the largest their product can be?`,
              answer: 64,
              wrong: [{ v: 48, why: r`That's $2 \times 4 \times 6$. Make them equal.` }, { v: 1728, why: r`That's $12^3$. AM–GM gives $\sqrt[3]{abc} \le \frac{12}{3} = 4$.` }],
              explain: r`$\sqrt[3]{abc} \le \frac{a + b + c}{3} = 4$, so $abc \le 64$, achieved by $4 \times 4 \times 4$. Equal parts maximise a product with a fixed sum.`,
            },
          ],
          recap: [
            'Average speeds over equal distances use the harmonic mean.',
            'Harmonic ≤ geometric ≤ arithmetic ≤ quadratic mean.',
            'AM–GM extends to any number of terms.',
          ],
        },
      ],
    },
    {
      title: 'Geometry and Vectors',
      summary: 'Triangles, reflections and dot products.',
      lessons: [
        {
          id: 'triangle',
          title: 'The Triangle Inequality',
          summary: 'Shortcuts and reflections',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'The straight path',
              body: r`In any triangle, each side is shorter than the other two combined. Equivalently, for points $P$, $Q$, $R$:
$$PR \le PQ + QR$$
A detour through $Q$ is never shorter than going straight. Equality happens only when $Q$ lies on the segment $PR$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Heron’s river problem',
              prompt: r`You walk from $A$ to the river (the horizontal axis) to fetch water, then on to $B$. Drag the point $P$ on the river bank to make the total walk $AP + PB$ as **short** as possible. (The faint point $B'$ is $B$ reflected in the river.)`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 8, ymin: -2.6, ymax: 3.6, grid: 1, equal: true, maxWidth: 520, axes: false,
                params: { x: { min: 0, max: 8, step: 0.1, value: 2, slider: false } },
                points: [{ x: (p) => p.x, y: () => 0, drag: { x: 'x' }, color: 'coral', label: 'P', labelDx: 8, labelDy: 20 }],
                extra: ({ plot, p, s }) => {
                  const P = [p.x, 0], Bp = [B[0], -B[1]];
                  const L = (q1, q2, attrs) => s('line', { x1: plot.X(q1[0]), y1: plot.Y(q1[1]), x2: plot.X(q2[0]), y2: plot.Y(q2[1]), ...attrs });
                  return [
                    s('rect', { x: plot.X(0), y: plot.Y(0), width: plot.X(8) - plot.X(0), height: plot.Y(-2.6) - plot.Y(0), class: 'fl-blue-soft', opacity: 0.6 }),
                    L([0, 0], [8, 0], { stroke: 'var(--blue)', 'stroke-width': 3 }),
                    L(A, P, { stroke: 'var(--violet)', 'stroke-width': 3.5 }),
                    L(P, B, { stroke: 'var(--violet)', 'stroke-width': 3.5 }),
                    L(P, Bp, { stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
                    s('circle', { cx: plot.X(A[0]), cy: plot.Y(A[1]), r: 7, class: 'fl-ink' }),
                    s('circle', { cx: plot.X(B[0]), cy: plot.Y(B[1]), r: 7, class: 'fl-ink' }),
                    s('circle', { cx: plot.X(Bp[0]), cy: plot.Y(Bp[1]), r: 6, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('text', { x: plot.X(A[0]) - 12, y: plot.Y(A[1]) - 10, class: 'lbl', text: 'A' }),
                    s('text', { x: plot.X(B[0]) + 10, y: plot.Y(B[1]) - 10, class: 'lbl', text: 'B' }),
                    s('text', { x: plot.X(Bp[0]) + 10, y: plot.Y(Bp[1]) + 6, class: 'tick', text: 'B′' }),
                  ];
                },
                readout: (p) => r`$AP + PB = ${(dist(A, [p.x, 0]) + dist([p.x, 0], B)).toFixed(3)}$`,
                goal: (p) => Math.abs(p.x - 4.6) < 0.051,
                hint: r`$PB = PB'$ for every $P$ on the river. So minimise $AP + PB'$: when is that path straight?`,
                solution: { x: 4.6 },
              },
              explain: r`Because $PB = PB'$, the walk equals $AP + PB'$, which by the triangle inequality is shortest when $A$, $P$, $B'$ lie in a straight line. That line crosses the river at $x = 4.6$, giving $\sqrt{61} \approx 7.81$. At that point, the path makes equal angles with the river, just like a light ray reflecting off a mirror. Heron of Alexandria used this to explain the law of reflection, nearly 2,000 years ago.`,
            },
            {
              type: 'mcq',
              title: 'Can it be a triangle?',
              prompt: r`Which set of lengths can form a triangle?`,
              choices: [
                { t: '4, 5, 8', ok: true },
                { t: '3, 4, 8', why: '3 + 4 = 7 < 8: the two short sides can’t reach.' },
                { t: '2, 3, 5', why: '2 + 3 = 5 exactly: the “triangle” collapses into a straight line.' },
              ],
              explain: r`$4 + 5 = 9 > 8$ ✓. The test only needs checking for the longest side: the two shorter sides must add up to **more** than it.`,
            },
            {
              type: 'mcq',
              title: 'Vectors too',
              prompt: r`The triangle inequality also holds for vectors: $|\mathbf{a} + \mathbf{b}| \le |\mathbf{a}| + |\mathbf{b}|$. When is it an equality?`,
              choices: [
                { t: r`When the vectors point in the same direction`, ok: true },
                { t: r`When they are perpendicular`, why: r`Then $|\mathbf{a} + \mathbf{b}| = \sqrt{|\mathbf a|^2 + |\mathbf b|^2}$, which is less than the sum.` },
                { t: r`Never`, why: r`It’s an equality exactly when the two walks go the same way, with no turning.` },
              ],
              explain: r`Walking $\mathbf a$ then $\mathbf b$ only covers the full distance $|\mathbf a| + |\mathbf b|$ if you never turn: same direction. Any angle between them shortens the straight-line result.`,
            },
            {
              type: 'numeric',
              title: 'Via the shore',
              prompt: r`You walk from $(0, 1)$ to the shore (the $x$-axis) and then to $(4, 2)$. Reflect the second point in the shore to $(4, -2)$: the shortest total route is the straight-line distance to the reflection. How long is it?`,
              answer: 5,
              explain: r`The distance from $(0, 1)$ to $(4, -2)$ is $\sqrt{4^2 + 3^2} = 5$. Any other route to the shore is longer, by the triangle inequality.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Possible third sides',
              prompt: r`A triangle has sides 7 and 12. How many whole-number lengths are possible for the third side?`,
              answer: 13,
              wrong: [{ v: 12, why: r`The third side $c$ must satisfy $5 < c < 19$: that's $6, 7, \dots, 18$.` }, { v: 14, why: r`5 and 19 themselves make degenerate (flat) triangles, so they're excluded.` }],
              explain: r`By the triangle inequality, $12 - 7 < c < 12 + 7$, so $5 < c < 19$: the whole numbers 6 to 18, which is **13** lengths.`,
            },
          ],
          recap: [
            r`Triangle inequality: $PR \le PQ + QR$.`,
            'Reflecting a point turns a bent path into a straight one.',
            'Three lengths form a triangle when the two shorter ones sum to more than the longest.',
          ],
        },
        {
          id: 'cauchy',
          title: 'Cauchy–Schwarz',
          summary: 'Dot products are bounded',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Vectors and cosines',
              body: r`For vectors $\mathbf u = (a_1, a_2)$ and $\mathbf v = (b_1, b_2)$, the dot product is $\mathbf u \cdot \mathbf v = a_1 b_1 + a_2 b_2 = |\mathbf u|\,|\mathbf v| \cos\theta$. Since $|\cos\theta| \le 1$:
$$(a_1 b_1 + a_2 b_2)^2 \le (a_1^2 + a_2^2)(b_1^2 + b_2^2)$$
This is the **Cauchy–Schwarz inequality**. It works in any number of dimensions, and equality holds when the vectors point in the same (or opposite) direction.`,
            },
            {
              type: 'numeric',
              title: 'Maximise on a circle',
              prompt: r`If $x^2 + y^2 = 1$, what is the largest possible value of $3x + 4y$?`,
              answer: 5,
              wrong: [{ v: 7, why: r`That would need $x = y = 1$, but then $x^2 + y^2 = 2$. Use Cauchy–Schwarz.` }, { v: 25, why: r`$(3x + 4y)^2 \le (9 + 16)(x^2 + y^2) = 25$, so $3x + 4y \le 5$.` }],
              explain: r`$(3x + 4y)^2 \le (3^2 + 4^2)(x^2 + y^2) = 25$, so $3x + 4y \le 5$. Equality when $(x, y)$ points along $(3, 4)$: $x = 0.6$, $y = 0.8$. Check: $1.8 + 3.2 = 5$ ✓.`,
            },
            {
              type: 'numeric',
              title: 'In three dimensions',
              prompt: r`If $x^2 + y^2 + z^2 = 1$, what is the largest possible value of $2x + 3y + 6z$?`,
              answer: 7,
              wrong: [{ v: 11, why: r`That would need $x = y = z = 1$, which breaks the constraint.` }, { v: 49, why: 'That’s the square of the maximum.' }],
              explain: r`Cauchy–Schwarz: $(2x + 3y + 6z)^2 \le (4 + 9 + 36)(x^2 + y^2 + z^2) = 49$, so the maximum is $7$, reached when $(x, y, z) = \frac17(2, 3, 6)$.`,
            },
            {
              type: 'numeric',
              title: 'Closest point to a line',
              prompt: r`Cauchy–Schwarz says $(x + 2y)^2 \le (1^2 + 2^2)(x^2 + y^2)$. If $x + 2y = 5$, what is the smallest possible value of $x^2 + y^2$?`,
              answer: 5,
              wrong: [{ v: 25, why: r`Divide by $1^2 + 2^2 = 5$.` }],
              explain: r`$25 \le 5(x^2 + y^2)$, so $x^2 + y^2 \ge 5$, with equality when $(x, y)$ is parallel to $(1, 2)$: at $(1, 2)$ itself. Geometrically: the point on the line nearest the origin is $\sqrt5$ away.`,
            },
            {
              type: 'interactive',
              title: 'Around the circle',
              body: r`Drag the point around the unit circle to make $3x + 4y$ as large as possible.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.3, ymax: 1.3, grid: 0.5, maxWidth: 400, axes: { xticks: 0.5, yticks: 0.5 },
                params: { a: { min: 0, max: 359, step: 1, value: 200, slider: false } },
                curves: [{ param: { x: (t) => Math.cos(t), y: (t) => Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'ink', width: 2 }, { f: (x, p) => (3 * Math.cos((p.a * Math.PI) / 180) + 4 * Math.sin((p.a * Math.PI) / 180) - 3 * x) / 4, color: 'coral', dash: true }],
                points: [{ x: (p) => Math.cos((p.a * Math.PI) / 180), y: (p) => Math.sin((p.a * Math.PI) / 180), drag: { fn: (x, y) => ({ a: (((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360) % 360 }), key: 'a' }, color: 'violet' }],
                readout: (p) => { const x = Math.cos((p.a * Math.PI) / 180), y = Math.sin((p.a * Math.PI) / 180); return `$(${x.toFixed(2)}, ${y.toFixed(2)})$: $3x + 4y = ${(3 * x + 4 * y).toFixed(3)}$`; },
                goal: (p) => 3 * Math.cos((p.a * Math.PI) / 180) + 4 * Math.sin((p.a * Math.PI) / 180) > 4.998,
                hint: 'The dashed line is a level line of 3x + 4y. Push it as far out as it can go while still touching the circle.',
                solution: { a: 53 },
              },
              explain: r`The maximum is **5**, at $(0.6, 0.8)$: the point in the direction of $(3, 4)$, where the dashed level line just touches the circle. Cauchy–Schwarz gives it instantly: $3x + 4y \le \sqrt{3^2 + 4^2}\sqrt{x^2 + y^2} = 5$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Where it shows up',
              prompt: r`In statistics, the correlation coefficient $r$ always lies between $-1$ and $1$. Why?`,
              choices: [
                { t: 'It’s the cosine of the angle between two data vectors, and Cauchy–Schwarz bounds it', ok: true },
                { t: 'It’s defined by rounding to that range', why: 'No rounding is involved. The bound is a theorem: Cauchy–Schwarz.' },
                { t: 'Because data can’t be negative', why: 'Data can be negative. The bound comes from the geometry of vectors.' },
              ],
              explain: r`Subtract each variable's mean, and treat the data as two long vectors. Then $r$ is exactly the dot product divided by the product of lengths: a cosine. Cauchy–Schwarz guarantees $|r| \le 1$, with $\pm 1$ only for perfectly linear relationships. The same inequality underlies Heisenberg's uncertainty principle.`,
            },
          ],
          recap: [
            r`Cauchy–Schwarz: $(\mathbf u \cdot \mathbf v)^2 \le |\mathbf u|^2 |\mathbf v|^2$.`,
            'It bounds expressions like 3x + 4y on a circle.',
            'Correlation coefficients are cosines, so they lie between −1 and 1.',
          ],
        },
        {
          id: 'rearrange',
          title: 'The Rearrangement Inequality',
          summary: 'Big with big, small with small',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Pairing up',
              body: r`You have two lists of numbers and must pair them up, then add the products. Which pairing gives the **largest** total? The **rearrangement inequality** says: pair the largest with the largest, the next with the next, and so on (both lists sorted the same way). Pairing them in opposite orders gives the **smallest** total.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Price the stock',
              prompt: r`A stall sells three items at prices £5, £3 and £2. It has 40, 25 and 10 units of stock to assign to them. Find the assignment that maximises total revenue.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4, grid: false, axes: false, height: 190,
                params: { k: { min: 0, max: 5, step: 1, value: 5, label: 'assignment', color: 'violet', format: (v) => `#${v + 1}` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  PRICE.forEach((pr, i) => {
                    const y = 3.3 - i * 1.2, j = PERMS[p.k][i];
                    els.push(s('text', { x: plot.X(1.5), y: plot.Y(y) + 6, class: 'lbl', 'text-anchor': 'middle', text: `£${pr}` }));
                    els.push(s('line', { x1: plot.X(2.3), x2: plot.X(7), y1: plot.Y(y), y2: plot.Y(3.3 - j * 1.2), stroke: 'var(--violet)', 'stroke-width': 3 }));
                  });
                  QTY.forEach((q, j) => els.push(s('text', { x: plot.X(8.2), y: plot.Y(3.3 - j * 1.2) + 6, class: 'lbl', 'text-anchor': 'middle', text: `${q} units` })));
                  return els;
                },
                readout: (p) => `revenue: **£${revenue(p.k)}**`,
                goal: (p) => revenue(p.k) === 295,
                hint: 'Match the highest price with the largest quantity.',
                solution: { k: 0 },
              },
              explain: r`£5 × 40 + £3 × 25 + £2 × 10 = £295, the maximum. The reverse pairing gives only £205. Sorting both lists the same way always maximises the sum of products.`,
            },
            {
              type: 'mcq',
              title: 'Exam strategy',
              prompt: r`An exam has questions worth 10, 5 and 2 marks. You have 30, 20 and 10 minutes of focused energy to give them, and your score on each grows with the time spent. Which plan does the rearrangement idea suggest?`,
              choices: [
                { t: 'Give the most time to the 10-mark question', ok: true },
                { t: 'Give the most time to the 2-mark question', why: 'That pairs the biggest resource with the smallest reward: the opposite of what maximises the total.' },
                { t: 'It makes no difference', why: 'Pairing large with large gives a larger total than any other matching.' },
              ],
              explain: r`Pair the largest resource with the largest weight. (Real exams add a twist: diminishing returns can make spreading time out sensible too.)`,
            },
            {
              type: 'numeric',
              title: 'The biggest total',
              prompt: r`Pair the numbers 1, 2, 3 with 4, 5, 6 (each used once) and add the three products. What is the **largest** total possible?`,
              answer: 1 * 4 + 2 * 5 + 3 * 6,
              wrong: [{ v: 28, why: r`That’s the smallest total. Pair large with large for the biggest.` }],
              explain: r`Pair large with large: $1 \times 4 + 2 \times 5 + 3 \times 6 = 32$. The rearrangement inequality says similarly ordered pairings give the maximum and oppositely ordered ones the minimum ($1 \times 6 + 2 \times 5 + 3 \times 4 = 28$).`,
            },
            {
              type: 'numeric',
              title: 'Match them up',
              prompt: r`Find the largest possible value of $2a + 3b + 5c$, where $a, b, c$ are the numbers $1, 4, 9$ in some order.`,
              answer: 59,
              wrong: [{ v: 35, why: r`That’s the smallest total: pair large with large for the biggest.` }],
              explain: r`Pair largest with largest: $2 \times 1 + 3 \times 4 + 5 \times 9 = 2 + 12 + 45 = 59$. Pairing them oppositely gives the minimum, $2 \times 9 + 3 \times 4 + 5 \times 1 = 35$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Shortest job first',
              prompt: r`Three customers' jobs take 2, 5 and 9 minutes, done one at a time. Each customer waits until their own job is finished. Choosing the best order, what is the smallest possible **total** of the three finishing times, in minutes?`,
              unit: 'min',
              answer: 25,
              wrong: [{ v: 39, why: r`That's the worst order, longest job first: finishing times 9, 14 and 16.` }, { v: 16, why: r`16 minutes is when the last job finishes. Add up all three customers' finishing times.` }],
              explain: r`If the jobs take $t_1, t_2, t_3$ in order, the finishing times are $t_1$, $t_1 + t_2$ and $t_1 + t_2 + t_3$, which total $3t_1 + 2t_2 + t_3$: the first job delays everyone. To make this sum **smallest**, pair oppositely: the biggest weight with the shortest job. Order 2, 5, 9 finishes at 2, 7 and 16, a total of **25**; longest first gives 39. "Shortest job first" is how computer schedulers (and express checkouts) cut average waiting times.`,
            },
          ],
          recap: [
            'Same order (big with big) maximises a sum of products.',
            'Opposite order minimises it.',
            'It explains why resources should go where they count most.',
          ],
        },
        {
          id: 'bernoulli',
          title: 'Bernoulli’s Inequality',
          summary: 'Growth beats a straight line',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Compounding versus simple',
              body: r`For $x \ge -1$ and any whole number $n \ge 1$:
$$(1 + x)^n \ge 1 + nx$$
This is **Bernoulli's inequality** (Jacob Bernoulli, 1689). In money terms: compound growth at rate $x$ for $n$ periods always gives at least as much as simple growth. The extra comes from interest on interest.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Curve over line',
              body: r`Compare $y = (1 + x)^n$ with the straight line $y = 1 + nx$. Change $n$.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 1, ymin: -2, ymax: 6, grid: 0.25, gridY: 1, height: 280, axes: { xlabel: 'x', ylabel: 'y', xAt: -1 },
                params: { n: { min: 1, max: 8, step: 1, value: 3, label: 'n', color: 'violet' } },
                curves: [{ f: (x, p) => (1 + x) ** p.n, color: 'violet', width: 3 }, { f: (x, p) => 1 + p.n * x, color: 'coral', width: 2.5, dash: true }],
                readout: (p) => r`$(1 + x)^{${p.n}}$ (solid) stays above $1 + ${p.n}x$ (dashed), touching at $x = 0$`,
              },
              after: r`The line is the **tangent** to the curve at $x = 0$, and the curve bends upward, so it never dips below. Even for negative $x$ down to $-1$, the inequality holds.`,
            },
            {
              type: 'numeric',
              title: 'A quick bound',
              prompt: r`Use Bernoulli to give a lower bound for $1.01^{100}$ (as $1 + nx$).`,
              answer: 2,
              wrong: [{ v: 1.01, tol: 0.001, why: r`$1 + nx = 1 + 100 \times 0.01$.` }],
              explain: r`$1.01^{100} \ge 1 + 100 \times 0.01 = 2$. The true value is about $2.70$, close to $e$: compounding adds 70% beyond the simple estimate.`,
            },
            {
              type: 'numeric',
              title: 'A shrinking bound',
              prompt: r`Bernoulli’s inequality also works for negative $x$ (as long as $x \ge -1$). What lower bound does it give for $0.98^{10}$?`,
              answer: 0.8,
              tol: 0.001,
              explain: r`$(1 - 0.02)^{10} \ge 1 - 10 \times 0.02 = 0.8$. The true value is about $0.817$: losing 2% ten times in a row loses a little less than 20%, because each loss is taken from a smaller amount.`,
            },
            {
              type: 'numeric',
              title: 'A guaranteed doubling',
              prompt: r`Savings grow by 5% a year, so after $n$ years they are multiplied by $1.05^n$. Bernoulli says $1.05^n \ge 1 + 0.05n$. What is the smallest $n$ for which this **guarantees** the savings have at least doubled?`,
              unit: 'years',
              answer: 20,
              wrong: [{ v: 14, why: r`The savings really do double after about 14 years, but Bernoulli's bound $1 + 0.05 \times 14 = 1.7$ can't guarantee it yet.` }],
              explain: r`$1 + 0.05n \ge 2$ when $n \ge 20$, so after 20 years the savings have certainly doubled. In fact they double after about 14.2 years (the rule of 70), because compounding adds more than the bound counts. Bernoulli gives a safe, if pessimistic, deadline: the bound is sharp only when $nx$ is small.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why x ≥ −1?',
              prompt: r`Bernoulli's inequality needs $x \ge -1$. Check $x = -3$ with $n = 5$: is $(1 + x)^5 \ge 1 + 5x$?`,
              choices: [
                { t: r`No: $(-2)^5 = -32$, which is less than $1 - 15 = -14$`, ok: true },
                { t: 'Yes: it holds for every x', why: r`$(-2)^5 = -32$ and $1 + 5(-3) = -14$. Since $-32 < -14$, it fails.` },
                { t: 'The left side isn’t defined', why: r`$(-2)^5 = -32$ is perfectly well defined.` },
              ],
              explain: r`With $1 + x < 0$, odd powers become large and **negative**, dropping below the line. The condition $x \ge -1$ keeps $1 + x \ge 0$, so the curve can't dive.`,
            },
          ],
          recap: [
            r`Bernoulli: $(1 + x)^n \ge 1 + nx$ for $x \ge -1$.`,
            'Compound growth always beats simple growth.',
            'The line 1 + nx is the tangent to the curve at x = 0.',
          ],
        },
      ],
    },
  ],
};
