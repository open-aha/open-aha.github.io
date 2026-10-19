import { angleAt, wedge, angleLabel, poly, seg, label, rightMark, lerp, ease, rad } from './_geo.js';
import { fix } from '../lib/svg.js';

const r = String.raw;
const n0 = (v) => Math.round(v).toString();
const f1 = (v) => (Math.round(v * 10) / 10).toString();

// a draggable triangle on a light canvas
const triParams = (A, B, C) => ({
  ax: { min: 0, max: 10, step: 0.25, value: A[0], slider: false }, ay: { min: 0, max: 7, step: 0.25, value: A[1], slider: false },
  bx: { min: 0, max: 10, step: 0.25, value: B[0], slider: false }, by: { min: 0, max: 7, step: 0.25, value: B[1], slider: false },
  cx: { min: 0, max: 10, step: 0.25, value: C[0], slider: false }, cy: { min: 0, max: 7, step: 0.25, value: C[1], slider: false },
});
const triPts = (p) => [[p.ax, p.ay], [p.bx, p.by], [p.cx, p.cy]];
const triHandles = [
  { x: (p) => p.ax, y: (p) => p.ay, drag: { x: 'ax', y: 'ay' }, color: 'blue', label: 'A', labelDx: -24, labelDy: 18 },
  { x: (p) => p.bx, y: (p) => p.by, drag: { x: 'bx', y: 'by' }, color: 'coral', label: 'B', labelDx: 14, labelDy: 18 },
  { x: (p) => p.cx, y: (p) => p.cy, drag: { x: 'cx', y: 'cy' }, color: 'teal', label: 'C', labelDx: 12, labelDy: -12 },
];
const CANVAS = { kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: 1, axes: false };

// Pythagorean rearrangement (a = 3, b = 4, c = 5)
const PA = 3, PB = 4, PS = PA + PB;
// phase: which third of the slider moves this triangle (sequenced so pieces never overlap)
const PY_TRI = [
  { pts: [[0, 0], [PA, 0], [0, PB]], move: [0, PA], phase: 1 },
  { pts: [[PS, 0], [PS, PA], [PA, 0]], move: [0, 0], phase: 0 },
  { pts: [[PS, PS], [PB, PS], [PS, PA]], move: [-PB, 0], phase: 2 },
  { pts: [[0, PS], [0, PB], [PB, PS]], move: [PA, -PB], phase: 0 },
];


// transformations
const LSHAPE = [[1, 0.5], [4, 0.5], [4, 1.5], [2, 1.5], [2, 3.5], [1, 3.5]];
const rot = ([x, y], deg0) => {
  const a = rad(deg0);
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
// SSA: AB = 5 along the x-axis, angle A = 30°, C on the 30° ray at distance t
const SSA_C = (t) => [t * Math.cos(rad(30)), t * Math.sin(rad(30))];
const SSA_BC = (t) => Math.hypot(SSA_C(t)[0] - 5, SSA_C(t)[1]);

export default {
  id: 'geometry',
  subject: 'math',
  title: 'Geometry: Visual Proofs',
  level: 'Foundational',
  cover: 'geometry',
  tagline: 'Angles, areas, Pythagoras and π, proved by moving shapes around.',
  description: r`Drag triangles, slide shapes apart and rearrange slices of a circle. You'll see **why** the classic geometry facts are true, not just memorise them.`,
  chapters: [
    {
      title: 'Angles',
      summary: 'Straight lines, parallel lines and triangles.',
      lessons: [
        {
          id: 'angles-lines',
          title: 'Angles & Lines',
          summary: 'Straight angles and parallel lines',
          icon: 'pencil',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'On a straight line',
              widget: {
                kind: 'figure', w: 600, h: 200, label: 'Two angles on a straight line',
                draw: ({ s }) => {
                  // ray at 130° from the right-hand side of the line
                  const O = [300, 160], phi = rad(130);
                  const at = (a, d) => [O[0] + d * Math.cos(a), O[1] - d * Math.sin(a)];
                  const R = at(phi, 190);
                  const c1 = at(0, 58), c2 = at(phi, 58), b1 = at(phi, 44), b2 = at(Math.PI, 44);
                  const cl = at(phi / 2, 86), bl = at((phi + Math.PI) / 2, 76);
                  return [
                    s('path', { d: `M${O[0]} ${O[1]} L${c1[0]} ${c1[1]} A58 58 0 0 0 ${c2[0]} ${c2[1]} Z`, class: 'fl-coral', opacity: 0.3 }),
                    s('path', { d: `M${O[0]} ${O[1]} L${b1[0]} ${b1[1]} A44 44 0 0 0 ${b2[0]} ${b2[1]} Z`, class: 'fl-blue', opacity: 0.3 }),
                    s('line', { x1: 60, y1: 160, x2: 540, y2: 160, stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('line', { x1: O[0], y1: O[1], x2: R[0], y2: R[1], stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('text', { x: bl[0], y: bl[1] + 6, 'text-anchor': 'middle', class: 'lbl fl-blue', text: 'x' }),
                    s('text', { x: cl[0], y: cl[1] + 6, 'text-anchor': 'middle', class: 'lbl fl-coral', text: '130°' }),
                  ];
                },
              },
              prompt: r`Find the angle $x$.`,
              lhs: r`$x =$`,
              unit: '°',
              answer: 50,
              wrong: [
                { v: 230, why: 'A straight line is 180°, not 360°.' },
                { v: 130, why: 'The two angles together make a straight line. They aren’t equal.' },
              ],
              explain: r`Angles on a straight line add up to 180°: $x = 180° - 130° = 50°$.`,
            },
            {
              type: 'explain',
              title: 'Crossing lines',
              body: r`When two lines cross, they make four angles. Drag the point to rotate one line.`,
              widget: {
                ...CANVAS, ymax: 6, grid: false,
                params: { t: { min: 15, max: 165, step: 1, value: 60, slider: false } },
                points: [{ x: (p) => 5 + 3.5 * Math.cos(rad(p.t)), y: (p) => 3 + 3.5 * Math.sin(rad(p.t)), color: 'blue', drag: { key: 't', fn: (x, y) => { let a = (Math.atan2(y - 3, x - 5) * 180) / Math.PI; if (a < 0) a += 180; return { t: a }; } }, ariaLabel: 'Rotate line' }],
                extra: ({ plot, p, s }) => {
                  const O = [5, 3], u = [Math.cos(rad(p.t)), Math.sin(rad(p.t))];
                  const P1 = [O[0] + 4 * u[0], O[1] + 4 * u[1]], P2 = [O[0] - 4 * u[0], O[1] - 4 * u[1]];
                  const L1 = [1, 3], L2 = [9, 3];
                  return [
                    wedge(plot, s, L2, O, P1, 34, 'fl-blue'), wedge(plot, s, P2, O, L1, 34, 'fl-blue'),
                    wedge(plot, s, P1, O, L1, 26, 'fl-coral'), wedge(plot, s, L2, O, P2, 26, 'fl-coral'),
                    seg(plot, s, L1, L2, { stroke: 'var(--ink)', 'stroke-width': 3 }),
                    seg(plot, s, P1, P2, { stroke: 'var(--ink)', 'stroke-width': 3 }),
                    angleLabel(plot, s, L2, O, P1, `${n0(p.t)}°`, 58, 'lbl fl-blue'), angleLabel(plot, s, P2, O, L1, `${n0(p.t)}°`, 58, 'lbl fl-blue'),
                    angleLabel(plot, s, P1, O, L1, `${n0(180 - p.t)}°`, 52, 'lbl fl-coral'), angleLabel(plot, s, L2, O, P2, `${n0(180 - p.t)}°`, 52, 'lbl fl-coral'),
                  ];
                },
              },
              after: r`**Vertically opposite** angles (across the crossing point) are always equal. Neighbouring angles sit on a straight line, so they add up to 180°.`,
            },
            {
              type: 'numeric',
              title: 'Next door',
              body: r`Two lines cross. One of the four angles is 70°.`,
              prompt: 'What is the angle right next to it (sharing one of its arms)?',
              unit: '°',
              answer: 110,
              wrong: [
                { v: 70, why: 'That’s the angle *opposite* it. The neighbouring angle forms a straight line with it.' },
                { v: 290, why: 'Neighbouring angles share a straight line, which is 180°, not 360°.' },
              ],
              explain: r`Neighbours make a straight line: $180° - 70° = 110°$. The angle opposite the 70° angle is also 70°, and the last one is 110°.`,
            },
            {
              type: 'explain',
              title: 'Parallel lines',
              body: r`Two **parallel** lines (they never meet) are crossed by a third line, called a *transversal*. Drag to tilt the transversal.`,
              widget: {
                ...CANVAS, ymax: 6, grid: false,
                params: { k: { min: -3, max: 3, step: 0.1, value: 1.2, slider: false } },
                points: [{ x: (p) => 5 + p.k, y: () => 5.6, drag: { key: 'k', fn: (x) => ({ k: x - 5 }) }, color: 'violet', ariaLabel: 'Tilt transversal' }],
                extra: ({ plot, p, s }) => {
                  const top = [5 + p.k, 5.6], bot = [5 - p.k, 0.4];
                  const at = (y) => [5 + p.k * ((y - 3) / 2.6), y];
                  const I1 = at(4.2), I2 = at(1.8);
                  const els = [
                    seg(plot, s, [0.5, 4.2], [9.5, 4.2], { stroke: 'var(--ink)', 'stroke-width': 3 }),
                    seg(plot, s, [0.5, 1.8], [9.5, 1.8], { stroke: 'var(--ink)', 'stroke-width': 3 }),
                    seg(plot, s, top, bot, { stroke: 'var(--violet)', 'stroke-width': 3 }),
                    wedge(plot, s, [9.5, 4.2], I1, top, 30, 'fl-blue'),
                    wedge(plot, s, [9.5, 1.8], I2, top, 30, 'fl-blue'),
                    wedge(plot, s, [0.5, 1.8], I2, top, 22, 'fl-coral'),
                    wedge(plot, s, [9.5, 4.2], I1, bot, 22, 'fl-coral', 0.0),
                  ];
                  const a = angleAt([9.5, 4.2], I1, top);
                  els.push(angleLabel(plot, s, [9.5, 4.2], I1, top, `${n0(a)}°`, 52, 'lbl fl-blue'));
                  els.push(angleLabel(plot, s, [9.5, 1.8], I2, top, `${n0(a)}°`, 52, 'lbl fl-blue'));
                  els.push(angleLabel(plot, s, [0.5, 1.8], I2, top, `${n0(180 - a)}°`, 44, 'lbl fl-coral'));
                  return els;
                },
              },
              after: r`The transversal crosses both lines at the **same angle**, because the lines point the same way. So the two {blue:blue angles} (called *corresponding* angles) are always equal.

The {coral:coral angle} sits on a straight line with the lower blue angle, so it's $180°$ minus the blue angle.`,
            },
            {
              type: 'numeric',
              title: 'Same side',
              body: r`A transversal crosses two parallel lines. Between the parallel lines, on the same side of the transversal, one angle is 65°.`,
              prompt: 'What is the other angle between the lines, on the same side?',
              unit: '°',
              answer: 115,
              wrong: [{ v: 65, why: r`Those two angles aren't equal. One of them sits on a straight line with a copy of the other.` }],
              explain: r`These *co-interior* angles add up to 180°. One of them makes a straight line with the corresponding copy of the other. So $180° - 65° = 115°$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Count them',
              body: r`A transversal crosses two parallel lines, making 8 angles. One of them is 48°.`,
              prompt: 'How many of the 8 angles equal 48°?',
              answer: 4,
              wrong: [
                { v: 2, why: 'Don’t forget the vertically opposite angles at each crossing.' },
                { v: 1, why: 'Equal angles appear at both crossings, and opposite each other at each crossing.' },
              ],
              explain: r`At each crossing, the 48° angle has a vertically opposite twin. The other crossing has the same pattern (corresponding angles). That's $2 \times 2 = 4$ angles of 48°. The other four are $180° - 48° = 132°$.`,
            },
          ],
          recap: [
            'Angles on a straight line add up to 180°. All the way around a point is 360°.',
            'Vertically opposite angles are equal.',
            'With parallel lines, corresponding angles are equal and co-interior angles add up to 180°.',
          ],
        },
        {
          id: 'triangle-sum',
          title: 'The Triangle Rule',
          summary: 'Why the angles add up to 180°',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Drag the corners',
              body: r`Drag the corners of the triangle. Make it tall, flat, pointy, anything. Watch the total.`,
              widget: {
                ...CANVAS,
                params: triParams([1.5, 1], [8.5, 1.5], [4, 6]),
                points: triHandles,
                extra: ({ plot, p, s }) => {
                  const [A, B, C] = triPts(p);
                  return [
                    poly(plot, s, [A, B, C], { class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
                    wedge(plot, s, B, A, C, 44, 'fl-blue', 0.4), wedge(plot, s, A, B, C, 44, 'fl-coral', 0.4), wedge(plot, s, A, C, B, 44, 'fl-teal', 0.4),
                  ];
                },
                readout: (p) => {
                  const [A, B, C] = triPts(p);
                  const a = angleAt(B, A, C), b = angleAt(A, B, C), c = angleAt(A, C, B);
                  return isFinite(a + b + c) ? r`$\blue{${n0(a)}°} + \coral{${n0(b)}°} + \teal{${n0(c)}°} = ${n0(a + b + c)}°$` : 'Pull the corners apart';
                },
              },
              after: 'However you drag it, the three angles always add up to 180°. (Individual angles are rounded, so the rounded numbers can occasionally add to 179° or 181°.)',
            },
            {
              type: 'mcq',
              title: 'Two right angles?',
              prompt: 'Can a triangle have two right angles (90° each)?',
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes, if it’s very tall', why: r`$90° + 90° = 180°$ would leave $0°$ for the third angle. The two sides would be parallel and never meet.` },
                { t: 'Only if it’s an isosceles triangle', why: r`Two right angles already use up all 180°, whatever the triangle's shape.` },
              ],
              explain: r`Two right angles use up all 180°, leaving nothing for the third corner. The two sides leaving the base would both be vertical, which means parallel, so they would never meet to close the triangle.`,
            },
            {
              type: 'explain',
              title: 'The proof',
              body: r`Draw a line through C, **parallel** to AB. Then:

- the {blue:blue angle} at C equals angle A (alternate angles between parallel lines),
- the {coral:coral angle} at C equals angle B (same reason),
- together with the {teal:teal angle}, they fill a straight line at C: **180°**.

Drag the corners. The proof works for every triangle.`,
              widget: {
                ...CANVAS,
                params: triParams([2, 1], [8, 1], [4.5, 5]),
                points: triHandles,
                extra: ({ plot, p, s }) => {
                  const [A, B, C] = triPts(p);
                  const d = [B[0] - A[0], B[1] - A[1]];
                  const L = [C[0] - d[0] * 2, C[1] - d[1] * 2], R = [C[0] + d[0] * 2, C[1] + d[1] * 2];
                  return [
                    poly(plot, s, [A, B, C], { class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
                    seg(plot, s, L, R, { stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
                    wedge(plot, s, B, A, C, 44, 'fl-blue', 0.45), wedge(plot, s, A, B, C, 44, 'fl-coral', 0.45),
                    wedge(plot, s, L, C, A, 50, 'fl-blue', 0.45), wedge(plot, s, B, C, R, 50, 'fl-coral', 0.45),
                    wedge(plot, s, A, C, B, 50, 'fl-teal', 0.45),
                  ];
                },
              },
            },
            {
              type: 'numeric',
              title: 'Missing angle',
              prompt: 'A triangle has angles of 47° and 68°. What is the third angle?',
              unit: '°',
              answer: 65,
              wrong: [{ v: 245, why: 'The three angles of a triangle add up to 180°, not 360°.' }],
              explain: r`$180° - 47° - 68° = 65°$.`,
            },
            {
              type: 'numeric',
              title: 'Isosceles',
              body: r`An isosceles triangle has two equal sides, and the two angles opposite them (the *base angles*) are equal too. The angle at the top is 40°.`,
              prompt: 'What is each base angle?',
              unit: '°',
              answer: 70,
              wrong: [
                { v: 140, why: 'That’s both base angles together. Split it between the two.' },
                { v: 40, why: 'The top angle is different from the two base angles.' },
              ],
              explain: r`The two base angles share $180° - 40° = 140°$ equally: $70°$ each.`,
            },
            {
              type: 'numeric',
              title: 'Exterior angle',
              body: r`Extend one side of a triangle past a corner. The angle between the extension and the next side is an **exterior angle**. The other two angles of the triangle are 50° and 60°.`,
              widget: {
                kind: 'figure', w: 600, h: 230, label: 'Exterior angle of a triangle',
                draw: ({ s }) => {
                  // angles: A = 50°, B = 70° (interior), C = 60°
                  const A = [150, 200], B = [330, 200], C = [275.5, 50.4];
                  const e = [B[0] + 46 * Math.cos(rad(110)), B[1] - 46 * Math.sin(rad(110))];
                  return [
                    s('path', { d: `M${B[0]} ${B[1]} L${B[0] + 46} ${B[1]} A46 46 0 0 0 ${e[0]} ${e[1]} Z`, class: 'fl-violet', opacity: 0.35 }),
                    s('path', { d: `M${A} L${B} L${C} Z`, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
                    s('line', { x1: B[0], y1: B[1], x2: 560, y2: B[1], stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-dasharray': '8 6' }),
                    s('text', { x: B[0] + 34, y: B[1] - 50, class: 'lbl fl-violet', text: '?' }),
                    s('text', { x: A[0] + 50, y: A[1] - 14, class: 'lbl', text: '50°' }),
                    s('text', { x: C[0] - 4, y: C[1] + 52, 'text-anchor': 'middle', class: 'lbl', text: '60°' }),
                  ];
                },
              },
              prompt: 'How big is the exterior angle?',
              unit: '°',
              answer: 110,
              wrong: [
                { v: 70, why: r`70° is the interior angle at that corner. The exterior angle makes a straight line with it.` },
                { v: 250, why: 'The exterior angle and the interior angle at that corner add up to 180°.' },
              ],
              explain: r`The interior angle at that corner is $180° - 50° - 60° = 70°$. The exterior angle makes a straight line with it: $180° - 70° = 110°$.

Notice that $110° = 50° + 60°$. **An exterior angle always equals the sum of the two opposite interior angles.**`,
            },
            {
              type: 'explain',
              title: 'Beyond triangles',
              body: r`Any polygon can be cut into triangles by drawing lines from one corner. An $n$-sided polygon splits into $n - 2$ triangles, so its interior angles add up to
$$(n - 2) \times 180°$$`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.15, ymax: 1.25, grid: false, axes: false,
                params: { n: { min: 3, max: 10, step: 1, value: 5, label: '$n$', color: 'violet', format: (v) => `${v} sides` } },
                extra: ({ plot, p, s }) => {
                  const V = Array.from({ length: p.n }, (_, k) => [Math.cos(Math.PI / 2 + (2 * Math.PI * k) / p.n), Math.sin(Math.PI / 2 + (2 * Math.PI * k) / p.n)]);
                  const cols = ['fl-blue', 'fl-coral', 'fl-teal', 'fl-amber', 'fl-violet', 'fl-pink', 'fl-blue', 'fl-coral'];
                  const els = [];
                  for (let k = 1; k < p.n - 1; k++) els.push(poly(plot, s, [V[0], V[k], V[k + 1]], { class: cols[k - 1], opacity: 0.3, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(poly(plot, s, V, { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                  return els;
                },
                readout: (p) => r`$${p.n - 2}$ triangles $\Rightarrow (${p.n} - 2) \times 180° = ${(p.n - 2) * 180}°$`,
              },
            },
            {
              type: 'numeric',
              title: 'Hexagon',
              prompt: 'What do the interior angles of a hexagon (6 sides) add up to?',
              unit: '°',
              answer: 720,
              wrong: [
                { v: 1080, why: r`A hexagon splits into $6 - 2 = 4$ triangles, not 6.` },
                { v: 360, why: 'That’s the total for a quadrilateral. A hexagon has more corners.' },
              ],
              explain: r`$(6 - 2) \times 180° = 4 \times 180° = 720°$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Stop sign',
              prompt: 'A regular octagon (like a stop sign) has 8 equal angles. How big is each one?',
              unit: '°',
              answer: 135,
              wrong: [
                { v: 1080, why: 'That’s the total of all eight angles. Divide by 8.' },
                { v: 45, why: r`$360° / 8 = 45°$ is the *exterior* angle at each corner. The interior angle is $180° - 45°$.` },
              ],
              explain: r`Total: $(8 - 2) \times 180° = 1080°$. Each angle: $1080° / 8 = 135°$.`,
            },
          ],
          recap: [
            'The angles of any triangle add up to 180°. The proof uses a line parallel to one side.',
            'An exterior angle equals the sum of the two opposite interior angles.',
            r`An $n$-sided polygon's interior angles add up to $(n-2) \times 180°$.`,
          ],
        },
      ],
    },
    {
      title: 'Area',
      summary: 'Cut, slide and rearrange.',
      lessons: [
        {
          id: 'area-rearranging',
          title: 'Cut and Slide',
          summary: 'Parallelograms, triangles, trapezoids',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A leaning rectangle',
              body: r`This parallelogram has a base of 6, a slanted side of 5, and a height of 4.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 9.5, ymin: -0.8, ymax: 5, grid: 1, axes: false,
                extra: ({ plot, s }) => [
                  poly(plot, s, [[0, 0], [6, 0], [9, 4], [3, 4]], { class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 }),
                  seg(plot, s, [3, 4], [3, 0], { stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }),
                  rightMark(plot, s, [3, 4], [3, 0], [6, 0]),
                  label(plot, s, [3, 0], '6', 0, 24), label(plot, s, [1.5, 2], '5', -16, 0), label(plot, s, [3, 2], '4', 14, 0, { class: 'lbl fl-coral' }),
                ],
              },
              prompt: 'What is its area?',
              answer: 24,
              wrong: [
                { v: 30, why: 'That uses the slanted side. Area needs the perpendicular height.' },
                { v: 20, why: 'Base times height: 6 × 4.' },
                { v: 12, why: 'That’s half of it. A parallelogram isn’t a triangle.' },
              ],
              explain: r`Area $= \text{base} \times \text{height} = 6 \times 4 = 24$. The slanted side doesn't matter. The next screen shows why.`,
            },
            {
              type: 'explain',
              title: 'Slice and slide',
              body: r`Cut a triangle off one end of the parallelogram and slide it to the other end. Drag the slider.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 9.5, ymin: -0.8, ymax: 5, grid: 1, axes: false,
                params: { t: { min: 0, max: 1, step: 0.01, value: 0, label: 'slide', color: 'coral', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => {
                  const k = ease(p.t) * 6;
                  return [
                    poly(plot, s, [[3, 0], [6, 0], [9, 4], [3, 4]], { class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 }),
                    poly(plot, s, [[0 + k, 0], [3 + k, 0], [3 + k, 4]], { class: 'fl-coral', opacity: 0.55, stroke: 'var(--coral)', 'stroke-width': 3 }),
                  ];
                },
                readout: (p) => (p.t > 0.98 ? r`A $6 \times 4$ rectangle: area $= 24$` : r`Same pieces, same area`),
              },
              after: r`Nothing is added or removed, so the area stays the same. The parallelogram becomes a rectangle with the same base and the same height:
$$A = b \times h$$`,
            },
            {
              type: 'explain',
              title: 'Triangles are half',
              body: r`Two identical copies of any triangle fit together into a parallelogram with the same base and height. So a triangle's area is half of that:
$$A = \tfrac12\, b\, h$$`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 10.5, ymin: -0.8, ymax: 5, grid: 1, axes: false,
                params: { t: { min: 0, max: 1, step: 0.01, value: 1, label: 'copy', color: 'teal', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => {
                  const e = ease(p.t);
                  // the copy is the triangle rotated 180° about the midpoint of side B–C
                  const A = [0, 0], B = [6, 0], C = [2, 4];
                  const M = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
                  const rot = (P) => [2 * M[0] - P[0], 2 * M[1] - P[1]];
                  const copy = [A, B, C].map((P) => { const Q = rot(P); return [lerp(P[0] + 3, Q[0], e), lerp(P[1], Q[1], e) + (1 - e) * 0]; });
                  return [
                    poly(plot, s, [A, B, C], { class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 3 }),
                    poly(plot, s, copy, { class: 'fl-amber', opacity: 0.45, stroke: 'var(--amber)', 'stroke-width': 3 }),
                  ];
                },
              },
            },
            {
              type: 'numeric',
              title: 'Triangle area',
              prompt: 'A triangle has a base of 10 and a height of 7. What is its area?',
              answer: 35,
              wrong: [{ v: 70, why: r`That's the parallelogram made from two copies. The triangle is half of it.` }, { v: 17, why: 'Area multiplies base and height. Don’t add them.' }],
              explain: r`$A = \tfrac12 \times 10 \times 7 = 35$.`,
            },
            {
              type: 'mcq',
              title: 'Slide the top',
              body: r`The base of this triangle is fixed. Drag the top corner left and right along the dashed line.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2, xmax: 12, ymin: -0.8, ymax: 5, grid: 1, axes: false,
                params: { cx: { min: -1.5, max: 11.5, step: 0.25, value: 3, slider: false } },
                points: [{ x: (p) => p.cx, y: () => 4, drag: { x: 'cx' }, color: 'violet' }],
                extra: ({ plot, p, s }) => [
                  seg(plot, s, [-2, 4], [12, 4], { stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 6' }),
                  poly(plot, s, [[3, 0], [7, 0], [p.cx, 4]], { class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
                ],
              },
              prompt: 'What happens to the area as you drag?',
              choices: [
                { t: 'It stays the same', ok: true },
                { t: 'It gets bigger as the triangle leans more', why: 'The triangle gets longer sides as it leans, but its base and height don’t change.' },
                { t: 'It’s biggest when the top is right above the middle', why: r`The area only depends on the base and the height, and neither of those changes.` },
              ],
              explain: r`The base stays 4 and the height stays 4 (the distance between the parallel lines), so the area is always $\tfrac12 \times 4 \times 4 = 8$. Very stretched triangles are still that same area.`,
            },
            {
              type: 'numeric',
              title: 'Trapezoid',
              body: r`A trapezoid has parallel sides of length 5 and 9, and a height of 4. Two copies, one flipped upside down, fit together into a parallelogram with base $5 + 9$.`,
              prompt: 'What is the trapezoid’s area?',
              answer: 28,
              wrong: [
                { v: 56, why: r`That's the parallelogram made of two copies. The trapezoid is half of it.` },
                { v: 180, why: 'Add the parallel sides, don’t multiply them.' },
              ],
              explain: r`Two copies make a parallelogram with base $5 + 9 = 14$ and height 4, area 56. One trapezoid is half: $A = \tfrac12 (a + b) h = \tfrac12 \times 14 \times 4 = 28$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'On the grid',
              prompt: r`What is the area of the triangle with corners $(0, 0)$, $(6, 0)$ and $(2, 5)$?`,
              answer: 15,
              wrong: [
                { v: 30, why: 'Remember the ½ for a triangle.' },
                { v: 6, why: r`The height is the $y$-coordinate of the top corner, 5.` },
              ],
              explain: r`The base runs along the $x$-axis from 0 to 6, so it's 6. The height is how far the top corner is above the base: 5. So $A = \tfrac12 \times 6 \times 5 = 15$.`,
            },
          ],
          recap: [
            r`Parallelogram: $A = bh$, using the perpendicular height, not the slanted side.`,
            r`Triangle: $A = \tfrac12 bh$. Trapezoid: $A = \tfrac12(a + b)h$.`,
            'Cutting and rearranging doesn’t change area. It’s the key to these formulas.',
          ],
        },
        {
          id: 'pythagoras',
          title: 'Pythagoras',
          summary: 'The most famous proof',
          icon: 'sparkle',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'The shortcut',
              body: r`You walk 3 blocks east and 4 blocks north. A bird flies straight from your start to your finish.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 6, ymin: -0.5, ymax: 4.6, grid: 1, axes: false,
                extra: ({ plot, s }) => [
                  seg(plot, s, [0, 0], [3, 0], { stroke: 'var(--blue)', 'stroke-width': 5, 'stroke-linecap': 'round' }),
                  seg(plot, s, [3, 0], [3, 4], { stroke: 'var(--coral)', 'stroke-width': 5, 'stroke-linecap': 'round' }),
                  seg(plot, s, [0, 0], [3, 4], { stroke: 'var(--teal)', 'stroke-width': 4, 'stroke-dasharray': '8 6' }),
                  rightMark(plot, s, [0, 0], [3, 0], [3, 4]),
                  label(plot, s, [1.5, 0], '3', 0, 24, { class: 'lbl fl-blue' }), label(plot, s, [3, 2], '4', 16, 0, { class: 'lbl fl-coral' }), label(plot, s, [1.5, 2], '?', -16, 0, { class: 'lbl fl-teal' }),
                ],
              },
              prompt: 'How far does the bird fly, in blocks?',
              answer: 5,
              wrong: [
                { v: 7, why: 'That’s the walking route. The straight line is shorter than going around the corner.' },
                { v: 3.5, why: 'The diagonal is longer than either of the two sides, so it must be more than 4.' },
              ],
              hint: 'Count the grid squares, or try the squares of the sides: 3² and 4².',
              explain: r`It's 5 blocks. As you'll see, $3^2 + 4^2 = 9 + 16 = 25 = 5^2$.`,
            },
            {
              type: 'explain',
              title: 'Squares on the sides',
              body: r`Build a square on each side of a right triangle. The two smaller squares, $\blue{a^2} + \coral{b^2}$, have exactly the same total area as the big one, $\teal{c^2}$:
$$\blue{a}^2 + \coral{b}^2 = \teal{c}^2$$
Here $9 + 16 = 25$. But **why**?`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.4, xmax: 8.4, ymin: -4.6, ymax: 7.6, grid: false, axes: false,
                extra: ({ plot, s }) => {
                  const A = [0, 0], B = [4, 0], C = [0, 3];
                  return [
                    poly(plot, s, [[0, 0], [4, 0], [4, -4], [0, -4]], { class: 'fl-coral', opacity: 0.35, stroke: 'var(--coral)', 'stroke-width': 2 }),
                    poly(plot, s, [[0, 0], [0, 3], [-3, 3], [-3, 0]], { class: 'fl-blue', opacity: 0.35, stroke: 'var(--blue)', 'stroke-width': 2 }),
                    poly(plot, s, [[4, 0], [0, 3], [3, 7], [7, 4]], { class: 'fl-teal', opacity: 0.35, stroke: 'var(--teal)', 'stroke-width': 2 }),
                    poly(plot, s, [A, B, C], { class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 3 }),
                    label(plot, s, [-1.5, 1.5], 'a² = 9', 0, 6, { class: 'lbl fl-blue' }),
                    label(plot, s, [2, -2], 'b² = 16', 0, 6, { class: 'lbl fl-coral' }),
                    label(plot, s, [3.5, 3.5], 'c² = 25', 0, 6, { class: 'lbl fl-teal' }),
                  ];
                },
              },
            },
            {
              type: 'explain',
              title: 'A proof you can see',
              body: r`Here's a big square of side $a + b$, holding four copies of the triangle. The white space left over is the tilted square, $\teal{c^2}$.

Now **slide** the triangles around inside the big square. Watch the leftover space.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.4, xmax: PS + 0.4, ymin: -0.4, ymax: PS + 0.4, grid: false, axes: false,
                params: { t: { min: 0, max: 1, step: 0.01, value: 0, label: 'slide', color: 'teal', format: (v) => `${Math.round(v * 100)}%` } },
                extra: ({ plot, p, s }) => {
                  const els = [poly(plot, s, [[0, 0], [PS, 0], [PS, PS], [0, PS]], { class: 'fl-teal', opacity: 0.25, stroke: 'var(--ink)', 'stroke-width': 3 })];
                  const cols = ['fl-blue', 'fl-coral', 'fl-violet', 'fl-amber'];
                  PY_TRI.forEach((T, i) => {
                    const k = ease(Math.max(0, Math.min(1, 3 * p.t - T.phase)));
                    const pts = T.pts.map(([x, y]) => [x + T.move[0] * k, y + T.move[1] * k]);
                    els.push(poly(plot, s, pts, { class: cols[i], opacity: 0.85, stroke: 'var(--card)', 'stroke-width': 2 }));
                  });
                  const show = (o) => Math.max(0, Math.min(1, o));
                  els.push(label(plot, s, [PS / 2, PS / 2], 'c²', 0, 8, { style: `font-size:28px;opacity:${show(1 - 3 * p.t)}` }));
                  els.push(label(plot, s, [PA / 2, PA / 2], 'a²', 0, 8, { style: `font-size:24px;opacity:${show(3 * p.t - 2)}` }));
                  els.push(label(plot, s, [PA + PB / 2, PA + PB / 2], 'b²', 0, 8, { style: `font-size:28px;opacity:${show(3 * p.t - 2)}` }));
                  return els;
                },
                readout: (p) => (p.t < 0.05 ? r`Leftover space: one square, $c^2$` : p.t > 0.95 ? r`Leftover space: two squares, $a^2 + b^2$` : 'Sliding…'),
              },
              after: r`The big square and the four triangles never changed, so the leftover area never changed either. Before, it was $c^2$. After, it's $a^2 + b^2$. So
$$a^2 + b^2 = c^2.$$
That's the whole proof. It works for **every** right triangle.`,
            },
            { /*anim:geometry*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Shear, slide, shear',
              body: r`A different proof, close to Euclid's own. A **shear** slides one side of a shape along itself, like pushing over a deck of cards: the base and the height stay put, so the **area never changes**. Watch the two small squares shear, slide down, and shear again.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.8, xmax: 7.8, ymin: -6.1, ymax: 7.7, grid: false, axes: false, maxWidth: 440,
                animate: { param: 't', speed: 0.45, max: 4.6, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const c = 5, AH = 3.2, h = 2.4, A = [0, 0], B = [c, 0], C = [AH, h], Hf = [AH, 0];
                  const ph = (k) => { const u = Math.min(1, Math.max(0, p.t - 0.3 - k * 1.25)); return u * u * (3 - 2 * u); };
                  const e1 = ph(0), e2 = ph(1), e3 = ph(2);
                  const add = (u, v, k = 1) => [u[0] + k * v[0], u[1] + k * v[1]];
                  const poly = (pts, o) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', 'stroke-linejoin': 'round', ...o });
                  // one leg's square: its far side shears to vertical, slides down by c, then the slanted sides shear flat
                  const piece = (P, Q, nrm, side, foot) => {
                    // P is the corner on the hypotenuse, Q is C; square P, Q, Q + side*nrm, P + side*nrm
                    const far0 = add(P, nrm, side), far1 = add(P, [0, c]);
                    const shift = [(far1[0] - far0[0]) * e1, (far1[1] - far0[1]) * e1];
                    let pts = [P, Q, add(add(Q, nrm, side), shift), add(add(P, nrm, side), shift)];
                    pts = pts.map((q) => add(q, [0, -c * e2]));
                    // final vertical shear: corner points above Q's column drop to the hypotenuse level
                    const dy = (Q[1] - foot[1]) * e3;
                    pts = pts.map((q, i) => (i === 1 || i === 2 ? [q[0], q[1] - dy] : q));
                    return pts;
                  };
                  const els = [];
                  els.push(poly([A, B, add(B, [0, -c]), add(A, [0, -c])], { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  els.push(s('line', { x1: plot.X(AH), x2: plot.X(AH), y1: plot.Y(0), y2: plot.Y(-c), stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '3 5' }));
                  const pb = piece(A, C, [-0.6, 0.8], 4, Hf), pc = piece(B, C, [0.8, 0.6], 3, Hf);
                  els.push(poly(pb, { class: 'fl-blue', opacity: 0.6, stroke: 'var(--blue)', 'stroke-width': 2 }));
                  els.push(poly(pc, { class: 'fl-coral', opacity: 0.6, stroke: 'var(--coral)', 'stroke-width': 2 }));
                  els.push(poly([A, B, C], { class: 'fl-amber', stroke: 'var(--ink)', 'stroke-width': 2 }));
                  const mid = (pts) => [pts.reduce((a, q) => a + q[0], 0) / 4, pts.reduce((a, q) => a + q[1], 0) / 4];
                  const lab = ([x, y], text) => s('text', { x: plot.X(x), y: plot.Y(y) + 7, 'text-anchor': 'middle', class: 'lbl-math halo-text', style: 'font-size:max(calc(20px * var(--fs, 1)), var(--fmin, 0px))', text });
                  if (e2 < 0.3 || e3 > 0.7) els.push(lab(mid(pb), 'b²'), lab(mid(pc), 'a²'));
                  els.push(lab([AH / 2 + 0.9, -c - 0.55], e3 > 0.7 ? 'b² + a² = c²' : 'c²'));
                  return els;
                },
                readout: (p) => (p.t < 1.55 ? 'Shear: each square leans over. Same base, same height, same area.' : p.t < 2.8 ? 'Slide: move each shape straight down, through the triangle.' : 'Shear again: each one becomes a rectangle inside the big square.'),
              },
              after: r`The {blue:blue square} ($b^2$) becomes the left rectangle, and the {coral:coral square} ($a^2$) the right one. Together they fill the square on the hypotenuse exactly, so $a^2 + b^2 = c^2$. The dotted line, the altitude from the right angle, is where the two rectangles meet. This is Euclid's proof (Book I, Proposition 47), animated: instead of shuffling triangles, every step keeps the area fixed.`,
            },
            {
              type: 'numeric',
              title: 'Find the hypotenuse',
              prompt: r`A right triangle has legs 5 and 12. How long is the hypotenuse?`,
              answer: 13,
              wrong: [
                { v: 17, why: 'You added the sides. Add their squares, then take the square root.' },
                { v: 169, why: r`That's $c^2$. Take the square root.` },
              ],
              explain: r`$c^2 = 5^2 + 12^2 = 25 + 144 = 169$, so $c = \sqrt{169} = 13$.`,
            },
            {
              type: 'numeric',
              title: 'Find a leg',
              prompt: r`The hypotenuse of a right triangle is 10 and one leg is 6. How long is the other leg?`,
              answer: 8,
              wrong: [
                { v: Math.sqrt(136), tol: 0.01, why: r`The hypotenuse is the longest side, so subtract: $10^2 - 6^2$.` },
                { v: 4, why: r`You can't just subtract the lengths. Subtract their squares: $100 - 36$.` },
              ],
              explain: r`$b^2 = c^2 - a^2 = 100 - 36 = 64$, so $b = 8$.`,
            },
            {
              type: 'mcq',
              title: 'Is it right?',
              body: r`The theorem also works backwards: if $a^2 + b^2 = c^2$, the triangle **has** a right angle.`,
              prompt: 'Which side lengths make a right triangle?',
              cols: 2,
              choices: [
                { t: '7, 24, 25', ok: true },
                { t: '5, 6, 7', why: r`$25 + 36 = 61 \ne 49$.` },
                { t: '2, 3, 4', why: r`$4 + 9 = 13 \ne 16$.` },
                { t: '6, 8, 11', why: r`$36 + 64 = 100 \ne 121$. (6, 8, 10 would work.)` },
              ],
              explain: r`$7^2 + 24^2 = 49 + 576 = 625 = 25^2$. ✓ Builders have long used this "converse" to make square corners. A rope with knots marking 3, 4 and 5 units, pulled tight, makes a right angle.`,
            },
            {
              type: 'numeric',
              title: 'Distance between points',
              prompt: r`How far apart are the points $(1, 2)$ and $(7, 10)$?`,
              answer: 10,
              wrong: [{ v: 14, why: r`That's $6 + 8$, walking around the corner. The straight-line distance uses $\sqrt{6^2 + 8^2}$.` }],
              explain: r`The horizontal gap is $7 - 1 = 6$ and the vertical gap is $10 - 2 = 8$. These are the legs of a right triangle: $\sqrt{36 + 64} = \sqrt{100} = 10$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ladder',
              body: r`A 5 m ladder leans against a wall. Its foot is 1.4 m from the wall.`,
              prompt: 'How high up the wall does it reach?',
              unit: 'm',
              answer: 4.8,
              tol: 0.01,
              wrong: [
                { v: 3.6, tol: 0.01, why: 'Subtract the squares, not the lengths.' },
                { v: 5.19, tol: 0.02, why: 'The ladder is the hypotenuse, the longest side. Subtract the squares.' },
              ],
              explain: r`$h^2 = 5^2 - 1.4^2 = 25 - 1.96 = 23.04$, so $h = 4.8$ m.`,
            },
          ],
          recap: [
            r`In a right triangle, $a^2 + b^2 = c^2$, where $c$ is the hypotenuse.`,
            'Rearranging four triangles inside a square proves it for every right triangle.',
            r`The converse: if $a^2 + b^2 = c^2$, the angle opposite $c$ is a right angle.`,
          ],
        },
      ],
    },
    {
      title: 'Circles and Scaling',
      summary: 'π, and what happens when shapes grow.',
      lessons: [
        {
          id: 'circles',
          title: 'Circles & π',
          summary: 'Where πr² comes from',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'One turn',
              body: r`A wheel 1 metre across rolls along the ground for exactly one full turn.`,
              prompt: 'About how far does it travel? (Give a decimal.)',
              unit: 'm',
              answer: Math.PI,
              tol: 0.06,
              wrong: [
                { v: 1, why: 'The distance is the wheel’s circumference, which is more than its width. Picture the edge unrolling onto the ground.' },
                { v: 2, tol: 0.05, why: 'A bit more than that. The circumference is just over 3 times the diameter.' },
              ],
              explain: r`One turn lays the whole rim down on the ground: the **circumference**. For a diameter of 1 m that's $\pi \approx 3.14$ m.`,
            },
            {
              type: 'explain',
              title: 'π is a ratio',
              body: r`For **every** circle, the circumference divided by the diameter is the same number:
$$\pi = \frac{C}{d} \approx 3.14159\ldots$$
So $C = \pi d = 2\pi r$. Change the size: the ratio never changes.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.4, xmax: 3.4, ymin: -3.2, ymax: 3.2, grid: 1, axes: false,
                params: { R: { min: 0.5, max: 3, step: 0.1, value: 2, label: '$r$', color: 'blue' } },
                curves: [{ param: { x: (t, p) => p.R * Math.cos(t), y: (t, p) => p.R * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'blue' }],
                extra: ({ plot, p, s }) => [seg(plot, s, [-p.R, 0], [p.R, 0], { stroke: 'var(--coral)', 'stroke-width': 3 })],
                readout: (p) => r`$C = ${(2 * Math.PI * p.R).toFixed(2)},\ d = ${(2 * p.R).toFixed(1)},\ C/d = ${((2 * Math.PI * p.R) / (2 * p.R)).toFixed(5)}$`,
              },
            },
            {
              type: 'explain',
              title: 'Unrolling the area',
              body: r`Cut a circle into equal slices, like a pizza. Then arrange them in a row, alternating tip-up and tip-down. Add more slices:`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.4, xmax: 3.6, ymin: -0.25, ymax: 1.3, grid: false, axes: false,
                params: { n: { min: 4, max: 60, step: 2, value: 8, label: 'slices', color: 'coral', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const rr = 1, th = (2 * Math.PI) / p.n, c = 2 * rr * Math.sin(th / 2), hh = rr * Math.cos(th / 2);
                  const els = [];
                  const sector = (apex, dir, cls) => {
                    // dir = +1: tip at the bottom, arc on top; -1: tip at the top
                    const a0 = dir > 0 ? Math.PI / 2 + th / 2 : -Math.PI / 2 + th / 2;
                    const a1 = dir > 0 ? Math.PI / 2 - th / 2 : -Math.PI / 2 - th / 2;
                    const P = (a) => [apex[0] + rr * Math.cos(a), apex[1] + rr * Math.sin(a)];
                    const p0 = P(a0), p1 = P(a1);
                    const R = plot.X(rr) - plot.X(0);
                    return s('path', { d: `M${plot.X(apex[0])} ${plot.Y(apex[1])} L${plot.X(p0[0])} ${plot.Y(p0[1])} A${R} ${R} 0 0 1 ${plot.X(p1[0])} ${plot.Y(p1[1])} Z`, class: cls, opacity: 0.75, stroke: 'var(--card)', 'stroke-width': 1 });
                  };
                  for (let j = 0; j < p.n / 2; j++) {
                    els.push(sector([j * c + c / 2, 0], 1, 'fl-blue'));
                    els.push(sector([j * c + c, hh], -1, 'fl-coral'));
                  }
                  const width = (p.n / 2) * c;
                  els.push(seg(plot, s, [c / 2, -0.12], [c / 2 + width, -0.12], { stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(label(plot, s, [c / 2 + width / 2, -0.12], `≈ half the circumference = πr`, 0, 18, { style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }));
                  return els;
                },
                readout: (p) => r`Width $\approx ${((p.n / 2) * 2 * Math.sin(Math.PI / p.n)).toFixed(3)}$ (and $\pi = 3.142$), height $\approx ${Math.cos(Math.PI / p.n).toFixed(3)}$ (for $r = 1$)`,
              },
              after: r`With more slices, the shape becomes a **rectangle**. Its height is the radius $r$. Its width is half the circumference, $\pi r$, because half the crust is along the top and half along the bottom. So
$$A = \pi r \times r = \pi r^2.$$`,
            },
            {
              type: 'numeric',
              title: 'Area',
              prompt: 'A circle has radius 3. Its area is how many times π?',
              lhs: r`$A =$`,
              unit: r`$\times\,\pi$`,
              answer: 9,
              wrong: [
                { v: 6, why: r`That's $2r$, used for the circumference. Area uses $r^2$.` },
                { v: 36, why: r`$\pi r^2$ uses the radius, 3, not the diameter, 6.` },
              ],
              explain: r`$A = \pi r^2 = \pi \times 3^2 = 9\pi \approx 28.3$.`,
            },
            {
              type: 'mcq',
              title: 'Pizza deal',
              prompt: 'Which gives you more pizza: one 16-inch pizza, or two 10-inch pizzas? (The sizes are diameters.)',
              choices: [
                { t: 'One 16-inch pizza', ok: true },
                { t: 'Two 10-inch pizzas', why: r`It feels like 20 inches beats 16, but area grows with the **square** of the radius: $8^2 = 64$ vs $2 \times 5^2 = 50$.` },
                { t: 'They’re the same', why: r`Compare the areas: $64\pi$ and $50\pi$.` },
              ],
              explain: r`16-inch: $\pi \times 8^2 = 64\pi$. Two 10-inch: $2 \times \pi \times 5^2 = 50\pi$. The single large pizza has about 28% more.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rope around the Earth',
              body: r`A rope is wrapped tightly around Earth's equator, about 40,000 km long. You want to raise it so it floats 1 metre above the ground **all the way around**.`,
              prompt: 'How much extra rope do you need?',
              unit: 'm',
              answer: 2 * Math.PI,
              tol: 0.05,
              wrong: [
                { v: 1, why: r`The radius goes up by 1 m, but the circumference is $2\pi r$, so it grows by $2\pi \times 1$.` },
                { v: Math.PI, tol: 0.05, why: r`Circumference is $2\pi r$, not $\pi r$.` },
              ],
              explain: r`$C = 2\pi r$. Raising the rope by 1 m increases $r$ by 1, so $C$ grows by $2\pi \times 1 \approx 6.28$ m. That's only about 6 metres, however big the planet is! The answer doesn't depend on Earth's size at all.`,
            },
          ],
          recap: [
            r`$\pi = C / d$ for every circle, so $C = 2\pi r$.`,
            r`Slicing a circle and rearranging the slices gives a rectangle of $\pi r \times r$, so $A = \pi r^2$.`,
            'Area grows with the square of the radius.',
          ],
        },
        {
          id: 'scaling',
          title: 'Scaling',
          summary: 'Similar shapes and the square–cube law',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Double it',
              prompt: 'You double every side of a square. What happens to its area?',
              cols: 2,
              choices: [
                { t: 'It becomes 4 times as big', ok: true },
                { t: 'It doubles', why: 'Both the width **and** the height double: 2 × 2.' },
                { t: 'It becomes 8 times as big', why: r`8 would be for a cube's volume: $2 \times 2 \times 2$.` },
              ],
              explain: r`A $1 \times 1$ square becomes a $2 \times 2$ square, which holds four of the original.`,
            },
            {
              type: 'explain',
              title: 'Lengths, areas, volumes',
              body: r`Scale a shape by a factor $k$ (keeping its proportions) and you get a **similar** shape:

- lengths multiply by $k$,
- areas multiply by $k^2$,
- volumes multiply by $k^3$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 9, ymin: -0.3, ymax: 4.6, grid: 1, axes: false,
                params: { k: { min: 1, max: 4, step: 0.5, value: 2, label: '$k$', color: 'violet' } },
                extra: ({ plot, p, s }) => [
                  poly(plot, s, [[0, 0], [1, 0], [1, 1], [0, 1]], { class: 'fl-blue', opacity: 0.6, stroke: 'var(--blue)', 'stroke-width': 2 }),
                  poly(plot, s, [[2, 0], [2 + p.k, 0], [2 + p.k, p.k], [2, p.k]], { class: 'fl-violet', opacity: 0.25, stroke: 'var(--violet)', 'stroke-width': 3 }),
                ],
                readout: (p) => r`side $\times ${fix(p.k, 1)}$, $\;$ area $\times ${fix(p.k * p.k, 2)}$, $\;$ volume of a cube $\times ${fix(p.k ** 3, 3)}$`,
              },
            },
            {
              type: 'numeric',
              title: 'Similar triangles',
              body: r`A triangle has sides 3, 4 and 5. A similar triangle has a shortest side of 9.`,
              prompt: 'How long is its longest side?',
              answer: 15,
              wrong: [{ v: 11, why: r`Similar shapes are **multiplied**, not added to. $9 / 3 = 3$, so every side is 3 times as long.` }],
              explain: r`The scale factor is $9 / 3 = 3$, so the longest side is $5 \times 3 = 15$.`,
            },
            {
              type: 'numeric',
              title: 'Shadows',
              body: r`A 2 m pole casts a 3 m shadow. At the same moment, a tree casts a 15 m shadow. The sun's rays make the same angle for both, so the triangles are similar.`,
              widget: {
                kind: 'figure', w: 600, h: 230, label: 'Pole and tree with shadows',
                draw: ({ s }) => [
                  s('line', { x1: 20, y1: 200, x2: 580, y2: 200, stroke: 'var(--ink)', 'stroke-width': 3 }),
                  s('line', { x1: 60, y1: 200, x2: 60, y2: 166, stroke: 'var(--ink)', 'stroke-width': 5 }),
                  s('line', { x1: 60, y1: 166, x2: 111, y2: 200, stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
                  s('line', { x1: 60, y1: 205, x2: 111, y2: 205, stroke: 'var(--ink-3)', 'stroke-width': 6 }),
                  s('text', { x: 46, y: 186, 'text-anchor': 'end', class: 'lbl', text: '2 m' }),
                  s('text', { x: 86, y: 224, 'text-anchor': 'middle', class: 'lbl', text: '3 m' }),
                  s('line', { x1: 230, y1: 200, x2: 230, y2: 30, stroke: 'var(--teal)', 'stroke-width': 8 }),
                  s('circle', { cx: 230, cy: 50, r: 34, class: 'fl-teal', opacity: 0.6 }),
                  s('line', { x1: 230, y1: 30, x2: 485, y2: 200, stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
                  s('line', { x1: 230, y1: 205, x2: 485, y2: 205, stroke: 'var(--ink-3)', 'stroke-width': 6 }),
                  s('text', { x: 360, y: 224, 'text-anchor': 'middle', class: 'lbl', text: '15 m' }),
                  s('text', { x: 214, y: 120, 'text-anchor': 'end', class: 'lbl', text: '?' }),
                ],
              },
              prompt: 'How tall is the tree?',
              unit: 'm',
              answer: 10,
              wrong: [
                { v: 22.5, why: r`The tree's shadow is 5 times the pole's shadow, so the tree is 5 times the pole's height: $5 \times 2$.` },
                { v: 14, why: 'Similar triangles scale by multiplying, not by adding.' },
              ],
              explain: r`The tree's shadow is $15 / 3 = 5$ times as long, so the tree is $5 \times 2 = 10$ m tall. Thales of Miletus is said to have measured the height of an Egyptian pyramid in just this way, around 600 BC.`,
            },
            {
              type: 'numeric',
              title: 'Map area',
              body: r`On a 1 : 50,000 map, 2 cm represents 1 km.`,
              prompt: 'A square park measures 2 cm by 2 cm on the map. What is its real area?',
              unit: 'km²',
              answer: 1,
              wrong: [
                { v: 4, why: r`2 cm on the map is 1 km in real life, so the park is $1 \times 1$ km.` },
                { v: 2, why: 'Each side is 1 km, so the area is 1 km × 1 km.' },
              ],
              explain: r`Each 2 cm side is 1 km, so the park is $1 \text{ km} \times 1 \text{ km} = 1$ km². Its map area is 4 cm², and the area scale factor is $50{,}000^2 = 2.5$ billion.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why giants can’t exist',
              body: r`Imagine a giant built exactly like a human, but 10 times as tall. Their weight depends on their volume. The strength of their leg bones depends on the bones' cross-sectional area.`,
              prompt: 'How does the stress on the giant’s bones compare with a human’s?',
              choices: [
                { t: '10 times greater', ok: true },
                { t: 'The same', why: r`Weight grows by $10^3 = 1000$, but bone area only by $10^2 = 100$.` },
                { t: '100 times greater', why: r`Stress is force per area: $1000 / 100 = 10$.` },
                { t: '1000 times greater', why: r`The weight is 1000 times greater, but it's spread over bones with 100 times the area.` },
              ],
              explain: r`Weight $\times 10^3 = 1000$. Bone cross-section $\times 10^2 = 100$. Stress (force per area) $\times \frac{1000}{100} = 10$. The giant's bones would snap.

Galileo made this argument in 1638. It's why elephants have proportionally much thicker legs than gazelles, and why insects can be so strong for their size.`,
            },
          ],
          recap: [
            r`Scaling by $k$ multiplies lengths by $k$, areas by $k^2$, and volumes by $k^3$.`,
            'Similar triangles have matching angles and proportional sides. That’s why shadows can measure heights.',
            'The square–cube law limits how big animals and structures can get.',
          ],
        },
      ],
    },
    {
      title: 'Moving and Measuring',
      summary: 'Transformations, congruence and coordinates.',
      lessons: [
        {
          id: 'transformations',
          title: 'Transformations',
          summary: 'Slide, flip and turn',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Rigid motions',
              body: r`Three ways to move a shape without changing its size or shape:

- **Translation**: slide every point the same distance in the same direction.
- **Reflection**: flip across a mirror line; each point lands the same distance away on the other side.
- **Rotation**: turn about a fixed centre by some angle.

Shapes that can be matched by these moves are **congruent**: identical copies.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Turn to match',
              prompt: r`Rotate the blue shape about the origin (the black dot) until it lands exactly on the dashed outline.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -1, ymax: 5, grid: 1, axes: false, maxWidth: 520,
                params: { a: { min: 0, max: 345, step: 15, value: 0, label: 'rotation', color: 'blue', format: (v) => `${v}° anticlockwise` } },
                extra: ({ plot, p, s }) => [
                  poly(plot, s, LSHAPE.map((q) => rot(q, 90)), { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }),
                  poly(plot, s, LSHAPE.map((q) => rot(q, p.a)), { class: 'fl-blue', opacity: 0.55, stroke: 'var(--blue)', 'stroke-width': 2.5 }),
                  s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-ink' }),
                ],
                readout: (p) => r`rotated $${p.a}°$ about the origin`,
                goal: (p) => p.a === 90,
                hint: 'The outline has been turned a quarter-turn anticlockwise.',
                solution: { a: 90 },
              },
              explain: r`A quarter-turn: $90°$ anticlockwise. Every point stays the same distance from the centre, so lengths and angles are preserved. A rotation of $90°$ sends the point $(x, y)$ to $(-y, x)$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Mirror image',
              prompt: r`Drag the coral point to the reflection of $A(2, 5)$ in the dashed mirror line $y = x$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 7, ymin: 0, ymax: 7, grid: 1, maxWidth: 420,
                params: { x: { min: 0, max: 7, step: 0.5, value: 4, slider: false }, y: { min: 0, max: 7, step: 0.5, value: 6, slider: false } },
                curves: [{ f: (x) => x, color: 'ink', dash: true, width: 2 }],
                points: [{ x: () => 2, y: () => 5, color: 'blue', label: 'A', labelDx: -14, labelDy: -10 }, { x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral', label: "A'", labelDx: 12, labelDy: -10 }],
                readout: (p) => r`$A' = (${fix(p.x, 1)}, ${fix(p.y, 1)})$`,
                goal: (p) => p.x === 5 && p.y === 2,
                hint: 'Reflecting in y = x swaps the coordinates.',
                solution: { x: 5, y: 2 },
              },
              explain: r`$(2, 5) \to (5, 2)$: reflecting in $y = x$ swaps the coordinates. The segment $AA'$ is perpendicular to the mirror and cut in half by it, as for every reflection.`,
            },
            {
              type: 'numeric',
              title: 'Symmetry',
              prompt: r`How many lines of reflective symmetry does a regular hexagon have?`,
              answer: 6,
              wrong: [{ v: 3, why: 'There are 3 lines through opposite corners and 3 more through the midpoints of opposite sides.' }, { v: 12, why: 'That counts its symmetries including rotations. Count only mirror lines.' }],
              explain: r`Three mirror lines through opposite vertices and three through midpoints of opposite edges: 6. It also has rotational symmetry of order 6 (turns of $60°$). A regular $n$-gon always has $n$ mirror lines.`,
            },
            {
              type: 'numeric',
              title: 'Two mirrors make a turn',
              prompt: r`Reflecting in one line and then in a second line that crosses it at $30°$ gives a rotation about the crossing point. By what angle?`,
              unit: '°',
              answer: 60,
              explain: r`Twice the angle between the mirrors: $60°$. Kaleidoscopes use this: two mirrors at $60°$ split the view into 6 wedges, the original plus 5 reflected copies, built from rotations by $120°$ and reflections.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Two mirrors',
              prompt: r`Reflect a shape in one mirror line, then reflect the result in a second mirror line **parallel** to the first, 3 cm away. What single move has the same effect?`,
              choices: [
                { t: 'A translation of 6 cm, perpendicular to the mirrors', ok: true },
                { t: 'A translation of 3 cm', why: 'Track a point: it ends up twice the gap between the mirrors away.' },
                { t: 'A rotation of 180°', why: 'That’s what happens when the two mirrors cross at right angles. Parallel mirrors give a translation.' },
              ],
              explain: r`A point at distance $d$ from the first mirror moves to the far side, then the second reflection carries it on: overall it shifts $2 \times 3 = 6$ cm. Two reflections in **crossing** mirrors give a rotation by twice the angle between them.`,
            },
          ],
          recap: [
            'Translations, reflections and rotations preserve lengths and angles.',
            r`Reflection in $y = x$ swaps coordinates; rotating $90°$ sends $(x, y)$ to $(-y, x)$.`,
            'Two reflections make a translation (parallel mirrors) or a rotation (crossing mirrors).',
          ],
        },
        {
          id: 'congruence',
          title: 'Congruence & Similarity',
          summary: 'When are two triangles the same?',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Enough information',
              body: r`How much do you need to know to pin down a triangle completely? Any of these is enough to guarantee two triangles are **congruent**:

- **SSS**: all three sides match.
- **SAS**: two sides and the angle **between** them match.
- **ASA**: two angles and the side between them match.

But beware **SSA**: two sides and an angle that isn't between them.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The ambiguous case',
              prompt: r`The dashed triangle has $AB = 5$, angle $A = 30°$ and $BC = 3$. Slide $C$ along the ray to find a **different** triangle with exactly the same three measurements.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 6.5, ymin: -0.7, ymax: 3.6, grid: false, axes: false, maxWidth: 540,
                params: { t: { min: 1, max: 6.5, step: 0.01, value: 4, label: 'AC', color: 'coral', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => {
                  const C1 = SSA_C(2.672), C = SSA_C(p.t), R = SSA_C(6.6);
                  return [
                    seg(plot, s, [0, 0], R, { stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }),
                    poly(plot, s, [[0, 0], [5, 0], C1], { fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    poly(plot, s, [[0, 0], [5, 0], C], { class: 'fl-coral', opacity: 0.25, stroke: 'var(--coral)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(5), cy: plot.Y(0), r: (plot.X(3) - plot.X(0)), fill: 'none', stroke: 'var(--teal)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                    label(plot, s, [0, 0], 'A', -10, 18), label(plot, s, [5, 0], 'B', 10, 18), label(plot, s, C, 'C', 0, -12),
                  ];
                },
                readout: (p) => r`$AB = 5$, $\angle A = 30°$, $BC = ${SSA_BC(p.t).toFixed(2)}$`,
                goal: (p) => Math.abs(SSA_BC(p.t) - 3) < 0.02 && p.t > 4.5,
                hint: 'C must lie on the teal circle (distance 3 from B). Where else does the ray cross it?',
                solution: { t: 5.99 },
              },
              explain: r`The ray crosses the circle of radius 3 around $B$ **twice**, at $AC \approx 2.67$ and $AC \approx 5.99$. Same SSA data, two different triangles: that's why SSA is not a congruence rule.`,
            },
            {
              type: 'explain',
              title: 'Similar triangles',
              body: r`Two triangles are **similar** (same shape, possibly different size) if their angles match. Since angles add to $180°$, matching **two** angles is enough: the **AA** rule. Similar triangles have all their sides in the same ratio.

A beautiful example: draw the altitude from the right angle of a right triangle to the hypotenuse. It splits the triangle into two smaller triangles, **both similar to the original**.`,
            },
            {
              type: 'numeric',
              title: 'The altitude',
              prompt: r`In a right triangle, the altitude to the hypotenuse divides it into pieces of length 4 and 9. By similarity, the altitude $h$ satisfies $\frac{h}{4} = \frac{9}{h}$. How long is $h$?`,
              answer: 6,
              wrong: [{ v: 6.5, why: r`That's the average. Similarity gives $h^2 = 4 \times 9$.` }, { v: 36, why: r`That's $h^2$. Take the square root.` }],
              explain: r`$h^2 = 4 \times 9 = 36$, so $h = 6$: the **geometric mean** of the two pieces. It's the same construction that gives $\sqrt{ab}$ with a semicircle.`,
            },
            {
              type: 'numeric',
              title: 'Measuring a tree',
              prompt: r`A 2 m pole casts a 3 m shadow. At the same moment, a tree casts an 18 m shadow. How tall is the tree?`,
              unit: 'm',
              answer: 12,
              explain: r`The sunlight makes similar triangles, so $\frac{h}{18} = \frac23$ and $h = 12$ m. Thales is said to have measured the height of a pyramid this way.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Areas of similar triangles',
              prompt: r`Two similar triangles have corresponding sides 6 cm and 9 cm. The smaller has area 20 cm². What is the larger triangle's area?`,
              unit: r`$\text{cm}^2$`,
              answer: 45,
              wrong: [{ v: 30, why: r`Areas scale by the **square** of the length ratio: $\left(\frac96\right)^2 = 2.25$.` }],
              explain: r`Length ratio $\frac96 = 1.5$, so the area ratio is $1.5^2 = 2.25$: $20 \times 2.25 = 45$ cm².`,
            },
          ],
          recap: [
            'SSS, SAS and ASA guarantee congruence; SSA can give two different triangles.',
            'Two matching angles (AA) guarantee similarity; similar triangles have proportional sides.',
            'The altitude to the hypotenuse is the geometric mean of the two pieces.',
          ],
        },
        {
          id: 'coordinates',
          title: 'Coordinate Geometry',
          summary: 'Geometry with numbers',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Points as numbers',
              body: r`René Descartes' great idea (1637): describe every point by coordinates $(x, y)$. Then geometry becomes algebra.

- **Midpoint** of $(x_1, y_1)$ and $(x_2, y_2)$: average the coordinates, $\left(\frac{x_1 + x_2}{2}, \frac{y_1 + y_2}{2}\right)$.
- **Distance**: Pythagoras on the horizontal and vertical gaps, $\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Halfway',
              prompt: r`Drag the point to the midpoint of $A(1, 1)$ and $B(7, 5)$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 8, ymin: 0, ymax: 6, grid: 1, maxWidth: 480,
                params: { x: { min: 0, max: 8, step: 0.5, value: 6, slider: false }, y: { min: 0, max: 6, step: 0.5, value: 2, slider: false } },
                extra: ({ plot, s }) => [seg(plot, s, [1, 1], [7, 5], { stroke: 'var(--ink-3)', 'stroke-width': 2 })],
                points: [{ x: () => 1, y: () => 1, color: 'blue', label: 'A', labelDx: -12, labelDy: 16 }, { x: () => 7, y: () => 5, color: 'blue', label: 'B', labelDx: 12, labelDy: -8 }, { x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral' }],
                readout: (p) => r`$(${fix(p.x, 1)}, ${fix(p.y, 1)})$: distance to $A$ = ${Math.hypot(p.x - 1, p.y - 1).toFixed(2)}, to $B$ = ${Math.hypot(p.x - 7, p.y - 5).toFixed(2)}`,
                goal: (p) => p.x === 4 && p.y === 3,
                hint: 'Average the x-coordinates, and average the y-coordinates.',
                solution: { x: 4, y: 3 },
              },
              explain: r`$\left(\frac{1 + 7}{2}, \frac{1 + 5}{2}\right) = (4, 3)$: equally far from both ends, and on the segment.`,
            },
            {
              type: 'numeric',
              title: 'Distance',
              prompt: r`How far apart are the points $(-2, 1)$ and $(10, 6)$?`,
              answer: 13,
              wrong: [{ v: 17, why: 'That’s the horizontal plus vertical distance. The straight-line distance uses Pythagoras.' }, { v: 169, why: 'That’s the distance squared.' }],
              explain: r`Gaps: $10 - (-2) = 12$ across and $6 - 1 = 5$ up, so $\sqrt{144 + 25} = \sqrt{169} = 13$. Watch the signs when a coordinate is negative.`,
            },
            {
              type: 'mcq',
              title: 'Perpendicular slopes',
              prompt: r`A line has slope 2. What is the slope of a line perpendicular to it?`,
              cols: 4,
              choices: [
                { t: r`$-\tfrac12$`, ok: true },
                { t: r`$-2$`, why: 'Perpendicular slopes multiply to −1: 2 × (−1/2) = −1.' },
                { t: r`$\tfrac12$`, why: 'Turning by 90° also flips the sign.' },
                { t: '2', why: 'That’s a parallel line.' },
              ],
              explain: r`Rotating a line by $90°$ turns "1 across, 2 up" into "2 back, 1 up": slope $-\tfrac12$. Perpendicular slopes multiply to $-1$.`,
            },
            {
              type: 'numeric',
              title: 'Equation of a line',
              prompt: r`A line passes through $(1, 2)$ and $(3, 8)$. Its slope is 3. Where does it cross the $y$-axis?`,
              answer: -1,
              explain: r`$y = 3x + c$ through $(1, 2)$ gives $c = 2 - 3 = -1$, so the line is $y = 3x - 1$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Area from coordinates',
              prompt: r`Find the area of the triangle with corners $(0, 0)$, $(4, 0)$ and $(1, 3)$.`,
              answer: 6,
              wrong: [{ v: 12, why: r`Area of a triangle is **half** base × height: $\frac12 \times 4 \times 3$.` }],
              explain: r`The base along the x-axis is 4 and the height (the y-coordinate of the top corner) is 3: $\frac12 \times 4 \times 3 = 6$. For any triangle, the "shoelace formula" $\tfrac12|x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|$ gives the area straight from coordinates.`,
            },
          ],
          recap: [
            'Midpoint: average the coordinates. Distance: Pythagoras on the gaps.',
            'Perpendicular slopes multiply to −1.',
            'Coordinates turn geometric questions into algebra.',
          ],
        },
      ],
    },
  ],
};
