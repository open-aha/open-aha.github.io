import { fix } from '../lib/svg.js';

const r = String.raw;
const G = 9.8;
const fmt1 = (v) => (Math.round(v * 100) / 100).toString();

// braking car: starts at 6 m/s, decelerates with a < 0 until it stops
const V0 = 6;
const brakeX = (t, p) => {
  const ts = V0 / -p.a;
  return t < ts ? V0 * t + 0.5 * p.a * t * t : (V0 * V0) / (2 * -p.a);
};


// stopping: 0.7 s reaction at constant speed, then braking at 7 m/s²
const RT = 0.7, DEC = 7;
const stopX = (t, p) => (t < RT ? p.v * t : t < RT + p.v / DEC ? p.v * RT + p.v * (t - RT) - 0.5 * DEC * (t - RT) ** 2 : p.v * RT + (p.v * p.v) / (2 * DEC));
const stopV = (t, p) => (t < RT ? p.v : Math.max(0, p.v - DEC * (t - RT)));
const stopD = (v) => v * RT + (v * v) / (2 * DEC);
const D2R = Math.PI / 180;

// the monkey hangs 20 m away and 10 m up; the dart is aimed straight at it and the monkey lets go the moment the dart fires
const MONKEY_V = [30, 22, 17];
const monkeyRound = (t) => {
  const D = Math.hypot(20, 10);
  let s = t;
  for (let k = 0; k < 3; k++) { const hit = D / MONKEY_V[k], len = hit + 1.6; if (s < len) return { k, v: MONKEY_V[k], hit, tau: Math.min(s, hit) }; s -= len; }
  return { k: 2, v: MONKEY_V[2], hit: D / MONKEY_V[2], tau: D / MONKEY_V[2] };
};

export default {
  id: 'motion',
  subject: 'physics',
  title: 'Motion',
  level: 'Foundational',
  cover: 'motion',
  tagline: 'Position, velocity and acceleration, from strobe photos to projectiles, stopping distances and moving frames.',
  description: r`Watch things move and learn to describe them precisely. Read motion from strobe pictures and graphs, discover the equations of constant acceleration, predict where a projectile will land, work out how far a car needs to stop, and see how motion looks from a moving frame.`,
  prereq: 'Solving Equations',
  chapters: [
    {
      title: 'Describing Motion',
      summary: 'Where it is, how fast, and how that changes.',
      lessons: [
        {
          id: 'position',
          title: 'Where Is It?',
          summary: 'Position, distance and displacement',
          icon: 'target',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A ball on a track',
              body: r`Press **Play** and watch the ball. The numbers on the track are positions in metres.`,
              widget: {
                kind: 'track', object: 'ball', xmin: -4, xmax: 6, T: 4, tickStep: 1, strobe: 0,
                x: (t) => (t < 1.5 ? 2 * t : 3 - 2 * (t - 1.5)),
                v: (t) => (t < 1.5 ? 2 : -2),
                flags: [{ x: 0, label: 'Start', color: 'teal' }],
              },
              prompt: 'What total distance did the ball travel?',
              unit: 'm',
              answer: 8,
              wrong: [
                { v: 2, why: 'That’s how far it ended up from the start. But it went 3 m one way and then 5 m back, covering more ground than that.' },
                { v: -2, why: 'That’s where it ended up, at −2 m. The question asks how much ground it covered.' },
                { v: 5, why: 'It also went 3 m to the right before turning around.' },
              ],
              explain: r`The ball rolled 3 m to the right (to $x = 3$), then 5 m to the left (to $x = -2$). The total distance is $3 + 5 = 8$ m.`,
            },
            {
              type: 'mcq',
              title: 'But where did it end up?',
              prompt: 'Compared with where it started, where did the ball finish?',
              choices: [
                { t: '2 m to the left of the start', ok: true },
                { t: '2 m to the right of the start', why: 'It went 3 m right but then 5 m left, so it ended up on the left side of the start.' },
                { t: '8 m to the left of the start', why: '8 m is the total ground covered. Part of that trip was spent going right.' },
                { t: 'Back at the start', why: 'It went 5 m back, which is more than the 3 m it went out.' },
              ],
              explain: r`It started at $x = 0$ and finished at $x = -2$ m: 2 m to the left.`,
            },
            {
              type: 'explain',
              title: 'Distance vs. displacement',
              body: r`Physicists track position with a number line: pick an origin ($x = 0$) and a positive direction.

- **Distance** is how much ground you cover. It's never negative.
- **Displacement** is the change in position, final minus initial:
$$\Delta x = x_\text{final} - x_\text{initial}$$

Displacement has a **sign** that tells you the direction. For the ball, $\Delta x = -2 - 0 = -2$ m: two metres in the negative direction.

::: key
Distance asks "how far did you travel?" Displacement asks "how far are you from where you started, and in which direction?"
:::`,
            },
            {
              type: 'numeric',
              title: 'Compute a displacement',
              body: r`A toy car starts at $x = 4$ m and ends at $x = -3$ m.`,
              prompt: r`What is its displacement $\Delta x$?`,
              lhs: r`$\Delta x =$`,
              unit: 'm',
              answer: -7,
              wrong: [
                { v: 7, why: 'The car moved in the negative direction, so its displacement is negative.' },
                { v: 1, why: r`Displacement is final minus initial: $-3 - 4$, not $-3 + 4$.` },
                { v: -1, why: r`Displacement is final minus initial: $-3 - 4 = -7$.` },
              ],
              explain: r`$\Delta x = x_\text{final} - x_\text{initial} = -3 - 4 = -7$ m. The car moved 7 m in the negative direction.`,
            },
            {
              type: 'multi',
              title: 'Round trips',
              prompt: 'Which trips have a displacement of zero? Select all that apply.',
              choices: [
                { t: 'Running exactly one lap of a 400 m track', ok: true },
                { t: 'Walking to school and then back home', ok: true },
                { t: 'Walking 10 m north', why: 'You end up 10 m from where you started, so the displacement is 10 m north.' },
                { t: 'Driving from one city to another', why: 'You end up somewhere new, so your displacement isn’t zero.' },
              ],
              explain: r`Any trip that ends where it started has zero displacement, no matter how long it was. One lap of a 400 m track: distance 400 m, displacement 0.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The elevator',
              body: r`An elevator goes from floor 2 up to floor 9, then down to floor 4. Each floor is 3 m tall.`,
              prompt: 'What total distance did the elevator travel?',
              unit: 'm',
              answer: 36,
              wrong: [
                { v: 6, why: 'That’s its displacement (2 floors up). The elevator travelled 7 floors up and 5 floors down.' },
                { v: 12, why: 'That’s the number of floors travelled. Each floor is 3 m.' },
                { v: 21, why: 'Don’t forget the trip back down from floor 9 to floor 4.' },
              ],
              explain: r`Up 7 floors ($2 \to 9$) and down 5 floors ($9 \to 4$): 12 floors in total, so $12 \times 3 = 36$ m.

Its displacement is only $+2$ floors $= +6$ m (upwards), because it ends 2 floors above where it started.`,
            },
          ],
          recap: [
            'Position is measured from an origin, with a chosen positive direction.',
            r`Displacement is $\Delta x = x_\text{final} - x_\text{initial}$. It has a sign that shows direction.`,
            'Distance is the total ground covered and is never negative.',
          ],
        },
        {
          id: 'velocity',
          title: 'Velocity',
          summary: 'How fast, and which way',
          icon: 'play',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'A strobe photo',
              body: r`A camera flashed once every second as this car drove past, leaving a faint mark each time.`,
              widget: {
                kind: 'track', xmin: 0, xmax: 12, T: 5, tickStep: 1, strobe: 1, startAtEnd: true,
                x: (t) => 2 * t, v: () => 2,
              },
              prompt: 'How fast is the car going?',
              unit: 'm/s',
              answer: 2,
              wrong: [
                { v: 10, why: 'That’s how far it went in total. Speed is distance per second.' },
                { v: 5, why: 'That’s the number of seconds. How many metres does it cover in each one?' },
                { v: 0.5, why: 'That’s seconds per metre. Speed is metres per second.' },
              ],
              explain: r`The marks are 2 m apart and 1 s apart: the car covers 2 m every second, so its speed is 2 m/s.`,
            },
            {
              type: 'explain',
              title: 'Velocity is a slope',
              body: r`**Velocity** is how quickly position changes:
$$v = \frac{\Delta x}{\Delta t}$$

Press **Play**. The graph plots the car's position against time. Steady velocity gives a **straight line**, and the velocity is its **slope**: each second the line rises by 2 m.`,
              widget: {
                kind: 'track', xmin: 0, xmax: 12, T: 5, tickStep: 2, strobe: 1, graphs: ['x'], xg: { ymin: 0, ymax: 12, step: 2 },
                x: (t) => 2 * t, v: () => 2,
              },
            },
            {
              type: 'interactive',
              title: 'Hit the finish line',
              body: r`Set the car's velocity so it reaches the flag at 15 m **exactly** when the timer reaches 5 s. Then press **Play** to test it.`,
              widget: {
                kind: 'track', xmin: 0, xmax: 20, T: 5, tickStep: 2, strobe: 1, graphs: ['x'], xg: { ymin: 0, ymax: 20, step: 5 },
                params: { v: { min: 0, max: 5, step: 0.5, value: 1, label: '$v$', format: (v) => `${fix(v, 1)} m/s` } },
                flags: [{ x: 15, label: 'Finish' }],
                x: (t, p) => p.v * t, v: (t, p) => p.v,
                needRun: true,
                goal: (p) => (p.v === 3 ? true : { ok: false, msg: `At ${p.v} m/s the car reached ${fmt1(p.v * 5)} m after 5 s.` }),
                solution: { v: 3 },
              },
              explain: r`It must cover 15 m in 5 s: $v = \dfrac{15\text{ m}}{5\text{ s}} = 3$ m/s.`,
            },
            {
              type: 'mcq',
              title: 'Read the graph',
              body: r`The graph shows the positions of three cars, A, B and C.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 15, grid: 1, gridY: 3, height: 340,
                axes: { xlabel: 't (s)', ylabel: 'x (m)' },
                curves: [
                  { f: (t) => 3 * t, color: 'coral', to: () => 5 },
                  { f: (t) => t + 4, color: 'blue', to: () => 6 },
                  { f: (t) => 12 - 2 * t, color: 'teal', to: () => 6 },
                ],
                extra: ({ plot, s }) => [
                  s('text', { x: plot.X(4.3), y: plot.Y(13), class: 'lbl fl-coral', text: 'A' }),
                  s('text', { x: plot.X(5.7), y: plot.Y(10.6), class: 'lbl fl-blue', text: 'B' }),
                  s('text', { x: plot.X(5.6), y: plot.Y(1.2), class: 'lbl fl-teal', text: 'C' }),
                ],
              },
              prompt: 'Which car is moving fastest?',
              fixed: true,
              cols: 2,
              choices: [
                { t: 'A', ok: true },
                { t: 'B', why: r`B's line is the flattest of the three: it gains only 1 m each second.` },
                { t: 'C', why: r`C's line slopes downward: it's moving backwards at 2 m/s. A's line is steeper.` },
                { t: 'They all move at the same speed', why: 'The lines have different steepness, so the speeds differ.' },
              ],
              explain: r`Speed is the steepness of the position–time line. A rises 3 m every second (3 m/s). B rises 1 m per second (1 m/s). C *falls* 2 m per second, so it moves in the negative direction at 2 m/s.`,
            },
            {
              type: 'explain',
              title: 'Speed vs. velocity',
              body: r`Car C has a velocity of $-2$ m/s. The minus sign means it's moving in the negative direction.

- **Velocity** includes direction (a sign, in 1D).
- **Speed** is just how fast: the size of the velocity. C's speed is 2 m/s.

For a whole trip, the averages are:
$$\text{average velocity} = \frac{\text{displacement}}{\text{time}}, \qquad \text{average speed} = \frac{\text{distance}}{\text{time}}$$`,
            },
            {
              type: 'numeric',
              title: 'The road trip trap',
              body: r`You drive 60 km at 60 km/h, then another 60 km at 30 km/h.`,
              prompt: 'What is your average speed for the whole trip?',
              unit: 'km/h',
              answer: 40,
              wrong: [{ v: 45, why: r`Averaging 60 and 30 gives 45, but you spent **more time** driving at the slower speed. Work out the total time.` }],
              hint: 'How long did each half of the trip take?',
              explain: r`The first 60 km takes 1 hour. The second 60 km takes 2 hours. That's 120 km in 3 hours:
$$\text{average speed} = \frac{120\text{ km}}{3\text{ h}} = 40\text{ km/h}.$$
The average is pulled toward 30 because you spent twice as long at that speed.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Backwards',
              body: r`A cyclist is at $x = 10$ m when $t = 2$ s, and at $x = 4$ m when $t = 5$ s.`,
              prompt: 'What is the average velocity over that time?',
              lhs: r`$v =$`,
              unit: 'm/s',
              answer: -2,
              wrong: [
                { v: 2, why: 'The cyclist’s position *decreased*, so the velocity is negative.' },
                { v: -6, why: r`$-6$ m is the displacement. Divide it by the time taken.` },
              ],
              explain: r`$$v = \frac{\Delta x}{\Delta t} = \frac{4 - 10}{5 - 2} = \frac{-6}{3} = -2\text{ m/s}$$`,
            },
          ],
          recap: [
            r`Velocity $v = \Delta x / \Delta t$: the slope of the position–time graph.`,
            'Velocity has a direction (a sign). Speed is its size.',
            'Average speed is total distance divided by total time, not the average of the speeds.',
          ],
        },
        {
          id: 'acceleration',
          title: 'Acceleration',
          summary: 'When velocity changes',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Spreading out',
              body: r`Another strobe photo, with one mark every second. The car starts from rest.`,
              widget: {
                kind: 'track', xmin: 0, xmax: 25, T: 5, tickStep: 5, strobe: 1, startAtEnd: true,
                x: (t) => t * t, v: (t) => 2 * t,
              },
              prompt: 'What is the car doing?',
              choices: [
                { t: 'Speeding up', ok: true },
                { t: 'Moving at a steady speed', why: 'At a steady speed the marks would be evenly spaced.' },
                { t: 'Slowing down', why: 'The gaps get *bigger*, so it covers more ground each second.' },
              ],
              explain: r`The gaps grow: 1 m, then 3 m, 5 m, 7 m, 9 m. The car covers more ground each second, so it's speeding up.`,
            },
            {
              type: 'explain',
              title: 'Acceleration',
              body: r`**Acceleration** is how quickly velocity changes:
$$a = \frac{\Delta v}{\Delta t}$$
Its unit is metres per second **per second**, written m/s².

Press **Play**. This car's velocity grows by 2 m/s every second, so $a = 2$ m/s². The velocity graph is a straight line with slope 2. The position graph **curves** upward, because the car covers more ground each second.`,
              widget: {
                kind: 'track', xmin: 0, xmax: 25, T: 5, tickStep: 5, strobe: 1, graphs: ['x', 'v'], showVector: true, vecScale: 10,
                xg: { ymin: 0, ymax: 25, step: 5 }, vg: { ymin: 0, ymax: 10, step: 2 },
                x: (t) => t * t, v: (t) => 2 * t,
              },
            },
            {
              type: 'numeric',
              title: 'Zero to 100',
              body: r`A sports car goes from rest to 27 m/s (about 100 km/h) in 9 seconds.`,
              prompt: 'What is its average acceleration?',
              unit: 'm/s²',
              answer: 3,
              wrong: [
                { v: 243, why: 'Acceleration is the change in velocity *divided* by the time.' },
                { v: 1 / 3, tol: 0.01, why: 'That’s time divided by velocity. Flip it.' },
              ],
              explain: r`$$a = \frac{\Delta v}{\Delta t} = \frac{27 - 0}{9} = 3\text{ m/s}^2$$
Every second, the car gains another 3 m/s.`,
            },
            {
              type: 'mcq',
              title: 'At the very top',
              body: r`You throw a ball straight up. For an instant at the top of its flight, its velocity is zero.`,
              prompt: 'What is its acceleration at that instant?',
              choices: [
                { t: '9.8 m/s², downward', ok: true },
                { t: 'Zero', why: r`Zero velocity doesn't mean zero acceleration. If the acceleration were zero, the velocity would stay zero and the ball would hang in the air forever.` },
                { t: '9.8 m/s², upward', why: 'Gravity pulls down the whole time, on the way up and on the way down.' },
                { t: 'It depends on how hard you threw it', why: 'Gravity gives every freely falling object the same acceleration, however it was thrown.' },
              ],
              explain: r`Gravity keeps pulling the ball down the whole time, so its acceleration is always about 9.8 m/s² downward. At the top, the velocity is passing through zero: from upward to downward. Acceleration is about how velocity is *changing*, not what it is right now.`,
            },
            {
              type: 'mcq',
              title: 'Signs',
              body: r`A car is moving in the **negative** direction and slowing down.`,
              prompt: 'What is the sign of its acceleration?',
              cols: 2,
              choices: [
                { t: 'Positive', ok: true },
                { t: 'Negative', why: r`Its velocity is negative (say $-10$ m/s) and getting closer to zero (say $-6$ m/s). The change, $-6 - (-10) = +4$, is positive.` },
                { t: 'Zero', why: 'The velocity is changing, so the acceleration isn’t zero.' },
              ],
              explain: r`"Slowing down" means the acceleration points **opposite** to the velocity. The velocity is negative, so the acceleration is positive. For example, going from $-10$ m/s to $-6$ m/s in 2 s gives $a = \frac{-6 - (-10)}{2} = +2$ m/s².`,
            },
            {
              type: 'interactive',
              title: 'Stop at the line',
              body: r`This car is moving at 6 m/s when it starts braking. Choose its (negative) acceleration so it stops **exactly** at the stop line, 9 m ahead. Press **Play** to test.`,
              widget: {
                kind: 'track', xmin: 0, xmax: 20, T: 6, tickStep: 2, strobe: 0.5, graphs: ['v'], vg: { ymin: 0, ymax: 8, step: 2 },
                params: { a: { min: -4, max: -0.5, step: 0.5, value: -1, label: '$a$', color: 'violet', format: (v) => `${fix(v, 1)} m/s²` } },
                flags: [{ x: 9, label: 'Stop line' }],
                x: brakeX, v: (t, p) => Math.max(0, V0 + p.a * t),
                needRun: true,
                goal: (p) => (p.a === -2 ? true : { ok: false, msg: `With a = ${String(p.a).replace('-', '−')} m/s² the car stopped at ${fmt1((V0 * V0) / (2 * -p.a))} m.` }),
                solution: { a: -2 },
              },
              explain: r`The car slows from 6 m/s to 0 at a steady rate, so its average velocity is 3 m/s. To cover 9 m at 3 m/s takes 3 s. Losing 6 m/s in 3 s means $a = -2$ m/s².`,
            },
            {
              type: 'explain',
              title: 'Area under the velocity graph',
              body: r`Here's a powerful idea. On a velocity–time graph, the **area** under the line equals the **displacement**.

For constant velocity it's a rectangle: velocity × time. For the car accelerating at 2 m/s², it's a triangle. Drag the slider to change $t$:`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5.5, ymin: 0, ymax: 11, grid: 1, gridY: 2, height: 320,
                axes: { xlabel: 't (s)', ylabel: 'v (m/s)' },
                params: { T: { min: 0.5, max: 5, step: 0.5, value: 3, label: '$t$', color: 'blue' } },
                curves: [{ f: (t) => 2 * t, color: 'blue' }],
                extra: ({ plot, p, s }) => [
                  s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(p.T)} ${plot.Y(0)} L${plot.X(p.T)} ${plot.Y(2 * p.T)} Z`, class: 'fl-blue', opacity: 0.22 }),
                  s('line', { x1: plot.X(p.T), x2: plot.X(p.T), y1: plot.Y(0), y2: plot.Y(2 * p.T), stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
                ],
                readout: (p) => r`$\text{area} = \tfrac12 \times ${fix(p.T, 1)} \times ${2 * p.T} = ${fix(p.T * p.T, 2)}$ m`,
              },
              after: r`Check it against the strobe photo at the start of this lesson. After 3 s the car was at 9 m, and the area is $\tfrac12 \times 3 \times 6 = 9$. ✓`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Speed up, then cruise',
              widget: {
                kind: 'graph', xmin: 0, xmax: 6.5, ymin: 0, ymax: 12, grid: 1, gridY: 2, height: 300,
                axes: { xlabel: 't (s)', ylabel: 'v (m/s)' },
                curves: [{ f: (t) => (t < 4 ? 2.5 * t : 10), color: 'coral', to: () => 6 }],
              },
              prompt: 'How far does this object travel in the 6 seconds shown?',
              unit: 'm',
              answer: 40,
              wrong: [
                { v: 60, why: 'For the first 4 s the object was slower than 10 m/s. The area there is a triangle, not a rectangle.' },
                { v: 20, why: 'That’s only one of the two pieces. Add the triangle and the rectangle.' },
                { v: 10, why: 'That’s the final velocity. Find the area under the graph.' },
              ],
              hint: 'Split the area into a triangle (0–4 s) and a rectangle (4–6 s).',
              explain: r`Triangle from 0 to 4 s: $\tfrac12 \times 4 \times 10 = 20$ m. Rectangle from 4 to 6 s: $2 \times 10 = 20$ m. Total: **40 m**.`,
            },
          ],
          recap: [
            r`Acceleration $a = \Delta v / \Delta t$, measured in m/s². It's the slope of the velocity–time graph.`,
            'Slowing down means the acceleration points opposite to the velocity.',
            'The area under a velocity–time graph is the displacement.',
          ],
        },
      ],
    },
    {
      title: 'Equations of Motion',
      summary: 'Constant acceleration, from braking cars to free fall.',
      lessons: [
        {
          id: 'kinematics-equations',
          title: 'The Big Three',
          summary: 'Equations for constant acceleration',
          icon: 'sigma',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'From rest',
              body: r`A car starts from rest and accelerates at 2 m/s² for 5 s.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 12, grid: 1, gridY: 2, height: 280,
                axes: { xlabel: 't (s)', ylabel: 'v (m/s)' },
                curves: [{ f: (t) => 2 * t, color: 'blue', to: () => 5 }],
              },
              prompt: 'How far does it travel?',
              unit: 'm',
              answer: 25,
              wrong: [
                { v: 50, why: 'The car only reaches 10 m/s at the very end. The area under the graph is a triangle, so remember the ½.' },
                { v: 10, why: 'That’s the final velocity, in m/s.' },
              ],
              explain: r`The area under the velocity graph is a triangle with base 5 s and height 10 m/s: $\tfrac12 \times 5 \times 10 = 25$ m.`,
            },
            {
              type: 'explain',
              title: 'Two equations from one graph',
              body: r`Start at velocity $v_0$ and accelerate at a constant $a$ for time $t$.

**Velocity:** you gain $a$ every second, so
$$v = v_0 + at$$

**Displacement:** the area under the graph is a rectangle ($v_0 t$) plus a triangle ($\tfrac12 \cdot t \cdot at$):
$$\Delta x = v_0 t + \tfrac12 a t^2$$`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 14, grid: 1, gridY: 2, height: 300,
                axes: { xlabel: 't', ylabel: 'v' },
                params: { T: { min: 1, max: 5, step: 0.5, value: 4, label: '$t$', color: 'blue' } },
                curves: [{ f: (t) => 3 + 2 * t, color: 'blue' }],
                extra: ({ plot, p, s }) => [
                  s('rect', { x: plot.X(0), y: plot.Y(3), width: plot.X(p.T) - plot.X(0), height: plot.Y(0) - plot.Y(3), class: 'fl-teal', opacity: 0.3 }),
                  s('path', { d: `M${plot.X(0)} ${plot.Y(3)} L${plot.X(p.T)} ${plot.Y(3)} L${plot.X(p.T)} ${plot.Y(3 + 2 * p.T)} Z`, class: 'fl-blue', opacity: 0.3 }),
                  s('text', { x: plot.X(p.T / 2), y: plot.Y(1.2), 'text-anchor': 'middle', class: 'lbl', text: 'v₀t' }),
                  s('text', { x: plot.X(p.T * 0.66), y: plot.Y(3 + p.T * 0.6), 'text-anchor': 'middle', class: 'lbl', text: '½at²' }),
                ],
                readout: (p) => r`$v_0 = 3,\ a = 2:\quad \Delta x = 3(${fix(p.T, 1)}) + \tfrac12(2)(${fix(p.T, 1)})^2 = ${fix(3 * p.T + p.T * p.T, 2)}$`,
              },
            },
            {
              type: 'explain',
              title: 'The time-free equation',
              body: r`Often you don't know the time. Solve $v = v_0 + at$ for $t$ and substitute it into the displacement equation. After some algebra, $t$ disappears:
$$v^2 = v_0^2 + 2a\,\Delta x$$

Together these are the three equations of constant acceleration:

$$\begin{aligned} v &= v_0 + at \\ \Delta x &= v_0 t + \tfrac12 a t^2 \\ v^2 &= v_0^2 + 2a\,\Delta x \end{aligned}$$

They only work when the acceleration is **constant**.`,
            },
            {
              type: 'mcq',
              title: 'Braking distance',
              body: r`A car brakes to a stop with the same deceleration whatever its speed.`,
              prompt: 'If the car is going twice as fast, how does its braking distance change?',
              cols: 2,
              choices: [
                { t: '4 times as long', ok: true },
                { t: 'Twice as long', why: r`At double speed it takes twice as long to stop, **and** it travels faster on average during that time. The two effects multiply.` },
                { t: 'The same', why: 'A faster car needs more room to stop.' },
                { t: '8 times as long', why: r`Braking distance grows with the *square* of speed: $2^2 = 4$.` },
              ],
              explain: r`Stopping means the final velocity is $v = 0$. Then $0 = v_0^2 + 2a\Delta x$, so
$$\Delta x = \frac{v_0^2}{2|a|}.$$
Distance grows with the **square** of speed: double the speed means $2^2 = 4$ times the braking distance. This is why speed limits near schools matter so much.`,
            },
            {
              type: 'numeric',
              title: 'Emergency stop',
              body: r`A car moving at 20 m/s brakes with a deceleration of 5 m/s².`,
              prompt: 'How far does it travel before stopping?',
              unit: 'm',
              answer: 40,
              wrong: [
                { v: 4, why: 'That’s the time it takes to stop, in seconds. Now find the distance.' },
                { v: 80, why: r`Don't forget the 2 in $v^2 = v_0^2 + 2a\Delta x$.` },
                { v: 100, why: r`That's $20 \times 5$. Use $\Delta x = v_0^2 / (2|a|)$.` },
              ],
              explain: r`$$\Delta x = \frac{v_0^2}{2|a|} = \frac{20^2}{2 \times 5} = \frac{400}{10} = 40\text{ m}$$
Check with time: it stops after $20/5 = 4$ s at an average speed of 10 m/s, so $4 \times 10 = 40$ m. ✓`,
            },
            {
              type: 'numeric',
              title: 'Runway',
              body: r`A plane needs to reach 80 m/s to take off. Starting from rest, it accelerates at 4 m/s².`,
              prompt: 'What is the minimum runway length?',
              unit: 'm',
              answer: 800,
              wrong: [
                { v: 1600, why: r`Remember the 2: $\Delta x = v^2/(2a)$.` },
                { v: 20, why: 'That’s the time in seconds. Find the distance.' },
              ],
              explain: r`$$v^2 = v_0^2 + 2a\Delta x \;\Rightarrow\; 80^2 = 0 + 2(4)\Delta x \;\Rightarrow\; \Delta x = \frac{6400}{8} = 800\text{ m}$$`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Take-off time',
              prompt: 'For the same plane, how long does the take-off run last?',
              unit: 's',
              answer: 20,
              wrong: [{ v: 200, why: r`Use $v = v_0 + at$: $80 = 4t$.` }],
              explain: r`$v = v_0 + at$ gives $80 = 0 + 4t$, so $t = 20$ s.

Check with the displacement equation: $\tfrac12 (4)(20)^2 = 800$ m. ✓`,
            },
          ],
          recap: [
            r`$v = v_0 + at$, $\;\Delta x = v_0 t + \tfrac12 at^2$, $\;v^2 = v_0^2 + 2a\Delta x$, for constant acceleration only.`,
            r`Braking distance is $v_0^2 / (2|a|)$: double the speed means four times the distance.`,
            'Pick the equation that leaves out the quantity you don’t know.',
          ],
        },
        {
          id: 'free-fall',
          title: 'Free Fall',
          summary: 'Everything falls the same way',
          icon: 'down',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Heavy vs. light',
              body: r`You drop a bowling ball and a tennis ball from the same height at the same moment. Ignore air resistance.`,
              prompt: 'Which one hits the ground first?',
              choices: [
                { t: 'They land at the same time', ok: true },
                { t: 'The bowling ball', why: r`The bowling ball is pulled harder, but it's also harder to get moving. The two effects cancel exactly.` },
                { t: 'The tennis ball', why: 'Lighter objects don’t fall faster.' },
              ],
              explain: r`Without air resistance, all objects fall with the same acceleration. Gravity pulls harder on heavier objects, but they need more force to accelerate by the same amount.

In 1971, astronaut David Scott tested this on the Moon, where there's no air. A hammer and a feather, dropped together, hit the ground at the same moment.`,
            },
            {
              type: 'explain',
              title: 'g = 9.8 m/s²',
              body: r`Near Earth's surface, a freely falling object accelerates downward at
$$g \approx 9.8\text{ m/s}^2$$
Every second, it falls 9.8 m/s faster. Here is a falling ball photographed every 0.2 s:`,
              widget: {
                kind: 'figure', w: 600, h: 330, label: 'Strobe image of a falling ball',
                draw: ({ s }) => {
                  const els = [];
                  const sc = 54; // px per metre
                  els.push(s('line', { x1: 200, x2: 200, y1: 30, y2: 30 + 5 * sc, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  for (let m = 0; m <= 5; m++) {
                    els.push(s('line', { x1: 192, x2: 208, y1: 30 + m * sc, y2: 30 + m * sc, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                    els.push(s('text', { x: 184, y: 35 + m * sc, 'text-anchor': 'end', class: 'tick', text: `${m} m` }));
                  }
                  let ly = -Infinity; // label rows are nudged apart where the balls are close, with a leader line
                  for (let k = 0; k <= 5; k++) {
                    const t = k * 0.2;
                    const d = 0.5 * G * t * t;
                    const y = 30 + d * sc;
                    const row = Math.max(y, ly + 20);
                    ly = row;
                    els.push(s('circle', { cx: 250, cy: y, r: 8, class: 'fl-coral', opacity: k === 5 ? 1 : 0.55 }));
                    if (row - y > 2) els.push(s('path', { d: `M260 ${y} L272 ${row}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1 }));
                    els.push(s('text', { x: 280, y: row + 5, class: 'tick', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: `t = ${t.toFixed(1)} s` }));
                    els.push(s('text', { x: 380, y: row + 5, class: 'lbl', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: `v = ${(G * t).toFixed(2)} m/s` }));
                  }
                  return els;
                },
              },
              after: r`The velocity grows by $9.8 \times 0.2 = 1.96$ m/s in each 0.2 s gap, and the gaps get longer and longer.`,
            },
            {
              type: 'numeric',
              title: 'Speed after 3 seconds',
              body: r`A stone is dropped from rest (take $g = 9.8$ m/s²).`,
              prompt: 'How fast is it falling after 3 s?',
              unit: 'm/s',
              answer: 29.4,
              tol: 0.05,
              wrong: [
                { v: 44.1, tol: 0.05, why: 'That’s how far it falls in 3 s. Speed uses $v = gt$.' },
                { v: 3.27, tol: 0.05, why: r`Multiply, don't divide: $v = g \times t$.` },
              ],
              explain: r`$v = v_0 + gt = 0 + 9.8 \times 3 = 29.4$ m/s. That's over 100 km/h after just 3 seconds!`,
            },
            {
              type: 'numeric',
              title: 'Distance after 3 seconds',
              prompt: 'How far has the stone fallen in those 3 s?',
              unit: 'm',
              answer: 44.1,
              tol: 0.05,
              wrong: [
                { v: 88.2, tol: 0.05, why: r`Remember the $\tfrac12$ in $\tfrac12 g t^2$.` },
                { v: 29.4, tol: 0.05, why: 'That’s the speed after 3 s, not the distance.' },
                { v: 14.7, tol: 0.05, why: r`The time needs to be squared: $\tfrac12 \times 9.8 \times 3^2$.` },
              ],
              explain: r`$\Delta y = \tfrac12 g t^2 = \tfrac12 \times 9.8 \times 9 = 44.1$ m.

Check: the speed rose steadily from 0 to 29.4 m/s, so the average speed was 14.7 m/s, and $14.7 \times 3 = 44.1$. ✓`,
            },
            { /*anim:motion*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Galileo’s odd numbers',
              body: r`Galileo timed balls rolling down ramps and found a beautiful pattern. Here a ball falls from rest, with a flash every "tick" of time. Compare the gaps between the flashes, and the tiles on the right.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -26.5, ymax: 1, grid: false, axes: false, height: 400,
                animate: { param: 't', speed: 0.8, max: 7, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const tt = Math.min(5, p.t), n = Math.floor(tt + 1e-9), cols = ['blue', 'coral', 'teal', 'amber', 'violet'];
                  const T = (x, y, text, o = {}) => s('text', { x, y, 'text-anchor': o.a || 'middle', class: 'halo-text', style: `font-size:max(calc(${o.fs || 13}px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;${o.fill ? 'fill:' + o.fill : ''}`, text });
                  const els = [s('line', { x1: plot.X(1.5), x2: plot.X(1.5), y1: plot.Y(0), y2: plot.Y(-25), stroke: 'var(--line-2)', 'stroke-width': 2 })];
                  for (let k = 1; k <= n; k++) {
                    const y0 = -((k - 1) ** 2), y1 = -(k ** 2), c = cols[k - 1];
                    els.push(s('circle', { cx: plot.X(1.5), cy: plot.Y(y1), r: 7, fill: 'none', stroke: `var(--${c})`, 'stroke-width': 2 }));
                    els.push(s('path', { d: `M${plot.X(2.1)} ${plot.Y(y0) + 2} h6 V${plot.Y(y1) - 2} h-6`, fill: 'none', stroke: `var(--${c})`, 'stroke-width': 2 }));
                    els.push(T(plot.X(2.1) + 12, (plot.Y(y0) + plot.Y(y1)) / 2 + 5, String(2 * k - 1), { a: 'start', fill: `var(--${c})` }));
                  }
                  els.push(s('circle', { cx: plot.X(1.5), cy: plot.Y(-tt * tt), r: 10, class: 'fl-ink' }));
                  // tiles: the k-th gap is an L-shaped layer that turns a (k-1)-square into a k-square
                  const size = Math.min(44, (plot.X(9.6) - plot.X(4.4)) / 5), x0 = plot.X(4.4), y0 = plot.Y(-1) - 20;
                  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
                    const k = Math.max(i, j) + 1;
                    const show = k <= n ? 1 : k === n + 1 ? Math.max(0, (tt - n) * 1.2 - 0.2) : 0;
                    els.push(s('rect', { x: x0 + i * size + 1.5, y: y0 + j * size + 1.5, width: size - 3, height: size - 3, rx: 4, class: show > 0 ? `fl-${cols[k - 1]}` : 'fl-surface', opacity: show > 0 ? 0.25 + 0.6 * Math.min(1, show) : 1 }));
                  }
                  if (n) els.push(T(x0 + 2.5 * size, y0 + 5 * size + 30, n === 1 ? '1 = 1²' : `${Array.from({ length: n }, (_, k) => 2 * k + 1).join(' + ')} = ${n * n} = ${n}²`, { fs: 15 }));
                  return els;
                },
                readout: (p) => { const tt = Math.min(5, p.t); return `time ${fix(tt, 2)} ticks · fallen ${fix(tt * tt, 2)} units`; },
              },
              after: r`In equal times, a falling body covers distances in the ratio $1 : 3 : 5 : 7 : 9 : \dots$, the odd numbers. Add them up and you always get a square: $1 + 3 + 5 + 7 = 16 = 4^2$. Each odd number is the L-shaped layer that grows one square into the next. So the total distance grows as the **square of the time**, which is exactly $d = \tfrac12 g t^2$.`,
            },
            {
              type: 'numeric',
              title: 'How deep is the well?',
              body: r`You drop a stone into a well and hear the splash 2.0 s later. Ignore the time the sound takes to travel back up.`,
              prompt: 'How deep is the well?',
              unit: 'm',
              answer: 19.6,
              tol: 0.05,
              wrong: [
                { v: 39.2, tol: 0.05, why: r`Remember the $\tfrac12$ in $\tfrac12 g t^2$.` },
                { v: 9.8, tol: 0.05, why: r`The time needs to be squared: $\tfrac12 \times 9.8 \times 2^2$.` },
              ],
              explain: r`$\Delta y = \tfrac12 g t^2 = \tfrac12 \times 9.8 \times 2^2 = 19.6$ m. (In real life, sound takes about 0.06 s to climb 20 m, so the true depth is a little less.)`,
            },
            {
              type: 'mcq',
              title: 'Up and down',
              body: r`You throw a ball straight up at 15 m/s and catch it at the same height. Ignore air resistance.`,
              prompt: 'How fast is it moving when it comes back to your hand?',
              choices: [
                { t: '15 m/s, downward', ok: true },
                { t: 'Slower than 15 m/s', why: 'Without air resistance, nothing takes energy away from the ball.' },
                { t: 'Faster than 15 m/s', why: 'Gravity slows the ball on the way up by exactly as much as it speeds it up on the way down.' },
                { t: '0 m/s', why: 'It’s only at rest for an instant at the very top.' },
              ],
              explain: r`The motion is symmetric. Going up, gravity removes 9.8 m/s every second until the ball stops. Coming down, it adds 9.8 m/s every second for the same amount of time. The ball returns with the same speed, now pointing down.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How high?',
              body: r`A ball is thrown straight up at 19.6 m/s.`,
              prompt: 'What maximum height does it reach above the launch point?',
              unit: 'm',
              answer: 19.6,
              tol: 0.05,
              wrong: [
                { v: 2, why: 'That’s the time to reach the top, in seconds. Now find the height.' },
                { v: 39.2, tol: 0.05, why: r`Remember the 2 in the denominator: $h = v_0^2 / (2g)$.` },
              ],
              hint: r`At the top, $v = 0$. Use $v^2 = v_0^2 - 2g\,h$.`,
              explain: r`At the top $v = 0$, so $0 = v_0^2 - 2gh$:
$$h = \frac{v_0^2}{2g} = \frac{19.6^2}{2 \times 9.8} = 19.6\text{ m}.$$
It takes $19.6 / 9.8 = 2$ s to get there, and at an average speed of 9.8 m/s that's $9.8 \times 2 = 19.6$ m. ✓`,
            },
          ],
          recap: [
            r`Without air resistance, everything falls with acceleration $g \approx 9.8$ m/s² downward.`,
            r`Dropped from rest: $v = gt$ and $\Delta y = \tfrac12 g t^2$.`,
            'Thrown upward, an object returns with the same speed it was thrown at.',
          ],
        },
      ],
    },
    {
      title: 'Motion in Two Dimensions',
      summary: 'Sideways and up-and-down, at the same time.',
      lessons: [
        {
          id: 'projectiles',
          title: 'Projectiles',
          summary: 'Two motions at once',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Rolled vs. dropped',
              body: r`One ball rolls off the edge of a table. At the same instant, a second ball is dropped from the same height.`,
              prompt: 'Which ball hits the floor first? (Ignore air resistance.)',
              choices: [
                { t: 'They land at the same time', ok: true },
                { t: 'The dropped ball', why: r`The rolling ball has further to go *sideways*, but it falls the same height with the same acceleration.` },
                { t: 'The rolling ball', why: 'Moving sideways doesn’t make it fall any faster.' },
              ],
              explain: r`Gravity only acts vertically. The sideways motion doesn't affect how quickly a ball falls, so both balls drop the same height in the same time.`,
            },
            {
              type: 'explain',
              title: 'See for yourself',
              body: r`Press **Launch**. The {coral:orange ball} is fired horizontally at 10 m/s from a 20 m ledge. The {violet:purple ball} is dropped at the same moment. Compare the strobe marks.`,
              widget: {
                kind: 'projectile', h0: 20, xmin: -3, xmax: 25, ymax: 22, angle: 0, speed: 10, drop: true, strobe: 0.25, slow: 1.5, height: 330,
                readout: () => r`Both balls are at the same height at every moment.`,
                needLaunch: false,
              },
              after: r`At every flash, the two balls are at the **same height**. The horizontal motion is steady (the orange marks are equally spaced sideways), while the vertical motion is free fall, the same for both.

::: key
Horizontal and vertical motion are independent. Horizontally: constant velocity. Vertically: free fall with acceleration $g$.
:::`,
            },
            {
              type: 'numeric',
              title: 'Off the cliff',
              body: r`A ball is kicked horizontally at 8 m/s off a cliff that is 19.6 m high.`,
              prompt: 'How far from the base of the cliff does it land?',
              unit: 'm',
              answer: 16,
              wrong: [
                { v: 2, why: 'That’s how long it’s in the air, in seconds. Multiply by the horizontal speed.' },
                { v: 156.8, tol: 0.1, why: r`That's $8 \times 19.6$. First find the time from the height.` },
              ],
              hint: r`First find how long it takes to fall 19.6 m: $\tfrac12 g t^2 = 19.6$.`,
              explain: r`**Vertical:** $19.6 = \tfrac12 (9.8) t^2$, so $t^2 = 4$ and $t = 2$ s.

**Horizontal:** constant 8 m/s for 2 s, so $8 \times 2 = 16$ m.`,
            },
            {
              type: 'explain',
              title: 'Splitting the launch velocity',
              body: r`When you launch at speed $v$ and angle $\theta$ above the horizontal, split the velocity into two parts:
$$v_x = v\cos\theta, \qquad v_y = v\sin\theta$$

Press **Launch** and watch the arrows. The {blue:horizontal arrow} never changes. The {teal:vertical arrow} shrinks, flips, and grows downward, just like a ball thrown straight up.`,
              widget: {
                kind: 'projectile', h0: 0, xmin: -2, xmax: 40, ymax: 16, showVectors: true, vecScale: 4, strobe: 0.3, slow: 1.4,
                params: { angle: { min: 15, max: 75, step: 1, value: 50, label: r`$\theta$` }, speed: { min: 10, max: 19, step: 1, value: 17, label: '$v$' } },
                readout: ({ angle, speed }) => r`$v_x = ${fix(speed * Math.cos((angle * Math.PI) / 180), 2)}$ m/s, $\quad v_y = ${fix(speed * Math.sin((angle * Math.PI) / 180), 2)}$ m/s`,
                needLaunch: false,
              },
            },
            { /*anim2:motion*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The monkey and the hunter',
              body: r`A classic puzzle. A hunter aims a dart **straight at** a monkey hanging from a branch. The monkey, startled by the noise, lets go at the very moment the dart is fired. Should the hunter aim lower? Watch three shots at different speeds.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.5, xmax: 23, ymin: -0.6, ymax: 12.5, grid: false, axes: false, maxWidth: 600,
                animate: { param: 't', speed: 0.8, max: 3 * 1.6 + Math.hypot(20, 10) * (1 / 30 + 1 / 22 + 1 / 17), autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { v, tau, hit } = monkeyRound(p.t), c = 20 / Math.hypot(20, 10), sn = 10 / Math.hypot(20, 10), drop = 4.9 * tau * tau, els = [];
                  els.push(s('line', { x1: plot.X(-1.5), x2: plot.X(23), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-2)', 'stroke-width': 2.5 }));
                  els.push(s('line', { x1: plot.X(17.5), x2: plot.X(23), y1: plot.Y(10.6), y2: plot.Y(10.6), stroke: 'var(--amber)', 'stroke-width': 5, 'stroke-linecap': 'round' }));
                  els.push(s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(20), y2: plot.Y(10), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }));
                  // paths so far
                  const dart = [], mk = [];
                  for (let i = 0; i <= 40; i++) { const q = (tau * i) / 40; dart.push(`${i ? 'L' : 'M'}${plot.X(v * c * q).toFixed(1)} ${plot.Y(v * sn * q - 4.9 * q * q).toFixed(1)}`); }
                  els.push(s('path', { d: dart.join(''), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 }));
                  // where each would be without gravity, and how far both have dropped
                  const gx = v * c * tau, gy = v * sn * tau;
                  if (drop > 0.15) {
                    els.push(s('line', { x1: plot.X(gx), y1: plot.Y(gy), x2: plot.X(gx), y2: plot.Y(gy - drop), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '3 3' }));
                    els.push(s('line', { x1: plot.X(20), y1: plot.Y(10), x2: plot.X(20), y2: plot.Y(10 - drop), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '3 3' }));
                  }
                  els.push(s('circle', { cx: plot.X(20), cy: plot.Y(10 - drop), r: 8, class: 'fl-amber', stroke: 'var(--ink-2)', 'stroke-width': 1.5 }));
                  els.push(s('circle', { cx: plot.X(gx), cy: plot.Y(gy - drop), r: 5, class: 'fl-coral' }));
                  els.push(s('rect', { x: plot.X(-0.9), y: plot.Y(0.9), width: plot.X(1.2) - plot.X(0), height: plot.Y(0) - plot.Y(0.9), rx: 3, class: 'fl-ink' }));
                  if (tau >= hit - 1e-9) els.push(s('text', { x: plot.X(20) + 16, y: plot.Y(10 - drop) - 6, class: 'halo-text', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--coral)', text: 'hit!' }));
                  return els;
                },
                readout: (p) => { const { v, tau, hit } = monkeyRound(p.t); return `dart at ${v} m/s · ${fix(tau, 2)} s · both have fallen ${fix(4.9 * tau * tau, 2)} m below their no-gravity positions${tau >= hit - 1e-9 ? ' · **hit**' : ''}`; },
              },
              after: r`Aim straight at it. Without gravity the dart would fly along the dashed line and the monkey would stay put, so the dart would hit. Gravity pulls both down by the same amount, $\frac12 g t^2$, at every moment (the violet drops), so it still hits, whatever the dart's speed. A faster dart just meets the monkey higher up. The only way to miss is a dart so slow that the monkey reaches the ground first.`,
            },
            {
              type: 'interactive',
              title: 'Hit the target',
              body: r`Adjust the angle and the launch speed so the ball lands on the target 30 m away.`,
              widget: {
                kind: 'projectile', h0: 0, xmin: -2, xmax: 45, ymax: 25, strobe: 0.25,
                params: { angle: { min: 10, max: 80, step: 1, value: 30, label: r`$\theta$` }, speed: { min: 5, max: 25, step: 1, value: 12, label: '$v$' } },
                target: { x: 30, w: 3 },
                readout: ({ angle, speed }) => r`$\theta = ${angle}°,\ v = ${speed}$ m/s`,
                solution: { angle: 45, speed: 17 },
                validate() {
                  const range = (17 * 17 * Math.sin(Math.PI / 2)) / G;
                  return Math.abs(range - 30) <= 1.5 ? null : 'solution misses target';
                },
              },
              explain: r`On level ground the range is
$$R = \frac{v^2 \sin 2\theta}{g}.$$
For example, $\theta = 45°$ and $v = 17$ m/s gives $R = \frac{289}{9.8} \approx 29.5$ m. Many other combinations work too.`,
            },
            {
              type: 'interactive',
              title: 'The best angle',
              body: r`Now the speed is fixed at 18 m/s. Find the launch angle that sends the ball **farthest**. Try a few launches and compare the distances.`,
              widget: {
                kind: 'projectile', h0: 0, xmin: -2, xmax: 36, ymax: 18, strobe: 0, speed: 18,
                params: { angle: { min: 5, max: 85, step: 1, value: 20, label: r`$\theta$` } },
                readout: ({ angle, last }) => (last ? r`Last launch: $\theta = ${last.angle}°$ went $${last.range.toFixed(2)}$ m` : r`$\theta = ${angle}°$. Press **Launch** to measure the range.`),
                goal: (run) => (Math.abs(run.angle - 45) <= 1 ? true : { ok: false, msg: `At ${run.angle}° it went ${run.range.toFixed(2)} m. Some other angle goes farther.` }),
                solution: { angle: 45 },
              },
              explain: r`The range $R = \frac{v^2 \sin 2\theta}{g}$ is largest when $\sin 2\theta = 1$, which means $2\theta = 90°$ and $\theta = 45°$. Here that gives $\frac{18^2}{9.8} \approx 33.1$ m.

Too low, and the ball hits the ground before it gets far. Too high, and it spends its time going up instead of forward.`,
            },
            {
              type: 'mcq',
              title: 'Twin angles',
              body: r`At 18 m/s, a launch at 30° lands 28.6 m away.`,
              prompt: 'Which other angle lands at exactly the same spot?',
              cols: 2,
              choices: [
                { t: '60°', ok: true },
                { t: '15°', why: r`$\sin(2 \times 15°) = \sin 30° = 0.5$, but $\sin 60° \approx 0.87$. Not the same.` },
                { t: '45°', why: '45° gives the maximum range, which is farther than 28.6 m.' },
                { t: '90°', why: 'Fired straight up, the ball comes straight back down, with a range of zero.' },
              ],
              explain: r`The range depends on $\sin 2\theta$, and $\sin 60° = \sin 120°$. So $\theta = 30°$ and $\theta = 60°$ land in the same place. In general, **complementary** angles (adding to 90°) give equal ranges. The 60° shot just flies higher and takes longer.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'At the peak',
              body: r`A ball is launched at speed $v$ and angle $\theta$.`,
              prompt: 'What is its velocity at the highest point of its path?',
              choices: [
                { t: r`$v\cos\theta$, horizontal`, ok: true },
                { t: 'Zero', why: 'Only the *vertical* part is zero at the top. The ball is still moving sideways.' },
                { t: r`$v$, horizontal`, why: r`Only the horizontal part, $v\cos\theta$, remains at the top. The vertical part, $v\sin\theta$, has dropped to zero.` },
                { t: r`$v\sin\theta$, horizontal`, why: r`$v\sin\theta$ is the starting *vertical* velocity, and that's the part that has dropped to zero.` },
              ],
              explain: r`At the top, the vertical velocity has dropped to zero, but the horizontal velocity $v_x = v\cos\theta$ never changes. So the ball is moving horizontally at $v\cos\theta$, which is its slowest speed of the whole flight.`,
            },
          ],
          recap: [
            'Horizontal and vertical motions are independent.',
            r`Horizontally: constant $v_x = v\cos\theta$. Vertically: free fall starting at $v_y = v\sin\theta$.`,
            r`On level ground, range $R = v^2 \sin 2\theta / g$: maximum at 45°, equal for complementary angles.`,
          ],
        },
      ],
    },
    {
      title: 'Motion in the Real World',
      summary: 'Stopping safely and moving relative to others.',
      lessons: [
        {
          id: 'stopping',
          title: 'Stopping Distances',
          summary: 'Thinking time plus braking',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Two parts',
              body: r`When a hazard appears, a driver needs time to notice and react: typically about 0.7 s for an alert driver, longer if tired or distracted. During that **thinking distance**, the car keeps going at full speed. Only then do the brakes start the **braking distance**:
$$d = \underbrace{v\,t_r}_{\text{thinking}} + \underbrace{\frac{v^2}{2a}}_{\text{braking}}$$
where $v$ is the speed, $t_r$ the reaction time and $a$ the braking deceleration (about 7 m/s² on a dry road).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Stop before the crossing',
              prompt: r`A child steps out 40 m ahead. Reaction time 0.7 s, braking at 7 m/s². What is the **fastest whole-number speed** (in m/s) at which the car still stops before the flag? Press Play to test.`,
              widget: {
                kind: 'track', xmin: 0, xmax: 60, T: 4.3, tickStep: 10, strobe: 0.35, graphs: ['v'], vg: { ymin: 0, ymax: 25, step: 5 },
                params: { v: { min: 10, max: 24, step: 1, value: 22, label: '$v$', format: (v) => `${v} m/s (${Math.round(v * 2.237)} mph)` } },
                flags: [{ x: 40, label: 'crossing' }],
                x: stopX, v: stopV,
                needRun: true,
                goal: (p) => (p.v === 19 ? true : stopD(p.v) > 40 ? { ok: false, msg: `At ${p.v} m/s the car needs ${stopD(p.v).toFixed(1)} m: it doesn’t stop in time.` } : { ok: false, msg: `At ${p.v} m/s it stops after ${stopD(p.v).toFixed(1)} m. Safe, but can a faster speed still stop in time?` }),
                solution: { v: 19 },
              },
              explain: r`At 19 m/s: $0.7 \times 19 + \frac{19^2}{14} = 13.3 + 25.8 = 39.1$ m ✓. At 20 m/s it needs 42.6 m ✗. Notice how the braking part grows much faster than the thinking part.`,
            },
            {
              type: 'numeric',
              title: 'Double the speed',
              prompt: r`If you double your speed, by what factor does the **braking** distance increase?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`Braking distance is $\frac{v^2}{2a}$: it depends on the **square** of the speed.` }],
              explain: r`$\frac{(2v)^2}{2a} = 4 \times \frac{v^2}{2a}$. Twice the speed means four times the kinetic energy for the brakes to remove, and four times the distance.`,
            },
            {
              type: 'numeric',
              title: 'Eyes off the road',
              prompt: r`A driver glances at a phone for 1.5 s while travelling at 30 m/s (about 67 mph). How far does the car travel, unsteered and unbraked, in that time?`,
              unit: 'm',
              answer: 45,
              wrong: [{ v: 20, why: 'Distance = speed × time: 30 × 1.5.' }],
              explain: r`$30 \times 1.5 = 45$ m: about ten car lengths, with nobody really driving.`,
            },
            {
              type: 'mcq',
              title: 'Wet roads',
              prompt: r`On a wet road, the braking deceleration may halve. What happens to the stopping distance?`,
              choices: [
                { t: 'The braking part doubles; the thinking part is unchanged', ok: true },
                { t: 'Everything doubles', why: 'The thinking distance depends only on speed and reaction time, not on the road surface.' },
                { t: 'Nothing changes', why: r`Braking distance is $\frac{v^2}{2a}$: halving $a$ doubles it.` },
              ],
              explain: r`Braking distance $\propto \frac{1}{a}$, so halving the grip doubles it. Thinking distance $= v t_r$ doesn't care about the road. That's why highway codes recommend doubling your following gap in the wet.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: '20 versus 30',
              prompt: r`A child runs out 14 m ahead. At 20 mph (8.9 m/s), a car stops in 11.9 m: just in time. At 30 mph (13.4 m/s), with the same reaction time (0.7 s) and braking (7 m/s²), how fast is the car still going when it reaches the child? (1 decimal place, in m/s.)`,
              unit: 'm/s',
              answer: Math.sqrt(13.4 ** 2 - 2 * 7 * (14 - 0.7 * 13.4)),
              tol: 0.1,
              wrong: [{ v: 13.4, why: 'The car does brake for part of the distance: after 0.7 × 13.4 = 9.4 m of thinking, it brakes over the remaining 4.6 m.' }, { v: 0, why: r`At 30 mph the stopping distance is $9.4 + 12.8 = 22.2$ m, more than 14 m.` }],
              explain: r`Thinking: $0.7 \times 13.4 = 9.4$ m, leaving 4.6 m of braking. Then $v^2 = 13.4^2 - 2 \times 7 \times 4.6 \approx 115$, so $v \approx 10.7$ m/s (24 mph). The slower car stops; the faster one hits the child at almost its full original speed. This is why 20 mph limits near schools save lives.`,
            },
          ],
          recap: [
            r`Stopping distance = thinking distance $vt_r$ + braking distance $v^2/2a$.`,
            'Braking distance grows with the square of speed.',
            'Distraction, tiredness and wet roads can multiply stopping distances.',
          ],
        },
        {
          id: 'relative',
          title: 'Relative Motion',
          summary: 'It depends who’s watching',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'Frames of reference',
              body: r`Sit on a train moving at 30 m/s and walk forward at 1 m/s. Relative to the train you move at 1 m/s; relative to the ground, 31 m/s. Velocities are always measured **relative** to something, a **frame of reference**.

At everyday speeds, velocities add like vectors: velocity relative to the ground = your velocity relative to the train + the train's velocity relative to the ground.`,
            },
            {
              type: 'numeric',
              title: 'Head-on',
              prompt: r`Two trains on the same track head towards each other at 30 m/s and 20 m/s, 1 km apart. How many seconds until they would meet?`,
              unit: 's',
              answer: 20,
              wrong: [{ v: 100, why: 'They approach each other at 30 + 20 = 50 m/s, not 10 m/s.' }, { v: 33.3, tol: 0.1, why: 'Both trains are moving: the gap closes at 50 m/s.' }],
              explain: r`Relative to one train, the other approaches at $30 + 20 = 50$ m/s. The 1000 m gap closes in $\frac{1000}{50} = 20$ s.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Crossing the river',
              prompt: r`A boat moves at 4 m/s through the water; the river flows at 3 m/s to the right. Choose the angle to point the boat upstream so that it travels **straight across** to the opposite bank.`,
              widget: {
                kind: 'graph', xmin: -4.5, xmax: 4.5, ymin: -0.8, ymax: 4.6, grid: false, axes: false, equal: true, maxWidth: 480,
                params: { th: { min: 0, max: 80, step: 0.5, value: 20, label: 'angle upstream', color: 'blue', format: (v) => `${v.toFixed(1)}°` } },
                extra: ({ plot, p, s, arrow }) => {
                  const bx = -4 * Math.sin(p.th * D2R), by = 4 * Math.cos(p.th * D2R);
                  const rx = bx + 3, ry = by;
                  const A = (x1, y1, x2, y2, c, w) => arrow(plot.X(x1), plot.Y(y1), plot.X(x2), plot.Y(y2), { color: `var(--${c})`, width: w, head: 12 });
                  return [
                    s('rect', { x: plot.X(-4.5), y: plot.Y(4.3), width: plot.X(4.5) - plot.X(-4.5), height: plot.Y(-0.3) - plot.Y(4.3), class: 'fl-blue-soft', opacity: 0.5 }),
                    A(0, 0, bx, by, 'blue', 4), A(bx, by, rx, ry, 'teal', 4), A(0, 0, rx, ry, 'coral', 5),
                    s('text', { x: plot.X(bx / 2) - 10, y: plot.Y(by / 2), class: 'lbl', 'text-anchor': 'end', style: 'fill: var(--blue)', text: 'boat' }),
                    s('text', { x: plot.X(bx + 1.5), y: plot.Y(by) - 10, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--teal)', text: 'current' }),
                  ];
                },
                readout: (p) => {
                  const side = 3 - 4 * Math.sin(p.th * D2R);
                  return Math.abs(side) < 0.05 ? 'The resultant (coral) points **straight across**.' : `The boat drifts ${side > 0 ? 'downstream' : 'upstream'} at ${Math.abs(side).toFixed(2)} m/s.`;
                },
                goal: (p) => Math.abs(3 - 4 * Math.sin(p.th * D2R)) < 0.05,
                hint: r`The boat's upstream component, $4\sin\theta$, must cancel the 3 m/s current.`,
                solution: { th: 48.5 },
              },
              explain: r`You need $4\sin\theta = 3$, so $\theta = \sin^{-1} 0.75 \approx 48.6°$. The boat crabs diagonally through the water, but relative to the banks it moves straight across, at $4\cos\theta \approx 2.65$ m/s.`,
            },
            {
              type: 'numeric',
              title: 'Time to cross',
              prompt: r`The river is 60 m wide and the boat crosses straight over at 2.65 m/s. How long does the crossing take? (Nearest second.)`,
              unit: 's',
              answer: 23,
              tol: 0.6,
              wrong: [{ v: 15, why: 'Only the cross-river part of the boat’s velocity (2.65 m/s) carries it across.' }],
              explain: r`$\frac{60}{2.65} \approx 23$ s. (If the boat simply pointed straight across, it would cross faster, in 15 s, but land 45 m downstream.)`,
            },
            {
              type: 'mcq',
              title: 'Slanting rain',
              prompt: r`Rain falls straight down on a windless day. Why does it seem to slant towards you when you drive?`,
              choices: [
                { t: 'Relative to the car, the rain has a horizontal velocity towards you equal to the car’s speed', ok: true },
                { t: 'The car’s motion creates a wind that blows the rain', why: 'Some air is disturbed, but the main effect is simply relative velocity: in your frame, the rain moves backwards.' },
                { t: 'It’s an optical illusion caused by the windscreen', why: 'It’s real relative motion, the same reason you tilt an umbrella forward when you walk.' },
              ],
              explain: r`In the car's frame, rain velocity = (rain's ground velocity) − (car's velocity): down **and** backwards. The faster you drive, the more slanted it looks.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Flying in wind',
              prompt: r`A plane flies 600 km to a city and back at an airspeed of 300 km/h. Compared with a windless day, does a steady 60 km/h wind blowing along the route make the round trip shorter, longer or the same?`,
              choices: [
                { t: 'Longer', ok: true },
                { t: 'The same: the tailwind and headwind cancel', why: r`They don't cancel in time: with the wind, $\frac{600}{360} = 1.67$ h; against, $\frac{600}{240} = 2.5$ h. Total 4.17 h versus 4 h.` },
                { t: 'Shorter', why: 'The plane spends longer fighting the headwind than it gains from the tailwind.' },
              ],
              explain: r`Windless: $2 \times \frac{600}{300} = 4$ h. With wind: $\frac{600}{360} + \frac{600}{240} = 1.67 + 2.5 = 4.17$ h. The plane spends **more time** in the headwind than in the tailwind, so any wind along the route lengthens a round trip.`,
            },
          ],
          recap: [
            'Velocities are measured relative to a frame of reference.',
            'Relative velocities add as vectors (at everyday speeds).',
            'To cross a river straight, aim upstream so the current is cancelled.',
          ],
        },
      ],
    },
  ],
};
