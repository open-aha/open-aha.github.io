import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 3 decimals, so they never change length (DESIGN.md, Live numbers)
const f3 = (v) => fix(v, 3);
const XY = { xlabel: 'x', ylabel: 'y' };

function riemannSum(f, a, b, n, method = 'left') {
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    sum += f(method === 'left' ? x0 : method === 'right' ? x0 + dx : x0 + dx / 2) * dx;
  }
  return sum;
}

// rectangles for a Riemann sum of f on [a, b] with n pieces; method: 'left' | 'right' | 'mid'
function riemann(plot, s, f, a, b, n, method = 'left', cls = 'fl-blue') {
  const dx = (b - a) / n;
  const els = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const xs = method === 'left' ? x0 : method === 'right' ? x0 + dx : x0 + dx / 2;
    const hgt = f(xs);
    sum += hgt * dx;
    const top = Math.max(0, hgt), bot = Math.min(0, hgt);
    els.push(s('rect', { x: plot.X(x0), y: plot.Y(top), width: Math.max(0, plot.X(x0 + dx) - plot.X(x0) - (n > 40 ? 0 : 1)), height: plot.Y(bot) - plot.Y(top), class: hgt >= 0 ? cls : 'fl-coral', opacity: 0.35, stroke: n > 40 ? 'none' : 'var(--card)', 'stroke-width': 1 }));
  }
  return { els, sum };
}

const diskSum = (n) => { const dx = 4 / n; let V = 0; for (let i = 1; i <= n; i++) V += Math.PI * (i * dx) * dx; return V; };

// sin x on [0, π] against a level h: area of the hump above h, and of the hollows below it
const levelAreas = (h) => {
  let up = 0, down = 0;
  const n = 600, dx = Math.PI / n;
  for (let i = 0; i < n; i++) { const y = Math.sin((i + 0.5) * dx) - h; if (y > 0) up += y * dx; else down -= y * dx; }
  return { up, down };
};

export default {
  id: 'integrals',
  subject: 'math',
  title: 'Calculus: Integrals',
  level: 'Advanced',
  cover: 'integrals',
  tagline: 'Add up infinitely many tiny pieces: areas, volumes, distances and the Fundamental Theorem.',
  description: r`Slice areas into thinner and thinner rectangles, discover that integration undoes differentiation, use integrals to find distances, averages, volumes and the work done by a force, and tame regions that stretch out to infinity.`,
  prereq: 'Calculus: Derivatives',
  chapters: [
    {
      title: 'Area Under a Curve',
      summary: 'Approximate with rectangles, then take the limit.',
      lessons: [
        {
          id: 'riemann',
          title: 'Rectangles',
          summary: 'Riemann sums',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Distance from a speed graph',
              body: r`A car drives at a constant 20 m/s for 5 seconds.`,
              prompt: 'How far does it go?',
              unit: 'm',
              answer: 100,
              wrong: [{ v: 4, why: r`Distance is speed **times** time.` }, { v: 25, why: r`Multiply: $20 \times 5$.` }],
              explain: r`$20 \times 5 = 100$ m. On a speed–time graph, that's the area of a $5 \times 20$ rectangle. Area under a velocity graph means distance, as you saw in the Motion course.`,
            },
            {
              type: 'mcq',
              title: 'Curved tops',
              body: r`When the speed changes smoothly, the area under the graph has a curved top. No simple formula gives it straight away.`,
              prompt: 'What’s a sensible way to estimate the area under a curve?',
              choices: [
                { t: 'Cut it into thin rectangles and add their areas', ok: true },
                { t: 'Multiply the highest value by the width', why: 'That only gives an upper bound, often far too big.' },
                { t: 'Take the area of the triangle under the curve', why: 'That only works if the curve is a straight line.' },
              ],
              explain: r`Rectangle areas are easy to compute. With enough thin ones, they hug the curve closely. That's the idea behind integration.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'More rectangles',
              body: r`Estimate the area under $y = x^2$ from $x = 0$ to $x = 3$ using rectangles whose heights come from each strip's **left** edge. Increase the number of rectangles $n$.`,
              widget: {
                kind: 'graph', xmin: -0.3, xmax: 3.4, ymin: -0.6, ymax: 10, grid: 1, gridY: 1, height: 360, axes: XY,
                params: { n: { min: 1, max: 100, step: 1, value: 4, label: '$n$', color: 'blue', format: (v) => `${v}` } },
                curves: [{ f: (x) => x * x, color: 'blue' }],
                extra: ({ plot, p, s }) => riemann(plot, s, (x) => x * x, 0, 3, p.n, 'left').els,
                readout: (p) => r`sum of rectangles $= ${f3(riemannSum((x) => x * x, 0, 3, p.n, 'left'))}$`,
              },
              after: r`With more and thinner rectangles, the total creeps up toward **9**. Left-edge rectangles always sit a little below this rising curve, so they underestimate, but the gap shrinks to zero.`,
            },
            {
              type: 'explain',
              title: 'The limit is the exact area',
              body: r`With $n$ rectangles of width $\Delta x$, the estimate is $\sum f(x_i)\,\Delta x$, called a **Riemann sum**. As $n \to \infty$, the sum approaches the exact area, called the **definite integral**:
$$\int_0^3 x^2 \, dx = \lim_{n \to \infty} \sum_{i} f(x_i)\,\Delta x = 9$$
The $\int$ is a stretched S, for "sum". The $dx$ is the infinitely thin width that replaces $\Delta x$.`,
            },
            {
              type: 'numeric',
              title: 'Estimate by hand',
              prompt: r`Estimate $\int_0^4 x\,dx$ using 4 rectangles of width 1, with heights taken at each strip's **right** edge.`,
              answer: 10,
              wrong: [
                { v: 6, why: r`That uses the left edges (0 + 1 + 2 + 3). Right edges are at $x = 1, 2, 3, 4$.` },
                { v: 8, why: 'That’s the exact area of the triangle. The question asks for the rectangle estimate.' },
              ],
              explain: r`Heights at $x = 1, 2, 3, 4$: $1 + 2 + 3 + 4 = 10$ (each times width 1). The exact area is the triangle $\tfrac12 \times 4 \times 4 = 8$. Right-edge rectangles overestimate a rising line.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Over or under?',
              prompt: r`For a **decreasing** function, how do left-edge rectangles compare with the true area?`,
              choices: [
                { t: 'They overestimate it', ok: true },
                { t: 'They underestimate it', why: 'For a decreasing function, the left edge of each strip is its highest point.' },
                { t: 'They’re exact', why: 'Only if the function is constant.' },
              ],
              explain: r`On a decreasing curve, each strip's left edge is its tallest point, so each rectangle pokes above the curve. Left sums overestimate, and right sums underestimate.`,
            },
          ],
          recap: [
            'The area under a curve can be approximated by thin rectangles: a Riemann sum.',
            'As the rectangles get thinner, the sum approaches the exact area, the definite integral.',
            r`$\int_a^b f(x)\,dx$ is the limit of $\sum f(x_i)\,\Delta x$.`,
          ],
        },
        {
          id: 'definite-integral',
          title: 'Signed Area',
          summary: 'Above counts plus, below counts minus',
          icon: 'sigma',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Going backwards',
              body: r`A cyclist rides forward at 4 m/s for 3 s, then backward at 2 m/s for 2 s.`,
              prompt: 'What is their total displacement?',
              cols: 2,
              choices: [
                { t: '8 m forward', ok: true },
                { t: '16 m', why: r`That's the total distance. Going backward cancels part of the forward motion: $12 - 4$.` },
                { t: '12 m forward', why: 'That ignores the backward part.' },
                { t: '4 m backward', why: r`Forward: $4 \times 3 = 12$ m. Backward: $2 \times 2 = 4$ m. Net: 8 m forward.` },
              ],
              explain: r`On the velocity graph, the forward part is an area **above** the axis (+12) and the backward part is an area **below** it (−4). The integral adds them with signs: $12 - 4 = 8$ m.`,
            },
            {
              type: 'explain',
              title: 'Signed area',
              body: r`The definite integral counts area **above** the $x$-axis as positive and area **below** it as negative. Move the endpoint $b$ for $f(x) = \sin x$:`,
              widget: {
                kind: 'graph', xmin: -0.2, xmax: 2 * Math.PI + 0.3, ymin: -1.4, ymax: 1.4, grid: Math.PI / 2, gridY: 0.5, height: 300,
                axes: { xlabel: 'x', ylabel: 'y', xfmt: (v) => ({ 0: '0', 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π' })[Math.round(v / (Math.PI / 2))] || '' },
                params: { b: { min: 0.1, max: 2 * Math.PI, step: 0.05, value: 4, label: '$b$', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: Math.sin, color: 'ink', width: 2.5 }],
                extra: ({ plot, p, s }) => {
                  const els = [];
                  const n = 160;
                  const pts = [];
                  for (let i = 0; i <= n; i++) { const x = (p.b * i) / n; pts.push([x, Math.sin(x)]); }
                  // positive part
                  els.push(s('path', { d: `M${plot.X(0)} ${plot.Y(0)} ` + pts.map(([x, y]) => `L${plot.X(x)} ${plot.Y(Math.max(0, y))}`).join(' ') + ` L${plot.X(p.b)} ${plot.Y(0)} Z`, class: 'fl-blue', opacity: 0.35 }));
                  els.push(s('path', { d: `M${plot.X(0)} ${plot.Y(0)} ` + pts.map(([x, y]) => `L${plot.X(x)} ${plot.Y(Math.min(0, y))}`).join(' ') + ` L${plot.X(p.b)} ${plot.Y(0)} Z`, class: 'fl-coral', opacity: 0.35 }));
                  return els;
                },
                readout: (p) => r`$\displaystyle\int_0^{${p.b.toFixed(2)}} \sin x\,dx = ${f3(1 - Math.cos(p.b))}$`,
              },
              after: r`From $0$ to $\pi$ the area is $+2$. From $\pi$ to $2\pi$ it's $-2$. So over a full wave, $\int_0^{2\pi}\sin x\,dx = 0$: the two areas cancel.`,
            },
            {
              type: 'numeric',
              title: 'Triangles',
              prompt: r`Using areas of shapes, find $\int_{-2}^{4} x\,dx$.`,
              answer: 6,
              wrong: [
                { v: 10, why: r`The piece from $-2$ to $0$ is **below** the axis, so it counts as $-2$, not $+2$.` },
                { v: 8, why: r`That's only the part from 0 to 4. Include the negative triangle from $-2$ to $0$.` },
              ],
              explain: r`From 0 to 4: a triangle above the axis, area $\tfrac12 \times 4 \times 4 = 8$. From $-2$ to 0: a triangle below the axis, area $-\tfrac12 \times 2 \times 2 = -2$. Total: $8 - 2 = 6$.`,
            },
            {
              type: 'numeric',
              title: 'Half a circle',
              prompt: r`Using geometry, find $\int_{-2}^{2} \sqrt{4 - x^2}\,dx$. (The graph is the top half of a circle of radius 2.) Give a decimal.`,
              answer: 2 * Math.PI,
              tol: 0.02,
              wrong: [
                { v: 4 * Math.PI, tol: 0.02, why: 'That’s the whole circle. The graph is only the top half.' },
                { v: Math.PI, tol: 0.02, why: r`A circle of radius 2 has area $\pi \cdot 2^2 = 4\pi$, and half of that is $2\pi$.` },
              ],
              explain: r`The area of a full circle of radius 2 is $4\pi$, so half of it is $2\pi \approx 6.28$.`,
            },
            {
              type: 'numeric',
              title: 'Area that cancels',
              prompt: r`Compute $\int_{-1}^{2} x\,dx$, counting area below the axis as negative.`,
              answer: 1.5,
              tol: 0.001,
              explain: r`$\left[\frac{x^2}{2}\right]_{-1}^{2} = 2 - \frac12 = 1.5$: the triangle above the axis (area 2) minus the one below (area 0.5).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Distance vs. displacement',
              body: r`A particle's velocity is $v(t) = \sin t$, for $t$ from 0 to $2\pi$.`,
              prompt: r`$\int_0^{2\pi} \sin t\,dt = 0$. What does that tell you?`,
              choices: [
                { t: 'It ends up back where it started', ok: true },
                { t: 'It never moved', why: 'It moved forward then backward. The integral of velocity gives the *net* displacement.' },
                { t: 'It travelled a total distance of 0', why: r`The total distance is $\int |v|\,dt = 4$. The signed integral gives the displacement.` },
              ],
              explain: r`The integral of velocity is the **displacement** (signed). The particle moves forward 2 units, then back 2 units, so its displacement is 0 and its total distance is 4.`,
            },
          ],
          recap: [
            'The definite integral is signed area: above the axis is positive, below is negative.',
            'The integral of velocity gives displacement. The integral of speed gives distance.',
            'Some integrals can be found from simple shapes: triangles, rectangles, circles.',
          ],
        },
      ],
    },
    {
      title: 'The Fundamental Theorem',
      summary: 'Integration undoes differentiation.',
      lessons: [
        {
          id: 'antiderivatives',
          title: 'Antiderivatives',
          summary: 'Running derivatives backwards',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Reverse it',
              prompt: r`Which function has derivative $2x$?`,
              cols: 2,
              choices: [
                { t: r`$x^2$`, ok: true },
                { t: r`$2x^2$`, why: r`$(2x^2)' = 4x$.` },
                { t: r`$2$`, why: r`That's the derivative **of** $2x$, not a function whose derivative is $2x$.` },
                { t: r`$x^2/2$`, why: r`$(x^2/2)' = x$.` },
              ],
              explain: r`$(x^2)' = 2x$. So $x^2$ is an **antiderivative** of $2x$: a function whose derivative is the one you started with.`,
            },
            {
              type: 'mcq',
              title: 'Only one?',
              prompt: r`Is $x^2$ the only function whose derivative is $2x$?`,
              choices: [
                { t: r`No: $x^2 + C$ works for any constant $C$`, ok: true },
                { t: 'Yes', why: r`$(x^2 + 5)' = 2x$ too: constants have derivative zero.` },
              ],
              explain: r`Adding a constant shifts the graph up or down without changing any slopes. So the antiderivatives of $2x$ are $x^2 + C$. That $+C$ appears whenever you integrate without limits.`,
            },
            {
              type: 'explain',
              title: 'Reverse power rule',
              body: r`Run the power rule backwards: raise the power by 1, then divide by the new power.
$$\int x^n\,dx = \frac{x^{n+1}}{n+1} + C \qquad (n \ne -1)$$
Check by differentiating: $\left(\frac{x^{n+1}}{n+1}\right)' = x^n$. ✓

As with derivatives, constants multiply through and sums split term by term.`,
            },
            {
              type: 'mcq',
              title: 'Practice',
              prompt: r`What is $\int (3x^2 + 4x)\,dx$?`,
              choices: [
                { t: r`$x^3 + 2x^2 + C$`, ok: true },
                { t: r`$6x + 4 + C$`, why: r`That's the **derivative**. Integration raises the powers.` },
                { t: r`$3x^3 + 4x^2 + C$`, why: r`Divide by the new power: $\frac{3x^3}{3} = x^3$ and $\frac{4x^2}{2} = 2x^2$.` },
                { t: r`$x^3 + 2x^2$`, why: r`Nearly! Don't forget the $+C$.` },
              ],
              explain: r`$3 \cdot \frac{x^3}{3} + 4 \cdot \frac{x^2}{2} + C = x^3 + 2x^2 + C$. Check: $(x^3 + 2x^2)' = 3x^2 + 4x$. ✓`,
            },
            {
              type: 'numeric',
              title: 'Find C',
              body: r`A ball's velocity is $v(t) = 10 - 9.8t$ m/s, and its height at $t = 0$ is 2 m.`,
              prompt: r`Its height is $h(t) = 10t - 4.9t^2 + C$. What is $C$?`,
              lhs: r`$C =$`,
              answer: 2,
              wrong: [{ v: 0, why: r`At $t = 0$ the height is 2 m: $h(0) = C = 2$.` }, { v: 10, why: r`$C$ is the height at $t = 0$, which is 2.` }],
              explain: r`$h(0) = 0 - 0 + C = 2$, so $C = 2$. The starting condition picks out one function from the whole family $+C$.`,
            },
            {
              type: 'interactive',
              title: 'Pick the right curve',
              body: r`The short lines show the slope $3x^2$ at each point: any antiderivative $x^3 + C$ must follow them. Adjusting $C$ slides the curve up and down. Find the one that passes through the point **(2, 3)**.`,
              widget: {
                kind: 'graph', xmin: -2.5, xmax: 2.5, ymin: -10, ymax: 10, grid: false, height: 300, axes: { xticks: 1, yticks: 2 },
                params: { C: { min: -8, max: 8, step: 0.5, value: 0, label: 'C', color: 'violet', format: (v) => v.toFixed(1) } },
                curves: [{ f: (x, p) => x ** 3 + p.C, color: 'violet', width: 3 }],
                points: [{ x: () => 2, y: () => 3, color: 'coral' }],
                extra: ({ plot, s }) => { const out = []; for (let x = -2.25; x <= 2.3; x += 0.5) for (let y = -9; y <= 9.1; y += 2) { const m = 3 * x * x, dx = 0.12 / Math.sqrt(1 + (m * 0.25) ** 2); out.push(s('line', { x1: plot.X(x - dx), y1: plot.Y(y - m * dx), x2: plot.X(x + dx), y2: plot.Y(y + m * dx), stroke: 'var(--ink-3)', 'stroke-width': 1.5 })); } return out; },
                readout: (p) => `F(x) = x³ ${p.C >= 0 ? '+' : '−'} ${Math.abs(p.C).toFixed(1)} · F(2) = **${(8 + p.C).toFixed(1)}**`,
                goal: (p) => p.C === -5,
                hint: 'You need 2³ + C = 3.',
                solution: { C: -5 },
              },
              explain: r`$8 + C = 3$ gives $C = -5$. All the curves $x^3 + C$ have the same slopes everywhere, so the derivative alone can’t tell them apart; one known point picks out exactly one.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Negative powers',
              prompt: r`Find an antiderivative of $\frac{1}{x^2} = x^{-2}$, and evaluate it at $x = 2$. (Take $C = 0$.)`,
              answer: -0.5,
              wrong: [
                { v: 0.5, why: r`$\int x^{-2}dx = \frac{x^{-1}}{-1} = -\frac1x$. Watch the sign.` },
                { v: -0.125, tol: 0.001, why: r`Raise the power: $-2 + 1 = -1$, not $-3$.` },
              ],
              explain: r`$\int x^{-2}\,dx = \frac{x^{-1}}{-1} = -\frac{1}{x}$. At $x = 2$: $-\frac12$. Check: $\left(-\frac1x\right)' = \frac{1}{x^2}$. ✓ (The only exception to the reverse power rule is $n = -1$: $\int \frac1x\,dx = \ln|x| + C$.)`,
            },
          ],
          recap: [
            r`An antiderivative $F$ of $f$ satisfies $F' = f$. All antiderivatives differ by a constant $C$.`,
            r`$\int x^n\,dx = \frac{x^{n+1}}{n+1} + C$ for $n \ne -1$.`,
            r`A starting value (like $h(0)$) fixes $C$.`,
          ],
        },
        {
          id: 'ftc',
          title: 'The Fundamental Theorem',
          summary: 'Areas from antiderivatives',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Area that grows',
              body: r`Let $A(x)$ be the area under $f(t) = t$ from $0$ up to $x$. Drag $x$ and watch the area grow.`,
              widget: {
                kind: 'graph', xmin: -0.3, xmax: 4.4, ymin: -0.5, ymax: 8.5, grid: 1, height: 340, axes: { xlabel: 't', ylabel: '' },
                params: { x: { min: 0.2, max: 4, step: 0.05, value: 2, label: '$x$', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (t) => t, color: 'blue' }, { f: (t) => (t * t) / 2, color: 'violet', to: (p) => p.x, width: 3 }, { f: (t) => (t * t) / 2, color: 'violet', dash: true, width: 1.5 }],
                extra: ({ plot, p, s }) => [s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(p.x)} ${plot.Y(0)} L${plot.X(p.x)} ${plot.Y(p.x)} Z`, class: 'fl-blue', opacity: 0.25 })],
                points: [{ x: (p) => p.x, y: (p) => (p.x * p.x) / 2, color: 'violet' }],
                readout: (p) => r`$\blue{f(t) = t}$, $\quad \violet{A(x) = \tfrac12 x^2 = ${f3((p.x * p.x) / 2)}}$`,
              },
              after: r`The area function is $A(x) = \tfrac12 x^2$, and its derivative is $A'(x) = x = f(x)$. **The rate at which the area grows equals the height of the curve.**`,
            },
            {
              type: 'mcq',
              title: 'Why?',
              prompt: r`Nudge $x$ forward by a tiny $\Delta x$. About how much extra area is added?`,
              choices: [
                { t: r`About $f(x)\,\Delta x$: a thin strip of height $f(x)$`, ok: true },
                { t: r`About $x\,\Delta x$, whatever $f$ is`, why: r`The strip's height is the curve's height, $f(x)$. It equals $x$ here only because $f(t) = t$.` },
                { t: r`About $\Delta x$`, why: r`The strip has width $\Delta x$, but its height is $f(x)$.` },
              ],
              explain: r`The new sliver is almost a rectangle: width $\Delta x$, height $f(x)$. So $\Delta A \approx f(x)\Delta x$, which means $\frac{\Delta A}{\Delta x} \approx f(x)$. In the limit, $A'(x) = f(x)$. The area function is an **antiderivative** of $f$.`,
            },
            {
              type: 'explain',
              title: 'The Fundamental Theorem of Calculus',
              body: r`::: key
If $F$ is any antiderivative of $f$, then
$$\int_a^b f(x)\,dx = F(b) - F(a)$$
:::

To find an area, you don't need infinitely many rectangles. Find an antiderivative and subtract its values at the two ends. We often write this as $\Big[F(x)\Big]_a^b$.

This theorem, worked out by Newton and Leibniz in the 1600s, links the two halves of calculus: slopes and areas are inverse operations.`,
            },
            {
              type: 'numeric',
              title: 'The x² area, exactly',
              prompt: r`Use the theorem to compute $\int_0^3 x^2\,dx$.`,
              answer: 9,
              wrong: [
                { v: 27, why: r`Divide by 3: the antiderivative is $\frac{x^3}{3}$.` },
                { v: 6, why: r`That's the derivative $2x$ at 3. Use the antiderivative $\frac{x^3}{3}$.` },
              ],
              explain: r`$\left[\frac{x^3}{3}\right]_0^3 = \frac{27}{3} - 0 = 9$, exactly what the rectangles were approaching.`,
            },
            {
              type: 'numeric',
              title: 'Between two limits',
              prompt: r`Compute $\int_1^2 (3x^2 + 1)\,dx$.`,
              answer: 8,
              wrong: [
                { v: 7, why: r`Don't forget the antiderivative of the $+1$, which is $x$: $F(x) = x^3 + x$.` },
                { v: 10, why: r`That's $F(2)$. Subtract $F(1) = 2$.` },
              ],
              explain: r`$F(x) = x^3 + x$. $\;F(2) - F(1) = (8 + 2) - (1 + 1) = 10 - 2 = 8$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Area under a sine arch',
              prompt: r`The antiderivative of $\sin x$ is $-\cos x$. Find the area under one arch, $\int_0^{\pi} \sin x\,dx$.`,
              answer: 2,
              wrong: [
                { v: 0, why: r`$-\cos\pi - (-\cos 0) = 1 - (-1) = 2$. Watch the signs.` },
                { v: -2, why: r`$F(\pi) - F(0) = -\cos\pi + \cos 0 = 1 + 1 = 2$.` },
              ],
              explain: r`$\Big[-\cos x\Big]_0^{\pi} = -\cos\pi - (-\cos 0) = -(-1) + 1 = 2$. The area under one arch of the sine curve is exactly 2, a surprisingly neat number.`,
            },
          ],
          recap: [
            r`The area function $A(x) = \int_a^x f$ satisfies $A'(x) = f(x)$.`,
            r`FTC: $\int_a^b f(x)\,dx = F(b) - F(a)$ for any antiderivative $F$.`,
            'Derivatives and integrals undo each other.',
          ],
        },
      ],
    },
    {
      title: 'Using Integrals',
      summary: 'Averages, areas and physics.',
      lessons: [
        {
          id: 'integral-applications',
          title: 'Integrals at Work',
          summary: 'Averages, areas between curves, work',
          icon: 'trophy',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Average of a function',
              body: r`The **average value** of $f$ on $[a, b]$ is the height of the rectangle with the same area:
$$\bar f = \frac{1}{b - a}\int_a^b f(x)\,dx$$`,
              prompt: r`What is the average value of $f(x) = x^2$ on $[0, 3]$?`,
              answer: 3,
              wrong: [
                { v: 9, why: r`That's the integral. Divide by the width, $3 - 0$.` },
                { v: 4.5, why: r`$\frac{f(0) + f(3)}{2} = 4.5$ only works for straight lines. Use the integral.` },
              ],
              explain: r`$\frac{1}{3}\int_0^3 x^2\,dx = \frac{9}{3} = 3$. A $3 \times 3$ rectangle has the same area as the region under the curve.`,
            },
            { /*ix:integrals.integral-applications*/
              type: 'interactive',
              kicker: 'Try it',
              title: 'Level it out',
              body: r`Think of the area under $y = \sin x$, from $0$ to $\pi$, as a pile of sand. The average value is the height of the pile once it's raked flat. Move the level until the sand above it ({coral:coral}) would exactly fill the hollows below it ({blue:blue}).`,
              widget: {
                kind: 'graph', xmin: -0.2, xmax: 3.4, ymin: -0.15, ymax: 1.2, grid: false, height: 260, axes: { xticks: 1, yticks: 0.5, ...XY },
                params: { h: { min: 0.3, max: 0.9, step: 0.005, value: 0.4, label: 'level', color: 'amber', format: (v) => fix(v, 3) } },
                curves: [{ f: (x) => Math.sin(x), color: 'ink', width: 3, from: () => 0, to: () => Math.PI }, { f: (x, p) => p.h, color: 'amber', width: 2.5, dash: true, from: () => 0, to: () => Math.PI }],
                under: ({ plot, p, s }) => {
                  // the region between the curve and the level: coral where the curve is above it, blue where below
                  const n = 200, xs = Array.from({ length: n + 1 }, (_, i) => (Math.PI * i) / n);
                  const region = (pick) => xs.map((x, i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(pick(Math.sin(x), p.h)).toFixed(1)}`).join('') + `L${plot.X(Math.PI).toFixed(1)} ${plot.Y(p.h).toFixed(1)}L${plot.X(0).toFixed(1)} ${plot.Y(p.h).toFixed(1)}Z`;
                  return [s('path', { d: region(Math.max), class: 'fl-coral-soft' }), s('path', { d: region(Math.min), class: 'fl-blue-soft' })];
                },
                readout: (p) => { const { up, down } = levelAreas(p.h); return `{coral:sand above the level} ${f3(up)} · {blue:hollows below it} ${f3(down)}`; },
                goal: (p) => { const { up, down } = levelAreas(p.h); return Math.abs(up - down) < 0.012; },
                hint: 'The total area under the arch is 2, and it is spread over a width of π.',
                solution: { h: 0.635 },
              },
              explain: r`The two match at $h \approx 0.637$, which is $\frac{2}{\pi}$: the area under the arch is $\int_0^\pi \sin x\,dx = 2$, spread over a width of $\pi$. That's the average value. Raking flat moves sand sideways without changing the total, so the flat level is always the area divided by the width. Notice the average is well below the peak of 1, and well above half of it: the arch is fatter than a triangle.`,
            },
            {
              type: 'explain',
              title: 'Area between two curves',
              body: r`The area between a top curve $f$ and a bottom curve $g$ is
$$\int_a^b \big(f(x) - g(x)\big)\,dx$$
Each thin strip has height (top − bottom).`,
              widget: {
                kind: 'graph', xmin: -0.4, xmax: 1.4, ymin: -0.2, ymax: 1.3, grid: 0.25, gridY: 0.25, height: 320, axes: XY, equal: true, maxWidth: 480,
                curves: [{ f: (x) => Math.sqrt(Math.max(0, x)), color: 'blue', from: () => 0 }, { f: (x) => x * x, color: 'coral' }],
                extra: ({ plot, s }) => {
                  const pts = [];
                  for (let i = 0; i <= 60; i++) pts.push([i / 60, Math.sqrt(i / 60)]);
                  for (let i = 60; i >= 0; i--) pts.push([i / 60, (i / 60) ** 2]);
                  return [s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-violet', opacity: 0.3 })];
                },
                readout: () => r`$\blue{y = \sqrt x}$ (top) and $\coral{y = x^2}$ (bottom) meet at $x = 0$ and $x = 1$`,
              },
            },
            {
              type: 'numeric',
              title: 'Compute it',
              prompt: r`Find the area between $y = \sqrt{x}$ and $y = x^2$ from 0 to 1. ($\int x^{1/2} dx = \tfrac23 x^{3/2}$) Give a fraction or a decimal.`,
              answer: 1 / 3,
              tol: 0.003,
              wrong: [
                { v: 1, why: r`$\tfrac23 - \tfrac13 = \tfrac13$, not 1.` },
                { v: 2 / 3, tol: 0.003, why: r`That's only the area under $\sqrt x$. Subtract the area under $x^2$, which is $\tfrac13$.` },
              ],
              explain: r`$\int_0^1 (\sqrt x - x^2)\,dx = \left[\tfrac23 x^{3/2} - \tfrac13 x^3\right]_0^1 = \tfrac23 - \tfrac13 = \tfrac13$.`,
            },
            {
              type: 'explain',
              title: 'Work done by a changing force',
              body: r`When a force is constant, work is $W = Fd$. When the force changes with position, add up $F\,dx$ over tiny steps:
$$W = \int_a^b F(x)\,dx$$
For a spring, $F = kx$, so stretching it by $x$ takes $\int_0^x kx'\,dx' = \tfrac12 kx^2$. That's the spring energy formula from the Energy course.`,
            },
            {
              type: 'numeric',
              title: 'Stretch a spring',
              prompt: 'How much work does it take to stretch a spring (k = 400 N/m) from 0.1 m to 0.3 m of extension?',
              unit: 'J',
              answer: 16,
              wrong: [
                { v: 18, why: r`That's the work from 0 to 0.3 m. Subtract the work from 0 to 0.1 m (2 J).` },
                { v: 8, why: r`Square first, then subtract: $0.3^2 - 0.1^2 = 0.08$, not $0.2^2$.` },
              ],
              explain: r`$W = \int_{0.1}^{0.3} 400x\,dx = \left[200x^2\right]_{0.1}^{0.3} = 200(0.09 - 0.01) = 16$ J.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Distance travelled',
              prompt: r`A car's velocity is $v(t) = 3t^2$ m/s. How far does it travel between $t = 1$ s and $t = 3$ s?`,
              unit: 'm',
              answer: 26,
              wrong: [
                { v: 27, why: r`That's from $t = 0$ to $3$. Subtract the distance up to $t = 1$, which is 1 m.` },
                { v: 24, why: r`$\left[t^3\right]_1^3 = 27 - 1 = 26$.` },
              ],
              explain: r`$\int_1^3 3t^2\,dt = \left[t^3\right]_1^3 = 27 - 1 = 26$ m.`,
            },
          ],
          recap: [
            r`Average value: $\frac{1}{b - a}\int_a^b f$.`,
            r`Area between curves: $\int (\text{top} - \text{bottom})\,dx$.`,
            r`Work done by a changing force: $\int F\,dx$. Distance: $\int v\,dt$.`,
          ],
        },
      ],
    },
    {
      title: 'Beyond Area',
      summary: 'Volumes, and regions that go on forever.',
      lessons: [
        {
          id: 'volumes',
          title: 'Volumes by Slicing',
          summary: 'Stacks of thin disks',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A sliced loaf',
              prompt: 'A loaf of bread is cut into very thin slices. How could you find the loaf’s volume from the slices?',
              choices: [
                { t: 'Add up (area of each slice) × (thickness)', ok: true },
                { t: 'Multiply the area of the biggest slice by the length', why: 'That’s too much: most slices are smaller than the biggest one.' },
                { t: 'Add up the areas of the slices', why: 'Area alone has no thickness. Each slice contributes area × thickness.' },
              ],
              explain: r`Each thin slice is nearly a flat prism with volume (area) × (thickness). Adding them up and letting the thickness shrink gives an integral: $V = \int A(x)\,dx$, where $A(x)$ is the area of the slice at position $x$.`,
            },
            {
              type: 'interactive',
              title: 'Disks',
              body: r`Spin the curve $y = \sqrt{x}$ (from $x = 0$ to $4$) around the $x$-axis to make a bowl-like solid. Approximate it with $n$ thin disks, each with the radius of the curve at its right edge. Use enough disks to get within **2%** of the true volume.`,
              widget: {
                kind: 'graph', xmin: -0.3, xmax: 4.6, ymin: -2.5, ymax: 2.5, grid: false, height: 300, axes: { ...XY, xticks: 1, yticks: 1 },
                params: { n: { min: 2, max: 80, step: 1, value: 6, label: 'disks', color: 'blue' } },
                extra: ({ plot, p, s }) => {
                  const dx = 4 / p.n, els = [];
                  for (let i = 1; i <= p.n; i++) {
                    const r0 = Math.sqrt(i * dx), x0 = (i - 1) * dx;
                    els.push(s('rect', { x: plot.X(x0), y: plot.Y(r0), width: plot.X(dx) - plot.X(0), height: plot.Y(-r0) - plot.Y(r0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': p.n > 40 ? 0.5 : 1 }));
                    els.push(s('ellipse', { cx: plot.X(i * dx), cy: plot.Y(0), rx: Math.min(6, (plot.X(dx) - plot.X(0)) / 2), ry: plot.Y(-r0) - plot.Y(0), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 1 }));
                  }
                  for (const sg of [1, -1]) els.push(s('path', { d: Array.from({ length: 101 }, (_, k) => `${k ? 'L' : 'M'}${plot.X(k * 0.04).toFixed(1)} ${plot.Y(sg * Math.sqrt(k * 0.04)).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }));
                  return els;
                },
                readout: (p) => { const V = diskSum(p.n), ex = 8 * Math.PI; return r`$${p.n}$ disks: $V \approx ${V.toFixed(3)}$ · exact $8\pi = ${ex.toFixed(3)}$ · error $${(100 * (V - ex) / ex).toFixed(1)}\%$`; },
                goal: (p) => (diskSum(p.n) - 8 * Math.PI) / (8 * Math.PI) < 0.02 + 1e-9,
                hint: 'The error here is exactly 1/n of the true volume.',
                solution: { n: 50 },
              },
              explain: r`Each disk has volume $\pi r^2 \Delta x$ with $r = \sqrt{x}$, so the disks add up to approximately $\sum \pi x\,\Delta x$. In the limit, $V = \int_0^4 \pi x\,dx = \pi \left[\tfrac{x^2}{2}\right]_0^4 = 8\pi \approx 25.13$. With right-edge radii this sum overshoots by exactly $\frac1n$, so 50 disks give 2%.`,
            },
            {
              type: 'numeric',
              title: 'The cone, at last',
              body: r`Spin the line $y = \frac{3}{4}x$ from $x = 0$ to $x = 4$ around the $x$-axis: you get a cone of height 4 and base radius 3.`,
              prompt: r`Its volume is $\int_0^4 \pi \left(\tfrac34 x\right)^2 dx$. What is it, as a multiple of $\pi$?`,
              unit: r`$\times\,\pi$`,
              answer: 12,
              wrong: [{ v: 36, why: r`That's the cylinder $\pi r^2 h = 36\pi$. The cone is a third of it.` }, { v: 3, why: r`$\int_0^4 \frac{9}{16}x^2\,dx = \frac{9}{16} \cdot \frac{64}{3}$.` }],
              hint: r`$\int_0^4 \frac{9}{16} x^2\,dx = \frac{9}{16} \cdot \frac{x^3}{3}\Big|_0^4$.`,
              explain: r`$\pi \cdot \frac{9}{16} \cdot \frac{64}{3} = 12\pi$, exactly a third of the cylinder $\pi \cdot 3^2 \cdot 4 = 36\pi$. The mysterious $\frac13$ in $V = \frac13 \pi r^2 h$ comes from integrating $x^2$ to get $\frac{x^3}{3}$.`,
            },
            {
              type: 'explain',
              title: 'Washers, shells and more',
              body: r`The same idea handles many shapes:

- **Washers**: if the solid has a hole down the middle, each slice is a ring: $A = \pi(R^2 - r^2)$.
- **Shells**: spin a region around the $y$-axis and slice it into thin cylindrical shells instead: $V = \int 2\pi x\,h(x)\,dx$.
- **Any cross-section**: a solid whose slices are squares, triangles or anything else still has $V = \int A(x)\,dx$.

Archimedes used slicing arguments 2000 years before calculus. Integration made them routine.`,
            },
            {
              type: 'numeric',
              title: 'A satellite dish',
              body: r`Spin $y = \sqrt{x}$ from $0$ to $h$ around the $x$-axis: a paraboloid, the shape of a satellite dish. Its volume is $\int_0^h \pi x\,dx = \frac{\pi h^2}{2}$. The cylinder around it has radius $\sqrt h$ and length $h$.`,
              prompt: 'What fraction of the surrounding cylinder does the paraboloid fill?',
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: 1 / 3, tol: 0.005, why: 'That’s a cone. A paraboloid bulges outwards, so it holds more.' }, { v: 2 / 3, tol: 0.005, why: 'That’s a sphere in its cylinder. Compute πh²/2 divided by π(√h)²·h.' }],
              explain: r`The cylinder's volume is $\pi (\sqrt h)^2 h = \pi h^2$, so the paraboloid fills exactly $\frac12$. Archimedes knew this too. So cone : paraboloid : cylinder $= \frac13 : \frac12 : 1$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The napkin ring',
              body: r`Drill a cylindrical hole straight through the centre of a ball, leaving a ring 6 cm tall. Surprisingly, the volume left doesn't depend on the size of the ball! Slicing at height $y$, each slice is a washer with $R^2 = r_\text{ball}^2 - y^2$ and $r^2 = r_\text{ball}^2 - 3^2$, so its area is $\pi(9 - y^2)$.`,
              prompt: r`What is the ring's volume, $\int_{-3}^{3} \pi (9 - y^2)\,dy$, as a multiple of $\pi$?`,
              unit: r`$\times\,\pi$`,
              answer: 36,
              wrong: [{ v: 18, why: 'Integrate over the whole height, from −3 to 3.' }, { v: 54, why: r`$\int_{-3}^{3}(9 - y^2)\,dy = 54 - 18$.` }],
              hint: r`$\int_{-3}^{3} (9 - y^2)\,dy = \left[9y - \tfrac{y^3}{3}\right]_{-3}^{3}$.`,
              explain: r`$\left[9y - \frac{y^3}{3}\right]_{-3}^{3} = (27 - 9) - (-27 + 9) = 36$, so $V = 36\pi \approx 113$ cm³, whether the ball is a marble-sized bead or the size of the Earth. The ball's radius cancels out: a bigger ball needs a wider hole to leave a 6 cm ring, and the ring gets thinner as it gets wider. It's also the volume of a solid ball 6 cm across, the limiting case with no hole at all.`,
            },
            { /*anim:integrals*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Rings from any ball',
              body: r`On the left, a 6 cm tall {amber:napkin ring} cut from a ball whose size keeps changing (seen side on). In the middle, the {amber:ring's slice} at height $y$, seen from above. On the right, the {blue:slice of a solid ball 6 cm across} at the same height.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.0, xmax: 9.0, ymin: -2.45, ymax: 2.1, grid: false, axes: false,
                animate: { param: 't', speed: 1, max: 20 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const R = 3.02 + 2.5 * (1 - Math.cos(p.t / 5)), y = 2.85 * Math.sin(p.t), r = Math.sqrt(R * R - 9), k = 0.25, k2 = 0.24, els = [];
                  const cx = -0.3, X = (x) => plot.X(cx + k * x), Y = (yy) => plot.Y(k * yy), rad = (q) => plot.X(q) - plot.X(0);
                  const T = (x, yy, text) => s('text', { x: plot.X(x), y: plot.Y(yy), 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));fill:var(--ink-2)', text });
                  // side view: the ball outline, then the two halves of the band
                  els.push(s('circle', { cx: X(0), cy: Y(0), r: rad(k * R), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  for (const sg of [1, -1]) {
                    const pts = [`M${X(sg * r).toFixed(1)} ${Y(-3).toFixed(1)}`];
                    for (let i = 0; i <= 40; i++) { const yy = -3 + (6 * i) / 40; pts.push(`L${X(sg * Math.sqrt(R * R - yy * yy)).toFixed(1)} ${Y(yy).toFixed(1)}`); }
                    els.push(s('path', { d: pts.join('') + 'Z', class: 'fl-amber', opacity: 0.6, stroke: 'var(--amber)', 'stroke-width': 2 }));
                  }
                  els.push(s('line', { x1: X(-R - 0.4), x2: X(R + 0.4), y1: Y(y), y2: Y(y), stroke: 'var(--ink)', 'stroke-width': 2 }));
                  // the ring's slice: an annulus
                  const c2 = 4.75, ro = Math.sqrt(R * R - y * y), C = (cxx, q) => `M${plot.X(cxx + k2 * q)} ${plot.Y(0)}a${rad(k2 * q)} ${rad(k2 * q)} 0 1 0 ${-2 * rad(k2 * q)} 0a${rad(k2 * q)} ${rad(k2 * q)} 0 1 0 ${2 * rad(k2 * q)} 0Z`;
                  els.push(s('path', { d: C(c2, ro) + C(c2, r), 'fill-rule': 'evenodd', class: 'fl-amber', opacity: 0.6, stroke: 'var(--amber)', 'stroke-width': 1.5 }));
                  // the ball's slice
                  const c3 = 8.0;
                  els.push(s('circle', { cx: plot.X(c3), cy: plot.Y(0), r: rad(k2 * Math.sqrt(9 - y * y)), class: 'fl-blue', opacity: 0.6, stroke: 'var(--blue)', 'stroke-width': 1.5 }));
                  els.push(T(cx, -2.25, 'ring'), T(c2, -2.25, 'ring slice'), T(c3, -2.25, 'ball slice'));
                  return els;
                },
                readout: (p) => { const R = 3.02 + 2.5 * (1 - Math.cos(p.t / 5)), y = 2.85 * Math.sin(p.t); return `ball radius ${fix(R, 2)} cm · at $y = ${fix(y, 2)}$ both slices have area $\\pi(9 - y^2) = ${fix(Math.PI * (9 - y * y), 2)}$`; },
              },
              after: r`As the ball grows, the ring's slice gets wider but thinner, and the two effects cancel exactly: its area is $\pi\big((R^2 - y^2) - (R^2 - 9)\big) = \pi(9 - y^2)$, with no $R$ left. Every slice matches the slice of a solid ball of radius 3, so (by **Cavalieri's principle**: equal slices, equal volumes) every 6 cm ring holds $\frac43\pi \cdot 3^3 = 36\pi$ cm³.`,
            },
          ],
          recap: [
            r`Volume by slicing: $V = \int A(x)\,dx$.`,
            r`Disks: $V = \int \pi\,r(x)^2\,dx$. The cone's $\frac13$ comes from integrating $x^2$.`,
            'The napkin ring’s volume depends only on its height.',
          ],
        },
        {
          id: 'improper',
          title: 'Infinite Areas',
          summary: 'When infinity adds up to something finite',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Endless, but finite?',
              prompt: 'Can a region that stretches out forever have a finite area?',
              cols: 2,
              choices: [
                { t: 'Yes', ok: true },
                { t: 'No', why: r`Think of $\frac12 + \frac14 + \frac18 + \cdots$: infinitely many pieces, total 1. A region can thin out fast enough in the same way.` },
              ],
              explain: r`If the region thins out fast enough, the extra area keeps shrinking and the total settles down, just like $\frac12 + \frac14 + \frac18 + \cdots = 1$. Whether it does depends on exactly how fast it thins.`,
            },
            {
              type: 'interactive',
              title: 'Two tails',
              body: r`Compare the areas under $y = \frac{1}{x^2}$ (blue) and $y = \frac1x$ (coral) from $x = 1$ out to $x = b$. The curves look similar, but their areas behave very differently. Push $b$ out until the coral area exceeds **10**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 8, ymin: 0, ymax: 1.25, grid: false, height: 260, axes: { ...XY, xticks: 1, yticks: 0.5 },
                params: { lb: { min: 0, max: 5, step: 0.01, value: 1, label: 'b', color: 'violet', format: (v) => Math.round(10 ** v).toLocaleString() } },
                curves: [{ f: (x) => 1 / (x * x), from: 0.85, color: 'blue', width: 2.5 }, { f: (x) => 1 / x, from: 0.85, color: 'coral', width: 2.5 }],
                extra: ({ plot, p, s }) => {
                  const b = Math.min(8, 10 ** p.lb);
                  let d1 = `M${plot.X(1)} ${plot.Y(0)}`, d2 = d1;
                  for (let i = 0; i <= 80; i++) { const x = 1 + ((b - 1) * i) / 80; d1 += `L${plot.X(x)} ${plot.Y(1 / (x * x))}`; d2 += `L${plot.X(x)} ${plot.Y(1 / x)}`; }
                  d1 += `L${plot.X(b)} ${plot.Y(0)}Z`; d2 += `L${plot.X(b)} ${plot.Y(0)}Z`;
                  return [s('path', { d: d2, class: 'fl-coral', opacity: 0.18 }), s('path', { d: d1, class: 'fl-blue', opacity: 0.3 })];
                },
                readout: (p) => { const b = 10 ** p.lb; return r`Up to $b = ${Math.round(b).toLocaleString()}$: $\;\blue{\int_1^b \frac{dx}{x^2} = ${(1 - 1 / b).toFixed(4)}}$, $\;\coral{\int_1^b \frac{dx}{x} = ${Math.log(b).toFixed(2)}}$`; },
                goal: (p) => Math.log(10 ** p.lb) > 10,
                hint: r`$\int_1^b \frac{dx}{x} = \ln b$. You need $\ln b > 10$.`,
                solution: { lb: 4.35 },
              },
              explain: r`$\int_1^b \frac{dx}{x^2} = 1 - \frac1b \to 1$: finite, however far you go. But $\int_1^b \frac{dx}{x} = \ln b$ grows without limit, although very slowly: you need $b > e^{10} \approx 22{,}000$ to reach 10, and $b \approx 2.7 \times 10^{43}$ to reach 100.`,
            },
            {
              type: 'numeric',
              title: 'An infinite integral',
              prompt: r`Find $\displaystyle\int_1^\infty \frac{dx}{x^3}$, that is, the limit of $\int_1^b \frac{dx}{x^3}$ as $b \to \infty$.`,
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: 1, why: r`An antiderivative of $x^{-3}$ is $-\frac{1}{2x^2}$, not $-\frac{1}{x^2}$.` }, { v: 1 / 3, tol: 0.005, why: r`Antiderivative: $\frac{x^{-2}}{-2}$. Evaluate from 1 to ∞.` }],
              explain: r`$\int_1^b x^{-3}\,dx = \left[-\frac{1}{2x^2}\right]_1^b = \frac12 - \frac{1}{2b^2} \to \frac12$. Integrals over infinite ranges, defined as limits like this, are called **improper integrals**.`,
            },
            {
              type: 'explain',
              title: 'The dividing line',
              body: r`For the family $\frac{1}{x^p}$:

::: key
$\displaystyle\int_1^\infty \frac{dx}{x^p}$ is finite (equal to $\frac{1}{p - 1}$) when $p > 1$, and infinite when $p \le 1$.
:::

$p = 1$ is the knife edge, and it matches the **harmonic series** $1 + \frac12 + \frac13 + \cdots$, which also diverges. Comparing a sum with an integral like this is the **integral test**, one of the main tools for deciding whether infinite series converge.`,
            },
            {
              type: 'mcq',
              title: 'Gabriel’s horn',
              body: r`Spin the curve $y = \frac1x$ for $x \ge 1$ around the $x$-axis. You get an infinitely long trumpet: **Gabriel's horn**. Its volume is $\pi \int_1^\infty \frac{dx}{x^2} = \pi$, but its surface area turns out to be infinite.`,
              prompt: 'So could you fill the horn with paint, but never paint its inside surface?',
              choices: [
                { t: 'Mathematically, yes: a finite volume can be enclosed by an infinite area', ok: true },
                { t: 'No: that’s a contradiction, so the calculations must be wrong', why: 'Both calculations are correct. The paradox comes from imagining paint with a fixed thickness.' },
                { t: 'No: any infinitely long object has infinite volume', why: r`Its volume is $\pi \int_1^\infty \frac{dx}{x^2} = \pi$, perfectly finite.` },
              ],
              explain: r`Real paint has a thickness, so you'd need infinitely much of it to cover the surface. But far down the horn the tube is thinner than any paint layer, so "filling" it doesn't coat the walls in a fixed-thickness layer. Mathematically there's no contradiction: volume and area are different measures. Evangelista Torricelli found this in 1643, and contemporaries found it deeply unsettling.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Infinitely tall, finite area',
              prompt: r`The curve $y = \frac{1}{\sqrt x}$ shoots up to infinity as $x \to 0$. Find the area under it from $0$ to $1$: $\displaystyle\int_0^1 \frac{dx}{\sqrt x}$.`,
              answer: 2,
              wrong: [{ v: 0.5, why: r`An antiderivative of $x^{-1/2}$ is $2\sqrt{x}$, not $\frac12\sqrt x$.` }, { v: 1, why: r`Antiderivative: $\frac{x^{1/2}}{1/2} = 2\sqrt x$. Evaluate from 0 to 1.` }],
              hint: r`An antiderivative of $x^{-1/2}$ is $2x^{1/2}$.`,
              explain: r`$\int_a^1 x^{-1/2}\,dx = \left[2\sqrt x\right]_a^1 = 2 - 2\sqrt a \to 2$ as $a \to 0$. The region is infinitely tall but thin enough near the wall to have area 2. Improper integrals can be infinite in either direction: a long tail or a tall spike.`,
            },
          ],
          recap: [
            'Improper integrals are limits: of the upper bound going to ∞, or of a bound approaching a spike.',
            r`$\int_1^\infty x^{-p}\,dx$ is finite exactly when $p > 1$.`,
            'Gabriel’s horn: finite volume, infinite surface area.',
          ],
        },
      ],
    },
  ],
};
