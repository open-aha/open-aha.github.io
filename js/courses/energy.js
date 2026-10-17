import { fix } from '../lib/svg.js';

const r = String.raw;
const G = 9.8;
const f2 = (v) => (Math.round(v * 100) / 100).toString();
const bowl = (x) => 0.2 * x * x;

export default {
  id: 'energy',
  subject: 'physics',
  title: 'Energy',
  level: 'Intermediate',
  cover: 'energy',
  tagline: 'Work, kinetic, potential and elastic energy, power, and the law nothing escapes.',
  description: r`Energy is the universe's bookkeeping. Learn what work really means, how motion and height store energy, why a skater always returns to the same height, where the energy goes when things stop, how springs store energy, and how your own body converts food into motion and heat.`,
  prereq: 'Forces & Newton’s Laws',
  chapters: [
    {
      title: 'Work and Energy',
      summary: 'Pushing things around, and what that buys you.',
      lessons: [
        {
          id: 'work',
          title: 'Work',
          summary: 'Force times distance, in the right direction',
          icon: 'hand',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Tired arms',
              body: r`You carry a heavy box across a room at a steady speed, holding it at the same height the whole time.`,
              prompt: 'In physics terms, how much work does your upward holding force do on the box?',
              choices: [
                { t: 'Zero', ok: true },
                { t: 'A lot, because the box is heavy', why: 'Your arms get tired (your muscles use energy), but the box gains no energy: it isn’t rising or speeding up.' },
                { t: 'It depends on how far you walk', why: 'Your force points up, but the box moves sideways. Force perpendicular to the motion does no work.' },
              ],
              explain: r`In physics, **work** is done only when a force acts *along* the direction of motion. Your force points up, but the box moves horizontally, so your holding force does no work on it. The box's energy doesn't change: same height, same speed.`,
            },
            {
              type: 'explain',
              title: 'What work means',
              body: r`When a force $F$ pushes something a distance $d$ in the direction of the force, it does **work**
$$W = F\,d$$
Work is measured in **joules**: $1\text{ J} = 1\text{ N} \times 1\text{ m}$. Lifting an apple (about 1 N) up by 1 m takes about 1 J.

Work is how energy gets transferred: the work you do on something is the energy you give it.`,
            },
            {
              type: 'numeric',
              title: 'Push the crate',
              prompt: 'You push a crate with a steady 50 N force for 4 m in the direction of the push. How much work do you do?',
              unit: 'J',
              answer: 200,
              wrong: [
                { v: 12.5, why: r`Work is force **times** distance.` },
                { v: 54, why: 'Multiply the force by the distance. Don’t add them.' },
              ],
              explain: r`$W = Fd = 50 \times 4 = 200$ J.`,
            },
            {
              type: 'numeric',
              title: 'Lift the book',
              prompt: r`You slowly lift a 2 kg book from the floor to a shelf 1.5 m high. How much work do you do? ($g = 9.8$ m/s²)`,
              unit: 'J',
              answer: 29.4,
              tol: 0.05,
              wrong: [
                { v: 3, why: r`You need the force, not the mass. The force to lift it is its weight, $mg$.` },
                { v: 19.6, tol: 0.05, why: 'That’s the force (the book’s weight). Multiply by the distance.' },
              ],
              explain: r`Lifting slowly takes a force equal to the weight, $mg = 19.6$ N. Then $W = 19.6 \times 1.5 = 29.4$ J. In general, lifting takes $W = mgh$.`,
            },
            {
              type: 'numeric',
              title: 'At an angle',
              body: r`You push a shopping trolley 15 m across a flat car park. Your push is 40 N, directed along the handle at 30° **below** the horizontal. Only the horizontal part of the push, $F\cos\theta$, acts along the motion.`,
              prompt: 'How much work does your push do on the trolley? (Nearest joule.)',
              unit: 'J',
              answer: 40 * 15 * Math.cos(Math.PI / 6),
              tol: 1,
              wrong: [
                { v: 600, why: r`Only the part of the push along the motion counts: $F\cos 30° \approx 34.6$ N.` },
                { v: 300, why: r`That uses $\sin 30°$. The horizontal part is $F\cos\theta$.` },
              ],
              explain: r`$W = F d \cos\theta = 40 \times 15 \times \cos 30° \approx 40 \times 15 \times 0.866 \approx 520$ J. The downward part of the push does no work on the trolley; it just presses its wheels harder onto the ground.`,
            },
            {
              type: 'mcq',
              title: 'Negative work',
              prompt: 'A hockey puck slides across rough ice and slows down. What kind of work does friction do on the puck?',
              cols: 2,
              choices: [
                { t: 'Negative work', ok: true },
                { t: 'Positive work', why: 'Friction points backward while the puck moves forward. It takes energy away.' },
                { t: 'No work', why: 'Friction acts along the line of motion (backwards), so it does do work.' },
              ],
              explain: r`When a force points **against** the motion, it does **negative** work: it removes energy. That's why the puck slows down.`,
            },
            {
              type: 'interactive',
              title: 'Pulling at an angle',
              body: r`You drag a crate 10 m with a 100 N force. Only the part of the force along the motion does work: $W = Fd\cos\theta$. Find the angle at which you do **half** the work of a horizontal pull.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 9, ymin: -0.5, ymax: 4.5, grid: false, axes: false, maxWidth: 460,
                params: { th: { min: 0, max: 85, step: 1, value: 30, label: 'angle', color: 'coral', format: (v) => `${v}°` } },
                extra: ({ plot, p, s, arrow }) => { const t = (p.th * Math.PI) / 180; return [s('line', { x1: plot.X(-1), x2: plot.X(9), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 2 }), s('rect', { x: plot.X(1), y: plot.Y(1.5), width: plot.X(2) - plot.X(0), height: plot.Y(0) - plot.Y(1.5), rx: 4, class: 'fl-amber-soft', stroke: 'var(--amber)' }), arrow(plot.X(3), plot.Y(0.75), plot.X(3 + 4 * Math.cos(t)), plot.Y(0.75 + 4 * Math.sin(t)), { color: 'var(--coral)', width: 4 }), arrow(plot.X(3), plot.Y(0.75), plot.X(3 + 4 * Math.cos(t)), plot.Y(0.75), { color: 'var(--blue)', width: 3 })]; },
                readout: (p) => `useful (blue) part: ${(100 * Math.cos((p.th * Math.PI) / 180)).toFixed(1)} N · work **${(1000 * Math.cos((p.th * Math.PI) / 180)).toFixed(0)} J**`,
                goal: (p) => p.th === 60,
                hint: 'You need cos θ = ½.',
                solution: { th: 60 },
              },
              explain: r`At $60°$, $\cos\theta = \frac12$: 500 J instead of 1000 J. The upward part of your pull does no work on the crate (though it does lighten the friction, which is why pulling slightly upward can still help).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Up the stairs',
              prompt: 'A 60 kg person climbs stairs that rise 3 m. How much work do they do against gravity?',
              unit: 'J',
              answer: 1764,
              tol: 1,
              wrong: [
                { v: 180, why: r`Multiply by $g$ too: the force is the weight $mg$, not the mass.` },
                { v: 588, tol: 1, why: 'That’s the person’s weight in newtons. Multiply by the height.' },
              ],
              explain: r`$W = mgh = 60 \times 9.8 \times 3 = 1764$ J. Only the vertical rise matters, not how long the staircase is.`,
            },
          ],
          recap: [
            r`Work $W = Fd\cos\theta$, measured in joules (J = N·m).`,
            'Forces perpendicular to the motion do no work. Forces against the motion do negative work.',
            r`Lifting a mass $m$ through a height $h$ takes $W = mgh$.`,
          ],
        },
        {
          id: 'kinetic',
          title: 'Kinetic Energy',
          summary: 'The energy of motion',
          icon: 'play',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Faster costs more',
              body: r`In the Motion course you found that doubling a car's speed makes its braking distance **4 times** longer. The brakes push with the same force either way.`,
              prompt: 'So how much more energy must the brakes remove when the car goes twice as fast?',
              cols: 2,
              choices: [
                { t: '4 times as much', ok: true },
                { t: '2 times as much', why: r`The brakes do work $W = Fd$. Same force, but 4 times the distance.` },
                { t: 'The same', why: 'A faster car is harder to stop. The brakes have to work over a longer distance.' },
              ],
              explain: r`Work $= F \times d$. Same braking force, four times the distance: four times the work. So a car going twice as fast carries **four times** the energy of motion.`,
            },
            {
              type: 'explain',
              title: 'Kinetic energy',
              body: r`The energy something has because it's moving is its **kinetic energy**:
$$KE = \tfrac12 m v^2$$

Where does that come from? Push a mass $m$ from rest with a force $F$ over a distance $d$. It speeds up with $a = F/m$, and from the Motion course $v^2 = 2ad$. So the work done is
$$W = Fd = (ma)\,d = m \cdot \frac{v^2}{2} = \tfrac12 m v^2.$$`,
            },
            {
              type: 'numeric',
              title: 'Car',
              prompt: 'What is the kinetic energy of a 1000 kg car moving at 20 m/s?',
              unit: 'J',
              answer: 200000,
              wrong: [
                { v: 10000, why: r`Square the speed: $20^2 = 400$.` },
                { v: 400000, why: r`Don't forget the $\tfrac12$.` },
                { v: 20000, why: r`$KE = \tfrac12 \times 1000 \times 20^2$.` },
              ],
              explain: r`$KE = \tfrac12 \times 1000 \times 20^2 = 500 \times 400 = 200{,}000$ J $= 200$ kJ.`,
            },
            {
              type: 'mcq',
              title: 'Mass vs. speed',
              prompt: 'Which has more kinetic energy?',
              choices: [
                { t: 'A 1 kg ball moving at 6 m/s', ok: true },
                { t: 'A 2 kg ball moving at 3 m/s', why: r`Speed counts twice (it's squared): $\tfrac12 \times 2 \times 3^2 = 9$ J vs $\tfrac12 \times 1 \times 6^2 = 18$ J.` },
                { t: 'They’re equal', why: r`Mass × speed is equal (6 each), but kinetic energy uses speed **squared**.` },
              ],
              explain: r`$\tfrac12 (1)(6^2) = 18$ J beats $\tfrac12 (2)(3^2) = 9$ J. Doubling the speed matters more than doubling the mass.`,
            },
            {
              type: 'explain',
              title: 'The work–energy theorem',
              body: r`The derivation shows something general: the **net** work done on an object equals the change in its kinetic energy.
$$W_\text{net} = \Delta KE = KE_\text{final} - KE_\text{initial}$$
Positive net work speeds it up. Negative net work (like friction or brakes) slows it down.`,
            },
            {
              type: 'numeric',
              title: 'Throw',
              prompt: 'You throw a 0.5 kg ball, taking it from rest to 4 m/s. How much net work did you do on it?',
              unit: 'J',
              answer: 4,
              wrong: [
                { v: 8, why: r`Remember the $\tfrac12$: $\tfrac12 \times 0.5 \times 16$.` },
                { v: 1, why: r`Square the speed: $4^2 = 16$.` },
              ],
              explain: r`$W = \Delta KE = \tfrac12 (0.5)(4^2) - 0 = 4$ J.`,
            },
            {
              type: 'interactive',
              title: 'Four times the energy',
              body: r`A 1,000 kg car travels at 30 km/h. Find the speed at which it has **four times** as much kinetic energy.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 130, ymin: 0, ymax: 700, grid: false, height: 260, axes: { xlabel: 'speed (km/h)', ylabel: 'kinetic energy (kJ)', xticks: 20, yticks: 100 },
                params: { v: { min: 10, max: 130, step: 1, value: 45, label: 'speed', color: 'coral', format: (v) => `${v} km/h` } },
                curves: [{ f: (x) => 0.5 * 1000 * (x / 3.6) ** 2 / 1000, color: 'violet', width: 3 }, { f: () => 4 * 0.5 * 1000 * (30 / 3.6) ** 2 / 1000, color: 'teal', dash: true }],
                points: [{ x: (p) => p.v, y: (p) => 0.5 * 1000 * (p.v / 3.6) ** 2 / 1000, color: 'coral' }],
                readout: (p) => `${p.v} km/h: **${(0.5 * 1000 * (p.v / 3.6) ** 2 / 1000).toFixed(0)} kJ** (at 30 km/h: ${(0.5 * 1000 * (30 / 3.6) ** 2 / 1000).toFixed(0)} kJ)`,
                goal: (p) => p.v === 60,
                hint: 'Kinetic energy grows with the square of speed.',
                solution: { v: 60 },
              },
              explain: r`Double the speed, four times the energy: 60 km/h. The brakes must get rid of four times as much energy, so braking distance also roughly quadruples: a crash at 60 km/h is far more than twice as bad as one at 30.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Braking force',
              prompt: 'A 1200 kg car moving at 25 m/s brakes to a stop over 50 m. What is the average braking force?',
              unit: 'N',
              answer: 7500,
              wrong: [
                { v: 375000, why: 'That’s the kinetic energy in joules. Divide by the distance to get the force.' },
                { v: 600, why: r`Use the kinetic energy, $\tfrac12 m v^2$, not just $mv$.` },
                { v: 15000, why: r`Don't forget the $\tfrac12$ in $\tfrac12 m v^2$.` },
              ],
              explain: r`All the kinetic energy has to be removed: $KE = \tfrac12 (1200)(25^2) = 375{,}000$ J. The brakes do that work over 50 m: $F = W/d = 375{,}000 / 50 = 7500$ N.`,
            },
          ],
          recap: [
            r`$KE = \tfrac12 mv^2$: double the speed means four times the energy.`,
            r`Work–energy theorem: $W_\text{net} = \Delta KE$.`,
            'Stopping a moving object means removing all its kinetic energy.',
          ],
        },
        {
          id: 'potential',
          title: 'Potential Energy',
          summary: 'Energy stored in height and springs',
          icon: 'layers',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Lifting',
              prompt: r`How much work does it take to lift a 3 kg bag up 2 m?`,
              unit: 'J',
              answer: 58.8,
              tol: 0.05,
              wrong: [{ v: 6, why: r`Use the weight $mg$ as the force: $3 \times 9.8 \times 2$.` }],
              explain: r`$W = mgh = 3 \times 9.8 \times 2 = 58.8$ J. That energy hasn't vanished. It's stored, ready to come back if you drop the bag.`,
            },
            {
              type: 'explain',
              title: 'Gravitational potential energy',
              body: r`Energy stored because of height is **gravitational potential energy**:
$$PE = mgh$$
where $h$ is the height above a level that **you choose** as zero. When the object falls, this stored energy turns into kinetic energy.`,
            },
            {
              type: 'mcq',
              title: 'Which zero?',
              body: r`A book sits on a shelf 2 m above the floor and 1.2 m above a table. Ana measures heights from the floor. Ben measures them from the table top.`,
              prompt: 'Who is right about the book’s potential energy?',
              choices: [
                { t: 'Both. Only changes in PE matter, and they agree on those', ok: true },
                { t: 'Ana, because the floor is the real zero', why: 'Nothing makes the floor special. Any level works, as long as you stick with it.' },
                { t: 'Ben, because the table is closer', why: 'Being closer doesn’t make a level more correct. Any level works.' },
              ],
              explain: r`They get different PE values, but if the book falls onto the table, both calculate the **same change** in PE, and that change is what becomes kinetic energy. Like altitude, which can be measured from sea level or from the ground, the zero is a choice.`,
            },
            {
              type: 'numeric',
              title: 'High dive',
              prompt: 'A 50 kg diver stands on a 10 m platform. What is their potential energy relative to the water?',
              unit: 'J',
              answer: 4900,
              wrong: [{ v: 500, why: r`Include $g$: $PE = mgh = 50 \times 9.8 \times 10$.` }],
              explain: r`$PE = mgh = 50 \times 9.8 \times 10 = 4900$ J.`,
            },
            {
              type: 'explain',
              title: 'Springs store energy too',
              body: r`A spring pushes back harder the more you squash it: $F = kx$, where $k$ is the spring's stiffness and $x$ is how far it's squashed (*Hooke's law*).

The work to squash it is the area under the force graph, which is a triangle:
$$PE_\text{spring} = \tfrac12 k x^2$$`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.22, ymin: 0, ymax: 45, grid: 0.02, gridY: 5, height: 300, axes: { xlabel: 'x (m)', ylabel: 'F (N)', xfmt: (v) => (Math.round(v * 100) / 100).toString() },
                params: { X: { min: 0.02, max: 0.2, step: 0.01, value: 0.1, label: '$x$', color: 'teal', format: (v) => `${fix(v, 2)} m` } },
                curves: [{ f: (x) => 200 * x, color: 'teal' }],
                extra: ({ plot, p, s }) => [s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(p.X)} ${plot.Y(0)} L${plot.X(p.X)} ${plot.Y(200 * p.X)} Z`, class: 'fl-teal', opacity: 0.25 })],
                readout: (p) => r`$k = 200$ N/m: $\;PE = \tfrac12 (200)(${fix(p.X, 2)})^2 = ${fix(100 * p.X * p.X, 2)}$ J`,
              },
            },
            {
              type: 'numeric',
              title: 'Squash',
              prompt: 'A spring with k = 200 N/m is compressed by 0.1 m. How much energy does it store?',
              unit: 'J',
              answer: 1,
              wrong: [
                { v: 20, why: r`That's the force, $kx$. The energy is $\tfrac12 k x^2$.` },
                { v: 2, why: r`Don't forget the $\tfrac12$.` },
                { v: 10, why: r`Square the compression: $0.1^2 = 0.01$.` },
              ],
              explain: r`$PE = \tfrac12 k x^2 = \tfrac12 \times 200 \times 0.01 = 1$ J.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Twice as far',
              prompt: 'You compress the same spring twice as far. How much more energy does it store?',
              cols: 2,
              choices: [
                { t: '4 times', ok: true },
                { t: '2 times', why: r`The energy depends on $x^2$. Both the force and the distance double.` },
                { t: '8 times', why: r`It's $x^2$, not $x^3$.` },
              ],
              explain: r`$PE \propto x^2$: double $x$ and you get $2^2 = 4$ times the energy. Squashing it twice as far takes twice the distance at, on average, twice the force.`,
            },
          ],
          recap: [
            r`Gravitational PE $= mgh$, measured from a zero level of your choice. Only changes in PE matter.`,
            r`Spring PE $= \tfrac12 k x^2$, the area under the force–compression graph.`,
            'Potential energy is stored energy that can turn back into motion.',
          ],
        },
      ],
    },
    {
      title: 'Conservation',
      summary: 'Energy changes form, but the total never changes.',
      lessons: [
        {
          id: 'conservation',
          title: 'The Skate Park',
          summary: 'Kinetic ↔ potential',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Drop in',
              body: r`Drag the ball to any starting point on this frictionless track, then press **Release**. Watch the energy bars.`,
              widget: { kind: 'energy', track: bowl, xmin: -5.5, xmax: 5.5, ymax: 6, x0: -4, m: 1, dragStart: true, bars: ['ke', 'pe', 'total'], T: 12, ready: true },
              after: r`As the ball drops, {teal:PE} turns into {blue:KE}. As it climbs, KE turns back into PE. The **total** bar never moves.`,
            },
            {
              type: 'mcq',
              title: 'How high?',
              prompt: 'Released from 4 m up one side of a frictionless track, how high does the ball get on the other side?',
              cols: 2,
              choices: [
                { t: 'Exactly 4 m', ok: true },
                { t: 'Less than 4 m', why: 'With no friction, nothing takes energy away from the ball.' },
                { t: 'More than 4 m', why: 'That would need more energy than the ball started with.' },
              ],
              explain: r`At its highest point, the ball momentarily stops, so all its energy is PE again. The total energy is unchanged, so the PE, and the height, are the same as at the start: 4 m.`,
            },
            {
              type: 'explain',
              title: 'Conservation of energy',
              body: r`::: key
With no friction, kinetic plus potential energy stays constant: $KE + PE = \text{constant}$.
:::

For something dropped from height $h$, all the PE becomes KE at the bottom:
$$\tfrac12 m v^2 = m g h \quad\Rightarrow\quad v = \sqrt{2gh}$$
The mass cancels out, so the speed at the bottom depends only on the height.`,
            },
            {
              type: 'numeric',
              title: 'Speed at the bottom',
              prompt: 'A skater starts from rest 5 m above the bottom of a frictionless half-pipe. How fast are they going at the bottom?',
              unit: 'm/s',
              answer: Math.sqrt(2 * G * 5),
              tol: 0.03,
              wrong: [
                { v: 98, tol: 0.1, why: r`That's $v^2$. Take the square root.` },
                { v: 7, tol: 0.03, why: r`$\sqrt{49} = 7$ forgets the 2 in $v = \sqrt{2gh}$.` },
              ],
              explain: r`$v = \sqrt{2gh} = \sqrt{2 \times 9.8 \times 5} = \sqrt{98} \approx 9.90$ m/s.`,
            },
            {
              type: 'interactive',
              title: 'Speed trap',
              body: r`Choose a starting point so the ball passes through the bottom at **8 m/s** (to within 0.2 m/s). Drag the ball, then press **Release** to test.`,
              widget: {
                kind: 'energy', track: bowl, xmin: -5.5, xmax: 5.5, ymax: 6, x0: -1.5, m: 1, dragStart: true, bars: ['ke', 'pe', 'total'], T: 4,
                params: { x0: { min: -5.3, max: 5.3, step: 0.1, value: -1.5, slider: false } },
                readout: ({ h, v, maxSpeed, x0 }) => r`start height $= ${fix(bowl(x0), 2)}$ m $\quad$ top speed $= ${fix(maxSpeed, 2)}$ m/s`,
                needRun: true,
                goal: (p, st) => {
                  const v = Math.sqrt(2 * G * bowl(p.x0));
                  return Math.abs(v - 8) <= 0.2 ? true : { ok: false, msg: `From ${f2(bowl(p.x0))} m the bottom speed is ${f2(v)} m/s.` };
                },
                hint: r`Solve $\sqrt{2gh} = 8$ for $h$.`,
                solution: { x0: -4 },
              },
              explain: r`$h = \frac{v^2}{2g} = \frac{64}{19.6} \approx 3.27$ m. Any start near that height works.`,
            },
            {
              type: 'mcq',
              title: 'Three slides',
              body: r`Three frictionless water slides start at the same height and end at the same height. One is steep and straight, one is gentle and long, and one is twisty.`,
              prompt: 'Which rider is fastest at the bottom?',
              choices: [
                { t: 'They all reach the same speed', ok: true },
                { t: 'The steep slide', why: 'The steep rider gets there **sooner**, but not faster: all three lose the same height, so they gain the same KE.' },
                { t: 'The twisty slide', why: 'Without friction, the shape of the path doesn’t change the energy.' },
              ],
              explain: r`Each rider converts the same drop in PE, $mgh$, into KE, so they all reach $v = \sqrt{2gh}$. The path changes **how long** it takes, not the final speed. (Real slides have friction, which makes longer slides slower.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Pendulum',
              body: r`A pendulum bob is pulled aside so it's 0.45 m above its lowest point, then let go.`,
              prompt: 'How fast does it move at the bottom of its swing?',
              unit: 'm/s',
              answer: Math.sqrt(2 * G * 0.45),
              tol: 0.02,
              wrong: [{ v: 8.82, tol: 0.02, why: r`That's $v^2$. Take the square root.` }],
              explain: r`The string's tension is always perpendicular to the motion, so it does no work. Energy is conserved: $v = \sqrt{2 \times 9.8 \times 0.45} = \sqrt{8.82} \approx 2.97$ m/s.`,
            },
          ],
          recap: [
            r`Without friction, $KE + PE$ stays constant.`,
            r`Falling from height $h$: $v = \sqrt{2gh}$, the same for any mass and any path shape.`,
            'An object can only climb back to its starting height, never higher.',
          ],
        },
        {
          id: 'friction-heat',
          title: 'Where Energy Goes',
          summary: 'Friction, heat and efficiency',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Add friction',
              body: r`Same track, but now with friction. Slide the friction up and press **Release**. The new {coral:Heat} bar shows energy turned into thermal energy.`,
              widget: {
                kind: 'energy', track: bowl, xmin: -5.5, xmax: 5.5, ymax: 6, x0: -4.5, m: 1, bars: ['ke', 'pe', 'th', 'total'], T: 30,
                params: { mu: { min: 0, max: 0.2, step: 0.01, value: 0.05, label: r`$\mu$`, color: 'coral' } },
                ready: true,
              },
              after: 'The ball climbs a little lower on each swing and eventually settles at the bottom. Notice that the **total** bar, which includes heat, still never changes.',
            },
            {
              type: 'mcq',
              title: 'Where did it go?',
              prompt: 'When the ball finally stops at the bottom, where has its original energy gone?',
              choices: [
                { t: 'Into thermal energy: the ball and track got slightly warmer', ok: true },
                { t: 'It was destroyed by friction', why: 'Energy is never destroyed. Friction changes it into another form.' },
                { t: 'It’s still potential energy', why: 'The ball is at the lowest point, so it has the least possible PE.' },
              ],
              explain: r`Friction converts kinetic energy into **thermal energy**: the random jiggling of atoms, which we feel as warmth. Rub your hands together and you can feel it.`,
            },
            {
              type: 'explain',
              title: 'Nothing is lost',
              body: r`::: key
Energy is never created or destroyed. It only changes form.
:::

When energy "disappears", look for where it went: usually heat, and sometimes sound or light. This is one of the most thoroughly tested laws in all of physics.`,
            },
            {
              type: 'numeric',
              title: 'Sliding box',
              prompt: 'A 2 kg box slides across the floor at 3 m/s and comes to rest. How much thermal energy did friction produce?',
              unit: 'J',
              answer: 9,
              wrong: [
                { v: 18, why: r`Remember the $\tfrac12$ in $\tfrac12 m v^2$.` },
                { v: 6, why: r`Square the speed: $\tfrac12 \times 2 \times 3^2$.` },
              ],
              explain: r`All its kinetic energy becomes heat: $\tfrac12 (2)(3^2) = 9$ J.`,
            },
            {
              type: 'numeric',
              title: 'Sled run',
              body: r`A 40 kg sled starts at rest at the top of a 10 m tall hill and reaches the bottom at 10 m/s.`,
              prompt: 'How much energy turned into heat on the way down?',
              unit: 'J',
              answer: 1920,
              tol: 1,
              wrong: [
                { v: 3920, tol: 1, why: 'That’s all the PE it started with. Part of it became KE.' },
                { v: 2000, tol: 1, why: 'That’s the KE at the bottom. The question asks for the energy that went missing from the PE.' },
              ],
              explain: r`Start: $PE = 40 \times 9.8 \times 10 = 3920$ J. End: $KE = \tfrac12 \times 40 \times 10^2 = 2000$ J. The difference, $3920 - 2000 = 1920$ J, became heat (and a little sound).`,
            },
            {
              type: 'explain',
              title: 'Efficiency',
              body: r`Machines never turn all their input energy into the form we want. Their **efficiency** is
$$\text{efficiency} = \frac{\text{useful energy out}}{\text{total energy in}}$$
A typical petrol car engine turns roughly a quarter to a third of its fuel's energy into motion, and the rest leaves as heat. An old incandescent light bulb turns only a few percent of its electricity into visible light. LEDs do many times better.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Winch',
              prompt: 'An electric winch uses 500 J of electrical energy to lift a 20 kg load by 2 m. What is its efficiency, in percent?',
              unit: '%',
              answer: 78.4,
              tol: 0.2,
              wrong: [
                { v: 8, why: r`The useful energy is $mgh$, which includes $g$.` },
                { v: 392, tol: 0.5, why: 'That’s the useful energy in joules. Divide it by the 500 J input.' },
              ],
              explain: r`Useful output: $mgh = 20 \times 9.8 \times 2 = 392$ J. Efficiency: $392 / 500 = 0.784 = 78.4\%$. The other 108 J became heat in the motor and gears.`,
            },
          ],
          recap: [
            'Friction turns kinetic energy into thermal energy. The total energy is still conserved.',
            'Energy can’t be created or destroyed, only transformed.',
            'Efficiency = useful output ÷ total input, which is always less than 100%.',
          ],
        },
        {
          id: 'power',
          title: 'Power',
          summary: 'How fast energy flows',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Run or walk',
              body: r`Two identical twins climb the same staircase. One runs up in 5 s, the other walks up in 20 s.`,
              prompt: 'Who does more work against gravity?',
              choices: [
                { t: 'They do the same work', ok: true },
                { t: 'The runner', why: r`Work is $mgh$: the same mass and the same height, so the same work. The runner just does it faster.` },
                { t: 'The walker, because they take longer', why: 'Time doesn’t appear in the work. It’s the same weight lifted the same height.' },
              ],
              explain: r`Same mass, same height, so the same work ($mgh$). What differs is **how fast** the work gets done. That's **power**.`,
            },
            {
              type: 'explain',
              title: 'Power',
              body: r`**Power** is the rate of doing work (transferring energy):
$$P = \frac{W}{t}$$
It's measured in **watts**: $1\text{ W} = 1\text{ J/s}$. The runner above produces 4 times the power of the walker.

For reference: a person can sustain about 100 W for hours, and an elite cyclist can hold roughly 400 W for an hour. One horsepower is about 746 W.`,
            },
            {
              type: 'numeric',
              title: 'Stair power',
              prompt: 'A 60 kg person climbs 3 m of stairs in 4 s. What is their power output against gravity?',
              unit: 'W',
              answer: 441,
              tol: 0.5,
              wrong: [
                { v: 1764, tol: 1, why: 'That’s the work in joules. Divide by the time.' },
                { v: 45, why: r`Use $mgh$ for the work: $60 \times 9.8 \times 3$, then divide by 4.` },
              ],
              explain: r`$W = mgh = 1764$ J. $P = W/t = 1764/4 = 441$ W, more than half a horsepower!`,
            },
            {
              type: 'numeric',
              title: 'Kettle',
              prompt: 'A 2000 W kettle runs for 3 minutes. How much energy does it use, in kilojoules?',
              unit: 'kJ',
              answer: 360,
              wrong: [
                { v: 6, why: 'Convert 3 minutes to 180 seconds first.' },
                { v: 360000, why: 'That’s in joules. The question asks for kilojoules.' },
              ],
              explain: r`$E = Pt = 2000 \text{ W} \times 180 \text{ s} = 360{,}000$ J $= 360$ kJ.`,
            },
            {
              type: 'explain',
              title: 'The kilowatt-hour',
              body: r`Electricity bills use a bigger energy unit, the **kilowatt-hour**: the energy used by 1000 W running for 1 hour.
$$1\text{ kWh} = 1000\text{ W} \times 3600\text{ s} = 3.6\text{ million J}$$`,
            },
            {
              type: 'numeric',
              title: 'Heater bill',
              prompt: r`A 2 kW heater runs for 5 hours. Electricity costs \$0.20 per kWh. How much does that cost, in dollars?`,
              unit: 'dollars',
              answer: 2,
              wrong: [
                { v: 10, why: 'That’s the energy in kWh. Multiply by the price per kWh.' },
                { v: 0.2, why: r`It uses $2 \times 5 = 10$ kWh, not 1.` },
              ],
              explain: r`Energy: $2 \text{ kW} \times 5 \text{ h} = 10$ kWh. Cost: $10 \times \$0.20 = \$2.00$.`,
            },
            {
              type: 'interactive',
              title: 'A powerful sprint',
              body: r`A 60 kg person runs up a 3 m flight of stairs. How fast must they climb to generate **300 W**?`,
              widget: {
                kind: 'graph', xmin: 2, xmax: 15, ymin: 0, ymax: 900, grid: false, height: 260, axes: { xlabel: 'time to climb (s)', ylabel: 'power (W)', xticks: 2, yticks: 200, xAt: 2 },
                params: { t: { min: 2, max: 15, step: 0.01, value: 10, label: 'time', color: 'coral', format: (v) => `${v.toFixed(2)} s` } },
                curves: [{ f: (x) => (60 * 9.8 * 3) / x, color: 'violet', width: 3 }, { f: () => 300, color: 'teal', dash: true }],
                points: [{ x: (p) => p.t, y: (p) => (60 * 9.8 * 3) / p.t, color: 'coral' }],
                readout: (p) => `energy needed: ${(60 * 9.8 * 3).toFixed(0)} J · power **${((60 * 9.8 * 3) / p.t).toFixed(0)} W**`,
                goal: (p) => Math.abs((60 * 9.8 * 3) / p.t - 300) < 2,
                hint: 'Power = energy ÷ time, and the energy is mgh.',
                solution: { t: 5.88 },
              },
              explain: r`The climb needs $mgh = 60 \times 9.8 \times 3 \approx 1{,}760$ J; doing it in about **5.9 s** means 300 W. Halve the time and the power doubles, though the energy stays the same. Fit athletes can briefly produce over 1,000 W.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Zero to 100',
              prompt: 'A 1000 kg car goes from rest to 27 m/s in 9 s. What average power (in kilowatts) goes into its kinetic energy?',
              unit: 'kW',
              answer: 40.5,
              tol: 0.1,
              wrong: [
                { v: 364.5, tol: 0.2, why: 'That’s the kinetic energy in kJ. Divide by the time.' },
                { v: 81, tol: 0.2, why: r`Remember the $\tfrac12$ in the kinetic energy.` },
                { v: 3, why: 'That’s the acceleration. Find the kinetic energy first.' },
              ],
              explain: r`$KE = \tfrac12 (1000)(27^2) = 364{,}500$ J. $P = 364{,}500 / 9 = 40{,}500$ W $= 40.5$ kW (about 54 horsepower). Real cars need more than this, because some energy is lost to air resistance, friction and engine heat.`,
            },
          ],
          recap: [
            r`Power $P = W/t$, measured in watts (1 W = 1 J/s).`,
            r`Energy $= P \times t$. 1 kWh = 3.6 MJ.`,
            'Same work done faster means more power.',
          ],
        },
      ],
    },
    {
      title: 'Energy in Practice',
      summary: 'Springs and people.',
      lessons: [
        {
          id: 'elastic',
          title: 'Springs & Elastic Energy',
          summary: 'Storing energy by stretching',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Energy in a stretch',
              body: r`Stretching or compressing a spring takes work, and the spring stores it. Since the force grows with the stretch ($F = kx$), the work is the area of a triangle under the force–extension graph:
$$E = \tfrac12 k x^2$$
Bows, catapults, trampolines and pole-vault poles all store energy elastically, then hand it back as motion.`,
            },
            {
              type: 'numeric',
              title: 'Double the stretch',
              prompt: r`If you compress a spring twice as far, how many times more energy does it store?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`Energy goes as $x^2$: $2^2 = 4$.` }],
              explain: r`$\tfrac12 k(2x)^2 = 4 \times \tfrac12 kx^2$. Both the force and the distance double, so the area (energy) quadruples.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Spring launcher',
              prompt: r`A spring ($k = 400$ N/m) launches a 50 g ball straight up. How far must you compress it for the ball to rise exactly **2 m**? (Ignore air resistance.)`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: -0.3, ymax: 4.6, grid: false, axes: false, height: 300, maxWidth: 360,
                params: { x: { min: 0.01, max: 0.15, step: 0.01, value: 0.04, label: 'compression', color: 'violet', format: (v) => `${(v * 100).toFixed(0)} cm` } },
                extra: ({ plot, p, s }) => {
                  const h = (0.5 * 400 * p.x * p.x) / (0.05 * G);
                  const els = [s('line', { x1: plot.X(0.5), x2: plot.X(3.5), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 })];
                  for (let y = 0; y <= 4; y += 1) els.push(s('line', { x1: plot.X(0.5), x2: plot.X(0.8), y1: plot.Y(y), y2: plot.Y(y), stroke: 'var(--ink-3)', 'stroke-width': 1.5 }), s('text', { x: plot.X(0.45), y: plot.Y(y) + 4, class: 'tick', 'text-anchor': 'end', text: `${y} m` }));
                  els.push(s('line', { x1: plot.X(0.5), x2: plot.X(3.5), y1: plot.Y(2), y2: plot.Y(2), stroke: 'var(--teal)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
                  els.push(s('line', { x1: plot.X(2), x2: plot.X(2), y1: plot.Y(0), y2: plot.Y(Math.min(4.4, h)), stroke: 'var(--coral)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }));
                  els.push(s('circle', { cx: plot.X(2), cy: plot.Y(Math.min(4.4, h)), r: 9, class: 'fl-coral' }));
                  return els;
                },
                readout: (p) => {
                  const E = 0.5 * 400 * p.x * p.x;
                  return r`stored energy $= \tfrac12 (400)(${p.x.toFixed(2)})^2 = ${E.toFixed(2)}$ J $\Rightarrow$ height $= ${(E / (0.05 * G)).toFixed(2)}$ m`;
                },
                goal: (p) => Math.abs(p.x - 0.07) < 1e-9,
                hint: r`Set $\tfrac12 kx^2 = mgh$ with $mgh = 0.05 \times 9.8 \times 2 = 0.98$ J.`,
                solution: { x: 0.07 },
              },
              explain: r`$\tfrac12 \times 400 \times x^2 = 0.98$ J gives $x^2 = 0.0049$, so $x = 7$ cm. All the spring's energy becomes kinetic energy, then gravitational potential energy at the top.`,
            },
            {
              type: 'numeric',
              title: 'Launch speed',
              prompt: r`A spring with stiffness $k = 200$ N/m is compressed by 10 cm and launches a 50 g ball. All the stored energy $\frac12 kx^2$ becomes kinetic energy. How fast does the ball leave? (1 decimal place, in m/s.)`,
              unit: 'm/s',
              answer: Math.sqrt(2 * 0.5 * 200 * 0.01 / 0.05),
              tol: 0.06,
              wrong: [{ v: 40, why: r`That’s $v^2$. Take the square root.` }],
              explain: r`Stored energy: $\frac12 \times 200 \times 0.1^2 = 1$ J. Then $\frac12 \times 0.05 \times v^2 = 1$ gives $v = \sqrt{40} \approx 6.3$ m/s. Compress the spring twice as far and the speed doubles (the energy quadruples).`,
            },
            {
              type: 'numeric',
              title: 'How high?',
              prompt: r`A spring launcher fires a 50 g ball straight up at 10 m/s. Ignoring air resistance, how high does it rise ($\frac{v^2}{2g}$, $g = 9.8$ m/s²)? (1 decimal place.)`,
              unit: 'm',
              answer: 100 / (2 * 9.8),
              tol: 0.1,
              explain: r`$\frac{100}{19.6} \approx 5.1$ m. All the spring’s elastic energy becomes kinetic energy, then gravitational potential energy at the top.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The pole vault',
              prompt: r`A pole vaulter sprints at about 9.5 m/s. If all their kinetic energy became height (via the bending pole), how high could their centre of mass rise? Why do top vaulters clear about 6 m?`,
              choices: [
                { t: r`$\frac{v^2}{2g} \approx 4.6$ m, plus their centre of mass starts about 1 m up and they push off the pole: roughly 6 m`, ok: true },
                { t: 'The pole adds extra energy of its own', why: 'A pole only stores and returns energy; it can’t create any. The extra comes from the starting height and the vaulter’s own push.' },
                { t: 'Energy isn’t conserved in pole vaulting', why: 'It is (minus losses). The numbers work out once you include the initial height and the push.' },
              ],
              explain: r`$\frac{9.5^2}{2 \times 9.8} \approx 4.6$ m from running speed alone. The centre of mass starts around 1 m high, and the vaulter adds energy by pushing up on the pole and swinging. Elite sprinting speed is the single best predictor of vaulting height.`,
            },
          ],
          recap: [
            r`Elastic energy: $E = \frac12 kx^2$, the area under the force–extension line.`,
            'Doubling the stretch quadruples the stored energy.',
            'Springs and poles store energy and return it as motion.',
          ],
        },
        {
          id: 'body',
          title: 'Energy & Your Body',
          summary: 'Food, power and efficiency',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Calories are energy',
              body: r`A food "Calorie" (with a capital C, or kcal) is about 4184 joules. A typical adult eats about 2000–2500 kcal a day, roughly 10 million joules. Your body uses it to keep warm, run your organs (your brain alone takes about 20%) and move your muscles.`,
            },
            {
              type: 'numeric',
              title: 'A human light bulb',
              prompt: r`2500 kcal per day is how many watts, on average? (1 kcal = 4184 J; 1 day = 86,400 s. Nearest watt.)`,
              unit: 'W',
              answer: Math.round((2500 * 4184) / 86400),
              tol: 1,
              wrong: [{ v: 2500, why: 'Convert kcal to joules (× 4184), then divide by the seconds in a day.' }, { v: 29, why: 'Multiply by 4184 to get joules first.' }],
              explain: r`$\frac{2500 \times 4184}{86{,}400} \approx 121$ W: you run at about the power of an old-fashioned light bulb, all day and night.`,
            },
            {
              type: 'numeric',
              title: 'Running upstairs',
              prompt: r`A 70 kg person runs up a 3 m flight of stairs in 4 seconds. What power do their legs deliver to lifting them? (Nearest watt.)`,
              unit: 'W',
              answer: Math.round((70 * G * 3) / 4),
              tol: 1,
              wrong: [{ v: 2058, why: 'That’s the energy in joules. Power is energy ÷ time.' }, { v: 52.5, tol: 0.5, why: r`Use the weight in newtons: $70 \times 9.8$.` }],
              explain: r`$\frac{70 \times 9.8 \times 3}{4} \approx 515$ W, over two-thirds of a horsepower, but only for a few seconds. Trained cyclists can sustain around 400 W for an hour; most people manage 100–200 W.`,
            },
            {
              type: 'mcq',
              title: 'Why exercise makes you hot',
              prompt: r`Muscles convert food energy into mechanical work with about 25% efficiency. What happens to the rest?`,
              choices: [
                { t: 'It becomes heat, which is why you warm up and sweat', ok: true },
                { t: 'It’s stored as fat', why: 'The energy being used right now mostly turns into heat, not fat.' },
                { t: 'It’s destroyed', why: 'Energy can’t be destroyed; the unused 75% becomes heat.' },
              ],
              explain: r`For every joule of work you do, about three more become heat. Climbing those stairs at 515 W of useful power, your body is producing roughly 1500 W of extra heat, so you warm up fast and start sweating to stay cool.`,
            },
            {
              type: 'interactive',
              title: 'Burning a chocolate bar',
              body: r`A chocolate bar holds about 250 kcal. Running burns about 10 kcal per minute (for a typical adult), walking about 4. How many minutes of running burn it off?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 70, ymin: 0, ymax: 300, grid: false, height: 260, axes: { xlabel: 'minutes', ylabel: 'kcal burned', xticks: 10, yticks: 50 },
                params: { m: { min: 0, max: 70, step: 1, value: 10, label: 'minutes running', color: 'coral' } },
                curves: [{ f: (x) => 10 * x, color: 'coral', width: 3 }, { f: (x) => 4 * x, color: 'blue', dash: true }, { f: () => 250, color: 'teal', dash: true }],
                points: [{ x: (p) => p.m, y: (p) => 10 * p.m, color: 'coral' }],
                readout: (p) => `${p.m} min running: **${10 * p.m} kcal** (walking the same time: ${4 * p.m} kcal)`,
                goal: (p) => p.m === 25,
                hint: '250 ÷ 10.',
                solution: { m: 25 },
              },
              explain: r`**25 minutes** of running (or over an hour of walking, dashed). A snack takes minutes to eat and a long time to burn, which is why diet usually matters more than exercise for weight.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Burning off a chocolate bar',
              prompt: r`A chocolate bar contains 250 kcal (about 1.05 MJ). With 25% muscle efficiency, how high would a 70 kg person have to climb to use it up? (Nearest 10 m.)`,
              unit: 'm',
              answer: 380,
              tol: 10,
              wrong: [{ v: 1520, tol: 20, why: r`Only 25% of the energy goes into lifting you: $0.25 \times 1.05 \times 10^6$ J.` }],
              explain: r`Useful work $= 0.25 \times 1.05 \times 10^6 \approx 262{,}000$ J. Height $= \frac{262{,}000}{70 \times 9.8} \approx 380$ m: climbing a tall skyscraper to burn off one bar. That's why diet matters so much more than exercise for weight control.`,
            },
          ],
          recap: [
            '1 kcal ≈ 4184 J; a day’s food (≈ 2500 kcal) averages about 120 W.',
            'Muscles are about 25% efficient; the rest becomes heat.',
            'Climbing hundreds of metres burns only a modest snack.',
          ],
        },
      ],
    },
  ],
};
