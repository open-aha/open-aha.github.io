import { fix } from '../lib/svg.js';

const r = String.raw;
const VP = 6, VS = 3.5; // km/s in the crust
const PER_S = 1 / (1 / VS - 1 / VP); // km of distance per second of S–P lag
const f1 = (v) => (Math.round(v * 10) / 10).toString();

// three stations and a hidden epicentre (map units: 100 km)
const STATIONS = [[-2.2, 1.4, 'A'], [2.4, 1.8, 'B'], [0.6, -2.3, 'C']];
const EPI = [0.4, 0.5];
const dist = ([x, y]) => Math.hypot(x - EPI[0], y - EPI[1]);

// elastic rebound: a fault slips 4 m whenever enough strain builds; plate speed v cm/yr
const recurrence = (v) => 400 / v;
// building natural period ≈ 0.1 s per storey
const bldgPeriod = (n) => 0.1 * n;
// response of a lightly damped building (damping 5%) to ground shaking with period 2 s
const bldgResp = (n) => { const r = 2 / bldgPeriod(n); return 1 / Math.sqrt((1 - r * r) ** 2 + (0.1 * r) ** 2); };

export default {
  id: 'earthquakes',
  subject: 'physics',
  title: 'Earthquakes & Seismology',
  level: 'Intermediate',
  cover: 'earthquakes',
  tagline: 'Seismic waves, finding epicentres, magnitudes, Earth’s core, faults and shaking buildings.',
  description: r`When the ground shakes, it sends out waves that carry information about the quake and about the deep Earth. Learn the two main kinds of seismic wave, locate an earthquake by triangulation, understand why magnitude 7 is so much worse than magnitude 6, discover how earthquakes revealed Earth's liquid core, see why faults store and release strain, and learn why some buildings resonate with the ground.`,
  prereq: 'Waves & Oscillations',
  chapters: [
    {
      title: 'Seismic Waves',
      summary: 'Fast and slow.',
      lessons: [
        {
          id: 'waves',
          title: 'P-Waves & S-Waves',
          summary: 'Push and shake',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Two kinds of wave',
              body: r`A sudden slip on a fault sends waves through the Earth:
- **P-waves** (primary): **compression** waves, like sound. Rock is squeezed and stretched along the direction of travel. In the crust they travel at about **6 km/s**.
- **S-waves** (secondary): **shear** waves. Rock shakes side to side, across the direction of travel. They're slower, about **3.5 km/s**.

When they reach the surface, they also set off slower **surface waves**, which roll the ground and cause most of the damage.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Push or shake',
              body: r`Each dot is a bit of rock. Switch between the two wave types and move time forward. The coral dot lets you follow one bit of rock.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 15.5, ymin: -1.5, ymax: 1.5, grid: false, axes: false, height: 170,
                params: {
                  t: { min: 0, max: 2, step: 0.02, value: 0, label: 'time (periods)', color: 'blue', format: (v) => v.toFixed(2) },
                  k: { min: 0, max: 1, step: 1, value: 0, label: 'wave', color: 'violet', format: (v) => (v ? 'S (shear)' : 'P (compression)') },
                },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let i = 0; i <= 30; i++) {
                    const x0 = i * 0.5, ph = (2 * Math.PI * x0) / 8 - 2 * Math.PI * p.t, d = 0.45 * Math.sin(ph);
                    const x = p.k ? x0 : x0 + d, y = p.k ? d * 1.6 : 0;
                    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: i === 14 ? 7 : 5, class: i === 14 ? 'fl-coral' : 'fl-ink' }));
                  }
                  return els;
                },
              },
              after: r`In the P-wave, the dots bunch and spread along the direction of travel (like sound). In the S-wave, they move up and down, **across** the direction of travel. In both, the pattern travels to the right while each dot just jiggles in place.`,
            },
            {
              type: 'mcq',
              title: 'Through liquids',
              prompt: r`S-waves cannot travel through liquids. Why?`,
              choices: [
                { t: 'Liquids don’t resist being sheared: there’s no restoring force to pass the sideways shaking along', ok: true },
                { t: 'Liquids are too dense', why: 'Density isn’t the issue: P-waves pass through liquids fine. It’s about resisting shear.' },
                { t: 'S-waves are too slow', why: 'Speed isn’t the issue. A liquid simply can’t spring back from a sideways shove.' },
              ],
              explain: r`A wave needs a restoring force. Solids resist both squeezing and shearing, so they carry P- and S-waves. Liquids resist squeezing (so P-waves pass) but flow freely when sheared, so S-waves die out. This turns out to be the key to discovering Earth's liquid core.`,
            },
            {
              type: 'numeric',
              title: 'The lag',
              prompt: r`A seismometer is 300 km from an earthquake. How many seconds after the P-wave does the S-wave arrive? (P: 6 km/s, S: 3.5 km/s.)`,
              unit: 's',
              answer: 300 / 3.5 - 300 / 6,
              tol: 0.3,
              wrong: [{ v: 50, why: r`That's when the P-wave arrives. The S-wave arrives at $300/3.5 \approx 85.7$ s. Find the difference.` }, { v: 85.7, tol: 0.3, why: 'That’s the S-wave’s arrival time. Subtract the P-wave’s 50 s.' }],
              explain: r`P arrives after $300/6 = 50$ s, and S after $300/3.5 \approx 85.7$ s. The gap is about **35.7 s**. The farther away the quake, the bigger the gap: that's how seismologists measure distance.`,
            },
            {
              type: 'numeric',
              title: 'The speed ratio',
              prompt: r`For most rocks, $v_P / v_S \approx \sqrt3$. If P-waves travel at 6 km/s, how fast are S-waves? (1 decimal place.)`,
              unit: 'km/s',
              answer: 6 / Math.sqrt(3),
              tol: 0.05,
              wrong: [{ v: 6 * Math.sqrt(3), tol: 0.05, why: 'S-waves are slower: divide by √3.' }],
              explain: r`$\frac{6}{\sqrt3} \approx 3.5$ km/s, the value we've been using. This ratio comes from the elastic properties of typical rock, and changes in it reveal fluids or melt underground.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Feeling it twice',
              prompt: r`People 140 km from an earthquake feel a sharp jolt (the P-wave), then a stronger rolling shake (the S-wave). How many seconds apart? (1 decimal place.)`,
              unit: 's',
              answer: 140 / 3.5 - 140 / 6,
              tol: 0.06,
              wrong: [{ v: 140 / 6, tol: 0.1, why: 'That’s the P-wave arrival. Subtract it from the S-wave arrival.' }],
              explain: r`$\frac{140}{3.5} - \frac{140}{6} = 40 - 23.3 \approx 16.7$ s. Count the seconds between the jolt and the shaking, multiply by about 8, and you have the distance in kilometres.`,
            },
          ],
          recap: [
            'P-waves: compressional and fast (about 6 km/s in the crust).',
            'S-waves: shear, slower (about 3.5 km/s), and unable to cross liquids.',
            'The S–P time gap grows with distance from the quake.',
          ],
        },
        {
          id: 'locating',
          title: 'Finding the Epicentre',
          summary: 'Triangulation from three stations',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Distance from the lag',
              body: r`For a station at distance $d$, the S–P lag is $\Delta t = \dfrac{d}{v_S} - \dfrac{d}{v_P}$. Solving for $d$:
$$d = \frac{\Delta t}{1/v_S - 1/v_P} \approx 8.4\ \text{km per second of lag}$$
(using $v_P = 6$ km/s and $v_S = 3.5$ km/s). But one station only tells you the **distance**, not the direction: the quake could be anywhere on a circle around it.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Triangulate',
              prompt: r`Three stations measured their S–P lags and drew circles of the matching distances. Drag the purple point to the **epicentre**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3.4, ymax: 3.2, grid: 1, axes: false, maxWidth: 520,
                params: { x: { min: -3.5, max: 3.5, step: 0.1, value: -1.5, slider: false }, y: { min: -3, max: 3, step: 0.1, value: -1.5, slider: false } },
                extra: ({ plot, s }) => {
                  const els = [];
                  const cols = ['blue', 'coral', 'teal'];
                  STATIONS.forEach((st, i) => {
                    const R = dist(st);
                    els.push(s('circle', { cx: plot.X(st[0]), cy: plot.Y(st[1]), r: plot.X(R) - plot.X(0), fill: 'none', stroke: `var(--${cols[i]})`, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }));
                    els.push(s('path', { d: `M${plot.X(st[0])} ${plot.Y(st[1]) - 10} l9 16 h-18 Z`, class: `fl-${cols[i]}` }));
                    els.push(s('text', { x: plot.X(st[0]) + 14, y: plot.Y(st[1]) - 8, style: 'font-weight:700;font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px))', text: st[2] }));
                  });
                  return els;
                },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet' }],
                readout: () => STATIONS.map((st) => `${st[2]}: lag ${f1((dist(st) * 100) / PER_S)} s → ${Math.round(dist(st) * 100)} km`).join(' · '),
                goal: (p) => Math.hypot(p.x - EPI[0], p.y - EPI[1]) < 0.25,
                hint: 'Look for the one point where all three circles cross.',
                solution: { x: 0.4, y: 0.5 },
              },
              explain: r`Two circles usually cross at two points; the third circle picks out which one. This is **triangulation** (strictly, trilateration). Real networks use hundreds of stations and also work out the quake's **depth**.`,
            },
            {
              type: 'numeric',
              title: 'Distance from a lag',
              prompt: r`A station records an S–P lag of 20 seconds. Roughly how far away was the earthquake? (Use 8.4 km per second of lag.)`,
              unit: 'km',
              answer: 168,
              tol: 3,
              wrong: [{ v: 2.4, tol: 0.1, why: 'Multiply the lag by 8.4 km/s rather than dividing.' }, { v: 120, why: r`That would use the P-wave speed alone ($20 \times 6$). The lag rule gives about 8.4 km per second.` }],
              explain: r`$20 \times 8.4 \approx 168$ km. Earthquake early-warning systems exploit the lag in reverse: detecting the fast P-wave can give people several seconds of warning before the damaging waves arrive.`,
            },
            {
              type: 'numeric',
              title: 'Early warning',
              prompt: r`A city is 100 km from an offshore earthquake. Sensors near the epicentre detect the P-wave and issue an alert 5 seconds after the quake begins. How many seconds of warning does the city get before the S-wave arrives? (1 decimal place.)`,
              unit: 's',
              answer: 100 / 3.5 - 5,
              tol: 0.06,
              wrong: [{ v: 100 / 3.5, tol: 0.1, why: 'Subtract the 5 seconds it took to detect the quake and send the alert.' }],
              explain: r`The S-wave arrives after $\frac{100}{3.5} \approx 28.6$ s, so the warning is about **23.6 s**: enough to stop trains, open fire-station doors and take cover. Japan, Mexico and the US west coast run such systems; near the epicentre, though, there's almost no warning.`,
            },
            {
              type: 'mcq',
              title: 'Focus and epicentre',
              prompt: r`The **focus** (hypocentre) of an earthquake is where the rupture starts, often kilometres underground. The **epicentre** is…`,
              choices: [
                { t: 'The point on the surface directly above the focus', ok: true },
                { t: 'The place with the most damage', why: 'Damage depends on soil and buildings too; it can be worst far from the epicentre.' },
                { t: 'The deepest point of the fault', why: 'The epicentre is on the surface.' },
              ],
              explain: r`Earthquakes can start anywhere from near the surface to about 700 km deep. Shallow quakes tend to be more damaging, because the waves have less distance to spread and weaken before reaching people.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A deep quake',
              prompt: r`An earthquake's focus is 30 km underground, and a seismometer stands 40 km from the epicentre. How far do the waves actually travel from focus to station?`,
              unit: 'km',
              answer: 50,
              wrong: [{ v: 70, why: 'Depth and horizontal distance are at right angles: use Pythagoras.' }, { v: 40, why: 'The waves start 30 km down, so they travel farther than the surface distance.' }],
              explain: r`$\sqrt{30^2 + 40^2} = 50$ km. Real location methods solve for depth and position together, using many stations.`,
            },
          ],
          recap: [
            r`Distance $\approx 8.4$ km per second of S–P lag (crustal speeds).`,
            'One station gives a circle. Three circles pin down the epicentre.',
            'Early-warning systems use the head start of P-waves.',
          ],
        },
      ],
    },
    {
      title: 'Size and Depth',
      summary: 'Magnitudes and the inner Earth.',
      lessons: [
        {
          id: 'magnitude',
          title: 'Magnitude',
          summary: 'A logarithmic scale',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Steps of ten',
              body: r`Earthquakes range from tiny tremors to catastrophes, so their size is measured on a **logarithmic** scale. On the modern **moment magnitude** scale (which replaced the original Richter scale for big quakes):
- each step of **1** in magnitude means about **10×** the ground-shaking amplitude (on a seismometer at a given distance);
- and about **32×** the energy released ($10^{1.5} \approx 31.6$).`,
            },
            {
              type: 'numeric',
              title: 'Energy comparison',
              prompt: r`How many times more energy does a magnitude 7 earthquake release than a magnitude 5?`,
              unit: '×',
              answer: 1000,
              relTol: 0.01,
              wrong: [{ v: 100, why: 'That’s the amplitude ratio (10 × 10). Energy grows by about 32 per step: 32 × 32.' }, { v: 2, why: 'The scale is logarithmic: each step multiplies the energy.' }, { v: 64, why: r`Each step is a factor of about 32, so two steps give $32 \times 32 \approx 1000$, not $32 \times 2$.` }],
              explain: r`Two steps: $10^{1.5 \times 2} = 10^3 = 1000$. A magnitude 7 releases as much energy as about a thousand magnitude 5s. That's why a few great earthquakes account for most of the seismic energy released worldwide.`,
            },
            {
              type: 'mcq',
              title: 'The biggest ever',
              prompt: r`The largest earthquake ever recorded struck Chile in 1960, at magnitude 9.5. Compared with a magnitude 8.5, roughly how much more energy did it release?`,
              cols: 2,
              choices: [
                { t: 'About 32 times', ok: true },
                { t: 'About 10 times', why: 'Ten times is the amplitude ratio for one step. Energy goes up by about 32×.' },
                { t: 'About 1.1 times', why: '9.5 isn’t just a bit more than 8.5: the scale is logarithmic.' },
                { t: 'About 1,000 times', why: 'That’s for two steps. This is one step.' },
              ],
              explain: r`One magnitude step means about $10^{1.5} \approx 32\times$ the energy. The 1960 Valdivia earthquake ruptured a fault around 1,000 km long and sent tsunamis across the entire Pacific.`,
            },
            {
              type: 'explain',
              title: 'Big quakes are rare',
              body: r`Small earthquakes are vastly more common than large ones. The **Gutenberg–Richter law** says that, worldwide, each step **up** in magnitude is about **10 times rarer**. Every year there are roughly:
- 1,300 earthquakes of magnitude 5–6,
- 130 of magnitude 6–7,
- 15 of magnitude 7–8,
- and about 1 of magnitude 8 or more.`,
            },
            {
              type: 'mcq',
              title: 'Where’s the energy?',
              prompt: r`Each magnitude step is 10 times rarer but releases about 32 times more energy per quake. Which earthquakes release most of the world's seismic energy?`,
              choices: [
                { t: 'The rare, biggest ones: each step up adds about 3 times as much total energy', ok: true },
                { t: 'The many small ones', why: 'They’re common but release little energy each: 10× more of them, but 32× less energy apiece.' },
                { t: 'All sizes contribute equally', why: '32 ÷ 10 ≈ 3.2: each step up contributes about 3 times more.' },
              ],
              explain: r`A band one step higher has $\frac{32}{10} \approx 3$ times the total energy. So the occasional great earthquake dominates, and small quakes can't "let off steam" to prevent big ones: it would take about 32 magnitude 6s to equal one magnitude 7.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Many small, few big',
              body: r`Each step up in magnitude makes quakes about **10 times rarer** but each one about **32 times more energetic**. Switch between counting quakes and counting their energy.`,
              widget: {
                kind: 'graph', xmin: 3.4, xmax: 9.6, ymin: 0, ymax: 1.1, grid: false, axes: false, maxWidth: 520, height: 280,
                params: { mode: { min: 0, max: 1, step: 1, value: 0, label: 'show', color: 'violet', format: (v) => (v ? 'share of total energy' : 'number per year') } },
                extra: ({ plot, p, s }) => { const M = [4, 5, 6, 7, 8, 9], N = [13000, 1300, 134, 15, 1.3, 0.1], E = M.map((m, i) => N[i] * 10 ** (1.5 * (m - 9))), tot = E.reduce((a, b) => a + b, 0), out = []; M.forEach((m, i) => { const hgt = p.mode ? E[i] / tot : (Math.log10(N[i]) + 1.5) / 6; out.push(s('rect', { x: plot.X(m - 0.35), y: plot.Y(hgt), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(hgt), class: p.mode ? 'fl-coral' : 'fl-blue' }), s('text', { x: plot.X(m), y: plot.Y(hgt) - 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: p.mode ? `${((100 * E[i]) / tot).toFixed(1)}%` : N[i] >= 1 ? N[i].toLocaleString('en-US') : '1 per 10 yr' }), s('text', { x: plot.X(m), y: plot.Y(0) + 16, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: `M${m}` })); }); return out; },
                readout: (p) => (p.mode ? 'share of all earthquake energy released, by magnitude band' : 'earthquakes per year worldwide, by magnitude band (log scale)'),
              },
              after: r`Small quakes vastly outnumber big ones, yet the energy is dominated by the rare giants: each band up releases about 3 times more energy in total ($32 \div 10$). A single magnitude-9 quake can release more energy than all other quakes in a decade combined.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Small change, big difference',
              prompt: r`The 2011 Tōhoku earthquake in Japan was magnitude 9.1 (it was first reported as 8.9). How many times more energy does a 9.1 release than an 8.9? (1 decimal place.)`,
              unit: '×',
              answer: 10 ** (1.5 * 0.2),
              tol: 0.06,
              wrong: [{ v: 1.02, tol: 0.01, why: r`It's a ratio of energies: $10^{1.5 \times 0.2}$.` }],
              explain: r`$10^{1.5 \times 0.2} = 10^{0.3} \approx 2.0$: even a 0.2 revision doubles the estimated energy.`,
            },
          ],
          recap: [
            'Magnitude is logarithmic.',
            'Each step: about 10× amplitude and about 32× energy.',
            'Two steps: about 1,000× the energy.',
          ],
        },
        {
          id: 'interior',
          title: 'Seeing Inside the Earth',
          summary: 'Shadow zones and the core',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'An X-ray of the planet',
              body: r`Nobody has drilled deeper than about 12 km, yet we know Earth has a crust, a mantle, a liquid outer core and a solid inner core. How? Seismic waves pass through the whole planet, bending and reflecting at boundaries, and stations around the world record when and where they arrive.`,
            },
            {
              type: 'mcq',
              title: 'The S-wave shadow',
              prompt: r`After a big earthquake, S-waves are **not** detected by stations more than about 104° around the globe from the epicentre. What does this reveal?`,
              choices: [
                { t: 'Part of Earth’s core is liquid, blocking S-waves', ok: true },
                { t: 'The core is hollow', why: 'P-waves do pass through the core (bent and slowed), so it’s not empty: it’s liquid.' },
                { t: 'S-waves run out of energy', why: 'The cutoff is sharp and geometric, which points to a boundary, not a gradual fading.' },
              ],
              explain: r`S-waves can't cross liquids, so the large **S-wave shadow** shows that the outer core is liquid. Beno Gutenberg located the core boundary (about 2,900 km down) in 1913, and Harold Jeffreys argued in 1926 that the core is liquid.`,
            },
            {
              type: 'mcq',
              title: 'Inge Lehmann’s discovery',
              prompt: r`In 1936, the Danish seismologist Inge Lehmann noticed faint P-waves arriving inside the P-wave shadow zone, where none were expected. What did she conclude?`,
              choices: [
                { t: 'There is a solid inner core inside the liquid outer core that reflects and bends waves', ok: true },
                { t: 'The instruments were faulty', why: 'She trusted careful data, and her bold interpretation was soon confirmed.' },
                { t: 'The whole core is solid', why: 'The S-wave shadow shows the outer core is liquid. Lehmann found a different, inner boundary.' },
              ],
              explain: r`Lehmann realised the waves were bouncing off a boundary deep within the core: a **solid inner core**, about 1,220 km in radius. It's solid despite being roughly as hot as the Sun's surface, because the enormous pressure keeps the iron crystallised. Earth's spinning liquid outer core generates its magnetic field.`,
            },
            {
              type: 'numeric',
              title: 'Through the middle',
              prompt: r`Earth's diameter is about 12,700 km. If P-waves crossed it at an average of 11 km/s, how many minutes would they take to reach the far side? (Nearest minute.)`,
              unit: 'min',
              answer: Math.round(12700 / 11 / 60),
              tol: 1,
              wrong: [{ v: 1155, tol: 5, why: 'That’s in seconds. Convert to minutes.' }],
              explain: r`$\frac{12{,}700}{11} \approx 1155$ s $\approx 19$ minutes. Seismic waves from a big quake are recorded all over the world within about 20 minutes.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The shadow of the core',
              body: r`S-waves cannot travel through liquid. Rays leave an earthquake (top) in all directions; those that hit the liquid outer core are stopped. Change the core’s size and watch the S-wave shadow on the far side. (Real rays curve as rock gets stiffer with depth; here they are drawn straight.)`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.15, xmax: 1.15, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 360,
                params: { rc: { min: 1000, max: 5500, step: 10, value: 3480, label: 'core radius', color: 'coral', format: (v) => `${v} km` } },
                extra: ({ plot, p, s }) => { const R = 6371, c = p.rc / R, out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 2 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(c) - plot.X(0), class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 })]; for (let k = 1; k < 36; k++) { const th = -Math.PI + (k / 36) * Math.PI; const ux = Math.cos(th), uy = Math.sin(th), b = uy, disc = b * b - (1 - c * c); let tEnd = -2 * uy, hit = false; if (disc > 0) { const t1 = -b - Math.sqrt(disc); if (t1 > 0 && t1 < tEnd) { tEnd = t1; hit = true; } } out.push(s('line', { x1: plot.X(0), y1: plot.Y(1), x2: plot.X(ux * tEnd), y2: plot.Y(1 + uy * tEnd), stroke: hit ? 'var(--ink-3)' : 'var(--blue)', 'stroke-width': 1.4, opacity: hit ? 0.5 : 0.9 })); } const a = Math.acos(c); const sh = (t) => [Math.sin(t), Math.cos(t)]; const d = Array.from({ length: 30 }, (_, i) => { const t = 2 * a + ((2 * Math.PI - 4 * a) * i) / 29, [x, y] = sh(t); return `${i ? 'L' : 'M'}${plot.X(1.06 * x).toFixed(1)} ${plot.Y(1.06 * y).toFixed(1)}`; }).join(''); out.push(s('path', { d, fill: 'none', stroke: 'var(--error)', 'stroke-width': 6, 'stroke-linecap': 'round' }), s('circle', { cx: plot.X(0), cy: plot.Y(1), r: 7, class: 'fl-ink' })); return out; },
                readout: (p) => { const a = (2 * Math.acos(p.rc / 6371) * 180) / Math.PI; return `no S-waves beyond **${a.toFixed(0)}°** from the quake (red arc) · shadow covers ${(((360 - 2 * a) / 360) * 100).toFixed(0)}% of the circle`; },
              },
              after: r`A bigger core casts a bigger shadow. Seismologists run this backwards: where the waves vanish (beyond about 104° from a quake, once the curved paths are accounted for) fixes the core’s size. Its radius is about 3,500 km, more than half of Earth’s radius.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How big is the core?',
              prompt: r`A rough estimate: if waves travelled in straight lines, the S-wave shadow starting at 104° from the epicentre would mean the core's radius equals the closest approach of a straight chord spanning 104°, which is $R\cos 52°$. Estimate the core's radius ($R = 6371$ km; nearest 10 km).`,
              unit: 'km',
              answer: Math.round((6371 * Math.cos((52 * Math.PI) / 180)) / 10) * 10,
              tol: 10,
              wrong: [{ v: Math.round(6371 * Math.sin((52 * Math.PI) / 180) / 10) * 10, tol: 10, why: 'Use the cosine: the chord’s closest approach to the centre is R cos(half the angle).' }],
              explain: r`$6371 \cos 52° \approx 3920$ km. The true radius is about 3,480 km: real seismic rays curve downward-and-back up, because rock speeds increase with depth, so the straight-line estimate is too big. Still, a remarkably close guess from one angle!`,
            },
          ],
          recap: [
            'Seismic waves reveal Earth’s layered interior.',
            'The S-wave shadow shows the outer core is liquid.',
            'Inge Lehmann discovered the solid inner core in 1936.',
          ],
        },
      ],
    },
    {
      title: 'Causes and Effects',
      summary: 'Why faults slip, and why buildings fall.',
      lessons: [
        {
          id: 'rebound',
          title: 'Faults & Elastic Rebound',
          summary: 'The earthquake cycle',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Stuck, then slipping',
              body: r`Tectonic plates creep past each other at a few centimetres a year, about as fast as fingernails grow. But faults are rough and stay **locked**. The rocks on either side bend elastically, storing strain energy, until the fault suddenly slips and the rocks spring back: **elastic rebound**.

Harry Fielding Reid proposed this after the 1906 San Francisco earthquake, when fences and roads across the San Andreas fault were found offset by up to about 6 m.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The earthquake cycle',
              prompt: r`A fault slips 4 m in each earthquake, catching up with the plates' steady motion. Set the plate speed so that big earthquakes recur, on average, every **100 years**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 500, ymin: 0, ymax: 5, grid: 50, gridY: 1, height: 260, axes: { xlabel: 'years', ylabel: 'slip deficit (m)' },
                params: { v: { min: 1, max: 8, step: 0.5, value: 2, label: 'plate speed', color: 'teal', format: (v) => `${fix(v, 1)} cm/yr` } },
                curves: [{ f: (t, p) => ((t * p.v) / 100) % 4, color: 'coral', width: 3 }, { f: () => 4, color: 'ink', dash: true, width: 1.5 }],
                readout: (p) => r`strain builds at ${fix(p.v, 1)} cm/yr: a 4 m earthquake every $${recurrence(p.v).toFixed(0)}$ years`,
                goal: (p) => Math.abs(recurrence(p.v) - 100) < 1,
                hint: 'Recurrence time = slip per quake ÷ plate speed.',
                solution: { v: 4 },
              },
              explain: r`$\frac{400 \text{ cm}}{4 \text{ cm/yr}} = 100$ years. Each drop in the sawtooth is an earthquake releasing the strain built up since the last one. Real faults are less regular: stresses from neighbouring faults speed up or delay each rupture.`,
            },
            {
              type: 'mcq',
              title: 'Overdue?',
              prompt: r`A fault segment that ruptures every 150 years on average last slipped 200 years ago. What can scientists say?`,
              choices: [
                { t: 'Strain has built up and a large quake is likely in coming decades, but the exact date can’t be predicted', ok: true },
                { t: 'It will happen this year', why: 'Recurrence intervals vary a lot from cycle to cycle; precise dates can’t be forecast.' },
                { t: 'It will never happen now', why: 'Strain keeps building; the fault is more loaded than usual.' },
              ],
              explain: r`Seismologists give **probabilities** over decades (for example, the chance of a magnitude 6.7+ quake in the San Francisco Bay Area in 30 years), not predictions of date and time. No reliable method for short-term earthquake prediction exists.`,
            },
            {
              type: 'explain',
              title: 'Measuring the moment',
              body: r`Modern magnitudes come from the **seismic moment**:
$$M_0 = \mu A D$$
where $\mu \approx 3 \times 10^{10}$ Pa is the rock's rigidity, $A$ the area of the fault that slipped, and $D$ the average slip. The moment magnitude is then
$$M_w = \tfrac23\left(\log_{10} M_0 - 9.1\right)$$
with $M_0$ in newton-metres. A big quake is big because a huge area of fault slips a long way.`,
            },
            {
              type: 'numeric',
              title: 'Slip waiting to happen',
              prompt: r`Two plates creep past each other at 3 cm per year, but the fault between them stays locked. After 200 years without an earthquake, how many metres of slip have built up?`,
              unit: 'm',
              answer: 6,
              tol: 0.01,
              explain: r`$0.03 \times 200 = 6$ m, enough for a great earthquake when the fault finally lets go. Measuring this "slip deficit" with GPS is how seismologists assess which faults are loaded.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Compute a magnitude',
              prompt: r`A fault ruptures over an area 100 km long and 20 km deep, slipping 2 m on average. Using $\mu = 3 \times 10^{10}$ Pa, find $M_w$. (1 decimal place.)`,
              answer: (2 / 3) * (Math.log10(3e10 * 100e3 * 20e3 * 2) - 9.1),
              tol: 0.06,
              wrong: [{ v: (2 / 3) * (Math.log10(3e10 * 100 * 20 * 2) - 9.1), tol: 0.06, why: 'Convert the lengths to metres: 100 km = 10⁵ m, 20 km = 2 × 10⁴ m.' }],
              hint: r`$A = 10^5 \times 2 \times 10^4 = 2 \times 10^9$ m², so $M_0 = 3 \times 10^{10} \times 2 \times 10^9 \times 2$.`,
              explain: r`$M_0 = 1.2 \times 10^{20}$ N·m, so $M_w = \frac23(20.08 - 9.1) \approx 7.3$. A magnitude 9 needs a rupture roughly 1,000 km long and 20 m of slip, which only the great subduction zones can provide.`,
            },
          ],
          recap: [
            'Locked faults store strain and release it suddenly: elastic rebound.',
            'Recurrence time ≈ slip per quake ÷ plate speed; exact timing is unpredictable.',
            r`Seismic moment $M_0 = \mu A D$ sets the moment magnitude.`,
          ],
        },
        {
          id: 'buildings',
          title: 'Shaking Buildings',
          summary: 'Resonance, soil and protection',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Buildings sway too',
              body: r`A building is an oscillator: it sways at its own natural period. A handy rule of thumb is about **0.1 s per storey**: a 10-storey building sways back and forth about once a second.

If the ground shakes with a period close to a building's own, the building **resonates**, swaying far more than the ground itself.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Mexico City, 1985',
              prompt: r`Mexico City sits on soft clay from an old lakebed, which shook with a period of about **2 seconds** during the 1985 earthquake. Find the building height (in storeys) that resonates most strongly with this shaking.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 11, grid: 5, gridY: 2, height: 260, axes: { xlabel: 'storeys', ylabel: 'sway ÷ ground motion' },
                params: { n: { min: 1, max: 40, step: 1, value: 5, slider: false } },
                curves: [{ f: (n) => bldgResp(Math.max(1, n)), from: 1, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.n, y: (p) => bldgResp(p.n), drag: { x: 'n' }, color: 'coral' }],
                readout: (p) => r`${p.n} storeys: natural period $${bldgPeriod(p.n).toFixed(1)}$ s, sway $\approx ${bldgResp(p.n).toFixed(1)}\times$ the ground motion`,
                goal: (p) => p.n === 20,
                hint: 'Match the building’s natural period to the ground’s 2 s period.',
                solution: { n: 20 },
              },
              explain: r`About **20 storeys** (period 2 s). In 1985, the soft lake clay amplified 2-second shaking, and medium-rise buildings suffered most, while many low and very tall buildings nearby survived. (Damage lengthens a building's period, so 10–15-storey buildings drifted into resonance as they cracked.) Around 10,000 people died.`,
            },
            {
              type: 'numeric',
              title: 'Sideways force',
              prompt: r`During strong shaking, the ground accelerates sideways at 0.3 g. What horizontal force acts on a 1,000 kg section of a building? ($g = 9.8$ m/s².)`,
              unit: 'N',
              answer: 2940,
              tol: 5,
              wrong: [{ v: 300, why: 'Multiply by g as well: F = m × 0.3 × 9.8.' }, { v: 9800, why: 'That’s its weight. The sideways force is 0.3 of that.' }],
              explain: r`$F = ma = 1000 \times 0.3 \times 9.8 = 2940$ N: like tipping the building so that 30% of its weight pulls it sideways. Buildings are designed mainly to carry vertical loads, so sideways forces are dangerous.`,
            },
            {
              type: 'mcq',
              title: 'Base isolation',
              prompt: r`Some buildings sit on rubber and steel bearings that let the ground move beneath them. How does this help?`,
              choices: [
                { t: 'It lengthens the building’s natural period to 2–3 s, far from the short, strong periods of most ground shaking, so less energy gets in', ok: true },
                { t: 'It makes the building heavier', why: 'Isolators don’t add significant weight. They make the building effectively much more flexible at its base.' },
                { t: 'It stops all movement', why: 'The building still moves, but slowly and gently, while the ground jolts back and forth underneath.' },
              ],
              explain: r`Most earthquake energy comes at periods around 0.1–1 s. Isolators detune the building away from that band, like a tuned mass damper in reverse. Hospitals and emergency centres in Japan, New Zealand and California increasingly use them.`,
            },
            {
              type: 'numeric',
              title: 'A rule of thumb',
              prompt: r`A building’s natural sway period is roughly 0.1 s per storey. What is the period of a 20-storey building, in seconds?`,
              unit: 's',
              answer: 2,
              tol: 0.01,
              explain: r`About 2 s. In Mexico City in 1985, soft lake-bed soils shook with a period near 2 s, so buildings of 6 to 15 storeys were hit hardest.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Ground turning to liquid',
              prompt: r`In the 1964 Niigata earthquake in Japan, apartment buildings tipped over intact, as if their foundations had sunk into mud. What happened?`,
              choices: [
                { t: 'Liquefaction: shaking made waterlogged sand lose contact between grains, so it flowed like a liquid', ok: true },
                { t: 'The buildings were too tall', why: 'They toppled undamaged: it was the ground that failed, not the structures.' },
                { t: 'A sinkhole opened', why: 'The cause was widespread: saturated sandy soil temporarily behaved like a liquid.' },
              ],
              explain: r`Shaking raises the water pressure between grains of saturated sand, until the grains no longer press on each other and the soil loses its strength. Engineers now test soil for liquefaction risk and use deep piles or ground improvement in vulnerable areas.`,
            },
          ],
          recap: [
            'Buildings have natural periods of about 0.1 s per storey.',
            'Ground shaking near that period makes them resonate; soft soils amplify certain periods.',
            'Base isolation and good foundations reduce the danger.',
          ],
        },
        {
          id: 'recurrence',
          title: 'Earthquake Odds',
          summary: 'Forecasting with probabilities',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Not a timetable',
              body: r`Geologists can often say that a fault produces a large earthquake every 150 years **on average**, from layers of disturbed sediment or historical records. But the gaps are irregular, so forecasts are given as probabilities.

The simplest model treats quakes as random events at a steady average rate (a **Poisson process**). With an average gap of $T$ years, the chance of at least one quake in the next $t$ years is
$$P = 1 - e^{-t/T}.$$`,
            },
            {
              type: 'numeric',
              title: 'Thirty years',
              prompt: r`A fault averages one large quake every 150 years. What is the chance of at least one in the next 30 years? (Percentage, 1 decimal place.)`,
              unit: '%',
              answer: (1 - Math.exp(-0.2)) * 100,
              tol: 0.15,
              explain: r`$1 - e^{-30/150} = 1 - e^{-0.2} \approx 18.1\%$, a little less than the naive $\frac{30}{150} = 20\%$ (because two quakes in the window only count once).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Even odds',
              prompt: r`For the same fault ($T = 150$ years), find the time window within which a quake becomes **more likely than not** (50%).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 400, ymin: 0, ymax: 1, grid: false, height: 260, axes: { xlabel: 'years ahead', ylabel: 'chance of at least one quake', xticks: 50, yticks: 0.25 },
                params: { t: { min: 1, max: 400, step: 0.5, value: 50, label: 'window', color: 'coral', format: (v) => `${fix(v, 1)} years` } },
                curves: [{ f: (x) => 1 - Math.exp(-x / 150), color: 'violet', width: 3 }, { f: () => 0.5, color: 'teal', dash: true }],
                points: [{ x: (p) => p.t, y: (p) => 1 - Math.exp(-p.t / 150), color: 'coral' }],
                readout: (p) => `chance within ${p.t.toFixed(1)} years: **${(100 * (1 - Math.exp(-p.t / 150))).toFixed(1)}%**`,
                goal: (p) => Math.abs(1 - Math.exp(-p.t / 150) - 0.5) < 0.002,
                hint: r`Solve $e^{-t/150} = \frac12$, so $t = 150 \ln 2$.`,
                solution: { t: 104 },
              },
              explain: r`$t = 150 \ln 2 \approx 104$ years: less than the average gap! And even after 150 years, the chance is only $1 - e^{-1} \approx 63\%$, not 100%. Random events cluster and leave long gaps.`,
            },
            {
              type: 'mcq',
              title: 'Overdue?',
              prompt: r`It has been 200 years since the last big quake on a fault with an average gap of 150 years. In the Poisson model, is a quake "overdue"?`,
              choices: [
                { t: 'No: the chance in the next 30 years is still 18%, exactly as if the last quake were yesterday', ok: true },
                { t: 'Yes: it must happen very soon', why: 'In the Poisson model the past has no influence. The risk per year is constant.' },
                { t: 'Yes: it is now certain within 30 years', why: 'Nothing is certain in a random model; the 30-year chance stays at 18%.' },
              ],
              explain: r`A Poisson process has no memory, like a fair coin that is never "due" for heads. Real faults are somewhere in between: stress does build up after each quake, so some forecasts use renewal models in which the risk rises with time. Which model fits best is an active research question.`,
            },
            {
              type: 'numeric',
              title: 'One in a hundred',
              prompt: r`A building is designed for an earthquake with a 1% chance of happening in any given year. What is the chance it experiences at least one such quake over a 50-year lifetime? (Percentage, nearest whole number.)`,
              unit: '%',
              answer: (1 - 0.99 ** 50) * 100,
              tol: 0.6,
              explain: r`$1 - 0.99^{50} \approx 0.395$: about **39%**. A "1-in-100-year" event is far from rare over a long lifetime, which is why building codes use them.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two faults',
              prompt: r`A city sits near two independent faults. The chance of a damaging quake in the next 30 years is 20% from one and 30% from the other. What is the chance of at least one damaging quake? (Percentage.)`,
              unit: '%',
              answer: 44,
              tol: 0.5,
              wrong: [{ v: 50, why: 'You can’t just add the chances: both might happen. Find the chance that neither does.' }, { v: 6, why: 'That’s the chance that both happen.' }],
              explain: r`The chance that neither happens is $0.8 \times 0.7 = 0.56$, so at least one has probability $1 - 0.56 = 44\%$. Regional forecasts combine many faults this way.`,
            },
          ],
          recap: [
            r`With average gap $T$, the chance of a quake within $t$ years is $1 - e^{-t/T}$.`,
            'Random events have no memory: a fault is never “overdue” in the Poisson model.',
            'Combine independent risks through the chance that none occur.',
          ],
        },
      ],
    },
  ],
};
