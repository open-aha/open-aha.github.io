import { fix, sig } from '../lib/svg.js';

const r = String.raw;
const f2 = (v) => (Math.round(v * 100) / 100).toString();
const f3 = (v) => (Math.round(v * 1000) / 1000).toString();

// fraction of a uniform star's disc (radius 1) covered by a planet of radius k at centre distance d
function overlap(d, k) {
  if (d >= 1 + k) return 0;
  if (d <= 1 - k) return k * k;
  const a = Math.acos((d * d + k * k - 1) / (2 * d * k)), b = Math.acos((d * d + 1 - k * k) / (2 * d));
  return (k * k * a + b - 0.5 * Math.sqrt(Math.max(0, (-d + k + 1) * (d + k - 1) * (d - k + 1) * (d + k + 1)))) / Math.PI;
}

// radial velocity: semi-amplitude (m/s) for planet mass m (Jupiters) and period P (days) around a Sun-like star
const rvK = (m, P) => 28.4 * m * (P / 365.25) ** (-1 / 3);
// fake observations of a 0.47-Jupiter planet with a 4.2-day orbit, with seeded noise
const RV_DATA = (() => {
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  return Array.from({ length: 26 }, (_, i) => { const t = 0.2 + i * 0.46 + rnd() * 0.2; return [t, rvK(0.47, 4.2) * Math.sin((2 * Math.PI * t) / 4.2) + (rnd() - 0.5) * 9]; });
})();
// equilibrium temperature (K) for luminosity L (Suns), distance d (AU), albedo 0.3
const tEq = (L, d) => 278.6 * L ** 0.25 / Math.sqrt(d) * 0.7 ** 0.25;
// microlensing magnification at separation u (Einstein radii)
const magnif = (u) => (u * u + 2) / (u * Math.sqrt(u * u + 4));
// mass (Earths) and mean radius (Earths) of solar-system planets
const PLANETS = [['Mars', 0.107, 0.532], ['Venus', 0.815, 0.95], ['Earth', 1, 1], ['Uranus', 14.5, 3.98], ['Neptune', 17.1, 3.86], ['Saturn', 95.2, 9.14], ['Jupiter', 317.8, 10.97]];
const dens = (M, R) => (5.51 * M) / R ** 3;

export default {
  id: 'exoplanets',
  subject: 'physics',
  title: 'Exoplanets',
  level: 'Intermediate',
  cover: 'exoplanets',
  tagline: 'Finding worlds around other stars, weighing them, and asking whether anyone is out there.',
  description: r`Thousands of planets have been found orbiting other stars, yet almost none have ever been seen directly. Learn how astronomers detect them from tiny dips in starlight and tiny wobbles of their stars, work out their densities, find planets with gravitational lenses, work out which could hold liquid water, and estimate how many civilisations might share our galaxy.`,
  prereq: 'Astronomy & Cosmology',
  chapters: [
    {
      title: 'Finding Planets',
      summary: 'Dips and wobbles.',
      lessons: [
        {
          id: 'transits',
          title: 'The Transit Method',
          summary: 'Tiny shadows',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Mini eclipses',
              body: r`If a planet's orbit is lined up edge-on from our point of view, the planet passes in front of its star once per orbit, blocking a little of its light: a **transit**. Space telescopes like Kepler and TESS have watched hundreds of thousands of stars for these tiny, repeating dips.

The fraction of light blocked is the planet's disc area over the star's:
$$\text{dip} \approx \left(\frac{R_{\text{planet}}}{R_{\text{star}}}\right)^2$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fit the light curve',
              prompt: r`A star's brightness dips by **1%** during a transit (the dashed line). Adjust the planet's size until the model light curve matches.`,
              widget: {
                kind: 'graph', xmin: -1.6, xmax: 1.6, ymin: 0.97, ymax: 1.004, grid: 0.4, gridY: 0.005, height: 300, padL: 58, axes: { xlabel: 'time', ylabel: 'brightness', xfmt: () => '', xAt: -1.6 },
                params: { k: { min: 0.02, max: 0.16, step: 0.01, value: 0.05, label: 'planet radius ÷ star radius', color: 'blue', format: (v) => v.toFixed(2) } },
                curves: [{ f: (t, p) => 1 - overlap(Math.abs(t), p.k), color: 'blue', width: 3 }, { f: () => 0.99, color: 'coral', dash: true }],
                readout: (p) => r`dip depth $= (${p.k.toFixed(2)})^2 = ${fix(p.k * p.k * 100, 2)}\%$`,
                goal: (p) => Math.abs(p.k * p.k - 0.01) < 0.0011,
                hint: r`Dip $= k^2$. Which $k$ gives $k^2 = 0.01$?`,
                solution: { k: 0.1 },
              },
              explain: r`$k^2 = 0.01$ gives $k = 0.1$: the planet is a tenth of the star's radius. Around a Sun-like star, that's about the size of **Jupiter**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Grazing transits',
              body: r`Orbits aren't always lined up perfectly. The **impact parameter** $b$ says how far from the star's centre the planet crosses, in units of the star's radius ($b = 0$ straight across the middle). Change it.`,
              widget: {
                kind: 'graph', xmin: -1.6, xmax: 1.6, ymin: 0.986, ymax: 1.002, grid: 0.4, gridY: 0.004, height: 280, padL: 58, axes: { xlabel: 'time', ylabel: 'brightness', xfmt: () => '', xAt: -1.6 },
                params: { b: { min: 0, max: 1.1, step: 0.01, value: 0, label: 'impact parameter b', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (t, p) => 1 - overlap(Math.hypot(t, p.b), 0.1), color: 'violet', width: 3, n: 400 }],
                readout: (p) => (p.b >= 1.1 ? 'The planet misses the star: no transit.' : p.b > 0.9 ? 'A **grazing** transit: the planet only clips the edge, giving a shallow V-shaped dip.' : `Transit lasts **${Math.round(100 * Math.sqrt(1.21 - p.b * p.b) / 1.1)}%** as long as a central one.`),
              },
              after: r`Off-centre transits are shorter, because the planet crosses a shorter chord of the star, and grazing ones are shallower and V-shaped. Fitting the exact shape of a light curve tells astronomers the tilt of the orbit, not just the size of the planet.`,
            },
            {
              type: 'numeric',
              title: 'Transit odds',
              body: r`For a randomly tilted orbit, the chance that we see a transit is about $\dfrac{R_\text{star}}{a}$, where $a$ is the orbit's radius.`,
              prompt: r`The Sun's radius is $696{,}000$ km and Earth's orbit is $150$ million km. What is the chance (as a percentage) that a distant alien astronomer sees Earth transit the Sun?`,
              unit: '%',
              answer: 696000 / 150e6 * 100,
              tol: 0.02,
              wrong: [{ v: 0.00464, tol: 0.0003, why: 'That’s the fraction. Multiply by 100 for a percentage.' }],
              explain: r`$\frac{696{,}000}{150{,}000{,}000} \approx 0.0046$, about $0.46\%$: only about 1 in 200 Earth-like orbits is lined up for us to see. That's why Kepler watched about 150,000 stars at once. Close-in planets transit far more often, another selection effect.`,
            },
            {
              type: 'numeric',
              title: 'Working backwards',
              prompt: r`A Sun-sized star dims by $0.25\%$ during each transit. What is the planet's radius, as a fraction of the star's?`,
              answer: 0.05,
              tol: 0.001,
              wrong: [{ v: 0.0025, tol: 0.0001, why: r`That's the dip itself. The dip is the radius ratio **squared**, so take the square root.` }],
              explain: r`$\sqrt{0.0025} = 0.05$: the planet's radius is $0.05 \times 696{,}000 \approx 35{,}000$ km, about 5.5 Earths, between Neptune and Saturn in size. The depth of the dip is how astronomers measure a transiting planet's size.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Another Earth',
              prompt: r`Earth's radius is about $1/109$ of the Sun's. How deep would Earth's transit dip be, as a percentage? (3 decimal places.)`,
              unit: '%',
              answer: (1 / 109) ** 2 * 100,
              tol: 0.0006,
              wrong: [{ v: 0.917, tol: 0.003, why: r`That's $1/109$ as a percentage. The dip goes as the **square**.` }, { v: 0.000084, tol: 0.000005, why: 'That’s the fraction of light blocked. Multiply by 100 to get a percentage.' }],
              explain: r`$\left(\dfrac{1}{109}\right)^2 \approx 0.000084 = 0.0084\%$. That's like spotting a gnat crossing a car headlight from far away, which is why finding Earth-sized planets takes extremely precise, stable space telescopes.`,
            },
          ],
          recap: [
            r`Transit dip $\approx (R_{\text{planet}}/R_{\text{star}})^2$.`,
            'Jupiter blocks about 1% of the Sun. Earth blocks about 0.008%.',
            'Transits only work for orbits lined up edge-on to us.',
          ],
        },
        {
          id: 'wobble',
          title: 'Wobbling Stars',
          summary: 'The radial-velocity method',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Both bodies orbit',
              body: r`A planet doesn't simply orbit its star: both orbit their common **centre of mass**. The star moves in a small circle, alternately toward and away from us, and its light is **Doppler shifted**: slightly bluer as it approaches, slightly redder as it recedes. Measuring this periodic shift reveals the planet.

In 1995, Michel Mayor and Didier Queloz found **51 Pegasi b** this way: the first planet discovered orbiting a Sun-like star. They shared the 2019 Nobel Prize in Physics.`,
            },
            { /*anim:exoplanets*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Watching the star wobble',
              body: r`A star and a giant planet orbit their common {ink:centre of mass} (sizes and the wobble are exaggerated). We watch from far below the picture. On the right are a few dark lines in the star's spectrum, and below them the star's speed away from us, traced over time.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.7, xmax: 9.2, ymin: -3.1, ymax: 2.9, grid: false, axes: false, maxWidth: 640,
                animate: { param: 't', speed: 0.9, max: 400 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const th = p.t, R = (r) => plot.X(r) - plot.X(0), els = [], v = -Math.cos(th);
                  const T = (x, y, text, anchor = 'middle', col = 'ink-2') => s('text', { x: plot.X(x), y: plot.Y(y), 'text-anchor': anchor, class: 'halo-text', style: `font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));fill:var(--${col})`, text });
                  // orbits
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: R(2), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }));
                  els.push(s('circle', { cx: plot.X(-0.35 * Math.cos(th)), cy: plot.Y(-0.35 * Math.sin(th)), r: R(0.5), class: 'fl-amber', opacity: 0.85 }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: R(0.35), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
                  els.push(s('path', { d: `M${plot.X(0) - 5} ${plot.Y(0)}h10M${plot.X(0)} ${plot.Y(0) - 5}v10`, stroke: 'var(--ink)', 'stroke-width': 2 }));
                  els.push(s('circle', { cx: plot.X(2 * Math.cos(th)), cy: plot.Y(2 * Math.sin(th)), r: 6, class: 'fl-blue' }));
                  els.push(T(0, -2.85, 'to Earth ↓'));
                  // spectrum strip
                  const x0 = 3.4, x1 = 9.0, shift = 0.3 * v;
                  els.push(s('rect', { x: plot.X(x0), y: plot.Y(2.6), width: R(x1 - x0), height: R(0.9), rx: 4, class: v > 0.15 ? 'fl-coral-soft' : v < -0.15 ? 'fl-blue-soft' : 'fl-surface', stroke: 'var(--line-2)' }));
                  for (const lx of [4.1, 4.9, 6.0, 7.2, 8.1]) {
                    els.push(s('line', { x1: plot.X(lx), x2: plot.X(lx), y1: plot.Y(2.6), y2: plot.Y(2.42), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                    els.push(s('line', { x1: plot.X(lx + shift), x2: plot.X(lx + shift), y1: plot.Y(2.4), y2: plot.Y(1.7), stroke: 'var(--ink)', 'stroke-width': 3 }));
                  }
                  els.push(T(x0, 1.3, '← bluer', 'start', 'blue'), T(x1, 1.3, 'redder →', 'end', 'coral'));
                  // speed away from us over the last full orbit
                  const yc = -1.1, A = 1.2, pts = [];
                  for (let i = 0; i <= 120; i++) { const tt = th - 2 * Math.PI + (2 * Math.PI * i) / 120; pts.push(`${i ? 'L' : 'M'}${plot.X(x0 + ((x1 - x0) * i) / 120).toFixed(1)} ${plot.Y(yc - A * Math.cos(tt)).toFixed(1)}`); }
                  els.push(s('line', { x1: plot.X(x0), x2: plot.X(x1), y1: plot.Y(yc), y2: plot.Y(yc), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }));
                  els.push(s('circle', { cx: plot.X(x1), cy: plot.Y(yc + A * v), r: 5.5, class: 'fl-violet' }));
                  els.push(T(x0, yc + A + 0.15, 'away', 'start', 'ink-3'), T(x0, yc - A - 0.45, 'towards', 'start', 'ink-3'));
                  return els;
                },
                readout: (p) => { const v = -Math.cos(p.t); return Math.abs(v) < 0.15 ? 'star moving across our view: no shift' : `star moving ${v > 0 ? 'away from' : 'towards'} us at ${fix(12.5 * Math.abs(v), 1)} m/s: lines shifted ${v > 0 ? '{coral:redder}' : '{blue:bluer}'}`; },
              },
              after: r`We can't see the planet, but the star's lines slide back and forth once per orbit. The size of the swing gives the star's speed (for the Sun pulled by Jupiter, about 12.5 m/s, a brisk cycling pace), and its period is the planet's year. The shifts are tiny, about 4 parts in 100 million of the wavelength, which is why it took until 1995 to find the first planet around a Sun-like star this way.`,
            },
            {
              type: 'numeric',
              title: 'The Sun’s wobble',
              prompt: r`Jupiter makes the Sun wobble at about 12.5 m/s. Earth, about 318 times less massive than Jupiter but closer in, makes it wobble at about 0.09 m/s. Roughly how many times smaller is Earth's signal?`,
              unit: '×',
              answer: 12.5 / 0.09,
              relTol: 0.05,
              wrong: [{ v: 318, why: r`Earth is 318× less massive, but closer to the Sun, which partly makes up for it. Divide the speeds: $12.5 / 0.09$.` }, { v: 1.125, tol: 0.05, why: 'Divide the speeds rather than multiplying.' }],
              explain: r`$12.5 / 0.09 \approx 140$. Earth's pull moves the Sun at just 9 cm/s, about walking speed for a tortoise. Today's best spectrographs are only just approaching that precision.`,
            },
            {
              type: 'interactive',
              title: 'Fit the wobble',
              body: r`The dots are measurements of a Sun-like star's speed towards (negative) or away from (positive) us. Adjust the planet's orbital period and mass until the curve fits the data.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12.4, ymin: -120, ymax: 120, grid: false, height: 300, padL: 50,
                axes: { xticksBelow: true, xlabel: 'days', ylabel: 'speed (m/s)', xticks: 2, yticks: 30, xlabelBelow: 'edge' },
                params: {
                  P: { min: 2, max: 8, step: 0.05, value: 6, label: 'period', color: 'blue', format: (v) => `${v.toFixed(2)} days` },
                  m: { min: 0.1, max: 1.5, step: 0.01, value: 0.8, label: 'planet mass', color: 'coral', format: (v) => `${v.toFixed(2)} Jupiters` },
                },
                curves: [{ f: (t, p) => rvK(p.m, p.P) * Math.sin((2 * Math.PI * t) / p.P), color: 'blue', width: 2.5, n: 400 }],
                extra: ({ plot, s }) => RV_DATA.map(([t, v]) => s('circle', { cx: plot.X(t), cy: plot.Y(v), r: 4, class: 'fl-coral' })),
                readout: (p) => `Wobble amplitude **${rvK(p.m, p.P).toFixed(0)} m/s**`,
                goal: (p) => Math.abs(p.P - 4.2) < 0.15 && Math.abs(p.m - 0.47) < 0.06,
                hint: 'Match the period first (count the days from one peak to the next), then the height of the peaks.',
                solution: { P: 4.2, m: 0.47 },
              },
              explain: r`A period of 4.2 days and an amplitude of about 59 m/s means a planet of about half Jupiter's mass, much like 51 Pegasi b itself. Strictly, the wobble gives $m \sin i$, where $i$ is the orbit's tilt, so this is a **minimum** mass: a tilted orbit hides some of the motion from us.`,
            },
            {
              type: 'numeric',
              title: 'How close in?',
              body: r`Kepler's third law, for a star of the Sun's mass, says $a^3 = P^2$ with $a$ in AU and $P$ in years.`,
              prompt: r`How far from its star is a planet with a 4.2-day orbit, in AU? (3 decimal places.)`,
              unit: 'AU',
              answer: (4.2 / 365.25) ** (2 / 3),
              tol: 0.002,
              wrong: [{ v: (4.2 / 365.25) ** 1.5, tol: 0.001, why: r`$a = P^{2/3}$, not $P^{3/2}$.` }, { v: 4.2 / 365.25, tol: 0.001, why: r`That's $P$ in years. Now use $a = P^{2/3}$.` }],
              hint: r`$P = 4.2/365.25$ years, and $a = P^{2/3}$.`,
              explain: r`$P = 0.0115$ years, so $a = 0.0115^{2/3} \approx 0.051$ AU, about 8 times closer than Mercury. At that distance a giant planet is roasted to over 1000 °C, hence "hot Jupiter".`,
            },
            {
              type: 'numeric',
              title: 'Balancing momenta',
              prompt: r`A star is 1,000 times more massive than its planet, which orbits at 13 km/s. Both orbit their common centre of mass, so the star’s speed is smaller by the mass ratio. How fast does the star move, in m/s?`,
              unit: 'm/s',
              answer: 13,
              tol: 0.01,
              explain: r`$\frac{13{,}000}{1000} = 13$ m/s, close to the Sun’s wobble due to Jupiter (12.5 m/s). Spectrographs can now measure wobbles below 1 m/s, walking pace.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Hot Jupiters',
              prompt: r`51 Pegasi b is a giant planet orbiting its star every 4.2 days, far closer than Mercury orbits the Sun. Why were "hot Jupiters" like it among the first planets found?`,
              choices: [
                { t: 'Big planets in tight orbits make the largest and fastest wobbles and transits, so they’re the easiest to detect', ok: true },
                { t: 'They’re the most common kind of planet', why: 'They’re actually fairly rare. They were found first because they’re easiest to spot.' },
                { t: 'They glow brightly from their heat', why: 'Detection relied on the star’s wobble, not on the planet’s own glow.' },
              ],
              explain: r`Big mass and short distance mean a large, fast wobble, and a short orbit means you can see many cycles quickly. This is a **selection effect**: the easiest planets to find were found first, not necessarily the most common. Smaller, more distant planets turned up as techniques improved.`,
            },
          ],
          recap: [
            'Stars wobble around the centre of mass they share with their planets.',
            'The wobble shows up as a periodic Doppler shift.',
            'Early discoveries favoured big, close-in planets: a selection effect.',
          ],
        },
      ],
    },
    {
      title: 'Is Anyone Out There?',
      summary: 'Habitable zones and the Drake equation.',
      lessons: [
        {
          id: 'habitable',
          title: 'The Habitable Zone',
          summary: 'Not too hot, not too cold',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'The Goldilocks zone',
              body: r`The **habitable zone** is the range of distances from a star where a planet could have liquid water on its surface, given a suitable atmosphere. Starlight spreads out by the inverse-square law, so the energy a planet receives is
$$F \propto \frac{L}{d^2}$$
where $L$ is the star's luminosity and $d$ the distance. Brighter stars have farther-out habitable zones.`,
            },
            {
              type: 'numeric',
              title: 'A brighter star',
              prompt: r`A star is 4 times as luminous as the Sun. How far away (in AU, where Earth is at 1 AU) would a planet receive the same energy as Earth does?`,
              unit: 'AU',
              answer: 2,
              wrong: [{ v: 4, why: r`Energy goes as $L/d^2$: four times the luminosity needs $d^2$ four times bigger, so $d = 2$.` }, { v: 16, why: r`$d^2 = 4$, so $d = 2$, not 16.` }],
              explain: r`Equal flux needs $\dfrac{4}{d^2} = \dfrac{1}{1^2}$, so $d = 2$ AU. For a dim red dwarf with 1% of the Sun's luminosity, the habitable zone is at just 0.1 AU, far inside Mercury's orbit.`,
            },
            {
              type: 'interactive',
              title: 'Planet thermostat',
              body: r`A planet's **equilibrium temperature** balances the starlight it absorbs (here 70% of it, like Earth) against the heat it radiates: $T \approx 255\text{ K} \times \dfrac{(L/L_\odot)^{1/4}}{\sqrt{d / 1\text{ AU}}}$. Earth's is 255 K; its atmosphere's greenhouse effect warms it to 288 K. Choose a dim **red dwarf** (at most 1% of the Sun's luminosity), then find an orbit where the planet is between 230 K and 280 K.`,
              widget: {
                kind: 'graph', xmin: -2.05, xmax: 0.75, ymin: 0, ymax: 700, grid: false, height: 280, padL: 50,
                axes: { xlabel: 'distance (AU, log scale)', ylabel: 'temperature (K)', xticks: 1, yticks: 100, xfmt: (v) => String(10 ** v) },
                params: {
                  lL: { min: -3, max: 1, step: 0.05, value: 0, label: 'star luminosity', color: 'amber', format: (v) => `${sig(10 ** v, 2)} L☉` },
                  ld: { min: -2, max: 0.7, step: 0.01, value: 0, label: 'orbit', color: 'blue', format: (v) => `${sig(10 ** v, 2)} AU` },
                },
                curves: [{ f: (x, p) => tEq(10 ** p.lL, 10 ** x), color: 'amber', width: 2.5 }],
                points: [{ x: (p) => p.ld, y: (p) => Math.min(690, tEq(10 ** p.lL, 10 ** p.ld)), color: 'blue', drag: { x: 'ld' } }],
                extra: ({ plot, s }) => [s('rect', { x: plot.X(-2.05), y: plot.Y(280), width: plot.X(0.75) - plot.X(-2.05), height: plot.Y(230) - plot.Y(280), class: 'fl-green', opacity: 0.18 })],
                readout: (p) => `Equilibrium temperature **${Math.round(tEq(10 ** p.lL, 10 ** p.ld))} K** (${Math.round(tEq(10 ** p.lL, 10 ** p.ld) - 273)} °C)`,
                goal: (p) => p.lL <= -2 + 1e-9 && tEq(10 ** p.lL, 10 ** p.ld) >= 230 && tEq(10 ** p.lL, 10 ** p.ld) <= 280,
                hint: 'With 1% of the Sun’s light, Earth-like warmth needs 1% of the distance squared: about 0.1 AU.',
                solution: { lL: -2, ld: -1 },
              },
              explain: r`At 1% of the Sun's luminosity, the right temperature comes at about $\sqrt{0.01} = 0.1$ AU. So close in, the star's tides lock the planet so that one side always faces the star, as the Moon does to Earth. The TRAPPIST-1 system has seven Earth-sized planets packed inside 0.07 AU of an even dimmer star, three of them in its habitable zone.`,
            },
            {
              type: 'mcq',
              title: 'Red dwarf worlds',
              prompt: 'Most stars in the galaxy are red dwarfs. What is a concern about life on their habitable-zone planets?',
              choices: [
                { t: 'Young red dwarfs blast out flares that could strip away a close planet’s atmosphere', ok: true },
                { t: 'Red dwarfs are too short-lived for life to evolve', why: 'The opposite: red dwarfs burn so slowly they last trillions of years, far longer than the Sun.' },
                { t: 'Their light is too dim for any planet to be warm', why: 'A planet close enough can be just as warm as Earth.' },
              ],
              explain: r`Red dwarfs live for trillions of years, but they flare violently when young, and their habitable zones are so close that planets take the full blast. Whether such planets keep their atmospheres is one of the big questions JWST is investigating, for example by measuring how TRAPPIST-1's planets glow.`,
            },
            {
              type: 'numeric',
              title: 'A bright white star',
              prompt: r`The habitable zone’s distance scales as $\sqrt{L}$. Sirius A is about 25 times as luminous as the Sun. How far out is its habitable zone, in AU (Earth’s is at 1 AU)?`,
              unit: 'AU',
              answer: 5,
              tol: 0.05,
              wrong: [{ v: 25, tol: 0.1, why: r`Flux falls as $1/d^2$, so distance grows as $\sqrt{L}$: take the square root of 25.` }],
              explain: r`$\sqrt{25} = 5$ AU, about where Jupiter orbits the Sun. But a star twice the Sun's mass lives only about a billion years on the main sequence, probably too short for complex life to evolve.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Venus',
              prompt: r`Venus orbits just inside the inner edge of the Sun's habitable zone, Earth is in it, and Mars is near its outer edge. Yet Venus's surface is about 465 °C, hotter than Mercury's. Why?`,
              choices: [
                { t: 'Its thick carbon dioxide atmosphere produces a runaway greenhouse effect', ok: true },
                { t: 'It is closer to the Sun than Mercury', why: 'Venus is farther from the Sun than Mercury. Its atmosphere is the reason.' },
                { t: 'It has active volcanoes everywhere', why: 'Volcanism doesn’t explain its uniformly scorching surface. A thick CO₂ atmosphere does.' },
              ],
              explain: r`Venus's atmosphere is about 96% CO₂ and 90 times denser than Earth's, trapping heat in a runaway greenhouse. Distance alone doesn't decide habitability: atmosphere matters enormously, as the Energy & Climate course showed.`,
            },
          ],
          recap: [
            r`Received energy $\propto L/d^2$.`,
            'Brighter stars have farther habitable zones.',
            'Atmospheres can make or break habitability, as Venus shows.',
          ],
        },
        {
          id: 'drake',
          title: 'The Drake Equation',
          summary: 'Organising our ignorance',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'A chain of factors',
              body: r`In 1961, Frank Drake wrote down an estimate for the number $N$ of civilisations in our galaxy whose signals we might detect:
$$N = R_* \cdot f_p \cdot n_e \cdot f_l \cdot f_i \cdot f_c \cdot L$$
star formation rate × fraction of stars with planets × habitable planets per system × fraction where life appears × fraction developing intelligence × fraction becoming detectable × how many years they stay detectable.

Exoplanet surveys have pinned down the first factors: most stars have planets. The later factors remain almost complete guesses.`,
            },
            {
              type: 'numeric',
              title: 'Make an estimate',
              prompt: r`Try these values: $R_* = 2$ stars per year, $f_p = 1$, $n_e = 0.2$, $f_l = 0.1$, $f_i = 0.1$, $f_c = 0.1$, $L = 10{,}000$ years. What is $N$?`,
              answer: 4,
              wrong: [{ v: 0.0004, tol: 0.00005, why: 'Don’t forget to multiply by L = 10,000 years.' }, { v: 40, why: r`Check: $2 \times 1 \times 0.2 = 0.4$, then $\times 0.1^3 = 0.0004$, then $\times 10{,}000 = 4$.` }],
              explain: r`$2 \times 1 \times 0.2 \times 0.1 \times 0.1 \times 0.1 \times 10{,}000 = 4$. But change the guesses for the last few factors and $N$ swings from much less than 1 (we're alone) to millions. The equation's real value is in showing what we'd need to know.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Optimist or pessimist?',
              body: r`Keep $R_* = 2$, $f_p = 1$, $n_e = 0.2$ and $f_c = 0.1$, and choose your own values for the most uncertain factors: the chance that life appears, the chance that it becomes intelligent, and how long a civilisation keeps signalling.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: false, axes: false, height: 120,
                params: {
                  fl: { min: -6, max: 0, step: 0.5, value: -1, label: r`life appears ($f_l$)`, color: 'green', format: (v) => (10 ** v < 0.01 ? `$10^{${fix(v, 1)}}$` : sig(10 ** v, 2)) },
                  fi: { min: -6, max: 0, step: 0.5, value: -1, label: r`intelligence ($f_i$)`, color: 'violet', format: (v) => (10 ** v < 0.01 ? `$10^{${fix(v, 1)}}$` : sig(10 ** v, 2)) },
                  lL: { min: 2, max: 8, step: 0.5, value: 4, label: 'lifetime L', color: 'amber', format: (v) => `${Math.round(10 ** v).toLocaleString()} yr` },
                },
                extra: ({ plot, p, s }) => {
                  const N = 2 * 1 * 0.2 * 10 ** p.fl * 10 ** p.fi * 0.1 * 10 ** p.lL;
                  return [s('text', { x: plot.X(0.5), y: plot.Y(0.45), class: 'lbl', 'text-anchor': 'middle', style: 'font-size:30px', text: `N ≈ ${N >= 1000 ? Math.round(Number(N.toPrecision(2))).toLocaleString('en-US') : sig(N, 2)}` })];
                },
                readout: (p) => { const N = 0.04 * 10 ** (p.fl + p.fi + p.lL); return N >= 1 ? 'Other civilisations should be out there now.' : `Much less than 1: we may well be alone in the galaxy right now.`; },
              },
              after: r`Reasonable-sounding guesses give anything from $10^{-10}$ to millions. Each factor we can't measure multiplies the uncertainty. That's not a flaw in the equation: it shows exactly which measurements (like finding life on another world) would teach us the most.`,
            },
            {
              type: 'numeric',
              title: 'Earths in the Milky Way',
              prompt: r`Data from the Kepler telescope suggest that very roughly 1 in 5 Sun-like stars has an Earth-sized planet in its habitable zone. If the Milky Way has about 100 billion such stars (a generous round number), how many such planets is that, in billions?`,
              unit: 'billion',
              answer: 20,
              tol: 0.1,
              explain: r`$100 \times 0.2 = 20$ billion potentially Earth-like planets in our galaxy alone, though the estimate is uncertain by a factor of several either way. The hard terms in the Drake equation are the biological and technological ones, not the planets.`,
            },
            {
              type: 'mcq',
              title: 'The Great Filter',
              prompt: r`One response to the Fermi paradox is the idea of a "Great Filter". What is it?`,
              choices: [
                { t: r`Some step, from life arising to spreading across space, is so unlikely that almost no civilisations get past it`, ok: true },
                { t: r`A force field that hides alien civilisations`, why: r`It’s a statistical idea, not a physical barrier.` },
                { t: r`The Milky Way’s dust, which blocks alien signals`, why: r`Dust blocks visible light, but radio signals would get through.` },
              ],
              explain: r`If the filter lies behind us (say, the origin of complex life), we are rare and lucky. If it lies ahead, it bodes ill for our future. Finding even simple life on Mars or Europa would be evidence that the early steps are easy.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Fermi paradox',
              prompt: r`The galaxy is about 13 billion years old, and even slow interstellar travel could cross it in tens of millions of years. Enrico Fermi asked: if civilisations are common, where is everybody? Which is a proposed explanation?`,
              choices: [
                { t: 'All of these have been proposed: life is rare, civilisations don’t last, or they’re too far away or too quiet to notice', ok: true },
                { t: 'It has been solved: aliens have been found', why: 'No confirmed evidence of extraterrestrial life has ever been found.' },
                { t: 'The galaxy is too young for life', why: 'The galaxy is billions of years older than Earth, so time isn’t obviously the limit.' },
              ],
              explain: r`Nobody knows. Perhaps life or intelligence is extremely rare, perhaps civilisations are short-lived, perhaps interstellar travel is impractical, or perhaps we haven't searched well enough. Telescopes like JWST are now beginning to study exoplanet atmospheres, searching for chemical signs of life: the question may become answerable.`,
            },
          ],
          recap: [
            'The Drake equation multiplies factors to estimate communicating civilisations.',
            'Early factors are now measured. Later ones are still guesses.',
            'The Fermi paradox asks why we see no sign of anyone.',
          ],
        },
      ],
    },
    {
      title: 'What Are They Made Of?',
      summary: 'Densities, and a lens made of gravity.',
      lessons: [
        {
          id: 'density',
          title: 'Weighing Worlds',
          summary: 'Mass plus size gives density',
          icon: 'hand',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Earth’s density',
              prompt: r`Earth's mass is $5.97 \times 10^{24}$ kg and its radius is $6.37 \times 10^6$ m. What is its average density, in g/cm³? (1 g/cm³ = 1000 kg/m³.)`,
              unit: 'g/cm³',
              answer: 5.97e24 / ((4 / 3) * Math.PI * 6.37e6 ** 3) / 1000,
              tol: 0.05,
              wrong: [{ v: 5.97e24 / ((4 / 3) * Math.PI * 6.37e6 ** 3), relTol: 0.02, why: 'That’s in kg/m³. Divide by 1000 for g/cm³.' }, { v: 5.97e24 / (6.37e6 ** 3) / 1000, tol: 0.2, why: r`Volume of a sphere is $\frac43\pi r^3$, not $r^3$.` }],
              explain: r`Volume $= \frac43 \pi (6.37 \times 10^6)^3 = 1.08 \times 10^{21}$ m³, so density $= 5510$ kg/m³ $= 5.5$ g/cm³. Surface rocks are only about 3 g/cm³, so Earth's interior must be much denser: its iron core.`,
            },
            {
              type: 'explain',
              title: 'Two methods together',
              body: r`The transit method gives a planet's **radius** (from the depth of the dip). The wobble method gives its **mass**. Measure both for the same planet and you know its **density**, which tells you what it's made of:

- about 8 g/cm³ or more: mostly iron, like Mercury's core,
- about 4–6 g/cm³: rock and iron, like Earth,
- about 1–2 g/cm³: lots of water or ice, or rock wrapped in gas,
- below 1 g/cm³: mostly hydrogen and helium, like Saturn (which would float in a big enough bath!).

Big planets squeeze their own insides, so real compositions need careful models, but density is the first clue.`,
            },
            {
              type: 'interactive',
              title: 'The mass–radius diagram',
              body: r`Grey dots are planets of our solar system; dashed lines join planets of equal density. Set the mass and radius of a new planet. Make one with **Neptune's mass** but **Earth's density**.`,
              widget: {
                kind: 'graph', xmin: -1.2, xmax: 2.8, ymin: -0.4, ymax: 1.2, grid: false, height: 340, padL: 50,
                axes: { xlabel: 'mass (Earths, log scale)', ylabel: 'radius (Earths, log scale)', xticks: 1, yticks: Math.log10(2), xAt: -1.2, yAt: -0.4, xfmt: (v) => String(Math.round(10 ** v * 10) / 10), yfmt: (v) => String(Math.round(10 ** v * 10) / 10) },
                params: {
                  lm: { min: -1, max: 2.7, step: 0.01, value: 1.6, label: 'mass', color: 'coral', format: (v) => `${sig(10 ** v, 2)} M⊕` },
                  lr: { min: -0.3, max: 1.1, step: 0.005, value: 0.75, label: 'radius', color: 'blue', format: (v) => `${sig(10 ** v, 2)} R⊕` },
                },
                curves: [8, 5.5, 1, 0.3].map((rho, i) => ({ f: (x) => (x + Math.log10(5.51 / rho)) / 3, color: ['muted', 'green', 'blue', 'violet'][i], dash: true, width: 1.5 })),
                extra: ({ plot, p, s }) => [
                  ...PLANETS.flatMap(([n, M, R]) => [s('circle', { cx: plot.X(Math.log10(M)), cy: plot.Y(Math.log10(R)), r: 4.5, class: 'fl-muted' }), n === 'Uranus' ? null : s('text', { x: plot.X(Math.log10(M)) + 7, y: plot.Y(Math.log10(R)) + (n === 'Venus' ? -6 : n === 'Earth' ? 14 : 4), class: 'tick', text: n })]),
                  ...[[8, 'iron', 14, 0.7], [5.5, 'Earth-like', -6, -0.45], [1, 'water', -6, 0.4], [0.3, '0.3 g/cm³', -6, 0.4]].map(([rho, t, dy, x]) => s('text', { x: plot.X(x), y: plot.Y((x + Math.log10(5.51 / rho)) / 3) + dy, class: 'tick', 'text-anchor': 'middle', text: t })),
                  s('circle', { cx: plot.X(p.lm), cy: plot.Y(p.lr), r: 8, class: 'fl-coral', stroke: 'var(--ink)', 'stroke-width': 2 }),
                ],
                readout: (p) => `Density **${dens(10 ** p.lm, 10 ** p.lr).toFixed(2)} g/cm³**`,
                goal: (p) => Math.abs(10 ** p.lm - 17.1) < 2 && Math.abs(dens(10 ** p.lm, 10 ** p.lr) - 5.5) < 0.6,
                hint: 'Set the mass to about 17 Earths, then slide the radius until the dot sits on the green (Earth-like) line.',
                solution: { lm: Math.log10(17.1), lr: Math.log10(2.58) },
              },
              explain: r`Same density means radius $\propto \sqrt[3]{\text{mass}}$: $\sqrt[3]{17.1} \approx 2.6$ Earth radii, much smaller than Neptune's 3.9. Neptune is puffier than rock because it has a thick envelope of hydrogen, helium and ices. (In reality a 17-Earth-mass rocky planet would compress itself and be even smaller.)`,
            },
            {
              type: 'numeric',
              title: 'Kepler-10b',
              prompt: r`Kepler-10b, the first rocky planet confirmed by the Kepler mission, has 3.3 times Earth's mass and 1.47 times its radius. What is its density, in g/cm³? (Earth: 5.51 g/cm³.)`,
              unit: 'g/cm³',
              answer: dens(3.3, 1.47),
              tol: 0.1,
              wrong: [{ v: 5.51 * 3.3 / 1.47, tol: 0.1, why: r`Volume grows as radius **cubed**: divide by $1.47^3$.` }, { v: 5.51 * 3.3 / 1.47 ** 2, tol: 0.1, why: r`Volume grows as the radius cubed, not squared.` }],
              explain: r`$5.51 \times \frac{3.3}{1.47^3} = 5.51 \times \frac{3.3}{3.18} \approx 5.7$ g/cm³: solid rock and iron, like Earth. But it orbits its star in under a day, so its surface is hot enough to melt rock: rocky, but far from habitable.`,
            },
            {
              type: 'mcq',
              title: 'Mini-Neptunes',
              prompt: r`A planet has 8 times Earth's mass and 2.5 times its radius, giving a density of about 2.8 g/cm³. What is it most likely to be?`,
              choices: [
                { t: 'A rocky core wrapped in a thick layer of gas or water', ok: true },
                { t: 'A bare iron ball', why: 'Iron would be far denser, about 8 g/cm³ or more.' },
                { t: 'A pure hydrogen giant like Jupiter', why: 'Hydrogen giants have densities near or below 1 g/cm³.' },
              ],
              explain: r`Too light for bare rock, too dense for a gas giant: probably rock with a deep envelope of gas, water or both, a "mini-Neptune". Planets between Earth and Neptune in size are the most common kind found by Kepler, yet our solar system has none.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A planet that floats',
              prompt: r`Saturn has 95.2 times Earth's mass and 9.14 times its radius. What is its density, in g/cm³? (Earth: 5.51 g/cm³.)`,
              unit: 'g/cm³',
              answer: dens(95.2, 9.14),
              tol: 0.02,
              wrong: [{ v: 5.51 * 95.2 / 9.14 ** 2, tol: 0.05, why: r`Divide by the radius **cubed**: $9.14^3 \approx 764$.` }],
              hint: r`$9.14^3 \approx 764$.`,
              explain: r`$5.51 \times \frac{95.2}{764} \approx 0.69$ g/cm³, less than water. Some exoplanets, the "super-puffs", are even lower, around 0.1 g/cm³, like candy floss: hot gas giants whose atmospheres have swollen.`,
            },
          ],
          recap: [
            'Transits give radius, wobbles give mass, and together they give density.',
            'Density reveals composition: iron, rock, water or gas.',
            'Mini-Neptunes (between Earth and Neptune in size) are the most common planets found so far.',
          ],
        },
        {
          id: 'microlensing',
          title: 'Microlensing',
          summary: 'Gravity as a magnifying glass',
          icon: 'eye',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Bending starlight',
              prompt: 'Einstein’s general relativity says mass bends the path of light. What happens when a star passes almost exactly in front of a more distant star?',
              choices: [
                { t: 'The nearer star’s gravity focuses the distant star’s light, so it temporarily brightens', ok: true },
                { t: 'The distant star is hidden behind it', why: 'Stars are tiny compared with the distances involved; the light bends around the nearer star instead.' },
                { t: 'Nothing: stars are too light to bend light', why: 'In 1919, observers measured the Sun bending starlight by the amount Einstein predicted.' },
              ],
              explain: r`The foreground star acts as a lens, bending light from the background star towards us from several directions, so the background star brightens for a few weeks. Einstein worked out the effect in 1936 but thought it would never be observed. Today surveys watch hundreds of millions of stars towards the centre of the galaxy and see thousands of events a year.`,
            },
            {
              type: 'interactive',
              title: 'A lensing light curve',
              body: r`The background star moves across behind the lens. Its closest approach $u_0$ is measured in units of the lens's **Einstein radius** (the ring an exactly aligned star would form). Make the star brighten more than **10 times** at its peak.`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 2, ymin: 0, ymax: 14, grid: false, height: 300, padL: 46,
                axes: { xlabel: 'time (Einstein crossing times)', ylabel: 'magnification', xticks: 1, yticks: 2 },
                params: { u0: { min: 0.05, max: 1.5, step: 0.01, value: 0.7, label: 'closest approach u₀', color: 'violet', format: (v) => v.toFixed(2) } },
                curves: [{ f: (t, p) => Math.min(14, magnif(Math.hypot(t, p.u0))), color: 'violet', width: 3, n: 400 }, { f: () => 1, color: 'muted', dash: true }],
                readout: (p) => `Peak magnification **${magnif(p.u0).toFixed(1)}×**`,
                goal: (p) => magnif(p.u0) > 10,
                hint: r`The peak magnification is roughly $1/u_0$ for small $u_0$.`,
                solution: { u0: 0.08 },
              },
              explain: r`For a close approach the peak magnification is about $\frac{1}{u_0}$, so you need $u_0 \lesssim 0.1$. Such high-magnification events are prized: the light passes very close to the lens star, where any planets around it have the best chance of adding their own short spike to the curve.`,
            },
            {
              type: 'numeric',
              title: 'At the Einstein radius',
              prompt: r`The magnification is $A = \dfrac{u^2 + 2}{u\sqrt{u^2 + 4}}$. What is it when the background star is exactly one Einstein radius away ($u = 1$)? (3 decimal places.)`,
              answer: magnif(1),
              tol: 0.002,
              wrong: [{ v: 1, why: 'There is still some brightening at u = 1.' }, { v: 1.5, tol: 0.002, why: r`$\sqrt{1 + 4} = \sqrt5 \approx 2.236$, so $A = \frac{3}{2.236}$.` }],
              explain: r`$A = \frac{3}{\sqrt5} \approx 1.342$: a 34% brightening. Astronomers often define an "event" as the time the star spends inside one Einstein radius, typically a few weeks for a lens star in our galaxy.`,
            },
            {
              type: 'explain',
              title: 'Planets in the blip',
              body: r`If the lens star has a planet, the planet acts as a tiny extra lens. When the background star's light passes near it, the smooth curve gets a short **spike or dip** lasting hours to days.

Microlensing has special strengths:
- It finds planets at Earth-to-Jupiter distances from their stars, which transits and wobbles find hard.
- It detects planets thousands of light-years away, and even **free-floating planets** with no star at all.
- But each event happens only **once**: the alignment never repeats, so the planet can never be re-observed.

NASA's Nancy Grace Roman Space Telescope is expected to find over a thousand planets this way.`,
            },
            {
              type: 'mcq',
              title: 'Never again',
              prompt: 'Why can’t astronomers watch a microlensing planet a second time?',
              choices: [
                { t: 'The lens and background stars drift apart, and they are very unlikely to line up again', ok: true },
                { t: 'The lensing destroys the planet', why: 'Lensing just bends light passing by. It does nothing to the planet.' },
                { t: 'Planets only lens light once in their lifetime by law', why: 'There’s no such law: it’s just that such precise alignments are extremely rare.' },
              ],
              explain: r`The alignment depends on the exact positions of two stars thousands of light-years apart, both moving through the galaxy. Once they drift apart, that particular line-up essentially never recurs. So the measurement is a statistical census, not a way to study individual worlds in detail.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A close pass',
              prompt: r`What is the peak magnification for a closest approach of $u_0 = 0.1$? (2 decimal places.)`,
              answer: magnif(0.1),
              tol: 0.006,
              wrong: [{ v: 1 / 0.1, tol: 0.004, why: r`$1/u_0 = 10$ is the approximation. Use the full formula: $\frac{0.01 + 2}{0.1\sqrt{4.01}}$.` }],
              hint: r`$A = \frac{u^2 + 2}{u\sqrt{u^2 + 4}}$ with $u = 0.1$: $\sqrt{4.01} \approx 2.0025$.`,
              explain: r`$A = \frac{2.01}{0.1 \times 2.0025} \approx 10.04$, very close to the approximation $\frac{1}{u_0}$. The record events have magnifications in the thousands, when the alignment is better than one part in a thousand of an Einstein radius.`,
            },
          ],
          recap: [
            'A foreground star’s gravity can magnify a background star: microlensing.',
            r`Magnification $A = \frac{u^2 + 2}{u\sqrt{u^2 + 4}}$, about $1/u_0$ at the peak for close passes.`,
            'Planets around the lens add short blips; each event happens only once.',
          ],
        },
        {
          id: 'direct-imaging',
          title: 'Photographing Planets',
          summary: 'Direct imaging',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'A firefly next to a searchlight',
              body: r`Most exoplanets are found indirectly, from their effect on their star. Taking an actual **picture** of one is much harder, for two reasons:
- **contrast**: a Sun-like star outshines an Earth-like planet about 10 billion times in visible light;
- **separation**: the planet sits a tiny angle from its star. A planet at $a$ AU from a star $d$ parsecs away appears $\frac{a}{d}$ arcseconds from it (that is how the parsec is defined).

Astronomers block the starlight with a **coronagraph** and image in the infrared, where young planets glow with their own heat.`,
            },
            {
              type: 'numeric',
              title: 'A distant Jupiter',
              prompt: r`A Jupiter-like planet orbits 5 AU from a star 10 parsecs away. What is its angular separation from the star, in arcseconds?`,
              unit: '″',
              answer: 0.5,
              tol: 0.001,
              explain: r`$\frac{5}{10} = 0.5$ arcseconds, about the width of a coin seen from 10 km away.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How big a telescope?',
              prompt: r`A coronagraph can find planets only beyond about $3\lambda/D$ from the star. Observing at $\lambda = 1.6$ µm, find the smallest telescope diameter $D$ that can reach an Earth-like planet (1 AU) around a star **10 parsecs** away.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.25, xmax: 0.25, ymin: -0.25, ymax: 0.25, grid: false, axes: false, maxWidth: 340, pad: 6,
                params: { D: { min: 1, max: 40, step: 0.1, value: 4, label: 'telescope diameter', color: 'violet', format: (v) => `${v.toFixed(1)} m` } },
                extra: ({ plot, p, s }) => { const iwa = (3 * 1.6e-6 * 206265) / p.D; return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(iwa) - plot.X(0), class: 'fl-ink', opacity: 0.85 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(0.1) - plot.X(0), fill: 'none', stroke: 'var(--teal)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }), s('circle', { cx: plot.X(0.1), cy: plot.Y(0), r: 5, class: iwa <= 0.1 ? 'fl-teal' : 'fl-muted' }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 4, class: 'fl-amber' })]; },
                readout: (p) => { const iwa = (3 * 1.6e-6 * 206265) / p.D; return `closest detectable separation **${iwa.toFixed(3)}″** · planet at 0.100″ · ${iwa <= 0.1 ? 'visible!' : 'hidden behind the mask'}`; },
                goal: (p) => Math.abs(p.D - 9.9) < 0.06,
                hint: r`Solve $\frac{3 \times 1.6 \times 10^{-6}}{D}$ radians $= 0.1$″, with 1 rad $= 206{,}265$″.`,
                solution: { D: 9.9 },
              },
              explain: r`$D = \frac{3 \times 1.6 \times 10^{-6} \times 206{,}265}{0.1} \approx 9.9$ m: as big as the largest telescopes today. And that only solves the separation; blocking out the ten-billion-fold glare is harder still, which is why imaging an Earth twin is a goal for the next generation of 30–40 m telescopes and space missions.`,
            },
            {
              type: 'mcq',
              title: 'Why young giants?',
              prompt: r`Nearly all directly imaged planets are young, massive planets far from their stars. Why?`,
              choices: [
                { t: 'They are still hot from forming, so they glow brightly in infrared, and wide orbits put them far from the glare', ok: true },
                { t: 'Old planets don’t reflect light', why: 'They do reflect starlight, but that is extremely faint compared with the star.' },
                { t: 'Young stars are dimmer', why: 'The key is the planets: young giants are hot and bright in the infrared.' },
              ],
              explain: r`A young Jupiter can be thousands of times brighter in the infrared than an old one, cutting the contrast to around a million or less. The four planets of HR 8799, first imaged in 2008, are a famous example.`,
            },
            {
              type: 'numeric',
              title: 'In magnitudes',
              prompt: r`Astronomers measure brightness in magnitudes: a factor of 100 is 5 magnitudes, so a ratio $R$ is $2.5\log_{10} R$ magnitudes. How many magnitudes fainter than the Sun is an Earth twin (10 billion times fainter)?`,
              answer: 25,
              tol: 0.01,
              explain: r`$2.5 \times \log_{10}(10^{10}) = 2.5 \times 10 = 25$ magnitudes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'HR 8799',
              prompt: r`The outermost imaged planet of HR 8799 orbits about 68 AU from its star, which is 41 parsecs away. What is its angular separation, in arcseconds? (2 decimal places.)`,
              unit: '″',
              answer: 68 / 41,
              tol: 0.01,
              explain: r`$\frac{68}{41} \approx 1.66$″: wide enough, and the young planet bright enough, for 8–10 m telescopes with adaptive optics to see it directly.`,
            },
          ],
          recap: [
            'Separation in arcseconds = orbit size in AU ÷ distance in parsecs.',
            'Coronagraphs need the planet beyond a few λ/D, so big telescopes matter.',
            'Young, hot giants on wide orbits are the easiest to photograph.',
          ],
        },
      ],
    },
  ],
};
