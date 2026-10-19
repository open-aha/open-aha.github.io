const r = String.raw;
const PHI = (1 + Math.sqrt(5)) / 2;

// greedy squares in an a × b rectangle (a, b integers)
const squares = (a, b) => {
  const out = [], terms = [];
  let x = 0, y = 0, w = a, h = b;
  while (w > 0 && h > 0) {
    if (w >= h) {
      const k = Math.floor(w / h);
      terms.push(k);
      for (let i = 0; i < k; i++) out.push([x + i * h, y, h]);
      x += k * h; w -= k * h;
    } else {
      const k = Math.floor(h / w);
      terms.push(k);
      for (let i = 0; i < k; i++) out.push([x, y + i * w, w]);
      y += k * w; h -= k * w;
    }
  }
  return { out, terms };
};
const cfString = (t) => (t.length === 1 ? `[${t[0]}]` : `[${t[0]}; ${t.slice(1).join(', ')}]`);

const NUMS = [
  ['π', Math.PI, [3, 7, 15, 1, 292, 1]],
  ['√2', Math.SQRT2, [1, 2, 2, 2, 2, 2]],
  ['φ', PHI, [1, 1, 1, 1, 1, 1]],
  ['days in a year − 365', 0.24219, [0, 4, 7, 1, 3, 24]],
];
const convergent = (terms, n) => {
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1;
  for (const a of terms.slice(0, n)) {
    [h0, h1] = [h1, a * h1 + h0];
    [k0, k1] = [k1, a * k1 + k0];
  }
  return [h1, k1];
};

const GOLDEN = 360 / (PHI * PHI);
const sci = (e) => {
  if (e >= 0.001) return e.toFixed(4);
  const [m, ex] = e.toExponential(1).split('e');
  return `${m} \\times 10^{${Number(ex)}}`;
};

// draw the greedy squares of an a × b rectangle
const sqExtra = ({ plot, p, s }) => {
  const { out } = squares(p.a, p.b);
  const cols = ['blue', 'coral', 'teal', 'amber', 'violet', 'pink'];
  let lastSize = null, ci = -1;
  return out.map(([x, y, sz]) => {
    if (sz !== lastSize) { ci++; lastSize = sz; }
    return s('rect', { x: plot.X(x), y: plot.Y(y + sz), width: plot.X(x + sz) - plot.X(x), height: plot.Y(y) - plot.Y(y + sz), class: `fl-${cols[ci % cols.length]}-soft`, stroke: `var(--${cols[ci % cols.length]})`, 'stroke-width': 2 });
  });
};
// best approximation to π with denominator exactly q
const piBest = (q) => { const p = Math.round(Math.PI * q); return { p, q, err: Math.abs(Math.PI - p / q) }; };
const piRecords = (Q) => {
  const rec = [];
  let best = Infinity;
  for (let q = 1; q <= Q; q++) { const b = piBest(q); if (b.err < best) { best = b.err; rec.push(b); } }
  return rec;
};
// continued fraction of √n and the smallest solution of x² − n y² = 1
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function sqrtCF(n) {
  const a0 = Math.floor(Math.sqrt(n));
  if (a0 * a0 === n) return null;
  let m = 0, d = 1, a = a0;
  const per = [];
  do { m = d * a - m; d = (n - m * m) / d; a = Math.floor((a0 + m) / d); per.push(a); } while (a !== 2 * a0);
  let h0 = 1n, h1 = BigInt(a0), k0 = 0n, k1 = 1n;
  const N = BigInt(n);
  for (let i = 0; h1 * h1 - N * k1 * k1 !== 1n; i++) {
    const t = BigInt(per[i % per.length]);
    [h0, h1] = [h1, t * h1 + h0];
    [k0, k1] = [k1, t * k1 + k0];
  }
  return { a0, per, x: h1, y: k1 };
}
const FIFTH = 1200 * Math.log2(1.5);
const fifthIn = (n) => { const m = Math.round((n * FIFTH) / 1200); return { m, err: Math.abs((1200 * m) / n - FIFTH) }; };
const SATURN = 77708431 / 2640858;
// a ladder of n sections of 1-ohm resistors: [numerator, denominator] of its resistance
const ladder = (n) => { let a = 2, b = 1; for (let i = 1; i < n; i++) [a, b] = [2 * a + b, a + b]; return [a, b]; };
function zigzag(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const pts = [[x1, y1], [x1 + ux * L * 0.25, y1 + uy * L * 0.25]];
  for (let i = 0; i < 6; i++) {
    const t = 0.25 + (0.5 * (i + 0.5)) / 6, sgn = i % 2 ? -1 : 1;
    pts.push([x1 + ux * L * t - uy * 7 * sgn, y1 + uy * L * t + ux * 7 * sgn]);
  }
  pts.push([x1 + ux * L * 0.75, y1 + uy * L * 0.75], [x2, y2]);
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

const phiTot = (n) => { let c = 0; for (let k = 1; k <= n; k++) if (gcd(k, n) === 1) c++; return c; };
const fareySize = (N) => { let c = 1; for (let k = 1; k <= N; k++) c += phiTot(k); return c; };

// Klein's picture of √2: the lattice points closest to the line y = √2·x, below and above it
const KLEIN_HULL = (N, above) => {
  // anchored on the axes: below the line at (1, 0), above it at (0, 1)
  const pts = [above ? [0, 1] : [1, 0]];
  for (let q = 1; q <= N; q++) pts.push([q, above ? Math.ceil(Math.SQRT2 * q) : Math.floor(Math.SQRT2 * q)]);
  // the side of the hull facing the line: an upper hull below it, a lower hull above it
  const hull = [];
  for (const P of pts) {
    while (hull.length >= 2) {
      const [a, b] = [hull[hull.length - 2], hull[hull.length - 1]], cr = (b[0] - a[0]) * (P[1] - a[1]) - (b[1] - a[1]) * (P[0] - a[0]);
      if (above ? cr <= 0 : cr >= 0) hull.pop(); else break;
    }
    hull.push(P);
  }
  return hull;
};

export default {
  id: 'contfrac',
  subject: 'math',
  title: 'Continued Fractions',
  level: 'Intermediate',
  cover: 'contfrac',
  tagline: 'The secret behind 355/113, leap years, musical scales, sunflowers, gears and eclipses.',
  description: r`Every number can be written as a continued fraction: a whole number plus one over a whole number plus one over… These expansions give the best possible fractional approximations, which explains the ancient approximations of π, the rules for leap years, why music uses 12 notes, why sunflowers use the golden angle, how to solve Pell's equation, how Huygens chose his gears, and when eclipses repeat.`,
  prereq: 'Number Theory',
  chapters: [
    {
      title: 'Building Continued Fractions',
      summary: 'Squares and approximations.',
      lessons: [
        {
          id: 'squares',
          title: 'Squares in Rectangles',
          summary: 'Euclid’s algorithm, drawn',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Warm-up',
              title: 'One over, one over…',
              body: r`Write $\frac{43}{30}$ as a whole part plus a remainder, then flip the remainder and repeat:
$$\frac{43}{30} = 1 + \frac{13}{30} = 1 + \cfrac{1}{\frac{30}{13}} = 1 + \cfrac{1}{2 + \cfrac{1}{3 + \cfrac{1}{4}}}$$
We abbreviate this **continued fraction** as $[1; 2, 3, 4]$. The steps are exactly Euclid's algorithm: divide, keep the remainder, swap, repeat.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Cutting off squares',
              body: r`Here's a picture of the same process: from a rectangle, cut off as many of the largest possible squares as you can, then repeat on the leftover strip. The numbers of squares of each size are the continued fraction terms. Change the rectangle.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 61, ymin: -1, ymax: 43, grid: false, axes: false, equal: true, maxWidth: 560,
                params: {
                  a: { min: 1, max: 60, step: 1, value: 43, label: 'width', color: 'blue' },
                  b: { min: 1, max: 42, step: 1, value: 30, label: 'height', color: 'coral' },
                },
                extra: sqExtra,
                readout: (p) => r`$\frac{${p.a}}{${p.b}} = ${cfString(squares(p.a, p.b).terms)}$`,
              },
              after: r`For a rational number, the process always ends, because the squares eventually tile the rectangle exactly. For an irrational number, it goes on forever.`,
            },
            {
              type: 'numeric',
              title: 'Count the squares',
              prompt: r`A $43 \times 30$ rectangle is cut into squares as above, with continued fraction $[1; 2, 3, 4]$. How many squares are there in total?`,
              unit: 'squares',
              answer: 10,
              wrong: [{ v: 4, why: 'That’s the number of different square sizes. Add up the counts: 1 + 2 + 3 + 4.' }],
              explain: r`$1 + 2 + 3 + 4 = 10$ squares: one $30 \times 30$, two $13 \times 13$, three $4 \times 4$ and four $1 \times 1$.`,
            },
            {
              type: 'numeric',
              title: 'Your turn',
              prompt: r`Run the same process on $\frac{157}{68}$. It gives $[2; 3, \,?\,, 5]$. What is the missing term?`,
              answer: 4,
              wrong: [{ v: 21, why: r`21 is the first remainder: $157 = 2 \times 68 + 21$. Next divide 68 by 21, then 21 by the new remainder.` }, { v: 5, why: 'That’s the last term. Find the one before it.' }],
              hint: r`$157 = 2 \times 68 + 21$, then $68 = 3 \times 21 + 5$, then divide 21 by 5.`,
              explain: r`$157 = 2 \times 68 + 21$, $\;68 = 3 \times 21 + 5$, $\;21 = 4 \times 5 + 1$, $\;5 = 5 \times 1$. The quotients $2, 3, 4, 5$ are the terms: $\frac{157}{68} = [2; 3, 4, 5]$.`,
            },
            {
              type: 'numeric',
              title: 'Back to a fraction',
              prompt: r`What number is $[2; 1, 3] = 2 + \cfrac{1}{1 + \cfrac{1}{3}}$? Give a decimal.`,
              answer: 2.75,
              tol: 0.001,
              wrong: [{ v: 2.25, why: r`Work from the bottom up: $1 + \frac13 = \frac43$, and its reciprocal is $\frac34$, not $\frac14$.` }, { v: 6, why: 'The terms are not added. Work from the innermost fraction outward.' }],
              hint: 'Start at the bottom: 1 + 1/3 = 4/3. Flip it and add 2.',
              explain: r`From the inside out: $1 + \frac13 = \frac43$, flipped is $\frac34$, so the value is $2 + \frac34 = \frac{11}{4} = 2.75$.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'All ones',
              body: r`Find a rectangle that gives **six or more** terms in which every term is 1 except the last (which is then always 2), so that the squares spiral inward one at a time.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 61, ymin: -1, ymax: 43, grid: false, axes: false, equal: true, maxWidth: 560,
                params: {
                  a: { min: 1, max: 60, step: 1, value: 40, label: 'width', color: 'blue' },
                  b: { min: 1, max: 42, step: 1, value: 25, label: 'height', color: 'coral' },
                },
                extra: sqExtra,
                readout: (p) => r`$\frac{${p.a}}{${p.b}} = ${cfString(squares(p.a, p.b).terms)}$`,
                goal: (p) => { const t = squares(p.a, p.b).terms; return t.length >= 6 && t.slice(0, -1).every((v) => v === 1) && t[t.length - 1] === 2; },
                hint: 'Each square’s side must be the sum of the next two. Work backwards from two 1 × 1 squares: 1, 1, 2, 3, 5, …',
                solution: { a: 34, b: 21 },
              },
              explain: r`Consecutive **Fibonacci numbers** work: $21 \times 13$, $34 \times 21$ or $55 \times 34$. Each square's side is the sum of the next two, which is just the Fibonacci rule $F_{n+1} = F_n + F_{n-1}$. As the rectangles grow, their shape approaches the golden ratio $[1; 1, 1, 1, \dots]$, which you'll meet again in a later lesson.`,
            },
          ],
          recap: [
            'A continued fraction repeatedly splits off whole parts and flips the remainder.',
            'Its terms come from Euclid’s algorithm, or from cutting squares off a rectangle.',
            'Rational numbers give finite continued fractions; irrational numbers infinite ones.',
          ],
        },
        {
          id: 'best',
          title: 'Best Approximations',
          summary: 'Why 355/113 is so good',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Convergents',
              body: r`Chop a continued fraction off after a few terms and you get a fraction called a **convergent**. Convergents are the best approximations possible: no fraction with a smaller denominator comes closer. Each bar shows a convergent; the longer the bar, the smaller its error (on a logarithmic scale). Choose a number and the number of terms.`,
              widget: {
                kind: 'graph', xmin: 0.4, xmax: 5.6, ymin: -10, ymax: 0.3, grid: false, axes: false, height: 260,
                params: {
                  which: { min: 0, max: 3, step: 1, value: 0, label: 'number', color: 'violet', format: (v) => NUMS[v][0] },
                  n: { min: 1, max: 5, step: 1, value: 2, label: 'terms', color: 'teal' },
                },
                extra: ({ plot, p, s }) => {
                  const [, x, terms] = NUMS[p.which], els = [];
                  els.push(s('line', { x1: plot.X(0.4), x2: plot.X(5.6), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--line-2)', 'stroke-width': 1.5 }));
                  for (let k = 1; k <= 5; k++) {
                    const [h, q] = convergent(terms, k), err = Math.abs(x - h / q);
                    const lg = Math.max(-9, Math.log10(Math.max(err, 1e-12)));
                    const on = k <= p.n;
                    els.push(s('rect', { x: plot.X(k - 0.3), y: plot.Y(0), width: plot.X(k + 0.3) - plot.X(k - 0.3), height: plot.Y(lg) - plot.Y(0), rx: 3, class: on ? 'fl-violet' : 'fl-surface', stroke: on ? 'none' : 'var(--line-2)' }));
                    els.push(s('text', { x: plot.X(k), y: plot.Y(lg) + 16, class: 'tick', 'text-anchor': 'middle', text: `${h}/${q}` }));
                  }
                  return els;
                },
                readout: (p) => {
                  const [name, x, terms] = NUMS[p.which];
                  const [h, q] = convergent(terms, p.n);
                  return r`${name} $\approx \frac{${h}}{${q}} = ${(h / q).toFixed(8)}$, error $${sci(Math.abs(x - h / q))}$`;
                },
              },
              after: r`For $\pi = [3; 7, 15, 1, 292, \dots]$ the convergents are $3, \frac{22}{7}, \frac{333}{106}, \frac{355}{113}, \dots$. The approximation $\frac{355}{113}$, found by the Chinese astronomer Zu Chongzhi in the 5th century, is correct to 6 decimal places.`,
            },
            { /*anim:contfrac*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A string pulled tight',
              body: r`Felix Klein's picture of the convergents. Draw the line $y = \sqrt2\,x$ through a grid of dots (each dot $(q, p)$ stands for the fraction $\frac pq$). Imagine pegs at all the dots, and a string on each side of the line, anchored at the corner and pulled taut towards infinity. Watch where the strings bend as more of the grid comes in.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 31, ymin: -1.5, ymax: 44, grid: false, axes: false, height: 360,
                animate: { param: 't', speed: 2.2, max: 34, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const N = Math.max(1, Math.min(30, Math.floor(p.t))), els = [];
                  let dots = '';
                  for (let q = 0; q <= 30; q++) for (let pp = 0; pp <= 43; pp++) dots += `M${plot.X(q).toFixed(1)} ${plot.Y(pp).toFixed(1)}h0.1`;
                  els.push(s('path', { d: dots, stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.4 }));
                  els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(30.5), y2: plot.Y(30.5 * Math.SQRT2), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                  for (const [above, col] of [[false, 'blue'], [true, 'coral']]) {
                    const H = KLEIN_HULL(N, above);
                    els.push(s('path', { d: H.map(([q, pp], i) => `${i ? 'L' : 'M'}${plot.X(q).toFixed(1)} ${plot.Y(pp).toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${col})`, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                    H.slice(1, -1).forEach(([q, pp]) => {
                      if (!['1/1', '3/2', '7/5', '17/12', '41/29'].includes(`${pp}/${q}`)) return;
                      els.push(s('circle', { cx: plot.X(q), cy: plot.Y(pp), r: 5, class: `fl-${col}` }));
                      els.push(s('text', { x: plot.X(q) + (above ? -8 : 8), y: plot.Y(pp) + (above ? -6 : 16), 'text-anchor': above ? 'end' : 'start', class: 'halo-text', style: `font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--${col})`, text: `${pp}/${q}` }));
                    });
                  }
                  return els;
                },
                readout: (p) => `grid up to denominator ${Math.max(1, Math.min(30, Math.floor(p.t)))} · the strings bend only at convergents of $\\sqrt2$: $\\tfrac11, \\tfrac32, \\tfrac75, \\tfrac{17}{12}, \\tfrac{41}{29}, \\ldots$`,
              },
              after: r`The corners of the {blue:lower string} are $\frac11, \frac75, \frac{41}{29}, \dots$ (just below $\sqrt2$) and the corners of the {coral:upper string} are $\frac32, \frac{17}{12}, \dots$ (just above). Together they are exactly the convergents of $\sqrt2 = [1; 2, 2, 2, \dots]$. That's why convergents are the best approximations: a fraction closer to the line, with a smaller denominator, would be a peg poking through the taut string.`,
            },
            {
              type: 'interactive',
              title: 'Record breakers',
              body: r`For each denominator $q$, take the closest fraction to $\pi$ with that denominator. Dots show how many decimal digits each one gets right (its accuracy, $-\log_{10}$ of the error), and **records**, fractions closer than everything before them, are labelled. Raise the largest denominator allowed until some fraction is within **one millionth** of $\pi$.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 124, ymin: -0.4, ymax: 8, grid: false, height: 300,
                axes: { xlabel: 'denominator q', ylabel: 'digits correct', xticks: 20, yticks: 1 },
                params: { Q: { min: 1, max: 120, step: 1, value: 10, label: 'largest denominator', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  const rec = new Set(piRecords(p.Q).map((b) => b.q));
                  for (let q = 1; q <= p.Q; q++) {
                    const y = Math.min(7.5, -Math.log10(piBest(q).err));
                    els.push(s('circle', { cx: plot.X(q), cy: plot.Y(y), r: rec.has(q) ? 5 : 2.5, class: rec.has(q) ? 'fl-violet' : 'fl-muted' }));
                  }
                  for (const b of piRecords(p.Q)) if ([1, 7, 106, 113].includes(b.q)) els.push(s('text', { x: plot.X(b.q) + (b.q > 100 ? -8 : 8), y: plot.Y(Math.min(7.5, -Math.log10(b.err))) - 8, class: 'tick', 'text-anchor': b.q > 100 ? 'end' : 'start', text: `${b.p}/${b.q}` }));
                  return els;
                },
                readout: (p) => { const rec = piRecords(p.Q), b = rec[rec.length - 1]; return r`Best with $q \le ${p.Q}$: $\frac{${b.p}}{${b.q}}$, error $${sci(b.err)}$`; },
                goal: (p) => piRecords(p.Q).slice(-1)[0].err < 1e-6,
                solution: { Q: 113 },
              },
              explain: r`Nothing beats $\frac{22}{7}$ until $q = 57$, and then a few fractions creep ahead by tiny margins, until $\frac{355}{113}$ suddenly cuts the error about 300-fold compared with $\frac{333}{106}$, to $2.7 \times 10^{-7}$. Every convergent sets a record. (A few "intermediate" fractions like $\frac{179}{57}$ also sneak in as records; if error is measured as $|q\pi - p|$ instead, the records are exactly the convergents.)`,
            },
            {
              type: 'numeric',
              title: 'How good is 22/7?',
              prompt: r`By how much does $\frac{22}{7}$ exceed $\pi$? (Give 3 significant figures.)`,
              answer: 22 / 7 - Math.PI,
              relTol: 0.01,
              wrong: [{ v: 0.00143, tol: 0.00002, why: r`$\frac{22}{7} = 3.142857\ldots$ and $\pi = 3.141593\ldots$` }],
              explain: r`$\frac{22}{7} - \pi = 3.142857 - 3.141593 \approx 0.00126$. That's about $\frac{1}{15 \times 7^2}$, in line with the rule that the error is roughly $\frac{1}{a_{n+1}q^2}$, where the next term is $a_{n+1} = 15$.`,
            },
            {
              type: 'mcq',
              title: 'The big jump',
              prompt: r`Why is $\frac{355}{113}$ such an unusually good approximation for its size?`,
              choices: [
                { t: 'The next term in π’s continued fraction is 292, so the following convergent needs a far larger denominator', ok: true },
                { t: '113 is prime', why: 'Primality has nothing to do with it. The size of the next continued fraction term is what matters.' },
                { t: 'π is a rational number close to 355/113', why: 'π is irrational. 355/113 is just a very good approximation.' },
              ],
              explain: r`A large term means the remainder at that stage is tiny, so stopping just before it loses very little. The error of a convergent is roughly $\frac{1}{a_{n+1} q^2}$: with $a_{n+1} = 292$, the error is only about $3 \times 10^{-7}$. The next better fraction, $\frac{103993}{33102}$, needs a denominator nearly 300 times bigger.`,
            },
            {
              type: 'mcq',
              title: 'Close call',
              prompt: r`Which is closer to $\sqrt2 = 1.41421\ldots$?`,
              cols: 2,
              choices: [
                { t: r`$\frac75$`, ok: true },
                { t: r`$\frac{10}{7}$`, why: r`$\frac{10}{7} = 1.42857$, an error of $0.0144$, while $\frac75 = 1.4$ is off by $0.0142$.` },
              ],
              explain: r`$\frac75 = 1.4$ is off by $0.0142$; $\frac{10}{7} = 1.4286$ is off by $0.0144$. The convergent $\frac75$ wins despite its smaller denominator, exactly as the best-approximation property promises.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Next convergent',
              prompt: r`The convergents of $\sqrt2 = [1; 2, 2, 2, \dots]$ follow the rule: each new numerator is $2\times$ the previous numerator plus the one before (same for denominators). Starting $\frac11, \frac32, \frac75, \frac{17}{12}$, what's the next numerator?`,
              answer: 41,
              wrong: [{ v: 34, why: 'Use 2 × 17 + 7 (the previous two numerators).' }],
              explain: r`$2 \times 17 + 7 = 41$ and $2 \times 12 + 5 = 29$: $\frac{41}{29} \approx 1.41379$. Then $\frac{99}{70} \approx 1.414286$: ancient Indian and Greek mathematicians used fractions from this very sequence.`,
            },
          ],
          recap: [
            'Truncating a continued fraction gives convergents, the best rational approximations.',
            'Large terms make the preceding convergent exceptionally accurate (355/113 for π).',
            'Convergents obey a simple recurrence.',
          ],
        },
      ],
    },
    {
      title: 'Continued Fractions at Work',
      summary: 'Calendars, music and sunflowers.',
      lessons: [
        {
          id: 'calendars',
          title: 'Calendars & Music',
          summary: 'Leap years and 12 notes',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Fitting days into years',
              body: r`A year is about 365.24219 days. The fractional part $0.24219 = [0; 4, 7, 1, 3, \dots]$ has convergents
$$\tfrac14, \quad \tfrac{7}{29}, \quad \tfrac{8}{33}, \quad \tfrac{31}{128}, \dots$$
$\frac14$ is the Julian calendar: one leap day every 4 years. $\frac{8}{33}$, 8 leap days every 33 years, was used in a Persian calendar designed with Omar Khayyam's help in the 11th century, and is even more accurate than our Gregorian rule ($\frac{97}{400}$).`,
            },
            {
              type: 'numeric',
              title: 'Drift of the Julian calendar',
              prompt: r`The Julian calendar's year is 365.25 days, while the true year is 365.24219 days. About how many years does it take for the calendar to drift by a full day? (Nearest whole number.)`,
              unit: 'years',
              answer: Math.round(1 / (365.25 - 365.24219)),
              tol: 1,
              wrong: [{ v: 4, why: 'That’s the leap year cycle. The drift is 0.00781 days per year, so divide 1 by that.' }],
              explain: r`$\frac{1}{0.00781} \approx 128$ years per day. By 1582 the calendar had drifted about 10 days, so Pope Gregory XIII dropped 10 days and introduced the Gregorian rule: skip leap years in century years not divisible by 400.`,
            },
            {
              type: 'numeric',
              title: 'The Gregorian fix',
              prompt: r`The Gregorian calendar has 97 leap years every 400 years, so its average year is $365 + \frac{97}{400} = 365.2425$ days. Roughly how many years does it take to drift a full day from the true 365.24219-day year?`,
              unit: 'years',
              answer: 1 / 0.00031,
              relTol: 0.06,
              wrong: [{ v: 128, relTol: 0.05, why: 'That’s the Julian calendar. Here the error is only 0.00031 days per year.' }],
              explain: r`The error is $365.2425 - 365.24219 = 0.00031$ days per year, so a full day takes about $\frac{1}{0.00031} \approx 3200$ years. Good enough for a few millennia. (The true year length itself also changes slowly, so more precision would be pointless.)`,
            },
            {
              type: 'mcq',
              title: 'Most accurate rule',
              prompt: r`Which leap-year rule has the average year closest to 365.24219 days?`,
              cols: 2,
              choices: [
                { t: r`$\frac{31}{128}$`, ok: true },
                { t: r`$\frac{97}{400}$ (Gregorian)`, why: r`$\frac{97}{400} = 0.2425$, an error of $0.00031$. A convergent with a smaller denominator does better.` },
                { t: r`$\frac{8}{33}$`, why: r`$\frac{8}{33} = 0.24242$, an error of $0.00023$: good, but not the best here.` },
                { t: r`$\frac14$ (Julian)`, why: r`$\frac14$ is off by $0.0078$, the worst of these.` },
              ],
              explain: r`$\frac{31}{128} = 0.2421875$, within $0.000003$ of $0.24219$: a convergent beats $\frac{97}{400}$ despite the smaller denominator. It would mean "a leap year every 4 years, except skip one every 128 years". The Gregorian rule won because centuries are easy to remember.`,
            },
            {
              type: 'numeric',
              title: 'Why 12 notes?',
              prompt: r`A perfect fifth has frequency ratio $\frac32$. We want $n$ equal steps per octave so that some whole number $m$ of steps makes a fifth: $\frac{m}{n} \approx \log_2 1.5 = [0; 1, 1, 2, 2, 3, \dots]$. Its convergents are $1, \frac12, \frac35, \frac{7}{12}, \dots$. In the 12-note scale, how many steps make a perfect fifth?`,
              unit: 'steps',
              answer: 7,
              wrong: [{ v: 5, why: 'That’s a perfect fourth. The convergent is 7/12.' }],
              explain: r`$\frac{7}{12}$: 7 semitones (C to G) make a fifth, with $2^{7/12} \approx 1.4983$, very close to 1.5. The next convergents, $\frac{24}{41}$ and $\frac{31}{53}$, explain why music theorists have experimented with 41- and 53-note scales.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Better scales',
              body: r`Divide the octave into $n$ equal steps. The dial shows the steps as ticks and the true perfect fifth (701.96 cents, where 1200 cents make an octave) as the amber line. Find the smallest $n$ **greater than 12** whose nearest step is within **1 cent** of a true fifth.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 400,
                params: { n: { min: 5, max: 60, step: 1, value: 12, label: 'notes per octave', color: 'blue' } },
                extra: ({ plot, p, s }) => {
                  const pt = (c, r) => { const a = Math.PI / 2 - (2 * Math.PI * c) / 1200; return [plot.X(r * Math.cos(a)), plot.Y(r * Math.sin(a))]; };
                  const { m } = fifthIn(p.n), els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 2 })];
                  for (let k = 0; k < p.n; k++) {
                    const [x1, y1] = pt((1200 * k) / p.n, 0.82), [x2, y2] = pt((1200 * k) / p.n, 1.0);
                    els.push(s('line', { x1, y1, x2, y2, stroke: k === m ? 'var(--blue)' : 'var(--ink-3)', 'stroke-width': k === m ? 7 : 2.5 }));
                  }
                  const [fx1, fy1] = pt(FIFTH, 0.6), [fx2, fy2] = pt(FIFTH, 1.15);
                  els.push(s('line', { x1: fx1, y1: fy1, x2: fx2, y2: fy2, stroke: 'var(--amber)', 'stroke-width': 3 }));
                  const [tx, ty] = pt(0, 1.18);
                  els.push(s('text', { x: tx, y: ty, class: 'tick', 'text-anchor': 'middle', text: 'octave start' }));
                  return els;
                },
                readout: (p) => { const { m, err } = fifthIn(p.n); return `Best fifth: **${m}** of ${p.n} steps, off by **${err.toFixed(2)}** cents`; },
                goal: (p) => p.n > 12 && fifthIn(p.n).err < 1,
                hint: r`Try the next convergents of $\log_2 1.5$ after $\frac{7}{12}$: $\frac{24}{41}$ and $\frac{31}{53}$.`,
                solution: { n: 41 },
              },
              explain: r`With 12 notes the fifth is off by 1.96 cents; with 41 notes, 24 steps are off by only 0.48 cents, and 53 notes do better still (0.07 cents). These are the denominators of the next convergents. In between, 29 notes come within 1.49 cents, but nothing reaches 1 cent until 41.`,
            },
          ],
          recap: [
            'Leap year rules approximate 0.24219 with convergents like 1/4 and 8/33.',
            'The Julian calendar drifts a day every 128 years.',
            'The 12-note scale comes from the convergent 7/12 of log₂(3/2).',
          ],
        },
        {
          id: 'golden',
          title: 'The Most Irrational Number',
          summary: 'φ and sunflowers',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'All ones',
              body: r`The golden ratio $\varphi = \frac{1 + \sqrt5}{2}$ has the simplest continued fraction of all: $[1; 1, 1, 1, \dots]$. Its convergents are ratios of Fibonacci numbers, $\frac21, \frac32, \frac53, \frac85, \dots$.

Since all its terms are as small as possible, every convergent is only a modest improvement on the last: $\varphi$ is the hardest number to approximate by fractions. In this precise sense it is the **most irrational** number.`,
            },
            {
              type: 'numeric',
              title: 'Self-similar',
              prompt: r`$x = [2; 2, 2, 2, \dots]$ satisfies $x = 2 + \frac1x$, because the tail after the first term is $x$ again. What is $x$? (3 decimal places.)`,
              answer: 1 + Math.SQRT2,
              tol: 0.002,
              wrong: [{ v: Math.SQRT2, tol: 0.002, why: r`That's $[1; 2, 2, \dots]$. This one starts with 2.` }, { v: 2.5, tol: 0.01, why: r`That's $2 + \frac12$, just the first two terms. Solve $x^2 = 2x + 1$.` }],
              hint: r`Multiply by $x$: $x^2 - 2x - 1 = 0$. Take the positive root.`,
              explain: r`$x^2 - 2x - 1 = 0$ gives $x = 1 + \sqrt2 \approx 2.414$. The same trick on $\varphi = 1 + \frac{1}{\varphi}$ gives $\varphi^2 = \varphi + 1$, so $\varphi = \frac{1 + \sqrt5}{2}$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Packing seeds',
              prompt: r`A sunflower adds seeds one at a time, each turned by a fixed angle from the previous one and slightly further out. Find the turning angle that packs the seeds evenly, with no gaps or straight spokes. (Hint: it's $360°$ divided by $\varphi^2$.)`,
              widget: {
                kind: 'graph', xmin: -1.1, xmax: 1.1, ymin: -1.1, ymax: 1.1, grid: false, axes: false, equal: true, maxWidth: 400,
                params: { ang: { min: 130, max: 145, step: 0.1, value: 135, label: 'turning angle', color: 'amber', format: (v) => `${v.toFixed(1)}°` } },
                extra: ({ plot, p, s }) => {
                  let d = '';
                  for (let i = 1; i <= 400; i++) {
                    const rr = Math.sqrt(i / 400), a = (i * p.ang * Math.PI) / 180;
                    d += `M${plot.X(rr * Math.cos(a)).toFixed(1)} ${plot.Y(rr * Math.sin(a)).toFixed(1)}h0`;
                  }
                  return [s('path', { d, stroke: 'var(--amber)', 'stroke-width': 9, 'stroke-linecap': 'round' })];
                },
                readout: (p) => (Math.abs(p.ang - GOLDEN) < 0.06 ? `${p.ang.toFixed(1)}°: the golden angle. Seeds pack evenly.` : `${p.ang.toFixed(1)}°: ${Math.abs(p.ang - GOLDEN) < 1 ? 'nearly there, but spirals of gaps remain' : 'seeds line up in spokes, leaving gaps'}`),
                goal: (p) => Math.abs(p.ang - GOLDEN) < 0.06,
                hint: r`$\frac{360°}{\varphi^2} = \frac{360°}{2.618} \approx 137.5°$.`,
                solution: { ang: 137.5 },
              },
              explain: r`The **golden angle**, about $137.5°$. If the angle were a simple fraction of a full turn, like $\frac{3}{8}$ of $360°$, seeds would line up in 8 spokes with gaps between. Because $\varphi$ is so badly approximated by fractions, the golden angle never lines up, spreading seeds evenly. The visible spirals come in Fibonacci numbers (often 34 and 55, or 55 and 89), the denominators of $\varphi$'s convergents.`,
            },
            {
              type: 'numeric',
              title: 'Spokes',
              prompt: r`At a turning angle of exactly $135°$, which is $\frac38$ of a full turn, the seeds line up in straight spokes. How many spokes?`,
              unit: 'spokes',
              answer: 8,
              wrong: [{ v: 3, why: r`After 8 seeds the pattern has turned exactly $3 \times 360°$, so seed 9 lands in line with seed 1. Count the distinct directions.` }],
              explain: r`Seeds $1, 9, 17, \dots$ all point the same way, since $8 \times 135° = 3 \times 360°$. So there are 8 directions, 8 spokes, with gaps between them. Any rational angle $\frac{p}{q}$ of a turn gives $q$ spokes; irrational angles avoid this, and the golden angle avoids it best.`,
            },
            {
              type: 'explain',
              title: 'Hurwitz’s theorem',
              body: r`How close can fractions get to an irrational number $x$? In 1891 Adolf Hurwitz proved that infinitely many fractions satisfy
$$\left| x - \frac{p}{q} \right| < \frac{1}{\sqrt5\, q^2},$$
and that $\sqrt5$ cannot be replaced by anything bigger. The number that stops any improvement is $\varphi$ (and numbers whose continued fractions end in all 1s). Every other irrational allows better approximations. That is the precise meaning of "most irrational".`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ten ones',
              prompt: r`$[1] = 1$, $[1; 1] = 2$, $[1; 1, 1] = \frac32$, $[1; 1, 1, 1] = \frac53$. What is the numerator of $[1; 1, 1, \dots, 1]$ with **ten** ones (in lowest terms)?`,
              answer: 89,
              wrong: [{ v: 55, why: 'That’s the denominator. The value is a ratio of consecutive Fibonacci numbers.' }, { v: 144, why: 'One too far along: with 4 ones you get 5/3, so with 10 ones…' }],
              hint: 'With k ones you get F(k+1)/F(k): 1/1, 2/1, 3/2, 5/3, 8/5, …',
              explain: r`With $k$ ones the value is $\frac{F_{k+1}}{F_k}$, so ten ones give $\frac{89}{55} = 1.61818\ldots$, already within $0.00004$ of $\varphi$. Each new term only flips the fraction and adds 1, which turns $\frac{F_{k+1}}{F_k}$ into $\frac{F_{k+2}}{F_{k+1}}$.`,
            },
          ],
          recap: [
            r`$\varphi = [1; 1, 1, \dots]$, with Fibonacci-ratio convergents.`,
            'All-small terms make φ the hardest number to approximate: the “most irrational”.',
            'The golden angle (≈137.5°) packs sunflower seeds evenly.',
          ],
        },
      ],
    },
    {
      title: 'Deeper Patterns',
      summary: 'Square roots, Farey fractions, gears and eclipses.',
      lessons: [
        {
          id: 'roots',
          title: 'Square Roots & Pell',
          summary: 'Patterns that repeat forever',
          icon: 'sigma',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Peeling √2',
              body: r`$\sqrt2 = 1.414\ldots$, so its whole part is 1 and the remainder is $\sqrt2 - 1$. The next step of a continued fraction flips the remainder.`,
              prompt: r`What is $\dfrac{1}{\sqrt2 - 1}$?`,
              choices: [
                { t: r`$\sqrt2 + 1$`, ok: true },
                { t: r`$\sqrt2 - 1$`, why: r`Multiply top and bottom by $\sqrt2 + 1$: the bottom becomes $(\sqrt2-1)(\sqrt2+1) = 2 - 1 = 1$.` },
                { t: r`$\frac{1}{\sqrt2} + 1$`, why: r`Reciprocals don't split over subtraction like that. Multiply top and bottom by $\sqrt2 + 1$.` },
                { t: r`$2\sqrt2$`, why: r`$2\sqrt2 \approx 2.83$, but $\frac{1}{0.414} \approx 2.414$.` },
              ],
              explain: r`$\dfrac{1}{\sqrt2 - 1} = \dfrac{\sqrt2 + 1}{(\sqrt2 - 1)(\sqrt2 + 1)} = \sqrt2 + 1 = 2.414\ldots$ Its whole part is 2 and its remainder is $\sqrt2 - 1$ **again**. So the process repeats forever: $\sqrt2 = [1; 2, 2, 2, \dots]$.`,
            },
            {
              type: 'explain',
              title: 'Periodic patterns',
              body: r`Every square root of a whole number (that isn't a perfect square) has a continued fraction that eventually repeats:
$$\sqrt3 = [1;\, \overline{1, 2}\,], \qquad \sqrt7 = [2;\, \overline{1, 1, 1, 4}\,], \qquad \sqrt{13} = [3;\, \overline{1, 1, 1, 1, 6}\,].$$
The repeating block always ends in twice the first term, and the rest of the block reads the same backwards.

::: key
**Lagrange's theorem** (1770): a continued fraction eventually repeats exactly when the number solves a quadratic equation with whole-number coefficients.
:::

Compare decimals, which repeat exactly for fractions. Continued fractions reach one level further.`,
            },
            {
              type: 'numeric',
              title: 'Spot the pattern',
              prompt: r`$\sqrt5 = 2.236\ldots = [2; \overline{a}\,]$ repeats a single term. What is $a$?`,
              answer: 4,
              wrong: [{ v: 2, why: 'The repeating block ends in twice the first term.' }, { v: 1, why: r`$\frac{1}{\sqrt5 - 2} = \sqrt5 + 2 = 4.236\ldots$` }],
              hint: r`Flip the remainder: $\frac{1}{\sqrt5 - 2}$. Multiply top and bottom by $\sqrt5 + 2$.`,
              explain: r`$\frac{1}{\sqrt5 - 2} = \sqrt5 + 2 = 4.236\ldots$, whose remainder is again $\sqrt5 - 2$. So $\sqrt5 = [2; 4, 4, 4, \dots]$, and the repeating term is $2 \times 2 = 4$, as the rule promises.`,
            },
            {
              type: 'explain',
              title: 'Pell’s equation',
              body: r`Look at the convergents of $\sqrt2$: $\frac11, \frac32, \frac75, \frac{17}{12}, \frac{41}{29}, \dots$ and compute $x^2 - 2y^2$:
$$3^2 - 2\cdot 2^2 = 1, \quad 7^2 - 2 \cdot 5^2 = -1, \quad 17^2 - 2\cdot 12^2 = 1, \quad \ldots$$
Because the convergents are so close to $\sqrt2$, $x^2 - 2y^2$ stays tiny, and since it's a whole number it must be $\pm 1$.

The equation $x^2 - n y^2 = 1$ is called **Pell's equation**. Its whole-number solutions always lurk among the convergents of $\sqrt n$. Indian mathematicians, Brahmagupta in the 7th century and Bhāskara II in the 12th, had methods for solving it centuries before Europe.`,
            },
            {
              type: 'interactive',
              kicker: 'Explore',
              title: 'Hunting for solutions',
              body: r`Choose $n$ to see the continued fraction of $\sqrt n$ and the smallest solution of $x^2 - n y^2 = 1$ (with $y \ge 1$). Some are tiny, some are huge. Find the $n$ up to 30 whose smallest $x$ is greater than **1000**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 11, grid: false, axes: false, height: 230,
                params: { n: { min: 2, max: 30, step: 1, value: 7, label: 'n', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const d = sqrtCF(p.n);
                  if (!d) return [s('text', { x: plot.X(6), y: plot.Y(5.5), class: 'lbl', 'text-anchor': 'middle', text: `${p.n} is a perfect square: √${p.n} = ${Math.sqrt(p.n)} exactly` })];
                  const terms = [d.a0, ...d.per, ...d.per, ...d.per].slice(0, 11);
                  return terms.flatMap((t, i) => {
                    const h = Math.min(10, t), rep = i > 0, col = rep ? (((i - 1) % d.per.length) === d.per.length - 1 ? 'fl-coral' : 'fl-teal') : 'fl-muted';
                    return [
                      s('rect', { x: plot.X(i + 0.6), y: plot.Y(h), width: plot.X(1.4) - plot.X(0.6), height: plot.Y(0) - plot.Y(h), rx: 3, class: col }),
                      s('text', { x: plot.X(i + 1), y: plot.Y(h) - 6, class: 'tick', 'text-anchor': 'middle', text: String(t) }),
                    ];
                  });
                },
                readout: (p) => {
                  const d = sqrtCF(p.n);
                  if (!d) return 'Choose a number that is not a perfect square.';
                  return r`$\sqrt{${p.n}} = [${d.a0};\, \overline{${d.per.join(', ')}}\,]$ · smallest solution $x = ${d.x}$, $y = ${d.y}$`;
                },
                goal: (p) => { const d = sqrtCF(p.n); return !!d && d.x > 1000n; },
                solution: { n: 29 },
              },
              hint: 'Long repeating blocks tend to give big solutions. Try the numbers whose blocks look the most irregular.',
              explain: r`$n = 29$: the smallest solution is $9801^2 - 29 \times 1820^2 = 1$. (Its neighbour $n = 13$ gives $649^2 - 13 \times 180^2 = 1$.) In 1657 Fermat challenged mathematicians to solve $x^2 - 61y^2 = 1$; the smallest solution is $x = 1{,}766{,}319{,}049$, $y = 226{,}153{,}980$, and Bhāskara II had already found it in 1150.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The next solution',
              prompt: r`Solutions of $x^2 - 2y^2 = 1$ can be multiplied: if $(x + y\sqrt2)$ comes from a solution, so do its powers. From $3 + 2\sqrt2$ and $17 + 12\sqrt2$, what is $x$ in the next solution, $(17 + 12\sqrt2)(3 + 2\sqrt2)$?`,
              answer: 99,
              wrong: [{ v: 51, why: r`Don't forget the $12\sqrt2 \times 2\sqrt2 = 48$ term.` }, { v: 41, why: r`$41^2 - 2 \times 29^2 = -1$, not $+1$. Multiply out the brackets.` }, { v: 70, why: 'That’s y. The question asks for x.' }],
              hint: r`$(17 + 12\sqrt2)(3 + 2\sqrt2) = 51 + 34\sqrt2 + 36\sqrt2 + 24 \times 2$.`,
              explain: r`$51 + 48 = 99$ and $34 + 36 = 70$, giving $99 + 70\sqrt2$. Check: $99^2 - 2 \times 70^2 = 9801 - 9800 = 1$. And $\frac{99}{70} = 1.4142857$, a convergent of $\sqrt2$ accurate to 5 digits. Pell's equation has infinitely many solutions, all powers of the smallest.`,
            },
          ],
          recap: [
            r`Square roots have repeating continued fractions, like $\sqrt2 = [1; 2, 2, 2, \dots]$.`,
            'Lagrange: eventually periodic ⇔ a root of a quadratic with whole-number coefficients.',
            'Convergents of √n solve Pell’s equation x² − ny² = ±1.',
            'All solutions of x² − ny² = 1 are powers of the smallest one.',
          ],
        },
        {
          id: 'farey',
          title: 'Farey Fractions',
          summary: 'Neighbours, mediants and kissing circles',
          icon: 'grip',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Squeeze one in',
              prompt: r`Which fraction with the **smallest possible denominator** lies strictly between $\frac13$ and $\frac12$? Enter its denominator.`,
              answer: 5,
              wrong: [{ v: 6, why: r`$\frac26 = \frac13$ and $\frac36 = \frac12$ sit on the ends, not between them. Try smaller denominators.` }, { v: 4, why: r`Quarters jump from $\frac14$ (too small) straight to $\frac24 = \frac12$.` }, { v: 12, why: r`$\frac{5}{12}$ works, but a smaller denominator does too.` }],
              explain: r`$\frac25 = 0.4$. No fraction with denominator 2, 3 or 4 fits between $0.333\ldots$ and $0.5$. Notice that $\frac25 = \frac{1 + 1}{3 + 2}$: add the tops and add the bottoms. This "wrong" way of adding fractions turns out to be exactly right here.`,
            },
            {
              type: 'explain',
              title: 'Farey sequences and mediants',
              body: r`List all fractions between 0 and 1 with denominator at most 5, in order. This is the **Farey sequence** $F_5$:
$$\tfrac01,\ \tfrac15,\ \tfrac14,\ \tfrac13,\ \tfrac25,\ \tfrac12,\ \tfrac35,\ \tfrac23,\ \tfrac34,\ \tfrac45,\ \tfrac11$$

::: key
Neighbours $\frac ab < \frac cd$ in a Farey sequence always satisfy $bc - ad = 1$, and the first fraction to appear between them, as the denominators grow, is their **mediant** $\dfrac{a + c}{b + d}$.
:::

Check: $\frac13$ and $\frac25$ give $3 \times 2 - 1 \times 5 = 1$. Starting from $\frac01$ and $\frac11$ and inserting mediants forever produces every fraction exactly once, in lowest terms (the **Stern–Brocot tree**).`,
            },
            {
              type: 'numeric',
              title: 'Count them',
              prompt: r`How many fractions are in the Farey sequence $F_6$ (including $\frac01$ and $\frac11$)?`,
              answer: 13,
              wrong: [{ v: 11, why: r`That's $F_5$. Add the new sixths in lowest terms.` }, { v: 16, why: r`$\frac26$, $\frac36$ and $\frac46$ simplify to fractions already in the list. Only $\frac16$ and $\frac56$ are new.` }],
              explain: r`$F_5$ has 11 fractions. The new ones in lowest terms are $\frac16$ and $\frac56$, so $F_6$ has 13. In general, going from $F_{n-1}$ to $F_n$ adds $\varphi(n)$ fractions, the number of whole numbers below $n$ that share no factor with it.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Ford circles',
              body: r`Above each fraction $\frac pq$ (in lowest terms), draw a circle resting on the number line with radius $\frac{1}{2q^2}$. Raise the largest denominator and watch.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.06, xmax: 1.06, ymin: -0.1, ymax: 0.56, grid: false, axes: false, maxWidth: 600,
                params: { N: { min: 1, max: 12, step: 1, value: 5, label: 'largest denominator', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const cols = ['blue', 'coral', 'teal', 'amber', 'violet', 'pink'];
                  const els = [s('line', { x1: plot.X(-0.06), x2: plot.X(1.06), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  for (let q = 1; q <= p.N; q++) for (let k = 0; k <= q; k++) {
                    if (gcd(k, q) !== 1) continue;
                    const r0 = 1 / (2 * q * q), c = cols[(q - 1) % cols.length];
                    els.push(s('circle', { cx: plot.X(k / q), cy: plot.Y(r0), r: plot.X(r0) - plot.X(0), class: `fl-${c}-soft`, stroke: `var(--${c})`, 'stroke-width': 1.5 }));
                    if (q <= 5) els.push(s('text', { x: plot.X(k / q), y: plot.Y(-0.06), class: 'tick', 'text-anchor': 'middle', text: `${k}/${q}` }));
                  }
                  return els;
                },
                readout: (p) => `$F_{${p.N}}$ has **${fareySize(p.N)}** fractions. Circles never overlap; neighbours always touch.`,
              },
              after: r`Two Ford circles touch exactly when their fractions are Farey neighbours ($bc - ad = 1$), and the biggest circle fitting in the gap between two touching circles sits over their mediant. Fractions that approximate $x$ well have big circles close to $x$, so walking down to $x$ through the circles traces out its convergents.`,
            },
            {
              type: 'mcq',
              title: 'In the gap',
              prompt: r`The Ford circles over $\frac38$ and $\frac25$ touch. Which fraction's circle is the largest one that fits in the gap between them?`,
              cols: 2,
              choices: [
                { t: r`$\frac{5}{13}$`, ok: true },
                { t: r`$\frac{1}{2}$`, why: r`$\frac12$ isn't between $\frac38 = 0.375$ and $\frac25 = 0.4$.` },
                { t: r`$\frac{7}{18}$`, why: r`$\frac{7}{18}$ is in the gap, but it isn't the mediant, and its circle is smaller than that of $\frac{5}{13}$.` },
                { t: r`$\frac{31}{80}$`, why: r`That's the average of the two fractions. Its denominator is large, so its circle is tiny.` },
              ],
              explain: r`The mediant: $\frac{3 + 2}{8 + 5} = \frac{5}{13}$. Check that they are neighbours: $8 \times 2 - 3 \times 5 = 1$. The fraction with the smallest denominator in the gap has the biggest circle, and that is always the mediant.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Batting average',
              body: r`A cricket or baseball statistic is shown as a decimal, and the true value is some fraction $\frac{\text{hits}}{\text{attempts}}$.`,
              prompt: r`A player's success rate is strictly between $0.31$ and $0.32$. What is the smallest number of attempts they could have made?`,
              answer: 16,
              wrong: [{ v: 3, why: r`$\frac13 = 0.333$ is above $0.32$.` }, { v: 13, why: r`$\frac{4}{13} = 0.3077$ is just below $0.31$.` }, { v: 19, why: r`$\frac{6}{19} = 0.3158$ works, but a smaller denominator does too.` }, { v: 100, why: 'The rate could be a fraction with a much smaller denominator than 100.' }],
              hint: r`Start from neighbours around the interval, like $\frac{3}{10} < \frac13$, and take mediants, keeping whichever side contains the interval.`,
              explain: r`Take mediants towards the interval: $\frac{3}{10}, \frac13 \to \frac{4}{13} = 0.3077$ (too small); $\frac{4}{13}, \frac13 \to \frac{5}{16} = 0.3125$. It's inside, so the answer is 16 attempts (5 hits). Mediant-hunting, really a walk down the Stern–Brocot tree, always finds the fraction with the smallest denominator in an interval, and it is the same calculation as finding a continued fraction.`,
            },
          ],
          recap: [
            'The Farey sequence Fₙ lists all fractions in [0, 1] with denominator ≤ n.',
            'Neighbours a/b < c/d satisfy bc − ad = 1; the first fraction between them is the mediant (a+c)/(b+d).',
            'Ford circles of neighbouring fractions touch, and never overlap.',
            'Mediants find the simplest fraction in any interval.',
          ],
        },
        {
          id: 'machines',
          title: 'Gears, Ladders & Eclipses',
          summary: 'Continued fractions in machines and skies',
          icon: 'clock',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'Huygens’s planetarium',
              body: r`In 1680 Christiaan Huygens designed a clockwork planetarium for the French Academy. By his figures, Earth's pointer turns $29.42545\ldots$ times for every turn of Saturn's. One pair of gears must produce this: a small gear on Earth's axle drives a big gear on Saturn's axle, and the ratio of their teeth sets the speed ratio. Teeth come in whole numbers, and a small gear can't have too many. Find a pair, with **at most 20 teeth** on the small gear, within $0.004$ of the true ratio.`,
              widget: {
                kind: 'graph', xmin: 29.355, xmax: 29.495, ymin: -1, ymax: 1, grid: false, axes: false, height: 180,
                params: {
                  q: { min: 5, max: 20, step: 1, value: 10, label: 'small gear teeth', color: 'blue' },
                  p: { min: 100, max: 600, step: 1, value: 300, label: 'big gear teeth', color: 'coral' },
                },
                extra: ({ plot, p, s }) => {
                  const v = p.p / p.q, x = Math.max(29.362, Math.min(29.488, v));
                  const ticks = [29.36, 29.38, 29.4, 29.42, 29.44, 29.46, 29.48].flatMap((t) => [
                    s('line', { x1: plot.X(t), x2: plot.X(t), y1: plot.Y(-0.25), y2: plot.Y(-0.1), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
                    s('text', { x: plot.X(t), y: plot.Y(-0.25) + 16, class: 'tick', 'text-anchor': 'middle', text: t.toFixed(2) }),
                  ]);
                  return [
                    s('line', { x1: plot.X(29.355), x2: plot.X(29.495), y1: plot.Y(-0.1), y2: plot.Y(-0.1), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
                    ...ticks,
                    s('line', { x1: plot.X(SATURN), x2: plot.X(SATURN), y1: plot.Y(-0.8), y2: plot.Y(0.8), stroke: 'var(--amber)', 'stroke-width': 3 }),
                    s('text', { x: plot.X(SATURN), y: plot.Y(0.85), class: 'tick', 'text-anchor': 'middle', text: 'target' }),
                    s('circle', { cx: plot.X(x), cy: plot.Y(0.25), r: 8, class: x === v ? 'fl-blue' : 'fl-muted' }),
                    x !== v ? s('text', { x: plot.X(x), y: plot.Y(0.6), class: 'tick', 'text-anchor': v < 29.36 ? 'start' : 'end', text: v < 29.36 ? '← off the scale' : 'off the scale →' }) : null,
                  ];
                },
                readout: (p) => r`$\frac{${p.p}}{${p.q}} = ${(p.p / p.q).toFixed(5)}$, error $${Math.abs(p.p / p.q - SATURN).toFixed(5)}$`,
                goal: (p) => Math.abs(p.p / p.q - SATURN) < 0.004,
                hint: 'For each small gear, the best big gear is about 29.43 times as many teeth. Try every small gear from 5 to 20.',
                solution: { q: 7, p: 206 },
              },
              explain: r`$\frac{206}{7} = 29.42857$, with error $0.0031$. Huygens used exactly these gears: 7 teeth driving 206. His exact ratio $\frac{77708431}{2640858}$ has continued fraction $[29; 2, 2, 1, 5, 1, 4, \dots]$, with convergents $29, \frac{59}{2}, \frac{147}{5}, \frac{206}{7}, \frac{1177}{40}, \dots$, so $\frac{206}{7}$ is a convergent, and no small gear with 25 teeth or fewer does better. Huygens described using continued fractions for exactly this purpose.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A ladder of resistors',
              body: r`Build a ladder from identical $1\,\Omega$ resistors: each section adds one resistor along the top and one rung down to the bottom rail. Add sections and watch the total resistance between the two terminals on the left.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 9.6, ymin: 0, ymax: 3, grid: false, axes: false, height: 230,
                params: { n: { min: 1, max: 6, step: 1, value: 1, label: 'sections', color: 'amber' } },
                extra: ({ plot, p, s }) => {
                  const T = plot.Y(2.4), B = plot.Y(0.6), els = [];
                  const X = (k) => plot.X(0.6 + 1.4 * k);
                  for (let k = 0; k < p.n; k++) {
                    els.push(s('polyline', { points: zigzag(X(k), T, X(k + 1), T), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.5 }));
                    els.push(s('polyline', { points: zigzag(X(k + 1), T, X(k + 1), B), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.5 }));
                  }
                  els.push(s('line', { x1: plot.X(0.3), x2: X(0), y1: T, y2: T, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  els.push(s('line', { x1: plot.X(0.3), x2: X(p.n), y1: B, y2: B, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  for (const y of [T, B]) els.push(s('circle', { cx: plot.X(0.3), cy: y, r: 6, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  return els;
                },
                readout: (p) => { const [a, b] = ladder(p.n); return r`$R = ${b === 1 ? a : `\frac{${a}}{${b}}`}\,\Omega = ${(a / b).toFixed(5)}\,\Omega$`; },
              },
              after: r`The resistances are $2, \frac53, \frac{13}{8}, \frac{34}{21}, \frac{89}{55}, \frac{233}{144}$: ratios of Fibonacci numbers again. Each new section puts one resistor in series ($+1$) with one in parallel, and two resistors $1$ and $R$ in parallel give $\frac{1}{1 + 1/R}$. So the ladder computes a continued fraction: $R = 1 + \cfrac{1}{1 + \cfrac{1}{1 + \cdots}}$.`,
            },
            {
              type: 'numeric',
              title: 'An endless ladder',
              prompt: r`If the ladder went on forever, adding one more section at the front wouldn't change it, so $R = 1 + \dfrac{R}{1 + R}$. What is $R$, in ohms? (3 decimal places.)`,
              unit: 'Ω',
              answer: (1 + Math.sqrt(5)) / 2,
              tol: 0.002,
              wrong: [{ v: 2, why: 'That’s a single section. More sections lower the resistance a little.' }, { v: 0.618, tol: 0.002, why: 'That’s 1/φ. The total must be more than the 1 Ω resistor at the front, which is in series with everything else.' }],
              hint: r`Multiply both sides by $1 + R$: $R + R^2 = 1 + 2R$.`,
              explain: r`$R^2 - R - 1 = 0$, so $R = \frac{1 + \sqrt5}{2} = \varphi \approx 1.618\,\Omega$. An infinite ladder of identical resistors has the golden ratio as its resistance. Ladder networks like this model transmission lines and the nerve fibres in your body.`,
            },
            {
              type: 'explain',
              title: 'Eclipse seasons',
              body: r`A solar eclipse needs a new Moon (which returns every **synodic month**, 29.530589 days) while the Moon is crossing the plane of Earth's orbit (which it does every **draconic month**, 27.212221 days). Eclipses repeat when a whole number of each fit almost exactly into the same time, so we need fractions close to
$$\frac{29.530589}{27.212221} = 1.0851958\ldots = [1; 11, 1, 2, 1, 4, \dots].$$
Its convergents are $1, \frac{12}{11}, \frac{13}{12}, \frac{38}{35}, \frac{51}{47}, \dots$: $12$ draconic months are close to $11$ synodic months, and so on.`,
            },
            {
              type: 'numeric',
              title: 'Eighteen years',
              prompt: r`Babylonian astronomers noticed that eclipses repeat after 223 synodic months. How many years is that? (Use 29.530589 days per month and 365.25 days per year.)`,
              unit: 'years',
              answer: (223 * 29.530589) / 365.25,
              tol: 0.02,
              wrong: [{ v: 223 / 12, tol: 0.05, why: 'A year is a little more than 12 synodic months (about 12.37).' }],
              explain: r`$223 \times 29.530589 = 6585.32$ days, about 18 years and 11 days. This is the **saros** cycle. Because of the leftover third of a day, each repeat happens about 8 hours later, so it is seen about a third of the way around the world further west.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Find the saros',
              prompt: r`The term after $\ldots, 2, 1$ in $[1; 11, 1, 2, 1, 4, \dots]$ is 4. Using the convergents $\frac{38}{35}$ and $\frac{51}{47}$, what is the numerator of the next convergent (the number of draconic months)?`,
              answer: 242,
              wrong: [{ v: 89, why: r`That uses a term of 1. The term is 4: $4 \times 51 + 38$.` }, { v: 223, why: 'That’s the denominator (synodic months). The numerator counts draconic months.' }, { v: 204, why: r`Don't forget to add the numerator before: $4 \times 51 + 38$.` }],
              hint: r`New numerator $= 4 \times 51 + 38$; new denominator $= 4 \times 47 + 35$.`,
              explain: r`$4 \times 51 + 38 = 242$ and $4 \times 47 + 35 = 223$: 242 draconic months ($6585.36$ days) match 223 synodic months ($6585.32$ days) to within an hour. That convergent is the saros. The large term 4 is why it works so well, just as the 292 in $\pi$'s expansion makes $\frac{355}{113}$ so good.`,
            },
          ],
          recap: [
            'Gear trains need whole-number tooth ratios: convergents give the best ones (Huygens’s 206/7).',
            'A ladder of resistors computes a continued fraction; the infinite ladder gives φ ohms.',
            'Eclipses repeat when whole numbers of two kinds of month line up: convergents again.',
            'The saros, 223 synodic = 242 draconic months ≈ 18 years 11 days, is a convergent.',
          ],
        },
      ],
    },
  ],
};
