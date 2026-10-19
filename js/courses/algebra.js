import { fix } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;

// ---------- algebra tiles ----------
// groups: [['x', 3], ['1', 2], ['-x', 1], ['-1', 4], ['x2', 1]] drawn left to right from (x0, y0) (bottom-left)
const XLEN = 2.4, UNIT = 0.62;
function tiles({ plot, s }, groups, x0, y0, { plus = true } = {}) {
  const els = [];
  let x = x0;
  groups.forEach(([kind, n], gi) => {
    if (gi > 0 && plus) {
      els.push(s('text', { x: plot.X(x + 0.25), y: plot.Y(y0 + 0.9), 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(22), text: '+' }));
      x += 0.6;
    }
    const neg = kind.startsWith('-');
    const base = kind.replace('-', '');
    const cls = neg ? 'fl-coral' : base === 'x' ? 'fl-blue' : base === 'x2' ? 'fl-violet' : 'fl-amber';
    for (let k = 0; k < n; k++) {
      const w = base === 'x2' ? XLEN : UNIT, hgt = base === '1' ? UNIT : XLEN;
      els.push(s('rect', { x: plot.X(x), y: plot.Y(y0 + hgt), width: plot.X(x + w) - plot.X(x), height: plot.Y(y0) - plot.Y(y0 + hgt), rx: 4, class: cls, stroke: 'var(--card)', 'stroke-width': 2 }));
      x += w + 0.12;
    }
    x += 0.1;
  });
  return { els, x };
}

// ---------- matchstick squares ----------
function matchRow({ plot, s }, n, x0 = 0.5, y0 = 1) {
  const els = [];
  const stick = (xa, ya, xb, yb) => {
    els.push(s('line', { x1: plot.X(xa), y1: plot.Y(ya), x2: plot.X(xb), y2: plot.Y(yb), stroke: 'var(--amber)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    els.push(s('circle', { cx: plot.X(xb), cy: plot.Y(yb), r: 4.5, class: 'fl-coral' }));
  };
  for (let i = 0; i <= n; i++) stick(x0 + i, y0 + 0.08, x0 + i, y0 + 0.92);
  for (let i = 0; i < n; i++) { stick(x0 + i + 0.08, y0, x0 + i + 0.92, y0); stick(x0 + i + 0.08, y0 + 1, x0 + i + 0.92, y0 + 1); }
  return els;
}

// ---------- (x + a)(x + b) area model ----------
function areaUnder({ plot, p, s }, X) {
  const R = (x0, y0, w, hh, cls) => s('rect', { x: plot.X(x0), y: plot.Y(y0 + hh), width: plot.X(x0 + w) - plot.X(x0), height: plot.Y(y0) - plot.Y(y0 + hh), class: cls, opacity: 0.4, stroke: 'var(--card)', 'stroke-width': 3 });
  return [R(0, p.a, X, X, 'fl-violet'), R(X, p.a, p.b, X, 'fl-coral'), R(0, 0, X, p.a, 'fl-blue'), R(X, 0, p.b, p.a, 'fl-amber')];
}
function areaLabels({ plot, p, s }, X) {
  const T = (x, y, t, col) => s('text', { x: plot.X(x), y: plot.Y(y) + 6, 'text-anchor': 'middle', class: 'lbl halo-text', style: `${col ? `fill:var(--${col});` : ''}${FS(17)}`, text: t });
  return [
    T(X / 2, p.a + X / 2, 'x²'), T(X + p.b / 2, p.a + X / 2, `${p.b}x`), T(X / 2, p.a / 2, `${p.a}x`), T(X + p.b / 2, p.a / 2, `${p.a * p.b}`),
    T(X / 2, -0.75, 'x', 'violet'), T(X + p.b / 2, -0.75, `${p.b}`, 'coral'),
    s('text', { x: plot.X(-0.35), y: plot.Y(p.a + X / 2) + 6, 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--violet);${FS(17)}`, text: 'x' }),
    s('text', { x: plot.X(-0.35), y: plot.Y(p.a / 2) + 6, 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--blue);${FS(17)}`, text: `${p.a}` }),
  ];
}

// ---------- think-of-a-number chains ----------
function chain({ plot, s }, steps, ops) {
  const els = [];
  const gap = 10 / steps.length;
  steps.forEach(([v, alg, good], i) => {
    const x = gap / 2 + i * gap;
    els.push(s('text', { x: plot.X(x), y: plot.Y(1.35), 'text-anchor': 'middle', class: 'lbl', style: `${good ? 'fill:var(--success);' : ''}${FS(22)}`, text: v }));
    els.push(s('text', { x: plot.X(x), y: plot.Y(0.45), 'text-anchor': 'middle', class: 'lbl-math', style: `fill:var(--violet);${FS(16)}`, text: alg }));
    if (i < ops.length) els.push(s('text', { x: plot.X(x + gap / 2), y: plot.Y(1.95), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: ops[i] }));
  });
  return els;
}

// ---------- bracket placements for 3 + 5 × 6 − 2 ----------
const BRACKETS = [
  ['3 + 5 × 6 − 2', 31, '3 + 30 − 2'],
  ['(3 + 5) × 6 − 2', 46, '8 × 6 − 2 = 48 − 2'],
  ['3 + 5 × (6 − 2)', 23, '3 + 5 × 4 = 3 + 20'],
  ['(3 + 5) × (6 − 2)', 32, '8 × 4'],
  ['3 + (5 × 6 − 2)', 31, '3 + 28'],
  ['(3 + 5 × 6) − 2', 31, '33 − 2'],
];

// ---------- identities to test ----------
const CLAIMS = [
  { name: '(x + 1)² vs x² + 1', L: (x) => (x + 1) ** 2, R: (x) => x * x + 1, id: false },
  { name: '2(x + 3) vs 2x + 6', L: (x) => 2 * (x + 3), R: (x) => 2 * x + 6, id: true },
  { name: '(x + 2)(x − 2) vs x² − 4', L: (x) => (x + 2) * (x - 2), R: (x) => x * x - 4, id: true },
  { name: '(2x)² vs 2x²', L: (x) => (2 * x) ** 2, R: (x) => 2 * x * x, id: false },
];

export default {
  id: 'algebra',
  subject: 'math',
  title: 'Algebra Basics',
  level: 'Foundational',
  cover: 'algebra',
  tagline: 'Letters for numbers: order of operations, like terms, brackets, patterns and proofs.',
  description: r`Algebra is arithmetic with the numbers left blank. Learn the order of operations, write expressions with letters, collect like terms with algebra tiles, expand brackets with area pictures, turn matchstick patterns into formulas, and use algebra to explain why number tricks always work.`,
  prereq: 'Ratios & Percentages',
  chapters: [
    {
      title: 'The Language of Algebra',
      summary: 'Rules for reading and writing expressions.',
      lessons: [
        {
          id: 'order',
          title: 'Order of Operations',
          summary: 'Which sum comes first?',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Two answers?',
              prompt: r`What is $2 + 3 \times 4$?`,
              choices: [
                { t: '14', ok: true },
                { t: '20', why: 'That adds first: (2 + 3) × 4. By convention, multiplication is done before addition.' },
                { t: '24', why: 'There’s no way to combine these numbers to get 24 with one + and one ×.' },
              ],
              explain: r`Multiplication comes before addition: $3 \times 4 = 12$, then $2 + 12 = 14$. Reading strictly left to right would give 20. Both are reasonable, so mathematicians agreed on a **convention** so that every expression has exactly one meaning.`,
            },
            {
              type: 'explain',
              title: 'The agreed order',
              body: r`To work out an expression:
1. **Brackets** first (innermost first).
2. **Powers** (and roots), like $3^2$.
3. **Multiplication and division**, from left to right.
4. **Addition and subtraction**, from left to right.

Many people remember this as **BIDMAS** or **PEMDAS**. Watch out for one trap: multiplication does **not** come before division. They have equal rank and are done in the order they appear, left to right. The same goes for addition and subtraction.

$$20 - 6 \div 2 \times 3 = 20 - 3 \times 3 = 20 - 9 = 11$$`,
            },
            {
              type: 'numeric',
              title: 'Left to right',
              prompt: r`What is $18 \div 3 \times 2$?`,
              answer: 12,
              wrong: [{ v: 3, why: 'That does the multiplication first: 18 ÷ (3 × 2). Multiplication and division have equal rank, so go left to right.' }],
              explain: r`Left to right: $18 \div 3 = 6$, then $6 \times 2 = 12$. If the author meant $18 \div (3 \times 2) = 3$, they should have written the brackets.`,
            },
            {
              type: 'interactive',
              title: 'Make 32',
              prompt: r`Brackets override the usual order. Choose where to put brackets in $3 + 5 \times 6 - 2$ so that it equals **32**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3, grid: false, axes: false, height: 150,
                params: { b: { min: 0, max: 5, step: 1, value: 0, label: 'brackets', color: 'violet', format: (v) => BRACKETS[v][0] } },
                extra: ({ plot, p, s }) => [
                  s('text', { x: plot.X(5), y: plot.Y(1.9), 'text-anchor': 'middle', class: 'lbl-math halo-text', style: FS(34), text: BRACKETS[p.b][0] }),
                  s('text', { x: plot.X(5), y: plot.Y(0.7), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(18)}`, text: `= ${BRACKETS[p.b][2]} = ${BRACKETS[p.b][1]}` }),
                ],
                readout: (p) => (BRACKETS[p.b][1] === 32 ? 'That makes **32**.' : `That makes **${BRACKETS[p.b][1]}**, not 32.`),
                goal: (p) => BRACKETS[p.b][1] === 32,
                solution: { b: 3 },
                hint: '32 = 8 × 4. Which parts of the expression make 8 and 4?',
              },
              explain: r`$(3 + 5) \times (6 - 2) = 8 \times 4 = 32$. Without brackets the expression is $3 + 30 - 2 = 31$. Notice that several placements change nothing: brackets around a product, like $3 + (5 \times 6 - 2)$, just repeat what the rules already say.`,
            },
            {
              type: 'numeric',
              title: 'Powers come early',
              prompt: r`What is $2 \times 3^2$?`,
              answer: 18,
              wrong: [{ v: 36, why: 'That squares 6 = 2 × 3. The power applies only to the 3, and powers come before multiplication.' }, { v: 12, why: 'The power means 3 × 3, not 3 × 2.' }],
              explain: r`Powers first: $3^2 = 9$, then $2 \times 9 = 18$. To square the whole product you'd write $(2 \times 3)^2 = 36$.`,
            },
            {
              type: 'mcq',
              title: 'A minus sign and a square',
              prompt: r`What is $-3^2$?`,
              choices: [
                { t: r`$-9$`, ok: true },
                { t: r`$9$`, why: r`That's $(-3)^2$. Without brackets, the power applies only to the 3, and the minus sign is applied afterwards.` },
                { t: r`$-6$`, why: r`Squaring means multiplying by itself, not doubling.` },
              ],
              explain: r`The power binds more tightly than the minus sign: $-3^2 = -(3^2) = -9$. Calculators and spreadsheets don't all agree on this one (some spreadsheets give 9!), which is a good reason to write brackets whenever there's any doubt.`,
            },
            {
              type: 'numeric',
              title: 'The fraction bar is a bracket',
              prompt: r`What is $\dfrac{12 + 8}{2 \times 5}$?`,
              answer: 2,
              wrong: [{ v: 30, why: r`That's $12 + 8 \div 2 \times 5$ without the hidden brackets. The fraction bar groups the whole top and the whole bottom.` }, { v: 50, why: r`That's $(12 + 8) \div 2 \times 5$. The bottom $2 \times 5$ is one group: divide by 10.` }],
              explain: r`A fraction bar acts like brackets around the top and around the bottom: $(12 + 8) \div (2 \times 5) = 20 \div 10 = 2$. Typing this into a calculator on one line, you must add those brackets yourself.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The viral puzzle',
              prompt: r`The expression $8 \div 2(2 + 2)$ regularly goes viral, with people split between answers 16 and 1. What's the best conclusion?`,
              choices: [
                { t: 'It’s written ambiguously: a clear writer would use brackets to show which is meant', ok: true },
                { t: 'The answer is definitely 1, because the bracket is attached to the 2', why: 'Some people (and some textbooks) do treat "2(2 + 2)" as one block, but others don’t. Neither reading is universal.' },
                { t: 'The answer is definitely 16, and anyone who says 1 can’t do arithmetic', why: 'Strict left-to-right gives 16, but many careful mathematicians read 2(2 + 2) as a single term. The real problem is the notation.' },
              ],
              explain: r`Reading strictly by the rules gives $8 \div 2 \times 4 = 16$. But writing a number right next to a bracket often signals one block, giving $8 \div 8 = 1$. Real mathematicians avoid the issue: they write $\frac{8}{2}(2 + 2)$ or $\frac{8}{2(2 + 2)}$. The order of operations is a convention for communicating, and good communication leaves no doubt.`,
            },
          ],
          recap: [
            'Brackets, then powers, then × and ÷ (left to right), then + and − (left to right).',
            'Multiplication and division have equal rank; so do addition and subtraction.',
            'A fraction bar groups its top and bottom; when in doubt, add brackets.',
          ],
        },
        {
          id: 'letters',
          title: 'Letters for Numbers',
          summary: 'Variables and expressions',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'A number left blank',
              body: r`In algebra, a letter stands for a number we don't know yet, or for **any** number. An **expression** combines letters and numbers with operations, like $3n + 2$.

Algebra has a few shorthands:
- $3n$ means $3 \times n$ (the multiplication sign is left out).
- $n^2$ means $n \times n$, and $\frac{n}{2}$ means $n \div 2$.
- $ab$ means $a \times b$.

An expression has no equals sign. $3n + 2$ is a recipe for a number; $3n + 2 = 17$ is an **equation**, a claim that might be true for some values of $n$.`,
            },
            {
              type: 'mcq',
              title: 'Words to symbols',
              prompt: r`Which expression means "5 less than twice a number $n$"?`,
              choices: [
                { t: r`$2n - 5$`, ok: true },
                { t: r`$5 - 2n$`, why: '"5 less than X" means X − 5: start with twice the number and take 5 away.' },
                { t: r`$2(n - 5)$`, why: 'That takes 5 off first and then doubles: twice (the number minus 5).' },
                { t: r`$2n + 5$`, why: '"Less than" means subtract.' },
              ],
              explain: r`"Twice a number" is $2n$, and "5 less than" that is $2n - 5$. Watch the order: "5 less than 20" is $20 - 5$, so the 5 is what gets subtracted.`,
            },
            {
              type: 'interactive',
              title: 'One rectangle, many sizes',
              prompt: r`A rectangle is $w$ wide and 3 units longer than it is wide. Its perimeter is $4w + 6$ and its area is $w(w + 3)$. Change $w$ until the area is **40**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.6, xmax: 13, ymin: -1, ymax: 9, grid: 1, axes: false, maxWidth: 520,
                params: { w: { min: 1, max: 8, step: 1, value: 2, label: '$w$', color: 'blue' } },
                under: ({ plot, p, s }) => [s('rect', { x: plot.X(0), y: plot.Y(p.w), width: plot.X(p.w + 3) - plot.X(0), height: plot.Y(0) - plot.Y(p.w), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 })],
                extra: ({ plot, p, s }) => [
                  s('text', { x: plot.X((p.w + 3) / 2), y: plot.Y(0) + 24, 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(16), text: `w + 3 = ${p.w + 3}` }),
                  s('text', { x: plot.X(p.w + 3) + 10, y: plot.Y(p.w / 2) + 5, class: 'lbl halo-text', style: FS(16), text: `w = ${p.w}` }),
                ],
                readout: (p) => r`perimeter $4w + 6 = ${4 * p.w + 6}$ · area $w(w + 3) = ${p.w * (p.w + 3)}$`,
                goal: (p) => p.w * (p.w + 3) === 40,
                solution: { w: 5 },
                hint: 'Try a few widths: the area grows quickly.',
              },
              explain: r`With $w = 5$, the rectangle is $5 \times 8$ and the area is $5(5 + 3) = 40$. Putting a number in place of a letter is called **substitution**. The same two expressions describe every rectangle of this shape, which is the power of letters.`,
            },
            {
              type: 'numeric',
              title: 'Substitution with negatives',
              prompt: r`Find the value of $a^2 - 2ab + b$ when $a = 3$ and $b = -2$.`,
              answer: 19,
              wrong: [{ v: -5, why: r`Check the middle term: $-2ab = -2 \times 3 \times (-2) = +12$. Two negatives make a positive.` }, { v: 23, why: r`The last term is $+b$, which is $-2$ here.` }],
              hint: 'Put brackets around each value before substituting: a² − 2(3)(−2) + (−2).',
              explain: r`$3^2 - 2(3)(-2) + (-2) = 9 + 12 - 2 = 19$. Writing each substituted value in brackets is the safest habit, especially for negative numbers.`,
            },
            {
              type: 'mcq',
              title: 'Shorthand',
              prompt: r`Which expression is the same as $n + n + n$?`,
              choices: [
                { t: r`$3n$`, ok: true },
                { t: r`$n^3$`, why: r`$n^3$ is $n \times n \times n$. Adding three copies is multiplying by 3.` },
                { t: r`$n + 3$`, why: 'That adds 3 to n once. Three copies of n is 3 times n.' },
              ],
              explain: r`Three lots of $n$ is $3n$. For $n = 5$: $5 + 5 + 5 = 15 = 3 \times 5$, while $n^3 = 125$. Repeated addition gives multiplication; repeated multiplication gives powers.`,
            },
            {
              type: 'numeric',
              title: 'A gym membership',
              prompt: r`A gym charges a \$20 joining fee plus \$15 per month, so the cost after $m$ months is $20 + 15m$ dollars. What is the total cost after 8 months?`,
              unit: 'dollars',
              answer: 140,
              wrong: [{ v: 280, why: r`That's $(20 + 15) \times 8$. Only the monthly fee is multiplied by the months: $20 + 15 \times 8$.` }, { v: 120, why: 'Don’t forget the one-off joining fee of \\$20.' }],
              explain: r`$20 + 15 \times 8 = 20 + 120 = 140$ dollars. The order of operations is built into the formula: the multiplication happens first, so the joining fee is paid only once.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Hours and minutes',
              prompt: r`The number of seconds in $h$ hours and $m$ minutes is $3600h + 60m$. How many seconds are there in 2 hours and 15 minutes?`,
              unit: 's',
              answer: 8100,
              wrong: [{ v: 7215, why: 'Convert the minutes to seconds too: each minute is 60 seconds.' }, { v: 4502, why: r`$3600h$ means $3600 \times 2$, not $3600 + 2$.` }],
              explain: r`$3600 \times 2 + 60 \times 15 = 7200 + 900 = 8100$ s. Writing the general expression first, then substituting, works for any time and is easy to check: 1 hour and 0 minutes gives 3600 ✓.`,
            },
          ],
          recap: [
            'A letter stands for an unknown or any number; 3n means 3 × n.',
            'An expression is a recipe; an equation is a claim with an equals sign.',
            'Substitute values in brackets, then follow the order of operations.',
          ],
        },
      ],
    },
    {
      title: 'Simplifying',
      summary: 'Collecting, expanding and factoring.',
      lessons: [
        {
          id: 'terms',
          title: 'Like Terms',
          summary: 'Collecting with algebra tiles',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Algebra tiles',
              body: r`Picture $x$ as a {blue:long bar} whose length is $x$ (we don't know it), and $1$ as a small {amber:unit square}. Here are $3x + 2$ and $x + 4$ side by side. Change the hidden value of $x$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 15, ymin: -0.4, ymax: 4.2, grid: false, axes: false, height: 230,
                params: { x: { min: 1, max: 3.5, step: 0.5, value: 2.4, label: 'length of $x$', color: 'blue', format: (v) => fix(v, 1) } },
                extra: (ctx) => {
                  const XL = ctx.p.x;
                  const draw = (groups, x0) => {
                    const els = [];
                    let x = x0;
                    for (const [kind, n] of groups) {
                      for (let k = 0; k < n; k++) {
                        const hgt = kind === 'x' ? XL : UNIT;
                        els.push(ctx.s('rect', { x: ctx.plot.X(x), y: ctx.plot.Y(hgt), width: ctx.plot.X(x + UNIT) - ctx.plot.X(x), height: ctx.plot.Y(0) - ctx.plot.Y(hgt), rx: 4, class: kind === 'x' ? 'fl-blue' : 'fl-amber', stroke: 'var(--card)', 'stroke-width': 2 }));
                        x += UNIT + 0.12;
                      }
                      x += 0.3;
                    }
                    return { els, x };
                  };
                  const a = draw([['x', 3], ['1', 2]], 0.4), b = draw([['x', 1], ['1', 4]], a.x + 1.4);
                  return [...a.els, ctx.s('text', { x: ctx.plot.X(a.x + 0.5), y: ctx.plot.Y(0.5), 'text-anchor': 'middle', class: 'lbl', style: FS(24), text: '+' }), ...b.els];
                },
                readout: (p) => r`$3x + 2 = ${fix(3 * p.x + 2, 1)}$ · $x + 4 = ${fix(p.x + 4, 1)}$ · together $4x + 6 = ${fix(4 * p.x + 6, 1)}$`,
              },
              after: r`Bars combine with bars and units with units: together there are **4 bars and 6 units**, so $3x + 2 + x + 4 = 4x + 6$ whatever length $x$ is. A bar and a unit can never merge into one tile, because their sizes are different (unless you know $x$).`,
            },
            {
              type: 'explain',
              title: 'Like terms',
              body: r`A **term** is a number times a letter part, such as $3x$, $-5y$, $7$ or $2x^2$. Terms are **like terms** when they have exactly the same letter part:
- $3x$ and $-x$ are like terms: they combine to $2x$.
- $3x$ and $3y$ are not: different letters.
- $x$ and $x^2$ are not: a bar and a big square are different shapes.

**Simplifying** means collecting like terms: add up the numbers in front (the **coefficients**) and keep the letter part the same.`,
            },
            {
              type: 'interactive',
              title: 'Collect the tiles',
              prompt: r`Simplify $2x + 5 + 3x - 1$: choose how many {blue:$x$-bars} and {amber:units} you need. (The {coral:coral} unit is $-1$: it cancels one positive unit.)`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 15, ymin: -0.4, ymax: 6.8, grid: false, axes: false, height: 300,
                params: {
                  a: { min: 0, max: 8, step: 1, value: 1, label: '$x$-bars', color: 'blue' },
                  b: { min: 0, max: 8, step: 1, value: 1, label: 'units', color: 'amber' },
                },
                extra: (ctx) => {
                  const top = tiles(ctx, [['x', 2], ['1', 5], ['x', 3], ['-1', 1]], 0.3, 3.6);
                  const bot = tiles(ctx, [['x', ctx.p.a], ['1', ctx.p.b]], 0.3, 0.2, { plus: ctx.p.a > 0 && ctx.p.b > 0 });
                  return [...top.els, ...bot.els,
                    ctx.s('text', { x: ctx.plot.X(14.8), y: ctx.plot.Y(4.4), 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(14)}`, text: 'given' }),
                    ctx.s('text', { x: ctx.plot.X(14.8), y: ctx.plot.Y(1), 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(14)}`, text: 'yours' })];
                },
                readout: (p) => r`yours: $${p.a ? (p.a === 1 ? '' : p.a) + 'x' : ''}${p.a && p.b ? ' + ' : ''}${p.b || !p.a ? p.b : ''}$ · at $x = 10$: given $= 54$, yours $= ${10 * p.a + p.b}$`,
                goal: (p) => p.a === 5 && p.b === 4,
                solution: { a: 5, b: 4 },
                hint: 'Count the bars: 2 + 3. Then the units: 5 positive and one negative.',
              },
              explain: r`$2x + 3x = 5x$, and $5 - 1 = 4$, so $2x + 5 + 3x - 1 = 5x + 4$. The negative tile cancels one positive unit (a "zero pair"). Checking with a value, $x = 10$: $20 + 5 + 30 - 1 = 54 = 5(10) + 4$ ✓.`,
            },
            {
              type: 'mcq',
              title: 'Two letters',
              prompt: r`Simplify $5a + 3b - 2a + b$.`,
              choices: [
                { t: r`$3a + 4b$`, ok: true },
                { t: r`$7a + 4b$`, why: r`The $2a$ is subtracted: $5a - 2a = 3a$.` },
                { t: r`$3a + 3b$`, why: r`A lone $b$ means $1b$: $3b + b = 4b$.` },
                { t: r`$7ab$`, why: r`$a$-terms and $b$-terms are unlike: they can't merge into a single term.` },
              ],
              explain: r`Group the like terms: $(5a - 2a) + (3b + b) = 3a + 4b$. A term's sign travels with it, so "$- 2a$" stays a subtraction when you move it next to $5a$.`,
            },
            {
              type: 'multi',
              title: 'Can it be simplified?',
              prompt: 'Which of these can be simplified (written with fewer terms)?',
              choices: [
                { t: r`$4x + 2x$`, ok: true },
                { t: r`$7y - 7y$`, ok: true },
                { t: r`$3x + 2y$`, why: 'Different letters: these are unlike terms.' },
                { t: r`$x^2 + x$`, why: r`$x^2$ and $x$ are different letter parts, like a square tile and a bar.` },
                { t: r`$5ab + 2ba$`, ok: true },
              ],
              explain: r`$4x + 2x = 6x$, $7y - 7y = 0$, and $5ab + 2ba = 7ab$, because $ba = ab$ (order doesn't matter in multiplication). But $3x + 2y$ and $x^2 + x$ are already as simple as they get.`,
            },
            {
              type: 'mcq',
              title: 'Squares and bars',
              prompt: r`Simplify $x^2 + 3x + 2x^2 - x$.`,
              choices: [
                { t: r`$3x^2 + 2x$`, ok: true },
                { t: r`$5x^2$`, why: r`$x^2$ and $x$ terms are unlike: they can't be added together.` },
                { t: r`$3x^4 + 2x$`, why: r`Adding $x^2 + 2x^2$ adds the coefficients, not the powers: $3x^2$.` },
                { t: r`$2x^2 + 4x$`, why: r`The $x^2$ terms: $1 + 2 = 3$. The $x$ terms: $3 - 1 = 2$.` },
              ],
              explain: r`$x^2 + 2x^2 = 3x^2$ (one big square tile plus two more) and $3x - x = 2x$. A common mistake is to add powers when adding terms: powers add when you **multiply**, as in $x^2 \cdot x^3 = x^5$, never when you add.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Around a triangle',
              prompt: r`A triangle has sides $x + 3$, $2x - 1$ and $3x$. When its perimeter is simplified to the form $ax + b$, what is $a + b$?`,
              answer: 8,
              wrong: [{ v: 6, why: r`That's $a$ alone. The numbers $3 - 1$ give $b = 2$ too.` }, { v: 10, why: r`The $-1$ is subtracted: $b = 3 - 1 = 2$.` }],
              explain: r`$(x + 3) + (2x - 1) + 3x = 6x + 2$, so $a = 6$, $b = 2$ and $a + b = 8$. Nice check: when $x = 1$, the perimeter is $4 + 1 + 3 = 8 = a + b$. Substituting 1 for $x$ always gives the sum of the coefficients.`,
            },
          ],
          recap: [
            'Like terms have the same letter part; add their coefficients.',
            'Unlike terms (x and y, x and x²) stay separate.',
            'A term’s sign travels with it when you rearrange.',
          ],
        },
        {
          id: 'distributive',
          title: 'The Distributive Law',
          summary: 'Expanding and factoring',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'One rectangle, two parts',
              body: r`A rectangle $a$ tall and $b + c$ wide can be split into two rectangles. Count the squares both ways.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 12.5, ymin: -1.4, ymax: 6.5, grid: 1, axes: false, maxWidth: 540,
                params: {
                  a: { min: 1, max: 6, step: 1, value: 3, label: '$a$', color: 'violet' },
                  b: { min: 1, max: 6, step: 1, value: 4, label: '$b$', color: 'blue' },
                  c: { min: 1, max: 6, step: 1, value: 2, label: '$c$', color: 'coral' },
                },
                under: ({ plot, p, s }) => [
                  s('rect', { x: plot.X(0), y: plot.Y(p.a), width: plot.X(p.b) - plot.X(0), height: plot.Y(0) - plot.Y(p.a), class: 'fl-blue', opacity: 0.35 }),
                  s('rect', { x: plot.X(p.b), y: plot.Y(p.a), width: plot.X(p.b + p.c) - plot.X(p.b), height: plot.Y(0) - plot.Y(p.a), class: 'fl-coral', opacity: 0.35 }),
                ],
                extra: ({ plot, p, s }) => [
                  s('rect', { x: plot.X(0), y: plot.Y(p.a), width: plot.X(p.b + p.c) - plot.X(0), height: plot.Y(0) - plot.Y(p.a), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
                  s('line', { x1: plot.X(p.b), x2: plot.X(p.b), y1: plot.Y(0), y2: plot.Y(p.a), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                  s('text', { x: plot.X(p.b / 2), y: plot.Y(0) + 22, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--blue);${FS(16)}`, text: `b = ${p.b}` }),
                  s('text', { x: plot.X(p.b + p.c / 2), y: plot.Y(0) + 22, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--coral);${FS(16)}`, text: `c = ${p.c}` }),
                  s('text', { x: plot.X(p.b + p.c) + 8, y: plot.Y(p.a / 2) + 5, class: 'lbl halo-text', style: `fill:var(--violet);${FS(16)}`, text: `a = ${p.a}` }),
                ],
                readout: (p) => r`$a(b + c) = ${p.a} \times ${p.b + p.c} = ${p.a * (p.b + p.c)}$ · $ab + ac = ${p.a * p.b} + ${p.a * p.c} = ${p.a * p.b + p.a * p.c}$`,
              },
              after: r`Always equal: the whole rectangle is the two parts together. That's the **distributive law**:
$$a(b + c) = ab + ac$$
The multiplier outside the bracket multiplies **every** term inside. Using it to remove brackets is called **expanding**.`,
            },
            {
              type: 'numeric',
              title: 'Mental arithmetic',
              prompt: r`Use $7 \times 98 = 7 \times (100 - 2)$ to work out $7 \times 98$ in your head.`,
              answer: 686,
              wrong: [{ v: 698, why: r`The 7 multiplies the 2 as well: $7 \times 100 - 7 \times 2$.` }, { v: 700, why: r`That's $7 \times 100$. Now take away $7 \times 2$.` }],
              explain: r`$700 - 14 = 686$. The distributive law is the secret behind most mental arithmetic tricks: split an awkward number into easy pieces.`,
            },
            {
              type: 'interactive',
              title: 'Expand it',
              prompt: r`Expand $4(2x + 3)$ into the form $px + q$. The rectangle is 4 tall; its width is $2x + 3$.`,
              widget: {
                kind: 'graph', xmin: -0.3, xmax: 14, ymin: -1.2, ymax: 5, grid: false, axes: false, height: 300,
                params: {
                  p: { min: 0, max: 12, step: 1, value: 2, label: '$p$', color: 'blue' },
                  q: { min: 0, max: 15, step: 1, value: 3, label: '$q$', color: 'amber' },
                },
                under: ({ plot, s }) => {
                  const X = 3.2, els = [];
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(4), width: plot.X(2 * X) - plot.X(0), height: plot.Y(0) - plot.Y(4), class: 'fl-blue', opacity: 0.32 }));
                  els.push(s('rect', { x: plot.X(2 * X), y: plot.Y(4), width: plot.X(2 * X + 3) - plot.X(2 * X), height: plot.Y(0) - plot.Y(4), class: 'fl-amber', opacity: 0.4 }));
                  return els;
                },
                extra: ({ plot, p, s }) => {
                  const X = 3.2, els = [];
                  for (let k = 1; k < 4; k++) els.push(s('line', { x1: plot.X(0), x2: plot.X(2 * X + 3), y1: plot.Y(k), y2: plot.Y(k), stroke: 'var(--card)', 'stroke-width': 2 }));
                  for (const xx of [X, 2 * X, 2 * X + 1, 2 * X + 2]) els.push(s('line', { x1: plot.X(xx), x2: plot.X(xx), y1: plot.Y(0), y2: plot.Y(4), stroke: 'var(--card)', 'stroke-width': 2 }));
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(4), width: plot.X(2 * X + 3) - plot.X(0), height: plot.Y(0) - plot.Y(4), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  els.push(s('text', { x: plot.X(X), y: plot.Y(0) + 22, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--blue);${FS(16)}`, text: '2x' }));
                  els.push(s('text', { x: plot.X(2 * X + 1.5), y: plot.Y(0) + 22, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--warn);${FS(16)}`, text: '3' }));
                  els.push(s('text', { x: plot.X(2 * X + 3) + 10, y: plot.Y(2) + 5, class: 'lbl halo-text', style: FS(16), text: '4' }));
                  return els;
                },
                readout: (p) => r`$4(2x + 3) \overset{?}{=} ${p.p}x + ${p.q}$ · check at $x = 5$: left $= 52$, right $= ${5 * p.p + p.q}$`,
                goal: (p) => p.p === 8 && p.q === 12,
                solution: { p: 8, q: 12 },
                hint: 'The blue part is 4 rows of 2 bars of length x; the gold part is 4 rows of 3 unit squares.',
              },
              explain: r`$4(2x + 3) = 4 \cdot 2x + 4 \cdot 3 = 8x + 12$. The picture shows it: 4 rows of $2x$ is $8x$, and 4 rows of 3 is 12. Forgetting to multiply the second term ($8x + 3$) is the most common slip.`,
            },
            {
              type: 'mcq',
              title: 'A negative outside',
              prompt: r`Expand $-2(x - 5)$.`,
              choices: [
                { t: r`$-2x + 10$`, ok: true },
                { t: r`$-2x - 10$`, why: r`The $-2$ multiplies $-5$ too, and $-2 \times -5 = +10$.` },
                { t: r`$-2x - 5$`, why: r`The $-2$ must multiply both terms in the bracket.` },
                { t: r`$2x + 10$`, why: r`$-2 \times x = -2x$: the first term keeps the minus sign.` },
              ],
              explain: r`$-2 \times x = -2x$ and $-2 \times (-5) = +10$. Check with $x = 1$: $-2(1 - 5) = -2 \times -4 = 8$, and $-2 + 10 = 8$ ✓. Substituting a simple number is a quick, reliable check on any expansion.`,
            },
            {
              type: 'explain',
              title: 'Factoring: running it backwards',
              body: r`Reading the distributive law from right to left, $ab + ac = a(b + c)$, takes a common factor **out** of the terms. This is **factoring**:
$$6x + 9 = 3 \cdot 2x + 3 \cdot 3 = 3(2x + 3)$$
To factor fully, take out the **highest common factor** of the terms. $6x + 9 = 1.5(4x + 6)$ is true too, but no one would call it fully factored. Factoring is how algebra reveals structure, such as "this is always a multiple of 3".`,
            },
            {
              type: 'numeric',
              title: 'Take out the factor',
              prompt: r`Factor fully: $12x + 18 = k(2x + 3)$. What is $k$?`,
              answer: 6,
              wrong: [{ v: 3, why: r`$3(4x + 6)$ is right, but it isn't in the form $k(2x + 3)$, and 4 and 6 still share a factor 2.` }, { v: 2, why: r`$2(6x + 9)$ leaves a common factor of 3 inside.` }],
              explain: r`The highest common factor of 12 and 18 is 6: $12x + 18 = 6(2x + 3)$. Expand to check: $6 \times 2x + 6 \times 3 = 12x + 18$ ✓.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Factor to calculate',
              prompt: r`Work out $13 \times 99 + 13$ without a calculator.`,
              answer: 1300,
              wrong: [{ v: 1287, why: r`That's $13 \times 99$ alone. Add the last 13.` }, { v: 1314, why: r`$13 \times 99 + 13 = 13 \times (99 + 1)$.` }],
              hint: r`$13 = 13 \times 1$, so take out the common factor 13.`,
              explain: r`Both terms contain a factor 13: $13 \times 99 + 13 \times 1 = 13 \times (99 + 1) = 13 \times 100 = 1300$. Factoring turned an awkward sum into an easy product.`,
            },
          ],
          recap: [
            'Distributive law: a(b + c) = ab + ac; the outside factor multiplies every term.',
            'Watch the signs: −2 × −5 = +10.',
            'Factoring reverses expanding: take out the highest common factor.',
          ],
        },
        {
          id: 'brackets',
          title: 'Two Brackets',
          summary: 'Area models and special products',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Four rectangles',
              body: r`To multiply $(x + a)(x + b)$, draw a rectangle $x + a$ tall and $x + b$ wide. It splits into four pieces.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 11, ymin: -1.5, ymax: 10, grid: false, axes: false, maxWidth: 480,
                params: {
                  x: { min: 2, max: 6, step: 0.5, value: 4, label: '$x$', color: 'violet', format: (v) => fix(v, 1) },
                  a: { min: 1, max: 4, step: 1, value: 2, label: '$a$', color: 'blue' },
                  b: { min: 1, max: 4, step: 1, value: 3, label: '$b$', color: 'coral' },
                },
                under: (ctx) => areaUnder(ctx, ctx.p.x),
                extra: (ctx) => areaLabels(ctx, ctx.p.x),
                readout: (p) => r`$(x + ${p.a})(x + ${p.b}) = x^2 + ${p.b}x + ${p.a}x + ${p.a * p.b} = x^2 + ${p.a + p.b}x + ${p.a * p.b}$`,
              },
              after: r`The four pieces are $x^2$, $bx$, $ax$ and $ab$. The two middle pieces are like terms, so
$$(x + a)(x + b) = x^2 + (a + b)x + ab$$
Every term in the first bracket multiplies every term in the second: $2 \times 2 = 4$ products.`,
            },
            {
              type: 'numeric',
              title: 'Expand',
              prompt: r`Expand $(x + 2)(x + 7)$. What is the coefficient of $x$?`,
              answer: 9,
              wrong: [{ v: 14, why: r`14 is the constant term, $2 \times 7$. The $x$-terms are $7x + 2x$.` }, { v: 5, why: r`The $x$-terms add: $2x + 7x$.` }],
              explain: r`$(x + 2)(x + 7) = x^2 + 7x + 2x + 14 = x^2 + 9x + 14$. The middle coefficient is the **sum** $2 + 7$ and the constant is the **product** $2 \times 7$.`,
            },
            {
              type: 'interactive',
              title: 'Work backwards',
              prompt: r`Choose whole numbers $a$ and $b$ so that $(x + a)(x + b) = x^2 + 9x + 20$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 14.5, ymin: -1.5, ymax: 14.2, grid: false, axes: false, maxWidth: 440,
                params: {
                  a: { min: 1, max: 10, step: 1, value: 2, label: '$a$', color: 'blue' },
                  b: { min: 1, max: 10, step: 1, value: 10, label: '$b$', color: 'coral' },
                },
                under: (ctx) => areaUnder(ctx, 4),
                extra: (ctx) => areaLabels(ctx, 4),
                readout: (p) => r`$(x + ${p.a})(x + ${p.b}) = x^2 + ${p.a + p.b}x + ${p.a * p.b}$ · target $x^2 + 9x + 20$`,
                goal: (p) => p.a + p.b === 9 && p.a * p.b === 20,
                solution: { a: 4, b: 5 },
                hint: 'You need two numbers that add to 9 and multiply to 20.',
              },
              explain: r`$a + b = 9$ and $ab = 20$: the numbers are 4 and 5. So $x^2 + 9x + 20 = (x + 4)(x + 5)$. Undoing an expansion like this is called factorising a quadratic, and the Quadratics & Polynomials course takes it much further.`,
            },
            {
              type: 'mcq',
              title: 'A squared bracket',
              prompt: r`Which is equal to $(a + b)^2$ for all values?`,
              choices: [
                { t: r`$a^2 + 2ab + b^2$`, ok: true },
                { t: r`$a^2 + b^2$`, why: r`Try $a = b = 1$: $(1 + 1)^2 = 4$, but $1 + 1 = 2$. The square has two extra rectangles of area $ab$.` },
                { t: r`$a^2 + ab + b^2$`, why: r`There are two $ab$ rectangles in the picture of $(a + b)^2$, not one.` },
              ],
              explain: r`$(a + b)^2 = (a + b)(a + b) = a^2 + ab + ba + b^2 = a^2 + 2ab + b^2$. Draw a square of side $a + b$: inside are a square $a^2$, a square $b^2$, and **two** rectangles $a \times b$. Forgetting them is one of the most common errors in algebra.`,
            },
            {
              type: 'numeric',
              title: 'Squaring in your head',
              prompt: r`Use $(30 + 1)^2 = 30^2 + 2 \times 30 \times 1 + 1^2$ to work out $31^2$.`,
              answer: 961,
              wrong: [{ v: 901, why: r`Don't forget the middle term $2 \times 30 \times 1 = 60$.` }, { v: 931, why: r`The middle term is $2 \times 30 \times 1 = 60$, not 30.` }],
              explain: r`$900 + 60 + 1 = 961$. The same trick gives any number near a round number: $49^2 = (50 - 1)^2 = 2500 - 100 + 1 = 2401$.`,
            },
            {
              type: 'explain',
              title: 'The difference of two squares',
              body: r`When the brackets differ only in a sign, the middle terms cancel:
$$(a + b)(a - b) = a^2 - ab + ab - b^2 = a^2 - b^2$$
That gives a lovely shortcut for multiplying two numbers equally spaced around a round number:
$$51 \times 49 = (50 + 1)(50 - 1) = 2500 - 1 = 2499$$`,
            },
            { /*anim:algebra*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Cut and turn',
              body: r`Take a {blue:square of side $a$} and cut a small square of side $b$ out of its corner. What's left has area $a^2 - b^2$. Now cut it in two and move one piece. Watch.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.8, xmax: 7.8, ymin: -0.9, ymax: 5.6, grid: false, axes: false, maxWidth: 520,
                animate: { param: 't', speed: 0.45, max: 4, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const A = 5, B = 2, u = Math.min(1, Math.max(0, (p.t - 1) / 1.6)), e = u * u * (3 - 2 * u);
                  const poly = (pts, o) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', 'stroke-linejoin': 'round', ...o });
                  const T = (x, y, text, fill) => s('text', { x: plot.X(x), y: plot.Y(y) + 6, 'text-anchor': 'middle', class: 'lbl-math halo-text', style: `font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px));fill:${fill}`, text });
                  const els = [];
                  // bottom piece: a wide, (a - b) tall
                  els.push(poly([[0, 0], [A, 0], [A, A - B], [0, A - B]], { class: 'fl-blue', opacity: 0.8, stroke: 'var(--card)', 'stroke-width': 2 }));
                  // top-left piece: (a - b) wide, b tall; turns a quarter and slides to the right
                  const c0 = [(A - B) / 2, A - B / 2], c1 = [A + B / 2, (A - B) / 2];
                  const cx = c0[0] + (c1[0] - c0[0]) * e, cy = c0[1] + (c1[1] - c0[1]) * e, th = (-Math.PI / 2) * e;
                  const corner = ([dx, dy]) => [cx + dx * Math.cos(th) - dy * Math.sin(th), cy + dx * Math.sin(th) + dy * Math.cos(th)];
                  els.push(poly([[-(A - B) / 2, -B / 2], [(A - B) / 2, -B / 2], [(A - B) / 2, B / 2], [-(A - B) / 2, B / 2]].map(corner), { class: 'fl-coral', opacity: 0.85, stroke: 'var(--card)', 'stroke-width': 2 }));
                  // the removed corner, shown faintly
                  if (e < 0.02) els.push(poly([[A - B, A - B], [A, A - B], [A, A], [A - B, A]], { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  els.push(T(A / 2, -0.5, 'a', 'var(--blue)'));
                  els.push(T(-0.45, (A - B) / 2, 'a − b', 'var(--blue)'));
                  if (e > 0.98) {
                    els.push(T((A + B) / 2, A - B + 0.5, 'a + b', 'var(--ink)'));
                    els.push(T(A + B / 2, -0.5, 'b', 'var(--coral)'));
                  } else if (e < 0.02) {
                    els.push(T(A - B / 2, A - B / 2, 'b²', 'var(--ink-3)'));
                    els.push(T(A + 0.45, A - B / 2, 'b', 'var(--ink-3)'));
                  }
                  return els;
                },
                readout: (p) => (p.t < 2.6 ? r`area left over: $a^2 - b^2$` : r`same area, now a rectangle: $(a + b)(a - b)$`),
              },
              after: r`Nothing was added or thrown away, so the areas match: $a^2 - b^2 = (a + b)(a - b)$. The picture is the algebra: the strip that turns and slides is exactly the $-ab + ab$ that cancels when you expand the brackets.`,
            },
            {
              type: 'numeric',
              title: 'Around a hundred',
              prompt: r`Work out $103 \times 97$ using the difference of two squares.`,
              answer: 9991,
              wrong: [{ v: 9999, why: r`$103 = 100 + 3$ and $97 = 100 - 3$, so subtract $3^2 = 9$, not 1.` }, { v: 9994, why: r`Subtract $3^2 = 9$, not $3$.` }],
              explain: r`$(100 + 3)(100 - 3) = 100^2 - 3^2 = 10{,}000 - 9 = 9991$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Coefficients that aren’t 1',
              prompt: r`Expand $(2x + 1)(x - 3)$. What is the coefficient of $x$?`,
              answer: -5,
              wrong: [{ v: -6, why: r`That's only $2x \times (-3)$. There's also $1 \times x = +x$.` }, { v: 7, why: r`$2x \times (-3) = -6x$ is negative: the $x$-terms are $-6x + x$.` }, { v: -3, why: r`$-3$ is the constant term, $1 \times (-3)$.` }],
              explain: r`Four products: $2x \cdot x = 2x^2$, $2x \cdot (-3) = -6x$, $1 \cdot x = x$, $1 \cdot (-3) = -3$. Together $2x^2 - 5x - 3$, so the coefficient is $-5$. Check at $x = 1$: $(3)(-2) = -6$ and $2 - 5 - 3 = -6$ ✓.`,
            },
          ],
          recap: [
            '(x + a)(x + b) = x² + (a + b)x + ab: every term times every term.',
            '(a + b)² = a² + 2ab + b², never just a² + b².',
            '(a + b)(a − b) = a² − b², the difference of two squares.',
          ],
        },
      ],
    },
    {
      title: 'Algebra at Work',
      summary: 'Patterns, proofs and checks.',
      lessons: [
        {
          id: 'patterns',
          title: 'Patterns to Formulas',
          summary: 'Matchsticks and dot triangles',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A row of squares',
              body: r`Squares made of matchsticks, in a row. Add squares and watch the count.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 11, ymin: 0, ymax: 3, grid: false, axes: false, maxWidth: 600,
                params: { n: { min: 1, max: 10, step: 1, value: 3, label: 'squares $n$', color: 'blue' } },
                extra: (ctx) => matchRow(ctx, ctx.p.n, 0.5, 1),
                readout: (p) => `${p.n} square${p.n > 1 ? 's' : ''}: **${3 * p.n + 1}** matchsticks`,
              },
              after: r`Each new square needs **3** more matches (it borrows one side from its neighbour), and the first square needs one extra: $4, 7, 10, 13, \dots$ So the $n$th pattern uses $3n + 1$ matches. The number that's added each time (3) becomes the coefficient of $n$.`,
            },
            {
              type: 'numeric',
              title: 'Fifty squares',
              prompt: r`How many matchsticks make a row of **50** squares?`,
              answer: 151,
              wrong: [{ v: 200, why: 'Neighbouring squares share a side: you need 3 per square, plus 1.' }, { v: 150, why: r`$3n + 1$: don't forget the $+1$ for the first square's extra side.` }],
              explain: r`$3 \times 50 + 1 = 151$. A formula lets you jump straight to the 50th pattern without drawing the 49 before it.`,
            },
            {
              type: 'interactive',
              title: 'Find the rule',
              prompt: r`A pattern goes $5, 9, 13, 17, \dots$ (shown as dots). Choose $a$ and $b$ so that the line $an + b$ goes through every dot.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 26, grid: 1, gridY: 5, height: 300, axes: { xlabel: 'n', ylabel: 'term', yticks: 5 },
                params: {
                  a: { min: 0, max: 6, step: 1, value: 2, label: '$a$', color: 'blue' },
                  b: { min: -3, max: 6, step: 1, value: 3, label: '$b$', color: 'coral' },
                },
                curves: [{ f: (x, p) => p.a * x + p.b, color: 'blue' }],
                under: ({ plot, s }) => [1, 2, 3, 4, 5].map((n) => s('circle', { cx: plot.X(n), cy: plot.Y(4 * n + 1), r: 7, class: 'fl-ink' })),
                readout: (p) => r`$${p.a}n ${p.b < 0 ? '-' : '+'} ${Math.abs(p.b)}$ gives ${[1, 2, 3, 4].map((n) => p.a * n + p.b).join(', ')}, …`,
                goal: (p) => p.a === 4 && p.b === 1,
                solution: { a: 4, b: 1 },
                hint: 'The terms go up by 4 each time: that sets the slope a. Then adjust b so the first term is 5.',
              },
              explain: r`The terms rise by 4 each time, so $a = 4$. Then $4 \times 1 + b = 5$ gives $b = 1$: the rule is $4n + 1$. A pattern that grows by the same amount each time is **linear**: its terms lie on a straight line.`,
            },
            {
              type: 'mcq',
              title: 'Which formula?',
              prompt: r`Which formula gives the sequence $7, 10, 13, 16, \dots$ (for $n = 1, 2, 3, \dots$)?`,
              choices: [
                { t: r`$3n + 4$`, ok: true },
                { t: r`$3n + 7$`, why: r`For $n = 1$ that gives 10. The starting term isn't the constant: subtract one step from it.` },
                { t: r`$n + 6$`, why: 'That rises by 1 each time, but the sequence rises by 3.' },
                { t: r`$7n$`, why: r`That gives 7, 14, 21: it rises by 7, not 3.` },
              ],
              explain: r`It rises by 3, so it's $3n + b$. For $n = 1$: $3 + b = 7$, so $b = 4$. A handy shortcut: the constant is the "zeroth term", one step **before** the first: $7 - 3 = 4$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Triangles of dots',
              body: r`Not every pattern grows by a fixed amount. Triangles of dots grow by $2, 3, 4, \dots$: $1, 3, 6, 10, 15, \dots$ Here's the trick to find a formula: put two copies together.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 11.5, ymin: -0.5, ymax: 9.5, grid: false, axes: false, maxWidth: 420,
                params: { n: { min: 1, max: 8, step: 1, value: 4, label: '$n$', color: 'blue' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let row = 0; row < p.n; row++) for (let col = 0; col <= p.n; col++) {
                    const mine = col <= row;
                    els.push(s('circle', { cx: plot.X(col), cy: plot.Y(p.n - 1 - row), r: 9, class: mine ? 'fl-blue' : 'fl-coral', opacity: mine ? 1 : 0.6 }));
                  }
                  return els;
                },
                readout: (p) => r`two triangles make an $${p.n} \times ${p.n + 1}$ rectangle of $${p.n * (p.n + 1)}$ dots, so one triangle has $${(p.n * (p.n + 1)) / 2}$`,
              },
              after: r`Two copies of the $n$th triangle (blue and coral) fit together into a rectangle $n$ by $n + 1$. So the $n$th **triangular number** is
$$T_n = \frac{n(n + 1)}{2}$$
The formula has $n^2$ in it once expanded: patterns whose differences grow steadily are **quadratic**, not linear.`,
            },
            {
              type: 'numeric',
              title: 'The 20th triangle',
              prompt: r`How many dots are in the 20th triangular number?`,
              answer: 210,
              wrong: [{ v: 420, why: r`That's the rectangle of two triangles, $20 \times 21$. Halve it.` }, { v: 200, why: r`$\frac{n(n + 1)}{2}$ with $n = 20$ is $\frac{20 \times 21}{2}$.` }],
              explain: r`$\frac{20 \times 21}{2} = 210$. That's also $1 + 2 + 3 + \dots + 20$, the sum Gauss is said to have found as a schoolboy by pairing $1 + 20$, $2 + 19$, and so on: ten pairs of 21.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A zigzag of triangles',
              prompt: r`Triangles in a row, each sharing a side with the next, need $3, 5, 7, 9, \dots$ matchsticks. How many triangles can you make with **101** matchsticks?`,
              unit: 'triangles',
              answer: 50,
              wrong: [{ v: 33, why: 'Neighbouring triangles share a side, so each new one needs only 2 more matches.' }, { v: 51, why: r`The rule is $2n + 1$. Solve $2n + 1 = 101$.` }],
              explain: r`The pattern rises by 2 and starts at 3, so it's $2n + 1$. Solving $2n + 1 = 101$ gives $n = 50$ triangles. Finding the rule turns a counting puzzle into a one-line equation.`,
            },
          ],
          recap: [
            'A pattern growing by d each step has rule dn + (first term − d).',
            'Linear patterns lie on a straight line.',
            'Triangular numbers: n(n + 1)/2, found by pairing two copies.',
          ],
        },
        {
          id: 'tricks',
          title: 'Why the Tricks Work',
          summary: 'Algebra as proof',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A mind-reading trick',
              body: r`*Think of a number. Double it. Add 10. Halve the result. Take away the number you first thought of.* Try any starting number.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2.2, grid: false, axes: false, height: 150,
                params: { n: { min: 1, max: 99, step: 1, value: 7, label: 'your number', color: 'blue' } },
                extra: (ctx) => chain(ctx, [[`${ctx.p.n}`, 'n'], [`${2 * ctx.p.n}`, '2n'], [`${2 * ctx.p.n + 10}`, '2n + 10'], [`${ctx.p.n + 5}`, 'n + 5'], ['5', '5', true]], ['×2', '+10', '÷2', '−n']),
                readout: () => 'The answer is always **5**.',
              },
              after: r`The purple line follows a letter $n$ through the trick: $n \to 2n \to 2n + 10 \to n + 5 \to 5$. The $n$ disappears at the last step, so the answer can't depend on it. Checking a few numbers suggests the trick works; the algebra **proves** it works for every number.`,
            },
            {
              type: 'interactive',
              title: 'Design your own trick',
              prompt: r`*Think of a number $n$. Multiply by 3. Add $k$. Divide by 3. Take away $n$.* Choose $k$ so that the answer is always **4**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2.2, grid: false, axes: false, height: 150,
                params: {
                  k: { min: 0, max: 20, step: 1, value: 5, label: '$k$', color: 'coral' },
                  n: { min: 1, max: 50, step: 1, value: 10, label: 'test number', color: 'blue' },
                },
                extra: (ctx) => {
                  const { n, k } = ctx.p;
                  return chain(ctx, [[`${n}`, 'n'], [`${3 * n}`, '3n'], [`${3 * n + k}`, `3n + ${k}`], [fix((3 * n + k) / 3, 2), `n + ${k}/3`], [fix(k / 3, 2), `${k}/3`, k === 12]], ['×3', `+${k}`, '÷3', '−n']);
                },
                readout: (p) => (p.k === 12 ? 'The answer is **4.00** whatever number you start with.' : `The answer is **${fix(p.k / 3, 2)}** for every starting number: not 4 yet.`),
                goal: (p) => p.k === 12,
                solution: { k: 12 },
                hint: r`Follow $n$: $3n$, then $3n + k$, then $n + \frac{k}{3}$, then $\frac{k}{3}$.`,
              },
              explain: r`$n \to 3n \to 3n + k \to n + \frac{k}{3} \to \frac{k}{3}$. For the answer to be 4 you need $\frac{k}{3} = 4$, so $k = 12$. Algebra lets you **design** tricks, not just check them.`,
            },
            {
              type: 'numeric',
              title: 'Five in a row',
              prompt: r`The sum of any five consecutive whole numbers, $n + (n + 1) + (n + 2) + (n + 3) + (n + 4)$, is always a multiple of which number? (Give the largest such number that works for every $n$.)`,
              answer: 5,
              wrong: [{ v: 10, why: r`The sum is $5n + 10 = 5(n + 2)$. For $n = 1$ that's 15, which isn't a multiple of 10.` }, { v: 2, why: r`$1 + 2 + 3 + 4 + 5 = 15$ is odd, so it isn't always even.` }],
              explain: r`Collect like terms: $5n + 10 = 5(n + 2)$. Factoring reveals a factor of 5, and more: the sum is 5 times the **middle** number, $n + 2$. For example, $11 + 12 + 13 + 14 + 15 = 5 \times 13 = 65$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Odd numbers between squares',
              body: r`To grow an $n \times n$ square of tiles into an $(n + 1) \times (n + 1)$ square, add an L-shaped layer.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 9.5, ymin: -0.5, ymax: 9.5, grid: false, axes: false, maxWidth: 360,
                params: { n: { min: 1, max: 8, step: 1, value: 4, label: '$n$', color: 'blue' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let i = 0; i <= p.n; i++) for (let j = 0; j <= p.n; j++) {
                    const layer = i === p.n || j === p.n;
                    els.push(s('rect', { x: plot.X(i) + 1.5, y: plot.Y(j + 1) + 1.5, width: plot.X(1) - plot.X(0) - 3, height: plot.Y(0) - plot.Y(1) - 3, rx: 3, class: layer ? 'fl-coral' : 'fl-blue', opacity: layer ? 0.9 : 0.45 }));
                  }
                  return els;
                },
                readout: (p) => r`$${p.n + 1}^2 - ${p.n}^2 = ${(p.n + 1) ** 2} - ${p.n * p.n} = ${2 * p.n + 1}$ coral tiles $= 2 \times ${p.n} + 1$`,
              },
              after: r`The L-shaped layer has $n$ tiles along one side, $n$ along the other, and 1 in the corner: $2n + 1$, an odd number. In algebra, $(n + 1)^2 - n^2 = n^2 + 2n + 1 - n^2 = 2n + 1$. So the square numbers are sums of odd numbers: $1 + 3 + 5 + \dots + (2n - 1) = n^2$.`,
            },
            {
              type: 'numeric',
              title: 'Without squaring',
              prompt: r`What is $50^2 - 49^2$? (No need to square anything.)`,
              answer: 99,
              wrong: [{ v: 1, why: r`The squares differ by much more than the numbers do: $(n + 1)^2 - n^2 = 2n + 1$.` }, { v: 101, why: r`Here $n = 49$, so $2n + 1 = 99$.` }],
              explain: r`With $n = 49$: $2 \times 49 + 1 = 99$. Or use the difference of two squares: $(50 + 49)(50 - 49) = 99 \times 1 = 99$.`,
            },
            {
              type: 'mcq',
              title: 'Next-door neighbours',
              prompt: r`Why is the product of two consecutive whole numbers, $n(n + 1)$, always even?`,
              choices: [
                { t: 'One of any two consecutive numbers is even, and an even number times anything is even', ok: true },
                { t: r`Because $n(n + 1) = n^2 + n$, and a square is always even`, why: r`Squares aren't always even: $3^2 = 9$. (But $n^2 + n$ is: $n^2$ and $n$ are both odd or both even.)` },
                { t: 'Because it’s true for 1 × 2, 2 × 3 and 3 × 4', why: 'Checking examples suggests a pattern, but doesn’t prove it for every n.' },
              ],
              explain: r`Of two neighbours, one is even: if $n$ is odd, then $n + 1$ is even. An even factor makes the whole product even. (This is also why every triangular number $\frac{n(n + 1)}{2}$ is a whole number.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Reversed digits',
              prompt: r`Take a two-digit number $10a + b$ (digits $a$ and $b$, with $a > b$), reverse it to get $10b + a$, and subtract. The difference is $9(a - b)$. If the difference is **63**, what is $a - b$?`,
              answer: 7,
              wrong: [{ v: 9, why: r`63 is $9 \times 7$: divide the difference by 9.` }, { v: 63, why: r`The difference is $9(a - b)$, so $a - b = 63 \div 9$.` }],
              explain: r`$(10a + b) - (10b + a) = 9a - 9b = 9(a - b)$, so $a - b = 63 \div 9 = 7$: for example $81 - 18 = 63$ or $92 - 29 = 63$. This is why the difference is always a multiple of 9, a classic "magic" trick explained in one line.`,
            },
          ],
          recap: [
            'Following a letter through a trick proves it works for every number.',
            'Factoring reveals hidden structure, like “always a multiple of 5”.',
            '(n + 1)² − n² = 2n + 1: consecutive squares differ by odd numbers.',
          ],
        },
        {
          id: 'identities',
          title: 'Is It Always True?',
          summary: 'Identities and counterexamples',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'Identities and equations',
              body: r`An **identity** is true for **every** value of the letters, like $2(x + 3) = 2x + 6$. An equation like $2x + 6 = 10$ is true only for some values (here $x = 2$).

Two ways to check a claimed identity:
- **Test values.** A single value where the two sides differ (a **counterexample**) proves the claim false. Values that work only make it *plausible*.
- **Algebra.** Expanding and simplifying one side into the other proves it true for every value.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Graphs of both sides',
              body: r`Each claim compares two expressions. The {blue:blue} curve is the left side, the {coral:coral dashed} curve the right side. An identity's two curves lie exactly on top of each other.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 4, ymin: -6, ymax: 16, grid: 1, gridY: 2, height: 330, axes: { xlabel: 'x', yticks: 4, xAt: -4, xticksBelow: true, xlabelBelow: 'edge' },
                params: { k: { min: 0, max: 3, step: 1, value: 0, label: 'claim', color: 'violet', format: (v) => CLAIMS[v].name } },
                curves: [{ f: (x, p) => CLAIMS[p.k].L(x), color: 'blue', width: 4 }, { f: (x, p) => CLAIMS[p.k].R(x), color: 'coral', dash: true }],
                readout: (p) => (CLAIMS[p.k].id ? 'The curves match everywhere: an **identity**.' : `The curves differ, e.g. at $x = 1$: ${CLAIMS[p.k].L(1)} vs ${CLAIMS[p.k].R(1)}. **Not** an identity.`),
              },
              after: r`$(x + 1)^2$ and $x^2 + 1$ agree only at $x = 0$: the missing $2x$ term pulls them apart. $(2x)^2 = 4x^2$, not $2x^2$: the power applies to the 2 as well.`,
            },
            {
              type: 'multi',
              title: 'Spot the identities',
              prompt: 'Which of these are true for every value of the letters?',
              choices: [
                { t: r`$3(x - 2) = 3x - 6$`, ok: true },
                { t: r`$x^2 \cdot x^3 = x^5$`, ok: true },
                { t: r`$(x + y)^2 = x^2 + y^2$`, why: r`Counterexample: $x = y = 1$ gives $4 \ne 2$. The $2xy$ term is missing.` },
                { t: r`$\frac{x + 4}{2} = x + 2$`, why: r`Only half of $x$: $\frac{x + 4}{2} = \frac{x}{2} + 2$. Try $x = 2$: $3 \ne 4$.` },
                { t: r`$(x - 1)(x + 1) = x^2 - 1$`, ok: true },
              ],
              explain: r`The true ones follow from the distributive law, the rule for multiplying powers, and the difference of two squares. The false ones each fail at a simple test value. Dividing a sum by 2 halves **every** term, just as multiplying does.`,
            },
            {
              type: 'numeric',
              title: 'Roots don’t split',
              prompt: r`Is $\sqrt{a^2 + b^2} = a + b$? Test it: work out $\sqrt{9 + 16}$.`,
              answer: 5,
              wrong: [{ v: 7, why: r`That's $\sqrt 9 + \sqrt{16} = 3 + 4$. The root of a sum isn't the sum of the roots: add first, then take the root.` }],
              explain: r`$\sqrt{25} = 5$, but $3 + 4 = 7$. So $\sqrt{a^2 + b^2} \ne a + b$ in general. Geometrically, it's Pythagoras: the hypotenuse (5) is shorter than the two legs added together (7).`,
            },
            {
              type: 'interactive',
              title: 'Repair the claim',
              prompt: r`The claim $(x + 3)^2 = x^2 + kx + 9$ is true for every $x$ for just one value of $k$. Find it: the two curves should lie on top of each other.`,
              widget: {
                kind: 'graph', xmin: -8, xmax: 3, ymin: -6, ymax: 30, grid: 1, gridY: 5, height: 320, axes: { xlabel: 'x', yticks: 5, xAt: -8, xticksBelow: true, xlabelBelow: 'edge' },
                params: { k: { min: 0, max: 12, step: 1, value: 3, label: '$k$', color: 'coral' } },
                curves: [{ f: (x) => (x + 3) ** 2, color: 'blue', width: 4 }, { f: (x, p) => x * x + p.k * x + 9, color: 'coral', dash: true }],
                readout: (p) => r`at $x = 1$: $(1 + 3)^2 = 16$, $1 + ${p.k} + 9 = ${10 + p.k}$`,
                goal: (p) => p.k === 6,
                solution: { k: 6 },
                hint: r`$(x + 3)^2 = (x + 3)(x + 3)$ has two $3x$ terms.`,
              },
              explain: r`$(x + 3)^2 = x^2 + 3x + 3x + 9 = x^2 + 6x + 9$, so $k = 6$. A single test value can also find $k$: at $x = 1$ the left side is 16, so $10 + k = 16$. But only the algebra shows it then works for **every** $x$.`,
            },
            {
              type: 'mcq',
              title: 'When does the wrong formula work?',
              prompt: r`For which numbers is $(a + b)^2 = a^2 + b^2$ actually true?`,
              choices: [
                { t: r`Exactly when $a = 0$ or $b = 0$`, ok: true },
                { t: 'Never', why: r`Try $a = 0$: $(0 + b)^2 = b^2 = 0^2 + b^2$ ✓.` },
                { t: 'Whenever a and b are equal', why: r`$a = b = 1$: $(1 + 1)^2 = 4$ but $1 + 1 = 2$.` },
                { t: 'For all positive numbers', why: r`$a = b = 1$ is a positive counterexample.` },
              ],
              explain: r`$(a + b)^2 = a^2 + 2ab + b^2$, which equals $a^2 + b^2$ exactly when $2ab = 0$, that is, when $a = 0$ or $b = 0$. An equation between expressions that isn't an identity can still be true for special values: solving it means finding them.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'An identity in disguise',
              prompt: r`Simplify $(n + 2)^2 - (n - 2)^2$ for every $n$. It equals $cn$ for some number $c$. What is $c$?`,
              answer: 8,
              wrong: [{ v: 0, why: r`The $n^2$ terms cancel, but the middle terms don't: $+4n - (-4n) = 8n$.` }, { v: 4, why: r`Subtracting $-4n$ adds $4n$: $4n + 4n = 8n$.` }, { v: 16, why: r`The constants cancel: $4 - 4 = 0$. The $n$ terms give $8n$.` }],
              explain: r`$(n^2 + 4n + 4) - (n^2 - 4n + 4) = 8n$. Check: $n = 5$ gives $49 - 9 = 40 = 8 \times 5$ ✓. Or use the difference of two squares directly: $\big((n + 2) + (n - 2)\big)\big((n + 2) - (n - 2)\big) = 2n \times 4 = 8n$.`,
            },
          ],
          recap: [
            'An identity holds for every value; one counterexample disproves a claim.',
            'Testing values can disprove; only algebra proves for all values.',
            'Classic false friends: (a + b)² ≠ a² + b², √(a² + b²) ≠ a + b.',
          ],
        },
      ],
    },
  ],
};
