import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed d decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d);
const f3 = (v) => fix(v, 3);

const choose = (n, k) => {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
};
const binom = (n, p, k) => choose(n, k) * p ** k * (1 - p) ** (n - k);
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const poisson = (l, k) => (l ** k * Math.exp(-l)) / fact(k);

// bar chart drawn inside a graph widget with unit height; heights are scaled to the tallest bar
function bars(plot, s, probs, { color = 'blue', mark = null, highlight = null } = {}) {
  const max = Math.max(...probs);
  const N = probs.length;
  const step = (plot.xmax - plot.xmin) / (N + 1);
  const X = (k) => plot.X(plot.xmin + (k + 1) * step);
  const tick = N <= 16 ? 1 : 5;
  const els = [s('line', { x1: X(-0.6), x2: X(N - 0.4), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 2 })];
  const w = Math.min(34, (X(1) - X(0)) * 0.78);
  probs.forEach((q, k) => {
    const hgt = plot.Y(0) - plot.Y(q / max);
    els.push(s('rect', { x: X(k) - w / 2, y: plot.Y(0) - hgt, width: w, height: Math.max(0, hgt), rx: Math.min(4, w / 4), class: highlight != null && highlight(k) ? 'fl-coral' : `fl-${color}` }));
    if (k % tick === 0) els.push(s('text', { x: X(k), y: plot.Y(0) + 18, 'text-anchor': 'middle', class: 'tick', text: String(k) }));
  });
  if (mark != null) els.push(s('line', { x1: X(mark), x2: X(mark), y1: plot.Y(0), y2: plot.Y(1.05), stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
  return els;
}

// small deterministic random generator for the bus simulation
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const H = (n) => { let h = 0; for (let i = 1; i <= n; i++) h += 1 / i; return h; };
// random draws for the simulations, fixed by a seed so pictures don't flicker
const uniforms = (seed, n) => { const u = rng(seed * 7919 + 13); return Array.from({ length: n }, u); };
const couponRun = (n, seed) => { const u = rng(seed * 104729 + n), seen = new Set(), draws = []; while (seen.size < n && draws.length < 2000) { const c = Math.floor(u() * n); draws.push([c, !seen.has(c)]); seen.add(c); } return draws; };
const records = (vals) => { let best = -Infinity; return vals.map((v) => (v > best ? ((best = v), true) : false)); };

export default {
  id: 'distributions',
  subject: 'math',
  title: 'Probability Distributions',
  level: 'Advanced',
  cover: 'distributions',
  tagline: 'Binomial, Poisson, waiting times, collectors and records: the shapes of chance.',
  description: r`Random doesn't mean shapeless. Learn the distributions that describe coin flips, rare events and waiting times, see why random events clump together, why the median wait is shorter than the mean, how many packs it takes to fill a sticker album, and how a thousand coin flips become predictable.`,
  prereq: 'Probability',
  chapters: [
    {
      title: 'Counting Successes',
      summary: 'Random variables and the binomial.',
      lessons: [
        {
          id: 'random-variables',
          title: 'Random Variables',
          summary: 'Mean and spread of a random number',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A number decided by chance',
              body: r`A **random variable** is a number whose value depends on chance, like the number of heads in 3 flips. Its **distribution** lists each possible value with its probability:

| heads | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| probability | 1/8 | 3/8 | 3/8 | 1/8 |

Two summaries matter most:
- the **mean** (expected value): $\mu = \sum x\,P(x)$, the long-run average;
- the **variance**: $\sigma^2 = \sum (x - \mu)^2 P(x)$, the average squared distance from the mean. Its square root $\sigma$ is the **standard deviation**.`,
            },
            {
              type: 'numeric',
              title: 'The mean',
              prompt: r`Using the table, what is the mean number of heads in 3 flips?`,
              lhs: r`$\mu =$`,
              answer: 1.5,
              wrong: [{ v: 2, why: r`$0 \cdot \frac18 + 1 \cdot \frac38 + 2 \cdot \frac38 + 3 \cdot \frac18 = \frac{12}{8}$.` }, { v: 1, why: r`Weight each value by its probability: $\frac{0 + 3 + 6 + 3}{8}$.` }],
              explain: r`$\mu = \dfrac{0 \cdot 1 + 1 \cdot 3 + 2 \cdot 3 + 3 \cdot 1}{8} = \dfrac{12}{8} = 1.5$. As you'd guess: half of 3 flips.`,
            },
            {
              type: 'numeric',
              title: 'The variance',
              prompt: r`Now compute the variance $\sigma^2 = \sum (x - 1.5)^2 P(x)$.`,
              lhs: r`$\sigma^2 =$`,
              answer: 0.75,
              wrong: [{ v: 1.5, why: r`Square the distances: $(0 - 1.5)^2 = 2.25$, $(1 - 1.5)^2 = 0.25$, and so on, then weight by probability.` }, { v: 0.87, tol: 0.01, why: r`That's $\sigma$, the standard deviation. The variance is $\sigma^2$.` }],
              explain: r`$\sigma^2 = 2.25 \cdot \tfrac18 + 0.25 \cdot \tfrac38 + 0.25 \cdot \tfrac38 + 2.25 \cdot \tfrac18 = \dfrac{2.25 + 0.75 + 0.75 + 2.25}{8} = 0.75$. So $\sigma \approx 0.87$ heads.`,
            },
            {
              type: 'interactive',
              title: 'The balance point',
              body: r`The mean is the **balance point** of a distribution: put weights on a seesaw at 0, 1, 2 and 3, and it balances at $\mu$. Set the weights to make a distribution with mean $1.5$ and the **largest possible** variance.`,
              widget: {
                kind: 'graph', xmin: -0.7, xmax: 3.7, ymin: -0.28, ymax: 1.05, grid: false, axes: false, height: 300,
                params: Object.fromEntries([1, 3, 3, 1].map((v, k) => [`w${k}`, { min: 0, max: 6, step: 1, value: v, label: `weight on ${k}`, color: ['blue', 'teal', 'violet', 'coral'][k] }])),
                extra: ({ plot, p, s }) => {
                  const w = [p.w0, p.w1, p.w2, p.w3], tot = w.reduce((a, b) => a + b, 0) || 1, P = w.map((x) => x / tot), mu = P.reduce((a, q, k) => a + q * k, 0);
                  const els = [s('line', { x1: plot.X(-0.4), x2: plot.X(3.4), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' })];
                  P.forEach((q, k) => { els.push(s('rect', { x: plot.X(k) - 22, y: plot.Y(q), width: 44, height: plot.Y(0) - plot.Y(q), rx: 5, class: `fl-${['blue', 'teal', 'violet', 'coral'][k]}` })); els.push(s('text', { x: plot.X(k), y: plot.Y(q) - 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: q.toFixed(2) })); });
                  els.push(s('path', { d: `M${plot.X(mu)} ${plot.Y(0) + 3}l-16 28h32Z`, class: 'fl-amber' }));
                  return els;
                },
                readout: (p) => { const w = [p.w0, p.w1, p.w2, p.w3], tot = w.reduce((a, b) => a + b, 0) || 1, P = w.map((x) => x / tot), mu = P.reduce((a, q, k) => a + q * k, 0), v = P.reduce((a, q, k) => a + q * (k - mu) ** 2, 0); return `mean $\\mu = ${mu.toFixed(2)}$ (amber pivot), variance $\\sigma^2 = ${v.toFixed(2)}$`; },
                goal: (p) => { const w = [p.w0, p.w1, p.w2, p.w3], tot = w.reduce((a, b) => a + b, 0); if (!tot) return false; const P = w.map((x) => x / tot), mu = P.reduce((a, q, k) => a + q * k, 0), v = P.reduce((a, q, k) => a + q * (k - mu) ** 2, 0); return Math.abs(mu - 1.5) < 1e-9 && v > 2.25 - 1e-9; },
                hint: 'Variance measures distance from the mean. Push all the weight as far from 1.5 as it can go, keeping the seesaw balanced.',
                solution: { w0: 3, w1: 0, w2: 0, w3: 3 },
              },
              explain: r`Put all the weight at the ends, half at 0 and half at 3: the mean is still 1.5, but every value is 1.5 away from it, so $\sigma^2 = 1.5^2 = 2.25$. Two distributions can share a mean and still be utterly different, which is why we need a measure of spread as well.`,
            },
            {
              type: 'numeric',
              title: 'Linearity of expectation',
              body: r`A powerful fact: the mean of a **sum** is the sum of the means, $E[X + Y] = E[X] + E[Y]$, **even when $X$ and $Y$ depend on each other**.`,
              prompt: r`Ten letters are put into their ten addressed envelopes completely at random. On average, how many letters end up in the right envelope?`,
              answer: 1,
              wrong: [{ v: 0, why: 'Some letters will often land correctly by chance.' }, { v: 0.1, why: r`That's the chance for **one** letter. Add up the chances for all ten.` }, { v: 5, why: r`Each letter has only a $\frac{1}{10}$ chance of landing in its own envelope.` }],
              hint: r`Let $X_i = 1$ if letter $i$ is in the right envelope (probability $\frac1{10}$), else 0. The number correct is $X_1 + \cdots + X_{10}$.`,
              explain: r`Each letter has a $\frac1{10}$ chance of being right, so the expected number is $10 \times \frac1{10} = 1$. The events depend on each other (if nine are right, so is the tenth), but linearity doesn't care. Remarkably the answer is 1 for **any** number of letters.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Scaling up the stakes',
              prompt: r`You win \$10 for every head in 3 flips. The number of heads has standard deviation $\sigma \approx 0.866$. What's the standard deviation of your winnings, in dollars?`,
              unit: 'dollars',
              answer: 10 * Math.sqrt(0.75),
              tol: 0.02,
              wrong: [{ v: 75, why: r`That's the variance of the winnings: $10^2 \times 0.75$. Take the square root.` }, { v: 7.5, why: r`Multiplying by 10 multiplies the variance by $10^2$, and the standard deviation by 10: $10 \times 0.866$.` }],
              explain: r`Scaling a random variable by $a$ scales its standard deviation by $|a|$ and its variance by $a^2$: $10 \times 0.866 \approx \$8.66$. Adding a constant (say a \$5 entry fee) shifts the mean but leaves the spread unchanged.`,
            },
          ],
          recap: [
            'A random variable is a number decided by chance. Its distribution gives each value’s probability.',
            r`Mean $\mu = \sum xP(x)$.`,
            r`Variance $\sigma^2 = \sum (x - \mu)^2 P(x)$. The standard deviation is $\sigma$.`,
          ],
        },
        {
          id: 'binomial',
          title: 'The Binomial Distribution',
          summary: 'Successes in repeated trials',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'n trials, probability p',
              body: r`Repeat an experiment $n$ times independently, each with success probability $p$. The number of successes $X$ has a **binomial distribution**:
$$P(X = k) = \binom{n}{k} p^k (1 - p)^{n - k}$$
$\binom nk$ counts the **orderings** (which trials succeed), and $p^k(1 - p)^{n - k}$ is the probability of any one of them. Its mean is $np$ and its standard deviation is $\sqrt{np(1 - p)}$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Shapes of the binomial',
              body: r`Change the number of trials and the success probability. The dashed line marks the mean, $np$.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 31, ymin: -0.14, ymax: 1.08, grid: false, axes: false, height: 300,
                params: {
                  n: { min: 1, max: 30, step: 1, value: 10, label: '$n$', color: 'blue', format: (v) => `${v}` },
                  p: { min: 0.05, max: 0.95, step: 0.05, value: 0.5, label: '$p$', color: 'coral', format: (v) => v.toFixed(2) },
                },
                extra: ({ plot, p, s }) => bars(plot, s, Array.from({ length: p.n + 1 }, (_, k) => binom(p.n, p.p, k)), { mark: p.n * p.p }),
                readout: (p) => r`mean $np = ${f2(p.n * p.p)}$, $\;\sigma = \sqrt{np(1-p)} = ${f2(Math.sqrt(p.n * p.p * (1 - p.p)))}$`,
              },
              after: r`With $p = 0.5$ the bars are symmetric. A small $p$ piles them up near 0, with a long tail to the right. As $n$ grows, the shape smooths into a bell curve.`,
            },
            {
              type: 'numeric',
              title: 'Five heads out of ten',
              prompt: r`Flip a fair coin 10 times. What is the probability of **exactly** 5 heads? (3 decimal places.)`,
              answer: 252 / 1024,
              tol: 0.0015,
              wrong: [{ v: 0.5, why: r`5 heads is the most likely result, but it's far from certain: $\binom{10}{5}\left(\frac12\right)^{10}$.` }, { v: 0.000977, tol: 0.0001, why: r`That's one particular sequence, $\left(\frac12\right)^{10}$. Multiply by the number of orderings, $\binom{10}{5} = 252$.` }],
              explain: r`$\binom{10}{5}\left(\tfrac12\right)^{10} = \dfrac{252}{1024} \approx 0.246$. Even the **most likely** outcome happens less than a quarter of the time.`,
            },
            {
              type: 'interactive',
              title: 'Into the tail',
              body: r`Flip a fair coin 20 times. The coral bars show results of **at least** $k$ heads. Find the smallest $k$ for which getting at least $k$ heads has probability **below 5%**.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 21, ymin: -0.14, ymax: 1.08, grid: false, axes: false, height: 300,
                params: { k: { min: 10, max: 20, step: 1, value: 12, label: '$k$', color: 'coral' } },
                extra: ({ plot, p, s }) => bars(plot, s, Array.from({ length: 21 }, (_, j) => binom(20, 0.5, j)), { highlight: (j) => j >= p.k }),
                readout: (p) => { let t = 0; for (let j = p.k; j <= 20; j++) t += binom(20, 0.5, j); return `$P(X \\ge ${p.k}) = ${(100 * t).toFixed(2)}\\%$`; },
                goal: (p) => p.k === 15,
                hint: 'Try k = 14 and k = 15 and compare with 5%.',
                solution: { k: 15 },
              },
              explain: r`$P(X \ge 14) \approx 5.8\%$ but $P(X \ge 15) \approx 2.1\%$, so $k = 15$. A fair coin gives 15 or more heads in 20 flips only about once in 50 tries. This is exactly how a **hypothesis test** decides when a result is "too surprising" to blame on chance.`,
            },
            {
              type: 'mcq',
              title: 'Is it binomial?',
              prompt: r`The binomial needs a fixed number of independent trials, each with the same success probability. Which of these is **not** binomial?`,
              choices: [
                { t: 'The number of aces in 5 cards dealt from one deck', ok: true },
                { t: 'The number of sixes in 5 rolls of a die', why: 'Five independent rolls, each with probability 1/6: binomial.' },
                { t: 'The number of patients (out of 100) helped by a drug that works for 30% of people', why: 'If patients respond independently, this is binomial with n = 100, p = 0.3.' },
              ],
              explain: r`Cards are dealt **without replacement**: after an ace appears, the next card is less likely to be one, so the trials aren't independent. (That count follows the **hypergeometric** distribution.) When the deck is huge compared with the sample, the difference becomes negligible, which is why polls of 1,000 people from millions can use the binomial.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Defective parts',
              prompt: r`A factory's parts are each defective with probability 0.02, independently. In a box of 50, what's the probability that **none** is defective? (3 decimal places.)`,
              answer: 0.98 ** 50,
              tol: 0.0015,
              wrong: [{ v: 0.02, why: r`Every one of the 50 must be fine: $0.98^{50}$.` }, { v: 0, why: r`It's not that unlikely: $0.98^{50} \approx 0.36$.` }, { v: 1, why: r`With 50 parts, the chance at least one is defective adds up. Compute $0.98^{50}$.` }],
              explain: r`$P(X = 0) = 0.98^{50} \approx 0.364$. So almost two-thirds of boxes contain at least one defect, even though each part is 98% reliable. Small risks compound over many trials.`,
            },
          ],
          recap: [
            r`Binomial: $P(X = k) = \binom nk p^k(1-p)^{n-k}$.`,
            r`Mean $np$, standard deviation $\sqrt{np(1 - p)}$.`,
            r`The chance of no successes is $(1-p)^n$: small risks add up.`,
          ],
        },
      ],
    },
    {
      title: 'Rare Events and Waiting',
      summary: 'Poisson counts and waiting times.',
      lessons: [
        {
          id: 'poisson',
          title: 'Rare Events',
          summary: 'The Poisson distribution',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Many chances, each tiny',
              body: r`Some events have countless chances to happen, each very unlikely: calls to a help desk in an hour, typos on a page, radioactive decays in a second. If they happen independently at an average rate of $\lambda$ per interval, the count $X$ in one interval follows a **Poisson distribution**:
$$P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!}$$
It's the limit of a binomial with huge $n$ and tiny $p$, keeping $np = \lambda$. Both its mean and its variance equal $\lambda$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The Poisson shape',
              body: r`Adjust the average rate $\lambda$.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 21, ymin: -0.14, ymax: 1.08, grid: false, axes: false, height: 300,
                params: { l: { min: 0.5, max: 12, step: 0.5, value: 2, label: r`$\lambda$`, color: 'violet', format: (v) => f2(v, 1) } },
                extra: ({ plot, p, s }) => bars(plot, s, Array.from({ length: 21 }, (_, k) => poisson(p.l, k)), { color: 'violet', mark: p.l, highlight: (k) => k === 0 }),
                readout: (p) => r`$P(X = 0) = e^{-${f2(p.l, 1)}} = ${f3(Math.exp(-p.l))}$ (coral bar), $\;$ mean $= \lambda = ${f2(p.l, 1)}$`,
              },
              after: r`For small $\lambda$ the most likely count is 0 or 1. For larger $\lambda$ the distribution spreads out and looks more and more like a bell curve.`,
            },
            {
              type: 'numeric',
              title: 'A quiet hour',
              prompt: r`A help desk gets an average of 3 calls per hour, at random. What's the probability of an hour with **no** calls? (3 decimal places.)`,
              answer: Math.exp(-3),
              tol: 0.0015,
              wrong: [{ v: 0, why: r`Quiet hours do happen: $P(0) = e^{-3}$.` }, { v: 0.333, tol: 0.002, why: r`It's not $\frac13$. Use $P(0) = \frac{\lambda^0 e^{-\lambda}}{0!} = e^{-3}$.` }],
              explain: r`$P(0) = e^{-3} \approx 0.050$: about one hour in 20 is completely quiet, purely by chance.`,
            },
            {
              type: 'numeric',
              title: 'Typos',
              prompt: r`A typesetter makes an average of 2 typos per page, at random. What's the probability that a page has **at least 2** typos? (3 decimal places.)`,
              answer: 1 - 3 * Math.exp(-2),
              tol: 0.0015,
              wrong: [{ v: 2 * Math.exp(-2), tol: 0.002, why: r`That's $P(X = 1)$. You want $1 - P(0) - P(1)$.` }, { v: 0.5, why: r`Use the Poisson formula: $1 - e^{-2} - 2e^{-2}$.` }],
              hint: r`$P(X \ge 2) = 1 - P(X = 0) - P(X = 1)$.`,
              explain: r`$1 - e^{-2} - 2e^{-2} = 1 - 3e^{-2} \approx 0.594$. "At least" questions are usually easiest through the complement.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Random means clumpy',
              body: r`Scatter points completely at random over a $12 \times 12$ grid. Each cell gets a Poisson number of points, with $\lambda = $ points ÷ 144. Count the empty cells (shaded) and compare with the prediction $144\,e^{-\lambda}$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.2, xmax: 12.2, ymin: -0.2, ymax: 12.2, grid: false, axes: false, maxWidth: 420,
                params: { N: { min: 40, max: 400, step: 5, value: 135, label: 'points', color: 'violet' }, seed: { min: 1, max: 30, step: 1, value: 1, label: 'new scatter', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ plot, p, s }) => {
                  const u = uniforms(p.seed, 2 * p.N), cnt = new Array(144).fill(0), els = [];
                  for (let i = 0; i < p.N; i++) cnt[Math.floor(u[2 * i] * 12) + 12 * Math.floor(u[2 * i + 1] * 12)]++;
                  cnt.forEach((c, i) => els.push(s('rect', { x: plot.X(i % 12), y: plot.Y(Math.floor(i / 12) + 1), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1), class: c ? 'fl-card' : 'fl-amber-soft', stroke: 'var(--line)', 'stroke-width': 1 })));
                  let d = '';
                  for (let i = 0; i < p.N; i++) d += `M${plot.X(12 * u[2 * i]).toFixed(1)} ${plot.Y(12 * u[2 * i + 1]).toFixed(1)}h0`;
                  els.push(s('path', { d, stroke: 'var(--violet)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
                  return els;
                },
                readout: (p) => { const u = uniforms(p.seed, 2 * p.N), cnt = new Array(144).fill(0); for (let i = 0; i < p.N; i++) cnt[Math.floor(u[2 * i] * 12) + 12 * Math.floor(u[2 * i + 1] * 12)]++; return `empty cells: **${cnt.filter((c) => !c).length}** · Poisson prediction: $144e^{-${(p.N / 144).toFixed(2)}} \\approx ${(144 * Math.exp(-p.N / 144)).toFixed(1)}$ · most in one cell: ${Math.max(...cnt)}`; },
              },
              after: r`Even with about one point per cell, over a third of the cells are empty while others hold three or four. Random scatter **looks** clustered. In 1946 R. D. Clarke split south London into 576 squares and counted V-1 flying-bomb hits: 229 squares were untouched, against a Poisson prediction of 227. The apparent clusters were pure chance, not targeting.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Kicked by horses',
              prompt: r`A famous dataset: in the 19th-century Prussian army, deaths from horse kicks averaged about 0.7 per army corps per year. What fraction of corps-years would you expect to have **exactly one** death? (2 decimal places.)`,
              answer: 0.7 * Math.exp(-0.7),
              tol: 0.006,
              wrong: [{ v: 0.5, tol: 0.01, why: r`That's $e^{-0.7}$, the chance of **zero** deaths. For one: $\lambda e^{-\lambda}$.` }, { v: 0.7, why: r`The mean is 0.7, but $P(X = 1) = 0.7e^{-0.7}$.` }],
              explain: r`$P(1) = 0.7\,e^{-0.7} \approx 0.35$. Ladislaus Bortkiewicz showed in 1898 that the actual records matched the Poisson predictions remarkably well. It became the classic example of the "law of small numbers".`,
            },
          ],
          recap: [
            r`Poisson: $P(X = k) = \dfrac{\lambda^k e^{-\lambda}}{k!}$, for rare independent events at rate $\lambda$.`,
            r`Mean and variance are both $\lambda$.`,
            r`$P(\text{none}) = e^{-\lambda}$.`,
          ],
        },
        {
          id: 'waiting',
          title: 'Waiting Times',
          summary: 'Geometric and exponential waits',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The geometric distribution',
              body: r`Keep trying something with success probability $p$ until it first works. The number of tries $X$ follows a **geometric distribution**: you need $k - 1$ failures and then a success, so
$$P(X = k) = (1 - p)^{k - 1}\,p$$
Change $p$ and watch the bars. The dashed line marks the mean.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 31, ymin: -0.14, ymax: 1.08, grid: false, axes: false, height: 300,
                params: { p: { min: 0.05, max: 0.6, step: 0.01, value: 1 / 6, label: '$p$', color: 'blue', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => bars(plot, s, Array.from({ length: 30 }, (_, j) => (j === 0 ? 0 : (1 - p.p) ** (j - 1) * p.p)), { mark: 1 / p.p > 29 ? null : 1 / p.p, highlight: (j) => j === 1 }),
                readout: (p) => r`most likely: success on the **first** try (coral, ${(100 * p.p).toFixed(0)}%) $\;\cdot\;$ mean $1/p = ${f2(1 / p.p)}$ tries`,
              },
              after: r`The tallest bar is **always** the first try, yet the average wait is $1/p$ (6 rolls for a six), because the long tail of unlucky streaks pulls the mean far to the right.`,
            },
            {
              type: 'numeric',
              title: 'Third time lucky',
              prompt: r`What's the probability that your **first** six comes on exactly the third roll? (3 decimal places.)`,
              answer: 25 / 216,
              tol: 0.0015,
              wrong: [{ v: 1 / 6, tol: 0.002, why: 'That’s the chance the third roll is a six. The first two must also not be sixes.' }, { v: 1 / 216, tol: 0.0005, why: r`That's three sixes in a row. You need two non-sixes, then a six: $\left(\frac56\right)^2 \frac16$.` }],
              explain: r`$\left(\tfrac56\right)^2 \times \tfrac16 = \tfrac{25}{216} \approx 0.116$. Each extra failure multiplies the probability by another $\frac56$, which is why the bars shrink geometrically, and where the name comes from.`,
            },
            {
              type: 'mcq',
              title: 'Memoryless',
              prompt: r`You've rolled 10 times without a six. On average, how many **more** rolls until you get one?`,
              cols: 2,
              choices: [
                { t: '6', ok: true },
                { t: 'Fewer than 6: a six is “due”', why: 'The die has no memory. Past rolls don’t change future ones. This is the gambler’s fallacy.' },
                { t: 'More than 6: this die seems unlucky', why: 'For a fair die, each roll is still 1 in 6, regardless of history.' },
              ],
              explain: r`Each roll is independent, so the future looks exactly the same as it did at the start: still 6 more rolls on average. The geometric distribution is **memoryless**, and it's the only discrete distribution that is.`,
            },
            {
              type: 'interactive',
              title: 'Waiting in continuous time',
              body: r`Now let events happen at any instant, at random, on average every 10 minutes (like calls arriving, or buses with no timetable). The wait $T$ has an **exponential distribution**, with density $\tfrac1{10}e^{-t/10}$; probability is the **area** under the curve. Find the time $t$ by which half of all waits are over.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 0.11, grid: false, height: 300, padL: 52, axes: { xlabel: 'wait (min)', ylabel: 'density', xticks: 10, yticks: 0.05, yfmt: (v) => v.toFixed(2) },
                params: { t: { min: 0, max: 40, step: 0.1, value: 3, label: '$t$', color: 'coral', format: (v) => `${v.toFixed(1)} min` } },
                curves: [{ f: (x) => Math.exp(-x / 10) / 10, color: 'blue', width: 3 }],
                extra: ({ plot, p, s }) => { let d = `M${plot.X(0)} ${plot.Y(0)}`; for (let i = 0; i <= 60; i++) { const x = (p.t * i) / 60; d += `L${plot.X(x).toFixed(1)} ${plot.Y(Math.exp(-x / 10) / 10).toFixed(1)}`; } d += `L${plot.X(p.t)} ${plot.Y(0)}Z`; return [s('path', { d, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 }), s('line', { x1: plot.X(10), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(0.1), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' })]; },
                readout: (p) => r`$P(T \le ${p.t.toFixed(1)}) = 1 - e^{-${p.t.toFixed(1)}/10} = ${(100 * (1 - Math.exp(-p.t / 10))).toFixed(1)}\%$ $\;\cdot\;$ dashed line: the mean, 10 min`,
                goal: (p) => Math.abs(1 - Math.exp(-p.t / 10) - 0.5) < 0.004,
                hint: r`Solve $1 - e^{-t/10} = \frac12$, or slide until the area is 50%.`,
                solution: { t: 6.9 },
              },
              explain: r`$e^{-t/10} = \frac12$ gives $t = 10 \ln 2 \approx 6.9$ minutes. So the **median** wait is only 6.9 minutes, even though the **mean** is 10.`,
            },
            {
              type: 'mcq',
              title: 'Median versus mean',
              prompt: r`Why is the median wait (6.9 min) shorter than the mean wait (10 min)?`,
              choices: [
                { t: 'Occasional very long waits pull the mean up, but barely move the median', ok: true },
                { t: 'The calculation is approximate', why: r`Both are exact: the median is $10\ln 2$ and the mean is 10.` },
                { t: 'Short waits are counted twice', why: 'Every wait counts once. Look at the shape: a long tail stretches to the right.' },
              ],
              explain: r`The exponential has a long right tail: a few waits of 30 or 40 minutes drag the average up. Most people wait less than the average. The same is true of incomes, house prices and city sizes, wherever a long right tail appears.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Half-lives',
              prompt: r`Radioactive decay is memoryless too: each atom has a 50% chance of decaying in its first 5 years, and if it survives, the same 50% chance in the next 5. What's the probability that an atom survives **15** years?`,
              answer: 0.125,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'That’s for 5 years. Fifteen years is three half-lives.' }, { v: 0, why: 'Survival gets less likely, but never impossible.' }, { v: 0.167, tol: 0.002, why: r`It halves three times: $\frac12 \times \frac12 \times \frac12$.` }],
              explain: r`Three half-lives: $\left(\tfrac12\right)^3 = \tfrac18 = 0.125$. The lifetime of each atom is exponential, and the half-life is its median, $\ln 2$ times the mean lifetime. With billions of atoms the fractions become precise, which is why radioactive dating works.`,
            },
          ],
          recap: [
            r`Geometric: $P(X = k) = (1-p)^{k-1}p$, with mean $1/p$ tries.`,
            'Independent random events are memoryless: the past doesn’t make them “due”.',
            r`Exponential waits: the median ($\ln 2$ × mean) is shorter than the mean.`,
          ],
        },
        {
          id: 'large-numbers',
          title: 'Predictable Randomness',
          summary: 'When chance becomes certainty',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Spread grows slower than the mean',
              body: r`Flip a coin $n$ times. The number of heads has mean $\tfrac n2$ and standard deviation $\tfrac{\sqrt n}{2}$. The mean grows like $n$, but the spread only grows like $\sqrt n$. So the **fraction** of heads gets more and more tightly pinned near $\tfrac12$. This is the **law of large numbers**.

For large $n$, the binomial is very close to a normal (bell) curve, so about 95% of results fall within 2 standard deviations of the mean.`,
            },
            {
              type: 'numeric',
              title: 'A thousand flips',
              prompt: r`What is the standard deviation of the number of heads in 1,000 fair coin flips? (1 decimal place.)`,
              lhs: r`$\sigma =$`,
              answer: Math.sqrt(250),
              tol: 0.06,
              wrong: [{ v: 250, why: r`That's the variance, $np(1-p)$. Take the square root.` }, { v: 500, why: 'That’s the mean. The spread is much smaller.' }, { v: 31.6, tol: 0.1, why: r`$\sqrt{1000} \approx 31.6$, but you need $\sqrt{np(1-p)} = \sqrt{250}$.` }],
              explain: r`$\sigma = \sqrt{1000 \times 0.5 \times 0.5} = \sqrt{250} \approx 15.8$. So 95% of the time the count lands between about 468 and 532 heads: a fraction between 46.8% and 53.2%.`,
            },
            {
              type: 'interactive',
              title: 'Catching a slightly biased coin',
              body: r`A coin lands heads 51% of the time. How many flips before you can tell it from a fair coin? The curves show the likely **fraction of heads** for each coin. Increase $n$ until their centres are at least **4 standard deviations** apart (so the bells barely overlap).`,
              widget: {
                kind: 'graph', xmin: 0.4, xmax: 0.6, ymin: 0, ymax: 1.1, grid: false, height: 280, axes: { xlabel: 'fraction of heads', xticks: 0.05, yticks: 2, xfmt: (v) => `${Math.round(v * 100)}%` },
                params: { e: { min: 1, max: 5, step: 0.25, value: 2, label: 'flips', color: 'violet', format: (v) => `${Math.round(10 ** v).toLocaleString('en-US')}` } },
                curves: [
                  { f: (x, p) => Math.exp(-(((x - 0.5) / (0.5 / Math.sqrt(10 ** p.e))) ** 2) / 2), color: 'blue', width: 3, n: 400 },
                  { f: (x, p) => Math.exp(-(((x - 0.51) / (0.5 / Math.sqrt(10 ** p.e))) ** 2) / 2), color: 'coral', width: 3, n: 400 },
                ],
                readout: (p) => { const n = Math.round(10 ** p.e), sd = 0.5 / Math.sqrt(n); return `${n.toLocaleString('en-US')} flips: spread $\\sigma = ${(100 * sd).toFixed(2)}\\%$, centres ${(0.01 / sd).toFixed(1)} standard deviations apart`; },
                goal: (p) => 0.01 / (0.5 / Math.sqrt(10 ** p.e)) >= 4 - 1e-9,
                hint: r`The spread of the fraction is $0.5/\sqrt n$. You need $0.01 \ge 4 \times 0.5/\sqrt n$.`,
                solution: { e: 4.75 },
              },
              explain: r`Exactly, you need $\sqrt n \ge 200$, so $n \ge 40{,}000$ flips (the slider jumps from 31,623 to 56,234). Because the spread shrinks only like $1/\sqrt n$, detecting an effect half the size takes **four** times as many flips. That's why medical trials for small effects need tens of thousands of patients.`,
            },
            {
              type: 'numeric',
              title: 'The house always wins',
              prompt: r`On a European roulette wheel, a \$1 bet on red wins \$1 with probability $\frac{18}{37}$ and loses \$1 otherwise. Over a million such bets, the casino expects to make about \$27,000, and the standard deviation of its total is about \$1,000. How many standard deviations above zero is its expected profit?`,
              answer: 27,
              relTol: 0.03,
              wrong: [{ v: 0.027, tol: 0.001, why: 'That’s the edge per bet. Divide the expected profit by the standard deviation.' }],
              explain: r`$\frac{27{,}000}{1{,}000} = 27$ standard deviations: the casino losing money over a million bets is essentially impossible. The expected profit grows like $n$ while the uncertainty grows only like $\sqrt n$, so a small edge, repeated enough, becomes a near-certain income. Insurance companies rely on the same law.`,
            },
            {
              type: 'numeric',
              title: 'Ten thousand flips',
              prompt: r`The number of heads in $n$ fair flips has standard deviation $\frac{\sqrt n}{2}$. What is it for 10,000 flips?`,
              answer: 50,
              explain: r`$\frac{100}{2} = 50$. So you’d typically see between about 4,900 and 5,100 heads: the count wanders by 50, while the proportion stays within 0.5% of a half.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Suspicious coin',
              prompt: r`A coin lands heads 600 times in 1,000 flips. Is it plausibly fair?`,
              choices: [
                { t: 'Very unlikely: 600 is more than 6 standard deviations above 500', ok: true },
                { t: 'Yes: 60% is close to 50%', why: r`For 1,000 flips the spread is only about 16 heads. 100 extra heads is over 6 standard deviations.` },
                { t: 'There’s no way to tell', why: r`The binomial tells us exactly how unusual this is: $\frac{600 - 500}{15.8} \approx 6.3$ standard deviations.` },
              ],
              explain: r`$\dfrac{600 - 500}{15.8} \approx 6.3\sigma$. For a fair coin, a deviation that large has probability around one in a few billion. With 10 flips, 6 heads would be nothing unusual; with 1,000 flips, 60% is overwhelming evidence of bias. Larger samples reveal smaller effects.`,
            },
          ],
          recap: [
            r`For $n$ coin flips: mean $n/2$, standard deviation $\sqrt n / 2$.`,
            'The fraction of successes settles down (law of large numbers).',
            'Large samples make even small biases detectable.',
          ],
        },
      ],
    },
    {
      title: 'Collectors and Records',
      summary: 'Two surprising waiting games.',
      lessons: [
        {
          id: 'coupons',
          title: 'Collect Them All',
          summary: 'The coupon collector’s problem',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'The sticker album',
              body: r`Every cereal box contains one of $n$ different toys, each equally likely. How many boxes do you need to buy, on average, to collect the whole set?

This is the **coupon collector's problem**. The first toy is always new; the last one is the killer. Let's see how long it takes.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Buying boxes',
              body: r`Each dot is a box: its height shows which toy was inside. **Coral** dots are new toys; grey dots are repeats. Change the number of toys and try different runs.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: -0.6, ymax: 12.5, grid: false, height: 300, axes: { xlabel: 'boxes bought', ylabel: 'toy', xticks: 10, yticks: 2 },
                params: { n: { min: 2, max: 12, step: 1, value: 8, label: 'kinds of toy', color: 'violet' }, seed: { min: 1, max: 30, step: 1, value: 1, label: 'new run', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ plot, p, s }) => {
                  const D = couponRun(p.n, p.seed); let rep = '';
                  const els = [];
                  D.forEach(([c, isNew], i) => { if (i + 1 > 90) return; if (isNew) els.push(s('circle', { cx: plot.X(i + 1), cy: plot.Y(c + 0.5), r: 6, class: 'fl-coral' })); else rep += `M${plot.X(i + 1).toFixed(1)} ${plot.Y(c + 0.5).toFixed(1)}h0`; });
                  els.unshift(s('path', { d: rep, stroke: 'var(--ink-3)', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.5 }));
                  if (D.length <= 90) els.push(s('line', { x1: plot.X(D.length), x2: plot.X(D.length), y1: plot.Y(0), y2: plot.Y(12.5), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
                  return els;
                },
                readout: (p) => `This run: **${couponRun(p.n, p.seed).length}** boxes to collect all ${p.n} · average over many runs: **${(p.n * H(p.n)).toFixed(1)}**`,
              },
              after: r`New toys arrive quickly at first, then the gaps between coral dots grow longer and longer. Most of the boxes are bought hunting for the last one or two toys.`,
            },
            {
              type: 'numeric',
              title: 'The last toy',
              prompt: r`There are 6 toys and you already have 5 of them. Each box has a $\frac16$ chance of holding the missing one. On average, how many more boxes do you need?`,
              unit: 'boxes',
              answer: 6,
              wrong: [{ v: 1, why: 'Only 1 box in 6 contains the missing toy.' }, { v: 3, why: r`The average wait for a chance of $p$ is $1/p$ tries, not half of it.` }],
              explain: r`It's a geometric wait with $p = \frac16$: **6** boxes on average, the same as waiting for a six. In general, with $k$ of the $n$ toys already collected, a box is new with probability $\frac{n - k}{n}$, so you wait $\frac{n}{n - k}$ boxes on average for the next new one.`,
            },
            {
              type: 'numeric',
              title: 'Adding up the stages',
              prompt: r`Add up the average waits for all six stages, $\frac66 + \frac65 + \frac64 + \frac63 + \frac62 + \frac61$. How many boxes, on average, to collect all 6 toys? (1 decimal place.)`,
              unit: 'boxes',
              answer: 6 * H(6),
              tol: 0.06,
              wrong: [{ v: 6, why: 'That’s only the last stage. Add the waits for all six stages.' }, { v: 21, why: r`That adds $1 + 2 + \cdots + 6$. The stages are $\frac6{6-k}$: 1, 1.2, 1.5, 2, 3, 6.` }],
              hint: r`$1 + 1.2 + 1.5 + 2 + 3 + 6$.`,
              explain: r`$1 + 1.2 + 1.5 + 2 + 3 + 6 = 14.7$ boxes. In general the answer is $n\left(1 + \frac12 + \frac13 + \cdots + \frac1n\right) = n H_n$, where $H_n$ is the **harmonic number**. Here linearity of expectation does the work: the total wait is the sum of the stage waits.`,
            },
            {
              type: 'mcq',
              title: 'Twice the album',
              prompt: r`Album A has 50 stickers and album B has 100 (one random sticker per pack). How do the average numbers of packs compare?`,
              choices: [
                { t: 'B takes a bit more than twice as many packs as A', ok: true },
                { t: 'B takes exactly twice as many', why: r`$nH_n$ isn't proportional to $n$: $H_n$ grows too, slowly.` },
                { t: 'B takes four times as many', why: r`It grows like $n \ln n$, which is much slower than $n^2$.` },
              ],
              explain: r`$50 H_{50} \approx 225$ and $100 H_{100} \approx 519$, a ratio of about 2.3. Since $H_n \approx \ln n + 0.577$, the cost grows like $n \ln n$: a little faster than the album size itself. Real collectors swap duplicates, which helps enormously.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A hundred stickers',
              prompt: r`Use $H_n \approx \ln n + 0.577$ to estimate the average number of single-sticker packs needed to fill a 100-sticker album. ($\ln 100 \approx 4.605$.)`,
              unit: 'packs',
              answer: 100 * H(100),
              relTol: 0.01,
              wrong: [{ v: 100, why: 'That would only work if no pack were ever a repeat.' }, { v: 460.5, relTol: 0.01, why: r`Don't forget the $0.577$: $100 \times (4.605 + 0.577)$.` }],
              explain: r`$100 \times (4.605 + 0.577) \approx 518$ packs (the exact value is 518.7). More than half of them are bought after you already have 90 stickers: the last 10 take $100\left(\frac1{10} + \frac19 + \cdots + 1\right) \approx 293$ packs on average.`,
            },
          ],
          recap: [
            r`With $k$ of $n$ collected, the next new item takes $\frac{n}{n-k}$ tries on average.`,
            r`Collecting all $n$ takes $nH_n \approx n(\ln n + 0.577)$ tries on average.`,
            'The final few items take most of the effort.',
          ],
        },
        {
          id: 'records',
          title: 'Record Breakers',
          summary: 'How often records fall',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'Is it a record?',
              body: r`A value is a **record** if it's bigger than every value before it: the hottest year so far, the biggest flood, the fastest lap. If the values are random and independent, all drawn from the same distribution, how often should records happen?

There's a lovely symmetry argument. Among the first $k$ values, each one is equally likely to be the largest. So the $k$-th value is a record with probability exactly $\frac1k$, **whatever the distribution**.`,
            },
            {
              type: 'numeric',
              title: 'The tenth year',
              prompt: r`A river's yearly peak flood levels are random and independent with no trend. What's the probability that year 10 sets a new record?`,
              answer: 0.1,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'Each of the first 10 years is equally likely to be the biggest.' }, { v: 0.9, why: 'That’s the chance it is **not** a record.' }],
              explain: r`$\frac{1}{10}$: the largest of the first ten years is equally likely to be any of them. Records get steadily rarer, but they never stop completely.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watching records fall',
              body: r`Each dot is a random value; the coral dots are records, and the amber staircase is the best so far. Change how many values there are, and try new runs.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1.01, ymin: 0, ymax: 1.04, grid: false, height: 280, axes: { xlabel: 'time', xticks: 5, yticks: 2 },
                params: { n: { min: 10, max: 200, step: 5, value: 100, label: 'values', color: 'violet' }, seed: { min: 1, max: 30, step: 1, value: 1, label: 'new run', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ plot, p, s }) => {
                  const v = uniforms(p.seed, p.n), rec = records(v); let d = '', stair = '', best = 0;
                  const els = [];
                  v.forEach((y, i) => { if (rec[i]) { stair += `${i ? `L${plot.X((i + 1) / p.n).toFixed(1)} ${plot.Y(best).toFixed(1)}` : `M${plot.X(1 / p.n).toFixed(1)} ${plot.Y(y).toFixed(1)}`}L${plot.X((i + 1) / p.n).toFixed(1)} ${plot.Y(y).toFixed(1)}`; best = y; els.push(s('circle', { cx: plot.X((i + 1) / p.n), cy: plot.Y(y), r: 6, class: 'fl-coral' })); } else d += `M${plot.X((i + 1) / p.n).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`; });
                  stair += `L${plot.X(1).toFixed(1)} ${plot.Y(best).toFixed(1)}`;
                  return [s('path', { d, stroke: 'var(--ink-3)', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.5 }), s('path', { d: stair, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.5 }), ...els];
                },
                readout: (p) => `records in this run: **${records(uniforms(p.seed, p.n)).filter(Boolean).length}** · average: $H_{${p.n}} = ${H(p.n).toFixed(2)}$`,
              },
              after: r`Records come thick and fast at the start, then dry up. Adding up the chances $1 + \frac12 + \frac13 + \cdots + \frac1n$ gives the average number of records: the harmonic number $H_n$ again, which grows only like $\ln n$.`,
            },
            {
              type: 'numeric',
              title: 'A century of records',
              prompt: r`With no trend, how many record years would you expect in 100 years of data? Use $H_n \approx \ln n + 0.577$ ($\ln 100 \approx 4.6$). (1 decimal place.)`,
              unit: 'records',
              answer: H(100),
              tol: 0.1,
              wrong: [{ v: 1, why: 'The first year is always a record, but later years can be too.' }, { v: 10, why: r`The chances shrink like $\frac1k$, so the total grows only like $\ln n$.` }],
              explain: r`$H_{100} \approx 4.6 + 0.58 \approx 5.2$ records. About 3 of those are expected in the first 10 years ($H_{10} \approx 2.9$), and only about 2.3 in the 90 years after that.`,
            },
            {
              type: 'mcq',
              title: 'Too many records',
              prompt: r`With no trend, the 175th year of a temperature series would have only a 1-in-175 chance of being the hottest yet. Global temperature records began around 1850, and both 2023 and 2024 set new records. What does that suggest?`,
              choices: [
                { t: 'The values aren’t random draws from an unchanging distribution: there is an upward trend', ok: true },
                { t: 'Nothing: records happen at random', why: r`Random records this late should be rare (about $\frac1{175}$ each). Back-to-back records point to something else.` },
                { t: 'Thermometers have become less accurate', why: 'Measurement noise would make records random, not more frequent near the end.' },
              ],
              explain: r`The $\frac1k$ rule is a baseline for a world **without** change. Far more records than $H_n$, clustered at the end of the series, are a statistical fingerprint of a trend. Climate scientists use exactly this comparison as one line of evidence for warming.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ten records',
              prompt: r`With no trend, about how many values do you need before you expect **10** records? Use $H_n \approx \ln n + 0.577$ and solve $\ln n + 0.577 = 10$.`,
              answer: Math.exp(10 - 0.5772156649),
              relTol: 0.05,
              wrong: [{ v: Math.exp(10), relTol: 0.05, why: r`Subtract the 0.577 first: $n = e^{9.423}$.` }, { v: 1024, why: 'Records grow like ln n, not like log base 2.' }],
              hint: r`$n = e^{10 - 0.577} = e^{9.42}$.`,
              explain: r`$n = e^{9.42} \approx 12{,}400$. Five records take about 80 values, but ten take over twelve thousand: each extra record needs about $e \approx 2.7$ times as many values. Records are logarithmically rare.`,
            },
          ],
          recap: [
            r`For random, independent values, the $k$-th is a record with probability $\frac1k$.`,
            r`Expected records in $n$ values: $H_n \approx \ln n + 0.577$.`,
            'Many more records than this, especially recent ones, point to a trend.',
          ],
        },
      ],
    },
  ],
};
