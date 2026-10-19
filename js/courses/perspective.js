import { fix } from '../lib/svg.js';

const r = String.raw;
const D = Math.PI / 180;
const HZ = 30; // horizon height in the road picture
const halfW = (u) => 12 * (1 - u / HZ);
const cross = (a, b, c, d) => ((c - a) * (d - b)) / ((c - b) * (d - a));

export default {
  id: 'perspective',
  subject: 'math',
  title: 'Perspective & Projective Geometry',
  level: 'Intermediate',
  cover: 'perspective',
  tagline: 'How artists draw depth, why parallel rails meet, and the number that survives every projection.',
  description: r`Renaissance painters discovered how to draw a convincing 3D world on a flat canvas. Their rules grew into projective geometry, where parallel lines meet at infinity. Learn how a pinhole projects the world, why vanishing points work, the cross-ratio that no projection can change, and the surprising unity of circles, ellipses, parabolas and hyperbolas.`,
  prereq: 'Geometry: Visual Proofs',
  chapters: [
    {
      title: 'Drawing Depth',
      summary: 'Projection and vanishing points.',
      lessons: [
        {
          id: 'pinhole',
          title: 'The Pinhole Picture',
          summary: 'Size shrinks with distance',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Rays through a point',
              body: r`A camera, an eye or a painter's view all work like a **pinhole**: every point of the scene sends a straight ray through a single point onto a flat picture. By similar triangles, an object of height $h$ at distance $d$ appears with height
$$h' = \frac{f\, h}{d}$$
where $f$ is the distance from the pinhole to the picture. Twice as far away means half as tall in the picture.

Around 1415, Filippo Brunelleschi demonstrated this with a painted panel of the Florence Baptistery, viewed through a hole in the panel. Leon Battista Alberti wrote down the rules in 1435.`,
            },
            {
              type: 'numeric',
              title: 'Lamp posts',
              prompt: r`Identical lamp posts stand along a straight road. In a photo, a post 10 m from the camera appears 6 cm tall. How tall does a post 40 m away appear?`,
              unit: 'cm',
              answer: 1.5,
              tol: 0.01,
              wrong: [{ v: 24, why: 'Farther objects look smaller, not bigger.' }, { v: 4.5, tol: 0.01, why: 'Size isn’t reduced by a fixed amount; it’s divided by the distance ratio: 40 ÷ 10 = 4.' }],
              explain: r`Four times as far, so a quarter of the height: $6 / 4 = 1.5$ cm. Equal steps in distance produce shrinking steps in the picture, which is why receding objects bunch up towards the horizon.`,
            },
            {
              type: 'interactive',
              title: 'Frame the shot',
              prompt: r`A pinhole camera's screen is 5 cm behind the hole. A 1.8 m tall person stands in front. Move them until their image is exactly **1.5 cm** tall.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 12, ymin: -1.4, ymax: 2.2, grid: false, axes: false, height: 240,
                params: { d: { min: 2, max: 12, step: 0.5, value: 9, label: 'distance from hole', color: 'blue', format: (v) => `${fix(v, 1)} m` } },
                extra: ({ plot, p, s }) => {
                  const scr = -0.8, img = (0.05 * 1.8) / p.d; // metres
                  const k = 20; // magnify the image for display
                  return [
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.2), y2: plot.Y(-0.05), stroke: 'var(--ink)', 'stroke-width': 4 }),
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(0.05), y2: plot.Y(2), stroke: 'var(--ink)', 'stroke-width': 4 }),
                    s('line', { x1: plot.X(scr), x2: plot.X(scr), y1: plot.Y(-1.2), y2: plot.Y(1.2), stroke: 'var(--ink-3)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(p.d), x2: plot.X(p.d), y1: plot.Y(0), y2: plot.Y(1.8), stroke: 'var(--blue)', 'stroke-width': 6, 'stroke-linecap': 'round' }),
                    s('circle', { cx: plot.X(p.d), cy: plot.Y(1.95), r: 7, class: 'fl-blue' }),
                    s('line', { x1: plot.X(p.d), y1: plot.Y(1.8), x2: plot.X(scr), y2: plot.Y(-img * k), stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                    s('line', { x1: plot.X(p.d), y1: plot.Y(0), x2: plot.X(scr), y2: plot.Y(0), stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                    s('line', { x1: plot.X(scr), x2: plot.X(scr), y1: plot.Y(0), y2: plot.Y(-img * k), stroke: 'var(--coral)', 'stroke-width': 6 }),
                  ];
                },
                readout: (p) => r`image height $= \dfrac{5\text{ cm} \times 1.8\text{ m}}{${fix(p.d, 1)}\text{ m}} = ${((5 * 1.8) / p.d).toFixed(2)}$ cm (upside down)`,
                goal: (p) => p.d === 6,
                hint: r`$h' = \frac{f h}{d}$: solve $1.5 = \frac{5 \times 1.8}{d}$.`,
                solution: { d: 6 },
              },
              explain: r`$d = \frac{5 \times 1.8}{1.5} = 6$ m. The rays cross at the hole, so the image is upside down: that's why the eye's lens projects an inverted image onto the retina, which the brain flips back. (The image in the drawing is magnified for visibility.)`,
            },
            {
              type: 'numeric',
              title: 'Photographing the Moon',
              prompt: r`The Moon is 3,474 km across and 384,400 km away. A camera lens with focal length $f = 50$ mm acts like a pinhole 50 mm from the sensor. How big is the Moon's image on the sensor, in mm? (2 decimal places.)`,
              unit: 'mm',
              answer: (50 * 3474) / 384400,
              tol: 0.01,
              wrong: [{ v: 384400 / 3474 / 50, tol: 0.05, why: r`Use $h' = \frac{f h}{d}$: multiply by $f$ and the Moon's size, divide by its distance.` }],
              explain: r`$\frac{50 \times 3474}{384{,}400} \approx 0.45$ mm, a tiny dot on a 36 mm sensor. That's why Moon photos need long telephoto lenses: at $f = 500$ mm the image is 4.5 mm across.`,
            },
            {
              type: 'numeric',
              title: 'Image size',
              prompt: r`A pinhole camera is 10 cm deep. How tall is the image of a 2 m tall person standing 20 m away, in centimetres?`,
              unit: 'cm',
              answer: 1,
              tol: 0.01,
              explain: r`Similar triangles: image $= 2 \times \frac{0.1}{20} = 0.01$ m $= 1$ cm (upside down). The image shrinks in proportion to distance.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Telephoto compression',
              prompt: r`Photos taken with a long telephoto lens from far away make a row of buildings look squashed together, as if the distant ones were barely farther than the near ones. Why?`,
              choices: [
                { t: 'From far away, the buildings’ distances differ by a smaller ratio, so their image sizes differ less', ok: true },
                { t: 'The lens bends the light from distant objects more', why: 'A telephoto lens just magnifies everything equally. The effect comes from where you stand.' },
                { t: 'Air haze makes things look closer', why: 'Haze affects contrast, not the relative sizes of objects.' },
              ],
              explain: r`Image size goes like $\frac{1}{d}$. Two buildings at 10 m and 20 m differ in apparent size by a factor of 2, but at 500 m and 510 m by only 2%. The telephoto lens magnifies the distant view, so they fill the frame at almost equal size. Perspective depends only on the camera's position; the lens just crops it.`,
            },
            { /*anim:perspective*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The dolly zoom',
              body: r`Film-makers exploit this. In a **dolly zoom** (first used in Hitchcock's *Vertigo*, 1958), the camera backs away from the actor while zooming in, so the actor stays exactly the same size. Watch what happens to the trees behind. Below the picture is the view from above.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 10, grid: false, axes: false, height: 420, clipExtra: true,
                animate: { param: 't', speed: 0.45, max: 2 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const d = 2 + 13 * (1 - Math.cos(p.t)) / 2, K = 1.1, f = K * d; // focal length grows with distance: the actor's image stays fixed
                  const els = [];
                  // the photo frame (top part)
                  const fx0 = plot.X(0.6), fx1 = plot.X(9.4), fy0 = plot.Y(9.8), fy1 = plot.Y(3.6), cx = (fx0 + fx1) / 2, hor = fy1 - 40;
                  els.push(s('rect', { x: fx0, y: fy0, width: fx1 - fx0, height: fy1 - fy0, rx: 8, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  const scale = 52; // pixels per unit of image size
                  // everything in the picture is clipped to the frame
                  const pic = s('g', { 'clip-path': 'url(#dolly-frame)' });
                  els.push(s('clipPath', { id: 'dolly-frame' }, s('rect', { x: fx0, y: fy0, width: fx1 - fx0, height: fy1 - fy0, rx: 8 })), pic);
                  // trees: a row 12 m behind the actor, spaced 3 m apart sideways
                  for (let X = -15; X <= 15; X += 3) {
                    const D = d + 12, hx = cx + (scale * f * X) / D, hh = (scale * f * 4) / D, hw = (scale * f * 1.2) / D;
                    pic.append(s('path', { d: `M${hx} ${hor - hh}L${hx + hw} ${hor - hh * 0.25}L${hx - hw} ${hor - hh * 0.25}Z`, class: 'fl-teal', opacity: 0.8 }));
                    pic.append(s('rect', { x: hx - hw * 0.12, y: hor - hh * 0.25, width: hw * 0.24, height: hh * 0.25, class: 'fl-muted' }));
                  }
                  // the actor: 1.8 m tall, d metres away, always the same size in the picture
                  const ah = (scale * f * 1.8) / d;
                  pic.append(s('rect', { x: cx - ah * 0.14, y: hor + 25 - ah * 0.8, width: ah * 0.28, height: ah * 0.62, rx: 6, class: 'fl-coral' }));
                  pic.append(s('circle', { cx, cy: hor + 25 - ah * 0.87, r: ah * 0.1, class: 'fl-coral' }));
                  // top view strip: camera, actor, trees and the field of view
                  const ty = plot.Y(1.6), mx = (m) => plot.X(0.6) + (m / 30) * (plot.X(9.4) - plot.X(0.6));
                  const half = Math.atan((fx1 - fx0) / 2 / (scale * f));
                  els.push(s('line', { x1: mx(0), x2: mx(30), y1: ty, y2: ty, stroke: 'var(--line-2)', 'stroke-width': 1 }));
                  const camX = 17 - d;
                  // sideways distances are squeezed to fit the strip
                  const lat = (0.3 * (plot.X(9.4) - plot.X(0.6))) / 30, sp = Math.tan(half) * (30 - camX) * lat;
                  els.push(s('path', { d: `M${mx(camX)} ${ty}L${mx(30)} ${ty - sp}L${mx(30)} ${ty + sp}Z`, class: 'fl-amber', opacity: 0.22 }));
                  els.push(s('circle', { cx: mx(17), cy: ty, r: 6, class: 'fl-coral' }));
                  for (let X = -15; X <= 15; X += 3) els.push(s('circle', { cx: mx(29), cy: ty + X * lat, r: 4, class: 'fl-teal' }));
                  els.push(s('rect', { x: mx(camX) - 9, y: ty - 6, width: 12, height: 12, rx: 2, class: 'fl-ink' }));
                  els.push(s('text', { x: mx(camX), y: ty + 30, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px));fill:var(--ink-3)', text: 'camera' }));
                  return els;
                },
                readout: (p) => { const d = 2 + 13 * (1 - Math.cos(p.t)) / 2; return `camera ${fix(d, 1)} m from the actor · lens ${fix(18 * d, 0)} mm · trees look ${fix(((d / (d + 12)) * 4) / 1.8, 2)}× the actor’s height`; },
              },
              after: r`The actor's image size is $f \times \frac{1.8}{d}$, so making the focal length $f$ grow in step with the distance $d$ keeps it fixed. But the trees are $d + 12$ metres away, and their size $f \times \frac{4}{d + 12}$ is **not** fixed: from close up with a wide lens they look small and far behind; from far away with a telephoto lens they loom right behind the actor. The lens only crops and magnifies; the perspective comes from where the camera stands.`,
            },
          ],
          recap: [
            'Perspective projection sends every point through a single centre onto a flat picture.',
            r`Apparent size $h' = fh/d$: inversely proportional to distance.`,
            'Brunelleschi and Alberti worked out the rules in early 15th-century Florence.',
          ],
        },
        {
          id: 'vanishing',
          title: 'Vanishing Points',
          summary: 'Where parallel lines meet',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Rails that meet',
              body: r`Stand between railway tracks. The rails are parallel, but in your view they converge to a single point on the horizon: a **vanishing point**. Every family of parallel lines in the scene has its own vanishing point in the picture, and horizontal lines all vanish on the **horizon**, at your eye level.`,
              widget: {
                kind: 'figure', w: 600, h: 300, maxWidth: 560, label: 'Two-point perspective drawing of a box',
                draw: ({ s }) => {
                  const VL = [40, 110], VR = [560, 110];
                  const top = [300, 70], bot = [300, 230];
                  const along = (P, V, t) => [P[0] + t * (V[0] - P[0]), P[1] + t * (V[1] - P[1])];
                  const tl = along(top, VL, 0.35), bl = along(bot, VL, 0.35), tr = along(top, VR, 0.3), br = along(bot, VR, 0.3);
                  const L = (a, b, attrs) => s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], ...attrs });
                  const guide = { stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 6' };
                  return [
                    L([0, 110], [600, 110], { stroke: 'var(--teal)', 'stroke-width': 2 }),
                    s('text', { x: 590, y: 100, class: 'tick', 'text-anchor': 'end', text: 'horizon (eye level)' }),
                    L(top, VL, guide), L(bot, VL, guide), L(top, VR, guide), L(bot, VR, guide), L(tl, VR, guide), L(bl, VR, guide), L(tr, VL, guide), L(br, VL, guide),
                    s('path', { d: `M${top} L${tl} L${bl} L${bot} Z`, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 }),
                    s('path', { d: `M${top} L${tr} L${br} L${bot} Z`, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 3 }),
                    s('circle', { cx: VL[0], cy: VL[1], r: 6, class: 'fl-ink' }), s('circle', { cx: VR[0], cy: VR[1], r: 6, class: 'fl-ink' }),
                    s('text', { x: VL[0], y: VL[1] + 24, class: 'lbl', 'text-anchor': 'middle', text: 'VP' }),
                    s('text', { x: VR[0], y: VR[1] + 24, class: 'lbl', 'text-anchor': 'middle', text: 'VP' }),
                  ];
                },
              },
              after: r`In this **two-point perspective**, the box's left-going edges meet at one vanishing point, its right-going edges at another, and vertical edges stay vertical. Since the horizon is at eye level, we're looking slightly down on the box's top.`,
            },
            {
              type: 'mcq',
              title: 'Where is the vanishing point?',
              prompt: r`Why do parallel rails meet at a point in the picture, when they never meet in reality?`,
              choices: [
                { t: 'Points far along the rails are seen in almost the same direction, so their images approach a single point', ok: true },
                { t: 'The rails really do bend together far away', why: 'They stay parallel. Only their images converge.' },
                { t: 'It’s an artistic convention, not geometry', why: 'Cameras show it too. It follows from straight rays through a single point.' },
              ],
              explain: r`Very distant points on either rail lie in nearly the same direction from your eye: the direction the rails point. The image of that direction is the vanishing point. It's the image of a point "at infinity" shared by all lines with that direction.`,
            },
            {
              type: 'mcq',
              title: 'Looking up at a skyscraper',
              prompt: r`Photograph a tall building by tilting the camera upwards. Its vertical edges no longer look parallel. Why?`,
              choices: [
                { t: 'Tilting the picture plane gives vertical lines their own vanishing point, high above: three-point perspective', ok: true },
                { t: 'The building really tapers', why: 'Most buildings have truly vertical walls. The convergence comes from tilting the camera.' },
                { t: 'Lens distortion', why: 'Even a perfect pinhole shows it. It’s perspective, not a lens flaw.' },
              ],
              explain: r`Vertical lines stay parallel in a picture only while the picture plane is vertical. Tilt the camera and verticals converge to a third vanishing point. Architectural photographers use special "tilt-shift" lenses to keep them parallel.`,
            },
            {
              type: 'interactive',
              title: 'Find the horizon',
              body: r`A photo shows two straight edges of a road converging. Drag the coral point to the spot where they would meet: the vanishing point, which lies on the horizon.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, maxWidth: 520,
                params: { x: { min: 0, max: 10, step: 0.05, value: 2, slider: false }, y: { min: 0, max: 6, step: 0.05, value: 1.5, slider: false } },
                extra: ({ plot, p, s }) => { const V = [6.3, 3.7], L = (a, b, st) => s('line', { x1: plot.X(a[0]), y1: plot.Y(a[1]), x2: plot.X(b[0]), y2: plot.Y(b[1]), ...st }), t = 0.62; const l0 = [1, 0], r0 = [9.5, 0]; const lt = [l0[0] + t * (V[0] - l0[0]), l0[1] + t * (V[1] - l0[1])], rt = [r0[0] + t * (V[0] - r0[0]), r0[1] + t * (V[1] - r0[1])]; return [s('path', { d: `M${plot.X(l0[0])} ${plot.Y(0)}L${plot.X(lt[0])} ${plot.Y(lt[1])}L${plot.X(rt[0])} ${plot.Y(rt[1])}L${plot.X(r0[0])} ${plot.Y(0)}Z`, class: 'fl-surface', stroke: 'none' }), L(l0, lt, { stroke: 'var(--ink)', 'stroke-width': 4 }), L(r0, rt, { stroke: 'var(--ink)', 'stroke-width': 4 }), L([p.x - 0.01, p.y], [0, p.y], { stroke: 'var(--teal)', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }), L([p.x, p.y], [10, p.y], { stroke: 'var(--teal)', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' })]; },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'coral' }],
                readout: (p) => { const d = Math.hypot(p.x - 6.3, p.y - 3.7); return d < 0.2 ? 'Right on the vanishing point ✓ The dashed line is the horizon.' : `distance from the vanishing point: ${d.toFixed(2)}`; },
                goal: (p) => Math.hypot(p.x - 6.3, p.y - 3.7) < 0.2,
                hint: 'Extend both road edges in your mind until they cross.',
                solution: { x: 6.3, y: 3.7 },
              },
              explain: r`The edges meet at the vanishing point, and the horizontal line through it is the horizon: the photographer's eye level. Forensic analysts use this to work out where a camera was, and to spot faked photos, where shadows or edges point to inconsistent vanishing points.`,
            },
            {
              type: 'mcq',
              title: 'Lines with no vanishing point',
              prompt: r`Which parallel lines in a scene do **not** meet at a vanishing point in a photograph?`,
              choices: [
                { t: r`Lines parallel to the picture plane, like the horizontal edges of a wall you face squarely`, ok: true },
                { t: r`Railway tracks running away from you`, why: r`Those are the classic example of lines that do converge.` },
                { t: r`None: all parallel lines converge`, why: r`Lines parallel to the image plane stay parallel in the picture; their vanishing point is at infinity.` },
              ],
              explain: r`Only lines heading away from (or towards) the camera converge. Lines parallel to the picture plane keep their direction, which is why the front of a building seen face-on looks undistorted while its sides recede.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Eye level',
              prompt: r`A photo is taken from an eye height of 1.6 m on flat ground. People of various heights stand at different distances. At what height above the ground does the horizon cut through **every** person in the photo?`,
              unit: 'm',
              answer: 1.6,
              tol: 0.01,
              wrong: [{ v: 0, why: 'The horizon is at the camera’s eye level, not at the ground.' }],
              explain: r`The horizon is at the camera's height, 1.6 m, so it passes through every standing person at 1.6 m above their feet, near the eyes of adults and above the heads of small children, at any distance. Artists use this to draw figures at the right size anywhere in a scene.`,
            },
          ],
          recap: [
            'Each family of parallel lines converges to its own vanishing point.',
            'Horizontal lines vanish on the horizon, at eye level.',
            'A vanishing point is the image of a point at infinity.',
          ],
        },
      ],
    },
    {
      title: 'Projective Geometry',
      summary: 'What survives projection.',
      lessons: [
        {
          id: 'crossratio',
          title: 'The Cross-Ratio',
          summary: 'An invariant of perspective',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'What projection preserves',
              body: r`Projection distorts lengths, and even ratios of lengths: equally spaced posts don't look equally spaced. But one quantity survives. For four points $A, B, C, D$ on a line (at positions $a, b, c, d$), the **cross-ratio** is
$$(A, B; C, D) = \frac{(c - a)(d - b)}{(c - b)(d - a)}$$
Any perspective projection from one line to another keeps the cross-ratio unchanged. For posts at positions 0, 1, 2, 3 along a road, it is $\frac{2 \times 2}{1 \times 3} = \frac43$.`,
            },
            {
              type: 'multi',
              title: 'What survives?',
              prompt: r`A photograph is a perspective projection of the scene. Which of these properties are always preserved? Select all.`,
              choices: [
                { t: 'Straight lines stay straight', ok: true },
                { t: 'Three points on a line stay on a line', ok: true },
                { t: 'The cross-ratio of four points on a line', ok: true },
                { t: 'Lengths', why: 'Nearer things look bigger: lengths change.' },
                { t: 'Midpoints', why: 'The far half of a road segment looks shorter than the near half, so the midpoint moves.' },
                { t: 'Parallel lines stay parallel', why: 'Rails converge to a vanishing point.' },
              ],
              explain: r`Projection keeps lines, which points lie on which lines (**incidence**), and the cross-ratio. It destroys lengths, angles, midpoints and parallelism. Projective geometry is the study of exactly the properties that survive.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Place the fourth post',
              prompt: r`Four equally spaced posts stand along a road. In the picture, the first three appear at heights 0, 6 and 10. Drag the fourth post up or down the road until the picture's cross-ratio matches the real one, $\frac43$.`,
              widget: {
                kind: 'graph', xmin: -16, xmax: 16, ymin: -1, ymax: 32, grid: false, axes: false, height: 320, maxWidth: 520,
                params: { u: { min: 10.5, max: 20, step: 0.01, value: 16, slider: false } },
                points: [{ x: (p) => halfW(p.u) + 1.2, y: (p) => p.u, drag: { y: 'u' }, color: 'coral' }],
                extra: ({ plot, p, s }) => {
                  const els = [
                    s('line', { x1: plot.X(-16), x2: plot.X(16), y1: plot.Y(HZ), y2: plot.Y(HZ), stroke: 'var(--teal)', 'stroke-width': 2 }),
                    s('path', { d: `M${plot.X(-12)} ${plot.Y(0)} L${plot.X(0)} ${plot.Y(HZ)} L${plot.X(12)} ${plot.Y(0)} Z`, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                  ];
                  [0, 6, 10, p.u].forEach((u, i) => {
                    const x = halfW(u) + 1.2, hgt = 9 * (1 - u / HZ);
                    els.push(s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(u), y2: plot.Y(u + hgt), stroke: i === 3 ? 'var(--coral)' : 'var(--ink)', 'stroke-width': i === 3 ? 4 : 3.5, 'stroke-linecap': 'round' }));
                    if (i < 3) els.push(s('circle', { cx: plot.X(x), cy: plot.Y(u), r: 5, class: 'fl-ink' }));
                  });
                  return els;
                },
                readout: (p) => r`picture heights $0, 6, 10, ${p.u.toFixed(2)}$: $\;$ cross-ratio $= \frac{10 \times ${(p.u - 6).toFixed(2)}}{4 \times ${p.u.toFixed(2)}} = ${cross(0, 6, 10, p.u).toFixed(3)}$`,
                goal: (p) => Math.abs(cross(0, 6, 10, p.u) - 4 / 3) < 0.01,
                hint: r`Solve $\frac{10(u - 6)}{4u} = \frac43$ for $u$.`,
                solution: { u: 12.86 },
              },
              explain: r`$\frac{10(u - 6)}{4u} = \frac43$ gives $30u - 180 = 16u$, so $u = \frac{90}{7} \approx 12.86$. The gaps in the picture shrink (6, 4, 2.86), but the cross-ratio stays $\frac43$. Architects and accident investigators use exactly this to recover real distances from photographs.`,
            },
            {
              type: 'numeric',
              title: 'Find the horizon',
              prompt: r`Real positions 0, 1, 2 and the point at infinity have cross-ratio $\frac{(2 - 0)}{(2 - 1)} = 2$ (the terms with infinity cancel). The posts at 0, 1, 2 appear at picture heights 0, 6, 10. At what height is the vanishing point (the image of infinity)?`,
              answer: 30,
              tol: 0.05,
              wrong: [{ v: 14, why: 'The picture gaps shrink (6, then 4, …) but never by a fixed amount. Use the cross-ratio.' }],
              explain: r`Solve $\frac{(10 - 0)(v - 6)}{(10 - 6)(v - 0)} = 2$: $10v - 60 = 8v$, so $v = 30$. That's the horizon in the picture. From three images of equally spaced objects, you can locate the horizon exactly.`,
            },
            {
              type: 'numeric',
              title: 'Compute a cross-ratio',
              prompt: r`Points $A, B, C, D$ lie on a line at positions 0, 1, 2 and 3. Compute the cross-ratio $\frac{AC \cdot BD}{BC \cdot AD}$. (3 decimal places.)`,
              answer: 4 / 3,
              tol: 0.001,
              explain: r`$\frac{2 \times 2}{1 \times 3} = \frac43 \approx 1.333$. Photograph the four points from any angle and this number stays the same, even though the distances themselves change.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Unequal spacing',
              prompt: r`Four points lie at positions 0, 1, 3 and 4 on a line. What is their cross-ratio $\frac{(c-a)(d-b)}{(c-b)(d-a)}$? (Give a fraction or decimal.)`,
              answer: 9 / 8,
              tol: 0.001,
              wrong: [{ v: 4 / 3, tol: 0.001, why: 'That’s for equally spaced points. Here c = 3 and d = 4.' }],
              explain: r`$\frac{(3 - 0)(4 - 1)}{(3 - 1)(4 - 0)} = \frac{9}{8}$. However this line is photographed, the four images will still have cross-ratio $\frac98$.`,
            },
          ],
          recap: [
            r`Cross-ratio: $\frac{(c-a)(d-b)}{(c-b)(d-a)}$.`,
            'Perspective projection changes lengths but preserves the cross-ratio.',
            'It lets you recover true spacing, or the horizon, from a picture.',
          ],
        },
        {
          id: 'infinity',
          title: 'Points at Infinity',
          summary: 'A plane where any two lines meet',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'The projective plane',
              body: r`Vanishing points suggest a bold idea: add to the ordinary plane one extra **point at infinity** for each direction, where all lines with that direction meet, and a **line at infinity** made of all of them. The result is the **projective plane**.

In it, a beautifully simple rule holds with no exceptions: **any two distinct lines meet in exactly one point**. Parallel lines meet at infinity. And any two points lie on exactly one line. Swapping "point" and "line" in any theorem gives another true theorem: this is **duality**.`,
            },
            {
              type: 'interactive',
              title: 'Running off to infinity',
              body: r`Two lines meet at a point. In **homogeneous coordinates** a point $(x, y)$ is written $(x : y : 1)$, and any multiple names the same point. Rotate the coral line toward being parallel to the blue one, and watch the meeting point and its coordinates.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -4, ymax: 4, grid: 1, height: 320, maxWidth: 520, axes: { xticks: 2, yticks: 2 },
                params: { m: { min: -1, max: 0.5, step: 0.01, value: -0.6, label: 'coral slope', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => 0.5 * x - 1, color: 'blue', width: 3 }, { f: (x, p) => p.m * x + 1, color: 'coral', width: 3 }],
                points: [{ x: (p) => (Math.abs(0.5 - p.m) < 1e-9 ? NaN : Math.max(-60, Math.min(60, 2 / (0.5 - p.m)))), y: (p) => (Math.abs(0.5 - p.m) < 1e-9 ? NaN : 0.5 * Math.max(-60, Math.min(60, 2 / (0.5 - p.m))) - 1), color: 'violet' }],
                readout: (p) => { const w = 0.5 - p.m; if (Math.abs(w) < 1e-9) return 'Parallel! They meet at $(2 : 1 : 0)$, the **point at infinity** in direction $(2, 1)$ ✓'; const x = 2 / w, y = 0.5 * x - 1; return `meeting point $(${x.toFixed(2)}, ${y.toFixed(2)})$ = $(2 : ${(1 - w * 1).toFixed(2)} : ${w.toFixed(2)})$ after scaling`; },
                goal: (p) => Math.abs(0.5 - p.m) < 1e-9,
                hint: 'The blue line has slope 0.5.',
                solution: { m: 0.5 },
              },
              explain: r`Scaling the meeting point $(x, y, 1)$ by $w = \frac12 - m$ gives $(2 : 1 - w : w)$. As the lines become parallel, $w \to 0$ and the point becomes $(2 : 1 : 0)$: a perfectly good point with third coordinate zero, the point at infinity in the lines' common direction. Every graphics card does its 3D geometry in these coordinates.`,
            },
            {
              type: 'mcq',
              title: 'One conic to rule them all',
              prompt: r`Shine a torch at a wall: the edge of the light can be a circle, an ellipse, a parabola or a hyperbola, depending on the tilt. What does projective geometry say about these curves?`,
              choices: [
                { t: 'They’re all the same curve, seen in different perspectives: they differ only in how they meet the line at infinity', ok: true },
                { t: 'They’re unrelated curves that just happen to appear together', why: 'They’re all projections of a circle, the cross-sections of a cone.' },
                { t: 'Only the circle and ellipse are related', why: 'Tilt further and the ellipse stretches into a parabola, then a hyperbola. All are projections of a circle.' },
              ],
              explain: r`An ellipse misses the line at infinity, a parabola touches it at one point, and a hyperbola crosses it at two (the directions of its asymptotes). Projectively, they're a single type of curve: the **conic**. That's why one theory covers all four, from planetary orbits to satellite dishes.`,
            },
            {
              type: 'numeric',
              title: 'The smallest projective plane',
              prompt: r`The **Fano plane** is a finite geometry with just 7 points. Every line contains exactly 3 points, every point lies on exactly 3 lines, and any two points lie on exactly one line. How many lines does it have?`,
              unit: 'lines',
              answer: 7,
              wrong: [{ v: 21, why: r`That's the number of point-pairs, $\binom72$. Each line contains 3 pairs: $21 \div 3$.` }, { v: 3, why: 'Each point is on 3 lines, but there are 7 points.' }],
              hint: r`Count pairs of points: each line accounts for $\binom32 = 3$ of the $\binom72 = 21$ pairs.`,
              explain: r`$\frac{21}{3} = 7$ lines, the same as the number of points: duality again. Every two lines meet in exactly one point, with no parallels at all. Finite geometries like this are used to design error-correcting codes and fair tournament schedules.`,
            },
            {
              type: 'numeric',
              title: 'A bigger finite plane',
              prompt: r`A finite projective plane of order $n$ has $n^2 + n + 1$ points (and as many lines). How many points does the plane of order 3 have?`,
              answer: 13,
              explain: r`$9 + 3 + 1 = 13$ points, with 4 points on every line and 4 lines through every point. The order-2 plane is the 7-point Fano plane. Nobody knows whether a plane of order 12 exists.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Desargues’ theorem',
              prompt: r`Girard Desargues, an architect, proved in the 1600s: if two triangles are "in perspective from a point" (lines joining corresponding corners meet at one point), then the three pairs of corresponding sides meet at three points that lie on one line. What happens if two pairs of corresponding sides are parallel?`,
              choices: [
                { t: 'Those pairs meet at points at infinity, and the third pair must meet on the line at infinity too, so it is also parallel', ok: true },
                { t: 'The theorem breaks down', why: 'In the projective plane, parallel lines meet at infinity, so the theorem still holds without exception.' },
                { t: 'The triangles must be identical', why: 'They can be different sizes (like an object and its shadow). The conclusion is that the third pair of sides is parallel too.' },
              ],
              explain: r`If two of the meeting points are at infinity, the line through them is the line at infinity, so the third must be there too: the third pair of sides is parallel. Points at infinity turn special cases into the general case, which is why projective geometry is so elegant, and why computer graphics uses "homogeneous coordinates" built on it.`,
            },
          ],
          recap: [
            'The projective plane adds points at infinity where parallel lines meet.',
            'Any two lines meet in exactly one point; points and lines are dual.',
            'Circles, ellipses, parabolas and hyperbolas are all projectively the same conic.',
          ],
        },
      ],
    },
    {
      title: 'Other Projections',
      summary: 'Shadows and distorted art.',
      lessons: [
        {
          id: 'shadows',
          title: 'Sunlight & Shadows',
          summary: 'Parallel versus central projection',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Two kinds of shadow',
              body: r`A lamp casts shadows by **central projection**: rays spread out from one point, just like perspective, so shadows of parallel sticks fan out. The Sun is so far away that its rays are parallel: **parallel projection**. Sun-shadows of parallel sticks are parallel, and equal sticks cast equal shadows.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the Sun',
              prompt: r`A 2 m pole casts a shadow. Find the Sun's elevation angle that makes the shadow about **3.46 m** long.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 7, ymin: -0.4, ymax: 3, grid: false, axes: false, maxWidth: 520,
                params: { e: { min: 15, max: 75, step: 1, value: 50, label: 'Sun elevation', color: 'amber', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const L = 2 / Math.tan(p.e * D);
                  return [
                    s('line', { x1: plot.X(-0.5), x2: plot.X(7), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('line', { x1: plot.X(0), x2: plot.X(L), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 8, opacity: 0.6 }),
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(0), y2: plot.Y(2), stroke: 'var(--blue)', 'stroke-width': 5 }),
                    s('line', { x1: plot.X(L), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(2), stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                  ];
                },
                readout: (p) => r`shadow $= \dfrac{2}{\tan ${p.e}°} = ${(2 / Math.tan(p.e * D)).toFixed(2)}$ m`,
                goal: (p) => p.e === 30,
                hint: r`$\tan(\text{elevation}) = \frac{2}{3.46} \approx 0.578$.`,
                solution: { e: 30 },
              },
              explain: r`$\tan\theta = \frac{2}{3.46} \approx 0.578$, so $\theta \approx 30°$ (indeed $3.46 \approx 2\sqrt3$). Measuring shadows at known times was how Eratosthenes measured the Earth.`,
            },
            {
              type: 'mcq',
              title: 'What survives',
              prompt: r`Under parallel projection (sun-shadows), which property is preserved that perspective destroys?`,
              choices: [
                { t: 'Parallel lines stay parallel, and midpoints stay midpoints', ok: true },
                { t: 'All lengths stay the same', why: 'Shadow lengths depend on the Sun’s angle. But ratios along a line are preserved.' },
                { t: 'Nothing is preserved', why: 'Parallelism and ratios along lines survive parallel projection.' },
              ],
              explain: r`Parallel projection is an **affine** map: it keeps parallels parallel and preserves ratios along a line (so midpoints stay midpoints). Perspective keeps only the cross-ratio. Technical drawings use parallel projections precisely because measurements stay meaningful.`,
            },
            {
              type: 'numeric',
              title: 'A shadow from the Sun',
              prompt: r`A 2 m pole stands upright on flat ground with the Sun $30°$ above the horizon. How long is its shadow? (2 decimal places, in metres.)`,
              unit: 'm',
              answer: 2 / Math.tan(Math.PI / 6),
              tol: 0.01,
              wrong: [{ v: 1.15, tol: 0.01, why: r`That’s $2 \tan 30°$. The shadow is longer than the pole when the Sun is low.` }],
              explain: r`$\frac{2}{\tan 30°} \approx 3.46$ m. Around 240 BC, Eratosthenes compared shadows in two Egyptian cities at noon and estimated the size of the Earth.`,
            },
            {
              type: 'mcq',
              title: 'Converging shadows',
              prompt: r`Telegraph poles along a straight road cast parallel shadows in sunlight. In a photograph, the shadows appear to converge. Why?`,
              choices: [
                { t: r`Parallel lines on the ground share a vanishing point on the horizon, just like the road edges`, ok: true },
                { t: r`Sunlight spreads out from the Sun`, why: r`The Sun is so far away that its rays are parallel; the convergence is perspective.` },
                { t: r`The poles are leaning`, why: r`The shadows are parallel in reality; the camera’s perspective makes them converge.` },
              ],
              explain: r`Sun shadows on flat ground are parallel horizontal lines, so in a picture they converge to a vanishing point on the horizon line, like any other horizontal parallels. (The sunbeams themselves are not horizontal: they converge on a different point, the Sun itself, or, with the Sun behind you, the point directly opposite it, below the horizon.) Artists use this to place shadows convincingly.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Lamp shadow',
              prompt: r`A 1.5 m child stands 2 m from a street lamp 6 m tall. How long is the child's shadow? (Similar triangles: $\frac{s}{1.5} = \frac{s + 2}{6}$.)`,
              unit: 'm',
              answer: 2 / 3,
              tol: 0.01,
              wrong: [{ v: 0.5, why: r`Solve $6s = 1.5(s + 2)$: $4.5s = 3$.` }],
              explain: r`$6s = 1.5s + 3$, so $s = \frac{3}{4.5} = \frac23$ m. Walk away from the lamp and the shadow grows: unlike sun-shadows, lamp shadows depend on where you stand.`,
            },
          ],
          recap: [
            'Lamps cast shadows by central projection; the Sun by parallel projection.',
            'Parallel projection keeps parallel lines parallel and ratios along lines.',
            'Lamp shadows grow as you move away from the lamp.',
          ],
        },
        {
          id: 'anamorphosis',
          title: 'Anamorphic Art',
          summary: 'Pictures that only work from one angle',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'The hidden skull',
              body: r`In Hans Holbein's 1533 painting *The Ambassadors*, a strange smear crosses the floor. View it from low down at the side and it snaps into a perfect skull. This is **anamorphosis**: an image deliberately distorted so it looks right only from one special viewpoint.

Street artists use the same trick for 3D pavement drawings, and roads use it for words like "BUS LANE", painted very long so drivers see normal letters.`,
            },
            {
              type: 'numeric',
              title: 'How long should the letters be?',
              prompt: r`A driver sees the road at a shallow angle, which squashes lengths along the road by a factor of $\sin\theta$, where $\theta$ is the viewing angle above the road. If $\theta = 10°$, by roughly what factor should road letters be stretched? (1 decimal place.)`,
              unit: '×',
              answer: 1 / Math.sin(10 * D),
              tol: 0.06,
              wrong: [{ v: 10, why: r`Stretch by $\frac{1}{\sin 10°}$, not by the angle.` }],
              explain: r`$\frac{1}{\sin 10°} \approx 5.8$: letters about six times longer than wide look normal from a driving seat. That's why road markings look so elongated when you walk over them.`,
            },
            {
              type: 'interactive',
              title: 'Make it look square',
              body: r`A rectangle 1 m wide and 4 m long is painted on the road. Viewed at an angle $\theta$ above the ground, its length looks squashed by $\sin\theta$. Find the viewing angle at which it looks like a perfect **square**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 7, ymin: -0.3, ymax: 4.3, grid: false, axes: false, maxWidth: 480,
                params: { th: { min: 5, max: 90, step: 0.5, value: 45, label: 'viewing angle', color: 'violet', format: (v) => `${fix(v, 1)}°` } },
                extra: ({ plot, p, s }) => { const k = Math.sin(p.th * D); return [s('rect', { x: plot.X(0), y: plot.Y(4), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(4), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('text', { x: plot.X(0.5), y: plot.Y(-0.2) + 4, 'text-anchor': 'middle', class: 'tick', text: 'on the road' }), s('rect', { x: plot.X(3.5), y: plot.Y(4 * k), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(4 * k), class: Math.abs(4 * k - 1) < 0.03 ? 'fl-teal-soft' : 'fl-coral-soft', stroke: Math.abs(4 * k - 1) < 0.03 ? 'var(--teal)' : 'var(--coral)', 'stroke-width': 2 }), s('text', { x: plot.X(4), y: plot.Y(-0.2) + 4, 'text-anchor': 'middle', class: 'tick', text: 'as seen' })]; },
                readout: (p) => `apparent shape: 1 m wide × **${(4 * Math.sin(p.th * D)).toFixed(2)} m** long`,
                goal: (p) => Math.abs(4 * Math.sin(p.th * D) - 1) < 0.02,
                hint: r`You need $4\sin\theta = 1$.`,
                solution: { th: 14.5 },
              },
              explain: r`$\sin\theta = \frac14$ gives $\theta \approx 14.5°$. From that angle (for example, standing about 4 m back with your eyes 1 m above the ground) the long rectangle reads as a square. Painters of road markings choose stretch factors for the typical viewing angle of a driver.`,
            },
            {
              type: 'numeric',
              title: 'A driver’s view',
              prompt: r`A driver's eyes are 1.2 m above the road, reading markings 10 m ahead. The viewing angle satisfies $\tan\theta = \frac{1.2}{10}$. By what factor ($\frac{1}{\sin\theta}$) should the markings be stretched? (2 decimal places.)`,
              unit: '×',
              answer: 1 / Math.sin(Math.atan(1.2 / 10)),
              tol: 0.02,
              wrong: [{ v: 10 / 1.2, tol: 0.02, why: r`That's $\frac{1}{\tan\theta}$. Use $\frac{1}{\sin\theta}$ (close, but not the same).` }],
              explain: r`$\theta = \arctan 0.12 \approx 6.8°$, and $\frac{1}{\sin 6.8°} \approx 8.39$. Markings meant to be read from farther away need even more stretching, which is why "SLOW" can be painted over 10 m long.`,
            },
            {
              type: 'mcq',
              title: 'Mirror anamorphosis',
              prompt: r`Some anamorphic pictures look like smeared rings on the table, until you place a polished metal cylinder in the middle and look at its reflection. What does the cylinder do?`,
              choices: [
                { t: r`It reflects the curved, stretched image back into an undistorted one`, ok: true },
                { t: r`It magnifies the picture`, why: r`It changes the shape, not just the size: the drawing was pre-distorted to undo the mirror’s curvature.` },
                { t: r`It projects light onto the table`, why: r`It only reflects; the artist designed the drawing to look right in its reflection.` },
              ],
              explain: r`The artist works backwards: each point of the intended image is traced through the mirror’s reflection to find where to draw it on the table. Cylindrical anamorphosis was popular in 17th-century Europe and China.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Pavement illusions',
              prompt: r`A 3D chalk drawing of a hole in the pavement looks convincing from one spot but warped from everywhere else. Which geometry explains this?`,
              choices: [
                { t: 'It’s a central projection designed for one viewpoint: from elsewhere, the projection no longer matches', ok: true },
                { t: 'The chalk reflects light differently', why: 'Lighting helps, but the illusion is geometric: it’s designed for a single centre of projection.' },
                { t: 'It works from any point', why: 'Walk around one and it distorts badly. Anamorphic images work only from their design point.' },
              ],
              explain: r`The artist works out where each point of the imagined 3D scene would project onto the pavement as seen from one eye position. Stand there (often marked) and the projection matches your view; anywhere else, it's just a stretched drawing.`,
            },
          ],
          recap: [
            'Anamorphic images are distorted so they look right from one viewpoint.',
            r`Viewing at a shallow angle $\theta$ squashes lengths by $\sin\theta$.`,
            'Road markings and pavement art use anamorphosis.',
          ],
        },
        {
          id: 'stereo',
          title: 'Two Eyes, Depth',
          summary: 'Seeing distance through disparity',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Two slightly different pictures',
              body: r`Your eyes are about 6.5 cm apart, so each sees the scene from a slightly different place. A nearby object appears shifted between the two views much more than a distant one. That shift is called **disparity**, and your brain turns it into a sense of depth.

Two cameras a distance $B$ apart (the **baseline**), each with focal length $f$ (measured in pixels), see an object at depth $Z$ shifted by
$$d = \frac{fB}{Z} \quad\text{pixels, so}\quad Z = \frac{fB}{d}.$$`,
            },
            {
              type: 'numeric',
              title: 'The thumb test',
              prompt: r`Hold your thumb up at arm’s length (60 cm) and close each eye in turn: it jumps against the background. With eyes 6.5 cm apart, the angle it jumps is about $\frac{B}{Z}$ radians. How many degrees is that? (1 decimal place.)`,
              unit: '°',
              answer: (0.065 / 0.6) * 180 / Math.PI,
              tol: 0.1,
              explain: r`$\frac{0.065}{0.6} \approx 0.108$ rad $\approx 6.2°$. A star a light-year away jumps by a vanishingly small angle, which is why our eyes can’t see stellar depth at all.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A robot’s eyes',
              prompt: r`A robot has two cameras 12 cm apart, with $f = 800$ pixels. Seen from above, the rays from each camera meet at the object. Find the disparity that puts the object **4 m** away.`,
              widget: {
                kind: 'graph', xmin: -1.5, xmax: 1.5, ymin: -0.3, ymax: 6.5, grid: false, height: 300, axes: { ylabel: 'depth (m)', yticks: 1, xticks: 10 },
                params: { d: { min: 10, max: 120, step: 1, value: 60, label: 'disparity', color: 'coral', format: (v) => `${v} px` } },
                extra: ({ plot, p, s }) => { const Z = (800 * 0.12) / p.d, out = []; for (const cx of [-0.06, 0.06]) out.push(s('line', { x1: plot.X(cx), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(Math.min(Z, 6.4)), stroke: 'var(--violet)', 'stroke-width': 2 }), s('rect', { x: plot.X(cx) - 7, y: plot.Y(0) - 5, width: 14, height: 10, rx: 2, class: 'fl-ink' })); out.push(s('circle', { cx: plot.X(0), cy: plot.Y(Math.min(Z, 6.4)), r: 8, class: 'fl-coral' })); return out; },
                readout: (p) => `depth Z = 800 × 0.12 / ${p.d} = **${((800 * 0.12) / p.d).toFixed(2)} m**`,
                goal: (p) => p.d === 24,
                hint: 'd = fB / Z = 800 × 0.12 / 4.',
                solution: { d: 24 },
              },
              explain: r`$d = \frac{800 \times 0.12}{4} = 24$ pixels. Halve the distance and the disparity doubles; at 1 m it would be 96 pixels. Self-driving cars, Mars rovers and some phone cameras use exactly this calculation.`,
            },
            {
              type: 'mcq',
              title: 'Fuzzy at a distance',
              prompt: r`The cameras can only measure disparity to about ±1 pixel. How does the resulting uncertainty in depth change with distance?`,
              choices: [
                { t: 'It grows like the square of the distance', ok: true },
                { t: 'It stays the same at all distances', why: r`Far away, the disparity is small, so a 1-pixel error is a large fraction of it.` },
                { t: 'It grows in proportion to the distance', why: r`It’s worse than that: $Z = fB/d$ and a change in $d$ changes $Z$ by about $\frac{Z^2}{fB}$ per pixel.` },
              ],
              explain: r`Since $Z = \frac{fB}{d}$, a 1-pixel change in $d$ changes $Z$ by about $\frac{Z^2}{fB}$. Double the distance and the depth error quadruples. That’s why stereo works brilliantly up close and poorly far away, and why wider baselines help.`,
            },
            {
              type: 'numeric',
              title: 'How precise?',
              prompt: r`For the robot ($f = 800$, $B = 0.12$ m), a 1-pixel error at 4 m changes the depth by about $\frac{Z^2}{fB}$. How many centimetres is that? (Nearest cm.)`,
              unit: 'cm',
              answer: (16 / 96) * 100,
              tol: 1,
              explain: r`$\frac{4^2}{800 \times 0.12} = \frac{16}{96} \approx 0.17$ m, about **17 cm**. At 1 m it would be only 1 cm, and at 16 m almost 3 m.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Stereo for stars',
              prompt: r`Astronomers use Earth’s orbit as a baseline. A star whose position shifts by 1 arcsecond as Earth moves 1 AU sideways is at a distance of 1 **parsec** (about 3.26 light-years). A star shifts by only 0.1 arcseconds. How many parsecs away is it?`,
              unit: 'pc',
              answer: 10,
              wrong: [{ v: 0.1, why: 'Smaller shifts mean greater distances: distance = 1 / shift.' }],
              explain: r`Distance $= \frac{1}{0.1} = 10$ parsecs (about 33 light-years): the same rule $Z = \frac{B}{\text{angle}}$ as for the robot. The Gaia spacecraft measures shifts of millionths of an arcsecond, mapping over a billion stars in 3D.`,
            },
          ],
          recap: [
            'Disparity d = fB/Z: nearer objects shift more between two views.',
            'Depth error grows like Z²: stereo is best up close.',
            'Stellar parallax is stereo vision with Earth’s orbit as the baseline.',
          ],
        },
      ],
    },
  ],
};
