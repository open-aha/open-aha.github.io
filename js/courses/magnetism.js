import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

// field lines of a bar magnet modelled as two opposite "poles" at (±a, 0): N at +a, S at -a
function fieldLines({ s, w, h }) {
  const a = 60, cx = w / 2, cy = h / 2;
  const field = (x, y) => {
    const dxn = x - (cx + a), dyn = y - cy, rn = Math.hypot(dxn, dyn) ** 3;
    const dxs = x - (cx - a), dys = y - cy, rs = Math.hypot(dxs, dys) ** 3;
    return [dxn / rn - dxs / rs, dyn / rn - dys / rs];
  };
  const els = [];
  const n = 14;
  // trace forward from N, and backward from S, so lines leaving the frame still look symmetric
  for (const dir of [1, -1]) {
    const startX = dir > 0 ? cx + a : cx - a, endX = dir > 0 ? cx - a : cx + a;
    for (let i = 0; i < n; i++) {
      const ang = (2 * Math.PI * (i + 0.5)) / n;
      let x = startX + 8 * Math.cos(ang), y = cy + 8 * Math.sin(ang);
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      let closed = false;
      for (let k = 0; k < 900; k++) {
        const [fx, fy] = field(x, y);
        const m = Math.hypot(fx, fy) || 1;
        x += dir * (fx / m) * 2.5;
        y += dir * (fy / m) * 2.5;
        if (k % 3 === 0) d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
        if (Math.hypot(x - endX, y - cy) < 8) { closed = true; break; }
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) break;
      }
      // closed loops were already drawn by the forward pass
      if (dir < 0 && closed) continue;
      els.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 1.8, opacity: 0.7 }));
    }
  }
  els.push(s('rect', { x: cx - a - 30, y: cy - 22, width: a + 30, height: 44, rx: 6, class: 'fl-blue' }));
  els.push(s('rect', { x: cx, y: cy - 22, width: a + 30, height: 44, rx: 6, class: 'fl-coral' }));
  els.push(s('text', { x: cx - a / 2 - 8, y: cy + 8, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800;font-size:22px', text: 'S' }));
  els.push(s('text', { x: cx + a / 2 + 8, y: cy + 8, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800;font-size:22px', text: 'N' }));
  // a few compasses
  for (const [px, py] of [[cx, cy - 95], [cx + 170, cy - 40], [cx - 170, cy + 45], [cx + 60, cy + 95]]) {
    const [fx, fy] = field(px, py);
    const ang = Math.atan2(fy, fx);
    const ux = Math.cos(ang) * 14, uy = Math.sin(ang) * 14;
    els.push(s('circle', { cx: px, cy: py, r: 17, class: 'fl-card', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    els.push(s('path', { d: `M${px + ux} ${py + uy} L${px - uy * 0.3} ${py + ux * 0.3} L${px - uy * -0.3} ${py + ux * -0.3} Z`, class: 'fl-coral' }));
    els.push(s('path', { d: `M${px - ux} ${py - uy} L${px - uy * 0.3} ${py + ux * 0.3} L${px + uy * 0.3} ${py - ux * 0.3} Z`, class: 'fl-muted' }));
  }
  return els;
}

// flux through a coil at x = 0 from a magnet at x (bell-shaped), and its derivative
const flux = (x) => 1 / (1 + x * x) ** 1.5;
const dflux = (x) => (-3 * x) / (1 + x * x) ** 2.5;

// hysteresis model: magnetisation on the rising and falling branches, for coercivity hc
const mUp = (H, hc) => Math.tanh((H - hc) / 0.3), mDown = (H, hc) => Math.tanh((H + hc) / 0.3);

// 1 m pipes; free fall y = 4.9t², or with eddy-current drag a = g - v/τ (terminal speed 0.25 m/s, so τ = 0.0255 s)
const pipeDrop = (t) => { const tau = 0.25 / 9.8, v = 0.25 * (1 - Math.exp(-t / tau)), y = 0.25 * (t - tau * (1 - Math.exp(-t / tau))); return { y: Math.min(1, y), v: y >= 1 ? 0 : v }; };

export default {
  id: 'magnetism',
  subject: 'physics',
  title: 'Magnetism & Induction',
  level: 'Advanced',
  cover: 'magnetism',
  tagline: 'Magnets, electromagnets, motors, generators, particle steering and magnetic materials.',
  description: r`Map magnetic fields, discover that electric currents make magnetism, see why moving charges curve in magnetic fields, and uncover Faraday's great discovery: changing magnetism makes electricity. That's the principle behind every generator and transformer. Then steer particles in spectrometers and cyclotrons, and explore why some materials make good magnets.`,
  prereq: 'Electricity & Circuits',
  chapters: [
    {
      title: 'Magnetic Fields',
      summary: 'Magnets, currents and forces.',
      lessons: [
        {
          id: 'magnets',
          title: 'Magnets & Fields',
          summary: 'Poles and field lines',
          icon: 'atom',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Snap a magnet',
              prompt: 'You break a bar magnet in half. What do you get?',
              choices: [
                { t: 'Two smaller magnets, each with its own N and S pole', ok: true },
                { t: 'A separate N pole and a separate S pole', why: 'It’s a natural guess, but magnetic poles always come in pairs. Nobody has ever found a lone north or south pole.' },
                { t: 'Two non-magnetic pieces', why: 'Each piece is still a full magnet.' },
              ],
              explain: r`Every piece, however small, has both a north and a south pole. A magnet is made of countless tiny atomic magnets lined up, so cutting it just makes smaller lined-up groups. Isolated magnetic poles ("monopoles") have never been observed.`,
            },
            {
              type: 'explain',
              title: 'Field lines',
              body: r`The space around a magnet holds a **magnetic field**. Field lines show its direction (the way a compass needle's north end would point). Outside the magnet they run from **N to S**. Where the lines crowd together, the field is strong.`,
              widget: { kind: 'figure', w: 600, h: 320, label: 'Field lines around a bar magnet', draw: fieldLines },
              after: 'Like poles repel and opposite poles attract. The coral end of each compass needle is its north end, and it points along the field.',
            },
            {
              type: 'mcq',
              title: 'Earth’s magnet',
              prompt: 'A compass needle’s north end points toward Earth’s geographic North Pole. What kind of magnetic pole is located up there?',
              choices: [
                { t: 'A magnetic south pole', ok: true },
                { t: 'A magnetic north pole', why: 'Opposites attract. The needle’s north end is pulled toward a *south* magnetic pole.' },
                { t: 'There’s no magnetic pole there', why: 'Earth has a magnetic pole near the geographic North Pole (it wanders slowly). Its type follows from opposites attracting.' },
              ],
              explain: r`Opposite poles attract, so the pole that pulls a compass's north end must be a magnetic **south** pole, even though we call it the "North Magnetic Pole" geographically. Earth's field comes from churning molten iron in its outer core.`,
            },
            {
              type: 'mcq',
              title: 'Field inside',
              prompt: 'Outside a bar magnet, field lines run from N to S. Which way do they run inside the magnet?',
              cols: 2,
              choices: [
                { t: 'From S to N, closing the loop', ok: true },
                { t: 'From N to S as well', why: 'Magnetic field lines never start or stop. They form closed loops, so inside they must return from S to N.' },
                { t: 'There’s no field inside', why: 'The field is actually strongest inside, where the lines are packed most tightly.' },
              ],
              explain: r`Magnetic field lines always form **closed loops**: they never begin or end, because there are no monopoles. Inside the magnet, the lines run from S back to N.`,
            },
            {
              type: 'mcq',
              title: 'At the magnetic pole',
              prompt: r`A compass needle that is free to tilt in any direction (a **dip needle**) is carried to Earth's North Magnetic Pole, in the Arctic. What does it do there?`,
              choices: [
                { t: r`It points straight down into the ground`, ok: true },
                { t: r`It points north, as usual`, why: r`There's no "north" left to point to: the field lines dive vertically into the Earth there, and the needle follows them.` },
                { t: r`It spins round and round`, why: r`The needle settles along the field, which is vertical at the magnetic pole.` },
              ],
              explain: r`Field lines loop out of the southern hemisphere and dive back in near the North Magnetic Pole, where they are vertical. In 1831 James Clark Ross reached the pole and found his dip needle within a minute of arc of vertical. In Britain the field dips at about 66°, so even an ordinary compass needle is pulled slightly downwards; compasses are balanced to stop them tilting.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Fridge magnet versus Earth',
              prompt: r`Earth’s magnetic field at the surface is about 50 µT. A fridge magnet’s field near its surface is about 5 mT. How many times stronger is the fridge magnet’s field?`,
              unit: '×',
              answer: 100,
              wrong: [{ v: 0.1, tol: 0.01, why: r`Convert: 5 mT = 5,000 µT.` }],
              explain: r`$\frac{5\ \text{mT}}{50\ \mu\text{T}} = \frac{5000\ \mu\text{T}}{50\ \mu\text{T}} = 100$. Yet Earth’s weak field reaches out into space and steers compass needles everywhere, while the fridge magnet’s field fades within centimetres.`,
            },
          ],
          recap: [
            'Magnets always have two poles. Like poles repel, opposite poles attract.',
            'Field lines run N → S outside a magnet and form closed loops.',
            'Earth is a giant magnet, with a magnetic south pole near the geographic North Pole.',
          ],
        },
        {
          id: 'currents-fields',
          title: 'Currents Make Fields',
          summary: 'Electromagnets',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Ørsted’s surprise',
              body: r`In 1820, during a lecture, Hans Christian Ørsted noticed that a compass needle moved whenever he switched on a current in a nearby wire.`,
              prompt: 'What did this show?',
              choices: [
                { t: 'Electric currents create magnetic fields', ok: true },
                { t: 'The wire was made of iron', why: 'Even copper wires do it. It’s the current that matters, not the metal.' },
                { t: 'Compasses are sensitive to heat', why: 'The needle moved only while current flowed, not when the wire was simply warm.' },
              ],
              explain: r`Electricity and magnetism are connected: a current produces a magnetic field. This discovery started the science of **electromagnetism**.`,
            },
            {
              type: 'explain',
              title: 'Circles around a wire',
              body: r`The field around a straight current-carrying wire forms **circles** centred on the wire. It gets weaker with distance:
$$B = \frac{\mu_0 I}{2\pi r}$$
**Right-hand rule:** point your right thumb along the current, and your curled fingers show the direction the field circles.

Coil the wire into a **solenoid** and the circles add up into a strong, uniform field inside, just like a bar magnet's. Put an iron core inside, and you have an **electromagnet** that you can switch on and off.`,
            },
            {
              type: 'mcq',
              title: 'Stronger electromagnet',
              prompt: 'Which change makes an electromagnet stronger?',
              choices: [
                { t: 'More turns of wire, or more current', ok: true },
                { t: 'Using thinner wire with the same current', why: 'The thickness doesn’t matter for the field. Current and the number of turns do.' },
                { t: 'Removing the iron core', why: 'An iron core greatly strengthens the field.' },
              ],
              explain: r`The field inside a solenoid is proportional to (turns per metre) × current, and an iron core multiplies it hundreds of times. Electromagnets lift scrap cars, run MRI scanners, and ring old doorbells.`,
            },
            {
              type: 'numeric',
              title: 'Field near a wire',
              prompt: r`The field around a long straight wire is $B = \frac{\mu_0 I}{2\pi r}$, with $\mu_0 = 4\pi \times 10^{-7}$ T·m/A. What is the field 1 cm from a wire carrying 10 A, in microteslas?`,
              unit: 'µT',
              answer: 2e-7 * 10 / 0.01 * 1e6,
              tol: 1,
              wrong: [{ v: 2e-4, tol: 1e-5, why: r`That’s in teslas. Convert to microteslas.` }],
              explain: r`$B = \frac{2 \times 10^{-7} \times 10}{0.01} = 2 \times 10^{-4}$ T $= 200\ \mu$T: four times Earth’s field. That’s enough to swing a compass needle held near the wire, Ørsted’s discovery.`,
            },
            {
              type: 'interactive',
              title: 'Fooling a compass',
              body: r`A long wire carrying 10 A makes a field $B = \frac{\mu_0 I}{2\pi r}$ that circles it. Earth’s field (about 50 µT) points north. Move a compass away from the wire and find the distance where the wire’s field **equals** Earth’s, swinging the needle 45°.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 12, ymin: -3, ymax: 3, grid: false, axes: false, maxWidth: 520,
                params: { r: { min: 0.5, max: 11, step: 0.1, value: 2, label: 'distance', color: 'teal', format: (v) => `${v.toFixed(1)} cm` } },
                extra: ({ plot, p, s }) => { const Bw = (2e-7 * 10) / (p.r / 100), ang = Math.atan2(Bw, 5e-5), out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 9, class: 'fl-coral' })]; for (const rr of [1, 2, 4, 7, 10.5]) out.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(rr) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-dasharray': '4 5' })); const L = 1.6, cx = p.r, dx = L * Math.sin(ang), dy = L * Math.cos(ang); out.push(s('circle', { cx: plot.X(cx), cy: plot.Y(0), r: plot.X(1.9) - plot.X(0), class: 'fl-card', stroke: 'var(--ink-3)', 'stroke-width': 2 }), s('line', { x1: plot.X(cx), y1: plot.Y(0), x2: plot.X(cx + dx), y2: plot.Y(dy), stroke: 'var(--coral)', 'stroke-width': 5, 'stroke-linecap': 'round' }), s('line', { x1: plot.X(cx), y1: plot.Y(0), x2: plot.X(cx - dx), y2: plot.Y(-dy), stroke: 'var(--blue)', 'stroke-width': 5, 'stroke-linecap': 'round' })); return out; },
                readout: (p) => { const Bw = (2e-7 * 10) / (p.r / 100); return `wire’s field **${(Bw * 1e6).toFixed(1)} µT** · needle turned **${((Math.atan2(Bw, 5e-5) * 180) / Math.PI).toFixed(1)}°** from north`; },
                goal: (p) => Math.abs(p.r - 4) < 0.05,
                hint: 'r = μ₀I / (2πB) = 2×10⁻⁷ × 10 / (5×10⁻⁵) m.',
                solution: { r: 4 },
              },
              explain: r`At **4 cm** the wire’s 50 µT matches Earth’s field and the needle points halfway between. Closer in, the wire wins; a metre away it is down to 2 µT. This is Ørsted’s 1820 discovery, and also why compasses misbehave near car wiring or speaker magnets.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Farther away',
              prompt: 'The magnetic field 2 cm from a long straight wire is 50 μT. What is the field 10 cm from the wire?',
              unit: 'μT',
              answer: 10,
              wrong: [{ v: 2, why: r`The field falls off as $1/r$, not $1/r^2$: 5 times farther means $\frac15$ the field.` }, { v: 250, why: 'Farther away, the field is weaker.' }],
              explain: r`$B \propto \frac{1}{r}$: going from 2 cm to 10 cm is 5 times the distance, so $\frac{50}{5} = 10$ μT.`,
            },
          ],
          recap: [
            'Currents produce magnetic fields (Ørsted, 1820).',
            r`Around a straight wire the field forms circles, with $B \propto I/r$ (right-hand rule).`,
            'Coils (solenoids) with iron cores make strong, switchable electromagnets.',
          ],
        },
        {
          id: 'magnetic-force',
          title: 'Magnetic Forces',
          summary: 'Motors and auroras',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Sideways push',
              prompt: 'A charged particle moves through a magnetic field, perpendicular to it. Which way does the magnetic force push it?',
              choices: [
                { t: 'Sideways: perpendicular to both its motion and the field', ok: true },
                { t: 'Along the field lines', why: 'Magnetic forces are never along the field. They push sideways.' },
                { t: 'Straight ahead, speeding it up', why: 'A magnetic force is always perpendicular to the velocity, so it can’t change the speed, only the direction.' },
              ],
              explain: r`The magnetic force on a moving charge is $F = qvB$ (for motion perpendicular to the field), and it points perpendicular to **both** $v$ and $B$. Because it's always sideways, it bends the path without changing the speed.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Circling charges',
              body: r`A constant sideways force produces **circular motion**. Setting $qvB = \frac{mv^2}{r}$ gives the radius:
$$r = \frac{mv}{qB}$$
Change the field strength and the speed.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4, xmax: 4, ymin: -3.5, ymax: 3.5, grid: 1, axes: false, maxWidth: 480,
                animate: { param: 't', speed: 1, autoplay: true },
                params: { B: { min: 1, max: 3, step: 0.25, value: 1, label: '$B$', color: 'violet' }, v: { min: 0.5, max: 3, step: 0.25, value: 2, label: '$v$', color: 'coral' } },
                extra: ({ plot, p, s }) => {
                  const R = p.v / p.B; // m = q = 1
                  const w = p.v / R;
                  const ang = w * p.t;
                  const cx = 0, cy = 0; // centred, so even the widest orbit (r = 3) stays inside the field
                  const els = [];
                  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) els.push(s('circle', { cx: plot.X(i + 0.5), cy: plot.Y(j), r: 2.5, class: 'fl-muted' }));
                  els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: plot.X(R) - plot.X(0), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '6 5', opacity: 0.6 }));
                  const px = cx + R * Math.sin(ang), py = cy + R * Math.cos(ang);
                  els.push(s('circle', { cx: plot.X(px), cy: plot.Y(py), r: 8, class: 'fl-coral' }));
                  return els;
                },
                readout: (p) => r`radius $r = \dfrac{mv}{qB} = ${f2(p.v / p.B)}$ $\quad$ (dots: field pointing out of the screen)`,
              },
              after: r`A stronger field or a slower particle gives a tighter circle. Particle accelerators, mass spectrometers and old TV tubes all steer charges this way.`,
            },
            {
              type: 'mcq',
              title: 'Northern lights',
              prompt: 'Why are auroras seen mostly near the poles?',
              choices: [
                { t: 'Earth’s magnetic field guides charged particles from the Sun down toward the polar regions', ok: true },
                { t: 'It’s colder there', why: 'Temperature has nothing to do with it. Auroras happen about 100 km up, and the key is the shape of Earth’s magnetic field.' },
                { t: 'The poles are closer to the Sun', why: 'The poles aren’t closer to the Sun. The field lines funnel the particles there.' },
              ],
              explain: r`Charged particles from the solar wind spiral along Earth's magnetic field lines, which plunge into the atmosphere near the poles. There the particles hit oxygen and nitrogen atoms and make them glow green and red.`,
            },
            {
              type: 'explain',
              title: 'Forces on wires: motors',
              body: r`A current is moving charge, so a current-carrying wire in a magnetic field feels a force:
$$F = B I L$$
(for a wire of length $L$ perpendicular to the field). In an **electric motor**, a coil sits between magnets. Opposite sides of the coil are pushed in opposite directions, so it spins. A switch called a commutator reverses the current every half turn to keep it spinning the same way.`,
            },
            {
              type: 'numeric',
              title: 'An electron’s circle',
              prompt: r`An electron moving at $10^6$ m/s at right angles to a 1 mT field circles with radius $r = \frac{mv}{qB}$ ($m = 9.11 \times 10^{-31}$ kg, $q = 1.6 \times 10^{-19}$ C). What is the radius, in millimetres? (1 decimal place.)`,
              unit: 'mm',
              answer: 9.11e-31 * 1e6 / (1.6e-19 * 1e-3) * 1000,
              tol: 0.1,
              explain: r`$r = \frac{9.11 \times 10^{-31} \times 10^6}{1.6 \times 10^{-19} \times 10^{-3}} \approx 5.7$ mm. Old TV tubes steered electron beams with fields like this.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Force on a wire',
              prompt: 'A 0.5 m wire carries 4 A at right angles to a 0.2 T magnetic field. What force acts on it?',
              unit: 'N',
              answer: 0.4,
              wrong: [{ v: 10, why: r`Multiply: $F = BIL = 0.2 \times 4 \times 0.5$.` }, { v: 1.6, why: r`$0.2 \times 4 \times 0.5 = 0.4$.` }],
              explain: r`$F = BIL = 0.2 \times 4 \times 0.5 = 0.4$ N.`,
            },
          ],
          recap: [
            r`A moving charge feels $F = qvB$, sideways to both its motion and the field.`,
            r`Charged particles circle in a magnetic field, with radius $r = mv/(qB)$.`,
            r`A current-carrying wire feels $F = BIL$. That's how motors work.`,
          ],
        },
      ],
    },
    {
      title: 'Induction',
      summary: 'Changing magnetism makes electricity.',
      lessons: [
        {
          id: 'faraday',
          title: 'Faraday’s Law',
          summary: 'Electricity from motion',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A still magnet',
              body: r`A coil of wire is connected to a sensitive current meter. A strong magnet sits motionless inside the coil.`,
              prompt: 'Does current flow?',
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes, steadily', why: 'A stationary magnet produces no current. Something has to change.' },
              ],
              explain: r`No current flows while nothing changes. In 1831, Michael Faraday discovered that current flows only while the magnetic field through the coil is **changing**: when the magnet moves in or out.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Push the magnet through',
              body: r`The magnet moves back and forth through the coil. The top graph shows the magnetic **flux** (how much field passes through the coil). The bottom graph shows the induced voltage. Change the speed.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -3.2, ymax: 3.6, grid: false, axes: false, height: 330,
                animate: { param: 't', speed: 1, autoplay: true, max: 10 },
                params: { w: { min: 0.5, max: 3, step: 0.25, value: 1, label: 'speed', color: 'coral' } },
                extra: ({ plot, p, s }) => {
                  const A = 2.5;
                  const xm = (t) => A * Math.sin(p.w * t);
                  const vm = (t) => A * p.w * Math.cos(p.w * t);
                  const emf = (t) => -dflux(xm(t)) * vm(t);
                  const els = [];
                  // coil + magnet strip at top (y in 2.4..3.4), x maps -4..4 -> 1..9
                  const X = (x) => plot.X(5 + x);
                  els.push(s('ellipse', { cx: X(0), cy: plot.Y(2.9), rx: 10, ry: plot.Y(2.3) - plot.Y(2.9), fill: 'none', stroke: 'var(--amber)', 'stroke-width': 4 }));
                  const mx = xm(p.t);
                  els.push(s('rect', { x: X(mx - 0.8), y: plot.Y(3.15), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), class: 'fl-blue' }));
                  els.push(s('rect', { x: X(mx), y: plot.Y(3.15), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(0.5), class: 'fl-coral' }));
                  // traces over the last 10 s: flux (y 0.6..2) and emf (y -3..0.2)
                  const trace = (f, y0, sc, cls) => {
                    const pts = [];
                    for (let i = 0; i <= 200; i++) { const t = (p.t * i) / 200; pts.push(`${i ? 'L' : 'M'}${plot.X(t)} ${plot.Y(y0 + sc * f(t))}`); }
                    return s('path', { d: pts.join(''), fill: 'none', stroke: `var(--${cls})`, 'stroke-width': 2.5 });
                  };
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(10), y1: plot.Y(0.7), y2: plot.Y(0.7), stroke: 'var(--axis)', 'stroke-width': 1 }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(10), y1: plot.Y(-1.4), y2: plot.Y(-1.4), stroke: 'var(--axis)', 'stroke-width': 1 }));
                  els.push(trace((t) => flux(xm(t)), 0.7, 1.2, 'violet'));
                  els.push(trace(emf, -1.4, 0.32, 'teal'));
                  els.push(s('text', { x: plot.X(0.1), y: plot.Y(1.9), class: 'lbl fl-violet', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'flux through coil' }));
                  els.push(s('text', { x: plot.X(0.1), y: plot.Y(-0.2), class: 'lbl fl-teal', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'induced voltage' }));
                  return els;
                },
                readout: (p) => {
                  // peak induced voltage over one cycle (arbitrary units)
                  let peak = 0;
                  for (let i = 0; i <= 400; i++) {
                    const t = (2 * Math.PI * i) / (400 * p.w);
                    peak = Math.max(peak, Math.abs(dflux(2.5 * Math.sin(p.w * t)) * 2.5 * p.w * Math.cos(p.w * t)));
                  }
                  return r`peak voltage $= ${f2(peak)}$ (arbitrary units): it grows in proportion to the speed`;
                },
              },
              after: r`The voltage spikes when the flux is changing fastest, and it's zero for an instant when the magnet turns around (no change). Move faster and you get bigger spikes.`,
            },
            {
              type: 'explain',
              title: 'Faraday’s law',
              body: r`The induced voltage (EMF) in a coil of $N$ turns equals the **rate of change** of magnetic flux $\Phi$ through it:
$$\mathcal{E} = -N\,\frac{\Delta \Phi}{\Delta t}$$
The minus sign is **Lenz's law**: the induced current flows in the direction that **opposes** the change that caused it. Push a magnet's north pole toward a coil, and the coil becomes a north pole too, pushing back.`,
            },
            {
              type: 'mcq',
              title: 'More voltage',
              prompt: 'Which change would NOT increase the induced voltage?',
              choices: [
                { t: 'Holding the magnet still inside the coil', ok: true },
                { t: 'Moving the magnet faster', why: 'That increases the rate of change of flux, which increases the voltage.' },
                { t: 'Using a coil with more turns', why: 'More turns multiply the voltage, by the factor N.' },
                { t: 'Using a stronger magnet', why: 'A stronger magnet means a bigger change in flux, so more voltage.' },
              ],
              explain: r`Only **change** matters. A magnet sitting still, however strong, induces nothing.`,
            },
            {
              type: 'numeric',
              title: 'A coil’s voltage',
              prompt: r`A 100-turn coil sees the magnetic flux through it change by 0.01 Wb in 0.1 s. By Faraday’s law, what average voltage is induced?`,
              unit: 'V',
              answer: 10,
              explain: r`$\mathcal{E} = N\frac{\Delta\Phi}{\Delta t} = 100 \times \frac{0.01}{0.1} = 10$ V. More turns or faster change, more voltage.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The slow magnet',
              body: r`A strong magnet is dropped down a vertical copper pipe. Copper isn't magnetic, yet the magnet falls remarkably slowly.`,
              prompt: 'Why?',
              choices: [
                { t: 'The falling magnet induces currents in the pipe, whose magnetic fields oppose its motion (Lenz’s law)', ok: true },
                { t: 'Copper is secretly magnetic', why: 'Copper isn’t attracted to magnets. The effect needs motion.' },
                { t: 'Air resistance inside the narrow pipe', why: 'A non-magnetic object of the same shape falls through quickly. The effect is electromagnetic.' },
              ],
              explain: r`As the magnet falls, the flux through each ring of the pipe changes, inducing swirling **eddy currents**. By Lenz's law, they create fields that oppose the motion and brake the magnet. Some trains and roller coasters use the same effect for smooth, contact-free braking.`,
            },
            { /*anim:magnetism*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A magnet in a copper pipe',
              body: r`Two 1 m pipes: {ink:plastic} on the left, {amber:copper} on the right. A strong magnet is dropped into each at the same moment (shown in slow motion). In the copper, the falling magnet's changing field drives rings of current round the pipe: {coral:one ring below it} and {blue:one above}, circulating in opposite directions.`,
              widget: {
                kind: 'graph', xmin: -2.1, xmax: 2.1, ymin: -1.15, ymax: 0.12, grid: false, axes: false, height: 400, maxWidth: 380,
                animate: { param: 't', speed: 0.5, max: 4.8, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const t = p.t, yf = Math.min(1, 4.9 * t * t), { y } = pipeDrop(t), els = [], R = (q) => plot.X(q) - plot.X(0);
                  const pipe = (cx, cls, col) => els.push(s('rect', { x: plot.X(cx - 0.17), y: plot.Y(0), width: R(0.34), height: plot.Y(-1) - plot.Y(0), class: cls, stroke: `var(--${col})`, 'stroke-width': 2, opacity: 0.8 }));
                  pipe(-1, 'fl-surface', 'ink-3');
                  pipe(1, 'fl-amber-soft', 'amber');
                  const magnet = (cx, yy) => { els.push(s('rect', { x: plot.X(cx - 0.11), y: plot.Y(-yy + 0.04), width: R(0.22), height: plot.Y(0) - plot.Y(0.04), class: 'fl-coral' })); els.push(s('rect', { x: plot.X(cx - 0.11), y: plot.Y(-yy), width: R(0.22), height: plot.Y(0) - plot.Y(0.04), class: 'fl-blue' })); };
                  if (yf < 1) magnet(-1, Math.min(0.96, yf));
                  if (y < 1) magnet(1, Math.min(0.96, y));
                  if (y < 0.96 && t > 0) for (const [dy, col] of [[-0.09, 'coral'], [0.13, 'blue']]) {
                    if (-y + dy > -0.01) continue; // no ring above the top of the pipe
                    const cy = plot.Y(-y + dy);
                    els.push(s('ellipse', { cx: plot.X(1), cy, rx: R(0.2), ry: 5, fill: 'none', stroke: `var(--${col})`, 'stroke-width': 2.5 }));
                    const dir = col === 'coral' ? 1 : -1, ax = plot.X(1), ay = cy + 5;
                    els.push(s('path', { d: `M${ax - 6 * dir} ${ay - 4}L${ax} ${ay}L${ax - 6 * dir} ${ay + 4}`, fill: 'none', stroke: `var(--${col})`, 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
                  }
                  els.push(s('text', { x: plot.X(-1), y: plot.Y(-1) + 18, 'text-anchor': 'middle', class: 'tick', text: 'plastic' }));
                  els.push(s('text', { x: plot.X(1), y: plot.Y(-1) + 18, 'text-anchor': 'middle', class: 'tick', text: 'copper' }));
                  return els;
                },
                readout: (p) => { const t = p.t, d = pipeDrop(t); return `${fix(t, 2)} s · plastic: ${t < 0.452 ? `falling at ${fix(9.8 * t, 2)} m/s` : 'out after 0.45 s'} · copper: ${d.y >= 1 ? 'out after 4.03 s' : `falling at ${fix(d.v, 2)} m/s`}`; },
              },
              after: r`In the plastic pipe the magnet is in free fall and is out in under half a second. In the copper, the current rings act as electromagnets that oppose the change (Lenz's law): the ring below pushes the magnet up, the ring above pulls it back up. Within a tenth of a second the drag balances gravity, and the magnet drifts down at a steady crawl (here 0.25 m/s, typical for a strong magnet in thick copper). The energy goes into warming the pipe. Magnetic brakes on trains and roller coasters work the same way.`,
            },
          ],
          recap: [
            'A changing magnetic flux induces a voltage (Faraday, 1831).',
            r`$\mathcal{E} = -N\,\Delta\Phi/\Delta t$: faster changes and more turns give more voltage.`,
            'Lenz’s law: induced currents oppose the change that made them.',
          ],
        },
        {
          id: 'generators',
          title: 'Generators & Transformers',
          summary: 'Powering the world',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Where electricity comes from',
              prompt: 'Coal, gas, nuclear, hydro and wind power stations all ultimately make electricity the same way. How?',
              choices: [
                { t: 'They spin coils and magnets past each other in generators', ok: true },
                { t: 'Chemical reactions, like in a battery', why: 'Batteries work that way, but power stations use generators: spinning magnets and coils.' },
                { t: 'They capture lightning', why: 'Most power stations spin a turbine connected to a generator.' },
              ],
              explain: r`Almost all of the world's electricity comes from **generators**: a turbine (pushed by steam, water or wind) spins a coil in a magnetic field, or a magnet inside coils. Faraday's law does the rest. (Solar panels are the main exception.)`,
            },
            {
              type: 'explain',
              title: 'Alternating current',
              body: r`As a coil spins at a steady rate in a magnetic field, the flux through it rises and falls like a cosine wave, so the induced voltage is a **sine wave**. The current flows one way, then the other: **alternating current** (AC).

Mains electricity alternates 50 times a second (50 Hz) in most of the world, and 60 Hz in North America.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2, ymin: -1.3, ymax: 1.3, grid: 0.25, gridY: 0.5, height: 240, axes: { xticksBelow: true, xlabelBelow: 'edge', xlabel: 'turns', ylabel: '' },
                curves: [{ f: (t) => Math.cos(2 * Math.PI * t), color: 'violet', width: 2 }, { f: (t) => Math.sin(2 * Math.PI * t), color: 'teal' }],
                readout: () => r`$\violet{\text{flux}} \propto \cos(\omega t)$, $\quad \teal{\text{voltage}} \propto \sin(\omega t)$`,
              },
            },
            {
              type: 'explain',
              title: 'Transformers',
              body: r`A **transformer** has two coils wound on one iron core. AC in the first coil makes a changing field, which induces a voltage in the second. The voltages are in the ratio of the numbers of turns:
$$\frac{V_s}{V_p} = \frac{N_s}{N_p}$$
More turns on the secondary coil steps the voltage **up**. Fewer steps it **down**. (Transformers only work with AC, because a steady current makes no changing flux.)`,
            },
            {
              type: 'numeric',
              title: 'Phone charger',
              prompt: 'A charger’s transformer steps 230 V mains down to 5 V. If the primary coil has 920 turns, how many turns does the secondary have?',
              unit: 'turns',
              answer: 20,
              wrong: [{ v: 42320, why: 'Stepping down needs *fewer* turns on the secondary coil.' }, { v: 46, why: r`$N_s = N_p \times \frac{V_s}{V_p} = 920 \times \frac{5}{230}$.` }],
              explain: r`$N_s = 920 \times \frac{5}{230} = 920 \times \frac{1}{46} = 20$ turns.`,
            },
            {
              type: 'numeric',
              title: 'Mains frequency',
              prompt: r`A simple two-pole generator produces one cycle of AC per revolution. How fast must it spin to make 50 Hz, in revolutions per minute?`,
              unit: 'rpm',
              answer: 3000,
              explain: r`50 revolutions per second $= 3{,}000$ rpm. That’s why big power-station turbines spin at exactly 3,000 rpm in Europe (3,600 rpm in 60 Hz countries).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Power is conserved',
              prompt: 'An ideal transformer steps 11,000 V up to 400,000 V for a power line. If the primary current is 3,600 A, what is the secondary current?',
              unit: 'A',
              answer: (11000 * 3600) / 400000,
              tol: 0.5,
              wrong: [{ v: 130909, tol: 5, why: 'Stepping up the voltage steps *down* the current, so that power (V × I) stays the same.' }, { v: 3600, why: r`Power is conserved: $V_pI_p = V_sI_s$.` }],
              explain: r`An ideal transformer conserves power: $V_pI_p = V_sI_s$, so $I_s = \frac{11{,}000 \times 3600}{400{,}000} = 99$ A. That's why stepping up the voltage cuts transmission losses ($I^2R$), just as you saw in the Electricity course.`,
            },
          ],
          recap: [
            'Generators spin coils in magnetic fields, producing alternating current (AC).',
            r`Transformers: $V_s/V_p = N_s/N_p$. They only work with AC.`,
            'An ideal transformer conserves power: stepping the voltage up steps the current down.',
          ],
        },
      ],
    },
    {
      title: 'Using Magnetism',
      summary: 'Steering particles, and the materials that make magnets.',
      lessons: [
        {
          id: 'steering',
          title: 'Steering Charged Particles',
          summary: 'Velocity selectors, spectrometers, cyclotrons',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Light or heavy?',
              prompt: 'An electron and a proton enter the same magnetic field at the same speed, at right angles to it. Their charges are equal in size. Which one moves in the smaller circle?',
              choices: [
                { t: 'The electron, because it is about 1800 times lighter', ok: true },
                { t: 'The proton, because it is heavier', why: r`A heavier particle is harder to turn: $r = \frac{mv}{qB}$ grows with mass.` },
                { t: 'They circle with the same radius', why: r`Same charge and speed, but $r = \frac{mv}{qB}$ depends on the mass too.` },
              ],
              explain: r`$r = \frac{mv}{qB}$, so with everything else equal the radius is proportional to mass: the electron's circle is about 1800 times smaller (and it curls the opposite way, having the opposite charge). Sorting particles by how sharply they bend is the basis of every machine in this lesson.`,
            },
            {
              type: 'explain',
              title: 'The velocity selector',
              body: r`Cross an electric field $E$ (pushing a positive ion up, say) with a magnetic field $B$ (pushing it down with force $qvB$). The electric force is the same for every ion, but the magnetic force grows with speed. Only ions whose two forces balance fly straight:
$$qE = qvB \quad \Longrightarrow \quad v = \frac{E}{B}.$$
Faster ions are bent one way, slower ones the other. Put a slit at the end, and out comes a beam of ions all with the same speed.`,
            },
            {
              type: 'interactive',
              title: 'Pick the speed',
              body: r`Ions travel at $2 \times 10^5$ m/s through a magnetic field of $0.1$ T. Adjust the electric field so they go straight through the slit.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -3, ymax: 3, grid: false, height: 240, axes: false,
                params: { E: { min: 5, max: 40, step: 0.5, value: 12, label: 'electric field', color: 'blue', format: (v) => `${fix(v, 1)} kV/m` } },
                curves: [{ f: (x, p) => { const k = 0.012 * (p.E - 20), y = x <= 8 ? k * x * x : k * 64 + 16 * k * (x - 8); return Math.abs(y) > 2.6 ? NaN : y; }, from: 0, to: 9.5, color: 'coral', width: 3, n: 400 }],
                under: ({ plot, s }) => [s('rect', { x: plot.X(1), y: plot.Y(2.6), width: plot.X(8) - plot.X(1), height: plot.Y(-2.6) - plot.Y(2.6), class: 'fl-blue-soft', opacity: 0.5 })],
                extra: ({ plot, p, s }) => [
                  s('line', { x1: plot.X(9.5), x2: plot.X(9.5), y1: plot.Y(3), y2: plot.Y(0.25), stroke: 'var(--ink)', 'stroke-width': 6 }),
                  s('line', { x1: plot.X(9.5), x2: plot.X(9.5), y1: plot.Y(-0.25), y2: plot.Y(-3), stroke: 'var(--ink)', 'stroke-width': 6 }),
                  s('text', { x: plot.X(4.5), y: plot.Y(2.15), class: 'tick', 'text-anchor': 'middle', text: 'crossed E and B fields' }),
                  s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-coral' }),
                ],
                readout: (p) => { const v = (p.E * 1000) / 0.1; return Math.abs(p.E - 20) < 0.3 ? 'Forces balance: the beam passes **straight through** the slit.' : `Ions at $${(v / 1e5).toFixed(2)} \\times 10^5$ m/s would go straight; these are bent ${p.E > 20 ? 'up' : 'down'}.`; },
                goal: (p) => Math.abs(p.E - 20) < 0.3,
                hint: r`Balance needs $E = vB$.`,
                solution: { E: 20 },
              },
              explain: r`$E = vB = (2 \times 10^5)(0.1) = 2 \times 10^4$ V/m $= 20$ kV/m. Notice the answer doesn't depend on the ion's charge or mass: the selector sorts by speed alone. (The bending of the beam in the picture is exaggerated.)`,
            },
            {
              type: 'numeric',
              title: 'Weighing an atom',
              body: r`In a **mass spectrometer**, ions of known speed enter a magnetic field and bend in a semicircle of radius $r = \frac{mv}{qB}$, landing at a distance that reveals their mass.`,
              prompt: r`A carbon-12 ion (mass $1.99 \times 10^{-26}$ kg, charge $1.6 \times 10^{-19}$ C) enters a 0.5 T field at $10^5$ m/s. What is the radius of its path, in cm? (2 decimal places.)`,
              unit: 'cm',
              answer: (1.99e-26 * 1e5) / (1.6e-19 * 0.5) * 100,
              tol: 0.02,
              wrong: [{ v: (1.99e-26 * 1e5) / (1.6e-19 * 0.5), tol: 0.0002, why: 'That’s in metres. Multiply by 100 for centimetres.' }, { v: (1.99e-26 * 1e5) / (1.6e-19 * 0.5) * 50, tol: 0.02, why: r`Divide by $qB = 0.8 \times 10^{-19}$, not $1.6 \times 10^{-19}$ alone.` }],
              hint: r`$r = \frac{(1.99 \times 10^{-26})(10^5)}{(1.6 \times 10^{-19})(0.5)}$.`,
              explain: r`$r = \frac{1.99 \times 10^{-21}}{0.8 \times 10^{-19}} \approx 0.0249$ m $= 2.49$ cm. Heavier ions swing wider. Mass spectrometers identify molecules in drug tests, date ancient objects by measuring isotopes, and analyse the air on Mars.`,
            },
            {
              type: 'numeric',
              title: 'Separating isotopes',
              prompt: r`Carbon-14 is $\frac{14}{12}$ times as heavy as carbon-12. In the same spectrometer, each ion lands one **diameter** ($2r$) from where it entered. How far apart do the two isotopes land, in cm? (2 decimal places.)`,
              unit: 'cm',
              answer: 2 * 2.4876 * (14 / 12 - 1),
              tol: 0.02,
              wrong: [{ v: 2.4876 * (14 / 12 - 1), tol: 0.02, why: 'That’s the difference in radius. The landing spots are a diameter from the entrance, so double it.' }],
              hint: r`Carbon-14's radius is $2.49 \times \frac{14}{12} \approx 2.90$ cm.`,
              explain: r`$r_{14} \approx 2.90$ cm, so the landing spots are $2(2.90 - 2.49) \approx 0.83$ cm apart: easily separated. Radiocarbon dating today counts carbon-14 atoms directly this way (accelerator mass spectrometry), needing only milligrams of a sample.`,
            },
            {
              type: 'explain',
              title: 'The cyclotron',
              body: r`The time for one circle is $T = \frac{2\pi r}{v} = \frac{2\pi m}{qB}$: the speed cancels! Faster particles move in bigger circles but take the same time per lap.

In 1932 Ernest Lawrence used this to build the **cyclotron**: particles circle in a magnetic field between two D-shaped electrodes, and an alternating voltage gives them a kick every half lap, perfectly in step because the lap time never changes. They spiral outwards, gaining energy each turn. Cyclotrons in hospitals make radioactive isotopes for PET scans and beams for cancer therapy.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Cyclotron frequency',
              prompt: r`What is the cyclotron frequency $f = \frac{qB}{2\pi m}$ of a proton (charge $1.6 \times 10^{-19}$ C, mass $1.67 \times 10^{-27}$ kg) in a 1 T field, in MHz? (1 decimal place.)`,
              unit: 'MHz',
              answer: (1.6e-19 * 1) / (2 * Math.PI * 1.67e-27) / 1e6,
              tol: 0.1,
              wrong: [{ v: (1.6e-19 * 1) / (1.67e-27) / 1e6, tol: 0.5, why: r`Don't forget the $2\pi$: that's the angular frequency in rad/s.` }],
              explain: r`$f = \frac{1.6 \times 10^{-19}}{2\pi \times 1.67 \times 10^{-27}} \approx 15.2$ MHz, a radio frequency. The same physics, with electrons, underlies the magnetron in a microwave oven and the precise frequencies measured by MRI scanners (which use the related precession of protons).`,
            },
          ],
          recap: [
            r`A magnetic force turns charges without changing their speed: circles of radius $r = mv/qB$.`,
            r`Crossed fields select one speed, $v = E/B$; spectrometers then sort by mass.`,
            r`The lap time $2\pi m/qB$ doesn't depend on speed, which makes the cyclotron work.`,
          ],
        },
        {
          id: 'materials',
          title: 'Magnetic Materials',
          summary: 'Domains, Curie points and hysteresis',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Paperclip but not foil',
              prompt: 'A fridge magnet picks up a steel paperclip but not a piece of aluminium foil. Why?',
              choices: [
                { t: 'Iron is ferromagnetic: its atoms’ tiny magnets line up together; aluminium’s barely respond', ok: true },
                { t: 'The foil is too light', why: 'The foil is lighter than the paperclip, yet it isn’t attracted at all. It’s about the material.' },
                { t: 'Aluminium repels magnets strongly', why: 'Aluminium responds only extremely weakly to a steady magnet.' },
              ],
              explain: r`Every atom with unpaired electrons is a tiny magnet. In most materials these point randomly and respond only weakly to a magnet. In **ferromagnetic** metals (iron, nickel, cobalt and some alloys), neighbouring atomic magnets lock together in step, so a whole region can be magnetised at once.`,
            },
            {
              type: 'explain',
              title: 'Domains',
              body: r`A lump of iron is divided into tiny regions called **domains**, each fully magnetised but pointing in its own direction. In an unmagnetised nail, the domains point every which way and their fields cancel.

Bring a magnet near and the domains that happen to point along its field grow at the expense of the others, so the nail becomes a magnet itself and is attracted. In "soft" iron the domains relax back when the magnet leaves; in "hard" magnetic steel, many stay aligned, leaving a permanent magnet.`,
            },
            {
              type: 'mcq',
              title: 'Too hot',
              prompt: r`A magnet is heated above its **Curie temperature** (770 °C for iron), then cooled again with no other magnet nearby. What happens?`,
              choices: [
                { t: 'It loses its magnetism: heat scrambles the atomic magnets and the alignment is lost', ok: true },
                { t: 'It becomes a stronger magnet', why: 'Heat jostles the atoms out of alignment. Above the Curie point, the domains vanish entirely.' },
                { t: 'Nothing: magnetism isn’t affected by temperature', why: 'Strongly affected: above the Curie point, iron is no longer ferromagnetic.' },
              ],
              explain: r`Above its Curie temperature (Pierre Curie, 1895), thermal jiggling beats the force aligning neighbouring atoms, and the material stops being ferromagnetic. Cooled again without a field, it forms new randomly oriented domains: an unmagnetised lump. Volcanic rocks that cool in Earth's field, by contrast, lock in its direction, recording ancient reversals of Earth's magnetic poles.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hysteresis',
              body: r`Drive a material with a field $H$ that goes up to a maximum and back down again, and plot its magnetisation $M$. The curve going up differs from the curve coming down: the material "remembers" where it's been. This loop is a **hysteresis loop**. Change the material's **coercivity**, the reverse field needed to demagnetise it.`,
              widget: {
                kind: 'graph', xmin: -2.4, xmax: 2.4, ymin: -1.3, ymax: 1.3, grid: false, height: 300, axes: { xlabel: 'applied field H', ylabel: 'magnetisation M', xticks: 1, yticks: 1 },
                params: { hc: { min: 0.05, max: 1.5, step: 0.05, value: 0.5, label: 'coercivity', color: 'violet', format: (v) => (v < 0.3 ? `${v.toFixed(2)} (soft)` : v > 0.9 ? `${v.toFixed(2)} (hard)` : v.toFixed(2)) } },
                curves: [
                  { f: (H, p) => mUp(H, p.hc), color: 'blue', width: 3 },
                  { f: (H, p) => mDown(H, p.hc), color: 'coral', width: 3 },
                ],
                extra: ({ plot, p, s }) => [
                  s('circle', { cx: plot.X(0), cy: plot.Y(mDown(0, p.hc)), r: 6, class: 'fl-ink' }),
                  s('circle', { cx: plot.X(-p.hc), cy: plot.Y(0), r: 6, class: 'fl-amber' }),
                ],
                readout: (p) => `Remaining magnetisation at zero field (black dot): **${mDown(0, p.hc).toFixed(2)}** · field needed to demagnetise (amber dot): **${p.hc.toFixed(2)}**`,
              },
              after: r`Coming down (coral) from a strong field, the material keeps much of its magnetisation even at zero field: that's a permanent magnet. Only a reverse field equal to the coercivity wipes it out. Going up (blue) the same happens in reverse. A wide loop means a hard magnet; a narrow loop, a soft one.`,
            },
            {
              type: 'mcq',
              title: 'Choose the core',
              prompt: 'A transformer’s iron core is magnetised back and forth 50 times every second. Should it be made of a magnetically soft or hard material?',
              choices: [
                { t: 'Soft (a narrow loop): little energy is wasted flipping it each cycle', ok: true },
                { t: 'Hard (a wide loop), so it stays magnetised', why: 'Staying magnetised is useless here: the core must flip 50 times a second, and each flip of a wide loop wastes energy as heat.' },
                { t: 'It doesn’t matter', why: 'The energy lost per cycle equals the loop’s area, so it matters a lot.' },
              ],
              explain: r`The area of the hysteresis loop is the energy turned into heat in each cycle. Transformer cores use soft silicon steel with a narrow loop (and thin insulated layers to block eddy currents). Permanent magnets, like the neodymium magnets in motors and headphones, want the opposite: as wide a loop as possible.`,
            },
            {
              type: 'numeric',
              title: 'Warm transformers',
              prompt: r`A transformer core loses 0.3 J to hysteresis in each magnetic cycle. At 50 cycles per second, what power is wasted as heat, in watts?`,
              unit: 'W',
              answer: 15,
              wrong: [{ v: 0.006, tol: 0.001, why: 'Multiply, don’t divide: 50 cycles each second, 0.3 J each.' }, { v: 0.3, why: 'That’s the energy per cycle. There are 50 cycles every second.' }],
              explain: r`$50 \times 0.3 = 15$ J per second $= 15$ W, flowing continuously, day and night, which is why transformers hum and feel warm. Across the millions of transformers in a power grid, core losses add up to a great deal of energy, so core materials matter.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Storing bits',
              prompt: r`A computer hard disk stores each bit as a tiny region magnetised one way or the other. Should the disk's coating have high or low coercivity?`,
              choices: [
                { t: 'High: stray fields mustn’t flip the bits, but a strong, focused write head can', ok: true },
                { t: 'Low, so bits are easy to write', why: 'Easy to write also means easy to erase by accident: stray fields or heat would scramble the data.' },
                { t: 'Zero coercivity', why: 'Then nothing would stay magnetised at all, and the data would vanish instantly.' },
              ],
              explain: r`Data must survive for years, so the bits need a wide hysteresis loop: high coercivity. The write head produces an intense, tightly focused field over a region just tens of nanometres across. Newer drives even heat each bit with a laser while writing, briefly lowering its coercivity (heat-assisted magnetic recording), then letting it cool into a stubborn state.`,
            },
          ],
          recap: [
            'Ferromagnets contain domains; a field grows the aligned ones, magnetising the material.',
            'Above the Curie temperature, ferromagnetism disappears.',
            'Hysteresis: soft materials (narrow loops) for cores, hard materials (wide loops) for permanent magnets and data storage.',
          ],
        },
      ],
    },
  ],
};
