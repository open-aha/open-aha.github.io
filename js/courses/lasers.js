import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

// spot width (mm) after distance L (m) for a beam starting D mm wide: start width plus diffraction spread
const spot = (D, L = 100, lam = 650e-9) => D + ((lam * L) / (D / 1000)) * 1000;
// mode-locked laser: intensity of N equal modes in phase, normalised to the peak
const modeLock = (t, N) => { const x = Math.PI * t; const sn = Math.sin(x); return Math.abs(sn) < 1e-9 ? 1 : (Math.sin(N * x) / (N * sn)) ** 2; };

// a toy laser: 36 atoms in a tube (0 < y < 1) between a full mirror (x = 0) and a 10% output mirror (x = 10). Photons move 0.25 per tick
// in their own direction and are lost if they leave the tube sideways. Passing an excited atom, a photon makes a copy of itself with
// chance 0.3; passing a ground atom, it's absorbed with chance 0.25. The pump re-excites ground atoms (chance 0.05 per tick), and
// excited atoms occasionally emit on their own (0.005 per tick), in a random direction.
let LASER_RUN = null;
const laserRun = () => {
  if (LASER_RUN) return LASER_RUN;
  let seed = 17;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const atoms = Array.from({ length: 36 }, (_, i) => ({ x: 0.3 + (9.4 * (i + rnd())) / 36, y: 0.15 + 0.7 * rnd(), up: rnd() < 0.5 }));
  let ph = [];
  const frames = [];
  let out = [];
  for (let f = 0; f < 700; f++) {
    for (const a of atoms) {
      if (!a.up && rnd() < 0.05) a.up = true;
      else if (a.up && rnd() < 0.005 && ph.length < 160) { const th = 2 * Math.PI * rnd(); a.up = false; ph.push({ x: a.x, y: a.y, d: Math.cos(th), e: Math.sin(th) }); }
    }
    const next = [];
    for (const q of ph) {
      const x0 = q.x;
      q.x += 0.25 * q.d; q.y += 0.25 * q.e;
      if (q.y < 0 || q.y > 1) continue; // escaped through the side of the tube
      // the mirrors are slightly curved, so a reflection steers a photon back towards the tube's axis
      if (q.x < 0) { q.x = -q.x; q.d = -q.d; q.e *= 0.3; }
      if (q.x > 10) { if (rnd() < 0.1) { out.push({ x: 10, y: q.y, d: q.d, e: q.e }); continue; } q.x = 20 - q.x; q.d = -q.d; q.e *= 0.3; }
      let alive = true;
      for (const a of atoms) {
        if (Math.min(x0, q.x) <= a.x && a.x < Math.max(x0, q.x) && Math.abs(a.y - q.y) < 0.5) {
          if (a.up && rnd() < 0.3 && ph.length + next.length < 160) { a.up = false; next.push({ x: Math.min(9.95, Math.max(0.05, q.x + 0.6 * (rnd() - 0.5))), y: Math.min(0.95, Math.max(0.05, q.y + 0.16 * (rnd() - 0.5))), d: q.d, e: q.e }); } // the copy appears beside its parent (spread out here so it can be seen)
          else if (!a.up && rnd() < 0.25) { a.up = true; alive = false; break; }
        }
      }
      if (alive) next.push(q);
    }
    ph = next;
    out = out.map((o) => ({ ...o, x: o.x + 0.25 * o.d, y: o.y + 0.25 * o.e })).filter((o) => o.x < 12.5);
    frames.push({ atoms: atoms.map((a) => a.up), ph: ph.map((q) => [q.x, q.y, q.d, q.e]), out: out.map((o) => [o.x, o.y, o.d, o.e]) });
  }
  return (LASER_RUN = { atoms, frames });
};
const laserFrame = (t) => Math.min(699, Math.floor(t * 22));

export default {
  id: 'lasers',
  subject: 'physics',
  title: 'Lasers',
  level: 'Advanced',
  cover: 'lasers',
  tagline: 'Stimulated emission, coherent light, femtosecond pulses and measuring the Moon.',
  description: r`A laser makes light unlike any other source: a single pure colour, all its waves in step, travelling in a tight beam. Learn how atoms emit light, how Einstein's "stimulated emission" lets light clone itself, why laser beams stay narrow, how lasers measure the distance to the Moon to a few millimetres, how locked modes make femtosecond pulses, and how interferometers sense movements far smaller than an atom.`,
  prereq: 'Quantum Physics',
  chapters: [
    {
      title: 'How Lasers Work',
      summary: 'Atoms, photons and amplification.',
      lessons: [
        {
          id: 'levels',
          title: 'Atoms and Light',
          summary: 'Absorption and emission',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Energy levels',
              body: r`Electrons in an atom can only have certain energies: **energy levels**. An atom can jump between levels by absorbing or emitting a photon whose energy exactly matches the gap:
$$E_{\text{photon}} = E_{\text{upper}} - E_{\text{lower}} = hf$$
- **Absorption**: a photon with the right energy lifts the atom to a higher level.
- **Spontaneous emission**: an excited atom drops back down on its own, at a random moment, sending a photon off in a random direction.

Ordinary light sources, like bulbs and the Sun, rely on spontaneous emission: a jumble of random photons.`,
            },
            {
              type: 'numeric',
              title: 'A red laser',
              prompt: r`The classic helium–neon laser emits red light at 633 nm. What energy gap does that correspond to, in electronvolts? (Use $E \approx 1240 / \lambda$, with $\lambda$ in nm.)`,
              unit: 'eV',
              answer: 1240 / 633,
              tol: 0.01,
              wrong: [{ v: 0.51, tol: 0.01, why: r`Divide 1240 by 633, rather than the other way round.` }, { v: 784920, why: 'Divide, don’t multiply.' }],
              explain: r`$E \approx 1240 / 633 \approx 1.96$ eV. In the helium–neon laser, neon atoms drop between two specific levels separated by exactly this energy.`,
            },
            {
              type: 'numeric',
              title: 'Photons per second',
              prompt: r`A 1 mW helium–neon laser emits $10^{-3}$ joules per second, in photons of 1.96 eV ($1\ \text{eV} = 1.6 \times 10^{-19}$ J). How many photons per second is that? (In units of $10^{15}$.)`,
              unit: r`$\times 10^{15}$ /s`,
              answer: 1e-3 / (1.96 * 1.602e-19) / 1e15,
              relTol: 0.03,
              wrong: [{ v: 1.96 * 1.602e-19 / 1e-3 / 1e15, relTol: 0.1, why: 'Divide the power by the energy of one photon, not the other way round.' }],
              explain: r`$\frac{10^{-3}}{1.96 \times 1.6 \times 10^{-19}} \approx 3.2 \times 10^{15}$ photons every second, from a pocket-sized laser. Individual photons only matter in very dim light.`,
            },
            {
              type: 'numeric',
              title: 'A green photon',
              prompt: r`A green laser pointer emits at 532 nm. What is the energy of each photon? ($E = 1240/\lambda$ eV with $\lambda$ in nm; 2 decimal places.)`,
              unit: 'eV',
              answer: 1240 / 532,
              tol: 0.01,
              explain: r`$\frac{1240}{532} \approx 2.33$ eV. Green pointers actually make this light by doubling the frequency of an infrared 1064 nm laser in a special crystal: two infrared photons combine into one green one.`,
            },
            {
              type: 'interactive',
              title: 'Can heat do it?',
              body: r`In thermal equilibrium the ratio of atoms in an upper level to a lower one is $e^{-\Delta E / kT}$. For a red laser transition, $\Delta E = 1.96$ eV. Find the temperature at which just **1%** as many atoms sit in the upper level as in the lower.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, maxWidth: 440, height: 240,
                params: { T: { min: 300, max: 20000, step: 10, value: 3000, label: 'temperature', color: 'coral', format: (v) => `${v.toLocaleString('en-US')} K` } },
                extra: ({ plot, p, s }) => { const r = Math.exp(-1.96 / (8.617e-5 * p.T)), up = Math.round(100 * r), out = [s('line', { x1: plot.X(0.5), x2: plot.X(9.5), y1: plot.Y(1), y2: plot.Y(1), stroke: 'var(--ink-2)', 'stroke-width': 3 }), s('line', { x1: plot.X(0.5), x2: plot.X(9.5), y1: plot.Y(4.2), y2: plot.Y(4.2), stroke: 'var(--ink-2)', 'stroke-width': 3 })]; for (let i = 0; i < 100; i++) out.push(s('circle', { cx: plot.X(0.8 + (i % 50) * 0.17), cy: plot.Y(1.3 + Math.floor(i / 50) * 0.35), r: 3.5, class: 'fl-blue' })); for (let i = 0; i < Math.min(up, 100); i++) out.push(s('circle', { cx: plot.X(0.8 + (i % 50) * 0.17), cy: plot.Y(4.5 + Math.floor(i / 50) * 0.35), r: 3.5, class: 'fl-coral' })); return out; },
                readout: (p) => { const r = Math.exp(-1.96 / (8.617e-5 * p.T)); return `upper : lower = **${r < 1e-4 ? r.toExponential(1) : (100 * r).toFixed(2) + '%'}** (dots per 100 in the lower level)`; },
                goal: (p) => Math.abs(Math.exp(-1.96 / (8.617e-5 * p.T)) / 0.01 - 1) < 0.05,
                hint: 'Solve ΔE / kT = ln 100 ≈ 4.6, with k = 8.6 × 10⁻⁵ eV/K.',
                solution: { T: 4940 },
              },
              explain: r`About **4,900 K**, hotter than most furnaces, for just 1%. And however hot you go, the ratio approaches 1 but never passes it: heating can never put **more** atoms in the upper level. A laser needs that population inversion, so it must be pumped by other means, such as electrical discharges or other light.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Why X-ray lasers are hard',
              prompt: r`Einstein showed that, compared with stimulated emission, **spontaneous** emission grows like the frequency cubed, $f^3$. An excited level that emits at 4 times the frequency of a red laser line (in the ultraviolet) leaks away by spontaneous emission how many times faster, relative to stimulated emission?`,
              answer: 64,
              wrong: [{ v: 4, why: r`The ratio grows like $f^3$, not $f$: $4^3$.` }, { v: 16, why: r`It's $f^3$, not $f^2$: $4^3 = 64$.` }],
              explain: r`$4^3 = 64$. At high frequencies excited atoms drop back by themselves almost at once, so keeping a population inversion takes enormous pumping power. That's why the first X-ray lasers (1980s) were pumped by nuclear explosions or giant laser pulses, and why today's X-ray lasers use a different trick altogether: free-electron lasers, which make light from electron beams wiggling through magnets.`,
            },
          ],
          recap: [
            'Atoms have discrete energy levels.',
            'Photons are absorbed or emitted when atoms jump between levels.',
            'Ordinary light comes from random spontaneous emission.',
          ],
        },
        {
          id: 'stimulated',
          title: 'Stimulated Emission',
          summary: 'Light that clones itself',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Einstein’s third process',
              body: r`In 1917, Einstein realised there must be a third process. If a photon with exactly the right energy passes an atom that is **already excited**, it can trigger the atom to drop down and emit a second photon that is an exact **copy**: the same energy, direction and phase.

This **stimulated emission** is the "SE" in LASER: **L**ight **A**mplification by **S**timulated **E**mission of **R**adiation. One photon becomes two, two become four, and so on: amplification.`,
            },
            {
              type: 'mcq',
              title: 'The catch',
              prompt: r`Normally, most atoms sit in the **lower** level. Why does that stop light from being amplified?`,
              choices: [
                { t: 'Photons are more likely to be absorbed by ground-state atoms than to stimulate emission from excited ones', ok: true },
                { t: 'Lower-level atoms emit photons in the wrong direction', why: 'Atoms in the lower level can’t emit at all. They absorb.' },
                { t: 'Stimulated emission only works in a vacuum', why: 'It works in gases, crystals, liquids and semiconductors.' },
              ],
              explain: r`Each photon is equally likely to cause absorption (from a lower-level atom) or stimulated emission (from an upper-level atom). With more atoms below, absorption wins and the light is weakened. A laser needs a **population inversion**: more atoms in the upper level than the lower one, achieved by "pumping" energy in with a flash lamp, an electric current or another laser.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Gain or loss?',
              body: r`A pulse of light makes repeated passes through the medium. Change the fraction of atoms in the **upper** level and watch what happens to the number of photons.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 100, grid: 2, gridY: 20, height: 300, axes: { xlabel: 'passes', ylabel: 'photons' },
                params: { u: { min: 0, max: 1, step: 0.05, value: 0.3, label: 'upper-level fraction', color: 'coral', format: (v) => `${Math.round(v * 100)}%` } },
                curves: [{ f: (n, p) => 10 * (1 + 0.5 * (2 * p.u - 1)) ** n, color: 'coral', width: 3 }],
                readout: (p) => (p.u > 0.5 ? r`**Population inversion**: each pass multiplies the light by $${f2(1 + 0.5 * (2 * p.u - 1))}$, so it grows exponentially.` : p.u === 0.5 ? 'Exactly balanced: absorption and stimulated emission cancel out.' : r`More atoms below than above: each pass multiplies the light by $${f2(1 + 0.5 * (2 * p.u - 1))}$, so it's absorbed.`),
              },
              after: r`Below 50%, absorption wins and the light fades. Above 50%, stimulated emission wins and the light grows exponentially: a **population inversion** is the key to every laser.`,
            },
            {
              type: 'mcq',
              title: 'Three levels or four?',
              prompt: r`In a ruby laser the lasing transition ends on the **ground** state. In a neodymium laser it ends on a level just **above** the ground state, which empties quickly. Why is the neodymium design much easier to run?`,
              choices: [
                { t: 'The lower laser level is almost empty, so even a few excited atoms make a population inversion', ok: true },
                { t: 'Neodymium atoms are bigger', why: 'Size isn’t the point. What matters is how full the lower laser level is.' },
                { t: 'It needs no pumping', why: 'Every laser needs pumping. The four-level scheme just needs much less.' },
              ],
              explain: r`In a three-level laser like ruby, more than **half** of all the atoms must be pumped out of the ground state before there's any gain. In a four-level laser, the lower level drains almost instantly, so inversion begins with the first few excited atoms. Most lasers today, including the neodymium lasers in green pointers, use four-level schemes.`,
            },
            {
              type: 'mcq',
              title: 'A perfect copy',
              prompt: r`How does a photon produced by **stimulated** emission compare with the photon that triggered it?`,
              choices: [
                { t: r`It is identical: same frequency, direction, phase and polarisation`, ok: true },
                { t: r`It has twice the energy`, why: r`Each photon carries the energy of the atomic transition; the new one matches the old one.` },
                { t: r`It goes in a random direction`, why: r`That’s spontaneous emission. Stimulated emission copies the incoming photon exactly.` },
              ],
              explain: r`Because each new photon is a clone, the light builds up into a single coherent wave: the "amplification" in Light Amplification by Stimulated Emission of Radiation.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why the mirrors?',
              prompt: r`A laser's gain medium sits between two mirrors, one of which lets a little light through. What do the mirrors do?`,
              choices: [
                { t: 'They bounce light back and forth through the medium many times, amplifying it on every pass; the partial mirror lets out the beam', ok: true },
                { t: 'They focus the light into a point', why: 'Their main job is feedback: sending light back through the gain medium again and again.' },
                { t: 'They filter out the wrong colours', why: 'The colour is mainly set by the energy levels. The mirrors provide repeated amplification.' },
              ],
              explain: r`Light travelling along the axis passes through the inverted medium again and again, triggering more and more stimulated emission. Only light aligned with the mirrors keeps being amplified, which is why the output beam is so straight. Theodore Maiman built the first working laser, using a ruby crystal, in 1960.`,
            },
            { /*anim:lasers*/
              type: 'explain',
              kicker: 'Explore',
              title: 'An avalanche between mirrors',
              body: r`A toy laser. {coral:Excited atoms} are kept topped up by a pump. Now and then one emits a photon on its own, in a random direction. A photon passing an excited atom can trigger a perfect copy of itself; passing an unexcited atom, it can be absorbed. The left mirror reflects everything; the right one lets 10% through. Both are slightly curved, steering reflected light back along the tube.`,
              widget: {
                kind: 'graph', xmin: -0.4, xmax: 12.6, ymin: -0.25, ymax: 1.25, grid: false, axes: false, height: 230, maxWidth: 680, clipExtra: true,
                animate: { param: 't', speed: 1, max: 32, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { atoms, frames } = laserRun(), f = frames[laserFrame(p.t)], els = [];
                  els.push(s('rect', { x: plot.X(-0.3), y: plot.Y(1.1), width: plot.X(0.3) - plot.X(0), height: plot.Y(-0.1) - plot.Y(1.1), class: 'fl-ink' }));
                  els.push(s('rect', { x: plot.X(10), y: plot.Y(1.1), width: plot.X(0.25) - plot.X(0), height: plot.Y(-0.1) - plot.Y(1.1), class: 'fl-ink', opacity: 0.45 }));
                  atoms.forEach((a, i) => els.push(s('circle', { cx: plot.X(a.x), cy: plot.Y(a.y), r: 6, class: f.atoms[i] ? 'fl-coral' : 'fl-muted', opacity: f.atoms[i] ? 0.85 : 0.5 })));
                  const seg = ([x, y, d, e]) => `M${plot.X(x - 0.12 * d).toFixed(1)} ${plot.Y(y - 0.12 * e).toFixed(1)}L${plot.X(x + 0.12 * d).toFixed(1)} ${plot.Y(y + 0.12 * e).toFixed(1)}`;
                  els.push(s('path', { d: f.ph.map(seg).join('') + f.out.map(seg).join(''), stroke: 'var(--amber)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
                  return els;
                },
                readout: (p) => { const f = laserRun().frames[laserFrame(p.t)]; return `${f.ph.length} photons between the mirrors · ${f.atoms.filter(Boolean).length} of 36 atoms excited · ${f.out.length} on their way out`; },
              },
              after: r`At first there are only a few stray photons, flying every which way. But the ones travelling along the tube keep passing excited atoms and get copied, while the others soon leave the picture, so a single direction wins: an avalanche of identical photons bouncing back and forth. The photon count grows until copying just balances the losses, and a steady beam leaks out through the right-hand mirror, with the pump replacing the energy it carries away.`,
            },
          ],
          recap: [
            'Stimulated emission produces an identical copy of a photon.',
            'Amplification needs a population inversion, created by pumping.',
            'Mirrors provide feedback, building up a strong, straight beam.',
          ],
        },
      ],
    },
    {
      title: 'Using Lasers',
      summary: 'Beams and applications.',
      lessons: [
        {
          id: 'beams',
          title: 'Special Light',
          summary: 'Pure, coherent and narrow',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Three properties',
              body: r`Laser light is:
- **Monochromatic**: almost a single wavelength, because all the photons come from the same energy gap.
- **Coherent**: the waves are in step, because stimulated photons copy each other's phase.
- **Collimated**: the beam stays narrow, spreading only by diffraction, at an angle of roughly
$$\theta \approx \frac{\lambda}{D}$$
where $D$ is the beam's width at the start.`,
            },
            {
              type: 'numeric',
              title: 'A laser pointer',
              prompt: r`A red laser pointer ($\lambda = 650$ nm) has a 1 mm wide beam. Using $\theta \approx \lambda / D$, roughly how wide is the spot (in cm) after 100 m, ignoring the starting width?`,
              unit: 'cm',
              answer: (650e-9 / 1e-3) * 100 * 100,
              tol: 0.5,
              wrong: [{ v: 0.065, tol: 0.005, why: r`$\theta = 6.5 \times 10^{-4}$ rad. Multiply by 100 m to get 0.065 m, then convert to cm.` }, { v: 650, why: 'Check the units: 650 nm = 6.5 × 10⁻⁷ m and 1 mm = 10⁻³ m.' }],
              explain: r`$\theta \approx \dfrac{6.5 \times 10^{-7}}{10^{-3}} = 6.5 \times 10^{-4}$ rad. Over 100 m, the spot grows to about $0.065$ m $= 6.5$ cm. A flashlight beam would be many metres wide by then. (Never point lasers at eyes or aircraft: even a weak beam is concentrated enough to damage the retina.)`,
            },
            {
              type: 'interactive',
              title: 'The best starting width',
              body: r`A narrower beam starts smaller but spreads faster (diffraction angle $\lambda/D$); a wider beam spreads slowly but starts big. The curve shows the spot width after 100 m for each starting width (650 nm light). Find the starting width that gives the **smallest** spot.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 40, ymin: 0, ymax: 45, grid: false, height: 280, axes: { xlabel: 'starting width (mm)', ylabel: 'width after 100 m (mm)', xticks: 5, yticks: 10, xAt: 1 },
                params: { D: { min: 1, max: 40, step: 0.1, value: 4, label: 'starting width', color: 'coral', format: (v) => `${v.toFixed(1)} mm` } },
                curves: [{ f: (x) => spot(x), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.D, y: (p) => Math.min(45, spot(p.D)), color: 'coral' }],
                readout: (p) => `start ${p.D.toFixed(1)} mm → spot **${spot(p.D).toFixed(1)} mm** after 100 m`,
                goal: (p) => Math.abs(p.D - Math.sqrt(650e-9 * 100) * 1000) < 0.4,
                hint: 'Find the bottom of the curve.',
                solution: { D: 8.1 },
              },
              explain: r`The best starting width is about **8 mm**, giving a spot of about 16 mm. At the optimum the two effects are equal: $D = \frac{\lambda L}{D}$, so $D = \sqrt{\lambda L}$. For longer distances you need wider beams, which is why laser ranging fires through a telescope.`,
            },
            {
              type: 'numeric',
              title: 'A beam to the Moon',
              prompt: r`An observatory sends green laser light (532 nm) to the Moon through a 1 m telescope. Using $\theta \approx \lambda/D$, how wide would the beam be at the Moon (384,000 km away) if only diffraction mattered? (Nearest 10 m.)`,
              unit: 'm',
              answer: 532e-9 / 1 * 3.84e8,
              tol: 6,
              wrong: [{ v: 532e-9 / 1 * 3.84e5, tol: 0.5, why: 'Convert 384,000 km to metres: 3.84 × 10⁸ m.' }],
              explain: r`$\frac{5.32 \times 10^{-7}}{1} \times 3.84 \times 10^8 \approx 200$ m. In reality turbulence in Earth's atmosphere spreads it to a few kilometres, so only about one photon in $10^{17}$ makes it back to the telescope. Careful timing still finds them.`,
            },
            {
              type: 'numeric',
              title: 'A laser link to orbit',
              prompt: r`A ground station sends 1550 nm laser light to a satellite 1,000 km overhead through a 10 cm telescope. Using $\theta \approx \lambda / D$, roughly how wide is the beam at the satellite, in metres? (1 decimal place.)`,
              unit: 'm',
              answer: 1550e-9 / 0.1 * 1e6,
              tol: 0.2,
              wrong: [{ v: 1.55, tol: 0.02, why: 'Check the telescope size: 10 cm is 0.1 m.' }],
              explain: r`$\theta \approx \frac{1.55 \times 10^{-6}}{0.1} = 1.55 \times 10^{-5}$ rad, and over $10^6$ m the beam spreads to about **15.5 m**. A radio dish of the same size would spread its beam over hundreds of kilometres. Such tight beams let laser links carry far more data with far less power, and make them very hard to eavesdrop on.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Seeing laser speckle',
              prompt: r`Shine a laser on a wall and the spot looks grainy, with sparkling dots that shift when you move your head. What causes this **speckle**?`,
              choices: [
                { t: 'Coherent light scattered from the rough wall interferes, making a random pattern of bright and dark spots', ok: true },
                { t: 'Dust in the air', why: 'Speckle appears on any rough surface, even in clean air.' },
                { t: 'The laser flickering', why: 'The pattern is stable in time; it changes when your viewpoint changes, because it’s an interference pattern.' },
              ],
              explain: r`Every bump on the wall scatters light with a slightly different path length. Because laser light is **coherent**, these waves interfere, giving a random grainy pattern. Ordinary light, a jumble of incoherent waves, averages it away. Speckle is a vivid, everyday demonstration of coherence.`,
            },
          ],
          recap: [
            'Laser light is monochromatic, coherent and collimated.',
            r`Beam spread $\theta \approx \lambda / D$: wider beams spread less.`,
            'Concentrated beams can damage eyes, so handle lasers safely.',
          ],
        },
        {
          id: 'applications',
          title: 'Lasers at Work',
          summary: 'From the Moon to absolute zero',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Measuring the Moon',
              body: r`Apollo astronauts left **retroreflectors** on the Moon, panels of corner-cube mirrors that send light straight back where it came from. Observatories fire powerful laser pulses at them and time the faint echoes. Even with a telescope launching the beam, it's several kilometres wide by the time it reaches the Moon, and only a handful of photons come back from each pulse. Yet timing them gives the Earth–Moon distance to within a few **millimetres**.`,
            },
            {
              type: 'numeric',
              title: 'Echo from the Moon',
              prompt: r`A laser pulse returns from the Moon 2.56 s after it was sent. What's the distance to the Moon, in km? (Use $c = 3.00 \times 10^5$ km/s.)`,
              unit: 'km',
              answer: 384000,
              tol: 1000,
              wrong: [{ v: 768000, tol: 1000, why: 'The pulse travels there **and back**: halve the total distance.' }, { v: 384000000, tol: 1000000, why: 'That’s in metres. Give the answer in kilometres.' }],
              explain: r`Round trip: $2.56 \times 3.00 \times 10^5 = 768{,}000$ km, so the Moon is about **384,000 km** away. Decades of measurements show the Moon is drifting away from Earth by about **3.8 cm per year**, as tides transfer Earth's spin to the Moon's orbit.`,
            },
            {
              type: 'numeric',
              title: 'Blu-ray',
              prompt: r`A CD player reads its disc with a 780 nm laser; a Blu-ray player uses 405 nm. The smallest spot a lens can make has a width proportional to the wavelength, so its **area** goes like $\lambda^2$. About how many times more data can fit in the same area? (1 decimal place.)`,
              unit: '×',
              answer: (780 / 405) ** 2,
              tol: 0.06,
              wrong: [{ v: 780 / 405, tol: 0.03, why: 'Area goes like the square of the width.' }],
              explain: r`$\left(\frac{780}{405}\right)^2 \approx 3.7$. Blu-ray also uses a lens with a wider angle and a thinner protective layer, which together pack about 35 times as much data as a CD (25 GB versus 0.7 GB).`,
            },
            {
              type: 'numeric',
              title: 'Laser radar',
              prompt: r`A self-driving car’s lidar sends a laser pulse that returns 200 ns ($2 \times 10^{-7}$ s) later. How far away is the object, in metres? ($c = 3 \times 10^8$ m/s.)`,
              unit: 'm',
              answer: 3e8 * 200e-9 / 2,
              tol: 0.1,
              wrong: [{ v: 60, why: r`The light goes there **and back**. Halve it.` }],
              explain: r`Round trip: $3 \times 10^8 \times 2 \times 10^{-7} = 60$ m, so the object is **30 m** away. Lidar fires up to millions of pulses a second to build a 3D map of the surroundings, timing each to under a nanosecond.`,
            },
            {
              type: 'interactive',
              title: 'A spot on the Moon',
              body: r`Even a perfect beam spreads by diffraction, to a spot of diameter about $2.44\,\lambda L / D$ at distance $L$, where $D$ is the width of the telescope sending it. For green light (532 nm) to the Moon (384,400 km), find the smallest telescope that keeps the spot within **2 km**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 150, ymin: 0, ymax: 20, grid: false, height: 260, axes: { xlabel: 'telescope aperture D (cm)', ylabel: 'spot on the Moon (km)', xticks: 25, yticks: 4 },
                params: { D: { min: 2, max: 150, step: 1, value: 10, label: 'aperture', color: 'teal', format: (v) => `${v} cm` } },
                curves: [{ f: (x) => (2.44 * 532e-9 * 3.844e8) / (x / 100) / 1000, color: 'violet', width: 3, from: 2 }, { f: () => 2, color: 'teal', dash: true }],
                points: [{ x: (p) => p.D, y: (p) => (2.44 * 532e-9 * 3.844e8) / (p.D / 100) / 1000, color: 'coral' }],
                readout: (p) => `spot diameter **${((2.44 * 532e-9 * 3.844e8) / (p.D / 100) / 1000).toFixed(2)} km** · beam spreads by ${((2.44 * 532e-9) / (p.D / 100) * 206265).toFixed(2)} arcseconds`,
                goal: (p) => p.D === 25,
                hint: 'D = 2.44 λ L / (2,000 m).',
                solution: { D: 25 },
              },
              explain: r`A **25 cm** telescope gives a 2 km spot. In practice the atmosphere blurs the beam much more, so even 1.5 m telescopes send a spot several kilometres wide, and only about one photon in $10^{17}$ makes it back to the detector. Yet timing those few photons measures the Moon’s distance to millimetres.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Cooling with light',
              prompt: r`Lasers can cool atoms to within millionths of a degree of absolute zero. How can light **cool** anything?`,
              choices: [
                { t: 'Lasers tuned slightly below an atomic transition push hardest on atoms moving toward them, slowing them down', ok: true },
                { t: 'The lasers are very cold', why: 'Light doesn’t have a temperature in that sense. The trick uses momentum kicks from photons.' },
                { t: 'Lasers remove electrons from the atoms', why: 'The atoms stay intact. They’re slowed by absorbing photons that oppose their motion.' },
              ],
              explain: r`Each absorbed photon gives a tiny momentum kick. Tuned just below resonance, the laser is Doppler-shifted **into** resonance only for atoms moving toward it, so it preferentially kicks against their motion. With beams from all directions, atoms slow to a crawl: temperature is just random motion, so this is cooling. Laser cooling won the 1997 Nobel Prize in Physics and makes today's most precise atomic clocks possible.`,
            },
          ],
          recap: [
            'Laser ranging measures the Earth–Moon distance to millimetres.',
            'The Moon recedes about 3.8 cm per year.',
            'Laser cooling slows atoms with photon kicks, reaching microkelvin temperatures.',
          ],
        },
      ],
    },
    {
      title: 'Inside the Cavity',
      summary: 'Modes, pulses and measuring with light.',
      lessons: [
        {
          id: 'modes',
          title: 'Modes and Pulses',
          summary: 'Standing waves and mode-locking',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Waves between mirrors',
              body: r`Between two mirrors a distance $L$ apart, light can only build up as a **standing wave** with a whole number of half-wavelengths across the cavity, just like a guitar string. The allowed frequencies, called **longitudinal modes**, are evenly spaced:
$$\Delta f = \frac{c}{2L}$$
A laser emits only those modes that fall within its gain medium's range of colours.`,
            },
            {
              type: 'numeric',
              title: 'Mode spacing',
              prompt: r`A helium–neon laser has mirrors 30 cm apart. What is the spacing between its modes, in MHz? ($c = 3 \times 10^8$ m/s.)`,
              unit: 'MHz',
              answer: 500,
              tol: 1,
              wrong: [{ v: 1000, why: r`The round trip is $2L$: $\Delta f = \frac{c}{2L}$.` }],
              explain: r`$\frac{3 \times 10^8}{2 \times 0.3} = 5 \times 10^8$ Hz $= 500$ MHz. Neon's gain spans about 1.5 GHz, so roughly three modes fit: the laser emits three extremely close colours at once, unless the cavity is designed to select just one.`,
            },
            {
              type: 'interactive',
              title: 'Locking the modes',
              body: r`If many modes oscillate with their phases **locked** together, their waves add up into short, intense pulses: a **mode-locked** laser. The graph shows the output power over two round trips for $N$ locked modes. How many modes are needed to make pulses shorter than a tenth of the gap between them?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2, ymin: 0, ymax: 1.05, grid: false, height: 260, axes: { xlabel: 'time (round trips)', ylabel: 'power (relative to peak)', xticks: 0.5, yticks: 0.5 },
                params: { N: { min: 1, max: 30, step: 1, value: 3, label: 'locked modes', color: 'violet' } },
                curves: [{ f: (t, p) => modeLock(t, p.N), color: 'violet', width: 2.5, n: 1200 }],
                readout: (p) => `${p.N} mode${p.N === 1 ? '' : 's'}: pulse width ≈ **${(1 / p.N).toFixed(3)}** of a round trip · peak power ${p.N}× the average`,
                goal: (p) => 1 / p.N < 0.1,
                hint: 'The pulse width is about 1/N of the round-trip time.',
                solution: { N: 11 },
              },
              explain: r`The pulse width is about $\frac1N$ of the round-trip time, so 11 or more modes give pulses under a tenth. Real titanium-sapphire lasers lock about a **million** modes, making pulses only a few femtoseconds ($10^{-15}$ s) long, short enough to film chemical reactions as they happen. It's Fourier analysis in action: many evenly spaced frequencies add up to sharp pulses.`,
            },
            {
              type: 'numeric',
              title: 'Light in a femtosecond',
              prompt: r`How far does light travel in 5 femtoseconds ($5 \times 10^{-15}$ s)? (In micrometres.)`,
              unit: 'µm',
              answer: 3e8 * 5e-15 * 1e6,
              tol: 0.01,
              wrong: [{ v: 3e8 * 5e-15, tol: 1e-7, why: 'That’s in metres. Convert to micrometres (× 10⁶).' }],
              explain: r`$3 \times 10^8 \times 5 \times 10^{-15} = 1.5 \times 10^{-6}$ m $= 1.5$ µm: the pulse is a flake of light thinner than a hair is wide, only a couple of wavelengths long. The 2023 Nobel Prize in Physics went to attosecond pulses, a thousand times shorter still.`,
            },
            {
              type: 'numeric',
              title: 'Shortest pulses',
              prompt: r`A pulse can be no shorter than about one over its spread of frequencies. A laser with a 10 THz bandwidth ($10^{13}$ Hz) can make pulses roughly how short, in femtoseconds?`,
              unit: 'fs',
              answer: 100,
              explain: r`$\frac{1}{10^{13}}$ s $= 100$ fs. Titanium-sapphire lasers have bandwidths of about 100 THz, allowing pulses of just a few femtoseconds, fast enough to film chemical reactions.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A ruler made of colours',
              prompt: r`A mode-locked laser's spectrum is a "comb" of perfectly evenly spaced frequencies. Why did this **frequency comb** (Nobel Prize 2005) revolutionise precision measurement?`,
              choices: [
                { t: 'Its teeth act like a ruler for light, linking optical frequencies to radio frequencies that electronics can count', ok: true },
                { t: 'It makes lasers much more powerful', why: 'Combs are about precision, not power.' },
                { t: 'It produces a single pure colour', why: 'The opposite: hundreds of thousands of evenly spaced colours.' },
              ],
              explain: r`Optical frequencies (hundreds of terahertz) are far too fast to count directly. A comb's teeth are spaced by a radio frequency that can be counted, so measuring a laser against the nearest tooth gives its frequency to 18 digits. Combs make optical atomic clocks possible, and help astronomers detect the tiny Doppler wobbles of stars with planets.`,
            },
          ],
          recap: [
            r`Cavity modes are spaced by $c/2L$.`,
            'Locking N modes in phase gives pulses about 1/N of the round-trip time long.',
            'Frequency combs turn mode-locked lasers into rulers for light.',
          ],
        },
        {
          id: 'interferometry',
          title: 'Measuring with Light Waves',
          summary: 'Interferometers from the workshop to LIGO',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Michelson’s interferometer',
              body: r`Split a laser beam in two, send the halves down two arms to mirrors, and recombine them. If the two paths differ by a whole number of wavelengths, the waves arrive in step and add up: **bright**. Half a wavelength more, and they cancel: **dark**. Moving one mirror by half a wavelength (the light goes there and back) shifts the pattern by one full fringe.`,
            },
            {
              type: 'interactive',
              title: 'Counting fringes',
              body: r`Move one mirror (in nanometres) and watch the brightness at the detector. With 633 nm light, find the **smallest** mirror movement that turns the bright output completely dark.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 700, ymin: 0, ymax: 1.1, grid: false, height: 260, axes: { xlabel: 'mirror movement (nm)', ylabel: 'brightness', xticks: 100, yticks: 0.5 },
                params: { d: { min: 0, max: 700, step: 0.5, value: 60, label: 'mirror moved', color: 'coral', format: (v) => `${v.toFixed(1)} nm` } },
                curves: [{ f: (x) => Math.cos((2 * Math.PI * 2 * x) / 633 / 2) ** 2, color: 'violet', width: 3, n: 400 }],
                points: [{ x: (p) => p.d, y: (p) => Math.cos((2 * Math.PI * p.d) / 633) ** 2, color: 'coral' }],
                readout: (p) => { const b = Math.cos((2 * Math.PI * p.d) / 633) ** 2; return `path difference ${(2 * p.d).toFixed(1)} nm = ${((2 * p.d) / 633).toFixed(3)} wavelengths · brightness **${(100 * b).toFixed(0)}%**`; },
                goal: (p) => Math.cos((2 * Math.PI * p.d) / 633) ** 2 < 0.003 && p.d < 200,
                hint: 'The light travels to the mirror and back, so moving it by d changes the path by 2d.',
                solution: { d: 158.5 },
              },
              explain: r`A quarter wavelength, about **158 nm**, changes the path by half a wavelength and turns bright into dark. So an interferometer resolves movements far smaller than the wavelength of light itself, which is why it's the tool of choice for measuring tiny distances.`,
            },
            {
              type: 'numeric',
              title: 'A millimetre of fringes',
              prompt: r`The mirror moves 1 mm. How many bright fringes pass the detector with 633 nm light? (Nearest whole number.)`,
              unit: 'fringes',
              answer: Math.round((2 * 1e-3) / 633e-9),
              tol: 2,
              wrong: [{ v: Math.round(1e-3 / 633e-9), tol: 2, why: 'The path changes by twice the mirror movement.' }],
              explain: r`Path change $2 \times 1$ mm $= 2$ mm, and $\frac{2 \times 10^{-3}}{633 \times 10^{-9}} \approx 3160$ fringes. Counting fringes electronically turns a laser into an extraordinarily precise ruler: this is how machine tools and chip-making equipment are calibrated.`,
            },
            {
              type: 'mcq',
              title: 'LIGO again',
              prompt: r`LIGO is a Michelson interferometer with 4 km arms. A gravitational wave changes the arm length by about $4 \times 10^{-18}$ m. That's far smaller than a wavelength of light. How can it be detected?`,
              choices: [
                { t: 'The light bounces back and forth hundreds of times, and the detector measures tiny fractions of a fringe with a very powerful, stable laser', ok: true },
                { t: 'It counts whole fringes, like the millimetre example', why: 'The change is a few trillionths of a wavelength. Detecting it needs enormous light power and repeated bounces.' },
                { t: 'It uses X-rays, which have shorter wavelengths', why: 'LIGO uses infrared light (1064 nm). The sensitivity comes from power, bounces and noise control.' },
              ],
              explain: r`Light stores up in each arm for hundreds of round trips, multiplying the effect, and with hundreds of kilowatts circulating, the photon statistics are good enough to detect shifts of around a billionth of a fringe. Every source of noise, from seismic shaking to the quantum jitter of the light itself, had to be tamed.`,
            },
            {
              type: 'numeric',
              title: 'Reading the fringes',
              prompt: r`With 633 nm light, 200 bright fringes pass the detector as a mirror slides. Each fringe means the mirror moved half a wavelength. How far did the mirror move, in micrometres? (1 decimal place.)`,
              unit: 'µm',
              answer: 200 * 0.633 / 2,
              tol: 0.05,
              wrong: [{ v: 126.6, tol: 0.1, why: 'Each fringe is half a wavelength of mirror movement, because the light travels there and back.' }],
              explain: r`$200 \times \frac{633\ \text{nm}}{2} = 63.3$ µm, a little less than the width of a hair, measured by simply counting. Interpolating between fringes takes this down to nanometres, which is how the stages that position silicon wafers in chip factories know where they are.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Squeezed light',
              prompt: r`At LIGO's sensitivity, the random arrival times of photons (**shot noise**) limit the measurement. Since 2019 LIGO injects "squeezed light". What does squeezing do?`,
              choices: [
                { t: 'It reduces the uncertainty in the light’s phase, which LIGO measures, by increasing the uncertainty in its amplitude, which matters less', ok: true },
                { t: 'It removes all quantum uncertainty from the light', why: 'The uncertainty principle forbids that. Squeezing moves uncertainty from one quantity to another.' },
                { t: 'It squeezes the mirrors to keep them still', why: 'It’s the light’s quantum state that is squeezed, not the mirrors.' },
              ],
              explain: r`Heisenberg's principle limits the **product** of uncertainties, not each one separately. Squeezed light trades extra amplitude noise for less phase noise, improving LIGO's sensitivity and letting it detect many more black-hole mergers each year: quantum optics put to work at the frontier of astronomy.`,
            },
          ],
          recap: [
            'An interferometer turns path differences into brightness changes.',
            'Moving a mirror by λ/2 shifts one fringe, so tiny movements can be measured.',
            'LIGO combines high power, many bounces and squeezed light to sense 10⁻¹⁸ m.',
          ],
        },
        {
          id: 'focusing',
          title: 'Focusing a Laser',
          summary: 'Tiny spots, huge intensities',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'How small a spot?',
              body: r`A laser beam can be focused far more tightly than ordinary light, but diffraction still sets a limit. For a beam of radius $w$ entering a lens of focal length $f$, the focused spot (the **beam waist**) has radius about
$$w_0 \approx \frac{\lambda f}{\pi w}.$$
A wider beam or a shorter focal length gives a smaller spot. Concentrating the power into a tiny area gives enormous **intensities**, enough to cut steel.`,
            },
            {
              type: 'numeric',
              title: 'Intensity',
              prompt: r`A 1 W beam is focused to a spot of radius 10 µm. What is the intensity $\frac{P}{\pi w_0^2}$, in megawatts per square centimetre? (2 decimal places.)`,
              unit: 'MW/cm²',
              answer: 1 / (Math.PI * (10e-4) ** 2) / 1e6,
              tol: 0.01,
              explain: r`$\pi (10^{-3}\ \text{cm})^2 = 3.14 \times 10^{-6}$ cm², so $I \approx 3.2 \times 10^5$ W/cm² $= 0.32$ MW/cm²: about 3,000 times the intensity of sunlight focused by a large magnifying glass.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose the lens',
              prompt: r`A 1,064 nm laser beam, 3 mm in radius, is focused by a lens. Choose the focal length that gives a spot radius of **10 µm**. The plot shows the beam radius near the focus.`,
              widget: {
                kind: 'graph', xmin: -1.5, xmax: 1.5, ymin: -60, ymax: 60, grid: false, height: 260, axes: { xlabel: 'distance from focus (mm)', ylabel: 'beam radius (µm)', xticks: 0.5, yticks: 20, xAt: -1.5, yAt: -60 },
                params: { f: { min: 20, max: 200, step: 0.1, value: 150, label: 'focal length', color: 'coral', format: (v) => `${v.toFixed(1)} mm` } },
                curves: [{ f: () => 0, color: 'muted', width: 1.5 }, { f: (z, p) => { const w0 = (1.064e-3 * p.f) / (Math.PI * 3) * 1000, zr = (Math.PI * (w0 / 1000) ** 2) / 1.064e-3; return w0 * Math.sqrt(1 + (z / zr) ** 2); }, color: 'coral', width: 3 }, { f: (z, p) => { const w0 = (1.064e-3 * p.f) / (Math.PI * 3) * 1000, zr = (Math.PI * (w0 / 1000) ** 2) / 1.064e-3; return -w0 * Math.sqrt(1 + (z / zr) ** 2); }, color: 'coral', width: 3 }, { f: () => 10, color: 'teal', dash: true }, { f: () => -10, color: 'teal', dash: true }],
                readout: (p) => { const w0 = (1.064e-3 * p.f) / (Math.PI * 3) * 1000, zr = (Math.PI * (w0 / 1000) ** 2) / 1.064e-3; return `spot radius **${w0.toFixed(2)} µm** · stays focused over ±${(zr * 1000).toFixed(0)} µm (Rayleigh range)`; },
                goal: (p) => Math.abs((1.064e-3 * p.f) / (Math.PI * 3) * 1000 - 10) < 0.05,
                hint: r`$f = \frac{\pi w w_0}{\lambda} = \frac{\pi \times 3\ \text{mm} \times 10\ \mu\text{m}}{1.064\ \mu\text{m}}$.`,
                solution: { f: 88.6 },
              },
              explain: r`$f = \frac{\pi \times 3 \times 10^{-3} \times 10 \times 10^{-6}}{1.064 \times 10^{-6}} \approx 89$ mm. Notice the trade-off in the plot: tighter spots spread out again more quickly, so the focus is sharp only over a short distance.`,
            },
            {
              type: 'mcq',
              title: 'Even smaller',
              prompt: r`You need a spot half as big with the same lens. What could you do?`,
              choices: [
                { t: 'Expand the beam to twice the radius before the lens (or use light of half the wavelength)', ok: true },
                { t: 'Use a more powerful laser', why: 'Power doesn’t change the spot size, only its intensity.' },
                { t: 'Use a longer focal length', why: r`$w_0 \propto f$: a longer focal length makes the spot bigger.` },
              ],
              explain: r`$w_0 \propto \frac{\lambda f}{w}$: doubling the input beam (with a "beam expander") halves the spot. That’s also why Blu-ray uses a shorter wavelength than DVDs.`,
            },
            {
              type: 'numeric',
              title: 'Depth of focus',
              prompt: r`The **Rayleigh range** $z_R = \frac{\pi w_0^2}{\lambda}$ is how far the beam stays focused on either side of the waist. For $w_0 = 10$ µm and $\lambda = 1.064$ µm, what is $z_R$ in millimetres? (2 decimal places.)`,
              unit: 'mm',
              answer: (Math.PI * (10e-6) ** 2) / 1.064e-6 * 1000,
              tol: 0.01,
              explain: r`$z_R = \frac{\pi \times (10^{-5})^2}{1.064 \times 10^{-6}} \approx 0.30$ mm. A laser cutter must keep the sheet surface within a fraction of a millimetre of the focus.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Halving the spot',
              prompt: r`If the spot radius $w_0$ is halved, by what factor does the Rayleigh range change? (Enter a decimal.)`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 0.5, why: r`$z_R \propto w_0^2$.` }],
              explain: r`$z_R \propto w_0^2$, so halving the spot quarters the depth of focus. Sharp focus and long focus pull in opposite directions, a constraint in everything from microscopes to eye surgery.`,
            },
          ],
          recap: [
            r`Focused spot radius $w_0 \approx \lambda f / (\pi w)$: wider beams focus tighter.`,
            'Small spots give enormous intensities, used for cutting and welding.',
            r`Depth of focus $z_R = \pi w_0^2/\lambda$ shrinks with the square of the spot size.`,
          ],
        },
      ],
    },
  ],
};
