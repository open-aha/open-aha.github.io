import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
const HC = 1240; // eV·nm

// particle in a box of width L: energy levels in eV for an electron, L in nm
const boxE = (n, L) => (0.376 * n * n) / (L * L);
// hydrogen-like atom energy in eV for an electron confined to radius r (nm): kinetic ħ²/2mr² minus Coulomb attraction
const atomE = (r, m = 1) => 0.0381 / (m * r * r) - 1.44 / r;

export default {
  id: 'quantum',
  subject: 'physics',
  title: 'Quantum Physics',
  level: 'Advanced',
  cover: 'quantum',
  tagline: 'Photons, energy levels, matter waves, tunnelling and why atoms are stable.',
  description: r`At the scale of atoms, nature plays by strange rules. Light arrives in lumps, atoms glow only in certain colours, electrons interfere like waves, and particles can pass through walls. Discover the experiments that forced physicists to rethink reality.`,
  prereq: 'Light & Optics, and Energy',
  chapters: [
    {
      title: 'Light Comes in Lumps',
      summary: 'Photons and atomic energy levels.',
      lessons: [
        {
          id: 'photons',
          title: 'Photons',
          summary: 'The photoelectric effect',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Knocking out electrons',
              body: r`Shining light on certain metals can knock electrons out of them. Physicists in the early 1900s found something puzzling: dim **blue** light ejects electrons, but even blindingly bright **red** light ejects none at all.`,
              prompt: 'Which idea explains this?',
              choices: [
                { t: 'Light comes in packets whose energy depends on colour, and one packet frees one electron', ok: true },
                { t: 'Red light is too weak to push electrons', why: 'Very bright red light carries plenty of total energy, yet still ejects no electrons. The energy must come in packets.' },
                { t: 'Blue light heats the metal more', why: 'Heating would work for any colour, given enough brightness. It doesn’t.' },
              ],
              explain: r`In 1905, Einstein proposed that light comes in packets called **photons**. Each photon's energy depends on its frequency (its colour). An electron absorbs one photon at a time. If that photon doesn't carry enough energy, brightness (more photons) doesn't help.`,
            },
            {
              type: 'explain',
              title: 'Photon energy',
              body: r`A photon of frequency $f$ carries energy
$$E = hf = \frac{hc}{\lambda}$$
where $h = 6.63 \times 10^{-34}$ J·s is **Planck's constant**. Photon energies are tiny, so physicists use the **electronvolt**: $1 \text{ eV} = 1.6 \times 10^{-19}$ J. A handy shortcut: $E\,[\text{eV}] \approx \dfrac{1240}{\lambda\,[\text{nm}]}$.`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 720, ymin: 1.5, ymax: 3.4, grid: 50, gridY: 0.5, height: 260, axes: { xlabel: 'wavelength (nm)', ylabel: 'E (eV)' },
                params: { L: { min: 400, max: 700, step: 10, value: 550, label: r`$\lambda$`, color: 'teal', format: (v) => `${v} nm` } },
                curves: [{ f: (x) => HC / x, color: 'ink', width: 2.5 }],
                extra: ({ plot, s }) => {
                  const els = [];
                  for (let w = 400; w < 700; w += 10) {
                    const hue = 270 - ((w - 400) / 300) * 270;
                    els.push(s('rect', { x: plot.X(w), y: plot.bottom - 10, width: plot.X(w + 10) - plot.X(w) + 0.5, height: 10, fill: `hsl(${hue} 85% 55%)` }));
                  }
                  return els;
                },
                points: [{ x: (p) => p.L, y: (p) => HC / p.L, color: 'teal' }],
                readout: (p) => r`$\lambda = ${p.L}$ nm: $\;E = \frac{1240}{${p.L}} = ${f2(HC / p.L)}$ eV`,
              },
            },
            {
              type: 'numeric',
              title: 'Violet photon',
              prompt: 'What is the energy of a 400 nm (violet) photon, in eV?',
              unit: 'eV',
              answer: 3.1,
              tol: 0.02,
              wrong: [{ v: 0.32, tol: 0.01, why: r`$E = 1240/\lambda$: divide 1240 by 400.` }],
              explain: r`$E = \frac{1240}{400} = 3.1$ eV. Red light (700 nm) carries only about 1.8 eV per photon.`,
            },
            {
              type: 'mcq',
              title: 'Sodium',
              body: r`Freeing an electron from sodium takes at least 2.3 eV: its **work function**.`,
              prompt: 'Which light ejects electrons from sodium?',
              choices: [
                { t: '450 nm blue light (2.8 eV per photon)', ok: true },
                { t: '650 nm red light (1.9 eV per photon), very bright', why: 'Each red photon has too little energy (1.9 < 2.3 eV). Making it brighter adds photons, but no single photon gets stronger.' },
                { t: 'Any light, if it is bright enough', why: 'That’s what classical physics predicted, and experiments proved it wrong.' },
              ],
              explain: r`Only photons with at least 2.3 eV can free an electron. Blue light at 2.8 eV works, and leftover energy becomes the electron's kinetic energy: $2.8 - 2.3 = 0.5$ eV. Einstein won the 1921 Nobel Prize for this explanation.`,
            },
            {
              type: 'numeric',
              title: 'Sodium’s threshold',
              prompt: r`Sodium's work function is 2.3 eV. What is the **longest** wavelength of light that can still free an electron from it? ($\lambda\,[\text{nm}] \approx 1240/E\,[\text{eV}]$; nearest nm.)`,
              unit: 'nm',
              answer: 1240 / 2.3,
              tol: 3,
              wrong: [{ v: 2852, tol: 5, why: r`Divide 1240 by the energy, don't multiply.` }],
              explain: r`$\frac{1240}{2.3} \approx 539$ nm, in the green. Any longer wavelength (yellow, orange, red) carries too little energy per photon, however bright. Shorter wavelengths free electrons with the leftover energy as kinetic energy. That threshold, which classical waves can't explain, won Einstein his Nobel Prize.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Counting photons',
              prompt: r`A 1 mW laser pointer emits red light at 650 nm (about $3.06 \times 10^{-19}$ J per photon). Roughly how many photons does it emit per second? Give the answer in units of $10^{15}$.`,
              unit: r`$\times 10^{15}$ /s`,
              answer: 1e-3 / 3.06e-19 / 1e15,
              tol: 0.1,
              wrong: [{ v: 3.27e18 / 1e15, tol: 10, why: 'Use 1 mW = 0.001 W, which is 0.001 J per second.' }],
              explain: r`$\frac{0.001 \text{ J/s}}{3.06 \times 10^{-19} \text{ J}} \approx 3.3 \times 10^{15}$ photons per second. That's thousands of trillions every second, which is why light usually looks smooth and continuous.`,
            },
          ],
          recap: [
            r`Light comes in photons with $E = hf = hc/\lambda$. Use $E[\text{eV}] \approx 1240/\lambda[\text{nm}]$.`,
            'Brightness sets the number of photons. Colour sets the energy of each one.',
            'The photoelectric effect needs photons above a threshold energy.',
          ],
        },
        {
          id: 'energy-levels',
          title: 'Atoms and Light',
          summary: 'Energy levels and spectra',
          icon: 'atom',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Neon signs',
              prompt: 'Pass the glow of a neon sign through a prism and you see a few sharp, bright lines, not a full rainbow. What does that tell you?',
              choices: [
                { t: 'Neon atoms can only emit certain specific energies (colours)', ok: true },
                { t: 'The prism is broken', why: 'The same prism spreads sunlight into a smooth rainbow. The neon light itself contains only certain colours.' },
                { t: 'The light is too dim', why: 'It isn’t about brightness: the lines appear at specific wavelengths, whatever the brightness.' },
              ],
              explain: r`Each element emits its own pattern of sharp lines, like a barcode. That's how we know what distant stars are made of. The lines reveal that electrons in atoms can only have certain **energy levels**.`,
            },
            {
              type: 'explain',
              title: 'Energy levels',
              body: r`An electron in an atom can only occupy certain energy levels. For hydrogen:
$$E_n = -\frac{13.6 \text{ eV}}{n^2}, \qquad n = 1, 2, 3, \ldots$$
When an electron drops from a higher level to a lower one, it emits a photon carrying exactly the energy difference. Only those specific energies, and so specific colours, can come out.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -14.5, ymax: 1, grid: false, axes: false, height: 340,
                params: { u: { min: 3, max: 6, step: 1, value: 3, label: 'from n =', color: 'coral', format: (v) => `${v}` } },
                extra: ({ plot, p, s, arrow }) => {
                  const els = [];
                  // the upper levels crowd together, so their labels are spread out with short leader lines
                  let ly = -Infinity;
                  for (let n = 6; n >= 1; n--) {
                    const E = -13.6 / (n * n), y = plot.Y(E), row = Math.max(y, ly + 13);
                    ly = row;
                    els.push(s('line', { x1: plot.X(1), x2: plot.X(9), y1: y, y2: y, stroke: 'var(--ink-2)', 'stroke-width': n === 2 || n === p.u ? 3 : 1.5 }));
                    els.push(s('path', { d: `M${plot.X(1)} ${y} L${plot.X(1) - 10} ${row} M${plot.X(9)} ${y} L${plot.X(9) + 10} ${row}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1 }));
                    els.push(s('text', { x: plot.X(1) - 13, y: row + 4, 'text-anchor': 'end', class: 'tick', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', text: `n=${n}` }));
                    els.push(s('text', { x: plot.X(9) + 13, y: row + 4, class: 'tick', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', text: `${f2(E)} eV` }));
                  }
                  els.push(arrow(plot.X(5), plot.Y(-13.6 / (p.u * p.u)), plot.X(5), plot.Y(-13.6 / 4), { color: 'var(--coral)', width: 4, head: 12 }));
                  return els;
                },
                readout: (p) => {
                  const dE = 13.6 * (1 / 4 - 1 / (p.u * p.u));
                  return r`$n = ${p.u} \to 2$: photon of $${f2(dE)}$ eV, $\;\lambda = ${Math.round(HC / dE)}$ nm`;
                },
              },
              after: r`The drops to $n = 2$ produce visible light: 656 nm (red), 486 nm (blue-green), 434 nm and 410 nm (violet). This **Balmer series** is hydrogen's visible fingerprint.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen’s red line',
              prompt: r`An electron drops from $n = 3$ to $n = 2$ in hydrogen. What energy does the photon carry?`,
              unit: 'eV',
              answer: 13.6 * (1 / 4 - 1 / 9),
              tol: 0.02,
              wrong: [{ v: 1.51, tol: 0.02, why: r`That's $|E_3|$ alone. The photon carries the difference $E_3 - E_2$.` }, { v: 3.4, tol: 0.02, why: r`That's $|E_2|$. Subtract the two levels.` }],
              explain: r`$E_3 - E_2 = -\frac{13.6}{9} + \frac{13.6}{4} = -1.51 + 3.40 = 1.89$ eV. That gives $\lambda = 1240/1.89 \approx 656$ nm, a deep red.`,
            },
            {
              type: 'numeric',
              title: 'Counting lines',
              prompt: r`An electron starts in level $n = 4$ and can drop to any lower level, in one jump or several. How many different photon energies (spectral lines) are possible?`,
              unit: 'lines',
              answer: 6,
              wrong: [{ v: 3, why: 'It can also jump in stages: 4→3, 3→2 and so on. Count every pair of levels.' }, { v: 4, why: 'Each pair of the 4 levels gives one line: count the pairs.' }],
              explain: r`Every pair of levels gives a line: 4→3, 4→2, 4→1, 3→2, 3→1, 2→1, that's $\binom42 = 6$. Atoms with more levels produce rich barcodes of lines, and every line's position is fixed by the atom's energy levels.`,
            },
            {
              type: 'mcq',
              title: 'Dark lines in sunlight',
              prompt: r`Spread sunlight finely enough and you see hundreds of thin **dark** lines across the rainbow (Fraunhofer lines). What causes them?`,
              choices: [
                { t: 'Cooler gas in the Sun’s outer layers absorbs exactly the photon energies its atoms can jump up by', ok: true },
                { t: 'Gaps in the Sun’s surface', why: 'The Sun’s glowing surface emits a continuous spectrum. The lines come from absorption on the way out.' },
                { t: 'The prism absorbs those colours', why: 'Lamp light through the same prism shows no such lines. They’re in the sunlight itself.' },
              ],
              explain: r`Atoms absorb the same energies they emit. Light from the hot surface passes through cooler gas, which removes photons at its own spectral lines, leaving dark gaps. In 1868 an unknown line in sunlight revealed a new element, named **helium** after the Greek for Sun, decades before it was found on Earth.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ionize it',
              prompt: 'How much energy does it take to remove the electron from a hydrogen atom in its lowest level (n = 1) completely?',
              unit: 'eV',
              answer: 13.6,
              wrong: [{ v: 10.2, tol: 0.05, why: 'That only lifts the electron to n = 2. Removing it completely means going all the way to E = 0.' }],
              explain: r`Free means $E = 0$ (as $n \to \infty$). From $E_1 = -13.6$ eV, it takes 13.6 eV: hydrogen's **ionization energy**. That's a photon of about 91 nm, in the ultraviolet.`,
            },
          ],
          recap: [
            r`Electrons in atoms have discrete energy levels. For hydrogen, $E_n = -13.6/n^2$ eV.`,
            'Jumps between levels emit or absorb photons with exactly the energy difference.',
            'Every element has a unique spectral fingerprint.',
          ],
        },
      ],
    },
    {
      title: 'Matter Behaves Like Waves',
      summary: 'Duality and uncertainty.',
      lessons: [
        {
          id: 'duality',
          title: 'The Double Slit',
          summary: 'Particles that interfere',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Predict',
              body: r`Electrons are fired one at a time at a barrier with two narrow slits. Each one lands as a single dot on a screen behind it.`,
              prompt: 'After thousands of electrons, what pattern do you expect?',
              choices: [
                { t: 'Many bright and dark stripes: an interference pattern', ok: true },
                { t: 'Two bands, one behind each slit', why: 'That’s what tiny bullets would do. Electrons do something stranger. Try it next.' },
                { t: 'A random scatter with no pattern', why: 'The dots are random individually, but they build up a striking pattern.' },
              ],
              explain: r`Let's run the experiment.`,
            },
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'One at a time',
              body: r`Fire electrons one by one, then by the hundred. Watch where they land, and the histogram on the right. Fire at least 500.`,
              widget: { kind: 'doubleslit', needCount: 500 },
              gate: true,
              after: r`Each electron lands as a single particle, at a random spot. But together they build **interference stripes**, as if each electron passed through **both** slits as a wave and interfered with itself. This was demonstrated with single electrons in 1989.`,
            },
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'Peek at the slits',
              body: r`Now add detectors that record which slit each electron passes through. Turn them on, then fire.`,
              widget: { kind: 'doubleslit', detector: true, needCount: 300 },
              gate: true,
              after: r`Watching which slit each electron uses **destroys** the stripes. You get two plain bands. Gaining "which-path" information wipes out the interference. That is a central mystery of quantum mechanics.`,
            },
            {
              type: 'explain',
              title: 'Matter waves',
              body: r`In 1924, Louis de Broglie proposed that every particle has a wavelength:
$$\lambda = \frac{h}{p} = \frac{h}{mv}$$
Because $h$ is so tiny, only very light, slow particles have wavelengths big enough to notice.`,
            },
            {
              type: 'numeric',
              title: 'Electron wavelength',
              prompt: r`What is the de Broglie wavelength of an electron ($m = 9.11 \times 10^{-31}$ kg) moving at $10^6$ m/s? Give the answer in nanometres.`,
              unit: 'nm',
              answer: 6.63e-34 / (9.11e-31 * 1e6) * 1e9,
              tol: 0.01,
              wrong: [{ v: 7.28e-10, tol: 1e-11, why: 'That’s in metres. Convert to nanometres (1 nm = 10⁻⁹ m).' }],
              explain: r`$\lambda = \frac{6.63 \times 10^{-34}}{9.11 \times 10^{-31} \times 10^6} \approx 7.3 \times 10^{-10}$ m $= 0.73$ nm, about the spacing of atoms in a crystal. That's why electrons diffract off crystals, and why electron microscopes can see individual atoms.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Baseball waves',
              prompt: 'Why don’t we see a baseball diffract and interfere like an electron?',
              choices: [
                { t: 'Its wavelength (about 10⁻³⁴ m) is unimaginably smaller than anything it passes through', ok: true },
                { t: 'Big objects aren’t made of quantum particles', why: 'They are! But their de Broglie wavelength is so small that wave effects are utterly invisible.' },
                { t: 'Baseballs move too slowly', why: r`Slower actually means a *longer* wavelength. The real reason is the baseball's enormous mass compared with an electron.` },
              ],
              explain: r`A 0.145 kg ball at 40 m/s has $\lambda = \frac{6.63 \times 10^{-34}}{5.8} \approx 10^{-34}$ m, far smaller than a proton. Quantum wave effects are always there, but at everyday scales they're completely negligible.`,
            },
          ],
          recap: [
            'Particles land as dots but build up interference patterns: they behave as both waves and particles.',
            'Measuring which path a particle takes destroys the interference.',
            r`de Broglie wavelength $\lambda = h/(mv)$: significant only for tiny masses.`,
          ],
        },
        {
          id: 'uncertainty',
          title: 'Uncertainty & Tunnelling',
          summary: 'Limits and loopholes',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Pinning down a wave',
              prompt: 'A wave that is squeezed into a very short pulse (so you know where it is)…',
              choices: [
                { t: 'must be made of a wide mix of wavelengths, so its momentum is uncertain', ok: true },
                { t: 'has a single, exact wavelength', why: 'A single pure wavelength goes on forever. A short pulse needs many wavelengths added together.' },
                { t: 'stops being a wave', why: 'It’s still a wave, just a combination of many wavelengths.' },
              ],
              explain: r`A pure single-wavelength wave stretches on forever, so its position is completely uncertain. To build a short, localized pulse, you must add many wavelengths, which makes the momentum ($p = h/\lambda$) uncertain. Position and momentum trade off.`,
            },
            {
              type: 'explain',
              title: 'Heisenberg’s uncertainty principle',
              body: r`In 1927, Werner Heisenberg showed that the uncertainties in position and momentum obey
$$\Delta x \, \Delta p \ge \frac{\hbar}{2}, \qquad \hbar = \frac{h}{2\pi}$$
This isn't a flaw in our instruments. It's built into nature, because particles are waves. The more precisely you pin down where something is, the less precisely its momentum can be defined.

It's also why atoms don't collapse: squeezing an electron into the nucleus would give it a huge momentum, and so a huge energy.`,
            },
            {
              type: 'mcq',
              title: 'Narrow slit',
              prompt: 'Light passes through a slit. What happens as you make the slit narrower?',
              choices: [
                { t: 'The light spreads out more on the other side', ok: true },
                { t: 'The beam gets narrower and sharper', why: 'That happens at first, but once the slit is very narrow, squeezing it further makes the light *spread* more.' },
                { t: 'Nothing changes', why: 'Diffraction gets stronger as the slit narrows.' },
              ],
              explain: r`A narrower slit means a smaller $\Delta x$, so a bigger $\Delta p$ sideways: the beam fans out. This is diffraction and the uncertainty principle seen from two sides.`,
            },
            {
              type: 'explain',
              title: 'Tunnelling',
              body: r`Classically, a ball that lacks the energy to roll over a hill can never get to the other side. But a quantum particle's wave doesn't stop dead at a barrier. It fades away inside it. If the barrier is thin enough, a little of the wave leaks through, so there's a small chance the particle appears on the other side. This is **quantum tunnelling**.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 6, ymin: -1.3, ymax: 1.6, grid: false, axes: false, height: 240,
                params: { w: { min: 0.2, max: 2, step: 0.1, value: 0.8, label: 'barrier width', color: 'violet', format: (v) => v.toFixed(1) } },
                extra: ({ plot, p, s }) => {
                  const k = 3, kappa = 1.6;
                  const T = Math.exp(-2 * kappa * p.w);
                  const amp = Math.sqrt(T);
                  const pts = [];
                  for (let i = 0; i <= 300; i++) {
                    const x = -4 + (10 * i) / 300;
                    let y;
                    if (x < 0) y = Math.cos(k * x);
                    else if (x < p.w) y = Math.exp(-kappa * x);
                    else y = amp * Math.cos(k * (x - p.w));
                    pts.push(`${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`);
                  }
                  return [
                    s('rect', { x: plot.X(0), y: plot.Y(1.5), width: plot.X(p.w) - plot.X(0), height: plot.Y(-1.2) - plot.Y(1.5), class: 'fl-violet', opacity: 0.25 }),
                    s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }),
                  ];
                },
                readout: (p) => r`tunnelling probability $\approx ${(100 * Math.exp(-2 * 1.6 * p.w)).toFixed(1)}\%$`,
              },
              after: 'The chance falls off exponentially with the barrier’s width: a slightly thicker barrier makes tunnelling far less likely.',
            },
            {
              type: 'numeric',
              title: 'Confined electron',
              prompt: r`An electron is confined to a region 0.1 nm wide. Its momentum is then uncertain by at least $\frac{\hbar}{2\Delta x}$, so its speed by about $\frac{\hbar}{2m\Delta x}$ ($\hbar = 1.05 \times 10^{-34}$ J·s, $m = 9.11 \times 10^{-31}$ kg). Roughly how big is that speed uncertainty, in km/s? (Nearest 10.)`,
              unit: 'km/s',
              answer: 1.0546e-34 / (2 * 1e-10) / 9.109e-31 / 1000,
              tol: 10,
              explain: r`About 580 km/s. Squeezed into an atom, an electron can’t sit still: this "zero-point" motion is why atoms have a size at all.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Tunnelling in action',
              prompt: 'Which of these depends on quantum tunnelling?',
              choices: [
                { t: 'Nuclear fusion in the Sun', ok: true },
                { t: 'A rainbow', why: 'Rainbows come from refraction and reflection in raindrops, which is ordinary optics.' },
                { t: 'A magnet sticking to a fridge', why: 'That’s magnetism, not tunnelling.' },
              ],
              explain: r`Protons in the Sun's core repel each other strongly. Classically, even at 15 million kelvin, they almost never get close enough to fuse. Tunnelling lets them slip through the repulsion barrier often enough to power the Sun. Tunnelling also explains alpha radioactivity and makes scanning tunnelling microscopes (which image individual atoms) and flash memory possible.`,
            },
          ],
          recap: [
            r`Uncertainty principle: $\Delta x\,\Delta p \ge \hbar/2$. It's built into nature, not a measurement flaw.`,
            'Quantum particles can tunnel through barriers they classically couldn’t cross.',
            'Tunnelling powers the Sun and enables electron microscopes and flash memory.',
          ],
        },
      ],
    },
    {
      title: 'Waves in a Box',
      summary: 'Quantised energies and why atoms are stable.',
      lessons: [
        {
          id: 'box',
          title: 'A Particle in a Box',
          summary: 'Where energy levels come from',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Standing waves',
              body: r`Why can an electron in an atom have only certain energies? The simplest model is an electron trapped in a box of width $L$. Its matter wave must vanish at both walls, so, like a guitar string, it can only form **standing waves** with a whole number of half-wavelengths: $\lambda_n = \frac{2L}{n}$.

Using de Broglie's $p = h/\lambda$, each allowed wave has a definite energy:
$$E_n = \frac{n^2 h^2}{8 m L^2}, \qquad n = 1, 2, 3, \ldots$$
Confinement **forces** quantisation.`,
            },
            {
              type: 'interactive',
              title: 'Waves in the box',
              body: r`The violet curve is the wavefunction $\psi$; the shaded curve is $|\psi|^2$, the probability of finding the electron at each point. Points where the probability is zero, inside the box, are **nodes**. Find the state with exactly **4 nodes**.`,
              widget: {
                kind: 'graph', xmin: -0.1, xmax: 1.1, ymin: -1.3, ymax: 2.3, grid: false, axes: false, height: 280,
                params: { n: { min: 1, max: 8, step: 1, value: 2, label: '$n$', color: 'violet' } },
                curves: [{ f: (x, p) => (x >= 0 && x <= 1 ? Math.sin(p.n * Math.PI * x) : NaN), color: 'violet', width: 3, n: 400 }],
                extra: ({ plot, p, s }) => { let d = `M${plot.X(0)} ${plot.Y(0)}`; for (let i = 0; i <= 300; i++) { const x = i / 300; d += `L${plot.X(x).toFixed(1)} ${plot.Y(2 * Math.sin(p.n * Math.PI * x) ** 2 * 0.5 + 0).toFixed(1)}`; } d += `L${plot.X(1)} ${plot.Y(0)}Z`; const els = [s('path', { d, class: 'fl-coral-soft', opacity: 0.8 }), s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.25), y2: plot.Y(2.25), stroke: 'var(--ink)', 'stroke-width': 5 }), s('line', { x1: plot.X(1), x2: plot.X(1), y1: plot.Y(-1.25), y2: plot.Y(2.25), stroke: 'var(--ink)', 'stroke-width': 5 }), s('line', { x1: plot.X(0), x2: plot.X(1), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1 })]; for (let k = 1; k < p.n; k++) els.push(s('circle', { cx: plot.X(k / p.n), cy: plot.Y(0), r: 5, class: 'fl-ink' })); return els; },
                readout: (p) => `$n = ${p.n}$: ${p.n - 1} node${p.n === 2 ? '' : 's'} · energy $E_${p.n} = ${p.n * p.n}\\,E_1$`,
                goal: (p) => p.n === 5,
                hint: 'Each extra half-wavelength adds one node.',
                solution: { n: 5 },
              },
              explain: r`State $n = 5$ has 4 nodes ($n - 1$ in general). At a node the electron is **never** found, yet it is found on both sides: the electron isn't a little ball shuttling back and forth, it's a wave spread through the box. Wiggly waves mean short wavelengths, high momentum and high energy, which is why $E \propto n^2$.`,
            },
            {
              type: 'numeric',
              title: 'Climbing the ladder',
              prompt: r`How many times the ground-state energy does the $n = 3$ state have?`,
              unit: '× E₁',
              answer: 9,
              wrong: [{ v: 3, why: r`Energy grows like $n^2$, not $n$.` }, { v: 8, why: r`That's $E_3 - E_1$ in units of $E_1$. The question asks for $E_3$ itself: $3^2$.` }],
              explain: r`$E_3 = 3^2 E_1 = 9E_1$. The gaps widen as you climb: $E_2 - E_1 = 3E_1$, $E_3 - E_2 = 5E_1$. (In hydrogen the gaps **shrink** instead, because the electron's "box" is a sloping $1/r$ potential that widens with energy.)`,
            },
            {
              type: 'numeric',
              title: 'A nanometre box',
              prompt: r`For an electron in a 1 nm box, $E_1 \approx 0.376$ eV. When it drops from $n = 2$ to $n = 1$, what wavelength of light does it emit? ($\lambda = 1240/E$ with $E$ in eV and $\lambda$ in nm; nearest 10 nm.)`,
              unit: 'nm',
              answer: 1240 / (3 * 0.376),
              tol: 8,
              wrong: [{ v: 1240 / 0.376, relTol: 0.02, why: r`The photon carries $E_2 - E_1 = 3E_1$, not $E_1$.` }, { v: 1240 / (4 * 0.376), relTol: 0.02, why: r`$E_2 = 4E_1$, but the photon only carries the difference: $3E_1$.` }],
              explain: r`$E_2 - E_1 = 3 \times 0.376 = 1.13$ eV, so $\lambda = \frac{1240}{1.13} \approx 1100$ nm, in the near infrared. Shrink the box and the energies grow like $1/L^2$, pushing the light toward blue.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Quantum dots',
              body: r`**Quantum dots** are semiconductor crystals a few nanometres across that trap electrons like a box. Their colour is set by their **size**, not their chemistry. Shrink the box and watch the emitted colour.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4, grid: false, axes: false, height: 180,
                params: { L: { min: 2, max: 8, step: 0.1, value: 5, label: 'dot size', color: 'violet', format: (v) => `${v.toFixed(1)} nm` } },
                extra: ({ plot, p, s }) => { const E = 1.74 + 3.4 / (p.L * p.L), lam = 1240 / E; const hue = lam < 440 ? 270 : lam > 680 ? 0 : 270 - ((lam - 440) / 240) * 270; return [s('circle', { cx: plot.X(5), cy: plot.Y(2), r: 8 + p.L * 9, fill: `hsl(${hue.toFixed(0)}, 85%, 55%)`, stroke: 'var(--ink-3)' })]; },
                readout: (p) => { const E = 1.74 + 3.4 / (p.L * p.L); return `emitted photon: **${E.toFixed(2)} eV**, wavelength **${Math.round(1240 / E)} nm**`; },
              },
              after: r`Small dots glow blue, large dots red, all from the same material (this model uses cadmium selenide: its bulk gap of 1.74 eV plus a confinement energy that grows like $1/L^2$). Quantum dots colour the pixels in "QLED" televisions, and their discoverers (Moungi Bawendi, Louis Brus and Alexei Ekimov) won the 2023 Nobel Prize in Chemistry.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Never at rest',
              prompt: r`The lowest energy in the box is $E_1$, not zero. Why can't the trapped electron simply sit still with zero energy?`,
              choices: [
                { t: 'Being confined to a width L means a spread in momentum of at least about h/L, so it must keep moving', ok: true },
                { t: 'The walls keep pushing it', why: 'The walls only stop it from leaving. The minimum energy comes from confinement itself.' },
                { t: 'It could, if the box were cold enough', why: 'Even at absolute zero, the ground state keeps this zero-point energy.' },
              ],
              explain: r`A zero-energy electron would have zero momentum, and so (by the uncertainty principle) a completely spread-out position, which can't fit in the box. The leftover **zero-point energy** is real: it's why liquid helium never freezes at normal pressure, even at absolute zero.`,
            },
          ],
          recap: [
            r`Confined waves form standing waves: $E_n = \frac{n^2h^2}{8mL^2}$.`,
            'State n has n − 1 nodes; energy grows like n².',
            'Smaller boxes mean bigger energies: quantum dots change colour with size.',
          ],
        },
        {
          id: 'atomsize',
          title: 'Why Atoms Are Stable',
          summary: 'The uncertainty principle sets the size of atoms',
          icon: 'atom',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A classical disaster',
              prompt: r`In classical physics, an electron orbiting a nucleus is accelerating, so it should radiate light, lose energy and spiral inward. Calculations put the collapse at about $10^{-11}$ seconds. Why doesn't it happen?`,
              choices: [
                { t: 'Squeezing the electron closer would raise its kinetic energy more than it lowers its potential energy', ok: true },
                { t: 'The nucleus repels the electron at short range', why: 'The proton attracts the electron all the way in. The resistance comes from quantum mechanics.' },
                { t: 'Electrons orbit too fast to fall in', why: 'In classical physics, a faster orbit would radiate even more.' },
              ],
              explain: r`An electron confined to a region of size $r$ must have momentum around $\hbar/r$ (the uncertainty principle), so kinetic energy around $\frac{\hbar^2}{2mr^2}$. That grows faster than the attraction $-\frac{ke^2}{r}$ falls as $r$ shrinks, so there's a minimum-energy size below which the atom can't go.`,
            },
            {
              type: 'interactive',
              title: 'Find the size of hydrogen',
              body: r`The total energy of an electron squeezed to radius $r$ is roughly
$$E(r) = \frac{\hbar^2}{2mr^2} - \frac{ke^2}{r} = \frac{0.0381}{r^2} - \frac{1.44}{r} \text{ eV} \quad (r \text{ in nm})$$
Find the radius where the energy is **lowest**: the size of a hydrogen atom.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.3, ymin: -16, ymax: 12, grid: false, height: 300, padL: 52, axes: { xlabel: 'radius r (nm)', ylabel: 'energy (eV)', xticks: 0.05, yticks: 4, xfmt: (v) => v.toFixed(2) },
                params: { r: { min: 0.015, max: 0.3, step: 0.0005, value: 0.12, label: '$r$', color: 'coral', format: (v) => `${v.toFixed(4)} nm` } },
                curves: [{ f: (x) => (x > 0.008 ? atomE(x) : NaN), color: 'violet', width: 3, n: 400 }, { f: (x) => (x > 0.008 ? 0.0381 / (x * x) : NaN), color: 'blue', dash: true }, { f: (x) => (x > 0.008 ? -1.44 / x : NaN), color: 'teal', dash: true }],
                points: [{ x: (p) => p.r, y: (p) => atomE(p.r), color: 'coral' }],
                readout: (p) => `kinetic ${(0.0381 / (p.r * p.r)).toFixed(2)} eV · potential ${(-1.44 / p.r).toFixed(2)} eV · total **${atomE(p.r).toFixed(2)} eV**`,
                goal: (p) => Math.abs(p.r - 0.0529) < 0.0015,
                hint: 'Find the bottom of the violet valley.',
                solution: { r: 0.053 },
              },
              explain: r`The minimum is at $r \approx 0.053$ nm, with $E = -13.6$ eV: exactly the Bohr radius and hydrogen's ground-state energy. This rough argument, using only the uncertainty principle, gets both right. Every atom's size is set by this balance between confinement and attraction.`,
            },
            {
              type: 'numeric',
              title: 'The balance point',
              prompt: r`Setting the slope of $E(r) = \frac{A}{r^2} - \frac{B}{r}$ to zero gives the minimum at $r = \frac{2A}{B}$. With $A = 0.0381$ eV·nm² and $B = 1.44$ eV·nm, what is $r$? (4 decimal places, in nm.)`,
              unit: 'nm',
              answer: (2 * 0.0381) / 1.44,
              tol: 0.0003,
              wrong: [{ v: 0.0381 / 1.44, tol: 0.0003, why: 'Don’t forget the factor of 2.' }],
              explain: r`$r = \frac{0.0762}{1.44} \approx 0.0529$ nm, the **Bohr radius**. Plugging back in, $E = -\frac{B^2}{4A} = -13.6$ eV.`,
            },
            {
              type: 'mcq',
              title: 'Heavier electrons',
              prompt: r`A **muon** is like an electron but about 207 times heavier. In "muonic hydrogen", a muon orbits a proton instead of an electron. How does its size compare with ordinary hydrogen?`,
              choices: [
                { t: 'About 200 times smaller, because the kinetic-energy term is 200 times weaker', ok: true },
                { t: 'About 200 times bigger', why: r`The kinetic term $\frac{\hbar^2}{2mr^2}$ shrinks as $m$ grows, so the balance point moves inward.` },
                { t: 'The same size', why: 'Size depends on the mass through the kinetic-energy term.' },
              ],
              explain: r`The radius $\frac{2A}{B}$ is proportional to $\frac1m$, so the muon sits about 200 times closer, near enough to the proton to probe its size. Measurements of muonic hydrogen in 2010 found the proton slightly smaller than expected, the "proton radius puzzle", since resolved by better ordinary-hydrogen measurements.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen’s ultraviolet line',
              prompt: r`With $E_n = -\frac{13.6\ \text{eV}}{n^2}$, an electron dropping from $n = 2$ to $n = 1$ releases $13.6 - 3.4 = 10.2$ eV. What wavelength is that photon, in nm? ($\lambda \approx 1240/E$; 1 decimal place.)`,
              unit: 'nm',
              answer: 1240 / 10.2,
              tol: 0.3,
              wrong: [{ v: 1240 / 13.6, tol: 0.3, why: 'That’s the ionisation energy (all the way out). The jump from 2 to 1 releases 10.2 eV.' }],
              explain: r`$\frac{1240}{10.2} \approx 121.6$ nm: the **Lyman-alpha** line, in the ultraviolet. It's the brightest line in the universe's most common atom, and in distant galaxies it arrives stretched into the infrared, which is how the James Webb Space Telescope spots them.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Why matter has volume',
              prompt: r`If the electron's mass were twice as large, its atoms would shrink. By what factor would the **volume** of a hydrogen atom change? (Give a decimal.)`,
              unit: '×',
              answer: 0.125,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'That’s the change in radius. Volume goes like radius cubed.' }, { v: 8, why: 'A heavier electron makes atoms smaller, not bigger.' }],
              explain: r`The radius halves, so the volume shrinks by $\left(\frac12\right)^3 = \frac18$. The fact that you can't walk through walls, and that a glass of water takes up space at all, comes down to this quantum balance (together with the Pauli exclusion principle, which stops electrons from piling into the same state).`,
            },
          ],
          recap: [
            'Confining an electron raises its kinetic energy (uncertainty principle).',
            'Balancing that against attraction gives the Bohr radius, 0.053 nm, and −13.6 eV.',
            'Atomic size scales like 1/(electron mass): quantum mechanics is why matter is stable.',
          ],
        },
        {
          id: 'spin',
          title: 'Spin & Stern–Gerlach',
          summary: 'Measuring a quantum arrow',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Two spots, not a smear',
              body: r`In 1922 Otto Stern and Walther Gerlach fired silver atoms through a non-uniform magnetic field. Each atom acts like a tiny magnet, so the field deflects it according to how its magnet points. Classically, the magnets would point every which way and smear out into a continuous band.

Instead they saw exactly **two** spots: "up" and "down". The atom’s **spin** along any measured direction takes only two values.`,
            },
            {
              type: 'mcq',
              title: 'Sorting again',
              prompt: r`Take only the "up" atoms from a vertical Stern–Gerlach magnet and pass them through a second **vertical** magnet. What comes out?`,
              choices: [
                { t: 'All of them go up', ok: true },
                { t: 'Half up, half down', why: 'A repeat measurement along the same direction gives the same answer.' },
                { t: 'A smear', why: 'Spin measurements always give one of two results, and the same axis repeats the same result.' },
              ],
              explain: r`Measuring the same thing twice gives the same result. The interesting part is what happens when the second magnet is tilted.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tilt the second magnet',
              prompt: r`Atoms prepared "up" along the vertical enter a magnet tilted by angle $\theta$. Quantum mechanics predicts they come out "up" (along the new axis) with probability $\cos^2\frac{\theta}{2}$. Find the tilt for which only **25%** come out up.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.2, xmax: 4.6, ymin: -1.6, ymax: 1.6, grid: false, axes: false, maxWidth: 520, pad: 6,
                params: { th: { min: 0, max: 180, step: 0.5, value: 60, label: 'tilt θ', color: 'violet', format: (v) => `${fix(v, 1)}°` } },
                extra: ({ plot, p, s, arrow }) => { const t = (p.th * Math.PI) / 180, P = Math.cos(t / 2) ** 2; return [arrow(plot.X(-1), plot.Y(-1.1), plot.X(-1), plot.Y(1.1), { color: 'var(--coral)', width: 4 }), s('line', { x1: plot.X(-1 - 1.2 * Math.sin(t)), y1: plot.Y(-1.2 * Math.cos(t)), x2: plot.X(-1 + 1.2 * Math.sin(t)), y2: plot.Y(1.2 * Math.cos(t)), stroke: 'var(--violet)', 'stroke-width': 3, 'stroke-dasharray': '6 4' }), s('rect', { x: plot.X(1.6), y: plot.Y(1.2 * P), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1.2 * P), class: 'fl-teal' }), s('rect', { x: plot.X(3), y: plot.Y(1.2 * (1 - P)), width: plot.X(1) - plot.X(0), height: plot.Y(0) - plot.Y(1.2 * (1 - P)), class: 'fl-coral' }), s('text', { x: plot.X(2.1), y: plot.Y(-0.25), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: 'up' }), s('text', { x: plot.X(3.5), y: plot.Y(-0.25), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: 'down' })]; },
                readout: (p) => { const P = Math.cos((p.th * Math.PI) / 360) ** 2; return `up along the tilted axis: **${(100 * P).toFixed(1)}%** · down: ${(100 * (1 - P)).toFixed(1)}%`; },
                goal: (p) => Math.abs(p.th - 120) < 0.6,
                hint: r`You need $\cos\frac{\theta}{2} = \frac12$.`,
                solution: { th: 120 },
              },
              explain: r`$\cos\frac{\theta}{2} = \frac12$ gives $\frac{\theta}{2} = 60°$, so $\theta = 120°$. Note the **half-angle**: an up atom has zero chance of being found up only when the magnet is fully reversed (180°), not at 90°. That half-angle is the signature of spin-½ particles.`,
            },
            {
              type: 'numeric',
              title: 'Sideways',
              prompt: r`What percentage of vertically "up" atoms come out "up" from a **horizontal** magnet ($\theta = 90°$)?`,
              unit: '%',
              answer: 50,
              tol: 0.5,
              explain: r`$\cos^2 45° = \frac12$: a perfect coin toss. Knowing the vertical spin tells you nothing about the horizontal spin.`,
            },
            {
              type: 'mcq',
              title: 'Up, sideways, up',
              prompt: r`Atoms pass a vertical magnet (keep "up"), then a horizontal magnet (keep "right"), then a vertical magnet again. What fraction of the atoms reaching the last magnet come out "up"?`,
              choices: [
                { t: 'Half: the horizontal measurement wiped out the vertical information', ok: true },
                { t: 'All: they were selected as up at the start', why: 'Measuring the horizontal spin disturbs the vertical spin. It is no longer definite.' },
                { t: 'None', why: 'Down is not forced either; it’s 50/50.' },
              ],
              explain: r`Spin along different axes can’t be known at the same time: measuring one scrambles the other, much like position and momentum. This experiment is a clean demonstration of quantum measurement.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two small turns',
              prompt: r`"Up" atoms pass a magnet tilted 60° (keep "up"), then one tilted 120° (60° more; keep "up"). What percentage survive both? (Percentage, 2 decimal places.)`,
              unit: '%',
              answer: 56.25,
              tol: 0.05,
              wrong: [{ v: 25, why: r`That’s a single 120° turn. Here there are two 60° steps: $\cos^2 30° \times \cos^2 30°$.` }],
              explain: r`Each 60° step passes $\cos^2 30° = \frac34$, so both pass $\frac34 \times \frac34 = 56.25\%$, more than the 25% from a single 120° jump. With many tiny steps, nearly all atoms can be rotated to the new direction: a quantum version of the three-polariser trick.`,
            },
          ],
          recap: [
            'Spin measurements give only two results, up or down, along any axis.',
            r`An atom up along one axis is up along an axis tilted by $\theta$ with probability $\cos^2(\theta/2)$.`,
            'Measuring spin along one axis scrambles it along the others.',
          ],
        },
      ],
    },
  ],
};
