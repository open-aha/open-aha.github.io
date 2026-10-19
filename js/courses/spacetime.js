import { sig, fix } from '../lib/svg.js';

const r = String.raw;
const STAR = 4; // light-years
const tripTime = (v) => (2 * STAR) / v;
const gamma = (v) => 1 / Math.sqrt(1 - v * v);

// coordinates of an event (x, t) for an observer moving at speed b (units with c = 1)
const boost = (x, t, b) => { const g = 1 / Math.sqrt(1 - b * b); return [g * (x - b * t), g * (t - b * x)]; };
// relativistic rocket at 1 g (in light-years and years), accelerating to the midpoint then decelerating
const G1 = 1.0327; // 9.81 m/s² in ly/yr²
const rocketTrip = (d) => { const th = Math.acosh(1 + (G1 * d) / 2) / G1; return { ship: 2 * th, earth: (2 * Math.sinh(G1 * th)) / G1, vmax: Math.tanh(G1 * th) }; };
// three significant figures: these spans run over many powers of ten (DESIGN.md, Live numbers)
const fmtYears = (y) => sig(y, 3, true);

export default {
  id: 'spacetime',
  subject: 'physics',
  title: 'Spacetime',
  level: 'Advanced',
  cover: 'spacetime',
  tagline: 'Draw space and time together, measure the interval everyone agrees on, resolve the paradoxes and ride a rocket across the galaxy.',
  description: r`Hermann Minkowski showed that Einstein's relativity is really geometry, in a four-dimensional spacetime. Learn to draw spacetime diagrams, find the interval that all observers agree on, map out light cones and cause and effect, add velocities relativistically, see why the travelling twin comes home younger, ride a 1 g rocket to the centre of the galaxy, and fit a ladder into a barn that's too short for it.`,
  prereq: 'Special Relativity',
  chapters: [
    {
      title: 'The Geometry of Spacetime',
      summary: 'Diagrams, intervals and light cones.',
      lessons: [
        {
          id: 'diagrams',
          title: 'Spacetime Diagrams',
          summary: 'Drawing motion through time',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Time goes up',
              body: r`In 1908, Hermann Minkowski declared that "space by itself, and time by itself, are doomed to fade away into mere shadows". In a **spacetime diagram**, time runs up the page and space runs across. Each moment in each place is an **event**, a point on the diagram. An object's history is a line called its **worldline**.

Measure time in years and distance in light-years. Then light travels 1 light-year per year, and its worldline is at exactly $45°$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Worldlines',
              body: r`The dashed lines are light rays leaving the origin. Change the rocket's speed (as a fraction of the speed of light, $c$).`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: 0, ymax: 5.5, grid: 1, equal: true, maxWidth: 520, axes: { xlabel: 'x (light-years)', ylabel: 't (years)' },
                params: { v: { min: -0.95, max: 0.95, step: 0.05, value: 0.5, label: 'rocket speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [
                  { f: (x) => Math.abs(x), color: 'amber', dash: true, width: 2.5 },
                  { param: { x: (t, p) => p.v * t, y: (t) => t, t0: 0, t1: 5.5 }, color: 'coral', width: 4 },
                  { param: { x: () => 0, y: (t) => t, t0: 0, t1: 5.5 }, color: 'blue', width: 3 },
                ],
                readout: (p) => (Math.abs(p.v) < 1e-9 ? 'At rest: a vertical worldline, moving only through time.' : `The rocket covers ${Math.abs(p.v).toFixed(2)} light-years each year, so its worldline is steeper than light’s.`),
              },
              after: r`A body at rest (blue) has a vertical worldline: it moves through time but not space. Anything slower than light has a worldline **steeper** than $45°$, staying inside the region between the light rays.`,
            },
            {
              type: 'numeric',
              title: 'Reading a worldline',
              prompt: r`On a spacetime diagram (years up, light-years across), a spaceship's worldline rises 5 years for every 3 light-years across. What is its speed, as a fraction of $c$?`,
              answer: 0.6,
              tol: 0.001,
              wrong: [{ v: 5 / 3, tol: 0.01, why: 'That would be faster than light. Speed = distance ÷ time = 3 ÷ 5.' }],
              explain: r`$v = \frac{3 \text{ ly}}{5 \text{ yr}} = 0.6c$.`,
            },
            {
              type: 'interactive',
              title: 'A moving observer’s axes',
              body: r`A rocket observer moving at speed $\beta$ draws their own axes: their time axis $t'$ is their worldline (solid coral), and their space axis $x'$ (dashed coral) is their line of "now". As $\beta$ grows, the axes close in on the light ray like scissors. Find the speed at which the event E happens **at the rocket's own location** ($x' = 0$).`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 5, ymin: -0.5, ymax: 5, grid: 1, equal: true, maxWidth: 480, axes: { xlabel: 'x (ly)', ylabel: 't (yr)', xAt: 0 },
                params: { b: { min: 0, max: 0.9, step: 0.01, value: 0.2, label: 'rocket speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [
                  { f: (x) => x, from: 0, to: 5, color: 'amber', dash: true },
                  { param: { x: (t, p) => p.b * t, y: (t) => t, t0: 0, t1: 5 }, color: 'coral', width: 3 },
                  { f: (x, p) => p.b * x, from: 0, to: 5, color: 'coral', dash: true },
                ],
                points: [{ x: () => 2, y: () => 4, color: 'violet' }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(2) + 12, y: plot.Y(4) - 8, class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px));font-weight:700', text: 'E' })],
                readout: (p) => { const [x2, t2] = boost(2, 4, p.b); return `in the rocket’s frame, E is at $x' = ${x2.toFixed(2)}$ ly, $t' = ${t2.toFixed(2)}$ yr`; },
                goal: (p) => Math.abs(p.b - 0.5) < 0.005,
                hint: 'E is 2 light-years away after 4 years. Which speed covers that?',
                solution: { b: 0.5 },
              },
              explain: r`At $0.5c$ the rocket's worldline passes through E, so in its frame E happens "here", at $t' \approx 3.46$ years. That's less than Earth's 4 years: time dilation, read straight off the diagram.`,
            },
            {
              type: 'numeric',
              title: 'Reading the rocket’s clock',
              prompt: r`The rocket's clock reads $t' = \gamma\,(t - \beta x)$ for an event at $(x, t)$. For E $= (2, 4)$ and $\beta = 0.5$ ($\gamma \approx 1.155$), what is $t'$? (2 decimal places.)`,
              unit: 'years',
              answer: Math.sqrt(12),
              tol: 0.01,
              wrong: [{ v: 3, why: r`That's $t - \beta x$. Multiply by $\gamma \approx 1.155$.` }, { v: 4, why: 'That’s Earth’s time coordinate.' }],
              explain: r`$1.155 \times (4 - 0.5 \times 2) = 1.155 \times 3 \approx 3.46$ years, which equals $\sqrt{4^2 - 2^2} = \sqrt{12}$. That isn't a coincidence: it's the invariant interval of the next lesson.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The tilted line',
              prompt: r`The rocket's $x'$ axis tilts upward on Earth's diagram. What does that tilt mean?`,
              choices: [
                { t: 'Events the rocket calls simultaneous happen at different times for Earth: later the farther ahead they are', ok: true },
                { t: 'The rocket is climbing upward in space', why: 'The vertical axis is time, not height. The tilt is about which events count as "now".' },
                { t: 'The rocket’s rulers are bent', why: 'Its rulers are straight. The axis tilts because simultaneity is relative.' },
              ],
              explain: r`The $x'$ axis is the set of events with $t' = 0$: the rocket's "now". It tilts with slope $\beta$, so events ahead of the rocket that it calls simultaneous are **later** in Earth's frame. That's the relativity of simultaneity, drawn as geometry.`,
            },
          ],
          recap: [
            'Spacetime diagrams plot time up and space across; points are events.',
            'With years and light-years, light travels at 45°.',
            'Slower-than-light worldlines are steeper than 45°.',
          ],
        },
        {
          id: 'interval',
          title: 'The Invariant Interval',
          summary: 'What everyone agrees on',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A new kind of distance',
              body: r`Observers moving relative to one another disagree about time gaps (time dilation) and distances (length contraction) between two events. But they all agree on one combination, the **spacetime interval**:
$$s^2 = (c\,\Delta t)^2 - \Delta x^2$$
It's like Pythagoras, but with a **minus** sign. For a clock moving directly from one event to the other, $s/c$ is exactly the time that clock measures: its **proper time**.`,
            },
            {
              type: 'numeric',
              title: 'Proper time',
              prompt: r`Two events happen 5 years apart and 3 light-years apart, as measured on Earth. A traveller moves at constant speed from the first event to the second. How much time passes on the traveller's watch?`,
              unit: 'years',
              answer: 4,
              wrong: [{ v: 5, why: 'That’s Earth’s time. The traveller’s proper time is √(5² − 3²).' }, { v: Math.sqrt(34), tol: 0.01, why: 'The spacetime interval uses a minus sign: √(5² − 3²), not √(5² + 3²).' }],
              explain: r`$s = \sqrt{5^2 - 3^2} = 4$ years. (The traveller moves at $0.6c$, so $\gamma = 1.25$ and $\frac{5}{1.25} = 4$: the same answer as time dilation, but here it's pure geometry.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The invariant hyperbola',
              body: r`An event is 4 years and 2 light-years from the origin in Earth's frame. Change the observer's speed: the violet dot shows the same event in **their** coordinates. Every observer places it somewhere on the dashed curve $t^2 - x^2 = 12$.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 4, ymin: 0, ymax: 6, grid: 1, equal: true, maxWidth: 480, axes: { xlabel: 'x (ly)', ylabel: 't (yr)' },
                params: { b: { min: -0.8, max: 0.8, step: 0.01, value: 0, label: 'observer speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [{ f: (x) => Math.sqrt(12 + x * x), color: 'muted', dash: true }, { f: (x) => Math.abs(x), color: 'amber', dash: true }],
                points: [{ x: (p) => boost(2, 4, p.b)[0], y: (p) => boost(2, 4, p.b)[1], color: 'violet' }],
                readout: (p) => { const [x2, t2] = boost(2, 4, p.b); return `$t' = ${t2.toFixed(2)}$, $x' = ${x2.toFixed(2)}$ · $t'^2 - x'^2 = ${(t2 * t2 - x2 * x2).toFixed(2)}$`; },
              },
              after: r`Time and distance both change, but always along the same **hyperbola**. In ordinary geometry, rotating a point keeps it on a circle $x^2 + y^2 = r^2$; in spacetime, changing speed (a **boost**) keeps it on a hyperbola. The lowest point of the hyperbola, $t = \sqrt{12}$, is the proper time.`,
            },
            { /*anim:spacetime*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Boosting the whole diagram',
              body: r`A grid of events, drawn as Earth sees them (time up, space across, light rays at 45°). Now redraw the same events as a rocket sees them, while the rocket's speed changes. The {coral:coral event} is the one 4 years and 2 light-years from the origin; the dashed curves are its hyperbola and its mirror images.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6.5, xmax: 6.5, ymin: -6.5, ymax: 6.5, grid: false, axes: false, maxWidth: 400, clipExtra: true,
                animate: { param: 't', speed: 1, max: 4 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const b = 0.55 * Math.sin(p.t / 2), g = 1 / Math.sqrt(1 - b * b), els = [];
                  const boost = (x, t) => [g * (x - b * t), g * (t - b * x)];
                  const P = (pts) => pts.map(([x, t], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(t).toFixed(1)}`).join('');
                  // Earth's grid lines (constant x and constant t), as the rocket sees them
                  for (let c = -10; c <= 10; c++) {
                    els.push(s('path', { d: P([boost(c, -16), boost(c, 16)]), fill: 'none', stroke: 'var(--blue)', 'stroke-width': c === 0 ? 2 : 1, opacity: c === 0 ? 0.9 : 0.35 }));
                    els.push(s('path', { d: P([boost(-16, c), boost(16, c)]), fill: 'none', stroke: 'var(--teal)', 'stroke-width': c === 0 ? 2 : 1, opacity: c === 0 ? 0.9 : 0.35 }));
                  }
                  // light rays and the hyperbolas t² − x² = 12 (and x² − t² = 12)
                  els.push(s('path', { d: P([[-7, -7], [7, 7]]) + P([[-7, 7], [7, -7]]), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.5 }));
                  for (const [sx, st, swap] of [[1, 1, 0], [1, -1, 0], [1, 1, 1], [-1, 1, 1]]) {
                    const pts = [];
                    for (let i = -40; i <= 40; i++) { const u = i / 16, a = Math.sqrt(12) * Math.sinh(u), c = Math.sqrt(12) * Math.cosh(u); pts.push(swap ? [sx * c, a] : [a, st * c]); }
                    els.push(s('path', { d: P(pts), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }));
                  }
                  const [ex, et] = boost(2, 4);
                  els.push(s('circle', { cx: plot.X(ex), cy: plot.Y(et), r: 7, class: 'fl-coral' }));
                  return els;
                },
                readout: (p) => { const b = 0.55 * Math.sin(p.t / 2), g = 1 / Math.sqrt(1 - b * b), x = g * (2 - 4 * b), t = g * (4 - 2 * b); return `rocket at ${fix(b, 2)}$c$ · event at $t' = ${fix(t, 2)}$, $x' = ${fix(x, 2)}$ · $t'^2 - x'^2 = ${fix(t * t - x * x, 2)}$`; },
              },
              after: r`A change of speed doesn't rotate the diagram; it **squeezes** it along one light ray and stretches it along the other. The light rays themselves never move (every observer measures the same speed of light), and every event slides along its own hyperbola, so $t^2 - x^2$ never changes. The {blue:blue lines} (Earth's "here") and {teal:teal lines} (Earth's "now") tilt towards the light rays: one observer's "now" is a slanted line to another.`,
            },
            {
              type: 'numeric',
              title: 'Proper distance',
              prompt: r`Two events are 5 light-years apart and 3 years apart in Earth's frame. This interval is **spacelike**. For an observer who sees them as simultaneous, how far apart are they?`,
              unit: 'ly',
              answer: 4,
              wrong: [{ v: 5, why: r`That's Earth's distance. Use $\sqrt{\Delta x^2 - \Delta t^2}$.` }, { v: Math.sqrt(34), tol: 0.01, why: 'Remember the minus sign: √(5² − 3²).' }],
              explain: r`$\sqrt{5^2 - 3^2} = 4$ ly. For spacelike events, $\sqrt{\Delta x^2 - (c\Delta t)^2}$ is the **proper distance**: the separation in the frame where they happen at the same time. It's the shortest distance any observer measures between them.`,
            },
            {
              type: 'numeric',
              title: 'Compute an interval',
              prompt: r`Two events are 10 years apart in time and 6 light-years apart in space. What is the squared interval $s^2 = (c\Delta t)^2 - \Delta x^2$, in (light-years)²?`,
              answer: 64,
              explain: r`$10^2 - 6^2 = 64$, so $s = 8$: a clock travelling between the events at constant speed ($0.6c$) records 8 years. Every observer agrees on this number, though they disagree on the 10 and the 6.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Light’s interval',
              prompt: r`What is the spacetime interval between a flash of light leaving the Sun and arriving at Earth (8.3 light-minutes away, 8.3 minutes later)?`,
              choices: [
                { t: 'Zero', ok: true },
                { t: '8.3 minutes', why: r`$s^2 = (8.3)^2 - (8.3)^2 = 0$ in light-minute units.` },
                { t: 'It depends on who measures it', why: 'The interval is the same for every observer. For any light ray it is zero.' },
              ],
              explain: r`For light, $c\,\Delta t = \Delta x$, so $s = 0$. If you could ride along with light, no time at all would pass. Intervals come in three types: **timelike** ($s^2 > 0$, a clock can travel between the events), **lightlike** ($s^2 = 0$) and **spacelike** ($s^2 < 0$).`,
            },
          ],
          recap: [
            r`The interval $s^2 = (c\Delta t)^2 - \Delta x^2$ is the same for all observers.`,
            'For a clock moving between two events, s/c is its proper time.',
            'Light rays have zero interval.',
          ],
        },
        {
          id: 'cones',
          title: 'Light Cones & Causality',
          summary: 'What can affect what',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Past, future and elsewhere',
              body: r`The light rays through an event form its **light cone** (in two space dimensions it really is a cone). Events inside the upper half are in its **future**: a signal slower than light could reach them. Events inside the lower half are in its **past**. Everything outside the cone is "elsewhere": too far away for any signal, even light, to connect them.

Different observers can disagree on the time order of two "elsewhere" events, but never on the order of events inside each other's light cones. Cause and effect is safe.`,
            },
            {
              type: 'mcq',
              title: 'Could it be the cause?',
              prompt: r`A star explodes 2 light-years from Earth. One year later (in Earth's frame), a radio telescope on Earth glitches. Could the explosion have caused the glitch?`,
              choices: [
                { t: 'No: the events are spacelike separated, since even light needs 2 years to make the trip', ok: true },
                { t: 'Yes, if the signal travelled fast enough', why: 'It would have to travel at twice the speed of light. Nothing carrying information can.' },
                { t: 'Yes: anything that happens earlier can cause anything later', why: 'Not in relativity. Some observers would even see the glitch happen first.' },
              ],
              explain: r`$s^2 = 1^2 - 2^2 = -3 < 0$: spacelike. The glitch is outside the explosion's future light cone, and some observers (moving fast enough) would measure the glitch as happening **before** the explosion. If faster-than-light signals existed, effects could precede causes in some frames, which is why physicists treat the speed of light as the speed limit of causality.`,
            },
            {
              type: 'interactive',
              title: 'Flip the order',
              body: r`Drag the violet event. The amber lines are the light cone of the origin event O. Then change the observer's speed. Make the violet event happen **after** O in Earth's frame but **before** O for the moving observer.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: -3, ymax: 4, grid: 1, equal: true, maxWidth: 520, axes: { xlabel: 'x (ly)', ylabel: 't (yr)' },
                params: { x: { min: -4.5, max: 4.5, step: 0.1, value: 1, slider: false }, t: { min: -2.5, max: 3.5, step: 0.1, value: 2.5, slider: false }, b: { min: -0.95, max: 0.95, step: 0.01, value: 0, label: 'observer speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [{ f: (x) => Math.abs(x), color: 'amber', width: 2.5 }, { f: (x) => -Math.abs(x), color: 'amber', width: 2.5 }, { f: (x, p) => p.b * x, color: 'coral', dash: true }],
                points: [{ x: () => 0, y: () => 0, color: 'ink' }, { x: (p) => p.x, y: (p) => p.t, drag: { x: 'x', y: 't' }, color: 'violet' }],
                readout: (p) => { const s2 = p.t * p.t - p.x * p.x, kind = Math.abs(s2) < 0.05 ? 'on the light cone' : s2 > 0 ? (p.t > 0 ? 'in O’s future' : 'in O’s past') : 'elsewhere (spacelike)'; const t2 = boost(p.x, p.t, p.b)[1]; return `event is **${kind}** · Earth: ${p.t > 0 ? 'after' : p.t < 0 ? 'before' : 'same time as'} O · moving observer: **${t2 > 0.005 ? 'after' : t2 < -0.005 ? 'before' : 'same time as'}** O`; },
                goal: (p) => p.t > 0 && boost(p.x, p.t, p.b)[1] < 0,
                hint: 'Only events outside the light cone (|x| > t) can change order. Then tilt the observer’s “now” line (dashed) above the event.',
                solution: { x: 3, t: 1, b: 0.5 },
              },
              explain: r`It only works for events **outside** the light cone. The dashed line is the observer's "now" through O: once it tilts above the event, they say it already happened. Try putting the event inside the future cone: no allowed speed (below $c$) can flip it.`,
            },
            {
              type: 'numeric',
              title: 'The earliest echo',
              prompt: r`A star 10 light-years away explodes in the year 2020 (Earth's frame). What is the earliest year in which anything on Earth could be affected by it?`,
              answer: 2030,
              wrong: [{ v: 2020, why: 'Nothing travels faster than light: the news takes at least 10 years.' }, { v: 2010, why: 'Effects come after causes. Add the light travel time.' }],
              explain: r`**2030**, when light from the explosion arrives. Everything on Earth before 2030 is in the explosion's "elsewhere", unaffected by it. When we see a supernova in a distant galaxy, it really happened millions of years earlier.`,
            },
            {
              type: 'mcq',
              title: 'Out of reach',
              prompt: r`A star 10 light-years away explodes, as measured in our frame, 5 years from now. Can anything we do today influence it?`,
              choices: [
                { t: r`No: it lies outside our future light cone`, ok: true },
                { t: r`Yes, with a fast enough rocket`, why: r`Reaching it in 5 years would require travelling at twice the speed of light.` },
                { t: r`Yes, by radio`, why: r`Radio waves travel at the speed of light and need 10 years.` },
              ],
              explain: r`The event is "elsewhere": spacelike separated from us now. No signal can connect us, and different observers even disagree about whether it happens before or after our "now".`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The cone of a lifetime',
              prompt: r`You live to 90. Which region of spacetime could you, in principle, ever influence during your life?`,
              choices: [
                { t: 'The union of the future light cones of all the events of your life', ok: true },
                { t: 'Everything within 90 light-years of your birthplace', why: 'Places 90 light-years away can only be reached long after you’re gone, and only at their later times.' },
                { t: 'Only events on your own worldline', why: 'You can send signals: anything inside the future cone of some moment of your life is reachable.' },
              ],
              explain: r`Every moment of your life has a future light cone, and together they form the region you can influence: forever expanding, but always inside a cone tilted at 45°. Most of the universe, including almost all of it right "now", lies in your elsewhere.`,
            },
          ],
          recap: [
            'An event’s light cone separates its future, past and “elsewhere”.',
            'Only timelike or lightlike separated events can be causally connected.',
            'Time order of spacelike-separated events depends on the observer.',
          ],
        },
      ],
    },
    {
      title: 'Relativity in Action',
      summary: 'Velocity addition and the twin paradox.',
      lessons: [
        {
          id: 'velocities',
          title: 'Adding Velocities',
          summary: 'Rapidity: the hidden way speeds add',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Not simply adding',
              body: r`A train moves at speed $v$ and a passenger throws a ball forward at speed $u$ relative to the train. Everyday intuition says the ball moves at $u + v$ relative to the ground. Relativity says:
$$w = \frac{u + v}{1 + \dfrac{uv}{c^2}}$$
For everyday speeds, $\frac{uv}{c^2}$ is tiny and the formula is just $u + v$. Near light speed, it changes everything.`,
            },
            {
              type: 'numeric',
              title: 'Half plus half',
              prompt: r`A spaceship moving at $0.5c$ fires a probe forward at $0.5c$ relative to the ship. How fast is the probe moving relative to Earth, as a fraction of $c$?`,
              answer: 0.8,
              tol: 0.001,
              wrong: [{ v: 1, why: r`Velocities don't simply add: $\frac{0.5 + 0.5}{1 + 0.25}$.` }],
              explain: r`$w = \frac{0.5 + 0.5}{1 + 0.5 \times 0.5} = \frac{1}{1.25} = 0.8c$. Fire another probe at $0.5c$ from that one and you get $\frac{1.3}{1.4} \approx 0.93c$: always approaching, never reaching, $c$.`,
            },
            {
              type: 'explain',
              title: 'Rapidity',
              body: r`There's a hidden way to make relativistic speeds add simply. Define the **rapidity** $\phi$ of a speed $\beta$ by
$$\beta = \tanh\phi$$
(the hyperbolic tangent). Then rapidities simply **add**: combining speeds with rapidities $\phi_1$ and $\phi_2$ gives rapidity $\phi_1 + \phi_2$. That's exactly the velocity-addition formula, in disguise: it's the identity $\tanh(a + b) = \frac{\tanh a + \tanh b}{1 + \tanh a \tanh b}$.`,
            },
            {
              type: 'interactive',
              title: 'Stacking boosts',
              body: r`Each boost adds the same rapidity. Stack boosts of $0.5c$ (rapidity $0.549$) one after another, and watch the speed creep toward $c$ while the rapidity grows steadily. How many boosts does it take to pass $0.99c$?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 1.05, grid: false, height: 280, axes: { xlabel: 'rapidity', ylabel: 'speed (c)', xticks: 1, yticks: 0.25 },
                params: { n: { min: 0, max: 10, step: 1, value: 1, label: 'boosts', color: 'violet' } },
                curves: [{ f: (x) => Math.tanh(x), color: 'violet', width: 3 }, { f: () => 0.99, color: 'teal', dash: true }],
                extra: ({ plot, p, s }) => Array.from({ length: p.n + 1 }, (_, k) => s('circle', { cx: plot.X(k * Math.atanh(0.5)), cy: plot.Y(Math.tanh(k * Math.atanh(0.5))), r: k === p.n ? 7 : 4, class: k === p.n ? 'fl-coral' : 'fl-violet' })),
                readout: (p) => `${p.n} boost${p.n === 1 ? '' : 's'} of 0.5c: rapidity ${(p.n * Math.atanh(0.5)).toFixed(3)}, speed **${Math.tanh(p.n * Math.atanh(0.5)).toFixed(4)}c**`,
                goal: (p) => p.n === 5,
                hint: 'Find the first number of boosts where the speed exceeds 0.99c.',
                solution: { n: 5 },
              },
              explain: r`Four boosts give $\tanh(2.197) \approx 0.976c$; the fifth reaches $\tanh(2.747) \approx 0.992c$, the first above $0.99c$. Rapidity can grow without limit, but the speed it corresponds to never reaches $c$.`,
            },
            {
              type: 'numeric',
              title: 'Nine-tenths plus nine-tenths',
              prompt: r`A ship moving at $0.9c$ fires a probe forward at $0.9c$ relative to the ship. Using $\frac{u + v}{1 + uv/c^2}$, how fast does the probe move relative to Earth? (4 decimal places, as a fraction of $c$.)`,
              answer: 1.8 / 1.81,
              tol: 0.0002,
              wrong: [{ v: 1.8, tol: 0.001, why: r`That's simple addition. Divide by $1 + 0.9 \times 0.9 = 1.81$.` }],
              explain: r`$\frac{1.8}{1.81} \approx 0.9945c$, not $1.8c$. In rapidities it’s simple addition: $\tanh^{-1} 0.9 \approx 1.472$, doubled is $2.944$, and $\tanh 2.944 \approx 0.9945$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A year at 1 g',
              prompt: r`A rocket accelerating at a constant 1 g (as felt by the crew) gains rapidity at a steady rate: about $1.03$ per year of the crew's time. After one year of the crew's time, starting from rest, what's its speed? (As a fraction of $c$, 2 decimal places.)`,
              unit: 'c',
              answer: Math.tanh(1.0327),
              tol: 0.006,
              wrong: [{ v: 1.03, why: 'That’s the rapidity. Speed is its hyperbolic tangent, always below 1.' }],
              hint: r`$\beta = \tanh(1.03)$.`,
              explain: r`$\tanh(1.03) \approx 0.77c$. Newton would say $1.03c$ (since $1\,g \times 1$ year $\approx 1.03c$), faster than light. Rapidity grows exactly like Newtonian speed, which is why constant acceleration is so simple in these units: next chapter, we'll ride this rocket to the stars.`,
            },
          ],
          recap: [
            r`Relativistic velocity addition: $w = \frac{u + v}{1 + uv/c^2}$.`,
            'At low speeds it reduces to u + v.',
            r`Rapidity $\phi$ with $\beta = \tanh\phi$: rapidities simply add.`,
          ],
        },
        {
          id: 'twins',
          title: 'The Twin Paradox',
          summary: 'The longest path is straight',
          icon: 'clock',
          steps: [
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A trip to a star',
              prompt: r`Alice stays on Earth. Her twin Bob flies to a star 4 light-years away and straight back. Choose Bob's speed so that he ages exactly **6 years** during the trip.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 6, ymin: 0, ymax: 17, grid: 1, gridY: 2, height: 320, maxWidth: 440, axes: { xlabel: 'x (ly)', ylabel: 't (yr)', xAt: -1 },
                params: { v: { min: 0.5, max: 0.95, step: 0.05, value: 0.6, label: 'Bob’s speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [
                  { param: { x: () => 0, y: (t) => t, t0: 0, t1: (p) => tripTime(p.v) }, color: 'blue', width: 4 },
                  { param: { x: (t, p) => (t <= tripTime(p.v) / 2 ? p.v * t : p.v * (tripTime(p.v) - t)), y: (t) => t, t0: 0, t1: (p) => tripTime(p.v) }, color: 'coral', width: 4 },
                ],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(STAR), x2: plot.X(STAR), y1: plot.Y(0), y2: plot.Y(17), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }), s('text', { x: plot.X(STAR) + 6, y: plot.Y(16.3), class: 'tick', text: 'star' })],
                readout: (p) => r`Alice ages $${tripTime(p.v).toFixed(2)}$ years; Bob ages $${(tripTime(p.v) / gamma(p.v)).toFixed(2)}$ years`,
                goal: (p) => Math.abs(tripTime(p.v) / gamma(p.v) - 6) < 0.01,
                hint: r`Each leg covers 4 ly. For Bob's watch, each leg lasts $\sqrt{t^2 - 4^2}$ where $t = 4/v$. You need 3 years per leg.`,
                solution: { v: 0.8 },
              },
              explain: r`At $0.8c$, each leg takes 5 years on Earth's clocks, so Alice ages 10 years. For Bob, each leg has interval $\sqrt{5^2 - 4^2} = 3$ years, so he ages 6. When they reunite, Bob is 4 years younger.`,
            },
            {
              type: 'mcq',
              title: 'Why not symmetric?',
              prompt: r`From Bob's point of view, isn't it Alice who moves away and returns? Why doesn't Alice end up younger?`,
              choices: [
                { t: 'Bob changes direction (accelerates) at the star, so his worldline is bent; Alice’s is straight, and the straight worldline has the most proper time', ok: true },
                { t: 'Because Earth is more massive', why: 'Mass has nothing to do with it here. The difference is which twin changes velocity.' },
                { t: 'It is symmetric: they end up the same age', why: 'Experiments with atomic clocks on aircraft confirm the asymmetry. The travelling clock reads less.' },
              ],
              explain: r`The two situations aren't equivalent: only Bob switches between frames, and his worldline has a kink. In spacetime geometry, the minus sign in the interval flips the usual rule: between two events, the **straight** worldline has the **longest** proper time, the opposite of ordinary geometry, where the straight line is the shortest path. The effect has been confirmed with atomic clocks flown around the world (Hafele and Keating, 1971).`,
            },
            {
              type: 'numeric',
              title: 'Birthday messages',
              prompt: r`Alice sends Bob a radio message on each of her birthdays. While Bob flies away at $0.8c$, the messages reach him stretched out by the Doppler effect: one every 3 of his years. On the way home, they arrive squeezed: **3 per year** of his time. Each leg lasts 3 years for Bob. How many messages does he receive on the way home?`,
              unit: 'messages',
              answer: 9,
              wrong: [{ v: 3, why: 'That’s the rate per year. The return leg lasts 3 of Bob’s years.' }, { v: 10, why: 'That’s the total for the whole trip. One message arrived on the way out.' }],
              explain: r`$3 \times 3 = 9$ on the way back, plus 1 on the way out: **10** messages, exactly Alice's 10 birthdays. Meanwhile Alice receives only Bob's 6. The light signals keep perfect accounts, and everyone agrees who aged more.`,
            },
            {
              type: 'numeric',
              title: 'A longer trip',
              prompt: r`Bob travels at $0.6c$ ($\gamma = 1.25$) to a star 10 light-years away and back. Alice ages $\frac{2 \times 10}{0.6} \approx 33.3$ years. How many years younger than Alice is Bob when he returns? (1 decimal place.)`,
              unit: 'years',
              answer: 2 * 10 / 0.6 * (1 - 0.8),
              tol: 0.06,
              explain: r`Bob ages $\frac{33.3}{1.25} \approx 26.7$ years, so he returns about **6.7 years** younger. The interval for each leg is $\sqrt{16.7^2 - 10^2} \approx 13.3$ years, giving the same answer by pure geometry.`,
            },
            {
              type: 'numeric',
              title: 'Nearly light speed',
              prompt: r`A traveller goes to a star 10 light-years away at $0.99c$ and straight back. Earth waits $\frac{20}{0.99} \approx 20.2$ years, and $\gamma \approx 7.09$. How many years pass for the traveller? (1 decimal place.)`,
              unit: 'years',
              answer: 20 / 0.99 / (1 / Math.sqrt(1 - 0.99 ** 2)),
              tol: 0.05,
              wrong: [{ v: 20.2, tol: 0.1, why: r`That's Earth's time. Divide by $\gamma$ for the traveller's.` }],
              explain: r`$\frac{20.2}{7.09} \approx 2.8$ years for a 20-light-year round trip. The traveller returns more than 17 years younger than their twin. The asymmetry comes from the turnaround: only the traveller changes frames.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Muons in a ring',
              prompt: r`In 1977, CERN stored muons in a ring 14 m across, circling at 99.94% of the speed of light ($\gamma \approx 29.3$). They are constantly accelerating (turning), with about $10^{18}$ g. What was measured?`,
              choices: [
                { t: 'They lived 29.3 times longer than muons at rest, exactly as time dilation predicts; acceleration itself had no extra effect', ok: true },
                { t: 'The huge acceleration destroyed them instantly', why: 'They survived many laps. The ring’s magnetic field turns them without harming them.' },
                { t: 'They aged normally, because they kept returning to the same place', why: 'Like Bob, a clock that travels and returns reads less than one that stayed put.' },
              ],
              explain: r`The muons are travelling twins on a racetrack: they return to the same place every lap, yet age 29 times more slowly than lab clocks. The **clock hypothesis**, that a clock's rate depends only on its speed, not its acceleration, held to about 0.1%. Proper time is just the length of the worldline.`,
            },
          ],
          recap: [
            'The travelling twin’s proper time is the sum of the intervals along their worldline.',
            'Bob’s bent worldline has less proper time than Alice’s straight one.',
            'In spacetime, straight worldlines maximise proper time.',
          ],
        },
      ],
    },
    {
      title: 'Journeys and Paradoxes',
      summary: 'Rockets to the stars and ladders in barns.',
      lessons: [
        {
          id: 'rocket',
          title: 'Rocket to the Stars',
          summary: 'Constant acceleration across the galaxy',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'One g, forever',
              body: r`Imagine a rocket that accelerates at a steady $1\,g$, so the crew feels normal Earth gravity, for the first half of the trip, then flips around and decelerates at $1\,g$ for the second half. Its rapidity grows steadily, so its speed creeps ever closer to $c$, and time dilation grows enormous.

For a trip of distance $d$, the crew's time is
$$\tau = \frac{2c}{a}\,\cosh^{-1}\!\left(1 + \frac{a d}{2c^2}\right)$$
With $a = 1\,g$, the handy numbers are $\frac{c}{a} \approx 0.97$ years and $\frac{a}{c^2} \approx 1.03$ per light-year.`,
            },
            {
              type: 'interactive',
              title: 'Where can you go?',
              body: r`Choose a destination distance (the slider is logarithmic). Find a trip that takes the crew exactly **20 years**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6.5, ymin: 0, ymax: 32, grid: false, height: 300, axes: { xlabel: 'distance (light-years)', ylabel: 'crew years', xticks: 1, yticks: 5, xfmt: (v) => (v < 4 ? `${Math.round(10 ** v)}` : `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[v]}`) },
                params: { e: { min: 0, max: 6.5, step: 0.01, value: 0.64, label: 'distance', color: 'violet', format: (v) => `${fmtYears(10 ** v)} ly` } },
                curves: [{ f: (x) => rocketTrip(10 ** x).ship, color: 'violet', width: 3 }, { f: () => 20, color: 'teal', dash: true }],
                points: [{ x: (p) => p.e, y: (p) => rocketTrip(10 ** p.e).ship, color: 'coral' }],
                readout: (p) => { const r = rocketTrip(10 ** p.e); return `crew ages **${r.ship.toFixed(1)} years** · Earth waits ${fmtYears(r.earth)} years · top speed ${r.vmax > 0.99999 ? '0.99999…' : r.vmax.toFixed(5)}c`; },
                goal: (p) => Math.abs(rocketTrip(10 ** p.e).ship - 20) < 0.15,
                hint: 'Try around ten thousand to a hundred thousand light-years.',
                solution: { e: 4.47 },
              },
              explain: r`About **30,000 light-years**, roughly the distance to the centre of the Milky Way, in 20 years of the crew's lives, while 30,000 years pass on Earth. The crew time grows only like the **logarithm** of the distance: each extra 4 years of crew time multiplies the reachable distance by about 8.`,
            },
            {
              type: 'numeric',
              title: 'The nearest star',
              prompt: r`Alpha Centauri is 4.37 light-years away. Using the formula with $\frac{c}{a} = 0.97$ yr and $\frac{a}{c^2} = 1.03$ per ly, how long does the 1 g trip take for the crew? (1 decimal place.)`,
              unit: 'years',
              answer: rocketTrip(4.37).ship,
              tol: 0.06,
              wrong: [{ v: rocketTrip(4.37).earth, tol: 0.06, why: 'That’s the time on Earth. Use the crew-time formula.' }, { v: 4.37, tol: 0.05, why: 'That would be travelling at light speed the whole way, as seen from Earth.' }],
              hint: r`$\tau = 2 \times 0.97 \times \cosh^{-1}(1 + 1.03 \times 2.185)$, and $\cosh^{-1}(3.25) \approx 1.85$.`,
              explain: r`$\tau \approx 1.94 \times 1.85 \approx 3.6$ years for the crew, while Earth waits about 6.0 years. The rocket peaks at $0.95c$ at the midpoint. For short trips, relativity saves only a little time; for long ones it saves almost all of it.`,
            },
            {
              type: 'mcq',
              title: 'The catch',
              prompt: r`Even a perfect "photon rocket", which converts fuel completely into a light beam, would arrive at the galactic centre with only about **one billionth** of its starting mass. Why so little?`,
              choices: [
                { t: 'Each gain in rapidity costs the same fraction of the remaining mass, and the trip needs a total rapidity change of about 20', ok: true },
                { t: 'Because energy is lost as heat', why: 'A perfect photon rocket loses nothing to heat. The cost is built into relativity and momentum conservation.' },
                { t: 'Because the rocket’s mass grows with speed', why: 'Its rest mass shrinks as fuel is used. The problem is how much fuel each boost needs.' },
              ],
              explain: r`For a photon rocket, the final mass is $e^{-\Delta\phi}$ times the starting mass, where $\Delta\phi$ is the total rapidity change. Accelerating then decelerating for 20 years at 1 g needs $\Delta\phi \approx 20.6$, and $e^{-20.6} \approx 1.1 \times 10^{-9}$. The physics allows the trip; the engineering is another matter entirely.`,
            },
            {
              type: 'numeric',
              title: 'Two years at 1 g',
              prompt: r`A rocket accelerates at $1g$ (as felt by the crew) for **two** years of ship time. Its speed is then $c\tanh\left(\frac{g\tau}{c}\right)$, with $\frac{g\tau}{c} \approx 2.06$. What fraction of light speed is that? (2 decimal places.)`,
              answer: Math.tanh(2 * 9.81 * 3.156e7 / 3e8),
              tol: 0.01,
              wrong: [{ v: 1.54, tol: 0.02, why: r`Doubling the 0.77 reached after one year breaks the speed limit. Double the rapidity instead, then take tanh.` }],
              explain: r`$\tanh(2.06) \approx 0.97$. The second year added only 20% of light speed, against 77% in the first, yet the rapidity grew by the same 1.03. In Newtonian physics you’d be at 2.06c; relativity keeps you below $c$ however long you accelerate.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'To Andromeda',
              prompt: r`The Andromeda galaxy is 2.5 million light-years away. At 1 g (accelerate, flip, decelerate), how many years does the trip take for the crew? Use $\cosh^{-1} y \approx \ln(2y)$ for large $y$. (Nearest year.)`,
              unit: 'years',
              answer: rocketTrip(2.5e6).ship,
              tol: 0.6,
              wrong: [{ v: 2.5e6, relTol: 0.01, why: 'That’s roughly the time on Earth.' }],
              hint: r`$y = 1 + 1.03 \times 1.25 \times 10^6 \approx 1.29 \times 10^6$, so $\cosh^{-1} y \approx \ln(2.58 \times 10^6) \approx 14.8$. Then $\tau = 1.94 \times 14.8$.`,
              explain: r`$\tau \approx 1.94 \times 14.8 \approx 29$ years. A human lifetime could reach another galaxy, but the crew would return to an Earth 5 million years older. Relativity makes the universe accessible, one way.`,
            },
          ],
          recap: [
            'At constant 1 g, rapidity grows steadily while speed approaches c.',
            'Crew time grows only logarithmically with distance: the galactic centre in about 20 years.',
            'The fuel cost grows exponentially with the rapidity change.',
          ],
        },
        {
          id: 'ladder',
          title: 'The Ladder Paradox',
          summary: 'Simultaneity to the rescue',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Too long to fit?',
              body: r`A runner carries a 10 m ladder (its length at rest) toward an 8 m barn with doors at both ends. The farmer plans to shut both doors at the same moment, trapping the ladder inside.

In the barn's frame, the moving ladder is contracted, so at high enough speed it fits. But in the runner's frame the **barn** is moving and contracted, so it's even shorter than 8 m. Who's right?`,
            },
            {
              type: 'interactive',
              title: 'The barn’s view',
              body: r`The diagram uses the barn's frame (time in metres of light-travel, so light moves at 45°). The barn's walls are the vertical lines; the shaded band is the ladder moving right. The highlighted line is the moment the ladder's back end enters. Find the **slowest** speed at which the whole ladder is inside the barn at that moment.`,
              widget: {
                kind: 'graph', xmin: -12, xmax: 16, ymin: -12, ymax: 14, grid: false, equal: true, maxWidth: 480, axes: { xlabel: 'x (m)', ylabel: 'ct (m)', xticks: 4, yticks: 4, xAt: -12 },
                params: { b: { min: 0, max: 0.95, step: 0.01, value: 0.4, label: 'ladder speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                extra: ({ plot, p, s }) => { const L = 10 * Math.sqrt(1 - p.b * p.b), P = (x, t) => `${plot.X(x).toFixed(1)} ${plot.Y(t).toFixed(1)}`; const t0 = -12, t1 = 14; const inside = L <= 8 + 1e-9; return [s('rect', { x: plot.X(0), y: plot.Y(14), width: plot.X(8) - plot.X(0), height: plot.Y(-12) - plot.Y(14), fill: 'var(--surface-2)' }), s('path', { d: `M${P(p.b * t0, t0)}L${P(p.b * t1, t1)}L${P(p.b * t1 + L, t1)}L${P(p.b * t0 + L, t0)}Z`, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 }), s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-12), y2: plot.Y(14), stroke: 'var(--ink)', 'stroke-width': 3 }), s('line', { x1: plot.X(8), x2: plot.X(8), y1: plot.Y(-12), y2: plot.Y(14), stroke: 'var(--ink)', 'stroke-width': 3 }), s('line', { x1: plot.X(0), x2: plot.X(L), y1: plot.Y(0), y2: plot.Y(0), stroke: inside ? 'var(--success)' : 'var(--error)', 'stroke-width': 6, 'stroke-linecap': 'round' })]; },
                readout: (p) => { const L = 10 * Math.sqrt(1 - p.b * p.b); return `ladder length in the barn frame: **${L.toFixed(2)} m** · ${L <= 8 + 1e-9 ? 'it fits: both doors can be shut at once' : 'too long for the 8 m barn'}`; },
                goal: (p) => 10 * Math.sqrt(1 - p.b * p.b) <= 8 + 1e-9 && p.b <= 0.605,
                hint: r`You need $10/\gamma = 8$, so $\gamma = 1.25$.`,
                solution: { b: 0.6 },
              },
              explain: r`At $0.6c$, $\gamma = 1.25$ and the ladder measures exactly $10/1.25 = 8$ m: it just fits, and for an instant both doors can be closed (and quickly reopened) with the ladder inside.`,
            },
            {
              type: 'numeric',
              title: 'The runner’s view',
              prompt: r`Now the runner moves at $0.8c$ ($\gamma = \frac53$). In the runner's frame, how long is the barn?`,
              unit: 'm',
              answer: 4.8,
              tol: 0.01,
              wrong: [{ v: 6, why: 'That’s the ladder’s length in the barn frame. Contract the barn instead: 8 ÷ (5/3).' }, { v: 13.3, tol: 0.1, why: 'Moving objects get shorter, not longer.' }],
              explain: r`$8 \div \frac53 = 4.8$ m, while the ladder is its full 10 m. To the runner, a 10 m ladder can't possibly fit in a 4.8 m barn. Yet the farmer sees both doors shut with the ladder inside. Both can't be wrong about whether the ladder gets crushed...`,
            },
            {
              type: 'mcq',
              title: 'Resolving it',
              prompt: r`How do the two views fit together?`,
              choices: [
                { t: 'The doors close simultaneously in the barn frame, but not in the runner’s: the far door closes and reopens before the near door closes', ok: true },
                { t: 'The barn frame is the true one, so the runner is wrong', why: 'No frame is privileged. The runner’s measurements are just as valid.' },
                { t: 'The ladder really shrinks and stays short', why: 'Contraction depends on the observer: in its own frame the ladder is always 10 m.' },
              ],
              explain: r`"Both doors shut at the same moment" is a statement about simultaneity, which is relative. In the runner's frame the front door shuts (and reopens) while the back of the ladder is still outside; later the back door shuts behind it once the front is already out. Each observer sees a consistent story, and the ladder is never crushed.`,
            },
            {
              type: 'numeric',
              title: 'Room to spare',
              prompt: r`Back in the barn's frame, the runner carries the 10 m ladder at $0.8c$ ($\gamma = \frac53$). How long is the ladder, as measured in the barn, in metres?`,
              unit: 'm',
              answer: 6,
              tol: 0.01,
              wrong: [{ v: 4.8, tol: 0.01, why: 'That’s the barn as the runner sees it. Here we want the ladder as the farmer sees it.' }],
              explain: r`$\frac{10}{5/3} = 6$ m: it fits in the 8 m barn with 2 m to spare, while the runner sees a 4.8 m barn and a 10 m ladder. Each sees the other’s object contracted, which is exactly why the paradox needs the relativity of simultaneity to resolve.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A door that stays shut',
              prompt: r`Suppose the far door is a solid wall that stays shut. The ladder's front end hits it and stops. What happens to the back end at that instant?`,
              choices: [
                { t: 'It keeps moving until news of the collision, travelling at most at c, reaches it, so the ladder gets squashed (or breaks)', ok: true },
                { t: 'It stops at the same instant, since the ladder is rigid', why: 'No object is perfectly rigid in relativity: that would send a signal down the ladder instantly, faster than light.' },
                { t: 'The ladder passes through the wall', why: 'Relativity doesn’t let objects pass through each other.' },
              ],
              explain: r`The stopping signal travels along the ladder at the speed of sound in the material, far slower than light. Until it arrives, the back end keeps going, so the ladder is compressed. In both frames everyone agrees it ends up crushed inside the barn. Relativity forbids perfectly rigid bodies.`,
            },
          ],
          recap: [
            'In the barn frame the contracted ladder fits; in the ladder’s frame the barn is even shorter.',
            'The resolution is simultaneity: the doors close at the same time only in the barn’s frame.',
            'Perfectly rigid objects can’t exist, since signals can’t travel faster than light.',
          ],
        },
      ],
    },
  ],
};
