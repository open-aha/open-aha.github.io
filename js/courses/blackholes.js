import { fix, sig as sigFigs } from '../lib/svg.js';

const r = String.raw;
const RS_SUN = 2.95; // km
// two significant figures, never stripped (1.0, 2.5, 16, 1,200): these span many powers of ten
const sig = (n) => sigFigs(n, 2, true);
const fmtLen = (km) => (km < 1e-3 ? `${sig(km * 1e6)} mm` : km < 1 ? `${sig(km * 1000)} m` : km < 1e6 ? `${sig(km)} km` : km < 1e9 ? `${sig(km / 1e6)} million km` : `${sig(km / 1.496e8)} AU`);
const fmtMass = (lg) => (lg < -2 ? `${sig(10 ** (lg + 6))} millionths of a Sun` : lg < 6 ? `${sig(10 ** lg)} Sun${sig(10 ** lg) === '1.0' ? '' : 's'}` : `${sig(10 ** (lg - 6))} million Suns`);
const EXAMPLES = [[-5.52, 'Earth', 'Earth'], [0, 'the Sun', 'Sun'], [1, 'a typical stellar black hole', 'stellar black hole'], [6.63, 'Sagittarius A*, at the centre of our galaxy', 'Sgr A*'], [9.81, 'M87*, the first black hole ever imaged', 'M87*']];

const G = 6.674e-11, C = 2.998e8, MSUN = 1.989e30;
// tidal stretch (m/s²) across a 2 m body at the event horizon of a black hole of mass M (kg)
const tidalAtHorizon = (M) => C ** 6 / (2 * G * G * M * M);
// Hawking temperature (K) and rough evaporation time (years) for mass M (kg)
const hawkingT = (M) => (6.17e-8 * MSUN) / M;
const hawkingLife = (M) => 2.1e67 * (M / MSUN) ** 3;
// Schwarzschild effective potential for a massive particle, r in units of GM/c², L in units of GM/c
const Veff = (r, L) => (1 - 2 / r) * (1 + (L * L) / (r * r));
const circR = (L) => { const d = L ** 4 - 12 * L * L; return d < 0 ? null : [(L * L - Math.sqrt(d)) / 2, (L * L + Math.sqrt(d)) / 2]; };
// point-mass lens: image positions and magnifications for a source at offset u (Einstein radii)
const lensImages = (u) => { const q = Math.sqrt(u * u + 4), mu = u > 1e-6 ? (u * u + 2) / (2 * u * q) : Infinity; return [[(u + q) / 2, mu + 0.5], [(u - q) / 2, mu - 0.5]]; };
// inspiral: gravitational-wave frequency τ seconds before merger, for chirp mass Mc (in Suns)
const chirpF = (tau, Mc) => (Math.pow(5 / tau, 3 / 8) * Math.pow(Mc * 4.925e-6, -5 / 8)) / (8 * Math.PI);
const chirpPhase = (tau, Mc) => -2 * Math.pow(tau / (5 * Mc * 4.925e-6), 5 / 8);
const sup = (n) => String(n).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const sci = (x) => { const e = Math.floor(Math.log10(x)), m = x / 10 ** e; return `${m.toFixed(1)} × 10^{${e}}`; };

export default {
  id: 'blackholes',
  subject: 'physics',
  title: 'General Relativity & Black Holes',
  level: 'Advanced',
  cover: 'blackholes',
  tagline: 'Gravity as curved spacetime: GPS, bending light, black holes, their orbits and their glow.',
  description: r`Einstein's general relativity says gravity isn't a force at all: it's the curvature of space and time. Discover why clocks tick faster on mountains, why GPS needs relativity, how light bends around the Sun, what makes a black hole, how we hear spacetime ripple, why nothing can orbit too close to a black hole, and how black holes slowly evaporate.`,
  prereq: 'Special Relativity',
  chapters: [
    {
      title: 'Gravity Is Geometry',
      summary: 'From elevators to curved spacetime.',
      lessons: [
        {
          id: 'equivalence',
          title: 'The Equivalence Principle',
          summary: 'Einstein’s happiest thought',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'A windowless room',
              body: r`In 1907, Einstein had what he called "the happiest thought of my life": a person falling freely doesn't feel their own weight.

Imagine you're in a windowless room. If you feel pressed to the floor, you can't tell whether the room is **resting on Earth** or **accelerating upward** at $9.8$ m/s² in deep space: every experiment gives the same result. This is the **equivalence principle**: gravity and acceleration are locally indistinguishable.`,
            },
            {
              type: 'mcq',
              title: 'Light in a rocket',
              prompt: r`A rocket accelerates upward. A beam of light enters through a window on one side and crosses to the far wall. As seen by someone inside, what path does the light take?`,
              choices: [
                { t: 'It curves downward, because the floor accelerates up toward it while it crosses', ok: true },
                { t: 'A perfectly straight horizontal line', why: 'While the light crosses, the rocket speeds up, so inside the rocket the light hits lower than where it entered, along a curve.' },
                { t: 'It curves upward', why: 'The rocket rises under the beam, so the beam appears to fall, not rise.' },
              ],
              explain: r`Inside the accelerating rocket, the light bends down. By the equivalence principle, **gravity must bend light too**. Einstein predicted that starlight passing the Sun should bend, and the 1919 solar eclipse expeditions led by Arthur Eddington measured it, making Einstein world-famous overnight.`,
            },
            {
              type: 'mcq',
              title: 'Weightless astronauts',
              prompt: r`Gravity at the height of the International Space Station is about 90% as strong as on Earth's surface. Why do astronauts float?`,
              choices: [
                { t: 'They and the station are falling freely together around the Earth', ok: true },
                { t: 'There is no gravity in space', why: 'At 400 km up, gravity is still about 90% as strong. It’s what keeps the station in orbit.' },
                { t: 'The station shields them from gravity', why: 'Nothing can shield gravity. They float because everything falls together.' },
              ],
              explain: r`The station is in **free fall**: it falls toward Earth constantly but moves sideways fast enough to keep missing it. Everything inside falls at the same rate, so nothing presses on anything, and astronauts feel weightless. By the equivalence principle, a freely falling frame is locally just like empty space with no gravity.`,
            },
            {
              type: 'numeric',
              title: 'Light climbing a tower',
              prompt: r`By the equivalence principle, light climbing a height $h$ loses a fraction $gh/c^2$ of its frequency. In 1959, Pound and Rebka sent gamma rays up a 22.5 m tower at Harvard. What fractional shift did they need to detect? (Give the answer in units of $10^{-15}$; $g = 9.8$ m/s², $c = 3 \times 10^8$ m/s.)`,
              unit: r`$\times 10^{-15}$`,
              answer: (9.8 * 22.5) / 9e16 / 1e-15,
              tol: 0.03,
              wrong: [{ v: (9.8 * 22.5) / 3e8 / 1e-15, relTol: 0.01, why: r`Divide by $c^2$, not $c$.` }],
              explain: r`$\frac{9.8 \times 22.5}{9 \times 10^{16}} \approx 2.5 \times 10^{-15}$. They measured it to within 10%, the first laboratory test of gravity's effect on light (and so on time). Today's best atomic clocks see the effect over a height of a single centimetre.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Light in an accelerating room',
              body: r`A beam crosses a 3 m room that is accelerating upward. Seen from inside, the floor rises while the light is in flight, so the beam appears to curve **down**, exactly as gravity would bend it. Real light is so fast that the bend is tiny, so here you can pretend it is slower.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3, ymin: -1.6, ymax: 0.2, grid: false, axes: { xlabel: 'across the room (m)', ylabel: 'drop (m)', xticks: 0.5, yticks: 0.5 }, height: 260,
                params: { v: { min: 2, max: 30, step: 0.5, value: 6, label: 'pretend light speed', color: 'amber', format: (v) => `${fix(v, 1)} m/s` }, a: { min: 0, max: 20, step: 0.5, value: 9.8, label: 'acceleration', color: 'blue', format: (v) => `${fix(v, 1)} m/s²` } },
                curves: [{ f: (x, p) => -0.5 * p.a * (x / p.v) ** 2, color: 'amber', width: 3 }, { f: () => 0, color: 'muted', dash: true }],
                readout: (p) => `drop across the room **${(0.5 * p.a * (3 / p.v) ** 2).toFixed(3)} m** · for real light at this acceleration: ${(0.5 * p.a * (3 / 3e8) ** 2).toExponential(1)} m`,
              },
              after: r`Inside a closed room, nothing can distinguish acceleration from gravity, so light must fall in a gravitational field too. For real light crossing 3 m in Earth’s gravity the drop is about $5 \times 10^{-16}$ m, a millionth of an atom. Near the Sun, over much larger distances, the bending is big enough to measure, as Eddington did in 1919.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Where the principle breaks down',
              prompt: r`The equivalence principle says gravity is indistinguishable from acceleration **locally**. In a very tall falling room near Earth, how could you still detect gravity?`,
              choices: [
                { t: 'Objects at the top and bottom drift apart, and objects at the two sides drift together, because gravity varies with position', ok: true },
                { t: 'You couldn’t, however big the room is', why: 'In a big enough room, gravity’s differences from place to place become measurable.' },
                { t: 'Everything would fall faster', why: 'Everything falls together. What gives gravity away is the small differences across the room.' },
              ],
              explain: r`The bottom of the room is closer to Earth and pulled harder, so things there pull ahead; things at the two sides both fall toward Earth's centre, so they converge. These **tidal effects** can't be removed by any choice of frame, and in general relativity they **are** the curvature of spacetime.`,
            },
          ],
          recap: [
            'Gravity and acceleration are locally indistinguishable: the equivalence principle.',
            'So gravity bends light, confirmed in 1919.',
            'Freely falling observers feel weightless.',
          ],
        },
        {
          id: 'time',
          title: 'Gravity and Time',
          summary: 'Why GPS needs Einstein',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Clocks run slower low down',
              body: r`General relativity predicts that clocks run **slower** deeper in a gravitational field. A clock on the floor ticks slightly slower than one on a high shelf. The effect is tiny on Earth, about one part in $10^{16}$ per metre of height, but modern atomic clocks can detect a height difference of just a few centimetres.`,
            },
            {
              type: 'numeric',
              title: 'A clock on Everest',
              prompt: r`Clocks higher up gain a fraction $gh/c^2$. How many microseconds per year would a clock on top of Mount Everest (8,848 m) gain on one at sea level? (A year is $3.16 \times 10^7$ s.)`,
              unit: 'µs',
              answer: ((9.8 * 8848) / 9e16) * 3.16e7 * 1e6,
              relTol: 0.03,
              wrong: [{ v: ((9.8 * 8848) / 9e16) * 3.16e7, relTol: 0.03, why: 'That’s in seconds. Convert to microseconds.' }],
              hint: r`$\frac{9.8 \times 8848}{9 \times 10^{16}} \approx 9.6 \times 10^{-13}$; multiply by the seconds in a year.`,
              explain: r`About **30 microseconds** a year. Climbers on Everest really do age faster than people at sea level, by about a second in 30,000 years.`,
            },
            {
              type: 'numeric',
              title: 'GPS satellites',
              prompt: r`GPS satellite clocks run **fast** by about 45 microseconds per day because of weaker gravity up there, and **slow** by about 7 microseconds per day because of their orbital speed (special relativity). What's the net effect, in microseconds per day?`,
              unit: 'µs/day',
              answer: 38,
              wrong: [{ v: 52, why: 'The two effects work in opposite directions: subtract them.' }, { v: -38, why: 'Gravity wins, so the satellite clocks run fast overall: +38.' }],
              explain: r`$45 - 7 = 38$ µs per day fast. The satellite clocks are deliberately tuned slightly slow before launch to compensate.`,
            },
            {
              type: 'numeric',
              title: 'Getting lost',
              prompt: r`GPS works out distances from signal travel times at the speed of light ($3 \times 10^8$ m/s). If the 38 µs/day error weren't corrected, roughly how far would positions drift each day, in km?`,
              unit: 'km',
              answer: 38e-6 * 3e8 / 1000,
              tol: 0.5,
              wrong: [{ v: 11400, tol: 100, why: 'That’s in metres. Convert to kilometres.' }, { v: 0.0114, tol: 0.001, why: r`Check the conversion: $38 \times 10^{-6}$ s $\times 3 \times 10^8$ m/s $= 11{,}400$ m.` }],
              explain: r`$38 \times 10^{-6}\ \text{s} \times 3 \times 10^8\ \text{m/s} \approx 11{,}400$ m, about **11 km per day**. Without general relativity, satellite navigation would be useless within hours.`,
            },
            {
              type: 'interactive',
              title: 'Near a black hole',
              body: r`Near a black hole the effect becomes enormous. A clock hovering at distance $r$ runs at $\sqrt{1 - r_s/r}$ times the rate of a distant clock. Find the radius where the hovering clock runs at **half** speed.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 6, ymin: 0, ymax: 1.05, grid: false, height: 280, axes: { xlabel: 'distance (Schwarzschild radii)', ylabel: 'clock rate', xticks: 1, yticks: 0.25, xAt: 1 },
                params: { r: { min: 1.01, max: 6, step: 0.01, value: 3, label: 'distance', color: 'coral', format: (v) => `${v.toFixed(2)} $r_s$` } },
                curves: [{ f: (x) => (x > 1 ? Math.sqrt(1 - 1 / x) : 0), color: 'violet', width: 3, n: 300 }, { f: () => 0.5, color: 'teal', dash: true }],
                points: [{ x: (p) => p.r, y: (p) => Math.sqrt(1 - 1 / p.r), color: 'coral' }],
                readout: (p) => { const k = Math.sqrt(1 - 1 / p.r); return `clock rate **${k.toFixed(3)}**: one hour there = ${(60 / k).toFixed(0)} minutes far away`; },
                goal: (p) => Math.abs(Math.sqrt(1 - 1 / p.r) - 0.5) < 0.004,
                hint: r`Solve $\sqrt{1 - r_s/r} = \frac12$.`,
                solution: { r: 1.33 },
              },
              explain: r`$1 - \frac{r_s}{r} = \frac14$ gives $r = \frac43 r_s$. Closer still, the rate drops toward zero at the horizon: to a distant observer, a clock lowered toward the horizon seems to freeze, and its light fades and reddens away.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The two effects together',
              prompt: r`The GPS clocks gain 45 µs/day from weaker gravity and lose 7 µs/day from their speed. A clock on the International Space Station, much lower and faster, gains about 3 µs/day from gravity but loses about 28 µs/day from speed. What's its net change per day? (Use a negative number for slow.)`,
              unit: 'µs/day',
              answer: -25,
              wrong: [{ v: 25, why: 'Speed wins this time: 3 − 28 is negative.' }, { v: 31, why: 'The effects oppose each other. Subtract.' }],
              explain: r`$3 - 28 = -25$ µs per day: ISS clocks run **slow**, because at low orbit the speed effect beats the gravity effect. After six months aboard, an astronaut has aged about 5 milliseconds less than people on the ground. The crossover is at an altitude of about 3,000 km; GPS satellites at 20,000 km are well above it.`,
            },
          ],
          recap: [
            'Clocks run slower deeper in gravity.',
            'GPS clocks run fast by a net 38 µs per day.',
            'Uncorrected, that would cause errors of about 11 km per day.',
          ],
        },
        {
          id: 'curvature',
          title: 'Curved Spacetime',
          summary: 'Matter tells space how to curve',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Straightest paths',
              body: r`In general relativity (1915), mass and energy **curve spacetime**, and objects with no forces on them follow the **straightest possible paths** through that curved spacetime. As the physicist John Wheeler summarised it: matter tells spacetime how to curve, and spacetime tells matter how to move.

Planets orbiting the Sun aren't being pulled by a force. They're moving as straight as they can through spacetime curved by the Sun's mass.`,
            },
            {
              type: 'numeric',
              title: 'Bending starlight',
              prompt: r`General relativity predicts that light grazing the Sun bends by an angle $\frac{4GM}{c^2R} = \frac{2r_s}{R}$ radians. With $r_s = 2.95$ km and the Sun's radius $R = 696{,}000$ km, what is the angle in arcseconds? (1 radian = 206,265 arcseconds; 2 decimal places.)`,
              unit: '″',
              answer: ((2 * 2.953) / 696000) * 206265,
              tol: 0.02,
              wrong: [{ v: ((2.953) / 696000) * 206265, tol: 0.02, why: 'That’s half the answer, the value Newtonian reasoning gives. Use 2r_s/R.' }],
              explain: r`$\frac{2 \times 2.95}{696{,}000} \approx 8.5 \times 10^{-6}$ rad $\approx 1.75''$. Newton's theory, treating light as particles, predicts half that. Eddington's 1919 eclipse photographs favoured Einstein's value, and modern radio measurements confirm it to 0.01%.`,
            },
            {
              type: 'mcq',
              title: 'Mercury’s puzzle',
              prompt: r`Mercury's elliptical orbit slowly rotates (precesses). Newton's gravity, including the pull of the other planets, explained all but about 43 arcseconds per century. What accounted for the rest?`,
              choices: [
                { t: 'General relativity predicted exactly the missing 43 arcseconds', ok: true },
                { t: 'An undiscovered planet called Vulcan', why: 'Astronomers searched for Vulcan for decades, but it doesn’t exist.' },
                { t: 'Measurement error', why: 'The anomaly was measured precisely and was very real.' },
              ],
              explain: r`In 1915, Einstein calculated Mercury's orbit with general relativity and found exactly the missing 43 arcseconds per century. He wrote that he was beside himself with excitement for days. It was the theory's first triumph.`,
            },
            {
              type: 'mcq',
              title: 'Gravitational lenses',
              prompt: r`Astronomers sometimes see the same distant galaxy two, three or four times, or smeared into a ring around a closer galaxy. What causes this?`,
              choices: [
                { t: 'The closer galaxy’s mass bends the light of the farther one along several paths, like a lens', ok: true },
                { t: 'Reflections off interstellar dust', why: 'Dust absorbs and scatters light, but can’t make sharp multiple images.' },
                { t: 'Several identical galaxies happen to line up', why: 'The images have identical spectra: they’re the same galaxy, seen along different bent paths.' },
              ],
              explain: r`This is **gravitational lensing**. A massive galaxy curves spacetime so strongly that light from a galaxy behind it reaches us along several routes. A perfect alignment gives an **Einstein ring**. Lensing is now a key tool for mapping **dark matter**, which bends light even though it can't be seen.`,
            },
            {
              type: 'interactive',
              title: 'Make an Einstein ring',
              body: r`A distant galaxy (the star symbol, dashed) lies behind a massive lens galaxy (black dot). Gravity bends its light into images (coral arcs), stretched and brightened. The dashed circle is the **Einstein radius**. Move the source to create a perfect ring.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.6, xmax: 2.6, ymin: -1.8, ymax: 1.8, grid: false, axes: false, maxWidth: 480,
                params: { u: { min: 0, max: 2, step: 0.01, value: 0.6, label: 'source offset', color: 'violet', format: (v) => `${v.toFixed(2)} Einstein radii` } },
                curves: [{ param: { x: (t) => Math.cos(t), y: (t) => Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => { const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 9, class: 'fl-ink' })]; for (const [th, mu] of lensImages(p.u)) { const R = Math.abs(th), half = Math.min(Math.PI, 0.32 * mu), c0 = th >= 0 ? 0 : Math.PI; if (half >= Math.PI - 1e-9) els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(R) - plot.X(0), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 7 })); else { const a0 = c0 - half, a1 = c0 + half, P = (a) => `${plot.X(R * Math.cos(a)).toFixed(1)} ${plot.Y(R * Math.sin(a)).toFixed(1)}`; els.push(s('path', { d: `M${P(a0)}A${plot.X(R) - plot.X(0)} ${plot.X(R) - plot.X(0)} 0 0 0 ${P(a1)}`, fill: 'none', stroke: 'var(--coral)', 'stroke-width': Math.max(3, Math.min(9, 3 + 2 * mu)), 'stroke-linecap': 'round' })); } } els.push(s('text', { x: plot.X(p.u), y: plot.Y(0) + 6, 'text-anchor': 'middle', style: 'font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--violet)', opacity: 0.7, text: '✶' })); return els; },
                readout: (p) => { if (p.u < 0.005) return 'Perfect alignment: an **Einstein ring** ✓'; const [[a, m1], [b, m2]] = lensImages(p.u); return `two images, at ${a.toFixed(2)} and ${b.toFixed(2)} Einstein radii · total brightness ×${(m1 + m2).toFixed(2)}`; },
                goal: (p) => p.u < 0.005,
                hint: 'Line the source up exactly behind the lens.',
                solution: { u: 0 },
              },
              explain: r`With perfect alignment, light is bent equally in every direction around the lens, forming a ring at the Einstein radius. Slightly off-centre, you get two images, one outside and one inside the ring, and the source appears brighter than it would without the lens. Lensing by single stars, **microlensing**, is even used to find exoplanets.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A cosmic magnifying glass',
              prompt: r`The James Webb Space Telescope has photographed galaxies from less than a billion years after the Big Bang, magnified by foreground galaxy clusters. Why do astronomers love these clusters?`,
              choices: [
                { t: 'Lensing magnifies and brightens galaxies far too faint to see otherwise, and the distortions reveal the cluster’s (mostly dark) mass', ok: true },
                { t: 'The clusters block light from closer galaxies', why: 'Lensing is about bending light, not blocking it.' },
                { t: 'They make the distant galaxies look nearer in time', why: 'The light still left long ago. Lensing changes brightness and shape, not the light’s age.' },
              ],
              explain: r`A massive cluster acts as a natural telescope, magnifying background galaxies by factors of 10 or more. And since the amount of bending depends on the total mass, lensing maps show that clusters contain several times more mass than all their visible stars and gas: evidence for dark matter.`,
            },
          ],
          recap: [
            'Mass curves spacetime. Free objects follow the straightest paths through it.',
            'GR explained Mercury’s extra 43″ per century of precession.',
            'Massive objects act as gravitational lenses.',
          ],
        },
      ],
    },
    {
      title: 'Extreme Gravity',
      summary: 'Black holes and gravitational waves.',
      lessons: [
        {
          id: 'black-holes',
          title: 'Black Holes',
          summary: 'The Schwarzschild radius',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'No escape',
              body: r`Squeeze a mass $M$ into a small enough ball and its escape velocity exceeds the speed of light: nothing, not even light, can get out. The boundary of no return is the **event horizon**, at the **Schwarzschild radius**:
$$r_s = \frac{2GM}{c^2}$$
For the Sun, $r_s \approx 3$ km. The Sun is about 700,000 km in radius, so it's nowhere near being a black hole. But the collapsing core of a massive star can be squeezed that small.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'How big would the horizon be?',
              body: r`The Schwarzschild radius is proportional to mass. Slide across masses from planets to the giants at the centres of galaxies.`,
              widget: {
                kind: 'graph', xmin: -6.5, xmax: 10.5, ymin: -1.2, ymax: 1.4, grid: false, axes: false, height: 180,
                params: { lg: { min: -6, max: 10, step: 0.01, value: 0, slider: true, label: 'mass', color: 'violet', format: (v) => fmtMass(v) } },
                extra: ({ plot, p, s }) => {
                  const els = [s('line', { x1: plot.X(-6), x2: plot.X(10), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 })];
                  EXAMPLES.forEach(([lg, , short], i) => {
                    els.push(s('circle', { cx: plot.X(lg), cy: plot.Y(0), r: 6, class: 'fl-ink' }));
                    els.push(s('text', { x: plot.X(lg), y: plot.Y(i === 2 ? 0.5 : -0.62), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: short }));
                  });
                  els.push(s('circle', { cx: plot.X(p.lg), cy: plot.Y(0), r: 11, class: 'fl-violet', stroke: 'var(--card)', 'stroke-width': 3 }));
                  return els;
                },
                readout: (p) => {
                  const near = EXAMPLES.find(([lg]) => Math.abs(lg - p.lg) < 0.15);
                  return `Schwarzschild radius: **${fmtLen(RS_SUN * 10 ** p.lg)}**${near ? ` (${near[1]})` : ''}`;
                },
                ready: true,
              },
              after: r`Earth would have to be crushed to about the size of a **marble** (about 9 mm in radius). Sagittarius A*, at our galaxy's centre, has about 4 million solar masses and a horizon of roughly 12 million km. In 2019, the Event Horizon Telescope released the first image of a black hole's shadow, M87*, and in 2022 an image of Sagittarius A*.`,
            },
            {
              type: 'numeric',
              title: 'Scaling up',
              prompt: r`The Sun's Schwarzschild radius is about 3 km. What is it for a black hole of 10 solar masses?`,
              unit: 'km',
              answer: 30,
              wrong: [{ v: 300, why: r`$r_s$ is proportional to $M$, not $M^2$.` }, { v: 9.5, tol: 0.5, why: r`$r_s$ is proportional to $M$, not $\sqrt{M}$.` }],
              explain: r`$r_s \propto M$, so 10 solar masses gives about 30 km: an entire star's worth of matter hidden inside a ball the size of a city.`,
            },
            {
              type: 'mcq',
              title: 'Would the Earth fall in?',
              prompt: r`If the Sun were suddenly replaced by a black hole of exactly the same mass, what would happen to Earth's orbit?`,
              choices: [
                { t: 'Nothing: the orbit would stay the same (though it would get very dark and cold)', ok: true },
                { t: 'Earth would be sucked in', why: 'Far from the horizon, a black hole’s gravity is identical to that of any object of the same mass.' },
                { t: 'Earth would fly away', why: 'The mass, and so the gravity at Earth’s distance, is unchanged.' },
              ],
              explain: r`Outside the original object, gravity depends only on mass and distance. A one-solar-mass black hole pulls on Earth exactly as the Sun does. Black holes are only "cosmic vacuum cleaners" up close, within a few times $r_s$.`,
            },
            {
              type: 'interactive',
              title: 'Spaghettification',
              body: r`Falling feet-first into a black hole, your feet are pulled harder than your head. The graph shows this **tidal stretch** across a 2 m body at the event horizon, for different masses (both axes logarithmic). Find the smallest black hole you could cross the horizon of feeling no more than about **10 g** of stretch.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -4, ymax: 9, grid: false, height: 300, axes: { xlabel: 'mass (Suns)', ylabel: 'stretch (g)', xticks: 2, yticks: 2, yAt: -4, xfmt: (v) => `10${sup(v)}`, yfmt: (v) => `10${sup(v)}` },
                params: { lg: { min: 0, max: 10, step: 0.01, value: 1, label: 'mass', color: 'violet', format: (v) => `${fmtMass(v)}` } },
                curves: [{ f: (x) => Math.log10(tidalAtHorizon(MSUN * 10 ** x) / 9.81), color: 'violet', width: 3 }, { f: () => 1, color: 'teal', dash: true }],
                points: [{ x: (p) => p.lg, y: (p) => Math.log10(tidalAtHorizon(MSUN * 10 ** p.lg) / 9.81), color: 'coral' }],
                readout: (p) => { const g = tidalAtHorizon(MSUN * 10 ** p.lg) / 9.81; return `stretch at the horizon: **${sigFigs(g, 3, true)} g**`; },
                goal: (p) => { const g = tidalAtHorizon(MSUN * 10 ** p.lg) / 9.81; return g <= 10 && g >= 8; },
                hint: 'The stretch falls like 1/M². Look for where the curve crosses the dashed line.',
                solution: { lg: 4.17 },
              },
              explain: r`About **14,000 solar masses**. A 10-solar-mass black hole stretches you with 20 million g before you even reach the horizon, but a supermassive one like Sagittarius A* (4 million Suns) is gentle at the horizon: about $10^{-4}$ g. Its tides only become deadly deep inside, where no one outside will ever see.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A surprisingly thin giant',
              prompt: r`A black hole's "average density" (mass divided by the volume inside its horizon) falls like $1/M^2$. A 10-solar-mass black hole has an average density of about $2 \times 10^{17}$ kg/m³, like an atomic nucleus. What is it for M87*, with about 6.5 billion solar masses? (In kg/m³; 1 significant figure.)`,
              unit: 'kg/m³',
              answer: 2e17 / (6.5e8) ** 2,
              relTol: 0.15,
              wrong: [{ v: 2e17 / 6.5e8, relTol: 0.15, why: r`It scales like $1/M^2$: divide by $(6.5 \times 10^8)^2$.` }],
              hint: r`M87* is $6.5 \times 10^8$ times as massive, so divide by $(6.5 \times 10^8)^2 \approx 4 \times 10^{17}$.`,
              explain: r`$\frac{2 \times 10^{17}}{4.2 \times 10^{17}} \approx 0.5$ kg/m³: about **half the density of air**. Black holes aren't necessarily dense: a big enough one could form from matter no denser than air, if there were enough of it.`,
            },
          ],
          recap: [
            r`Schwarzschild radius $r_s = 2GM/c^2$: about 3 km per solar mass.`,
            'Inside the event horizon, nothing can escape.',
            'Far away, a black hole’s gravity is the same as any equal mass.',
          ],
        },
        {
          id: 'waves',
          title: 'Gravitational Waves',
          summary: 'Ripples in spacetime',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Hearing spacetime',
              body: r`Accelerating masses send out ripples in spacetime: **gravitational waves**, travelling at the speed of light. As a wave passes, it stretches space in one direction and squeezes it in the perpendicular one.

On 14 September 2015, the LIGO detectors recorded waves from two black holes, about 36 and 29 times the Sun's mass, spiralling together and merging about 1.3 billion light-years away. In a fraction of a second, the merger radiated about 3 solar masses of energy ($E = mc^2$) as gravitational waves.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The chirp',
              body: r`As two compact objects spiral together, the wave's frequency and strength both climb faster and faster: a **chirp**. Here's the signal in the last half-second before merger. Compare neutron stars (chirp mass about 1.2 Suns) with heavy black holes (about 30).`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 0, ymin: -1.15, ymax: 1.15, grid: false, height: 240, axes: { xlabel: 'time before merger (s)', xticks: 0.1, yticks: 5, xfmt: (v) => v.toFixed(1), yAt: -1.15 },
                params: { Mc: { min: 1.2, max: 30, step: 0.1, value: 30, label: 'chirp mass', color: 'violet', format: (v) => `${v.toFixed(1)} Suns` } },
                curves: [{ f: (t, p) => { const tau = -t; if (tau < 1e-4) return NaN; const f = chirpF(tau, p.Mc); if (f > 2000 / p.Mc) return NaN; return Math.pow(f / (2000 / p.Mc), 2 / 3) * Math.cos(chirpPhase(tau, p.Mc)); }, color: 'violet', width: 1.5, n: 3000 }],
                readout: (p) => `0.1 s before merger: **${Math.round(chirpF(0.1, p.Mc))} Hz** · 0.01 s before: **${Math.round(chirpF(0.01, p.Mc))} Hz**`,
              },
              after: r`Heavy black holes merge at low frequencies, so LIGO catches only the last few cycles; a neutron-star pair sweeps through LIGO's band for over a minute, thousands of cycles, before colliding. (The traces are scaled to fit: the wave's real strength grows as it speeds up.) Converted to sound, the signals really do sound like a bird's chirp.`,
            },
            {
              type: 'numeric',
              title: 'A tiny wobble',
              prompt: r`The wave stretched space by a fraction of about $10^{-21}$. LIGO's arms are 4 km long. By how much did an arm's length change, in metres?`,
              unit: 'm',
              answer: 4e-18,
              tol: 1e-19,
              wrong: [{ v: 4e-24, tol: 1e-25, why: 'Convert 4 km to 4,000 m before multiplying.' }, { v: 4e-21, tol: 1e-22, why: r`The arm is 4,000 m long: $4000 \times 10^{-21}$.` }],
              explain: r`$4000\ \text{m} \times 10^{-21} = 4 \times 10^{-18}$ m: about a thousandth of the width of a proton. Measuring that required lasers bouncing back and forth hundreds of times, mirrors isolated from vibrations, and an ultra-high vacuum. The discovery won the 2017 Nobel Prize in Physics.`,
            },
            {
              type: 'numeric',
              title: 'Three Suns of energy',
              prompt: r`In the 2015 merger, about 3 solar masses ($3 \times 2.0 \times 10^{30}$ kg) were converted into gravitational waves. How much energy is that, in units of $10^{47}$ J? ($c = 3 \times 10^8$ m/s.)`,
              unit: r`$\times 10^{47}$ J`,
              answer: (3 * 2e30 * 9e16) / 1e47,
              tol: 0.05,
              wrong: [{ v: (3 * 2e30 * 3e8) / 1e47, relTol: 0.02, why: r`Use $E = mc^2$: square the speed of light.` }],
              explain: r`$E = 6 \times 10^{30} \times 9 \times 10^{16} \approx 5.4 \times 10^{47}$ J, released in about a fifth of a second. At its peak, the merger was more powerful than all the stars in the observable universe combined, yet it barely moved LIGO's mirrors.`,
            },
            {
              type: 'numeric',
              title: 'Twice the orbit',
              prompt: r`Two orbiting black holes emit gravitational waves at **twice** their orbital frequency. If they orbit each other 50 times a second, what frequency do detectors hear?`,
              unit: 'Hz',
              answer: 100,
              explain: r`100 Hz. The wave pattern repeats every half orbit, since the system looks the same after half a turn. As they spiral closer, the frequency sweeps up: the "chirp".`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Two detectors',
              prompt: r`LIGO has detectors in Washington State and Louisiana, about 3,000 km apart. Why is having (at least) two detectors so important?`,
              choices: [
                { t: 'A real signal must appear in both, within about 10 ms (the light travel time between them)', ok: true },
                { t: 'One detector was a backup in case of breakdown', why: 'Both run together. Coincidence is the point.' },
                { t: 'Each detector only works for half the sky', why: 'Each detector is sensitive to most of the sky. Two are needed to rule out local disturbances and to locate sources.' },
              ],
              explain: r`Trucks, earthquakes and even ocean waves shake each detector. A real gravitational wave hits both sites almost simultaneously, at most about 10 milliseconds apart. Matching signals rule out local noise, and the time difference (with more detectors, like Virgo in Italy) shows where in the sky the wave came from.`,
            },
          ],
          recap: [
            'Accelerating masses emit gravitational waves at the speed of light.',
            'LIGO first detected them in 2015, from merging black holes.',
            'Their effect is incredibly small: about a thousandth of a proton’s width over 4 km.',
          ],
        },
      ],
    },
    {
      title: 'Up Close',
      summary: 'Orbits at the edge, and black holes that glow.',
      lessons: [
        {
          id: 'orbits',
          title: 'Orbits Near a Black Hole',
          summary: 'The innermost stable orbit',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Not quite Newton',
              body: r`Far from a black hole, orbits are Newtonian ellipses. Close in, general relativity adds an extra attraction that grows steeply near the hole. Physicists picture orbits using an **effective potential**: a landscape whose valleys are stable circular orbits and whose hilltops are unstable ones. A particle with angular momentum $L$ rolls in this landscape; a deeper valley holds it, but if the valley disappears, it plunges in.`,
            },
            {
              type: 'interactive',
              title: 'The last stable orbit',
              body: r`The curve is the effective potential for a particle with angular momentum $L$ (in units of $GM/c$; distance in units of $GM/c^2$, so the horizon is at 2). The green dot marks a stable circular orbit (a valley), the coral dot an unstable one (a hilltop). Lower $L$ to find the **smallest** $L$ that still has a stable orbit.`,
              widget: {
                kind: 'graph', xmin: 2, xmax: 30, ymin: 0.8, ymax: 1.05, grid: false, height: 300, padL: 52, axes: { xlabel: 'distance (GM/c²)', ylabel: 'effective potential', xticks: 4, yticks: 0.05, yfmt: (v) => v.toFixed(2), xAt: 2 },
                params: { L: { min: 3, max: 5, step: 0.01, value: 4.2, label: '$L$', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (r, p) => Veff(r, p.L), color: 'violet', width: 3, n: 400 }],
                extra: ({ plot, p, s }) => { const c = circR(p.L); if (!c) return []; return [s('circle', { cx: plot.X(c[1]), cy: plot.Y(Veff(c[1], p.L)), r: 8, class: 'fl-green' }), c[0] > 2 ? s('circle', { cx: plot.X(c[0]), cy: plot.Y(Math.min(1.05, Veff(c[0], p.L))), r: 8, class: 'fl-coral' }) : null]; },
                readout: (p) => { const c = circR(p.L); return c ? `stable orbit at **${c[1].toFixed(2)}** GM/c² · unstable at ${c[0].toFixed(2)}` : '**no circular orbits**: anything with this little angular momentum spirals in'; },
                goal: (p) => { const c = circR(p.L); return c !== null && p.L <= 3.475; },
                hint: 'As L drops, the valley and the hilltop move toward each other. Find where they are about to merge.',
                solution: { L: 3.47 },
              },
              explain: r`At $L = \sqrt{12} \approx 3.46$ the valley and hilltop merge at $r = 6\,GM/c^2 = 3r_s$: the **innermost stable circular orbit** (ISCO). Inside it, no circular orbit is stable; gas in an accretion disc that drifts past the ISCO plunges into the hole within a few orbits. In Newton's gravity, stable circular orbits exist at every radius.`,
            },
            {
              type: 'numeric',
              title: 'How close?',
              prompt: r`The ISCO is at $3r_s$. For a 10-solar-mass black hole ($r_s \approx 30$ km), what is its radius? (Nearest 10 km.)`,
              unit: 'km',
              answer: 88.6,
              tol: 5,
              wrong: [{ v: 30, why: 'That’s the horizon. The ISCO is three times farther out.' }, { v: 60, tol: 1, why: r`It's $3r_s$, not $2r_s$.` }],
              explain: r`About **90 km**. Gas orbiting there completes hundreds of orbits per second, and X-ray telescopes see flickering from such inner discs, as fast as milliseconds.`,
            },
            {
              type: 'mcq',
              title: 'Light in orbit',
              prompt: r`At $1.5\,r_s$ there's a **photon sphere**, where light itself can travel in a circle. What would you see if you hovered there and looked straight ahead along the orbit?`,
              choices: [
                { t: 'The back of your own head, from light that went all the way round', ok: true },
                { t: 'Total darkness', why: 'Light can orbit at the photon sphere: some light from you comes back around.' },
                { t: 'The singularity', why: 'The singularity is hidden inside the horizon at $r_s$. Light at $1.5 r_s$ is still outside.' },
              ],
              explain: r`Light emitted sideways at the photon sphere circles the hole and returns, so (in principle) you'd see yourself from behind. The photon-sphere orbits are unstable, like balancing on a hilltop, and the bright ring in the Event Horizon Telescope images is light skimming just outside this sphere.`,
            },
            {
              type: 'numeric',
              title: 'Hundreds of laps a second',
              prompt: r`Gas at the ISCO of a 10-solar-mass black hole orbits at radius $r \approx 8.9 \times 10^4$ m. Using Kepler's law, $f = \frac{1}{2\pi}\sqrt{\frac{GM}{r^3}}$ with $GM = 1.33 \times 10^{21}$ m³/s², how many orbits per second is that? (Nearest 10.)`,
              unit: 'orbits/s',
              answer: Math.sqrt(1.33e21 / 8.9e4 ** 3) / (2 * Math.PI),
              tol: 6,
              wrong: [{ v: Math.sqrt(1.33e21 / 8.9e4 ** 3), relTol: 0.03, why: r`That's the angular speed in radians per second. Divide by $2\pi$ for full orbits.` }],
              explain: r`$\sqrt{GM/r^3} \approx 1370$ rad/s, so $f \approx 220$ orbits per second. (For circular orbits around a non-spinning hole, Kepler's formula happens to stay exact in the distant observer's time.) X-ray telescopes see flickering at hundreds of hertz from such discs: the signature of gas whirling round just outside the point of no return.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The most efficient engine',
              prompt: r`Gas spiralling down to the ISCO radiates away a fraction $1 - \sqrt{8/9}$ of its rest-mass energy before plunging in. Nuclear fusion in stars releases about 0.7%. How many times more efficient is accretion onto a (non-spinning) black hole? (1 decimal place.)`,
              unit: '×',
              answer: (1 - Math.sqrt(8 / 9)) / 0.007,
              tol: 0.1,
              wrong: [{ v: 1 - Math.sqrt(8 / 9), tol: 0.002, why: 'That’s the efficiency itself (about 5.7%). Divide by fusion’s 0.7%.' }],
              hint: r`$\sqrt{8/9} \approx 0.9428$, so the efficiency is about 5.7%.`,
              explain: r`$\frac{5.7\%}{0.7\%} \approx 8.2$. (For rapidly spinning black holes it can exceed 30%.) That's why **quasars**, gas falling into supermassive black holes, can outshine whole galaxies of a trillion stars from a region smaller than the Solar System.`,
            },
          ],
          recap: [
            'Near a black hole, GR adds an extra attraction that removes stable orbits close in.',
            r`Innermost stable circular orbit: $3r_s$; photon sphere: $1.5r_s$.`,
            'Accretion converts about 6% (or more) of rest mass into radiation: far more than fusion.',
          ],
        },
        {
          id: 'hawking',
          title: 'Hawking Radiation',
          summary: 'Black holes are not quite black',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'A glowing horizon',
              body: r`In 1974, Stephen Hawking combined general relativity with quantum mechanics and found that black holes should glow faintly, like a hot object, with temperature
$$T = \frac{\hbar c^3}{8\pi G M k_B} \approx 6 \times 10^{-8}\,\text{K} \times \frac{M_\odot}{M}$$
Smaller black holes are **hotter**. As they radiate they lose mass, get hotter still, and radiate faster: eventually they **evaporate** completely, with a lifetime that grows like $M^3$.`,
            },
            {
              type: 'interactive',
              title: 'Hotter than the sky',
              body: r`The universe is bathed in the cosmic microwave background at 2.7 K. A black hole colder than that absorbs more radiation than it emits, and grows. Find the mass at which a black hole's temperature equals 2.7 K (the slider is logarithmic, in kilograms).`,
              widget: {
                kind: 'graph', xmin: 10, xmax: 32, ymin: -9, ymax: 14, grid: false, height: 300, axes: { xlabel: 'mass (kg, log scale)', ylabel: 'temperature (K, log scale)', xticks: 4, yticks: 4, xfmt: (v) => `10${sup(v)}`, yfmt: (v) => `10${sup(v)}` },
                params: { lg: { min: 10, max: 32, step: 0.01, value: 30.3, label: 'mass', color: 'violet', format: (v) => `$${sci(10 ** v)}$ kg` } },
                curves: [{ f: (x) => Math.log10(hawkingT(10 ** x)), color: 'violet', width: 3 }, { f: () => Math.log10(2.725), color: 'teal', dash: true }],
                points: [{ x: (p) => p.lg, y: (p) => Math.log10(hawkingT(10 ** p.lg)), color: 'coral' }],
                readout: (p) => { const M = 10 ** p.lg, T = hawkingT(M); return `temperature $${sci(T)}$ K · ${T > 2.725 ? '**shrinking**: hotter than the sky' : '**growing**: colder than the sky'} · lifetime about $${sci(hawkingLife(M))}$ years`; },
                goal: (p) => Math.abs(Math.log10(hawkingT(10 ** p.lg) / 2.725)) < 0.02,
                hint: 'The temperature is inversely proportional to mass. The dashed line is 2.7 K.',
                solution: { lg: 22.65 },
              },
              explain: r`About $4.5 \times 10^{22}$ kg, roughly **half the mass of the Moon**, squeezed into a black hole a tenth of a millimetre across. Every black hole formed by a collapsing star is far heavier, colder than the sky, and growing. Only tiny black holes, if any exist, could be evaporating today.`,
            },
            {
              type: 'numeric',
              title: 'A stellar black hole',
              prompt: r`What is the Hawking temperature of a 10-solar-mass black hole, in units of $10^{-9}$ K?`,
              unit: r`$\times 10^{-9}$ K`,
              answer: 6.17,
              tol: 0.1,
              wrong: [{ v: 617, tol: 5, why: 'Bigger black holes are colder: divide by 10, don’t multiply.' }, { v: 61.7, tol: 0.5, why: r`$6 \times 10^{-8}$ K divided by 10 is $6 \times 10^{-9}$ K.` }],
              explain: r`$\frac{6.2 \times 10^{-8}}{10} \approx 6.2 \times 10^{-9}$ K: six billionths of a degree above absolute zero, hopelessly undetectable against the 2.7 K sky. Hawking radiation has never been observed, though analogues in fluids and light have reproduced its key features.`,
            },
            {
              type: 'numeric',
              title: 'Twice the mass',
              prompt: r`The evaporation time grows like $M^3$. How many times longer does a black hole of twice the mass take to evaporate?`,
              unit: '×',
              answer: 8,
              wrong: [{ v: 2, why: 'It scales like the cube of the mass.' }, { v: 4, why: 'Not the square: the cube. 2³.' }],
              explain: r`$2^3 = 8$ times longer. A solar-mass black hole would take about $10^{67}$ years, vastly longer than the current age of the universe ($1.4 \times 10^{10}$ years). Black holes are the last things that will shine in the far future.`,
            },
            {
              type: 'mcq',
              title: 'The information paradox',
              prompt: r`If black holes evaporate completely by Hawking radiation, which seems to be perfectly thermal (random), what puzzle arises?`,
              choices: [
                { t: r`The information about what fell in seems to be destroyed, which quantum mechanics forbids`, ok: true },
                { t: r`Energy would not be conserved`, why: r`The radiated energy accounts for the mass; energy isn’t the problem.` },
                { t: r`The black hole would grow forever`, why: r`Hawking radiation makes black holes shrink.` },
              ],
              explain: r`Quantum mechanics says information can be scrambled but never lost. Many physicists now think the radiation secretly carries the information out, but exactly how is one of the deepest open questions in physics.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Primordial black holes',
              prompt: r`If tiny black holes formed in the hot early universe, those finishing their evaporation **now** would have started with about $10^{11}$ to $10^{12}$ kg, the mass of a mountain. What would the end of their lives look like?`,
              choices: [
                { t: 'A final burst of gamma rays, as the shrinking hole gets hotter and hotter', ok: true },
                { t: 'A quiet fade to nothing', why: 'The opposite: as it shrinks it gets hotter, so the last moments are the brightest.' },
                { t: 'A collapse into a bigger black hole', why: 'Evaporating holes lose mass. They don’t merge or grow as they evaporate.' },
              ],
              explain: r`The temperature rises without limit as the mass shrinks, so the last second releases a burst of high-energy gamma rays. Gamma-ray telescopes have searched for such bursts and haven't found any, which limits how many primordial black holes there can be. Whether they exist at all is still unknown.`,
            },
          ],
          recap: [
            r`Hawking temperature: $T \approx 6 \times 10^{-8}\,\text{K} \times M_\odot / M$.`,
            'Small black holes are hot and evaporate; stellar ones are colder than the CMB and grow.',
            r`Evaporation time grows like $M^3$.`,
          ],
        },
      ],
    },
  ],
};
