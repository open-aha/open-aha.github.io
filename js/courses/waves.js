import { seg, label } from './_geo.js';
import { fix } from '../lib/svg.js';

const r = String.raw;
const G = 9.8;
const TAU = 2 * Math.PI;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d);

// zig-zag spring between two points (math coords) as an SVG path
function spring(plot, s, x, y1, y2, coils = 9, w = 0.28) {
  const pts = [[x, y1]];
  const n = coils * 2;
  for (let i = 1; i < n; i++) pts.push([x + (i % 2 ? w : -w), y1 + ((y2 - y1) * i) / n]);
  pts.push([x, y2]);
  return s('path', { d: pts.map((q, i) => `${i ? 'L' : 'M'}${plot.X(q[0])} ${plot.Y(q[1])}`).join(''), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
}

const springSim = (extra = {}) => ({
  kind: 'graph', xmin: -2.4, xmax: 10.6, ymin: -2.4, ymax: 3.6, grid: false, axes: false, height: 330,
  animate: { param: 't', speed: 1, max: 10, autoplay: true },
  params: {
    m: { min: 1, max: 4, step: 0.5, value: 1, label: '$m$', color: 'coral', format: (v) => `${fix(v, 1)} kg` },
    k: { min: 2, max: 16, step: 1, value: 4, label: '$k$', color: 'teal', format: (v) => `${v} N/m` },
    A: { min: 0.5, max: 2, step: 0.25, value: 1.5, label: '$A$', color: 'blue', format: (v) => `${fix(v, 2)} m` },
  },
  extra: ({ plot, p, s }) => {
    const w = Math.sqrt(p.k / p.m);
    const y = -p.A * Math.cos(w * p.t); // released from below equilibrium
    const els = [
      seg(plot, s, [-2.3, 3.3], [-0.7, 3.3], { stroke: 'var(--ink)', 'stroke-width': 4 }),
      seg(plot, s, [-2.3, 0], [10.4, 0], { stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '5 6' }),
      spring(plot, s, -1.5, 3.3, y + 0.32),
      s('rect', { x: plot.X(-1.95), y: plot.Y(y + 0.32), width: plot.X(0.9) - plot.X(0), height: plot.Y(0) - plot.Y(0.64), rx: 6, class: 'fl-coral' }),
      seg(plot, s, [0.4, -2.3], [0.4, 2.3], { stroke: 'var(--axis)', 'stroke-width': 1.5 }),
      label(plot, s, [10.2, 0], 't', 0, -8, { class: 'axis-label' }),
    ];
    const pts = [];
    const tt = Math.min(p.t, 10);
    for (let i = 0; i <= 300 && (i / 30) <= tt; i++) { const tau = i / 30; pts.push(`${i ? 'L' : 'M'}${plot.X(0.4 + tau)} ${plot.Y(-p.A * Math.cos(w * tau))}`); }
    if (pts.length > 1) els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }));
    els.push(seg(plot, s, [-1.05, y], [0.4 + tt, y], { stroke: 'var(--blue)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
    els.push(s('circle', { cx: plot.X(0.4 + tt), cy: plot.Y(y), r: 6, class: 'fl-blue', stroke: 'var(--card)', 'stroke-width': 2 }));
    return els;
  },
  readout: (p) => r`$T = 2\pi\sqrt{m/k} = ${f2(TAU * Math.sqrt(p.m / p.k))}$ s`,
  ...extra,
});

// damped oscillator (natural frequency 1 Hz), released from x = 1 at rest; zeta = damping ratio
const W0 = TAU;
function damped(z, t) {
  if (Math.abs(z - 1) < 1e-9) return (1 + W0 * t) * Math.exp(-W0 * t);
  if (z < 1) {
    const wd = W0 * Math.sqrt(1 - z * z);
    return Math.exp(-z * W0 * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
  }
  const q = Math.sqrt(z * z - 1), r1 = -W0 * (z - q), r2 = -W0 * (z + q);
  return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}
const settleTime = (z) => {
  let last = 0;
  for (let t = 0; t <= 6; t += 0.005) if (Math.abs(damped(z, t)) > 0.02) last = t;
  return last;
};
const overshoot = (z) => {
  let m = 0;
  for (let t = 0; t <= 6; t += 0.005) m = Math.min(m, damped(z, t));
  return -m;
};
// reflection at a boundary between impedances 1 and r: amplitude ratio
const reflAmp = (r) => (1 - r) / (1 + r);
// pulse on a string travelling right towards an end at x = 10 (fixed: inverted image; free: upright image)
const pulse = (x) => Math.exp(-((x) ** 2) / 0.6);
const stringAt = (x, t, free) => pulse(x - (2 + t)) + (free ? 1 : -1) * pulse(20 - x - (2 + t));
// coupled pendulums: in-phase mode at 1 Hz, out-of-phase mode at 1 Hz × sqrt(1 + 2k)
const w2 = (k) => W0 * Math.sqrt(1 + 2 * k);
const transferTime = (k) => Math.PI / (w2(k) - W0);

export default {
  id: 'waves',
  subject: 'physics',
  title: 'Waves & Oscillations',
  level: 'Intermediate',
  cover: 'waves',
  tagline: 'Springs, pendulums, music, damping, reflection and coupled oscillators: the physics of things that repeat.',
  description: r`Bounce springs and swing pendulums to discover simple harmonic motion. Then send waves down a string, make them interfere, find the notes of a guitar, and hear the Doppler effect. Finally, see why oscillations die away, how waves reflect at boundaries, and how coupled pendulums trade energy.`,
  prereq: 'Energy, and Trigonometry',
  chapters: [
    {
      title: 'Oscillations',
      summary: 'Back and forth, again and again.',
      lessons: [
        {
          id: 'shm',
          title: 'Springs',
          summary: 'Simple harmonic motion',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Bounce',
              body: r`A mass hangs on a spring. Pull it down and let go, and it bounces up and down. The graph records its position over time. Try changing the mass, the stiffness $k$, and the amplitude $A$ (how far it's pulled).`,
              widget: springSim(),
              after: 'The trace is a perfect cosine wave. Heavier masses bounce more slowly, and stiffer springs bounce faster.',
            },
            {
              type: 'mcq',
              title: 'Pull it further',
              prompt: 'If you pull the mass twice as far before letting go, what happens to the time for one bounce (the period)?',
              choices: [
                { t: 'It stays the same', ok: true },
                { t: 'It doubles', why: 'It does travel twice as far, but the spring pulls twice as hard, so it moves twice as fast. The two effects cancel.' },
                { t: 'It halves', why: 'Try it in the simulation: changing A doesn’t change the period.' },
              ],
              explain: r`A spring pulls back harder the further it's stretched ($F = -kx$). Double the distance, double the force, double the speed: the trip takes the same time. This is what makes springs (and pendulums) good clocks.`,
            },
            {
              type: 'explain',
              title: 'Simple harmonic motion',
              body: r`A restoring force proportional to displacement, $F = -kx$, always produces this smooth, sinusoidal motion, called **simple harmonic motion**:
$$x(t) = A\cos(\omega t), \qquad \omega = \sqrt{\frac{k}{m}}$$
One full cycle takes the **period**
$$T = \frac{2\pi}{\omega} = 2\pi\sqrt{\frac{m}{k}}$$
More mass makes it more sluggish (slower). A stiffer spring makes it snappier (faster). The amplitude doesn't appear at all.`,
            },
            {
              type: 'numeric',
              title: 'Compute a period',
              prompt: 'A 2 kg mass hangs on a spring with k = 8 N/m. What is the period of its bounce?',
              unit: 's',
              answer: Math.PI,
              tol: 0.02,
              wrong: [
                { v: 0.5, tol: 0.01, why: r`That's $\sqrt{m/k}$. Multiply by $2\pi$.` },
                { v: 4 * Math.PI, tol: 0.05, why: r`It's $\sqrt{m/k}$, not $\sqrt{k/m}$: $\sqrt{2/8} = 0.5$.` },
              ],
              explain: r`$T = 2\pi\sqrt{2/8} = 2\pi \times 0.5 = \pi \approx 3.14$ s.`,
            },
            {
              type: 'mcq',
              title: 'Four times the mass',
              prompt: 'You replace the mass with one 4 times as heavy. What happens to the period?',
              cols: 2,
              choices: [
                { t: 'It doubles', ok: true },
                { t: 'It becomes 4 times longer', why: r`The period goes as $\sqrt{m}$, and $\sqrt4 = 2$.` },
                { t: 'It halves', why: 'More mass makes the motion slower, so the period gets longer.' },
                { t: 'It stays the same', why: 'Mass does affect a spring’s period (unlike a pendulum’s).' },
              ],
              explain: r`$T \propto \sqrt{m}$, so 4 times the mass gives $\sqrt4 = 2$ times the period.`,
            },
            {
              type: 'mcq',
              title: 'Fastest point',
              prompt: 'Where is the bouncing mass moving fastest?',
              choices: [
                { t: 'Passing through the middle (equilibrium)', ok: true },
                { t: 'At the top and bottom of the bounce', why: 'At the extremes it stops for an instant before turning back.' },
                { t: 'Its speed is the same everywhere', why: 'It speeds up toward the middle and slows down toward the ends.' },
              ],
              explain: r`Energy sloshes back and forth. At the ends, all the energy is stored in the spring ($\tfrac12 kA^2$) and the mass is momentarily still. At the middle, the spring is relaxed and all the energy is kinetic, so the speed is greatest.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Top speed',
              body: r`The maximum speed in simple harmonic motion is $v_\text{max} = A\omega$.`,
              prompt: 'A 0.5 kg mass on a spring with k = 50 N/m oscillates with an amplitude of 0.1 m. What is its maximum speed?',
              unit: 'm/s',
              answer: 1,
              wrong: [
                { v: 10, why: r`That's $\omega$. Multiply by the amplitude.` },
                { v: 0.1, why: r`Multiply the amplitude by $\omega = \sqrt{50/0.5} = 10$ rad/s.` },
              ],
              explain: r`$\omega = \sqrt{k/m} = \sqrt{100} = 10$ rad/s, so $v_\text{max} = A\omega = 0.1 \times 10 = 1$ m/s.

Check with energy: $\tfrac12 kA^2 = \tfrac12 (50)(0.01) = 0.25$ J, and $\tfrac12 m v^2 = \tfrac12 (0.5)(1)^2 = 0.25$ J. ✓`,
            },
          ],
          recap: [
            r`A restoring force $F = -kx$ gives simple harmonic motion: $x = A\cos(\omega t)$.`,
            r`Period $T = 2\pi\sqrt{m/k}$. It doesn't depend on the amplitude.`,
            'The speed is greatest at equilibrium, and zero at the turning points.',
          ],
        },
        {
          id: 'pendulum',
          title: 'Pendulums',
          summary: 'Nature’s clock',
          icon: 'clock',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Heavier bob',
              prompt: 'Two pendulums have the same length. One bob is twice as heavy. Which swings back and forth faster?',
              choices: [
                { t: 'They swing at the same rate', ok: true },
                { t: 'The heavier one', why: 'Gravity pulls it harder, but it’s also harder to accelerate. The effects cancel, just like in free fall.' },
                { t: 'The lighter one', why: 'Mass doesn’t affect a pendulum’s swing rate.' },
              ],
              explain: r`It's the same reason heavy and light objects fall together: the extra pull of gravity is exactly matched by the extra inertia. A pendulum's period doesn't depend on its mass.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Swing',
              body: r`Change the length and the starting angle, and watch the period.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.2, xmax: 2.2, ymin: -2.6, ymax: 0.3, grid: false, axes: false, maxWidth: 520,
                animate: { param: 't', speed: 1, autoplay: true },
                params: {
                  L: { min: 0.25, max: 2.25, step: 0.25, value: 1, label: '$L$', color: 'blue', format: (v) => `${fix(v, 2)} m` },
                  a: { min: 5, max: 20, step: 1, value: 15, label: r`$\theta_0$`, color: 'violet', format: (v) => `${v}°` },
                },
                extra: ({ plot, p, s }) => {
                  // small-angle solution
                  const th = (p.a * Math.PI) / 180 * Math.cos(Math.sqrt(G / p.L) * p.t);
                  const bx = p.L * Math.sin(th), by = -p.L * Math.cos(th);
                  return [
                    seg(plot, s, [-0.8, 0], [0.8, 0], { stroke: 'var(--ink)', 'stroke-width': 4 }),
                    seg(plot, s, [0, 0], [0, -p.L - 0.15], { stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '4 5' }),
                    seg(plot, s, [0, 0], [bx, by], { stroke: 'var(--ink-2)', 'stroke-width': 2 }),
                    s('circle', { cx: plot.X(bx), cy: plot.Y(by), r: 14, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => r`$T = 2\pi\sqrt{L/g} = ${f2(TAU * Math.sqrt(p.L / G))}$ s`,
              },
            },
            {
              type: 'explain',
              title: 'The pendulum formula',
              body: r`For small swings, a pendulum of length $L$ has period
$$T = 2\pi\sqrt{\frac{L}{g}}$$
Only the length matters (and $g$). The mass and the size of the swing don't appear.

Legend has it that a young Galileo noticed this in 1583 by timing a swinging cathedral lamp against his pulse. Pendulum clocks, invented by Christiaan Huygens in 1656, were the world's most accurate timekeepers for nearly 300 years.`,
            },
            {
              type: 'numeric',
              title: 'One metre',
              prompt: 'What is the period of a 1 m long pendulum?',
              unit: 's',
              answer: TAU * Math.sqrt(1 / G),
              tol: 0.02,
              wrong: [
                { v: Math.sqrt(1 / G), tol: 0.01, why: r`Don't forget the $2\pi$.` },
                { v: TAU * Math.sqrt(G), tol: 0.1, why: r`It's $\sqrt{L/g}$, not $\sqrt{g/L}$.` },
              ],
              explain: r`$T = 2\pi\sqrt{1/9.8} \approx 2\pi \times 0.319 \approx 2.01$ s. A 1 m pendulum takes about one second to swing each way.`,
            },
            {
              type: 'mcq',
              title: 'Twice as slow',
              prompt: 'How must you change a pendulum’s length to double its period?',
              cols: 2,
              choices: [
                { t: 'Make it 4 times longer', ok: true },
                { t: 'Make it twice as long', why: r`$T \propto \sqrt{L}$, so doubling $L$ only multiplies $T$ by $\sqrt2 \approx 1.41$.` },
                { t: 'Make it half as long', why: 'A shorter pendulum swings faster.' },
                { t: 'Use a heavier bob', why: 'Mass doesn’t affect the period.' },
              ],
              explain: r`$T \propto \sqrt{L}$, so doubling $T$ needs $L$ to grow by $2^2 = 4$.`,
            },
            {
              type: 'numeric',
              title: 'Grandfather clock',
              prompt: 'A grandfather clock’s pendulum has a period of exactly 2 s (1 s per swing). How long is it?',
              unit: 'm',
              answer: G / (Math.PI * Math.PI),
              tol: 0.005,
              wrong: [{ v: 1, tol: 0.004, why: r`Close, but not quite. Solve $2 = 2\pi\sqrt{L/9.8}$ for $L$.` }],
              explain: r`$\sqrt{L/g} = \frac{T}{2\pi} = \frac{1}{\pi}$, so $L = \frac{g}{\pi^2} = \frac{9.8}{9.87} \approx 0.993$ m. In 1791, France considered defining the metre as the length of this "seconds pendulum" before choosing a fraction of Earth's meridian instead.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'On the Moon',
              prompt: r`You take a pendulum clock to the Moon, where $g \approx 1.6$ m/s². How does its period change?`,
              choices: [
                { t: 'It gets longer, by about 2.5 times', ok: true },
                { t: 'It gets shorter, by about 2.5 times', why: r`Weaker gravity pulls the bob back more gently, so it swings more slowly.` },
                { t: 'It gets about 6 times longer', why: r`The period goes as $1/\sqrt{g}$: $\sqrt{9.8/1.6} \approx 2.5$, not $9.8/1.6$.` },
                { t: 'It doesn’t change', why: r`$g$ is in the formula, so changing gravity changes the period.` },
              ],
              explain: r`$T \propto \frac{1}{\sqrt{g}}$. The Moon's gravity is about 6 times weaker, so the period is $\sqrt{9.8/1.6} \approx 2.5$ times longer. The clock would run very slow.`,
            },
          ],
          recap: [
            r`For small swings, $T = 2\pi\sqrt{L/g}$: it depends only on the length and on gravity.`,
            r`$T \propto \sqrt{L}$: four times the length gives twice the period.`,
            'Mass and (small) amplitude don’t matter, which is why pendulums make good clocks.',
          ],
        },
      ],
    },
    {
      title: 'Waves',
      summary: 'Disturbances that travel.',
      lessons: [
        {
          id: 'traveling-waves',
          title: 'Traveling Waves',
          summary: 'Wavelength, frequency, speed',
          icon: 'play',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Cork on a pond',
              prompt: 'Ripples spread across a pond and pass under a floating cork. What does the cork do?',
              choices: [
                { t: 'It bobs up and down, staying in roughly the same place', ok: true },
                { t: 'It gets carried along with the waves', why: 'The wave moves across the pond, but the water itself mostly just moves up and down.' },
                { t: 'It stays completely still', why: 'The passing wave does lift and lower it.' },
              ],
              explain: r`A wave carries **energy** from place to place, not matter. Each bit of water just moves up and down as the wave passes. Watch the orange dot on the next screen.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A wave on a string',
              body: r`The wave travels to the right, but the {coral:orange dot} (one bit of the string) only moves up and down. Change the wavelength and the frequency.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: -1.8, ymax: 1.8, grid: 1, gridY: 1, height: 260, axes: { xlabel: 'x (m)', ylabel: 'y' },
                animate: { param: 't', speed: 1, autoplay: true },
                params: {
                  lam: { min: 1, max: 6, step: 0.5, value: 4, label: r`$\lambda$`, color: 'blue', format: (v) => `${fix(v, 1)} m` },
                  f: { min: 0.25, max: 2, step: 0.25, value: 0.5, label: '$f$', color: 'violet', format: (v) => `${fix(v, 2)} Hz` },
                },
                curves: [{ f: (x, p) => Math.sin(TAU * (x / p.lam - p.f * p.t)), color: 'blue' }],
                points: [{ x: () => 6, y: (p) => Math.sin(TAU * (6 / p.lam - p.f * p.t)), color: 'coral' }],
                extra: ({ plot, p, s }) => {
                  // wavelength marker between two crests
                  const shift = (p.f * p.t * p.lam) % p.lam;
                  const x1 = p.lam / 4 + shift, x2 = x1 + p.lam;
                  if (x2 > 11.8) return [];
                  return [
                    seg(plot, s, [x1, 1.45], [x2, 1.45], { stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
                    label(plot, s, [(x1 + x2) / 2, 1.45], 'λ', 0, -6, { class: 'lbl' }),
                  ];
                },
                readout: (p) => r`$v = f\lambda = ${fix(p.f, 2)} \times ${fix(p.lam, 1)} = ${f2(p.f * p.lam)}$ m/s`,
              },
            },
            {
              type: 'explain',
              title: 'Describing a wave',
              body: r`- **Wavelength** $\lambda$: the distance from one crest to the next.
- **Frequency** $f$: how many crests pass a point each second, in hertz (Hz).
- **Period** $T = 1/f$: the time between crests.

In one period, the wave moves forward one wavelength, so its speed is
$$v = f\lambda$$

Waves on a string, like water ripples, are **transverse**: the string moves across the direction the wave travels. Sound is **longitudinal**: air squeezes and stretches along the direction of travel.`,
            },
            {
              type: 'numeric',
              title: 'Wave speed',
              prompt: 'A wave has a wavelength of 2 m and a frequency of 3 Hz. How fast does it travel?',
              unit: 'm/s',
              answer: 6,
              wrong: [{ v: 1.5, tol: 0.01, why: r`Multiply: $v = f\lambda$.` }, { v: 0.67, tol: 0.01, why: r`Multiply: $v = f\lambda = 3 \times 2$.` }],
              explain: r`$v = f\lambda = 3 \times 2 = 6$ m/s.`,
            },
            {
              type: 'numeric',
              title: 'Concert A',
              prompt: 'The note A above middle C has a frequency of 440 Hz. Sound travels at 343 m/s in air. What is its wavelength?',
              unit: 'm',
              answer: 343 / 440,
              tol: 0.005,
              wrong: [{ v: 440 / 343, tol: 0.01, why: r`$\lambda = v / f$, not $f / v$.` }],
              explain: r`$\lambda = \frac{v}{f} = \frac{343}{440} \approx 0.78$ m, about the length of your arm.`,
            },
            {
              type: 'mcq',
              title: 'Higher pitch',
              prompt: 'A speaker plays a note at twice the frequency, in the same air. What happens to the wavelength?',
              cols: 2,
              choices: [
                { t: 'It halves', ok: true },
                { t: 'It doubles', why: r`The speed is fixed by the air. If $f$ doubles in $v = f\lambda$, then $\lambda$ must halve.` },
                { t: 'It stays the same', why: r`The speed is fixed, so $\lambda = v/f$ has to change.` },
              ],
              explain: r`The speed of sound is set by the medium (the air), not by the source. With $v$ fixed, $\lambda = v/f$: double the frequency means half the wavelength.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Radio',
              prompt: r`An FM radio station broadcasts at 100 MHz ($10^8$ Hz). Radio waves travel at the speed of light, $3 \times 10^8$ m/s. What is the wavelength?`,
              unit: 'm',
              answer: 3,
              wrong: [{ v: 0.33, tol: 0.01, why: r`$\lambda = v/f = \frac{3 \times 10^8}{10^8}$.` }],
              explain: r`$\lambda = \frac{3 \times 10^8}{1 \times 10^8} = 3$ m. That's why FM antennas are around a metre long, a fraction of the wavelength.`,
            },
          ],
          recap: [
            'Waves carry energy, not matter.',
            r`$v = f\lambda$, and the period is $T = 1/f$.`,
            'The medium sets the wave speed. Changing the frequency changes the wavelength.',
          ],
        },
        {
          id: 'interference',
          title: 'Interference',
          summary: 'When waves add up, or cancel',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Adding waves',
              body: r`When two waves meet, they simply **add**: the displacements add point by point. Shift the {violet:second wave} relative to the {blue:first} and watch their {coral:sum}.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4 * Math.PI, ymin: -2.3, ymax: 2.3, grid: false, height: 300, axes: { xlabel: 'x', ylabel: 'y', xticks: 100 },
                params: { ph: { min: 0, max: 360, step: 15, value: 60, label: r`shift`, color: 'violet', format: (v) => `${v}°` } },
                curves: [
                  { f: (x) => Math.sin(x), color: 'blue', width: 2 },
                  { f: (x, p) => Math.sin(x + (p.ph * Math.PI) / 180), color: 'violet', width: 2 },
                  { f: (x, p) => Math.sin(x) + Math.sin(x + (p.ph * Math.PI) / 180), color: 'coral', width: 4 },
                ],
                readout: (p) => r`amplitude of the sum $= ${f2(Math.abs(2 * Math.cos((p.ph * Math.PI) / 360)))}$`,
              },
            },
            {
              type: 'mcq',
              title: 'Cancel out',
              prompt: 'What shift makes the two waves cancel completely?',
              cols: 2,
              choices: [
                { t: '180° (half a wavelength)', ok: true },
                { t: '0°', why: 'With no shift, the crests line up and the sum is twice as big.' },
                { t: '90°', why: r`At 90° the sum is smaller than 2, about $\sqrt2 \approx 1.41$, but not zero.` },
                { t: '360°', why: 'A full wavelength of shift lines the crests up again.' },
              ],
              explain: r`Shift by half a wavelength (180°) and every crest of one wave meets a trough of the other. They cancel everywhere.`,
            },
            {
              type: 'explain',
              title: 'Constructive and destructive',
              body: r`- **Constructive interference:** crests meet crests (in phase). The waves reinforce each other.
- **Destructive interference:** crests meet troughs (shifted by half a wavelength). The waves cancel.

Noise-cancelling headphones use destructive interference. A microphone listens to outside noise, and the speaker plays the same sound shifted by half a cycle, so the two cancel at your ear.`,
            },
            {
              type: 'explain',
              title: 'Beats',
              body: r`Add two notes with **slightly different** frequencies, and they drift in and out of step. The loudness swells and fades: these are **beats**. The number of beats per second is the difference between the frequencies:
$$f_\text{beat} = |f_1 - f_2|$$`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2, ymin: -2.3, ymax: 2.3, grid: 0.25, gridY: 1, height: 260, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 't (s)', ylabel: 'y' },
                params: { f2: { min: 10, max: 14, step: 0.5, value: 11, label: '$f_2$', color: 'violet', format: (v) => `${fix(v, 1)} Hz` } },
                curves: [{ f: (t, p) => Math.sin(TAU * 10 * t) + Math.sin(TAU * p.f2 * t), color: 'coral', width: 2 }, { f: (t, p) => 2 * Math.abs(Math.cos(Math.PI * (p.f2 - 10) * t)), color: 'ink', dash: true, width: 1.5 }],
                readout: (p) => r`$f_1 = 10$ Hz: $\;$ beats $= |10 - ${fix(p.f2, 1)}| = ${f2(Math.abs(p.f2 - 10), 1)}$ per second`,
              },
            },
            {
              type: 'mcq',
              title: 'Tuning a guitar',
              body: r`A guitarist plays a string together with a 440 Hz tuning fork and hears 3 beats per second.`,
              prompt: 'What could the string’s frequency be?',
              choices: [
                { t: 'Either 437 Hz or 443 Hz', ok: true },
                { t: 'Exactly 443 Hz', why: r`The beat frequency is the **size** of the difference. A string 3 Hz too low gives beats too.` },
                { t: '1320 Hz', why: r`That's $3 \times 440$. Beats come from the *difference* between the two frequencies.` },
              ],
              explain: r`$|f - 440| = 3$, so $f = 437$ or $443$ Hz. Tighten the string slightly: if the beats slow down, you're going the right way. When the beats disappear, it's in tune.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Two speakers',
              body: r`Two speakers play the same 343 Hz tone, perfectly in step. Sound travels at 343 m/s, so the wavelength is 1 m. You stand where you are exactly 0.5 m farther from one speaker than from the other.`,
              prompt: 'What do you hear?',
              choices: [
                { t: 'Very little: the waves (nearly) cancel', ok: true },
                { t: 'A louder tone than either speaker alone', why: 'That happens where the path difference is a whole number of wavelengths: 0, 1 m, 2 m…' },
                { t: 'Beats', why: 'Beats need two *different* frequencies. These speakers play the same one.' },
              ],
              explain: r`The extra 0.5 m is half a wavelength. The farther speaker's waves arrive half a cycle late, so crests meet troughs: destructive interference. (In a real room, echoes stop the cancellation from being perfect.)`,
            },
          ],
          recap: [
            'Overlapping waves add together (superposition).',
            'In phase: constructive interference. Half a wavelength out of phase: destructive interference.',
            r`Two close frequencies make beats at $|f_1 - f_2|$ per second.`,
          ],
        },
        {
          id: 'standing-waves',
          title: 'Strings & Music',
          summary: 'Standing waves and harmonics',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A vibrating string',
              body: r`A string tied at both ends can only vibrate in certain patterns, called **standing waves**. Choose the harmonic number $n$.`,
              widget: {
                kind: 'graph', xmin: -0.05, xmax: 1.05, ymin: -1.4, ymax: 1.4, grid: false, axes: false, height: 230,
                animate: { param: 't', speed: 1, autoplay: true },
                params: { n: { min: 1, max: 6, step: 1, value: 2, label: '$n$', color: 'coral', format: (v) => `${v}` } },
                curves: [
                  { f: (x, p) => Math.sin(p.n * Math.PI * x) * Math.cos(TAU * 0.6 * p.n * p.t), color: 'coral', from: () => 0, to: () => 1 },
                  { f: (x, p) => Math.sin(p.n * Math.PI * x), color: 'muted', dash: true, width: 1.5, from: () => 0, to: () => 1 },
                  { f: (x, p) => -Math.sin(p.n * Math.PI * x), color: 'muted', dash: true, width: 1.5, from: () => 0, to: () => 1 },
                ],
                extra: ({ plot, p, s }) => {
                  const els = [s('rect', { x: plot.X(-0.04), y: plot.Y(1.2), width: 6, height: plot.Y(-1.2) - plot.Y(1.2), class: 'fl-ink' }), s('rect', { x: plot.X(1) + 1, y: plot.Y(1.2), width: 6, height: plot.Y(-1.2) - plot.Y(1.2), class: 'fl-ink' })];
                  for (let k = 0; k <= p.n; k++) els.push(s('circle', { cx: plot.X(k / p.n), cy: plot.Y(0), r: 5, class: 'fl-blue' }));
                  return els;
                },
                readout: (p) => r`$\lambda = \frac{2L}{${p.n}}$, $\quad f_${p.n} = ${p.n} f_1$, $\quad$ nodes (blue) $= ${p.n + 1}$`,
              },
            },
            {
              type: 'numeric',
              title: 'Count the nodes',
              body: r`The points that never move are called **nodes**.`,
              prompt: 'How many nodes does the 3rd harmonic have, counting the two fixed ends?',
              answer: 4,
              wrong: [
                { v: 2, why: 'Don’t forget the nodes in between the ends.' },
                { v: 3, why: 'Count the ends too: the 3rd harmonic has 3 loops, separated by 2 inner nodes.' },
              ],
              explain: r`The $n$th harmonic has $n$ loops and $n + 1$ nodes. So the 3rd has 4 nodes: two ends plus two in between.`,
            },
            {
              type: 'explain',
              title: 'Harmonics',
              body: r`The ends must be nodes, so a whole number of half-wavelengths must fit along the string of length $L$:
$$\lambda_n = \frac{2L}{n}, \qquad f_n = \frac{v}{\lambda_n} = n\,\frac{v}{2L} = n f_1$$
The lowest frequency, $f_1$, is the **fundamental**. The others are whole-number multiples: the **harmonics**. A real string vibrates in many harmonics at once, and their mix is why a guitar and a violin sound different playing the same note.`,
            },
            {
              type: 'numeric',
              title: 'Guitar string',
              prompt: 'A guitar string is 0.65 m long, and waves travel along it at 143 m/s. What is its fundamental frequency?',
              unit: 'Hz',
              answer: 110,
              tol: 0.5,
              wrong: [
                { v: 220, tol: 0.5, why: r`The fundamental's wavelength is $2L$, not $L$.` },
                { v: 93, tol: 0.5, why: r`$f_1 = \frac{v}{2L} = \frac{143}{1.3}$.` },
              ],
              explain: r`$f_1 = \frac{v}{2L} = \frac{143}{2 \times 0.65} = \frac{143}{1.3} = 110$ Hz. That's the note A2, the open 5th string of a guitar.`,
            },
            {
              type: 'mcq',
              title: 'The 12th fret',
              prompt: 'Pressing a string at its midpoint (the 12th fret) halves its vibrating length. What happens to the note?',
              choices: [
                { t: 'Its frequency doubles: one octave higher', ok: true },
                { t: 'Its frequency halves: one octave lower', why: r`A shorter string means a shorter wavelength, and so a **higher** frequency.` },
                { t: 'The pitch doesn’t change', why: r`$f_1 = v/(2L)$ depends on the length.` },
              ],
              explain: r`$f_1 = v/(2L)$: halve $L$ and $f$ doubles. Doubling a frequency is what musicians call going up an **octave**. Notes an octave apart sound like "the same note, higher".`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Tighten up',
              prompt: 'Tightening a guitar string makes waves travel along it faster. What does that do to the pitch?',
              cols: 2,
              choices: [
                { t: 'Raises it', ok: true },
                { t: 'Lowers it', why: r`$f_1 = v/(2L)$: bigger $v$, bigger $f$.` },
                { t: 'No change', why: 'The wave speed is in the formula for the frequency.' },
              ],
              explain: r`The length is fixed, so the wavelength $2L$ is fixed. Faster waves mean $f = v/\lambda$ goes up. That's how tuning pegs work: tighter means higher.`,
            },
          ],
          recap: [
            r`A string fixed at both ends supports standing waves with $\lambda_n = 2L/n$.`,
            r`Harmonics: $f_n = n f_1$, where $f_1 = v/(2L)$.`,
            'Half the length or double the frequency makes an octave. Tighter strings sound higher.',
          ],
        },
        {
          id: 'doppler',
          title: 'The Doppler Effect',
          summary: 'Why sirens change pitch',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Passing siren',
              prompt: 'An ambulance drives past you with its siren on. What do you hear?',
              choices: [
                { t: 'Higher pitch as it approaches, lower as it moves away', ok: true },
                { t: 'Lower pitch as it approaches, higher as it moves away', why: 'It’s the other way round. Think about the sound waves bunching up in front of the ambulance.' },
                { t: 'The same pitch, just louder and then quieter', why: 'The loudness changes, but so does the pitch. Listen next time one passes!' },
              ],
              explain: r`That familiar "neee-oooow" is the **Doppler effect**, named after Christian Doppler, who described it in 1842. The next screen shows why it happens.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Bunching up',
              body: r`The source sends out a circular wavefront at regular intervals, and each one spreads at the speed of sound. Speed the source up.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -3.2, ymax: 3.2, grid: false, axes: false,
                animate: { param: 't', speed: 1, autoplay: true, max: 6 },
                params: { u: { min: 0, max: 1.2, step: 0.1, value: 0.5, label: 'speed', color: 'coral', format: (v) => `${Math.round(v * 100)}% of sound` } },
                extra: ({ plot, p, s }) => {
                  const c = 1.6, period = 0.5, x0 = -4.5;
                  const els = [];
                  const R = (rr) => plot.X(rr) - plot.X(0);
                  for (let k = 0; k * period <= p.t; k++) {
                    const te = k * period;
                    const cx = x0 + p.u * c * te;
                    const rr = c * (p.t - te);
                    els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(0), r: Math.max(0, R(rr)), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2, opacity: Math.max(0.15, 1 - rr / 9) }));
                  }
                  const sx = x0 + p.u * c * p.t;
                  els.push(s('circle', { cx: plot.X(sx), cy: plot.Y(0), r: 9, class: 'fl-coral' }));
                  els.push(label(plot, s, [5.2, 2.6], 'ahead', 0, 0, { class: 'tick' }), label(plot, s, [-5.2, 2.6], 'behind', 0, 0, { class: 'tick' }));
                  return els;
                },
              },
              after: r`Ahead of the source, the wavefronts are squeezed together: shorter wavelength, **higher** frequency. Behind it, they're stretched out: **lower** frequency. At 100% of the speed of sound, the fronts pile up into a **shock wave**.`,
            },
            {
              type: 'explain',
              title: 'The formula',
              body: r`For a source moving at speed $v_s$ toward a stationary listener, in a medium where sound travels at speed $v$:
$$f' = f\,\frac{v}{v - v_s} \quad\text{(approaching)}, \qquad f' = f\,\frac{v}{v + v_s} \quad\text{(moving away)}$$`,
            },
            {
              type: 'numeric',
              title: 'Approaching',
              prompt: 'An ambulance siren sounds at 700 Hz. The ambulance approaches you at 30 m/s, and sound travels at 343 m/s. What frequency do you hear?',
              unit: 'Hz',
              answer: (700 * 343) / 313,
              tol: 1,
              wrong: [
                { v: (700 * 343) / 373, tol: 1, why: 'That’s the formula for a source moving away. When it’s approaching, subtract the speed in the denominator.' },
                { v: 730, tol: 1, why: r`The shift isn't just $f + v_s$. Use $f' = f \cdot v/(v - v_s)$.` },
              ],
              explain: r`$f' = 700 \times \frac{343}{343 - 30} = 700 \times \frac{343}{313} \approx 767$ Hz.`,
            },
            {
              type: 'numeric',
              title: 'Moving away',
              prompt: 'Once it has passed, what frequency do you hear as it moves away at 30 m/s?',
              unit: 'Hz',
              answer: (700 * 343) / 373,
              tol: 1,
              wrong: [{ v: (700 * 343) / 313, tol: 1, why: 'That’s the approaching frequency. Moving away, add the speed in the denominator.' }],
              explain: r`$f' = 700 \times \frac{343}{343 + 30} = 700 \times \frac{343}{373} \approx 644$ Hz. As it passes, the pitch drops from about 767 Hz to about 644 Hz.`,
            },
            {
              type: 'mcq',
              title: 'Sound barrier',
              prompt: 'What happens when a jet flies faster than the speed of sound?',
              choices: [
                { t: 'Its wavefronts pile up into a cone-shaped shock wave, heard on the ground as a sonic boom', ok: true },
                { t: 'It becomes completely silent', why: 'It still makes sound, but its own sound can’t get ahead of it. The waves pile up behind it in a cone.' },
                { t: 'Its sound reaches you before the plane does', why: 'The plane outruns its own sound, so it’s the other way round.' },
              ],
              explain: r`The jet outruns its own sound waves, which overlap along a cone trailing behind it. When that cone sweeps over you, you hear a sudden **sonic boom**. Try the simulation again at 110–120%.`,
            },
            {
              type: 'explain',
              kicker: 'Big picture',
              title: 'Redshift',
              body: r`The Doppler effect works for light too. Light from a source moving away is stretched to longer wavelengths, shifted toward the red end of the spectrum: a **redshift**.

In the 1920s, astronomers found that light from distant galaxies is redshifted, and that farther galaxies are redshifted more. That was the first evidence that the **universe is expanding**.`,
            },
          ],
          recap: [
            'A moving source squeezes the waves ahead of it (higher frequency) and stretches the waves behind it (lower frequency).',
            r`$f' = f\,v/(v \mp v_s)$ for a source approaching (−) or moving away (+).`,
            'Faster than sound, the wavefronts pile up into a sonic boom. For light, the same effect gives redshift.',
          ],
        },
      ],
    },
    {
      title: 'Energy, Boundaries and Coupling',
      summary: 'Damping, reflection and normal modes.',
      lessons: [
        {
          id: 'damping',
          title: 'Damping',
          summary: 'Why oscillations die away',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Losing energy',
              body: r`Real oscillators lose energy to friction and air resistance. With damping proportional to speed, the amplitude decays **exponentially**:
$$x(t) = A_0\, e^{-t/\tau} \cos(\omega t)$$
Each equal time interval removes the same **fraction** of the amplitude, just like radioactive decay.`,
            },
            {
              type: 'numeric',
              title: 'Fading swings',
              prompt: r`A swing's amplitude halves every 10 seconds. What fraction of the original amplitude is left after 30 seconds?`,
              answer: 0.125,
              wrong: [{ v: 0.25, why: '30 s is three halvings, not two.' }, { v: 1 / 6, tol: 0.002, why: r`Halving three times gives $\left(\frac12\right)^3$.` }],
              explain: r`Three halvings: $\left(\frac12\right)^3 = \frac18$. Since energy goes as amplitude squared, only $\frac{1}{64}$ of the energy remains.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tune the suspension',
              prompt: r`A car hits a bump and its body is displaced by 1 unit. The suspension springs have a natural frequency of 1 Hz. Adjust the damping ratio $\zeta$ of the shock absorbers to find the setting that returns the car to level **as fast as possible without overshooting**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3, ymin: -1, ymax: 1.1, grid: 0.5, gridY: 0.5, height: 270, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 'time (s)', ylabel: 'displacement' },
                params: { z: { min: 0.05, max: 3, step: 0.05, value: 0.2, label: r`damping $\zeta$`, color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (t, p) => damped(p.z, t), color: 'violet', width: 3 }, { f: () => 0.02, color: 'muted', dash: true, width: 1 }, { f: () => -0.02, color: 'muted', dash: true, width: 1 }],
                readout: (p) => r`overshoot $${(100 * overshoot(p.z)).toFixed(1)}\%$, $\;$ settles within 2% after $${settleTime(p.z).toFixed(2)}$ s ${p.z < 1 ? '(underdamped)' : p.z > 1.0001 ? '(overdamped)' : '(critically damped)'}`,
                goal: (p) => Math.abs(p.z - 1) < 1e-9,
                hint: 'Too little damping and the car bounces; too much and it creeps back slowly. Find the boundary.',
                solution: { z: 1 },
              },
              explain: r`$\zeta = 1$ is **critical damping**: the fastest return with no overshoot. Below it, the car bounces past level (underdamped); above it, the shock absorbers are so stiff that it oozes back slowly (overdamped). Real cars are usually set a little below critical, around $\zeta \approx 0.2$–$0.4$ for comfort: a small overshoot is acceptable if the ride feels softer.`,
            },
            {
              type: 'mcq',
              title: 'Worn shock absorbers',
              prompt: r`A car with worn-out shock absorbers keeps bouncing after every bump. In terms of damping, what's happened?`,
              choices: [
                { t: 'It has become strongly underdamped: too little damping', ok: true },
                { t: 'It has become overdamped', why: 'Overdamped systems never bounce. They return slowly without oscillating.' },
                { t: 'Its natural frequency has dropped to zero', why: 'The springs still set the frequency. The missing ingredient is damping.' },
              ],
              explain: r`The springs still store and release energy, but the worn dampers barely remove any, so the car oscillates several times. Mechanics test this by pushing down on each corner: a healthy car rebounds once and settles.`,
            },
            {
              type: 'numeric',
              title: 'The quality factor',
              prompt: r`The **quality factor** of an oscillator is $Q = 2\pi \times \frac{\text{energy stored}}{\text{energy lost per cycle}}$. A pendulum loses 1% of its energy each swing. What's its $Q$? (Nearest whole number.)`,
              answer: Math.round(TAU / 0.01),
              tol: 1,
              wrong: [{ v: 100, why: r`Don't forget the factor of $2\pi$.` }],
              explain: r`$Q = 2\pi \times 100 \approx 628$. Roughly, $Q$ is the number of radians of oscillation before most of the energy is gone. A good pendulum clock has $Q$ in the thousands; a car suspension, close to 1.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Crystal clocks',
              prompt: r`The quartz crystal in a watch has a $Q$ of around 10,000 to 100,000. Why does a very high $Q$ make it an excellent timekeeper?`,
              choices: [
                { t: 'It rings at a sharply defined frequency, and needs only a tiny energy top-up each cycle, so disturbances barely affect it', ok: true },
                { t: 'High Q means it vibrates faster', why: 'Q measures how slowly energy is lost, not how fast it vibrates.' },
                { t: 'High Q makes it immune to temperature', why: 'Temperature still matters a little. The benefit is the sharp, stable resonance.' },
              ],
              explain: r`A high-$Q$ oscillator responds only within a very narrow band of frequencies, so it "insists" on its own frequency. Quartz watches use a 32,768 Hz crystal ($2^{15}$ Hz, convenient to halve 15 times down to 1 tick per second), accurate to a few seconds a month.`,
            },
          ],
          recap: [
            'Damping makes the amplitude decay exponentially.',
            'Critical damping (ζ = 1) returns fastest without overshoot.',
            'The quality factor Q measures how slowly energy is lost.',
          ],
        },
        {
          id: 'reflection',
          title: 'Reflection & Impedance',
          summary: 'What happens at the end of the line',
          icon: 'left',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hitting the wall',
              body: r`Send a pulse along a rope towards an end at $x = 10$. Move time forward, and try both kinds of end: **fixed** (tied to a wall) and **free** (a loose ring on a pole).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10.5, ymin: -1.6, ymax: 1.6, grid: 1, gridY: 1, height: 220, axes: false,
                params: {
                  t: { min: 0, max: 14, step: 0.1, value: 0, label: 'time', color: 'blue', format: (v) => v.toFixed(1) },
                  e: { min: 0, max: 1, step: 1, value: 0, label: 'end', color: 'violet', format: (v) => (v ? 'free' : 'fixed') },
                },
                curves: [{ f: (x, p) => stringAt(x, p.t, p.e === 1), from: 0, to: 10, color: 'blue', width: 3.5 }],
                extra: ({ plot, p, s }) => [
                  s('line', { x1: plot.X(0), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--line-2)', 'stroke-width': 1 }),
                  p.e ? s('line', { x1: plot.X(10), x2: plot.X(10), y1: plot.Y(-1.5), y2: plot.Y(1.5), stroke: 'var(--ink-3)', 'stroke-width': 3 }) : s('rect', { x: plot.X(10), y: plot.Y(1.5), width: 14, height: plot.Y(-1.5) - plot.Y(1.5), class: 'fl-ink' }),
                  p.e ? s('circle', { cx: plot.X(10), cy: plot.Y(stringAt(10, p.t, true)), r: 7, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }) : null,
                ].filter(Boolean),
              },
              after: r`At a **fixed** end, the pulse comes back **upside down**. At a **free** end, it comes back **upright**, and while it reflects, the free end briefly flicks up to twice the pulse's height.`,
            },
            {
              type: 'mcq',
              title: 'Why upside down?',
              prompt: r`Why does a pulse reflect inverted from a fixed end?`,
              choices: [
                { t: 'The rope pulls the wall upwards; by Newton’s third law, the wall pulls the rope downwards, launching an inverted pulse', ok: true },
                { t: 'The pulse loses energy at the wall', why: 'An ideal fixed end reflects all the energy. The inversion comes from the force the wall exerts.' },
                { t: 'Waves always invert when they reflect', why: 'At a free end, the reflection is upright.' },
              ],
              explain: r`The fixed end can't move, so the incoming and reflected pulses must always cancel there. That requires the reflection to be inverted. At a free end, there's no force holding the end down, so it overshoots and launches an upright pulse.`,
            },
            {
              type: 'explain',
              title: 'Impedance',
              body: r`Most boundaries are in between: a light rope tied to a heavy one, sound going from air into water, ultrasound entering the body. What decides how much reflects is the **impedance** $Z$ of each medium (for a string, $Z = \sqrt{T\mu}$: tension times mass per length).

The reflected amplitude, as a fraction of the incoming one, is
$$\frac{Z_1 - Z_2}{Z_1 + Z_2}$$
and the fraction of **energy** reflected is its square. Matched impedances ($Z_1 = Z_2$) mean no reflection at all.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Half and half',
              prompt: r`A wave passes from a medium with impedance 1 into one with impedance $Z_2$. Find the value of $Z_2$ (greater than 1) for which **exactly half** the energy is reflected.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 10, ymin: 0, ymax: 1, grid: 1, gridY: 0.1, height: 260, axes: { xlabel: 'impedance ratio Z₂ / Z₁', ylabel: 'energy fraction', xAt: 1, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { r: { min: 1, max: 10, step: 0.01, value: 2, slider: false } },
                curves: [{ f: (r) => reflAmp(r) ** 2, color: 'coral', width: 3 }, { f: (r) => 1 - reflAmp(r) ** 2, color: 'teal', width: 3 }],
                points: [{ x: (p) => p.r, y: (p) => reflAmp(p.r) ** 2, drag: { x: 'r' }, color: 'coral' }],
                readout: (p) => r`$Z_2 = ${p.r.toFixed(2)}$: reflected $${(100 * reflAmp(p.r) ** 2).toFixed(1)}\%$ (coral), transmitted $${(100 * (1 - reflAmp(p.r) ** 2)).toFixed(1)}\%$ (teal)`,
                goal: (p) => Math.abs(reflAmp(p.r) ** 2 - 0.5) < 0.005,
                hint: 'Find where the coral and teal curves cross.',
                solution: { r: 5.83 },
              },
              explain: r`$\left(\frac{1 - Z_2}{1 + Z_2}\right)^2 = \frac12$ gives $Z_2 = \frac{1 + 1/\sqrt2}{1 - 1/\sqrt2} = 3 + 2\sqrt2 \approx 5.83$. Even a large mismatch transmits a good share of the energy, but a huge mismatch reflects almost everything.`,
            },
            {
              type: 'numeric',
              title: 'Why ultrasound needs gel',
              prompt: r`The acoustic impedance of skin and tissue is about 1.6 million units; that of air is about 400. If a thin layer of air sat between the probe and the skin, what percentage of the ultrasound energy would be reflected? (1 decimal place.)`,
              unit: '%',
              answer: 100 * ((1.6e6 - 400) / (1.6e6 + 400)) ** 2,
              tol: 0.06,
              wrong: [{ v: 50, why: r`Compute $\left(\frac{Z_1 - Z_2}{Z_1 + Z_2}\right)^2$ with these very different values.` }],
              explain: r`$\left(\frac{1{,}600{,}000 - 400}{1{,}600{,}400}\right)^2 \approx 0.999$: 99.9% bounces straight back. Gel replaces the air with a material whose impedance is close to the skin's, so the sound gets in. The same mismatch is why you can barely hear people talking above you when you're underwater.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Light rope, heavy rope',
              prompt: r`A light rope is tied to a rope 4 times heavier per metre, under the same tension, so its impedance is $\sqrt4 = 2$ times larger. What percentage of a pulse's energy is reflected at the knot? (1 decimal place.)`,
              unit: '%',
              answer: 100 / 9,
              tol: 0.06,
              wrong: [{ v: 100 / 3, tol: 0.1, why: r`That's the amplitude fraction, $\frac13$. Energy goes as amplitude squared.` }, { v: 36, tol: 0.1, why: r`The impedance ratio is 2, not 4: $Z = \sqrt{T\mu}$.` }],
              explain: r`Amplitude ratio $\frac{1 - 2}{1 + 2} = -\frac13$ (inverted, since the second rope is heavier, more like a wall). Energy reflected: $\frac19 \approx 11.1\%$; the other 88.9% continues into the heavy rope.`,
            },
          ],
          recap: [
            'Fixed ends reflect waves inverted; free ends reflect them upright.',
            r`Reflected amplitude fraction $\frac{Z_1 - Z_2}{Z_1 + Z_2}$; energy fraction is its square.`,
            'Impedance matching (like ultrasound gel) lets waves pass through boundaries.',
          ],
        },
        {
          id: 'coupled',
          title: 'Coupled Oscillators',
          summary: 'Energy that swaps back and forth',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Two pendulums and a spring',
              body: r`Hang two identical pendulums side by side and connect them with a weak spring. Start one swinging and hold the other still. Gradually the first one slows to a stop while the second swings fully, then the energy flows back again, over and over.

In 1665, Christiaan Huygens noticed that two pendulum clocks hanging from the same beam ended up swinging in step: coupled through the beam's tiny vibrations.`,
            },
            {
              type: 'explain',
              title: 'Normal modes',
              body: r`The motion is simple in terms of two **normal modes**, patterns in which both pendulums swing at a single frequency:
- **In phase**: both swing together, the spring never stretches, so the frequency is the same as a lone pendulum's, $\omega_0$.
- **Out of phase**: they swing in opposite directions; the spring adds a restoring force, so the frequency is higher, $\omega_0\sqrt{1 + 2\kappa}$, where $\kappa$ measures the spring's strength.

Starting one pendulum alone is a 50–50 mix of both modes. The two frequencies drift in and out of step, making **beats**: the energy moves from one pendulum to the other.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A five-second handover',
              prompt: r`Pendulum 1 (blue) starts swinging at 1 Hz; pendulum 2 (coral) starts at rest. Adjust the coupling $\kappa$ until the energy moves completely across to pendulum 2 in **5 seconds**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: -2.4, ymax: 2.4, grid: 1, gridY: 1.2, height: 270, axes: false,
                params: { k: { min: 0.02, max: 0.3, step: 0.005, value: 0.05, label: r`coupling $\kappa$`, color: 'violet', format: (v) => v.toFixed(3) } },
                curves: [
                  { f: (t, p) => 1.2 + 0.5 * (Math.cos(W0 * t) + Math.cos(w2(p.k) * t)) * 0.95, color: 'blue', width: 2 },
                  { f: (t, p) => -1.2 + 0.5 * (Math.cos(W0 * t) - Math.cos(w2(p.k) * t)) * 0.95, color: 'coral', width: 2 },
                ],
                extra: ({ plot, p, s }) => {
                  const T = transferTime(p.k), els = [];
                  for (let x = T; x < 12; x += 2 * T) els.push(s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(-2.3), y2: plot.Y(2.3), stroke: 'var(--violet)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
                  for (let k = 1; k <= 12; k++) els.push(s('text', { x: plot.X(k), y: plot.Y(-2.35) + 2, 'text-anchor': 'middle', class: 'tick', text: `${k}` }));
                  return els;
                },
                readout: (p) => r`mode frequencies 1 Hz and $${(w2(p.k) / W0).toFixed(3)}$ Hz: complete handover after $${transferTime(p.k).toFixed(2)}$ s (dashed lines)`,
                goal: (p) => Math.abs(transferTime(p.k) - 5) < 0.15,
                hint: r`The handover time is half a beat period: $\frac{1}{2(f_2 - f_1)}$. You need $f_2 = 1.1$ Hz.`,
                solution: { k: 0.105 },
              },
              explain: r`A full handover takes half a beat period, $\frac{1}{2(f_2 - f_1)}$. For 5 s you need $f_2 - f_1 = 0.1$ Hz, so $\sqrt{1 + 2\kappa} = 1.1$ and $\kappa = 0.105$. Weaker coupling means slower handovers, but the energy still transfers completely.`,
            },
            {
              type: 'numeric',
              title: 'Close frequencies',
              prompt: r`Two coupled pendulums have normal-mode frequencies of 1.00 Hz and 1.05 Hz. How long does it take for the energy to pass completely from one pendulum to the other?`,
              unit: 's',
              answer: 10,
              wrong: [{ v: 20, why: 'That’s the full beat period: there and back. One handover takes half of it.' }, { v: 0.05, why: 'That’s the frequency difference. Handover time = 1 ÷ (2 × 0.05).' }],
              explain: r`$\frac{1}{2 \times 0.05} = 10$ s. The smaller the frequency difference, the slower the swap.`,
            },
            {
              type: 'mcq',
              title: 'Modes everywhere',
              prompt: r`Where else do normal modes of coupled oscillators matter?`,
              choices: [
                { t: 'All of these: molecules vibrating, tall buildings swaying, and the sound of musical instruments', ok: true },
                { t: 'Only pendulums', why: 'Any system of connected oscillating parts has normal modes.' },
                { t: 'Only electrical circuits', why: 'Coupled circuits have normal modes too, but so do molecules, buildings and instruments.' },
              ],
              explain: r`A CO₂ molecule has symmetric and asymmetric stretching modes, and the asymmetric one absorbs infrared light, which is why CO₂ is a greenhouse gas. Skyscrapers have swaying modes that engineers tame with tuned mass dampers. A violin body's modes give it its tone.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Swinging together',
              prompt: r`A single pendulum has a period of 2 s. It's coupled by a spring to an identical pendulum. In the **in-phase** normal mode, what is the period?`,
              unit: 's',
              answer: 2,
              wrong: [{ v: 1, why: 'In the in-phase mode the spring never stretches, so it has no effect.' }, { v: 1.8, tol: 0.15, why: 'That would be the out-of-phase mode, which is faster. In phase, the spring stays at its natural length.' }],
              explain: r`Moving in step, the two pendulums keep the spring at its natural length, so it exerts no force: each swings exactly as if alone, with period 2 s. Only the out-of-phase mode feels the spring.`,
            },
          ],
          recap: [
            'Coupled oscillators share energy back and forth.',
            'Their motion is a mix of normal modes, each with its own frequency.',
            'Energy hands over in half a beat period: 1/(2Δf).',
          ],
        },
      ],
    },
  ],
};
