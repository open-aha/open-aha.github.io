const r = String.raw;

// Hilbert's hotel: who is in rooms 1–20 under each plan
const HOTEL = ['every room full', 'one new guest', 'a bus of new guests', 'infinitely many buses'];
const hotelRoom = (plan, n) => {
  if (plan === 0) return ['old', n];
  if (plan === 1) return n === 1 ? ['new', 1] : ['old', n - 1];
  if (plan === 2) return n % 2 === 0 ? ['old', n / 2] : ['new', (n + 1) / 2];
  const k = Math.log2(n); if (Number.isInteger(k) && k >= 1) return ['old', k];
  for (let b = 1; 3 ** b <= n; b++) for (let g = 1; 3 ** b * 5 ** g <= n; g++) if (3 ** b * 5 ** g === n) return ['bus', `${b}.${g}`];
  return null;
};
// Cantor's zigzag list of positive fractions (duplicates skipped)
const ZIGZAG = (() => { const g = (a, b) => (b ? g(b, a % b) : a), L = []; for (let d = 2; L.length < 60; d++) { const cells = []; for (let p = 1; p < d; p++) cells.push([p, d - p]); if (d % 2 === 1) cells.reverse(); for (const c of cells) if (g(c[0], c[1]) === 1) L.push(c); } return L; })();
// six binary sequences for the diagonal game
const LIST = ['101100', '011010', '110111', '000101', '111001', '010110'];
// Riemann rearrangement of 1 − 1/2 + 1/3 − …: greedily take positive terms until above the target, then negative ones until below
const rearrange = (target, N = 400) => { let s = 0, pi = 0, ni = 0; const sums = []; for (let k = 0; k < N; k++) { if (s <= target) { s += 1 / (2 * pi + 1); pi++; } else { ni++; s -= 1 / (2 * ni); } sums.push(s); } return sums; };
// interleave the decimal digits of x and y (3 digits each)
const interleave = (x, y) => { const a = Math.round(x * 1000).toString().padStart(3, '0'), b = Math.round(y * 1000).toString().padStart(3, '0'); return `0.${a[0]}${b[0]}${a[1]}${b[1]}${a[2]}${b[2]}`; };
const ternary = (x, n = 8) => { let s = ''; for (let i = 0; i < n; i++) { x *= 3; const d = Math.floor(x + 1e-9); s += d; x -= d; } return s; };
const inCantor = (x) => { for (let i = 0; i < 30; i++) { x *= 3; const d = Math.floor(x + 1e-12); if (d === 1 && x - 1 > 1e-9) return false; x -= d; if (x < 1e-12) return true; } return true; };

// the order-n Hilbert curve through the centres of a 2^n × 2^n grid (the standard index-to-point conversion)
const hilbertPts = (n) => {
  const N = 2 ** n, out = [];
  for (let d = 0; d < N * N; d++) {
    let x = 0, y = 0, t = d;
    for (let s = 1; s < N; s *= 2) {
      const rx = 1 & (t >> 1), ry = 1 & (t ^ rx);
      if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const tmp = x; x = y; y = tmp; }
      x += s * rx; y += s * ry; t >>= 2;
    }
    out.push([(x + 0.5) / N, (y + 0.5) / N]);
  }
  return out;
};
const HILBERT = [1, 2, 3, 4, 5, 6].map(hilbertPts);
const hilbertStage = (t) => { const k = Math.min(5, Math.floor(t / 3.2)), u = Math.min(1, ((t % 3.2) / 2.2)); return { k, u: k === 5 && t > 16 ? 1 : u }; };

export default {
  id: 'infinity',
  subject: 'math',
  title: 'Infinity',
  level: 'Advanced',
  cover: 'infinity',
  tagline: 'Hilbert’s Hotel, countable sets, infinities bigger than infinity, and the dust of the Cantor set.',
  description: r`Infinity breaks everyday intuition. A full hotel can take in infinitely many new guests, there are exactly as many even numbers as whole numbers, and yet some infinities are strictly bigger than others. Follow Cantor's astonishing arguments step by step, squash a square into a line, and explore a set with no length but uncountably many points.`,
  prereq: 'Logic & Proof',
  chapters: [
    {
      title: 'Counting Forever',
      summary: 'When “same size” means pairing up.',
      lessons: [
        {
          id: 'hilbert',
          title: 'Hilbert’s Hotel',
          summary: 'Always room for more',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'No vacancies?',
              body: r`A hotel has infinitely many rooms, numbered 1, 2, 3, … and every room is occupied. A new guest arrives.`,
              prompt: 'Can the manager fit her in without evicting anyone?',
              choices: [
                { t: 'Yes: everyone moves from room n to room n + 1, freeing room 1', ok: true },
                { t: 'No: the hotel is full', why: 'With infinitely many rooms, "full" doesn’t mean what it does for finite hotels. Try shifting everyone along by one.' },
              ],
              explain: r`The guest in room 1 moves to room 2, the one in room 2 moves to room 3, and so on forever. Everyone still has a room, and room 1 is free. This thought experiment, introduced by David Hilbert in a 1924 lecture, shows that infinite sets behave strangely.`,
            },
            {
              type: 'mcq',
              title: 'An infinite bus',
              prompt: 'Now a bus arrives with infinitely many new guests (numbered 1, 2, 3, …). How can the full hotel fit them all?',
              choices: [
                { t: 'Move every current guest from room n to room 2n, freeing all the odd rooms', ok: true },
                { t: 'Shift everyone by one, infinitely many times', why: 'Each shift frees one room, but that process never finishes. You need a single move that frees infinitely many rooms at once.' },
                { t: 'It’s impossible', why: 'It’s possible. Look for a move that leaves infinitely many rooms empty.' },
              ],
              explain: r`After moving from room $n$ to room $2n$, the current guests fill all the even rooms. All the odd rooms (1, 3, 5, …) are empty, and there are infinitely many of them: new guest $k$ goes to room $2k - 1$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The night manager’s plans',
              body: r`Here are the first 20 rooms of the hotel. Step through the plans and watch where everyone ends up. Blue guests were already staying; coral guests are new arrivals.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2.3, grid: false, axes: false, height: 200,
                params: { plan: { min: 0, max: 3, step: 1, value: 0, label: 'plan', color: 'violet', format: (v) => HOTEL[v] } },
                extra: ({ plot, p, s }) => { const els = []; for (let n = 1; n <= 20; n++) { const col = (n - 1) % 10, row = n <= 10 ? 1.2 : 0.1, who = hotelRoom(p.plan, n); els.push(s('rect', { x: plot.X(col + 0.06), y: plot.Y(row + 0.95), width: plot.X(0.88) - plot.X(0), height: plot.Y(0) - plot.Y(0.95), rx: 6, class: who ? (who[0] === 'old' ? 'fl-blue-soft' : 'fl-coral-soft') : 'fl-card', stroke: 'var(--line-2)' })); els.push(s('text', { x: plot.X(col + 0.14), y: plot.Y(row + 0.75), class: 'tick', text: String(n) })); if (who) els.push(s('text', { x: plot.X(col + 0.5), y: plot.Y(row + 0.3), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: who[0] === 'old' ? 'var(--blue)' : 'var(--coral)', text: who[0] === 'old' ? `guest ${who[1]}` : who[0] === 'new' ? `new ${who[1]}` : `bus ${who[1]}` })); } return els; },
                readout: (p) => ['Every room is taken.', 'Everyone moved up one: room 1 is free for the newcomer.', 'Old guests doubled their room numbers; the bus fills the odd rooms.', 'Old guests in powers of 2, bus b guest g in room 3ᵇ×5ᵍ. Lots of rooms stay empty, which is allowed.'][p.plan],
              },
              after: r`In each plan, every old guest still has a room and every newcomer gets one. No room ever holds two guests, because each plan is a **one-to-one** rule. That's the whole trick of infinite sets.`,
            },
            {
              type: 'numeric',
              title: 'Which room?',
              prompt: 'Under that plan, which room does new guest number 50 get?',
              answer: 99,
              wrong: [{ v: 100, why: r`Even rooms are taken. New guest $k$ goes to odd room $2k - 1$.` }, { v: 50, why: 'Room 50 is even, so it now holds an old guest.' }],
              explain: r`New guest $k$ goes to room $2k - 1$, so guest 50 gets room 99.`,
            },
            {
              type: 'mcq',
              title: 'Infinitely many buses',
              prompt: 'Now infinitely many buses arrive, each carrying infinitely many guests. Can the hotel still fit everyone?',
              choices: [
                { t: 'Yes: for example, move the old guests to rooms 2ⁿ, and put guest g from bus b in room 3ᵇ × 5ᵍ', ok: true },
                { t: 'No: that’s too many', why: 'Surprisingly, it’s still possible. Each guest is described by a pair of whole numbers, and pairs of whole numbers can be listed.' },
              ],
              explain: r`Keep the old guests in rooms $2^n$, and send guest $g$ from bus $b$ to room $3^b \cdot 5^g$. Unique prime factorization (from Number Theory!) guarantees no two people get the same room. Infinity × infinity is still the same size of infinity.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Bus 1, seat 2',
              prompt: r`Under the many-buses plan, guest $g$ from bus $b$ goes to room $3^b \times 5^g$. Which room does guest 2 from bus 1 get?`,
              answer: 75,
              wrong: [{ v: 45, why: r`That's $3^2 \times 5^1$: bus 2, guest 1. You want $3^1 \times 5^2$.` }, { v: 15, why: 'That’s guest 1 from bus 1.' }],
              explain: r`$3^1 \times 5^2 = 3 \times 25 = 75$. Because every whole number factors into primes in only one way, no two guests can ever be sent to the same room, and the old guests (powers of 2) never clash with the newcomers.`,
            },
          ],
          recap: [
            'A full infinite hotel can still take new guests by shifting everyone along.',
            'Moving guests from room n to room 2n frees infinitely many rooms.',
            'Even infinitely many infinite buses fit. Infinity works differently.',
          ],
        },
        {
          id: 'countable',
          title: 'The Same Size',
          summary: 'Pairing up infinite sets',
          icon: 'hand',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Chairs and people',
              prompt: 'How can you tell whether a room has the same number of people as chairs, without counting either?',
              choices: [
                { t: 'Ask everyone to sit down: if every chair is taken and nobody is standing, they match', ok: true },
                { t: 'You can’t without counting', why: 'Pairing things up one-to-one shows they match, with no counting needed.' },
              ],
              explain: r`Matching things up one-to-one shows that two collections are the same size, without counting. Georg Cantor used exactly this idea to compare **infinite** sets.`,
            },
            {
              type: 'explain',
              title: 'One-to-one correspondence',
              body: r`Two sets are the **same size** if their elements can be paired up perfectly: each element of one matched with exactly one of the other, with none left over. This is called a **bijection**.

By this definition, there are exactly as many **even** numbers as whole numbers:
$$1 \leftrightarrow 2,\quad 2 \leftrightarrow 4,\quad 3 \leftrightarrow 6,\quad \ldots,\quad n \leftrightarrow 2n$$
A part can be as big as the whole! That's actually the defining property of infinite sets.`,
            },
            {
              type: 'mcq',
              title: 'Integers too',
              prompt: 'Can all the integers (…, −2, −1, 0, 1, 2, …) be paired up with the counting numbers 1, 2, 3, …?',
              choices: [
                { t: 'Yes: list them as 0, 1, −1, 2, −2, 3, −3, …', ok: true },
                { t: 'No: there are twice as many integers', why: 'Interleave the positives and negatives into a single list, and every integer gets a position.' },
              ],
              explain: r`List them alternately: 0, 1, −1, 2, −2, … Every integer appears exactly once, at a definite position. Any set that can be listed like this is called **countable**.`,
            },
            {
              type: 'explain',
              title: 'Even the fractions',
              body: r`Surely there are more fractions than whole numbers? Between any two fractions there are infinitely many more!

Cantor's trick: arrange the positive fractions $\frac{p}{q}$ in a grid (numerator $p$ across, denominator $q$ down), then sweep through the grid along its diagonals: $\frac11, \frac21, \frac12, \frac13, \frac22, \frac31, \ldots$ Skip duplicates like $\frac22 = \frac11$. Every fraction is reached eventually, so the fractions can be listed too: they're **countable**.`,
              widget: {
                kind: 'figure', w: 600, h: 300, label: 'Cantor zigzag through fractions',
                draw: ({ s }) => {
                  const els = [];
                  const cell = 62, x0 = 120, y0 = 40;
                  const order = [[1, 1], [2, 1], [1, 2], [1, 3], [2, 2], [3, 1], [4, 1], [3, 2], [2, 3], [1, 4]];
                  const pos = (p, q) => [x0 + (p - 1) * cell, y0 + (q - 1) * cell];
                  els.push(s('path', { d: order.map(([p, q], i) => { const [x, y] = pos(p, q); return `${i ? 'L' : 'M'}${x} ${y}`; }).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3, opacity: 0.7 }));
                  for (let q = 1; q <= 4; q++) for (let p = 1; p <= 5; p++) {
                    const [x, y] = pos(p, q);
                    els.push(s('text', { x, y: y + 6, 'text-anchor': 'middle', class: 'lbl', style: `font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px));${gcd(p, q) > 1 ? 'opacity:.3' : ''}`, text: `${p}/${q}` }));
                  }
                  return els;
                },
              },
              after: 'Faded fractions are duplicates (like 2/2 = 1/1) and get skipped.',
            },
            {
              type: 'interactive',
              title: 'Where is 3/4?',
              body: r`Here's Cantor's zigzag through the fractions (duplicates skipped). Move along the list to find the position of $\frac34$.`,
              widget: {
                kind: 'graph', xmin: 0.4, xmax: 7.6, ymin: 0.4, ymax: 7.6, grid: false, axes: false, maxWidth: 420, equal: true,
                params: { n: { min: 1, max: 30, step: 1, value: 5, label: 'position', color: 'coral' } },
                extra: ({ plot, p, s }) => { const g = (a, b) => (b ? g(b, a % b) : a), els = [], P = ([a, b]) => `${plot.X(a).toFixed(1)} ${plot.Y(8 - b).toFixed(1)}`; els.push(s('path', { d: 'M' + ZIGZAG.slice(0, p.n).map(P).join('L'), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3, opacity: 0.6 })); for (let a = 1; a <= 7; a++) for (let b = 1; b <= 7; b++) { const idx = ZIGZAG.findIndex(([x, y]) => x === a && y === b); const on = idx >= 0 && idx < p.n; els.push(s('text', { x: plot.X(a), y: plot.Y(8 - b) + 6, 'text-anchor': 'middle', class: 'lbl', style: `font-size:max(calc(15px * var(--fs, 1)), var(--fmin, 0px));${g(a, b) > 1 ? 'opacity:.25' : ''};${on ? 'font-weight:700' : ''}`, fill: idx === p.n - 1 ? 'var(--coral)' : on ? 'var(--ink)' : 'var(--ink-3)', text: `${a}/${b}` })); } return els; },
                readout: (p) => { const [a, b] = ZIGZAG[p.n - 1]; return `position ${p.n}: **${a}/${b}**`; },
                goal: (p) => { const [a, b] = ZIGZAG[p.n - 1]; return a === 3 && b === 4; },
                hint: '3/4 is on the diagonal where numerator + denominator = 7.',
                solution: { n: 15 },
              },
              explain: r`$\frac34$ is the **15th** fraction in the list. Every fraction $\frac pq$ sits on diagonal $p + q$, and each diagonal is finite, so every fraction gets a definite, finite position. That's exactly what "countable" means.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Pairs of numbers',
              prompt: 'Is the set of all pairs of counting numbers (like (3, 7)) countable?',
              cols: 2,
              choices: [
                { t: 'Yes', ok: true },
                { t: 'No', why: r`It's exactly the grid used for fractions: sweep along the diagonals and every pair appears.` },
              ],
              explain: r`Lay the pairs out in a grid and sweep along the diagonals, just like the fractions. That's also why the infinite-buses trick works at Hilbert's Hotel.`,
            },
          ],
          recap: [
            'Two sets have the same size if they can be paired up one-to-one.',
            'Evens, integers, fractions and pairs of numbers are all countable: the same size as 1, 2, 3, …',
            'An infinite set can be the same size as part of itself.',
          ],
        },
      ],
    },
    {
      title: 'Bigger Infinities',
      summary: 'Cantor’s diagonal argument.',
      lessons: [
        {
          id: 'diagonal',
          title: 'The Diagonal Argument',
          summary: 'Uncountably many reals',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'List all decimals?',
              prompt: 'Since even the fractions can be listed, could every real number between 0 and 1 (every infinite decimal) be put into one infinite list?',
              choices: [
                { t: 'No: any list must miss some', ok: true },
                { t: 'Yes, with a clever enough ordering', why: 'Cantor proved in 1891 that no list, however clever, can contain them all.' },
              ],
              explain: r`Cantor's **diagonal argument** shows that any proposed list of real numbers misses at least one. Let's see how.`,
            },
            {
              type: 'explain',
              title: 'Build a missing number',
              body: r`Suppose someone claims to have a complete list:

| | decimal |
|---|---|
| 1st | 0.**5**1 4 2 8… |
| 2nd | 0.3 **3** 3 3 3… |
| 3rd | 0.7 1 **8** 2 8… |
| 4th | 0.1 4 1 **4** 2… |
| … | … |

Build a new number $x$ digit by digit: make its **1st** digit differ from the 1st number's 1st digit, its **2nd** digit differ from the 2nd number's 2nd digit, and so on along the diagonal. (A safe rule: use 5, unless the diagonal digit is 5, then use 6.)

Here $x = 0.6555\ldots$ It differs from the $n$th number in the $n$th digit, so it can't be **anywhere** on the list. The list was incomplete, and **every** list is incomplete.`,
            },
            {
              type: 'numeric',
              title: 'Your turn',
              body: r`Using the rule "5, unless the diagonal digit is 5, then 6", and the list above, the first four digits of $x$ are 6, 5, 5, 5.`,
              prompt: r`If the 5th number on the list were 0.2 7 1 8 **5** 9…, what would the 5th digit of x be?`,
              answer: 6,
              wrong: [{ v: 5, why: 'The 5th number’s 5th digit is 5, so x must use 6 there to differ.' }],
              explain: r`The 5th number's 5th digit is 5, so the rule gives 6. Now $x$ differs from the 5th number too.`,
            },
            {
              type: 'interactive',
              title: 'Beat the list',
              body: r`Here's a list of six binary sequences (just their first six digits). Build your own sequence (bottom row) that **differs from every row**. The diagonal digits are highlighted.`,
              widget: {
                kind: 'graph', xmin: -1.6, xmax: 6, ymin: -1.2, ymax: 6.2, grid: false, axes: false, maxWidth: 400, equal: true,
                params: Object.fromEntries([0, 1, 2, 3, 4, 5].map((k) => [`b${k}`, { min: 0, max: 1, step: 1, value: [0, 1, 0, 1, 1, 0][k], label: `digit ${k + 1}`, color: k % 2 ? 'blue' : 'violet' }])),
                extra: ({ plot, p, s }) => { const mine = [0, 1, 2, 3, 4, 5].map((k) => String(p[`b${k}`])).join(''), els = []; LIST.forEach((row, i) => { const same = row === mine; els.push(s('text', { x: plot.X(-1.1), y: plot.Y(5.5 - i) + 6, class: 'tick', text: `${i + 1}.` })); for (let k = 0; k < 6; k++) { els.push(s('rect', { x: plot.X(k + 0.05), y: plot.Y(5.95 - i), width: plot.X(0.9) - plot.X(0), height: plot.Y(0) - plot.Y(0.9), rx: 4, class: k === i ? 'fl-amber-soft' : same ? 'fl-coral-soft' : 'fl-card', stroke: 'var(--line)' })); els.push(s('text', { x: plot.X(k + 0.5), y: plot.Y(5.5 - i) + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px));font-family:var(--font-mono)', text: row[k] })); } }); for (let k = 0; k < 6; k++) { els.push(s('rect', { x: plot.X(k + 0.05), y: plot.Y(-0.25), width: plot.X(0.9) - plot.X(0), height: plot.Y(0) - plot.Y(0.9), rx: 4, class: 'fl-violet-soft', stroke: 'var(--violet)' })); els.push(s('text', { x: plot.X(k + 0.5), y: plot.Y(-0.7) + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;font-family:var(--font-mono)', text: mine[k] })); } els.push(s('text', { x: plot.X(-1.1), y: plot.Y(-0.7) + 6, class: 'tick', text: 'you' })); return els; },
                readout: (p) => { const mine = [0, 1, 2, 3, 4, 5].map((k) => String(p[`b${k}`])).join(''), hit = LIST.findIndex((r) => r === mine); return hit >= 0 ? `Your sequence **matches row ${hit + 1}**.` : 'Your sequence differs from every row ✓'; },
                goal: (p) => { const mine = [0, 1, 2, 3, 4, 5].map((k) => String(p[`b${k}`])).join(''); return !LIST.includes(mine); },
                hint: 'Flip the diagonal: make your digit k the opposite of row k’s digit k.',
                solution: { b0: 0, b1: 0, b2: 1, b3: 0, b4: 1, b5: 1 },
              },
              explain: r`Any choice works as long as it matches no row, but Cantor's recipe **always** works: flip the diagonal, $0 \leftrightarrow 1$. Here the diagonal reads 1 1 0 1 0 0, so 001011 differs from row $k$ in digit $k$. For an infinite list the same recipe produces an infinite sequence that differs from every row, so no list can be complete.`,
            },
            {
              type: 'explain',
              title: 'Uncountable',
              body: r`So the real numbers are **uncountable**: a strictly bigger infinity than the counting numbers. There are "more" points on a line than there are whole numbers, even though both sets are infinite.

Cantor went further. For **any** set, the set of all its subsets is strictly bigger. So there's an endless tower of ever-larger infinities. Many mathematicians of his day found this disturbing, but Hilbert later declared: "No one shall expel us from the paradise that Cantor has created."`,
            },
            {
              type: 'mcq',
              title: 'Which are countable?',
              prompt: 'Which of these sets is uncountable?',
              choices: [
                { t: 'All infinite sequences of 0s and 1s', ok: true },
                { t: 'All finite strings of letters (every possible book)', why: 'List them by length: all strings of length 1, then length 2, and so on. Each group is finite, so the whole lot is countable.' },
                { t: 'All fractions', why: 'Cantor’s zigzag lists every fraction. They’re countable.' },
              ],
              explain: r`Infinite 0/1 sequences are uncountable: the diagonal argument works directly (flip the $n$th bit of the $n$th sequence). But finite strings, even all possible books, can be listed by length, so they're countable. That means most real numbers can't be described by **any** finite text at all!`,
            },
            {
              type: 'numeric',
              title: 'Subsets win',
              prompt: r`Cantor's theorem says every set has strictly more **subsets** than elements. How many subsets does the 3-element set $\{a, b, c\}$ have (including the empty set and the whole set)?`,
              answer: 8,
              wrong: [{ v: 3, why: 'That’s the number of elements. Each element can be in or out of a subset.' }, { v: 7, why: 'Don’t forget the empty set.' }, { v: 6, why: r`Each element is in or out: $2 \times 2 \times 2$.` }],
              explain: r`Each element is either in or out, so there are $2^3 = 8$ subsets. For $n$ elements, $2^n > n$. Cantor showed the same holds for infinite sets, using a diagonal argument: subsets of the counting numbers correspond to infinite 0/1 sequences, which are uncountable.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Between the two?',
              prompt: r`The counting numbers are countable and the real numbers are uncountable. Is there an infinity strictly in between?`,
              choices: [
                { t: 'It can’t be decided from the standard axioms of mathematics', ok: true },
                { t: 'No: Cantor proved there isn’t', why: 'Cantor conjectured this (the continuum hypothesis) but couldn’t prove it, and for good reason.' },
                { t: 'Yes: the fractions', why: 'The fractions are countable, the same size as the counting numbers.' },
              ],
              explain: r`Cantor's **continuum hypothesis** says there is no infinity in between. Kurt Gödel showed in 1940 that it can't be disproved from the standard axioms, and Paul Cohen showed in 1963 that it can't be proved either. It's **independent**: both answers give consistent mathematics.`,
            },
          ],
          recap: [
            'Cantor’s diagonal argument: any list of real numbers misses some.',
            'The real numbers are uncountable, a bigger infinity than the counting numbers.',
            'There is an endless hierarchy of infinities.',
          ],
        },
        {
          id: 'paradoxes',
          title: 'Infinite Paradoxes',
          summary: 'Where intuition breaks',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Grandi’s series',
              prompt: r`What is $1 - 1 + 1 - 1 + 1 - 1 + \cdots$ (forever)?`,
              choices: [
                { t: 'It has no sum: the partial sums keep jumping between 1 and 0', ok: true },
                { t: '0, because (1 − 1) + (1 − 1) + … = 0', why: r`Grouping as $1 + (-1 + 1) + (-1 + 1) + \cdots$ would give 1 instead. Regrouping terms is only safe for sums that converge.` },
                { t: '1', why: 'You can "prove" both 0 and 1 by grouping differently. That’s a sign the sum doesn’t exist.' },
              ],
              explain: r`The partial sums go 1, 0, 1, 0, … and never settle down, so the series **diverges**. Clever regrouping can "prove" 0 or 1, which shows that the familiar rules of arithmetic can fail for sums that don't converge.`,
            },
            {
              type: 'mcq',
              title: 'Gabriel’s horn',
              body: r`Spin the curve $y = 1/x$ (for $x \ge 1$) around the $x$-axis to make an infinitely long horn. Calculus shows its volume is exactly $\pi$, but its surface area is infinite.`,
              prompt: 'What does this paradox suggest?',
              choices: [
                { t: 'You could fill it with π units of paint, but never paint its inside surface', ok: true },
                { t: 'The calculations must be wrong', why: 'Both are correct: the volume integral converges, while the area integral diverges like the harmonic series.' },
              ],
              explain: r`The volume $\int_1^\infty \pi \frac{1}{x^2}\,dx = \pi$ converges, but the surface area grows like $\int \frac{1}{x}\,dx$, which diverges. The "paradox" dissolves once you remember that mathematical paint has no thickness. It's a vivid reminder that infinite processes need careful handling.`,
            },
            {
              type: 'mcq',
              title: 'Thomson’s lamp',
              prompt: r`A lamp is switched on, then off after 1 minute, on after another ½ minute, off after ¼ minute, and so on. Since $1 + \frac12 + \frac14 + \cdots = 2$, infinitely many switches happen in 2 minutes. Is the lamp on or off at the 2-minute mark?`,
              choices: [
                { t: 'The story doesn’t determine it: every switch happens before 2 minutes, and none is the last', ok: true },
                { t: 'On, because it started on', why: 'It also gets switched off. There is no final switch to decide the state.' },
                { t: 'Off, because the switching averages out', why: 'Averaging isn’t part of the story. The sequence on, off, on, off, … simply has no last term.' },
              ],
              explain: r`James Thomson posed this "supertask" in 1954. Like Grandi's series (1, 0, 1, 0, …), the sequence of states has no limit, so the description says nothing about the moment at 2 minutes. Any answer is consistent with it.`,
            },
            {
              type: 'interactive',
              title: 'Rearrange to order',
              body: r`The alternating series $1 - \frac12 + \frac13 - \frac14 + \cdots$ sums to $\ln 2 \approx 0.693$. Rearrange it: add positive terms ($1, \frac13, \frac15, \ldots$) until you pass a target, then negative terms ($-\frac12, -\frac14, \ldots$) until you drop below, and repeat. Every term gets used exactly once. Set the target to make the rearranged series add up to **1.5**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 400, ymin: -1, ymax: 2.6, grid: false, height: 280, axes: { xlabel: 'terms used', ylabel: 'partial sum', xticks: 100, yticks: 0.5 },
                params: { T: { min: -0.5, max: 2.5, step: 0.05, value: 0.7, label: 'target', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x, p) => p.T, color: 'coral', dash: true }, { f: () => Math.log(2), color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => { const S = rearrange(p.T); return [s('path', { d: 'M' + S.map((v, i) => `${plot.X(i + 1).toFixed(1)} ${plot.Y(v).toFixed(1)}`).join('L'), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2 })]; },
                readout: (p) => { const S = rearrange(p.T); return `after 400 terms the rearranged sum is **${S[S.length - 1].toFixed(3)}** (the usual order gives ${Math.log(2).toFixed(3)})`; },
                goal: (p) => Math.abs(p.T - 1.5) < 1e-9,
                hint: 'The partial sums home in on whatever target you choose.',
                solution: { T: 1.5 },
              },
              explain: r`The rearranged partial sums hug the target, so the series converges to 1.5, using exactly the same terms. This works because the positive terms alone add up to infinity (and so do the negative ones), so there's always enough "fuel" to climb back above or below any target. The swings shrink because the terms shrink.`,
            },
            {
              type: 'numeric',
              title: 'Achilles and the tortoise',
              prompt: r`Zeno's paradox: Achilles runs 10 times as fast as a tortoise that starts 100 m ahead. By the time he reaches its start, it has crept 10 m on; when he covers that, it is 1 m ahead; and so on forever. How far does Achilles run before he catches it, in metres? (1 decimal place.)`,
              unit: 'm',
              answer: 1000 / 9,
              tol: 0.05,
              wrong: [{ v: 110, tol: 0.5, why: 'That stops after two stages. The stages go on forever, but they shrink: 100 + 10 + 1 + 0.1 + ⋯' }],
              explain: r`$100 + 10 + 1 + 0.1 + \cdots = \frac{100}{1 - 0.1} = 111.1$ m. Infinitely many stages, but they fit into a finite distance (and a finite time). Zeno thought this showed motion was impossible; the idea of a convergent series, made rigorous two thousand years later, shows instead that an infinite process can have a perfectly finite total.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The first climb',
              prompt: r`To head for 1.5, the recipe first adds positive terms $1 + \frac13 + \frac15 + \cdots$ until the sum passes 1.5. How many positive terms does that take?`,
              unit: 'terms',
              answer: 3,
              wrong: [{ v: 2, why: r`$1 + \frac13 \approx 1.33$, still below 1.5.` }, { v: 4, why: r`$1 + \frac13 + \frac15 \approx 1.53$ already passes 1.5.` }],
              explain: r`$1 + \frac13 = 1.33$, then $+\frac15$ gives $1.53$: **3** terms. Then $-\frac12$ drops it to $1.03$, and the climb resumes with $\frac17, \frac19, \ldots$ To aim for 100 you'd need around $10^{86}$ positive terms on the first climb alone: the positive terms diverge, but very slowly.`,
            },
          ],
          recap: [
            'Divergent series can’t be summed, and regrouping their terms gives contradictions.',
            'Gabriel’s horn: finite volume, infinite surface area.',
            'Rearranging a conditionally convergent series can make it add up to any target.',
          ],
        },
      ],
    },
    {
      title: 'Strange Sets',
      summary: 'Squares, lines and dust.',
      lessons: [
        {
          id: 'square',
          title: 'A Line Is a Square',
          summary: 'Same infinity, different dimensions',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Stretching a segment',
              body: r`The interval of numbers between 0 and 1 is uncountable. Is the whole number line bigger? No: the function $x \mapsto \tan\!\left(\pi\left(x - \tfrac12\right)\right)$ stretches the open interval $(0, 1)$ onto the **entire** real line, one-to-one. A segment one centimetre long has exactly as many points as an infinite line.`,
            },
            {
              type: 'interactive',
              title: 'Squash a square',
              body: r`Cantor asked whether a **square** has more points than a line segment. His answer: pair a point $(x, y)$ with the number whose decimal digits alternate between $x$'s and $y$'s. Drag the point to find the point of the square that corresponds to the number **0.123456**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.05, xmax: 1.05, ymin: -0.05, ymax: 1.05, grid: 0.1, maxWidth: 400, axes: { xlabel: 'x', ylabel: 'y', xticks: 0.5, yticks: 0.5 },
                params: { x: { min: 0, max: 0.999, step: 0.001, value: 0.5, slider: false }, y: { min: 0, max: 0.999, step: 0.001, value: 0.5, slider: false } },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral' }],
                readout: (p) => `$x = ${p.x.toFixed(3)}$, $y = ${p.y.toFixed(3)}$ → interleaved: **${interleave(p.x, p.y)}**`,
                goal: (p) => interleave(p.x, p.y) === '0.123456',
                hint: 'The odd-position digits (1, 3, 5) come from x; the even ones (2, 4, 6) from y.',
                solution: { x: 0.135, y: 0.246 },
              },
              explain: r`$x = 0.135$ and $y = 0.246$ interleave to $0.123456$. Run backwards, any number's digits split into an $x$ and a $y$. So the square and the segment have **the same number of points**, despite their different dimensions. (A careful proof must handle decimals like $0.0999\ldots = 0.1$, but the idea survives.)`,
            },
            {
              type: 'mcq',
              title: '“I see it, but I don’t believe it”',
              prompt: r`Cantor wrote those words to Richard Dedekind in 1877 about this discovery. Why did it shock mathematicians?`,
              choices: [
                { t: 'It seemed to erase the difference between one and two dimensions, which everyone assumed was a matter of size', ok: true },
                { t: 'It was later shown to be false', why: 'The result is correct. What came later was a deeper understanding of dimension.' },
                { t: 'It proved squares are bigger than lines', why: 'It proved the opposite: they have exactly the same number of points.' },
              ],
              explain: r`Dimension can't be about **how many** points a shape has. Later mathematicians showed that while such pairings exist, no pairing between a square and a segment can be **continuous** both ways: dimension is about how points are arranged (topology), not how many there are.`,
            },
            {
              type: 'numeric',
              title: 'Where does 0.75 go?',
              prompt: r`The stretching map $x \mapsto \tan\!\left(\pi\left(x - \tfrac12\right)\right)$ sends the interval $(0, 1)$ onto the whole number line. Where does $x = 0.75$ go?`,
              answer: Math.tan(Math.PI / 4),
              tol: 0.001,
              explain: r`$\tan\left(\frac{\pi}{4}\right) = 1$. Points near 1 are sent off toward $+\infty$ and points near 0 toward $-\infty$: every real number is hit exactly once.`,
            },
            {
              type: 'numeric',
              title: 'Hilbert’s squares',
              prompt: r`The $n$-th stage of Hilbert’s space-filling curve visits every one of the $4^n$ small squares of a grid. How many squares does the 3rd stage visit?`,
              answer: 64,
              explain: r`$4^3 = 64$ (an 8 × 8 grid). In the limit the curve passes through every point of the square, yet it is a continuous image of a line segment.`,
            },
            { /*anim:infinity*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A curve that fills the square',
              body: r`Hilbert's curve, stage by stage. Each stage splits every small square into 4 and visits them in the same U-shaped order, turned so the pieces join up.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.03, xmax: 1.03, ymin: -0.03, ymax: 1.03, grid: false, axes: false, maxWidth: 360,
                animate: { param: 't', speed: 1, max: 22, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { k, u } = hilbertStage(p.t), pts = HILBERT[k], m = Math.max(2, Math.ceil(pts.length * u)), els = [];
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(1), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5 }));
                  els.push(s('path', { d: pts.slice(0, m).map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': Math.max(1.2, 4 - 0.55 * k), 'stroke-linejoin': 'round' }));
                  return els;
                },
                readout: (p) => { const { k } = hilbertStage(p.t), n = k + 1; return `stage ${n}: visits ${4 ** n} squares, length ${(2 ** n - 1 / 2 ** n).toFixed(3)} (the square's side is 1)`; },
              },
              after: r`Each stage refines the one before: the point a given fraction of the way along the curve stays inside the same small square from one stage to the next, and those squares keep shrinking. So the stages settle down to a limiting curve, a continuous path that passes through **every** point of the square. The length doubles each time (it's $2^n - 2^{-n}$ at stage $n$), heading to infinity, while the curve itself never leaves the square.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Back to the square',
              prompt: r`Which point $(x, y)$ of the square corresponds to the number $0.718281$? Give $x + y$.`,
              answer: 0.788 + 0.121,
              tol: 0.0005,
              wrong: [{ v: 0.718 + 0.281, tol: 0.0005, why: 'Don’t split the number down the middle: x takes the 1st, 3rd and 5th digits.' }],
              hint: 'Digits 1, 3, 5 → x; digits 2, 4, 6 → y.',
              explain: r`$x$ takes digits 7, 8, 8 and $y$ takes 1, 2, 1: $x = 0.788$, $y = 0.121$, so $x + y = 0.909$.`,
            },
          ],
          recap: [
            'A segment, a line, a square and even a cube all have the same number of points.',
            'Interleaving digits pairs points of a square with points of a segment.',
            'Dimension is about arrangement (continuity), not about how many points there are.',
          ],
        },
        {
          id: 'cantorset',
          title: 'The Cantor Set',
          summary: 'Dust with no length, and uncountably many points',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Remove the middle thirds',
              body: r`Start with the interval from 0 to 1. Remove its open middle third, leaving two pieces. Remove the middle third of each, leaving four. Repeat forever. What's left is the **Cantor set** (1883).`,
              widget: {
                kind: 'graph', xmin: -0.03, xmax: 1.03, ymin: -0.5, ymax: 8, grid: false, axes: false, height: 260,
                params: { n: { min: 0, max: 7, step: 1, value: 3, label: 'steps', color: 'violet' } },
                extra: ({ plot, p, s }) => { const els = []; let segs = [[0, 1]]; for (let k = 0; k <= p.n; k++) { const y = 7.2 - k; for (const [a, b] of segs) els.push(s('rect', { x: plot.X(a), y: plot.Y(y + 0.45), width: Math.max(0.8, plot.X(b) - plot.X(a)), height: plot.Y(0) - plot.Y(0.45), class: k === p.n ? 'fl-violet' : 'fl-violet-soft' })); segs = segs.flatMap(([a, b]) => [[a, a + (b - a) / 3], [b - (b - a) / 3, b]]); } return els; },
                readout: (p) => `${2 ** p.n} pieces, each of length $1/${3 ** p.n}$ · total length $(2/3)^{${p.n}} = ${(2 / 3) ** p.n < 0.01 ? ((2 / 3) ** p.n).toFixed(4) : ((2 / 3) ** p.n).toFixed(3)}$`,
              },
              after: r`The pieces double in number but shrink to a third each time, so the total length is multiplied by $\frac23$ at every step and tends to **zero**. Yet infinitely many points survive forever, such as 0, 1, $\frac13$ and $\frac23$.`,
            },
            {
              type: 'numeric',
              title: 'Vanishing length',
              prompt: r`How much total length remains after 10 steps? (4 decimal places.)`,
              answer: (2 / 3) ** 10,
              tol: 0.0001,
              wrong: [{ v: (1 / 3) ** 10, tol: 0.00001, why: r`Each step **keeps** two thirds: $(2/3)^{10}$.` }],
              explain: r`$\left(\frac23\right)^{10} \approx 0.0173$. After 100 steps it's about $2.5 \times 10^{-18}$. In the limit the Cantor set has **measure zero**: it takes up no length at all.`,
            },
            {
              type: 'interactive',
              title: 'Which points survive?',
              body: r`Write numbers in **base 3** (digits 0, 1, 2). Removing middle thirds deletes exactly the numbers that need a digit 1. Find a point in the Cantor set that is **not** an endpoint of any removed interval (endpoints have ternary expansions that end).`,
              widget: {
                kind: 'graph', xmin: -0.03, xmax: 1.03, ymin: -0.6, ymax: 1, grid: false, axes: false, height: 160,
                params: { x: { min: 0, max: 1, step: 0.001, value: 0.5, label: '$x$', color: 'coral', format: (v) => v.toFixed(3) } },
                extra: ({ plot, p, s }) => { const els = []; let segs = [[0, 1]]; for (let k = 0; k < 6; k++) segs = segs.flatMap(([a, b]) => [[a, a + (b - a) / 3], [b - (b - a) / 3, b]]); for (const [a, b] of segs) els.push(s('rect', { x: plot.X(a), y: plot.Y(0.25), width: Math.max(0.8, plot.X(b) - plot.X(a)), height: plot.Y(0) - plot.Y(0.25), class: 'fl-violet' })); els.push(s('line', { x1: plot.X(p.x), x2: plot.X(p.x), y1: plot.Y(-0.4), y2: plot.Y(0.7), stroke: 'var(--coral)', 'stroke-width': 3 })); return els; },
                readout: (p) => { const t = ternary(p.x); return `${p.x.toFixed(3)} in base 3: 0.${t}… · ${inCantor(p.x) ? '**in the Cantor set**' : 'removed (needs a 1)'}`; },
                goal: (p) => Math.abs(p.x - 0.25) < 1e-9 || Math.abs(p.x - 0.75) < 1e-9,
                hint: 'Try one quarter.',
                solution: { x: 0.25 },
              },
              explain: r`$\frac14 = 0.020202\ldots_3$: only 0s and 2s, so it survives every step, yet it's never the end of a removed interval (its expansion never ends). Similarly $\frac34 = 0.202020\ldots_3$. Most points of the Cantor set are like this.`,
            },
            {
              type: 'mcq',
              title: 'How many points?',
              prompt: r`The Cantor set has no length. How many points does it contain?`,
              choices: [
                { t: 'Uncountably many: as many as the whole interval', ok: true },
                { t: 'Countably many: just the endpoints', why: 'Points like 1/4 aren’t endpoints. And there are far more of them.' },
                { t: 'Finitely many', why: 'Each step keeps infinitely many points, and so does the limit.' },
              ],
              explain: r`Its points are the ternary expansions using only 0s and 2s. Swap every 2 for a 1 and you get **every** binary sequence, which is uncountable, as many as all real numbers. A set with zero length can still be as big as the continuum.`,
            },
            {
              type: 'mcq',
              title: 'Is ½ in the Cantor set?',
              prompt: r`The Cantor set keeps numbers whose base-3 expansion can be written with only 0s and 2s. In base 3, $\frac12 = 0.111\ldots$ Is $\frac12$ in the Cantor set?`,
              choices: [
                { t: r`No: it lies in the very first middle third that is removed`, ok: true },
                { t: r`Yes: it is the centre of the interval, so it is special`, why: r`Being the centre is exactly the problem: the first step removes the whole middle third, $(\frac13, \frac23)$.` },
                { t: r`Yes: it survives because $0.111\ldots_3$ could be rewritten with 2s`, why: r`Only expansions ending in all 2s or all 0s have a second form (like $0.1_3 = 0.0222\ldots_3$). $0.111\ldots_3$ has no other form, so it needs a 1.` },
              ],
              explain: r`$\frac13 < \frac12 < \frac23$, so $\frac12$ disappears at the first step. In base 3 its only expansion is $0.111\ldots$, full of 1s. Contrast $\frac13 = 0.1_3 = 0.0222\ldots_3$, which can be written without 1s and survives as an endpoint.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A fractional dimension',
              prompt: r`Shrinking the Cantor set by a factor of 3 gives a copy of one of its 2 halves. For a shape made of $N$ copies of itself scaled by $\frac1s$, the dimension $d$ satisfies $s^d = N$. Find the Cantor set's dimension. (3 decimal places.)`,
              lhs: r`$d =$`,
              answer: Math.log(2) / Math.log(3),
              tol: 0.001,
              wrong: [{ v: 2 / 3, tol: 0.001, why: r`Solve $3^d = 2$: $d = \frac{\ln 2}{\ln 3}$.` }],
              hint: r`$d = \dfrac{\ln 2}{\ln 3}$.`,
              explain: r`$d = \frac{\ln 2}{\ln 3} \approx 0.631$: more than a scattering of points (dimension 0), less than a line (dimension 1). The Cantor set was one of the first **fractals**, decades before the word existed.`,
            },
          ],
          recap: [
            'Removing middle thirds forever leaves the Cantor set: total length zero.',
            'Its points are base-3 expansions with only 0s and 2s, and they are uncountable.',
            r`Its fractal dimension is $\ln 2/\ln 3 \approx 0.63$.`,
          ],
        },
        {
          id: 'cover-rationals',
          title: 'Covering the Rationals',
          summary: 'Dense, yet taking up no room',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Everywhere, but nowhere',
              body: r`The rational numbers are **dense**: between any two real numbers there are infinitely many fractions. You might think they fill most of the number line. Yet they take up **no length at all**.

The trick uses the fact that the rationals are countable: list them as $q_1, q_2, q_3, \dots$ Cover $q_1$ with an interval of length $\frac{\varepsilon}{2}$, $q_2$ with one of length $\frac{\varepsilon}{4}$, $q_3$ with $\frac{\varepsilon}{8}$, and so on. Every rational is covered, and the total length is at most $\varepsilon$, however small you choose it.`,
            },
            {
              type: 'numeric',
              title: 'Adding the covers',
              prompt: r`With $\varepsilon = 0.01$, what is the total length $\frac{\varepsilon}{2} + \frac{\varepsilon}{4} + \frac{\varepsilon}{8} + \cdots$?`,
              answer: 0.01,
              tol: 0.00001,
              explain: r`It’s a geometric series: $\varepsilon\left(\frac12 + \frac14 + \cdots\right) = \varepsilon = 0.01$. Every rational number fits inside intervals of total length one hundredth.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Shrinking covers',
              body: r`The rationals between 0 and 1 are listed by denominator: $\frac12, \frac13, \frac23, \frac14, \frac34, \frac15, \dots$ Each gets a cover half as long as the one before. Change $\varepsilon$ and how many rationals are covered.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1.1, grid: false, height: 240, axes: { xticks: 0.1, yticks: 10 },
                params: { e: { min: 0.01, max: 1, step: 0.01, value: 0.5, label: 'total budget ε', color: 'coral', format: (v) => v.toFixed(2) }, N: { min: 1, max: 40, step: 1, value: 12, label: 'rationals covered', color: 'violet' } },
                extra: ({ plot, p, s }) => { const Q = []; for (let d = 2; Q.length < 40; d++) for (let n = 1; n < d && Q.length < 40; n++) { let a = n, b = d; while (b) [a, b] = [b, a % b]; if (a === 1) Q.push([n, d]); } return Q.slice(0, p.N).flatMap(([n, d], k) => { const q = n / d, L = p.e / 2 ** (k + 1), y = 0.08 + (k % 10) * 0.1; return [s('rect', { x: plot.X(Math.max(0, q - L / 2)), y: plot.Y(y + 0.035), width: Math.max(1, plot.X(Math.min(1, q + L / 2)) - plot.X(Math.max(0, q - L / 2))), height: plot.Y(0) - plot.Y(0.07), rx: 2, class: 'fl-coral' }), s('circle', { cx: plot.X(q), cy: plot.Y(y), r: 2.5, class: 'fl-ink' })]; }); },
                readout: (p) => `${p.N} rationals covered · total cover length **${(p.e * (1 - 2 ** -p.N)).toFixed(4)}** (never more than ε = ${p.e.toFixed(2)})`,
              },
              after: r`The first covers are visible, but by the 20th the bars are thinner than a millionth of the budget. Carry on forever and every fraction is covered, with total length below $\varepsilon$. Since $\varepsilon$ can be as small as we like, the rationals have **measure zero**.`,
            },
            {
              type: 'mcq',
              title: 'A random number',
              prompt: r`Pick a real number between 0 and 1 "uniformly at random". What is the probability that it is rational?`,
              choices: [
                { t: 'Zero', ok: true },
                { t: 'One half', why: 'There are infinitely many of each, but the rationals are countable and the irrationals are not.' },
                { t: 'It can’t be determined', why: 'It can: the rationals fit inside sets of arbitrarily small length, so the probability is 0.' },
              ],
              explain: r`For a uniform random number, probability equals length, and the rationals have total length 0. Almost every real number is irrational, even though rationals are found in every interval.`,
            },
            {
              type: 'numeric',
              title: 'Small denominators',
              prompt: r`How many fractions in lowest terms lie strictly between 0 and 1 with denominator at most 5?`,
              answer: 9,
              hint: r`$\frac12$; $\frac13, \frac23$; $\frac14, \frac34$; $\frac15, \dots, \frac45$.`,
              explain: r`$1 + 2 + 2 + 4 = 9$ (in general, Euler’s totient function counts them for each denominator). Listing denominator by denominator, every rational eventually appears: that’s why they are countable.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Size versus length',
              prompt: r`The Cantor set is **uncountable** (as big as the real line) yet also has total length zero. What does this show?`,
              choices: [
                { t: 'Countability and length (measure) are different ideas: a set can be huge in one sense and tiny in the other', ok: true },
                { t: 'Uncountable sets always have positive length', why: 'The Cantor set is the counterexample.' },
                { t: 'The Cantor set must be countable after all', why: 'Cantor’s diagonal argument works for it too, using base-3 expansions.' },
              ],
              explain: r`Countable sets always have measure zero, but measure zero sets need not be countable. "How many" and "how much room" are genuinely different questions about infinite sets.`,
            },
          ],
          recap: [
            'The rationals are dense, but can be covered by intervals of total length ε for any ε.',
            'So they have measure zero: a random real is irrational with probability 1.',
            'Countability and measure are different notions of size.',
          ],
        },
      ],
    },
  ],
};

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
