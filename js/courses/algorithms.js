const r = String.raw;

// bubble sort on a fixed list, recording every comparison
const START = [7, 3, 10, 1, 8, 5, 12, 2, 9, 4, 11, 6];
const BUBBLE = (() => {
  const a = START.slice(), states = [{ a: a.slice(), i: -1, swapped: false }];
  for (let end = a.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      let swapped = false;
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
      }
      states.push({ a: a.slice(), i, swapped });
    }
  }
  return states;
})();

// ── shortest paths: a small road network ──
const NODES = { S: [0, 2], A: [2, 3.6], B: [2, 0.4], C: [4.2, 3.6], D: [4.2, 0.4], T: [6.2, 2] };
const EDGES = [['S', 'A', 4], ['S', 'B', 2], ['A', 'B', 1], ['A', 'C', 5], ['B', 'D', 8], ['C', 'D', 3], ['C', 'T', 3], ['D', 'T', 2]];
const DIJ = [
  { done: [], d: { S: 0 }, note: 'Start: S is 0 away; everything else unknown (∞).' },
  { done: ['S'], d: { S: 0, A: 4, B: 2 }, note: 'Settle S (0). Update its neighbours: A = 4, B = 2.' },
  { done: ['S', 'B'], d: { S: 0, A: 3, B: 2, D: 10 }, note: 'Settle the closest unsettled node, B (2). Via B: A improves to 3, D = 10.' },
  { done: ['S', 'B', 'A'], d: { S: 0, A: 3, B: 2, C: 8, D: 10 }, note: 'Settle A (3). Via A: C = 8.' },
  { done: ['S', 'B', 'A', 'C'], d: { S: 0, A: 3, B: 2, C: 8, D: 10, T: 11 }, note: 'Settle C (8). Via C: T = 11; D stays 10 (8 + 3 = 11 is worse).' },
  { done: ['S', 'B', 'A', 'C', 'D'], d: { S: 0, A: 3, B: 2, C: 8, D: 10, T: 11 }, note: 'Settle D (10). Via D: T would be 12, worse than 11.' },
  { done: ['S', 'B', 'A', 'C', 'D', 'T'], d: { S: 0, A: 3, B: 2, C: 8, D: 10, T: 11 }, note: 'Settle T (11). Done: the shortest route has length 11.' },
];
const ROUTES = [['S', 'A', 'C', 'T'], ['S', 'B', 'D', 'T'], ['S', 'B', 'A', 'C', 'T'], ['S', 'A', 'B', 'D', 'T'], ['S', 'B', 'A', 'C', 'D', 'T']];
const edgeW = (a, b) => EDGES.find(([x, y]) => (x === a && y === b) || (x === b && y === a))[2];
const routeLen = (rt) => rt.slice(1).reduce((s, v, i) => s + edgeW(rt[i], v), 0);
function drawNet(plot, s, { done = [], d = {}, route = [] } = {}) {
  const onRoute = (a, b) => route.some((v, i) => i && ((route[i - 1] === a && v === b) || (route[i - 1] === b && v === a)));
  const els = [];
  for (const [a, b, w] of EDGES) {
    const [x1, y1] = NODES[a], [x2, y2] = NODES[b], hot = onRoute(a, b);
    els.push(s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), stroke: hot ? 'var(--violet)' : 'var(--line-2)', 'stroke-width': hot ? 6 : 3 }));
    els.push(s('text', { x: plot.X((x1 + x2) / 2), y: plot.Y((y1 + y2) / 2) - 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: String(w) }));
  }
  for (const [n, [x, y]] of Object.entries(NODES)) {
    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 18, class: done.includes(n) ? 'fl-teal' : 'fl-card', stroke: 'var(--ink)', 'stroke-width': 2 }));
    els.push(s('text', { x: plot.X(x), y: plot.Y(y) + 6, 'text-anchor': 'middle', style: 'font-weight:700;font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px))', text: n }));
    if (d[n] != null || Object.keys(d).length) els.push(s('text', { x: plot.X(x), y: plot.Y(y) + (y > 2 ? -26 : 38), 'text-anchor': 'middle', class: 'lbl fl-coral', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: d[n] != null ? String(d[n]) : '∞' }));
  }
  return els;
}
// ── dynamic programming: coins 1, 3, 4 ──
const COINS = [4, 3, 1];
const greedyCoins = (n) => { let c = 0; for (const k of COINS) { c += Math.floor(n / k); n %= k; } return c; };
const DP = (() => { const b = [0]; for (let n = 1; n <= 40; n++) b[n] = 1 + Math.min(...COINS.filter((k) => k <= n).map((k) => b[n - k])); return b; })();

// bottom-up merge sort of 32 shuffled bars, recorded one write at a time
const MERGE_LOG = (() => {
  let a = 7;
  const arr = Array.from({ length: 32 }, (_, i) => i + 1);
  for (let i = 31; i > 0; i--) { a = (a * 16807) % 2147483647; const j = a % (i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  const frames = [{ arr: arr.slice(), lo: 0, hi: 0, w: 1, pos: -1, cmp: 0 }];
  let cmp = 0;
  for (let w = 1; w < 32; w *= 2) for (let lo = 0; lo < 32; lo += 2 * w) {
    const mid = lo + w, hi = Math.min(lo + 2 * w, 32), L = arr.slice(lo, mid), R = arr.slice(mid, hi);
    let i = 0, j = 0;
    for (let k = lo; k < hi; k++) {
      if (i < L.length && j < R.length) cmp++;
      arr[k] = j >= R.length || (i < L.length && L[i] <= R[j]) ? L[i++] : R[j++];
      frames.push({ arr: arr.slice(), lo, hi, w: 2 * w, pos: k, cmp });
    }
  }
  return frames;
})();

export default {
  id: 'algorithms',
  subject: 'math',
  title: 'Algorithms',
  level: 'Intermediate',
  cover: 'algorithms',
  tagline: 'Searching, sorting, growth rates, shortest paths, dynamic programming and the hardest problems in computing.',
  description: r`An algorithm is a precise recipe for solving a problem. Discover why binary search is so fast, watch a sorting algorithm at work, learn to compare algorithms with big-O notation, see when greedy choices fail, meet the million-dollar P versus NP question, find shortest routes with Dijkstra's algorithm, and solve problems with dynamic programming.`,
  prereq: 'Powers & Roots',
  chapters: [
    {
      title: 'Searching and Sorting',
      summary: 'Classic algorithms.',
      lessons: [
        {
          id: 'searching',
          title: 'Searching',
          summary: 'Linear versus binary search',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Two strategies',
              body: r`You're looking for a name in a list of $n$ names.
- **Linear search:** check each name in turn. In the worst case, you check all $n$.
- **Binary search** (the list must be sorted): look at the middle name. If yours comes earlier alphabetically, throw away the second half; otherwise throw away the first half. Repeat.

Each step of binary search **halves** what's left.`,
            },
            {
              type: 'numeric',
              title: 'A million names',
              prompt: r`A sorted list has 1,000,000 names. In the worst case, how many names must binary search check?`,
              answer: 20,
              wrong: [{ v: 500000, why: 'That’s the average for linear search. Binary search halves the list each time.' }, { v: 1000000, why: 'That’s linear search. Each binary search step throws away half the list.' }, { v: 19, why: r`$2^{19} = 524{,}288$ is less than a million: one more halving is needed.` }],
              explain: r`After $k$ checks, about $\dfrac{1{,}000{,}000}{2^k}$ names remain. Since $2^{20} = 1{,}048{,}576$, **20** checks always suffice. In general, binary search takes about $\log_2 n$ steps.`,
            },
            {
              type: 'mcq',
              title: 'Double the data',
              prompt: r`A list doubles in size, from 1 million to 2 million names. How many **extra** checks does binary search need in the worst case?`,
              cols: 2,
              choices: [
                { t: 'Just 1', ok: true },
                { t: 'Twice as many', why: 'That’s linear search. One extra halving handles a doubled list.' },
                { t: '1 million more', why: 'One extra step cuts 2 million down to 1 million, and from there it’s the same as before.' },
                { t: 'None', why: r`$2^{20} < 2{,}000{,}000$, so one more step is needed.` },
              ],
              explain: r`The first check halves 2 million to 1 million, and then it's the same search as before. Doubling the data adds just **one** step. That's the magic of logarithmic growth.`,
            },
            {
              type: 'numeric',
              title: 'Guess my number',
              prompt: r`I'm thinking of a whole number from 1 to 100. After each guess I say "higher" or "lower". With the best strategy, how many guesses do you need in the worst case?`,
              answer: 7,
              wrong: [{ v: 50, why: 'Guessing in the middle halves the possibilities each time.' }, { v: 10, why: r`$2^7 = 128 \ge 100$, so 7 halvings suffice.` }],
              explain: r`Guess 50, then 25 or 75, and so on. Since $2^6 = 64 < 100 \le 128 = 2^7$, **7** guesses always suffice. That's binary search.`,
            },
            {
              type: 'mcq',
              title: 'The catch',
              prompt: r`Binary search is wonderfully fast. What does it require?`,
              choices: [
                { t: 'The data must already be sorted', ok: true },
                { t: 'The list must have a power-of-two length', why: 'Any length works; you just round when picking the middle.' },
                { t: 'The item must be in the list', why: 'It also tells you quickly that an item is missing.' },
              ],
              explain: r`Without order, the middle item tells you nothing about which half to keep. Sorting costs time too (next lesson), so it pays off when you'll search the same data many times, which is why dictionaries, phone books and databases keep things sorted.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Halving the search',
              body: r`Binary search in a sorted list of 32 numbers. Each row is one comparison: check the middle (coral) and throw away the half that can’t contain the target. Choose a target and count the rows.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 32, ymin: -6.2, ymax: 0.2, grid: false, axes: false, maxWidth: 640, height: 300,
                params: { t: { min: 0, max: 31, step: 1, value: 22, label: 'target', color: 'violet', format: (v) => String(3 * v + 2) } },
                extra: ({ plot, p, s }) => { const out = []; let lo = 0, hi = 31, row = 0; while (lo <= hi && row < 7) { const mid = (lo + hi) >> 1; for (let i = 0; i < 32; i++) { const inR = i >= lo && i <= hi; out.push(s('rect', { x: plot.X(i + 0.06), y: plot.Y(-row), width: plot.X(0.88) - plot.X(0), height: plot.Y(0) - plot.Y(0.8), rx: 3, class: i === mid ? 'fl-coral' : inR ? (i === p.t ? 'fl-violet-soft' : 'fl-blue-soft') : 'fl-card', stroke: i === p.t ? 'var(--violet)' : 'var(--line)', 'stroke-width': i === p.t ? 2 : 1, opacity: inR ? 1 : 0.35 })); if (inR) out.push(s('text', { x: plot.X(i + 0.5), y: plot.Y(-row - 0.4) + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(9px * var(--fs, 1)), var(--fmin, 0px))', fill: i === mid ? 'var(--card)' : 'var(--ink-2)', text: String(3 * i + 2) })); } if (mid === p.t) break; if (mid < p.t) lo = mid + 1; else hi = mid - 1; row++; } return out; },
                readout: (p) => { let lo = 0, hi = 31, k = 0; while (true) { k++; const mid = (lo + hi) >> 1; if (mid === p.t) break; if (mid < p.t) lo = mid + 1; else hi = mid - 1; } return `found ${3 * p.t + 2} in **${k} comparison${k > 1 ? 's' : ''}** · a straight scan from the left needs ${p.t + 1}`; },
              },
              after: r`No target ever needs more than 6 comparisons, because 32 halves to 1 in 5 steps (plus one last check). Each comparison halves what is left, so a list of a million needs only about 20, and a billion about 30. The catch: the list must be sorted first.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Everyone on Earth',
              prompt: r`A sorted list contains all 8 billion people on Earth. How many checks does binary search need in the worst case? ($2^{33} \approx 8.6 \times 10^9$.)`,
              answer: 33,
              wrong: [{ v: 32, why: r`$2^{32} \approx 4.3 \times 10^9$ is less than 8 billion.` }],
              explain: r`$2^{32} \approx 4.3$ billion is too few, $2^{33} \approx 8.6$ billion is enough: **33** checks to find anyone on Earth.`,
            },
          ],
          recap: [
            r`Linear search: up to $n$ checks.`,
            r`Binary search on sorted data: about $\log_2 n$ checks.`,
            'Doubling the data adds just one step to binary search.',
          ],
        },
        {
          id: 'sorting',
          title: 'Sorting',
          summary: 'Bubble sort versus merge sort',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Bubble sort',
              body: r`**Bubble sort** walks along the list comparing neighbours, swapping any pair that's out of order. Each pass carries the largest remaining value to the end, like a bubble rising. Step through it.`,
              widget: {
                kind: 'graph', xmin: -0.8, xmax: 11.8, ymin: -1, ymax: 13, grid: false, axes: false, height: 280,
                params: { k: { min: 0, max: BUBBLE.length - 1, step: 1, value: 0, label: 'comparisons', color: 'violet', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const st = BUBBLE[p.k];
                  return st.a.map((v, j) => {
                    const hot = j === st.i || j === st.i + 1;
                    return s('rect', { x: plot.X(j) - 16, y: plot.Y(v), width: 32, height: plot.Y(0) - plot.Y(v), rx: 5, class: hot ? (st.swapped ? 'fl-coral' : 'fl-amber') : 'fl-blue' });
                  });
                },
                readout: (p) => {
                  const st = BUBBLE[p.k];
                  if (p.k === 0) return 'Unsorted. Move the slider to compare neighbours.';
                  if (p.k === BUBBLE.length - 1) return `Sorted after **${p.k}** comparisons.`;
                  return `Comparison ${p.k}: ${st.swapped ? 'out of order, so **swap** (coral)' : 'already in order (amber)'}`;
                },
              },
              after: r`For 12 items, bubble sort makes $11 + 10 + \dots + 1 = 66$ comparisons. In general it makes $\dfrac{n(n-1)}{2}$, roughly $\tfrac12 n^2$. Double the list and the work **quadruples**.`,
            },
            {
              type: 'explain',
              title: 'Merge sort',
              body: r`**Merge sort** uses divide and conquer: split the list in half, sort each half (by the same method), then **merge** the two sorted halves by repeatedly taking the smaller front item.

Splitting in half repeatedly takes $\log_2 n$ levels, and each level does about $n$ comparisons while merging. Total: about $n\log_2 n$.`,
            },
            { /*anim:algorithms*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Merge sort in action',
              body: r`32 shuffled bars, sorted bottom-up: first merge neighbours into sorted pairs, then pairs into fours, then eights, sixteens, and finally the whole list. The {amber:shaded block} is the merge in progress.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 32, ymin: 0, ymax: 33, grid: false, axes: false, height: 260,
                animate: { param: 't', speed: 26, max: MERGE_LOG.length + 40, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const f = MERGE_LOG[Math.min(MERGE_LOG.length - 1, Math.floor(p.t))], els = [];
                  if (f.pos >= 0 && p.t < MERGE_LOG.length) els.push(s('rect', { x: plot.X(f.lo), y: plot.Y(33), width: plot.X(f.hi) - plot.X(f.lo), height: plot.Y(0) - plot.Y(33), class: 'fl-amber-soft' }));
                  f.arr.forEach((v, i) => els.push(s('rect', { x: plot.X(i + 0.1), y: plot.Y(v), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 2, class: i === f.pos && p.t < MERGE_LOG.length ? 'fl-coral' : 'fl-blue', opacity: 0.85 })));
                  return els;
                },
                readout: (p) => { const f = MERGE_LOG[Math.min(MERGE_LOG.length - 1, Math.floor(p.t))]; return p.t >= MERGE_LOG.length - 1 ? `sorted after ${f.cmp} comparisons (bubble sort would need up to 496)` : `merging blocks into runs of ${f.w} · comparisons so far: ${f.cmp}`; },
              },
              after: r`There are only $\log_2 32 = 5$ rounds of merging, and each round touches every bar once, so the work is about $n \log_2 n = 32 \times 5 = 160$ steps. Bubble sort's $\tfrac12 n^2$ comparisons are three times as many for 32 items, and the gap grows fast: for a million items it's 20 million steps against half a trillion.`,
            },
            {
              type: 'order',
              title: 'Merge sort, step by step',
              prompt: r`Put the stages of merge-sorting $[5, 2, 8, 1]$ in order.`,
              items: [
                r`Split into $[5, 2]$ and $[8, 1]$`,
                r`Split again into single items: $[5], [2], [8], [1]$`,
                r`Merge pairs: $[2, 5]$ and $[1, 8]$`,
                r`Merge the halves: $[1, 2, 5, 8]$`,
              ],
              explain: r`Splitting goes down to single items, which are trivially sorted; merging builds back up. Merging two sorted lists only ever compares their front items, so it's fast.`,
            },
            {
              type: 'mcq',
              title: 'Merging',
              prompt: r`Merging $[1, 4, 7]$ with $[2, 3, 9]$: what are the first three items of the result?`,
              cols: 2,
              choices: [
                { t: '1, 2, 3', ok: true },
                { t: '1, 4, 7', why: 'At each step take the smaller of the two front items: after 1, compare 4 with 2.' },
                { t: '1, 2, 4', why: 'After 1 and 2, the fronts are 4 and 3: take 3.' },
                { t: '2, 3, 9', why: 'Start with the smallest front item, 1.' },
              ],
              explain: r`Compare fronts: 1 vs 2 → 1; 4 vs 2 → 2; 4 vs 3 → 3; then 4, 7, 9. Each comparison places one item, so merging $n$ items takes at most $n - 1$ comparisons.`,
            },
            {
              type: 'numeric',
              title: 'A million items',
              prompt: r`Sorting 1,000,000 items: bubble sort needs about $\tfrac12 n^2$ comparisons and merge sort about $n\log_2 n$. Roughly how many times faster is merge sort? (Use $\log_2 10^6 \approx 20$.)`,
              unit: '×',
              answer: 25000,
              relTol: 0.1,
              wrong: [{ v: 50000, why: r`Don't forget the $\tfrac12$ in $\tfrac12 n^2$: $\frac{5 \times 10^{11}}{2 \times 10^7}$.` }, { v: 20, why: r`Compare the totals: $\frac12 n^2 = 5 \times 10^{11}$ versus $n \log_2 n = 2 \times 10^7$.` }],
              explain: r`Bubble sort: $\tfrac12 \times 10^{12} = 5 \times 10^{11}$ comparisons. Merge sort: $10^6 \times 20 = 2 \times 10^7$. Ratio: about **25,000**. At a billion comparisons per second, that's 8 minutes versus 0.02 seconds. A better algorithm beats faster hardware.`,
            },
            {
              type: 'mcq',
              title: 'Nearly sorted',
              prompt: r`**Insertion sort** takes items one at a time and slides each into place among those already sorted. It's $O(n^2)$ in general. When is it actually very fast?`,
              choices: [
                { t: 'When the list is already nearly sorted: each item moves only a little', ok: true },
                { t: 'When the list is in reverse order', why: 'That’s its worst case: every item slides all the way to the front.' },
                { t: 'Never', why: 'On nearly sorted data it’s close to linear, which is why real libraries use it for small or nearly sorted pieces.' },
              ],
              explain: r`Python's built-in sort (Timsort) combines merge sort with insertion sort, exploiting runs that are already in order: real data is often partly sorted.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The speed limit',
              prompt: r`Any sorting method based on comparisons must distinguish all $n!$ possible orders, and each yes/no comparison at best halves the possibilities. For $n = 4$ items, what's the minimum number of comparisons needed in the worst case? ($\log_2 24 \approx 4.6$.)`,
              answer: 5,
              wrong: [{ v: 4, why: r`4 comparisons give at most $2^4 = 16$ outcomes, fewer than the 24 possible orders.` }, { v: 6, why: 'That’s what bubble sort uses. Cleverer methods manage with fewer.' }],
              explain: r`You need $2^k \ge 24$, so $k \ge 5$. In general, comparison sorting needs about $\log_2 n! \approx n\log_2 n$ comparisons, so merge sort is essentially as good as possible.`,
            },
          ],
          recap: [
            r`Bubble sort compares neighbours: about $\tfrac12 n^2$ comparisons.`,
            r`Merge sort divides and conquers: about $n\log_2 n$.`,
            'For big inputs, the algorithm matters far more than the computer’s speed.',
          ],
        },
      ],
    },
    {
      title: 'How Hard Is It?',
      summary: 'Growth rates and hard problems.',
      lessons: [
        {
          id: 'big-o',
          title: 'Big-O Notation',
          summary: 'Comparing growth rates',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'How work grows',
              body: r`Computer scientists describe an algorithm by how its running time **grows** with the input size $n$, ignoring constant factors. This is **big-O notation**: binary search is $O(\log n)$, linear search $O(n)$, merge sort $O(n \log n)$ and bubble sort $O(n^2)$. Compare them.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 32, ymin: 0, ymax: 300, grid: 4, gridY: 50, height: 320, axes: { xlabel: 'n', ylabel: 'steps' },
                params: { n: { min: 1, max: 30, step: 1, value: 16, label: '$n$', color: 'ink', format: (v) => `${v}` } },
                curves: [
                  { f: (x) => (x >= 1 ? Math.log2(x) : NaN), color: 'teal' },
                  { f: (x) => x, color: 'blue' },
                  { f: (x) => (x >= 1 ? x * Math.log2(x) : NaN), color: 'violet' },
                  { f: (x) => x * x, color: 'coral' },
                  { f: (x) => 2 ** x, color: 'amber' },
                ],
                readout: (p) => r`$n = ${p.n}$: $\;\teal{\log_2 n = ${Math.log2(p.n).toFixed(1)}}$, $\;\blue{n = ${p.n}}$, $\;\violet{n\log_2 n = ${Math.round(p.n * Math.log2(p.n))}}$, $\;\coral{n^2 = ${p.n * p.n}}$, $\;\amber{2^n = ${(2 ** p.n).toLocaleString('en-US').replace(/,/g, '{,}')}}$`,
              },
              after: r`For small $n$ the differences are mild, but they explode as $n$ grows. The exponential $2^n$ (amber) leaves the chart almost immediately: an algorithm needing $2^n$ steps is hopeless beyond about $n = 60$, even on the fastest computers.`,
            },
            {
              type: 'mcq',
              title: 'Ten times the data',
              prompt: r`An $O(n^2)$ algorithm takes 1 second on 10,000 items. Roughly how long will it take on 100,000 items?`,
              cols: 2,
              choices: [
                { t: '100 seconds', ok: true },
                { t: '10 seconds', why: r`That's what an $O(n)$ algorithm would do. With $n^2$, 10× the data means $10^2 = 100$× the time.` },
                { t: '1,000 seconds', why: r`That's for $O(n^3)$. With $n^2$, it's $10^2$.` },
                { t: '2 seconds', why: 'Quadratic growth is much worse than that.' },
              ],
              explain: r`$\left(\tfrac{100{,}000}{10{,}000}\right)^2 = 10^2 = 100$, so about **100 seconds**. Big-O lets you predict how running time scales before you run anything.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Constants matter… for a while',
              prompt: r`Algorithm A takes $100n$ steps; algorithm B takes $n^2$ steps. B is faster for small inputs. Drag to the input size where they take **the same** time; beyond it, A wins forever.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 200, ymin: 0, ymax: 30000, grid: 25, gridY: 5000, height: 260, padL: 56, axes: { xlabel: 'n', ylabel: 'steps' },
                params: { n: { min: 1, max: 200, step: 1, value: 40, slider: false } },
                curves: [{ f: (x) => 100 * x, color: 'blue', width: 3 }, { f: (x) => x * x, color: 'coral', width: 3 }],
                points: [{ x: (p) => p.n, y: (p) => p.n * p.n, drag: { x: 'n' }, color: 'coral' }],
                readout: (p) => r`$n = ${p.n}$: A takes $${(100 * p.n).toLocaleString('en-US').replace(/,/g, '{,}')}$ steps, B takes $${(p.n * p.n).toLocaleString('en-US').replace(/,/g, '{,}')}$`,
                goal: (p) => p.n === 100,
                hint: r`Solve $100n = n^2$.`,
                solution: { n: 100 },
              },
              explain: r`$100n = n^2$ at $n = 100$. Below that, B's smaller constant wins; above it, A's slower growth wins, and by $n = 10{,}000$, A is 100 times faster. Big-O describes the long run.`,
            },
            {
              type: 'numeric',
              title: 'Exponential time',
              prompt: r`An algorithm takes $2^n$ steps, and a computer does $10^9$ steps per second. How many **years** does it take for $n = 60$? (A year is about $3.15 \times 10^7$ s; nearest whole number.)`,
              unit: 'years',
              answer: Math.round(2 ** 60 / 1e9 / 3.15e7),
              tol: 1,
              wrong: [{ v: Math.round(2 ** 60 / 1e9), relTol: 0.02, why: 'That’s in seconds. Divide by the seconds in a year.' }],
              explain: r`$2^{60} \approx 1.15 \times 10^{18}$ steps, or $1.15 \times 10^9$ s: about **37 years**. Add 10 more items and it's 1,000 times longer. Exponential algorithms hit a wall no hardware can climb.`,
            },
            {
              type: 'numeric',
              title: 'Sorting a million',
              prompt: r`A good sorting algorithm takes about $n\log_2 n$ steps. Roughly how many million steps is that for $n = 1{,}000{,}000$? (Nearest whole number.)`,
              unit: 'million',
              answer: 1e6 * Math.log2(1e6) / 1e6,
              tol: 0.6,
              explain: r`$\log_2 10^6 \approx 20$, so about **20 million** steps, a few milliseconds. A naive $n^2$ sort would need a trillion.`,
            },
            {
              type: 'mcq',
              title: 'Greedy change',
              prompt: r`A **greedy** algorithm always takes the biggest step it can. To make change, it uses the largest coin that fits, then repeats. With coins of 1, 3 and 4 cents, what does greedy do for 6 cents, and is it optimal?`,
              choices: [
                { t: 'It uses 4 + 1 + 1 (3 coins), but 3 + 3 (2 coins) is better', ok: true },
                { t: 'It uses 3 + 3, which is optimal', why: 'Greedy grabs the 4 first, because it’s the largest coin that fits.' },
                { t: 'It uses 4 + 1 + 1, which is optimal', why: 'Two 3-cent coins make 6 with only 2 coins.' },
              ],
              explain: r`Greedy takes 4, then 1, then 1: three coins. But $3 + 3$ uses only two. Greedy choices that look best right now can miss the best overall answer. (For standard coin systems like the euro or US cents, greedy happens to always work, which is no accident: those systems were designed that way.)`,
            },
          ],
          recap: [
            r`Big-O describes how running time grows: $\log n < n < n\log n < n^2 < 2^n$.`,
            r`For $O(n^2)$, 10× the data means about 100× the time.`,
            'Greedy algorithms are fast, but don’t always find the best answer.',
          ],
        },
        {
          id: 'hard-problems',
          title: 'Hard Problems',
          summary: 'The travelling salesperson and P vs NP',
          icon: 'question',
          steps: [
            {
              type: 'numeric',
              title: 'Route planning',
              prompt: r`A salesperson must visit 10 cities once each and return home, by the shortest route. Starting from home, how many different round trips are there? (A route and its reverse count as the same.)`,
              answer: 181440,
              wrong: [{ v: 3628800, why: r`That's $10!$. Fix the home city, so the remaining 9 cities can be ordered in $9!$ ways, then halve for reversals.` }, { v: 362880, why: r`That's $9!$. Each route and its reverse have been counted separately: halve it.` }, { v: 90, why: 'The number of routes grows like a factorial, much faster than that.' }],
              explain: r`Fixing home, the other 9 cities can be visited in $9! = 362{,}880$ orders, and each route is counted twice (forwards and backwards): $\dfrac{9!}{2} = 181{,}440$. With 20 cities there are about $6 \times 10^{16}$ routes, far too many to check one by one.`,
            },
            {
              type: 'numeric',
              title: 'Twenty cities',
              prompt: r`Using the same reasoning, how many round trips are there through 20 cities? Give the answer in units of $10^{16}$ (1 decimal place). ($19! \approx 1.216 \times 10^{17}$.)`,
              unit: r`$\times 10^{16}$`,
              answer: 6.1,
              tol: 0.06,
              wrong: [{ v: 12.2, tol: 0.1, why: 'Halve it: each route and its reverse are the same trip.' }],
              explain: r`$\frac{19!}{2} \approx 6.1 \times 10^{16}$. Checking a billion routes per second would take about 2 years; 30 cities, longer than the age of the universe. Yet clever methods have found optimal tours through tens of thousands of cities.`,
            },
            {
              type: 'explain',
              title: 'P versus NP',
              body: r`Some problems are **easy to check** but seem **hard to solve**:
- Given a filled-in Sudoku, checking it is quick. Solving a big blank one seems to require search.
- Given a route, checking that it's shorter than 1,000 km is quick. Finding one might not be.

**P** is the class of problems that can be **solved** quickly (in time polynomial in $n$). **NP** is the class whose solutions can be **checked** quickly. Every P problem is in NP. But is every NP problem also in P? Nobody knows. It's one of the seven Millennium Prize Problems, with a \$1,000,000 reward.`,
            },
            {
              type: 'mcq',
              title: 'Why it matters',
              prompt: r`Much of internet security relies on problems believed to be hard, such as factoring huge numbers. What would a proof that P = NP (with a practical, fast algorithm) mean?`,
              choices: [
                { t: 'Many encryption schemes could be broken, but also many hard optimisation problems would become easy', ok: true },
                { t: 'Nothing practical', why: 'If NP problems became easy in practice, cryptography and optimisation would change dramatically.' },
                { t: 'Computers would become faster', why: 'P = NP is about algorithms, not hardware.' },
              ],
              explain: r`If every quickly-checkable problem were also quickly solvable, finding secret keys could become as easy as checking them. On the upside, scheduling, logistics, protein folding and countless other optimisation problems would become tractable. Most computer scientists believe P ≠ NP, but no one has proved it.`,
            },
            {
              type: 'mcq',
              title: 'NP-complete',
              prompt: r`In 1971, Stephen Cook showed that some NP problems are "hardest of all": if any one of them has a fast algorithm, every NP problem does. Which of these is one such **NP-complete** problem?`,
              choices: [
                { t: 'Deciding whether a giant Sudoku-style puzzle has a solution', ok: true },
                { t: 'Sorting a list', why: 'Sorting is in P: merge sort does it in n log n time.' },
                { t: 'Finding a name in a sorted list', why: 'Binary search does that in log n time.' },
              ],
              explain: r`Generalised Sudoku, the travelling salesperson (decision version), scheduling exams without clashes and packing a knapsack are all NP-complete: thousands of problems that rise or fall together. Solve one quickly and you've solved them all.`,
            },
            {
              type: 'interactive',
              title: 'Brute force versus the universe',
              body: r`Checking every round trip through $n$ cities means $\frac{(n-1)!}{2}$ tours. Suppose a computer checks a **billion tours per second**. Find the smallest number of cities for which brute force would take longer than the **age of the universe** (about $4.4 \times 10^{17}$ s).`,
              widget: {
                kind: 'graph', xmin: 5, xmax: 32, ymin: -9, ymax: 24, grid: false, height: 280, axes: { xlabel: 'cities', ylabel: 'time needed (log₁₀ seconds)', xticks: 5, yticks: 5, xAt: 5, yAt: -9 },
                params: { n: { min: 5, max: 32, step: 1, value: 15, label: 'cities', color: 'coral' } },
                curves: [{ f: (x) => { let l = 0; for (let k = 2; k < Math.round(x); k++) l += Math.log10(k); return l - Math.log10(2) - 9; }, color: 'violet', width: 3, n: 27 }, { f: () => 0, color: 'muted', dash: true }, { f: () => Math.log10(3.156e7), color: 'blue', dash: true }, { f: () => Math.log10(4.35e17), color: 'teal', dash: true }],
                points: [{ x: (p) => p.n, y: (p) => { let l = 0; for (let k = 2; k < p.n; k++) l += Math.log10(k); return l - Math.log10(2) - 9; }, color: 'coral' }],
                readout: (p) => { let l = 0; for (let k = 2; k < p.n; k++) l += Math.log10(k); const sec = 10 ** (l - Math.log10(2) - 9); const t = sec < 1 ? `${sec.toExponential(1)} s` : sec < 3600 ? `${sec.toFixed(1)} s` : sec < 3.156e7 ? `${(sec / 86400).toFixed(1)} days` : `${(sec / 3.156e7).toExponential(1)} years`; return `${p.n} cities: **${t}** · dashed lines: 1 second, 1 year, age of the universe`; },
                goal: (p) => p.n === 28,
                hint: 'Look for where the curve first rises above the top dashed line.',
                solution: { n: 28 },
              },
              explain: r`27 cities take about half the age of the universe; **28** take 12 times it. Each extra city multiplies the work by about $n$, so even a computer a million times faster only buys a few more cities. That is why route planners use clever heuristics instead of brute force.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Good enough',
              prompt: r`Delivery companies must plan routes through hundreds of stops every day, even though finding the perfect route is NP-hard. How do they cope?`,
              choices: [
                { t: 'They use clever approximations and heuristics that find routes within a few percent of optimal, quickly', ok: true },
                { t: 'They check every possible route on supercomputers', why: 'With hundreds of stops that would take longer than the age of the universe.' },
                { t: 'They visit stops in random order', why: 'That would waste enormous amounts of fuel and time.' },
              ],
              explain: r`NP-hardness means **exact** answers are expensive in the worst case. In practice, methods like local search (swap pairs of stops while it helps) get very close. UPS has said its route optimisation saves around 100 million miles a year.`,
            },
          ],
          recap: [
            r`Brute-force route planning grows like $n!$, hopeless for large $n$.`,
            'P: quickly solvable. NP: quickly checkable.',
            r`Whether P = NP is a famous open problem with a \$1 million prize.`,
          ],
        },
      ],
    },
    {
      title: 'Algorithm Design',
      summary: 'Shortest paths and dynamic programming.',
      lessons: [
        {
          id: 'paths',
          title: 'Shortest Paths',
          summary: 'How sat-navs find the best route',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Roads as a graph',
              body: r`A map can be modelled as a **graph**: junctions are nodes, roads are edges, and each edge has a length (or travel time). Finding the best route means finding the path whose lengths add up to the least.

In 1956, Edsger Dijkstra designed an algorithm for this in about twenty minutes, sitting at a café in Amsterdam, without pencil and paper.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Dijkstra’s algorithm',
              body: r`Repeatedly **settle** the unsettled node with the smallest known distance (teal), then update its neighbours if going through it is shorter. Step through the algorithm from S to T.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.8, xmax: 7, ymin: -0.6, ymax: 4.6, grid: false, axes: false, maxWidth: 560,
                params: { k: { min: 0, max: DIJ.length - 1, step: 1, value: 0, label: 'step', color: 'teal' } },
                extra: ({ plot, p, s }) => drawNet(plot, s, { ...DIJ[p.k], route: p.k === DIJ.length - 1 ? ROUTES[2] : [] }),
                readout: (p) => DIJ[p.k].note,
              },
              after: r`Once a node is settled, its distance is final: any other route to it would have to pass through an unsettled node that is already at least as far away. Notice that the direct road S–A (4) lost to the detour S–B–A (3).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Pick the route',
              prompt: r`Check the routes yourself: choose the one from S to T with the smallest total length.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.8, xmax: 7, ymin: -0.6, ymax: 4.6, grid: false, axes: false, maxWidth: 560,
                params: { k: { min: 0, max: ROUTES.length - 1, step: 1, value: 0, label: 'route', color: 'violet', format: (v) => ROUTES[v].join('–') } },
                extra: ({ plot, p, s }) => drawNet(plot, s, { route: ROUTES[p.k] }),
                readout: (p) => `${ROUTES[p.k].join(' → ')}: total **${routeLen(ROUTES[p.k])}**`,
                goal: (p) => routeLen(ROUTES[p.k]) === 11,
                hint: 'The cheapest way to reach A is through B.',
                solution: { k: 2 },
              },
              explain: r`S–B–A–C–T has length $2 + 1 + 5 + 3 = 11$. Dijkstra found it without listing every route, which matters on real maps with millions of junctions.`,
            },
            {
              type: 'mcq',
              title: 'Negative roads?',
              prompt: r`Dijkstra's algorithm assumes every edge length is zero or positive. Why would a negative length break it?`,
              choices: [
                { t: 'A settled node could later be reached more cheaply through a negative edge, so "settled" distances wouldn’t be final', ok: true },
                { t: 'Computers can’t add negative numbers', why: 'They can. The problem is the algorithm’s key assumption.' },
                { t: 'It wouldn’t break anything', why: 'The proof that settled distances are final relies on paths only getting longer.' },
              ],
              explain: r`Dijkstra's logic is that extending a path can never make it shorter. Negative edges (which appear in some finance and physics problems) need other methods, such as the Bellman–Ford algorithm.`,
            },
            {
              type: 'numeric',
              title: 'Roads between every town',
              prompt: r`If every one of 10 towns has a direct road to every other, how many roads are there?`,
              answer: 45,
              explain: r`$\binom{10}{2} = 45$. Real road networks are far sparser, which is what makes algorithms like Dijkstra’s fast on them.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Every pair',
              prompt: r`A sat-nav company precomputes the best route between every pair of 1,000 major junctions (A to B counts the same as B to A). How many routes is that?`,
              answer: 499500,
              wrong: [{ v: 1000000, why: 'A to B is the same as B to A, and a junction doesn’t need a route to itself.' }, { v: 999000, why: 'Halve it: each pair is counted twice.' }],
              explain: r`$\binom{1000}{2} = \frac{1000 \times 999}{2} = 499{,}500$. Real navigation systems add clever preprocessing (like "contraction hierarchies") so continent-wide routes take milliseconds.`,
            },
          ],
          recap: [
            'Maps become weighted graphs; routes are paths.',
            'Dijkstra settles the closest unsettled node and relaxes its neighbours.',
            'It needs non-negative edge lengths.',
          ],
        },
        {
          id: 'dp',
          title: 'Dynamic Programming',
          summary: 'Never solve the same problem twice',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Remember answers',
              body: r`Computing Fibonacci numbers with the rule $F(n) = F(n-1) + F(n-2)$ directly is shockingly slow: $F(30)$ triggers over 2.6 million calls, because the same values are recomputed again and again.

**Dynamic programming** fixes this: solve each smaller subproblem **once**, store its answer in a table, and build bigger answers from stored ones.`,
            },
            {
              type: 'numeric',
              title: 'With a table',
              prompt: r`Using a table, how many different Fibonacci values from $F(0)$ to $F(30)$ must be computed to find $F(30)$?`,
              answer: 31,
              wrong: [{ v: 30, why: 'Count both ends: F(0) through F(30).' }, { v: 2692537, why: 'That’s the naive recursion. With a table, each value is computed once.' }],
              explain: r`31 values, each from two stored ones: a speed-up of nearly 100,000 times.`,
            },
            {
              type: 'explain',
              title: 'Making change, properly',
              body: r`Remember that greedy change-making fails for coins of 1, 3 and 4. Dynamic programming always finds the minimum: the best way to make $n$ uses one coin $c$ plus the best way to make $n - c$, so
$$\text{best}(n) = 1 + \min\{\text{best}(n - 1),\ \text{best}(n - 3),\ \text{best}(n - 4)\}$$
Fill in a table from $n = 0$ upwards.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Where greedy fails',
              prompt: r`Coins are 1, 3 and 4. Drag through the amounts and compare greedy with the dynamic-programming optimum. Find the **smallest** amount where greedy uses more coins.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 10, grid: 2, gridY: 1, height: 260, axes: { xlabel: 'amount', ylabel: 'coins used' },
                params: { n: { min: 1, max: 30, step: 1, value: 1, slider: false } },
                curves: [{ f: (x) => greedyCoins(Math.max(0, Math.round(x))), color: 'coral', width: 2.5 }, { f: (x) => DP[Math.max(0, Math.round(x))], color: 'teal', width: 2.5, dash: true }],
                points: [{ x: (p) => p.n, y: (p) => greedyCoins(p.n), drag: { x: 'n' }, color: 'coral' }],
                readout: (p) => `amount ${p.n}: greedy uses **${greedyCoins(p.n)}** coins (coral), the best possible is **${DP[p.n]}** (teal)`,
                goal: (p) => greedyCoins(p.n) > DP[p.n] && Array.from({ length: p.n - 1 }, (_, i) => i + 1).every((m) => greedyCoins(m) === DP[m]),
                hint: 'Check small amounts one at a time.',
                solution: { n: 6 },
              },
              explain: r`At 6, greedy takes 4 + 1 + 1 (3 coins) but $3 + 3$ needs just 2. The table never makes that mistake, because it considers every first coin and reuses stored answers.`,
            },
            {
              type: 'numeric',
              title: 'Ten cents',
              prompt: r`What's the minimum number of coins (1, 3 and 4) that make 10?`,
              answer: 3,
              wrong: [{ v: 4, why: 'That’s greedy: 4 + 4 + 1 + 1. Try using 3s.' }],
              explain: r`$4 + 3 + 3 = 10$: 3 coins. Greedy's $4 + 4 + 1 + 1$ needs 4.`,
            },
            {
              type: 'mcq',
              title: 'Where else?',
              prompt: r`Which of these is solved with dynamic programming?`,
              choices: [
                { t: 'All of these: spell-checkers suggesting words, aligning DNA sequences, and finding the best knapsack packing', ok: true },
                { t: 'Only Fibonacci numbers', why: 'DP is a general technique used across computing.' },
                { t: 'Only money problems', why: 'DP appears in biology, linguistics, economics and more.' },
              ],
              explain: r`The "edit distance" between two words (how many letter changes turn one into the other) is filled in as a table, and the same idea aligns genomes. Richard Bellman named the method in the 1950s; he later said he chose "dynamic programming" partly because it sounded impressive to funders.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Climbing stairs',
              prompt: r`You climb a staircase taking 1 or 2 steps at a time. The number of ways to reach step $n$ is ways($n - 1$) + ways($n - 2$), with 1 way to reach step 1 and 2 ways to reach step 2. How many ways are there to climb 10 steps?`,
              answer: 89,
              wrong: [{ v: 55, why: 'That’s 9 steps. Continue the table one more row.' }, { v: 1024, why: r`$2^{10}$ counts sequences of 10 choices, but sequences can't overshoot, and 2-steps cover two stairs.` }],
              explain: r`1, 2, 3, 5, 8, 13, 21, 34, 55, **89**: Fibonacci numbers again. To reach step $n$, your last move was a 1-step (from $n - 1$) or a 2-step (from $n - 2$).`,
            },
          ],
          recap: [
            'Dynamic programming stores answers to subproblems instead of recomputing them.',
            'Build a table from small cases up, using a recurrence.',
            'It finds optimal answers where greedy choices fail.',
          ],
        },
        {
          id: 'hashing',
          title: 'Hash Tables',
          summary: 'Finding things in one step',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Jump straight to the answer',
              body: r`A hash table stores items in an array of $m$ slots. A **hash function** turns each key (a name, say) into a slot number, so to look something up you compute its hash and go straight there: no searching.

The catch is **collisions**: two keys can hash to the same slot. A simple fix is **linear probing**: if the slot is taken, try the next one, and the next, until you find a free slot. The **load factor** $\alpha = \frac{n}{m}$ says how full the table is.`,
            },
            {
              type: 'numeric',
              title: 'Two keys collide',
              prompt: r`A table has 10 slots and a good hash function that sends each key to a random slot. What is the probability that the first two keys land in the same slot?`,
              answer: 0.1,
              tol: 0.001,
              explain: r`Whatever slot the first key takes, the second matches it with probability $\frac{1}{10}$. As with the birthday problem, collisions become likely surprisingly early: with 5 keys in 10 slots the chance of some collision is already about 70%.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How full is too full?',
              prompt: r`With linear probing, a search for a key that **isn’t** there takes on average about $\frac12\left(1 + \frac{1}{(1-\alpha)^2}\right)$ probes (Knuth). Find the highest load factor that keeps this to **5 probes**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.95, ymin: 0, ymax: 30, grid: false, height: 260, axes: { xlabel: 'load factor α', ylabel: 'average probes', xticks: 0.1, yticks: 5 },
                params: { a: { min: 0, max: 0.95, step: 0.001, value: 0.5, label: 'load factor', color: 'coral', format: (v) => v.toFixed(3) } },
                curves: [{ f: (x) => 0.5 * (1 + 1 / (1 - x) ** 2), color: 'violet', width: 3 }, { f: (x) => 0.5 * (1 + 1 / (1 - x)), color: 'teal', width: 2, dash: true }, { f: () => 5, color: 'muted', dash: true }],
                points: [{ x: (p) => p.a, y: (p) => 0.5 * (1 + 1 / (1 - p.a) ** 2), color: 'coral' }],
                readout: (p) => `missing key: **${(0.5 * (1 + 1 / (1 - p.a) ** 2)).toFixed(2)}** probes · key that’s there (dashed): ${(0.5 * (1 + 1 / (1 - p.a))).toFixed(2)}`,
                goal: (p) => Math.abs(p.a - 2 / 3) < 0.004,
                hint: r`You need $\frac{1}{(1 - \alpha)^2} = 9$.`,
                solution: { a: 0.667 },
              },
              explain: r`$(1 - \alpha)^2 = \frac19$ gives $\alpha = \frac23$. Up to about two-thirds full, lookups take just a few probes regardless of how many items there are. Beyond that the clusters of filled slots merge and costs explode: at 90% full a failed search takes 50 probes.`,
            },
            {
              type: 'mcq',
              title: 'Why so fast?',
              prompt: r`A sorted list of a million names needs about 20 comparisons for binary search. A hash table that is half full needs about 2.5 probes. What makes the hash table faster?`,
              choices: [
                { t: 'The hash computes the location directly, so the work doesn’t grow with the number of items', ok: true },
                { t: 'Hash tables keep the names sorted more cleverly', why: 'Hash tables don’t keep items in order at all; that’s why they can’t easily list them alphabetically.' },
                { t: 'They use less memory', why: 'They usually use more memory (empty slots). They trade space for speed.' },
              ],
              explain: r`Lookup cost depends on the load factor, not on $n$: "constant time on average". The price is extra memory and no ordering. Hash tables power dictionaries in Python, objects in JavaScript, and database indexes.`,
            },
            {
              type: 'numeric',
              title: 'A half-full table',
              prompt: r`A table is exactly half full ($\alpha = 0.5$). How many probes does an unsuccessful search take on average, by Knuth’s formula?`,
              answer: 2.5,
              tol: 0.01,
              explain: r`$\frac12\left(1 + \frac{1}{0.5^2}\right) = \frac12(1 + 4) = 2.5$ probes, whether the table holds a thousand items or a billion.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Keeping it fast',
              prompt: r`Items keep being added to a hash table. What do real implementations do to keep lookups fast?`,
              choices: [
                { t: 'When the load factor passes a threshold, allocate a bigger table (often double) and re-insert everything', ok: true },
                { t: 'Nothing: lookups are always one step', why: 'As α approaches 1, probes per lookup blow up, as the graph showed.' },
                { t: 'Sort the table', why: 'Sorting would destroy the hash positions. Growing the table is the standard fix.' },
              ],
              explain: r`Doubling costs a full re-insert, but it happens so rarely that the average cost per insertion stays constant (**amortised** constant time). Python’s dictionaries resize when about two-thirds full, right where the graph starts to climb.`,
            },
          ],
          recap: [
            'A hash function jumps straight to a slot; collisions are resolved by probing.',
            'Average cost depends on the load factor α, not the number of items.',
            'Tables are resized when α gets too high (around 2/3).',
          ],
        },
      ],
    },
  ],
};
