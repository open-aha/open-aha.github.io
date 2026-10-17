const r = String.raw;
const PHI = (1 + Math.sqrt(5)) / 2;

// Platonic solids: vertices and edges (edges computed as pairs at minimum distance)
function solid(name) {
  let V;
  if (name === 'tetrahedron') V = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  if (name === 'cube') { V = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]); }
  if (name === 'octahedron') V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((p) => p.map((c) => c * 1.4));
  if (name === 'icosahedron') { V = []; for (const a of [-1, 1]) for (const b of [-PHI, PHI]) V.push([0, a, b], [a, b, 0], [b, 0, a]); V = V.map((p) => p.map((c) => c * 0.8)); }
  if (name === 'dodecahedron') {
    V = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
    for (const a of [-1, 1]) for (const b of [-1, 1]) V.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [b * PHI, 0, a / PHI]);
    V = V.map((p) => p.map((c) => c * 0.85));
  }
  let min = Infinity;
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) min = Math.min(min, d(V[i], V[j]));
  const E = [];
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) if (Math.abs(d(V[i], V[j]) - min) < 1e-6) E.push([i, j]);
  return { V, E };
}
const NAMES = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'];
export const SOLIDS = NAMES.map(solid);
const FACES = { tetrahedron: 4, cube: 6, octahedron: 8, dodecahedron: 12, icosahedron: 20 };

// fixed oblique view: rotate about the vertical axis by a, then tilt by b
const view = (a, b) => ([x, y, z]) => {
  const x1 = x * Math.cos(a) - y * Math.sin(a), y1 = x * Math.sin(a) + y * Math.cos(a);
  return [x1, z * Math.cos(b) + y1 * Math.sin(b), z * Math.sin(b) - y1 * Math.cos(b)];
};
const CUBE_V = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) CUBE_V.push([x, y, z]);
const CUBE_E = [];
for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (CUBE_V[i].filter((c, k) => c !== CUBE_V[j][k]).length === 1) CUBE_E.push([i, j]);
// plane n·x = d through the cube [-1,1]^3: the cross-section polygon, in order
function cubeSlice(th, ph, d) {
  const t = (th * Math.PI) / 180, f = (ph * Math.PI) / 180;
  const n = [Math.sin(t) * Math.cos(f), Math.sin(t) * Math.sin(f), Math.cos(t)];
  const dot = (p) => p[0] * n[0] + p[1] * n[1] + p[2] * n[2];
  const pts = [];
  for (const [i, j] of CUBE_E) {
    const A = CUBE_V[i], B = CUBE_V[j], da = dot(A) - d, db = dot(B) - d;
    if ((da < 0 && db < 0) || (da > 0 && db > 0) || da === db) continue;
    const u = da / (da - db), P = A.map((c, k) => c + u * (B[k] - c));
    if (!pts.some((q) => Math.hypot(q[0] - P[0], q[1] - P[1], q[2] - P[2]) < 1e-6)) pts.push(P);
  }
  if (pts.length < 3) return { n, pts: [] };
  const c = [0, 1, 2].map((k) => pts.reduce((a, p) => a + p[k], 0) / pts.length);
  const e1 = Math.abs(n[2]) < 0.9 ? [n[1], -n[0], 0] : [0, n[2], -n[1]];
  const L = Math.hypot(...e1), u1 = e1.map((v) => v / L);
  const u2 = [n[1] * u1[2] - n[2] * u1[1], n[2] * u1[0] - n[0] * u1[2], n[0] * u1[1] - n[1] * u1[0]];
  const ang = (p) => { const w = p.map((v, k) => v - c[k]); return Math.atan2(w[0] * u2[0] + w[1] * u2[1] + w[2] * u2[2], w[0] * u1[0] + w[1] * u1[1] + w[2] * u1[2]); };
  pts.sort((a, b) => ang(a) - ang(b));
  return { n, pts };
}
const POLY = ['', '', '', 'triangle', 'quadrilateral', 'pentagon', 'hexagon'];
// faces of a cube net folding up by angle al (radians); each face is 4 corners
function netFaces(al) {
  const c = Math.cos(al), s = Math.sin(al), c2 = Math.cos(2 * al), s2 = Math.sin(2 * al);
  const sq = (f) => [[0, -1], [2, -1], [2, 1], [0, 1]].map(([u, v]) => f(u, v));
  return [
    { cls: 'blue', pts: sq((u, v) => [u - 1, v, 0]) },
    { cls: 'coral', pts: sq((u, v) => [1 + u * c, v, u * s]) },
    { cls: 'teal', pts: sq((u, v) => [-1 - u * c, v, u * s]) },
    { cls: 'amber', pts: sq((u, v) => [v, -1 - u * c, u * s]) },
    { cls: 'violet', pts: sq((u, v) => [v, 1 + u * c, u * s]) },
    { cls: 'pink', pts: sq((u, v) => [v, 1 + 2 * c + u * c2, 2 * s + u * s2]) },
  ];
}
// truncated cube: cut each corner a fraction t (0..1) of the way to the edge midpoints
function truncCube(t) {
  const V = [], E = [];
  if (t === 0) return { V: CUBE_V, E: CUBE_E, F: 6 };
  const key = (p) => p.map((v) => v.toFixed(4)).join();
  const idx = new Map();
  const add = (p) => { const k = key(p); if (!idx.has(k)) { idx.set(k, V.length); V.push(p); } return idx.get(k); };
  for (const [i, j] of CUBE_E) {
    const A = CUBE_V[i], B = CUBE_V[j];
    const a = add(A.map((c, k) => c + (t / 2) * (B[k] - c))), b = add(B.map((c, k) => c + (t / 2) * (A[k] - c)));
    if (a !== b) E.push([a, b]);
  }
  // triangle edges at each corner
  CUBE_V.forEach((A, i) => {
    const nb = CUBE_E.filter((e) => e.includes(i)).map(([p, q]) => (p === i ? q : p));
    const pts = nb.map((j) => add(A.map((c, k) => c + (t / 2) * (CUBE_V[j][k] - c))));
    for (let x = 0; x < 3; x++) for (let y = x + 1; y < 3; y++) if (!E.some(([p, q]) => (p === pts[x] && q === pts[y]) || (p === pts[y] && q === pts[x]))) E.push([pts[x], pts[y]]);
  });
  return { V, E, F: 14 };
}

const V0 = view(0.55, 0.42);
// draw a cube's edges, dashing the three hidden ones (those at the farthest corner)
function cubeEdges(plot, s, P) {
  const far = P.reduce((m, p, i) => (p[2] < P[m][2] ? i : m), 0);
  return CUBE_E.map(([i, j]) => s('line', { x1: plot.X(P[i][0]), y1: plot.Y(P[i][1]), x2: plot.X(P[j][0]), y2: plot.Y(P[j][1]), stroke: 'var(--ink)', 'stroke-width': i === far || j === far ? 1.5 : 2.5, 'stroke-dasharray': i === far || j === far ? '5 5' : null, opacity: i === far || j === far ? 0.5 : 1 }));
}

// squares (column, row) of four candidate cube nets
const NETS = [
  [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [2, 0]],
];

// n-cube drawn by projecting each vertex (a string of n bits) onto n directions spread over half a turn
const nCube = (n) => { const V = [], E = []; for (let m = 0; m < 2 ** n; m++) { let x = 0, y = 0; for (let k = 0; k < n; k++) if ((m >> k) & 1) { x += Math.cos((Math.PI * k) / n + 0.3); y += Math.sin((Math.PI * k) / n + 0.3); } V.push([x, y]); for (let k = 0; k < n; k++) if (!((m >> k) & 1)) E.push([m, m | (1 << k)]); } return { V, E }; };
// tesseract (±1 in four coordinates) rotated by angle a in the x–w plane, then shown in perspective
const tesseract = (a) => { const V = [], E = []; for (let m = 0; m < 16; m++) { const p = [0, 1, 2, 3].map((k) => ((m >> k) & 1 ? 1 : -1)); const x = p[0] * Math.cos(a) - p[3] * Math.sin(a), w = p[0] * Math.sin(a) + p[3] * Math.cos(a), f = 2.2 / (3.2 - w); let X = x * f, Y = p[1] * f, Z = p[2] * f; const c = Math.cos(0.6), s = Math.sin(0.6); [X, Z] = [X * c - Z * s, X * s + Z * c]; const c2 = Math.cos(0.35), s2 = Math.sin(0.35); [Y, Z] = [Y * c2 - Z * s2, Y * s2 + Z * c2]; V.push([X, Y, w]); for (let k = 0; k < 4; k++) if (!((m >> k) & 1)) E.push([m, m | (1 << k)]); } return { V, E }; };

export default {
  id: 'solids',
  subject: 'math',
  title: '3D Shapes',
  level: 'Intermediate',
  cover: 'solids',
  tagline: 'Platonic solids, Euler’s formula, volumes, cross-sections and nets.',
  description: r`Step into three dimensions. Meet the five perfect Platonic solids, discover Euler's surprising formula linking vertices, edges and faces, learn why a cone holds exactly a third of a cylinder and a sphere two-thirds, slice a cube into hexagons, unfold solids to find shortest paths, stack spheres as tightly as possible, and step into the fourth dimension.`,
  prereq: 'Geometry: Visual Proofs',
  chapters: [
    {
      title: 'Polyhedra',
      summary: 'Flat-faced solids.',
      lessons: [
        {
          id: 'platonic',
          title: 'Platonic Solids',
          summary: 'The five perfect shapes',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Perfect dice',
              prompt: 'A “fair” die has identical regular faces, with the same number meeting at every corner. Which of these numbers of faces is possible for such a die?',
              cols: 2,
              choices: [
                { t: '20', ok: true },
                { t: '10', why: 'A 10-sided die exists, but its faces aren’t regular polygons. Only 5 perfectly regular solids exist: 4, 6, 8, 12 and 20 faces.' },
                { t: '7', why: 'There’s no perfectly regular solid with 7 faces.' },
                { t: '16', why: 'There’s no perfectly regular solid with 16 faces.' },
              ],
              explain: r`Only five convex solids have identical regular polygon faces with the same number meeting at each corner: the **Platonic solids**, with 4, 6, 8, 12 and 20 faces. Tabletop gamers know them all as dice.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The five solids',
              body: r`Choose a solid and watch it rotate.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.4, xmax: 2.4, ymin: -2.1, ymax: 2.1, grid: false, axes: false, maxWidth: 460,
                animate: { param: 't', speed: 1, autoplay: true },
                params: { k: { min: 0, max: 4, step: 1, value: 1, label: 'solid', color: 'violet', format: (v) => NAMES[v] } },
                extra: ({ plot, p, s }) => {
                  const { V, E } = SOLIDS[p.k];
                  const a = p.t * 0.6, b = 0.5 + 0.3 * Math.sin(p.t * 0.3);
                  const P = V.map(([x, y, z]) => {
                    const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a);
                    const y2 = y * Math.cos(b) - z1 * Math.sin(b), z2 = y * Math.sin(b) + z1 * Math.cos(b);
                    return [x1, y2, z2];
                  });
                  const els = E.map(([i, j]) => {
                    const depth = (P[i][2] + P[j][2]) / 2;
                    return s('line', { x1: plot.X(P[i][0]), y1: plot.Y(P[i][1]), x2: plot.X(P[j][0]), y2: plot.Y(P[j][1]), stroke: 'var(--violet)', 'stroke-width': depth > 0 ? 3.5 : 1.5, opacity: depth > 0 ? 1 : 0.35, 'stroke-linecap': 'round' });
                  });
                  P.forEach(([x, y, z]) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: z > 0 ? 4 : 2.5, class: 'fl-violet', opacity: z > 0 ? 1 : 0.4 })));
                  return els;
                },
                readout: (p) => { const { V, E } = SOLIDS[p.k]; const F = FACES[NAMES[p.k]]; return r`${NAMES[p.k]}: $V = ${V.length}$, $E = ${E.length}$, $F = ${F}$`; },
              },
            },
            {
              type: 'mcq',
              title: 'Why only five?',
              prompt: 'Why can’t six or more equilateral triangles meet at a corner of a convex solid?',
              choices: [
                { t: 'Six triangles’ angles add up to 360°, so they lie flat and can’t fold into a corner', ok: true },
                { t: 'The triangles would be too small', why: 'Size doesn’t matter. The angles around the corner do.' },
                { t: 'They can: that makes another solid', why: r`$6 \times 60° = 360°$ makes a flat tiling, not a corner. A corner needs less than 360°.` },
              ],
              explain: r`To fold into a corner, the face angles meeting there must add up to **less than 360°**. Triangles (60°): 3, 4 or 5 can meet, giving the tetrahedron, octahedron and icosahedron. Squares (90°): only 3, giving the cube. Pentagons (108°): only 3, giving the dodecahedron. Hexagons (120°): $3 \times 120° = 360°$ is already flat. So there are exactly five.`,
            },
            {
              type: 'mcq',
              title: 'Dual solids',
              prompt: 'Put a dot at the centre of each face of a cube, and join the dots on neighbouring faces. Which solid do the dots and lines make?',
              cols: 2,
              choices: [
                { t: 'An octahedron', ok: true },
                { t: 'A smaller cube', why: 'A cube has 6 faces, so you get 6 dots, but a cube has 8 corners.' },
                { t: 'A tetrahedron', why: 'A cube has 6 faces, so there are 6 dots. A tetrahedron has only 4 corners.' },
                { t: 'An icosahedron', why: 'An icosahedron has 12 corners, but a cube gives only 6 dots.' },
              ],
              explain: r`6 dots, each joined to 4 neighbours: an octahedron (6 vertices, 8 faces), the **dual** of the cube (8 vertices, 6 faces). Duals swap the numbers of vertices and faces and keep the edges. The dodecahedron and icosahedron are duals too, and the tetrahedron is its own dual. That's why the table of Platonic solids has those mirror-image rows.`,
            },
            {
              type: 'numeric',
              title: 'Missing angles',
              body: r`At each corner of a cube, three 90° angles meet, adding up to 270°. The **angle defect** is what's missing from a flat 360°: here 90°. Adding up the defects of all 8 corners gives $8 \times 90° = 720°$.`,
              prompt: 'Three regular pentagons (108° angles) meet at each of the 20 corners of a dodecahedron. What is the total angle defect?',
              unit: '°',
              answer: 720,
              wrong: [{ v: 36, why: 'That’s the defect at one corner. Add up all 20 corners.' }, { v: 6480, why: r`That's the total of the face angles, $20 \times 324°$. The defect is what's missing: $360° - 324°$ at each corner.` }],
              explain: r`Each corner has $360° - 3 \times 108° = 36°$ missing, and $20 \times 36° = 720°$ again. **Descartes** discovered that every convex polyhedron has total defect exactly $720°$, two full turns. It's Euler's formula in disguise: the tetrahedron ($4 \times 180°$), octahedron ($6 \times 120°$) and icosahedron ($12 \times 60°$) all give 720° too.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Counting edges',
              prompt: 'An icosahedron has 20 triangular faces. How many edges does it have? (Hint: each edge is shared by 2 faces.)',
              answer: 30,
              wrong: [{ v: 60, why: r`$20 \times 3 = 60$ counts every edge twice, once for each face that shares it.` }],
              explain: r`$20$ faces $\times 3$ edges each $= 60$, but each edge belongs to 2 faces, so there are $60 / 2 = 30$ edges.`,
            },
          ],
          recap: [
            'There are exactly five Platonic solids: 4, 6, 8, 12 and 20 faces.',
            'The angles at a corner must add up to less than 360°, which limits the possibilities.',
            'Count edges by counting face-edges and halving.',
          ],
        },
        {
          id: 'euler-formula',
          title: 'Euler’s Formula',
          summary: 'V − E + F = 2',
          icon: 'sigma',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A cube’s numbers',
              prompt: 'A cube has 8 vertices, 12 edges and 6 faces. What is V − E + F?',
              answer: 2,
              wrong: [{ v: 26, why: 'Subtract the edges: 8 − 12 + 6.' }],
              explain: r`$8 - 12 + 6 = 2$. Try the other solids from the previous lesson. You always get 2!`,
            },
            {
              type: 'explain',
              title: 'Euler’s polyhedron formula',
              body: r`::: key
For any convex polyhedron (no holes): $V - E + F = 2$.
:::

| Solid | V | E | F | V − E + F |
|---|---|---|---|---|
| Tetrahedron | 4 | 6 | 4 | 2 |
| Cube | 8 | 12 | 6 | 2 |
| Octahedron | 6 | 12 | 8 | 2 |
| Dodecahedron | 20 | 30 | 12 | 2 |
| Icosahedron | 12 | 30 | 20 | 2 |

Euler noticed this in 1750. It holds for **every** convex polyhedron: a prism, a pyramid, even a soccer ball (12 pentagons and 20 hexagons).`,
            },
            {
              type: 'numeric',
              title: 'Soccer ball',
              prompt: 'A classic soccer ball has 12 pentagons and 20 hexagons (32 faces) and 90 edges. How many vertices does it have?',
              answer: 60,
              wrong: [{ v: 56, why: r`$V = 2 + E - F = 2 + 90 - 32$.` }, { v: 124, why: 'Use V − E + F = 2, which gives V = 2 + E − F.' }],
              explain: r`$V = 2 + E - F = 2 + 90 - 32 = 60$. (The carbon molecule C₆₀, a "buckyball", has exactly this shape, with 60 carbon atoms.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Cutting corners',
              body: r`Slice off the corners of a cube. Each cut adds a triangular face and turns the square faces into octagons, which shrink into smaller squares, tilted at 45°, when the cuts meet. Watch the counts.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.1, xmax: 2.1, ymin: -1.9, ymax: 1.9, grid: false, axes: false, maxWidth: 440,
                animate: { param: 't', speed: 1, autoplay: true },
                params: { cut: { min: 0, max: 1, step: 0.05, value: 0.4, label: 'cut depth', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const { V, E } = truncCube(p.cut);
                  const P = V.map(view(p.t * 0.5, 0.45));
                  const els = E.map(([i, j]) => {
                    const front = P[i][2] + P[j][2] > 0;
                    return s('line', { x1: plot.X(P[i][0]), y1: plot.Y(P[i][1]), x2: plot.X(P[j][0]), y2: plot.Y(P[j][1]), stroke: 'var(--teal)', 'stroke-width': front ? 3.5 : 1.5, opacity: front ? 1 : 0.35, 'stroke-linecap': 'round' });
                  });
                  P.forEach(([x, y, z]) => els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: z > 0 ? 4 : 2.5, class: 'fl-teal', opacity: z > 0 ? 1 : 0.4 })));
                  return els;
                },
                readout: (p) => { const { V, E, F } = truncCube(p.cut); return r`$V = ${V.length}$, $E = ${E.length}$, $F = ${F}$, so $V - E + F = ${V.length - E.length + F}$`; },
              },
              after: r`Each cut replaces 1 vertex by 3 and adds 3 edges and 1 face: $+2 - 3 + 1 = 0$, so $V - E + F$ can't change. At full depth the cuts meet and the cube becomes a **cuboctahedron**, with 12 vertices, 24 edges and 14 faces.`,
            },
            {
              type: 'numeric',
              title: 'Where soccer balls come from',
              prompt: 'An icosahedron has 20 triangular faces, and 5 meet at each of its 12 corners. Slice off every corner a third of the way along each edge: each cut makes a new pentagon, and each triangle becomes a hexagon. How many faces does the new solid have?',
              answer: 32,
              wrong: [{ v: 20, why: 'The 20 old faces survive (as hexagons), but each of the 12 cuts adds a pentagon.' }, { v: 12, why: 'That’s just the new pentagons. The old faces are still there, as hexagons.' }],
              explain: r`$20$ hexagons $+ 12$ pentagons $= 32$ faces: the **truncated icosahedron**, the classic soccer ball and the shape of the C₆₀ molecule. It is one of the 13 **Archimedean solids**, built from regular polygons of more than one kind with every corner alike.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'With a hole',
              prompt: 'For a polyhedron shaped like a picture frame (a ring with a hole through it), what does V − E + F come out to?',
              cols: 2,
              choices: [
                { t: '0', ok: true },
                { t: '2', why: 'The formula changes for shapes with holes. Each hole subtracts 2.' },
                { t: '4', why: 'A hole lowers the value. It doesn’t raise it.' },
              ],
              explain: r`For a surface with $g$ holes, $V - E + F = 2 - 2g$. A ring has one hole, so the value is 0. This number, the **Euler characteristic**, can't be changed by stretching or bending, which makes it a founding idea of **topology**.`,
            },
          ],
          recap: [
            r`Euler: $V - E + F = 2$ for every convex polyhedron.`,
            'Use it to find a missing count (like the vertices of a soccer ball).',
            'Shapes with holes give 2 − 2g instead, a first taste of topology.',
          ],
        },
      ],
    },
    {
      title: 'Volume',
      summary: 'Cones, cylinders and spheres.',
      lessons: [
        {
          id: 'volume',
          title: 'Cones, Cylinders, Spheres',
          summary: 'Archimedes’ favourite result',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Cylinder',
              prompt: r`A can has radius 3 cm and height 10 cm. What is its volume, as a multiple of π?`,
              unit: r`$\times\,\pi$ cm³`,
              answer: 90,
              wrong: [{ v: 30, why: r`$V = \pi r^2 h = \pi \times 9 \times 10$. Remember to square the radius.` }, { v: 60, why: r`Square the radius: $3^2 = 9$, not 6.` }],
              explain: r`A cylinder is a stack of circles: $V = \pi r^2 h = \pi \times 9 \times 10 = 90\pi \approx 283$ cm³.`,
            },
            {
              type: 'explain',
              title: 'A cone is a third',
              body: r`A cone with the same base and height as a cylinder holds exactly **one third** as much:
$$V_\text{cone} = \tfrac13 \pi r^2 h$$
You can check this by filling a cone with water three times to fill the matching cylinder. The same $\tfrac13$ applies to every pyramid, compared with the prism that has the same base and height.`,
            },
            {
              type: 'mcq',
              title: 'Cavalieri’s principle',
              body: r`Two stacks of 20 coins have the same height. One is neat and straight, the other is leaning and skewed.`,
              prompt: 'How do their volumes compare?',
              choices: [
                { t: 'They are equal', ok: true },
                { t: 'The leaning stack has more volume', why: 'It looks bigger, but every horizontal slice (a coin) has exactly the same area in both stacks.' },
                { t: 'The straight stack has more volume', why: 'Every horizontal slice matches, so the volumes match too.' },
              ],
              explain: r`**Cavalieri's principle:** if two solids have equal cross-sectional areas at every height, they have equal volumes. Slanting a stack doesn't change any slice. (This is the 3D version of the triangle-sliding trick from the Geometry course.)`,
            },
            {
              type: 'explain',
              title: 'The sphere',
              body: r`Archimedes discovered that a sphere fits inside a cylinder (with the same radius $r$ and height $2r$) and takes up exactly **two-thirds** of its volume:
$$V_\text{sphere} = \tfrac23 \times \pi r^2 (2r) = \tfrac43 \pi r^3$$
He was so proud of this that he asked for a sphere inside a cylinder to be carved on his tomb. Cicero reported finding the tomb, with the carving, about 140 years later.

Using Cavalieri's principle: at every height, a slice of the hemisphere has the same area as a slice of a cylinder with a cone removed. So hemisphere = cylinder − cone $= \pi r^3 - \tfrac13 \pi r^3 = \tfrac23 \pi r^3$.`,
            },
            {
              type: 'numeric',
              title: 'Ball volume',
              prompt: 'What is the volume of a ball with radius 3 cm, as a multiple of π?',
              unit: r`$\times\,\pi$ cm³`,
              answer: 36,
              wrong: [{ v: 27, why: r`Don't forget the $\tfrac43$: $\tfrac43 \times 27$.` }, { v: 12, why: r`Cube the radius: $3^3 = 27$, then multiply by $\tfrac43$.` }],
              explain: r`$\tfrac43 \pi \times 3^3 = \tfrac43 \times 27\pi = 36\pi \approx 113$ cm³.`,
            },
            {
              type: 'interactive',
              title: 'Archimedes’ favourite',
              body: r`A sphere of radius 1 fits snugly in a cylinder of radius 1 and height 2. Fill the cylinder with water to height $h$, so the water has volume $\pi h$. Find the height at which the water’s volume **equals the sphere’s**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -0.15, ymax: 2.15, grid: false, axes: false, maxWidth: 280,
                params: { h: { min: 0, max: 2, step: 0.01, value: 1, label: 'water height', color: 'blue', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => [s('rect', { x: plot.X(-1), y: plot.Y(p.h), width: plot.X(1) - plot.X(-1), height: plot.Y(0) - plot.Y(p.h), class: 'fl-blue-soft' }), s('rect', { x: plot.X(-1), y: plot.Y(2), width: plot.X(1) - plot.X(-1), height: plot.Y(0) - plot.Y(2), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2.5 }), s('circle', { cx: plot.X(0), cy: plot.Y(1), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' })],
                readout: (p) => `water **${(Math.PI * p.h).toFixed(3)}** · sphere ${((4 / 3) * Math.PI).toFixed(3)} · cylinder ${(2 * Math.PI).toFixed(3)}`,
                goal: (p) => Math.abs(p.h - 4 / 3) < 0.006,
                hint: 'Solve π h = 4π/3.',
                solution: { h: 1.33 },
              },
              explain: r`$h = \frac43$, two-thirds of the way up: the sphere is exactly **two-thirds** of its cylinder. Archimedes was so proud of this that he asked for a sphere inside a cylinder to be carved on his tomb.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Scaling up',
              prompt: 'A spherical balloon’s radius doubles. By what factor does its volume increase?',
              answer: 8,
              wrong: [{ v: 4, why: r`That's the factor for surface area ($r^2$). Volume grows as $r^3$.` }, { v: 2, why: r`Volume depends on $r^3$: $2^3 = 8$.` }],
              explain: r`$V \propto r^3$, so doubling the radius multiplies the volume by $2^3 = 8$ (and the surface area by $2^2 = 4$). That's the square–cube law again, from the Geometry course.`,
            },
          ],
          recap: [
            r`Cylinder $\pi r^2 h$. Cone (and pyramid) $\tfrac13$ of the matching prism.`,
            'Cavalieri: equal slices at every height mean equal volumes.',
            r`Sphere: $\tfrac43\pi r^3$, two-thirds of its surrounding cylinder (Archimedes).`,
          ],
        },
      ],
    },
    {
      title: 'Slicing and Unfolding',
      summary: 'Cross-sections, nets and shortest paths.',
      lessons: [
        {
          id: 'slices',
          title: 'Cross-Sections',
          summary: 'What’s inside a cube?',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Cut off a corner',
              prompt: 'You saw a small corner off a wooden cube with one straight cut. What shape is the new flat face?',
              cols: 2,
              choices: [
                { t: 'A triangle', ok: true },
                { t: 'A square', why: 'The cut crosses only the three faces that meet at that corner.' },
                { t: 'A circle', why: 'A flat cut through flat faces always gives straight sides.' },
                { t: 'A pentagon', why: 'The cut crosses only the three faces meeting at the corner, so it has three sides.' },
              ],
              explain: r`Three faces meet at the corner, and the cut crosses each of them in a straight line: a triangle. In general, each side of a cross-section is where the plane crosses one face of the solid.`,
            },
            {
              type: 'interactive',
              title: 'Slice a cube',
              body: r`Tilt and slide the cutting plane. The coloured region is where it slices through the cube. Find a slice with **six** sides.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2, xmax: 2, ymin: -1.8, ymax: 1.8, grid: false, axes: false, maxWidth: 440,
                params: {
                  th: { min: 0, max: 90, step: 1, value: 15, label: 'tilt', color: 'blue', format: (v) => `${v}°` },
                  ph: { min: 0, max: 90, step: 1, value: 60, label: 'turn', color: 'violet', format: (v) => `${v}°` },
                  d: { min: -1.7, max: 1.7, step: 0.05, value: 0.4, label: 'offset', color: 'coral' },
                },
                extra: ({ plot, p, s }) => {
                  const P = CUBE_V.map(V0);
                  const { pts } = cubeSlice(p.th, p.ph, p.d);
                  const Q = pts.map(V0);
                  return [
                    ...cubeEdges(plot, s, P),
                    Q.length ? s('polygon', { points: Q.map(([x, y]) => `${plot.X(x)},${plot.Y(y)}`).join(' '), class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 3, opacity: 0.9 }) : null,
                  ];
                },
                readout: (p) => { const k = cubeSlice(p.th, p.ph, p.d).pts.length; return k ? `The slice is a **${POLY[k]}** (${k} sides).` : 'The plane misses the cube.'; },
                goal: (p) => cubeSlice(p.th, p.ph, p.d).pts.length === 6,
                hint: 'Tilt the plane so that it leans across all three directions, then slide it through the middle of the cube.',
                solution: { th: 55, ph: 45, d: 0 },
              },
              explain: r`A plane tilted towards a corner, passing near the centre, crosses all six faces and makes a hexagon. With tilt about 55° and turn 45° it's perpendicular to the long diagonal joining opposite corners, and through the centre the hexagon is **regular**. Sliding that same plane towards a corner shrinks the hexagon into a triangle.`,
            },
            {
              type: 'mcq',
              title: 'Seven sides?',
              prompt: 'Can a flat slice through a cube ever have 7 sides?',
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes, at the right angle', why: 'Each side of the slice lies in a different face of the cube, and a cube has only 6 faces.' },
              ],
              explain: r`A plane meets each flat face in at most one straight segment, so every side of the slice comes from a different face. A cube has 6 faces, so 6 sides is the maximum. A dodecahedron, with 12 faces, can be sliced into a decagon.`,
            },
            {
              type: 'numeric',
              title: 'The regular hexagon',
              body: r`Slice a cube of side 1 through its centre, perpendicular to the long diagonal. The plane cuts six edges exactly at their midpoints, giving a regular hexagon.`,
              prompt: 'What is the area of the hexagon? (3 decimal places.)',
              answer: (3 * Math.sqrt(3)) / 4,
              tol: 0.003,
              wrong: [{ v: Math.sqrt(3) / 4 * 6, tol: 0.003, why: r`That's for a hexagon with side 1. The side here joins two edge midpoints on one face: $\sqrt{0.5^2 + 0.5^2}$.` }, { v: 1, tol: 0.01, why: 'The hexagon is a little bigger than a face of the cube. Find its side first.' }],
              hint: r`Each side joins the midpoints of two neighbouring edges of a face, so it has length $\frac{\sqrt2}{2}$. A regular hexagon is 6 equilateral triangles, each with area $\frac{\sqrt3}{4}s^2$.`,
              explain: r`Side $s = \frac{\sqrt2}{2}$, so $s^2 = \frac12$. Area $= 6 \times \frac{\sqrt3}{4} \times \frac12 = \frac{3\sqrt3}{4} \approx 1.299$, about 30% more than a face. It is the largest slice perpendicular to that diagonal.`,
            },
            {
              type: 'explain',
              title: 'Slices everywhere',
              body: r`Cross-sections are how we see inside solid things:

- **Spheres** always slice into circles. **Cylinders** give circles, ellipses or rectangles; **cones** give all the conic sections (see the Conics course).
- **CT and MRI scanners** image the body one slice at a time, and computers stack the slices back into a 3D model.
- **Cavalieri's principle**, from the Volume lesson, says that if two solids have equal slices at every height, they have equal volumes. Slices carry all the information about volume.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A regular pentagon?',
              body: r`Slices of a cube can be pentagons, as you may have seen.`,
              prompt: 'Can a slice of a cube be a *regular* pentagon (all sides and angles equal)?',
              choices: [
                { t: 'No: a pentagonal slice always has two pairs of parallel sides', ok: true },
                { t: 'Yes, at just the right tilt', why: 'Think about the cube’s opposite faces, which are parallel. What does that force on the slice?' },
                { t: 'No: pentagonal slices don’t exist', why: 'They do: tilt the plane in two directions and cut near a corner.' },
              ],
              explain: r`A pentagonal slice crosses 5 of the 6 faces. The faces come in 3 parallel pairs, so at least 2 pairs of opposite faces are both crossed. A plane meets two parallel faces in parallel lines, so the pentagon has two pairs of parallel sides. A regular pentagon has **no** parallel sides at all, so it's impossible.`,
            },
          ],
          recap: [
            'Each side of a cross-section lies in a different face, so a cube’s slices have 3 to 6 sides.',
            'A slice through the centre perpendicular to a long diagonal is a regular hexagon.',
            'Parallel faces give parallel sides, which rules out a regular pentagon.',
          ],
        },
        {
          id: 'nets',
          title: 'Nets & Shortest Paths',
          summary: 'Unfold a solid to understand it',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Fold it up',
              body: r`A **net** is a flat pattern that folds up into a solid. Fold this cross-shaped net and watch it become a cube.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.4, xmax: 3.4, ymin: -2.6, ymax: 3.2, grid: false, axes: false, maxWidth: 480,
                params: { f: { min: 0, max: 90, step: 1, value: 0, label: 'fold', color: 'blue', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const V = view(0.5, 0.75);
                  const faces = netFaces((p.f * Math.PI) / 180).map((fc) => { const P = fc.pts.map((q) => V([q[0], q[1] - 0.6, q[2] - 0.8])); return { ...fc, P, z: P.reduce((a, q) => a + q[2], 0) / 4 }; });
                  faces.sort((a, b) => a.z - b.z);
                  return faces.map(({ cls, P }) => s('polygon', { points: P.map(([x, y]) => `${plot.X(x)},${plot.Y(y)}`).join(' '), class: `fl-${cls}-soft`, stroke: `var(--${cls})`, 'stroke-width': 2.5, opacity: 0.92 }));
                },
                readout: (p) => (p.f === 90 ? 'A closed cube!' : `Each flap is folded ${p.f}° up from flat.`),
              },
              after: r`The pink square is attached to the violet flap, so it swings round twice as far and closes the lid. Packaging designers work with nets all day: every cereal box starts life as one flat piece of card.`,
            },
            {
              type: 'mcq',
              title: 'Which one folds?',
              widget: {
                kind: 'figure', w: 600, h: 170, label: 'Four arrangements of six squares, labelled A to D',
                draw: ({ s }) => NETS.flatMap((net, k) => [
                  ...net.map(([c, rw]) => s('rect', { x: 14 + 150 * k + 24 * c, y: 30 + 24 * rw, width: 24, height: 24, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 })),
                  s('text', { x: 14 + 150 * k + 60, y: 160, class: 'lbl', 'text-anchor': 'middle', text: 'ABCD'[k] }),
                ]),
              },
              prompt: 'Which of these patterns folds into a cube?',
              cols: 2,
              choices: [
                { t: 'C', ok: true },
                { t: 'A', why: 'Wrap the row of four into a loop: both squares on top land on the same face, leaving the bottom open.' },
                { t: 'B', why: 'Four squares meeting at one point can’t fold into a corner: only three faces meet at each corner of a cube.' },
                { t: 'D', why: 'Five squares in a row: wrapped into a loop, the fifth overlaps the first.' },
              ],
              explain: r`C, the "staircase", folds up perfectly. A puts two squares on the same face, B has four squares around a point (a cube's corner has only three), and D has five in a row, which overlap when wrapped. Tip: four squares in a row always form the four walls; then there must be exactly one square on each side of the row, to make the top and bottom.`,
            },
            {
              type: 'mcq',
              title: 'How many nets?',
              prompt: 'Counting rotations and reflections as the same, how many different nets does a cube have?',
              cols: 2,
              choices: [
                { t: '11', ok: true },
                { t: '6', why: 'There are more. Try listing them by the longest row of squares (4, 3 or 2).' },
                { t: '20', why: 'Fewer than that. Once rotations and reflections are matched up, there are 11.' },
                { t: '35', why: 'That’s the number of hexominoes (shapes made from six squares). Only some of them fold into a cube.' },
              ],
              explain: r`There are 35 ways to join six squares edge to edge (the hexominoes), but only **11** of them fold into a cube: 6 with a row of four, 4 with a longest row of three, and the staircase. Whether every convex polyhedron can be cut along its edges and unfolded flat without overlapping is a famous open problem, posed in its modern form in 1975.`,
            },
            {
              type: 'numeric',
              title: 'Wrapping a box',
              prompt: 'A box is 30 cm long, 20 cm wide and 10 cm tall. How much card does its net use, ignoring the glue flaps?',
              unit: 'cm²',
              answer: 2200,
              wrong: [{ v: 6000, why: 'That’s the volume in cm³. The net is six rectangles: two of each size.' }, { v: 1100, why: 'Each rectangle appears twice: top and bottom, front and back, two ends.' }],
              explain: r`The net is three pairs of rectangles: $2 \times (30 \times 20 + 30 \times 10 + 20 \times 10) = 2 \times 1100 = 2200$ cm². The surface area of any polyhedron is just the area of its net.`,
            },
            {
              type: 'numeric',
              title: 'An ant’s shortcut',
              body: r`An ant on a cube of side 1 m wants to crawl from one corner to the opposite corner, walking only on the surface.`,
              widget: {
                kind: 'figure', w: 600, h: 200, label: 'Two faces of the cube unfolded into a 2 by 1 rectangle, with a straight path across it',
                draw: ({ s }) => [
                  s('rect', { x: 180, y: 40, width: 120, height: 120, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }),
                  s('rect', { x: 300, y: 40, width: 120, height: 120, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 }),
                  s('line', { x1: 180, y1: 160, x2: 420, y2: 40, stroke: 'var(--coral)', 'stroke-width': 4, 'stroke-dasharray': '8 6' }),
                  s('circle', { cx: 180, cy: 160, r: 7, class: 'fl-coral' }), s('circle', { cx: 420, cy: 40, r: 7, class: 'fl-coral' }),
                  s('text', { x: 240, y: 185, class: 'lbl', 'text-anchor': 'middle', text: 'top face' }), s('text', { x: 360, y: 185, class: 'lbl', 'text-anchor': 'middle', text: 'side face' }),
                ],
              },
              prompt: 'Unfold two faces as shown. How long is the shortest crawl, in metres? (3 decimal places.)',
              unit: 'm',
              answer: Math.sqrt(5),
              tol: 0.002,
              wrong: [{ v: 2, tol: 0.002, why: 'That’s going along two edges. Cutting diagonally across the unfolded faces is shorter.' }, { v: Math.sqrt(3), tol: 0.002, why: 'That’s the straight line through the inside of the cube. The ant must stay on the surface.' }, { v: 1 + Math.SQRT2, tol: 0.002, why: 'That’s one edge plus one face diagonal. A single straight line across the unfolded faces is shorter.' }],
              explain: r`Unfolded, the two faces make a $2 \times 1$ rectangle, and the shortest path is its diagonal: $\sqrt{2^2 + 1^2} = \sqrt5 \approx 2.236$ m. It crosses the shared edge at its midpoint. Unfolding turns a hard 3D problem into straight lines on paper.`,
            },
            {
              type: 'explain',
              title: 'The surface of a sphere',
              body: r`A sphere can't be unfolded flat (that's why every map distorts something), but Archimedes found its area another way. Cut the ball into a huge number of thin pyramids, each with its tip at the centre and a tiny patch of the surface as its base. Each has height $r$, so the volumes add up to
$$V = \tfrac13 \times (\text{total base area}) \times r = \tfrac13 A r.$$
With $V = \tfrac43 \pi r^3$, this gives the surface area
$$A = \frac{3V}{r} = 4\pi r^2,$$
exactly four times the area of the sphere's widest circle.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The spider and the fly',
              body: r`A puzzle by Henry Dudeney (1903). A room is 30 ft long, 12 ft wide and 12 ft high. A spider sits on one end wall, centred left to right, 1 ft below the ceiling. A fly sits on the opposite end wall, centred, 1 ft above the floor. The spider must crawl over the walls, floor or ceiling.`,
              prompt: 'What is the shortest route, in feet?',
              unit: 'ft',
              answer: 40,
              wrong: [{ v: 42, why: 'That’s the obvious route: up 1, across the ceiling 30, down 11. A clever unfolding crosses five faces diagonally and saves 2 ft.' }, { v: 30, why: 'The spider can’t fly straight across the room.' }],
              hint: r`Unfold the end wall, ceiling, one side wall, floor and other end wall into one flat piece so that the route is a straight line. Then find the two legs of the right triangle.`,
              explain: r`The obvious route is $1 + 30 + 11 = 42$ ft. Instead, lay the ceiling, one side wall and the floor side by side as a strip, with the spider's end wall unfolded off the ceiling and the fly's end wall off the floor. In this flat picture the spider and fly are $1 + 30 + 1 = 32$ ft apart along the room and $6 + 12 + 6 = 24$ ft apart across it, so the straight route is $\sqrt{32^2 + 24^2} = 40$ ft. It crosses five of the six faces (end wall, ceiling, side wall, floor, end wall), yet it's 2 ft shorter.`,
            },
          ],
          recap: [
            'A net is a flat pattern that folds into a solid: a cube has 11 of them.',
            'Surface area is the area of the net.',
            'Unfolding turns shortest paths on a surface into straight lines (√5 across a cube; 40 ft for Dudeney’s spider).',
            'A sphere can’t be unfolded, but thin pyramids give its area: 4πr².',
          ],
        },
      ],
    },
    {
      title: 'Packing and Higher Dimensions',
      summary: 'Stacking spheres, and cubes beyond three dimensions.',
      lessons: [
        {
          id: 'packing',
          title: 'Packing Spheres',
          summary: 'The greengrocer’s problem',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Stacking oranges',
              body: r`How should you stack identical balls to waste as little space as possible? In 1611 Johannes Kepler guessed that the greengrocer’s pyramid of oranges is the best possible. The quality of a packing is its **density**: the fraction of space filled by the balls.

It helps to start in two dimensions: circles on a table.`,
            },
            {
              type: 'numeric',
              title: 'A square grid',
              prompt: r`Coins of diameter 1 sit on a square grid, each in its own $1 \times 1$ square. What fraction of the table do they cover? (3 decimal places.)`,
              answer: Math.PI / 4,
              tol: 0.001,
              explain: r`Each square of area 1 holds one circle of area $\pi \left(\tfrac12\right)^2 = \frac{\pi}{4} \approx 0.785$. About 21.5% of the table is gaps.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Shift the rows',
              prompt: r`Slide each row of coins sideways relative to the one below, and the rows can drop closer together into the hollows. Find the shift that gives the **densest** packing.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 8, ymin: 0, ymax: 6, grid: false, axes: false, maxWidth: 440, pad: 6,
                params: { sft: { min: 0, max: 1, step: 0.05, value: 0, label: 'row shift', color: 'violet', format: (v) => `${v.toFixed(2)} diameters` } },
                extra: ({ plot, p, s }) => { const off = Math.min(p.sft, 1 - p.sft), hh = Math.sqrt(1 - off * off), out = []; for (let r = 0; r * hh < 5.5; r++) for (let c = -1; c < 9; c++) { const x = 0.5 + c + ((r * p.sft) % 1), y = 0.5 + r * hh; if (x < 0.4 || x > 7.6) continue; out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: plot.X(0.5) - plot.X(0) - 0.5, class: r % 2 ? 'fl-amber-soft' : 'fl-coral-soft', stroke: r % 2 ? 'var(--amber)' : 'var(--coral)', 'stroke-width': 1.5 })); } return out; },
                readout: (p) => { const off = Math.min(p.sft, 1 - p.sft), hh = Math.sqrt(1 - off * off); return `row spacing **${hh.toFixed(3)}** · density **${((100 * Math.PI) / 4 / hh).toFixed(1)}%**`; },
                goal: (p) => Math.abs(p.sft - 0.5) < 0.01,
                hint: 'Each coin should sit exactly in the hollow between two coins below.',
                solution: { sft: 0.5 },
              },
              explain: r`A shift of half a diameter lets each coin nest between two below. The rows are then only $\frac{\sqrt3}{2} \approx 0.866$ apart, and the density rises to $\frac{\pi}{2\sqrt3} \approx 90.7\%$: the **hexagonal** packing, where every coin touches six others. It is the best possible in two dimensions, as proved by László Fejes Tóth in 1940 (with earlier work by Axel Thue).`,
            },
            {
              type: 'numeric',
              title: 'The greengrocer’s density',
              prompt: r`In three dimensions, the greengrocer’s stacking (the face-centred cubic packing) fits exactly 4 balls of radius $r$ into a cube of side $2\sqrt2\,r$. What fraction of space do the balls fill? (3 decimal places.)`,
              answer: Math.PI / (3 * Math.sqrt(2)),
              tol: 0.001,
              hint: r`Compare $4 \times \frac43\pi r^3$ with $(2\sqrt2\,r)^3 = 16\sqrt2\,r^3$.`,
              explain: r`$\frac{4 \times \frac43 \pi r^3}{16\sqrt2\,r^3} = \frac{\pi}{3\sqrt2} \approx 0.740$. Even the best stacking leaves 26% of the space empty. Shaking balls into a jar at random gives only about 64%.`,
            },
            {
              type: 'mcq',
              title: 'Kepler’s conjecture',
              prompt: r`Kepler’s guess, that no packing of equal spheres beats 74.05%, remained unproved for centuries. What finally settled it?`,
              choices: [
                { t: 'A proof by Thomas Hales (1998) relying on huge computer calculations, later fully checked by computer (2014)', ok: true },
                { t: 'Gauss proved it in 1831', why: 'Gauss proved it only for regular, lattice-like packings. Irregular packings were the hard part.' },
                { t: 'It is still open', why: 'It was settled, though the proof was so long that referees could not check it by hand.' },
              ],
              explain: r`Hales reduced the problem to checking thousands of special configurations by computer. Referees were "99% certain" but could not verify everything, so Hales led the Flyspeck project, which completed a formal, computer-checked proof in 2014.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Kissing spheres',
              prompt: r`In the hexagonal packing each coin touches 6 others, the most possible in 2D. In the greengrocer’s packing, how many balls touch each ball?`,
              answer: 12,
              wrong: [{ v: 6, why: 'Count the layers above and below too, not just the balls in the same layer.' }, { v: 8, why: 'Each ball touches 6 in its own layer, plus 3 in the layer above and 3 below.' }],
              explain: r`6 in its own layer, 3 nestled above and 3 below: **12**. Isaac Newton and David Gregory argued in 1694 about whether a 13th could squeeze in (there is a little room to spare). Newton was right that 12 is the maximum, but this was only proved in 1953.`,
            },
          ],
          recap: [
            'Hexagonal packing of circles fills π/(2√3) ≈ 90.7% of the plane, the best possible.',
            'The greengrocer’s stacking of spheres fills π/(3√2) ≈ 74%.',
            'Kepler’s conjecture that nothing beats it was proved by Hales with computer help.',
          ],
        },
        {
          id: 'fourth-dimension',
          title: 'The Fourth Dimension',
          summary: 'Hypercubes by analogy',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Dragging into new directions',
              body: r`Take a point and drag it: it sweeps out a **segment**. Drag the segment at right angles: a **square**. Drag the square in a third direction: a **cube**.

Nothing stops the algebra from going on. A point in four dimensions has four coordinates $(x, y, z, w)$; dragging a cube in the $w$ direction sweeps out a **tesseract**, or 4-cube. We can’t picture it directly, but we can count its parts and draw its shadows, just as a drawing of a cube on paper is a 2D shadow of a 3D object.`,
            },
            {
              type: 'numeric',
              title: 'Corners of a tesseract',
              prompt: r`Each time you drag, every corner leaves a copy behind, so the number of corners doubles: 1, 2, 4, 8, … How many corners does a tesseract have?`,
              answer: 16,
              explain: r`$2^4 = 16$. In coordinates, they are all the points with each of $x, y, z, w$ equal to 0 or 1.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Cubes of every dimension',
              prompt: r`Each picture is a shadow of an $n$-dimensional cube: corners are strings of $n$ zeros and ones, and edges join corners that differ in one place. Find the dimension whose cube has exactly **80 edges**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.2, xmax: 2.2, ymin: -2.2, ymax: 2.2, grid: false, axes: false, maxWidth: 360, pad: 6,
                params: { n: { min: 1, max: 7, step: 1, value: 3, label: 'dimension n', color: 'violet' } },
                extra: ({ plot, p, s }) => { const { V, E } = nCube(p.n), xs = V.map((v) => v[0]), ys = V.map((v) => v[1]), mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2, sc = 4 / Math.max(1, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)), cx = (x) => plot.X((x - mx) * sc), cy = (y) => plot.Y((y - my) * sc), out = E.map(([a, b]) => s('line', { x1: cx(V[a][0]), y1: cy(V[a][1]), x2: cx(V[b][0]), y2: cy(V[b][1]), stroke: 'var(--violet)', 'stroke-width': p.n > 5 ? 0.8 : 1.6, opacity: 0.8 })); if (p.n <= 6) V.forEach(([x, y]) => out.push(s('circle', { cx: cx(x), cy: cy(y), r: p.n > 4 ? 2.5 : 4, class: 'fl-coral' }))); return out; },
                readout: (p) => `${p.n}-cube: **${2 ** p.n}** corners · **${p.n * 2 ** (p.n - 1)}** edges${p.n >= 2 ? ` · ${(p.n * (p.n - 1) / 2) * 2 ** (p.n - 2)} square faces` : ''}`,
                goal: (p) => p.n === 5,
                hint: r`Each of the $2^n$ corners has $n$ edges, and each edge has two ends.`,
                solution: { n: 5 },
              },
              explain: r`Each corner has $n$ edges (one per direction) and each edge is shared by 2 corners, so there are $\frac{n \cdot 2^n}{2} = n\,2^{n-1}$ edges. For $n = 5$: $5 \times 16 = 80$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A turning tesseract',
              body: r`Here a tesseract rotates in the plane of its $x$ and $w$ directions, a rotation with no 3D equivalent, and is then drawn in perspective. Corners further along $w$ are drawn smaller (coral) and nearer ones bigger (violet).`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.4, xmax: 2.4, ymin: -2.1, ymax: 2.1, grid: false, axes: false, maxWidth: 380, pad: 6,
                params: { a: { min: 0, max: 90, step: 1, value: 0, label: 'rotation in the x–w plane', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => { const { V, E } = tesseract((p.a * Math.PI) / 180), out = E.map(([a, b]) => s('line', { x1: plot.X(V[a][0]), y1: plot.Y(V[a][1]), x2: plot.X(V[b][0]), y2: plot.Y(V[b][1]), stroke: 'var(--ink-3)', 'stroke-width': 1.8 })); V.forEach(([x, y, w]) => out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 4 + 1.6 * w, class: w > 0 ? 'fl-violet' : 'fl-coral' }))); return out; },
                readout: (p) => (p.a === 0 || p.a === 90 ? 'a cube inside a cube: the inner one is simply further away in the w direction' : 'the inner and outer cubes swap places as the tesseract turns'),
              },
              after: r`At 0° you see the classic picture: a small cube inside a big one, joined corner to corner. As it turns, the inner cube swells and the outer one shrinks until, at 90°, they have swapped. Nothing is actually distorting: the shadow changes because the 4D object turns, just as a rotating cube’s shadow changes shape on a wall.`,
            },
            {
              type: 'mcq',
              title: 'Visitors from 4D',
              prompt: r`In the novel *Flatland* (1884), a sphere passes through a 2D world, and its inhabitants see a dot that grows into a circle, then shrinks and vanishes. What would we see if a 4D hypersphere passed through our 3D space?`,
              choices: [
                { t: 'A point that grows into a sphere, then shrinks and vanishes', ok: true },
                { t: 'A strange shape we could not understand', why: 'Its cross-sections by our space are just ordinary spheres.' },
                { t: 'Nothing at all', why: 'Where it intersects our space, we see that slice: a sphere of changing size.' },
              ],
              explain: r`Each 3D slice of a 4D ball is an ordinary ball, so we would see a sphere appear from a point, grow and shrink. Reasoning by analogy with lower dimensions is the main tool for thinking about higher ones.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Faces of a tesseract',
              prompt: r`A cube has 6 square faces. Dragging a cube into the fourth dimension leaves a starting cube and a final cube, and each of the cube’s 12 edges sweeps out a new square. Count all the **square faces** of a tesseract.`,
              answer: 24,
              wrong: [{ v: 18, why: 'Remember the cube at the start and the copy at the end: both have 6 squares, plus one new square from each of the 12 edges.' }, { v: 12, why: 'The 12 edges each give a new square, but the starting and ending cubes contribute 6 each as well.' }],
              hint: 'Count the squares on the starting cube, on the final cube, and the new squares swept out by each edge.',
              explain: r`6 squares on the starting cube, 6 on the final cube, and 12 new squares swept out by the 12 edges: $6 + 6 + 12 = 24$. The formula $\binom{n}{2}2^{n-2}$ agrees: $6 \times 4 = 24$. (The tesseract also has 8 cubic cells.)`,
            },
          ],
          recap: [
            'An n-cube has 2ⁿ corners and n·2ⁿ⁻¹ edges.',
            'A tesseract has 16 corners, 32 edges, 24 squares and 8 cubes.',
            'We study 4D objects through their shadows and slices, by analogy with lower dimensions.',
          ],
        },
      ],
    },
  ],
};
