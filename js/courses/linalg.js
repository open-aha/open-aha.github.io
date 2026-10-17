import { fix } from '../lib/svg.js';

const r = String.raw;
// live values keep a fixed 1 decimal (the dragged points snap to halves), so they never change length
const f1 = (v) => fix(v, 1);
const vec = (plot, arrow, x0, y0, x1, y1, color, w = 4) => arrow(plot.X(x0), plot.Y(y0), plot.X(x1), plot.Y(y1), { color: `var(--${color})`, width: w, head: 14 });
const pathOf = (plot, pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z';
const mul = (M, [x, y]) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];

// An "F" shape: its orientation shows reflections clearly.
const F_SHAPE = [[0, 0], [0, 2], [1.3, 2], [1.3, 1.6], [0.45, 1.6], [0.45, 1.2], [1.05, 1.2], [1.05, 0.8], [0.45, 0.8], [0.45, 0]];
const ROT = [[0, -1], [1, 0]]; // 90° counterclockwise
const REF = [[1, 0], [0, -1]]; // reflect in the x-axis

// Markov chain: two towns
const markov = (n) => {
  let A = 1000, B = 0;
  const out = [[A, B]];
  for (let k = 0; k < n; k++) {
    [A, B] = [0.9 * A + 0.2 * B, 0.1 * A + 0.8 * B];
    out.push([A, B]);
  }
  return out;
};

// ---- SVD demo: a 20 × 20 greyscale smiley, decomposed with the Jacobi method
// smiley image 20x20
const NS = 20;
const SMILE = Array.from({ length: NS }, (_, r) => Array.from({ length: NS }, (_, c) => {
  const x = (c - 9.5) / 9.5, y = (r - 9.5) / 9.5, d = Math.hypot(x, y);
  if (d > 0.95) return 0;
  if (Math.hypot(x + 0.35, y + 0.3) < 0.15 || Math.hypot(x - 0.35, y + 0.3) < 0.15) return 0.1;
  if (y > 0.2 && y < 0.5 && Math.abs(Math.hypot(x, y - 0.0) - 0.45) < 0.1) return 0.1;
  return 0.9;
}));
function jacobi(S) {
  const n = S.length, A = S.map((r) => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  return { vals: A.map((r, i) => r[i]), V };
}
const AtA = Array.from({ length: NS }, (_, i) => Array.from({ length: NS }, (_, j) => SMILE.reduce((s, row) => s + row[i] * row[j], 0)));
const { vals, V } = jacobi(AtA);
const order = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
const SV = order.map(([v, i]) => { const sig = Math.sqrt(Math.max(0, v)), vv = V.map((r) => r[i]), u = SMILE.map((row) => row.reduce((s, a, j) => s + a * vv[j], 0) / (sig || 1)); return { sig, u, v: vv }; });
const approx = (k) => SMILE.map((_, r) => SMILE[0].map((_, c) => SV.slice(0, k).reduce((s, t) => s + t.sig * t.u[r] * t.v[c], 0)));
const relErr = (k) => { const A = approx(k); let e = 0, t = 0; SMILE.forEach((row, r) => row.forEach((v, c) => { e += (v - A[r][c]) ** 2; t += v * v; })); return Math.sqrt(e / t); };
// ---- least squares demo
const LSQ = [[0, 1.3], [1, 1.2], [2, 2.4], [3, 2.3], [4, 3.4], [5, 3.2], [6, 4.4], [7, 4.3]];
const sse = (m, b) => LSQ.reduce((s, [x, y]) => s + (y - (m * x + b)) ** 2, 0);
const LSQ_FIT = (() => { const n = LSQ.length, mx = LSQ.reduce((s, q) => s + q[0], 0) / n, my = LSQ.reduce((s, q) => s + q[1], 0) / n; const m = LSQ.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / LSQ.reduce((s, [x]) => s + (x - mx) ** 2, 0); return { m, b: my - m * mx }; })();

export default {
  id: 'linalg',
  subject: 'math',
  title: 'Linear Algebra',
  level: 'Advanced',
  cover: 'linalg',
  tagline: 'Span, composition, inverses, eigenvectors, least squares and the SVD.',
  description: r`Go beyond single matrices. Combine vectors to reach any point, chain transformations together, undo them to solve systems of equations, and find the special directions a matrix only stretches, which explain population models, Fibonacci numbers and Google's PageRank. Then fit data with least squares and compress images with the singular value decomposition.`,
  prereq: 'Vectors & Matrices',
  chapters: [
    {
      title: 'Building Blocks',
      summary: 'Span and composition.',
      lessons: [
        {
          id: 'span',
          title: 'Span & Bases',
          summary: 'What can two vectors reach?',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Linear combinations',
              body: r`Given two vectors $\blue{\mathbf u}$ and $\coral{\mathbf v}$, a **linear combination** is anything of the form
$$a\,\blue{\mathbf u} + b\,\coral{\mathbf v}$$
for numbers $a$ and $b$: stretch each vector, then add them tip to tail. The set of everything you can reach this way is the **span** of the two vectors.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Reach the target',
              prompt: r`With $\blue{\mathbf u} = (2, 1)$ and $\coral{\mathbf v} = (1, 2)$, choose $a$ and $b$ so that $a\,\blue{\mathbf u} + b\,\coral{\mathbf v}$ lands on the green target $(4, 5)$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 7, ymin: -3, ymax: 7, grid: 1, clipExtra: true, axes: { xlabel: 'x', ylabel: 'y' }, maxWidth: 560,
                params: {
                  a: { min: -3, max: 3, step: 0.5, value: 0.5, label: '$a$', color: 'blue' },
                  b: { min: -3, max: 3, step: 0.5, value: 0.5, label: '$b$', color: 'coral' },
                },
                extra: ({ plot, p, s, arrow }) => {
                  const ax = 2 * p.a, ay = p.a;
                  return [
                    s('circle', { cx: plot.X(4), cy: plot.Y(5), r: 12, class: 'fl-green', opacity: 0.35 }),
                    s('circle', { cx: plot.X(4), cy: plot.Y(5), r: 5, class: 'fl-green' }),
                    vec(plot, arrow, 0, 0, ax, ay, 'blue'),
                    vec(plot, arrow, ax, ay, ax + p.b, ay + 2 * p.b, 'coral'),
                    s('circle', { cx: plot.X(ax + p.b), cy: plot.Y(ay + 2 * p.b), r: 6, class: 'fl-ink' }),
                  ];
                },
                readout: (p) => r`$${f1(p.a)}\,\blue{(2, 1)} + ${f1(p.b)}\,\coral{(1, 2)} = (${f1(2 * p.a + p.b)}, ${f1(p.a + 2 * p.b)})$`,
                goal: (p) => p.a === 1 && p.b === 2,
                hint: r`You need $2a + b = 4$ and $a + 2b = 5$.`,
                solution: { a: 1, b: 2 },
              },
              explain: r`$1 \cdot (2, 1) + 2 \cdot (1, 2) = (4, 5)$. Finding $a$ and $b$ means solving $2a + b = 4$ and $a + 2b = 5$: a system of equations in disguise.`,
            },
            {
              type: 'mcq',
              title: 'Pointing the same way',
              prompt: r`What is the span of $\mathbf u = (1, 2)$ and $\mathbf v = (-2, -4)$?`,
              choices: [
                { t: r`Just a line through the origin`, ok: true },
                { t: 'The whole plane', why: r`$\mathbf v = -2\mathbf u$. Both vectors lie on the same line, so their combinations can't leave it.` },
                { t: 'Only the two points (1, 2) and (−2, −4)', why: 'Any multiples and sums are allowed, so you get infinitely many points.' },
              ],
              explain: r`Since $\mathbf v = -2\mathbf u$, every combination $a\mathbf u + b\mathbf v = (a - 2b)\mathbf u$ is just a multiple of $\mathbf u$. The span is the line through the origin in the direction $(1, 2)$. The vectors are **linearly dependent**.`,
            },
            {
              type: 'explain',
              title: 'Bases',
              body: r`Two vectors in the plane that **don't** lie on the same line are **linearly independent**, and they span the whole plane. Such a pair is a **basis**: every point can be written as $a\mathbf u + b\mathbf v$ in exactly **one** way.

The numbers $(a, b)$ are the point's **coordinates in that basis**. The usual $x, y$ coordinates are just coordinates in the basis $\hat\imath = (1, 0)$, $\hat\jmath = (0, 1)$.`,
            },
            {
              type: 'numeric',
              title: 'A line, not a plane',
              prompt: r`What is the dimension of the span of $(1, 2)$ and $(3, 6)$?`,
              answer: 1,
              explain: r`$(3, 6) = 3(1, 2)$, so the two vectors point along the same line. Their span is that line: dimension 1.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'New coordinates',
              prompt: r`Write $(7, 4)$ as $a(1, 1) + b(1, -1)$. What is $a$?`,
              lhs: r`$a =$`,
              answer: 5.5,
              wrong: [{ v: 1.5, why: r`That's $b$. Adding the equations $a + b = 7$ and $a - b = 4$ gives $2a = 11$.` }, { v: 7, why: r`$a + b = 7$ and $a - b = 4$ must both hold.` }],
              explain: r`The equations are $a + b = 7$ and $a - b = 4$. Adding them gives $2a = 11$, so $a = 5.5$ and $b = 1.5$. Check: $5.5(1, 1) + 1.5(1, -1) = (7, 4)$ ✓.`,
            },
          ],
          recap: [
            r`A linear combination is $a\mathbf u + b\mathbf v$. The span is everything you can reach.`,
            'Two vectors on the same line are dependent: their span is just a line.',
            'Two independent vectors in the plane form a basis: every point has unique coordinates.',
          ],
        },
        {
          id: 'composition',
          title: 'Composition',
          summary: 'Matrix multiplication, and why order matters',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'One transformation after another',
              body: r`Apply matrix $B$ to a vector, then apply $A$ to the result: $A(B\mathbf x)$. The combined effect is a single matrix, the **product** $AB$:
$$A(B\mathbf x) = (AB)\mathbf x$$
Notice the order: $AB$ means **$B$ first, then $A$**, read right to left, just like function composition $f(g(x))$.

Each entry of $AB$ is a row of $A$ "dotted" with a column of $B$:
$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}\begin{pmatrix} e & f \\ g & h \end{pmatrix} = \begin{pmatrix} ae + bg & af + bh \\ ce + dg & cf + dh \end{pmatrix}$$`,
            },
            {
              type: 'numeric',
              title: 'Multiply',
              prompt: r`Let $A = \begin{pmatrix} 1 & 2 \\ 0 & 1 \end{pmatrix}$ and $B = \begin{pmatrix} 3 & 0 \\ 1 & 2 \end{pmatrix}$. What is the top-left entry of $AB$?`,
              answer: 5,
              wrong: [{ v: 3, why: r`Row 1 of $A$ is $(1, 2)$ and column 1 of $B$ is $(3, 1)$: $1 \cdot 3 + 2 \cdot 1$.` }, { v: 7, why: r`Use row 1 of $A$ with column 1 of $B$: $1 \cdot 3 + 2 \cdot 1 = 5$.` }],
              explain: r`Row 1 of $A$ dotted with column 1 of $B$: $1 \cdot 3 + 2 \cdot 1 = 5$. In full, $AB = \begin{pmatrix} 5 & 4 \\ 1 & 2 \end{pmatrix}$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Does order matter?',
              body: r`Take $R$, a 90° counterclockwise rotation, and $F$, a reflection in the $x$-axis. Apply them to the letter F in both orders.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.6, ymax: 2.6, grid: 1, axes: { xlabel: 'x', ylabel: 'y' }, maxWidth: 480,
                params: {
                  order: { min: 0, max: 1, step: 1, value: 0, label: 'order', color: 'violet', format: (v) => (v ? 'F, then R' : 'R, then F') },
                  k: { min: 0, max: 2, step: 1, value: 0, label: 'steps applied', color: 'blue', format: (v) => `${v}` },
                },
                extra: ({ plot, p, s }) => {
                  const seq = p.order ? [REF, ROT] : [ROT, REF];
                  let pts = F_SHAPE;
                  for (let i = 0; i < p.k; i++) pts = pts.map((q) => mul(seq[i], q));
                  return [
                    s('path', { d: pathOf(plot, F_SHAPE), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    s('path', { d: pathOf(plot, pts), class: p.order ? 'fl-coral' : 'fl-blue', opacity: 0.8, stroke: 'var(--ink)', 'stroke-width': 2 }),
                  ];
                },
                readout: (p) => (p.k < 2 ? r`Step through the transformations.` : p.order ? r`$RF$: the F is flipped across the line $y = x$` : r`$FR$: the F is flipped across the line $y = -x$`),
              },
              after: r`The two orders give different results: $FR \ne RF$. In general, **matrix multiplication is not commutative**. Order matters, just as putting on socks and then shoes differs from shoes and then socks.`,
            },
            {
              type: 'mcq',
              title: 'Track a vector',
              prompt: r`Start with $(1, 0)$. Rotate 90° counterclockwise, **then** reflect in the $x$-axis. Where does it end up?`,
              cols: 2,
              choices: [
                { t: r`$(0, -1)$`, ok: true },
                { t: r`$(0, 1)$`, why: r`That's the result of reflecting first: $(1, 0)$ is unchanged by the reflection, then rotates to $(0, 1)$.` },
                { t: r`$(-1, 0)$`, why: r`The rotation sends $(1, 0)$ to $(0, 1)$. Then the reflection flips the sign of $y$.` },
                { t: r`$(1, 0)$`, why: 'The rotation moves it off the x-axis first.' },
              ],
              explain: r`Rotate: $(1, 0) \to (0, 1)$. Reflect in the $x$-axis: $(0, 1) \to (0, -1)$. In the other order you'd get $(0, 1)$, which confirms that $FR \ne RF$.`,
            },
            {
              type: 'mcq',
              title: 'Reflect twice',
              prompt: r`What do you get if you apply the same reflection twice?`,
              choices: [
                { t: r`The identity: everything returns to where it started`, ok: true },
                { t: r`A rotation by 180°`, why: r`That’s the result of two reflections in perpendicular lines, not the same line twice.` },
                { t: r`The same reflection`, why: r`Reflecting a reflection undoes it.` },
              ],
              explain: r`A reflection is its own inverse: $R^2 = I$. Two reflections in **different** lines give a rotation by twice the angle between the lines, a neat way to build rotations from reflections.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Determinants multiply',
              prompt: r`$\det A = 3$ and $\det B = -2$. What is $\det(AB)$?`,
              answer: -6,
              wrong: [{ v: 1, why: r`Determinants don't add. Each one is an area scale factor, and applying both scales area by each in turn.` }, { v: 6, why: r`The sign matters: $B$ flips orientation, so $AB$ does too.` }],
              explain: r`$B$ scales areas by $-2$ (and flips), then $A$ scales by 3. Together: $\det(AB) = \det A \cdot \det B = 3 \times (-2) = -6$. This holds even though $AB \ne BA$, so $\det(AB) = \det(BA)$ always!`,
            },
          ],
          recap: [
            r`$AB$ means "do $B$, then $A$". Entries are rows of $A$ dotted with columns of $B$.`,
            r`In general $AB \ne BA$: order matters.`,
            r`$\det(AB) = \det A \cdot \det B$.`,
          ],
        },
      ],
    },
    {
      title: 'Undoing and Solving',
      summary: 'Inverses and systems.',
      lessons: [
        {
          id: 'inverses',
          title: 'Inverses & Systems',
          summary: 'Solving equations with matrices',
          icon: 'reset',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'Two lines',
              prompt: r`Drag the point to where both equations are true:
$$\blue{2x + y = 5} \qquad \coral{x - y = 1}$$`,
              widget: {
                kind: 'graph', equal: true, xmin: -2, xmax: 5, ymin: -3, ymax: 5, grid: 1, axes: { xlabel: 'x', ylabel: 'y' }, maxWidth: 520,
                params: { x: { min: -2, max: 5, step: 0.5, value: 0, slider: false }, y: { min: -3, max: 5, step: 0.5, value: 3, slider: false } },
                curves: [{ f: (x) => 5 - 2 * x, color: 'blue' }, { f: (x) => x - 1, color: 'coral' }],
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }],
                readout: (p) => r`$(${f1(p.x)}, ${f1(p.y)})$: $\;\blue{2x + y = ${f1(2 * p.x + p.y)}}$, $\;\coral{x - y = ${f1(p.x - p.y)}}$`,
                goal: (p) => p.x === 2 && p.y === 1,
                hint: 'Each equation is a line. The solution must lie on both.',
                solution: { x: 2, y: 1 },
              },
              explain: r`The lines cross at $(2, 1)$: $2(2) + 1 = 5$ ✓ and $2 - 1 = 1$ ✓.`,
            },
            {
              type: 'explain',
              title: 'The same system as a matrix',
              body: r`The system can be written as one matrix equation $A\mathbf x = \mathbf b$:
$$\begin{pmatrix} 2 & 1 \\ 1 & -1 \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} 5 \\ 1 \end{pmatrix}$$
"Which vector does $A$ send to $\mathbf b$?" To answer that, **undo** $A$. The **inverse** $A^{-1}$ reverses the transformation: $A^{-1}A = I$, where $I$ is the identity (it changes nothing). Then
$$\mathbf x = A^{-1}\mathbf b$$
For a $2 \times 2$ matrix:
$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$$
Swap the diagonal, negate the off-diagonal, and divide by the determinant.`,
            },
            {
              type: 'numeric',
              title: 'Compute an inverse',
              prompt: r`For $A = \begin{pmatrix} 2 & 1 \\ 1 & -1 \end{pmatrix}$, what is the top-left entry of $A^{-1}$? (A fraction or decimal.)`,
              answer: 1 / 3,
              tol: 0.005,
              wrong: [{ v: -1 / 3, tol: 0.005, why: r`$\det A = 2(-1) - 1(1) = -3$, and the top-left entry is $\frac{d}{\det} = \frac{-1}{-3}$.` }, { v: -1, why: r`Don't forget to divide by the determinant, $-3$.` }, { v: 0.5, why: 'The inverse isn’t found entry by entry. Use the 2×2 formula.' }],
              explain: r`$\det A = -2 - 1 = -3$, so $A^{-1} = \frac{1}{-3}\begin{pmatrix} -1 & -1 \\ -1 & 2 \end{pmatrix} = \begin{pmatrix} \frac13 & \frac13 \\ \frac13 & -\frac23 \end{pmatrix}$. Check: $A^{-1}\begin{pmatrix} 5 \\ 1 \end{pmatrix} = \begin{pmatrix} 2 \\ 1 \end{pmatrix}$ ✓, the same answer as the graph.`,
            },
            {
              type: 'mcq',
              title: 'When there is no inverse',
              prompt: r`What goes wrong with $x + 2y = 3$ and $2x + 4y = 7$?`,
              choices: [
                { t: 'The lines are parallel, so there is no solution', ok: true },
                { t: 'The lines are the same, so there are infinitely many solutions', why: r`Doubling the first equation gives $2x + 4y = 6$, not 7. Same slope, different line.` },
                { t: 'Nothing: there is exactly one solution', why: r`$\det\begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix} = 4 - 4 = 0$, so there's no unique solution.` },
              ],
              explain: r`$\det = 1 \cdot 4 - 2 \cdot 2 = 0$. The matrix squashes the plane onto a line, so it can't be undone: there's **no inverse**. Geometrically the two lines are parallel ($2x + 4y = 6$ vs $7$) and never meet. If the right-hand sides matched, they'd be the same line and every point on it would be a solution.`,
            },
            {
              type: 'numeric',
              title: 'Solve a system',
              prompt: r`Use the inverse formula to solve $3x + 2y = 12$ and $x - y = -1$. What is $y$?`,
              answer: 3,
              wrong: [{ v: 2, why: r`That's $x$. Now use either equation to find $y$.` }],
              explain: r`$A = \begin{pmatrix} 3 & 2 \\ 1 & -1 \end{pmatrix}$ has $\det A = -3 - 2 = -5$, so $A^{-1} = \frac{1}{-5}\begin{pmatrix} -1 & -2 \\ -1 & 3 \end{pmatrix}$. Then $\mathbf x = A^{-1}\begin{pmatrix} 12 \\ -1 \end{pmatrix} = \frac{1}{-5}\begin{pmatrix} -10 \\ -15 \end{pmatrix} = \begin{pmatrix} 2 \\ 3 \end{pmatrix}$, so $y = 3$. Check: $6 + 6 = 12$ ✓ and $2 - 3 = -1$ ✓.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Find the bad value',
              prompt: r`For which $k$ does $\begin{pmatrix} k & 2 \\ 3 & 6 \end{pmatrix}$ have **no** inverse?`,
              lhs: r`$k =$`,
              answer: 1,
              wrong: [{ v: 4, why: r`$\det = 6k - 6$ (that's $k \cdot 6 - 2 \cdot 3$).` }, { v: 0, why: r`At $k = 0$, $\det = -6 \ne 0$.` }],
              explain: r`$\det = 6k - 2 \cdot 3 = 6k - 6 = 0$ when $k = 1$. Then the columns $(1, 3)$ and $(2, 6)$ point the same way: dependent, so the plane is squashed onto a line.`,
            },
          ],
          recap: [
            r`A system of equations is $A\mathbf x = \mathbf b$, solved by $\mathbf x = A^{-1}\mathbf b$.`,
            r`$2 \times 2$ inverse: swap $a$ and $d$, negate $b$ and $c$, divide by $ad - bc$.`,
            r`$\det A = 0$ means no inverse, and either no solution or infinitely many.`,
          ],
        },
      ],
    },
    {
      title: 'Eigenvectors',
      summary: 'The directions that survive.',
      lessons: [
        {
          id: 'eigen',
          title: 'Eigenvectors',
          summary: 'Directions a matrix only stretches',
          icon: 'target',
          steps: [
            {
              type: 'interactive',
              kicker: 'Explore',
              title: 'Hunting for special directions',
              prompt: r`The matrix $A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ turns most vectors. Drag $\blue{\mathbf v}$ around the circle until $\coral{A\mathbf v}$ points along the **same line** as $\blue{\mathbf v}$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -4.6, ymax: 4.6, grid: 1, axes: { xlabel: 'x', ylabel: 'y' }, maxWidth: 520,
                params: { th: { min: 0, max: 355, step: 5, value: 10, slider: false } },
                extra: ({ plot, p, s, arrow }) => {
                  const t = (p.th * Math.PI) / 180, R = 1.5;
                  const vx = R * Math.cos(t), vy = R * Math.sin(t);
                  const [ax, ay] = mul([[2, 1], [1, 2]], [vx, vy]);
                  const par = p.th % 90 === 45;
                  const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(R) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' })];
                  if (par) els.push(s('line', { x1: plot.X(-6 * Math.cos(t)), y1: plot.Y(-6 * Math.sin(t)), x2: plot.X(6 * Math.cos(t)), y2: plot.Y(6 * Math.sin(t)), stroke: 'var(--success)', 'stroke-width': 3, opacity: 0.5 }));
                  els.push(vec(plot, arrow, 0, 0, ax, ay, 'coral', 5), vec(plot, arrow, 0, 0, vx, vy, 'blue', 4));
                  return els;
                },
                points: [{ x: (p) => 1.5 * Math.cos((p.th * Math.PI) / 180), y: (p) => 1.5 * Math.sin((p.th * Math.PI) / 180), drag: { fn: (x, y) => ({ th: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 }), key: 'th' }, color: 'blue' }],
                readout: (p) => {
                  const t = (p.th * Math.PI) / 180;
                  const [ax, ay] = mul([[2, 1], [1, 2]], [Math.cos(t), Math.sin(t)]);
                  const ang = Math.round((Math.atan2(ay, ax) - t) * 180 / Math.PI);
                  return p.th % 90 === 45 ? r`$A\mathbf v = ${p.th % 180 === 45 ? 3 : 1}\,\mathbf v$: same line!` : r`$A\mathbf v$ is turned ${Math.abs(((ang + 540) % 360) - 180)}° away from $\mathbf v$`;
                },
                goal: (p) => p.th % 90 === 45,
                hint: 'Try the diagonals.',
                solution: { th: 45 },
              },
              explain: r`Along the diagonal $(1, 1)$, $A$ just stretches by 3: $A\begin{pmatrix} 1 \\ 1 \end{pmatrix} = \begin{pmatrix} 3 \\ 3 \end{pmatrix}$. Along $(1, -1)$ it leaves vectors unchanged: $A\begin{pmatrix} 1 \\ -1 \end{pmatrix} = \begin{pmatrix} 1 \\ -1 \end{pmatrix}$. Every other direction gets turned.`,
            },
            {
              type: 'explain',
              title: 'Eigenvectors and eigenvalues',
              body: r`A nonzero vector $\mathbf v$ is an **eigenvector** of $A$ if $A$ only stretches it:
$$A\mathbf v = \lambda\mathbf v$$
The stretch factor $\lambda$ is the **eigenvalue**. ("Eigen" is German for "own": these are the matrix's own directions.)

To find eigenvalues, rewrite this as $(A - \lambda I)\mathbf v = \mathbf 0$. A nonzero $\mathbf v$ can only be squashed to zero if $A - \lambda I$ squashes the plane, so its determinant must be 0:
$$\det(A - \lambda I) = 0$$
This is the **characteristic equation**.`,
            },
            {
              type: 'numeric',
              title: 'Compute eigenvalues',
              prompt: r`Find the eigenvalues of $\begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$. Enter the larger one.`,
              lhs: r`$\lambda =$`,
              answer: 5,
              wrong: [{ v: 2, why: 'That’s the smaller eigenvalue.' }, { v: 4, why: r`The eigenvalues aren't the diagonal entries (unless the matrix is triangular). Solve $(4 - \lambda)(3 - \lambda) - 2 = 0$.` }],
              explain: r`$(4 - \lambda)(3 - \lambda) - 1 \cdot 2 = \lambda^2 - 7\lambda + 10 = (\lambda - 5)(\lambda - 2) = 0$, so $\lambda = 5$ or $2$.

**Shortcut:** the eigenvalues add up to the **trace** ($4 + 3 = 7$) and multiply to the **determinant** ($12 - 2 = 10$).`,
            },
            {
              type: 'mcq',
              title: 'No special directions?',
              prompt: r`What are the real eigenvectors of a 90° rotation, $\begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$?`,
              choices: [
                { t: 'There are none', ok: true },
                { t: r`$(1, 0)$ and $(0, 1)$`, why: r`$(1, 0)$ is sent to $(0, 1)$: it's turned, not stretched.` },
                { t: 'Every vector', why: 'Every vector is turned 90°, so none stays on its own line.' },
              ],
              explain: r`A rotation turns **every** vector, so no direction is kept. The characteristic equation is $\lambda^2 + 1 = 0$, so $\lambda = \pm i$: the eigenvalues are complex. (Complex eigenvalues are the algebra's way of saying "rotation".)`,
            },
            {
              type: 'numeric',
              title: 'Trace and determinant',
              prompt: r`A $2 \times 2$ matrix has trace 6 and determinant 8. Its eigenvalues add up to the trace and multiply to the determinant. What is the larger eigenvalue?`,
              answer: 4,
              wrong: [{ v: 2, why: 'That’s the smaller one. Which two numbers add to 6 and multiply to 8?' }],
              explain: r`Two numbers that add to 6 and multiply to 8: **4** and 2. (Equivalently, they solve $\lambda^2 - 6\lambda + 8 = 0$.) You can find a matrix's eigenvalues from its trace and determinant alone, without knowing a single eigenvector.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Repeated application',
              prompt: r`$\mathbf v$ is an eigenvector of $A$ with eigenvalue 2. What is $A^{10}\mathbf v$, as a multiple of $\mathbf v$?`,
              lhs: r`$A^{10}\mathbf v = $`,
              unit: r`$\mathbf v$`,
              answer: 1024,
              wrong: [{ v: 20, why: r`Each application **multiplies** by 2, so it's $2^{10}$, not $2 \times 10$.` }, { v: 100, why: r`It's $2^{10}$, not $10^2$.` }],
              explain: r`Each application of $A$ just doubles $\mathbf v$, so ten applications give $2^{10}\mathbf v = 1024\,\mathbf v$. This is the superpower of eigenvectors: repeated matrix multiplication becomes simple powers of numbers.`,
            },
          ],
          recap: [
            r`An eigenvector keeps its line: $A\mathbf v = \lambda\mathbf v$.`,
            r`Eigenvalues solve $\det(A - \lambda I) = 0$. They sum to the trace and multiply to the determinant.`,
            r`$A^n\mathbf v = \lambda^n\mathbf v$: powers of a matrix become powers of numbers.`,
          ],
        },
        {
          id: 'applications',
          title: 'Eigenvectors at Work',
          summary: 'Populations, Fibonacci and PageRank',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Two towns',
              body: r`Every year, 10% of the people in town $\blue{A}$ move to town $\coral{B}$, and 20% of the people in $\coral{B}$ move to $\blue{A}$. Everyone starts in $A$: 1,000 people. The populations update by a matrix:
$$\begin{pmatrix} A \\ B \end{pmatrix}_{\text{next}} = \begin{pmatrix} 0.9 & 0.2 \\ 0.1 & 0.8 \end{pmatrix}\begin{pmatrix} A \\ B \end{pmatrix}$$
Move the slider to run the years forward.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 1050, grid: 5, gridY: 250, height: 320, padL: 58, axes: { xlabel: 'year', ylabel: 'people' },
                params: { n: { min: 0, max: 30, step: 1, value: 0, label: 'years', color: 'violet', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const data = markov(p.n);
                  const els = [];
                  data.forEach(([A, B], k) => {
                    els.push(s('circle', { cx: plot.X(k), cy: plot.Y(A), r: 5, class: 'fl-blue' }));
                    els.push(s('circle', { cx: plot.X(k), cy: plot.Y(B), r: 5, class: 'fl-coral' }));
                  });
                  return els;
                },
                readout: (p) => {
                  const [A, B] = markov(p.n)[p.n];
                  return r`year ${p.n}: $\blue{A = ${Math.round(A)}}$, $\coral{B = ${Math.round(B)}}$`;
                },
              },
              after: r`The populations settle down to about $\blue{667}$ and $\coral{333}$, and stay there.`,
            },
            {
              type: 'numeric',
              title: 'The steady state',
              prompt: r`At the steady state, the number moving $A \to B$ equals the number moving $B \to A$: $0.1A = 0.2B$. If 900 people live in the two towns, how many end up in $A$?`,
              lhs: r`$A =$`,
              answer: 600,
              wrong: [{ v: 300, why: r`$0.1A = 0.2B$ means $A = 2B$, so $A$ is the bigger town.` }, { v: 450, why: r`The towns don't split evenly: $A = 2B$.` }],
              explain: r`$A = 2B$ and $A + B = 900$, so $B = 300$ and $A = 600$. The steady state is an **eigenvector with eigenvalue 1**: the matrix maps it to itself. Its other eigenvalue is $0.7$, and the gap from the steady state shrinks by a factor of $0.7$ each year. That's why the curves settle so smoothly.`,
            },
            {
              type: 'explain',
              title: 'Fibonacci in a matrix',
              body: r`The Fibonacci numbers $1, 1, 2, 3, 5, 8, 13, \dots$ follow $F_{n+1} = F_n + F_{n-1}$. As a matrix:
$$\begin{pmatrix} F_{n+1} \\ F_n \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}\begin{pmatrix} F_n \\ F_{n-1} \end{pmatrix}$$
So the sequence is just this matrix applied over and over. In the long run, the eigenvector with the **largest** eigenvalue takes over: the sequence grows by that factor each step.`,
            },
            {
              type: 'numeric',
              title: 'The growth rate',
              prompt: r`Find the larger eigenvalue of $\begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}$. (3 decimal places.)`,
              lhs: r`$\lambda =$`,
              answer: (1 + Math.sqrt(5)) / 2,
              tol: 0.002,
              wrong: [{ v: (1 - Math.sqrt(5)) / 2, tol: 0.002, why: 'That’s the other eigenvalue: its size is less than 1, so it fades away.' }, { v: 2, why: r`Solve $\lambda^2 - \lambda - 1 = 0$ (the trace is 1 and the determinant is $-1$).` }],
              explain: r`$\det\begin{pmatrix} 1 - \lambda & 1 \\ 1 & -\lambda \end{pmatrix} = \lambda^2 - \lambda - 1 = 0$, so $\lambda = \dfrac{1 + \sqrt5}{2} \approx 1.618$: the **golden ratio** $\varphi$. That's why $F_{n+1}/F_n \to \varphi$: $13/8 = 1.625$, $21/13 \approx 1.615$, $34/21 \approx 1.619$…`,
            },
            {
              type: 'numeric',
              title: 'Growing populations',
              prompt: r`A Leslie matrix for an animal population has largest eigenvalue 1.1, so in the long run the population grows by 10% a year. How long does it take to double, in years? (1 decimal place.)`,
              unit: 'years',
              answer: Math.log(2) / Math.log(1.1),
              tol: 0.1,
              explain: r`$\frac{\ln 2}{\ln 1.1} \approx 7.3$ years. Whatever the starting age mix, the population settles into the eigenvector’s proportions and grows at the eigenvalue’s rate.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'PageRank',
              prompt: r`Google's original PageRank imagined a web surfer clicking links at random, like the people moving between towns. What did it use to rank pages?`,
              choices: [
                { t: 'The steady state: the long-run share of time spent on each page', ok: true },
                { t: 'How many words each page contains', why: 'PageRank ignores the text. It uses only the structure of links.' },
                { t: 'The page the surfer visits first', why: 'The starting page doesn’t matter in the long run. The steady state is the same wherever you start.' },
              ],
              explain: r`PageRank is the steady state of a random-surfer process over the web's link structure: an **eigenvector with eigenvalue 1** of an enormous matrix. Pages where the surfer tends to spend more time (because many important pages link to them) rank higher.`,
            },
          ],
          recap: [
            'A Markov chain settles into a steady state: an eigenvector with eigenvalue 1.',
            'Repeated multiplication is dominated by the largest eigenvalue.',
            r`Fibonacci grows by the golden ratio $\varphi \approx 1.618$, the largest eigenvalue of its matrix.`,
          ],
        },
      ],
    },
    {
      title: 'Approximation',
      summary: 'Least squares and the singular value decomposition.',
      lessons: [
        {
          id: 'leastsquares',
          title: 'Least Squares',
          summary: 'The best line through messy data',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Too many equations',
              prompt: r`You measure 8 points that should lie on a line $y = mx + b$, but measurements are noisy, so no line passes through them all. What's the sensible thing to do?`,
              choices: [
                { t: 'Find the line that comes closest overall, by minimising the total of the squared errors', ok: true },
                { t: 'Pick any two points and draw the line through them', why: 'Different pairs give different lines; using all the data averages out the noise.' },
                { t: 'Give up: the system has no solution', why: 'It has no exact solution, but a best approximate one is far more useful.' },
              ],
              explain: r`Eight equations, two unknowns: the system is **overdetermined**. Instead of an exact solution, find the line that minimises the sum of squared vertical errors (**residuals**). Gauss and Legendre developed this **method of least squares** around 1800 to predict the orbits of planets and comets from imperfect observations.`,
            },
            {
              type: 'interactive',
              title: 'Fit the line',
              body: r`Adjust the slope and intercept. The coral segments are the residuals; the readout gives the sum of their squares. Get it within 2% of the smallest possible value.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 7.5, ymin: 0, ymax: 5.5, grid: 1, height: 300, axes: { xlabel: 'x', ylabel: 'y' },
                params: {
                  m: { min: 0, max: 1, step: 0.01, value: 0.3, label: 'slope m', color: 'blue', format: (v) => v.toFixed(2) },
                  b: { min: 0, max: 3, step: 0.01, value: 2, label: 'intercept b', color: 'violet', format: (v) => v.toFixed(2) },
                },
                curves: [{ f: (x, p) => p.m * x + p.b, color: 'blue', width: 2.5 }],
                extra: ({ plot, p, s }) => LSQ.flatMap(([x, y]) => [s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(y), y2: plot.Y(p.m * x + p.b), stroke: 'var(--coral)', 'stroke-width': 2.5 }), s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5, class: 'fl-ink' })]),
                readout: (p) => `Sum of squared residuals: **${sse(p.m, p.b).toFixed(3)}** (best possible ${sse(LSQ_FIT.m, LSQ_FIT.b).toFixed(3)})`,
                goal: (p) => sse(p.m, p.b) <= 1.02 * sse(LSQ_FIT.m, LSQ_FIT.b),
                hint: 'Get the slope roughly right first by eye, then fine-tune the intercept, then the slope again.',
                solution: { m: Math.round(LSQ_FIT.m * 100) / 100, b: Math.round(LSQ_FIT.b * 100) / 100 },
              },
              explain: r`The best line is about $y = ${LSQ_FIT.m.toFixed(2)}x + ${LSQ_FIT.b.toFixed(2)}$. Squaring the residuals makes big misses count heavily and makes the best line easy to compute exactly: no trial and error needed, as the next step shows.`,
            },
            {
              type: 'explain',
              title: 'Least squares is a projection',
              body: r`Write the 8 equations as $A\mathbf{x} \approx \mathbf{b}$, with unknowns $\mathbf{x} = (m, b)$. The possible values of $A\mathbf{x}$ form a flat plane (the span of $A$'s columns) inside 8-dimensional space. The data vector $\mathbf b$ sticks out of that plane.

The closest point of the plane to $\mathbf b$ is the **perpendicular projection** of $\mathbf b$ onto it, just like the shadow of a stick on the ground. Perpendicular means the error is at right angles to every column of $A$, which gives the **normal equations**:
$$A^{\mathsf T}A\,\mathbf{x} = A^{\mathsf T}\mathbf{b}.$$
Two equations, two unknowns, solved exactly.`,
            },
            {
              type: 'numeric',
              title: 'A shadow',
              prompt: r`Project the vector $(3, 4)$ onto the line through the origin in the direction $(1, 1)$. What is the $x$-coordinate of the projection?`,
              answer: 3.5,
              wrong: [{ v: 7, why: r`The projection is $\frac{\mathbf a \cdot \mathbf d}{\mathbf d \cdot \mathbf d}\,\mathbf d = \frac{7}{2}(1, 1)$.` }, { v: 4.95, tol: 0.01, why: 'That’s the length of the projection. Its x-coordinate is 3.5.' }],
              hint: r`$\text{proj} = \frac{(3,4)\cdot(1,1)}{(1,1)\cdot(1,1)}(1, 1)$.`,
              explain: r`$\frac{7}{2}(1, 1) = (3.5, 3.5)$. The leftover, $(3, 4) - (3.5, 3.5) = (-0.5, 0.5)$, is perpendicular to $(1, 1)$, exactly the property least squares relies on.`,
            },
            {
              type: 'numeric',
              title: 'The simplest fit',
              prompt: r`Fit a **constant** $y = c$ to the data values 2, 4 and 9 by least squares (minimise $(2 - c)^2 + (4 - c)^2 + (9 - c)^2$). What is $c$?`,
              answer: 5,
              wrong: [{ v: 4, why: 'That’s the median, which minimises the sum of absolute errors. Squared errors are minimised by the mean.' }],
              explain: r`Setting the derivative to zero gives $3c = 2 + 4 + 9$, so $c = 5$: the **mean**. The average you've used since primary school is a least-squares fit. (The median minimises the sum of absolute errors instead, and is less swayed by outliers.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Slope by formula',
              prompt: r`For the three points $(0, 1)$, $(1, 3)$, $(2, 4)$, the least-squares slope is $m = \dfrac{\sum (x - \bar x)(y - \bar y)}{\sum (x - \bar x)^2}$. What is it?`,
              answer: 1.5,
              tol: 0.001,
              wrong: [{ v: 1, why: r`$\bar x = 1$, $\bar y = \frac83$: the top is $(-1)(-\frac53) + 0 + (1)(\frac43) = 3$, the bottom is 2.` }, { v: 3, why: r`Divide by $\sum(x - \bar x)^2 = 2$.` }],
              explain: r`Top: $(-1)(-\frac53) + (0)(\frac13) + (1)(\frac43) = 3$; bottom: $1 + 0 + 1 = 2$; so $m = 1.5$, and the line passes through the mean point $(1, \frac83)$, giving $b = \frac76$. Every spreadsheet's "trend line" does exactly this calculation.`,
            },
          ],
          recap: [
            'Least squares finds the best approximate solution of an overdetermined system.',
            'Geometrically it’s a perpendicular projection, giving the normal equations AᵀAx = Aᵀb.',
            'The mean is the least-squares constant; the regression line passes through the mean point.',
          ],
        },
        {
          id: 'svd',
          title: 'Compressing with the SVD',
          summary: 'A picture as a sum of simple layers',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A rank-one picture',
              body: r`A greyscale image of $n \times n$ pixels is a matrix of $n^2$ brightness values. A **rank-one** image is the product of a column $\mathbf u$ and a row $\mathbf v^{\mathsf T}$: pixel $(i, j)$ is $u_i v_j$, like a plaid pattern.`,
              prompt: r`How many numbers are needed to store a rank-one $100 \times 100$ image?`,
              answer: 200,
              wrong: [{ v: 10000, why: r`That's the full image. A rank-one image only needs $\mathbf u$ (100 numbers) and $\mathbf v$ (100 numbers).` }, { v: 100, why: 'You need both the column u and the row v.' }],
              explain: r`200 numbers instead of 10,000. Most images aren't rank one, but they can be built from a few rank-one layers: that's the idea behind the singular value decomposition.`,
            },
            {
              type: 'explain',
              title: 'The singular value decomposition',
              body: r`Every matrix $A$ can be written as a sum of rank-one layers, in order of importance:
$$A = \sigma_1 \mathbf u_1 \mathbf v_1^{\mathsf T} + \sigma_2 \mathbf u_2 \mathbf v_2^{\mathsf T} + \cdots, \qquad \sigma_1 \ge \sigma_2 \ge \cdots \ge 0.$$
The **singular values** $\sigma_i$ measure how much each layer contributes, and the $\mathbf u$'s and $\mathbf v$'s are perpendicular unit vectors. Keeping only the first $k$ layers gives the **best possible** rank-$k$ approximation (the Eckart–Young theorem, 1936).`,
            },
            {
              type: 'interactive',
              title: 'Rebuild the picture',
              body: r`The 20 × 20 picture on the right is rebuilt from its first $k$ SVD layers (the original is on the left). Find how few layers give an error below **10%**.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 42, ymin: 0, ymax: 21, grid: false, axes: false, maxWidth: 560,
                params: { k: { min: 1, max: 12, step: 1, value: 1, label: 'layers k', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const A = approx(p.k), els = [], w = plot.X(1) - plot.X(0) + 0.5;
                  const px = (ox, M) => M.forEach((row, rr) => row.forEach((v, c) => { const g = Math.round(255 * Math.max(0, Math.min(1, v))); els.push(s('rect', { x: plot.X(ox + c), y: plot.Y(20.5 - rr), width: w, height: w, fill: `rgb(${g},${g},${g})` })); }));
                  px(0.5, SMILE); px(21.5, A);
                  return els;
                },
                readout: (p) => `${p.k} layer${p.k > 1 ? 's' : ''}: storing ${p.k * 41} numbers instead of 400 · relative error **${(100 * relErr(p.k)).toFixed(1)}%**`,
                goal: (p) => relErr(p.k) < 0.1,
                hint: 'Add layers one at a time and watch the error fall.',
                solution: { k: 6 },
              },
              explain: r`Six layers (246 numbers instead of 400) already give an error under 10%, and the first layer alone captures the big bright disc. Real photos have much larger matrices, where keeping a few percent of the layers preserves most of the picture: the singular values usually fall off quickly, because natural images are full of structure.`,
            },
            {
              type: 'mcq',
              title: 'What a matrix does',
              prompt: r`Geometrically, the SVD says every $2 \times 2$ matrix acts on the plane in three steps. Which?`,
              choices: [
                { t: 'Rotate (or reflect), stretch along the axes by the singular values, then rotate (or reflect) again', ok: true },
                { t: 'Stretch, then shear, then translate', why: 'Matrices never translate (they fix the origin), and the SVD needs no shear: rotations plus axis stretches suffice.' },
                { t: 'Only stretch along the eigenvectors', why: 'That works only for special (symmetric) matrices. The SVD works for every matrix.' },
              ],
              explain: r`$A = U\Sigma V^{\mathsf T}$: rotate by $V^{\mathsf T}$, stretch by $\Sigma$ (the singular values), rotate by $U$. So every matrix turns the unit circle into an ellipse whose semi-axes are the singular values. Unlike eigenvectors, the SVD always exists, even for non-square matrices.`,
            },
            {
              type: 'numeric',
              title: 'Ellipse area',
              prompt: r`A matrix turns the unit circle into an ellipse with semi-axes 3 and 1.5 (its singular values). What is the absolute value of its determinant?`,
              answer: 4.5,
              wrong: [{ v: 4.5 * Math.PI, tol: 0.01, why: r`The determinant is the area **scale factor**: the ellipse's area $\pi \times 3 \times 1.5$ divided by the circle's area $\pi$.` }, { v: 4.5 / 2, tol: 0.01, why: 'Multiply the singular values: 3 × 1.5.' }],
              explain: r`$|\det A| = \sigma_1 \sigma_2 = 4.5$: the area scale factor. The unit circle (area $\pi$) becomes an ellipse of area $4.5\pi$. Rotations don't change area, so only the stretches count.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Netflix Prize',
              prompt: r`Netflix once offered a million dollars for better film recommendations. Its data was a giant matrix of users × films, mostly empty (each person rates only a few films). Why did low-rank approximations work so well?`,
              choices: [
                { t: 'Tastes are driven by a few hidden factors (genre, mood, era…), so the full matrix is close to low rank and the gaps can be filled in', ok: true },
                { t: 'Because every user likes the same films', why: 'People differ, but along a fairly small number of dimensions, which is exactly what low rank captures.' },
                { t: 'Because the matrix was small', why: 'It had about 500,000 users and 18,000 films. Low rank made it tractable.' },
              ],
              explain: r`If tastes depend on maybe 50 hidden factors, the ratings matrix is approximately rank 50: each user is a mix of factors and each film scores on them. Fitting such a low-rank model to the known ratings predicts the missing ones. The winning team in 2009 relied heavily on these matrix factorisation methods, which now drive recommendations everywhere.`,
            },
          ],
          recap: [
            'The SVD writes any matrix as a sum of rank-one layers ranked by singular values.',
            'Keeping the top k layers gives the best rank-k approximation: compression.',
            'Geometrically: rotate, stretch along axes by the singular values, rotate again.',
          ],
        },
      ],
    },
  ],
};
