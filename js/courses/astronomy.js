import { fix, sig } from '../lib/svg.js';

const r = String.raw;
const f1 = (v) => (Math.round(v * 10) / 10).toString();

// draw the Moon's phase as seen from Earth; phi = angle of the Moon around Earth from the Sun direction (0 = new, 180 = full)
function moonPhase(s, cx, cy, R, phiDeg) {
  const phi = (phiDeg * Math.PI) / 180;
  const f = (1 - Math.cos(phi)) / 2;
  const waxing = ((phiDeg % 360) + 360) % 360 <= 180;
  const rx = R * Math.abs(Math.cos(phi));
  const crescent = f < 0.5;
  let d;
  if (waxing) d = `M${cx} ${cy - R} A${R} ${R} 0 0 1 ${cx} ${cy + R} A${rx} ${R} 0 0 ${crescent ? 0 : 1} ${cx} ${cy - R} Z`;
  else d = `M${cx} ${cy - R} A${R} ${R} 0 0 0 ${cx} ${cy + R} A${rx} ${R} 0 0 ${crescent ? 1 : 0} ${cx} ${cy - R} Z`;
  return [s('circle', { cx, cy, r: R, fill: '#2b2a33' }), s('path', { d, fill: '#f3ecd2' })];
}

// hours of daylight at latitude lat (degrees) on day d of the year (0 = 1 Jan)
const decl = (d) => -23.44 * Math.cos((2 * Math.PI * (d + 10)) / 365);
const dayLength = (lat, d) => {
  const x = -Math.tan((lat * Math.PI) / 180) * Math.tan((decl(d) * Math.PI) / 180);
  return (2 * ((Math.acos(Math.max(-1, Math.min(1, x))) * 180) / Math.PI)) / 15;
};
// H–R diagram: x = −log10(T), y = log10(L / L☉); luminosity from radius (R☉) and temperature
const lum = (R, T) => R * R * (T / 5772) ** 4;
const HR_STARS = [['Sun', 5772, 1], ['Sirius A', 9940, 25], ['Vega', 9600, 40], ['Rigel', 12100, 120000], ['Betelgeuse', 3600, 100000], ['Aldebaran', 3900, 440], ['Proxima Cen', 3040, 0.0017], ['Sirius B', 25000, 0.056]];
const MAIN_SEQ = [[30000, 1e5], [20000, 2e4], [10000, 40], [7500, 6], [5772, 1], [4500, 0.2], [3500, 0.02], [2800, 0.001]];

// a lumpy grid of galaxies, fixed once (a tiny deterministic shuffle so it doesn't look like a crystal)
const HUBBLE_GAL = (() => {
  const out = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) out.push([i * 1.1 + 0.5 * rnd(), j * 1.1 + 0.5 * rnd()]);
  return out;
})();
const HUBBLE_HOME = [[0, 0], [2, 1], [-2, -1]].map(([i, j]) => (i + 6) * 9 + (j + 4));

// seen from above the Sun (at the origin): Earth on a circle of radius 7 (1 turn in 365.25 days), the Moon on a circle of radius 1.5 round Earth
// (1 turn among the stars in 27.32 days, both anticlockwise), starting at new moon. Sizes are not to scale.
// 2.4 days a second, a pause at 27.32 days, then slower to 29.53
const lunarDay = (t) => { const t1 = 0.5 + 27.32 / 2.4; return t < t1 ? Math.max(0, (t - 0.5) * 2.4) : t < t1 + 1.8 ? 27.32 : Math.min(29.53, 27.32 + (t - t1 - 1.8) * 1.2); };
const lunarPos = (d) => { const ea = -0.25 + (2 * Math.PI * d) / 365.25, E = [7 * Math.cos(ea), 7 * Math.sin(ea)], ma = -0.25 + Math.PI + (2 * Math.PI * d) / 27.32; return { E, M: [E[0] + 1.5 * Math.cos(ma), E[1] + 1.5 * Math.sin(ma)], ea, ma }; };

export default {
  id: 'astronomy',
  subject: 'physics',
  title: 'Astronomy & Cosmology',
  level: 'Intermediate',
  cover: 'astro',
  tagline: 'Moon phases, seasons, starlight, star distances, the H–R diagram and the expanding universe.',
  description: r`Grasp the staggering scale of space, explain the Moon's phases and the seasons, read a star's temperature from its colour, measure the distances to stars, map them on the H–R diagram, follow stars from birth to death, and trace the expanding universe back to the Big Bang.`,
  prereq: 'Gravity & Orbits, and Light & Optics',
  chapters: [
    {
      title: 'Our Corner of Space',
      summary: 'Distances, seasons and the Moon.',
      lessons: [
        {
          id: 'scale',
          title: 'The Scale of Space',
          summary: 'Light-years and looking back in time',
          icon: 'atom',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Sunlight’s journey',
              prompt: 'The Sun is about 150 million km away, and light travels at 300,000 km/s. How many minutes does sunlight take to reach us?',
              unit: 'min',
              answer: 150e6 / 3e5 / 60,
              tol: 0.1,
              wrong: [{ v: 500, tol: 1, why: 'That’s the time in seconds. Divide by 60.' }],
              explain: r`$\frac{150{,}000{,}000}{300{,}000} = 500$ s $\approx 8.3$ minutes. You always see the Sun as it was about 8 minutes ago.`,
            },
            {
              type: 'explain',
              title: 'Light-years',
              body: r`Space distances are so large that astronomers measure them by how long light takes to cross them. A **light-year** is the distance light travels in one year: about $9.5 \times 10^{12}$ km (9.5 trillion km).

| Object | Distance |
|---|---|
| Moon | 1.3 light-seconds |
| Sun | 8.3 light-minutes |
| Nearest star (Proxima Centauri) | 4.2 light-years |
| Across the Milky Way | ~100,000 light-years |
| Andromeda galaxy | 2.5 million light-years |

Looking far away means looking back in time: we see Andromeda as it was 2.5 million years ago.`,
            },
            {
              type: 'mcq',
              title: 'A scale model',
              prompt: 'If the Sun were a grapefruit (about 14 cm across) in London, roughly where would the nearest star be, as another grapefruit?',
              choices: [
                { t: 'About 4,000 km away, roughly the distance to the Sahara', ok: true },
                { t: 'Across the street', why: 'Space is far emptier than that. At this scale, Earth is a grain of sand 15 m from the grapefruit.' },
                { t: 'On the Moon', why: 'Too far! The real ratio puts it about a few thousand kilometres away.' },
              ],
              explain: r`The Sun is 1.4 million km across, so the scale is 1 to 10 billion. Proxima Centauri, $4 \times 10^{13}$ km away, shrinks to about 4,000 km. In this model, Earth is a grain of sand 15 m from the grapefruit. Space is overwhelmingly empty.`,
            },
            {
              type: 'numeric',
              title: 'Messages from Voyager',
              prompt: 'In 2024 the Voyager 1 space probe was about 24 billion km from Earth. How many hours does a radio signal (travelling at the speed of light) take to reach it?',
              unit: 'hours',
              answer: 24e9 / 3e5 / 3600,
              tol: 0.3,
              wrong: [{ v: 80000, relTol: 0.01, why: 'That’s in seconds. Divide by 3600.' }, { v: 1333, tol: 2, why: 'That’s in minutes. Divide by 60 again.' }],
              explain: r`$\frac{24 \times 10^9}{3 \times 10^5} = 80{,}000$ s $\approx 22$ hours, so a question and its answer took nearly two days. Voyager moves out about half a billion km a year, so by late 2026 it is a full light-day away. Yet Voyager, our most distant probe, has covered less than 0.1% of the way to the nearest star.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A logarithmic journey',
              body: r`Each step to the right multiplies the distance by 10. Slide outward from the Moon to the edge of the observable universe and watch how long light takes.`,
              widget: {
                kind: 'graph', xmin: 5, xmax: 24, ymin: 0, ymax: 3, grid: false, height: 236, padB: 54, axes: { xticks: 2, yticks: 10 },
                params: { L: { min: 5, max: 23.6, step: 0.05, value: 8.2, label: 'distance', color: 'violet', format: (v) => `$10^{${v.toFixed(1)}}$ km` } },
                extra: ({ plot, p, s }) => {
                  const O = [['Moon', 3.84e5], ['Sun', 1.5e8], ['Neptune', 4.5e9], ['Voyager 1', 2.5e10], ['Proxima Cen.', 4.0e13], ['Galactic centre', 2.5e17], ['Andromeda', 2.4e19], ['Virgo cluster', 5e20], ['Observable edge', 4.4e23]];
                  // marker first, so the object names (with a halo) stay readable on top of it
                  const out = [s('line', { x1: plot.X(5), x2: plot.X(24), y1: plot.Y(1.4), y2: plot.Y(1.4), stroke: 'var(--ink-3)', 'stroke-width': 2 }), s('line', { x1: plot.X(p.L), x2: plot.X(p.L), y1: plot.Y(0.95), y2: plot.Y(1.85), stroke: 'var(--violet)', 'stroke-width': 4, 'stroke-linecap': 'round' })];
                  O.forEach(([n, d], i) => { const x = Math.log10(d); out.push(s('circle', { cx: plot.X(x), cy: plot.Y(1.4), r: 5, class: 'fl-teal' }), s('text', { x: plot.X(x), y: plot.Y(i % 2 ? 0.55 : 2.05), 'text-anchor': 'middle', class: 'lbl halo-text', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: n })); });
                  out.push(s('text', { x: (plot.left + plot.right) / 2, y: plot.bottom + 40, 'text-anchor': 'middle', class: 'axis-label', text: 'distance (powers of 10 km)' }));
                  return out;
                },
                readout: (p) => { const d = 10 ** p.L, sec = d / 299792; const t = sec < 120 ? `${sec.toFixed(1)} seconds` : sec < 7200 ? `${(sec / 60).toFixed(1)} minutes` : sec < 2 * 86400 ? `${(sec / 3600).toFixed(1)} hours` : sec < 2 * 3.156e7 ? `${(sec / 86400).toFixed(0)} days` : `${(sec / 3.156e7).toPrecision(3)} years`; return `${d.toExponential(1)} km · light takes **${t}**`; },
              },
              after: r`From the Moon (1.3 light-seconds) to Proxima Centauri (4.2 light-years) is a factor of about 100 million; from there to the edge of the observable universe is another factor of 10 billion. On a linear scale everything nearby would be squashed into a single dot, which is why astronomers think in powers of ten.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A star that is gone?',
              prompt: 'You look at a star 1,000 light-years away. Could it have already exploded?',
              choices: [
                { t: 'Yes: we see the light it sent 1,000 years ago', ok: true },
                { t: 'No: we would see it disappear immediately', why: 'News of the explosion travels at the speed of light, so it won’t reach us for up to 1,000 years.' },
              ],
              explain: r`The light reaching your eye left the star 1,000 years ago. If it exploded since then, the news is still on its way. Every glance at the night sky is a look into the past.`,
            },
          ],
          recap: [
            'A light-year is the distance light travels in a year: about 9.5 trillion km.',
            'Sunlight takes about 8.3 minutes to reach Earth. The nearest star is 4.2 light-years away.',
            'Looking farther away means seeing further back in time.',
          ],
        },
        {
          id: 'moon-seasons',
          title: 'Phases & Seasons',
          summary: 'Geometry in the sky',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Why phases?',
              prompt: 'Why does the Moon show phases (crescent, half, full…)?',
              choices: [
                { t: 'We see different amounts of its sunlit half as it orbits Earth', ok: true },
                { t: 'Earth’s shadow covers part of it', why: 'That only happens during a lunar eclipse. Ordinary phases come from viewing angle.' },
                { t: 'Clouds on the Moon', why: 'The Moon has no atmosphere and no clouds.' },
              ],
              explain: r`The Sun always lights half of the Moon. As the Moon orbits Earth, we see that lit half from different angles.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Orbit the Moon',
              body: r`Sunlight comes from the right. Drag the Moon around Earth, and watch how it looks from Earth (inset).`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 4.2, ymin: -2.3, ymax: 2.3, grid: false, axes: false, maxWidth: 560,
                params: { a: { min: 0, max: 360, step: 5, value: 135, slider: false } },
                points: [{ x: (p) => 1.7 * Math.cos((p.a * Math.PI) / 180), y: (p) => 1.7 * Math.sin((p.a * Math.PI) / 180), drag: { key: 'a', fn: (x, y) => { let t = (Math.atan2(y, x) * 180) / Math.PI; if (t < 0) t += 360; return { a: Math.round(t / 5) * 5 }; } }, color: 'ink', r: 4, ariaLabel: 'Moon position' }],
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let k = -2; k <= 2; k++) els.push(s('line', { x1: plot.X(4.1), x2: plot.X(2.7), y1: plot.Y(k * 0.8), y2: plot.Y(k * 0.8), stroke: 'var(--amber)', 'stroke-width': 2, opacity: 0.6, 'stroke-dasharray': '6 5' }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1.7) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '4 6' }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 20, class: 'fl-blue' }));
                  // lit half of the moon in orbit view (facing the Sun on the right)
                  const mx = plot.X(1.7 * Math.cos((p.a * Math.PI) / 180)), my = plot.Y(1.7 * Math.sin((p.a * Math.PI) / 180));
                  els.push(s('circle', { cx: mx, cy: my, r: 11, fill: '#2b2a33' }));
                  els.push(s('path', { d: `M${mx} ${my - 11} A11 11 0 0 1 ${mx} ${my + 11} Z`, fill: '#f3ecd2' }));
                  // inset: as seen from Earth. Phase angle = the Moon's angle from the Sun direction (0 = new, 180 = full)
                  els.push(s('rect', { x: plot.X(-2.95), y: plot.Y(2.25), width: 110, height: 128, rx: 12, class: 'fl-card', stroke: 'var(--line-2)' }));
                  els.push(...moonPhase(s, plot.X(-2.95) + 55, plot.Y(2.25) + 58, 38, p.a % 360));
                  els.push(s('text', { x: plot.X(-2.95) + 55, y: plot.Y(2.25) + 118, 'text-anchor': 'middle', class: 'tick', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', text: 'seen from Earth' }));
                  return els;
                },
                readout: (p) => {
                  const ph = p.a % 360; // 0 new, 180 full
                  const names = ph < 10 || ph > 350 ? 'New moon' : ph < 80 ? 'Waxing crescent' : ph <= 100 ? 'First quarter' : ph < 170 ? 'Waxing gibbous' : ph <= 190 ? 'Full moon' : ph < 260 ? 'Waning gibbous' : ph <= 280 ? 'Last quarter' : 'Waning crescent';
                  return r`${names}: $${Math.round(((1 - Math.cos((ph * Math.PI) / 180)) / 2) * 100)}\%$ lit`;
                },
              },
              after: r`When the Moon is between Earth and the Sun, we face its dark side: **new moon**. On the far side of Earth from the Sun, we see the whole lit face: **full moon**. A full cycle takes about 29.5 days.`,
            },
            { /*anim2:astronomy*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Two kinds of month',
              body: r`Earth and the Moon seen from far above the Sun, starting at **new moon** (the Moon between Earth and the Sun). The {violet:violet arrow} always points the same way, towards a distant star; the {amber:amber line} points to the Sun.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 9.6, ymin: -3.9, ymax: 3.7, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 1, max: 18, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const d = lunarDay(p.t), { E, M } = lunarPos(d), els = [], R = (q) => plot.X(q) - plot.X(0);
                  const orbit = [];
                  for (let i = 0; i <= 40; i++) { const a = -0.55 + (0.95 * i) / 40; orbit.push(`${i ? 'L' : 'M'}${plot.X(7 * Math.cos(a)).toFixed(1)} ${plot.Y(7 * Math.sin(a)).toFixed(1)}`); }
                  els.push(s('path', { d: orbit.join(''), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: R(0.8), class: 'fl-amber' }));
                  els.push(s('line', { x1: plot.X(E[0]), y1: plot.Y(E[1]), x2: plot.X(E[0] * 0.62), y2: plot.Y(E[1] * 0.62), stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
                  els.push(s('circle', { cx: plot.X(E[0]), cy: plot.Y(E[1]), r: R(1.5), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.2 }));
                  // the fixed star direction, drawn from Earth: the direction the Moon was in at the start
                  const sa = -0.25 + Math.PI, X1 = plot.X(E[0] + 2.4 * Math.cos(sa)), Y1 = plot.Y(E[1] + 2.4 * Math.sin(sa)), an = Math.atan2(Y1 - plot.Y(E[1]), X1 - plot.X(E[0]));
                  els.push(s('path', { d: `M${plot.X(E[0])} ${plot.Y(E[1])}L${X1} ${Y1}M${X1 - 9 * Math.cos(an - 0.45)} ${Y1 - 9 * Math.sin(an - 0.45)}L${X1} ${Y1}L${X1 - 9 * Math.cos(an + 0.45)} ${Y1 - 9 * Math.sin(an + 0.45)}`, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
                  // the Moon's path so far
                  const trail = [];
                  for (let i = 0; i <= 60; i++) { const q = lunarPos((d * i) / 60).M; trail.push(`${i ? 'L' : 'M'}${plot.X(q[0]).toFixed(1)} ${plot.Y(q[1]).toFixed(1)}`); }
                  els.push(s('path', { d: trail.join(''), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(s('circle', { cx: plot.X(E[0]), cy: plot.Y(E[1]), r: 8, class: 'fl-blue' }));
                  els.push(s('circle', { cx: plot.X(M[0]), cy: plot.Y(M[1]), r: 5, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => { const d = lunarDay(p.t); return `day ${fix(d, 1)}${d === 27.32 ? ' · back in line with the same star, but not yet with the Sun' : d >= 29.53 ? ' · **new moon again**' : ''}`; },
              },
              after: r`After 27.3 days the Moon has gone once round Earth: it's back in line with the same distant star (the **sidereal month**). But meanwhile Earth has carried it about 27° further round the Sun, so the Sun is now in a different direction, and the Moon needs about 2.2 more days to catch up with it. The cycle of phases, from new moon to new moon, takes 29.5 days (the **synodic month**). Earth's day works the same way: it turns once relative to the stars in 23 h 56 min, but needs about 4 more minutes to face the Sun again.`,
            },
            {
              type: 'mcq',
              title: 'Full moon timing',
              prompt: 'At what time does a full moon rise?',
              choices: [
                { t: 'Around sunset', ok: true },
                { t: 'Around noon', why: 'A full moon is opposite the Sun in the sky, so it rises as the Sun sets.' },
                { t: 'Around midnight', why: 'At midnight a full moon is highest in the sky. It rose at sunset.' },
              ],
              explain: r`A full moon sits on the opposite side of Earth from the Sun. As the Sun sets in the west, the full moon rises in the east, and it's visible all night.`,
            },
            {
              type: 'mcq',
              title: 'Seasons',
              prompt: 'Why is summer warmer than winter?',
              choices: [
                { t: 'Earth’s tilted axis makes sunlight more direct, and days longer, in summer', ok: true },
                { t: 'Earth is closer to the Sun in summer', why: 'Earth is actually closest to the Sun in early January, during the northern winter. And the two hemispheres have opposite seasons at the same time.' },
                { t: 'The Sun burns hotter in summer', why: 'The Sun’s output barely changes over a year.' },
              ],
              explain: r`Earth's axis is tilted about 23.4°. When your hemisphere tilts toward the Sun, sunlight hits more directly (concentrating its energy) and days are longer. That's summer. Six months later, it tilts away: winter. When it's summer in Europe, it's winter in Australia.`,
            },
            {
              type: 'interactive',
              title: 'Hours of daylight',
              body: r`The graph shows the hours of daylight through the year at a chosen latitude (positive is north). Find the smallest latitude where the Sun **never sets** on the longest day of the year.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 365, ymin: 0, ymax: 24, grid: false, height: 300,
                axes: { xlabel: 'day of year', ylabel: 'hours', xticks: 50, yticks: 6 },
                params: { lat: { min: 0, max: 90, step: 0.5, value: 51.5, label: 'latitude', color: 'blue', format: (v) => `${fix(v, 1)}° N` } },
                curves: [{ f: (x, p) => dayLength(p.lat, x), color: 'amber', width: 3, n: 365 }, { f: () => 12, color: 'muted', dash: true }],
                readout: (p) => { let mx = 0, mn = 24; for (let d = 0; d < 365; d++) { const L = dayLength(p.lat, d); mx = Math.max(mx, L); mn = Math.min(mn, L); } return `Longest day **${mx.toFixed(1)} h**, shortest day **${mn.toFixed(1)} h**`; },
                goal: (p) => { let mx = 0; for (let d = 0; d < 365; d++) mx = Math.max(mx, dayLength(p.lat, d)); return mx > 23.99 && p.lat <= 67.5; },
                hint: r`The Sun is $23.4°$ north of the equator at the June solstice. How far from the pole can you be and still see it at midnight?`,
                solution: { lat: 67 },
              },
              explain: r`At about $90° - 23.4° = 66.6°$ N, the **Arctic Circle**, the Sun just skims the horizon at midnight on the June solstice. (In reality the atmosphere bends sunlight slightly, so the midnight sun is seen a little south of the circle too.) At the equator, every day lasts about 12 hours all year.`,
            },
            {
              type: 'numeric',
              title: 'The noon Sun',
              prompt: r`On the June solstice the Sun is directly overhead at $23.4°$ N. How high above the horizon is the noon Sun in London ($51.5°$ N)?`,
              unit: '°',
              answer: 90 - 51.5 + 23.4,
              tol: 0.3,
              wrong: [{ v: 90 - 51.5 - 23.4, tol: 0.3, why: 'That’s the December solstice, when the Sun is overhead at 23.4° S.' }, { v: 51.5 - 23.4, tol: 0.3, why: r`London is $51.5 - 23.4 = 28.1°$ from where the Sun is overhead, so the Sun is $28.1°$ from straight up.` }],
              explain: r`London is $51.5° - 23.4° = 28.1°$ north of the place where the Sun is overhead, so the noon Sun is $28.1°$ from the zenith: $90° - 28.1° = 61.9°$ above the horizon. In December it is only $90° - 74.9° = 15.1°$ high, which spreads the same sunlight over about 3.4 times more ground.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Eclipses',
              prompt: 'A solar eclipse needs the Moon between Earth and the Sun, which happens every new moon. So why don’t we get an eclipse every month?',
              choices: [
                { t: 'The Moon’s orbit is tilted about 5°, so it usually passes above or below the Sun', ok: true },
                { t: 'The Moon is too small to block the Sun', why: 'By a lovely coincidence, the Moon and the Sun look almost exactly the same size in our sky: the Sun is about 400 times wider, but also about 400 times farther away.' },
                { t: 'Eclipses happen every month but are too dim to see', why: 'Most months the Moon’s shadow misses Earth entirely.' },
              ],
              explain: r`The Moon's orbit is tilted about 5° to Earth's orbit, so at most new moons its shadow passes above or below Earth. Eclipses only happen when a new moon (or full moon, for a lunar eclipse) occurs near where the two orbits cross.`,
            },
          ],
          recap: [
            'Moon phases come from seeing different amounts of its sunlit half.',
            'Seasons come from Earth’s 23.4° axial tilt, not from its distance to the Sun.',
            'Eclipses are rare because the Moon’s orbit is tilted about 5°.',
          ],
        },
      ],
    },
    {
      title: 'Stars',
      summary: 'How they shine, and how they die.',
      lessons: [
        {
          id: 'starlight',
          title: 'Starlight',
          summary: 'Brightness and colour',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Red and blue stars',
              body: r`The star Betelgeuse glows orange-red, while Rigel, nearby in the same constellation (Orion), glows blue-white.`,
              prompt: 'Which star has the hotter surface?',
              cols: 2,
              choices: [
                { t: 'Rigel (blue-white)', ok: true },
                { t: 'Betelgeuse (red)', why: 'For hot glowing objects, red means cooler and blue means hotter. Think of a stove ring: dull red, then orange, then white as it heats up.' },
              ],
              explain: r`Hotter objects glow at shorter wavelengths. Betelgeuse's surface is around 3,500 K, Rigel's around 12,000 K. The Sun, at about 5,800 K, is in between.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Colour and temperature',
              body: r`A hot object glows brightest at a wavelength set by its temperature (**Wien's law**):
$$\lambda_\text{peak} = \frac{2.9 \times 10^{-3}\ \text{m·K}}{T}$$
Change the temperature.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2000, ymin: 0, ymax: 1.1, grid: 250, gridY: 0.25, height: 280, axes: { xlabel: 'wavelength (nm)', ylabel: '', yticks: 10 },
                params: { T: { min: 2500, max: 12000, step: 100, value: 5800, label: '$T$', color: 'coral', format: (v) => `${v} K` } },
                curves: [{
                  f: (x, p) => {
                    const lam = x * 1e-9; if (lam <= 0) return 0;
                    const planck = (l, T) => 1 / (l ** 5 * (Math.exp(0.014388 / (l * T)) - 1));
                    const peak = 2.898e-3 / p.T;
                    return planck(lam, p.T) / planck(peak, p.T);
                  },
                  color: 'coral', from: () => 50,
                }],
                extra: ({ plot, s }) => {
                  const els = [];
                  for (let w = 400; w < 700; w += 10) els.push(s('rect', { x: plot.X(w), y: plot.bottom - 8, width: plot.X(w + 10) - plot.X(w) + 0.5, height: 8, fill: `hsl(${270 - ((w - 400) / 300) * 270} 85% 55%)` }));
                  return els;
                },
                readout: (p) => r`peak at $\frac{2.9 \times 10^{-3}}{${p.T}} = ${Math.round(2.898e6 / p.T)}$ nm`,
              },
              after: 'The rainbow strip marks visible light. The Sun peaks right in the middle of the visible band. Cool stars peak in the infrared, and hot stars in the ultraviolet.',
            },
            {
              type: 'numeric',
              title: 'Sun’s peak',
              prompt: 'The Sun’s surface is about 5,800 K. At what wavelength does it glow most strongly, in nm?',
              unit: 'nm',
              answer: 2.9e-3 / 5800 * 1e9,
              tol: 5,
              wrong: [{ v: 5e-7, tol: 1e-8, why: 'That’s in metres. Convert to nanometres (×10⁹).' }],
              explain: r`$\frac{2.9 \times 10^{-3}}{5800} = 5 \times 10^{-7}$ m $= 500$ nm: green-blue light, right in the middle of what our eyes see best. (The Sun still looks white, because it emits strongly across all the visible colours.)`,
            },
            {
              type: 'explain',
              title: 'Magnitudes',
              body: r`Around 130 BC the Greek astronomer Hipparchus ranked stars from **1st magnitude** (the brightest) to **6th magnitude** (the faintest he could see). Our eyes respond to ratios, not differences, so the scale is logarithmic. In modern form:

::: key
5 magnitudes = a factor of exactly 100 in brightness, so 1 magnitude is a factor of $100^{1/5} \approx 2.512$. **Bigger** magnitudes are **fainter**.
:::

Sirius is magnitude $-1.5$, the full Moon $-12.7$, the Sun $-26.7$. The Hubble Space Telescope reaches about magnitude $+31$.`,
            },
            {
              type: 'numeric',
              title: 'Two magnitudes',
              prompt: 'A star of magnitude 2 is how many times brighter than a star of magnitude 4?',
              answer: 100 ** (2 / 5),
              tol: 0.05,
              wrong: [{ v: 2, why: 'Magnitudes are logarithmic: each step is a factor of 2.512.' }, { v: 40, tol: 0.5, why: r`That's $100 \times \frac25$. The factor is $100^{2/5}$, or $2.512 \times 2.512$.` }],
              explain: r`Two magnitudes is a factor of $2.512^2 = 100^{2/5} \approx 6.3$. The scale feels upside down, but it matches how our eyes judge brightness: equal steps in magnitude look like equal steps in brightness.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Dimmer with distance',
              prompt: 'Starlight spreads out by the inverse-square law. If an identical star were 10 times farther away, how many times dimmer would it look?',
              answer: 100,
              wrong: [{ v: 10, why: r`Brightness falls as $1/d^2$: $10^2 = 100$.` }],
              explain: r`Light spreads over a sphere of area $4\pi d^2$, so brightness $\propto 1/d^2$: 10 times farther means $10^2 = 100$ times dimmer. Astronomers use this, plus a star's known true brightness, to measure distances.`,
            },
          ],
          recap: [
            'Hotter stars are bluer, cooler stars are redder.',
            r`Wien's law: $\lambda_\text{peak} = 2.9 \times 10^{-3}/T$. The Sun peaks around 500 nm.`,
            'Apparent brightness falls as 1/d².',
          ],
        },
        {
          id: 'star-lives',
          title: 'Lives of Stars',
          summary: 'Fusion, giants and remnants',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Big burns fast',
              prompt: 'A star with 10 times the Sun’s mass has 10 times as much fuel. How does its lifetime compare with the Sun’s?',
              choices: [
                { t: 'Much shorter: it burns its fuel thousands of times faster', ok: true },
                { t: 'About 10 times longer', why: 'More fuel, but a massive star’s crushing gravity makes its core hotter, and it burns enormously faster.' },
                { t: 'The same', why: 'Massive stars live much faster lives.' },
              ],
              explain: r`A star's power grows roughly as mass$^{3.5}$. Ten times the mass means about $10^{3.5} \approx 3000$ times the power, from only 10 times the fuel. So its lifetime is about $\frac{10}{3000}$ of the Sun's: tens of millions of years instead of 10 billion.`,
            },
            {
              type: 'explain',
              title: 'How stars shine',
              body: r`In a star's core, crushing pressure and temperatures over 10 million K fuse hydrogen nuclei into helium. Each helium nucleus weighs about 0.7% less than the four hydrogen nuclei that made it, and that missing mass becomes energy ($E = mc^2$).

A star is a balance: gravity squeezes in, while the pressure of hot gas, powered by fusion, pushes out. The Sun has been in this steady phase for about 4.6 billion years, and has about 5 billion to go.`,
            },
            {
              type: 'explain',
              title: 'How stars die',
              body: r`When the core runs out of hydrogen, the balance breaks:
- **Sun-like stars** swell into **red giants**, puff off their outer layers, and leave behind a hot, Earth-sized **white dwarf**.
- **Stars over about 8 solar masses** fuse heavier and heavier elements up to iron, then their cores collapse and they explode as **supernovae**. They leave a **neutron star**, or for the heaviest stars, a **black hole**.

Supernovae scatter the heavy elements made inside stars across space. The calcium in your bones and the iron in your blood were forged in stars that died before the Sun was born.`,
            },
            {
              type: 'mcq',
              title: 'The Sun’s fate',
              prompt: 'What will happen to the Sun at the end of its life?',
              choices: [
                { t: 'It becomes a red giant, then a white dwarf', ok: true },
                { t: 'It explodes as a supernova', why: 'The Sun isn’t massive enough. Supernovae need stars over about 8 times the Sun’s mass.' },
                { t: 'It becomes a black hole', why: 'Far too little mass. The Sun will end as a white dwarf.' },
              ],
              explain: r`In about 5 billion years, the Sun will swell into a red giant, possibly engulfing Mercury and Venus, then shed its outer layers and settle as a slowly cooling white dwarf about the size of Earth.`,
            },
            {
              type: 'interactive',
              title: 'Live fast, die young',
              body: r`A star’s lifetime is roughly $t \approx 10^{10}\ \text{years} \times M^{-2.5}$, with $M$ in solar masses: more fuel, but burned far faster. Find the mass of a star that lives only **10 million years**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 6, ymax: 11.5, grid: false, height: 260, axes: { xlabel: 'mass (Suns)', ylabel: 'lifetime (log₁₀ years)', xticks: 5, yticks: 1, yAt: 0 },
                params: { M: { min: 0.5, max: 40, step: 0.1, value: 5, label: 'mass', color: 'coral', format: (v) => `${v.toFixed(1)} Suns` } },
                curves: [{ f: (x) => 10 - 2.5 * Math.log10(x), color: 'violet', width: 3, from: 0.3 }, { f: () => 7, color: 'teal', dash: true }],
                points: [{ x: (p) => p.M, y: (p) => 10 - 2.5 * Math.log10(p.M), color: 'coral' }],
                readout: (p) => { const t = 1e10 * p.M ** -2.5; return `lifetime **${t >= 1e9 ? (t / 1e9).toFixed(1) + ' billion' : (t / 1e6).toFixed(1) + ' million'} years**`; },
                goal: (p) => Math.abs(1e10 * p.M ** -2.5 / 1e7 - 1) < 0.04,
                hint: 'You need M^2.5 = 1,000, so M = 1000^0.4.',
                solution: { M: 15.8 },
              },
              explain: r`$M = 1000^{0.4} \approx 16$ solar masses. Sixteen times the fuel, but it shines thousands of times brighter, so it is gone in 10 million years and explodes as a supernova. A red dwarf of half a solar mass will outlive the current age of the universe many times over.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Mass into energy',
              prompt: 'Hydrogen fusion turns about 0.7% of the fuel’s mass into energy. How much energy (in units of 10¹⁴ J) comes from fusing 1 kg of hydrogen? (c = 3 × 10⁸ m/s)',
              unit: r`$\times 10^{14}$ J`,
              answer: (0.007 * 9e16) / 1e14,
              tol: 0.1,
              wrong: [{ v: 900, why: r`Only 0.7% of the mass converts: $0.007 \times 9 \times 10^{16}$.` }],
              explain: r`$E = 0.007 \times 1 \times (3 \times 10^8)^2 = 6.3 \times 10^{14}$ J, about what burning 20,000 tonnes of coal releases. That's why fusion powers stars for billions of years.`,
            },
          ],
          recap: [
            'Stars fuse hydrogen into helium. The 0.7% of mass lost becomes energy.',
            'Massive stars burn hotter and die younger.',
            'Sun-like stars end as white dwarfs. Massive stars explode as supernovae, leaving neutron stars or black holes.',
          ],
        },
      ],
    },
    {
      title: 'Measuring the Stars',
      summary: 'Distances, sizes and the H–R diagram.',
      lessons: [
        {
          id: 'distances',
          title: 'The Distance Ladder',
          summary: 'Parallax and standard candles',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Winking at your thumb',
              body: r`Hold up a thumb at arm's length and look at it with one eye, then the other. It jumps sideways against the background.`,
              prompt: 'Now hold your thumb closer to your face. What happens to the jump?',
              cols: 2,
              choices: [
                { t: 'It gets bigger', ok: true },
                { t: 'It gets smaller', why: 'Nearer objects shift more when your viewpoint moves.' },
                { t: 'It stays the same', why: 'Try it! The closer the thumb, the bigger the jump.' },
              ],
              explain: r`The nearer the object, the bigger the apparent shift as your viewpoint moves. This is **parallax**, and your brain uses it (with two eyes) to judge distance. Astronomers use the same trick with a much wider baseline: Earth's orbit.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Parallax from Earth’s orbit',
              body: r`As Earth goes round the Sun, a nearby star seems to shift back and forth against much more distant background stars. Move Earth through the year, and change the star's distance. (The picture is hugely out of scale: real stars are hundreds of thousands of times farther away.)`,
              widget: {
                kind: 'graph', equal: true, xmin: -3.2, xmax: 3.2, ymin: -1.4, ymax: 5.6, grid: false, axes: false, maxWidth: 440,
                params: {
                  m: { min: 0, max: 12, step: 0.25, value: 3, label: 'month', color: 'blue', format: (v) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'][Math.round(v) % 13] },
                  d: { min: 1.6, max: 4.6, step: 0.1, value: 2.6, label: 'star distance', color: 'coral' },
                },
                extra: ({ plot, p, s }) => {
                  const th = (2 * Math.PI * p.m) / 12, ex = Math.cos(th), ey = Math.sin(th), H = 5.3;
                  const bg = (x0, y0) => x0 + ((0 - x0) * (H - y0)) / (p.d - y0);
                  const els = [
                    s('rect', { x: plot.X(-3.2), y: plot.Y(5.6), width: plot.X(3.2) - plot.X(-3.2), height: plot.Y(5.0) - plot.Y(5.6), class: 'fl-ink', opacity: 0.85 }),
                    ...[-2.7, -1.9, -0.8, 0.4, 1.3, 2.2, 2.9].map((x, i) => s('circle', { cx: plot.X(x), cy: plot.Y(5.3 + (i % 2 ? 0.12 : -0.1)), r: 2, fill: '#fff' })),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '4 5' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 12, class: 'fl-amber' }),
                    s('line', { x1: plot.X(ex), y1: plot.Y(ey), x2: plot.X(bg(ex, ey)), y2: plot.Y(H), stroke: 'var(--blue)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }),
                    s('circle', { cx: plot.X(bg(1, 0)), cy: plot.Y(H), r: 4, fill: 'none', stroke: '#fff', 'stroke-width': 1.2 }),
                    s('circle', { cx: plot.X(bg(-1, 0)), cy: plot.Y(H), r: 4, fill: 'none', stroke: '#fff', 'stroke-width': 1.2 }),
                    s('circle', { cx: plot.X(bg(ex, ey)), cy: plot.Y(H), r: 6, class: 'fl-coral' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(p.d), r: 7, class: 'fl-coral' }),
                    s('circle', { cx: plot.X(ex), cy: plot.Y(ey), r: 8, class: 'fl-blue' }),
                    s('text', { x: plot.X(0) + 12, y: plot.Y(p.d) + 4, class: 'lbl', text: 'star' }),
                  ];
                  return els;
                },
                readout: (p) => r`Parallax angle $p = ${((Math.atan(1 / p.d) * 180) / Math.PI).toFixed(1)}°$ (half the yearly back-and-forth). Doubling the distance roughly halves it.`,
              },
              after: r`The white rings mark where the star appears from the two ends of Earth's orbit. The **parallax angle** $p$ is half the angle between them: the angle that the Earth–Sun distance (1 AU) makes as seen from the star. For small angles, $p \propto \frac{1}{\text{distance}}$.`,
            },
            {
              type: 'explain',
              title: 'Parsecs',
              body: r`Real parallaxes are tiny, less than one **arcsecond** (1/3600 of a degree) for every star. So astronomers define a unit to match:

::: key
A star with a parallax of 1 arcsecond is 1 **parsec** away (about 3.26 light-years). In general,
$$d \text{ (parsecs)} = \frac{1}{p \text{ (arcseconds)}}.$$
:::

Friedrich Bessel made the first measurement in 1838, finding $0.3''$ for the star 61 Cygni. Today the Gaia spacecraft has measured parallaxes for over a billion stars.`,
            },
            {
              type: 'numeric',
              title: 'Our nearest neighbour',
              prompt: r`Proxima Centauri has a parallax of $0.768''$. How far away is it, in parsecs?`,
              unit: 'pc',
              answer: 1 / 0.768,
              tol: 0.01,
              wrong: [{ v: 0.768, tol: 0.01, why: 'Distance is the reciprocal of the parallax: 1 ÷ 0.768.' }, { v: 4.24, tol: 0.05, why: 'That’s in light-years. The question asks for parsecs.' }],
              explain: r`$d = \frac{1}{0.768} = 1.30$ pc $\approx 1.30 \times 3.26 = 4.24$ light-years. Even the nearest star has a parallax smaller than the width of a coin seen from 5 km away.`,
            },
            {
              type: 'numeric',
              title: 'Gaia’s challenge',
              prompt: r`A star 1000 parsecs away has what parallax, in milliarcseconds (thousandths of an arcsecond)?`,
              unit: 'mas',
              answer: 1,
              wrong: [{ v: 1000, why: r`$p = \frac{1}{d} = \frac{1}{1000}$ arcsecond, which is 1 milliarcsecond.` }, { v: 0.001, why: 'That’s in arcseconds. Convert to milliarcseconds.' }],
              explain: r`$p = \frac{1}{1000}'' = 1$ mas, about the width of a human hair seen from 20 km. Gaia measures parallaxes to a few hundredths of a milliarcsecond for bright stars, mapping our part of the Milky Way in 3D.`,
            },
            {
              type: 'explain',
              title: 'Standard candles',
              body: r`Beyond a few thousand parsecs parallax is too small, so astronomers climb a **distance ladder**:

1. **Parallax** gives distances to nearby stars.
2. Those calibrate **standard candles**: objects whose true brightness we can work out. In 1912 **Henrietta Swan Leavitt**, studying photographic plates at Harvard, found that pulsating **Cepheid** stars that take longer to pulse are more luminous. Time the pulse, and you know the true brightness.
3. Comparing true brightness with apparent brightness (by the inverse-square law) gives the distance. Hubble used Cepheids to show in 1924 that Andromeda is far outside the Milky Way.
4. Even brighter candles, **type Ia supernovae**, reach billions of light-years.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Using a Cepheid',
              prompt: r`Two Cepheids pulse with the same period, so they have the same true brightness. One, 2,000 light-years away, appears $10{,}000$ times brighter than the other. How far away is the fainter one, in light-years?`,
              unit: 'ly',
              answer: 200000,
              relTol: 0.01,
              wrong: [{ v: 20000000, relTol: 0.01, why: r`Brightness falls as $1/d^2$, so $10{,}000$ times dimmer means $\sqrt{10{,}000} = 100$ times farther, not $10{,}000$ times.` }, { v: 20000, relTol: 0.01, why: r`$\sqrt{10{,}000} = 100$, not 10.` }],
              explain: r`Brightness $\propto 1/d^2$, so $10{,}000$ times dimmer means $\sqrt{10{,}000} = 100$ times farther: $200{,}000$ light-years. That's beyond the edge of the Milky Way, about the distance of the Magellanic Clouds, where Leavitt found her Cepheids.`,
            },
          ],
          recap: [
            'Parallax: nearby stars shift against the background as Earth orbits the Sun.',
            r`$d$ (parsecs) $= 1/p$ (arcseconds); 1 parsec ≈ 3.26 light-years.`,
            'Standard candles (Cepheids, type Ia supernovae) extend the ladder via the inverse-square law.',
          ],
        },
        {
          id: 'hr',
          title: 'The H–R Diagram',
          summary: 'Mapping every kind of star',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Same colour, brighter',
              prompt: 'Two stars have exactly the same surface temperature, but one gives out 100 times as much light. What must be different?',
              choices: [
                { t: 'The brighter star is bigger: 10 times the radius', ok: true },
                { t: 'The brighter star is hotter inside', why: 'Each square metre of surface at the same temperature shines equally. More light needs more surface.' },
                { t: 'The brighter star is closer', why: 'This is about the light each star actually gives out (its luminosity), not how bright it looks from here.' },
              ],
              explain: r`Each square metre of a star's surface emits an amount set only by its temperature. So 100 times the light needs 100 times the surface area, and area grows as radius squared: 10 times the radius.`,
            },
            {
              type: 'explain',
              title: 'Luminosity, size and temperature',
              body: r`A star's **luminosity** (total power) is its surface area times the power from each square metre, $\sigma T^4$ (the Stefan–Boltzmann law from the Heat course):
$$L = 4\pi R^2 \sigma T^4.$$
Measuring in units of the Sun ($R_\odot$, $L_\odot$, and $T_\odot = 5772$ K) removes the constants:
$$\frac{L}{L_\odot} = \left(\frac{R}{R_\odot}\right)^2 \left(\frac{T}{5772\text{ K}}\right)^4.$$
Around 1910, Ejnar Hertzsprung and Henry Norris Russell plotted stars' luminosities against their temperatures. The pattern they found, the **H–R diagram**, is astronomy's most important chart.`,
            },
            {
              type: 'interactive',
              title: 'Build a star',
              body: r`Hot stars are on the **left**, as astronomers draw it. Most stars lie on the band called the **main sequence**. Set a star's radius and temperature to place it. Make a **red supergiant** like Betelgeuse: cooler than 4000 K, but more than 50,000 times as luminous as the Sun.`,
              widget: {
                kind: 'graph', xmin: -4.55, xmax: -3.38, ymin: -5.3, ymax: 6.5, grid: false, axes: false, height: 420,
                params: {
                  lr: { min: -2, max: 3, step: 0.05, value: 0, label: 'radius', color: 'violet', format: (v) => `${sig(10 ** v, 2)} R☉` },
                  T: { min: 2500, max: 30000, step: 100, value: 5800, label: 'temperature', color: 'coral', format: (v) => `${v} K` },
                },
                extra: ({ plot, p, s }) => {
                  const X = (T) => plot.X(-Math.log10(T)), Y = (L) => plot.Y(Math.log10(L)), els = [];
                  for (const T of [30000, 10000, 6000, 3000]) els.push(s('text', { x: X(T), y: plot.Y(-5.3) - 4, class: 'tick', 'text-anchor': 'middle', text: `${T} K` }));
                  for (const k of [-4, -2, 0, 2, 4, 6]) els.push(s('text', { x: plot.X(-4.55) + 4, y: Y(10 ** k) + 4, class: 'tick', text: k === 0 ? '1 L☉' : `10${['⁻⁴', '⁻²', '', '²', '⁴', '⁶'][(k + 4) / 2]}` }));
                  for (const lr of [-2, 0, 2]) {
                    const d = [3000, 30000].map((T, i) => `${i ? 'L' : 'M'}${X(T)} ${Y(lum(10 ** lr, T))}`).join('');
                    els.push(s('path', { d, stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 5', fill: 'none' }));
                    els.push(s('text', { x: X(15000), y: Y(lum(10 ** lr, 15000)) - 7, class: 'tick', 'text-anchor': 'middle', text: `${10 ** lr} R☉` }));
                  }
                  els.push(s('path', { d: MAIN_SEQ.map(([T, L], i) => `${i ? 'L' : 'M'}${X(T)} ${Y(L)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 22, opacity: 0.18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
                  for (const [name, T, L] of HR_STARS) {
                    els.push(s('circle', { cx: X(T), cy: Y(L), r: 4, class: 'fl-muted' }));
                    els.push(s('text', { x: X(T) + (name === 'Vega' ? -7 : 7), y: Y(L) + (name === 'Vega' ? -4 : 4), class: 'tick', 'text-anchor': name === 'Vega' ? 'end' : 'start', text: name }));
                  }
                  const L = lum(10 ** p.lr, p.T);
                  els.push(s('circle', { cx: X(p.T), cy: Y(Math.min(1e6, Math.max(3e-5, L))), r: 9, class: 'fl-coral', stroke: 'var(--ink)', 'stroke-width': 2 }));
                  return els;
                },
                readout: (p) => { const L = lum(10 ** p.lr, p.T); return `Luminosity **${L >= 1000 ? Math.round(Number(L.toPrecision(2))).toLocaleString('en-US') : sig(L, 2)}** times the Sun's`; },
                goal: (p) => p.T < 4000 && lum(10 ** p.lr, p.T) > 5e4,
                hint: 'Keep the temperature low (red) and make the radius enormous: several hundred solar radii.',
                solution: { lr: 2.9, T: 3600 },
              },
              explain: r`A 3600 K star needs a radius of about 800 Suns to reach 100,000 times the Sun's luminosity. Placed where the Sun is, Betelgeuse would reach beyond the orbit of Mars. The diagram sorts stars into families: the main sequence (stars fusing hydrogen), giants and supergiants (top right: cool but huge) and white dwarfs (bottom left: hot but tiny).`,
            },
            {
              type: 'numeric',
              title: 'The Pup',
              body: r`Sirius, the brightest star in the night sky, has a faint companion, Sirius B (nicknamed "the Pup"), with surface temperature 25,000 K and luminosity $0.056\,L_\odot$.`,
              prompt: r`What is its radius, in solar radii? (3 decimal places.)`,
              unit: 'R☉',
              answer: Math.sqrt(0.056) / (25000 / 5772) ** 2,
              tol: 0.001,
              wrong: [{ v: 0.056 / (25000 / 5772) ** 4, tol: 0.0005, why: r`Luminosity depends on $R^2$, so take a square root: $R = \sqrt{L} \,/\, (T/5772)^2$.` }],
              hint: r`Rearrange: $\frac{R}{R_\odot} = \dfrac{\sqrt{L/L_\odot}}{(T/5772)^2}$.`,
              explain: r`$R = \frac{\sqrt{0.056}}{(4.33)^2} = \frac{0.237}{18.8} \approx 0.013\,R_\odot$, about 1.4 times the size of Earth, yet it holds about as much mass as the Sun. It is a **white dwarf**: a teaspoon of it would weigh several tonnes.`,
            },
            {
              type: 'mcq',
              title: 'The main sequence',
              prompt: 'What decides where a star sits along the main sequence?',
              choices: [
                { t: 'Its mass: heavier stars are hotter and more luminous', ok: true },
                { t: 'Its age: stars slide down the main sequence as they age', why: 'A star stays at nearly the same spot for its whole hydrogen-burning life. When the fuel runs low, it leaves the main sequence entirely.' },
                { t: 'Its distance from us', why: 'The diagram plots true luminosity, not apparent brightness, so distance doesn’t matter.' },
              ],
              explain: r`Main-sequence stars are all fusing hydrogen in their cores, and mass decides how hard: from cool, dim red dwarfs of 0.1 solar masses (bottom right) to blazing blue stars of 50 or more (top left). When a star's core hydrogen runs out it swells up and moves to the giant region, which is why the diagram works like a family photo of stellar life stories.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A heavier star',
              body: r`On the main sequence, luminosity grows roughly as mass$^{3.5}$. The Sun's main-sequence lifetime is about 10 billion years, and a star's lifetime is proportional to its fuel (mass) divided by how fast it burns it (luminosity).`,
              prompt: 'Roughly how long will a star of 2 solar masses spend on the main sequence, in billions of years? (2 significant figures.)',
              unit: 'billion years',
              answer: (10 * 2) / 2 ** 3.5,
              tol: 0.05,
              wrong: [{ v: 20, why: 'More fuel, but it burns far faster: lifetime ∝ M / L = M / M^3.5.' }, { v: 10 / 2 ** 3.5, tol: 0.03, why: 'Don’t forget the fuel: the star has twice as much, so multiply by 2.' }],
              hint: r`Lifetime $\propto \dfrac{M}{M^{3.5}} = M^{-2.5}$. Compute $10 \times 2^{-2.5}$ billion years.`,
              explain: r`$L \approx 2^{3.5} \approx 11.3\,L_\odot$, so the lifetime is $10 \times \frac{2}{11.3} \approx 1.8$ billion years. Sirius A (2 solar masses) will burn out long before the Sun. Astronomers use this to date star clusters: the heaviest stars still on the main sequence tell you the cluster's age.`,
            },
          ],
          recap: [
            r`$L/L_\odot = (R/R_\odot)^2 (T/5772\text{ K})^4$: luminosity depends on size and temperature.`,
            'The H–R diagram plots luminosity against temperature (hot on the left).',
            'Main sequence: hydrogen-burning stars, ordered by mass. Giants are top right; white dwarfs bottom left.',
            r`Main-sequence lifetime $\propto M^{-2.5}$: heavy stars die young.`,
          ],
        },
      ],
    },
    {
      title: 'The Universe',
      summary: 'Expansion and the Big Bang.',
      lessons: [
        {
          id: 'expansion',
          title: 'The Expanding Universe',
          summary: 'Hubble and the Big Bang',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Galaxies flying apart',
              body: r`In 1929, Edwin Hubble found that almost all galaxies are moving away from us, and that the farther away a galaxy is, the faster it recedes.`,
              prompt: 'Does that mean we are at the centre of the universe?',
              choices: [
                { t: 'No: from any galaxy, all the others would appear to recede', ok: true },
                { t: 'Yes', why: 'Picture raisins in rising bread dough: from any raisin, all the others move away, faster if they’re farther. No raisin is special.' },
              ],
              explain: r`Space itself is stretching. Like raisins in rising dough, every galaxy sees every other galaxy moving away, with farther ones moving faster. There's no centre: the expansion happens everywhere at once.`,
            },
            {
              type: 'explain',
              title: 'Hubble’s law',
              body: r`$$v = H_0\, d$$
A galaxy's recession speed $v$ is proportional to its distance $d$. The **Hubble constant** is about $H_0 \approx 70$ km/s per megaparsec (one megaparsec is about 3.26 million light-years).

The speeds are measured from **redshift**: light from receding galaxies is stretched to longer wavelengths (as in the Waves course, the Doppler effect).`,
            },
            { /*anim:astronomy*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Everyone is the centre',
              body: r`Here is a patch of space full of galaxies, and space stretches by the same factor everywhere. We follow the stretch from the point of view of galaxy {coral:A}, then {coral:B}, then {coral:C}. The faint trails show how far each galaxy has moved.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -2.5, ymax: 2.5, grid: false, axes: false, clipExtra: true,
                animate: { param: 't', speed: 1, max: 15, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const k = Math.floor(p.t / 5) % 3, u = Math.min(1, Math.max(0, ((p.t % 5) - 0.6) / 3.4)), a = 1 + 0.35 * u * u * (3 - 2 * u);
                  const h = HUBBLE_GAL[HUBBLE_HOME[k]], els = [];
                  for (const g of HUBBLE_GAL) {
                    const dx = g[0] - h[0], dy = g[1] - h[1];
                    if (Math.abs(dx) > 6 || Math.abs(dy) > 4) continue;
                    els.push(s('line', { x1: plot.X(dx), y1: plot.Y(dy), x2: plot.X(a * dx), y2: plot.Y(a * dy), stroke: 'var(--blue)', 'stroke-width': 2.5, opacity: 0.3, 'stroke-linecap': 'round' }));
                  }
                  HUBBLE_GAL.forEach((g, n) => {
                    const dx = a * (g[0] - h[0]), dy = a * (g[1] - h[1]), home = n === HUBBLE_HOME[k], li = HUBBLE_HOME.indexOf(n);
                    els.push(s('circle', { cx: plot.X(dx), cy: plot.Y(dy), r: home ? 7 : 4.5, class: home ? 'fl-coral' : 'fl-blue' }));
                    if (li >= 0) els.push(s('text', { x: plot.X(dx) + 9, y: plot.Y(dy) - 7, class: 'halo-text', style: `font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--${home ? 'coral' : 'ink-2'})`, text: 'ABC'[li] }));
                  });
                  return els;
                },
                readout: (p) => { const k = Math.floor(p.t / 5) % 3, u = Math.min(1, Math.max(0, ((p.t % 5) - 0.6) / 3.4)), a = 1 + 0.35 * u * u * (3 - 2 * u); return `seen from galaxy {coral:${'ABC'[k]}} · every distance has grown by ${fix(100 * (a - 1), 0)}%`; },
              },
              after: r`Whichever galaxy you watch from, the picture is the same: every other galaxy moves straight away from **you**, and one twice as far away moves twice as far in the same time. That is Hubble's law, $v = H_0 d$, seen from everywhere at once. So finding that all galaxies recede from us doesn't put us at the centre. A uniform stretch has no centre: every galaxy sees itself in the middle, like raisins in a rising loaf of bread.`,
            },
            {
              type: 'numeric',
              title: 'Receding galaxy',
              prompt: 'A galaxy is 100 megaparsecs away. Using H₀ = 70 km/s/Mpc, how fast is it receding?',
              unit: 'km/s',
              answer: 7000,
              wrong: [{ v: 1.43, tol: 0.01, why: r`$v = H_0 d$: multiply, don't divide.` }],
              explain: r`$v = 70 \times 100 = 7000$ km/s, about 2% of the speed of light.`,
            },
            {
              type: 'mcq',
              title: 'Running it backwards',
              prompt: 'If galaxies are moving apart now, what was the universe like long ago?',
              choices: [
                { t: 'Far denser and hotter: everything was packed together', ok: true },
                { t: 'Exactly the same as today', why: 'Run the expansion backwards and everything gets closer together.' },
                { t: 'Empty', why: 'The same matter was there, just packed into a much smaller volume.' },
              ],
              explain: r`Rewinding the expansion leads back to an extremely hot, dense early state: the **Big Bang**, about 13.8 billion years ago. Its afterglow still fills the sky as the **cosmic microwave background**, now cooled to just 2.7 K. It was discovered by accident in 1965.`,
            },
            {
              type: 'interactive',
              title: 'Fit Hubble’s law',
              body: r`Here are twelve galaxies: their distances and how fast they recede. Turn the slope of the line $v = H_0 d$ until it fits the data best. The readout shows how far off the line is, on average.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 380, ymin: 0, ymax: 28000, grid: false, height: 280, axes: { xlabel: 'distance (Mpc)', ylabel: 'recession speed (km/s)', xticks: 50, yticks: 5000 },
                params: { H: { min: 40, max: 100, step: 0.5, value: 50, label: 'H₀', color: 'coral', format: (v) => `${v.toFixed(1)} km/s/Mpc` } },
                curves: [{ f: (x, p) => p.H * x, color: 'coral', width: 2.5 }],
                extra: ({ plot, s }) => [[15, 1081], [32, 2496], [48, 3144], [70, 5216], [95, 7523], [120, 8924], [150, 12449], [185, 11939], [220, 15724], [260, 17207], [300, 19730], [350, 24429]].map(([d, v]) => s('circle', { cx: plot.X(d), cy: plot.Y(v), r: 6, class: 'fl-violet' })),
                readout: (p) => { const D = [[15, 1081], [32, 2496], [48, 3144], [70, 5216], [95, 7523], [120, 8924], [150, 12449], [185, 11939], [220, 15724], [260, 17207], [300, 19730], [350, 24429]]; const rms = Math.sqrt(D.reduce((a, [d, v]) => a + (v - p.H * d) ** 2, 0) / D.length); return `typical miss **${rms.toFixed(0)} km/s** · implied age 1/H₀ ≈ **${(977.8 / p.H).toFixed(1)} billion years**`; },
                goal: (p) => Math.abs(p.H - 69.2) < 1.6,
                hint: 'Make the miss as small as you can: the line should pass through the middle of the cloud of points.',
                solution: { H: 69 },
              },
              explain: r`The best fit is about $H_0 \approx 69$ km/s per megaparsec. Running the expansion backwards at that rate, everything was together about $1/H_0 \approx 14$ billion years ago, close to the measured age of the universe (13.8 billion years).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Age from expansion',
              body: r`A rough age for the universe is the time it would take galaxies, moving at today's speeds, to reach their current distances: $t \approx 1/H_0$. One megaparsec is $3.09 \times 10^{19}$ km, and a year is $3.16 \times 10^7$ s.`,
              prompt: 'With H₀ = 70 km/s/Mpc, estimate 1/H₀ in billions of years.',
              unit: 'billion years',
              answer: 3.09e19 / 70 / 3.16e7 / 1e9,
              tol: 0.2,
              wrong: [{ v: 4.4e17 / 1e9, tol: 1e7, why: 'That’s in seconds. Divide by the seconds in a year.' }],
              explain: r`$\frac{1}{H_0} = \frac{3.09 \times 10^{19} \text{ km}}{70 \text{ km/s}} \approx 4.4 \times 10^{17}$ s $\approx 14$ billion years. That's remarkably close to the detailed answer of 13.8 billion years.`,
            },
          ],
          recap: [
            r`Hubble's law: $v = H_0 d$. Space itself is expanding, with no centre.`,
            'Running the expansion backwards leads to the Big Bang, about 13.8 billion years ago.',
            'The cosmic microwave background (2.7 K) is the Big Bang’s afterglow.',
          ],
        },
      ],
    },
  ],
};
