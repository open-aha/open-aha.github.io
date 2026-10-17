import { fix } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const D = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const L2 = (P, Q, t) => [lerp(P[0], Q[0], t), lerp(P[1], Q[1], t)];

// ---------- pixels ----------
// DDA: the pixels lit by a line between two pixel centres
function dda(x0, y0, x1, y1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  const out = [];
  for (let i = 0; i <= n; i++) out.push([Math.round(x0 + ((x1 - x0) * i) / (n || 1)), Math.round(y0 + ((y1 - y0) * i) / (n || 1))]);
  return out;
}
// anti-aliased: split each step's ink between the two nearest pixels
function aa(x0, y0, x1, y1) {
  const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  const out = [];
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const u = n ? i / n : 0, x = lerp(x0, x1, u), y = lerp(y0, y1, u);
    if (steep) { const f = x - Math.floor(x); out.push([Math.floor(x), y, 1 - f], [Math.floor(x) + 1, y, f]); }
    else { const f = y - Math.floor(y); out.push([x, Math.floor(y), 1 - f], [x, Math.floor(y) + 1, f]); }
  }
  return out.filter((q) => q[2] > 0.02);
}
const pix = ({ plot, s }, x, y, op = 1, cls = 'fl-ink') => s('rect', { x: plot.X(x - 0.5) + 1, y: plot.Y(y + 0.5) + 1, width: plot.X(1) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(1) - 2, rx: 2, class: cls, opacity: op });

// ---------- colour swatches ----------
const swatch = ({ plot, s }, x, y, w, ht, fill, label) => [
  s('rect', { x: plot.X(x), y: plot.Y(y + ht), width: plot.X(x + w) - plot.X(x), height: plot.Y(y) - plot.Y(y + ht), rx: 12, fill, stroke: 'var(--line-2)', 'stroke-width': 2 }),
  label ? s('text', { x: plot.X(x + w / 2), y: plot.Y(y) + 22, 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(15), text: label }) : null,
];
const rgb = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;

// ---------- Bézier helpers ----------
function bez(P, t) {
  let pts = P;
  while (pts.length > 1) pts = pts.slice(1).map((q, i) => L2(pts[i], q, t));
  return pts[0];
}
const bezPath = (plot, P, n = 80) => 'M' + Array.from({ length: n + 1 }, (_, i) => { const [x, y] = bez(P, i / n); return `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; }).join('L');
const poly = (plot, P) => 'M' + P.map(([x, y]) => `${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('L');
// de Casteljau construction lines for one value of t
function casteljau({ plot, s }, P, t) {
  const els = [];
  const cols = ['muted', 'blue', 'coral'];
  let pts = P, lvl = 0;
  while (pts.length > 1) {
    els.push(s('path', { d: poly(plot, pts), fill: 'none', stroke: `var(--${cols[lvl] === 'muted' ? 'ink-3' : cols[lvl]})`, 'stroke-width': lvl ? 2.2 : 1.6, 'stroke-dasharray': lvl ? null : '6 5' }));
    if (lvl) for (const [x, y] of pts) els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5, class: `fl-${cols[lvl]}` }));
    pts = pts.slice(1).map((q, i) => L2(pts[i], q, t));
    lvl++;
  }
  els.push(s('circle', { cx: plot.X(pts[0][0]), cy: plot.Y(pts[0][1]), r: 8, class: 'fl-violet', stroke: 'var(--card)', 'stroke-width': 3 }));
  return els;
}

// ---------- 2D shapes ----------
const HOUSE = [[-1, -1], [1, -1], [1, 0.6], [0, 1.6], [-1, 0.6]];
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const shapePath = (plot, pts) => poly(plot, [...pts, pts[0]]) + 'Z';
const ORDERS = [
  { name: 'rotate → shift −c → shift +c', f: (q, c, a) => [rot(q, a)[0], rot(q, a)[1]] },
  { name: 'shift −c → rotate → shift +c', f: (q, c, a) => { const m = rot([q[0] - c[0], q[1] - c[1]], a); return [m[0] + c[0], m[1] + c[1]]; } },
  { name: 'shift +c → rotate → shift −c', f: (q, c, a) => { const m = rot([q[0] + c[0], q[1] + c[1]], a); return [m[0] - c[0], m[1] - c[1]]; } },
  { name: 'shift −c → shift +c → rotate', f: (q, c, a) => rot(q, a) },
];

// ---------- 3D cube ----------
const CUBE = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
function project(p, yaw, pitch, dist, f) {
  let [x, y, z] = p;
  [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
  const zz = z + dist;
  return [(f * x) / zz, (f * y) / zz, zz];
}
function cubeDraw({ plot, s }, yaw, pitch, dist, f, scale = 1) {
  const P = CUBE.map((q) => project(q, yaw, pitch, dist, f));
  return EDGES.map(([a, b]) => {
    const near = (P[a][2] + P[b][2]) / 2 < dist;
    return s('line', { x1: plot.X(P[a][0] * scale), y1: plot.Y(P[a][1] * scale), x2: plot.X(P[b][0] * scale), y2: plot.Y(P[b][1] * scale), stroke: near ? 'var(--blue)' : 'var(--ink-3)', 'stroke-width': near ? 3.5 : 2, 'stroke-linecap': 'round' });
  });
}

// ---------- shading ----------
function sphere({ plot, s }, light, { shine = 0, R = 1, n = 30, base = [80, 130, 255] } = {}) {
  const els = [];
  const [lx, ly, lz] = light;
  const cell = (2 * R) / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = -R + (i + 0.5) * cell, y = -R + (j + 0.5) * cell;
    if (x * x + y * y > R * R) continue;
    const z = Math.sqrt(R * R - x * x - y * y);
    const nx = x / R, ny = y / R, nz = z / R;
    const d = nx * lx + ny * ly + nz * lz;
    let b = 0.07 + 0.93 * Math.max(0, d);
    let spec = 0;
    if (shine) { const rz = 2 * d * nz - lz; spec = Math.pow(Math.max(0, rz), shine); }
    const c = base.map((v) => Math.min(255, v * b + 255 * spec));
    els.push(s('rect', { x: plot.X(x - cell / 2), y: plot.Y(y + cell / 2), width: plot.X(cell) - plot.X(0), height: plot.Y(0) - plot.Y(cell), fill: rgb(c), stroke: rgb(c), 'stroke-width': 0.8 }));
  }
  return els;
}
const lightDir = (az, el) => [Math.cos(el * D) * Math.sin(az * D), Math.sin(el * D), Math.cos(el * D) * Math.cos(az * D)];

export default {
  id: 'graphics',
  subject: 'math',
  title: 'The Math of Computer Graphics',
  level: 'Intermediate',
  cover: 'graphics',
  tagline: 'Pixels, colour blending, Bézier curves, transformations, 3D projection and lighting.',
  description: r`Every game, film and font on your screen is built from a little mathematics. Light up pixels to draw lines, blend colours with weighted averages, draw smooth Bézier curves by repeated interpolation, move shapes with matrices, flatten 3D worlds onto a 2D screen by dividing by depth, and shade surfaces with dot products.`,
  prereq: 'Vectors & Matrices',
  chapters: [
    {
      title: 'Pixels and Colour',
      summary: 'Grids of coloured light.',
      lessons: [
        {
          id: 'pixels',
          title: 'Drawing with Pixels',
          summary: 'Lines on a grid',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Which squares to fill?',
              body: r`A screen is a grid of tiny squares, **pixels**, each showing one colour. To draw a line, the computer must decide which pixels to light. A simple method steps along the longer direction one pixel at a time and rounds the other coordinate. Drag the end of the line.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 15.5, ymin: -0.5, ymax: 9.5, grid: false, axes: false, maxWidth: 560,
                params: { bx: { min: 0, max: 15, step: 1, value: 13, slider: false }, by: { min: 0, max: 9, step: 1, value: 6, slider: false } },
                under: (ctx) => {
                  const els = [];
                  for (let x = 0; x <= 15; x++) for (let y = 0; y <= 9; y++) els.push(pix(ctx, x, y, 1, 'fl-surface'));
                  for (const [x, y] of dda(1, 1, ctx.p.bx, ctx.p.by)) els.push(pix(ctx, x, y, 0.85, 'fl-ink'));
                  return els;
                },
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(1), y1: plot.Y(1), x2: plot.X(p.bx), y2: plot.Y(p.by), stroke: 'var(--coral)', 'stroke-width': 2.5 })],
                points: [{ x: () => 1, y: () => 1, color: 'coral', r: 6 }, { x: (p) => p.bx, y: (p) => p.by, drag: { x: 'bx', y: 'by' }, color: 'coral' }],
                readout: (p) => `from (1, 1) to (${p.bx}, ${p.by}): **${dda(1, 1, p.bx, p.by).length}** pixels lit`,
              },
              after: r`The ideal line (coral) is infinitely thin; the pixels can only approximate it. One pixel is lit in each column (or each row, for steep lines), so a line covering $\Delta x$ columns and $\Delta y$ rows lights $\max(|\Delta x|, |\Delta y|) + 1$ pixels. Shallow slopes give long flat runs with sudden steps: the **jaggies**.`,
            },
            {
              type: 'numeric',
              title: 'Counting pixels',
              prompt: r`A line is drawn from pixel $(0, 0)$ to pixel $(12, 5)$ by lighting one pixel per column. How many pixels are lit?`,
              unit: 'pixels',
              answer: 13,
              wrong: [{ v: 12, why: 'Count both ends: columns 0, 1, …, 12.' }, { v: 18, why: 'That would step separately in x and y. One pixel per column is enough here, since the line is shallow.' }, { v: 6, why: 'The line is shallow (longer in x), so step along the columns: there are 13 of them.' }],
              explain: r`The line spans columns $0$ to $12$: 13 columns, one pixel each. A line that's longer in $y$ than $x$ would step along rows instead, otherwise it would have gaps.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Softening the jaggies',
              body: r`**Anti-aliasing** shades pixels partially: a pixel the line passes near gets darker the closer the line comes to its centre. Toggle it on and drag the end again.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 15.5, ymin: -0.5, ymax: 9.5, grid: false, axes: false, maxWidth: 560,
                params: {
                  bx: { min: 0, max: 15, step: 1, value: 14, slider: false }, by: { min: 0, max: 9, step: 1, value: 5, slider: false },
                  on: { min: 0, max: 1, step: 1, value: 1, label: 'anti-aliasing', color: 'violet', format: (v) => (v ? 'on' : 'off') },
                },
                under: (ctx) => {
                  const els = [];
                  for (let x = 0; x <= 15; x++) for (let y = 0; y <= 9; y++) els.push(pix(ctx, x, y, 1, 'fl-surface'));
                  if (ctx.p.on) for (const [x, y, w] of aa(1, 1, ctx.p.bx, ctx.p.by)) els.push(pix(ctx, x, y, 0.9 * w, 'fl-ink'));
                  else for (const [x, y] of dda(1, 1, ctx.p.bx, ctx.p.by)) els.push(pix(ctx, x, y, 0.9, 'fl-ink'));
                  return els;
                },
                points: [{ x: (p) => p.bx, y: (p) => p.by, drag: { x: 'bx', y: 'by' }, color: 'coral' }],
                readout: (p) => (p.on ? 'each step’s ink is shared between the two nearest pixels' : 'each pixel is either fully on or off'),
              },
              after: r`Up close, anti-aliased lines look blurry, but at normal size the eye blends the greys into a smooth edge. Text on your screen is anti-aliased this way. The problem it fixes, **aliasing**, is the same one that makes wagon wheels spin backwards in films: too few samples to capture fine detail.`,
            },
            {
              type: 'numeric',
              title: 'A full-HD screen',
              prompt: r`A "full HD" screen is 1920 pixels wide and 1080 pixels tall. How many pixels is that?`,
              unit: 'pixels',
              answer: 1920 * 1080,
              wrong: [{ v: 3000, why: 'Add for the perimeter, multiply for the grid: every row has 1920 pixels, and there are 1080 rows.' }],
              explain: r`$1920 \times 1080 = 2{,}073{,}600$: about 2 million pixels, each redrawn up to 60 or more times a second.`,
            },
            {
              type: 'mcq',
              title: 'Zooming in',
              prompt: 'You zoom far into a photo and into a letter of text in a document. The photo turns into blocky squares, but the letter stays perfectly sharp. Why?',
              choices: [
                { t: 'The photo is stored as pixels; the letter is stored as curves that are redrawn at the new size', ok: true },
                { t: 'The letter was photographed at a higher resolution', why: 'Fonts aren’t photographs: they’re mathematical outlines, which can be drawn at any size.' },
                { t: 'Text is always drawn in black and white', why: 'Colour has nothing to do with it. It’s about how the shape is stored.' },
              ],
              explain: r`A photo is a **raster** image: a fixed grid of pixels. Zooming just makes each pixel bigger. A font is **vector** graphics: outlines described by equations (Bézier curves, coming up), turned into pixels freshly at whatever size you need.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A 4K frame',
              prompt: r`A 4K frame is $3840 \times 2160$ pixels, with 3 bytes per pixel (one each for red, green and blue). How many megabytes (millions of bytes) does one uncompressed frame take? (1 decimal place.)`,
              unit: 'MB',
              answer: (3840 * 2160 * 3) / 1e6,
              tol: 0.06,
              wrong: [{ v: 8.3, tol: 0.06, why: 'That’s the number of pixels in millions. Each pixel needs 3 bytes.' }],
              explain: r`$3840 \times 2160 = 8{,}294{,}400$ pixels, times 3 bytes $\approx 24.9$ MB. At 60 frames a second that's about 1.5 GB per second, which is why video is always compressed.`,
            },
          ],
          recap: [
            'Screens are grids of pixels; lines become staircases of lit squares.',
            'A line lights max(|Δx|, |Δy|) + 1 pixels; anti-aliasing shades partial pixels.',
            'Raster images are pixel grids; vector graphics are equations redrawn at any size.',
          ],
        },
        {
          id: 'colour',
          title: 'Blending Colours',
          summary: 'Mixing light with weighted averages',
          icon: 'sun',
          steps: [
            {
              type: 'interactive',
              title: 'Match the sky',
              prompt: r`Each pixel mixes red, green and blue light, each from 0 to 255. Mix the **sky blue** on the left: get each slider within one step of the target.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4.4, grid: false, axes: false, height: 220,
                params: {
                  R: { min: 0, max: 255, step: 15, value: 255, label: 'red', color: 'coral' },
                  G: { min: 0, max: 255, step: 15, value: 60, label: 'green', color: 'teal' },
                  B: { min: 0, max: 255, step: 15, value: 60, label: 'blue', color: 'blue' },
                },
                extra: (ctx) => [...swatch(ctx, 0.6, 1, 3.8, 3, rgb([135, 195, 240]), 'target'), ...swatch(ctx, 5.6, 1, 3.8, 3, rgb([ctx.p.R, ctx.p.G, ctx.p.B]), 'yours')],
                readout: (p) => `yours: (${p.R}, ${p.G}, ${p.B})`,
                goal: (p) => Math.abs(p.R - 135) <= 15 && Math.abs(p.G - 195) <= 15 && Math.abs(p.B - 240) <= 15,
                solution: { R: 135, G: 195, B: 240 },
                hint: 'Light blue is mostly blue, a lot of green, and a fair amount of red too (adding all three makes it paler).',
              },
              explain: r`The target is $(135, 195, 240)$. Pale colours have all three channels high: equal amounts of red, green and blue make grey or white, so adding red to a blue **washes it out** towards white. Mixing light is **additive**: more light, brighter colour.`,
            },
            {
              type: 'explain',
              title: 'Blending is averaging',
              body: r`Graphics constantly blends colours: a semi-transparent window over a background, a shadow, the fade between two scenes. The rule is a **weighted average**, applied to each channel separately. A foreground colour $F$ with **opacity** $\alpha$ (alpha, from 0 = invisible to 1 = solid) over a background $B$ gives
$$\text{result} = \alpha F + (1 - \alpha) B$$
At $\alpha = 1$ you see only $F$; at $\alpha = 0$ only $B$; in between, a mix.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Glass over a background',
              body: r`A {coral:coral} square with opacity $\alpha$ sits over a half-white, half-black background. The readout shows the red channel of each overlap.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 240,
                params: { a: { min: 0, max: 1, step: 0.05, value: 0.6, label: '$\\alpha$', color: 'coral', format: (v) => fix(v, 2) } },
                extra: ({ plot, p, s }) => {
                  const F = [255, 107, 74], W = [255, 255, 255], K = [0, 0, 0];
                  const mix = (Bk) => F.map((v, i) => p.a * v + (1 - p.a) * Bk[i]);
                  const R = (x, y, w, ht, fill) => s('rect', { x: plot.X(x), y: plot.Y(y + ht), width: plot.X(x + w) - plot.X(x), height: plot.Y(y) - plot.Y(y + ht), fill });
                  return [R(0.5, 0.4, 4.5, 4.2, rgb(W)), R(5, 0.4, 4.5, 4.2, rgb(K)), R(2.5, 1.2, 2.5, 2.6, rgb(mix(W))), R(5, 1.2, 2.5, 2.6, rgb(mix(K))), s('rect', { x: plot.X(0.5), y: plot.Y(4.6), width: plot.X(9.5) - plot.X(0.5), height: plot.Y(0.4) - plot.Y(4.6), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 2 })];
                },
                readout: (p) => `over white: red = ${fix(p.a * 255 + (1 - p.a) * 255, 0)}, green = ${fix(p.a * 107 + (1 - p.a) * 255, 0)} · over black: red = ${fix(p.a * 255, 0)}, green = ${fix(p.a * 107, 0)}`,
              },
              after: r`Over white, lowering $\alpha$ fades the colour towards white; over black, towards black. Every pixel of every translucent menu, shadow and soft edge on your screen is computed with this one weighted average.`,
            },
            {
              type: 'numeric',
              title: 'Grey from white and black',
              prompt: r`White (255) at 40% opacity ($\alpha = 0.4$) is drawn over black (0). What value does each channel of the result have?`,
              answer: 102,
              wrong: [{ v: 153, why: r`That's 60% of 255. The white contributes $\alpha F = 0.4 \times 255$, and black adds nothing.` }, { v: 0.4, why: 'Scale to the 0–255 range: 0.4 × 255.' }],
              explain: r`$0.4 \times 255 + 0.6 \times 0 = 102$: a dark grey.`,
            },
            {
              type: 'numeric',
              title: 'Colour to grey',
              prompt: r`Converting to black and white weights the channels by how bright they look to our eyes: grey $= 0.2126R + 0.7152G + 0.0722B$. What grey value does **pure blue** $(0, 0, 255)$ become? (Nearest whole number.)`,
              answer: 18,
              tol: 0.6,
              wrong: [{ v: 85, why: r`That's a plain average, $255 \div 3$. The eye is far less sensitive to blue, so blue gets only 7% of the weight.` }, { v: 182, tol: 0.6, why: 'That’s pure green, which looks far brighter.' }],
              explain: r`$0.0722 \times 255 \approx 18$: nearly black! Pure green becomes $0.7152 \times 255 \approx 182$, almost ten times brighter. Our eyes are most sensitive to green light, so a fair grey conversion can't treat the three channels equally.`,
            },
            {
              type: 'mcq',
              title: 'Light versus paint',
              prompt: 'On a screen, what colour do full red and full green light make together, (255, 255, 0)?',
              choices: [
                { t: 'Yellow', ok: true },
                { t: 'Brown', why: 'That’s what red and green **paint** make. Paint absorbs light (subtractive); a screen adds light.' },
                { t: 'White', why: 'White needs blue as well: (255, 255, 255).' },
              ],
              explain: r`Adding red and green light stimulates the eye's red- and green-sensitive cones together, which the brain reads as **yellow**. Paints work the other way: each pigment removes wavelengths, so mixing paints darkens. Screens use red, green and blue; printers use cyan, magenta and yellow.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two layers of glass',
              prompt: r`On a white background (255, 255, 255), you first draw pure blue (0, 0, 255) at $\alpha = 0.5$, then pure red (255, 0, 0) at $\alpha = 0.5$ on top. What is the **red** channel of the final colour? (Nearest whole number.)`,
              answer: 191,
              tol: 0.6,
              wrong: [{ v: 128, tol: 1, why: r`After the blue layer, the red channel is already $0.5 \times 0 + 0.5 \times 255 = 127.5$, not 0. Then blend red over that.` }, { v: 255, why: 'The red layer is only half opaque, so it mixes with what’s below.' }],
              hint: 'Do it in two steps, channel by channel: blue over white, then red over the result.',
              explain: r`Blue over white: red channel $0.5 \times 0 + 0.5 \times 255 = 127.5$. Then red over that: $0.5 \times 255 + 0.5 \times 127.5 = 191.25$. The final colour is about $(191, 64, 128)$, a pinkish purple. Layers are blended one at a time, bottom to top, which is why the drawing order matters.`,
            },
          ],
          recap: [
            'Screens add red, green and blue light, each 0–255.',
            'Blending: α·F + (1 − α)·B, channel by channel.',
            'The eye is most sensitive to green, so grey conversion weights it most.',
          ],
        },
      ],
    },
    {
      title: 'Curves',
      summary: 'Interpolation and Bézier curves.',
      lessons: [
        {
          id: 'lerp',
          title: 'In Between',
          summary: 'Interpolation and easing',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Lerp',
              body: r`Animators draw key frames and let the computer fill in the frames between. The basic tool is **linear interpolation**, nicknamed **lerp**:
$$\text{lerp}(A, B, t) = A + t(B - A) = (1 - t)A + tB$$
At $t = 0$ you're at $A$, at $t = 1$ at $B$, and $t = 0.5$ is halfway. Drag $A$ and $B$, and slide $t$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: 1, axes: false, maxWidth: 520,
                params: {
                  ax: { min: 0, max: 10, step: 1, value: 1, slider: false }, ay: { min: 0, max: 6, step: 1, value: 1, slider: false },
                  bx: { min: 0, max: 10, step: 1, value: 9, slider: false }, by: { min: 0, max: 6, step: 1, value: 5, slider: false },
                  t: { min: 0, max: 1, step: 0.05, value: 0.25, label: '$t$', color: 'violet', format: (v) => fix(v, 2) },
                },
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.ax), y1: plot.Y(p.ay), x2: plot.X(p.bx), y2: plot.Y(p.by), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' })],
                points: [
                  { x: (p) => p.ax, y: (p) => p.ay, drag: { x: 'ax', y: 'ay' }, color: 'blue', label: 'A' },
                  { x: (p) => p.bx, y: (p) => p.by, drag: { x: 'bx', y: 'by' }, color: 'coral', label: 'B' },
                  { x: (p) => lerp(p.ax, p.bx, p.t), y: (p) => lerp(p.ay, p.by, p.t), color: 'violet' },
                ],
                readout: (p) => `lerp(A, B, ${fix(p.t, 2)}) = (${fix(lerp(p.ax, p.bx, p.t), 2)}, ${fix(lerp(p.ay, p.by, p.t), 2)})`,
              },
              after: r`Lerp works on anything you can add and scale: positions, colours (the blending formula is a lerp with $t = \alpha$), sizes, angles, volumes. It's one of the most used formulas in all of computer graphics.`,
            },
            {
              type: 'numeric',
              title: 'A quarter of the way',
              prompt: r`What is $\text{lerp}(10, 50, 0.25)$?`,
              answer: 20,
              wrong: [{ v: 12.5, why: r`That's $0.25 \times 50$. Start at 10 and add a quarter of the gap: $10 + 0.25 \times 40$.` }, { v: 40, why: 'That’s three quarters of the way. t = 0.25 is near the start.' }],
              explain: r`$10 + 0.25 \times (50 - 10) = 10 + 10 = 20$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Easing',
              body: r`Moving at constant speed from one key frame to the next looks robotic: real objects speed up and slow down. Animators use **easing curves**: instead of $t$, feed lerp a reshaped value $e(t)$. Play the animation to compare three dots.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: 0.25, height: 320, axes: { xlabel: 'time', ylabel: 'progress', xticks: 0.25, yticks: 0.25 },
                params: { u: { min: 0, max: 1.6, step: 0.01, value: 0.5, slider: false } },
                animate: { param: 'u', speed: 0.5, max: 1.6, loop: true },
                curves: [{ f: (x) => x, color: 'muted', width: 2.5 }, { f: (x) => x * x, color: 'coral', width: 3 }, { f: (x) => x * x * (3 - 2 * x), color: 'blue', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const u = Math.min(1, p.u);
                  const pts = [[u, 'ink-3', 'fl-muted'], [u * u, 'coral', 'fl-coral'], [u * u * (3 - 2 * u), 'blue', 'fl-blue']];
                  return [s('line', { x1: plot.X(u), x2: plot.X(u), y1: plot.Y(0), y2: plot.Y(1), stroke: 'var(--violet)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }), ...pts.map(([v, , cls]) => s('circle', { cx: plot.X(u), cy: plot.Y(v), r: 7, class: cls, stroke: 'var(--card)', 'stroke-width': 2 }))];
                },
                readout: (p) => { const u = Math.min(1, p.u); return `time ${fix(u, 2)} · linear ${fix(u, 2)} · ease-in ${fix(u * u, 2)} · smoothstep ${fix(u * u * (3 - 2 * u), 2)}`; },
              },
              after: r`{coral:Ease-in} $e(t) = t^2$ starts slowly and ends fast, like something falling. {blue:Smoothstep} $e(t) = 3t^2 - 2t^3$ starts **and** ends gently, with zero slope at both ends, like a car pulling away and parking. That's the default feel of most interface animations.`,
            },
            {
              type: 'numeric',
              title: 'Smoothstep',
              prompt: r`What is smoothstep $3t^2 - 2t^3$ at $t = 0.25$? (Give a decimal.)`,
              answer: 0.15625,
              tol: 0.002,
              wrong: [{ v: 0.25, why: 'That’s linear progress. Smoothstep starts slower.' }, { v: 0.1875, tol: 0.002, why: r`That's only $3t^2$. Subtract $2t^3 = 0.03125$.` }],
              explain: r`$3(0.0625) - 2(0.015625) = 0.1875 - 0.03125 = 0.15625$. At a quarter of the time, the object has made only about 16% of its journey: it's still easing in. By symmetry, at $t = 0.75$ it has made about 84%.`,
            },
            {
              type: 'interactive',
              title: 'Design an ease-in',
              prompt: r`An ease-in curve $e(t) = t^k$ should reach **halfway** ($e = 0.5$) at 80% of the time ($t = 0.8$). Choose $k$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: 0.25, height: 300, axes: { xlabel: 'time', ylabel: 'progress', xticks: 0.25, yticks: 0.25 },
                params: { k: { min: 1, max: 5, step: 0.1, value: 2, label: '$k$', color: 'coral', format: (v) => fix(v, 1) } },
                curves: [{ f: (x, p) => x ** p.k, color: 'coral', width: 3 }],
                points: [{ x: () => 0.8, y: () => 0.5, color: 'green', r: 8 }, { x: () => 0.8, y: (p) => 0.8 ** p.k, color: 'coral' }],
                readout: (p) => `$e(0.8) = 0.8^{${fix(p.k, 1)}} = ${fix(0.8 ** p.k, 3)}$`,
                goal: (p) => Math.abs(0.8 ** p.k - 0.5) < 0.012,
                solution: { k: 3.1 },
                hint: 'Larger k makes the curve sag lower, so it reaches halfway later.',
              },
              explain: r`$0.8^k = 0.5$ gives $k = \frac{\ln 0.5}{\ln 0.8} \approx 3.1$. Higher powers ease in more dramatically. Designers tune these exponents (or Bézier-based easing curves) until a motion "feels right".`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Inverse lerp',
              prompt: r`A health bar runs from 20 (empty) to 60 (full). The current value is 38. What fraction $t$ of the way along is it? (This is the reverse of lerp.)`,
              answer: 0.45,
              tol: 0.002,
              wrong: [{ v: 0.633, tol: 0.003, why: r`That's $38 \div 60$. Measure from the start of the range: $(38 - 20) \div (60 - 20)$.` }, { v: 18, why: 'That’s the distance from the start. Divide by the length of the range, 40.' }],
              explain: r`$t = \dfrac{38 - 20}{60 - 20} = \dfrac{18}{40} = 0.45$. **Inverse lerp** turns any value into a fraction of a range; then a lerp can map that fraction into another range (say, a bar's pixel width). Together they're called **remapping**.`,
            },
          ],
          recap: [
            'lerp(A, B, t) = A + t(B − A): t = 0 at A, t = 1 at B.',
            'Easing reshapes t; smoothstep 3t² − 2t³ starts and ends gently.',
            'Inverse lerp: t = (v − A)/(B − A) finds how far along a value is.',
          ],
        },
        {
          id: 'bezier',
          title: 'Bézier Curves',
          summary: 'Curves from repeated lerps',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Lerp the lerps',
              body: r`Take three points. Lerp along both sides of the corner ({blue:blue dots}), then lerp between those two dots by the same $t$ ({coral:coral line}): the final point (violet) traces a smooth curve as $t$ goes from 0 to 1. Drag the points and slide $t$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 6.5, grid: 1, axes: false, maxWidth: 520,
                params: {
                  x0: { min: 0, max: 10, step: 0.5, value: 1, slider: false }, y0: { min: 0, max: 6.5, step: 0.5, value: 1, slider: false },
                  x1: { min: 0, max: 10, step: 0.5, value: 4, slider: false }, y1: { min: 0, max: 6.5, step: 0.5, value: 6, slider: false },
                  x2: { min: 0, max: 10, step: 0.5, value: 9, slider: false }, y2: { min: 0, max: 6.5, step: 0.5, value: 1.5, slider: false },
                  t: { min: 0, max: 1, step: 0.02, value: 0.4, label: '$t$', color: 'violet', format: (v) => fix(v, 2) },
                },
                extra: (ctx) => {
                  const P = [[ctx.p.x0, ctx.p.y0], [ctx.p.x1, ctx.p.y1], [ctx.p.x2, ctx.p.y2]];
                  return [ctx.s('path', { d: bezPath(ctx.plot, P), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3.5 }), ...casteljau(ctx, P, ctx.p.t)];
                },
                points: [0, 1, 2].map((i) => ({ x: (p) => p['x' + i], y: (p) => p['y' + i], drag: { x: 'x' + i, y: 'y' + i }, color: 'ink', label: `P${i}` })),
                readout: (p) => `$t = ${fix(p.t, 2)}$`,
              },
              after: r`This is a **quadratic Bézier curve**, and building it by repeated lerping is **de Casteljau's algorithm**. Writing the lerps out gives a formula:
$$B(t) = (1 - t)^2 P_0 + 2t(1 - t)P_1 + t^2 P_2$$
The curve starts at $P_0$, ends at $P_2$, and is pulled towards $P_1$ without (usually) touching it.`,
            },
            {
              type: 'numeric',
              title: 'The midpoint',
              prompt: r`A quadratic Bézier curve has $P_0 = (0, 0)$, $P_1 = (2, 4)$, $P_2 = (4, 0)$. What is the $y$-coordinate of $B(0.5)$?`,
              answer: 2,
              wrong: [{ v: 4, why: r`That's $P_1$, the control point. The curve is only pulled towards it: at $t = 0.5$ the weights are $\frac14, \frac12, \frac14$.` }, { v: 1.333, tol: 0.01, why: r`That averages the three points equally. At $t = 0.5$ the middle point gets weight $2 \times 0.5 \times 0.5 = 0.5$.` }],
              explain: r`At $t = 0.5$ the weights are $(0.5)^2 = \frac14$, $2(0.5)(0.5) = \frac12$, $\frac14$. So $y = \frac14(0) + \frac12(4) + \frac14(0) = 2$: exactly halfway up to the control point.`,
            },
            {
              type: 'interactive',
              title: 'Through the target',
              prompt: r`The curve runs from $P_0 = (1, 1)$ to $P_2 = (9, 1)$. Drag the control point $P_1$ so that the curve's midpoint, $B(0.5)$, lands on the green target $(5, 4)$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 8, grid: 1, axes: false, maxWidth: 480,
                params: { x1: { min: 0, max: 10, step: 0.5, value: 3, slider: false }, y1: { min: 0, max: 8, step: 0.5, value: 4, slider: false } },
                extra: (ctx) => {
                  const P = [[1, 1], [ctx.p.x1, ctx.p.y1], [9, 1]];
                  const m = bez(P, 0.5);
                  return [
                    ctx.s('circle', { cx: ctx.plot.X(5), cy: ctx.plot.Y(4), r: 14, class: 'fl-green', opacity: 0.3 }),
                    ctx.s('path', { d: poly(ctx.plot, P), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }),
                    ctx.s('path', { d: bezPath(ctx.plot, P), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3.5 }),
                    ctx.s('circle', { cx: ctx.plot.X(m[0]), cy: ctx.plot.Y(m[1]), r: 7, class: 'fl-violet', stroke: 'var(--card)', 'stroke-width': 2.5 }),
                  ];
                },
                points: [{ x: () => 1, y: () => 1, color: 'ink', r: 6 }, { x: () => 9, y: () => 1, color: 'ink', r: 6 }, { x: (p) => p.x1, y: (p) => p.y1, drag: { x: 'x1', y: 'y1' }, color: 'coral', label: 'P1' }],
                readout: (p) => { const m = bez([[1, 1], [p.x1, p.y1], [9, 1]], 0.5); return `$B(0.5) = (${fix(m[0], 2)}, ${fix(m[1], 2)})$`; },
                goal: (p) => p.x1 === 5 && p.y1 === 7,
                solution: { x1: 5, y1: 7 },
                hint: r`$B(0.5) = \frac{P_0 + 2P_1 + P_2}{4}$. The midpoint moves only half as far as you move $P_1$.`,
              },
              explain: r`$B(0.5) = \frac14 P_0 + \frac12 P_1 + \frac14 P_2$. For $y$: $\frac14 + \frac12 y_1 + \frac14 = 4$ gives $y_1 = 7$; for $x$: $\frac14 + \frac12 x_1 + \frac94 = 5$ gives $x_1 = 5$. To make a curve pass through a point, the control point must overshoot it.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Cubic Bézier curves',
              body: r`With **four** points, lerp three times. This **cubic** Bézier curve can make S-bends. Drag the four points.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 6.5, grid: 1, axes: false, maxWidth: 520,
                params: {
                  x0: { min: 0, max: 10, step: 0.5, value: 1, slider: false }, y0: { min: 0, max: 6.5, step: 0.5, value: 1, slider: false },
                  x1: { min: 0, max: 10, step: 0.5, value: 2, slider: false }, y1: { min: 0, max: 6.5, step: 0.5, value: 6, slider: false },
                  x2: { min: 0, max: 10, step: 0.5, value: 7, slider: false }, y2: { min: 0, max: 6.5, step: 0.5, value: 0.5, slider: false },
                  x3: { min: 0, max: 10, step: 0.5, value: 9, slider: false }, y3: { min: 0, max: 6.5, step: 0.5, value: 5.5, slider: false },
                  t: { min: 0, max: 1, step: 0.02, value: 0.5, label: '$t$', color: 'violet', format: (v) => fix(v, 2) },
                },
                extra: (ctx) => {
                  const P = [0, 1, 2, 3].map((i) => [ctx.p['x' + i], ctx.p['y' + i]]);
                  return [ctx.s('path', { d: bezPath(ctx.plot, P, 120), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3.5 }), ...casteljau(ctx, P, ctx.p.t)];
                },
                points: [0, 1, 2, 3].map((i) => ({ x: (p) => p['x' + i], y: (p) => p['y' + i], drag: { x: 'x' + i, y: 'y' + i }, color: 'ink', label: `P${i}` })),
                readout: (p) => `$t = ${fix(p.t, 2)}$`,
              },
              after: r`$$B(t) = (1 - t)^3 P_0 + 3t(1 - t)^2 P_1 + 3t^2(1 - t) P_2 + t^3 P_3$$
At each end the curve heads straight towards the neighbouring control point, which is how the "pen tool" in drawing apps works: you drag out **handles** that set the direction. Pierre Bézier (at Renault) and Paul de Casteljau (at Citroën) developed these curves around 1960 to design car bodies; today they draw fonts, logos, and SVG icons.`,
            },
            {
              type: 'numeric',
              title: 'Cubic midpoint',
              prompt: r`A cubic Bézier has control points with $y$-coordinates $0, 8, 8, 0$. What is the $y$-coordinate of $B(0.5)$?`,
              answer: 6,
              wrong: [{ v: 8, why: 'The curve doesn’t reach its control points. At t = 0.5 the weights are 1/8, 3/8, 3/8, 1/8.' }, { v: 4, why: r`That averages the four values equally. The middle points get weight $\frac38$ each.` }],
              explain: r`At $t = \frac12$ the weights are $\frac18, \frac38, \frac38, \frac18$. So $y = \frac{0 + 3(8) + 3(8) + 0}{8} = 6$. The curve rises to $\frac34$ of the height of its control handles.`,
            },
            {
              type: 'mcq',
              title: 'Staying inside',
              prompt: r`A Bézier curve's weights, like $(1 - t)^2$, $2t(1 - t)$ and $t^2$, are never negative and always add up to 1. What does that guarantee?`,
              choices: [
                { t: 'The curve never leaves the polygon formed by its control points', ok: true },
                { t: 'The curve passes through every control point', why: 'Only the first and last. The others pull without being reached.' },
                { t: 'The curve is always a parabola', why: 'Only the quadratic case is a parabola; cubic curves can make S-bends.' },
              ],
              explain: r`A mix of points with non-negative weights summing to 1 is a **weighted average**, and it always lies inside the shape spanned by the points (their **convex hull**). Graphics software uses this: if the control polygon is off-screen, so is the curve, without computing a single point of it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How high does it go?',
              prompt: r`A quadratic Bézier has $P_0 = (0, 0)$, $P_1 = (3, 10)$, $P_2 = (6, 0)$. What is the greatest height ($y$) the curve reaches?`,
              answer: 5,
              wrong: [{ v: 10, why: 'That’s the control point, which the curve never reaches.' }, { v: 2.5, why: r`$y(t) = 2t(1 - t) \times 10 = 20t(1 - t)$, which peaks at $t = 0.5$.` }],
              explain: r`$y(t) = 2t(1 - t) \cdot 10 = 20t(1 - t)$, which is largest at $t = \frac12$: $20 \times \frac14 = 5$. A symmetric quadratic Bézier reaches exactly half the control point's height. (It's the same parabola a ball follows, and the control point is where the launch and landing directions meet.)`,
            },
          ],
          recap: [
            'De Casteljau: lerp between control points repeatedly to get a curve point.',
            'Quadratic: (1 − t)²P₀ + 2t(1 − t)P₁ + t²P₂; cubic uses four points.',
            'The curve starts and ends at the end points and stays inside the control polygon.',
          ],
        },
        {
          id: 'splines',
          title: 'Smooth Joins',
          summary: 'Chaining curves into shapes',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Curves in a chain',
              body: r`One Bézier curve can't draw a letter "S" with all its wiggles, or a car's outline. Real shapes chain many curve pieces end to end: a **spline**. Each piece starts where the last one ended.

Joining the ends isn't enough for a good-looking shape. If the two pieces arrive and leave at different angles, the join has a visible **kink**. To be smooth, the curve's direction must be the same on both sides of the join.`,
            },
            {
              type: 'interactive',
              title: 'Smooth the join',
              prompt: r`Two quadratic Bézier pieces meet at the join $J = (5, 3)$. The first arrives from the direction of its control point $(3, 5)$. Drag the second piece's control point $Q$ so there's **no kink** at $J$.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: 1, axes: false, maxWidth: 480,
                params: { qx: { min: 5.5, max: 10, step: 0.5, value: 8, slider: false }, qy: { min: 0, max: 7, step: 0.5, value: 4, slider: false } },
                extra: (ctx) => {
                  const A = [[1, 2], [3, 5], [5, 3]], B = [[5, 3], [ctx.p.qx, ctx.p.qy], [9, 3.5]];
                  return [
                    ctx.s('path', { d: poly(ctx.plot, A), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }),
                    ctx.s('path', { d: poly(ctx.plot, B), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }),
                    ctx.s('path', { d: bezPath(ctx.plot, A), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3.5 }),
                    ctx.s('path', { d: bezPath(ctx.plot, B), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3.5 }),
                  ];
                },
                points: [{ x: () => 3, y: () => 5, color: 'blue', r: 6 }, { x: () => 5, y: () => 3, color: 'ink', r: 7, label: 'J' }, { x: (p) => p.qx, y: (p) => p.qy, drag: { x: 'qx', y: 'qy' }, color: 'coral', label: 'Q' }],
                readout: (p) => { const a1 = Math.atan2(3 - 5, 5 - 3), a2 = Math.atan2(p.qy - 3, p.qx - 5); let k = Math.abs(a2 - a1) / D; if (k > 180) k = 360 - k; return k < 0.5 ? 'No kink: the join is **smooth**.' : `kink at the join: **${fix(k, 0)}°**`; },
                goal: (p) => Math.abs((p.qx - 5) + (p.qy - 3)) < 1e-9,
                solution: { qx: 7, qy: 1 },
                hint: 'The incoming handle points from (3, 5) to J: down and to the right. Q must continue in exactly that direction.',
              },
              explain: r`The incoming direction is $J - (3, 5) = (2, -2)$, so $Q$ must lie on the line continuing through $J$ in that direction: $(6, 2)$, $(7, 1)$ or $(8, 0)$, for example. Smooth joins need the three points (incoming control point, join, outgoing control point) to be **in a straight line**, with the join between them.`,
            },
            {
              type: 'numeric',
              title: 'Mirror the handle',
              prompt: r`Drawing apps often make joins smooth by **mirroring** the handle: the outgoing control point is the reflection of the incoming one through the join, $Q = 2J - P$. With join $J = (4, 2)$ and incoming control point $P = (1, 5)$, what is the $x$-coordinate of $Q$?`,
              answer: 7,
              wrong: [{ v: 3, why: r`$2J - P = (8 - 1, 4 - 5)$. Double the join, then subtract.` }, { v: 2.5, why: 'That’s the midpoint of J and P. Reflect P through J instead.' }],
              explain: r`$Q = 2(4, 2) - (1, 5) = (7, -1)$. $J$ is exactly halfway between $P$ and $Q$. Mirrored handles give equal speeds as well as equal directions on both sides, which matters when a spline is used as an animation path.`,
            },
            {
              type: 'mcq',
              title: 'Same direction, different length',
              prompt: r`At a join, the two handles point in exactly opposite directions, but one is three times as long as the other. How does the curve look?`,
              choices: [
                { t: 'Smooth: no kink, though it bends more sharply on one side', ok: true },
                { t: 'Kinked at the join', why: 'A kink needs the directions to differ. Here they line up exactly.' },
                { t: 'It breaks into two separate curves', why: 'The pieces still share the join point; only the handles differ in length.' },
              ],
              explain: r`Matching directions is enough to avoid a visible corner (designers call this **G1** continuity). Matching lengths as well (**C1** continuity) also matches the speed through the join, which matters for animation paths, so that a moving object doesn't lurch.`,
            },
            {
              type: 'mcq',
              title: 'Letters made of curves',
              prompt: 'Most fonts on your computer store each letter as an outline. What is that outline made of?',
              choices: [
                { t: 'Straight lines and Bézier curve pieces, joined end to end', ok: true },
                { t: 'A small picture of the letter in pixels', why: 'That’s how very old screen fonts worked. Outline fonts are scaled smoothly to any size instead.' },
                { t: 'Arcs of circles', why: 'Circles can’t make the varied curves of letters easily. Bézier pieces can.' },
              ],
              explain: r`TrueType fonts use chains of quadratic Bézier pieces; PostScript and many OpenType fonts use cubics. When you change the font size, the computer scales the control points (just a multiplication) and redraws the curves into pixels, with anti-aliasing, for a crisp result at any size.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Counting points',
              prompt: r`A closed shape is made of 4 cubic Bézier pieces in a loop, each piece ending where the next begins. How many distinct points must be stored? (Each piece has 2 end points and 2 handles, but neighbouring pieces share their end points.)`,
              unit: 'points',
              answer: 12,
              wrong: [{ v: 16, why: 'Neighbouring pieces share an end point, so each shared point is stored once.' }, { v: 8, why: 'Each piece still has its own 2 handles: 4 × 2 = 8 handles, plus the end points.' }],
              explain: r`Each piece has 2 handles of its own ($4 \times 2 = 8$), and there are 4 join points shared around the loop: $8 + 4 = 12$. A whole letter "O" can be stored in about a dozen points, at any size.`,
            },
          ],
          recap: [
            'Shapes are chains of Bézier pieces (splines).',
            'A join is smooth when the handles on both sides are in a straight line through it.',
            'Mirrored handles (Q = 2J − P) match direction and speed.',
          ],
        },
      ],
    },
    {
      title: 'Worlds on Screen',
      summary: 'Moving, projecting and lighting.',
      lessons: [
        {
          id: 'transforms',
          title: 'Moving Shapes',
          summary: 'Rotations, order and pivots',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Every vertex, the same rule',
              body: r`To move a shape, a graphics program applies the same **transformation** to every corner (vertex):
- **Translate** (slide) by $(a, b)$: $(x, y) \to (x + a, y + b)$.
- **Scale** by $k$: $(x, y) \to (kx, ky)$.
- **Rotate** by angle $\theta$ about the origin: $(x, y) \to (x\cos\theta - y\sin\theta,\ x\sin\theta + y\cos\theta)$.

Rotation and scaling are matrix multiplications. Games apply these to millions of vertices every frame, on graphics chips built to do little else.`,
            },
            {
              type: 'interactive',
              title: 'Fit the outline',
              prompt: r`Rotate the house about the origin so that it fits exactly into the dashed outline.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.6, xmax: 2.6, ymin: -2.2, ymax: 2.2, grid: 0.5, axes: false, maxWidth: 440,
                params: { a: { min: 0, max: 345, step: 15, value: 30, label: 'rotation', color: 'violet', format: (v) => `${v}°` } },
                under: ({ plot, s }) => [s('path', { d: shapePath(plot, HOUSE.map((q) => rot(q, 135 * D))), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' })],
                extra: ({ plot, p, s }) => [s('path', { d: shapePath(plot, HOUSE.map((q) => rot(q, p.a * D))), fill: 'var(--blue)', 'fill-opacity': 0.35, stroke: 'var(--blue)', 'stroke-width': 3 }), (() => { const [x, y] = rot([0, 1.6], p.a * D); return s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 6, class: 'fl-coral' }); })()],
                readout: (p) => `rotated by ${p.a}° anticlockwise`,
                goal: (p) => p.a === 135,
                solution: { a: 135 },
                hint: 'Watch the coral dot on the roof: it must end up at the outline’s roof point.',
              },
              explain: r`$135°$ anticlockwise. Under a rotation every point turns by the same angle about the centre, so you can match a single point (the roof tip) and the rest follows.`,
            },
            {
              type: 'numeric',
              title: 'A quarter turn',
              prompt: r`Rotating the point $(3, 1)$ by $90°$ anticlockwise about the origin gives $(x, y)$. What is $x$?`,
              answer: -1,
              wrong: [{ v: 1, why: r`$(x, y) \to (-y, x)$ for a quarter turn anticlockwise: the new $x$ is $-1$.` }, { v: 3, why: r`With $\cos 90° = 0$, $\sin 90° = 1$: $x' = 3 \times 0 - 1 \times 1$.` }],
              explain: r`With $\theta = 90°$: $x' = 3\cos 90° - 1\sin 90° = -1$ and $y' = 3\sin 90° + 1\cos 90° = 3$. A quarter turn sends $(x, y)$ to $(-y, x)$.`,
            },
            {
              type: 'interactive',
              title: 'Spin in place',
              prompt: r`A rotation turns shapes about the **origin**, so a shape away from the origin swings round in a big arc. To spin the house in place about its own centre $c = (3, 2)$, choose the right **sequence** of steps.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 6, ymin: -4, ymax: 5, grid: 1, axes: { xticks: 1, yticks: 1 }, maxWidth: 480,
                params: {
                  k: { min: 0, max: 3, step: 1, value: 0, label: 'sequence', color: 'violet', format: (v) => ORDERS[v].name },
                  a: { min: 0, max: 90, step: 5, value: 90, label: 'angle', color: 'coral', format: (v) => `${v}°` },
                },
                under: ({ plot, s }) => [s('path', { d: shapePath(plot, HOUSE.map(([x, y]) => [x + 3, y + 2])), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' })],
                extra: ({ plot, p, s }) => [
                  s('path', { d: shapePath(plot, HOUSE.map(([x, y]) => ORDERS[p.k].f([x + 3, y + 2], [3, 2], p.a * D))), fill: 'var(--blue)', 'fill-opacity': 0.35, stroke: 'var(--blue)', 'stroke-width': 3 }),
                  s('circle', { cx: plot.X(3), cy: plot.Y(2), r: 5, class: 'fl-coral' }),
                ],
                readout: (p) => { const c = ORDERS[p.k].f([3, 2], [3, 2], p.a * D); return `the centre (3, 2) ends up at (${fix(c[0], 2)}, ${fix(c[1], 2)})`; },
                goal: (p) => p.k === 1,
                solution: { k: 1 },
                hint: 'Before rotating, the pivot must sit at the origin; afterwards, put it back.',
              },
              explain: r`Move the shape so its centre sits at the origin (subtract $c$), rotate, then move it back (add $c$). The centre stays put and the house spins in place. This **translate, rotate, translate back** sandwich is how every rotation about a pivot is done: hinges, wheels, a character's elbow.`,
            },
            {
              type: 'mcq',
              title: 'Order matters',
              prompt: r`Start with a point at $(1, 0)$. Path A: scale by 2, then move right by 1. Path B: move right by 1, then scale by 2. Where do they end?`,
              choices: [
                { t: 'A at (3, 0), B at (4, 0)', ok: true },
                { t: 'Both at (3, 0)', why: 'In path B the move happens first, so the scaling doubles the move too.' },
                { t: 'A at (4, 0), B at (3, 0)', why: 'Path A scales first: (1, 0) → (2, 0), then moves to (3, 0).' },
              ],
              explain: r`A: $(1, 0) \to (2, 0) \to (3, 0)$. B: $(1, 0) \to (2, 0) \to (4, 0)$. Transformations generally don't **commute**: doing them in a different order gives a different result. In code, getting the order of matrix multiplications wrong is a classic bug that sends objects flying off screen.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Spinning sprite',
              prompt: r`A game rotates a sprite by $5°$ every frame, at 60 frames per second. How many seconds does one full turn take?`,
              unit: 's',
              answer: 1.2,
              wrong: [{ v: 72, why: 'That’s the number of frames for a full turn. Convert frames to seconds at 60 per second.' }, { v: 6, why: r`In one second the sprite turns $60 \times 5 = 300°$, a bit less than a full turn.` }],
              explain: r`A full turn takes $360 \div 5 = 72$ frames, which at 60 frames per second is $72 \div 60 = 1.2$ s. Games usually scale motion by the time since the last frame instead, so that the speed doesn't change when the frame rate drops.`,
            },
          ],
          recap: [
            'Transformations apply one rule to every vertex: translate, scale, rotate.',
            'To rotate about a pivot c: move by −c, rotate, move by +c.',
            'Order matters: transformations don’t usually commute.',
          ],
        },
        {
          id: 'projection',
          title: 'From 3D to 2D',
          summary: 'Divide by depth',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Divide by distance',
              body: r`A 3D scene is drawn on a flat screen the way a pinhole camera works: a point at position $(x, y, z)$, with $z$ its distance in front of the camera, lands on the screen at
$$x' = \frac{f\,x}{z}, \qquad y' = \frac{f\,y}{z}$$
where $f$ is the **focal length** (how far the screen sits from the eye). Dividing by $z$ is the whole secret of perspective: things twice as far away look half as big.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A wireframe cube',
              body: r`A cube of side 2, seen from a distance. Turn it and change the camera. The near edges are drawn in {blue:blue}.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 440, clipExtra: true,
                params: {
                  yaw: { min: 0, max: 90, step: 5, value: 30, label: 'turn', color: 'violet', format: (v) => `${v}°` },
                  d: { min: 2.5, max: 12, step: 0.5, value: 4, label: 'distance', color: 'blue', format: (v) => fix(v, 1) },
                  f: { min: 0.5, max: 4, step: 0.25, value: 2, label: 'focal length', color: 'coral', format: (v) => fix(v, 2) },
                },
                extra: (ctx) => cubeDraw(ctx, ctx.p.yaw * D, 20 * D, ctx.p.d, ctx.p.f, 1.6),
                readout: (p) => `centre at depth ${fix(p.d, 1)}: a face 1 unit nearer looks **${fix((p.d + 1) / (p.d - 1), 2)}×** the size of a face 1 unit farther`,
              },
              after: r`Up close, the back face is much smaller than the front (strong perspective). Move the camera far away and zoom in (raise $f$) to keep the cube the same size on screen: the faces become nearly equal and the drawing looks flat. Changing $f$ alone only zooms; it never changes the perspective, which depends only on the distance.`,
            },
            {
              type: 'numeric',
              title: 'Farther and smaller',
              prompt: r`A tree 20 m from the camera appears 3 cm tall on screen. How tall does the same tree appear 60 m away?`,
              unit: 'cm',
              answer: 1,
              wrong: [{ v: 9, why: 'Farther objects look smaller: the size is divided by the distance.' }, { v: 0.333, tol: 0.01, why: 'Three times the distance means a third of the size: 3 cm ÷ 3.' }],
              explain: r`Screen size is proportional to $\frac{1}{z}$. Three times the distance gives a third of the size: 1 cm.`,
            },
            {
              type: 'interactive',
              title: 'Flatten the perspective',
              prompt: r`For the cube of side 2, the back face looks $\frac{d + 1}{d - 1}$ times smaller than the front, where $d$ is the distance to its centre. Move the camera back until the back face is only about **10%** smaller (a ratio of 1.10).`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 440, clipExtra: true,
                params: { d: { min: 3, max: 30, step: 1, value: 5, label: 'distance $d$', color: 'blue' } },
                extra: (ctx) => cubeDraw(ctx, 30 * D, 20 * D, ctx.p.d, ctx.p.d * 0.7, 1),
                readout: (p) => `back / front size ratio: **${fix((p.d + 1) / (p.d - 1), 3)}** (the camera zooms to keep the cube the same size)`,
                goal: (p) => Math.abs((p.d + 1) / (p.d - 1) - 1.1) < 0.006,
                solution: { d: 21 },
                hint: r`Solve $\frac{d + 1}{d - 1} = 1.1$.`,
              },
              explain: r`$\frac{d + 1}{d - 1} = 1.1$ gives $d + 1 = 1.1d - 1.1$, so $d = 21$. The farther the camera, the flatter the look, which is why long telephoto shots make distant objects seem stacked together, and why some games use a camera far away with a narrow view.`,
            },
            {
              type: 'numeric',
              title: 'Field of view',
              prompt: r`The screen spans from $x' = -1$ to $x' = 1$. What focal length $f$ gives a horizontal field of view of $60°$ (so the edges of the screen are $30°$ either side of straight ahead)? (2 decimal places.)`,
              answer: 1 / Math.tan(30 * D),
              tol: 0.01,
              wrong: [{ v: 0.577, tol: 0.01, why: r`That's $\tan 30°$. The edge of the screen is at $x' = 1 = f\tan 30°$, so $f = \frac{1}{\tan 30°}$.` }, { v: 1, why: r`$f = 1$ gives a $90°$ field of view ($\tan 45° = 1$).` }],
              explain: r`A ray at $30°$ to the side has $\frac{x}{z} = \tan 30°$, so it lands at $x' = f\tan 30°$. Setting that to 1: $f = \frac{1}{\tan 30°} = \sqrt3 \approx 1.73$. A longer focal length means a narrower field of view: zooming in.`,
            },
            {
              type: 'mcq',
              title: 'Who’s in front?',
              prompt: 'Two objects overlap on screen. How does the renderer decide which one to show at each pixel?',
              choices: [
                { t: 'It keeps, for every pixel, the depth z of the nearest surface drawn so far, and only draws a new surface there if it’s nearer', ok: true },
                { t: 'It always draws the bigger object on top', why: 'A big object far away can be behind a small one up close. Depth decides, not size.' },
                { t: 'It draws objects in the order they were created', why: 'Then which object hides which would depend on the order of the program, not on where things are.' },
              ],
              explain: r`This is the **z-buffer** (depth buffer): an extra number per pixel storing the depth of what's currently there. A new surface is drawn at that pixel only if its $z$ is smaller. Every 3D game uses it, at the cost of one more number per pixel. The older **painter's algorithm** sorts objects and draws far to near, like a painter, but fails when objects overlap in a cycle.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Rails to the horizon',
              prompt: r`A rail runs straight ahead, along points $(2, -1, z)$ for ever larger $z$. Where does it head on the screen as $z \to \infty$?`,
              choices: [
                { t: r`Towards the screen centre $(0, 0)$`, ok: true },
                { t: r`Towards the point $(2, -1)$`, why: r`That's where it would be at $z = f$. As $z$ grows, $\frac{2f}{z}$ and $\frac{-f}{z}$ shrink.` },
                { t: 'Off the edge of the screen', why: 'Dividing by an ever larger z pulls the point inwards, not outwards.' },
              ],
              explain: r`$x' = \frac{2f}{z} \to 0$ and $y' = \frac{-f}{z} \to 0$. Every line parallel to the viewing direction heads to the same **vanishing point** at the centre, which is why both rails, and the edges of a corridor, seem to meet there. (The Perspective & Projective Geometry course explores vanishing points further.)`,
            },
          ],
          recap: [
            'Perspective: x′ = fx/z, y′ = fy/z: divide by depth.',
            'Distance sets the strength of perspective; focal length only zooms.',
            'A z-buffer stores each pixel’s nearest depth to decide what’s in front.',
          ],
        },
        {
          id: 'shading',
          title: 'Light and Shade',
          summary: 'Lighting with dot products',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'The cosine law',
              body: r`Why is the side of a ball facing the sun bright, and the edge dim? A beam of light hitting a surface at a slant is spread over a larger area, so each bit of surface gets less. **Lambert's cosine law**: the brightness of a matte surface is proportional to
$$\cos\theta = \mathbf n \cdot \mathbf l$$
where $\mathbf n$ is the surface's **normal** (a unit vector pointing straight out of it), $\mathbf l$ points towards the light, and $\theta$ is the angle between them. Faces turned away from the light ($\mathbf n \cdot \mathbf l < 0$) get no light: the brightness is $\max(0, \mathbf n \cdot \mathbf l)$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Lighting a sphere',
              body: r`Each little patch of this sphere is shaded by $\max(0, \mathbf n \cdot \mathbf l)$, plus a little ambient light so the dark side isn't pure black. Move the light around.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 360,
                params: {
                  az: { min: -150, max: 150, step: 10, value: -40, label: 'light from the side', color: 'amber', format: (v) => `${v}°` },
                  el: { min: -60, max: 80, step: 10, value: 30, label: 'light height', color: 'coral', format: (v) => `${v}°` },
                },
                under: (ctx) => sphere(ctx, lightDir(ctx.p.az, ctx.p.el)),
                readout: (p) => { const l = lightDir(p.az, p.el); return `brightness of the patch facing you ($\\mathbf n = (0, 0, 1)$): **${fix(Math.max(0, l[2]) * 100, 0)}%**`; },
              },
              after: r`The brightest patch is where the surface faces the light head-on; brightness falls off towards the **terminator** line, beyond which the sphere is in shadow. Swing the light behind the sphere (more than $90°$ to the side) and the side facing you goes dark: that's the crescent of the Moon.`,
            },
            {
              type: 'numeric',
              title: 'A dot product',
              prompt: r`A floor has normal $\mathbf n = (0, 1, 0)$. Light comes from direction $\mathbf l = (0.6, 0.8, 0)$. What fraction of full brightness does the floor get?`,
              answer: 0.8,
              wrong: [{ v: 0.6, why: r`$\mathbf n \cdot \mathbf l = 0 \times 0.6 + 1 \times 0.8 + 0 \times 0 = 0.8$.` }, { v: 1.4, why: 'Multiply matching components and add: only the y-components are both non-zero.' }],
              explain: r`$\mathbf n \cdot \mathbf l = 0(0.6) + 1(0.8) + 0(0) = 0.8$. The light arrives about $37°$ from straight down, so the floor gets 80% of what it would from a light directly overhead.`,
            },
            {
              type: 'interactive',
              title: 'Half brightness',
              prompt: r`Tilt the light so that the flat panel receives exactly **half** the brightness it gets from a light shining straight at it.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -0.6, ymax: 3.4, grid: false, axes: false, maxWidth: 440,
                params: { th: { min: 0, max: 85, step: 5, value: 20, label: 'angle of light', color: 'amber', format: (v) => `${v}°` } },
                extra: ({ plot, p, s, arrow }) => {
                  const els = [];
                  const v = Math.max(0, Math.cos(p.th * D));
                  els.push(s('rect', { x: plot.X(-2.2), y: plot.Y(0.2), width: plot.X(2.2) - plot.X(-2.2), height: plot.Y(0) - plot.Y(0.2), fill: rgb([90 * v + 20, 140 * v + 25, 255 * v + 30]), stroke: 'var(--ink)', 'stroke-width': 2 }));
                  for (const off of [-1.4, -0.4, 0.6, 1.6]) {
                    const tx = off, ty = 0.2, sx = tx + 2.8 * Math.sin(p.th * D), sy = ty + 2.8 * Math.cos(p.th * D);
                    els.push(arrow(plot.X(sx), plot.Y(sy), plot.X(tx), plot.Y(ty) - 4, { color: 'var(--amber)', width: 3, head: 10 }));
                  }
                  els.push(s('line', { x1: plot.X(0), y1: plot.Y(0.2), x2: plot.X(0), y2: plot.Y(1.6), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
                  return els;
                },
                readout: (p) => `$\\cos ${p.th}° = ${fix(Math.cos(p.th * D), 3)}$ of full brightness`,
                goal: (p) => p.th === 60,
                solution: { th: 60 },
                hint: r`You need $\cos\theta = 0.5$.`,
              },
              explain: r`$\cos 60° = 0.5$. The same beam, tilted $60°$, is spread over twice the area of panel. It's also why winter sunshine (low in the sky) heats the ground less, and why solar panels are tilted to face the sun.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Shiny highlights',
              body: r`Shiny surfaces also show a bright **highlight** where light reflects straight into your eye. A popular model (Phong's) adds $(\mathbf r \cdot \mathbf v)^s$, where $\mathbf r$ is the mirror reflection of the light direction, $\mathbf v$ points to the viewer, and the **shininess** $s$ sets how tight the highlight is.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 360,
                params: {
                  sh: { min: 2, max: 120, step: 2, value: 30, label: 'shininess $s$', color: 'violet' },
                  az: { min: -80, max: 80, step: 10, value: -30, label: 'light from the side', color: 'amber', format: (v) => `${v}°` },
                },
                under: (ctx) => sphere(ctx, lightDir(ctx.p.az, 30), { shine: ctx.p.sh, base: [220, 70, 60] }),
                readout: (p) => `shininess ${p.sh}: ${p.sh < 10 ? 'a broad, dull sheen' : p.sh < 60 ? 'a soft highlight' : 'a tight, glossy highlight'}`,
              },
              after: r`Low shininess spreads the highlight out (plastic, satin); high shininess concentrates it into a small spot (polished metal, wet skin). This model is a cheap approximation, but it was the standard way to shade 3D graphics for decades.`,
            },
            {
              type: 'numeric',
              title: 'The reflected ray',
              prompt: r`A mirror reflection of a light direction $\mathbf l$ about a normal $\mathbf n$ is $\mathbf r = 2(\mathbf n \cdot \mathbf l)\mathbf n - \mathbf l$. In 2D, with $\mathbf n = (0, 1)$ and $\mathbf l = (0.6, 0.8)$, what is the $x$-component of $\mathbf r$?`,
              answer: -0.6,
              wrong: [{ v: 0.6, why: r`$\mathbf r = 2(0.8)(0, 1) - (0.6, 0.8) = (0 - 0.6, 1.6 - 0.8)$: the $x$-part flips sign.` }, { v: 0.8, why: 'That’s the y-component of r.' }],
              explain: r`$\mathbf n \cdot \mathbf l = 0.8$, so $\mathbf r = (0, 1.6) - (0.6, 0.8) = (-0.6, 0.8)$. The part of $\mathbf l$ along the normal stays, and the part along the surface flips: the angle of incidence equals the angle of reflection.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Just off the highlight',
              prompt: r`With shininess $s = 50$, how bright is the highlight when the viewer is $10°$ away from the exact reflection direction, as a fraction of its peak? That's $(\cos 10°)^{50}$. (2 decimal places.)`,
              answer: Math.cos(10 * D) ** 50,
              tol: 0.006,
              wrong: [{ v: Math.cos(10 * D), tol: 0.006, why: 'Raise it to the power of the shininess: 50.' }, { v: 0.98, tol: 0.006, why: r`$\cos 10° \approx 0.985$, but the highlight term is that to the 50th power.` }],
              explain: r`$\cos 10° \approx 0.985$, and $0.985^{50} \approx 0.47$: just $10°$ off, the highlight has fallen to about half. With $s = 500$ it would be almost nothing ($\approx 0.0005$): high shininess makes a tiny, sharp highlight because a power amplifies small differences.`,
            },
          ],
          recap: [
            'Lambert: matte brightness = max(0, n · l) = cos of the angle to the light.',
            'Phong highlights: (r · v)^s, where r = 2(n · l)n − l.',
            'Higher shininess s gives smaller, sharper highlights.',
          ],
        },
      ],
    },
  ],
};
