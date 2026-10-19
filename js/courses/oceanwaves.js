import { fix } from '../lib/svg.js';
const r = String.raw;
const G = 9.8;
const speed = (lam, d) => Math.sqrt(((G * lam) / (2 * Math.PI)) * Math.tanh((2 * Math.PI * d) / lam));
const hours = (d) => 1.06e7 / Math.sqrt(G * d) / 3600; // 10,600 km crossing

const D = Math.PI / 180;
// deep-water group speed for period T (s)
const cg = (T) => (G * T) / (4 * Math.PI);
const swellDelay = (km) => (km * 1000) * (1 / cg(12) - 1 / cg(16)) / 3600; // hours between 16 s and 12 s swell
// wave power per metre of crest (kW/m), significant height H (m), period T (s)
const wavePower = (H, T) => (1025 * G * G * H * H * T) / (64 * Math.PI) / 1000;
// refraction of a crest from 20 m deep water at 40° into depth d2
const refrAngle = (d2) => Math.asin(Math.sqrt(d2 / 20) * Math.sin(40 * D)) / D;

export default {
  id: 'oceanwaves',
  subject: 'physics',
  title: 'Ocean Waves & Tsunamis',
  level: 'Intermediate',
  cover: 'oceanwaves',
  tagline: 'Why tsunamis cross oceans at jet speed, why waves break and line up with beaches, how swell reveals distant storms, and how much power waves carry.',
  description: r`Ocean waves carry energy across thousands of kilometres while the water itself barely moves. Learn how water particles circle as a wave passes, why wave speed depends on depth, how a tsunami a metre high in mid-ocean becomes a wall of water at the coast, why waves bend towards beaches, what makes rogue waves, how swell arrival times pinpoint a storm thousands of kilometres away, and how much power waves carry.`,
  prereq: 'Waves & Oscillations',
  chapters: [
    {
      title: 'How Water Waves Move',
      summary: 'Orbits and speeds.',
      lessons: [
        {
          id: 'orbits',
          title: 'Circles in the Water',
          summary: 'Energy moves, water doesn’t',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Bobbing, not travelling',
              body: r`Watch a floating gull as waves pass: it rises and falls, moving slightly forward on each crest and back in each trough, but it hardly travels anywhere. In deep water, each bit of water moves in a **circle** as a wave passes. The wave's **energy** moves forward; the water mostly stays put.

The circles shrink rapidly with depth: about half a wavelength down, the motion is almost gone. That's why submarines ride out storms by diving.`,
            },
            {
              type: 'mcq',
              title: 'Deep down',
              prompt: r`Ocean swells have wavelengths of about 100 m. Roughly how deep does their water motion reach?`,
              choices: [
                { t: 'About 50 m: below half a wavelength, the water barely moves', ok: true },
                { t: 'All the way to the sea floor, kilometres down', why: 'In deep water, the circular motion shrinks exponentially with depth and dies out by about half a wavelength.' },
                { t: 'Only the top few centimetres', why: 'The motion extends much deeper: to about half a wavelength.' },
              ],
              explain: r`At a depth of half a wavelength, the circles are only about 4% of their size at the surface ($e^{-\pi} \approx 0.04$). Water is "deep" for a wave when the depth exceeds about half its wavelength, which matters greatly for speed, as we'll see.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch the water',
              body: r`Each dot is a parcel of water under a passing wave. Move time forward and follow one dot.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 20, ymin: -7, ymax: 2.2, grid: false, axes: false, maxWidth: 620,
                params: { t: { min: 0, max: 2, step: 0.02, value: 0, label: 'time (periods)', color: 'blue', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => {
                  const k = (2 * Math.PI) / 10, a = 1.2, ph = 2 * Math.PI * p.t, els = [];
                  const surf = [];
                  for (let x = 0; x <= 20; x += 0.1) surf.push(`${surf.length ? 'L' : 'M'}${plot.X(x)} ${plot.Y(a * Math.cos(k * x - ph))}`);
                  els.push(s('path', { d: `${surf.join('')} L${plot.X(20)} ${plot.Y(-7)} L${plot.X(0)} ${plot.Y(-7)} Z`, class: 'fl-blue-soft' }));
                  els.push(s('path', { d: surf.join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }));
                  for (const z0 of [0, -1.5, -3, -4.5, -6]) for (let x0 = 1; x0 < 20; x0 += 2) {
                    const r0 = a * Math.exp(k * z0), th = k * x0 - ph;
                    if (x0 === 5) els.push(s('circle', { cx: plot.X(x0), cy: plot.Y(z0), r: (plot.X(r0) - plot.X(0)), fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
                    els.push(s('circle', { cx: plot.X(x0 - r0 * Math.sin(th)), cy: plot.Y(z0 + r0 * Math.cos(th)), r: x0 === 5 ? 6 : 4, class: x0 === 5 ? 'fl-coral' : 'fl-ink' }));
                  }
                  return els;
                },
              },
              after: r`The crests march to the right, but each parcel just goes round its own circle, returning to where it started after each period. The circles shrink quickly with depth: the bottom row barely moves.`,
            },
            {
              type: 'numeric',
              title: 'A quarter-wavelength down',
              prompt: r`In deep water, circle size shrinks as $e^{-2\pi z/\lambda}$ at depth $z$. At a quarter of a wavelength down, what percentage of the surface circle size is left? (Nearest whole percent.)`,
              unit: '%',
              answer: Math.round(100 * Math.exp(-Math.PI / 2)),
              tol: 0.6,
              wrong: [{ v: 75, why: r`It shrinks exponentially, not linearly: $e^{-\pi/2}$.` }, { v: 4, why: r`That's at half a wavelength, $e^{-\pi}$.` }],
              explain: r`$e^{-\pi/2} \approx 0.21$: just 21% at a quarter wavelength, and about 4% at half a wavelength.`,
            },
            {
              type: 'numeric',
              title: 'Riding out a storm',
              prompt: r`Under deep-water waves, the orbits shrink by a factor $e^{-2\pi z/\lambda}$ at depth $z$. A submarine wants the motion from 100 m storm waves to be just **1%** of its surface value. How deep must it go, in metres? (Nearest metre.)`,
              unit: 'm',
              answer: (100 * Math.log(100)) / (2 * Math.PI),
              tol: 0.6,
              wrong: [{ v: 50, why: r`At half a wavelength the motion is still about 4% of the surface value. Solve $e^{-2\pi z/100} = 0.01$.` }],
              explain: r`$e^{-2\pi z/100} = 0.01$ gives $z = \frac{100 \ln 100}{2\pi} \approx \frac{100 \times 4.61}{6.28} \approx 73$ m. Each extra 37 m (about $\frac{\lambda}{2.7}$) cuts the motion tenfold, which is why submarines simply dive to escape storms, and why swimmers can duck under breakers.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Swell timing',
              prompt: r`For deep-water waves, the period and wavelength are linked by $T = \sqrt{\frac{2\pi\lambda}{g}}$. What's the period of a swell with a 100 m wavelength? (1 decimal place.)`,
              unit: 's',
              answer: Math.sqrt((2 * Math.PI * 100) / G),
              tol: 0.05,
              wrong: [{ v: 64.1, tol: 0.2, why: 'Take the square root.' }],
              explain: r`$\sqrt{\frac{2\pi \times 100}{9.8}} \approx 8.0$ s. Time the gaps between breakers on a beach, and you can work out the wavelength of the swell out at sea: $\lambda = \frac{gT^2}{2\pi} \approx 1.56\,T^2$ metres.`,
            },
          ],
          recap: [
            'Water particles move in circles as a wave passes; energy travels, water doesn’t.',
            'The motion dies out by about half a wavelength down.',
            'Water counts as “deep” when depth exceeds half the wavelength.',
            r`Deep-water period: $T = \sqrt{2\pi\lambda/g}$.`,
          ],
        },
        {
          id: 'speed',
          title: 'Deep and Shallow',
          summary: 'Speed depends on depth',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Two regimes',
              body: r`Water waves are unusual: their speed depends on wavelength **and** depth. The full formula is $v = \sqrt{\frac{g\lambda}{2\pi}\tanh\frac{2\pi d}{\lambda}}$, but it has two simple limits:

- **Deep water** ($d \gg \lambda$): $v = \sqrt{\dfrac{g\lambda}{2\pi}}$. Longer waves travel faster.
- **Shallow water** ($d \ll \lambda$): $v = \sqrt{g d}$. All waves travel at the same speed, set only by the depth.

Change the wavelength.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 150, ymin: 0, ymax: 28, grid: 25, gridY: 5, height: 280, padL: 48,
                axes: { xlabel: 'depth (m)', ylabel: 'speed (m/s)' },
                params: { lam: { min: 20, max: 400, step: 10, value: 100, label: 'wavelength', color: 'violet', format: (v) => `${v} m` } },
                curves: [
                  { f: (d) => Math.sqrt(G * d), color: 'teal', dash: true, width: 2 },
                  { f: (d, p) => Math.sqrt((G * p.lam) / (2 * Math.PI)), color: 'coral', dash: true, width: 2 },
                  { f: (d, p) => speed(p.lam, d), color: 'violet', width: 3.5 },
                ],
                readout: (p) => r`deep-water speed $\sqrt{g\lambda/2\pi} = ${Math.sqrt((G * p.lam) / (2 * Math.PI)).toFixed(1)}$ m/s; $\;$ the wave "feels" the bottom below about ${(p.lam / 2).toFixed(0)} m`,
              },
              after: r`The violet curve follows the shallow-water formula (teal) for small depths, then levels off at the deep-water speed (coral) once the depth passes about half a wavelength. Long ocean swells from distant storms outrun shorter waves, so surfers see the biggest, longest swells arrive first.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Crossing the Pacific',
              prompt: r`Tsunamis have wavelengths of 100–500 km, so even the deep ocean is "shallow" for them: $v = \sqrt{gd}$. The 1960 Chilean tsunami crossed about 10,600 km of Pacific to Hawaii in about 15 hours. Find the average ocean depth that gives this travel time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6000, ymin: 0, ymax: 46, grid: 1000, gridY: 10, height: 280, padL: 48,
                axes: { xlabel: 'ocean depth (m)', ylabel: 'hours' },
                params: { d: { min: 500, max: 6000, step: 100, value: 1500, label: 'average depth', color: 'blue', format: (v) => `${v} m` } },
                curves: [{ f: (d) => hours(d), from: () => 300, color: 'blue', width: 3 }, { f: () => 15, color: 'coral', dash: true, width: 2 }],
                points: [{ x: (p) => p.d, y: (p) => hours(p.d), color: 'blue' }],
                readout: (p) => r`$v = \sqrt{9.8 \times ${p.d}} = ${Math.sqrt(G * p.d).toFixed(0)}$ m/s $= ${(Math.sqrt(G * p.d) * 3.6).toFixed(0)}$ km/h $\;\Rightarrow\;$ ${hours(p.d).toFixed(1)} hours`,
                goal: (p) => Math.abs(hours(p.d) - 15) < 0.1,
                hint: r`You need $v = \frac{1.06 \times 10^7 \text{ m}}{15 \times 3600 \text{ s}} \approx 196$ m/s. Then $d = \frac{v^2}{g}$.`,
                solution: { d: 3900 },
              },
              explain: r`An average depth of about **3900 m** gives $\sqrt{9.8 \times 3900} \approx 196$ m/s, around 700 km/h: as fast as a jet airliner. Warning centres use exactly this calculation to predict when a tsunami will reach each coastline.`,
            },
            {
              type: 'numeric',
              title: 'Speed from period',
              prompt: r`In deep water, a wave's speed can also be written $v = \frac{gT}{2\pi}$. How fast does a 10-second swell travel? (1 decimal place.)`,
              unit: 'm/s',
              answer: (G * 10) / (2 * Math.PI),
              tol: 0.05,
              wrong: [{ v: 98, why: r`Divide by $2\pi$.` }],
              explain: r`$\frac{9.8 \times 10}{2\pi} \approx 15.6$ m/s, about 56 km/h. Period is easy to measure from a beach or a buoy, so forecasters use this form.`,
            },
            {
              type: 'numeric',
              title: 'How long are swells?',
              prompt: r`In deep water, a wave of period $T$ has wavelength $\lambda = \frac{gT^2}{2\pi}$. How long are 10-second ocean swells, in metres? (Nearest metre.)`,
              unit: 'm',
              answer: 9.8 * 100 / (2 * Math.PI),
              tol: 1,
              explain: r`$\frac{9.8 \times 100}{2\pi} \approx 156$ m between crests, travelling at about 15.6 m/s. Long swells like these can cross whole oceans after a distant storm, arriving as perfectly regular surf.`,
            },
            {
              type: 'numeric',
              title: 'A tsunami’s speed',
              prompt: r`A tsunami is a shallow-water wave even in the deep ocean, travelling at $\sqrt{gh}$. How fast does it cross ocean 4,000 m deep, in km/h? (Nearest 10.)`,
              unit: 'km/h',
              answer: Math.sqrt(9.8 * 4000) * 3.6,
              tol: 5,
              explain: r`$\sqrt{9.8 \times 4000} \approx 198$ m/s $\approx 710$ km/h, as fast as a jet airliner. It can cross the Pacific in less than a day.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Shallow enough?',
              prompt: r`A wave with a 40 m wavelength enters a harbour 2 m deep. Is it a shallow-water wave there ($d < \lambda/20$ is a common rule)? If so, what's its speed? (1 decimal place.)`,
              unit: 'm/s',
              answer: Math.sqrt(G * 2),
              tol: 0.05,
              wrong: [{ v: Math.sqrt((G * 40) / (2 * Math.PI)), tol: 0.05, why: 'That’s the deep-water speed. At 2 m (exactly λ/20), the shallow formula applies.' }],
              explain: r`$\frac{40}{20} = 2$ m, so it's (just) shallow: $v = \sqrt{9.8 \times 2} \approx 4.4$ m/s, much slower than its deep-water speed of 7.9 m/s.`,
            },
          ],
          recap: [
            r`Deep water: $v = \sqrt{g\lambda/2\pi}$. Shallow water: $v = \sqrt{gd}$.`,
            'Tsunamis are shallow-water waves even in the deep ocean.',
            'In 4 km of water, a tsunami travels at about 700 km/h.',
          ],
        },
      ],
    },
    {
      title: 'Waves Meet the Shore',
      summary: 'Shoaling, refraction and extremes.',
      lessons: [
        {
          id: 'shoaling',
          title: 'Growing and Breaking',
          summary: 'Why tsunamis tower at the coast',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Slowing down, piling up',
              body: r`As a wave moves into shallower water, it slows down. The back of the wave catches up with the front, the wavelength shortens, and the same energy is squeezed into a smaller volume of water, so the wave grows **taller**. This is **shoaling**. For shallow-water waves, the height grows roughly as
$$H \propto d^{-1/4}$$
(Green's law). Eventually, when the height reaches about 0.8 of the depth, the crest outruns the base and the wave **breaks**.`,
            },
            {
              type: 'numeric',
              title: 'A tsunami arrives',
              prompt: r`A tsunami is 1 m high in water 4000 m deep. Using Green's law, $H \propto d^{-1/4}$, how high is it when it reaches water 10 m deep? (1 decimal place.)`,
              unit: 'm',
              answer: 400 ** 0.25,
              tol: 0.06,
              wrong: [{ v: 400, why: r`Depth falls by 400 times, but height grows only as the fourth root: $400^{1/4}$.` }, { v: 20, why: r`That's $\sqrt{400}$. Green's law uses the fourth root.` }],
              explain: r`$H = 1 \times \left(\frac{4000}{10}\right)^{1/4} = 400^{1/4} \approx 4.5$ m, and it keeps growing in even shallower water. A ship at sea might not even notice a tsunami passing beneath it, because its slope is so gentle over a 200 km wavelength. At the coast it becomes devastating, partly because the whole long wave keeps pouring ashore for many minutes.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Five metres high',
              prompt: r`That 1 m tsunami (in 4000 m of water) heads for the coast. Drag along the curve to find the depth at which Green's law makes it **5 m** high.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 10, grid: 5, gridY: 1, height: 260, axes: { xlabel: 'water depth (m)', ylabel: 'tsunami height (m)' },
                params: { d: { min: 1, max: 50, step: 0.1, value: 30, slider: false } },
                curves: [{ f: (d) => (4000 / d) ** 0.25, from: 0.3, color: 'blue', width: 3 }, { f: () => 5, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.d, y: (p) => (4000 / p.d) ** 0.25, drag: { x: 'd' }, color: 'coral' }],
                readout: (p) => r`depth $${p.d.toFixed(1)}$ m: height $\left(\frac{4000}{${p.d.toFixed(1)}}\right)^{1/4} = ${((4000 / p.d) ** 0.25).toFixed(2)}$ m`,
                goal: (p) => Math.abs((4000 / p.d) ** 0.25 - 5) < 0.05,
                hint: r`Solve $\left(\frac{4000}{d}\right)^{1/4} = 5$: $d = \frac{4000}{5^4}$.`,
                solution: { d: 6.4 },
              },
              explain: r`$d = \frac{4000}{625} = 6.4$ m. The fourth root makes growth slow at first, then rapid in the last few metres of depth, right where people are.`,
            },
            {
              type: 'numeric',
              title: 'Where it breaks',
              prompt: r`A wave 2 m high approaches a gently sloping beach. Using the rule that waves break when height ≈ 0.8 × depth, at what depth does it break?`,
              unit: 'm',
              answer: 2.5,
              wrong: [{ v: 1.6, why: 'That’s 0.8 × 2. You need depth = height ÷ 0.8.' }],
              explain: r`$d = \frac{2}{0.8} = 2.5$ m. Surfers look for where the waves start breaking to judge the depth, and sandbars show up as lines of early-breaking waves.`,
            },
            {
              type: 'numeric',
              title: 'Green’s law',
              prompt: r`As a long wave moves into shallower water, its height grows like $h^{-1/4}$ (Green’s law). By what factor does a wave grow moving from water 3,000 m deep to water 30 m deep? (2 decimal places.)`,
              answer: Math.pow(100, 0.25),
              tol: 0.01,
              wrong: [{ v: 100, tol: 0.5, why: 'That’s the depth ratio itself. Green’s law takes its fourth root.' }, { v: 10, tol: 0.05, why: r`That’s the square root of the depth ratio. Green’s law uses the fourth root: $100^{1/4}$.` }],
              explain: r`$\left(\frac{3000}{30}\right)^{1/4} = 100^{1/4} = \sqrt{10} \approx 3.16$. A hundredfold drop in depth only about triples the height: the fourth root tames big ratios, which is why most of the growth happens in the last few metres.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The sea draws back',
              prompt: r`Before some tsunamis, the sea suddenly retreats, exposing the sea floor. What does that mean?`,
              choices: [
                { t: 'The trough of the wave has arrived first; the crest will follow within minutes, so people should head for high ground immediately', ok: true },
                { t: 'The danger has passed', why: 'It’s the opposite: the crest is on its way.' },
                { t: 'The tide has gone out early', why: 'Tides take hours. A sudden retreat over minutes is a tsunami warning sign.' },
              ],
              explain: r`Tsunamis can arrive trough first. In 2004, a 10-year-old British girl, Tilly Smith, recognised the receding sea from a geography lesson and warned people on a beach in Thailand, saving around a hundred lives.`,
            },
          ],
          recap: [
            'Waves slow and grow taller as water gets shallower (shoaling).',
            r`Green's law: $H \propto d^{-1/4}$.`,
            'Waves break when their height reaches about 0.8 of the depth.',
          ],
        },
        {
          id: 'refraction',
          title: 'Bending Towards the Beach',
          summary: 'Wave refraction',
          icon: 'right',
          steps: [
            {
              type: 'mcq',
              title: 'Lined up with the shore',
              prompt: r`Out at sea, swells may approach a beach at an angle. Yet by the time they break, the crests are almost parallel to the shoreline. Why?`,
              choices: [
                { t: 'The part of each crest in shallower water slows down first, so the crest swings round to face the shore', ok: true },
                { t: 'The wind always blows straight at the beach', why: 'Swells can come from storms far away, at any angle. The turning happens near the shore.' },
                { t: 'Waves reflect off the sea floor', why: 'It’s refraction, not reflection: different parts of the crest move at different speeds.' },
              ],
              explain: r`Since speed depends on depth, the end of a crest in shallow water lags while the end in deeper water keeps going, so the crest pivots, just like light bending as it enters glass. This is **refraction**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Turning a crest',
              prompt: r`Wave rays obey Snell's law: $\frac{\sin\theta_1}{v_1} = \frac{\sin\theta_2}{v_2}$, with $v = \sqrt{gd}$. A swell travels from water 20 m deep at 40° to the depth contour. Choose the shallower depth so that it turns to **20°**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 6, ymin: -4.5, ymax: 4.5, grid: false, axes: false, maxWidth: 440,
                params: { d: { min: 1, max: 20, step: 0.1, value: 12, label: 'shallow depth', color: 'teal', format: (v) => `${v.toFixed(1)} m` } },
                extra: ({ plot, p, s, arrow }) => {
                  const a2 = refrAngle(p.d) * D, a1 = 40 * D, L = 5;
                  return [
                    s('rect', { x: plot.X(-6), y: plot.Y(4.5), width: plot.X(0) - plot.X(-6), height: plot.Y(-4.5) - plot.Y(4.5), class: 'fl-blue-soft' }),
                    s('rect', { x: plot.X(0), y: plot.Y(4.5), width: plot.X(6) - plot.X(0), height: plot.Y(-4.5) - plot.Y(4.5), class: 'fl-teal-soft' }),
                    s('line', { x1: plot.X(-6), x2: plot.X(6), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '4 4' }),
                    arrow(plot.X(-L * Math.cos(a1)), plot.Y(-L * Math.sin(a1)), plot.X(0), plot.Y(0), { color: 'var(--blue)', width: 4, head: 12 }),
                    arrow(plot.X(0), plot.Y(0), plot.X(L * Math.cos(a2)), plot.Y(L * Math.sin(a2)), { color: 'var(--teal)', width: 4, head: 12 }),
                    s('text', { x: plot.X(-5.6), y: plot.Y(4), class: 'lbl', text: 'deep (20 m)' }),
                    s('text', { x: plot.X(0.4), y: plot.Y(4), class: 'lbl', text: `shallow (${p.d.toFixed(1)} m)` }),
                  ];
                },
                readout: (p) => r`ray angle to the contour's normal: $40°$ → $${refrAngle(p.d).toFixed(1)}°$`,
                goal: (p) => Math.abs(refrAngle(p.d) - 20) < 0.15,
                hint: r`You need $\frac{v_2}{v_1} = \frac{\sin 20°}{\sin 40°} \approx 0.53$, and $\frac{v_2}{v_1} = \sqrt{\frac{d_2}{20}}$.`,
                solution: { d: 5.7 },
              },
              explain: r`$\sqrt{d_2/20} = 0.532$ gives $d_2 \approx 5.7$ m. As the depth keeps decreasing towards the beach, the angle keeps shrinking, so the rays end up nearly perpendicular to the shore: the crests line up with the beach.`,
            },
            {
              type: 'mcq',
              title: 'Headlands and bays',
              prompt: r`A rocky headland sticks out into the sea between two sandy bays. Where does refraction focus the waves' energy?`,
              choices: [
                { t: 'On the headland, where crests bend inward from both sides', ok: true },
                { t: 'In the bays', why: 'In bays, refraction spreads the crests out, weakening the waves. That’s why bays are calmer and collect sand.' },
                { t: 'Evenly along the whole coast', why: 'Refraction concentrates energy where the shallow water sticks out: at headlands.' },
              ],
              explain: r`Shallow water extends out from a headland, so crests slow there first and wrap around it, converging their energy on the point. Over centuries, headlands erode while bays fill with sand, gradually straightening the coastline.`,
            },
            {
              type: 'explain',
              title: 'Rogue waves',
              body: r`On 1 January 1995, sensors on the Draupner oil platform in the North Sea recorded a single wave 25.6 m from trough to crest, in a sea where the other large waves were about 12 m. Long dismissed as sailors' tales, **rogue waves** (more than twice the height of the surrounding large waves) are now known to be real. They can arise when wave trains with different speeds and directions overlap and briefly add up, and from nonlinear effects that focus wave energy.`,
            },
            {
              type: 'numeric',
              title: 'Adding up',
              prompt: r`Three wave trains, with heights of 6 m, 5 m and 4 m, happen to line up crest to crest at one spot. How high is the combined wave there?`,
              unit: 'm',
              answer: 15,
              wrong: [{ v: 6, why: 'When crests coincide, the heights add (superposition).' }, { v: Math.sqrt(77), tol: 0.1, why: 'That’s how heights combine on average, for random phases. Crest-to-crest, they simply add.' }],
              explain: r`$6 + 5 + 4 = 15$ m. Linear superposition alone can create brief giants when trains line up, and nonlinear focusing makes them more common than this simple picture suggests.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'How rare?',
              prompt: r`Ships report rogue waves more often than simple statistics predicted. Which helps explain this?`,
              choices: [
                { t: 'Nonlinear effects let a wave "steal" energy from its neighbours, focusing it into one giant', ok: true },
                { t: 'Sailors exaggerate', why: 'Instruments like the Draupner sensor and satellites have confirmed them.' },
                { t: 'Rogue waves only occur in shallow water', why: 'Many have been recorded in deep open ocean.' },
              ],
              explain: r`In deep water, a "modulational instability" (the Benjamin–Feir instability) can cause a group of waves to concentrate its energy into a single large wave. Satellite surveys in the early 2000s found many waves over 25 m across the world's oceans.`,
            },
          ],
          recap: [
            'Refraction bends wave crests to run parallel to the shore.',
            'Headlands focus wave energy; bays spread it out.',
            'Rogue waves, more than twice the height of their neighbours, are real.',
          ],
        },
      ],
    },
    {
      title: 'Swell and Power',
      summary: 'Energy across oceans.',
      lessons: [
        {
          id: 'swell',
          title: 'Swell from Distant Storms',
          summary: 'Group speed and forecasting',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Wave groups',
              body: r`Waves travel in **groups**: sets of larger waves with calmer gaps between them. Surfers wait for the sets. In deep water, the individual crests move at the phase speed $v = \frac{gT}{2\pi}$, but the **group**, and the energy, moves at only **half** that:
$$c_g = \frac{gT}{4\pi}$$
Watch a group closely and you'll see crests appear at its back, move forward through it, and fade out at its front.`,
            },
            { /*anim:oceanwaves*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Crests outrun their group',
              body: r`A group of deep-water waves travelling to the right. Follow the {coral:marked crest} and the {blue:centre of the group}.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: -1.4, ymax: 1.4, grid: false, axes: false, height: 240,
                animate: { param: 't', speed: 9, max: 125, autoplay: true },
                curves: [
                  { f: (x, p) => { const k = 1, w = 1, cg = 0.5, xc = 20 + cg * p.t; return Math.exp(-(((x - xc) / 10) ** 2)) * Math.cos(k * x - w * p.t); }, color: 'blue', width: 2.5, n: 700 },
                  { f: (x, p) => Math.exp(-(((x - 20 - 0.5 * p.t) / 10) ** 2)), color: 'muted', dash: true, width: 1.5 },
                ],
                extra: ({ plot, p, s }) => {
                  const cg = 0.5, xc = 20 + cg * p.t, D = 30 / cg, c0 = Math.floor(p.t / D) * D;
                  // follow one crest from the back of the group (x − ct = 2πm) until it passes the front
                  const m = Math.ceil((20 + cg * c0 - 15 - c0) / (2 * Math.PI)), x = 2 * Math.PI * m + p.t;
                  const y = Math.exp(-(((x - xc) / 10) ** 2)) * Math.cos(x - p.t);
                  return [
                    s('path', { d: `M${plot.X(xc)} ${plot.Y(1.32)}l-7 -10h14z`, class: 'fl-blue' }),
                    s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 7, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 }),
                  ];
                },
                readout: () => `the crest moves at the wave speed $v$ · the group moves at only $\\tfrac12 v$`,
              },
              after: r`Each crest is born at the back of the group, grows as it moves through the middle, and fades away at the front: it travels **twice as fast** as the group. In deep water, the group speed is exactly half the speed of the individual waves. The energy travels with the group, so a swell's arrival time (and the "How far away is the storm?" calculation) uses the group speed, not the crest speed.`,
            },
            {
              type: 'numeric',
              title: 'A 14-second swell',
              prompt: r`How fast does the energy of a 14-second swell travel across deep water? (1 decimal place.)`,
              unit: 'm/s',
              answer: cg(14),
              tol: 0.05,
              wrong: [{ v: (G * 14) / (2 * Math.PI), tol: 0.05, why: 'That’s the phase speed of the crests. The energy moves at half of it.' }],
              explain: r`$c_g = \frac{9.8 \times 14}{4\pi} \approx 10.9$ m/s, about 39 km/h, or roughly 940 km per day.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How far away is the storm?',
              prompt: r`A distant storm sends out swells of all periods at once. At a beach, 16-second swell arrives first, and 12-second swell arrives **10 hours later**. Find the storm's distance.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3000, ymin: 0, ymax: 25, grid: 500, gridY: 5, height: 260, axes: { xlabel: 'distance to storm (km)', ylabel: 'delay (hours)' },
                params: { D: { min: 100, max: 3000, step: 10, value: 600, slider: false } },
                curves: [{ f: (km) => swellDelay(km), color: 'violet', width: 3 }, { f: () => 10, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.D, y: (p) => swellDelay(p.D), drag: { x: 'D' }, color: 'coral' }],
                readout: (p) => r`storm ${p.D} km away: 16 s swell takes $${((p.D * 1000) / cg(16) / 3600).toFixed(1)}$ h, 12 s swell $${((p.D * 1000) / cg(12) / 3600).toFixed(1)}$ h; delay $${swellDelay(p.D).toFixed(1)}$ h`,
                goal: (p) => Math.abs(swellDelay(p.D) - 10) < 0.1,
                hint: r`Delay $= D\left(\frac{1}{c_g(12)} - \frac{1}{c_g(16)}\right)$.`,
                solution: { D: 1350 },
              },
              explain: r`About **1,350 km**. The longer the gap between the arrival of long and short periods, the farther away the storm. In the 1960s, oceanographer Walter Munk tracked swell from storms near Antarctica all the way to Alaska, more than 10,000 km.`,
            },
            {
              type: 'mcq',
              title: 'Sorted by size',
              prompt: r`Why does swell from a distant storm arrive so neat and regular, while waves near the storm are a chaotic mess?`,
              choices: [
                { t: 'Different periods travel at different speeds, so over long distances the mixture sorts itself out by period', ok: true },
                { t: 'The ocean filters out all but one wave', why: 'Nothing is filtered: the periods separate because they travel at different speeds.' },
                { t: 'The wind smooths them on the way', why: 'Far from the storm, there’s often no wind at all. Dispersion does the sorting.' },
              ],
              explain: r`Waves whose speed depends on wavelength are **dispersive**. Like light through a prism, the jumble from the storm separates into orderly trains, long periods first.`,
            },
            {
              type: 'numeric',
              title: 'Period from wavelength',
              prompt: r`In deep water the period of a wave of wavelength $\lambda$ is $T = \sqrt{\frac{2\pi\lambda}{g}}$. What is the period of swell 156 m long, in seconds? (Nearest whole number.)`,
              unit: 's',
              answer: Math.sqrt(2 * Math.PI * 156 / 9.81),
              tol: 0.3,
              explain: r`$T = \sqrt{\frac{2\pi \times 156}{9.81}} \approx 10$ s. Long waves have long periods and travel fast, which is why they arrive first from a distant storm.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Across an ocean',
              prompt: r`How many days does the energy of a 20-second swell take to travel 10,000 km? (1 decimal place.)`,
              unit: 'days',
              answer: 1e7 / cg(20) / 86400,
              tol: 0.06,
              wrong: [{ v: 1e7 / ((G * 20) / (2 * Math.PI)) / 86400, tol: 0.06, why: 'Use the group speed (half the phase speed).' }],
              explain: r`$c_g = \frac{9.8 \times 20}{4\pi} \approx 15.6$ m/s, so $\frac{10^7}{15.6} \approx 641{,}000$ s $\approx 7.4$ days. Surf forecasters can predict a big swell a week before it arrives.`,
            },
          ],
          recap: [
            r`In deep water, wave energy travels at the group speed $c_g = gT/4\pi$, half the crest speed.`,
            'Dispersion sorts storm waves by period, longest first.',
            'Arrival-time gaps reveal a storm’s distance.',
          ],
        },
        {
          id: 'power',
          title: 'Wave Power',
          summary: 'How much energy do waves carry?',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Energy in a wave',
              body: r`A wave's energy grows as the **square** of its height, and the energy moves at the group speed, which grows with the period. In deep water, the power carried per metre of wave crest is about
$$P \approx 0.49\, H^2 T \text{ kW per metre}$$
with the wave height $H$ in metres (the "significant height", typical of the largest third) and the period $T$ in seconds.`,
            },
            {
              type: 'numeric',
              title: 'A typical Atlantic swell',
              prompt: r`Waves 3 m high with a 10 s period arrive on an Atlantic coast. How many kilowatts do they carry per metre of coastline? (Nearest whole number.)`,
              unit: 'kW/m',
              answer: Math.round(wavePower(3, 10)),
              tol: 1,
              wrong: [{ v: 15, why: r`Height is squared: $0.49 \times 3^2 \times 10$.` }],
              explain: r`$0.49 \times 9 \times 10 \approx 44$ kW per metre: every metre of beach receives as much power as a few dozen electric kettles running nonstop.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Thirty kilowatts',
              prompt: r`A wave-energy machine needs about 30 kW per metre to be worthwhile. With a 10-second period, drag to find the wave height that delivers it.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5, ymin: 0, ymax: 120, grid: 0.5, gridY: 20, height: 260, padL: 48, axes: { xlabel: 'wave height H (m)', ylabel: 'power (kW/m)' },
                params: { H: { min: 0.5, max: 5, step: 0.05, value: 1, slider: false } },
                curves: [{ f: (H) => wavePower(H, 10), color: 'violet', width: 3 }, { f: () => 30, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.H, y: (p) => wavePower(p.H, 10), drag: { x: 'H' }, color: 'coral' }],
                readout: (p) => r`$H = ${p.H.toFixed(2)}$ m: $P \approx ${wavePower(p.H, 10).toFixed(1)}$ kW/m`,
                goal: (p) => Math.abs(wavePower(p.H, 10) - 30) < 0.7,
                hint: r`Solve $0.49 H^2 \times 10 = 30$.`,
                solution: { H: 2.45 },
              },
              explain: r`$H = \sqrt{\frac{30}{4.9}} \approx 2.5$ m. Because power grows as $H^2$, a calm day with 1 m waves gives only about 5 kW/m, while a 10 m storm sea delivers nearly 500 kW/m.`,
            },
            {
              type: 'numeric',
              title: 'Double the height',
              prompt: r`If the wave height doubles (same period), by what factor does the power increase?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`Power goes as $H^2$.` }, { v: 8, why: r`Only the height changes: $2^2 = 4$.` }],
              explain: r`$2^2 = 4$ times the power. Energy in waves, like energy in a spring, goes as amplitude squared.`,
            },
            {
              type: 'numeric',
              title: 'A bigger swell',
              prompt: r`Deep-water wave power per metre of wave front is roughly $P \approx 0.49\,H^2T$ kW/m, with $H$ in metres and $T$ in seconds. What is it for a 3 m, 12 s swell? (Nearest kW/m.)`,
              unit: 'kW/m',
              answer: 0.49 * 9 * 12,
              tol: 0.6,
              explain: r`$0.49 \times 9 \times 12 \approx 53$ kW/m, enough along a single metre of coast to power dozens of homes. Storm waves can carry over 1 MW per metre.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why so hard?',
              prompt: r`Coasts like western Scotland receive enormous average wave power, yet wave energy supplies almost no electricity. What makes it so difficult?`,
              choices: [
                { t: 'Machines must survive storm waves carrying a hundred times the average power, while still working well in ordinary seas', ok: true },
                { t: 'Waves don’t really carry much energy', why: 'They carry a lot: tens of kW per metre on exposed coasts.' },
                { t: 'Wave energy can’t be converted to electricity', why: 'It can, and many prototypes have done it. Surviving the sea economically is the hard part.' },
              ],
              explain: r`A device designed for 3 m waves must survive 15 m ones, which carry 25 times more power, plus saltwater corrosion and constant fatigue. Many promising prototypes, like the Pelamis "sea snake" tested off Orkney, have struggled to become economical.`,
            },
          ],
          recap: [
            r`Deep-water wave power: $P \approx 0.49 H^2 T$ kW per metre of crest.`,
            'Power grows as height squared: storms carry huge power.',
            'Surviving extreme seas makes wave energy hard to harvest.',
          ],
        },
        {
          id: 'seiches',
          title: 'Seiches & Sloshing',
          summary: 'Lakes and harbours that resonate',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Water in a bathtub',
              body: r`Slide back and forth in a bath and the water starts sloshing from end to end, higher and higher if you keep time with it. Lakes and harbours do the same on a grand scale: these standing waves are called **seiches** (pronounced "saysh").

The slosh is a long wave, so it travels at the shallow-water speed $\sqrt{gh}$. In a closed basin of length $L$, the slowest mode goes there and back, giving **Merian’s formula**:
$$T = \frac{2L}{\sqrt{gh}}.$$`,
            },
            {
              type: 'numeric',
              title: 'Bath time',
              prompt: r`A bath is 1.5 m long with water 0.3 m deep. What is the period of its slowest slosh, in seconds? (2 decimal places; $g = 9.81$ m/s².)`,
              unit: 's',
              answer: (2 * 1.5) / Math.sqrt(9.81 * 0.3),
              tol: 0.02,
              explain: r`$T = \frac{2 \times 1.5}{\sqrt{9.81 \times 0.3}} = \frac{3}{1.72} \approx 1.75$ s. Rock in time with that and the water piles up over the edge.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A dangerous harbour',
              prompt: r`A harbour basin 10 m deep is open to the sea at one end. Its slowest mode has a node at the mouth, so the wave travels **four** lengths per period: $T = \frac{4L}{\sqrt{gh}}$. Long ocean waves with a period of **60 s** keep arriving. Find the basin length that would resonate with them.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: -1.6, ymax: 1.6, grid: false, axes: false, maxWidth: 520, height: 220,
                params: { L: { min: 50, max: 300, step: 0.5, value: 100, label: 'basin length', color: 'blue', format: (v) => `${v.toFixed(1)} m` } },
                curves: [{ f: (x) => Math.cos((Math.PI * x) / 2), color: 'blue', width: 3 }, { f: (x) => -Math.cos((Math.PI * x) / 2), color: 'blue', width: 1.5, dash: true }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.4), y2: plot.Y(1.4), stroke: 'var(--ink)', 'stroke-width': 6 }), s('text', { x: plot.X(0.03), y: plot.Y(1.4), class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: 'harbour wall' }), s('text', { x: plot.X(0.97), y: plot.Y(1.4), 'text-anchor': 'end', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: 'open sea (node)' })],
                readout: (p) => { const T = (4 * p.L) / Math.sqrt(9.81 * 10); return `natural period **${T.toFixed(1)} s** · incoming waves 60 s · ${Math.abs(T - 60) < 0.5 ? '**resonance!**' : Math.abs(T - 60) < 6 ? 'close to resonance' : 'out of tune'}`; },
                goal: (p) => Math.abs((4 * p.L) / Math.sqrt(9.81 * 10) - 60) < 0.3,
                hint: r`$L = \frac{T\sqrt{gh}}{4} = \frac{60 \times 9.9}{4}$ m.`,
                solution: { L: 148.5 },
              },
              explain: r`$L = \frac{60 \times \sqrt{98.1}}{4} \approx 149$ m. A harbour that size would amplify 60-second waves, slamming moored boats around. In Ciutadella, Menorca, such "rissagas" have raised the water by several metres within minutes; harbour designers now check basin shapes against typical long-wave periods.`,
            },
            {
              type: 'numeric',
              title: 'Lake Erie',
              prompt: r`Lake Erie is about 390 km long and on average only 19 m deep. Using Merian’s formula, estimate its slowest seiche period in hours. (1 decimal place.)`,
              unit: 'h',
              answer: (2 * 390000) / Math.sqrt(9.81 * 19) / 3600,
              tol: 0.2,
              explain: r`$T = \frac{780{,}000}{\sqrt{186}} \approx 57{,}000$ s $\approx 15.9$ h. The measured period is about 14 hours (the lake isn’t a uniform box). Strong winds can pile water at one end and set off seiches of 2–3 m, flooding shores.`,
            },
            {
              type: 'mcq',
              title: 'What sets them off?',
              prompt: r`What usually starts a lake seiche?`,
              choices: [
                { t: 'Wind or a change in air pressure pushing water to one end, which then sloshes back', ok: true },
                { t: 'The Moon’s tides', why: 'Tidal forces on a lake are tiny; seiches are mostly driven by weather.' },
                { t: 'Earthquakes only', why: 'Earthquakes can do it, but storms and pressure jumps are far more common causes.' },
              ],
              explain: r`A storm drags water to the downwind end; when it eases, the water rushes back and oscillates at the basin’s natural period. Like a bell, the basin "rings" at its own frequency, whatever struck it.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Bay of Fundy',
              prompt: r`The Bay of Fundy in Canada has the largest tides on Earth, over 15 m. Its natural sloshing period (as a basin open to the ocean) is about 13 hours. Why does that matter?`,
              choices: [
                { t: 'It is close to the 12.4-hour period of the ocean tide, so the tide drives the bay near resonance', ok: true },
                { t: 'A 13-hour period means the bay empties completely twice a day', why: 'It’s the closeness of the two periods that matters: near-resonance amplifies the forcing.' },
                { t: 'It has nothing to do with the tides', why: 'The match between the bay’s period and the tidal period is exactly why its tides are so huge.' },
              ],
              explain: r`The ocean tide pushes on the bay every 12.4 hours, close to its natural 13-hour period, so each push adds to the sloshing, like pushing a swing at the right moment. The result is a tidal range several times larger than in the open Atlantic.`,
            },
          ],
          recap: [
            r`A closed basin sloshes with period $T = 2L/\sqrt{gh}$; a basin open at one end, $4L/\sqrt{gh}$.`,
            'Seiches are standing waves set off by wind, pressure changes or earthquakes.',
            'Resonance with incoming waves or tides can amplify them enormously.',
          ],
        },
      ],
    },
  ],
};
