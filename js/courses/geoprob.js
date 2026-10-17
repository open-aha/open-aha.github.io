import { fix } from '../lib/svg.js';

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

const DARTS = (() => { const u = rng(1); return Array.from({ length: 5000 }, () => [u(), u()]); })();
const NEEDLES = (() => {
  const u = rng(6);
  // y and angle are random; x is spread evenly (it doesn't affect crossings)
  return Array.from({ length: 1000 }, (_, i) => ({ y: u() * 4, th: u() * Math.PI, x: 0.6 + ((i * 0.6180339887) % 1) * 4.8 }));
})();
const crosses = ({ y, th }) => Math.floor(y - 0.5 * Math.sin(th)) !== Math.floor(y + 0.5 * Math.sin(th));

// meeting problem: chance two arrivals in an hour are within w minutes
const meetP = (w) => 1 - (1 - w / 60) ** 2;
// buses with alternating gaps g and 20 − g: average wait for a random arrival
const avgWait = (g) => (g * g + (20 - g) ** 2) / 40;

export default {
  id: 'geoprob',
  subject: 'math',
  title: 'Geometric Probability',
  level: 'Intermediate',
  cover: 'geoprob',
  tagline: 'Estimate π with darts and needles, break sticks, meet friends at random, and see why the bus is always late.',
  description: r`When chance meets geometry, probabilities become areas and lengths. Estimate π by throwing random darts, repeat Buffon's 18th-century needle experiment, find the chance that a randomly broken stick forms a triangle, discover why "choose a random chord" has three different answers, and turn waiting and meeting times into areas.`,
  prereq: 'Probability',
  chapters: [
    {
      title: 'Finding π by Chance',
      summary: 'Darts and needles.',
      lessons: [
        {
          id: 'montecarlo',
          title: 'Darts and π',
          summary: 'The Monte Carlo method',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Probability as area',
              body: r`Throw darts at random into a $1 \times 1$ square. The chance that a dart lands in some region equals that region's **area** (since the whole square has area 1).

Draw a quarter circle of radius 1 inside the square. Its area is $\frac{\pi}{4}$. So the fraction of darts that land inside should be close to $\frac{\pi}{4}$, and
$$\pi \approx 4 \times \frac{\text{darts inside}}{\text{darts thrown}}$$`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Throw darts',
              body: r`Increase the number of darts and watch the estimate.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: false, axes: false, equal: true, maxWidth: 360,
                params: { n: { min: 10, max: 5000, step: 10, value: 100, label: 'darts', color: 'coral', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  let din = '', dout = '';
                  for (let i = 0; i < p.n; i++) {
                    const [x, y] = DARTS[i], seg = `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`;
                    if (x * x + y * y < 1) din += seg;
                    else dout += seg;
                  }
                  const R = plot.X(1) - plot.X(0), w = p.n > 1500 ? 4.5 : p.n > 400 ? 7 : 11;
                  return [
                    s('rect', { x: plot.X(0), y: plot.Y(1), width: R, height: R, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }),
                    s('path', { d: `M${plot.X(1)} ${plot.Y(0)} A${R} ${R} 0 0 0 ${plot.X(0)} ${plot.Y(1)}`, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('path', { d: din, stroke: 'var(--blue)', 'stroke-width': w, 'stroke-linecap': 'round' }),
                    s('path', { d: dout, stroke: 'var(--coral)', 'stroke-width': w, 'stroke-linecap': 'round' }),
                  ];
                },
                readout: (p) => {
                  let k = 0;
                  for (let i = 0; i < p.n; i++) if (DARTS[i][0] ** 2 + DARTS[i][1] ** 2 < 1) k++;
                  return r`inside: $${k}$ of $${p.n}$ $\;\Rightarrow\;$ $\pi \approx 4 \times \frac{${k}}{${p.n}} = \mathbf{${((4 * k) / p.n).toFixed(3)}}$`;
                },
              },
              after: r`The estimate wanders at first, then settles near 3.14. This is the **Monte Carlo method**, named in the 1940s after the Monaco casino (the code name came from their colleague Nicholas Metropolis). Stanislaw Ulam and John von Neumann used random sampling to simulate neutrons in nuclear weapons research; today it's used for everything from weather forecasts to film lighting.`,
            },
            {
              type: 'numeric',
              title: 'Your estimate',
              prompt: r`You throw 1000 darts and 787 land inside the quarter circle. What's your estimate of $\pi$?`,
              answer: (4 * 787) / 1000,
              tol: 0.001,
              wrong: [{ v: 0.787, tol: 0.001, why: r`That's $\frac{\pi}{4}$. Multiply by 4.` }],
              explain: r`$4 \times 0.787 = 3.148$. Close, but not exact: random estimates always carry some error.`,
            },
            {
              type: 'numeric',
              title: 'The price of accuracy',
              prompt: r`The typical error of a Monte Carlo estimate shrinks like $\frac{1}{\sqrt n}$, where $n$ is the number of samples. To make the error 10 times smaller, how many times more darts do you need?`,
              unit: '×',
              answer: 100,
              wrong: [{ v: 10, why: r`The error goes as $\frac{1}{\sqrt n}$. To divide it by 10, $\sqrt n$ must grow 10 times, so $n$ must grow $10^2$ times.` }],
              explain: r`$\sqrt{n}$ must grow 10-fold, so $n$ must grow 100-fold. Each extra correct digit of $\pi$ costs 100 times more darts, so Monte Carlo is a terrible way to compute $\pi$, but a wonderful way to estimate things that have no formula at all.`,
            },
            {
              type: 'numeric',
              title: 'Any shape at all',
              prompt: r`A lake is drawn on a map inside a 2 km × 2 km square. A computer scatters 1,000 random points over the square, and 300 land in the lake. Estimate the lake's area.`,
              unit: 'km²',
              answer: 1.2,
              tol: 0.001,
              wrong: [{ v: 0.3, tol: 0.001, why: 'That’s the fraction of the square. Multiply by the square’s area, 4 km².' }],
              explain: r`$\frac{300}{1000} \times 4 = 1.2$ km². No formula for the lake's shape is needed, which is the real power of Monte Carlo: it works for shapes, volumes and high-dimensional problems where formulas don't exist.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A biased throw',
              prompt: r`A real person throwing darts at the square tends to aim for the middle, so more darts land near the centre. What happens to the estimate of $\pi$?`,
              choices: [
                { t: 'It comes out too high, since too many darts land inside the quarter circle', ok: true },
                { t: 'It’s still correct on average', why: 'Probability equals area only if every point is equally likely.' },
                { t: 'It comes out too low', why: 'The centre of the square is inside the quarter circle, so bunching there inflates the inside fraction.' },
              ],
              explain: r`The key assumption is that points are **uniformly** spread. The square's centre $(0.5, 0.5)$ is inside the quarter circle, so aiming there sends too many darts inside, and $\pi$ comes out too big. Computers use carefully designed random number generators to make samples uniform.`,
            },
          ],
          recap: [
            'For a uniformly random point, probability = area.',
            r`Darts in a quarter circle: $\pi \approx 4 \times$ fraction inside.`,
            r`Monte Carlo error shrinks like $1/\sqrt n$.`,
          ],
        },
        {
          id: 'buffon',
          title: 'Buffon’s Needle',
          summary: 'π from falling needles',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'An 18th-century puzzle',
              body: r`The Comte de Buffon asked: drop a needle onto a floor of parallel lines, spaced the same distance apart as the needle's length. What's the chance it crosses a line? His surprising answer (published 1777):
$$P(\text{cross}) = \frac{2}{\pi} \approx 0.637$$
So $\pi$ can be estimated by dropping needles: $\pi \approx \dfrac{2 \times \text{needles dropped}}{\text{needles crossing}}$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Drop needles',
              body: r`Crossing needles are coral. Drop more and watch the estimate.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: -0.2, ymax: 4.2, grid: false, axes: false, equal: true, maxWidth: 520,
                params: { n: { min: 10, max: 1000, step: 10, value: 50, label: 'needles', color: 'violet', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let k = 0; k <= 4; k++) els.push(s('line', { x1: plot.X(0), x2: plot.X(6), y1: plot.Y(k), y2: plot.Y(k), stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  let dc = '', dn = '';
                  for (let i = 0; i < p.n; i++) {
                    const nd = NEEDLES[i], dx = 0.5 * Math.cos(nd.th), dy = 0.5 * Math.sin(nd.th);
                    const seg = `M${plot.X(nd.x - dx).toFixed(1)} ${plot.Y(nd.y - dy).toFixed(1)}L${plot.X(nd.x + dx).toFixed(1)} ${plot.Y(nd.y + dy).toFixed(1)}`;
                    if (crosses(nd)) dc += seg;
                    else dn += seg;
                  }
                  const w = p.n > 400 ? 1.2 : 2;
                  els.push(s('path', { d: dn, stroke: 'var(--blue)', 'stroke-width': w, opacity: 0.8 }), s('path', { d: dc, stroke: 'var(--coral)', 'stroke-width': w }));
                  return els;
                },
                readout: (p) => {
                  let c = 0;
                  for (let i = 0; i < p.n; i++) if (crosses(NEEDLES[i])) c++;
                  return r`crossing: $${c}$ of $${p.n}$ $\;\Rightarrow\;$ $\pi \approx \frac{2 \times ${p.n}}{${c}} = \mathbf{${((2 * p.n) / c).toFixed(3)}}$`;
                },
              },
              after: r`Why $\pi$? A needle crosses a line depending on its angle $\theta$: it spans a vertical height of $\sin\theta$ (times its length). Averaging $\sin\theta$ over all angles from 0 to $\pi$ gives $\frac{2}{\pi}$. The circle sneaks in through the angle.`,
            },
            {
              type: 'numeric',
              title: 'A shorter needle',
              prompt: r`For a needle of length $\ell$ on lines spaced $t$ apart (with $\ell \le t$), the crossing probability is $\frac{2\ell}{\pi t}$. If the needle is half as long as the spacing, what's the probability? (3 decimal places.)`,
              answer: 1 / Math.PI,
              tol: 0.0006,
              wrong: [{ v: 2 / Math.PI, tol: 0.001, why: r`That's for $\ell = t$. With $\ell = t/2$, it's $\frac{2 \times \frac12}{\pi}$.` }, { v: 0.5, why: r`Use the formula: $\frac{2\ell}{\pi t} = \frac{1}{\pi}$.` }],
              explain: r`$\frac{2 \times \frac{1}{2}}{\pi} = \frac{1}{\pi} \approx 0.318$. Shorter needles cross less often, in exact proportion to their length.`,
            },
            {
              type: 'numeric',
              title: 'An experiment',
              prompt: r`You drop 1,000 needles (length equal to the spacing) and 640 cross a line. What's your estimate of $\pi$? (3 decimal places.)`,
              answer: 2000 / 640,
              tol: 0.001,
              wrong: [{ v: 0.64, tol: 0.001, why: r`That's the crossing fraction, an estimate of $\frac{2}{\pi}$. Invert and double.` }],
              explain: r`$\pi \approx \frac{2 \times 1000}{640} = 3.125$.`,
            },
            {
              type: 'mcq',
              title: 'Too good to be true',
              prompt: r`In 1901, Mario Lazzarini reported dropping 3,408 needles and getting $\pi \approx \frac{355}{113} = 3.1415929$, correct to 6 decimal places. Why are statisticians suspicious?`,
              choices: [
                { t: 'With 3,408 needles, the typical error is around 0.05; such precision is wildly improbable unless he chose when to stop', ok: true },
                { t: 'Needles can’t estimate π at all', why: 'They can, just slowly: the error shrinks only like 1/√n.' },
                { t: 'His needles must have been perfectly made', why: 'Perfect needles don’t remove random error.' },
              ],
              explain: r`$\frac{355}{113}$ is a famous approximation of $\pi$. Lazzarini's needle length ratio (5/6) and number of drops make that exact fraction reachable with 1,808 crossings, which suggests he stopped once he hit it. A lesson in how a known answer can bias an experiment.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Buffon’s noodle',
              prompt: r`Amazingly, the **average number** of crossings for any bent needle (a "noodle") of length $\ell$ is $\frac{2\ell}{\pi t}$, whatever its shape. A circular hoop of diameter $t$ always crosses the lines exactly twice. Check: what does the formula give for the hoop?`,
              answer: 2,
              wrong: [{ v: 2 / Math.PI, tol: 0.001, why: r`The hoop's length is its circumference, $\pi t$.` }, { v: 1, why: r`$\ell = \pi t$, so $\frac{2\pi t}{\pi t} = 2$.` }],
              explain: r`$\ell = \pi t$, so $\frac{2\pi t}{\pi t} = 2$ ✓. This gives a slick proof of Buffon's result: average crossings are proportional to length (cut the noodle into tiny pieces), and the hoop fixes the constant at $\frac{2}{\pi t}$.`,
            },
          ],
          recap: [
            r`Buffon's needle (length = spacing) crosses a line with probability $2/\pi$.`,
            r`Dropping needles gives an estimate of $\pi$.`,
            r`The $\pi$ comes from averaging over all needle angles.`,
            'Any curve of length ℓ averages 2ℓ/(πt) crossings: Buffon’s noodle.',
          ],
        },
      ],
    },
    {
      title: 'Surprises',
      summary: 'Sticks and chords.',
      lessons: [
        {
          id: 'stick',
          title: 'The Broken Stick',
          summary: 'Will the pieces make a triangle?',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Two random breaks',
              body: r`Break a stick of length 1 at two random points. You get three pieces. What's the chance they can form a triangle?

Three lengths form a triangle exactly when **each one is less than the sum of the other two**. Since the three add to 1, that means every piece must be shorter than $\frac12$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The space of breaks',
              body: r`Each point in the square is a pair of break positions $(a, b)$. Drag the point. The shaded region contains all the pairs that give a triangle.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: 0.25, equal: true, maxWidth: 380, axes: { xlabel: 'a', ylabel: 'b' },
                params: { a: { min: 0, max: 1, step: 0.01, value: 0.2, slider: false }, b: { min: 0, max: 1, step: 0.01, value: 0.7, slider: false } },
                points: [{ x: (p) => p.a, y: (p) => p.b, drag: { x: 'a', y: 'b' }, color: 'coral' }],
                extra: ({ plot, s }) => {
                  const tri = (pts) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join(' ') + ' Z', class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 });
                  return [tri([[0, 0.5], [0.5, 0.5], [0.5, 1]]), tri([[0.5, 0], [0.5, 0.5], [1, 0.5]])];
                },
                readout: (p) => {
                  const u = Math.min(p.a, p.b), v = Math.max(p.a, p.b), L = [u, v - u, 1 - v];
                  const ok = L.every((x) => x < 0.5);
                  return `pieces: ${L.map((x) => x.toFixed(2)).join(', ')} → ${ok ? '**triangle ✓**' : `**no triangle** (a piece is ½ or longer)`}`;
                },
              },
              after: r`The shaded region is two triangles, each with area $\frac18$. Together they cover $\frac14$ of the square.`,
            },
            {
              type: 'numeric',
              title: 'The answer',
              prompt: r`What is the probability that the three pieces form a triangle?`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'Check the picture: the shaded region covers only a quarter of the square.' }, { v: 1 / 3, tol: 0.001, why: 'The shaded area is 2 × 1/8 = 1/4.' }],
              explain: r`$\frac{1}{4}$. Most of the time, one piece is at least half the stick, too long to close a triangle. Turning a probability question into an area is the central trick of geometric probability.`,
            },
            {
              type: 'numeric',
              title: 'One long piece',
              prompt: r`What's the probability that one of the three pieces is **at least half** the stick?`,
              answer: 0.75,
              wrong: [{ v: 0.25, why: 'That’s the triangle probability. This is its complement.' }],
              explain: r`$1 - \frac14 = \frac34$. Two pieces can't both be half or more (they'd fill the whole stick), so "some piece is too long" is exactly the complement of forming a triangle.`,
            },
            {
              type: 'numeric',
              title: 'The shortest piece',
              prompt: r`A stick of length 1 is broken at two random points. The expected length of the **shortest** of the three pieces is $\frac19$. What is that as a decimal? (3 decimal places.)`,
              answer: 1 / 9,
              tol: 0.001,
              explain: r`$\frac19 \approx 0.111$. The expected lengths of the shortest, middle and longest pieces are $\frac{2}{18}, \frac{5}{18}, \frac{11}{18}$: random breaks are far from even.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A single break',
              prompt: r`Now break a stick at **one** uniformly random point. What's the probability that the longer piece is at least twice as long as the shorter one?`,
              answer: 2 / 3,
              tol: 0.002,
              wrong: [{ v: 0.5, why: r`The shorter piece must be at most $\frac13$: that happens when the break is in the first or last third.` }, { v: 1 / 3, tol: 0.002, why: 'That’s the chance the break lands in the middle third, where the pieces are closer in size.' }],
              explain: r`The longer piece is at least double the shorter exactly when the shorter is at most $\frac13$. That happens if the break lands in $[0, \frac13]$ or $[\frac23, 1]$: total length $\frac23$. One break means probability = length; two breaks meant probability = area.`,
            },
          ],
          recap: [
            'Three lengths summing to 1 form a triangle when each is less than ½.',
            'Representing the two breaks as a point in a square turns probability into area.',
            'The probability is 1/4.',
          ],
        },
        {
          id: 'bertrand',
          title: 'Bertrand’s Paradox',
          summary: 'What does "random" mean?',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A random chord',
              body: r`Draw an equilateral triangle inside a circle. Choose a chord of the circle "at random". What's the probability it's longer than the triangle's side? In 1889, Joseph Bertrand gave three reasonable methods:

1. **Random endpoints**: pick two random points on the circle. Probability: $\frac13$.
2. **Random radius**: pick a random radius, then a random point along it, and draw the chord perpendicular to the radius there. Probability: $\frac12$.
3. **Random midpoint**: pick a random point inside the circle as the chord's midpoint. Probability: $\frac14$.`,
            },
            {
              type: 'numeric',
              title: 'Check method 1',
              prompt: r`Fix one endpoint of the chord at a vertex of the triangle. The chord is longer than the triangle's side exactly when the other endpoint lands on the arc between the triangle's other two vertices. If the second endpoint is uniformly random on the circle, what's the probability?`,
              answer: 1 / 3,
              tol: 0.002,
              wrong: [{ v: 0.5, why: 'The triangle’s vertices split the circle into three equal arcs. Only one of them works.' }],
              explain: r`The three vertices divide the circle into three equal arcs, and only the far arc gives a long chord: probability $\frac13$.`,
            },
            {
              type: 'numeric',
              title: 'Check method 3',
              prompt: r`A chord is longer than the triangle's side exactly when its midpoint lies within half the radius of the centre. If the midpoint is uniform over the disc, what's the probability it lands within radius $\frac{R}{2}$?`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 0.5, why: r`Probability is **area**: the small disc has area $\pi (R/2)^2$, a quarter of $\pi R^2$.` }],
              explain: r`$\frac{\pi (R/2)^2}{\pi R^2} = \frac14$. Method 2 gives $\frac12$ because there the midpoint's distance from the centre is uniform: a **length** ratio, not an area ratio.`,
            },
            {
              type: 'mcq',
              title: 'Which is right?',
              prompt: r`So which answer, $\frac13$, $\frac12$ or $\frac14$, is correct?`,
              choices: [
                { t: 'Each is correct for its method: “a random chord” is ambiguous until you say how it’s chosen', ok: true },
                { t: '1/3, because endpoints are the most natural', why: 'Each method is natural in its own way. The paradox shows the question is incomplete.' },
                { t: 'None: the probability doesn’t exist', why: 'Each method gives a perfectly good probability. They just answer different questions.' },
              ],
              explain: r`"Random" isn't one thing. Every probability depends on a specified way of choosing: a **probability distribution**. Bertrand's paradox is a classic warning to define it carefully. (Interestingly, if you throw long straws onto a circle drawn on the floor, the physical answer comes out as $\frac12$, matching method 2.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Three ways to pick a chord',
              body: r`Here are 200 "random" chords made by each of Bertrand’s three methods. Count the fraction **longer** than the side of the inscribed equilateral triangle ($\sqrt3$ for radius 1).`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.1, xmax: 1.1, ymin: -1.1, ymax: 1.1, grid: false, axes: false, maxWidth: 380,
                params: { m: { min: 0, max: 2, step: 1, value: 0, label: 'method', color: 'violet', format: (v) => ['two random endpoints', 'random point on a radius', 'random midpoint in the disc'][v] } },
                extra: ({ plot, p, s }) => { let a = 214 + p.m * 1000; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; let long = '', short = ''; for (let i = 0; i < 200; i++) { let x1, y1, x2, y2; if (p.m === 0) { const t1 = 2 * Math.PI * u(), t2 = 2 * Math.PI * u(); [x1, y1, x2, y2] = [Math.cos(t1), Math.sin(t1), Math.cos(t2), Math.sin(t2)]; } else { let d, phi; if (p.m === 1) { d = u(); phi = 2 * Math.PI * u(); } else { let mx, my; do { mx = 2 * u() - 1; my = 2 * u() - 1; } while (mx * mx + my * my > 1); d = Math.hypot(mx, my); phi = Math.atan2(my, mx); } const h = Math.sqrt(1 - d * d), cx = d * Math.cos(phi), cy = d * Math.sin(phi); [x1, y1, x2, y2] = [cx - h * Math.sin(phi), cy + h * Math.cos(phi), cx + h * Math.sin(phi), cy - h * Math.cos(phi)]; } const seg = `M${plot.X(x1).toFixed(1)} ${plot.Y(y1).toFixed(1)}L${plot.X(x2).toFixed(1)} ${plot.Y(y2).toFixed(1)}`; if (Math.hypot(x2 - x1, y2 - y1) > Math.sqrt(3)) long += seg; else short += seg; } return [s('path', { d: short, stroke: 'var(--blue)', 'stroke-width': 0.8, opacity: 0.5 }), s('path', { d: long, stroke: 'var(--coral)', 'stroke-width': 1, opacity: 0.8 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 })]; },
                readout: (p) => { let a = 214 + p.m * 1000; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; let n = 0; for (let i = 0; i < 200; i++) { let L; if (p.m === 0) { const t1 = 2 * Math.PI * u(), t2 = 2 * Math.PI * u(); L = 2 * Math.abs(Math.sin((t1 - t2) / 2)); } else if (p.m === 1) { const d = u(); u(); L = 2 * Math.sqrt(1 - d * d); } else { let mx, my; do { mx = 2 * u() - 1; my = 2 * u() - 1; } while (mx * mx + my * my > 1); L = 2 * Math.sqrt(1 - mx * mx - my * my); } if (L > Math.sqrt(3)) n++; } return `longer than √3 (coral): **${n} of 200** = ${(n / 2).toFixed(0)}% · theory: ${['1/3', '1/2', '1/4'][p.m]}`; },
              },
              after: r`The three methods give about $\frac13$, $\frac12$ and $\frac14$: "a random chord" isn’t well defined until you say **how** it is chosen. Each method spreads probability differently over the disc, and you can see the different patterns of chords.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Longer than the radius',
              prompt: r`Change the question: what's the probability that a random chord is longer than the circle's **radius** $R$? Use the random-midpoint method. (A chord is longer than $R$ exactly when its midpoint is within $\frac{\sqrt3}{2}R$ of the centre.)`,
              answer: 0.75,
              wrong: [{ v: Math.sqrt(3) / 2, tol: 0.001, why: r`That's the random-radius answer, where the midpoint's distance is uniform. Here the midpoint is uniform over the disc, so compare **areas**.` }, { v: 2 / 3, tol: 0.001, why: 'That’s the answer for random endpoints. With a random midpoint, compare the areas of two circles.' }],
              explain: r`The midpoint must land in a circle of radius $\frac{\sqrt3}{2}R$: an area fraction of $\left(\frac{\sqrt3}{2}\right)^2 = \frac34$. The other methods disagree again: random endpoints give $\frac23$ and a random radius gives $\frac{\sqrt3}{2} \approx 0.87$. Bertrand's point holds for any question about "random chords".`,
            },
          ],
          recap: [
            'Bertrand’s random chord problem has answers 1/3, 1/2 and 1/4 depending on the method.',
            '“Random” needs a specified probability distribution.',
            'Geometric probabilities are ratios of lengths, areas or angles.',
          ],
        },
      ],
    },
    {
      title: 'Waiting and Meeting',
      summary: 'Probability in time.',
      lessons: [
        {
          id: 'meeting',
          title: 'The Meeting Problem',
          summary: 'Arrival times as a square',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Two friends, one hour',
              body: r`Two friends agree to meet at a café between 12:00 and 13:00. Each arrives at a uniformly random time in that hour, waits $w$ minutes, and leaves if the other hasn't come.

Plot one arrival time $x$ across and the other $y$ up: every possible pair is a point in a $60 \times 60$ square, all equally likely. They meet when $|x - y| \le w$: a diagonal **band** across the square.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Even odds',
              prompt: r`How long should each friend wait so that they have a **50%** chance of meeting? Adjust the waiting time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 60, grid: 10, equal: true, maxWidth: 380, axes: { xlabel: 'friend 1 arrives (min)', ylabel: 'friend 2' },
                params: { w: { min: 0, max: 40, step: 0.5, value: 10, label: 'wait', color: 'teal', format: (v) => `${fix(v, 1)} min` } },
                extra: ({ plot, p, s }) => {
                  const pts = [[0, 0], [p.w, 0], [60, 60 - p.w], [60, 60], [60 - p.w, 60], [0, p.w]];
                  return [
                    s('rect', { x: plot.X(0), y: plot.Y(60), width: plot.X(60) - plot.X(0), height: plot.Y(0) - plot.Y(60), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }),
                    s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join(' ') + ' Z', class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 }),
                  ];
                },
                readout: (p) => r`$P(\text{meet}) = 1 - \left(1 - \dfrac{${fix(p.w, 1)}}{60}\right)^2 = ${meetP(p.w).toFixed(3)}$`,
                goal: (p) => Math.abs(meetP(p.w) - 0.5) < 0.005,
                hint: 'The two unshaded corner triangles must together cover half the square.',
                solution: { w: 17.5 },
              },
              explain: r`The two corner triangles together form a square of side $60 - w$, so $P(\text{meet}) = 1 - \left(1 - \frac{w}{60}\right)^2$. Setting this to $\frac12$ gives $w = 60\left(1 - \frac{1}{\sqrt2}\right) \approx 17.6$ minutes: much less than half an hour.`,
            },
            {
              type: 'numeric',
              title: 'A quarter of an hour',
              prompt: r`If each friend waits 15 minutes, what's the probability they meet? (4 decimal places.)`,
              answer: meetP(15),
              tol: 0.0002,
              wrong: [{ v: 0.25, why: r`Area, not length: $1 - \left(\frac{45}{60}\right)^2$.` }, { v: 0.5625, tol: 0.0002, why: r`That's the chance they **miss**. Subtract from 1.` }],
              explain: r`$1 - \left(\frac34\right)^2 = 1 - \frac{9}{16} = \frac{7}{16} = 0.4375$.`,
            },
            {
              type: 'mcq',
              title: 'Unequal patience',
              prompt: r`Friend 1 waits 10 minutes but friend 2 waits 20. How does the meeting region change?`,
              choices: [
                { t: 'The band becomes lopsided: 10 minutes on one side of the diagonal, 20 on the other', ok: true },
                { t: 'It’s the same as both waiting 15 minutes', why: 'The two corner triangles have different sizes, so the area differs.' },
                { t: 'Only the longer wait matters', why: 'Each wait matters for the case where that friend arrives first.' },
              ],
              explain: r`If friend 1 arrives first, friend 2 must come within 10 minutes; if friend 2 is first, friend 1 has 20 minutes. Corner triangles of sides 50 and 40 are left out, so $P = 1 - \frac{50^2 + 40^2}{2 \times 60^2} \approx 0.431$, slightly less than both waiting 15 minutes.`,
            },
            {
              type: 'numeric',
              title: 'Ten minutes’ patience',
              prompt: r`Two friends arrive at random times within an hour, and each waits 10 minutes for the other. What is the probability they meet? (3 decimal places.)`,
              answer: 1 - Math.pow(5 / 6, 2),
              tol: 0.001,
              explain: r`In the unit square of arrival times, they miss each other in two corner triangles with total area $\left(\frac56\right)^2$. So they meet with probability $1 - \frac{25}{36} = \frac{11}{36} \approx 0.306$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Overlapping visits',
              prompt: r`Two people each visit a library for 30 minutes, arriving at random times between 12:00 and 13:00 (and staying past 13:00 if needed). What's the probability their visits overlap?`,
              answer: meetP(30),
              tol: 0.001,
              wrong: [{ v: 0.5, why: r`Two visits overlap when the arrivals are within 30 minutes: $1 - \left(\frac{30}{60}\right)^2$.` }],
              explain: r`Overlap means the arrivals differ by less than 30 minutes, exactly the meeting problem with $w = 30$: $1 - \left(\frac12\right)^2 = \frac34$.`,
            },
          ],
          recap: [
            'Two random times form a random point in a square.',
            r`Waiting $w$ minutes in an hour: $P(\text{meet}) = 1 - \left(1 - \frac{w}{60}\right)^2$.`,
            'Probability becomes the area of a region in the square.',
          ],
        },
        {
          id: 'waiting',
          title: 'The Waiting-Time Paradox',
          summary: 'Why the bus always seems late',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Buses every 10 minutes',
              body: r`Buses arrive at a stop on average every 10 minutes, and you turn up at a random time. If they run like clockwork, your average wait is 5 minutes.

But if the gaps are uneven, you're **more likely to arrive during a long gap**, simply because long gaps take up more of the timeline. The average wait for a random arrival is
$$\frac{\text{average of } (\text{gap}^2)}{2 \times \text{average gap}}$$
which is always at least half the average gap.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Bunched buses',
              prompt: r`Buses come in pairs: a gap of $g$ minutes, then $20 - g$ minutes, repeating (still one bus per 10 minutes on average). Find the gap that makes the average wait 6.25 minutes.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: -1, ymax: 2, grid: false, axes: false, height: 150,
                params: { g: { min: 1, max: 10, step: 0.5, value: 10, label: 'short gap $g$', color: 'violet', format: (v) => `${fix(v, 1)} min` } },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(0), x2: plot.X(60), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  let t = 0, k = 0;
                  while (t <= 60) {
                    const next = t + (k % 2 ? 20 - p.g : p.g);
                    if (k % 2 && next <= 60) els.push(s('rect', { x: plot.X(t), y: plot.Y(0.6), width: plot.X(next) - plot.X(t), height: plot.Y(0) - plot.Y(0.6), class: 'fl-coral-soft' }));
                    els.push(s('rect', { x: plot.X(t) - 7, y: plot.Y(0) - 22, width: 14, height: 16, rx: 3, class: 'fl-blue' }));
                    t = next; k++;
                  }
                  els.push(s('text', { x: plot.X(30), y: plot.Y(-0.7), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'time (minutes) → long gaps shaded' }));
                  return els;
                },
                readout: (p) => r`average wait $= \dfrac{${fix(p.g, 1)}^2 + ${fix(20 - p.g, 1)}^2}{2 \times 20} = ${avgWait(p.g).toFixed(2)}$ min`,
                goal: (p) => Math.abs(avgWait(p.g) - 6.25) < 0.01,
                hint: r`Solve $g^2 + (20 - g)^2 = 250$.`,
                solution: { g: 5 },
              },
              explain: r`$g = 5$: gaps of 5 and 15 minutes. You land in a 15-minute gap 75% of the time, waiting 7.5 minutes on average there, and only 2.5 minutes in the short gaps: $0.75 \times 7.5 + 0.25 \times 2.5 = 6.25$. Real buses bunch up like this because a late bus picks up extra passengers and falls further behind.`,
            },
            {
              type: 'numeric',
              title: 'Completely random buses',
              prompt: r`If buses arrive completely at random (a Poisson process) at an average rate of one per 10 minutes, the gaps have average 10 and the average of gap² is 200. What's the average wait?`,
              unit: 'min',
              answer: 10,
              wrong: [{ v: 5, why: r`That's for evenly spaced buses. Use $\frac{200}{2 \times 10}$.` }],
              explain: r`$\frac{200}{2 \times 10} = 10$ minutes: the full average gap. This is the famous **waiting-time paradox**: random arrivals are "memoryless", so it doesn't matter how long ago the last bus left.`,
            },
            {
              type: 'mcq',
              title: 'Busy gyms and full flights',
              prompt: r`A gym's average attendance is low, but whenever you go it seems packed. Which explanation fits the same paradox?`,
              choices: [
                { t: 'You’re more likely to be there at busy times, because that’s when most people (including you) go', ok: true },
                { t: 'The gym lies about its numbers', why: 'No lie is needed: sampling by visitor rather than by hour inflates what you see.' },
                { t: 'Pure bad luck', why: 'It’s systematic: busy times are, by definition, when most visitors are present.' },
              ],
              explain: r`This is the **inspection paradox**: when you sample something by experiencing it, larger or longer cases are over-represented. Most passengers are on full flights, most students are in big classes, and the bus gap you land in tends to be long.`,
            },
            {
              type: 'numeric',
              title: 'Badly bunched',
              prompt: r`On a busy route, buses have bunched badly: they come alternately 2 and 18 minutes apart (still 10 minutes on average). Arriving at a random time, your expected wait is $\frac{E[G^2]}{2E[G]}$ where $G$ is the gap. What is it, in minutes?`,
              unit: 'min',
              answer: 8.2,
              tol: 0.01,
              wrong: [{ v: 5, why: r`That's for evenly spaced buses. Here $E[G^2] = \frac{2^2 + 18^2}{2} = 164$.` }],
              explain: r`$E[G^2] = \frac{4 + 324}{2} = 164$ and $E[G] = 10$, so the wait is $\frac{164}{20} = 8.2$ minutes, much more than the 5 minutes for evenly spaced buses. You're 9 times as likely to arrive during the 18-minute gap as the 2-minute one, which is why bus companies work hard to stop buses bunching.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Class sizes',
              prompt: r`A school has two classes: one of 10 students and one of 90. The average class size is 50. If you ask every **student** how big their class is and average the answers, what do you get?`,
              answer: 82,
              wrong: [{ v: 50, why: 'That’s averaging over classes. Each student reports their own class, and 90 of them are in the big one.' }],
              explain: r`$\frac{10 \times 10 + 90 \times 90}{100} = \frac{100 + 8100}{100} = 82$. Universities can truthfully advertise a small "average class size" while most students sit in large lectures.`,
            },
          ],
          recap: [
            r`Average wait $= \frac{\text{avg}(\text{gap}^2)}{2 \times \text{avg gap}}$, at least half the average gap.`,
            'Uneven or random gaps make waits longer: you tend to land in long gaps.',
            'The inspection paradox: sampling by experience over-represents big cases.',
          ],
        },
        {
          id: 'acute',
          title: 'Random Triangles',
          summary: 'How often is a triangle acute?',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Three points on a circle',
              body: r`Pick three points at random on a circle and join them into a triangle. Is it more likely to be **acute** (all angles less than 90°) or **obtuse**?

A key fact from circle geometry: the triangle is acute exactly when it **contains the centre** of the circle. If the centre is outside, one angle is obtuse; if the centre lies on a side, that side is a diameter and the opposite angle is exactly 90°.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make a right angle',
              prompt: r`Move the three points around the circle. Arrange them so that the triangle has a **right angle** (within half a degree).`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 340, pad: 6,
                params: { a: { min: 0, max: 360, step: 0.5, value: 20, label: 'point A', color: 'coral', format: (v) => `${fix(v, 1)}°` }, b: { min: 0, max: 360, step: 0.5, value: 140, label: 'point B', color: 'blue', format: (v) => `${fix(v, 1)}°` }, c: { min: 0, max: 360, step: 0.5, value: 250, label: 'point C', color: 'teal', format: (v) => `${fix(v, 1)}°` } },
                extra: ({ plot, p, s }) => { const P = [p.a, p.b, p.c].map((d) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)]), ang = (i) => { const [A, B, C] = [P[i], P[(i + 1) % 3], P[(i + 2) % 3]], u = [B[0] - A[0], B[1] - A[1]], v = [C[0] - A[0], C[1] - A[1]]; return (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v) || 1)) * 180) / Math.PI; }, mx = Math.max(ang(0), ang(1), ang(2)); return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }), s('path', { d: P.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: mx > 90.5 ? 'fl-coral-soft' : mx < 89.5 ? 'fl-teal-soft' : 'fl-amber-soft', stroke: 'var(--ink-2)', 'stroke-width': 2 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 4, class: 'fl-ink' }), ...P.map(([x, y], i) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 7, class: ['fl-coral', 'fl-blue', 'fl-teal'][i] }))]; },
                readout: (p) => { const P = [p.a, p.b, p.c].map((d) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)]), ang = (i) => { const [A, B, C] = [P[i], P[(i + 1) % 3], P[(i + 2) % 3]], u = [B[0] - A[0], B[1] - A[1]], v = [C[0] - A[0], C[1] - A[1]]; return (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v) || 1)) * 180) / Math.PI; }, A = [ang(0), ang(1), ang(2)], mx = Math.max(...A); return `angles ${A.map((x) => x.toFixed(1) + '°').join(', ')} · **${mx > 90.5 ? 'obtuse' : mx < 89.5 ? 'acute' : 'right-angled'}**`; },
                goal: (p) => { const P = [p.a, p.b, p.c].map((d) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)]); let mx = 0; for (let i = 0; i < 3; i++) { const [A, B, C] = [P[i], P[(i + 1) % 3], P[(i + 2) % 3]], u = [B[0] - A[0], B[1] - A[1]], v = [C[0] - A[0], C[1] - A[1]]; const n = Math.hypot(...u) * Math.hypot(...v); if (n > 1e-6) mx = Math.max(mx, (Math.acos((u[0] * v[0] + u[1] * v[1]) / n) * 180) / Math.PI); } return Math.abs(mx - 90) < 0.5; },
                hint: 'Put two of the points exactly opposite each other, 180° apart.',
                solution: { a: 20, b: 200, c: 250 },
              },
              explain: r`Whenever two points are diametrically opposite, the angle at the third point is 90° (Thales’ theorem). Notice how much easier it is to make an obtuse triangle (coral) than an acute one (teal).`,
            },
            {
              type: 'mcq',
              title: 'The semicircle test',
              prompt: r`The triangle fails to contain the centre exactly when all three points lie in some **semicircle**. Why does that make obtuse triangles more common?`,
              choices: [
                { t: 'Three random points usually fit inside some half of the circle', ok: true },
                { t: 'Obtuse angles are bigger, so there is more room for them', why: 'The size of the angle isn’t the reason. It’s how often three points crowd into half the circle.' },
                { t: 'It doesn’t: acute and obtuse are equally likely', why: 'Try counting: the chance that all three lie in a semicircle is 3/4.' },
              ],
              explain: r`Fix the first point. Each point has a semicircle starting at it and going clockwise; all three lie in a semicircle exactly when they all fit in the semicircle starting at one of them. Each of these three events has probability $\left(\frac12\right)^2 = \frac14$ and they can’t happen together, so the total is $\frac34$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Count them',
              body: r`Let the computer pick random triangles inscribed in a circle and count how many are acute.`,
              widget: {
                kind: 'sampler', outcomes: ['acute', 'obtuse'], probs: [0.25, 0.75],
                trial: () => { const t = [Math.random(), Math.random(), Math.random()].sort((x, y) => x - y), gaps = [t[1] - t[0], t[2] - t[1], 1 - t[2] + t[0]]; return Math.max(...gaps) < 0.5 ? 0 : 1; },
                batches: [1, 10, 100, 1000], oneLabel: 'Pick', color: 'teal', ymax: 1,
              },
              after: r`The acute share settles near $\frac14$: three out of four random inscribed triangles are obtuse.`,
            },
            {
              type: 'numeric',
              title: 'The answer',
              prompt: r`Since all three points lie in a semicircle with probability $\frac34$, what is the probability that a random inscribed triangle is acute?`,
              answer: 0.25,
              tol: 0.001,
              explain: r`$1 - \frac34 = \frac14$. Right triangles have probability zero (the points would have to be exactly opposite), so the rest are obtuse.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Four points',
              prompt: r`The same argument works for any number of points: $n$ random points on a circle all lie in some semicircle with probability $\frac{n}{2^{n-1}}$. What is that probability for **four** points?`,
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: 0.25, why: r`$\frac{4}{2^3} = \frac48$.` }],
              explain: r`$\frac{4}{2^3} = \frac12$. Each of the 4 points can be the "first" of a clockwise semicircle containing the others, with probability $\left(\frac12\right)^3$ each. So a random quadrilateral contains the centre only half the time.`,
            },
          ],
          recap: [
            'An inscribed triangle is acute exactly when it contains the centre.',
            'Three random points lie in a semicircle with probability 3/4.',
            'So only 1 in 4 random inscribed triangles is acute.',
          ],
        },
      ],
    },
  ],
};
