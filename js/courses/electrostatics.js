const r = String.raw;
const K = 8.99e9;

// field lines for two point charges at (cx ± a, cy) with charges q1, q2 (signs/magnitudes)
function drawField(s, plot, q1, q2) {
  const W = 600, H = 320, cx = 300, cy = 160, a = 90;
  const charges = [[cx - a, cy, q1], [cx + a, cy, q2]];
  const field = (x, y) => {
    let fx = 0, fy = 0;
    for (const [px, py, q] of charges) {
      const dx = x - px, dy = y - py, d3 = Math.hypot(dx, dy) ** 3 || 1;
      fx += (q * dx) / d3; fy += (q * dy) / d3;
    }
    return [fx, fy];
  };
  const els = [];
  for (const [px, py, q] of charges) {
    if (q === 0) continue;
    const n = Math.round(8 * Math.abs(q));
    for (let i = 0; i < n; i++) {
      const ang = (2 * Math.PI * (i + 0.5)) / n;
      let x = px + 10 * Math.cos(ang), y = py + 10 * Math.sin(ang);
      const dir = q > 0 ? 1 : -1; // trace outward from + (along E), inward from − (against E)
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      let mid = null;
      for (let k = 0; k < 700; k++) {
        const [fx, fy] = field(x, y);
        const m = Math.hypot(fx, fy) || 1;
        x += dir * (fx / m) * 2.5; y += dir * (fy / m) * 2.5;
        if (k % 3 === 0) d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
        if (k === 40) mid = [x, y, (dir * fx) / m, (dir * fy) / m];
        if (charges.some(([qx, qy, qq]) => qq !== 0 && (qx !== px || qy !== py) && Math.hypot(x - qx, y - qy) < 10)) break;
        if (x < -40 || x > W + 40 || y < -40 || y > H + 40) break;
      }
      // when both charges trace, opposite-sign lines get drawn twice: only trace from the positive one then
      if (q < 0 && charges.some(([, , qq]) => qq > 0)) continue;
      els.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 1.8, opacity: 0.7 }));
      if (mid) {
        const [mx, my, ux, uy] = mid;
        const sgnU = q > 0 ? 1 : -1;
        const tx = ux * sgnU, ty = uy * sgnU; // arrow points along E
        els.push(s('path', { d: `M${mx + tx * 6} ${my + ty * 6} L${mx - tx * 4 - ty * 4} ${my - ty * 4 + tx * 4} L${mx - tx * 4 + ty * 4} ${my - ty * 4 - tx * 4} Z`, class: 'fl-violet' }));
      }
    }
  }
  for (const [px, py, q] of charges) {
    if (q === 0) continue;
    els.push(s('circle', { cx: px, cy: py, r: 16, class: q > 0 ? 'fl-coral' : 'fl-blue' }));
    els.push(s('text', { x: px, y: py + 7, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800;font-size:20px', text: q > 0 ? '+' : '−' }));
  }
  return els;
}

// field along a line from +1 at x = 0 and +4 at x = 3 (arbitrary units, positive = to the right)
const lineField = (x) => 1 / (x * x) * Math.sign(x) - 9 / ((3 - x) ** 2) * Math.sign(3 - x);
// Millikan: drop of mass M carrying 3e, plates 1 cm apart
const QE = 1.6e-19, MDROP = (3 * QE * 500) / (9.8 * 0.01);
const dropAccel = (V) => 9.8 - (3 * QE * V) / (MDROP * 0.01);

export default {
  id: 'electrostatics',
  subject: 'physics',
  title: 'Electric Charge & Fields',
  level: 'Intermediate',
  cover: 'electrostatics',
  tagline: 'Static, Coulomb’s law, field lines, voltage, superposition and Millikan’s oil drop.',
  description: r`Rub a balloon on your hair and you're doing electrostatics. Learn how charges push and pull, how strong those forces are (Coulomb's law), how to picture them with electric field lines, what voltage really means, how fields from many charges combine, and how Millikan measured the charge of a single electron.`,
  prereq: 'Forces & Newton’s Laws',
  chapters: [
    {
      title: 'Charge and Force',
      summary: 'Attraction, repulsion and Coulomb’s law.',
      lessons: [
        {
          id: 'charge',
          title: 'Static Electricity',
          summary: 'Plus, minus, attract, repel',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Balloon and hair',
              body: r`You rub a balloon on your hair. Afterwards, your hair stands up and reaches toward the balloon.`,
              prompt: 'What happened?',
              choices: [
                { t: 'Electrons moved from your hair to the balloon, leaving opposite charges that attract', ok: true },
                { t: 'The balloon created new charge', why: 'Charge is never created or destroyed. Rubbing just moves electrons from one object to the other.' },
                { t: 'The balloon became magnetic', why: 'It’s electric charge, not magnetism. A magnet wouldn’t lift hair.' },
              ],
              explain: r`Rubbing transfers electrons: the balloon gains a negative charge and your hair is left positive. **Opposite charges attract**, so your hair reaches for the balloon. Each hair also repels the others (like charges repel), which is why they stand apart.`,
            },
            {
              type: 'explain',
              title: 'Charge',
              body: r`- Charge comes in two kinds: **positive** (protons) and **negative** (electrons).
- **Like charges repel, opposite charges attract.**
- Charge is **conserved**: it's never created or destroyed, only moved around.
- Charge is measured in coulombs (C). An electron carries $-1.6 \times 10^{-19}$ C.

Objects become charged by gaining or losing electrons. Protons are locked inside nuclei and don't move around.`,
            },
            {
              type: 'mcq',
              title: 'Neutral attraction',
              prompt: 'A charged balloon also sticks to a neutral wall. How can a charged object attract a neutral one?',
              choices: [
                { t: 'It pulls the wall’s charges slightly apart, leaving the opposite charge closer, which attracts more than the far charge repels', ok: true },
                { t: 'The wall secretly has a charge', why: 'The wall can be perfectly neutral overall. Its charges just rearrange a little.' },
                { t: 'Air pressure holds it', why: 'Air pressure acts equally on both sides of the balloon. The attraction is electrical.' },
              ],
              explain: r`The negative balloon pushes electrons in the wall's molecules slightly away, leaving their positive sides a bit closer. Since electric force weakens with distance, the nearby positive charges attract more strongly than the farther negative ones repel. This is called **polarization**.`,
            },
            {
              type: 'mcq',
              title: 'Sparks',
              prompt: 'After shuffling across a carpet, you touch a metal doorknob and feel a small spark. What is the spark?',
              choices: [
                { t: 'Excess electrons jumping between you and the knob through the air', ok: true },
                { t: 'Heat from friction', why: 'The spark is a sudden flow of charge, an electric current through the air.' },
                { t: 'Light from the metal', why: 'The light comes from the air being heated and ionized by the jumping charge.' },
              ],
              explain: r`You built up a charge by rubbing on the carpet. As your hand nears the metal, the electric field becomes strong enough to tear electrons off air molecules, and charge leaps across in a tiny lightning bolt. Static shocks can involve thousands of volts, but so little charge that they're harmless.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Why neutral things are attracted',
              body: r`A positive rod pulls the electrons in a neutral ball towards its near side, leaving the far side positive. The near charges are pulled, the far charges pushed. Move the ball and compare.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 4.4, ymin: -1.7, ymax: 1.2, grid: false, axes: false, maxWidth: 520,
                params: { d: { min: 0.3, max: 3, step: 0.05, value: 1, label: 'gap', color: 'blue', format: (v) => `${v.toFixed(2)}` } },
                extra: ({ plot, p, s, arrow }) => { const c = p.d + 0.6, pull = 1 / (c - 0.35) ** 2, push = 1 / (c + 0.35) ** 2, k = 3, len = (f) => Math.min(2.2, k * f); const out = [s('rect', { x: plot.X(-1.4), y: plot.Y(0.5), width: plot.X(0) - plot.X(-1.4), height: plot.Y(-0.5) - plot.Y(0.5), rx: 8, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 }), s('circle', { cx: plot.X(c), cy: plot.Y(0), r: plot.X(0.6) - plot.X(0), class: 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 })]; for (const x of [-1.1, -0.7, -0.3]) out.push(s('text', { x: plot.X(x), y: plot.Y(0) + 7, 'text-anchor': 'middle', style: 'font-size:22px;font-weight:700', fill: 'var(--coral)', text: '+' })); for (const y of [0.25, -0.25]) out.push(s('text', { x: plot.X(c - 0.35), y: plot.Y(y) + 6, 'text-anchor': 'middle', style: 'font-size:20px;font-weight:700', fill: 'var(--blue)', text: '−' }), s('text', { x: plot.X(c + 0.35), y: plot.Y(y) + 6, 'text-anchor': 'middle', style: 'font-size:20px;font-weight:700', fill: 'var(--coral)', text: '+' })); out.push(arrow(plot.X(c), plot.Y(-0.95), plot.X(c - len(pull)), plot.Y(-0.95), { color: 'var(--blue)', width: 3 }), arrow(plot.X(c), plot.Y(-1.25), plot.X(c + len(push)), plot.Y(-1.25), { color: 'var(--coral)', width: 3 })); return out; },
                readout: (p) => { const c = p.d + 0.6, pull = 100 / (c - 0.35) ** 2, push = 100 / (c + 0.35) ** 2; return `pull on near side ${pull.toFixed(1)} · push on far side ${push.toFixed(1)} · net **attraction ${(pull - push).toFixed(1)}**`; },
              },
              after: r`The near side is always closer, so the pull always beats the push and the ball is attracted, whatever the sign of the rod. The net force fades fast with distance (roughly as $1/d^3$ far away), which is why a charged balloon only grabs bits of paper from close up.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Counting electrons',
              prompt: r`A rubbed balloon might carry a charge of $-1\ \mu$C ($10^{-6}$ C). Each electron carries $1.6 \times 10^{-19}$ C. How many extra electrons is that? (In units of $10^{12}$, 1 decimal place.)`,
              unit: '$\\times 10^{12}$',
              answer: 1e-6 / 1.602e-19 / 1e12,
              tol: 0.06,
              explain: r`$\frac{10^{-6}}{1.6 \times 10^{-19}} \approx 6.2 \times 10^{12}$ electrons: trillions, yet a vanishingly small fraction of the balloon’s roughly $10^{24}$ electrons. Static charges are tiny imbalances.`,
            },
          ],
          recap: [
            'Like charges repel, opposite charges attract.',
            'Charge is conserved. Objects charge up by gaining or losing electrons.',
            'Charged objects can attract neutral ones by polarizing them.',
          ],
        },
        {
          id: 'coulomb',
          title: 'Coulomb’s Law',
          summary: 'How strong the force is',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Coulomb’s law',
              body: r`The force between two point charges $q_1$ and $q_2$, a distance $r$ apart, is
$$F = k\,\frac{q_1 q_2}{r^2}, \qquad k \approx 9 \times 10^9\ \text{N·m}^2/\text{C}^2$$
It has the same inverse-square form as gravity, but it can repel as well as attract, and it's vastly stronger.`,
            },
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Halve the distance',
              prompt: 'Two charges are moved to half their original distance apart. What happens to the force between them?',
              cols: 2,
              choices: [
                { t: 'It becomes 4 times stronger', ok: true },
                { t: 'It doubles', why: r`It's inverse-**square**: $\frac{1}{(1/2)^2} = 4$.` },
                { t: 'It halves', why: 'Closer charges push or pull harder, not weaker.' },
              ],
              explain: r`$F \propto 1/r^2$: halving $r$ makes the force $2^2 = 4$ times bigger.`,
            },
            {
              type: 'numeric',
              title: 'Compute a force',
              prompt: r`Two charges of $+2\ \mu\text{C}$ ($2 \times 10^{-6}$ C) each are 0.3 m apart. What is the force between them? ($k = 9 \times 10^9$)`,
              unit: 'N',
              answer: (9e9 * 2e-6 * 2e-6) / 0.09,
              tol: 0.01,
              wrong: [{ v: (9e9 * 4e-12) / 0.3, tol: 0.01, why: 'Square the distance: r² = 0.09.' }],
              explain: r`$F = \frac{9 \times 10^9 \times (2 \times 10^{-6})^2}{0.3^2} = \frac{0.036}{0.09} = 0.4$ N, a repulsive force, since both charges are positive.`,
            },
            {
              type: 'numeric',
              title: 'Inside hydrogen',
              prompt: r`In a hydrogen atom the electron is about $5.3 \times 10^{-11}$ m from the proton. What is the Coulomb force between them, $\frac{ke^2}{r^2}$, with $k = 9.0 \times 10^9$ and $e = 1.6 \times 10^{-19}$ C? (In units of $10^{-8}$ N, 1 decimal place.)`,
              unit: '$\\times 10^{-8}$ N',
              answer: 8.988e9 * (1.602e-19) ** 2 / (0.053e-9) ** 2 / 1e-8,
              tol: 0.06,
              wrong: [{ v: 2.7e-18, relTol: 0.5, why: r`Square the distance in the denominator.` }],
              explain: r`About $8.2 \times 10^{-8}$ N. Tiny in everyday terms, but acting on an electron of mass $9.1 \times 10^{-31}$ kg it gives an acceleration of about $10^{23}$ m/s².`,
            },
            {
              type: 'interactive',
              title: 'The balance point',
              body: r`A charge $+q$ sits at 0 m and a charge $+4q$ at 3 m. A small positive test charge between them is pushed away from both. Find the point where the two pushes **cancel**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3.4, ymin: -12, ymax: 12, grid: false, height: 280, axes: { xlabel: 'x (m)', ylabel: 'net force (→ positive)', xticks: 0.5, yticks: 4, xfmt: (v) => (v === 0 || v === 3 || v > 3 ? '' : String(v)) },
                params: { x: { min: 0.2, max: 2.8, step: 0.01, value: 2, label: 'test charge at', color: 'violet', format: (v) => `${v.toFixed(2)} m` } },
                curves: [{ f: (x) => 1 / (x * x) - 4 / ((3 - x) * (3 - x)), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.x, y: (p) => 1 / (p.x * p.x) - 4 / ((3 - p.x) * (3 - p.x)), color: 'coral' }],
                extra: ({ plot, s }) => [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 9, class: 'fl-coral' }), s('circle', { cx: plot.X(3), cy: plot.Y(0), r: 14, class: 'fl-coral' }), s('text', { x: plot.X(0) + 14, y: plot.Y(0) - 12, class: 'lbl halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: '+q at 0 m' }), s('text', { x: plot.X(3) - 18, y: plot.Y(0) - 14, 'text-anchor': 'end', class: 'lbl halo-text', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: '+4q at 3 m' })],
                readout: (p) => `push from +q: ${(1 / p.x ** 2).toFixed(2)} · push from +4q: ${(4 / (3 - p.x) ** 2).toFixed(2)} · net **${(1 / p.x ** 2 - 4 / (3 - p.x) ** 2).toFixed(2)}**`,
                goal: (p) => Math.abs(p.x - 1) < 0.015,
                hint: 'The +4q charge is 4 times stronger, so it must be 2 times farther away.',
                solution: { x: 1 },
              },
              explain: r`At **1 m**: $\frac{1}{1^2} = \frac{4}{2^2}$. Force falls with the square of distance, so a charge four times as strong balances at twice the distance. (The balance is unstable along the line: nudge the test charge and it is pushed further towards the weaker side.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Electric vs. gravity',
              body: r`In a hydrogen atom, the electron and proton are about $5.3 \times 10^{-11}$ m apart. The electric attraction between them is about $8.2 \times 10^{-8}$ N, and their gravitational attraction is about $3.6 \times 10^{-47}$ N.`,
              prompt: r`How many times stronger is the electric force? Give the power of 10 (rounded to a whole number).`,
              lhs: r`$10^{?}$, $\; ? =$`,
              answer: 39,
              tol: 0.5,
              wrong: [{ v: 47, why: r`Divide: $\frac{8.2 \times 10^{-8}}{3.6 \times 10^{-47}} \approx 2.3 \times 10^{39}$.` }],
              explain: r`$\frac{8.2 \times 10^{-8}}{3.6 \times 10^{-47}} \approx 2 \times 10^{39}$. Gravity only dominates on large scales because big objects are almost perfectly electrically neutral, so the huge electric forces cancel out.`,
            },
          ],
          recap: [
            r`Coulomb's law: $F = kq_1q_2/r^2$, with $k \approx 9 \times 10^9$ N·m²/C².`,
            'It’s inverse-square like gravity, but about 10³⁹ times stronger between a proton and an electron.',
            'Matter is almost perfectly neutral, which is why gravity rules the cosmos.',
          ],
        },
      ],
    },
    {
      title: 'Fields and Voltage',
      summary: 'Picturing forces in space.',
      lessons: [
        {
          id: 'fields',
          title: 'Electric Fields',
          summary: 'Field lines',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Field lines',
              body: r`A charge creates an **electric field** around it: the force a small positive test charge would feel at each point. **Field lines** point away from $+$ charges and toward $-$ charges. Change the second charge.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 600, ymin: 0, ymax: 320, grid: false, axes: false, height: 320, pad: 0,
                params: { q2: { min: -2, max: 2, step: 1, value: -1, label: r`$q_2$`, color: 'blue', format: (v) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0') } },
                extra: ({ plot, p, s }) => drawField(s, plot, 1, p.q2),
                readout: (p) => (p.q2 < 0 ? 'Opposite charges: lines run from + to −. They attract.' : p.q2 > 0 ? 'Like charges: the lines push away from each other, leaving an empty region between them. They repel.' : 'A single charge: lines spread out evenly in all directions.'),
              },
              after: 'Where field lines crowd together, the field is strong. Field lines never cross.',
            },
            {
              type: 'explain',
              title: 'Field strength',
              body: r`The field from a point charge $Q$ has strength
$$E = \frac{kQ}{r^2}$$
measured in newtons per coulomb (N/C). A charge $q$ placed in the field feels a force $F = qE$. Positive charges are pushed along the field lines, negative charges against them.`,
            },
            {
              type: 'numeric',
              title: 'Force from a field',
              prompt: r`An electron (charge $-1.6 \times 10^{-19}$ C) sits in a uniform field of 1000 N/C. What is the size of the force on it, in units of $10^{-16}$ N?`,
              unit: r`$\times 10^{-16}$ N`,
              answer: 1.6,
              wrong: [{ v: 1600, why: r`$F = qE = 1.6 \times 10^{-19} \times 1000 = 1.6 \times 10^{-16}$ N.` }],
              explain: r`$F = |q|E = 1.6 \times 10^{-19} \times 10^3 = 1.6 \times 10^{-16}$ N, pointing **against** the field because the electron is negative.`,
            },
            {
              type: 'numeric',
              title: 'Field near a charge',
              prompt: r`What is the electric field strength 10 cm from a 1 nC ($10^{-9}$ C) point charge? ($E = kq/r^2$, $k = 9.0 \times 10^9$.)`,
              unit: 'N/C',
              answer: 8.988e9 * 1e-9 / 0.01,
              tol: 5,
              wrong: [{ v: 90, why: r`Square the distance: $0.1^2 = 0.01$.` }],
              explain: r`$\frac{9 \times 10^9 \times 10^{-9}}{0.1^2} = 900$ N/C. Double the distance and the field drops to a quarter, 225 N/C.`,
            },
            {
              type: 'numeric',
              title: 'Between two plates',
              prompt: r`Two parallel plates 2 cm apart are held at a voltage difference of 100 V. What is the (uniform) field between them, $E = \frac{V}{d}$, in V/m?`,
              unit: 'V/m',
              answer: 5000,
              explain: r`$\frac{100}{0.02} = 5{,}000$ V/m. Volts per metre and newtons per coulomb are the same unit: a charge of 1 µC there feels 5 mN.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Inside a car',
              prompt: 'Why is a car (with a metal body) a fairly safe place to be during a lightning storm?',
              choices: [
                { t: 'Charges stay on the outside of a metal shell, so the field inside stays near zero', ok: true },
                { t: 'The rubber tyres insulate it', why: 'Lightning easily crosses a few centimetres of rubber after travelling kilometres through air. The metal shell is what protects you.' },
                { t: 'Lightning never strikes cars', why: 'Cars can be struck. The current flows around the metal body and into the ground.' },
              ],
              explain: r`In a conductor, charges move until the field inside is zero, so the excess charge sits on the outer surface. A closed metal shell, called a **Faraday cage**, shields its interior. That's also why your phone may lose signal in a lift.`,
            },
          ],
          recap: [
            'Electric field lines point away from + and toward −. Denser lines mean a stronger field.',
            r`Point charge: $E = kQ/r^2$. Force on a charge: $F = qE$.`,
            'The field inside a closed conductor is zero (a Faraday cage).',
          ],
        },
        {
          id: 'voltage',
          title: 'Voltage & Capacitors',
          summary: 'Energy per charge, stored charge',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Uphill for charges',
              prompt: 'Moving a positive charge toward another positive charge takes work. What happens to that work?',
              choices: [
                { t: 'It’s stored as electric potential energy, which is released if you let go', ok: true },
                { t: 'It disappears', why: 'Energy is conserved. Let go and the charge flies away, turning that stored energy into motion.' },
                { t: 'It becomes heat', why: 'In an ideal situation it’s stored, like lifting a ball against gravity.' },
              ],
              explain: r`Pushing like charges together is like lifting a weight: the work is stored as potential energy. **Voltage** (potential difference) is the potential energy per coulomb of charge.`,
            },
            {
              type: 'explain',
              title: 'Voltage in a uniform field',
              body: r`Between two parallel metal plates with a voltage $V$ across them, separated by a distance $d$, the field is uniform:
$$E = \frac{V}{d}$$
So field strength can also be measured in volts per metre (1 V/m = 1 N/C). Moving a charge $q$ across a voltage $V$ changes its energy by $qV$.`,
            },
            {
              type: 'numeric',
              title: 'Plate field',
              prompt: 'Two plates 2 mm apart have 12 V across them. What is the electric field between them?',
              unit: 'V/m',
              answer: 6000,
              wrong: [{ v: 6, why: 'Convert 2 mm to 0.002 m first.' }, { v: 0.024, tol: 0.001, why: r`$E = V/d$: divide the voltage by the distance.` }],
              explain: r`$E = \frac{12}{0.002} = 6000$ V/m.`,
            },
            {
              type: 'explain',
              title: 'Capacitors',
              body: r`A **capacitor** (like two parallel plates) stores separated charge: $+Q$ on one plate and $-Q$ on the other. The charge is proportional to the voltage:
$$Q = CV$$
where $C$ is the **capacitance**, measured in farads (F). The stored energy is $\tfrac12 CV^2$.

Capacitors power camera flashes, smooth power supplies, and store each bit in some kinds of computer memory.`,
            },
            {
              type: 'interactive',
              title: 'Before it sparks',
              body: r`A 1.5 kV supply is connected across two parallel plates. The field between them is $E = V/d$. Air breaks down and sparks at about **3 MV/m** (3 kV per mm). Find the gap at which the field reaches that limit.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3.6, grid: false, axes: false, maxWidth: 460, height: 240,
                params: { d: { min: 0.2, max: 3, step: 0.05, value: 1.5, label: 'gap', color: 'blue', format: (v) => `${v.toFixed(2)} mm` } },
                extra: ({ plot, p, s, arrow }) => { const E = 1.5 / p.d, col = E > 3.0001 ? 'var(--error)' : 'var(--violet)'; const out = [s('line', { x1: plot.X(1), x2: plot.X(9), y1: plot.Y(0.3 + p.d), y2: plot.Y(0.3 + p.d), stroke: 'var(--coral)', 'stroke-width': 6 }), s('line', { x1: plot.X(1), x2: plot.X(9), y1: plot.Y(0.3), y2: plot.Y(0.3), stroke: 'var(--blue)', 'stroke-width': 6 }), s('text', { x: plot.X(0.5), y: Math.min(plot.Y(0.3 + p.d) + 6, plot.Y(0.3) - 12), /* never on top of the − sign */ 'text-anchor': 'middle', style: 'font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px));font-weight:700', fill: 'var(--coral)', text: '+' }), s('text', { x: plot.X(0.5), y: plot.Y(0.3) + 6, 'text-anchor': 'middle', style: 'font-size:max(calc(18px * var(--fs, 1)), var(--fmin, 0px));font-weight:700', fill: 'var(--blue)', text: '−' })]; const n = Math.round(Math.min(14, 2 + 2.6 * E)); for (let i = 0; i < n; i++) { const x = 1.4 + (7.2 * i) / Math.max(1, n - 1); out.push(arrow(plot.X(x), plot.Y(0.3 + p.d - 0.06), plot.X(x), plot.Y(0.36), { color: col, width: 2 })); } return out; },
                readout: (p) => `field **${(1.5 / p.d).toFixed(2)} MV/m** ${1.5 / p.d > 3.0001 ? '· spark!' : '· holds'}`,
                goal: (p) => Math.abs(p.d - 0.5) < 1e-6,
                hint: 'E = V/d, so d = V/E = 1,500 V ÷ 3,000,000 V/m.',
                solution: { d: 0.5 },
              },
              explain: r`$d = \frac{1500}{3 \times 10^6} = 0.5$ mm. Any closer and the air sparks over. This is why capacitors pack their plates close but fill the gap with a plastic or ceramic that withstands far stronger fields than air.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Camera flash',
              prompt: 'A camera flash capacitor of 100 μF (100 × 10⁻⁶ F) is charged to 300 V. How much energy does it store?',
              unit: 'J',
              answer: 0.5 * 100e-6 * 300 * 300,
              tol: 0.05,
              wrong: [{ v: 9, tol: 0.05, why: r`Don't forget the $\tfrac12$ in $\tfrac12 CV^2$.` }, { v: 0.03, tol: 0.005, why: r`That's the charge, $Q = CV$. The energy is $\tfrac12 CV^2$.` }],
              explain: r`$\tfrac12 CV^2 = \tfrac12 \times 10^{-4} \times 300^2 = 4.5$ J. That's released in about a thousandth of a second, which is enough for a blinding flash.`,
            },
          ],
          recap: [
            'Voltage is electric potential energy per unit charge.',
            r`Uniform field between plates: $E = V/d$.`,
            r`Capacitors store charge ($Q = CV$) and energy ($\tfrac12 CV^2$).`,
          ],
        },
      ],
    },
    {
      title: 'Combining and Measuring Charge',
      summary: 'Superposition and the charge of the electron.',
      lessons: [
        {
          id: 'superposition',
          title: 'Superposition',
          summary: 'Fields add up',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Adding fields',
              body: r`With several charges, each one produces its own field, and the total field is simply their **vector sum**. This is the **principle of superposition**. It makes electrostatics tractable: work out each charge's contribution separately, then add.`,
            },
            {
              type: 'numeric',
              title: 'Between opposites',
              prompt: r`Charges of $+2\ \mu$C and $-2\ \mu$C sit 2 m apart. Each produces a field of $\frac{kQ}{r^2} = \frac{8.99 \times 10^9 \times 2 \times 10^{-6}}{1^2}$ at the midpoint. What's the total field strength there, in kN/C? (1 decimal place.)`,
              unit: 'kN/C',
              answer: (2 * K * 2e-6) / 1000,
              tol: 0.06,
              wrong: [{ v: 0, why: 'The + charge pushes a test charge away (towards −), and the − charge pulls it towards itself: same direction, so they add.' }, { v: (K * 2e-6) / 1000, tol: 0.06, why: 'That’s one charge’s field. Both point the same way at the midpoint.' }],
              explain: r`Each gives about 18.0 kN/C, both pointing from + towards −, so the total is about **36.0 kN/C**.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The balance point',
              prompt: r`A charge of $+1$ sits at $x = 0$ and a charge of $+9$ at $x = 3$. Drag the test charge along the line to the point where the total field is **zero**.`,
              widget: {
                kind: 'graph', xmin: -0.5, xmax: 3.5, ymin: -6, ymax: 6, grid: 0.5, gridY: 2, height: 270, axes: { xlabel: 'x', ylabel: 'total field', xAt: -0.5 },
                params: { x: { min: 0.2, max: 2.8, step: 0.01, value: 2, slider: false } },
                curves: [{ f: (x) => (x > 0.15 && x < 2.85 ? lineField(x) : NaN), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.x, y: (p) => Math.max(-6, Math.min(6, lineField(p.x))), drag: { x: 'x' }, color: 'teal' }],
                extra: ({ plot, s }) => [
                  s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 12, class: 'fl-coral' }),
                  s('text', { x: plot.X(0), y: plot.Y(0) + 5, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800', text: '+1' }),
                  s('circle', { cx: plot.X(3), cy: plot.Y(0), r: 16, class: 'fl-coral' }),
                  s('text', { x: plot.X(3), y: plot.Y(0) + 5, 'text-anchor': 'middle', style: 'fill:#fff;font-weight:800', text: '+9' }),
                ],
                readout: (p) => r`$x = ${p.x.toFixed(2)}$: field from $+1$ is $${(1 / (p.x * p.x)).toFixed(2)}$ (right), from $+9$ is $${(9 / (3 - p.x) ** 2).toFixed(2)}$ (left); total $${lineField(p.x).toFixed(2)}$`,
                goal: (p) => Math.abs(p.x - 0.75) < 0.03,
                hint: r`Set $\frac{1}{x^2} = \frac{9}{(3 - x)^2}$. Take square roots.`,
                solution: { x: 0.75 },
              },
              explain: r`$\frac{1}{x} = \frac{3}{3 - x}$ gives $3 - x = 3x$, so $x = 0.75$: the balance point is **three times as far** from the charge that's 9 times stronger, since field falls as $1/r^2$. A charge placed there feels no force (though it's unstable along the line: nudge it, and it's pushed away).`,
            },
            {
              type: 'mcq',
              title: 'Opposite charges',
              prompt: r`Now the charges are $+4$ and $-1$. Where along the line through them can the field be zero?`,
              choices: [
                { t: 'Outside the pair, beyond the smaller charge', ok: true },
                { t: 'Between them', why: 'Between opposite charges, both fields point the same way (from + towards −), so they add.' },
                { t: 'Nowhere', why: 'Beyond the −1 charge, its pull towards itself can cancel the more distant +4’s push.' },
              ],
              explain: r`Outside the pair, the fields point in opposite directions. Near the smaller charge, its field can match the bigger but more distant one.`,
            },
            {
              type: 'explain',
              title: 'Dipoles',
              body: r`A **dipole** is a pair of equal and opposite charges close together. Many molecules are dipoles: in water, the oxygen end is slightly negative and the hydrogen ends slightly positive. In an electric field, dipoles twist to line up with it.

Microwave ovens use this: their rapidly flipping field twists water molecules back and forth, and the jostling heats the food.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Beyond the pair',
              prompt: r`A charge of $+4$ is at $x = 0$ and $-1$ at $x = 3$. At what position $x > 3$ is the total field zero?`,
              answer: 6,
              wrong: [{ v: 1, why: 'That’s for two positive charges. With opposite charges the zero point is outside, beyond the smaller charge.' }, { v: 4.5, why: r`Solve $\frac{4}{x^2} = \frac{1}{(x - 3)^2}$: $2(x - 3) = x$.` }],
              explain: r`$\frac{4}{x^2} = \frac{1}{(x - 3)^2}$ gives $2(x - 3) = x$, so $x = 6$: 6 units from the $+4$ charge and 3 from the $-1$, the 2:1 distance ratio again.`,
            },
          ],
          recap: [
            'Superposition: total field = vector sum of each charge’s field.',
            'Between like charges there’s a zero-field point, closer to the weaker charge.',
            'For opposite charges, the zero point lies outside, beyond the weaker charge.',
          ],
        },
        {
          id: 'millikan',
          title: 'Millikan’s Oil Drop',
          summary: 'Measuring the charge of one electron',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A floating droplet',
              body: r`In 1909, Robert Millikan and his student Harvey Fletcher sprayed tiny oil droplets between two horizontal metal plates. Some droplets picked up a few extra electrons. A voltage $V$ across plates a distance $d$ apart creates an upward field $E = V/d$.

When the electric force $qE$ exactly balances the weight $mg$, the drop **hovers**:
$$q\frac{V}{d} = mg$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make it hover',
              prompt: r`A charged droplet sits between plates 1 cm apart. Adjust the voltage until the droplet hovers motionless.`,
              widget: {
                kind: 'graph', equal: true, xmin: -3, xmax: 3, ymin: -0.6, ymax: 4.6, grid: false, axes: false, maxWidth: 420,
                params: { V: { min: 0, max: 1000, step: 5, value: 200, label: 'voltage', color: 'violet', format: (v) => `${v} V` } },
                extra: ({ plot, p, s, arrow }) => {
                  const a = dropAccel(p.V), up = 1.2 * (1 - a / 9.8), down = 1.2;
                  return [
                    s('rect', { x: plot.X(-2.6), y: plot.Y(4.1), width: plot.X(2.6) - plot.X(-2.6), height: 10, class: 'fl-coral' }),
                    s('rect', { x: plot.X(-2.6), y: plot.Y(0), width: plot.X(2.6) - plot.X(-2.6), height: 10, class: 'fl-blue' }),
                    s('text', { x: plot.X(2.8), y: plot.Y(4.1) + 9, class: 'lbl', text: '+' }),
                    s('text', { x: plot.X(2.8), y: plot.Y(0) + 9, class: 'lbl', text: '−' }),
                    s('circle', { cx: plot.X(0), cy: plot.Y(2), r: 9, class: 'fl-amber' }),
                    arrow(plot.X(0), plot.Y(2) + 10, plot.X(0), plot.Y(2 - down), { color: 'var(--ink)', width: 3.5, head: 11 }),
                    up > 0.05 ? arrow(plot.X(0), plot.Y(2) - 10, plot.X(0), plot.Y(2 + up), { color: 'var(--violet)', width: 3.5, head: 11 }) : null,
                    s('text', { x: plot.X(0.3), y: plot.Y(2 - down) + 4, class: 'lbl', text: 'weight' }),
                    s('text', { x: plot.X(0.3), y: plot.Y(2 + Math.max(up, 0.4)) + 4, class: 'lbl fl-violet', text: 'electric force' }),
                  ].filter(Boolean);
                },
                readout: (p) => {
                  const a = dropAccel(p.V);
                  return Math.abs(a) < 0.05 ? `${p.V} V: forces balance, **the drop hovers**.` : a > 0 ? `${p.V} V: weight wins, the drop **falls**.` : `${p.V} V: electric force wins, the drop **rises**.`;
                },
                goal: (p) => Math.abs(dropAccel(p.V)) < 0.05,
                hint: 'Increase the voltage until the two arrows are the same length.',
                solution: { V: 500 },
              },
              explain: r`At **500 V** the forces balance. Millikan measured each drop's mass from how fast it fell with the field off (air resistance sets a terminal speed that depends on size), then found the voltage that held it still.`,
            },
            {
              type: 'numeric',
              title: 'Count the electrons',
              prompt: r`The drop's mass is $2.45 \times 10^{-15}$ kg and it hovers at 500 V with plates 0.01 m apart. Its charge is $q = \frac{mgd}{V}$. How many electrons' worth of charge is that ($e = 1.6 \times 10^{-19}$ C)?`,
              answer: 3,
              wrong: [{ v: 4.8, tol: 0.05, why: 'That’s the charge in units of 10⁻¹⁹ C. Divide by 1.6 to count electrons.' }],
              explain: r`$q = \frac{2.45 \times 10^{-15} \times 9.8 \times 0.01}{500} \approx 4.8 \times 10^{-19}$ C $= 3e$. The drop carries exactly 3 extra electrons.`,
            },
            {
              type: 'mcq',
              title: 'Always a multiple',
              prompt: r`Millikan found drop charges like $3.2$, $4.8$, $8.0$ and $6.4$ (×10⁻¹⁹ C), but never values like $4.0$. What does that reveal?`,
              choices: [
                { t: 'Charge comes in whole-number multiples of a smallest unit, 1.6 × 10⁻¹⁹ C', ok: true },
                { t: 'His equipment was faulty', why: 'The striking pattern held over thousands of drops: a discovery, not an error.' },
                { t: 'Larger drops have more charge', why: 'Size varies continuously, but charge doesn’t: it jumps in steps.' },
              ],
              explain: r`All the values are multiples of $1.6 \times 10^{-19}$ C: 2, 3, 5 and 4 times. Charge is **quantised**, and the unit is the charge of one electron, $e$. Millikan received the 1923 Nobel Prize in Physics, partly for this measurement.`,
            },
            {
              type: 'numeric',
              title: 'Electrons in a coulomb',
              prompt: r`How many electrons make up one coulomb of charge? Give the answer in units of $10^{18}$. (2 decimal places.)`,
              unit: r`$\times 10^{18}$`,
              answer: 1 / 1.6e-19 / 1e18,
              tol: 0.01,
              wrong: [{ v: 1.6, tol: 0.01, why: 'That’s e itself. Take 1 ÷ e.' }],
              explain: r`$\frac{1}{1.6 \times 10^{-19}} = 6.25 \times 10^{18}$ electrons. A 1 A current carries that many electrons past a point every second.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Science and honesty',
              prompt: r`Millikan's notebooks later showed he left some drops out of his published results. Why does this story matter?`,
              choices: [
                { t: 'It shows how researchers’ judgements can shape results, which is why other scientists must repeat experiments independently', ok: true },
                { t: 'It proves the value of e is wrong', why: 'Repeated independent measurements confirm e to extraordinary precision.' },
                { t: 'It doesn’t matter at all', why: 'How data are selected matters greatly for trust in science.' },
              ],
              explain: r`Historians still debate whether his selection was reasonable judgement about faulty runs or biased cherry-picking. Either way, his value of $e$ was close, and later experiments refined it. Today $e$ is fixed exactly by definition: $1.602176634 \times 10^{-19}$ C, since 2019.`,
            },
          ],
          recap: [
            r`A drop hovers when $qV/d = mg$.`,
            'Millikan found charges are whole-number multiples of e.',
            r`$e = 1.6 \times 10^{-19}$ C; one coulomb is $6.25 \times 10^{18}$ electrons.`,
          ],
        },
        {
          id: 'points',
          title: 'Sharp Points & Lightning Rods',
          summary: 'Where charge crowds together',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Charge on a conductor',
              body: r`On a metal object, charges move until the whole surface is at the same **potential**. For a sphere of radius $r$ carrying charge $Q$, the potential is $V = \frac{kQ}{r}$ and the field at its surface is
$$E = \frac{kQ}{r^2} = \frac{V}{r}.$$
So at the same voltage, a **smaller** radius means a **stronger** surface field. A sharp point is like a tiny sphere: the field there is intense.`,
            },
            {
              type: 'numeric',
              title: 'Two connected spheres',
              prompt: r`A sphere of radius 1 cm and one of radius 10 cm are joined by a long wire, so they share the same potential. What is the ratio of their charges, $\frac{Q_{\text{small}}}{Q_{\text{big}}}$?`,
              answer: 0.1,
              tol: 0.001,
              explain: r`Equal potential means $\frac{kQ_1}{r_1} = \frac{kQ_2}{r_2}$, so $\frac{Q_1}{Q_2} = \frac{r_1}{r_2} = 0.1$. The small sphere carries less charge, but squeezed onto a much smaller surface.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'When does it spark?',
              prompt: r`A metal ball is held at **100 kV**. Air breaks down when the field reaches about 3 MV/m. Shrink the ball and find the radius at which its surface field reaches breakdown.`,
              widget: {
                kind: 'graph', equal: true, xmin: -12, xmax: 12, ymin: -8, ymax: 8, grid: false, axes: false, maxWidth: 420, pad: 6,
                params: { r: { min: 1, max: 10, step: 0.01, value: 6, label: 'ball radius', color: 'blue', format: (v) => `${v.toFixed(2)} cm` } },
                extra: ({ plot, p, s, arrow }) => { const E = 100e3 / (p.r / 100) / 1e6, spark = E >= 2.999, out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(p.r) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 })], n = 16; for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n, L = Math.min(5, 1.2 * E); out.push(arrow(plot.X((p.r + 0.3) * Math.cos(a)), plot.Y((p.r + 0.3) * Math.sin(a)), plot.X((p.r + 0.3 + L) * Math.cos(a)), plot.Y((p.r + 0.3 + L) * Math.sin(a)), { color: spark ? 'var(--error)' : 'var(--violet)', width: 2 })); } return out; },
                readout: (p) => { const E = 100e3 / (p.r / 100) / 1e6; return `surface field **${E.toFixed(2)} MV/m** · ${E >= 2.999 ? 'the air breaks down: sparks!' : 'holds'}`; },
                goal: (p) => Math.abs(p.r - 10 / 3) < 0.02,
                hint: 'r = V / E = 100,000 / 3,000,000 m.',
                solution: { r: 3.33 },
              },
              explain: r`$r = \frac{10^5}{3 \times 10^6} \approx 3.3$ cm. Any smaller and the air around it ionises and conducts. That’s why high-voltage equipment uses large, smooth, rounded electrodes, and why a Van de Graaff generator has a big dome.`,
            },
            {
              type: 'mcq',
              title: 'Why lightning rods are pointed',
              prompt: r`When a storm cloud passes overhead, a pointed rod on a roof sends up a faint glow and a stream of ions. Why does its sharp tip matter?`,
              choices: [
                { t: 'The field at the tip is so strong that it ionises the air, giving lightning an easy path to the rod rather than the building', ok: true },
                { t: 'Points attract more electrons from the cloud by magnetism', why: 'It’s an electric effect: strong fields near sharp curvature.' },
                { t: 'The point stores more charge than a rounded rod', why: 'It carries less charge, but concentrated, so the local field is much stronger.' },
              ],
              explain: r`The intense field at a point ionises the surrounding air (a corona discharge, seen at sea as **St Elmo’s fire**). Benjamin Franklin’s rods, connected to the ground, give a strike a safe path down instead of through the building.`,
            },
            {
              type: 'numeric',
              title: 'A Van de Graaff dome',
              prompt: r`A Van de Graaff generator has a dome of radius 20 cm. What is the highest voltage it can reach before the air breaks down at 3 MV/m? (In kV.)`,
              unit: 'kV',
              answer: 600,
              explain: r`$V = E r = 3 \times 10^6 \times 0.2 = 6 \times 10^5$ V = **600 kV**. Doubling the dome radius doubles the maximum voltage.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Comparing the fields',
              prompt: r`Two metal spheres of radius 2 cm and 8 cm are connected by a wire and charged. How many times stronger is the field at the surface of the small sphere than at the big one?`,
              answer: 4,
              wrong: [{ v: 0.25, why: 'The smaller sphere has the stronger field: E = V/r with the same V.' }, { v: 16, why: 'They share a potential, so E = V/r, not kQ/r² with equal Q.' }],
              explain: r`Same potential $V$, so $E = \frac{V}{r}$ and $\frac{E_{\text{small}}}{E_{\text{big}}} = \frac{8}{2} = 4$. Sharpness concentrates the field.`,
            },
          ],
          recap: [
            r`A conductor is at one potential; a sphere’s surface field is $E = V/r$.`,
            'Small radii and sharp points have strong fields, so air breaks down there.',
            'Lightning rods use corona discharge at a point; HV equipment uses rounded shapes.',
          ],
        },
      ],
    },
  ],
};
