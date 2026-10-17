import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed d decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d);
const PLANE = { kind: 'graph', equal: true, xmin: -5, xmax: 5, ymin: -4, ymax: 4, grid: 1, axes: { xlabel: 'x', ylabel: 'y' } };
const vec = (plot, arrow, x0, y0, x1, y1, color, w = 4) => arrow(plot.X(x0), plot.Y(y0), plot.X(x1), plot.Y(y1), { color: `var(--${color})`, width: w, head: 14 });

const D2R = Math.PI / 180;
// two ships: A starts at (0,0) with velocity (3,1); B at (10,0) with velocity (−1,2) (km, km/h)
const shipA = (t) => [3 * t, t], shipB = (t) => [10 - t, 2 * t];
const shipDist = (t) => Math.hypot(shipB(t)[0] - shipA(t)[0], shipB(t)[1] - shipA(t)[1]);
const T_MIN = 80 / 34;

export default {
  id: 'vectors',
  subject: 'math',
  title: 'Vectors & Matrices',
  level: 'Intermediate',
  cover: 'vectors',
  tagline: 'Arrows you can add, stretch and multiply, and the matrices that move them.',
  description: r`Vectors describe anything with a size and a direction: forces, velocities, displacements. Learn to add them tip-to-tail, measure angles with the dot product, see matrices as machines that transform the whole plane, compute areas and torques with the cross product, and track moving ships with vector lines.`,
  prereq: 'Trigonometry',
  chapters: [
    {
      title: 'Vectors',
      summary: 'Size, direction, components and addition.',
      lessons: [
        {
          id: 'arrows',
          title: 'Arrows with Direction',
          summary: 'Components and magnitude',
          icon: 'right',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Not enough information',
              body: r`A friend says: "Walk 5 km from here and you'll reach the lake."`,
              prompt: 'What’s missing?',
              cols: 2,
              choices: [
                { t: 'The direction', ok: true },
                { t: 'The units', why: 'They gave the units (km). What else do you need to find the lake?' },
                { t: 'The time it takes', why: 'Time doesn’t tell you where the lake is.' },
              ],
              explain: r`"5 km" could lead anywhere on a circle around you. To find the lake you need a **size** (5 km) and a **direction**. A quantity with both is a **vector**. A quantity with size only, like temperature or mass, is a **scalar**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Components',
              body: r`Drag the tip of the vector. It's described by its **components**: how far it goes in $x$ and how far in $y$. We write it as
$$\vec v = \begin{pmatrix} v_x \\ v_y \end{pmatrix}$$`,
              widget: {
                ...PLANE,
                params: { x: { min: -4.5, max: 4.5, step: 0.5, value: 3, slider: false }, y: { min: -3.5, max: 3.5, step: 0.5, value: 2, slider: false } },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'blue', r: 8 }],
                extra: ({ plot, p, s, arrow }) => [
                  s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(p.x), y2: plot.Y(0), stroke: 'var(--teal)', 'stroke-width': 3, 'stroke-dasharray': '6 4' }),
                  s('line', { x1: plot.X(p.x), y1: plot.Y(0), x2: plot.X(p.x), y2: plot.Y(p.y), stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-dasharray': '6 4' }),
                  vec(plot, arrow, 0, 0, p.x, p.y, 'blue'),
                ],
                readout: (p) => r`$\vec v = \begin{pmatrix} \teal{${f2(p.x, 1)}} \\ \coral{${f2(p.y, 1)}} \end{pmatrix}, \quad |\vec v| = \sqrt{${f2(p.x, 1)}^2 + ${f2(p.y, 1)}^2} = ${f2(Math.hypot(p.x, p.y))}$`,
              },
              after: r`The length, or **magnitude**, comes from Pythagoras: $|\vec v| = \sqrt{v_x^2 + v_y^2}$.`,
            },
            {
              type: 'numeric',
              title: 'Magnitude',
              prompt: r`What is the magnitude of $\vec v = \begin{pmatrix} 6 \\ -8 \end{pmatrix}$?`,
              answer: 10,
              wrong: [
                { v: -2, why: r`Magnitude is a length, so never negative. Use $\sqrt{6^2 + (-8)^2}$.` },
                { v: 14, why: r`Square the components, add, then take the square root: $\sqrt{36 + 64}$.` },
              ],
              explain: r`$|\vec v| = \sqrt{36 + 64} = \sqrt{100} = 10$. Squaring removes the minus sign.`,
            },
            {
              type: 'numeric',
              title: 'From angle to components',
              body: r`A vector of length 10 points at 30° above the $x$-axis. Its components are $(10\cos 30°, 10\sin 30°)$.`,
              prompt: 'What is its y-component?',
              answer: 5,
              wrong: [{ v: 8.66, tol: 0.01, why: r`That's the $x$-component, $10\cos 30°$. The $y$-component uses $\sin$.` }],
              explain: r`$v_y = 10\sin 30° = 10 \times 0.5 = 5$, and $v_x = 10\cos 30° \approx 8.66$.`,
            },
            {
              type: 'numeric',
              title: 'Which way?',
              prompt: r`The vector $(1, \sqrt3)$ makes what angle with the positive $x$-axis, in degrees?`,
              unit: '°',
              answer: 60,
              explain: r`$\tan\theta = \frac{\sqrt3}{1}$, so $\theta = 60°$. Its length is $\sqrt{1 + 3} = 2$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Same vector?',
              body: r`Vector A goes from $(0, 0)$ to $(2, 3)$. Vector B goes from $(4, 1)$ to $(6, 4)$.`,
              prompt: 'Are they the same vector?',
              choices: [
                { t: 'Yes: same length and direction', ok: true },
                { t: 'No: they start at different points', why: r`A vector is just a size and a direction. Where you draw it doesn't matter. Both move $+2$ in $x$ and $+3$ in $y$.` },
              ],
              explain: r`Both are $\begin{pmatrix} 2 \\ 3 \end{pmatrix}$. A vector describes a **displacement**, not a location, so you can slide it anywhere without changing it.`,
            },
          ],
          recap: [
            'Vectors have a size and a direction. Scalars have size only.',
            r`Components: $\vec v = (v_x, v_y)$. Magnitude: $|\vec v| = \sqrt{v_x^2 + v_y^2}$.`,
            r`From a length $L$ and an angle $\theta$: $(L\cos\theta, L\sin\theta)$.`,
          ],
        },
        {
          id: 'adding',
          title: 'Adding Vectors',
          summary: 'Tip to tail',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Two walks',
              body: r`You walk 3 km east, then 4 km north.`,
              prompt: 'How far are you from where you started?',
              unit: 'km',
              answer: 5,
              wrong: [{ v: 7, why: 'That’s the distance walked. The straight-line distance is shorter.' }],
              explain: r`The two walks are vectors $(3, 0)$ and $(0, 4)$. Your overall displacement is $(3, 4)$, which has length $\sqrt{9 + 16} = 5$ km.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Tip to tail',
              body: r`To add $\blue{\vec a} + \coral{\vec b}$, place $\vec b$'s tail at $\vec a$'s tip. The sum $\violet{\vec a + \vec b}$ goes from the start to the final tip. Drag both tips.`,
              widget: {
                ...PLANE,
                params: {
                  ax: { min: -4.5, max: 4.5, step: 0.5, value: 3, slider: false }, ay: { min: -3.5, max: 3.5, step: 0.5, value: 1, slider: false },
                  bx: { min: -4.5, max: 4.5, step: 0.5, value: -1, slider: false }, by: { min: -3.5, max: 3.5, step: 0.5, value: 2, slider: false },
                },
                points: [
                  { x: (p) => p.ax, y: (p) => p.ay, drag: { x: 'ax', y: 'ay' }, color: 'blue', r: 7 },
                  { x: (p) => p.ax + p.bx, y: (p) => p.ay + p.by, drag: { fn: (x, y, p) => ({ bx: x - p.ax, by: y - p.ay }), key: 'bx' }, color: 'coral', r: 7 },
                ],
                extra: ({ plot, p, s, arrow }) => [
                  vec(plot, arrow, 0, 0, p.ax + p.bx, p.ay + p.by, 'violet', 5),
                  vec(plot, arrow, 0, 0, p.ax, p.ay, 'blue'),
                  vec(plot, arrow, p.ax, p.ay, p.ax + p.bx, p.ay + p.by, 'coral'),
                ],
                readout: (p) => r`$\blue{(${f2(p.ax, 1)}, ${f2(p.ay, 1)})} + \coral{(${f2(p.bx, 1)}, ${f2(p.by, 1)})} = \violet{(${f2(p.ax + p.bx, 1)}, ${f2(p.ay + p.by, 1)})}$`,
              },
              after: r`In components, you just add matching parts: $(a_x + b_x,\; a_y + b_y)$.`,
            },
            {
              type: 'numeric',
              title: 'Add components',
              prompt: r`$(2, -1) + (-5, 4) = (x, y)$. What is $y$?`,
              lhs: r`$y =$`,
              answer: 3,
              wrong: [{ v: -5, why: r`Add the $y$-components: $-1 + 4$.` }, { v: -3, why: r`That's the $x$-component, $2 + (-5)$.` }],
              explain: r`$(2 + (-5),\; -1 + 4) = (-3, 3)$.`,
            },
            {
              type: 'numeric',
              title: 'Crossing a river',
              body: r`A boat points straight across a river at 4 m/s, relative to the water. The current flows downstream at 3 m/s.`,
              prompt: 'What is the boat’s actual speed, relative to the riverbank?',
              unit: 'm/s',
              answer: 5,
              wrong: [
                { v: 7, why: 'The velocities are at right angles, so you can’t just add their sizes.' },
                { v: 1, why: 'The current pushes sideways. It doesn’t directly oppose the boat.' },
              ],
              explain: r`The velocities add as vectors: $(0, 4) + (3, 0) = (3, 4)$, with magnitude 5 m/s. The boat drifts downstream as it crosses.`,
            },
            {
              type: 'interactive',
              title: 'Balance the forces',
              body: r`Two ropes pull on a ring with forces $\blue{(3, 1)}$ and $\teal{(-1, 2)}$. Drag the third force $\coral{\vec F}$ so the ring is in **balance**: the three forces must add to zero.`,
              widget: {
                ...PLANE,
                params: { fx: { min: -4.5, max: 4.5, step: 0.5, value: 1, slider: false }, fy: { min: -3.5, max: 3.5, step: 0.5, value: -1, slider: false } },
                points: [{ x: (p) => p.fx, y: (p) => p.fy, drag: { x: 'fx', y: 'fy' }, color: 'coral', r: 7 }],
                extra: ({ plot, p, s, arrow }) => [
                  vec(plot, arrow, 0, 0, 3, 1, 'blue'),
                  vec(plot, arrow, 0, 0, -1, 2, 'teal'),
                  vec(plot, arrow, 0, 0, p.fx, p.fy, 'coral'),
                  s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 7, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }),
                ],
                readout: (p) => r`total $= (${f2(2 + p.fx, 1)}, ${f2(3 + p.fy, 1)})$`,
                goal: (p) => p.fx === -2 && p.fy === -3,
                hint: r`The first two forces add to $(2, 3)$. What cancels that?`,
                solution: { fx: -2, fy: -3 },
              },
              explain: r`$(3, 1) + (-1, 2) = (2, 3)$, so the balancing force is $\vec F = (-2, -3)$: the same size as the sum, pointing the opposite way. Engineers balance forces like this in every bridge and building.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Pilot’s heading',
              body: r`A plane flies at 200 km/h relative to the air. A wind blows from west to east at 50 km/h. The pilot wants to travel due north, so they point the plane slightly west of north.`,
              prompt: 'What is the plane’s actual speed northward, relative to the ground? (Give a decimal.)',
              unit: 'km/h',
              answer: Math.sqrt(200 ** 2 - 50 ** 2),
              tol: 0.5,
              wrong: [{ v: 200, why: r`Some of the plane's airspeed is used to cancel the wind, so its northward speed is less than 200.` }, { v: Math.sqrt(200 ** 2 + 50 ** 2), tol: 0.5, why: r`The wind is cancelled, not added. The northward speed is $\sqrt{200^2 - 50^2}$.` }],
              explain: r`The plane's air velocity must have an east–west component of $-50$ to cancel the wind. Its north component is then $\sqrt{200^2 - 50^2} = \sqrt{37{,}500} \approx 193.6$ km/h.`,
            },
          ],
          recap: [
            'Add vectors tip-to-tail, or add their components.',
            'Perpendicular vectors combine by Pythagoras.',
            'Forces in balance add to the zero vector.',
          ],
        },
      ],
    },
    {
      title: 'Products and Matrices',
      summary: 'Scaling, dot products and transformations.',
      lessons: [
        {
          id: 'dot-product',
          title: 'The Dot Product',
          summary: 'Measuring angles with arithmetic',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Scaling first',
              body: r`Multiplying a vector by a number $k$ stretches it by $k$. A negative $k$ also flips it around.`,
              widget: {
                ...PLANE,
                params: { k: { min: -2, max: 2, step: 0.25, value: 1.5, label: '$k$', color: 'violet' } },
                extra: ({ plot, p, arrow }) => [vec(plot, arrow, 0, 0, 2 * p.k, 1 * p.k, 'violet', 5), vec(plot, arrow, 0, 0, 2, 1, 'blue', 3)],
                readout: (p) => r`$${f2(p.k)} \times \blue{(2, 1)} = \violet{(${f2(2 * p.k, 1)}, ${f2(p.k)})}$`,
              },
            },
            {
              type: 'explain',
              title: 'The dot product',
              body: r`The **dot product** of two vectors is a single number:
$$\vec a \cdot \vec b = a_x b_x + a_y b_y$$
Surprisingly, it equals
$$\vec a \cdot \vec b = |\vec a|\,|\vec b|\cos\theta$$
where $\theta$ is the angle between the vectors (this follows from the law of cosines). So the dot product measures how much two vectors **point the same way**.`,
              widget: {
                ...PLANE,
                params: { t: { min: 0, max: 360, step: 5, value: 60, slider: false } },
                points: [{ x: (p) => 3 * Math.cos((p.t * Math.PI) / 180), y: (p) => 3 * Math.sin((p.t * Math.PI) / 180), drag: { key: 't', fn: (x, y) => { let a = (Math.atan2(y, x) * 180) / Math.PI; if (a < 0) a += 360; return { t: a }; } }, color: 'coral', r: 7 }],
                extra: ({ plot, p, arrow }) => [vec(plot, arrow, 0, 0, 3, 0, 'blue'), vec(plot, arrow, 0, 0, 3 * Math.cos((p.t * Math.PI) / 180), 3 * Math.sin((p.t * Math.PI) / 180), 'coral')],
                readout: (p) => {
                  const c = Math.cos((p.t * Math.PI) / 180);
                  const ang = p.t > 180 ? 360 - p.t : p.t;
                  return r`angle $= ${Math.round(ang)}°$, $\quad \vec a \cdot \vec b = 3 \times 3 \times \cos(${Math.round(ang)}°) = ${f2(9 * c)}$`;
                },
              },
              after: r`Same direction: the largest positive value. Perpendicular: **zero**. Opposite directions: negative.`,
            },
            {
              type: 'numeric',
              title: 'Compute',
              prompt: r`What is $(3, 4) \cdot (2, -1)$?`,
              answer: 2,
              wrong: [{ v: 10, why: r`Multiply matching components: $3 \times 2 + 4 \times (-1)$.` }, { v: 14, why: r`Watch the sign: $4 \times (-1) = -4$.` }],
              explain: r`$3 \times 2 + 4 \times (-1) = 6 - 4 = 2$.`,
            },
            {
              type: 'mcq',
              title: 'Perpendicular?',
              prompt: r`Which vector is perpendicular to $(2, 3)$?`,
              cols: 2,
              choices: [
                { t: r`$(3, -2)$`, ok: true },
                { t: r`$(2, -3)$`, why: r`$(2, 3)\cdot(2, -3) = 4 - 9 = -5 \ne 0$.` },
                { t: r`$(-2, -3)$`, why: 'That points exactly opposite, at 180°.' },
                { t: r`$(3, 2)$`, why: r`$(2,3)\cdot(3,2) = 12$, which is positive: less than 90° apart.` },
              ],
              explain: r`$(2, 3)\cdot(3, -2) = 6 - 6 = 0$, and a zero dot product means perpendicular. Trick: swap the components and negate one.`,
            },
            {
              type: 'numeric',
              title: 'Find the angle',
              prompt: r`What is the angle between $(1, 0)$ and $(1, 1)$?`,
              unit: '°',
              answer: 45,
              wrong: [{ v: 90, why: r`The dot product is 1, not 0, so they aren't perpendicular.` }],
              explain: r`$\cos\theta = \frac{\vec a \cdot \vec b}{|\vec a||\vec b|} = \frac{1}{1 \times \sqrt2} = \frac{1}{\sqrt2}$, so $\theta = 45°$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Work as a dot product',
              body: r`In physics, work is the dot product of force and displacement: $W = \vec F \cdot \vec d$.`,
              prompt: r`A force $\vec F = (10, 5)$ N moves a box through $\vec d = (3, -2)$ m. How much work is done?`,
              unit: 'J',
              answer: 20,
              wrong: [{ v: 40, why: r`$10 \times 3 + 5 \times (-2) = 30 - 10$.` }],
              explain: r`$W = 10 \times 3 + 5 \times (-2) = 30 - 10 = 20$ J. Only the part of the force along the motion does work, and the dot product picks out exactly that part.`,
            },
          ],
          recap: [
            r`$\vec a \cdot \vec b = a_xb_x + a_yb_y = |\vec a||\vec b|\cos\theta$.`,
            'A zero dot product means the vectors are perpendicular.',
            r`Angle between vectors: $\cos\theta = \frac{\vec a\cdot\vec b}{|\vec a||\vec b|}$.`,
          ],
        },
        {
          id: 'matrices',
          title: 'Matrices as Machines',
          summary: 'Transforming the whole plane',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Where do the arrows go?',
              body: r`A $2 \times 2$ **matrix** transforms every vector in the plane. Its columns tell you where the two basic arrows land: $\blue{\hat\imath} = (1, 0)$ and $\coral{\hat\jmath} = (0, 1)$. The unit square goes along for the ride. Try the sliders.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.5, xmax: 3.5, ymin: -3, ymax: 3, grid: 1, axes: false, maxWidth: 520,
                params: {
                  a: { min: -2, max: 2, step: 0.5, value: 1, label: '$a$', color: 'blue' }, c: { min: -2, max: 2, step: 0.5, value: 0, label: '$c$', color: 'blue' },
                  b: { min: -2, max: 2, step: 0.5, value: 0.5, label: '$b$', color: 'coral' }, d: { min: -2, max: 2, step: 0.5, value: 1, label: '$d$', color: 'coral' },
                },
                extra: ({ plot, p, s, arrow }) => {
                  const T = (x, y) => [p.a * x + p.b * y, p.c * x + p.d * y];
                  const sq = [T(0, 0), T(1, 0), T(1, 1), T(0, 1)];
                  const els = [];
                  for (let k = -4; k <= 4; k++) {
                    const A1 = T(k, -4), A2 = T(k, 4), B1 = T(-4, k), B2 = T(4, k);
                    els.push(s('line', { x1: plot.X(A1[0]), y1: plot.Y(A1[1]), x2: plot.X(A2[0]), y2: plot.Y(A2[1]), stroke: 'var(--violet)', 'stroke-width': 1, opacity: 0.35 }));
                    els.push(s('line', { x1: plot.X(B1[0]), y1: plot.Y(B1[1]), x2: plot.X(B2[0]), y2: plot.Y(B2[1]), stroke: 'var(--violet)', 'stroke-width': 1, opacity: 0.35 }));
                  }
                  els.push(s('path', { d: sq.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-amber', opacity: 0.35, stroke: 'var(--amber)', 'stroke-width': 2 }));
                  els.push(vec(plot, arrow, 0, 0, p.a, p.c, 'blue'), vec(plot, arrow, 0, 0, p.b, p.d, 'coral'));
                  return els;
                },
                readout: (p) => r`$\begin{pmatrix} \blue{${f2(p.a, 1)}} & \coral{${f2(p.b, 1)}} \\ \blue{${f2(p.c, 1)}} & \coral{${f2(p.d, 1)}} \end{pmatrix}$, $\quad$ area of square $= ${f2(Math.abs(p.a * p.d - p.b * p.c))}$`,
              },
              after: 'Grid lines stay straight, parallel and evenly spaced: that is what makes a transformation linear.',
            },
            {
              type: 'explain',
              title: 'Multiplying a vector',
              body: r`To transform a vector, combine the columns:
$$\begin{pmatrix} a & b \\ c & d \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = x\begin{pmatrix} a \\ c \end{pmatrix} + y\begin{pmatrix} b \\ d \end{pmatrix} = \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}$$
"$x$ steps along where $\hat\imath$ went, plus $y$ steps along where $\hat\jmath$ went."`,
            },
            {
              type: 'numeric',
              title: 'Transform a vector',
              prompt: r`What is $\begin{pmatrix} 2 & 1 \\ 0 & 3 \end{pmatrix}\begin{pmatrix} 1 \\ 2 \end{pmatrix}$? Enter the top entry.`,
              answer: 4,
              wrong: [{ v: 2, why: r`Top entry: $2 \times 1 + 1 \times 2$.` }, { v: 6, why: r`That's the bottom entry, $0 \times 1 + 3 \times 2$.` }],
              explain: r`$\begin{pmatrix} 2(1) + 1(2) \\ 0(1) + 3(2) \end{pmatrix} = \begin{pmatrix} 4 \\ 6 \end{pmatrix}$.`,
            },
            {
              type: 'mcq',
              title: 'Rotation',
              prompt: r`Which matrix rotates every vector 90° counterclockwise?`,
              cols: 2,
              choices: [
                { t: r`$\begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$`, ok: true },
                { t: r`$\begin{pmatrix} 0 & 1 \\ -1 & 0 \end{pmatrix}$`, why: r`This sends $\hat\imath = (1,0)$ to $(0, -1)$, pointing down. That's clockwise.` },
                { t: r`$\begin{pmatrix} -1 & 0 \\ 0 & -1 \end{pmatrix}$`, why: 'That turns everything around by 180°.' },
                { t: r`$\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$`, why: 'That swaps x and y: a reflection in the line y = x, not a rotation.' },
              ],
              explain: r`Rotating 90° counterclockwise sends $\hat\imath = (1, 0)$ to $(0, 1)$ (first column) and $\hat\jmath = (0, 1)$ to $(-1, 0)$ (second column).`,
            },
            {
              type: 'explain',
              title: 'The determinant',
              body: r`The **determinant** measures how much a transformation scales area:
$$\det\begin{pmatrix} a & b \\ c & d \end{pmatrix} = ad - bc$$
A determinant of 3 makes every shape 3 times bigger. A determinant of 0 squashes the plane flat onto a line. A negative determinant also flips the plane over, like a mirror.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Area scale',
              prompt: r`A shape of area 5 is transformed by $\begin{pmatrix} 3 & 1 \\ 2 & 4 \end{pmatrix}$. What is its new area?`,
              answer: 50,
              wrong: [
                { v: 10, why: r`$\det = 3 \times 4 - 1 \times 2 = 10$. That's the scale factor. Multiply by the original area, 5.` },
                { v: 70, why: r`$\det = ad - bc = 12 - 2 = 10$, not $12 + 2$.` },
              ],
              explain: r`$\det = 3 \cdot 4 - 1 \cdot 2 = 10$, so every area is multiplied by 10: $5 \times 10 = 50$.`,
            },
          ],
          recap: [
            'A matrix’s columns show where the basis vectors land. Grid lines stay straight and parallel.',
            r`$\begin{pmatrix} a & b \\ c & d \end{pmatrix}\begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} ax+by \\ cx+dy \end{pmatrix}$.`,
            r`The determinant $ad - bc$ is the area scale factor. If it's 0, the plane is squashed flat.`,
          ],
        },
      ],
    },
    {
      title: 'More Vector Tools',
      summary: 'Cross products and lines.',
      lessons: [
        {
          id: 'cross',
          title: 'Cross Product & Torque',
          summary: 'Areas, perpendiculars and turning forces',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Area from two vectors',
              body: r`Two vectors $\mathbf a$ and $\mathbf b$ span a parallelogram. Its base is $|\mathbf a|$ and its height is $|\mathbf b|\sin\theta$, so
$$\text{area} = |\mathbf a||\mathbf b|\sin\theta = |a_x b_y - a_y b_x|$$
The second form is the **determinant** of the matrix with columns $\mathbf a$ and $\mathbf b$, the same area scale factor you met with matrices.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the area',
              prompt: r`$\mathbf a$ has length 3 along the x-axis and $\mathbf b$ has length 4. Turn $\mathbf b$ until the parallelogram's area is exactly **6**.`,
              widget: {
                ...PLANE, xmin: -5, xmax: 6, ymin: -1, ymax: 5, axes: false,
                params: { th: { min: 0, max: 180, step: 1, value: 90, label: r`angle $\theta$`, color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s, arrow }) => {
                  const bx = 4 * Math.cos(p.th * D2R), by = 4 * Math.sin(p.th * D2R);
                  return [
                    s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(3)} ${plot.Y(0)} L${plot.X(3 + bx)} ${plot.Y(by)} L${plot.X(bx)} ${plot.Y(by)} Z`, class: 'fl-amber', opacity: 0.35 }),
                    vec(plot, arrow, 0, 0, 3, 0, 'blue'),
                    vec(plot, arrow, 0, 0, bx, by, 'coral'),
                    s('line', { x1: plot.X(bx), y1: plot.Y(by), x2: plot.X(bx), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                  ];
                },
                readout: (p) => r`area $= 3 \times 4 \times \sin ${p.th}° = ${(12 * Math.sin(p.th * D2R)).toFixed(2)}$`,
                goal: (p) => Math.abs(12 * Math.sin(p.th * D2R) - 6) < 0.02,
                hint: r`You need $\sin\theta = \frac{6}{12}$.`,
                solution: { th: 30 },
              },
              explain: r`$\sin\theta = \frac12$, so $\theta = 30°$ (or $150°$, which gives the same area). The area is largest, 12, when the vectors are perpendicular, and zero when they're parallel.`,
            },
            {
              type: 'numeric',
              title: 'From components',
              prompt: r`What is the area of the parallelogram spanned by $(3, 1)$ and $(1, 2)$?`,
              answer: 5,
              wrong: [{ v: 7, why: r`It's $a_x b_y - a_y b_x = 3 \times 2 - 1 \times 1$.` }, { v: 2.5, why: 'That’s the triangle (half the parallelogram).' }],
              explain: r`$3 \times 2 - 1 \times 1 = 5$. Half of it, 2.5, is the area of the triangle with these two sides: a quick way to find any triangle's area from coordinates.`,
            },
            {
              type: 'explain',
              title: 'In three dimensions',
              body: r`In 3D, the **cross product** $\mathbf a \times \mathbf b$ is a **vector**: its length is the parallelogram's area, and it points **perpendicular** to both $\mathbf a$ and $\mathbf b$, following the **right-hand rule** (curl your fingers from $\mathbf a$ to $\mathbf b$; your thumb points along $\mathbf a \times \mathbf b$). In components,
$$\mathbf a \times \mathbf b = (a_y b_z - a_z b_y,\ a_z b_x - a_x b_z,\ a_x b_y - a_y b_x)$$
Unlike ordinary multiplication, the order matters: $\mathbf b \times \mathbf a = -\,\mathbf a \times \mathbf b$.`,
            },
            {
              type: 'numeric',
              title: 'Unit vectors',
              prompt: r`Compute $(2, 0, 0) \times (0, 3, 0)$. What is its $z$-component?`,
              answer: 6,
              wrong: [{ v: -6, why: r`$a_x b_y - a_y b_x = 2 \times 3 - 0 = +6$: the right-hand rule points up.` }, { v: 0, why: 'The result points along z, perpendicular to both.' }],
              explain: r`$(0, 0, 6)$: length 6 (the rectangle's area), pointing straight up the z-axis, perpendicular to both inputs.`,
            },
            {
              type: 'explain',
              title: 'Torque',
              body: r`A force $\mathbf F$ applied at position $\mathbf r$ from a pivot produces a **torque** (turning effect)
$$\boldsymbol\tau = \mathbf r \times \mathbf F, \qquad |\boldsymbol\tau| = rF\sin\theta$$
Only the part of the force perpendicular to the lever arm turns anything. That's why you push a door at its edge, at right angles.`,
            },
            {
              type: 'numeric',
              title: 'A spanner',
              prompt: r`You push with 50 N at the end of a 0.3 m spanner, at 30° to the handle. What's the torque, in N·m?`,
              unit: 'N·m',
              answer: 7.5,
              wrong: [{ v: 15, why: 'That’s pushing at 90°. At 30° only sin 30° = ½ of the force turns the bolt.' }, { v: 13, tol: 0.05, why: 'Use sine, not cosine: the perpendicular component turns.' }],
              explain: r`$0.3 \times 50 \times \sin 30° = 7.5$ N·m, half of what a perpendicular push gives.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The door handle',
              prompt: r`Why are door handles placed far from the hinges?`,
              choices: [
                { t: 'A larger lever arm r gives more torque for the same force, so the door is easier to open', ok: true },
                { t: 'To keep fingers away from the hinge', why: 'Safety is a bonus, but the physics reason is torque.' },
                { t: 'It makes the door lighter', why: 'The door weighs the same; less force is needed to turn it.' },
              ],
              explain: r`$\tau = rF$ for a perpendicular push: twice the distance needs half the force. Try pushing a door open near its hinges: it feels surprisingly heavy.`,
            },
          ],
          recap: [
            r`Parallelogram area $= |\mathbf a||\mathbf b|\sin\theta = |a_xb_y - a_yb_x|$.`,
            'The 3D cross product is perpendicular to both vectors (right-hand rule).',
            r`Torque $\boldsymbol\tau = \mathbf r \times \mathbf F$, of size $rF\sin\theta$.`,
          ],
        },
        {
          id: 'lines',
          title: 'Lines & Closest Approach',
          summary: 'Moving points as vectors',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'A line as a journey',
              body: r`Start at a point $\mathbf a$ and travel in direction $\mathbf d$. After "time" $t$, you're at
$$\mathbf r(t) = \mathbf a + t\,\mathbf d$$
As $t$ runs over all real numbers, $\mathbf r(t)$ traces out a straight line. This **vector equation of a line** works equally well in 2D and 3D, and if $\mathbf d$ is a velocity, it describes motion.`,
            },
            {
              type: 'numeric',
              title: 'Where after 2 hours?',
              prompt: r`A boat starts at $(1, 2)$ km and moves with velocity $(3, -1)$ km/h. What is its $x$-coordinate after 2 hours?`,
              unit: 'km',
              answer: 7,
              wrong: [{ v: 6, why: 'Add the starting position: 1 + 2 × 3.' }, { v: 5, why: r`$x = 1 + 2 \times 3$.` }],
              explain: r`$\mathbf r(2) = (1, 2) + 2(3, -1) = (7, 0)$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Closest approach',
              prompt: r`Ship A (blue) leaves $(0, 0)$ with velocity $(3, 1)$ km/h; ship B (coral) leaves $(10, 0)$ with velocity $(-1, 2)$ km/h. Move time forward to find when they're **closest**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 12, ymin: -1, ymax: 8, grid: 1, axes: false, maxWidth: 520,
                params: { t: { min: 0, max: 4, step: 0.01, value: 0.5, label: 'time', color: 'violet', format: (v) => `${v.toFixed(2)} h` } },
                extra: ({ plot, p, s }) => {
                  const A = shipA(p.t), B = shipB(p.t);
                  return [
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(12), y2: plot.Y(4), stroke: 'var(--blue)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('line', { x1: plot.X(10), y1: plot.Y(0), x2: plot.X(6), y2: plot.Y(8), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('line', { x1: plot.X(A[0]), y1: plot.Y(A[1]), x2: plot.X(B[0]), y2: plot.Y(B[1]), stroke: 'var(--violet)', 'stroke-width': 2.5 }),
                    s('circle', { cx: plot.X(A[0]), cy: plot.Y(A[1]), r: 8, class: 'fl-blue' }),
                    s('circle', { cx: plot.X(B[0]), cy: plot.Y(B[1]), r: 8, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => r`$t = ${p.t.toFixed(2)}$ h: distance $${shipDist(p.t).toFixed(3)}$ km`,
                goal: (p) => Math.abs(p.t - T_MIN) < 0.03,
                hint: 'Watch the distance in the readout: it falls, reaches a minimum, then rises.',
                solution: { t: 2.35 },
              },
              explain: r`The separation is $\mathbf B - \mathbf A = (10 - 4t,\ t)$, with squared length $(10 - 4t)^2 + t^2$. Its minimum is at $t = \frac{80}{34} \approx 2.35$ h, where they pass about 2.4 km apart. Ships' radar systems calculate this "closest point of approach" continuously to avoid collisions.`,
            },
            {
              type: 'numeric',
              title: 'How close?',
              prompt: r`At the closest approach, the separation is $(10 - 4t, t)$ with $t = \frac{40}{17}$. How far apart are the ships? (2 decimal places.)`,
              unit: 'km',
              answer: shipDist(T_MIN),
              tol: 0.01,
              wrong: [{ v: 10, why: 'That’s the distance at the start.' }],
              explain: r`$(10 - 4t, t) \approx (0.59, 2.35)$, so the distance is $\sqrt{0.59^2 + 2.35^2} \approx 2.43$ km. At closest approach, the separation vector is perpendicular to the relative velocity $(-4, 1)$: check that $(0.59)(-4) + (2.35)(1) \approx 0$.`,
            },
            {
              type: 'mcq',
              title: 'The same line?',
              prompt: r`Are $\mathbf r = (1, 2) + t(2, 4)$ and $\mathbf r = s(1, 2)$ different lines?`,
              choices: [
                { t: 'No: they’re the same line, since the directions are parallel and (1, 2) lies on both', ok: true },
                { t: 'Yes: they have different starting points', why: 'Different starting points can lie on the same line.' },
                { t: 'They cross at exactly one point', why: 'Parallel directions mean they either never meet or coincide entirely.' },
              ],
              explain: r`$(2, 4) = 2(1, 2)$, so the directions are parallel, and $(1, 2)$ is on the second line (at $s = 1$). Same line, described two ways: vector equations aren't unique.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Where do they cross?',
              prompt: r`Line 1: $(0, 0) + t(1, 1)$. Line 2: $(4, 0) + s(-1, 2)$. Find the $x$-coordinate of their intersection. (2 decimal places.)`,
              answer: 8 / 3,
              tol: 0.01,
              wrong: [{ v: 2, why: r`Solve $t = 4 - s$ and $t = 2s$ together.` }],
              hint: r`Set the components equal: $t = 4 - s$ and $t = 2s$.`,
              explain: r`$2s = 4 - s$ gives $s = \frac43$, so $t = \frac83$ and the point is $\left(\frac83, \frac83\right) \approx (2.67, 2.67)$. Note that the lines crossing doesn't mean the **ships** meet: they'd have to reach the crossing at the same time.`,
            },
          ],
          recap: [
            r`Vector line: $\mathbf r(t) = \mathbf a + t\mathbf d$.`,
            'Closest approach: minimise the length of the separation vector.',
            'Intersections: set components equal and solve for both parameters.',
          ],
        },
        {
          id: 'combinations',
          title: 'Combining Vectors',
          summary: 'Reaching any point with two arrows',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Stretch and add',
              body: r`Given two vectors $\mathbf u$ and $\mathbf v$, a **linear combination** is $a\mathbf u + b\mathbf v$: stretch each by a number, then add. If $\mathbf u$ and $\mathbf v$ point in different directions, you can reach **every** point of the plane this way, and in exactly one way. They then form a **basis**, and $(a, b)$ are the coordinates of the point in that basis.`,
            },
            {
              type: 'numeric',
              title: 'Compute one',
              prompt: r`What is the $x$-component of $3\begin{pmatrix}1\\2\end{pmatrix} + 2\begin{pmatrix}4\\-1\end{pmatrix}$?`,
              answer: 11,
              explain: r`$3 \times 1 + 2 \times 4 = 11$ (and the $y$-component is $6 - 2 = 4$), giving $\begin{pmatrix}11\\4\end{pmatrix}$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Hit the target',
              prompt: r`With $\mathbf u = (2, 1)$ (coral) and $\mathbf v = (-1, 1.5)$ (blue), choose $a$ and $b$ so that $a\mathbf u + b\mathbf v$ lands on the target $(3, 5.5)$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 7, ymin: -2, ymax: 7, grid: 1, maxWidth: 420, axes: { xticks: 1, yticks: 1 },
                params: { a: { min: -3, max: 4, step: 0.5, value: 1, label: 'a', color: 'coral', format: (v) => v.toFixed(1) }, b: { min: -3, max: 4, step: 0.5, value: 1, label: 'b', color: 'blue', format: (v) => v.toFixed(1) } },
                points: [{ x: () => 3, y: () => 5.5, color: 'amber' }],
                extra: ({ plot, p, s, arrow }) => { const A = [2 * p.a, p.a], B = [A[0] - p.b, A[1] + 1.5 * p.b]; return [arrow(plot.X(0), plot.Y(0), plot.X(A[0]), plot.Y(A[1]), { color: 'var(--coral)', width: 3 }), arrow(plot.X(A[0]), plot.Y(A[1]), plot.X(B[0]), plot.Y(B[1]), { color: 'var(--blue)', width: 3 }), arrow(plot.X(0), plot.Y(0), plot.X(B[0]), plot.Y(B[1]), { color: 'var(--violet)', width: 2 })]; },
                readout: (p) => `a·u + b·v = (**${(2 * p.a - p.b).toFixed(1)}**, **${(p.a + 1.5 * p.b).toFixed(1)}**) · target (3, 5.5)`,
                goal: (p) => p.a === 2.5 && p.b === 2,
                hint: r`Solve $2a - b = 3$ and $a + 1.5b = 5.5$.`,
                solution: { a: 2.5, b: 2 },
              },
              explain: r`From $2a - b = 3$, $b = 2a - 3$; substituting, $a + 3a - 4.5 = 5.5$ gives $a = 2.5$, $b = 2$. In the "language" of $\mathbf u$ and $\mathbf v$, the target has coordinates $(2.5, 2)$.`,
            },
            {
              type: 'mcq',
              title: 'When it fails',
              prompt: r`For which pair of vectors can you **not** reach every point of the plane?`,
              choices: [
                { t: '(1, 2) and (−2, −4)', ok: true },
                { t: '(1, 0) and (0, 1)', why: 'These are the standard axes: every point (x, y) is x(1, 0) + y(0, 1).' },
                { t: '(1, 1) and (1, −1)', why: 'These point in different directions, so they reach everything.' },
              ],
              explain: r`$(-2, -4) = -2 \times (1, 2)$: both lie along the same line, so every combination stays on that line. Two vectors form a basis exactly when they are not parallel, which is when the determinant $u_1v_2 - u_2v_1$ is not zero.`,
            },
            {
              type: 'numeric',
              title: 'Make them parallel',
              prompt: r`For which value of $k$ are $(2, k)$ and $(3, 6)$ parallel?`,
              answer: 4,
              explain: r`$(3, 6)$ has $y = 2x$, so $(2, k)$ needs $k = 4$. Check the determinant: $2 \times 6 - 4 \times 3 = 0$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'New coordinates',
              prompt: r`Write $(7, 4)$ as $a(1, 1) + b(2, -1)$. What is $a$?`,
              answer: 5,
              wrong: [{ v: 1, why: 'That’s b. Use a + 2b = 7 and a − b = 4.' }],
              explain: r`$a + 2b = 7$ and $a - b = 4$; subtracting gives $3b = 3$, so $b = 1$ and $a = 5$. Check: $5(1,1) + (2,-1) = (7, 4)$.`,
            },
          ],
          recap: [
            'A linear combination a·u + b·v stretches and adds vectors.',
            'Two non-parallel vectors reach every point of the plane, uniquely: a basis.',
            'Parallel vectors (zero determinant) only reach a line.',
          ],
        },
      ],
    },
  ],
};
