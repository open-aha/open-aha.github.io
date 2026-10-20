const r = String.raw;
const AJ = 5.2; // Jupiter's orbit, AU
const ratio = (a) => (AJ / a) ** 1.5; // Jupiter's period ÷ asteroid's period

const KB = 1.38e-23, AMU = 1.66e-27;
const vrms = (T, m) => Math.sqrt((3 * KB * T) / (m * AMU)) / 1000; // km/s, m in atomic mass units
// impact energy (megatons) of a stony asteroid (3000 kg/m³) of diameter d metres at 20 km/s
const impactMt = (d) => (0.5 * 3000 * (Math.PI / 6) * d ** 3 * 2e4 ** 2) / 4.184e15;
// net acceleration (mm/s²) along the Sun–Earth line, r million km beyond Earth, in the co-rotating frame
const GM_S = 1.327e20, GM_E = 3.986e14, AU = 1.496e11, W2 = (GM_S + GM_E) / AU ** 3;
const l2Accel = (r) => { const d = r * 1e9; return 1000 * (-GM_S / (AU + d) ** 2 - GM_E / d ** 2 + W2 * (AU + d)); };

export default {
  id: 'planets',
  subject: 'physics',
  title: 'Planets & Moons',
  level: 'Intermediate',
  cover: 'planets',
  tagline: 'Why big things are round, why Saturn has rings, how moons lock into rhythm, and what asteroids can do.',
  description: r`The Solar System is a gravity laboratory. Find out why large moons are spheres but small ones look like potatoes, why rings sit close to their planets, how orbital resonances heat Io's volcanoes and carve gaps in the asteroid belt, how much energy an asteroid impact releases, why some worlds keep their air, and where spacecraft can park at Lagrange points.`,
  prereq: 'Gravity & Orbits',
  chapters: [
    {
      title: 'Shapes and Rings',
      summary: 'Gravity versus strength.',
      lessons: [
        {
          id: 'round',
          title: 'Why Planets Are Round',
          summary: 'Gravity wins at large sizes',
          icon: 'moon',
          steps: [
            {
              type: 'explain',
              title: 'Potatoes and spheres',
              body: r`Small asteroids and moons are lumpy, like potatoes. Large ones are round. Gravity pulls every part of a body towards its centre, while the strength of rock or ice resists. The pressure gravity creates in a body's interior grows rapidly with size, so beyond a certain size it overwhelms the material's strength, and the body slumps into a sphere: **hydrostatic equilibrium**.

For icy bodies the changeover happens at a few hundred kilometres across: Saturn's moon Mimas (about 400 km) is round, while Hyperion (about 270 km) is a battered sponge.`,
            },
            {
              type: 'numeric',
              title: 'Pressure grows fast',
              prompt: r`For a body of uniform density, the pressure at its centre is proportional to $R^2$. If one moon has twice the radius of another (same material), how many times greater is its central pressure?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`Central pressure goes as $R^2$: $2^2$.` }, { v: 8, why: r`That's how its mass grows ($R^3$). Pressure goes as $R^2$.` }],
              explain: r`$2^2 = 4$. Mass grows as $R^3$, but it's spread over a larger area and sits further from the centre; the net effect is $R^2$. So doubling the size quadruples the crushing pressure, which is why there's a fairly sharp size threshold for roundness.`,
            },
            {
              type: 'numeric',
              title: 'Taller mountains',
              prompt: r`The tallest possible mountain is roughly inversely proportional to surface gravity. Everest is about 8.8 km high on Earth ($g = 9.8$ m/s²). Roughly how tall could a mountain be on Mars ($g = 3.7$ m/s²)? (Nearest km.)`,
              unit: 'km',
              answer: Math.round((8.8 * 9.8) / 3.7),
              tol: 1,
              wrong: [{ v: Math.round((8.8 * 3.7) / 9.8), tol: 1, why: 'Weaker gravity allows taller mountains: divide by the ratio, don’t multiply.' }],
              explain: r`$8.8 \times \frac{9.8}{3.7} \approx 23$ km. Mars' Olympus Mons rises about 22 km above its surroundings: the tallest volcano in the Solar System, just as the scaling suggests.`,
            },
            {
              type: 'mcq',
              title: 'What makes a planet?',
              prompt: r`In 2006, the International Astronomical Union defined a planet as a body that orbits the Sun, is massive enough to be round, and has "cleared the neighbourhood" around its orbit. Why did Pluto fail?`,
              choices: [
                { t: 'It shares its orbital zone with many other Kuiper Belt objects, so it hasn’t cleared its neighbourhood', ok: true },
                { t: 'It isn’t round', why: 'Pluto is round: it’s in hydrostatic equilibrium. It fails the third criterion.' },
                { t: 'It doesn’t orbit the Sun', why: 'It does, every 248 years. Its problem is the crowded region it orbits in.' },
              ],
              explain: r`Pluto is one of many icy bodies in the Kuiper Belt, and Eris, discovered in 2005, is almost exactly the same size. Pluto became a **dwarf planet**: round and orbiting the Sun, but sharing its orbital zone.`,
            },
            {
              type: 'interactive',
              title: 'Lumpy or round?',
              body: r`Rock can only support mountains up to a height that falls as gravity rises. Taking Earth’s rock strength and density, the tallest possible mountain is about $9\ \text{km} \times \frac{6371\ \text{km}}{R}$ for a body of radius $R$. Find the radius where mountains can reach **10%** of the radius: about the size where bodies stop being lumpy.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.4, ymax: 1.4, grid: false, axes: false, maxWidth: 320,
                params: { R: { min: 100, max: 3000, step: 1, value: 300, label: 'radius', color: 'amber', format: (v) => `${v} km` } },
                extra: ({ plot, p, s }) => { const h = Math.min(1, (9 * 6371) / p.R / p.R), d = Array.from({ length: 181 }, (_, i) => { const t = (i / 180) * 2 * Math.PI, r = 1 - 0.5 * h + h * 0.5 * (Math.sin(3 * t + 1) * 0.6 + Math.sin(5 * t + 2) * 0.3 + Math.sin(2 * t) * 0.4); return `${i ? 'L' : 'M'}${plot.X(r * Math.cos(t)).toFixed(1)} ${plot.Y(r * Math.sin(t)).toFixed(1)}`; }).join('') + 'Z'; return [s('path', { d, class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2.5 })]; },
                readout: (p) => { const h = (9 * 6371) / p.R; return `tallest mountain ≈ **${h.toFixed(0)} km** = **${((100 * h) / p.R).toFixed(1)}%** of the radius`; },
                goal: (p) => Math.abs((9 * 6371) / p.R / p.R - 0.1) < 0.002,
                hint: 'Solve 9 × 6371 / R² = 0.1.',
                solution: { R: 757 },
              },
              explain: r`$R = \sqrt{9 \times 6371 / 0.1} \approx 760$ km. This crude estimate lands in the right range: icy moons become round at a radius of about 200 km and rocky bodies at about 300 km (ice is weaker than rock). Ceres (470 km) is round; Vesta (260 km) is lumpy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Mountains on Vesta',
              prompt: r`The asteroid Vesta has a surface gravity of about 0.25 m/s². Using the same $\frac{1}{g}$ scaling from Everest (8.8 km at 9.8 m/s²), what height limit does that suggest for Vesta? (Nearest 5 km.)`,
              unit: 'km',
              answer: (8.8 * 9.8) / 0.25,
              tol: 3,
              wrong: [{ v: (8.8 * 0.25) / 9.8, tol: 0.05, why: r`Weaker gravity allows **taller** mountains: multiply by $\frac{9.8}{0.25}$.` }],
              explain: r`$8.8 \times \frac{9.8}{0.25} \approx 345$ km: more than Vesta's own radius (about 260 km). Gravity there is too weak to crush rock into a sphere, which is exactly why Vesta stays lumpy. Its real central peak, in the giant Rheasilvia crater, rises about 22 km.`,
            },
          ],
          recap: [
            'Large bodies become round because gravity overwhelms material strength.',
            r`Central pressure grows as $R^2$, giving a fairly sharp size threshold.`,
            'Pluto is a dwarf planet: round, but it hasn’t cleared its orbit.',
          ],
        },
        {
          id: 'roche',
          title: 'Rings & the Roche Limit',
          summary: 'Torn apart by tides',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Too close for comfort',
              body: r`A moon is held together by its own gravity, while the planet's **tidal force** stretches it, pulling harder on the near side than the far side. Tidal force grows as $\frac{1}{d^3}$, so close enough to the planet it wins. In 1848, Édouard Roche calculated the critical distance for a fluid moon:
$$d \approx 2.44\, R \left(\frac{\rho_{\text{planet}}}{\rho_{\text{moon}}}\right)^{1/3}$$
where $R$ is the planet's radius. Inside this **Roche limit**, a fluid moon can't hold together, and loose debris can't clump into a moon.`,
            },
            {
              type: 'numeric',
              title: 'Saturn’s rings',
              prompt: r`Saturn has radius 58,200 km and density 0.69 g/cm³. For icy moons (density 0.93 g/cm³), where is the Roche limit? Give it in thousands of km (nearest whole number).`,
              unit: 'thousand km',
              answer: (2.44 * 58200 * Math.cbrt(0.69 / 0.93)) / 1000,
              tol: 1,
              wrong: [{ v: (2.44 * 58200) / 1000, tol: 1, why: r`Include the density factor $\left(\frac{0.69}{0.93}\right)^{1/3} \approx 0.905$.` }],
              explain: r`$2.44 \times 58{,}200 \times 0.905 \approx 128{,}000$ km. Saturn's bright main rings lie almost entirely within about 137,000 km of its centre, right around this limit, while its large moons orbit well outside. All four giant planets have ring systems close in.`,
            },
            {
              type: 'numeric',
              title: 'Our Moon',
              prompt: r`Earth has radius 6,371 km and density 5.51 g/cm³; the Moon's density is 3.34 g/cm³. Where is the Moon's (fluid) Roche limit, in thousands of km? (1 decimal place.)`,
              unit: 'thousand km',
              answer: (2.44 * 6371 * Math.cbrt(5.51 / 3.34)) / 1000,
              tol: 0.06,
              wrong: [{ v: (2.44 * 6371) / 1000, tol: 0.06, why: 'Include the density factor.' }],
              explain: r`$2.44 \times 6371 \times 1.18 \approx 18.4$ thousand km, less than 5% of the Moon's actual distance (384,000 km), and the Moon is moving away. Our Moon is safe.`,
            },
            {
              type: 'mcq',
              title: 'A comet’s fate',
              prompt: r`In 1992, comet Shoemaker–Levy 9 passed very close to Jupiter. What happened?`,
              choices: [
                { t: 'Tidal forces tore it into more than 20 fragments, which crashed into Jupiter in 1994', ok: true },
                { t: 'It was flung out of the Solar System', why: 'Instead, it was captured and broken apart; the pieces hit Jupiter two years later.' },
                { t: 'Nothing: comets are too small to feel tides', why: 'Comets are loosely bound rubble, very vulnerable to tides inside the Roche limit.' },
              ],
              explain: r`Passing inside Jupiter's Roche limit, the loosely held comet was pulled apart into a "string of pearls". In July 1994, the fragments struck Jupiter one after another, leaving dark scars bigger than Earth: the first collision between Solar System bodies ever observed.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Saturn’s danger zone',
              body: r`A moon held together only by its own gravity is torn apart inside the Roche limit $d \approx 2.44\,R_{\text{planet}} \left(\frac{\rho_{\text{planet}}}{\rho_{\text{moon}}}\right)^{1/3}$. Saturn is very light (687 kg/m³). Change the moon’s density and compare the limit (dashed) with Saturn’s rings.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.3, xmax: 3.3, ymin: -1.6, ymax: 1.6, grid: false, axes: false, maxWidth: 560,
                params: { rho: { min: 300, max: 5500, step: 10, value: 900, label: 'moon density', color: 'teal', format: (v) => `${v} kg/m³` } },
                extra: ({ plot, p, s }) => { const d = 2.44 * Math.cbrt(687 / p.rho), ell = (a, cls, st, w, dash) => s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: plot.X(a) - plot.X(0), ry: (plot.X(a) - plot.X(0)) * 0.32, fill: cls, stroke: st, 'stroke-width': w, 'stroke-dasharray': dash || '' }); return [ell(2.15, 'none', 'var(--amber)', plot.X(0.24) - plot.X(0), ''), ell(1.74, 'none', 'var(--amber)', plot.X(0.42) - plot.X(0), ''), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2 }), ell(d, 'none', 'var(--surface)', 6, ''), ell(d, 'none', 'var(--coral)', 3, '7 6'), s('circle', { cx: plot.X(Math.min(3.2, d)), cy: plot.Y(0), r: 7, class: 'fl-teal' })]; },
                readout: (p) => { const d = 2.44 * Math.cbrt(687 / p.rho); return `Roche limit **${d.toFixed(2)} Saturn radii** (${(d * 58232).toLocaleString('en-US', { maximumFractionDigits: 0 })} km) · main rings reach 2.27 radii`; },
              },
              after: r`For icy moons (about 900 kg/m³) the limit is about 2.2 Saturn radii, right at the outer edge of the bright rings: inside, ice cannot clump into a moon, so it stays as ring particles. Denser rocky bodies can survive closer in, which is why a rock-and-iron moon like Phobos only breaks up when it gets very close to Mars.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The end of Phobos',
              prompt: r`Mars’s moon Phobos orbits inside the synchronous orbit, so tides are slowly pulling it inward. What is expected to happen in roughly 30–50 million years?`,
              choices: [
                { t: r`It will cross the Roche limit and be torn apart, probably forming a ring around Mars`, ok: true },
                { t: r`It will escape into space`, why: r`Tides are pulling it **inward**, not outward. (Our Moon, outside synchronous orbit, is moving outward.)` },
                { t: r`It will settle into a stable orbit`, why: r`It keeps losing orbital energy to tides until it reaches the Roche limit.` },
              ],
              explain: r`Phobos orbits faster than Mars spins, so its tidal bulge lags behind and drags it inward by about 2 m per century. Once inside the Roche limit, Mars’s tides will exceed its self-gravity: it may become a ring, as Saturn’s rings may once have formed.`,
            },
          ],
          recap: [
            'Tidal forces tear apart loosely bound bodies inside the Roche limit.',
            r`Roche limit $\approx 2.44 R (\rho_p/\rho_m)^{1/3}$ for a fluid moon.`,
            'Planetary rings lie close in, around or inside the Roche limit.',
          ],
        },
      ],
    },
    {
      title: 'Rhythms and Collisions',
      summary: 'Resonances and impacts.',
      lessons: [
        {
          id: 'resonance',
          title: 'Orbital Resonances',
          summary: 'Moons in step',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Jupiter’s clockwork',
              body: r`Jupiter's moons Io, Europa and Ganymede orbit in periods of 1.77, 3.55 and 7.15 days: very nearly in the ratio **1 : 2 : 4**. Their regular gravitational tugs, always at the same points in their orbits, keep this rhythm locked: an **orbital resonance**.

The repeated tugs keep Io's orbit slightly elliptical, so Jupiter's tides flex it in and out every orbit. That flexing heats Io's interior, making it the most volcanically active body in the Solar System.`,
            },
            { /*anim:planets*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Three moons in step',
              body: r`Io, Europa and Ganymede, with periods in the ratio $1 : 2 : 4$ (orbit sizes to scale). A line flashes whenever two neighbours pass each other.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.15, xmax: 1.15, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 400,
                animate: { param: 't', speed: 0.8, max: 8 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const M = [['Io', 0.394, 1, 0, 'coral'], ['Europa', 0.627, 0.5, 0, 'blue'], ['Ganymede', 1, 0.25, Math.PI / 2, 'teal']], els = [];
                  const pos = ([, r, n, ph], tt) => [r * Math.cos(n * tt + ph), r * Math.sin(n * tt + ph)];
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(0.13) - plot.X(0), class: 'fl-amber' }));
                  M.forEach(([, r]) => els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(r) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5 })));
                  // conjunction lines: angle between neighbours near zero (fade over a short time)
                  for (const [i, j] of [[0, 1], [1, 2]]) {
                    const a = M[i], b = M[j], rel = ((((a[2] - b[2]) * p.t + a[3] - b[3]) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), d = Math.min(rel, 2 * Math.PI - rel);
                    if (d < 0.35) { const [x, y] = pos(M[j], p.t); els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(x * 1.08), y2: plot.Y(y * 1.08), stroke: `var(--${a[4]})`, 'stroke-width': 3, opacity: (1 - d / 0.35).toFixed(2) })); }
                  }
                  M.forEach((m) => { const [x, y] = pos(m, p.t); els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 8, class: `fl-${m[4]}`, stroke: 'var(--card)', 'stroke-width': 2 })); });
                  return els;
                },
                readout: () => `{coral:Io} · {blue:Europa} · {teal:Ganymede}: when Io passes Europa, Ganymede is a quarter-turn away; when Europa passes Ganymede, Io is on the far side`,
              },
              after: r`Io catches up with Europa always at the same few places, and Europa with Ganymede at others, so the moons' tugs on each other repeat in the same pattern lap after lap. That rhythm keeps pumping their orbits slightly out of round, which flexes Io with tides and heats it: Io is the most volcanic body in the Solar System. The three moons can never all line up together. Pierre-Simon Laplace explained this lock in the 1780s, and it's now called the **Laplace resonance**.`,
            },
            {
              type: 'numeric',
              title: 'Predict the period',
              prompt: r`If Io's period is exactly 1.77 days, what would Ganymede's period be in a perfect 1 : 2 : 4 resonance?`,
              unit: 'days',
              answer: 7.08,
              tol: 0.01,
              wrong: [{ v: 3.54, tol: 0.01, why: 'That’s Europa (twice Io’s period). Ganymede is four times Io’s.' }],
              explain: r`$4 \times 1.77 = 7.08$ days, close to the actual 7.15. The resonance is maintained by the moons' slow orbital evolution, not exact by chance.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Gaps in the asteroid belt',
              prompt: r`Jupiter orbits at 5.2 AU. By Kepler's third law, an asteroid at distance $a$ has a period ratio $\frac{T_J}{T} = \left(\frac{5.2}{a}\right)^{1.5}$. Find the distance where an asteroid orbits the Sun exactly **3 times** for every orbit of Jupiter.`,
              widget: {
                kind: 'graph', xmin: 2, xmax: 3.5, ymin: 1.5, ymax: 4.5, grid: 0.25, gridY: 0.5, height: 280, padL: 48,
                axes: { xlabel: 'distance (AU)', ylabel: 'period ratio', xAt: 2, yAt: 1.5, xfmt: (v) => v.toFixed(2) },
                params: { a: { min: 2, max: 3.5, step: 0.01, value: 3, slider: false } },
                curves: [{ f: (a) => ratio(a), color: 'violet', width: 3 }, { f: () => 3, color: 'coral', dash: true, width: 2 }],
                points: [{ x: (p) => p.a, y: (p) => ratio(p.a), drag: { x: 'a' }, color: 'teal' }],
                readout: (p) => r`$a = ${p.a.toFixed(2)}$ AU: the asteroid orbits $${ratio(p.a).toFixed(3)}$ times per Jupiter orbit`,
                goal: (p) => Math.abs(ratio(p.a) - 3) < 0.02,
                hint: r`Solve $\left(\frac{5.2}{a}\right)^{1.5} = 3$: $a = \frac{5.2}{3^{2/3}}$.`,
                solution: { a: 2.5 },
              },
              explain: r`At $a \approx 2.50$ AU, the asteroid laps the Sun 3 times per Jupiter orbit, so Jupiter tugs it at the same point again and again. Over millions of years these repeated nudges pump up the orbit's eccentricity and clear the zone. In 1866, Daniel Kirkwood noticed **gaps** in the asteroid belt at exactly such resonances: 2.50 AU (3 : 1), 2.82 AU (5 : 2) and 3.28 AU (2 : 1).`,
            },
            {
              type: 'numeric',
              title: 'Pluto and Neptune',
              prompt: r`Pluto orbits the Sun twice for every three orbits of Neptune (a 3 : 2 resonance). Neptune's period is 165 years. What's Pluto's?`,
              unit: 'years',
              answer: 247.5,
              tol: 0.6,
              wrong: [{ v: 110, why: 'Pluto is further out, so it’s slower: 2 Pluto orbits = 3 Neptune orbits.' }],
              explain: r`$\frac{3 \times 165}{2} = 247.5$ years. Although Pluto's orbit crosses Neptune's, the resonance guarantees they never come close: whenever Pluto is nearest the Sun, Neptune is far away.`,
            },
            {
              type: 'numeric',
              title: 'Saturn’s moons in step',
              prompt: r`Saturn's moons Mimas and Tethys are locked in a 2 : 1 resonance: Mimas orbits twice for each orbit of Tethys. Mimas takes 0.942 days. What is Tethys' period, in days? (2 decimal places.)`,
              unit: 'days',
              answer: 0.942 * 2,
              tol: 0.01,
              wrong: [{ v: 0.471, tol: 0.005, why: 'Tethys is the outer, slower moon, so its period is longer: multiply by 2.' }],
              explain: r`$2 \times 0.942 = 1.88$ days, matching the measured 1.89 days. Resonances like this are everywhere among moons, and Mimas' tugs also help sculpt the Cassini Division, the dark gap in Saturn's rings.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A chain of worlds',
              prompt: r`The seven Earth-sized planets of the TRAPPIST-1 system have periods in near-ratios like 8 : 5, 5 : 3, 3 : 2, 3 : 2, 4 : 3, 3 : 2. What does this suggest?`,
              choices: [
                { t: 'They formed further out and migrated inwards together, locking into a resonant chain', ok: true },
                { t: 'It’s pure coincidence', why: 'So many near-integer ratios in a row is very unlikely by chance.' },
                { t: 'The star forces them into these orbits directly', why: 'The resonances come from the planets’ gravitational pulls on each other.' },
              ],
              explain: r`As planets drift through their birth disc, they can catch each other in resonances, like gears meshing. Converted into sound (each orbit a beat), the TRAPPIST-1 rhythm sounds almost musical.`,
            },
          ],
          recap: [
            'Io, Europa and Ganymede are locked in a 1 : 2 : 4 resonance.',
            'Resonant tugs keep Io’s orbit eccentric, and tides heat its volcanoes.',
            'Resonances with Jupiter carve the Kirkwood gaps in the asteroid belt.',
          ],
        },
        {
          id: 'impacts',
          title: 'Impacts',
          summary: 'Energy from the sky',
          icon: 'flame',
          steps: [
            {
              type: 'numeric',
              title: 'The dinosaur killer',
              prompt: r`About 66 million years ago, an asteroid roughly 10 km across hit what is now Mexico. Take its mass as $1.6 \times 10^{15}$ kg and its speed as 20 km/s. What was its kinetic energy? Give the answer in units of $10^{23}$ J. (1 decimal place.)`,
              unit: r`$\times 10^{23}$ J`,
              answer: (0.5 * 1.6e15 * (2e4) ** 2) / 1e23,
              tol: 0.06,
              wrong: [{ v: (0.5 * 1.6e15 * 2e4) / 1e23, relTol: 0.1, why: r`Square the speed: $v^2 = (2 \times 10^4)^2 = 4 \times 10^8$.` }, { v: (1.6e15 * (2e4) ** 2) / 1e23, tol: 0.06, why: r`Don't forget the $\frac12$ in $\frac12 mv^2$.` }],
              explain: r`$\frac12 \times 1.6 \times 10^{15} \times (2 \times 10^4)^2 = 3.2 \times 10^{23}$ J, about 75 million megatons of TNT, more than a million times the energy of the largest nuclear bomb ever tested. It left the Chicxulub crater, about 180 km across, and triggered the mass extinction that ended the age of the dinosaurs.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A megaton rock',
              prompt: r`A stony asteroid (density 3,000 kg/m³) hits the atmosphere at 20 km/s. Find the diameter that releases **1 megaton** of TNT ($4.18 \times 10^{15}$ J).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 10, grid: 10, gridY: 2, height: 260, axes: { xlabel: 'diameter (m)', ylabel: 'energy (megatons)' },
                params: { d: { min: 1, max: 60, step: 0.1, value: 10, slider: false } },
                curves: [{ f: (d) => impactMt(d), color: 'violet', width: 3 }, { f: () => 1, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.d, y: (p) => Math.min(10, impactMt(p.d)), drag: { x: 'd' }, color: 'teal' }],
                readout: (p) => r`$d = ${p.d.toFixed(1)}$ m: $${impactMt(p.d) < 1 ? (1000 * impactMt(p.d)).toFixed(0) + '\\text{ kilotons}' : impactMt(p.d).toFixed(2) + '\\text{ megatons}'}$`,
                goal: (p) => Math.abs(impactMt(p.d) - 1) < 0.02,
                hint: 'Energy grows as the cube of the diameter.',
                solution: { d: 23.7 },
              },
              explain: r`About **24 m** across. The 2013 Chelyabinsk meteor, roughly 19 m, exploded high over Russia with about half a megaton, injuring over a thousand people with flying glass. Because energy grows as $d^3$, a 240 m asteroid would carry a thousand times more.`,
            },
            {
              type: 'mcq',
              title: 'Planetary defence',
              prompt: r`In 2022, NASA's DART spacecraft deliberately crashed into Dimorphos, a small moonlet orbiting the asteroid Didymos. What did it show?`,
              choices: [
                { t: 'A spacecraft impact can measurably change an asteroid’s orbit: Dimorphos’ 11 h 55 min orbit shortened by about 32 minutes', ok: true },
                { t: 'Asteroids are too massive to be affected', why: 'DART changed the moonlet’s orbit far more than the minimum goal of 73 seconds.' },
                { t: 'The asteroid was destroyed', why: 'The goal was a nudge, not destruction. Dimorphos survived, with a changed orbit.' },
              ],
              explain: r`The orbit change was much larger than the momentum of the spacecraft alone would give, because debris blasted off the surface acted like a rocket exhaust, adding extra push. With enough warning, a small nudge years in advance can make a dangerous asteroid miss the Earth.`,
            },
            {
              type: 'mcq',
              title: 'Exploding in the air',
              prompt: r`The Chelyabinsk meteor never reached the ground in one piece: it exploded about 30 km up. Why do small stony asteroids usually burst in the air?`,
              choices: [
                { t: 'The pressure of the air in front of them grows with speed squared, until it exceeds the rock’s strength and it shatters', ok: true },
                { t: 'They are made of explosive chemicals', why: 'The explosion is from kinetic energy released suddenly, not chemistry.' },
                { t: 'The Earth’s magnetic field breaks them up', why: 'Rocks aren’t much affected by the magnetic field. Air pressure does the damage.' },
              ],
              explain: r`At 19 km/s, the air in front of the rock is compressed to pressures of millions of pascals. Once that exceeds the rock's strength, it fragments, the pieces spread out, the area facing the air grows, and almost all the energy is dumped in a fraction of a second: an **airburst**. The 1908 Tunguska event flattened 2,000 km² of Siberian forest this way.`,
            },
            {
              type: 'numeric',
              title: 'A small asteroid',
              prompt: r`A rocky asteroid 10 m across (density 3,000 kg/m³) hits the atmosphere at 20 km/s. Its kinetic energy is $\frac12 mv^2$. How many kilotons of TNT is that? (1 kiloton = $4.18 \times 10^{12}$ J; nearest 5.)`,
              unit: 'kt',
              answer: 3000 * 4 / 3 * Math.PI * 125 * 0.5 * 4e8 / 4.184e12,
              tol: 3,
              explain: r`Mass $\approx 1.6 \times 10^6$ kg, energy $\approx 3 \times 10^{14}$ J $\approx 75$ kilotons, five Hiroshima bombs. Objects this size hit Earth roughly once a decade, usually exploding harmlessly high over the ocean.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A small nudge, early',
              prompt: r`Pushing an asteroid sideways by just 1 cm/s means that after $t$ seconds it has drifted $0.01\,t$ metres from its original path. How far (in km) after 10 years? (1 year $\approx 3.15 \times 10^7$ s.)`,
              unit: 'km',
              answer: (0.01 * 3.15e8) / 1000,
              tol: 5,
              wrong: [{ v: 0.01 * 3.15e8, relTol: 0.01, why: 'That’s in metres. Convert to km.' }],
              explain: r`$0.01 \times 3.15 \times 10^8 \approx 3{,}150$ km: about half of Earth's radius, from a nudge slower than a snail. (Orbital mechanics actually amplifies a change in speed along the orbit even more.) That's why the key to planetary defence is finding dangerous asteroids decades in advance.`,
            },
          ],
          recap: [
            r`Impact energy is $\frac12 mv^2$; speeds of tens of km/s make it enormous.`,
            'The Chicxulub impact released about 3 × 10²³ J, 66 million years ago.',
            'DART (2022) showed that spacecraft can nudge asteroids off course.',
          ],
        },
      ],
    },
    {
      title: 'Air and Balance',
      summary: 'Atmospheres and balance points.',
      lessons: [
        {
          id: 'atmospheres',
          title: 'Keeping an Atmosphere',
          summary: 'Thermal speed versus escape speed',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'A race against gravity',
              body: r`Gas molecules zip around at speeds set by temperature: the typical (root-mean-square) speed is
$$v_{\text{rms}} = \sqrt{\frac{3kT}{m}}$$
Light molecules move fastest. A few always have much more than the average speed, so if the average is more than about **one-sixth of the escape velocity**, a planet loses that gas over billions of years.`,
            },
            {
              type: 'numeric',
              title: 'Nitrogen on Earth',
              prompt: r`What's the rms speed of nitrogen molecules (mass 28 atomic mass units, $1.66 \times 10^{-27}$ kg each) at 288 K? ($k = 1.38 \times 10^{-23}$ J/K; km/s, 2 decimal places.)`,
              unit: 'km/s',
              answer: vrms(288, 28),
              tol: 0.01,
              wrong: [{ v: vrms(288, 28) * 1000, relTol: 0.01, why: 'That’s in m/s. Convert to km/s.' }],
              explain: r`About 0.51 km/s, far below a sixth of Earth's 11.2 km/s escape velocity (1.87 km/s). Nitrogen stays put.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Losing hydrogen',
              prompt: r`Hydrogen gas (H₂, mass 2) is the lightest molecule. Find the temperature at which its rms speed reaches **one-sixth** of Earth's escape velocity (1.87 km/s).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1000, ymin: 0, ymax: 4, grid: 100, gridY: 0.5, height: 260, axes: { xlabel: 'temperature (K)', ylabel: 'rms speed (km/s)' },
                params: { T: { min: 20, max: 1000, step: 1, value: 100, slider: false } },
                curves: [
                  { f: (T) => vrms(T, 2), color: 'violet', width: 3 },
                  { f: (T) => vrms(T, 4), color: 'teal', width: 2 },
                  { f: (T) => vrms(T, 28), color: 'blue', width: 2 },
                  { f: () => 11.2 / 6, color: 'coral', dash: true, width: 1.5 },
                ],
                points: [{ x: (p) => p.T, y: (p) => vrms(p.T, 2), drag: { x: 'T' }, color: 'coral' }],
                readout: (p) => r`${p.T} K: H₂ $${vrms(p.T, 2).toFixed(2)}$, He $${vrms(p.T, 4).toFixed(2)}$, N₂ $${vrms(p.T, 28).toFixed(2)}$ km/s`,
                goal: (p) => Math.abs(vrms(p.T, 2) - 11.2 / 6) < 0.005,
                hint: 'Find where the violet hydrogen curve crosses the dashed line.',
                solution: { T: 279 },
              },
              explain: r`About **280 K**, below ordinary temperatures, and Earth's upper atmosphere is far hotter (over 1,000 K). So Earth can't hold hydrogen or helium, which leak away to space: that's why the air is nitrogen and oxygen. Giant planets, with escape velocities of 20–60 km/s and cold upper atmospheres, kept their hydrogen.`,
            },
            {
              type: 'mcq',
              title: 'The airless Moon',
              prompt: r`Why does the Moon have essentially no atmosphere, while Saturn's moon Titan, a similar size, has a thick one?`,
              choices: [
                { t: 'Titan is much colder (about 94 K), so its gas molecules move slowly enough for its weak gravity to hold them', ok: true },
                { t: 'Titan is much more massive than the Moon', why: 'Titan is only about 80% more massive. The big difference is temperature.' },
                { t: 'The Moon’s gas was all used up by life', why: 'The Moon never had life. Its gas escaped because it’s warm and has weak gravity.' },
              ],
              explain: r`Lower temperature means slower molecules. Titan, 10 times further from the Sun, is cold enough to keep a nitrogen atmosphere denser than Earth's. The sunlit Moon reaches over 380 K.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen’s speed',
              prompt: r`Gas molecules move at a typical speed $\sqrt{\frac{3k_BT}{m}}$. For hydrogen molecules ($m = 3.35 \times 10^{-27}$ kg) at 300 K, what is that in km/s? (2 decimal places.)`,
              unit: 'km/s',
              answer: Math.sqrt(3 * 1.380649e-23 * 300 / 3.35e-27) / 1000,
              tol: 0.02,
              explain: r`About 1.93 km/s. That’s well below Earth’s 11.2 km/s escape speed, but the fastest molecules in the distribution still leak away over billions of years, which is why Earth has almost no free hydrogen.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Heavier is slower',
              prompt: r`At the same temperature, how many times faster is a hydrogen molecule (mass 2) than an oxygen molecule (mass 32)?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 16, why: r`Speed goes as $1/\sqrt{m}$: $\sqrt{16} = 4$.` }],
              explain: r`$\sqrt{\frac{32}{2}} = 4$. That's also why helium balloons leak faster than air-filled ones: the light, fast atoms find their way through the rubber more quickly.`,
            },
          ],
          recap: [
            r`Gas speed $v_{\text{rms}} = \sqrt{3kT/m}$: light and hot means fast.`,
            'A planet keeps a gas if its rms speed is below about 1/6 of escape velocity.',
            'Earth lost its hydrogen; cold Titan and the giant planets kept theirs.',
          ],
        },
        {
          id: 'lagrange',
          title: 'Lagrange Points',
          summary: 'Parking spots in space',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Balance points',
              body: r`In 1772, Joseph-Louis Lagrange found five special points near any two orbiting bodies, like the Sun and Earth, where a small object can keep pace with them, staying fixed relative to both. There, the two gravitational pulls and the motion of going round combine just right.

**L1** lies between the Sun and Earth, **L2** just beyond Earth on the far side from the Sun, and **L4** and **L5** lead and trail Earth in its orbit, forming equilateral triangles with the Sun.`,
            },
            {
              type: 'mcq',
              title: 'Why can L2 work?',
              prompt: r`An object further from the Sun than Earth would normally orbit more slowly and fall behind. Why can something at L2 keep pace with Earth?`,
              choices: [
                { t: 'Earth’s gravity adds to the Sun’s pull, so the object needs a faster orbit, exactly matching Earth’s year at L2', ok: true },
                { t: 'It uses its engines continuously', why: 'Only small corrections are needed; the balance itself is gravitational.' },
                { t: 'Earth’s gravity cancels the Sun’s', why: 'At L2 they pull in the same direction, both towards the Sun.' },
              ],
              explain: r`The extra inward pull from Earth means the object needs more centripetal force than the Sun alone provides at that distance, which happens to make its period exactly one year.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find L2',
              prompt: r`Move a spacecraft along the Sun–Earth line, beyond Earth. In a frame turning with Earth, find the distance where the forces balance (net acceleration zero): **L2**.`,
              widget: {
                kind: 'graph', xmin: 0.5, xmax: 3, ymin: -1, ymax: 0.4, grid: 0.25, gridY: 0.2, height: 260, padL: 48, axes: { xlabel: 'distance beyond Earth (million km)', ylabel: 'net acceleration (mm/s²)', xAt: 0.5 },
                params: { r: { min: 0.6, max: 3, step: 0.01, value: 2.5, slider: false } },
                curves: [{ f: (x) => l2Accel(x), color: 'violet', width: 3 }, { f: () => 0, color: 'ink', width: 1 }],
                points: [{ x: (p) => p.r, y: (p) => Math.max(-1, Math.min(0.4, l2Accel(p.r))), drag: { x: 'r' }, color: 'coral' }],
                readout: (p) => r`${p.r.toFixed(2)} million km: net acceleration $${l2Accel(p.r).toFixed(3)}$ mm/s² ${l2Accel(p.r) > 0 ? '(drifts outwards)' : '(falls inwards)'}`,
                goal: (p) => Math.abs(p.r - 1.5) < 0.015,
                hint: 'Find where the curve crosses zero.',
                solution: { r: 1.5 },
              },
              explain: r`About **1.5 million km** beyond Earth, roughly 4 times the Moon's distance. A handy approximation: $r \approx R\sqrt[3]{\frac{m}{3M}}$ with $\frac{m}{M}$ the Earth–Sun mass ratio. The James Webb Space Telescope orbits around L2, where Sun, Earth and Moon all lie in one direction, so a single sunshield keeps it cold.`,
            },
            {
              type: 'numeric',
              title: 'The cube-root rule',
              prompt: r`Estimate L1/L2's distance from Earth with $r \approx R\left(\frac{m}{3M}\right)^{1/3}$, using $R = 1.5 \times 10^8$ km and $\frac{m}{M} = 3 \times 10^{-6}$. (Millions of km, 1 decimal place.)`,
              unit: 'million km',
              answer: 150 * (1e-6) ** (1 / 3),
              tol: 0.06,
              wrong: [{ v: 0.15, tol: 0.01, why: 'Check the cube root: (10⁻⁶)^(1/3) = 0.01.' }],
              explain: r`$\frac{m}{3M} = 10^{-6}$, whose cube root is 0.01, so $r \approx 1.5$ million km. L1 is the same distance on the sunward side: the SOHO observatory has watched the Sun from there since 1996.`,
            },
            {
              type: 'numeric',
              title: 'Talking to L2',
              prompt: r`The James Webb telescope orbits near L2, about 1.5 million km from Earth. How long do radio signals take to reach it, in seconds?`,
              unit: 's',
              answer: 5,
              tol: 0.05,
              explain: r`$\frac{1.5 \times 10^9\ \text{m}}{3 \times 10^8\ \text{m/s}} = 5$ s: easy for control, while L2 keeps the Sun, Earth and Moon all behind its sunshield.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Trojans',
              prompt: r`L4 and L5 are stable: objects there stay put if nudged. What has collected at Jupiter's L4 and L5 points?`,
              choices: [
                { t: 'Thousands of "Trojan" asteroids, leading and trailing Jupiter in its orbit', ok: true },
                { t: 'Nothing: they’re empty', why: 'Over 10,000 Trojans are known, and NASA’s Lucy mission is visiting several.' },
                { t: 'Jupiter’s moons', why: 'Moons orbit Jupiter itself; Trojans share its orbit around the Sun.' },
              ],
              explain: r`L1, L2 and L3 are unstable (spacecraft there need small station-keeping burns), but L4 and L5 trap material, like marbles in a bowl. Jupiter's Trojans may be leftovers from the early Solar System.`,
            },
          ],
          recap: [
            'Lagrange points let small objects keep pace with two orbiting bodies.',
            r`L1 and L2 sit about $R(m/3M)^{1/3}$ from the smaller body: 1.5 million km for Earth.`,
            'L4 and L5 are stable and collect Trojan asteroids.',
          ],
        },
        {
          id: 'hill',
          title: 'Holding On to Moons',
          summary: 'The Hill sphere',
          icon: 'moon',
          steps: [
            {
              type: 'explain',
              title: 'A tug of war with the Sun',
              body: r`A moon orbits its planet, but the Sun is pulling on it too. Close to the planet, the planet wins; far away, the Sun’s tidal pull drags the moon off into its own orbit around the Sun. The boundary is the **Hill sphere**, with radius
$$r_H \approx a\left(\frac{m}{3M}\right)^{1/3},$$
where $a$ is the planet’s distance from the Sun, $m$ the planet’s mass and $M$ the Sun’s.`,
            },
            {
              type: 'numeric',
              title: 'Jupiter’s Hill sphere',
              prompt: r`Earth's Hill radius works out at about 1.5 million km (the same distance as L1 and L2). Jupiter is $7.8 \times 10^8$ km from the Sun and has $9.5 \times 10^{-4}$ of the Sun’s mass. What is its Hill radius, in millions of km? (Nearest whole number.)`,
              unit: 'million km',
              answer: 7.8e8 * Math.cbrt(9.5e-4 / 3) / 1e6,
              tol: 0.6,
              wrong: [{ v: 7.8e8 * Math.cbrt(9.5e-4) / 1e6, tol: 0.6, why: r`Divide the mass ratio by 3 before taking the cube root: $\left(\frac{9.5 \times 10^{-4}}{3}\right)^{1/3}$.` }],
              explain: r`$\frac{m}{3M} \approx 3.2 \times 10^{-4}$, whose cube root is about 0.068, so $r_H \approx 0.068 \times 7.8 \times 10^8 \approx 53$ million km: 35 times Earth's. That vast sphere lets Jupiter hold on to nearly a hundred moons, some orbiting over 20 million km out.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A heavier Earth',
              prompt: r`Imagine a planet at Earth’s distance from the Sun but with a different mass. Find the mass (in Earth masses) whose Hill sphere reaches **3 million km**, twice Earth’s.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -4, ymax: 4, grid: false, axes: false, maxWidth: 340, pad: 6,
                params: { m: { min: 0.1, max: 20, step: 0.1, value: 2, label: 'planet mass', color: 'teal', format: (v) => `${v.toFixed(1)} Earths` } },
                extra: ({ plot, p, s }) => { const rH = 1.496 * Math.cbrt(p.m); return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(rH) - plot.X(0), class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(0.3844) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.2 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-blue' }), s('circle', { cx: plot.X(3), cy: plot.Y(0), r: 5, class: 'fl-amber' }), s('text', { x: plot.X(3), y: plot.Y(0.35), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: '3 million km' })]; },
                readout: (p) => `Hill radius **${(1.496 * Math.cbrt(p.m)).toFixed(2)} million km** (the small circle is the Moon’s orbit)`,
                goal: (p) => Math.abs(p.m - 8) < 0.05,
                hint: 'The Hill radius grows as the cube root of the mass. To double it…',
                solution: { m: 8 },
              },
              explain: r`Doubling $r_H$ needs $2^3 = 8$ times the mass. The cube root makes the Hill sphere grow slowly: at Earth's distance, Jupiter's 318 Earth masses would give a Hill radius only about 7 times Earth's. Its real Hill sphere is 35 times bigger mainly because it orbits 5 times further out.`,
            },
            {
              type: 'mcq',
              title: 'Moonless Mercury',
              prompt: r`Mercury and Venus have no moons. Which reason does the Hill sphere suggest?`,
              choices: [
                { t: 'Being close to the Sun gives them small Hill spheres, so the Sun easily steals any moon', ok: true },
                { t: 'They are too hot for moons', why: 'Temperature doesn’t stop moons. Gravity’s tug of war is the issue.' },
                { t: 'They spin too slowly', why: 'Spin hardly matters. The Hill sphere depends on mass and distance from the Sun.' },
              ],
              explain: r`$r_H$ is proportional to the distance $a$ from the Sun, so inner planets have cramped Hill spheres (Mercury’s is only about 0.2 million km). In practice, only orbits within about a third to half of the Hill radius stay stable for long, leaving very little room.`,
            },
            {
              type: 'numeric',
              title: 'Where the Moon sits',
              prompt: r`The Moon orbits 384,400 km from Earth. What fraction of Earth’s 1.5 million km Hill radius is that? (2 decimal places.)`,
              answer: 384400 / 1.496e6,
              tol: 0.01,
              explain: r`$\frac{384{,}400}{1{,}496{,}000} \approx 0.26$: comfortably inside the stable zone. Satellites placed much beyond about half the Hill radius would eventually be pulled away by the Sun.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Moving out',
              prompt: r`A planet with Earth’s mass orbits 4 times further from the Sun than Earth. How many times larger is its Hill sphere?`,
              answer: 4,
              wrong: [{ v: 1.587, why: r`The cube root applies to the mass ratio, not the distance. $r_H$ is directly proportional to $a$.` }],
              explain: r`$r_H \propto a$ when the mass is unchanged, so it is **4 times** larger. Distant giant planets have huge Hill spheres, which is why they collect dozens of small captured moons.`,
            },
          ],
          recap: [
            r`Hill radius $r_H \approx a\,(m/3M)^{1/3}$: where the planet beats the Sun’s tidal pull.`,
            'It grows with distance from the Sun and the cube root of the planet’s mass.',
            'Stable moons orbit well inside it (the Moon is at about a quarter).',
          ],
        },
      ],
    },
  ],
};
