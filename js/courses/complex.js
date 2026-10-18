import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed d decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d);
const cstr = (a, b, d = 2) => (b === 0 ? f2(a, d) : a === 0 ? `${f2(b, d)}i` : `${f2(a, d)} ${b < 0 ? '-' : '+'} ${f2(Math.abs(b), d)}i`);
const argDeg = (a, b) => { let t = (Math.atan2(b, a) * 180) / Math.PI; if (t < 0) t += 360; return t; };
const PLANE = { kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3.4, ymax: 3.4, grid: 1, axes: { xlabel: 'Re', ylabel: 'Im' }, maxWidth: 560 };
const vec = (plot, arrow, a, b, color, w = 3.5) => arrow(plot.X(0), plot.Y(0), plot.X(a), plot.Y(b), { color: `var(--${color})`, width: w, head: 12 });

// p(z) = z³ − 2z + 2 on the circle |z| = R: image points and winding number around 0
const cubicImage = (R, n = 720) => Array.from({ length: n + 1 }, (_, k) => { const t = (2 * Math.PI * k) / n, x = R * Math.cos(t), y = R * Math.sin(t); const x3 = x * x * x - 3 * x * y * y, y3 = 3 * x * x * y - y * y * y; return [x3 - 2 * x + 2, y3 - 2 * y]; });
const winding = (R) => { const P = cubicImage(R); let tot = 0; for (let k = 1; k < P.length; k++) { let d = Math.atan2(P[k][1], P[k][0]) - Math.atan2(P[k - 1][1], P[k - 1][0]); while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; tot += d; } return Math.round(tot / (2 * Math.PI)); };
// Joukowski map w = z + 1/z applied to the circle through z = 1 with centre (cx, cy)
const joukowski = (cx, cy, n = 240) => { const R = Math.hypot(1 - cx, cy); return Array.from({ length: n + 1 }, (_, k) => { const t = (2 * Math.PI * k) / n, x = cx + R * Math.cos(t), y = cy + R * Math.sin(t), d = x * x + y * y; return [x + x / d, y - y / d]; }); };

export default {
  id: 'complex',
  subject: 'math',
  title: 'Complex Numbers',
  level: 'Advanced',
  cover: 'complex',
  tagline: 'The square root of −1, why multiplying means rotating, why every polynomial has a root, and how to design a wing.',
  description: r`Mathematicians once called them "imaginary", but complex numbers turned out to describe rotation, waves and electrical circuits beautifully. Learn to picture them as points, discover that multiplication rotates, arrive at Euler's famous $e^{i\pi} + 1 = 0$, see why every polynomial has a root, and use complex maps to design an airfoil.`,
  prereq: 'Trigonometry, and Vectors & Matrices',
  chapters: [
    {
      title: 'A New Kind of Number',
      summary: 'i, and the complex plane.',
      lessons: [
        {
          id: 'imaginary',
          title: 'The Square Root of −1',
          summary: 'Meet i',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'No solution?',
              prompt: r`Which real number $x$ solves $x^2 = -1$?`,
              choices: [
                { t: 'None: every real number squared is zero or positive', ok: true },
                { t: '−1', why: r`$(-1)^2 = +1$. Squaring a negative gives a positive.` },
                { t: '1', why: r`$1^2 = 1$, not $-1$.` },
              ],
              explain: r`No real number works. So mathematicians invented a new number, $i$, defined by $i^2 = -1$. That sounds like cheating, but it leads to a completely consistent and enormously useful number system.`,
            },
            {
              type: 'explain',
              title: 'Imaginary and complex numbers',
              body: r`Define $i$ by $i^2 = -1$. Then $\sqrt{-9} = 3i$, because $(3i)^2 = 9i^2 = -9$.

A **complex number** combines a real part and an imaginary part:
$$z = a + bi$$
Add and multiply them like ordinary algebra, replacing $i^2$ with $-1$ whenever it appears.

Historically, complex numbers first showed up in the 1500s, in formulas for solving **cubic** equations: they appeared in the middle of calculations whose final answers were perfectly real.`,
            },
            {
              type: 'numeric',
              title: 'Powers of i',
              prompt: r`What is $i^4$?`,
              answer: 1,
              wrong: [{ v: -1, why: r`$i^4 = (i^2)^2 = (-1)^2$.` }, { v: 4, why: r`$i^4 = i \cdot i \cdot i \cdot i = (i^2)(i^2)$.` }],
              explain: r`$i^4 = (i^2)^2 = (-1)^2 = 1$. The powers cycle: $i, -1, -i, 1, i, -1, \ldots$ with period 4.`,
            },
            {
              type: 'mcq',
              title: 'Multiply',
              prompt: r`What is $(2 + 3i)(1 - i)$?`,
              cols: 2,
              choices: [
                { t: r`$5 + i$`, ok: true },
                { t: r`$2 - 3i$`, why: r`Multiply every term by every term: $2 - 2i + 3i - 3i^2$.` },
                { t: r`$-1 + i$`, why: r`$-3i^2 = -3(-1) = +3$, so the real part is $2 + 3 = 5$.` },
                { t: r`$2 + i - 3i^2$`, why: r`Nearly there! Now replace $i^2$ with $-1$.` },
              ],
              explain: r`$(2 + 3i)(1 - i) = 2 - 2i + 3i - 3i^2 = 2 + i + 3 = 5 + i$.`,
            },
            {
              type: 'interactive',
              title: 'Powers of 1 + i',
              body: r`Multiplying by $1 + i$ rotates a point by 45° and stretches it by $\sqrt2$. The dots are $(1+i)^0, (1+i)^1, (1+i)^2, \dots$. Find the power that lands on the **real number −4**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -9, xmax: 9, ymin: -9, ymax: 9, grid: false, maxWidth: 360, axes: { xticks: 2, yticks: 2 },
                params: { k: { min: 0, max: 6, step: 1, value: 1, label: 'power k', color: 'coral' } },
                extra: ({ plot, p, s }) => { const out = []; let x = 1, y = 0, d = `M${plot.X(1)} ${plot.Y(0)}`; for (let j = 1; j <= p.k; j++) { [x, y] = [x - y, x + y]; d += `L${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; } out.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '5 4' })); x = 1; y = 0; for (let j = 0; j <= p.k; j++) { out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: j === p.k ? 8 : 5, class: j === p.k ? 'fl-coral' : 'fl-violet' })); [x, y] = [x - y, x + y]; } return out; },
                readout: (p) => { let x = 1, y = 0; for (let j = 0; j < p.k; j++) [x, y] = [x - y, x + y]; return `(1 + i)^${p.k} = **${x}${y >= 0 ? ' + ' : ' − '}${Math.abs(y)}i** · length ${Math.hypot(x, y).toFixed(2)} · angle ${45 * p.k}°`; },
                goal: (p) => p.k === 4,
                hint: 'You need to turn 180° in steps of 45°.',
                solution: { k: 4 },
              },
              explain: r`Four steps of 45° make 180° (pointing along the negative real axis), and the length is $(\sqrt2)^4 = 4$: $(1+i)^4 = -4$. Check: $(1+i)^2 = 2i$ and $(2i)^2 = -4$. Multiplying complex numbers adds their angles and multiplies their lengths.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A big power',
              prompt: r`Simplify $i^{2026}$. (Enter the real number it equals.)`,
              answer: -1,
              wrong: [{ v: 1, why: r`$2026 = 4 \times 506 + 2$, so $i^{2026} = i^2$.` }],
              explain: r`Powers of $i$ repeat every 4. $2026 \bmod 4 = 2$, so $i^{2026} = i^2 = -1$.`,
            },
          ],
          recap: [
            r`$i^2 = -1$. Complex numbers have the form $a + bi$.`,
            r`Do arithmetic as usual, replacing $i^2$ with $-1$.`,
            r`The powers of $i$ cycle with period 4: $i, -1, -i, 1$.`,
          ],
        },
        {
          id: 'complex-plane',
          title: 'The Complex Plane',
          summary: 'Numbers as points',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A 2D number line',
              body: r`Real numbers live on a line. Complex numbers live on a **plane**: the real part is the horizontal coordinate and the imaginary part is the vertical one. Drag $z$.`,
              widget: {
                ...PLANE,
                params: { a: { min: -3.5, max: 3.5, step: 0.5, value: 3, slider: false }, b: { min: -3, max: 3, step: 0.5, value: 2, slider: false } },
                points: [{ x: (p) => p.a, y: (p) => p.b, drag: { x: 'a', y: 'b' }, color: 'blue', r: 8 }],
                extra: ({ plot, p, arrow }) => [vec(plot, arrow, p.a, p.b, 'blue')],
                readout: (p) => r`$z = ${cstr(p.a, p.b, 1)}$, $\quad |z| = \sqrt{${f2(p.a, 1)}^2 + ${f2(p.b, 1)}^2} = ${f2(Math.hypot(p.a, p.b))}$`,
              },
              after: r`The distance from 0 is the **modulus** $|z| = \sqrt{a^2 + b^2}$. Adding complex numbers is just adding vectors, tip to tail.`,
            },
            {
              type: 'numeric',
              title: 'Modulus',
              prompt: r`What is $|{-5} + 12i|$?`,
              answer: 13,
              wrong: [{ v: 7, why: r`Use Pythagoras: $\sqrt{25 + 144}$.` }, { v: 17, why: r`$\sqrt{(-5)^2 + 12^2} = \sqrt{169}$.` }],
              explain: r`$\sqrt{25 + 144} = \sqrt{169} = 13$.`,
            },
            {
              type: 'mcq',
              title: 'Conjugate',
              body: r`The **conjugate** of $z = a + bi$ is $\bar z = a - bi$: its mirror image across the real axis.`,
              prompt: r`What is $z \cdot \bar z$ for $z = 3 + 4i$?`,
              cols: 2,
              choices: [
                { t: '25', ok: true },
                { t: r`$9 - 16i^2$`, why: r`That simplifies further: $-16i^2 = +16$.` },
                { t: '−7', why: r`$(3 + 4i)(3 - 4i) = 9 - 16i^2 = 9 + 16$.` },
                { t: r`$9 + 16i$`, why: 'The imaginary parts cancel completely.' },
              ],
              explain: r`$(3 + 4i)(3 - 4i) = 9 - 16i^2 = 9 + 16 = 25 = |z|^2$. Multiplying a number by its conjugate always gives the modulus squared, a real number. That's the trick for dividing complex numbers.`,
            },
            {
              type: 'numeric',
              title: 'Multiplying',
              prompt: r`Multiply $(1 + 2i)(3 - i)$. What is the **real** part of the answer?`,
              answer: 5,
              wrong: [{ v: 1, why: r`Remember $i^2 = -1$, so $-2i^2 = +2$.` }],
              explain: r`$(1 + 2i)(3 - i) = 3 - i + 6i - 2i^2 = 3 + 5i + 2 = 5 + 5i$. Real part **5**. Notice the moduli multiply too: $\sqrt5 \times \sqrt{10} = \sqrt{50} = |5 + 5i|$.`,
            },
            {
              type: 'numeric',
              title: 'Adding is easy',
              prompt: r`What is the imaginary part of $(2 + 3i) + (1 - 5i)$?`,
              answer: -2,
              explain: r`Add real and imaginary parts separately: $(2 + 1) + (3 - 5)i = 3 - 2i$. In the plane, adding complex numbers is just adding arrows tip to tail.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Distance',
              prompt: r`How far apart are $1 + 2i$ and $4 + 6i$ in the complex plane?`,
              answer: 5,
              wrong: [{ v: 7, why: r`The difference is $3 + 4i$. Its modulus is $\sqrt{9 + 16}$.` }],
              explain: r`The distance is $|(4 + 6i) - (1 + 2i)| = |3 + 4i| = 5$.`,
            },
          ],
          recap: [
            r`$a + bi$ is the point $(a, b)$ in the complex plane.`,
            r`Modulus $|z| = \sqrt{a^2 + b^2}$. Adding complex numbers adds vectors.`,
            r`$z\bar z = |z|^2$.`,
          ],
        },
      ],
    },
    {
      title: 'Multiplication Is Rotation',
      summary: 'Polar form and Euler’s formula.',
      lessons: [
        {
          id: 'rotation',
          title: 'Multiplying Rotates',
          summary: 'Lengths multiply, angles add',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Times i',
              prompt: r`Multiply $3 + 1i$ by $i$. Where does the point move?`,
              choices: [
                { t: r`To $-1 + 3i$: rotated 90° counterclockwise`, ok: true },
                { t: r`To $3i + 1$: just swapped`, why: r`$i(3 + i) = 3i + i^2 = -1 + 3i$. The $i^2$ becomes $-1$.` },
                { t: r`To $3 - i$: reflected`, why: r`$i(3 + i) = 3i + i^2 = -1 + 3i$.` },
              ],
              explain: r`$i(3 + i) = 3i + i^2 = -1 + 3i$. The point $(3, 1)$ moves to $(-1, 3)$: a quarter turn counterclockwise. **Multiplying by $i$ rotates by 90°.** That's why $i^2 = -1$: two quarter turns make a half turn, which points the opposite way.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Multiply two numbers',
              body: r`Drag $\blue{z}$ and $\coral{w}$. Watch their product $\violet{zw}$. Compare the angles and the lengths.`,
              widget: {
                ...PLANE,
                params: {
                  a: { min: -3.5, max: 3.5, step: 0.25, value: 1.5, slider: false }, b: { min: -3, max: 3, step: 0.25, value: 0.5, slider: false },
                  c: { min: -3.5, max: 3.5, step: 0.25, value: 1, slider: false }, d: { min: -3, max: 3, step: 0.25, value: 1, slider: false },
                },
                points: [
                  { x: (p) => p.a, y: (p) => p.b, drag: { x: 'a', y: 'b' }, color: 'blue', r: 7 },
                  { x: (p) => p.c, y: (p) => p.d, drag: { x: 'c', y: 'd' }, color: 'coral', r: 7 },
                ],
                extra: ({ plot, p, arrow }) => {
                  const re = p.a * p.c - p.b * p.d, im = p.a * p.d + p.b * p.c;
                  return [vec(plot, arrow, re, im, 'violet', 4.5), vec(plot, arrow, p.a, p.b, 'blue'), vec(plot, arrow, p.c, p.d, 'coral')];
                },
                readout: (p) => {
                  const re = p.a * p.c - p.b * p.d, im = p.a * p.d + p.b * p.c;
                  return r`$|z| \cdot |w| = ${f2(Math.hypot(p.a, p.b))} \times ${f2(Math.hypot(p.c, p.d))} = ${f2(Math.hypot(re, im))} = |zw|$ $\quad$ angles: $${Math.round(argDeg(p.a, p.b))}° + ${Math.round(argDeg(p.c, p.d))}° \equiv ${Math.round(argDeg(re, im))}°$`;
                },
              },
              after: r`::: key
When you multiply complex numbers, their **lengths multiply** and their **angles add**.
:::`,
            },
            {
              type: 'explain',
              title: 'Polar form',
              body: r`Any complex number can be written using its length $r = |z|$ and its angle $\theta$ (called the **argument**):
$$z = r(\cos\theta + i\sin\theta)$$
Multiplying two numbers in this form, the angle-addition formulas from trigonometry give
$$r_1 r_2\big(\cos(\theta_1 + \theta_2) + i\sin(\theta_1 + \theta_2)\big)$$
which is exactly "lengths multiply, angles add".`,
            },
            {
              type: 'numeric',
              title: 'Angle of a product',
              prompt: r`$z$ has argument 30° and $w$ has argument 50°. What is the argument of $zw$?`,
              unit: '°',
              answer: 80,
              wrong: [{ v: 1500, why: 'Angles add when you multiply. They don’t multiply.' }, { v: 20, why: 'Add the angles, don’t subtract them.' }],
              explain: r`Angles add: $30° + 50° = 80°$.`,
            },
            {
              type: 'numeric',
              title: 'Back to the start',
              prompt: r`Multiplying by $\frac{1 + i}{\sqrt2}$ rotates by $45°$ and doesn’t change lengths. How many times must you multiply 1 by it to get back to 1?`,
              answer: 8,
              explain: r`$8 \times 45° = 360°$. So $\left(\frac{1 + i}{\sqrt2}\right)^8 = 1$: it’s an eighth root of unity.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Repeated multiplication',
              body: r`Let $z = 2(\cos 30° + i\sin 30°)$, which has length 2 and angle 30°.`,
              prompt: r`What real number is $z^6$?`,
              answer: -64,
              wrong: [{ v: 64, why: r`Angles add: $6 \times 30° = 180°$, which points along the **negative** real axis.` }, { v: -12, why: r`Lengths multiply, not add: $2^6 = 64$.` }, { v: -1, why: r`The angle is right, but the length is $2^6 = 64$, not 1.` }],
              explain: r`Lengths multiply: $2^6 = 64$. Angles add: $6 \times 30° = 180°$, pointing straight left. So $z^6 = -64$. Expanding $(\sqrt3 + i)^6$ by brute force would take a page of algebra; polar form does it in one line.`,
            },
          ],
          recap: [
            r`Multiplying by $i$ rotates by 90°.`,
            'In general: lengths multiply and angles add.',
            r`Polar form: $z = r(\cos\theta + i\sin\theta)$.`,
          ],
        },
        {
          id: 'euler',
          title: 'Euler’s Formula',
          summary: 'e^(iπ) + 1 = 0',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Exponentials that rotate',
              body: r`Since multiplying adds angles, and multiplying exponentials adds exponents ($e^a e^b = e^{a + b}$), it's natural to write a unit-length complex number with angle $\theta$ (in radians) as an exponential:
$$e^{i\theta} = \cos\theta + i\sin\theta$$
This is **Euler's formula** (1748). It can be proved from the infinite series for $e^x$, $\sin x$ and $\cos x$. As $\theta$ grows, $e^{i\theta}$ travels around the unit circle.`,
              widget: {
                ...PLANE, xmin: -1.6, xmax: 1.6, ymin: -1.4, ymax: 1.4, grid: 0.5, maxWidth: 420,
                params: { t: { min: 0, max: 6.28, step: 0.01, value: 1, label: r`$\theta$`, color: 'violet', format: (v) => `${v.toFixed(2)} rad` } },
                extra: ({ plot, p, s, arrow }) => [
                  s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                  vec(plot, arrow, Math.cos(p.t), Math.sin(p.t), 'violet', 4),
                ],
                readout: (p) => r`$e^{i \cdot ${p.t.toFixed(2)}} = ${cstr(Math.cos(p.t), Math.sin(p.t))}$`,
              },
            },
            {
              type: 'mcq',
              title: 'Half a turn',
              prompt: r`Using Euler's formula, what is $e^{i\pi}$?`,
              cols: 2,
              choices: [
                { t: '−1', ok: true },
                { t: '1', why: r`$\pi$ radians is a half turn (180°), not a full turn.` },
                { t: r`$i$`, why: r`$i$ is a quarter turn, $e^{i\pi/2}$.` },
                { t: r`$e^\pi$`, why: r`The $i$ makes it rotate around the circle instead of growing.` },
              ],
              explain: r`$e^{i\pi} = \cos\pi + i\sin\pi = -1 + 0i = -1$. Rearranged, this gives
$$e^{i\pi} + 1 = 0,$$
often called the most beautiful equation in mathematics. It links five fundamental constants ($e$, $i$, $\pi$, 1 and 0) using addition, multiplication and exponentiation, each exactly once.`,
            },
            {
              type: 'numeric',
              title: 'Quarter turn',
              prompt: r`$e^{i\pi/2} = a + bi$. What is $b$?`,
              lhs: r`$b =$`,
              answer: 1,
              wrong: [{ v: 0, why: r`$\pi/2$ is 90°: straight up the imaginary axis. That point is $i$.` }],
              explain: r`$e^{i\pi/2} = \cos 90° + i\sin 90° = i$, so $a = 0$ and $b = 1$.`,
            },
            {
              type: 'numeric',
              title: 'A sixth of a turn',
              prompt: r`$e^{i\pi/3}$ is a point on the unit circle at an angle of $60°$. What is its real part?`,
              answer: Math.cos(Math.PI / 3),
              tol: 0.001,
              explain: r`$\cos 60° = 0.5$, so $e^{i\pi/3} = \frac12 + \frac{\sqrt3}{2}i$. Raising it to the 6th power turns $6 \times 60° = 360°$: $\left(e^{i\pi/3}\right)^6 = 1$, so it’s a sixth root of unity.`,
            },
            {
              type: 'numeric',
              title: 'Length of an exponential',
              prompt: r`What is $|3e^{2i}|$, the distance of $3e^{2i}$ from the origin?`,
              answer: 3,
              explain: r`$|e^{i\theta}| = 1$ for any real $\theta$ (it’s a point on the unit circle), so $|3e^{2i}| = 3$. The exponent sets the angle (2 radians here), the factor in front sets the length.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'i to the i',
              prompt: r`Using $i = e^{i\pi/2}$, what kind of number is $i^i$?`,
              choices: [
                { t: r`A real number: $e^{-\pi/2} \approx 0.208$`, ok: true },
                { t: 'A purely imaginary number', why: r`$i^i = (e^{i\pi/2})^i = e^{i^2 \pi/2} = e^{-\pi/2}$, which is real.` },
                { t: 'It isn’t defined', why: 'It is defined (with a standard choice of angle), and the value is surprisingly real.' },
              ],
              explain: r`$i^i = \left(e^{i\pi/2}\right)^i = e^{i \cdot i \cdot \pi/2} = e^{-\pi/2} \approx 0.208$. An "imaginary" number raised to an imaginary power gives a real number! (Strictly, you could also use angles $\pi/2 + 2\pi k$, which give other real values. $e^{-\pi/2}$ is the standard choice.)`,
            },
          ],
          recap: [
            r`Euler's formula: $e^{i\theta} = \cos\theta + i\sin\theta$.`,
            r`$e^{i\pi} + 1 = 0$.`,
            r`Any complex number is $re^{i\theta}$: a length times a rotation.`,
          ],
        },
        {
          id: 'roots-unity',
          title: 'Roots of Unity',
          summary: 'Polygons from equations',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'How many cube roots?',
              prompt: r`How many complex numbers $z$ satisfy $z^3 = 1$?`,
              answer: 3,
              wrong: [{ v: 1, why: r`$z = 1$ is one. Think about rotations: which angles, tripled, make a whole number of full turns?` }],
              explain: r`Three: angles $0°$, $120°$ and $240°$ on the unit circle, because tripling each gives $0°$, $360°$ or $720°$, all full turns.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The nth roots of 1',
              body: r`The solutions of $z^n = 1$ are evenly spaced around the unit circle: angles $\frac{360°k}{n}$ for $k = 0, 1, \ldots, n - 1$. They form a regular polygon.`,
              widget: {
                ...PLANE, xmin: -1.6, xmax: 1.6, ymin: -1.4, ymax: 1.4, grid: 0.5, maxWidth: 420,
                params: { n: { min: 2, max: 12, step: 1, value: 5, label: '$n$', color: 'teal', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => {
                  const pts = Array.from({ length: p.n }, (_, k) => [Math.cos((2 * Math.PI * k) / p.n), Math.sin((2 * Math.PI * k) / p.n)]);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
                    s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join('') + 'Z', class: 'fl-teal', opacity: 0.2, stroke: 'var(--teal)', 'stroke-width': 2 }),
                    ...pts.map(([x, y]) => s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 7, class: 'fl-teal', stroke: 'var(--card)', 'stroke-width': 2 })),
                  ];
                },
                readout: (p) => r`$z^{${p.n}} = 1$ has ${p.n} solutions, at multiples of $${f2(360 / p.n)}°$`,
              },
            },
            {
              type: 'mcq',
              title: 'Fourth roots',
              prompt: r`What are the solutions of $z^4 = 1$?`,
              cols: 2,
              choices: [
                { t: r`$1, i, -1, -i$`, ok: true },
                { t: r`$1, -1$ only`, why: r`Those are the real ones. $i^4 = 1$ and $(-i)^4 = 1$ too.` },
                { t: r`$1, 2, 3, 4$`, why: r`$2^4 = 16$, not 1.` },
              ],
              explain: r`The angles are $0°, 90°, 180°, 270°$: the points $1, i, -1, -i$, forming a square.`,
            },
            {
              type: 'numeric',
              title: 'Evenly spaced',
              prompt: r`The five 5th roots of unity are evenly spaced around the unit circle. What is the angle between neighbouring roots?`,
              unit: '°',
              answer: 72,
              explain: r`$\frac{360°}{5} = 72°$: they form a regular pentagon, starting at 1. In general the $n$th roots of unity are the corners of a regular $n$-gon.`,
            },
            {
              type: 'numeric',
              title: 'Shared roots',
              prompt: r`How many of the twelve 12th roots of unity are also 4th roots of unity?`,
              answer: 4,
              wrong: [{ v: 3, why: r`Count 1 itself too: the 4th roots are at $0°, 90°, 180°, 270°$.` }, { v: 12, why: r`Only the ones whose 4th power is 1 count: angles that are multiples of $90°$.` }],
              explain: r`The 12th roots sit at multiples of $30°$; the 4th roots, $1, i, -1, -i$, are at multiples of $90°$, which are among them. So **4** are shared. In general the $d$th roots of unity are inside the $n$th roots exactly when $d$ divides $n$: the square sits inside the 12-gon, and so do the triangle and the hexagon.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'They cancel',
              prompt: r`What is the sum of all five solutions of $z^5 = 1$?`,
              answer: 0,
              wrong: [{ v: 5, why: 'Picture five equal arrows pointing evenly around the circle. What do they add up to?' }, { v: 1, why: 'The roots are spread evenly around the circle, so by symmetry they balance out.' }],
              explain: r`Five equal arrows, evenly spaced around a circle, balance perfectly: their sum is **0**. Rotating the whole set by 72° leaves it unchanged, so the sum is unchanged by that rotation too. The only number that stays the same when rotated is 0. This holds for every $n \ge 2$.`,
            },
          ],
          recap: [
            r`$z^n = 1$ has $n$ solutions, evenly spaced around the unit circle.`,
            'They form a regular n-gon. Their sum is 0 (for n ≥ 2).',
            'Equations in complex numbers have pictures: algebra and geometry merge.',
          ],
        },
      ],
    },
    {
      title: 'Complex Numbers at Work',
      summary: 'Why polynomials have roots, and functions as maps.',
      lessons: [
        {
          id: 'winding',
          title: 'Why Every Polynomial Has a Root',
          summary: 'Counting roots by winding',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'How many roots?',
              prompt: r`Counting complex roots (and repeated roots), how many solutions does a polynomial equation of degree 3, like $z^3 - 2z + 2 = 0$, have?`,
              cols: 2,
              choices: [
                { t: 'Exactly 3', ok: true },
                { t: 'It depends on the coefficients: 1 or 3', why: 'That’s true for real roots. Counting complex roots, there are always exactly 3.' },
                { t: 'Infinitely many', why: 'A nonzero polynomial of degree 3 can be zero at only 3 points.' },
                { t: 'None, sometimes', why: 'Over the complex numbers, every polynomial of degree 1 or more has at least one root.' },
              ],
              explain: r`Over the complex numbers, every polynomial of degree $n$ has exactly $n$ roots (counting repeats). This **fundamental theorem of algebra**, first proved convincingly by Gauss in 1799, is why complex numbers are "enough": you never need to invent new numbers to solve polynomial equations. Here's a beautiful way to see why it's true.`,
            },
            {
              type: 'explain',
              title: 'Following the image',
              body: r`Take a circle $|z| = R$ in the complex plane and watch where $p(z)$ goes as $z$ travels once around it. The image is a closed loop in the $w$-plane. Count how many times it winds around $0$: its **winding number**.

- For a tiny circle, $p(z)$ stays close to $p(0)$, so (if $p(0) \ne 0$) the loop doesn't go around 0 at all.
- For a huge circle, $p(z) \approx z^n$, which winds $n$ times around 0.

The winding number can only change when the loop passes **through** 0, that is, when the circle passes through a root.`,
            },
            {
              type: 'interactive',
              title: 'Watch it wind',
              body: r`The coral curve is the image of the circle $|z| = R$ under $p(z) = z^3 - 2z + 2$, scaled to fit; the black dot is $0$. Grow the circle and watch the winding number jump. Find a radius where the curve winds around 0 **exactly twice**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: -1.25, ymax: 1.25, grid: false, axes: false, maxWidth: 400,
                params: { R: { min: 0.2, max: 2.5, step: 0.01, value: 0.6, label: 'circle radius R', color: 'violet', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => {
                  const P = cubicImage(p.R), sc = Math.max(3, ...P.map(([x, y]) => Math.hypot(x, y))) * 1.05;
                  return [
                    s('line', { x1: plot.X(-1.25), x2: plot.X(1.25), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--line-2)' }),
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.25), y2: plot.Y(1.25), stroke: 'var(--line-2)' }),
                    s('path', { d: P.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x / sc).toFixed(1)} ${plot.Y(y / sc).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-ink' }),
                  ];
                },
                readout: (p) => `Winding number around 0: **${winding(p.R)}** · so ${winding(p.R)} root${winding(p.R) === 1 ? '' : 's'} inside $|z| < ${p.R.toFixed(2)}$`,
                goal: (p) => winding(p.R) === 2,
                hint: 'Start small and grow the circle slowly; watch for the moment the loop first wraps around the dot.',
                solution: { R: 1.4 },
              },
              explain: r`The winding number jumps from 0 to 2 at $R \approx 1.06$ (where the circle crosses two complex roots, $0.88 \pm 0.59i$) and from 2 to 3 at $R \approx 1.77$ (the real root $-1.77$). The winding number counts the roots inside the circle. Since a huge circle winds $n$ times but a tiny one 0 times, the circle must cross roots along the way: there have to be $n$ of them.`,
            },
            {
              type: 'numeric',
              title: 'Big circles',
              prompt: r`On a very large circle, $p(z) = z^5 + 3z^2 - 7$ behaves like $z^5$. How many times does its image wind around 0?`,
              answer: 5,
              wrong: [{ v: 1, why: r`As $z$ goes round once, its angle increases by $360°$, so $z^5$'s angle increases by $5 \times 360°$.` }, { v: 3, why: 'For large |z| the highest power dominates.' }],
              explain: r`As $z$ goes once around, its angle grows by $360°$, so the angle of $z^5$ grows by $5 \times 360°$: five windings. So this polynomial has exactly 5 roots, all inside a large enough circle.`,
            },
            {
              type: 'mcq',
              title: 'Why not just the reals?',
              prompt: r`$x^2 + 1 = 0$ has no real solutions. Why doesn't the winding argument contradict that?`,
              choices: [
                { t: 'The argument finds the roots in the complex plane: here they are ±i, off the real line', ok: true },
                { t: 'The winding argument only works for odd degrees', why: 'It works for every degree. The roots it finds may just be complex.' },
                { t: 'x² + 1 isn’t a polynomial', why: 'It is a polynomial of degree 2, and the theorem gives it 2 roots: ±i.' },
              ],
              explain: r`The roots of $z^2 + 1$ are $\pm i$, at distance 1 from 0. A circle of radius $R < 1$ winds 0 times; $R > 1$ winds twice. Real numbers alone aren't "closed" under solving polynomials; complex numbers are, which is the content of the fundamental theorem of algebra.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Roots inside a circle',
              prompt: r`How many roots of $z^3 - 2z + 2$ lie inside the circle $|z| < 1.5$?`,
              answer: 2,
              wrong: [{ v: 3, why: 'The real root, near −1.77, lies outside radius 1.5.' }, { v: 1, why: r`The two complex roots $0.88 \pm 0.59i$ have $|z| \approx 1.06$, both inside.` }],
              explain: r`The two complex roots have $|z| \approx 1.06$, inside; the real root $-1.77$ lies outside. Winding numbers count roots without finding them, a tool engineers use to check whether control systems are stable (the **Nyquist stability criterion**).`,
            },
          ],
          recap: [
            'Fundamental theorem of algebra: a degree-n polynomial has exactly n complex roots.',
            'The winding number of p(circle) around 0 counts the roots inside the circle.',
            'Tiny circles wind 0 times, huge ones n times, so n roots must lie in between.',
          ],
        },
        {
          id: 'maps',
          title: 'Complex Functions as Maps',
          summary: 'Squaring, inverting and designing wings',
          icon: 'pencil',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Multiply everything by i',
              prompt: 'If you multiply every point of the complex plane by i, what happens to the whole plane?',
              choices: [
                { t: 'It rotates 90° anticlockwise about 0', ok: true },
                { t: 'It doubles in size', why: r`$|i| = 1$, so lengths don’t change: multiplying by $i$ only rotates.` },
                { t: 'It flips upside down', why: 'Multiplying by i rotates by 90°; doing it twice (multiplying by −1) would turn it upside down.' },
              ],
              explain: r`Multiplying by $i$ rotates every point by $90°$. More complicated functions also move points around, but in more interesting ways: think of a complex function $f(z)$ as a **map** that takes the plane and reshapes it.`,
            },
            {
              type: 'explain',
              title: 'Squaring and inverting',
              body: r`In polar form, $z = re^{i\theta}$:

- $z^2 = r^2 e^{2i\theta}$: lengths are squared and **angles doubled**. The top half of the plane is stretched to cover the whole plane.
- $\frac1z = \frac1r e^{-i\theta}$: points inside the unit circle are swapped with points outside, and flipped across the real axis.

These maps distort sizes, but (away from a few special points) they preserve the **angles** between curves: tiny squares map to tiny squares, just tilted and scaled. Maps like this are called **conformal**.`,
            },
            {
              type: 'numeric',
              title: 'Square it',
              prompt: r`What is $|z^2|$ for $z = 1 + i$? (Hint: $|1 + i| = \sqrt2$.)`,
              answer: 2,
              wrong: [{ v: Math.SQRT2, tol: 0.01, why: 'Squaring squares the length: (√2)².' }, { v: 4, why: r`$|z|^2 = (\sqrt2)^2 = 2$.` }],
              explain: r`$|z^2| = |z|^2 = 2$, and the angle doubles from $45°$ to $90°$, so $(1 + i)^2 = 2i$. Check: $(1 + i)^2 = 1 + 2i + i^2 = 2i$ ✓.`,
            },
            {
              type: 'interactive',
              title: 'Design a wing',
              body: r`The **Joukowski map** $w = z + \frac1z$ turns circles into other shapes. The circle here always passes through $z = 1$; you move its centre. Shift the centre slightly **left** and slightly **up** to turn the image into a curved, rounded-nosed wing profile (an **airfoil**).`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.6, xmax: 2.6, ymin: -1.2, ymax: 1.4, grid: false, axes: false, maxWidth: 520,
                params: { cx: { min: -0.3, max: 0.1, step: 0.01, value: 0, slider: false }, cy: { min: -0.3, max: 0.4, step: 0.01, value: 0, slider: false } },
                extra: ({ plot, p, s }) => {
                  const W = joukowski(p.cx, p.cy), R = Math.hypot(1 - p.cx, p.cy);
                  return [
                    s('circle', { cx: plot.X(p.cx), cy: plot.Y(p.cy), r: plot.X(R) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }),
                    s('path', { d: W.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2.5 }),
                  ];
                },
                points: [{ x: (p) => p.cx, y: (p) => p.cy, drag: { x: 'cx', y: 'cy' }, color: 'coral' }],
                readout: (p) => (Math.abs(p.cx) < 0.005 && Math.abs(p.cy) < 0.005 ? 'Centre at 0: the unit circle maps to a flat segment from −2 to 2.' : p.cx < -0.01 && p.cy > 0.02 ? '**A cambered airfoil**: rounded nose, sharp tail, curved upwards.' : 'Keep adjusting: left gives thickness, up gives curvature.'),
                goal: (p) => p.cx <= -0.03 && p.cx >= -0.25 && p.cy >= 0.04 && p.cy <= 0.25,
                hint: 'Drag the coral dot a little to the left (for a thick, rounded nose) and a little up (for an arched shape).',
                solution: { cx: -0.1, cy: 0.1 },
              },
              explain: r`Moving the centre left thickens the shape into a rounded nose; moving it up bends it into an arched, **cambered** wing; and because the circle passes through $z = 1$, the tail is sharp. In 1910 Nikolai Joukowski used this map to compute the lift on such wings, since the airflow around a circle is easy to work out and the conformal map carries it over to the wing.`,
            },
            {
              type: 'mcq',
              title: 'Why angles matter',
              prompt: r`Why is it useful for engineers that complex functions like $z + \frac1z$ preserve angles?`,
              choices: [
                { t: 'They carry solutions of flow and field problems from simple shapes (like circles) to complicated ones, keeping them valid', ok: true },
                { t: 'They make drawings look nicer', why: 'The value is mathematical: equations for ideal fluid flow, heat and electric fields stay solved after a conformal map.' },
                { t: 'They’re the only functions computers can draw', why: 'Computers can draw any function. Conformal maps are special because they preserve the equations of physics.' },
              ],
              explain: r`Ideal fluid flow, steady heat flow and electrostatic fields all obey Laplace's equation, which stays true under conformal maps. So engineers solve a problem around a circle or in a strip, then map the answer onto a wing, a cooling fin or a capacitor's edge. Before computers, this was one of the most powerful tools in applied mathematics.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Turned inside out',
              prompt: r`Under the map $w = \frac1z$, what is $|w|$ for $z = 2i$?`,
              answer: 0.5,
              wrong: [{ v: 2, why: r`$\left|\frac1z\right| = \frac{1}{|z|}$: inversion swaps big and small.` }],
              explain: r`$\frac{1}{2i} = -\frac{i}{2}$, with $|w| = \frac12$: a point outside the unit circle lands inside, at the reciprocal distance and with its angle negated (from $90°$ to $-90°$). Inversion maps circles to circles (or lines), and it's a key ingredient in the hyperbolic geometry of Escher's *Circle Limit* prints.`,
            },
          ],
          recap: [
            'Complex functions are maps of the plane: z² squares lengths and doubles angles; 1/z turns the plane inside out.',
            'Such maps preserve angles (conformal), carrying physics solutions to new shapes.',
            'The Joukowski map turns circles into airfoils.',
          ],
        },
      ],
    },
  ],
};
