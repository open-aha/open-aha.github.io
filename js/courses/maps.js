import { fix } from '../lib/svg.js';
const r = String.raw;
const D = Math.PI / 180;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * D) / 2));

// Orthographic view of a sphere, seen from slightly above the equator.
const view = (cx, cy, R, sinA = 0.27) => (lat, lon) => {
  const cosA = Math.sqrt(1 - sinA * sinA);
  const X = Math.cos(lat * D) * Math.cos(lon * D), Y = Math.cos(lat * D) * Math.sin(lon * D), Z = Math.sin(lat * D);
  return [cx + R * X, cy + R * (-Z * cosA + Y * sinA)];
};
// great circle from London: destination after angular distance d (deg) on initial bearing t (deg)
const LON = [51.5, -0.12], NYC = [40.71, -74.01];
const gcDest = (t, d) => {
  const p1 = LON[0] * D, l1 = LON[1] * D, tb = t * D, dd = d * D;
  const la = Math.asin(Math.sin(p1) * Math.cos(dd) + Math.cos(p1) * Math.sin(dd) * Math.cos(tb));
  const lo = l1 + Math.atan2(Math.sin(tb) * Math.sin(dd) * Math.cos(p1), Math.cos(dd) - Math.sin(p1) * Math.sin(la));
  return [la / D, lo / D];
};
const gcMiss = (t) => {
  let best = Infinity;
  for (let d = 0; d <= 90; d += 0.1) {
    const [la, lo] = gcDest(t, d);
    best = Math.min(best, Math.hypot(la - NYC[0], (lo - NYC[1]) * Math.cos(NYC[0] * D)));
  }
  return best;
};
// cylindrical projections: y as a function of latitude, and vertical scale factor
const PROJ = [
  { name: 'Equirectangular', y: (lat) => lat * D, k: () => 1 },
  { name: 'Lambert equal-area', y: (lat) => Math.sin(lat * D), k: (lat) => Math.cos(lat * D) },
  { name: 'Mercator', y: merc, k: (lat) => 1 / Math.cos(lat * D) },
];
const pathOf = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

export default {
  id: 'maps',
  subject: 'math',
  title: 'Maps & Spherical Geometry',
  level: 'Intermediate',
  cover: 'maps',
  tagline: 'Measure the Earth with a shadow, fly great circles, and see why every flat map lies.',
  description: r`The Earth is round, and that changes the rules of geometry. Repeat Eratosthenes' measurement of the planet, find your way with latitude and longitude, discover why flight paths curve, meet triangles whose angles add up to more than 180°, plan a great-circle flight on a Mercator map, and learn why Greenland looks as big as Africa on many maps, and what other projections do instead.`,
  prereq: 'Trigonometry',
  chapters: [
    {
      title: 'Measuring the Earth',
      summary: 'Size and coordinates.',
      lessons: [
        {
          id: 'eratosthenes',
          title: 'Eratosthenes’ Shadow',
          summary: 'Measuring a planet with a stick',
          icon: 'sun',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A round Earth',
              prompt: r`Long before Eratosthenes, Aristotle (around 350 BC) argued that the Earth is a sphere. Which observation did he use?`,
              choices: [
                { t: 'During a lunar eclipse, the Earth’s shadow on the Moon is always curved', ok: true },
                { t: 'Photos from space', why: 'That was over 2,000 years too early!' },
                { t: 'The Sun rises at the same time everywhere', why: 'It doesn’t: sunrise times vary with longitude, which is itself a sign of a round Earth.' },
              ],
              explain: r`Whatever the Moon's position, the edge of the Earth's shadow is always an arc of a circle, and only a sphere casts a round shadow from every direction. Aristotle also noted that travellers going south see new stars rise above the horizon. The question for Eratosthenes was not whether the Earth was round, but how big it was.`,
            },
            {
              type: 'explain',
              title: 'Noon in two cities',
              body: r`Around 240 BC, Eratosthenes, the librarian of Alexandria, heard that at noon on midsummer's day in Syene (modern Aswan), the Sun shone straight down a deep well: it was directly overhead. At the same moment in Alexandria, further north, a vertical stick cast a shadow. The Sun's rays were about **7.2°** from vertical.

The Sun is so far away that its rays arrive parallel. So the difference in shadow angle is the angle between the two cities **as seen from the centre of the Earth**.`,
              widget: {
                kind: 'figure', w: 560, h: 300, maxWidth: 520, label: 'Parallel sunlight striking two cities on a round Earth',
                draw: ({ s, arrow }) => {
                  const cx = 250, cy = 330, R = 250, a = 16 * D;
                  const syene = [cx, cy - R], alex = [cx - R * Math.sin(a), cy - R * Math.cos(a)];
                  const els = [s('circle', { cx, cy, r: R, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2.5 })];
                  for (let x = 90; x <= 420; x += 55) els.push(arrow(x, 8, x, 48, { color: 'var(--amber)', width: 2.5 }));
                  els.push(s('line', { x1: cx, y1: cy, x2: syene[0], y2: syene[1] - 40, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
                  els.push(s('line', { x1: cx, y1: cy, x2: cx - (R + 40) * Math.sin(a), y2: cy - (R + 40) * Math.cos(a), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
                  els.push(s('line', { x1: alex[0], y1: alex[1], x2: alex[0], y2: alex[1] - 60, stroke: 'var(--amber)', 'stroke-width': 2.5 }));
                  els.push(s('circle', { cx: syene[0], cy: syene[1], r: 6, class: 'fl-coral' }), s('circle', { cx: alex[0], cy: alex[1], r: 6, class: 'fl-blue' }));
                  els.push(s('text', { x: syene[0] + 12, y: syene[1] + 20, class: 'lbl', text: 'Syene' }));
                  els.push(s('text', { x: alex[0] - 18, y: alex[1] + 22, class: 'lbl', 'text-anchor': 'end', text: 'Alexandria' }));
                  const arc = (x, y, rr) => s('path', { d: `M${x} ${y - rr} A${rr} ${rr} 0 0 0 ${x - rr * Math.sin(a)} ${y - rr * Math.cos(a)}`, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 });
                  const lab = (x, y, rr) => s('text', { x: x - rr * Math.sin(a / 2), y: y - rr * Math.cos(a / 2) + 5, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--violet)', text: '7.2°' });
                  els.push(arc(cx, cy, 120), lab(cx, cy, 142), arc(alex[0], alex[1], 40), lab(alex[0], alex[1], 60));
                  return els;
                },
              },
              after: r`(Angles exaggerated for clarity.) If two cities are $7.2°$ apart around the Earth's centre, the distance between them is $\frac{7.2}{360} = \frac{1}{50}$ of the Earth's circumference.`,
            },
            {
              type: 'numeric',
              title: 'Your turn',
              prompt: r`Alexandria is about 800 km north of Syene, and the two cities are $7.2°$ apart. Estimate the Earth's circumference.`,
              unit: 'km',
              answer: 40000,
              tol: 100,
              wrong: [{ v: 5760, why: r`That's $800 \times 7.2$. The cities span $\frac{7.2}{360} = \frac{1}{50}$ of the full circle, so multiply 800 by 50.` }, { v: 16, tol: 0.5, why: 'That’s 800 divided by 50. The circumference is 50 times the distance, not a fiftieth of it.' }],
              explain: r`$800 \times \frac{360}{7.2} = 800 \times 50 = 40{,}000$ km. The modern value is about 40,000 km around the poles. Eratosthenes worked in **stadia**, and historians still debate the exact length of his stadion, but his method was perfectly sound: with just a stick, a shadow and a known distance, he measured a planet.`,
            },
            {
              type: 'mcq',
              title: 'The key assumption',
              prompt: r`Which assumption was essential for Eratosthenes' method?`,
              choices: [
                { t: 'The Sun is so far away that its rays reach both cities parallel', ok: true },
                { t: 'The Sun goes around the Earth', why: 'It doesn’t matter which goes around which. What matters is that the rays are parallel.' },
                { t: 'The Earth is the centre of the universe', why: 'The measurement works regardless. It only needs parallel rays and a round Earth.' },
              ],
              explain: r`If the Sun were close, rays would spread out and the shadow difference would partly reflect the Sun's nearness instead of the Earth's curvature. Because the Sun is about 150 million km away, the rays are parallel to great accuracy.`,
            },
            {
              type: 'numeric',
              title: 'Shadow to angle',
              prompt: r`A vertical stick 1.5 m tall casts a shadow 19 cm long. What angle do the Sun's rays make with the vertical? (1 decimal place.)`,
              unit: '°',
              answer: Math.atan(0.19 / 1.5) / D,
              tol: 0.05,
              wrong: [{ v: Math.atan(1.5 / 0.19) / D, tol: 0.1, why: 'That’s the Sun’s elevation above the horizon. The angle from vertical uses shadow ÷ height.' }],
              explain: r`$\tan\theta = \frac{0.19}{1.5}$, so $\theta \approx 7.2°$: Eratosthenes' angle. Measuring a shadow's length accurately is the hard part; the trigonometry is easy.`,
            },
            {
              type: 'numeric',
              title: 'The radius',
              prompt: r`If the circumference is 40,000 km, what is the Earth's radius? (Nearest 10 km.)`,
              unit: 'km',
              answer: 6370,
              tol: 10,
              wrong: [{ v: 12730, tol: 20, why: r`That's the diameter, $C/\pi$. The radius is $C/(2\pi)$.` }],
              explain: r`$R = \frac{40{,}000}{2\pi} \approx 6370$ km. With the Earth's size known, the Greeks could go on to estimate the sizes and distances of the Moon and Sun.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'An error in the distance',
              prompt: r`Suppose Eratosthenes' 800 km distance was really 10% too large, but his angle was exact. How would his circumference compare with the truth?`,
              choices: [
                { t: 'It would also be 10% too large', ok: true },
                { t: 'It would be 10% too small', why: 'The circumference is the distance × 50: overestimate one and you overestimate the other.' },
                { t: 'It would be unaffected', why: 'The circumference is directly proportional to the measured distance.' },
              ],
              explain: r`Circumference $= \text{distance} \times \frac{360°}{\text{angle}}$, so a 10% error in distance gives a 10% error in the result. Errors in the angle matter too: since 7.2° is small, being out by just 0.7° would also cause a 10% error.`,
            },
          ],
          recap: [
            'Parallel sunlight makes different shadow angles at different places on a round Earth.',
            'The angle difference is the angle at the Earth’s centre between the two places.',
            'Eratosthenes found a circumference close to the true 40,000 km.',
          ],
        },
        {
          id: 'latlon',
          title: 'Latitude & Longitude',
          summary: 'An address for every place',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Two angles',
              body: r`Any point on Earth can be given by two angles:

- **Latitude** $\varphi$: how far north or south of the equator, from $-90°$ (South Pole) to $+90°$ (North Pole). Lines of equal latitude are called **parallels**.
- **Longitude** $\lambda$: how far east or west of the Prime Meridian through Greenwich, from $-180°$ to $+180°$. Lines of equal longitude are called **meridians**, and they all meet at the poles.

Because the Earth's circumference is about 40,000 km, one degree of latitude is about $40{,}000 \div 360 \approx 111$ km everywhere.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Shrinking circles',
              body: r`Meridians are all full-size circles through the poles, but parallels get smaller as you head towards a pole. Drag the latitude.`,
              widget: {
                kind: 'graph', xmin: -1.5, xmax: 1.5, ymin: -1.2, ymax: 1.2, grid: false, axes: false, equal: true, height: 300,
                params: { phi: { min: 0, max: 85, step: 5, value: 40, label: 'latitude', color: 'coral', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const c = Math.cos(p.phi * D), sn = Math.sin(p.phi * D), k = plot.X(1) - plot.X(0);
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: k, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2.5 }),
                    s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: k, ry: 0.18 * k, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('ellipse', { cx: plot.X(0), cy: plot.Y(sn), rx: c * k, ry: 0.18 * c * k, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(c), y2: plot.Y(sn), stroke: 'var(--ink)', 'stroke-width': 2 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(sn), x2: plot.X(c), y2: plot.Y(sn), stroke: 'var(--violet)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(1), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }),
                    s('text', { x: plot.X(0.32), y: plot.Y(0.08), class: 'lbl', text: 'φ' }),
                    // near the equator the label goes under the line, clear of the angle φ
                    s('text', { x: plot.X(c / 2), y: sn < 0.2 ? plot.Y(sn) + 22 : plot.Y(sn) - 10, class: 'lbl halo-text', 'text-anchor': 'middle', text: 'R cos φ' }),
                    s('circle', { cx: plot.X(c), cy: plot.Y(sn), r: 6, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => r`radius of this parallel $= R\cos ${p.phi}° = ${Math.cos(p.phi * D).toFixed(2)}R$, $\;$ 1° of longitude $\approx ${Math.round(111.2 * Math.cos(p.phi * D))}$ km`,
              },
              after: r`The parallel at latitude $\varphi$ has radius $R\cos\varphi$. So a degree of **longitude** spans $111\cos\varphi$ km: 111 km at the equator, shrinking to zero at the poles.`,
            },
            {
              type: 'numeric',
              title: 'Oslo',
              prompt: r`Oslo is at about $60°$ N. How many kilometres east–west is one degree of longitude there? (Use 111 km per degree at the equator.)`,
              unit: 'km',
              answer: 55.5,
              tol: 0.6,
              wrong: [{ v: 111, why: r`That's at the equator. At $60°$ multiply by $\cos 60° = 0.5$.` }, { v: 96.1, tol: 0.6, why: r`That's $111 \times \sin 60°$. The parallel's radius is $R\cos\varphi$.` }],
              explain: r`$111 \times \cos 60° = 111 \times 0.5 \approx 55.5$ km. In Oslo, walking one degree east is only half as far as on the equator.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the latitude',
              prompt: r`Somewhere north of the equator, a degree of longitude spans just 70 km. Find that latitude (to the nearest degree).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 0, ymax: 120, grid: 10, gridY: 20, height: 260, padL: 44, axes: { xlabel: 'latitude (°)', ylabel: 'km per degree of longitude' },
                params: { phi: { min: 0, max: 89, step: 1, value: 20, slider: false } },
                curves: [{ f: (x) => 111.2 * Math.cos(x * D), color: 'coral', width: 3 }, { f: () => 70, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.phi, y: (p) => 111.2 * Math.cos(p.phi * D), drag: { x: 'phi' }, color: 'teal' }],
                readout: (p) => r`at ${p.phi}°: $\;111.2\cos ${p.phi}° = ${(111.2 * Math.cos(p.phi * D)).toFixed(1)}$ km`,
                goal: (p) => Math.abs(111.2 * Math.cos(p.phi * D) - 70) < 1,
                hint: r`Solve $\cos\varphi = \frac{70}{111.2}$.`,
                solution: { phi: 51 },
              },
              explain: r`$\cos\varphi = 0.63$ gives $\varphi \approx 51°$: London's latitude (51.5° N). So a degree of longitude in London is only about 70 km, while a degree of latitude is 111 km. Square "degree boxes" on a map of Britain are tall and thin.`,
            },
            {
              type: 'numeric',
              title: 'Above the Arctic Circle',
              prompt: r`Tromsø in northern Norway is at about $70°$ N. How many kilometres east–west is one degree of longitude there? (Use 111 km at the equator; nearest whole number.)`,
              unit: 'km',
              answer: 111 * Math.cos((70 * Math.PI) / 180),
              tol: 0.6,
              wrong: [{ v: 111 * Math.sin((70 * Math.PI) / 180), tol: 0.6, why: r`That uses $\sin 70°$. The parallel's radius is $R\cos\varphi$, so use the cosine.` }],
              explain: r`$111 \times \cos 70° \approx 111 \times 0.342 \approx 38$ km, about a third of its length at the equator. At the poles it shrinks to nothing, as the meridians meet.`,
            },
            {
              type: 'numeric',
              title: 'Defining the metre',
              prompt: r`In 1791, the French Academy of Sciences defined the metre as one ten-millionth of the distance from the North Pole to the equator. Using this definition, how many kilometres is the full circumference through the poles?`,
              unit: 'km',
              answer: 40000,
              tol: 1,
              wrong: [{ v: 10000, why: 'That’s pole to equator, a quarter of the full circle.' }, { v: 20000, why: 'That’s pole to pole. The full circle is twice that.' }],
              explain: r`Pole to equator is $10^7$ m $= 10{,}000$ km, a quarter of a circle, so the full meridian circle is 40,000 km. That's why the Earth's circumference is such a round number: the metre was designed from it.`,
            },
          ],
          recap: [
            'Latitude measures north–south; longitude measures east–west.',
            'One degree of latitude is about 111 km.',
            r`One degree of longitude is $111\cos\varphi$ km, shrinking towards the poles.`,
          ],
        },
      ],
    },
    {
      title: 'Geometry on a Sphere',
      summary: 'Straight lines and triangles.',
      lessons: [
        {
          id: 'greatcircles',
          title: 'Great Circles',
          summary: 'The straightest lines on a sphere',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'What is a straight line?',
              body: r`On a sphere, there are no straight lines in the usual sense. The shortest path between two points runs along a **great circle**: a circle whose centre is the centre of the sphere, like the equator or any meridian. Parallels other than the equator are **not** great circles; they're smaller.

To travel between two points along a great circle, the distance is
$$d = R\,\theta$$
where $\theta$ is the angle (in radians) between the points as seen from the centre.`,
            },
            {
              type: 'numeric',
              title: 'Along a meridian',
              prompt: r`Two towns lie on the same meridian, at latitudes $10°$ N and $40°$ N. How far apart are they? ($R = 6371$ km.)`,
              unit: 'km',
              answer: 6371 * (30 * D),
              tol: 15,
              wrong: [{ v: 6371 * 30, tol: 100, why: 'Convert the angle to radians first: 30° = π/6.' }, { v: 2890, tol: 30, why: 'Meridians are great circles: no cos φ factor is needed for north–south distances.' }],
              explain: r`The angle between them is $30° = \frac{\pi}{6}$, so $d = 6371 \times \frac{\pi}{6} \approx 3336$ km. (Equivalently, $30 \times 111 \approx 3336$ km.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Over the top',
              body: r`Two cities are both at latitude $60°$ N, on opposite sides of the globe (180° apart in longitude). One route follows the parallel; the other goes over the North Pole along a great circle.`,
              widget: {
                kind: 'figure', w: 420, h: 300, maxWidth: 420, label: 'Two routes between cities at 60 degrees north',
                draw: ({ s }) => {
                  const P = view(210, 150, 130, 0.8), els = [s('circle', { cx: 210, cy: 150, r: 130, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 })];
                  const eq = [], par = [], gc = [];
                  for (let t = 0; t <= 360; t += 5) eq.push(P(0, t));
                  for (let t = 0; t <= 180; t += 5) par.push(P(60, t));
                  for (let la = 60; la <= 120; la += 2) gc.push(la <= 90 ? P(la, 0) : P(180 - la, 180));
                  els.push(s('path', { d: pathOf(eq), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  els.push(s('path', { d: pathOf(par), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 }));
                  els.push(s('path', { d: pathOf(gc), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 4 }));
                  const [ax, ay] = P(60, 0), [bx, by] = P(60, 180), [nx, ny] = P(90, 0);
                  els.push(s('circle', { cx: ax, cy: ay, r: 7, class: 'fl-ink' }), s('circle', { cx: bx, cy: by, r: 7, class: 'fl-ink' }), s('circle', { cx: nx, cy: ny, r: 4, class: 'fl-ink' }));
                  els.push(s('text', { x: 210, y: P(60, 90)[1] + 24, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--coral)', text: 'along the parallel' }));
                  els.push(s('text', { x: 210, y: ny - 26, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--blue)', text: 'over the pole' }));
                  return els;
                },
              },
              after: r`The parallel route is half of a circle with radius $R\cos 60° = R/2$, so it's $\pi R/2 \approx 10{,}000$ km.`,
            },
            {
              type: 'numeric',
              title: 'The polar route',
              prompt: r`How long is the route over the North Pole? ($R = 6371$ km.)`,
              unit: 'km',
              answer: 6371 * (60 * D),
              tol: 20,
              wrong: [{ v: 10008, tol: 30, why: 'That’s the route along the parallel. Over the pole, each city is 30° from the pole.' }, { v: 3336, tol: 20, why: 'That’s only one half of the trip, from a city to the pole.' }],
              explain: r`Each city is $30°$ from the pole, so the great-circle angle is $60° = \frac{\pi}{3}$, and $d = 6371 \times \frac{\pi}{3} \approx 6672$ km: a third shorter than following the parallel. That's why flights from Europe to the west coast of North America pass over Greenland, even though on a flat map it looks like a detour.`,
            },
            {
              type: 'mcq',
              title: 'Walking due east',
              prompt: r`You walk due east, keeping exactly to the 60° N parallel. From the point of view of the sphere's geometry, are you walking "straight"?`,
              choices: [
                { t: 'No: you are constantly curving towards the pole', ok: true },
                { t: 'Yes: you never change compass direction', why: 'Constant compass direction isn’t the same as straight. A small circle curves inside its great circles.' },
                { t: 'Only at noon', why: 'The time of day has nothing to do with it.' },
              ],
              explain: r`Near the pole it's obvious: walking "due east" around a parallel 1 km from the pole is just walking in a small circle. On a great circle, you'd never need to turn; following a parallel, you're always turning slightly towards the pole, even if you don't feel it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'As far as possible',
              prompt: r`What is the greatest possible great-circle distance between two places on Earth? ($R = 6371$ km; nearest 10 km.)`,
              unit: 'km',
              answer: 20020,
              tol: 10,
              wrong: [{ v: 40030, tol: 20, why: 'That’s all the way round. The farthest point is halfway round.' }, { v: 12742, tol: 20, why: 'That’s straight through the Earth (the diameter). Along the surface, it’s half a great circle.' }],
              explain: r`The farthest point is the **antipode**, directly through the Earth, at angle $\pi$: $d = \pi R \approx 20{,}020$ km. No flight ever needs to be longer than this. The antipode of Spain is New Zealand; most land's antipodes are in the ocean.`,
            },
          ],
          recap: [
            'The shortest path on a sphere follows a great circle.',
            r`Great-circle distance $d = R\theta$, with $\theta$ in radians.`,
            'Parallels (except the equator) aren’t great circles, so following them is longer.',
          ],
        },
        {
          id: 'routes',
          title: 'Great-Circle Routes',
          summary: 'Distances and headings between cities',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Distance between any two places',
              body: r`For two places at latitudes $\varphi_1, \varphi_2$, with longitudes differing by $\Delta\lambda$, the **spherical law of cosines** gives the angle $\theta$ between them at the Earth's centre:
$$\cos\theta = \sin\varphi_1\sin\varphi_2 + \cos\varphi_1\cos\varphi_2\cos\Delta\lambda$$
Then the distance is $d = R\theta$ ($\theta$ in radians). It's the dot product of the two position vectors.`,
            },
            {
              type: 'numeric',
              title: 'London to New York',
              prompt: r`London is at 51.5° N, 0.1° W; New York at 40.7° N, 74.0° W. The formula gives $\theta \approx 50.1°$. What's the great-circle distance? ($R = 6371$ km; nearest 10 km.)`,
              unit: 'km',
              answer: 5570,
              tol: 20,
              wrong: [{ v: 319000, tol: 2000, why: 'Convert 50.1° to radians first.' }],
              explain: r`$6371 \times 50.1 \times \frac{\pi}{180} \approx 5570$ km, the shortest route between the cities, and close to the flight distance.`,
            },
            {
              type: 'explain',
              title: 'Which way to head?',
              body: r`On a Mercator map, a line of constant compass bearing (a **rhumb line**) is straight, so it's tempting to draw a straight line from London to New York and follow it at a bearing of about 258°.

But the shortest route, the great circle, **starts off heading north of west** and bends round. Its compass bearing changes continuously along the way, because it crosses each meridian at a different angle.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Aim for New York',
              prompt: r`This is a Mercator map. Choose the initial bearing from London so that the great circle (violet) passes through New York.`,
              widget: {
                kind: 'graph', equal: true, xmin: -95 * D, xmax: 15 * D, ymin: merc(31), ymax: merc(64), grid: false, axes: false, maxWidth: 620,
                params: { t: { min: 250, max: 320, step: 1, value: 262, label: 'bearing', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let lon = -90; lon <= 15; lon += 15) els.push(s('line', { x1: plot.X(lon * D), x2: plot.X(lon * D), y1: plot.Y(merc(31)), y2: plot.Y(merc(64)), stroke: 'var(--line-2)', 'stroke-width': 1.2 }));
                  for (let lat = 30; lat <= 60; lat += 10) {
                    els.push(s('line', { x1: plot.X(-95 * D), x2: plot.X(15 * D), y1: plot.Y(merc(lat)), y2: plot.Y(merc(lat)), stroke: 'var(--line-2)', 'stroke-width': 1.2 }));
                    els.push(s('text', { x: plot.X(-95 * D) + 4, y: plot.Y(merc(lat)) - 4, class: 'tick', text: `${lat}°N` }));
                  }
                  els.push(s('line', { x1: plot.X(LON[1] * D), y1: plot.Y(merc(LON[0])), x2: plot.X(NYC[1] * D), y2: plot.Y(merc(NYC[0])), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
                  const pts = [];
                  for (let d = 0; d <= 75; d += 1) {
                    const [la, lo] = gcDest(p.t, d);
                    if (la < 30 || la > 65 || lo < -96) break;
                    pts.push(`${pts.length ? 'L' : 'M'}${plot.X(lo * D)} ${plot.Y(merc(la))}`);
                  }
                  els.push(s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3.5 }));
                  els.push(s('circle', { cx: plot.X(LON[1] * D), cy: plot.Y(merc(LON[0])), r: 6, class: 'fl-coral' }), s('circle', { cx: plot.X(NYC[1] * D), cy: plot.Y(merc(NYC[0])), r: 6, class: 'fl-blue' }));
                  els.push(s('text', { x: plot.X(LON[1] * D), y: plot.Y(merc(LON[0])) + 22, 'text-anchor': 'middle', class: 'lbl', text: 'London' }));
                  els.push(s('text', { x: plot.X(NYC[1] * D), y: plot.Y(merc(NYC[0])) + 22, 'text-anchor': 'middle', class: 'lbl', text: 'New York' }));
                  return els;
                },
                readout: (p) => r`initial bearing ${p.t}°: the route passes within $${Math.round(gcMiss(p.t) * 111.2)}$ km of New York`,
                goal: (p) => gcMiss(p.t) < 0.4,
                hint: 'Start heading further north than the dashed straight line suggests.',
                solution: { t: 288 },
              },
              explain: r`About **288°**, 30° further north than the straight rhumb line (258°). On the Mercator map the great circle bulges north, past Ireland and close to Newfoundland, then descends towards New York. That's the curved route you see on in-flight maps.`,
            },
            {
              type: 'numeric',
              title: 'How much shorter?',
              prompt: r`Following the rhumb line (constant bearing 258°) from London to New York is about 5,795 km. The great circle is 5,571 km. How many kilometres does the great circle save? (Nearest 10 km.)`,
              unit: 'km',
              answer: 220,
              tol: 10,
              wrong: [{ v: 11366, tol: 20, why: 'Subtract, don’t add.' }],
              explain: r`$5795 - 5571 \approx 220$ km, about 4%. For longer routes at high latitudes the saving is much larger, which is why airlines fly great circles. Sailors once used rhumb lines anyway, since a constant compass bearing was far easier to steer.`,
            },
            {
              type: 'mcq',
              title: 'Spiralling',
              prompt: r`What happens if you keep following a rhumb line at a constant bearing of 045° (north-east) forever?`,
              choices: [
                { t: 'You spiral round and round the globe towards the North Pole, never quite reaching it', ok: true },
                { t: 'You go round a great circle and return home', why: 'Great circles don’t keep a constant bearing (except meridians and the equator).' },
                { t: 'You reach the North Pole after a quarter of the way round', why: 'You approach it in an ever-tightening spiral, called a loxodrome.' },
              ],
              explain: r`A rhumb line crossing every meridian at 45° spirals in towards the pole: a **loxodrome**. Surprisingly, its total length is finite: $\sqrt2$ times the distance due north to the pole.`,
            },
            { /*anim:maps*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The loxodrome',
              body: r`Follow a ship that sets off from the equator and always steers on a bearing of **075°** (a little north of east), crossing every meridian at the same angle. Watch its track on the turning globe.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.15, xmax: 1.15, ymin: -1.15, ymax: 1.15, grid: false, axes: false, maxWidth: 400,
                animate: { param: 't', speed: 1, max: 12, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const D = Math.PI / 180, v0 = 62 * D, lc = 0.25 * p.t - 0.6, tb = Math.tan(75 * D);
                  const pr = (la, lo) => {
                    const dl = lo - lc;
                    return [Math.cos(la) * Math.sin(dl), Math.sin(la) * Math.cos(v0) - Math.cos(la) * Math.sin(v0) * Math.cos(dl), Math.sin(la) * Math.sin(v0) + Math.cos(la) * Math.cos(v0) * Math.cos(dl)];
                  };
                  const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 1.5 })];
                  // draw a curve on the sphere, solid on the near side only
                  const curve = (pts, o) => {
                    let d = '', pen = false;
                    for (const [la, lo] of pts) { const [x, y, z] = pr(la, lo); if (z < 0) { pen = false; continue; } d += `${pen ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; pen = true; }
                    return s('path', { d, fill: 'none', ...o });
                  };
                  for (let lo = 0; lo < 360; lo += 30) els.push(curve(Array.from({ length: 61 }, (_, i) => [(-90 + 3 * i) * D, lo * D]), { stroke: 'var(--blue)', 'stroke-width': 0.8, opacity: 0.45 }));
                  for (let la = -60; la <= 60; la += 30) els.push(curve(Array.from({ length: 121 }, (_, i) => [la * D, 3 * i * D]), { stroke: 'var(--blue)', 'stroke-width': la ? 0.8 : 1.6, opacity: la ? 0.45 : 0.8 }));
                  // at bearing 075°: longitude = tan 75° × (Mercator height of the latitude), latitude = distance × cos 75°
                  const phiNow = Math.min(89.9, 8 * p.t) * D, track = [];
                  for (let i = 0; i <= 900; i++) { const la = (phiNow * i) / 900; track.push([la, tb * Math.log(Math.tan(Math.PI / 4 + la / 2))]); }
                  els.push(curve(track, { stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
                  const [sx, sy, sz] = pr(...track[track.length - 1]);
                  if (sz > 0) els.push(s('circle', { cx: plot.X(sx), cy: plot.Y(sy), r: 6, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 }));
                  return els;
                },
                readout: (p) => { const phi = (Math.min(89.9, 8 * p.t) * Math.PI) / 180, k = Math.cos((75 * Math.PI) / 180); return `latitude ${fix((phi * 180) / Math.PI, 1)}° · laps around the pole ${fix((Math.tan((75 * Math.PI) / 180) * Math.log(Math.tan(Math.PI / 4 + phi / 2))) / (2 * Math.PI), 2)} · distance sailed ${fix((phi * 6371) / k, 0)} km`; },
              },
              after: r`Near the pole the ship circles faster and faster: the laps never stop adding up, yet the distance sailed creeps towards a finite total: the 10,008 km trip due north divided by $\cos 75°$, about 38,700 km. (At a bearing of 045°, the total would be $\sqrt2 \times 10{,}008 \approx 14{,}150$ km.) On a Mercator map this same track is a perfectly straight line, which is why sailors liked it: set one compass bearing and hold it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The northernmost point',
              prompt: r`Clairaut's relation says that along a great circle, $\cos\varphi \cdot |\sin\beta|$ stays constant, where $\beta$ is the bearing. At the route's northernmost point the bearing is due west ($|\sin\beta| = 1$). Starting at London (51.5° N) on a bearing of 288.3° ($|\sin\beta| = 0.949$), how far north does the route get? (1 decimal place.)`,
              unit: '° N',
              answer: Math.acos(Math.cos(51.5 * D) * Math.abs(Math.sin(288.34 * D))) / D,
              tol: 0.15,
              wrong: [{ v: 51.5, why: 'The route rises north from London before turning south.' }],
              explain: r`$\cos\varphi_{\max} = \cos 51.5° \times 0.949 \approx 0.591$, so $\varphi_{\max} \approx 53.8°$ N. The route's high point is over the Atlantic west of Ireland.`,
            },
          ],
          recap: [
            r`Spherical law of cosines: $\cos\theta = \sin\varphi_1\sin\varphi_2 + \cos\varphi_1\cos\varphi_2\cos\Delta\lambda$.`,
            'Rhumb lines keep a constant bearing (straight on Mercator); great circles are shorter.',
            'A great circle’s bearing changes along the way; London to New York starts at 288°.',
          ],
        },
        {
          id: 'triangles',
          title: 'Spherical Triangles',
          summary: 'When angles add up to more than 180°',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Three right angles',
              body: r`Start at the North Pole and walk south along a meridian to the equator. Turn left by $90°$ and walk a quarter of the way around the equator. Turn left by $90°$ again and walk north back to the pole.`,
              widget: {
                kind: 'figure', w: 420, h: 300, maxWidth: 420, label: 'A spherical triangle with three right angles',
                draw: ({ s }) => {
                  const P = view(210, 175, 130), els = [s('circle', { cx: 210, cy: 175, r: 130, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 })];
                  const tri = [];
                  for (let la = 90; la >= 0; la -= 3) tri.push(P(la, 140));
                  for (let t = 140; t >= 50; t -= 3) tri.push(P(0, t));
                  for (let la = 0; la <= 90; la += 3) tri.push(P(la, 50));
                  els.push(s('path', { d: pathOf(tri) + ' Z', class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }));
                  const eq = [];
                  for (let t = 140; t <= 410; t += 5) eq.push(P(0, t));
                  els.push(s('path', { d: pathOf(eq), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  const [nx, ny] = P(90, 0), [ax, ay] = P(0, 140), [bx, by] = P(0, 50);
                  els.push(s('text', { x: nx, y: ny - 12, class: 'lbl', 'text-anchor': 'middle', text: 'North Pole · 90°' }));
                  els.push(s('text', { x: ax - 6, y: ay + 26, class: 'lbl', 'text-anchor': 'middle', text: '90°' }));
                  els.push(s('text', { x: bx + 6, y: by + 26, class: 'lbl', 'text-anchor': 'middle', text: '90°' }));
                  return els;
                },
              },
              after: r`You've walked a triangle made of three great-circle arcs, with **three right angles**. Its angles sum to $270°$, not $180°$. On a curved surface, Euclid's triangle rule no longer holds.`,
            },
            {
              type: 'explain',
              title: 'Girard’s theorem',
              body: r`On a sphere of radius $R$, the amount by which a triangle's angles exceed $180°$, called the **spherical excess** $E$, measures its area:
$$\text{Area} = E \cdot R^2 \qquad (E \text{ in radians})$$
Check it on our triangle: $E = 270° - 180° = 90° = \frac{\pi}{2}$, so the area is $\frac{\pi}{2}R^2$. The triangle covers one-eighth of the sphere, and $\frac18 \cdot 4\pi R^2 = \frac{\pi}{2}R^2$. ✓

Small triangles have tiny excess, which is why geometry on a football pitch looks perfectly flat.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A tenth of the world',
              prompt: r`A triangle has corners at the North Pole and two points on the equator. Widen the angle at the pole until the triangle covers exactly **one tenth** of the Earth's surface.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.35, xmax: 1.35, ymin: -1.15, ymax: 1.3, grid: false, axes: false, maxWidth: 400,
                params: { a: { min: 10, max: 180, step: 1, value: 40, label: 'pole angle', color: 'coral', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const k = plot.X(1) - plot.X(0);
                  const P = view(plot.X(0), plot.Y(0), k);
                  const els = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: k, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 })];
                  const l0 = 20, l1 = 20 + p.a, tri = [];
                  for (let la = 90; la >= 0; la -= 3) tri.push(P(la, l0));
                  for (let t = l0; t <= l1; t += 2) tri.push(P(0, t));
                  for (let la = 0; la <= 90; la += 3) tri.push(P(la, l1));
                  const eq = [];
                  for (let t = -90; t <= 90; t += 5) eq.push(P(0, t));
                  els.push(s('path', { d: pathOf(eq), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  els.push(s('path', { d: pathOf(tri) + ' Z', class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                  return els;
                },
                readout: (p) => r`angles $90° + 90° + ${p.a}° = ${180 + p.a}°$; $\;$ excess $${p.a}°$; $\;$ fraction of the sphere $= \frac{${p.a}}{720} = ${(p.a / 720).toFixed(3)}$`,
                goal: (p) => p.a === 72,
                hint: r`The whole sphere has area $4\pi R^2$, which corresponds to an excess of $4\pi$ radians, or 720°.`,
                solution: { a: 72 },
              },
              explain: r`Area $= E R^2$ and the whole sphere is $4\pi R^2$, so the fraction covered is $\frac{E}{4\pi} = \frac{E}{720°}$. One tenth needs $E = 72°$, so the pole angle is 72°. (The view shows only the front of the globe: for wide angles, part of the triangle wraps round the back.)`,
            },
            {
              type: 'numeric',
              title: 'Find the excess',
              prompt: r`A triangle on a globe has angles $80°$, $70°$ and $60°$. What is its spherical excess, in degrees?`,
              unit: '°',
              answer: 30,
              wrong: [{ v: 210, why: 'That’s the angle sum. The excess is how much it exceeds 180°.' }, { v: 0, why: 'On a sphere, angles add up to more than 180°.' }],
              explain: r`$80 + 70 + 60 = 210°$, so $E = 30° = \frac{\pi}{6}$. Its area is $\frac{\pi}{6}R^2$, which is $\frac{1}{24}$ of the sphere's surface.`,
            },
            {
              type: 'numeric',
              title: 'A lune',
              prompt: r`A **lune** is the slice of a sphere between two great semicircles meeting at angle $\theta$ (in radians). On a sphere of radius 1 its area is $2\theta$. What is the area of a $60°$ lune? (3 decimal places.)`,
              answer: 2 * Math.PI / 3,
              tol: 0.001,
              explain: r`$60° = \frac{\pi}{3}$, so the area is $\frac{2\pi}{3} \approx 2.094$, one sixth of the whole sphere ($4\pi$). Girard’s theorem is proved by adding up lunes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How big for one degree?',
              prompt: r`How large must a triangle on the Earth be ($R = 6371$ km) for its angles to add up to $181°$? Give its area in thousands of km².`,
              unit: r`thousand km²`,
              answer: (D * 6371 * 6371) / 1000,
              tol: 5,
              wrong: [{ v: 40590, tol: 300, why: 'Convert 1° to radians (π/180) before multiplying by R².' }],
              explain: r`$\text{Area} = \frac{\pi}{180} \times 6371^2 \approx 708{,}000$ km², larger than France. So for everyday-sized triangles, the excess is undetectably small. But surveyors mapping whole countries in the 1800s really did measure it. Carl Friedrich Gauss studied such surveys while developing his theory of curved surfaces.`,
            },
          ],
          recap: [
            'Triangles made of great-circle arcs have angle sums above 180°.',
            r`Girard's theorem: area $= E R^2$, where $E$ is the spherical excess.`,
            'Small triangles are nearly flat; the excess grows with area.',
          ],
        },
      ],
    },
    {
      title: 'Flattening the World',
      summary: 'Map projections and their distortions.',
      lessons: [
        {
          id: 'mercator',
          title: 'The Mercator Map',
          summary: 'Why Greenland looks huge',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'No perfect map',
              body: r`Try flattening an orange peel: it tears or stretches. In 1827, Carl Friedrich Gauss proved that this is unavoidable: a sphere's curvature can't be removed by bending, so **every flat map distorts** distances somewhere. Each map projection chooses what to sacrifice.

In 1569, Gerardus Mercator designed a map for sailors. It preserves **angles and shapes locally**, so a course of constant compass bearing is a straight line. The price: parallels, which shrink by $\cos\varphi$ on the globe, are drawn at full width, so everything at latitude $\varphi$ is stretched east–west by $\frac{1}{\cos\varphi}$. To keep shapes undistorted, Mercator stretched north–south by the same amount.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Inflating circles',
              prompt: r`Each coral circle marks the same real area on the ground as each dashed circle on the equator. Move the circles north until they're drawn with **4 times** the area of the equatorial circles.`,
              widget: {
                kind: 'graph', xmin: -Math.PI, xmax: Math.PI, ymin: -0.8, ymax: 2.8, grid: false, axes: false, equal: true, height: 340,
                params: { phi: { min: 0, max: 75, step: 1, value: 0, label: 'latitude', color: 'coral', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let lon = -180; lon <= 180; lon += 30) els.push(s('line', { x1: plot.X(lon * D), x2: plot.X(lon * D), y1: plot.Y(merc(-35)), y2: plot.Y(merc(80)), stroke: 'var(--line-2)', 'stroke-width': 1.2 }));
                  for (let lat = -30; lat <= 75; lat += 15) {
                    els.push(s('line', { x1: plot.X(-Math.PI), x2: plot.X(Math.PI), y1: plot.Y(merc(lat)), y2: plot.Y(merc(lat)), stroke: lat ? 'var(--line-2)' : 'var(--ink-3)', 'stroke-width': lat ? 1.2 : 2 }));
                    if (lat >= 0) els.push(s('text', { x: plot.X(-Math.PI) + 4, y: plot.Y(merc(lat)) - 4, class: 'tick', text: `${lat}°` }));
                  }
                  const k = plot.X(1) - plot.X(0), r0 = 0.16, sec = 1 / Math.cos(p.phi * D);
                  for (const lon of [-120, 0, 120]) els.push(s('circle', { cx: plot.X(lon * D), cy: plot.Y(merc(p.phi)), r: r0 * sec * k, class: 'fl-coral', opacity: 0.75 }));
                  // dashed reference circles go on top, so they stay visible when the coral circles sit on the equator
                  for (const lon of [-120, 0, 120]) els.push(s('circle', { cx: plot.X(lon * D), cy: plot.Y(0), r: r0 * k, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
                  return els;
                },
                readout: (p) => {
                  const sec = 1 / Math.cos(p.phi * D);
                  return r`stretch $\frac{1}{\cos ${p.phi}°} = ${sec.toFixed(2)}$ each way, $\;$ area drawn $\times ${(sec * sec).toFixed(2)}$`;
                },
                goal: (p) => Math.abs(1 / Math.cos(p.phi * D) ** 2 - 4) < 0.15,
                hint: r`Area is stretched by $\frac{1}{\cos^2\varphi}$. You need $\cos\varphi = \frac12$.`,
                solution: { phi: 60 },
              },
              explain: r`At $60°$, $\cos\varphi = \frac12$, so lengths are doubled in both directions and areas are drawn **4 times** too big. At $75°$ it's about 15 times. The poles themselves would be infinitely far away, so Mercator maps are always cut off before them.`,
            },
            {
              type: 'numeric',
              title: 'Greenland and Africa',
              prompt: r`Greenland's area is about 2.2 million km², and Africa's is about 30.4 million km². How many times larger is Africa? (Nearest whole number.)`,
              unit: '×',
              answer: 14,
              tol: 0.5,
              wrong: [{ v: 1, why: 'They may look similar on a Mercator map, but that’s the distortion talking. Divide the areas.' }],
              explain: r`$30.4 \div 2.2 \approx 14$. Yet on a Mercator map they look roughly the same size, because Greenland sits at around $70°$–$80°$ N, where areas are inflated by a factor of 10 or more, while Africa straddles the equator, where there's almost no inflation.`,
            },
            {
              type: 'numeric',
              title: 'Scale bars',
              prompt: r`On a Mercator map, a scale bar for 100 km at the equator is 2 cm long. How long must a 100 km scale bar be at 45° N? (2 decimal places.)`,
              unit: 'cm',
              answer: 2 / Math.cos(45 * D),
              tol: 0.01,
              wrong: [{ v: 2 * Math.cos(45 * D), tol: 0.01, why: 'Mercator stretches distances away from the equator, so the bar is longer.' }, { v: 4, why: r`That's at 60° N. At 45°, the stretch is $\frac{1}{\cos 45°} = \sqrt2$.` }],
              explain: r`$2 \times \frac{1}{\cos 45°} = 2\sqrt2 \approx 2.83$ cm. A Mercator map has no single scale: that's why online maps show a scale bar that changes as you scroll north or south.`,
            },
            {
              type: 'numeric',
              title: 'Far north on Mercator',
              prompt: r`On a Mercator map, lengths near latitude $\varphi$ are stretched by $\frac{1}{\cos\varphi}$. By what factor are lengths stretched at $80°$ N? (2 decimal places.)`,
              answer: 1 / Math.cos(80 * Math.PI / 180),
              tol: 0.01,
              explain: r`About 5.76, so areas there are inflated about 33 times. That’s why Svalbard and northern Greenland look enormous.`,
            },
            {
              type: 'mcq',
              title: 'Choosing a projection',
              prompt: r`A charity wants a world map that fairly compares the land areas of countries. What kind of projection should it use?`,
              choices: [
                { t: 'An equal-area projection, which keeps areas in proportion but distorts shapes', ok: true },
                { t: 'Mercator, because shapes look right', why: 'Mercator keeps shapes locally but badly inflates areas near the poles.' },
                { t: 'Any projection: they all preserve area', why: 'No flat map preserves everything. Each projection makes a trade-off.' },
              ],
              explain: r`Equal-area projections (like the Mollweide or Equal Earth maps) keep relative sizes correct by squashing shapes near the poles. Mercator is still great for navigation and for online street maps, where you mostly zoom in on small areas and want shapes and angles to look right. Gauss's theorem guarantees that no flat map can do both.`,
            },
          ],
          recap: [
            'No flat map can show a sphere without distortion (Gauss, 1827).',
            r`Mercator preserves angles but stretches lengths by $\frac{1}{\cos\varphi}$ and areas by $\frac{1}{\cos^2\varphi}$.`,
            'Equal-area projections keep sizes fair but distort shapes.',
          ],
        },
        {
          id: 'projections',
          title: 'Comparing Projections',
          summary: 'Trading shape for area',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Wrapping a cylinder',
              body: r`A **cylindrical** projection draws longitude straight across ($x = \lambda$) and chooses some rule $y(\varphi)$ for latitude. Each coral circle is the same small circle on the globe, drawn at 0°, 30° and 60°. Switch between three choices of $y$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -Math.PI, xmax: Math.PI, ymin: -0.75, ymax: 2.1, grid: false, axes: false, maxWidth: 620,
                params: { k: { min: 1, max: 3, step: 1, value: 1, label: 'projection', color: 'teal', format: (v) => PROJ[v - 1].name } },
                extra: ({ plot, p, s }) => {
                  const P = PROJ[p.k - 1], els = [];
                  for (let lon = -180; lon <= 180; lon += 30) els.push(s('line', { x1: plot.X(lon * D), x2: plot.X(lon * D), y1: plot.Y(P.y(-30)), y2: plot.Y(P.y(75)), stroke: 'var(--line-2)', 'stroke-width': 1.2 }));
                  for (let lat = -30; lat <= 75; lat += 15) {
                    els.push(s('line', { x1: plot.X(-Math.PI), x2: plot.X(Math.PI), y1: plot.Y(P.y(lat)), y2: plot.Y(P.y(lat)), stroke: lat ? 'var(--line-2)' : 'var(--ink-3)', 'stroke-width': lat ? 1.2 : 2 }));
                    if (lat >= 0) els.push(s('text', { x: plot.X(-Math.PI) + 4, y: plot.Y(P.y(lat)) - 4, class: 'tick', text: `${lat}°` }));
                  }
                  const u = plot.X(1) - plot.X(0), r0 = 0.12;
                  for (const lat of [0, 30, 60]) for (const lon of [-90, 30, 150]) {
                    els.push(s('ellipse', { cx: plot.X(lon * D), cy: plot.Y(P.y(lat)), rx: (r0 * u) / Math.cos(lat * D), ry: r0 * u * P.k(lat), class: 'fl-coral', opacity: 0.75 }));
                  }
                  return els;
                },
                readout: (p) => {
                  const P = PROJ[p.k - 1];
                  const h = 1 / Math.cos(60 * D), v = P.k(60);
                  return r`${P.name}: at 60°, stretched $\times${h.toFixed(2)}$ across and $\times${v.toFixed(2)}$ up; area drawn $\times${(h * v).toFixed(2)}$`;
                },
              },
              after: r`Every cylindrical map stretches east–west by $\frac{1}{\cos\varphi}$, since every parallel is drawn full width. **Equirectangular** ($y = \varphi$) leaves north–south alone, so areas and shapes both distort. **Mercator** stretches north–south to match, keeping shapes but inflating areas. **Lambert's** map ($y = \sin\varphi$) squashes north–south by $\cos\varphi$, exactly cancelling the area stretch, at the cost of flattened shapes.`,
            },
            {
              type: 'numeric',
              title: 'Equirectangular areas',
              prompt: r`On the equirectangular map, by what factor is area exaggerated at 60° N?`,
              unit: '×',
              answer: 2,
              wrong: [{ v: 4, why: r`That's Mercator. Equirectangular stretches only east–west, by $\frac{1}{\cos 60°}$.` }, { v: 1, why: 'Only the equal-area map keeps areas fair.' }],
              explain: r`East–west $\times 2$, north–south $\times 1$, so areas are doubled. It's the simplest possible map (latitude and longitude used directly as $y$ and $x$), and it's what you get when you plot raw GPS coordinates on a grid.`,
            },
            {
              type: 'numeric',
              title: 'Squashed shapes',
              prompt: r`On Lambert's equal-area map at 60° N, a small circle becomes an ellipse. How many times wider than tall is it?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`It's stretched across by 2 **and** squashed vertically by $\frac12$: ratio $2 \div \frac12$.` }, { v: 1, why: 'Areas are fair, but shapes are not.' }],
              explain: r`Width $\times \frac{1}{\cos 60°} = 2$, height $\times \cos 60° = \frac12$: area unchanged, but the ellipse is 4 times wider than tall. Near the poles, countries look extremely flattened.`,
            },
            {
              type: 'explain',
              title: 'Archimedes’ hat-box',
              body: r`Why does $y = \sin\varphi$ preserve area? Archimedes discovered, around 225 BC, that if you wrap a cylinder snugly around a sphere, then any slice between two parallel planes cuts **equal areas** from the sphere and from the cylinder.

The band of sphere between latitudes $\varphi_1$ and $\varphi_2$ has area $2\pi R^2(\sin\varphi_2 - \sin\varphi_1)$. Lambert's map just unrolls the cylinder. Archimedes was so proud of the sphere–cylinder relationship that he asked for it to be carved on his tomb.`,
            },
            {
              type: 'mcq',
              title: 'Fair maps',
              prompt: r`In the 1970s, Arno Peters promoted an equal-area map, arguing that Mercator made Europe and North America look more important than the tropics. What's true about such maps?`,
              choices: [
                { t: 'They show true relative areas, but distort shapes; no map can do both', ok: true },
                { t: 'They are free of distortion', why: 'Every flat map distorts something. Equal-area maps distort shapes.' },
                { t: 'They make Africa look smaller', why: 'Compared with Mercator, they show Africa’s true, much larger size.' },
              ],
              explain: r`The Gall–Peters map is a stretched version of Lambert's. Cartographers pointed out that compromise projections, like Robinson or Winkel tripel, look more natural while keeping area errors modest. National Geographic used the Winkel tripel for its world maps from 1998.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The tropics and beyond',
              prompt: r`What fraction of the Earth's surface lies between 30° S and 30° N? (Use Archimedes' result.)`,
              answer: 0.5,
              wrong: [{ v: 1 / 3, tol: 0.01, why: r`That's $\frac{60°}{180°}$, but bands near the equator are bigger. Use $\sin 30° - \sin(-30°)$.` }],
              explain: r`Band area $= 2\pi R^2(\sin 30° - \sin(-30°)) = 2\pi R^2$, and the whole sphere is $4\pi R^2$: exactly **half**. Half the planet lies within 30° of the equator, a fact that Mercator maps disguise.`,
            },
          ],
          recap: [
            r`Cylindrical maps stretch east–west by $\frac{1}{\cos\varphi}$; the choice of $y(\varphi)$ decides the rest.`,
            r`Lambert's $y = \sin\varphi$ preserves area, thanks to Archimedes' hat-box theorem.`,
            'Shape-preserving and area-preserving are incompatible: every map compromises.',
          ],
        },
      ],
    },
  ],
};
