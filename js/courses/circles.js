const r = String.raw;
const D = Math.PI / 180;
const P = (deg) => [Math.cos(deg * D), Math.sin(deg * D)];
const angleAt = ([px, py], [ax, ay], [bx, by]) => {
  const u = [ax - px, ay - py], v = [bx - px, by - py];
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return Math.acos(Math.max(-1, Math.min(1, c))) / D;
};
const f0 = (v) => Math.round(v).toString();
const dragAngle = (key) => ({ fn: (x, y) => ({ [key]: ((Math.atan2(y, x) / D) % 360 + 360) % 360 }), key });
const BOX = { kind: 'graph', equal: true, xmin: -1.45, xmax: 1.45, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 440 };

// shared drawing helpers
const seg = (plot, s, [x1, y1], [x2, y2], color, w = 3, dash) => s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), stroke: `var(--${color})`, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-dasharray': dash || null });
const circle = (plot, s) => s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 });
const label = (plot, s, [x, y], text, k = 1.17) => s('text', { x: plot.X(x * k), y: plot.Y(y * k) + 6, 'text-anchor': 'middle', style: 'font-weight:700;font-size:22px', text });
const dotO = (plot, s) => s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-ink' });

export default {
  id: 'circles',
  subject: 'math',
  title: 'Circle Theorems',
  level: 'Intermediate',
  cover: 'circles',
  tagline: 'Inscribed angles, Thales, cyclic quadrilaterals, tangents, sectors and the power of a point.',
  description: r`Circles hide beautiful angle facts. Drag points around a circle and watch angles stay mysteriously constant, discover why every angle in a semicircle is a right angle, use tangents and chords to solve geometry puzzles, measure arcs and sectors, and discover the power of a point, which tells you how far away the horizon is.`,
  prereq: 'Geometry: Visual Proofs',
  chapters: [
    {
      title: 'Angles in Circles',
      summary: 'Inscribed and central angles.',
      lessons: [
        {
          id: 'inscribed',
          title: 'The Inscribed Angle',
          summary: 'Half the angle at the centre',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Drag around the circle',
              body: r`Points $A$ and $B$ sit on a circle with centre $O$. The point $P$ is also on the circle. Drag $P$ (and $A$ and $B$) and compare the **inscribed angle** $\angle APB$ with the **central angle** $\angle AOB$.`,
              widget: {
                ...BOX,
                params: { a: { min: 0, max: 359, step: 1, value: 210, slider: false }, b: { min: 0, max: 359, step: 1, value: 330, slider: false }, p: { min: 0, max: 359, step: 1, value: 100, slider: false } },
                extra: ({ plot, p, s }) => {
                  const A = P(p.a), B = P(p.b), Q = P(p.p);
                  return [circle(plot, s), seg(plot, s, [0, 0], A, 'blue', 2.5), seg(plot, s, [0, 0], B, 'blue', 2.5), seg(plot, s, Q, A, 'coral', 3), seg(plot, s, Q, B, 'coral', 3), dotO(plot, s), label(plot, s, A, 'A'), label(plot, s, B, 'B'), label(plot, s, Q, 'P'), s('text', { x: plot.X(0) + 10, y: plot.Y(0) + 20, style: 'font-weight:700;font-size:max(calc(15px * var(--fs, 1)), var(--fmin, 0px))', text: 'O' })];
                },
                points: [
                  { x: (p) => P(p.a)[0], y: (p) => P(p.a)[1], drag: dragAngle('a'), color: 'blue', r: 8 },
                  { x: (p) => P(p.b)[0], y: (p) => P(p.b)[1], drag: dragAngle('b'), color: 'blue', r: 8 },
                  { x: (p) => P(p.p)[0], y: (p) => P(p.p)[1], drag: dragAngle('p'), color: 'coral' },
                ],
                readout: (p) => {
                  const A = P(p.a), B = P(p.b), Q = P(p.p);
                  return r`$\coral{\angle APB = ${f0(angleAt(Q, A, B))}°}$ $\quad$ $\blue{\angle AOB = ${f0(angleAt([0, 0], A, B))}°}$`;
                },
              },
              after: r`As long as $P$ stays on the same side (the same **arc**), $\angle APB$ doesn't change at all! And it's always **half** of the central angle $\angle AOB$ (when $P$ is on the major arc). This is the **inscribed angle theorem**.`,
            },
            {
              type: 'explain',
              title: 'Why it works',
              body: r`Draw the diameter through $P$ and $O$. The radii $OP$, $OA$ and $OB$ are equal, so triangles $OPA$ and $OPB$ are **isosceles**.

In triangle $OPA$, the two base angles are equal, say $x$. The exterior angle at $O$ equals the sum of the two opposite interior angles: $2x$. Similarly, the other triangle gives $2y$. So:
$$\angle AOB = 2x + 2y = 2(x + y) = 2\,\angle APB$$`,
            },
            {
              type: 'numeric',
              title: 'Use it',
              prompt: r`A central angle $\angle AOB$ is $110°$. What is the inscribed angle $\angle APB$, with $P$ on the major arc?`,
              unit: '°',
              answer: 55,
              wrong: [{ v: 220, why: 'The inscribed angle is half the central angle, not double.' }, { v: 110, why: r`The inscribed angle is **half** of the central one.` }, { v: 125, why: r`That's $180° - 55°$, the angle you'd get with $P$ on the **minor** arc.` }],
              explain: r`$\angle APB = \tfrac12 \times 110° = 55°$. (If $P$ were on the minor arc instead, the angle would be $180° - 55° = 125°$.)`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make it 40°',
              prompt: r`$A$ and $P$ are fixed. Drag $B$ along the circle until the inscribed angle $\angle APB$ is exactly $40°$.`,
              widget: {
                ...BOX,
                params: { b: { min: 0, max: 359, step: 1, value: 330, slider: false } },
                extra: ({ plot, p, s }) => {
                  const A = P(200), B = P(p.b), Q = P(100);
                  return [circle(plot, s), seg(plot, s, [0, 0], A, 'blue', 2, '5 5'), seg(plot, s, [0, 0], B, 'blue', 2, '5 5'), seg(plot, s, Q, A, 'coral', 3), seg(plot, s, Q, B, 'coral', 3), dotO(plot, s), label(plot, s, A, 'A'), label(plot, s, B, 'B'), label(plot, s, Q, 'P')];
                },
                points: [{ x: (p) => P(p.b)[0], y: (p) => P(p.b)[1], drag: dragAngle('b'), color: 'blue' }],
                readout: (p) => r`$\angle APB = ${f0(angleAt(P(100), P(200), P(p.b)))}°$, $\;\angle AOB = ${f0(angleAt([0, 0], P(200), P(p.b)))}°$`,
                goal: (p) => Math.abs(angleAt(P(100), P(200), P(p.b)) - 40) < 0.6,
                hint: 'The inscribed angle is half the central angle, so you need a central angle of 80°.',
                solution: { b: 280 },
              },
              explain: r`You need $\angle AOB = 80°$: $B$ is $80°$ round the circle from $A$. Wherever $P$ sits on the major arc, the inscribed angle is then $40°$.`,
            },
            {
              type: 'numeric',
              title: 'Tangent and chord',
              prompt: r`A chord subtends $80°$ at the centre. The angle between the chord and the tangent at one of its ends equals the inscribed angle on the chord (the **alternate segment theorem**). How big is it?`,
              unit: '°',
              answer: 40,
              explain: r`The inscribed angle is half the central angle, $40°$, and the tangent–chord angle equals it. You can see it as an inscribed angle whose vertex has slid along the circle to the chord’s end.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The best seat',
              prompt: r`In a theatre, all seats on a certain circular arc through the two ends of the stage see the stage at exactly the same angle. Why?`,
              choices: [
                { t: 'They are all inscribed angles standing on the same chord (the stage), so they are equal', ok: true },
                { t: 'Because they’re the same distance from the stage', why: 'They aren’t: some are closer than others. It’s the inscribed angle theorem.' },
                { t: 'It’s a coincidence of the architecture', why: 'It’s guaranteed geometry: equal inscribed angles on the same arc.' },
              ],
              explain: r`The two ends of the stage are $A$ and $B$; every seat on the arc is a point $P$, and $\angle APB$ is the same for all of them. Footballers use the same idea: points from which the goal looks equally wide lie on circles through the two posts.`,
            },
          ],
          recap: [
            'The inscribed angle is half the central angle on the same arc.',
            'All inscribed angles on the same arc are equal.',
            'The proof uses isosceles triangles formed by radii.',
          ],
        },
        {
          id: 'thales',
          title: 'Angles in a Semicircle',
          summary: 'Thales’ theorem',
          icon: 'sparkle',
          steps: [
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Across the diameter',
              prompt: r`$AB$ is a **diameter**. Drag $P$ anywhere on the circle. What is $\angle APB$? Move $P$ to the top of the circle, to check that the triangle there is isosceles too.`,
              widget: {
                ...BOX,
                params: { p: { min: 0, max: 359, step: 1, value: 130, slider: false } },
                extra: ({ plot, p, s }) => {
                  const A = [-1, 0], B = [1, 0], Q = P(p.p);
                  if (p.p % 180 === 0) return [circle(plot, s), seg(plot, s, A, B, 'blue', 3), dotO(plot, s), label(plot, s, A, 'A', 1.12), label(plot, s, B, 'B', 1.12)];
                  const u = [A[0] - Q[0], A[1] - Q[1]], v = [B[0] - Q[0], B[1] - Q[1]];
                  const nu = Math.hypot(...u), nv = Math.hypot(...v), k = 0.13;
                  const c1 = [Q[0] + (u[0] / nu) * k, Q[1] + (u[1] / nu) * k], c2 = [Q[0] + (v[0] / nv) * k, Q[1] + (v[1] / nv) * k], c3 = [c1[0] + (v[0] / nv) * k, c1[1] + (v[1] / nv) * k];
                  return [circle(plot, s), seg(plot, s, A, B, 'blue', 3), seg(plot, s, Q, A, 'coral', 3), seg(plot, s, Q, B, 'coral', 3), s('path', { d: `M${plot.X(c1[0])} ${plot.Y(c1[1])} L${plot.X(c3[0])} ${plot.Y(c3[1])} L${plot.X(c2[0])} ${plot.Y(c2[1])}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }), dotO(plot, s), label(plot, s, A, 'A', 1.12), label(plot, s, B, 'B', 1.12), label(plot, s, Q, 'P')];
                },
                points: [{ x: (p) => P(p.p)[0], y: (p) => P(p.p)[1], drag: dragAngle('p'), color: 'coral' }],
                readout: (p) => {
                  const Q = P(p.p);
                  return p.p % 180 === 0 ? r`$P$ is on $A$ or $B$: there's no triangle` : r`$\angle APB = ${f0(angleAt(Q, [-1, 0], [1, 0]))}°$, $\;PA = ${(Math.hypot(Q[0] + 1, Q[1])).toFixed(2)}$, $\;PB = ${(Math.hypot(Q[0] - 1, Q[1])).toFixed(2)}$`;
                },
                goal: (p) => p.p === 90 || p.p === 270,
                hint: 'Put P at the very top (or bottom) of the circle.',
                solution: { p: 90 },
              },
              explain: r`Every angle in a semicircle is a **right angle**. It's the inscribed angle theorem with a central angle of $180°$: half of that is $90°$. This is **Thales' theorem**, one of the oldest results in geometry, credited to Thales of Miletus around 600 BC. At the top, $PA = PB$ and the triangle is a right isosceles triangle.`,
            },
            {
              type: 'numeric',
              title: 'Triangle in a semicircle',
              prompt: r`A triangle is drawn with one side as a diameter of a circle and its third corner on the circle. Its other two sides are 6 cm and 8 cm. What is the circle's radius?`,
              unit: 'cm',
              answer: 5,
              wrong: [{ v: 10, why: 'That’s the diameter (the hypotenuse). The radius is half.' }, { v: 7, why: 'The triangle is right-angled: use Pythagoras for the diameter.' }],
              explain: r`By Thales, the angle opposite the diameter is $90°$, so the diameter is the hypotenuse: $\sqrt{36 + 64} = 10$ cm, and the radius is 5 cm.`,
            },
            {
              type: 'interactive',
              title: 'Right angles everywhere',
              body: r`Now $P$ can go anywhere, not just on the circle. Find a point $P$, well away from the line $AB$, where $\angle APB$ is exactly $90°$.`,
              widget: {
                ...BOX,
                params: { x: { min: -1.4, max: 1.4, step: 0.01, value: 0.3, slider: false }, y: { min: -1.25, max: 1.25, step: 0.01, value: 0.5, slider: false } },
                extra: ({ plot, p, s }) => { const A = [-1, 0], B = [1, 0], Q = [p.x, p.y]; return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }), seg(plot, s, A, B, 'blue', 3), seg(plot, s, Q, A, 'coral', 3), seg(plot, s, Q, B, 'coral', 3), label(plot, s, A, 'A', 1.12), label(plot, s, B, 'B', 1.12)]; },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral' }],
                readout: (p) => (Math.abs(p.y) < 0.02 ? 'P is on the line AB' : r`$\angle APB = ${angleAt([p.x, p.y], [-1, 0], [1, 0]).toFixed(1)}°$ · distance from the centre: ${Math.hypot(p.x, p.y).toFixed(2)}`),
                goal: (p) => Math.abs(angleAt([p.x, p.y], [-1, 0], [1, 0]) - 90) < 1 && Math.abs(p.y) > 0.3,
                hint: 'Inside the dashed circle the angle is bigger than 90°; outside, smaller.',
                solution: { x: 0.6, y: 0.8 },
              },
              explain: r`Every point where the angle is $90°$ lies on the dashed circle with diameter $AB$: the **converse** of Thales' theorem. Inside the circle the angle is **obtuse**, outside it's **acute**. The circle is the boundary.`,
            },
            {
              type: 'numeric',
              title: 'A rectangle in a circle',
              prompt: r`A 5 cm × 12 cm rectangle has all four corners on a circle. What is the circle's radius?`,
              unit: 'cm',
              answer: 6.5,
              tol: 0.01,
              wrong: [{ v: 13, why: 'That’s the diagonal, which is the diameter. Halve it.' }, { v: 8.5, why: 'Use Pythagoras on the diagonal: √(25 + 144).' }],
              explain: r`Each corner sees the opposite corners at a right angle, so by Thales each diagonal is a diameter: $\sqrt{5^2 + 12^2} = 13$ cm, giving radius $6.5$ cm.`,
            },
            {
              type: 'numeric',
              title: 'The circumcircle',
              prompt: r`A right triangle has legs of 7 cm and 24 cm. What is the radius of the circle through all three corners?`,
              unit: 'cm',
              answer: 12.5,
              tol: 0.01,
              wrong: [{ v: 25, why: 'That’s the hypotenuse, which is the diameter. The radius is half of it.' }],
              explain: r`The hypotenuse is $\sqrt{7^2 + 24^2} = 25$ cm. By Thales it is a diameter, so the radius is $12.5$ cm, and the midpoint of the hypotenuse is equally far from all three corners.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Find the centre',
              prompt: r`You have a circular table and a carpenter's set square (a right angle). How can you find the centre of the table?`,
              choices: [
                { t: 'Put the corner on the edge, mark where the two arms cross the rim (that’s a diameter), then repeat and see where the two diameters cross', ok: true },
                { t: 'Put the corner at the centre and look', why: 'You don’t know where the centre is yet!' },
                { t: 'It can’t be done with a set square alone', why: 'Thales’ theorem says the arms of a right angle with its corner on the circle meet the circle at the ends of a diameter.' },
              ],
              explain: r`By Thales (in reverse), a right angle with its corner on the circle has its arms ending at the two ends of a **diameter**. Draw two different diameters this way, and they cross at the centre.`,
            },
          ],
          recap: [
            'An angle inscribed in a semicircle is always 90° (Thales’ theorem).',
            'Conversely, a right angle on a circle subtends a diameter.',
            'This gives a practical way to find a circle’s centre.',
          ],
        },
      ],
    },
    {
      title: 'Quadrilaterals, Tangents and Chords',
      summary: 'More circle facts.',
      lessons: [
        {
          id: 'cyclic',
          title: 'Cyclic Quadrilaterals',
          summary: 'Opposite angles add to 180°',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Four points on a circle',
              body: r`A quadrilateral with all four corners on a circle is **cyclic**. Drag the corners and compare **opposite** angles.`,
              widget: {
                ...BOX,
                params: { a: { min: 0, max: 359, step: 1, value: 200, slider: false }, b: { min: 0, max: 359, step: 1, value: 290, slider: false }, c: { min: 0, max: 359, step: 1, value: 20, slider: false }, d: { min: 0, max: 359, step: 1, value: 120, slider: false } },
                extra: ({ plot, p, s }) => {
                  const pts = ['a', 'b', 'c', 'd'].map((k) => [p[k], k]).sort((x, y) => x[0] - y[0]).map(([deg, k]) => [P(deg), k]);
                  const d = pts.map(([[x, y]], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z';
                  return [circle(plot, s), s('path', { d, class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 3, 'stroke-linejoin': 'round' }), ...pts.map(([q, k]) => label(plot, s, q, k.toUpperCase()))];
                },
                points: ['a', 'b', 'c', 'd'].map((k) => ({ x: (p) => P(p[k])[0], y: (p) => P(p[k])[1], drag: dragAngle(k), color: 'violet', r: 8 })),
                readout: (p) => {
                  const pts = ['a', 'b', 'c', 'd'].map((k) => [p[k], k]).sort((x, y) => x[0] - y[0]);
                  if (new Set(pts.map((x) => x[0])).size < 4) return 'Spread the four points apart.';
                  const Q = pts.map(([deg]) => P(deg));
                  const ang = Q.map((q, i) => angleAt(q, Q[(i + 3) % 4], Q[(i + 1) % 4]));
                  const n = pts.map(([, k]) => k.toUpperCase());
                  return r`$\angle ${n[0]} + \angle ${n[2]} = ${f0(ang[0])}° + ${f0(ang[2])}° = ${f0(ang[0] + ang[2])}°$ $\quad$ $\angle ${n[1]} + \angle ${n[3]} = ${f0(ang[1] + ang[3])}°$`;
                },
              },
              after: r`Opposite angles always add up to $180°$. Why? Each one is an inscribed angle, and between them they stand on the **whole** circle: their central angles add up to $360°$, so the inscribed angles add up to half of that, $180°$.`,
            },
            {
              type: 'numeric',
              title: 'Find the angle',
              prompt: r`In a cyclic quadrilateral $ABCD$, $\angle A = 75°$. What is $\angle C$?`,
              unit: '°',
              answer: 105,
              wrong: [{ v: 75, why: 'Opposite angles aren’t equal; they add up to 180°.' }, { v: 285, why: r`The angles add to $180°$, not $360°$.` }],
              explain: r`$\angle C = 180° - 75° = 105°$.`,
            },
            {
              type: 'numeric',
              title: 'An exterior angle',
              prompt: r`In cyclic quadrilateral $ABCD$, side $DC$ is extended beyond $C$. If $\angle A = 70°$, what is the exterior angle at $C$?`,
              unit: '°',
              answer: 70,
              wrong: [{ v: 110, why: r`That's the interior angle at $C$. The exterior angle is $180° - 110°$.` }],
              explain: r`Interior $\angle C = 180° - 70° = 110°$, so the exterior angle is $180° - 110° = 70°$: an exterior angle of a cyclic quadrilateral **equals the interior opposite angle**.`,
            },
            {
              type: 'numeric',
              title: 'Same arc, same angle',
              prompt: r`Points $A, B, C, D$ lie on a circle, with $C$ and $D$ on the same side of chord $AB$. If $\angle ADB = 35°$, what is $\angle ACB$?`,
              unit: '°',
              answer: 35,
              wrong: [{ v: 145, why: r`That would be for a point on the **other** side of the chord (opposite angles of a cyclic quadrilateral).` }],
              explain: r`Both angles stand on the same arc $AB$, so both are half of the central angle: $\angle ACB = 35°$ too. Angles in the same segment are equal, which is how surveyors once located positions from angles alone.`,
            },
            {
              type: 'numeric',
              title: 'Ptolemy’s theorem',
              prompt: r`For any cyclic quadrilateral $ABCD$, Ptolemy’s theorem says $AC \cdot BD = AB \cdot CD + BC \cdot DA$. For a 3 × 4 rectangle (which is cyclic), what is $AC \cdot BD$?`,
              answer: 25,
              explain: r`$AB \cdot CD + BC \cdot DA = 3 \times 3 + 4 \times 4 = 25$, and indeed both diagonals are 5. For a rectangle, Ptolemy’s theorem is exactly Pythagoras’ theorem.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which shapes are cyclic?',
              prompt: r`Which of these can **always** be drawn with all four corners on a circle?`,
              choices: [
                { t: 'Any rectangle', ok: true },
                { t: 'Any rhombus', why: r`A non-square rhombus has opposite angles like $60°$ and $60°$, which add to $120°$, not $180°$.` },
                { t: 'Any parallelogram', why: 'Opposite angles of a parallelogram are equal, so they add to 180° only if both are 90°.' },
              ],
              explain: r`A rectangle's opposite angles are $90° + 90° = 180°$ ✓. And the converse of the theorem holds too: any quadrilateral whose opposite angles add to $180°$ is cyclic. So rectangles always are. (The circle's centre is where the diagonals cross.)`,
            },
          ],
          recap: [
            'A cyclic quadrilateral has all four vertices on one circle.',
            'Its opposite angles add up to 180°, and conversely.',
            'Rectangles are always cyclic. Non-square rhombuses never are.',
          ],
        },
        {
          id: 'tangents',
          title: 'Tangents & Chords',
          summary: 'Right angles and products',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Tangents',
              body: r`A **tangent** touches a circle at exactly one point. Two key facts:
- A tangent is **perpendicular** to the radius at the point where it touches.
- From a point outside the circle, the two tangents to the circle have **equal lengths**.

Together with Pythagoras, these solve many problems.`,
            },
            {
              type: 'numeric',
              title: 'Tangent length',
              prompt: r`A point is 13 cm from the centre of a circle of radius 5 cm. How long is a tangent from the point to the circle?`,
              unit: 'cm',
              answer: 12,
              wrong: [{ v: 8, why: r`The tangent, radius and distance form a right triangle: use Pythagoras, $\sqrt{13^2 - 5^2}$.` }, { v: 13.9, tol: 0.1, why: r`The distance to the centre (13) is the **hypotenuse**: subtract, $\sqrt{169 - 25}$.` }],
              explain: r`The radius meets the tangent at $90°$, so $13^2 = 5^2 + t^2$ and $t = \sqrt{169 - 25} = \sqrt{144} = 12$ cm.`,
            },
            {
              type: 'explain',
              title: 'Crossing chords',
              body: r`When two chords $AB$ and $CD$ cross at a point $E$ inside a circle:
$$AE \times EB = CE \times ED$$
The triangles $AEC$ and $DEB$ are **similar** (their angles match, by the inscribed angle theorem), and similar triangles give this equality of products.`,
            },
            {
              type: 'numeric',
              title: 'Belt around two tangents',
              prompt: r`From an external point $P$, two tangents touch a circle at $A$ and $B$. A third tangent touches the circle at $C$ (between them) and meets $PA$ at $X$ and $PB$ at $Y$. If $PA = 10$ cm, what is the perimeter of triangle $PXY$?`,
              unit: 'cm',
              answer: 20,
              wrong: [{ v: 10, why: r`Use equal tangents: $XA = XC$ and $YB = YC$, so the perimeter equals $PA + PB$.` }],
              explain: r`$XY = XC + CY = XA + YB$, so the perimeter is $PX + XA + PY + YB = PA + PB = 10 + 10 = 20$ cm, wherever the third tangent touches!`,
            },
            {
              type: 'interactive',
              title: 'Tangent of length 4',
              body: r`Drag the point $P$ outside a circle of radius 3. Find a position where the tangent from $P$ has length exactly **4**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 8, ymin: -4, ymax: 4, grid: false, axes: false, maxWidth: 520,
                params: { d: { min: 3.2, max: 7.5, step: 0.05, value: 7, slider: false } },
                extra: ({ plot, p, s }) => { const r = 3, t = Math.sqrt(p.d * p.d - r * r), ang = Math.acos(r / p.d), T = [r * Math.cos(ang), r * Math.sin(ang)]; return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(3) - plot.X(0), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }), s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(T[0]), y2: plot.Y(T[1]), stroke: 'var(--blue)', 'stroke-width': 2 }), s('line', { x1: plot.X(p.d), y1: plot.Y(0), x2: plot.X(T[0]), y2: plot.Y(T[1]), stroke: 'var(--coral)', 'stroke-width': 3 }), s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(p.d), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 4, class: 'fl-ink' })]; },
                points: [{ x: (p) => p.d, y: () => 0, drag: { x: 'd' }, color: 'violet' }],
                readout: (p) => `distance to centre ${p.d.toFixed(2)} · tangent length **${Math.sqrt(p.d * p.d - 9).toFixed(2)}**`,
                goal: (p) => Math.abs(Math.sqrt(p.d * p.d - 9) - 4) < 0.03,
                hint: 'The radius meets the tangent at a right angle.',
                solution: { d: 5 },
              },
              explain: r`At distance 5 from the centre: the radius (3), tangent (4) and line to the centre (5) form a 3-4-5 right triangle. The tangent length squared is always $d^2 - r^2$, the **power** of the point.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Intersecting chords',
              prompt: r`Two chords cross. One is split into pieces of 4 cm and 6 cm. The other has one piece of 3 cm. How long is its other piece?`,
              unit: 'cm',
              answer: 8,
              wrong: [{ v: 7, why: r`Products, not sums, are equal: $4 \times 6 = 3 \times x$.` }, { v: 4.5, why: r`Set up $4 \times 6 = 3 \times x$, so $x = 24/3$.` }],
              explain: r`$4 \times 6 = 3 \times x$, so $x = 8$ cm. This relationship (the **power of a point**) is a powerful tool for solving geometry problems.`,
            },
          ],
          recap: [
            'A tangent is perpendicular to the radius at the point of contact.',
            'The two tangents from an external point are equal in length.',
            r`Crossing chords: $AE \times EB = CE \times ED$.`,
          ],
        },
        {
          id: 'arcs',
          title: 'Arcs & Sectors',
          summary: 'Slices of a circle',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Fractions of a circle',
              body: r`A **sector** is a pizza-slice region between two radii; its curved edge is an **arc**. If the angle at the centre is $\theta$ degrees, the sector is the fraction $\frac{\theta}{360}$ of the whole circle:
$$\text{arc length} = \frac{\theta}{360} \times 2\pi r, \qquad \text{sector area} = \frac{\theta}{360} \times \pi r^2$$
In radians it's even simpler: arc $= r\theta$ and area $= \tfrac12 r^2 \theta$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Cut a slice',
              prompt: r`A pizza has radius 10 cm. Choose the angle of a slice whose area is exactly $25\pi \approx 78.5\ \text{cm}^2$.`,
              widget: {
                ...BOX,
                params: { th: { min: 10, max: 180, step: 5, value: 60, label: 'slice angle', color: 'amber', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const u = plot.X(1) - plot.X(0), a = (p.th * Math.PI) / 180;
                  return [circle(plot, s), s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(1)} ${plot.Y(0)} A${u} ${u} 0 ${p.th > 180 ? 1 : 0} 0 ${plot.X(Math.cos(a))} ${plot.Y(Math.sin(a))} Z`, class: 'fl-amber', opacity: 0.8, stroke: 'var(--ink)', 'stroke-width': 2 })];
                },
                readout: (p) => r`area $= \frac{${p.th}}{360} \times \pi \times 10^2 = ${((p.th / 360) * Math.PI * 100).toFixed(1)}\ \text{cm}^2$`,
                goal: (p) => p.th === 90,
                hint: r`The whole pizza is $100\pi$. You want a quarter of it.`,
                solution: { th: 90 },
              },
              explain: r`$25\pi$ is a quarter of $100\pi$, so the slice angle is $\frac14 \times 360° = 90°$.`,
            },
            {
              type: 'numeric',
              title: 'Arc length',
              prompt: r`A clock's minute hand is 12 cm long. How far does its tip travel in 20 minutes? (1 decimal place.)`,
              unit: 'cm',
              answer: (1 / 3) * 2 * Math.PI * 12,
              tol: 0.06,
              wrong: [{ v: 2 * Math.PI * 12, tol: 0.1, why: 'That’s a full hour. 20 minutes is a third of a turn.' }, { v: 240, why: 'Use arc length: a third of the circumference.' }],
              explain: r`20 minutes is $\frac13$ of a turn ($120°$): $\frac13 \times 2\pi \times 12 = 8\pi \approx 25.1$ cm.`,
            },
            {
              type: 'numeric',
              title: 'A slice of pizza',
              prompt: r`A pizza has radius 10 cm. One slice is a sector with angle $72°$ (a fifth of the pizza). What is its area? (1 decimal place, in cm².)`,
              unit: 'cm²',
              answer: 0.5 * 100 * 72 * Math.PI / 180,
              tol: 0.06,
              wrong: [{ v: 314.2, tol: 0.1, why: r`That’s the whole pizza. Take a fifth.` }],
              explain: r`Sector area $= \frac{72}{360} \times \pi \times 10^2 = 20\pi \approx 62.8$ cm². In radians it’s $\frac12 r^2\theta$, the same idea that gives arc length $r\theta$.`,
            },
            {
              type: 'numeric',
              title: 'Radians',
              prompt: r`An arc of length 5 cm lies on a circle of radius 2 cm. What angle does it subtend, in **radians**?`,
              answer: 2.5,
              tol: 0.001,
              explain: r`In radians, angle $= \frac{\text{arc}}{\text{radius}} = \frac52 = 2.5$, about $143°$. Radians measure angles by arc length, which is why $s = r\theta$ needs no conversion factor.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Staggered starts',
              prompt: r`On a running track, each lane is 1.22 m wider in radius than the one inside it. In a 400 m race, runners go round two semicircular bends (one full circle in total). How much farther does a runner one lane out travel if both start at the same line? (2 decimal places.)`,
              unit: 'm',
              answer: 2 * Math.PI * 1.22,
              tol: 0.01,
              wrong: [{ v: 1.22, why: 'The extra radius adds 2π × 1.22 to a full circle’s length.' }, { v: Math.PI * 1.22, tol: 0.01, why: 'That’s one bend. A 400 m race has two bends: a full circle.' }],
              explain: r`Circumference grows by $2\pi \times \Delta r = 2\pi \times 1.22 \approx 7.67$ m per lane, regardless of the track's size. That's why outer lanes start about 7.67 m further ahead.`,
            },
          ],
          recap: [
            r`Arc length $= \frac{\theta}{360} \times 2\pi r$; sector area $= \frac{\theta}{360} \times \pi r^2$.`,
            r`In radians: arc $= r\theta$, area $= \frac12 r^2\theta$.`,
            r`Adding $\Delta r$ to a circle's radius adds $2\pi\,\Delta r$ to its circumference.`,
          ],
        },
        {
          id: 'power',
          title: 'Power of a Point',
          summary: 'A product that never changes',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Secants from a point',
              body: r`From a point $P$ outside the circle, draw a line that cuts the circle at $A$ and $B$ (a **secant**). Rotate the line and watch the product $PA \times PB$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 3.2, ymin: -1.5, ymax: 1.5, grid: false, axes: false, maxWidth: 520,
                params: { a: { min: -25, max: 25, step: 1, value: 10, label: 'line angle', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const Pp = [2.5, 0], ang = Math.PI + (p.a * Math.PI) / 180, dx = Math.cos(ang), dy = Math.sin(ang);
                  // solve |Pp + t d| = 1
                  const b = 2 * (Pp[0] * dx + Pp[1] * dy), c = Pp[0] ** 2 + Pp[1] ** 2 - 1, disc = b * b - 4 * c;
                  const els = [circle(plot, s), dotO(plot, s)];
                  if (disc > 0) {
                    const t1 = (-b - Math.sqrt(disc)) / 2, t2 = (-b + Math.sqrt(disc)) / 2;
                    const A = [Pp[0] + t1 * dx, Pp[1] + t1 * dy], B = [Pp[0] + t2 * dx, Pp[1] + t2 * dy];
                    els.push(seg(plot, s, Pp, B, 'violet', 3), s('circle', { cx: plot.X(A[0]), cy: plot.Y(A[1]), r: 6, class: 'fl-coral' }), s('circle', { cx: plot.X(B[0]), cy: plot.Y(B[1]), r: 6, class: 'fl-coral' }));
                  }
                  const tl = Math.sqrt(2.5 * 2.5 - 1), ta = Math.asin(1 / 2.5);
                  els.push(seg(plot, s, Pp, [Pp[0] - tl * Math.cos(ta), tl * Math.sin(ta)], 'teal', 2, '6 5'));
                  els.push(s('circle', { cx: plot.X(Pp[0]), cy: plot.Y(Pp[1]), r: 7, class: 'fl-ink' }), s('text', { x: plot.X(Pp[0]) + 10, y: plot.Y(0) + 22, style: 'font-weight:700;font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px))', text: 'P' }));
                  return els;
                },
                readout: (p) => {
                  const ang = Math.PI + (p.a * Math.PI) / 180, dx = Math.cos(ang), dy = Math.sin(ang);
                  const b = 2 * (2.5 * dx), c = 2.5 * 2.5 - 1, disc = b * b - 4 * c;
                  if (disc <= 0) return 'The line misses the circle.';
                  const t1 = (-b - Math.sqrt(disc)) / 2, t2 = (-b + Math.sqrt(disc)) / 2;
                  return r`$PA = ${t1.toFixed(2)}$, $\;PB = ${t2.toFixed(2)}$, $\;PA \times PB = ${(t1 * t2).toFixed(2)}$, $\;PT^2 = ${(2.5 * 2.5 - 1).toFixed(2)}$`;
                },
              },
              after: r`The product stays at **5.25** for every line, and equals the square of the tangent length $PT$ (dashed). This constant is the **power** of the point $P$: for a point at distance $d$ from the centre of a circle of radius $r$, it's $d^2 - r^2$.`,
            },
            {
              type: 'numeric',
              title: 'Tangent from secant',
              prompt: r`From a point $P$, a secant meets a circle at $A$ and $B$ with $PA = 4$ and $PB = 9$. How long is a tangent from $P$?`,
              answer: 6,
              wrong: [{ v: 6.5, why: r`It's the geometric mean, not the average: $PT^2 = 4 \times 9$.` }, { v: 36, why: 'That’s PT². Take the square root.' }],
              explain: r`$PT^2 = PA \times PB = 36$, so $PT = 6$.`,
            },
            {
              type: 'numeric',
              title: 'Crossing chords',
              prompt: r`The same idea works inside the circle. Two chords cross at a point $P$: one is split into pieces of 3 and 8, the other into pieces of 4 and $x$. Since $PA \times PB$ is the same for every chord through $P$, what is $x$?`,
              answer: 6,
              wrong: [{ v: 7, why: r`The **products** are equal, not the sums: $3 \times 8 = 4x$.` }, { v: 32 / 3, tol: 0.01, why: r`Check which pieces pair up: $3 \times 8 = 4 \times x$.` }],
              explain: r`$3 \times 8 = 24 = 4 \times x$, so $x = 6$. For a point inside, the constant is $r^2 - d^2$ (or, with signed lengths, $d^2 - r^2$ is negative): the power of a point is positive outside the circle, zero on it, negative inside.`,
            },
            {
              type: 'mcq',
              title: 'Power at the centre',
              prompt: r`What is the power ($d^2 - r^2$) of the centre of a circle with radius 5?`,
              choices: [
                { t: '−25', ok: true },
                { t: '0', why: 'That’s for points on the circle. The centre is at distance 0, not 5.' },
                { t: '25', why: r`$d = 0$, so $d^2 - r^2 = 0 - 25$.` },
              ],
              explain: r`$0^2 - 5^2 = -25$, the most negative value: every chord through the centre is a diameter split into $5 \times 5$. Power of a point unifies tangents, secants and chords into one formula.`,
            },
            {
              type: 'mcq',
              title: 'Inside the circle',
              prompt: r`The power of a point $P$ is $d^2 - r^2$, where $d$ is its distance from the centre. What is its sign for a point **inside** the circle, and what does it mean?`,
              choices: [
                { t: r`Negative: for crossing chords, the products PA·PB equal r² − d²`, ok: true },
                { t: r`Positive, as outside`, why: r`Inside, $d < r$, so $d^2 - r^2 < 0$.` },
                { t: r`Zero`, why: r`Zero is for points exactly on the circle.` },
              ],
              explain: r`Outside, the power is the squared tangent length; on the circle it is 0; inside it is negative, and its size $r^2 - d^2$ is the product of the two pieces of any chord through $P$. One formula covers all three cases.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How far is the horizon?',
              prompt: r`You stand on a cliff 100 m above the sea. Your line of sight to the horizon is a tangent to the Earth (radius 6371 km). By power of a point, $d^2 = h(2R + h) \approx 2Rh$. How far away is the horizon, in km? (1 decimal place.)`,
              unit: 'km',
              answer: Math.sqrt(2 * 6371000 * 100) / 1000,
              tol: 0.1,
              wrong: [{ v: Math.sqrt(6371000 * 100) / 1000, tol: 0.2, why: r`Don't forget the 2: $d \approx \sqrt{2Rh}$.` }],
              explain: r`The secant through the Earth's centre has external part $h$ and whole length $2R + h$, so $d^2 \approx 2Rh = 2 \times 6.371 \times 10^6 \times 100$, giving $d \approx 35.7$ km. Standing on a beach (eyes at 1.7 m), the horizon is only about 4.7 km away.`,
            },
          ],
          recap: [
            r`For any line through $P$ meeting the circle at $A$ and $B$, $PA \times PB$ is constant.`,
            r`It equals the tangent length squared: $PT^2 = d^2 - r^2$.`,
            r`Distance to the horizon: $d \approx \sqrt{2Rh}$.`,
          ],
        },
        {
          id: 'nine-point',
          title: 'The Nine-Point Circle',
          summary: 'A surprise hidden in every triangle',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Nine points, one circle',
              body: r`Draw any triangle and mark:
- the **midpoints** of the three sides;
- the **feet of the altitudes** (where the perpendicular from each corner meets the opposite side);
- the midpoints of the segments joining each corner to the **orthocentre** $H$ (where the altitudes meet).

All nine lie on a single circle, discovered in the early 1800s. Its radius is exactly **half** the circumradius $R$, and its centre lies halfway between the circumcentre $O$ and the orthocentre $H$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Drag the corner',
              body: r`Drag the top corner. Coral dots are the side midpoints, blue the feet of the altitudes, teal the midpoints towards the orthocentre.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -3.5, ymax: 5.5, grid: false, axes: false, maxWidth: 420, pad: 6,
                params: { cx: { min: -4, max: 4, step: 0.01, value: 0.8, slider: false }, cy: { min: 0.6, max: 5, step: 0.01, value: 3.4, slider: false } },
                points: [{ x: (p) => p.cx, y: (p) => p.cy, drag: { x: 'cx', y: 'cy' }, color: 'violet' }],
                extra: ({ plot, p, s }) => { const A = [-3, -1.5], B = [3.2, -1.5], C = [p.cx, p.cy], mid = (P, Q) => [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], foot = (P, Q, R) => { const dx = R[0] - Q[0], dy = R[1] - Q[1], t = ((P[0] - Q[0]) * dx + (P[1] - Q[1]) * dy) / (dx * dx + dy * dy); return [Q[0] + t * dx, Q[1] + t * dy]; }; const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])), sq = (P) => P[0] ** 2 + P[1] ** 2, O = [(sq(A) * (B[1] - C[1]) + sq(B) * (C[1] - A[1]) + sq(C) * (A[1] - B[1])) / d, (sq(A) * (C[0] - B[0]) + sq(B) * (A[0] - C[0]) + sq(C) * (B[0] - A[0])) / d], H = [A[0] + B[0] + C[0] - 2 * O[0], A[1] + B[1] + C[1] - 2 * O[1]], N = mid(O, H), R = Math.hypot(A[0] - O[0], A[1] - O[1]), L = (P, Q, st) => s('line', { x1: plot.X(P[0]), y1: plot.Y(P[1]), x2: plot.X(Q[0]), y2: plot.Y(Q[1]), stroke: st, 'stroke-width': 1.3, 'stroke-dasharray': '4 4' }), dot = (P, c) => s('circle', { cx: plot.X(P[0]), cy: plot.Y(P[1]), r: 5, class: `fl-${c}` }); return [s('circle', { cx: plot.X(N[0]), cy: plot.Y(N[1]), r: (plot.X(R / 2) - plot.X(0)), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2 }), s('path', { d: `M${plot.X(A[0])} ${plot.Y(A[1])} L${plot.X(B[0])} ${plot.Y(B[1])} L${plot.X(C[0])} ${plot.Y(C[1])} Z`, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2 }), L(A, foot(A, B, C), 'var(--blue)'), L(B, foot(B, C, A), 'var(--blue)'), L(C, foot(C, A, B), 'var(--blue)'), dot(mid(A, B), 'coral'), dot(mid(B, C), 'coral'), dot(mid(C, A), 'coral'), dot(foot(A, B, C), 'blue'), dot(foot(B, C, A), 'blue'), dot(foot(C, A, B), 'blue'), dot(mid(A, H), 'teal'), dot(mid(B, H), 'teal'), dot(mid(C, H), 'teal')]; },
                readout: (p) => { const A = [-3, -1.5], B = [3.2, -1.5], C = [p.cx, p.cy], a = Math.hypot(B[0] - C[0], B[1] - C[1]), b = Math.hypot(A[0] - C[0], A[1] - C[1]), c = 6.2, area = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2, R = (a * b * c) / (4 * area); return `circumradius R = ${R.toFixed(2)} · nine-point radius **${(R / 2).toFixed(2)}** = R/2`; },
              },
              after: r`However you drag, all nine points stay on the violet circle. When the triangle gets an obtuse angle, the orthocentre moves outside it and some feet land on the extended sides, but the circle still passes through all nine.`,
            },
            {
              type: 'mcq',
              title: 'An equilateral triangle',
              prompt: r`In an equilateral triangle, how many **different** points are among the nine?`,
              choices: [
                { t: '6: each foot of an altitude is also a side midpoint', ok: true },
                { t: '9: they are always different', why: 'In an equilateral triangle each altitude hits the opposite side exactly at its midpoint.' },
                { t: '3', why: 'The feet coincide with the midpoints, but the three points halfway to the orthocentre are different again.' },
              ],
              explain: r`Each altitude meets its side at the midpoint, so 6 of the points pair up into 3. Together with the 3 midpoints towards the centre that makes **6** distinct points, all on the circle inscribed in the triangle.`,
            },
            {
              type: 'numeric',
              title: 'A right triangle',
              prompt: r`A right triangle has legs 6 and 8. Its circumcircle has the hypotenuse as diameter. What is the radius of its nine-point circle?`,
              answer: 2.5,
              tol: 0.01,
              explain: r`The hypotenuse is 10, so the circumradius is 5 (the angle in a semicircle is a right angle!) and the nine-point radius is $\frac52 = 2.5$. For a right triangle the orthocentre is the right-angled corner itself.`,
            },
            {
              type: 'mcq',
              title: 'Touching circles',
              prompt: r`Feuerbach’s theorem (1822) adds one more surprise about the nine-point circle. What does it say?`,
              choices: [
                { t: r`It touches the incircle and all three excircles of the triangle`, ok: true },
                { t: r`It passes through the circumcentre`, why: r`It passes through nine special points, but not generally through the circumcentre.` },
                { t: r`It is always the incircle`, why: r`Only for the equilateral triangle do these coincide.` },
              ],
              explain: r`The nine-point circle is tangent to the triangle’s inscribed circle and to its three escribed circles. It’s one of the most celebrated results of triangle geometry, and the tangency point with the incircle is called the Feuerbach point.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'On Euler’s line',
              prompt: r`The circumcentre $O$, centroid $G$, nine-point centre $N$ and orthocentre $H$ all lie on one line, Euler’s line, with $G$ one third of the way from $O$ to $H$ and $N$ halfway. If $OH = 12$, how far is $G$ from $N$?`,
              answer: 2,
              wrong: [{ v: 6, why: 'That’s ON. G is at 4 from O, N at 6.' }, { v: 4, why: 'That’s OG. N is at 6 from O.' }],
              explain: r`Measuring from $O$: $G$ is at $\frac{12}{3} = 4$ and $N$ at $\frac{12}{2} = 6$, so $GN = 2$. The four centres always sit in these fixed proportions, $OG : GN : NH = 2 : 1 : 3$.`,
            },
          ],
          recap: [
            'Side midpoints, altitude feet and midpoints to the orthocentre: nine points on one circle.',
            'Its radius is half the circumradius.',
            'Its centre is the midpoint of O and H on Euler’s line.',
          ],
        },
      ],
    },
  ],
};
