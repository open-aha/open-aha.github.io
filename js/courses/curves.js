import { fix } from '../lib/svg.js';
const r = String.raw;
const G = 9.8, XEND = Math.PI, YEND = -2;

// cycloid (rolling-circle radius 1) through (0,0) and (π, −2): y as a function of x
const cyc = (x) => {
  let lo = 0, hi = Math.PI;
  for (let k = 0; k < 50; k++) {
    const m = (lo + hi) / 2;
    if (m - Math.sin(m) < x) lo = m;
    else hi = m;
  }
  const t = (lo + hi) / 2;
  return -(1 - Math.cos(t));
};
const line = (x) => (YEND * x) / XEND;
const blend = (s) => (x) => (1 - s) * line(x) + s * cyc(x);
const timeCache = new Map();
function descent(s) {
  if (timeCache.has(s)) return timeCache.get(s);
  const f = blend(s), n = 3000;
  let T = 0, px = 0, py = 0;
  for (let i = 1; i <= n; i++) {
    const u = i / n, x = XEND * u ** 3, y = f(x);
    const um = (i - 0.5) / n, ym = -f(XEND * um ** 3);
    if (ym > 0) T += Math.hypot(x - px, y - py) / Math.sqrt(2 * G * ym);
    px = x;
    py = y;
  }
  timeCache.set(s, T);
  return T;
}

// Reuleaux triangle of width 1, rotated by th: boundary points, shifted so its lowest point is at y = 0
function reuleaux(th) {
  const V = [0, 1, 2].map((k) => { const a = th + Math.PI / 2 + (2 * Math.PI * k) / 3; return [Math.cos(a) / Math.sqrt(3), Math.sin(a) / Math.sqrt(3)]; });
  const pts = [];
  for (let k = 0; k < 3; k++) {
    const c = V[k], a0 = Math.atan2(V[(k + 1) % 3][1] - c[1], V[(k + 1) % 3][0] - c[0]);
    for (let i = 0; i <= 40; i++) { const a = a0 + (Math.PI / 3) * (i / 40); pts.push([c[0] + Math.cos(a), c[1] + Math.sin(a)]); }
  }
  const lo = Math.min(...pts.map((q) => q[1])), hi = Math.max(...pts.map((q) => q[1]));
  return { pts: pts.map(([x, y]) => [x, y - lo]), width: hi - lo, centre: -lo };
}
const ngonArea = (n, P) => (P * P) / (4 * n * Math.tan(Math.PI / n));

export default {
  id: 'curves',
  subject: 'math',
  title: 'Famous Curves',
  level: 'Advanced',
  cover: 'curves',
  tagline: 'The fastest slide, the rolling wheel, the hanging chain, soap films, and shapes of constant width.',
  description: r`Which slide gets a ball to the bottom fastest? What shape does a hanging chain make? Why do soap bubbles meet at 120°? Meet the cycloid, the catenary, minimal surfaces and shapes of constant width, and find out why the circle encloses the most area: curves that nature and mathematicians found by asking what is "best".`,
  prereq: 'Calculus: Integrals',
  chapters: [
    {
      title: 'The Fastest Path',
      summary: 'Brachistochrone and cycloid.',
      lessons: [
        {
          id: 'brachistochrone',
          title: 'The Brachistochrone',
          summary: 'Shortest isn’t fastest',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A challenge from 1696',
              body: r`Johann Bernoulli challenged the mathematicians of Europe: a bead slides without friction from point $A$ down to a lower point $B$ (not directly below it). **What shape of wire gets it there in the least time?** This curve is the **brachistochrone** (Greek for "shortest time").

The straight line is the **shortest** path. But is it the **fastest**?`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Race the bead',
              prompt: r`The slider morphs the wire from a straight line (0) through other curves. Find the shape that gives the **shortest** descent time.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 3.5, ymin: -2.9, ymax: 0.4, grid: 1, axes: false, maxWidth: 560,
                params: { s: { min: 0, max: 2, step: 0.1, value: 0, label: 'shape', color: 'violet', format: (v) => v.toFixed(1) } },
                curves: [
                  { f: (x) => (x >= 0 && x <= XEND ? line(x) : NaN), color: 'ink', dash: true },
                  { f: (x, p) => (x >= 0 && x <= XEND ? blend(p.s)(x) : NaN), color: 'violet', width: 4 },
                ],
                extra: ({ plot, s }) => [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 8, class: 'fl-coral' }), s('circle', { cx: plot.X(XEND), cy: plot.Y(YEND), r: 8, class: 'fl-teal' }), s('text', { x: plot.X(0) - 12, y: plot.Y(0) + 6, 'text-anchor': 'end', style: 'font-weight:700', text: 'A' }), s('text', { x: plot.X(XEND) + 14, y: plot.Y(YEND) + 6, style: 'font-weight:700', text: 'B' })],
                readout: (p) => r`descent time: **${descent(p.s).toFixed(4)} s** $\;$ (straight line: ${descent(0).toFixed(4)} s)`,
                goal: (p) => Math.abs(p.s - 1) < 1e-9,
                hint: 'Go steep early to build up speed, but not so steep that the path gets much longer.',
                solution: { s: 1 },
              },
              explain: r`The fastest shape is at **1.0**: a **cycloid**, taking about 1.0035 s versus 1.19 s for the straight line. Dropping steeply at first builds up speed early, which more than pays for the longer path. Bend it even more and the extra length starts to cost too much. Newton, Leibniz and the Bernoulli brothers all solved the problem, launching the **calculus of variations**: finding the best **function**, not just the best number.`,
            },
            {
              type: 'mcq',
              title: 'Downhill, then uphill?',
              prompt: r`Suppose $B$ is far to the side of $A$ but only a little lower. Could the fastest wire dip **below** $B$ and then climb back up to it?`,
              choices: [
                { t: 'Yes: diving deep builds so much speed that it pays to climb back up at the end', ok: true },
                { t: 'No: going below B can never help', why: 'Speed depends on how far you’ve dropped. A deep dive makes the long horizontal journey much faster.' },
                { t: 'No: the bead would stop before reaching B', why: 'Without friction, the bead has enough energy to climb back to any point lower than A.' },
              ],
              explain: r`When $B$ is far away horizontally, the cycloid arch through $A$ and $B$ dips below $B$ and rises back up to it. Speed comes from height lost, and a deep plunge makes the long middle stretch fast enough to repay the climb. Intuition about "shortest" is a poor guide to "fastest".`,
            },
            {
              type: 'numeric',
              title: 'Down a cycloid',
              prompt: r`A bead slides without friction from the top of a cycloid generated by a circle of radius $R$. It reaches the bottom in time $\pi\sqrt{R/g}$, wherever it starts. For $R = 1$ m, how long does it take? (2 decimal places.)`,
              unit: 's',
              answer: Math.PI * Math.sqrt(1 / 9.81),
              tol: 0.01,
              explain: r`$\pi\sqrt{\frac{1}{9.81}} \approx 1.00$ s, the same from any starting point: the cycloid is also a **tautochrone**. Huygens used this to design pendulum clocks whose period didn’t depend on the swing.`,
            },
            {
              type: 'numeric',
              title: 'Speed at the bottom',
              prompt: r`A bead slides without friction down any curve that drops 10 m. Whatever the shape, energy conservation fixes its speed at the bottom: $v = \sqrt{2gh}$. What is it, in m/s? (1 decimal place.)`,
              unit: 'm/s',
              answer: Math.sqrt(2 * 9.8 * 10),
              tol: 0.1,
              explain: r`$\sqrt{196} = 14$ m/s, for every path. The brachistochrone doesn’t win by arriving faster; it wins by getting fast **early**, dropping steeply at the start.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Light does it too',
              prompt: r`Johann Bernoulli's own solution compared the bead to a ray of light passing through layers of glass whose speed increases downward. Why does that analogy work?`,
              choices: [
                { t: 'Light follows the path of least time (Fermat’s principle), bending as its speed changes, just as the bead’s speed grows as it falls', ok: true },
                { t: 'Light and beads both fall under gravity at the same rate', why: 'The analogy isn’t about gravity acting on light. It’s about choosing the quickest path when speed varies with depth.' },
                { t: 'Because light travels in straight lines', why: 'In layers of changing speed, light bends. That bending is the key.' },
              ],
              explain: r`By **Fermat's principle**, light takes the quickest path, refracting by Snell's law at every layer. With a speed that grows like $\sqrt{2gy}$ (exactly the bead's speed after falling height $y$), the quickest light path turns out to be a cycloid. A neat bridge between optics and mechanics!`,
            },
          ],
          recap: [
            'The brachistochrone is the curve of fastest frictionless descent.',
            'It is a cycloid, not a straight line.',
            'Its discovery launched the calculus of variations.',
          ],
        },
        {
          id: 'cycloid',
          title: 'The Rolling Wheel',
          summary: 'The cycloid and the tautochrone',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A point on a rolling circle',
              body: r`A **cycloid** is the path traced by a point on the rim of a wheel rolling along a straight line. Roll the wheel.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 13, ymin: -0.3, ymax: 2.6, grid: false, axes: false, maxWidth: 620,
                params: { t: { min: 0, max: 12.56, step: 0.04, value: 2, label: 'roll', color: 'blue', format: (v) => `${Math.round((v * 180) / Math.PI)}°` } },
                curves: [{ param: { x: (u) => u - Math.sin(u), y: (u) => 1 - Math.cos(u), t0: 0, t1: (p) => p.t }, color: 'coral', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const cx = p.t, px = p.t - Math.sin(p.t), py = 1 - Math.cos(p.t);
                  return [
                    s('line', { x1: plot.X(-0.5), x2: plot.X(13), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(cx), cy: plot.Y(1), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(cx), y1: plot.Y(1), x2: plot.X(px), y2: plot.Y(py), stroke: 'var(--blue)', 'stroke-width': 2 }),
                    s('circle', { cx: plot.X(px), cy: plot.Y(py), r: 7, class: 'fl-coral' }),
                  ];
                },
                readout: () => r`$x = r(\theta - \sin\theta)$, $\;y = r(1 - \cos\theta)$`,
              },
              after: r`Each arch is traced during one full turn of the wheel. Turn it upside down and you get the brachistochrone.`,
            },
            {
              type: 'numeric',
              title: 'Length of an arch',
              prompt: r`In 1658, Christopher Wren showed that one arch of a cycloid is exactly 4 times the wheel's **diameter** long. For a wheel of radius 1 m, how long is one arch?`,
              unit: 'm',
              answer: 8,
              wrong: [{ v: 4, why: 'Four times the diameter, and the diameter is 2 m.' }, { v: 6.28, tol: 0.01, why: r`That's the wheel's circumference, $2\pi r$. The arch is longer: $4 \times 2r$.` }],
              explain: r`$4 \times 2 = 8$ m, slightly more than the circumference ($2\pi \approx 6.28$ m) that rolls along the ground. A surprising whole-number answer, with no $\pi$ in sight.`,
            },
            {
              type: 'numeric',
              title: 'Area under the arch',
              prompt: r`Galileo tried to find the area under one arch of a cycloid by cutting the shape out of metal and weighing it. Gilles de Roberval proved in 1634 that it is an exact multiple of the rolling circle's area. How many times the circle's area is it?`,
              answer: 3,
              wrong: [{ v: Math.PI, tol: 0.01, why: 'It’s an exact whole number of circles: the π is already in the circle’s area.' }, { v: 2, why: 'A little more: the arch is 2r high and 2πr wide, enclosing 3πr².' }, { v: 4, why: 'The arch is 4 diameters long, but its area is 3 circles.' }],
              explain: r`The area is $3\pi r^2$, exactly three times the wheel. (Galileo's weighing reportedly gave a bit less than 3, and he suspected the answer might not be a simple ratio.)`,
            },
            {
              type: 'numeric',
              title: 'The coin rotation paradox',
              prompt: r`Roll one coin all the way around the edge of an identical coin, without slipping, until it returns to its starting place. How many complete turns does the rolling coin make?`,
              answer: 2,
              wrong: [{ v: 1, why: 'The distance rolled equals one circumference, but going around the other coin adds an extra turn. Try it with two real coins!' }],
              explain: r`Two turns, though it rolls along only one circumference of edge. Going once around the other coin adds a full turn of its own, as the Moon does going round the Earth. The path traced by a point on the rolling coin is a heart-shaped **cardioid**, a cousin of the cycloid.`,
            },
            {
              type: 'numeric',
              title: 'The top of the wheel',
              prompt: r`A wheel rolls without slipping at speed $v$. The point touching the ground is momentarily at rest. How many times $v$ is the speed of the point at the top of the wheel?`,
              answer: 2,
              explain: r`The top moves at $2v$: the wheel’s forward motion plus its spin add up there, and cancel at the bottom. That’s why the top of a moving bicycle wheel looks blurred while the bottom spokes look sharp.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The tautochrone',
              prompt: r`Release beads at different heights on the same upside-down cycloid wire. Which reaches the bottom first?`,
              choices: [
                { t: 'They all arrive at exactly the same time', ok: true },
                { t: 'The one released highest', why: 'It moves faster, but it also has farther to go, and on a cycloid the two effects cancel exactly.' },
                { t: 'The one released lowest', why: 'It has less distance, but it also moves more slowly. On a cycloid, these balance perfectly.' },
              ],
              explain: r`The cycloid is also the **tautochrone** ("same time" curve): from anywhere on it, the descent time to the bottom is identical, $\pi\sqrt{r/g}$. Christiaan Huygens discovered this in 1659 and used it to design pendulum clocks whose period doesn't depend on the swing's size.`,
            },
            { /*anim:curves*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Four beads, one finish',
              body: r`Four beads slide without friction on an upside-down cycloid, the curve traced by a rolling wheel of radius 1 m. They are released together from different heights.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.4, xmax: 3.4, ymin: -0.35, ymax: 2.3, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 0.8, max: 2 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  // bowl: x = φ + sin φ, y = 1 - cos φ, with arc length s = 4 sin(φ/2) from the bottom; on it, s(t) = s0 cos(ωt)
                  const pt = (ph) => [ph + Math.sin(ph), 1 - Math.cos(ph)], els = [], curve = [];
                  for (let i = 0; i <= 120; i++) { const [x, y] = pt(-Math.PI + (2 * Math.PI * i) / 120); curve.push(`${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`); }
                  els.push(s('path', { d: curve.join(''), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
                  [[-2.9, 'blue'], [-2.1, 'coral'], [-1.3, 'teal'], [-0.55, 'violet']].forEach(([ph0, col], idx) => {
                    const s0 = 4 * Math.sin(ph0 / 2), ph = 2 * Math.asin((s0 * Math.cos(p.t)) / 4), [x0, y0] = pt(ph0), [x, y] = pt(ph);
                    els.push(s('circle', { cx: plot.X(x0), cy: plot.Y(y0), r: 7, fill: 'none', stroke: `var(--${col})`, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
                    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 11 - 2 * idx, class: `fl-${col}` })); // shrinking sizes, so all four show when they meet
                  });
                  return els;
                },
                readout: (p) => { const T = p.t / Math.sqrt(9.8 / 4); return Math.abs(Math.cos(p.t)) < 0.04 ? `${fix(T, 2)} s · **all four at the bottom together**` : `${fix(T, 2)} s since release`; },
              },
              after: r`They all arrive at the bottom at the same moment, about 1.00 s after release, whatever height they started from: the cycloid is the **tautochrone** ("same time") curve. A bead starting higher has farther to go, but the curve is steeper up there, so it speeds up more, and the two effects cancel exactly. Along the curve, the bead's distance from the bottom obeys the same equation as a spring, so the timing is the same for every swing. In 1673 Christiaan Huygens used this to design a pendulum clock whose period didn't depend on the size of its swing.`,
            },
          ],
          recap: [
            'A cycloid is traced by a point on a rolling wheel.',
            'One arch is 8 times the radius long.',
            'It’s also the tautochrone: equal descent times from any start.',
          ],
        },
      ],
    },
    {
      title: 'Nature’s Optimisers',
      summary: 'Chains and soap films.',
      lessons: [
        {
          id: 'catenary',
          title: 'The Hanging Chain',
          summary: 'Catenary, not parabola',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Chain or parabola?',
              body: r`A chain hanging freely between two supports sags into a curve. Galileo guessed it was a **parabola**. In 1691, Leibniz, Huygens and Johann Bernoulli showed it's actually a **catenary**:
$$y = a\cosh\frac{x}{a} = \frac{a}{2}\left(e^{x/a} + e^{-x/a}\right)$$
Compare it with the parabola through the same three points. Change how tightly the chain is pulled.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.3, xmax: 3.3, ymin: -0.3, ymax: 3.6, grid: 1, axes: false, maxWidth: 520,
                params: { a: { min: 0.8, max: 3, step: 0.1, value: 1.2, label: 'tension a', color: 'blue', format: (v) => v.toFixed(1) } },
                curves: [
                  { f: (x, p) => (Math.abs(x) <= 3 ? p.a * Math.cosh(x / p.a) - p.a + 0.2 : NaN), color: 'ink', width: 4 },
                  { f: (x, p) => { const top = p.a * Math.cosh(3 / p.a) - p.a; return Math.abs(x) <= 3 ? (top * x * x) / 9 + 0.2 : NaN; }, color: 'coral', dash: true },
                ],
                readout: () => 'black: catenary (real chain) · dashed coral: parabola through the same ends and lowest point',
              },
              after: r`They're close for a taut chain (large $a$), but a slack chain clearly differs: the catenary is flatter at the bottom and steeper near the supports. A chain's own weight is spread evenly along its **length**. A parabola appears instead when the load is spread evenly **horizontally**, like the cables of a suspension bridge carrying a level road.`,
            },
            {
              type: 'interactive',
              title: 'Set the sag',
              body: r`A chain hangs between two posts 4 m apart, at the same height. Its shape is $y = a\cosh\frac{x}{a}$ for $-2 \le x \le 2$, and its sag is the drop from the posts to the lowest point, $a\left(\cosh\frac2a - 1\right)$. Adjust $a$ so the chain sags by exactly **1 m**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.6, xmax: 2.6, ymin: -2.3, ymax: 0.5, grid: false, axes: false, maxWidth: 480,
                params: { a: { min: 0.8, max: 5, step: 0.01, value: 3, label: 'a', color: 'blue', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x, p) => (Math.abs(x) <= 2 ? p.a * (Math.cosh(x / p.a) - Math.cosh(2 / p.a)) : NaN), color: 'ink', width: 4 }, { f: () => -1, color: 'coral', dash: true }],
                extra: ({ plot, s }) => [-2, 2].map((x) => s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(0.3), y2: plot.Y(-2.3), stroke: 'var(--ink-3)', 'stroke-width': 6 })),
                readout: (p) => `Sag: **${(p.a * (Math.cosh(2 / p.a) - 1)).toFixed(3)} m** · chain length ${(2 * p.a * Math.sinh(2 / p.a)).toFixed(3)} m`,
                goal: (p) => Math.abs(p.a * (Math.cosh(2 / p.a) - 1) - 1) < 0.02,
                hint: 'Smaller a means a slacker chain with a bigger sag.',
                solution: { a: 2.15 },
              },
              explain: r`$a \approx 2.15$ gives a 1 m sag, with a chain about 4.6 m long, only 15% longer than the gap. Engineers need exactly this sort of calculation for power lines, which must sag enough not to snap in cold weather (when the wire shrinks) but not so much that they touch the trees in summer.`,
            },
            {
              type: 'numeric',
              title: 'Angle at the post',
              prompt: r`The slope of the catenary $y = a\cosh\frac{x}{a}$ is $\sinh\frac{x}{a}$. A chain with $a = 2$ hangs between posts at $x = \pm 2$. At what angle above the horizontal does it leave each post? ($\sinh 1 \approx 1.175$; nearest degree.)`,
              unit: '°',
              answer: (Math.atan(Math.sinh(1)) * 180) / Math.PI,
              tol: 0.6,
              wrong: [{ v: 45, why: r`The slope is $\sinh 1 \approx 1.18$, a bit steeper than 1.` }],
              explain: r`$\arctan(1.175) \approx 50°$. The tension in the chain points along the curve, so at the post it pulls at $50°$: the steeper the angle, the more of the chain's weight each post carries vertically, and the less horizontal pull.`,
            },
            {
              type: 'mcq',
              title: 'Square wheels',
              prompt: r`A bicycle with **square** wheels can ride perfectly smoothly, with its axle staying level, on a road made of a special repeating curve. Which curve?`,
              choices: [
                { t: 'Upside-down catenary arches, one per side of the square', ok: true },
                { t: 'Semicircles', why: 'Close, but semicircles don’t keep the axle level. The exact answer involves cosh.' },
                { t: 'A flat road', why: 'On a flat road a square wheel makes the axle bob up and down.' },
              ],
              explain: r`An inverted catenary is exactly the shape that lets a rolling square keep its centre at a constant height, with each corner fitting into the dip between arches. There's a working square-wheeled tricycle at the Museum of Mathematics in New York.`,
            },
            {
              type: 'numeric',
              title: 'How much sag?',
              prompt: r`A chain hangs as $y = 10\cosh\frac{x}{10}$ between posts at $x = \pm 10$ m. Its lowest point is at height 10 m. How far does it sag below the tops of the posts, in metres? (2 decimal places.)`,
              unit: 'm',
              answer: 10 * Math.cosh(1) - 10,
              tol: 0.01,
              explain: r`At the posts $y = 10\cosh 1 \approx 15.43$ m, so the sag is about 5.43 m. Pulling the chain tighter increases the parameter $a$ and flattens the curve, but it can never be perfectly straight.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Arches',
              prompt: r`Robert Hooke wrote in 1675: "As hangs the flexible line, so but inverted will stand the rigid arch." Why does an upside-down catenary make an ideal arch?`,
              choices: [
                { t: 'A hanging chain is in pure tension; flipped over, every part of the arch is in pure compression, with no bending', ok: true },
                { t: 'It uses the least material of any shape', why: 'The key property is that forces flow along the curve, so there’s no bending stress, which masonry handles badly.' },
                { t: 'It looks the most attractive', why: 'Architects do love it, but the reason is structural: pure compression.' },
              ],
              explain: r`In a hanging chain, every link pulls only along the curve. Flip the shape and every stone **pushes** only along the curve: pure compression, which stone and brick handle superbly. Antoni Gaudí designed his buildings in Barcelona using upside-down models of hanging chains and weights.`,
            },
          ],
          recap: [
            r`A hanging chain forms a catenary, $y = a\cosh(x/a)$, not a parabola.`,
            'Suspension-bridge cables carrying a level deck form parabolas.',
            'Inverted catenary arches stand in pure compression.',
          ],
        },
        {
          id: 'soap',
          title: 'Soap Films',
          summary: 'Minimal surfaces and 120°',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Nature minimises',
              body: r`Surface tension pulls a soap film to make its area as **small as possible**. That's why a free bubble is a sphere: the smallest surface enclosing a given volume.

In the 1870s, Joseph Plateau found that where soap films meet, they always meet **three at a time, at 120°** angles.`,
            },
            {
              type: 'numeric',
              title: 'Connecting four towns',
              prompt: r`Four towns sit at the corners of a square with side 1. Joining them with an X (both diagonals) needs total road length $2\sqrt2 \approx 2.83$. The shortest network (found by soap films stretched between pins) uses two junctions with 120° angles and has length $1 + \sqrt3$. How long is that, to 2 decimal places?`,
              answer: 1 + Math.sqrt(3),
              tol: 0.006,
              wrong: [{ v: 2.83, tol: 0.01, why: r`That's the X network. Compute $1 + \sqrt3$.` }, { v: 3, why: r`That's three sides of the square, longer still. $1 + \sqrt3 \approx 2.73$.` }],
              explain: r`$1 + \sqrt3 \approx 2.73$, about 3.4% shorter than the X. This **Steiner tree** looks lopsided, yet it beats the symmetric X. Dip a frame with four pins into soapy water and the film finds it for you. Engineers use the same ideas to design networks of pipes, cables and chip wiring.`,
            },
            {
              type: 'numeric',
              title: 'Three towns',
              prompt: r`Three towns form an equilateral triangle with sides of 1 km. The shortest road network joins them at a central junction, with roads meeting at 120°. Each road runs from the centre to a corner, a distance of $\frac{1}{\sqrt3}$ km. What is the total length? (3 decimal places.)`,
              unit: 'km',
              answer: Math.sqrt(3),
              tol: 0.001,
              wrong: [{ v: 2, why: r`That's two sides of the triangle. The junction network is $3 \times \frac{1}{\sqrt3} = \sqrt3$.` }, { v: 1 / Math.sqrt(3), tol: 0.001, why: 'That’s one road. There are three.' }],
              explain: r`$3 \times \frac{1}{\sqrt3} = \sqrt3 \approx 1.732$ km, about 13% shorter than using two sides (2 km). Adding junctions (**Steiner points**) can shorten networks; finding the best ones for many towns is an NP-hard problem, but soap films solve small cases physically.`,
            },
            {
              type: 'mcq',
              title: 'Two bubbles stuck together',
              prompt: r`Two soap bubbles of different sizes stick together. Which way does the wall between them bulge?`,
              choices: [
                { t: r`Into the larger bubble, because the smaller bubble has higher pressure inside`, ok: true },
                { t: r`Into the smaller bubble`, why: r`Smaller bubbles have **higher** pressure (it goes like 1/r), so they push into the bigger one.` },
                { t: r`It stays flat`, why: r`Only bubbles of equal size have a flat wall between them.` },
              ],
              explain: r`The pressure inside a bubble exceeds the outside by $\frac{4\gamma}{r}$, so the small bubble pushes harder and the wall bows into the big one. The three films still meet at $120°$, as Plateau’s laws require.`,
            },
            {
              type: 'interactive',
              title: 'Join three towns',
              body: r`Three towns need to be joined by roads meeting at one junction. Drag the junction to make the **total** road length as short as you can. (A soap film stretched between three pins finds the answer instantly.)`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 6.5, ymin: -0.7, ymax: 4.5, grid: false, axes: false, maxWidth: 440,
                params: { x: { min: 0, max: 6, step: 0.01, value: 3, slider: false }, y: { min: 0, max: 4, step: 0.01, value: 2.5, slider: false } },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }, { x: () => 0, y: () => 0, color: 'coral' }, { x: () => 6, y: () => 0, color: 'coral' }, { x: () => 1.5, y: () => 4, color: 'coral' }],
                extra: ({ plot, p, s }) => [[0, 0], [6, 0], [1.5, 4]].map(([a, b]) => s('line', { x1: plot.X(p.x), y1: plot.Y(p.y), x2: plot.X(a), y2: plot.Y(b), stroke: 'var(--violet)', 'stroke-width': 3 })),
                readout: (p) => { const T = [[0, 0], [6, 0], [1.5, 4]], L = T.reduce((t, [a, b]) => t + Math.hypot(p.x - a, p.y - b), 0), ang = T.map(([a, b]) => Math.atan2(b - p.y, a - p.x)).sort((u, v) => u - v), gaps = [ang[1] - ang[0], ang[2] - ang[1], 2 * Math.PI - ang[2] + ang[0]].map((g) => Math.round((g * 180) / Math.PI)); return `total road **${L.toFixed(3)}** · angles at the junction: ${gaps.join('°, ')}°`; },
                goal: (p) => [[0, 0], [6, 0], [1.5, 4]].reduce((t, [a, b]) => t + Math.hypot(p.x - a, p.y - b), 0) < 9.318 * 1.002,
                hint: 'Watch the angles between the roads: at the best junction they are all equal.',
                solution: { x: 1.9, y: 1.55 },
              },
              explain: r`The shortest network has a total length of about 9.32, with the three roads meeting at **120°** to each other, exactly the angle at which soap films always meet. Any other angle could be shortened by nudging the junction, so a minimum must balance the three "pulls" equally.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why 120°?',
              prompt: r`Three soap films pull with equal tension at a junction. Why must they meet at 120°?`,
              choices: [
                { t: 'Three equal pulls only balance if they are spread evenly, 120° apart', ok: true },
                { t: 'Because soap molecules are triangular', why: 'Molecular shape isn’t the reason. It’s force balance.' },
                { t: 'Any angles would work', why: 'Unequal angles would leave a net force, and the junction would slide until the angles evened out.' },
              ],
              explain: r`Three equal forces add up to zero only when they're arranged symmetrically, 120° apart, like the logo of a three-pointed star. Any other arrangement leaves a net pull that moves the junction until balance is reached. That's also why honeycomb cells and foams show 120° junctions.`,
            },
          ],
          recap: [
            'Soap films minimise area: free bubbles are spheres.',
            'Films meet three at a time at 120° (Plateau’s laws).',
            'Soap films solve shortest-network problems like the Steiner tree.',
          ],
        },
      ],
    },
    {
      title: 'Shapes with a Superpower',
      summary: 'Constant width, and the most area for a given fence.',
      lessons: [
        {
          id: 'width',
          title: 'Constant Width',
          summary: 'Rollers that aren’t round',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Round manhole covers',
              prompt: 'Why are most manhole covers round rather than square?',
              choices: [
                { t: 'A circle is the same width in every direction, so the cover can’t slip through its own hole', ok: true },
                { t: 'Round covers are cheaper to cast', why: 'Possibly, but the key safety reason is geometric.' },
                { t: 'Square covers can’t be made strong enough', why: 'Strength isn’t the issue: a square cover turned diagonally can drop through its hole.' },
              ],
              explain: r`A square cover's diagonal is about 41% longer than its side, so tilted on edge it can fall through the square hole. A circle has the same width in every direction, so it can't. But surprisingly, the circle is **not** the only shape with this property.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The Reuleaux triangle',
              body: r`Draw an equilateral triangle, then replace each side with an arc centred on the opposite corner. The result, named after the engineer Franz Reuleaux, has **constant width**: squeezed between two parallel lines, it always touches both, however it's turned. Rotate it.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 1, ymin: -0.2, ymax: 1.2, grid: false, axes: false, maxWidth: 420,
                params: { th: { min: 0, max: 120, step: 1, value: 15, label: 'turn', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const { pts, centre } = reuleaux((p.th * Math.PI) / 180);
                  return [
                    s('line', { x1: plot.X(-1), x2: plot.X(1), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(-1), x2: plot.X(1), y1: plot.Y(1), y2: plot.Y(1), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(centre), r: 5, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => { const { width, centre } = reuleaux((p.th * Math.PI) / 180); return `Width between the lines: **${width.toFixed(4)}** · height of the centre: ${centre.toFixed(3)}`; },
              },
              after: r`The width never changes, so a heavy slab could roll smoothly on Reuleaux-shaped rollers. But watch the coral centre: it bobs up and down, so a Reuleaux **wheel** on a fixed axle would give a bumpy ride. Rollers yes, wheels no.`,
            },
            {
              type: 'numeric',
              title: 'Barbier’s theorem',
              body: r`Joseph-Émile Barbier proved in 1860 that **every** shape of constant width $w$ has the same perimeter as the circle of diameter $w$: $\pi w$.`,
              prompt: 'A Reuleaux triangle has width 10 cm. What is its perimeter, in cm? (1 decimal place.)',
              unit: 'cm',
              answer: 10 * Math.PI,
              tol: 0.05,
              wrong: [{ v: 30, why: 'The sides are arcs, not straight lines. Use Barbier: perimeter = π × width.' }, { v: 5 * Math.PI, tol: 0.05, why: 'π times the **width** (10 cm), not half of it.' }],
              explain: r`$10\pi \approx 31.4$ cm. Check directly: each of the 3 arcs has radius 10 and spans $60°$, so it is $\frac16$ of a circle of circumference $20\pi$: three arcs make $3 \times \frac{20\pi}{6} = 10\pi$ ✓.`,
            },
            {
              type: 'numeric',
              title: 'Less area',
              prompt: r`A Reuleaux triangle of width 1 has area $\frac{\pi - \sqrt3}{2}$. What is that, to 3 decimal places? (A circle of diameter 1 has area $\frac{\pi}{4} \approx 0.785$.)`,
              answer: (Math.PI - Math.sqrt(3)) / 2,
              tol: 0.001,
              wrong: [{ v: Math.PI / 4, tol: 0.001, why: 'That’s the circle. The Reuleaux triangle is smaller.' }],
              explain: r`$\frac{\pi - \sqrt3}{2} \approx 0.705$, about 10% less than the circle. The **Blaschke–Lebesgue theorem** says the Reuleaux triangle has the **smallest** area of all shapes of a given constant width; the circle has the largest. Same perimeter, different areas.`,
            },
            {
              type: 'mcq',
              title: 'Drilling square holes',
              prompt: r`A Reuleaux triangle of width 1 can turn completely inside a $1 \times 1$ square, touching all four sides the whole time. In the 1910s the engineer Harry Watts patented a drill bit based on this. What can it do?`,
              choices: [
                { t: 'Drill (almost) square holes, with only slightly rounded corners', ok: true },
                { t: 'Drill perfectly round holes faster', why: 'Ordinary drills already make round holes. This one makes nearly square ones.' },
                { t: 'Drill triangular holes', why: 'It turns inside a square, sweeping out almost all of it.' },
              ],
              explain: r`As the Reuleaux triangle turns in the square, it sweeps out all but about 1.2% of it, missing only tiny rounded corners. Watts' drill uses a special chuck that lets the bit's centre wander along the path it needs. Constant-width shapes turn up in engines too: the Wankel rotary engine's rotor is Reuleaux-like.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Seven-sided coins',
              prompt: r`The British 20p and 50p coins have 7 curved sides: they're Reuleaux heptagons. Why that shape instead of a circle or a straight-sided heptagon?`,
              choices: [
                { t: 'Constant width lets vending machines measure them, while the corners make them easy to tell apart by touch', ok: true },
                { t: 'Straight-sided heptagons can’t be minted', why: 'They could be minted, but they wouldn’t have constant width, which coin-measuring machines rely on.' },
                { t: 'It makes them roll in straight lines', why: 'Any shape of constant width rolls between parallel lines; the reason is measurement plus recognisability.' },
              ],
              explain: r`Coin slots and machines measure a coin's width; a constant-width coin measures the same at any angle, just like a round one. Yet the corners make it instantly recognisable by touch. Any regular polygon with an **odd** number of sides can be "Reuleaux-ed" this way; even-sided ones can't, because opposite corners would sit directly across from each other.`,
            },
          ],
          recap: [
            'Shapes of constant width include the circle and the Reuleaux polygons.',
            'Barbier: every shape of constant width w has perimeter πw.',
            'The Reuleaux triangle has the least area of any such shape; it can drill nearly square holes.',
          ],
        },
        {
          id: 'isoperimetric',
          title: 'Most Area, Least Fence',
          summary: 'Why the circle is special',
          icon: 'target',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A square pen',
              prompt: 'With 40 m of fencing you make a square pen. What area does it enclose?',
              unit: 'm²',
              answer: 100,
              wrong: [{ v: 1600, why: 'Each side is 40 ÷ 4 = 10 m.' }, { v: 400, why: r`Each side is 10 m, so the area is $10^2$.` }],
              explain: r`Each side is 10 m, so the area is 100 m². You saw that the square beats every other rectangle. But the square isn't the best shape overall.`,
            },
            {
              type: 'interactive',
              title: 'More sides',
              body: r`The fence stays 40 m long but makes a regular polygon. Add sides and watch the area. Find the fewest sides that come within **1%** of the area of a circle with the same perimeter.`,
              widget: {
                kind: 'graph', equal: true, xmin: -7.5, xmax: 7.5, ymin: -7.5, ymax: 7.5, grid: false, axes: false, maxWidth: 380,
                params: { n: { min: 3, max: 40, step: 1, value: 4, label: 'sides', color: 'green' } },
                extra: ({ plot, p, s }) => {
                  const R = 40 / (2 * p.n * Math.sin(Math.PI / p.n)), Rc = 40 / (2 * Math.PI);
                  const pts = Array.from({ length: p.n }, (_, k) => { const a = Math.PI / 2 + (2 * Math.PI * k) / p.n; return [R * Math.cos(a), R * Math.sin(a)]; });
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(Rc) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
                    s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: 'fl-green', opacity: 0.25, stroke: 'var(--success)', 'stroke-width': 2.5 }),
                  ];
                },
                readout: (p) => { const A = ngonArea(p.n, 40), C = 1600 / (4 * Math.PI); return `Area **${A.toFixed(2)} m²** · circle ${C.toFixed(2)} m² · ${(100 * A / C).toFixed(2)}% of the circle`; },
                goal: (p) => ngonArea(p.n, 40) / (1600 / (4 * Math.PI)) >= 0.99,
                hint: 'It takes more sides than you might think. Try the high teens.',
                solution: { n: 19 },
              },
              explain: r`19 sides reach 99.1% of the circle's $\frac{40^2}{4\pi} \approx 127.3$ m². Each extra side helps a little less, and no polygon ever quite reaches the circle. The triangle encloses only 77 m², the square 100 m².`,
            },
            {
              type: 'explain',
              title: 'The isoperimetric inequality',
              body: r`For **any** closed curve of length $L$ enclosing area $A$:

::: key
$$4\pi A \le L^2,$$
with equality only for a circle.
:::

So the circle encloses the most area for a given perimeter, and needs the least perimeter for a given area. The ancient Greeks believed it; a fully rigorous proof only came in the 19th century. It's why bubbles are round, why cells and water droplets tend to be round, and why a cat curls up into a ball to keep warm: the least surface for its volume loses the least heat.`,
            },
            {
              type: 'numeric',
              title: 'A round pen',
              prompt: r`The 40 m fence makes a circle instead. What area does it enclose? (1 decimal place.)`,
              unit: 'm²',
              answer: 1600 / (4 * Math.PI),
              tol: 0.06,
              wrong: [{ v: 1600 / Math.PI, tol: 0.1, why: r`The radius is $\frac{40}{2\pi} \approx 6.37$ m, and the area is $\pi r^2$.` }, { v: 100, why: 'That’s the square. The circle encloses more.' }],
              hint: r`$r = \frac{40}{2\pi}$, then $A = \pi r^2 = \frac{40^2}{4\pi}$.`,
              explain: r`$r = \frac{40}{2\pi} \approx 6.37$ m, so $A = \pi r^2 = \frac{1600}{4\pi} \approx 127.3$ m², over 27% more than the square, with exactly the same fence.`,
            },
            {
              type: 'mcq',
              title: 'Dido’s problem',
              body: r`In Virgil's *Aeneid*, Queen Dido fled to North Africa and was offered as much land as she could enclose with an ox hide. She cut the hide into a long thin strip and laid it out against the straight coastline, using the sea as part of the boundary.`,
              prompt: 'What shape should the strip make to enclose the most land?',
              choices: [
                { t: 'A semicircle, with the straight coast as its diameter', ok: true },
                { t: 'A square against the coast', why: 'Reflect the shape in the coastline: the best closed shape is a circle, so the best half-shape is a semicircle.' },
                { t: 'A long rectangle along the coast', why: 'Thin shapes waste boundary. Reflecting in the coast turns the question into the circle problem.' },
              ],
              explain: r`Reflect the land in the coastline: the strip plus its mirror image is a closed curve of twice the length, enclosing twice the area. That's best when it's a circle, so the land should be a **semicircle**. Legend says Dido founded Carthage this way.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Dido’s kingdom',
              prompt: r`If Dido's strip was 1 km long and she laid it as a semicircle against the coast, how much land did she enclose, in km²? (3 decimal places.)`,
              unit: 'km²',
              answer: 1 / (2 * Math.PI),
              tol: 0.001,
              wrong: [{ v: 1 / (4 * Math.PI), tol: 0.001, why: 'That’s a full circle made from the strip. Using the coast as the diameter does twice as well.' }, { v: 0.125, tol: 0.001, why: r`A semicircle with arc 1 km has radius $\frac{1}{\pi}$ km, and area $\frac12 \pi r^2$.` }],
              hint: r`The semicircular arc is $\pi r = 1$ km, so $r = \frac1\pi$.`,
              explain: r`$r = \frac{1}{\pi}$ km, so the area is $\frac12 \pi r^2 = \frac{1}{2\pi} \approx 0.159$ km², twice what a closed circle of the same strip would hold. Using a straight barrier you already have is a classic trick: the same reasoning puts a field beside a river in the Multivariable Calculus course.`,
            },
          ],
          recap: [
            r`Isoperimetric inequality: $4\pi A \le L^2$, with equality only for the circle.`,
            'Regular polygons approach the circle’s area as the number of sides grows.',
            'Against a straight coast, the best shape is a semicircle (Dido’s problem).',
          ],
        },
        {
          id: 'log-spiral',
          title: 'The Logarithmic Spiral',
          summary: 'Growth without changing shape',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'The marvellous spiral',
              body: r`In the **logarithmic spiral** $r = a\,e^{b\theta}$, the distance from the centre grows by the same **factor** with every turn. Jacob Bernoulli was so taken with it that he asked for it to be carved on his tombstone, with the motto *Eadem mutata resurgo*: "though changed, I rise again the same".

Its signature property: every line from the centre crosses the spiral at the **same angle** $\alpha$, with $\cot\alpha = b$. That’s why it is also called the **equiangular spiral**.`,
            },
            {
              type: 'numeric',
              title: 'Growth per turn',
              prompt: r`For $r = e^{0.1\theta}$, by what factor does $r$ grow in one full turn ($\theta$ increases by $2\pi$)? (2 decimal places.)`,
              answer: Math.exp(0.2 * Math.PI),
              tol: 0.01,
              explain: r`$e^{0.1 \times 2\pi} = e^{0.628} \approx 1.87$. Every turn, the spiral is 1.87 times further out, whichever turn you start from.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A golden spiral',
              prompt: r`Change the crossing angle $\alpha$ between the spiral and its radii. Find the angle for which the spiral grows by the **golden ratio** $\varphi \approx 1.618$ every **quarter turn**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -10, xmax: 10, ymin: -10, ymax: 10, grid: false, axes: false, maxWidth: 360, pad: 6,
                params: { al: { min: 60, max: 88, step: 0.05, value: 80, label: 'crossing angle α', color: 'violet', format: (v) => `${v.toFixed(2)}°` } },
                extra: ({ plot, p, s }) => { const b = 1 / Math.tan((p.al * Math.PI) / 180), pts = [], t0 = Math.log(0.05) / b, t1 = Math.log(9.5) / b; for (let i = 0; i <= 900; i++) { const t = t0 + ((t1 - t0) * i) / 900, r = Math.exp(b * t); pts.push([r * Math.cos(t), r * Math.sin(t)]); } const out = [s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 })]; for (let k = 0; k < 8; k++) { const t = (k * Math.PI) / 4; out.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(10 * Math.cos(t)), y2: plot.Y(10 * Math.sin(t)), stroke: 'var(--line-2)', 'stroke-width': 1 })); } return out; },
                readout: (p) => { const b = 1 / Math.tan((p.al * Math.PI) / 180); return `b = cot α = ${b.toFixed(4)} · growth per quarter turn **${Math.exp((b * Math.PI) / 2).toFixed(3)}** · per full turn ${Math.exp(2 * Math.PI * b).toFixed(2)}`; },
                goal: (p) => Math.abs(Math.exp(((1 / Math.tan((p.al * Math.PI) / 180)) * Math.PI) / 2) - 1.618) < 0.005,
                hint: r`You need $e^{b\pi/2} = 1.618$, so $b = \frac{2\ln 1.618}{\pi} \approx 0.306$, and $\alpha = \arctan\frac1b$.`,
                solution: { al: 72.97 },
              },
              explain: r`$b = \frac{\ln\varphi}{\pi/2} \approx 0.306$, so $\alpha \approx 73.0°$. This "golden spiral" is close to the spiral drawn through a sequence of golden rectangles. Despite popular claims, real nautilus shells usually grow more slowly, by about a factor of 3 per turn.`,
            },
            {
              type: 'mcq',
              title: 'Zoom or rotate?',
              prompt: r`If you enlarge a logarithmic spiral by its growth factor per turn, what do you get?`,
              choices: [
                { t: 'Exactly the same spiral: scaling it is the same as rotating it', ok: true },
                { t: 'A wider, looser spiral', why: 'Enlarging changes no angles, and the spiral is defined by its constant angle.' },
                { t: 'A different curve altogether', why: 'The spiral is self-similar: magnified copies coincide with rotated ones.' },
              ],
              explain: r`Scaling by $e^{2\pi b}$ maps $r = ae^{b\theta}$ onto itself; scaling by any factor equals some rotation. This self-similarity is why the spiral appears wherever something grows by adding material in proportion to its size: shells, horns, hurricane arms and galaxy arms.`,
            },
            {
              type: 'numeric',
              title: 'A nautilus',
              prompt: r`A nautilus shell grows by a factor of about 3 per turn. What is its crossing angle $\alpha$? (Degrees, 1 decimal place.)`,
              unit: '°',
              answer: (Math.atan((2 * Math.PI) / Math.log(3)) * 180) / Math.PI,
              tol: 0.1,
              explain: r`$b = \frac{\ln 3}{2\pi} \approx 0.175$ and $\alpha = \arctan\frac{1}{0.175} \approx 80.1°$: a fairly tight spiral, much closer to a circle (90°) than the golden spiral.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Moths and flames',
              prompt: r`A moth navigates by keeping a light source at a **fixed angle** to its flight direction (fine for the distant Moon). What path does it follow around a nearby lamp?`,
              choices: [
                { t: 'A logarithmic spiral, ending at the lamp (if the angle is less than 90°)', ok: true },
                { t: 'A circle around the lamp', why: 'Only if the fixed angle were exactly 90°.' },
                { t: 'A straight line', why: 'Keeping a constant angle to a nearby point makes the path curve.' },
              ],
              explain: r`Keeping a constant angle to the lines from a point is exactly the defining property of the logarithmic spiral, so the moth spirals inwards. (This is one popular explanation for moths circling lamps; recent research suggests they may instead be keeping the brightest light "above" them.) Falcons diving on prey follow a similar curve, which lets them keep the target in view out of the side of one eye without turning their head.`,
            },
          ],
          recap: [
            r`Logarithmic spiral $r = ae^{b\theta}$: the same growth factor every turn.`,
            r`Radii cross it at a constant angle $\alpha$ with $\cot\alpha = b$.`,
            'Scaling it equals rotating it: perfect self-similarity.',
          ],
        },
      ],
    },
  ],
};
