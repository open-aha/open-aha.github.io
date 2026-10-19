import { fix } from '../lib/svg.js';
const r = String.raw;
const N = 2000;
const SIEVE = (() => {
  const isP = new Array(N + 1).fill(true);
  isP[0] = isP[1] = false;
  for (let i = 2; i * i <= N; i++) if (isP[i]) for (let j = i * i; j <= N; j += i) isP[j] = false;
  return isP;
})();
const PI = (() => {
  const c = [0];
  for (let i = 1; i <= N; i++) c.push(c[i - 1] + (SIEVE[i] ? 1 : 0));
  return c;
})();

// number of ways to write even n as p + q with p ≤ q primes
const goldbachWays = (n) => { let c = 0; for (let p = 2; p <= n / 2; p++) if (SIEVE[p] && SIEVE[n - p]) c++; return c; };
// Ulam spiral: coordinates of the k-th number (k = 0 at the centre)
const spiralXY = (k) => { if (k === 0) return [0, 0]; const ring = Math.ceil((Math.sqrt(k + 1) - 1) / 2), side = 2 * ring, start = (2 * ring - 1) ** 2, off = k - start; if (off < side) return [ring, -ring + 1 + off]; if (off < 2 * side) return [ring - 1 - (off - side), ring]; if (off < 3 * side) return [-ring, ring - 1 - (off - 2 * side)]; return [-ring + 1 + (off - 3 * side), -ring]; };
const isPrime = (n) => { if (n < 2) return false; if (n <= N) return SIEVE[n]; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const powmod = (a, e, m) => { let r = 1n, b = BigInt(a) % BigInt(m), x = BigInt(e); const M = BigInt(m); while (x > 0n) { if (x & 1n) r = (r * b) % M; b = (b * b) % M; x >>= 1n; } return Number(r); };

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// Ulam spiral picture: start, start+1, … spiral out from the centre; primes are dark squares
const ulamExtra = ({ plot, s }, start, rings, diag) => {
  const w = plot.X(1) - plot.X(0), q = w * 0.45, els = [];
  const total = (2 * rings + 1) ** 2;
  let d = '';
  for (let k = 0; k < total; k++) if (isPrime(start + k)) { const [x, y] = spiralXY(k); d += `M${(plot.X(x) - q).toFixed(1)} ${(plot.Y(y) - q).toFixed(1)}h${(2 * q).toFixed(1)}v${(2 * q).toFixed(1)}h${(-2 * q).toFixed(1)}z`; }
  els.push(s('rect', { x: plot.X(-rings - 0.5), y: plot.Y(rings + 0.5), width: (2 * rings + 1) * w, height: (2 * rings + 1) * w, fill: 'var(--surface-2)', stroke: 'var(--line)' }));
  if (diag) els.push(s('line', { x1: plot.X(-rings - 0.5), y1: plot.Y(-rings - 0.5), x2: plot.X(rings + 0.5), y2: plot.Y(rings + 0.5), stroke: 'var(--coral)', 'stroke-width': Math.max(w, 3), opacity: 0.3 }));
  els.push(s('path', { d, fill: 'var(--blue)' }));
  if (rings <= 4) {
    let path = '';
    for (let k = 0; k < total; k++) { const [x, y] = spiralXY(k); path += `${k ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; }
    els.push(s('path', { d: path, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1, opacity: 0.5 }));
    for (let k = 0; k < total; k++) { const [x, y] = spiralXY(k); const pr = isPrime(start + k); els.push(s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', style: `font-size:max(calc(${rings <= 3 ? 15 : 13}px * var(--fs, 1)), var(--fmin, 0px));font-weight:${pr ? 700 : 400}`, fill: pr ? '#fff' : 'var(--ink-2)', text: String(start + k) })); }
  }
  const [sx, sy] = spiralXY(0);
  els.push(s('rect', { x: plot.X(sx) - q, y: plot.Y(sy) - q, width: 2 * q, height: 2 * q, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 }));
  return els;
};
const diagPrimes = (start, rings) => { let c = 0; for (let n = 0; n <= 2 * rings; n++) if (isPrime(start + n * n + n)) c++; return c; };
// lattice points with x² + y² = n
const latticeOn = (n) => { const pts = []; const m = Math.floor(Math.sqrt(n)); for (let x = -m; x <= m; x++) for (let y = -m; y <= m; y++) if (x * x + y * y === n) pts.push([x, y]); return pts; };
const twoSq = (n) => { const w = []; for (let a = 0; a * a <= n / 2; a++) { const b = Math.round(Math.sqrt(n - a * a)); if (a * a + b * b === n) w.push(`${a}^2 + ${b}^2`); } return w; };

const PRIME_PI = (() => { const N = 10000, c = new Uint8Array(N + 1), pi = new Int32Array(N + 1); for (let i = 2; i * i <= N; i++) if (!c[i]) for (let j = i * i; j <= N; j += i) c[j] = 1; for (let i = 2; i <= N; i++) pi[i] = pi[i - 1] + (c[i] ? 0 : 1); return pi; })();
const LI = (x) => { let s = 0; const n = 400, a = 2; for (let i = 0; i < n; i++) { const t = a + ((x - a) * (i + 0.5)) / n; s += 1 / Math.log(t); } return (s * (x - a)) / n; };
let POLAR_PRIMES = null;
const polarPrimes = () => {
  if (POLAR_PRIMES) return POLAR_PRIMES;
  const N = 40000, comp = new Uint8Array(N + 1), out = [];
  for (let i = 2; i <= N; i++) { if (comp[i]) continue; out.push(i); for (let j = i * i; j <= N; j += i) comp[j] = 1; }
  return (POLAR_PRIMES = out);
};
const polarR = (t) => 30 * 1000 ** Math.min(1, Math.max(0, (t - 1) / 12));

export default {
  id: 'primes',
  subject: 'math',
  title: 'Prime Patterns',
  level: 'Advanced',
  cover: 'primes',
  tagline: 'How primes thin out, the patterns they make, how to test them, and famous unsolved problems.',
  description: r`Primes look random up close, yet follow a beautiful law from far away. Explore how many primes there are below a number, why gaps between them can be as long as you like, and the great open problems, from Goldbach's conjecture to the Riemann hypothesis. Then hunt for patterns in Ulam's prime spiral, discover which primes are sums of two squares, and learn how computers certify 300-digit primes in a blink.`,
  prereq: 'Number Theory',
  chapters: [
    {
      title: 'How Primes Are Spread',
      summary: 'Counting primes.',
      lessons: [
        {
          id: 'counting',
          title: 'Counting Primes',
          summary: 'The prime number theorem',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Thinning out',
              body: r`Let $\pi(x)$ count the primes up to $x$ (this $\pi$ has nothing to do with circles). Primes get rarer as numbers grow, but how quickly? Compare the staircase $\pi(x)$ with the smooth curve $x / \ln x$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2000, ymin: 0, ymax: 320, grid: 250, gridY: 50, height: 320, axes: { xlabel: 'x', ylabel: 'count' },
                params: { x: { min: 10, max: 2000, step: 10, value: 1000, label: '$x$', color: 'violet', format: (v) => `${v}` } },
                curves: [
                  { f: (x) => PI[Math.max(0, Math.min(N, Math.floor(x)))], color: 'blue', width: 3 },
                  { f: (x) => (x > 2 ? x / Math.log(x) : NaN), color: 'coral', dash: true },
                ],
                points: [{ x: (p) => p.x, y: (p) => PI[p.x], color: 'violet' }],
                readout: (p) => r`$\pi(${p.x}) = ${PI[p.x]}$, $\;\dfrac{x}{\ln x} = ${Math.round(p.x / Math.log(p.x))}$, $\;$ ratio $= ${(PI[p.x] / (p.x / Math.log(p.x))).toFixed(3)}$`,
              },
              after: r`The two curves stay close, and their **ratio** creeps toward 1 as $x$ grows. This is the **prime number theorem** (proved in 1896 by Hadamard and de la Vallée Poussin):
$$\pi(x) \approx \frac{x}{\ln x}$$
Equivalently, near a large number $n$, roughly 1 in every $\ln n$ numbers is prime.`,
            },
            {
              type: 'numeric',
              title: 'Primes below a million',
              prompt: r`Use $x / \ln x$ to estimate how many primes there are below 1,000,000. ($\ln 10^6 \approx 13.8$.)`,
              answer: 1e6 / Math.log(1e6),
              relTol: 0.01,
              wrong: [{ v: 78498, why: 'That’s the true count! The estimate x/ln x gives a bit less.' }, { v: 13.8, tol: 0.1, why: r`That's $\ln x$. Divide $10^6$ by it.` }],
              explain: r`$\dfrac{10^6}{13.8} \approx 72{,}400$. The true count is 78,498, so the estimate is about 8% low. The error shrinks (as a percentage) for larger numbers, and better approximations exist.`,
            },
            {
              type: 'numeric',
              title: 'Below one hundred',
              prompt: r`How many primes are there below 100? (Count them, or use the sieve from the Number Theory course.)`,
              answer: 25,
              wrong: [{ v: 21.7, tol: 0.1, why: r`That's the estimate $100 / \ln 100$. Count the actual primes: 2, 3, 5, 7, 11, …, 97.` }, { v: 26, why: 'Don’t count 1: it isn’t prime.' }],
              explain: r`There are 25: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97. One in four numbers below 100 is prime; below a million, only about one in thirteen.`,
            },
            {
              type: 'numeric',
              title: 'Average gap',
              prompt: r`By the prime number theorem, what is the average gap between consecutive primes near one million? ($\ln 10^6 \approx 13.8$; 1 decimal place.)`,
              answer: Math.log(1e6),
              tol: 0.1,
              wrong: [{ v: 1 / Math.log(1e6), tol: 0.005, why: r`That's the chance a number is prime. The average gap is its reciprocal, $\ln n$.` }],
              explain: r`If about 1 in $\ln n$ numbers near $n$ is prime, the primes are spaced about $\ln n \approx 13.8$ apart on average. Individual gaps vary wildly, from 2 (twin primes) to over 100.`,
            },
            {
              type: 'numeric',
              title: 'Twin primes below 100',
              prompt: r`Twin primes differ by 2, like 11 and 13. How many twin-prime pairs are there with both numbers below 100?`,
              answer: 8,
              explain: r`(3, 5), (5, 7), (11, 13), (17, 19), (29, 31), (41, 43), (59, 61), (71, 73): **8** pairs. Whether there are infinitely many is the twin prime conjecture, still unproved.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Random big primes',
              prompt: r`Encryption needs random primes of about 300 digits. Roughly what fraction of 300-digit numbers are prime? ($\ln 10^{300} \approx 690$.)`,
              choices: [
                { t: 'About 1 in 690, so primes are easy to find by testing random candidates', ok: true },
                { t: 'Almost none: primes that big are extremely rare', why: r`They thin out only slowly, like $1/\ln n$: about 1 in 690.` },
                { t: 'About half', why: 'Half are even, and the prime fraction is much smaller: about 1/690.' },
              ],
              explain: r`By the prime number theorem, about 1 in $\ln(10^{300}) \approx 690$ numbers near $10^{300}$ is prime (1 in 345 odd numbers). Fast primality tests check candidates quickly, so a computer finds a random 300-digit prime in a fraction of a second.`,
            },
          ],
          recap: [
            r`$\pi(x)$ counts the primes up to $x$.`,
            r`Prime number theorem: $\pi(x) \approx x / \ln x$.`,
            r`Near $n$, about 1 in $\ln n$ numbers is prime.`,
          ],
        },
        {
          id: 'gaps',
          title: 'Gaps & Twins',
          summary: 'Deserts and pairs',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Prime deserts',
              body: r`Gaps between primes can be **as long as you like**. Consider
$$n! + 2,\ n! + 3,\ \dots,\ n! + n$$
$n! + 2$ is divisible by 2 (both terms are), $n! + 3$ by 3, and so on, up to $n! + n$, divisible by $n$. That's $n - 1$ consecutive composite numbers.`,
            },
            {
              type: 'numeric',
              title: 'A run of composites',
              prompt: r`Using this idea with $n = 6$, the numbers $6! + 2$ to $6! + 6$ are all composite. What is the first of them?`,
              answer: 722,
              wrong: [{ v: 8, why: r`$6! = 720$, not 6. So the first number is $720 + 2$.` }, { v: 720, why: r`Add 2: the run starts at $6! + 2$.` }],
              explain: r`$6! = 720$, so 722, 723, 724, 725, 726 are divisible by 2, 3, 4, 5, 6 respectively. (Real prime gaps of this length appear much earlier: 90 to 96 are all composite.)`,
            },
            {
              type: 'mcq',
              title: 'Never too far',
              prompt: r`Gaps can be arbitrarily long, yet **Bertrand's postulate** (proved by Chebyshev in 1852) guarantees something about where primes are. What?`,
              choices: [
                { t: 'For every n ≥ 2 there’s always a prime between n and 2n', ok: true },
                { t: 'There’s a prime in every block of 10 numbers', why: 'Gaps can be as long as you like, so no fixed-length block always contains a prime.' },
                { t: 'Every prime is followed by another within 2', why: 'That would mean infinitely many twins and much more. Gaps grow on average.' },
              ],
              explain: r`Doubling always reaches a new prime: between 10 and 20 there's 11, between 1000 and 2000 there are 135. Long gaps exist, but they're small compared with the numbers themselves. Paul Erdős gave a famously elegant proof at age 19.`,
            },
            {
              type: 'numeric',
              title: 'The first gap of 14',
              prompt: r`The primes 113 and 127 are consecutive: everything between is composite. How big is that gap?`,
              answer: 14,
              explain: r`$127 - 113 = 14$: the first time two consecutive primes are 14 apart. Record gaps grow very slowly, roughly like $(\ln p)^2$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Gaps among the primes',
              body: r`Each dot is a prime $p$, plotted at the height of the gap to the next prime. Increase the range and watch the record gaps creep upward, while gaps of 2 (twin primes) keep appearing.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3000, ymin: 0, ymax: 36, grid: false, height: 260, axes: { xlabel: 'prime p', ylabel: 'gap to next prime', xticks: 500, yticks: 6 },
                params: { N: { min: 100, max: 3000, step: 50, value: 500, label: 'search up to', color: 'violet' } },
                extra: ({ plot, p, s }) => { const out = []; let prev = 2; for (let n = 3; n <= p.N + 40; n++) { if (PRIME_PI[n] > PRIME_PI[n - 1]) { if (prev <= p.N) out.push(s('circle', { cx: plot.X(prev), cy: plot.Y(n - prev), r: n - prev === 2 ? 3 : 3.5, class: n - prev === 2 ? 'fl-teal' : 'fl-violet' })); prev = n; } } return out; },
                readout: (p) => { let prev = 2, best = 0, at = 2, twins = 0; for (let n = 3; n <= p.N + 40; n++) if (PRIME_PI[n] > PRIME_PI[n - 1]) { if (prev <= p.N) { if (n - prev > best) { best = n - prev; at = prev; } if (n - prev === 2) twins++; } prev = n; } return `${PRIME_PI[p.N]} primes · biggest gap **${best}** (after ${at}) · **${twins}** twin pairs (teal)`; },
              },
              after: r`Gaps grow, but slowly: on average the gap near $p$ is about $\ln p$, so around 3,000 it is about 8. Record gaps grow a bit faster, and yet twin primes never seem to run out. Whether there are infinitely many is still unproved.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Twin primes',
              prompt: r`**Twin primes** differ by 2, like 11 and 13, or 41 and 43. Are there infinitely many?`,
              choices: [
                { t: 'Nobody knows, although in 2013 Yitang Zhang proved that some fixed gap (now at most 246) occurs infinitely often', ok: true },
                { t: 'Yes, Euclid proved it', why: 'Euclid proved there are infinitely many primes, not infinitely many twin pairs.' },
                { t: 'No, they run out after a certain point', why: 'Twin primes have been found with hundreds of thousands of digits, and nobody has shown they stop.' },
              ],
              explain: r`The **twin prime conjecture** is unproved. Yitang Zhang's 2013 breakthrough showed that infinitely many pairs of primes differ by less than 70 million, and a collaborative effort (Polymath) quickly reduced the bound to 246. Getting from 246 down to 2 remains open.`,
            },
          ],
          recap: [
            r`$n! + 2, \dots, n! + n$ shows that prime gaps can be arbitrarily long.`,
            'Twin primes differ by 2. Whether there are infinitely many is unknown.',
            'Since 2013, we know some gap of at most 246 occurs infinitely often.',
          ],
        },
      ],
    },
    {
      title: 'Open Problems',
      summary: 'Goldbach and Riemann.',
      lessons: [
        {
          id: 'goldbach',
          title: 'Goldbach’s Conjecture',
          summary: 'Sums of two primes',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A letter from 1742',
              body: r`In 1742, Christian Goldbach wrote to Leonhard Euler suggesting that every even number greater than 2 is the **sum of two primes**:
$$4 = 2 + 2,\quad 6 = 3 + 3,\quad 8 = 3 + 5,\quad 10 = 3 + 7 = 5 + 5,\ \dots$$
It has been checked by computer for every even number up to $4 \times 10^{18}$. Nobody has proved it.`,
            },
            {
              type: 'numeric',
              title: 'Count the ways',
              prompt: r`In how many ways can 30 be written as a sum of two primes? (Count $7 + 23$ and $23 + 7$ as the same.)`,
              answer: 3,
              wrong: [{ v: 2, why: r`Check every prime up to 15: $7 + 23$, $11 + 19$ and $13 + 17$.` }, { v: 6, why: 'That counts each pair twice. Treat 7 + 23 and 23 + 7 as one way.' }, { v: 4, why: r`$1 + 29$ doesn't count: 1 isn't prime. And $3 + 27$, $5 + 25$ fail.` }],
              explain: r`$30 = 7 + 23 = 11 + 19 = 13 + 17$: **3** ways. Larger even numbers tend to have more and more representations, which is part of why mathematicians believe the conjecture, even without proof.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Goldbach’s comet',
              body: r`For each even number up to 2000, count the ways it can be written as a sum of two primes. The dots form a spreading band nicknamed **Goldbach's comet**. Choose an even number to see its count.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2000, ymin: 0, ymax: 70, grid: false, height: 300, axes: { xlabel: 'even number n', ylabel: 'ways', xticks: 500, yticks: 10 },
                params: { n: { min: 4, max: 2000, step: 2, value: 210, label: 'n', color: 'violet' } },
                extra: ({ plot, p, s }) => { let d = ''; for (let n = 4; n <= 2000; n += 2) d += `M${plot.X(n).toFixed(1)} ${plot.Y(goldbachWays(n)).toFixed(1)}h0`; return [s('path', { d, stroke: 'var(--blue)', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.55 }), s('circle', { cx: plot.X(p.n), cy: plot.Y(goldbachWays(p.n)), r: 6, class: 'fl-coral' })]; },
                readout: (p) => `${p.n} can be written as a sum of two primes in **${goldbachWays(p.n)}** way${goldbachWays(p.n) === 1 ? '' : 's'}`,
              },
              after: r`The counts grow steadily (roughly like $\frac{n}{(\ln n)^2}$), so a large even number with **zero** representations would be a staggering exception. Notice the separate bands: numbers divisible by 3 or 5, like 210, get more representations, because their prime pairs aren't ruled out by those divisors.`,
            },
            {
              type: 'mcq',
              title: 'No room for 2',
              prompt: r`For every even number above 4, a Goldbach pair always uses two **odd** primes. Why can't the prime 2 be one of them?`,
              choices: [
                { t: r`The other number would be (even) − 2: even and bigger than 2, so not prime`, ok: true },
                { t: r`2 is not really a prime`, why: r`2 is a prime (its only divisors are 1 and itself). It just can't pair up here.` },
                { t: r`It can: for example $50 = 2 + 48$`, why: r`48 isn't prime. Subtracting 2 from an even number always leaves an even number.` },
              ],
              explain: r`An even number minus 2 is even, and the only even prime is 2 itself, which only works for $4 = 2 + 2$. So beyond 4, Goldbach's conjecture is really about odd primes: for example $50 = 3 + 47 = 7 + 43 = 13 + 37 = 19 + 31$.`,
            },
            {
              type: 'numeric',
              title: 'A hundred',
              prompt: r`In how many ways can 100 be written as a sum of two primes (ignoring order)?`,
              answer: 6,
              explain: r`$3 + 97$, $11 + 89$, $17 + 83$, $29 + 71$, $41 + 59$, $47 + 53$: **6** ways. The number of ways tends to grow with the size of the even number, which is why Goldbach’s conjecture seems so safe, yet it remains unproved.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Weak Goldbach',
              prompt: r`The "weak" Goldbach conjecture says every odd number greater than 5 is the sum of three primes. What's its status?`,
              choices: [
                { t: 'Proved in 2013 by Harald Helfgott', ok: true },
                { t: 'Still completely open', why: 'The weak version was settled in 2013. The original (strong) version is still open.' },
                { t: 'Disproved', why: 'No counterexample exists: it was proved true.' },
              ],
              explain: r`Harald Helfgott's 2013 proof combined deep analysis with massive computer checks for smaller cases. The strong conjecture (every even number is a sum of **two** primes) remains one of the oldest open problems in mathematics.`,
            },
          ],
          recap: [
            'Goldbach: every even number > 2 is a sum of two primes (unproved).',
            'Verified up to 4 × 10¹⁸.',
            'The weak version (three primes for odd numbers) was proved in 2013.',
          ],
        },
        {
          id: 'riemann',
          title: 'The Riemann Hypothesis',
          summary: 'The million-dollar question',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'The music of the primes',
              body: r`The prime number theorem says $\pi(x)$ is **approximately** $x / \ln x$. But how big is the error? In 1859, Bernhard Riemann connected the primes to a function now called the **Riemann zeta function**, $\zeta(s)$, extended to complex numbers $s$. The exact errors in prime counting are controlled by the points where $\zeta(s) = 0$.

Riemann conjectured that all the important zeros lie on a single vertical line in the complex plane, where the real part of $s$ is exactly $\tfrac12$. If true, the primes are distributed as regularly as they possibly could be.`,
            },
            {
              type: 'mcq',
              title: 'What’s at stake?',
              prompt: r`What would a proof of the Riemann hypothesis tell us?`,
              choices: [
                { t: 'The error in estimates of π(x) is as small as possible: roughly the size of √x', ok: true },
                { t: 'A formula that lists every prime instantly', why: 'It wouldn’t give a simple prime-generating formula. It would pin down how closely π(x) follows the smooth estimate.' },
                { t: 'That there are finitely many primes', why: 'Euclid proved there are infinitely many primes more than 2,000 years ago.' },
              ],
              explain: r`Under the Riemann hypothesis, $\pi(x)$ differs from its best smooth approximation by no more than about $\sqrt{x}\ln x$. Hundreds of published theorems begin "assuming the Riemann hypothesis…". It's one of the seven Millennium Prize Problems, with a \$1,000,000 reward.`,
            },
            {
              type: 'numeric',
              title: 'Primes inside the zeta function',
              body: r`Euler showed that $\zeta(2) = 1 + \frac14 + \frac19 + \cdots = \frac{\pi^2}{6}$ can also be written as a **product over the primes**:
$$\zeta(2) = \frac{1}{1 - \frac14} \cdot \frac{1}{1 - \frac19} \cdot \frac{1}{1 - \frac{1}{25}} \cdot \frac{1}{1 - \frac{1}{49}} \cdots$$`,
              prompt: r`Multiply the first three factors (for the primes 2, 3, 5). (4 decimal places.)`,
              answer: (4 / 3) * (9 / 8) * (25 / 24),
              tol: 0.0001,
              wrong: [{ v: (4 / 3) * (9 / 8), tol: 0.0001, why: 'Include the factor for 5 as well: 25/24.' }],
              hint: r`$\frac43 \times \frac98 \times \frac{25}{24}$.`,
              explain: r`$\frac43 \cdot \frac98 \cdot \frac{25}{24} = 1.5625$, already close to $\frac{\pi^2}{6} \approx 1.6449$; more primes creep closer. The product exists because every whole number factors into primes in exactly one way. This **Euler product** is the bridge between the zeta function and the primes, which is why its zeros control how the primes are spread.`,
            },
            {
              type: 'mcq',
              title: 'Counting to 1000',
              prompt: r`How many primes are there below 1000? (The prime number theorem estimate $\frac{1000}{\ln 1000}$ gives about 145.)`,
              choices: [
                { t: r`168`, ok: true },
                { t: r`145`, why: r`That’s the estimate. The true count is somewhat higher.` },
                { t: r`250`, why: r`Too many: primes thin out as numbers grow.` },
              ],
              explain: r`There are **168** primes below 1000. Gauss’s better estimate, the logarithmic integral $\text{Li}(1000) \approx 177$, overshoots by 9; the Riemann hypothesis is exactly the claim that such errors stay about as small as $\sqrt{x}\ln x$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Counting the primes',
              body: r`The prime-counting function $\pi(x)$ (violet steps) is compared with Gauss’s estimate $x/\ln x$ (dashed) and the logarithmic integral $\operatorname{Li}(x)$ (teal). Slide along and compare the errors.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10000, ymin: 0, ymax: 1300, grid: false, height: 280, axes: { xlabel: 'x', ylabel: 'number of primes up to x', xticks: 2000, yticks: 250 },
                params: { x: { min: 100, max: 10000, step: 100, value: 1000, label: 'x', color: 'coral' } },
                curves: [{ f: (x) => PRIME_PI[Math.floor(x)], color: 'violet', width: 2.5, n: 500 }, { f: (x) => (x > 2 ? x / Math.log(x) : NaN), color: 'muted', dash: true }, { f: (x) => (x > 2 ? LI(x) : NaN), color: 'teal', width: 2 }],
                points: [{ x: (p) => p.x, y: (p) => PRIME_PI[p.x], color: 'coral' }],
                readout: (p) => { const pi = PRIME_PI[p.x], g = p.x / Math.log(p.x), l = LI(p.x); return `π(${p.x}) = **${pi}** · x/ln x = ${g.toFixed(0)} (off by ${((100 * (pi - g)) / pi).toFixed(1)}%) · Li(x) = ${l.toFixed(0)} (off by ${((100 * (l - pi)) / pi).toFixed(1)}%)`; },
              },
              after: r`Li(x) tracks the primes astonishingly closely: at 10,000 it is off by only 17 out of 1,229. The Riemann hypothesis is equivalent to the statement that the error $|\pi(x) - \operatorname{Li}(x)|$ never grows much faster than $\sqrt{x}$: the primes are as regular as they could possibly be.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Evidence',
              prompt: r`Computers have checked the first 10 trillion or so nontrivial zeros of $\zeta(s)$. What have they found?`,
              choices: [
                { t: 'Every single one lies exactly on the line with real part ½', ok: true },
                { t: 'A few lie off the line', why: 'None has ever been found off the line.' },
                { t: 'The zeros stop after a while', why: 'There are infinitely many nontrivial zeros: that’s been proved.' },
              ],
              explain: r`Every zero checked so far lies on the critical line, but trillions of cases can't prove a statement about infinitely many. Remember Euler's prime-producing polynomial from the Problem Solving course, which worked 40 times in a row and then failed. Proof is a different kind of certainty.`,
            },
          ],
          recap: [
            r`Riemann linked the primes to the zeros of the zeta function, $\zeta(s)$.`,
            r`The hypothesis: all nontrivial zeros have real part $\tfrac12$.`,
            r`It would pin down the error in prime counting. Unproved, with a \$1M prize.`,
          ],
        },
      ],
    },
    {
      title: 'Prime Puzzles',
      summary: 'Spirals, squares and primality tests.',
      lessons: [
        {
          id: 'spiral',
          title: 'Prime Spirals',
          summary: 'Ulam’s doodle and Euler’s diagonal',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A doodle in a dull meeting',
              body: r`In 1963 the mathematician Stanisław Ulam, sitting through a boring talk, wrote the numbers 1, 2, 3, … in a square spiral and shaded the primes. Grow the spiral and watch what appears. (The coral box marks the start.)`,
              widget: {
                kind: 'graph', equal: true, xmin: -30.5, xmax: 30.5, ymin: -30.5, ymax: 30.5, grid: false, axes: false, maxWidth: 520,
                params: { rings: { min: 2, max: 30, step: 1, value: 3, label: 'size', color: 'blue', format: (v) => `${2 * v + 1}×${2 * v + 1}` } },
                extra: (ctx) => { const k = 30.5 / (ctx.p.rings + 0.5); return ulamExtra({ ...ctx, plot: { X: (x) => ctx.plot.X(x * k), Y: (y) => ctx.plot.Y(y * k) } }, 1, ctx.p.rings, false); },
                readout: (p) => { const t = (2 * p.rings + 1) ** 2; let c = 0; for (let k = 1; k <= t; k++) if (isPrime(k)) c++; return `Numbers 1 to ${t}: **${c}** primes`; },
              },
              after: r`Up close the primes look scattered, but zoom out and they line up along **diagonals**, far more than chance would suggest. Nobody has fully explained the strongest lines, though there are good conjectures about them.`,
            },
            {
              type: 'mcq',
              title: 'Half the diagonals',
              prompt: r`Colour the spiral’s squares like a chessboard. Apart from 2, every prime lands on the **same** colour. Why?`,
              choices: [
                { t: 'Each step to a neighbouring square flips both the colour and whether the number is odd or even, so all odd numbers share one colour', ok: true },
                { t: 'Primes avoid the corners of the spiral', why: 'The corners aren’t special here. Think about what changes with every single step along the spiral.' },
                { t: 'It’s a coincidence that fails further out', why: 'It never fails: it follows from how the spiral is built.' },
              ],
              explain: r`Every move along the spiral goes to an edge-neighbour, which switches the chessboard colour, and every move adds 1, which switches odd and even. So odd numbers all sit on one colour and even numbers on the other. Since primes (except 2) are odd, they can only appear on half the diagonals. The real puzzle is why some of **those** diagonals are so much denser than others.`,
            },
            {
              type: 'numeric',
              title: 'Formulas on diagonals',
              prompt: r`Starting at 1 and heading diagonally down to the right, you pass through 9, 25 and 49. What is the next number on that diagonal?`,
              answer: 81,
              wrong: [{ v: 73, why: r`Look at the pattern: $9 = 3^2$, $25 = 5^2$, $49 = 7^2$.` }, { v: 64, why: 'Only odd squares lie on this diagonal: the even squares lie on the opposite one.' }],
              hint: r`$9 = 3^2$, $25 = 5^2$…`,
              explain: r`$81 = 9^2$. Each lap of the spiral ends at an odd square, so this diagonal holds $(2k + 1)^2$, and no square is prime: the diagonal is completely empty. Every diagonal line follows a quadratic like $4k^2 + bk + c$. Quadratics that factor have (almost) no primes, while others are unusually rich in them, which is what the dark lines show.`,
            },
            {
              type: 'interactive',
              title: 'Euler’s diagonal',
              body: r`Now start the spiral at a different number. The shaded band follows the numbers $\text{start} + n^2 + n$ along the main diagonal. Find the start that packs this diagonal with the **most** primes.`,
              widget: {
                kind: 'graph', equal: true, xmin: -30.5, xmax: 30.5, ymin: -30.5, ymax: 30.5, grid: false, axes: false, maxWidth: 520,
                params: { start: { min: 1, max: 60, step: 1, value: 1, label: 'start', color: 'coral' } },
                extra: (ctx) => ulamExtra(ctx, ctx.p.start, 30, true),
                readout: (p) => `Diagonal: **${diagPrimes(p.start, 30)}** of 61 numbers are prime`,
                goal: (p) => p.start === 41,
                hint: 'Prime starts like 11 and 17 work well. The best one is above 40.',
                solution: { start: 41 },
              },
              explain: r`Starting at 41, the diagonal holds $n^2 + n + 41$: 56 of its 61 numbers are prime, and the first **40 in a row** are. Euler noticed this polynomial in 1772. The start 17 gives the runner-up, $n^2 + n + 17$ (prime for $n = 0$ to $15$).`,
            },
            {
              type: 'numeric',
              title: 'The streak must end',
              prompt: r`Euler’s polynomial at $n = 41$ is $41^2 + 41 + 41$. It’s a multiple of 41: divide it by 41.`,
              answer: 43,
              wrong: [{ v: 1763, why: r`That's the value itself. Divide by 41: each term has a factor of 41.` }],
              hint: r`$41^2 + 41 + 41 = 41 \times (41 + 1 + 1)$.`,
              explain: r`$41^2 + 41 + 41 = 41 \times 43 = 1763$, so it can’t be prime. The streak actually breaks one step earlier, at $n = 40$, where $40^2 + 40 + 41 = 41^2$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'No prime machine',
              prompt: r`Is there a polynomial with whole-number coefficients (not a constant) that gives a prime for **every** whole number $n$?`,
              choices: [
                { t: 'No: if f(0) = p is prime, then f(p), f(2p), f(3p), … are all multiples of p', ok: true },
                { t: 'Yes, but nobody has found it', why: 'This one is settled: such a polynomial is impossible.' },
                { t: 'Yes: n² + n + 41 with large enough coefficients', why: 'Every polynomial fails somewhere. Look at what happens at multiples of f(0).' },
              ],
              explain: r`Every term of $f(kp)$ except the constant contains a factor of $kp$, so $f(kp)$ leaves the same remainder as $f(0) = p$ when divided by $p$: zero. Those values are multiples of $p$, and a polynomial can equal $\pm p$ only finitely often, so infinitely many of them are composite. (If $f(0)$ isn't prime, use any $m$ where $f(m)$ is.) Prime-rich polynomials exist, but no perfect one.`,
            },
            { /*anim:primes*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Primes in polar coordinates',
              body: r`A different picture: put each prime $p$ at distance $p$ from the centre, at an angle of $p$ **radians** (so $p$ goes round about $p / 6.28$ times). Then zoom out.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 1, ymin: -1, ymax: 1, grid: false, axes: false, maxWidth: 400,
                animate: { param: 't', speed: 1, max: 16, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const R = polarR(p.t), d = [], dot = Math.max(2.5, 7 - 1.2 * Math.log10(R));
                  for (const q of polarPrimes()) {
                    if (q > 1.45 * R) break;
                    d.push(`M${plot.X((q * Math.cos(q)) / R).toFixed(1)} ${plot.Y((q * Math.sin(q)) / R).toFixed(1)}h0`);
                  }
                  return [s('path', { d: d.join(''), stroke: 'var(--blue)', 'stroke-width': dot, 'stroke-linecap': 'round', fill: 'none' })];
                },
                readout: (p) => { const R = polarR(p.t); return `showing distances up to ${fix(R, 0)} · ${polarPrimes().filter((q) => q <= 1.45 * R).length} primes`; },
              },
              after: r`Zoomed in, the primes lie along **spiral arms**, and further out, along a different set of arms. The spirals come from near-misses: 6 radians is just short of one full turn, so numbers 6 apart sit almost on top of each other, slowly drifting: they form 6 spirals, and primes (beyond 3) only use the 2 of them that hold numbers of the form $6k \pm 1$. Further out, 44 radians is extremely close to 7 full turns, giving 44 spirals, of which primes use only the 20 whose numbers share no factor with 44. So the pattern isn't hidden structure in the primes: it comes from primes avoiding common factors, plus how well $2\pi$ is approximated by fractions like $\frac{44}{7}$.`,
            },
          ],
          recap: [
            'Ulam’s spiral shows primes clustering along diagonals.',
            'Each diagonal follows a quadratic; some are rich in primes, others empty.',
            r`$n^2 + n + 41$ is prime for $n = 0$ to $39$, but no polynomial is always prime.`,
          ],
        },
        {
          id: 'squares',
          title: 'Sums of Two Squares',
          summary: 'Fermat’s Christmas theorem',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Points on a circle',
              body: r`Writing $n = a^2 + b^2$ is the same as finding a grid point $(a, b)$ on the circle of radius $\sqrt{n}$. Slide $n$ and look for circles that pass exactly through grid points. Pay attention to the **primes**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -11, xmax: 11, ymin: -11, ymax: 11, grid: false, axes: false, maxWidth: 440,
                params: { n: { min: 1, max: 100, step: 1, value: 5, label: '$n$', color: 'violet' } },
                curves: [{ param: { x: (t, p) => Math.sqrt(p.n) * Math.cos(t), y: (t, p) => Math.sqrt(p.n) * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'violet', n: 200 }],
                extra: ({ plot, p, s }) => { let d = ''; for (let x = -10; x <= 10; x++) for (let y = -10; y <= 10; y++) d += `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`; return [s('path', { d, stroke: 'var(--ink-3)', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.45 }), ...latticeOn(p.n).map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 6, class: 'fl-coral' }))]; },
                readout: (p) => { const w = twoSq(p.n); return `${p.n}${isPrime(p.n) ? ' (prime)' : ''}: ` + (w.length ? `$= ${w.join(' = ')}$, ${latticeOn(p.n).length} grid points` : 'not a sum of two squares'); },
              },
              after: r`Some primes work, like $5 = 1^2 + 2^2$ and $13 = 2^2 + 3^2$, while others, like 3, 7 and 11, miss every grid point. The circle for 25 passes through 12 points, including $(3, 4)$: a 3-4-5 triangle hiding in the grid.`,
            },
            {
              type: 'mcq',
              title: 'Which primes?',
              prompt: r`The primes 5, 13, 17, 29, 37, 41 **are** sums of two squares. The primes 3, 7, 11, 19, 23, 31 are **not**. What separates the two lists?`,
              choices: [
                { t: 'Remainder 1 when divided by 4, versus remainder 3', ok: true },
                { t: 'Ending in an odd digit versus an even digit', why: 'All of them (except 2) end in odd digits.' },
                { t: 'Being bigger than 4', why: '19, 23 and 31 are bigger than 4 but fail.' },
              ],
              explain: r`$5 = 4 + 1$, $13 = 12 + 1$, $17 = 16 + 1$…, while $3$, $7 = 4 + 3$, $11 = 8 + 3$…. Primes of the form $4k + 1$ are sums of two squares; primes of the form $4k + 3$ never are. (And $2 = 1^2 + 1^2$.)`,
            },
            {
              type: 'multi',
              title: 'Why 4k + 3 fails',
              prompt: r`Every square leaves remainder 0 or 1 when divided by 4 (even squares give 0, odd squares give 1). Which remainders can $a^2 + b^2$ leave when divided by 4? Select all.`,
              choices: [
                { t: '0', ok: true },
                { t: '1', ok: true },
                { t: '2', ok: true },
                { t: '3', why: 'The most you can get is 1 + 1 = 2.' },
              ],
              explain: r`Adding two remainders from $\{0, 1\}$ gives 0, 1 or 2, never 3. So **no** number of the form $4k + 3$ (prime or not) can be a sum of two squares. That's the easy half. The hard half is that every prime $4k + 1$ **does** succeed.`,
            },
            {
              type: 'explain',
              title: 'Fermat’s Christmas theorem',
              body: r`In a letter dated 25 December 1640, Fermat claimed:

> Every prime of the form $4k + 1$ is a sum of two squares, in exactly one way.

As usual, he gave no proof. Euler found one in 1749, after years of work. Remarkably, in 1990 Don Zagier published a proof that fits in a **single sentence** (though unpacking it takes a page). For example, $97 = 4^2 + 9^2$, and there is no other way to do it.`,
            },
            {
              type: 'numeric',
              title: 'Multiplying sums',
              body: r`Products of sums of two squares are again sums of two squares:
$$(a^2 + b^2)(c^2 + d^2) = (ac - bd)^2 + (ad + bc)^2 = (ac + bd)^2 + (ad - bc)^2$$`,
              prompt: r`Use $5 = 1^2 + 2^2$ and $13 = 2^2 + 3^2$. In how many ways can $65$ be written as $a^2 + b^2$ with $0 \le a \le b$? (You can check with the circle above.)`,
              answer: 2,
              wrong: [{ v: 1, why: r`The identity gives two different answers: $(2 - 6)^2 + (3 + 4)^2$ and $(2 + 6)^2 + (3 - 4)^2$.` }, { v: 16, why: 'That counts grid points with signs and order. Count only 0 ≤ a ≤ b.' }],
              explain: r`$65 = 4^2 + 7^2 = 1^2 + 8^2$: **two** ways, one from each version of the identity. In general $n$ is a sum of two squares exactly when every prime of the form $4k + 3$ appears in its factorisation an **even** number of times, and more prime factors of the form $4k + 1$ give more ways.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Counting inside the circle',
              body: r`Instead of points **on** a circle, count the grid points **inside** a circle of radius $r$. Since each grid point owns a unit square, the count should be close to the area, $\pi r^2$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -21, xmax: 21, ymin: -21, ymax: 21, grid: false, axes: false, maxWidth: 440,
                params: { r: { min: 1, max: 20, step: 0.5, value: 4, label: '$r$', color: 'teal', format: (v) => v.toFixed(1) } },
                curves: [{ param: { x: (t, p) => p.r * Math.cos(t), y: (t, p) => p.r * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'teal', n: 240 }],
                extra: ({ plot, p, s }) => { let a = '', b = ''; for (let x = -20; x <= 20; x++) for (let y = -20; y <= 20; y++) { const seg = `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`; if (x * x + y * y <= p.r * p.r) a += seg; else b += seg; } return [s('path', { d: b, stroke: 'var(--ink-3)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.3 }), s('path', { d: a, stroke: 'var(--teal)', 'stroke-width': 5, 'stroke-linecap': 'round' })]; },
                readout: (p) => { let c = 0; const m = Math.floor(p.r); for (let x = -m; x <= m; x++) for (let y = -m; y <= m; y++) if (x * x + y * y <= p.r * p.r) c++; return `${c} points inside, $\\pi r^2 = ${(Math.PI * p.r * p.r).toFixed(1)}$, count $\\div r^2 = ${(c / (p.r * p.r)).toFixed(3)}$`; },
              },
              after: r`The ratio wobbles toward $\pi$: at $r = 20$ there are 1257 points against $\pi r^2 \approx 1256.6$. Averaged over all $n$ up to $r^2$, the number of ways to write $n$ as a sum of two squares (counting signs and order) is therefore $\pi$. How fast the error shrinks is **Gauss's circle problem**, still unsolved.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Spot the sum',
              prompt: r`Exactly one of these numbers is a sum of two squares. Which? (Factor them first.)`,
              cols: 2,
              choices: [
                { t: '21', why: r`$21 = 3 \times 7$: both primes are $4k + 3$ and appear once.` },
                { t: '45', ok: true },
                { t: '63', why: r`$63 = 3^2 \times 7$: the 3s pair up, but 7 appears once.` },
                { t: '77', why: r`$77 = 7 \times 11$: two different $4k + 3$ primes, each appearing once.` },
              ],
              explain: r`$45 = 3^2 \times 5$. The 3 appears an even number of times and $5$ is a $4k + 1$ prime, so it works: $45 = 3^2 + 6^2$ (that's $3^2 \times (1^2 + 2^2)$).`,
            },
          ],
          recap: [
            r`A prime is a sum of two squares exactly when it is 2 or of the form $4k + 1$.`,
            'Squares leave remainder 0 or 1 mod 4, so 4k + 3 numbers can never work.',
            r`The number of grid points inside a circle of radius $r$ is about $\pi r^2$.`,
          ],
        },
        {
          id: 'testing',
          title: 'Testing for Primes',
          summary: 'Liars, Carmichael numbers and Miller–Rabin',
          icon: 'check',
          steps: [
            {
              type: 'numeric',
              title: 'Trial division',
              prompt: r`To prove that $10{,}403$ is prime (or not) by trial division, you only need to try divisors up to $\sqrt{10{,}403} \approx 101.99$. What is the largest whole number you'd need to try?`,
              answer: 101,
              wrong: [{ v: 102, why: r`102 is just above $\sqrt{10403}$. A factor bigger than the square root would pair with one smaller than it.` }],
              explain: r`You stop at 101, and you're glad you went that far: $10{,}403 = 101 \times 103$. Trial division is fine for small numbers, but a 300-digit number would need around $10^{150}$ divisions, more than any computer could ever do. We need a smarter test.`,
            },
            {
              type: 'interactive',
              title: 'Fermat liars',
              body: r`Fermat's little theorem says that if $n$ is prime then $a^{n-1}$ leaves remainder 1 when divided by $n$. The plot shows this remainder for every odd $n$: primes all sit on the bottom line. Find a **composite** number that also lands on the line, fooling the test.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1200, ymin: -40, ymax: 1200, grid: false, height: 320, padL: 52, axes: { xlabel: 'n', ylabel: 'remainder', xticks: 200, yticks: 200 },
                params: { a: { min: 2, max: 7, step: 1, value: 2, label: 'base $a$', color: 'blue' }, n: { min: 3, max: 1199, step: 2, value: 91, label: '$n$', color: 'coral' } },
                extra: ({ plot, p, s }) => { let comp = '', pr = '', liar = []; for (let n = 3; n < 1200; n += 2) { if (n % p.a === 0) continue; const r = powmod(p.a, n - 1, n), seg = `M${plot.X(n).toFixed(1)} ${plot.Y(r).toFixed(1)}h0`; if (isPrime(n)) pr += seg; else if (r === 1) liar.push(n); else comp += seg; } return [s('path', { d: comp, stroke: 'var(--ink-3)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 }), s('path', { d: pr, stroke: 'var(--blue)', 'stroke-width': 4, 'stroke-linecap': 'round' }), ...liar.map((n) => s('circle', { cx: plot.X(n), cy: plot.Y(1), r: 5, class: 'fl-amber' })), s('circle', { cx: plot.X(p.n), cy: plot.Y(p.n % p.a === 0 ? 0 : powmod(p.a, p.n - 1, p.n)), r: 7, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 })]; },
                readout: (p) => { if (gcd(p.a, p.n) > 1) return `${p.n} shares a factor with ${p.a}: pick another`; const r = powmod(p.a, p.n - 1, p.n); return `$${p.a}^{${p.n - 1}} \\bmod ${p.n} = ${r}$: ` + (r !== 1 ? '**composite for sure**' : isPrime(p.n) ? 'passes (and really is prime)' : '**passes, but it’s composite!**'); },
                goal: (p) => gcd(p.a, p.n) === 1 && !isPrime(p.n) && powmod(p.a, p.n - 1, p.n) === 1,
                hint: 'Composites that pass are marked as amber dots on the bottom line. With base 2, the first is between 300 and 350.',
                solution: { a: 2, n: 341 },
              },
              explain: r`$341 = 11 \times 31$, yet $2^{340}$ leaves remainder 1 mod 341. Composites like this are **Fermat pseudoprimes**, and the base is a **liar**. They're rare (for base 2 below 1200: 341, 561, 645, 1105), and a liar for one base is usually caught by another: $3^{340} \bmod 341 = 56$.`,
            },
            {
              type: 'mcq',
              title: 'Carmichael numbers',
              prompt: r`$561 = 3 \times 11 \times 17$ passes the Fermat test for **every** base $a$ that shares no factor with it. What does that mean for the test?`,
              choices: [
                { t: 'Trying more bases can never expose 561, so the plain Fermat test can be fooled completely', ok: true },
                { t: '561 is actually prime', why: r`$561 = 3 \times 11 \times 17$.` },
                { t: 'It only happens for 561, so we can just check for it', why: 'There are infinitely many such numbers, proved in 1994.' },
              ],
              explain: r`Numbers like 561, 1105 and 1729 are **Carmichael numbers**: composites that fool Fermat's test for every base coprime to them (only bases sharing a factor expose them, and those are hard to stumble on for big numbers). Alford, Granville and Pomerance proved in 1994 that there are infinitely many.`,
            },
            {
              type: 'numeric',
              title: 'Korselt’s recipe',
              body: r`A composite $n$ is a Carmichael number exactly when it has no repeated prime factor and $p - 1$ divides $n - 1$ for every prime $p$ dividing $n$. For $561$: $560$ is divisible by $2$, $10$ and $16$. ✓`,
              prompt: r`Check $1105 = 5 \times 13 \times 17$. The number $1104$ must be divisible by $4$, $12$ and $16$, so by their least common multiple, $48$. What is $1104 \div 48$?`,
              answer: 23,
              wrong: [{ v: 46, why: r`That's $1104 \div 24$. The least common multiple of 4, 12 and 16 is 48.` }],
              explain: r`$1104 = 48 \times 23$, so 1105 is a Carmichael number. Korselt found this test in 1899, a decade before Carmichael found the first example.`,
            },
            {
              type: 'numeric',
              title: 'A fake square root',
              body: r`The **Miller–Rabin** test closes the loophole. Modulo a prime, the only numbers that square to 1 are $1$ and $-1$. For $341$: $2^{340} \equiv 1$ and $2^{170} \equiv 1$, so keep halving the exponent. But $2^{85} \equiv 32 \pmod{341}$.`,
              prompt: r`Check that 32 is a square root of 1 mod 341: what is the remainder when $32^2 = 1024$ is divided by $341$?`,
              answer: 1,
              wrong: [{ v: 3, why: r`That's the quotient: $1024 = 3 \times 341 + \,?$` }],
              explain: r`$1024 = 3 \times 341 + 1$, so $32^2 \equiv 1$, but $32 \not\equiv \pm 1$. A prime modulus can't have such a square root, so **341 is composite**: Miller–Rabin catches what Fermat missed. Better still, for any odd composite, at least $\tfrac34$ of bases expose it, and there are no "Carmichael numbers" for this test.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Finding an RSA prime',
              prompt: r`Encryption keys need random primes around $2^{1024}$. Computers pick random **odd** numbers that size and run Miller–Rabin until one passes. Near $N$, about 1 in $\ln N$ numbers is prime. How many odd numbers do you expect to test? ($\ln 2 \approx 0.693$.)`,
              answer: 1024 * Math.LN2 / 2,
              relTol: 0.03,
              wrong: [{ v: 1024 * Math.LN2, relTol: 0.03, why: 'That’s for all numbers. Skipping the even ones doubles the density of primes among the candidates.' }],
              hint: r`$\ln 2^{1024} = 1024 \ln 2$. Only odd numbers are tested, so halve it.`,
              explain: r`$\ln 2^{1024} \approx 710$, and skipping even numbers halves it to about **355** tries, each taking milliseconds. 40 rounds of Miller–Rabin leave at most a $4^{-40} \approx 10^{-24}$ chance of a liar, less likely than a hardware error. (Since 2002 the AKS test can even prove primality with certainty in polynomial time, but in practice Miller–Rabin is faster.)`,
            },
          ],
          recap: [
            r`Fermat test: if $a^{n-1} \not\equiv 1 \pmod n$, then $n$ is composite.`,
            'Pseudoprimes and Carmichael numbers (561, 1105, 1729) can fool it.',
            'Miller–Rabin also checks square roots of 1, so each base catches a composite with probability at least 3/4.',
          ],
        },
      ],
    },
  ],
};
