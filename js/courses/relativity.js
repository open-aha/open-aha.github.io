import { fix } from '../lib/svg.js';

const r = String.raw;
const gamma = (b) => 1 / Math.sqrt(1 - b * b);
// live readouts keep a fixed 3 decimals, so they never change length (DESIGN.md, Live numbers)
const f3 = (v) => fix(v, 3);

const addV = (v, w) => (v + w) / (1 + v * w);
// 400 stars scattered evenly over the sky: [cos θ, φ], with θ measured from the ship's direction of travel
const STARS = (() => { let a = 2024; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; return Array.from({ length: 400 }, () => [2 * u() - 1, 2 * Math.PI * u()]); })();
const aberrate = (c, b) => (c + b) / (1 + b * c); // cos of the angle a star appears at, seen from a ship moving at βc
const dopplerAt = (c2, b) => 1 / (gamma(b) * (1 - b * c2)); // frequency factor for light arriving from apparent angle θ'

export default {
  id: 'relativity',
  subject: 'physics',
  title: 'Special Relativity',
  level: 'Advanced',
  cover: 'relativity',
  tagline: 'Light’s speed limit, slowing clocks, shrinking rulers, starbows and E = mc².',
  description: r`Follow Einstein's reasoning from one strange fact (everyone measures the same speed of light) to its astonishing consequences: moving clocks run slow, moving objects shrink, "at the same time" depends on who's asking, and mass is a form of energy. Then fly through a starfield at near light speed and follow protons around the Large Hadron Collider.`,
  prereq: 'Motion, and Energy',
  chapters: [
    {
      title: 'Light and Time',
      summary: 'A constant speed of light changes everything.',
      lessons: [
        {
          id: 'speed-limit',
          title: 'The Speed of Light',
          summary: 'The same for everyone',
          icon: 'bolt',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Throw on a train',
              prompt: 'You’re on a train moving at 30 m/s and throw a ball forward at 10 m/s (relative to you). How fast is the ball moving relative to the ground?',
              unit: 'm/s',
              answer: 40,
              wrong: [{ v: 20, why: 'Both velocities point forward, so they add.' }, { v: 10, why: 'That’s its speed relative to you. The train is also moving.' }],
              explain: r`Velocities add: $30 + 10 = 40$ m/s. That's everyday experience, and it works perfectly at everyday speeds.`,
            },
            {
              type: 'mcq',
              title: 'Headlights',
              prompt: 'Now the train is moving at half the speed of light and switches on its headlight. How fast does the light travel, as measured by someone on the ground?',
              choices: [
                { t: 'Exactly c, the normal speed of light', ok: true },
                { t: '1.5c', why: 'That’s what adding velocities would predict, but experiments show it’s wrong. Light is special.' },
                { t: '0.5c', why: 'The light doesn’t lose speed. Everyone measures it moving at exactly c.' },
              ],
              explain: r`Every observer measures light at exactly $c \approx 3 \times 10^8$ m/s, however fast they or the source are moving. In 1887, Michelson and Morley searched for changes in light's speed as Earth moves around the Sun, and found none.`,
            },
            {
              type: 'explain',
              title: 'Einstein’s two postulates (1905)',
              body: r`1. The laws of physics are the same for everyone moving at a constant velocity. No experiment can tell whether you're "really" moving.
2. The speed of light in a vacuum, $c$, is the same for all such observers.

Both sound harmless. But together they force space and time themselves to behave in strange ways. If everyone must agree on the speed of light, they must **disagree** about distances and durations.`,
            },
            {
              type: 'mcq',
              title: 'The speed limit',
              body: r`At high speeds, velocities don't simply add. Instead they combine like this:
$$u = \frac{v + w}{1 + vw/c^2}$$`,
              prompt: 'A spaceship moving at 0.8c fires a probe forward at 0.8c (relative to the ship). How fast is the probe moving, as measured from Earth?',
              choices: [
                { t: 'About 0.98c', ok: true },
                { t: '1.6c', why: r`That's simple addition. Relativistic addition gives $\frac{1.6}{1 + 0.64}$.` },
                { t: 'Exactly c', why: r`Close, but $\frac{1.6c}{1.64} \approx 0.976c$, still below $c$.` },
              ],
              explain: r`$u = \frac{0.8 + 0.8}{1 + 0.64}c = \frac{1.6}{1.64}c \approx 0.976c$. However you combine speeds below $c$, the result stays below $c$. At everyday speeds, $vw/c^2$ is tiny, so ordinary addition works fine.`,
            },
            {
              type: 'interactive',
              title: 'Aim the probe',
              body: r`A ship moves at $0.5c$ relative to Earth and fires a probe forward. Choose the probe's speed relative to the ship so that Earth measures it at exactly $0.9c$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, grid: false, height: 280, axes: { xlabel: 'probe speed relative to ship (c)', ylabel: 'speed seen from Earth (c)', xticks: 0.25, yticks: 0.25 },
                params: { w: { min: 0, max: 1, step: 0.001, value: 0.4, label: 'probe speed', color: 'coral', format: (v) => `${v.toFixed(3)}c` } },
                curves: [{ f: (x) => Math.min(1.05, 0.5 + x), color: 'muted', dash: true }, { f: (x) => addV(0.5, x), color: 'violet', width: 3 }, { f: () => 0.9, color: 'teal', dash: true }],
                points: [{ x: (p) => p.w, y: (p) => addV(0.5, p.w), color: 'coral' }],
                readout: (p) => `Earth measures **${addV(0.5, p.w).toFixed(3)}c** (simple addition would give ${(0.5 + p.w).toFixed(3)}c)`,
                goal: (p) => Math.abs(addV(0.5, p.w) - 0.9) < 0.002,
                hint: 'Simple addition says 0.4c, but the relativistic curve bends below the dashed line. Go higher.',
                solution: { w: 0.727 },
              },
              explain: r`It takes $w \approx 0.727c$, not $0.4c$: solving $\frac{0.5 + w}{1 + 0.5w} = 0.9$ gives $w = \frac{0.4}{0.55}$. Notice the violet curve reaches exactly $c$ when $w = c$: light fired from the ship still moves at $c$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Head-on',
              prompt: r`Two ships approach each other, each moving at $0.6c$ relative to Earth. How fast does one ship see the other approaching? (As a fraction of $c$, 3 decimal places.)`,
              unit: 'c',
              answer: 1.2 / 1.36,
              tol: 0.002,
              wrong: [{ v: 1.2, why: r`Faster than light isn't possible. Use $\frac{v + w}{1 + vw/c^2}$.` }, { v: 0.6, why: 'That’s each ship’s speed relative to Earth.' }],
              explain: r`$\frac{0.6 + 0.6}{1 + 0.36} = \frac{1.2}{1.36} \approx 0.882c$. Earth sees the gap between them closing at $1.2c$, which is allowed: no single object moves faster than light. But each ship measures the other at under $c$.`,
            },
          ],
          recap: [
            'Everyone measures the same speed of light, c ≈ 3 × 10⁸ m/s.',
            'The laws of physics are the same for all observers moving at constant velocity.',
            'Velocities combine so that nothing with mass reaches c.',
          ],
        },
        {
          id: 'time-dilation',
          title: 'Moving Clocks Run Slow',
          summary: 'The light clock',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The light clock',
              body: r`A **light clock** ticks each time a pulse of light bounces between two mirrors. This clock rides on a fast train. From the ground, watch the pulse's path. Increase the train's speed $\beta = v/c$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 8, ymin: -0.4, ymax: 1.6, grid: false, axes: false, height: 260,
                animate: { param: 't', speed: 1, autoplay: true },
                params: { b: { min: 0, max: 0.95, step: 0.05, value: 0.6, label: r`$\beta$`, color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                extra: ({ plot, p, s }) => {
                  const c = 1.2, L = 1; // units per second
                  const vy = c * Math.sqrt(1 - p.b * p.b);
                  const half = L / vy; // time per one-way trip (ground frame)
                  const period = 8 / Math.max(p.b * c, 0.4); // wrap-around time
                  const t = p.t % period;
                  const xc = 0.5 + ((p.b * c * t) % 7);
                  const leg = Math.floor(t / half);
                  const frac = (t % half) / half;
                  const yPulse = leg % 2 === 0 ? frac * L : L - frac * L;
                  const els = [];
                  // trail of the zig-zag path
                  const pts = [];
                  for (let k = 0; k <= leg; k++) {
                    const tk = Math.min(t, k * half);
                    pts.push([xc - p.b * c * (t - tk), k % 2 === 0 ? 0 : L]);
                  }
                  pts.push([xc, yPulse]);
                  els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`).join(''), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }));
                  els.push(s('rect', { x: plot.X(xc - 0.35), y: plot.Y(L + 0.12), width: plot.X(0.7) - plot.X(0), height: 6, class: 'fl-ink' }));
                  els.push(s('rect', { x: plot.X(xc - 0.35), y: plot.Y(-0.02), width: plot.X(0.7) - plot.X(0), height: 6, class: 'fl-ink' }));
                  els.push(s('circle', { cx: plot.X(xc), cy: plot.Y(yPulse), r: 7, class: 'fl-amber' }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(8), y1: plot.Y(-0.25), y2: plot.Y(-0.25), stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  return els;
                },
                readout: (p) => r`From the ground, each tick takes $\gamma = ${f3(gamma(p.b))}$ times longer than on the train`,
              },
              after: r`On the train, the light goes straight up and down. From the ground, it travels a longer, **diagonal** path, but at the **same speed** $c$. So each tick takes longer as seen from the ground: the moving clock runs slow.`,
            },
            {
              type: 'explain',
              title: 'The time dilation formula',
              body: r`Let one tick take time $t_0$ on the train, so the mirrors are $ct_0/2$ apart. From the ground the tick takes $t$, and the train moves $vt$ during it. Pythagoras on the diagonal path gives
$$(ct)^2 = (ct_0)^2 + (vt)^2 \quad\Rightarrow\quad t = \frac{t_0}{\sqrt{1 - v^2/c^2}} = \gamma\, t_0$$
The **Lorentz factor** $\gamma = \frac{1}{\sqrt{1 - v^2/c^2}}$ is always at least 1. It's tiny above 1 at everyday speeds, and it shoots up toward infinity as $v \to c$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 8, grid: 0.1, gridY: 1, height: 260, axes: { xlabel: 'v / c', ylabel: 'γ' },
                curves: [{ f: (b) => (b < 0.995 ? gamma(b) : NaN), color: 'coral', from: () => 0, to: () => 0.993 }],
              },
            },
            {
              type: 'numeric',
              title: 'Compute γ',
              prompt: r`What is $\gamma$ for a speed of $0.6c$?`,
              answer: 1.25,
              wrong: [{ v: 0.8, why: r`That's $\sqrt{1 - 0.36}$. Then take 1 divided by it.` }, { v: 1.6, why: r`$\gamma = \frac{1}{\sqrt{1 - 0.6^2}} = \frac{1}{0.8}$.` }],
              explain: r`$\gamma = \frac{1}{\sqrt{1 - 0.36}} = \frac{1}{0.8} = 1.25$. A clock moving at $0.6c$ ticks 1.25 times slower.`,
            },
            {
              type: 'numeric',
              title: 'Space trip',
              prompt: r`An astronaut travels at $0.6c$ for what Earth measures as 10 years. How much does the astronaut age during the trip?`,
              unit: 'years',
              answer: 8,
              wrong: [{ v: 12.5, why: r`The **moving** clock (the astronaut) runs slow, so they age *less*: $10 / 1.25$.` }, { v: 10, why: r`Time dilation: the astronaut's clock runs slow by $\gamma = 1.25$.` }],
              explain: r`$t_0 = t / \gamma = 10 / 1.25 = 8$ years. When the astronaut returns, they're 2 years younger than a twin who stayed home. This is the famous **twin paradox**, and it really happens (on a tiny scale, it has been measured with atomic clocks on aeroplanes).`,
            },
            {
              type: 'numeric',
              title: 'GPS clocks',
              prompt: r`GPS satellites move at about 3.9 km/s. Their clocks run slow by a fraction of about $\frac{v^2}{2c^2}$. How many microseconds do they lose per day from this effect? (1 decimal place.)`,
              unit: 'µs',
              answer: (3.9e3) ** 2 / (2 * 9e16) * 86400 * 1e6,
              tol: 0.1,
              explain: r`$\frac{(3900)^2}{2 \times 9 \times 10^{16}} \times 86{,}400 \approx 7.3$ µs per day. (Weaker gravity up there makes them run fast by about 45 µs, so overall they gain about 38 µs a day, which the system corrects for.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Muons',
              body: r`Cosmic rays create particles called muons about 15 km up in the atmosphere. A muon at rest lives only about 2.2 microseconds on average, enough time to travel just 660 m even at nearly light speed.`,
              prompt: 'Yet huge numbers of muons reach the ground. How?',
              choices: [
                { t: 'Moving at about 0.999c, their internal clocks run about 20 times slower', ok: true },
                { t: 'They travel faster than light', why: 'Nothing with mass can travel faster than light.' },
                { t: 'They are created close to the ground', why: 'Most are created around 15 km up, high in the atmosphere.' },
              ],
              explain: r`At $0.999c$, $\gamma \approx 22$, so from our point of view their 2.2 μs lifetime stretches to about 50 μs, which is time enough to cover 15 km. Muon detectors confirm time dilation every day. GPS satellites also correct for relativity: without it, positions would drift by about 10 km per day.`,
            },
          ],
          recap: [
            r`Moving clocks run slow: $t = \gamma t_0$, where $\gamma = 1/\sqrt{1 - v^2/c^2}$.`,
            'The light clock shows why: the same speed of light along a longer path means a longer tick.',
            'Confirmed by muons, atomic clocks on aeroplanes, and GPS.',
          ],
        },
      ],
    },
    {
      title: 'Space, Simultaneity and Energy',
      summary: 'Shrinking lengths, relative “now”, and E = mc².',
      lessons: [
        {
          id: 'length-contraction',
          title: 'Shrinking Rulers',
          summary: 'Length contraction',
          icon: 'pencil',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The muon’s view',
              body: r`From the muon's own point of view it's at rest, and it lives only 2.2 μs. Yet it still reaches the ground.`,
              prompt: 'How does the muon explain the trip?',
              choices: [
                { t: 'From its view the atmosphere is moving and is squashed to about 1/22 of its thickness', ok: true },
                { t: 'From its view it lives longer', why: 'In its own frame its clock ticks normally: 2.2 μs. Something else must change.' },
                { t: 'It can’t explain it', why: 'Both views must agree that the muon reaches the ground. In the muon’s frame, the distance shrinks.' },
              ],
              explain: r`In the muon's frame, the atmosphere rushes past at $0.999c$, and moving lengths **contract** by $\gamma$. Fifteen kilometres of air becomes less than 700 m, short enough to cross in 2.2 μs. Both views agree on what happens.`,
            },
            {
              type: 'explain',
              title: 'Length contraction',
              body: r`An object moving at speed $v$ is shorter in its direction of motion, by the Lorentz factor:
$$L = \frac{L_0}{\gamma}$$
where $L_0$ is its length measured at rest (its **proper length**). Only the length along the direction of motion shrinks. Widths and heights stay the same.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3, grid: false, axes: false, height: 200,
                params: { b: { min: 0, max: 0.99, step: 0.01, value: 0.8, label: r`$\beta$`, color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                extra: ({ plot, p, s }) => {
                  const L = 8 / gamma(p.b);
                  return [
                    s('rect', { x: plot.X(1), y: plot.Y(2.6), width: plot.X(8) - plot.X(0), height: plot.Y(0) - plot.Y(0.8), rx: 10, fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '6 5', 'stroke-width': 2 }),
                    s('rect', { x: plot.X(1), y: plot.Y(1.4), width: plot.X(L) - plot.X(0), height: plot.Y(0) - plot.Y(0.8), rx: 10, class: 'fl-coral', opacity: 0.8 }),
                    s('text', { x: plot.X(1), y: plot.Y(2.75), class: 'tick', text: 'at rest' }),
                    s('text', { x: plot.X(1), y: plot.Y(0.35), class: 'tick', text: 'moving' }),
                  ];
                },
                readout: (p) => r`length $= \dfrac{L_0}{${f3(gamma(p.b))}} = ${f3(1 / gamma(p.b))}\,L_0$`,
              },
            },
            {
              type: 'numeric',
              title: 'Moving spaceship',
              prompt: r`A spaceship is 100 m long when at rest. How long does it measure as it flies past Earth at $0.8c$?`,
              unit: 'm',
              answer: 60,
              wrong: [{ v: 166.7, tol: 0.5, why: r`Moving objects get **shorter**: $100 / \gamma$, with $\gamma = \frac{1}{0.6}$.` }, { v: 80, why: r`$\gamma$ at $0.8c$ is $\frac{1}{\sqrt{1 - 0.64}} = \frac{1}{0.6}$.` }],
              explain: r`$\gamma = \frac{1}{\sqrt{1 - 0.64}} = \frac{1}{0.6} \approx 1.667$, so $L = 100 \times 0.6 = 60$ m.`,
            },
            {
              type: 'interactive',
              title: 'Half the length',
              body: r`How fast must the 100 m spaceship fly past Earth to measure only **50 m**?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 105, grid: false, height: 260, axes: { xlabel: 'speed (c)', ylabel: 'measured length (m)', xticks: 0.25, yticks: 25 },
                params: { b: { min: 0, max: 0.99, step: 0.001, value: 0.5, label: 'speed', color: 'coral', format: (v) => `${v.toFixed(3)}c` } },
                curves: [{ f: (x) => (x < 1 ? 100 * Math.sqrt(1 - x * x) : 0), color: 'violet', width: 3, n: 300 }, { f: () => 50, color: 'teal', dash: true }],
                points: [{ x: (p) => p.b, y: (p) => 100 / gamma(p.b), color: 'coral' }],
                readout: (p) => `at ${p.b.toFixed(3)}c: $\\gamma = ${gamma(p.b).toFixed(3)}$, length **${(100 / gamma(p.b)).toFixed(1)} m**`,
                goal: (p) => Math.abs(100 / gamma(p.b) - 50) < 0.3,
                hint: r`You need $\gamma = 2$, so $\sqrt{1 - \beta^2} = \frac12$.`,
                solution: { b: 0.866 },
              },
              explain: r`Halving the length needs $\gamma = 2$: $\sqrt{1 - \beta^2} = \frac12$, so $\beta = \frac{\sqrt3}{2} \approx 0.866$. The curve is a quarter circle: $L/L_0 = \sqrt{1 - \beta^2}$. Contraction is tiny until about $0.5c$ (13%), then plunges.`,
            },
            {
              type: 'numeric',
              title: 'A cosmic ray’s galaxy',
              prompt: r`The most energetic cosmic-ray protons have $\gamma \approx 10^{10}$. The Milky Way is about 100,000 light-years across. In the proton's own frame, how long does it take to cross the galaxy? (In minutes.)`,
              unit: 'minutes',
              answer: (100000 * 365.25 * 24 * 60) / 1e10,
              relTol: 0.03,
              wrong: [{ v: 100000 * 365.25 * 24 * 60, relTol: 0.03, why: r`That's Earth's view. In the proton's frame the galaxy is contracted by $\gamma = 10^{10}$.` }],
              hint: r`In Earth's frame the trip takes 100,000 years. Divide by $\gamma$, and convert to minutes.`,
              explain: r`$\frac{100{,}000 \text{ years}}{10^{10}} = 10^{-5}$ years $\approx 5.3$ minutes. To the proton, the galaxy is squashed to a disc only about 5 light-minutes across. Earth's view (time dilation) and the proton's (length contraction) give the same 5.3 minutes on its clock.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Who’s right?',
              prompt: 'The astronaut on that ship measures it as 100 m long, and Earth measures it as 60 m. Who is correct?',
              choices: [
                { t: 'Both: length depends on the observer’s motion', ok: true },
                { t: 'The astronaut, because they’re measuring the real length', why: 'Neither frame is special. 100 m is the ship’s length in its own frame, called its "proper" length, but Earth’s 60 m is just as valid.' },
                { t: 'Earth', why: 'Earth’s frame isn’t special either. To the astronaut, Earth’s rulers are the ones that look contracted.' },
              ],
              explain: r`Lengths, like durations, depend on the observer. There's no single "true" length, just as there's no single "true" velocity. The **proper length** (measured in the object's rest frame) is simply the longest.`,
            },
          ],
          recap: [
            r`Moving objects contract along their direction of motion: $L = L_0/\gamma$.`,
            'Time dilation in one frame is length contraction in another, and both agree on what happens.',
            'Neither frame is “right”: lengths and times depend on the observer.',
          ],
        },
        {
          id: 'simultaneity',
          title: 'What Is “Now”?',
          summary: 'The relativity of simultaneity',
          icon: 'question',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Lightning strikes',
              body: r`A train speeds along a track. Lightning strikes both ends of the train. Ana stands on the platform, exactly halfway between the strikes, and the light from both flashes reaches her at the same moment. So for her, the strikes were simultaneous.

Ben sits in the middle of the train, which is moving toward the front strike.`,
              prompt: 'Which flash reaches Ben first?',
              choices: [
                { t: 'The flash from the front of the train', ok: true },
                { t: 'The flash from the back', why: 'Ben is moving toward the front flash and away from the back one, so the front light reaches him sooner.' },
                { t: 'Both at once', why: 'Ben moves while the light travels, so the two flashes cover different distances to reach him.' },
              ],
              explain: r`Ben rides toward the front flash, so it reaches him first. But Ben is in the middle of the train, and in his frame light moves at $c$ in both directions. So he concludes the front strike **happened first**.`,
            },
            { /*anim:relativity*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Two flashes, two passengers',
              body: r`Seen from the platform: lightning strikes both ends of the train at the same moment, just as {blue:Ben} (in the middle of the train, moving right at half the speed of light) passes {coral:Ana} (standing on the platform). The {amber:flashes} spread out from where each strike hit the ground, at the speed of light.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 2.6, ymin: -0.75, ymax: 0.85, grid: false, axes: false, maxWidth: 620,
                animate: { param: 't', speed: 0.45, max: 2.6, autoplay: true },
                extra: ({ plot, p, s }) => {
                  // units: half the train's length (as seen from the platform) is 1, light speed is 1, the train moves at 0.5
                  const t = Math.max(0, p.t - 0.25), bx = 0.5 * t, els = [];
                  const T = (x, y, text, col) => s('text', { x: plot.X(x), y: plot.Y(y), 'text-anchor': 'middle', class: 'halo-text', style: `font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--${col})`, text });
                  els.push(s('line', { x1: plot.X(-1.6), x2: plot.X(2.6), y1: plot.Y(-0.35), y2: plot.Y(-0.35), stroke: 'var(--ink-2)', 'stroke-width': 2.5 }));
                  els.push(s('rect', { x: plot.X(bx - 1), y: plot.Y(0.3), width: plot.X(2) - plot.X(0), height: plot.Y(-0.3) - plot.Y(0.3), rx: 8, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  // scorch marks where the bolts hit the ground
                  for (const x of [-1, 1]) els.push(s('path', { d: `M${plot.X(x) - 7} ${plot.Y(-0.35)}l7 -9l7 9`, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.5 }));
                  if (p.t < 0.45) for (const x of [-1, 1]) els.push(s('path', { d: `M${plot.X(x) + 6} ${plot.Y(0.85)}L${plot.X(x) - 4} ${plot.Y(0.3)}L${plot.X(x) + 5} ${plot.Y(0.3)}L${plot.X(x) - 5} ${plot.Y(-0.3)}`, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 3 }));
                  // the flashes, as dots of light travelling left and right from each strike
                  for (const x0 of [-1, 1]) for (const dir of [-1, 1]) {
                    const x = x0 + dir * t;
                    if (t > 0 && x > -1.6 && x < 2.6) els.push(s('circle', { cx: plot.X(x), cy: plot.Y(0), r: 6, class: 'fl-amber' }));
                  }
                  // Ana at 0 sees both at t = 1; Ben meets the front flash at t = 2/3 and the back one at t = 2
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(-0.5), r: 9, class: 'fl-coral' }));
                  els.push(T(0, -0.7, 'Ana', 'coral'));
                  els.push(s('circle', { cx: plot.X(bx), cy: plot.Y(0), r: 9, class: 'fl-blue' }));
                  els.push(T(bx, 0.42, 'Ben', 'blue'));
                  return els;
                },
                readout: (p) => { const t = Math.max(0, p.t - 0.25), seen = (a, b) => (t >= a ? `{${b}:saw it}` : 'waiting'); return `Ben: front flash ${seen(2 / 3, 'blue')}, back flash ${seen(2, 'blue')} · Ana: both ${t >= 1 ? '{coral:arrive together}' : 'on their way'}`; },
              },
              after: r`Ana gets both flashes at once and, being halfway between the scorch marks, rightly concludes the strikes were simultaneous. Ben rides towards the front flash and away from the back one, so the front flash reaches him first. In his own frame he is at rest in the middle of the train, and light travels at the same speed both ways, so he concludes, just as rightly, that the front strike happened **first**. Neither is mistaken: "at the same time" depends on who is asking.`,
            },
            {
              type: 'explain',
              title: 'No universal “now”',
              body: r`Ana says the strikes were simultaneous. Ben says the front one came first. **Both are right** in their own frames. Two events that are simultaneous for one observer generally aren't for another observer moving relative to them.

This **relativity of simultaneity** is the key to all the "paradoxes" of relativity. It's why time dilation and length contraction don't contradict each other.`,
            },
            {
              type: 'mcq',
              title: 'Cause and effect',
              prompt: 'If observers can disagree about the order of events, could someone see an effect happen before its cause?',
              choices: [
                { t: 'No: only events too far apart for light to connect can swap order', ok: true },
                { t: 'Yes, for fast enough observers', why: 'If a signal (at or below light speed) can travel from one event to the other, every observer agrees on their order.' },
              ],
              explain: r`The order can only flip for events so far apart that not even light could travel from one to the other in time. Those events can't influence each other. So causes always come before their effects, for everyone. That's also why nothing can travel faster than light: if it could, effects could come before their causes.`,
            },
            {
              type: 'interactive',
              title: 'Tilting “now”',
              body: r`Event A happens at $x = 0$, $t = 0$; event B at $x = 2$ light-seconds, $t = 1$ s (Earth's frame). For an observer moving at speed $\beta$, the line of events happening "now", at the same time as A, tilts with slope $\beta$ (dashed). Find the speed for which A and B are **simultaneous**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 3.5, ymin: -1, ymax: 2.5, grid: 1, height: 340, axes: { xlabel: 'x (light-seconds)', ylabel: 't (s)' },
                params: { b: { min: 0, max: 0.9, step: 0.01, value: 0.2, label: 'observer speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [{ f: (x, p) => p.b * x, color: 'coral', dash: true }, { f: (x, p) => x / p.b, from: 0, to: (p) => Math.min(3.5, 2.5 * p.b), color: 'coral', width: 3 }, { f: (x) => x, from: 0, to: 2.5, color: 'amber', dash: true }],
                points: [{ x: () => 0, y: () => 0, color: 'blue' }, { x: () => 2, y: () => 1, color: 'violet' }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(0) - 14, y: plot.Y(0) - 10, class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px));font-weight:700', text: 'A' }), s('text', { x: plot.X(2) + 12, y: plot.Y(1) - 10, class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px));font-weight:700', text: 'B' })],
                readout: (p) => { const dt = gamma(p.b) * (1 - 2 * p.b); return `for this observer, B happens **${Math.abs(dt) < 0.005 ? 'at the same time as' : `${Math.abs(dt).toFixed(2)} s ${dt > 0 ? 'after' : 'before'}`}** A`; },
                goal: (p) => Math.abs(p.b - 0.5) < 0.005,
                hint: r`B lies on the "now" line $t = \beta x$ when $1 = 2\beta$.`,
                solution: { b: 0.5 },
              },
              explain: r`At $0.5c$ the "now" line passes through B: A and B are simultaneous. Faster observers say B came **first**. The order can flip because B lies outside A's light cone (the amber line is a light ray from A): light needs 2 s to cover 2 light-seconds, but B happens after only 1 s. The solid coral line is the observer's own path through spacetime.`,
            },
            {
              type: 'numeric',
              title: 'How much disagreement?',
              prompt: r`Two events are simultaneous in Earth's frame and 1 light-second apart. A ship flies along the line joining them at $0.6c$ ($\gamma = 1.25$). The time between them in the ship's frame is $\gamma \beta \times$ (distance in light-seconds). How many seconds is that?`,
              unit: 's',
              answer: 0.75,
              tol: 0.005,
              wrong: [{ v: 0.6, why: r`Include $\gamma = 1.25$: $1.25 \times 0.6 \times 1$.` }, { v: 0, why: 'They’re simultaneous for Earth, but not for the ship.' }],
              explain: r`$1.25 \times 0.6 \times 1 = 0.75$ s. The disagreement grows with distance: for events far apart, even slow observers disagree noticeably about what's happening "now" there.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Now on Andromeda',
              prompt: r`Two people pass each other on a street, walking at 1.4 m/s in opposite directions. How different are their "nows" on the Andromeda galaxy, 2.5 million light-years away? Use $\Delta t \approx \frac{v}{c} \times$ distance, with relative speed $v = 2.8$ m/s and $c = 3 \times 10^8$ m/s. Answer in days.`,
              unit: 'days',
              answer: (2.8 / 3e8) * 2.5e6 * 365.25,
              relTol: 0.03,
              wrong: [{ v: (1.4 / 3e8) * 2.5e6 * 365.25, relTol: 0.03, why: 'Use the relative speed of the two walkers, 2.8 m/s.' }],
              hint: r`$\frac{2.8}{3 \times 10^8} \times 2.5 \times 10^6$ years, then convert to days.`,
              explain: r`$\frac{2.8}{3 \times 10^8} \times 2.5 \times 10^6$ years $\approx 0.023$ years, about **8.5 days**. This is Roger Penrose's "Andromeda paradox": the two walkers' sets of "events happening now" on Andromeda differ by over a week. No paradox arises, because neither can see or affect Andromeda for 2.5 million years.`,
            },
          ],
          recap: [
            'Events that are simultaneous in one frame need not be simultaneous in another.',
            'This resolves the apparent paradoxes of relativity.',
            'Cause and effect are protected because nothing travels faster than light.',
          ],
        },
        {
          id: 'emc2',
          title: 'E = mc²',
          summary: 'Mass is energy',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Pushing harder',
              prompt: 'You keep pushing a spaceship with a constant force. Its speed approaches c but never reaches it. Where does all the extra energy go?',
              choices: [
                { t: 'Into the ship’s energy, which grows without limit as v → c', ok: true },
                { t: 'It’s lost as heat', why: 'In empty space, nothing takes it away as heat. The ship’s energy keeps growing.' },
                { t: 'Nowhere: the push stops working', why: 'The force still does work. The energy goes in, but the speed hardly changes.' },
              ],
              explain: r`The ship's energy is $E = \gamma m c^2$, which grows without limit as $v \to c$. Even an infinite amount of energy can't quite reach $c$. And when $v = 0$, the energy doesn't vanish: $E = mc^2$.`,
            },
            {
              type: 'explain',
              title: 'Rest energy',
              body: r`Einstein's most famous equation says that an object at rest contains energy:
$$E = mc^2$$
Since $c^2 = 9 \times 10^{16}$ m²/s² is enormous, a tiny amount of mass corresponds to a vast amount of energy.

In nuclear reactions, the products weigh slightly **less** than what went in. The "missing" mass comes out as energy. Chemical reactions do the same, but the mass change is far too small to measure.`,
            },
            {
              type: 'numeric',
              title: 'One gram',
              prompt: r`How much energy is equivalent to 1 gram (0.001 kg) of mass? Give the answer in units of $10^{13}$ J. ($c = 3 \times 10^8$ m/s)`,
              unit: r`$\times 10^{13}$ J`,
              answer: 9,
              wrong: [{ v: 0.03, tol: 0.001, why: r`Square $c$: $c^2 = 9 \times 10^{16}$.` }, { v: 9000, why: 'Use kilograms: 1 g = 0.001 kg.' }],
              explain: r`$E = 0.001 \times (3 \times 10^8)^2 = 9 \times 10^{13}$ J, about the energy released by 21,000 tonnes of TNT, or the electricity a typical home uses in thousands of years.`,
            },
            {
              type: 'numeric',
              title: 'How the Sun shines',
              prompt: r`The Sun radiates about $3.8 \times 10^{26}$ W. How much mass does it convert to energy every second? Give the answer in billions of kg.`,
              unit: 'billion kg/s',
              answer: 3.8e26 / 9e16 / 1e9,
              tol: 0.1,
              wrong: [{ v: 1.27e18 / 1e9, tol: 1e6, why: r`Divide by $c^2$, not $c$.` }],
              explain: r`$m = \frac{E}{c^2} = \frac{3.8 \times 10^{26}}{9 \times 10^{16}} \approx 4.2 \times 10^9$ kg every second. That's over 4 million tonnes per second, turned into sunlight by fusing hydrogen into helium. The Sun is so massive it can keep this up for billions of years.`,
            },
            {
              type: 'interactive',
              title: 'When Newton breaks down',
              body: r`Newton’s kinetic energy is $\frac12 mv^2$. Einstein’s is $(\gamma - 1)mc^2$, with $\gamma = 1/\sqrt{1 - v^2/c^2}$. They agree at low speed. Find the speed at which Einstein’s value is **twice** Newton’s.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 3, grid: false, height: 260, axes: { xlabel: 'speed (fraction of c)', ylabel: 'kinetic energy (units of mc²)', xticks: 0.2, yticks: 0.5 },
                params: { b: { min: 0.01, max: 0.95, step: 0.001, value: 0.5, label: 'speed', color: 'coral', format: (v) => `${v.toFixed(3)} c` } },
                curves: [{ f: (x) => 0.5 * x * x, color: 'blue', width: 3 }, { f: (x) => 1 / Math.sqrt(1 - x * x) - 1, color: 'violet', width: 3, to: 0.97 }],
                points: [{ x: (p) => p.b, y: (p) => 0.5 * p.b * p.b, color: 'blue' }, { x: (p) => p.b, y: (p) => 1 / Math.sqrt(1 - p.b * p.b) - 1, color: 'violet' }],
                readout: (p) => { const N = 0.5 * p.b * p.b, E = 1 / Math.sqrt(1 - p.b * p.b) - 1; return `Newton (blue) ${N.toFixed(3)} · Einstein (violet) ${E.toFixed(3)} · ratio **${(E / N).toFixed(3)}**`; },
                goal: (p) => { const N = 0.5 * p.b * p.b, E = 1 / Math.sqrt(1 - p.b * p.b) - 1; return Math.abs(E / N - 2) < 0.005; },
                hint: 'Look where the violet curve is twice as high as the blue one.',
                solution: { b: 0.786 },
              },
              explain: r`At about $0.79c$ the true kinetic energy is double Newton’s estimate, and as $v \to c$ it grows without limit, which is why no amount of energy can push a massive object to light speed. At everyday speeds the two agree to many decimal places.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Hot coffee',
              prompt: 'Does a cup of coffee weigh more when it’s hot than when it’s cold?',
              choices: [
                { t: 'Yes, by an unmeasurably tiny amount', ok: true },
                { t: 'No: heat has no mass', why: r`All energy counts. The extra thermal energy $E$ adds mass $E/c^2$.` },
                { t: 'Yes, noticeably', why: r`Heating 0.3 kg of coffee by 60 K adds about 75 kJ, which is about $10^{-12}$ kg. Far too small to notice.` },
              ],
              explain: r`Heating 0.3 kg of coffee by about 60 K adds roughly 75,000 J. That's $\frac{75{,}000}{9 \times 10^{16}} \approx 8 \times 10^{-13}$ kg, less than a trillionth of a kilogram. All energy has mass. It's just usually far too small to measure.`,
            },
          ],
          recap: [
            r`$E = mc^2$: mass and energy are two forms of the same thing.`,
            'Nuclear reactions convert measurable amounts of mass into energy, and that powers the Sun.',
            r`The total energy $E = \gamma mc^2$ grows without limit as $v \to c$, so nothing with mass reaches c.`,
          ],
        },
      ],
    },
    {
      title: 'Seeing and Smashing',
      summary: 'What a fast traveller sees, and particle accelerators.',
      lessons: [
        {
          id: 'doppler',
          title: 'The View from a Fast Ship',
          summary: 'Relativistic Doppler shift and aberration',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Light from a moving source',
              body: r`Head toward a light source and its waves arrive squeezed together: higher frequency, bluer light. Relativity adds time dilation to the ordinary Doppler effect, giving a neat formula for approaching at speed $\beta c$:
$$\frac{f_{\text{seen}}}{f_{\text{emitted}}} = \sqrt{\frac{1 + \beta}{1 - \beta}}$$
Moving away, flip the fraction. Wavelengths change by the reciprocal factor.`,
            },
            {
              type: 'numeric',
              title: 'Red becomes ultraviolet',
              prompt: r`You fly toward a red lamp (wavelength 700 nm) at $0.6c$. What wavelength do you see?`,
              unit: 'nm',
              answer: 350,
              tol: 1,
              wrong: [{ v: 1400, why: 'Approaching makes waves shorter, not longer.' }, { v: 280, tol: 1, why: r`The factor is $\sqrt{\frac{1.6}{0.4}} = 2$, so divide by 2.` }],
              explain: r`$\sqrt{\frac{1.6}{0.4}} = 2$, so the wavelength halves to **350 nm**: ultraviolet, invisible to you. Meanwhile infrared from the lamp is shifted into the visible range, so the lamp doesn't simply vanish.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Starbow',
              body: r`This is the whole sky seen from a spaceship: the centre is straight ahead, the dashed ring is directly sideways, and the rim is straight behind. Speed up and watch the stars.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.08, xmax: 1.08, ymin: -1.08, ymax: 1.08, grid: false, axes: false, maxWidth: 420,
                params: { b: { min: 0, max: 0.99, step: 0.01, value: 0, label: 'ship speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [{ param: { x: (t) => Math.cos(t), y: (t) => Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'ink', width: 2 }, { param: { x: (t) => 0.5 * Math.cos(t), y: (t) => 0.5 * Math.sin(t), t0: 0, t1: 2 * Math.PI }, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => { const b = { hot: '', mid: '', cool: '' }; for (const [c, ph] of STARS) { const c2 = aberrate(c, p.b), r = Math.acos(Math.max(-1, Math.min(1, c2))) / Math.PI, D = dopplerAt(c2, p.b), k = D > 1.25 ? 'hot' : D < 0.8 ? 'cool' : 'mid'; b[k] += `M${plot.X(r * Math.cos(ph)).toFixed(1)} ${plot.Y(r * Math.sin(ph)).toFixed(1)}h0`; } return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), fill: '#0d1020' }), s('path', { d: b.cool, stroke: 'var(--coral)', 'stroke-width': 4, 'stroke-linecap': 'round' }), s('path', { d: b.mid, stroke: '#f5f3ea', 'stroke-width': 4, 'stroke-linecap': 'round' }), s('path', { d: b.hot, stroke: '#8fb0ff', 'stroke-width': 5, 'stroke-linecap': 'round' })]; },
                readout: (p) => { const ahead = STARS.filter(([c]) => aberrate(c, p.b) > 0).length; return `stars in the forward half of the sky: **${Math.round(ahead / 4)}%** · straight ahead, light is shifted by ×${Math.sqrt((1 + p.b) / (1 - p.b)).toFixed(2)}`; },
              },
              after: r`The stars crowd toward the direction of travel (**aberration**), as raindrops seem to slant toward you when you run. Stars ahead turn bluer and brighter (blue dots), those behind redder and dimmer (coral). At $0.99c$, nearly every star appears in a small patch ahead: science fiction's "warp-speed" streaks get the direction right.`,
            },
            {
              type: 'numeric',
              title: 'A sideways star',
              prompt: r`A star lies exactly sideways (90° from your direction of travel) in the frame where it's at rest. Moving at speed $\beta c$, you see it at an angle $\theta'$ from straight ahead with $\cos\theta' = \beta$. At $0.8c$, what is $\theta'$? (Nearest degree.)`,
              unit: '°',
              answer: (Math.acos(0.8) * 180) / Math.PI,
              tol: 0.6,
              wrong: [{ v: 90, why: 'Aberration shifts it forward. Solve cos θ′ = 0.8.' }, { v: 53, tol: 0.6, why: r`That's $\arcsin 0.8$. You need $\arccos 0.8$.` }],
              explain: r`$\theta' = \arccos 0.8 \approx 37°$: the star has swung more than halfway toward the front. Astronomers see a tiny version of this effect from Earth's orbital motion (about 20 arcseconds), discovered by James Bradley in 1727.`,
            },
            {
              type: 'mcq',
              title: 'Our motion through the cosmos',
              prompt: r`The cosmic microwave background, light left over from the Big Bang, is very slightly hotter in one direction of the sky and colder in the opposite direction, by about 0.1%. What does that tell us?`,
              choices: [
                { t: 'We are moving relative to the background radiation, at about 370 km/s', ok: true },
                { t: 'The universe is hotter on one side', why: 'A pattern that is exactly hot on one side and cold on the opposite side is the signature of a Doppler shift from our own motion.' },
                { t: 'The light is bent by the Sun', why: 'The Sun’s bending is far too small and wouldn’t make one hemisphere hotter.' },
              ],
              explain: r`Moving toward a direction blueshifts the radiation there, making it look hotter; behind us it's redshifted. The 0.1% "dipole" corresponds to $\beta \approx 0.0012$, about 370 km/s, the combined motion of the Sun, the Milky Way and our galaxy group.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Red light, green light',
              prompt: r`An old physics joke: a driver claims the red traffic light (700 nm) looked green (530 nm) because of the Doppler effect. How fast would they need to be going? (As a fraction of $c$, 2 decimal places.)`,
              unit: 'c',
              answer: (1 - (530 / 700) ** 2) / (1 + (530 / 700) ** 2),
              tol: 0.006,
              wrong: [{ v: 1 - 530 / 700, tol: 0.006, why: 'That’s the non-relativistic estimate. Solve (530/700)² = (1 − β)/(1 + β).' }],
              hint: r`$\left(\frac{530}{700}\right)^2 = \frac{1 - \beta}{1 + \beta} \approx 0.573$. Solve for $\beta$.`,
              explain: r`$\frac{1 - \beta}{1 + \beta} = 0.573$ gives $\beta = \frac{1 - 0.573}{1 + 0.573} \approx 0.27$: about 80,000 km/s. The judge drops the red-light charge and fines the driver for speeding instead.`,
            },
          ],
          recap: [
            r`Approaching at $\beta c$: frequencies multiply by $\sqrt{\frac{1+\beta}{1-\beta}}$.`,
            'Aberration crowds the view toward the direction of travel.',
            'The CMB dipole reveals our motion through the universe at about 370 km/s.',
          ],
        },
        {
          id: 'momentum',
          title: 'Energy at High Speed',
          summary: 'Kinetic energy, momentum and accelerators',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Kinetic energy, corrected',
              body: r`An object's total energy is $E = \gamma mc^2$. Subtract the rest energy to get the energy of motion:
$$K = (\gamma - 1)\,mc^2$$
At low speeds, $\gamma \approx 1 + \tfrac12\beta^2$, so $K \approx \tfrac12 mv^2$: Newton's formula is the slow-speed approximation.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Newton versus Einstein',
              body: r`Compare the two formulas for kinetic energy, in units of $mc^2$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 3, grid: false, height: 280, axes: { xlabel: 'speed (c)', ylabel: 'kinetic energy (mc²)', xticks: 0.25, yticks: 1 },
                params: { b: { min: 0, max: 0.99, step: 0.01, value: 0.5, label: 'speed', color: 'coral', format: (v) => `${v.toFixed(2)}c` } },
                curves: [{ f: (x) => 0.5 * x * x, color: 'blue', dash: true }, { f: (x) => (x < 0.999 ? gamma(x) - 1 : NaN), color: 'violet', width: 3, n: 300 }],
                points: [{ x: (p) => p.b, y: (p) => Math.min(3, gamma(p.b) - 1), color: 'coral' }],
                readout: (p) => { const K = gamma(p.b) - 1, N = 0.5 * p.b * p.b; return `Einstein **${K.toFixed(3)} mc²** · Newton ${N.toFixed(3)} mc² · Newton is off by ${p.b ? Math.round(100 * (1 - N / K)) : 0}%`; },
              },
              after: r`Below about $0.1c$ the curves agree within 1%. Above $0.5c$ Newton badly underestimates, and as $v \to c$ the true energy goes to infinity, which is why no amount of energy can get a massive object to $c$.`,
            },
            {
              type: 'numeric',
              title: 'An old television',
              prompt: r`A cathode-ray TV accelerated electrons through 25,000 volts, giving them 25 keV of kinetic energy. An electron's rest energy is 511 keV. What is $\gamma$? (3 decimal places.)`,
              lhs: r`$\gamma =$`,
              answer: 1 + 25 / 511,
              tol: 0.001,
              wrong: [{ v: 25 / 511, tol: 0.001, why: r`That's $\gamma - 1$. Add 1.` }],
              explain: r`$\gamma = 1 + \frac{25}{511} \approx 1.049$, so the electrons moved at about $0.30c$. TV designers had to account for relativity to aim the beams accurately.`,
            },
            {
              type: 'numeric',
              title: 'The Large Hadron Collider',
              prompt: r`The LHC gives protons a total energy of 6.8 TeV. A proton's rest energy is 0.938 GeV. What is $\gamma$? (Nearest hundred.)`,
              lhs: r`$\gamma =$`,
              answer: 6800 / 0.93827,
              relTol: 0.01,
              wrong: [{ v: 6.8 / 0.938, relTol: 0.01, why: '1 TeV = 1000 GeV. Convert first.' }],
              explain: r`$\gamma = \frac{6800}{0.938} \approx 7{,}250$. Each proton carries the kinetic energy of a flying mosquito, concentrated in a single particle, and a full beam stores as much energy as a 400-tonne train at 150 km/h.`,
            },
            {
              type: 'mcq',
              title: 'Light has momentum',
              body: r`In relativity, energy, momentum $p$ and mass are linked by
$$E^2 = (pc)^2 + (mc^2)^2$$`,
              prompt: r`A photon has no mass. What does the formula say about it?`,
              choices: [
                { t: 'It carries momentum p = E/c, so light can push things', ok: true },
                { t: 'It has no momentum, because it has no mass', why: r`With $m = 0$ the formula gives $E = pc$: the momentum is $E/c$, not zero.` },
                { t: 'Its energy is zero', why: r`Photons carry energy $hf$. With $m = 0$, all of it is energy of motion: $E = pc$.` },
              ],
              explain: r`For massless particles $E = pc$. Sunlight pushes with a pressure of about 9 micronewtons per square metre on a reflective surface: tiny, but enough to drive **solar sails** like Japan's IKAROS probe (2010), and to give comet tails their curve.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Almost light',
              prompt: r`For large $\gamma$, an object's speed falls short of light by about $\dfrac{c}{2\gamma^2}$. How much slower than light (in m/s) is an LHC proton with $\gamma \approx 7250$? ($c = 3.0 \times 10^8$ m/s; 1 decimal place.)`,
              unit: 'm/s',
              answer: 2.998e8 / (2 * 7247.4 ** 2),
              tol: 0.1,
              wrong: [{ v: 2.998e8 / 7247.4 ** 2, tol: 0.1, why: r`Divide by $2\gamma^2$, not $\gamma^2$.` }],
              explain: r`$\frac{3 \times 10^8}{2 \times 7250^2} \approx 2.9$ m/s: the proton is slower than light by about walking pace, at 99.999999% of $c$. Doubling its energy would only shave this to 0.7 m/s. Accelerators add energy, not speed.`,
            },
          ],
          recap: [
            r`Kinetic energy $K = (\gamma - 1)mc^2$, which reduces to $\frac12 mv^2$ at low speed.`,
            r`$E^2 = (pc)^2 + (mc^2)^2$: light has momentum $E/c$.`,
            'Particles in accelerators reach γ in the thousands, within metres per second of c.',
          ],
        },
      ],
    },
  ],
};
