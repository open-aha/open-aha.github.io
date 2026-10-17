const r = String.raw;
const L_SCREEN = 2; // m
const hue = (nm) => Math.max(0, Math.min(270, (270 * (700 - nm)) / 300));
const colourName = (nm) => (nm < 450 ? 'violet' : nm < 490 ? 'blue' : nm < 520 ? 'cyan' : nm < 565 ? 'green' : nm < 590 ? 'yellow' : nm < 625 ? 'orange' : 'red');
const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
const N_SOAP = 1.33;
const soapR = (lam, t) => Math.sin((2 * Math.PI * N_SOAP * t) / lam) ** 2;

// single slit (width a µm), 650 nm light, screen 2 m away: half-width of central maximum in mm
const halfWidth = (a) => (650e-9 * 2) / (a * 1e-6) * 1000;
// Bragg: path difference in wavelengths for NaCl (d = 0.282 nm) and Cu Kα X-rays (0.154 nm)
const braggOrder = (th) => (2 * 0.282 * Math.sin((th * Math.PI) / 180)) / 0.154;

export default {
  id: 'waveoptics',
  subject: 'physics',
  title: 'Wave Optics',
  level: 'Intermediate',
  cover: 'waveoptics',
  tagline: 'Fringes, rainbows on a CD, soap-bubble colours, and the instrument that heard black holes collide.',
  description: r`When light waves overlap, they add up or cancel out. Repeat Thomas Young's double-slit experiment, use a diffraction grating to split light into a spectrum, explain the shimmering colours of soap bubbles, see how interferometers measure distances far smaller than an atom, and use single slits and crystals to see diffraction at work.`,
  prereq: 'Light & Optics',
  chapters: [
    {
      title: 'Interference Patterns',
      summary: 'Slits and gratings.',
      lessons: [
        {
          id: 'young',
          title: 'Young’s Double Slit',
          summary: 'Proof that light is a wave',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Light plus light = darkness?',
              body: r`Around 1801, Thomas Young shone light through two narrow, closely spaced slits. On a screen beyond, he didn't see two bright lines, but a row of bright and dark **fringes**.

Light from the two slits travels slightly different distances to each point on the screen. Where the path difference is a whole number of wavelengths, the waves arrive in step and reinforce: a bright fringe. Where it's a half-wavelength off, they cancel: a dark fringe. Particles can't cancel each other out like that, so this was strong evidence that light is a wave.`,
            },
            {
              type: 'explain',
              title: 'Fringe spacing',
              body: r`For slits a distance $d$ apart and a screen at distance $L$ (much bigger than $d$), the path difference at height $y$ on the screen is about $\frac{d\,y}{L}$. Bright fringes occur when this equals $0, \lambda, 2\lambda, \dots$, so neighbouring bright fringes are separated by
$$\Delta y = \frac{\lambda L}{d}$$
Longer wavelengths and closer slits give wider fringes.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Tune the fringes',
              prompt: r`The screen is 2 m from the slits. Adjust the wavelength and slit separation to make the bright fringes exactly **4 mm** apart.`,
              widget: {
                kind: 'graph', xmin: -12, xmax: 12, ymin: -0.62, ymax: 1.15, grid: false, height: 320,
                axes: { ylabel: 'brightness', xticks: 4, xfmt: (x) => (x === 12 ? '12 mm' : String(x).replace('-', '−')), yfmt: () => '', xAt: -12 },
                params: {
                  lam: { min: 400, max: 700, step: 10, value: 500, label: 'wavelength', color: 'violet', format: (v) => `${v} nm` },
                  d: { min: 0.1, max: 0.5, step: 0.05, value: 0.2, label: 'slit separation', color: 'teal', format: (v) => `${v.toFixed(2)} mm` },
                },
                curves: [{ f: (y, p) => Math.cos((Math.PI * p.d * y) / (p.lam * 1e-6 * L_SCREEN * 1e3)) ** 2 * sinc((Math.PI * 0.04 * y) / (p.lam * 1e-6 * L_SCREEN * 1e3)) ** 2, color: 'ink', width: 2.5 }],
                extra: ({ plot, p, s }) => {
                  const els = [], N = 160, w = (plot.X(12) - plot.X(-12)) / N + 0.6;
                  for (let i = 0; i < N; i++) {
                    const y = -12 + (24 * (i + 0.5)) / N;
                    const I = Math.cos((Math.PI * p.d * y) / (p.lam * 1e-6 * L_SCREEN * 1e3)) ** 2 * sinc((Math.PI * 0.04 * y) / (p.lam * 1e-6 * L_SCREEN * 1e3)) ** 2;
                    els.push(s('rect', { x: plot.X(y) - w / 2, y: plot.Y(-0.3), width: w, height: plot.Y(-0.58) - plot.Y(-0.3), fill: `hsl(${hue(p.lam)}, 90%, 50%)`, opacity: I.toFixed(3) }));
                  }
                  els.push(s('rect', { x: plot.X(-12), y: plot.Y(-0.3), width: plot.X(12) - plot.X(-12), height: plot.Y(-0.58) - plot.Y(-0.3), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1 }));
                  return els;
                },
                readout: (p) => r`$\Delta y = \dfrac{\lambda L}{d} = \dfrac{${p.lam} \times 10^{-9} \times 2}{${p.d.toFixed(2)} \times 10^{-3}} = ${((p.lam * 1e-6 * L_SCREEN * 1e3) / p.d).toFixed(2)}$ mm`,
                goal: (p) => Math.abs((p.lam * 1e-6 * L_SCREEN * 1e3) / p.d - 4) < 0.05,
                hint: r`You need $\frac{\lambda L}{d} = 4$ mm, so $\lambda$ (in nm) must be $2000 \times d$ (in mm). Try $d = 0.30$ mm.`,
                solution: { lam: 600, d: 0.3 },
              },
              explain: r`Any pair with $\lambda/d = 2 \times 10^{-3}$ works, such as 600 nm with 0.30 mm, or 500 nm with 0.25 mm. Notice that red light makes wider fringes than blue: measuring fringe spacing was one of the first ways to measure the wavelength of light. Young found wavelengths of roughly half a micrometre.`,
            },
            {
              type: 'numeric',
              title: 'Red laser',
              prompt: r`A red laser pointer (650 nm) shines through two slits 0.25 mm apart onto a wall 2 m away. What is the fringe spacing?`,
              unit: 'mm',
              answer: (650e-9 * 2) / 0.25e-3 * 1000,
              tol: 0.02,
              wrong: [{ v: 0.0052, tol: 0.0002, why: 'Check units: the answer in metres is 0.0052 m. Convert to millimetres.' }, { v: (650e-9 * 0.25e-3) / 2 * 1000, relTol: 0.1, why: r`Use $\Delta y = \frac{\lambda L}{d}$: multiply by $L$ and divide by $d$.` }],
              explain: r`$\Delta y = \frac{650 \times 10^{-9} \times 2}{0.25 \times 10^{-3}} = 5.2 \times 10^{-3}$ m $= 5.2$ mm. Easy to see on a wall, even though the wavelength itself is less than a thousandth of a millimetre. That's the power of interference: it magnifies tiny lengths into visible patterns.`,
            },
            {
              type: 'numeric',
              title: 'Green fringes',
              prompt: r`Green light (532 nm) passes through two slits 0.3 mm apart onto a screen 1.5 m away. What is the fringe spacing $\frac{\lambda L}{d}$, in millimetres? (2 decimal places.)`,
              unit: 'mm',
              answer: 532e-9 * 1.5 / 0.3e-3 * 1000,
              tol: 0.01,
              explain: r`$\frac{532 \times 10^{-9} \times 1.5}{0.3 \times 10^{-3}} \approx 2.66$ mm. Moving the slits closer together spreads the fringes out.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'One particle at a time',
              prompt: r`In modern versions of Young's experiment, light (or even electrons) is sent through the slits **one particle at a time**, recorded as single dots. After thousands of dots, what pattern appears?`,
              choices: [
                { t: 'The same interference fringes: each particle somehow goes through both slits as a wave', ok: true },
                { t: 'Two bright bands behind the slits, as for ordinary particles', why: 'Experiments show fringes build up dot by dot, even with one particle at a time.' },
                { t: 'A uniform smear', why: 'The dots cluster into bright fringes and avoid the dark ones.' },
              ],
              explain: r`Each particle lands as a dot, but where it can land follows the wave pattern. Richard Feynman called this the central mystery of quantum mechanics. Electrons were first shown to do this one at a time in 1974 and filmed in 1989 by Akira Tonomura's team.`,
            },
          ],
          recap: [
            'Two slits produce bright and dark fringes: evidence that light is a wave.',
            'Bright fringes occur where the path difference is a whole number of wavelengths.',
            r`Fringe spacing $\Delta y = \lambda L / d$.`,
          ],
        },
        {
          id: 'grating',
          title: 'Diffraction Gratings',
          summary: 'Rainbows from a CD',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Thousands of slits',
              body: r`A **diffraction grating** has thousands of evenly spaced slits or grooves. With so many sources, the bright fringes become extremely sharp, and they appear only at angles $\theta$ where
$$d \sin\theta = m\lambda \qquad (m = 0, 1, 2, \dots)$$
Different wavelengths bend by different amounts, so white light fans out into a spectrum. The tightly packed tracks on a CD act as a grating, which is why it shimmers with rainbows.`,
            },
            {
              type: 'numeric',
              title: 'CD rainbow',
              prompt: r`The tracks on a CD are $1.6\ \mu\text{m}$ apart. At what angle does the first-order ($m = 1$) red light (650 nm) appear? (Nearest degree.)`,
              unit: '°',
              answer: Math.asin(0.65 / 1.6) * (180 / Math.PI),
              tol: 0.6,
              wrong: [{ v: 0.41, tol: 0.01, why: r`That's $\sin\theta$. Now take the inverse sine: $\theta = \sin^{-1}(0.406)$.` }],
              explain: r`$\sin\theta = \frac{0.65}{1.6} \approx 0.406$, so $\theta \approx 24°$. Violet light (400 nm) appears at about $14.5°$, so the first-order spectrum fans out over about $10°$. A DVD, with tracks only $0.74\ \mu\text{m}$ apart, spreads colours even more widely.`,
            },
            {
              type: 'numeric',
              title: 'How many orders?',
              prompt: r`For the same CD and red light, what's the **highest** order $m$ that can appear? (Remember $\sin\theta$ can't exceed 1.)`,
              answer: 2,
              wrong: [{ v: 2.46, tol: 0.05, why: 'Orders are whole numbers. Round down.' }, { v: 3, why: r`$m = 3$ would need $\sin\theta = 3 \times 0.406 = 1.22$: impossible.` }],
              explain: r`$m \le \frac{d}{\lambda} = \frac{1.6}{0.65} \approx 2.46$, so only $m = 0, 1, 2$ appear (on each side).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Split the sodium lines',
              prompt: r`Sodium's yellow light is really two lines, at 589.0 nm and 589.6 nm. A grating with $N$ illuminated lines can separate wavelengths differing by $\Delta\lambda = \frac{\lambda}{mN}$. In first order, find the **smallest** $N$ (in steps of 50) that resolves the pair.`,
              widget: {
                kind: 'graph', xmin: 587.5, xmax: 591, ymin: 0, ymax: 1.1, grid: 0.5, gridY: 0.25, height: 250, axes: { xlabel: 'wavelength (nm)', ylabel: 'intensity', yfmt: () => '', xAt: 587.5 },
                params: { N: { min: 100, max: 3000, step: 50, value: 300, label: 'lines N', color: 'violet' } },
                curves: [{ f: (x, p) => { const w = 589.3 / p.N; const g = (c) => Math.exp(-(((x - c) / (0.6 * w)) ** 2)); return (g(589.0) + g(589.6)) / (1 + Math.exp(-((0.6 / (0.6 * w)) ** 2))); }, color: 'amber', width: 3, n: 600 }],
                readout: (p) => r`$N = ${p.N}$: smallest separable difference $\frac{589.3}{${p.N}} = ${(589.3 / p.N).toFixed(2)}$ nm ${589.3 / p.N <= 0.6 ? '(resolved ✓)' : '(blurred together)'}`,
                goal: (p) => 589.3 / p.N <= 0.6 && 589.3 / (p.N - 50) > 0.6,
                hint: r`You need $N \ge \frac{589.3}{0.6}$.`,
                solution: { N: 1000 },
              },
              explain: r`$N \ge \frac{589.3}{0.6} \approx 982$, so 1,000 lines. A grating's resolving power grows with the number of lines illuminated: astronomical spectrographs use gratings with tens of thousands of lines to measure tiny Doppler shifts.`,
            },
            {
              type: 'numeric',
              title: 'First-order angle',
              prompt: r`A grating has 600 lines per mm, so the slits are $d = \frac{1}{600}$ mm apart. At what angle does the first-order maximum for 500 nm light appear ($\sin\theta = \frac{\lambda}{d}$)? (Degrees, 1 decimal place.)`,
              unit: '°',
              answer: (Math.asin(0.3) * 180) / Math.PI,
              tol: 0.1,
              explain: r`$\frac{\lambda}{d} = \frac{500 \times 10^{-9}}{1.667 \times 10^{-6}} = 0.3$, so $\theta \approx 17.5°$. Red light (700 nm) would appear at $24.8°$: the grating spreads colours apart.`,
            },
            {
              type: 'mcq',
              title: 'Fingerprints of elements',
              prompt: r`In 1868, astronomers observing the Sun through spectrometers found a yellow spectral line that matched no known element. What did it turn out to be?`,
              choices: [
                { t: 'A new element, named helium after the Greek for Sun, found on Earth only in 1895', ok: true },
                { t: 'A mistake caused by a dirty grating', why: 'It was real: a new element. Each element emits light at its own set of wavelengths.' },
                { t: 'Sodium, seen at an unusual angle', why: 'Its wavelength was close to sodium’s lines but distinct. It belonged to a new element.' },
              ],
              explain: r`Every element emits and absorbs light at a unique set of wavelengths. Gratings measure them precisely, so spectra reveal what stars are made of. Helium was identified in sunlight by Jules Janssen and Norman Lockyer, decades before William Ramsay isolated it on Earth.`,
            },
          ],
          recap: [
            r`Grating equation: $d\sin\theta = m\lambda$.`,
            'Gratings split light into sharp spectra; CDs act as gratings.',
            'Spectral lines identify elements, even in distant stars.',
          ],
        },
      ],
    },
    {
      title: 'Thin Films & Interferometers',
      summary: 'Colours and precision measurement.',
      lessons: [
        {
          id: 'films',
          title: 'Soap Bubbles & Oil Slicks',
          summary: 'Colours from thin films',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Two reflections',
              body: r`Light hitting a soap film reflects from both its front and back surfaces. The back reflection travels an extra distance of $2t$ through the film (thickness $t$, refractive index $n$). The two reflections interfere.

There's one more twist: light reflecting off a **denser** medium (such as from air onto soap) is flipped upside down, a half-wavelength shift. Light reflecting off a less dense medium isn't. So for a soap film in air, only the front reflection is flipped.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Thickness and colour',
              body: r`The curve shows how strongly a soap film reflects each wavelength. Change its thickness.`,
              widget: {
                kind: 'graph', xmin: 380, xmax: 720, ymin: -0.42, ymax: 1.1, grid: false, height: 280,
                axes: { xlabel: 'wavelength (nm)', ylabel: 'reflection', xticks: 50, yfmt: () => '', xAt: 380, xlabelBelow: 'edge' },
                params: { t: { min: 0, max: 700, step: 10, value: 300, label: 'film thickness', color: 'violet', format: (v) => `${v} nm` } },
                curves: [{ f: (lam, p) => soapR(lam, p.t), color: 'ink', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let lam = 380; lam < 720; lam += 4) {
                    els.push(s('rect', { x: plot.X(lam), y: plot.Y(-0.2), width: plot.X(lam + 4) - plot.X(lam) + 0.5, height: plot.Y(-0.38) - plot.Y(-0.2), fill: `hsl(${hue(Math.min(700, Math.max(400, lam)))}, 90%, 50%)`, opacity: (0.15 + 0.85 * soapR(lam, p.t)).toFixed(3) }));
                  }
                  return els;
                },
                readout: (p) => {
                  if (p.t < 40) return 'Almost no reflection at any colour: the film looks **black**.';
                  let best = 400, bv = -1;
                  for (let lam = 400; lam <= 700; lam += 2) if (soapR(lam, p.t) > bv) (bv = soapR(lam, p.t)), (best = lam);
                  return `strongest reflection near **${best} nm** (${colourName(best)})`;
                },
              },
              after: r`Different thicknesses favour different colours, so a bubble whose thickness varies from place to place swirls with colour. As the film drains and thins to almost nothing, every colour cancels, because the front reflection is flipped and the back one isn't. A black patch on a bubble means it's about to pop.`,
            },
            {
              type: 'numeric',
              title: 'Anti-reflection coating',
              prompt: r`Camera lenses are coated with a thin layer of magnesium fluoride ($n = 1.38$) on glass ($n = 1.5$). Both reflections are flipped (each goes to a denser medium), so they cancel when the extra path $2nt$ equals half a wavelength. What's the thinnest coating that cancels reflections of 550 nm (green) light?`,
              unit: 'nm',
              answer: 550 / (4 * 1.38),
              tol: 1.5,
              wrong: [{ v: 550 / 4, tol: 1.5, why: r`Inside the coating, the wavelength is shorter by a factor $n$: $t = \frac{\lambda}{4n}$.` }, { v: 550 / (2 * 1.38), tol: 1.5, why: r`Extra path $2nt = \frac{\lambda}{2}$ gives $t = \frac{\lambda}{4n}$, not $\frac{\lambda}{2n}$.` }],
              explain: r`$t = \frac{\lambda}{4n} = \frac{550}{4 \times 1.38} \approx 100$ nm, a "quarter-wave" coating. It cancels green best, while some red and violet are still reflected, which is why coated lenses often look purple.`,
            },
            {
              type: 'numeric',
              title: 'The thinnest bright film',
              prompt: r`A soap film (refractive index 1.33) looks bright for 600 nm light when the extra path $2nt$ equals half a wavelength (because of the phase flip at the front surface). What is the thinnest such film, in nm? (Nearest nm.)`,
              unit: 'nm',
              answer: 600 / (4 * 1.33),
              tol: 1,
              wrong: [{ v: 150, why: r`Inside the film the wavelength is shorter by $n = 1.33$.` }],
              explain: r`$t = \frac{\lambda}{4n} = \frac{600}{5.32} \approx 113$ nm: about a thousandth of a hair’s width. As a soap bubble thins, its colours change, and just before it bursts it turns black, too thin to reflect any colour.`,
            },
            {
              type: 'mcq',
              title: 'Black before it bursts',
              prompt: r`Just before a soap film bursts, its top turns black: it reflects almost no light. Why?`,
              choices: [
                { t: r`It has become much thinner than a wavelength, and one reflection is flipped by half a wave, so the two cancel`, ok: true },
                { t: r`It has evaporated completely`, why: r`It still exists (it hasn’t burst yet); it is just too thin to reflect.` },
                { t: r`Black soap collects at the top`, why: r`There is no black pigment; it’s destructive interference.` },
              ],
              explain: r`Light reflecting off the front surface (air → soap) is inverted; off the back (soap → air) it isn’t. When the film is far thinner than the wavelength, the path difference is negligible, so the inversion alone makes the reflections cancel for every colour.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Blue without pigment',
              prompt: r`The brilliant blue of a morpho butterfly's wings contains no blue pigment. Where does the colour come from?`,
              choices: [
                { t: 'Layered nanostructures on the wing scales, spaced so reflections of blue light interfere constructively', ok: true },
                { t: 'A blue dye that fades in sunlight', why: 'Ground-up morpho wings aren’t blue: the colour is structural.' },
                { t: 'Scattering, like the sky', why: 'Sky scattering gives a pale blue; morpho wings shimmer and change with angle, the hallmark of interference.' },
              ],
              explain: r`Stacks of thin layers, about a quarter-wavelength apart, act like many soap films at once. Such **structural colour** shifts with viewing angle and never fades. Peacock feathers, beetle shells and some banknote security features work the same way.`,
            },
          ],
          recap: [
            'Reflections from the two surfaces of a thin film interfere.',
            'Reflection from a denser medium adds a half-wavelength flip.',
            r`A quarter-wave coating ($t = \lambda/4n$) cancels reflections.`,
          ],
        },
        {
          id: 'interferometers',
          title: 'Interferometers',
          summary: 'Measuring with light',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Michelson’s ruler',
              body: r`In a **Michelson interferometer** (1880s), a beam splitter sends light along two perpendicular arms. Mirrors at the ends send the beams back, and they recombine. If one mirror moves by $\frac{\lambda}{2}$, that beam's round trip grows by a full wavelength, and the pattern shifts by one fringe.

By counting fringes, you can measure distances in fractions of a wavelength. Michelson and Morley used one in 1887 to look for the Earth's motion through a supposed "ether", and found nothing: a key clue for Einstein's relativity.`,
            },
            {
              type: 'numeric',
              title: 'Counting fringes',
              prompt: r`A Michelson interferometer uses a 633 nm laser. One mirror moves 0.1 mm. How many fringes pass by? (Nearest whole number.)`,
              unit: 'fringes',
              answer: Math.round((2 * 0.1e-3) / 633e-9),
              tol: 1,
              wrong: [{ v: Math.round(0.1e-3 / 633e-9), tol: 1, why: 'The light travels to the mirror and back, so the path changes by twice the mirror’s movement.' }],
              explain: r`Path change $= 2 \times 0.1$ mm $= 2 \times 10^{-4}$ m. Dividing by $633 \times 10^{-9}$ m gives about **316 fringes**. Count them, and you've measured 0.1 mm to within a fraction of a micrometre.`,
            },
            {
              type: 'mcq',
              title: 'A null result',
              prompt: r`Michelson and Morley expected the fringes to shift as their apparatus rotated, if light travelled through an "ether" while Earth moved through it at 30 km/s. They saw almost no shift. What did this eventually support?`,
              choices: [
                { t: 'Einstein’s postulate that light’s speed is the same for every observer, with no ether needed', ok: true },
                { t: 'That the Earth doesn’t move', why: 'Earth’s orbital motion is well established; the problem was with the ether idea.' },
                { t: 'That the experiment was broken', why: 'It was repeated many times with ever-better precision; the null result holds.' },
              ],
              explain: r`The "most famous failed experiment" helped overturn the idea of absolute rest. Einstein's 1905 special relativity built on a constant speed of light.`,
            },
            {
              type: 'numeric',
              title: 'Hearing spacetime ripple',
              prompt: r`LIGO is a Michelson interferometer with 4 km arms. A passing gravitational wave stretches one arm and squeezes the other by a fraction (the **strain**) of about $10^{-21}$. By how much does a 4 km arm change length? Give the answer in units of $10^{-18}$ m.`,
              unit: r`$\times 10^{-18}$ m`,
              answer: 4,
              tol: 0.05,
              wrong: [{ v: 4000, why: r`$4000 \text{ m} \times 10^{-21} = 4 \times 10^{-18}$ m. So in units of $10^{-18}$ m, that's 4.` }, { v: 0.004, why: 'Check the powers of ten: 4 × 10³ × 10⁻²¹ = 4 × 10⁻¹⁸.' }],
              explain: r`$4000 \times 10^{-21} = 4 \times 10^{-18}$ m: about $\frac{1}{400}$ of the width of a proton. LIGO detects this with laser light bouncing back and forth hundreds of times in each arm, plus extraordinary isolation from vibration. On 14 September 2015 it recorded the first gravitational waves, from two black holes merging 1.3 billion light-years away, earning a Nobel Prize in 2017.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Moving the mirror',
              body: r`In a Michelson interferometer, moving one mirror by $d$ lengthens that light path by $2d$. Each extra wavelength of path makes the fringe pattern shift by one whole fringe. Move the mirror (red laser, 633 nm) and count the fringes sliding past the marker.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3, grid: false, axes: false, maxWidth: 520, height: 200,
                params: { d: { min: 0, max: 2, step: 0.005, value: 0, label: 'mirror moved', color: 'coral', format: (v) => `${v.toFixed(3)} µm` } },
                extra: ({ plot, p, s }) => { const out = [], ph = (2 * 2 * Math.PI * p.d) / 0.633; for (let i = 0; i < 200; i++) { const x = i * 0.05, I = Math.cos((2 * Math.PI * x) / 2.5 - ph / 1) ** 2; out.push(s('rect', { x: plot.X(x), y: plot.Y(2.6), width: plot.X(0.051) - plot.X(0), height: plot.Y(0.6) - plot.Y(2.6), fill: 'var(--coral)', opacity: (0.08 + 0.92 * I).toFixed(2) })); } out.push(s('line', { x1: plot.X(5), x2: plot.X(5), y1: plot.Y(2.85), y2: plot.Y(0.35), stroke: 'var(--ink)', 'stroke-width': 2 })); return out; },
                readout: (p) => `extra path ${(2 * p.d).toFixed(3)} µm = **${((2 * p.d) / 0.633).toFixed(2)} wavelengths** · fringes passed: **${Math.floor((2 * p.d) / 0.633 + 1e-9)}**`,
              },
              after: r`Moving the mirror by just 0.316 µm (half a wavelength) shifts the pattern by one full fringe. Counting fringes turns a laser into a ruler that measures in fractions of a micrometre; LIGO reads fringe changes corresponding to arm-length changes far smaller than a proton.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A tenth of a millimetre',
              prompt: r`In a Michelson interferometer with 500 nm light, one mirror moves 0.1 mm. Each fringe corresponds to a mirror movement of half a wavelength. How many fringes pass?`,
              unit: 'fringes',
              answer: 2 * 0.1e-3 / 500e-9,
              tol: 1,
              wrong: [{ v: 200, why: r`The light travels to the mirror and back, so the path changes by twice the movement.` }],
              explain: r`$\frac{2 \times 10^{-4}}{5 \times 10^{-7}} = 400$ fringes. In 1892 Michelson used this to measure the length of the standard metre in wavelengths of cadmium light, linking length to atoms for the first time.`,
            },
          ],
          recap: [
            'An interferometer splits a beam, sends it along two paths, and recombines it.',
            r`Moving a mirror by $\lambda/2$ shifts the pattern by one fringe.`,
            'LIGO measures length changes of about 1/400 of a proton’s width.',
          ],
        },
      ],
    },
    {
      title: 'Spreading and Scattering',
      summary: 'Diffraction from a single slit and from crystals.',
      lessons: [
        {
          id: 'singleslit',
          title: 'Single-Slit Diffraction',
          summary: 'Narrower openings spread light wider',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Waves spread',
              body: r`Shine light through a single narrow slit of width $a$, and it doesn't make a sharp line: it spreads into a bright central band with fainter bands either side. Waves from different parts of the slit interfere, and the first dark fringes appear at
$$\sin\theta = \frac{\lambda}{a}$$
The **narrower** the slit, the **wider** the spread: squeezing a wave makes it fan out.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Size the central spot',
              prompt: r`Red laser light (650 nm) passes through a slit onto a screen 2 m away. Adjust the slit width until the central bright band extends **5 mm** either side of the centre.`,
              widget: {
                kind: 'graph', xmin: -20, xmax: 20, ymin: 0, ymax: 1.1, grid: 5, gridY: 0.25, height: 260, axes: { xlabel: 'position on screen (mm)', ylabel: 'brightness', yfmt: () => '', xAt: -20 },
                params: { a: { min: 50, max: 600, step: 10, value: 400, label: 'slit width', color: 'violet', format: (v) => `${v} µm` } },
                curves: [{ f: (y, p) => sinc((Math.PI * y) / halfWidth(p.a)) ** 2, color: 'coral', width: 3, n: 600 }],
                extra: ({ plot, s }) => [-5, 5].map((x) => s('line', { x1: plot.X(x), x2: plot.X(x), y1: plot.Y(0), y2: plot.Y(1.05), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' })),
                readout: (p) => r`slit $${p.a}\ \mu$m: first dark fringe at $\pm${halfWidth(p.a).toFixed(1)}$ mm`,
                goal: (p) => Math.abs(halfWidth(p.a) - 5) < 0.1,
                hint: r`The first dark fringe is at $y = \frac{\lambda L}{a}$; you need it at 5 mm.`,
                solution: { a: 260 },
              },
              explain: r`$a = \frac{\lambda L}{y} = \frac{650 \times 10^{-9} \times 2}{0.005} = 260\ \mu$m. Make the slit narrower and the central band grows: try 100 µm and it's 13 mm each side.`,
            },
            {
              type: 'mcq',
              title: 'Sound round corners',
              prompt: r`You can hear someone talking in the next room through an open door, even though you can't see them. Why does sound bend round the door much more than light?`,
              choices: [
                { t: 'Sound wavelengths (about 1 m) are similar to the door’s width, so sound diffracts strongly; light’s wavelength is a million times smaller', ok: true },
                { t: 'Sound is louder than light', why: 'Loudness doesn’t control bending; wavelength compared with the opening does.' },
                { t: 'Light can’t diffract', why: 'Light diffracts too, but only noticeably through openings near its tiny wavelength.' },
              ],
              explain: r`Diffraction matters when the opening is comparable to the wavelength. A 1 m doorway barely bends 0.5 µm light, but spreads 1 m sound waves in all directions.`,
            },
            {
              type: 'mcq',
              title: 'Narrower slit',
              prompt: r`Light passes through a slit and spreads into a central bright band. What happens to the band if the slit is made **narrower**?`,
              choices: [
                { t: r`It gets wider`, ok: true },
                { t: r`It gets narrower`, why: r`Diffraction works backwards to intuition: squeezing the wave makes it spread more ($\sin\theta = \lambda/a$).` },
                { t: r`It stays the same`, why: r`The spreading angle depends on $\lambda/a$, so it changes with the slit width.` },
              ],
              explain: r`The first dark fringe is at $\sin\theta = \frac{\lambda}{a}$: halve the slit width $a$ and the spread doubles. It’s the same reason big dishes and telescopes see sharper detail: wide apertures diffract less.`,
            },
            {
              type: 'numeric',
              title: 'The central spot',
              prompt: r`Light of wavelength 600 nm passes through a slit 0.1 mm wide. The first dark fringes are at $\sin\theta = \pm\frac{\lambda}{a}$. On a screen 2 m away, how wide is the bright central band, in millimetres?`,
              unit: 'mm',
              answer: 2 * 2 * 600e-9 / 0.1e-3 * 1000,
              tol: 0.1,
              explain: r`$\frac{\lambda}{a} = 0.006$ rad, so each dark fringe is $2 \times 0.006 = 12$ mm from the centre, and the central band is **24 mm** wide, 240 times wider than the slit.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The pupil’s limit',
              prompt: r`Light entering your eye through a 3 mm pupil diffracts. For 550 nm light, what is $\frac{\lambda}{a}$, the angle (in radians) to the first dark ring? Give it in units of $10^{-4}$ rad. (2 decimal places.)`,
              unit: r`$\times 10^{-4}$ rad`,
              answer: (550e-9 / 3e-3) / 1e-4,
              tol: 0.01,
              wrong: [{ v: 550 / 3, tol: 1, why: 'Convert both lengths to metres first.' }],
              explain: r`$\frac{550 \times 10^{-9}}{3 \times 10^{-3}} \approx 1.83 \times 10^{-4}$ rad (for a circular opening, multiply by 1.22). This diffraction blur limits how fine a detail your eye could resolve, even if its lens were perfect: about the width of a coin 100 m away.`,
            },
          ],
          recap: [
            r`Single slit: first dark fringe at $\sin\theta = \lambda/a$.`,
            'Narrower openings spread waves wider.',
            'Diffraction matters when openings are comparable to the wavelength.',
          ],
        },
        {
          id: 'xray',
          title: 'X-Ray Crystallography',
          summary: 'Seeing atoms with interference',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Crystals as gratings',
              body: r`Atoms in a crystal form regular layers a few tenths of a nanometre apart, which is about the wavelength of X-rays. X-rays reflecting off successive layers interfere. In 1913, William Henry Bragg and his son Lawrence showed that strong reflections occur only when
$$2d\sin\theta = n\lambda$$
where $d$ is the layer spacing and $\theta$ the angle between the rays and the layers. Measuring these angles reveals the spacing, and with many reflections, the whole arrangement of atoms.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the reflection',
              prompt: r`Copper X-rays (0.154 nm) strike a salt crystal whose layers are 0.282 nm apart. Rotate the crystal to find the angle of the first-order reflection ($n = 1$).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 45, ymin: 0, ymax: 1.1, grid: 5, gridY: 0.25, height: 250, axes: { xlabel: 'angle θ (°)', ylabel: 'reflected intensity', yfmt: () => '' },
                params: { th: { min: 2, max: 45, step: 0.05, value: 30, slider: false } },
                curves: [{ f: (t) => Math.exp(-(((braggOrder(t) - Math.round(braggOrder(t))) / 0.03) ** 2)) * (Math.round(braggOrder(t)) >= 1 ? 1 : 0), color: 'violet', width: 2.5, n: 1200 }],
                points: [{ x: (p) => p.th, y: () => 0.05, drag: { x: 'th' }, color: 'coral', r: 8 }],
                readout: (p) => r`$\theta = ${p.th.toFixed(2)}°$: path difference $2d\sin\theta = ${braggOrder(p.th).toFixed(3)}\lambda$`,
                goal: (p) => Math.abs(braggOrder(p.th) - 1) < 0.01,
                hint: r`Solve $\sin\theta = \frac{0.154}{2 \times 0.282}$.`,
                solution: { th: 15.85 },
              },
              explain: r`$\sin\theta = \frac{0.154}{0.564} = 0.273$, so $\theta \approx 15.8°$. The second peak, near 33°, is the second-order reflection ($n = 2$). The Braggs measured exactly such angles to work out the structure of salt, the first crystal structure ever determined, and shared the 1915 Nobel Prize.`,
            },
            {
              type: 'numeric',
              title: 'Measure a spacing',
              prompt: r`X-rays of wavelength 0.154 nm give a first-order reflection from a crystal at $\theta = 20°$. What's the layer spacing, in nm? (3 decimal places.)`,
              unit: 'nm',
              answer: 0.154 / (2 * Math.sin((20 * Math.PI) / 180)),
              tol: 0.001,
              wrong: [{ v: 0.154 / Math.sin((20 * Math.PI) / 180), tol: 0.002, why: 'Include the factor 2: the extra path is there and back.' }],
              explain: r`$d = \frac{\lambda}{2\sin\theta} = \frac{0.154}{2 \times 0.342} \approx 0.225$ nm. Crystallography measures atomic distances to about a thousandth of a nanometre.`,
            },
            {
              type: 'mcq',
              title: 'Photo 51',
              prompt: r`In 1952, Rosalind Franklin and her student Raymond Gosling recorded an X-ray diffraction pattern of DNA, "Photo 51", showing a distinctive X shape. What did it reveal?`,
              choices: [
                { t: 'That DNA is a helix, with regular spacings that helped Watson and Crick build their double-helix model', ok: true },
                { t: 'The sequence of genes', why: 'Diffraction shows shape and spacing, not the order of the bases.' },
                { t: 'That DNA is a flat sheet', why: 'The X-shaped pattern is the signature of a helix.' },
              ],
              explain: r`The X pattern indicates a helix, and the spacing of the spots gave its dimensions. Seen (without Franklin's knowledge) by James Watson, it was crucial evidence for the double helix in 1953. Crystallography has since revealed the structures of thousands of proteins, viruses and drugs.`,
            },
            {
              type: 'numeric',
              title: 'Harder X-rays',
              prompt: r`Molybdenum X-ray tubes give a shorter wavelength, $\lambda = 0.071$ nm. For the same salt crystal (layers 0.282 nm apart), at what glancing angle is the first-order Bragg reflection? (Degrees, 1 decimal place.)`,
              unit: '°',
              answer: (Math.asin(0.071 / (2 * 0.282)) * 180) / Math.PI,
              tol: 0.1,
              wrong: [{ v: (Math.asin(0.071 / 0.282) * 180) / Math.PI, tol: 0.1, why: r`Bragg's law has a factor of 2: $\sin\theta = \frac{\lambda}{2d}$.` }],
              explain: r`$\sin\theta = \frac{0.071}{0.564} \approx 0.126$, so $\theta \approx 7.2°$: shorter wavelengths reflect at shallower angles. Crystallographers choose the X-ray source to spread the reflections conveniently.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Why X-rays?',
              prompt: r`Bragg reflection needs $\lambda \le 2d$. For atomic layers 0.3 nm apart, what's the **longest** wavelength that can give any reflection, in nm?`,
              unit: 'nm',
              answer: 0.6,
              wrong: [{ v: 0.3, why: r`Reflection is possible up to $\lambda = 2d$, since $\sin\theta$ can reach 1.` }],
              explain: r`$\lambda_{\max} = 2d = 0.6$ nm, in the X-ray range. Visible light, at 400–700 nm, is about a thousand times too long, which is why you can't see atoms with an ordinary microscope.`,
            },
          ],
          recap: [
            r`Bragg's law: $2d\sin\theta = n\lambda$.`,
            'X-rays have wavelengths similar to atomic spacings, so crystals diffract them.',
            'Crystallography revealed salt, DNA and thousands of molecular structures.',
          ],
        },
        {
          id: 'newton-rings',
          title: 'Newton’s Rings',
          summary: 'Measuring with a lens and a sheet of glass',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A wedge of air',
              body: r`Rest a gently curved lens on a flat sheet of glass. Between them is a thin film of air, zero thickness at the contact point and growing outwards. Light reflected from the top and bottom of this air film interferes, giving a pattern of bright and dark **rings**, first studied in detail by Isaac Newton.

For a lens surface of radius of curvature $R$, the air gap at distance $r$ from the centre is about $t = \frac{r^2}{2R}$. The $m$-th dark ring appears where the round-trip path $2t$ equals $m\lambda$, so
$$r_m = \sqrt{m\lambda R}.$$`,
            },
            {
              type: 'mcq',
              title: 'Dark in the middle',
              prompt: r`At the contact point the air gap is zero, so the two reflections travel the same distance. Yet the centre of the pattern is **dark**. Why?`,
              choices: [
                { t: 'Reflection off the denser glass below flips one wave by half a wavelength, so they cancel', ok: true },
                { t: 'No light reaches the centre', why: 'Plenty of light reaches it; the reflections there cancel.' },
                { t: 'The lens absorbs light where it touches', why: 'Absorption isn’t the cause. It’s the half-wave phase flip on reflection from the denser medium.' },
              ],
              explain: r`A wave reflecting off a denser medium (air → glass) is inverted, a shift of half a wavelength; reflecting off a less dense one (glass → air) isn’t. So at zero gap the two reflections are exactly out of step and cancel, which is why the dark rings sit at $2t = m\lambda$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Measure the curvature',
              prompt: r`In yellow sodium light ($\lambda = 589$ nm), the 10th dark ring has a radius of 2.43 mm. Adjust the lens’s radius of curvature $R$ until the pattern matches.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -4, ymax: 4, grid: false, axes: false, maxWidth: 360, pad: 6,
                params: { R: { min: 0.2, max: 3, step: 0.01, value: 2, label: 'radius of curvature R', color: 'amber', format: (v) => `${v.toFixed(2)} m` } },
                extra: ({ plot, p, s }) => { const out = [], lam = 589e-9; const w = plot.X(0.03) - plot.X(0); for (let r = 0.015; r < 4; r += 0.03) { const I = Math.sin((Math.PI * (r / 1000) ** 2) / (lam * p.R)) ** 2; out.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(r) - plot.X(0), fill: 'none', stroke: `rgb(${Math.round(35 + 210 * I)}, ${Math.round(25 + 160 * I)}, ${Math.round(10 + 30 * I)})`, 'stroke-width': w + 0.3 })); } out.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(2.43) - plot.X(0), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 4' })); return out; },
                readout: (p) => `10th dark ring at **${(Math.sqrt(10 * 589e-9 * p.R) * 1000).toFixed(2)} mm** (dashed circle: 2.43 mm, measured)`,
                goal: (p) => Math.abs(Math.sqrt(10 * 589e-9 * p.R) * 1000 - 2.43) < 0.01,
                hint: r`$R = \frac{r_{10}^2}{10\lambda}$.`,
                solution: { R: 1 },
              },
              explain: r`$R = \frac{(2.43 \times 10^{-3})^2}{10 \times 589 \times 10^{-9}} \approx 1.0$ m. Opticians still use this kind of interference test to check lens surfaces: any bump or dip of a fraction of a wavelength distorts the rings.`,
            },
            {
              type: 'numeric',
              title: 'Rings crowd together',
              prompt: r`Since $r_m = \sqrt{m\lambda R}$, how many times bigger is the radius of the 16th dark ring than that of the 4th?`,
              answer: 2,
              explain: r`$\sqrt{16/4} = 2$. The rings get closer together as you go outwards, because the air gap grows ever faster with $r$.`,
            },
            {
              type: 'mcq',
              title: 'Blue light',
              prompt: r`What happens to the rings if the yellow light is replaced by blue light (shorter wavelength)?`,
              choices: [
                { t: 'They shrink and become more tightly packed', ok: true },
                { t: 'They grow larger', why: r`$r_m = \sqrt{m\lambda R}$: a shorter $\lambda$ gives smaller rings.` },
                { t: 'Nothing changes', why: 'The ring radii depend directly on the wavelength.' },
              ],
              explain: r`Smaller $\lambda$, smaller rings. In white light every colour makes rings of a different size, and they overlap into rainbow-coloured fringes that wash out after the first few.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Find the wavelength',
              prompt: r`With a lens of $R = 2.0$ m, the 5th dark ring has radius 2.43 mm. What is the wavelength of the light, in nanometres?`,
              unit: 'nm',
              answer: (2.43e-3 ** 2 / (5 * 2.0)) * 1e9,
              tol: 2,
              explain: r`$\lambda = \frac{r_5^2}{5R} = \frac{(2.43 \times 10^{-3})^2}{10} \approx 590$ nm: the sodium yellow again. Newton’s rings let you measure a wavelength with nothing more than a ruler and a lens of known curvature.`,
            },
          ],
          recap: [
            'A curved lens on flat glass traps a thin wedge of air.',
            r`Dark rings at $r_m = \sqrt{m\lambda R}$; the centre is dark due to the half-wave flip.`,
            'The rings measure lens curvature or the wavelength of light.',
          ],
        },
      ],
    },
  ],
};
