const r = String.raw;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const walkCache = new Map();
function walks(seed, n = 400, k = 8) {
  const key = `${seed}`;
  if (walkCache.has(key)) return walkCache.get(key);
  const u = rng(seed * 101 + 7);
  const out = Array.from({ length: k }, () => {
    let x = 0;
    const path = [0];
    for (let i = 0; i < n; i++) path.push((x += u() < 0.5 ? 1 : -1));
    return path;
  });
  walkCache.set(key, out);
  return out;
}
// 2D lattice walk
const walk2Cache = new Map();
function walk2(seed) {
  if (walk2Cache.has(seed)) return walk2Cache.get(seed);
  const u = rng(seed * 313 + 11), pts = [[0, 0]];
  let x = 0, y = 0;
  for (let i = 0; i < 4000; i++) { const r4 = Math.floor(u() * 4); if (r4 === 0) x++; else if (r4 === 1) x--; else if (r4 === 2) y++; else y--; pts.push([x, y]); }
  walk2Cache.set(seed, pts);
  return pts;
}
// a cloud of 600 one-dimensional walkers, positions recorded at every step up to 400
const CLOUD = (() => { let c = null; return () => { if (c) return c; const u = rng(4242), W = 600, T = 400; c = []; const pos = new Array(W).fill(0); c.push([...pos]); for (let t = 1; t <= T; t++) { for (let i = 0; i < W; i++) pos[i] += u() < 0.5 ? 1 : -1; c.push([...pos]); } return c; }; })();
// probability of being back at the origin after 2n steps, in 1, 2 and 3 dimensions, and the expected number of returns so far
const LF = (() => { const a = [0]; for (let i = 1; i <= 400; i++) a.push(a[i - 1] + Math.log(i)); return a; })();
const P1 = (n) => Math.exp(LF[2 * n] - 2 * LF[n] - 2 * n * Math.LN2);
const P3 = (n) => { let t = 0; for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) t += Math.exp(LF[2 * n] - 2 * (LF[i] + LF[j] + LF[n - i - j]) - 2 * n * Math.log(6)); return t; };
const RET = (() => { let E = null; return () => { if (E) return E; E = [[0], [0], [0]]; for (let n = 1; n <= 100; n++) { const a = P1(n); E[0].push(E[0][n - 1] + a); E[1].push(E[1][n - 1] + a * a); E[2].push(E[2][n - 1] + P3(n)); } return E; }; })();
// coin-flip games of 200 flips: the fraction of time player A is ahead
const leadWalk = (seed) => { const u = rng(seed * 977 + 5), w = [0]; for (let i = 0; i < 200; i++) w.push(w[i] + (u() < 0.5 ? 1 : -1)); return w; };
const aheadFrac = (w) => { let a = 0; for (let i = 1; i < w.length; i++) if (w[i] > 0 || w[i - 1] > 0) a++; return a / (w.length - 1); };
const ARCSINE = (() => { let h = null; return () => { if (h) return h; h = new Array(20).fill(0); for (let s = 1; s <= 4000; s++) { const f = aheadFrac(leadWalk(1000 + s)); h[Math.min(19, Math.floor(f * 20))]++; } return h; }; })();
// a square plate: top edge at 100°, other edges at 0°. Exact steady temperature, and random walkers on a 20 × 20 grid
const plateT = (x, y) => { let t = 0; for (let n = 1; n < 120; n += 2) t += (Math.sin(n * Math.PI * x) * Math.exp(n * Math.PI * (y - 1)) * (1 - Math.exp(-2 * n * Math.PI * y))) / (1 - Math.exp(-2 * n * Math.PI)) / n; return (400 / Math.PI) * t; };
const plateWalks = (px, py, count = 400) => {
  const i0 = Math.round(px * 20), j0 = Math.round(py * 20), u = rng(i0 * 101 + j0 * 7 + 3), paths = [];
  let hot = 0;
  for (let w = 0; w < count; w++) {
    let i = i0, j = j0;
    const path = w < 6 ? [[i, j]] : null;
    while (i > 0 && i < 20 && j > 0 && j < 20) { const r4 = Math.floor(u() * 4); if (r4 === 0) i++; else if (r4 === 1) i--; else if (r4 === 2) j++; else j--; if (path) path.push([i, j]); }
    if (j === 20) hot++;
    if (path) paths.push([path, j === 20]);
  }
  return { est: (100 * hot) / count, paths, snapped: [i0 / 20, j0 / 20] };
};
const COLS = ['blue', 'coral', 'teal', 'violet', 'amber', 'pink', 'blue', 'coral'];

export default {
  id: 'randomwalks',
  subject: 'math',
  title: 'Random Walks',
  level: 'Advanced',
  cover: 'randomwalks',
  tagline: 'Coin-flip wanderings, gamblers, pollen grains, lost birds and walkers that solve equations.',
  description: r`Take a step left or right at the flip of a coin. Where do you end up? Random walks describe gamblers' fortunes, the jiggling of pollen in water, stock prices and diffusing molecules. Discover the square-root law, the gambler's ruin, and why a drunk person always finds home but a drunk bird might not.`,
  prereq: 'Probability Distributions',
  chapters: [
    {
      title: 'Walking at Random',
      summary: 'The square-root law.',
      lessons: [
        {
          id: 'walk',
          title: 'The Drunkard’s Walk',
          summary: 'How far do you get?',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Eight walkers',
              body: r`Each walker starts at 0 and, every second, flips a coin: heads, one step right (up on the graph); tails, one step left (down). Here are 8 walkers for 400 steps. Try different random days.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 400, ymin: -60, ymax: 60, grid: 50, gridY: 20, height: 330, axes: { xlabel: 'steps', ylabel: 'position', yAt: -60 },
                params: { seed: { min: 1, max: 30, step: 1, value: 1, label: 'new walkers', color: 'blue', format: (v) => `#${v}` } },
                curves: [{ f: () => 0, color: 'muted', width: 1.5 }, { f: (x) => 2 * Math.sqrt(x), color: 'ink', dash: true }, { f: (x) => -2 * Math.sqrt(x), color: 'ink', dash: true }],
                extra: ({ plot, p, s }) => walks(p.seed).map((path, j) => s('path', { d: path.map((v, i) => `${i ? 'L' : 'M'}${plot.X(i).toFixed(1)} ${plot.Y(v).toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${COLS[j]})`, 'stroke-width': 1.6, opacity: 0.8 })),
                readout: (p) => {
                  const ends = walks(p.seed).map((w) => w[w.length - 1]);
                  const rms = Math.sqrt(ends.reduce((a, b) => a + b * b, 0) / ends.length);
                  return `final positions: ${ends.join(', ')} · root-mean-square: **${rms.toFixed(1)}** (√400 = 20)`;
                },
              },
              after: r`On average the walkers end up at 0: they're as likely to go left as right. But a typical walker strays about $\sqrt{n}$ steps from the start. After 400 steps, that's about 20. The dashed curves at $\pm 2\sqrt n$ contain about 95% of walkers at any moment.`,
            },
            {
              type: 'numeric',
              title: 'The square-root law',
              prompt: r`A random walker takes 10,000 steps of length 1. About how far from the start do they typically end up?`,
              unit: 'steps',
              answer: 100,
              wrong: [{ v: 0, why: 'That’s the average position. The typical distance from the start is not zero.' }, { v: 10000, why: 'Only if every step went the same way! Random steps partly cancel.' }, { v: 5000, why: r`Random steps cancel more than that: the typical distance is $\sqrt{n}$.` }],
              explain: r`The typical (root-mean-square) distance is $\sqrt{10{,}000} = 100$ steps. Each step is $\pm 1$ independently, so the variance of the position is $n$, and the standard deviation is $\sqrt n$. To get 10 times farther, a random walker needs 100 times more steps.`,
            },
            {
              type: 'numeric',
              title: 'Back to zero',
              prompt: r`What's the probability that a walker is back at 0 after exactly **4** steps? (Give a decimal.)`,
              answer: 6 / 16,
              tol: 0.002,
              wrong: [{ v: 0.5, why: r`Count the paths: of the $2^4 = 16$ equally likely step sequences, which have two steps each way?` }, { v: 1 / 16, tol: 0.002, why: 'There’s more than one way: the two right steps can be any 2 of the 4.' }],
              hint: r`You need 2 steps right and 2 left, in any order: $\binom42$ of the 16 sequences.`,
              explain: r`$\binom42 = 6$ of the $16$ sequences return to 0, so the probability is $\frac{6}{16} = 0.375$. After $2n$ steps it's $\binom{2n}{n}/4^n \approx \frac{1}{\sqrt{\pi n}}$: being exactly at the start gets rarer, slowly.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A walk in the plane',
              body: r`Now the walker steps north, south, east or west at random. The dashed circle has radius $\sqrt n$. Slide the number of steps and try different walks.`,
              widget: {
                kind: 'graph', equal: true, xmin: -80, xmax: 80, ymin: -80, ymax: 80, grid: false, axes: false, maxWidth: 440,
                params: { n: { min: 10, max: 4000, step: 10, value: 1000, label: 'steps', color: 'violet' }, seed: { min: 1, max: 30, step: 1, value: 1, label: 'new walk', color: 'blue', format: (v) => `#${v}` } },
                curves: [{ param: { x: (t, p) => Math.sqrt(p.n) * Math.cos(t), y: (t, p) => Math.sqrt(p.n) * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'ink', dash: true }],
                extra: ({ plot, p, s }) => { const w = walk2(p.seed).slice(0, p.n + 1), [ex, ey] = w[w.length - 1]; return [s('path', { d: 'M' + w.map(([x, y]) => `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('L'), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 1.2, opacity: 0.75 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-ink' }), s('circle', { cx: plot.X(ex), cy: plot.Y(ey), r: 6, class: 'fl-coral' })]; },
                readout: (p) => { const [ex, ey] = walk2(p.seed)[p.n]; return `distance from start: **${Math.hypot(ex, ey).toFixed(1)}** · $\\sqrt{n} = ${Math.sqrt(p.n).toFixed(1)}$`; },
              },
              after: r`The square-root law holds in any dimension: after $n$ unit steps, the root-mean-square distance is exactly $\sqrt n$, because the squared distances of independent steps add up. The walk also retraces itself constantly, crowding its own neighbourhood.`,
            },
            {
              type: 'numeric',
              title: 'Checking the law',
              prompt: r`A walker on a grid takes 2 steps, each north, south, east or west at random. What is the **average squared distance** from the start? (Cases: the second step undoes the first; repeats it; or turns 90°.)`,
              answer: 2,
              tol: 0.001,
              wrong: [{ v: 4, why: r`That's only when both steps go the same way (probability $\frac14$). Average over all the cases.` }, { v: 1.5, tol: 0.001, why: r`Check the turning case: two perpendicular steps end $\sqrt2$ away, a squared distance of 2, with probability $\frac12$.` }],
              explain: r`Back to the start (probability $\frac14$): $0$. Same direction twice ($\frac14$): $2^2 = 4$. A right-angle turn ($\frac12$): $1^2 + 1^2 = 2$. Average: $0 + 1 + 1 = 2$, exactly the number of steps. That's the square-root law: mean squared distance $= n$, so the typical distance is $\sqrt n$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'An hour of wandering',
              prompt: r`A lost hiker in fog takes one 0.5 m step per second in a random direction. Roughly how long until they're typically 30 m from where they started?`,
              unit: 's',
              answer: 3600,
              relTol: 0.02,
              wrong: [{ v: 60, why: 'That’s if every step went the same way. Random steps need the square: (30 / 0.5)² steps.' }, { v: 900, why: r`Distance $= 0.5\sqrt n$, so $\sqrt n = 60$: $n = 3600$.` }],
              hint: r`Typical distance $= 0.5\sqrt n$ metres after $n$ steps.`,
              explain: r`$0.5\sqrt n = 30$ gives $\sqrt n = 60$, so $n = 3600$ steps: **an hour** to get 30 m away, a distance a purposeful walker covers in 25 seconds. (Real lost people tend to walk in circles rather than randomly, but they rarely get far either.)`,
            },
          ],
          recap: [
            'A symmetric random walk averages 0, but typically strays √n from the start.',
            'Variance of the position after n steps: n.',
            'Ten times the distance takes a hundred times the steps.',
          ],
        },
        {
          id: 'ruin',
          title: 'Gambler’s Ruin',
          summary: 'Why the house always wins',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Walking to a boundary',
              body: r`A gambler starts with \$$k$ and bets \$1 at a time on a fair coin, stopping when they either reach a target of \$$N$ or go broke. Their fortune is a random walk between two boundaries.

Because the game is fair, the gambler's **expected** fortune never changes. If $p$ is the probability of reaching \$$N$ before \$0, then the expected final fortune is $pN + (1 - p) \cdot 0 = k$, so
$$p = \frac{k}{N}$$`,
            },
            {
              type: 'numeric',
              title: 'Double or bust?',
              prompt: r`Starting with \$20, a gambler bets \$1 at a time on a fair coin, aiming to reach \$100. What is the probability they succeed before going broke?`,
              answer: 0.2,
              tol: 0.001,
              wrong: [{ v: 0.5, why: r`The game is fair, but the target is far away. Use $p = k/N = 20/100$.` }, { v: 0.8, why: 'That’s the probability of going broke.' }],
              explain: r`$p = \dfrac{20}{100} = 0.2$. So 80% of the time, the gambler loses everything, even though every bet is perfectly fair. Reaching \$100 happens just often enough (20% × \$100 = \$20) to make the average come out even.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A slightly unfair coin',
              body: r`Now each \$1 bet is won with probability $p$, not necessarily $\frac12$. The curve shows the chance of reaching \$100 before \$0, for every starting amount. Nudge $p$ just below $\frac12$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 100, ymin: 0, ymax: 1, grid: false, height: 300, axes: { xlabel: 'starting money (dollars)', ylabel: 'chance of reaching 100', xticks: 20, yticks: 0.25 },
                params: { p: { min: 0.45, max: 0.55, step: 0.005, value: 0.49, label: '$p$', color: 'coral', format: (v) => v.toFixed(3) }, k: { min: 0, max: 100, step: 1, value: 50, label: 'start', color: 'blue', format: (v) => `\\$${v}` } },
                curves: [{ f: (x) => x / 100, color: 'muted', dash: true }, { f: (x, p) => { if (Math.abs(p.p - 0.5) < 1e-9) return x / 100; const q = (1 - p.p) / p.p; return (1 - q ** x) / (1 - q ** 100); }, color: 'coral', width: 3 }],
                points: [{ x: (p) => p.k, y: (p) => { if (Math.abs(p.p - 0.5) < 1e-9) return p.k / 100; const q = (1 - p.p) / p.p; return (1 - q ** p.k) / (1 - q ** 100); }, color: 'blue' }],
                readout: (p) => { const q = (1 - p.p) / p.p, v = Math.abs(p.p - 0.5) < 1e-9 ? p.k / 100 : (1 - q ** p.k) / (1 - q ** 100); return `starting with \\$${p.k}: **${(100 * v).toFixed(1)}%** chance of reaching \\$100 (fair coin: ${p.k}%)`; },
              },
              after: r`With $q = 1 - p$, the exact answer is $\dfrac{1 - (q/p)^k}{1 - (q/p)^{100}}$. A tiny edge, compounded over the hundreds of bets a long game takes, bends the line dramatically.`,
            },
            {
              type: 'numeric',
              title: 'Forty-nine percent',
              prompt: r`With $p = 0.49$, a gambler starting with \$50 aims for \$100 with \$1 bets. What's the probability of success? (Use the curve or the formula; 2 decimal places.)`,
              answer: 1 / (1 + (0.51 / 0.49) ** 50),
              tol: 0.006,
              wrong: [{ v: 0.49, why: r`That's the chance of winning one bet. Over many bets the edge compounds: use the curve at \$50.` }, { v: 0.5, why: 'That would be true for a fair coin. A 1% edge against you changes it a lot.' }],
              explain: r`About **0.12**, down from 0.5 for a fair coin. Surprisingly, the best strategy in an unfair game is **bold play**: bet all \$50 at once and you win with probability 0.49. Small bets give the house's edge time to grind you down.`,
            },
            {
              type: 'numeric',
              title: 'How long does it last?',
              prompt: r`For a fair coin, the expected number of bets until the game ends (at \$0 or \$N) is $k(N - k)$. Starting with \$20 and aiming for \$100, how many bets does the game last on average?`,
              unit: 'bets',
              answer: 1600,
              wrong: [{ v: 80, why: r`That's $N - k$. Multiply by $k$: $20 \times 80$.` }, { v: 2000, why: r`$k(N - k) = 20 \times 80$.` }],
              explain: r`$20 \times 80 = 1600$ bets, even though the gambler starts only 20 steps from ruin. It's the square-root law again: a random walk takes about $d^2$ steps to travel distance $d$. The longest games start in the middle: $50 \times 50 = 2500$ bets.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Against the casino',
              prompt: r`In real roulette, the odds are slightly against the player on every bet. What happens to a gambler who keeps playing against a casino with enormous reserves?`,
              choices: [
                { t: 'They will almost certainly go broke eventually', ok: true },
                { t: 'They’ll break even in the long run', why: 'With a negative edge, the walk drifts downward, and the casino effectively has no upper boundary.' },
                { t: 'They’ll eventually win big, since luck evens out', why: 'Luck doesn’t "even out" against a built-in disadvantage: the drift is relentless.' },
              ],
              explain: r`With a small negative edge per bet, the walk **drifts** downward. Against an opponent with essentially unlimited money (so the upper boundary is effectively infinitely far away), the probability of eventual ruin approaches 1. Even in a fair game, ruin is certain against an infinitely rich opponent, because $k/N \to 0$ as $N \to \infty$.`,
            },
          ],
          recap: [
            r`Fair game with boundaries 0 and $N$, starting at $k$: $P(\text{reach } N) = k/N$.`,
            'Even fair games usually ruin players aiming for big targets.',
            'With an unfavourable edge, ruin is virtually certain.',
          ],
        },
      ],
    },
    {
      title: 'Walks in Nature',
      summary: 'Diffusion and dimension.',
      lessons: [
        {
          id: 'brownian',
          title: 'Brownian Motion',
          summary: 'Jiggling pollen and diffusion',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Proof of atoms',
              body: r`In 1827, the botanist Robert Brown saw tiny particles from pollen grains jiggling restlessly in water. In 1905, Einstein explained it: the particles are being bombarded by invisible water molecules, so they perform a random walk. He predicted how far they'd wander:
$$\text{typical distance} \propto \sqrt{t}$$
In 1908, Jean Perrin confirmed the prediction and used it to estimate the size of molecules, convincing the remaining skeptics that atoms are real.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A spreading cloud',
              body: r`Release 600 walkers from the same point, like a drop of dye. The bars show where they are after $t$ steps, and the curve is a bell curve with standard deviation $\sqrt t$.`,
              widget: {
                kind: 'graph', xmin: -60, xmax: 60, ymin: 0, ymax: 0.3, grid: false, height: 280, axes: { xlabel: 'position', xticks: 20, yticks: 1, xAt: -60 },
                params: { t: { min: 1, max: 400, step: 1, value: 25, label: 'time', color: 'violet', format: (v) => `${v} steps` } },
                curves: [{ f: (x, p) => (2 * Math.exp(-(x * x) / (2 * p.t))) / Math.sqrt(2 * Math.PI * p.t), color: 'coral', width: 2.5, n: 300 }],
                extra: ({ plot, p, s }) => { const pos = CLOUD()[p.t], cnt = new Map(); for (const x of pos) cnt.set(x, (cnt.get(x) || 0) + 1); const w = Math.max(1, plot.X(2) - plot.X(0) - 1); return [...cnt].filter(([x]) => Math.abs(x) <= 60).map(([x, c]) => { const hgt = Math.min(0.3, c / 600); return s('rect', { x: plot.X(x) - w / 2, y: plot.Y(hgt), width: w, height: plot.Y(0) - plot.Y(hgt), class: 'fl-blue', opacity: 0.8 }); }); },
                readout: (p) => { const pos = CLOUD()[p.t], rms = Math.sqrt(pos.reduce((a, x) => a + x * x, 0) / pos.length); return `spread of the cloud (rms): **${rms.toFixed(1)}** · $\\sqrt t = ${Math.sqrt(p.t).toFixed(1)}$`; },
              },
              after: r`The cloud stays centred but spreads like $\sqrt t$, taking on the bell shape of the **normal distribution**. This is the central limit theorem in action, and it's exactly the solution of the **diffusion equation**, which describes heat spreading through metal and perfume spreading through a room.`,
            },
            {
              type: 'numeric',
              title: 'Diffusion time',
              prompt: r`A drop of dye diffuses 1 mm in about 10 minutes in still water. Roughly how long would it take to diffuse 10 mm (with no stirring)?`,
              unit: 'minutes',
              answer: 1000,
              relTol: 0.01,
              wrong: [{ v: 100, why: r`Distance grows as $\sqrt t$, so time grows as distance squared: $10^2 = 100$ times longer.` }, { v: 31.6, tol: 0.5, why: 'That treats time as growing like √distance. It’s the other way round: time ∝ distance², so 10² = 100 times longer.' }],
              explain: r`Time $\propto$ distance², so 10× the distance takes 100× the time: about **1,000 minutes**, nearly 17 hours. That's why you stir your tea: diffusion alone is fast over tiny distances (as inside a cell) but painfully slow over centimetres.`,
            },
            {
              type: 'numeric',
              title: 'Einstein’s formula',
              prompt: r`Einstein showed that the mean squared distance moved along one direction is $\langle x^2 \rangle = 2Dt$, where $D$ is the **diffusion coefficient**. For sugar in water, $D \approx 5 \times 10^{-10}$ m²/s. About how long does it take sugar to spread 1 mm ($10^{-3}$ m)?`,
              unit: 's',
              answer: 1000,
              relTol: 0.02,
              wrong: [{ v: 2000, why: r`Solve $t = \frac{x^2}{2D}$: the 2 goes in the denominator.` }, { v: 1e6, why: r`Square the distance: $(10^{-3})^2 = 10^{-6}$ m².` }],
              hint: r`$t = \dfrac{x^2}{2D} = \dfrac{10^{-6}}{10^{-9}}$.`,
              explain: r`$t = \dfrac{10^{-6}}{2 \times 5 \times 10^{-10}} = 1000$ s, about 17 minutes, in line with the dye drop. Perrin measured $\langle x^2 \rangle$ for tiny beads under a microscope; since $D$ depends on the size of molecules, that gave one of the first accurate counts of atoms in a mole (Avogadro's number).`,
            },
            {
              type: 'numeric',
              title: 'Diffusing a metre',
              prompt: r`A small molecule in water has $D \approx 10^{-9}$ m²/s, and spreading a distance $x$ takes about $\frac{x^2}{2D}$. How many **years** to spread 1 m? (Nearest whole number.)`,
              unit: 'years',
              answer: 1 / (2e-9) / 3.156e7,
              tol: 0.6,
              explain: r`$\frac{1}{2 \times 10^{-9}} = 5 \times 10^8$ s, about **16 years**. Diffusion is fast across a cell (milliseconds) but hopeless over everyday distances, which is why your body needs a circulatory system, and why stirring your tea helps.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Inside a cell',
              prompt: r`Why can small cells rely on diffusion to move molecules around, while large animals need hearts and blood vessels?`,
              choices: [
                { t: 'Diffusion time grows with the square of the distance, so it’s quick across micrometres but hopelessly slow across centimetres', ok: true },
                { t: 'Molecules diffuse faster in small cells', why: 'The diffusion rate is about the same. What differs is the distance.' },
                { t: 'Large animals have thicker fluids', why: 'The key is the square law: doubling the distance quadruples the time.' },
              ],
              explain: r`A small molecule diffuses across a 10 µm cell in about a twentieth of a second. Crossing 10 cm, 10,000 times farther, would take 100 million times longer: about two months. Circulatory systems carry molecules by flow over long distances, leaving diffusion for the last tiny step.`,
            },
          ],
          recap: [
            'Brownian motion is a random walk driven by molecular collisions.',
            r`Distance $\propto \sqrt t$, so time $\propto$ distance².`,
            'Diffusion is fast at the scale of cells and slow at the scale of bodies.',
          ],
        },
        {
          id: 'polya',
          title: 'Lost in Three Dimensions',
          summary: 'Pólya’s theorem',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Will you get back?',
              body: r`A random walker on an infinite grid steps to a random neighbouring point each second. Will they ever return to where they started?

In 1921, George Pólya proved a startling answer:
- On a **line** (1D) or a **plane** (2D): **yes**, with probability 1. They return eventually (infinitely often, in fact).
- In **3D** space: only about a **34%** chance. Most walkers drift away forever.`,
            },
            {
              type: 'numeric',
              title: 'Two steps and back',
              prompt: r`On a 2D grid, what's the probability that a walker is back at the start after exactly 2 steps?`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'That’s for a line. On a grid, the second step must undo the first: 1 choice out of 4.' }, { v: 1 / 16, tol: 0.002, why: 'The first step can be anything. Only the second step has to be the exact reverse.' }],
              explain: r`Whatever the first step, the second must be its exact reverse: probability $\frac14$. On a line it's $\frac12$; in 3D it's $\frac16$. More directions mean more ways to wander off.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Counting returns',
              body: r`Add up the chances of being back at the start at each step: that's the **expected number of returns** so far. Compare one, two and three dimensions as the walk gets longer.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 200, ymin: 0, ymax: 2.2, grid: false, height: 300, axes: { xlabel: 'steps', ylabel: 'expected returns', xticks: 50, yticks: 0.5 },
                params: { n: { min: 2, max: 200, step: 2, value: 100, label: 'steps', color: 'violet' } },
                curves: [
                  { f: (x) => RET()[0][Math.floor(x / 2)], color: 'blue', width: 3, n: 200 },
                  { f: (x) => RET()[1][Math.floor(x / 2)], color: 'teal', width: 3, n: 200 },
                  { f: (x) => RET()[2][Math.floor(x / 2)], color: 'coral', width: 3, n: 200 },
                  { f: () => 0.5164, color: 'coral', dash: true },
                ],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.n), x2: plot.X(p.n), y1: plot.Y(0), y2: plot.Y(2.2), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '5 5' })],
                readout: (p) => { const k = p.n / 2, E = RET(); return `after ${p.n} steps: 1D (blue) **${E[0][k].toFixed(2)}** · 2D (teal) **${E[1][k].toFixed(2)}** · 3D (coral) **${E[2][k].toFixed(2)}**`; },
              },
              after: r`In 1D the expected count grows like $\sqrt n$ (it shoots off the chart), and in 2D like $\ln n$: slowly, but **without limit**. In 3D it levels off near $0.516$ (dashed). The chance of being at the origin at step $2n$ shrinks like $n^{-d/2}$, and adding those up diverges only for $d \le 2$.`,
            },
            {
              type: 'numeric',
              title: 'From returns to probability',
              prompt: r`If each return happens with probability $R$, and every return starts the walk afresh, the expected number of returns is $\dfrac{R}{1 - R}$. In 3D that equals about $0.516$. Solve for $R$. (2 decimal places.)`,
              answer: 0.5164 / 1.5164,
              tol: 0.006,
              wrong: [{ v: 0.516, tol: 0.006, why: r`That's the expected number of returns. Solve $\frac{R}{1-R} = 0.516$.` }, { v: 1, why: 'That would make the expected number infinite, as in 1D and 2D.' }],
              hint: r`$R = 0.516(1 - R)$, so $R = \dfrac{0.516}{1.516}$.`,
              explain: r`$R = \frac{0.516}{1.516} \approx 0.34$: Pólya's 34%. In 1D and 2D the expected count is infinite, which forces $R = 1$: return is certain. (Each return repeats the whole process, so the number of returns is geometric, and that's where $\frac{R}{1-R}$ comes from.)`,
            },
            {
              type: 'numeric',
              title: 'Back home on a grid',
              prompt: r`On a 2D grid, the chance of being back at the start after $2n$ steps is about $\frac{1}{\pi n}$. What is it after 100 steps ($n = 50$)? (4 decimal places.)`,
              answer: 1 / (Math.PI * 50),
              tol: 0.0002,
              wrong: [{ v: 1 / Math.sqrt(Math.PI * 50), tol: 0.0005, why: r`That's the 1D chance, $\frac{1}{\sqrt{\pi n}}$. In 2D it's the square of that.` }],
              explain: r`$\frac{1}{50\pi} \approx 0.0064$, the square of the 1D chance ($\approx 0.08$): a 2D walk is like two independent 1D walks along the diagonals. Adding $\frac{1}{\pi n}$ over all $n$ diverges, just barely, like $\ln n$, which is why return is certain in 2D. In 3D the terms fall like $n^{-3/2}$, the sum converges, and the walker may never come back.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Drunk people and birds',
              prompt: r`The mathematician Shizuo Kakutani summarised Pólya's theorem with a joke about a drunk man and a drunk bird. What did he say?`,
              choices: [
                { t: 'A drunk man will find his way home, but a drunk bird may get lost forever', ok: true },
                { t: 'A drunk bird will find its way home, but a drunk man may get lost forever', why: 'Walking on a 2D street grid returns with certainty. The bird’s 3D flight is the one that can wander off forever.' },
                { t: 'Neither ever gets home', why: 'In 1D and 2D, return is certain (with probability 1).' },
              ],
              explain: r`A person wanders on a 2D surface, where return is certain (though it can take a very long time). A bird wanders in 3D, where there's so much room that it returns with probability only about 0.34. Dimension changes everything.`,
            },
          ],
          recap: [
            'Random walks in 1D and 2D return to the start with probability 1.',
            'In 3D the return probability is only about 34%.',
            '“A drunk man will find his way home, but a drunk bird may get lost forever.”',
          ],
        },
      ],
    },
    {
      title: 'Hidden Laws of Walks',
      summary: 'Leads, ballots and walkers that solve equations.',
      lessons: [
        {
          id: 'leads',
          title: 'Who’s in the Lead?',
          summary: 'The arcsine law and the ballot theorem',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A long coin-flip game',
              body: r`Alice and Bob flip a fair coin 200 times: heads, Alice gains a point; tails, Bob does. The graph shows Alice's lead; coral stretches are where she's ahead. Try several games and watch how often the lead changes hands.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 200, ymin: -30, ymax: 30, grid: false, height: 280, axes: { xlabel: 'flips', ylabel: 'Alice’s lead', xticks: 50, yticks: 10 },
                params: { seed: { min: 1, max: 40, step: 1, value: 3, label: 'new game', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ plot, p, s }) => { const w = leadWalk(p.seed); let a = '', b = ''; for (let i = 1; i < w.length; i++) { const seg = `M${plot.X(i - 1).toFixed(1)} ${plot.Y(w[i - 1]).toFixed(1)}L${plot.X(i).toFixed(1)} ${plot.Y(w[i]).toFixed(1)}`; if (w[i] > 0 || w[i - 1] > 0) a += seg; else b += seg; } return [s('path', { d: b, stroke: 'var(--blue)', 'stroke-width': 2.5, fill: 'none' }), s('path', { d: a, stroke: 'var(--coral)', 'stroke-width': 2.5, fill: 'none' })]; },
                readout: (p) => { const w = leadWalk(p.seed); let ch = 0, last = 0; for (let i = 1; i < w.length; i++) { if (w[i] !== 0) { const sg = Math.sign(w[i]); if (last && sg !== last) ch++; last = sg; } } return `Alice ahead **${Math.round(100 * aheadFrac(w))}%** of the time · lead changed hands **${ch}** times`; },
              },
              after: r`Surprisingly often, one player leads for almost the whole game, and the lead changes hands only a handful of times. Intuition says a fair game should be shared roughly 50:50. The truth is the opposite.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The arcsine law',
              body: r`Here are 4,000 games of 200 flips, sorted by the fraction of time Alice was ahead. The curve is the **arcsine law**, discovered by Paul Lévy in 1939.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 4.2, grid: false, height: 280, axes: { xlabel: 'fraction of time Alice leads', xticks: 0.25, yticks: 5, xfmt: (v) => `${Math.round(v * 100)}%` },
                params: { a: { min: 0, max: 0.5, step: 0.05, value: 0.1, label: 'band width', color: 'coral', format: (v) => `${Math.round(v * 100)}%` } },
                curves: [{ f: (x) => (x > 0.005 && x < 0.995 ? 1 / (Math.PI * Math.sqrt(x * (1 - x))) : NaN), color: 'ink', width: 2.5, n: 300 }],
                under: ({ plot, p, s }) => ARCSINE().map((c, i) => { const hgt = (c / 4000) * 20, x = i / 20; const edge = x < p.a - 1e-9 || x + 0.05 > 1 - p.a + 1e-9; return s('rect', { x: plot.X(x) + 1, y: plot.Y(Math.min(hgt, 4.2)), width: plot.X(0.05) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(Math.min(hgt, 4.2)), class: edge ? 'fl-coral' : 'fl-blue', opacity: 0.85 }); }),
                readout: (p) => { const h = ARCSINE(); let e2 = 0; h.forEach((c, i) => { const x = i / 20; if (x < p.a - 1e-9 || x + 0.05 > 1 - p.a + 1e-9) e2 += c; }); return `games where one player led more than ${Math.round(100 - 100 * p.a)}% of the time (coral): **${((100 * e2) / 4000).toFixed(1)}%**`; },
              },
              after: r`The histogram is U-shaped: the **least** likely outcome is an even split, and the most likely is one player ahead nearly all the time. The probability that Alice leads for less than a fraction $x$ of the time is $\frac{2}{\pi}\arcsin\sqrt{x}$, whatever the length of the game.`,
            },
            {
              type: 'mcq',
              title: 'Lopsided or even?',
              prompt: r`In a long fair game, which is more likely: that Alice leads more than 90% of the time, or that her share of the lead is between 40% and 60%?`,
              choices: [
                { t: 'Leading more than 90% of the time (about 20%, versus about 13%)', ok: true },
                { t: 'A share between 40% and 60%', why: r`The arcsine curve is lowest in the middle. $\frac2\pi\left(\arcsin\sqrt{0.6} - \arcsin\sqrt{0.4}\right) \approx 0.13$.` },
                { t: 'They’re equally likely', why: 'The arcsine density is U-shaped, not flat.' },
              ],
              explain: r`$P(\text{lead} > 90\%) = 1 - \frac2\pi\arcsin\sqrt{0.9} \approx 0.20$, while $P(40\text{–}60\%) \approx 0.13$. Long winning streaks in fair games aren't evidence of skill: a stock-picker or sports team on a long run may just be riding the arcsine law.`,
            },
            {
              type: 'explain',
              title: 'Reflecting paths',
              body: r`A neat trick counts walks that touch zero. Take a path from height $a > 0$ to height $b > 0$ that touches 0 somewhere. Reflect the part **before** the first touch in the axis: you get a path from $-a$ to $b$. Every path from $-a$ to $b$ must cross zero, so this matching is perfect:
$$\#\{\text{paths } a \to b \text{ touching } 0\} = \#\{\text{paths } {-a} \to b\}$$
This **reflection principle** turns hard counting questions into easy ones. Its most famous consequence is the **ballot theorem** (Bertrand, 1887): if candidate A gets $a$ votes and B gets $b < a$, counted in random order, the chance that A is **strictly ahead throughout the count** is $\dfrac{a - b}{a + b}$.`,
            },
            {
              type: 'numeric',
              title: 'Election night',
              prompt: r`A wins an election 60 votes to 40. The votes are counted in a random order. What's the probability that A was ahead at every moment of the count?`,
              answer: 0.2,
              tol: 0.001,
              wrong: [{ v: 0.6, why: r`That's A's vote share. Use the ballot theorem: $\frac{a - b}{a + b}$.` }, { v: 0.5, why: r`Use $\frac{60 - 40}{60 + 40}$.` }],
              explain: r`$\frac{60 - 40}{100} = 0.2$. Even with a comfortable 60–40 win, 80% of the time B is level or ahead at some point during the count. Early leads tell you little.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Never level again',
              prompt: r`The reflection principle also shows that the chance a fair coin game is **never tied** during the first $2n$ flips equals the chance it's tied **at** flip $2n$, which is $\binom{2n}{n}/4^n$. For a 10-flip game, what's the probability the scores are never level after the start? (3 decimal places.)`,
              answer: 252 / 1024,
              tol: 0.0015,
              wrong: [{ v: 1 / 512, tol: 0.001, why: 'That’s the chance of one particular never-tied sequence pair. Use the formula: C(10,5)/4⁵.' }, { v: 0.5, why: r`Compute $\binom{10}{5}/4^5 = 252/1024$.` }],
              hint: r`$\binom{10}{5} = 252$ and $4^5 = 1024$.`,
              explain: r`$\frac{252}{1024} \approx 0.246$: about a quarter of 10-flip games are never level after the first flip, so one player leads from start to finish. For 100 flips it's still 8%.`,
            },
          ],
          recap: [
            'In fair games, one player usually leads most of the time (the arcsine law).',
            'Reflection principle: paths touching zero match paths from the mirror-image start.',
            r`Ballot theorem: the winner leads throughout with probability $\frac{a-b}{a+b}$.`,
          ],
        },
        {
          id: 'harmonic',
          title: 'Walkers That Solve Equations',
          summary: 'Random walks and steady heat',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Gambler’s ruin, again',
              body: r`In gambler's ruin, the chance of winning from \$$k$ was $\frac{k}{N}$: a straight line. That line has a special property: each value is the **average of its two neighbours**, because from \$$k$ you move to \$$k - 1$ or \$$k + 1$ with equal chance.

Steady temperature along a rod obeys the same rule (each point is as warm as the average of its surroundings), which is why it's also a straight line between the two end temperatures. So random walks can **compute temperatures**.`,
            },
            {
              type: 'interactive',
              title: 'A hot edge',
              body: r`A square metal plate has its top edge held at 100° and the other three edges at 0°. Drag the point. From there, 400 random walkers wander until they hit an edge (a few paths are drawn, coral if they reach the hot edge). The fraction reaching the top estimates the temperature. Find a point at **25°**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.05, xmax: 1.05, ymin: -0.05, ymax: 1.08, grid: false, axes: false, maxWidth: 420,
                params: { x: { min: 0.05, max: 0.95, step: 0.05, value: 0.3, slider: false }, y: { min: 0.05, max: 0.95, step: 0.05, value: 0.75, slider: false } },
                extra: ({ plot, p, s }) => {
                  const R = plateWalks(p.x, p.y), els = [];
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(1), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1), fill: 'var(--surface-2)', stroke: 'var(--blue)', 'stroke-width': 4 }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(1), y1: plot.Y(1), y2: plot.Y(1), stroke: 'var(--coral)', 'stroke-width': 7 }));
                  els.push(s('text', { x: plot.X(0.5), y: plot.Y(1) - 10, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: '100°' }));
                  for (const [path, hot] of R.paths) els.push(s('path', { d: 'M' + path.map(([i, j]) => `${plot.X(i / 20).toFixed(1)} ${plot.Y(j / 20).toFixed(1)}`).join('L'), fill: 'none', stroke: hot ? 'var(--coral)' : 'var(--blue)', 'stroke-width': 1.5, opacity: 0.6 }));
                  return els;
                },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }],
                readout: (p) => { const R = plateWalks(p.x, p.y); return `walkers reaching the hot edge: **${R.est.toFixed(1)}%** · exact temperature: **${plateT(p.x, p.y).toFixed(1)}°**`; },
                goal: (p) => Math.abs(plateT(p.x, p.y) - 25) < 1.5,
                hint: 'Try the middle of the plate.',
                solution: { x: 0.5, y: 0.5 },
              },
              explain: r`The walkers' estimate tracks the exact temperature (found by solving the **Laplace equation**). The centre of the plate is at exactly **25°**. Points near the hot edge are hot because most walkers starting there hit it first.`,
            },
            {
              type: 'mcq',
              title: 'Why exactly 25°?',
              prompt: r`Why must the centre of the plate be at exactly 25°?`,
              choices: [
                { t: 'Making each of the four edges hot in turn and adding the results gives a plate with every edge at 100°; by symmetry each edge contributes the same at the centre', ok: true },
                { t: 'Because 25 is the average of 100, 0, 0 and 0, and every point takes that average', why: 'Only the centre does. Points near the top edge are much hotter than 25°.' },
                { t: 'It’s a coincidence of this particular shape', why: 'It follows from symmetry, and works for any regular polygon with one hot side (giving 100°/n).' },
              ],
              explain: r`A walker from the centre is equally likely to exit through any of the four edges, by symmetry, so the chance of exiting through the top is exactly $\frac14$. In heat language: solutions add up (**superposition**), and four rotated copies sum to a plate at 100° everywhere.`,
            },
            {
              type: 'numeric',
              title: 'The average of the neighbours',
              prompt: r`On a grid, a walker steps to each of its four neighbours with equal chance, so the temperature at a point equals the **average** of its four neighbours. If the neighbours are at 20°, 30°, 40° and 50°, what's the temperature at the point?`,
              unit: '°',
              answer: 35,
              wrong: [{ v: 140, why: 'That’s the sum. Divide by 4.' }],
              explain: r`$\frac{20 + 30 + 40 + 50}{4} = 35°$. This **mean value property** means a steady temperature can never have a hot spot or cold spot inside the plate: the maximum and minimum always lie on the boundary.`,
            },
            {
              type: 'explain',
              title: 'Walking is solving',
              body: r`Shizuo Kakutani proved in 1944 that this works in general: for any region and any boundary temperatures, the steady temperature at a point is the average boundary temperature where random walkers (in the limit, Brownian motion) first hit the edge. The same mathematics describes:

- **voltages** in a resistor network: the voltage at a node is the chance a walker reaches the battery's + terminal first;
- **electric potential** around charged conductors;
- the **gambler's** probability of winning, in any number of dimensions.

Engineers still use "walk-on-spheres" simulations to solve these equations for complicated shapes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two hot edges',
              prompt: r`Now the top edge **and** the right edge are both held at 100°, and the other two at 0°. What's the temperature at the centre of the plate?`,
              unit: '°',
              answer: 50,
              wrong: [{ v: 25, why: 'That’s for one hot edge. A walker from the centre is equally likely to exit through each edge, and now two of them are hot.' }, { v: 100, why: 'Half the walkers from the centre exit through a cold edge.' }],
              explain: r`Superposition: one hot edge gives 25°, so two give $25 + 25 = 50°$. Equivalently, a walker from the centre exits through a hot edge with probability $\frac24$.`,
            },
          ],
          recap: [
            'The probability that a walker first exits through a part of the boundary obeys the same equation as steady heat.',
            'Steady temperatures are averages of their neighbours, so extremes lie on the boundary.',
            'Symmetry and superposition give exact answers: a square with one hot side is 25° at its centre.',
          ],
        },
        {
          id: 'shuffling',
          title: 'Seven Shuffles',
          summary: 'How random is a shuffled deck?',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'A random walk on orderings',
              body: r`Each shuffle moves a deck from one ordering to another, a random walk on the $52!$ possible orderings. How many shuffles until every ordering is (nearly) equally likely?

For the **riffle shuffle** (cut the deck roughly in half and interleave the halves), Dave Bayer and Persi Diaconis answered this in 1992, measuring "how far from random" with the **total variation distance**: 1 means completely predictable, 0 means perfectly random.`,
            },
            {
              type: 'numeric',
              title: 'How many orderings?',
              prompt: r`$52! \approx 8 \times 10^{n}$. What is $n$?`,
              answer: 67,
              explain: r`$52! \approx 8.07 \times 10^{67}$. Any well-shuffled deck is almost certainly in an order that has never existed before in the history of card games.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Watch randomness arrive',
              prompt: r`These are Bayer and Diaconis’s values of the distance from randomness after $k$ riffle shuffles of a 52-card deck. Find the first number of shuffles that brings the distance **below one half**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 11, ymin: 0, ymax: 1.1, grid: false, height: 260, axes: { xlabel: 'riffle shuffles', ylabel: 'distance from random', xticks: 1, yticks: 0.25 },
                params: { k: { min: 1, max: 10, step: 1, value: 3, label: 'shuffles', color: 'violet' } },
                curves: [{ f: () => 0.5, color: 'muted', dash: true }],
                under: ({ plot, p, s }) => { const D = [1, 1, 1, 1, 0.924, 0.614, 0.334, 0.167, 0.085, 0.043]; return D.map((d, i) => s('rect', { x: plot.X(i + 0.65), y: plot.Y(d), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(d), rx: 3, class: i + 1 === p.k ? 'fl-coral' : 'fl-violet', opacity: i + 1 === p.k ? 1 : 0.6 })); },
                readout: (p) => { const D = [1, 1, 1, 1, 0.924, 0.614, 0.334, 0.167, 0.085, 0.043]; return `${p.k} shuffle${p.k > 1 ? 's' : ''}: distance from random **${D[p.k - 1].toFixed(3)}**`; },
                goal: (p) => p.k === 7,
                hint: 'Nothing much happens for the first four shuffles.',
                solution: { k: 7 },
              },
              explain: r`After 6 shuffles the distance is still 0.61; after **7** it drops to 0.33, and then roughly halves with each extra shuffle. The deck stays far from random for a while and then becomes random quite suddenly: a "cutoff phenomenon" seen in many random walks.`,
            },
            {
              type: 'mcq',
              title: 'Rising sequences',
              prompt: r`After one riffle shuffle of a deck in order 1–52, why is it easy to tell it isn’t random?`,
              choices: [
                { t: 'The cards form at most two interleaved runs in increasing order', ok: true },
                { t: 'The top card never moves', why: 'It can move. The giveaway is the two interleaved increasing runs.' },
                { t: 'It is random after one shuffle', why: 'Far from it: only a tiny fraction of orderings can be reached in one riffle.' },
              ],
              explain: r`One riffle interleaves two packets, so the deck splits into at most 2 **rising sequences**. Each further riffle can at most double their number. A typical random deck has about 26, so you need enough doublings to get there: $2^5 = 32$ is the first power of 2 that exceeds 26, and the precise analysis gives seven.`,
            },
            {
              type: 'mcq',
              title: 'Overhand shuffles',
              prompt: r`The overhand shuffle (sliding small packets from one hand to the other) mixes much less per shuffle. Roughly how many are needed?`,
              choices: [
                { t: 'Thousands', ok: true },
                { t: 'About seven, the same as riffles', why: 'Overhand shuffles move cards only slightly, so mixing is far slower.' },
                { t: 'About twenty', why: 'Estimates for an ordinary overhand shuffle run to around 2,500.' },
              ],
              explain: r`Diaconis and colleagues estimate around 2,500 overhand shuffles for a 52-card deck. Card players who only overhand-shuffle are playing with far-from-random decks, which skilled players can exploit.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Counting runs',
              prompt: r`Each riffle shuffle at most doubles the number of rising sequences in a deck that starts in order. What is the most rising sequences there can be after 3 riffle shuffles?`,
              answer: 8,
              explain: r`$1 \to 2 \to 4 \to 8$. With at most 8 rising sequences, the deck is easy to distinguish from a random one (which typically has around 26), consistent with a distance of 1.0 after three shuffles.`,
            },
          ],
          recap: [
            'Shuffling is a random walk on the 52! orderings of a deck.',
            'Riffle shuffles stay far from random, then mix quickly: about seven are needed.',
            'Rising sequences at most double with each riffle.',
          ],
        },
      ],
    },
  ],
};
