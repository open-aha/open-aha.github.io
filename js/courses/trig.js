import { wedge, poly, seg, label, rightMark, angleAt } from './_geo.js';
import { fix } from '../lib/svg.js';

const r = String.raw;
const D = Math.PI / 180;
// live readouts keep a fixed 3 decimals, so they never change length (DESIGN.md, Live numbers)
const f3 = (v) => fix(v, 3);
const ang360 = (x, y) => {
  let a = Math.atan2(y, x) / D;
  if (a < 0) a += 360;
  return a;
};

// law of sines explorer: A = (0,0), B = (6,0), C dragged
const triABC = (p) => {
  const A = [0, 0], B = [6, 0], C = [p.cx, p.cy];
  const a = Math.hypot(C[0] - 6, C[1]), b = Math.hypot(C[0], C[1]), c = 6;
  return { A, B, C, a, b, c, aA: angleAt(B, A, C), aB: angleAt(A, B, C), aC: angleAt(A, C, B) };
};
// ambiguous case: angle A = 30°, AC = 8, B on the x-axis
const AMB_C = [8 * Math.cos(30 * D), 8 * Math.sin(30 * D)];
const ambA = (x) => Math.hypot(x - AMB_C[0], AMB_C[1]);
// bearings: east and north components
const bearEnd = (p) => [p.d * Math.sin(p.b * D), p.d * Math.cos(p.b * D)];

// unit circle + optional unwrapped sine wave
function unitCircle({ wave = false, value = 40, step = 5, goal, solution, hint, readout } = {}) {
  return {
    kind: 'graph', equal: true, xmin: -1.35, xmax: wave ? 8.1 : 1.35, ymin: -1.3, ymax: 1.3, grid: wave ? false : 0.5, axes: false, pad: 16, maxWidth: wave ? null : 440,
    params: { t: { min: 0, max: 360, step, value, slider: false } },
    points: [{ x: (p) => Math.cos(p.t * D), y: (p) => Math.sin(p.t * D), drag: { key: 't', fn: (x, y) => ({ t: ang360(x, y) }) }, color: 'blue', ariaLabel: 'Angle' }],
    extra: ({ plot, p, s }) => {
      const c = Math.cos(p.t * D), sn = Math.sin(p.t * D);
      const els = [
        seg(plot, s, [-1.25, 0], [1.25, 0], { stroke: 'var(--axis)', 'stroke-width': 1.5 }),
        seg(plot, s, [0, -1.25], [0, 1.25], { stroke: 'var(--axis)', 'stroke-width': 1.5 }),
        s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
      ];
      // angle arc
      const rr = 0.28 * (plot.X(1) - plot.X(0));
      const large = p.t > 180 ? 1 : 0;
      if (p.t > 0.5) els.push(s('path', { d: `M${plot.X(0) + rr} ${plot.Y(0)} A${rr} ${rr} 0 ${large} 0 ${plot.X(0) + rr * c} ${plot.Y(0) - rr * sn}`, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }));
      els.push(
        seg(plot, s, [0, 0], [c, 0], { stroke: 'var(--teal)', 'stroke-width': 4 }),
        seg(plot, s, [c, 0], [c, sn], { stroke: 'var(--coral)', 'stroke-width': 4 }),
        seg(plot, s, [0, 0], [c, sn], { stroke: 'var(--blue)', 'stroke-width': 3 }),
        label(plot, s, [c / 2, 0], 'cos', 0, sn >= 0 ? 18 : -8, { class: 'lbl fl-teal', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
        label(plot, s, [c, sn / 2], 'sin', c >= 0 ? 22 : -22, 4, { class: 'lbl fl-coral', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
        // the angle sits on the arc's bisector, so it never collides with the cos and sin labels
        s('text', { x: plot.X(0) + (rr + 20) * Math.cos((p.t * Math.PI) / 360), y: plot.Y(0) - (rr + 20) * Math.sin((p.t * Math.PI) / 360) + 5, 'text-anchor': 'middle', class: 'lbl fl-violet halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: `${Math.round(p.t)}°` }),
      );
      if (wave) {
        const x0 = 1.65, k = 1; // x = x0 + angle(rad)
        const pts = [];
        for (let i = 0; i <= 120; i++) { const a = (2 * Math.PI * i) / 120; pts.push(`${i ? 'L' : 'M'}${plot.X(x0 + a * k)} ${plot.Y(Math.sin(a))}`); }
        els.push(seg(plot, s, [x0, 0], [x0 + 2 * Math.PI, 0], { stroke: 'var(--axis)', 'stroke-width': 1.5 }));
        els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5, opacity: 0.35 }));
        const tr = [];
        for (let i = 0; i <= 120 && (2 * Math.PI * i) / 120 <= p.t * D + 1e-9; i++) { const a = (2 * Math.PI * i) / 120; tr.push(`${i ? 'L' : 'M'}${plot.X(x0 + a)} ${plot.Y(Math.sin(a))}`); }
        if (tr.length > 1) els.push(s('path', { d: tr.join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 }));
        const wx = x0 + p.t * D;
        els.push(seg(plot, s, [c, sn], [wx, sn], { stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }));
        els.push(s('circle', { cx: plot.X(wx), cy: plot.Y(sn), r: 7, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2.5 }));
        [90, 180, 270, 360].forEach((d) => els.push(label(plot, s, [x0 + d * D, 0], `${d}°`, 0, 18, { class: 'tick' })));
      }
      return els;
    },
    readout: readout || ((p) => r`$\cos ${Math.round(p.t)}° = ${f3(Math.cos(p.t * D))}, \quad \sin ${Math.round(p.t)}° = ${f3(Math.sin(p.t * D))}$`),
    goal, solution, hint,
  };
}

export default {
  id: 'trig',
  subject: 'math',
  title: 'Trigonometry',
  level: 'Intermediate',
  cover: 'trig',
  tagline: 'Triangles, the unit circle, waves, surveying and navigation: the mathematics of angles.',
  description: r`Discover why the side ratios of right triangles depend only on the angle. Then extend sine and cosine around the whole circle, measure angles in radians, and unroll the circle into the sine waves found everywhere in nature. Finally, solve any triangle with the laws of sines and cosines, and use them to measure heights, areas and bearings.`,
  prereq: 'Geometry: Visual Proofs',
  chapters: [
    {
      title: 'Right Triangles',
      summary: 'Sine, cosine and tangent.',
      lessons: [
        {
          id: 'soh-cah-toa',
          title: 'Ratios of Sides',
          summary: 'Sine, cosine, tangent',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Big and small',
              body: r`Two right triangles both have a 30° angle. One is twice as large as the other.`,
              prompt: r`How do the ratios $\dfrac{\text{side opposite the 30° angle}}{\text{hypotenuse}}$ compare?`,
              choices: [
                { t: 'They are equal', ok: true },
                { t: 'The bigger triangle has a bigger ratio', why: 'Both sides double, so their ratio doesn’t change.' },
                { t: 'The bigger triangle has a smaller ratio', why: 'Scaling multiplies every side by the same number, so ratios stay the same.' },
              ],
              explain: r`The triangles are **similar** (same angles), so all their sides scale by the same factor. Ratios of sides don't change. They depend **only on the angle**. That's the key idea of trigonometry.`,
            },
            {
              type: 'explain',
              title: 'Ratios depend only on the angle',
              body: r`Change the angle $\theta$ and the size. The size changes the side lengths, but not their ratios.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.4, xmax: 8.4, ymin: -0.5, ymax: 5.4, grid: 1, axes: false,
                params: {
                  th: { min: 10, max: 70, step: 1, value: 35, label: r`$\theta$`, color: 'violet', format: (v) => `${v}°` },
                  L: { min: 2, max: 7.5, step: 0.1, value: 6, label: 'size', color: 'ink', format: (v) => v.toFixed(1) },
                },
                extra: ({ plot, p, s }) => {
                  const a = p.th * D, A = [0, 0], B = [p.L * Math.cos(a), 0], C = [p.L * Math.cos(a), p.L * Math.sin(a)];
                  return [
                    poly(plot, s, [A, B, C], { class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 2 }),
                    seg(plot, s, A, B, { stroke: 'var(--teal)', 'stroke-width': 5 }),
                    seg(plot, s, B, C, { stroke: 'var(--coral)', 'stroke-width': 5 }),
                    seg(plot, s, A, C, { stroke: 'var(--blue)', 'stroke-width': 5 }),
                    wedge(plot, s, B, A, C, 34, 'fl-violet', 0.4),
                    rightMark(plot, s, A, B, C),
                    label(plot, s, [B[0] / 2, 0], 'adjacent', 0, 22, { class: 'lbl fl-teal', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
                    label(plot, s, [B[0], C[1] / 2], 'opposite', 40, 4, { class: 'lbl fl-coral', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
                    label(plot, s, [C[0] / 2, C[1] / 2], 'hypotenuse', -44, -8, { class: 'lbl fl-blue', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
                  ];
                },
                readout: (p) => r`$\dfrac{\coral{\text{opp}}}{\blue{\text{hyp}}} = ${f3(Math.sin(p.th * D))} \quad \dfrac{\teal{\text{adj}}}{\blue{\text{hyp}}} = ${f3(Math.cos(p.th * D))} \quad \dfrac{\coral{\text{opp}}}{\teal{\text{adj}}} = ${f3(Math.tan(p.th * D))}$`,
              },
            },
            {
              type: 'explain',
              title: 'SOH CAH TOA',
              body: r`These three ratios get names:
$$\sin\theta = \frac{\coral{\text{opposite}}}{\blue{\text{hypotenuse}}}, \quad \cos\theta = \frac{\teal{\text{adjacent}}}{\blue{\text{hypotenuse}}}, \quad \tan\theta = \frac{\coral{\text{opposite}}}{\teal{\text{adjacent}}}$$

Many people remember them as **SOH CAH TOA**: **S**ine is **O**pposite over **H**ypotenuse, and so on. Your calculator knows the value of each ratio for every angle.`,
            },
            {
              type: 'numeric',
              title: 'Find a side',
              prompt: r`A right triangle has a hypotenuse of 10 and an angle of 30°. How long is the side opposite the 30° angle? ($\sin 30° = 0.5$)`,
              answer: 5,
              wrong: [
                { v: 20, why: r`$\sin\theta = \text{opp}/\text{hyp}$, so $\text{opp} = \text{hyp} \times \sin\theta$. Multiply, don't divide.` },
                { v: 8.66, tol: 0.01, why: r`That's the adjacent side, $10\cos 30°$. The opposite side uses $\sin$.` },
              ],
              explain: r`$\text{opp} = \text{hyp} \times \sin 30° = 10 \times 0.5 = 5$.`,
            },
            {
              type: 'numeric',
              title: 'Wheelchair ramp',
              prompt: r`A ramp is 4 m long and rises at an angle of 5° to the ground. How high does it rise? ($\sin 5° \approx 0.0872$)`,
              unit: 'm',
              answer: 4 * Math.sin(5 * D),
              tol: 0.005,
              wrong: [{ v: 4 * Math.cos(5 * D), tol: 0.005, why: r`That's the horizontal distance it covers. The rise is opposite the angle, so use $\sin$.` }],
              explain: r`The ramp is the hypotenuse and the rise is opposite the 5° angle: $4 \times \sin 5° \approx 4 \times 0.0872 \approx 0.35$ m.`,
            },
            {
              type: 'numeric',
              title: 'How tall is the tree?',
              body: r`You stand 20 m from the base of a tree. Looking up at the top, your line of sight makes a 35° angle with the ground. (Ignore your own height.)`,
              prompt: r`How tall is the tree? ($\tan 35° \approx 0.700$)`,
              unit: 'm',
              answer: 20 * Math.tan(35 * D),
              tol: 0.05,
              wrong: [
                { v: 20 * Math.sin(35 * D), tol: 0.05, why: r`The 20 m is the **adjacent** side, not the hypotenuse. Opposite and adjacent means $\tan$.` },
                { v: 20 / Math.tan(35 * D), tol: 0.05, why: r`$\tan\theta = \text{opp}/\text{adj}$, so $\text{opp} = \text{adj} \times \tan\theta$.` },
              ],
              explain: r`$\text{height} = 20 \times \tan 35° \approx 20 \times 0.700 = 14.0$ m. Surveyors measure heights this way without ever climbing anything.`,
            },
            {
              type: 'explain',
              title: 'Working backwards',
              body: r`If you know two sides, the **inverse** functions give you the angle:
$$\theta = \sin^{-1}\!\left(\frac{\text{opp}}{\text{hyp}}\right), \quad \theta = \cos^{-1}\!\left(\frac{\text{adj}}{\text{hyp}}\right), \quad \theta = \tan^{-1}\!\left(\frac{\text{opp}}{\text{adj}}\right)$$
These are also written arcsin, arccos and arctan.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Roof pitch',
              prompt: r`A roof rises 3 m over a horizontal distance of 4 m. What angle does it make with the horizontal? ($\tan^{-1} 0.75 \approx 36.87°$)`,
              unit: '°',
              answer: Math.atan(0.75) / D,
              tol: 0.1,
              wrong: [{ v: Math.atan(4 / 3) / D, tol: 0.1, why: r`That's the angle at the top. Measured from the horizontal, the opposite side is the 3 m rise: $\tan\theta = 3/4$.` }],
              explain: r`$\tan\theta = \frac{3}{4} = 0.75$, so $\theta = \tan^{-1}(0.75) \approx 36.9°$. (This is a 3-4-5 triangle, so the slanted roof is 5 m long.)`,
            },
          ],
          recap: [
            'In a right triangle, ratios of sides depend only on the angle.',
            r`$\sin = \text{opp}/\text{hyp}$, $\cos = \text{adj}/\text{hyp}$, $\tan = \text{opp}/\text{adj}$.`,
            r`Inverse functions ($\sin^{-1}$ and so on) turn a ratio back into an angle.`,
          ],
        },
        {
          id: 'special-angles',
          title: 'Special Angles',
          summary: 'Exact values from squares and triangles',
          icon: 'sparkle',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Half a square',
              body: r`Cut a 1 × 1 square along its diagonal. You get a right triangle with two 45° angles.`,
              prompt: 'How long is the diagonal (the hypotenuse)? Give a decimal.',
              answer: Math.SQRT2,
              tol: 0.01,
              wrong: [{ v: 2, why: r`Use Pythagoras: $\sqrt{1^2 + 1^2}$, not $1 + 1$.` }],
              explain: r`$\sqrt{1^2 + 1^2} = \sqrt2 \approx 1.414$. So $\sin 45° = \cos 45° = \frac{1}{\sqrt2} = \frac{\sqrt2}{2} \approx 0.707$, and $\tan 45° = 1$.`,
            },
            {
              type: 'explain',
              title: 'Half an equilateral triangle',
              body: r`An equilateral triangle with sides of 2 has all angles equal to 60°. Cut it in half down the middle and you get a right triangle with angles of 30°, 60° and 90°, and sides $1$, $\sqrt3$, $2$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -0.3, ymax: 2, grid: false, axes: false,
                extra: ({ plot, s }) => {
                  const A = [-1, 0], B = [1, 0], C = [0, Math.sqrt(3)], M = [0, 0];
                  return [
                    poly(plot, s, [A, M, C], { class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
                    poly(plot, s, [M, B, C], { class: 'fl-blue-soft', stroke: 'var(--ink)', 'stroke-width': 3 }),
                    rightMark(plot, s, B, M, C),
                    wedge(plot, s, C, B, M, 36, 'fl-coral', 0.4), wedge(plot, s, M, C, B, 46, 'fl-teal', 0.4),
                    label(plot, s, [0.5, 0], '1', 0, 22), label(plot, s, [0.5, Math.sqrt(3) / 2], '2', 18, -2), label(plot, s, [0, Math.sqrt(3) / 2], '√3', -18, 4),
                    label(plot, s, [1, 0], '60°', -40, -8, { class: 'lbl fl-coral', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
                    label(plot, s, [0, Math.sqrt(3)], '30°', 14, 58, { class: 'lbl fl-teal', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
                  ];
                },
              },
              after: r`The short side is half the hypotenuse, so $\sin 30° = \tfrac12$. By Pythagoras the long side is $\sqrt{2^2 - 1^2} = \sqrt3$.`,
            },
            {
              type: 'mcq',
              title: 'Read it off',
              prompt: r`Using the 30-60-90 triangle, what is $\sin 60°$?`,
              cols: 2,
              choices: [
                { t: r`$\dfrac{\sqrt3}{2}$`, ok: true },
                { t: r`$\dfrac12$`, why: r`That's $\sin 30°$. For 60°, the opposite side is the long one, $\sqrt3$.` },
                { t: r`$\dfrac{\sqrt2}{2}$`, why: 'That’s the value for 45°.' },
                { t: r`$\sqrt3$`, why: r`That's $\tan 60° = \sqrt3/1$. Sine divides by the hypotenuse, 2.` },
              ],
              explain: r`Opposite the 60° angle is $\sqrt3$, and the hypotenuse is 2: $\sin 60° = \frac{\sqrt3}{2} \approx 0.866$. Notice that $\sin 60° = \cos 30°$: the two angles share the same triangle.`,
            },
            {
              type: 'explain',
              title: 'The Pythagorean identity',
              body: r`For any angle in a right triangle with hypotenuse 1, the legs are $\cos\theta$ and $\sin\theta$. Pythagoras then says:
$$\sin^2\theta + \cos^2\theta = 1$$
(Here $\sin^2\theta$ means $(\sin\theta)^2$.) Check with 30°: $\left(\tfrac12\right)^2 + \left(\tfrac{\sqrt3}{2}\right)^2 = \tfrac14 + \tfrac34 = 1$. ✓`,
            },
            {
              type: 'numeric',
              title: 'Use the identity',
              prompt: r`For an acute angle, $\sin\theta = 0.6$. What is $\cos\theta$?`,
              answer: 0.8,
              wrong: [
                { v: 0.4, why: r`$\sin^2 + \cos^2 = 1$ uses **squares**: $\cos^2\theta = 1 - 0.36$.` },
                { v: 0.64, tol: 0.001, why: r`That's $\cos^2\theta$. Take the square root.` },
              ],
              explain: r`$\cos^2\theta = 1 - 0.6^2 = 0.64$, so $\cos\theta = 0.8$. (It's a 3-4-5 triangle in disguise: 0.6 and 0.8 are $\tfrac35$ and $\tfrac45$.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Equilateral height',
              prompt: 'What is the height of an equilateral triangle with sides of 6? Give a decimal.',
              answer: 3 * Math.sqrt(3),
              tol: 0.01,
              wrong: [
                { v: 6, why: 'The height is shorter than the slanted sides.' },
                { v: 3, why: 'That’s half the base. The height is the long leg of the 30-60-90 triangle.' },
              ],
              explain: r`Half of it is a 30-60-90 triangle with hypotenuse 6, so every side is 3 times bigger than in the $1, \sqrt3, 2$ triangle. The height is $3\sqrt3 \approx 5.196$.`,
            },
          ],
          recap: [
            r`45-45-90: sides $1, 1, \sqrt2$, so $\sin 45° = \cos 45° = \tfrac{\sqrt2}{2}$.`,
            r`30-60-90: sides $1, \sqrt3, 2$, so $\sin 30° = \tfrac12$ and $\sin 60° = \tfrac{\sqrt3}{2}$.`,
            r`$\sin^2\theta + \cos^2\theta = 1$ is Pythagoras in disguise.`,
          ],
        },
      ],
    },
    {
      title: 'The Unit Circle',
      summary: 'Angles of any size, measured in radians.',
      lessons: [
        {
          id: 'unit-circle',
          title: 'Around the Circle',
          summary: 'Sine and cosine for every angle',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A point on a circle',
              body: r`Here's a circle of radius 1, centred at the origin. Drag the point around it. The triangle's legs are $\teal{\cos\theta}$ (horizontal) and $\coral{\sin\theta}$ (vertical), because the hypotenuse is 1.`,
              widget: unitCircle({ value: 40 }),
              after: 'Keep dragging past 90°. The triangle flips to the other side, and the legs can become negative.',
            },
            {
              type: 'explain',
              title: 'A bigger definition',
              body: r`For **any** angle $\theta$ (measured counterclockwise from the positive $x$-axis), take the point on the unit circle at that angle. Then:
$$\cos\theta = x\text{-coordinate}, \qquad \sin\theta = y\text{-coordinate}$$
For angles between 0° and 90°, this agrees with the triangle definitions. Beyond that, it extends sine and cosine to angles no triangle could hold, including negative ones and angles of more than 360°.`,
            },
            {
              type: 'mcq',
              title: 'Signs',
              prompt: r`What is the sign of $\cos 150°$?`,
              cols: 2,
              choices: [
                { t: 'Negative', ok: true },
                { t: 'Positive', why: 'At 150° the point is to the left of the y-axis, so its x-coordinate is negative.' },
                { t: 'Zero', why: 'Cosine is zero only at 90° and 270°.' },
              ],
              explain: r`150° is in the upper-left quarter, where $x < 0$ and $y > 0$. So $\cos 150° < 0$ while $\sin 150° > 0$. In fact $\cos 150° = -\frac{\sqrt3}{2}$.`,
            },
            {
              type: 'numeric',
              title: 'Half a turn',
              prompt: r`What is $\cos 180°$?`,
              answer: -1,
              wrong: [
                { v: 0, why: r`At 180° the point is at $(-1, 0)$. Cosine is its $x$-coordinate.` },
                { v: 1, why: r`At 180° the point is on the **left** side of the circle.` },
              ],
              explain: r`At 180° the point is at $(-1, 0)$, so $\cos 180° = -1$ and $\sin 180° = 0$.`,
            },
            {
              type: 'mcq',
              title: 'Same height',
              prompt: r`Which angle has the same sine as 30°?`,
              cols: 2,
              choices: [
                { t: '150°', ok: true },
                { t: '60°', why: r`$\sin 60° = \frac{\sqrt3}{2}$. You may be thinking of $\cos 60° = \sin 30°$.` },
                { t: '210°', why: 'At 210° the point is below the x-axis, so its sine is negative.' },
                { t: '330°', why: 'At 330° the point is below the x-axis, so its sine is negative.' },
              ],
              explain: r`150° is the mirror image of 30° across the $y$-axis: same height, opposite $x$. In general, $\sin(180° - \theta) = \sin\theta$.`,
            },
            {
              type: 'interactive',
              title: 'Find the angle',
              body: r`Drag the point to the angle where $\sin\theta = -\tfrac12$ **and** $\cos\theta$ is positive.`,
              widget: unitCircle({
                value: 40,
                goal: (p) => Math.round(p.t) === 330,
                hint: 'Negative sine means below the x-axis. Positive cosine means to the right of the y-axis.',
                solution: { t: 330 },
              }),
              explain: r`Below the axis and to the right means the lower-right quarter. The reference angle is 30° (because $\sin 30° = \tfrac12$), measured down from the $x$-axis: $360° - 30° = 330°$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'More than a full turn',
              prompt: r`What is $\sin 390°$?`,
              answer: 0.5,
              wrong: [
                { v: -0.5, why: r`$390° = 360° + 30°$: one full turn, plus 30°, which is above the axis.` },
                { v: 0, why: r`390° isn't on an axis. It's one full turn plus 30°.` },
              ],
              explain: r`390° is a full turn (360°) plus 30°, which lands on the same point as 30°. So $\sin 390° = \sin 30° = 0.5$. Sine and cosine repeat every 360°.`,
            },
          ],
          recap: [
            r`On the unit circle, the point at angle $\theta$ is $(\cos\theta, \sin\theta)$.`,
            'Signs depend on the quarter (quadrant): cosine is negative on the left, sine is negative below.',
            r`$\sin(180° - \theta) = \sin\theta$, and both functions repeat every 360°.`,
          ],
        },
        {
          id: 'radians',
          title: 'Radians',
          summary: 'Measuring angles with the radius',
          icon: 'pencil',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'How many radii?',
              prompt: 'How many radius-lengths fit around the edge of a circle? Give a decimal.',
              answer: 2 * Math.PI,
              tol: 0.02,
              wrong: [
                { v: Math.PI, tol: 0.02, why: r`$\pi$ diameters fit around the circle. A radius is half a diameter, so twice as many radii fit.` },
                { v: 6, why: 'A bit more than 6.' },
              ],
              explain: r`The circumference is $2\pi r$, so exactly $2\pi \approx 6.283$ radius-lengths fit around the edge.`,
            },
            {
              type: 'explain',
              title: 'The radian',
              body: r`One **radian** is the angle that makes an arc exactly one radius long. Since $2\pi$ radii fit around the circle:
$$2\pi \text{ radians} = 360°, \qquad 1 \text{ radian} \approx 57.3°$$`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.3, ymax: 1.3, grid: false, axes: false,
                params: { a: { min: 0.1, max: 6.28, step: 0.01, value: 1, label: r`$\theta$`, color: 'violet', format: (v) => `${v.toFixed(2)} rad` } },
                extra: ({ plot, p, s }) => {
                  const R = plot.X(1) - plot.X(0);
                  const large = p.a > Math.PI ? 1 : 0;
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: R, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(1)} ${plot.Y(0)} A${R} ${R} 0 ${large} 0 ${plot.X(Math.cos(p.a))} ${plot.Y(Math.sin(p.a))} Z`, class: 'fl-violet', opacity: 0.18 }),
                    s('path', { d: `M${plot.X(1)} ${plot.Y(0)} A${R} ${R} 0 ${large} 0 ${plot.X(Math.cos(p.a))} ${plot.Y(Math.sin(p.a))}`, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 5 }),
                    seg(plot, s, [0, 0], [1, 0], { stroke: 'var(--blue)', 'stroke-width': 3 }),
                    seg(plot, s, [0, 0], [Math.cos(p.a), Math.sin(p.a)], { stroke: 'var(--blue)', 'stroke-width': 3 }),
                    label(plot, s, [0.5, 0], 'r', 0, 18, { class: 'lbl fl-blue' }),
                  ];
                },
                readout: (p) => r`arc $= ${p.a.toFixed(2)}$ radii $\quad \theta = ${p.a.toFixed(2)}$ rad $= ${(p.a / D).toFixed(1)}°$`,
              },
            },
            {
              type: 'numeric',
              title: 'Convert to radians',
              prompt: r`90° is how many times $\pi$ radians?`,
              lhs: r`$90° =$`,
              unit: r`$\times\,\pi$ rad`,
              answer: 0.5,
              wrong: [
                { v: 2, why: r`A full turn (360°) is $2\pi$. A quarter turn is a quarter of that.` },
                { v: 90, why: r`Divide by 180°: $90/180 = \tfrac12$.` },
              ],
              explain: r`$180° = \pi$ rad, so $90° = \frac{\pi}{2}$ rad.`,
            },
            {
              type: 'numeric',
              title: 'Convert to degrees',
              prompt: r`How many degrees is $\frac{\pi}{3}$ radians?`,
              unit: '°',
              answer: 60,
              wrong: [{ v: 1.047, tol: 0.01, why: r`That's the value in radians as a decimal. Use $\pi \text{ rad} = 180°$: $180°/3$.` }],
              explain: r`$\pi$ rad $= 180°$, so $\frac{\pi}{3} = \frac{180°}{3} = 60°$.`,
            },
            {
              type: 'numeric',
              title: 'Arc length',
              body: r`With radians, arc length is simply $s = r\theta$.`,
              prompt: 'A circle has radius 5. How long is the arc for an angle of 2 radians?',
              answer: 10,
              wrong: [{ v: 2.5, why: r`Multiply: $s = r\theta = 5 \times 2$.` }],
              explain: r`$s = r\theta = 5 \times 2 = 10$. That's 2 radius-lengths of arc, which is the definition of 2 radians.`,
            },
            {
              type: 'mcq',
              title: 'Why bother?',
              prompt: 'Why do mathematicians and physicists prefer radians to degrees?',
              choices: [
                { t: 'Formulas like s = rθ, and sin θ ≈ θ for small angles, become simple', ok: true },
                { t: 'Radians are more accurate', why: 'Both units are equally precise. They just measure the same thing differently.' },
                { t: 'Degrees can’t describe angles above 360°', why: 'Degrees work fine for any angle. The advantage of radians is that they make formulas simpler.' },
              ],
              explain: r`360 is a historical choice, probably from Babylonian astronomy. Radians come from the circle itself, so formulas need no conversion factors: $s = r\theta$, $v = r\omega$, and for small angles $\sin\theta \approx \theta$. In calculus, the derivative of $\sin x$ is exactly $\cos x$, but only when $x$ is in radians.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Spinning wheel',
              prompt: 'A wheel of radius 0.3 m spins at 10 radians per second. How fast does a point on its rim move?',
              unit: 'm/s',
              answer: 3,
              wrong: [{ v: 33.3, tol: 0.1, why: r`Multiply, don't divide: $v = r\omega$.` }],
              explain: r`Each second the wheel turns 10 rad, so a point on the rim travels an arc of $s = r\theta = 0.3 \times 10 = 3$ m. Its speed is 3 m/s. This is $v = r\omega$.`,
            },
          ],
          recap: [
            r`1 radian: the arc length equals the radius. $2\pi$ rad $= 360°$ and $\pi$ rad $= 180°$.`,
            r`Arc length $s = r\theta$, and speed on a circle $v = r\omega$ (with $\theta$ in radians).`,
            'Radians make the formulas of calculus and physics simple.',
          ],
        },
      ],
    },
    {
      title: 'Waves and Triangles',
      summary: 'Unrolling the circle, and beyond right angles.',
      lessons: [
        {
          id: 'sine-waves',
          title: 'Sine Waves',
          summary: 'Circles become waves',
          icon: 'play',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Unroll the circle',
              body: r`Drag the point around the circle. On the right, the height $\sin\theta$ is plotted against the angle. Going once around the circle traces one complete **wave**.`,
              widget: unitCircle({ wave: true, value: 120, step: 1 }),
            },
            {
              type: 'mcq',
              title: 'When does it repeat?',
              prompt: r`After what angle does the graph of $y = \sin x$ start repeating?`,
              cols: 2,
              choices: [
                { t: r`$2\pi$ (360°)`, ok: true },
                { t: r`$\pi$ (180°)`, why: r`At $\pi$ the wave is back to zero, but heading **down**. It's only halfway through.` },
                { t: r`$\pi/2$ (90°)`, why: 'That’s where it reaches its peak, a quarter of the way through.' },
              ],
              explain: r`One trip around the circle is $2\pi$. After that, the point retraces the same path, so the wave repeats. This repeat length is the **period**.`,
            },
            {
              type: 'explain',
              title: 'Stretching waves',
              body: r`In $y = \blue{A}\sin(\violet{B}x)$:
- $\blue{A}$ is the **amplitude**: the height of the peaks.
- $\violet{B}$ squeezes the wave sideways. The period becomes $\dfrac{2\pi}{B}$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * Math.PI, ymin: -3.2, ymax: 3.2, grid: Math.PI / 2, gridY: 1, height: 300,
                axes: { xlabel: 'x', ylabel: 'y', xfmt: (v) => ({ 0: '0', 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π' })[Math.round(v / (Math.PI / 2))] || '' },
                params: { A: { min: 0.5, max: 3, step: 0.5, value: 1, label: '$A$', color: 'blue' }, B: { min: 0.5, max: 4, step: 0.5, value: 1, label: '$B$', color: 'violet' } },
                curves: [{ f: (x, p) => p.A * Math.sin(p.B * x), color: 'blue' }],
                readout: (p) => r`$y = ${fix(p.A, 1)}\sin(${fix(p.B, 1)}x)$, $\quad$ period $= \frac{2\pi}{${fix(p.B, 1)}} = ${fix(2 / p.B, 2)}\pi$`,
              },
            },
            {
              type: 'interactive',
              title: 'Match the wave',
              body: r`Adjust $A$ and $B$ so the blue wave lies on the dashed one.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * Math.PI, ymin: -3.2, ymax: 3.2, grid: Math.PI / 2, gridY: 1, height: 300,
                axes: { xlabel: 'x', ylabel: 'y', xfmt: (v) => ({ 0: '0', 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π' })[Math.round(v / (Math.PI / 2))] || '' },
                params: { A: { min: 0.5, max: 3, step: 0.5, value: 1, label: '$A$', color: 'blue' }, B: { min: 0.5, max: 4, step: 0.5, value: 1, label: '$B$', color: 'violet' } },
                curves: [{ f: (x) => 1.5 * Math.sin(2 * x), color: 'ink', dash: true, width: 3 }, { f: (x, p) => p.A * Math.sin(p.B * x), color: 'blue' }],
                goal: (p) => p.A === 1.5 && p.B === 2,
                hint: 'Read the peak height for A. Count how many full waves fit in 2π for B.',
                solution: { A: 1.5, B: 2 },
              },
              explain: r`The peaks reach 1.5, so $A = 1.5$. Two full waves fit in $2\pi$, so the period is $\pi$ and $B = \frac{2\pi}{\pi} = 2$. The wave is $y = 1.5\sin(2x)$.`,
            },
            {
              type: 'numeric',
              title: 'Period',
              prompt: r`What is the period of $y = \sin(4x)$, as a multiple of $\pi$?`,
              unit: r`$\times\,\pi$`,
              answer: 0.5,
              wrong: [
                { v: 8, why: r`The period is $2\pi / B$: divide by 4, don't multiply.` },
                { v: 4, why: r`$B = 4$ squeezes the wave, which makes the period *shorter*: $2\pi/4$.` },
              ],
              explain: r`Period $= \frac{2\pi}{4} = \frac{\pi}{2}$. Four full waves fit in each $2\pi$.`,
            },
            {
              type: 'explain',
              title: 'Waves everywhere',
              body: r`Anything that goes round and round, or back and forth, makes a sine wave: a swinging pendulum, a vibrating guitar string, sound, light, tides, and the alternating current in your walls (which changes direction 50 or 60 times a second, depending on the country).

The **frequency** $f$ is how many cycles happen per second, measured in hertz (Hz). It's 1 divided by the period: $f = 1/T$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ferris wheel',
              body: r`A Ferris wheel has a radius of 10 m, and its centre is 12 m above the ground. It turns once every 120 s. You board at the bottom, so your height after $t$ seconds is
$$h(t) = 12 - 10\cos\!\left(\frac{2\pi t}{120}\right)$$`,
              prompt: 'How high are you after 30 seconds?',
              unit: 'm',
              answer: 12,
              wrong: [
                { v: 2, why: r`That's the height at $t = 0$, when you board at the bottom.` },
                { v: 22, why: 'That’s the top, which you reach at 60 s.' },
              ],
              explain: r`At $t = 30$: $\frac{2\pi \cdot 30}{120} = \frac{\pi}{2}$, and $\cos\frac{\pi}{2} = 0$. So $h = 12$ m. You're a quarter of the way round, level with the centre.`,
            },
          ],
          recap: [
            r`$y = \sin x$ is the height of a point going around the unit circle, with period $2\pi$.`,
            r`$y = A\sin(Bx)$ has amplitude $A$ and period $2\pi/B$.`,
            'Frequency is 1 ÷ period, measured in hertz. Anything that repeats can be described by sine waves.',
          ],
        },
        {
          id: 'law-of-cosines',
          title: 'Law of Cosines',
          summary: 'Pythagoras for every triangle',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Close the hinge',
              body: r`Two sticks of length 3 and 4 are hinged together. At 90° the ends are 5 apart.`,
              prompt: 'If you close the hinge to an angle smaller than 90°, the distance between the ends becomes…',
              cols: 2,
              choices: [
                { t: 'Less than 5', ok: true },
                { t: 'More than 5', why: 'Closing the hinge brings the free ends closer together.' },
                { t: 'Still 5', why: 'The distance changes as the angle changes. Try it on the next screen.' },
              ],
              explain: 'Closing the angle brings the ends together, and opening it pushes them apart. So the third side depends on the angle between the other two.',
            },
            {
              type: 'explain',
              title: 'Watch the third side',
              body: r`Sides $a = 3$ and $b = 4$ meet at angle $C$. Change $C$ and compare $c$ with Pythagoras' $\sqrt{a^2 + b^2} = 5$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.5, xmax: 4.6, ymin: -0.6, ymax: 4.2, grid: 1, axes: false,
                params: { C: { min: 10, max: 170, step: 1, value: 90, label: '$C$', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const O = [0, 0], A = [4, 0], B = [3 * Math.cos(p.C * D), 3 * Math.sin(p.C * D)];
                  return [
                    poly(plot, s, [O, A, B], { class: 'fl-surface' }),
                    seg(plot, s, O, A, { stroke: 'var(--coral)', 'stroke-width': 5 }),
                    seg(plot, s, O, B, { stroke: 'var(--blue)', 'stroke-width': 5 }),
                    seg(plot, s, A, B, { stroke: 'var(--teal)', 'stroke-width': 5 }),
                    wedge(plot, s, A, O, B, 30, 'fl-violet', 0.4),
                    label(plot, s, [2, 0], 'b = 4', 0, 22, { class: 'lbl fl-coral' }),
                    label(plot, s, [B[0] / 2, B[1] / 2], 'a = 3', -30, 0, { class: 'lbl fl-blue' }),
                    label(plot, s, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], 'c', 14, -8, { class: 'lbl fl-teal' }),
                  ];
                },
                readout: (p) => r`$c = ${f3(Math.sqrt(25 - 24 * Math.cos(p.C * D)))}$`,
              },
            },
            {
              type: 'explain',
              title: 'The law of cosines',
              body: r`For any triangle with sides $a$, $b$ and the angle $C$ between them, the third side $c$ satisfies
$$c^2 = a^2 + b^2 - 2ab\cos C$$

When $C = 90°$, $\cos C = 0$ and it becomes Pythagoras. For angles under 90°, $\cos C > 0$, so $c$ is shorter. For angles over 90°, $\cos C < 0$, so $c$ is longer. It's a correction term that measures how far the angle is from 90°.`,
            },
            {
              type: 'numeric',
              title: 'At 60°',
              prompt: r`Sides 3 and 4 meet at a 60° angle. How long is the third side? Give a decimal. ($\cos 60° = 0.5$)`,
              answer: Math.sqrt(13),
              tol: 0.01,
              wrong: [
                { v: 5, why: 'That’s the 90° case. At 60° the third side is shorter.' },
                { v: 13, why: r`That's $c^2$. Take the square root.` },
                { v: Math.sqrt(37), tol: 0.01, why: r`The formula *subtracts* $2ab\cos C$: $9 + 16 - 12$.` },
              ],
              explain: r`$c^2 = 9 + 16 - 2(3)(4)(0.5) = 25 - 12 = 13$, so $c = \sqrt{13} \approx 3.61$.`,
            },
            {
              type: 'numeric',
              title: 'At 120°',
              prompt: r`Now the angle is 120°. How long is the third side? ($\cos 120° = -0.5$)`,
              answer: Math.sqrt(37),
              tol: 0.01,
              wrong: [{ v: Math.sqrt(13), tol: 0.01, why: r`$\cos 120°$ is **negative**, so $-2ab\cos C$ adds 12.` }],
              explain: r`$c^2 = 25 - 24(-0.5) = 25 + 12 = 37$, so $c = \sqrt{37} \approx 6.08$.`,
            },
            {
              type: 'mcq',
              title: 'Flat out',
              prompt: 'With sides 3 and 4, at what angle C does the third side equal 7?',
              cols: 2,
              choices: [
                { t: '180°', ok: true },
                { t: '90°', why: 'At 90° the third side is 5.' },
                { t: '120°', why: r`At 120° it's $\sqrt{37} \approx 6.08$, which isn't 7 yet.` },
                { t: 'No angle gives 7', why: r`It's possible, but only in the extreme case where the "triangle" lies flat.` },
              ],
              explain: r`At $C = 180°$ the sides point in opposite directions and line up straight: $c = 3 + 4 = 7$. The formula agrees: $\cos 180° = -1$, so $c^2 = 25 + 24 = 49$. A real triangle always needs $c < a + b$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Find an angle',
              prompt: 'A triangle has sides 5, 7 and 8. What is the angle opposite the side of length 7?',
              unit: '°',
              answer: 60,
              wrong: [{ v: 120, why: r`Careful with the sign: $\cos C = \frac{25 + 64 - 49}{80} = +0.5$.` }],
              hint: r`Rearrange: $\cos C = \dfrac{a^2 + b^2 - c^2}{2ab}$, with $c = 7$.`,
              explain: r`$\cos C = \frac{5^2 + 8^2 - 7^2}{2 \cdot 5 \cdot 8} = \frac{25 + 64 - 49}{80} = \frac{40}{80} = 0.5$, so $C = 60°$.`,
            },
          ],
          recap: [
            r`Law of cosines: $c^2 = a^2 + b^2 - 2ab\cos C$.`,
            'At C = 90° it becomes Pythagoras. Smaller angles give shorter sides, larger angles longer ones.',
            r`Rearranged, it finds any angle from three sides: $\cos C = \frac{a^2 + b^2 - c^2}{2ab}$.`,
          ],
        },
      ],
    },
    {
      title: 'Triangles in the World',
      summary: 'Law of sines, areas, heights and bearings.',
      lessons: [
        {
          id: 'law-of-sines',
          title: 'Law of Sines',
          summary: 'Sides in proportion to sines',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The biggest angle',
              prompt: r`A triangle has sides 5, 7 and 10. Which angle is the largest?`,
              choices: [
                { t: 'The angle opposite the side of length 10', ok: true },
                { t: 'The angle opposite the side of length 5', why: 'That’s the smallest. Longer sides sit opposite larger angles.' },
                { t: 'They’re all equal', why: 'Only an equilateral triangle has equal angles.' },
              ],
              explain: r`In any triangle, the longest side faces the largest angle and the shortest side faces the smallest. The law of sines makes this precise.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Sides and sines',
              body: r`Drag the corner $C$. For each side, divide its length by the sine of the **opposite** angle.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.2, xmax: 8.2, ymin: -1, ymax: 5.4, grid: 1, axes: false, maxWidth: 560,
                params: { cx: { min: -1.5, max: 7.5, step: 0.05, value: 2, slider: false }, cy: { min: 0.8, max: 4.8, step: 0.05, value: 3.5, slider: false } },
                points: [{ x: (p) => p.cx, y: (p) => p.cy, drag: { x: 'cx', y: 'cy' }, color: 'violet', r: 8 }],
                extra: ({ plot, p, s }) => {
                  const t = triABC(p);
                  const y0 = (p.cx ** 2 + p.cy ** 2 - 6 * p.cx) / (2 * p.cy);
                  const R = Math.hypot(3, y0);
                  return [
                    s('circle', { cx: plot.X(3), cy: plot.Y(y0), r: plot.X(R) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    poly(plot, s, [t.A, t.B, t.C], { class: 'fl-surface' }),
                    seg(plot, s, t.B, t.C, { stroke: 'var(--coral)', 'stroke-width': 5 }),
                    seg(plot, s, t.A, t.C, { stroke: 'var(--blue)', 'stroke-width': 5 }),
                    seg(plot, s, t.A, t.B, { stroke: 'var(--teal)', 'stroke-width': 5 }),
                    label(plot, s, t.A, 'A', -14, 18),
                    label(plot, s, t.B, 'B', 14, 18),
                    label(plot, s, t.C, 'C', 0, -16),
                    label(plot, s, [(t.B[0] + t.C[0]) / 2, (t.B[1] + t.C[1]) / 2], 'a', 16, -4, { class: 'lbl fl-coral' }),
                    label(plot, s, [t.C[0] / 2, t.C[1] / 2], 'b', -16, -4, { class: 'lbl fl-blue' }),
                    label(plot, s, [3, 0], 'c', 0, 22, { class: 'lbl fl-teal' }),
                  ];
                },
                readout: (p) => {
                  const t = triABC(p);
                  const q = (x, A) => (x / Math.sin(A * D)).toFixed(2);
                  return r`$\coral{\dfrac{a}{\sin A}} = ${q(t.a, t.aA)}, \quad \blue{\dfrac{b}{\sin B}} = ${q(t.b, t.aB)}, \quad \teal{\dfrac{c}{\sin C}} = ${q(t.c, t.aC)}$`;
                },
              },
              after: r`All three ratios are always equal, however you drag. They also equal the **diameter** of the dashed circle through all three corners (the circumcircle).`,
            },
            {
              type: 'explain',
              title: 'The law of sines',
              body: r`For any triangle,
$$\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}$$
**Why:** drop a perpendicular of height $h$ from $C$ to side $c$. In the two right triangles this creates, $h = b\sin A$ and $h = a \sin B$. So $b \sin A = a \sin B$, which rearranges to $\frac{a}{\sin A} = \frac{b}{\sin B}$. The same works for any pair of sides.

Use it when you know a side and its opposite angle, plus one more side or angle.`,
            },
            {
              type: 'numeric',
              title: 'Find a side',
              prompt: r`In a triangle, $A = 40°$, $B = 65°$ and $a = 8$. Find $b$. (2 decimal places.)`,
              answer: (8 * Math.sin(65 * D)) / Math.sin(40 * D),
              tol: 0.01,
              wrong: [{ v: (8 * Math.sin(40 * D)) / Math.sin(65 * D), tol: 0.01, why: r`Flip it: $b = \frac{a \sin B}{\sin A}$.` }],
              explain: r`$b = \frac{8 \sin 65°}{\sin 40°} = \frac{8 \times 0.906}{0.643} \approx 11.28$. The larger angle $B$ faces the longer side, as expected.`,
            },
            {
              type: 'numeric',
              title: 'Across the river',
              prompt: r`Two surveyors stand at $A$ and $B$, 100 m apart along a riverbank. A tree $T$ on the far bank makes angle $TAB = 70°$ and angle $TBA = 60°$. How far is the tree from $A$? (Nearest metre.)`,
              unit: 'm',
              answer: Math.round((100 * Math.sin(60 * D)) / Math.sin(50 * D)),
              tol: 1,
              wrong: [{ v: Math.round((100 * Math.sin(70 * D)) / Math.sin(50 * D)), tol: 1, why: r`$AT$ is opposite angle $B$ (60°), not $A$.` }],
              hint: r`First find the angle at the tree: $180° - 70° - 60°$.`,
              explain: r`The angle at $T$ is $50°$. $AT$ faces the 60° angle at $B$, so $AT = \frac{100 \sin 60°}{\sin 50°} \approx 113$ m, measured without crossing the river. This is **triangulation**, the method used to map whole countries before satellites.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Two triangles',
              prompt: r`Angle $A = 30°$ and side $b = AC = 8$ are fixed. Side $a = BC$ must be 5. Drag $B$ along the base. There are **two** places where $a = 5$: find the one closer to $A$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.8, xmax: 12, ymin: -1, ymax: 5.4, grid: 1, axes: false, maxWidth: 560,
                params: { x: { min: 1, max: 11.5, step: 0.01, value: 8, slider: false } },
                points: [{ x: (p) => p.x, y: () => 0, drag: { x: 'x' }, color: 'coral', r: 8, label: 'B', labelDy: 22 }],
                extra: ({ plot, p, s }) => {
                  const A = [0, 0], C = AMB_C, B = [p.x, 0];
                  return [
                    s('circle', { cx: plot.X(C[0]), cy: plot.Y(C[1]), r: plot.X(5) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    seg(plot, s, [-0.5, 0], [11.8, 0], { stroke: 'var(--axis)', 'stroke-width': 1.5 }),
                    poly(plot, s, [A, B, C], { class: 'fl-surface' }),
                    seg(plot, s, A, C, { stroke: 'var(--blue)', 'stroke-width': 5 }),
                    seg(plot, s, B, C, { stroke: 'var(--coral)', 'stroke-width': 5 }),
                    wedge(plot, s, B, A, C, 34, 'fl-violet', 0.4),
                    label(plot, s, A, 'A', -12, 18),
                    label(plot, s, C, 'C', 0, -14),
                    label(plot, s, [C[0] / 2, C[1] / 2], 'b = 8', -26, -6, { class: 'lbl fl-blue' }),
                    label(plot, s, [2.2, 0.55], '30°', 0, 0, { class: 'lbl fl-violet', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))' }),
                  ];
                },
                readout: (p) => r`$a = BC = ${ambA(p.x).toFixed(2)}$, $\quad$ angle $B = ${angleAt([0, 0], [p.x, 0], AMB_C).toFixed(1)}°$`,
                goal: (p) => Math.abs(ambA(p.x) - 5) < 0.03 && p.x < AMB_C[0],
                hint: 'The dashed circle shows every point 5 away from C. Where does it cross the base nearer A?',
                solution: { x: 3.93 },
              },
              explain: r`The circle of radius 5 around $C$ crosses the base twice, at $x \approx 3.93$ and $x \approx 9.93$, so **two different triangles** fit the data. This is the **ambiguous case**: knowing two sides and a non-included angle (SSA) doesn't always pin down the triangle.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Which angle?',
              prompt: r`The law of sines gives $\sin B = \frac{b \sin A}{a} = \frac{8 \times 0.5}{5} = 0.8$. Your calculator says $B = 53.1°$, but in the triangle you just found, angle $B$ is obtuse. What is it? (1 decimal place.)`,
              unit: '°',
              answer: 180 - Math.asin(0.8) / D,
              tol: 0.06,
              wrong: [{ v: Math.asin(0.8) / D, tol: 0.06, why: r`That's the acute solution. Use $\sin(180° - B) = \sin B$.` }],
              explain: r`Since $\sin(180° - \theta) = \sin\theta$, both $53.1°$ and $180° - 53.1° = 126.9°$ have sine 0.8. The calculator only ever returns the acute one, so with SSA data always check whether the obtuse angle also fits (here it does: $30° + 126.9° < 180°$).`,
            },
          ],
          recap: [
            r`Law of sines: $\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}$ (= the circumcircle's diameter).`,
            'Use it with a side and its opposite angle, plus one more piece.',
            'SSA data can give two triangles: check the obtuse angle too.',
          ],
        },
        {
          id: 'area-sine',
          title: 'Area with Sine',
          summary: 'Half a b sine C',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Height from an angle',
              body: r`Area is $\frac12 \times \text{base} \times \text{height}$. Two sides $a = 5$ and $b = 8$ meet at angle $C$; the height above side $b$ is $a\sin C$. So
$$\text{Area} = \tfrac12 ab \sin C$$
Change the angle and watch the height.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5.5, xmax: 8.6, ymin: -0.9, ymax: 5.6, grid: 1, axes: false, maxWidth: 560,
                params: { C: { min: 5, max: 175, step: 1, value: 50, label: '$C$', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const O = [0, 0], Bp = [8, 0], Ap = [5 * Math.cos(p.C * D), 5 * Math.sin(p.C * D)];
                  const els = [
                    poly(plot, s, [O, Bp, Ap], { class: 'fl-teal', opacity: 0.25 }),
                    seg(plot, s, O, Bp, { stroke: 'var(--coral)', 'stroke-width': 5 }),
                    seg(plot, s, O, Ap, { stroke: 'var(--blue)', 'stroke-width': 5 }),
                    seg(plot, s, Ap, Bp, { stroke: 'var(--teal)', 'stroke-width': 3 }),
                    seg(plot, s, Ap, [Ap[0], 0], { stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
                    wedge(plot, s, Bp, O, Ap, 28, 'fl-violet', 0.4),
                    label(plot, s, [4, 0], 'b = 8', 0, 22, { class: 'lbl fl-coral' }),
                    label(plot, s, [Ap[0] / 2, Ap[1] / 2], 'a = 5', p.C < 90 ? -30 : 30, 0, { class: 'lbl fl-blue' }),
                    label(plot, s, [Ap[0], Ap[1] / 2], 'h', 12, 4, { style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))' }),
                  ];
                  if (Ap[0] < 0) els.push(seg(plot, s, [Ap[0], 0], O, { stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }));
                  return els;
                },
                readout: (p) => r`$h = 5\sin ${p.C}° = ${(5 * Math.sin(p.C * D)).toFixed(2)}$, $\quad$ area $= \tfrac12 \cdot 8 \cdot h = ${(20 * Math.sin(p.C * D)).toFixed(2)}$`,
              },
              after: r`The area is largest at $C = 90°$ and shrinks to nothing as the triangle flattens either way. For obtuse angles the height falls outside the triangle, but the formula still works.`,
            },
            {
              type: 'numeric',
              title: 'At 30°',
              prompt: r`What is the area of a triangle with sides 5 and 8 and an angle of 30° between them?`,
              answer: 10,
              wrong: [{ v: 20, why: r`Don't forget the $\frac12$: $\frac12 \times 5 \times 8 \times 0.5$.` }, { v: 40, why: r`Multiply by $\sin 30° = 0.5$ and by $\frac12$.` }],
              explain: r`$\frac12 \times 5 \times 8 \times \sin 30° = 20 \times 0.5 = 10$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The same area again',
              prompt: r`Find an **obtuse** angle $C$ that gives the same area, 10, as the 30° triangle.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5.5, xmax: 8.6, ymin: -0.9, ymax: 5.6, grid: 1, axes: false, maxWidth: 560,
                params: { C: { min: 5, max: 175, step: 1, value: 90, label: '$C$', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const O = [0, 0], Bp = [8, 0], Ap = [5 * Math.cos(p.C * D), 5 * Math.sin(p.C * D)];
                  return [
                    poly(plot, s, [O, Bp, Ap], { class: 'fl-teal', opacity: 0.25 }),
                    seg(plot, s, O, Bp, { stroke: 'var(--coral)', 'stroke-width': 5 }),
                    seg(plot, s, O, Ap, { stroke: 'var(--blue)', 'stroke-width': 5 }),
                    seg(plot, s, Ap, Bp, { stroke: 'var(--teal)', 'stroke-width': 3 }),
                    wedge(plot, s, Bp, O, Ap, 28, 'fl-violet', 0.4),
                  ];
                },
                readout: (p) => r`area $= 20 \sin ${p.C}° = ${(20 * Math.sin(p.C * D)).toFixed(2)}$`,
                goal: (p) => p.C > 90 && Math.abs(20 * Math.sin(p.C * D) - 10) < 0.05,
                hint: r`Which obtuse angle has the same sine as 30°?`,
                solution: { C: 150 },
              },
              explain: r`$C = 150°$, because $\sin 150° = \sin 30° = 0.5$. Two quite different-looking triangles, one slim and pointed, one wide and flat, have exactly the same area. It's the same fact behind the ambiguous case.`,
            },
            {
              type: 'numeric',
              title: 'A field',
              prompt: r`A triangular field has two sides of 120 m and 150 m, with an angle of 70° between them. What's its area? (Nearest 10 m².)`,
              unit: 'm²',
              answer: 8460,
              tol: 10,
              wrong: [{ v: 16914, tol: 20, why: r`Include the $\frac12$.` }, { v: 9000, tol: 10, why: r`That's $\frac12 \times 120 \times 150$ with no sine. Multiply by $\sin 70° \approx 0.940$.` }],
              explain: r`$\frac12 \times 120 \times 150 \times \sin 70° \approx 9000 \times 0.940 \approx 8460$ m², about 0.85 hectares. Surveyors find the area of any field this way, by splitting it into triangles.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Squeezing π',
              body: r`A regular polygon with $n$ sides fits inside a circle of radius 1. It's made of $n$ thin triangles, each with two sides of 1 and an angle of $\frac{360°}{n}$ at the centre. So its area is
$$n \times \tfrac12 \sin\frac{360°}{n}$$
Add sides.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 360,
                params: { n: { min: 3, max: 48, step: 1, value: 6, label: '$n$', color: 'teal' } },
                extra: ({ plot, p, s }) => {
                  const pts = [];
                  for (let i = 0; i < p.n; i++) pts.push([Math.cos((2 * Math.PI * i) / p.n), Math.sin((2 * Math.PI * i) / p.n)]);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
                    poly(plot, s, pts, { class: 'fl-teal', opacity: 0.25, stroke: 'var(--teal)', 'stroke-width': 2 }),
                    poly(plot, s, [[0, 0], pts[0], pts[1]], { class: 'fl-coral', opacity: 0.6 }),
                  ];
                },
                readout: (p) => r`area $= ${p.n} \times \tfrac12 \sin ${(360 / p.n).toFixed(1)}° = ${((p.n / 2) * Math.sin((2 * Math.PI) / p.n)).toFixed(4)}$ $\quad (\pi = 3.1416)$`,
              },
              after: r`As $n$ grows, the polygon fills the circle and its area creeps up towards $\pi$. Archimedes used polygons with 96 sides to show that $\pi$ lies between $3\frac{10}{71}$ and $3\frac17$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Twelve sides',
              prompt: r`What is the exact area of a regular 12-sided polygon inside a circle of radius 1?`,
              answer: 3,
              wrong: [{ v: Math.PI, tol: 0.01, why: 'That’s the circle. The polygon is slightly smaller.' }, { v: 6, why: r`Each triangle has area $\frac12 \sin 30° = \frac14$.` }],
              explain: r`Each of the 12 triangles has area $\frac12 \sin 30° = \frac14$, so the total is exactly $12 \times \frac14 = 3$: a neat lower bound for $\pi$.`,
            },
          ],
          recap: [
            r`Area $= \tfrac12 ab\sin C$, using two sides and the angle between them.`,
            r`$\sin C = \sin(180° - C)$, so an angle and its supplement give the same area.`,
            r`Polygons in a unit circle have areas approaching $\pi$.`,
          ],
        },
        {
          id: 'heights',
          title: 'Heights & Distances',
          summary: 'Measuring what you can’t reach',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Angles of elevation',
              body: r`The **angle of elevation** is the angle you tilt your gaze **up** from horizontal to see something; the **angle of depression** is how far you look **down**. Surveyors measure them with a theodolite (or you can use a protractor and a straw: a clinometer).

With a known distance, the tangent turns an angle into a height:
$$\text{height} = \text{distance} \times \tan(\text{elevation})$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Back away',
              prompt: r`A tower is 30 m tall. Drag the observer along the ground until the angle of elevation to the top is exactly 30°.`,
              widget: {
                kind: 'graph', equal: true, xmin: -8, xmax: 122, ymin: -9, ymax: 40, grid: false, axes: false, maxWidth: 620,
                params: { d: { min: 8, max: 118, step: 0.1, value: 90, slider: false } },
                points: [{ x: (p) => p.d, y: () => 0, drag: { x: 'd' }, color: 'violet', r: 8 }],
                extra: ({ plot, p, s }) => [
                  seg(plot, s, [-8, 0], [122, 0], { stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                  s('rect', { x: plot.X(-3), y: plot.Y(30), width: plot.X(3) - plot.X(-3), height: plot.Y(0) - plot.Y(30), class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                  seg(plot, s, [p.d, 0], [0, 30], { stroke: 'var(--amber)', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }),
                  wedge(plot, s, [0, 0], [p.d, 0], [0, 30], 42, 'fl-violet', 0.4),
                  label(plot, s, [0, 15], '30 m', 34, 4),
                  label(plot, s, [p.d / 2, 0], `${p.d.toFixed(1)} m`, 0, 22),
                ],
                readout: (p) => r`distance $${p.d.toFixed(1)}$ m: angle of elevation $= \tan^{-1}\frac{30}{${p.d.toFixed(1)}} = ${(Math.atan(30 / p.d) / D).toFixed(1)}°$`,
                goal: (p) => Math.abs(Math.atan(30 / p.d) / D - 30) < 0.1,
                hint: r`You need $\tan 30° = \frac{30}{d}$, so $d = \frac{30}{\tan 30°}$.`,
                solution: { d: 52 },
              },
              explain: r`$d = \frac{30}{\tan 30°} = 30\sqrt3 \approx 52$ m. Walking closer, the angle grows quickly; at 30 m away it would be 45°.`,
            },
            {
              type: 'numeric',
              title: 'From the cliff',
              prompt: r`From the top of an 80 m cliff, the angle of depression to a boat is 12°. How far is the boat from the foot of the cliff? (Nearest metre.)`,
              unit: 'm',
              answer: Math.round(80 / Math.tan(12 * D)),
              tol: 1,
              wrong: [{ v: Math.round(80 * Math.tan(12 * D)), tol: 1, why: r`The height is opposite the 12° angle at the boat: $d = \frac{80}{\tan 12°}$.` }],
              explain: r`The angle of depression from the cliff equals the angle of elevation from the boat (alternate angles). So $d = \frac{80}{\tan 12°} \approx 376$ m.`,
            },
            {
              type: 'numeric',
              title: 'Shadow of a flagpole',
              prompt: r`A 12 m flagpole casts an 18 m shadow on flat ground. How high is the Sun above the horizon, in degrees? (Nearest degree.)`,
              unit: '°',
              answer: Math.atan(12 / 18) / D,
              tol: 0.6,
              wrong: [{ v: Math.atan(18 / 12) / D, tol: 0.6, why: r`That's the angle at the top of the pole. The Sun's elevation is at the tip of the shadow: $\tan\theta = \frac{\text{opposite}}{\text{adjacent}} = \frac{12}{18}$.` }, { v: Math.asin(12 / 18) / D, tol: 0.6, why: 'The shadow is the adjacent side, not the hypotenuse, so use tangent.' }],
              explain: r`$\tan\theta = \frac{12}{18} \approx 0.667$, so $\theta = \tan^{-1}(0.667) \approx 34°$. Thales is said to have measured the Great Pyramid with shadows, waiting until they were as long as the objects casting them (the Sun at 45°).`,
            },
            {
              type: 'explain',
              title: 'When you can’t reach the base',
              body: r`To measure a mountain, you can't walk to the point directly below its summit. Instead, measure the elevation $\alpha$ from one point, walk a distance $d$ straight towards the mountain, and measure a larger elevation $\beta$. If the unknown remaining distance is $x$:
$$h = x \tan\beta = (x + d)\tan\alpha$$
Solving these two equations gives
$$h = \frac{d}{\cot\alpha - \cot\beta}, \qquad \cot\theta = \frac{1}{\tan\theta}$$`,
            },
            {
              type: 'mcq',
              title: 'Measuring Everest',
              prompt: r`In the 1850s the Great Trigonometrical Survey of India computed Everest's height from stations over 160 km away. Besides the angles, what else did they have to correct for?`,
              choices: [
                { t: 'The curvature of the Earth and the bending of light by the atmosphere', ok: true },
                { t: 'Nothing: the flat-ground formula is exact', why: 'Over 160 km, the Earth curves away by about 2 km, so the flat formula fails badly.' },
                { t: 'The speed of light', why: 'Light’s travel time doesn’t affect angles. Refraction and curvature do.' },
              ],
              explain: r`Over such distances, the Earth's curve hides about 2 km of height, and air bends light rays slightly downwards (refraction). Their result, 29,002 ft (8,840 m), was within about 10 m of today's GPS-based 8,848.86 m.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two sightings',
              prompt: r`The top of a hill is at an elevation of 30° from one point, and 45° from a point 100 m closer. How high is the hill? (1 decimal place.)`,
              unit: 'm',
              answer: 100 / (Math.sqrt(3) - 1),
              tol: 0.1,
              wrong: [{ v: 100, why: 'That would need the closer angle to be 90°. Use the two-angle formula.' }, { v: 50, tol: 0.1, why: r`$\cot 30° = \sqrt3 \approx 1.732$ and $\cot 45° = 1$.` }],
              explain: r`$h = \frac{100}{\cot 30° - \cot 45°} = \frac{100}{\sqrt3 - 1} \approx 136.6$ m. Check: from the nearer point, the hill is 136.6 m away horizontally (45°), and from the farther one 236.6 m, where $\frac{136.6}{236.6} = \tan 30°$. ✓`,
            },
          ],
          recap: [
            'Height = horizontal distance × tan(angle of elevation).',
            'Angles of depression from above equal angles of elevation from below.',
            r`Two sightings $d$ apart give $h = \frac{d}{\cot\alpha - \cot\beta}$.`,
          ],
        },
        {
          id: 'bearings',
          title: 'Bearings',
          summary: 'Navigating with angles',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Clockwise from north',
              body: r`Navigators give directions as **bearings**: angles measured **clockwise from north**, written with three digits. North is 000°, east 090°, south 180°, west 270°.

Travelling a distance $d$ on bearing $\theta$ moves you
$$d\sin\theta \text{ east}, \qquad d\cos\theta \text{ north}$$
(Sine and cosine swap places compared with maths angles, which start from east and turn anticlockwise.)`,
            },
            {
              type: 'mcq',
              title: 'South-west',
              prompt: r`What is the bearing of south-west?`,
              cols: 4,
              choices: [
                { t: '225°', ok: true },
                { t: '135°', why: 'That’s south-east. Go clockwise from north, past east and south.' },
                { t: '045°', why: 'That’s north-east.' },
                { t: '315°', why: 'That’s north-west.' },
              ],
              explain: r`South is 180°, and south-west is halfway on to west (270°): 225°.`,
            },
            {
              type: 'numeric',
              title: 'Heading east',
              prompt: r`A ship sails 20 km on a bearing of 060°. How far east has it travelled? (2 decimal places.)`,
              unit: 'km',
              answer: 20 * Math.sin(60 * D),
              tol: 0.01,
              wrong: [{ v: 10, why: r`That's the northward part, $20\cos 60°$. East is $20\sin 60°$.` }],
              explain: r`East: $20 \sin 60° \approx 17.32$ km. North: $20 \cos 60° = 10$ km.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set a course',
              prompt: r`An island lies 6 km east and 8 km north of your boat. Set the bearing and distance to land on it.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.5, xmax: 12.5, ymin: -2, ymax: 12, grid: 1, axes: false, maxWidth: 480,
                params: {
                  b: { min: 0, max: 180, step: 1, value: 70, label: 'bearing', color: 'violet', format: (v) => `${String(v).padStart(3, '0')}°` },
                  d: { min: 1, max: 14, step: 0.5, value: 5, label: 'distance', color: 'teal', format: (v) => `${fix(v, 1)} km` },
                },
                extra: ({ plot, p, s, arrow }) => {
                  const E = bearEnd(p);
                  return [
                    s('circle', { cx: plot.X(6), cy: plot.Y(8), r: plot.X(0.6) - plot.X(0), class: 'fl-green', opacity: 0.6 }),
                    label(plot, s, [6, 8], 'island', 0, -22),
                    arrow(plot.X(0), plot.Y(0), plot.X(0), plot.Y(3), { color: 'var(--ink-3)', width: 2.5, head: 10 }),
                    label(plot, s, [0, 3], 'N', 0, -10),
                    wedge(plot, s, [0, 3], [0, 0], E, 30, 'fl-violet', 0.35),
                    arrow(plot.X(0), plot.Y(0), plot.X(E[0]), plot.Y(E[1]), { color: 'var(--teal)', width: 4, head: 14 }),
                  ];
                },
                readout: (p) => {
                  const E = bearEnd(p);
                  return r`you end up $${E[0].toFixed(2)}$ km east, $${E[1].toFixed(2)}$ km north; $\;$ ${Math.hypot(E[0] - 6, E[1] - 8).toFixed(2)} km from the island`;
                },
                goal: (p) => { const E = bearEnd(p); return Math.hypot(E[0] - 6, E[1] - 8) < 0.3; },
                hint: r`Distance: Pythagoras on 6 and 8. Bearing: $\tan\theta = \frac{\text{east}}{\text{north}} = \frac{6}{8}$.`,
                solution: { b: 37, d: 10 },
              },
              explain: r`Distance $\sqrt{6^2 + 8^2} = 10$ km, bearing $\tan^{-1}\frac{6}{8} \approx 036.9°$. Converting between east/north components and bearing/distance is the core of navigation.`,
            },
            {
              type: 'numeric',
              title: 'The way back',
              prompt: r`You sailed out on a bearing of 060°. On what bearing must you sail to return directly?`,
              unit: '°',
              answer: 240,
              wrong: [{ v: 300, why: 'The back bearing is the opposite direction: add 180°.' }, { v: 120, why: 'Add 180° to reverse the direction.' }],
              explain: r`Reversing a direction adds (or subtracts) 180°: $060° + 180° = 240°$. This is the **back bearing**.`,
            },
            {
              type: 'numeric',
              title: 'A dog-leg',
              prompt: r`A ship sails 10 km on a bearing of 050°, then turns and sails 12 km on a bearing of 130°. The angle between the two legs at the turn is 100°. How far is it from its start? (2 decimal places.)`,
              unit: 'km',
              answer: Math.sqrt(100 + 144 - 240 * Math.cos(100 * D)),
              tol: 0.01,
              wrong: [{ v: Math.sqrt(100 + 144 - 240 * Math.cos(80 * D)), tol: 0.01, why: r`Use the angle **inside** the triangle at the turn, 100°.` }, { v: 22, why: 'The legs aren’t in a straight line: use the law of cosines.' }],
              hint: r`Law of cosines: $c^2 = 10^2 + 12^2 - 2 \cdot 10 \cdot 12 \cos 100°$.`,
              explain: r`$c^2 = 100 + 144 - 240\cos 100° \approx 244 + 41.7 = 285.7$, so $c \approx 16.90$ km. The 100° comes from turning 80° to starboard: the interior angle is $180° - 80°$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Heading home',
              prompt: r`A walker goes 8 km east, then 6 km south. On what bearing must they walk to head straight home? (Nearest degree.)`,
              unit: '°',
              answer: 307,
              tol: 0.6,
              wrong: [{ v: 53, tol: 0.6, why: 'Home is to the north-west of them, so the bearing is between 270° and 360°.' }, { v: 127, tol: 0.6, why: 'That’s the bearing from home to the walker. Reverse it by adding 180°.' }, { v: 233, tol: 0.6, why: 'Home is north-west of them, not south-west.' }],
              hint: 'Home is 8 km west and 6 km north of the walker.',
              explain: r`Home is 8 km west and 6 km north. The angle west of north is $\tan^{-1}\frac{8}{6} \approx 53.1°$, so the bearing is $360° - 53.1° \approx 307°$. (Distance: 10 km.)`,
            },
          ],
          recap: [
            'Bearings are measured clockwise from north, as three digits.',
            r`Distance $d$ on bearing $\theta$: $d\sin\theta$ east, $d\cos\theta$ north.`,
            'Back bearing = bearing ± 180°. Combine legs with components or the law of cosines.',
          ],
        },
      ],
    },
  ],
};
