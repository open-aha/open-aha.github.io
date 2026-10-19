import { fix } from '../lib/svg.js';

const r = String.raw;

const SCALE = [
  [-15, 'a proton'], [-10, 'an atom'], [-9, 'a DNA helix (width)'], [-7, 'a virus'], [-6, 'a bacterium'], [-5, 'a red blood cell'], [-4, 'a human hair (width)'],
  [-3, 'a grain of salt'], [-2, 'a fingernail'], [-1, 'a mouse'], [0, 'a person'], [1, 'a house'], [2, 'a football pitch'], [3, 'a small town'],
  [4, 'a city'], [5, 'a country (small)'], [6, 'a large country'], [7, 'the Earth'], [8, 'the Earth–Moon distance'], [9, 'the Sun'], [11, 'the Earth–Sun distance'],
  [13, 'the Solar System'], [16, 'a light-year'], [21, 'the Milky Way'], [26, 'the observable universe'],
];
const nearest = (n) => SCALE.reduce((a, b) => (Math.abs(b[0] - n) < Math.abs(a[0] - n) ? b : a));

export default {
  id: 'powers',
  subject: 'math',
  title: 'Powers & Roots',
  level: 'Foundational',
  cover: 'powers',
  tagline: 'Exponent rules, doubling, roots, scientific notation, powers of ten and Fermi estimates.',
  description: r`Powers let us write enormous and tiny numbers compactly, from the width of an atom to the size of the universe. Master the exponent rules, feel the explosive power of doubling, make sense of roots and estimate them, use scientific notation fluently, tour the universe in powers of ten, and learn to estimate almost anything to within a factor of ten.`,
  chapters: [
    {
      title: 'Exponents',
      summary: 'Repeated multiplication, its rules and its power.',
      lessons: [
        {
          id: 'exponent-rules',
          title: 'Exponent Rules',
          summary: 'Why the rules work',
          icon: 'bolt',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Multiply powers',
              prompt: r`What is $2^3 \times 2^4$, written as a power of 2? Enter the exponent.`,
              lhs: r`$2^{?}$, $\; ? =$`,
              answer: 7,
              wrong: [{ v: 12, why: r`Write it out: $(2 \cdot 2 \cdot 2) \times (2 \cdot 2 \cdot 2 \cdot 2)$. That's seven 2s multiplied together, so the exponents add.` }],
              explain: r`$2^3 \times 2^4 = (2 \cdot 2 \cdot 2)(2 \cdot 2 \cdot 2 \cdot 2) = 2^7$. Count the 2s: the exponents **add**.`,
            },
            {
              type: 'explain',
              title: 'The rules',
              body: r`$a^n$ means $n$ copies of $a$ multiplied together. Counting copies gives every rule:

| Rule | Example | Why |
|---|---|---|
| $a^m \cdot a^n = a^{m+n}$ | $10^2 \cdot 10^3 = 10^5$ | the copies add up |
| $\dfrac{a^m}{a^n} = a^{m-n}$ | $\dfrac{3^5}{3^2} = 3^3$ | copies cancel |
| $(a^m)^n = a^{mn}$ | $(2^3)^2 = 2^6$ | $n$ groups of $m$ copies |
| $(ab)^n = a^n b^n$ | $(2 \cdot 5)^3 = 2^3 \cdot 5^3$ | rearrange the copies |
| $a^0 = 1$ | $7^0 = 1$ | $\dfrac{a^n}{a^n} = 1$ |
| $a^{-n} = \dfrac{1}{a^n}$ | $2^{-3} = \dfrac18$ | keep dividing by $a$ |`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Walking down the powers',
              body: r`Each step to the left divides by 2. Move the exponent below zero and watch what happens.`,
              widget: {
                kind: 'graph', xmin: -4.6, xmax: 5.6, ymin: 0, ymax: 34, grid: false, axes: false, height: 240,
                params: { n: { min: -4, max: 5, step: 1, value: 3, label: 'exponent n', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let k = -4; k <= 5; k++) {
                    const v = 2 ** k, on = k === p.n;
                    els.push(s('rect', { x: plot.X(k - 0.38), y: plot.Y(v), width: plot.X(k + 0.38) - plot.X(k - 0.38), height: Math.max(1.5, plot.Y(0) - plot.Y(v)), rx: 3, class: on ? 'fl-violet' : 'fl-violet-soft' }));
                    els.push(s('text', { x: plot.X(k), y: plot.Y(0) + 18, class: 'tick', 'text-anchor': 'middle', text: String(k) }));
                  }
                  return els;
                },
                readout: (p) => (p.n >= 0 ? r`$2^{${p.n}} = ${2 ** p.n}$` : r`$2^{${p.n}} = \dfrac{1}{2^{${-p.n}}} = \dfrac{1}{${2 ** -p.n}} = ${fix(2 ** p.n, 4)}$`),
              },
              after: r`The pattern never hits zero or goes negative: it keeps halving. $2^0 = 1$, $2^{-1} = \tfrac12$, $2^{-2} = \tfrac14$, … A negative exponent means "divide", not "negative".`,
            },
            {
              type: 'mcq',
              title: 'Zero power',
              prompt: r`Why does $5^0 = 1$ (rather than 0)?`,
              choices: [
                { t: r`Because $5^0 = \frac{5^3}{5^3} = 1$: the pattern of dividing by 5 each step leads to 1`, ok: true },
                { t: 'It’s an arbitrary convention', why: 'It isn’t arbitrary: it’s the only value that keeps the exponent rules working.' },
                { t: 'It should really be 0', why: r`Follow the pattern $125, 25, 5, \ldots$: each step divides by 5, and $5 \div 5 = 1$.` },
              ],
              explain: r`Walk down: $5^3 = 125$, $5^2 = 25$, $5^1 = 5$, and each step divides by 5. One more step gives $5^0 = 1$, and the next gives $5^{-1} = \tfrac15$.`,
            },
            {
              type: 'numeric',
              title: 'Negative powers',
              prompt: r`What is $2^{-3}$? (Give a decimal or a fraction.)`,
              answer: 0.125,
              wrong: [{ v: -8, why: r`A negative exponent means a reciprocal, not a negative number: $2^{-3} = \frac{1}{2^3}$.` }, { v: -6, why: r`$2^{-3} = \frac{1}{8}$.` }],
              explain: r`$2^{-3} = \frac{1}{2^3} = \frac18 = 0.125$.`,
            },
            {
              type: 'numeric',
              title: 'Clever products',
              prompt: r`Without a calculator: what is $2^5 \times 5^5$?`,
              answer: 100000,
              wrong: [{ v: 1e10, relTol: 0.01, why: r`Use $(ab)^n = a^n b^n$ backwards: $2^5 \times 5^5 = (2 \times 5)^5$.` }],
              explain: r`$2^5 \times 5^5 = (2 \times 5)^5 = 10^5 = 100{,}000$. Pairing 2s with 5s to make 10s is a powerful mental-maths trick.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Simplify',
              prompt: r`Simplify $\dfrac{(2^5)^2 \times 2^{-3}}{2^4}$ to a single power of 2. What is the exponent?`,
              answer: 3,
              wrong: [{ v: 0, why: r`$(2^5)^2 = 2^{10}$. Then $10 - 3 - 4$.` }, { v: 10, why: 'That’s only the numerator’s first part. Include the other factors.' }],
              explain: r`$(2^5)^2 = 2^{10}$. Then $2^{10} \times 2^{-3} = 2^7$, and $2^7 / 2^4 = 2^3$. So the exponent is 3.`,
            },
          ],
          recap: [
            r`Multiplying adds exponents. Dividing subtracts them. A power of a power multiplies them.`,
            r`$a^0 = 1$ and $a^{-n} = 1/a^n$ follow from the halving (or dividing) pattern.`,
            'When in doubt, write out the copies.',
          ],
        },
        {
          id: 'doubling',
          title: 'The Power of Doubling',
          summary: 'Exponential beats everything',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Grains on a chessboard',
              body: r`An old legend tells of a clever inventor who asked a king for a modest reward: one grain of rice on the first square of a chessboard, two on the second, four on the third, doubling each time for all 64 squares.

The king laughed and agreed. Square $n$ gets $2^{n-1}$ grains. The first row is nothing special: the 8th square has just 128 grains. But doubling has a way of running away.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A million grains',
              prompt: r`On which square does the pile first reach **over a million** grains? Move along the board.`,
              widget: {
                kind: 'graph', xmin: 0.5, xmax: 30.5, ymin: 0, ymax: 9.6, grid: false, height: 260, padL: 52,
                axes: { xlabel: 'square', ylabel: 'grains', yfmt: (v) => (Number.isInteger(v) && v % 3 === 0 ? `10${['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'][v]}` : ''), xticks: 5, xAt: 0.5 },
                params: { n: { min: 1, max: 30, step: 1, value: 8, label: 'square', color: 'amber' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let k = 1; k <= 30; k++) {
                    const lg = Math.log10(2 ** (k - 1));
                    els.push(s('rect', { x: plot.X(k - 0.38), y: plot.Y(lg), width: plot.X(k + 0.38) - plot.X(k - 0.38), height: Math.max(1, plot.Y(0) - plot.Y(lg)), rx: 2, class: k === p.n ? 'fl-amber' : k < p.n ? 'fl-amber-soft' : 'fl-surface' }));
                  }
                  els.push(s('line', { x1: plot.X(0.5), x2: plot.X(30.5), y1: plot.Y(6), y2: plot.Y(6), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
                  els.push(s('text', { x: plot.X(1), y: plot.Y(6) - 6, class: 'tick', text: 'one million' }));
                  return els;
                },
                readout: (p) => r`square ${p.n}: $2^{${p.n - 1}} = ${(2 ** (p.n - 1)).toLocaleString('en-GB').replace(/,/g, '{,}')}$ grains`,
                goal: (p) => p.n === 21,
                hint: r`$2^{10} = 1024 \approx 1000$, so $2^{20} \approx 1000 \times 1000$. Which square has $2^{20}$ grains?`,
                solution: { n: 21 },
              },
              explain: r`Square 21 holds $2^{20} = 1{,}048{,}576$ grains. (The vertical axis is logarithmic: each step up is ten times more.) The handy fact $2^{10} = 1024 \approx 10^3$ means every 10 doublings multiply by about a thousand.`,
            },
            {
              type: 'numeric',
              title: 'The last square',
              prompt: r`Using $2^{10} \approx 10^3$, roughly how many grains go on the 64th square, $2^{63}$? Give the power of ten.`,
              lhs: r`$\approx 10^{?}$, $\; ? =$`,
              answer: 19,
              tol: 0.5,
              wrong: [{ v: 63, why: r`$2^{63}$ isn't $10^{63}$. Each $2^{10}$ is about $10^3$: $2^{63} = 2^3 \times (2^{10})^6 \approx 8 \times 10^{18}$.` }, { v: 18, why: r`$2^{63} \approx 8 \times 10^{18} \approx 10^{19}$ to the nearest power.` }],
              explain: r`$2^{63} = 2^3 \times (2^{10})^6 \approx 8 \times 10^{18}$, about $10^{19}$ grains. The exact value is $9.2 \times 10^{18}$. At about 25 mg per grain, that's over 200 billion tonnes of rice, hundreds of years of the world's entire harvest.`,
            },
            {
              type: 'mcq',
              title: 'Lily pads',
              prompt: r`Lily pads cover a pond, doubling their area every day. The pond is completely covered on day 30. On what day was it half covered?`,
              choices: [
                { t: 'Day 29', ok: true },
                { t: 'Day 15', why: 'Half the time doesn’t mean half the area. Since the area doubles daily, half coverage comes just one day before full.' },
                { t: 'Day 20', why: 'Work backwards: full on day 30, so half full on day 29.' },
              ],
              explain: r`Day 29: one doubling before full. On day 25 it was only $\frac{1}{32}$ covered, barely noticeable. Exponential growth looks harmless until the very end, which is why it's so easy to underestimate.`,
            },
            { /*anim:powers*/
              type: 'explain',
              kicker: 'Explore',
              title: 'More than all the rest',
              body: r`Here are the squares drawn to scale, one after another. On the right, the {amber:stack} piles up all the squares so far. Watch each {coral:new square} arrive and compare it with the stack. Watch each new square arrive.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 23.6, ymin: -0.12, ymax: 1.12, grid: false, axes: false, height: 300,
                animate: { param: 't', speed: 0.6, max: 20, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const N = Math.floor(p.t), f = p.t - N;
                  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
                  const a = ease(f / 0.45), b = ease((f - 0.5) / 0.45);
                  const ymax = 2 ** (N - 1 + a);
                  const H = (v) => plot.Y(0) - plot.Y(Math.min(1.05, v / ymax));
                  const els = [s('line', { x1: plot.X(0.3), x2: plot.X(23.4), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.6 })];
                  const bar = (x, v, cls) => s('rect', { x: plot.X(x - 0.38), y: plot.Y(0) - H(v), width: plot.X(0.76) - plot.X(0), height: H(v), class: cls, rx: 2 });
                  for (let k = 1; k <= N; k++) if (k <= 20) els.push(bar(k, 2 ** (k - 1), k === N && a < 0.5 ? 'fl-coral' : 'fl-blue-soft'));
                  if (N + 1 <= 20 && b > 0) els.push(bar(N + 1, 2 ** N * b, 'fl-coral'));
                  // the stack: squares 1..N-1 in full, square N sliding in during the first half
                  let y0 = plot.Y(0);
                  for (let k = 1; k <= N; k++) {
                    const v = k < N ? 2 ** (k - 1) : 2 ** (k - 1) * a, sx = 22.6;
                    const hpx = (plot.Y(0) - plot.Y(v / ymax));
                    if (hpx > 0.4) els.push(s('rect', { x: plot.X(sx - 0.38), y: y0 - hpx, width: plot.X(0.76) - plot.X(0), height: hpx, class: k % 2 ? 'fl-amber' : 'fl-amber-soft' }));
                    y0 -= hpx;
                  }
                  const T = (x, y, text, o = {}) => s('text', { x, y, 'text-anchor': o.a || 'middle', class: 'halo-text', style: `font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));${o.fill ? 'fill:' + o.fill : ''}`, text });
                  if (N) els.push(T(plot.X(22.6), plot.Y(0) + 18, `1 to ${N}`, { fill: 'var(--amber)' }));
                  if (N + 1 <= 20 && b > 0) els.push(T(plot.X(N + 1), plot.Y(0) + 18, `#${N + 1}`, { fill: 'var(--coral)' }));
                  if (N + 1 <= 20 && b > 0) els.push(s('line', { x1: plot.X(N + 1.5), x2: plot.X(22.2), y1: plot.Y(0) - H(2 ** N - 1), y2: plot.Y(0) - H(2 ** N - 1), stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  if (N + 1 <= 20 && b > 0) els.push(T(plot.X(N + 1), plot.Y(Math.min(1.05, (2 ** N * b) / ymax)) - 8, 'new', { fill: 'var(--coral)' }));
                  return els;
                },
                readout: (p) => { const N = Math.min(19, Math.floor(p.t)); return N ? `square ${N + 1}: ${(2 ** N).toLocaleString('en-GB')} grains · squares 1 to ${N} together: ${(2 ** N - 1).toLocaleString('en-GB')}` : 'square 1: 1 grain'; },
              },
              after: r`Every new square holds **one grain more than all the earlier squares put together**: $1 + 2 + 4 + \dots + 2^{n-1} = 2^n - 1$. Each time, the old squares shrink to half the height of the picture, and the newest one fills it. The picture never changes, only the numbers do. That's why the lily pads cover half the pond just one day before the end: in exponential growth, the latest step is always as big as all of history.`,
            },
            {
              type: 'numeric',
              title: 'Ten doublings, a thousand',
              prompt: r`Since $2^{10} = 1024 \approx 10^3$, thirty doublings multiply by about $10^{?}$. What is the missing power?`,
              answer: 9,
              explain: r`$2^{30} = (2^{10})^3 \approx (10^3)^3 = 10^9$: a billion. This "ten doublings ≈ a thousand" trick makes exponential growth easy to estimate in your head.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Halving',
              prompt: r`Doubling works backwards too. A medicine's amount in the body halves every 6 hours. What fraction remains after 24 hours?`,
              answer: 1 / 16,
              tol: 0.001,
              wrong: [{ v: 0.25, why: '24 hours is four halvings, not two.' }, { v: 0.5 / 4, tol: 0.001, why: r`Halving four times multiplies by $\left(\frac12\right)^4$.` }],
              explain: r`24 hours $= 4$ halvings: $\left(\frac12\right)^4 = 2^{-4} = \frac{1}{16}$. The same maths governs radioactive decay and the cooling of hot drinks.`,
            },
          ],
          recap: [
            r`Doubling $n$ times multiplies by $2^n$; it starts slowly, then explodes.`,
            r`$2^{10} \approx 10^3$: every 10 doublings is about a thousandfold.`,
            r`Halving $n$ times multiplies by $2^{-n}$.`,
          ],
        },
        {
          id: 'roots',
          title: 'Roots',
          summary: 'Undoing powers',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Side of a square',
              prompt: 'A square has an area of 49 m². How long is each side?',
              unit: 'm',
              answer: 7,
              wrong: [{ v: 24.5, why: 'Area = side × side, not 2 × side. What number times itself gives 49?' }, { v: 12.25, why: 'That’s 49 ÷ 4. You need the number that, squared, gives 49.' }],
              explain: r`$\sqrt{49} = 7$, because $7 \times 7 = 49$. The square root undoes squaring.`,
            },
            {
              type: 'explain',
              title: 'Roots as fractional powers',
              body: r`The **square root** $\sqrt{a}$ is the non-negative number whose square is $a$. The **cube root** $\sqrt[3]{a}$ cubes to $a$.

Roots fit into the exponent rules as fractional powers:
$$\sqrt{a} = a^{1/2}, \qquad \sqrt[3]{a} = a^{1/3}$$
Why? Because $(a^{1/2})^2 = a^{1/2 \cdot 2} = a^1 = a$.

Useful rule: $\sqrt{ab} = \sqrt a \sqrt b$, so $\sqrt{50} = \sqrt{25 \cdot 2} = 5\sqrt2$.`,
            },
            {
              type: 'numeric',
              title: 'A cube',
              prompt: r`A cube-shaped water tank holds $8\text{ m}^3$. How long is each edge?`,
              unit: 'm',
              answer: 2,
              wrong: [{ v: 2.83, tol: 0.01, why: r`That's $\sqrt8$. A cube's volume is edge³, so take the cube root.` }, { v: 8 / 3, tol: 0.01, why: r`Volume is edge × edge × edge, not 3 × edge.` }],
              explain: r`$\sqrt[3]{8} = 2$, because $2 \times 2 \times 2 = 8$. A 1000-litre tank (1 m³) has 1 m edges; to hold 8 times as much, the edges only need to double.`,
            },
            {
              type: 'numeric',
              title: 'Fractional power',
              prompt: r`What is $8^{2/3}$?`,
              answer: 4,
              wrong: [{ v: 5.33, tol: 0.01, why: r`$8^{2/3}$ means cube root first (2), then square: $2^2$.` }, { v: 16, why: r`$8^{2/3} = (8^{1/3})^2 = 2^2$.` }],
              explain: r`$8^{2/3} = \left(8^{1/3}\right)^2 = 2^2 = 4$.`,
            },
            {
              type: 'mcq',
              title: 'Simplify a root',
              prompt: r`Which is equal to $\sqrt{72}$?`,
              cols: 2,
              choices: [
                { t: r`$6\sqrt2$`, ok: true },
                { t: r`$36\sqrt2$`, why: r`$\sqrt{72} = \sqrt{36 \cdot 2} = \sqrt{36}\sqrt2 = 6\sqrt2$.` },
                { t: r`$8\sqrt9$`, why: r`$8\sqrt9 = 24$, and $24^2 = 576$, not 72.` },
                { t: r`$2\sqrt{18}$`, why: r`That is equal to $\sqrt{72}$, but it isn't fully simplified: $\sqrt{18} = 3\sqrt2$.` },
              ],
              explain: r`Find the largest square factor: $72 = 36 \times 2$, so $\sqrt{72} = 6\sqrt2 \approx 8.49$. ($2\sqrt{18}$ is also correct, but not fully simplified.)`,
            },
            {
              type: 'interactive',
              title: 'A square of area 50',
              body: r`Drag the corner to make a square with an area of exactly 50 square units. How long is its side?`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 10, ymin: -0.5, ymax: 10, grid: 1, maxWidth: 400, axes: { xticks: 1, yticks: 1 },
                params: { a: { min: 1, max: 9.5, step: 0.01, value: 5, slider: false } },
                extra: ({ plot, p, s }) => [s('rect', { x: plot.X(0), y: plot.Y(p.a), width: plot.X(p.a) - plot.X(0), height: plot.Y(0) - plot.Y(p.a), class: Math.abs(p.a * p.a - 50) < 0.15 ? 'fl-teal-soft' : 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 2.5 })],
                points: [{ x: (p) => p.a, y: (p) => p.a, drag: { fn: (x, y) => ({ a: Math.max(1, Math.min(9.5, (x + y) / 2)) }), key: 'a' }, color: 'coral' }],
                readout: (p) => `side ${p.a.toFixed(2)} · area **${(p.a * p.a).toFixed(2)}**`,
                goal: (p) => Math.abs(p.a * p.a - 50) < 0.15,
                hint: '7² = 49, so the side is a little more than 7.',
                solution: { a: 7.07 },
              },
              explain: r`The side is $\sqrt{50} \approx 7.07$: just over 7, because $7^2 = 49$. It never comes out exactly: $\sqrt{50} = 5\sqrt2$ is irrational, so its decimals go on forever without repeating.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A common slip',
              prompt: r`Is $\sqrt{9 + 16} = \sqrt9 + \sqrt{16}$?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`Check: $\sqrt{25} = 5$, but $3 + 4 = 7$.` },
              ],
              explain: r`$\sqrt{9 + 16} = \sqrt{25} = 5$, while $\sqrt9 + \sqrt{16} = 7$. Roots split over **multiplication** ($\sqrt{ab} = \sqrt a\sqrt b$), but not over **addition**. (That's exactly why Pythagoras's $c = \sqrt{a^2 + b^2}$ isn't just $a + b$.)`,
            },
          ],
          recap: [
            r`$\sqrt{a} = a^{1/2}$ and $\sqrt[n]{a} = a^{1/n}$; cube roots undo cubing.`,
            r`$\sqrt{ab} = \sqrt a \sqrt b$: pull out square factors to simplify.`,
            'Roots don’t split over addition.',
          ],
        },
        {
          id: 'estimate-roots',
          title: 'Estimating Roots',
          summary: 'Between the perfect squares',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Most roots never end',
              body: r`$\sqrt{49} = 7$ exactly, but $\sqrt{50}$ isn't a whole number, or even a fraction. Its decimal expansion $7.0710678\ldots$ goes on forever without repeating: it's **irrational**. The ancient Greeks proved this for $\sqrt2$, reportedly to the dismay of the followers of Pythagoras.

So we estimate. Since $7^2 = 49$ and $8^2 = 64$, $\sqrt{50}$ lies between 7 and 8, and very close to 7.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Place the root',
              prompt: r`Drag the point to $\sqrt{50}$ on the number line, to the nearest hundredth. The readout shows the square of where you are.`,
              widget: {
                kind: 'graph', xmin: 6.8, xmax: 8.2, ymin: -0.5, ymax: 0.6, grid: false, axes: false, height: 150,
                params: { x: { min: 7, max: 8, step: 0.01, value: 7.5, slider: false } },
                points: [{ x: (p) => p.x, y: () => 0, drag: { x: 'x' }, color: 'coral' }],
                extra: ({ plot, s }) => {
                  const els = [s('line', { x1: plot.X(7), x2: plot.X(8), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 })];
                  for (let i = 0; i <= 10; i++) {
                    const x = 7 + i / 10;
                    els.push(s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(i % 5 ? 0.1 : 0.2), y2: plot.Y(i % 5 ? -0.1 : -0.2), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                  }
                  els.push(s('text', { x: plot.X(7), y: plot.Y(-0.42), class: 'lbl', 'text-anchor': 'middle', text: '7' }), s('text', { x: plot.X(7.5), y: plot.Y(-0.42), class: 'lbl', 'text-anchor': 'middle', text: '7.5' }), s('text', { x: plot.X(8), y: plot.Y(-0.42), class: 'lbl', 'text-anchor': 'middle', text: '8' }));
                  return els;
                },
                readout: (p) => r`$${p.x.toFixed(2)}^2 = ${(p.x * p.x).toFixed(4)}$`,
                goal: (p) => Math.abs(p.x - 7.07) < 0.005,
                hint: r`50 is only 1 more than 49, while 64 is 15 more. So $\sqrt{50}$ is very close to 7.`,
                solution: { x: 7.07 },
              },
              explain: r`$7.07^2 = 49.98$, and $7.08^2 = 50.13$, so $\sqrt{50} \approx 7.07$. A quick trick: $\sqrt{49 + 1} \approx 7 + \frac{1}{2 \times 7} = 7.071$. Adding a little to a square adds about "that little divided by twice the root".`,
            },
            {
              type: 'numeric',
              title: 'Using a known root',
              prompt: r`Given $\sqrt2 \approx 1.414$, estimate $\sqrt{200}$. (2 decimal places.)`,
              answer: Math.sqrt(200),
              tol: 0.01,
              wrong: [{ v: 141.4, tol: 0.1, why: r`$\sqrt{200} = \sqrt{100}\sqrt{2} = 10\sqrt2$, not $100\sqrt2$.` }, { v: 1.414, tol: 0.001, why: 'That’s √2 itself. Pull out the square factor 100.' }],
              explain: r`$\sqrt{200} = \sqrt{100 \times 2} = 10\sqrt2 \approx 14.14$. Check: $14^2 = 196$, so it's just over 14 ✓.`,
            },
            {
              type: 'numeric',
              title: 'Root of 50',
              prompt: r`Since $\sqrt{49} = 7$, a good estimate is $\sqrt{50} \approx 7 + \frac{1}{2 \times 7}$. What does that give? (3 decimal places.)`,
              answer: 7 + 1 / 14,
              tol: 0.001,
              explain: r`$7 + \frac{1}{14} \approx 7.071$, and the true value is $7.0711$. Nudging the root up by a small $\epsilon$ raises the square by about $2 \times 7 \times \epsilon$: $(7 + \epsilon)^2 \approx 49 + 14\epsilon$, so $\epsilon \approx \frac{1}{14}$.`,
            },
            {
              type: 'numeric',
              title: 'A cube root',
              prompt: r`Since $3^3 = 27$, a good estimate is $\sqrt[3]{30} \approx 3 + \frac{30 - 27}{3 \times 3^2}$. What does that give? (3 decimal places.)`,
              answer: 3 + 3 / 27,
              tol: 0.001,
              explain: r`$3 + \frac{3}{27} \approx 3.111$; the true value is 3.107. The same trick as for square roots: the cube grows by about $3a^2$ for each unit increase near $a$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which is bigger?',
              prompt: r`Which is larger: $\sqrt{10} + \sqrt{11}$ or $2\sqrt{10.5}$?`,
              cols: 2,
              choices: [
                { t: r`$2\sqrt{10.5}$`, ok: true },
                { t: r`$\sqrt{10} + \sqrt{11}$`, why: r`Square both: $(\sqrt{10} + \sqrt{11})^2 = 21 + 2\sqrt{110}$, while $(2\sqrt{10.5})^2 = 42 = 21 + 2\sqrt{110.25}$.` },
                { t: 'They’re equal', why: 'Extremely close, but not equal: compare squares.' },
              ],
              explain: r`Squaring: $(\sqrt{10} + \sqrt{11})^2 = 21 + 2\sqrt{110}$ and $(2\sqrt{10.5})^2 = 21 + 2\sqrt{110.25}$. The second is bigger, by a whisker (6.4807 vs 6.4789). The square root curve bends downwards, so the root of an average beats the average of roots.`,
            },
          ],
          recap: [
            'Most square roots are irrational: endless, non-repeating decimals.',
            'Trap a root between perfect squares, then refine.',
            r`$\sqrt{n^2 + d} \approx n + \frac{d}{2n}$ for small $d$.`,
          ],
        },
      ],
    },
    {
      title: 'Big and Small',
      summary: 'Scientific notation, scale and estimation.',
      lessons: [
        {
          id: 'scientific',
          title: 'Scientific Notation',
          summary: 'Writing huge and tiny numbers',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Count the zeros',
              prompt: 'The Sun is about 150,000,000 km away. How is that written in scientific notation?',
              cols: 2,
              choices: [
                { t: r`$1.5 \times 10^8$ km`, ok: true },
                { t: r`$15 \times 10^7$ km`, why: r`That's the right value, but scientific notation keeps the first number between 1 and 10.` },
                { t: r`$1.5 \times 10^7$ km`, why: r`$10^7$ is 10 million. 150 million is $1.5 \times 10^8$.` },
                { t: r`$1.5 \times 10^9$ km`, why: r`That would be 1.5 billion km, ten times too far.` },
              ],
              explain: r`$150{,}000{,}000 = 1.5 \times 100{,}000{,}000 = 1.5 \times 10^8$. Scientific notation is a number from 1 to 10 times a power of ten.`,
            },
            {
              type: 'explain',
              title: 'Powers of ten',
              body: r`Scientific notation writes any number as $a \times 10^n$ with $1 \le a < 10$:
- Earth's mass: $5.97 \times 10^{24}$ kg
- A red blood cell: $8 \times 10^{-6}$ m across
- A hydrogen atom: about $10^{-10}$ m

Multiplying is easy: multiply the front numbers and add the exponents.
$$(3 \times 10^4)(2 \times 10^5) = 6 \times 10^9$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Small numbers',
              prompt: r`A bacterium is 0.0000042 m long. Choose the exponent $n$ so that $4.2 \times 10^n$ equals this length.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2, grid: false, axes: false, height: 110,
                params: { n: { min: -9, max: 3, step: 1, value: -2, label: 'exponent n', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const val = 4.2 * 10 ** p.n;
                  const str = p.n >= 0 ? String(Math.round(val * 10) / 10) : val.toFixed(-p.n + 1);
                  // the written-out decimal is the lesson here, so its length is meant to change
                  return [s('text', { x: plot.X(5), y: plot.Y(0.85), class: 'lbl', 'text-anchor': 'middle', style: 'font-size: 30px; fill: var(--ink)', 'data-free-digits': '', text: `${str} m` })];
                },
                readout: (p) => r`$4.2 \times 10^{${p.n}}$`,
                goal: (p) => p.n === -6,
                hint: 'Count how many places the decimal point moves to get from 0.0000042 to 4.2.',
                solution: { n: -6 },
              },
              explain: r`The decimal point moves 6 places right to get 4.2, so the length is $4.2 \times 10^{-6}$ m: 4.2 micrometres. A negative exponent means the number is smaller than 1.`,
            },
            {
              type: 'numeric',
              title: 'Multiply',
              prompt: r`What is $(4 \times 10^3) \times (5 \times 10^6)$, written as $2 \times 10^{n}$? Enter $n$.`,
              lhs: r`$n =$`,
              answer: 10,
              wrong: [{ v: 9, why: r`$4 \times 5 = 20 = 2 \times 10^1$, which adds one more power of ten: $10^{3+6+1}$.` }, { v: 18, why: 'Add the exponents, don’t multiply them.' }],
              explain: r`$4 \times 5 = 20$ and $10^3 \times 10^6 = 10^9$, giving $20 \times 10^9 = 2 \times 10^{10}$.`,
            },
            {
              type: 'numeric',
              title: 'Light from the Sun',
              prompt: r`Light travels at $3 \times 10^8$ m/s. The Sun is $1.5 \times 10^{11}$ m away. How many seconds does sunlight take to reach us?`,
              unit: 's',
              answer: 500,
              wrong: [{ v: 4.5e19, relTol: 0.01, why: 'Time = distance ÷ speed. Divide, don’t multiply.' }, { v: 50, why: r`$\frac{1.5}{3} = 0.5$ and $10^{11-8} = 10^3$, so $0.5 \times 10^3$.` }],
              explain: r`$\frac{1.5 \times 10^{11}}{3 \times 10^8} = 0.5 \times 10^3 = 500$ s, about 8 minutes 20 seconds. When you see the Sun, you're seeing it as it was 8 minutes ago.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Atoms in a grain',
              prompt: r`A grain of sand has a mass of about $10^{-5}$ kg, and a silicon atom has a mass of about $5 \times 10^{-26}$ kg. Roughly how many atoms are in the grain? Give the power of ten (the answer is $2 \times 10^{n}$).`,
              lhs: r`$n =$`,
              answer: 20,
              wrong: [{ v: 21, why: r`$\frac{10^{-5}}{5 \times 10^{-26}} = 0.2 \times 10^{21} = 2 \times 10^{20}$.` }, { v: -31, why: 'Divide the masses, don’t multiply them.' }],
              explain: r`$\frac{10^{-5}}{5 \times 10^{-26}} = 0.2 \times 10^{21} = 2 \times 10^{20}$ atoms: two hundred billion billion in a single grain. (Sand is silicon dioxide, but the estimate holds to within a factor of a few.)`,
            },
          ],
          recap: [
            r`Scientific notation: $a \times 10^n$ with $1 \le a < 10$; negative $n$ for numbers below 1.`,
            'To multiply, multiply the front numbers and add the exponents; to divide, divide and subtract.',
            'Then tidy up so the front number is between 1 and 10.',
          ],
        },
        {
          id: 'powers-of-ten',
          title: 'Powers of Ten',
          summary: 'A tour of scale',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Zooming through the universe',
              body: r`Each step multiplies the size by 10. Zoom from the heart of an atom to the edge of the observable universe.`,
              widget: {
                kind: 'graph', xmin: -15.5, xmax: 26.5, ymin: -1, ymax: 1.2, grid: false, axes: false, height: 140,
                params: { n: { min: -15, max: 26, step: 1, value: 0, label: 'size', color: 'violet', format: (v) => `$10^{${v}}$ m` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(-15), x2: plot.X(26), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  for (const [k] of SCALE) els.push(s('circle', { cx: plot.X(k), cy: plot.Y(0), r: 4, class: 'fl-ink' }));
                  els.push(s('circle', { cx: plot.X(p.n), cy: plot.Y(0), r: 10, class: 'fl-violet' }));
                  for (const k of [-15, -10, -5, 0, 5, 10, 15, 20, 25]) els.push(s('text', { x: plot.X(k), y: plot.Y(-0.7), class: 'tick', 'text-anchor': 'middle', text: String(k) }));
                  return els;
                },
                readout: (p) => {
                  const [k, name] = nearest(p.n);
                  return k === p.n ? r`$10^{${p.n}}$ m: about the size of **${name}**` : r`$10^{${p.n}}$ m: between things (nearest: ${name}, $10^{${k}}$ m)`;
                },
              },
              after: r`The universe spans about 41 powers of ten, from protons ($10^{-15}$ m) to the observable universe ($10^{26}$ m). Humans, at about 1 m, sit somewhere in between. On an ordinary ruler, everything but a sliver would be invisible; on a **logarithmic scale**, equal steps mean equal multiplications.`,
            },
            {
              type: 'numeric',
              title: 'Orders of magnitude',
              prompt: r`An atom is about $10^{-10}$ m across and a person about $1$ m tall. How many orders of magnitude (powers of ten) apart are they?`,
              answer: 10,
              wrong: [{ v: -10, why: 'Count the steps between them: from 10⁻¹⁰ up to 10⁰ is 10 steps.' }],
              explain: r`From $10^{-10}$ to $10^0$ is 10 orders of magnitude: a person is ten billion times taller than an atom is wide.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Log scale',
              prompt: r`On this logarithmic number line, the ticks are 1, 10, 100, …, 1,000,000. Drag the point to where **1000** belongs.`,
              widget: {
                kind: 'graph', xmin: -0.4, xmax: 6.4, ymin: -0.6, ymax: 0.6, grid: false, axes: false, height: 140,
                params: { x: { min: 0, max: 6, step: 0.25, value: 4.5, slider: false } },
                points: [{ x: (p) => p.x, y: () => 0, drag: { x: 'x' }, color: 'coral' }],
                extra: ({ plot, s }) => {
                  const els = [s('line', { x1: plot.X(0), x2: plot.X(6), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 })];
                  ['1', '10', '100', '1k', '10k', '100k', '1M'].forEach((t, i) => {
                    els.push(s('line', { x1: plot.X(i), x2: plot.X(i), y1: plot.Y(0.15), y2: plot.Y(-0.15), stroke: 'var(--ink)', 'stroke-width': 2 }));
                    els.push(s('text', { x: plot.X(i), y: plot.Y(-0.45), class: 'tick', 'text-anchor': 'middle', text: i === 3 ? '?' : t }));
                  });
                  return els;
                },
                readout: (p) => r`this point represents $10^{${fix(p.x, 2)}} \approx ${Math.round(10 ** p.x).toLocaleString('en-GB').replace(/,/g, '{,}')}$`,
                goal: (p) => Math.abs(p.x - 3) < 1e-9,
                hint: 'On a log scale, 1000 has three zeros, so it is three steps from 1.',
                solution: { x: 3 },
              },
              explain: r`1000 $= 10^3$ sits at step 3: exactly halfway between 1 and a million on this scale, because it's the **geometric** midpoint ($\sqrt{1 \times 10^6} = 1000$). Earthquake magnitudes, decibels and star brightnesses all use logarithmic scales.`,
            },
            {
              type: 'numeric',
              title: 'From proton to universe',
              prompt: r`A proton is about $10^{-15}$ m across; the observable universe is about $10^{26}$ m. How many powers of ten separate them?`,
              unit: 'powers of 10',
              answer: 41,
              wrong: [{ v: 11, why: r`Subtract the exponents: $26 - (-15)$.` }],
              explain: r`$26 - (-15) = 41$ orders of magnitude. Charles and Ray Eames took viewers along a journey like this in their 1977 film *Powers of Ten*, zooming out from a picnic to the edge of the known universe and back into an atom.`,
            },
            {
              type: 'numeric',
              title: 'Seconds in a year',
              prompt: r`A year is about $3.16 \times 10^7$ seconds. In this scientific notation, what is the power of ten?`,
              answer: 7,
              explain: r`The exponent is 7: a year is a few tens of millions of seconds. A handy coincidence for estimates: a year is roughly $\pi \times 10^7$ seconds.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Middle of the universe?',
              prompt: r`On a logarithmic scale running from a proton ($10^{-15}$ m) to the observable universe ($10^{26}$ m), what size sits at the midpoint?`,
              choices: [
                { t: r`About $10^{5.5}$ m: a few hundred kilometres`, ok: true },
                { t: r`About $10^{25.7}$ m: half the universe`, why: 'That’s the midpoint on an ordinary scale. On a log scale, average the exponents.' },
                { t: r`1 m: a human`, why: r`Close-ish on a cosmic scale, but the average of $-15$ and $26$ is $5.5$.` },
              ],
              explain: r`Average the exponents: $\frac{-15 + 26}{2} = 5.5$, so about $3 \times 10^5$ m, roughly the size of a small country. On the full ladder of scales, humans are a little closer to the small end than the large.`,
            },
          ],
          recap: [
            'Each order of magnitude is a factor of 10; the universe spans about 41 of them.',
            'Logarithmic scales space numbers by multiplication: 1, 10, 100, … equally spaced.',
            'The log-scale midpoint is the geometric mean.',
          ],
        },
        {
          id: 'fermi',
          title: 'Fermi Estimates',
          summary: 'Estimating almost anything',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Heartbeats',
              prompt: 'Roughly how many times does a human heart beat in an 80-year lifetime?',
              cols: 2,
              choices: [
                { t: 'About 3 billion', ok: true },
                { t: 'About 3 million', why: r`At about 70 beats a minute, that's over 100,000 a day: $10^5 \times 365 \times 80 \approx 3 \times 10^9$.` },
                { t: 'About 3 trillion', why: 'That’s about a thousand times too many.' },
              ],
              explain: r`About 70 beats/min × 60 × 24 ≈ 100,000 beats a day. Times 365 days × 80 years ≈ $3 \times 10^9$. That's about 3 billion heartbeats, worked out from things you already know.`,
            },
            {
              type: 'explain',
              title: 'The Fermi method',
              body: r`Physicist Enrico Fermi was famous for quick, surprisingly accurate estimates. (He estimated the energy of the first atomic bomb test by watching how far scraps of paper blew.)

1. Break the question into factors you can guess.
2. Estimate each one to within a factor of a few.
3. Multiply, keeping track of powers of ten.

Errors tend to cancel out: some guesses are too high, others too low. The answer usually lands within a factor of 10 of the truth.`,
            },
            {
              type: 'mcq',
              title: 'Piano tuners',
              body: r`Fermi's classic question: how many piano tuners work in a city of 4 million people? Suppose there's 1 piano per 20 people, each piano is tuned once a year, a tuning takes 2 hours, and a tuner works 2,000 hours a year.`,
              prompt: 'About how many piano tuners?',
              cols: 2,
              choices: [
                { t: 'About 200', ok: true },
                { t: 'About 20', why: r`200,000 pianos × 2 hours = 400,000 hours a year. Divide by 2,000 hours per tuner.` },
                { t: 'About 20,000', why: 'Far too many. Each tuner handles about 1,000 pianos a year.' },
              ],
              explain: r`Pianos: $4{,}000{,}000 / 20 = 200{,}000$. Tuning hours: $200{,}000 \times 2 = 400{,}000$ per year. Tuners: $400{,}000 / 2{,}000 = 200$. The real number would be in that ballpark, not 2 and not 20,000.`,
            },
            {
              type: 'numeric',
              title: 'Words in a year',
              prompt: r`Estimate the number of words a person speaks in a year: say 16,000 words a day. Give the nearest power of ten.`,
              lhs: r`$10^{?}$, $\; ? =$`,
              answer: 7,
              tol: 0.5,
              wrong: [{ v: 6, why: r`$16{,}000 \times 365 \approx 5.8 \times 10^6$, which rounds to $10^7$ on a log scale ($10^{6.8}$).` }],
              explain: r`$1.6 \times 10^4 \times 365 \approx 5.8 \times 10^6 \approx 10^{6.8}$, closest to $10^7$: around six million words a year. (Studies of daily speech have found averages near 16,000 words, with huge variation between people.)`,
            },
            {
              type: 'mcq',
              title: 'Why errors cancel',
              prompt: r`A Fermi estimate multiplies five factors, each guessed to within a factor of 2 either way. Why is the final answer usually within a factor of 10, rather than $2^5 = 32$?`,
              choices: [
                { t: 'Some guesses run high and others low, so the errors partly cancel', ok: true },
                { t: 'Each factor is actually exact', why: 'They’re guesses. The point is that independent errors rarely all go the same way.' },
                { t: 'Multiplying reduces errors', why: 'Multiplying combines errors. It’s the random mix of over- and under-estimates that saves you.' },
              ],
              explain: r`The worst case (all five too high) is a factor of 32, but it's unlikely. Typically the errors roughly cancel, like steps in a random walk, giving a combined error of a few times the individual errors rather than their full product.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Build your own estimate',
              body: r`Here is Fermi’s famous piano-tuner estimate for a city like Chicago. Change any factor to your own guess and see how the answer moves.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1, grid: false, axes: false, height: 60,
                params: {
                  pop: { min: 1, max: 6, step: 0.5, value: 3, label: 'people (millions)', color: 'blue', format: (v) => `${fix(v, 1)} M` },
                  per: { min: 2, max: 4, step: 0.5, value: 2.5, label: 'people per household', color: 'teal', format: (v) => v.toFixed(1) },
                  frac: { min: 0.02, max: 0.3, step: 0.01, value: 0.1, label: 'households with a piano', color: 'violet', format: (v) => `${Math.round(v * 100)}%` },
                  tune: { min: 0.5, max: 2, step: 0.5, value: 1, label: 'tunings per piano per year', color: 'amber', format: (v) => v.toFixed(1) },
                  cap: { min: 500, max: 1500, step: 100, value: 1000, label: 'tunings per tuner per year', color: 'coral', format: (v) => `${v}` },
                },
                readout: (p) => { const n = (p.pop * 1e6 / p.per) * p.frac * p.tune / p.cap; return `pianos: ${Math.round((p.pop * 1e6 / p.per) * p.frac).toLocaleString('en-US')} · tunings needed per year: ${Math.round((p.pop * 1e6 / p.per) * p.frac * p.tune).toLocaleString('en-US')} · **piano tuners ≈ ${Math.round(n)}**`; },
              },
              after: r`With these guesses you get about 120 tuners, the right order of magnitude: real directories for Chicago have listed somewhere between one and three hundred. Each factor could easily be off by 50%, yet the answer rarely misses by more than a factor of 2 or 3: some guesses are too high and others too low, and their errors partly cancel.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Water in a lifetime',
              prompt: 'About how many litres of water does a person drink in 80 years, at about 2 litres a day? Give the nearest power of ten (for example, 4 for 10,000).',
              lhs: r`$10^{?}$, $\; ? =$`,
              answer: 5,
              tol: 0.5,
              wrong: [{ v: 4, why: r`$2 \times 365 \times 80 \approx 58{,}000$ litres. On a powers-of-ten scale that's about $10^{4.8}$, closer to $10^5$ than to $10^4$.` }, { v: 3, why: r`$2 \times 365 \times 80 \approx 58{,}000$ litres.` }],
              explain: r`$2 \times 365 \times 80 \approx 58{,}000 \approx 6 \times 10^4$ litres, closest to $10^5$. That's enough to fill a large backyard swimming pool.`,
            },
          ],
          recap: [
            'Break hard estimates into easy factors and multiply.',
            'Keep track of powers of ten. Aim to be within a factor of 10.',
            'Over- and under-estimates tend to cancel.',
          ],
        },
      ],
    },
  ],
};
