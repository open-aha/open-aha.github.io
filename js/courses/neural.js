import { fix } from '../lib/svg.js';

const r = String.raw;

// ---- perceptron data (blue = class 1, coral = class 0)
const BLUE = [[1, 4], [2, 5], [1.5, 3], [3, 4.5], [0.5, 2.5]];
const CORAL = [[3, 1], [4, 2.5], [5, 1.5], [4.5, 3.5], [2.5, 0.5]];
const score = (p, [x, y]) => p.w1 * x + p.w2 * y + p.b;
const wrongCount = (p) => BLUE.filter((q) => score(p, q) <= 0).length + CORAL.filter((q) => score(p, q) > 0).length;
// clip the box [0,6]² to the half-plane score ≥ 0
const halfPlane = (p) => {
  let poly = [[0, 0], [6, 0], [6, 6], [0, 6]];
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], sa = score(p, a), sb = score(p, b);
    if (sa >= 0) out.push(a);
    if ((sa >= 0) !== (sb >= 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
};

// ---- gradient descent on L(w) = (w − 3)²
const L = (w) => (w - 3) ** 2;
const iterates = (eta, n = 6) => {
  const ws = [0];
  for (let i = 0; i < n; i++) ws.push(ws[i] - eta * 2 * (ws[i] - 3));
  return ws;
};

// ---- overfitting: least-squares polynomial fits
const truef = (x) => 1 + 0.5 * x + 0.8 * Math.sin(x * 0.9);
const TRAIN = [0.4, -0.5, 0.45, -0.55, 0.3, 0.5, -0.45, 0.2].map((n, i) => [i, truef(i) + n]);
const TEST = [-0.3, 0.35, -0.2, 0.4, -0.35, 0.25, -0.4].map((n, i) => [i + 0.5, truef(i + 0.5) + n]);
const U = (x) => (x - 3.5) / 3.5;
const FITS = {};
const fit = (deg) => {
  if (FITS[deg]) return FITS[deg];
  const n = deg + 1, A = Array.from({ length: n }, () => Array(n + 1).fill(0));
  for (const [x, y] of TRAIN) {
    const pw = Array.from({ length: n }, (_, k) => U(x) ** k);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += pw[i] * pw[j];
      A[i][n] += pw[i] * y;
    }
  }
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let rr = c + 1; rr < n; rr++) if (Math.abs(A[rr][c]) > Math.abs(A[piv][c])) piv = rr;
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let rr = 0; rr < n; rr++) if (rr !== c) {
      const f = A[rr][c] / A[c][c];
      for (let k = c; k <= n; k++) A[rr][k] -= f * A[c][k];
    }
  }
  const co = A.map((row, i) => row[n] / row[i]);
  return (FITS[deg] = (x) => co.reduce((s, c, k) => s + c * U(x) ** k, 0));
};
const rms = (f, pts) => Math.sqrt(pts.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / pts.length);

// perceptron learning: weights after each correction, cycling through the points (rate 0.1)
const PERC = (() => {
  const data = [];
  BLUE.forEach((b, i) => data.push([b, 1], [CORAL[i], -1]));
  let w = [0, 0, 0];
  const hist = [w];
  for (let ep = 0; ep < 50 && hist.length < 100; ep++) {
    for (const [[x, y], l] of data) if (l * (w[0] * x + w[1] * y + w[2]) <= 0) { w = [w[0] + 0.1 * l * x, w[1] + 0.1 * l * y, w[2] + 0.1 * l]; hist.push(w); }
    if (data.every(([[x, y], l]) => l * (w[0] * x + w[1] * y + w[2]) > 0)) break;
  }
  return hist;
})();
const sig = (z) => 1 / (1 + Math.exp(-z));
const relu = (z) => Math.max(0, z);
const tent = (x) => Math.max(0, 1 - Math.abs(x - 1));
// convolution demo: a 10 × 10 image of a square, and four 3 × 3 filters
const IMG = Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => (r >= 2 && r <= 7 && c >= 3 && c <= 6 ? 1 : 0)));
const KERNELS = [
  ['blur', [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((row) => row.map((v) => v / 9))],
  ['vertical edges', [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]],
  ['horizontal edges', [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]],
  ['sharpen', [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]],
];
const conv = (K) => Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => { let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += K[i][j] * IMG[r + i][c + j]; return s; }));

// loss L = (x² + 25y²)/2, a long narrow valley; plain steps and momentum (β = 0.7), both with learning rate 0.07
const VALLEY_RUNS = (() => {
  const eta = 0.07, beta = 0.7, P = [[-9, 1.6]], M = [[-9, 1.6]];
  let v = [0, 0];
  for (let n = 0; n < 40; n++) {
    const [x, y] = P[n];
    P.push([x - eta * x, y - eta * 25 * y]);
    const [a, b] = M[n];
    v = [beta * v[0] - eta * a, beta * v[1] - eta * 25 * b];
    M.push([a + v[0], b + v[1]]);
  }
  return { P, M };
})();
const valleyLoss = ([x, y]) => (x * x + 25 * y * y) / 2;

export default {
  id: 'neural',
  subject: 'math',
  title: 'Neural Networks',
  level: 'Advanced',
  cover: 'neural',
  tagline: 'Build artificial neurons, connect them into networks, and see how they learn and see.',
  description: r`Neural networks power image recognition, translation and chatbots, but underneath they're built from simple maths: weighted sums, a bend, and calculus. Build a neuron that separates data with a line, see why layers are needed, train a model with gradient descent and the chain rule, learn the danger of overfitting, build curves from ReLU kinks, and see how convolutional networks detect edges.`,
  prereq: 'Multivariable Calculus',
  chapters: [
    {
      title: 'Neurons and Networks',
      summary: 'From one neuron to many.',
      lessons: [
        {
          id: 'neuron',
          title: 'An Artificial Neuron',
          summary: 'Weighted sums and activation',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'A cartoon of a brain cell',
              body: r`In 1943, Warren McCulloch and Walter Pitts proposed a simple mathematical model of a brain cell. A modern artificial neuron:

1. Takes inputs $x_1, x_2, \dots$
2. Multiplies each by a **weight** $w_i$ (how much that input matters) and adds a **bias** $b$:
$$z = w_1 x_1 + w_2 x_2 + \dots + b$$
3. Passes $z$ through an **activation function**, which bends the output.

A common activation is the **sigmoid**, $\sigma(z) = \dfrac{1}{1 + e^{-z}}$, which squashes any number into the range 0 to 1. Another, very popular today, is the **ReLU**: $\max(0, z)$.`,
            },
            {
              type: 'numeric',
              title: 'Weighted sum',
              prompt: r`A neuron has weights $w_1 = 2$, $w_2 = -1$ and bias $b = 0.5$. The inputs are $x_1 = 3$ and $x_2 = 4$. What is $z$?`,
              answer: 2.5,
              wrong: [{ v: 2, why: 'Don’t forget to add the bias, 0.5.' }, { v: 10.5, why: r`The second weight is $-1$: $2 \times 3 + (-1) \times 4 + 0.5$.` }],
              explain: r`$z = 2 \times 3 + (-1) \times 4 + 0.5 = 6 - 4 + 0.5 = 2.5$.`,
            },
            {
              type: 'numeric',
              title: 'Through the sigmoid',
              prompt: r`What is $\sigma(z)$ for $z = 0$?`,
              answer: 0.5,
              wrong: [{ v: 0, why: r`$e^0 = 1$, so $\sigma(0) = \frac{1}{1 + 1}$.` }, { v: 1, why: r`$\sigma(0) = \frac{1}{1 + e^0} = \frac12$.` }],
              explain: r`$\sigma(0) = \frac{1}{1 + 1} = 0.5$: right on the fence. Large positive $z$ gives outputs near 1, large negative $z$ near 0. A neuron can be read as "how confident am I that the answer is yes?".`,
            },
            {
              type: 'interactive',
              title: 'A soft switch',
              body: r`A one-input neuron outputs $\sigma(wx + b)$. Make it act like a switch that turns on **sharply** at $x = 2$: nearly 0 below 2, nearly 1 above.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 6, ymin: -0.1, ymax: 1.15, grid: false, height: 260, axes: { xlabel: 'x', ylabel: 'output', xticks: 1, yticks: 0.5 },
                params: {
                  w: { min: 0.2, max: 10, step: 0.1, value: 1, label: 'weight w', color: 'blue', format: (v) => v.toFixed(1) },
                  b: { min: -20, max: 10, step: 0.5, value: 0, label: 'bias b', color: 'amber', format: (v) => v.toFixed(1) },
                },
                curves: [{ f: (x, p) => sig(p.w * x + p.b), color: 'violet', width: 3, n: 400 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(2), x2: plot.X(2), y1: plot.Y(-0.1), y2: plot.Y(1.15), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' })],
                readout: (p) => `Switches at $x = ${(-p.b / p.w).toFixed(2)}$ · output at $x = 1.5$: **${sig(p.w * 1.5 + p.b).toFixed(3)}**, at $x = 2.5$: **${sig(p.w * 2.5 + p.b).toFixed(3)}**`,
                goal: (p) => Math.abs(-p.b / p.w - 2) < 0.05 && sig(p.w * 1.5 + p.b) < 0.05 && sig(p.w * 2.5 + p.b) > 0.95,
                hint: r`The switch point is where $wx + b = 0$, at $x = -b/w$. A bigger weight makes the switch steeper.`,
                solution: { w: 8, b: -16 },
              },
              explain: r`The output crosses $\frac12$ where $wx + b = 0$, at $x = -\frac{b}{w}$, so set $b = -2w$. The weight controls the sharpness: with $w = 8$, $b = -16$, the neuron goes from 0.02 to 0.98 between $x = 1.5$ and $2.5$. The bias moves the switch; the weight sets how decisive it is.`,
            },
            {
              type: 'mcq',
              title: 'Why not stay linear?',
              prompt: r`Why do neural networks need a nonlinear activation such as the sigmoid or ReLU?`,
              choices: [
                { t: r`Without it, any stack of layers collapses into a single linear function, which can only draw straight-line boundaries`, ok: true },
                { t: r`It makes the computation faster`, why: r`Linear layers alone would be faster; the nonlinearity is there for expressive power.` },
                { t: r`It keeps the weights small`, why: r`That’s the job of regularisation; activations provide nonlinearity.` },
              ],
              explain: r`Composing linear maps gives another linear map, so a hundred linear layers are no more powerful than one. The kinks and curves of the activation functions are what let deep networks model complicated patterns.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'ReLU',
              prompt: r`The ReLU activation is $\max(0, z)$. What does a ReLU neuron output when $z = -3$, and when $z = 2$?`,
              cols: 2,
              choices: [
                { t: '0 and 2', ok: true },
                { t: '−3 and 2', why: 'ReLU replaces every negative input with 0.' },
                { t: '3 and 2', why: 'ReLU doesn’t take absolute values: negatives become 0.' },
                { t: '0 and 1', why: 'Unlike the sigmoid, ReLU doesn’t squash positive values: it passes them through unchanged.' },
              ],
              explain: r`ReLU is 0 for negative inputs and the identity for positive ones. It's simple to compute, and its slope is 1 wherever it's active, which helps gradients flow through deep networks. Since about 2011 it has been the default choice in most networks.`,
            },
          ],
          recap: [
            r`A neuron computes a weighted sum plus bias: $z = \sum w_i x_i + b$.`,
            'An activation function (sigmoid, ReLU) bends the result.',
            r`Sigmoid: $\sigma(z) = 1/(1 + e^{-z})$, with $\sigma(0) = 0.5$.`,
          ],
        },
        {
          id: 'perceptron',
          title: 'Drawing a Line',
          summary: 'A neuron as a classifier',
          icon: 'pencil',
          steps: [
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Separate the dots',
              prompt: r`A neuron says "blue" when $w_1 x + w_2 y + b > 0$, and "coral" otherwise. The boundary is the line where this equals zero; the shaded side is "blue". Adjust the weights and bias until every point is classified correctly.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 6, grid: 1, equal: true, maxWidth: 360, axes: { xlabel: 'x', ylabel: 'y' },
                params: {
                  w1: { min: -2, max: 2, step: 0.1, value: 1, label: r`$w_1$`, color: 'blue', format: (v) => v.toFixed(1) },
                  w2: { min: -2, max: 2, step: 0.1, value: 1, label: r`$w_2$`, color: 'violet', format: (v) => v.toFixed(1) },
                  b: { min: -5, max: 5, step: 0.5, value: -4, label: r`$b$`, color: 'amber', format: (v) => v.toFixed(1) },
                },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  const hp = halfPlane(p);
                  if (hp.length > 2) els.push(s('path', { d: hp.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(' ') + ' Z', class: 'fl-blue-soft', opacity: 0.7 }));
                  for (const [pts, cls] of [[BLUE, 'blue'], [CORAL, 'coral']]) {
                    for (const q of pts) {
                      const ok = cls === 'blue' ? score(p, q) > 0 : score(p, q) <= 0;
                      els.push(s('circle', { cx: plot.X(q[0]), cy: plot.Y(q[1]), r: 9, class: `fl-${cls}`, stroke: ok ? 'var(--card)' : 'var(--ink)', 'stroke-width': ok ? 2 : 3.5 }));
                      if (!ok) els.push(s('text', { x: plot.X(q[0]) + 11, y: plot.Y(q[1]) - 9, class: 'lbl', text: '✗' }));
                    }
                  }
                  return els;
                },
                readout: (p) => {
                  const k = wrongCount(p);
                  return k ? `misclassified points: **${k}**` : 'All 10 points classified correctly!';
                },
                goal: (p) => wrongCount(p) === 0,
                hint: r`The blue points lie above the line $y = x$. Try $w_1 = -1$, $w_2 = 1$, and adjust $b$.`,
                solution: { w1: -1, w2: 1, b: 0 },
              },
              explain: r`With $w_1 = -1$, $w_2 = 1$, $b = 0$, the neuron computes $y - x$: positive (blue) above the line $y = x$. Frank Rosenblatt's **perceptron** (1958) learned such weights automatically by nudging them after each mistake.`,
            },
            {
              type: 'interactive',
              title: 'Watch it learn',
              body: r`The **perceptron learning rule**: go through the points one by one; whenever a point is misclassified, nudge the weights towards getting it right ($w \leftarrow w + 0.1 \times \text{label} \times \text{input}$, with label $+1$ for blue and $-1$ for coral). Starting from all weights zero, step through the corrections until every point is right.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 6, grid: 1, equal: true, maxWidth: 360, axes: { xlabel: 'x', ylabel: 'y' },
                params: { k: { min: 0, max: PERC.length - 1, step: 1, value: 0, label: 'corrections', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const [w1, w2, b] = PERC[p.k], q = { w1, w2, b }, els = [];
                  const hp = halfPlane(q);
                  if (hp.length > 2) els.push(s('path', { d: hp.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(' ') + ' Z', class: 'fl-blue-soft', opacity: 0.7 }));
                  for (const [pts, cls] of [[BLUE, 'blue'], [CORAL, 'coral']]) for (const pt of pts) {
                    const ok = cls === 'blue' ? score(q, pt) > 0 : score(q, pt) <= 0;
                    els.push(s('circle', { cx: plot.X(pt[0]), cy: plot.Y(pt[1]), r: 9, class: `fl-${cls}`, stroke: ok ? 'var(--card)' : 'var(--ink)', 'stroke-width': ok ? 2 : 3.5 }));
                  }
                  return els;
                },
                readout: (p) => { const [w1, w2, b] = PERC[p.k]; const k = wrongCount({ w1, w2, b }); return `$w_1 = ${w1.toFixed(1)}$, $w_2 = ${w2.toFixed(1)}$, $b = ${b.toFixed(1)}$ · misclassified: **${k}**`; },
                goal: (p) => { const [w1, w2, b] = PERC[p.k]; return wrongCount({ w1, w2, b }) === 0; },
                hint: 'Keep stepping: progress isn’t steady, but it gets there.',
                solution: { k: PERC.length - 1 },
              },
              explain: r`After 15 corrections every point is right. Progress isn't steady (fixing one point can break another), but Rosenblatt's **perceptron convergence theorem** guarantees that if some line separates the classes, the rule finds one after finitely many corrections.`,
            },
            {
              type: 'numeric',
              title: 'One correction by hand',
              prompt: r`Weights are $w_1 = 0.2$, $w_2 = -0.1$, $b = 0$. The blue point $(1, 4)$ (label $+1$) is misclassified. After one correction with rate 0.1, what is the new $w_2$?`,
              answer: 0.3,
              tol: 0.001,
              wrong: [{ v: -0.5, tol: 0.001, why: r`For a blue point (label $+1$) you **add**: $w_2 + 0.1 \times 1 \times 4$.` }, { v: 0, tol: 0.001, why: r`The input $y = 4$ multiplies the step: $-0.1 + 0.1 \times 4$.` }],
              explain: r`$w_2 \leftarrow -0.1 + 0.1 \times (+1) \times 4 = 0.3$ (and $w_1 \leftarrow 0.3$, $b \leftarrow 0.1$). Now $0.3 + 1.2 + 0.1 = 1.6 > 0$: the point is classified blue.`,
            },
            {
              type: 'mcq',
              title: 'The XOR problem',
              prompt: r`Four points: $(0,0)$ and $(1,1)$ are coral; $(0,1)$ and $(1,0)$ are blue. (This is the XOR pattern: blue when exactly one input is 1.) Can a single neuron classify them?`,
              choices: [
                { t: 'No: no single straight line separates the blues from the corals', ok: true },
                { t: 'Yes, with the right weights', why: 'Try it: any line that puts both blues on one side also catches a coral. They sit on opposite corners of a square.' },
                { t: 'Yes, if the bias is large enough', why: 'The bias just shifts the line. No line separates diagonal corners.' },
              ],
              explain: r`A single neuron draws one straight boundary, and XOR isn't **linearly separable**. Marvin Minsky and Seymour Papert highlighted limitations like this in their 1969 book *Perceptrons*, and interest in neural networks cooled for years. The fix is to stack neurons in **layers**.`,
            },
            {
              type: 'numeric',
              title: 'Counting weights',
              prompt: r`A perceptron classifies 28 × 28 pixel images, with one weight per pixel plus a bias. How many numbers does it learn?`,
              answer: 785,
              explain: r`$28 \times 28 = 784$ weights plus 1 bias: 785. Modern image networks have millions or billions of parameters, but each neuron still computes a weighted sum like this one.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Which side?',
              prompt: r`A perceptron has weights $w = (2, -1)$ and bias $b = -1$. For the input $(2, 1)$, what is the weighted sum $w \cdot x + b$? (It outputs 1 if the sum is positive.)`,
              answer: 2,
              explain: r`$2 \times 2 + (-1) \times 1 - 1 = 2 > 0$, so it outputs **1**. The boundary $2x_1 - x_2 - 1 = 0$ is a straight line: a single perceptron can only ever separate classes with a line, which is why XOR defeats it.`,
            },
          ],
          recap: [
            'A single neuron with a threshold divides the plane with a straight line.',
            'The perceptron (1958) learns the line from examples.',
            'XOR can’t be separated by one line, so a single neuron can’t learn it.',
          ],
        },
        {
          id: 'layers',
          title: 'Layers',
          summary: 'Solving XOR with a hidden layer',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'A hidden layer',
              body: r`Use neurons that output 1 if $z > 0$ and 0 otherwise. Two **hidden** neurons look at the inputs:

- $h_1$: $z = x_1 + x_2 - 0.5$ (fires if **at least one** input is 1: OR)
- $h_2$: $z = -x_1 - x_2 + 1.5$ (fires unless **both** are 1: NAND)

An **output** neuron combines them: $z = h_1 + h_2 - 1.5$ (fires only if **both** $h_1$ and $h_2$ fire: AND).

Each hidden neuron draws its own line; the output neuron combines the two half-planes into a strip.`,
            },
            {
              type: 'numeric',
              title: 'Trace the network',
              prompt: r`Feed in $x_1 = 1$, $x_2 = 1$. What does the output neuron give (0 or 1)?`,
              answer: 0,
              wrong: [{ v: 1, why: r`$h_1$: $1 + 1 - 0.5 > 0$, so $h_1 = 1$. $h_2$: $-2 + 1.5 < 0$, so $h_2 = 0$. Output: $1 + 0 - 1.5 < 0$.` }],
              explain: r`$h_1 = 1$ (OR is true), $h_2 = 0$ (NAND is false), so the output is $1 + 0 - 1.5 = -0.5 \le 0$: **0**. Just as XOR requires: both inputs are 1, so "exactly one" is false.`,
            },
            {
              type: 'numeric',
              title: 'Counting parameters',
              prompt: r`A network has 2 inputs, a hidden layer of 3 neurons, and 1 output neuron. Every neuron is connected to every neuron in the layer before, and each neuron has its own bias. How many weights and biases are there in total?`,
              answer: 13,
              wrong: [{ v: 9, why: 'That’s just the weights (2 × 3 + 3 × 1). Add one bias per neuron: 4 more.' }, { v: 6, why: 'Count the hidden-to-output connections too, and the biases.' }],
              explain: r`Weights: $2 \times 3 + 3 \times 1 = 9$. Biases: $3 + 1 = 4$. Total 13. Modern language models have hundreds of billions of these numbers, all adjusted by training.`,
            },
            {
              type: 'numeric',
              title: 'Exactly one',
              prompt: r`Feed the XOR network $x_1 = 1$, $x_2 = 0$. Work out $h_1$ and $h_2$ (each 0 or 1), then the output neuron's weighted sum $z = h_1 + h_2 - 1.5$. What is $z$?`,
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: -0.5, tol: 0.001, why: r`Check $h_2$: $-1 - 0 + 1.5 = 0.5 > 0$, so NAND fires. Both hidden neurons are on.` }, { v: -1.5, tol: 0.001, why: r`Check $h_1$: $1 + 0 - 0.5 = 0.5 > 0$, so OR fires.` }],
              explain: r`$h_1$: $1 + 0 - 0.5 = 0.5 > 0$, so 1. $h_2$: $-1 - 0 + 1.5 = 0.5 > 0$, so 1. Output: $z = 1 + 1 - 1.5 = 0.5 > 0$, so the network says **1**: exactly one input is on. The threshold "bends" in the hidden neurons are what make this possible; without them the layers would collapse into one straight line.`,
            },
            {
              type: 'interactive',
              title: 'Two bends make a V',
              body: r`A hidden layer of two ReLU neurons (each outputs $\max(0, wx)$) feeds an output that adds them. Each neuron contributes one bent line. Choose the weights so the network computes $|x|$ (dashed).`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 3, ymin: -1, ymax: 4, grid: false, height: 260, axes: { xlabel: 'x', ylabel: 'output', xticks: 1, yticks: 1 },
                params: { w1: { min: -2, max: 2, step: 0.5, value: 0.5, label: 'neuron 1 weight', color: 'coral', format: (v) => v.toFixed(1) }, w2: { min: -2, max: 2, step: 0.5, value: 2, label: 'neuron 2 weight', color: 'blue', format: (v) => v.toFixed(1) } },
                curves: [{ f: (x) => Math.abs(x), color: 'muted', dash: true, width: 3 }, { f: (x, p) => Math.max(0, p.w1 * x), color: 'coral', width: 1.5 }, { f: (x, p) => Math.max(0, p.w2 * x), color: 'blue', width: 1.5 }, { f: (x, p) => Math.max(0, p.w1 * x) + Math.max(0, p.w2 * x), color: 'violet', width: 3.5 }],
                readout: (p) => `network output at x = −2: **${(Math.max(0, -2 * p.w1) + Math.max(0, -2 * p.w2)).toFixed(1)}** · at x = 2: **${(Math.max(0, 2 * p.w1) + Math.max(0, 2 * p.w2)).toFixed(1)}** (target 2 and 2)`,
                goal: (p) => (p.w1 === 1 && p.w2 === -1) || (p.w1 === -1 && p.w2 === 1),
                hint: 'One neuron should handle the right half (slope +1), the other the left half.',
                solution: { w1: 1, w2: -1 },
              },
              explain: r`$\max(0, x) + \max(0, -x) = |x|$. Each ReLU neuron adds one bend; with enough of them, the sum can approximate any continuous curve. That is the idea behind the universal approximation theorem.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How powerful?',
              prompt: r`What can a network with one hidden layer (using a bendy activation such as the sigmoid) do, given enough hidden neurons?`,
              choices: [
                { t: 'Approximate any continuous function on a bounded region as closely as you like', ok: true },
                { t: 'Only draw straight-line boundaries', why: 'That’s a single neuron. Hidden layers combine many lines into curved boundaries.' },
                { t: 'Compute anything, including uncomputable functions', why: 'Networks are ordinary computations. They can’t escape the limits of computability.' },
              ],
              explain: r`This is the **universal approximation theorem** (George Cybenko, 1989, and others). It says a suitable network **exists**, but not how big it must be or how to find its weights. In practice, **deep** networks with many layers learn far more efficiently, and finding the weights is the job of training.`,
            },
          ],
          recap: [
            'Hidden layers let networks combine simple boundaries into complex ones.',
            'Two hidden neurons (OR and NAND) plus an AND output compute XOR.',
            'With enough neurons, networks can approximate any continuous function.',
          ],
        },
      ],
    },
    {
      title: 'Learning',
      summary: 'How networks find their weights.',
      lessons: [
        {
          id: 'descent',
          title: 'Gradient Descent',
          summary: 'Rolling downhill',
          icon: 'down',
          steps: [
            {
              type: 'explain',
              title: 'Measuring wrongness',
              body: r`To train a network, first measure how wrong it is with a **loss function**: for example, the average of (prediction − correct answer)² over the training examples. Training means finding weights that make the loss small.

**Gradient descent** repeatedly nudges each weight a little in the direction that reduces the loss fastest:
$$w \leftarrow w - \eta\,\frac{\partial L}{\partial w}$$
The **learning rate** $\eta$ sets the size of each step.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose a learning rate',
              prompt: r`Here a single weight $w$ has loss $L(w) = (w - 3)^2$, so the best value is $w = 3$. Starting from $w = 0$, the dots show six steps of gradient descent. Find the learning rate that reaches $w = 3$ in a **single step**.`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 8, ymin: 0, ymax: 12, grid: 1, gridY: 2, height: 300, axes: { xlabel: 'w', ylabel: 'loss', xAt: -2 },
                params: { eta: { min: 0.05, max: 1.05, step: 0.05, value: 0.1, label: r`learning rate $\eta$`, color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (w) => L(w), color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const ws = iterates(p.eta);
                  const inside = (w) => w >= -2 && w <= 8 && L(w) <= 12;
                  const els = [];
                  for (let i = 0; i + 1 < ws.length; i++) {
                    if (!inside(ws[i]) || !inside(ws[i + 1])) break;
                    els.push(s('line', { x1: plot.X(ws[i]), y1: plot.Y(L(ws[i])), x2: plot.X(ws[i + 1]), y2: plot.Y(L(ws[i + 1])), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
                  }
                  ws.forEach((w, i) => { if (inside(w)) els.push(s('circle', { cx: plot.X(w), cy: plot.Y(L(w)), r: i ? 6 : 8, class: i ? 'fl-coral' : 'fl-ink' })); });
                  return els;
                },
                readout: (p) => {
                  const ws = iterates(p.eta);
                  const f = 1 - 2 * p.eta;
                  const tag = Math.abs(f) < 1e-9 ? 'straight to the minimum' : f > 0 ? 'creeping towards 3' : Math.abs(f) < 1 ? 'overshooting back and forth, but converging' : 'overshooting more each time: **diverging**';
                  return r`after 6 steps: $w = ${ws[6].toFixed(3)}$ (${tag})`;
                },
                goal: (p) => Math.abs(p.eta - 0.5) < 1e-6,
                hint: r`Each step multiplies the distance from 3 by $(1 - 2\eta)$. When is that zero?`,
                solution: { eta: 0.5 },
              },
              explain: r`The update is $w \leftarrow w - 2\eta(w - 3)$, so the distance to 3 is multiplied by $1 - 2\eta$ each step. At $\eta = 0.5$ that's zero: one perfect step. Smaller rates creep; rates between 0.5 and 1 overshoot but settle; above 1 the steps grow and training **diverges**. Real networks have millions of weights and bumpy loss landscapes, so picking the learning rate is a genuine art.`,
            },
            {
              type: 'numeric',
              title: 'One small step',
              prompt: r`For $L(w) = (w - 3)^2$, the slope is $2(w - 3)$. Starting at $w = 0$ with learning rate $\eta = 0.1$, what is $w$ after one step?`,
              answer: 0.6,
              tol: 0.001,
              wrong: [{ v: -0.6, tol: 0.001, why: r`The slope at 0 is $-6$, and subtracting $\eta \times (-6)$ **adds** 0.6.` }, { v: 6, why: r`Multiply the slope by $\eta = 0.1$: the step is 0.6.` }],
              explain: r`Slope at 0: $2(0 - 3) = -6$. Step: $w = 0 - 0.1 \times (-6) = 0.6$. Each step closes 20% of the remaining gap to 3, so the steps shrink as the minimum approaches.`,
            },
            {
              type: 'numeric',
              title: 'Too big a step',
              prompt: r`Minimising $f(x) = x^2$ by gradient descent, each step is $x \leftarrow x - \eta \cdot 2x = (1 - 2\eta)x$. With learning rate $\eta = 1.1$, by what factor is $x$ multiplied each step?`,
              answer: 1 - 2 * 1.1,
              tol: 0.01,
              wrong: [{ v: 1.2, tol: 0.01, why: r`Check the sign: $1 - 2.2$ is negative, so $x$ flips sides each step.` }],
              explain: r`$1 - 2.2 = -1.2$: each step overshoots to the other side and lands 20% farther away, so the "descent" spirals outward and diverges. Any $\eta > 1$ fails here; $\eta = 0.5$ would jump straight to the minimum in one step.`,
            },
            { /*anim:neural*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A ball with momentum',
              body: r`Real loss landscapes often have long, narrow valleys. Here the loss is $L = \frac12(x^2 + 25y^2)$, steep across the valley and gentle along it, with the minimum at the dot. {coral:Plain gradient descent} and {teal:gradient descent with momentum} start from the same place with the same learning rate.`,
              widget: {
                kind: 'graph', xmin: -10, xmax: 1.5, ymin: -2.2, ymax: 2.2, grid: false, axes: false, height: 340, pad: 16, maxWidth: 640, clipExtra: true,
                animate: { param: 't', speed: 4, max: 46, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { P, M } = VALLEY_RUNS, n = Math.min(40, Math.floor(p.t)), els = [];
                  for (const c of [0.5, 2, 6, 14, 26, 42]) {
                    const a = Math.sqrt(2 * c), b = Math.sqrt((2 * c) / 25);
                    els.push(s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: plot.X(a) - plot.X(0), ry: plot.Y(0) - plot.Y(b), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.3 }));
                  }
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 4, class: 'fl-ink' }));
                  for (const [pts, col] of [[P, 'coral'], [M, 'teal']]) {
                    els.push(s('path', { d: pts.slice(0, n + 1).map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${col})`, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
                    els.push(s('circle', { cx: plot.X(pts[n][0]), cy: plot.Y(pts[n][1]), r: 6, class: `fl-${col}` }));
                  }
                  return els;
                },
                readout: (p) => { const { P, M } = VALLEY_RUNS, n = Math.min(40, Math.floor(p.t)); return `step ${n} · loss: {coral:plain ${fix(valleyLoss(P[n]), 3)}} · {teal:momentum ${fix(valleyLoss(M[n]), 3)}}`; },
              },
              after: r`Plain descent bounces from wall to wall, because the steep direction dominates the gradient, and then creeps along the valley floor: after 40 steps it still hasn't arrived. Momentum keeps a running sum of past steps: the side-to-side parts cancel out while the steady push along the valley builds up, like a heavy ball rolling downhill. It gets to the bottom in about 20 steps. Most networks are trained with some form of momentum (the popular **Adam** optimiser uses it too).`,
            },
            {
              type: 'mcq',
              title: 'Stuck in a valley?',
              prompt: r`In a network with millions of weights, why does gradient descent rarely get trapped in a bad local minimum?`,
              choices: [
                { t: r`In very high dimensions, most flat points are saddles: some direction almost always still leads downhill`, ok: true },
                { t: r`Because the loss has only one minimum`, why: r`Network losses have many minima; the point is that most bad flat spots are saddles.` },
                { t: r`Because the learning rate is very large`, why: r`Large learning rates cause other problems; the high dimension is the main reason.` },
              ],
              explain: r`For a point to be a true minimum, the loss must curve upward in every one of millions of directions. That’s rare for poor solutions; much more often some direction slopes down, and the noise from mini-batches helps find it.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Mini-batches',
              prompt: r`A training set has 10 million images. Computing the exact gradient of the loss would need all 10 million every step. What do practitioners do instead?`,
              choices: [
                { t: 'Estimate the gradient from a small random batch (say 256 images) each step: stochastic gradient descent', ok: true },
                { t: 'Compute the full gradient once and reuse it forever', why: 'The gradient changes as the weights change, so it must be recomputed every step.' },
                { t: 'Train on just one fixed batch', why: 'The network would overfit that batch. Each step uses a fresh random batch.' },
              ],
              explain: r`**Stochastic gradient descent** uses a fresh random mini-batch each step. The estimate is noisy, but cheap, so you can take thousands of steps in the time one exact step would take, and the noise even helps escape bad flat regions. Almost all deep learning is trained this way.`,
            },
          ],
          recap: [
            'A loss function measures how wrong a network is.',
            r`Gradient descent: $w \leftarrow w - \eta\, \partial L / \partial w$.`,
            'Too small a learning rate is slow; too large overshoots or diverges.',
          ],
        },
        {
          id: 'backprop',
          title: 'Backpropagation',
          summary: 'The chain rule at scale',
          icon: 'left',
          steps: [
            {
              type: 'explain',
              title: 'Blame flows backwards',
              body: r`Gradient descent needs $\frac{\partial L}{\partial w}$ for **every** weight. A network is a long chain of functions, so the **chain rule** does the work: start at the loss and pass derivatives backwards through each layer, reusing results along the way. This is **backpropagation**, popularised in 1986 by David Rumelhart, Geoffrey Hinton and Ronald Williams.

Take the smallest example: one weight, prediction $\hat y = w x$, loss $L = (\hat y - t)^2$ for target $t$. By the chain rule:
$$\frac{\partial L}{\partial w} = \frac{\partial L}{\partial \hat y} \cdot \frac{\partial \hat y}{\partial w} = 2(\hat y - t) \cdot x$$`,
            },
            {
              type: 'numeric',
              title: 'Compute a gradient',
              prompt: r`With $w = 2$, input $x = 3$ and target $t = 4$, what is $\frac{\partial L}{\partial w}$?`,
              answer: 12,
              wrong: [{ v: 4, why: r`That's $2(\hat y - t)$. Multiply by $\frac{\partial \hat y}{\partial w} = x = 3$.` }, { v: 2, why: r`$\hat y - t = 6 - 4 = 2$, but the gradient is $2(\hat y - t) \cdot x$.` }],
              explain: r`$\hat y = 6$, so $\frac{\partial L}{\partial w} = 2(6 - 4)(3) = 12$. The gradient is positive (increasing $w$ makes things worse), so gradient descent will **decrease** $w$.`,
            },
            {
              type: 'numeric',
              title: 'Through two layers',
              prompt: r`Now a two-layer chain: $h = w x$, then $\hat y = v h$, with loss $L = (\hat y - t)^2$. By the chain rule, $\frac{\partial L}{\partial w} = 2(\hat y - t) \cdot v \cdot x$. With $w = 1$, $v = 2$, $x = 3$, $t = 4$, what is $\frac{\partial L}{\partial w}$?`,
              answer: 24,
              wrong: [{ v: 12, why: r`$\hat y = v w x = 6$, so $2(\hat y - t) = 4$; then multiply by $v = 2$ **and** $x = 3$.` }, { v: 8, why: r`Don't forget the input $x = 3$ at the end of the chain.` }],
              explain: r`$h = 3$, $\hat y = 6$, so $\frac{\partial L}{\partial w} = 2(6 - 4) \times 2 \times 3 = 24$. Each layer contributes one factor to the product: backpropagation computes these products layer by layer, from the loss backwards, reusing each partial result.`,
            },
            {
              type: 'mcq',
              title: 'Vanishing gradients',
              prompt: r`The sigmoid's slope is at most $0.25$. In a network 20 layers deep using sigmoids, the gradient reaching the first layer is a product of about 20 such slopes. What goes wrong?`,
              choices: [
                { t: 'The gradient becomes tiny (at most 0.25²⁰ ≈ 10⁻¹²), so the early layers barely learn', ok: true },
                { t: 'The gradient becomes huge and training explodes', why: 'Factors below 1 shrink the product. (Factors above 1 would explode it, a separate problem.)' },
                { t: 'Nothing: depth doesn’t affect gradients', why: 'Each layer multiplies in another factor, so depth matters a lot.' },
              ],
              explain: r`$0.25^{20} \approx 10^{-12}$: the early layers receive almost no signal. This **vanishing gradient** problem stalled deep networks until about 2010. ReLU activations (slope 1 when active), careful weight initialisation and "skip connections" that let gradients bypass layers made very deep networks trainable.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Choosing the step size',
              body: r`Gradient descent on the loss $L(w) = (w - 3)^2 + 1$, starting at $w = -2$: each step moves $w$ by $-\eta \times$ slope. Try different learning rates $\eta$ and watch 12 steps.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 10, ymin: 0, ymax: 30, grid: false, height: 280, clipExtra: true, axes: { xlabel: 'weight w', ylabel: 'loss', xticks: 2, yticks: 5, xAt: -4 },
                params: { eta: { min: 0.02, max: 1.1, step: 0.01, value: 0.1, label: 'learning rate η', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => (x - 3) ** 2 + 1, color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => { let w = -2; const pts = [w]; for (let k = 0; k < 12; k++) { w = w - p.eta * 2 * (w - 3); pts.push(w); } const L = (w) => (w - 3) ** 2 + 1, vis = pts.filter((w) => Math.abs(w) < 40); return [s('path', { d: vis.map((w, i) => `${i ? 'L' : 'M'}${plot.X(w).toFixed(1)} ${plot.Y(Math.min(L(w), 60)).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }), ...vis.map((w, i) => s('circle', { cx: plot.X(w), cy: plot.Y(Math.min(L(w), 60)), r: i === vis.length - 1 ? 7 : 4.5, class: 'fl-coral', opacity: 0.4 + (0.6 * i) / 12 }))]; },
                readout: (p) => { let w = -2; for (let k = 0; k < 12; k++) w = w - p.eta * 2 * (w - 3); const r = Math.abs(1 - 2 * p.eta); return `after 12 steps w = **${Math.abs(w) > 1e4 ? w.toExponential(1) : w.toFixed(3)}** · ${r > 1 ? 'diverging: each step overshoots further' : p.eta > 0.5 ? 'converging, but zig-zagging across the valley' : r > 0.8 ? 'converging slowly' : 'converging quickly'}`; },
              },
              after: r`Too small a step crawls; too big a step overshoots and zig-zags; above $\eta = 1$ here it overshoots further each time and blows up. For this quadratic, $\eta = 0.5$ jumps straight to the minimum. Real networks have millions of weights and curvature that varies, so picking the learning rate is one of the most important practical choices.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'One update',
              prompt: r`Back to the one-weight example ($w = 2$, $x = 3$, $t = 4$), whose gradient was 12. With learning rate $\eta = 0.01$, what's the new weight?`,
              answer: 1.88,
              tol: 0.001,
              wrong: [{ v: 2.12, tol: 0.001, why: 'Gradient descent moves against the gradient: subtract.' }, { v: -10, why: r`Multiply the gradient by $\eta = 0.01$ first: $2 - 0.01 \times 12$.` }],
              explain: r`$w = 2 - 0.01 \times 12 = 1.88$. Now $\hat y = 5.64$, closer to the target 4. Repeat millions of times across billions of weights (large language models have hundreds of billions) and you have modern deep learning.`,
            },
          ],
          recap: [
            'Backpropagation uses the chain rule to find every weight’s gradient.',
            r`For $L = (wx - t)^2$: $\partial L/\partial w = 2(wx - t)x$.`,
            'Each update moves weights a small step against the gradient.',
          ],
        },
        {
          id: 'overfitting',
          title: 'Overfitting',
          summary: 'Memorising versus learning',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Too flexible',
              body: r`The filled dots are **training** data; the hollow dots are **test** data the model never sees during training. Fit polynomials of increasing degree to the training dots (by least squares) and compare the errors.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 7.5, ymin: -1, ymax: 6, grid: 1, height: 300, axes: { xlabel: 'x', ylabel: 'y', xAt: -0.5 },
                params: { d: { min: 0, max: 7, step: 1, value: 1, label: 'polynomial degree', color: 'violet' } },
                curves: [{ f: (x, p) => fit(p.d)(x), color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [
                  ...TRAIN.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 7, class: 'fl-blue' })),
                  ...TEST.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 6, fill: 'var(--card)', stroke: 'var(--coral)', 'stroke-width': 3 })),
                ],
                readout: (p) => r`training error ${rms(fit(p.d), TRAIN).toFixed(2)} $\;\cdot\;$ test error **${rms(fit(p.d), TEST).toFixed(2)}**`,
              },
              after: r`Training error keeps falling as the degree rises, reaching zero at degree 7, where the curve passes through every training point. But the test error is lowest around degree 3–4, then climbs: the wiggly curve has memorised the noise instead of the pattern. That's **overfitting**.`,
            },
            {
              type: 'mcq',
              title: 'Spotting it',
              prompt: r`A network scores 99% on its training images but only 70% on new images. What's the most likely problem?`,
              choices: [
                { t: 'Overfitting: it has memorised the training set rather than learning general patterns', ok: true },
                { t: 'The learning rate is too small', why: 'A too-small rate would leave training accuracy low too. Here training is excellent; it’s new data that suffers.' },
                { t: 'The network is too small to learn the task', why: 'A too-small network would do badly on training data as well (underfitting).' },
              ],
              explain: r`The gap between training and test performance is the signature of overfitting. Remedies include more training data, simpler models, stopping training early, and **regularisation** techniques such as "dropout", which randomly switches off neurons during training so no single one can memorise too much. Always judge a model on data it hasn't seen.`,
            },
            {
              type: 'numeric',
              title: 'Why degree 7?',
              prompt: r`A polynomial of degree 7, $c_0 + c_1 x + \cdots + c_7 x^7$, has how many adjustable coefficients?`,
              answer: 8,
              wrong: [{ v: 7, why: r`Don't forget the constant term $c_0$.` }],
              explain: r`8 coefficients, exactly as many as the 8 training points, so it can pass through every one of them, noise included. A model with as many parameters as data points can memorise anything, and that's a warning sign: the model is too flexible for the amount of data.`,
            },
            {
              type: 'mcq',
              title: 'Regularisation',
              prompt: r`One popular cure for overfitting adds a penalty to the training error for having large weights. What does that do?`,
              choices: [
                { t: r`It nudges the model toward smoother, simpler fits that generalise better`, ok: true },
                { t: r`It makes the model fit the training data perfectly`, why: r`The penalty deliberately trades a little training accuracy for simplicity.` },
                { t: r`It removes the need for test data`, why: r`You still need held-out data to check how well the model generalises.` },
              ],
              explain: r`Large weights let a model bend sharply to chase noise. Penalising them (called **regularisation** or weight decay) keeps the fitted curve smooth. Other remedies include more data, simpler models, early stopping and "dropout", which randomly ignores neurons during training.`,
            },
            {
              type: 'mcq',
              title: 'The test set',
              prompt: r`Data is often split into training, validation and test sets. What is the test set for?`,
              choices: [
                { t: r`A final, honest estimate of performance on new data, used only once after all choices are made`, ok: true },
                { t: r`Tuning the learning rate and model size`, why: r`That’s the validation set’s job; using the test set for tuning leaks information.` },
                { t: r`Training the model faster`, why: r`Training uses the training set only.` },
              ],
              explain: r`Every decision made by looking at a dataset slightly fits the model to it. Keeping the test set locked away until the end gives an unbiased check, like an exam whose questions you haven’t seen.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Early stopping',
              prompt: r`During training, the training error keeps falling, while the error on a held-out "validation" set falls for a while, then starts rising. When should you stop?`,
              choices: [
                { t: 'Around the point where the validation error is lowest', ok: true },
                { t: 'When the training error reaches zero', why: 'By then the model has probably memorised the noise. Validation error tells you about new data.' },
                { t: 'As early as possible, after the first step', why: 'The model hasn’t learned anything yet. Both errors are still falling then.' },
              ],
              explain: r`Rising validation error means the model has started fitting noise. **Early stopping** keeps the weights from the best validation point. The final judgement uses a third, untouched **test** set, so that choosing when to stop doesn't itself overfit the validation data.`,
            },
          ],
          recap: [
            'Overfitting: fitting the noise in training data rather than the underlying pattern.',
            'Training error alone is misleading; judge models on held-out test data.',
            'More data, simpler models and regularisation reduce overfitting.',
          ],
        },
      ],
    },
    {
      title: 'Inside Modern Networks',
      summary: 'Building functions, and how networks see.',
      lessons: [
        {
          id: 'relu',
          title: 'Functions from Kinks',
          summary: 'How ReLUs build any shape',
          icon: 'pencil',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'One kink',
              prompt: r`What does the graph of $y = \max(0, x - 1)$ look like?`,
              choices: [
                { t: 'Flat at 0 up to x = 1, then a straight line rising with slope 1', ok: true },
                { t: 'A straight line through the origin', why: 'For x below 1 the output is clamped to 0.' },
                { t: 'A V shape', why: 'A V would rise on both sides. Here the left side stays flat at 0.' },
              ],
              explain: r`A ReLU neuron with input $x$, weight 1 and bias $-1$ gives a "hockey stick" with its kink at $x = 1$. The bias slides the kink, the weight sets the slope, and the next layer's weight scales the whole stick.`,
            },
            {
              type: 'interactive',
              title: 'Build a tent',
              body: r`Three hidden ReLU neurons have kinks at $x = 0$, $1$ and $2$. The output adds them up with weights $c_1$, $c_2$, $c_3$:
$$y = c_1\,\text{ReLU}(x) + c_2\,\text{ReLU}(x - 1) + c_3\,\text{ReLU}(x - 2).$$
Choose the output weights to build the dashed tent shape exactly.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 3.5, ymin: -1.2, ymax: 2, grid: false, height: 280, axes: { xlabel: 'x', ylabel: 'y', xticks: 1, yticks: 1 },
                params: {
                  c1: { min: -3, max: 3, step: 0.5, value: 0.5, label: 'c₁', color: 'blue' },
                  c2: { min: -3, max: 3, step: 0.5, value: 0, label: 'c₂', color: 'violet' },
                  c3: { min: -3, max: 3, step: 0.5, value: 0, label: 'c₃', color: 'coral' },
                },
                curves: [
                  { f: (x) => tent(x), color: 'muted', dash: true, width: 2.5 },
                  { f: (x, p) => p.c1 * relu(x) + p.c2 * relu(x - 1) + p.c3 * relu(x - 2), color: 'teal', width: 3 },
                ],
                readout: (p) => `Slopes: **${fix(p.c1, 1)}** after 0, **${fix(p.c1 + p.c2, 1)}** after 1, **${fix(p.c1 + p.c2 + p.c3, 1)}** after 2`,
                goal: (p) => p.c1 === 1 && p.c2 === -2 && p.c3 === 1,
                hint: 'The slope must be +1 from 0 to 1, −1 from 1 to 2, and 0 after 2. Each weight changes the slope at its kink.',
                solution: { c1: 1, c2: -2, c3: 1 },
              },
              explain: r`$c_1 = 1$ starts a slope of $+1$; $c_2 = -2$ turns it to $-1$ at the peak; $c_3 = 1$ flattens it back to 0. Each output weight is a **change of slope** at that neuron's kink. Tents placed side by side, with different heights, can trace any curve: that's the universal approximation theorem made concrete.`,
            },
            {
              type: 'numeric',
              title: 'Count the kinks',
              prompt: r`A one-input network with a single hidden layer of ReLU neurons produces a curve made of straight pieces. If it needs to follow a wiggly curve using 50 straight pieces, at least how many hidden neurons does it need?`,
              answer: 49,
              wrong: [{ v: 50, why: r`Each neuron adds one kink. 50 pieces need $50 - 1$ kinks.` }, { v: 100, why: 'One kink per neuron is enough: each neuron changes the slope at one point.' }],
              explain: r`50 straight pieces are joined at 49 kinks, and each ReLU neuron supplies one kink. More neurons, more pieces, finer approximations. Deep networks do this far more efficiently: each layer can fold the pieces of the previous one, so the number of pieces can grow **exponentially** with depth.`,
            },
            {
              type: 'explain',
              title: 'Depth multiplies',
              body: r`The tent function $T(x) = 1 - |2x - 1|$ rises from 0 to 1 and falls back over $[0, 1]$, and a layer of just two or three ReLUs can build it. Apply it twice, $T(T(x))$, and the output sweeps up and down twice: 2 tents. Three layers give 4; $n$ layers give $2^{n-1}$ tents, made of $2^n$ straight pieces, with only a few neurons per layer.

::: key
A shallow network needs about as many neurons as pieces. A deep network can make exponentially many pieces from a modest number of neurons.
:::

That's one reason **deep** learning works: real-world functions (recognising a face, translating a sentence) seem to have this kind of layered, compositional structure.`,
            },
            {
              type: 'numeric',
              title: 'Pieces of a line',
              prompt: r`A network with one hidden layer of 10 ReLU units, taking a single number as input, outputs a piecewise-linear function. At most how many straight pieces can it have?`,
              answer: 11,
              explain: r`Each ReLU contributes at most one kink, so at most 10 kinks, splitting the line into at most 11 pieces. Deeper networks can make exponentially many pieces with the same number of units.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Tents of tents',
              prompt: r`If each tent layer doubles the number of tents, how many straight pieces does a stack of 10 tent layers produce?`,
              answer: 1024,
              wrong: [{ v: 512, why: r`10 layers give $2^9 = 512$ tents, but each tent has 2 straight pieces.` }, { v: 20, why: 'Composition multiplies the pieces; it doesn’t add them.' }],
              hint: r`$n$ layers give $2^{n-1}$ tents, each with 2 pieces.`,
              explain: r`$2^9 = 512$ tents, each with 2 pieces: $2^{10} = 1024$ pieces, from just 10 small layers. A one-hidden-layer network would need about 1023 neurons to match it.`,
            },
          ],
          recap: [
            'Each ReLU neuron adds a kink; output weights set the change of slope there.',
            'Sums of kinks (tents) can approximate any curve: universal approximation.',
            'Depth composes functions, so the number of pieces can grow exponentially.',
          ],
        },
        {
          id: 'convolution',
          title: 'Convolutions',
          summary: 'How networks see edges',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Too many weights',
              prompt: r`A colour photo of 1000 × 1000 pixels has 3 million numbers. If the first layer of a network had 1000 neurons, each connected to every input number, how many weights would that layer need?`,
              choices: [
                { t: 'About 3 billion', ok: true },
                { t: 'About 3 million', why: 'Each of the 1000 neurons needs its own 3 million weights.' },
                { t: 'About 3000', why: 'Every neuron connects to all 3 million inputs: 1000 × 3,000,000.' },
              ],
              explain: r`$1000 \times 3{,}000{,}000 = 3 \times 10^9$ weights, for one layer. Worse, a neuron that learned to spot a cat's ear in the top-left corner would know nothing about ears elsewhere. **Convolutional** networks fix both problems with one idea: slide a small filter across the whole image.`,
            },
            {
              type: 'explain',
              title: 'Sliding a filter',
              body: r`A **filter** (or kernel) is a small grid of weights, typically $3 \times 3$. Place it over a $3 \times 3$ patch of the image, multiply each pixel by the weight on top of it, and add up the 9 products: that's one output pixel. Slide the filter one step and repeat, across the whole image.

The same 9 weights are used everywhere, so a filter that detects an edge finds edges **anywhere** in the image, with only 9 numbers to learn.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Try some filters',
              body: r`The left grid is a tiny image of a white square on black. The right grid is the result of sliding the chosen filter over it: blue for positive outputs, coral for negative. Try each filter.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 21, ymin: 0, ymax: 10.5, grid: false, axes: false, maxWidth: 600,
                params: { k: { min: 0, max: 3, step: 1, value: 1, label: 'filter', color: 'violet', format: (v) => KERNELS[v][0] } },
                extra: ({ plot, p, s }) => {
                  const els = [], cell = (x, y, cls, op) => s('rect', { x: plot.X(x), y: plot.Y(y + 1), width: plot.X(1) - plot.X(0) - 1, height: plot.Y(0) - plot.Y(1) - 1, class: cls, opacity: op });
                  IMG.forEach((row, r) => row.forEach((v, c) => els.push(cell(c, 9.5 - r, v ? 'fl-card' : 'fl-ink', v ? 1 : 0.85))));
                  const out = conv(KERNELS[p.k][1]), mx = Math.max(...out.flat().map(Math.abs)) || 1;
                  out.forEach((row, r) => row.forEach((v, c) => els.push(cell(12 + c, 8.5 - r, v >= 0 ? 'fl-blue' : 'fl-coral', 0.08 + 0.92 * Math.abs(v) / mx))));
                  els.push(s('text', { x: plot.X(5), y: plot.Y(0.1), class: 'tick', 'text-anchor': 'middle', text: 'image' }));
                  els.push(s('text', { x: plot.X(16), y: plot.Y(0.1), class: 'tick', 'text-anchor': 'middle', text: 'filtered' }));
                  return els;
                },
                readout: (p) => { const K = KERNELS[p.k][1]; return `Filter: ${KERNELS[p.k][0]} · weights ${K.map((row) => '[' + row.map((v) => (Number.isInteger(v) ? v : v.toFixed(2))).join(', ') + ']').join(' ')}`; },
              },
              after: r`The **vertical edges** filter responds only at the left and right sides of the square (with opposite signs: dark-to-light versus light-to-dark), and ignores flat regions, where its positive and negative weights cancel. The first layer of a trained image network learns filters remarkably like these, on its own.`,
            },
            {
              type: 'numeric',
              title: 'One output pixel',
              body: r`The vertical-edge filter is $\begin{pmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{pmatrix}$. It sits over a patch that is dark (0) in its left two columns and bright (1) in its right column.`,
              prompt: 'What does it output?',
              answer: 4,
              wrong: [{ v: 0, why: 'The right column (all 1s) meets the weights 1, 2, 1.' }, { v: 3, why: r`The middle-right weight is 2: $1 + 2 + 1$.` }],
              explain: r`Only the right column contributes: $1 \times 1 + 2 \times 1 + 1 \times 1 = 4$. Over a flat patch (all 0s or all 1s) the output would be 0, since the weights add up to zero. Big outputs mean "there's an edge here".`,
            },
            {
              type: 'mcq',
              title: 'Layers of features',
              prompt: r`In a deep convolutional network, the first layer finds edges. What do later layers tend to detect?`,
              choices: [
                { t: 'Combinations of earlier features: corners and textures, then parts like eyes or wheels, then whole objects', ok: true },
                { t: 'The same edges again, more precisely', why: 'Later layers see combinations of the previous layer’s outputs, so they build more complex features.' },
                { t: 'Random patterns with no meaning', why: 'Visualisations of trained networks show clearly structured features at every level.' },
              ],
              explain: r`Each layer filters the previous layer's outputs, so features get more complex and cover larger regions: edges → textures → parts → objects. In 2012 a convolutional network called AlexNet won the ImageNet image-recognition challenge by a huge margin, launching the deep learning boom.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Shared weights',
              prompt: r`A convolutional layer uses 64 different $3 \times 3$ filters on a single-channel (greyscale) image. Ignoring biases, how many weights does the layer have, whatever the image size?`,
              answer: 576,
              wrong: [{ v: 64, why: 'Each filter has 3 × 3 = 9 weights.' }, { v: 9, why: 'That’s one filter. There are 64.' }],
              explain: r`$64 \times 9 = 576$ weights, compared with billions for a fully connected layer on a large image. Sharing the same small filter across every position is what makes convolutional networks practical, and it builds in the sensible assumption that a feature means the same thing wherever it appears.`,
            },
          ],
          recap: [
            'A convolution slides a small filter over the image, computing a weighted sum at each position.',
            'Shared weights: few parameters, and features are detected anywhere in the image.',
            'Stacked layers build edges into textures, parts and whole objects.',
          ],
        },
      ],
    },
  ],
};
