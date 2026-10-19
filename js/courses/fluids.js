import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

// floating block in a tank of fluid (density rf); block density rb
const tank = ({ rf = 1000, param = true, value = 600, goal, solution, hint } = {}) => ({
  kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 7, grid: false, axes: false, height: 300,
  params: param ? { rho: { min: 100, max: 2000, step: 50, value, label: r`$\rho$`, color: 'coral', format: (v) => `${v} kg/m³` } } : {},
  extra: ({ plot, p, s }) => {
    const rb = param ? p.rho : value;
    const waterTop = 4.2, side = 2;
    const frac = Math.min(1, rb / rf);
    const sinks = rb > rf;
    const bottomY = sinks ? 0.3 : waterTop - side * frac;
    const els = [
      s('rect', { x: plot.X(1), y: plot.Y(waterTop), width: plot.X(9) - plot.X(1), height: plot.Y(0.3) - plot.Y(waterTop), class: 'fl-blue', opacity: 0.22 }),
      s('path', { d: `M${plot.X(1)} ${plot.Y(6.5)} V${plot.Y(0.3)} H${plot.X(9)} V${plot.Y(6.5)}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4 }),
      s('rect', { x: plot.X(4), y: plot.Y(bottomY + side), width: plot.X(side) - plot.X(0), height: plot.Y(0) - plot.Y(side), rx: 6, class: 'fl-coral', opacity: 0.9 }),
    ];
    if (!sinks) els.push(s('line', { x1: plot.X(3.6), x2: plot.X(6.4), y1: plot.Y(waterTop), y2: plot.Y(waterTop), stroke: 'var(--blue)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
    return els;
  },
  readout: (p) => {
    const rb = param ? p.rho : value;
    return rb > rf ? r`$\rho = ${rb}$: denser than the fluid, so it **sinks**` : r`floats with $\frac{${rb}}{${rf}} = ${Math.round((100 * rb) / rf)}\%$ of its volume underwater`;
  },
  goal, solution, hint,
});

// hydraulic jack: 200 N on a 2 cm piston; force on a large piston of diameter D cm
const jackForce = (D) => 200 * (D / 2) ** 2;
// tank on the ground with water 1 m deep; jet from a hole at height h
const jetRange = (h) => 2 * Math.sqrt(Math.max(0, (1 - h) * h));

export default {
  id: 'fluids',
  subject: 'physics',
  title: 'Fluids',
  level: 'Intermediate',
  cover: 'fluids',
  tagline: 'Pressure, buoyancy, flow, hydraulics and jets: why ships float and hoses spray.',
  description: r`Explore the physics of liquids and gases: why sharp knives cut, why your ears pop underwater, why steel ships float while pebbles sink, why squeezing a hose makes the water go faster, how a small push lifts a car, and how fast water escapes from a tank.`,
  prereq: 'Forces & Newton’s Laws',
  chapters: [
    {
      title: 'Pressure',
      summary: 'Force spread over area.',
      lessons: [
        {
          id: 'pressure',
          title: 'Pressure',
          summary: 'Force per area',
          icon: 'down',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Snowshoes',
              prompt: 'Why do snowshoes stop you sinking into deep snow?',
              choices: [
                { t: 'They spread your weight over a larger area, lowering the pressure', ok: true },
                { t: 'They make you lighter', why: 'Your weight doesn’t change. What changes is how much area it’s spread over.' },
                { t: 'They’re slippery', why: 'Slipperiness doesn’t stop sinking. Spreading the force over a bigger area does.' },
              ],
              explain: r`The same force on a bigger area means less push on each square centimetre of snow. That push per area is **pressure**.`,
            },
            {
              type: 'explain',
              title: 'Pressure',
              body: r`$$P = \frac{F}{A}$$
Pressure is measured in **pascals**: 1 Pa = 1 N/m². That's tiny, so you'll often see kilopascals (kPa).

A sharp knife concentrates force on a tiny edge, so the pressure is huge. A bed of nails spreads your weight over hundreds of points, so no single nail presses hard enough to pierce skin.`,
            },
            {
              type: 'numeric',
              title: 'High heels',
              prompt: 'A 60 kg person balances on one stiletto heel with an area of 1 cm² (0.0001 m²). What pressure does it put on the floor? Give the answer in kPa.',
              unit: 'kPa',
              answer: (60 * 9.8) / 0.0001 / 1000,
              tol: 1,
              wrong: [{ v: 600, tol: 5, why: r`Use the weight in newtons: $mg = 588$ N, not 60.` }, { v: 0.0588, tol: 0.001, why: 'Divide the force by the area. Don’t multiply.' }],
              explain: r`$P = \frac{588 \text{ N}}{0.0001 \text{ m}^2} = 5{,}880{,}000$ Pa $\approx 5880$ kPa. That's dozens of times more than an elephant's foot presses, and why heels can dent wooden floors.`,
            },
            {
              type: 'numeric',
              title: 'Ten metres down',
              prompt: r`How much extra pressure does a diver feel 10 m under the sea? Use $p = \rho g h$ with $\rho = 1{,}000$ kg/m³ (fresh water for simplicity) and $g = 9.8$ m/s². (In kPa.)`,
              unit: 'kPa',
              answer: 1000 * 9.8 * 10 / 1000,
              tol: 0.5,
              wrong: [{ v: 98000, tol: 10, why: r`That’s in pascals. Divide by 1,000 for kPa.` }],
              explain: r`$1000 \times 9.8 \times 10 = 98{,}000$ Pa $\approx 98$ kPa: almost exactly one extra atmosphere for every 10 m of water. At 30 m a diver breathes air at four times surface pressure.`,
            },
            {
              type: 'interactive',
              title: 'Staying on top',
              body: r`An 80 kg walker weighs about 784 N. Soft snow gives way above about **5 kPa** (5,000 N/m²). Find the **smallest** contact area that keeps them on top.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -3, ymax: 2, grid: false, axes: false, maxWidth: 440, height: 220,
                params: { A: { min: 200, max: 3000, step: 10, value: 400, label: 'contact area', color: 'blue', format: (v) => `${v} cm²` } },
                extra: ({ plot, p, s }) => { const P = 784 / (p.A / 1e4), sink = Math.min(2.4, Math.max(0, (P - 5000) / 4000)), w = Math.min(8, 1 + (p.A / 3000) * 7); return [s('rect', { x: plot.X(0), y: plot.Y(0), width: plot.X(10) - plot.X(0), height: plot.Y(-3) - plot.Y(0), class: 'fl-blue-soft' }), s('rect', { x: plot.X(5 - w / 2), y: plot.Y(0.25 - sink), width: plot.X(w) - plot.X(0), height: plot.Y(0) - plot.Y(0.25), rx: 6, class: 'fl-ink' }), s('rect', { x: plot.X(4.6), y: plot.Y(1.9 - sink), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(1.65), rx: 6, class: 'fl-coral' })]; },
                readout: (p) => { const P = 784 / (p.A / 1e4); return `pressure **${(P / 1000).toFixed(2)} kPa** · ${P > 5000.5 ? 'sinks in' : 'stays on top'}`; },
                goal: (p) => p.A === 1570,
                hint: 'A = F / p = 784 / 5000 m²; 1 m² = 10,000 cm².',
                solution: { A: 1570 },
              },
              explain: r`$784 / 5000 = 0.157$ m², about **1,570 cm²**, roughly a pair of snowshoes (a boot sole is only about 300 cm²). The same weight spread over five times the area gives a fifth of the pressure.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The weight of air',
              body: r`At sea level, air pressure is about 101 kPa = 101,000 N/m².`,
              prompt: 'That means the atmosphere presses on every square metre with the weight of about…',
              choices: [
                { t: '10 tonnes', ok: true },
                { t: '10 kilograms', why: r`$101{,}000 \text{ N} \div 9.8 \approx 10{,}300$ kg. That's about 10 tonnes.` },
                { t: '100 grams', why: 'Air pressure is much bigger than it feels.' },
              ],
              explain: r`$\frac{101{,}000 \text{ N}}{9.8} \approx 10{,}000$ kg per square metre. We aren't crushed because the air inside our bodies pushes outward just as hard, and because pressure acts equally in all directions.`,
            },
          ],
          recap: [
            r`Pressure $P = F/A$, measured in pascals (N/m²).`,
            'A small area gives high pressure (knives). A large area gives low pressure (snowshoes).',
            'Air pressure at sea level is about 101 kPa: roughly 10 tonnes per square metre.',
          ],
        },
        {
          id: 'depth',
          title: 'Pressure & Depth',
          summary: 'P = ρgh',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Ears popping',
              prompt: 'Diving to the bottom of a deep pool makes your ears hurt. Why?',
              choices: [
                { t: 'The weight of water above you increases the pressure', ok: true },
                { t: 'The water is colder at the bottom', why: 'The temperature has little to do with it. The pressure rises with depth.' },
                { t: 'There’s less oxygen down there', why: 'Your ears respond to pressure, not oxygen.' },
              ],
              explain: r`The deeper you go, the more water sits above you, pressing down. Your eardrum feels the pressure difference between the water outside and the air inside your ear.`,
            },
            {
              type: 'explain',
              title: 'Pressure grows with depth',
              body: r`A column of fluid of height $h$ and density $\rho$ weighs $\rho g h$ per unit area, so the pressure at depth $h$ is
$$P = P_\text{surface} + \rho g h$$
For water ($\rho = 1000$ kg/m³), every 10 m of depth adds about 98 kPa, roughly **one extra atmosphere**.

Pressure depends only on depth, not on the shape or width of the container. That's why dams are thicker at the bottom.`,
            },
            {
              type: 'numeric',
              title: 'Deep dive',
              prompt: 'What is the total pressure 30 m below the sea surface? (Use ρ = 1000 kg/m³, g = 9.8 m/s², and 101 kPa at the surface.) Give the answer in kPa.',
              unit: 'kPa',
              answer: 101 + (1000 * 9.8 * 30) / 1000,
              tol: 1,
              wrong: [{ v: 294, tol: 1, why: 'That’s the water’s contribution alone. Add the air pressure at the surface.' }, { v: 101, why: 'Pressure increases with depth.' }],
              explain: r`$\rho g h = 1000 \times 9.8 \times 30 = 294{,}000$ Pa $= 294$ kPa. Adding the air above gives about 395 kPa, nearly 4 atmospheres.`,
            },
            {
              type: 'mcq',
              title: 'Hydraulics',
              body: r`Pressure applied to a trapped fluid is transmitted equally throughout it (**Pascal's principle**). A hydraulic lift has a small piston (area 1) and a large piston (area 50).`,
              prompt: 'Push the small piston with 100 N. What force does the large piston exert?',
              cols: 2,
              choices: [
                { t: '5000 N', ok: true },
                { t: '100 N', why: 'The *pressure* is the same everywhere. The force grows with area.' },
                { t: '2 N', why: 'The larger piston has more area, so it gets more force.' },
              ],
              explain: r`Same pressure: $\frac{100}{1} = \frac{F}{50}$, so $F = 5000$ N. The catch: the small piston must move 50 times farther, so the work in equals the work out. That's how car jacks and brakes multiply force.`,
            },
            {
              type: 'interactive',
              title: 'Squeezing a balloon',
              body: r`Every 10 m of sea water adds about one atmosphere of pressure. A diver takes an air-filled balloon down. Its volume shrinks in proportion to $1/P$ (Boyle’s law). Find the depth at which it is squeezed to **one third** of its surface volume.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -42, ymax: 2, grid: false, axes: { ylabel: 'depth (m)', yticks: 10, xticks: 20, yfmt: (v) => String(-v) }, maxWidth: 420, height: 320,
                params: { d: { min: 0, max: 40, step: 0.1, value: 5, label: 'depth', color: 'blue', format: (v) => `${v.toFixed(1)} m` } },
                extra: ({ plot, p, s }) => { const P = 1 + (1025 * 9.8 * p.d) / 101325, r = 1.6 / Math.cbrt(P); return [s('rect', { x: plot.X(0), y: plot.Y(0), width: plot.X(10) - plot.X(0), height: plot.Y(-42) - plot.Y(0), class: 'fl-blue-soft' }), s('ellipse', { cx: plot.X(5), cy: plot.Y(-p.d), rx: (plot.X(r) - plot.X(0)), ry: (plot.X(r) - plot.X(0)) * 1.15, class: 'fl-coral', opacity: 0.85 }), s('ellipse', { cx: plot.X(5), cy: plot.Y(-p.d), rx: plot.X(1.6) - plot.X(0), ry: (plot.X(1.6) - plot.X(0)) * 1.15, fill: 'none', stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' })]; },
                readout: (p) => { const P = 1 + (1025 * 9.8 * p.d) / 101325; return `pressure **${P.toFixed(2)} atm** · balloon at **${(100 / P).toFixed(1)}%** of its surface volume`; },
                goal: (p) => Math.abs(1 + (1025 * 9.8 * p.d) / 101325 - 3) < 0.01,
                hint: 'One third of the volume needs three times the pressure: two extra atmospheres of water.',
                solution: { d: 20.2 },
              },
              explain: r`About **20 m** down the pressure is 3 atmospheres (1 of air plus 2 of water) and the balloon is a third of its size. The first 10 m halve its volume, but going from 30 m to 40 m shrinks it by only a fifth: the biggest changes happen near the surface, which is why divers must ascend slowly at the end.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Odd-shaped vases',
              prompt: 'Three containers of different shapes (wide, narrow and flaring) are filled with water to the same height. Where is the pressure at the bottom greatest?',
              choices: [
                { t: 'It’s the same in all three', ok: true },
                { t: 'In the widest one, which holds the most water', why: 'Pressure depends only on depth. The extra water in a wide container is held up by its walls.' },
                { t: 'In the narrowest one', why: 'Pressure is $\\rho g h$, the same at the same depth.' },
              ],
              explain: r`This "hydrostatic paradox" surprises people. $P = \rho g h$ depends only on the height of fluid above that point. The container's walls support any extra water off to the sides.`,
            },
          ],
          recap: [
            r`$P = P_\text{surface} + \rho g h$: every 10 m of water adds about 1 atmosphere.`,
            'Pressure depends on depth, not on the container’s shape.',
            'Pascal’s principle lets hydraulics multiply force (in exchange for distance).',
          ],
        },
      ],
    },
    {
      title: 'Buoyancy and Flow',
      summary: 'Floating, sinking, and moving fluids.',
      lessons: [
        {
          id: 'archimedes',
          title: 'Archimedes’ Principle',
          summary: 'Why things float',
          icon: 'target',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Steel ships',
              prompt: 'A steel bolt sinks in water, but a steel ship weighing thousands of tonnes floats. Why?',
              choices: [
                { t: 'The ship’s hollow shape displaces a huge volume of water, and the water’s push balances its weight', ok: true },
                { t: 'Ship steel is a special lighter alloy', why: 'It’s ordinary steel. The shape is what matters.' },
                { t: 'Engines keep it up', why: 'Ships float even with their engines off.' },
              ],
              explain: r`What matters is the **average** density of the whole ship, including all the air inside its hull. Shaped into a hollow hull, the steel pushes aside enough water to support its weight.`,
            },
            {
              type: 'explain',
              title: 'Archimedes’ principle',
              body: r`An object in a fluid feels an upward **buoyant force** equal to the **weight of the fluid it displaces**:
$$F_b = \rho_\text{fluid}\, V_\text{displaced}\, g$$
This comes from pressure: the bottom of an object is deeper than its top, so the fluid pushes up harder than it pushes down.

A floating object sinks until it has displaced its own weight of fluid. So the fraction underwater equals the density ratio:
$$\frac{V_\text{under}}{V} = \frac{\rho_\text{object}}{\rho_\text{fluid}}$$`,
              widget: tank({ value: 600 }),
            },
            {
              type: 'numeric',
              title: 'Tip of the iceberg',
              prompt: 'Ice has a density of 917 kg/m³ and seawater 1025 kg/m³. What percentage of an iceberg is underwater?',
              unit: '%',
              answer: (100 * 917) / 1025,
              tol: 0.5,
              wrong: [{ v: 100 - (100 * 917) / 1025, tol: 0.5, why: 'That’s the part above the water. The question asks for the part below.' }],
              explain: r`$\frac{917}{1025} \approx 0.895$, so about **89%** is hidden below the surface. Only the tip shows.`,
            },
            {
              type: 'interactive',
              title: 'Half and half',
              body: r`Choose the block's density so it floats with exactly **half** its volume underwater (in fresh water, 1000 kg/m³).`,
              widget: tank({ value: 300, goal: (p) => p.rho === 500, hint: 'The fraction underwater equals ρ_block ÷ ρ_water.', solution: { rho: 500 } }),
              explain: r`Half underwater means $\frac{\rho}{1000} = \frac12$, so $\rho = 500$ kg/m³, about the density of pine wood.`,
            },
            {
              type: 'numeric',
              title: 'Floating density',
              prompt: r`A block floats in water with 75% of its volume submerged. What is its density, in kg/m³?`,
              unit: 'kg/m³',
              answer: 750,
              wrong: [{ v: 250, why: 'That’s the fraction above water. The submerged fraction matches the density ratio.' }],
              explain: r`A floating object displaces its own weight of water, so the submerged fraction equals the density ratio: $0.75 \times 1000 = 750$ kg/m³, about the density of oak. Measuring how deep something floats is a quick way to find its density.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Weighing underwater',
              prompt: 'A 2 kg rock has a volume of 0.0008 m³. Hanging from a spring scale while fully underwater, what does the scale read? (g = 9.8)',
              unit: 'N',
              answer: 2 * 9.8 - 1000 * 0.0008 * 9.8,
              tol: 0.05,
              wrong: [{ v: 19.6, tol: 0.05, why: 'Underwater, the buoyant force helps hold the rock up.' }, { v: 7.84, tol: 0.05, why: r`That's the buoyant force, $1000 \times 0.0008 \times 9.8$. Subtract it from the weight.` }],
              explain: r`Weight: $2 \times 9.8 = 19.6$ N. Buoyant force: $1000 \times 0.0008 \times 9.8 = 7.84$ N. Scale reading: $19.6 - 7.84 = 11.76$ N. Legend says Archimedes used this kind of idea to test whether a king's crown was pure gold.`,
            },
          ],
          recap: [
            'Buoyant force = weight of the fluid displaced.',
            'Floating objects sink until they displace their own weight. Fraction underwater = ρ_object ÷ ρ_fluid.',
            'Average density decides floating, which is why hollow steel ships float.',
          ],
        },
        {
          id: 'bernoulli',
          title: 'Flow & Bernoulli',
          summary: 'Faster flow, lower pressure',
          icon: 'play',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Thumb on the hose',
              prompt: 'Why does covering part of a garden hose’s opening with your thumb make the water spray faster?',
              choices: [
                { t: 'The same volume of water per second must squeeze through a smaller opening', ok: true },
                { t: 'Your thumb adds pressure to the water', why: 'The tap supplies the flow. The narrower gap forces the same flow to speed up.' },
                { t: 'It heats the water', why: 'Temperature doesn’t change noticeably. This is about the flow rate.' },
              ],
              explain: r`Water doesn't compress, so the volume flowing per second is the same everywhere along the hose. Through a smaller area, it must move faster.`,
            },
            {
              type: 'explain',
              title: 'The continuity equation',
              body: r`For an incompressible fluid flowing through a pipe, the volume flow rate stays constant:
$$A_1 v_1 = A_2 v_2$$
Halve the area and the speed doubles. Rivers speed up through narrow gorges, for the same reason.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -2.5, ymax: 2.5, grid: false, axes: false, height: 220,
                animate: { param: 't', speed: 1, autoplay: true },
                params: { w: { min: 0.3, max: 1.6, step: 0.1, value: 0.6, label: 'narrow width', color: 'blue', format: (v) => v.toFixed(1) } },
                extra: ({ plot, p, s }) => {
                  const halfW = (x) => (x < 3.5 ? 1.6 : x > 6.5 ? 1.6 : x < 4.5 ? 1.6 + (p.w - 1.6) * (x - 3.5) : x > 5.5 ? p.w + (1.6 - p.w) * (x - 5.5) : p.w);
                  const top = [], bot = [];
                  for (let i = 0; i <= 100; i++) { const x = i / 10; top.push(`${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(halfW(x))}`); bot.push(`${i ? 'L' : 'M'}${plot.X(x)} ${plot.Y(-halfW(x))}`); }
                  const els = [s('path', { d: top.join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }), s('path', { d: bot.join(''), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 })];
                  // tracer particles move at speed ∝ 1/width: build travel time τ(x), then invert it
                  const dx = 0.05, taus = [0];
                  for (let x = dx; x <= 10 + 1e-9; x += dx) taus.push(taus[taus.length - 1] + (halfW(x - dx / 2) / 1.6) * dx);
                  const total = taus[taus.length - 1];
                  const xAt = (tau) => {
                    let lo = 0, hi = taus.length - 1;
                    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (taus[mid] < tau) lo = mid; else hi = mid; }
                    return lo * dx;
                  };
                  for (let k = 0; k < 8; k++) {
                    const x = xAt((((p.t * 1.2 + (k * total) / 8) % total) + total) % total);
                    for (let j = -2; j <= 2; j++) els.push(s('circle', { cx: plot.X(x), cy: plot.Y((j / 2.6) * halfW(x)), r: 3.5, class: 'fl-blue', opacity: 0.8 }));
                  }
                  return els;
                },
                readout: (p) => r`width ratio $1.6 : ${p.w.toFixed(1)}$ $\Rightarrow$ the water moves $${f2(1.6 / p.w)}\times$ faster in the narrow section`,
              },
            },
            {
              type: 'explain',
              title: 'Bernoulli’s principle',
              body: r`When a fluid speeds up, its pressure **drops**. Along a streamline, energy is conserved:
$$P + \tfrac12 \rho v^2 + \rho g h = \text{constant}$$
Faster flow means more kinetic energy per volume, so there's less "pressure energy".

You can see this with a shower curtain that billows inward when the shower runs, or two sheets of paper that move **together** when you blow between them.`,
            },
            {
              type: 'mcq',
              title: 'Blow between them',
              prompt: 'You hold two sheets of paper hanging a few centimetres apart and blow hard between them. What happens?',
              cols: 2,
              choices: [
                { t: 'They move toward each other', ok: true },
                { t: 'They fly apart', why: 'Fast-moving air between them has *lower* pressure, so the still air outside pushes them together.' },
              ],
              explain: r`The fast air between the sheets is at lower pressure than the still air outside, so the outside air pushes the sheets together. It surprises almost everyone the first time.`,
            },
            {
              type: 'numeric',
              title: 'A narrower pipe',
              prompt: r`Water flows from a pipe into a section with half the radius. By continuity ($A_1v_1 = A_2v_2$), how many times faster does it flow there?`,
              answer: 4,
              explain: r`Half the radius means a quarter of the area, so the speed is 4 times larger. By Bernoulli, the pressure in the narrow section drops: that’s how a Venturi meter measures flow.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A popular myth',
              body: r`A common explanation of how wings make lift says that air over the curved top must travel farther, so it has to go faster to meet the air from underneath "at the same time" at the back edge.`,
              prompt: 'What’s wrong with this?',
              choices: [
                { t: 'Nothing forces the two streams to meet up. In fact, the air over the top arrives well before the air underneath', ok: true },
                { t: 'Nothing: it’s exactly right', why: 'Wind-tunnel experiments show the top air arrives much earlier. The "equal transit time" idea is a myth.' },
                { t: 'Wings don’t really create lift', why: 'They certainly do! The issue is only with this particular explanation.' },
              ],
              explain: r`The "equal transit time" story is a well-known myth. A wing is shaped and tilted to deflect air **downward**. By Newton's third law, the air pushes the wing up. The air over the top really does speed up and drop in pressure (Bernoulli), and that's part of the same picture, but not because of any need to "meet up". Flat, tilted wings, like paper planes, fly too.`,
            },
          ],
          recap: [
            r`Continuity: $A_1v_1 = A_2v_2$. Narrower pipes mean faster flow.`,
            r`Bernoulli: faster flow means lower pressure ($P + \tfrac12\rho v^2 + \rho g h$ is constant).`,
            'Wings make lift by turning air downward. The “equal transit time” story is a myth.',
          ],
        },
      ],
    },
    {
      title: 'Fluids at Work',
      summary: 'Hydraulics and jets.',
      lessons: [
        {
          id: 'hydraulics',
          title: 'Hydraulics',
          summary: 'Multiplying force with liquid',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Pascal’s principle',
              body: r`Press on a liquid in a closed container and the extra pressure spreads **equally** to every part of it (Blaise Pascal, 1653). Connect a narrow piston to a wide one: the pressure is the same at both, but the force is pressure × area, so
$$\frac{F_2}{F_1} = \frac{A_2}{A_1}$$
A small push on a small piston becomes a huge force on a big one.`,
            },
            {
              type: 'numeric',
              title: 'A garage lift',
              prompt: r`A hydraulic lift has a small piston of area 10 cm² and a large piston of area 2,000 cm². What force on the small piston lifts a 12,000 N car?`,
              unit: 'N',
              answer: 60,
              wrong: [{ v: 2400000, why: 'Divide by the area ratio (200), don’t multiply.' }],
              explain: r`Area ratio $\frac{2000}{10} = 200$, so $\frac{12{,}000}{200} = 60$ N: the weight of a 6 kg bag of shopping.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Size the jack',
              prompt: r`A car jack's small piston is 2 cm across, and you can push on it with 200 N. Find the **smallest** large-piston diameter (to 0.1 cm) that can lift a 1,500 kg car (weight 14,700 N).`,
              widget: {
                kind: 'graph', xmin: 2, xmax: 25, ymin: 0, ymax: 30000, grid: 2, gridY: 5000, height: 260, padL: 56, axes: { xlabel: 'large piston diameter (cm)', ylabel: 'lifting force (N)', xAt: 2 },
                params: { D: { min: 2, max: 25, step: 0.1, value: 10, slider: false } },
                curves: [{ f: (x) => jackForce(x), color: 'violet', width: 3 }, { f: () => 14700, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.D, y: (p) => Math.min(30000, jackForce(p.D)), drag: { x: 'D' }, color: 'teal' }],
                readout: (p) => r`diameter ${p.D.toFixed(1)} cm: force $200 \times \left(\frac{${p.D.toFixed(1)}}{2}\right)^2 = ${Math.round(jackForce(p.D)).toLocaleString('en-GB')}$ N`,
                goal: (p) => jackForce(p.D) >= 14700 && jackForce(p.D - 0.1) < 14700,
                hint: 'Force grows with the square of the diameter ratio.',
                solution: { D: 17.2 },
              },
              explain: r`You need an area ratio of $\frac{14{,}700}{200} = 73.5$, so a diameter ratio of $\sqrt{73.5} \approx 8.6$: about 17.2 cm. The catch? Energy is conserved, so the big piston moves 73.5 times less than the small one. That's why you pump a jack many times to raise a car a few centimetres.`,
            },
            {
              type: 'numeric',
              title: 'The catch',
              prompt: r`In the garage lift (area ratio 200), how far must the small piston move in total to raise the car by 10 cm?`,
              unit: 'm',
              answer: 20,
              wrong: [{ v: 0.0005, tol: 0.0001, why: 'The small piston moves further, not less: 200 × 10 cm.' }],
              explain: r`The liquid volume moved is the same at both ends: $A_1 d_1 = A_2 d_2$, so $d_1 = 200 \times 0.1 = 20$ m (done in many short strokes). Work in = work out: $60 \times 20 = 12{,}000 \times 0.1 = 1{,}200$ J.`,
            },
            {
              type: 'mcq',
              title: 'Car brakes',
              prompt: r`Why must air bubbles be bled out of a car's hydraulic brake lines?`,
              choices: [
                { t: 'Air compresses, so pressing the pedal squashes the bubbles instead of pushing the brake pads', ok: true },
                { t: 'Air makes the fluid rust', why: 'The issue is compressibility, not corrosion.' },
                { t: 'Air is too heavy', why: 'Air is very light; it’s squashy, which is the problem.' },
              ],
              explain: r`Hydraulics relies on liquids being almost incompressible. A bubble acts like a spring, and the pedal feels "spongy". Mechanics bleed the lines to push the air out.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A syringe',
              prompt: r`Your fingers press 20 N on a syringe plunger of area 2 cm². What's the extra pressure in the liquid, in kilopascals?`,
              unit: 'kPa',
              answer: 100,
              wrong: [{ v: 10, why: 'Convert cm² to m²: 2 cm² = 2 × 10⁻⁴ m².' }, { v: 0.1, tol: 0.01, why: 'P = F/A = 20 / 0.0002 Pa.' }],
              explain: r`$\frac{20}{2 \times 10^{-4}} = 100{,}000$ Pa $= 100$ kPa: about one extra atmosphere, from just a firm push. Narrow needles concentrate force, which is why injections go in easily.`,
            },
          ],
          recap: [
            'Pascal: pressure applied to a confined liquid spreads equally.',
            r`Force ratio = area ratio: $F_2/F_1 = A_2/A_1$.`,
            'Energy is conserved: the big piston moves less.',
          ],
        },
        {
          id: 'torricelli',
          title: 'Jets & Draining',
          summary: 'Torricelli’s law',
          icon: 'down',
          steps: [
            {
              type: 'explain',
              title: 'Speed from height',
              body: r`In 1643, Evangelista Torricelli found that water spurting from a hole a depth $d$ below the surface leaves at the speed of something **falling** from that height:
$$v = \sqrt{2gd}$$
It follows from Bernoulli's equation, or energy conservation: each bit of water that leaves trades potential energy for kinetic energy.`,
            },
            {
              type: 'numeric',
              title: 'A leaky barrel',
              prompt: r`A hole is 0.8 m below the water surface in a barrel. How fast does the water squirt out? (m/s, 1 decimal place.)`,
              unit: 'm/s',
              answer: Math.sqrt(2 * 9.8 * 0.8),
              tol: 0.05,
              wrong: [{ v: 15.68, tol: 0.1, why: 'Take the square root of 2gd.' }],
              explain: r`$\sqrt{2 \times 9.8 \times 0.8} \approx 4.0$ m/s, the same speed a stone reaches after falling 0.8 m.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The longest jet',
              prompt: r`A tank standing on the ground holds water 1 m deep. At what height should you drill a hole to make the jet land **furthest** from the tank?`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 1.6, ymin: 0, ymax: 1.2, grid: 0.25, axes: false, maxWidth: 520,
                params: { h: { min: 0.05, max: 0.95, step: 0.05, value: 0.8, label: 'hole height', color: 'blue', format: (v) => `${v.toFixed(2)} m` } },
                extra: ({ plot, p, s }) => {
                  const y0 = p.h, v = Math.sqrt(2 * 9.8 * (1 - p.h)), pts = [];
                  for (let t = 0; t <= 2; t += 0.01) { const x = v * t, y = y0 - 4.9 * t * t; if (y < 0) break; pts.push(`${pts.length ? 'L' : 'M'}${plot.X(x)} ${plot.Y(y)}`); }
                  return [
                    s('line', { x1: plot.X(-1), x2: plot.X(1.6), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--ink)', 'stroke-width': 2 }),
                    s('rect', { x: plot.X(-0.7), y: plot.Y(1), width: plot.X(0) - plot.X(-0.7), height: plot.Y(0) - plot.Y(1), class: 'fl-blue-soft', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('path', { d: pts.join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }),
                    s('circle', { cx: plot.X(jetRange(p.h)), cy: plot.Y(0), r: 5, class: 'fl-coral' }),
                  ];
                },
                readout: (p) => `hole ${p.h.toFixed(2)} m up: jet speed ${Math.sqrt(2 * 9.8 * (1 - p.h)).toFixed(2)} m/s, lands **${jetRange(p.h).toFixed(2)} m** away`,
                goal: (p) => Math.abs(p.h - 0.5) < 1e-6,
                hint: 'Low holes give fast jets but little time to fall; high holes the reverse.',
                solution: { h: 0.5 },
              },
              explain: r`**Halfway down**, at 0.5 m. The range is $2\sqrt{d\,h}$, where $d$ is the depth below the surface (setting the speed) and $h$ the height above the ground (setting the falling time). With $d + h = 1$ m, the product is largest when they're equal, and the jet lands 1 m away, as far as the water is deep. Holes equally far above and below the middle land at the same spot.`,
            },
            {
              type: 'mcq',
              title: 'Slowing down',
              prompt: r`A tall water bottle with a hole near the bottom: does the jet's range stay the same as it empties?`,
              choices: [
                { t: 'No: the water level drops, so the speed and range fall steadily', ok: true },
                { t: 'Yes: the hole’s size doesn’t change', why: 'The speed depends on the depth of water above the hole, which decreases.' },
                { t: 'It speeds up as the bottle gets lighter', why: 'Only the depth above the hole matters, not the bottle’s total weight.' },
              ],
              explain: r`As $d$ falls, $v = \sqrt{2gd}$ falls, so draining slows down. That's why a draining bath takes a while to empty its last few centimetres, and why ancient water clocks needed cleverly shaped vessels to keep time evenly.`,
            },
            { /*anim:fluids*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Watching a tank drain',
              body: r`A tank on a 0.5 m stand starts with water 1 m deep and drains through a small hole at the bottom. Watch the water level and the jet together.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.2, xmax: 3.3, ymin: -0.05, ymax: 1.75, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 12, max: 310, autoplay: true },
                extra: ({ plot, p, s }) => {
                  // the level falls so that √h drops steadily: √h = 1 − kt (the tank empties after 1/k = 290 s here)
                  const k = 1 / 290, h = Math.max(0, (1 - k * p.t) ** 2), base = 0.5, els = [], v = Math.sqrt(2 * 9.8 * h);
                  els.push(s('line', { x1: plot.X(-0.2), x2: plot.X(3.3), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 2 }));
                  els.push(s('rect', { x: plot.X(0.1), y: plot.Y(base), width: plot.X(0.5) - plot.X(0), height: plot.Y(0) - plot.Y(base), class: 'fl-muted', opacity: 0.4 }));
                  els.push(s('rect', { x: plot.X(0), y: plot.Y(base + h), width: plot.X(0.7) - plot.X(0), height: plot.Y(base) - plot.Y(base + h), class: 'fl-blue', opacity: 0.55 }));
                  els.push(s('path', { d: `M${plot.X(0)} ${plot.Y(base + 1.1)}V${plot.Y(base)}H${plot.X(0.7)}V${plot.Y(base + 1.1)}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
                  if (h > 0.001) {
                    // the jet: leaves sideways at v = √(2gh) from just above the base, falls 0.5 m
                    const pts = [];
                    for (let i = 0; i <= 40; i++) { const tt = (Math.sqrt((2 * (base + 0.03)) / 9.8) * i) / 40; pts.push([0.7 + v * tt, base + 0.03 - 4.9 * tt * tt]); }
                    els.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
                  }
                  return els;
                },
                readout: (p) => { const k = 1 / 290, h = Math.max(0, (1 - k * Math.min(p.t, 290)) ** 2); return `after ${fix(Math.min(p.t, 290), 0)} s: depth ${fix(100 * h, 0)} cm · jet speed ${fix(Math.sqrt(2 * 9.8 * h), 2)} m/s · lands ${fix(2 * Math.sqrt(h * 0.53), 2)} m away`; },
              },
              after: r`The jet's speed is $\sqrt{2gh}$, so as the water gets shallower the jet weakens, lands closer, and the level falls ever more slowly. Halfway in **time**, three quarters of the water has already gone: the depth falls as $(1 - kt)^2$, a parabola in time. That's why the last bit of a draining bath seems to take forever, and why water clocks (clepsydras) used specially shaped vessels to make the level fall evenly.`,
            },
            {
              type: 'numeric',
              title: 'Half the height',
              prompt: r`The time for a tank to drain through a small hole is proportional to $\sqrt{h}$, where $h$ is the starting water depth. If the tank starts half as full, by what factor does the draining time change? (3 decimal places.)`,
              answer: Math.sqrt(0.5),
              tol: 0.001,
              explain: r`$\sqrt{0.5} \approx 0.707$: half the water drains in 71% of the time, because the last water trickles out slowly with little pressure behind it.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Flow rate',
              prompt: r`Water leaves a 1 cm² hole at the bottom of a tank where the water is 1.25 m deep. How many litres flow out per second? (Flow = area × speed; 2 decimal places.)`,
              unit: 'L/s',
              answer: 1e-4 * Math.sqrt(2 * 9.8 * 1.25) * 1000,
              tol: 0.01,
              wrong: [{ v: 1e-4 * Math.sqrt(2 * 9.8 * 1.25), tol: 0.00001, why: 'That’s in m³/s; 1 m³ = 1,000 litres.' }],
              explain: r`$v = \sqrt{2 \times 9.8 \times 1.25} \approx 4.95$ m/s, so flow $= 10^{-4} \times 4.95 \approx 4.95 \times 10^{-4}$ m³/s $\approx 0.49$ L/s. (Real holes give a bit less, because the jet narrows just after leaving: the "vena contracta".)`,
            },
          ],
          recap: [
            r`Torricelli: outflow speed $v = \sqrt{2gd}$.`,
            'Jets slow as the tank drains, because the depth falls.',
            'Flow rate = hole area × speed.',
          ],
        },
        {
          id: 'siphons',
          title: 'Siphons',
          summary: 'Water flowing uphill, for a while',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'Over the top',
              body: r`Fill a tube with water, put one end in a tank and the other end lower down outside it, and water flows up over the rim and out: a **siphon**. It keeps flowing as long as the outlet is below the water surface in the tank.

Bernoulli’s equation gives the outlet speed: if the outlet is a height $h$ below the tank’s surface,
$$v = \sqrt{2gh},$$
just as if the water had fallen freely through $h$.`,
            },
            {
              type: 'numeric',
              title: 'Draining a fish tank',
              prompt: r`A siphon’s outlet is 0.8 m below the water surface in a tank. How fast does water leave it (ignoring friction)? (m/s, 2 decimal places.)`,
              unit: 'm/s',
              answer: Math.sqrt(2 * 9.81 * 0.8),
              tol: 0.02,
              explain: r`$v = \sqrt{2 \times 9.81 \times 0.8} \approx 3.96$ m/s. The height of the hump in between doesn’t affect the speed, as long as the siphon keeps working.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How high can it climb?',
              prompt: r`The pressure is lowest at the top of the siphon: $P_{\text{top}} = P_{\text{atm}} - \rho g\,(H + h)$, where $H$ is the hump’s height above the tank surface and the outlet is $h = 2$ m below it (the extra term pays for the flow speed). If $P_{\text{top}}$ falls to water’s vapour pressure (2.3 kPa), the water boils into bubbles and the flow breaks. Find the highest hump that still works.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -3, ymax: 11, grid: false, axes: false, maxWidth: 360, height: 360,
                params: { H: { min: 0.5, max: 10, step: 0.01, value: 4, label: 'hump height H', color: 'blue', format: (v) => `${v.toFixed(2)} m` } },
                extra: ({ plot, p, s }) => { const Pt = 101.3 - 9.81 * (p.H + 2), ok = Pt > 2.3; return [s('rect', { x: plot.X(0.5), y: plot.Y(0), width: plot.X(3) - plot.X(0), height: plot.Y(-2.5) - plot.Y(0), class: 'fl-blue-soft', stroke: 'var(--blue)' }), s('path', { d: `M${plot.X(2.5)} ${plot.Y(-2)} L${plot.X(2.5)} ${plot.Y(p.H)} Q${plot.X(4.5)} ${plot.Y(p.H + 1)} ${plot.X(6.5)} ${plot.Y(p.H)} L${plot.X(6.5)} ${plot.Y(-2)}`, fill: 'none', stroke: ok ? 'var(--blue)' : 'var(--error)', 'stroke-width': 6, 'stroke-linecap': 'round' }), s('line', { x1: plot.X(0), x2: plot.X(10), y1: plot.Y(10.33), y2: plot.Y(10.33), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' }), s('text', { x: plot.X(9.8), y: plot.Y(10.6), 'text-anchor': 'end', class: 'lbl', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: '10.3 m: a water barometer' })]; },
                readout: (p) => { const Pt = 101.3 - 9.81 * (p.H + 2); return `pressure at the top **${Pt.toFixed(1)} kPa** · ${Pt > 2.3 ? 'flowing' : '**the water boils and the siphon breaks**'}`; },
                goal: (p) => Math.abs(p.H - 8.09) < 0.05,
                hint: r`Solve $101.3 - 9.81(H + 2) = 2.3$ (pressures in kPa).`,
                solution: { H: 8.09 },
              },
              explain: r`$H + 2 = \frac{99}{9.81} \approx 10.1$ m, so $H \approx 8.1$ m. Even with no flow, a siphon can never lift water more than about 10 m above the tank, the height of a water barometer: the atmosphere pushes the water up, and it can only push so hard.`,
            },
            {
              type: 'mcq',
              title: 'What pushes it up?',
              prompt: r`What pushes the water up the rising side of an ordinary siphon?`,
              choices: [
                { t: 'Atmospheric pressure on the tank’s surface, helped by the falling water pulling the column along', ok: true },
                { t: 'Suction created by the tube itself', why: '"Suction" is just a lower pressure. The push comes from the atmosphere on the open water surface.' },
                { t: 'Capillary action', why: 'Capillarity only lifts water millimetres in narrow tubes; siphons work with wide hoses.' },
              ],
              explain: r`The longer, falling side outweighs the rising side, lowering the pressure at the top, and air pressure on the tank pushes water up to replace it. Under special conditions (very clean, degassed water) siphons can work slightly beyond the barometric limit because water molecules cling together, a subject of lively debate among physicists.`,
            },
            {
              type: 'numeric',
              title: 'Emptying the tank',
              prompt: r`The siphon tube has a cross-section of 1 cm² and the water leaves at 3.96 m/s. Roughly how many minutes does it take to drain 100 litres (assuming the speed stays constant)? (1 decimal place.)`,
              unit: 'min',
              answer: 100 / 0.396 / 60,
              tol: 0.1,
              explain: r`Flow $= 10^{-4}\ \text{m}^2 \times 3.96\ \text{m/s} = 3.96 \times 10^{-4}$ m³/s $= 0.396$ L/s, so 100 L takes about 250 s $\approx$ **4.2 minutes**. (In reality it slows as the level drops and $h$ shrinks.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A mercury siphon',
              prompt: r`Mercury is 13.6 times denser than water, so the atmosphere can hold up only a 76 cm column of it. Ignoring flow and vapour pressure, what is the highest hump (in cm) a mercury siphon could have?`,
              unit: 'cm',
              answer: 76,
              tol: 0.5,
              explain: r`The same reasoning as the barometer: atmospheric pressure supports at most 76 cm of mercury, so the hump can’t exceed **76 cm** above the surface. Water, 13.6 times lighter, gets about 10.3 m.`,
            },
          ],
          recap: [
            r`A siphon’s outlet speed is $\sqrt{2gh}$, set by the drop below the tank surface.`,
            'Atmospheric pressure pushes the water over the top.',
            'The hump can’t exceed about 10 m for water (the barometer limit).',
          ],
        },
      ],
    },
  ],
};
