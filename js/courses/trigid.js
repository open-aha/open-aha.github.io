import { wedge } from './_geo.js';
import { fix } from '../lib/svg.js';
const r = String.raw;
const D = Math.PI / 180;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d);
const f3 = (v) => fix(v, 3);
const degTicks = { xticks: 90, xfmt: (v) => `${v}°` };
const lineAngle = (m1, m2) => Math.atan(Math.abs((m2 - m1) / (1 + m1 * m2))) / D;
// claimed identities for the graphical test
const CLAIMS = [
  { tex: r`\cos^4 x - \sin^4 x = \cos 2x`, l: (x) => Math.cos(x) ** 4 - Math.sin(x) ** 4, r: (x) => Math.cos(2 * x) },
  { tex: r`\sin 3x = 3\sin x`, l: (x) => Math.sin(3 * x), r: (x) => 3 * Math.sin(x) },
  { tex: r`\sin\!\left(x + \tfrac{\pi}{2}\right) = \cos x`, l: (x) => Math.sin(x + Math.PI / 2), r: (x) => Math.cos(x) },
];
const piTicks = { xticks: Math.PI / 2, xfmt: (v) => ({ 0: '0', 1: 'π/2', 2: 'π', 3: '3π/2', 4: '2π' })[Math.round(v / (Math.PI / 2))] ?? '' };

export default {
  id: 'trigid',
  subject: 'math',
  title: 'Trigonometric Identities',
  level: 'Intermediate',
  cover: 'trigid',
  tagline: 'Addition, double angles, slopes, beats, proofs and equations: the relationships that tie sine and cosine together.',
  description: r`Sine and cosine are bound by beautiful relationships. See why $\sin^2\theta + \cos^2\theta = 1$, derive the angle-addition formulas, square sine waves with double angles, find the angle between lines, hear beats in a sum of waves, learn to prove and disprove identities, and solve trig equations with all their solutions.`,
  prereq: 'Trigonometry',
  chapters: [
    {
      title: 'Core Identities',
      summary: 'From the unit circle.',
      lessons: [
        {
          id: 'pythagorean',
          title: 'The Pythagorean Identity',
          summary: 'sin² + cos² = 1',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Around the circle',
              body: r`On the unit circle, the point at angle $\theta$ is $(\cos\theta, \sin\theta)$. Drag it around and watch the right triangle it makes.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.25, ymax: 1.25, grid: 0.5, axes: { xlabel: 'x', ylabel: 'y' }, maxWidth: 440,
                params: { t: { min: 0, max: 359, step: 1, value: 40, slider: false } },
                extra: ({ plot, p, s }) => {
                  const c = Math.cos(p.t * D), sn = Math.sin(p.t * D);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(c), y2: plot.Y(sn), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(c), y2: plot.Y(0), stroke: 'var(--blue)', 'stroke-width': 5 }),
                    s('line', { x1: plot.X(c), y1: plot.Y(0), x2: plot.X(c), y2: plot.Y(sn), stroke: 'var(--coral)', 'stroke-width': 5 }),
                  ];
                },
                points: [{ x: (p) => Math.cos(p.t * D), y: (p) => Math.sin(p.t * D), drag: { fn: (x, y) => ({ t: ((Math.atan2(y, x) / D) % 360 + 360) % 360 }), key: 't' }, color: 'violet' }],
                readout: (p) => {
                  const c = Math.cos(p.t * D), sn = Math.sin(p.t * D);
                  return r`$\theta = ${Math.round(p.t)}°$: $\;\blue{\cos^2\theta} + \coral{\sin^2\theta} = ${f3(c * c)} + ${f3(sn * sn)} = ${f3(c * c + sn * sn)}$`;
                },
              },
              after: r`The triangle has legs $|\cos\theta|$ and $|\sin\theta|$ and hypotenuse 1, so by Pythagoras, for **every** angle:
$$\sin^2\theta + \cos^2\theta = 1$$`,
            },
            {
              type: 'numeric',
              title: 'Find the cosine',
              prompt: r`An acute angle has $\sin\theta = 0.6$. What is $\cos\theta$?`,
              lhs: r`$\cos\theta =$`,
              answer: 0.8,
              wrong: [{ v: 0.4, why: r`It's $\sin^2 + \cos^2 = 1$, not $\sin + \cos = 1$: $\cos\theta = \sqrt{1 - 0.36}$.` }, { v: 0.64, why: r`That's $\cos^2\theta$. Take the square root.` }, { v: -0.8, why: 'For an acute angle, cosine is positive.' }],
              explain: r`$\cos^2\theta = 1 - 0.36 = 0.64$, so $\cos\theta = 0.8$ (positive, since $\theta$ is acute). This is the familiar 3–4–5 triangle in disguise.`,
            },
            {
              type: 'numeric',
              title: 'In the second quadrant',
              prompt: r`Now $\sin\theta = 0.6$ but $\theta$ is between 90° and 180°. What is $\cos\theta$?`,
              lhs: r`$\cos\theta =$`,
              answer: -0.8,
              wrong: [{ v: 0.8, why: 'Between 90° and 180°, the point on the unit circle is left of the y-axis, so cosine is negative.' }],
              explain: r`$\cos^2\theta = 0.64$ still, but the identity only gives $\cos\theta = \pm 0.8$. The quadrant decides: in the second quadrant $x < 0$, so $\cos\theta = -0.8$. (The angle is about 143°.)`,
            },
            {
              type: 'numeric',
              title: 'Tangent from sine',
              prompt: r`An acute angle has $\sin\theta = \frac{5}{13}$. What is $\tan\theta$? (4 decimal places.)`,
              lhs: r`$\tan\theta =$`,
              answer: 5 / 12,
              tol: 0.0005,
              wrong: [{ v: 5 / 13, tol: 0.0005, why: r`That's $\sin\theta$. Find $\cos\theta$ first, then $\tan = \frac{\sin}{\cos}$.` }, { v: 12 / 13, tol: 0.0005, why: r`That's $\cos\theta$. Now divide: $\tan\theta = \frac{5/13}{12/13}$.` }],
              explain: r`$\cos\theta = \sqrt{1 - \frac{25}{169}} = \frac{12}{13}$, so $\tan\theta = \frac{5}{12} \approx 0.4167$: the 5–12–13 triangle.`,
            },
            {
              type: 'mcq',
              title: 'Simplify',
              prompt: r`Simplify $\dfrac{1 - \cos^2 x}{\sin x}$ (where $\sin x \ne 0$).`,
              cols: 2,
              choices: [
                { t: r`$\sin x$`, ok: true },
                { t: r`$\cos x$`, why: r`$1 - \cos^2 x = \sin^2 x$, and $\frac{\sin^2 x}{\sin x} = \sin x$.` },
                { t: r`$1$`, why: r`The numerator is $\sin^2 x$, not $\sin x$.` },
                { t: r`$\tan x$`, why: r`No cosine survives: $\frac{\sin^2 x}{\sin x} = \sin x$.` },
              ],
              explain: r`Replace $1 - \cos^2 x$ by $\sin^2 x$, then cancel one $\sin x$. Spotting "$1 - \cos^2$" or "$1 - \sin^2$" is the most common simplification trick.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Another form',
              prompt: r`Divide $\sin^2\theta + \cos^2\theta = 1$ by $\cos^2\theta$. What identity do you get?`,
              choices: [
                { t: r`$\tan^2\theta + 1 = \sec^2\theta$`, ok: true },
                { t: r`$\tan^2\theta = 1$`, why: r`Each term must be divided: $\frac{\sin^2}{\cos^2} + \frac{\cos^2}{\cos^2} = \frac{1}{\cos^2}$.` },
                { t: r`$1 + \cot^2\theta = \csc^2\theta$`, why: r`That comes from dividing by $\sin^2\theta$ instead.` },
              ],
              explain: r`$\dfrac{\sin^2\theta}{\cos^2\theta} + 1 = \dfrac{1}{\cos^2\theta}$, that is, $\tan^2\theta + 1 = \sec^2\theta$, where $\sec\theta = 1/\cos\theta$. Many identities are the same fact rearranged.`,
            },
          ],
          recap: [
            r`$\sin^2\theta + \cos^2\theta = 1$, from Pythagoras on the unit circle.`,
            'Knowing one ratio (and the quadrant) gives the other.',
            r`Dividing through gives $\tan^2\theta + 1 = \sec^2\theta$.`,
          ],
        },
        {
          id: 'addition',
          title: 'Angle Addition',
          summary: 'sin(A + B) and cos(A + B)',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'A tempting mistake',
              prompt: r`Is $\sin(30° + 60°) = \sin 30° + \sin 60°$?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`$\sin 90° = 1$, but $\sin 30° + \sin 60° = 0.5 + 0.866 = 1.366$.` },
              ],
              explain: r`$\sin 90° = 1$, while $\sin 30° + \sin 60° \approx 1.366$. Sine doesn't distribute over addition. So what **is** $\sin(A + B)$?`,
            },
            {
              type: 'explain',
              title: 'The addition formulas',
              body: r`Rotating the point $(\cos A, \sin A)$ by a further angle $B$ (with the rotation matrix from the Vectors & Matrices course) lands it at $(\cos(A + B), \sin(A + B))$. Working it out gives:
$$\sin(A + B) = \sin A\cos B + \cos A\sin B$$
$$\cos(A + B) = \cos A\cos B - \sin A\sin B$$
Replacing $B$ with $-B$ gives the subtraction versions, since $\sin(-B) = -\sin B$ and $\cos(-B) = \cos B$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Test the formula',
              body: r`Choose two angles. The violet point sits at angle $A + B$ on the unit circle; its height is $\sin(A + B)$. Compare it with the formula.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.35, xmax: 1.35, ymin: -1.25, ymax: 1.25, grid: 0.5, axes: false, maxWidth: 420,
                params: {
                  A: { min: 0, max: 180, step: 5, value: 30, label: '$A$', color: 'blue', format: (v) => `${v}°` },
                  B: { min: 0, max: 180, step: 5, value: 45, label: '$B$', color: 'coral', format: (v) => `${v}°` },
                },
                extra: ({ plot, p, s }) => {
                  const a = p.A * D, ab = (p.A + p.B) * D;
                  const R = plot.X(1) - plot.X(0);
                  const arc = (t0, t1, rr, color) => {
                    if (t1 - t0 < 0.01) return null;
                    const x0 = plot.X(rr * Math.cos(t0)), y0 = plot.Y(rr * Math.sin(t0)), x1 = plot.X(rr * Math.cos(t1)), y1 = plot.Y(rr * Math.sin(t1));
                    return s('path', { d: `M${x0} ${y0} A${rr * R} ${rr * R} 0 ${t1 - t0 > Math.PI ? 1 : 0} 0 ${x1} ${y1}`, fill: 'none', stroke: color, 'stroke-width': 4 });
                  };
                  return [
                    s('line', { x1: plot.X(-1.25), x2: plot.X(1.25), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.5 }),
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.2), y2: plot.Y(1.2), stroke: 'var(--axis)', 'stroke-width': 1.5 }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: R, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    arc(0, a, 0.3, 'var(--blue)'),
                    arc(a, ab, 0.4, 'var(--coral)'),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(Math.cos(a)), y2: plot.Y(Math.sin(a)), stroke: 'var(--blue)', 'stroke-width': 2.5 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(Math.cos(ab)), y2: plot.Y(Math.sin(ab)), stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(Math.cos(ab)), y1: plot.Y(0), x2: plot.X(Math.cos(ab)), y2: plot.Y(Math.sin(ab)), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
                    s('circle', { cx: plot.X(Math.cos(ab)), cy: plot.Y(Math.sin(ab)), r: 7, class: 'fl-violet' }),
                  ].filter(Boolean);
                },
                readout: (p) => {
                  const a = p.A * D, b = p.B * D;
                  return r`$\sin(A{+}B) = ${f3(Math.sin(a + b))}$; $\;\sin A\cos B + \cos A\sin B = ${f3(Math.sin(a) * Math.cos(b))} + ${f3(Math.cos(a) * Math.sin(b))} = ${f3(Math.sin(a) * Math.cos(b) + Math.cos(a) * Math.sin(b))}$`;
                },
              },
              after: r`The two always agree, for every pair of angles, even beyond 180°.`,
            },
            {
              type: 'numeric',
              title: 'sin 75°',
              prompt: r`Use $75° = 45° + 30°$ to find $\sin 75°$. (4 decimal places.)`,
              answer: Math.sin(75 * D),
              tol: 0.0002,
              wrong: [{ v: 1.2071, tol: 0.0003, why: r`That's $\sin 45° + \sin 30°$. Use the formula: $\sin 45°\cos 30° + \cos 45°\sin 30°$.` }, { v: 0.2588, tol: 0.0003, why: r`That's $\sin 15°$, from the subtraction formula. Here you need the **sum**.` }],
              explain: r`$\sin 75° = \dfrac{\sqrt2}{2}\cdot\dfrac{\sqrt3}{2} + \dfrac{\sqrt2}{2}\cdot\dfrac12 = \dfrac{\sqrt6 + \sqrt2}{4} \approx 0.9659$.`,
            },
            {
              type: 'numeric',
              title: 'cos 105°',
              prompt: r`Use $105° = 60° + 45°$ to find $\cos 105°$. (4 decimal places.)`,
              answer: Math.cos(105 * D),
              tol: 0.0002,
              wrong: [{ v: Math.cos(15 * D), tol: 0.0003, why: r`That's $\cos 15°$. For a sum, the cosine formula has a **minus**: $\cos A\cos B - \sin A\sin B$.` }, { v: 1.2071, tol: 0.0003, why: 'Cosine doesn’t distribute over addition either.' }],
              explain: r`$\cos 105° = \frac12\cdot\frac{\sqrt2}{2} - \frac{\sqrt3}{2}\cdot\frac{\sqrt2}{2} = \frac{\sqrt2 - \sqrt6}{4} \approx -0.2588$. Negative, as it should be for an angle past 90°.`,
            },
            {
              type: 'mcq',
              title: 'Double angles',
              prompt: r`Put $A = B = x$ into the addition formulas. Which of these is **not** a correct result?`,
              choices: [
                { t: r`$\sin 2x = 2\sin x$`, ok: true },
                { t: r`$\sin 2x = 2\sin x\cos x$`, why: r`This one is correct: $\sin(x + x) = \sin x\cos x + \cos x\sin x$.` },
                { t: r`$\cos 2x = \cos^2 x - \sin^2 x$`, why: 'This one is correct: it comes straight from the cosine addition formula.' },
                { t: r`$\cos 2x = 1 - 2\sin^2 x$`, why: r`This one is correct too: substitute $\cos^2 x = 1 - \sin^2 x$.` },
              ],
              explain: r`The double-angle formulas are $\sin 2x = 2\sin x\cos x$ and $\cos 2x = \cos^2 x - \sin^2 x = 1 - 2\sin^2 x = 2\cos^2 x - 1$. The first explains why a projectile's range, $\tfrac{v^2}{g}\sin 2\theta$, is greatest at $45°$.`,
            },
            {
              type: 'numeric',
              title: 'cos 2x from sin x',
              prompt: r`If $\sin x = 0.6$, what is $\cos 2x$?`,
              lhs: r`$\cos 2x =$`,
              answer: 0.28,
              wrong: [{ v: 1.6, why: r`Use $\cos 2x = 1 - 2\sin^2 x$, not $2\cos x$.` }, { v: 0.64, why: r`That's $\cos^2 x$. Use $1 - 2\sin^2 x = 1 - 2(0.36)$.` }],
              explain: r`$\cos 2x = 1 - 2\sin^2 x = 1 - 0.72 = 0.28$. Choosing the version of $\cos 2x$ that matches what you know saves work, and you don't even need to know the quadrant.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two triangles combined',
              prompt: r`Acute angles $A$ and $B$ have $\sin A = \frac35$ and $\cos B = \frac{5}{13}$. Find $\sin(A + B)$. (4 decimal places.)`,
              answer: 63 / 65,
              tol: 0.0003,
              wrong: [{ v: 33 / 65, tol: 0.0003, why: r`That's $\sin(A - B)$ with the wrong sign, or $\cos$. Use $\sin A\cos B + \cos A\sin B$.` }, { v: 3 / 5 + 5 / 13, tol: 0.0005, why: 'Sine doesn’t add like that: use the addition formula.' }],
              hint: r`First find $\cos A$ and $\sin B$ from the Pythagorean identity.`,
              explain: r`$\cos A = \frac45$ and $\sin B = \frac{12}{13}$ (3–4–5 and 5–12–13 triangles). So $\sin(A + B) = \frac35\cdot\frac{5}{13} + \frac45\cdot\frac{12}{13} = \frac{15 + 48}{65} = \frac{63}{65} \approx 0.9692$. No calculator needed for the angles themselves.`,
            },
          ],
          recap: [
            r`$\sin(A + B) = \sin A\cos B + \cos A\sin B$.`,
            r`$\cos(A + B) = \cos A\cos B - \sin A\sin B$.`,
            r`Double angles: $\sin 2x = 2\sin x\cos x$ and $\cos 2x = 1 - 2\sin^2 x$.`,
          ],
        },
        {
          id: 'double',
          title: 'Double & Half Angles',
          summary: 'Squares of sines are waves too',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Three versions of cos 2x',
              body: r`From the addition formulas with $A = B = x$:
$$\sin 2x = 2\sin x\cos x$$
$$\cos 2x = \cos^2 x - \sin^2 x = 1 - 2\sin^2 x = 2\cos^2 x - 1$$
Rearranging the last two gives the **power-reduction** formulas, which turn squares into plain waves:
$$\sin^2 x = \frac{1 - \cos 2x}{2}, \qquad \cos^2 x = \frac{1 + \cos 2x}{2}$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Squaring a sine wave',
              prompt: r`The dashed curve is $\sin^2 x$. Choose $a$, $b$ and $k$ so the violet wave $a + b\cos(kx)$ lies exactly on it.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * Math.PI, ymin: -1.2, ymax: 1.2, grid: Math.PI / 2, gridY: 0.5, height: 280, axes: { xlabel: 'x', ylabel: 'y', ...piTicks },
                params: {
                  a: { min: -1, max: 1, step: 0.25, value: 0, label: '$a$', color: 'blue', format: (v) => f2(v) },
                  b: { min: -1, max: 1, step: 0.25, value: 1, label: '$b$', color: 'coral', format: (v) => f2(v) },
                  k: { min: 1, max: 4, step: 1, value: 1, label: '$k$', color: 'teal' },
                },
                curves: [{ f: (x) => Math.sin(x) ** 2, color: 'ink', dash: true, width: 3 }, { f: (x, p) => p.a + p.b * Math.cos(p.k * x), color: 'violet' }],
                readout: (p) => r`$y = ${f2(p.a)} ${p.b < 0 ? '-' : '+'} ${f2(Math.abs(p.b))}\cos(${p.k}x)$`,
                goal: (p) => p.a === 0.5 && p.b === -0.5 && p.k === 2,
                hint: r`$\sin^2 x$ wobbles between 0 and 1 (so its centre line is at $\frac12$), twice per $2\pi$, starting at its lowest point.`,
                solution: { a: 0.5, b: -0.5, k: 2 },
              },
              explain: r`$\sin^2 x = \frac12 - \frac12\cos 2x$: a cosine wave at **double** the frequency, flipped and lifted to sit between 0 and 1. Squaring a wave doubles its frequency, a fact that turns up in radio, optics and AC power.`,
            },
            {
              type: 'mcq',
              title: 'The average of sin²',
              prompt: r`What is the average value of $\sin^2 x$ over a full cycle?`,
              cols: 4,
              choices: [
                { t: r`$\frac12$`, ok: true },
                { t: '0', why: r`$\sin^2 x$ is never negative, so its average can't be 0.` },
                { t: '1', why: 'It only reaches 1 at its peaks.' },
                { t: r`$\frac{1}{\sqrt2}$`, why: r`That's the square root of the average: the "root mean square" of $\sin x$.` },
              ],
              explain: r`$\sin^2 x = \frac12 - \frac12\cos 2x$, and the cosine part averages to zero, leaving $\frac12$. That's why AC electricity is quoted by its **RMS** value, $V_{\text{peak}}/\sqrt2$: UK mains at 230 V RMS actually peaks at about 325 V.`,
            },
            {
              type: 'numeric',
              title: 'Half angle',
              prompt: r`Use $\sin^2 x = \frac{1 - \cos 2x}{2}$ with $x = 15°$ to find $\sin 15°$. (4 decimal places.)`,
              answer: Math.sin(15 * D),
              tol: 0.0002,
              wrong: [{ v: (1 - Math.cos(30 * D)) / 2, tol: 0.0003, why: r`That's $\sin^2 15°$. Take the square root.` }],
              explain: r`$\sin^2 15° = \frac{1 - \cos 30°}{2} = \frac{1 - 0.866}{2} \approx 0.0670$, so $\sin 15° \approx 0.2588$ (positive, as 15° is acute). This **half-angle** method gives exact values for 15°, 7.5°, 3.75° and so on: tables of sines were once built exactly this way.`,
            },
            {
              type: 'numeric',
              title: 'Same range',
              prompt: r`A projectile's range on flat ground is $R = \frac{v^2}{g}\sin 2\theta$. A ball launched at 30° lands 35 m away. What **other** launch angle gives the same range?`,
              unit: '°',
              answer: 60,
              wrong: [{ v: 150, why: 'Launch angles must be between 0° and 90°.' }, { v: 45, why: 'At 45° the range is the maximum, longer than at 30°.' }],
              explain: r`$\sin 2\theta$ must equal $\sin 60°$. Since $\sin 120° = \sin 60°$ too, $2\theta = 120°$ gives $\theta = 60°$. Complementary angles $\theta$ and $90° - \theta$ always give the same range: one high and slow, one low and fast.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Triple angle',
              prompt: r`Expanding $\sin(2x + x)$ with the formulas gives $\sin 3x = 3\sin x - 4\sin^3 x$. Use it to find $\sin 3x$ when $\sin x = \frac13$. (4 decimal places.)`,
              answer: 23 / 27,
              tol: 0.0003,
              wrong: [{ v: 1, why: r`$\sin 3x \neq 3\sin x$. Include the $-4\sin^3 x$ term.` }],
              explain: r`$3 \cdot \frac13 - 4 \cdot \frac{1}{27} = 1 - \frac{4}{27} = \frac{23}{27} \approx 0.8519$. Check with $x = 30°$: $3(0.5) - 4(0.125) = 1 = \sin 90°$ ✓.`,
            },
          ],
          recap: [
            r`$\cos 2x = \cos^2 x - \sin^2 x = 1 - 2\sin^2 x = 2\cos^2 x - 1$.`,
            r`Power reduction: $\sin^2 x = \frac{1 - \cos 2x}{2}$, so $\sin^2$ averages $\frac12$.`,
            'Half-angle formulas give exact values for smaller and smaller angles.',
          ],
        },
      ],
    },
    {
      title: 'Using Identities',
      summary: 'Waves and equations.',
      lessons: [
        {
          id: 'tangent',
          title: 'Tangent & Slopes',
          summary: 'The angle between two lines',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Slope is a tangent',
              body: r`A line rising at angle $\theta$ to the horizontal has slope $m = \tan\theta$: up $\sin\theta$ for every $\cos\theta$ across. Dividing the addition formulas for $\sin(A + B)$ and $\cos(A + B)$ by $\cos A\cos B$ gives
$$\tan(A + B) = \frac{\tan A + \tan B}{1 - \tan A\tan B}, \qquad \tan(A - B) = \frac{\tan A - \tan B}{1 + \tan A\tan B}$$`,
            },
            {
              type: 'numeric',
              title: 'tan 75°',
              prompt: r`Use $75° = 45° + 30°$ with $\tan 45° = 1$ and $\tan 30° = \frac{1}{\sqrt3}$ to find $\tan 75°$. (3 decimal places.)`,
              answer: Math.tan(75 * D),
              tol: 0.001,
              wrong: [{ v: 1 + 1 / Math.sqrt(3), tol: 0.002, why: r`Don't forget to divide by $1 - \tan A\tan B$.` }],
              explain: r`$\tan 75° = \frac{1 + 1/\sqrt3}{1 - 1/\sqrt3} = \frac{\sqrt3 + 1}{\sqrt3 - 1} = 2 + \sqrt3 \approx 3.732$.`,
            },
            {
              type: 'explain',
              title: 'Angle between lines',
              body: r`Two lines with slopes $m_1 = \tan A$ and $m_2 = \tan B$ meet at angle $\theta = B - A$. The subtraction formula gives
$$\tan\theta = \left|\frac{m_2 - m_1}{1 + m_1 m_2}\right|$$
When $m_1 m_2 = -1$, the denominator is zero, $\tan\theta$ is undefined, and the lines are **perpendicular**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make 45°',
              prompt: r`The teal line has slope $\frac12$. Drag the violet line (steeper than the teal one) until the angle between them is exactly 45°.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.6, xmax: 4.6, ymin: -0.6, ymax: 4.6, grid: 1, axes: false, maxWidth: 420,
                params: { m: { min: 0.6, max: 8, step: 0.05, value: 1.5, slider: false } },
                points: [{ x: (p) => 4 / Math.hypot(1, p.m), y: (p) => (4 * p.m) / Math.hypot(1, p.m), drag: { key: 'm', fn: (x, y) => ({ m: Math.max(0.6, Math.min(8, y / Math.max(x, 0.05))) }) }, color: 'violet', r: 8 }],
                extra: ({ plot, p, s }) => {
                  const P1 = [4 / Math.hypot(1, 0.5), 2 / Math.hypot(1, 0.5)], P2 = [4 / Math.hypot(1, p.m), (4 * p.m) / Math.hypot(1, p.m)];
                  return [
                    s('line', { x1: plot.X(-0.5), x2: plot.X(4.5), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.5 }),
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-0.5), y2: plot.Y(4.5), stroke: 'var(--axis)', 'stroke-width': 1.5 }),
                    wedge(plot, s, P1, [0, 0], P2, 60, 'fl-violet', 0.3),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(P1[0]), y2: plot.Y(P1[1]), stroke: 'var(--teal)', 'stroke-width': 4 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(P2[0]), y2: plot.Y(P2[1]), stroke: 'var(--violet)', 'stroke-width': 4 }),
                  ];
                },
                readout: (p) => r`$m_2 = ${f2(p.m)}$: $\;\tan\theta = \frac{${f2(p.m)} - 0.5}{1 + 0.5 \times ${f2(p.m)}} = ${f3((p.m - 0.5) / (1 + 0.5 * p.m))}$, $\;\theta = ${lineAngle(0.5, p.m).toFixed(1)}°$`,
                goal: (p) => Math.abs(lineAngle(0.5, p.m) - 45) < 0.3,
                hint: r`Solve $\frac{m - 0.5}{1 + 0.5m} = 1$.`,
                solution: { m: 3 },
              },
              explain: r`$\frac{m - 0.5}{1 + 0.5m} = 1$ gives $m - 0.5 = 1 + 0.5m$, so $m = 3$. Lines with slopes $\frac12$ and $3$ always cross at 45°.`,
            },
            {
              type: 'numeric',
              title: 'Perpendicular',
              prompt: r`A line has slope 2. What slope must a perpendicular line have?`,
              answer: -0.5,
              wrong: [{ v: 0.5, why: r`Perpendicular slopes multiply to $-1$: the sign flips too.` }, { v: -2, why: r`$2 \times (-2) = -4$, not $-1$.` }],
              explain: r`$m_1 m_2 = -1$, so $m_2 = -\frac12$. Rotating a line by 90° swaps "up" and "across" and flips one sign.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A surprising sum',
              prompt: r`Angles $A$ and $B$ have $\tan A = \frac12$ and $\tan B = \frac13$. What is $A + B$, in degrees?`,
              unit: '°',
              answer: 45,
              wrong: [{ v: 1, why: r`$\tan(A + B) = 1$, so what angle is $A + B$?` }, { v: 50, why: r`Use the formula: $\tan(A + B) = \frac{1/2 + 1/3}{1 - 1/6}$.` }],
              explain: r`$\tan(A + B) = \frac{\frac12 + \frac13}{1 - \frac16} = \frac{5/6}{5/6} = 1$, so $A + B = 45°$. Draw it on squared paper: the angles in a 1×2 and a 1×3 right triangle add to exactly half a right angle. In 1706, John Machin used a similar identity to compute 100 digits of $\pi$.`,
            },
          ],
          recap: [
            r`Slope $= \tan(\text{angle of inclination})$.`,
            r`$\tan(A \pm B) = \frac{\tan A \pm \tan B}{1 \mp \tan A\tan B}$.`,
            r`Angle between lines: $\tan\theta = \left|\frac{m_2 - m_1}{1 + m_1 m_2}\right|$; perpendicular when $m_1m_2 = -1$.`,
          ],
        },
        {
          id: 'combining',
          title: 'Adding Sine and Cosine',
          summary: 'Always another sine wave',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A surprising sum',
              body: r`Add $a\sin x$ and $b\cos x$. The violet curve is the sum. The dashed curve is a single shifted sine wave, $R\sin(x + \alpha)$, with $R = \sqrt{a^2 + b^2}$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * Math.PI, ymin: -5.5, ymax: 5.5, grid: Math.PI / 2, gridY: 1, height: 300, axes: { xlabel: 'x', ylabel: 'y', ...piTicks },
                params: {
                  a: { min: -4, max: 4, step: 0.5, value: 3, label: '$a$', color: 'blue', format: (v) => f2(v, 1) },
                  b: { min: -4, max: 4, step: 0.5, value: 4, label: '$b$', color: 'coral', format: (v) => f2(v, 1) },
                },
                curves: [
                  { f: (x, p) => p.a * Math.sin(x), color: 'blue' },
                  { f: (x, p) => p.b * Math.cos(x), color: 'coral' },
                  { f: (x, p) => p.a * Math.sin(x) + p.b * Math.cos(x), color: 'violet', width: 5 },
                  { f: (x, p) => Math.hypot(p.a, p.b) * Math.sin(x + Math.atan2(p.b, p.a)), color: 'ink', dash: true },
                ],
                readout: (p) => r`$${f2(p.a, 1)}\sin x ${p.b < 0 ? '-' : '+'} ${f2(Math.abs(p.b), 1)}\cos x = ${f2(Math.hypot(p.a, p.b))}\sin(x ${Math.atan2(p.b, p.a) < 0 ? '-' : '+'} ${f2(Math.abs(Math.atan2(p.b, p.a)))})$`,
              },
              after: r`The dashed curve lies exactly on top of the sum. Adding a sine and a cosine of the **same frequency** always gives a single sine wave with amplitude $\sqrt{a^2 + b^2}$, shifted by an angle $\alpha$ with $\tan\alpha = b/a$. It's the addition formula read backwards: $R\sin(x + \alpha) = R\cos\alpha\sin x + R\sin\alpha\cos x$.`,
            },
            { /*anim:trigid*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Spinning arrows',
              body: r`Think of {blue:$3\sin x$} as the height of an arrow of length 3 spinning round, and {teal:$4\cos x$} as the height of an arrow of length 4 that is always a quarter turn ahead. Put the arrows tip to tail and let them spin together.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5.6, xmax: 13, ymin: -5.4, ymax: 5.4, grid: false, axes: false,
                animate: { param: 't', speed: 0.8, max: 2 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const x = p.t, A = [3 * Math.cos(x), 3 * Math.sin(x)], B = [A[0] + 4 * Math.cos(x + Math.PI / 2), A[1] + 4 * Math.sin(x + Math.PI / 2)];
                  const gx = (u) => 6.4 + (u / (2 * Math.PI)) * 6.4, els = [];
                  const L = (x1, y1, x2, y2, o) => s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), 'stroke-linecap': 'round', ...o });
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(5) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5 }));
                  els.push(L(6.2, 0, 13, 0, { stroke: 'var(--axis)', 'stroke-width': 1.2 }), L(6.4, -5.2, 6.4, 5.2, { stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  // traces so far
                  const tr = (f, col, w, dash) => { const pts = []; for (let i = 0; i <= 120; i++) { const u = (x * i) / 120; pts.push([plot.X(gx(u)), plot.Y(f(u))]); } return s('path', { d: pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)} ${b.toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${col})`, 'stroke-width': w, 'stroke-dasharray': dash ? '5 5' : null }); };
                  els.push(tr((u) => 3 * Math.sin(u), 'blue', 2, true), tr((u) => 4 * Math.cos(u), 'teal', 2, true), tr((u) => 3 * Math.sin(u) + 4 * Math.cos(u), 'violet', 3.5));
                  // the arrows
                  els.push(L(0, 0, B[0], B[1], { stroke: 'var(--violet)', 'stroke-width': 4 }));
                  els.push(L(0, 0, A[0], A[1], { stroke: 'var(--blue)', 'stroke-width': 3.5 }), L(A[0], A[1], B[0], B[1], { stroke: 'var(--teal)', 'stroke-width': 3.5 }));
                  els.push(L(B[0], B[1], gx(x), B[1], { stroke: 'var(--violet)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
                  els.push(s('circle', { cx: plot.X(B[0]), cy: plot.Y(B[1]), r: 5, class: 'fl-violet' }), s('circle', { cx: plot.X(gx(x)), cy: plot.Y(B[1]), r: 5, class: 'fl-violet' }));
                  return els;
                },
                readout: (p) => r`$x = ${fix((p.t * 180) / Math.PI, 0)}°$: $\;\blue{3\sin x} + \teal{4\cos x} = \violet{${fix(3 * Math.sin(p.t) + 4 * Math.cos(p.t), 2)}}$`,
              },
              after: r`The two arrows are locked at a right angle, so together they form a rigid triangle with sides 3 and 4, and the {violet:arrow from the centre to the tip} has length $\sqrt{3^2 + 4^2} = 5$. It spins at the same rate, just $\alpha = 53.1°$ ahead of the blue one. Its height is therefore $5\sin(x + 53.1°)$: adding waves of the same frequency is adding arrows. Engineers call these spinning arrows **phasors** and use them for every AC circuit.`,
            },
            {
              type: 'numeric',
              title: 'Maximum value',
              prompt: r`What is the largest value of $3\sin x + 4\cos x$?`,
              answer: 5,
              wrong: [{ v: 7, why: r`The two parts don't peak at the same $x$. The combined amplitude is $\sqrt{3^2 + 4^2}$.` }, { v: 4, why: r`The sum can exceed either part alone: $R = \sqrt{9 + 16}$.` }],
              explain: r`$3\sin x + 4\cos x = 5\sin(x + \alpha)$ with $\alpha \approx 53°$, so the maximum is **5**. In physics, this is how two oscillations of the same frequency combine, as in AC circuits.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the shift',
              prompt: r`The dashed curve is $\sin x + \sqrt3\cos x$. Set $R$ and $\alpha$ so that $R\sin(x + \alpha)$ matches it.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * Math.PI, ymin: -3.2, ymax: 3.2, grid: Math.PI / 2, gridY: 1, height: 280, axes: { xlabel: 'x', ylabel: 'y', ...piTicks },
                params: {
                  R: { min: 0.5, max: 3, step: 0.25, value: 1, label: '$R$', color: 'violet', format: (v) => f2(v) },
                  al: { min: 0, max: 180, step: 15, value: 0, label: r`$\alpha$`, color: 'teal', format: (v) => `${v}°` },
                },
                curves: [{ f: (x) => Math.sin(x) + Math.sqrt(3) * Math.cos(x), color: 'ink', dash: true, width: 3 }, { f: (x, p) => p.R * Math.sin(x + p.al * D), color: 'violet' }],
                readout: (p) => r`$y = ${f2(p.R)}\sin(x + ${p.al}°)$`,
                goal: (p) => p.R === 2 && p.al === 60,
                hint: r`$R = \sqrt{1^2 + (\sqrt3)^2}$ and $\tan\alpha = \frac{\sqrt3}{1}$.`,
                solution: { R: 2, al: 60 },
              },
              explain: r`$R = \sqrt{1 + 3} = 2$ and $\tan\alpha = \sqrt3$, so $\alpha = 60°$: $\sin x + \sqrt3\cos x = 2\sin(x + 60°)$. Check at $x = 0$: left side $\sqrt3$, right side $2\sin 60° = \sqrt3$ ✓.`,
            },
            {
              type: 'numeric',
              title: 'Minimum value',
              prompt: r`What is the smallest value of $5\sin x - 12\cos x$?`,
              answer: -13,
              wrong: [{ v: -12, why: r`The minimum is $-\sqrt{5^2 + 12^2}$.` }, { v: -17, why: 'The two parts don’t reach their extremes at the same x.' }, { v: 13, why: 'That’s the maximum.' }],
              explain: r`$5\sin x - 12\cos x = 13\sin(x - \alpha)$, which ranges from $-13$ to $13$.`,
            },
            {
              type: 'numeric',
              title: 'Period of a combination',
              prompt: r`$\sin 3x + \cos 3x$ can be written as $\sqrt2\sin(3x + 45°)$. What is its period, in degrees?`,
              unit: '°',
              answer: 120,
              explain: r`$\frac{360°}{3} = 120°$. Combining a sine and cosine of the same frequency changes the amplitude and phase but never the period.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'When is the peak?',
              prompt: r`$3\sin x + 4\cos x = 5\sin(x + \alpha)$ with $\tan\alpha = \frac43$. At what angle $x$ between 0° and 360° does it reach its maximum? (Nearest degree.)`,
              unit: '°',
              answer: 37,
              tol: 0.6,
              wrong: [{ v: 53, tol: 0.6, why: r`That's $\alpha$. The peak is where $x + \alpha = 90°$.` }, { v: 90, why: r`$\sin(x + \alpha)$ peaks when $x + \alpha = 90°$, not when $x = 90°$.` }],
              explain: r`$\alpha = \tan^{-1}\frac43 \approx 53.13°$, and the peak needs $x + \alpha = 90°$, so $x \approx 36.87° \approx 37°$. Check: $3\sin 36.87° + 4\cos 36.87° = 3(0.6) + 4(0.8) = 5$ ✓.`,
            },
          ],
          recap: [
            r`$a\sin x + b\cos x = R\sin(x + \alpha)$, with $R = \sqrt{a^2 + b^2}$ and $\tan\alpha = b/a$.`,
            r`So its maximum is $\sqrt{a^2 + b^2}$.`,
            'Same-frequency waves always combine into one wave of that frequency.',
          ],
        },
        {
          id: 'products',
          title: 'Products, Sums & Beats',
          summary: 'Turning products into sums and back',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Product to sum',
              body: r`Write out $\cos(A - B)$ and $\cos(A + B)$ and add them: the $\sin A\sin B$ terms cancel. Subtract them instead and the $\cos A\cos B$ terms cancel:
$$2\cos A\cos B = \cos(A - B) + \cos(A + B)$$
$$2\sin A\sin B = \cos(A - B) - \cos(A + B)$$
Before logarithms, astronomers used these to multiply large numbers using tables of cosines, a trick called *prosthaphaeresis*.`,
            },
            {
              type: 'numeric',
              title: 'An exact product',
              prompt: r`Find $2\cos 75°\cos 15°$ exactly.`,
              answer: 0.5,
              wrong: [{ v: 1, why: r`$\cos(75° - 15°) + \cos(75° + 15°) = \cos 60° + \cos 90°$.` }],
              explain: r`$\cos 60° + \cos 90° = \frac12 + 0 = \frac12$. No need to know $\cos 75°$ or $\cos 15°$ individually.`,
            },
            {
              type: 'explain',
              title: 'Sum to product',
              body: r`Reading the formulas backwards turns a **sum** of waves into a **product**:
$$\sin P + \sin Q = 2\sin\frac{P + Q}{2}\cos\frac{P - Q}{2}$$
Add two notes with nearly equal frequencies $f_1$ and $f_2$, and you get a wave at the average frequency whose loudness swells and fades as $\cos\left(\pi (f_1 - f_2) t\right)$. You hear the loudness pulse $|f_1 - f_2|$ times per second: **beats**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make the beats',
              prompt: r`One wave has frequency 10 Hz (shown slowed down). Set the second frequency so that the combined wave swells **2 times per second**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1.5, ymin: -2.4, ymax: 2.4, grid: 0.25, gridY: 1, height: 260, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 'time (s)', ylabel: 'sum' },
                params: { f: { min: 10, max: 14, step: 0.5, value: 10.5, label: '$f_2$', color: 'violet', format: (v) => `${fix(v, 1)} Hz` } },
                curves: [
                  { f: (t, p) => Math.sin(2 * Math.PI * 10 * t) + Math.sin(2 * Math.PI * p.f * t), color: 'violet', width: 2 },
                  { f: (t, p) => 2 * Math.abs(Math.cos(Math.PI * (p.f - 10) * t)), color: 'ink', dash: true, width: 1.5 },
                  { f: (t, p) => -2 * Math.abs(Math.cos(Math.PI * (p.f - 10) * t)), color: 'ink', dash: true, width: 1.5 },
                ],
                readout: (p) => r`$f_1 = 10$ Hz, $f_2 = ${fix(p.f, 1)}$ Hz: beat frequency $|f_1 - f_2| = ${fix(p.f - 10, 1)}$ Hz`,
                goal: (p) => p.f === 12,
                hint: 'The number of swells per second is the difference in frequency.',
                solution: { f: 12 },
              },
              explain: r`$f_2 = 12$ Hz: the dashed envelope $2\left|\cos(2\pi t)\right|$ peaks twice per second. When $f_2 = 10$ the beats vanish, which is exactly how musicians tune: they adjust until the wobble disappears.`,
            },
            {
              type: 'numeric',
              title: 'Tuning a guitar',
              prompt: r`A guitar string played with a 440 Hz tuning fork produces 3 beats per second. Tightening the string slightly (which raises its pitch) makes the beats faster. What was the string's frequency?`,
              unit: 'Hz',
              answer: 443,
              wrong: [{ v: 437, why: 'If it were 437 Hz, raising the pitch would bring it closer to 440 and the beats would slow down.' }, { v: 3, why: 'That’s the beat frequency, the difference between the two.' }],
              explain: r`The string is 440 ± 3 Hz. Raising its pitch made the beats faster, so it moved **away** from 440: it was already above, at 443 Hz.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A sum of sines',
              prompt: r`Use sum-to-product to evaluate $\sin 75° + \sin 15°$. (4 decimal places.)`,
              answer: 2 * Math.sin(45 * D) * Math.cos(30 * D),
              tol: 0.0002,
              wrong: [{ v: 1, why: r`$\sin 75° + \sin 15° = 2\sin 45°\cos 30°$, not $\sin 90°$.` }],
              explain: r`$2\sin\frac{90°}{2}\cos\frac{60°}{2} = 2 \cdot \frac{\sqrt2}{2} \cdot \frac{\sqrt3}{2} = \frac{\sqrt6}{2} \approx 1.2247$.`,
            },
          ],
          recap: [
            r`$2\cos A\cos B = \cos(A - B) + \cos(A + B)$; $\;2\sin A\sin B = \cos(A - B) - \cos(A + B)$.`,
            r`$\sin P + \sin Q = 2\sin\frac{P + Q}{2}\cos\frac{P - Q}{2}$.`,
            'Two close frequencies beat at their difference frequency.',
          ],
        },
        {
          id: 'proofs',
          title: 'Proving Identities',
          summary: 'Strategy, and testing claims',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'How to prove an identity',
              body: r`An identity must hold for **every** value of $x$. To prove one:
- Start from the **more complicated side** and transform it, step by step, into the other.
- Rewrite everything in terms of $\sin$ and $\cos$.
- Look for $\sin^2 + \cos^2$, double angles, and things that factor or cancel.

Don't work on both sides at once as if solving an equation: that can "prove" false statements. To **disprove** a claim, one counterexample is enough.`,
            },
            {
              type: 'order',
              title: 'Build the proof',
              prompt: r`Put the steps of a proof that $\dfrac{1 - \cos 2x}{\sin 2x} = \tan x$ in order.`,
              items: [
                r`Start from the left side: $\dfrac{1 - \cos 2x}{\sin 2x}$`,
                r`Use $\cos 2x = 1 - 2\sin^2 x$: $\;= \dfrac{2\sin^2 x}{\sin 2x}$`,
                r`Use $\sin 2x = 2\sin x\cos x$: $\;= \dfrac{2\sin^2 x}{2\sin x\cos x}$`,
                r`Cancel $2\sin x$: $\;= \dfrac{\sin x}{\cos x} = \tan x$`,
              ],
              explain: r`Each step replaces an expression with an equal one, so the chain proves the identity (wherever both sides are defined). Choosing the version $1 - 2\sin^2 x$ was the key: it makes the 1 cancel.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Test by graphing',
              body: r`A quick test before proving: graph both sides. If an identity is true, the graphs coincide everywhere. Switch between three claims.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2 * Math.PI, ymin: -3.2, ymax: 3.2, grid: Math.PI / 2, gridY: 1, height: 260, axes: { xlabel: 'x', ylabel: 'y', ...piTicks },
                params: { c: { min: 1, max: 3, step: 1, value: 1, label: 'claim', color: 'teal' } },
                curves: [{ f: (x, p) => CLAIMS[p.c - 1].l(x), color: 'blue', width: 4 }, { f: (x, p) => CLAIMS[p.c - 1].r(x), color: 'coral', dash: true, width: 3 }],
                readout: (p) => r`Claim ${p.c}: $\blue{${CLAIMS[p.c - 1].tex.replace(' = ', '} = \\coral{')}}$`,
              },
              after: r`Claims 1 and 3 overlap perfectly. Claim 2 clearly fails. A graph can't **prove** an identity (two curves might differ somewhere you can't see), but it's an excellent way to catch mistakes.`,
            },
            {
              type: 'mcq',
              title: 'A counterexample',
              prompt: r`Which value of $x$ disproves $\sin 3x = 3\sin x$?`,
              cols: 2,
              choices: [
                { t: r`$x = 90°$`, ok: true },
                { t: r`$x = 0°$`, why: r`Both sides are 0 there, so it doesn't disprove anything.` },
                { t: r`$x = 180°$`, why: r`$\sin 540° = 0 = 3\sin 180°$: they agree here.` },
                { t: r`$x = 360°$`, why: 'Both sides are 0.' },
              ],
              explain: r`At $x = 90°$: $\sin 270° = -1$, but $3\sin 90° = 3$. One failure is enough. Agreeing at a few points proves nothing, as the other choices show.`,
            },
            {
              type: 'mcq',
              title: 'Which is an identity?',
              prompt: r`Which of these is true for every $x$?`,
              choices: [
                { t: r`$(\sin x + \cos x)^2 = 1 + \sin 2x$`, ok: true },
                { t: r`$\cos(-x) = -\cos x$`, why: r`Cosine is **even**: $\cos(-x) = \cos x$. Sine is the odd one.` },
                { t: r`$\tan x \cos x = \cos x$`, why: r`$\tan x\cos x = \sin x$.` },
              ],
              explain: r`$(\sin x + \cos x)^2 = \sin^2 x + 2\sin x\cos x + \cos^2 x = 1 + \sin 2x$, using the Pythagorean identity and the double-angle formula together.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Factor first',
              prompt: r`Factor $\cos^4 x - \sin^4 x$ as a difference of squares to simplify it, then evaluate it at $x = 15°$. (4 decimal places.)`,
              answer: Math.cos(30 * D),
              tol: 0.0002,
              wrong: [{ v: 0.5, why: r`It simplifies to $\cos 2x$, and $2x = 30°$ here.` }],
              explain: r`$\cos^4 x - \sin^4 x = (\cos^2 x - \sin^2 x)(\cos^2 x + \sin^2 x) = \cos 2x \cdot 1$. At $x = 15°$ that's $\cos 30° = \frac{\sqrt3}{2} \approx 0.8660$. This proves claim 1 from the graphs.`,
            },
          ],
          recap: [
            'Transform one side into the other; rewrite in sin and cos.',
            'Graphs and test values catch false claims; one counterexample disproves.',
            'Factoring, Pythagoras and double angles do most of the work.',
          ],
        },
        {
          id: 'equations',
          title: 'Solving Trig Equations',
          summary: 'Finding every solution',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'More than one answer',
              body: r`Because sine and cosine repeat, a trig equation usually has **many** solutions. For $\sin x = \tfrac12$ in $[0, 2\pi)$:
- the calculator gives $x = \tfrac{\pi}{6}$ (that's 30°);
- by symmetry, $\sin(\pi - x) = \sin x$, so $x = \tfrac{5\pi}{6}$ (150°) works too.

Then add any multiple of $2\pi$ to get all the others.`,
            },
            {
              type: 'numeric',
              title: 'Count the solutions',
              prompt: r`How many solutions does $\sin x = \tfrac12$ have for $0 \le x < 4\pi$?`,
              answer: 4,
              wrong: [{ v: 2, why: r`That's in one period, $[0, 2\pi)$. The interval $[0, 4\pi)$ covers two periods.` }, { v: 1, why: r`Don't forget $\pi - \frac{\pi}{6}$, and the second period.` }],
              explain: r`Two per period: $\tfrac{\pi}{6}, \tfrac{5\pi}{6}, \tfrac{13\pi}{6}, \tfrac{17\pi}{6}$. That's **4** solutions.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find another solution',
              prompt: r`Solve $\sin x = -\frac12$. Your calculator gives $-30°$, which isn't in $[0°, 360°)$. Drag along the curve to find the solution between 180° and 270°.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 360, ymin: -1.3, ymax: 1.3, grid: 30, gridY: 0.5, height: 260, axes: { xlabel: 'x', ylabel: 'y', ...degTicks },
                params: { x: { min: 0, max: 360, step: 1, value: 100, slider: false } },
                curves: [{ f: (x) => Math.sin(x * D), color: 'blue', width: 3 }, { f: () => -0.5, color: 'coral', dash: true, width: 2 }],
                points: [{ x: (p) => p.x, y: (p) => Math.sin(p.x * D), drag: { x: 'x' }, color: 'violet' }],
                readout: (p) => r`$\sin ${p.x}° = ${f3(Math.sin(p.x * D))}$`,
                goal: (p) => p.x === 210,
                hint: r`It's 30° past 180°, by symmetry.`,
                solution: { x: 210 },
              },
              explain: r`$x = 210°$, which is $180° + 30°$. The dashed line crosses the curve twice per cycle: the other crossing is at $360° - 30° = 330°$.`,
            },
            {
              type: 'numeric',
              title: 'Use an identity',
              prompt: r`Solve $\sin 2x = \sin x$ for $0 < x < \pi$. (Hint: $\sin 2x = 2\sin x\cos x$.) Give the solution in degrees.`,
              unit: '°',
              answer: 60,
              wrong: [{ v: 0, why: r`$x = 0$ solves $\sin x = 0$, but the interval excludes it.` }, { v: 30, why: r`Check: $\sin 60° \ne \sin 30°$. Solve $\cos x = \frac12$.` }, { v: 90, why: r`$\sin 180° = 0$ but $\sin 90° = 1$, so 90° doesn't work.` }],
              explain: r`$2\sin x\cos x = \sin x$ gives $\sin x(2\cos x - 1) = 0$. In $0 < x < \pi$, $\sin x \ne 0$, so $\cos x = \tfrac12$ and $x = 60°$. Check: $\sin 120° = \sin 60°$ ✓. (Don't divide by $\sin x$ blindly: factoring keeps track of every solution.)`,
            },
            {
              type: 'numeric',
              title: 'Going round again',
              prompt: r`The solutions of $\sin x = \frac12$ are $x = 30° + 360°k$ and $x = 150° + 360°k$. What is the smallest solution greater than $360°$?`,
              unit: '°',
              answer: 390,
              explain: r`$30° + 360° = 390°$ (the next is $510°$). Trig equations have infinitely many solutions, two per full turn here, because sine repeats.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A quadratic in disguise',
              prompt: r`How many solutions does $2\sin^2 x - \sin x - 1 = 0$ have for $0° \le x < 360°$?`,
              answer: 3,
              wrong: [{ v: 2, why: r`Factor: $(2\sin x + 1)(\sin x - 1) = 0$. One factor gives two angles, the other gives one.` }, { v: 4, why: r`$\sin x = 1$ only happens once per cycle, at 90°.` }],
              hint: r`Let $s = \sin x$ and solve $2s^2 - s - 1 = 0$.`,
              explain: r`$(2s + 1)(s - 1) = 0$, so $\sin x = 1$ (only $x = 90°$) or $\sin x = -\frac12$ ($x = 210°, 330°$). Three solutions in total. Treating $\sin x$ as a single unknown turns many trig equations into ordinary algebra.`,
            },
          ],
          recap: [
            r`Trig equations have many solutions. Use symmetry: $\sin(\pi - x) = \sin x$.`,
            r`Add multiples of $2\pi$ for every solution.`,
            'Factor rather than dividing, so no solutions are lost.',
          ],
        },
      ],
    },
  ],
};
