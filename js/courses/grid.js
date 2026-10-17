import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);
// 100 MW sent through lines with 10 Ω total resistance
const P = 100e6, RL = 10;
const lossPct = (kV) => (((P / (kV * 1000)) ** 2 * RL) / P) * 100;

// a day's demand (GW) and solar output for a given installed capacity, by hour
const demandGW = (h) => 30 + 8 * Math.exp(-(((h - 19) / 2.5) ** 2)) + 5 * Math.exp(-(((h - 8) / 2) ** 2)) - 6 * Math.exp(-(((h - 3.5) / 3) ** 2));
const solarGW = (h, cap) => (h > 6 && h < 20 ? cap * Math.sin((Math.PI * (h - 6)) / 14) : 0);
const steepestRamp = (cap) => { let m = 0; for (let i = 0; i < 210; i++) { const h = i / 10; m = Math.max(m, (demandGW(h + 3) - solarGW(h + 3, cap) - (demandGW(h) - solarGW(h, cap))) / 3); } return m; };
// frequency after losing 10% of supply: inertia H (s), response ramp time T (s), 4% droop
const freqRun = (H, T) => { let df = 0; const out = [[0, 50]]; for (let i = 1; i <= 6000; i++) { const t = i * 0.005, resp = Math.min(1, t / T) * (-df / (50 * 0.04)); df += (0.005 * 50 * (resp - 0.1)) / (2 * H); if (i % 20 === 0) out.push([t, 50 + df]); } return out; };
const nadir = (H, T) => Math.min(...freqRun(H, T).map((q) => q[1]));
// three-phase: neutral current for phase amplitudes 1, b, c
const neutral = (b, c) => Math.hypot(1 + b * Math.cos((2 * Math.PI) / 3) + c * Math.cos((4 * Math.PI) / 3), b * Math.sin((2 * Math.PI) / 3) + c * Math.sin((4 * Math.PI) / 3));

export default {
  id: 'grid',
  subject: 'physics',
  title: 'The Power Grid',
  level: 'Intermediate',
  cover: 'grid',
  tagline: 'High-voltage lines, AC, three-phase power, balancing supply and demand, and staying safe.',
  description: r`Flip a switch and electricity generated hundreds of kilometres away arrives instantly. Discover why power lines run at hundreds of thousands of volts, what "230 volts AC" really means, how grid operators keep supply and demand balanced every second, how fuses and safety switches protect you, why there are three wires on every pylon, and what happens in the seconds after a power station trips.`,
  prereq: 'Electricity & Circuits',
  chapters: [
    {
      title: 'Getting Power to You',
      summary: 'Transmission and AC.',
      lessons: [
        {
          id: 'transmission',
          title: 'Why High Voltage?',
          summary: 'Losses go as current squared',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Heating the wires',
              body: r`A power station sends power $P = VI$ down long cables. The cables have some resistance $R$, and they waste power as heat:
$$P_{\text{loss}} = I^2 R$$
For a fixed power $P$, raising the voltage $V$ lowers the current $I = P/V$, and the losses fall with the **square** of the current.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose the voltage',
              prompt: r`A power station sends 100 MW through lines with a total resistance of 10 Ω. Find the **lowest** transmission voltage (in steps of 50 kV) that keeps losses below **1%**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 520, ymin: 0, ymax: 20, grid: 50, gridY: 4, height: 300, axes: { xlabel: 'voltage (kV)', ylabel: 'losses (%)' },
                params: { V: { min: 50, max: 500, step: 50, value: 100, label: 'voltage', color: 'blue', format: (v) => `${v} kV` } },
                curves: [{ f: (x) => (x >= 20 ? lossPct(x) : NaN), color: 'coral', width: 3 }, { f: () => 1, color: 'teal', dash: true }],
                points: [{ x: (p) => p.V, y: (p) => Math.min(20, lossPct(p.V)), color: 'blue' }],
                readout: (p) => r`current $I = P/V = ${Math.round(P / (p.V * 1000))}$ A $\;\Rightarrow\;$ losses $I^2R = ${f2(lossPct(p.V))}\%$ of the power`,
                goal: (p) => lossPct(p.V) < 1 && lossPct(p.V - 50) >= 1,
                hint: r`You need $I^2 \times 10 < 10^6$ W, so $I$ must be below about 316 A.`,
                solution: { V: 350 },
              },
              explain: r`At 300 kV the current is 333 A and the losses are 1.1%. At **350 kV** the current is 286 A and the losses drop to 0.8%. That's why long-distance lines run at hundreds of kilovolts, while homes use a much safer 120–240 V, with transformers converting between them.`,
            },
            {
              type: 'numeric',
              title: 'Heat in the wires',
              prompt: r`A current of 1000 A flows through transmission cables with a total resistance of 5 Ω. How much power is lost as heat, in megawatts?`,
              unit: 'MW',
              answer: 5,
              wrong: [{ v: 0.005, tol: 0.0001, why: r`$I^2R = 1000^2 \times 5 = 5{,}000{,}000$ W, which is 5 MW.` }, { v: 5000, why: 'That’s IR, in volts. Power lost is I²R.' }],
              explain: r`$I^2R = 10^6 \times 5 = 5 \times 10^6$ W $= 5$ MW, enough to power a few thousand homes, just warming the cables.`,
            },
            {
              type: 'mcq',
              title: 'Under the sea',
              prompt: r`Very long undersea cables, like those linking Britain to Norway, use high-voltage **DC** rather than AC. Why?`,
              choices: [
                { t: 'A long cable acts like a huge capacitor; with AC, much of the current is wasted charging and discharging it every cycle', ok: true },
                { t: 'Seawater conducts AC away', why: 'The cables are well insulated. The issue is the cable’s own capacitance, which AC must charge 100 times a second.' },
                { t: 'DC is safer for fish', why: 'The reason is electrical efficiency: avoiding the cable’s charging current.' },
              ],
              explain: r`An insulated cable surrounded by seawater is a long capacitor. AC would have to charge it up and down 100 or 120 times a second, using up most of the cable's capacity for long runs. HVDC avoids that, at the cost of expensive converter stations at each end. Modern power electronics now make it the standard for links over a few dozen kilometres underwater.`,
            },
            {
              type: 'numeric',
              title: 'Losses at 10 kV',
              prompt: r`Sending 1 MW at 10 kV needs a current of 100 A. If the line has a resistance of 5 Ω, how much power is lost as heat ($I^2R$), in kilowatts?`,
              unit: 'kW',
              answer: 50,
              explain: r`$100^2 \times 5 = 50{,}000$ W $= 50$ kW: 5% of the power. At 100 kV the current would be 10 A and the loss only 0.5 kW.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ten times the voltage',
              prompt: r`If the transmission voltage is raised by a factor of 10 (same power, same cables), by what factor do the losses change?`,
              unit: '×',
              answer: 0.01,
              tol: 0.0001,
              wrong: [{ v: 0.1, why: r`Current falls by 10, but losses go as $I^2$: a factor of $\frac{1}{100}$.` }, { v: 100, why: 'Higher voltage means lower current, and so lower losses, not higher.' }],
              explain: r`Current drops by a factor of 10, so $I^2R$ drops by $10^2 = 100$: the losses become **1/100**. This is why Edison's low-voltage DC systems lost the "war of the currents" in the 1890s: AC voltages could easily be stepped up with transformers.`,
            },
          ],
          recap: [
            r`Transmission losses $= I^2R$.`,
            r`For fixed power, higher voltage means lower current: 10× the voltage gives 1/100 of the losses.`,
            'Transformers make high-voltage transmission possible.',
          ],
        },
        {
          id: 'ac',
          title: 'Alternating Current',
          summary: 'What “230 volts” means',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A wave of voltage',
              body: r`Mains electricity is **AC**: the voltage swings back and forth sinusoidally, 50 times a second in Europe and much of the world, and 60 times in North America. Its power heats a kettle just as well as steady DC would, on average.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.04, ymin: -380, ymax: 380, grid: 0.005, gridY: 100, height: 290, padL: 52, axes: { xlabel: 'time', ylabel: 'volts', yAt: -380, xfmt: (v) => `${Math.round(v * 1000)}ms` },
                params: { f: { min: 50, max: 60, step: 10, value: 50, label: 'frequency', color: 'blue', format: (v) => `${v} Hz` } },
                curves: [
                  { f: () => 0, color: 'muted', width: 1.5 },
                  { f: (t, p) => 325 * Math.sin(2 * Math.PI * p.f * t), color: 'blue', width: 3 },
                  { f: () => 230, color: 'coral', dash: true },
                  { f: () => 325, color: 'ink', dash: true },
                ],
                readout: (p) => r`${p.f} cycles per second: one cycle every $${f2(1000 / p.f)}$ ms. Peak (black): 325 V. RMS (coral): 230 V.`,
              },
              after: r`The "230 V" on the label is the **RMS** (root-mean-square) voltage: the steady DC voltage that would deliver the same average power. For a sine wave, the peak is $\sqrt2$ times higher.`,
            },
            {
              type: 'numeric',
              title: 'Peak voltage',
              prompt: r`In North America, mains is 120 V RMS. What is the peak voltage? (Nearest volt.)`,
              unit: 'V',
              answer: 120 * Math.SQRT2,
              tol: 1,
              wrong: [{ v: 85, why: r`Multiply by $\sqrt2$, don't divide: the peak is higher than the RMS value.` }, { v: 240, why: r`It's $\sqrt2 \approx 1.414$ times the RMS value, not 2 times.` }],
              explain: r`$120 \times \sqrt2 \approx 170$ V. The voltage swings between $+170$ V and $-170$ V, 60 times a second, but delivers the same average power as 120 V DC.`,
            },
            {
              type: 'numeric',
              title: 'What a cup of tea costs',
              prompt: r`A 2 kW kettle runs for 3 minutes. Electricity costs 30p per kilowatt-hour. How much does boiling it cost, in pence?`,
              unit: 'p',
              answer: 3,
              wrong: [{ v: 180, why: '3 minutes is 0.05 hours, not 3 hours.' }, { v: 0.1, why: 'That’s the energy in kWh. Multiply by 30p per kWh.' }],
              explain: r`Energy $= 2 \text{ kW} \times 0.05 \text{ h} = 0.1$ kWh, costing $0.1 \times 30 = 3$p. The kilowatt-hour, 3.6 million joules, is the unit on every electricity bill.`,
            },
            {
              type: 'numeric',
              title: 'Sixty cycles',
              prompt: r`North American mains electricity alternates at 60 Hz. How long is one complete cycle, in milliseconds? (1 decimal place.)`,
              unit: 'ms',
              answer: 1000 / 60,
              tol: 0.06,
              explain: r`$\frac{1}{60}$ s $\approx 16.7$ ms (Europe’s 50 Hz gives 20 ms). The current reverses direction twice per cycle: 120 times a second, which is why some cheap lights and old monitors flicker at that rate.`,
            },
            {
              type: 'numeric',
              title: 'Using the RMS value',
              prompt: r`A heater with resistance 23 Ω is plugged into 230 V (RMS) mains. What is its average power, in watts?`,
              unit: 'W',
              answer: 2300,
              tol: 5,
              wrong: [{ v: 4600, tol: 10, why: r`That uses the peak voltage ($230\sqrt2$). The RMS value is defined so that $V_\text{RMS}^2/R$ gives the average power directly.` }, { v: 10, tol: 0.1, why: r`That's the current, $230/23$. Power is $V^2/R$ (or $VI$).` }],
              explain: r`$P = \frac{V_\text{RMS}^2}{R} = \frac{230^2}{23} = 2300$ W. That's the point of RMS values: all the DC formulas work unchanged for average power. The instantaneous power swings between 0 and 4600 W, 100 times a second.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why √2?',
              prompt: r`Power in a resistor is $V^2/R$. Over one cycle, the average of $\sin^2$ is $\tfrac12$. What does that imply?`,
              choices: [
                { t: r`Average power $= \dfrac{V_{\text{peak}}^2}{2R}$, the same as a DC voltage of $V_{\text{peak}}/\sqrt2$`, ok: true },
                { t: r`Average power is zero, because the voltage averages to zero`, why: r`The voltage averages to zero, but $V^2$ is never negative, so the power doesn't.` },
                { t: r`Average power equals $V_{\text{peak}}^2/R$`, why: r`That would be true only if the voltage stayed at its peak all the time.` },
              ],
              explain: r`$\overline{P} = \dfrac{V_{\text{peak}}^2\,\overline{\sin^2}}{R} = \dfrac{V_{\text{peak}}^2}{2R} = \dfrac{(V_{\text{peak}}/\sqrt2)^2}{R}$. So the effective (RMS) voltage is $V_{\text{peak}}/\sqrt2$.`,
            },
          ],
          recap: [
            'Mains is AC at 50 or 60 Hz.',
            r`RMS voltage $= V_{\text{peak}} / \sqrt2$: 230 V RMS peaks at 325 V.`,
            'RMS gives the same average power as an equal DC voltage.',
          ],
        },
      ],
    },
    {
      title: 'Running the Grid',
      summary: 'Balance and safety.',
      lessons: [
        {
          id: 'balance',
          title: 'Balancing Act',
          summary: 'Supply must equal demand',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'No storage in the wires',
              body: r`The grid stores almost no energy itself, so generation must match consumption **every second**. Large generators are heavy spinning machines, all turning in sync with the grid's frequency. If demand suddenly exceeds supply, the extra energy is drawn from their spinning motion: they slow down slightly, and the grid frequency drops a little below 50 Hz (or 60 Hz).

Operators watch the frequency constantly and adjust generation to hold it steady, typically within a fraction of a percent.`,
            },
            {
              type: 'mcq',
              title: 'Half-time kettles',
              prompt: r`In Britain, grid operators prepare for a sudden surge in demand at the end of major televised events, such as World Cup matches. Why?`,
              choices: [
                { t: 'Millions of people switch on kettles at the same moment', ok: true },
                { t: 'TVs use more power at the end of programmes', why: 'TV power use doesn’t change much. Viewers’ kettles do.' },
                { t: 'Street lights switch on', why: 'Street lights are timed to the light level, not to TV schedules.' },
              ],
              explain: r`This "TV pickup" can add a demand surge of a gigawatt or more within minutes, the output of a large power station. Operators schedule extra fast-responding generation, such as pumped hydro, in advance.`,
            },
            {
              type: 'interactive',
              title: 'The duck curve',
              body: r`The black curve is a day's electricity demand; the amber curve is **net demand**, what other power stations must supply once solar panels have done their bit. Add solar capacity and watch the shape. Find how much solar makes the steepest evening ramp more than **twice** as steep as it is without solar.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 24, ymin: 0, ymax: 45, grid: false, height: 280, axes: { xlabel: 'hour of day', ylabel: 'GW', xticks: 3, yticks: 10 },
                params: { cap: { min: 0, max: 30, step: 1, value: 5, label: 'solar capacity', color: 'amber', format: (v) => `${v} GW` } },
                curves: [{ f: (h) => demandGW(h), color: 'ink', width: 2, dash: true }, { f: (h, p) => demandGW(h) - solarGW(h, p.cap), color: 'amber', width: 3, n: 300 }],
                readout: (p) => `Steepest 3-hour climb in net demand: **${steepestRamp(p.cap).toFixed(1)} GW per hour** (${(steepestRamp(p.cap) / steepestRamp(0)).toFixed(2)} × the no-solar value)`,
                goal: (p) => steepestRamp(p.cap) > 2 * steepestRamp(0),
                hint: 'Solar dips the middle of the day; the evening peak, after sunset, stays. More solar means a deeper dip and a steeper climb.',
                solution: { cap: 22 },
              },
              explain: r`With lots of solar, net demand sags at midday (the duck's belly) and then shoots up as the sun sets just when people get home (the duck's neck). Other generators must ramp up very fast. The name comes from California's grid operator, whose forecast graph looked like a duck. Batteries that charge at noon and discharge in the evening flatten the duck.`,
            },
            {
              type: 'numeric',
              title: 'A mountain battery',
              prompt: r`A pumped-hydro plant can drop a million cubic metres of water (a billion kilograms) through 300 m. How much energy is that, in megawatt-hours? ($E = mgh$, $g = 9.8$ m/s², 1 MWh $= 3.6 \times 10^9$ J.)`,
              unit: 'MWh',
              answer: (1e9 * 9.8 * 300) / 3.6e9,
              relTol: 0.01,
              wrong: [{ v: 1e9 * 9.8 * 300, relTol: 0.01, why: 'That’s in joules. Divide by 3.6 × 10⁹ J per MWh.' }],
              explain: r`$mgh = 10^9 \times 9.8 \times 300 \approx 2.9 \times 10^{12}$ J $\approx 820$ MWh, enough to supply about 800 MW for an hour. Dinorwig in Wales, built inside a mountain, stores about 9 GWh and can reach full power in about 16 seconds.`,
            },
            {
              type: 'numeric',
              title: 'A tonne for a kilowatt-hour',
              prompt: r`How high must you lift one tonne (1000 kg) of water to store 1 kWh ($3.6 \times 10^6$ J)? ($g = 9.8$ m/s²; nearest metre.)`,
              unit: 'm',
              answer: 3.6e6 / (1000 * 9.8),
              tol: 2,
              wrong: [{ v: 0.367, tol: 0.01, why: 'Check the units: 1 kWh is 3.6 million joules, not 3600.' }],
              explain: r`$h = \frac{E}{mg} = \frac{3.6 \times 10^6}{9800} \approx 367$ m. A tonne lifted higher than the Eiffel Tower stores what a kettle uses in half an hour. Gravity is a weak store per kilogram, which is why pumped hydro needs mountains and whole lakes, and why batteries win for small, portable storage.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Storing energy',
              prompt: r`Wind and solar output varies with the weather. Which of these is the largest form of grid energy storage worldwide (by stored energy) today?`,
              choices: [
                { t: 'Pumped hydro: pumping water uphill into a reservoir, then letting it flow back through turbines', ok: true },
                { t: 'Car batteries', why: 'Grid batteries are growing fast, but pumped hydro still stores far more energy in total.' },
                { t: 'Compressed springs', why: 'Springs store far too little energy for a grid.' },
              ],
              explain: r`Pumped hydro stores energy as gravitational potential energy, $mgh$, and returns about 70–80% of it. It still accounts for the large majority of the world's stored grid energy, although battery storage is growing rapidly.`,
            },
          ],
          recap: [
            'Supply and demand must balance every second.',
            'Grid frequency dips when demand exceeds supply.',
            'Storage like pumped hydro and batteries smooths out mismatches.',
          ],
        },
        {
          id: 'safety',
          title: 'Electrical Safety',
          summary: 'Fuses, earthing and RCDs',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'It’s the current that hurts',
              body: r`The danger from electricity comes from **current through the body**. Around 1 mA can be felt, about 10–20 mA can make muscles lock so you can't let go, and around 50–100 mA through the chest can stop the heart. Dry skin has a fairly high resistance, but wet skin far less, which is why water and electricity are such a dangerous mix.`,
            },
            {
              type: 'numeric',
              title: 'Wet hands',
              prompt: r`With wet hands, the resistance through a person's body might be about 1,000 Ω. What current would flow if they touched 230 V? (In mA.)`,
              unit: 'mA',
              answer: 230,
              wrong: [{ v: 0.23, why: r`$I = V/R = 230/1000 = 0.23$ A, which is 230 mA.` }, { v: 230000, why: r`$I = V/R$: divide the voltage by the resistance.` }],
              explain: r`$I = \dfrac{230}{1000} = 0.23$ A $= 230$ mA: easily enough to be fatal. That's why bathrooms have special wiring rules and sockets are kept away from water.`,
            },
            {
              type: 'numeric',
              title: 'Choosing a fuse',
              prompt: r`A 3 kW kettle runs on 230 V. What current does it draw, in amps? (1 decimal place.)`,
              unit: 'A',
              answer: 3000 / 230,
              tol: 0.06,
              wrong: [{ v: 0.077, tol: 0.002, why: r`$I = P/V = 3000/230$, not $V/P$.` }],
              explain: r`$I = \frac{3000}{230} \approx 13.0$ A, which is why British plugs for kettles carry 13 A fuses, the largest standard size. If a fault makes the current much larger, the fuse wire melts and breaks the circuit before the cable overheats.`,
            },
            {
              type: 'mcq',
              title: 'Birds on a wire',
              prompt: r`A bird can perch safely on a bare high-voltage power line. Why doesn't it get a shock?`,
              choices: [
                { t: 'Both its feet are at the same voltage, so there’s no voltage difference to drive current through it', ok: true },
                { t: 'Birds have very high resistance', why: 'Their resistance isn’t special. What matters is that there’s no voltage difference across the bird.' },
                { t: 'The current is too small in power lines', why: 'Power lines carry hundreds of amps. The bird is simply not part of any circuit.' },
              ],
              explain: r`Current needs a voltage difference. Both feet touch the same wire, at the same voltage, so practically no current flows through the bird. Touch the wire while also touching a pole, the ground or another wire, and there is a large voltage difference: that's why large birds with wide wingspans are sometimes electrocuted, and why line workers use insulated equipment.`,
            },
            {
              type: 'interactive',
              title: 'How much current flows?',
              body: r`Your body’s resistance depends mostly on your skin: perhaps 100 kΩ when dry but about 1 kΩ when wet. At 230 V, $I = V/R$. A residual-current device (RCD) cuts the power at **30 mA**. Find the body resistance at which 230 V drives exactly 30 mA.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 250, grid: false, height: 260, axes: { xlabel: 'body resistance (kΩ)', ylabel: 'current (mA)', xticks: 10, yticks: 50 },
                params: { R: { min: 1, max: 50, step: 0.05, value: 20, label: 'resistance', color: 'coral', format: (v) => `${v.toFixed(2)} kΩ` } },
                curves: [{ f: (x) => 230 / x, color: 'violet', width: 3, from: 0.9 }, { f: () => 30, color: 'teal', dash: true }, { f: () => 10, color: 'amber', dash: true }, { f: () => 100, color: 'coral', dash: true }],
                points: [{ x: (p) => p.R, y: (p) => 230 / p.R, color: 'coral' }],
                readout: (p) => { const I = 230 / p.R; return `current **${I.toFixed(1)} mA** · ${I < 1 ? 'barely felt' : I < 10 ? 'painful tingle' : I < 30 ? 'muscles lock: you may not be able to let go' : I < 100 ? 'dangerous: the RCD should trip' : 'can stop the heart'}`; },
                goal: (p) => Math.abs(230 / p.R - 30) < 0.15,
                hint: 'R = 230 V ÷ 0.030 A.',
                solution: { R: 7.65 },
              },
              explain: r`$230 / 0.030 \approx 7{,}700$ Ω. Damp skin can easily be lower than that, so mains current through a wet body can be deadly; it is current, not voltage, that hurts. An RCD compares the current going out and coming back and cuts the power within about 30 ms if 30 mA goes missing.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The life-saving switch',
              prompt: r`A **residual current device** (RCD, or GFCI in North America) compares the current flowing out through the live wire with the current returning through the neutral wire. If they differ by about 30 mA (5 mA for a GFCI), it cuts the power within a fraction of a second. Why does that detect a shock?`,
              choices: [
                { t: 'A difference means some current is leaking another way, possibly through a person to the ground', ok: true },
                { t: 'A shock always increases the total current massively', why: 'A dangerous shock can be far smaller than the normal current of an appliance. The imbalance is what gives it away.' },
                { t: 'It detects the person’s body heat', why: 'RCDs are purely electrical: they compare the two currents.' },
              ],
              explain: r`Normally every electron that goes out on the live wire comes back on the neutral. If some current takes a different path, through a person to earth, the two no longer match. A fuse only blows at many amps (protecting wiring from fire), but an RCD reacts to a few tens of milliamps, fast enough to save lives.`,
            },
          ],
          recap: [
            'Current through the body is what causes harm: tens of milliamps can be deadly.',
            'Wet skin has much lower resistance, so more current flows.',
            'Fuses protect wiring; RCDs detect leakage currents and protect people.',
          ],
        },
      ],
    },
    {
      title: 'Inside the Machine',
      summary: 'Three-phase power and keeping the frequency steady.',
      lessons: [
        {
          id: 'threephase',
          title: 'Three-Phase Power',
          summary: 'Three waves that add to zero',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Three wires',
              prompt: 'High-voltage pylons usually carry cables in groups of three. Why three?',
              choices: [
                { t: 'The grid uses three-phase AC: three waves, a third of a cycle apart, delivering smooth power efficiently', ok: true },
                { t: 'Two are spares in case one breaks', why: 'All three carry power all the time, each with its own phase.' },
                { t: 'One for each of three towns', why: 'The three cables together feed the same loads, each with a wave shifted by a third of a cycle.' },
              ],
              explain: r`Generators have three sets of coils spaced $120°$ apart, producing three AC waves each a third of a cycle behind the last. This **three-phase** system, developed in the 1880s and 1890s by Nikola Tesla, Mikhail Dolivo-Dobrovolsky and others, is used by nearly every grid in the world.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Three waves',
              body: r`Here are the three phase voltages, $120°$ apart. Move the time marker and watch the values, and their sum.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.04, ymin: -380, ymax: 380, grid: false, height: 290, padL: 52, axes: { xlabel: 'time', ylabel: 'volts', xticks: 0.01, yticks: 100, yAt: -380, xfmt: (v) => `${Math.round(v * 1000)}ms` },
                params: { t: { min: 0, max: 0.04, step: 0.0005, value: 0.003, label: 'time', color: 'ink', format: (v) => `${(v * 1000).toFixed(1)} ms` } },
                curves: [{ f: () => 0, color: 'muted', width: 1.5 }, ...[0, 1, 2].map((k) => ({ f: (t) => 325 * Math.sin(2 * Math.PI * 50 * t - (2 * Math.PI * k) / 3), color: ['blue', 'coral', 'teal'][k], width: 2.5 }))],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.t), x2: plot.X(p.t), y1: plot.Y(-380), y2: plot.Y(380), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }), ...[0, 1, 2].map((k) => s('circle', { cx: plot.X(p.t), cy: plot.Y(325 * Math.sin(2 * Math.PI * 50 * p.t - (2 * Math.PI * k) / 3)), r: 5, class: ['fl-blue', 'fl-coral', 'fl-teal'][k] }))],
                readout: (p) => { const v = [0, 1, 2].map((k) => 325 * Math.sin(2 * Math.PI * 50 * p.t - (2 * Math.PI * k) / 3)); return `${v.map((x) => Math.round(x)).join(' + ')} = **${Math.round(v[0] + v[1] + v[2])} V**`; },
              },
              after: r`At every instant the three voltages add up to **zero**. So if three equal loads share a common return wire (the **neutral**), the currents cancel there and the return wire carries almost nothing: three circuits for the price of about three wires instead of six.`,
            },
            {
              type: 'interactive',
              title: 'Balance the loads',
              body: r`Three houses are fed from the three phases. The current in phase A is fixed at 1 (in some unit). Adjust the currents drawn on phases B and C so the **neutral** wire carries (almost) no current.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 1.6, ymin: -1.5, ymax: 1.5, grid: false, axes: false, maxWidth: 360,
                params: {
                  b: { min: 0, max: 1.5, step: 0.05, value: 0.5, label: 'phase B current', color: 'coral' },
                  c: { min: 0, max: 1.5, step: 0.05, value: 1.2, label: 'phase C current', color: 'teal' },
                },
                extra: ({ plot, p, arrow }) => {
                  const vec = [[1, 0], [p.b * Math.cos((2 * Math.PI) / 3), p.b * Math.sin((2 * Math.PI) / 3)], [p.c * Math.cos((4 * Math.PI) / 3), p.c * Math.sin((4 * Math.PI) / 3)]];
                  const sx = vec.reduce((a, v) => a + v[0], 0), sy = vec.reduce((a, v) => a + v[1], 0);
                  const els = vec.map(([x, y], k) => arrow(plot.X(0), plot.Y(0), plot.X(x), plot.Y(y), { color: `var(--${['blue', 'coral', 'teal'][k]})`, width: 4, head: 11 }));
                  if (Math.hypot(sx, sy) > 0.03) els.push(arrow(plot.X(0), plot.Y(0), plot.X(sx), plot.Y(sy), { color: 'var(--ink)', width: 3, head: 10 }));
                  return els;
                },
                readout: (p) => `Neutral current (black arrow): **${neutral(p.b, p.c).toFixed(2)}**`,
                goal: (p) => neutral(p.b, p.c) < 0.05,
                hint: 'The three arrows point 120° apart. They cancel only if they’re the same length.',
                solution: { b: 1, c: 1 },
              },
              explain: r`Each phase's current is an arrow (a **phasor**) pointing $120°$ from the others; the neutral carries their sum. Equal arrows cancel completely. Electricity companies spread houses evenly across the three phases so the neutral stays lightly loaded, and an unbalanced street wastes power heating its neutral wire.`,
            },
            {
              type: 'numeric',
              title: 'Between two phases',
              prompt: r`Each phase is 230 V (RMS) relative to neutral. The voltage **between** two phases is $\sqrt3$ times that. What is it, to the nearest volt?`,
              unit: 'V',
              answer: 230 * Math.sqrt(3),
              tol: 1,
              wrong: [{ v: 460, why: r`The phases are $120°$ apart, not opposite, so the difference is $\sqrt3$ times one phase, not 2 times.` }, { v: 230, why: 'Two different phases have different voltages at each instant, so there’s a voltage between them.' }],
              explain: r`$230 \times \sqrt3 \approx 398$ V, the "400 V three-phase" supply used by factories, electric-car fast chargers and large motors. The $\sqrt3$ comes from the geometry of two arrows $120°$ apart: the gap between their tips is $\sqrt3$ times their length.`,
            },
            {
              type: 'numeric',
              title: 'Three-phase power',
              prompt: r`A workshop draws 10 A (RMS) on each of the three 230 V phases, with simple resistive loads. What total power does it use, in kilowatts?`,
              unit: 'kW',
              answer: 6.9,
              tol: 0.01,
              wrong: [{ v: 2.3, tol: 0.01, why: 'That’s one phase. There are three.' }, { v: 3.98, tol: 0.02, why: r`Each phase delivers $230 \times 10$ W; add all three.` }],
              explain: r`$3 \times 230 \times 10 = 6900$ W $= 6.9$ kW. Better still, with balanced loads the **total** power is perfectly steady from instant to instant (single-phase power pulses at twice the mains frequency), which makes motors run smoothly.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The rotating field',
              prompt: r`Three coils arranged $120°$ apart around a motor are fed by the three phases. What kind of magnetic field do they make in the middle?`,
              choices: [
                { t: 'A field of constant strength that rotates steadily, dragging the rotor round', ok: true },
                { t: 'A field that just flips back and forth', why: 'That’s a single coil on single-phase AC. Three phases, staggered in time and space, add up to a rotating field.' },
                { t: 'No field: the three cancel', why: 'The currents add to zero in the neutral, but the coils point in different directions, so their fields add up to a rotating one.' },
              ],
              explain: r`Each coil's field pulses along its own direction, a third of a cycle after the previous one, and together they make a field of constant strength rotating 50 times a second. Tesla's **induction motor** uses it: the spinning field induces currents in the rotor that drag it round, with no brushes or contacts. Most industrial motors, and many electric cars, work this way.`,
            },
          ],
          recap: [
            'Three-phase AC uses three waves 120° apart, which add to zero at every instant.',
            'Balanced loads leave the neutral empty; line-to-line voltage is √3 × 230 ≈ 400 V.',
            'Three phases deliver steady power and create rotating fields for induction motors.',
          ],
        },
        {
          id: 'frequency',
          title: 'Keeping 50 Hz',
          summary: 'Inertia, response and blackouts',
          icon: 'clock',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A power station trips',
              prompt: 'A large power station suddenly shuts down. In the first second, before anyone reacts, what happens to the grid frequency?',
              choices: [
                { t: 'It starts to fall, as the remaining generators slow down', ok: true },
                { t: 'It rises', why: 'Less power is coming in, so the spinning generators lose energy and slow down.' },
                { t: 'Nothing, until the operators notice', why: 'Physics responds instantly: the missing power is taken from the generators’ spinning energy, so they slow.' },
              ],
              explain: r`For a moment, demand exceeds supply, and the shortfall is drawn from the kinetic energy of every spinning generator on the grid. They all slow together, and the frequency falls. How fast it falls depends on how much spinning mass there is: the grid's **inertia**.`,
            },
            {
              type: 'explain',
              title: 'Inertia and response',
              body: r`Heavy turbines spinning at 3000 rpm store huge amounts of kinetic energy, which buys time. Within seconds, automatic controls on some generators and batteries sense the falling frequency and raise their output (**frequency response**). The frequency stops falling at its lowest point, the **nadir**, then settles slightly below 50 Hz until operators bring in more generation.

Grids must keep the nadir above a safety limit, typically around 49.5 Hz in Britain; below about 48.8 Hz, automatic **load shedding** cuts off blocks of customers to save the rest.`,
            },
            {
              type: 'interactive',
              title: 'Stop the fall',
              body: r`A tenth of the grid's supply suddenly disappears. The **inertia** $H$ measures how much spinning energy the grid has; the **response time** is how long the backup takes to ramp up fully. In a future grid with lots of wind and solar (inertia $H$ of 3 s or less), how fast must the response be to keep the frequency above **49.5 Hz**?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 48.8, ymax: 50.1, grid: false, height: 280, padL: 54, axes: { xlabel: 'seconds after the loss', ylabel: 'Hz', xticks: 5, yticks: 0.2, xAt: 0, yAt: 48.8, yfmt: (v) => v.toFixed(1) },
                params: {
                  H: { min: 2, max: 8, step: 1, value: 6, label: 'inertia H', color: 'blue', format: (v) => `${v} s` },
                  T: { min: 0.5, max: 10, step: 0.5, value: 6, label: 'response time', color: 'coral', format: (v) => `${fix(v, 1)} s` },
                },
                curves: [{ f: () => 49.5, color: 'coral', dash: true }],
                extra: ({ plot, p, s }) => [s('path', { d: freqRun(p.H, p.T).map(([t, f], i) => `${i ? 'L' : 'M'}${plot.X(t).toFixed(1)} ${plot.Y(Math.max(48.8, f)).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 })],
                readout: (p) => { const n = nadir(p.H, p.T); return `Lowest frequency: **${n.toFixed(2)} Hz** ${n >= 49.5 ? '✓ above the limit' : '✗ below the limit'}`; },
                goal: (p) => p.H <= 3 && nadir(p.H, p.T) >= 49.5,
                hint: 'Set the inertia to 3 s or less, then shorten the response time.',
                solution: { H: 3, T: 2 },
              },
              explain: r`With $H = 6$ s, a 6-second response just fails; with $H = 3$ s the response must arrive within about 2.5 s. Less inertia means the frequency falls faster, so the backup must be quicker. Batteries can respond in under a second, which is why grids with lots of renewables increasingly rely on them for frequency response.`,
            },
            {
              type: 'numeric',
              title: 'How fast does it fall?',
              body: r`Right after a loss, the frequency falls at a rate $\frac{df}{dt} = -\frac{f_0\,\Delta P}{2H}$, where $f_0 = 50$ Hz, $\Delta P$ is the lost fraction of supply and $H$ is the inertia in seconds.`,
              prompt: r`With $\Delta P = 0.05$ (5% lost) and $H = 4$ s, how fast does the frequency start to fall, in Hz per second? (2 decimal places.)`,
              unit: 'Hz/s',
              answer: (50 * 0.05) / (2 * 4),
              tol: 0.006,
              wrong: [{ v: (50 * 0.05) / 4, tol: 0.006, why: 'Don’t forget the factor 2 in 2H.' }, { v: 50 * 0.05 * 2 * 4, why: 'Divide by 2H, don’t multiply.' }],
              explain: r`$\frac{50 \times 0.05}{8} \approx 0.31$ Hz per second, so without any response the frequency would hit 49.5 Hz in under 2 seconds. Grid engineers call this the **rate of change of frequency** (RoCoF), and protection systems watch it closely.`,
            },
            {
              type: 'mcq',
              title: 'Where did the inertia go?',
              prompt: 'Why do grids with lots of wind and solar power tend to have less inertia?',
              choices: [
                { t: 'Solar panels and most wind turbines connect through electronic inverters, so no heavy spinning mass is locked to the grid frequency', ok: true },
                { t: 'Renewable energy is weaker', why: 'A gigawatt is a gigawatt. The difference is how the power is connected.' },
                { t: 'Wind turbines spin backwards', why: 'They spin normally, but through inverters that decouple their rotation from the grid frequency.' },
              ],
              explain: r`Coal, gas and nuclear plants have huge turbines spinning in lockstep with the grid, which automatically resist frequency changes. Inverter-based sources don't, unless programmed to. Modern "grid-forming" inverters and batteries can provide **synthetic inertia**, mimicking a spinning machine in software, and some grids add heavy **synchronous condensers**: generators that spin just to provide inertia.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The August 2019 blackout',
              prompt: r`On 9 August 2019, a lightning strike on a power line in eastern England triggered the loss of about 1.9 GW of generation in Britain. The frequency fell to 48.8 Hz and about a million customers were automatically disconnected for up to an hour. Why disconnect customers on purpose?`,
              choices: [
                { t: 'Cutting some demand quickly lets supply catch up, preventing a collapse that would black out the whole country', ok: true },
                { t: 'To protect those customers’ appliances from low frequency', why: 'The disconnection was to save the grid as a whole, by rebalancing supply and demand.' },
                { t: 'It was a mistake by the operators', why: 'It was the automatic safety system working as designed, at the 48.8 Hz trigger.' },
              ],
              explain: r`If the frequency keeps falling, more generators trip to protect themselves, which makes it fall faster still: a cascade into total blackout. Automatic **load shedding** at 48.8 Hz cut about 5% of demand within seconds, stopping the fall. The event led to new rules on how generators ride through disturbances and on fast frequency response.`,
            },
          ],
          recap: [
            'After a loss of supply, frequency falls at a rate set by the grid’s inertia.',
            'Fast frequency response (generators, batteries) stops the fall; the lowest point is the nadir.',
            'Low-inertia grids need faster response; load shedding is the last line of defence.',
          ],
        },
        {
          id: 'ev-charging',
          title: 'Charging Electric Cars',
          summary: 'Power, energy and time',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Filling up with electrons',
              body: r`An electric car’s battery is rated in **kilowatt-hours** (energy), and chargers in **kilowatts** (power). Charging time is roughly energy divided by power:
$$t \approx \frac{\text{energy needed (kWh)}}{\text{charger power (kW)}}.$$
A typical home charger delivers 7 kW; motorway rapid chargers deliver 50–350 kW. (Real charging slows down as the battery fills up, which is why quoted times are often for 10–80%.)`,
            },
            {
              type: 'numeric',
              title: 'Overnight',
              prompt: r`How many hours does a 7 kW home charger take to put 60 kWh into a car? (1 decimal place.)`,
              unit: 'h',
              answer: 60 / 7,
              tol: 0.06,
              explain: r`$\frac{60}{7} \approx 8.6$ hours: comfortably overnight. A standard 2.3 kW socket would need about 26 hours.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A coffee-break charge',
              prompt: r`A driver wants to add 70% of a 60 kWh battery (42 kWh) during a **30-minute** stop. Find the charger power needed.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 360, ymin: 0, ymax: 4, grid: false, height: 260, axes: { xlabel: 'charger power (kW)', ylabel: 'hours to add 42 kWh', xticks: 50, yticks: 0.5 },
                params: { P: { min: 7, max: 350, step: 1, value: 50, label: 'charger power', color: 'teal', format: (v) => `${v} kW` } },
                curves: [{ f: (x) => 42 / x, color: 'violet', width: 3, from: 10 }, { f: () => 0.5, color: 'coral', dash: true }],
                points: [{ x: (p) => p.P, y: (p) => Math.min(4, 42 / p.P), color: 'teal' }],
                readout: (p) => `${p.P} kW adds 42 kWh in **${((42 / p.P) * 60).toFixed(0)} minutes** · current at 400 V: ${((p.P * 1000) / 400).toFixed(0)} A`,
                goal: (p) => p.P === 84,
                hint: '42 kWh ÷ 0.5 h.',
                solution: { P: 84 },
              },
              explain: r`$\frac{42}{0.5} = 84$ kW. At 400 V that is 210 A, far more than any household wiring can carry, which is why rapid chargers need their own heavy grid connections and thick, often liquid-cooled cables.`,
            },
            {
              type: 'mcq',
              title: 'Everyone at six o’clock',
              prompt: r`If a million drivers all plug into 7 kW chargers when they get home at 6 pm, how much extra demand hits the grid at once?`,
              choices: [
                { t: '7 GW, more than several large power stations', ok: true },
                { t: '7 MW', why: '10⁶ × 7 kW = 7 × 10⁶ kW = 7 GW.' },
                { t: 'Nothing much: cars charge slowly', why: 'Each car draws 7 kW. A million together is 7 GW.' },
              ],
              explain: r`$10^6 \times 7$ kW $= 7$ GW, right at the evening peak. "Smart charging" spreads the load through the night, when demand (and electricity prices) are low, and cars parked most of the day could even feed power back to the grid at peak times.`,
            },
            {
              type: 'numeric',
              title: 'Cost of a full charge',
              prompt: r`At 25 pence per kWh, how much does it cost (in pounds) to put 60 kWh into a car?`,
              unit: '£',
              answer: 15,
              tol: 0.01,
              explain: r`$60 \times 0.25 = £15$. If that gives about 240 miles (4 miles per kWh), it is about 6p per mile. Rapid chargers usually charge two or three times as much per kWh.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Losses in the cable',
              prompt: r`Charging power is lost as heat in the cable: $P_{\text{loss}} = I^2R$. At 7 kW and 230 V the current is about 30 A. If the same 7 kW were delivered at 400 V instead, by what factor would the cable losses fall? (2 decimal places.)`,
              answer: (230 / 400) ** 2,
              tol: 0.01,
              explain: r`Current scales as $\frac1V$, so losses scale as $\frac{1}{V^2}$: $\left(\frac{230}{400}\right)^2 \approx 0.33$. Roughly a third of the losses. The same reasoning is why the grid transmits power at hundreds of thousands of volts.`,
            },
          ],
          recap: [
            'Charging time ≈ energy (kWh) ÷ power (kW).',
            'Rapid charging needs high power, hence high currents and heavy connections.',
            'Many cars charging at once matter for the grid: smart charging spreads the load.',
          ],
        },
      ],
    },
  ],
};
