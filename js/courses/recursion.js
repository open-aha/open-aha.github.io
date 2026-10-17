import { fix } from '../lib/svg.js';

const r = String.raw;
const collatz = (n) => {
  const s = [n];
  while (n !== 1) {
    n = n % 2 ? 3 * n + 1 : n / 2;
    s.push(n);
  }
  return s;
};

// Tower of Hanoi with 4 discs: peg states after each move
const HANOI = (() => {
  const pegs = [[4, 3, 2, 1], [], []], states = [pegs.map((p) => p.slice())];
  const move = (n, a, b, c) => { if (!n) return; move(n - 1, a, c, b); pegs[b].push(pegs[a].pop()); states.push(pegs.map((p) => p.slice())); move(n - 1, c, b, a); };
  move(4, 0, 2, 1);
  return states;
})();
// drug level after n doses: half eliminated each day, then dose D added
const drug = (D, n) => { let a = 0; for (let i = 0; i < n; i++) a = 0.5 * a + D; return a; };
// all domino tilings of a 2 × n strip: 'V' = vertical domino, 'H' = two stacked horizontals
const tilings = (n) => (n === 0 ? [''] : n === 1 ? ['V'] : [...tilings(n - 1).map((t) => t + 'V'), ...tilings(n - 2).map((t) => t + 'H')]);
const tileCount = (n) => { let a = 1, b = 1; for (let i = 1; i < n; i++) [a, b] = [b, a + b]; return b; };

export default {
  id: 'recursion',
  subject: 'math',
  title: 'Recursion & Recurrences',
  level: 'Intermediate',
  cover: 'recursion',
  tagline: 'Solving problems in terms of smaller versions of themselves.',
  description: r`Some problems are easiest to solve by assuming you can already solve a smaller version. Crack the Tower of Hanoi, turn step-by-step rules into closed formulas, find a formula for the Fibonacci numbers, meet the Collatz conjecture (a recursive puzzle nobody has solved), find where repeated processes settle, and count tilings and brackets recursively.`,
  prereq: 'Sequences & Series',
  chapters: [
    {
      title: 'Thinking Recursively',
      summary: 'Big problems from small ones.',
      lessons: [
        {
          id: 'hanoi',
          title: 'The Tower of Hanoi',
          summary: 'Move the stack',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'The puzzle',
              body: r`Three pegs; a stack of $n$ discs on the first, largest at the bottom. Move the whole stack to the third peg, one disc at a time, **never** placing a larger disc on a smaller one.

The recursive insight: to move $n$ discs, first move the top $n - 1$ discs out of the way (to the middle peg), then move the biggest disc, then move the $n - 1$ discs back on top of it. If $M(n)$ is the minimum number of moves:
$$M(n) = 2M(n - 1) + 1, \qquad M(1) = 1$$`,
            },
            {
              type: 'numeric',
              title: 'Four discs',
              prompt: r`Using $M(n) = 2M(n - 1) + 1$ with $M(1) = 1$, what is $M(4)$?`,
              answer: 15,
              wrong: [{ v: 8, why: r`Build up step by step: $M(2) = 3$, $M(3) = 7$, then $M(4) = 2 \times 7 + 1$.` }, { v: 16, why: r`Close! $M(4) = 2^4 - 1$.` }, { v: 7, why: r`That's $M(3)$. One more step: $2 \times 7 + 1$.` }],
              explain: r`$M(1) = 1$, $M(2) = 3$, $M(3) = 7$, $M(4) = 15$. The pattern is $M(n) = 2^n - 1$. You can check it satisfies the rule: $2(2^{n-1} - 1) + 1 = 2^n - 1$ ✓.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch it solve',
              body: r`Step through the 15-move solution for 4 discs.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 9, ymin: 0, ymax: 3.2, grid: false, axes: false, height: 200,
                params: { k: { min: 0, max: 15, step: 1, value: 0, label: 'move', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const st = HANOI[p.k], els = [s('rect', { x: plot.X(0.2), y: plot.Y(0.2), width: plot.X(8.8) - plot.X(0.2), height: 6, class: 'fl-ink' })];
                  [1.5, 4.5, 7.5].forEach((x, i) => {
                    els.push(s('rect', { x: plot.X(x) - 3, y: plot.Y(2.9), width: 6, height: plot.Y(0.2) - plot.Y(2.9), class: 'fl-muted' }));
                    st[i].forEach((d, j) => els.push(s('rect', { x: plot.X(x - 0.3 * d - 0.1), y: plot.Y(0.2 + 0.55 * (j + 1)), width: plot.X(0.6 * d + 0.2) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), rx: 6, class: ['fl-blue', 'fl-teal', 'fl-amber', 'fl-coral'][d - 1] })));
                  });
                  return els;
                },
                readout: (p) => `move ${p.k} of 15${p.k === 8 ? ': the biggest disc has just moved, exactly halfway through' : ''}`,
              },
              after: r`The first 7 moves shift the top three discs to the middle peg, move 8 shifts the big disc, and the last 7 rebuild the three on top. The smallest disc moves every other turn.`,
            },
            {
              type: 'numeric',
              title: 'The smallest disc',
              prompt: r`In the optimal solution for $n$ discs, the smallest disc moves on every odd-numbered move. How many times does it move when $n = 10$?`,
              answer: 2 ** 9,
              wrong: [{ v: 1023, why: 'That’s all the moves. The smallest disc makes every other one.' }, { v: 10, why: 'It moves far more often: every second move.' }],
              explain: r`Out of $2^{10} - 1 = 1023$ moves, the odd-numbered ones (1st, 3rd, …, 1023rd) are the smallest disc's: $512 = 2^9$ of them. The largest disc moves just once.`,
            },
            {
              type: 'numeric',
              title: 'Ten discs',
              prompt: r`Moving $n$ discs takes $2^n - 1$ moves. How many moves for 10 discs?`,
              answer: 1023,
              explain: r`$2^{10} - 1 = 1{,}023$. Adding one disc doubles the work (plus one): move $n - 1$ discs aside, move the largest, move them back on top.`,
            },
            {
              type: 'mcq',
              title: 'The legend',
              prompt: r`A legend tells of monks moving 64 golden discs, one per second, and says the world will end when they finish. How long would it take?`,
              choices: [
                { t: 'About 585 billion years', ok: true },
                { t: 'About 64 seconds', why: r`It takes $2^{64} - 1$ moves, not 64.` },
                { t: 'About 2 years', why: r`$2^{64} \approx 1.8 \times 10^{19}$ seconds is vastly longer than that.` },
              ],
              explain: r`$2^{64} - 1 \approx 1.8 \times 10^{19}$ seconds $\approx 585$ billion years, over 40 times the current age of the universe. Exponential growth hides in simple recursive rules.`,
            },
          ],
          recap: [
            'Recursion: solve a problem using solutions to smaller versions.',
            r`Tower of Hanoi: $M(n) = 2M(n-1) + 1 = 2^n - 1$.`,
            '64 discs would take 585 billion years.',
          ],
        },
        {
          id: 'recurrences',
          title: 'Solving Recurrences',
          summary: 'From rule to formula',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Closed forms',
              body: r`A **recurrence** defines each term from earlier ones, like $a_n = 3a_{n-1} - 2$. A **closed form** gives $a_n$ directly. A good method: compute a few terms, guess a pattern, then **prove** it fits the rule (by induction).

For $a_n = 3a_{n-1} - 2$ with $a_0 = 4$: the terms are $4, 10, 28, 82, \dots$ Each is one more than a power of 3: $a_n = 3^{n+1} + 1$.`,
            },
            {
              type: 'numeric',
              title: 'Use the formula',
              prompt: r`With $a_n = 3^{n+1} + 1$, what is $a_5$?`,
              answer: 730,
              wrong: [{ v: 244, why: r`That's $a_4 = 3^5 + 1$. For $a_5$ you need $3^6 + 1$.` }, { v: 729, why: r`Don't forget the $+1$.` }],
              explain: r`$a_5 = 3^6 + 1 = 730$. Check with the rule: $a_4 = 244$, and $3 \times 244 - 2 = 730$ ✓.`,
            },
            {
              type: 'mcq',
              title: 'Check the guess',
              prompt: r`To prove $a_n = 3^{n+1} + 1$ satisfies $a_n = 3a_{n-1} - 2$, substitute the formula for $a_{n-1}$. What do you get?`,
              choices: [
                { t: r`$3(3^n + 1) - 2 = 3^{n+1} + 1$ ✓`, ok: true },
                { t: r`$3(3^{n+1} + 1) - 2 = 3^{n+2} + 1$`, why: r`For $a_{n-1}$, the exponent is $(n - 1) + 1 = n$, so $a_{n-1} = 3^n + 1$.` },
                { t: r`$3 \cdot 3^n - 2 = 3^{n+1} - 2$`, why: r`Remember the $+1$ in $a_{n-1} = 3^n + 1$.` },
              ],
              explain: r`$3a_{n-1} - 2 = 3(3^n + 1) - 2 = 3^{n+1} + 3 - 2 = 3^{n+1} + 1 = a_n$ ✓. Together with $a_0 = 4$ ✓, induction proves the formula for every $n$.`,
            },
            {
              type: 'numeric',
              title: 'A million moves',
              prompt: r`The Tower of Hanoi with $n$ discs needs $2^n - 1$ moves. What is the smallest number of discs that needs **more than a million** moves?`,
              unit: 'discs',
              answer: 20,
              wrong: [{ v: 19, why: r`$2^{19} - 1 = 524{,}287$: not yet a million.` }],
              explain: r`$2^{19} - 1 = 524{,}287$ falls short, but $2^{20} - 1 = 1{,}048{,}575$ passes a million: **20 discs**. The closed form answers this instantly; stepping through the recurrence would take 20 rounds of doubling.`,
            },
            {
              type: 'interactive',
              title: 'Fit the closed form',
              body: r`The recurrence $a_n = 3a_{n-1} - 2$ with $a_0 = 5$ has a fixed point at $1$ (since $1 = 3 \times 1 - 2$), so try $a_n = A \cdot 3^n + 1$. The dots are the true terms. Choose $A$ to make the curve pass through all of them.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5.3, ymin: 0, ymax: 1000, grid: false, height: 280, axes: { xlabel: 'n', ylabel: 'a_n', xticks: 1, yticks: 200 },
                params: { A: { min: 0, max: 8, step: 0.5, value: 2, label: 'A', color: 'coral', format: (v) => v.toFixed(1) } },
                curves: [{ f: (x, p) => p.A * 3 ** x + 1, color: 'coral', width: 2.5 }],
                extra: ({ plot, s }) => { let a = 5; const out = []; for (let n = 0; n <= 5; n++) { out.push(s('circle', { cx: plot.X(n), cy: plot.Y(Math.min(a, 1100)), r: 6, class: 'fl-violet' })); a = 3 * a - 2; } return out; },
                readout: (p) => { let a = 5; const t = [], g = []; for (let n = 0; n <= 5; n++) { t.push(a); g.push(p.A * 3 ** n + 1); a = 3 * a - 2; } return `true: ${t.join(', ')} · formula: ${g.map((v) => fix(v, 1)).join(', ')}`; },
                goal: (p) => p.A === 4,
                hint: 'At n = 0 the formula gives A + 1, and that must equal 5.',
                solution: { A: 4 },
              },
              explain: r`$A = 4$, so $a_n = 4 \cdot 3^n + 1$. The starting value fixes $A$; the fixed point fixes the $+1$. Every linear recurrence $a_n = r\,a_{n-1} + c$ (with $r \ne 1$) works this way: a geometric part plus a constant.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Your own closed form',
              prompt: r`The recurrence $b_n = 2b_{n-1} + 3$ with $b_0 = 0$ gives $0, 3, 9, 21, 45, \dots$ These are $3(2^n - 1)$. What is $b_{10}$?`,
              answer: 3 * (2 ** 10 - 1),
              wrong: [{ v: 3 * 2 ** 10, why: 'Subtract 1 before multiplying: 3(2¹⁰ − 1).' }],
              explain: r`$3(1024 - 1) = 3069$. The Tower of Hanoi's recurrence is the same shape: $M(n) = 2M(n-1) + 1$ gives $2^n - 1$.`,
            },
          ],
          recap: [
            'A recurrence defines terms from earlier terms. A closed form gives them directly.',
            'Guess from the first few terms, then prove by induction.',
            r`$a_n = 3a_{n-1} - 2$, $a_0 = 4$ gives $a_n = 3^{n+1} + 1$.`,
          ],
        },
      ],
    },
    {
      title: 'Famous Recurrences',
      summary: 'Fibonacci and Collatz.',
      lessons: [
        {
          id: 'binet',
          title: 'A Formula for Fibonacci',
          summary: 'Binet’s formula',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Guess an exponential',
              body: r`The Fibonacci rule is $F_n = F_{n-1} + F_{n-2}$, with $F_0 = 0$, $F_1 = 1$. Try $F_n = x^n$: then $x^n = x^{n-1} + x^{n-2}$, so $x^2 = x + 1$, giving
$$x = \varphi = \frac{1 + \sqrt5}{2} \approx 1.618 \qquad\text{or}\qquad x = \psi = \frac{1 - \sqrt5}{2} \approx -0.618$$
Any combination of $\varphi^n$ and $\psi^n$ obeys the rule. Matching $F_0 = 0$ and $F_1 = 1$ gives **Binet's formula**:
$$F_n = \frac{\varphi^n - \psi^n}{\sqrt5}$$`,
            },
            {
              type: 'numeric',
              title: 'Check it',
              prompt: r`Since $|\psi| < 1$, the term $\psi^n$ shrinks fast, so $F_n$ is the nearest whole number to $\varphi^n/\sqrt5$. Compute $\varphi^{10}/\sqrt5$ and round it: what is $F_{10}$?`,
              answer: 55,
              wrong: [{ v: 89, why: r`That's $F_{11}$. Check: $\varphi^{10} \approx 122.99$, divided by $\sqrt5 \approx 2.236$.` }, { v: 123, why: r`That's $\varphi^{10}$ itself. Divide by $\sqrt5$.` }],
              explain: r`$\varphi^{10} \approx 122.99$, and $122.99 / 2.236 \approx 55.004$, which rounds to **55** ✓ ($0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55$). Irrational numbers combine to give whole numbers every time!`,
            },
            {
              type: 'numeric',
              title: 'Ratios approach φ',
              prompt: r`Compute $\frac{F_{13}}{F_{12}} = \frac{233}{144}$ to 4 decimal places.`,
              answer: 233 / 144,
              tol: 0.00006,
              wrong: [{ v: 144 / 233, tol: 0.0001, why: 'Divide the larger by the smaller.' }],
              explain: r`$\frac{233}{144} \approx 1.6181$, while $\varphi \approx 1.6180$. Since $\psi^n \to 0$, the ratio of consecutive terms tends to $\varphi$, the dominant growth rate.`,
            },
            {
              type: 'mcq',
              title: 'Same method, new rule',
              prompt: r`For the recurrence $a_n = a_{n-1} + 2a_{n-2}$, which equation gives the possible growth rates $x$?`,
              choices: [
                { t: r`$x^2 = x + 2$, so $x = 2$ or $x = -1$`, ok: true },
                { t: r`$x^2 = 2x + 1$`, why: r`Substitute $a_n = x^n$: $x^n = x^{n-1} + 2x^{n-2}$, then divide by $x^{n-2}$.` },
                { t: r`$x = 3$`, why: r`Substitute $x^n$ into the rule and divide by $x^{n-2}$ to get a quadratic.` },
              ],
              explain: r`$x^2 = x + 2$ factors as $(x - 2)(x + 1) = 0$. So $a_n = A \cdot 2^n + B(-1)^n$, with $A$ and $B$ fixed by the starting values. This "characteristic equation" method solves every linear recurrence with constant coefficients, and it's the same idea as eigenvalues in Linear Algebra.`,
            },
            {
              type: 'interactive',
              title: 'The magic ratio',
              body: r`Try $F_n = r^n$ in $F_n = F_{n-1} + F_{n-2}$. Dividing by $r^{n-2}$ leaves $r^2 = r + 1$, i.e. $r^2 - r - 1 = 0$. Find the positive $r$ that makes it work.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2.5, ymin: -1.5, ymax: 2.5, grid: false, height: 260, axes: { xlabel: 'r', ylabel: 'r² − r − 1', xticks: 0.5, yticks: 0.5 },
                params: { r: { min: 0, max: 2.5, step: 0.001, value: 1.2, label: 'r', color: 'coral', format: (v) => v.toFixed(3) } },
                curves: [{ f: (x) => x * x - x - 1, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.r, y: (p) => p.r * p.r - p.r - 1, color: 'coral' }],
                readout: (p) => `r² = **${(p.r * p.r).toFixed(3)}** · r + 1 = **${(p.r + 1).toFixed(3)}** · terms r³, r⁴, r⁵: ${[3, 4, 5].map((k) => (p.r ** k).toFixed(2)).join(', ')} (is each the sum of the two before?)`,
                goal: (p) => Math.abs(p.r - 1.618) < 0.004,
                hint: 'Find where the curve crosses zero.',
                solution: { r: 1.618 },
              },
              explain: r`$r = \frac{1 + \sqrt5}{2} \approx 1.618$, the golden ratio $\varphi$. The other root, $\psi = \frac{1 - \sqrt5}{2} \approx -0.618$, also works, and Binet’s formula combines them: $F_n = \frac{\varphi^n - \psi^n}{\sqrt5}$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The 20th Fibonacci number',
              prompt: r`Binet’s formula says $F_n$ is the whole number nearest to $\frac{\varphi^n}{\sqrt5}$, with $\varphi \approx 1.618$. What is $F_{20}$?`,
              answer: 6765,
              explain: r`$\frac{1.618^{20}}{2.236} \approx 6765.0$: exact to the nearest whole number, as always, because the other term $\frac{\psi^n}{\sqrt5}$ (with $\psi \approx -0.618$) shrinks to almost nothing.`,
            },
          ],
          recap: [
            r`Try $a_n = x^n$ to turn a linear recurrence into a polynomial equation.`,
            r`Binet: $F_n = (\varphi^n - \psi^n)/\sqrt5$.`,
            r`$F_n$ is the integer nearest to $\varphi^n/\sqrt5$.`,
          ],
        },
        {
          id: 'collatz',
          title: 'The Collatz Conjecture',
          summary: 'A simple rule nobody understands',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Half or triple plus one',
              body: r`Pick any positive whole number. If it's even, halve it. If it's odd, triple it and add 1. Repeat. For example:
$$6 \to 3 \to 10 \to 5 \to 16 \to 8 \to 4 \to 2 \to 1$$
The **Collatz conjecture** (1937) says every starting number eventually reaches 1.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hailstone numbers',
              body: r`Pick a starting number and watch its path (plotted on a logarithmic scale). The values rise and fall like hailstones in a storm cloud.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 120, ymin: 0, ymax: 4.2, grid: 10, gridY: 1, height: 300, padL: 60, axes: { xlabel: 'step', ylabel: 'value', yfmt: (v) => `${10 ** v}` },
                params: { n: { min: 2, max: 100, step: 1, value: 27, label: 'start', color: 'violet', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const seq = collatz(p.n);
                  const d = seq.map((v, i) => `${i ? 'L' : 'M'}${plot.X(i).toFixed(1)} ${plot.Y(Math.log10(v)).toFixed(1)}`).join('');
                  return [s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }), ...seq.map((v, i) => s('circle', { cx: plot.X(i), cy: plot.Y(Math.log10(v)), r: 2.5, class: v % 2 ? 'fl-coral' : 'fl-blue' }))];
                },
                readout: (p) => {
                  const seq = collatz(p.n);
                  return `start ${p.n}: reaches 1 after **${seq.length - 1}** steps, peaking at **${Math.max(...seq).toLocaleString('en-US')}**`;
                },
              },
              after: r`Starting from 27, the path climbs as high as 9,232 and takes 111 steps before it finally falls to 1. Neighbouring numbers can behave completely differently: 28 takes just 18 steps.`,
            },
            {
              type: 'numeric',
              title: 'Count the steps',
              prompt: r`How many steps does it take to get from 7 to 1?`,
              unit: 'steps',
              answer: 16,
              wrong: [{ v: 17, why: 'Count the arrows, not the numbers: 7 → 22 → 11 → … → 1.' }, { v: 52, why: 'That’s the highest value reached, not the number of steps.' }],
              explain: r`$7 \to 22 \to 11 \to 34 \to 17 \to 52 \to 26 \to 13 \to 40 \to 20 \to 10 \to 5 \to 16 \to 8 \to 4 \to 2 \to 1$: **16** steps.`,
            },
            {
              type: 'numeric',
              title: 'Starting from 6',
              prompt: r`How many steps does the Collatz rule (halve if even, $3n + 1$ if odd) take to get from 6 down to 1?`,
              unit: 'steps',
              answer: 8,
              wrong: [{ v: 7, why: r`Count the arrows: there are eight moves.` }],
              explain: r`$6 \to 3 \to 10 \to 5 \to 16 \to 8 \to 4 \to 2 \to 1$: **8** steps. Nearby, 27 takes 111 steps, climbing to 9232 on the way.`,
            },
            {
              type: 'numeric',
              title: 'Nine’s journey',
              prompt: r`Starting from 9, how many steps does the Collatz rule take to reach 1? (Hint: watch for a number whose path you already know.)`,
              answer: 19,
              wrong: [{ v: 16, why: r`That's the count from 7. Count the steps from 9 to 7 first.` }],
              explain: r`$9 \to 28 \to 14 \to 7$ takes 3 steps, and from 7 we already know it takes 16 more: **19 steps** in total. Paths merge like rivers, which is why mapping them all (the "Collatz tree") is so tempting, and so hard.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Is it proved?',
              prompt: r`Computers have checked every starting number up to about $2.95 \times 10^{20}$, and all of them reach 1. Is the conjecture proved?`,
              choices: [
                { t: 'No: checking examples, however many, can’t rule out a counterexample further on', ok: true },
                { t: 'Yes: that’s more than enough evidence', why: 'In mathematics, a pattern isn’t proved until it’s proved for every number. Remember the circle-regions pattern that broke at 6!' },
                { t: 'It was disproved in 2019', why: 'No counterexample has ever been found. In 2019 Terence Tao proved that “almost all” numbers come close to 1, but not that all reach it.' },
              ],
              explain: r`Despite huge computer searches and deep partial results (such as Terence Tao's 2019 theorem that almost all starting numbers eventually get very small), nobody can prove that **every** number reaches 1. The mathematician Paul Erdős reportedly said mathematics is not yet ready for such problems.`,
            },
          ],
          recap: [
            'Collatz: halve evens, triple odds and add 1. Does every number reach 1?',
            'Paths rise and fall unpredictably: 27 takes 111 steps.',
            'Verified for enormous numbers, but still unproved.',
          ],
        },
      ],
    },
    {
      title: 'Recursion at Work',
      summary: 'Steady states and counting.',
      lessons: [
        {
          id: 'steady',
          title: 'Steady States',
          summary: 'Where a recurrence settles',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Repeated doses',
              body: r`A patient takes a dose $D$ of medicine each morning, and the body removes half of the drug in the bloodstream each day. If $a_n$ is the amount just after the $n$th dose:
$$a_n = \tfrac12 a_{n-1} + D$$
The level climbs, but more slowly each day, levelling off at a **steady state** $a^*$ where $a^* = \frac12 a^* + D$.`,
            },
            {
              type: 'numeric',
              title: 'The steady level',
              prompt: r`With a daily dose of 100 mg, what is the steady-state amount just after each dose?`,
              unit: 'mg',
              answer: 200,
              wrong: [{ v: 100, why: r`Solve $a^* = \frac12 a^* + 100$.` }, { v: 50, why: 'The level builds up beyond a single dose.' }],
              explain: r`$\frac12 a^* = 100$, so $a^* = 200$ mg. Each day, half of the 200 mg (100 mg) is removed and the new dose replaces it exactly.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose the dose',
              prompt: r`A doctor wants the level just after each dose to settle at **300 mg**. Choose the daily dose.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 450, grid: 1, gridY: 50, height: 260, padL: 48, axes: { xlabel: 'day', ylabel: 'amount after dose (mg)' },
                params: { D: { min: 50, max: 220, step: 5, value: 100, label: 'dose', color: 'violet', format: (v) => `${v} mg` } },
                curves: [{ f: () => 300, color: 'coral', dash: true, width: 1.5 }],
                extra: ({ plot, p, s }) => {
                  const pts = Array.from({ length: 13 }, (_, n) => [n, drug(p.D, n)]);
                  return [s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 }), ...pts.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 4, class: 'fl-violet' }))];
                },
                readout: (p) => `dose ${p.D} mg: day 12 level ${drug(p.D, 12).toFixed(0)} mg, heading for **${2 * p.D} mg**`,
                goal: (p) => p.D === 150,
                hint: r`The steady state is $2D$.`,
                solution: { D: 150 },
              },
              explain: r`$D = 150$ mg gives $a^* = 300$ mg. Notice the level gets within 1% of steady state in about a week: the gap halves each day. Doctors sometimes give a larger first "loading dose" to reach the steady level straight away.`,
            },
            {
              type: 'explain',
              title: 'The general rule',
              body: r`For $a_n = k\,a_{n-1} + c$ with $|k| < 1$, the steady state is
$$a^* = \frac{c}{1 - k}$$
and the distance from it shrinks by a factor $k$ each step: $a_n - a^* = k^n(a_0 - a^*)$. If $|k| > 1$, the distance **grows**, and there's no settling down.`,
            },
            {
              type: 'numeric',
              title: 'A fish farm',
              prompt: r`A lake loses 20% of its fish each year, and 400 young fish are added each spring. What population does it settle at? ($k = 0.8$.)`,
              unit: 'fish',
              answer: 2000,
              wrong: [{ v: 500, why: r`$a^* = \frac{400}{1 - 0.8} = \frac{400}{0.2}$.` }, { v: 320, why: 'The steady state is the level where losses equal the additions.' }],
              explain: r`$\frac{400}{0.2} = 2000$ fish: at that size, 20% (400) die each year, exactly balancing the 400 added.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Overshooting',
              prompt: r`What does the sequence $a_n = -0.5\,a_{n-1} + 6$ do, starting from $a_0 = 0$?`,
              choices: [
                { t: 'It overshoots back and forth around 4, getting closer each time', ok: true },
                { t: 'It rises steadily to 4', why: 'With negative k, each step flips the sign of the gap: 0, 6, 3, 4.5, 3.75, …' },
                { t: 'It runs off to infinity', why: '|k| = 0.5 < 1, so it settles.' },
              ],
              explain: r`$a^* = \frac{6}{1.5} = 4$, and the terms go $0, 6, 3, 4.5, 3.75, 4.125, \dots$, zig-zagging inwards. Negative feedback with a delay often overshoots like this, from thermostats to economies.`,
            },
          ],
          recap: [
            r`$a_n = ka_{n-1} + c$ settles at $a^* = c/(1 - k)$ when $|k| < 1$.`,
            r`The gap shrinks by a factor $k$ each step; negative $k$ zig-zags.`,
            'Repeated drug doses build up to a steady state.',
          ],
        },
        {
          id: 'counting',
          title: 'Counting Recursively',
          summary: 'Tilings, strings and brackets',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Dominoes',
              body: r`How many ways can you tile a $2 \times n$ strip with $1 \times 2$ dominoes? Look at the right-hand end: either it's one **vertical** domino (leaving a $2 \times (n-1)$ strip), or two **horizontal** dominoes stacked (leaving $2 \times (n-2)$). So
$$T(n) = T(n-1) + T(n-2), \qquad T(1) = 1,\ T(2) = 2$$
The Fibonacci numbers again!`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Thirteen tilings',
              prompt: r`Change the strip length to see every tiling. Find the length that has exactly **13** tilings.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 22, ymin: 0, ymax: 14, grid: false, axes: false, height: 320,
                params: { n: { min: 1, max: 8, step: 1, value: 3, label: 'length', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const T = tilings(p.n), els = [], u = Math.min(plot.X(1) - plot.X(0), 26);
                  if (T.length > 13) return [s('text', { x: plot.X(11), y: plot.Y(7), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px))', text: `${T.length} tilings: too many to draw!` })];
                  T.forEach((t, idx) => {
                    const col = idx % 3, row = Math.floor(idx / 3), x0 = plot.X(0.3 + col * 7.3), y0 = plot.Y(13.6 - row * 2.75);
                    let x = 0;
                    for (const ch of t) {
                      if (ch === 'V') { els.push(s('rect', { x: x0 + x * u + 1, y: y0 + 1, width: u - 2, height: 2 * u - 2, rx: 3, class: 'fl-blue' })); x += 1; }
                      else { els.push(s('rect', { x: x0 + x * u + 1, y: y0 + 1, width: 2 * u - 2, height: u - 2, rx: 3, class: 'fl-coral' }), s('rect', { x: x0 + x * u + 1, y: y0 + u + 1, width: 2 * u - 2, height: u - 2, rx: 3, class: 'fl-coral' })); x += 2; }
                    }
                  });
                  return els;
                },
                readout: (p) => `a 2 × ${p.n} strip has **${tileCount(p.n)}** tilings`,
                goal: (p) => tileCount(p.n) === 13,
                hint: 'The counts go 1, 2, 3, 5, 8, …',
                solution: { n: 6 },
              },
              explain: r`Length 6 has 13 tilings: 8 ending in a vertical domino (tilings of length 5) plus 5 ending in a horizontal pair (tilings of length 4). Splitting by "how does it end?" is the key recursive move.`,
            },
            {
              type: 'numeric',
              title: 'A longer strip',
              prompt: r`How many domino tilings does a $2 \times 10$ strip have?`,
              answer: tileCount(10),
              wrong: [{ v: 55, why: 'Careful with the starting values: T(1) = 1, T(2) = 2, so T(10) is one step further along.' }, { v: 1024, why: 'Not every choice is independent; use the recurrence.' }],
              explain: r`1, 2, 3, 5, 8, 13, 21, 34, 55, **89**.`,
            },
            {
              type: 'explain',
              title: 'Balanced brackets',
              body: r`How many ways can $n$ pairs of brackets be correctly matched? For 3 pairs: ((())), (()()), (())(), ()(()), ()()(): five ways.

Split by what the **first** bracket encloses: it contains some balanced arrangement of $k$ pairs, followed by a balanced arrangement of the remaining $n - 1 - k$. That gives the **Catalan numbers**:
$$C_n = \sum_{k=0}^{n-1} C_k\, C_{n-1-k}, \qquad C_0 = 1$$
They go 1, 1, 2, 5, 14, 42, …`,
            },
            {
              type: 'numeric',
              title: 'Four pairs',
              prompt: r`Using $C_0 = 1$, $C_1 = 1$, $C_2 = 2$, $C_3 = 5$, compute $C_4 = C_0C_3 + C_1C_2 + C_2C_1 + C_3C_0$.`,
              answer: 14,
              wrong: [{ v: 10, why: 'Add all four products: 5 + 2 + 2 + 5.' }],
              explain: r`$5 + 2 + 2 + 5 = 14$. Catalan numbers also count the ways to triangulate a polygon, the shapes of binary trees, and mountain-range zig-zags that never dip below sea level.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Triangulations',
              prompt: r`A convex hexagon can be cut into triangles by drawing non-crossing diagonals. How many ways are there? (Catalan numbers count triangulations: an $(n + 2)$-sided polygon has $C_n$.)`,
              cols: 4,
              choices: [
                { t: '14', ok: true },
                { t: '5', why: 'That’s a pentagon (n = 3). A hexagon has n = 4.' },
                { t: '6', why: 'Use the Catalan number C₄.' },
                { t: '42', why: 'That’s a heptagon (C₅).' },
              ],
              explain: r`A hexagon has $6 = 4 + 2$ sides, so $C_4 = 14$ triangulations. Euler counted these in 1751, long before Catalan, and the same recursive split (fix one edge, choose the triangle on it) gives the recurrence.`,
            },
          ],
          recap: [
            'Split by how an object ends (or begins) to find a recurrence.',
            r`Domino tilings of a $2 \times n$ strip follow Fibonacci.`,
            'Catalan numbers count balanced brackets, triangulations and trees.',
          ],
        },
        {
          id: 'dragon',
          title: 'The Dragon Curve',
          summary: 'Folding paper, recursively',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Fold, fold, fold',
              body: r`Take a strip of paper and fold it in half, then in half again, always folding the same way. Unfold it so that every crease makes a right angle: the strip traces a zig-zag path. After many folds it becomes a famous fractal, the **dragon curve** (discovered by NASA physicists John Heighway, Bruce Banks and William Harter in the 1960s).

The recursion: the turns after $n + 1$ folds are the turns after $n$ folds, then a right turn, then the earlier turns **reversed and flipped** (left ↔ right).`,
            },
            {
              type: 'numeric',
              title: 'Counting creases',
              prompt: r`Each fold doubles the number of layers, so after $n$ folds the strip has $2^n$ segments. How many creases are there after 3 folds?`,
              answer: 7,
              wrong: [{ v: 8, why: r`$2^3 = 8$ segments are separated by $8 - 1$ creases.` }],
              explain: r`$2^3 = 8$ segments with $8 - 1 = 7$ creases between them. In general $2^n - 1$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Grow the dragon',
              prompt: r`Increase the number of folds and watch the dragon appear. Find the number of folds that gives exactly **255 creases**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 1, ymin: -1, ymax: 1, grid: false, axes: false, maxWidth: 420, pad: 6,
                params: { n: { min: 1, max: 14, step: 1, value: 5, label: 'folds', color: 'violet' } },
                extra: ({ plot, p, s }) => { let T = []; for (let k = 0; k < p.n; k++) T = [...T, 1, ...T.slice().reverse().map((x) => -x)]; let x = 0, y = 0, dx = 1, dy = 0; const P = [[0, 0]]; for (const t of [0, ...T]) { if (t === 1) [dx, dy] = [dy, -dx]; else if (t === -1) [dx, dy] = [-dy, dx]; x += dx; y += dy; P.push([x, y]); } const xs = P.map((q) => q[0]), ys = P.map((q) => q[1]), mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2, sc = 1.8 / Math.max(1, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); return [s('path', { d: P.map(([a, b], i) => `${i ? 'L' : 'M'}${plot.X((a - mx) * sc).toFixed(1)} ${plot.Y((b - my) * sc).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': p.n > 10 ? 1 : 2, 'stroke-linejoin': 'round' })]; },
                readout: (p) => { let T = []; for (let k = 0; k < Math.min(p.n, 5); k++) T = [...T, 1, ...T.slice().reverse().map((x) => -x)]; return `${p.n} folds: **${2 ** p.n} segments**, ${2 ** p.n - 1} creases · turns: ${T.slice(0, 15).map((t) => (t === 1 ? 'R' : 'L')).join(' ')}${2 ** p.n - 1 > 15 ? ' …' : ''}`; },
                goal: (p) => p.n === 8,
                hint: r`$2^n - 1 = 255$.`,
                solution: { n: 8 },
              },
              explain: r`$2^8 - 1 = 255$, so **8 folds**. Remarkably, the curve never crosses itself, and copies of it fit together to tile the whole plane. (Real paper can only be folded about 7 or 8 times, but the recursion goes on forever.)`,
            },
            {
              type: 'mcq',
              title: 'The next sequence',
              prompt: r`After 2 folds the turns are R R L. Using "previous turns, then R, then the previous turns reversed and flipped", what are the turns after 3 folds?`,
              choices: [
                { t: 'R R L R R L L', ok: true },
                { t: 'R R L R R R L', why: r`Reverse R R L to get L R R, then flip each turn: R L L.` },
                { t: 'R R L R L R R', why: r`That’s the reversal without flipping. Each turn must also swap R ↔ L.` },
              ],
              explain: r`R R L, then R, then R R L reversed (L R R) and flipped (R L L): **R R L R R L L**. Unfolding a folded strip runs through the second half backwards, with every crease facing the other way.`,
            },
            {
              type: 'numeric',
              title: 'How long a list?',
              prompt: r`How many turns are in the sequence after 10 folds?`,
              answer: 1023,
              explain: r`One per crease: $2^{10} - 1 = 1{,}023$ turns, each R or L. The length roughly doubles with every fold: $t_{n+1} = 2t_n + 1$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Any single turn',
              prompt: r`There’s a shortcut for the $k$-th turn: write $k = 2^j \times q$ with $q$ odd. The turn is **R** if $q$ leaves remainder 1 when divided by 4, and **L** if it leaves remainder 3. Which is turn number 12?`,
              choices: [
                { t: 'L', ok: true },
                { t: 'R', why: r`$12 = 4 \times 3$, so $q = 3$, which leaves remainder 3 when divided by 4.` },
              ],
              explain: r`$12 = 2^2 \times 3$ and $3 \equiv 3 \pmod 4$, so turn 12 is **L**. Check against the 4-fold sequence R R L R R L L R R R L L R L L: the 12th turn is indeed L.`,
            },
          ],
          recap: [
            'Unfolding a strip folded n times gives 2ⁿ − 1 right-angle turns.',
            'Next sequence = previous, R, previous reversed and flipped.',
            'The limit is the dragon curve, which never crosses itself and tiles the plane.',
          ],
        },
      ],
    },
  ],
};
