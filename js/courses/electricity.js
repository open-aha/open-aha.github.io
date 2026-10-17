import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

// battery with emf 12 V and internal resistance 2 Ω driving a load R
const loadPower = (R) => (144 * R) / (R + 2) ** 2;
// voltage divider from 5 V with R1 = 10 kΩ
const vdiv = (R2) => (5 * R2) / (10 + R2);

export default {
  id: 'electricity',
  subject: 'physics',
  title: 'Electricity & Circuits',
  level: 'Intermediate',
  cover: 'circuits',
  tagline: 'Charge, current, voltage and resistance: build circuits, light bulbs, batteries and voltage dividers.',
  description: r`What actually flows through a wire? Discover current, voltage and resistance, master Ohm's law, and build series and parallel circuits to see why your house is wired the way it is. Then meet real batteries, Kirchhoff's laws and the voltage dividers inside every sensor.`,
  prereq: 'Energy',
  chapters: [
    {
      title: 'The Basics',
      summary: 'Charge, current, voltage and resistance.',
      lessons: [
        {
          id: 'current',
          title: 'Charge & Current',
          summary: 'What flows in a wire',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Flip the switch',
              body: r`You flip a light switch and the bulb, several metres of wire away, lights up almost instantly.`,
              prompt: 'How fast do the electrons in the wire actually move?',
              choices: [
                { t: 'Very slowly: about a millimetre per second or less', ok: true },
                { t: 'Close to the speed of light', why: 'The *signal* travels at close to light speed, but each electron only creeps along.' },
                { t: 'About the speed of sound', why: 'Much slower than that. Electrons drift through a wire at less than a millimetre per second.' },
              ],
              explain: r`The wire is already full of electrons. Closing the switch makes them all start drifting at once, like water in a full hose: turn the tap and water comes out the far end immediately, even though no single drop travelled the whole way. Each electron's **drift speed** is typically well under 1 mm/s.`,
            },
            {
              type: 'explain',
              title: 'Charge',
              body: r`Matter is made of atoms, with positive protons and negative electrons. **Charge** is measured in **coulombs** (C). A single electron carries a tiny charge, $-1.6 \times 10^{-19}$ C, so one coulomb is about $6 \times 10^{18}$ electrons.

In metals, some electrons are free to wander between atoms. These free electrons carry electric current.`,
            },
            {
              type: 'explain',
              title: 'Current',
              body: r`**Current** is the rate at which charge flows past a point:
$$I = \frac{Q}{t}$$
It's measured in **amperes** (A). One amp is one coulomb per second.

Watch the moving dots: they represent the current. The bigger the current, the faster they flow.`,
              widget: { kind: 'circuit', layout: 'single', loads: 'bulb', params: { V: { min: 1, max: 12, step: 1, value: 6, label: '$V$' } }, R1: 6, readout: ({ I }) => r`Current $I = ${f2(I)}$ A $= ${f2(I)}$ coulombs every second`, ready: true },
              after: r`By convention, current flows from the battery's **+** terminal around to its **−** terminal. Electrons actually drift the opposite way. This convention was chosen long before electrons were discovered, and it stuck.`,
            },
            {
              type: 'numeric',
              title: 'Count the charge',
              prompt: 'A current of 2 A flows for 10 seconds. How much charge passes through the wire?',
              unit: 'C',
              answer: 20,
              wrong: [{ v: 5, why: r`$Q = I \times t$: multiply, don't divide.` }, { v: 0.2, why: r`$Q = It = 2 \times 10$.` }],
              explain: r`$Q = It = 2 \times 10 = 20$ C. That's about $1.2 \times 10^{20}$ electrons.`,
            },
            {
              type: 'mcq',
              title: 'Used up?',
              body: r`Current flows through a bulb in a simple loop.`,
              prompt: 'How does the current leaving the bulb compare with the current entering it?',
              choices: [
                { t: 'It’s the same', ok: true },
                { t: 'It’s smaller: the bulb uses some up', why: 'The bulb uses up *energy*, not charge. Every electron that enters also leaves.' },
                { t: 'It’s larger', why: 'Charge can’t be created inside the bulb.' },
              ],
              explain: r`Charge is never used up. In a single loop, the current is the same everywhere. What the bulb takes is **energy** from each passing charge, which it turns into light and heat. That energy is described by **voltage**, coming next.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Phone charge',
              body: r`A phone battery is rated 3000 mAh (milliamp-hours): it can deliver 3000 mA for 1 hour.`,
              prompt: 'How much charge is that, in coulombs?',
              unit: 'C',
              answer: 10800,
              wrong: [
                { v: 3000, why: r`Convert: 3000 mA is 3 A, and 1 h is 3600 s.` },
                { v: 3, why: 'That’s the current in amps. Multiply by the time in seconds.' },
              ],
              explain: r`$Q = It = 3 \text{ A} \times 3600 \text{ s} = 10{,}800$ C.`,
            },
          ],
          recap: [
            'Current is charge per second: I = Q/t, measured in amps (1 A = 1 C/s).',
            'Electrons drift slowly, but the whole wire starts moving at once.',
            'In a single loop, the current is the same everywhere. Charge is never used up.',
          ],
        },
        {
          id: 'ohms-law',
          title: 'Voltage & Ohm’s Law',
          summary: 'Push, flow and resistance',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Push and resist',
              body: r`Change the battery's **voltage** and the bulb's **resistance**. Watch the current and the glow.`,
              widget: {
                kind: 'circuit', layout: 'single', loads: 'bulb', maxPower: 20,
                params: { V: { min: 1, max: 12, step: 1, value: 6, label: '$V$' }, R1: { min: 1, max: 12, step: 1, value: 3, label: '$R$' } },
                readout: ({ I, V, R1 }) => r`$I = ${f2(I)}$ A`,
                ready: true,
              },
              after: 'More voltage means more current. More resistance means less current.',
            },
            {
              type: 'explain',
              title: 'Voltage',
              body: r`**Voltage** (potential difference, measured in **volts**, V) is the energy each coulomb of charge gains or loses:
$$1 \text{ volt} = 1 \text{ joule per coulomb}$$
A 6 V battery gives every coulomb that passes through it 6 J of energy. The charge then gives that energy away in the bulb.

A helpful picture is water in pipes: voltage is like the **pressure** (or the height a pump lifts water to), current is the **flow rate**, and resistance is how **narrow** the pipe is.`,
            },
            {
              type: 'explain',
              title: 'Ohm’s law',
              body: r`For many materials, current is proportional to voltage. The constant of proportionality defines the **resistance** $R$, measured in **ohms** (Ω):
$$V = I R$$
Double the voltage and you double the current. Double the resistance and you halve it.`,
            },
            {
              type: 'numeric',
              title: 'Find the current',
              prompt: 'A 12 V battery is connected to a 4 Ω resistor. What current flows?',
              unit: 'A',
              answer: 3,
              wrong: [{ v: 48, why: r`$I = V/R$, not $V \times R$.` }, { v: 0.33, tol: 0.01, why: r`$I = V/R = 12/4$, not $4/12$.` }],
              explain: r`$I = \frac{V}{R} = \frac{12}{4} = 3$ A.`,
            },
            {
              type: 'interactive',
              title: 'Set the current',
              body: r`The bulb has a resistance of 4 Ω. Choose a battery voltage that makes exactly **1.5 A** flow.`,
              widget: {
                kind: 'circuit', layout: 'single', loads: 'bulb', R1: 4,
                params: { V: { min: 1, max: 12, step: 1, value: 2, label: '$V$' } },
                readout: ({ I }) => r`$I = ${f2(I)}$ A`,
                goal: (p, res) => Math.abs(res.I - 1.5) < 1e-9,
                hint: r`Use $V = IR$.`,
                solution: { V: 6 },
              },
              explain: r`$V = IR = 1.5 \times 4 = 6$ V.`,
            },
            {
              type: 'numeric',
              title: 'Find the resistance',
              prompt: 'A torch bulb draws 0.5 A from a 3 V battery. What is its resistance?',
              unit: 'Ω',
              answer: 6,
              wrong: [{ v: 1.5, why: r`$R = V/I = 3/0.5$, not $3 \times 0.5$.` }],
              explain: r`$R = \frac{V}{I} = \frac{3}{0.5} = 6$ Ω.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why birds don’t get shocked',
              prompt: 'A bird stands on a single high-voltage power line without being harmed. Why?',
              choices: [
                { t: 'Both its feet are at (almost) the same voltage, so almost no current flows through it', ok: true },
                { t: 'Birds have extremely high resistance', why: 'They don’t, especially compared with air. The key is that there’s no voltage *difference* across the bird.' },
                { t: 'The line carries too little current', why: 'Power lines carry large currents. The bird just isn’t part of a path with a voltage difference across it.' },
              ],
              explain: r`Current flows because of a voltage **difference**. Both feet touch the same wire, a few centimetres apart, so the difference between them is tiny and almost no current flows through the bird. If it touched two wires, or a wire and a grounded pole, it would complete a circuit, with deadly results.`,
            },
          ],
          recap: [
            'Voltage is energy per charge (1 V = 1 J/C). It pushes current around the circuit.',
            r`Ohm's law: $V = IR$, with resistance in ohms (Ω).`,
            'Current flows only where there is a voltage difference.',
          ],
        },
      ],
    },
    {
      title: 'Circuits',
      summary: 'Series, parallel and power.',
      lessons: [
        {
          id: 'series',
          title: 'Series Circuits',
          summary: 'One path, shared voltage',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Add a bulb',
              body: r`One bulb is lit by a battery. You add a second identical bulb **in series**, in the same loop, one after the other.`,
              prompt: 'How bright are the bulbs now, compared with the single bulb?',
              choices: [
                { t: 'Both are dimmer', ok: true },
                { t: 'Both are just as bright', why: 'Two bulbs in a row make it harder for current to flow, so the current drops.' },
                { t: 'The first is bright, the second dim', why: 'The current is the same all the way around the loop, so identical bulbs glow equally.' },
              ],
              explain: r`Two bulbs in series double the total resistance, so the current halves. Each bulb also gets only half the battery's voltage. Both glow more dimly, and equally.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Two in a row',
              body: r`Adjust the two resistances. Watch the current, which is the same through both bulbs, and the voltage each one gets.`,
              widget: {
                kind: 'circuit', layout: 'series', loads: 'bulb', V: 12,
                params: { R1: { min: 1, max: 12, step: 1, value: 4, label: '$R_1$' }, R2: { min: 1, max: 12, step: 1, value: 4, label: '$R_2$' } },
                readout: ({ I, branch, Req }) => r`$I = ${f2(I)}$ A, $\;V_1 = ${f2(branch.R1.V)}$ V, $\;V_2 = ${f2(branch.R2.V)}$ V, $\;R_\text{total} = ${f2(Req)}$ Ω`,
                ready: true,
              },
            },
            {
              type: 'explain',
              title: 'Series rules',
              body: r`In a series circuit:
- The **current** is the same through every component.
- The **voltages** add up to the battery voltage: $V = V_1 + V_2$.
- The **resistances** add: $R_\text{total} = R_1 + R_2$.

The bigger resistor takes the bigger share of the voltage: $V_1 = IR_1$.`,
            },
            {
              type: 'numeric',
              title: 'Total current',
              prompt: 'A 12 V battery is connected in series with a 2 Ω and a 4 Ω resistor. What current flows?',
              unit: 'A',
              answer: 2,
              wrong: [
                { v: 6, why: r`That's $12/2$, using only one resistor. In series the resistances add: $2 + 4 = 6$ Ω.` },
                { v: 9, why: r`Add the resistances first: $I = 12/(2 + 4)$.` },
              ],
              explain: r`$R_\text{total} = 2 + 4 = 6$ Ω, so $I = 12/6 = 2$ A.`,
            },
            {
              type: 'numeric',
              title: 'Voltage share',
              prompt: 'In that same circuit, what is the voltage across the 4 Ω resistor?',
              unit: 'V',
              answer: 8,
              wrong: [
                { v: 4, why: r`That's the voltage across the 2 Ω resistor. Across the 4 Ω one: $V = IR = 2 \times 4$.` },
                { v: 12, why: 'The 12 V is shared between the two resistors.' },
                { v: 6, why: r`The voltage doesn't split equally. The bigger resistor gets more: $V = IR$.` },
              ],
              explain: r`$V = IR = 2 \times 4 = 8$ V. The 2 Ω resistor gets $2 \times 2 = 4$ V, and $8 + 4 = 12$ V. ✓`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Old Christmas lights',
              prompt: 'Old strings of Christmas lights were wired in series. What happened when one bulb burned out?',
              choices: [
                { t: 'The whole string went dark', ok: true },
                { t: 'Only that bulb went out', why: 'In series there’s only one path. Break it anywhere and current stops everywhere.' },
                { t: 'The others got brighter', why: 'With the loop broken, no current flows at all.' },
              ],
              explain: r`A burned-out bulb breaks the only path, so the current stops and every bulb goes dark. Finding the bad bulb was a famous holiday chore. Later sets used bulbs with a bypass, or parallel wiring.`,
            },
          ],
          recap: [
            'Series: one path, so the same current flows through everything.',
            r`Resistances add: $R = R_1 + R_2$. The voltages share the battery voltage, in proportion to resistance.`,
            'Break the loop anywhere and everything stops.',
          ],
        },
        {
          id: 'parallel',
          title: 'Parallel Circuits',
          summary: 'Many paths, same voltage',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Side by side',
              body: r`Now the second identical bulb goes **in parallel**, on its own branch connected directly across the battery.`,
              prompt: 'How bright is each bulb, compared with a single bulb on its own?',
              choices: [
                { t: 'Just as bright', ok: true },
                { t: 'Dimmer', why: 'Each branch is connected straight across the battery, so each bulb gets the full voltage.' },
                { t: 'Brighter', why: 'Each bulb gets the same voltage as before, so the same current, and the same brightness.' },
              ],
              explain: r`Each bulb gets the full battery voltage, so each draws the same current as it would alone. Both are fully bright. The battery supplies twice the total current, so it runs down twice as fast.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Branches',
              body: r`The current splits at the junction, flows through both branches, and joins up again. Adjust the resistances.`,
              widget: {
                kind: 'circuit', layout: 'parallel', loads: 'bulb', V: 12, maxPower: 30,
                params: { R1: { min: 2, max: 12, step: 1, value: 6, label: '$R_1$' }, R2: { min: 2, max: 12, step: 1, value: 12, label: '$R_2$' } },
                readout: ({ I, branch, Req }) => r`$I_1 = ${f2(branch.R1.I)}$ A, $\;I_2 = ${f2(branch.R2.I)}$ A, $\;I_\text{total} = ${f2(I)}$ A, $\;R_\text{total} = ${f2(Req)}$ Ω`,
                ready: true,
              },
            },
            {
              type: 'explain',
              title: 'Parallel rules',
              body: r`In a parallel circuit:
- Each branch has the **same voltage**: the battery's.
- The branch **currents add**: $I = I_1 + I_2$.
- The total resistance is **less** than any single branch:
$$\frac{1}{R_\text{total}} = \frac{1}{R_1} + \frac{1}{R_2}$$
Adding a branch gives the current another path, so the total resistance goes **down**.`,
            },
            {
              type: 'numeric',
              title: 'Combine',
              prompt: 'What is the total resistance of a 6 Ω and a 3 Ω resistor in parallel?',
              unit: 'Ω',
              answer: 2,
              wrong: [
                { v: 9, why: 'That’s the series total. In parallel, the total is smaller than either resistor.' },
                { v: 4.5, why: r`That's the average. Use $\frac{1}{R} = \frac16 + \frac13 = \frac12$.` },
                { v: 0.5, why: r`That's $1/R$. Flip it to get $R$.` },
              ],
              explain: r`$\frac{1}{R} = \frac16 + \frac13 = \frac16 + \frac26 = \frac36 = \frac12$, so $R = 2$ Ω. That's less than either resistor on its own.`,
            },
            {
              type: 'numeric',
              title: 'Total current',
              prompt: 'Those two resistors (6 Ω and 3 Ω, in parallel) are connected to a 12 V battery. What total current flows?',
              unit: 'A',
              answer: 6,
              wrong: [{ v: 1.33, tol: 0.01, why: r`That uses the series resistance of 9 Ω. In parallel, $R = 2$ Ω.` }],
              explain: r`Branch currents: $12/6 = 2$ A and $12/3 = 4$ A, for a total of 6 A. Or use the combined resistance: $12/2 = 6$ A. ✓`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Your house',
              prompt: 'Household sockets and lights are wired in parallel. What is one main reason?',
              choices: [
                { t: 'Every appliance gets the full mains voltage and can be switched on and off independently', ok: true },
                { t: 'It uses less current overall', why: 'Parallel wiring actually draws *more* total current as you add appliances. That’s why circuits have fuses and breakers.' },
                { t: 'So that one fault turns everything off for safety', why: 'Parallel wiring is the opposite: one appliance failing doesn’t affect the others.' },
              ],
              explain: r`In parallel, each appliance sits directly across the supply (about 230 V in Europe, 120 V in North America), so each works properly on its own. The downside: every appliance adds current through the main wires, so fuses and circuit breakers stop the total getting dangerously high.`,
            },
          ],
          recap: [
            'Parallel: same voltage across each branch, and the branch currents add.',
            r`$\frac{1}{R} = \frac{1}{R_1} + \frac{1}{R_2}$, so adding branches lowers the total resistance.`,
            'Household wiring is parallel, so appliances work independently.',
          ],
        },
        {
          id: 'electric-power',
          title: 'Electric Power',
          summary: 'Watts, heat and power lines',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Energy per second',
              body: r`Voltage is energy per coulomb. Current is coulombs per second.`,
              prompt: 'So what does voltage × current give you?',
              choices: [
                { t: 'Energy per second, which is power', ok: true },
                { t: 'Resistance', why: r`Resistance is $V/I$, not $V \times I$.` },
                { t: 'Total charge', why: r`$\frac{\text{J}}{\text{C}} \times \frac{\text{C}}{\text{s}} = \frac{\text{J}}{\text{s}}$. The coulombs cancel, leaving joules per second.` },
              ],
              explain: r`$\frac{\text{J}}{\text{C}} \times \frac{\text{C}}{\text{s}} = \frac{\text{J}}{\text{s}} = $ watts. Electrical power is $P = VI$.`,
            },
            {
              type: 'explain',
              title: 'Three forms of the power formula',
              body: r`Combine $P = VI$ with Ohm's law $V = IR$:
$$P = VI = I^2 R = \frac{V^2}{R}$$
Use whichever form fits the quantities you know.`,
            },
            {
              type: 'numeric',
              title: 'Kettle current',
              prompt: 'A 2300 W kettle runs on a 230 V supply. What current does it draw?',
              unit: 'A',
              answer: 10,
              wrong: [{ v: 529000, why: r`$I = P/V$: divide, don't multiply.` }, { v: 0.1, why: r`$I = P/V = 2300/230$, not $230/2300$.` }],
              explain: r`$I = \frac{P}{V} = \frac{2300}{230} = 10$ A. That's why kettles have thick cables, and why a 13 A fuse is common in UK plugs.`,
            },
            {
              type: 'numeric',
              title: 'Heater resistance',
              prompt: 'A 1000 W heater runs on 230 V. What is its resistance?',
              unit: 'Ω',
              answer: (230 * 230) / 1000,
              tol: 0.1,
              wrong: [{ v: 0.23, tol: 0.01, why: r`Use $R = V^2/P = 230^2/1000$.` }],
              explain: r`$R = \frac{V^2}{P} = \frac{230^2}{1000} = \frac{52{,}900}{1000} \approx 52.9$ Ω.`,
            },
            {
              type: 'mcq',
              title: 'Brighter in parallel',
              body: r`Two identical bulbs can be wired to the same battery either in series or in parallel.`,
              prompt: 'Which setup gives more total light?',
              choices: [
                { t: 'Parallel, with 4 times the total power of series', ok: true },
                { t: 'Series', why: r`In series each bulb gets half the voltage, and since $P = V^2/R$, each gives only a quarter of the power.` },
                { t: 'They give the same', why: r`Compare $P = V^2/R$ for each bulb in each case.` },
              ],
              explain: r`Series: each bulb gets $V/2$, so its power is $\frac{(V/2)^2}{R} = \frac{V^2}{4R}$. Total: $\frac{V^2}{2R}$. Parallel: each gets $V$, so the total is $\frac{2V^2}{R}$. That's 4 times as much.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Two bulbs, two ways',
              body: r`A 100 Ω bulb and a second bulb of adjustable resistance are connected to 230 V, either one after the other (series) or side by side (parallel). Compare the power each one gets.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 1100, grid: false, axes: { ylabel: 'power (W)', yticks: 200, xticks: 20 }, maxWidth: 440, height: 280,
                params: { R: { min: 50, max: 800, step: 10, value: 100, label: 'second bulb', color: 'amber', format: (v) => `${v} Ω` }, par: { min: 0, max: 1, step: 1, value: 0, label: 'wiring', color: 'ink', format: (v) => (v ? 'parallel' : 'series') } },
                extra: ({ plot, p, s }) => { let P1, P2; if (p.par) { P1 = 230 ** 2 / 100; P2 = 230 ** 2 / p.R; } else { const I = 230 / (100 + p.R); P1 = I * I * 100; P2 = I * I * p.R; } return [[P1, 2, 'coral', '100 Ω'], [P2, 6, 'amber', `${p.R} Ω`]].flatMap(([P, x, c, t]) => [s('rect', { x: plot.X(x), y: plot.Y(Math.min(P, 1100)), width: plot.X(2) - plot.X(0), height: plot.Y(0) - plot.Y(Math.min(P, 1100)), rx: 4, class: `fl-${c}` }), s('text', { x: plot.X(x + 1), y: plot.Y(Math.min(P, 1100)) - 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: `${t}: ${P.toFixed(0)} W` })]); },
                readout: (p) => { if (p.par) return `parallel: each bulb gets the full 230 V · total **${(230 ** 2 / 100 + 230 ** 2 / p.R).toFixed(0)} W**`; const I = 230 / (100 + p.R); return `series: same current ${I.toFixed(2)} A through both · total **${(230 * I).toFixed(0)} W**`; },
              },
              after: r`In parallel each bulb gets the full voltage, and the lower-resistance bulb is brighter ($P = V^2/R$). In series they share one current, so the **higher**-resistance bulb gets more power ($P = I^2R$) and the total is far smaller. Household wiring is parallel so each appliance works independently at full voltage.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'High-voltage lines',
              body: r`A power station sends power $P$ along long cables with resistance $R$. The cables waste power as heat: $P_\text{loss} = I^2 R$.`,
              prompt: 'Why are power lines run at very high voltage (hundreds of thousands of volts)?',
              choices: [
                { t: 'For the same power, higher voltage means less current, and the losses fall as current squared', ok: true },
                { t: 'High voltage makes electricity travel faster', why: 'The signal travels at nearly light speed regardless. The benefit is lower current.' },
                { t: 'High voltage increases the cables’ resistance', why: 'The cables’ resistance depends on their material and size, not the voltage.' },
              ],
              explain: r`$P = VI$, so for a fixed power, raising $V$ ten times cuts $I$ ten times, and the heat loss $I^2R$ falls a **hundredfold**. Transformers step the voltage up for transmission, then back down to safe levels for your home.`,
            },
          ],
          recap: [
            r`Power $P = VI = I^2R = V^2/R$, in watts.`,
            'Parallel bulbs each get the full voltage, so they are brighter than series bulbs.',
            'High-voltage transmission cuts current, which slashes the I²R losses.',
          ],
        },
      ],
    },
    {
      title: 'Real Circuits',
      summary: 'Batteries, junctions and dividers.',
      lessons: [
        {
          id: 'battery',
          title: 'Real Batteries',
          summary: 'Internal resistance and maximum power',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Not quite ideal',
              body: r`A real battery has some resistance inside it, its **internal resistance** $r$. Its chemistry provides an **EMF** $\varepsilon$ (the energy given to each coulomb), but some of that is lost inside the battery itself. The voltage at its terminals is
$$V = \varepsilon - Ir$$
The more current you draw, the more the terminal voltage sags.`,
            },
            {
              type: 'numeric',
              title: 'Terminal voltage',
              prompt: r`A 9 V battery has an internal resistance of 1 Ω and delivers 2 A. What voltage appears across its terminals?`,
              unit: 'V',
              answer: 7,
              wrong: [{ v: 9, why: 'Some voltage is lost inside: Ir = 2 V.' }, { v: 11, why: 'The internal drop subtracts from the EMF.' }],
              explain: r`$V = 9 - 2 \times 1 = 7$ V. The missing 2 V heats the battery, which is why batteries get warm when they work hard.`,
            },
            {
              type: 'mcq',
              title: 'Dimming headlights',
              prompt: r`When a car's starter motor turns, the headlights briefly dim. Why?`,
              choices: [
                { t: 'The starter draws a huge current, so the drop across the battery’s internal resistance is large and the terminal voltage falls', ok: true },
                { t: 'The headlights switch off to save power', why: 'Nothing switches them off; the voltage supplying them drops.' },
                { t: 'The battery’s EMF changes', why: 'The EMF stays about the same; the internal voltage drop is what changes.' },
              ],
              explain: r`A starter motor can draw 150 A or more. Even 0.02 Ω of internal resistance then drops 3 V, out of 12. Cold batteries have higher internal resistance, which is why cars are harder to start on frosty mornings.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Maximum power',
              prompt: r`A battery with EMF 12 V and internal resistance 2 Ω drives a load resistor $R$. The power delivered to the load is $\frac{\varepsilon^2 R}{(R + r)^2}$. Drag to the load resistance that receives the **most** power.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 20, grid: 1, gridY: 5, height: 260, axes: { xlabel: 'load resistance R (Ω)', ylabel: 'power to load (W)' },
                params: { R: { min: 0.2, max: 12, step: 0.2, value: 8, slider: false } },
                curves: [{ f: (R) => loadPower(R), color: 'violet', width: 3 }],
                points: [{ x: (p) => p.R, y: (p) => loadPower(p.R), drag: { x: 'R' }, color: 'coral' }],
                readout: (p) => r`$R = ${p.R.toFixed(1)}\ \Omega$: current $${(12 / (p.R + 2)).toFixed(2)}$ A, power to load $${loadPower(p.R).toFixed(2)}$ W`,
                goal: (p) => Math.abs(p.R - 2) < 1e-9,
                hint: 'Too small a load wastes power inside the battery; too large and hardly any current flows.',
                solution: { R: 2 },
              },
              explain: r`The peak is at $R = r = 2\ \Omega$, delivering 18 W. This is the **maximum power transfer theorem**: a source gives the most power to a load that matches its internal resistance. Audio amplifiers and radio antennas are matched to their speakers and cables this way.`,
            },
            {
              type: 'numeric',
              title: 'Short circuit',
              prompt: r`An AA battery has an EMF of 1.5 V and an internal resistance of about 0.15 Ω. If its terminals are joined by a thick wire (resistance ≈ 0), what current flows?`,
              unit: 'A',
              answer: 10,
              wrong: [{ v: 0.225, tol: 0.01, why: 'Divide the EMF by the internal resistance.' }],
              explain: r`$I = \frac{\varepsilon}{r} = \frac{1.5}{0.15} = 10$ A, all of it heating the battery's inside. That's why shorting a battery is dangerous; a car battery's internal resistance is tiny, allowing hundreds of amps.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Matching for efficiency?',
              prompt: r`At maximum power transfer ($R = r$), what fraction of the battery's energy ends up in the load?`,
              choices: [
                { t: 'Half: the other half is wasted in the internal resistance', ok: true },
                { t: 'All of it', why: 'The same current flows through r and R; with R = r they dissipate equal power.' },
                { t: 'Almost none', why: 'Half reaches the load.' },
              ],
              explain: r`With equal resistances in series, the power splits 50–50. That's fine for a radio signal, but terrible for a power station, which keeps its internal resistance tiny compared with the load to waste as little energy as possible.`,
            },
          ],
          recap: [
            r`Terminal voltage $V = \varepsilon - Ir$ falls as current rises.`,
            'Maximum power reaches the load when its resistance equals the internal resistance.',
            'At that point efficiency is only 50%.',
          ],
        },
        {
          id: 'kirchhoff',
          title: 'Kirchhoff & Dividers',
          summary: 'Two laws for any circuit',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Kirchhoff’s laws',
              body: r`In 1845, Gustav Kirchhoff summed up circuits in two rules:
- **Junction rule:** the current flowing into any junction equals the current flowing out. (Charge isn't created or lost.)
- **Loop rule:** around any closed loop, the voltage rises (batteries) equal the voltage drops (resistors). (Energy is conserved.)

With these two rules, any circuit, however tangled, can be solved.`,
            },
            {
              type: 'numeric',
              title: 'At a junction',
              prompt: r`3 A flows into a junction and splits into two branches. One branch carries 1.2 A. What does the other carry?`,
              unit: 'A',
              answer: 1.8,
              wrong: [{ v: 4.2, why: 'The branches share the incoming current; they don’t add to it.' }],
              explain: r`$3 - 1.2 = 1.8$ A. What flows in must flow out.`,
            },
            {
              type: 'numeric',
              title: 'Around a loop',
              prompt: r`A 9 V battery drives current through two resistors in series. The voltage across the first is 4 V. What's the voltage across the second?`,
              unit: 'V',
              answer: 5,
              wrong: [{ v: 13, why: 'The drops must add up to the battery’s 9 V.' }],
              explain: r`$9 - 4 = 5$ V: the drops around the loop add up to the rise across the battery.`,
            },
            {
              type: 'explain',
              title: 'The voltage divider',
              body: r`Two resistors in series share the supply voltage in proportion to their resistances. Taking the output across the second one gives a **voltage divider**:
$$V_{\text{out}} = V_{\text{in}} \frac{R_2}{R_1 + R_2}$$
Dividers turn one supply voltage into another, and, with a sensor as one of the resistors, turn light or temperature into a voltage a microcontroller can read.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Make 3.3 volts',
              prompt: r`A 5 V supply feeds a divider with $R_1 = 10$ kΩ. Choose $R_2$ to get **3.3 V** out, the voltage many microchips run on.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 5, grid: 5, gridY: 1, height: 260, axes: { xlabel: 'R₂ (kΩ)', ylabel: 'V out (V)' },
                params: { R2: { min: 0.5, max: 50, step: 0.1, value: 5, slider: false } },
                curves: [{ f: (x) => vdiv(x), color: 'violet', width: 3 }, { f: () => 3.3, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.R2, y: (p) => vdiv(p.R2), drag: { x: 'R2' }, color: 'teal' }],
                readout: (p) => r`$R_2 = ${p.R2.toFixed(1)}$ kΩ: $V_{\text{out}} = 5 \times \frac{${p.R2.toFixed(1)}}{${(10 + p.R2).toFixed(1)}} = ${vdiv(p.R2).toFixed(2)}$ V`,
                goal: (p) => Math.abs(vdiv(p.R2) - 3.3) < 0.02,
                hint: r`Solve $5 \times \frac{R_2}{10 + R_2} = 3.3$.`,
                solution: { R2: 19.4 },
              },
              explain: r`$R_2 = \frac{3.3 \times 10}{5 - 3.3} \approx 19.4$ kΩ. In practice you'd use a standard 20 kΩ resistor (3.33 V). Notice how the output never reaches 5 V, however large $R_2$ is.`,
            },
            {
              type: 'mcq',
              title: 'A night light',
              prompt: r`A light-dependent resistor (LDR) has high resistance in the dark and low resistance in bright light. It's used as $R_2$ in a divider. What happens to $V_{\text{out}}$ at night?`,
              choices: [
                { t: 'It rises, because R₂ takes a bigger share of the total resistance', ok: true },
                { t: 'It falls', why: r`$V_{\text{out}} = V_{\text{in}}\frac{R_2}{R_1 + R_2}$ grows as $R_2$ grows.` },
                { t: 'It stays the same', why: 'Changing R₂ changes how the voltage is shared.' },
              ],
              explain: r`In the dark, $R_2$ dominates and $V_{\text{out}}$ approaches $V_{\text{in}}$. A circuit can switch on street lights when this voltage passes a threshold.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Loading the divider',
              prompt: r`A divider with $R_1 = R_2 = 10$ kΩ gives 2.5 V from 5 V. A device with 10 kΩ resistance is connected across $R_2$ (in parallel with it). What does $V_{\text{out}}$ become? (2 decimal places.)`,
              unit: 'V',
              answer: 5 / 3,
              tol: 0.01,
              wrong: [{ v: 2.5, why: 'The device in parallel lowers the bottom resistance to 5 kΩ.' }],
              explain: r`10 kΩ in parallel with 10 kΩ is 5 kΩ, so $V_{\text{out}} = 5 \times \frac{5}{15} \approx 1.67$ V. Connecting a load changes a divider's output, a common surprise in electronics. Engineers use dividers with much smaller resistances than the load, or add a buffer amplifier.`,
            },
          ],
          recap: [
            'Junction rule: current in = current out. Loop rule: rises = drops.',
            r`Voltage divider: $V_{\text{out}} = V_{\text{in}} R_2 / (R_1 + R_2)$.`,
            'A sensor in a divider turns light or temperature into a voltage; loads change the output.',
          ],
        },
      ],
    },
  ],
};
