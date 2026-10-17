import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed d decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v, d = 2) => fix(v, d);

// seesaw: left mass mL at distance dL, right mass mR at distance dR (metres from the pivot)
const seesaw = ({ mL = 3, dL = 2, mR = 2, dR = 2, params, goal, solution, hint, readout } = {}) => ({
  kind: 'graph', xmin: -5.5, xmax: 5.5, ymin: -1.5, ymax: 3.5, grid: false, axes: false, height: 260,
  params: params || {},
  extra: ({ plot, p, s }) => {
    const L = { m: p.mL ?? mL, d: p.dL ?? dL }, R = { m: p.mR ?? mR, d: p.dR ?? dR };
    const tau = R.m * R.d - L.m * L.d; // positive: clockwise (right side down)
    const ang = Math.max(-14, Math.min(14, tau * 3)) * (Math.PI / 180);
    const rot = (x, y) => [x * Math.cos(ang) + y * Math.sin(ang), -x * Math.sin(ang) + y * Math.cos(ang)];
    const P = (x, y) => { const [a, b] = rot(x, y); return [plot.X(a), plot.Y(b + 0.6)]; };
    const els = [s('path', { d: `M${plot.X(0)} ${plot.Y(0.6)} L${plot.X(-0.6)} ${plot.Y(-1)} L${plot.X(0.6)} ${plot.Y(-1)} Z`, class: 'fl-muted' })];
    const b1 = P(-5, 0), b2 = P(5, 0);
    els.push(s('line', { x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], stroke: 'var(--ink)', 'stroke-width': 8, 'stroke-linecap': 'round' }));
    for (let k = -5; k <= 5; k++) { if (!k) continue; /* the pivot marks 0 */ const t = P(k, -0.25); els.push(s('text', { x: t[0], y: t[1] + 14, 'text-anchor': 'middle', class: 'tick', style: 'font-size:max(calc(10px * var(--fs, 1)), var(--fmin, 0px))', text: String(Math.abs(k)) })); }
    const box = (x, m, cls) => {
      const sz = 0.35 + 0.12 * m;
      const c = P(x, sz / 2 + 0.08);
      const w = plot.X(sz) - plot.X(0);
      return [s('rect', { x: c[0] - w / 2, y: c[1] - w / 2, width: w, height: w, rx: 5, class: cls, transform: `rotate(${(-ang * 180) / Math.PI} ${c[0]} ${c[1]})` }), s('text', { x: c[0], y: c[1] + 5, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800;font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: `${m}kg` })];
    };
    els.push(...box(-L.d, L.m, 'fl-blue'), ...box(R.d, R.m, 'fl-coral'));
    return els;
  },
  readout: readout || ((p) => {
    const L = (p.mL ?? mL) * (p.dL ?? dL), R = (p.mR ?? mR) * (p.dR ?? dR);
    return Math.abs(L - R) < 1e-9 ? r`Balanced! $\;${f2(L, 1)} = ${f2(R, 1)}$` : r`left torque $\propto ${f2(L, 1)}$, $\;$ right torque $\propto ${f2(R, 1)}$`;
  }),
  goal, solution, hint,
});

// rolling race down a slope: a = g sinθ / (1 + k), with k = I/(m r²)
const SHAPES = [
  { name: 'sphere', k: 2 / 5, cls: 'fl-blue' },
  { name: 'disc', k: 1 / 2, cls: 'fl-teal' },
  { name: 'hoop', k: 1, cls: 'fl-coral' },
];

// yo-yo: disc of radius 3 cm unwinding from an axle of radius r (cm)
const yoyoA = (rcm) => 9.8 / (1 + 0.03 ** 2 / (2 * (rcm / 100) ** 2));
// flywheel: solid disc, energy in kWh
const flyKWh = (m, R, rpm) => (0.25 * m * R * R * ((rpm * 2 * Math.PI) / 60) ** 2) / 3.6e6;
const rimSpeed = (R, rpm) => (R * rpm * 2 * Math.PI) / 60;

export default {
  id: 'rotation',
  subject: 'physics',
  title: 'Rotation & Torque',
  level: 'Advanced',
  cover: 'rotation',
  tagline: 'Levers, balance, rolling races, spinning skaters, flywheels and yo-yos.',
  description: r`Everything that turns, from doors and seesaws to wheels, planets and figure skaters, follows the rotational versions of Newton's laws. Learn about torque, centre of mass, rotational inertia and the conservation of angular momentum.`,
  prereq: 'Forces & Newton’s Laws, and Momentum & Collisions',
  chapters: [
    {
      title: 'Turning Forces',
      summary: 'Torque, levers and balance.',
      lessons: [
        {
          id: 'torque',
          title: 'Torque & Levers',
          summary: 'Force × distance',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Opening a door',
              prompt: 'Where should you push a heavy door to open it most easily?',
              choices: [
                { t: 'At the edge farthest from the hinges', ok: true },
                { t: 'Right next to the hinges', why: 'Try it: pushing near the hinges is very hard. The farther from the pivot, the more turning effect.' },
                { t: 'It doesn’t matter where', why: 'The distance from the hinges makes a huge difference.' },
              ],
              explain: r`The turning effect of a force, called **torque**, depends on both the force and how far from the pivot it's applied. Push far from the hinges and a small force does the job.`,
            },
            {
              type: 'explain',
              title: 'Torque',
              body: r`$$\tau = F \times d$$
where $d$ is the perpendicular distance from the pivot to the line of the force. Torque is measured in N·m.

A seesaw balances when the torques on each side match. For masses on a beam, that's
$$m_1 d_1 = m_2 d_2.$$
Archimedes is said to have boasted: "Give me a place to stand and a lever long enough, and I will move the world."`,
              widget: seesaw({ params: { dR: { min: 0.5, max: 5, step: 0.5, value: 4, label: r`$d_\text{right}$`, color: 'coral', format: (v) => `${fix(v, 1)} m` } } }),
            },
            {
              type: 'interactive',
              title: 'Balance the seesaw',
              body: r`A 3 kg box sits 2 m left of the pivot. Where should the 2 kg box go to balance it?`,
              widget: seesaw({
                params: { dR: { min: 0.5, max: 5, step: 0.5, value: 1.5, label: r`$d_\text{right}$`, color: 'coral', format: (v) => `${fix(v, 1)} m` } },
                goal: (p) => p.dR === 3,
                hint: r`Balance needs $3 \times 2 = 2 \times d$.`,
                solution: { dR: 3 },
              }),
              explain: r`$3 \times 2 = 2 \times d$, so $d = 3$ m. The lighter box needs to sit farther out.`,
            },
            {
              type: 'numeric',
              title: 'Wrench',
              prompt: 'A bolt needs 60 N·m of torque to loosen. Using a 0.3 m wrench, pushing at its end at right angles, what force do you need?',
              unit: 'N',
              answer: 200,
              wrong: [{ v: 18, why: r`$\tau = Fd$, so $F = \tau / d = 60 / 0.3$.` }],
              explain: r`$F = \frac{\tau}{d} = \frac{60}{0.3} = 200$ N. A wrench twice as long would halve the force. That's why stuck bolts call for longer tools.`,
            },
            {
              type: 'numeric',
              title: 'A slanted push',
              prompt: r`You push with 50 N on the end of a 0.4 m spanner, but at $30°$ to the handle instead of at right angles. Only the perpendicular part of the force, $F\sin 30°$, turns it. What torque do you produce, in N·m?`,
              unit: 'N·m',
              answer: 50 * 0.4 * 0.5,
              tol: 0.05,
              wrong: [{ v: 20, tol: 0.05, why: r`That's the torque for a push at right angles. At $30°$ only $\sin 30° = \frac12$ of the force turns the spanner.` }, { v: 17.32, tol: 0.05, why: r`That uses $\cos 30°$, the part of the force along the handle, which does no turning.` }],
              explain: r`$\tau = F r \sin\theta = 50 \times 0.4 \times \frac12 = 10$ N·m, half what a square-on push gives. The part of the force along the handle just pulls on the bolt without turning it.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Pushing at an angle',
              prompt: 'You push on the edge of a door, but directly toward the hinges (along the door’s surface). What torque do you produce?',
              cols: 2,
              choices: [
                { t: 'Zero', ok: true },
                { t: 'The maximum', why: 'A force pointing straight at the pivot has no perpendicular distance from it: no turning effect.' },
              ],
              explain: r`Only the part of the force perpendicular to the lever arm makes it turn. Pushing straight toward the hinges gives $d_\perp = 0$, so no torque. The door doesn't budge.`,
            },
          ],
          recap: [
            r`Torque $\tau = F d_\perp$: the force times its perpendicular distance from the pivot.`,
            r`Balance: clockwise torques = anticlockwise torques ($m_1d_1 = m_2d_2$).`,
            'Longer levers trade distance for force.',
          ],
        },
        {
          id: 'center-mass',
          title: 'Centre of Mass',
          summary: 'Balance and stability',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Balance a ruler',
              prompt: 'You balance a ruler on one finger. Where is your finger?',
              choices: [
                { t: 'Under its centre of mass, the midpoint for an even ruler', ok: true },
                { t: 'Anywhere along it', why: 'Off-centre, gravity creates a torque that tips the ruler over.' },
                { t: 'At one end', why: 'The rest of the ruler would make it tip over.' },
              ],
              explain: r`An object balances when it's supported directly below its **centre of mass**, the average position of its mass. Gravity then produces no net torque.`,
            },
            {
              type: 'explain',
              title: 'Centre of mass',
              body: r`For masses along a line, the centre of mass is the mass-weighted average position:
$$x_\text{cm} = \frac{m_1 x_1 + m_2 x_2 + \cdots}{m_1 + m_2 + \cdots}$$
Gravity acts on an object **as if** all its weight were concentrated at this point.`,
            },
            {
              type: 'numeric',
              title: 'Dumbbell',
              prompt: 'A 1 kg mass sits at x = 0 and a 3 kg mass at x = 4 m, joined by a light rod. Where is the centre of mass?',
              unit: 'm',
              answer: 3,
              wrong: [{ v: 2, why: 'That’s the midpoint. The heavier mass pulls the centre of mass toward itself.' }, { v: 1, why: r`$\frac{1 \times 0 + 3 \times 4}{4} = 3$.` }],
              explain: r`$x_\text{cm} = \frac{1(0) + 3(4)}{1 + 3} = \frac{12}{4} = 3$ m, three-quarters of the way toward the heavy end.`,
            },
            {
              type: 'mcq',
              title: 'Tipping point',
              prompt: 'When does a leaning object (like a tall box) tip over?',
              choices: [
                { t: 'When its centre of mass moves beyond the edge of its base', ok: true },
                { t: 'As soon as it leans at all', why: 'It can lean quite a bit before tipping, as long as the centre of mass stays above the base.' },
                { t: 'When it leans more than 45°', why: 'The angle depends on the shape. A wide, low box can tilt much further than a tall, thin one.' },
              ],
              explain: r`While the centre of mass is above the base, gravity's torque pulls the object back upright. Once it's past the edge, the torque flips and the object falls. A wide base and a low centre of mass make things stable, like racing cars, and weighted toys that always bob back up.`,
            },
            {
              type: 'interactive',
              title: 'Tip it over',
              body: r`A tall block (1 m wide, 3 m high) stands on a board that you tilt. It topples when its centre of mass (dot) moves outside its base, beyond the lower corner. Find the tilt angle at which it is **just** about to tip.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.5, xmax: 3.5, ymin: -0.5, ymax: 4, grid: false, axes: false, maxWidth: 360,
                params: { th: { min: 0, max: 30, step: 0.01, value: 10, label: 'tilt', color: 'coral', format: (v) => `${v.toFixed(2)}°` } },
                extra: ({ plot, p, s }) => { const t = (p.th * Math.PI) / 180, R = ([x, y]) => [x * Math.cos(t) + y * Math.sin(t), -x * Math.sin(t) + y * Math.cos(t)], corners = [[0, 0], [-1, 0], [-1, 3], [0, 3]].map(R), c = R([-0.5, 1.5]), tip = Math.atan(1 / 3) < t - 1e-9; return [s('path', { d: `M${plot.X(R([-2.2, 0])[0])} ${plot.Y(R([-2.2, 0])[1])} L${plot.X(R([1.4, 0])[0])} ${plot.Y(R([1.4, 0])[1])}`, stroke: 'var(--ink-2)', 'stroke-width': 5 }), s('path', { d: corners.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join('') + 'Z', class: tip ? 'fl-coral-soft' : 'fl-amber-soft', stroke: tip ? 'var(--coral)' : 'var(--amber)', 'stroke-width': 2 }), s('line', { x1: plot.X(c[0]), y1: plot.Y(c[1]), x2: plot.X(c[0]), y2: plot.Y(-0.4), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' }), s('circle', { cx: plot.X(c[0]), cy: plot.Y(c[1]), r: 7, class: 'fl-ink' }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, class: 'fl-coral' })]; },
                readout: (p) => { const t = (p.th * Math.PI) / 180, cx = -0.5 * Math.cos(t) + 1.5 * Math.sin(t); return `centre of mass is **${Math.abs(cx).toFixed(3)} m** ${cx < 0 ? 'inside' : 'outside'} the lower corner (red) · ${cx < -1e-9 ? 'stable' : 'it topples!'}`; },
                goal: (p) => Math.abs(p.th - (Math.atan(1 / 3) * 180) / Math.PI) < 0.05,
                hint: 'It tips when the line from the corner to the centre of mass is vertical: tan θ = half-width ÷ half-height.',
                solution: { th: 18.43 },
              },
              explain: r`It tips at $\tan\theta = \frac{0.5}{1.5}$, about **18.4°**. A wider or lower object tolerates a steeper tilt, which is why racing cars are low and wide and why tall vans are more likely to roll over on a bend.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Leaning Tower',
              prompt: 'Why hasn’t the Leaning Tower of Pisa fallen over?',
              choices: [
                { t: 'Its centre of mass is still above its base', ok: true },
                { t: 'Its foundations are glued down', why: 'It stands on soft soil (which is why it leans). It stays up because its centre of mass is still over its base.' },
                { t: 'Towers can’t fall', why: 'If it leaned far enough to move its centre of mass beyond the base, it would topple.' },
              ],
              explain: r`It leans about 4°, but the vertical line through its centre of mass still falls inside its base. Engineers reduced the lean slightly in 1990–2001 by removing soil from under the high side, to keep that margin safe.`,
            },
          ],
          recap: [
            'The centre of mass is the mass-weighted average position.',
            'Objects balance when supported directly below their centre of mass.',
            'Stable objects have a wide base and a low centre of mass.',
          ],
        },
      ],
    },
    {
      title: 'Spinning',
      summary: 'Rotational inertia and angular momentum.',
      lessons: [
        {
          id: 'inertia',
          title: 'Rotational Inertia',
          summary: 'The rolling race',
          icon: 'play',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Predict the race',
              body: r`A solid ball, a solid disc and a hollow hoop, all with the same mass and radius, are released together at the top of a ramp and roll down without slipping.`,
              prompt: 'Which reaches the bottom first?',
              choices: [
                { t: 'The solid ball', ok: true },
                { t: 'The hoop', why: 'The hoop has all its mass at the rim, so it’s the hardest to spin up. Watch the race next.' },
                { t: 'All at the same time', why: 'For sliding without friction they’d tie. But rolling objects also need energy to spin, and how much depends on how their mass is spread out.' },
              ],
              explain: r`The ball wins and the hoop comes last. Let's see why.`,
            },
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'Race!',
              body: r`Press **Play**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4.6, grid: false, axes: false, height: 300,
                animate: { param: 't', speed: 1, max: 4.2, loop: false },
                extra: ({ plot, p, s }) => {
                  const th = Math.atan2(3.4, 9);
                  const L = Math.hypot(9, 3.4);
                  const els = [s('path', { d: `M${plot.X(0.5)} ${plot.Y(3.9)} L${plot.X(9.5)} ${plot.Y(0.5)} L${plot.X(0.5)} ${plot.Y(0.5)} Z`, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 })];
                  SHAPES.forEach((sh, i) => {
                    const a = (9.8 * 0.35 * Math.sin(th)) / (1 + sh.k); // scaled-down g for a watchable race
                    const d = Math.min(L, 0.5 * a * p.t * p.t);
                    const x = 0.5 + d * Math.cos(th), y = 3.9 - d * Math.sin(th);
                    const rr = 0.32;
                    const nx = Math.sin(th), ny = Math.cos(th);
                    const cx = plot.X(x + nx * rr), cy = plot.Y(y + ny * rr) - i * 0;
                    const R = plot.X(rr) - plot.X(0);
                    const off = (i - 1) * 0; // same lane, drawn with slight transparency
                    if (sh.name === 'hoop') els.push(s('circle', { cx, cy: cy + off, r: R - 3, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 6 }));
                    else els.push(s('circle', { cx, cy: cy + off, r: R, class: sh.cls, opacity: 0.85 }));
                    els.push(s('text', { x: plot.X(1), y: plot.Y(4.4 - i * 0.0) + i * 16 - 30, class: 'lbl', style: `font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));fill:var(--${['blue', 'teal', 'coral'][i]})`, text: `${sh.name}${d >= L ? ' ✓ finished' : ''}` }));
                  });
                  return els;
                },
                readout: () => r`ball $a = \tfrac57 g\sin\theta$, $\;$ disc $a = \tfrac23 g\sin\theta$, $\;$ hoop $a = \tfrac12 g\sin\theta$`,
                ready: true,
              },
            },
            {
              type: 'explain',
              title: 'Moment of inertia',
              body: r`Just as mass resists changes in motion, the **moment of inertia** $I$ resists changes in rotation. It depends on how far the mass sits from the axis:
$$I = \sum m r^2$$
- Solid sphere: $I = \tfrac25 MR^2$
- Solid disc: $I = \tfrac12 MR^2$
- Hoop: $I = MR^2$ (all the mass at the rim)

Rolling down a ramp, gravitational energy must supply both motion **and** spin. Objects with a bigger $I$ put more energy into spinning, so less goes into speed.`,
            },
            {
              type: 'mcq',
              title: 'Which is easier to spin?',
              prompt: 'Two wheels have the same mass and radius. One has its mass concentrated near the hub, the other near the rim. Which is easier to start spinning?',
              choices: [
                { t: 'The one with mass near the hub', ok: true },
                { t: 'The one with mass near the rim', why: r`Mass far from the axis counts with $r^2$, giving a larger moment of inertia that resists spinning up.` },
                { t: 'Both equally', why: 'Same mass, but different distribution, so different moments of inertia.' },
              ],
              explain: r`Mass near the axis contributes little to $I$ (small $r^2$). That's why racing bikes use light rims: less rotational inertia to spin up when accelerating.`,
            },
            {
              type: 'numeric',
              title: 'A spinning disc',
              prompt: r`A solid disc has moment of inertia $\frac12MR^2$. What is it for a disc of mass 2 kg and radius 0.5 m, in kg·m²?`,
              unit: 'kg·m²',
              answer: 0.25,
              tol: 0.001,
              explain: r`$\frac12 \times 2 \times 0.25 = 0.25$ kg·m². A ring of the same mass and radius ($MR^2 = 0.5$) has twice as much, since all its mass is at the rim.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rolling speed',
              prompt: r`A solid ball rolls without slipping down a ramp that drops 1.4 m in height. Energy conservation gives $v = \sqrt{\tfrac{10}{7} g h}$. How fast is it moving at the bottom? (g = 9.8)`,
              unit: 'm/s',
              answer: Math.sqrt((10 / 7) * 9.8 * 1.4),
              tol: 0.02,
              wrong: [{ v: Math.sqrt(2 * 9.8 * 1.4), tol: 0.02, why: r`That's $\sqrt{2gh}$, for sliding without friction. A rolling ball also has spin energy, so it's slower.` }],
              explain: r`$v = \sqrt{\tfrac{10}{7} \times 9.8 \times 1.4} = \sqrt{19.6} \approx 4.43$ m/s, slower than the 5.24 m/s of a frictionless slide, because $\tfrac27$ of the energy goes into spinning.`,
            },
          ],
          recap: [
            r`Moment of inertia $I = \sum mr^2$: mass far from the axis is harder to spin.`,
            'Rolling objects share energy between moving and spinning.',
            'In a rolling race, sphere beats disc beats hoop, whatever their mass and size.',
          ],
        },
        {
          id: 'angular-momentum',
          title: 'Angular Momentum',
          summary: 'The spinning skater',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Arms in',
              prompt: 'A spinning figure skater pulls her arms in close to her body. What happens to her spin?',
              cols: 2,
              choices: [
                { t: 'She spins faster', ok: true },
                { t: 'She spins slower', why: 'Pulling mass inward reduces her moment of inertia, and she speeds up to compensate.' },
                { t: 'No change', why: 'Watch any skating competition: the spin speeds up dramatically.' },
              ],
              explain: r`With no outside torque, her **angular momentum** stays constant. Pulling her arms in reduces her moment of inertia, so her spin rate must increase.`,
            },
            {
              type: 'explain',
              title: 'Conservation of angular momentum',
              body: r`**Angular momentum** is $L = I\omega$, where $\omega$ is the spin rate. With no external torque:
$$I_1 \omega_1 = I_2 \omega_2$$
Shrink $I$ and $\omega$ must grow. Divers tuck to spin faster and stretch out to slow down before entering the water.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -2.2, ymax: 2.2, grid: false, axes: false, maxWidth: 440,
                animate: { param: 't', speed: 1, autoplay: true },
                params: { arm: { min: 0.4, max: 2.4, step: 0.1, value: 2.2, label: 'arm reach', color: 'violet', format: (v) => v.toFixed(1) } },
                extra: ({ plot, p, s }) => {
                  // I = body (fixed) + arms (∝ reach²); L fixed
                  const I = 1 + 0.5 * p.arm * p.arm;
                  const L0 = 1 + 0.5 * 2.2 * 2.2; // spin rate 1 rad/s at full reach
                  const w = L0 / I;
                  const ang = w * p.t;
                  const ax = Math.cos(ang) * p.arm, ay = Math.sin(ang) * p.arm;
                  return [
                    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(0.45) - plot.X(0), class: 'fl-violet', opacity: 0.85 }),
                    s('line', { x1: plot.X(-ax), y1: plot.Y(-ay), x2: plot.X(ax), y2: plot.Y(ay), stroke: 'var(--ink)', 'stroke-width': 6, 'stroke-linecap': 'round' }),
                    s('circle', { cx: plot.X(ax), cy: plot.Y(ay), r: 9, class: 'fl-coral' }),
                    s('circle', { cx: plot.X(-ax), cy: plot.Y(-ay), r: 9, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => {
                  const I = 1 + 0.5 * p.arm * p.arm, L0 = 1 + 0.5 * 2.2 * 2.2;
                  return r`$I = ${f2(I)}$, $\;\omega = ${f2(L0 / I)}$, $\;L = I\omega = ${f2(L0)}$ (constant)`;
                },
              },
            },
            {
              type: 'numeric',
              title: 'Spin up',
              prompt: 'A skater spins at 2 revolutions per second with I = 4 kg·m². She pulls in her arms, reducing I to 1.6 kg·m². What is her new spin rate?',
              unit: 'rev/s',
              answer: 5,
              wrong: [{ v: 0.8, why: r`Smaller $I$ means **faster** spinning: $\omega_2 = \omega_1 \frac{I_1}{I_2}$.` }, { v: 3.2, why: r`$4 \times 2 = 1.6 \times \omega_2$.` }],
              explain: r`$I_1\omega_1 = I_2\omega_2$: $4 \times 2 = 1.6\,\omega_2$, so $\omega_2 = 5$ rev/s.`,
            },
            {
              type: 'mcq',
              title: 'Where does the energy come from?',
              prompt: r`When a skater pulls in her arms, her moment of inertia halves and her spin rate doubles, so her rotational kinetic energy $\frac12 I\omega^2$ **doubles**. Where does the extra energy come from?`,
              choices: [
                { t: 'From her muscles: pulling her arms inwards against their tendency to fly outwards takes work', ok: true },
                { t: 'It isn’t really there: energy must be conserved, so it can’t double', why: 'Energy is conserved overall: her muscles supply it. Angular momentum is what stays fixed.' },
                { t: 'From the ice', why: 'The ice exerts almost no torque. The work is done by her own arms.' },
              ],
              explain: r`Angular momentum $I\omega$ is conserved, but kinetic energy isn't, because her arms do work pulling inwards against the "centrifugal" tendency of spinning arms to fly out. With $I$ halved and $\omega$ doubled, $\frac12 I\omega^2$ doubles, and the difference comes from her muscles. Stretching back out returns that energy.`,
            },
            {
              type: 'numeric',
              title: 'Extra spin energy',
              prompt: r`A skater pulls in her arms, cutting her moment of inertia from 4 to 1.6 kg·m². Angular momentum stays the same, but rotational energy $\frac{L^2}{2I}$ changes. By what factor does it increase?`,
              answer: 2.5,
              tol: 0.001,
              explain: r`$\frac{4}{1.6} = 2.5$: the energy rises by the same factor as the spin rate. The extra energy comes from the work her muscles do pulling her arms inward against their tendency to fly out.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Collapsing stars',
              prompt: 'When a massive star’s core collapses into a neutron star (shrinking from thousands of km across to about 20 km), what happens to its spin?',
              choices: [
                { t: 'It spins enormously faster, sometimes hundreds of times per second', ok: true },
                { t: 'It stops spinning', why: 'Angular momentum is conserved, so a shrinking star spins up, just like the skater.' },
                { t: 'Its spin stays the same', why: r`The moment of inertia drops by an enormous factor ($\propto r^2$), so the spin rate rises by the same factor.` },
              ],
              explain: r`Shrinking the radius by a factor of about 1000 reduces $I$ by about $10^6$, so the spin rate jumps by about a million. Pulsars (spinning neutron stars) rotate up to more than 700 times per second.`,
            },
          ],
          recap: [
            r`Angular momentum $L = I\omega$ is conserved when there's no external torque.`,
            r`Reduce $I$ (pull the mass in) and you spin faster: skaters, divers, neutron stars.`,
            'Rotation has its own versions of mass, force and momentum.',
          ],
        },
      ],
    },
    {
      title: 'Energy in Rotation',
      summary: 'Flywheels and rolling.',
      lessons: [
        {
          id: 'flywheels',
          title: 'Rotational Energy',
          summary: 'Torque, spin-up and flywheels',
          icon: 'reset',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Newton’s law for spinning',
              body: r`Just as $F = ma$, rotation obeys $\tau = I\alpha$: a torque $\tau$ gives an angular acceleration $\alpha$, resisted by the moment of inertia $I$.`,
              prompt: r`A torque of 10 N·m acts on a wheel with $I = 2$ kg·m². What is its angular acceleration, in rad/s²?`,
              unit: 'rad/s²',
              answer: 5,
              wrong: [{ v: 20, why: r`$\alpha = \frac{\tau}{I} = \frac{10}{2}$.` }, { v: 0.2, why: 'Divide the torque by the moment of inertia, not the other way round.' }],
              explain: r`$\alpha = \frac{\tau}{I} = 5$ rad/s²: after 4 seconds it spins at 20 rad/s, about 3 turns per second. Bigger $I$ means a wheel that's harder to spin up, and harder to slow down.`,
            },
            {
              type: 'explain',
              title: 'Energy of spinning',
              body: r`A spinning object stores **rotational kinetic energy**:
$$E = \tfrac12 I \omega^2.$$
Each bit of mass moving at speed $v = r\omega$ contributes $\frac12 m v^2$, and adding them up gives $\frac12 I\omega^2$. For a solid disc, $I = \frac12 m R^2$, so
$$E = \tfrac14 m R^2 \omega^2 = \tfrac14 m\, v_{\text{rim}}^2,$$
where $v_{\text{rim}} = R\omega$ is the speed of the rim. A **flywheel** uses this to store energy: spin it up with a motor, and get the energy back later as a generator.`,
            },
            {
              type: 'interactive',
              title: 'Design a flywheel',
              body: r`Design a solid-disc flywheel that stores at least **1 kWh**. But beware: the rim can't move faster than **700 m/s**, or even carbon fibre flies apart.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 1.2, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 300,
                animate: { param: 't', speed: 1, autoplay: true },
                params: {
                  m: { min: 10, max: 100, step: 5, value: 20, label: 'mass', color: 'blue', format: (v) => `${v} kg` },
                  R: { min: 0.1, max: 1, step: 0.05, value: 0.3, label: 'radius', color: 'violet', format: (v) => `${v.toFixed(2)} m` },
                  rpm: { min: 1000, max: 60000, step: 1000, value: 10000, label: 'speed', color: 'coral', format: (v) => `${v.toLocaleString()} rpm` },
                },
                extra: ({ plot, p, s }) => { const rr = plot.X(p.R) - plot.X(0), a = (p.t * Math.min(p.rpm, 20000) / 3000) % (2 * Math.PI), over = rimSpeed(p.R, p.rpm) > 700; return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: rr, class: over ? 'fl-coral-soft' : 'fl-blue-soft', stroke: over ? 'var(--coral)' : 'var(--blue)', 'stroke-width': 3 }), s('line', { x1: plot.X(0), y1: plot.Y(0), x2: plot.X(p.R * Math.cos(a)), y2: plot.Y(p.R * Math.sin(a)), stroke: 'var(--ink)', 'stroke-width': 3 })]; },
                readout: (p) => { const E = flyKWh(p.m, p.R, p.rpm), v = rimSpeed(p.R, p.rpm); return `Energy **${E.toFixed(2)} kWh** · rim speed **${Math.round(v)} m/s** ${v > 700 ? '✗ too fast: it would burst' : '✓'}`; },
                goal: (p) => flyKWh(p.m, p.R, p.rpm) >= 1 && rimSpeed(p.R, p.rpm) <= 700,
                hint: r`With the rim at its limit, $E = \frac14 m v_{\text{rim}}^2$ depends only on the mass. How much mass gives 3.6 MJ at 700 m/s?`,
                solution: { m: 35, R: 0.3, rpm: 22000 },
              },
              explain: r`Because $E = \frac14 m v_{\text{rim}}^2$, the rim-speed limit caps the energy per kilogram at $\frac14 (700)^2 \approx 122$ kJ/kg. So you need at least about 30 kg, however you choose the radius and speed: a smaller wheel just has to spin faster. The strength of the material, not its size, sets how much energy a flywheel can hold.`,
            },
            {
              type: 'numeric',
              title: 'Energy per kilogram',
              prompt: r`A steel flywheel's rim is limited to about 300 m/s. What is the most energy a solid steel disc can store per kilogram, in kJ/kg? (Use $E = \frac14 m v_{\text{rim}}^2$.)`,
              unit: 'kJ/kg',
              answer: (0.25 * 300 * 300) / 1000,
              tol: 0.6,
              wrong: [{ v: 45, tol: 0.6, why: r`It's $\frac14 v^2$ for a solid disc, not $\frac12 v^2$.` }, { v: 22500, tol: 10, why: 'That’s in J/kg. Divide by 1000 for kJ/kg.' }],
              explain: r`$\frac14 \times 300^2 = 22{,}500$ J/kg $\approx 22.5$ kJ/kg, only a few per cent of a lithium-ion battery's energy per kilogram (several hundred kJ/kg). Flywheels can't compete on storage, but they can absorb and release energy extremely fast and last for millions of cycles, so they're used to smooth power for data centres and grids, and for regenerative braking in some racing cars.`,
            },
            {
              type: 'mcq',
              title: 'Hollow or solid?',
              prompt: r`For the same mass and outer radius, which stores more energy at the same spin rate: a solid disc or a thin ring with all its mass at the rim?`,
              choices: [
                { t: 'The ring: all its mass moves at the fastest (rim) speed, so its moment of inertia is twice the disc’s', ok: true },
                { t: 'The solid disc', why: r`The disc's inner mass moves slowly and stores little energy: $I_\text{disc} = \frac12 mR^2$ vs $I_\text{ring} = mR^2$.` },
                { t: 'They store the same', why: 'Mass far from the axis counts for more, because energy grows with speed squared.' },
              ],
              explain: r`$I_\text{ring} = mR^2$ is twice $I_\text{disc} = \frac12 mR^2$, so at the same spin the ring stores twice the energy. That's why old steam-engine flywheels had heavy rims and thin spokes. (Modern flywheels must also survive the huge stresses, which complicates the design.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Spinning Earth',
              prompt: r`Earth's moment of inertia is about $8.0 \times 10^{37}$ kg·m², and it turns once a day ($\omega = 7.3 \times 10^{-5}$ rad/s). What is its rotational kinetic energy, in units of $10^{29}$ J? (1 decimal place.)`,
              unit: r`$\times 10^{29}$ J`,
              answer: (0.5 * 8e37 * 7.3e-5 ** 2) / 1e29,
              tol: 0.05,
              wrong: [{ v: (8e37 * 7.3e-5 ** 2) / 1e29, tol: 0.05, why: r`Don't forget the $\frac12$.` }, { v: (0.5 * 8e37 * 7.3e-5) / 1e29, tol: 1e10, why: r`Square the angular speed: $\omega^2 = 5.3 \times 10^{-9}$.` }],
              hint: r`$\omega^2 = (7.3 \times 10^{-5})^2 \approx 5.3 \times 10^{-9}$.`,
              explain: r`$\frac12 \times 8 \times 10^{37} \times 5.3 \times 10^{-9} \approx 2.1 \times 10^{29}$ J, several hundred million years of humanity’s total energy use at today’s rate. The Moon's tides tap a tiny fraction of it, slowly braking Earth's spin and lengthening the day by about 2 milliseconds per century.`,
            },
          ],
          recap: [
            r`$\tau = I\alpha$ is Newton's second law for rotation.`,
            r`Rotational kinetic energy: $\frac12 I\omega^2$; for a solid disc, $\frac14 m v_\text{rim}^2$.`,
            'A flywheel’s storage is limited by how fast its rim can go before bursting.',
          ],
        },
        {
          id: 'rolling',
          title: 'Rolling and Unrolling',
          summary: 'Energy split, yo-yos and bowling balls',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Two kinds of motion',
              prompt: 'A ball rolls down a slope without slipping. Into what kinds of energy does its lost height go?',
              choices: [
                { t: 'Both moving forwards (translation) and spinning (rotation)', ok: true },
                { t: 'Only moving forwards', why: 'Rolling means spinning too, and spin carries energy: that’s why rolling objects are slower than sliding ones.' },
                { t: 'Only spinning', why: 'The ball also moves down the slope as a whole.' },
              ],
              explain: r`A rolling object shares its energy: $\frac12 mv^2$ for moving along and $\frac12 I\omega^2$ for spinning, with $v = R\omega$ when there's no slipping. The more of its mass sits far from the axis, the bigger the spinning share, and the slower it rolls. That's why the solid ball beat the hoop in the earlier race.`,
            },
            {
              type: 'numeric',
              title: 'The spinning share',
              prompt: r`For a rolling solid sphere ($I = \frac25 mR^2$), what fraction of its kinetic energy is rotational? (3 decimal places.)`,
              answer: 2 / 7,
              tol: 0.001,
              wrong: [{ v: 0.4, tol: 0.001, why: r`Rotational: $\frac12 \cdot \frac25 mv^2 = \frac15 mv^2$. Total: $\frac12 mv^2 + \frac15 mv^2 = \frac{7}{10}mv^2$. Divide.` }, { v: 0.5, tol: 0.001, why: 'That’s a hoop, which has all its mass at the rim.' }],
              explain: r`Rotational $= \frac15 mv^2$, translational $= \frac12 mv^2$, total $= \frac{7}{10} mv^2$, so the rotational share is $\frac{2}{7} \approx 0.286$. A disc gives $\frac13$ and a hoop $\frac12$: the order of the rolling race.`,
            },
            {
              type: 'interactive',
              title: 'Slow the yo-yo',
              body: r`A yo-yo is a disc (radius 3 cm) that unwinds its string from a thin axle of radius $r$. Its downward acceleration is $a = \dfrac{g}{1 + R^2/(2r^2)}$. Choose the axle radius so the yo-yo falls with an acceleration of about **one-tenth of $g$** (between 0.8 and 1.0 m/s²).`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5, grid: false, axes: false, maxWidth: 260,
                params: { r: { min: 0.3, max: 3, step: 0.05, value: 1.5, label: 'axle radius', color: 'coral', format: (v) => `${v.toFixed(2)} cm` } },
                extra: ({ plot, p, s }) => [
                  s('line', { x1: plot.X(-p.r / 3), y1: plot.Y(1.5), x2: plot.X(-p.r / 3), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 2 }),
                  s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 }),
                  s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(p.r / 3) - plot.X(0), class: 'fl-coral', stroke: 'var(--ink)', 'stroke-width': 1 }),
                ],
                readout: (p) => `Acceleration **${yoyoA(p.r).toFixed(2)} m/s²** (${(yoyoA(p.r) / 9.8 * 100).toFixed(0)}% of g)`,
                goal: (p) => yoyoA(p.r) >= 0.8 && yoyoA(p.r) <= 1.0,
                hint: r`You need $1 + \frac{R^2}{2r^2} \approx 10$, so $r^2 \approx \frac{R^2}{18}$.`,
                solution: { r: 0.7 },
              },
              explain: r`With $r \approx 0.7$ cm, $\frac{R^2}{2r^2} \approx 9$, so $a \approx \frac{g}{10}$. A thin axle means the yo-yo must spin very fast to drop a little, so almost all its energy goes into spin. That stored spin is what lets it climb back up the string, or "sleep" at the bottom when the string is looped loosely around the axle.`,
            },
            {
              type: 'numeric',
              title: 'A rolling hoop',
              prompt: r`A hoop ($I = mR^2$) rolls without slipping down the same 1.4 m drop. Its kinetic energy is $\frac12 mv^2 + \frac12 I\omega^2 = mv^2$. How fast is it moving at the bottom, in m/s? ($g = 9.8$ m/s².)`,
              unit: 'm/s',
              answer: Math.sqrt(9.8 * 1.4),
              tol: 0.02,
              wrong: [{ v: Math.sqrt(2 * 9.8 * 1.4), tol: 0.02, why: r`That's a sliding (frictionless) object, $\sqrt{2gh}$. A rolling hoop puts half its energy into spin.` }, { v: Math.sqrt((10 / 7) * 9.8 * 1.4), tol: 0.02, why: 'That’s the solid ball. A hoop has all its mass at the rim, so more energy goes into spin.' }],
              hint: r`$mgh = mv^2$, so $v = \sqrt{gh}$.`,
              explain: r`$v = \sqrt{gh} = \sqrt{13.72} \approx 3.70$ m/s, against 4.43 m/s for a solid ball and 5.24 m/s for frictionless sliding. Half the hoop's energy is locked up in spin, which is why it always comes last in the race.`,
            },
            {
              type: 'mcq',
              title: 'Skid, then roll',
              prompt: r`A bowling ball is thrown so it starts by **sliding** down the lane without spinning. What happens next?`,
              choices: [
                { t: 'Friction slows its sliding and speeds up its spin until it rolls without slipping, a bit slower than it started', ok: true },
                { t: 'It slides all the way down the lane', why: 'Friction with the lane acts on the bottom of the ball, creating a torque that makes it spin.' },
                { t: 'It speeds up as it starts rolling', why: 'Friction takes kinetic energy away while the ball skids; it can only lose speed.' },
              ],
              explain: r`Friction at the bottom of the ball pushes backwards, slowing it down, and also exerts a torque that spins it up. Once the spin matches the speed ($v = R\omega$) the skidding stops and the ball rolls. Bowlers use this deliberately, adding sideways spin so the ball hooks into the pins as it starts to roll.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Five-sevenths',
              prompt: r`Friction's torque about the point of contact is zero, so the ball's angular momentum about that point is conserved: $mRv_0 = mRv + I\omega$, with $I = \frac25 mR^2$ and finally $\omega = v/R$. A ball starts sliding at 7 m/s with no spin. How fast does it move once it rolls without slipping?`,
              unit: 'm/s',
              answer: 5,
              wrong: [{ v: 7, why: 'Friction slows it during the skid: it can’t keep all its speed.' }, { v: 7 * Math.sqrt(5 / 7), tol: 0.02, why: 'Energy isn’t conserved during skidding (friction turns some into heat). Use angular momentum about the contact point.' }],
              hint: r`$v_0 = v + \frac25 v = \frac75 v$.`,
              explain: r`$Rv_0 = Rv + \frac25 R^2 \cdot \frac{v}{R}$ gives $v_0 = \frac75 v$, so $v = \frac57 \times 7 = 5$ m/s. Whatever the starting speed, a sliding solid ball always ends up rolling at $\frac57$ of it. The lost kinetic energy, $\frac27$ of the original, becomes heat while skidding.`,
            },
          ],
          recap: [
            'Rolling splits kinetic energy between translation and rotation (2/7 rotational for a solid sphere).',
            'A yo-yo with a thin axle puts almost all its energy into spin and falls slowly.',
            'A sliding ball ends up rolling at 5/7 of its starting speed (angular momentum about the contact point).',
          ],
        },
        {
          id: 'ladder',
          title: 'Will the Ladder Slip?',
          summary: 'Balancing forces and torques',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'A classic of statics',
              body: r`A uniform ladder leans against a smooth wall. Three things act on it: its weight at the middle, a push from the wall (horizontal, since the wall is smooth), and the floor, which pushes up and also grips with friction. For the ladder to stay put, the forces must balance **and** the torques must balance.

Taking torques about the foot, the wall’s push must be $\frac{W}{2\tan\theta}$, where $\theta$ is the angle between ladder and floor. Friction at the floor must supply exactly that horizontal force, and it can provide at most $\mu W$. So the ladder holds if
$$\mu \ge \frac{1}{2\tan\theta}.$$`,
            },
            {
              type: 'numeric',
              title: 'Sixty degrees',
              prompt: r`What coefficient of friction is needed to hold a ladder at 60° to the floor? (3 decimal places.)`,
              answer: 1 / (2 * Math.tan(Math.PI / 3)),
              tol: 0.002,
              explain: r`$\frac{1}{2\tan 60°} = \frac{1}{2 \times 1.732} \approx 0.289$. Rubber feet on a dry floor easily provide that.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How shallow can it go?',
              prompt: r`The floor offers $\mu = 0.4$. Lower the ladder and find the **smallest** angle at which it still doesn’t slip.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 4.5, ymin: -0.5, ymax: 4, grid: false, axes: false, maxWidth: 380, pad: 6,
                params: { th: { min: 30, max: 85, step: 0.05, value: 65, label: 'angle with the floor', color: 'amber', format: (v) => `${v.toFixed(2)}°` } },
                extra: ({ plot, p, s, arrow }) => { const t = (p.th * Math.PI) / 180, L = 3.8, x0 = L * Math.cos(t), need = 1 / (2 * Math.tan(t)), ok = need <= 0.4 + 1e-9; return [s('line', { x1: plot.X(-0.5), x2: plot.X(4.5), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink-2)', 'stroke-width': 3 }), s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(0), y2: plot.Y(4), stroke: 'var(--ink-2)', 'stroke-width': 3 }), s('line', { x1: plot.X(x0), y1: plot.Y(0), x2: plot.X(0), y2: plot.Y(L * Math.sin(t)), stroke: ok ? 'var(--amber)' : 'var(--error)', 'stroke-width': 7, 'stroke-linecap': 'round' }), arrow(plot.X(x0), plot.Y(0.15), plot.X(x0 - Math.min(2, 2 * need)), plot.Y(0.15), { color: 'var(--teal)', width: 3 }), arrow(plot.X(x0 / 2), plot.Y((L * Math.sin(t)) / 2), plot.X(x0 / 2), plot.Y((L * Math.sin(t)) / 2 - 1), { color: 'var(--coral)', width: 3 })]; },
                readout: (p) => { const need = 1 / (2 * Math.tan((p.th * Math.PI) / 180)); return `friction needed **μ = ${need.toFixed(3)}** (teal arrow) · available 0.400 · ${need <= 0.4 + 1e-9 ? 'safe' : '**it slips!**'}`; },
                goal: (p) => Math.abs(p.th - 51.34) < 0.1,
                hint: r`You need $\tan\theta = \frac{1}{2 \times 0.4} = 1.25$.`,
                solution: { th: 51.34 },
              },
              explain: r`$\tan\theta = 1.25$ gives $\theta \approx 51.3°$. Below that, the wall pushes harder than friction can hold, and the foot slides out. The shallower the ladder, the more the wall has to push to stop it rotating, and the more friction is needed.`,
            },
            {
              type: 'mcq',
              title: 'The 4-to-1 rule',
              prompt: r`Safety guides say the foot should be 1 unit out for every 4 units up ($\tan\theta = 4$, about 76°). How much friction does a bare ladder need at that angle?`,
              choices: [
                { t: 'Only 0.125, leaving a big safety margin', ok: true },
                { t: '0.5', why: r`$\frac{1}{2 \times 4} = 0.125$.` },
                { t: 'None at all', why: 'Any lean needs some friction (unless the ladder is vertical, which is unstable in other ways).' },
              ],
              explain: r`$\frac{1}{2 \times 4} = 0.125$. The margin matters, because a person climbing changes everything, as the next question shows.`,
            },
            {
              type: 'numeric',
              title: 'Someone at the top',
              prompt: r`A person with the same weight as the ladder stands at its top. The friction needed becomes $\frac{\frac12 + 1}{2\tan\theta}$. At 60°, what coefficient of friction is needed now? (2 decimal places.)`,
              answer: 1.5 / (2 * Math.tan(Math.PI / 3)),
              tol: 0.01,
              explain: r`$\frac{1.5}{2 \times 1.732} \approx 0.43$: half as much again as for the bare ladder. The higher you climb, the more friction is needed: ladders tend to slip when the climber is near the top.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Footing the ladder',
              prompt: r`Why does it help to have someone stand on the bottom rung while you climb?`,
              choices: [
                { t: 'Their weight at the foot adds normal force (so more friction) without adding much torque', ok: true },
                { t: 'It makes the ladder lighter', why: 'It makes the system heavier, but in the right place.' },
                { t: 'It pushes the ladder against the wall', why: 'The benefit comes from the extra friction at the foot.' },
              ],
              explain: r`Weight right at the foot has almost no lever arm about the foot, so it barely increases the wall’s push, but it presses the foot down and raises the maximum friction $\mu N$. Cheap, and effective.`,
            },
          ],
          recap: [
            r`A leaning ladder holds if $\mu \ge \frac{1}{2\tan\theta}$ (uniform ladder, smooth wall).`,
            'Shallower angles need more friction; climbers near the top need more still.',
            'Statics: balance both forces and torques.',
          ],
        },
      ],
    },
  ],
};
