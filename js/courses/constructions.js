const r = String.raw;
const D = Math.PI / 180;
const arcPath = (plot, cx, cy, rad, a0, a1) => {
  let d = '';
  for (let i = 0; i <= 40; i++) {
    const a = (a0 + ((a1 - a0) * i) / 40) * D;
    d += `${i ? 'L' : 'M'}${plot.X(cx + rad * Math.cos(a)).toFixed(1)} ${plot.Y(cy + rad * Math.sin(a)).toFixed(1)}`;
  }
  return d;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export default {
  id: 'constructions',
  subject: 'math',
  title: 'Compass & Straightedge',
  level: 'Intermediate',
  cover: 'constructions',
  tagline: 'Build geometry from two simple tools, and discover the problems they can never solve.',
  description: r`With nothing but a compass and an unmarked ruler, the ancient Greeks constructed triangles, bisectors, hexagons and pentagons. Three puzzles defeated them for over 2,000 years. Learn the constructions, follow the teenage Gauss to the 17-sided polygon, and see how algebra finally proved that some constructions are impossible.`,
  prereq: 'Geometry: Visual Proofs',
  chapters: [
    {
      title: 'The Rules of the Game',
      summary: 'Two tools and the first constructions.',
      lessons: [
        {
          id: 'tools',
          title: 'Euclid’s Tools',
          summary: 'Circles, lines and an equilateral triangle',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Only two moves',
              body: r`Around 300 BC, Euclid built geometry from a few starting rules. In practice, they boil down to two tools:

- A **straightedge**: draw the line through two points you already have. It has **no markings**, so you can't measure with it.
- A **compass**: draw a circle with a given centre, passing through a given point.

New points appear only where lines and circles cross. Everything in this course is built from these moves. It's a game with strict rules, and the fun is in seeing what the rules allow.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Euclid’s first construction',
              prompt: r`The very first proposition in Euclid's *Elements*: build an **equilateral triangle** on segment $AB$. The arcs are circles centred at $A$ and $B$, each with radius $AB$. Drag $C$ to the right spot.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: 1, axes: false, maxWidth: 560,
                params: { cx: { min: 0, max: 10, step: 0.05, value: 8, slider: false }, cy: { min: 0, max: 7, step: 0.05, value: 3.5, slider: false } },
                points: [{ x: (p) => p.cx, y: (p) => p.cy, drag: { x: 'cx', y: 'cy' }, color: 'teal', label: 'C', labelDx: 12, labelDy: -12 }],
                extra: ({ plot, p, s }) => {
                  const A = [3, 2], B = [7, 2], C = [p.cx, p.cy];
                  return [
                    s('path', { d: arcPath(plot, 3, 2, 4, 20, 100), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    s('path', { d: arcPath(plot, 7, 2, 4, 80, 160), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    s('path', { d: `M${plot.X(A[0])} ${plot.Y(A[1])} L${plot.X(C[0])} ${plot.Y(C[1])} L${plot.X(B[0])} ${plot.Y(B[1])}`, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(A[0]), y1: plot.Y(A[1]), x2: plot.X(B[0]), y2: plot.Y(B[1]), stroke: 'var(--ink)', 'stroke-width': 3.5 }),
                    s('circle', { cx: plot.X(A[0]), cy: plot.Y(A[1]), r: 7, class: 'fl-blue' }),
                    s('circle', { cx: plot.X(B[0]), cy: plot.Y(B[1]), r: 7, class: 'fl-coral' }),
                    s('text', { x: plot.X(A[0]) - 22, y: plot.Y(A[1]) + 20, class: 'lbl', text: 'A' }),
                    s('text', { x: plot.X(B[0]) + 12, y: plot.Y(B[1]) + 20, class: 'lbl', text: 'B' }),
                  ];
                },
                readout: (p) => {
                  const C = [p.cx, p.cy];
                  return r`$AB = 4.00$, $\;CA = ${dist(C, [3, 2]).toFixed(2)}$, $\;CB = ${dist(C, [7, 2]).toFixed(2)}$`;
                },
                goal: (p) => Math.abs(dist([p.cx, p.cy], [3, 2]) - 4) < 0.08 && Math.abs(dist([p.cx, p.cy], [7, 2]) - 4) < 0.08,
                hint: 'Every point on the blue arc is exactly AB away from A. Every point on the coral arc is AB away from B.',
                solution: { cx: 5, cy: 5.45 },
              },
              explain: r`$C$ sits where the two arcs cross. Being on the circle round $A$ means $CA = AB$; being on the circle round $B$ means $CB = AB$. So all three sides are equal. That's the whole proof, and it's exactly how Euclid opens the *Elements*.`,
            },
            {
              type: 'numeric',
              title: 'How tall is it?',
              prompt: r`In the construction, $AB = 4$. How high above $AB$ is the point $C$? (2 decimal places.)`,
              answer: 2 * Math.sqrt(3),
              tol: 0.01,
              wrong: [{ v: 4, why: 'That’s the side length. The height is shorter: use Pythagoras on half the triangle.' }, { v: 2, why: r`That's half the base. Height $= \sqrt{4^2 - 2^2}$.` }],
              explain: r`Half the triangle is a right triangle with hypotenuse 4 and base 2, so the height is $\sqrt{16 - 4} = 2\sqrt3 \approx 3.46$. The construction produced $\sqrt3$ without any calculation: compass and straightedge build square roots naturally.`,
            },
            {
              type: 'mcq',
              title: 'Copying a length',
              prompt: r`Euclid's compass was thought of as "collapsing": it can draw a circle through a point, but it snaps shut when lifted, so you can't carry a length somewhere else. Does that make the tools weaker?`,
              choices: [
                { t: 'No: Euclid proved (Book I, Proposition 2) that you can still copy any length to any point, using extra circles', ok: true },
                { t: 'Yes: some constructions become impossible', why: 'Euclid’s second proposition shows how to transfer a length with a collapsing compass, so nothing is lost.' },
                { t: 'It doesn’t matter, because the straightedge can measure lengths', why: 'The straightedge has no markings. Measuring is exactly what it can’t do.' },
              ],
              explain: r`Euclid's second proposition uses an equilateral triangle (his first construction) and a couple of circles to move a length anywhere. So the collapsing compass is just as powerful as a modern one that holds its setting. From here on, we'll use the modern compass freely.`,
            },
            {
              type: 'numeric',
              title: 'Where the circles cross',
              prompt: r`Now open the compass wider: two circles of radius 3 have centres 2 apart. How far apart are their two crossing points? (2 decimal places.)`,
              answer: 2 * Math.sqrt(8),
              tol: 0.01,
              wrong: [{ v: 2 * Math.sqrt(3), tol: 0.01, why: 'That’s for radius 2. With radius 3 the circles overlap more, so the crossings are farther apart.' }],
              explain: r`The line through the crossing points cuts the line of centres at its midpoint, 1 from each centre. Pythagoras gives a half-chord of $\sqrt{3^2 - 1^2} = \sqrt8$, so the crossings are $2\sqrt8 = 4\sqrt2 \approx 5.66$ apart. Same construction, a different square root: any length built from squares and square roots can be drawn this way.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Throw away the ruler?',
              prompt: r`In 1797 Lorenzo Mascheroni (and, it turned out, Georg Mohr back in 1672) proved something surprising about the compass. What?`,
              choices: [
                { t: 'Every point you can construct with compass and straightedge can be constructed with a compass alone', ok: true },
                { t: 'The compass alone can trisect any angle', why: 'Removing a tool can’t add power: anything impossible with both tools is impossible with one.' },
                { t: 'The compass is unnecessary: a straightedge alone suffices', why: 'A straightedge alone can’t even find the midpoint of a segment. The compass is the essential tool.' },
              ],
              explain: r`The **Mohr–Mascheroni theorem**: the straightedge is never needed, as long as you count a line as "known" once you have two of its points. A straightedge alone, by contrast, is much weaker, although Jakob Steiner showed it suffices if a single circle with its centre is drawn somewhere on the page.`,
            },
          ],
          recap: [
            'Straightedge: a line through two points. Compass: a circle with a given centre through a given point.',
            'New points come only from intersections.',
            'An equilateral triangle comes from two circles of radius AB.',
          ],
        },
        {
          id: 'bisect',
          title: 'Cutting in Half',
          summary: 'Midpoints and bisectors',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'The perpendicular bisector',
              body: r`To find the midpoint of $AB$ without measuring: draw a circle around $A$ through $B$, and another around $B$ through $A$. They cross at two points, $P$ and $Q$. The line $PQ$ cuts $AB$ exactly in half, at right angles.`,
              widget: {
                kind: 'figure', w: 520, h: 300, maxWidth: 480, label: 'Perpendicular bisector construction',
                draw: ({ s }) => {
                  const A = [190, 150], B = [330, 150], R = 140, hgt = Math.sqrt(R * R - 70 * 70);
                  const P = [260, 150 - hgt], Q = [260, 150 + hgt];
                  return [
                    s('circle', { cx: A[0], cy: A[1], r: R, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    s('circle', { cx: B[0], cy: B[1], r: R, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    s('path', { d: `M${A[0]} ${A[1]} L${P[0]} ${P[1]} L${B[0]} ${B[1]} L${Q[0]} ${Q[1]} Z`, class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2 }),
                    s('line', { x1: 260, y1: P[1] - 14, x2: 260, y2: Q[1] + 14, stroke: 'var(--violet)', 'stroke-width': 3.5 }),
                    s('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: 'var(--ink)', 'stroke-width': 3.5 }),
                    ...[[A, 'A', -24, 6], [B, 'B', 12, 6], [P, 'P', 10, -6], [Q, 'Q', 10, 18], [[260, 150], 'M', 8, 20]].flatMap(([pt, t, dx, dy]) => [
                      s('circle', { cx: pt[0], cy: pt[1], r: 6, class: 'fl-ink' }),
                      s('text', { x: pt[0] + dx, y: pt[1] + dy, class: 'lbl', text: t }),
                    ]),
                  ];
                },
              },
              after: r`Why it works: $AP$, $PB$, $BQ$ and $QA$ are all radii of equal circles, so $APBQ$ is a **rhombus**. The diagonals of a rhombus bisect each other at right angles.`,
            },
            {
              type: 'mcq',
              title: 'What the line means',
              prompt: r`Which points lie on the perpendicular bisector of $AB$?`,
              choices: [
                { t: 'Exactly the points that are the same distance from A as from B', ok: true },
                { t: 'Only the midpoint M', why: 'Every point on the line, not just M, is equidistant from A and B. P and Q are examples.' },
                { t: 'Points closer to A than to B', why: 'Those lie on A’s side of the line. Points on the line are equally far from both.' },
              ],
              explain: r`The perpendicular bisector is the set of all points equidistant from $A$ and $B$. This is why it shows up everywhere: the centre of a circle through three points is where two perpendicular bisectors cross, and the borders on a "nearest hospital" map are made of such lines.`,
            },
            {
              type: 'order',
              title: 'Bisecting an angle',
              prompt: r`Put the steps for bisecting an angle at vertex $V$ in order.`,
              items: [
                'Draw a circle centred at V, crossing both arms of the angle at points A and B.',
                'Draw equal circles centred at A and at B, large enough to cross each other.',
                'Mark a point C where these two circles cross (inside the angle).',
                'Draw the line from V through C: it splits the angle exactly in half.',
              ],
              explain: r`$VA = VB$ (radii of the first circle) and $AC = BC$ (equal circles), so triangles $VAC$ and $VBC$ are congruent (SSS). Their angles at $V$ are therefore equal.`,
            },
            {
              type: 'mcq',
              title: 'A circle through three points',
              prompt: r`Three villages want a well that is equally far from all of them. How can you find the spot with compass and straightedge?`,
              choices: [
                { t: 'Draw the perpendicular bisectors of two sides of the triangle they form; the well goes where they cross', ok: true },
                { t: 'Bisect the three angles of the triangle', why: 'Angle bisectors meet at the point equally far from the three **sides**, not the three corners.' },
                { t: 'Take the midpoint of the longest side', why: 'That’s only equidistant from all three for a right-angled triangle.' },
              ],
              explain: r`Every point on the perpendicular bisector of $AB$ is equally far from $A$ and $B$. Where two bisectors cross, the point is equally far from all three villages: the **circumcentre**, the centre of the circle through all three. (The third bisector passes through it too.)`,
            },
            {
              type: 'numeric',
              title: 'Where the bisectors meet',
              prompt: r`The perpendicular bisectors of a triangle’s sides meet at the centre of the circle through its corners. For a right triangle with legs 6 and 8, what is that circle’s radius?`,
              answer: 5,
              explain: r`For a right triangle the bisectors meet at the midpoint of the hypotenuse (10), so the radius is 5. Thales’ theorem again.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Quarters',
              prompt: r`Each bisection construction needs 2 circles and 1 line. Using only this construction, how many **circles** do you need to divide segment $AB$ into 4 equal parts?`,
              unit: 'circles',
              answer: 6,
              wrong: [{ v: 4, why: 'Halve AB once (2 circles), then halve each of the two halves (2 more circles each).' }, { v: 2, why: 'That only finds the midpoint. Each half still needs halving.' }],
              explain: r`One bisection of $AB$ (2 circles), then one bisection of each half (2 circles each): $2 + 2 + 2 = 6$ circles. Puzzle fans compete to find constructions with the fewest possible moves, and cleverer tricks can beat this count.`,
            },
          ],
          recap: [
            'Two equal circles around A and B give the perpendicular bisector of AB.',
            'It works because APBQ is a rhombus.',
            'The bisector is the set of points equidistant from A and B.',
          ],
        },
        {
          id: 'perp',
          title: 'Perpendiculars & Parallels',
          summary: 'Right angles and parallel lines',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Dropping a perpendicular',
              body: r`To draw the line through a point $P$ perpendicular to a line $L$: draw a circle centred at $P$ that cuts $L$ at two points $A$ and $B$. Then $P$ is equidistant from $A$ and $B$, so it lies on the perpendicular bisector of $AB$. Bisect $AB$ at $M$, and $PM$ is the perpendicular.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the foot',
              prompt: r`The circle around $P$ cuts the line at $A$ and $B$. Drag $M$ along the line to the foot of the perpendicular from $P$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: -0.5, ymax: 5.5, grid: false, axes: false, maxWidth: 520,
                params: { m: { min: 0.5, max: 9.5, step: 0.1, value: 2, slider: false } },
                points: [{ x: (p) => p.m, y: () => 0, drag: { x: 'm' }, color: 'coral', label: 'M', labelDx: 8, labelDy: 20 }],
                extra: ({ plot, p, s }) => {
                  const Pp = [6.2, 3.5], R = 4.5, half = Math.sqrt(R * R - 3.5 * 3.5), A = [6.2 - half, 0], B = [6.2 + half, 0];
                  return [
                    s('line', { x1: plot.X(0), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('path', { d: arcPath(plot, Pp[0], Pp[1], R, 200, 340), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    s('line', { x1: plot.X(Pp[0]), y1: plot.Y(Pp[1]), x2: plot.X(p.m), y2: plot.Y(0), stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(Pp[0]), cy: plot.Y(Pp[1]), r: 7, class: 'fl-ink' }),
                    s('circle', { cx: plot.X(A[0]), cy: plot.Y(0), r: 6, class: 'fl-blue' }), s('circle', { cx: plot.X(B[0]), cy: plot.Y(0), r: 6, class: 'fl-blue' }),
                    s('text', { x: plot.X(Pp[0]) + 10, y: plot.Y(Pp[1]) - 8, class: 'lbl', text: 'P' }),
                    s('text', { x: plot.X(A[0]) - 6, y: plot.Y(0) + 22, class: 'lbl', 'text-anchor': 'end', text: 'A' }), s('text', { x: plot.X(B[0]) + 6, y: plot.Y(0) + 22, class: 'lbl', text: 'B' }),
                  ];
                },
                readout: (p) => {
                  const ang = (Math.atan2(3.5, 6.2 - p.m) * 180) / Math.PI;
                  return r`angle between $PM$ and the line: $${ang.toFixed(0)}°$`;
                },
                goal: (p) => Math.abs(p.m - 6.2) < 0.051,
                hint: 'The foot of the perpendicular is the midpoint of A and B.',
                solution: { m: 6.2 },
              },
              explain: r`The midpoint of $AB$ is directly below $P$, making a right angle. It's also the point of $L$ **closest** to $P$: the perpendicular is the shortest route from a point to a line.`,
            },
            {
              type: 'order',
              title: 'A parallel line',
              prompt: r`To draw a line through point $P$ parallel to line $L$, put these steps in order.`,
              items: [
                'Draw any line through P that crosses L at a point Q.',
                'Copy the angle that this crossing line makes with L, placing the copy at P.',
                'The new arm of the copied angle at P is parallel to L.',
              ],
              explain: r`Equal **corresponding angles** mean the lines are parallel (from the Geometry course). Copying an angle needs only circles: it's Euclid's Proposition I.23. Alternatively, drop a perpendicular from $P$ to $L$, then draw the perpendicular to that line at $P$.`,
            },
            {
              type: 'numeric',
              title: 'Shortest distance',
              prompt: r`The perpendicular gives the **shortest** distance from a point to a line. How far is the point $(0, 5)$ from the line $y = x$? (2 decimal places.)`,
              answer: 5 / Math.SQRT2,
              tol: 0.01,
              wrong: [{ v: 5, why: 'That’s the vertical distance. The perpendicular to y = x runs diagonally, so it’s shorter.' }],
              hint: r`The foot of the perpendicular is at $(2.5, 2.5)$.`,
              explain: r`The foot is at $(2.5, 2.5)$, and the distance is $\sqrt{2.5^2 + 2.5^2} = \frac{5}{\sqrt2} \approx 3.54$. Any other route to the line is a hypotenuse, so it's longer.`,
            },
            {
              type: 'numeric',
              title: 'Distance to a line',
              prompt: r`The perpendicular distance from a point $(x_0, y_0)$ to the line $ax + by = c$ is $\frac{|ax_0 + by_0 - c|}{\sqrt{a^2 + b^2}}$. How far is $(3, 4)$ from the line $x + y = 1$? (2 decimal places.)`,
              answer: 6 / Math.sqrt(2),
              tol: 0.01,
              explain: r`$\frac{|3 + 4 - 1|}{\sqrt2} = \frac{6}{\sqrt2} \approx 4.24$. The formula measures along the perpendicular you would construct with compass and straightedge.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Euclid’s fifth',
              prompt: r`Euclid's famous fifth postulate is equivalent to saying that through a point not on a line, there is **exactly one** parallel line. What happens on the surface of a sphere, where "lines" are great circles?`,
              choices: [
                { t: 'There are no parallels at all: any two great circles meet', ok: true },
                { t: 'There are infinitely many parallels', why: 'That happens in hyperbolic geometry. On a sphere, every pair of great circles crosses (twice).' },
                { t: 'Exactly one, as in the plane', why: 'Two meridians meet at the poles: great circles always cross.' },
              ],
              explain: r`On a sphere, any two great circles meet: there are **no** parallels. In hyperbolic geometry there are infinitely many. Mathematicians spent 2,000 years trying to prove the fifth postulate from the others, before realising in the 1800s that consistent geometries exist without it.`,
            },
          ],
          recap: [
            'Perpendicular from P: circle round P, then bisect the chord it cuts.',
            'Parallels: copy an angle (equal corresponding angles).',
            'Changing the parallel postulate gives spherical and hyperbolic geometry.',
          ],
        },
        {
          id: 'tangent',
          title: 'Tangents to a Circle',
          summary: 'Thales to the rescue',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Touching, not crossing',
              body: r`The tangent at a point $T$ of a circle is perpendicular to the radius $OT$. So constructing the tangent at a given point is easy: draw the perpendicular to $OT$ at $T$.

From a point $P$ **outside** the circle it's trickier: where does the tangent touch? We need a point $T$ on the circle with $\angle OTP = 90°$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the touching point',
              prompt: r`Drag $T$ around the circle until $PT$ is a tangent: the angle $\angle OTP$ must be $90°$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.5, xmax: 3.4, ymin: -1.5, ymax: 1.6, grid: false, axes: false, maxWidth: 520,
                params: { t: { min: 0, max: 359, step: 1, value: 120, slider: false } },
                points: [{ x: (p) => Math.cos(p.t * D), y: (p) => Math.sin(p.t * D), drag: { key: 't', fn: (x, y) => ({ t: ((Math.atan2(y, x) / D) % 360 + 360) % 360 }) }, color: 'coral', label: 'T', labelDx: 10, labelDy: -10 }],
                extra: ({ plot, p, s }) => {
                  const T = [Math.cos(p.t * D), Math.sin(p.t * D)], Pp = [3, 0], u = plot.X(1) - plot.X(0);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: u, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(1.5), cy: plot.Y(0), r: 1.5 * u, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(T[0]), y2: plot.Y(T[1]), stroke: 'var(--blue)', 'stroke-width': 2.5 }),
                    s('line', { x1: plot.X(Pp[0]), y1: plot.Y(0), x2: plot.X(T[0]), y2: plot.Y(T[1]), stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-ink' }), s('circle', { cx: plot.X(Pp[0]), cy: plot.Y(0), r: 6, class: 'fl-ink' }),
                    s('text', { x: plot.X(0) - 8, y: plot.Y(0) + 20, class: 'lbl', 'text-anchor': 'end', text: 'O' }), s('text', { x: plot.X(Pp[0]) + 8, y: plot.Y(0) + 20, class: 'lbl', text: 'P' }),
                  ];
                },
                readout: (p) => {
                  const T = [Math.cos(p.t * D), Math.sin(p.t * D)], u = [-T[0], -T[1]], v = [3 - T[0], -T[1]];
                  const ang = (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI;
                  return r`$\angle OTP = ${ang.toFixed(0)}°$`;
                },
                goal: (p) => { const T = [Math.cos(p.t * D), Math.sin(p.t * D)]; return Math.abs((-T[0]) * (3 - T[0]) + T[1] * T[1]) < 0.03; },
                hint: 'The dashed circle has OP as its diameter. By Thales, any point on it sees OP at a right angle.',
                solution: { t: 71 },
              },
              explain: r`The tangent point lies where the circle meets the dashed circle on diameter $OP$, since by **Thales** every point of that circle sees $OP$ at $90°$. So: bisect $OP$, draw the circle through $O$ and $P$ centred at the midpoint, and it cuts the original circle at the two tangent points.`,
            },
            {
              type: 'numeric',
              title: 'Where it touches',
              prompt: r`With radius 1 and $OP = 3$, the tangent point $T$ satisfies $\cos\angle TOP = \frac{OT}{OP}$. What is $\angle TOP$ in degrees? (Nearest degree.)`,
              unit: '°',
              answer: Math.round((Math.acos(1 / 3) * 180) / Math.PI),
              tol: 0.6,
              wrong: [{ v: 19, why: r`That's $\sin^{-1}\frac13$, the angle at $P$. The angle at $O$ is $\cos^{-1}\frac13$.` }],
              explain: r`$\cos\angle TOP = \frac13$, so $\angle TOP \approx 71°$, matching the interactive. The tangent length is $\sqrt{9 - 1} = 2\sqrt2 \approx 2.83$.`,
            },
            {
              type: 'numeric',
              title: 'Tangent length',
              prompt: r`A point is 17 cm from the centre of a circle of radius 8 cm. How long is a tangent from the point to the circle?`,
              unit: 'cm',
              answer: 15,
              wrong: [{ v: 9, why: 'Lengths don’t subtract like that. The radius meets the tangent at a right angle: use Pythagoras.' }, { v: Math.sqrt(353), tol: 0.01, why: r`The tangent is a leg, not the hypotenuse: $\sqrt{17^2 - 8^2}$.` }],
              explain: r`Radius ⟂ tangent, so the radius, tangent and line to the centre form a right triangle with hypotenuse 17: tangent $= \sqrt{289 - 64} = 15$ cm. An 8-15-17 triangle.`,
            },
            {
              type: 'numeric',
              title: 'Angle between tangents',
              prompt: r`From a point 10 cm from the centre of a circle of radius 5 cm, two tangents are drawn. What angle do they make with each other?`,
              unit: '°',
              answer: 60,
              explain: r`Each tangent makes a right angle with its radius, and $\sin(\text{half-angle}) = \frac{5}{10}$, so the half-angle is $30°$ and the tangents meet at **60°**.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Two tangents',
              prompt: r`How many tangents can be drawn from a point outside a circle, and how do their lengths compare?`,
              choices: [
                { t: 'Two, of equal length', ok: true },
                { t: 'One', why: 'The Thales circle meets the circle at two points, one on each side.' },
                { t: 'Two, of different lengths', why: r`By symmetry (or Pythagoras: both are $\sqrt{OP^2 - r^2}$), they're equal.` },
              ],
              explain: r`The construction gives two tangent points, mirror images across $OP$. Both tangents have length $\sqrt{OP^2 - r^2}$: the **two-tangent theorem** from the Circle Theorems course.`,
            },
          ],
          recap: [
            'A tangent is perpendicular to the radius at the touching point.',
            'From an external point P, use the circle on diameter OP (Thales) to find the touching points.',
            'There are two tangents from an external point, of equal length.',
          ],
        },
      ],
    },
    {
      title: 'Regular Polygons',
      summary: 'Which shapes can be built?',
      lessons: [
        {
          id: 'hexagon',
          title: 'Hexagons & Pentagons',
          summary: 'Stepping around a circle',
          icon: 'star',
          steps: [
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Walk the compass',
              prompt: r`Starting at the right-hand point, step a compass around the circle six times, each step marking a new point on the circle. Find the compass opening that makes the six steps close up into a regular hexagon.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 440, height: 320,
                params: { s: { min: 0.5, max: 1.5, step: 0.05, value: 0.8, label: 'compass opening', color: 'violet', format: (v) => `${v.toFixed(2)} × radius` } },
                extra: ({ plot, p, s }) => {
                  const th = 2 * Math.asin(p.s / 2), u = plot.X(1) - plot.X(0);
                  const pts = Array.from({ length: 7 }, (_, i) => [Math.cos(i * th), Math.sin(i * th)]);
                  const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: u, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(' '), fill: Math.abs(p.s - 1) < 0.001 ? 'var(--violet-soft)' : 'none', stroke: 'var(--violet)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                  pts.forEach(([x, y], i) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: i ? 6 : 8, class: i ? 'fl-violet' : 'fl-coral' })));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 4, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => {
                  const th = (2 * Math.asin(p.s / 2)) / D;
                  return r`each step turns $${th.toFixed(1)}°$; $\;$ six steps: $${(6 * th).toFixed(1)}°$`;
                },
                goal: (p) => Math.abs(p.s - 1) < 0.001,
                hint: 'Six steps must add up to exactly 360°, so each step must cover 60°.',
                solution: { s: 1 },
              },
              explain: r`The compass must be set to the circle's **radius**. Then each step makes an equilateral triangle with the centre, turning exactly $60°$, and $6 \times 60° = 360°$. Every other point gives an equilateral triangle; bisecting the arcs gives a 12-gon, then a 24-gon, and so on.`,
            },
            {
              type: 'mcq',
              title: 'More sides',
              prompt: r`Starting from a constructed regular hexagon, which other regular polygons can you construct just by bisecting arcs (repeatedly)?`,
              choices: [
                { t: '12-gon, 24-gon, 48-gon, …', ok: true },
                { t: '7-gon, 8-gon, 9-gon, …', why: 'Bisecting doubles the number of sides each time: 6 → 12 → 24 …' },
                { t: 'Only the hexagon', why: 'Bisecting each arc between neighbouring corners doubles the number of corners.' },
              ],
              explain: r`Each bisection doubles the sides: $6 \to 12 \to 24 \to 48 \to \dots$ Archimedes used polygons with 96 sides, made by doubling from a hexagon, to show that $3\tfrac{10}{71} < \pi < 3\tfrac17$.`,
            },
            {
              type: 'explain',
              title: 'The pentagon',
              body: r`The regular pentagon is harder, but the Greeks managed it too (Euclid, Book IV). The key is that the ratio of a regular pentagon's diagonal to its side is the **golden ratio**:
$$\varphi = \frac{1 + \sqrt5}{2}$$
And $\sqrt5$ is constructible: it's the diagonal of a $1 \times 2$ rectangle, by Pythagoras. So a compass and straightedge can produce the right proportions.`,
            },
            {
              type: 'numeric',
              title: 'The golden diagonal',
              prompt: r`A regular pentagon has sides of length 10 cm. How long is each diagonal? (1 decimal place.)`,
              unit: 'cm',
              answer: 5 * (1 + Math.sqrt(5)),
              tol: 0.06,
              wrong: [{ v: 10, why: 'The diagonal is longer than the side, by the golden ratio.' }, { v: 6.2, tol: 0.06, why: r`That's $10 / \varphi$. The diagonal is **longer** than the side: multiply by $\varphi \approx 1.618$.` }],
              explain: r`$10 \times \frac{1 + \sqrt5}{2} \approx 16.2$ cm. Those five diagonals form a pentagram, which is full of golden ratios.`,
            },
            {
              type: 'numeric',
              title: 'Perimeter of a hexagon',
              prompt: r`A regular hexagon is inscribed in a circle of radius 7 cm. What is its perimeter?`,
              unit: 'cm',
              answer: 42,
              explain: r`Its side equals the radius (it splits into six equilateral triangles), so the perimeter is $6 \times 7 = 42$ cm, a little less than the circumference $14\pi \approx 44$: Archimedes’ first estimate, $\pi > 3$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Archimedes’ first step',
              prompt: r`A regular hexagon inscribed in a circle of radius 1 has perimeter 6, and the circle's circumference ($2\pi$) is longer than any inscribed polygon. What lower bound for $\pi$ does the hexagon give?`,
              lhs: r`$\pi >$`,
              answer: 3,
              wrong: [{ v: 6, why: r`The circumference is $2\pi$, so $2\pi > 6$ means $\pi > 3$.` }],
              explain: r`$2\pi > 6$, so $\pi > 3$. Doubling to 12, 24, 48 and 96 sides, Archimedes squeezed $\pi$ between $3.1408$ and $3.1429$, using nothing but the square roots that compass constructions produce.`,
            },
          ],
          recap: [
            'Stepping the radius around a circle six times gives a regular hexagon.',
            'Bisecting arcs doubles the number of sides.',
            r`The pentagon is constructible because its diagonal-to-side ratio $\frac{1+\sqrt5}{2}$ uses only a square root.`,
          ],
        },
        {
          id: 'squares',
          title: 'Squares & Octagons',
          summary: 'Doubling from four',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'A square in a circle',
              body: r`Draw a diameter $AB$ of a circle, then construct its perpendicular bisector, meeting the circle at $C$ and $D$. Join $A$, $C$, $B$, $D$: a **square**. Its diagonals are two perpendicular diameters, equal in length and bisecting each other at right angles, which only a square's diagonals do.`,
            },
            {
              type: 'numeric',
              title: 'Side of the square',
              prompt: r`A square is inscribed in a circle of radius 10 cm. How long is each side? (1 decimal place.)`,
              unit: 'cm',
              answer: 10 * Math.SQRT2,
              tol: 0.06,
              wrong: [{ v: 20, why: 'That’s the diameter, the square’s diagonal. The side is diagonal ÷ √2.' }, { v: 10, why: r`Each side joins the ends of two perpendicular radii: $\sqrt{10^2 + 10^2}$.` }],
              explain: r`Each side is the hypotenuse of a right triangle with two radii as legs: $\sqrt{100 + 100} = 10\sqrt2 \approx 14.1$ cm.`,
            },
            {
              type: 'mcq',
              title: 'From square to octagon',
              prompt: r`How do you turn the inscribed square into a regular octagon?`,
              choices: [
                { t: 'Bisect each right angle at the centre and mark where the bisectors meet the circle', ok: true },
                { t: 'Cut off the corners of the square by eye', why: 'Measuring by eye isn’t allowed. Bisecting the central angles does it exactly.' },
                { t: 'It can’t be done', why: '8 is a power of 2, so it’s constructible: bisect the 90° angles into 45°.' },
              ],
              explain: r`Bisecting the four $90°$ angles between the diameters gives eight $45°$ angles: a regular **octagon**. Keep bisecting for 16, 32, 64 sides. All powers of 2 are constructible.`,
            },
            {
              type: 'numeric',
              title: 'Side of the octagon',
              prompt: r`Bisecting the arcs of the square gives a regular octagon in the same circle of radius 1. Each side spans a $45°$ arc and has length $2\sin 22.5°$. How long is a side? (3 decimal places.)`,
              answer: 2 * Math.sin((22.5 * Math.PI) / 180),
              tol: 0.002,
              wrong: [{ v: Math.SQRT2, tol: 0.002, why: 'That’s the square’s side. The octagon’s sides are shorter.' }],
              explain: r`$2\sin 22.5° = \sqrt{2 - \sqrt2} \approx 0.765$: a nested square root, so constructible, as every doubling must be. The perimeter $8 \times 0.765 = 6.12$ gives $\pi > 3.06$.`,
            },
            {
              type: 'interactive',
              title: 'Doubling towards π',
              body: r`Keep doubling the sides of the inscribed polygon, starting from a square in a circle of radius 1. Half the perimeter creeps up toward $\pi$. How many sides do you need for half the perimeter to reach **3.14**?`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 380,
                params: { k: { min: 0, max: 6, step: 1, value: 1, label: 'doublings', color: 'violet', format: (v) => `${4 * 2 ** v} sides` } },
                curves: [{ param: { x: (t) => Math.cos(t), y: (t) => Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'muted', width: 1.5 }],
                extra: ({ plot, p, s }) => { const n = 4 * 2 ** p.k, pts = Array.from({ length: n + 1 }, (_, i) => [Math.cos((2 * Math.PI * i) / n + Math.PI / 4), Math.sin((2 * Math.PI * i) / n + Math.PI / 4)]); return [s('path', { d: 'M' + pts.map(([x, y]) => `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('L'), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 })]; },
                readout: (p) => { const n = 4 * 2 ** p.k; return `${n} sides: half the perimeter = **${(n * Math.sin(Math.PI / n)).toFixed(5)}**`; },
                goal: (p) => 4 * 2 ** p.k * Math.sin(Math.PI / (4 * 2 ** p.k)) >= 3.14 && p.k === 4,
                hint: 'Each doubling roughly quarters the remaining gap to π.',
                solution: { k: 4 },
              },
              explain: r`At **64 sides** half the perimeter reaches $3.1403$ (32 sides gives only $3.1365$). Each doubling needs only a square root, so compass and straightedge can push this as far as patience allows, which is how Archimedes squeezed $\pi$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Combining polygons',
              prompt: r`You can construct a regular triangle (central angle $120°$) and pentagon ($72°$). The difference $120° - 72° = 48°$, and halving gives $24°$. Since $24° = 360° \div n$, which regular $n$-gon does this construct?`,
              lhs: r`$n =$`,
              answer: 15,
              wrong: [{ v: 24, why: r`$360 \div 24 = 15$.` }],
              explain: r`$360 \div 24 = 15$: the regular 15-gon (Euclid, Book IV, Proposition 16). Combining constructible angles and bisecting them is how the Greeks reached 3, 4, 5, 6, 8, 10, 12, 15, 16, … sides.`,
            },
          ],
          recap: [
            'Two perpendicular diameters give an inscribed square, with side r√2.',
            'Bisecting central angles doubles the number of sides.',
            'Differences of constructible angles give new polygons, like the 15-gon.',
          ],
        },
        {
          id: 'gauss',
          title: 'Gauss’s 17-gon',
          summary: 'A teenager’s discovery',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: '2,000 years of silence',
              body: r`The Greeks could construct regular polygons with 3, 4, 5 and 15 sides, and double any of them. For 2,000 years, nobody found another. Then, in 1796, an 18-year-old student named **Carl Friedrich Gauss** showed that the regular **17-gon** is constructible. He was so pleased that it helped convince him to become a mathematician rather than a linguist.

Gauss found that a regular $n$-gon can be constructed when $n$ is a power of 2 times a product of **distinct Fermat primes**: primes of the form $2^{2^k} + 1$. The known Fermat primes are
$$3, \; 5, \; 17, \; 257, \; 65537.$$
In 1837, Pierre Wantzel proved that no other regular polygons are constructible.`,
            },
            {
              type: 'multi',
              title: 'Which can be built?',
              prompt: r`Which of these regular polygons can be constructed with compass and straightedge? Select all that apply.`,
              choices: [
                { t: '15-gon', ok: true },
                { t: '20-gon', ok: true },
                { t: '7-gon (heptagon)', why: '7 is prime but not a Fermat prime (7 − 1 = 6 isn’t a power of 2).' },
                { t: '9-gon', why: r`$9 = 3 \times 3$: the Fermat primes must be **distinct**. The 9-gon is not constructible.` },
                { t: '17-gon', ok: true },
              ],
              explain: r`$15 = 3 \times 5$ ✓, $20 = 4 \times 5$ ✓, $17$ is a Fermat prime ✓. The heptagon fails because 7 isn't a Fermat prime, and the 9-gon fails because 3 is repeated. (Constructing a 9-gon would be the same as trisecting a $60°$ angle, which we'll see is impossible.)`,
            },
            {
              type: 'numeric',
              title: 'Counting polygons',
              prompt: r`How many of the regular polygons with 3 to 20 sides are constructible with compass and straightedge?`,
              unit: 'polygons',
              answer: 11,
              wrong: [{ v: 7, why: 'Don’t forget the doubled ones: 6, 8, 10, 12, 16 and 20 (and 4).' }, { v: 12, why: '9 and 18 don’t count: 3 would be repeated.' }],
              hint: r`Check each $n$: is it a power of 2 times distinct Fermat primes (3, 5, 17)?`,
              explain: r`3, 4, 5, 6, 8, 10, 12, 15, 16, 17 and 20: **11** of the 18. The misses are 7, 9, 11, 13, 14, 18 and 19.`,
            },
            {
              type: 'mcq',
              title: 'The 51-gon',
              prompt: r`Is a regular polygon with 51 sides constructible with compass and straightedge?`,
              choices: [
                { t: r`Yes: 51 = 3 × 17, a product of distinct Fermat primes`, ok: true },
                { t: r`No: 51 is not prime`, why: r`It doesn’t need to be prime: products of **distinct** Fermat primes work.` },
                { t: r`No: 51 is odd`, why: r`Odd numbers are fine if they are products of distinct Fermat primes, like 15 = 3 × 5.` },
              ],
              explain: r`$51 = 3 \times 17$, both Fermat primes, used once each, so the 51-gon is constructible. The largest odd-sided constructible polygon known has $3 \times 5 \times 17 \times 257 \times 65537 = 2^{32} - 1 = 4{,}294{,}967{,}295$ sides.`,
            },
            {
              type: 'interactive',
              title: 'Which polygons can be built?',
              body: r`Slide through the regular polygons. The ones Gauss’s rule allows are coloured teal. Find the **largest odd** number of sides up to 30 that can be constructed.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 360,
                params: { n: { min: 3, max: 30, step: 1, value: 7, label: 'sides', color: 'violet' } },
                extra: ({ plot, p, s }) => { let m = p.n; while (m % 2 === 0) m /= 2; const fp = [3, 5, 17, 257, 65537]; for (const f of fp) if (m % f === 0) m /= f; const ok = m === 1; const pts = Array.from({ length: p.n + 1 }, (_, i) => [Math.cos((2 * Math.PI * i) / p.n + Math.PI / 2), Math.sin((2 * Math.PI * i) / p.n + Math.PI / 2)]); return [s('path', { d: 'M' + pts.map(([x, y]) => `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('L') + 'Z', class: ok ? 'fl-teal-soft' : 'fl-coral-soft', stroke: ok ? 'var(--teal)' : 'var(--coral)', 'stroke-width': 2.5 })]; },
                readout: (p) => { let m = p.n; while (m % 2 === 0) m /= 2; for (const f of [3, 5, 17]) if (m % f === 0) m /= f; return `${p.n}-gon: ${m === 1 ? '**constructible**' : 'not constructible'}`; },
                goal: (p) => p.n === 17,
                hint: 'Odd and constructible means a product of distinct Fermat primes: 3, 5, 15, 17, …',
                solution: { n: 17 },
              },
              explain: r`The odd constructible polygons up to 30 are 3, 5, 15 and **17**. (21 = 3 × 7 and 25 = 5 × 5 fail.) Gauss’s 17-gon was the first new one in 2,000 years.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A Fermat prime',
              prompt: r`Fermat primes have the form $2^{2^k} + 1$. Which Fermat prime comes from $k = 3$?`,
              answer: 257,
              wrong: [{ v: 9, why: r`That's $2^3 + 1$. The exponent is itself a power of 2: $2^{2^3} = 2^8$.` }, { v: 65537, why: r`That's $k = 4$: $2^{16} + 1$. For $k = 3$ you need $2^8 + 1$.` }],
              explain: r`$2^{2^3} + 1 = 2^8 + 1 = 257$. Pierre de Fermat guessed that all such numbers are prime, but Euler showed in 1732 that $k = 5$ gives $4{,}294{,}967{,}297 = 641 \times 6{,}700{,}417$. No Fermat prime beyond 65537 has ever been found. In 1894, Johann Hermes finished a construction of the regular 65537-gon after about ten years' work.`,
            },
          ],
          recap: [
            'Gauss (1796) showed the regular 17-gon is constructible.',
            'An n-gon is constructible exactly when n is a power of 2 times distinct Fermat primes.',
            'Known Fermat primes: 3, 5, 17, 257, 65537.',
          ],
        },
      ],
    },
    {
      title: 'The Impossible Three',
      summary: 'Problems that can never be solved.',
      lessons: [
        {
          id: 'numbers',
          title: 'Constructible Numbers',
          summary: 'Lengths built from square roots',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Arithmetic with a compass',
              body: r`Start with a segment of length 1. Which other lengths can you build? You can add and subtract lengths (lay them end to end), and with similar triangles you can multiply and divide. But compasses can do one more trick: **square roots**.

Lay lengths $a$ and $b$ end to end and draw a semicircle on the whole as diameter. The perpendicular at the join reaches the semicircle at a height of $\sqrt{ab}$.`,
              widget: {
                kind: 'figure', w: 520, h: 240, maxWidth: 480, label: 'Semicircle construction of a square root',
                draw: ({ s }) => {
                  const a = 4, b = 9, k = 28, x0 = 78, y0 = 200, R = ((a + b) * k) / 2, cx = x0 + R;
                  const xj = x0 + a * k, hgt = Math.sqrt(a * b) * k;
                  return [
                    s('path', { d: `M${x0} ${y0} A${R} ${R} 0 0 1 ${x0 + 2 * R} ${y0}`, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 2.5 }),
                    s('line', { x1: x0, y1: y0, x2: xj, y2: y0, stroke: 'var(--blue)', 'stroke-width': 5 }),
                    s('line', { x1: xj, y1: y0, x2: x0 + 2 * R, y2: y0, stroke: 'var(--coral)', 'stroke-width': 5 }),
                    s('line', { x1: xj, y1: y0, x2: xj, y2: y0 - hgt, stroke: 'var(--violet)', 'stroke-width': 4 }),
                    s('path', { d: `M${x0} ${y0} L${xj} ${y0 - hgt} L${x0 + 2 * R} ${y0}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('circle', { cx: cx, cy: y0, r: 4, class: 'fl-ink' }),
                    s('text', { x: (x0 + xj) / 2, y: y0 + 24, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--blue)', text: 'a' }),
                    s('text', { x: (xj + x0 + 2 * R) / 2, y: y0 + 24, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--coral)', text: 'b' }),
                    s('text', { x: xj + 10, y: y0 - hgt / 2, class: 'lbl', style: 'fill: var(--violet)', text: '√(ab)' }),
                  ];
                },
              },
              after: r`The angle in a semicircle is a right angle, and the two smaller right triangles are similar, so $\frac{h}{a} = \frac{b}{h}$, giving $h^2 = ab$. With $b = 1$, you get $\sqrt a$ for any length $a$.`,
            },
            {
              type: 'numeric',
              title: 'Build a root',
              prompt: r`In the construction above, $a = 4$ and $b = 9$. How tall is the violet segment?`,
              answer: 6,
              wrong: [{ v: 6.5, why: 'That’s the radius of the semicircle. The height at the join is √(ab).' }, { v: 36, why: 'That’s ab. The height is its square root.' }],
              explain: r`$\sqrt{4 \times 9} = \sqrt{36} = 6$. The construction computes geometric means.`,
            },
            {
              type: 'numeric',
              title: 'A root from a triangle',
              prompt: r`An equilateral triangle with side 2 has a height of $\sqrt{3}$, a constructible length. What is $\sqrt 3$ to 3 decimal places?`,
              answer: Math.sqrt(3),
              tol: 0.0006,
              wrong: [{ v: 1.5, tol: 0.001, why: r`Pythagoras: height $= \sqrt{2^2 - 1^2} = \sqrt3$.` }],
              explain: r`$\sqrt{2^2 - 1^2} = \sqrt3 \approx 1.732$. Pythagoras and the semicircle trick give square roots of any constructible length.`,
            },
            {
              type: 'explain',
              title: 'The big theorem',
              body: r`Lines are given by linear equations, and circles by quadratic ones. Intersecting them never needs anything worse than solving a quadratic, which needs at most a square root. So:

> Every constructible length can be built from 1 using $+$, $-$, $\times$, $\div$ and **square roots**, and nothing else.

That means a cube root of 2, which can't be written with square roots alone, is **not** constructible. In algebraic terms, a constructible number satisfies an irreducible polynomial whose degree is a power of 2, and $\sqrt[3]{2}$ needs degree 3.`,
            },
            {
              type: 'numeric',
              title: 'Building √5',
              prompt: r`Construct a right triangle with legs 1 and 2. How long is its hypotenuse? (3 decimal places.)`,
              answer: Math.sqrt(5),
              tol: 0.001,
              explain: r`$\sqrt{1 + 4} = \sqrt5 \approx 2.236$. Adding 1 and halving then gives the golden ratio $\frac{1 + \sqrt5}{2}$, which is how the regular pentagon is constructed.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which length can you build?',
              prompt: r`Starting from a segment of length 1, which of these lengths can be constructed with compass and straightedge?`,
              choices: [
                { t: r`$\sqrt{2 + \sqrt3}$`, ok: true },
                { t: r`$\sqrt[3]{2}$`, why: 'A cube root needs a cubic equation, which square roots can’t solve.' },
                { t: r`$\pi$`, why: r`$\pi$ isn't a root of any polynomial with whole-number coefficients, let alone one built from square roots.` },
              ],
              explain: r`$\sqrt3$ is constructible, so is $2 + \sqrt3$, and so is its square root: nested square roots are fine. (In fact $\sqrt{2 + \sqrt3} = 2\cos 15°$.) Cube roots and $\pi$ are out of reach.`,
            },
          ],
          recap: [
            'Compass and straightedge can add, subtract, multiply, divide and take square roots.',
            r`A semicircle on $a + b$ gives height $\sqrt{ab}$.`,
            'Nothing else is possible: cube roots like ∛2 are out of reach.',
          ],
        },
        {
          id: 'impossible',
          title: 'Three Famous Problems',
          summary: 'Doubling, trisecting and squaring',
          icon: 'cross',
          steps: [
            {
              type: 'explain',
              title: 'The three classical problems',
              body: r`The Greeks posed three problems they couldn't solve with compass and straightedge:

1. **Doubling the cube**: build a cube with twice the volume of a given one. (Legend says the oracle at Delos demanded an altar twice the size to end a plague.)
2. **Trisecting an angle**: divide any given angle into three equal parts.
3. **Squaring the circle**: build a square with the same area as a given circle.

They resisted all attempts for over 2,000 years. Algebra finally showed why: all three are **impossible**.`,
            },
            {
              type: 'numeric',
              title: 'The Delian problem',
              prompt: r`A cube has side 1. What side length must a cube of twice the volume have? (2 decimal places.)`,
              answer: Math.cbrt(2),
              tol: 0.006,
              wrong: [{ v: 2, why: 'Doubling the side multiplies the volume by 8.' }, { v: 1.41, tol: 0.006, why: r`$\sqrt2$ would double the **area** of a square. For volume you need $\sqrt[3]{2}$.` }],
              explain: r`$\sqrt[3]{2} \approx 1.26$. Since $\sqrt[3]{2}$ can't be built from square roots, Pierre Wantzel proved in 1837 that doubling the cube is impossible with compass and straightedge.`,
            },
            {
              type: 'mcq',
              title: 'But I can trisect 90°!',
              prompt: r`Wantzel also proved that trisecting an angle is impossible. Yet a $90°$ angle is easy to trisect: just construct a $30°$ angle (half of an equilateral triangle's $60°$). What's going on?`,
              choices: [
                { t: '"Impossible" means no method works for every angle; some special angles can still be trisected', ok: true },
                { t: 'Wantzel made a mistake', why: 'His proof is correct. It shows that some angles, like 60°, can’t be trisected.' },
                { t: 'The 30° construction must be wrong', why: 'It’s correct. 90° just happens to be one of the angles that can be trisected.' },
              ],
              explain: r`The theorem says there's no **general** method. For $60°$, trisecting means constructing $\cos 20°$, which satisfies the cubic $8x^3 - 6x - 1 = 0$ (from $\cos 3\theta = 4\cos^3\theta - 3\cos\theta$). That cubic can't be solved with square roots, so a $20°$ angle can't be constructed. Allow a ruler with two marks on it, or origami folds, and trisection becomes possible: Archimedes knew a marked-ruler method.`,
            },
            {
              type: 'mcq',
              title: 'Why not 60°?',
              prompt: r`Trisecting a $60°$ angle would construct a $20°$ angle, and so the length $\cos 20°$. Why is that impossible?`,
              choices: [
                { t: r`$\cos 20°$ is a root of the cubic $8x^3 - 6x - 1 = 0$, which can't be solved using square roots alone`, ok: true },
                { t: r`$20°$ is too small to draw`, why: 'Size isn’t the issue; plenty of small angles (like 3°) are constructible.' },
                { t: r`Because 20 isn't a whole number of degrees`, why: 'It is. The obstacle is algebraic: the cubic equation.' },
              ],
              explain: r`The triple-angle formula $\cos 3\theta = 4\cos^3\theta - 3\cos\theta$ with $3\theta = 60°$ gives $4c^3 - 3c = \frac12$, i.e. $8c^3 - 6c - 1 = 0$. This cubic has no rational roots, so its roots need cube roots: not constructible. (By contrast, $90°$ can be trisected, because $\cos 30° = \frac{\sqrt3}{2}$.)`,
            },
            {
              type: 'interactive',
              title: 'Doubling the altar',
              body: r`The Delian altar is a cube of edge 1. Find the edge of a cube with exactly **twice** its volume.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 3.4, ymin: -0.3, ymax: 2.1, grid: false, axes: false, maxWidth: 440,
                params: { a: { min: 1, max: 1.6, step: 0.001, value: 1.4, label: 'edge', color: 'coral', format: (v) => v.toFixed(3) } },
                extra: ({ plot, p, s }) => { const box = (x0, a, cls) => { const d = a * 0.4; return [s('path', { d: `M${plot.X(x0)} ${plot.Y(0)}h${plot.X(a) - plot.X(0)}v${plot.Y(a) - plot.Y(0)}h${plot.X(0) - plot.X(a)}Z`, class: cls, stroke: 'var(--ink-3)' }), s('path', { d: `M${plot.X(x0)} ${plot.Y(a)}l${plot.X(d) - plot.X(0)} ${plot.Y(d) - plot.Y(0)}h${plot.X(a) - plot.X(0)}l${plot.X(0) - plot.X(d)} ${plot.Y(0) - plot.Y(d)}Z`, class: cls, stroke: 'var(--ink-3)', opacity: 0.7 }), s('path', { d: `M${plot.X(x0 + a)} ${plot.Y(0)}l${plot.X(d) - plot.X(0)} ${plot.Y(d) - plot.Y(0)}v${plot.Y(a) - plot.Y(0)}l${plot.X(0) - plot.X(d)} ${plot.Y(0) - plot.Y(d)}Z`, class: cls, stroke: 'var(--ink-3)', opacity: 0.5 })]; }; return [...box(0, 1, 'fl-blue-soft'), ...box(1.6, p.a, Math.abs(p.a ** 3 - 2) < 0.005 ? 'fl-teal-soft' : 'fl-coral-soft')]; },
                readout: (p) => `edge ${p.a.toFixed(3)} · volume **${(p.a ** 3).toFixed(3)}**`,
                goal: (p) => Math.abs(p.a ** 3 - 2) < 0.005,
                hint: 'The edge is the cube root of 2.',
                solution: { a: 1.26 },
              },
              explain: r`The edge is $\sqrt[3]{2} \approx 1.260$. You can find it to any accuracy with a slider, but no finite compass-and-straightedge construction produces it exactly: a cube root needs a cubic equation, and those tools only solve quadratics.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Squaring the circle',
              prompt: r`A circle has radius 1. What side length must a square have to match its area? (2 decimal places.)`,
              answer: Math.sqrt(Math.PI),
              tol: 0.006,
              wrong: [{ v: Math.PI, tol: 0.006, why: r`That's the area. The side is its square root, $\sqrt\pi$.` }, { v: 2, why: 'A square of side 2 contains the circle. Its area is 4, more than π.' }],
              explain: r`$\sqrt\pi \approx 1.77$. In 1882, Ferdinand von Lindemann proved that $\pi$ is **transcendental**: it isn't the root of any polynomial with whole-number coefficients. So $\sqrt\pi$ certainly can't be built from square roots, and squaring the circle is impossible. Even today, "squaring the circle" means attempting the impossible.`,
            },
          ],
          recap: [
            r`Doubling the cube needs $\sqrt[3]{2}$: impossible (Wantzel, 1837).`,
            'General angle trisection is impossible, though some angles can be trisected.',
            r`Squaring the circle needs $\sqrt\pi$, and $\pi$ is transcendental (Lindemann, 1882).`,
          ],
        },
      ],
    },
  ],
};
