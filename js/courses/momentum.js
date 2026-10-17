const r = String.raw;
const f2 = (v) => (Math.round(v * 100) / 100).toString();

const DEG = Math.PI / 180;

export default {
  id: 'momentum',
  subject: 'physics',
  title: 'Momentum & Collisions',
  level: 'Intermediate',
  cover: 'momentum',
  tagline: 'Crashes, recoils and rockets: the quantity that never changes.',
  description: r`Why does a slow truck hit harder than a fast tennis ball? Learn about momentum and impulse, smash carts together in sticky and bouncy collisions, see why momentum is always conserved, track glancing collisions on a snooker table, and find the centre of mass that moves serenely through every explosion.`,
  prereq: 'Forces & Newton’s Laws, and Energy',
  chapters: [
    {
      title: 'Momentum',
      summary: 'Mass in motion, and the impulse that changes it.',
      lessons: [
        {
          id: 'impulse',
          title: 'Momentum & Impulse',
          summary: 'p = mv and FΔt = Δp',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Harder to stop',
              prompt: 'Which is harder to stop: a 1500 kg car rolling at 2 m/s, or a 0.06 kg tennis ball served at 50 m/s?',
              choices: [
                { t: 'The car', ok: true },
                { t: 'The tennis ball', why: r`The ball is fast, but tiny. Multiply mass by velocity: $0.06 \times 50 = 3$ for the ball vs $1500 \times 2 = 3000$ for the car.` },
                { t: 'They’re equally hard to stop', why: 'Compare mass × velocity for each.' },
              ],
              explain: r`What matters is **momentum**, mass times velocity. The slow car has 1000 times the momentum of the fast ball.`,
            },
            {
              type: 'explain',
              title: 'Momentum',
              body: r`**Momentum** is
$$p = m\,v$$
measured in kg·m/s. Like velocity, it has a **direction**: in one dimension, the sign tells you which way.

Newton originally wrote his second law in terms of momentum: the net force equals the rate of change of momentum, $F = \frac{\Delta p}{\Delta t}$. For a constant mass, this is the same as $F = ma$.`,
            },
            {
              type: 'numeric',
              title: 'Compute',
              prompt: 'What is the momentum of a 70 kg runner moving at 8 m/s?',
              unit: 'kg·m/s',
              answer: 560,
              wrong: [{ v: 8.75, tol: 0.01, why: r`Multiply: $p = mv$.` }, { v: 2240, why: r`Momentum is $mv$, not $\tfrac12 mv^2$ (that's kinetic energy) or $mv^2$.` }],
              explain: r`$p = mv = 70 \times 8 = 560$ kg·m/s.`,
            },
            {
              type: 'explain',
              title: 'Impulse',
              body: r`Rearranging $F = \frac{\Delta p}{\Delta t}$ gives the **impulse**:
$$F\,\Delta t = \Delta p$$
To change something's momentum by a given amount, you can use a big force for a short time, or a small force for a long time.

That's the idea behind airbags, crumple zones, bending your knees when you land, and catching an egg by letting your hands move back with it. Stretching out the time shrinks the force.`,
            },
            {
              type: 'mcq',
              title: 'Airbags',
              prompt: 'In a crash, your momentum drops to zero either way. How does an airbag protect you?',
              choices: [
                { t: 'It makes the stop take longer, so the force on you is smaller', ok: true },
                { t: 'It reduces your change in momentum', why: 'You still go from full speed to zero, so Δp is the same. The airbag changes the *time*.' },
                { t: 'It pushes you backward before the crash', why: 'Airbags inflate in the crash itself, and their job is to cushion you, not to push.' },
              ],
              explain: r`$F = \frac{\Delta p}{\Delta t}$. The $\Delta p$ is fixed, but the airbag might stretch the stopping time from a few milliseconds (hitting the dashboard) to tens of milliseconds, cutting the peak force several times over.`,
            },
            {
              type: 'numeric',
              title: 'Catch',
              prompt: 'A 0.15 kg ball arrives at 30 m/s and is caught, stopping in 0.05 s. What average force acts on the catcher’s hand?',
              unit: 'N',
              answer: 90,
              wrong: [
                { v: 4.5, why: r`That's the change in momentum. Divide by the time: $F = \Delta p / \Delta t$.` },
                { v: 0.225, tol: 0.001, why: r`Divide by the time, don't multiply.` },
              ],
              explain: r`$\Delta p = 0.15 \times 30 = 4.5$ kg·m/s. $F = \frac{4.5}{0.05} = 90$ N. If the catcher lets their hand move back so the catch takes 0.15 s, the force drops to 30 N.`,
            },
            {
              type: 'interactive',
              title: 'Saving an egg',
              body: r`A 60 g egg hits at 5 m/s, so it must lose momentum $0.06 \times 5 = 0.3$ N·s: the area under the force–time graph. If the force rises and falls as a triangle, the peak force is $2 \times \text{impulse} / \text{time}$. The egg cracks above about **25 N**. Find the shortest stopping time that saves it.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 120, grid: false, height: 260, axes: { xlabel: 'time (ms)', ylabel: 'force (N)', xticks: 10, yticks: 20 },
                params: { t: { min: 5, max: 60, step: 1, value: 10, label: 'stopping time', color: 'coral', format: (v) => `${v} ms` } },
                curves: [{ f: () => 25, color: 'coral', dash: true }],
                under: ({ plot, p, s }) => { const F = (2 * 0.3) / (p.t / 1000); return [s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(p.t / 2)} ${plot.Y(Math.min(F, 125))} L${plot.X(p.t)} ${plot.Y(0)} Z`, class: F > 25 ? 'fl-coral-soft' : 'fl-teal-soft', stroke: F > 25 ? 'var(--coral)' : 'var(--teal)', 'stroke-width': 2.5 })]; },
                readout: (p) => { const F = (2 * 0.3) / (p.t / 1000); return `area = 0.3 N·s · peak force **${F.toFixed(1)} N** · ${F > 25 ? 'cracks' : 'survives'}`; },
                goal: (p) => p.t === 24,
                hint: 'Peak = 2 × 0.3 / t must be at most 25 N.',
                solution: { t: 24 },
              },
              explain: r`$t = 2 \times 0.3 / 25 = 0.024$ s: **24 ms**. The area (impulse) is fixed by the egg’s momentum; stretching the time squashes the peak. A cushion, a crumple zone or bent knees all work the same way.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Bounce vs. stop',
              prompt: 'A ball hits a wall at 10 m/s. In case A it stops dead. In case B it bounces straight back at 10 m/s. In which case is the impulse from the wall bigger?',
              choices: [
                { t: 'B, the bounce: twice as big', ok: true },
                { t: 'A, stopping', why: r`Stopping changes the velocity by 10 m/s. Bouncing changes it from $+10$ to $-10$: a change of 20 m/s.` },
                { t: 'They’re equal', why: 'Reversing the velocity is a bigger change than just stopping.' },
              ],
              explain: r`The impulse is $\Delta p = m\,\Delta v$. Stopping: $\Delta v = 0 - 10 = -10$. Bouncing back: $\Delta v = -10 - 10 = -20$. Bouncing needs twice the impulse, because the wall has to stop the ball **and** throw it back.`,
            },
          ],
          recap: [
            r`Momentum $p = mv$ has a direction.`,
            r`Impulse $F\Delta t = \Delta p$: a longer stopping time means a smaller force.`,
            'Bouncing involves a bigger change in momentum than stopping.',
          ],
        },
        {
          id: 'conservation-momentum',
          title: 'Conservation of Momentum',
          summary: 'The total never changes',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Push apart',
              body: r`Two skaters stand still on frictionless ice, then push off each other. One has twice the mass of the other.`,
              prompt: 'How do their speeds compare afterwards?',
              choices: [
                { t: 'The lighter skater moves twice as fast', ok: true },
                { t: 'They move at the same speed', why: 'They get equal and opposite pushes (third law), so equal and opposite momenta, but different masses.' },
                { t: 'The heavier skater moves faster', why: 'The same push gives the lighter skater a bigger velocity.' },
              ],
              explain: r`They push on each other with equal and opposite forces for the same time, so they get equal and opposite momenta: $m v_1 = 2m\,v_2$, which means $v_1 = 2v_2$. Their total momentum was zero before, and it's still zero after.`,
            },
            {
              type: 'explain',
              title: 'Conservation of momentum',
              body: r`::: key
If no outside force acts on a system, its total momentum stays constant.
:::

Why? Inside the system, forces come in third-law pairs. Every push one part gets, another part gets in the opposite direction, for exactly the same time. Their momentum changes cancel.

This law holds even when energy seems to vanish into heat or sound. It's one of the most fundamental laws in physics.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Watch the total',
              body: r`Send the blue cart into the red one. Try different masses and speeds, and watch the **total momentum** before and after.`,
              widget: {
                kind: 'collide', e: 0.6,
                params: { m1: { min: 1, max: 6, step: 1, value: 2, label: '$m_1$' }, m2: { min: 1, max: 6, step: 1, value: 4, label: '$m_2$' }, v1: { min: 0.5, max: 4, step: 0.5, value: 3, label: '$v_1$' } },
              },
              after: 'Whatever you choose, the total momentum (the first number) is the same after the collision as before. The kinetic energy usually drops.',
            },
            {
              type: 'numeric',
              title: 'Recoil',
              body: r`A 4 kg rifle fires a 0.01 kg bullet at 400 m/s. The rifle and bullet start at rest.`,
              prompt: 'How fast does the rifle recoil?',
              unit: 'm/s',
              answer: 1,
              wrong: [
                { v: 400, why: 'The rifle is 400 times heavier than the bullet, so it moves 400 times slower.' },
                { v: 1600, why: r`Use momentum conservation: $0.01 \times 400 = 4 \times v$.` },
              ],
              explain: r`Total momentum starts at zero: $0.01 \times 400 = 4 \times v_\text{rifle}$, so $v_\text{rifle} = 1$ m/s, backwards. That's the "kick" against your shoulder.`,
            },
            {
              type: 'mcq',
              title: 'Rockets',
              prompt: 'How does a rocket speed up in empty space?',
              choices: [
                { t: 'It throws exhaust backward, and gains equal momentum forward', ok: true },
                { t: 'The exhaust pushes against the air behind it', why: 'There is no air in space. Momentum conservation is all a rocket needs.' },
                { t: 'It can’t: rockets need something to push on', why: 'The rocket pushes on its own exhaust. The total momentum of rocket plus exhaust stays the same.' },
              ],
              explain: r`Rocket plus exhaust is a closed system with constant total momentum. Fast exhaust going backward means the rocket must gain momentum forward. It's exactly the recoil of a rifle, firing continuously.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Boat jump',
              body: r`A 60 kg person jumps off the back of a 120 kg boat at rest, leaving at 3 m/s.`,
              prompt: 'How fast does the boat move forward? (Ignore the water’s resistance.)',
              unit: 'm/s',
              answer: 1.5,
              wrong: [{ v: 6, why: r`The boat is heavier, so it moves *slower*: $60 \times 3 = 120 \times v$.` }, { v: 3, why: 'The boat has twice the mass, so it gets half the speed.' }],
              explain: r`$60 \times 3 = 120 \times v$, so $v = 1.5$ m/s. Anyone who has stepped off a small boat onto a dock has felt the boat drift away.`,
            },
          ],
          recap: [
            'With no outside force, the total momentum of a system stays constant.',
            'Recoil: when parts start from rest and push apart, they get equal and opposite momenta.',
            'Rockets work by momentum conservation, even in empty space.',
          ],
        },
      ],
    },
    {
      title: 'Collisions',
      summary: 'Sticky and bouncy.',
      lessons: [
        {
          id: 'sticky',
          title: 'Sticky Collisions',
          summary: 'Perfectly inelastic',
          icon: 'hand',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Stick together',
              body: r`A 2 kg cart moving at 3 m/s hits a 1 kg cart at rest. They stick together.`,
              prompt: 'How fast do they move together afterwards?',
              unit: 'm/s',
              answer: 2,
              wrong: [
                { v: 3, why: 'The combined mass is bigger, so the shared speed must be lower.' },
                { v: 1.5, why: r`Total momentum is $2 \times 3 = 6$, and the total mass is 3 kg, so $6/3$.` },
              ],
              explain: r`Momentum before: $2 \times 3 = 6$ kg·m/s. After: $(2 + 1)\,v = 6$, so $v = 2$ m/s.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Sticky carts',
              body: r`These carts stick together on impact. Compare the kinetic energy before and after.`,
              widget: {
                kind: 'collide', e: 0,
                params: { m1: { min: 1, max: 6, step: 1, value: 2, label: '$m_1$' }, m2: { min: 1, max: 6, step: 1, value: 1, label: '$m_2$' }, v1: { min: 1, max: 4, step: 0.5, value: 3, label: '$v_1$' } },
              },
              after: 'The momentum is conserved, but some kinetic energy disappears. It goes into heat, sound and bending the carts.',
            },
            {
              type: 'explain',
              title: 'Perfectly inelastic collisions',
              body: r`When objects stick together:
$$v_\text{final} = \frac{m_1 v_1 + m_2 v_2}{m_1 + m_2}$$
Momentum is conserved. Kinetic energy is **not**: a sticky collision loses the most kinetic energy that momentum conservation allows.`,
            },
            {
              type: 'numeric',
              title: 'Energy lost',
              prompt: 'In the warm-up collision (2 kg at 3 m/s sticks to 1 kg at rest, then both move at 2 m/s), how much kinetic energy is lost?',
              unit: 'J',
              answer: 3,
              wrong: [
                { v: 9, why: 'That’s the kinetic energy before. Subtract the kinetic energy after (6 J).' },
                { v: 6, why: 'That’s the kinetic energy after. Subtract it from the 9 J before.' },
              ],
              explain: r`Before: $\tfrac12 (2)(3^2) = 9$ J. After: $\tfrac12 (3)(2^2) = 6$ J. Lost: 3 J, a third of the original.`,
            },
            {
              type: 'numeric',
              title: 'Head-on',
              body: r`A 1000 kg car moving east at 20 m/s collides head-on with a 1500 kg car moving west at 10 m/s. They lock together. (Take east as positive.)`,
              prompt: 'What is their velocity just after the crash?',
              unit: 'm/s',
              answer: 2,
              wrong: [
                { v: 14, why: r`West is the negative direction: the second car's momentum is $-15{,}000$.` },
                { v: 15, why: 'Use momentum, not speeds alone.' },
              ],
              explain: r`Total momentum: $1000(20) + 1500(-10) = 20{,}000 - 15{,}000 = 5000$ kg·m/s. Divide by 2500 kg: $v = +2$ m/s, slowly east.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ballistic pendulum',
              body: r`A 0.01 kg bullet hits a 2 kg wooden block hanging on strings and sticks in it. The block (with the bullet inside) swings up 0.05 m. ($g = 9.8$ m/s²)`,
              prompt: 'How fast was the bullet going?',
              unit: 'm/s',
              answer: 201 * Math.sqrt(2 * 9.8 * 0.05),
              tol: 1,
              wrong: [{ v: Math.sqrt(2 * 9.8 * 0.05), tol: 0.02, why: r`That's the block's speed just after impact. Use momentum to work back to the bullet: $0.01\,v = 2.01 \times 0.99$.` }],
              hint: r`Two steps: energy gives the block's speed after impact, $v = \sqrt{2gh}$. Then momentum gives the bullet's speed.`,
              explain: r`**Swing up (energy):** $v_\text{after} = \sqrt{2 \times 9.8 \times 0.05} \approx 0.99$ m/s.
**Impact (momentum):** $0.01\,v_b = 2.01 \times 0.99$, so $v_b \approx 199$ m/s.

Energy is **not** conserved in the impact itself (it's sticky), but it is during the swing. Before electronic timers, this was how bullet speeds were measured.`,
            },
          ],
          recap: [
            r`Sticky collisions: $v = \frac{m_1v_1 + m_2v_2}{m_1 + m_2}$.`,
            'Momentum is always conserved in a collision. Kinetic energy is lost in inelastic ones.',
            'Watch the signs for objects moving in opposite directions.',
          ],
        },
        {
          id: 'bouncy',
          title: 'Bouncy Collisions',
          summary: 'Elastic collisions',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Newton’s cradle',
              body: r`On a Newton's cradle, you pull back one steel ball and let it swing into the others.`,
              prompt: 'What happens?',
              choices: [
                { t: 'One ball flies out the other side at about the same speed', ok: true },
                { t: 'Two balls fly out at half the speed', why: r`That would conserve momentum ($2 \times \tfrac12 = 1$), but halve the kinetic energy. Steel balls bounce almost perfectly, so they keep their energy.` },
                { t: 'All the balls move together slowly', why: 'That would be a sticky collision. Steel balls are bouncy.' },
              ],
              explain: r`Only "one ball out at the same speed" conserves **both** momentum and kinetic energy. In nearly perfectly bouncy (**elastic**) collisions, both quantities are conserved.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Elastic carts',
              body: r`These carts have perfectly springy bumpers. Try equal masses first, then a heavy cart hitting a light one, then a light cart hitting a heavy one.`,
              widget: {
                kind: 'collide', e: 1,
                params: { m1: { min: 1, max: 6, step: 1, value: 2, label: '$m_1$' }, m2: { min: 1, max: 6, step: 1, value: 2, label: '$m_2$' }, v1: { min: 1, max: 4, step: 0.5, value: 3, label: '$v_1$' } },
              },
              after: 'With equal masses, the carts swap velocities: the moving one stops dead and the other takes its speed. Both momentum and kinetic energy stay the same.',
            },
            {
              type: 'explain',
              title: 'Elastic collisions',
              body: r`In an **elastic** collision, both momentum and kinetic energy are conserved. For a moving mass $m_1$ (speed $v$) hitting $m_2$ at rest, solving both equations gives
$$v_1' = \frac{m_1 - m_2}{m_1 + m_2}\,v, \qquad v_2' = \frac{2m_1}{m_1 + m_2}\,v$$
- Equal masses: $v_1' = 0$ and $v_2' = v$. They swap.
- Very heavy hits light: the light one shoots off at almost $2v$.
- Light hits very heavy: the light one bounces back at almost $v$.`,
            },
            {
              type: 'numeric',
              title: 'Heavy hits light',
              prompt: 'A 3 kg cart at 4 m/s hits a 1 kg cart at rest, elastically. How fast does the 1 kg cart move afterwards?',
              unit: 'm/s',
              answer: 6,
              wrong: [
                { v: 2, why: r`That's the 3 kg cart's speed after: $\frac{3 - 1}{4} \times 4 = 2$. The light cart gets $\frac{2 \times 3}{4} \times 4$.` },
                { v: 3, why: r`That's what a sticky collision would give. Elastic collisions also conserve kinetic energy.` },
                { v: 12, why: r`$v_2' = \frac{2m_1}{m_1 + m_2}v = \frac{6}{4} \times 4$.` },
              ],
              explain: r`$v_2' = \frac{2(3)}{3 + 1} \times 4 = 6$ m/s, and $v_1' = \frac{3 - 1}{4} \times 4 = 2$ m/s. Check momentum: $3(2) + 1(6) = 12 = 3(4)$. ✓ Check energy: $\tfrac12(3)(4) + \tfrac12(1)(36) = 6 + 18 = 24 = \tfrac12(3)(16)$. ✓`,
            },
            {
              type: 'interactive',
              title: 'Stop dead',
              body: r`Choose the masses so that the blue cart **stops completely** after an elastic collision with the red cart at rest.`,
              widget: {
                kind: 'collide', e: 1, needRun: true,
                params: { m1: { min: 1, max: 6, step: 1, value: 2, label: '$m_1$' }, m2: { min: 1, max: 6, step: 1, value: 5, label: '$m_2$' } },
                goal: (p, res) => (res && Math.abs(res.u1) < 1e-9 ? true : { ok: false, msg: !res ? 'Press Go first.' : res.u1 > 0 ? 'The blue cart kept moving forward. Make the red cart heavier.' : 'The blue cart bounced back. Make the red cart lighter.' }),
                solution: { m1: 3, m2: 3 },
              },
              explain: r`$v_1' = \frac{m_1 - m_2}{m_1 + m_2}v = 0$ exactly when $m_1 = m_2$. That's why a cue ball can stop dead after hitting another ball head-on in pool.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Gravity slingshot',
              body: r`A space probe flies past a huge planet that is moving toward it, swings around behind the planet, and heads back the way it came. It's like a ping-pong ball bouncing elastically off the front of a moving truck.`,
              prompt: 'How does the probe’s speed change?',
              choices: [
                { t: 'It speeds up', ok: true },
                { t: 'It slows down', why: 'Bouncing off an object moving toward you sends you away faster than you arrived.' },
                { t: 'It stays the same', why: 'Relative to the planet the speed is the same before and after. Relative to the Sun, the planet’s motion adds to it.' },
              ],
              explain: r`In the planet's frame, the probe arrives and leaves at the same speed (an elastic "bounce"). But the planet is moving, so in the Sun's frame the probe gains up to twice the planet's speed. Voyager 2 used slingshots at Jupiter, Saturn and Uranus to reach Neptune.`,
            },
          ],
          recap: [
            'Elastic collisions conserve both momentum and kinetic energy.',
            'Equal masses swap velocities. Heavy hitting light sends the light one off at up to 2v.',
            'Gravity slingshots are elastic “collisions” with moving planets.',
          ],
        },
      ],
    },
    {
      title: 'Beyond Straight Lines',
      summary: 'Glancing collisions and the centre of mass.',
      lessons: [
        {
          id: 'glancing',
          title: 'Glancing Collisions',
          summary: 'Momentum as a vector',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Momentum has direction',
              body: r`In two dimensions, momentum is a **vector**: it's conserved separately in each direction. The total momentum arrow before a collision equals the total momentum arrow after.

When a moving snooker ball strikes a stationary one off-centre, the target ball moves off along the **line joining the two centres** at the moment of impact (that's the direction of the push it receives).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Cut it into the pocket',
              prompt: r`The cue ball (white) moves right at 2 m/s. Choose the angle of the line of centres at impact so the object ball (coral) heads **30° above** the cue ball's original direction, towards the pocket.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.2, ymax: 2.4, grid: false, axes: false, maxWidth: 480,
                params: { a: { min: 0, max: 80, step: 1, value: 50, label: 'line of centres', color: 'coral', format: (v) => `${v}° above` } },
                extra: ({ plot, p, s, arrow }) => {
                  const th = p.a * DEG, vo = 2 * Math.cos(th), vc = 2 * Math.sin(th);
                  const v = (x0, y0, x1, y1, c, w = 4) => arrow(plot.X(x0), plot.Y(y0), plot.X(x1), plot.Y(y1), { color: `var(--${c})`, width: w, head: 12 });
                  return [
                    s('rect', { x: plot.X(-3), y: plot.Y(2.4), width: plot.X(3) - plot.X(-3), height: plot.Y(-2.2) - plot.Y(2.4), class: 'fl-teal-soft' }),
                    s('circle', { cx: plot.X(2.6 * Math.cos(30 * DEG)), cy: plot.Y(2.6 * Math.sin(30 * DEG)), r: 14, class: 'fl-ink' }),
                    s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(2.6 * Math.cos(30 * DEG)), y2: plot.Y(2.6 * Math.sin(30 * DEG)), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
                    v(-2.4, 0, -0.6, 0, 'ink-3', 2.5),
                    v(0, 0, vo * Math.cos(th), vo * Math.sin(th), 'coral'),
                    v(0, 0, vc * Math.sin(th), -vc * Math.cos(th), 'blue'),
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 12, class: 'fl-coral' }),
                    s('circle', { cx: plot.X(-0.32 * Math.cos(th)), cy: plot.Y(-0.32 * Math.sin(th)), r: 12, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 1.5 }),
                  ];
                },
                readout: (p) => {
                  const th = p.a * DEG;
                  return r`object ball: $${(2 * Math.cos(th)).toFixed(2)}$ m/s at ${p.a}° above; cue ball: $${(2 * Math.sin(th)).toFixed(2)}$ m/s at ${90 - p.a}° below`;
                },
                goal: (p) => p.a === 30,
                hint: 'The object ball always travels along the line of centres.',
                solution: { a: 30 },
              },
              explain: r`Set the line of centres at 30°. The object ball leaves at $2\cos 30° \approx 1.73$ m/s along it, and the cue ball at $2\sin 30° = 1$ m/s, at **90°** to the object ball. Snooker players learn to expect this right-angle split.`,
            },
            {
              type: 'numeric',
              title: 'Check the momentum',
              prompt: r`In that shot (masses equal), the object ball moves at 1.73 m/s at 30° above the x-axis and the cue ball at 1 m/s at 60° below. What's the total x-component of velocity after the collision? (2 decimal places.)`,
              unit: 'm/s',
              answer: 1.73 * Math.cos(30 * DEG) + 1 * Math.cos(60 * DEG),
              tol: 0.01,
              wrong: [{ v: 2.73, tol: 0.01, why: 'Take components: multiply each speed by the cosine of its angle.' }],
              explain: r`$1.73\cos 30° + 1\cos 60° = 1.50 + 0.50 = 2.00$ m/s, matching the cue ball's original 2 m/s. The y-components cancel: $1.73\sin 30° - 1\sin 60° = 0.87 - 0.87 = 0$. Momentum is conserved in both directions.`,
            },
            {
              type: 'mcq',
              title: 'Why 90°?',
              prompt: r`For equal masses in an elastic glancing collision (one initially at rest), why do they always separate at 90°?`,
              choices: [
                { t: 'Conservation of momentum and of kinetic energy together force the velocity vectors to satisfy Pythagoras, which means they’re perpendicular', ok: true },
                { t: 'Because the balls are round', why: 'Roundness sets the direction of the push; the 90° comes from conserving both momentum and energy.' },
                { t: 'It’s only approximately true by coincidence', why: 'It follows exactly from the conservation laws (ignoring spin and friction).' },
              ],
              explain: r`Momentum: $\mathbf v = \mathbf v_1 + \mathbf v_2$. Energy: $v^2 = v_1^2 + v_2^2$. Squaring the first gives $v^2 = v_1^2 + v_2^2 + 2\mathbf v_1 \cdot \mathbf v_2$, so the dot product must be zero: perpendicular. Particle physicists use this signature to recognise collisions between equal-mass particles, like protons in bubble chambers.`,
            },
            {
              type: 'numeric',
              title: 'A thin cut',
              prompt: r`Now a thin cut: the cue ball, at 2 m/s, just clips the object ball, so the line of centres is at $75°$ to its path. The object ball moves off along that line at $2\cos 75°$. How fast is that, in m/s? (2 decimal places.)`,
              unit: 'm/s',
              answer: 2 * Math.cos(75 * DEG),
              tol: 0.01,
              wrong: [{ v: 2 * Math.sin(75 * DEG), tol: 0.01, why: r`That's the cue ball's speed afterwards, $2\sin 75°$. The object ball gets $2\cos 75°$.` }],
              explain: r`$2\cos 75° \approx 0.52$ m/s. The cue ball keeps most of its speed, $2\sin 75° \approx 1.93$ m/s, deflected by only $15°$, still at $90°$ to the object ball. Check the energy: $0.52^2 + 1.93^2 \approx 4 = 2^2$ ✓. Thin cuts barely move the object ball.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A head-on hit',
              prompt: r`If the cue ball hits the object ball dead centre (line of centres at 0°), how fast does the cue ball move afterwards?`,
              unit: 'm/s',
              answer: 0,
              wrong: [{ v: 2, why: 'The object ball takes all the momentum: 2 cos 0° = 2 m/s.' }, { v: 1, why: r`The cue ball's speed is $2\sin 0° = 0$.` }],
              explain: r`It stops dead, and the object ball moves off at 2 m/s: the "stun shot" in snooker. All the momentum and energy pass from one ball to the other, like Newton's cradle.`,
            },
          ],
          recap: [
            'In 2D, momentum is conserved in each direction separately.',
            'The struck ball moves along the line of centres.',
            'Equal masses, elastic, one at rest: they separate at 90°.',
          ],
        },
        {
          id: 'com',
          title: 'Centre of Mass',
          summary: 'The point that moves simply',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'The balance point',
              body: r`The **centre of mass** of a system is the mass-weighted average position:
$$x_{\text{cm}} = \frac{m_1 x_1 + m_2 x_2 + \cdots}{m_1 + m_2 + \cdots}$$
The total momentum of a system equals its total mass times the velocity of its centre of mass. So when no outside forces act, the centre of mass moves at a **constant velocity**, however wildly the parts fly around.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Balance the rod',
              prompt: r`A light rod 6 m long has a 2 kg mass at the left end and a 4 kg mass at the right end. Drag the pivot to the centre of mass, so the rod balances.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 6.5, ymin: -1.2, ymax: 1.5, grid: false, axes: false, height: 200,
                params: { x: { min: 0, max: 6, step: 0.1, value: 3, slider: false } },
                points: [{ x: (p) => p.x, y: () => -0.35, drag: { x: 'x' }, color: 'violet', r: 9 }],
                extra: ({ plot, p, s }) => {
                  const torque = 2 * (0 - p.x) + 4 * (6 - p.x), tilt = Math.max(-12, Math.min(12, -torque * 2));
                  const cx = plot.X(p.x), cy = plot.Y(0);
                  return [
                    s('path', { d: `M${cx} ${cy + 6} l-14 26 h28 z`, class: 'fl-ink' }),
                    s('g', { transform: `rotate(${tilt} ${cx} ${cy})` },
                      s('line', { x1: plot.X(0), x2: plot.X(6), y1: cy, y2: cy, stroke: 'var(--ink)', 'stroke-width': 5 }),
                      s('rect', { x: plot.X(0) - 14, y: cy - 28, width: 28, height: 28, rx: 4, class: 'fl-blue' }),
                      s('rect', { x: plot.X(6) - 20, y: cy - 40, width: 40, height: 40, rx: 4, class: 'fl-coral' })),
                  ];
                },
                readout: (p) => `pivot at ${p.x.toFixed(1)} m: ${Math.abs(2 * p.x - 4 * (6 - p.x)) < 1e-6 ? '**balanced!**' : 2 * p.x > 4 * (6 - p.x) ? 'tips to the left' : 'tips to the right'}`,
                goal: (p) => Math.abs(p.x - 4) < 1e-6,
                hint: r`$x_{\text{cm}} = \frac{2 \times 0 + 4 \times 6}{2 + 4}$.`,
                solution: { x: 4 },
              },
              explain: r`$x_{\text{cm}} = \frac{0 + 24}{6} = 4$ m from the left: twice as far from the light mass as from the heavy one. Torques balance there: $2 \times 4 = 4 \times 2$.`,
            },
            {
              type: 'numeric',
              title: 'Earth and Moon',
              prompt: r`The Moon's mass is $\frac{1}{81}$ of Earth's, and it's 384,000 km away. How far from Earth's centre is the Earth–Moon centre of mass (the **barycentre**)? (Nearest 10 km.)`,
              unit: 'km',
              answer: Math.round(384000 / 82 / 10) * 10,
              tol: 10,
              wrong: [{ v: Math.round(384000 / 81 / 10) * 10, tol: 10, why: r`The total mass is $81 + 1 = 82$ parts: $\frac{384{,}000}{82}$.` }],
              explain: r`$\frac{1 \times 384{,}000}{81 + 1} \approx 4{,}680$ km, inside the Earth (radius 6,371 km). Both bodies orbit this point monthly, so the Earth wobbles slightly: the same kind of wobble lets astronomers detect planets around other stars.`,
            },
            {
              type: 'mcq',
              title: 'A firework',
              prompt: r`A firework rocket bursts at the top of its flight into many fragments flying in all directions. Ignoring air resistance, what happens to the centre of mass of all the fragments?`,
              choices: [
                { t: 'It continues along the same parabola the rocket was following', ok: true },
                { t: 'It stops where the explosion happened', why: 'The explosion forces are internal; they can’t change the centre of mass’s motion.' },
                { t: 'It shoots upwards', why: 'Only external forces (here, gravity) affect the centre of mass.' },
              ],
              explain: r`Internal forces come in equal and opposite pairs, so they cancel in the total. Gravity alone acts on the system, so the centre of mass carries on along its parabola, even as the pieces scatter.`,
            },
            {
              type: 'numeric',
              title: 'Find the balance point',
              prompt: r`A 2 kg mass sits at $x = 0$ and a 3 kg mass at $x = 5$ m. Where is their centre of mass?`,
              unit: 'm',
              answer: 3,
              tol: 0.001,
              explain: r`$\frac{2 \times 0 + 3 \times 5}{2 + 3} = 3$ m, closer to the heavier mass.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Walking in a boat',
              prompt: r`A 60 kg person stands at one end of a 120 kg boat floating at rest, 3 m long. They walk to the other end. Ignoring water resistance, how far does the boat move?`,
              unit: 'm',
              answer: 1,
              wrong: [{ v: 3, why: 'The boat moves the other way so the centre of mass stays put.' }, { v: 1.5, why: r`The person moves $d$ relative to the water and the boat $3 - d$: $60d = 120(3 - d)$.` }],
              explain: r`The centre of mass can't move. If the person moves $d$ forwards relative to the water and the boat $3 - d$ backwards, then $60d = 120(3 - d)$, giving $d = 2$ m: the boat slides back **1 m**. Anyone who's stepped off a small boat onto a jetty knows the feeling.`,
            },
          ],
          recap: [
            r`Centre of mass: $x_{\text{cm}} = \sum m_i x_i / \sum m_i$.`,
            'With no external forces, it moves at constant velocity, whatever the parts do.',
            'The Earth–Moon barycentre lies 4,680 km from Earth’s centre.',
          ],
        },
        {
          id: 'stacked',
          title: 'The Stacked-Ball Trick',
          summary: 'A tennis ball launched by a basketball',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Drop them together',
              body: r`Hold a tennis ball on top of a basketball and drop them together. The basketball hits the floor and bounces, then immediately meets the still-falling tennis ball, and the tennis ball shoots up far higher than it was dropped from.

To see why, imagine both balls hitting the floor at speed $v$, and every collision being perfectly elastic. The basketball rebounds upward at $v$ just as the tennis ball arrives moving down at $v$.`,
            },
            {
              type: 'numeric',
              title: 'Three times as fast',
              prompt: r`Treat the basketball as much heavier. In the basketball’s frame, the tennis ball approaches at $2v$ and bounces back at $2v$. Add back the basketball’s own upward speed $v$: how many times faster than $v$ does the tennis ball leave? And since height grows as speed squared, how many times higher does it rise? (Give the height factor.)`,
              answer: 9,
              wrong: [{ v: 3, why: 'That’s the speed factor. Height is proportional to speed squared.' }],
              explain: r`It leaves at $2v + v = 3v$, and since height $\propto v^2$, it rises $3^2 = 9$ times as high as it was dropped from (ignoring energy losses).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Mass matters',
              prompt: r`For a real pair, the elastic rebound speed of the top ball is $v' = \frac{3M - m}{M + m}\,v$, where $M$ is the bottom ball’s mass and $m$ the top ball’s. Find the mass ratio $\frac{m}{M}$ that sends the top ball up at **2.5 v**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 3.2, grid: false, height: 260, axes: { xlabel: 'mass ratio m / M', ylabel: 'rebound speed (× v)', xticks: 0.2, yticks: 0.5 },
                params: { r: { min: 0, max: 1, step: 0.001, value: 0.5, label: 'm / M', color: 'coral', format: (v) => v.toFixed(3) } },
                curves: [{ f: (x) => (3 - x) / (1 + x), color: 'violet', width: 3 }, { f: () => 2.5, color: 'teal', dash: true }],
                points: [{ x: (p) => p.r, y: (p) => (3 - p.r) / (1 + p.r), color: 'coral' }],
                readout: (p) => { const u = (3 - p.r) / (1 + p.r); return `top ball leaves at **${u.toFixed(3)} v** · rises **${(u * u).toFixed(2)}×** its drop height`; },
                goal: (p) => Math.abs((3 - p.r) / (1 + p.r) - 2.5) < 0.005,
                hint: r`Solve $\frac{3 - r}{1 + r} = 2.5$.`,
                solution: { r: 0.143 },
              },
              explain: r`$3 - r = 2.5 + 2.5r$ gives $r = \frac17 \approx 0.14$. A real tennis ball (58 g) on a basketball (600 g) has $r \approx 0.1$, giving about $2.6v$ and nearly 7 times the height, before losses in the bounces.`,
            },
            {
              type: 'mcq',
              title: 'Where does the energy come from?',
              prompt: r`The tennis ball ends up with far more energy than it started with. Where did it come from?`,
              choices: [
                { t: 'From the basketball, which bounces up much more slowly than usual', ok: true },
                { t: 'From the floor', why: 'The floor just reverses the basketball. The energy is handed over in the ball–ball collision.' },
                { t: 'It is created in the collision', why: 'Energy is conserved: what the tennis ball gains, the basketball loses.' },
              ],
              explain: r`In the limit of a very light top ball, the basketball keeps almost all its momentum but hands over a large share of its kinetic energy. Try it and watch: the basketball barely bounces.`,
            },
            {
              type: 'numeric',
              title: 'From one metre',
              prompt: r`In the ideal case (very light top ball, perfectly elastic bounces), the pair is dropped from 1 m. How high does the top ball rise?`,
              unit: 'm',
              answer: 9,
              explain: r`Speed $3v$ means height $9 \times 1 = 9$ m. In practice energy losses cut this a lot, but the effect is still dramatic.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Three in a stack',
              prompt: r`Stack three balls, each much lighter than the one below, and drop them. The middle ball leaves at $3v$ (as before); the top ball meets it while still falling at $v$. In ideal elastic collisions, how many times its drop height does the top ball rise?`,
              answer: 49,
              wrong: [{ v: 27, why: r`The top ball leaves at $2 \times 3v + v = 7v$, and height grows as speed squared.` }],
              explain: r`In the middle ball’s frame the top ball approaches at $3v + v = 4v$ and bounces back at $4v$; adding $3v$ gives $7v$. Height: $7^2 = 49$ times. The same stacking of rebounds is often used as an analogy for how a supernova blasts a star’s outer layers off so violently.`,
            },
          ],
          recap: [
            'A light ball on a heavy one rebounds at up to 3v, rising up to 9 times as high.',
            r`Elastic rebound speed: $v' = \frac{3M - m}{M + m}v$.`,
            'The energy comes from the bottom ball, which barely bounces.',
          ],
        },
      ],
    },
  ],
};
