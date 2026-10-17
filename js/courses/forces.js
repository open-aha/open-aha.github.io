import { fix } from '../lib/svg.js';

const r = String.raw;
const G = 9.8;
const f2 = (v) => (Math.round(v * 100) / 100).toString();
const rad = (d) => (d * Math.PI) / 180;

export default {
  id: 'forces',
  subject: 'physics',
  title: 'Forces & Newton’s Laws',
  level: 'Foundational',
  cover: 'forces',
  tagline: 'Why things start, stop and turn: pushes, pulls, friction, ramps, springs and pulleys.',
  description: r`Push blocks, tilt ramps and ride elevators to discover Newton's three laws. Learn to draw free-body diagrams, predict accelerations with $F = ma$, tame friction, measure springs, connect objects with strings and pulleys, and balance forces like an engineer.`,
  prereq: 'Motion',
  chapters: [
    {
      title: 'Newton’s Three Laws',
      summary: 'Inertia, F = ma, and action–reaction.',
      lessons: [
        {
          id: 'inertia',
          title: 'Inertia',
          summary: 'Motion doesn’t need a push',
          icon: 'play',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The endless rink',
              body: r`Imagine a hockey puck sliding across perfectly smooth, frictionless ice that goes on forever. There's no air either.`,
              prompt: 'What happens to the puck?',
              choices: [
                { t: 'It keeps sliding at the same speed in a straight line', ok: true },
                { t: 'It slowly slows down and stops', why: 'On real ice, friction and air slow it down. Take those away, and nothing is left to change its motion.' },
                { t: 'It speeds up', why: 'Nothing is pushing it forward, so it can’t gain speed.' },
                { t: 'It curves to one side', why: 'Nothing pushes it sideways, so its direction can’t change.' },
              ],
              explain: r`With no friction and no air, nothing acts on the puck to change its motion. So it keeps the same speed and direction forever.`,
            },
            {
              type: 'explain',
              title: 'Push, then let go',
              body: r`This block sits on frictionless ice. Press **Play**: a 10 N push acts for **1 second only**, then stops. Watch the velocity graph after the push ends.`,
              widget: {
                kind: 'forces', m: 2, F: 10, muS: 0, muK: 0, pushTime: 1, T: 4, show: ['applied'], scale: 6, vgraph: { ymin: 0, ymax: 8, step: 2 },
                readout: ({ v, t }) => (t <= 1 ? r`Pushing… $\;v = ${fix(v, 2)}$ m/s` : r`No force now. $\;v = ${fix(v, 2)}$ m/s`),
                ready: true,
              },
              after: r`During the push, the velocity rises. After the push, it stays at 5 m/s. The block doesn't need a force to **keep** moving, only to **change** how it moves.`,
            },
            {
              type: 'explain',
              title: 'Newton’s first law',
              body: r`::: key
An object keeps its velocity (staying at rest, or moving at a constant speed in a straight line) unless a **net force** acts on it.
:::

This tendency to keep doing what it's doing is called **inertia**.

For about 2000 years, people followed Aristotle's idea that moving things need a constant push. That matches everyday life, because things *do* slow down. Galileo's insight was that friction is an invisible force doing the stopping. Remove friction, and motion simply continues.`,
            },
            {
              type: 'mcq',
              title: 'Engines off',
              body: r`A spaceship far from any star or planet is coasting at 1000 m/s. The crew turns off the engines.`,
              prompt: 'What happens next?',
              choices: [
                { t: 'It keeps moving at 1000 m/s', ok: true },
                { t: 'It gradually slows to a stop', why: 'In empty space there’s no friction or air to slow it down.' },
                { t: 'It stops immediately', why: 'Turning off the engines removes the force that changes its speed. It doesn’t remove the speed itself.' },
              ],
              explain: r`With no net force, the velocity doesn't change. The Voyager probes, launched in 1977, are still coasting out of the solar system, decades after their launch rockets burned out.`,
            },
            {
              type: 'mcq',
              title: 'Sudden stop',
              prompt: 'Why do passengers lurch forward when a bus brakes suddenly?',
              choices: [
                { t: 'Their bodies keep moving forward while the bus slows down', ok: true },
                { t: 'A forward force pushes them', why: 'Nothing pushes you forward. Your body just keeps going while the bus (and the floor under your feet) slows down.' },
                { t: 'The bus pulls them forward', why: 'The bus slows down underneath you. It isn’t pulling you.' },
              ],
              explain: r`Your body has inertia: it keeps moving at the bus's old speed. The bus slows down underneath you, so relative to the bus you move forward. A seatbelt supplies the force that slows **you** down too.`,
            },
            {
              type: 'multi',
              title: 'Balanced or not?',
              prompt: 'In which situations is the **net force** zero? Select all that apply.',
              choices: [
                { t: 'A book resting on a table', ok: true },
                { t: 'A car cruising at a steady 100 km/h on a straight road', ok: true },
                { t: 'A skydiver falling at a constant (terminal) speed', ok: true },
                { t: 'A ball at the very top of its flight', why: 'Gravity still acts on it, and nothing balances gravity. That’s why it comes back down.' },
                { t: 'A car going around a bend at a constant speed', why: 'Its direction is changing, so its velocity is changing. That needs a net force, pointing toward the centre of the bend.' },
              ],
              explain: r`Zero net force means **constant velocity**: same speed **and** same direction. The book, the cruising car and the skydiver at terminal speed all qualify, because their forces balance out. The ball at the top is still accelerating downward, and the cornering car is changing direction.`,
            },
          ],
          recap: [
            'An object’s velocity changes only when a net force acts on it (the first law).',
            'Moving at a constant velocity needs no net force. Friction is what usually stops things.',
            'Zero net force means constant speed AND constant direction.',
          ],
        },
        {
          id: 'f-ma',
          title: 'F = ma',
          summary: 'Force, mass and acceleration',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Push harder, push heavier',
              body: r`A steady force pushes a block across frictionless ice. Try different forces and masses, and watch how quickly the velocity grows.`,
              widget: {
                kind: 'forces', muS: 0, muK: 0, T: 3, show: ['applied'], scale: 5, vgraph: { ymin: 0, ymax: 15, step: 3 },
                params: {
                  F: { min: 0, max: 20, step: 1, value: 8, label: '$F$', color: 'blue', format: (v) => `${v} N` },
                  m: { min: 1, max: 8, step: 1, value: 2, label: '$m$', color: 'coral', format: (v) => `${v} kg` },
                },
              },
            },
            {
              type: 'mcq',
              title: 'Predict',
              prompt: 'If you double the force on the same block, what happens to its acceleration?',
              cols: 2,
              choices: [
                { t: 'It doubles', ok: true },
                { t: 'It halves', why: 'More force means more acceleration, not less.' },
                { t: 'It stays the same', why: 'Try it in the simulation: a bigger force makes the velocity graph steeper.' },
                { t: 'It quadruples', why: 'Acceleration grows in proportion to force: twice the force gives twice the acceleration.' },
              ],
              explain: r`Acceleration is proportional to force: $a \propto F$. And for a fixed force, doubling the mass **halves** the acceleration: $a \propto 1/m$.`,
            },
            {
              type: 'explain',
              title: 'Newton’s second law',
              body: r`Put both together:
$$F_\text{net} = m\,a$$

The **net** force (all the forces added together, with direction) equals mass times acceleration.

The unit of force is the **newton**: 1 N is the force that gives 1 kg an acceleration of 1 m/s². So $1\text{ N} = 1\text{ kg}\cdot\text{m/s}^2$. An apple weighs about 1 N.`,
            },
            {
              type: 'numeric',
              title: 'Car',
              prompt: 'A 1200 kg car accelerates at 2.5 m/s². What net force acts on it?',
              unit: 'N',
              answer: 3000,
              wrong: [
                { v: 480, why: r`That's $m / a$. Use $F = m \times a$.` },
                { v: 1202.5, why: 'Multiply the mass by the acceleration. Don’t add them.' },
              ],
              explain: r`$F = ma = 1200 \times 2.5 = 3000$ N.`,
            },
            {
              type: 'interactive',
              title: 'Hit the target speed',
              body: r`The block has a mass of 3 kg and sits on frictionless ice. Choose a force so that it reaches exactly **6 m/s** after 3 seconds. Then press **Play**.`,
              widget: {
                kind: 'forces', m: 3, muS: 0, muK: 0, T: 3, show: ['applied'], scale: 6, vgraph: { ymin: 0, ymax: 12, step: 2 },
                params: { F: { min: 0, max: 12, step: 1, value: 3, label: '$F$', color: 'blue', format: (v) => `${v} N` } },
                needRun: true,
                goal: (p, st) => (p.F === 6 ? true : { ok: false, msg: `With ${p.F} N the block reached ${f2((p.F / 3) * 3)} m/s.` }),
                solution: { F: 6 },
              },
              explain: r`To reach 6 m/s in 3 s you need $a = 6/3 = 2$ m/s². Then $F = ma = 3 \times 2 = 6$ N.`,
            },
            {
              type: 'numeric',
              title: 'Tug of war',
              body: r`A 2 kg block on frictionless ice is pulled 10 N to the right and 4 N to the left.`,
              prompt: 'What is the size of its acceleration?',
              unit: 'm/s²',
              answer: 3,
              wrong: [
                { v: 7, why: r`The forces point in opposite directions, so they partly cancel: $10 - 4$, not $10 + 4$.` },
                { v: 5, why: 'That ignores the 4 N pull to the left. Use the *net* force.' },
                { v: 6, why: r`The net force is 6 N. Divide by the mass to get the acceleration.` },
              ],
              explain: r`Net force: $10 - 4 = 6$ N to the right. So $a = F_\text{net}/m = 6/2 = 3$ m/s², to the right.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Batter up',
              body: r`A 0.15 kg baseball goes from rest to 40 m/s in 0.005 s as it leaves the bat.`,
              prompt: 'What average force does the bat exert?',
              unit: 'N',
              answer: 1200,
              wrong: [
                { v: 6, why: r`That's $m \times v$. You need the acceleration first: $a = \Delta v / \Delta t$.` },
                { v: 8000, why: 'That’s the acceleration, in m/s². Now multiply by the mass.' },
              ],
              explain: r`$a = \frac{\Delta v}{\Delta t} = \frac{40}{0.005} = 8000$ m/s². Then $F = ma = 0.15 \times 8000 = 1200$ N. That's more than the weight of a 120 kg person, but it only lasts a few thousandths of a second.`,
            },
          ],
          recap: [
            r`$F_\text{net} = ma$: acceleration is proportional to the net force and inversely proportional to the mass.`,
            r`1 N = 1 kg·m/s².`,
            'Add forces with their directions before using F = ma.',
          ],
        },
        {
          id: 'action-reaction',
          title: 'Action & Reaction',
          summary: 'Forces come in pairs',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Splat',
              body: r`A moving truck hits a mosquito.`,
              prompt: 'Which feels the bigger force during the collision?',
              choices: [
                { t: 'They feel forces of the same size', ok: true },
                { t: 'The mosquito', why: 'The mosquito comes off worse, but that’s because of its tiny mass, not a bigger force.' },
                { t: 'The truck', why: 'The truck is bigger, but that doesn’t mean it exerts a bigger force. The forces are a matched pair.' },
              ],
              explain: r`The truck pushes the mosquito, and the mosquito pushes the truck back **equally hard**. But $a = F/m$: the same force on a tiny mass gives an enormous acceleration (splat), while the truck's change in speed is far too small to notice.`,
            },
            {
              type: 'explain',
              title: 'Newton’s third law',
              body: r`::: key
If object A pushes on object B, then B pushes on A with a force of the **same size** in the **opposite direction**.
:::

The two forces in a pair:
- are always the same type (contact with contact, gravity with gravity),
- act on **different** objects, so they never cancel each other out.

You push on a wall, and the wall pushes back on you. You walk by pushing backward on the ground, and the ground pushes you forward.`,
            },
            {
              type: 'mcq',
              title: 'Find the partner',
              body: r`An apple sits on a table. One force on it is: **Earth's gravity pulls the apple down.**`,
              prompt: 'What is the third-law partner of that force?',
              choices: [
                { t: 'The apple’s gravity pulls Earth up', ok: true },
                { t: 'The table pushes the apple up', why: 'That force is real and has the same size here, but it acts on the same object (the apple) and it’s a contact force, not gravity. It isn’t the partner.' },
                { t: 'The apple pushes down on the table', why: 'That’s the partner of the table’s upward push, a contact force. The partner of gravity has to be gravity.' },
              ],
              explain: r`Third-law pairs swap the roles of the two objects: "Earth pulls apple" pairs with "apple pulls Earth", with the same size and the same type of force. Earth's acceleration from that pull is unimaginably tiny because Earth's mass is so large.`,
            },
            {
              type: 'mcq',
              title: 'The horse and cart',
              body: r`A horse pulls a cart. By the third law, the cart pulls back on the horse just as hard.`,
              prompt: 'So how can they ever start moving?',
              choices: [
                { t: 'The two forces act on different objects, and the ground pushes the horse forward harder than the cart pulls it back', ok: true },
                { t: 'The horse pulls slightly harder than the cart pulls back', why: 'The third-law pair is always exactly equal, even while things speed up.' },
                { t: 'The forces cancel, so they can’t move. Carts really move because of momentum', why: 'Third-law forces act on different objects, so they can’t cancel each other.' },
              ],
              explain: r`To find out whether the **horse** speeds up, only add the forces **on the horse**. The cart pulls it back, but the ground pushes it forward (the horse pushes the ground backward with its hooves). If the ground's push is bigger, the horse accelerates.

The pair "horse pulls cart / cart pulls horse" never cancels, because the two forces act on different things.`,
            },
            {
              type: 'mcq',
              title: 'Rockets in space',
              prompt: 'How can a rocket speed up in empty space, where there is nothing to push against?',
              choices: [
                { t: 'It pushes hot exhaust gas backward, and the gas pushes the rocket forward', ok: true },
                { t: 'It can’t, rockets only work inside an atmosphere', why: 'Rockets work in a vacuum. In fact they work slightly better there, with no air in the way.' },
                { t: 'The exhaust pushes against the air behind it', why: 'There’s no air in space. The rocket pushes on its own exhaust.' },
              ],
              explain: r`The rocket throws mass (the exhaust) backward at high speed. By the third law, the exhaust pushes the rocket forward. It's the same reason a skateboarder rolls backward after throwing a heavy ball forward.`,
            },
            {
              type: 'numeric',
              title: 'Skaters',
              body: r`Alice (50 kg) and Bob (75 kg) stand on frictionless ice. Alice pushes Bob with a force of 150 N.`,
              prompt: 'What is the size of Alice’s acceleration?',
              unit: 'm/s²',
              answer: 3,
              wrong: [
                { v: 2, why: 'That’s Bob’s acceleration. Alice feels the same 150 N, but she has a different mass.' },
                { v: 0, why: 'Bob pushes back on Alice with 150 N, so she accelerates too.' },
                { v: 1.2, why: r`That's $150 / 125$, as if the two skaters were one object. Each skater moves separately.` },
              ],
              explain: r`Bob pushes Alice back with 150 N (third law). So $a_\text{Alice} = 150/50 = 3$ m/s², while $a_\text{Bob} = 150/75 = 2$ m/s². Same force, different masses, different accelerations, in opposite directions.`,
            },
            {
              type: 'interactive',
              title: 'Push apart',
              body: r`Two skaters push off each other. The forces are equal and opposite, so each gains the same momentum. Set the second skater’s mass so the 50 kg skater moves off **three times as fast**.`,
              widget: {
                kind: 'graph', xmin: -10, xmax: 10, ymin: -1, ymax: 2, grid: false, axes: false, height: 160,
                params: { m: { min: 25, max: 200, step: 5, value: 80, label: 'second skater’s mass', color: 'coral', format: (v) => `${v} kg` } },
                extra: ({ plot, p, s, arrow }) => { const v1 = 300 / 50, v2 = 300 / p.m; return [s('circle', { cx: plot.X(-1), cy: plot.Y(0.6), r: 14, class: 'fl-blue' }), s('circle', { cx: plot.X(1), cy: plot.Y(0.6), r: 10 + p.m / 12, class: 'fl-coral' }), arrow(plot.X(-1.5), plot.Y(0.6), plot.X(-1.5 - v1), plot.Y(0.6), { color: 'var(--blue)', width: 4 }), arrow(plot.X(1.5 + p.m / 80), plot.Y(0.6), plot.X(1.5 + p.m / 80 + v2), plot.Y(0.6), { color: 'var(--coral)', width: 4 }), s('text', { x: plot.X(-1), y: plot.Y(-0.4), 'text-anchor': 'middle', class: 'tick', text: '50 kg' })]; },
                readout: (p) => `speeds: 50 kg skater **${(300 / 50).toFixed(2)} m/s**, ${p.m} kg skater **${(300 / p.m).toFixed(2)} m/s** (same push, momentum 300 kg·m/s each way)`,
                goal: (p) => p.m === 150,
                hint: 'Equal momentum means speed is inversely proportional to mass.',
                solution: { m: 150 },
              },
              explain: r`With 150 kg, the momenta $50 \times 6 = 150 \times 2$ balance: the lighter skater moves 3 times as fast. The forces on the two are equal, but the same force gives a lighter body a bigger acceleration.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A tempting pair',
              body: r`A book rests on a table. Its weight (20 N, down) and the normal force from the table (20 N, up) are equal and opposite.`,
              prompt: 'Are they a third-law pair?',
              choices: [
                { t: 'No: both act on the book, and they are equal because the book isn’t accelerating', ok: true },
                { t: 'Yes: they are equal and opposite', why: 'Being equal and opposite isn’t enough. A third-law pair acts on two *different* objects, and these both act on the book.' },
                { t: 'Yes, but only while the book is at rest', why: 'They are never a third-law pair. They just happen to balance when the book doesn’t accelerate.' },
              ],
              explain: r`Both forces act on the **same** object, so they aren't a third-law pair. They're equal only because the book's acceleration is zero (first law). In an accelerating elevator they would *not* be equal.

The real partners are: Earth pulls the book ↔ the book pulls Earth, and the table pushes the book up ↔ the book pushes the table down.`,
            },
          ],
          recap: [
            'Forces come in pairs: A on B and B on A, with the same size and opposite directions.',
            'The two forces in a pair act on different objects, so they never cancel each other.',
            'To predict an object’s motion, add up only the forces acting on that object.',
          ],
        },
      ],
    },
    {
      title: 'Forces in Action',
      summary: 'Weight, friction and ramps.',
      lessons: [
        {
          id: 'weight-normal',
          title: 'Weight & Normal Force',
          summary: 'Free-body diagrams and elevators',
          icon: 'down',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Mass vs. weight',
              prompt: r`A person has a mass of 60 kg. What is their weight on Earth? (Use $g = 9.8$ m/s².)`,
              unit: 'N',
              answer: 588,
              tol: 0.5,
              wrong: [
                { v: 60, why: 'That’s the mass, in kg. Weight is a force, measured in newtons.' },
                { v: 6.12, tol: 0.05, why: r`Multiply by $g$, don't divide: $W = mg$.` },
              ],
              explain: r`$W = mg = 60 \times 9.8 = 588$ N.`,
            },
            {
              type: 'explain',
              title: 'Mass and weight are different',
              body: r`- **Mass** (kg) measures how much matter something has, and how hard it is to accelerate. It's the same everywhere.
- **Weight** (N) is the force of gravity on it: $W = mg$. It depends on where you are.

On the Moon, $g \approx 1.6$ m/s², so the same 60 kg person weighs only about 96 N, but is just as hard to push sideways.`,
            },
            {
              type: 'explain',
              title: 'Free-body diagrams',
              body: r`A **free-body diagram** shows **all** the forces on **one** object, drawn as arrows from the object.

For a box resting on the floor there are two forces: its {violet:weight} pulling down, and the {teal:normal force} from the floor pushing up. "Normal" means perpendicular: surfaces push straight out from themselves.`,
              widget: { kind: 'forces', m: 5, F: 0, show: ['weight', 'normal'], scale: 1.6, height: 330, T: 1, ready: true, readout: () => r`Resting: $N = W = mg = 49$ N, so $F_\text{net} = 0$` },
              after: r`The box isn't accelerating, so the forces balance: $N = W$. But $N$ isn't *always* equal to $W$. Watch what happens in an elevator.`,
            },
            {
              type: 'mcq',
              title: 'Elevator going up',
              body: r`You stand on a bathroom scale in an elevator. The scale shows the normal force it pushes on you with. The elevator starts moving **upward**, speeding up.`,
              prompt: 'While it speeds up, the scale reads…',
              choices: [
                { t: 'More than your weight', ok: true },
                { t: 'Less than your weight', why: 'You are accelerating upward, so the upward force on you has to win.' },
                { t: 'Exactly your weight', why: 'That would mean zero net force, but you’re accelerating.' },
              ],
              explain: r`You accelerate upward, so the net force on you points up. The scale's push must be bigger than gravity's pull: $N - mg = ma$, so $N = m(g + a)$. You feel heavier.`,
            },
            {
              type: 'numeric',
              title: 'How much heavier?',
              prompt: 'A 60 kg person is in an elevator accelerating upward at 2 m/s². What does the scale read?',
              unit: 'N',
              answer: 708,
              tol: 0.5,
              wrong: [
                { v: 588, tol: 0.5, why: 'That’s the person’s weight. The scale has to push harder than that to accelerate them upward.' },
                { v: 468, tol: 0.5, why: r`That would be for accelerating **downward**. Upward needs $N = m(g + a)$.` },
                { v: 120, why: r`That's just $ma$, the net force. The scale also has to cancel gravity.` },
              ],
              explain: r`$N = m(g + a) = 60 \times (9.8 + 2) = 60 \times 11.8 = 708$ N.`,
            },
            {
              type: 'numeric',
              title: 'Going down',
              prompt: 'Now the elevator accelerates **downward** at 2 m/s². What does the scale read?',
              unit: 'N',
              answer: 468,
              tol: 0.5,
              wrong: [
                { v: 708, tol: 0.5, why: r`Accelerating downward means the scale pushes *less*: $N = m(g - a)$.` },
                { v: 588, tol: 0.5, why: 'That would be true if the elevator were moving at a constant speed.' },
              ],
              explain: r`$N = m(g - a) = 60 \times 7.8 = 468$ N. You feel lighter, which is that stomach-drop feeling at the start of a descent.`,
            },
            {
              type: 'mcq',
              title: 'Snap!',
              prompt: 'If the elevator cable snapped and everything fell freely, what would the scale read?',
              cols: 2,
              choices: [
                { t: 'Zero', ok: true },
                { t: 'Your normal weight', why: r`You and the scale both fall with acceleration $g$, so the scale doesn't need to push on you at all.` },
                { t: 'Double your weight', why: 'Free fall makes the scale read less, not more.' },
              ],
              explain: r`Put $a = g$ into $N = m(g - a)$: $N = 0$. You'd float relative to the elevator: **apparent weightlessness**.

That's exactly why astronauts float on the Space Station. Gravity there is still about 90% as strong as on the ground, but the station and everyone in it are in continuous free fall around Earth.`,
            },
          ],
          recap: [
            'Weight W = mg is a force (in newtons). Mass (in kg) is the same everywhere.',
            'A free-body diagram shows every force on one object.',
            r`The normal force adjusts itself: $N = m(g + a)$ when accelerating upward. In free fall, $N = 0$.`,
          ],
        },
        {
          id: 'friction',
          title: 'Friction',
          summary: 'Static vs. kinetic',
          icon: 'hand',
          steps: [
            {
              type: 'interactive',
              kicker: 'Warm-up',
              title: 'Get it moving',
              body: r`A 5 kg crate rests on a rough floor. Find the **smallest** push that gets it sliding, to within 1 N. Adjust the force and press **Play** to test.`,
              widget: {
                kind: 'forces', m: 5, muS: 0.5, muK: 0.3, T: 2.5, show: ['applied', 'friction'], scale: 3,
                params: { F: { min: 0, max: 40, step: 0.5, value: 10, label: '$F$', color: 'blue', format: (v) => `${fix(v, 1)} N` } },
                readout: ({ F, fr, v }) => r`push $= ${fix(F, 1)}$ N, $\;$ friction $= ${fix(Math.abs(fr), 1)}$ N, $\;v = ${fix(v, 2)}$ m/s`,
                needRun: true,
                goal: (p, st) => {
                  if (!st.moved) return { ok: false, msg: `At ${p.F} N the crate didn’t budge. Push harder.` };
                  if (p.F > 25.5) return { ok: false, msg: `It moved! But could a smaller push (below ${p.F} N) do it too?` };
                  return true;
                },
                solution: { F: 25 },
              },
              explain: r`The crate starts to slide just above **24.5 N**. Below that, friction matched your push exactly and nothing moved. Where does 24.5 N come from? Read on.`,
            },
            {
              type: 'explain',
              title: 'Static friction holds on',
              body: r`While the crate is still, **static friction** pushes back exactly as hard as you push, but only up to a limit:
$$f_\text{s} \le \mu_\text{s} N$$
Here $\mu_\text{s}$ (the *coefficient of static friction*) is a number that depends on the two surfaces. For this crate, $\mu_\text{s} = 0.5$ and $N = mg = 49$ N, so the limit is $0.5 \times 49 = 24.5$ N.

Once it slides, **kinetic friction** takes over. It has a fixed size, $f_\text{k} = \mu_\text{k} N$, which is usually smaller than the static limit.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 30, grid: 5, gridY: 5, height: 300, axes: { xlabel: 'push F (N)', ylabel: 'friction (N)' },
                curves: [
                  { f: (x) => x, color: 'amber', to: () => 24.5 },
                  { f: () => 14.7, color: 'amber', from: () => 24.5 },
                  { f: (x) => x, color: 'muted', dash: true, width: 1.5 },
                ],
                extra: ({ plot, s }) => [
                  s('line', { x1: plot.X(24.5), x2: plot.X(24.5), y1: plot.Y(24.5), y2: plot.Y(14.7), stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '3 4' }),
                  s('text', { x: plot.X(8), y: plot.Y(18), class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'static: matches push' }),
                  s('text', { x: plot.X(26), y: plot.Y(11), class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'kinetic: μk·N = 14.7 N' }),
                ],
              },
            },
            {
              type: 'numeric',
              title: 'A gentle push',
              prompt: 'You push the same crate with 10 N and it doesn’t move. How big is the friction force?',
              unit: 'N',
              answer: 10,
              wrong: [
                { v: 24.5, tol: 0.05, why: 'That’s the *maximum* static friction. Friction only pushes back as hard as it needs to.' },
                { v: 14.7, tol: 0.05, why: 'That’s kinetic friction, which only applies once the crate is sliding.' },
                { v: 0, why: 'If there were no friction, your 10 N push would accelerate the crate.' },
              ],
              explain: r`The crate isn't accelerating, so the net force is zero: friction must be exactly 10 N, opposite to your push. Static friction is only as strong as it needs to be.`,
            },
            {
              type: 'numeric',
              title: 'Sliding friction',
              prompt: r`Once the crate is sliding, how big is the friction force? ($\mu_\text{k} = 0.3$)`,
              unit: 'N',
              answer: 14.7,
              tol: 0.05,
              wrong: [
                { v: 1.5, tol: 0.05, why: r`Use the normal force, $N = mg = 49$ N, not the mass.` },
                { v: 24.5, tol: 0.05, why: r`That's the static limit, using $\mu_\text{s}$. Sliding uses $\mu_\text{k} = 0.3$.` },
              ],
              explain: r`$f_\text{k} = \mu_\text{k} N = 0.3 \times 49 = 14.7$ N.`,
            },
            {
              type: 'numeric',
              title: 'Keep pushing',
              prompt: 'While it slides, you push with 30 N. What is the crate’s acceleration?',
              unit: 'm/s²',
              answer: 3.06,
              tol: 0.02,
              wrong: [
                { v: 6, why: 'Don’t forget friction. Use the net force.' },
                { v: 1.1, tol: 0.02, why: r`Use kinetic friction (14.7 N) now that it's sliding, not the static limit.` },
              ],
              explain: r`Net force: $30 - 14.7 = 15.3$ N. So $a = 15.3 / 5 = 3.06$ m/s².`,
            },
            {
              type: 'mcq',
              title: 'The heavy sofa',
              prompt: 'Why is it harder to get a heavy sofa moving than to keep it moving?',
              choices: [
                { t: 'The static friction limit is bigger than kinetic friction', ok: true },
                { t: 'The sofa gets lighter once it moves', why: 'Its mass and weight don’t change.' },
                { t: 'Friction disappears once it is moving', why: 'Kinetic friction is still there. It’s just smaller than the static limit.' },
              ],
              explain: r`To start it, you have to beat $\mu_\text{s} N$. To keep it going at a constant speed, you only need to match $\mu_\text{k} N$, which is usually smaller. That's why it "breaks free" with a jolt.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Anti-lock brakes',
              prompt: 'Why do anti-lock brakes (ABS) usually help a car stop in a shorter distance?',
              choices: [
                { t: 'They keep the tyres rolling, so the grip is static friction, which can be larger than skidding friction', ok: true },
                { t: 'They make the car lighter', why: 'Braking systems don’t change the car’s mass.' },
                { t: 'They remove friction so the car glides', why: 'Friction is what stops the car. Removing it would be a disaster.' },
              ],
              explain: r`A rolling tyre's contact patch doesn't slide against the road, so it can use static friction up to $\mu_\text{s}N$. A locked, skidding tyre only gets kinetic friction $\mu_\text{k}N$, which is usually less. ABS also lets you keep steering, because rolling tyres can still grip sideways.`,
            },
          ],
          recap: [
            r`Static friction matches the push, up to $\mu_\text{s} N$. Kinetic friction while sliding is $\mu_\text{k} N$.`,
            r`Usually $\mu_\text{k} < \mu_\text{s}$: starting something moving is harder than keeping it moving.`,
            'Friction always opposes sliding or attempted sliding.',
          ],
        },
        {
          id: 'inclines',
          title: 'Ramps',
          summary: 'Splitting gravity into parts',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Tilt the ramp',
              body: r`A block sits on a frictionless ramp. Change the angle and press **Play**. The {pink:pink arrow} is the part of gravity that points **along** the slope.`,
              widget: {
                kind: 'forces', mode: 'incline', m: 2, muS: 0, muK: 0, T: 3, show: ['weight', 'normal', 'gpar'], scale: 5,
                params: { angle: { min: 5, max: 50, step: 1, value: 20, label: r`$\theta$`, color: 'violet', format: (v) => `${v}°` } },
                readout: ({ gpar, N, a }) => r`$W_\parallel = ${fix(gpar, 2)}$ N $\quad N = ${fix(N, 2)}$ N $\quad a = ${fix(a, 2)}$ m/s²`,
              },
              after: 'The steeper the ramp, the bigger the pink component, and the smaller the normal force.',
            },
            {
              type: 'explain',
              title: 'Components of gravity',
              body: r`On a ramp tilted at angle $\theta$, split the weight $mg$ into two perpendicular parts:

- **Along the slope:** $mg\sin\theta$. This pulls the block down the ramp.
- **Into the slope:** $mg\cos\theta$. The ramp pushes back with an equal normal force, $N = mg\cos\theta$.

Without friction, the block accelerates at
$$a = \frac{mg\sin\theta}{m} = g\sin\theta$$
The mass cancels out!`,
              widget: {
                kind: 'figure', w: 600, h: 300, label: 'Weight split into components on an incline',
                draw: ({ s, arrow }) => {
                  const th = (30 * Math.PI) / 180;
                  const x0 = 60, y0 = 270, L = 480;
                  const els = [s('path', { d: `M${x0} ${y0} L${x0 + L} ${y0} L${x0} ${y0 - L * Math.tan(th) * 0.55} Z`, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  // surface goes from (x0, top) down to the right
                  const topY = y0 - L * Math.tan(th) * 0.55;
                  const ang = Math.atan2(y0 - topY, L);
                  const bx = x0 + 200, by = topY + 200 * Math.tan(ang);
                  const deg = (ang * 180) / Math.PI;
                  els.push(s('g', { transform: `translate(${bx},${by}) rotate(${deg})` }, s('rect', { x: -40, y: -56, width: 80, height: 56, rx: 8, class: 'fl-coral' })));
                  const cx = bx + Math.sin(ang) * 28, cy = by - Math.cos(ang) * 28;
                  const Wl = 110;
                  els.push(arrow(cx, cy, cx, cy + Wl, { color: 'var(--violet)', width: 4.5 }));
                  const par = Wl * Math.sin(ang), perp = Wl * Math.cos(ang);
                  els.push(arrow(cx, cy, cx + par * Math.cos(ang), cy + par * Math.sin(ang), { color: 'var(--pink)', width: 4.5 }));
                  els.push(arrow(cx, cy, cx - perp * Math.sin(ang), cy + perp * Math.cos(ang), { color: 'var(--blue)', width: 4.5 }));
                  els.push(s('line', { x1: cx + par * Math.cos(ang), y1: cy + par * Math.sin(ang), x2: cx, y2: cy + Wl, stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 }));
                  els.push(s('line', { x1: cx - perp * Math.sin(ang), y1: cy + perp * Math.cos(ang), x2: cx, y2: cy + Wl, stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 }));
                  els.push(s('text', { x: cx + 10, y: cy + Wl - 4, class: 'lbl fl-violet', text: 'mg' }));
                  els.push(s('text', { x: cx + par * Math.cos(ang) + 8, y: cy + par * Math.sin(ang) - 4, class: 'lbl', style: 'fill:var(--pink)', text: 'mg sin θ' }));
                  els.push(s('text', { x: cx - perp * Math.sin(ang) - 8, y: cy + perp * Math.cos(ang) + 18, 'text-anchor': 'end', class: 'lbl fl-blue', text: 'mg cos θ' }));
                  els.push(s('text', { x: x0 + L - 70, y: y0 - 10, class: 'lbl', text: 'θ' }));
                  return els;
                },
              },
            },
            {
              type: 'numeric',
              title: 'Sliding down',
              prompt: 'A block slides down a frictionless 30° ramp. What is its acceleration?',
              unit: 'm/s²',
              answer: 4.9,
              tol: 0.02,
              wrong: [
                { v: 8.49, tol: 0.02, why: r`That's $g\cos 30°$. The part along the slope uses $\sin$.` },
                { v: 9.8, tol: 0.02, why: 'That’s free fall. The ramp holds the block back, so only part of gravity acts along the slope.' },
              ],
              explain: r`$a = g\sin 30° = 9.8 \times 0.5 = 4.9$ m/s², exactly half of free fall.`,
            },
            {
              type: 'interactive',
              title: 'On the edge',
              body: r`Now the ramp has friction ($\mu_\text{s} = 0.4$). Find the **steepest** whole-number angle at which the block still stays put. Press **Play** to test each angle.`,
              widget: {
                kind: 'forces', mode: 'incline', m: 2, muS: 0.4, muK: 0.3, T: 2, show: ['weight', 'normal', 'friction', 'gpar'], scale: 5,
                params: { angle: { min: 5, max: 40, step: 1, value: 12, label: r`$\theta$`, color: 'violet', format: (v) => `${v}°` } },
                readout: ({ gpar, fr, N, muS }) => r`$W_\parallel = ${fix(gpar, 2)}$ N, $\;$ friction limit $\mu_\text{s}N = ${fix(muS * N, 2)}$ N`,
                needRun: true,
                goal: (p, st) => {
                  if (st.moved) return { ok: false, msg: `At ${p.angle}° it slid. Try a slightly gentler slope.` };
                  if (p.angle < 21) return { ok: false, msg: `At ${p.angle}° it holds. Can it hold on a steeper slope?` };
                  return true;
                },
                solution: { angle: 21 },
                validate() {
                  const holds = (deg) => Math.tan((deg * Math.PI) / 180) <= 0.4;
                  return holds(21) && !holds(22) ? null : 'threshold angle wrong';
                },
              },
              explain: r`The block stays put while $mg\sin\theta \le \mu_\text{s}\, mg\cos\theta$, which means $\tan\theta \le \mu_\text{s} = 0.4$. Since $\tan 21° \approx 0.384$ and $\tan 22° \approx 0.404$, it holds at 21° and slips at 22°.`,
            },
            {
              type: 'mcq',
              title: 'Heavier block?',
              prompt: 'You replace the block with one twice as heavy, made of the same material. At what angle does it start to slip?',
              choices: [
                { t: 'The same angle', ok: true },
                { t: 'A smaller angle', why: r`More weight means more pull down the slope, but also a bigger normal force and so more friction. They grow together.` },
                { t: 'A bigger angle', why: r`The extra friction is exactly balanced by the extra pull down the slope.` },
              ],
              explain: r`Both $mg\sin\theta$ and $\mu_\text{s} mg\cos\theta$ double, so $m$ cancels from the slipping condition $\tan\theta = \mu_\text{s}$. In fact, this is a simple way to **measure** $\mu_\text{s}$: tilt a surface until the object slips, then take the tangent of the angle.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rough slide',
              body: r`A 10 kg box slides down a 30° ramp with $\mu_\text{k} = 0.2$.`,
              prompt: 'What is its acceleration?',
              unit: 'm/s²',
              answer: 3.2,
              tol: 0.03,
              wrong: [
                { v: 4.9, tol: 0.03, why: 'That ignores friction. Friction acts up the slope while the box slides down.' },
                { v: 2.94, tol: 0.03, why: r`Friction uses the normal force, $mg\cos\theta$, not the full weight $mg$.` },
                { v: 6.6, tol: 0.03, why: 'Friction opposes the sliding, so subtract it from the pull down the slope. Don’t add it.' },
              ],
              hint: r`Along the slope: $mg\sin\theta$ down, $\mu_\text{k}\, mg\cos\theta$ up.`,
              explain: r`$$a = g(\sin\theta - \mu_\text{k}\cos\theta) = 9.8\,(0.5 - 0.2 \times 0.866) = 9.8 \times 0.327 \approx 3.20\text{ m/s}^2$$
The mass cancels again: a 1 kg or a 100 kg box would accelerate at the same rate.`,
            },
          ],
          recap: [
            r`On a ramp: $mg\sin\theta$ pulls along the slope, and $N = mg\cos\theta$.`,
            r`Frictionless: $a = g\sin\theta$. With friction: $a = g(\sin\theta - \mu_\text{k}\cos\theta)$.`,
            r`An object starts to slip when $\tan\theta > \mu_\text{s}$, whatever its mass.`,
          ],
        },
      ],
    },
    {
      title: 'Springs, Strings and Balance',
      summary: 'Elastic forces, tension and equilibrium.',
      lessons: [
        {
          id: 'springs',
          title: 'Springs & Hooke’s Law',
          summary: 'Stretch is proportional to force',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Hooke’s law',
              body: r`Hang a weight on a spring and it stretches. In 1676 Robert Hooke found that, as long as you don't overstretch it, the extension $x$ is proportional to the force $F$:
$$F = kx$$
The **spring constant** $k$ (in N/m) measures stiffness: a stiff car suspension spring might have $k$ around $30{,}000$ N/m, a slinky well under 1 N/m. Spring scales and car suspensions rely on this simple law.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Measure the stiffness',
              prompt: r`A student hangs different weights on a spring and measures the extension (the dots). Adjust $k$ until the line $F = kx$ fits the data.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.45, ymin: 0, ymax: 11, grid: 0.05, gridY: 2, height: 280, padL: 48, axes: { xlabel: 'extension (m)', ylabel: 'force (N)', xfmt: (v) => v.toFixed(2) },
                params: { k: { min: 5, max: 50, step: 1, value: 15, label: 'k', color: 'violet', format: (v) => `${v} N/m` } },
                curves: [{ f: (x, p) => p.k * x, color: 'violet', width: 3 }],
                extra: ({ plot, s }) => [[0.08, 2], [0.16, 4], [0.24, 6], [0.32, 8], [0.4, 10]].map(([x, f]) => s('circle', { cx: plot.X(x), cy: plot.Y(f), r: 6, class: 'fl-coral' })),
                readout: (p) => r`$F = ${p.k}x$`,
                goal: (p) => p.k === 25,
                hint: 'Take one data point: what force gives 0.08 m of stretch? Divide force by extension.',
                solution: { k: 25 },
              },
              explain: r`$k = \frac{F}{x} = \frac{2\ \text{N}}{0.08\ \text{m}} = 25$ N/m. The slope of a force–extension graph is the spring constant.`,
            },
            {
              type: 'numeric',
              title: 'How far?',
              prompt: r`A spring with $k = 200$ N/m supports a 5 N weight. How far does it stretch, in centimetres?`,
              unit: 'cm',
              answer: 2.5,
              tol: 0.01,
              wrong: [{ v: 1000, why: r`Extension is $x = \frac{F}{k}$, not $F \times k$.` }, { v: 0.025, tol: 0.001, why: 'That’s in metres. Convert to centimetres.' }],
              explain: r`$x = \frac{F}{k} = \frac{5}{200} = 0.025$ m $= 2.5$ cm.`,
            },
            {
              type: 'mcq',
              title: 'Two springs',
              prompt: r`Two identical springs hang **side by side**, sharing a load. Compared with one spring, how stiff is the pair?`,
              choices: [
                { t: 'Twice as stiff: each spring carries half the load, so it stretches half as much', ok: true },
                { t: 'Half as stiff', why: 'That’s for springs joined end to end (in series), where each one feels the full load.' },
                { t: 'The same stiffness', why: 'Each spring now carries only half the weight, so the stretch halves.' },
              ],
              explain: r`Side by side (in parallel), the load is shared: $k_{\text{pair}} = 2k$. End to end (in series), each spring feels the full load and stretches fully, so the total stretch doubles: $k_{\text{pair}} = \frac{k}{2}$.`,
            },
            {
              type: 'numeric',
              title: 'Energy in a spring',
              prompt: r`A spring with stiffness 200 N/m is stretched by 10 cm. How much energy does it store, $\frac12 kx^2$, in joules?`,
              unit: 'J',
              answer: 1,
              tol: 0.001,
              explain: r`$\frac12 \times 200 \times 0.1^2 = 1$ J. Doubling the stretch quadruples the energy, which is why over-stretched springs (and bows) snap back so hard.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Too far',
              prompt: r`A student keeps adding weights to a steel spring. Eventually, after removing them, the spring stays longer than it started. What happened?`,
              choices: [
                { t: 'It passed its elastic limit and deformed permanently', ok: true },
                { t: 'Its spring constant increased', why: 'Past the elastic limit, Hooke’s law stops applying and the metal deforms plastically.' },
                { t: 'Nothing: springs always return to their original length', why: 'Only within the elastic limit. Overstretched springs are permanently deformed.' },
              ],
              explain: r`Hooke's law only holds up to the **elastic limit**. Beyond it, the material deforms permanently (plastically), like a stretched-out slinky. Engineers design springs to stay well within the limit.`,
            },
          ],
          recap: [
            r`Hooke's law: $F = kx$, valid up to the elastic limit.`,
            'The slope of a force–extension graph is the spring constant.',
            'Springs side by side are stiffer (2k); end to end, softer (k/2).',
          ],
        },
        {
          id: 'pulleys',
          title: 'Tension & Pulleys',
          summary: 'Connected objects',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Strings pull',
              body: r`A taut string pulls on whatever it's attached to with a force called **tension**. A light string over a smooth pulley has the same tension all along it: the pulley just changes the direction of the pull.

In an **Atwood machine**, two masses hang from either end of a string over a pulley. If one is heavier, both accelerate together, the heavy one down and the light one up.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Atwood machine',
              prompt: r`The left mass is 5 kg. Choose the right mass so the system accelerates at exactly **one third of $g$**.`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 3, ymin: -6, ymax: 1.5, grid: false, axes: false, height: 300, maxWidth: 420, equal: true,
                params: { m: { min: 0.5, max: 10, step: 0.5, value: 4, label: 'right mass', color: 'teal', format: (v) => `${fix(v, 1)} kg` } },
                extra: ({ plot, p, s }) => {
                  const a = ((5 - p.m) / (5 + p.m)) * G, sz = (m) => 0.35 + 0.12 * Math.sqrt(m);
                  const yl = -3 - a * 0.15, yr = -3 + a * 0.15, u = plot.X(1) - plot.X(0);
                  return [
                    s('line', { x1: plot.X(-2), x2: plot.X(2), y1: plot.Y(1.3), y2: plot.Y(1.3), stroke: 'var(--ink)', 'stroke-width': 4 }),
                    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(1.3), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: u, class: 'fl-surface', stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(-1), x2: plot.X(-1), y1: plot.Y(0), y2: plot.Y(yl), stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('line', { x1: plot.X(1), x2: plot.X(1), y1: plot.Y(0), y2: plot.Y(yr), stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('rect', { x: plot.X(-1 - sz(5)), y: plot.Y(yl), width: 2 * sz(5) * u, height: 2 * sz(5) * u, rx: 6, class: 'fl-coral' }),
                    s('rect', { x: plot.X(1 - sz(p.m)), y: plot.Y(yr), width: 2 * sz(p.m) * u, height: 2 * sz(p.m) * u, rx: 6, class: 'fl-teal' }),
                    s('text', { x: plot.X(-1), y: plot.Y(yl - sz(5)) + 5, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--card)', text: '5 kg' }),
                    s('text', { x: plot.X(1), y: plot.Y(yr - sz(p.m)) + 5, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--card)', text: `${fix(p.m, 1)} kg` }),
                  ];
                },
                readout: (p) => {
                  const a = ((5 - p.m) / (5 + p.m)) * G;
                  return r`$a = \dfrac{(5 - ${fix(p.m, 1)})\,g}{5 + ${fix(p.m, 1)}} = ${fix(a, 2)}$ m/s² ${Math.abs(a) < 1e-9 ? '(balanced)' : a > 0 ? '(left side falls)' : '(right side falls)'}`;
                },
                goal: (p) => p.m === 2.5,
                hint: r`You need $\frac{5 - m}{5 + m} = \frac13$.`,
                solution: { m: 2.5 },
              },
              explain: r`The net force is the difference in weights, $(m_1 - m_2)g$, but it has to accelerate **both** masses: $a = \frac{(m_1 - m_2)g}{m_1 + m_2}$. With 5 kg and 2.5 kg: $a = \frac{2.5}{7.5}g = \frac{g}{3} \approx 3.27$ m/s². George Atwood used this device in 1784 to "slow down" gravity enough to measure it.`,
            },
            {
              type: 'numeric',
              title: 'The tension',
              prompt: r`In that machine (5 kg and 2.5 kg, $a = g/3$), what is the tension in the string? Use $T = m_2(g + a)$ for the rising 2.5 kg mass, with $g = 9.8$ m/s². (1 decimal place.)`,
              unit: 'N',
              answer: 2.5 * (G + G / 3),
              tol: 0.1,
              wrong: [{ v: 2.5 * G, tol: 0.1, why: 'That’s the small mass’s weight. The string must also accelerate it upwards, so the tension is bigger.' }, { v: 5 * G, tol: 0.1, why: 'That’s the big mass’s weight. It’s accelerating downwards, so the tension is less than its weight.' }],
              explain: r`$T = 2.5 \times (9.8 + 3.27) \approx 32.7$ N. Check from the other side: $T = 5 \times (9.8 - 3.27) \approx 32.7$ N ✓. The tension lies between the two weights (24.5 N and 49 N).`,
            },
            {
              type: 'mcq',
              title: 'Pulling a train',
              prompt: r`A locomotive pulls three identical wagons, accelerating. Where is the tension in the couplings largest?`,
              choices: [
                { t: 'Between the locomotive and the first wagon', ok: true },
                { t: 'Between the last two wagons', why: 'That coupling only has to accelerate one wagon. The first coupling accelerates all three.' },
                { t: 'It’s the same everywhere', why: 'Each coupling accelerates only the wagons behind it.' },
              ],
              explain: r`Each coupling pulls everything behind it: the first coupling accelerates 3 wagons, the second 2, the last 1. So tensions are in the ratio $3 : 2 : 1$. That's why the first coupling of a long freight train is the most likely to break.`,
            },
            {
              type: 'numeric',
              title: 'In a lift',
              prompt: r`A 70 kg person stands in a lift accelerating upward at 2 m/s². What force does the floor push up with ($m(g + a)$, $g = 9.8$ m/s²), in newtons?`,
              unit: 'N',
              answer: 70 * 11.8,
              tol: 0.5,
              explain: r`$70 \times 11.8 = 826$ N, more than their 686 N weight, so they feel heavier. A bathroom scale in the lift would read about 84 kg.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Pushing two boxes',
              prompt: r`You push a 2 kg box with 30 N, and it pushes a 4 kg box in front of it across a frictionless floor. What force does the 2 kg box exert on the 4 kg box?`,
              unit: 'N',
              answer: 20,
              wrong: [{ v: 30, why: 'Some of your 30 N goes into accelerating the 2 kg box itself.' }, { v: 10, why: 'That’s the net force on the 2 kg box. The 4 kg box needs 4 × 5 = 20 N.' }],
              explain: r`Together: $a = \frac{30}{6} = 5$ m/s². The 4 kg box needs $4 \times 5 = 20$ N, supplied by the contact force. The 2 kg box gets $30 - 20 = 10$ N net, which accelerates it at $5$ m/s² too ✓.`,
            },
          ],
          recap: [
            'A light string over a smooth pulley has the same tension throughout.',
            r`Atwood machine: $a = \frac{(m_1 - m_2)g}{m_1 + m_2}$.`,
            'Treat connected objects as one system for the acceleration, then isolate one to find internal forces.',
          ],
        },
        {
          id: 'equilibrium',
          title: 'Balancing Forces',
          summary: 'Adding forces as arrows',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Forces add like arrows',
              body: r`Forces have direction, so they add as **vectors**: place the arrows head to tail. A 3 N force east and a 4 N force north add to a 5 N force pointing between them (by Pythagoras).

An object is in **equilibrium** when all its forces add to zero: it stays at rest or keeps moving steadily. Every bridge, shelf and hanging lamp is a problem in balancing forces.`,
            },
            {
              type: 'numeric',
              title: 'Two tugs',
              prompt: r`Two tugboats pull a ship: one with 12 kN due east, the other with 5 kN due north. What is the size of the combined pull?`,
              unit: 'kN',
              answer: 13,
              wrong: [{ v: 17, why: 'The forces are at right angles, so add them as arrows (Pythagoras), not as plain numbers.' }, { v: 7, why: 'They don’t oppose each other; they’re at right angles.' }],
              explain: r`$\sqrt{12^2 + 5^2} = 13$ kN, pointing about $23°$ north of east. To hold the ship still, a third force of 13 kN would have to point the opposite way.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Hanging a picture',
              prompt: r`A 20 N picture hangs from a wire over a nail, with both halves of the wire at angle $\theta$ above the horizontal. Find the angle at which the tension in each half **equals the picture's weight**.`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 3, ymin: -2.8, ymax: 0.5, grid: false, axes: false, equal: true, maxWidth: 460,
                params: { th: { min: 5, max: 85, step: 1, value: 60, label: 'wire angle', color: 'blue', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const a = rad(p.th), half = 1.6, dy = -half * Math.tan(a), yb = Math.max(-2.2, dy);
                  const hx = Math.abs(yb / Math.tan(a));
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-ink' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(-hx), y2: plot.Y(yb), stroke: 'var(--blue)', 'stroke-width': 3 }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(hx), y2: plot.Y(yb), stroke: 'var(--blue)', 'stroke-width': 3 }),
                    s('rect', { x: plot.X(-hx - 0.2), y: plot.Y(yb), width: plot.X(hx + 0.2) - plot.X(-hx - 0.2), height: plot.Y(yb - 0.5) - plot.Y(yb), rx: 4, class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 3 }),
                  ];
                },
                readout: (p) => r`each half: $T = \dfrac{20}{2\sin ${p.th}°} = ${(20 / (2 * Math.sin(rad(p.th)))).toFixed(1)}$ N`,
                goal: (p) => p.th === 30,
                hint: r`Each half supports half the weight vertically: $2T\sin\theta = 20$. You want $T = 20$.`,
                solution: { th: 30 },
              },
              explain: r`The vertical parts of the two tensions hold up the weight: $2T\sin\theta = W$. For $T = W$, $\sin\theta = \frac12$, so $\theta = 30°$. Shallower than that, each half of the wire pulls harder than the whole picture weighs!`,
            },
            {
              type: 'mcq',
              title: 'A perfectly straight rope?',
              prompt: r`Why can't you pull a heavy rope (or a washing line) so tight that it's perfectly straight and horizontal?`,
              choices: [
                { t: 'Its weight needs an upward force, and a horizontal rope’s tension has no vertical part, so the tension would have to be infinite', ok: true },
                { t: 'Ropes are too stretchy', why: 'Even an unstretchable rope would sag. The issue is the vertical force balance.' },
                { t: 'You can, with enough effort', why: r`As the sag angle $\theta \to 0$, $T = \frac{W}{2\sin\theta} \to \infty$.` },
              ],
              explain: r`Tension $T = \frac{W}{2\sin\theta}$ grows without limit as the angle shrinks. Every heavy cable sags a little; power lines are deliberately hung with sag to keep tensions manageable.`,
            },
            {
              type: 'numeric',
              title: 'Holding a box on a slope',
              prompt: r`A 10 kg box rests on a smooth ramp inclined at $30°$. What force along the slope is needed to hold it in place ($mg\sin\theta$), in newtons?`,
              unit: 'N',
              answer: 10 * 9.8 * 0.5,
              tol: 0.1,
              explain: r`$10 \times 9.8 \times \sin 30° = 49$ N along the slope, half its weight. The other component of gravity, $mg\cos 30° \approx 85$ N, presses straight into the ramp and is balanced by the ramp's normal force. (The two components combine as vectors, not by simple addition, to make the full 98 N weight.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A traffic light',
              prompt: r`A 300 N traffic light hangs from the middle of a cable, each half making $10°$ with the horizontal. What's the tension in the cable? (Nearest newton.)`,
              unit: 'N',
              answer: Math.round(300 / (2 * Math.sin(rad(10)))),
              tol: 2,
              wrong: [{ v: 150, why: r`Only the vertical part, $T\sin 10°$, supports the light: $2T\sin 10° = 300$.` }, { v: 152, tol: 1, why: r`That uses $\cos 10°$. The vertical component is $T\sin\theta$.` }],
              explain: r`$T = \frac{300}{2\sin 10°} = \frac{300}{0.347} \approx 864$ N: nearly three times the light's weight. Shallow angles mean big tensions.`,
            },
          ],
          recap: [
            'Forces add as vectors; in equilibrium they sum to zero.',
            r`Two symmetric supports at angle $\theta$: $T = \frac{W}{2\sin\theta}$.`,
            'Shallow angles make tensions far larger than the weight.',
          ],
        },
      ],
    },
  ],
};
