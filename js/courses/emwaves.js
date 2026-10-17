import { fix, sig } from '../lib/svg.js';

const r = String.raw;
const TAU = 2 * Math.PI;

// a band of the spectrum for a given log10(wavelength in metres)
const BANDS = [
  [-Infinity, -11, 'gamma rays', 'emitted by atomic nuclei and in cosmic explosions'],
  [-11, -8, 'X-rays', 'pass through soft tissue: medical imaging'],
  [-8, -6.4, 'ultraviolet', 'causes sunburn; makes some materials fluoresce'],
  [-6.4, -6.15, 'visible light', 'the narrow band our eyes evolved to see'],
  [-6.15, -3, 'infrared', 'heat radiation; TV remotes; thermal cameras'],
  [-3, 0, 'microwaves', 'microwave ovens, Wi-Fi, radar, mobile phones, GPS'],
  [0, Infinity, 'radio waves', 'FM and AM broadcasting, radio astronomy'],
];
const band = (lg) => BANDS.find(([a, b]) => lg >= a && lg < b);
const fmtLen = (m) => {
  const units = [[1e3, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm']];
  // three significant figures throughout: these values span many powers of ten (DESIGN.md, Live numbers)
  for (const [u, n] of units) if (m >= u) return `${sig(m / u, 3)} ${n}`;
  return `${sig(m / 1e-12, 3)} pm`;
};
const fmtFreq = (f) => {
  const units = [[1e18, 'EHz'], [1e15, 'PHz'], [1e12, 'THz'], [1e9, 'GHz'], [1e6, 'MHz'], [1e3, 'kHz']];
  for (const [u, n] of units) if (f >= u) return `${sig(f / u, 3)} ${n}`;
  return `${sig(f, 3)} Hz`;
};

// phased array: 8 antennas half a wavelength apart, phase step phi (degrees) between neighbours
const arrayGain = (thDeg, phiDeg, N = 8) => { const psi = Math.PI * Math.sin((thDeg * Math.PI) / 180) + (phiDeg * Math.PI) / 180; let re = 0, im = 0; for (let n = 0; n < N; n++) { re += Math.cos(n * psi); im += Math.sin(n * psi); } return Math.hypot(re, im) / N; };
const beamDir = (phiDeg) => { let best = 0, bg = -1; for (let t = -90; t <= 90; t += 0.25) { const g = arrayGain(t, phiDeg); if (g > bg) { bg = g; best = t; } } return best; };

export default {
  id: 'emwaves',
  subject: 'physics',
  title: 'Electromagnetic Waves',
  level: 'Advanced',
  cover: 'emwaves',
  tagline: 'Light, radio and X-rays: one kind of wave across a vast spectrum, and how we send signals with it.',
  description: r`In 1865, James Clerk Maxwell realised that light is a ripple of electric and magnetic fields. Explore how these waves travel, tour the spectrum from radio to gamma rays, play with polarisers, measure the speed of light with a microwave oven, see why light itself can push, put a message on a radio wave, and steer beams with phased arrays.`,
  prereq: 'Magnetism & Induction',
  chapters: [
    {
      title: 'Waves of Fields',
      summary: 'Maxwell’s great unification.',
      lessons: [
        {
          id: 'maxwell',
          title: 'Light Is a Wave of Fields',
          summary: 'Electric and magnetic, together',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'A self-sustaining wave',
              body: r`Two discoveries from electromagnetism:
- A **changing magnetic field** creates an electric field (Faraday's law: that's how generators work).
- A **changing electric field** creates a magnetic field (Maxwell's addition).

Put them together: a changing E-field makes a changing B-field, which makes a changing E-field, and so on. The pattern can **travel on its own**, even through empty space. Maxwell calculated its speed from two constants measured in electrical labs, and got the speed of light.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'An electromagnetic wave',
              body: r`The $\blue{\text{electric field}}$ oscillates up and down. The $\coral{\text{magnetic field}}$ oscillates in the perpendicular, horizontal direction (drawn in perspective). The wave travels to the right.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 12.5, ymin: -2.6, ymax: 2.6, grid: false, axes: false, height: 300,
                animate: { param: 't', speed: 1, autoplay: true },
                params: {
                  t: { min: 0, max: 1e9, step: 0.001, value: 0, slider: false },
                  lam: { min: 2, max: 6, step: 0.5, value: 4, label: 'wavelength', color: 'violet', format: (v) => fix(v, 1) },
                },
                extra: ({ plot, p, s }) => {
                  const k = TAU / p.lam, w = TAU * 0.4;
                  const E = (x) => 1.6 * Math.sin(k * x - w * p.t);
                  const els = [s('line', { x1: plot.X(0), x2: plot.X(12), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 2, 'marker-end': 'url(#arrowhead)' })];
                  let dE = '', dB = '';
                  for (let i = 0; i <= 240; i++) {
                    const x = (12 * i) / 240;
                    const e = E(x), b = 0.9 * E(x);
                    dE += `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(e).toFixed(1)}`;
                    dB += `${i ? 'L' : 'M'}${plot.X(x - 0.55 * b).toFixed(1)} ${plot.Y(-0.5 * b).toFixed(1)}`;
                  }
                  for (let x = 0.25; x < 12; x += 0.5) {
                    const e = E(x), b = 0.9 * e;
                    els.push(s('line', { x1: plot.X(x), y1: plot.Y(0), x2: plot.X(x), y2: plot.Y(e), stroke: 'var(--blue)', 'stroke-width': 1.5, opacity: 0.45 }));
                    els.push(s('line', { x1: plot.X(x), y1: plot.Y(0), x2: plot.X(x - 0.55 * b), y2: plot.Y(-0.5 * b), stroke: 'var(--coral)', 'stroke-width': 1.5, opacity: 0.45 }));
                  }
                  els.push(s('path', { d: dB, fill: 'none', class: 'st-coral', 'stroke-width': 3 }), s('path', { d: dE, fill: 'none', class: 'st-blue', 'stroke-width': 3.5 }));
                  return els;
                },
                readout: () => r`$\blue{E}$ and $\coral{B}$ rise and fall **together**, at right angles to each other and to the direction of travel.`,
              },
              after: r`Electromagnetic waves are **transverse**: both fields wiggle across the direction of travel, never along it. All of them, radio, light and X-rays, travel through vacuum at the same speed, $c$.`,
            },
            {
              type: 'numeric',
              title: 'The magnetic part',
              prompt: r`In an electromagnetic wave the magnetic field strength is $B = \frac{E}{c}$. A strong radio signal near a transmitter has $E = 300$ V/m. What is $B$, in microtesla? ($c = 3 \times 10^8$ m/s.)`,
              unit: 'µT',
              answer: 1,
              wrong: [{ v: 9e10, why: 'Divide by c, don’t multiply.' }, { v: 1e-6, why: 'That’s in tesla. Convert to microtesla.' }],
              explain: r`$B = \frac{300}{3 \times 10^8} = 10^{-6}$ T $= 1$ µT, about 50 times weaker than Earth's magnetic field. The magnetic part of light is small in these units, but it carries exactly half the wave's energy.`,
            },
            {
              type: 'mcq',
              title: 'Shake a charge',
              prompt: 'What does a charged particle need to do to send out an electromagnetic wave?',
              choices: [
                { t: 'Accelerate: speed up, slow down or change direction', ok: true },
                { t: 'Just move at a steady speed', why: 'A charge moving steadily carries its field along with it but doesn’t radiate. It has to accelerate.' },
                { t: 'Sit still', why: 'A charge at rest has a steady electric field, with no wave.' },
              ],
              explain: r`Only **accelerating** charges radiate. Electrons sloshing back and forth in an antenna make radio waves; electrons slamming into a metal target in an X-ray tube make X-rays; electrons whirling around a synchrotron make brilliant beams of light. Every electromagnetic wave began with a charge being shaken.`,
            },
            {
              type: 'mcq',
              title: 'No medium needed',
              prompt: r`Sound needs air to travel through. What does light need?`,
              choices: [
                { t: r`Nothing: electromagnetic waves travel through empty space, each field regenerating the other`, ok: true },
                { t: r`An invisible "ether" filling space`, why: r`Nineteenth-century physicists thought so, but the Michelson–Morley experiment found no sign of it.` },
                { t: r`Air, like sound`, why: r`Light crosses the vacuum between the Sun and Earth.` },
              ],
              explain: r`A changing electric field creates a magnetic field and vice versa, so the wave carries itself along. That’s why we can see stars across empty space, and why the "luminiferous ether" was eventually abandoned.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Maxwell’s calculation',
              prompt: r`Maxwell's theory predicts a speed $c = \dfrac{1}{\sqrt{\mu_0 \varepsilon_0}}$. With $\mu_0 = 1.257 \times 10^{-6}$ and $\varepsilon_0 = 8.854 \times 10^{-12}$ (SI units), what is $c$? Give it in units of $10^8$ m/s.`,
              unit: r`$\times 10^8$ m/s`,
              answer: 1 / Math.sqrt(1.257e-6 * 8.854e-12) / 1e8,
              tol: 0.01,
              wrong: [{ v: 0.334, tol: 0.01, why: r`You need the **reciprocal**: $c = 1/\sqrt{\mu_0\varepsilon_0}$.` }, { v: 9, tol: 0.1, why: r`Don't forget the square root: $c^2 = 1/(\mu_0\varepsilon_0) \approx 9 \times 10^{16}$.` }],
              explain: r`$\mu_0\varepsilon_0 \approx 1.113 \times 10^{-17}$, so $c = 1/\sqrt{1.113 \times 10^{-17}} \approx 3.00 \times 10^8$ m/s. Maxwell wrote that "we can scarcely avoid the inference that light consists in the transverse undulations of the same medium which is the cause of electric and magnetic phenomena". Heinrich Hertz confirmed it in 1887 by making radio waves in his lab.`,
            },
          ],
          recap: [
            'Changing electric and magnetic fields create each other and travel as a wave.',
            'EM waves are transverse: E and B are perpendicular to each other and to the direction of travel.',
            r`All EM waves move at $c = 1/\sqrt{\mu_0\varepsilon_0} \approx 3.00 \times 10^8$ m/s in vacuum.`,
          ],
        },
        {
          id: 'spectrum',
          title: 'The Spectrum',
          summary: 'From radio to gamma rays',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'One wave, many names',
              body: r`Light, radio and X-rays differ only in wavelength. Slide across the spectrum (each tick is a factor of 10 in wavelength).`,
              widget: {
                kind: 'graph', xmin: -13.5, xmax: 3.5, ymin: -1.4, ymax: 1.5, grid: false, axes: false, height: 200,
                params: { lg: { min: -13, max: 3, step: 0.25, value: -6.25, label: 'wavelength', color: 'violet', format: (v) => fmtLen(10 ** v) } },
                extra: ({ plot, p, s }) => {
                  const cols = ['violet', 'blue', 'violet', 'amber', 'coral', 'teal', 'blue'];
                  const els = [];
                  BANDS.forEach(([a, b], i) => {
                    const x0 = Math.max(a, -13), x1 = Math.min(b, 3);
                    els.push(s('rect', { x: plot.X(x0), y: plot.Y(0.35), width: plot.X(x1) - plot.X(x0), height: plot.Y(-0.35) - plot.Y(0.35), class: `fl-${cols[i]}`, opacity: 0.18 + 0.1 * (i % 2), stroke: 'var(--card)', 'stroke-width': 1 }));
                  });
                  // a rainbow for the visible band
                  const vis = ['#7b3fd6', '#2f6bff', '#18a058', '#f2c200', '#ff7a1a', '#e5322d'];
                  vis.forEach((c, i) => {
                    const x0 = -6.4 + (0.25 * i) / 6;
                    els.push(s('rect', { x: plot.X(x0), y: plot.Y(0.35), width: plot.X(x0 + 0.25 / 6) - plot.X(x0) + 0.5, height: plot.Y(-0.35) - plot.Y(0.35), fill: c }));
                  });
                  for (let e = -13; e <= 3; e++) els.push(s('line', { x1: plot.X(e), x2: plot.X(e), y1: plot.Y(-0.35), y2: plot.Y(-0.55), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(s('text', { x: plot.X(-13), y: plot.Y(-0.95), class: 'lbl', text: '← short, high energy' }));
                  els.push(s('text', { x: plot.X(3), y: plot.Y(-0.95), 'text-anchor': 'end', class: 'lbl', text: 'long, low energy →' }));
                  els.push(s('path', { d: `M${plot.X(p.lg)} ${plot.Y(0.45)} l-9 -14 h18 Z`, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => {
                  const [, , name, use] = band(p.lg);
                  const lam = 10 ** p.lg;
                  return r`**${name}**: $\lambda = $ ${fmtLen(lam)}, $f = $ ${fmtFreq(3e8 / lam)}. ${use[0].toUpperCase() + use.slice(1)}.`;
                },
              },
              after: r`Visible light, from about 400 nm (violet) to 700 nm (red), is a tiny sliver of the full spectrum. For every wave, $c = f\lambda$: shorter wavelength means higher frequency.`,
            },
            {
              type: 'numeric',
              title: 'An FM station',
              prompt: r`An FM radio station broadcasts at 100 MHz. What is its wavelength?`,
              unit: 'm',
              answer: 3,
              wrong: [{ v: 3e16, why: r`$\lambda = c / f$: divide, don't multiply.` }, { v: 0.33, tol: 0.01, why: r`That's $f / c$ (with the units mixed). Use $\lambda = \frac{3 \times 10^8}{1 \times 10^8}$.` }, { v: 3000000, why: 'Mega means 10⁶, so 100 MHz = 10⁸ Hz.' }],
              explain: r`$\lambda = \dfrac{c}{f} = \dfrac{3 \times 10^8}{10^8} = 3$ m.`,
            },
            {
              type: 'explain',
              title: 'Photons',
              body: r`Light also comes in packets of energy called **photons** (see the Quantum Physics course). Each photon carries energy
$$E = hf, \qquad h = 6.63 \times 10^{-34}\ \text{J·s}$$
So high-frequency waves have high-energy photons. A single ultraviolet or X-ray photon carries enough energy to break chemical bonds, including in DNA. Radio photons carry billions of times less.`,
            },
            {
              type: 'numeric',
              title: 'Wi-Fi wavelength',
              prompt: r`Wi-Fi often uses radio waves at 2.4 GHz. What is their wavelength, in centimetres? ($c = 3 \times 10^8$ m/s.)`,
              unit: 'cm',
              answer: 12.5,
              tol: 0.05,
              wrong: [{ v: 0.125, tol: 0.001, why: r`That’s in metres. Convert to centimetres.` }],
              explain: r`$\lambda = \frac{3 \times 10^8}{2.4 \times 10^9} = 0.125$ m $= 12.5$ cm. Microwave ovens use almost the same frequency (2.45 GHz), which is why a running microwave can interfere with Wi-Fi.`,
            },
            {
              type: 'numeric',
              title: 'An X-ray photon',
              prompt: r`A photon’s energy is $E = \frac{1240\ \text{eV·nm}}{\lambda}$. What is the energy of an X-ray photon with wavelength 0.1 nm, in keV?`,
              unit: 'keV',
              answer: 12.4,
              tol: 0.05,
              explain: r`$\frac{1240}{0.1} = 12{,}400$ eV $= 12.4$ keV, thousands of times a visible photon’s 2–3 eV, enough to knock electrons out of atoms. That’s why X-rays are ionising and visible light isn’t.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which can damage cells?',
              prompt: r`Why can UV light cause sunburn, while even a very bright red lamp can't?`,
              choices: [
                { t: 'Each UV photon has enough energy to break molecular bonds; red photons don’t, no matter how many arrive', ok: true },
                { t: 'UV light is brighter', why: 'Even a very bright red light doesn’t burn this way. It’s about the energy of each photon, not the total.' },
                { t: 'UV travels faster', why: 'All EM waves travel at the same speed, c.' },
              ],
              explain: r`Damage happens one photon at a time. A UV photon (around 300 nm) carries about 4 eV, enough to break bonds in DNA. A red photon (700 nm) carries about 1.8 eV, which isn't enough, however many arrive. This is the same physics as the photoelectric effect.`,
            },
          ],
          recap: [
            'Radio, microwaves, infrared, visible, UV, X-rays and gamma rays are all EM waves.',
            r`$c = f\lambda$. Visible light spans about 400–700 nm.`,
            r`Photon energy $E = hf$: high-frequency photons can break chemical bonds.`,
          ],
        },
      ],
    },
    {
      title: 'Working with Waves',
      summary: 'Polarisation, antennas and pressure.',
      lessons: [
        {
          id: 'polarisation',
          title: 'Polarisation',
          summary: 'Filters, sunglasses and a paradox',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Which way does it wiggle?',
              body: r`The direction in which a wave's electric field oscillates is its **polarisation**. Ordinary light (from the Sun or a bulb) is a jumble of all directions: **unpolarised**.

A **polariser** only lets through the component of the field along its axis. Unpolarised light loses **half** its intensity passing through. Light that is already polarised at an angle $\theta$ to the polariser's axis is reduced by **Malus's law**:
$$I = I_0 \cos^2\theta$$`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Two polarisers',
              body: r`Unpolarised light passes through a vertical polariser, then a second polariser at angle $\theta$. Rotate the second one.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 0, ymax: 0.55, grid: 15, gridY: 0.1, height: 300, axes: { xlabel: 'θ (degrees)', ylabel: 'I / I₀' },
                params: { th: { min: 0, max: 90, step: 5, value: 30, label: 'angle θ', color: 'violet', format: (v) => `${v}°` } },
                curves: [{ f: (x) => 0.5 * Math.cos((x * Math.PI) / 180) ** 2, color: 'violet' }],
                points: [{ x: (p) => p.th, y: (p) => 0.5 * Math.cos((p.th * Math.PI) / 180) ** 2, color: 'coral' }],
                readout: (p) => r`after both polarisers: $I = \tfrac12 I_0 \cos^2 ${p.th}° = ${(0.5 * Math.cos((p.th * Math.PI) / 180) ** 2).toFixed(3)}\,I_0$`,
              },
              after: r`At 0°, all the light from the first polariser gets through (half the original). At 90°, the polarisers are **crossed** and nothing gets through at all.`,
            },
            {
              type: 'numeric',
              title: 'The three-polariser paradox',
              prompt: r`Two crossed polarisers (0° and 90°) block all light. Now slide a **third** polariser at 45° **between** them. What fraction of the original unpolarised light gets through?`,
              answer: 0.125,
              tol: 0.002,
              wrong: [{ v: 0, why: 'Surprisingly, adding a filter lets light through! Apply Malus’s law at each step.' }, { v: 0.25, why: r`Don't forget the first polariser halves the unpolarised light: $\frac12 \times \cos^2 45° \times \cos^2 45°$.` }, { v: 0.5, why: r`Each 45° step passes only $\cos^2 45° = \frac12$.` }],
              explain: r`First polariser: $\tfrac12$. Through the 45° filter: $\times \cos^2 45° = \tfrac12$. Through the 90° filter (45° away): $\times \tfrac12$ again. Total: $\tfrac18$ of the original. Adding a filter lets **more** light through, because each polariser doesn't just block: it **re-points** the polarisation along its own axis.`,
            },
            {
              type: 'numeric',
              title: 'Thirty degrees',
              prompt: r`Unpolarised light passes through a vertical polariser, then a second polariser at $30°$ to it. What percentage of the original intensity gets through? (Use $I = \frac12 I_0 \cos^2\theta$.)`,
              unit: '%',
              answer: 50 * Math.cos(Math.PI / 6) ** 2,
              tol: 0.1,
              wrong: [{ v: 75, why: r`Don’t forget the first polariser halves unpolarised light.` }],
              explain: r`$\frac12 \times \cos^2 30° = \frac12 \times \frac34 = \frac38 = 37.5\%$. Photographers rotate a polarising filter to control reflections and darken skies in exactly this way.`,
            },
            {
              type: 'numeric',
              title: 'Thirty degrees apart',
              prompt: r`Polarised light passes a polariser turned $30°$ from its polarisation. By Malus’s law, what percentage gets through?`,
              unit: '%',
              answer: 75,
              tol: 0.5,
              explain: r`$\cos^2 30° = \frac34 = 75\%$. At $45°$ it would be 50%, and at $90°$ nothing.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Polarised sunglasses',
              prompt: r`Glare reflected off a lake or a wet road is largely polarised **horizontally**. Which way should the axis of polarising sunglasses point?`,
              cols: 2,
              choices: [
                { t: 'Vertical', ok: true },
                { t: 'Horizontal', why: 'That would let the glare straight through. Block horizontal polarisation by transmitting vertical.' },
                { t: 'At 45°', why: 'That would only halve the glare. Vertical blocks it best.' },
              ],
              explain: r`A vertical axis blocks horizontally polarised glare ($\cos^2 90° = 0$) while still letting through half of the ordinary unpolarised light. Tilt your head while wearing polarised sunglasses and the glare comes back. LCD screens also emit polarised light, which is why some go dark when viewed through polarised lenses at the wrong angle.`,
            },
          ],
          recap: [
            'Polarisation is the direction the electric field oscillates.',
            r`Unpolarised light: a polariser passes half. Polarised light: $I = I_0\cos^2\theta$.`,
            'A middle polariser at 45° lets 1/8 through two crossed polarisers.',
          ],
        },
        {
          id: 'microwaves',
          title: 'Antennas & Microwaves',
          summary: 'Measuring c in your kitchen',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Antennas',
              body: r`An antenna is a conductor in which electrons are pushed back and forth at the wave's frequency. It works best when its length matches the wavelength: a common design is a **half-wave dipole**, with total length $\lambda/2$.

That's why antennas shrank as frequencies rose: AM radio towers are tens of metres tall or more, while a phone's gigahertz antennas fit inside its case.`,
            },
            {
              type: 'numeric',
              title: 'A Wi-Fi antenna',
              prompt: r`Fast Wi-Fi also uses a 5 GHz band. How long is a half-wave dipole antenna for it, in centimetres?`,
              unit: 'cm',
              answer: 3,
              tol: 0.05,
              wrong: [{ v: 6, tol: 0.05, why: r`That's the full wavelength. A half-wave dipole is $\lambda/2$.` }, { v: 1.5, tol: 0.05, why: r`That's $\lambda/4$. The question asks for half a wavelength.` }],
              explain: r`$\lambda = \dfrac{3 \times 10^8}{5 \times 10^9} = 0.06$ m $= 6$ cm, so a half-wave dipole is about **3 cm**: small enough to hide several inside a router, one for each band and stream.`,
            },
            {
              type: 'explain',
              title: 'Chocolate and the speed of light',
              body: r`A microwave oven fills its box with **standing waves** at 2.45 GHz. At the antinodes, the field is strong and food heats fast. At the nodes, it barely heats. Adjacent hot spots are **half a wavelength** apart.

Take out the turntable, put in a bar of chocolate, and run the oven for 20 seconds or so. Melted spots appear at the antinodes. Measure their spacing and you can calculate the speed of light!`,
            },
            {
              type: 'numeric',
              title: 'Kitchen physics',
              prompt: r`The melted spots on the chocolate are 6.1 cm apart, and the oven's label says 2,450 MHz. What value of $c$ does this give? Answer in units of $10^8$ m/s.`,
              unit: r`$\times 10^8$ m/s`,
              answer: 2 * 0.061 * 2.45e9 / 1e8,
              tol: 0.02,
              wrong: [{ v: 1.49, tol: 0.02, why: r`The spots are **half** a wavelength apart: $\lambda = 2 \times 6.1$ cm.` }, { v: 29890, tol: 60, why: 'Convert to SI units first: 12.2 cm = 0.122 m and 2,450 MHz = 2.45 × 10⁹ Hz.' }],
              explain: r`$\lambda = 2 \times 6.1 = 12.2$ cm $= 0.122$ m. Then $c = f\lambda = 2.45 \times 10^9 \times 0.122 \approx 2.99 \times 10^8$ m/s. Not bad for a kitchen!`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Standing waves in the oven',
              body: r`Microwaves bounce between the oven’s metal walls and form a **standing wave**: some points oscillate strongly, others not at all. Step through one cycle and watch where a bar of chocolate (bottom) would melt.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3, ymin: -1.9, ymax: 1.3, grid: false, axes: false, maxWidth: 560, height: 260,
                params: { t: { min: 0, max: 1, step: 0.02, value: 0.1, label: 'time (fraction of a cycle)', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => Math.abs(Math.sin(2 * Math.PI * x)), color: 'muted', dash: true }, { f: (x) => -Math.abs(Math.sin(2 * Math.PI * x)), color: 'muted', dash: true }, { f: (x, p) => Math.sin(2 * Math.PI * x) * Math.cos(2 * Math.PI * p.t), color: 'violet', width: 3 }],
                extra: ({ plot, s }) => { const out = [s('rect', { x: plot.X(0), y: plot.Y(-1.4), width: plot.X(3) - plot.X(0), height: plot.Y(-1.8) - plot.Y(-1.4), rx: 4, class: 'fl-amber-soft', stroke: 'var(--amber)' })]; for (let k = 0; k < 6; k++) out.push(s('ellipse', { cx: plot.X(0.25 + 0.5 * k), cy: plot.Y(-1.6), rx: 14, ry: 7, class: 'fl-coral' })); for (let k = 0; k <= 6; k++) out.push(s('line', { x1: plot.X(0.5 * k), x2: plot.X(0.5 * k), y1: plot.Y(-1.25), y2: plot.Y(1.25), stroke: 'var(--line-2)', 'stroke-dasharray': '2 4' })); return out; },
                readout: () => 'the field never moves at the nodes (dotted lines); melting spots sit halfway between, **half a wavelength apart**',
              },
              after: r`The nodes stay still and the antinodes swing hardest, so heating is strongest every half wavelength. That is why ovens have turntables, and why removing the turntable and measuring the melted spots lets you work out the wavelength.`,
            },
            {
              type: 'mcq',
              title: 'A common myth',
              prompt: r`Is 2.45 GHz a special "resonant frequency" of water molecules?`,
              choices: [
                { t: 'No: water absorbs a broad range of microwave frequencies, and 2.45 GHz is a practical compromise', ok: true },
                { t: 'Yes: water absorbs only at exactly 2.45 GHz', why: 'Liquid water absorbs microwaves over a very broad range. No sharp resonance is involved.' },
              ],
              explain: r`Water molecules are **polar**: the oscillating field keeps twisting them, and they jostle their neighbours, turning the wave's energy into heat. That works over a wide range of frequencies. 2.45 GHz is an internationally allocated band, chosen as a trade-off: lower frequencies penetrate food more deeply but heat more slowly. (Water absorbs most strongly at much higher frequencies, but then the waves wouldn't penetrate far.)`,
            },
          ],
          recap: [
            'A half-wave dipole antenna is about λ/2 long.',
            'Microwave ovens make standing waves. Hot spots are λ/2 apart.',
            'Microwaves heat food by twisting polar water molecules, not by a sharp resonance.',
          ],
        },
        {
          id: 'pressure',
          title: 'Light Pushes',
          summary: 'Radiation pressure and solar sails',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Momentum without mass',
              body: r`Electromagnetic waves carry **momentum** as well as energy. A beam of intensity $I$ (W/m²) that is fully absorbed pushes on a surface with pressure
$$P = \frac{I}{c}$$
A perfect mirror gets **twice** that push, $2I/c$, because the light bounces back (just as a ball bouncing off a wall gives it twice the impulse of a ball that sticks).`,
            },
            {
              type: 'numeric',
              title: 'Sunlight’s push',
              prompt: r`Near Earth, sunlight has intensity 1,361 W/m². What pressure does it exert on a perfect mirror facing the Sun? Answer in micropascals (µPa).`,
              unit: 'µPa',
              answer: (2 * 1361) / 3e8 * 1e6,
              tol: 0.1,
              wrong: [{ v: 4.54, tol: 0.05, why: 'That’s for an absorbing surface. A mirror gets twice the push.' }, { v: 0.0091, tol: 0.001, why: r`Convert to micropascals: multiply pascals by $10^6$.` }],
              explain: r`$P = \dfrac{2I}{c} = \dfrac{2 \times 1361}{3 \times 10^8} \approx 9.1 \times 10^{-6}$ Pa $= 9.1$ µPa: about a ten-billionth of atmospheric pressure. Tiny, but it never stops, and in space there's no friction.`,
            },
            {
              type: 'numeric',
              title: 'One photon’s push',
              prompt: r`A photon of wavelength $\lambda$ carries momentum $p = \frac{h}{\lambda}$, with $h = 6.63 \times 10^{-34}$ J·s. What is the momentum of a green photon ($\lambda = 500$ nm), in units of $10^{-27}$ kg·m/s? (2 decimal places.)`,
              unit: r`$\times 10^{-27}$ kg·m/s`,
              answer: 6.63e-34 / 500e-9 / 1e-27,
              tol: 0.01,
              wrong: [{ v: 6.63e-34 * 500e-9 / 1e-27, tol: 1e-9, why: r`Divide by the wavelength: $\frac{6.63 \times 10^{-34}}{5 \times 10^{-7}}$.` }],
              explain: r`$p = \frac{6.63 \times 10^{-34}}{5 \times 10^{-7}} \approx 1.33 \times 10^{-27}$ kg·m/s. Unimaginably small, but a sunbeam delivers around $10^{21}$ photons per square metre every second, and those add up to the push you computed.`,
            },
            {
              type: 'mcq',
              title: 'Optical tweezers',
              prompt: r`Arthur Ashkin won a share of the 2018 Nobel Prize in Physics for "optical tweezers". What do they do?`,
              choices: [
                { t: 'Use the push and pull of a tightly focused laser beam to hold and move tiny objects like cells and DNA', ok: true },
                { t: 'Cut materials with lasers', why: 'Laser cutting uses heat. Optical tweezers use the momentum of light to trap particles gently.' },
                { t: 'Bend light around objects to hide them', why: 'That’s invisibility cloaking. Tweezers trap objects with light’s momentum.' },
              ],
              explain: r`A transparent bead bends a focused laser beam, and by Newton's third law the beam's change of momentum pushes the bead back towards the focus, where the light is brightest. Biologists use optical tweezers to grab single cells, stretch DNA molecules, and measure the piconewton forces of molecular motors.`,
            },
            {
              type: 'interactive',
              title: 'Size a solar sail',
              body: r`Sunlight near Earth pushes a perfect mirror with about $9.1 \times 10^{-6}$ N per square metre. A 10 kg spacecraft (sail included) needs an acceleration of **1 mm/s²**. Find the side of the square sail.`,
              widget: {
                kind: 'graph', equal: true, xmin: -35, xmax: 35, ymin: -35, ymax: 35, grid: false, axes: false, maxWidth: 320,
                params: { L: { min: 5, max: 60, step: 0.1, value: 15, label: 'sail side', color: 'amber', format: (v) => `${v.toFixed(1)} m` } },
                extra: ({ plot, p, s }) => { const h = p.L / 2; return [s('rect', { x: plot.X(-h), y: plot.Y(h), width: plot.X(h) - plot.X(-h), height: plot.Y(-h) - plot.Y(h), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2 }), s('line', { x1: plot.X(-h), y1: plot.Y(h), x2: plot.X(h), y2: plot.Y(-h), stroke: 'var(--amber)' }), s('line', { x1: plot.X(-h), y1: plot.Y(-h), x2: plot.X(h), y2: plot.Y(h), stroke: 'var(--amber)' }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-ink' }), s('rect', { x: plot.X(-33), y: plot.Y(-31), width: plot.X(-31) - plot.X(-33), height: plot.Y(-33) - plot.Y(-31), class: 'fl-coral' }), s('text', { x: plot.X(-29.5), y: plot.Y(-33), class: 'lbl', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: '2 m person' })]; },
                readout: (p) => { const a = (9.07e-6 * p.L * p.L) / 10; return `area ${(p.L * p.L).toFixed(0)} m² · acceleration **${(a * 1000).toFixed(3)} mm/s²** · after a year: ${((a * 3.156e7) / 1000).toFixed(1)} km/s`; },
                goal: (p) => Math.abs((9.07e-6 * p.L * p.L) / 10 - 1e-3) < 2e-5,
                hint: 'Area = m a / (force per m²) = 10 × 0.001 / 9.1×10⁻⁶ m².',
                solution: { L: 33.2 },
              },
              explain: r`You need about 1,100 m², a square **33 m** on a side, for just 10 kg. The push is tiny, but it never stops: after a year the craft has gained over 30 km/s with no fuel. Japan’s IKAROS (2010) was the first sail to fly between planets.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Sailing on sunlight',
              prompt: r`Japan's IKAROS probe (2010) unfurled a 14 m × 14 m reflective sail. Roughly what force did sunlight give it near Earth's distance from the Sun?`,
              choices: [
                { t: 'About 2 millinewtons: the weight of a fifth of a gram', ok: true },
                { t: 'About 2 newtons', why: r`Force = pressure × area $= 9.1 \times 10^{-6} \times 196 \approx 1.8 \times 10^{-3}$ N. That's a thousand times less than 2 N.` },
                { t: 'Exactly zero: light has no mass', why: 'Light has no mass but does carry momentum, so it can push.' },
              ],
              explain: r`$F = PA \approx 9.1 \times 10^{-6}\ \text{Pa} \times 196\ \text{m}^2 \approx 1.8$ mN. Feeble, but applied continuously for months with no fuel, it measurably changed IKAROS's orbit. It was the first spacecraft to demonstrate solar sailing between planets. Radiation pressure also helps push comet tails away from the Sun.`,
            },
          ],
          recap: [
            r`Light carries momentum: pressure $I/c$ when absorbed, $2I/c$ when reflected.`,
            'Sunlight near Earth pushes a mirror with about 9 µPa.',
            'Solar sails use this tiny but endless push.',
          ],
        },
      ],
    },
    {
      title: 'Sending Signals',
      summary: 'Modulation and steerable beams.',
      lessons: [
        {
          id: 'radio',
          title: 'AM and FM Radio',
          summary: 'Riding a message on a carrier',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Why not send sound directly?',
              prompt: r`Sound waves have frequencies of about 20 Hz to 20 kHz. Why don't radio stations simply broadcast electromagnetic waves at those frequencies?`,
              choices: [
                { t: 'Such low frequencies need gigantic antennas, and every station would clash in the same band', ok: true },
                { t: 'Electromagnetic waves can’t have such low frequencies', why: 'They can, but a 1 kHz wave has a wavelength of 300 km, so antennas would be absurdly large.' },
                { t: 'Low frequencies travel faster than light', why: 'All electromagnetic waves travel at the speed of light.' },
              ],
              explain: r`A 1 kHz electromagnetic wave is 300 km long, and antennas need to be a decent fraction of a wavelength. And if every station used the audio band, they'd all overlap. So each station uses a high-frequency **carrier** wave of its own, and imprints the sound on it: **modulation**.`,
            },
            {
              type: 'interactive',
              title: 'Modulate the carrier',
              body: r`The grey curve is the message (a tone). In **AM** (amplitude modulation) the carrier's strength follows the message; in **FM** (frequency modulation) its frequency does. Try both. Then, in AM mode, set the **modulation depth** as high as possible **without** the envelope folding over (overmodulation).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2, ymin: -2.7, ymax: 2.7, grid: false, height: 260, axes: false,
                params: {
                  mode: { min: 0, max: 1, step: 1, value: 0, label: 'mode', color: 'blue', format: (v) => (v ? 'FM' : 'AM') },
                  m: { min: 0, max: 1.5, step: 0.05, value: 0.5, label: 'modulation depth', color: 'coral', format: (v) => `${Math.round(v * 100)}%` },
                },
                curves: [
                  { f: (t) => 2.2 + 0.35 * Math.sin(2 * Math.PI * t), color: 'muted', width: 2 },
                  { f: (t, p) => (p.mode ? Math.cos(2 * Math.PI * 12 * t + (p.m * 3 / (2 * Math.PI)) * 2 * Math.PI * -Math.cos(2 * Math.PI * t)) : (1 + p.m * Math.sin(2 * Math.PI * t)) * Math.cos(2 * Math.PI * 12 * t)), color: 'violet', width: 1.8, n: 1200 },
                  { f: (t, p) => (p.mode ? NaN : Math.abs(1 + p.m * Math.sin(2 * Math.PI * t))), color: 'coral', dash: true },
                ],
                readout: (p) => (p.mode ? 'FM: the strength stays constant; the waves bunch up and spread out with the message.' : p.m > 1 ? '**Overmodulation**: the envelope folds over and the message is distorted.' : `AM at ${Math.round(p.m * 100)}% depth: the envelope (dashed) traces the message.`),
                goal: (p) => p.mode === 0 && p.m >= 0.9 && p.m <= 1,
                hint: 'Overmodulation starts when 1 + m·sin dips below zero.',
                solution: { mode: 0, m: 1 },
              },
              explain: r`In AM the envelope is $1 + m\sin(\ldots)$; above $m = 100\%$ it would dip below zero and fold over, so a simple receiver tracing the envelope would hear a distorted message. Broadcasters stay just under 100% to be as loud as possible. In FM, the message hides in the **timing** of the waves instead.`,
            },
            {
              type: 'numeric',
              title: 'Tuning in',
              prompt: r`An AM station broadcasts on 909 kHz. What is the wavelength of its carrier, in metres? ($c = 3 \times 10^8$ m/s; nearest metre.)`,
              unit: 'm',
              answer: 3e8 / 909e3,
              tol: 1,
              wrong: [{ v: 3e8 / 909, tol: 10, why: 'Convert kHz to Hz: 909 kHz = 909,000 Hz.' }],
              explain: r`$\lambda = \frac{3 \times 10^8}{9.09 \times 10^5} \approx 330$ m, longer than a football stadium. AM transmitters use tall masts, and medium-wave signals bend around hills and, at night, bounce off the upper atmosphere to travel hundreds of kilometres.`,
            },
            {
              type: 'mcq',
              title: 'Why FM sounds cleaner',
              prompt: 'FM radio is much less affected by crackle from thunderstorms and electrical machinery than AM. Why?',
              choices: [
                { t: 'Noise mostly changes a signal’s strength, and an FM receiver ignores strength: it only reads the frequency', ok: true },
                { t: 'FM transmitters are more powerful', why: 'Power isn’t the reason. Electrical noise adds bursts of amplitude, which FM ignores.' },
                { t: 'FM uses lower frequencies', why: 'FM broadcasting actually uses higher frequencies (around 100 MHz) than AM (around 1 MHz).' },
              ],
              explain: r`Lightning and sparking motors add spikes of amplitude. An AM receiver, which listens to amplitude, hears them as crackle; an FM receiver clips the signal to a constant strength and decodes only the timing, so the spikes vanish. Edwin Armstrong invented wideband FM in the 1930s for exactly this reason.`,
            },
            {
              type: 'numeric',
              title: 'How many stations?',
              prompt: r`AM stations need a slot of about 9 kHz of bandwidth each (for audio up to 4.5 kHz). Roughly how many stations fit in the medium-wave broadcasting band, which is about 1,071 kHz wide?`,
              unit: 'stations',
              answer: 119,
              tol: 1,
              wrong: [{ v: 1071, why: 'That’s the width of the band in kHz. Divide by 9 kHz per station.' }],
              explain: r`$\frac{1071}{9} \approx 119$ slots, one per 9 kHz channel (in Europe the channels sit on 531, 540, 549, … kHz). The narrow slots are why AM sounds muffled: there's only room for audio up to about 4.5 kHz. FM stations get about 200 kHz each, room for hi-fi stereo, which needs the much wider VHF band.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Hearing the bandwidth',
              prompt: r`An AM signal carrying a 3 kHz tone on a 909 kHz carrier contains which frequencies?`,
              choices: [
                { t: '906, 909 and 912 kHz: the carrier plus two sidebands', ok: true },
                { t: 'Only 909 kHz', why: 'Multiplying the carrier by a changing amplitude creates new frequencies on either side.' },
                { t: '909 kHz and 3 kHz', why: 'The 3 kHz tone itself isn’t broadcast; it appears as sidebands 3 kHz either side of the carrier.' },
              ],
              explain: r`Since $\cos A\cos B = \frac12[\cos(A - B) + \cos(A + B)]$, multiplying the carrier by $1 + m\cos(2\pi \cdot 3\text{ kHz} \cdot t)$ creates **sidebands** at $909 \pm 3$ kHz. Audio up to 4.5 kHz spreads the signal over $\pm 4.5$ kHz: that's where the 9 kHz channel width comes from. Fourier analysis tells you exactly how much spectrum any signal needs.`,
            },
          ],
          recap: [
            'Messages ride on a high-frequency carrier: modulation.',
            'AM varies the strength (keep depth ≤ 100%); FM varies the frequency and resists noise.',
            'Modulation creates sidebands, which set how much bandwidth a station needs.',
          ],
        },
        {
          id: 'arrays',
          title: 'Steering Beams',
          summary: 'Phased arrays, radar and 5G',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Two antennas',
              prompt: r`Two antennas half a wavelength apart send out identical waves, in step. In which direction do the waves add up most strongly?`,
              choices: [
                { t: 'Straight ahead, at right angles to the line joining them, where the two paths are equal', ok: true },
                { t: 'Along the line joining them', why: 'Along that line the paths differ by half a wavelength, so the waves cancel.' },
                { t: 'Equally in every direction', why: 'Two sources interfere: some directions add, others cancel.' },
              ],
              explain: r`Straight ahead the waves travel equal distances and arrive in step: constructive interference. Along the line joining the antennas, one wave has half a wavelength further to go and cancels the other. Interference shapes where the energy goes, just like the double-slit experiment.`,
            },
            {
              type: 'explain',
              title: 'Delay to steer',
              body: r`Now give each antenna a slightly **later** start than its neighbour. The waves from the whole row now line up in a tilted direction: the beam swings to the side, with no moving parts.

This is a **phased array**. With $N$ antennas spaced half a wavelength apart, a phase step of $\varphi$ between neighbours steers the beam to the angle $\theta$ where
$$\pi \sin\theta = -\varphi.$$
More antennas make a narrower, more powerful beam.`,
            },
            {
              type: 'interactive',
              title: 'Point the beam',
              body: r`Eight antennas sit in a row along the bottom. The violet shape shows how strongly they transmit in each direction (straight up is $0°$). Adjust the phase step between neighbours to steer the main beam to **30°** to the right.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.15, xmax: 1.15, ymin: -0.15, ymax: 1.15, grid: false, axes: false, maxWidth: 480,
                params: { phi: { min: -180, max: 180, step: 5, value: 0, label: 'phase step', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const pts = [];
                  for (let t = -90; t <= 90; t += 0.5) { const g = arrayGain(t, p.phi), a = (t * Math.PI) / 180; pts.push([g * Math.sin(a), g * Math.cos(a)]); }
                  const els = [0.5, 1].map((rr) => s('path', { d: `M${plot.X(-rr)} ${plot.Y(0)} A${plot.X(rr) - plot.X(0)} ${plot.X(rr) - plot.X(0)} 0 0 1 ${plot.X(rr)} ${plot.Y(0)}`, fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1 }));
                  for (const deg of [-60, -30, 0, 30, 60]) { const a = (deg * Math.PI) / 180; els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(Math.sin(a)), y2: plot.Y(Math.cos(a)), stroke: 'var(--line-2)', 'stroke-width': 1 })); els.push(s('text', { x: plot.X(1.08 * Math.sin(a)), y: plot.Y(1.08 * Math.cos(a)) + 4, class: 'tick', 'text-anchor': 'middle', text: `${deg}°` })); }
                  els.push(s('path', { d: `M${plot.X(0)} ${plot.Y(0)}` + pts.map(([x, y]) => `L${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 2 }));
                  for (let n = 0; n < 8; n++) els.push(s('rect', { x: plot.X(-0.35 + n * 0.1) - 3, y: plot.Y(0) + 2, width: 6, height: 10, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => `Main beam at **${beamDir(p.phi).toFixed(1)}°**`,
                goal: (p) => Math.abs(beamDir(p.phi) - 30) < 2,
                hint: r`You need $\pi \sin 30° = -\varphi$, with $\varphi$ in radians.`,
                solution: { phi: -90 },
              },
              explain: r`$\sin 30° = \frac12$, so $\varphi = -\frac{\pi}{2} = -90°$: each antenna lags its neighbour by a quarter cycle. Electronics can change the phases in microseconds, so a phased array can sweep its beam across the sky thousands of times a second.`,
            },
            {
              type: 'numeric',
              title: 'How narrow?',
              body: r`The width of a phased array's beam is roughly $\frac{\lambda}{L}$ radians, where $L$ is the length of the array.`,
              prompt: r`A 5G base station transmits at 28 GHz (wavelength about 1.07 cm) from an array 16 cm long. Roughly how wide is its beam, in degrees? (Nearest degree.)`,
              unit: '°',
              answer: (1.07 / 16) * (180 / Math.PI),
              tol: 0.6,
              wrong: [{ v: 1.07 / 16, tol: 0.01, why: 'That’s in radians. Multiply by 180/π.' }],
              explain: r`$\frac{1.07}{16} \approx 0.067$ rad $\approx 4°$: a narrow pencil beam that the base station aims at each phone in turn. High-frequency 5G signals are easily blocked by walls and even hands, so precise, steerable beams help make up for it.`,
            },
            {
              type: 'mcq',
              title: 'Radar without dishes',
              prompt: r`Many modern warships and air-traffic radars have flat panels instead of spinning dishes. What advantage do phased arrays give them?`,
              choices: [
                { t: 'The beam jumps between targets in microseconds, tracking many objects at once with no moving parts', ok: true },
                { t: 'Flat panels make radar invisible', why: 'They still transmit powerful signals. The advantage is electronic agility.' },
                { t: 'They use much lower frequencies', why: 'The frequencies are similar. The beam is just steered electronically.' },
              ],
              explain: r`A spinning dish looks at each direction once per turn. A phased array can point anywhere instantly, revisit fast-moving targets more often, and even form several beams at once. The same technology is in satellite internet terminals, which track satellites racing across the sky without moving.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Grating lobes',
              prompt: r`What goes wrong if the antennas in a phased array are spaced a whole wavelength apart, instead of half a wavelength?`,
              choices: [
                { t: 'Extra full-strength beams (grating lobes) appear in other directions, wasting power and causing confusion', ok: true },
                { t: 'The beam becomes wider', why: 'A longer array actually makes the main beam narrower, but it also creates extra strong beams.' },
                { t: 'Nothing changes', why: 'With wide spacing, waves also add up in step in other directions, making extra beams.' },
              ],
              explain: r`With a spacing of one wavelength, there are directions where neighbouring paths differ by exactly one whole wavelength, so all the waves add in step there too: extra beams as strong as the main one. Half-wavelength spacing (or less) guarantees a single main beam. It's the same mathematics as the bright orders of a diffraction grating, and a cousin of aliasing in sampling.`,
            },
          ],
          recap: [
            'Antennas in a row interfere: their waves add up in some directions and cancel in others.',
            r`A phase step $\varphi$ between neighbours steers the beam to $\pi\sin\theta = -\varphi$ (half-wave spacing).`,
            'Phased arrays power modern radar, 5G and satellite internet; wide spacing makes grating lobes.',
          ],
        },
      ],
    },
  ],
};
