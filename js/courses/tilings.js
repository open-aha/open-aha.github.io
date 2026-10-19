import { fix } from '../lib/svg.js';

const r = String.raw;
const PHI = (1 + Math.sqrt(5)) / 2;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

// a regular n-gon with side 1, one vertex at the origin, first edge leaving at angle th (radians)
function ngon(n, th) {
  const pts = [[0, 0]];
  let x = 0, y = 0, a = th;
  for (let i = 0; i < n - 1; i++) {
    x += Math.cos(a);
    y += Math.sin(a);
    pts.push([x, y]);
    a += (2 * Math.PI) / n;
  }
  return pts;
}
const interior = (n) => ((n - 2) * 180) / n;

// Penrose rhombus tiling by repeatedly subdividing Robinson triangles
function penrose(levels) {
  const C = (re, im) => ({ re, im });
  const add = (a, b) => C(a.re + b.re, a.im + b.im), sub = (a, b) => C(a.re - b.re, a.im - b.im), mul = (a, k) => C(a.re * k, a.im * k);
  let tris = [];
  for (let i = 0; i < 10; i++) {
    let B = C(Math.cos(((2 * i - 1) * Math.PI) / 10), Math.sin(((2 * i - 1) * Math.PI) / 10));
    let D = C(Math.cos(((2 * i + 1) * Math.PI) / 10), Math.sin(((2 * i + 1) * Math.PI) / 10));
    if (i % 2 === 0) [B, D] = [D, B];
    tris.push([0, C(0, 0), B, D]);
  }
  for (let l = 0; l < levels; l++) {
    const next = [];
    for (const [c, A, B, D] of tris) {
      if (c === 0) {
        const P = add(A, mul(sub(B, A), 1 / PHI));
        next.push([0, D, P, B], [1, P, D, A]);
      } else {
        const Q = add(B, mul(sub(A, B), 1 / PHI));
        const R = add(B, mul(sub(D, B), 1 / PHI));
        next.push([1, R, D, A], [1, Q, R, B], [0, R, Q, A]);
      }
    }
    tris = next;
  }
  return tris;
}

const polyPath = (plot, pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z';
// quadrilateral ABCD (A, B fixed): is it simple, and is it convex?
function quadInfo(P) {
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const segX = (p1, p2, p3, p4) => cr(p3, p4, p1) * cr(p3, p4, p2) < 0 && cr(p1, p2, p3) * cr(p1, p2, p4) < 0;
  const simple = !segX(P[0], P[1], P[2], P[3]) && !segX(P[1], P[2], P[3], P[0]);
  const turns = [0, 1, 2, 3].map((i) => cr(P[i], P[(i + 1) % 4], P[(i + 2) % 4]));
  return { simple, convex: turns.every((t) => t > 0) || turns.every((t) => t < 0) };
}
// frieze patterns: [name, period, transforms]
const FRIEZES = [
  ['hop', 1, [(x, y) => [x, y]]],
  ['step', 2, [(x, y) => [x, y], (x, y) => [x + 1, -y]]],
  ['sidle', 2, [(x, y) => [x, y], (x, y) => [2 - x, y]]],
  ['spinning hop', 2, [(x, y) => [x, y], (x, y) => [2 - x, -y]]],
  ['spinning sidle', 4, [(x, y) => [x, y], (x, y) => [2 - x, y], (x, y) => [x + 2, -y], (x, y) => [4 - x, -y]]],
  ['jump', 1, [(x, y) => [x, y], (x, y) => [x, -y]]],
  ['spinning jump', 2, [(x, y) => [x, y], (x, y) => [x, -y], (x, y) => [2 - x, y], (x, y) => [2 - x, -y]]],
];
const FLAG = [[0.15, 0.1], [0.15, 0.9], [0.8, 0.72], [0.38, 0.56], [0.38, 0.1]];
// all domino tilings of a 2 × n strip, as strings of V (one upright) and H (two lying flat)
const dominoTilings = (n) => (n === 0 ? [''] : n === 1 ? ['V'] : [...dominoTilings(n - 1).map((t) => 'V' + t), ...dominoTilings(n - 2).map((t) => 'H' + t)]);

export default {
  id: 'tilings',
  subject: 'math',
  title: 'Tilings & Patterns',
  level: 'Intermediate',
  cover: 'tilings',
  tagline: 'Which shapes tile the plane, Escher’s tricks, friezes, and patterns that never repeat.',
  description: r`Bathroom floors, honeycombs, Islamic mosaics and Escher prints all solve the same puzzle: covering a flat surface with no gaps or overlaps. Discover why only three regular polygons tile, why five-fold symmetry can't repeat, the seven kinds of frieze, the astonishing tilings that never repeat at all, and how to design your own Escher tile.`,
  prereq: 'Geometry: Visual Proofs',
  chapters: [
    {
      title: 'Covering the Plane',
      summary: 'Regular and semi-regular tilings.',
      lessons: [
        {
          id: 'regular',
          title: 'Regular Tilings',
          summary: 'Why only three polygons work',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Meeting at a point',
              body: r`A **tiling** covers the plane with shapes, leaving no gaps and no overlaps. Try tiling with copies of a single **regular polygon** (all sides and angles equal). At every corner, the angles that meet must add up to exactly 360°. Change the number of sides.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.6, xmax: 2.6, ymin: -2.6, ymax: 2.6, grid: false, axes: false, maxWidth: 420,
                params: { n: { min: 3, max: 12, step: 1, value: 5, label: 'sides', color: 'blue', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const a = interior(p.n), fit = 360 / a, k = Math.floor(fit + 1e-9);
                  const exact = Math.abs(fit - Math.round(fit)) < 1e-9;
                  const els = [];
                  const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z';
                  const cls = ['fl-blue-soft', 'fl-teal-soft', 'fl-amber-soft', 'fl-violet-soft', 'fl-pink-soft', 'fl-coral-soft'];
                  for (let j = 0; j < k; j++) els.push(s('path', { d: path(ngon(p.n, (j * a * Math.PI) / 180)), class: cls[j % cls.length], stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
                  if (!exact) els.push(s('path', { d: path(ngon(p.n, (k * a * Math.PI) / 180)), fill: 'var(--coral)', opacity: 0.25, stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => {
                  const a = interior(p.n), fit = 360 / a;
                  return Math.abs(fit - Math.round(fit)) < 1e-9
                    ? r`Each angle is $${f2(a)}°$, and $${Math.round(fit)} \times ${f2(a)}° = 360°$: **it tiles!**`
                    : r`Each angle is $${f2(a)}°$, and $360 / ${f2(a)} = ${f2(fit)}$ isn't a whole number, so there's a gap (the dashed copy would overlap).`;
                },
              },
              after: r`Only **triangles** (6 at a corner), **squares** (4) and **hexagons** (3) work. For 7 or more sides, each angle is over 120°, so fewer than 3 fit, but you need at least 3 to surround a point.`,
            },
            {
              type: 'numeric',
              title: 'Interior angles',
              prompt: r`The interior angle of a regular $n$-gon is $\dfrac{(n - 2) \times 180°}{n}$. What is it for a regular pentagon?`,
              unit: '°',
              answer: 108,
              wrong: [{ v: 72, why: r`That's the **exterior** angle, $360°/5$. The interior angle is $180° - 72°$.` }, { v: 540, why: 'That’s the sum of all five angles. Divide by 5.' }],
              explain: r`$\dfrac{3 \times 180°}{5} = 108°$. Three pentagons make 324° (a gap of 36°) and four make 432° (overlap), so pentagons can't tile alone.`,
            },
            {
              type: 'numeric',
              title: 'Which polygon?',
              prompt: r`A regular polygon has interior angles of $140°$. How many sides does it have?`,
              answer: 9,
              wrong: [{ v: 7, why: r`A heptagon's angle is $\frac{5 \times 180°}{7} \approx 128.6°$.` }, { v: 40, why: r`$40°$ is the exterior angle, $180° - 140°$. The exterior angles add up to $360°$.` }],
              hint: r`Each exterior angle is $180° - 140° = 40°$, and the exterior angles of any polygon add up to $360°$.`,
              explain: r`The exterior angle is $40°$, and walking once around a polygon turns you through $360°$, so there are $\frac{360}{40} = 9$ sides: a nonagon. Since $360 / 140$ isn't a whole number, nonagons can't tile.`,
            },
            {
              type: 'mcq',
              title: 'Too little, too much',
              prompt: r`Three regular pentagons at a corner leave a $36°$ gap. What happens if you close the gap by folding the pentagons up out of the plane, and keep going?`,
              choices: [
                { t: 'They close up into a ball: a dodecahedron', ok: true },
                { t: 'They make a flat tiling after all', why: 'Folding up takes them out of the plane. Corners with less than 360° curve the surface like a sphere.' },
                { t: 'They overlap and fail', why: 'Folded up, 3 pentagons fit perfectly at every corner, closing up after 12 pentagons.' },
              ],
              explain: r`Corners with **less** than 360° bend the surface into a ball: 12 pentagons make a dodecahedron. Corners with **more** than 360° make the surface ruffle like a lettuce leaf: that's the **hyperbolic plane**, where 7 triangles can meet at every corner. M. C. Escher's *Circle Limit* prints show tilings of the hyperbolic plane.`,
            },
            {
              type: 'numeric',
              title: 'A twelve-sided corner',
              prompt: r`What is each interior angle of a regular 12-gon?`,
              unit: '°',
              answer: 150,
              explain: r`$\frac{(12 - 2) \times 180°}{12} = 150°$. Two of them leave $60°$, exactly room for a triangle: that’s the 3.12.12 tiling.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why hexagons?',
              prompt: r`Bees build hexagonal cells. Of the three regular tilings, what's special about hexagons?`,
              choices: [
                { t: 'They enclose the most area for a given amount of wall', ok: true },
                { t: 'They are the only shape that tiles', why: 'Triangles and squares also tile the plane.' },
                { t: 'They use the most wax', why: 'The opposite: for a given cell area, hexagons need the least wall.' },
              ],
              explain: r`Among all ways to divide the plane into equal-area cells, the hexagonal honeycomb uses the least total wall length. This "honeycomb conjecture" was finally proved by Thomas Hales in 1999. Bees save wax, and evolution found the answer long before mathematicians did.`,
            },
          ],
          recap: [
            'In a tiling, the angles meeting at each corner add up to 360°.',
            r`Regular $n$-gon interior angle: $\frac{(n-2) \cdot 180°}{n}$.`,
            'Only triangles, squares and hexagons tile on their own.',
          ],
        },
        {
          id: 'semiregular',
          title: 'Mixing Polygons',
          summary: 'Semi-regular tilings',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Octagons and squares',
              body: r`Allow different regular polygons, with the **same arrangement at every corner**. Here, every corner has one square and two octagons:`,
              widget: {
                kind: 'figure', w: 400, h: 260, maxWidth: 420, label: 'Tiling of octagons and squares',
                draw: ({ s }) => {
                  const a = 30, w = a * (1 + Math.SQRT2), els = [];
                  for (let i = -1; i < 7; i++) for (let j = -1; j < 5; j++) {
                    const cx = 20 + i * w, cy = 10 + j * w, h = w / 2, q = a / 2;
                    els.push(s('path', { d: `M${cx - q} ${cy - h} L${cx + q} ${cy - h} L${cx + h} ${cy - q} L${cx + h} ${cy + q} L${cx + q} ${cy + h} L${cx - q} ${cy + h} L${cx - h} ${cy + q} L${cx - h} ${cy - q} Z`, class: 'fl-blue-soft', stroke: 'var(--ink)', 'stroke-width': 2 }));
                    const sx = cx + h, sy = cy + h, d = a / Math.SQRT2;
                    els.push(s('path', { d: `M${sx} ${sy - d} L${sx + d} ${sy} L${sx} ${sy + d} L${sx - d} ${sy} Z`, class: 'fl-amber', stroke: 'var(--ink)', 'stroke-width': 2 }));
                  }
                  return els;
                },
              },
              after: r`This is written **4.8.8**: going around each corner, you meet a square (4 sides), then an octagon (8), then another octagon (8).`,
            },
            {
              type: 'numeric',
              title: 'Check the corner',
              prompt: r`Check that 4.8.8 works: what is the total of the angles at each corner? (A regular octagon's angle is 135°.)`,
              unit: '°',
              answer: 360,
              wrong: [{ v: 270, why: r`There are **two** octagons: $90° + 135° + 135°$.` }, { v: 225, why: r`Add all three angles: $90 + 135 + 135$.` }],
              explain: r`$90° + 135° + 135° = 360°$ ✓. Exactly 8 such **semi-regular** (Archimedean) tilings exist, using triangles, squares, hexagons, octagons and 12-gons. Kepler catalogued them in 1619.`,
            },
            {
              type: 'numeric',
              title: 'Fill the gap',
              prompt: r`A corner has one square ($90°$) and one regular hexagon ($120°$). One more regular polygon fills the remaining angle exactly. How many sides does it have?`,
              answer: 12,
              wrong: [{ v: 6, why: r`The gap is $360° - 90° - 120° = 150°$, larger than a hexagon's $120°$.` }, { v: 150, why: r`$150°$ is the angle. Which regular polygon has angles of $150°$?` }, { v: 8, why: r`An octagon's angle is $135°$, but the gap is $150°$.` }],
              hint: r`The gap is $150°$, so the exterior angle is $30°$.`,
              explain: r`The gap is $150°$, the angle of a regular 12-gon (exterior angle $30°$, and $360 / 30 = 12$). The corner **4.6.12** really does extend to a beautiful semi-regular tiling of squares, hexagons and 12-gons.`,
            },
            {
              type: 'mcq',
              title: 'How many?',
              prompt: r`Tilings by regular polygons where every corner looks exactly the same, using **two or more** kinds of polygon, are called semiregular (Archimedean). How many are there?`,
              choices: [
                { t: r`8`, ok: true },
                { t: r`3`, why: r`That’s the number of **regular** tilings (triangles, squares, hexagons).` },
                { t: r`Infinitely many`, why: r`The 360° condition at each corner allows only a few combinations.` },
              ],
              explain: r`There are exactly **8**, first listed fully by Kepler in 1619. Together with the 3 regular tilings, that makes the 11 "Archimedean tilings" where every vertex is identical.`,
            },
            {
              type: 'numeric',
              title: 'Complete the vertex',
              prompt: r`At a vertex, three equilateral triangles and one square meet. One more regular polygon fills the gap exactly. How many sides does it have?`,
              answer: 4,
              wrong: [{ v: 3, why: r`The gap is $360° - 3 \times 60° - 90° = 90°$, too big for a triangle's $60°$.` }],
              explain: r`The gap is $360° - 180° - 90° = 90°$: another square. Three triangles and two squares can be arranged in two ways, 3.3.3.4.4 (rows of triangles between rows of squares) and 3.3.4.3.4 (the "snub square" tiling), and both are among the eight semiregular tilings.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Triangles and 12-gons',
              prompt: r`Does the corner arrangement **3.12.12** (one triangle and two regular 12-gons) add up to 360°? A regular 12-gon's angle is 150°.`,
              cols: 2,
              choices: [
                { t: 'Yes', ok: true },
                { t: 'No', why: r`$60° + 150° + 150° = 360°$.` },
              ],
              explain: r`$60° + 150° + 150° = 360°$ ✓, and it really does extend to a full tiling (12-gons with triangles in the gaps). But beware: some corners add to 360° yet **can't** be extended over the whole plane. For example, 5.5.10 fits around one point ($108 + 108 + 144 = 360$), but the pattern breaks down as you continue.`,
            },
          ],
          recap: [
            'Semi-regular tilings use several regular polygons with the same arrangement at every corner.',
            'Notation like 4.8.8 lists the polygons around a corner.',
            'There are exactly 8 semi-regular tilings. Angles summing to 360° is necessary, but not sufficient.',
          ],
        },
      ],
    },
    {
      title: 'Symmetry and Surprise',
      summary: 'Repeating and non-repeating patterns.',
      lessons: [
        {
          id: 'symmetry',
          title: 'Symmetries of Patterns',
          summary: 'Why there is no five-fold symmetry',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Four ways to move a pattern',
              body: r`A repeating pattern can be moved onto itself in four ways:
- **Translation**: slide it.
- **Rotation**: turn it about a point.
- **Reflection**: flip it in a mirror line.
- **Glide reflection**: reflect, then slide along the mirror line, like a trail of footprints.

Every repeating wallpaper pattern has one of exactly **17** combinations of these symmetries, and the tilework of the Alhambra palace in Spain shows many of them.`,
            },
            { /*anim:tilings*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Moving a pattern onto itself',
              body: r`Four border patterns, each built from the same little flag. Watch a {coral:copy} of each pattern move, and land exactly on the {blue:original}.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.3, xmax: 12.3, ymin: -1.3, ymax: 1.3, grid: false, axes: false, clipExtra: true,
                animate: { param: 't', speed: 0.55, max: 12, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const k = Math.floor(p.t / 3) % 4, u = Math.min(1, Math.max(0, ((p.t % 3) - 0.5) / 1.8)), e = u * u * (3 - 2 * u), els = [];
                  // the flag: a pole with a pennant, deliberately lopsided
                  const FLAG = [[0, -0.7], [0.12, -0.7], [0.12, 0.25], [0.75, 0.45], [0.12, 0.7], [0, 0.7]];
                  const tf = (pts, f) => pts.map(f);
                  // each pattern lists its flags as functions of a point; period 2 along x
                  const pats = [
                    (i) => [tf(FLAG, ([x, y]) => [x + i, y])],
                    (i) => [tf(FLAG, ([x, y]) => [x + 2 * i + 0.1, y]), tf(FLAG, ([x, y]) => [2 * i + 1.9 - x, y])],
                    (i) => [tf(FLAG, ([x, y]) => [x + 2 * i + 0.1, y]), tf(FLAG, ([x, y]) => [2 * i + 1.9 - x, -y])],
                    (i) => [tf(FLAG, ([x, y]) => [x + 2 * i + 0.1, y]), tf(FLAG, ([x, y]) => [x + 2 * i + 1.1, -y])],
                  ];
                  const moves = [
                    ([x, y]) => [x + e, y],
                    ([x, y]) => [6 + (x - 6) * Math.cos(Math.PI * e), y],
                    ([x, y]) => [6 + (x - 6) * Math.cos(Math.PI * e) - y * Math.sin(Math.PI * e), (x - 6) * Math.sin(Math.PI * e) + y * Math.cos(Math.PI * e)],
                    ([x, y]) => [x + e, y * Math.cos(Math.PI * e)],
                  ];
                  const draw = (pts, o) => s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', 'stroke-linejoin': 'round', ...o });
                  const n = k === 0 ? 14 : 7;
                  for (let i = -1; i < n; i++) pats[k](i).forEach((f) => els.push(draw(f, { class: 'fl-blue', opacity: 0.35 })));
                  for (let i = -1; i < n; i++) pats[k](i).forEach((f) => els.push(draw(f.map(moves[k]), { fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 })));
                  if (k === 1) els.push(s('line', { x1: plot.X(6), x2: plot.X(6), y1: plot.Y(-1.2), y2: plot.Y(1.2), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  if (k === 2) els.push(s('circle', { cx: plot.X(6), cy: plot.Y(0), r: 5, class: 'fl-ink' }));
                  if (k === 3) els.push(s('line', { x1: plot.X(-0.3), x2: plot.X(12.3), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  return els;
                },
                readout: (p) => ['**Translation**: slide one step along', '**Reflection**: flip in the dashed mirror line', '**Rotation**: a half-turn about the dot', '**Glide reflection**: flip in the dashed line *and* slide half a step'][Math.floor(p.t / 3) % 4],
              },
              after: r`Each pattern lands exactly on itself after its own kind of move, and only after that kind: the glide pattern, like a trail of footprints, has no plain mirror line at all, yet flipping **and** sliding works. Patterns along a strip can only use these four moves (with half-turns as the only rotations), which is why there are just seven kinds of frieze.`,
            },
            {
              type: 'mcq',
              title: 'Footprints',
              prompt: r`A trail of footprints in the sand alternates left, right, left, right. Which symmetry carries the trail onto itself, moving each footprint to the next?`,
              choices: [
                { t: 'A glide reflection', ok: true },
                { t: 'A translation', why: 'A slide moves a left footprint onto another left one, two steps ahead. To reach the very next footprint, you also need a flip.' },
                { t: 'A rotation', why: 'A rotation would turn the footprint to point another way.' },
              ],
              explain: r`Reflect a left footprint in the line down the middle of the trail and it becomes a right one; slide it forward and it lands on the next print. That combination is a **glide reflection**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Seven friezes',
              body: r`A **frieze** is a pattern that repeats in one direction, like a border on a wall. Surprisingly, there are only **seven** different kinds of symmetry a frieze can have. The nicknames (from John Conway) describe footprints. Step through them.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.4, xmax: 12.4, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 620,
                params: { k: { min: 0, max: 6, step: 1, value: 0, label: 'frieze', color: 'violet', format: (v) => FRIEZES[v][0] } },
                extra: ({ plot, p, s }) => {
                  const [, P, T] = FRIEZES[p.k], els = [s('line', { x1: plot.X(-0.4), x2: plot.X(12.4), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--line-2)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' })];
                  for (let c = -1; c * P < 13; c++) T.forEach((f, i) => els.push(s('path', { d: polyPath(plot, FLAG.map(([x, y]) => { const [u, v] = f(x, y); return [u + c * P, v]; })), class: i % 2 ? 'fl-coral-soft' : 'fl-blue-soft', stroke: i % 2 ? 'var(--coral)' : 'var(--blue)', 'stroke-width': 2 })));
                  return els;
                },
                readout: (p) => ({
                  hop: 'Translation only.',
                  step: 'Glide reflections: flip across the centre line, then slide. (Footprints!)',
                  sidle: 'Vertical mirror lines.',
                  'spinning hop': 'Half-turns about points on the centre line.',
                  'spinning sidle': 'Vertical mirrors and glide reflections, so half-turns too.',
                  jump: 'A horizontal mirror along the centre line.',
                  'spinning jump': 'Horizontal and vertical mirrors, so half-turns too.',
                })[FRIEZES[p.k][0]],
              },
              after: r`Every frieze in the world, from Greek pottery to cast-iron railings, is one of these seven. The same reasoning in two directions gives the 17 wallpaper groups.`,
            },
            {
              type: 'mcq',
              title: 'Name that frieze',
              prompt: r`The border $\ldots\ \mathsf{N\ N\ N\ N}\ \ldots$ (capital letter N, repeated) has which symmetry besides translation?`,
              choices: [
                { t: 'Half-turns (spinning hop)', ok: true },
                { t: 'A vertical mirror (sidle)', why: 'Mirror an N left to right and you get И, a different letter.' },
                { t: 'A horizontal mirror (jump)', why: 'Flip an N upside down in a horizontal mirror and you get И again.' },
                { t: 'None (hop)', why: 'Turn the page upside down: N still reads N.' },
              ],
              explain: r`Turn N upside down (a half-turn) and it's still N, but any mirror turns it into И. So a row of N's is a **spinning hop**. Rows of other letters give other friezes: A A A is a sidle, B B B is a jump, H H H a spinning jump.`,
            },
            {
              type: 'numeric',
              title: 'Wallpaper groups',
              prompt: r`There are 7 symmetry types of frieze (one-direction) patterns. How many symmetry types of **wallpaper** (two-direction) patterns are there?`,
              answer: 17,
              explain: r`There are exactly **17** wallpaper groups, proved by Evgraf Fedorov in 1891. All 17 can be found in the tilework of the Alhambra in Granada (though experts still debate a few).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The crystallographic restriction',
              prompt: r`A periodic (repeating) pattern can have rotational symmetry of order 2, 3, 4 or 6. Which order is **impossible**?`,
              cols: 2,
              choices: [
                { t: '5', ok: true },
                { t: '3', why: 'Triangular tilings have 3-fold rotational symmetry.' },
                { t: '4', why: 'A square grid has 4-fold rotational symmetry.' },
                { t: '6', why: 'A honeycomb has 6-fold rotational symmetry.' },
              ],
              explain: r`Rotation centres in a repeating pattern form a lattice. If two 5-fold centres existed, rotating one about the other would generate centres **closer** together than the closest pair, which is a contradiction. So only orders 1, 2, 3, 4 and 6 are possible. This **crystallographic restriction** is why five-fold symmetry was thought impossible in crystals… until 1982.`,
            },
          ],
          recap: [
            'Pattern symmetries: translation, rotation, reflection and glide reflection.',
            'There are exactly 17 wallpaper symmetry groups.',
            'Periodic patterns can only have rotational symmetry of order 2, 3, 4 or 6.',
          ],
        },
        {
          id: 'aperiodic',
          title: 'Never Repeating',
          summary: 'Penrose tiles and the einstein',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Penrose tiling',
              body: r`In 1974, Roger Penrose found two rhombus shapes, a fat one and a thin one, that tile the plane but **only non-periodically**: no matter how you place them (following matching rules), the pattern never repeats. Watch it grow by repeatedly splitting each tile into smaller ones.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 1, ymin: -1, ymax: 1, grid: false, axes: false, maxWidth: 420,
                params: { k: { min: 1, max: 6, step: 1, value: 4, label: 'subdivisions', color: 'violet', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const P = (z) => `${plot.X(z.re).toFixed(1)} ${plot.Y(z.im).toFixed(1)}`;
                  return penrose(p.k).map(([c, A, B, D]) => s('path', { d: `M${P(D)} L${P(A)} L${P(B)}`, class: c ? 'fl-blue-soft' : 'fl-coral-soft', stroke: 'var(--ink)', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }));
                },
                readout: (p) => r`${penrose(p.k).length} half-tiles. The ratio of fat to thin rhombi approaches $\varphi \approx 1.618$, the golden ratio.`,
              },
              after: r`Penrose tilings have five-fold symmetry around special points, and any finite patch appears again and again throughout the plane. Yet the tiling as a whole never repeats. Because the fat-to-thin ratio is the irrational $\varphi$, no repeating block could ever contain them in the right proportion.`,
            },
            {
              type: 'numeric',
              title: 'Penrose angles',
              prompt: r`Penrose's thin rhombus has angles of $36°$ and $144°$. The fat rhombus has angles that are both multiples of $36°$, too. What is its smaller angle?`,
              unit: '°',
              answer: 72,
              wrong: [{ v: 36, why: 'That’s the thin rhombus. The fat one is fatter!' }, { v: 108, why: r`$108°$ is its larger angle: $72° + 108° = 180°$.` }],
              explain: r`$72°$ and $108°$. All the angles are multiples of $36° = \frac{360°}{10}$, which is why five-fold (and ten-fold) symmetry appears all over Penrose tilings.`,
            },
            {
              type: 'mcq',
              title: 'Impossible crystals',
              prompt: r`In 1982, Dan Shechtman saw a crystal with sharp five-fold symmetry in an electron microscope. Many scientists said it was impossible. What was it?`,
              choices: [
                { t: 'A quasicrystal: atoms arranged in an ordered but non-repeating pattern, like a 3D Penrose tiling', ok: true },
                { t: 'A measurement error', why: 'It was real. Shechtman won the 2011 Nobel Prize in Chemistry for the discovery.' },
                { t: 'An ordinary crystal viewed at an angle', why: 'Ordinary crystals repeat, and repeating patterns can’t have five-fold symmetry.' },
              ],
              explain: r`**Quasicrystals** are ordered without being periodic, exactly the loophole that Penrose tilings had revealed. Shechtman faced ridicule for years, but was vindicated with the 2011 Nobel Prize in Chemistry. Quasicrystals have since been found in a meteorite, too.`,
            },
            {
              type: 'numeric',
              title: 'Fat and thin',
              prompt: r`In a large Penrose rhombus tiling, the ratio of fat rhombs to thin rhombs approaches a famous irrational number. Which? (3 decimal places.)`,
              answer: (1 + Math.sqrt(5)) / 2,
              tol: 0.001,
              explain: r`The ratio tends to the golden ratio $\varphi \approx 1.618$. Because it’s irrational, the pattern can never repeat: any repeating tiling would have a rational ratio.`,
            },
            {
              type: 'mcq',
              title: 'Why five is forbidden',
              prompt: r`Penrose tilings have five-fold symmetry. Why can no **periodic** tiling have a five-fold rotation symmetry?`,
              choices: [
                { t: r`In a repeating lattice, rotations can only be 2-, 3-, 4- or 6-fold (the crystallographic restriction)`, ok: true },
                { t: r`Pentagons are too small`, why: r`It’s not about size: any lattice’s rotation symmetries are limited.` },
                { t: r`It can, with the right pentagons`, why: r`Regular pentagons can’t tile, and no lattice has 5-fold rotation.` },
              ],
              explain: r`Rotating a lattice by $72°$ would create lattice points closer together than the shortest lattice vector, a contradiction. Penrose tilings escape by never repeating, and real quasicrystals (Nobel Prize, 2011) do the same with atoms.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'One tile to rule them all',
              prompt: r`Penrose needed **two** tile shapes. Mathematicians long wondered: is there a **single** shape (an "einstein", German for "one stone") that tiles the plane only non-periodically?`,
              choices: [
                { t: 'Yes: the “hat”, discovered in 2023 by an amateur, David Smith, with three mathematicians', ok: true },
                { t: 'No: it was proved impossible', why: 'The opposite happened: one was found in 2023.' },
                { t: 'Still unknown', why: 'The question was settled in 2023.' },
              ],
              explain: r`David Smith, a retired print technician and keen shape hobbyist, found the 13-sided "hat" in 2022, and with Joseph Myers, Craig Kaplan and Chaim Goodman-Strauss proved in 2023 that it tiles the plane only aperiodically. The hat needs some of its copies to be reflected, so the team soon found the "spectre", which works without any reflections at all.`,
            },
          ],
          recap: [
            'Penrose tilings use two rhombi and never repeat, with five-fold symmetry.',
            'Quasicrystals are real materials with Penrose-like order (2011 Nobel Prize).',
            'In 2023, the single “hat” tile was shown to tile only aperiodically.',
          ],
        },
      ],
    },
    {
      title: 'Shapes That Tile',
      summary: 'Any quadrilateral, Escher’s tricks and tiling puzzles.',
      lessons: [
        {
          id: 'anyquad',
          title: 'Every Quadrilateral Tiles',
          summary: 'Even the lopsided ones',
          icon: 'grip',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Any triangle',
              prompt: 'Does every triangle, however lopsided, tile the plane with copies of itself?',
              choices: [
                { t: 'Yes: two copies make a parallelogram, and parallelograms tile', ok: true },
                { t: 'Only equilateral and right-angled triangles', why: 'Turn any triangle a half-turn about the midpoint of one side: the two copies form a parallelogram.' },
                { t: 'No triangle except the equilateral one', why: 'Any triangle plus its half-turned copy makes a parallelogram, and rows of parallelograms cover the plane.' },
              ],
              explain: r`Rotate a triangle by $180°$ about the midpoint of one side: together the two copies form a parallelogram, and parallelograms stack into rows that fill the plane. At every corner, each of the triangle's three angles appears twice: $2(a + b + c) = 360°$.`,
            },
            {
              type: 'interactive',
              title: 'Any quadrilateral',
              body: r`Here a quadrilateral is copied by half-turns about the midpoints of its sides. Drag corners **C** and **D**. Can you make a shape that breaks the tiling? Try making a **dart**: a quadrilateral with a dent, where one angle is more than $180°$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 5, ymin: -2.4, ymax: 4, grid: false, axes: false, maxWidth: 520,
                params: {
                  cx: { min: 0.5, max: 3.5, step: 0.05, value: 2.7, slider: false },
                  cy: { min: 0.3, max: 2.6, step: 0.05, value: 1.9, slider: false },
                  dx: { min: -1.5, max: 2, step: 0.05, value: -0.5, slider: false },
                  dy: { min: 0.3, max: 2.6, step: 0.05, value: 1.2, slider: false },
                },
                extra: ({ plot, p, s }) => {
                  const Q = [[0, 0], [2, 0], [p.cx, p.cy], [p.dx, p.dy]];
                  if (!quadInfo(Q).simple) return [s('path', { d: polyPath(plot, Q), class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 3 })];
                  const Qp = Q.map(([x, y]) => [2 - x, -y]);
                  const ac = [p.cx, p.cy], bd = [p.dx - 2, p.dy];
                  const els = [];
                  for (let m = -5; m <= 5; m++) for (let n = -5; n <= 5; n++) {
                    const t = [m * ac[0] + n * bd[0], m * ac[1] + n * bd[1]];
                    if (Math.abs(t[0]) > 9 || Math.abs(t[1]) > 8) continue;
                    els.push(s('path', { d: polyPath(plot, Q.map(([x, y]) => [x + t[0], y + t[1]])), class: 'fl-blue-soft', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                    els.push(s('path', { d: polyPath(plot, Qp.map(([x, y]) => [x + t[0], y + t[1]])), class: 'fl-amber-soft', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  }
                  els.push(s('path', { d: polyPath(plot, Q), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3.5 }));
                  [['A', 0, 0], ['B', 2, 0]].forEach(([t, x, y]) => els.push(s('text', { x: plot.X(x) - 14, y: plot.Y(y) + 18, class: 'lbl', text: t })));
                  return els;
                },
                points: [
                  { x: (p) => p.cx, y: (p) => p.cy, drag: { x: 'cx', y: 'cy' }, color: 'coral', label: 'C' },
                  { x: (p) => p.dx, y: (p) => p.dy, drag: { x: 'dx', y: 'dy' }, color: 'violet', label: 'D' },
                ],
                readout: (p) => { const q = quadInfo([[0, 0], [2, 0], [p.cx, p.cy], [p.dx, p.dy]]); return !q.simple ? 'The sides cross: that’s not a quadrilateral. Move a corner back.' : q.convex ? 'A convex quadrilateral. It tiles.' : 'A dart, with a dent. **It still tiles!**'; },
                goal: (p) => { const q = quadInfo([[0, 0], [2, 0], [p.cx, p.cy], [p.dx, p.dy]]); return q.simple && !q.convex; },
                hint: 'Drag D to the right and down, towards the middle of the shape, until the corner at D points inwards.',
                solution: { cx: 2.4, cy: 2.2, dx: 1.4, dy: 0.9 },
              },
              explain: r`Every quadrilateral tiles, darts included! The original and its half-turned copy fit together, and the pair slides along the two diagonal directions to fill the plane. At every corner of the tiling, all four angles of the quadrilateral meet once each.`,
            },
            {
              type: 'numeric',
              title: 'Why it works',
              prompt: r`A quadrilateral has angles $70°$, $85°$ and $110°$. What is its fourth angle?`,
              unit: '°',
              answer: 95,
              wrong: [{ v: 175, why: r`The four angles of a quadrilateral add up to $360°$, not $180°$ plus something.` }, { v: 265, why: 'That’s the sum of the three given angles.' }],
              explain: r`A quadrilateral splits into two triangles along a diagonal, so its angles add up to $2 \times 180° = 360°$, leaving $95°$. Because the four angles make exactly a full turn, one copy of each fits around every corner of the tiling, which is why **every** quadrilateral works.`,
            },
            {
              type: 'explain',
              title: 'The pentagon hunt',
              body: r`Regular pentagons can't tile, but some lopsided convex pentagons can. Which ones? The search took a century:

- 1918: Karl Reinhardt found 5 families.
- 1968–1975: Richard Kershner found 3 more and claimed the list was complete. A *Scientific American* article by Martin Gardner then prompted a computer programmer, Richard James, to find a 9th.
- 1976–1977: **Marjorie Rice**, a San Diego homemaker with no mathematical training beyond high school, read the same article and discovered 4 new families by inventing her own notation at her kitchen table.
- 1985 and 2015: two more, the last found by a computer search at the University of Washington.
- 2017: Michaël Rao used a computer-assisted proof to show the list of **15** families is complete.`,
            },
            {
              type: 'mcq',
              title: 'Seven sides',
              prompt: 'Can a convex polygon with 7 or more sides tile the plane?',
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes, if it’s lopsided enough', why: 'Lopsidedness helped pentagons, but for 7 or more sides the average angle is too big: on average fewer than 3 tiles could meet at a corner.' },
              ],
              explain: r`A convex heptagon's angles average $\frac{900°}{7} \approx 128.6°$, so on average fewer than 3 fit around a corner, but every corner needs at least 3. A careful counting argument (using Euler's formula) makes this rigorous. Convex hexagons tile in exactly 3 families (Reinhardt, 1918), pentagons in 15, and quadrilaterals and triangles always.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Corners of the tiling',
              body: r`In the quadrilateral tiling you explored, every corner of the tiling is a meeting point of 4 tiles, and every tile has 4 corners.`,
              prompt: r`In a large patch with 1000 tiles, roughly how many corner points are there?`,
              answer: 1000,
              relTol: 0.02,
              wrong: [{ v: 4000, why: 'Each corner point is shared by 4 tiles, so 4000 tile-corners make only 1000 points.' }, { v: 250, why: r`$1000 \times 4$ tile-corners, divided by 4 tiles per point.` }],
              hint: 'Count tile-corners two ways: 4 per tile, and 4 per meeting point.',
              explain: r`There are $1000 \times 4 = 4000$ tile-corners, and each point is shared by 4 tiles, so about 1000 points: one per tile. (Edges: each tile has 4, each shared by 2, so about 2000.) So $V - E + F \approx 1000 - 2000 + 1000$, which is tiny compared with the number of tiles (Euler's formula says it is exactly 1 for a patch). The same kind of counting, applied to polygons with 7 or more sides, shows that they can't tile.`,
            },
          ],
          recap: [
            'Every triangle and every quadrilateral (even a dart) tiles the plane.',
            'A quadrilateral’s angles add to 360°, so all four meet at each corner.',
            'Exactly 15 families of convex pentagons tile (complete in 2017); no convex 7-gon does.',
          ],
        },
        {
          id: 'escher',
          title: 'Escher’s Tricks',
          summary: 'Design your own tile',
          icon: 'pencil',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'Bump and dent',
              body: r`Start from a square tile. Drag the two handles to push a bump out of the bottom edge and the left edge. Whatever you add to one side is **removed from the opposite side**, so the tiles still fit. Make both bumps stick out by at least $0.2$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 3.5, ymin: -0.5, ymax: 2.5, grid: false, axes: false, maxWidth: 520,
                params: {
                  bx: { min: 0.3, max: 0.7, step: 0.01, value: 0.5, slider: false },
                  by: { min: -0.3, max: 0.3, step: 0.01, value: 0.05, slider: false },
                  lx: { min: -0.3, max: 0.3, step: 0.01, value: 0.05, slider: false },
                  ly: { min: 0.3, max: 0.7, step: 0.01, value: 0.5, slider: false },
                },
                extra: ({ plot, p, s }) => {
                  const bottom = [[0, 0], [p.bx - 0.18, 0], [p.bx, p.by], [p.bx + 0.18, 0], [1, 0]];
                  const left = [[0, 0], [0, p.ly - 0.18], [p.lx, p.ly], [0, p.ly + 0.18], [0, 1]];
                  const tile = [...bottom, ...left.slice(1).map(([x, y]) => [x + 1, y]), ...bottom.slice(0, -1).reverse().map(([x, y]) => [x, y + 1]), ...left.slice(1, -1).reverse()];
                  const els = [];
                  for (let i = -1; i <= 4; i++) for (let j = -1; j <= 3; j++) els.push(s('path', { d: polyPath(plot, tile.map(([x, y]) => [x + i, y + j])), class: (i + j) % 2 ? 'fl-teal-soft' : 'fl-amber-soft', stroke: 'var(--ink)', 'stroke-width': i === 0 && j === 0 ? 3.5 : 1.5 }));
                  return els;
                },
                points: [
                  { x: (p) => p.bx, y: (p) => p.by, drag: { x: 'bx', y: 'by' }, color: 'coral' },
                  { x: (p) => p.lx, y: (p) => p.ly, drag: { x: 'lx', y: 'ly' }, color: 'violet' },
                ],
                goal: (p) => Math.abs(p.by) >= 0.2 && Math.abs(p.lx) >= 0.2,
                hint: 'Drag the coral handle down (or up) and the violet handle left (or right).',
                solution: { bx: 0.5, by: -0.25, lx: -0.25, ly: 0.5 },
              },
              explain: r`A bump on the bottom edge is a dent in the top edge of the tile below, so neighbours lock together like jigsaw pieces. This **translation trick** (slide copies without turning them) works with any curve: replace a pair of opposite sides with the same wiggly curve and the tile still covers the plane.`,
            },
            {
              type: 'mcq',
              title: 'Opposite sides',
              prompt: 'You change the top edge of a square tile into a wavy curve, and you want the tiles to fit together just by sliding (no turning). What must the bottom edge be?',
              choices: [
                { t: 'The same wavy curve, shifted down by one tile', ok: true },
                { t: 'The mirror image of the curve', why: 'A mirrored curve would only fit a flipped neighbour. Sliding copies need identical edges.' },
                { t: 'A straight line', why: 'Then the wavy top edge would leave gaps against the straight bottom of the tile above.' },
                { t: 'Any curve with the same length', why: 'The two edges must match point for point, so they must be identical curves.' },
              ],
              explain: r`The top edge of one tile **is** the bottom edge of the tile above. So for sliding copies, opposite edges must be identical, just shifted. This is how Escher made his tessellations of birds, fish and lizards: start from a parallelogram or hexagon and deform pairs of opposite edges together.`,
            },
            {
              type: 'explain',
              title: 'Turning tricks',
              body: r`Sliding isn't the only way. Some of Escher's designs use rotations:

- **Half-turn edges.** Replace a single edge with an S-shaped curve that looks the same after a half-turn about the edge's midpoint. The neighbour across that edge is a half-turned copy. Since every quadrilateral tiles by half-turns about its edge midpoints, any quadrilateral with S-shaped edges tiles too.
- **Rotations at corners.** Deform one edge of a hexagon, then rotate the same curve by $120°$ about a corner onto the next edge. Three tiles then spin around that corner, as in Escher's lizards.

The German mathematician Heinrich Heesch classified the 28 ways a single asymmetric tile can cover the plane using these moves, without reflections. Escher studied the same ideas through his half-brother, a geologist who sent him crystallography papers.`,
            },
            {
              type: 'mcq',
              title: 'How many lizards?',
              prompt: r`In Escher's famous lizard tessellation, each lizard is a deformed hexagon, and three lizards meet head to head at certain points, rotating around them. What rotation carries one lizard onto the next around such a point?`,
              cols: 2,
              choices: [
                { t: r`$120°$`, ok: true },
                { t: r`$90°$`, why: r`Three lizards share the full turn: $360° / 3$.` },
                { t: r`$60°$`, why: r`That would fit 6 lizards around the point, not 3.` },
                { t: r`$180°$`, why: 'Half-turns swap two tiles. Three tiles around a point need a third of a turn.' },
              ],
              explain: r`Three tiles around a point share $360°$, so each is a $120°$ turn of the next. That's 3-fold rotational symmetry, one of the orders (2, 3, 4, 6) allowed in a repeating pattern.`,
            },
            {
              type: 'mcq',
              title: 'Which base shape?',
              prompt: r`Escher’s simplest designs modify a polygon by matching bumps and dents on opposite sides, then tile using **translations only**. Which regular polygons work as the starting shape?`,
              choices: [
                { t: r`Squares and hexagons`, ok: true },
                { t: r`Triangles and squares`, why: r`Triangles need rotations (or reflections) to tile; translations of one triangle leave gaps.` },
                { t: r`Any regular polygon`, why: r`Pentagons can’t tile at all, and triangles need rotations.` },
              ],
              explain: r`A tile that tiles by translations alone must be (a deformed) parallelogram or centrally symmetric hexagon. Triangle-based designs, like some of Escher’s reptiles, use rotations about the tile corners.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Area never changes',
              body: r`You start with a square tile of area 1 m² and use the translation trick to push a bump of area 0.15 m² out of the bottom edge, and a bump of area 0.08 m² out of the left edge.`,
              prompt: 'What is the area of the new tile, in m²?',
              unit: 'm²',
              answer: 1,
              tol: 0.001,
              wrong: [{ v: 1.23, tol: 0.005, why: 'Each bump comes with a matching dent on the opposite edge.' }, { v: 0.77, tol: 0.005, why: 'The bumps add area and the matching dents remove exactly the same amount.' }],
              explain: r`Still exactly 1 m²: each bump added on one side is matched by an identical dent on the opposite side. It must be so, because the new tiles cover the plane with the same number of tiles per square metre as the old squares (one per lattice cell).`,
            },
          ],
          recap: [
            'Translation trick: deform a pair of opposite edges with the same curve.',
            'Rotation tricks: S-curves about edge midpoints, or curves rotated about corners.',
            'A tile made this way keeps the area of the original lattice cell.',
          ],
        },
        {
          id: 'dominoes',
          title: 'Tiling Puzzles',
          summary: 'Dominoes, colourings and counting',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The mutilated chessboard',
              body: r`A chessboard has 64 squares, and 32 dominoes (each covering 2 squares) can cover it. Now cut off two opposite corner squares, leaving 62.`,
              prompt: 'Can 31 dominoes cover the 62 remaining squares?',
              choices: [
                { t: 'No: the removed corners are the same colour', ok: true },
                { t: 'Yes: 62 is even', why: 'Even is necessary but not enough. Think about the colours of the squares.' },
                { t: 'Only if dominoes may overlap the edge', why: 'Even then the colour count rules it out: count black and white squares.' },
              ],
              explain: r`Opposite corners have the same colour, so the board now has 32 squares of one colour and 30 of the other. Each domino covers one black and one white square, so 31 dominoes cover 31 of each. Impossible! Colouring arguments like this settle many tiling puzzles in a line.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Counting domino tilings',
              body: r`How many ways can dominoes tile a strip 2 squares high and $n$ long? Each tiling starts either with an upright domino, or with two flat dominoes stacked. Change $n$ and count.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 17, grid: false, axes: false, height: 400,
                params: { n: { min: 1, max: 6, step: 1, value: 5, label: 'length n', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const all = dominoTilings(p.n), u = Math.min(1.35, 8.6 / p.n), els = [];
                  all.forEach((t, k) => {
                    const ox = 0.6 + (k % 3) * 9.8, oy = 16.2 - Math.floor(k / 3) * 3.3 - 2 * u;
                    let x = 0;
                    const box = (x0, y0, w, h, cls) => els.push(s('rect', { x: plot.X(ox + x0 * u), y: plot.Y(oy + (y0 + h) * u), width: plot.X(w * u) - plot.X(0) - 3, height: plot.Y(0) - plot.Y(h * u) - 3, rx: 3, class: cls, stroke: 'var(--ink-3)', 'stroke-width': 1 }));
                    for (const c of t) {
                      if (c === 'V') { box(x, 0, 1, 2, 'fl-blue-soft'); x += 1; } else { box(x, 1, 2, 1, 'fl-coral-soft'); box(x, 0, 2, 1, 'fl-coral-soft'); x += 2; }
                    }
                  });
                  return els;
                },
                readout: (p) => `**${dominoTilings(p.n).length}** tilings of a 2 × ${p.n} strip`,
              },
              after: r`The counts go $1, 2, 3, 5, 8, 13, \dots$: the **Fibonacci numbers**! A strip of length $n$ starts with an upright domino (leaving length $n - 1$) or two flat ones (leaving $n - 2$), so $T_n = T_{n-1} + T_{n-2}$.`,
            },
            {
              type: 'numeric',
              title: 'A longer strip',
              prompt: r`How many domino tilings does a $2 \times 12$ strip have?`,
              answer: 233,
              wrong: [{ v: 144, why: r`Check the start: $T_1 = 1$, $T_2 = 2$, $T_3 = 3$, $T_4 = 5$, … so $T_{12}$ is one further along.` }, { v: 377, why: 'One step too far. List them: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233.' }],
              hint: r`Continue $1, 2, 3, 5, 8, 13, \dots$ until you reach $n = 12$.`,
              explain: r`$1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233$: there are 233 tilings. Counting tilings of larger boards is much harder. An $8 \times 8$ chessboard has $12{,}988{,}816$ domino tilings, a number found in 1961 by Kasteleyn and by Temperley and Fisher, physicists studying molecules on surfaces.`,
            },
            {
              type: 'mcq',
              title: 'L-shaped trominoes',
              body: r`An L-tromino is an L-shape of 3 squares. Take a $2^n \times 2^n$ board (4 × 4, 8 × 8, 16 × 16, …) and remove **any one** square.`,
              prompt: 'Can the rest always be tiled by L-trominoes?',
              choices: [
                { t: 'Yes, wherever the missing square is', ok: true },
                { t: 'Only if a corner square is missing', why: 'Try the induction: split the board into four quarters and place one tromino at the centre.' },
                { t: 'No: the number of squares isn’t a multiple of 3', why: r`$4^n - 1$ is always a multiple of 3: $15, 63, 255, \dots$` },
              ],
              explain: r`Proof by induction: split the board into four quarters. The missing square lies in one quarter. Place one tromino at the centre covering one square of each of the other three quarters. Now each quarter is a smaller board with one square missing, and the same trick works all the way down to $2 \times 2$. (Solomon Golomb, 1954.)`,
            },
            {
              type: 'mcq',
              title: 'A different cut',
              prompt: r`Remove one **corner** square from a 5 × 5 board, leaving 24 squares. Could it be tiled by 12 dominoes?`,
              choices: [
                { t: r`Yes: the colour count balances (12 and 12) and a tiling exists`, ok: true },
                { t: r`No: the colours can’t balance`, why: r`A 5 × 5 board has 13 squares of the corner colour and 12 of the other; removing a corner leaves 12 and 12.` },
                { t: r`No: 24 is not a multiple of 4`, why: r`Each domino covers 2 squares, so 24 squares need 12 dominoes; that works.` },
              ],
              explain: r`The colouring argument only rules tilings **out**; here it doesn’t, and a tiling is easy to find (cover a 4 × 5 block, then the remaining 1 × 4 strip). Removing a square of the minority colour would make it impossible.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Three rows high',
              body: r`A $3 \times n$ board can only be tiled by dominoes when $n$ is even (it has $3n$ squares). A $3 \times 2$ board has 3 tilings: three flat dominoes stacked, or one flat domino with two upright ones beside it, at the top or at the bottom.`,
              prompt: r`How many domino tilings does a $3 \times 4$ board have?`,
              answer: 11,
              wrong: [{ v: 9, why: r`$3 \times 3 = 9$ counts tilings that split down the middle into two $3 \times 2$ halves. Two more tilings have flat dominoes straddling the middle.` }, { v: 6, why: 'Count tilings that split into two 3 × 2 halves (3 × 3 = 9), then look for ones that don’t split.' }],
              hint: r`Tilings that split into two $3 \times 2$ halves: $3 \times 3 = 9$. Then find the tilings with no clean break in the middle.`,
              explain: r`9 tilings split into two $3 \times 2$ halves ($3 \times 3$). Two more can't be split: two stacked flat dominoes straddle the middle, with an upright domino at each end beside them and two flat dominoes filling the remaining row (at the top or at the bottom). Total 11. The counts for $3 \times 2, 3 \times 4, 3 \times 6, \dots$ go $3, 11, 41, 153$, each about $3.7$ times the last.`,
            },
          ],
          recap: [
            'Colouring arguments: each domino covers one black and one white square.',
            'Domino tilings of a 2 × n strip are counted by the Fibonacci numbers.',
            'Any 2ⁿ × 2ⁿ board minus one square tiles with L-trominoes (proof by induction).',
          ],
        },
      ],
    },
  ],
};
