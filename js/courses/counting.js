const r = String.raw;
const C = (n, k) => { if (k < 0 || k > n) return 0; let x = 1; for (let i = 1; i <= k; i++) x = (x * (n - k + i)) / i; return Math.round(x); };
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

// derangements: D(n) = n! Σ (−1)^k / k!
const derange = (n) => { let d = 1; for (let i = 1; i <= n; i++) d = i * d + (i % 2 ? -1 : 1); return d; };

export default {
  id: 'counting',
  subject: 'math',
  title: 'Counting & Combinatorics',
  level: 'Intermediate',
  cover: 'counting',
  tagline: 'Arrangements, selections, Pascal’s triangle, overlaps and pigeonholes: counting without listing.',
  description: r`How many passwords? How many poker hands? How many ways to share out sweets? Learn the multiplication principle, permutations and combinations, the hidden patterns of Pascal's triangle, inclusion–exclusion (and why 1/e appears in Secret Santa), and the pigeonhole principle.`,
  chapters: [
    {
      title: 'Counting Principles',
      summary: 'Multiply choices, arrange things in order.',
      lessons: [
        {
          id: 'multiply',
          title: 'The Multiplication Principle',
          summary: 'Choices multiply',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Outfits',
              prompt: 'You have 3 shirts, 4 pairs of trousers and 2 pairs of shoes. How many different outfits can you make?',
              answer: 24,
              wrong: [{ v: 9, why: r`Adding counts the items, not the combinations. Every shirt goes with every pair of trousers: multiply.` }],
              explain: r`Each of the 3 shirts pairs with each of the 4 trousers (12 combinations), and each of those with each of the 2 shoes: $3 \times 4 \times 2 = 24$.`,
            },
            {
              type: 'explain',
              title: 'The multiplication principle',
              body: r`::: key
If one choice can be made in $a$ ways and, for each of those, a second choice can be made in $b$ ways, then together there are $a \times b$ ways.
:::

Picture a tree: 3 branches, each splitting into 4, each splitting into 2, gives 24 leaves.`,
            },
            {
              type: 'numeric',
              title: 'Licence plates',
              prompt: 'A licence plate has 3 letters (A–Z) followed by 3 digits (0–9). How many different plates are possible?',
              answer: 26 ** 3 * 1000,
              wrong: [{ v: 26 * 3 + 30, why: 'Multiply the choices for each position: 26 × 26 × 26 × 10 × 10 × 10.' }, { v: 78 * 30, why: 'Each position is its own choice. Multiply all six.' }],
              explain: r`$26^3 \times 10^3 = 17{,}576 \times 1000 = 17{,}576{,}000$.`,
            },
            {
              type: 'mcq',
              title: 'Or, not and',
              prompt: r`A café offers 3 soups **or** 4 salads as a starter (you pick one starter). How many choices of starter are there?`,
              cols: 2,
              choices: [
                { t: '7', ok: true },
                { t: '12', why: 'Multiply when you make one choice **and** another. Here you pick a soup **or** a salad, so add.' },
              ],
              explain: r`Choices made **in sequence** multiply; alternatives that **exclude each other** add: $3 + 4 = 7$. That's the **addition principle**, the multiplication principle's partner.`,
            },
            {
              type: 'numeric',
              title: 'Optional dessert',
              prompt: r`The café also has 4 mains and 2 desserts, and dessert is optional. A meal is one starter, one main, and a dessert or no dessert. How many different meals are there?`,
              answer: 7 * 4 * 3,
              wrong: [{ v: 7 * 4 * 2, why: '“No dessert” is a third option for the dessert course.' }],
              explain: r`Starter: 7, main: 4, dessert: 2 + 1 ("none") = 3. Total $7 \times 4 \times 3 = 84$. Treating "nothing" as an option is a useful trick.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A trillion passwords',
              prompt: r`A password uses only lowercase letters (26 choices per character). Find the **shortest** length that gives at least a trillion ($10^{12}$) possible passwords.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 14, ymin: 0, ymax: 20, grid: 1, gridY: 2, height: 260, axes: { xlabel: 'password length', ylabel: 'log₁₀(number of passwords)' },
                params: { L: { min: 1, max: 14, step: 1, value: 4, slider: false } },
                curves: [{ f: (x) => x * Math.log10(26), color: 'violet', width: 3 }, { f: () => 12, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.L, y: (p) => p.L * Math.log10(26), drag: { x: 'L' }, color: 'coral' }],
                readout: (p) => r`length ${p.L}: $26^{${p.L}} \approx ${(26 ** p.L).toExponential(2).replace('e+', '\\times 10^{') + '}'}$ passwords`,
                goal: (p) => 26 ** p.L >= 1e12 && 26 ** (p.L - 1) < 1e12,
                hint: r`$26^8 \approx 2 \times 10^{11}$. One more letter multiplies by 26.`,
                solution: { L: 9 },
              },
              explain: r`$26^9 \approx 5.4 \times 10^{12}$, while $26^8 \approx 2.1 \times 10^{11}$ falls short. Each extra character multiplies the count by 26, which is why length matters more than complexity for password strength.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Password strength',
              prompt: r`How many times more 8-character passwords are there if each character can be any of 62 symbols (a–z, A–Z, 0–9), compared with lowercase letters only? Give the answer rounded to the nearest whole number.`,
              answer: Math.round((62 / 26) ** 8),
              tol: 1,
              wrong: [{ v: Math.round(62 / 26), why: r`Each of the 8 positions gains options, so the ratio is $(62/26)^8$.` }],
              explain: r`$\frac{62^8}{26^8} = \left(\frac{62}{26}\right)^8 \approx 2.385^8 \approx 1046$. Mixing cases and digits makes an 8-character password about a thousand times harder to brute-force.`,
            },
          ],
          recap: [
            'Independent choices multiply.',
            r`$k$ positions with $n$ options each give $n^k$ possibilities.`,
            'Small increases per position compound enormously.',
          ],
        },
        {
          id: 'permutations',
          title: 'Arrangements',
          summary: 'Permutations and factorials',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Line them up',
              prompt: 'In how many different orders can 4 friends stand in a line for a photo?',
              answer: 24,
              wrong: [{ v: 16, why: r`It's not $4 \times 4$: once someone is placed, they can't be chosen again. $4 \times 3 \times 2 \times 1$.` }, { v: 4, why: 'Each position has a choice of the remaining people.' }],
              explain: r`4 choices for the first spot, then 3, then 2, then 1: $4 \times 3 \times 2 \times 1 = 24$.`,
            },
            {
              type: 'explain',
              title: 'Factorials',
              body: r`The number of ways to arrange $n$ distinct things in a row is
$$n! = n \times (n-1) \times \cdots \times 2 \times 1$$
(read "$n$ factorial"). By convention, $0! = 1$.

Factorials grow astonishingly fast: $10! = 3{,}628{,}800$, and a shuffled deck of cards has $52! \approx 8 \times 10^{67}$ possible orders. Almost certainly, no two well-shuffled decks in history have ever been in the same order.`,
            },
            {
              type: 'numeric',
              title: 'Podium',
              body: r`When you only arrange $k$ out of $n$ things, there are $n \times (n-1) \times \cdots$ ($k$ factors) $= \frac{n!}{(n-k)!}$ ways.`,
              prompt: 'Eight runners race. How many different ways can the gold, silver and bronze medals be awarded?',
              answer: 336,
              wrong: [{ v: 512, why: r`The same runner can't win two medals: $8 \times 7 \times 6$.` }, { v: 56, why: r`Order matters here (gold ≠ silver), so it's $8 \times 7 \times 6$, not $\binom{8}{3}$.` }],
              explain: r`$8 \times 7 \times 6 = 336$.`,
            },
            {
              type: 'numeric',
              title: 'Stuck together',
              prompt: r`In how many ways can 5 different books be arranged on a shelf if two particular books must stand next to each other?`,
              answer: 48,
              wrong: [{ v: 24, why: 'Glue the pair into one block (4! arrangements), but the pair itself can be in 2 orders.' }, { v: 120, why: 'That’s all arrangements, without the restriction.' }],
              explain: r`Treat the pair as one block: $4! = 24$ arrangements of the 4 units, times 2 orders within the block: $48$.`,
            },
            {
              type: 'numeric',
              title: 'Round the table',
              prompt: r`In how many ways can 6 people sit around a round table, if only who sits next to whom matters (rotating everyone counts as the same seating)?`,
              answer: 120,
              wrong: [{ v: 720, why: 'That counts each seating 6 times, once for every rotation.' }],
              explain: r`$\frac{6!}{6} = 5! = 120$. Equivalently, fix one person's seat and arrange the other 5 around them.`,
            },
            {
              type: 'interactive',
              title: 'A million seatings',
              body: r`With $n$ people there are $n!$ ways to line them up, but only $(n-1)!$ different round-table seatings, because rotating everyone gives the same seating. Find the **smallest** party with more than a million different round-table seatings.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5, grid: false, axes: false, maxWidth: 320,
                params: { n: { min: 3, max: 13, step: 1, value: 6, label: 'people', color: 'violet' } },
                extra: ({ plot, p, s }) => { const out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(0.75) - plot.X(0), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2 })]; for (let i = 0; i < p.n; i++) { const a = Math.PI / 2 - (2 * Math.PI * i) / p.n, x = 1.08 * Math.cos(a), y = 1.08 * Math.sin(a); out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 15, class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 2 }), s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink)', text: String.fromCharCode(65 + i) })); } return out; },
                readout: (p) => { let f = 1; for (let k = 2; k < p.n; k++) f *= k; return `in a line: ${(f * p.n).toLocaleString('en-US')} · round the table: **${f.toLocaleString('en-US')}**`; },
                goal: (p) => p.n === 11,
                hint: 'You need the first n with (n − 1)! above 1,000,000.',
                solution: { n: 11 },
              },
              explain: r`With 10 people there are $9! = 362{,}880$ seatings; with **11** there are $10! = 3{,}628{,}800$. Each round-table seating corresponds to exactly $n$ line-ups (cut the circle at any of the $n$ seats), which is why we divide $n!$ by $n$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Repeated letters',
              prompt: 'How many different arrangements are there of the letters in BANANA?',
              answer: 60,
              wrong: [{ v: 720, why: r`$6! = 720$ treats the three A's (and two N's) as different. Swapping identical letters gives the same word.` }, { v: 120, why: r`Divide by $3!$ for the A's **and** by $2!$ for the N's.` }],
              explain: r`$\frac{6!}{3!\,2!} = \frac{720}{6 \times 2} = 60$. Divide out the rearrangements of identical letters.`,
            },
          ],
          recap: [
            r`$n!$ ways to arrange $n$ distinct items in a row.`,
            r`Arranging $k$ of $n$: $\frac{n!}{(n-k)!}$.`,
            'Divide by the factorials of repeated items.',
          ],
        },
      ],
    },
    {
      title: 'Choosing',
      summary: 'Combinations and Pascal’s triangle.',
      lessons: [
        {
          id: 'combinations',
          title: 'Combinations',
          summary: 'When order doesn’t matter',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Order or not?',
              prompt: 'Choosing a 3-person committee from 8 people. Does picking (Ana, Ben, Cy) differ from picking (Cy, Ana, Ben)?',
              cols: 2,
              choices: [
                { t: 'No: it’s the same committee', ok: true },
                { t: 'Yes', why: 'A committee is just a group: the order you picked them in doesn’t matter.' },
              ],
              explain: r`It's the same group. Counting ordered picks ($8 \times 7 \times 6 = 336$) counts each committee $3! = 6$ times, once for each ordering. So there are $336 / 6 = 56$ committees.`,
            },
            {
              type: 'explain',
              title: 'n choose k',
              body: r`The number of ways to choose $k$ items from $n$, when order doesn't matter, is
$$\binom{n}{k} = \frac{n!}{k!\,(n-k)!}$$
read "$n$ choose $k$". It's the ordered count divided by the $k!$ orderings of each group.`,
            },
            {
              type: 'numeric',
              title: 'Lottery',
              prompt: r`A lottery draws 6 numbers from 1 to 49, and order doesn't matter. How many possible tickets are there?`,
              answer: C(49, 6),
              wrong: [{ v: 49 * 48 * 47 * 46 * 45 * 44, why: r`That counts ordered draws. Divide by $6!$.` }],
              explain: r`$\binom{49}{6} = \frac{49 \times 48 \times 47 \times 46 \times 45 \times 44}{720} = 13{,}983{,}816$. Your chance with one ticket is about 1 in 14 million.`,
            },
            {
              type: 'numeric',
              title: 'Handshakes',
              prompt: 'Ten people each shake hands with everyone else exactly once. How many handshakes happen?',
              answer: 45,
              wrong: [{ v: 90, why: r`Each handshake involves 2 people, so $10 \times 9$ counts each one twice.` }, { v: 100, why: 'People don’t shake their own hands, and each handshake shouldn’t be counted twice.' }],
              explain: r`Each handshake is a pair of people: $\binom{10}{2} = \frac{10 \times 9}{2} = 45$.`,
            },
            {
              type: 'interactive',
              title: 'Everyone meets everyone',
              body: r`Each line is one handshake. With $n$ people, each shakes $n - 1$ hands, and every handshake involves two people, so there are $\binom{n}{2} = \frac{n(n-1)}{2}$. Find the group that makes exactly **66** handshakes.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 320,
                params: { n: { min: 2, max: 16, step: 1, value: 5, label: 'people', color: 'teal' } },
                extra: ({ plot, p, s }) => { const pt = (i) => { const a = Math.PI / 2 - (2 * Math.PI * i) / p.n; return [Math.cos(a), Math.sin(a)]; }; const out = []; for (let i = 0; i < p.n; i++) for (let j = i + 1; j < p.n; j++) { const [x1, y1] = pt(i), [x2, y2] = pt(j); out.push(s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), stroke: 'var(--teal)', 'stroke-width': 1.2, opacity: 0.6 })); } for (let i = 0; i < p.n; i++) { const [x, y] = pt(i); out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 7, class: 'fl-coral' })); } return out; },
                readout: (p) => `${p.n} people · each shakes ${p.n - 1} hands · **${(p.n * (p.n - 1)) / 2} handshakes**`,
                goal: (p) => p.n === 12,
                hint: 'Solve n(n − 1)/2 = 66, so n(n − 1) = 132.',
                solution: { n: 12 },
              },
              explain: r`$12 \times 11 / 2 = 66$. Counting each person’s handshakes gives $12 \times 11 = 132$, but that counts every handshake twice, once from each end. Dividing by the overcount is the heart of $\binom{n}{k}$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Poker',
              prompt: 'How many 5-card poker hands can be dealt from a standard 52-card deck?',
              answer: C(52, 5),
              wrong: [{ v: 52 * 51 * 50 * 49 * 48, why: r`Hands are unordered. Divide by $5! = 120$.` }],
              explain: r`$\binom{52}{5} = 2{,}598{,}960$. Of those, only 4 are royal flushes, so the chance of being dealt one is about 1 in 650,000.`,
            },
          ],
          recap: [
            r`$\binom{n}{k} = \frac{n!}{k!(n-k)!}$ counts unordered selections.`,
            'Ask "does order matter?" If not, divide out the orderings.',
            r`$\binom{n}{2} = \frac{n(n-1)}{2}$ counts pairs.`,
          ],
        },
        {
          id: 'pascal',
          title: 'Pascal’s Triangle',
          summary: 'A triangle full of patterns',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Build the triangle',
              body: r`Start with a 1 at the top. Each number is the sum of the two numbers above it. The entry $k$ places along row $n$ is exactly $\binom{n}{k}$.`,
              widget: {
                kind: 'graph', xmin: -9, xmax: 9, ymin: -9.5, ymax: 0.8, grid: false, axes: false, height: 400,
                params: { n: { min: 1, max: 9, step: 1, value: 5, label: 'rows', color: 'violet', format: (v) => `${v + 1}` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let n = 0; n <= p.n; n++) {
                    for (let k = 0; k <= n; k++) {
                      const x = -n + 2 * k, y = -n;
                      const v = C(n, k);
                      els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 16, class: n === p.n ? 'fl-violet-soft' : 'fl-card', stroke: n === p.n ? 'var(--violet)' : 'var(--line-2)', 'stroke-width': 1.5 }));
                      els.push(s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', class: 'lbl', style: `font-size:max(calc(${v > 99 ? 11 : 13}px * var(--fs, 1)), var(--fmin, 0px))`, text: String(v) }));
                    }
                  }
                  return els;
                },
                readout: (p) => r`row ${p.n} adds up to $2^{${p.n}} = ${2 ** p.n}$`,
              },
              after: r`Each row adds up to a power of 2. Why? Choosing any subset of $n$ items means deciding in or out for each one: $2^n$ ways.`,
            },
            {
              type: 'mcq',
              title: 'Why the sums work',
              prompt: r`Why does $\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}$ (each entry is the sum of the two above it)?`,
              choices: [
                { t: 'Pick one special item: either it’s in your group (choose k−1 others) or it isn’t (choose k from the rest)', ok: true },
                { t: 'It’s just a coincidence that holds for small numbers', why: 'It holds for every n and k, and there’s a lovely reason.' },
                { t: 'Because factorials always add like that', why: 'It can be shown with factorials, but there’s a clearer counting reason.' },
              ],
              explain: r`Fix one particular item. Groups of size $k$ either include it (then choose $k - 1$ more from the other $n - 1$) or exclude it (then choose all $k$ from the other $n - 1$). These two cases don't overlap and cover everything.`,
            },
            {
              type: 'explain',
              title: 'The binomial theorem',
              body: r`Pascal's triangle also gives the coefficients when you expand powers:
$$(a + b)^n = \sum_{k=0}^n \binom{n}{k} a^{n-k} b^k$$
For example, $(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$, using row 3: 1, 3, 3, 1. Each term counts the ways to pick $b$ from $k$ of the $n$ brackets.`,
            },
            {
              type: 'numeric',
              title: 'Expand',
              prompt: r`What is the coefficient of $x^2$ in $(1 + x)^5$?`,
              answer: 10,
              wrong: [{ v: 5, why: r`That's the coefficient of $x$. For $x^2$ use $\binom52$.` }, { v: 25, why: r`$\binom{5}{2} = \frac{5 \times 4}{2} = 10$.` }],
              explain: r`$\binom{5}{2} = 10$. Row 5 is 1, 5, 10, 10, 5, 1, so $(1 + x)^5 = 1 + 5x + 10x^2 + 10x^3 + 5x^4 + x^5$.`,
            },
            {
              type: 'numeric',
              title: 'Read the triangle',
              prompt: r`The entry in row 10, position 3 of Pascal’s triangle (counting from 0) is $\binom{10}{3}$. What is it?`,
              answer: 120,
              explain: r`$\binom{10}{3} = \frac{10 \times 9 \times 8}{3 \times 2 \times 1} = 120$: the number of ways to choose 3 things from 10, and the coefficient of $x^3$ in $(1 + x)^{10}$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Grid paths',
              body: r`You walk from the bottom-left corner of a grid to the top-right corner, moving only right or up along the grid lines.`,
              prompt: 'How many different shortest routes are there across a 4 × 3 grid (4 steps right, 3 steps up)?',
              answer: C(7, 3),
              wrong: [{ v: 12, why: r`Every route is a sequence of 7 moves, 3 of them "up". Choose which 3: $\binom{7}{3}$.` }, { v: 5040, why: r`$7!$ treats every move as different. The right moves are identical to each other, and so are the up moves.` }],
              explain: r`Every shortest route is a string of 4 R's and 3 U's in some order. Choose positions for the 3 U's among 7: $\binom{7}{3} = 35$. That's also an entry in Pascal's triangle, and for a good reason: to reach any corner, you must come from the corner to the left or the corner below, and you add those counts, just like the triangle's rule.`,
            },
          ],
          recap: [
            r`Pascal's triangle: each entry is the sum of the two above, and the entries are $\binom{n}{k}$.`,
            r`Row $n$ sums to $2^n$. The binomial theorem uses the rows as coefficients.`,
            r`Grid paths: $\binom{\text{total steps}}{\text{up steps}}$.`,
          ],
        },
        {
          id: 'stars-bars',
          title: 'Stars & Bars',
          summary: 'Sharing things out',
          icon: 'star',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Sweets',
              prompt: 'In how many ways can you give 5 identical sweets to 3 children (some children may get none)?',
              answer: 21,
              wrong: [{ v: 243, why: r`$3^5$ treats the sweets as different. They're identical: only how many each child gets matters.` }, { v: 10, why: r`Try the stars and bars idea on the next screen. The answer is $\binom{7}{2}$.` }],
              hint: 'Line up the 5 sweets and place 2 dividers to split them into 3 groups.',
              explain: r`Line up 5 stars (sweets) and 2 bars (dividers): for example ★★|★|★★ means 2, 1, 2. Every arrangement of 5 stars and 2 bars is one way to share them out. Choose positions for the 2 bars among 7 spots: $\binom{7}{2} = 21$.`,
            },
            {
              type: 'explain',
              title: 'Stars and bars',
              body: r`To split $n$ identical items among $k$ people (any number each, including zero), arrange $n$ stars and $k - 1$ bars in a row:
$$\binom{n + k - 1}{k - 1}$$
If everyone must get at least one, hand out one each first, then share out the remaining $n - k$.`,
            },
            {
              type: 'numeric',
              title: 'At least one each',
              prompt: 'In how many ways can you share 10 identical coins among 4 people so that each person gets at least one?',
              answer: C(9, 3),
              wrong: [{ v: C(13, 3), why: 'That allows people to get zero. Give one coin to each person first, then share out the remaining 6.' }],
              explain: r`Give 1 to each person (4 coins), leaving 6 to share freely among 4: $\binom{6 + 3}{3} = \binom{9}{3} = 84$.`,
            },
            {
              type: 'numeric',
              title: 'Ice-cream scoops',
              prompt: r`A cone holds 3 scoops, chosen from 5 flavours; repeats are allowed and the order of scoops doesn't matter. How many different cones are there?`,
              answer: C(7, 3),
              wrong: [{ v: 125, why: r`$5^3$ treats the order of scoops as important.` }, { v: C(5, 3), why: 'That forbids repeated flavours.' }],
              hint: 'Think of distributing 3 identical scoops among 5 flavours.',
              explain: r`Choosing 3 scoops with repetition from 5 flavours is sharing 3 stars among 5 flavours: $\binom{3 + 4}{4} = 35$.`,
            },
            {
              type: 'mcq',
              title: 'When does it apply?',
              prompt: r`Which problem is **not** a stars-and-bars problem?`,
              choices: [
                { t: 'Giving 5 different prizes to 3 people', ok: true },
                { t: 'Splitting 5 identical sweets among 3 children', why: 'This is the classic stars-and-bars problem.' },
                { t: 'Counting solutions of a + b + c = 5 in whole numbers ≥ 0', why: 'This is the same as sharing 5 identical sweets.' },
              ],
              explain: r`Stars and bars needs **identical** items. Different prizes can each go to any of 3 people independently: $3^5 = 243$ ways, by the multiplication principle.`,
            },
            {
              type: 'interactive',
              title: 'Place the bars',
              body: r`Seven identical sweets go to three children. Two bars cut the row of stars into three groups: stars before the first bar go to Ana, between the bars to Ben, after the second bar to Cat. Place the bars so that **Ana gets 2, Ben gets 0 and Cat gets 5**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 9, ymin: 0, ymax: 2, grid: false, axes: false, maxWidth: 520, height: 140,
                params: { b1: { min: 0, max: 7, step: 1, value: 3, label: 'first bar', color: 'ink', format: (v) => `after ${v} stars` }, b2: { min: 0, max: 7, step: 1, value: 5, label: 'second bar', color: 'ink', format: (v) => `after ${v} stars` } },
                extra: ({ plot, p, s }) => { const lo = Math.min(p.b1, p.b2), hi = Math.max(p.b1, p.b2), seq = []; for (let k = 0; k < 7; k++) { if (k === lo) seq.push('|'); if (k === hi) seq.push('|'); seq.push(k < lo ? 'coral' : k < hi ? 'teal' : 'violet'); } while (seq.length < 9) seq.push('|'); return seq.map((c, i) => c === '|' ? s('line', { x1: plot.X(i + 0.5), x2: plot.X(i + 0.5), y1: plot.Y(0.3), y2: plot.Y(1.7), stroke: 'var(--ink)', 'stroke-width': 5, 'stroke-linecap': 'round' }) : s('text', { x: plot.X(i + 0.5), y: plot.Y(1) + 14, 'text-anchor': 'middle', style: 'font-size:40px', fill: `var(--${c})`, text: '★' })); },
                readout: (p) => { const lo = Math.min(p.b1, p.b2), hi = Math.max(p.b1, p.b2); return `Ana **${lo}** · Ben **${hi - lo}** · Cat **${7 - hi}**`; },
                goal: (p) => Math.min(p.b1, p.b2) === 2 && Math.max(p.b1, p.b2) === 2,
                hint: 'Ben gets nothing, so the two bars must sit side by side.',
                solution: { b1: 2, b2: 2 },
              },
              explain: r`Two bars next to each other give Ben nothing. Every row of 7 stars and 2 bars is one way to share the sweets, and every sharing is one row, so the count is the number of ways to choose where the 2 bars go among 9 places: $\binom{9}{2} = 36$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Dice sums',
              prompt: r`How many solutions in non-negative whole numbers does $x + y + z = 10$ have?`,
              answer: C(12, 2),
              wrong: [{ v: C(10, 2), why: r`Stars and bars: 10 stars and 2 bars make 12 positions, so $\binom{12}{2}$.` }],
              explain: r`10 stars and 2 bars: $\binom{12}{2} = 66$ solutions.`,
            },
          ],
          recap: [
            r`$n$ identical items among $k$ people: $\binom{n+k-1}{k-1}$.`,
            'For “at least one each”, give one to everyone first.',
            'Many counting problems become “arrange some symbols in a row”.',
          ],
        },
      ],
    },
    {
      title: 'Clever Counting',
      summary: 'Overlaps and guarantees.',
      lessons: [
        {
          id: 'inclusion',
          title: 'Inclusion–Exclusion',
          summary: 'Correcting for overlaps',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Don’t count twice',
              body: r`How many numbers from 1 to 100 are divisible by 2 **or** 3? There are 50 multiples of 2 and 33 of 3, but $50 + 33$ counts the multiples of 6 twice. Subtract them once:
$$|A \cup B| = |A| + |B| - |A \cap B|$$
This is the **inclusion–exclusion principle**.`,
              widget: {
                kind: 'figure', w: 420, h: 200, maxWidth: 380, label: 'Two overlapping sets',
                draw: ({ s }) => [
                  s('circle', { cx: 160, cy: 100, r: 80, class: 'fl-blue', opacity: 0.35 }),
                  s('circle', { cx: 260, cy: 100, r: 80, class: 'fl-coral', opacity: 0.35 }),
                  s('text', { x: 120, y: 105, 'text-anchor': 'middle', class: 'lbl', text: 'A only' }),
                  s('text', { x: 300, y: 105, 'text-anchor': 'middle', class: 'lbl', text: 'B only' }),
                  s('text', { x: 210, y: 105, 'text-anchor': 'middle', class: 'lbl', text: 'both' }),
                ],
              },
            },
            {
              type: 'numeric',
              title: 'Two or three',
              prompt: r`How many whole numbers from 1 to 100 are divisible by 2 or by 3?`,
              answer: 67,
              wrong: [{ v: 83, why: 'That counts the multiples of 6 twice. Subtract the 16 multiples of 6.' }],
              explain: r`$50 + 33 - 16 = 67$.`,
            },
            {
              type: 'explain',
              title: 'Three sets',
              body: r`With three sets, add the singles, subtract the pairs, then add back the triple overlap, which was added three times and subtracted three times:
$$|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|$$
The pattern of alternating signs continues for any number of sets.`,
            },
            {
              type: 'numeric',
              title: 'Two, three or five',
              prompt: r`How many numbers from 1 to 100 are divisible by 2, 3 or 5?`,
              answer: 74,
              wrong: [{ v: 103, why: 'Subtract the pairs (multiples of 6, 10 and 15) and add back the multiples of 30.' }, { v: 71, why: 'Don’t forget to add back the 3 multiples of 30.' }],
              explain: r`$50 + 33 + 20 - 16 - 10 - 6 + 3 = 74$. So 26 numbers up to 100 share no factor with 30. (This is the idea behind Euler's totient function.)`,
            },
            {
              type: 'explain',
              title: 'Secret Santa',
              body: r`Everyone at a party puts their name in a hat and draws one. A **derangement** is a draw in which **nobody** gets their own name. Inclusion–exclusion counts them:
$$D(n) = n!\left(1 - \frac{1}{1!} + \frac{1}{2!} - \frac{1}{3!} + \cdots \pm \frac{1}{n!}\right)$$
For 3 people: $D(3) = 6\left(1 - 1 + \frac12 - \frac16\right) = 2$.`,
            },
            {
              type: 'numeric',
              title: 'Four friends',
              prompt: r`In how many ways can 4 friends draw names so that nobody draws their own?`,
              answer: 9,
              wrong: [{ v: 24, why: 'That counts all draws, including ones where someone gets their own name.' }, { v: 6, why: r`$D(4) = 24\left(1 - 1 + \frac12 - \frac16 + \frac1{24}\right)$.` }],
              explain: r`$24\left(\frac12 - \frac16 + \frac{1}{24}\right) = 12 - 4 + 1 = 9$ derangements out of 24 draws.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Approaching 1/e',
              prompt: r`The chance that a random draw is a derangement is $D(n)/n!$. Find the **smallest** party size for which this chance is within 0.001 of $\frac1e \approx 0.36788$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 0.6, grid: 1, gridY: 0.1, height: 260, axes: { xlabel: 'number of people', ylabel: 'P(nobody gets own name)' },
                params: { n: { min: 2, max: 12, step: 1, value: 2, slider: false } },
                curves: [{ f: () => 1 / Math.E, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.n, y: (p) => derange(p.n) / fact(p.n), drag: { x: 'n' }, color: 'violet' }],
                extra: ({ plot, s }) => Array.from({ length: 11 }, (_, i) => i + 2).map((n) => s('circle', { cx: plot.X(n), cy: plot.Y(derange(n) / fact(n)), r: 4, class: 'fl-ink' })),
                readout: (p) => r`$n = ${p.n}$: $\frac{D(${p.n})}{${p.n}!} = \frac{${derange(p.n)}}{${fact(p.n)}} = ${(derange(p.n) / fact(p.n)).toFixed(5)}$`,
                goal: (p) => Math.abs(derange(p.n) / fact(p.n) - 1 / Math.E) < 0.001 && Math.abs(derange(p.n - 1) / fact(p.n - 1) - 1 / Math.E) >= 0.001,
                hint: 'The values zig-zag around the dashed line, getting closer each time.',
                solution: { n: 6 },
              },
              explain: r`At $n = 6$: $\frac{265}{720} \approx 0.36806$, within 0.0002 of $\frac1e$. The series in the formula is exactly the series for $e^{-1}$, so the answer barely depends on the size of the party: about 37% of the time, nobody draws themselves.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Somebody gets their own',
              prompt: r`At a big Secret Santa, what's the probability (as a percentage, nearest whole number) that **at least one** person draws their own name?`,
              unit: '%',
              answer: 63,
              tol: 0.6,
              wrong: [{ v: 37, why: 'That’s the chance that nobody does. Take the complement.' }, { v: 100, why: 'It’s likely but not certain: about 37% of draws are derangements.' }],
              explain: r`$1 - \frac1e \approx 0.632$: about 63%, so redraws are common. Surprisingly, this barely changes whether there are 10 people or 10,000.`,
            },
          ],
          recap: [
            r`$|A \cup B| = |A| + |B| - |A \cap B|$; with more sets, signs alternate.`,
            r`Derangements: $D(n) = n!\sum_k (-1)^k/k!$.`,
            r`The chance of a derangement approaches $1/e \approx 37\%$.`,
          ],
        },
        {
          id: 'pigeonhole',
          title: 'The Pigeonhole Principle',
          summary: 'Guarantees from counting',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Too many pigeons',
              body: r`If you put more than $k$ pigeons into $k$ holes, some hole must hold at least two. More generally, $n$ pigeons in $k$ holes means some hole holds at least $\left\lceil \frac{n}{k} \right\rceil$ (round up).

It sounds obvious, yet this **pigeonhole principle** proves surprising facts, without finding the actual example.`,
            },
            {
              type: 'numeric',
              title: 'Socks in the dark',
              prompt: r`A drawer holds lots of black, white and grey socks. In the dark, how many must you take out to be **sure** of a matching pair?`,
              answer: 4,
              wrong: [{ v: 3, why: 'You might get one of each colour. One more sock must match one of them.' }, { v: 2, why: 'Two socks could be different colours.' }],
              explain: r`3 colours are the holes. With 3 socks you could get one of each; the 4th must match one of them.`,
            },
            {
              type: 'numeric',
              title: 'Shared birthdays',
              prompt: r`How many people must be in a room to **guarantee** that two share a birthday (counting 29 February)?`,
              answer: 367,
              wrong: [{ v: 366, why: 'With 366 people, everyone could have a different day, 29 February included.' }, { v: 23, why: 'That gives a 50% chance. A guarantee needs 367.' }],
              explain: r`366 possible birthdays, so 367 people guarantee a match. Compare with the birthday problem: just 23 people make a match **likely**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Three in a month',
              prompt: r`Find the **smallest** group size that guarantees at least 3 people were born in the same month.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 5, grid: 4, gridY: 1, height: 240, axes: { xlabel: 'people', ylabel: 'guaranteed in busiest month' },
                params: { n: { min: 1, max: 40, step: 1, value: 13, slider: false } },
                curves: [{ f: (x) => Math.ceil(Math.max(1, Math.round(x)) / 12), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.n, y: (p) => Math.ceil(p.n / 12), drag: { x: 'n' }, color: 'coral' }],
                readout: (p) => r`${p.n} people: some month has at least $\lceil ${p.n}/12 \rceil = ${Math.ceil(p.n / 12)}$`,
                goal: (p) => Math.ceil(p.n / 12) >= 3 && Math.ceil((p.n - 1) / 12) < 3,
                hint: 'With 24 people, each month could have exactly 2.',
                solution: { n: 25 },
              },
              explain: r`24 people could be spread exactly 2 per month, but the 25th must make some month 3: $\left\lceil \frac{25}{12} \right\rceil = 3$.`,
            },
            {
              type: 'mcq',
              title: 'Hairs on heads',
              prompt: r`A human head has at most about 150,000 hairs, and London has about 9 million people. What can we conclude?`,
              choices: [
                { t: 'At least two Londoners have exactly the same number of hairs; in fact at least 60 do', ok: true },
                { t: 'Nothing: it would need counting everyone’s hair', why: 'The pigeonhole principle guarantees it without counting anyone.' },
                { t: 'It’s likely but not certain', why: 'It’s certain: there are far more people than possible hair counts.' },
              ],
              explain: r`About 150,001 possible counts (0 to 150,000) are the holes; 9 million people are the pigeons. Some count is shared by at least $\left\lceil \frac{9{,}000{,}000}{150{,}001} \right\rceil = 60$ people. We know it's true without knowing who.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Points in a square',
              prompt: r`Five points are placed anywhere in a $1 \times 1$ square. Split the square into four $\frac12 \times \frac12$ squares: two points must share one. What's the largest distance they could then be apart? (3 decimal places.)`,
              answer: Math.SQRT2 / 2,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'Two points in a small square can be at opposite corners: its diagonal.' }, { v: Math.SQRT2, tol: 0.001, why: 'That’s the diagonal of the whole square. The two points share a small square.' }],
              explain: r`The diagonal of a $\frac12 \times \frac12$ square is $\frac{\sqrt2}{2} \approx 0.707$. So among any 5 points in a unit square, some two are at most 0.707 apart, whatever the arrangement.`,
            },
          ],
          recap: [
            r`$n$ items in $k$ boxes: some box has at least $\lceil n/k \rceil$.`,
            'It guarantees things exist without finding them.',
            'Choose the “holes” cleverly: colours, months, small squares.',
          ],
        },
      ],
    },
  ],
};
