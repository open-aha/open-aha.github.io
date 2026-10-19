import { fix } from '../lib/svg.js';

const r = String.raw;
const G = 9.8, RHO = 1.2;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f1 = (v) => fix(v, 1);
const f2 = (v) => fix(v, 2);

// lift coefficient of a typical cambered wing vs angle of attack (degrees), with stall past 15°
const CL = (a) => (a <= 15 ? 0.25 + 0.1 * a : 1.75 - 0.75 * (1 - Math.exp(-(a - 15) / 2.5)));

// airliner: weight 686,000 N, wing area 122.6 m², sea-level air: lift-off speed for lift coefficient c
const liftoff = (c) => Math.sqrt((2 * 686000) / (1.225 * 122.6 * c));
// ideal hover power (W) for a 2 kg drone with a single rotor of diameter d metres
const hoverPower = (d) => Math.sqrt((2 * 9.8) ** 3 / (2 * RHO * Math.PI * (d / 2) ** 2));

// a sailplane's sink rate (m/s) at airspeed v (m/s): parasitic drag grows like v³, induced drag like 1/v
const sink = (v) => 2.5e-5 * v ** 3 + 12 / v;

// an 80 kg skydiver: belly-down terminal speed 55 m/s; the canopy opens over 3 s from t = 20 s (terminal 5 m/s)
const SKY = (() => {
  const m = 80, g = 9.8, k1 = (m * g) / 55 ** 2, k2 = (m * g) / 5 ** 2, dt = 0.01, out = [];
  let v = 0;
  for (let i = 0; i <= 4000; i++) {
    const t = i * dt, f = Math.min(1, Math.max(0, (t - 20) / 3)), k = k1 + (k2 - k1) * f * f;
    out.push({ t, v, drag: k * v * v });
    v += (g - (k * v * v) / m) * dt;
  }
  return out;
})();

export default {
  id: 'flight',
  subject: 'physics',
  title: 'Flight',
  level: 'Intermediate',
  cover: 'flight',
  tagline: 'Drag, terminal velocity, lift, stalls, gliding, flaps and hovering.',
  description: r`Why does doubling your speed quadruple air resistance? How fast does a skydiver fall? How big must a wing be to lift a plane, and what happens when it tilts too far? Use two simple equations for drag and lift to understand everything from raindrops to airliners, then see why flaps let planes land and why helicopters need big rotors.`,
  prereq: 'Fluids',
  chapters: [
    {
      title: 'Air Resistance',
      summary: 'Pushing through the air.',
      lessons: [
        {
          id: 'drag',
          title: 'Drag',
          summary: 'The v² law',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'The drag equation',
              body: r`Moving through air means shoving air out of the way. At everyday speeds, the drag force is
$$F_D = \tfrac12 \rho v^2 C_D A$$
- $\rho$: air density, about 1.2 kg/m³ at sea level;
- $v$: speed;
- $A$: frontal area;
- $C_D$: the **drag coefficient**, set by the shape: about 1.0 for an upright cyclist, 0.3 for a modern car, 0.05 for a teardrop.

The key feature: drag grows with the **square** of speed.`,
            },
            {
              type: 'numeric',
              title: 'Faster on the motorway',
              prompt: r`A car speeds up from 60 km/h to 120 km/h. By what factor does the air drag on it increase?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`Drag goes as $v^2$, so doubling the speed gives $2^2$.` }, { v: 8, why: r`That's the factor for **power** ($v^3$). Drag force goes as $v^2$.` }],
              explain: r`Drag $\propto v^2$, so doubling the speed gives $2^2 = 4\times$ the drag.`,
            },
            {
              type: 'numeric',
              title: 'Power against drag',
              prompt: r`Power = force × speed. If drag goes as $v^2$, the power needed to push through the air goes as $v^3$. A cyclist rides at 30 km/h. Roughly how many times more power, against air drag, does riding at 40 km/h take? (2 decimal places.)`,
              unit: '×',
              answer: (4 / 3) ** 3,
              tol: 0.01,
              wrong: [{ v: 1.33, tol: 0.01, why: r`Power goes as the **cube** of speed: $(4/3)^3$.` }, { v: 1.78, tol: 0.01, why: r`That's $(4/3)^2$, the drag force. Power is force × speed: one more factor of $4/3$.` }],
              explain: r`$\left(\tfrac{40}{30}\right)^3 = \tfrac{64}{27} \approx 2.37$. A third faster costs well over twice the power. That's why racing cyclists tuck low, wear skin-tight suits, and ride close behind each other: **drafting** behind another rider can cut drag by around a third.`,
            },
            {
              type: 'numeric',
              title: 'A car at speed',
              prompt: r`A car has $C_D = 0.3$ and frontal area $A = 2.2$ m². What's the drag force at 30 m/s (108 km/h)? Use $\rho = 1.2$ kg/m³.`,
              unit: 'N',
              answer: 0.5 * 1.2 * 900 * 0.3 * 2.2,
              tol: 3,
              wrong: [{ v: 11.9, tol: 0.2, why: r`Square the speed: $v^2 = 900$, not 30.` }, { v: 713, tol: 3, why: r`Don't forget the $\tfrac12$.` }],
              explain: r`$F_D = \tfrac12 \times 1.2 \times 30^2 \times 0.3 \times 2.2 \approx 356$ N. To push against it at 30 m/s takes $356 \times 30 \approx 10.7$ kW, most of a small car's cruising power at highway speed.`,
            },
            {
              type: 'interactive',
              title: 'Terminal velocity',
              body: r`A falling skydiver speeds up until drag balances weight: $mg = \frac12 \rho v^2 C_d A$. For an 80 kg skydiver in air ($\rho = 1.2$ kg/m³), choose the drag area $C_d A$ that gives a terminal speed of **200 km/h**.`,
              widget: {
                kind: 'graph', xmin: 0.1, xmax: 1, ymin: 0, ymax: 400, grid: false, height: 260, axes: { xlabel: 'drag area C_d A (m²)', ylabel: 'terminal speed (km/h)', xticks: 0.1, yticks: 50, xAt: 0.1, yAt: 0 },
                params: { CA: { min: 0.1, max: 1, step: 0.001, value: 0.7, label: 'drag area', color: 'coral', format: (v) => `${v.toFixed(3)} m²` } },
                curves: [{ f: (x) => 3.6 * Math.sqrt((2 * 80 * 9.8) / (1.2 * x)), color: 'violet', width: 3 }, { f: () => 200, color: 'teal', dash: true }],
                points: [{ x: (p) => p.CA, y: (p) => 3.6 * Math.sqrt((2 * 80 * 9.8) / (1.2 * p.CA)), color: 'coral' }],
                readout: (p) => `terminal speed **${(3.6 * Math.sqrt((2 * 80 * 9.8) / (1.2 * p.CA))).toFixed(0)} km/h** · belly-flat ≈ 0.7 m², head-down ≈ 0.2 m²`,
                goal: (p) => Math.abs(3.6 * Math.sqrt((2 * 80 * 9.8) / (1.2 * p.CA)) - 200) < 1,
                hint: 'C_d A = 2mg / (ρ v²), with v = 200/3.6 m/s.',
                solution: { CA: 0.423 },
              },
              explain: r`$C_d A = \frac{2 \times 80 \times 9.8}{1.2 \times 55.6^2} \approx 0.42$ m², between the belly-flat and head-down positions. Because drag grows with $v^2$, quartering the area only doubles the terminal speed: head-down skydivers reach about 300 km/h.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Twice as fast',
              prompt: r`Air resistance grows like $v^2$, so the **power** needed to overcome it grows like $v^3$. How many times more power does a car need to push through the air at 120 km/h than at 60 km/h?`,
              unit: '×',
              answer: 8,
              wrong: [{ v: 4, why: r`The force grows like $v^2$, but power is force × speed: $v^3$.` }, { v: 2, why: r`Doubling the speed more than doubles the air resistance.` }],
              explain: r`$2^3 = 8$ times the power, for twice the speed. That’s why fuel use rises so sharply at motorway speeds, and why speed records need enormous engines for small gains.`,
            },
          ],
          recap: [
            r`Drag $F_D = \tfrac12 \rho v^2 C_D A$: it grows as $v^2$.`,
            r`The power needed against drag grows as $v^3$.`,
            'Streamlined shapes (low C_D) and small frontal areas cut drag.',
          ],
        },
        {
          id: 'terminal',
          title: 'Terminal Velocity',
          summary: 'Falling at a steady speed',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'When drag catches up',
              body: r`A falling object speeds up, so drag grows, until drag equals weight. Then the net force is zero and the speed stops increasing: the **terminal velocity**. Setting $\tfrac12 \rho v^2 C_D A = mg$:
$$v_t = \sqrt{\frac{2mg}{\rho C_D A}}$$`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Skydiving',
              body: r`A skydiver can change their drag by changing posture: spread out belly-first, or diving head-down. Adjust the mass and posture. The dashed line is free fall with no air.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 100, grid: 2, gridY: 20, height: 320, axes: { xlabel: 'time (s)', ylabel: 'speed (m/s)' },
                params: {
                  m: { min: 50, max: 120, step: 5, value: 80, label: 'mass', color: 'blue', format: (v) => `${v} kg` },
                  cda: { min: 0.15, max: 0.6, step: 0.05, value: 0.45, label: 'posture $C_DA$', color: 'coral', format: (v) => `${v.toFixed(2)} m²` },
                },
                curves: [
                  { f: (t) => G * t, color: 'ink', dash: true },
                  { f: (t, p) => { const vt = Math.sqrt((2 * p.m * G) / (RHO * p.cda)); return vt * Math.tanh((G * t) / vt); }, color: 'blue', width: 4 },
                ],
                readout: (p) => {
                  const vt = Math.sqrt((2 * p.m * G) / (RHO * p.cda));
                  return r`terminal velocity $v_t = ${f1(vt)}$ m/s $= ${Math.round(vt * 3.6)}$ km/h ${p.cda <= 0.25 ? '(head-down dive)' : p.cda >= 0.4 ? '(belly-to-earth)' : ''}`;
                },
              },
              after: r`Belly-first, a typical skydiver tops out around 55 m/s (200 km/h) after about 12 seconds. Head-down, with less area, they can exceed 80 m/s. A parachute increases $C_D A$ about a hundredfold, bringing the speed down to a gentle 5 m/s or so.`,
            },
            {
              type: 'numeric',
              title: 'Heavier divers',
              prompt: r`Two skydivers have the same shape and posture, but one has 4 times the mass. How does their terminal velocity compare?`,
              unit: '×',
              answer: 2,
              wrong: [{ v: 4, why: r`$v_t \propto \sqrt{m}$: four times the mass gives $\sqrt4$ times the speed.` }, { v: 1, why: 'Without air everything falls together, but with drag a heavier object of the same shape needs more speed before drag balances its weight.' }],
              explain: r`$v_t \propto \sqrt{m}$, so 4× the mass gives $\sqrt{4} = 2\times$ the terminal velocity. Air resistance is why a feather and a hammer fall differently on Earth, but identically on the Moon.`,
            },
            {
              type: 'numeric',
              title: 'Terminal speed',
              prompt: r`A skydiver of mass 80 kg falls belly-down with drag area $C_d A = 0.5$ m² in air of density 1.2 kg/m³. Terminal speed is reached when drag equals weight: $v = \sqrt{\frac{2mg}{\rho C_d A}}$. What is it, in m/s? (Nearest whole number.)`,
              unit: 'm/s',
              answer: Math.sqrt(2 * 80 * 9.8 / (1.2 * 0.5)),
              tol: 0.6,
              explain: r`$v = \sqrt{\frac{2 \times 80 \times 9.8}{0.6}} \approx 51$ m/s, about 185 km/h. Diving head-first cuts $C_d A$ to about 0.1 m², more than doubling the speed.`,
            },
            {
              type: 'mcq',
              title: 'How a parachute works',
              prompt: r`Opening a parachute cuts a skydiver’s terminal speed from about 55 m/s to about 5 m/s. What changes?`,
              choices: [
                { t: r`The drag area becomes about a hundred times bigger, so drag balances weight at a tenth of the speed`, ok: true },
                { t: r`The parachute makes the diver lighter`, why: r`Weight is unchanged; drag is what changes.` },
                { t: r`Air pushes the diver upwards`, why: r`Drag acts upwards while falling, but it only balances weight at the new, lower speed.` },
              ],
              explain: r`Terminal speed $\propto \sqrt{\frac{W}{C_dA}}$: a hundredfold increase in drag area gives a tenfold drop in speed. Landing at 5 m/s is like jumping off a 1.3 m wall.`,
            },
            { /*anim:flight*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A whole jump',
              body: r`An 80 kg skydiver jumps, falls belly-down, then opens the parachute after 20 s. Watch the {coral:drag} catch up with the {blue:weight}, and the speed graph.`,
              widget: {
                kind: 'graph', xmin: -14, xmax: 40, ymin: -4, ymax: 62, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 2.5, max: 40, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const st = SKY[Math.min(SKY.length - 1, Math.round(p.t / 0.01))], els = [], open = p.t >= 20;
                  // the diver, with force arrows (0.12 px per newton, capped at 150 px)
                  const cx = plot.X(-7), cy = plot.Y(34);
                  if (open) els.push(s('path', { d: `M${cx - 50} ${cy - 70}Q${cx} ${cy - 120} ${cx + 50} ${cy - 70}Z`, class: 'fl-amber', opacity: Math.min(1, (p.t - 20) / 3) }), s('path', { d: `M${cx - 50} ${cy - 70}L${cx} ${cy - 10}L${cx + 50} ${cy - 70}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1 }));
                  els.push(s('rect', { x: cx - 22, y: cy - 6, width: 44, height: 12, rx: 6, class: 'fl-ink' }));
                  const arrow = (len, up, col) => { const y2 = cy + (up ? -1 : 1) * (12 + len); return [s('line', { x1: cx + (up ? 14 : -14), x2: cx + (up ? 14 : -14), y1: cy, y2, stroke: `var(--${col})`, 'stroke-width': 5 }), s('path', { d: `M${cx + (up ? 14 : -14) - 8} ${y2 + (up ? 8 : -8)}L${cx + (up ? 14 : -14)} ${y2}L${cx + (up ? 14 : -14) + 8} ${y2 + (up ? 8 : -8)}`, fill: 'none', stroke: `var(--${col})`, 'stroke-width': 4 })]; };
                  els.push(arrow(Math.min(150, 0.12 * 784), false, 'blue'), arrow(Math.min(150, 0.12 * st.drag), true, 'coral'));
                  // speed against time
                  const X = (t) => plot.X(t), Y = (v) => plot.Y(v);
                  els.push(s('line', { x1: X(0), x2: X(40), y1: Y(0), y2: Y(0), stroke: 'var(--axis)', 'stroke-width': 1.2 }), s('line', { x1: X(0), x2: X(0), y1: Y(0), y2: Y(60), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  for (const [v, lab] of [[55, '55 m/s'], [5, '5 m/s']]) els.push(s('line', { x1: X(0), x2: X(40), y1: Y(v), y2: Y(v), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '4 5' }), s('text', { x: X(39.5), y: Y(v) - 5, 'text-anchor': 'end', class: 'tick', text: lab }));
                  for (const t of [0, 20, 40]) els.push(s('text', { x: X(t), y: Y(0) + 16, 'text-anchor': 'middle', class: 'tick', text: `${t} s` }));
                  const pts = SKY.filter((o, i) => o.t <= p.t && i % 10 === 0);
                  els.push(s('path', { d: pts.map((o, i) => `${i ? 'L' : 'M'}${X(o.t).toFixed(1)} ${Y(o.v).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }));
                  return els;
                },
                readout: (p) => { const st = SKY[Math.min(SKY.length - 1, Math.round(p.t / 0.01))]; return `${fix(p.t, 1)} s · speed ${fix(st.v, 1)} m/s · {coral:drag ${fix(st.drag, 0)} N} against {blue:weight 784 N}`; },
              },
              after: r`At first the diver speeds up at nearly $g$, but drag grows like $v^2$ until it matches the weight, at about 55 m/s: no net force, so no more speeding up. Opening the canopy suddenly makes drag far bigger than the weight, so the diver **slows down** (they don't go upwards, they just fall more slowly) until drag and weight balance again at a gentle 5 m/s. Real canopies open over a few seconds to keep that deceleration bearable.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Falling mice',
              prompt: r`A mouse can survive a fall down a deep mine shaft, but a horse cannot. Which scaling explains this?`,
              choices: [
                { t: 'Weight scales as size³ but drag area as size², so smaller animals have much lower terminal velocities', ok: true },
                { t: 'Mice have stronger bones', why: 'Bone strength isn’t the main factor. Mice simply hit the ground far more slowly.' },
                { t: 'Gravity pulls less on small things', why: 'Gravity gives every object the same acceleration. It’s drag that differs.' },
              ],
              explain: r`Scale an animal down by a factor $k$: its mass falls as $k^3$ but its area only as $k^2$, so $v_t \propto \sqrt{m/A} \propto \sqrt{k}$. A mouse's terminal velocity is low enough that it lands safely. This is the square–cube law again, which the biologist J. B. S. Haldane famously described in his essay *On Being the Right Size*.`,
            },
          ],
          recap: [
            r`Terminal velocity: drag equals weight, $v_t = \sqrt{2mg/(\rho C_D A)}$.`,
            'Skydivers reach about 55 m/s belly-first. Parachutes cut that to about 5 m/s.',
            r`$v_t \propto \sqrt{m/A}$: small animals fall slowly.`,
          ],
        },
      ],
    },
    {
      title: 'Wings',
      summary: 'Lift, stalls and gliding.',
      lessons: [
        {
          id: 'lift',
          title: 'Lift & Stalls',
          summary: 'The lift equation and angle of attack',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'The lift equation',
              body: r`A wing makes **lift** by turning the oncoming air downward (as you saw in the Fluids course). Lift has the same form as drag:
$$L = \tfrac12 \rho v^2 C_L A$$
where $A$ is now the **wing area** and $C_L$, the **lift coefficient**, depends on the wing's shape and its **angle of attack**: the angle between the wing and the oncoming air.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Tilting the wing',
              body: r`Increase the angle of attack and watch the lift coefficient.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 25, ymin: 0, ymax: 2, grid: 5, gridY: 0.5, height: 300, axes: { xlabel: 'angle of attack (°)', ylabel: 'C_L' },
                params: { a: { min: 0, max: 25, step: 1, value: 8, label: 'angle', color: 'blue', format: (v) => `${v}°` } },
                curves: [{ f: (a) => CL(a), color: 'blue', width: 3 }],
                points: [{ x: (p) => p.a, y: (p) => CL(p.a), color: 'coral' }],
                extra: ({ plot, s }) => [s('rect', { x: plot.X(15), y: plot.Y(2), width: plot.X(25) - plot.X(15), height: plot.Y(0) - plot.Y(2), class: 'fl-coral', opacity: 0.08 }), s('text', { x: plot.X(20), y: plot.Y(1.9), 'text-anchor': 'middle', class: 'lbl', text: 'stall' })],
                readout: (p) => (p.a > 15 ? r`$C_L = ${f2(CL(p.a))}$: **STALL!** The airflow separates from the top of the wing and lift collapses.` : r`$C_L = ${f2(CL(p.a))}$: steeper angle, more lift`),
              },
              after: r`Up to about 15°, tilting the wing more turns the air more and increases lift steadily. Beyond that, the air can no longer follow the curved top surface: it breaks away into turbulent eddies and lift drops sharply. That's a **stall**. It has nothing to do with the engine: a stall is purely about the airflow over the wing.`,
            },
            {
              type: 'numeric',
              title: 'Take-off speed',
              prompt: r`A small plane weighs 1,100 kg and has a wing area of 16 m². With $C_L = 1.5$ at take-off, what speed does it need for lift to equal its weight? (Use $\rho = 1.2$ kg/m³ and $g = 9.8$ m/s².)`,
              unit: 'm/s',
              answer: Math.sqrt((2 * 1100 * 9.8) / (1.2 * 1.5 * 16)),
              tol: 0.3,
              wrong: [{ v: 749, tol: 5, why: r`That's $v^2$. Take the square root.` }, { v: 38.7, tol: 0.3, why: r`Don't forget the $\tfrac12$ in the lift equation: $v = \sqrt{2mg / (\rho C_L A)}$.` }],
              explain: r`Set $\tfrac12 \rho v^2 C_L A = mg$: $v = \sqrt{\dfrac{2 \times 1100 \times 9.8}{1.2 \times 1.5 \times 16}} \approx 27$ m/s (about 53 knots). That's very close to the real take-off speed of a Cessna 172.`,
            },
            {
              type: 'numeric',
              title: 'Holding up a light aircraft',
              prompt: r`A small plane has wing area 16 m² and flies at 30 m/s in air of density 1.2 kg/m³ with lift coefficient 1.0. Lift is $L = \frac12 \rho v^2 S C_L$. What mass can it support? ($m = L/g$; nearest 10 kg.)`,
              unit: 'kg',
              answer: 0.5 * 1.2 * 900 * 16 * 1.0 / 9.8,
              tol: 6,
              wrong: [{ v: 8640, tol: 20, why: r`That’s the lift force in newtons. Divide by g for the mass.` }],
              explain: r`$L = \frac12 \times 1.2 \times 900 \times 16 \approx 8{,}640$ N, enough for about **880 kg**: a typical loaded four-seat aircraft. That’s why such planes take off at around 100 km/h.`,
            },
            {
              type: 'numeric',
              title: 'Banking turns',
              prompt: r`In a level turn banked at angle $\phi$, the wings must produce $\frac{1}{\cos\phi}$ times the plane’s weight. How many "g" do the passengers feel in a 60° bank?`,
              answer: 2,
              tol: 0.001,
              explain: r`$\frac{1}{\cos 60°} = 2$: everyone feels twice their weight, and the stall speed rises by $\sqrt2$. That’s why steep turns at low speed are dangerous.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Hot and high',
              prompt: r`On a hot day at a high-altitude airport, the air is thinner (lower $\rho$). What does a plane need to take off?`,
              choices: [
                { t: 'A higher speed, and so a longer runway', ok: true },
                { t: 'A lower speed', why: r`Less dense air gives less lift at a given speed: $L \propto \rho v^2$.` },
                { t: 'Nothing changes', why: 'Lift depends directly on air density.' },
              ],
              explain: r`With lower $\rho$, the same lift needs a larger $v^2$. At Denver (about 1,600 m up), the air is roughly 15% less dense, so take-off speed rises by about 8%, and engines also produce less thrust. That's why high, hot airports have extra-long runways and sometimes restrict how much planes can carry.`,
            },
          ],
          recap: [
            r`Lift $L = \tfrac12\rho v^2 C_L A$, with $C_L$ set by the angle of attack.`,
            'Above about 15°, the airflow separates and the wing stalls.',
            'Thin air means faster take-offs and longer runways.',
          ],
        },
        {
          id: 'gliding',
          title: 'Gliding',
          summary: 'Lift-to-drag ratio',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Trading height for distance',
              body: r`A glider has no engine. It descends gently, using gravity to keep moving. The steepness of its glide path is set by its **lift-to-drag ratio** $L/D$:
$$\text{glide distance} = \text{height} \times \frac{L}{D}$$
| Aircraft | Glide ratio |
|---|---|
| Space Shuttle (landing) | about 4.5 : 1 |
| Airliner | about 15–20 : 1 |
| Modern sailplane | 40–60 : 1 |`,
            },
            {
              type: 'numeric',
              title: 'How far can it glide?',
              prompt: r`A sailplane with a glide ratio of 40 : 1 is 1,500 m above the ground in still air. How far can it glide?`,
              unit: 'km',
              answer: 60,
              wrong: [{ v: 37.5, why: 'Multiply the height by the glide ratio, rather than dividing.' }, { v: 60000, why: 'That’s metres. Convert to km.' }],
              explain: r`$1500\ \text{m} \times 40 = 60{,}000$ m $= 60$ km. Glider pilots go much farther by circling in rising columns of warm air (**thermals**) to regain height, and flights over 1,000 km have been made.`,
            },
            {
              type: 'numeric',
              title: 'Sinking slowly',
              prompt: r`A sailplane flies at 30 m/s with a glide ratio of 40 : 1. How fast is it sinking, in m/s?`,
              unit: 'm/s',
              answer: 0.75,
              tol: 0.01,
              wrong: [{ v: 1200, why: 'Divide the speed by the glide ratio, rather than multiplying.' }],
              explain: r`For every 40 m forward it drops 1 m, so it sinks at $\frac{30}{40} = 0.75$ m/s. Any rising air faster than that (a thermal, or air deflected up a ridge) makes the glider **climb**.`,
            },
            {
              type: 'interactive',
              title: 'Best glide speed',
              body: r`Fly too slowly and induced drag rises; too fast and air resistance dominates. The curve shows this sailplane's sink rate at each speed. Its glide ratio is speed ÷ sink rate. Find the speed that gives the **best** glide ratio.`,
              widget: {
                kind: 'graph', xmin: 10, xmax: 55, ymin: 0, ymax: 5, grid: false, height: 280, axes: { xlabel: 'airspeed (m/s)', ylabel: 'sink rate (m/s)', xticks: 5, yticks: 1, xAt: 10 },
                params: { v: { min: 12, max: 55, step: 0.5, value: 40, label: 'airspeed', color: 'coral', format: (v) => `${f1(v)} m/s (${Math.round(v * 3.6)} km/h)` } },
                curves: [{ f: (x) => sink(x), color: 'violet', width: 3 }, { f: (x, p) => (x * sink(p.v)) / p.v, color: 'teal', dash: true }],
                points: [{ x: (p) => p.v, y: (p) => sink(p.v), color: 'coral' }],
                readout: (p) => `sink ${sink(p.v).toFixed(2)} m/s · glide ratio **${(p.v / sink(p.v)).toFixed(1)} : 1**`,
                goal: (p) => Math.abs(p.v - Math.pow(12 / 2.5e-5, 0.25)) < 1,
                hint: 'The best glide ratio is where the dashed line from the origin just touches the curve.',
                solution: { v: 26.5 },
              },
              explain: r`About **26 m/s** (95 km/h) gives the best ratio, about 29 : 1, where a line from the origin is tangent to the curve. That's not the speed of **slowest** sinking (which is lower, about 20 m/s): to stay up longest, fly slower; to go farthest, fly at best glide. Pilots fly faster still into a headwind.`,
            },
            {
              type: 'numeric',
              title: 'Sink rate',
              prompt: r`A glider with a glide ratio of 40 flies at 100 km/h. How fast does it sink, in m/s? (2 decimal places.)`,
              unit: 'm/s',
              answer: 100 / 3.6 / 40,
              tol: 0.01,
              explain: r`$\frac{27.8}{40} \approx 0.69$ m/s. Rising air (thermals) faster than this lets the glider climb without an engine.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Gimli Glider',
              prompt: r`In 1983, an Air Canada Boeing 767 ran out of fuel at 41,000 feet (about 12.5 km), partly because of a mix-up between pounds and kilograms. With a glide ratio of roughly 12 : 1, about how far could it glide?`,
              choices: [
                { t: 'About 150 km', ok: true },
                { t: 'About 12 km', why: r`That's roughly the height. Multiply by the glide ratio: $12.5 \times 12$.` },
                { t: 'About 1,500 km', why: r`$12.5\ \text{km} \times 12 = 150$ km.` },
              ],
              explain: r`$12.5\ \text{km} \times 12 \approx 150$ km. The pilots, one of them an experienced glider pilot, landed safely on a disused airbase at Gimli, Manitoba, using a technique called a forward slip to lose the last of their excess height. Everyone survived.`,
            },
          ],
          recap: [
            r`Glide distance = height × $L/D$.`,
            'Sailplanes reach 40–60 : 1. Airliners manage about 15–20 : 1.',
            'Gliders stay up for hours by climbing in thermals.',
          ],
        },
      ],
    },
    {
      title: 'Taking Off and Hovering',
      summary: 'Flaps, runways and rotors.',
      lessons: [
        {
          id: 'flaps',
          title: 'Flaps & Runways',
          summary: 'Flying slowly enough to land',
          icon: 'down',
          steps: [
            {
              type: 'explain',
              title: 'The slowest a wing can fly',
              body: r`A wing's lift is $L = \tfrac12 \rho v^2 S C_L$. To leave the ground (or stay up while landing), lift must at least equal the weight $W$, so the slowest possible speed is
$$v = \sqrt{\frac{2W}{\rho S C_L}}$$
Airliners cruise efficiently with a small $C_L$, but for take-off and landing they extend **flaps** and **slats**, changing the wing's shape to raise $C_L$ and fly safely slower.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Set the flaps',
              prompt: r`An airliner weighing 686,000 N has 122.6 m² of wing. Choose the lift coefficient (set by the flaps) that lets it lift off at **75 m/s** or less, using the least flap possible.`,
              widget: {
                kind: 'graph', xmin: 0.5, xmax: 2.6, ymin: 40, ymax: 140, grid: 0.25, gridY: 10, height: 260, axes: { xlabel: 'lift coefficient', ylabel: 'lift-off speed (m/s)', xAt: 0.5, yAt: 40 },
                params: { c: { min: 0.6, max: 2.5, step: 0.01, value: 1, slider: false } },
                curves: [{ f: (x) => liftoff(x), color: 'violet', width: 3 }, { f: () => 75, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.c, y: (p) => liftoff(p.c), drag: { x: 'c' }, color: 'teal' }],
                readout: (p) => r`$C_L = ${p.c.toFixed(2)}$: lift-off at $${liftoff(p.c).toFixed(1)}$ m/s ($${(liftoff(p.c) * 3.6).toFixed(0)}$ km/h)`,
                goal: (p) => liftoff(p.c) <= 75 && liftoff(p.c - 0.01) > 75,
                hint: r`Solve $C_L = \frac{2W}{\rho S v^2}$.`,
                solution: { c: 1.63 },
              },
              explain: r`$C_L = \frac{2 \times 686{,}000}{1.225 \times 122.6 \times 75^2} \approx 1.63$. Without flaps (about 0.5) it would need about 135 m/s, far too fast for any runway.`,
            },
            {
              type: 'numeric',
              title: 'Speed and runway length',
              prompt: r`The distance needed to stop a plane grows with its kinetic energy, so as speed squared. If landing speed rises from 70 m/s to 84 m/s (20% faster), how many times longer is the stopping distance? (2 decimal places.)`,
              unit: '×',
              answer: 1.44,
              tol: 0.005,
              wrong: [{ v: 1.2, why: 'Distance grows with speed squared.' }],
              explain: r`$1.2^2 = 1.44$: 44% more runway for just 20% more speed. That's why flaps matter so much, and why landing without them (after a failure) needs a very long runway.`,
            },
            {
              type: 'mcq',
              title: 'Into the wind',
              prompt: r`Planes take off and land into the wind whenever possible. Why?`,
              choices: [
                { t: 'Lift depends on airspeed, not ground speed; a headwind gives the needed airspeed at a lower ground speed', ok: true },
                { t: 'The wind pushes the plane up', why: 'A headwind doesn’t push upwards; it adds to the air speed over the wings.' },
                { t: 'It’s just tradition', why: 'It has a clear physical reason: shorter take-off and landing runs.' },
              ],
              explain: r`With a 20 m/s headwind, a plane needing 75 m/s airspeed lifts off at just 55 m/s over the ground: a much shorter run. Aircraft carriers steam into the wind during launches for the same reason.`,
            },
            {
              type: 'numeric',
              title: 'Flaps and stall speed',
              prompt: r`Stall speed is proportional to $\frac{1}{\sqrt{C_{L,\max}}}$. If flaps double the maximum lift coefficient, by what factor does the stall speed change? (3 decimal places.)`,
              answer: 1 / Math.sqrt(2),
              tol: 0.001,
              explain: r`$\frac{1}{\sqrt2} \approx 0.707$: about 30% slower, which shortens the take-off and landing runs (proportional to speed squared) by half.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Hot and high',
              prompt: r`At a high-altitude airport on a hot day, the air density is 0.9 kg/m³ instead of 1.225. By what factor does the lift-off speed increase? (2 decimal places.)`,
              unit: '×',
              answer: Math.sqrt(1.225 / 0.9),
              tol: 0.005,
              wrong: [{ v: 1.225 / 0.9, tol: 0.01, why: r`Speed goes as $1/\sqrt{\rho}$: take the square root.` }],
              explain: r`$\sqrt{\frac{1.225}{0.9}} \approx 1.17$: 17% faster, which with the $v^2$ rule means about 36% more runway. "Hot and high" airports like La Paz (4,000 m) have very long runways, and planes there often carry less weight.`,
            },
          ],
          recap: [
            r`Minimum flying speed $v = \sqrt{2W/(\rho S C_L)}$.`,
            'Flaps raise the lift coefficient for slow take-offs and landings.',
            'Stopping distance grows as speed squared; headwinds and dense air help.',
          ],
        },
        {
          id: 'hover',
          title: 'Hovering',
          summary: 'Why helicopters have big rotors',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Pushing air down',
              body: r`A hovering helicopter or drone stays up by throwing air downwards: its thrust equals the momentum given to the air each second. Momentum theory shows that the ideal power needed to hover with thrust $T$ and rotor disc area $A$ is
$$P = \sqrt{\frac{T^3}{2\rho A}}$$
Moving a lot of air slowly (big rotor) is much cheaper than moving a little air fast (small rotor).`,
            },
            {
              type: 'numeric',
              title: 'Double the rotor',
              prompt: r`If a rotor's diameter doubles (same thrust), its disc area quadruples. By what factor does the ideal hover power change?`,
              unit: '×',
              answer: 0.5,
              wrong: [{ v: 0.25, why: r`$P \propto \frac{1}{\sqrt{A}}$: four times the area halves the power.` }, { v: 2, why: 'Bigger rotors need less power, not more.' }],
              explain: r`$P \propto A^{-1/2}$, so $4\times$ the area gives half the power. That's why helicopters have huge, slow rotors and why hummingbirds, with tiny wings, burn energy so fast.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Design a drone',
              prompt: r`A 2 kg drone (thrust 19.6 N) has one rotor and a motor that can supply **100 W** of ideal power. Find the **smallest** rotor diameter (to 1 cm) that lets it hover.`,
              widget: {
                kind: 'graph', xmin: 0.1, xmax: 1.5, ymin: 0, ymax: 400, grid: 0.1, gridY: 50, height: 260, padL: 48, axes: { xlabel: 'rotor diameter (m)', ylabel: 'hover power (W)', xAt: 0.1 },
                params: { d: { min: 0.15, max: 1.5, step: 0.01, value: 0.3, slider: false } },
                curves: [{ f: (x) => (x > 0.12 ? hoverPower(x) : NaN), color: 'violet', width: 3 }, { f: () => 100, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.d, y: (p) => Math.min(400, hoverPower(p.d)), drag: { x: 'd' }, color: 'teal' }],
                readout: (p) => r`rotor $${p.d.toFixed(2)}$ m: hover power $${hoverPower(p.d).toFixed(0)}$ W`,
                goal: (p) => hoverPower(p.d) <= 100 && hoverPower(p.d - 0.01) > 100,
                hint: r`Solve $A = \frac{T^3}{2\rho P^2}$, then $d = 2\sqrt{A/\pi}$.`,
                solution: { d: 0.64 },
              },
              explain: r`$A = \frac{19.6^3}{2 \times 1.2 \times 100^2} \approx 0.31$ m², so $d \approx 0.63$ m. Real drones split this area among four rotors, and real rotors need about 50% more power than this ideal.`,
            },
            {
              type: 'mcq',
              title: 'Hovering at altitude',
              prompt: r`Helicopters struggle to hover high in the mountains. What does the formula say?`,
              choices: [
                { t: 'Thinner air (smaller ρ) raises the power needed to hover', ok: true },
                { t: 'Gravity is much weaker up high, so it’s easier', why: 'Gravity barely changes over a few kilometres; air density changes a lot.' },
                { t: 'Altitude makes no difference', why: r`$P \propto 1/\sqrt{\rho}$: thin air means more power.` },
              ],
              explain: r`At 8,800 m, air density is about a third of sea level, so hovering needs about $\sqrt3 \approx 1.7$ times the power, with engines that also lose power in thin air. A helicopter first landed on the summit of Everest in 2005, a remarkable feat.`,
            },
            {
              type: 'numeric',
              title: 'A heavier drone',
              prompt: r`Ideal hovering power grows like $T^{3/2}$ for the same rotors. If a drone’s weight (and so its thrust) doubles, by what factor does its hovering power rise? (2 decimal places.)`,
              answer: Math.pow(2, 1.5),
              tol: 0.01,
              explain: r`$2^{1.5} \approx 2.83$. Carrying a payload is expensive, which is why delivery drones have short ranges, and why bigger rotors (more area) help.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Mars helicopter',
              prompt: r`NASA's Ingenuity helicopter flew on Mars, where the air density is about 0.017 kg/m³, around 1/70 of Earth's. With the same thrust and rotor size, how many times more power would hovering need than on Earth? (Ignore Mars's weaker gravity; nearest whole number.)`,
              unit: '×',
              answer: Math.round(Math.sqrt(70)),
              tol: 0.6,
              wrong: [{ v: 70, why: 'Power goes as 1/√ρ, not 1/ρ.' }],
              explain: r`$\sqrt{70} \approx 8$ times. Mars's lower gravity (38%) cuts the needed thrust, which helps a lot ($P \propto T^{3/2}$), but Ingenuity still needed very large, fast-spinning rotors (1.2 m across, about 2,500 rpm) for its 1.8 kg body. It made 72 flights from 2021 to 2024.`,
            },
          ],
          recap: [
            r`Ideal hover power $P = \sqrt{T^3/(2\rho A)}$.`,
            'Bigger rotors and denser air make hovering cheaper.',
            'Thin air on mountains, or on Mars, demands far more power.',
          ],
        },
        {
          id: 'propulsion',
          title: 'Why Jet Engines Are So Big',
          summary: 'Propulsive efficiency',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Push a lot of air gently',
              body: r`A jet engine makes thrust by throwing air backwards. Thrust is the mass of air per second times the speed it is sped up by: $F = \dot m\,(v_j - v)$, where $v$ is the plane’s speed and $v_j$ the exhaust speed.

The same thrust can come from a small mass thrown very fast or a large mass thrown gently. The difference is efficiency: any speed left in the exhaust is wasted kinetic energy. The **propulsive efficiency** is
$$\eta = \frac{2}{1 + v_j/v}.$$`,
            },
            {
              type: 'numeric',
              title: 'A fast, thin jet',
              prompt: r`An early jet engine flew at 250 m/s with an exhaust speed of 750 m/s. What was its propulsive efficiency? (Percentage.)`,
              unit: '%',
              answer: 50,
              tol: 0.5,
              explain: r`$\eta = \frac{2}{1 + 3} = 0.5$: half the energy given to the air was wasted in the fast exhaust jet.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Design the fan',
              prompt: r`Modern **turbofans** use a huge fan to push a big mass of air only a little faster. Find the ratio of exhaust speed to flight speed that gives a propulsive efficiency of **80%**.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 5, ymin: 0, ymax: 1, grid: false, height: 260, axes: { xlabel: 'exhaust speed ÷ flight speed', ylabel: 'propulsive efficiency', xticks: 0.5, yticks: 0.2, xAt: 1, yAt: 0 },
                params: { k: { min: 1.05, max: 5, step: 0.01, value: 3, label: 'speed ratio', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => 2 / (1 + x), color: 'violet', width: 3 }, { f: () => 0.8, color: 'teal', dash: true }],
                points: [{ x: (p) => p.k, y: (p) => 2 / (1 + p.k), color: 'coral' }],
                readout: (p) => `efficiency **${(200 / (1 + p.k)).toFixed(1)}%** · for the same thrust the engine must move ${(2 / (p.k - 1)).toFixed(1)}× the air of a ratio-3 engine`,
                goal: (p) => Math.abs(2 / (1 + p.k) - 0.8) < 0.003,
                hint: r`Solve $\frac{2}{1 + k} = 0.8$.`,
                solution: { k: 1.5 },
              },
              explain: r`$1 + k = 2.5$, so the exhaust should be only **1.5 times** the flight speed. To get the same thrust with such a gentle push, the engine must move four times as much air as the ratio-3 engine (thrust $\propto \dot m(k - 1)$). That is why airliner engines have fans over 3 m across.`,
            },
            {
              type: 'mcq',
              title: 'The limit',
              prompt: r`Efficiency approaches 100% as the exhaust speed approaches the flight speed. Why can’t an engine actually reach that?`,
              choices: [
                { t: 'The thrust per kilogram of air goes to zero, so you would need an infinite mass of air', ok: true },
                { t: 'The air would catch fire', why: 'It’s a momentum issue: no speed difference means no thrust.' },
                { t: 'It can, and propellers do', why: 'Propellers get closer (they move huge masses of air slowly), but never all the way.' },
              ],
              explain: r`Thrust $= \dot m(v_j - v)$: with no speed difference there is no push. Engineers trade efficiency against size and weight: propellers win at low speed, turbofans at airliner speeds, and narrow fast jets on supersonic fighters.`,
            },
            {
              type: 'numeric',
              title: 'Wasted energy',
              prompt: r`At 80% propulsive efficiency, what percentage of the energy delivered to the air is left behind as kinetic energy in the wake?`,
              unit: '%',
              answer: 20,
              tol: 0.5,
              explain: r`$100 - 80 = 20\%$ stays in the moving air behind the plane. The rest does useful work pushing the plane along.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Same thrust, more air',
              prompt: r`Engine A speeds air up by 500 m/s; engine B speeds air up by only 100 m/s. For the same thrust, how many times more air per second must engine B move?`,
              answer: 5,
              explain: r`Thrust $= \dot m \times \Delta v$, so $\dot m$ must be $\frac{500}{100} = 5$ times larger. But the energy wasted per second is $\frac12\dot m\,\Delta v^2$, which is 5 times **smaller** for engine B: moving more air gently is the efficient choice.`,
            },
          ],
          recap: [
            'Thrust = mass flow × speed increase.',
            r`Propulsive efficiency $\eta = 2/(1 + v_j/v)$: best when the exhaust is only a little faster than the plane.`,
            'Big fans move lots of air gently, which is why modern jet engines are huge.',
          ],
        },
      ],
    },
  ],
};
