import { fix } from '../lib/svg.js';

const r = String.raw;
const G = 9.8;

// range of a throw at speed v (m/s), angle d (degrees), released h metres above the ground
const range = (v, h, d) => {
  const t = (d * Math.PI) / 180, vx = v * Math.cos(t), vy = v * Math.sin(t);
  return (vx * (vy + Math.sqrt(vy * vy + 2 * G * h))) / G;
};
const best = (v, h) => {
  let b = 0;
  for (let d = 1; d < 90; d++) b = Math.max(b, range(v, h, d));
  return b;
};

// sprint model: v(t) = vmax(1 − e^{−t/τ})
const VMAX = 12.2;
const sprintDist = (t, tau) => VMAX * (t - tau * (1 - Math.exp(-t / tau)));
// cycling power at speed v (m/s): air drag + rolling resistance
const cyclePower = (v) => 0.5 * 1.2 * 0.3 * v ** 3 + 0.004 * 80 * G * v;

export default {
  id: 'sports',
  subject: 'physics',
  title: 'Sports Physics',
  level: 'Intermediate',
  cover: 'sports',
  tagline: 'Throwing angles, spin, bounces, sprints, jumps, impacts and cycling, explained by physics.',
  description: r`Why don't shot-putters throw at 45°? What makes a tennis ball bounce, and a football swerve? How fast is the world's fastest human, really? How do high jumpers clear bars their centre of mass passes under, and why does cycling faster cost so much power? Apply mechanics to the games people play.`,
  prereq: 'Motion',
  chapters: [
    {
      title: 'Flight of the Ball',
      summary: 'Angles and spin.',
      lessons: [
        {
          id: 'throwing',
          title: 'The Best Throwing Angle',
          summary: 'Why not always 45°?',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'The textbook answer',
              prompt: r`Ignoring air resistance, a ball launched from **ground level** goes farthest at which angle?`,
              cols: 2,
              choices: [
                { t: '45°', ok: true },
                { t: '30°', why: 'A lower angle gives more horizontal speed, but too little flight time.' },
                { t: '60°', why: 'A steeper angle gives more flight time, but too little horizontal speed.' },
                { t: '90°', why: 'Straight up, the ball lands where it started!' },
              ],
              explain: r`Range from ground level is $R = \dfrac{v^2 \sin 2\theta}{g}$, which is largest when $2\theta = 90°$, so $\theta = 45°$: the best balance between flight time and horizontal speed.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A shot-putter’s throw',
              prompt: r`A shot-putter releases the shot at 14 m/s, **2 m above the ground**. Find the angle (to the nearest degree) that gives the longest throw.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 0, ymax: 24, grid: 15, gridY: 4, height: 300, axes: { xlabel: 'launch angle (°)', ylabel: 'distance (m)' },
                params: { d: { min: 10, max: 80, step: 1, value: 30, label: 'angle', color: 'coral', format: (v) => `${v}°` } },
                curves: [{ f: (x) => (x > 0 && x < 90 ? range(14, 2, x) : NaN), color: 'blue' }, { f: (x) => (x > 0 && x < 90 ? range(14, 0, x) : NaN), color: 'ink', dash: true }],
                points: [{ x: (p) => p.d, y: (p) => range(14, 2, p.d), color: 'coral' }],
                readout: (p) => r`at ${p.d}°: $\;${fix(range(14, 2, p.d), 2)}$ m $\;$ (the dashed curve is a throw from ground level)`,
                goal: (p) => range(14, 2, p.d) >= best(14, 2) - 0.02,
                hint: 'The best angle is a little below 45°, because the shot starts above the ground.',
                solution: { d: 42 },
              },
              explain: r`The optimum is about **42°**, not 45°. Starting 2 m up, the shot already has some "free" fall time, so it pays to trade a little height for more forward speed. In practice, elite shot-putters release at only about 35–38°, because human muscles can push faster at lower angles, which more than makes up for the less-than-ideal angle.`,
            },
            {
              type: 'mcq',
              title: 'Long jump',
              prompt: r`Long jumpers take off at only about 20°. Why so far below 45°?`,
              choices: [
                { t: 'They can’t convert their huge sprint speed into a steep take-off without losing most of it', ok: true },
                { t: 'Air resistance is very strong at 45°', why: 'At jumping speeds, air resistance is a small effect. The real limit is the jumper’s body.' },
                { t: 'A low angle gives more flight time', why: 'A low angle gives **less** flight time. Jumpers keep their speed instead.' },
              ],
              explain: r`A jumper arrives at about 10 m/s horizontally, but legs can only add a few m/s of vertical speed in the brief take-off. Trying to leave at 45° would mean braking hard. Keeping horizontal speed matters more, so the real optimum for a human is far lower than the textbook 45°.`,
            },
            {
              type: 'numeric',
              title: 'A javelin',
              prompt: r`Ignoring air and launch height, how far does a javelin thrown at 28 m/s and 45° travel? ($R = \frac{v^2}{g}$ at 45°; nearest metre.)`,
              unit: 'm',
              answer: Math.round((28 * 28) / G),
              tol: 1,
              wrong: [{ v: 40, why: r`$\frac{28^2}{9.8} = \frac{784}{9.8}$.` }],
              explain: r`$\frac{784}{9.8} = 80$ m. The men's world record is 98.48 m (Jan Železný, 1996): real javelins fly like gliders, using aerodynamic lift, so air helps as well as hurts.`,
            },
            {
              type: 'mcq',
              title: 'Below 45°',
              prompt: r`Shot-putters release about 2 m above the ground and find their best angle is about 37–42°, not 45°. Why lower?`,
              choices: [
                { t: r`The landing point is below the release height, and athletes can push harder at flatter angles`, ok: true },
                { t: r`Air resistance on the heavy shot`, why: r`Drag on a 7 kg shot is negligible; the reasons are release height and body mechanics.` },
                { t: r`45° is always best; athletes are wrong`, why: r`Measurements and calculations both show the optimum is lower.` },
              ],
              explain: r`Releasing above the ground favours a flatter angle, since the shot has extra time to fall. And human muscles can launch a heavy object faster at a lower angle. Both effects push the best angle below 45°.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'On level ground',
              prompt: r`Ignoring air resistance, a ball launched from ground level at speed $v$ and $45°$ travels $\frac{v^2}{g}$. How far does a 25 m/s throw go? ($g = 9.8$ m/s²; nearest metre.)`,
              unit: 'm',
              answer: 625 / 9.8,
              tol: 0.6,
              wrong: [{ v: 625 / 19.6, tol: 0.6, why: r`That's $\frac{v^2}{2g}$, the maximum **height** for a straight-up throw. The range at 45° is $\frac{v^2}{g}$.` }],
              explain: r`$\frac{25^2}{9.8} \approx 64$ m. Double the speed and the range quadruples, which is why a few extra metres per second of release speed matter far more to throwers than perfecting the angle.`,
            },
          ],
          recap: [
            'From ground level, without air, 45° gives the longest range.',
            'Launching from a height lowers the best angle (about 42° for a shot put).',
            'Human limits push real-world angles even lower.',
          ],
        },
        {
          id: 'spin',
          title: 'Spin & Swerve',
          summary: 'The Magnus effect',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'The Magnus effect',
              body: r`A spinning ball drags the air around with its surface. On one side the surface moves **with** the oncoming air, and on the other side **against** it. The air flow is deflected to one side, and by Newton's third law, the ball is pushed the opposite way. This is the **Magnus effect**:

- **Topspin** (the top of the ball moving forward) pushes the ball **down**: it dips sharply.
- **Backspin** pushes it **up**: it floats.
- **Sidespin** makes it **curve** sideways.`,
            },
            {
              type: 'mcq',
              title: 'Golf balls',
              prompt: r`A golf drive leaves the club with strong **backspin**. What does the spin do?`,
              choices: [
                { t: 'It creates lift, so the ball stays in the air much longer and flies farther', ok: true },
                { t: 'It makes the ball dive into the ground', why: 'That’s topspin. Backspin pushes the ball upward.' },
                { t: 'Nothing: spin only matters on the bounce', why: 'Spin has a big effect in flight, through the Magnus force.' },
              ],
              explain: r`Backspin gives lift, much like a wing. Golf balls also have **dimples**, which make the boundary layer of air turbulent so that it clings to the ball longer. That reduces drag dramatically: a dimpled ball flies roughly twice as far as a smooth one.`,
            },
            {
              type: 'mcq',
              title: 'Bending a free kick',
              prompt: r`A right-footed player strikes the right side of the ball, so seen from above it spins **anticlockwise**. Which way does it curve?`,
              cols: 2,
              choices: [
                { t: 'To the left', ok: true },
                { t: 'To the right', why: 'With anticlockwise spin seen from above, the ball’s right side moves forward, into the oncoming air, and its left side moves backward with it. The ball is pushed left.' },
              ],
              explain: r`The ball curves toward the side whose surface moves **backward**, along with the passing air. With anticlockwise spin, that's the left. Roberto Carlos's famous 1997 free kick against France swerved so much that it seemed to defy physics, but it was the Magnus effect plus a slowing ball curving ever more tightly.`,
            },
            {
              type: 'mcq',
              title: 'Topspin in tennis',
              prompt: r`Why do modern tennis players hit with heavy topspin?`,
              choices: [
                { t: 'The downward Magnus force lets them hit harder and still have the ball dip into the court', ok: true },
                { t: 'Topspin makes the ball lighter', why: 'Spin doesn’t change mass. It adds a downward aerodynamic force.' },
                { t: 'It slows the ball down', why: 'Topspin balls can be hit faster, because the spin pulls them down inside the lines.' },
              ],
              explain: r`A flat shot hit hard sails long. With topspin, the Magnus force adds to gravity, curving the ball down sharply, so players can swing harder with safer margins. Spinning racket technology and strings made this style dominant from the 1980s onwards.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A bending kick',
              body: r`Seen from above, a ball kicked straight at the goal 25 m away curves sideways under a steady spin force. Change the spin and watch the path.`,
              widget: {
                kind: 'graph', xmin: -4.5, xmax: 4.5, ymin: -1, ymax: 26, grid: false, axes: false, maxWidth: 420, height: 380,
                params: { a: { min: -6, max: 6, step: 0.5, value: 3, label: 'sideways acceleration', color: 'coral', format: (v) => `${fix(v, 1)} m/s²` } },
                curves: [{ param: { x: (t, p) => 0.5 * p.a * t * t, y: (t) => 25 * t, t0: 0, t1: 1 }, color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(-3.66), x2: plot.X(3.66), y1: plot.Y(25), y2: plot.Y(25), stroke: 'var(--ink)', 'stroke-width': 6 }), s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(0), y2: plot.Y(25), stroke: 'var(--ink-3)', 'stroke-dasharray': '5 5' }), s('line', { x1: plot.X(0), x2: plot.X(0.5 * p.a), y1: plot.Y(0), y2: plot.Y(25), stroke: 'var(--coral)', 'stroke-dasharray': '3 5', 'stroke-width': 2 }), s('circle', { cx: plot.X(0.125 * p.a), cy: plot.Y(12.5), r: 5, class: 'fl-violet' }), s('text', { x: plot.X(-4.3), y: plot.Y(0.5), class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: 'sideways scale stretched' })],
                readout: (p) => `after 1 s of flight: **${(0.5 * p.a).toFixed(2)} m** sideways · at halfway (dot) only ${(0.125 * p.a).toFixed(2)} m`,
              },
              after: r`The deflection grows like $t^2$, so the path is a parabola that bends late: after half the flight the ball has moved only a quarter of its final sideways distance. Goalkeepers, judging by the early flight, are wrong-footed.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How much bend?',
              prompt: r`A free kick takes 1.0 s to reach the goal. Spin gives the ball a steady sideways acceleration of about 4 m/s². How far does it curve sideways? (Use $\frac12 a t^2$.)`,
              unit: 'm',
              answer: 2,
              tol: 0.01,
              wrong: [{ v: 4, why: r`Don't forget the $\frac12$: $\frac12 \times 4 \times 1^2$.` }],
              explain: r`$\frac12 \times 4 \times 1^2 = 2$ m: enough to curl around a defensive wall and back inside the post. Because the deflection grows with $t^2$, the bend happens mostly in the second half of the flight, which is why goalkeepers find it so hard to read.`,
            },
          ],
          recap: [
            'A spinning ball deflects the air flow and is pushed the opposite way: the Magnus effect.',
            'Topspin dips, backspin lifts, sidespin curves.',
            'Dimples cut a golf ball’s drag, roughly doubling its range.',
          ],
        },
      ],
    },
    {
      title: 'Bodies and Balls',
      summary: 'Bounces and sprints.',
      lessons: [
        {
          id: 'bounce',
          title: 'Bounce',
          summary: 'The coefficient of restitution',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'How bouncy is a ball?',
              body: r`When a ball hits the ground, some kinetic energy is lost as heat and sound. The **coefficient of restitution** $e$ compares speeds:
$$e = \frac{\text{speed just after}}{\text{speed just before}}$$
$e = 1$ is a perfect bounce, and $e = 0$ is a dead thud. Since the bounce height goes as speed squared, a ball dropped from height $H$ rebounds to $e^2 H$.`,
            },
            {
              type: 'numeric',
              title: 'Measure e',
              prompt: r`A ball dropped from 2.0 m bounces back to 1.28 m. What is its coefficient of restitution?`,
              lhs: r`$e =$`,
              answer: 0.8,
              tol: 0.005,
              wrong: [{ v: 0.64, tol: 0.005, why: r`That's $e^2$, the height ratio. Take the square root.` }, { v: 1.56, tol: 0.01, why: 'Divide the bounce height by the drop height, not the other way round, then take the square root.' }],
              explain: r`$e^2 = \dfrac{1.28}{2.0} = 0.64$, so $e = 0.8$. Official tennis balls must bounce to about 53–58% of their drop height ($e \approx 0.73$–$0.76$), which is checked with a standard drop test.`,
            },
            {
              type: 'numeric',
              title: 'Bounce after bounce',
              prompt: r`A ball with $e = 0.8$ is dropped from 2 m. How high does it rise after the **third** bounce? (2 decimal places.)`,
              unit: 'm',
              answer: 2 * 0.64 ** 3,
              tol: 0.006,
              wrong: [{ v: 1.02, tol: 0.006, why: 'That’s after two bounces. Multiply by 0.64 once more.' }, { v: 1.02 * 0.8, tol: 0.006, why: r`Each bounce multiplies the **height** by $e^2 = 0.64$, not by $e$.` }],
              explain: r`Each bounce multiplies the height by $e^2 = 0.64$: $2 \times 0.64^3 \approx 0.52$ m. The heights form a geometric sequence, which is why a bouncing ball's rhythm speeds up as it comes to rest.`,
            },
            {
              type: 'numeric',
              title: 'Total distance',
              prompt: r`A ball with $e = 0.8$ is dropped from 2 m and keeps bouncing forever. The total up-and-down distance is $H \cdot \frac{1 + e^2}{1 - e^2}$. How far does it travel in total? (1 decimal place.)`,
              unit: 'm',
              answer: (2 * 1.64) / 0.36,
              tol: 0.06,
              wrong: [{ v: 2 / 0.36, tol: 0.06, why: r`Each bounce goes up **and** down: use $\frac{1 + e^2}{1 - e^2}$.` }],
              explain: r`$2 \times \frac{1.64}{0.36} \approx 9.1$ m: infinitely many bounces, but a finite total distance (a geometric series). The time also adds up to a finite total, so the ball really does come to rest.`,
            },
            {
              type: 'interactive',
              title: 'Bounce by bounce',
              body: r`Each bounce keeps a fraction $e^2$ of the height (where $e$ is the coefficient of restitution). Choose $e$ so that the **third** bounce reaches exactly $\frac18$ of the drop height.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 1.05, grid: false, height: 260, axes: { xlabel: 'bounce', ylabel: 'height (fraction of drop)', xticks: 1, yticks: 0.25 },
                params: { e: { min: 0.3, max: 0.95, step: 0.001, value: 0.8, label: '$e$', color: 'coral', format: (v) => v.toFixed(3) } },
                extra: ({ plot, p, s }) => Array.from({ length: 6 }, (_, n) => { const h = p.e ** (2 * n); return s('rect', { x: plot.X(n + 0.15), y: plot.Y(h), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(h), rx: 3, class: n === 3 ? 'fl-coral' : 'fl-blue' }); }),
                readout: (p) => `third bounce: **${(100 * p.e ** 6).toFixed(1)}%** of the drop height`,
                goal: (p) => Math.abs(p.e ** 6 - 0.125) < 0.002,
                hint: 'Three bounces multiply the height by $e^6$.',
                solution: { e: 0.707 },
              },
              explain: r`$e^6 = \frac18$ gives $e = \frac{1}{\sqrt2} \approx 0.707$: each bounce keeps half the height. Bounce heights shrink geometrically, so the total distance travelled is a finite geometric series even though the bounces never quite stop.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Warming up the ball',
              prompt: r`Squash players hit the ball around before a match because a cold squash ball barely bounces. Why does warming it help?`,
              choices: [
                { t: 'Warm rubber is springier, and the warmer air inside pushes back harder, so less energy is lost in each bounce (a higher e)', ok: true },
                { t: 'Heat makes the ball lighter', why: 'Its mass doesn’t change. What changes is how much energy it returns.' },
                { t: 'Friction with the wall increases', why: 'The key change is inside the ball: a higher coefficient of restitution.' },
              ],
              explain: r`A cold squash ball might have $e \approx 0.3$; warmed up, nearer $0.5$. Since bounce height scales like $e^2$, that nearly triples how high it bounces. Professional balls (with a double yellow dot) are designed to be very dead when cold, rewarding long rallies.`,
            },
          ],
          recap: [
            r`Coefficient of restitution $e$ = speed after ÷ speed before.`,
            r`Bounce height ratio $= e^2$.`,
            'Successive bounce heights form a geometric sequence.',
          ],
        },
        {
          id: 'sprint',
          title: 'Sprinting',
          summary: 'How fast can humans run?',
          icon: 'bolt',
          steps: [
            {
              type: 'numeric',
              title: 'Average speed',
              prompt: r`Usain Bolt's 100 m world record is 9.58 s (2009). What was his average speed?`,
              unit: 'm/s',
              answer: 100 / 9.58,
              tol: 0.02,
              wrong: [{ v: 958, why: r`Speed = distance ÷ time: $100 / 9.58$.` }, { v: 0.0958, tol: 0.001, why: 'You divided time by distance. Speed is distance ÷ time.' }],
              explain: r`$100 / 9.58 \approx 10.44$ m/s, about 37.6 km/h. But he wasn't going that speed the whole way: he started from rest.`,
            },
            {
              type: 'mcq',
              title: 'Top speed',
              prompt: r`Since Bolt started from rest, how did his **top** speed compare with his 10.44 m/s average?`,
              choices: [
                { t: 'It was higher: about 12.3 m/s', ok: true },
                { t: 'It was the same', why: 'He spent the first few seconds accelerating, so to average 10.44 m/s he must have gone faster later.' },
                { t: 'It was lower', why: 'An average can’t exceed the maximum!' },
              ],
              explain: r`Measurements during the 2009 race showed a peak of about **12.3 m/s** (over 44 km/h) between 60 and 80 m. The slow start drags the average down, and sprinters actually slow slightly near the finish.`,
            },
            {
              type: 'numeric',
              title: 'Power output',
              prompt: r`In the first second, a 90 kg sprinter accelerates from rest to about 6 m/s. What average power is needed just to supply that kinetic energy?`,
              unit: 'W',
              answer: 0.5 * 90 * 36,
              tol: 10,
              wrong: [{ v: 540, why: r`Kinetic energy is $\tfrac12 mv^2$: square the speed.` }, { v: 3240, why: r`Don't forget the $\tfrac12$ in $\tfrac12 mv^2$.` }],
              explain: r`$\tfrac12 \times 90 \times 6^2 = 1620$ J in 1 second, so about **1,600 W**: more than two horsepower, and that's only the useful kinetic energy. Muscles are only about 25% efficient, so the body burns energy several times faster still. No wonder sprinters can't keep it up for long.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Model a record',
              prompt: r`A simple model of a sprint: $v(t) = v_{\max}(1 - e^{-t/\tau})$ with $v_{\max} = 12.2$ m/s, where $\tau$ sets how quickly the runner accelerates. Choose $\tau$ so the runner covers 100 m in Bolt's 9.58 s.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 13, grid: 1, gridY: 2, height: 280, axes: { xlabel: 'time (s)', ylabel: 'speed (m/s)' },
                params: { tau: { min: 0.8, max: 2.5, step: 0.05, value: 2, label: 'τ', color: 'violet', format: (v) => `${v.toFixed(2)} s` } },
                curves: [{ f: (t, p) => VMAX * (1 - Math.exp(-t / p.tau)), color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(9.58), x2: plot.X(9.58), y1: plot.Y(0), y2: plot.Y(13), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 5' })],
                readout: (p) => r`distance after 9.58 s $= ${sprintDist(9.58, p.tau).toFixed(1)}$ m (the area under the curve)`,
                goal: (p) => Math.abs(sprintDist(9.58, p.tau) - 100) < 0.5,
                hint: 'A smaller τ means faster acceleration and more distance.',
                solution: { tau: 1.35 },
              },
              explain: r`$\tau \approx 1.35$–$1.4$ s fits: within about 4 s the runner is near top speed. The distance is the area under the speed–time graph. Real sprinters also fade slightly at the end, which this simple model ignores.`,
            },
            {
              type: 'numeric',
              title: 'Slow off the blocks',
              prompt: r`A sprinter reacts to the gun 0.15 s later than a rival. If both are eventually running at 12 m/s, roughly how many metres does that delay cost at top speed?`,
              unit: 'm',
              answer: 1.8,
              tol: 0.01,
              explain: r`$0.15 \times 12 = 1.8$ m, a huge margin in a 100 m final. Reactions faster than 0.1 s are counted as false starts, since humans can’t genuinely react that fast.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Moving energy',
              prompt: r`Usain Bolt (94 kg) reached a top speed of about 12.3 m/s. What was his kinetic energy at that moment, in kilojoules? (1 decimal place.)`,
              unit: 'kJ',
              answer: (0.5 * 94 * 12.3 ** 2) / 1000,
              tol: 0.06,
              wrong: [{ v: (94 * 12.3 ** 2) / 1000, tol: 0.1, why: r`Don't forget the $\frac12$ in $\frac12 mv^2$.` }],
              explain: r`$\frac12 \times 94 \times 12.3^2 \approx 7.1$ kJ, similar to a small car at 15 km/h. Much of the sprint's effort goes into reaching that speed in the first few seconds, and then into replacing what each stride loses.`,
            },
          ],
          recap: [
            r`Bolt's 100 m record averages 10.44 m/s, with a top speed of about 12.3 m/s.`,
            'Starting from rest drags the average below the top speed.',
            'Sprint starts demand well over a kilowatt of power.',
          ],
        },
      ],
    },
    {
      title: 'Bodies in Action',
      summary: 'Jumping, hitting and riding.',
      lessons: [
        {
          id: 'highjump',
          title: 'The High Jump',
          summary: 'Clearing a bar your centre of mass doesn’t',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'The centre of mass rules',
              body: r`Once a jumper leaves the ground, their **centre of mass** follows a parabola that nothing they do in the air can change. What they **can** change is how their body is arranged around it.

In 1968 Dick Fosbury won Olympic gold going over backwards, arching his back over the bar. In that arch, the body drapes around the bar while the centre of mass passes **below** it.`,
            },
            {
              type: 'numeric',
              title: 'Take-off speed',
              prompt: r`To raise their centre of mass by 1.2 m, what vertical take-off speed does a jumper need? ($v = \sqrt{2gh}$; 2 decimal places.)`,
              unit: 'm/s',
              answer: Math.sqrt(2 * G * 1.2),
              tol: 0.01,
              wrong: [{ v: 23.52, tol: 0.1, why: 'Take the square root of 2gh.' }],
              explain: r`$\sqrt{2 \times 9.8 \times 1.2} \approx 4.85$ m/s straight up. Every extra centimetre of bar height needs more take-off speed, which is why lowering the centre of mass relative to the bar is so valuable.`,
            },
            {
              type: 'mcq',
              title: 'Why the flop won',
              prompt: r`Why did the Fosbury flop replace the older "straddle" technique at the top level?`,
              choices: [
                { t: 'For the same take-off, the arched body can clear a higher bar, since the centre of mass can pass below it', ok: true },
                { t: 'It lets jumpers rise higher in the air', why: 'The centre of mass rises the same amount for the same take-off speed. The flop changes what clears the bar.' },
                { t: 'It is safer for landing', why: 'It needed soft landing mats to become practical, but the advantage is geometric.' },
              ],
              explain: r`Arched over the bar, each body part crosses in turn while the centre of mass stays a few centimetres below it. Every world record since the 1970s has used the flop. (It only became practical once deep foam mats replaced sand pits.)`,
            },
            { /*anim:sports*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Under the bar',
              body: r`Here is a jumper's body (thickness included) passing over the bar at the top of a jump, drawn from the side. Watch the {amber:centre of mass} as the jumper arches their back.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.25, xmax: 1.25, ymin: 1.3, ymax: 2.55, grid: false, axes: false, maxWidth: 520,
                animate: { param: 't', speed: 0.7, max: 2 * Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const bar = 2.0, half = 0.12, Lb = 1.8, phi = Math.max(0.02, 1.6 * (1 - Math.cos(p.t)) / 2), R = Lb / (2 * phi);
                  // the body's centre line is an arc; its lowest underside point at the top just clears the bar
                  const cy = bar + half + 0.01 - R, els = [];
                  const pts = [];
                  for (let i = 0; i <= 60; i++) { const a = -phi + (2 * phi * i) / 60; pts.push([R * Math.sin(a), cy + R * Math.cos(a)]); }
                  const com = bar + half + 0.01 - R * (1 - Math.sin(phi) / phi);
                  els.push(s('line', { x1: plot.X(-1.2), x2: plot.X(1.2), y1: plot.Y(bar), y2: plot.Y(bar), stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '6 6' }));
                  els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': plot.X(2 * half) - plot.X(0), 'stroke-linecap': 'round', opacity: 0.85 }));
                  const [hx, hy] = pts[0];
                  els.push(s('circle', { cx: plot.X(hx), cy: plot.Y(hy), r: plot.X(0.13) - plot.X(0), class: 'fl-blue' }));
                  // the bar, end on
                  els.push(s('circle', { cx: plot.X(0), cy: plot.Y(bar), r: 6, class: 'fl-coral', stroke: 'var(--card)', 'stroke-width': 2 }));
                  const cx0 = plot.X(0), cyp = plot.Y(com);
                  els.push(s('circle', { cx: cx0, cy: cyp, r: 8, class: 'fl-amber', stroke: 'var(--ink)', 'stroke-width': 2 }));
                  els.push(s('path', { d: `M${cx0 - 8} ${cyp}h16M${cx0} ${cyp - 8}v16`, stroke: 'var(--ink)', 'stroke-width': 1.5 }));
                  els.push(s('text', { x: plot.X(1.0), y: plot.Y(bar) + 18, 'text-anchor': 'middle', class: 'halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));fill:var(--ink-3)', text: 'bar height' }));
                  return els;
                },
                readout: (p) => { const phi = Math.max(0.02, 1.6 * (1 - Math.cos(p.t)) / 2), R = 1.8 / (2 * phi), d = 100 * (0.13 - R * (1 - Math.sin(phi) / phi)); return `centre of mass **${fix(Math.abs(d), 0)} cm ${d >= 0 ? 'above' : 'below'}** the bar`; },
              },
              after: r`Lying flat over the bar, the centre of mass must be above it, by at least half the body's thickness. Arched like a bridge, the body drapes down on both sides, and the centre of mass ends up **outside the body, below the bar**. Every centimetre the centre of mass doesn't have to rise is energy saved at take-off, which is how the Fosbury flop beats the older techniques.`,
            },
            {
              type: 'numeric',
              title: 'Pole vault energy',
              prompt: r`A pole vaulter sprints at 9.5 m/s. If all that kinetic energy went into lifting the centre of mass, how high would it rise? ($h = \frac{v^2}{2g}$; 1 decimal place.)`,
              unit: 'm',
              answer: 9.5 ** 2 / 19.6,
              tol: 0.06,
              wrong: [{ v: 9.5 ** 2 / 9.8, tol: 0.1, why: r`It's $\frac{v^2}{2g}$, not $\frac{v^2}{g}$.` }],
              explain: r`$\frac{9.5^2}{2 \times 9.8} \approx 4.6$ m. Add the centre of mass's starting height (about 1 m) and a final push off the pole, and you reach the 6 m bars cleared by elite vaulters. The pole stores the energy as it bends and returns it as height.`,
            },
            {
              type: 'interactive',
              title: 'Clearing 2 metres',
              body: r`A high jumper’s centre of mass starts 1.0 m up at take-off. With the Fosbury flop it can pass about 0.1 m **below** the bar. Choose the vertical take-off speed needed to clear a 2.0 m bar.`,
              widget: {
                kind: 'graph', xmin: 3, xmax: 5.5, ymin: 0, ymax: 2.6, grid: false, height: 260, axes: { xlabel: 'vertical take-off speed (m/s)', ylabel: 'peak height of centre of mass (m)', xticks: 0.5, yticks: 0.5, xAt: 3 },
                params: { v: { min: 3, max: 5.5, step: 0.05, value: 3.8, label: 'take-off speed', color: 'coral', format: (v) => `${v.toFixed(2)} m/s` } },
                curves: [{ f: (x) => 1 + (x * x) / (2 * 9.8), color: 'violet', width: 3 }, { f: () => 1.9, color: 'teal', dash: true }, { f: () => 2.0, color: 'muted', dash: true }],
                points: [{ x: (p) => p.v, y: (p) => 1 + (p.v * p.v) / (2 * 9.8), color: 'coral' }],
                readout: (p) => `centre of mass peaks at **${(1 + (p.v * p.v) / (2 * 9.8)).toFixed(2)} m** (needs 1.90 m for a flop over 2.00 m)`,
                goal: (p) => 1 + (p.v * p.v) / (2 * 9.8) >= 1.9 && p.v <= 4.25,
                hint: 'The rise is $\\frac{v^2}{2g}$, and it must be 0.9 m.',
                solution: { v: 4.2 },
              },
              explain: r`A rise of 0.9 m needs $v = \sqrt{2 \times 9.8 \times 0.9} \approx 4.2$ m/s. Without the flop the centre of mass would have to pass 0.1 m **above** the bar, needing 4.6 m/s: the technique is worth a lot of energy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Jumping on the Moon',
              prompt: r`A jumper who can raise their centre of mass 1.2 m on Earth takes off with the same speed on the Moon ($g$ is $\frac16$ as strong). How high would their centre of mass rise there?`,
              unit: 'm',
              answer: 7.2,
              tol: 0.01,
              wrong: [{ v: 0.2, tol: 0.01, why: r`Weaker gravity means **higher** jumps: $h = \frac{v^2}{2g}$ grows as $g$ shrinks.` }],
              explain: r`$h = \frac{v^2}{2g}$, so $\frac16$ of the gravity gives 6 times the height: 7.2 m (bulky spacesuits aside). Apollo astronauts found it easier to hop than to walk.`,
            },
          ],
          recap: [
            'In the air, the centre of mass follows a fixed parabola.',
            r`Take-off speed $v = \sqrt{2gh}$ sets the rise of the centre of mass.`,
            'The Fosbury flop lets the body clear a bar its centre of mass passes under.',
          ],
        },
        {
          id: 'impacts',
          title: 'Impacts',
          summary: 'Forces in a few milliseconds',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Impulse',
              body: r`A tennis serve, a football kick and a cricket shot all change a ball's momentum in a few thousandths of a second. Newton's second law in the form
$$F = \frac{\Delta p}{\Delta t}$$
means a big momentum change in a tiny time needs an enormous force. The product $F\,\Delta t$ is the **impulse**.`,
            },
            {
              type: 'numeric',
              title: 'A tennis serve',
              prompt: r`A 57 g tennis ball goes from rest to 50 m/s in 4 milliseconds. What average force does the racket apply? (Nearest 10 N.)`,
              unit: 'N',
              answer: 710,
              tol: 10,
              wrong: [{ v: 0.71, tol: 0.05, why: 'Convert 4 ms to 0.004 s and 57 g to 0.057 kg.' }, { v: 2850, tol: 20, why: r`$\Delta p = 0.057 \times 50 = 2.85$ kg·m/s; divide by 0.004 s.` }],
              explain: r`$\Delta p = 0.057 \times 50 = 2.85$ kg·m/s, so $F = \frac{2.85}{0.004} \approx 710$ N: like the weight of a 72 kg person, applied for a blink of an eye. The ball squashes noticeably during contact.`,
            },
            {
              type: 'mcq',
              title: 'Follow through',
              prompt: r`Coaches tell players to "follow through" after hitting a ball. Why does it help?`,
              choices: [
                { t: 'It keeps the racket or club moving at full speed through contact instead of slowing before impact', ok: true },
                { t: 'It pushes the ball after it has left', why: 'Once the ball leaves, nothing more can be done. The follow-through ensures the swing doesn’t decelerate during contact.' },
                { t: 'It has no physical effect', why: 'A swing that starts stopping early is slower at impact, transferring less momentum.' },
              ],
              explain: r`If you plan to stop at the ball, your muscles start braking before impact. Following through keeps the speed (and the contact duration) up, maximising the impulse delivered.`,
            },
            {
              type: 'numeric',
              title: 'Hitting a baseball',
              prompt: r`A 0.145 kg baseball arrives at 40 m/s and leaves the bat at 45 m/s in the opposite direction, after 0.7 ms of contact. What is the average force on the ball? (Nearest 100 N.)`,
              unit: 'N',
              answer: (0.145 * 85) / 0.0007,
              relTol: 0.03,
              wrong: [{ v: (0.145 * 5) / 0.0007, relTol: 0.05, why: 'The velocity reverses, so the change is 40 + 45 = 85 m/s, not 5.' }],
              explain: r`Change in momentum: $0.145 \times (40 + 45) = 12.3$ kg·m/s. Divided by 0.0007 s: about **17,600 N**, the weight of nearly two tonnes, for less than a thousandth of a second.`,
            },
            {
              type: 'interactive',
              title: 'Long contact',
              body: r`A bat changes a 0.145 kg ball’s velocity by 85 m/s. The impulse is fixed, so a longer contact time means a smaller average force. How long must the contact last to keep the force under **10,000 N**?`,
              widget: {
                kind: 'graph', xmin: 0.3, xmax: 3, ymin: 0, ymax: 45000, grid: false, height: 260, padL: 56, axes: { xlabel: 'contact time (ms)', ylabel: 'average force (N)', xticks: 0.5, yticks: 10000, xAt: 0.3 },
                params: { t: { min: 0.3, max: 3, step: 0.01, value: 0.7, label: 'contact time', color: 'coral', format: (v) => `${v.toFixed(2)} ms` } },
                curves: [{ f: (x) => (0.145 * 85) / (x / 1000), color: 'violet', width: 3 }, { f: () => 10000, color: 'teal', dash: true }],
                points: [{ x: (p) => p.t, y: (p) => Math.min(45000, (0.145 * 85) / (p.t / 1000)), color: 'coral' }],
                readout: (p) => `impulse 12.3 N·s over ${p.t.toFixed(2)} ms: average force **${((0.145 * 85) / (p.t / 1000)).toFixed(0)} N**`,
                goal: (p) => (0.145 * 85) / (p.t / 1000) <= 10000 && p.t <= 1.25,
                hint: 'Force × time = 12.3 N·s.',
                solution: { t: 1.24 },
              },
              explain: r`At least **1.24 ms**. Extending contact time is the whole idea of padding, airbags and bending your knees on landing: the same change of momentum spread over more time means a smaller force.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The sweet spot',
              prompt: r`Hitting a ball at a bat's "sweet spot" feels effortless and sends it farther. What's special about that spot?`,
              choices: [
                { t: 'Little energy goes into vibrating the bat or jolting your hands, so more goes into the ball', ok: true },
                { t: 'The bat is thickest there', why: 'Thickness isn’t the point: it’s where vibrations and jarring forces are smallest.' },
                { t: 'It’s the bat’s centre of mass', why: 'The sweet spot is usually further out than the centre of mass.' },
              ],
              explain: r`An impact elsewhere sets the bat ringing (you feel the sting) and twists it in your hands, wasting energy. Near the sweet spot, a zone between the bat's main vibration node and its "centre of percussion", those losses are minimal.`,
            },
          ],
          recap: [
            r`Impulse: $F\,\Delta t = \Delta p$; brief impacts mean huge forces.`,
            'Following through keeps the striking speed high during contact.',
            'The sweet spot minimises wasted vibration and jolting.',
          ],
        },
        {
          id: 'cycling',
          title: 'Cycling & Air Resistance',
          summary: 'Power grows as speed cubed',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Fighting the air',
              body: r`At racing speeds, most of a cyclist's effort goes into pushing air aside. Drag force grows as speed squared, $F = \tfrac12 \rho C_d A v^2$, and power is force × speed, so the power needed grows as speed **cubed**:
$$P \approx \tfrac12 \rho C_d A\, v^3 + \text{(rolling resistance)}$$
For a racing cyclist, $C_d A \approx 0.3$ m² and air density $\rho \approx 1.2$ kg/m³.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Your top speed',
              prompt: r`A strong amateur can hold 250 W for an hour. Find the fastest speed (to the nearest 0.5 m/s) they can sustain on flat ground.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 16, ymin: 0, ymax: 700, grid: 2, gridY: 100, height: 280, padL: 48, axes: { xlabel: 'speed (m/s)', ylabel: 'power (W)' },
                params: { v: { min: 4, max: 15, step: 0.5, value: 8, slider: false } },
                curves: [{ f: (v) => cyclePower(v), color: 'violet', width: 3 }, { f: () => 250, color: 'coral', dash: true, width: 2 }],
                points: [{ x: (p) => p.v, y: (p) => cyclePower(p.v), drag: { x: 'v' }, color: 'teal' }],
                readout: (p) => r`${fix(p.v, 1)} m/s (${(p.v * 3.6).toFixed(1)} km/h) needs $${cyclePower(p.v).toFixed(0)}$ W`,
                goal: (p) => cyclePower(p.v) <= 250 && cyclePower(p.v + 0.5) > 250,
                hint: 'Find where the curve crosses the dashed 250 W line, staying at or below it.',
                solution: { v: 10.5 },
              },
              explain: r`About 10.5 m/s (38 km/h). To go 20% faster, you'd need about 70% more power, because of the cube. That's why records are so hard to break and why aerodynamics matters so much.`,
            },
            {
              type: 'numeric',
              title: 'Double the speed',
              prompt: r`Ignoring rolling resistance, by what factor must power increase to ride twice as fast?`,
              unit: '×',
              answer: 8,
              wrong: [{ v: 4, why: 'Drag force quadruples, but you also cover ground twice as fast: power = force × speed.' }, { v: 2, why: r`Power goes as $v^3$.` }],
              explain: r`$2^3 = 8$. Drag force goes as $v^2$ (4×), and you must supply it at twice the speed (2×): $4 \times 2 = 8$.`,
            },
            {
              type: 'numeric',
              title: 'Pedal power',
              prompt: r`A cyclist's power is roughly $P = \frac12 \rho C_d A\, v^3 + C_r m g v$, with $\frac12 \rho C_d A = 0.18$ kg/m and rolling resistance $C_r m g = 3.1$ N. How much power is needed at 10 m/s (36 km/h)? (Nearest watt.)`,
              unit: 'W',
              answer: 0.18 * 1000 + 3.1 * 10,
              tol: 2,
              wrong: [{ v: 180, why: 'Add the rolling resistance power too: 3.1 N × 10 m/s.' }],
              explain: r`$0.18 \times 10^3 + 3.1 \times 10 = 180 + 31 = 211$ W, with air resistance taking about 85%. A fit amateur can sustain around 200 W, which is why 35 km/h on the flat is a typical good club pace.`,
            },
            {
              type: 'numeric',
              title: 'Going faster',
              prompt: r`A cyclist needs 150 W to ride at 30 km/h on the flat (mostly fighting air resistance, which needs power $\propto v^3$). How much power is needed for 40 km/h? (Nearest 5 W.)`,
              unit: 'W',
              answer: 150 * Math.pow(4 / 3, 3),
              tol: 3,
              explain: r`$150 \times \left(\frac43\right)^3 \approx 356$ W, more than double for a third more speed. That’s why aerodynamic positions and drafting matter so much in racing.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Drafting',
              prompt: r`Riding closely behind another cyclist can cut your drag by about 30%. With the same power, how much faster can you go? (Ignore rolling resistance; as a percentage, nearest whole number.)`,
              unit: '%',
              answer: Math.round((1 / 0.7) ** (1 / 3) * 100 - 100),
              tol: 0.6,
              wrong: [{ v: 30, why: r`Power $\propto C_d A\, v^3$: with 0.7 of the drag, $v$ grows by $(1/0.7)^{1/3}$.` }, { v: 43, why: r`That's $\frac{1}{0.7}$, but speed grows only as the cube root.` }],
              explain: r`$v \propto (C_d A)^{-1/3}$, so $(1/0.7)^{1/3} \approx 1.126$: about **13% faster** for free. That's why racing cyclists ride in tight groups (pelotons) and take turns at the front.`,
            },
          ],
          recap: [
            r`Drag grows as $v^2$; the power to overcome it grows as $v^3$.`,
            'Doubling speed needs about 8 times the power.',
            'Drafting can cut drag by about 30%, giving roughly 13% more speed.',
          ],
        },
      ],
    },
  ],
};
