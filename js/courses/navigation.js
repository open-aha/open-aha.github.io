import { fix } from '../lib/svg.js';

const r = String.raw;
const RX = [3, 2]; // true receiver position
const SATS = [[0, 0], [8, 1], [2, 7]];
const BIAS = 1.5; // receiver clock error, in distance units
const PSEUDO = SATS.map((sv) => Math.hypot(sv[0] - RX[0], sv[1] - RX[1]) + BIAS);

const D = Math.PI / 180;
// Sun's declination on day d of the year (simple model)
const decl = (d) => 23.44 * Math.sin((2 * Math.PI * (d - 80)) / 365);
// bearing (degrees, clockwise from north) from P to Q, with x = east and y = north
const bearing = (P, Q) => ((Math.atan2(Q[0] - P[0], Q[1] - P[1]) / D) + 360) % 360;
const LH = [[0, 0], [10, 0]]; // lighthouses A and B (km)
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
// inertial drift: position error (m) after t seconds with accelerometer bias b (m/s²)
const drift = (b, t) => 0.5 * b * t * t;

export default {
  id: 'navigation',
  subject: 'physics',
  title: 'Navigation',
  level: 'Intermediate',
  cover: 'navigation',
  tagline: 'Pole stars, chronometers, lighthouses, gyroscopes and GPS: how we find where we are.',
  description: r`For most of history, sailors could find their latitude but not their longitude, and ships were wrecked as a result. Learn to read latitude from the stars, see why longitude is really a problem of keeping time, steer by dead reckoning, take a fix from two lighthouses, see how submarines navigate blind, and discover how GPS uses four satellites and a clever trick to fix your position to within metres.`,
  prereq: 'Maps & Spherical Geometry',
  chapters: [
    {
      title: 'Stars and Clocks',
      summary: 'Latitude, longitude and timekeeping.',
      lessons: [
        {
          id: 'latitude',
          title: 'Latitude from the Sky',
          summary: 'The pole star’s height',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'A star above the pole',
              body: r`Polaris sits almost exactly above the Earth's North Pole. At the pole it's directly overhead; at the equator it's on the horizon. In between, its **altitude** (angle above the horizon) equals your **latitude**.

Sailors measured it with instruments like the quadrant, astrolabe and later the sextant. In the southern hemisphere, with no bright pole star, navigators used the Sun's height at noon instead, corrected for the date.`,
            },
            {
              type: 'numeric',
              title: 'Where are you?',
              prompt: r`At night you measure Polaris at $52°$ above the northern horizon. What is your latitude (in degrees north)?`,
              unit: '°N',
              answer: 52,
              wrong: [{ v: 38, why: 'That’s 90° − 52°. The pole star’s altitude equals the latitude directly.' }],
              explain: r`$52°$ N: roughly the latitude of London, Amsterdam or Berlin. Latitude is easy because the sky's geometry ties directly to north–south position.`,
            },
            {
              type: 'explain',
              title: 'The noon Sun',
              body: r`By day, navigators used the Sun at local noon, when it's highest. At the equinoxes (March and September), the Sun is overhead at the equator, and its noon altitude is $90° - \text{latitude}$.

The rest of the year, the Sun's **declination** $\delta$ (how far north of the equator it is overhead) shifts between $+23.4°$ in June and $-23.4°$ in December. Then, north of the tropics:
$$\text{noon altitude} = 90° - \varphi + \delta$$
Navigators looked up $\delta$ for each day in printed tables, the *nautical almanac*.`,
            },
            {
              type: 'numeric',
              title: 'Midsummer noon',
              prompt: r`On the June solstice ($\delta = +23.4°$), the noon Sun stands $61.4°$ above the southern horizon. What's your latitude?`,
              unit: '°N',
              answer: 52,
              tol: 0.05,
              wrong: [{ v: 5.2, tol: 0.05, why: r`Add the declination: $\varphi = 90° - 61.4° + 23.4°$.` }, { v: 28.6, tol: 0.05, why: r`That's $90° - 61.4°$. In June, the Sun is $23.4°$ higher than at the equinox, so add it back.` }],
              explain: r`$\varphi = 90° - 61.4° + 23.4° = 52°$ N: the same answer the pole star gave.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Sun overhead',
              prompt: r`The graph shows the Sun's noon altitude through the year at your chosen latitude. Find the latitude where the noon Sun is **exactly overhead** (90°) on just one day of the year.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 365, ymin: 0, ymax: 100, grid: 30.4, gridY: 10, height: 260, axes: { xlabel: 'month', ylabel: 'noon altitude (°)', xticks: 30.4, xfmt: (v) => 'JFMAMJJASOND'[Math.round(v / 30.4)] || '' },
                params: { phi: { min: 0, max: 66, step: 0.5, value: 52, label: 'latitude', color: 'coral', format: (v) => `${fix(v, 1)}° N` } },
                curves: [{ f: (d, p) => Math.min(90 - p.phi + decl(d), 180 - (90 - p.phi + decl(d))), color: 'amber', width: 3 }, { f: () => 90, color: 'ink', dash: true, width: 1.5 }],
                readout: (p) => r`at ${fix(p.phi, 1)}° N the noon Sun ranges from $${(90 - p.phi - 23.44).toFixed(1)}°$ (December) to $${Math.min(90, 90 - p.phi + 23.44).toFixed(1)}°$${p.phi < 23 ? ' (overhead twice a year)' : ' (June)'}`,
                goal: (p) => Math.abs(p.phi - 23.44) < 0.3,
                hint: 'The Sun is overhead where its declination equals your latitude. What’s the largest declination?',
                solution: { phi: 23.5 },
              },
              explain: r`At $23.4°$ N, the **Tropic of Cancer**, the Sun is overhead at noon on the June solstice only. South of it (in the tropics), the Sun passes overhead twice a year. Syene, in Eratosthenes' story, sits almost exactly on it.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Down under',
              prompt: r`In the southern hemisphere there's no bright pole star. How can you find the south celestial pole?`,
              choices: [
                { t: 'Extend the long axis of the Southern Cross about 4.5 times its length', ok: true },
                { t: 'Polaris is visible from everywhere', why: 'Polaris is below the horizon south of the equator.' },
                { t: 'Look straight up', why: 'The celestial pole is overhead only at the South Pole itself.' },
              ],
              explain: r`The Southern Cross (Crux) points towards the south celestial pole, an empty patch of sky. Its altitude still equals your latitude (south), just as Polaris's does in the north. Polynesian navigators used star paths like these to cross thousands of kilometres of Pacific Ocean.`,
            },
          ],
          recap: [
            'The altitude of Polaris equals your latitude (northern hemisphere).',
            'The Sun’s noon altitude, adjusted for the date, also gives latitude.',
            'Latitude was the “easy” coordinate for navigators.',
          ],
        },
        {
          id: 'longitude',
          title: 'The Longitude Problem',
          summary: 'A matter of time',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Earth as a clock',
              body: r`The Earth turns $360°$ in 24 hours: $15°$ per hour. So if it's noon where you are (the Sun at its highest) and a clock set to Greenwich time reads 3 pm, you're 3 hours behind Greenwich: $45°$ west.

Longitude therefore needs an accurate clock that keeps home time through months at sea, despite rolling, temperature changes and humidity. Pendulum clocks were useless on a ship.`,
            },
            { /*anim:navigation*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Noon travels west',
              body: r`The Earth seen from above the North Pole, turning once a day with the Sun off to the right. Each meridian has local **noon** when it points straight at the Sun. Watch {blue:Greenwich} and a {coral:ship at 45° W}.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 2.2, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 520,
                animate: { param: 't', speed: 1.2, max: 24, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const D = Math.PI / 180, R = plot.X(1) - plot.X(0), cx = plot.X(0), cy = plot.Y(0);
                  // Greenwich time in hours; the Greenwich meridian points at the Sun at 12:00
                  const gt = (12 + p.t) % 24, rot = (gt - 12) * 15 * D;
                  const els = [];
                  for (let k = 0; k < 6; k++) els.push(s('line', { x1: plot.X(1.35), x2: plot.X(2.15), y1: plot.Y(-0.75 + 0.3 * k), y2: plot.Y(-0.75 + 0.3 * k), stroke: 'var(--amber)', 'stroke-width': 2, opacity: 0.6 }));
                  els.push(s('circle', { cx: plot.X(1.95), cy: plot.Y(0), r: 16, class: 'fl-amber' }));
                  els.push(s('circle', { cx, cy, r: R, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                  els.push(s('path', { d: `M${cx} ${cy - R}A${R} ${R} 0 0 0 ${cx} ${cy + R}Z`, fill: 'var(--night)', opacity: 0.35 }));
                  const mer = (lonDeg, col, w) => { const a = rot + lonDeg * D; return s('line', { x1: cx, y1: cy, x2: cx + R * Math.cos(a), y2: cy - R * Math.sin(a), stroke: col, 'stroke-width': w, 'stroke-linecap': 'round' }); };
                  for (let k = 0; k < 24; k++) els.push(mer(k * 15, 'var(--line-2)', 1));
                  els.push(mer(0, 'var(--blue)', 4), mer(-45, 'var(--coral)', 4));
                  els.push(s('circle', { cx, cy, r: 5, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => {
                  const hm = (h) => { const m = Math.floor(((h % 24) + 24) % 24 * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
                  const gt = (12 + p.t) % 24;
                  return `{blue:Greenwich ${hm(gt)}} · {coral:ship's local Sun time ${hm(gt - 3)}} · always 3 hours behind = 45° west`;
                },
              },
              after: r`As the Earth turns eastwards, noon sweeps **westwards** around the globe at $15°$ per hour. The ship sees its noon 3 hours after Greenwich does, so its Sun time is always 3 hours behind: that difference **is** its longitude. Measure local noon with a sextant, read Greenwich time off a reliable clock, and the gap tells you how far east or west you are.`,
            },
            {
              type: 'numeric',
              title: 'Local noon',
              prompt: r`Your ship's chronometer, set to Greenwich time, reads 08:20 at local noon. What is your longitude, in degrees? (Use positive for east.)`,
              unit: '°E',
              answer: 55,
              tol: 0.01,
              wrong: [{ v: -55, why: 'Noon arrives here before it does at Greenwich, so you’re east of Greenwich.' }, { v: 3.67, tol: 0.05, why: 'That’s the time difference in hours. Multiply by 15° per hour.' }],
              explain: r`Noon here came 3 h 40 min **before** Greenwich noon, so you're east: $3.667 \times 15° = 55°$ E. That's roughly the longitude of Dubai or Mauritius.`,
            },
            {
              type: 'numeric',
              title: 'Going west',
              prompt: r`Your chronometer, set to Greenwich time, reads 17:00 at local noon. What is your longitude? (Positive for east, negative for west.)`,
              unit: '°E',
              answer: -75,
              wrong: [{ v: 75, why: 'Greenwich passed noon 5 hours before you, so you’re west: negative.' }, { v: 5, why: 'That’s the time difference in hours. Multiply by 15°.' }],
              explain: r`Greenwich is 5 hours ahead, so you're $5 \times 15° = 75°$ west: about the longitude of Philadelphia or Bogotá.`,
            },
            {
              type: 'numeric',
              title: 'The cost of a slow clock',
              prompt: r`At the equator, one degree of longitude spans about 111 km. If a ship's chronometer has drifted by just **1 minute**, how far off (in km) is the calculated position? (Nearest km.)`,
              unit: 'km',
              answer: Math.round(111 / 4),
              tol: 1,
              wrong: [{ v: 111, why: 'One minute of time is a quarter of a degree (15° per hour = 1° per 4 minutes).' }],
              explain: r`1 minute $= \frac{1}{4}$ degree $\approx 28$ km. After the 1707 Scilly naval disaster, where four warships were wrecked and well over a thousand sailors died, partly from navigational error, the British government offered a huge prize. Clockmaker John Harrison's sea watch H4 lost only about 5 seconds on an 81-day voyage to Jamaica in 1761–62.`,
            },
            {
              type: 'mcq',
              title: 'A clock in the sky',
              prompt: r`Before reliable chronometers, astronomers proposed the "lunar distance" method. What did it use as a clock?`,
              choices: [
                { t: 'The Moon’s position against the stars, which moves about its own width every hour', ok: true },
                { t: 'The Sun’s height at noon', why: 'That gives latitude, not Greenwich time.' },
                { t: 'The rotation of the Earth', why: 'Earth’s rotation gives local time. The problem was knowing the time at Greenwich.' },
              ],
              explain: r`The Moon moves about $0.5°$ per hour against the stars, so its angle from a bright star tells Greenwich time, using tables published in the *Nautical Almanac* from 1767. It took hours of calculation, so as chronometers became cheaper in the 1800s, they took over.`,
            },
            {
              type: 'interactive',
              title: 'Time is longitude',
              body: r`Earth turns $15°$ per hour. A ship’s clock keeps Greenwich time. Local noon (Sun highest) comes when the clock reads 15:30. Find the ship’s longitude.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 360,
                params: { h: { min: 0, max: 8, step: 0.25, value: 2, label: 'hours behind Greenwich', color: 'violet', format: (v) => `${Math.floor(v)} h ${Math.round((v % 1) * 60)} min` } },
                extra: ({ plot, p, s }) => { const a = -(p.h * 15 * Math.PI) / 180 + Math.PI / 2; return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(1), stroke: 'var(--ink)', 'stroke-width': 3 }), s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(Math.cos(a)), y2: plot.Y(Math.sin(a)), stroke: 'var(--coral)', 'stroke-width': 3 }), s('text', { x: plot.X(0.05), y: plot.Y(1.12), class: 'tick', text: 'Greenwich' })]; },
                readout: (p) => `local noon at ${12 + Math.floor(p.h)}:${String(Math.round((p.h % 1) * 60)).padStart(2, '0')} Greenwich time → longitude **${(15 * p.h).toFixed(2)}° W**`,
                goal: (p) => Math.abs(p.h - 3.5) < 1e-9,
                hint: 'Noon came 3½ hours late.',
                solution: { h: 3.5 },
              },
              explain: r`$3.5 \times 15° = 52.5°$ W, out in the mid-Atlantic. Every 4 minutes of clock error means $1°$ of longitude, about 110 km at the equator: that’s why the longitude prize demanded a clock that lost no more than a few seconds a day.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Harrison’s accuracy',
              prompt: r`Harrison's H4 lost about 5 seconds over its 81-day test voyage. At the equator (111 km per degree), what position error does a 5-second clock error cause? (Nearest 0.1 km.)`,
              unit: 'km',
              answer: (5 / 240) * 111,
              tol: 0.06,
              wrong: [{ v: 555, why: 'Convert seconds of time to degrees: the Earth turns 1° every 4 minutes (240 s).' }],
              explain: r`5 s is $\frac{5}{240}$ of a degree, so $\frac{5}{240} \times 111 \approx 2.3$ km: far better than the half-degree accuracy the Longitude Act asked for.`,
            },
          ],
          recap: [
            'Earth turns 15° per hour, so longitude = time difference × 15°.',
            'Finding longitude needs an accurate clock keeping home time.',
            'Harrison’s marine chronometers solved the problem in the 1760s.',
          ],
        },
      ],
    },
    {
      title: 'Modern Navigation',
      summary: 'Dead reckoning and satellites.',
      lessons: [
        {
          id: 'reckoning',
          title: 'Dead Reckoning',
          summary: 'Speed, heading and drift',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Navigating by arithmetic',
              body: r`Without landmarks, navigators estimate position from their **speed**, **heading** and **time travelled**: dead reckoning. But water and air move too. A boat's actual motion over the ground is the **vector sum** of its motion through the water and the current's motion.`,
            },
            {
              type: 'numeric',
              title: 'Across a current',
              prompt: r`A boat steers due north at 12 km/h through the water, while a current carries the water east at 5 km/h. What is the boat's speed over the ground?`,
              unit: 'km/h',
              answer: 13,
              wrong: [{ v: 17, why: 'The velocities are at right angles, so add them as vectors (Pythagoras), not as numbers.' }, { v: 7, why: 'Subtracting doesn’t apply here: they’re perpendicular. Use √(12² + 5²).' }],
              explain: r`$\sqrt{12^2 + 5^2} = 13$ km/h, heading about $23°$ east of north ($\tan^{-1}\frac{5}{12}$). Small errors in speed or heading accumulate over hours, so dead reckoning needs regular fixes from stars, landmarks or, today, satellites.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Steer into the current',
              prompt: r`You want to travel **due north** across that 5 km/h eastward current, at 12 km/h through the water. Choose how far west of north to point the boat.`,
              widget: {
                kind: 'graph', equal: true, xmin: -13, xmax: 9, ymin: -1.5, ymax: 13.5, grid: 1, axes: false, maxWidth: 440,
                params: { th: { min: 0, max: 45, step: 0.5, value: 0, label: 'heading west of north', color: 'blue', format: (v) => `${fix(v, 1)}°` } },
                extra: ({ plot, p, s, arrow }) => {
                  const bx = -12 * Math.sin(p.th * D), by = 12 * Math.cos(p.th * D);
                  const v = (x0, y0, x1, y1, c, w = 4) => arrow(plot.X(x0), plot.Y(y0), plot.X(x1), plot.Y(y1), { color: `var(--${c})`, width: w, head: 13 });
                  return [
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1), y2: plot.Y(13), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    s('text', { x: plot.X(0), y: plot.Y(13) - 4, 'text-anchor': 'middle', class: 'lbl', text: 'N' }),
                    v(0, 0, bx, by, 'blue'),
                    v(bx, by, bx + 5, by, 'teal'),
                    v(0, 0, bx + 5, by, 'coral', 5),
                    s('text', { x: plot.X(bx / 2) - 12, y: plot.Y(by / 2), 'text-anchor': 'end', class: 'lbl fl-blue', text: 'boat 12' }),
                    s('text', { x: plot.X(bx + 2.5), y: plot.Y(by) - 10, 'text-anchor': 'middle', class: 'lbl fl-teal', text: 'current 5' }),
                  ];
                },
                readout: (p) => {
                  const e = 5 - 12 * Math.sin(p.th * D), n = 12 * Math.cos(p.th * D);
                  return r`over the ground: $${e.toFixed(2)}$ km/h east, $${n.toFixed(2)}$ km/h north`;
                },
                goal: (p) => Math.abs(5 - 12 * Math.sin(p.th * D)) < 0.1,
                hint: r`The boat's westward component, $12\sin\theta$, must cancel the 5 km/h current.`,
                solution: { th: 24.5 },
              },
              explain: r`$\sin\theta = \frac{5}{12}$, so $\theta \approx 24.6°$ west of north. The coral arrow then points due north, but its length is only $\sqrt{12^2 - 5^2} \approx 10.9$ km/h: crossing a current always costs some speed. Pilots do the same thing in a crosswind, called *crabbing*.`,
            },
            {
              type: 'explain',
              title: 'The 1-in-60 rule',
              body: r`Navigators and pilots use a handy rule of thumb: a heading error of $1°$ puts you about **1 unit off course for every 60 units travelled**.

It comes from the small-angle approximation: $\sin 1° \approx \frac{\pi}{180} \approx \frac{1}{57.3}$, close enough to $\frac{1}{60}$ for mental arithmetic.`,
            },
            {
              type: 'numeric',
              title: 'Distance run',
              prompt: r`A ship steams at 6 knots (nautical miles per hour) for 2½ hours. How far has it travelled, in nautical miles?`,
              unit: 'NM',
              answer: 15,
              tol: 0.01,
              explain: r`$6 \times 2.5 = 15$ nautical miles. A nautical mile is one minute of latitude (1,852 m), which makes chart work especially convenient.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Off course',
              prompt: r`After flying 150 km, a pilot finds they're 5 km to the right of where they should be. Using the 1-in-60 rule, how many degrees off was their heading?`,
              unit: '°',
              answer: 2,
              wrong: [{ v: 30, why: 'Divide the distance flown by 60 first: 150 km gives 2.5 km per degree.' }, { v: 0.5, why: 'Each degree gives 2.5 km off course here; 5 km means 2°.' }],
              explain: r`At 150 km, each degree of error gives $\frac{150}{60} = 2.5$ km off course, so 5 km means $2°$. To get back on track at the destination, the pilot must now turn by about twice that.`,
            },
          ],
          recap: [
            'Dead reckoning estimates position from speed, heading and time.',
            'Currents and winds add as vectors.',
            'Errors accumulate, so regular position fixes are needed.',
          ],
        },
        {
          id: 'fixes',
          title: 'Position Fixes',
          summary: 'Lighthouses, bearings and angles',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Lines of position',
              body: r`Near a coast, navigators fix their position from landmarks. Sighting a lighthouse through a hand-bearing compass gives a **bearing**, and that puts you somewhere on a line through the lighthouse: a **line of position**.

One line isn't enough. Two bearings on two different landmarks give two lines, and you're where they cross: a **fix**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Take a fix',
              prompt: r`Lighthouse A bears $225°$ from you, and lighthouse B bears $135°$. Drag the boat to your position on the chart (grid squares are 1 km; north is up).`,
              widget: {
                kind: 'graph', equal: true, xmin: -2, xmax: 12, ymin: -2, ymax: 9, grid: 1, axes: false, maxWidth: 480,
                params: { x: { min: -1, max: 11, step: 0.1, value: 7.5, slider: false }, y: { min: 0.5, max: 8.5, step: 0.1, value: 7, slider: false } },
                points: [{ x: (p) => p.x, y: (p) => p.y, drag: { x: 'x', y: 'y' }, color: 'violet', r: 9 }],
                extra: ({ plot, p, s }) => {
                  const B = [p.x, p.y];
                  const els = [s('rect', { x: plot.X(-2), y: plot.Y(0), width: plot.X(12) - plot.X(-2), height: plot.Y(-2) - plot.Y(0), class: 'fl-amber-soft' })];
                  LH.forEach((L, i) => {
                    els.push(s('line', { x1: plot.X(B[0]), y1: plot.Y(B[1]), x2: plot.X(L[0]), y2: plot.Y(L[1]), stroke: `var(--${i ? 'coral' : 'blue'})`, 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
                    els.push(s('path', { d: `M${plot.X(L[0])} ${plot.Y(L[1]) - 18} l-7 18 h14 z`, class: i ? 'fl-coral' : 'fl-blue' }));
                    els.push(s('text', { x: plot.X(L[0]), y: plot.Y(L[1]) + 20, 'text-anchor': 'middle', class: 'lbl', text: i ? 'B' : 'A' }));
                  });
                  return els;
                },
                readout: (p) => `bearing to A: ${Math.round(bearing([p.x, p.y], LH[0]))}°, bearing to B: ${Math.round(bearing([p.x, p.y], LH[1]))}°`,
                goal: (p) => angDiff(bearing([p.x, p.y], LH[0]), 225) < 1 && angDiff(bearing([p.x, p.y], LH[1]), 135) < 1,
                hint: 'A is to your south-west and B to your south-east, at 45° each side of south.',
                solution: { x: 5, y: 5 },
              },
              explain: r`You're at (5, 5): A lies exactly south-west and B exactly south-east, so the two lines meet at a right angle, 5 km north of the midpoint between the lighthouses. On paper, a navigator draws the **reverse** bearings from each lighthouse: $225° - 180° = 045°$ from A and $135° + 180° = 315°$ from B.`,
            },
            {
              type: 'mcq',
              title: 'Choosing landmarks',
              prompt: r`Which pair of landmarks gives the most reliable fix?`,
              choices: [
                { t: 'Two whose bearings differ by about 90°', ok: true },
                { t: 'Two almost in line with each other', why: 'Lines crossing at a shallow angle magnify any small bearing error into a large position error.' },
                { t: 'It makes no difference', why: 'The crossing angle matters a lot: shallow crossings smear the fix along the lines.' },
              ],
              explain: r`If the lines cross at a shallow angle, a $2°$ compass error slides the crossing point a long way along them. Crossing at near $90°$ keeps errors small. A third bearing usually gives a small triangle (the "cocked hat"), whose size shows how good the fix is.`,
            },
            {
              type: 'numeric',
              title: 'Distance off a lighthouse',
              prompt: r`A lighthouse's light is 50 m above the sea. With a sextant, you measure the angle from its base to the light as $1.5°$. How far away is it, in km? (2 decimal places.)`,
              unit: 'km',
              answer: 0.05 / Math.tan(1.5 * D),
              tol: 0.01,
              wrong: [{ v: 0.05 * Math.tan(1.5 * D), tol: 0.0005, why: r`Distance $= \frac{\text{height}}{\tan\alpha}$.` }],
              explain: r`$d = \frac{50}{\tan 1.5°} \approx 1909$ m $\approx 1.91$ km. This puts you on a **circle of position** around the lighthouse; combined with one bearing, it gives a fix from a single landmark.`,
            },
            {
              type: 'mcq',
              title: 'The cocked hat',
              prompt: r`A navigator takes bearings on three landmarks, but the three lines don’t meet at a point: they form a small triangle (a "cocked hat"). What does that tell them?`,
              choices: [
                { t: r`The bearings contain errors; the true position is probably near the triangle, and its size shows how big the errors are`, ok: true },
                { t: r`The ship is exactly at one of the corners`, why: r`Any corner is just where two of the imperfect lines cross.` },
                { t: r`The chart is wrong`, why: r`Usually it’s small errors in the bearings, not the chart.` },
              ],
              explain: r`With perfect measurements the three lines would meet at one point. A small cocked hat means good bearings; a large one is a warning, and a careful navigator assumes the most dangerous position within it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Over the horizon',
              prompt: r`On a round Earth, the distance to the horizon from height $h$ metres is about $3.57\sqrt{h}$ km. From a deck 4 m above the sea, how far away can you first see the top of a light 50 m high? (Nearest km.)`,
              unit: 'km',
              answer: Math.round(3.57 * (Math.sqrt(50) + Math.sqrt(4))),
              tol: 1,
              wrong: [{ v: Math.round(3.57 * Math.sqrt(50)), tol: 1, why: 'Add your own horizon distance: both the light and your eye see over the curve.' }, { v: Math.round(3.57 * Math.sqrt(54)), tol: 1, why: 'Add the two horizon distances, not the two heights.' }],
              explain: r`$3.57(\sqrt{50} + \sqrt{4}) \approx 3.57(7.07 + 2) \approx 32$ km. The light's horizon and yours meet at a point between you. Charts list this "geographic range" for each lighthouse.`,
            },
          ],
          recap: [
            'A bearing on a landmark gives a line of position; two lines give a fix.',
            'Landmarks about 90° apart give the most reliable fixes.',
            'A vertical angle to a known height gives distance: a circle of position.',
          ],
        },
        {
          id: 'inertial',
          title: 'Inertial Navigation',
          summary: 'Knowing where you are without looking',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Dead reckoning with sensors',
              body: r`Submarines, missiles and aircraft can navigate without seeing anything outside. **Accelerometers** measure acceleration and **gyroscopes** measure rotation. Integrate acceleration once and you get velocity; integrate again and you get position.

Your phone has the same kinds of sensors, built as microscopic silicon structures, which is how it knows when you rotate it.`,
            },
            {
              type: 'numeric',
              title: 'Twice integrated',
              prompt: r`Starting at rest, a vehicle accelerates at a constant $2$ m/s² for 10 s. How far does it travel?`,
              unit: 'm',
              answer: 100,
              wrong: [{ v: 20, why: 'That’s the final speed (m/s). Distance is ½at².' }, { v: 200, why: r`Don't forget the $\frac12$: $\frac12 \times 2 \times 10^2$.` }],
              explain: r`$s = \tfrac12 a t^2 = \tfrac12 \times 2 \times 100 = 100$ m. An inertial system does this continuously, thousands of times a second, in three dimensions.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Drift',
              prompt: r`A tiny constant error (bias) $b$ in an accelerometer grows into a position error of $\tfrac12 b t^2$. Find the largest bias that keeps the error under 1 km after one hour.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 3, grid: 10, gridY: 0.5, height: 260, axes: { xlabel: 'time (minutes)', ylabel: 'position error (km)' },
                params: { b: { min: 1, max: 40, step: 0.5, value: 30, label: r`bias ($\times 10^{-5}$ m/s²)`, color: 'coral', format: (v) => fix(v, 1) } },
                curves: [{ f: (t, p) => drift(p.b * 1e-5, t * 60) / 1000, color: 'coral', width: 3 }, { f: () => 1, color: 'ink', dash: true, width: 1.5 }],
                readout: (p) => r`error after 1 hour: $${(drift(p.b * 1e-5, 3600) / 1000).toFixed(2)}$ km`,
                goal: (p) => drift(p.b * 1e-5, 3600) <= 1000 && drift((p.b + 0.5) * 1e-5, 3600) > 1000,
                hint: r`Solve $\frac12 b (3600)^2 = 1000$.`,
                solution: { b: 15 },
              },
              explain: r`$b = \frac{2 \times 1000}{3600^2} \approx 1.5 \times 10^{-4}$ m/s²: about **16 millionths of $g$**. Navigation-grade accelerometers must be that good. Your phone's are thousands of times worse, which is why it can't navigate for long without GPS.`,
            },
            {
              type: 'numeric',
              title: 'Squared growth',
              prompt: r`If a constant bias produces a 1 km error after 1 hour, how large is the error after 3 hours?`,
              unit: 'km',
              answer: 9,
              wrong: [{ v: 3, why: r`The error grows as $t^2$, not $t$.` }],
              explain: r`$\tfrac12 b t^2$: tripling the time multiplies the error by $3^2 = 9$. That's why inertial systems are regularly corrected using GPS or star sightings.`,
            },
            {
              type: 'mcq',
              title: 'Which way is down?',
              prompt: r`Why must an inertial system know its exact tilt?`,
              choices: [
                { t: 'If an accelerometer is tilted slightly, it reads part of gravity as a sideways acceleration', ok: true },
                { t: 'Tilting damages the sensors', why: 'Sensors tolerate tilt fine. The problem is the false reading.' },
                { t: 'It doesn’t need to', why: 'Gravity is huge compared with the accelerations being measured, so even tiny tilts matter.' },
              ],
              explain: r`Accelerometers can't tell gravity from acceleration (Einstein's equivalence principle). A tilt of $\theta$ leaks $g\sin\theta$ of gravity into the horizontal reading. That's why the gyroscopes, which track orientation, are just as important as the accelerometers.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A hundredth of a degree',
              prompt: r`An accelerometer is tilted by just $0.01°$, so it reads a false horizontal acceleration of $g\sin 0.01° \approx 0.0017$ m/s². How far off is the position after 10 minutes, using $\tfrac12 b t^2$? (Nearest 10 m.)`,
              unit: 'm',
              answer: Math.round(drift(9.8 * Math.sin(0.01 * D), 600) / 10) * 10,
              tol: 10,
              wrong: [{ v: 0.31, tol: 0.02, why: 'That’s in km. Give the answer in metres.' }, { v: 1, tol: 0.2, why: 'Use t = 600 seconds.' }],
              explain: r`$\tfrac12 \times 0.0017 \times 600^2 \approx 310$ m. In practice, clever design ("Schuler tuning") turns this growing error into an oscillation with an 84-minute period, the period of a pendulum as long as the Earth's radius, but accurate tilt is still essential.`,
            },
          ],
          recap: [
            'Inertial navigation integrates acceleration twice to get position.',
            r`A constant bias gives an error $\frac12 b t^2$, growing as time squared.`,
            'Tiny tilts make gravity leak into horizontal readings.',
          ],
        },
        {
          id: 'gps',
          title: 'How GPS Works',
          summary: 'Timing signals from orbit',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Distance from time',
              body: r`Each GPS satellite carries atomic clocks and broadcasts its position and the exact time. Your receiver notes when each signal arrives. Since radio waves travel at the speed of light, the delay gives the distance:
$$d = c \times \Delta t$$
Distances to several satellites, whose positions are known, pin down where you are: the place where the spheres around them intersect.`,
            },
            {
              type: 'numeric',
              title: 'A tiny timing error',
              prompt: r`If a receiver's clock is off by just 1 microsecond ($10^{-6}$ s), how large is the resulting error in distance? ($c = 3 \times 10^8$ m/s.)`,
              unit: 'm',
              answer: 300,
              wrong: [{ v: 3e14, relTol: 0.01, why: 'Multiply by 10⁻⁶, not 10⁶: 3 × 10⁸ × 10⁻⁶.' }],
              explain: r`$3 \times 10^8 \times 10^{-6} = 300$ m. A phone's quartz clock can easily be off by far more than that, so GPS needs a trick.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Solve for the clock error',
              prompt: r`Your receiver's clock is wrong by an unknown amount, so every measured distance is too long by the same amount $b$. Here are three satellites (flattened to 2D). Adjust $b$ until the three circles meet at a single point.`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 10, ymin: -2.5, ymax: 8.5, grid: 1, equal: true, maxWidth: 480, axes: false,
                params: { b: { min: 0, max: 3, step: 0.1, value: 0, label: r`clock correction $b$`, color: 'violet', format: (v) => v.toFixed(1) } },
                extra: ({ plot, p, s }) => {
                  const u = plot.X(1) - plot.X(0), cols = ['blue', 'coral', 'teal'];
                  const els = SATS.map((sv, i) => s('circle', { cx: plot.X(sv[0]), cy: plot.Y(sv[1]), r: Math.max(0, PSEUDO[i] - p.b) * u, fill: 'none', stroke: `var(--${cols[i]})`, 'stroke-width': 2.5 }));
                  SATS.forEach((sv, i) => els.push(s('rect', { x: plot.X(sv[0]) - 9, y: plot.Y(sv[1]) - 9, width: 18, height: 18, rx: 4, class: `fl-${cols[i]}` })));
                  if (Math.abs(p.b - BIAS) < 0.05) els.push(s('circle', { cx: plot.X(RX[0]), cy: plot.Y(RX[1]), r: 8, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => (Math.abs(p.b - BIAS) < 0.05 ? `All three circles meet: you're at (${RX[0]}, ${RX[1]}), and your clock was off by ${BIAS} units.` : `The circles don't share a common point: the clock correction is wrong.`),
                goal: (p) => Math.abs(p.b - BIAS) < 0.05,
                hint: 'Too small a correction leaves circles overlapping in a triangle; too large and they pull apart. Find where they meet exactly.',
                solution: { b: BIAS },
              },
              explain: r`With the right clock correction, all distances agree on one point. That's why GPS needs **four** satellites in 3D: three unknowns for position ($x, y, z$) plus one for the receiver's clock error. Your phone effectively becomes as accurate as an atomic clock by solving for its own error. (GPS also has to correct the satellites' clocks for relativity, by about 38 microseconds per day.)`,
            },
            {
              type: 'numeric',
              title: 'From orbit',
              prompt: r`GPS satellites orbit about 20,200 km above the Earth. How long does a signal take to reach you from directly overhead, in milliseconds? (Nearest ms.)`,
              unit: 'ms',
              answer: Math.round((20200e3 / 3e8) * 1000),
              tol: 1,
              wrong: [{ v: 0.067, tol: 0.002, why: 'That’s in seconds. Convert to milliseconds.' }],
              explain: r`$\frac{2.02 \times 10^7}{3 \times 10^8} \approx 0.067$ s $= 67$ ms. To get 3 m accuracy, the receiver must time it to about 10 nanoseconds: one part in 7 million.`,
            },
            {
              type: 'numeric',
              title: 'How many satellites?',
              prompt: r`A GPS receiver must find its three position coordinates plus its own clock error. What is the minimum number of satellites it needs?`,
              answer: 4,
              explain: r`Four unknowns need four measurements: **4 satellites**. In practice receivers use as many as they can see (often over 10) to improve accuracy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Without relativity',
              prompt: r`Relativity makes the satellites' clocks run fast by about 38 microseconds per day. If this weren't corrected, roughly how large would the distance errors grow in one day, in km? (1 decimal place.)`,
              unit: 'km',
              answer: 38e-6 * 3e8 / 1000,
              tol: 0.05,
              wrong: [{ v: 11400, tol: 10, why: 'That’s in metres. Convert to km.' }],
              explain: r`$38 \times 10^{-6} \times 3 \times 10^8 \approx 11{,}400$ m $\approx 11.4$ km per day. Weaker gravity in orbit makes the clocks run fast (general relativity, about +45 μs/day), while their speed slows them (special relativity, about −7 μs/day). The clocks are deliberately tuned slightly slow before launch to compensate.`,
            },
          ],
          recap: [
            r`GPS measures distance from signal travel time: $d = c\,\Delta t$.`,
            'A 1 μs clock error means 300 m of distance error.',
            'Four satellites solve for position and the receiver’s clock error.',
            'Relativity shifts the satellite clocks by 38 μs per day, which must be corrected.',
          ],
        },
        {
          id: 'twelfths',
          title: 'The Rule of Twelfths',
          summary: 'Tide heights in your head',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Tides are not steady',
              body: r`Between low and high water the tide takes about six hours, but it doesn’t rise at a steady rate: it starts slowly, runs fastest in the middle, and slows again near the top, roughly following a sine curve. Sailors estimate it with the **rule of twelfths**: in each of the six hours the tide rises by
$$\tfrac{1}{12},\ \tfrac{2}{12},\ \tfrac{3}{12},\ \tfrac{3}{12},\ \tfrac{2}{12},\ \tfrac{1}{12}$$
of the **range** (the height difference between low and high water).`,
            },
            {
              type: 'numeric',
              title: 'The third hour',
              prompt: r`The range is 6 m. By the rule of twelfths, how much does the tide rise during the **third** hour after low water?`,
              unit: 'm',
              answer: 1.5,
              tol: 0.01,
              explain: r`$\frac{3}{12} \times 6 = 1.5$ m, a quarter of the whole range in a single hour. The third and fourth hours are when tidal currents run strongest.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Crossing the sandbar',
              prompt: r`Low water is at time 0 and the range is 6 m. Your boat needs the tide to have risen **4 m** to cross a sandbar. The violet curve is the smooth sine tide, the steps the rule of twelfths. Find the earliest time (using the sine curve) you can cross.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 6.5, grid: false, height: 260, axes: { xlabel: 'hours after low water', ylabel: 'height above low water (m)', xticks: 1, yticks: 1 },
                params: { t: { min: 0, max: 6, step: 0.01, value: 2, label: 'time', color: 'coral', format: (v) => `${Math.floor(v)} h ${String(Math.round((v % 1) * 60)).padStart(2, '0')} min` } },
                curves: [{ f: (x) => 3 * (1 - Math.cos((Math.PI * x) / 6)), color: 'violet', width: 3 }, { f: (x) => { const c = [0, 1, 3, 6, 9, 11, 12], k = Math.min(5, Math.floor(x)); return (6 * (c[k] + (c[k + 1] - c[k]) * (x - k))) / 12; }, color: 'amber', width: 2, dash: true }, { f: () => 4, color: 'teal', dash: true }],
                points: [{ x: (p) => p.t, y: (p) => 3 * (1 - Math.cos((Math.PI * p.t) / 6)), color: 'coral' }],
                readout: (p) => { const c = [0, 1, 3, 6, 9, 11, 12], k = Math.min(5, Math.floor(p.t)), r12 = (6 * (c[k] + (c[k + 1] - c[k]) * (p.t - k))) / 12; return `sine tide **${(3 * (1 - Math.cos((Math.PI * p.t) / 6))).toFixed(2)} m** · rule of twelfths ${r12.toFixed(2)} m`; },
                goal: (p) => Math.abs(3 * (1 - Math.cos((Math.PI * p.t) / 6)) - 4) < 0.03,
                hint: 'After 3 hours the tide is half way (3 m). You need another metre, during the fast fourth hour.',
                solution: { t: 3.65 },
              },
              explain: r`About **3 h 39 min** after low water. The rule of twelfths gives almost the same: 3 m after three hours, then $\frac{3}{12} \times 6 = 1.5$ m during the fourth hour, so the extra metre takes two-thirds of that hour: 3 h 40 min.`,
            },
            {
              type: 'mcq',
              title: 'Why it works',
              prompt: r`For a sine-shaped tide, the fractions of the range risen in each hour are about $0.067, 0.183, 0.250, 0.250, 0.183, 0.067$. How do these compare with the rule of twelfths ($0.083, 0.167, 0.250, \dots$)?`,
              choices: [
                { t: 'Very close: the rule slightly overestimates the first hour and underestimates the second', ok: true },
                { t: 'The rule is exact', why: r`$\frac{1}{12} = 0.083$ versus the true $0.067$: close, but not exact.` },
                { t: 'The rule is badly wrong in the middle hours', why: r`In the middle hours both give $0.25$.` },
              ],
              explain: r`The rule replaces $\frac12(1 - \cos)$ by simple fractions that are easy to add in your head, accurate to within about 2% of the range. Real tides are distorted by coastlines and shallow water, so harbour tide tables matter more than the exact shape.`,
            },
            {
              type: 'numeric',
              title: 'Tomorrow’s tide',
              prompt: r`The Moon returns to the same position in the sky about every 24 h 50 min, and most coasts have two high tides in that time. If high water is at 10:00 today, roughly how many **minutes** later will it be tomorrow?`,
              unit: 'min',
              answer: 50,
              tol: 2,
              explain: r`The tidal day is about 24 h 50 min, so the same tide arrives about **50 minutes** later each day: tomorrow’s morning high water is around 10:50, and successive high waters are about 12 h 25 min apart.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Two hours in',
              prompt: r`The tidal range is 4.8 m. Using the rule of twelfths, how high has the tide risen above low water **two hours** after low water?`,
              unit: 'm',
              answer: 1.2,
              tol: 0.01,
              wrong: [{ v: 0.8, why: r`That’s only the second hour. Add the first hour as well: $\frac{1 + 2}{12}$.` }, { v: 1.6, why: r`After two hours it’s $\frac{1 + 2}{12} = \frac14$ of the range.` }],
              explain: r`$\frac{1 + 2}{12} \times 4.8 = \frac14 \times 4.8 = 1.2$ m. After three hours it would be half the range, 2.4 m.`,
            },
          ],
          recap: [
            'Tides rise 1, 2, 3, 3, 2, 1 twelfths of the range in successive hours.',
            'The rule approximates a sine curve to within a few percent.',
            'High water comes about 50 minutes later each day.',
          ],
        },
      ],
    },
  ],
};
