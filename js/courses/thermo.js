import { fix } from '../lib/svg.js';

const r = String.raw;
const f2 = (v) => (Math.round(v * 100) / 100).toString();

// heat pump delivering 35 °C water, achieving 50% of the Carnot COP
const realCOP = (tc) => (0.5 * 308.15) / (308.15 - (tc + 273.15));
// adiabatic compression of air (γ = 1.4) from 300 K by volume ratio r
const adiabaticT = (rr) => 300 * rr ** 0.4;

export default {
  id: 'thermo',
  subject: 'physics',
  title: 'Heat & Thermodynamics',
  level: 'Intermediate',
  cover: 'energy',
  tagline: 'Temperature, gases, engines, entropy, heat pumps and compression: the physics of heat.',
  description: r`What is temperature, really? Watch jiggling molecules explain the gas laws, calculate how much energy it takes to boil water, and discover why heat flows only one way, why no engine can ever be perfect, how heat pumps move heat uphill, and how diesel engines ignite fuel by squeezing air.`,
  prereq: 'Energy',
  chapters: [
    {
      title: 'Heat and Temperature',
      summary: 'Jiggling molecules and the energy they carry.',
      lessons: [
        {
          id: 'temperature',
          title: 'What Is Temperature?',
          summary: 'Molecules in motion',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Cold metal',
              prompt: 'On a cold morning, a metal bench feels colder than a wooden one beside it. Which is actually colder?',
              choices: [
                { t: 'Neither: they are the same temperature', ok: true },
                { t: 'The metal bench', why: 'They’ve both been sitting in the same air all night, so they’ve reached the same temperature.' },
                { t: 'The wooden bench', why: 'They’re at the same temperature. The difference is how fast each one pulls heat from your hand.' },
              ],
              explain: r`Both are at the air temperature. Metal **conducts** heat much faster than wood, so it drains heat from your hand quickly, and that feels cold. Your skin senses heat flow, not temperature.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Molecules in motion',
              body: r`A gas is made of molecules flying around and bouncing off each other and the walls. Turn up the temperature.`,
              widget: { kind: 'gas', N: 60, params: { T: { min: 50, max: 900, step: 10, value: 300, label: '$T$' } }, readout: (p) => r`Molecules move faster at higher temperature: average speed $\propto \sqrt{T}$` },
              after: r`**Temperature** measures the average kinetic energy of the molecules' random motion. Hotter means faster jiggling. The colours show speed: {blue:slow}, {amber:medium}, {coral:fast}. Even at one temperature, speeds vary a lot.`,
            },
            {
              type: 'explain',
              title: 'The Kelvin scale',
              body: r`Cool something down and its molecules slow down. At **absolute zero** the random motion is as small as it can possibly be. Nothing can get colder.

The **Kelvin** scale starts there:
$$T_\text{K} = T_\text{°C} + 273.15$$
Absolute zero is 0 K $= -273.15$ °C. Water freezes at 273.15 K and boils at 373.15 K. A kelvin is the same size as a Celsius degree; only the starting point differs.`,
            },
            {
              type: 'numeric',
              title: 'Convert',
              prompt: 'Room temperature is about 20 °C. What is that in kelvin? (Use 273.)',
              unit: 'K',
              answer: 293,
              wrong: [{ v: 253, why: r`Add 273, don't subtract: $20 + 273$.` }],
              explain: r`$20 + 273 = 293$ K.`,
            },
            {
              type: 'numeric',
              title: 'Energy of a molecule',
              prompt: r`A gas molecule’s average kinetic energy is $\frac32 k_BT$. What is it at room temperature (300 K), in units of $10^{-21}$ J? (2 decimal places; $k_B = 1.38 \times 10^{-23}$ J/K.)`,
              unit: '$\\times 10^{-21}$ J',
              answer: 1.5 * 1.380649e-23 * 300 / 1e-21,
              tol: 0.01,
              explain: r`$\frac32 \times 1.38 \times 10^{-23} \times 300 \approx 6.21 \times 10^{-21}$ J. Temperature is just a measure of this average jiggling energy, which is why absolute temperature (kelvin) is the natural scale.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Twice as hot?',
              prompt: 'Is 40 °C “twice as hot” as 20 °C, in terms of molecular kinetic energy?',
              choices: [
                { t: 'No: only about 7% more, because 313 K vs 293 K', ok: true },
                { t: 'Yes', why: r`Celsius has an arbitrary zero. Kinetic energy is proportional to the **absolute** temperature: $313/293 \approx 1.07$.` },
              ],
              explain: r`The average kinetic energy is proportional to the temperature in **kelvin**: $\frac{313}{293} \approx 1.07$. To double it, you'd need $586$ K $\approx 313$ °C.`,
            },
          ],
          recap: [
            'Temperature measures the average kinetic energy of molecular motion.',
            r`Kelvin: $T_\text{K} = T_\text{°C} + 273.15$. Absolute zero is 0 K.`,
            'Ratios of temperatures only make sense in kelvin.',
          ],
        },
        {
          id: 'heat',
          title: 'Heat & Specific Heat',
          summary: 'Q = mcΔT',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Beach day',
              prompt: 'On a sunny day, the sand gets scorching hot while the sea stays cool. Why?',
              choices: [
                { t: 'Water needs much more energy to warm up by each degree', ok: true },
                { t: 'The sun shines less on water', why: 'Both get about the same sunlight. Water just resists temperature change.' },
                { t: 'Water reflects all the sunlight', why: 'Water absorbs most of the sunlight that hits it. It just takes a lot of energy to warm.' },
              ],
              explain: r`Water has an unusually high **specific heat capacity**: it takes a lot of energy to raise its temperature. The same sunlight warms dry sand several times more.`,
            },
            {
              type: 'explain',
              title: 'Specific heat',
              body: r`**Heat** is energy flowing because of a temperature difference. It always flows from hot to cold, until the two reach the same temperature (**thermal equilibrium**).

The heat $Q$ needed to warm a mass $m$ by $\Delta T$ is
$$Q = m\,c\,\Delta T$$
where $c$ is the material's **specific heat**: the energy needed for 1 kg to rise by 1 K.

| Material | $c$ (J/kg·K) |
|---|---|
| Water | 4186 |
| Aluminium | 900 |
| Sand | ~800 |
| Iron | 450 |`,
            },
            {
              type: 'numeric',
              title: 'Boil the kettle',
              prompt: 'How much energy does it take to heat 1 kg of water from 20 °C to 100 °C? Give the answer in kJ.',
              unit: 'kJ',
              answer: (4186 * 80) / 1000,
              tol: 0.5,
              wrong: [
                { v: 418.6, tol: 0.5, why: r`The temperature rises by $100 - 20 = 80$ K, not 100 K.` },
                { v: 334.88 * 1000, tol: 100, why: 'That’s in joules. Divide by 1000 for kJ.' },
              ],
              explain: r`$Q = mc\Delta T = 1 \times 4186 \times 80 \approx 334{,}900$ J $\approx 335$ kJ. A 2 kW kettle supplies that in under 3 minutes.`,
            },
            {
              type: 'numeric',
              title: 'Mixing',
              prompt: 'You mix 2 kg of water at 20 °C with 1 kg of water at 80 °C. Ignoring any heat loss, what is the final temperature?',
              unit: '°C',
              answer: 40,
              wrong: [{ v: 50, why: 'That would be the answer for equal masses. There’s twice as much cold water.' }, { v: 60, why: 'There’s more cold water than hot, so the result is closer to 20 °C.' }],
              explain: r`Heat lost by the hot water = heat gained by the cold water: $1 \cdot c \cdot (80 - T) = 2 \cdot c \cdot (T - 20)$. So $80 - T = 2T - 40$, giving $T = 40$ °C. It's a weighted average.`,
            },
            {
              type: 'interactive',
              title: 'Heating ice to steam',
              body: r`Add heat steadily to 1 kg of ice at −20 °C. While it melts or boils, the temperature stays fixed: the energy (latent heat, 334 kJ/kg for melting and 2,260 kJ/kg for boiling) goes into breaking bonds instead. Find the heat needed to **just melt all the ice**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3300, ymin: -30, ymax: 130, grid: false, height: 280, axes: { xlabel: 'heat added (kJ)', ylabel: 'temperature (°C)', xticks: 500, yticks: 20 },
                params: { Q: { min: 0, max: 3300, step: 1, value: 200, label: 'heat added', color: 'coral', format: (v) => `${v} kJ` } },
                curves: [{ f: (q) => (q < 42 ? -20 + q / 2.1 : q < 376 ? 0 : q < 794 ? (q - 376) / 4.18 : q < 3054 ? 100 : 100 + (q - 3054) / 2.0), color: 'violet', width: 3, n: 600 }],
                points: [{ x: (p) => p.Q, y: (p) => { const q = p.Q; return q < 42 ? -20 + q / 2.1 : q < 376 ? 0 : q < 794 ? (q - 376) / 4.18 : q < 3054 ? 100 : 100 + (q - 3054) / 2.0; }, color: 'coral' }],
                readout: (p) => { const q = p.Q; return q < 42 ? `ice warming: **${(-20 + q / 2.1).toFixed(1)} °C**` : q < 376 ? `melting at 0 °C: **${((100 * (q - 42)) / 334).toFixed(0)}%** melted` : q < 794 ? `water warming: **${((q - 376) / 4.18).toFixed(1)} °C**` : q < 3054 ? `boiling at 100 °C: **${((100 * (q - 794)) / 2260).toFixed(0)}%** turned to steam` : `steam: **${(100 + (q - 3054) / 2).toFixed(1)} °C**`; },
                goal: (p) => Math.abs(p.Q - 376) <= 2,
                hint: 'First warm the ice by 20 °C (2.1 kJ per kg per °C), then add the latent heat of melting.',
                solution: { Q: 376 },
              },
              explain: r`$2.1 \times 20 + 334 = 376$ kJ. The flat steps dominate: melting takes as much energy as warming the water by 80 °C, and boiling it away takes over five times as much as heating it from 0 to 100 °C. That is why sweating cools you so well.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Hot iron in water',
              prompt: 'A 0.5 kg iron block at 200 °C is dropped into 2 kg of water at 20 °C. What temperature do they settle at? (c_iron = 450, c_water = 4186 J/kg·K. Ignore heat lost to the surroundings and assume no boiling.)',
              unit: '°C',
              answer: (0.5 * 450 * 200 + 2 * 4186 * 20) / (0.5 * 450 + 2 * 4186),
              tol: 0.2,
              wrong: [{ v: 56, tol: 0.5, why: r`That's the average weighted by mass alone. Weight by $m \times c$: water's $c$ is much bigger.` }, { v: 110, why: 'Iron has a low specific heat and less mass, so the water barely warms up.' }],
              explain: r`Set heat lost = heat gained: $0.5 \cdot 450 \,(200 - T) = 2 \cdot 4186\,(T - 20)$, so $225(200 - T) = 8372(T - 20)$. Then $45{,}000 + 167{,}440 = 8597\,T$, giving $T \approx 24.7$ °C. The water barely changes, because its heat capacity is so large.`,
            },
          ],
          recap: [
            'Heat flows from hot to cold until the temperatures are equal.',
            r`$Q = mc\Delta T$. Water's high specific heat steadies climates and bodies.`,
            'In mixing problems: heat lost = heat gained.',
          ],
        },
      ],
    },
    {
      title: 'Gases and Phases',
      summary: 'The ideal gas law, melting and boiling.',
      lessons: [
        {
          id: 'gas-law',
          title: 'The Gas Laws',
          summary: 'PV = nRT',
          icon: 'layers',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Squeeze',
              prompt: 'You push in a sealed syringe, halving the volume of air inside (keeping the temperature the same). What happens to the pressure?',
              cols: 2,
              choices: [
                { t: 'It doubles', ok: true },
                { t: 'It halves', why: 'Less room means more frequent collisions with the walls, so the pressure rises.' },
                { t: 'It stays the same', why: 'You can feel it push back harder as you squeeze.' },
              ],
              explain: r`The same molecules, moving at the same speeds, now have half the space, so each wall gets hit twice as often. The pressure doubles. This is **Boyle's law**: $PV$ = constant (at constant temperature).`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Pressure from collisions',
              body: r`Pressure is the push of countless molecules bouncing off the walls. Change the volume, the temperature and the number of molecules, and compare the measured pressure with the prediction.`,
              widget: {
                kind: 'gas',
                params: {
                  V: { min: 0.3, max: 1, step: 0.05, value: 1, label: '$V$' },
                  T: { min: 100, max: 900, step: 50, value: 300, label: '$T$' },
                  N: { min: 10, max: 120, step: 10, value: 60, label: '$N$' },
                },
                ready: true,
              },
              after: r`The measured pressure (it fluctuates, because molecules hit the walls randomly) tracks the prediction: pressure goes **up** with more molecules or higher temperature, and **down** with more volume.`,
            },
            {
              type: 'explain',
              title: 'The ideal gas law',
              body: r`All these effects combine into one law:
$$PV = nRT$$
where $P$ is pressure, $V$ is volume, $n$ is the amount of gas (in moles), $R = 8.31$ J/(mol·K), and $T$ is the temperature **in kelvin**.

Special cases: at fixed $T$, $PV$ is constant (Boyle). At fixed $P$, $V \propto T$ (Charles). At fixed $V$, $P \propto T$.`,
            },
            {
              type: 'numeric',
              title: 'Balloon in the freezer',
              prompt: 'A balloon holds 3.0 L of air at 300 K. You put it in a freezer at 250 K (the pressure stays the same). What is its new volume?',
              unit: 'L',
              answer: 2.5,
              wrong: [{ v: 3.6, why: r`Colder gas shrinks: $V_2 = V_1 \times \frac{T_2}{T_1} = 3 \times \frac{250}{300}$.` }, { v: 0, why: 'It shrinks, but nowhere near zero. Use kelvin ratios.' }],
              explain: r`At constant pressure, $V \propto T$: $V_2 = 3.0 \times \frac{250}{300} = 2.5$ L.`,
            },
            {
              type: 'numeric',
              title: 'Hot tyres',
              prompt: 'A sealed, rigid container of gas is heated from 27 °C to 127 °C. By what factor does its pressure increase? (Give a decimal.)',
              answer: 400 / 300,
              tol: 0.01,
              wrong: [{ v: 127 / 27, tol: 0.05, why: r`Use kelvin! $27$ °C $= 300$ K and $127$ °C $= 400$ K.` }],
              explain: r`Convert to kelvin: 300 K → 400 K. At constant volume $P \propto T$, so the pressure rises by $\frac{400}{300} \approx 1.33$. Using Celsius would give a wildly wrong factor of 4.7.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Mountain snacks',
              prompt: 'A sealed bag of crisps, packed at sea level, puffs up on a mountain top. Why?',
              choices: [
                { t: 'The air pressure outside is lower, so the gas inside expands', ok: true },
                { t: 'It’s warmer on the mountain', why: 'Mountains are usually colder, which would make the bag shrink. The pressure drop wins.' },
                { t: 'The crisps release gas at altitude', why: 'The amount of gas inside stays the same. It just expands as the outside pressure drops.' },
              ],
              explain: r`The gas inside pushes out until it balances the outside pressure. Up high the air pressure is lower (about 70% of sea level at 3000 m), so the gas expands until its pressure matches.`,
            },
          ],
          recap: [
            'Gas pressure comes from molecules colliding with the walls.',
            r`$PV = nRT$, with $T$ in kelvin.`,
            r`Boyle: $PV$ constant. Charles: $V \propto T$. At constant volume: $P \propto T$.`,
          ],
        },
        {
          id: 'phases',
          title: 'Melting & Boiling',
          summary: 'Latent heat',
          icon: 'reset',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Stuck at zero',
              body: r`You heat a pan of ice cubes from −10 °C at a steady rate and record the temperature.`,
              prompt: 'What happens to the temperature while the ice is melting?',
              choices: [
                { t: 'It stays at 0 °C until all the ice has melted', ok: true },
                { t: 'It keeps rising steadily', why: 'While melting, the energy goes into breaking the ice’s crystal structure, not into raising the temperature.' },
                { t: 'It drops below 0 °C', why: 'It doesn’t cool down. It just stops rising for a while.' },
              ],
              explain: r`During melting, the heat breaks the bonds holding the ice crystal together, rather than speeding molecules up. The temperature holds steady at 0 °C until all the ice is gone.`,
            },
            {
              type: 'explain',
              title: 'Heating curve',
              body: r`Heating 1 kg of ice from −20 °C to steam at 120 °C at a steady rate gives a graph with two long **flat** sections: melting at 0 °C and boiling at 100 °C.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3200, ymin: -30, ymax: 130, grid: 400, gridY: 20, height: 300, axes: { xlabel: 'heat added (kJ)', ylabel: 'T (°C)' },
                curves: [{
                  f: (q) => {
                    // ice −20→0: 42 kJ; melt 334; water 0→100: 419; boil 2260; steam 100→120: 40
                    if (q < 42) return -20 + q / 2.1;
                    if (q < 376) return 0;
                    if (q < 795) return ((q - 376) / 419) * 100;
                    if (q < 3055) return 100;
                    return 100 + (q - 3055) / 2.0;
                  },
                  color: 'coral', from: () => 0, to: () => 3095,
                }],
                extra: ({ plot, s }) => [
                  s('text', { x: plot.X(200), y: plot.Y(8), class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'melting' }),
                  s('text', { x: plot.X(1700), y: plot.Y(108), class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'boiling (the longest step!)' }),
                ],
              },
              after: r`The energy absorbed during a phase change is the **latent heat**: $Q = mL$. For water, $L_\text{melt} = 334$ kJ/kg and $L_\text{boil} = 2260$ kJ/kg. Boiling a kilogram of water away takes over 5 times more energy than heating it from 0 °C to 100 °C!`,
            },
            {
              type: 'numeric',
              title: 'Melt the ice',
              prompt: 'How much energy does it take to melt 0.5 kg of ice that is already at 0 °C? (L_melt = 334 kJ/kg)',
              unit: 'kJ',
              answer: 167,
              wrong: [{ v: 668, why: r`Multiply: $Q = mL = 0.5 \times 334$.` }, { v: 0, why: 'Even though the temperature doesn’t change, melting takes energy.' }],
              explain: r`$Q = mL = 0.5 \times 334 = 167$ kJ, all without any change in temperature.`,
            },
            {
              type: 'mcq',
              title: 'Sweat',
              prompt: 'Why does sweating cool you down?',
              choices: [
                { t: 'Evaporating sweat absorbs latent heat from your skin', ok: true },
                { t: 'Sweat is cold when it comes out', why: 'Sweat leaves your body at body temperature. The cooling comes from evaporation.' },
                { t: 'Wet skin reflects sunlight', why: 'The main effect is evaporation, which takes heat away.' },
              ],
              explain: r`Turning liquid into vapour takes a lot of energy (2260 kJ per kg of water, a bit more at skin temperature). That energy comes from your skin, so it cools down. It's also why a breeze feels cooler when you're wet: it speeds up evaporation.`,
            },
            {
              type: 'numeric',
              title: 'Boiling it away',
              prompt: r`Turning water at 100 °C into steam takes 2,260 kJ per kg. How much energy does it take to boil away half a kilogram, in kJ?`,
              unit: 'kJ',
              answer: 1130,
              explain: r`$0.5 \times 2260 = 1{,}130$ kJ, over five times the 210 kJ needed to heat that water from 0 to 100 °C. That’s why a pan takes so long to boil dry.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ice in a drink',
              prompt: 'How many kilograms of ice at 0 °C are needed to cool 1 kg of water from 30 °C down to 0 °C? (The ice melts and ends at 0 °C. c_water = 4186 J/kg·K, L = 334,000 J/kg.)',
              unit: 'kg',
              answer: (4186 * 30) / 334000,
              tol: 0.005,
              wrong: [{ v: 0.09, tol: 0.004, why: r`Check your units: $4186 \times 30 = 125{,}580$ J, then divide by $334{,}000$ J/kg.` }, { v: 1, why: 'Melting ice absorbs a lot of energy, so you need much less than 1 kg.' }],
              explain: r`Heat released by the water cooling to 0 °C: $1 \times 4186 \times 30 = 125{,}580$ J. Mass of ice that much heat can melt: $\frac{125{,}580}{334{,}000} \approx 0.38$ kg. Melting is a powerful way to cool a drink, which is why ice works so much better than ice-cold water.`,
            },
          ],
          recap: [
            'During melting and boiling, the temperature stays constant while heat is absorbed.',
            r`Latent heat: $Q = mL$. Water: 334 kJ/kg to melt, 2260 kJ/kg to boil.`,
            'Evaporation cools: that’s how sweating works.',
          ],
        },
      ],
    },
    {
      title: 'The Laws of Thermodynamics',
      summary: 'Engines, efficiency and entropy.',
      lessons: [
        {
          id: 'engines',
          title: 'Heat Engines',
          summary: 'The first law and the Carnot limit',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'The first law',
              body: r`Energy is conserved, heat included. For a gas:
$$\Delta U = Q - W$$
The change in internal energy equals the heat added minus the work the gas does on its surroundings.

A **heat engine** (a car engine, or a power station's steam turbine) takes heat $Q_h$ from a hot source, turns part of it into work $W$, and dumps the rest, $Q_c$, into a cold sink:
$$W = Q_h - Q_c, \qquad \text{efficiency} = \frac{W}{Q_h}$$`,
            },
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Engine efficiency',
              prompt: 'An engine takes in 1000 J of heat and does 250 J of work each cycle. What is its efficiency, in percent?',
              unit: '%',
              answer: 25,
              wrong: [{ v: 75, why: 'That’s the fraction wasted as heat. Efficiency is useful work ÷ heat in.' }],
              explain: r`$\frac{250}{1000} = 25\%$. The other 750 J goes into the cold surroundings as waste heat. That's typical of a petrol car engine.`,
            },
            {
              type: 'mcq',
              title: 'Can it be perfect?',
              prompt: 'Could a clever engineer build a heat engine that turns 100% of its heat into work?',
              choices: [
                { t: 'No: some heat must always be dumped to a colder place', ok: true },
                { t: 'Yes, with perfect parts and no friction', why: 'Even a perfect, frictionless engine must reject some heat. It’s a law of nature, not an engineering problem.' },
              ],
              explain: r`The **second law of thermodynamics** forbids it. An engine needs heat to flow from hot to cold through it, and some of that heat must end up in the cold sink. The best possible efficiency depends only on the two temperatures.`,
            },
            {
              type: 'explain',
              title: 'The Carnot limit',
              body: r`In 1824, Sadi Carnot showed that no engine working between a hot temperature $T_h$ and a cold temperature $T_c$ (in kelvin) can beat
$$\eta_\text{max} = 1 - \frac{T_c}{T_h}$$
To make engines more efficient, run them hotter, or dump the heat somewhere colder.`,
            },
            {
              type: 'numeric',
              title: 'Power station',
              prompt: 'A steam turbine runs between 600 K and 300 K. What is its maximum possible efficiency, in percent?',
              unit: '%',
              answer: 50,
              wrong: [{ v: 200, why: r`$1 - \frac{T_c}{T_h} = 1 - \frac{300}{600}$, which is less than 100%.` }],
              explain: r`$1 - \frac{300}{600} = 0.5 = 50\%$. Real power stations reach about 35–45%, below the Carnot limit because of friction and other losses.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Where the heat goes',
              body: r`A perfect (Carnot) engine takes in 100 J of heat from a hot source and dumps waste heat into surroundings at 300 K. Raise the source temperature and watch how the 100 J divides between useful work and waste.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 110, grid: false, axes: false, maxWidth: 420, height: 280,
                params: { Th: { min: 320, max: 1500, step: 10, value: 600, label: 'hot source', color: 'coral', format: (v) => `${v} K` } },
                extra: ({ plot, p, s }) => { const w = 100 * (1 - 300 / p.Th), bar = (x, y0, y1, cls, t) => [s('rect', { x: plot.X(x), y: plot.Y(y1), width: plot.X(2.4) - plot.X(0), height: plot.Y(y0) - plot.Y(y1), class: cls }), s('text', { x: plot.X(x + 1.2), y: plot.Y((y0 + y1) / 2) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--card)', text: y1 - y0 > 7 ? t : '' })]; return [...bar(1.5, 0, 100, 'fl-coral', 'heat in 100 J'), ...bar(6, 0, 100 - w, 'fl-blue', `waste ${(100 - w).toFixed(0)} J`), ...bar(6, 100 - w, 100, 'fl-teal', `work ${w.toFixed(0)} J`)]; },
                readout: (p) => `maximum efficiency 1 − 300/${p.Th} = **${(100 * (1 - 300 / p.Th)).toFixed(1)}%**`,
              },
              after: r`Even a perfect engine must throw heat away; only the fraction $1 - T_c/T_h$ can become work. Doubling the source temperature from 600 K to 1,200 K raises the limit from 50% to 75%. Real engines reach perhaps two-thirds of the Carnot limit, which is why power stations run as hot as their materials allow.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Hotter is better',
              prompt: 'To reach a maximum efficiency of 60% while rejecting heat at 300 K, how hot must the source be?',
              unit: 'K',
              answer: 750,
              wrong: [{ v: 500, why: r`$1 - \frac{300}{T_h} = 0.6$, so $\frac{300}{T_h} = 0.4$.` }, { v: 480, why: r`Solve $T_h = \frac{300}{0.4}$.` }],
              explain: r`$\frac{T_c}{T_h} = 0.4$, so $T_h = \frac{300}{0.4} = 750$ K (about 477 °C). That's why modern turbines run as hot as their materials can stand.`,
            },
          ],
          recap: [
            r`First law: $\Delta U = Q - W$. Energy is conserved, including heat.`,
            r`Engine efficiency = $W/Q_h$. It can never reach 100%.`,
            r`Carnot limit: $\eta_\text{max} = 1 - T_c/T_h$, with temperatures in kelvin.`,
          ],
        },
        {
          id: 'entropy',
          title: 'Entropy',
          summary: 'Why time has a direction',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Backwards video',
              prompt: 'You watch a video of a drop of ink spreading through water, played in reverse. How can you tell it’s reversed?',
              choices: [
                { t: 'The spread-out ink gathers back into a drop, which never happens on its own', ok: true },
                { t: 'You can’t tell', why: 'You can! Spontaneous un-mixing never happens in nature.' },
                { t: 'The ink changes colour', why: 'The colour stays the same. What gives it away is the ink gathering itself back up.' },
              ],
              explain: r`Mixing happens on its own, but un-mixing never does. The laws of motion for individual molecules work equally well backwards in time, so why does mixing have a direction? The answer is **entropy**, which is really about counting.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Count the arrangements',
              body: r`Flip 10 coins. Some outcomes ("how many heads") can happen in far more ways than others. Run it many times.`,
              widget: {
                kind: 'sampler', outcomes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
                probs: [1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1].map((k) => k / 1024),
                trial: () => { let h = 0; for (let i = 0; i < 10; i++) if (Math.random() < 0.5) h++; return h; },
                batches: [1, 10, 100, 1000], oneLabel: 'Flip 10', color: 'violet', ymax: 0.3,
              },
              after: r`"5 heads" can happen in 252 ways. "All heads" in just 1. With $10^{23}$ molecules instead of 10 coins, the evenly mixed states outnumber the special, ordered ones by an unimaginable margin.`,
            },
            {
              type: 'explain',
              title: 'The second law',
              body: r`**Entropy** measures how many microscopic arrangements match what we see (it's roughly the logarithm of that number).

::: key
**Second law of thermodynamics:** the total entropy of an isolated system never decreases.
:::

Things don't move toward high entropy because of a mysterious force. High-entropy states are simply overwhelmingly more numerous, so random jiggling almost certainly leads there. Ink spreads, heat flows from hot to cold, and eggs break but don't un-break.`,
            },
            {
              type: 'mcq',
              title: 'Heat flow',
              prompt: 'Why does heat flow from a hot object to a cold one, and never the other way on its own?',
              choices: [
                { t: 'Sharing energy more evenly creates vastly more possible arrangements: the total entropy rises', ok: true },
                { t: 'Hot objects have more heat to give', why: 'A big lukewarm bath can hold more thermal energy than a small, very hot coal, yet heat still flows from the coal to the bath.' },
                { t: 'It’s just a convention', why: 'It’s a real physical law, the second law of thermodynamics.' },
              ],
              explain: r`Moving energy from hot to cold increases the cold object's entropy more than it decreases the hot one's, so the total goes up. The reverse would lower the total entropy, which is so improbable that it never happens.`,
            },
            {
              type: 'numeric',
              title: 'Counting arrangements',
              prompt: r`Four coins are tossed. In how many different ways can exactly two of them land heads?`,
              answer: 6,
              explain: r`$\binom42 = 6$: HHTT, HTHT, HTTH, THHT, THTH, TTHH. The "half heads" outcome has the most arrangements, which is why it’s most likely. With 100 coins, outcomes near 50 heads vastly outnumber the rest: that’s entropy at work.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Refrigerators',
              prompt: 'A fridge moves heat from its cold inside to the warmer kitchen. Doesn’t that break the second law?',
              choices: [
                { t: 'No: it uses work (electricity), and the heat dumped into the kitchen raises entropy more than the inside loses', ok: true },
                { t: 'Yes: fridges are a rare exception', why: 'There are no exceptions. The second law applies to the whole system: fridge, kitchen and power station.' },
                { t: 'No, because fridges don’t really move heat', why: 'They really do pump heat out of the inside. That’s why the back of a fridge is warm.' },
              ],
              explain: r`Entropy can decrease locally (inside the fridge) if it increases more somewhere else. The fridge's motor does work and dumps even more heat out the back, so total entropy still rises. Living things do the same: they build order inside themselves by increasing entropy around them.`,
            },
          ],
          recap: [
            'Entropy counts the number of microscopic arrangements behind a large-scale state.',
            'Second law: the total entropy of an isolated system never decreases.',
            'It explains mixing, the direction of heat flow, and the arrow of time.',
          ],
        },
      ],
    },
    {
      title: 'Thermodynamics at Work',
      summary: 'Heat pumps and compression.',
      lessons: [
        {
          id: 'heatpumps',
          title: 'Heat Pumps & Fridges',
          summary: 'Moving heat uphill',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Engines in reverse',
              body: r`Heat flows naturally from hot to cold. A **refrigerator** or **heat pump** uses work $W$ to move heat the other way: from a cold place (inside the fridge, or outdoor air) to a warm one (your kitchen, or your home's radiators).

A heat pump's performance is its **coefficient of performance**: heat delivered per unit of work, $\text{COP} = \frac{Q_h}{W}$. The best possible (Carnot) value, with temperatures in kelvin, is
$$\text{COP}_{\max} = \frac{T_h}{T_h - T_c}$$`,
            },
            {
              type: 'numeric',
              title: 'More heat than electricity',
              prompt: r`A heat pump with a COP of 3 uses 2 kW of electricity. How much heat does it deliver to the house?`,
              unit: 'kW',
              answer: 6,
              wrong: [{ v: 0.67, tol: 0.01, why: 'COP = heat ÷ work, so heat = COP × work.' }, { v: 2, why: 'A heat pump delivers more heat than the electricity it uses.' }],
              explain: r`$3 \times 2 = 6$ kW. The extra 4 kW isn't free energy: it's heat drawn from the outdoor air, even on a cold day. An electric heater, by contrast, turns 2 kW of electricity into just 2 kW of heat.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'How cold can it get?',
              prompt: r`A heat pump heats water to 35 °C for underfloor heating and reaches half the Carnot COP. Find the **lowest** outdoor temperature (to 0.5 °C) at which its COP is still at least 3.`,
              widget: {
                kind: 'graph', xmin: -25, xmax: 15, ymin: 0, ymax: 10, grid: 5, gridY: 1, height: 260, axes: { xlabel: 'outdoor temperature (°C)', ylabel: 'COP', xAt: -25 },
                params: { tc: { min: -25, max: 15, step: 0.5, value: 5, slider: false } },
                curves: [{ f: (x) => realCOP(x), color: 'violet', width: 3 }, { f: () => 3, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.tc, y: (p) => realCOP(p.tc), drag: { x: 'tc' }, color: 'teal' }],
                readout: (p) => r`outdoors ${fix(p.tc, 1)} °C: COP $= 0.5 \times \frac{308}{${(35 - p.tc).toFixed(1)}} = ${realCOP(p.tc).toFixed(2)}$`,
                goal: (p) => realCOP(p.tc) >= 3 && realCOP(p.tc - 0.5) < 3,
                hint: r`You need $T_h - T_c = \frac{0.5 \times 308}{3} \approx 51$ degrees.`,
                solution: { tc: -16 },
              },
              explain: r`Down to about $-16$ °C the COP stays at 3 or more. Heat pumps work best with a small temperature lift, which is why they pair well with large, warm-rather-than-hot radiators or underfloor heating, and why ground-source pumps (drawing on soil at a steady 10 °C) beat air-source ones in deep winter.`,
            },
            {
              type: 'mcq',
              title: 'Opening the fridge',
              prompt: r`On a hot day, could you cool your kitchen by leaving the fridge door open?`,
              choices: [
                { t: 'No: the fridge dumps the heat it removes, plus its motor’s work, back into the kitchen, so the room warms up', ok: true },
                { t: 'Yes: cold air flows out', why: 'Cold air flows out, but the coils at the back release even more heat into the same room.' },
                { t: 'Only if it’s a large fridge', why: 'Size doesn’t matter: all the extracted heat plus the work ends up in the room.' },
              ],
              explain: r`A fridge is a heat pump with both sides in your kitchen. It releases $Q_h = Q_c + W$ at the back, more than it absorbs inside. An air conditioner works only because its hot side is outdoors.`,
            },
            {
              type: 'numeric',
              title: 'A year of heating',
              prompt: r`A house needs 10,000 kWh of heat per year. A heat pump delivers 3 kWh of heat for every 1 kWh of electricity (a COP of 3). How much electricity does it use per year, in kWh? (Nearest whole number.)`,
              unit: 'kWh',
              answer: 10000 / 3,
              tol: 1,
              explain: r`$\frac{10{,}000}{3} \approx 3{,}333$ kWh. A resistive heater would use the full 10,000 kWh. The heat pump doesn’t create energy; it moves heat in from the cold outside air.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Carnot’s fridge',
              prompt: r`A freezer keeps its inside at −18 °C in a kitchen at 22 °C. For a refrigerator, the useful quantity is heat removed per work, with the Carnot limit $\frac{T_c}{T_h - T_c}$. What is that limit? (1 decimal place.)`,
              answer: 255.15 / 40,
              tol: 0.06,
              wrong: [{ v: 295.15 / 40, tol: 0.06, why: 'For a fridge, use the cold temperature on top: Tc/(Th − Tc).' }, { v: 18 / 40, tol: 0.05, why: 'Use kelvin: −18 °C = 255.15 K.' }],
              explain: r`$\frac{255.15}{295.15 - 255.15} = \frac{255.15}{40} \approx 6.4$: ideally, each joule of electricity could remove 6.4 J of heat. Real freezers manage about half of this.`,
            },
          ],
          recap: [
            r`Heat pumps use work to move heat from cold to hot; COP $= Q_h/W$.`,
            r`Carnot limits: heating $\frac{T_h}{T_h - T_c}$, cooling $\frac{T_c}{T_h - T_c}$.`,
            'Small temperature lifts give high COPs.',
          ],
        },
        {
          id: 'adiabatic',
          title: 'Squeezing Gases',
          summary: 'Adiabatic heating and cooling',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'No time for heat to escape',
              body: r`Squeeze a gas quickly and the work you do goes into its molecules, raising its temperature before heat can leak away. Such a process is **adiabatic**. For air ($\gamma = 1.4$), squeezing to a fraction $\frac1r$ of the volume raises the temperature by a factor
$$\frac{T_2}{T_1} = r^{\gamma - 1} = r^{0.4}$$
Let the gas expand quickly, and it cools in the same way.`,
            },
            {
              type: 'mcq',
              title: 'A warm bike pump',
              prompt: r`Why does a bicycle pump get warm near its nozzle when you pump hard?`,
              choices: [
                { t: 'Compressing the air quickly heats it, and the hot air warms the pump', ok: true },
                { t: 'Friction of the piston only', why: 'Friction adds a little, but the main effect is compressing the air.' },
                { t: 'The tyre is warm', why: 'The heating happens in the pump as you compress the air.' },
              ],
              explain: r`The end of the pump, where the air is most compressed, gets warmest. It's the same physics that makes air descending a mountain warm up and rising air cool down, forming clouds.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Diesel ignition',
              prompt: r`A diesel engine has no spark plug: it compresses air until it's hot enough to ignite the fuel sprayed in. Starting at 300 K, find the compression ratio that heats the air to **800 K**.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 25, ymin: 250, ymax: 1200, grid: 2, gridY: 100, height: 260, padL: 52, axes: { xlabel: 'compression ratio', ylabel: 'air temperature (K)', xAt: 1, yAt: 250 },
                params: { r: { min: 1, max: 25, step: 0.1, value: 5, slider: false } },
                curves: [{ f: (x) => adiabaticT(x), color: 'coral', width: 3 }, { f: () => 800, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.r, y: (p) => adiabaticT(p.r), drag: { x: 'r' }, color: 'violet' }],
                readout: (p) => r`ratio ${p.r.toFixed(1)} : 1: $T = 300 \times ${p.r.toFixed(1)}^{0.4} = ${adiabaticT(p.r).toFixed(0)}$ K ($${(adiabaticT(p.r) - 273).toFixed(0)}$ °C)`,
                goal: (p) => Math.abs(adiabaticT(p.r) - 800) < 3,
                hint: r`Solve $r^{0.4} = \frac{800}{300}$: $r = \left(\frac83\right)^{2.5}$.`,
                solution: { r: 11.6 },
              },
              explain: r`$r = \left(\frac{8}{3}\right)^{2.5} \approx 11.6$. Real diesels use ratios of 15–20, reaching 900–1,000 K to ignite reliably even in cold weather. Petrol engines use lower ratios (around 10) precisely to avoid igniting too early ("knocking").`,
            },
            {
              type: 'numeric',
              title: 'A fire piston',
              prompt: r`A fire piston (an ancient fire-starting tool from Southeast Asia) compresses air by a ratio of about 25 in a fraction of a second. Starting at 300 K, what temperature does the air reach? (Nearest 10 K.)`,
              unit: 'K',
              answer: Math.round(adiabaticT(25) / 10) * 10,
              tol: 10,
              wrong: [{ v: 7500, why: r`Raise the ratio to the power 0.4, not 1: $25^{0.4}$.` }],
              explain: r`$300 \times 25^{0.4} \approx 1090$ K, over 800 °C: enough to ignite a scrap of tinder in the piston. Rudolf Diesel was reportedly inspired by such devices.`,
            },
            {
              type: 'numeric',
              title: 'Half the volume',
              prompt: r`Air ($\gamma = 1.4$) is squeezed quickly (adiabatically) to half its volume, so $PV^\gamma$ stays constant. By what factor does its pressure rise? (2 decimal places.)`,
              answer: Math.pow(2, 1.4),
              tol: 0.01,
              explain: r`$2^{1.4} \approx 2.64$, more than the factor 2 for slow (isothermal) squeezing, because the gas also heats up. Diesel engines compress air about 20-fold, heating it above 500 °C.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Cloud in a bottle',
              prompt: r`Pump air into a bottle with a little water inside, then pop the cork. A cloud instantly forms inside. Why?`,
              choices: [
                { t: 'The air expands suddenly and cools adiabatically, below its dew point, so water vapour condenses into droplets', ok: true },
                { t: 'The cork adds dust', why: 'Dust helps droplets form, but the key is the sudden cooling.' },
                { t: 'The air gets hotter and steamy', why: 'Expanding air cools, it doesn’t heat.' },
              ],
              explain: r`Sudden expansion does work on the surroundings, draining energy from the air, which cools by many degrees in an instant. Rising air in the atmosphere cools the same way, which is how most clouds form.`,
            },
          ],
          recap: [
            r`Rapid (adiabatic) compression heats a gas: $T_2/T_1 = r^{\gamma - 1}$.`,
            'Diesel engines and fire pistons ignite fuel by compression alone.',
            'Rapid expansion cools gases, forming clouds.',
          ],
        },
      ],
    },
  ],
};
