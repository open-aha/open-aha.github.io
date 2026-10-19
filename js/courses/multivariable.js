import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

// a landscape with two hills: a tall one at (1, 0.6) and a lower one at (−1.3, −1)
const F = (x, y) => 3 * Math.exp(-((x - 1) ** 2 + (y - 0.6) ** 2)) + 2 * Math.exp(-((x + 1.3) ** 2 + (y + 1) ** 2) / 0.7);
const grad = (x, y) => {
  const h = 1e-5;
  return [(F(x + h, y) - F(x - h, y)) / (2 * h), (F(x, y + h) - F(x, y - h)) / (2 * h)];
};
const ascent = (x, y, eta, n) => {
  const pts = [[x, y]];
  for (let i = 0; i < n; i++) {
    const [a, b] = grad(x, y);
    x += eta * a;
    y += eta * b;
    pts.push([x, y]);
  }
  return pts;
};

// contour lines by marching squares, computed once per plot
const LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75];
const contourCache = new WeakMap();
function contours(plot, s) {
  if (contourCache.has(plot)) return contourCache.get(plot);
  const N = 80, x0 = plot.xmin, y0 = plot.ymin, dx = (plot.xmax - x0) / N, dy = (plot.ymax - y0) / N;
  const V = [];
  for (let i = 0; i <= N; i++) {
    V.push([]);
    for (let j = 0; j <= N; j++) V[i].push(F(x0 + i * dx, y0 + j * dy));
  }
  const els = LEVELS.map((L, li) => {
    let d = '';
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const pts = [];
      for (let e = 0; e < 4; e++) {
        const [a, b] = [c[e], c[(e + 1) % 4]];
        const va = V[a[0]][a[1]], vb = V[b[0]][b[1]];
        if ((va < L) !== (vb < L)) {
          const t = (L - va) / (vb - va);
          pts.push([x0 + (a[0] + t * (b[0] - a[0])) * dx, y0 + (a[1] + t * (b[1] - a[1])) * dy]);
        }
      }
      for (let k = 0; k + 1 < pts.length; k += 2) d += `M${plot.X(pts[k][0]).toFixed(1)} ${plot.Y(pts[k][1]).toFixed(1)}L${plot.X(pts[k + 1][0]).toFixed(1)} ${plot.Y(pts[k + 1][1]).toFixed(1)}`;
    }
    const mix = li / (LEVELS.length - 1);
    return s('path', { d, fill: 'none', stroke: mix < 0.5 ? 'var(--blue)' : 'var(--coral)', 'stroke-width': 2, opacity: 0.35 + 0.5 * Math.abs(mix - 0.5) * 2 });
  });
  contourCache.set(plot, els);
  return els;
}
const MAP = { kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -3, ymax: 3, grid: 1, axes: { xlabel: 'x', ylabel: 'y' }, maxWidth: 480 };
const peaks = (plot, s) => [[1, 0.6], [-1.3, -1]].map(([x, y]) => s('path', { d: `M${plot.X(x)} ${plot.Y(y) - 9} l8 14 h-16 Z`, class: 'fl-ink', opacity: 0.6 }));

// midpoint sum of f(x, y) = x² + y² over the unit square with an n × n grid
const midSum = (n) => { let S = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = (i + 0.5) / n, y = (j + 0.5) / n; S += (x * x + y * y) / (n * n); } return S; };

export default {
  id: 'multivariable',
  subject: 'math',
  title: 'Multivariable Calculus',
  level: 'Advanced',
  cover: 'multivariable',
  tagline: 'Contour maps, partial derivatives, gradients, constrained optimisation and double integrals.',
  description: r`The real world has more than one variable. Read functions of two variables like a hiker reads a map, take partial derivatives, follow the gradient uphill, discover gradient descent (the algorithm that trains modern AI), find the best point on a constraint with Lagrange multipliers, and compute volumes with double integrals.`,
  prereq: 'Calculus: Derivatives',
  chapters: [
    {
      title: 'Landscapes',
      summary: 'Functions of two variables.',
      lessons: [
        {
          id: 'contours',
          title: 'Contour Maps',
          summary: 'Reading a landscape',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Height as a function',
              body: r`A function of two variables, $f(x, y)$, gives a number for every point of the plane, like the **height** of a landscape at each map position. Hikers' maps show height with **contour lines**: curves joining points of equal height. Here's a landscape with two hills. Drag the point to read the height.`,
              widget: {
                ...MAP,
                params: { x: { min: -3, max: 3, step: 0.05, value: -0.2, slider: false }, y: { min: -3, max: 3, step: 0.05, value: 1.8, slider: false } },
                extra: ({ plot, s }) => [...contours(plot, s), ...peaks(plot, s)],
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }],
                readout: (p) => r`$f(${f2(p.x)}, ${f2(p.y)}) = ${f2(F(p.x, p.y))}$ $\;$ (contours every 0.25)`,
              },
              after: r`Each contour line is a **level curve**: $f(x, y) = c$ for one value $c$. The two triangles mark the hilltops: a tall one (height 3) and a smaller one (height 2).`,
            },
            {
              type: 'mcq',
              title: 'Steep or gentle?',
              prompt: r`On a contour map, what does it mean where the contour lines are **packed close together**?`,
              choices: [
                { t: 'The ground is steep there', ok: true },
                { t: 'The ground is flat there', why: 'Flat ground changes height slowly, so the lines are far apart.' },
                { t: 'It’s a hilltop', why: 'Hilltops are inside the smallest closed loops. Tightly packed lines mean steep slopes.' },
              ],
              explain: r`Neighbouring lines differ by a fixed height step. If they're close together, the height changes a lot over a short distance: the slope is **steep**. Widely spaced lines mean gentle ground.`,
            },
            {
              type: 'numeric',
              title: 'A bowl',
              prompt: r`The function $f(x, y) = x^2 + y^2$ is a bowl. Its contour at height 4 is the set of points with $x^2 + y^2 = 4$. What shape and size is it? Give its radius.`,
              answer: 2,
              wrong: [{ v: 4, why: r`$x^2 + y^2 = 4$ is a circle of radius $\sqrt4$.` }, { v: 16, why: r`$x^2 + y^2 = r^2$ with $r^2 = 4$.` }],
              explain: r`$x^2 + y^2 = 4$ is a circle of radius 2. The contours of the bowl are circles of radius $\sqrt{c}$: at heights 1, 4, 9 the radii are 1, 2, 3, so the circles get **closer together** as you go up. The bowl gets steeper further out.`,
            },
            {
              type: 'numeric',
              title: 'A saddle',
              prompt: r`The surface $z = x^2 - y^2$ is a saddle. What is its height at the point $(2, 1)$?`,
              answer: 3,
              explain: r`$2^2 - 1^2 = 3$. Along the $x$-axis it curves up like a valley; along the $y$-axis it curves down like a ridge. At the origin it’s flat but neither a maximum nor a minimum: a mountain pass.`,
            },
            {
              type: 'numeric',
              title: 'Reading the gradient',
              prompt: r`On a map, contour lines are drawn every 10 m of height and are 50 m apart (horizontally) on a hillside. What is the slope, as a percentage?`,
              unit: '%',
              answer: 20,
              tol: 0.5,
              explain: r`$\frac{10}{50} = 0.2$: a 20% gradient, steep for a road. Closer contours mean steeper ground.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A mountain pass',
              body: r`On a map, two hills sit side by side. Between them, the contour lines form an X shape: going one way the ground rises (towards each hill), going the other way it falls (into the valleys on either side).`,
              prompt: 'What kind of point is at the centre of the X?',
              choices: [
                { t: 'A saddle point: a high point in one direction and a low point in another', ok: true },
                { t: 'A hilltop', why: 'From a hilltop every direction goes down. Here two directions go up.' },
                { t: 'A valley floor', why: 'From a valley floor every direction goes up. Here two directions go down.' },
              ],
              explain: r`It's a **saddle point** (a mountain pass): the lowest point on the ridge between the hills, but the highest point on the path across the ridge. The ground is flat there (gradient zero) without being a peak or a pit. The function $x^2 - y^2$ has a saddle at the origin, and is shaped just like a horse's saddle.`,
            },
          ],
          recap: [
            r`A function $f(x, y)$ can be pictured as a landscape.`,
            r`Contour lines join points of equal height: $f(x, y) = c$.`,
            'Close contours mean steep ground. Far-apart contours mean gentle ground.',
          ],
        },
        {
          id: 'partials',
          title: 'Partial Derivatives',
          summary: 'Slopes in one direction',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Holding one variable still',
              body: r`On a hillside, the slope depends on which way you face. The **partial derivative** $\dfrac{\partial f}{\partial x}$ is the slope if you walk in the $x$-direction, keeping $y$ fixed. To compute it, differentiate with respect to $x$ and treat $y$ as a constant. Likewise for $\dfrac{\partial f}{\partial y}$.

For example, if $f(x, y) = x^2 y + 3y$:
$$\frac{\partial f}{\partial x} = 2xy, \qquad \frac{\partial f}{\partial y} = x^2 + 3$$`,
            },
            {
              type: 'numeric',
              title: 'Evaluate a partial',
              prompt: r`For $f(x, y) = x^2 y + 3y$, what is $\dfrac{\partial f}{\partial x}$ at the point $(1, 2)$?`,
              answer: 4,
              wrong: [{ v: 2, why: r`$\frac{\partial f}{\partial x} = 2xy = 2 \times 1 \times 2$.` }, { v: 8, why: r`That's $f(1, 2) = 1^2 \times 2 + 3 \times 2$. You need the derivative $2xy$.` }],
              explain: r`$\dfrac{\partial f}{\partial x} = 2xy = 2(1)(2) = 4$. Walking in the $x$-direction from $(1, 2)$, the height rises at 4 units per unit step.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Slicing the landscape',
              body: r`Cut the two-hill landscape along the horizontal line $y = y_0$. The slice is an ordinary curve, $f(x, y_0)$, and its slope at $x_0$ is the partial derivative $\frac{\partial f}{\partial x}$. Move the cut and the point.`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 3, ymin: -0.3, ymax: 3.3, grid: 1, height: 280, axes: { xlabel: 'x', ylabel: 'height' },
                params: {
                  y0: { min: -2.5, max: 2.5, step: 0.05, value: 0.6, label: 'slice at y₀', color: 'blue', format: (v) => v.toFixed(2) },
                  x0: { min: -2.8, max: 2.8, step: 0.05, value: 0, slider: false },
                },
                curves: [
                  { f: (x, p) => F(x, p.y0), color: 'blue', width: 3 },
                  { f: (x, p) => F(p.x0, p.y0) + grad(p.x0, p.y0)[0] * (x - p.x0), from: (p) => p.x0 - 0.8, to: (p) => p.x0 + 0.8, color: 'coral', width: 2 },
                ],
                points: [{ x: (p) => p.x0, y: (p) => F(p.x0, p.y0), drag: { x: 'x0' }, color: 'coral' }],
                readout: (p) => r`$\dfrac{\partial f}{\partial x}(${f2(p.x0)}, ${f2(p.y0)}) = ${f2(grad(p.x0, p.y0)[0])}$`,
              },
              after: r`Each choice of $y_0$ gives a different slice, with its own slopes. A partial derivative turns a two-variable problem into a familiar one-variable one, just by freezing the other variable.`,
            },
            {
              type: 'numeric',
              title: 'Mixed partials',
              prompt: r`For $f(x, y) = x^2 y^3$, first find $\frac{\partial f}{\partial x}$, then differentiate **that** with respect to $y$. What is the result at $(1, 1)$?`,
              answer: 6,
              wrong: [{ v: 2, why: r`$\frac{\partial f}{\partial x} = 2xy^3$. Now differentiate with respect to $y$: $6xy^2$.` }, { v: 3, why: r`Start with $\frac{\partial f}{\partial x} = 2xy^3$, then $\frac{\partial}{\partial y}$ gives $2x \cdot 3y^2$.` }],
              explain: r`$\frac{\partial f}{\partial x} = 2xy^3$, then $\frac{\partial}{\partial y}(2xy^3) = 6xy^2 = 6$ at $(1, 1)$. Doing it the other way round, $\frac{\partial f}{\partial y} = 3x^2y^2$ then $\frac{\partial}{\partial x}$ gives $6xy^2$ again. For smooth functions the order never matters (**Clairaut's theorem**).`,
            },
            {
              type: 'numeric',
              title: 'Small changes add up',
              prompt: r`For $f(x, y) = x^2y$ at $(2, 3)$, $f_x = 12$ and $f_y = 4$. Estimate the change in $f$ if $x$ increases by 0.1 and $y$ decreases by 0.2, using $\Delta f \approx f_x\Delta x + f_y\Delta y$.`,
              answer: 0.4,
              tol: 0.001,
              explain: r`$12 \times 0.1 + 4 \times (-0.2) = 1.2 - 0.8 = 0.4$. The exact change is $2.1^2 \times 2.8 - 12 = 0.348$: close, and the approximation improves for smaller steps.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The other direction',
              prompt: r`For $f(x, y) = x^3 + 5xy^2$, compute $\dfrac{\partial f}{\partial y}$ at $(2, 1)$.`,
              answer: 20,
              wrong: [{ v: 17, why: r`That's $\frac{\partial f}{\partial x} = 3x^2 + 5y^2$. Differentiate with respect to $y$ instead.` }, { v: 10, why: r`Keep the constant factor $x$: $\frac{\partial}{\partial y}(5xy^2) = 10xy$.` }],
              explain: r`$x^3$ has no $y$, so its partial is 0. $\dfrac{\partial}{\partial y}(5xy^2) = 10xy$. At $(2, 1)$: $10 \times 2 \times 1 = 20$.`,
            },
          ],
          recap: [
            r`$\partial f/\partial x$: the slope in the $x$-direction, holding $y$ fixed.`,
            'Compute it by differentiating normally and treating the other variables as constants.',
            'Each direction can have a different slope.',
          ],
        },
      ],
    },
    {
      title: 'Going Uphill',
      summary: 'Gradients and optimisation.',
      lessons: [
        {
          id: 'gradient',
          title: 'The Gradient',
          summary: 'The direction of steepest ascent',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'An arrow pointing uphill',
              body: r`Combine the partial derivatives into a vector, the **gradient**:
$$\nabla f = \left(\frac{\partial f}{\partial x},\ \frac{\partial f}{\partial y}\right)$$
Drag the point and watch the gradient arrow.`,
              widget: {
                ...MAP,
                params: { x: { min: -3, max: 3, step: 0.05, value: 0.2, slider: false }, y: { min: -3, max: 3, step: 0.05, value: -0.6, slider: false } },
                extra: ({ plot, p, s, arrow }) => {
                  const [gx, gy] = grad(p.x, p.y);
                  const k = 0.6;
                  return [...contours(plot, s), ...peaks(plot, s), arrow(plot.X(p.x), plot.Y(p.y), plot.X(p.x + k * gx), plot.Y(p.y + k * gy), { color: 'var(--violet)', width: 4, head: 13 })];
                },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }],
                readout: (p) => {
                  const [gx, gy] = grad(p.x, p.y);
                  return r`$\nabla f = (${f2(gx)}, ${f2(gy)})$, $\;|\nabla f| = ${f2(Math.hypot(gx, gy))}$`;
                },
              },
              after: r`The gradient always points in the direction of **steepest ascent**, straight up the hill and **perpendicular to the contour lines**. Its length is the steepness. At a hilltop (or any flat point) it shrinks to zero.`,
            },
            {
              type: 'mcq',
              title: 'Along a contour',
              prompt: r`You walk exactly along a contour line. How fast is your height changing?`,
              cols: 2,
              choices: [
                { t: 'Not at all', ok: true },
                { t: 'As fast as possible', why: 'That’s the gradient direction, perpendicular to the contour.' },
                { t: 'It depends on the hill', why: 'A contour joins points of equal height, so walking along it never changes your height.' },
              ],
              explain: r`A contour joins points of equal height, so walking along it keeps $f$ constant. That's why the gradient (the direction of fastest change) is perpendicular to contours: it's the direction "furthest" from not changing at all.`,
            },
            {
              type: 'numeric',
              title: 'Walking diagonally',
              body: r`The slope in the direction of a unit vector $\mathbf{u}$ is the **directional derivative** $\nabla f \cdot \mathbf{u}$.`,
              prompt: r`If $\nabla f = (3, 4)$, what is the slope walking in the diagonal direction $\mathbf{u} = \left(\frac{1}{\sqrt2}, \frac{1}{\sqrt2}\right)$? (2 decimal places.)`,
              answer: 7 / Math.SQRT2,
              tol: 0.01,
              wrong: [{ v: 7, why: r`Divide by $\sqrt2$: the dot product is $\frac{3}{\sqrt2} + \frac{4}{\sqrt2}$.` }, { v: 5, why: r`5 is the steepest slope, in the gradient's own direction. The diagonal is a slightly different direction.` }],
              explain: r`$\nabla f \cdot \mathbf{u} = \frac{3 + 4}{\sqrt2} \approx 4.95$, just below the maximum of 5. In general $\nabla f \cdot \mathbf{u} = |\nabla f| \cos\theta$, largest when $\mathbf{u}$ points along the gradient ($\theta = 0$) and zero along a contour ($\theta = 90°$).`,
            },
            {
              type: 'numeric',
              title: 'Steepest climb',
              prompt: r`For $f(x, y) = x^2 + y^2$, the gradient at $(3, 4)$ is $(6, 8)$. What is the steepest rate of climb there (the length of the gradient)?`,
              answer: 10,
              wrong: [{ v: 14, why: r`The length of a vector isn’t the sum of its parts: $\sqrt{6^2 + 8^2}$.` }],
              explain: r`$\sqrt{6^2 + 8^2} = 10$. The gradient points straight away from the origin, perpendicular to the circular contours, and its length gives the slope in that steepest direction.`,
            },
            {
              type: 'numeric',
              title: 'A lopsided hill',
              prompt: r`For $f(x, y) = x^2 y$, find the gradient at $(1, 2)$, then its length: the steepest slope there. (2 decimal places.)`,
              answer: Math.sqrt(17),
              tol: 0.01,
              wrong: [{ v: 5, tol: 0.01, why: r`Check the partials: $\frac{\partial f}{\partial x} = 2xy = 4$ and $\frac{\partial f}{\partial y} = x^2 = 1$.` }],
              explain: r`$\nabla f = (2xy,\ x^2) = (4, 1)$, with length $\sqrt{17} \approx 4.12$. It points mostly in the $x$-direction: at this point the surface is four times steeper along $x$ than along $y$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Steepness',
              prompt: r`At some point, $\dfrac{\partial f}{\partial x} = 3$ and $\dfrac{\partial f}{\partial y} = 4$. What is the steepest slope available there?`,
              answer: 5,
              wrong: [{ v: 7, why: r`The gradient is the vector $(3, 4)$: its length is $\sqrt{3^2 + 4^2}$, not $3 + 4$.` }, { v: 4, why: r`Walking purely in $y$ gives 4, but a diagonal direction does better: $|\nabla f| = \sqrt{9 + 16}$.` }],
              explain: r`The steepest slope is the gradient's length: $\sqrt{3^2 + 4^2} = 5$. Walking in the direction $(3, 4)/5$ climbs at 5 units per step, faster than either axis direction alone.`,
            },
          ],
          recap: [
            r`$\nabla f = (\partial f/\partial x, \partial f/\partial y)$ points in the direction of steepest ascent.`,
            'The gradient is perpendicular to contour lines.',
            r`Its length $|\nabla f|$ is the steepest slope. At peaks it's zero.`,
          ],
        },
        {
          id: 'descent',
          title: 'Gradient Ascent & Descent',
          summary: 'How machines learn',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Climbing in the fog',
              body: r`Imagine climbing a hill in thick fog. You can't see the summit, but you can feel the slope under your feet. A good strategy: take a step in the steepest uphill direction, then repeat. That's **gradient ascent**:
$$\mathbf{x}_{\text{new}} = \mathbf{x} + \eta\,\nabla f(\mathbf{x})$$
where $\eta$ (eta), the **step size** or **learning rate**, sets how big each step is. Stepping the opposite way, $-\nabla f$, is **gradient descent**, used to find minima.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Which summit?',
              prompt: r`The path shows 60 steps of gradient ascent from the starting point. Drag the start to a place from which the climber reaches the **taller** hill (height 3).`,
              widget: {
                ...MAP,
                params: { x: { min: -3, max: 3, step: 0.1, value: -2, slider: false }, y: { min: -3, max: 3, step: 0.1, value: -2, slider: false } },
                extra: ({ plot, p, s }) => {
                  const pts = ascent(p.x, p.y, 0.3, 60);
                  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('');
                  const end = pts[pts.length - 1];
                  return [...contours(plot, s), ...peaks(plot, s), s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }), ...pts.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 2.5, class: 'fl-violet' })), s('circle', { cx: plot.X(end[0]), cy: plot.Y(end[1]), r: 7, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 })];
                },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'blue' }],
                readout: (p) => {
                  const pts = ascent(p.x, p.y, 0.3, 60), [ex, ey] = pts[pts.length - 1];
                  return r`ends at $(${f2(ex)}, ${f2(ey)})$, height $${f2(F(ex, ey))}$`;
                },
                goal: (p) => { const pts = ascent(p.x, p.y, 0.3, 60), [ex, ey] = pts[pts.length - 1]; return Math.hypot(ex - 1, ey - 0.6) < 0.1; },
                hint: 'Start on the slopes of the bigger hill, up and to the right.',
                solution: { x: 0.5, y: 2 },
              },
              explain: r`Gradient ascent climbs to the **nearest** peak, which may not be the highest one. Starting near the small hill traps you on its summit: a **local maximum**. Where you start decides where you end up.`,
            },
            {
              type: 'numeric',
              title: 'One step by hand',
              prompt: r`Use one step of gradient **descent** on $f(x, y) = x^2 + y^2$ from $(1, 2)$ with step size $\eta = 0.1$. The gradient is $(2x, 2y)$. What is the $y$-coordinate of the new point?`,
              answer: 1.6,
              tol: 0.001,
              wrong: [{ v: 2.4, tol: 0.001, why: r`Descent goes **against** the gradient: $y - \eta \cdot 2y$.` }, { v: 1.8, tol: 0.001, why: r`The gradient's $y$-component is $2y = 4$, so the step is $0.1 \times 4 = 0.4$.` }],
              explain: r`$\nabla f(1, 2) = (2, 4)$, so the new point is $(1, 2) - 0.1(2, 4) = (0.8, 1.6)$. Each step multiplies both coordinates by $0.8$, sliding straight down to the bottom of the bowl at the origin.`,
            },
            {
              type: 'mcq',
              title: 'Too big a step',
              prompt: r`What can go wrong if the step size $\eta$ is far too large?`,
              choices: [
                { t: 'The steps overshoot the peak and can bounce around or fly off', ok: true },
                { t: 'Nothing: bigger steps always arrive faster', why: 'Huge steps leap right past the peak, possibly landing somewhere worse.' },
                { t: 'The gradient becomes zero', why: 'The gradient depends on the landscape, not on your step size.' },
              ],
              explain: r`Too small a step crawls slowly. Too large a step overshoots, oscillates or diverges. Choosing the learning rate is one of the classic arts of machine learning.`,
            },
            {
              type: 'numeric',
              title: 'Three steps down',
              prompt: r`Gradient descent on $f(x) = x^2$ with learning rate 0.25 updates $x \to x - 0.25 \times 2x = 0.5x$. Starting at $x = 8$, where are you after 3 steps?`,
              answer: 1,
              explain: r`$8 \to 4 \to 2 \to 1$: each step halves the distance to the minimum. With learning rate 0.5 you’d land exactly on 0 in one step; above 1 the steps would overshoot and grow.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Training a neural network',
              prompt: r`A neural network has millions of adjustable numbers (weights). Training measures how wrong its predictions are with a "loss" function. How does gradient descent train it?`,
              choices: [
                { t: 'It computes the gradient of the loss with respect to every weight and nudges all of them a little downhill, over and over', ok: true },
                { t: 'It tries every possible combination of weights', why: 'With millions of weights, there are unimaginably many combinations. Gradients point the way instead.' },
                { t: 'It adjusts one weight at a time until it’s perfect', why: 'All weights are updated together, using the full gradient vector.' },
              ],
              explain: r`The loss is a "landscape" over millions of dimensions instead of two, but the idea is identical: compute the gradient (efficiently, using an algorithm called **backpropagation**) and step downhill. Repeated billions of times, this is how modern AI systems learn.`,
            },
          ],
          recap: [
            r`Gradient ascent: $\mathbf{x} \leftarrow \mathbf{x} + \eta\nabla f$. Descent uses $-\nabla f$.`,
            'It finds the nearest peak (or valley), which may only be local.',
            'Step size matters. Gradient descent is how neural networks are trained.',
          ],
        },
      ],
    },
    {
      title: 'Constraints and Volumes',
      summary: 'Lagrange multipliers and double integrals.',
      lessons: [
        {
          id: 'lagrange',
          title: 'Lagrange Multipliers',
          summary: 'The best point on a path',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Fencing a field',
              prompt: 'You have 40 m of fence to enclose a rectangle. Which shape encloses the most area?',
              choices: [
                { t: 'A 10 m × 10 m square', ok: true },
                { t: 'A long thin 19 m × 1 m strip', why: 'Its area is only 19 m², far less than a square’s.' },
                { t: 'All rectangles with perimeter 40 m have the same area', why: r`Compare $10 \times 10 = 100$ with $15 \times 5 = 75$.` },
              ],
              explain: r`The square gives 100 m²; a $15 \times 5$ rectangle only 75 m². This is a **constrained** problem: maximise the area $xy$, but only over rectangles whose perimeter is fixed. Calculus with constraints has a beautiful geometric answer.`,
            },
            {
              type: 'explain',
              title: 'The highest point on a path',
              body: r`Picture a hill (the function $f$) crossed by a footpath (the constraint $g(x, y) = c$). Walking along the path you go up and down. At the **highest point of the path**, the path must just touch a contour line without crossing it: if it crossed, you could keep climbing along the path.

So at the best point, the path and the contour are **tangent**.`,
            },
            {
              type: 'interactive',
              title: 'Touch the contour',
              body: r`Maximise $f(x, y) = xy$ (grey contours) along the line $x + y = 10$ (blue). Slide the point along the line. Find the spot where $f$ is largest, and look at the contour there.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 11, ymin: -0.5, ymax: 11, grid: false, maxWidth: 440, axes: { xlabel: 'x', ylabel: 'y', xticks: 2, yticks: 2 },
                params: { t: { min: 0.5, max: 9.5, step: 0.05, value: 2, slider: false } },
                curves: [
                  ...[4, 9, 16, 25, 36, 49].map((c) => ({ f: (x) => c / x, from: c / 11, to: 11, color: c === 25 ? 'amber' : 'muted', width: c === 25 ? 2.5 : 1.2 })),
                  { f: (x) => 10 - x, from: 0, to: 10, color: 'blue', width: 3 },
                ],
                points: [{ x: (p) => p.t, y: (p) => 10 - p.t, drag: { key: 't', fn: (x, y) => ({ t: Math.round(Math.max(0.5, Math.min(9.5, (x - y + 10) / 2)) * 20) / 20 }) }, color: 'coral' }],
                extra: ({ plot, p, arrow }) => { const x = p.t, y = 10 - p.t, k = 0.25; return [arrow(plot.X(x), plot.Y(y), plot.X(x + k * y), plot.Y(y + k * x), { color: 'var(--coral)', width: 3, head: 10 })]; },
                readout: (p) => r`At $(${f2(p.t)}, ${f2(10 - p.t)})$: $f = ${f2(p.t * (10 - p.t))}$ · the coral arrow is $\nabla f$`,
                goal: (p) => Math.abs(p.t - 5) < 0.03,
                hint: 'Slide until the coral gradient arrow is perpendicular to the blue line.',
                solution: { t: 5 },
              },
              explain: r`The maximum is at $(5, 5)$, with $f = 25$: the square again. There the amber contour $xy = 25$ just touches the line, and the gradient arrow is **perpendicular** to the line. Anywhere else the arrow leans along the line, pointing the way to a higher value.`,
            },
            {
              type: 'explain',
              title: 'Lagrange’s condition',
              body: r`The gradient $\nabla f$ is perpendicular to $f$'s contours, and $\nabla g$ is perpendicular to the constraint curve. At the best point the two curves are tangent, so the gradients are **parallel**:

::: key
$$\nabla f = \lambda \nabla g, \qquad g(x, y) = c.$$
:::

The number $\lambda$ is a **Lagrange multiplier** (Joseph-Louis Lagrange, 1788). For $f = xy$, $g = x + y$: $(y, x) = \lambda(1, 1)$ forces $x = y$, and $x + y = 10$ gives $(5, 5)$. As a bonus, $\lambda$ measures how much the best value improves if the constraint is relaxed a little, like the shadow prices of the Linear Programming course.`,
            },
            { /*anim:multivariable*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Watching the gradients line up',
              body: r`A walker moves along the path $x + y = 10$ (blue), across the landscape $f(x, y) = xy$. At each point we draw the {coral:gradient of $f$}, $\nabla f = (y, x)$, and the {blue:gradient of the path's equation}, $\nabla g = (1, 1)$, along with the {ink:contour of $f$} through the walker.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 11, ymin: -0.5, ymax: 11, grid: true, maxWidth: 380, clipExtra: true,
                animate: { param: 't', speed: 0.5, max: 2 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const x = 5 - 4 * Math.cos(p.t), y = 10 - x, c = x * y, els = [];
                  const arrow = (x0, y0, dx, dy, col) => { const X1 = plot.X(x0 + dx), Y1 = plot.Y(y0 + dy), a = Math.atan2(Y1 - plot.Y(y0), X1 - plot.X(x0)); return s('path', { d: `M${plot.X(x0)} ${plot.Y(y0)}L${X1} ${Y1}M${X1 - 10 * Math.cos(a - 0.4)} ${Y1 - 10 * Math.sin(a - 0.4)}L${X1} ${Y1}L${X1 - 10 * Math.cos(a + 0.4)} ${Y1 - 10 * Math.sin(a + 0.4)}`, fill: 'none', stroke: `var(--${col})`, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); };
                  const hyp = [];
                  for (let i = 0; i <= 80; i++) { const xx = c / 11 + ((11 - c / 11) * i) / 80; hyp.push(`${i ? 'L' : 'M'}${plot.X(xx).toFixed(1)} ${plot.Y(c / xx).toFixed(1)}`); }
                  els.push(s('path', { d: hyp.join(''), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
                  els.push(s('line', { x1: plot.X(-0.5), y1: plot.Y(10.5), x2: plot.X(10.5), y2: plot.Y(-0.5), stroke: 'var(--blue)', 'stroke-width': 3 }));
                  const gl = Math.hypot(y, x), sc = 2.6 / gl;
                  els.push(arrow(x, y, y * sc, x * sc, 'coral'));
                  els.push(arrow(x, y, 1.6 / Math.SQRT2, 1.6 / Math.SQRT2, 'blue'));
                  els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 6, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => { const x = 5 - 4 * Math.cos(p.t), y = 10 - x, ang = Math.abs(Math.atan2(x, y) - Math.PI / 4) * 180 / Math.PI; return `$(${fix(x, 2)}, ${fix(y, 2)})$ · $f = ${fix(x * y, 2)}$ · angle between the gradients ${fix(ang, 0)}°`; },
              },
              after: r`Away from the best point, the coral arrow leans along the path: walking that way still climbs, so $f$ can still grow. Only at $(5, 5)$, where $f = 25$, do the two gradients point the same way. There the contour just touches the path instead of crossing it, and $\nabla f = \lambda \nabla g$ with $\lambda = 5$: that is Lagrange's condition, seen happening.`,
            },
            {
              type: 'numeric',
              title: 'On a circle',
              prompt: r`Find the largest value of $x + y$ on the circle $x^2 + y^2 = 2$. (Lagrange: $(1, 1) = \lambda(2x, 2y)$.)`,
              answer: 2,
              wrong: [{ v: Math.SQRT2, tol: 0.01, why: r`That's the circle's radius. The best point is $(1, 1)$, where $x + y = 2$.` }, { v: 4, why: r`Check the point is on the circle: $(2, 2)$ has $x^2 + y^2 = 8$.` }],
              hint: r`The condition gives $x = y$. Substitute into $x^2 + y^2 = 2$.`,
              explain: r`$1 = 2\lambda x$ and $1 = 2\lambda y$ force $x = y$; then $2x^2 = 2$ gives $x = y = 1$ and $x + y = 2$. Geometrically, the line $x + y = 2$ just touches the circle, and the gradient $(1, 1)$ points straight out from the centre.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Along the river',
              prompt: r`A farmer fences a rectangular field beside a straight river, needing fence on only 3 sides: two of length $x$ and one of length $y$, with $2x + y = 20$ m. What is the largest possible area, in m²?`,
              unit: 'm²',
              answer: 50,
              wrong: [{ v: 25, why: r`That's a $5 \times 5$ square, using only 15 m of fence. The river side is free, so the best shape isn't a square.` }, { v: 100, why: r`Check: $x = 5$, $y = 10$ uses $2(5) + 10 = 20$ m, giving 50 m².` }],
              hint: r`$\nabla(xy) = \lambda \nabla(2x + y)$ gives $y = 2\lambda$ and $x = \lambda$, so $y = 2x$.`,
              explain: r`$(y, x) = \lambda(2, 1)$ gives $y = 2x$. With $2x + y = 20$: $x = 5$, $y = 10$, area 50 m². The side along the river is twice as long as each of the others: the free river bank "counts" like a mirror, and the field is half of a 10 × 10 square reflected in it.`,
            },
          ],
          recap: [
            'At a constrained maximum, the constraint curve is tangent to a contour of f.',
            r`Lagrange's condition: $\nabla f = \lambda \nabla g$ together with $g = c$.`,
            'The multiplier λ measures how sensitive the best value is to the constraint.',
          ],
        },
        {
          id: 'double',
          title: 'Double Integrals',
          summary: 'Volume under a surface',
          icon: 'grip',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A flat roof',
              prompt: r`A flat roof at height $f(x, y) = 3$ m covers a rectangular room 2 m by 4 m. What volume lies under it?`,
              unit: 'm³',
              answer: 24,
              wrong: [{ v: 8, why: 'That’s the floor area. Multiply by the height.' }],
              explain: r`Volume = height × area = $3 \times 8 = 24$ m³. When the height varies from point to point, chop the floor into small squares, treat each column as a box, and add them up.`,
            },
            {
              type: 'explain',
              title: 'Adding columns',
              body: r`The **double integral** of $f(x, y)$ over a region $R$ is the volume under the surface:
$$\iint_R f(x, y)\,dA = \lim \sum f(x_i, y_j)\,\Delta A.$$
It's the two-dimensional version of a Riemann sum: a grid of thin columns instead of thin strips. Besides volumes, double integrals compute total mass from a density, total rainfall from a rainfall map, and probabilities from a joint distribution.`,
            },
            {
              type: 'interactive',
              title: 'Grid of columns',
              body: r`The surface $f(x, y) = x^2 + y^2$ over the unit square, seen from above: darker cells are taller columns, each using the height at its centre. The exact volume is $\frac23$. Refine the grid until the estimate is within **0.001**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.08, xmax: 1.08, ymin: -0.08, ymax: 1.08, grid: false, maxWidth: 380, axes: { xlabel: 'x', ylabel: 'y', xticks: 0.5, yticks: 0.5 },
                params: { n: { min: 1, max: 20, step: 1, value: 3, label: 'grid size', color: 'violet', format: (v) => `${v} × ${v}` } },
                extra: ({ plot, p, s }) => {
                  const els = [], w = 1 / p.n;
                  for (let i = 0; i < p.n; i++) for (let j = 0; j < p.n; j++) {
                    const x = (i + 0.5) * w, y = (j + 0.5) * w, h = x * x + y * y;
                    els.push(s('rect', { x: plot.X(i * w), y: plot.Y((j + 1) * w), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(w), class: 'fl-violet', opacity: 0.1 + 0.45 * h, stroke: 'var(--card)', 'stroke-width': p.n > 12 ? 0.5 : 1 }));
                  }
                  return els;
                },
                readout: (p) => r`Estimate $${midSum(p.n).toFixed(5)}$ · exact $0.66667$ · error $${(2 / 3 - midSum(p.n)).toFixed(5)}$`,
                goal: (p) => Math.abs(2 / 3 - midSum(p.n)) < 0.001,
                hint: 'The error here is 1/(6n²).',
                solution: { n: 13 },
              },
              explain: r`Using the height at each cell's centre (the **midpoint rule**), the error is exactly $\frac{1}{6n^2}$, so a $13 \times 13$ grid (169 columns) gets within 0.001. In three or more dimensions, grids get expensive fast, which is where the Monte Carlo methods of the Numerical Methods course take over.`,
            },
            {
              type: 'explain',
              title: 'One variable at a time',
              body: r`To compute a double integral exactly, integrate one variable at a time, treating the other as a constant, just like a partial derivative:
$$\int_0^1 \!\! \int_0^1 (x^2 + y^2)\,dy\,dx = \int_0^1 \left[x^2 y + \tfrac{y^3}{3}\right]_0^1 dx = \int_0^1 \left(x^2 + \tfrac13\right)dx = \tfrac13 + \tfrac13 = \tfrac23.$$
**Fubini's theorem** says the order doesn't matter: slicing the volume into slabs along $x$ or along $y$ gives the same total.`,
            },
            {
              type: 'numeric',
              title: 'Iterate',
              prompt: r`Compute $\displaystyle\int_0^1 \!\! \int_0^2 xy\,dy\,dx$.`,
              answer: 1,
              wrong: [{ v: 2, why: r`$\int_0^2 y\,dy = 2$, then $\int_0^1 2x\,dx = 1$.` }, { v: 0.5, why: r`The inner integral is $x \int_0^2 y\,dy = 2x$, not $\frac{x}{2}$.` }],
              hint: r`Inner: $\int_0^2 xy\,dy = x \cdot \frac{y^2}{2}\Big|_0^2 = 2x$.`,
              explain: r`Inner: $\int_0^2 xy\,dy = 2x$. Outer: $\int_0^1 2x\,dx = 1$. When the function splits as $g(x)h(y)$ over a rectangle, the double integral is just the product $\int g \cdot \int h = \frac12 \times 2 = 1$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The Gaussian integral',
              body: r`The bell curve $e^{-x^2}$ has no elementary antiderivative, yet a double integral finds its total area. Switching to polar coordinates, the volume under $e^{-(x^2 + y^2)}$ over the whole plane is exactly $\pi$. But that volume also equals $\left(\int_{-\infty}^{\infty} e^{-x^2}dx\right)^2$, because the function splits as $e^{-x^2} e^{-y^2}$.`,
              prompt: r`So what is $\displaystyle\int_{-\infty}^{\infty} e^{-x^2}\,dx$? (3 decimal places.)`,
              answer: Math.sqrt(Math.PI),
              tol: 0.001,
              wrong: [{ v: Math.PI, tol: 0.001, why: r`$\pi$ is the **square** of the integral. Take the square root.` }, { v: Math.PI / 2, tol: 0.001, why: r`The integral squared is $\pi$, so the integral is $\sqrt\pi$.` }],
              explain: r`The integral is $\sqrt{\pi} \approx 1.772$. Going up a dimension made an impossible one-dimensional integral easy. This result is why $\sqrt{2\pi}$ appears in the formula for the normal distribution, the most important curve in statistics.`,
            },
          ],
          recap: [
            r`$\iint_R f\,dA$ is the volume under $f$: the limit of sums of thin columns.`,
            'Compute it as an iterated integral, one variable at a time; the order doesn’t matter (Fubini).',
            r`A double integral in polar coordinates gives $\int e^{-x^2}dx = \sqrt\pi$.`,
          ],
        },
        {
          id: 'second-derivative',
          title: 'Peaks, Pits & Passes',
          summary: 'The second derivative test',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Flat isn’t enough',
              body: r`At a peak, a pit or a mountain pass (a **saddle**), the gradient is zero: the surface is momentarily flat. To tell them apart, look at the second derivatives and compute
$$D = f_{xx}\,f_{yy} - f_{xy}^2.$$
- $D > 0$ and $f_{xx} > 0$: a **minimum** (curving up in every direction);
- $D > 0$ and $f_{xx} < 0$: a **maximum**;
- $D < 0$: a **saddle** (up in some directions, down in others);
- $D = 0$: the test can’t decide.`,
            },
            {
              type: 'numeric',
              title: 'A bowl',
              prompt: r`For $f(x, y) = x^2 + 3y^2$, compute $D$ at the origin.`,
              answer: 12,
              explain: r`$f_{xx} = 2$, $f_{yy} = 6$, $f_{xy} = 0$, so $D = 12 > 0$ with $f_{xx} > 0$: a minimum, as the bowl shape suggests.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'From bowl to saddle',
              prompt: r`The contours of $f(x, y) = x^2 + a\,xy + y^2$ are shown (teal for positive values, coral for negative). Increase $a$ and find the value at which the origin **stops being a minimum**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2, xmax: 2, ymin: -2, ymax: 2, grid: false, maxWidth: 360, axes: { xticks: 1, yticks: 1 },
                params: { a: { min: 0, max: 4, step: 0.01, value: 1, label: 'a', color: 'violet', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => { const l1 = 1 + p.a / 2, l2 = 1 - p.a / 2, out = [], c = Math.SQRT1_2, rot = (u, v) => [c * (u - v), c * (u + v)], path = (pts, col) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: col, 'stroke-width': 2 }); for (const lev of [0.25, 0.75, 1.5, 2.5]) { if (l2 > 1e-3) { const pts = []; for (let i = 0; i <= 120; i++) { const t = (2 * Math.PI * i) / 120; pts.push(rot(Math.sqrt(lev / l1) * Math.cos(t), Math.sqrt(lev / l2) * Math.sin(t))); } out.push(path(pts, 'var(--teal)')); } else if (l2 < -1e-3) { for (const sg of [1, -1]) { const pts = [], pts2 = []; for (let i = -60; i <= 60; i++) { const t = i / 20; pts.push(rot(sg * Math.sqrt(lev / l1) * Math.cosh(t), Math.sqrt(lev / -l2) * Math.sinh(t))); pts2.push(rot(Math.sqrt(lev / l1) * Math.sinh(t), sg * Math.sqrt(lev / -l2) * Math.cosh(t))); } out.push(path(pts, 'var(--teal)'), path(pts2, 'var(--coral)')); } } } return out; },
                readout: (p) => { const D = 4 - p.a * p.a; return `f_xx = 2, f_yy = 2, f_xy = ${p.a.toFixed(2)} · D = **${D.toFixed(2)}** · ${D > 1e-6 ? 'minimum (closed ellipses)' : D < -1e-6 ? 'saddle (hyperbolas)' : 'borderline: the test fails'}`; },
                goal: (p) => Math.abs(p.a - 2) < 0.01,
                hint: r`$D = 2 \times 2 - a^2$. When does it reach zero?`,
                solution: { a: 2 },
              },
              explain: r`$D = 4 - a^2$ hits zero at $a = 2$, where $f = (x + y)^2$: a valley floor that is flat along the line $y = -x$. Beyond $a = 2$, $f$ is negative along that line and positive across it: the ellipses have turned into hyperbolas around a saddle.`,
            },
            {
              type: 'mcq',
              title: 'The simplest saddle',
              prompt: r`What kind of critical point does $f(x, y) = xy$ have at the origin?`,
              choices: [
                { t: 'A saddle', ok: true },
                { t: 'A minimum', why: r`Along $y = -x$, $f = -x^2 < 0$, so the origin isn’t the lowest point.` },
                { t: 'A maximum', why: r`Along $y = x$, $f = x^2 > 0$.` },
              ],
              explain: r`$f_{xx} = f_{yy} = 0$ and $f_{xy} = 1$, so $D = -1 < 0$: a saddle. It’s the same surface as $\frac12(u^2 - v^2)$, rotated by 45°: a Pringle.`,
            },
            {
              type: 'numeric',
              title: 'Two critical points',
              prompt: r`$f(x, y) = x^3 - 3x + y^2$ has critical points at $(1, 0)$ and $(-1, 0)$. Compute $D$ at $(-1, 0)$.`,
              answer: -12,
              explain: r`$f_{xx} = 6x = -6$, $f_{yy} = 2$, $f_{xy} = 0$, so $D = -12 < 0$: a saddle. At $(1, 0)$, $D = 12$ with $f_{xx} = 6 > 0$: a minimum.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Classify it',
              prompt: r`What kind of critical point does $f(x, y) = 4 - x^2 - y^2 + xy$ have at the origin?`,
              choices: [
                { t: 'A maximum', ok: true },
                { t: 'A saddle', why: r`$D = (-2)(-2) - 1^2 = 3 > 0$, so it isn’t a saddle.` },
                { t: 'A minimum', why: r`$D > 0$, but $f_{xx} = -2 < 0$: the surface curves down.` },
              ],
              explain: r`$f_{xx} = f_{yy} = -2$, $f_{xy} = 1$, so $D = 4 - 1 = 3 > 0$ and $f_{xx} < 0$: a **maximum** (height 4). The $xy$ term tilts the hill’s contours, but isn’t strong enough to make a saddle.`,
            },
          ],
          recap: [
            'Critical points have zero gradient: maxima, minima or saddles.',
            r`$D = f_{xx}f_{yy} - f_{xy}^2$: positive means max or min (by the sign of $f_{xx}$), negative means saddle.`,
            'Contours are closed loops around extrema and cross like an X at saddles.',
          ],
        },
      ],
    },
  ],
};
