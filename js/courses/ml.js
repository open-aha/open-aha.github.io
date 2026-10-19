import { fix } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const D = Math.PI / 180;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (u) => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const CLS = ['fl-blue', 'fl-coral', 'fl-teal', 'fl-amber', 'fl-violet', 'fl-pink'];
const COLV = ['var(--blue)', 'var(--coral)', 'var(--teal)', 'var(--amber)', 'var(--violet)', 'var(--pink)'];
const dots = ({ plot, s }, pts, { r: rad = 6.5, hollow = false } = {}) => pts.map(([x, y, c]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: rad, class: hollow ? '' : CLS[c], fill: hollow ? 'var(--card)' : null, stroke: hollow ? COLV[c] : 'var(--card)', 'stroke-width': hollow ? 3 : 2 }));

// ---------- nearest neighbours: two kinds of fruit (sweetness x, crunchiness y) ----------
const FRUIT = (() => {
  const u = rng(77), pts = [];
  for (let i = 0; i < 14; i++) pts.push([3 + 1.1 * gauss(u), 4.2 + 0.9 * gauss(u), 0]);
  for (let i = 0; i < 14; i++) pts.push([7 + 1.1 * gauss(u), 2.6 + 0.9 * gauss(u), 1]);
  pts.push([3.55, 4.6, 1]); // a mislabelled (or unusual) coral fruit inside the blue cluster
  return pts.map(([x, y, c]) => [Math.min(9.6, Math.max(0.4, x)), Math.min(6.6, Math.max(0.4, y)), c]);
})();
const STAR = [3.85, 4.85];
function knn(pts, q, k) {
  const near = pts.map((p) => [dist(p, q), p]).sort((a, b) => a[0] - b[0]).slice(0, k);
  const votes = [0, 0];
  near.forEach(([, p]) => votes[p[2]]++);
  return { near, votes, cls: votes[0] >= votes[1] ? 0 : 1 };
}
function knnRegions({ plot, s }, pts, k, nx = 50, ny = 35, x1 = 10, y1 = 7) {
  const els = [], cw = x1 / nx, ch = y1 / ny;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const c = knn(pts, [(i + 0.5) * cw, (j + 0.5) * ch], k).cls;
    els.push(s('rect', { x: plot.X(i * cw), y: plot.Y((j + 1) * ch), width: plot.X(cw) - plot.X(0) + 0.5, height: plot.Y(0) - plot.Y(ch) + 0.5, class: CLS[c], opacity: 0.13 }));
  }
  return els;
}

// ---------- decision trees ----------
const TREE_DATA = (() => {
  const u = rng(31), pts = [];
  for (let i = 0; i < 40; i++) {
    const x = 0.3 + 9.4 * u(), y = 0.3 + 6.4 * u();
    // true rule: coral if x > 5.5, or if x > 2.5 and y < 2.5; a few labels flipped as noise
    let c = x > 5.5 || (x > 2.5 && y < 2.5) ? 1 : 0;
    if (u() < 0.07) c = 1 - c;
    pts.push([x, y, c]);
  }
  return pts;
})();
const gini = (n0, n1) => { const n = n0 + n1; return n ? 1 - (n0 / n) ** 2 - (n1 / n) ** 2 : 0; };
function grow(pts, box, depth) {
  const n1 = pts.filter((p) => p[2]).length, n0 = pts.length - n1;
  const leaf = { box, cls: n1 > n0 ? 1 : 0, n0, n1 };
  if (depth === 0 || !n0 || !n1) return [leaf];
  let best = null;
  for (const ax of [0, 1]) {
    const vals = [...new Set(pts.map((p) => p[ax]))].sort((a, b) => a - b);
    for (let i = 0; i + 1 < vals.length; i++) {
      const t = (vals[i] + vals[i + 1]) / 2, L = pts.filter((p) => p[ax] <= t), R = pts.filter((p) => p[ax] > t);
      const sc = (L.length * gini(L.length - L.filter((p) => p[2]).length, L.filter((p) => p[2]).length) + R.length * gini(R.length - R.filter((p) => p[2]).length, R.filter((p) => p[2]).length)) / pts.length;
      if (!best || sc < best.sc - 1e-12) best = { sc, ax, t, L, R };
    }
  }
  if (!best || best.sc >= gini(n0, n1) - 1e-12) return [leaf];
  const [x0, y0, x1, y1] = box;
  const bl = best.ax ? [x0, y0, x1, best.t] : [x0, y0, best.t, y1], br = best.ax ? [x0, best.t, x1, y1] : [best.t, y0, x1, y1];
  return [...grow(best.L, bl, depth - 1), ...grow(best.R, br, depth - 1)];
}
const TREES = Array.from({ length: 7 }, (_, d) => grow(TREE_DATA, [0, 0, 10, 7], d));
const treeErrors = (leaves) => leaves.reduce((a, l) => a + (l.cls ? l.n0 : l.n1), 0);
// fresh points from the same rule, to test the trees
const TREE_TEST = (() => { const u = rng(913), pts = []; for (let i = 0; i < 200; i++) { const x = 0.3 + 9.4 * u(), y = 0.3 + 6.4 * u(); let c = x > 5.5 || (x > 2.5 && y < 2.5) ? 1 : 0; if (u() < 0.07) c = 1 - c; pts.push([x, y, c]); } return pts; })();
const treePredict = (leaves, p) => leaves.find((l) => p[0] >= l.box[0] && p[0] <= l.box[2] && p[1] >= l.box[1] && p[1] <= l.box[3])?.cls ?? 0;
const treeTestErr = (leaves) => TREE_TEST.filter((p) => treePredict(leaves, p) !== p[2]).length / TREE_TEST.length;

// ---------- k-means ----------
const BLOBS = (() => {
  const u = rng(5), C = [[2.2, 5], [7.5, 5.3], [3.4, 1.6], [7.8, 1.5]], pts = [];
  C.forEach(([cx, cy]) => { for (let i = 0; i < 15; i++) pts.push([cx + 0.75 * gauss(u), cy + 0.6 * gauss(u)]); });
  return pts;
})();
function kmeans(pts, centres, iters) {
  let C = centres.map((c) => c.slice()), lab = [];
  for (let it = 0; it <= iters; it++) {
    lab = pts.map((p) => { let b = 0; C.forEach((c, j) => { if (dist(p, c) < dist(p, C[b])) b = j; }); return b; });
    if (it === iters) break;
    C = C.map((c, j) => { const mine = pts.filter((_, i) => lab[i] === j); return mine.length ? [mine.reduce((a, p) => a + p[0], 0) / mine.length, mine.reduce((a, p) => a + p[1], 0) / mine.length] : c; });
  }
  const inertia = pts.reduce((a, p, i) => a + dist(p, C[lab[i]]) ** 2, 0);
  return { C, lab, inertia };
}
// best inertia for each k from many starts (for the elbow plot)
const ELBOW = (() => { let e = null; return () => { if (e) return e; e = []; for (let k = 1; k <= 7; k++) { let best = Infinity; const u = rng(100 + k); for (let tr = 0; tr < 30; tr++) { const st = Array.from({ length: k }, () => BLOBS[Math.floor(u() * BLOBS.length)]); best = Math.min(best, kmeans(BLOBS, st, 15).inertia); } e.push(best); } return e; }; })();

// ---------- scores for a medical test ----------
const phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
const normal = (x, m, sd) => Math.exp(-((x - m) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
function confusion(t, prev = 0.1, N = 1000) {
  const sick = N * prev, well = N - sick;
  const TP = sick * (1 - phi((t - 6) / 1.2)), FN = sick - TP, FP = well * (1 - phi((t - 3) / 1.2)), TN = well - FP;
  return { TP, FN, FP, TN, recall: TP / sick, precision: TP + FP ? TP / (TP + FP) : 1 };
}

// ---------- polynomial fitting: training and test points from y = sin(x) + noise ----------
const POLY = (() => {
  const u = rng(21), f = (x) => Math.sin(1.4 * x) + 0.4 * x;
  const train = Array.from({ length: 10 }, (_, i) => { const x = 0.25 + i * 0.6; return [x, f(x) + 0.28 * gauss(u)]; });
  const test = Array.from({ length: 20 }, (_, i) => { const x = 0.2 + i * 0.29; return [x, f(x) + 0.28 * gauss(u)]; });
  return { train, test, f };
})();
function polyfit(pts, deg) {
  const sx = (x) => (x - 2.95) / 2.9; // scale x into about [−1, 1]
  const n = deg + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (const [x, y] of pts) { const v = Array.from({ length: n }, (_, k) => sx(x) ** k); for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += v[i] * v[j]; A[i][n] += v[i] * y; } }
  for (let i = 0; i < n; i++) A[i][i] += 1e-10;
  for (let c = 0; c < n; c++) { let p = c; for (let r2 = c + 1; r2 < n; r2++) if (Math.abs(A[r2][c]) > Math.abs(A[p][c])) p = r2; [A[c], A[p]] = [A[p], A[c]]; for (let r2 = 0; r2 < n; r2++) if (r2 !== c) { const f = A[r2][c] / A[c][c]; for (let k = c; k <= n; k++) A[r2][k] -= f * A[c][k]; } }
  const coef = A.map((row, i) => row[n] / row[i]);
  return (x) => coef.reduce((a, c, k) => a + c * sx(x) ** k, 0);
}
const FITS = Array.from({ length: 10 }, (_, d) => polyfit(POLY.train, d));
const mse = (f, pts) => pts.reduce((a, [x, y]) => a + (f(x) - y) ** 2, 0) / pts.length;
const ERR = FITS.map((f) => [mse(f, POLY.train), mse(f, POLY.test)]);
const BEST_DEG = ERR.reduce((b, e, d) => (e[1] < ERR[b][1] ? d : b), 0);

// ---------- naive Bayes spam filter ----------
const WORDS = [['free', 0.6, 0.05], ['winner', 0.3, 0.01], ['meeting', 0.05, 0.4], ['tomorrow', 0.1, 0.3]];
function spamProb(present, prior = 0.4) {
  let ls = prior, lh = 1 - prior;
  WORDS.forEach(([, ps, ph], i) => { ls *= present[i] ? ps : 1 - ps; lh *= present[i] ? ph : 1 - ph; });
  return ls / (ls + lh);
}

// ---------- PCA ----------
const CLOUD = (() => { const u = rng(8), a = 30 * D, pts = []; for (let i = 0; i < 70; i++) { const s1 = 1.8 * gauss(u), s2 = 0.55 * gauss(u); pts.push([s1 * Math.cos(a) - s2 * Math.sin(a), s1 * Math.sin(a) + s2 * Math.cos(a)]); } const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length; return pts.map(([x, y]) => [x - mx, y - my]); })();
const COV = (() => { let xx = 0, yy = 0, xy = 0; for (const [x, y] of CLOUD) { xx += x * x; yy += y * y; xy += x * y; } const n = CLOUD.length; return { xx: xx / n, yy: yy / n, xy: xy / n }; })();
const varAlong = (deg) => { const c = Math.cos(deg * D), s2 = Math.sin(deg * D); return COV.xx * c * c + 2 * COV.xy * c * s2 + COV.yy * s2 * s2; };
const PC_ANGLE = ((0.5 * Math.atan2(2 * COV.xy, COV.xx - COV.yy)) / D + 180) % 180;
const TOTAL_VAR = COV.xx + COV.yy;

// ---------- recommendations ----------
const MOVIES = ['Space Saga', 'Robot Wars', 'Love in Paris', 'Laugh Riot', 'Star Quest'];
const RATINGS = { You: [5, 4, 1, 2, null], Ana: [4, 5, 2, 1, 5], Ben: [1, 2, 5, 4, 2], Cy: [3, 3, 3, 3, 3], Dee: [5, 5, 1, 1, 4] };
const OTHERS = ['Ana', 'Ben', 'Cy', 'Dee'];
function cosine(a, b) { let d = 0, na = 0, nb = 0; for (let i = 0; i < 4; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / Math.sqrt(na * nb); }
function centred(v) { const m = v.slice(0, 4).reduce((a, b) => a + b, 0) / 4; return v.slice(0, 4).map((x) => x - m); }
const corrSim = (a, b) => { const x = centred(a), y = centred(b), nx = Math.hypot(...x), ny = Math.hypot(...y); return nx && ny ? x.reduce((s, v, i) => s + v * y[i], 0) / (nx * ny) : 0; };

// standard normal: density and cumulative (Abramowitz and Stegun 7.1.26, error below 1e-7)
const rocPdf = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
const rocCdf = (z) => { const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x), e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return z >= 0 ? (1 + e) / 2 : (1 - e) / 2; };
const rocTau = (t) => 4.6 - Math.min(7.2, Math.max(0, t - 0.5));

export default {
  id: 'ml',
  subject: 'math',
  title: 'Machine Learning',
  level: 'Advanced',
  cover: 'ml',
  tagline: 'How computers learn from examples: neighbours, trees, clusters, spam filters and recommendations.',
  description: r`Machine learning lets a computer learn patterns from examples instead of following hand-written rules. Classify with nearest neighbours and decision trees, find groups with k-means, measure mistakes with precision and recall, see why models must be tested on data they haven't seen, build a spam filter with Bayes' rule, squeeze data down to its main directions, and recommend films from ratings.`,
  prereq: 'Statistics, and Vectors & Matrices',
  chapters: [
    {
      title: 'Learning from Examples',
      summary: 'Classifying new things.',
      lessons: [
        {
          id: 'knn',
          title: 'Nearest Neighbours',
          summary: 'Guess from the most similar examples',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'What kind of fruit?',
              body: r`Each dot is a fruit we've already labelled, measured by sweetness (across) and crunchiness (up): {blue:blue} for one kind, {coral:coral} for the other. A new fruit (violet) arrives. The simplest guess: give it the label of the **nearest** known fruit. Drag the new fruit around; the shading shows what would be predicted everywhere.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: { xlabel: 'sweetness', ylabel: 'crunchiness', xticks: 2, yticks: 2 }, maxWidth: 560,
                params: { qx: { min: 0.2, max: 9.8, step: 0.1, value: 5, slider: false }, qy: { min: 0.2, max: 6.8, step: 0.1, value: 3.5, slider: false } },
                under: (ctx) => knnRegions(ctx, FRUIT, 1),
                extra: (ctx) => { const { near } = knn(FRUIT, [ctx.p.qx, ctx.p.qy], 1); return [ctx.s('line', { x1: ctx.plot.X(ctx.p.qx), y1: ctx.plot.Y(ctx.p.qy), x2: ctx.plot.X(near[0][1][0]), y2: ctx.plot.Y(near[0][1][1]), stroke: 'var(--violet)', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }), ...dots(ctx, FRUIT)]; },
                points: [{ x: (p) => p.qx, y: (p) => p.qy, drag: { x: 'qx', y: 'qy' }, color: 'violet' }],
                readout: (p) => { const { near, cls } = knn(FRUIT, [p.qx, p.qy], 1); return `nearest known fruit: ${fix(near[0][0], 2)} away · prediction: **${cls ? 'coral' : 'blue'}**`; },
              },
              after: r`This is the **nearest-neighbour** classifier: no formulas, no training, just remembering examples. The shading reveals the **decision boundary**. Notice the island of coral inside the blue region: one unusual coral fruit (perhaps mislabelled) claims a patch of territory all of its own.`,
            },
            {
              type: 'numeric',
              title: 'How far apart?',
              prompt: r`Two fruits have (sweetness, crunchiness) of $(2, 1)$ and $(5, 5)$. How far apart are they?`,
              answer: 5,
              wrong: [{ v: 7, why: 'That adds the differences (3 + 4). Distance uses Pythagoras.' }, { v: 25, why: 'That’s the squared distance. Take the square root.' }],
              explain: r`$\sqrt{(5 - 2)^2 + (5 - 1)^2} = \sqrt{9 + 16} = 5$. With more features (say, colour, weight and size too), the same formula adds more squared differences under the root.`,
            },
            {
              type: 'interactive',
              title: 'Ask more neighbours',
              prompt: r`The **k-nearest-neighbours** method lets the $k$ nearest examples vote. The violet star sits among blue fruits, right next to the odd coral one. Choose the **smallest** $k$ for which the star is predicted **blue**.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: { xlabel: 'sweetness', ylabel: 'crunchiness', xticks: 2, yticks: 2 }, maxWidth: 560,
                params: { k: { min: 1, max: 9, step: 2, value: 1, label: '$k$', color: 'violet' } },
                under: (ctx) => knnRegions(ctx, FRUIT, ctx.p.k),
                extra: (ctx) => { const { near } = knn(FRUIT, STAR, ctx.p.k); return [...near.map(([, q]) => ctx.s('line', { x1: ctx.plot.X(STAR[0]), y1: ctx.plot.Y(STAR[1]), x2: ctx.plot.X(q[0]), y2: ctx.plot.Y(q[1]), stroke: 'var(--violet)', 'stroke-width': 2 })), ...dots(ctx, FRUIT), ctx.s('path', { d: `M${ctx.plot.X(STAR[0])} ${ctx.plot.Y(STAR[1]) - 11} l3.2 7 7.6 .8 -5.7 5.1 1.6 7.5 -6.7 -3.9 -6.7 3.9 1.6 -7.5 -5.7 -5.1 7.6 -.8 z`, class: 'fl-violet', stroke: 'var(--card)', 'stroke-width': 1.5 })]; },
                readout: (p) => { const { votes, cls } = knn(FRUIT, STAR, p.k); return `votes: ${votes[0]} blue, ${votes[1]} coral · prediction: **${cls ? 'coral' : 'blue'}**`; },
                goal: (p) => p.k === 3,
                solution: { k: 3 },
                hint: 'With k = 1, the odd coral fruit decides alone. How many voters does it take to outvote it?',
              },
              explain: r`With $k = 3$, two blue neighbours outvote the odd one. Larger $k$ smooths away the coral island in the shading, making predictions less sensitive to single unusual examples. Using an odd $k$ avoids ties between two classes.`,
            },
            {
              type: 'mcq',
              title: 'Too many neighbours',
              prompt: r`With 29 fruits in total, what happens if you set $k = 29$?`,
              choices: [
                { t: 'Every new fruit gets the same prediction: whichever kind is more common overall', ok: true },
                { t: 'The predictions become perfect', why: 'All 29 fruits vote every time, wherever the new fruit is, so its position stops mattering.' },
                { t: 'The method stops working', why: 'It still gives an answer, just a useless one.' },
              ],
              explain: r`With every example voting, the prediction ignores where the new fruit is. Small $k$ follows every quirk of the data (too wiggly); huge $k$ ignores the data's shape (too smooth). Choosing $k$ is a trade-off we'll meet again as **overfitting** versus **underfitting**.`,
            },
            {
              type: 'mcq',
              title: 'Different units',
              prompt: 'A k-NN model for people uses height in metres (about 1.5 to 2) and weight in grams (about 50,000 to 100,000). What goes wrong?',
              choices: [
                { t: 'Distances are dominated by weight; height barely counts', ok: true },
                { t: 'Nothing: the distance formula handles any units', why: 'It adds squared differences, so a feature measured in big numbers swamps the others.' },
                { t: 'Height dominates because it’s more important', why: 'The formula doesn’t know importance; it just sees the much bigger numbers in grams.' },
              ],
              explain: r`A difference of 1,000 g (1 kg) counts as much as a difference of 1,000 m in height! Before using distances, features are usually **scaled** to similar ranges (for example, by subtracting the mean and dividing by the standard deviation).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The cost of remembering',
              prompt: 'k-NN needs no training at all. What’s its main drawback with millions of examples?',
              choices: [
                { t: 'Every prediction must compare the new point with all the stored examples, which is slow', ok: true },
                { t: 'It can’t handle more than two classes', why: 'Voting works for any number of classes.' },
                { t: 'It forgets old examples', why: 'It keeps every example; that’s exactly what makes predictions slow.' },
              ],
              explain: r`The work is all at prediction time: measuring the distance to every stored example. Clever data structures (like k-d trees) and approximate search speed this up, and modern search engines for images and text use nearest-neighbour search over billions of items.`,
            },
          ],
          recap: [
            'k-NN predicts by majority vote of the k most similar examples.',
            'Small k follows quirks; large k over-smooths.',
            'Scale features before measuring distances.',
          ],
        },
        {
          id: 'trees',
          title: 'Decision Trees',
          summary: 'Twenty questions with data',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'A flowchart of questions',
              body: r`A **decision tree** classifies by asking a sequence of yes/no questions: "Is the sweetness above 5.5? If not, is the crunchiness below 2.5?" Each answer leads to another question, until a final box (a **leaf**) gives the prediction.

Trees are learned from data by choosing, at each step, the question that best separates the classes. They're popular because people can read them, unlike most machine-learning models.`,
            },
            {
              type: 'interactive',
              title: 'The first question',
              prompt: r`Choose a threshold $t$: fruits with sweetness above $t$ are predicted coral, the rest blue. Find the $t$ that makes the **fewest mistakes**.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: { xlabel: 'sweetness', ylabel: 'crunchiness', xticks: 2, yticks: 2 }, maxWidth: 560,
                params: { t: { min: 0.5, max: 9.5, step: 0.5, value: 8, label: 'threshold $t$', color: 'violet', format: (v) => fix(v, 1) } },
                under: ({ plot, p, s }) => [s('rect', { x: plot.X(0), y: plot.Y(7), width: plot.X(p.t) - plot.X(0), height: plot.Y(0) - plot.Y(7), class: 'fl-blue', opacity: 0.12 }), s('rect', { x: plot.X(p.t), y: plot.Y(7), width: plot.X(10) - plot.X(p.t), height: plot.Y(0) - plot.Y(7), class: 'fl-coral', opacity: 0.12 })],
                extra: (ctx) => [ctx.s('line', { x1: ctx.plot.X(ctx.p.t), x2: ctx.plot.X(ctx.p.t), y1: ctx.plot.Y(0), y2: ctx.plot.Y(7), stroke: 'var(--violet)', 'stroke-width': 3 }), ...dots(ctx, TREE_DATA)],
                readout: (p) => `mistakes: **${TREE_DATA.filter(([x, , c]) => (x > p.t ? 1 : 0) !== c).length}** of ${TREE_DATA.length}`,
                goal: (p) => { const m = (t) => TREE_DATA.filter(([x, , c]) => (x > t ? 1 : 0) !== c).length; let best = Infinity; for (let t = 0.5; t <= 9.5; t += 0.5) best = Math.min(best, m(t)); return m(p.t) === best; },
                solution: { t: 5.5 },
                hint: 'Watch the mistake count as you slide: it dips to a minimum.',
              },
              explain: r`Around $t = 5$ to $5.5$ the count is smallest: 5 mistakes. A single vertical cut can't do better, because some coral fruits sit low on the left. That calls for a second question, asked only about the fruits on the left of the first cut.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Growing deeper',
              body: r`A tree-growing algorithm keeps splitting boxes, choosing each cut to make the boxes as pure (single-coloured) as possible. Add depth and watch the training mistakes fall, and the mistakes on 200 **new** fruits from the same source.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: { xlabel: 'sweetness', ylabel: 'crunchiness', xticks: 2, yticks: 2 }, maxWidth: 560,
                params: { d: { min: 0, max: 6, step: 1, value: 1, label: 'depth', color: 'violet' } },
                under: ({ plot, p, s }) => TREES[p.d].map((l) => s('rect', { x: plot.X(l.box[0]), y: plot.Y(l.box[3]), width: plot.X(l.box[2]) - plot.X(l.box[0]), height: plot.Y(l.box[1]) - plot.Y(l.box[3]), class: CLS[l.cls], opacity: 0.14, stroke: 'var(--ink-3)', 'stroke-width': 1 })),
                extra: (ctx) => dots(ctx, TREE_DATA),
                readout: (p) => `depth ${p.d}: ${TREES[p.d].length} leaves · training mistakes **${treeErrors(TREES[p.d])}** of 40 · mistakes on new fruits **${fix(100 * treeTestErr(TREES[p.d]), 0)}%**`,
              },
              after: r`Training mistakes fall steadily, reaching zero by depth 4. Mistakes on new fruits stop improving after depth 3 (about 15%) and then creep back up, as the tree carves out tiny boxes around individual noisy points. Beyond that point the tree is memorising noise: **overfitting**. (Even the best tree errs on some new fruits: 7% of labels are random noise that no rule can predict.)`,
            },
            {
              type: 'numeric',
              title: 'Gini impurity',
              prompt: r`A box's **Gini impurity** is $1 - p_1^2 - p_2^2$, where $p_1, p_2$ are the fractions of each class. A box holds 3 blue and 1 coral fruit. What is its impurity?`,
              answer: 0.375,
              tol: 0.001,
              wrong: [{ v: 0.25, why: r`$p_{\text{coral}} = 0.25$, but the impurity is $1 - 0.75^2 - 0.25^2$.` }, { v: 0.625, why: r`$0.75^2 + 0.25^2 = 0.625$. Subtract it from 1.` }],
              explain: r`$1 - 0.75^2 - 0.25^2 = 1 - 0.5625 - 0.0625 = 0.375$. A pure box scores 0; a 50/50 box scores 0.5 (the worst for two classes). It's the chance that two fruits drawn at random from the box have different labels.`,
            },
            {
              type: 'numeric',
              title: 'Scoring a split',
              prompt: r`A split sends 4 fruits left (all blue, impurity 0) and 6 right (3 blue, 3 coral, impurity 0.5). The split's score is the average impurity, weighted by box size. What is it?`,
              answer: 0.3,
              tol: 0.001,
              wrong: [{ v: 0.25, why: r`That's the plain average of 0 and 0.5. Weight by size: $\frac{4}{10} \times 0 + \frac{6}{10} \times 0.5$.` }, { v: 0.5, why: 'The pure left box lowers the average.' }],
              explain: r`$\frac{4}{10} \times 0 + \frac{6}{10} \times 0.5 = 0.3$. The tree-growing algorithm tries every possible cut on every feature and keeps the one with the lowest weighted impurity.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Forests',
              prompt: 'A **random forest** grows hundreds of trees, each on a random sample of the data, and lets them vote. Why does that help?',
              choices: [
                { t: 'Individual trees overfit in different ways; their errors partly cancel when they vote', ok: true },
                { t: 'More trees means each one can be deeper', why: 'Depth isn’t the point. The gain comes from averaging many different, imperfect trees.' },
                { t: 'It runs faster than a single tree', why: 'It’s slower: hundreds of trees instead of one. It’s more accurate.' },
              ],
              explain: r`Each tree latches onto different quirks of its own random sample; the real pattern is the part they agree on. Averaging many noisy but independent guesses is the "wisdom of crowds" idea, and random forests are among the most reliable tools for tabular data.`,
            },
          ],
          recap: [
            'A decision tree classifies with a sequence of threshold questions.',
            'Splits are chosen to minimise weighted Gini impurity.',
            'Deep trees overfit; forests of trees vote to reduce it.',
          ],
        },
        {
          id: 'kmeans',
          title: 'Finding Clusters',
          summary: 'k-means',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'No labels at all',
              body: r`So far every example came with a label. Often there are none: customer records, star positions, gene measurements. **Clustering** looks for natural groups by itself (this is **unsupervised** learning).

The **k-means** algorithm finds $k$ groups:
1. Place $k$ centres somewhere.
2. **Assign** every point to its nearest centre.
3. **Move** each centre to the average (mean) of its points.
4. Repeat steps 2 and 3 until nothing changes.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch it run',
              body: r`Four centres start in poor places. Step through the iterations.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: false, maxWidth: 560,
                params: { it: { min: 0, max: 8, step: 1, value: 0, label: 'iteration', color: 'violet' } },
                extra: (ctx) => {
                  const { C, lab, inertia } = kmeans(BLOBS, [[1, 1], [2, 1.5], [1.5, 0.6], [2.5, 0.8]], ctx.p.it);
                  void inertia;
                  return [...BLOBS.map((q, i) => ctx.s('circle', { cx: ctx.plot.X(q[0]), cy: ctx.plot.Y(q[1]), r: 6, class: CLS[lab[i]], stroke: 'var(--card)', 'stroke-width': 2 })), ...C.map((c, j) => ctx.s('path', { d: `M${ctx.plot.X(c[0]) - 9} ${ctx.plot.Y(c[1]) - 9} l18 18 m0 -18 l-18 18`, stroke: COLV[j], 'stroke-width': 5, 'stroke-linecap': 'round' }))];
                },
                readout: (p) => `iteration ${p.it} · total squared distance to centres: **${fix(kmeans(BLOBS, [[1, 1], [2, 1.5], [1.5, 0.6], [2.5, 0.8]], p.it).inertia, 1)}**`,
              },
              after: r`The crosses chase their points across the plane and settle within a few iterations. Each step can only lower the total squared distance from points to their centres (the **inertia**), so the algorithm always settles. But it settles on a **local** best, which depends on where the centres started.`,
            },
            {
              type: 'numeric',
              title: 'Move the centre',
              prompt: r`A centre's group contains the points $(1, 2)$, $(3, 4)$ and $(5, 0)$. Where does the centre move? Give the $x$-coordinate.`,
              answer: 3,
              wrong: [{ v: 2, why: 'That’s the y-coordinate of the mean. The x-coordinates are 1, 3 and 5.' }, { v: 9, why: 'That’s the sum. Divide by the 3 points.' }],
              explain: r`The mean is $\left(\frac{1 + 3 + 5}{3}, \frac{2 + 4 + 0}{3}\right) = (3, 2)$. The mean is exactly the point that minimises the total squared distance to the group, which is why k-means moves centres there.`,
            },
            {
              type: 'interactive',
              title: 'How many clusters?',
              prompt: r`The chart shows the best inertia found for each number of clusters $k$. More clusters always lower it, but at some point the gains become small: the **elbow**. Choose the $k$ at the elbow.`,
              widget: {
                kind: 'graph', xmin: 0.5, xmax: 7.5, ymin: 0, ymax: 1, grid: false, height: 300, axes: { xlabel: 'k', ylabel: 'inertia (scaled)', xticks: 1, yticks: 0.25, xAt: 0.5 },
                params: { k: { min: 1, max: 7, step: 1, value: 2, label: '$k$', color: 'violet' } },
                extra: ({ plot, p, s }) => { const e = ELBOW(), m = e[0]; return [s('path', { d: 'M' + e.map((v, i) => `${plot.X(i + 1)} ${plot.Y(v / m)}`).join('L'), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }), ...e.map((v, i) => s('circle', { cx: plot.X(i + 1), cy: plot.Y(v / m), r: i + 1 === p.k ? 9 : 6, class: i + 1 === p.k ? 'fl-violet' : 'fl-muted' }))]; },
                readout: (p) => { const e = ELBOW(); return `k = ${p.k}: inertia ${fix(e[p.k - 1], 1)}${p.k > 1 ? ` · drop from k = ${p.k - 1}: ${fix(e[p.k - 2] - e[p.k - 1], 1)}` : ''}`; },
                goal: (p) => p.k === 4,
                solution: { k: 4 },
                hint: 'Look for the point after which adding a cluster barely helps.',
              },
              explain: r`At $k = 4$ the curve bends sharply: the data really has 4 groups. Splitting further only divides real groups in two, saving little. The elbow is a rule of thumb, not a law: real data often has no clear elbow, and choosing $k$ needs judgement about what the groups are for.`,
            },
            {
              type: 'mcq',
              title: 'Unlucky starts',
              prompt: 'Two centres start inside the same real cluster, and none inside another. What typically happens?',
              choices: [
                { t: 'k-means may split one cluster in two and merge two others: a poor local solution', ok: true },
                { t: 'It always untangles itself and finds the best clustering', why: 'Each step only makes local improvements, so it can get stuck.' },
                { t: 'It runs forever', why: 'It always stops: the inertia can only fall, and there are finitely many assignments.' },
              ],
              explain: r`k-means is guaranteed to settle, but not on the best answer. In practice it's run many times from random starts (or with the clever "k-means++" starting rule), keeping the result with the lowest inertia.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Inertia by hand',
              prompt: r`A cluster has points $(0, 0)$, $(2, 0)$ and $(1, 3)$, with its centre at their mean. What is the cluster's inertia (the sum of squared distances from the points to the centre)?`,
              answer: 8,
              wrong: [{ v: 6, why: r`The centre is $(1, 1)$. Squared distances: $1 + 1 = 2$, $1 + 1 = 2$, $0 + 4 = 4$.` }, { v: 2.83, tol: 0.02, why: 'Add the squared distances, not the distances.' }],
              explain: r`The mean is $(1, 1)$. Squared distances: $(0-1)^2 + (0-1)^2 = 2$, $(2-1)^2 + (0-1)^2 = 2$, $(1-1)^2 + (3-1)^2 = 4$. Total: 8. This is the number k-means tries to make small, summed over all clusters.`,
            },
          ],
          recap: [
            'k-means: assign points to the nearest centre, move centres to the means, repeat.',
            'It always settles, but possibly on a local optimum: restart several times.',
            'Choose k with care; the elbow of the inertia curve is a guide.',
          ],
        },
      ],
    },
    {
      title: 'Judging a Model',
      summary: 'Mistakes, testing and probability.',
      lessons: [
        {
          id: 'metrics',
          title: 'Measuring Mistakes',
          summary: 'Precision and recall',
          icon: 'check',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A lazy detector',
              prompt: 'A rare disease affects 1% of people. A “test” simply says “healthy” to everyone. How accurate is it?',
              choices: [
                { t: '99% accurate, and completely useless', ok: true },
                { t: '1% accurate', why: 'It’s right about everyone who’s healthy, which is 99% of people.' },
                { t: '50% accurate', why: 'Accuracy counts the share of correct answers: 99 of every 100.' },
              ],
              explain: r`It never finds a single sick person, yet it's right 99% of the time. When classes are unbalanced, **accuracy** misleads. We need measures that look at the rare class separately.`,
            },
            {
              type: 'explain',
              title: 'Four kinds of outcome',
              body: r`Comparing predictions with the truth gives four counts, the **confusion matrix**:

| | actually sick | actually healthy |
|---|---|---|
| test says sick | true positives (TP) | false positives (FP) |
| test says healthy | false negatives (FN) | true negatives (TN) |

Two key measures:
- **Recall** $= \frac{TP}{TP + FN}$: of the sick people, what fraction did we catch?
- **Precision** $= \frac{TP}{TP + FP}$: of the people we flagged, what fraction are really sick?`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Moving the threshold',
              body: r`A test gives each person a score. Sick people (coral) tend to score higher than healthy people (blue), but the two overlap. Everyone above the threshold is flagged. Here 1,000 people are tested, 10% of them sick.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 0.36, grid: false, height: 300, axes: { xlabel: 'score', xticks: 1, yticks: 0 },
                params: { t: { min: 1, max: 9, step: 0.1, value: 5, label: 'threshold', color: 'violet', format: (v) => fix(v, 1) } },
                under: ({ plot, p, s }) => {
                  const area = (m, k, from, to) => { let d = `M${plot.X(from)} ${plot.Y(0)}`; for (let x = from; x <= to + 1e-9; x += 0.05) d += `L${plot.X(x).toFixed(1)} ${plot.Y(k * normal(x, m, 1.2)).toFixed(1)}`; return d + `L${plot.X(to)} ${plot.Y(0)}Z`; };
                  return [s('path', { d: area(3, 0.9, p.t, 10), class: 'fl-blue', opacity: 0.3 }), s('path', { d: area(6, 0.1 * 3, p.t, 10), class: 'fl-coral', opacity: 0.45 })];
                },
                curves: [{ f: (x) => 0.9 * normal(x, 3, 1.2), color: 'blue', width: 3 }, { f: (x) => 0.3 * normal(x, 6, 1.2), color: 'coral', width: 3 }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.t), x2: plot.X(p.t), y1: plot.Y(0), y2: plot.Y(0.36), stroke: 'var(--violet)', 'stroke-width': 3 })],
                readout: (p) => { const c = confusion(p.t); return `TP ${fix(c.TP, 0)} · FN ${fix(c.FN, 0)} · FP ${fix(c.FP, 0)} · TN ${fix(c.TN, 0)} · recall **${fix(100 * c.recall, 0)}%** · precision **${fix(100 * c.precision, 0)}%**`; },
              },
              after: r`(The coral curve is drawn three times taller than its true share so it's easy to see.) Lowering the threshold catches more sick people (recall up) but flags more healthy ones too (precision down). Raising it does the opposite. No threshold gets both to 100%: the overlap forces a trade-off.`,
            },
            {
              type: 'interactive',
              title: 'Catch 90%',
              prompt: r`Doctors want to catch at least **90%** of sick people. Choose the threshold that achieves this with the **highest possible precision**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, height: 280, axes: { xlabel: 'threshold', ylabel: 'rate', xticks: 1, yticks: 0.25 },
                params: { t: { min: 1, max: 9, step: 0.1, value: 6, label: 'threshold', color: 'violet', format: (v) => fix(v, 1) } },
                curves: [{ f: (x) => confusion(x).recall, color: 'coral', width: 3 }, { f: (x) => confusion(x).precision, color: 'teal', width: 3 }, { f: () => 0.9, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.t), x2: plot.X(p.t), y1: plot.Y(0), y2: plot.Y(1), stroke: 'var(--violet)', 'stroke-width': 2.5 }), s('text', { x: plot.X(0.3), y: plot.Y(0.96), class: 'lbl halo-text', style: `fill:var(--coral);${FS(14)}`, text: 'recall' }), s('text', { x: plot.X(9.7), y: plot.Y(0.96), 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--teal);${FS(14)}`, text: 'precision' })],
                readout: (p) => { const c = confusion(p.t); return `recall **${fix(100 * c.recall, 1)}%** · precision **${fix(100 * c.precision, 1)}%**`; },
                goal: (p) => { const c = confusion(p.t); if (c.recall < 0.9) return { ok: false, msg: 'Recall is below 90%: too many sick people are missed.' }; return confusion(Math.round((p.t + 0.1) * 10) / 10).recall < 0.9 ? true : { ok: false, msg: 'Recall is fine, but you could raise the threshold a little and gain precision.' }; },
                solution: { t: 4.4 },
                hint: 'Raise the threshold as far as you can while recall stays at 90% or more.',
              },
              explain: r`At 4.4, recall is just over 90%, and precision is only about 45%: more than half the people flagged are healthy. Catching rare things with an imperfect test always produces many false alarms, which is why positive screening results are followed by more accurate tests.`,
            },
            { /*anim:ml*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Tracing the ROC curve',
              body: r`Scores of {blue:healthy} people (centred on 0) and {coral:sick} people (centred on 2). Everyone scoring above the threshold is flagged. As the threshold sweeps down, the right-hand plot records the **true positive rate** (sick people caught) against the **false positive rate** (healthy people wrongly flagged).`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.2, xmax: 9.8, ymin: -0.9, ymax: 4.3, grid: false, axes: false, maxWidth: 640,
                animate: { param: 't', speed: 1, max: 10, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const tau = rocTau(p.t), H = 7, els = [];
                  // left: the two score distributions on z from -3 to 5, squeezed into x from -3 to 4
                  const X = (z) => plot.X(-3 + (7 * (z + 3)) / 8), Y = (d) => plot.Y(H * d);
                  for (const [m, col] of [[0, 'blue'], [2, 'coral']]) {
                    const shade = [`M${X(tau)} ${Y(0)}`], line = [];
                    for (let i = 0; i <= 120; i++) { const z = -3 + (8 * i) / 120; line.push(`${i ? 'L' : 'M'}${X(z).toFixed(1)} ${Y(rocPdf(z - m)).toFixed(1)}`); if (z >= tau) shade.push(`L${X(z).toFixed(1)} ${Y(rocPdf(z - m)).toFixed(1)}`); }
                    shade.push(`L${X(5)} ${Y(0)}Z`);
                    if (tau < 5) els.push(s('path', { d: shade.join(''), class: `fl-${col}`, opacity: 0.35 }));
                    els.push(s('path', { d: line.join(''), fill: 'none', stroke: `var(--${col})`, 'stroke-width': 2.5 }));
                  }
                  els.push(s('line', { x1: X(-3), x2: X(5), y1: Y(0), y2: Y(0), stroke: 'var(--axis)', 'stroke-width': 1.3 }));
                  els.push(s('line', { x1: X(tau), x2: X(tau), y1: Y(0) + 6, y2: Y(0.45), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  els.push(s('text', { x: X(tau), y: Y(0.45) - 6, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));fill:var(--ink-2)', text: 'threshold' }));
                  // right: the ROC square, FPR across and TPR up, from (5.6, 0) to (9.6, 4)
                  const RX = (f) => plot.X(5.6 + 4 * f), RY = (f) => plot.Y(4 * f);
                  els.push(s('rect', { x: RX(0), y: RY(1), width: RX(1) - RX(0), height: RY(0) - RY(1), fill: 'none', stroke: 'var(--axis)', 'stroke-width': 1.3 }));
                  els.push(s('line', { x1: RX(0), y1: RY(0), x2: RX(1), y2: RY(1), stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }));
                  const roc = [];
                  for (let q = 4.6; q >= tau - 1e-9; q -= 0.05) roc.push(`${roc.length ? 'L' : 'M'}${RX(1 - rocCdf(q)).toFixed(1)} ${RY(1 - rocCdf(q - 2)).toFixed(1)}`);
                  roc.push(`L${RX(1 - rocCdf(tau)).toFixed(1)} ${RY(1 - rocCdf(tau - 2)).toFixed(1)}`);
                  els.push(s('path', { d: roc.join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                  els.push(s('circle', { cx: RX(1 - rocCdf(tau)), cy: RY(1 - rocCdf(tau - 2)), r: 5.5, class: 'fl-violet' }));
                  els.push(s('text', { x: RX(0.5), y: RY(0) + 17, 'text-anchor': 'middle', class: 'tick', text: 'false positive rate' }));
                  els.push(s('text', { x: RX(0) - 8, y: RY(0.5), 'text-anchor': 'middle', class: 'tick', transform: `rotate(-90 ${RX(0) - 8} ${RY(0.5)})`, text: 'true positive rate' }));
                  return els;
                },
                readout: (p) => { const tau = rocTau(p.t); return `threshold ${fix(tau, 2)} · {coral:sick caught ${fix(100 * (1 - rocCdf(tau - 2)), 1)}%} · {blue:healthy flagged ${fix(100 * (1 - rocCdf(tau)), 1)}%}`; },
              },
              after: r`A strict threshold (far right) flags almost nobody: no false alarms, but few sick people caught. A lax one flags almost everybody. The **ROC curve** shows every trade-off at once. A useless test, scoring sick and healthy people alike, would trace the dashed diagonal; a perfect one would hug the top-left corner. The area under this curve is about 0.92: the chance that a randomly chosen sick person scores higher than a randomly chosen healthy one.`,
            },
            {
              type: 'numeric',
              title: 'Precision from counts',
              prompt: r`A spam filter flags 50 emails. 45 of them really are spam. Meanwhile 15 spam emails slipped through into the inbox. What is the filter's precision?`,
              answer: 0.9,
              tol: 0.001,
              wrong: [{ v: 0.75, why: r`That's the recall: $\frac{45}{45 + 15}$. Precision asks how many of the **flagged** emails are spam.` }],
              explain: r`Precision $= \frac{45}{50} = 0.9$; recall $= \frac{45}{45 + 15} = 0.75$. For spam, high precision matters most: a real email lost in the spam folder (a false positive) is worse than a little spam in the inbox.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'One number for both',
              prompt: r`The **F1 score** combines precision $P$ and recall $R$ as their harmonic mean, $\frac{2PR}{P + R}$. What is the F1 score for the spam filter above ($P = 0.9$, $R = 0.75$)? (3 decimal places.)`,
              answer: (2 * 0.9 * 0.75) / 1.65,
              tol: 0.001,
              wrong: [{ v: 0.825, tol: 0.001, why: 'That’s the ordinary average. The harmonic mean is pulled towards the smaller value.' }],
              explain: r`$\frac{2 \times 0.9 \times 0.75}{0.9 + 0.75} = \frac{1.35}{1.65} \approx 0.818$. The harmonic mean punishes imbalance: a filter with precision 1 and recall 0.01 has an ordinary average of about 0.5 but an F1 of only about 0.02.`,
            },
          ],
          recap: [
            'Accuracy misleads when one class is rare.',
            'Recall = TP/(TP + FN); precision = TP/(TP + FP).',
            'Moving a threshold trades recall against precision.',
          ],
        },
        {
          id: 'testing',
          title: 'Train and Test',
          summary: 'Fitting signal, not noise',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Wigglier curves',
              body: r`Ten training points (filled) come from a smooth trend plus noise. We fit polynomials of increasing degree. The hollow points are **test** data from the same source, never shown to the fitting.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: -1.5, ymax: 4.5, grid: false, height: 320, axes: { xlabel: 'x', ylabel: 'y', xticks: 1, yticks: 1, yAt: -1.5 },
                params: { d: { min: 0, max: 9, step: 1, value: 1, label: 'degree', color: 'violet' } },
                curves: [{ f: (x, p) => FITS[p.d](x), color: 'violet', width: 3, from: 0.15, to: 5.85, n: 400 }],
                extra: (ctx) => [...dots(ctx, POLY.test.map(([x, y]) => [x, y, 2]), { r: 5, hollow: true }), ...dots(ctx, POLY.train.map(([x, y]) => [x, y, 0]))],
                readout: (p) => `training error **${fix(ERR[p.d][0], 3)}** · test error **${fix(ERR[p.d][1], 3)}**`,
              },
              after: r`A straight line (degree 1) misses the bend: **underfitting**. A moderate degree follows the trend. Degree 9 passes through all ten training points exactly (training error 0!), but swings wildly between them, and its test error shoots up to about seven times the best: **overfitting**. It has memorised the noise.`,
            },
            {
              type: 'interactive',
              title: 'The best degree',
              prompt: r`Choose the polynomial degree with the **lowest test error**.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 9.5, ymin: 0, ymax: 0.6, grid: false, height: 300, axes: { xlabel: 'degree', ylabel: 'error', xticks: 1, yticks: 0.1, xAt: -0.5 },
                params: { d: { min: 0, max: 9, step: 1, value: 9, label: 'degree', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const line = (k, col) => s('path', { d: 'M' + ERR.map((e, i) => `${plot.X(i)} ${plot.Y(Math.min(0.6, e[k]))}`).join('L'), fill: 'none', stroke: col, 'stroke-width': 3 });
                  return [line(0, 'var(--blue)'), line(1, 'var(--coral)'), s('line', { x1: plot.X(p.d), x2: plot.X(p.d), y1: plot.Y(0), y2: plot.Y(0.6), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }), s('text', { x: plot.X(9.3), y: plot.Y(0.04), 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--blue);${FS(14)}`, text: 'training' }), s('text', { x: plot.X(9.3), y: plot.Y(0.56), 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--coral);${FS(14)}`, text: 'test' })];
                },
                readout: (p) => `degree ${p.d}: training ${fix(ERR[p.d][0], 3)} · test **${fix(ERR[p.d][1], 3)}**`,
                goal: (p) => p.d === BEST_DEG,
                solution: { d: BEST_DEG },
                hint: 'The training error keeps falling. Watch the test error instead: it falls, then rises.',
              },
              explain: r`The test error is lowest at degree ${BEST_DEG}. Training error always falls as the model gets more flexible; test error falls and then rises, a U-shape. The bottom of the U is the right complexity. Judging a model only by its training error rewards memorisation.`,
            },
            {
              type: 'mcq',
              title: 'A perfect score',
              prompt: r`A 1-nearest-neighbour classifier gets **100%** accuracy on its own training data. Why isn't that impressive?`,
              choices: [
                { t: 'Each training point’s nearest neighbour is itself, so it can’t be wrong on data it has stored', ok: true },
                { t: 'It is impressive: the model has learned the pattern perfectly', why: 'It has memorised the examples. That says nothing about new data.' },
                { t: '1-NN can’t be measured on training data', why: 'It can be measured; the measurement is just meaningless.' },
              ],
              explain: r`A model must be judged on data it hasn't seen: a **test set** kept aside from the start. A common refinement, **cross-validation**, splits the data into (say) 5 parts, trains on 4 and tests on the 5th, five times over, and averages.`,
            },
            {
              type: 'mcq',
              title: 'Peeking',
              prompt: 'A researcher tries 200 models, checking each on the test set, and reports the best test score. What’s wrong?',
              choices: [
                { t: 'The test set has been used to choose the model, so it no longer measures performance on unseen data', ok: true },
                { t: 'Nothing: the test data was never used for training', why: 'Choosing the winner by test score is a kind of training. With 200 tries, one may win by luck.' },
                { t: '200 models are too few', why: 'The problem is reusing the test set, not the number of models.' },
              ],
              explain: r`Choosing among many models by test score overfits the **test set**. The fix: a separate **validation set** for choosing models, and a test set touched only once, at the very end. This kind of leakage is one of the most common mistakes in published machine-learning results.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Enough points to pass through',
              prompt: r`A polynomial of degree $d$ has $d + 1$ adjustable coefficients. What is the smallest degree that can pass exactly through 10 points (with different $x$ values), however noisy they are?`,
              answer: 9,
              wrong: [{ v: 10, why: 'Degree 10 has 11 coefficients: more than needed for 10 points.' }, { v: 2, why: 'A parabola has only 3 coefficients: it can’t pass through 10 arbitrary points.' }],
              explain: r`Degree 9 has 10 coefficients, enough to satisfy 10 equations exactly. A model with as many adjustable numbers as data points can fit anything, including pure noise, which is why it learns nothing. Modern neural networks have more parameters than data points yet still generalise, a puzzle that researchers are still working to understand.`,
            },
          ],
          recap: [
            'Judge models on test data they never saw during training.',
            'Training error falls with complexity; test error is U-shaped.',
            'Choosing models by test score leaks information: use a validation set.',
          ],
        },
        {
          id: 'bayes',
          title: 'A Spam Filter',
          summary: 'Naive Bayes',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Evidence from words',
              body: r`Some words are much more common in spam than in normal email ("ham"). From thousands of labelled emails, we estimate how often each word appears in each:

| word | in spam | in ham |
|---|---|---|
| free | 60% | 5% |
| winner | 30% | 1% |
| meeting | 5% | 40% |
| tomorrow | 10% | 30% |

Before reading the email, 40% of mail is spam. **Bayes' rule** updates this using the evidence: the chance of spam is proportional to (prior) × (probability of seeing these words if spam).`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Toggle the words',
              body: r`Choose which words appear in an email. A **naive Bayes** filter multiplies the probability of each word being present (or absent) as if they were independent.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 120,
                params: Object.fromEntries(WORDS.map(([w], i) => [`w${i}`, { min: 0, max: 1, step: 1, value: i === 0 ? 1 : 0, label: `“${w}”`, color: ['coral', 'amber', 'teal', 'blue'][i], format: (v) => (v ? 'present' : 'absent') }])),
                extra: ({ plot, p, s }) => { const v = spamProb([0, 1, 2, 3].map((i) => p[`w${i}`])); return [s('rect', { x: plot.X(0.5), y: plot.Y(0.75), width: plot.X(9.5) - plot.X(0.5), height: plot.Y(0.25) - plot.Y(0.75), rx: 10, class: 'fl-surface' }), s('rect', { x: plot.X(0.5), y: plot.Y(0.75), width: (plot.X(9.5) - plot.X(0.5)) * v, height: plot.Y(0.25) - plot.Y(0.75), rx: 10, class: 'fl-coral' })]; },
                readout: (p) => `chance this email is spam: **${fix(100 * spamProb([0, 1, 2, 3].map((i) => p[`w${i}`])), 1)}%**`,
              },
              after: r`"free" alone lifts the chance from 40% to about 92% (absent words count too: missing "meeting" is mild evidence of spam). Add "winner" and it's almost certain. "meeting" pulls strongly the other way. Each word multiplies the odds by its **likelihood ratio**, the ratio of its two percentages.`,
            },
            {
              type: 'numeric',
              title: 'One word, by hand',
              prompt: r`Ignore every word except "free". The prior chance of spam is 0.4; "free" appears in 60% of spam and 5% of ham. If an email contains "free", what is the chance it's spam? (3 decimal places.)`,
              answer: (0.4 * 0.6) / (0.4 * 0.6 + 0.6 * 0.05),
              tol: 0.001,
              wrong: [{ v: 0.6, why: 'That’s the chance of the word, given spam. Bayes’ rule turns it around.' }, { v: 0.24, tol: 0.001, why: r`That's the numerator only, $0.4 \times 0.6$. Divide by the total chance of seeing "free": $0.24 + 0.6 \times 0.05$.` }],
              explain: r`$P(\text{spam} \mid \text{free}) = \dfrac{0.4 \times 0.6}{0.4 \times 0.6 + 0.6 \times 0.05} = \dfrac{0.24}{0.27} \approx 0.889$. One word takes the chance from 40% to about 89%.`,
            },
            {
              type: 'interactive',
              title: 'Looks like ham',
              prompt: r`Find the combination of words that makes the email **least** likely to be spam.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 120,
                params: Object.fromEntries(WORDS.map(([w], i) => [`w${i}`, { min: 0, max: 1, step: 1, value: i < 2 ? 1 : 0, label: `“${w}”`, color: ['coral', 'amber', 'teal', 'blue'][i], format: (v) => (v ? 'present' : 'absent') }])),
                extra: ({ plot, p, s }) => { const v = spamProb([0, 1, 2, 3].map((i) => p[`w${i}`])); return [s('rect', { x: plot.X(0.5), y: plot.Y(0.75), width: plot.X(9.5) - plot.X(0.5), height: plot.Y(0.25) - plot.Y(0.75), rx: 10, class: 'fl-surface' }), s('rect', { x: plot.X(0.5), y: plot.Y(0.75), width: (plot.X(9.5) - plot.X(0.5)) * v, height: plot.Y(0.25) - plot.Y(0.75), rx: 10, class: 'fl-coral' })]; },
                readout: (p) => `chance of spam: **${fix(100 * spamProb([0, 1, 2, 3].map((i) => p[`w${i}`])), 2)}%**`,
                goal: (p) => p.w0 === 0 && p.w1 === 0 && p.w2 === 1 && p.w3 === 1,
                solution: { w0: 0, w1: 0, w2: 1, w3: 1 },
                hint: 'Include the words that are more common in ham, and leave out the spammy ones.',
              },
              explain: r`"meeting" and "tomorrow" present, "free" and "winner" absent: under 1%. Each word whose ham percentage beats its spam percentage pushes towards ham when present; each spammy word pushes towards ham when it's **absent**.`,
            },
            {
              type: 'mcq',
              title: 'Why “naive”?',
              prompt: 'What is the naive assumption in a naive Bayes filter?',
              choices: [
                { t: 'That the words appear independently of each other, given whether the email is spam', ok: true },
                { t: 'That every email is equally likely to be spam', why: 'The filter uses a prior (here 40%), which needn’t be 50%.' },
                { t: 'That spammers never change their wording', why: 'That’s a practical weakness, but it isn’t the "naive" assumption.' },
              ],
              explain: r`In reality "free" and "winner" tend to appear together, so multiplying their probabilities double-counts the evidence and makes the filter over-confident. Yet naive Bayes filters work remarkably well in practice, and powered the first effective spam filters in the early 2000s.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Odds multiply',
              prompt: r`Starting odds of spam are $0.4 : 0.6$ (that's $\frac23$). The word "winner" has likelihood ratio $\frac{0.30}{0.01} = 30$. If an email contains "winner" (ignore other words), what are the new odds of spam?`,
              answer: 20,
              wrong: [{ v: 30, why: 'Multiply the prior odds (2/3) by the likelihood ratio.' }, { v: 45, why: r`The prior odds are $\frac{0.4}{0.6} = \frac23$, not $\frac32$.` }],
              explain: r`New odds $= \frac23 \times 30 = 20$, that is $20 : 1$, a probability of $\frac{20}{21} \approx 95\%$. In odds form, Bayes' rule is just multiplication: each independent clue multiplies the odds by its likelihood ratio.`,
            },
          ],
          recap: [
            'Bayes: posterior ∝ prior × likelihood of the evidence.',
            'Naive Bayes multiplies word likelihoods as if independent.',
            'In odds form, each clue multiplies the odds by its likelihood ratio.',
          ],
        },
      ],
    },
    {
      title: 'Finding Structure',
      summary: 'Directions and similarities.',
      lessons: [
        {
          id: 'pca',
          title: 'The Main Direction',
          summary: 'Principal component analysis',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Too many measurements',
              body: r`Data often comes with many correlated measurements: height and arm span, or thousands of gene activity levels. Much of it is redundant. **Principal component analysis** (PCA) finds the directions along which the data varies most, so we can describe each point with a few numbers instead of many.

The first **principal component** is the direction where the data is most spread out: project every point onto a line through the centre, and choose the line that makes the projections as spread out (largest variance) as possible.`,
            },
            {
              type: 'interactive',
              title: 'Find the spread',
              prompt: r`Rotate the line through the centre of the cloud. The coral marks are each point's projection onto the line. Find the angle that makes their **variance** as large as possible.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -4.3, ymax: 4.3, grid: false, axes: false, maxWidth: 560, clipExtra: true,
                params: { a: { min: 0, max: 179, step: 1, value: 120, label: 'angle', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const c = Math.cos(p.a * D), sn = Math.sin(p.a * D), els = [s('line', { x1: plot.X(-6 * c), y1: plot.Y(-6 * sn), x2: plot.X(6 * c), y2: plot.Y(6 * sn), stroke: 'var(--violet)', 'stroke-width': 3 })];
                  for (const [x, y] of CLOUD) { const t = x * c + y * sn; els.push(s('line', { x1: plot.X(x), y1: plot.Y(y), x2: plot.X(t * c), y2: plot.Y(t * sn), stroke: 'var(--ink-3)', 'stroke-width': 1, opacity: 0.5 })); }
                  for (const [x, y] of CLOUD) els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 4.5, class: 'fl-blue' }));
                  for (const [x, y] of CLOUD) { const t = x * c + y * sn; els.push(s('circle', { cx: plot.X(t * c), cy: plot.Y(t * sn), r: 3, class: 'fl-coral' })); }
                  return els;
                },
                readout: (p) => `variance along the line: **${fix(varAlong(p.a), 2)}** of ${fix(TOTAL_VAR, 2)} total (${fix((100 * varAlong(p.a)) / TOTAL_VAR, 0)}%)`,
                goal: (p) => Math.abs(((p.a - PC_ANGLE + 90 + 180) % 180) - 90) <= 2,
                solution: { a: Math.round(PC_ANGLE) },
                hint: 'Line it up with the long axis of the cloud.',
              },
              explain: r`Along the cloud's long axis (about ${Math.round(PC_ANGLE)}°) the projections spread the most, capturing about ${fix((100 * varAlong(PC_ANGLE)) / TOTAL_VAR, 0)}% of the total variance. Describing each point by its position along this one line loses little information: two numbers become one. Mathematically, this direction is the top eigenvector of the data's covariance matrix.`,
            },
            {
              type: 'numeric',
              title: 'Shortest spread',
              prompt: r`For this cloud, at what angle (between $0°$ and $180°$) is the variance of the projections **smallest**? (Nearest degree.)`,
              unit: '°',
              answer: Math.round((PC_ANGLE + 90) % 180),
              tol: 2.5,
              wrong: [{ v: Math.round(PC_ANGLE), tol: 2.5, why: 'That’s where the variance is largest. The smallest is perpendicular to it.' }],
              explain: r`Perpendicular to the first component: about ${Math.round((PC_ANGLE + 90) % 180)}°. That's the **second principal component**. In 2D the two components are at right angles, and their variances add up to the total variance.`,
            },
            {
              type: 'numeric',
              title: 'Variance explained',
              prompt: r`A dataset of 10 measurements has total variance 50. The first two principal components have variances 30 and 12. What fraction of the variance do they explain together?`,
              answer: 0.84,
              tol: 0.001,
              wrong: [{ v: 0.6, why: 'That’s only the first component. Add the second.' }, { v: 42, why: 'Divide by the total variance, 50.' }],
              explain: r`$\frac{30 + 12}{50} = 0.84$: two numbers per item keep 84% of the information (as measured by variance) from the original ten. That's why PCA is used to compress data and to draw high-dimensional data in 2D.`,
            },
            {
              type: 'mcq',
              title: 'Eigenfaces',
              prompt: 'Face images have thousands of pixels each. Applying PCA to a collection of faces gives “eigenfaces”. What are they?',
              choices: [
                { t: 'The main patterns of variation between faces; each face is roughly a mix of a few of them', ok: true },
                { t: 'The average face of the collection', why: 'The average is subtracted first. The components describe how faces differ from it.' },
                { t: 'The most typical face in the collection', why: 'Components are directions of variation, not individual faces.' },
              ],
              explain: r`Each principal component is itself an image, like a ghostly face. Any face is approximately the average face plus a weighted sum of a few dozen eigenfaces, so a few dozen numbers describe it. This was one of the first working face-recognition methods (1991).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Units again',
              prompt: 'You run PCA on people’s height (in mm) and age (in years). The first component points almost exactly along height. Why might that be misleading?',
              choices: [
                { t: 'Height in mm has a far bigger variance in raw numbers, so it dominates; the data should be standardised first', ok: true },
                { t: 'It means age doesn’t matter', why: 'It means the numbers for height are bigger, which depends on the choice of units.' },
                { t: 'PCA only works for one variable at a time', why: 'PCA works on all variables together; the problem is their different scales.' },
              ],
              explain: r`Switching height to metres would shrink its variance a million-fold and flip the result. Like k-NN, PCA depends on units, so features are usually standardised (mean 0, standard deviation 1) first, unless they're already in comparable units.`,
            },
          ],
          recap: [
            'PCA finds the directions of greatest variance in data.',
            'The components are perpendicular; their variances add to the total.',
            'Keeping a few components compresses data with little loss.',
          ],
        },
        {
          id: 'recommend',
          title: 'Recommendations',
          summary: 'People like you liked…',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Ratings as vectors',
              body: r`A streaming service knows how users rated films (1 to 5 stars):

| | Space Saga | Robot Wars | Love in Paris | Laugh Riot | Star Quest |
|---|---|---|---|---|---|
| **You** | 5 | 4 | 1 | 2 | ? |
| Ana | 4 | 5 | 2 | 1 | 5 |
| Ben | 1 | 2 | 5 | 4 | 2 |
| Cy | 3 | 3 | 3 | 3 | 3 |
| Dee | 5 | 5 | 1 | 1 | 4 |

Will you like *Star Quest*? **Collaborative filtering** looks for users with similar taste and uses their ratings. Each user's ratings form a vector, and similar users have vectors pointing in similar directions.`,
            },
            {
              type: 'numeric',
              title: 'Cosine similarity',
              prompt: r`The **cosine similarity** of two rating vectors is $\frac{\mathbf a \cdot \mathbf b}{|\mathbf a|\,|\mathbf b|}$, the cosine of the angle between them. Using the first four films, compute it for You $(5, 4, 1, 2)$ and Ben $(1, 2, 5, 4)$. (3 decimal places.)`,
              answer: cosine(RATINGS.You, RATINGS.Ben),
              tol: 0.002,
              wrong: [{ v: 26, why: r`That's the dot product. Divide by the lengths: $|\mathbf a| = |\mathbf b| = \sqrt{46}$.` }, { v: 0, why: 'All the ratings are positive, so the cosine can’t be 0 or negative here.' }],
              explain: r`$\mathbf a \cdot \mathbf b = 5 + 8 + 5 + 8 = 26$, and both lengths are $\sqrt{25 + 16 + 1 + 4} = \sqrt{46}$. So the similarity is $\frac{26}{46} \approx 0.565$. That seems fairly similar, though Ben's taste is the opposite of yours! Raw ratings are all positive, which makes every pair look somewhat alike.`,
            },
            {
              type: 'explain',
              title: 'Centring the ratings',
              body: r`Some people rate everything generously, others harshly. Subtract each user's average rating first, so that a rating means "liked it **more** or **less** than usual". The cosine of these **centred** vectors is the **correlation**: $+1$ for identical taste, $-1$ for opposite taste, $0$ for unrelated.

You $(5, 4, 1, 2)$ has average 3, so centred: $(2, 1, -2, -1)$.`,
            },
            {
              type: 'interactive',
              title: 'Your taste twin',
              prompt: r`Pick the user whose (centred) ratings correlate **most** with yours.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: -1, ymax: 1, grid: false, height: 260, axes: { ylabel: 'correlation with you', yticks: 0.5, xticks: 0 },
                params: { k: { min: 0, max: 3, step: 1, value: 2, label: 'user', color: 'violet', format: (v) => OTHERS[v] } },
                under: ({ plot, p, s }) => OTHERS.map((u, i) => { const v = corrSim(RATINGS.You, RATINGS[u]); return s('rect', { x: plot.X(i + 0.2), y: plot.Y(Math.max(0, v)), width: plot.X(0.6) - plot.X(0), height: Math.abs(plot.Y(0) - plot.Y(v)), rx: 4, class: i === p.k ? 'fl-violet' : 'fl-surface', stroke: i === p.k ? 'none' : 'var(--line-2)' }); }),
                extra: ({ plot, s }) => OTHERS.map((u, i) => s('text', { x: plot.X(i + 0.5), y: plot.Y(-1) + 20, 'text-anchor': 'middle', class: 'lbl', style: FS(14), text: u })),
                readout: (p) => `correlation of ${OTHERS[p.k]} with you: **${fix(corrSim(RATINGS.You, RATINGS[OTHERS[p.k]]), 2)}**`,
                goal: (p) => OTHERS[p.k] === 'Dee',
                solution: { k: 3 },
                hint: 'Look for someone who loved the films you loved and disliked the ones you disliked.',
              },
              explain: r`Dee correlates about $0.95$ with you: loves the sci-fi, dislikes the romance and comedy. Ana is close behind ($0.8$). Ben scores exactly $-1$: his centred ratings are yours with every sign flipped, perfectly opposite taste. Cy rates everything 3, so centred, Cy's vector is all zeros and tells us nothing (the correlation is undefined, shown as 0).`,
            },
            {
              type: 'numeric',
              title: 'Predict the rating',
              prompt: r`Predict your rating of *Star Quest* as the average of Ana's and Dee's ratings for it (your two most similar users), weighting each by their correlation with you: Ana 0.8 (rated it 5), Dee 0.95 (rated it 4). (2 decimal places.)`,
              unit: 'stars',
              answer: (0.8 * 5 + 0.95 * 4) / 1.75,
              tol: 0.01,
              wrong: [{ v: 4.5, why: 'That’s the plain average. Weight each rating by the similarity: Dee counts a little more.' }, { v: 7.8, tol: 0.01, why: 'Divide by the total weight, 0.8 + 0.95.' }],
              explain: r`$\frac{0.8 \times 5 + 0.95 \times 4}{0.8 + 0.95} = \frac{7.8}{1.75} \approx 4.46$ stars: recommend it! Real systems do the same over millions of users, often finding hidden "taste dimensions" (like a sci-fi-versus-romance axis) with techniques related to PCA.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The cold start',
              prompt: 'A brand-new film has no ratings yet. What problem does collaborative filtering face?',
              choices: [
                { t: 'No one’s ratings can be used to recommend it, so it may never get recommended or rated', ok: true },
                { t: 'It will be recommended to everyone', why: 'With no ratings, there’s no evidence that anyone would like it.' },
                { t: 'None: similarity between users still works', why: 'User similarity needs ratings of the film itself to make a prediction for it.' },
              ],
              explain: r`This is the **cold-start problem**. Services combine collaborative filtering with **content** information (genre, actors, descriptions) and deliberately show some new items to gather ratings: a balance between exploiting what's known and exploring what isn't.`,
            },
          ],
          recap: [
            'Users’ ratings are vectors; similar taste means similar directions.',
            'Centre ratings first; the cosine then becomes a correlation.',
            'Predict ratings as similarity-weighted averages of similar users.',
          ],
        },
      ],
    },
  ],
};
