import { fix } from '../lib/svg.js';

const r = String.raw;
// fixed d decimals, so live readouts never change length as a value moves (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d).replace('−', '-');
const sgn = (v, sym = '', d = 1) => (v === 0 ? '' : v > 0 ? ` + ${f2(v, d)}${sym}` : ` - ${f2(-v, d)}${sym}`);
const XY = { xlabel: 'x', ylabel: 'y' };

export default {
  id: 'quadratics',
  subject: 'math',
  title: 'Quadratics & Polynomials',
  level: 'Intermediate',
  cover: 'quadratics',
  tagline: 'Factoring, completing the square, the quadratic formula, Vieta and beyond.',
  description: r`Quadratics describe projectiles, profits and areas. Learn to factor them with area pictures, complete the square to find the vertex, derive the quadratic formula yourself, relate roots to coefficients with Vieta's formulas, see how higher-degree polynomials behave, and use quadratics to find maximum revenue and area.`,
  prereq: 'Functions & Graphs',
  chapters: [
    {
      title: 'Solving Quadratics',
      summary: 'Three methods, one idea.',
      lessons: [
        {
          id: 'factoring',
          title: 'Factoring',
          summary: 'Area pictures and the zero product',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Expand',
              prompt: r`Expand $(x + 3)(x + 5)$. What is the coefficient of $x$?`,
              answer: 8,
              wrong: [{ v: 15, why: r`15 is the constant term ($3 \times 5$). The $x$ terms are $5x + 3x$.` }],
              explain: r`$(x + 3)(x + 5) = x^2 + 5x + 3x + 15 = x^2 + 8x + 15$. The middle coefficient is the **sum** $3 + 5$, and the constant is the **product** $3 \times 5$.`,
            },
            {
              type: 'explain',
              title: 'The area model',
              body: r`Picture $(x + 3)(x + 5)$ as the area of a rectangle with sides $x + 3$ and $x + 5$. It splits into four pieces: $x^2$, $3x$, $5x$ and $15$.`,
              widget: {
                kind: 'figure', w: 600, h: 260, label: 'Area model for (x+3)(x+5)',
                draw: ({ s }) => {
                  const X = 140, A = 60, B = 100, x0 = 150, y0 = 30;
                  const box = (x, y, w, h, cls, t) => [s('rect', { x, y, width: w, height: h, class: cls, stroke: 'var(--card)', 'stroke-width': 3 }), s('text', { x: x + w / 2, y: y + h / 2 + 7, 'text-anchor': 'middle', class: 'lbl-math', text: t })];
                  return [
                    ...box(x0, y0, X, X, 'fl-blue-soft', 'x²'), ...box(x0 + X, y0, B, X, 'fl-teal-soft', '5x'),
                    ...box(x0, y0 + X, X, A, 'fl-coral-soft', '3x'), ...box(x0 + X, y0 + X, B, A, 'fl-amber-soft', '15'),
                    s('text', { x: x0 + X / 2, y: y0 - 8, 'text-anchor': 'middle', class: 'lbl-math', text: 'x' }), s('text', { x: x0 + X + B / 2, y: y0 - 8, 'text-anchor': 'middle', class: 'lbl-math', text: '5' }),
                    s('text', { x: x0 - 12, y: y0 + X / 2, 'text-anchor': 'end', class: 'lbl-math', text: 'x' }), s('text', { x: x0 - 12, y: y0 + X + A / 2 + 6, 'text-anchor': 'end', class: 'lbl-math', text: '3' }),
                  ];
                },
              },
              after: r`**Factoring** runs this backwards: to factor $x^2 + bx + c$, find two numbers that **add** to $b$ and **multiply** to $c$.`,
            },
            {
              type: 'mcq',
              title: 'Factor it',
              prompt: r`Factor $x^2 - x - 12$.`,
              cols: 2,
              choices: [
                { t: r`$(x - 4)(x + 3)$`, ok: true },
                { t: r`$(x + 4)(x - 3)$`, why: r`That gives $x^2 + x - 12$. The middle term comes out $+x$, not $-x$.` },
                { t: r`$(x - 6)(x + 2)$`, why: r`Product $-12$ ✓, but the sum is $-4$, not $-1$.` },
                { t: r`$(x - 12)(x + 1)$`, why: r`The sum is $-11$, not $-1$.` },
              ],
              explain: r`You need two numbers with product $-12$ and sum $-1$: they're $-4$ and $+3$. So $x^2 - x - 12 = (x - 4)(x + 3)$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Build the rectangle',
              prompt: r`Choose $p$ and $q$ so that the rectangle $(x + p)(x + q)$ has area $x^2 + 7x + 12$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 12, ymin: 0, ymax: 12, grid: false, axes: false, maxWidth: 380,
                params: { p: { min: 1, max: 6, step: 1, value: 1, label: 'p', color: 'coral' }, q: { min: 1, max: 6, step: 1, value: 6, label: 'q', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const X = 5, box = (x, y, w, h, cls, t) => [s('rect', { x: plot.X(x), y: plot.Y(y + h), width: plot.X(x + w) - plot.X(x), height: plot.Y(y) - plot.Y(y + h), class: cls, stroke: 'var(--card)', 'stroke-width': 3 }), s('text', { x: plot.X(x + w / 2), y: plot.Y(y + h / 2) + 6, 'text-anchor': 'middle', class: 'lbl-math', text: t })];
                  return [...box(0.5, 11.5 - X, X, X, 'fl-blue-soft', 'x²'), ...box(0.5 + X, 11.5 - X, p.q, X, 'fl-teal-soft', `${p.q}x`), ...box(0.5, 11.5 - X - p.p, X, p.p, 'fl-coral-soft', `${p.p}x`), ...box(0.5 + X, 11.5 - X - p.p, p.q, p.p, 'fl-amber-soft', `${p.p * p.q}`)];
                },
                readout: (p) => r`$(x + ${p.p})(x + ${p.q}) = x^2 + ${p.p + p.q}x + ${p.p * p.q}$`,
                goal: (p) => p.p + p.q === 7 && p.p * p.q === 12,
                hint: 'You need two numbers that add to 7 and multiply to 12.',
                solution: { p: 3, q: 4 },
              },
              explain: r`$3 + 4 = 7$ and $3 \times 4 = 12$, so $x^2 + 7x + 12 = (x + 3)(x + 4)$. The two strips give the middle term; the corner gives the constant.`,
            },
            {
              type: 'mcq',
              title: 'Difference of squares',
              prompt: r`Factor $x^2 - 49$.`,
              cols: 2,
              choices: [
                { t: r`$(x - 7)(x + 7)$`, ok: true },
                { t: r`$(x - 7)^2$`, why: r`$(x - 7)^2 = x^2 - 14x + 49$, with a middle term.` },
                { t: r`$(x - 49)(x + 1)$`, why: r`That gives $x^2 - 48x - 49$.` },
                { t: 'It can’t be factored', why: r`Two numbers that add to 0 and multiply to $-49$: $7$ and $-7$.` },
              ],
              explain: r`$a^2 - b^2 = (a - b)(a + b)$: the middle terms cancel. Handy mental maths: $51 \times 49 = 50^2 - 1^2 = 2499$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Solve',
              prompt: r`Solve $x^2 - x - 12 = 0$. What is the positive solution?`,
              lhs: r`$x =$`,
              answer: 4,
              wrong: [{ v: 3, why: r`$(x - 4)(x + 3) = 0$ gives $x = 4$ or $x = -3$.` }, { v: 12, why: 'Factor first, then set each factor to zero.' }],
              explain: r`$(x - 4)(x + 3) = 0$, and a product is zero only when a factor is zero: $x = 4$ or $x = -3$. The positive solution is 4.`,
            },
          ],
          recap: [
            r`$(x + p)(x + q) = x^2 + (p+q)x + pq$.`,
            'To factor, find two numbers that add to b and multiply to c.',
            'Zero product: if AB = 0, then A = 0 or B = 0.',
          ],
        },
        {
          id: 'completing-square',
          title: 'Completing the Square',
          summary: 'Find the vertex, every time',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A perfect square',
              prompt: r`What number completes the square: $x^2 + 6x + \square = (x + ?)^2$?`,
              cols: 2,
              choices: [
                { t: '9', ok: true },
                { t: '6', why: r`$(x + 3)^2 = x^2 + 6x + 9$. You need half of 6, squared.` },
                { t: '36', why: 'That’s 6 squared. Take half of 6 first, then square it.' },
                { t: '3', why: r`$x + 3$ is inside the bracket, but the constant you add is $3^2 = 9$.` },
              ],
              explain: r`$(x + 3)^2 = x^2 + 6x + 9$. In general, $x^2 + bx$ needs $\left(\tfrac b2\right)^2$ added to become a perfect square.`,
            },
            {
              type: 'explain',
              title: 'Why it’s called that',
              body: r`Picture $x^2 + 6x$ as an $x \times x$ square plus a $6 \times x$ strip. Split the strip into two halves and put one on each side of the square. That leaves a missing $3 \times 3$ corner. Adding 9 **completes the square**:
$$x^2 + 6x + 9 = (x + 3)^2$$

To rewrite any quadratic, add and subtract the missing corner:
$$x^2 + 6x + 5 = (x + 3)^2 - 9 + 5 = (x + 3)^2 - 4$$
This **vertex form** shows the lowest point at once: $(-3, -4)$.`,
            },
            { /*anim:quadratics*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Completing it, literally',
              body: r`The same idea in motion, the way al-Khwarizmi drew it around 820 AD: an {blue:$x \times x$ square} and a {coral:$6 \times x$ strip}. Split the strip and move the halves.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.8, xmax: 11.4, ymin: -0.9, ymax: 8.2, grid: false, axes: false, maxWidth: 520,
                animate: { param: 't', speed: 0.5, max: 5, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const X = 4.5, sm = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
                  const e1 = sm((p.t - 0.6) / 1.2), e2 = sm((p.t - 2.1) / 1.4), e3 = sm((p.t - 3.6) / 0.6);
                  const rect = (x0, y0, w, h, o) => s('rect', { x: plot.X(x0), y: plot.Y(y0 + h), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(h), stroke: 'var(--card)', 'stroke-width': 2, ...o });
                  const T = (x, y, text, fill, fs = 18) => s('text', { x: plot.X(x), y: plot.Y(y) + 6, 'text-anchor': 'middle', class: 'lbl-math halo-text', style: `font-size:max(calc(${fs}px * var(--fs, 1)), var(--fmin, 0px));fill:${fill}`, text });
                  const els = [];
                  // the square sits at the top left: x from 0 to X, y from 8 - X to 8 (top edge at y = 7.6)
                  const top = 7.6, y0 = top - X;
                  els.push(rect(0, y0, X, X, { class: 'fl-blue', opacity: 0.75 }));
                  // strip halves: start side by side to the right of the square (each 3 wide, X tall)
                  els.push(rect(X, y0, 3, X, { class: 'fl-coral', opacity: 0.75 }));
                  // second half: starts at x = X + 3, then turns and moves under the square
                  const th = (-Math.PI / 2) * e2, c0 = [X + 3 + 1.5 + 0.4 * e1, y0 + X / 2], c1 = [X / 2, y0 - 1.5], cx = c0[0] + (c1[0] - c0[0]) * e2, cy = c0[1] + (c1[1] - c0[1]) * e2;
                  const corner = ([dx, dy]) => [cx + dx * Math.cos(th) - dy * Math.sin(th), cy + dx * Math.sin(th) + dy * Math.cos(th)];
                  const pts = [[-1.5, -X / 2], [1.5, -X / 2], [1.5, X / 2], [-1.5, X / 2]].map(corner);
                  els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: 'fl-coral', opacity: 0.75, stroke: 'var(--card)', 'stroke-width': 2 }));
                  // the missing corner
                  if (e2 > 0.98) els.push(rect(X, y0 - 3, 3, 3, e3 > 0 ? { class: 'fl-amber', opacity: 0.25 + 0.6 * e3 } : { fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }));
                  els.push(T(X / 2, y0 + X / 2, 'x²', '#fff', 22));
                  els.push(T(X / 2, top + 0.35, 'x', 'var(--blue)'));
                  els.push(T(X + 1.5, top + 0.35, '3', 'var(--coral)'));
                  if (e2 > 0.98) { els.push(T(X + 1.5, y0 - 1.5, e3 > 0.5 ? '9' : '?', 'var(--ink)')); els.push(T(-0.4, y0 - 1.5, '3', 'var(--coral)')); }
                  if (e2 < 0.02) els.push(T(X + 4.5 + 0.4 * e1, top + 0.35, '3', 'var(--coral)'));
                  return els;
                },
                readout: (p) => (p.t < 2.1 ? r`$x^2 + 6x$: a square and a strip of width 6, cut in half` : p.t < 3.6 ? r`one half on each side: an L-shape, still with area $x^2 + 6x$` : r`fill the gap: $x^2 + 6x + \amber{9} = (x + 3)^2$`),
              },
              after: r`The two halves of the strip make an L-shape that is a square with one corner missing. The missing corner is $3 \times 3$, half the strip's width squared. Add it, and the shape is a complete square of side $x + 3$. That is all "completing the square" means: $x^2 + bx + \left(\tfrac{b}{2}\right)^2 = \left(x + \tfrac{b}{2}\right)^2$.`,
            },
            {
              type: 'numeric',
              title: 'Vertex',
              prompt: r`Complete the square: $x^2 - 8x + 10 = (x - 4)^2 + k$. What is $k$?`,
              lhs: r`$k =$`,
              answer: -6,
              wrong: [{ v: 26, why: r`$(x - 4)^2 = x^2 - 8x + 16$, so subtract 16: $10 - 16$.` }, { v: 6, why: r`$10 - 16 = -6$.` }],
              explain: r`$(x - 4)^2 = x^2 - 8x + 16$, so $x^2 - 8x + 10 = (x - 4)^2 - 6$. The vertex is at $(4, -6)$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the vertex',
              prompt: r`Drag the vertex of $y = (x - h)^2 + k$ so it matches the dashed parabola $y = x^2 - 4x + 1$.`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 7, ymin: -5, ymax: 8, grid: 1, height: 300, axes: XY,
                params: { h: { min: -3, max: 6, step: 0.5, value: 0, slider: false }, k: { min: -5, max: 6, step: 0.5, value: 0, slider: false } },
                curves: [{ f: (x) => x * x - 4 * x + 1, color: 'ink', dash: true, width: 2 }, { f: (x, p) => (x - p.h) ** 2 + p.k, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.h, y: (p) => p.k, drag: { x: 'h', y: 'k' }, color: 'coral' }],
                readout: (p) => r`$y = (x ${sgn(-p.h)})^2 ${sgn(p.k)}$`,
                goal: (p) => p.h === 2 && p.k === -3,
                hint: r`Complete the square: $x^2 - 4x = (x - 2)^2 - 4$.`,
                solution: { h: 2, k: -3 },
              },
              explain: r`$x^2 - 4x + 1 = (x - 2)^2 - 4 + 1 = (x - 2)^2 - 3$: vertex $(2, -3)$. Completing the square turns a formula into a picture.`,
            },
            {
              type: 'numeric',
              title: 'Highest point',
              prompt: r`A ball's height is $h(t) = -5t^2 + 20t + 1$ metres. Completing the square gives $h = -5(t - 2)^2 + k$. What is its maximum height $k$?`,
              unit: 'm',
              answer: 21,
              wrong: [{ v: 1, why: 'That’s the starting height. The peak comes at t = 2.' }, { v: 20, why: r`Check: $h(2) = -20 + 40 + 1$.` }],
              explain: r`$-5t^2 + 20t = -5(t^2 - 4t) = -5[(t - 2)^2 - 4] = -5(t - 2)^2 + 20$, so $h = -5(t - 2)^2 + 21$. The peak is 21 m, at $t = 2$ s.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Solve by completing the square',
              prompt: r`Solve $x^2 + 6x + 5 = 0$ by completing the square. What is the larger solution?`,
              lhs: r`$x =$`,
              answer: -1,
              wrong: [{ v: -5, why: 'That’s the smaller solution.' }, { v: 1, why: r`$(x + 3)^2 = 4$ gives $x + 3 = \pm 2$, so $x = -1$ or $x = -5$.` }],
              explain: r`$(x + 3)^2 - 4 = 0$, so $(x + 3)^2 = 4$ and $x + 3 = \pm 2$. That gives $x = -1$ or $x = -5$. The larger is $-1$.`,
            },
          ],
          recap: [
            r`$x^2 + bx$ becomes a perfect square by adding $(b/2)^2$.`,
            r`Vertex form $(x - h)^2 + k$ shows the vertex $(h, k)$.`,
            'Completing the square solves every quadratic, even ones that don’t factor nicely.',
          ],
        },
        {
          id: 'formula',
          title: 'The Quadratic Formula',
          summary: 'And the discriminant',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'One formula for every quadratic',
              body: r`Completing the square on $ax^2 + bx + c = 0$ gives the **quadratic formula**:
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
The expression under the root, $\Delta = b^2 - 4ac$, is the **discriminant**. It tells you how many real solutions there are, before you solve anything.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The discriminant',
              body: r`Adjust $a$, $b$ and $c$. Watch where $y = ax^2 + bx + c$ crosses the $x$-axis.`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 6, ymin: -6, ymax: 6, grid: 1, height: 360, axes: XY,
                params: {
                  a: { min: -2, max: 2, step: 0.5, value: 1, label: '$a$', color: 'blue' },
                  b: { min: -5, max: 5, step: 0.5, value: -1, label: '$b$', color: 'teal' },
                  c: { min: -5, max: 5, step: 0.5, value: -2, label: '$c$', color: 'coral' },
                },
                curves: [{ f: (x, p) => p.a * x * x + p.b * x + p.c, color: 'blue' }],
                extra: ({ plot, p, s }) => {
                  const D = p.b * p.b - 4 * p.a * p.c;
                  if (p.a === 0 || D < 0) return [];
                  const rts = D === 0 ? [-p.b / (2 * p.a)] : [(-p.b + Math.sqrt(D)) / (2 * p.a), (-p.b - Math.sqrt(D)) / (2 * p.a)];
                  return rts.filter((x) => x >= plot.xmin && x <= plot.xmax).map((x) => s('circle', { cx: plot.X(x), cy: plot.Y(0), r: 7, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 }));
                },
                readout: (p) => {
                  if (p.a === 0) return r`$a = 0$: not a quadratic (it's a line)`;
                  const D = p.b * p.b - 4 * p.a * p.c;
                  return r`$\Delta = b^2 - 4ac = ${f2(D)}$: ${D > 0 ? 'two real roots' : D === 0 ? 'one repeated root' : 'no real roots'}`;
                },
              },
              after: r`$\Delta > 0$: two real roots. $\Delta = 0$: the parabola just touches the axis (one repeated root). $\Delta < 0$: it never reaches the axis, so there are no real roots. (There are two complex ones: see the Complex Numbers course.)`,
            },
            {
              type: 'numeric',
              title: 'Use the formula',
              prompt: r`Solve $2x^2 + 3x - 2 = 0$. What is the positive root? (Give a decimal or a fraction.)`,
              lhs: r`$x =$`,
              answer: 0.5,
              wrong: [{ v: -2, why: 'That’s the negative root.' }, { v: 2, why: r`$x = \frac{-3 \pm 5}{4}$, so $\frac{2}{4}$ or $\frac{-8}{4}$.` }],
              explain: r`$\Delta = 9 + 16 = 25$. $x = \frac{-3 \pm 5}{4}$: either $\frac{2}{4} = \frac12$ or $-2$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Just touching',
              prompt: r`Adjust $c$ so that $y = x^2 + 6x + c$ just **touches** the $x$-axis.`,
              widget: {
                kind: 'graph', xmin: -8, xmax: 2, ymin: -4, ymax: 8, grid: 1, height: 280, axes: XY,
                params: { c: { min: 0, max: 15, step: 0.5, value: 5, label: '$c$', color: 'coral' } },
                curves: [{ f: (x, p) => x * x + 6 * x + p.c, color: 'blue', width: 3 }],
                readout: (p) => r`$\Delta = 36 - 4c = ${36 - 4 * p.c}$`,
                goal: (p) => p.c === 9,
                hint: 'Touching means exactly one root: the discriminant must be zero.',
                solution: { c: 9 },
              },
              explain: r`$\Delta = 36 - 4c = 0$ gives $c = 9$, and indeed $x^2 + 6x + 9 = (x + 3)^2$. Tangency is a discriminant of zero.`,
            },
            {
              type: 'numeric',
              title: 'The golden ratio',
              prompt: r`Solve $x^2 - x - 1 = 0$. What is the positive root? (3 decimal places.)`,
              answer: (1 + Math.sqrt(5)) / 2,
              tol: 0.0006,
              wrong: [{ v: (1 - Math.sqrt(5)) / 2, tol: 0.001, why: 'That’s the negative root.' }],
              explain: r`$x = \frac{1 \pm \sqrt{5}}{2}$, so the positive root is $\frac{1 + \sqrt5}{2} \approx 1.618$: the **golden ratio** $\varphi$, which satisfies $\varphi^2 = \varphi + 1$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How many roots?',
              prompt: r`How many real solutions does $3x^2 - 6x + 3 = 0$ have?`,
              cols: 2,
              choices: [
                { t: 'Exactly one', ok: true },
                { t: 'Two', why: r`$\Delta = 36 - 36 = 0$: the parabola just touches the axis.` },
                { t: 'None', why: r`$\Delta = 0$, not negative. There's one (repeated) root.` },
              ],
              explain: r`$\Delta = (-6)^2 - 4(3)(3) = 36 - 36 = 0$: one repeated root, $x = 1$. Indeed $3x^2 - 6x + 3 = 3(x - 1)^2$.`,
            },
          ],
          recap: [
            r`$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ solves every quadratic.`,
            r`Discriminant $\Delta = b^2 - 4ac$: positive means 2 roots, zero means 1, negative means none (real).`,
            'Check your roots by substituting them back.',
          ],
        },
      ],
    },
    {
      title: 'Polynomials',
      summary: 'Higher powers.',
      lessons: [
        {
          id: 'polynomials',
          title: 'Polynomial Shapes',
          summary: 'Degree, roots and turns',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Roots and wiggles',
              body: r`A polynomial in factored form, $y = (x - r_1)(x - r_2)(x - r_3)$, crosses the axis at each root. Drag the three roots.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: -8, ymax: 8, grid: 1, gridY: 2, height: 360, axes: XY,
                params: {
                  r1: { min: -4.5, max: 4.5, step: 0.5, value: -3, slider: false },
                  r2: { min: -4.5, max: 4.5, step: 0.5, value: 0, slider: false },
                  r3: { min: -4.5, max: 4.5, step: 0.5, value: 2, slider: false },
                },
                curves: [{ f: (x, p) => 0.4 * (x - p.r1) * (x - p.r2) * (x - p.r3), color: 'violet' }],
                points: ['r1', 'r2', 'r3'].map((k) => ({ x: (p) => p[k], y: () => 0, drag: { x: k }, color: 'coral' })),
                readout: (p) => r`$y = 0.4(x ${sgn(-p.r1)})(x ${sgn(-p.r2)})(x ${sgn(-p.r3)})$`,
              },
              after: r`A cubic (degree 3) has at most 3 roots and at most 2 turning points. Drag two roots together and the curve just **touches** the axis there: a repeated root.`,
            },
            {
              type: 'mcq',
              title: 'How many roots?',
              prompt: r`What is the most real roots a polynomial of degree 5 can have?`,
              cols: 2,
              choices: [
                { t: '5', ok: true },
                { t: '4', why: 'A degree-n polynomial can have up to n real roots, and some degree-5 polynomials have all 5.' },
                { t: 'Infinitely many', why: 'A nonzero polynomial of degree n has at most n roots.' },
              ],
              explain: r`A degree-$n$ polynomial has at most $n$ real roots and at most $n - 1$ turning points. Counting complex roots (with repeats), it has **exactly** $n$: that's the **fundamental theorem of algebra**.`,
            },
            {
              type: 'mcq',
              title: 'End behaviour',
              prompt: r`For very large positive and negative $x$, what does $y = -2x^4 + 100x^3$ do?`,
              choices: [
                { t: 'It goes down on both sides', ok: true },
                { t: 'It goes up on both sides', why: 'The leading term −2x⁴ has a negative coefficient, so it eventually dives on both sides.' },
                { t: 'Up on one side, down on the other', why: 'That happens with odd degree. Here the leading power (4) is even.' },
              ],
              explain: r`For huge $|x|$, the highest power dominates. $-2x^4$ is very negative for large positive **and** large negative $x$, so both ends go down. (The $100x^3$ term matters in the middle, not at the ends.)`,
            },
            {
              type: 'numeric',
              title: 'The factor theorem',
              prompt: r`For which value of $k$ is $(x - 2)$ a factor of $x^3 + kx - 4$?`,
              lhs: r`$k =$`,
              answer: -2,
              wrong: [{ v: 2, why: r`Set $p(2) = 0$: $8 + 2k - 4 = 0$, so $2k = -4$.` }],
              explain: r`$(x - 2)$ is a factor exactly when $p(2) = 0$: $8 + 2k - 4 = 0$, so $k = -2$. Then $x^3 - 2x - 4 = (x - 2)(x^2 + 2x + 2)$.`,
            },
            {
              type: 'numeric',
              title: 'Turning points',
              prompt: r`What is the greatest number of turning points (hills and valleys) a polynomial of degree 5 can have?`,
              answer: 4,
              explain: r`Turning points are where the derivative, a polynomial of degree 4, is zero, so there are at most 4.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Remainder theorem',
              body: r`The **remainder theorem**: when a polynomial $p(x)$ is divided by $(x - a)$, the remainder is $p(a)$. In particular, $p(a) = 0$ exactly when $(x - a)$ is a factor.`,
              prompt: r`What is the remainder when $x^3 - 2x^2 + 5$ is divided by $(x - 3)$?`,
              answer: 14,
              wrong: [{ v: 5, why: r`Substitute $x = 3$: $27 - 18 + 5$.` }, { v: 32, why: r`$3^3 = 27$ and $2 \times 3^2 = 18$, so $27 - 18 + 5$.` }],
              explain: r`$p(3) = 27 - 18 + 5 = 14$. No long division needed!`,
            },
          ],
          recap: [
            'A degree-n polynomial has at most n real roots and at most n − 1 turns.',
            'The leading term decides what happens at the ends.',
            r`Remainder theorem: dividing $p(x)$ by $(x - a)$ leaves $p(a)$.`,
          ],
        },
        {
          id: 'vieta',
          title: 'Vieta’s Formulas',
          summary: 'Roots from coefficients',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Sum and product',
              body: r`If a quadratic $x^2 + bx + c$ has roots $r_1$ and $r_2$, it factors as $(x - r_1)(x - r_2) = x^2 - (r_1 + r_2)x + r_1 r_2$. Matching coefficients:
$$r_1 + r_2 = -b, \qquad r_1 r_2 = c$$
These are **Vieta's formulas** (François Viète, 1590s). You can learn about the roots without solving.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Place the roots',
              prompt: r`Drag the two roots so that the parabola becomes $y = x^2 - 5x + 6$.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 6, ymin: -4, ymax: 8, grid: 1, height: 280, axes: XY,
                params: { r1: { min: -4, max: 5, step: 0.5, value: -1, slider: false }, r2: { min: -4, max: 5, step: 0.5, value: 4, slider: false } },
                curves: [{ f: (x, p) => (x - p.r1) * (x - p.r2), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.r1, y: () => 0, drag: { x: 'r1' }, color: 'coral' }, { x: (p) => p.r2, y: () => 0, drag: { x: 'r2' }, color: 'coral' }],
                readout: (p) => r`$y = x^2 ${sgn(-(p.r1 + p.r2), 'x')} ${sgn(p.r1 * p.r2, '', 2)}$: $\;$ sum $= ${f2(p.r1 + p.r2, 1)}$, product $= ${f2(p.r1 * p.r2)}$`,
                goal: (p) => p.r1 + p.r2 === 5 && p.r1 * p.r2 === 6,
                hint: 'You need two roots that add to 5 and multiply to 6.',
                solution: { r1: 2, r2: 3 },
              },
              explain: r`Roots 2 and 3: sum $5 = -b$ and product $6 = c$ ✓. Moving the roots changes the coefficients in a completely predictable way.`,
            },
            {
              type: 'numeric',
              title: 'Without solving',
              prompt: r`For $2x^2 - 7x + 3 = 0$, what is the **sum** of the roots? (For $ax^2 + bx + c$, the sum is $-\frac{b}{a}$.)`,
              answer: 3.5,
              tol: 0.001,
              wrong: [{ v: 7, why: r`Divide by $a = 2$: $\frac{7}{2}$.` }, { v: 1.5, tol: 0.001, why: r`That's the product, $\frac{c}{a}$.` }],
              explain: r`Sum $= -\frac{b}{a} = \frac{7}{2} = 3.5$, product $= \frac{c}{a} = 1.5$. (The roots are 3 and $\frac12$.)`,
            },
            {
              type: 'numeric',
              title: 'Build a quadratic',
              prompt: r`A quadratic $x^2 + bx + c$ has roots $1 + \sqrt2$ and $1 - \sqrt2$. What is $c$?`,
              lhs: r`$c =$`,
              answer: -1,
              wrong: [{ v: 2, why: 'That’s the sum of the roots. c is the product.' }, { v: 3, why: r`$(1 + \sqrt2)(1 - \sqrt2) = 1 - 2$.` }],
              explain: r`Product $= (1 + \sqrt2)(1 - \sqrt2) = 1 - 2 = -1$, and sum $= 2$, so the quadratic is $x^2 - 2x - 1$. The square roots cancel: irrational roots of quadratics with whole-number coefficients come in such pairs.`,
            },
            {
              type: 'numeric',
              title: 'Vieta for a cubic',
              prompt: r`For $x^3 - 6x^2 + 11x - 6 = 0$, Vieta’s formulas say the roots add up to the negative of the $x^2$ coefficient. What is the sum of the roots?`,
              answer: 6,
              explain: r`The roots sum to 6 (they are 1, 2 and 3). They also multiply to 6, and the sum of their products in pairs is 11.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sum of squares of roots',
              prompt: r`The roots $r, s$ of $x^2 - 7x + 10 = 0$ satisfy $r + s = 7$ and $rs = 10$. Without solving, find $r^2 + s^2$.`,
              answer: 29,
              wrong: [{ v: 49, why: r`That’s $(r + s)^2$. Subtract $2rs$.` }],
              explain: r`$r^2 + s^2 = (r + s)^2 - 2rs = 49 - 20 = 29$. Check: the roots are 2 and 5, and $4 + 25 = 29$ ✓. Vieta’s formulas often give answers faster than finding the roots.`,
            },
          ],
          recap: [
            r`For $x^2 + bx + c$: sum of roots $= -b$, product $= c$.`,
            r`For $ax^2 + bx + c$: sum $= -b/a$, product $= c/a$.`,
            'Vieta’s formulas reveal roots’ properties without solving.',
          ],
        },
        {
          id: 'applications',
          title: 'Quadratics at Work',
          summary: 'Maximising revenue and area',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Why parabolas appear',
              body: r`Whenever one quantity is the product of two things that pull in opposite directions, a quadratic appears. Raise a ticket price and you earn more per ticket but sell fewer: revenue = price × tickets sold. Its graph is an upside-down parabola, and the best price sits at the **vertex**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the price',
              prompt: r`A theatre sells $100 - 2p$ tickets at a price of £$p$. Find the price that maximises revenue $R = p(100 - 2p)$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 1400, grid: 5, gridY: 200, height: 280, padL: 52, axes: { xlabel: 'price (£)', ylabel: 'revenue (£)' },
                params: { p: { min: 0, max: 50, step: 1, value: 10, slider: false } },
                curves: [{ f: (x) => x * (100 - 2 * x), color: 'violet', width: 3 }],
                points: [{ x: (q) => q.p, y: (q) => q.p * (100 - 2 * q.p), drag: { x: 'p' }, color: 'coral' }],
                readout: (q) => r`price £${q.p}: ${100 - 2 * q.p} tickets, revenue £${q.p * (100 - 2 * q.p)}`,
                goal: (q) => q.p === 25,
                hint: 'The roots of R are at p = 0 and p = 50. The vertex is halfway between.',
                solution: { p: 25 },
              },
              explain: r`$R = p(100 - 2p)$ is zero at $p = 0$ and $p = 50$, and the vertex lies midway: $p = £25$, selling 50 tickets for £1250. A higher price loses more sales than it gains per ticket.`,
            },
            {
              type: 'numeric',
              title: 'Time of flight',
              prompt: r`A stone is thrown upward: $h(t) = 15t - 5t^2$. After how many seconds does it land ($h = 0$, $t > 0$)?`,
              unit: 's',
              answer: 3,
              wrong: [{ v: 1.5, why: 'That’s when it reaches its peak. It lands at the other root.' }],
              explain: r`$15t - 5t^2 = 5t(3 - t) = 0$, so $t = 0$ (thrown) or $t = 3$ s (lands). The peak is halfway, at 1.5 s.`,
            },
            {
              type: 'numeric',
              title: 'Fence against a wall',
              prompt: r`With 40 m of fence you enclose a rectangle against a long wall (three sides fenced). With side $x$ perpendicular to the wall, the area is $A = x(40 - 2x)$. What's the largest possible area?`,
              unit: 'm²',
              answer: 200,
              wrong: [{ v: 100, why: r`That's a $10 \times 10$ square, but here only three sides are fenced: try $x = 10$ in $x(40 - 2x)$.` }, { v: 400, why: r`$A(10) = 10 \times 20 = 200$.` }],
              explain: r`Roots at $x = 0$ and $x = 20$, vertex at $x = 10$: $A = 10 \times 20 = 200$ m². The side along the wall is twice the others.`,
            },
            {
              type: 'numeric',
              title: 'Discounting a tour',
              prompt: r`A coach tour charges £40 per person and 30 people book. For every £1 cut in price, 2 more people book, so a cut of £$x$ gives revenue $R = (40 - x)(30 + 2x)$. What price per person maximises revenue?`,
              unit: '£',
              answer: 27.5,
              wrong: [{ v: 12.5, why: r`That's the best **cut**, $x = 12.5$. The price is $40 - 12.5$.` }, { v: 40, why: r`At £40 the revenue is £1200, but a cut brings in enough extra people to do better.` }],
              explain: r`$R = 0$ when $x = 40$ or $x = -15$, so the vertex is midway, at $x = \frac{40 + (-15)}{2} = 12.5$. The best price is $40 - 12.5 = £27.50$: 55 people pay a total of £1512.50, against £1200 at the full price. The roots needn't be at zero; the vertex is always halfway between them.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Highest point',
              prompt: r`A ball’s height is $h = 20t - 5t^2$ metres after $t$ seconds. What is its maximum height?`,
              unit: 'm',
              answer: 20,
              wrong: [{ v: 2, why: r`That’s the time of the highest point. Plug it in: $h(2) = 20$.` }],
              explain: r`The vertex is at $t = \frac{20}{2 \times 5} = 2$ s, where $h = 40 - 20 = 20$ m. By symmetry it lands at $t = 4$ s.`,
            },
          ],
          recap: [
            'Products of opposing factors give quadratics.',
            'The maximum (or minimum) is at the vertex, midway between the roots.',
            'Revenue, projectile height and fenced areas are all quadratic.',
          ],
        },
        {
          id: 'differences',
          title: 'Finite Differences',
          summary: 'Spotting quadratics in data',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Differences of differences',
              body: r`Take a sequence and subtract each term from the next: these are the **first differences**. Do it again to get the **second differences**.

For the squares $1, 4, 9, 16, 25$: first differences $3, 5, 7, 9$, second differences $2, 2, 2$. Constant second differences are the fingerprint of a quadratic. For $an^2 + bn + c$ the second difference is always $2a$, whatever $b$ and $c$ are.`,
            },
            {
              type: 'numeric',
              title: 'Next in line',
              prompt: r`The sequence $3, 8, 15, 24, 35, \dots$ has constant second differences. What is the next term?`,
              answer: 48,
              wrong: [{ v: 46, why: 'First differences are 5, 7, 9, 11, so the next one is 13.' }],
              explain: r`First differences $5, 7, 9, 11$, second differences all 2. The next first difference is 13, so the next term is $35 + 13 = 48$. (The sequence is $n^2 + 2n$.)`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fit the formula',
              prompt: r`The dots show the data $4, 11, 22, 37, 56$ at $n = 1, \dots, 5$. Find $a$, $b$ and $c$ so that $an^2 + bn + c$ passes through all five. (The second differences give you $a$ straight away.)`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5.5, ymin: 0, ymax: 70, grid: false, height: 260, axes: { xlabel: 'n', yticks: 10, xticks: 1 },
                params: { a: { min: -3, max: 3, step: 0.5, value: 1, label: 'a', color: 'coral', format: (v) => v.toFixed(1) }, b: { min: -5, max: 5, step: 0.5, value: 0, label: 'b', color: 'blue', format: (v) => v.toFixed(1) }, c: { min: -5, max: 5, step: 0.5, value: 0, label: 'c', color: 'teal', format: (v) => v.toFixed(1) } },
                curves: [{ f: (x, p) => p.a * x * x + p.b * x + p.c, color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [4, 11, 22, 37, 56].map((v, i) => s('circle', { cx: plot.X(i + 1), cy: plot.Y(v), r: 6, class: 'fl-amber' })),
                readout: (p) => { const f = (n) => p.a * n * n + p.b * n + p.c, hit = [4, 11, 22, 37, 56].filter((v, i) => Math.abs(f(i + 1) - v) < 1e-9).length; return `formula gives ${[1, 2, 3, 4, 5].map((n) => fix(f(n), 1)).join(', ')} · **${hit} of 5** points hit`; },
                goal: (p) => p.a === 2 && p.b === 1 && p.c === 1,
                hint: 'Second differences are 4, so 2a = 4. Then use the first difference 11 − 4 = 7, which equals 3a + b.',
                solution: { a: 2, b: 1, c: 1 },
              },
              explain: r`Second differences $4$ give $a = 2$. The first difference between $n = 1$ and $n = 2$ is $(4a + 2b + c) - (a + b + c) = 3a + b = 7$, so $b = 1$. Finally $a + b + c = 4$ gives $c = 1$: the formula is $2n^2 + n + 1$.`,
            },
            {
              type: 'mcq',
              title: 'Going further',
              prompt: r`The cubes $1, 8, 27, 64, 125, 216$ don’t have constant second differences. What do you expect?`,
              choices: [
                { t: 'The third differences are constant', ok: true },
                { t: 'No differences are ever constant', why: 'Try it: first differences 7, 19, 37, 61, 91; second 12, 18, 24, 30; third 6, 6, 6.' },
                { t: 'The second differences double each time', why: 'They go 12, 18, 24, 30: they grow steadily, so the next level is constant.' },
              ],
              explain: r`A polynomial of degree $d$ has constant $d$-th differences (equal to $d!$ times the leading coefficient: $3! = 6$ for $n^3$). Charles Babbage designed his Difference Engine to tabulate polynomials using only additions, exploiting exactly this.`,
            },
            {
              type: 'numeric',
              title: 'Pentagonal numbers',
              prompt: r`The pentagonal numbers are $1, 5, 12, 22, 35, \dots$. Their second differences are all 3. What is the 10th pentagonal number?`,
              answer: 145,
              hint: r`Second difference 3 means $a = \frac32$. The formula turns out to be $\frac{n(3n - 1)}{2}$.`,
              explain: r`With $a = \frac32$, fitting the first terms gives $\frac{n(3n-1)}{2}$, so the 10th is $\frac{10 \times 29}{2} = 145$. (Or keep adding: first differences go up by 3 each time: 4, 7, 10, 13, 16, 19, 22, 25, 28.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Slicing a pizza',
              prompt: r`The greatest number of pieces you can cut a pizza into with $n$ straight cuts goes $1, 2, 4, 7, 11, \dots$ for $n = 0, 1, 2, 3, 4$. Find the formula from the differences and use it: how many pieces with **10** cuts?`,
              answer: 56,
              wrong: [{ v: 1024, why: 'The sequence starts like doubling (1, 2, 4) but then goes 7, 11: the second differences are all 1.' }],
              explain: r`First differences $1, 2, 3, 4$; second differences all 1, so $a = \frac12$. Fitting gives $\frac{n(n+1)}{2} + 1$, and for $n = 10$: $55 + 1 = 56$. Each new cut crosses every earlier one and so adds $n$ new pieces.`,
            },
          ],
          recap: [
            'A quadratic sequence has constant second differences, equal to 2a.',
            'Use the differences to recover a, then b and c from the first terms.',
            'Degree-d polynomials have constant d-th differences.',
          ],
        },
      ],
    },
  ],
};
