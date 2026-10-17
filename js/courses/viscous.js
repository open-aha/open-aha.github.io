import { sig } from '../lib/svg.js';

const r = String.raw;
const MU_AIR = 1.8e-5;
const vStokes = (rm) => (2 * (1000 - 1.2) * 9.8 * rm * rm) / (9 * MU_AIR); // water droplet in air
const fmtTime = (s) => (s < 120 ? `${s.toFixed(0)} seconds` : s < 7200 ? `${(s / 60).toFixed(0)} minutes` : s < 172800 ? `${(s / 3600).toFixed(1)} hours` : `${(s / 86400).toFixed(0)} days`);

const pipeRe = (v) => (1000 * v * 0.02) / 0.001; // water in a 2 cm pipe
const ketchupMu = (g) => 20 * g ** (0.3 - 1); // power-law fluid, K = 20 Pa·sⁿ, n = 0.3
const shearForce = (v) => (0.08 * 0.5 * v) / 0.001; // oil 0.08 Pa·s, plate 0.5 m², gap 1 mm

export default {
  id: 'viscous',
  subject: 'physics',
  title: 'Viscous Flow',
  level: 'Advanced',
  cover: 'viscous',
  tagline: 'Honey, blood vessels, bacteria and clouds: the physics of sticky fluids.',
  description: r`Viscosity is a fluid's internal friction. Learn why narrowing an artery slightly cuts blood flow dramatically, how one number (the Reynolds number) predicts whether flow is smooth or turbulent, why bacteria live in a world without momentum, why cloud droplets float instead of falling, why ketchup won't pour until shaken, and how engines float on films of oil.`,
  prereq: 'Fluids',
  chapters: [
    {
      title: 'Sticky Fluids',
      summary: 'Viscosity and flow in pipes.',
      lessons: [
        {
          id: 'viscosity',
          title: 'What Is Viscosity?',
          summary: 'Internal friction',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Layers sliding past layers',
              body: r`Pour honey and water side by side: the honey oozes. Picture a fluid as thin layers sliding over one another. **Viscosity** $\mu$ measures how much force it takes to keep the layers sliding: the stress needed is proportional to how fast the speed changes from layer to layer.

| Fluid | Viscosity (Pa·s) |
|---|---|
| Air | 0.000018 |
| Water | 0.001 |
| Olive oil | about 0.08 |
| Honey | about 2–10 |

Honey is thousands of times more viscous than water.`,
            },
            {
              type: 'mcq',
              title: 'Warm syrup',
              prompt: r`Why does warm syrup pour much faster than cold syrup?`,
              choices: [
                { t: 'Its molecules move more energetically and slip past each other more easily, so its viscosity drops', ok: true },
                { t: 'Warm syrup is denser', why: 'Density barely changes. The big change is in viscosity.' },
                { t: 'Gravity is stronger on warm things', why: 'Gravity doesn’t depend on temperature. The syrup’s internal friction decreases.' },
              ],
              explain: r`For liquids, viscosity falls steeply with temperature (that's why engine oil is rated for cold starts). Curiously, gases do the opposite: hotter gases are **more** viscous, because faster molecules carry momentum between layers more effectively.`,
            },
            {
              type: 'numeric',
              title: 'Honey versus water',
              prompt: r`Taking honey's viscosity as 5 Pa·s and water's as 0.001 Pa·s, how many times more viscous is honey?`,
              unit: '×',
              answer: 5000,
              relTol: 0.01,
              wrong: [{ v: 500, why: '5 ÷ 0.001 = 5,000.' }],
              explain: r`$\frac{5}{0.001} = 5{,}000$. Liquids span an enormous range: pitch (tar) is about 100 billion times more viscous than water, so much that a famous experiment in Queensland has seen only nine drops fall since 1927.`,
            },
            {
              type: 'numeric',
              title: 'Shearing honey',
              prompt: r`Honey (viscosity about 10 Pa·s) fills a 1 mm gap between two plates; the top plate slides at 0.1 m/s. The shear stress is $\tau = \mu \frac{v}{h}$. What is it, in pascals?`,
              unit: 'Pa',
              answer: 10 * 0.1 / 1e-3,
              tol: 1,
              wrong: [{ v: 1, why: r`Convert the gap to metres: 1 mm = 0.001 m.` }],
              explain: r`$10 \times \frac{0.1}{0.001} = 1{,}000$ Pa: pushing a 10 cm × 10 cm plate would need 10 N. Water, 10,000 times less viscous, would need only a millinewton.`,
            },
            {
              type: 'interactive',
              title: 'Sliding over honey',
              body: r`A 0.01 m² plate slides at 0.1 m/s over a layer of honey ($\eta \approx 10$ Pa·s) on a fixed floor. The fluid’s speed rises steadily from 0 at the floor to 0.1 m/s at the plate, and the drag is $F = \frac{\eta A v}{d}$. Find the honey depth that makes the drag exactly **1 N**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -2, ymax: 32, grid: false, axes: false, maxWidth: 420, height: 300,
                params: { d: { min: 2, max: 30, step: 0.5, value: 4, label: 'honey depth', color: 'amber', format: (v) => `${v.toFixed(1)} mm` } },
                extra: ({ plot, p, s, arrow }) => { const out = [s('rect', { x: plot.X(1), y: plot.Y(p.d), width: plot.X(9) - plot.X(1), height: plot.Y(0) - plot.Y(p.d), class: 'fl-amber-soft' }), s('rect', { x: plot.X(0.5), y: plot.Y(0), width: plot.X(9.5) - plot.X(0.5), height: plot.Y(-1.5) - plot.Y(0), class: 'fl-ink' }), s('rect', { x: plot.X(1), y: plot.Y(p.d + 1.5), width: plot.X(9) - plot.X(1), height: plot.Y(p.d) - plot.Y(p.d + 1.5), class: 'fl-blue' })]; const n = Math.max(2, Math.min(7, Math.round(p.d / 3))); for (let i = 1; i <= n; i++) { const y = (p.d * i) / (n + 1); out.push(arrow(plot.X(3), plot.Y(y), plot.X(3 + (5 * y) / p.d), plot.Y(y), { color: 'var(--coral)', width: 2.5 })); } return out; },
                readout: (p) => `drag force **${(10 / p.d).toFixed(2)} N** · velocity changes by ${(100 / p.d).toFixed(1)} mm/s per mm of depth`,
                goal: (p) => p.d === 10,
                hint: 'd = ηAv / F = 10 × 0.01 × 0.1 / 1 metres.',
                solution: { d: 10 },
              },
              explain: r`$d = \frac{10 \times 0.01 \times 0.1}{1} = 0.01$ m: **10 mm**. A thinner layer means a steeper change of speed across it, and so more drag. This is why a thin film of oil between engine parts must be just thick enough: too thin and the shear forces (and wear) shoot up.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Gases and heat',
              prompt: r`A gas gets more viscous as it warms up, while a liquid gets runnier. Which explanation fits gases?`,
              choices: [
                { t: 'Faster molecules travel between layers more often, carrying momentum across and coupling the layers more strongly', ok: true },
                { t: 'Gas molecules stick together more when hot', why: 'Gas molecules barely interact; their viscosity comes from momentum carried between layers.' },
                { t: 'Hot gases are denser', why: 'At constant pressure, hot gases are less dense.' },
              ],
              explain: r`In a liquid, molecules must squeeze past their neighbours, which heat makes easier. In a gas, molecules fly freely between layers, carrying momentum with them, and heat makes them fly faster. James Clerk Maxwell predicted that gas viscosity doesn't depend on pressure, and confirmed it experimentally in 1866.`,
            },
          ],
          recap: [
            'Viscosity measures a fluid’s resistance to layers sliding past each other.',
            'Honey is thousands of times more viscous than water; air far less.',
            'Liquids get runnier when heated; gases get more viscous.',
          ],
        },
        {
          id: 'pipes',
          title: 'Flow in Pipes',
          summary: 'The fourth-power law',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A parabolic profile',
              body: r`Fluid touching a pipe's wall doesn't move (the **no-slip** condition), and the flow is fastest at the centre. For smooth, slow flow, the speed across the pipe forms a **parabola**. Change the pipe's radius, keeping the pressure push the same.`,
              widget: {
                kind: 'graph', xmin: -1.2, xmax: 1.2, ymin: -0.3, ymax: 1.25, grid: false, axes: false, height: 280,
                params: { R: { min: 0.4, max: 1, step: 0.1, value: 1, label: 'pipe radius', color: 'teal', format: (v) => `${(v * 100).toFixed(0)}%` } },
                extra: ({ plot, p, s, arrow }) => {
                  const els = [];
                  const vmax = (rr) => p.R * p.R - rr * rr; // ∝ (R² − r²)
                  for (const sgn of [-1, 1]) els.push(s('line', { x1: plot.X(sgn * p.R), x2: plot.X(sgn * p.R), y1: plot.Y(-0.25), y2: plot.Y(1.2), stroke: 'var(--ink)', 'stroke-width': 4 }));
                  let d = '';
                  for (let i = 0; i <= 50; i++) {
                    const x = -p.R + (2 * p.R * i) / 50;
                    d += `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(vmax(x)).toFixed(1)}`;
                  }
                  els.push(s('path', { d: d + ` L${plot.X(p.R)} ${plot.Y(0)} L${plot.X(-p.R)} ${plot.Y(0)} Z`, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 3 }));
                  for (let i = 1; i < 8; i++) {
                    const x = -p.R + (2 * p.R * i) / 8, v = vmax(x);
                    if (v > 0.03) els.push(arrow(plot.X(x), plot.Y(0), plot.X(x), plot.Y(v), { color: 'var(--blue)', width: 2.5, head: 8 }));
                  }
                  els.push(s('text', { x: plot.X(0), y: plot.Y(-0.18), class: 'tick', 'text-anchor': 'middle', text: 'speed profile across the pipe' }));
                  return els;
                },
                readout: (p) => r`flow rate $\propto R^4 = ${(p.R ** 4 * 100).toFixed(1)}\%$ of the full-width pipe`,
              },
              after: r`Halving the radius cuts the flow to $\frac{1}{16}$. This is **Poiseuille's law** (Jean Poiseuille, a physician studying blood flow, 1840s):
$$Q = \frac{\pi R^4\, \Delta P}{8 \mu L}$$
One factor $R^2$ comes from the area, and another $R^2$ from the centre speed, which also grows with the width of the pipe.`,
            },
            {
              type: 'numeric',
              title: 'A narrowed artery',
              prompt: r`Fatty deposits narrow an artery to 80% of its original radius. If the blood pressure stays the same, what percentage of the original flow gets through? (Nearest whole percent.)`,
              unit: '%',
              answer: 41,
              tol: 0.6,
              wrong: [{ v: 80, why: r`Flow depends on $R^4$, not $R$: $0.8^4$.` }, { v: 64, why: r`That's $0.8^2$, the change in area. Poiseuille's law has $R^4$.` }],
              explain: r`$0.8^4 \approx 0.41$, so only about **41%** of the flow. To restore it, the heart would need to push about 2.4 times the pressure difference, one reason why narrowed arteries are so serious.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Double the flow',
              prompt: r`A 12 mm garden hose delivers too little water. With the same pressure and length, find the **smallest** hose diameter (to 0.1 mm) that delivers at least **twice** the flow.`,
              widget: {
                kind: 'graph', xmin: 10, xmax: 20, ymin: 0, ymax: 8, grid: 1, gridY: 1, height: 250, axes: { xlabel: 'hose diameter (mm)', ylabel: 'flow (× the 12 mm hose)', xAt: 10 },
                params: { d: { min: 10, max: 20, step: 0.1, value: 13, slider: false } },
                curves: [{ f: (x) => (x / 12) ** 4, color: 'blue', width: 3 }, { f: () => 2, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.d, y: (p) => (p.d / 12) ** 4, drag: { x: 'd' }, color: 'violet' }],
                readout: (p) => r`${p.d.toFixed(1)} mm: flow $\left(\frac{${p.d.toFixed(1)}}{12}\right)^4 = ${((p.d / 12) ** 4).toFixed(2)}\times$`,
                goal: (p) => (p.d / 12) ** 4 >= 2 && ((p.d - 0.1) / 12) ** 4 < 2,
                hint: r`You need $\left(\frac{d}{12}\right)^4 = 2$, so $d = 12 \times 2^{1/4}$.`,
                solution: { d: 14.3 },
              },
              explain: r`$12 \times 2^{1/4} \approx 14.3$ mm: just 19% wider doubles the flow. The $R^4$ law works both ways: small changes in diameter have huge effects.`,
            },
            {
              type: 'numeric',
              title: 'Fastest in the middle',
              prompt: r`In steady flow through a pipe, the velocity profile is a parabola, and the speed at the centre is exactly **twice** the average. If water flows at an average of 0.5 m/s, how fast is it at the centre?`,
              unit: 'm/s',
              answer: 1,
              tol: 0.01,
              explain: r`$2 \times 0.5 = 1$ m/s, while the water touching the wall doesn’t move at all. Doctors use this when interpreting blood-flow measurements, which can report either the peak or the average speed.`,
            },
            {
              type: 'numeric',
              title: 'How much water?',
              prompt: r`Water flows at an average speed of 0.5 m/s through a pipe 2 cm across. The flow rate is the average speed times the cross-section area. How many litres flow per second? (2 decimal places.)`,
              unit: 'L/s',
              answer: Math.PI * 0.01 ** 2 * 0.5 * 1000,
              tol: 0.005,
              wrong: [{ v: Math.PI * 0.02 ** 2 * 0.5 * 1000, tol: 0.01, why: 'Use the radius (1 cm), not the diameter, in the area πr².' }],
              explain: r`Area $= \pi \times 0.01^2 \approx 3.14 \times 10^{-4}$ m², so the flow is $3.14 \times 10^{-4} \times 0.5 \approx 1.57 \times 10^{-4}$ m³/s $\approx$ **0.16 L/s**: about a bucket every minute. Use the average speed, not the centre-line speed, which is twice as big.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Pushing harder',
              prompt: r`If a pipe's radius is halved, by what factor must the pressure difference increase to keep the same flow?`,
              unit: '×',
              answer: 16,
              wrong: [{ v: 4, why: r`Flow $\propto R^4 \Delta P$: halving $R$ cuts flow by 16, so pressure must rise 16-fold.` }],
              explain: r`$Q \propto R^4\,\Delta P$, so $\Delta P$ must rise by $2^4 = 16$. Your body adjusts blood flow to organs by tiny changes in the radius of small arteries.`,
            },
          ],
          recap: [
            'Fluid at the wall is stationary; smooth pipe flow has a parabolic speed profile.',
            r`Poiseuille: flow $\propto R^4$.`,
            'Small narrowings cause large drops in flow.',
          ],
        },
      ],
    },
    {
      title: 'Smooth or Turbulent?',
      summary: 'The Reynolds number and tiny swimmers.',
      lessons: [
        {
          id: 'reynolds',
          title: 'The Reynolds Number',
          summary: 'Inertia versus viscosity',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'One number to rule them',
              body: r`In 1883, Osborne Reynolds injected a thin stream of dye into water flowing through a glass pipe. At low speeds, the dye stayed in a neat line (**laminar** flow). Above a certain speed, it suddenly burst into swirls (**turbulent** flow).

He found that what matters is a single combination, now called the **Reynolds number**:
$$Re = \frac{\rho\, v\, L}{\mu}$$
where $\rho$ is density, $v$ speed, $L$ a typical size and $\mu$ viscosity. It compares the fluid's tendency to keep moving (inertia) with viscous damping. In a pipe, flow is laminar below about $Re \approx 2000$ and becomes turbulent above a few thousand.`,
            },
            {
              type: 'numeric',
              title: 'A swimmer',
              prompt: r`A person (size about 2 m) swims at 1 m/s through water ($\rho = 1000$ kg/m³, $\mu = 0.001$ Pa·s). What is the Reynolds number? Give it in millions.`,
              unit: 'million',
              answer: 2,
              tol: 0.02,
              wrong: [{ v: 2000, why: r`$Re = \frac{1000 \times 1 \times 2}{0.001} = 2{,}000{,}000$, which is 2 million.` }],
              explain: r`$Re = \frac{1000 \times 1 \times 2}{0.001} = 2 \times 10^6$. Inertia utterly dominates: stop kicking and you glide for a metre or so.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Where turbulence begins',
              prompt: r`Water flows through a 2 cm pipe. Find the speed at which the Reynolds number reaches **2,000**, where laminar flow starts to give way to turbulence.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.3, ymin: 0, ymax: 6000, grid: 0.05, gridY: 1000, height: 250, padL: 52, axes: { xlabel: 'speed (m/s)', ylabel: 'Reynolds number', xfmt: (v) => v.toFixed(2) },
                params: { v: { min: 0.01, max: 0.3, step: 0.005, value: 0.25, slider: false } },
                curves: [{ f: (x) => pipeRe(x), color: 'violet', width: 3 }, { f: () => 2000, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.v, y: (p) => pipeRe(p.v), drag: { x: 'v' }, color: 'teal' }],
                readout: (p) => r`$v = ${p.v.toFixed(3)}$ m/s: $Re = ${Math.round(pipeRe(p.v))}$ ${pipeRe(p.v) < 2000 ? '(laminar)' : pipeRe(p.v) > 4000 ? '(turbulent)' : '(transition)'}`,
                goal: (p) => Math.abs(pipeRe(p.v) - 2000) < 1,
                hint: r`Solve $\frac{1000 \times v \times 0.02}{0.001} = 2000$.`,
                solution: { v: 0.1 },
              },
              explain: r`Just **0.1 m/s**, a gentle trickle. Most household water flow is turbulent. Open a tap very slightly and the stream is clear and glassy (laminar); open it more and it goes ragged (turbulent).`,
            },
            {
              type: 'mcq',
              title: 'Dimpled golf balls',
              prompt: r`A dimpled golf ball flies about twice as far as a smooth one. How do the dimples help?`,
              choices: [
                { t: 'They make the thin layer of air next to the ball turbulent, which clings on longer and leaves a smaller wake, cutting drag', ok: true },
                { t: 'They make the ball lighter', why: 'The mass difference is negligible; the effect is aerodynamic.' },
                { t: 'They make the air flow smoother everywhere', why: 'The opposite: they deliberately trip the boundary layer into turbulence.' },
              ],
              explain: r`A turbulent boundary layer has more energy and stays attached further round the back of the ball, shrinking the low-pressure wake. This "drag crisis" can cut drag roughly in half at golf-ball speeds.`,
            },
            {
              type: 'numeric',
              title: 'Water in a pipe',
              prompt: r`Water ($\rho = 1000$ kg/m³, $\mu = 0.001$ Pa·s) flows at 1 m/s through a pipe 2 cm across. What is the Reynolds number $\frac{\rho v d}{\mu}$?`,
              answer: 20000,
              explain: r`$\frac{1000 \times 1 \times 0.02}{0.001} = 20{,}000$, far above about 2,000, so household plumbing flow is usually turbulent.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A bacterium',
              prompt: r`A bacterium 2 micrometres long ($2 \times 10^{-6}$ m) swims at 30 micrometres per second ($3 \times 10^{-5}$ m/s) through water. What is its Reynolds number? Give it in units of $10^{-5}$.`,
              unit: r`$\times 10^{-5}$`,
              answer: 6,
              tol: 0.05,
              wrong: [{ v: 60, why: r`$1000 \times 3 \times 10^{-5} \times 2 \times 10^{-6} / 10^{-3} = 6 \times 10^{-5}$.` }],
              explain: r`$Re = \frac{1000 \times 3 \times 10^{-5} \times 2 \times 10^{-6}}{10^{-3}} = 6 \times 10^{-5}$: about 30 billion times smaller than for the swimmer. For the bacterium, water is like thick tar.`,
            },
          ],
          recap: [
            r`Reynolds number $Re = \rho v L / \mu$ compares inertia with viscosity.`,
            'Low Re: smooth, laminar flow. High Re: turbulence.',
            'Swimmers live at Re ~ 10⁶; bacteria at Re ~ 10⁻⁵.',
          ],
        },
        {
          id: 'lowre',
          title: 'Life at Low Reynolds Number',
          summary: 'A world without coasting',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'No momentum',
              body: r`In a famous 1976 lecture, physicist Edward Purcell described life for a bacterium. At $Re \approx 10^{-5}$, inertia is irrelevant: if a bacterium stops swimming, it coasts for a distance smaller than the width of an atom, in a few microseconds. Motion stops the instant the pushing stops.

In this world, flows are also **reversible**: run the motion backwards and everything retraces its path. Stir dye into syrup slowly, then un-stir it, and the dye blob reassembles.`,
            },
            {
              type: 'mcq',
              title: 'The scallop theorem',
              prompt: r`A scallop swims by opening its shell slowly and closing it quickly. Purcell showed that a microscopic scallop, at low Reynolds number, couldn't get anywhere this way. Why?`,
              choices: [
                { t: 'At low Re only the shape of the motion matters, not its speed: closing undoes exactly what opening did', ok: true },
                { t: 'Microscopic scallops are too weak', why: 'Strength isn’t the issue. Any back-and-forth motion just retraces its path at low Re, however hard you push.' },
                { t: 'Water is too thin for small creatures', why: 'It’s the opposite: to a microbe, water is extremely viscous. That’s what makes reciprocal motion useless.' },
              ],
              explain: r`With no inertia, moving slowly or quickly makes no difference: a reciprocal motion (one that just reverses itself) gives zero net progress. So microbes use **non-reciprocal** motions. Bacteria such as *E. coli* spin corkscrew-shaped flagella with tiny rotary motors, and many single-celled organisms beat flexible hair-like cilia in asymmetric strokes.`,
            },
            {
              type: 'numeric',
              title: 'Swimming in honey',
              prompt: r`Imagine swimming through honey ($\mu = 10$ Pa·s, $\rho = 1400$ kg/m³) at 0.1 m/s, with a size of 2 m. What's your Reynolds number? (Nearest whole number.)`,
              answer: 28,
              tol: 0.6,
              wrong: [{ v: 2800000, why: 'Use the honey’s viscosity, 10 Pa·s, not water’s.' }],
              explain: r`$Re = \frac{1400 \times 0.1 \times 2}{10} = 28$, still far above a bacterium's $10^{-5}$. To feel what a bacterium feels, you'd have to swim through something like setting concrete, moving centimetres per week.`,
            },
            {
              type: 'numeric',
              title: 'A sperm cell’s Reynolds number',
              prompt: r`A human sperm cell, about 50 µm long, swims at about 50 µm/s through water (density 1,000 kg/m³, viscosity $10^{-3}$ Pa·s). What is its Reynolds number $Re = \frac{\rho v L}{\mu}$? (Give a decimal like 2.5e-3.)`,
              answer: 1000 * 5e-5 * 5e-5 / 1e-3,
              relTol: 0.05,
              explain: r`$Re = \frac{1000 \times 5 \times 10^{-5} \times 5 \times 10^{-5}}{10^{-3}} = 2.5 \times 10^{-3}$: bigger than a bacterium's, but still far below 1. Inertia is negligible, so the cell must keep beating its tail in a whip-like, non-reciprocal wave to make any progress. For us, swimming at $Re \approx 10^6$, coasting is easy.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'From bacteria to whales',
              body: r`The Reynolds number $Re = \frac{\rho v L}{\eta}$ compares inertia with viscosity. Pick a swimmer in water and see where it lands on this logarithmic scale.`,
              widget: {
                kind: 'graph', xmin: -6, xmax: 9.5, ymin: 0, ymax: 3, grid: false, height: 220, axes: { xlabel: 'Reynolds number (power of 10)', xticks: 2, yticks: 10 },
                params: { k: { min: 0, max: 5, step: 1, value: 0, label: 'swimmer', color: 'violet', format: (v) => ['bacterium', 'sperm cell', 'water flea', 'goldfish', 'human swimmer', 'blue whale'][v] } },
                extra: ({ plot, p, s }) => { const C = [['bacterium', 2e-6, 3e-5], ['sperm', 5e-5, 1e-4], ['water flea', 1e-3, 1e-2], ['goldfish', 0.05, 0.2], ['swimmer', 1.8, 1.5], ['whale', 25, 8]], out = [s('rect', { x: plot.X(-6), y: plot.Y(3), width: plot.X(0) - plot.X(-6), height: plot.Y(0) - plot.Y(3), class: 'fl-teal-soft', opacity: 0.6 }), s('rect', { x: plot.X(3), y: plot.Y(3), width: plot.X(9.5) - plot.X(3), height: plot.Y(0) - plot.Y(3), class: 'fl-coral-soft', opacity: 0.6 }), s('text', { x: plot.X(-3), y: plot.Y(2.6), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--teal)', text: 'viscosity rules' }), s('text', { x: plot.X(6.2), y: plot.Y(2.6), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--coral)', text: 'inertia rules' })]; C.forEach(([n, L, v], i) => { const x = Math.log10((1000 * v * L) / 1e-3); out.push(s('circle', { cx: plot.X(x), cy: plot.Y(1.2), r: i === p.k ? 10 : 6, class: i === p.k ? 'fl-violet' : 'fl-muted' }), s('text', { x: plot.X(x), y: plot.Y(i % 2 ? 0.55 : 1.85), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: n })); }); return out; },
                readout: (p) => { const C = [[2e-6, 3e-5], [5e-5, 1e-4], [1e-3, 1e-2], [0.05, 0.2], [1.8, 1.5], [25, 8]][p.k], Re = (1000 * C[1] * C[0]) / 1e-3; return `length ${C[0] < 1e-3 ? sig(C[0] * 1e6, 2) + ' µm' : C[0] < 1 ? sig(C[0] * 100, 2) + ' cm' : sig(C[0], 2) + ' m'} · speed ${C[1] < 0.01 ? sig(C[1] * 1e6, 2) + ' µm/s' : sig(C[1], 2) + ' m/s'} · **Re ≈ ${Re.toExponential(0)}**`; },
              },
              after: r`The scale spans 13 powers of ten. A bacterium lives at $Re \approx 10^{-4}$: if it stopped swimming it would coast less than the width of an atom. A whale, at $Re \approx 10^{8}$, glides for many body lengths. Same water, completely different physics, set only by size and speed.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A spinning motor',
              prompt: r`*E. coli* swims with corkscrew-shaped flagella spun by a rotary motor. Why does a rotating corkscrew work at low Reynolds number when flapping doesn't?`,
              choices: [
                { t: 'Rotation never reverses, so it isn’t undone; a helix moving through viscous fluid pushes more along its axis one way', ok: true },
                { t: 'It spins fast enough to create momentum', why: 'At low Re, speed doesn’t help; what matters is that the motion isn’t reciprocal.' },
                { t: 'The corkscrew grips the water like a screw in wood', why: 'The analogy is tempting, but the real reason is that a helix has different drag along and across its length.' },
              ],
              explain: r`A thin rod drags about twice as much moving sideways as moving lengthwise. A rotating helix uses this to push fluid backwards steadily. The bacterial flagellar motor, a true rotary engine made of proteins, can spin at over 100 revolutions per second.`,
            },
          ],
          recap: [
            'At low Reynolds number, there is no coasting: motion stops as soon as the force does.',
            'Low-Re flows are reversible, so back-and-forth strokes give no net motion.',
            'Microbes swim with rotating or asymmetric strokes.',
          ],
        },
        {
          id: 'stokes',
          title: 'Stokes’ Law & Settling',
          summary: 'Why clouds float',
          icon: 'down',
          steps: [
            {
              type: 'explain',
              title: 'Drag on a tiny sphere',
              body: r`At low Reynolds number, drag is proportional to speed, not speed squared. George Stokes found (1851) that a sphere of radius $r$ moving at speed $v$ through a fluid feels
$$F = 6\pi \mu r v$$
Setting this equal to the sphere's weight (minus buoyancy) gives its terminal speed:
$$v = \frac{2}{9}\,\frac{\Delta\rho\, g\, r^2}{\mu}$$
Small things fall **very** slowly, because speed scales as $r^2$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Falling droplets',
              body: r`How fast does a water droplet fall through still air? Change its radius.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 0.32, grid: 10, gridY: 0.1, height: 260, padL: 52,
                axes: { xlabel: 'radius (μm)', ylabel: 'speed (m/s)' },
                params: { r: { min: 1, max: 50, step: 1, value: 10, label: 'droplet radius', color: 'blue', format: (v) => `${v} μm` } },
                curves: [{ f: (x) => vStokes(x * 1e-6), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.r, y: (p) => vStokes(p.r * 1e-6), color: 'blue' }],
                readout: (p) => {
                  const v = vStokes(p.r * 1e-6);
                  return `falls at **${v < 0.01 ? (v * 1000).toFixed(2) + ' mm/s' : (v * 100).toFixed(1) + ' cm/s'}**, taking ${fmtTime(1000 / v)} to fall 1 km`;
                },
              },
              after: r`A typical cloud droplet (radius around 10 μm) falls at about 1 cm/s, so the slightest updraft keeps it aloft: that's why clouds float. Raindrops (radius around 1 mm) must grow about a million times larger in volume by merging. (For drops much bigger than about 50 μm, the Reynolds number exceeds 1 and Stokes' law stops being accurate.)`,
            },
            {
              type: 'numeric',
              title: 'Twice the size',
              prompt: r`By what factor does the Stokes terminal speed increase if a droplet's radius doubles?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`The terminal speed goes as $r^2$.` }, { v: 8, why: r`Weight goes as $r^3$, but drag also grows as $r$, so speed goes as $r^3 / r = r^2$.` }],
              explain: r`Weight $\propto r^3$, drag $\propto r v$, so $v \propto r^2$: doubling the radius quadruples the speed. In 1909, Robert Millikan used Stokes' law to find the size of tiny charged oil drops from their falling speed, and from that measured the charge of a single electron.`,
            },
            {
              type: 'numeric',
              title: 'Fog',
              prompt: r`Fog droplets have radii of about 5 μm, so by Stokes' law they fall at about a quarter of a 10 μm droplet's speed. How long would they take to settle through 100 m of still air, in hours? (1 decimal place.)`,
              unit: 'hours',
              answer: 100 / vStokes(5e-6) / 3600,
              tol: 0.1,
              wrong: [{ v: 100 / vStokes(10e-6) / 3600, tol: 0.1, why: 'Use the 5 µm speed: a quarter of the 10 µm speed.' }],
              explain: r`About 0.3 cm/s, so 100 m takes roughly 9 hours: fog lingers until the Sun evaporates it or wind carries it away.`,
            },
            {
              type: 'numeric',
              title: 'A speck of dust',
              prompt: r`A mineral dust grain of radius 1 µm (density 2,500 kg/m³) falls through air at the Stokes speed $v = \frac{2r^2\rho g}{9\mu}$, with $\mu = 1.8 \times 10^{-5}$ Pa·s. How fast is that, in mm/s? (2 decimal places.)`,
              unit: 'mm/s',
              answer: 2 * Math.pow(1e-6, 2) * 2500 * 9.8 / (9 * 1.8e-5) * 1000,
              tol: 0.01,
              wrong: [{ v: 2 * 1e-6 * 2500 * 9.8 / (9 * 1.8e-5) * 1000, relTol: 0.05, why: r`Square the radius: $r^2 = 10^{-12}$ m².` }],
              explain: r`About 0.30 mm/s: around a metre an hour. Dust this fine can stay aloft for days and ride the winds across oceans: Saharan dust regularly reaches the Amazon and the Caribbean.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Volcanic ash',
              prompt: r`After the 2010 Eyjafjallajökull eruption in Iceland, fine ash grounded European flights for days. Why did the ash stay up so long?`,
              choices: [
                { t: 'The finest particles are tiny, and their Stokes settling speed (∝ r²) is so small that winds kept them aloft for days', ok: true },
                { t: 'Ash is lighter than air', why: 'Ash is rock, much denser than air; it stays up because it falls so slowly.' },
                { t: 'The ash was hot and kept rising', why: 'It cooled quickly; tiny particles simply settle very slowly.' },
              ],
              explain: r`Ash particles a few micrometres across settle at millimetres per second, so they can travel thousands of kilometres. Jet engines melt the glassy ash, which can stop them, so airspace closed until concentrations fell.`,
            },
          ],
          recap: [
            r`Stokes' law: drag $= 6\pi\mu r v$ at low Reynolds number.`,
            r`Terminal speed $\propto r^2$, so tiny droplets fall extremely slowly.`,
            'Cloud droplets float because they fall at only about 1 cm/s.',
          ],
        },
      ],
    },
    {
      title: 'Fluids Behaving Oddly',
      summary: 'Non-Newtonian fluids and lubrication.',
      lessons: [
        {
          id: 'strange',
          title: 'Strange Fluids',
          summary: 'Ketchup, custard and blood',
          icon: 'question',
          steps: [
            {
              type: 'explain',
              title: 'Viscosity that changes',
              body: r`For water and honey, viscosity is a fixed property at a given temperature: they're **Newtonian**. Many everyday fluids aren't. Their viscosity depends on how fast they're sheared (stirred, squeezed or shaken):
- **shear-thinning** fluids (ketchup, paint, blood) get runnier when stirred;
- **shear-thickening** fluids (cornflour in water, "oobleck") get stiffer when hit.

A simple model is a power law: effective viscosity $\mu = K\dot\gamma^{\,n-1}$, where $\dot\gamma$ is the shear rate. $n < 1$ means shear-thinning, $n > 1$ shear-thickening.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Shake the bottle',
              prompt: r`Ketchup behaves roughly like a power-law fluid with $K = 20$ Pa·sⁿ and $n = 0.3$. Find the shear rate at which its effective viscosity drops to **1 Pa·s**, runny enough to pour.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 150, ymin: 0, ymax: 10, grid: 25, gridY: 2, height: 250, axes: { xlabel: 'shear rate (per second)', ylabel: 'viscosity (Pa·s)' },
                params: { g: { min: 1, max: 150, step: 1, value: 10, slider: false } },
                curves: [{ f: (x) => (x > 0.5 ? ketchupMu(x) : NaN), color: 'coral', width: 3 }, { f: () => 1, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.g, y: (p) => Math.min(10, ketchupMu(p.g)), drag: { x: 'g' }, color: 'violet' }],
                readout: (p) => r`shear rate ${p.g} s⁻¹: viscosity $${ketchupMu(p.g).toFixed(2)}$ Pa·s`,
                goal: (p) => ketchupMu(p.g) <= 1 && ketchupMu(p.g - 1) > 1,
                hint: r`Solve $20\,\dot\gamma^{-0.7} = 1$.`,
                solution: { g: 73 },
              },
              explain: r`$\dot\gamma = 20^{1/0.7} \approx 72$ per second, so the first whole number below 1 Pa·s is 73. At rest, ketchup is thousands of times thicker, which is why it sits stubbornly in the bottle until you shake or tap it. Paint is designed the same way: runny on the brush, thick on the wall so it doesn't drip.`,
            },
            {
              type: 'mcq',
              title: 'Running on custard',
              prompt: r`People can run across a pool of cornflour and water, but sink if they stand still. Why?`,
              choices: [
                { t: 'It’s shear-thickening: quick impacts jam the particles together so it behaves like a solid, but slow pressure lets them flow apart', ok: true },
                { t: 'Runners are lighter', why: 'Their weight is the same; the speed of the impact changes how the fluid responds.' },
                { t: 'The water evaporates under their feet', why: 'There’s no time for evaporation; the particles jam.' },
              ],
              explain: r`Cornflour grains in water slide past each other easily when moved gently, but a sudden push forces them into contact, jamming like a crowd. Researchers are developing body armour that uses shear-thickening fluids to stiffen on impact.`,
            },
            {
              type: 'numeric',
              title: 'Blood in fast and slow flow',
              prompt: r`Blood is shear-thinning. Suppose its effective viscosity is 0.006 Pa·s in a slow vein and 0.0035 Pa·s in a fast artery. How many times runnier is it in the artery? (2 decimal places.)`,
              unit: '×',
              answer: 0.006 / 0.0035,
              tol: 0.01,
              wrong: [{ v: 0.0035 / 0.006, tol: 0.01, why: 'Runnier means lower viscosity: divide the vein value by the artery value.' }],
              explain: r`$\frac{0.006}{0.0035} \approx 1.71$. Red blood cells stack up like coins at low flow speeds and break apart at high ones, lowering viscosity where blood moves fast.`,
            },
            {
              type: 'mcq',
              title: 'Escaping quicksand',
              prompt: r`Quicksand is shear-thinning when disturbed, but packs tighter around anything pulled out quickly. What is the best way to escape?`,
              choices: [
                { t: r`Move slowly and gently, spreading your weight, to let water flow back around your legs`, ok: true },
                { t: r`Thrash about to break free`, why: r`Violent movement liquefies the sand around you so you sink deeper, then it packs around you.` },
                { t: r`Pull one leg out as fast as you can`, why: r`A quick pull needs enormous force: the sand behaves almost like a solid.` },
              ],
              explain: r`Researchers estimate that pulling a trapped foot out quickly would take a force like lifting a car. Slow wiggling lets water seep into the gap and loosen the grip. (You also can’t sink completely: the human body floats in dense quicksand.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Silly Putty',
              prompt: r`Silly Putty bounces like rubber when thrown, but slowly flows into a puddle if left on a table. What property is this?`,
              choices: [
                { t: 'Viscoelasticity: it acts elastic over short times and viscous over long times', ok: true },
                { t: 'Shear-thinning', why: 'Shear-thinning is about stirring rate; this is about timescale: bounce versus slow flow.' },
                { t: 'It’s a perfect solid', why: 'Perfect solids don’t flow into puddles.' },
              ],
              explain: r`Long polymer chains don't have time to untangle during a quick bounce, so they spring back. Over minutes, they slide past each other and the putty flows. Glaciers and the Earth's mantle behave similarly on long enough timescales.`,
            },
          ],
          recap: [
            'Non-Newtonian fluids change viscosity with shear rate.',
            'Shear-thinning fluids (ketchup, blood) flow more easily when stirred; shear-thickening ones (oobleck) stiffen on impact.',
            'Viscoelastic materials are elastic quickly and viscous slowly.',
          ],
        },
        {
          id: 'lubrication',
          title: 'Lubrication',
          summary: 'Floating on a film of oil',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Shearing a thin layer',
              body: r`Slide a plate of area $A$ at speed $v$ over a layer of oil of thickness $h$. The oil sticks to both surfaces, so it's sheared, and the force needed is
$$F = \mu A\,\frac{v}{h}$$
That's the definition of viscosity in action. A thin oil film replaces scraping metal-on-metal friction with gentle viscous shearing.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Slide the plate',
              prompt: r`A 0.5 m² plate slides over a 1 mm layer of oil ($\mu = 0.08$ Pa·s). Find the speed at which it takes exactly **2 N** to keep it moving.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.2, ymin: 0, ymax: 8, grid: 0.02, gridY: 1, height: 250, axes: { xlabel: 'plate speed (m/s)', ylabel: 'force needed (N)', xfmt: (v) => v.toFixed(2) },
                params: { v: { min: 0.005, max: 0.2, step: 0.005, value: 0.15, slider: false } },
                curves: [{ f: (x) => shearForce(x), color: 'amber', width: 3 }, { f: () => 2, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.v, y: (p) => shearForce(p.v), drag: { x: 'v' }, color: 'violet' }],
                readout: (p) => r`$v = ${p.v.toFixed(3)}$ m/s: $F = 0.08 \times 0.5 \times \frac{${p.v.toFixed(3)}}{0.001} = ${shearForce(p.v).toFixed(2)}$ N`,
                goal: (p) => Math.abs(shearForce(p.v) - 2) < 0.01,
                hint: r`Solve $40v = 2$.`,
                solution: { v: 0.05 },
              },
              explain: r`$F = 40v$, so $v = 0.05$ m/s. Unlike dry friction, viscous drag grows with speed, and it's zero when nothing moves: that's why bearings and joints rely on thin fluid films.`,
            },
            {
              type: 'numeric',
              title: 'Thinner film',
              prompt: r`If the oil film is squeezed from 1 mm to 0.25 mm thick (same speed), by what factor does the drag force change?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 0.25, why: r`Force $\propto \frac{1}{h}$: a thinner film means more force.` }],
              explain: r`$F \propto \frac{1}{h}$, so a quarter of the thickness means 4 times the force. Engine oils are graded to be thin enough to flow when cold but thick enough to keep surfaces apart when hot.`,
            },
            {
              type: 'mcq',
              title: 'Self-pumping bearings',
              prompt: r`In a car engine, a spinning shaft rests on a thin film of oil inside a slightly larger bearing. What holds the shaft off the metal?`,
              choices: [
                { t: 'The spinning shaft drags oil into the narrowing gap, building up pressure that floats the shaft', ok: true },
                { t: 'Magnets in the bearing', why: 'Ordinary engine bearings are purely hydrodynamic: the oil does the work.' },
                { t: 'The oil’s surface tension', why: 'Surface tension is far too weak; viscous pressure build-up supports the load.' },
              ],
              explain: r`Osborne Reynolds explained this "hydrodynamic lubrication" in 1886. As the shaft turns, viscous drag pulls oil into a wedge-shaped gap, where the pressure rises enough to carry tonnes of load on a film thinner than a hair. Bearings wear mostly at start-up, before the film forms.`,
            },
            {
              type: 'numeric',
              title: 'Running faster',
              prompt: r`The power lost in a lubricating film is $P = \frac{\mu A v^2}{h}$. If a shaft spins twice as fast, by what factor does the power lost to the oil rise?`,
              answer: 4,
              explain: r`$2^2 = 4$. Frictional heating grows quickly with speed, which is why high-speed engines need oil cooling.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Power lost',
              prompt: r`The viscous force on a sliding surface is 2 N at 0.05 m/s. How much power is turned into heat in the oil?`,
              unit: 'W',
              answer: 0.1,
              tol: 0.001,
              wrong: [{ v: 40, why: 'Power = force × speed, not force ÷ speed.' }],
              explain: r`$P = Fv = 2 \times 0.05 = 0.1$ W. Lubricated surfaces still lose some energy as heat, which is why engines need oil coolers and why the right viscosity matters: too thick wastes power, too thin lets metal touch.`,
            },
          ],
          recap: [
            r`Viscous shear force $F = \mu A v / h$.`,
            'Thin films raise the force; lubrication replaces scraping with shearing.',
            'Rotating shafts float on self-pressurising oil wedges.',
          ],
        },
      ],
    },
  ],
};
