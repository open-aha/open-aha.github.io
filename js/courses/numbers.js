import { fix } from '../lib/svg.js';
const r = String.raw;
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

// clock of n hours; jump by k each step starting from 0
const clock = ({ n = 12, k = 5, nParam = true, kParam = true } = {}) => ({
  kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.35, ymax: 1.35, grid: false, axes: false, maxWidth: 440,
  params: {
    ...(nParam ? { n: { min: 4, max: 16, step: 1, value: n, label: '$n$', color: 'blue', format: (v) => `${v} hours` } } : {}),
    ...(kParam ? { k: { min: 1, max: 15, step: 1, value: k, label: 'jump', color: 'coral', format: (v) => `+${v}` } } : {}),
  },
  extra: ({ plot, p, s }) => {
    const N = nParam ? p.n : n, K = kParam ? p.k : k;
    const pos = (i) => {
      const a = Math.PI / 2 - (2 * Math.PI * i) / N;
      return [Math.cos(a), Math.sin(a)];
    };
    const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 })];
    const visited = [];
    let cur = 0;
    for (let i = 0; i <= N; i++) {
      visited.push(cur);
      cur = (cur + K) % N;
      if (cur === 0) { visited.push(0); break; }
    }
    const pts = visited.map(pos);
    els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x * 0.9)} ${plot.Y(y * 0.9)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-linejoin': 'round', opacity: 0.8 }));
    const hit = new Set(visited);
    for (let i = 0; i < N; i++) {
      const [x, y] = pos(i);
      els.push(s('circle', { cx: plot.X(x * 0.9), cy: plot.Y(y * 0.9), r: 13, class: hit.has(i) ? 'fl-coral' : 'fl-card', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
      els.push(s('text', { x: plot.X(x * 0.9), y: plot.Y(y * 0.9) + 5, 'text-anchor': 'middle', class: 'lbl', style: `font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px));${hit.has(i) ? 'fill:#fff' : ''}`, text: String(i) }));
    }
    return els;
  },
  readout: (p) => {
    const N = nParam ? p.n : n, K = kParam ? p.k : k;
    const g = gcd(N, K);
    return g === 1 ? r`$\gcd(${N}, ${K}) = 1$: the jumps visit **every** hour.` : r`$\gcd(${N}, ${K}) = ${g}$: only ${N / g} of the ${N} hours get visited.`;
  },
});


// powers of a mod p, drawn around a circle of the nonzero residues
const powMod = (a, e, m) => { let x = 1; for (let i = 0; i < e; i++) x = (x * a) % m; return x; };
const ISBN = [9, 7, 8, 0, 3, 0, 6, 4, 0, 6, 1, 5];
const isbnSum = (d) => ISBN.reduce((t, x, i) => t + x * (i % 2 ? 3 : 1), 0) + d;

// cut the biggest possible squares off a 1071 × 462 rectangle, again and again: [x, y, side, stage]
const EUCLID_SQ = (() => {
  const out = [];
  let x = 0, y = 0, w = 1071, h = 462, stage = 0;
  while (w > 0 && h > 0) {
    if (w >= h) { while (w >= h) { out.push([x, y, h, stage]); x += h; w -= h; } }
    else { while (h >= w) { out.push([x, y, w, stage]); y += w; h -= w; } }
    stage++;
  }
  return out;
})();
const EUCLID_LINES = ['$1071 = 2 \\times 462 + 147$', '$462 = 3 \\times 147 + 21$', '$147 = 7 \\times 21$, nothing left over'];
const euclidN = (t) => Math.min(EUCLID_SQ.length, Math.floor(Math.max(0, t - 0.6) / 0.7));

export default {
  id: 'numbers',
  subject: 'math',
  title: 'Number Theory',
  level: 'Foundational',
  cover: 'numbers',
  tagline: 'Primes, divisibility, coins, clock arithmetic, check digits and secret codes.',
  description: r`Whole numbers hide a surprising amount of structure. Sift out the primes, prove there are infinitely many, learn fast divisibility tricks, master Euclid's 2300-year-old algorithm, solve coin puzzles, discover Fermat's little theorem and the check digits on every barcode, and see how clock arithmetic keeps the internet secure.`,
  chapters: [
    {
      title: 'Primes',
      summary: 'The atoms of arithmetic.',
      lessons: [
        {
          id: 'primes',
          title: 'Building Blocks',
          summary: 'Primes and factorization',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Rectangles of tiles',
              body: r`You have 12 square tiles. You can arrange them into rectangles in several ways: $1 \times 12$, $2 \times 6$, $3 \times 4$.`,
              prompt: 'Which number of tiles can ONLY be arranged as a single row?',
              cols: 2,
              choices: [
                { t: '13', ok: true },
                { t: '15', why: r`15 tiles make a $3 \times 5$ rectangle.` },
                { t: '21', why: r`21 tiles make a $3 \times 7$ rectangle.` },
                { t: '9', why: r`9 tiles make a $3 \times 3$ square.` },
              ],
              explain: r`13 can't be split into equal rows (except rows of 1). Numbers like this, with exactly two divisors (1 and themselves), are **prime**.`,
            },
            {
              type: 'explain',
              title: 'Primes and composites',
              body: r`A **prime** is a whole number greater than 1 whose only divisors are 1 and itself: 2, 3, 5, 7, 11, 13, …
A number with more divisors is **composite**: 4, 6, 8, 9, 10, …

The number **1 is not prime**. This isn't arbitrary: it keeps the next fact true.

::: key
**Fundamental theorem of arithmetic:** every whole number greater than 1 can be written as a product of primes in exactly one way (apart from the order of the factors).
:::

For example, $60 = 2 \times 2 \times 3 \times 5 = 2^2 \cdot 3 \cdot 5$. If 1 counted as prime, you could write $60 = 1 \times 2^2 \cdot 3 \cdot 5$ too, and factorizations would no longer be unique.`,
            },
            {
              type: 'mcq',
              title: 'Factorize',
              prompt: 'What is the prime factorization of 84?',
              cols: 2,
              choices: [
                { t: r`$2^2 \cdot 3 \cdot 7$`, ok: true },
                { t: r`$4 \cdot 21$`, why: 'That’s a factorization, but 4 and 21 aren’t prime. Keep breaking them down.' },
                { t: r`$2 \cdot 3 \cdot 14$`, why: r`14 isn't prime: $14 = 2 \times 7$.` },
                { t: r`$2^2 \cdot 21$`, why: r`21 isn't prime: $21 = 3 \times 7$.` },
              ],
              explain: r`$84 = 2 \times 42 = 2 \times 2 \times 21 = 2 \times 2 \times 3 \times 7 = 2^2 \cdot 3 \cdot 7$.`,
            },
            {
              type: 'numeric',
              title: 'Count the divisors',
              body: r`From the prime factorization you can count divisors. Each divisor of $2^2 \cdot 3$ picks a power of 2 (0, 1 or 2) and a power of 3 (0 or 1): $3 \times 2 = 6$ divisors (1, 2, 3, 4, 6, 12).`,
              prompt: r`How many divisors does $72 = 2^3 \cdot 3^2$ have?`,
              answer: 12,
              wrong: [
                { v: 6, why: r`Each exponent has one more choice than its value (you can also pick power 0): $(3+1)(2+1)$.` },
                { v: 5, why: r`Multiply the choices, don't add them: $(3+1) \times (2+1)$.` },
              ],
              explain: r`The power of 2 can be 0–3 (4 choices) and the power of 3 can be 0–2 (3 choices): $4 \times 3 = 12$ divisors.`,
            },
            {
              type: 'interactive',
              title: 'Only one rectangle',
              body: r`Arrange $n$ square tiles into rectangles (all the ways, counting $a \times b$ and $b \times a$ once). Find a number between 20 and 30 that makes **only** a $1 \times n$ strip.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 31, ymin: -0.5, ymax: 16, grid: false, axes: false, maxWidth: 560,
                params: { n: { min: 20, max: 30, step: 1, value: 24, label: '$n$', color: 'violet' } },
                extra: ({ plot, p, s }) => { const els = []; let y = 15; for (let a = 1; a * a <= p.n; a++) { if (p.n % a) continue; const b = p.n / a; y -= a; els.push(s('rect', { x: plot.X(0.5), y: plot.Y(y + a), width: plot.X(b) - plot.X(0), height: plot.Y(0) - plot.Y(a), class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 1.5 })); for (let i = 1; i < b; i++) els.push(s('line', { x1: plot.X(0.5 + i), x2: plot.X(0.5 + i), y1: plot.Y(y), y2: plot.Y(y + a), stroke: 'var(--violet)', 'stroke-width': 0.6 })); for (let j = 1; j < a; j++) els.push(s('line', { x1: plot.X(0.5), x2: plot.X(0.5 + b), y1: plot.Y(y + j), y2: plot.Y(y + j), stroke: 'var(--violet)', 'stroke-width': 0.6 })); els.push(s('text', { x: plot.X(1 + b), y: plot.Y(y + a / 2) + 5, class: 'tick', text: `${a} × ${b}` })); y -= 0.6; } return els; },
                readout: (p) => { const k = Array.from({ length: p.n }, (_, i) => i + 1).filter((d) => d * d <= p.n && p.n % d === 0).length; return `${p.n} tiles: **${k}** rectangle${k === 1 ? '' : 's'}${k === 1 ? ' (prime!)' : ''}`; },
                goal: (p) => [23, 29].includes(p.n),
                hint: 'A prime has no factors except 1 and itself.',
                solution: { n: 23 },
              },
              explain: r`23 and 29 make only a single strip: they're **prime**. 24, by contrast, makes four rectangles ($1 \times 24$, $2 \times 12$, $3 \times 8$, $4 \times 6$), so it has many factors. That's why 24 hours and 360 degrees are so convenient to divide up.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Trailing zeros',
              prompt: r`How many zeros are at the end of $10! = 10 \times 9 \times 8 \times \cdots \times 1 = 3{,}628{,}800$? Explain to yourself why.`,
              answer: 2,
              wrong: [{ v: 1, why: r`Each trailing zero needs a factor of $10 = 2 \times 5$. Count the 5s in $1 \times 2 \times \cdots \times 10$: they come from 5 and 10.` }],
              explain: r`Each trailing zero comes from a factor $10 = 2 \times 5$. There are plenty of 2s, so count the 5s: 5 and 10 each give one. That's 2 zeros. Prime factorization turns a hard counting question into an easy one.`,
            },
          ],
          recap: [
            'A prime has exactly two divisors: 1 and itself. 1 is not prime.',
            'Every number > 1 factors into primes in exactly one way.',
            'Factorizations make divisors, trailing zeros and more easy to count.',
          ],
        },
        {
          id: 'sieve',
          title: 'Finding Primes',
          summary: 'The sieve, and infinitely many primes',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The Sieve of Eratosthenes',
              body: r`Around 240 BC, Eratosthenes found the primes like this: cross out every multiple of 2 (except 2), then every multiple of 3, then 5, then 7. Whatever survives is prime. Try it.`,
              widget: { kind: 'sieve', N: 100, primes: [2, 3, 5, 7], needAll: true },
              gate: true,
            },
            {
              type: 'mcq',
              title: 'Why stop at 7?',
              prompt: 'Why is crossing out multiples of 2, 3, 5 and 7 enough to find every prime up to 100?',
              choices: [
                { t: 'Any composite number up to 100 has a prime factor of at most 10', ok: true },
                { t: 'Because 7 is the largest single-digit prime', why: 'The real reason is about square roots: √100 = 10.' },
                { t: 'It isn’t enough: you also need 11', why: r`A composite multiple of 11 below 100 has a smaller factor too (like $22 = 2 \times 11$), so it's already crossed out.` },
              ],
              explain: r`If $n = a \times b$ with both factors bigger than 10, then $n > 100$. So every composite number up to 100 has a factor of at most $\sqrt{100} = 10$, which means a prime factor of 2, 3, 5 or 7. In general, to test whether $n$ is prime, you only need to try primes up to $\sqrt n$.`,
            },
            {
              type: 'mcq',
              title: 'Prime test',
              prompt: 'Is 221 prime?',
              cols: 2,
              choices: [
                { t: r`No: $221 = 13 \times 17$`, ok: true },
                { t: 'Yes', why: r`Try the primes up to $\sqrt{221} \approx 14.9$: 2, 3, 5, 7, 11, 13. One of them works.` },
              ],
              explain: r`$\sqrt{221} \approx 14.9$, so try 2, 3, 5, 7, 11, 13. And $221 = 13 \times 17$.`,
            },
            {
              type: 'explain',
              title: 'Do primes ever run out?',
              body: r`Around 300 BC, Euclid proved that there are **infinitely many** primes. The argument is one of the most beautiful in mathematics.

Suppose there were only finitely many primes, $p_1, p_2, \ldots, p_k$. Multiply them all together and add 1:
$$N = p_1 p_2 \cdots p_k + 1$$
Dividing $N$ by any of the primes leaves a remainder of 1. So none of them divides $N$. But $N$ must have *some* prime factor, and it can't be on our list. So the list wasn't complete after all. No finite list can hold every prime.`,
            },
            {
              type: 'numeric',
              title: 'Primes below 100',
              prompt: r`Sieving the numbers up to 100 leaves how many primes?`,
              answer: 25,
              explain: r`There are **25** primes below 100, starting 2, 3, 5, 7, 11 and ending 89, 97. Below 1,000 there are 168, and below a million 78,498: they thin out, but slowly.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A careful reading',
              body: r`Take the primes 2, 3, 5, 7, 11, 13. Then $2 \cdot 3 \cdot 5 \cdot 7 \cdot 11 \cdot 13 + 1 = 30031 = 59 \times 509$.`,
              prompt: 'Does this break Euclid’s argument?',
              choices: [
                { t: 'No: 30031 isn’t prime, but its prime factors (59 and 509) are new primes not on the list', ok: true },
                { t: 'Yes: the argument says N must be prime', why: r`The argument only says that $N$ has a prime factor that isn't on the list. $N$ itself doesn't have to be prime.` },
              ],
              explain: r`Euclid's argument never claims $N$ is prime. It shows $N$ has a prime factor **missing** from the list. Here those missing primes are 59 and 509. Either way, the list was incomplete.`,
            },
          ],
          recap: [
            'The Sieve of Eratosthenes finds primes by crossing out multiples.',
            r`To test whether $n$ is prime, you only need to try primes up to $\sqrt{n}$.`,
            'Euclid: there are infinitely many primes.',
          ],
        },
      ],
    },
    {
      title: 'Divisibility',
      summary: 'Shortcuts and the greatest common divisor.',
      lessons: [
        {
          id: 'divisibility',
          title: 'Divisibility Tricks',
          summary: 'Test without dividing',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Quick check',
              prompt: 'Is 7,341 divisible by 3?',
              cols: 2,
              choices: [
                { t: 'Yes', ok: true },
                { t: 'No', why: r`Add the digits: $7 + 3 + 4 + 1 = 15$, and 15 is divisible by 3.` },
              ],
              explain: r`Digit sum: $7 + 3 + 4 + 1 = 15$, which is divisible by 3, so 7,341 is too ($7341 = 3 \times 2447$). Why does this trick work? Read on.`,
            },
            {
              type: 'explain',
              title: 'Why digit sums work',
              body: r`Write the number out by place value: $7341 = 7 \cdot 1000 + 3 \cdot 100 + 4 \cdot 10 + 1$.

Each power of ten is one more than a multiple of 9: $10 = 9 + 1$, $100 = 99 + 1$, $1000 = 999 + 1$. So
$$7341 = (7 \cdot 999 + 3 \cdot 99 + 4 \cdot 9) + (7 + 3 + 4 + 1).$$
The first bracket is a multiple of 9 (and of 3). So the number and its digit sum leave the **same remainder** when divided by 3 or by 9.`,
            },
            {
              type: 'multi',
              title: 'Which divide it?',
              prompt: 'Which of these numbers divide 5,940? Select all that apply.',
              choices: [
                { t: '2 (it ends in an even digit)', ok: true },
                { t: '3', ok: true },
                { t: '9', ok: true },
                { t: '4 (look at the last two digits)', ok: true },
                { t: '7', why: r`$5940 = 7 \times 848 + 4$, so dividing by 7 leaves a remainder of 4.` },
              ],
              explain: r`It ends in 0, so it's divisible by 2 (and by 5 and 10). The digit sum is $5 + 9 + 4 + 0 = 18$, so it's divisible by 3 and by 9. The last two digits, 40, are divisible by 4, so the whole number is (because 100 is a multiple of 4). In fact $5940 = 2^2 \cdot 3^3 \cdot 5 \cdot 11$, with no factor of 7.`,
            },
            {
              type: 'explain',
              title: 'The trick for 11',
              body: r`Since $10 = 11 - 1$, powers of ten are alternately one less and one more than multiples of 11. So take the **alternating sum** of the digits, starting from the right: $+$, $-$, $+$, $-$, …

For 5940: $0 - 4 + 9 - 5 = 0$, and 0 is divisible by 11. So $11 \mid 5940$ (read: "11 divides 5940"). Indeed, $5940 = 11 \times 540$.`,
            },
            {
              type: 'interactive',
              title: 'Fill in the digit',
              body: r`Choose the missing digit so that $4\square7$ is divisible by **9**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2, grid: false, axes: false, height: 120,
                params: { d: { min: 0, max: 9, step: 1, value: 0, label: 'missing digit', color: 'coral' } },
                extra: ({ plot, p, s }) => ['4', String(p.d), '7'].map((t, i) => [s('rect', { x: plot.X(3 + i * 1.4), y: plot.Y(1.7), width: plot.X(1.2) - plot.X(0), height: plot.Y(0.3) - plot.Y(1.7), rx: 6, class: i === 1 ? 'fl-coral-soft' : 'fl-card', stroke: 'var(--line-2)' }), s('text', { x: plot.X(3.6 + i * 1.4), y: plot.Y(1) + 10, 'text-anchor': 'middle', style: 'font-size:30px;font-weight:700', text: t })]),
                readout: (p) => { const n = 407 + 10 * p.d, ds = 11 + p.d; return `${n}: digit sum ${ds} · ${n % 9 === 0 ? '**divisible by 9** ✓' : `remainder ${n % 9} when divided by 9`}`; },
                goal: (p) => p.d === 7,
                hint: 'The digit sum must be a multiple of 9: 4 + ? + 7.',
                solution: { d: 7 },
              },
              explain: r`$4 + 7 + 7 = 18$, a multiple of 9, so $477 = 9 \times 53$. The remainder of a number divided by 9 always equals the remainder of its digit sum, because $10 = 9 + 1$ leaves remainder 1.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Missing digit',
              prompt: r`The six-digit number $41\,7\,\square\,86$ is divisible by 9. What digit goes in the box?`,
              answer: 1,
              wrong: [{ v: 10, why: 'The box holds a single digit (0–9).' }, { v: 8, why: r`The digit sum must be a multiple of 9: $4 + 1 + 7 + d + 8 + 6 = 26 + d$.` }],
              explain: r`The digit sum is $26 + d$, which must be a multiple of 9. The only digit that works is $d = 1$, giving 27.`,
            },
          ],
          recap: [
            '3 and 9: test the digit sum. 2, 5 and 10: test the last digit. 4: test the last two digits.',
            '11: take the alternating sum of the digits.',
            'The tricks work because of how powers of 10 relate to each divisor.',
          ],
        },
        {
          id: 'gcd',
          title: 'Euclid’s Algorithm',
          summary: 'Greatest common divisor',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Biggest tile',
              body: r`You want to tile a 24 × 36 cm floor exactly with identical square tiles, with no cutting.`,
              prompt: 'What is the largest tile side length that works?',
              unit: 'cm',
              answer: 12,
              wrong: [{ v: 6, why: '6 works, but there’s a bigger tile that fits both sides.' }, { v: 4, why: '4 divides both, but it isn’t the largest.' }],
              explain: r`The side must divide both 24 and 36. The largest number that does is 12: the **greatest common divisor**, $\gcd(24, 36) = 12$.`,
            },
            {
              type: 'explain',
              title: 'Euclid’s algorithm',
              body: r`For big numbers, factoring is slow. Euclid's insight: any number dividing both $a$ and $b$ also divides $a - b$, and so the remainder $a \bmod b$. So
$$\gcd(a, b) = \gcd(b,\; a \bmod b).$$
Keep replacing the pair until the remainder is 0:
$$\gcd(252, 105) \to \gcd(105, 42) \to \gcd(42, 21) \to \gcd(21, 0) = 21.$$
Geometrically: keep cutting the largest possible squares off a rectangle. The last square that fits exactly gives the gcd.`,
            },
            {
              type: 'numeric',
              title: 'Run it',
              prompt: r`Use Euclid's algorithm to find $\gcd(1071, 462)$.`,
              answer: 21,
              wrong: [{ v: 7, why: r`$1071 \bmod 462 = 147$, $462 \bmod 147 = 21$, $147 \bmod 21 = 0$. The last nonzero remainder is the answer.` }, { v: 3, why: 'Keep going until the remainder is 0. The last nonzero remainder is the gcd.' }],
              explain: r`$1071 = 2 \cdot 462 + 147$. Then $462 = 3 \cdot 147 + 21$. Then $147 = 7 \cdot 21 + 0$. So $\gcd = 21$.`,
            },
            { /*anim2:numbers*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Euclid with scissors',
              body: r`Here is Euclid's algorithm as a picture. Take a 1071 × 462 rectangle and keep cutting off the **biggest square** that fits. Each stage of cutting is one line of the algorithm.`,
              widget: {
                kind: 'graph', equal: true, xmin: -15, xmax: 1086, ymin: -20, ymax: 477, grid: false, axes: false, maxWidth: 640,
                animate: { param: 't', speed: 1, max: 14, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const n = euclidN(p.t), cols = ['blue', 'coral', 'teal'], els = [];
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(462), width: plot.X(1071) - plot.X(0), height: plot.Y(0) - plot.Y(462), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2 }));
                  EUCLID_SQ.slice(0, n).forEach(([x, y, a, st]) => {
                    els.push(s('rect', { x: plot.X(x), y: plot.Y(y + a), width: plot.X(a) - plot.X(0), height: plot.Y(0) - plot.Y(a), class: `fl-${cols[st]}`, opacity: 0.45, stroke: `var(--${cols[st]})`, 'stroke-width': 1.5 }));
                    if (a > 100) els.push(s('text', { x: plot.X(x + a / 2), y: plot.Y(y + a / 2) + 5, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--ink)', text: String(a) }));
                  });
                  if (n === EUCLID_SQ.length && p.t > 12) {
                    // the last square's side measures everything: a 21 grid fits the whole rectangle
                    let d = '';
                    for (let x = 21; x < 1071; x += 21) d += `M${plot.X(x).toFixed(1)} ${plot.Y(0).toFixed(1)}V${plot.Y(462).toFixed(1)}`;
                    for (let y = 21; y < 462; y += 21) d += `M${plot.X(0).toFixed(1)} ${plot.Y(y).toFixed(1)}H${plot.X(1071).toFixed(1)}`;
                    els.push(s('path', { d, stroke: 'var(--ink-3)', 'stroke-width': 0.6, opacity: 0.6 }));
                  }
                  return els;
                },
                readout: (p) => { const n = euclidN(p.t); if (n === 0) return 'a 1071 × 462 rectangle'; const st = EUCLID_SQ[n - 1][3]; return n === EUCLID_SQ.length && p.t > 12 ? 'the 21 × 21 square tiles the whole rectangle: $\\gcd(1071, 462) = 21$' : EUCLID_LINES[st]; },
              },
              after: r`Cutting off a square of side $b$ from an $a \times b$ rectangle is subtracting $b$ from $a$; cutting off as many as fit is dividing and keeping the **remainder**. The process stops when the last squares fit exactly. That last square tiles the final strip, so it also tiles the strip before, and so on back up: it measures both 1071 and 462 exactly, and nothing larger can. That's why the last nonzero remainder is the greatest common divisor.`,
            },
            {
              type: 'numeric',
              title: 'Least common multiple',
              body: r`The **least common multiple** satisfies $\text{lcm}(a, b) = \dfrac{a \times b}{\gcd(a, b)}$.`,
              prompt: 'One bus comes every 12 minutes, another every 18 minutes. They both leave now. In how many minutes will they next leave together?',
              unit: 'min',
              answer: 36,
              wrong: [{ v: 216, why: r`That's $12 \times 18$, a common multiple, but not the least. Divide by $\gcd(12, 18) = 6$.` }, { v: 6, why: 'That’s the gcd. You need the least common multiple.' }],
              explain: r`$\text{lcm}(12, 18) = \frac{12 \times 18}{6} = 36$ minutes.`,
            },
            {
              type: 'interactive',
              title: 'The biggest square tile',
              body: r`Tile a 48 × 18 floor with equal square tiles, no cutting. Find the **largest** tile size that works.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 49, ymin: -1, ymax: 19, grid: false, axes: false, maxWidth: 560,
                params: { t: { min: 1, max: 18, step: 1, value: 4, label: 'tile size', color: 'teal' } },
                extra: ({ plot, p, s }) => { const ok = 48 % p.t === 0 && 18 % p.t === 0, els = [s('rect', { x: plot.X(0), y: plot.Y(18), width: plot.X(48) - plot.X(0), height: plot.Y(0) - plot.Y(18), fill: 'var(--surface-2)', stroke: 'var(--ink)', 'stroke-width': 2 })]; for (let x = 0; x + p.t <= 48 + 1e-9; x += p.t) for (let y = 0; y + p.t <= 18 + 1e-9; y += p.t) els.push(s('rect', { x: plot.X(x) + 1, y: plot.Y(y + p.t) + 1, width: plot.X(p.t) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(p.t) - 2, rx: 2, class: ok ? 'fl-teal-soft' : 'fl-coral-soft', stroke: ok ? 'var(--teal)' : 'var(--coral)', 'stroke-width': 1.2 })); return els; },
                readout: (p) => (48 % p.t === 0 && 18 % p.t === 0 ? `${p.t} × ${p.t} tiles fit exactly: ${(48 / p.t) * (18 / p.t)} tiles` : `${p.t} doesn’t divide ${48 % p.t ? '48' : '18'}: gaps left over`),
                goal: (p) => p.t === 6,
                hint: 'The tile size must divide both 48 and 18.',
                solution: { t: 6 },
              },
              explain: r`6 is the largest number dividing both: $\gcd(48, 18) = 6$, giving 24 tiles. Euclid's algorithm finds it without listing factors: $48 = 2 \times 18 + 12$, $18 = 1 \times 12 + 6$, $12 = 2 \times 6$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Coprime',
              prompt: r`Two numbers are **coprime** when their gcd is 1. How many of the numbers from 1 to 12 are coprime to 12?`,
              answer: 4,
              wrong: [{ v: 5, why: 'Check 1, 5, 7 and 11. Is there another? 12 = 2²·3, so exclude every multiple of 2 or 3.' }, { v: 6, why: 'Exclude every multiple of 2 *or* 3.' }],
              explain: r`$12 = 2^2 \cdot 3$, so exclude multiples of 2 or 3. That leaves 1, 5, 7, 11: four numbers. This count is called Euler's totient, $\varphi(12) = 4$, and it's at the heart of the RSA encryption you'll meet later.`,
            },
          ],
          recap: [
            r`$\gcd(a, b) = \gcd(b, a \bmod b)$: repeat until the remainder is 0.`,
            r`$\text{lcm}(a, b) = \frac{ab}{\gcd(a, b)}$.`,
            'Coprime numbers share no prime factor (their gcd is 1).',
          ],
        },
        {
          id: 'coins',
          title: 'Coins & Stamps',
          summary: 'Which amounts can you make?',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A country with two coins',
              body: r`Imagine a country with only 3p and 5p coins. Which amounts can you pay exactly? 3, 5, 6, 8, 9, 10, 11, … but not 1, 2, 4 or 7.

Paying $n$ pence means finding whole numbers $a, b \ge 0$ with $3a + 5b = n$. Equations whose solutions must be whole numbers are called **Diophantine equations**, after Diophantus of Alexandria (around 250 AD).`,
            },
            {
              type: 'numeric',
              title: 'The last gap',
              prompt: r`With 3p and 5p coins, what is the largest amount you **cannot** pay exactly?`,
              unit: 'p',
              answer: 7,
              wrong: [{ v: 4, why: '4 can’t be paid, but there’s a larger amount that can’t either.' }, { v: 2, why: 'Check 4 and 7 too.' }],
              explain: r`7 is impossible (it's not a multiple of 3, and $7 - 5 = 2$ isn't either). But 8, 9 and 10 all work, and adding 3p coins to those reaches every amount above. So 7 is the last gap.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Postage',
              prompt: r`You have 5p and 8p stamps. Choose how many of each to make exactly **46p** of postage.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 2.6, grid: false, axes: false, height: 160,
                params: { a: { min: 0, max: 9, step: 1, value: 2, label: '5p stamps', color: 'blue' }, b: { min: 0, max: 5, step: 1, value: 2, label: '8p stamps', color: 'coral' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let i = 0; i < p.a; i++) els.push(s('rect', { x: plot.X(0.3 + i * 1.25), y: plot.Y(2.3), width: plot.X(1.05) - plot.X(0), height: plot.Y(1.5) - plot.Y(2.3), rx: 3, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('text', { x: plot.X(0.82 + i * 1.25), y: plot.Y(1.9) + 5, class: 'tick', 'text-anchor': 'middle', text: '5p' }));
                  for (let i = 0; i < p.b; i++) els.push(s('rect', { x: plot.X(0.3 + i * 1.6), y: plot.Y(1.1), width: plot.X(1.4) - plot.X(0), height: plot.Y(0.2) - plot.Y(1.1), rx: 3, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 }), s('text', { x: plot.X(1 + i * 1.6), y: plot.Y(0.65) + 5, class: 'tick', 'text-anchor': 'middle', text: '8p' }));
                  return els;
                },
                readout: (p) => r`$5 \times ${p.a} + 8 \times ${p.b} = ${5 * p.a + 8 * p.b}$p`,
                goal: (p) => 5 * p.a + 8 * p.b === 46,
                hint: 'The number of 8p stamps must make the remainder a multiple of 5. Try different counts of 8p.',
                solution: { a: 6, b: 2 },
              },
              explain: r`$6 \times 5 + 2 \times 8 = 30 + 16 = 46$ ✓. A systematic method: $46 - 8b$ must end in 0 or 5, which forces $b = 2$ (giving 30) or $b = 7$ (too many). Euclid's algorithm can solve such equations in general.`,
            },
            {
              type: 'numeric',
              title: 'A formula',
              prompt: r`For two coin values $a$ and $b$ with no common factor, the largest amount you can't make is $ab - a - b$ (the **Frobenius number**). What is it for 5p and 8p?`,
              unit: 'p',
              answer: 27,
              wrong: [{ v: 40, why: r`Subtract both values: $40 - 5 - 8$.` }],
              explain: r`$5 \times 8 - 5 - 8 = 27$. Check: 27 can't be made, but 28 ($4 \times 5 + 8$), 29, 30, 31 and 32 can, and adding 5s covers everything after.`,
            },
            {
              type: 'mcq',
              title: 'When it fails',
              prompt: r`With only 4p and 6p coins, is there a largest amount you can't pay?`,
              choices: [
                { t: 'No: every odd amount is impossible, forever', ok: true },
                { t: 'Yes: 4 × 6 − 4 − 6 = 14', why: r`The formula needs the values to be coprime. Here $\gcd(4, 6) = 2$, so only even amounts are possible.` },
              ],
              explain: r`$4a + 6b$ is always even, so odd amounts never work. In general, $ax + by$ can only hit multiples of $\gcd(a, b)$, and (eventually) hits all of them. That's **Bézout's identity**.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Chicken nuggets',
              prompt: r`A restaurant once sold chicken nuggets only in boxes of 6, 9 and 20. What is the largest number of nuggets you could **not** buy exactly?`,
              answer: 43,
              wrong: [{ v: 23, why: '23 is impossible, but so are some larger numbers. Check 43.' }, { v: 37, why: '37 is impossible too, but a larger number also is. Check 43.' }],
              explain: r`43 can't be made (try subtracting 0, 20 or 40 and you get 43, 23, 3, none of which are sums of 6s and 9s). But 44 through 49 can all be made, and adding boxes of 6 covers everything beyond. With three or more box sizes, there's no simple formula: computing Frobenius numbers is a hard problem in general.`,
            },
          ],
          recap: [
            r`Diophantine equations like $ax + by = n$ need whole-number solutions.`,
            r`With coprime values $a$, $b$, the largest unreachable amount is $ab - a - b$.`,
            r`$ax + by$ can only reach multiples of $\gcd(a, b)$ (Bézout).`,
          ],
        },
      ],
    },
    {
      title: 'Modular Arithmetic',
      summary: 'Arithmetic on a clock.',
      lessons: [
        {
          id: 'modular',
          title: 'Clock Arithmetic',
          summary: 'Remainders that wrap around',
          icon: 'clock',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'What time will it be?',
              prompt: 'It’s 9 o’clock. What time will it be 50 hours from now (on a 12-hour clock)?',
              answer: 11,
              wrong: [{ v: 59, why: 'Clocks wrap around every 12 hours.' }, { v: 2, why: r`$50 = 4 \times 12 + 2$, so add 2 hours to 9.` }],
              explain: r`50 hours is 4 full turns (48 hours) plus 2 hours. $9 + 2 = 11$ o'clock.`,
            },
            {
              type: 'explain',
              title: 'Mod',
              body: r`**Modular arithmetic** keeps only remainders. We write
$$a \equiv b \pmod n$$
("$a$ is congruent to $b$ mod $n$") when $a$ and $b$ leave the same remainder after dividing by $n$. For example, $59 \equiv 11 \pmod{12}$.

You can add, subtract and multiply first and reduce later, or reduce first. You get the same answer either way. That makes huge calculations easy.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Jumping around a clock',
              body: r`Start at 0 and keep jumping forward by the same amount. Which hours do you land on?`,
              widget: clock({ n: 12, k: 5 }),
              after: r`Here's the pattern: you visit every hour exactly when the jump and the clock size share no common factor (their gcd is 1).`,
            },
            { /*anim:numbers*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Times tables on a circle',
              body: r`Put 200 points around a circle, numbered 0 to 199. Pick a multiplier $m$ and join every point $k$ to the point $m \times k \bmod 200$. Watch what the times tables draw as $m$ slowly changes.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.15, xmax: 1.15, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 440,
                animate: { param: 't', speed: 0.22, max: 8, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const N = 200, k0 = Math.floor(p.t), f = p.t - k0, m = 2 + k0 + Math.min(1, f / 0.7) ** 2 * (3 - 2 * Math.min(1, f / 0.7));
                  const P = (j) => [plot.X(Math.cos(Math.PI + (2 * Math.PI * j) / N)), plot.Y(Math.sin(Math.PI + (2 * Math.PI * j) / N))];
                  let d = '';
                  for (let k = 0; k < N; k++) {
                    const [x1, y1] = P(k), [x2, y2] = P((m * k) % N);
                    d += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
                  }
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5 }),
                    s('path', { d, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 0.8, opacity: 0.7 }),
                  ];
                },
                readout: (p) => { const k0 = Math.floor(p.t), f = p.t - k0, m = 2 + k0 + Math.min(1, f / 0.7) ** 2 * (3 - 2 * Math.min(1, f / 0.7)); const names = { 2: 'a **cardioid** (heart)', 3: 'a **nephroid** (kidney), with 2 cusps', 4: '3 cusps', 5: '4 cusps', 6: '5 cusps', 7: '6 cusps', 8: '7 cusps', 9: '8 cusps', 10: '9 cusps' }; return `multiplier $m = ${fix(m, 2)}$${f > 0.7 || f === 0 ? ': ' + names[Math.round(m)] : ''}`; },
              },
              after: r`The 2 times table draws a heart-shaped **cardioid**, the 3 times table a **nephroid**, and in general the $m$ times table draws a curve with $m - 1$ cusps. These are the shapes traced by a point on a circle rolling around another circle, and the cardioid is also the outline of the main body of the Mandelbrot set. Simple remainder arithmetic, drawn on a clock, hides a whole family of curves. (This picture was popularised by Mathologer's video *Times Tables, Mandelbrot and the Heart of Mathematics*.)`,
            },
            {
              type: 'numeric',
              title: 'Day of the week',
              prompt: 'Today is Monday. What day of the week will it be in 100 days? (Enter 1 for Monday, 2 for Tuesday, … 7 for Sunday.)',
              answer: 3,
              wrong: [{ v: 2, why: r`$100 = 14 \times 7 + 2$: two days after Monday.` }, { v: 1, why: r`100 isn't a multiple of 7: $100 \bmod 7 = 2$.` }],
              explain: r`$100 \bmod 7 = 2$ (since $98 = 14 \times 7$). Two days after Monday is **Wednesday**.`,
            },
            {
              type: 'numeric',
              title: 'Last digit of a huge power',
              body: r`Look at the last digits of powers of 7: $7^1 = 7$, $7^2 = 49$, $7^3 = 343$, $7^4 = 2401$, $7^5 = 16807$, …`,
              prompt: r`What is the last digit of $7^{2026}$?`,
              answer: 9,
              wrong: [{ v: 7, why: r`The last digits cycle 7, 9, 3, 1 with period 4. Find $2026 \bmod 4$.` }, { v: 1, why: r`That would be true if 2026 were a multiple of 4. But $2026 \bmod 4 = 2$.` }],
              explain: r`Last digits cycle 7, 9, 3, 1 (working mod 10). $2026 = 4 \times 506 + 2$, so $7^{2026}$ ends like $7^2$, in **9**.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Remainder of a giant',
              prompt: r`What is the remainder when $2^{100}$ is divided by 3?`,
              answer: 1,
              wrong: [{ v: 2, why: r`$2 \equiv -1 \pmod 3$, so $2^{100} \equiv (-1)^{100} = +1$.` }],
              explain: r`$2 \equiv -1 \pmod 3$, so $2^{100} \equiv (-1)^{100} = 1 \pmod 3$. No need to compute the 31-digit number $2^{100}$!`,
            },
          ],
          recap: [
            r`$a \equiv b \pmod n$ means $a$ and $b$ leave the same remainder after dividing by $n$.`,
            'Reduce early: you can add and multiply in modular arithmetic.',
            'Powers repeat in cycles mod n, which makes huge powers easy.',
          ],
        },
        {
          id: 'fermat',
          title: 'Fermat’s Little Theorem',
          summary: 'Powers that come back to 1',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'A surprising pattern',
              body: r`Work mod 7 and take powers of 3: $3, 9 \equiv 2, 6, 18 \equiv 4, 12 \equiv 5, 15 \equiv 1$. After six steps you're back at 1, and the cycle repeats.

In 1640, Pierre de Fermat noticed that this always happens with a prime modulus:
::: key
**Fermat's little theorem:** if $p$ is prime and $a$ isn't a multiple of $p$, then $a^{p-1} \equiv 1 \pmod p$.
:::`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Powers around a clock',
              prompt: r`The six nonzero remainders mod 7 sit around the circle. The path follows $a, a^2, a^3, \dots$ (mod 7). Find a base $a$ whose powers visit **all six** remainders.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.35, ymax: 1.35, grid: false, axes: false, maxWidth: 400,
                params: { a: { min: 2, max: 6, step: 1, value: 2, label: 'base a', color: 'coral' } },
                extra: ({ plot, p, s }) => {
                  const pos = (r0) => { const ang = Math.PI / 2 - (2 * Math.PI * (r0 - 1)) / 6; return [0.9 * Math.cos(ang), 0.9 * Math.sin(ang)]; };
                  const seq = [];
                  for (let k = 1; k <= 6; k++) seq.push(powMod(p.a, k, 7));
                  const hit = new Set(seq);
                  const els = [s('path', { d: seq.map((r0, i) => { const [x, y] = pos(r0); return `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`; }).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5, opacity: 0.8 })];
                  for (let r0 = 1; r0 <= 6; r0++) {
                    const [x, y] = pos(r0);
                    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 15, class: hit.has(r0) ? 'fl-coral' : 'fl-card', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                    const t = s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', class: 'lbl', text: String(r0) });
                    if (hit.has(r0)) t.style.fill = 'var(--card)';
                    els.push(t);
                  }
                  return els;
                },
                readout: (p) => {
                  const seq = [];
                  for (let k = 1; k <= 6; k++) seq.push(powMod(p.a, k, 7));
                  return r`powers of ${p.a} mod 7: ${seq.join(', ')}`;
                },
                goal: (p) => new Set(Array.from({ length: 6 }, (_, k) => powMod(p.a, k + 1, 7))).size === 6,
                hint: 'Try each base. Some cycle back to 1 early and skip remainders.',
                solution: { a: 3 },
              },
              explain: r`3 (and 5) visit every remainder before returning to 1: they're called **primitive roots** mod 7. Bases 2 and 4 cycle with length 3; 6 has length 2. But every cycle length divides 6, and $a^6 \equiv 1$ for every base, just as Fermat said.`,
            },
            {
              type: 'numeric',
              title: 'A big power, quickly',
              prompt: r`Find the remainder when $2^{100}$ is divided by 7. (Hint: $2^3 = 8 \equiv 1 \pmod 7$.)`,
              answer: 2,
              wrong: [{ v: 1, why: r`$2^{99} = (2^3)^{33} \equiv 1$, but there's one more factor of 2.` }, { v: 4, why: r`$100 = 3 \times 33 + 1$, so $2^{100} \equiv 2^1$.` }],
              explain: r`$2^{100} = (2^3)^{33} \times 2 \equiv 1^{33} \times 2 = 2 \pmod 7$.`,
            },
            {
              type: 'numeric',
              title: 'Using Fermat',
              prompt: r`Find the remainder when $3^{2026}$ is divided by 7.`,
              answer: 4,
              wrong: [{ v: 1, why: r`$3^6 \equiv 1$, but 2026 isn't a multiple of 6: $2026 = 6 \times 337 + 4$.` }, { v: 3, why: r`Reduce the exponent mod 6: $3^{2026} \equiv 3^4$.` }],
              explain: r`By Fermat, $3^6 \equiv 1 \pmod 7$. Since $2026 = 6 \times 337 + 4$, $3^{2026} \equiv 3^4 = 81 = 11 \times 7 + 4 \equiv 4$.`,
            },
            {
              type: 'numeric',
              title: 'Shrinking a huge power',
              prompt: r`Fermat says $7^{10} \equiv 1 \pmod{11}$. Use it to find the remainder when $7^{222}$ is divided by 11.`,
              answer: 5,
              explain: r`$222 = 22 \times 10 + 2$, so $7^{222} \equiv (7^{10})^{22} \times 7^2 \equiv 49 \equiv 5 \pmod{11}$. A number with almost 190 digits, reduced in two lines.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A primality test',
              prompt: r`A computer finds that $2^{90} \not\equiv 1 \pmod{91}$. What can it conclude about 91?`,
              choices: [
                { t: '91 is definitely not prime', ok: true },
                { t: '91 is definitely prime', why: 'Fermat’s theorem says primes always give 1. Getting something else proves the number is composite.' },
                { t: 'Nothing', why: r`If 91 were prime, $2^{90}$ would have to be $\equiv 1$. It isn't, so 91 can't be prime.` },
              ],
              explain: r`Fermat's theorem is a quick **compositeness test**: if $a^{n-1} \not\equiv 1 \pmod n$, then $n$ is composite, without finding any factor. (Indeed $91 = 7 \times 13$.) Passing the test doesn't prove primality, since rare "Carmichael numbers" like 561 fool it, but refined versions are how computers find the huge primes RSA needs.`,
            },
          ],
          recap: [
            r`Fermat: for prime $p$ and $a$ not divisible by $p$, $a^{p-1} \equiv 1 \pmod p$.`,
            r`Reduce huge exponents mod $p - 1$.`,
            'Failing the Fermat test proves a number is composite.',
          ],
        },
        {
          id: 'checkdigits',
          title: 'Check Digits',
          summary: 'Catching typos with arithmetic',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'A built-in error detector',
              body: r`Barcodes, book numbers (ISBNs), bank cards and train tickets all end with a **check digit**, chosen so that a weighted sum of all the digits is a multiple of 10 (or 11). Mistype one digit, and the sum almost always stops being a multiple, so the computer knows something's wrong.

In an ISBN-13, the digits are weighted alternately 1, 3, 1, 3, … and the total must be divisible by 10.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Complete the ISBN',
              prompt: r`A book's ISBN is 978-0-306-40615-?. Choose the check digit that makes the weighted sum a multiple of 10.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 13, ymin: 0, ymax: 2, grid: false, axes: false, height: 120,
                params: { d: { min: 0, max: 9, step: 1, value: 0, label: 'check digit', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  [...ISBN, p.d].forEach((dg, i) => {
                    els.push(s('text', { x: plot.X(i + 0.5), y: plot.Y(1.2), class: 'lbl', 'text-anchor': 'middle', style: `font-size: 22px; fill: var(--${i === 12 ? 'violet' : 'ink'})`, text: String(dg) }));
                    els.push(s('text', { x: plot.X(i + 0.5), y: plot.Y(0.4), class: 'tick', 'text-anchor': 'middle', text: `×${i % 2 ? 3 : 1}` }));
                  });
                  return els;
                },
                readout: (p) => r`weighted sum $= ${isbnSum(p.d)}$ ${isbnSum(p.d) % 10 === 0 ? '✓ divisible by 10' : '✗'}`,
                goal: (p) => isbnSum(p.d) % 10 === 0,
                hint: 'The first twelve digits give a weighted sum of 93. The check digit has weight 1.',
                solution: { d: 7 },
              },
              explain: r`The first twelve digits give $93$; adding $7$ makes $100$ ✓. So the ISBN is 978-0-306-40615-7.`,
            },
            {
              type: 'mcq',
              title: 'One wrong digit',
              prompt: r`If you mistype a single digit of an ISBN-13, will the check always catch it?`,
              choices: [
                { t: 'Yes: changing one digit changes the sum by a non-multiple of 10', ok: true },
                { t: 'No: about 1 in 10 single typos slip through', why: r`Changing a digit by $k$ changes the sum by $k$ or $3k$. For $k$ from 1 to 9, neither is a multiple of 10.` },
              ],
              explain: r`A change of $k$ (between 1 and 9) shifts the sum by $k$ or $3k$, never a multiple of 10, because 3 and 10 share no factor. Every single-digit error is caught.`,
            },
            {
              type: 'numeric',
              title: 'ISBN-10 check digit',
              prompt: r`An old ISBN-10 starts 0-306-40615. Multiply its digits by 10, 9, 8, …, 2 and add; the check digit $c$ is chosen so the total plus $c$ is divisible by 11. What is $c$?`,
              answer: 2,
              hint: r`The weighted sum of the first nine digits is 130.`,
              explain: r`$0\cdot10 + 3\cdot9 + 0\cdot8 + 6\cdot7 + 4\cdot6 + 0\cdot5 + 6\cdot4 + 1\cdot3 + 5\cdot2 = 130$, and $130 + 2 = 132 = 12 \times 11$. So the full ISBN is 0-306-40615-**2**. (When the check digit would be 10, an X is used.)`,
            },
            {
              type: 'numeric',
              title: 'The Luhn check',
              prompt: r`Credit cards use the Luhn algorithm: from the right, double every second digit (subtracting 9 if over 9), add everything, and choose the check digit that makes the total a multiple of 10. For the number 7992739871, the check digit appended is…`,
              answer: 3,
              explain: r`Doubling and summing the digits of 7992739871 gives 67, so the check digit is 3 (making 70). Luhn catches every single-digit error and most swaps of neighbouring digits.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Swapped digits',
              prompt: r`A common typo swaps two neighbouring digits. Which swap would an ISBN-13 check **fail** to catch?`,
              choices: [
                { t: 'Swapping 2 and 7', ok: true },
                { t: 'Swapping 2 and 3', why: r`The sum changes by $2 \times (3 - 2) = 2$: caught.` },
                { t: 'Swapping 1 and 9', why: r`The sum changes by $2 \times 8 = 16$: not a multiple of 10, so caught.` },
              ],
              explain: r`Swapping neighbours $a$ and $b$ moves one from weight 1 to weight 3 and the other the opposite way, changing the sum by $2(a - b)$. That's a multiple of 10 only when $a - b = \pm 5$, like 2 and 7. The older ISBN-10 used weights 10, 9, …, 1 and divisibility by 11 (a prime), which catches **every** neighbour swap.`,
            },
          ],
          recap: [
            'Check digits make a weighted digit sum divisible by 10 (or 11).',
            'Single-digit typos are always detected by ISBN-13.',
            'Neighbour swaps differing by 5 slip through; a prime modulus (11) catches them all.',
          ],
        },
        {
          id: 'codes',
          title: 'Secret Codes',
          summary: 'From Caesar to RSA',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Caesar’s cipher',
              body: r`Julius Caesar reportedly encrypted messages by shifting each letter 3 places along the alphabet: A→D, B→E, …, X→A, Y→B, Z→C. In mod-26 arithmetic, that's: letter $+ 3 \pmod{26}$.`,
              prompt: 'Decrypt the message “KHOOR”.',
              cols: 2,
              choices: [
                { t: 'HELLO', ok: true },
                { t: 'NKRRU', why: 'That shifts forward by another 3. To decrypt, shift *back* by 3.' },
                { t: 'HOLLA', why: 'Shift every letter back by exactly 3: K→H, H→E, O→L, O→L, R→O.' },
              ],
              explain: r`Shift back by 3 (subtract 3 mod 26): K→H, H→E, O→L, O→L, R→O. **HELLO**.`,
            },
            {
              type: 'mcq',
              title: 'Easy to break',
              prompt: 'Why is a Caesar cipher easy to break?',
              choices: [
                { t: 'There are only 25 possible shifts to try', ok: true },
                { t: 'It uses too many letters', why: 'The problem is the tiny number of possible keys.' },
                { t: 'It can’t encrypt long messages', why: 'It can encrypt messages of any length. It just has very few keys.' },
              ],
              explain: r`With only 25 possible keys, you can try them all in a minute. Even fancier substitution ciphers fall to **frequency analysis**: E is the most common letter in English, so the most common symbol probably stands for E.`,
            },
            {
              type: 'explain',
              title: 'The key-sharing problem',
              body: r`Every classical cipher has the same weakness: sender and receiver need to share a **secret key** beforehand. How could you share a key with a website you've never visited, over an internet anyone can eavesdrop on?

In 1977, Rivest, Shamir and Adleman published **RSA**: a **public-key** system. Everyone can know your *public* key and use it to lock messages to you. Only your *private* key can unlock them.`,
            },
            {
              type: 'explain',
              title: 'How RSA works (in miniature)',
              body: r`1. Pick two primes, say $p = 5$ and $q = 11$. Their product $n = 55$ is public.
2. Pick a public exponent, $e = 3$. To send the message $m$, compute $c = m^e \bmod n$.
3. The private exponent $d = 27$ satisfies $e \cdot d \equiv 1 \pmod{(p-1)(q-1)}$, which here is $\pmod{40}$. Then $c^d \bmod n = m$, recovering the message.

Finding $d$ requires knowing $p$ and $q$. With primes hundreds of digits long, nobody knows how to factor $n$ in any reasonable time. That's the lock.`,
            },
            {
              type: 'numeric',
              title: 'Encrypt',
              prompt: r`With $n = 55$ and $e = 3$, encrypt the message $m = 2$: compute $2^3 \bmod 55$.`,
              answer: 8,
              wrong: [{ v: 6, why: r`$2^3$ means $2 \times 2 \times 2$, not $2 \times 3$.` }],
              explain: r`$2^3 = 8$, and $8 \bmod 55 = 8$. The ciphertext is 8. (Decrypting computes $8^{27} \bmod 55$, which comes out back to 2.)`,
            },
            {
              type: 'interactive',
              title: 'Crack the Caesar cipher',
              body: r`An intercepted message reads **KHOOR ZRUOG**. Turn the shift dial until it decodes into English.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 40,
                params: { k: { min: 0, max: 25, step: 1, value: 0, label: 'shift back by', color: 'violet' } },
                readout: (p) => `decoded: **${'KHOOR ZRUOG'.replace(/[A-Z]/g, (ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 - p.k + 26) % 26) + 65))}**`,
                goal: (p) => p.k === 3,
                hint: 'Julius Caesar reportedly used a small shift.',
                solution: { k: 3 },
              },
              explain: r`A shift of 3 gives HELLO WORLD. With only 25 possible keys, trying them all takes seconds: that's why Caesar ciphers offer no real security, and why modern codes have keys with hundreds of digits.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'What keeps it safe?',
              prompt: 'What would let an attacker break RSA?',
              choices: [
                { t: 'A fast method for factoring large numbers into primes', ok: true },
                { t: 'Knowing the public key', why: 'The public key is meant to be public. Security depends on not being able to work out the private key from it.' },
                { t: 'A faster computer for multiplying', why: 'Multiplying primes is already easy. Undoing the multiplication (factoring) is what’s hard.' },
              ],
              explain: r`Multiplying two big primes is easy. Undoing it, factoring $n$ back into $p \times q$, is believed to be extremely hard for ordinary computers. A large enough **quantum computer** running Shor's algorithm could factor quickly, which is why cryptographers are already switching to new "post-quantum" systems.`,
            },
          ],
          recap: [
            'Caesar shifts letters mod 26, but with only 25 keys it’s easy to break.',
            'Public-key cryptography (RSA) solves the key-sharing problem.',
            'RSA’s security rests on how hard it is to factor large numbers.',
          ],
        },
      ],
    },
  ],
};
