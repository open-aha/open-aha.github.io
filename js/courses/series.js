import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 4 decimals, so they never change length (DESIGN.md, Live numbers)
const f4 = (v) => fix(v, 4);
const fib = (n) => { let a = 1, b = 1; for (let i = 2; i < n; i++) [a, b] = [b, a + b]; return n <= 2 ? 1 : b; };

// mortgage: £100,000 at 5% a year (monthly interest 5/12 %), paid monthly
const MR = 0.05 / 12;
const balanceAfter = (P, months) => { let b = 100000; for (let i = 0; i < months; i++) b = b * (1 + MR) - P; return b; };
// Leibniz series partial sums ×4
const LEIB = (() => { const out = [0]; let sum = 0; for (let n = 0; n < 400; n++) { sum += (n % 2 ? -1 : 1) / (2 * n + 1); out.push(4 * sum); } return out; })();

// split an equilateral triangle into four: colour the bottom-left, bottom-right and middle quarters, then repeat inside the top quarter
const QUARTER_TRIS = (() => {
  const out = [];
  let a = [0, 0], b = [1, 0], c = [0.5, Math.sqrt(3) / 2];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  for (let k = 0; k < 8; k++) {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    out.push([[a, ab, ca], [ab, b, bc], [ab, bc, ca]]);
    [a, b, c] = [ca, bc, c];
  }
  return out;
})();
const quarterN = (t) => Math.min(8, Math.floor(Math.max(0, t - 0.5) / 1.1));

export default {
  id: 'series',
  subject: 'math',
  title: 'Sequences & Series',
  level: 'Intermediate',
  cover: 'series',
  tagline: 'Patterns that go on forever, and sums that (sometimes) settle down.',
  description: r`Add up 1 to 100 in seconds like Gauss, fold paper to the Moon, resolve Zeno's paradox, discover a sum that grows forever but agonizingly slowly, meet Fibonacci, the golden ratio and the number $e$, work out what a mortgage really costs, and add fractions to reach $\pi$.`,
  prereq: 'Functions & Graphs',
  chapters: [
    {
      title: 'Sequences',
      summary: 'Adding the same amount, or multiplying by it.',
      lessons: [
        {
          id: 'arithmetic',
          title: 'Arithmetic Sequences',
          summary: 'Gauss’s trick',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'The schoolboy’s sum',
              body: r`A famous story says that when Carl Friedrich Gauss was a schoolboy, his teacher told the class to add up all the numbers from 1 to 100, expecting it to keep them busy. Gauss had the answer almost immediately.`,
              prompt: r`What is $1 + 2 + 3 + \cdots + 100$?`,
              answer: 5050,
              wrong: [{ v: 10100, why: r`Pairing gives 100 pairs each summing to 101 only if you count every number twice. Halve it.` }, { v: 5000, why: 'Close! Try pairing the first and last numbers: 1 + 100, 2 + 99, …' }],
              hint: 'Pair the first number with the last, the second with the second-to-last…',
              explain: r`Pair them up: $1 + 100 = 101$, $2 + 99 = 101$, … There are 50 such pairs, so the total is $50 \times 101 = 5050$.`,
            },
            {
              type: 'explain',
              title: 'Picture the trick',
              body: r`Stack the numbers as a staircase. A second, upside-down copy fills a rectangle exactly. That rectangle is $n$ wide and $n + 1$ tall, so each staircase is half of it:
$$1 + 2 + \cdots + n = \frac{n(n+1)}{2}$$`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 10.3, ymin: -0.3, ymax: 11.3, grid: false, axes: false, maxWidth: 440,
                params: { n: { min: 2, max: 10, step: 1, value: 6, label: '$n$', color: 'blue', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let i = 1; i <= p.n; i++) {
                    for (let j = 0; j < p.n + 1; j++) {
                      const mine = j < i;
                      els.push(s('rect', { x: plot.X(i - 1) + 1, y: plot.Y(j + 1) + 1, width: plot.X(1) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(1) - 2, rx: 3, class: mine ? 'fl-blue' : 'fl-coral', opacity: mine ? 0.8 : 0.35 }));
                    }
                  }
                  return els;
                },
                readout: (p) => r`$1 + \cdots + ${p.n} = \frac{${p.n} \times ${p.n + 1}}{2} = ${(p.n * (p.n + 1)) / 2}$`,
              },
            },
            {
              type: 'explain',
              title: 'Arithmetic sequences',
              body: r`A sequence that goes up by the same amount $d$ each time is **arithmetic**: $a, a + d, a + 2d, \ldots$

- The $n$th term is $a_n = a + (n - 1)d$.
- The sum of the first $n$ terms is $n \times$ (the average of the first and last terms):
$$S_n = \frac{n\,(a_1 + a_n)}{2}$$`,
            },
            {
              type: 'numeric',
              title: 'The 50th term',
              prompt: r`What is the 50th term of $3, 7, 11, 15, \ldots$?`,
              answer: 199,
              wrong: [{ v: 203, why: r`$a_{50} = 3 + 49 \times 4$. There are 49 steps from the 1st term to the 50th, not 50.` }, { v: 200, why: r`$3 + 49 \times 4 = 199$.` }],
              explain: r`$a_{50} = 3 + (50 - 1) \times 4 = 3 + 196 = 199$.`,
            },
            {
              type: 'numeric',
              title: 'Every fourth number',
              prompt: r`Find $3 + 7 + 11 + \cdots + 99$.`,
              answer: 1275,
              wrong: [{ v: 1224, why: r`Count the terms carefully: $(99 - 3)/4 + 1 = 25$.` }],
              explain: r`There are $\frac{99 - 3}{4} + 1 = 25$ terms with average $\frac{3 + 99}{2} = 51$, so the sum is $25 \times 51 = 1{,}275$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Odd numbers',
              prompt: r`What is the sum of the first 20 odd numbers, $1 + 3 + 5 + \cdots + 39$?`,
              answer: 400,
              wrong: [{ v: 420, why: r`$\frac{20 \times (1 + 39)}{2} = 400$.` }, { v: 800, why: 'Divide by 2 for the average.' }],
              explain: r`$\frac{20 \times (1 + 39)}{2} = 400 = 20^2$. In fact, the sum of the first $n$ odd numbers is always $n^2$. Each odd number adds an L-shaped layer around a square.`,
            },
          ],
          recap: [
            r`Arithmetic sequence: $a_n = a + (n-1)d$.`,
            r`Sum = number of terms × average of the first and last terms. In particular, $1 + \cdots + n = \frac{n(n+1)}{2}$.`,
            r`The sum of the first $n$ odd numbers is $n^2$.`,
          ],
        },
        {
          id: 'geometric',
          title: 'Geometric Sequences',
          summary: 'Multiplying each time',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Fold to the Moon',
              body: r`A sheet of paper is about 0.1 mm thick. Each fold doubles the thickness. (In practice you can only fold paper about 7 times, but imagine you could keep going.)`,
              prompt: 'About how many folds would it take for the stack to reach the Moon, 384,000 km away?',
              cols: 2,
              choices: [
                { t: 'About 42', ok: true },
                { t: 'About 1,000', why: r`Doubling grows incredibly fast. $2^{42}$ is about 4.4 trillion.` },
                { t: 'About 1 million', why: 'Far fewer! Each fold doubles the whole stack.' },
                { t: 'About 100', why: r`$2^{100} \times 0.1$ mm is far, far beyond the observable universe.` },
              ],
              explain: r`$0.1 \text{ mm} \times 2^{42} \approx 0.1 \times 4.4 \times 10^{12}$ mm $= 440{,}000$ km. That's past the Moon after just 42 folds.`,
            },
            {
              type: 'explain',
              title: 'Geometric sequences',
              body: r`Multiply by the same **ratio** $r$ each time: $a, ar, ar^2, ar^3, \ldots$ This is a **geometric** sequence.

- The $n$th term is $a_n = a\,r^{n-1}$.
- The sum of the first $n$ terms is
$$S_n = a\,\frac{r^n - 1}{r - 1}$$

Here's why: $S - rS$ cancels every term except the first and the last.`,
            },
            {
              type: 'numeric',
              title: 'Rice on a chessboard',
              body: r`A legend tells of a king who offered a reward to the inventor of chess. The inventor asked for 1 grain of rice on the first square, 2 on the second, 4 on the third, doubling across all 64 squares.`,
              prompt: r`How many grains are on the last (64th) square, as a power of 2? Enter the exponent.`,
              lhs: r`$2^{?}$, $\; ? =$`,
              answer: 63,
              wrong: [{ v: 64, why: r`Square 1 has $2^0$, square 2 has $2^1$… so square 64 has $2^{63}$.` }],
              explain: r`Square $k$ holds $2^{k-1}$ grains, so square 64 has $2^{63} \approx 9.2 \times 10^{18}$. The whole board holds $2^{64} - 1 \approx 1.8 \times 10^{19}$ grains, far more than all the rice ever grown.`,
            },
            {
              type: 'numeric',
              title: 'Sum a geometric sequence',
              prompt: r`What is $3 + 6 + 12 + 24 + 48 + 96$?`,
              answer: 189,
              wrong: [{ v: 192, why: r`$S = 3 \cdot \frac{2^6 - 1}{2 - 1} = 3 \times 63$.` }],
              explain: r`$a = 3$, $r = 2$, $n = 6$: $S = 3 \times \frac{64 - 1}{1} = 189$.`,
            },
            {
              type: 'interactive',
              title: 'Adding up halves and more',
              body: r`The bars are the terms $1, r, r^2, r^3, \dots$ stacked end to end. For $|r| < 1$ the total creeps up to $\frac{1}{1-r}$ but never passes it. Find the ratio whose infinite sum is exactly **4**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10.5, ymin: 0, ymax: 30, grid: false, height: 260, axes: { xlabel: 'number of terms added', ylabel: 'running total', xticks: 2, yticks: 5 },
                params: { r: { min: 0.05, max: 0.95, step: 0.01, value: 0.5, label: 'ratio r', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x, p) => 1 / (1 - p.r), color: 'teal', dash: true }],
                extra: ({ plot, p, s }) => { const out = []; let t = 0; for (let k = 0; k < 10; k++) { const a = p.r ** k; out.push(s('rect', { x: plot.X(k + 0.6), y: plot.Y(t + a), width: plot.X(0.8) - plot.X(0), height: plot.Y(t) - plot.Y(t + a), class: 'fl-violet', opacity: 0.45 + 0.05 * k }), s('rect', { x: plot.X(k + 0.6), y: plot.Y(t), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(t), class: 'fl-violet-soft' })); t += a; } return out; },
                readout: (p) => { let t = 0; for (let k = 0; k < 10; k++) t += p.r ** k; return `after 10 terms: **${t.toFixed(3)}** · the infinite sum: **${(1 / (1 - p.r)).toFixed(3)}**`; },
                goal: (p) => Math.abs(p.r - 0.75) < 0.001,
                hint: 'Solve 1 / (1 − r) = 4.',
                solution: { r: 0.75 },
              },
              explain: r`$\frac{1}{1 - 0.75} = 4$. The closer $r$ gets to 1, the slower the terms shrink and the larger the sum; at $r = 0.95$ it is 20, but ten terms only reach 8. At $r = 1$ or beyond, the sum grows without limit.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Bouncing ball',
              prompt: 'A ball is dropped from 10 m. Each bounce reaches 60% of the previous height. How high does it rise after the 3rd bounce?',
              unit: 'm',
              answer: 10 * 0.6 ** 3,
              tol: 0.005,
              wrong: [{ v: 3.6, tol: 0.005, why: r`That's the height after 2 bounces: $10 \times 0.6^2$. One more bounce.` }, { v: 2.16 * 0.6, tol: 0.005, why: r`After 3 bounces: $10 \times 0.6^3$.` }],
              explain: r`Each bounce multiplies by 0.6: $10 \times 0.6^3 = 10 \times 0.216 = 2.16$ m.`,
            },
          ],
          recap: [
            r`Geometric sequence: $a_n = ar^{n-1}$.`,
            r`Sum of the first $n$ terms: $S_n = a\frac{r^n - 1}{r - 1}$.`,
            'Repeated doubling (or halving) gets huge (or tiny) astonishingly fast.',
          ],
        },
      ],
    },
    {
      title: 'Infinite Series',
      summary: 'Adding forever.',
      lessons: [
        {
          id: 'zeno',
          title: 'Zeno’s Paradox',
          summary: 'Infinite sums with finite answers',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Can you reach the wall?',
              body: r`The ancient Greek philosopher Zeno argued: to walk to a wall, you must first cover half the distance, then half of what remains, then half of that, and so on forever. Infinitely many steps can never be finished, so you can never reach the wall!`,
              prompt: 'What’s wrong with the argument?',
              choices: [
                { t: 'Infinitely many shrinking steps can add up to a finite distance, covered in a finite time', ok: true },
                { t: 'Nothing: motion is an illusion', why: 'You do reach walls! The flaw is assuming that infinitely many pieces must add up to an infinite total.' },
                { t: 'You can’t really divide a distance in half forever', why: 'Mathematically you can. The point is that the halves add up to a finite total.' },
              ],
              explain: r`The pieces $\tfrac12 + \tfrac14 + \tfrac18 + \cdots$ get smaller fast enough that their sum is exactly 1. Each step also takes proportionally less time, so the total time is finite too.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Filling a square',
              body: r`Shade half a square, then half of what's left, then half of that…`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.05, xmax: 1.05, ymin: -0.05, ymax: 1.05, grid: false, axes: false, maxWidth: 400,
                params: { n: { min: 1, max: 14, step: 1, value: 4, label: 'terms', color: 'violet', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('rect', { x: plot.X(0), y: plot.Y(1), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 })];
                  let x = 0, y = 0, w = 1, hgt = 1;
                  const cols = ['fl-blue', 'fl-coral', 'fl-teal', 'fl-amber', 'fl-violet', 'fl-pink'];
                  for (let k = 0; k < p.n; k++) {
                    let rect;
                    if (k % 2 === 0) { rect = [x, y, w / 2, hgt]; x += w / 2; w /= 2; }
                    else { rect = [x, y, w, hgt / 2]; y += hgt / 2; hgt /= 2; }
                    els.push(s('rect', { x: plot.X(rect[0]), y: plot.Y(rect[1] + rect[3]), width: plot.X(rect[2]) - plot.X(0), height: plot.Y(0) - plot.Y(rect[3]), class: cols[k % cols.length], opacity: 0.75, stroke: 'var(--card)', 'stroke-width': 1 }));
                  }
                  return els;
                },
                readout: (p) => r`$\tfrac12 + \tfrac14 + \cdots + \tfrac{1}{2^{${p.n}}} = ${f4(1 - 2 ** -p.n)}$`,
              },
              after: r`The shaded area gets as close to the whole square as you like, but never goes over. The infinite sum **equals 1**.`,
            },
            {
              type: 'explain',
              title: 'Infinite geometric series',
              body: r`For a ratio between $-1$ and $1$, the term $r^n$ shrinks to zero, and the sum formula becomes:
$$a + ar + ar^2 + \cdots = \frac{a}{1 - r} \qquad (|r| < 1)$$
Check: $\tfrac12 + \tfrac14 + \cdots = \frac{1/2}{1 - 1/2} = 1$. ✓

When $|r| \ge 1$ the terms don't shrink, and the sum blows up. It **diverges**.`,
            },
            {
              type: 'numeric',
              title: 'Sum to infinity',
              prompt: r`What is $1 + \tfrac13 + \tfrac19 + \tfrac{1}{27} + \cdots$? (A fraction is fine.)`,
              answer: 1.5,
              wrong: [{ v: 3, why: r`$\frac{a}{1 - r} = \frac{1}{1 - 1/3} = \frac{1}{2/3}$.` }, { v: 4 / 3, tol: 0.01, why: r`That's just the first two terms. Use $\frac{a}{1 - r}$ with $a = 1$, $r = \frac13$.` }],
              explain: r`$a = 1$ and $r = \tfrac13$: $\frac{1}{1 - 1/3} = \frac{3}{2}$.`,
            },
            {
              type: 'numeric',
              title: 'Thirds',
              prompt: r`Find the sum $\frac13 + \frac19 + \frac{1}{27} + \cdots$.`,
              answer: 0.5,
              tol: 0.001,
              explain: r`First term $a = \frac13$, ratio $r = \frac13$: $\frac{a}{1 - r} = \frac{1/3}{2/3} = \frac12$.`,
            },
            { /*anim2:series*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A quarter, and a quarter of a quarter',
              body: r`Here's a picture of $\frac14 + \frac1{16} + \frac1{64} + \cdots$. Cut a triangle of area 1 into four quarters. Colour three of them {blue:blue}, {coral:coral} and {amber:amber}; then do the same inside the fourth, and so on.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.06, xmax: 1.06, ymin: -0.05, ymax: 0.92, grid: false, axes: false, maxWidth: 380,
                animate: { param: 't', speed: 1, max: 12, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const n = quarterN(p.t), cols = ['blue', 'coral', 'amber'], els = [];
                  const P = (tri) => tri.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z';
                  els.push(s('path', { d: P([[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]]), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
                  QUARTER_TRIS.slice(0, n).forEach((stage) => stage.forEach((tri, j) => els.push(s('path', { d: P(tri), class: `fl-${cols[j]}`, opacity: 0.7, stroke: 'var(--card)', 'stroke-width': 1, 'stroke-linejoin': 'round' }))));
                  return els;
                },
                readout: (p) => { const n = quarterN(p.t); let sum = 0; for (let k = 1; k <= n; k++) sum += 0.25 ** k; return n === 0 ? 'a triangle of area 1' : `{blue:blue area} so far $= ${fix(sum, 6)}$ · each colour has the same area`; },
              },
              after: r`At every stage the three colours get identical triangles, so the blue, coral and amber areas are always equal, and together they fill the whole triangle (whatever is left uncoloured shrinks to a point). Three equal parts of 1: so the blue area, $\frac14 + \frac1{16} + \frac1{64} + \cdots$, must be exactly $\frac13$. The formula agrees: $\frac{1/4}{1 - 1/4} = \frac13$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Point nine recurring',
              prompt: r`Is $0.999\ldots$ (nines forever) equal to 1?`,
              choices: [
                { t: 'Yes, exactly', ok: true },
                { t: 'No, it’s infinitesimally less than 1', why: r`It's the series $0.9 + 0.09 + 0.009 + \cdots$, with $a = 0.9$ and $r = 0.1$, which sums to exactly $\frac{0.9}{0.9} = 1$.` },
                { t: 'It’s not a real number', why: r`It's a perfectly good real number: another way to write 1.` },
              ],
              explain: r`$0.999\ldots = 0.9 + 0.09 + 0.009 + \cdots = \frac{0.9}{1 - 0.1} = 1$. Another way to see it: if they were different, some number would have to fit between them, and there isn't one. Many numbers have two decimal spellings: $0.4999\ldots = 0.5$ too.`,
            },
          ],
          recap: [
            r`An infinite sum can have a finite value, like $\tfrac12 + \tfrac14 + \cdots = 1$.`,
            r`$\sum ar^k = \frac{a}{1-r}$ when $|r| < 1$. Otherwise the sum diverges.`,
            r`$0.999\ldots = 1$ exactly.`,
          ],
        },
        {
          id: 'harmonic',
          title: 'Forever, Slowly',
          summary: 'The harmonic series',
          icon: 'clock',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Shrinking terms',
              prompt: r`The terms of $1 + \tfrac12 + \tfrac13 + \tfrac14 + \cdots$ shrink toward zero. Does the sum settle on a finite value?`,
              cols: 2,
              choices: [
                { t: 'No, it grows forever', ok: true },
                { t: 'Yes, around 2', why: 'Shrinking terms aren’t enough. These terms shrink too slowly.' },
                { t: 'Yes, around 10', why: 'It passes 10 after about 12,000 terms, and keeps going.' },
              ],
              explain: r`Surprisingly, this **harmonic series** grows without limit, though incredibly slowly. Terms shrinking to zero is **necessary** for a sum to converge, but it isn't enough.`,
            },
            {
              type: 'explain',
              title: 'Oresme’s proof',
              body: r`Around 1350, Nicole Oresme grouped the terms:
$$1 + \tfrac12 + \underbrace{\tfrac13 + \tfrac14}_{> \frac12} + \underbrace{\tfrac15 + \cdots + \tfrac18}_{> \frac12} + \underbrace{\tfrac19 + \cdots + \tfrac{1}{16}}_{> \frac12} + \cdots$$
Each group has twice as many terms as the last, and each adds up to more than $\tfrac12$. There are infinitely many groups, so infinitely many halves: the sum is unbounded.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch it crawl',
              body: r`Compare the partial sums of the harmonic series with $\tfrac12 + \tfrac14 + \tfrac18 + \cdots$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1000, ymin: 0, ymax: 8, grid: 100, gridY: 1, height: 300, axes: { xlabel: 'number of terms', ylabel: 'sum' },
                params: { N: { min: 10, max: 1000, step: 10, value: 100, label: '$N$', color: 'coral', format: (v) => `${v}` } },
                curves: [
                  { f: (x) => { let s2 = 0; const n = Math.floor(x); for (let k = 1; k <= n; k++) s2 += 1 / k; return s2; }, color: 'coral', from: () => 1, to: (p) => p.N },
                  { f: (x) => 1 - 2 ** -Math.floor(x), color: 'teal', from: () => 1, to: (p) => p.N },
                ],
                readout: (p) => {
                  let s2 = 0;
                  for (let k = 1; k <= p.N; k++) s2 += 1 / k;
                  return r`$\coral{1 + \tfrac12 + \cdots + \tfrac1{${p.N}} = ${f4(s2)}}$ $\quad \teal{\text{halves} \to 1}$`;
                },
              },
              after: r`The harmonic sum grows roughly like $\ln N$: you need about 12,400 terms to pass 10, and around $1.5 \times 10^{43}$ terms to pass 100. But it never stops growing.`,
            },
            {
              type: 'mcq',
              title: 'Leaning tower of books',
              body: r`You stack identical books, each one sticking out past the one below as far as balance allows. With $n$ books, the top can overhang the bottom book by $\tfrac12\left(1 + \tfrac12 + \cdots + \tfrac1n\right)$ book-lengths.`,
              prompt: 'With enough books, how far can the overhang go?',
              choices: [
                { t: 'As far as you like', ok: true },
                { t: 'At most 1 book-length', why: 'The overhang is half a harmonic sum, and that grows without limit.' },
                { t: 'At most 2 book-lengths', why: 'It can exceed any length, given enough books.' },
              ],
              explain: r`Half of the harmonic series is still unbounded. With 4 books, the top one already overhangs by more than a full book-length ($\tfrac12 \times 2.083 \approx 1.04$). To reach 3 book-lengths, you'd need 227 books.`,
            },
            { /*anim:series*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The harmonic staircase',
              body: r`Here is the best way to stack books (each one book-length long) over the edge of a table. Each book sticks out past the one below by $\frac12$, $\frac14$, $\frac16$, $\frac18$, … of a book. Watch the stack grow from the bottom.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 2.0, ymin: -0.15, ymax: 1.45, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 0.9, max: 13, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const N = Math.min(10, 1 + Math.floor(p.t)), f = Math.min(1, (p.t % 1) * 1.6), h = 0.12, els = [];
                  // book k from the top (k = 1..N) sticks out to sum_{j=k..N} 1/(2j) past the table edge
                  const right = (k, n) => { let r = 0; for (let j = k; j <= n; j++) r += 1 / (2 * j); return r; };
                  els.push(s('rect', { x: plot.X(-1.6), y: plot.Y(0), width: plot.X(0) - plot.X(-1.6), height: plot.Y(-0.15) - plot.Y(0), class: 'fl-muted' }));
                  for (let k = 1; k <= N; k++) {
                    // ease each book from its place in the smaller stack (one book fewer underneath) to its new place
                    const from = k < N ? right(k, N - 1) : right(N, N) - 0.4, x = from + (right(k, N) - from) * (p.t < 10 ? f * f * (3 - 2 * f) : 1), y = (N - k) * h;
                    els.push(s('rect', { x: plot.X(x - 1), y: plot.Y(y + h), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(h) - 1, rx: 2, class: k % 2 ? 'fl-blue' : 'fl-coral', opacity: 0.85 }));
                  }
                  const over = right(1, N);
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(0), y2: plot.Y(1.4), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  els.push(s('line', { x1: plot.X(1), x2: plot.X(1), y1: plot.Y(0), y2: plot.Y(1.4), stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  els.push(s('text', { x: plot.X(1) + 6, y: plot.Y(1.3), class: 'halo-text', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px));fill:var(--amber);font-weight:700', text: 'one whole book past the edge' }));
                  return els;
                },
                readout: (p) => { const N = Math.min(10, 1 + Math.floor(p.t)); let r = 0; for (let j = 1; j <= N; j++) r += 1 / (2 * j); return `${N} ${N === 1 ? 'book' : 'books'}: the top book reaches ${fix(r, 3)} book-lengths past the table`; },
              },
              after: r`The total overhang is half the harmonic sum: $\frac12\left(1 + \frac12 + \frac13 + \cdots + \frac1N\right)$. With 4 books the top one is entirely clear of the table ($\frac{25}{24}$ of a book). Because the harmonic series grows forever, so does the overhang: any distance is possible, but you need about 31 books to reach 2 book-lengths and over 200 for 3. The stack is always just balanced: the centre of mass of the books above each one sits exactly on its edge.`,
            },
            {
              type: 'numeric',
              title: 'Passing three',
              prompt: r`The harmonic sums go $H_1 = 1$, $H_2 = 1.5$, $H_3 \approx 1.83$, … What is the first $n$ for which $H_n = 1 + \frac12 + \cdots + \frac1n$ exceeds 3?`,
              answer: 11,
              explain: r`$H_{10} \approx 2.929$ and $H_{11} \approx 3.020$, so $n = 11$. To pass 10 you need over 12,000 terms, and to pass 100 about $1.5 \times 10^{43}$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Squares converge',
              prompt: r`What about $1 + \tfrac14 + \tfrac19 + \tfrac{1}{16} + \cdots$ (one over the square numbers)?`,
              choices: [
                { t: r`It converges, to $\pi^2/6 \approx 1.645$`, ok: true },
                { t: 'It diverges, like the harmonic series', why: 'These terms shrink much faster than 1/n, fast enough for the sum to settle.' },
                { t: 'It converges, to exactly 2', why: r`It is less than 2, but it's not exactly 2.` },
              ],
              explain: r`In 1734, Leonhard Euler found that $\sum \frac{1}{n^2} = \frac{\pi^2}{6}$, an astonishing appearance of $\pi$ in a sum with no circles in sight. This was called the **Basel problem**, and it had stumped mathematicians for about 90 years.`,
            },
          ],
          recap: [
            r`Terms shrinking to zero is necessary for a sum to converge, but not enough.`,
            r`The harmonic series $\sum \frac1n$ diverges (Oresme's grouping argument).`,
            r`$\sum \frac{1}{n^2}$ converges, to $\frac{\pi^2}{6}$.`,
          ],
        },
      ],
    },
    {
      title: 'Famous Numbers',
      summary: 'Fibonacci, φ and e.',
      lessons: [
        {
          id: 'fibonacci',
          title: 'Fibonacci & φ',
          summary: 'Rabbits, spirals and the golden ratio',
          icon: 'sparkle',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Next in line',
              body: r`$1, 1, 2, 3, 5, 8, 13, 21, \ldots$ Each number is the sum of the two before it.`,
              prompt: 'What comes after 21?',
              answer: 34,
              wrong: [{ v: 42, why: r`Add the two previous numbers: $13 + 21$.` }],
              explain: r`$13 + 21 = 34$. These are the **Fibonacci numbers**, named after Leonardo of Pisa (known as Fibonacci). He described them in 1202 in a puzzle about breeding rabbits.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Ratios of neighbours',
              body: r`Divide each Fibonacci number by the one before it. Watch the ratio as you go further along.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 21, ymin: 0.8, ymax: 2.2, grid: 1, gridY: 0.2, height: 280, axes: { xlabel: 'n', ylabel: 'ratio', yfmt: (v) => v.toFixed(1) },
                params: { n: { min: 2, max: 20, step: 1, value: 6, label: '$n$', color: 'amber', format: (v) => `${v}` } },
                curves: [{ f: () => (1 + Math.sqrt(5)) / 2, color: 'muted', dash: true, width: 1.5 }],
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let k = 2; k <= p.n; k++) els.push(s('circle', { cx: plot.X(k), cy: plot.Y(fib(k + 1) / fib(k)), r: 5, class: 'fl-amber', stroke: 'var(--card)', 'stroke-width': 2 }));
                  return els;
                },
                readout: (p) => r`$\dfrac{F_{${p.n + 1}}}{F_{${p.n}}} = \dfrac{${fib(p.n + 1)}}{${fib(p.n)}} = ${f4(fib(p.n + 1) / fib(p.n))}$`,
              },
              after: r`The ratios zig-zag toward $1.6180\ldots$, the **golden ratio** $\varphi$.`,
            },
            {
              type: 'explain',
              title: 'The golden ratio',
              body: r`If the ratio $\frac{F_{n+1}}{F_n}$ settles on some value $x$, then from $F_{n+1} = F_n + F_{n-1}$, dividing by $F_n$ gives
$$x = 1 + \frac{1}{x} \quad\Rightarrow\quad x^2 - x - 1 = 0 \quad\Rightarrow\quad x = \frac{1 + \sqrt5}{2} \approx 1.618.$$
That's $\varphi$. Fibonacci numbers show up in nature: count the spirals in a sunflower head or a pine cone and you'll often get neighbouring Fibonacci numbers, such as 34 and 55.`,
            },
            {
              type: 'numeric',
              title: 'A neat property',
              prompt: r`$\varphi = \frac{1 + \sqrt5}{2}$. What is $\varphi^2 - \varphi$?`,
              answer: 1,
              wrong: [{ v: 0, why: r`$\varphi$ satisfies $x^2 - x - 1 = 0$, so $\varphi^2 - \varphi = 1$.` }],
              explain: r`From $x^2 = x + 1$: $\varphi^2 - \varphi = 1$. So $\varphi^2 \approx 2.618$, exactly $\varphi + 1$.`,
            },
            {
              type: 'numeric',
              title: 'Cassini’s identity',
              prompt: r`Compute $F_6^2 - F_5 F_7$ using the Fibonacci numbers $F_5 = 5$, $F_6 = 8$, $F_7 = 13$.`,
              answer: -1,
              explain: r`$64 - 65 = -1$. Cassini’s identity says $F_n^2 - F_{n-1}F_{n+1} = (-1)^{n-1}$: always $\pm 1$. It’s behind a famous "paradox" in which an 8 × 8 square is cut up and rearranged into a 5 × 13 rectangle that seems to have one extra square.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sum of Fibonaccis',
              prompt: r`Add the first 8 Fibonacci numbers: $1 + 1 + 2 + 3 + 5 + 8 + 13 + 21$. (Then compare with $F_{10}$.)`,
              answer: 54,
              wrong: [{ v: 55, why: 'Add them carefully: you should get one less than 55.' }],
              explain: r`The total is 54, which is $F_{10} - 1 = 55 - 1$. In general, $F_1 + \cdots + F_n = F_{n+2} - 1$, a pattern you can prove using the defining rule.`,
            },
          ],
          recap: [
            r`Fibonacci: $F_{n+1} = F_n + F_{n-1}$.`,
            r`Ratios of neighbouring terms approach $\varphi = \frac{1+\sqrt5}{2} \approx 1.618$.`,
            r`$\varphi^2 = \varphi + 1$.`,
          ],
        },
        {
          id: 'number-e',
          title: 'The Number e',
          summary: 'Compounding without limit',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Generous bank',
              body: r`A (very generous) bank offers 100% interest per year. With \$1, compounded once a year, you'd have \$2 after a year. Compounded twice (50% every six months): $1.5^2 = \$2.25$.`,
              prompt: 'What happens if the bank compounds more and more often: monthly, daily, every second?',
              choices: [
                { t: r`The total grows, but approaches a limit of about \$2.72`, ok: true },
                { t: 'It grows without limit', why: 'More frequent compounding helps less and less. The total approaches a ceiling.' },
                { t: r`It stays at \$2.25`, why: r`Monthly gives $(1 + \tfrac{1}{12})^{12} \approx 2.613$, which is more.` },
              ],
              explain: r`$\left(1 + \tfrac1n\right)^n$ approaches $2.71828\ldots$, a number called $e$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Approaching e',
              body: r`Increase the number of compounding periods $n$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 100, ymin: 1.9, ymax: 2.8, grid: 10, gridY: 0.1, height: 280, axes: { xlabel: 'n', ylabel: '', yfmt: (v) => v.toFixed(1) },
                params: { n: { min: 1, max: 100, step: 1, value: 12, label: '$n$', color: 'teal', format: (v) => `${v}` } },
                curves: [{ f: () => Math.E, color: 'muted', dash: true, width: 1.5 }, { f: (x) => (1 + 1 / x) ** x, color: 'teal', from: () => 1, to: (p) => p.n }],
                points: [{ x: (p) => p.n, y: (p) => (1 + 1 / p.n) ** p.n, color: 'teal' }],
                readout: (p) => r`$\left(1 + \tfrac{1}{${p.n}}\right)^{${p.n}} = ${f4((1 + 1 / p.n) ** p.n)}$ $\quad e = 2.7183\ldots$`,
              },
            },
            {
              type: 'explain',
              title: 'e',
              body: r`$$e = \lim_{n \to \infty}\left(1 + \frac1n\right)^n = 2.718281828\ldots$$
It also equals the infinite sum $1 + 1 + \frac{1}{2!} + \frac{1}{3!} + \cdots$ (where $3! = 3 \times 2 \times 1$).

The function $e^x$ has a unique property: **it is its own derivative**. Its slope at every point equals its height. That's why $e$ appears whenever a quantity grows (or decays) at a rate proportional to its size: populations, radioactive decay, cooling coffee, continuously compounded money.`,
            },
            {
              type: 'numeric',
              title: 'Sum the series',
              prompt: r`Estimate $e$ using the first five terms: $1 + 1 + \frac12 + \frac16 + \frac{1}{24}$. Give a decimal.`,
              answer: 1 + 1 + 0.5 + 1 / 6 + 1 / 24,
              tol: 0.001,
              wrong: [{ v: 2.5, tol: 0.001, why: 'Keep going: add 1/6 and 1/24 too.' }],
              explain: r`$1 + 1 + 0.5 + 0.1667 + 0.0417 \approx 2.7083$. Already within 0.01 of $e$. The factorials grow so fast that this series converges very quickly.`,
            },
            {
              type: 'numeric',
              title: 'Mixed-up hats',
              prompt: r`$n$ people throw their hats in a pile and each takes one at random. As $n$ grows, the chance that **nobody** gets their own hat approaches $\frac1e$. What is that, to 3 decimal places?`,
              answer: 1 / Math.E,
              tol: 0.001,
              explain: r`$\frac1e \approx 0.368$. Remarkably, it barely depends on $n$: with 5 people it’s already 0.367. The number $e$ turns up wherever many small independent chances combine.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Continuous compounding',
              prompt: r`\$1000 grows at 5% per year, compounded continuously: $A = 1000\,e^{0.05t}$. How much is there after 20 years? ($e \approx 2.718$)`,
              unit: 'dollars',
              answer: 1000 * Math.E,
              tol: 1,
              wrong: [{ v: 2000, why: r`$e^{0.05 \times 20} = e^1 \approx 2.718$, not 2.` }, { v: 2653.3, tol: 1, why: r`That's yearly compounding, $1.05^{20}$. Continuous compounding gives $e^1$.` }],
              explain: r`$0.05 \times 20 = 1$, so $A = 1000\,e \approx \$2718$. Yearly compounding would give $1000 \times 1.05^{20} \approx \$2653$, a bit less.`,
            },
          ],
          recap: [
            r`$e = \lim (1 + 1/n)^n \approx 2.71828$.`,
            r`$e = \sum \frac{1}{k!}$, and $e^x$ is its own derivative.`,
            r`Continuous growth at rate $r$: $A = A_0 e^{rt}$.`,
          ],
        },
      ],
    },
    {
      title: 'Series at Work',
      summary: 'Money and π.',
      lessons: [
        {
          id: 'loans',
          title: 'Loans & Savings',
          summary: 'Geometric series in your bank account',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'Compound interest',
              body: r`Save £100 a month at a monthly interest rate $r$. After $n$ months, the first deposit has grown by a factor $(1 + r)^{n-1}$, the next by $(1 + r)^{n-2}$, and so on. The total is a **geometric series**:
$$100\left[1 + (1 + r) + (1 + r)^2 + \cdots + (1 + r)^{n-1}\right] = 100 \cdot \frac{(1 + r)^n - 1}{r}$$`,
            },
            {
              type: 'numeric',
              title: 'Ten years of saving',
              prompt: r`You save £100 a month for 10 years (120 months) at 0.4% interest per month. How much do you have? Use $100 \cdot \frac{1.004^{120} - 1}{0.004}$. (Nearest £10.)`,
              unit: '£',
              answer: Math.round((100 * (1.004 ** 120 - 1)) / 0.004 / 10) * 10,
              tol: 10,
              wrong: [{ v: 12000, why: 'That’s just the deposits, without any interest.' }],
              explain: r`$100 \times \frac{1.004^{120} - 1}{0.004} \approx £15{,}360$: the £12,000 you put in, plus about £3,360 of interest. The longer you save, the more the later terms of the series dominate.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Pay off a mortgage',
              prompt: r`You borrow £100,000 at 5% a year, charged monthly, to repay over 25 years (300 months). Each month interest is added, then you make your payment. Find the **smallest** whole-pound monthly payment that clears the loan in time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: -20000, ymax: 140000, grid: 60, gridY: 20000, height: 270, padL: 60, axes: { xlabel: 'months', ylabel: 'balance (£)', yfmt: (v) => `${v / 1000}k` },
                params: { P: { min: 400, max: 800, step: 1, value: 500, label: 'monthly payment', color: 'violet', format: (v) => `£${v}` } },
                curves: [{ f: (m, p) => balanceAfter(p.P, Math.round(m)), color: 'violet', width: 3 }, { f: () => 0, color: 'ink', width: 1 }],
                readout: (p) => `after 25 years you ${balanceAfter(p.P, 300) > 0 ? `still owe **£${Math.round(balanceAfter(p.P, 300)).toLocaleString('en-GB')}**` : `have cleared it, with **£${Math.round(-balanceAfter(p.P, 300)).toLocaleString('en-GB')}** overpaid`} · total paid £${(300 * p.P).toLocaleString('en-GB')}`,
                goal: (p) => balanceAfter(p.P, 300) <= 0 && balanceAfter(p.P - 1, 300) > 0,
                hint: r`The exact payment is $\frac{rL}{1 - (1 + r)^{-n}}$ with $r = \frac{0.05}{12}$.`,
                solution: { P: 585 },
              },
              explain: r`£585 a month (the exact figure is £584.59, from summing a geometric series). Over 25 years you pay about £175,000 in total: £75,000 of it is interest. At £500 a month, the debt would barely shrink at first, because most of each payment goes on interest.`,
            },
            {
              type: 'mcq',
              title: 'Interest-only',
              prompt: r`What monthly payment would keep the £100,000 balance exactly constant (paying only the interest)?`,
              choices: [
                { t: 'About £417, the monthly interest: 0.05 ÷ 12 × £100,000', ok: true },
                { t: '£0', why: 'Interest is added every month, so the balance would grow.' },
                { t: '£333, which is £100,000 ÷ 300', why: 'That repays the capital but ignores the interest.' },
              ],
              explain: r`$\frac{0.05}{12} \times 100{,}000 \approx £417$. Pay less and the debt grows forever; the extra £168 in the repayment mortgage is what slowly chips away at the capital.`,
            },
            {
              type: 'numeric',
              title: 'Three years at 5%',
              prompt: r`£1,000 is invested at 5% interest, compounded once a year. How much is there after 3 years, in pounds? (2 decimal places.)`,
              unit: '£',
              answer: 1000 * Math.pow(1.05, 3),
              tol: 0.01,
              explain: r`$1000 \times 1.05^3 = £1{,}157.63$. Simple interest would give only £1,150: the extra £7.63 is interest earned on interest.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The rule of 72',
              prompt: r`An investment grows by 6% a year. Using the rule of 72 (doubling time ≈ 72 ÷ percentage rate), about how many years until it doubles?`,
              unit: 'years',
              answer: 12,
              wrong: [{ v: 16.7, tol: 0.1, why: 'That’s 100 ÷ 6, ignoring compounding.' }],
              explain: r`$\frac{72}{6} = 12$ years. Exactly, $\frac{\ln 2}{\ln 1.06} \approx 11.9$ years. The rule works because $\ln 2 \approx 0.693$ and 72 has many convenient divisors.`,
            },
          ],
          recap: [
            r`Regular savings form a geometric series: total $= A\frac{(1 + r)^n - 1}{r}$.`,
            r`A loan of $L$ needs payments $\frac{rL}{1 - (1 + r)^{-n}}$.`,
            'Early payments mostly cover interest; compounding works for and against you.',
          ],
        },
        {
          id: 'pi',
          title: 'Series for π',
          summary: 'Adding fractions to reach a circle',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'An astonishing sum',
              body: r`In 1673, Gottfried Leibniz found (and Madhava, in India, had found around 1400) that
$$1 - \frac13 + \frac15 - \frac17 + \frac19 - \cdots = \frac{\pi}{4}$$
A circle hidden in the odd numbers! The terms alternate in sign and shrink towards zero, so the partial sums zig-zag ever closer to the limit.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How many terms?',
              prompt: r`The dots show 4 × (sum of the first $N$ terms). Find the **smallest** $N$ for which the estimate is within 0.01 of $\pi$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 150, ymin: 3.05, ymax: 3.25, grid: 25, gridY: 0.05, height: 260, padL: 48, axes: { xlabel: 'number of terms N', ylabel: 'estimate', yAt: 3.05, yfmt: (v) => v.toFixed(2) },
                params: { N: { min: 1, max: 150, step: 1, value: 20, slider: false } },
                curves: [{ f: () => Math.PI, color: 'coral', dash: true, width: 1.5 }, { f: () => Math.PI + 0.01, color: 'muted', dash: true, width: 1 }, { f: () => Math.PI - 0.01, color: 'muted', dash: true, width: 1 }],
                extra: ({ plot, s }) => LEIB.slice(1, 151).map((v, i) => (v > 3.05 && v < 3.25 ? s('circle', { cx: plot.X(i + 1), cy: plot.Y(v), r: 2.5, class: 'fl-ink' }) : null)).filter(Boolean),
                points: [{ x: (p) => p.N, y: (p) => Math.max(3.05, Math.min(3.25, LEIB[p.N])), drag: { x: 'N' }, color: 'violet' }],
                readout: (p) => r`$N = ${p.N}$: estimate $${LEIB[p.N].toFixed(5)}$, error $${Math.abs(LEIB[p.N] - Math.PI).toFixed(5)}$`,
                goal: (p) => Math.abs(LEIB[p.N] - Math.PI) < 0.01 && Math.abs(LEIB[p.N - 1] - Math.PI) >= 0.01,
                hint: 'The error after N terms is roughly 1/N.',
                solution: { N: 100 },
              },
              explain: r`It takes **100 terms** to get within 0.01, and a million terms for 6 decimal places: the error shrinks only like $\frac{1}{N}$. Beautiful, but painfully slow. Modern record calculations of π use series that add 14 digits with every term.`,
            },
            {
              type: 'numeric',
              title: 'Squares of reciprocals',
              prompt: r`In 1734, Leonhard Euler solved the "Basel problem": $1 + \frac14 + \frac19 + \frac{1}{16} + \cdots = \frac{\pi^2}{6}$. What is that sum, to 3 decimal places?`,
              answer: (Math.PI ** 2) / 6,
              tol: 0.0006,
              wrong: [{ v: Math.PI / 6, tol: 0.001, why: 'Square π first.' }],
              explain: r`$\frac{\pi^2}{6} \approx 1.645$. Unlike the harmonic series $1 + \frac12 + \frac13 + \cdots$, which grows forever, squaring the terms makes them shrink fast enough to converge. Euler's answer stunned mathematicians: why should π, a circle number, appear here?`,
            },
            {
              type: 'mcq',
              title: 'Order matters',
              prompt: r`The alternating series $1 - \frac12 + \frac13 - \frac14 + \cdots$ converges to $\ln 2 \approx 0.693$. If you rearrange its terms (same terms, different order), what can happen?`,
              choices: [
                { t: 'The sum can change: Riemann proved a clever rearrangement can make it add up to any number at all', ok: true },
                { t: 'Nothing: addition is commutative', why: 'For infinitely many terms, order can matter when the positive and negative parts each diverge.' },
                { t: 'It always becomes infinite', why: 'Rearrangements can give any value, finite or infinite.' },
              ],
              explain: r`The positive terms alone add to infinity, and so do the negative ones; only their careful interleaving gives $\ln 2$. Such series are called **conditionally convergent**, and Riemann's rearrangement theorem shows their sum depends on the order. Series of positive terms, like Basel's, don't have this problem.`,
            },
            {
              type: 'numeric',
              title: 'Leibniz, slowly',
              prompt: r`Leibniz’s series is $\pi = 4\left(1 - \frac13 + \frac15 - \frac17 + \cdots\right)$. What do the first **three** terms give? (2 decimal places.)`,
              answer: 4 * (1 - 1/3 + 1/5),
              tol: 0.01,
              explain: r`$4\left(1 - \frac13 + \frac15\right) \approx 3.47$. The series converges painfully slowly: after 100 terms it is still off in the second decimal place.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Only the odd squares',
              prompt: r`Using $1 + \frac14 + \frac19 + \cdots = \frac{\pi^2}{6}$, find the sum of the reciprocals of the **odd** squares, $1 + \frac19 + \frac{1}{25} + \cdots$. (3 decimal places; hint: the even squares contribute $\frac14$ of the total.)`,
              answer: (Math.PI ** 2) / 8,
              tol: 0.0006,
              wrong: [{ v: (Math.PI ** 2) / 24, tol: 0.001, why: 'That’s the even squares. Subtract them from the total.' }],
              explain: r`Even squares: $\frac14 + \frac1{16} + \cdots = \frac14 \cdot \frac{\pi^2}{6}$. So the odd squares give $\frac34 \cdot \frac{\pi^2}{6} = \frac{\pi^2}{8} \approx 1.234$.`,
            },
          ],
          recap: [
            r`Leibniz: $1 - \frac13 + \frac15 - \cdots = \frac{\pi}{4}$, but convergence is slow (error ≈ 1/N).`,
            r`Basel problem: $\sum \frac{1}{n^2} = \frac{\pi^2}{6}$.`,
            'Conditionally convergent series can be rearranged to change their sum.',
          ],
        },
      ],
    },
  ],
};
