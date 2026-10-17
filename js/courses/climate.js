import { fix } from '../lib/svg.js';

const r = String.raw;
const SIGMA = 5.67e-8;
const f0 = (v) => Math.round(v).toLocaleString('en-US').replace(/,/g, '{,}');
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

const forcing = (c) => 5.35 * Math.log(c / 280); // W/m², CO₂ in ppm
const warming = (c) => 0.8 * forcing(c); // equilibrium, sensitivity 0.8 K per W/m²

export default {
  id: 'climate',
  subject: 'physics',
  title: 'Energy & Climate',
  level: 'Intermediate',
  cover: 'climate',
  tagline: 'Kilowatt-hours, fuels, sun and wind, and the physics of a warming planet.',
  description: r`Put numbers on the energy that runs the world. Compare fuels and batteries, find out how much power sunlight and wind can really deliver, and use simple physics to calculate Earth's temperature understand the greenhouse effect, estimate how much warming more CO₂ will bring, and see why a carbon budget means net zero.`,
  prereq: 'Heat & Thermodynamics',
  chapters: [
    {
      title: 'Energy in Numbers',
      summary: 'Power, energy and fuel.',
      lessons: [
        {
          id: 'kwh',
          title: 'Watts & Kilowatt-hours',
          summary: 'Power versus energy',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Rate versus amount',
              body: r`**Power** is the **rate** of using energy, measured in watts (1 W = 1 J/s). **Energy** is the **amount**: power × time.

Electricity bills use the **kilowatt-hour** (kWh): the energy used by a 1 kW appliance running for 1 hour:
$$1\ \text{kWh} = 1000\ \text{W} \times 3600\ \text{s} = 3.6\ \text{million joules}$$`,
            },
            {
              type: 'numeric',
              title: 'A cup of tea',
              prompt: r`A 2 kW kettle boils water in 3 minutes. How much energy does it use, in kWh?`,
              unit: 'kWh',
              answer: 0.1,
              wrong: [{ v: 6, why: r`3 minutes is $\frac{3}{60} = 0.05$ hours, not 3 hours.` }, { v: 360000, why: r`That's the energy in joules. Convert to kWh: $2\ \text{kW} \times 0.05\ \text{h}$.` }, { v: 0.67, tol: 0.01, why: r`Energy = power × time: multiply, don't divide.` }],
              explain: r`$2\ \text{kW} \times \tfrac{3}{60}\ \text{h} = 0.1$ kWh. At about 30 cents per kWh, that's 3 cents of electricity.`,
            },
            {
              type: 'numeric',
              title: 'Human power',
              prompt: r`You eat about 2,000 kcal of food a day (1 kcal = 4,184 J). On average, how many watts is that? (A day has 86,400 s.)`,
              unit: 'W',
              answer: (2000 * 4184) / 86400,
              tol: 2,
              wrong: [{ v: 2000, why: 'That’s energy per day in kcal. Convert to joules, then divide by the seconds in a day.' }, { v: 23, tol: 1, why: r`Use kcal → J first: $2000 \times 4184$ J, then divide by 86,400 s.` }],
              explain: r`$\dfrac{2000 \times 4184\ \text{J}}{86{,}400\ \text{s}} \approx 97$ W. A resting human runs at roughly the power of an old-fashioned **100 W light bulb**, and gives off about that much heat. That's why crowded rooms get warm!`,
            },
            {
              type: 'numeric',
              title: 'An electric shower',
              prompt: r`A 9 kW electric shower runs for 10 minutes. How many kWh does it use?`,
              unit: 'kWh',
              answer: 9 * 10 / 60,
              tol: 0.01,
              wrong: [{ v: 90, why: r`Convert the minutes to hours: 10 minutes is $\frac{1}{6}$ h.` }],
              explain: r`$9\ \text{kW} \times \frac{10}{60}\ \text{h} = 1.5$ kWh, as much as fifteen kettles. Heating water is one of the biggest energy uses in a home.`,
            },
            {
              type: 'interactive',
              title: 'Energy is area',
              body: r`Energy is power × time: the **area** of a power–time rectangle. An old 60 W bulb left on all day is a long, low rectangle. A 2 kW kettle is a tall, thin one. Find how long the kettle must run to use the **same energy** as the bulb does in 24 hours.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 24, ymin: 0, ymax: 2200, grid: false, height: 280, axes: { xlabel: 'time (hours)', ylabel: 'power (W)', xticks: 4, yticks: 500 },
                params: { t: { min: 1, max: 90, step: 0.1, value: 10, label: 'kettle time', color: 'coral', format: (v) => `${v.toFixed(1)} min` } },
                extra: ({ plot, p, s }) => [s('rect', { x: plot.X(0), y: plot.Y(60), width: plot.X(24) - plot.X(0), height: plot.Y(0) - plot.Y(60), class: 'fl-amber-soft', stroke: 'var(--amber)', 'stroke-width': 1.5 }), s('rect', { x: plot.X(0), y: plot.Y(2000), width: plot.X(p.t / 60) - plot.X(0), height: plot.Y(0) - plot.Y(2000), class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 1.5 })],
                readout: (p) => `bulb: 60 W × 24 h = **1.44 kWh** · kettle: 2 kW × ${(p.t / 60).toFixed(3)} h = **${((2 * p.t) / 60).toFixed(2)} kWh**`,
                goal: (p) => Math.abs((2 * p.t) / 60 - 1.44) < 0.004,
                hint: '1.44 kWh ÷ 2 kW gives hours; multiply by 60 for minutes.',
                solution: { t: 43.2 },
              },
              explain: r`$1.44 / 2 = 0.72$ h, about **43 minutes** of boiling, roughly 15 kettles of water. A high power for a short time can use as much energy as a low power for a long time: watts tell you the rate, kilowatt-hours the amount.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Standby',
              prompt: r`A TV left on standby draws 5 W all year. Roughly how much energy is that per year?`,
              cols: 2,
              choices: [
                { t: 'About 44 kWh', ok: true },
                { t: 'About 5 kWh', why: r`Multiply by the hours in a year: $5\ \text{W} \times 8760\ \text{h}$.` },
                { t: 'About 1,800 kWh', why: r`Far too much: $5\ \text{W} \times 8760\ \text{h} = 43{,}800$ Wh, which is about 44 kWh.` },
                { t: 'About 0.5 kWh', why: r`A year has 8,760 hours: $5 \times 8760$ Wh.` },
              ],
              explain: r`$5\ \text{W} \times 8760\ \text{h} = 43{,}800\ \text{Wh} \approx 44$ kWh, about the same as boiling the kettle 440 times. Small powers add up over long times.`,
            },
          ],
          recap: [
            'Power (W) is a rate. Energy (J or kWh) is power × time.',
            r`1 kWh $= 3.6 \times 10^6$ J.`,
            'A human runs at roughly 100 W.',
          ],
        },
        {
          id: 'density',
          title: 'Fuels & Batteries',
          summary: 'Energy per kilogram',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Energy density',
              body: r`How much energy does each kilogram store?

| Store | Energy per kg |
|---|---|
| Lithium-ion battery | about 0.9 MJ (0.25 kWh) |
| Wood | about 16 MJ |
| Petrol (gasoline) | about 46 MJ |
| Hydrogen | about 120–140 MJ |
| Uranium-235 (fully fissioned) | about 80,000,000 MJ |

Chemical fuels release energy by rearranging electron bonds. Nuclear fuel releases energy stored in the nucleus, millions of times more per kilogram.`,
            },
            {
              type: 'numeric',
              title: 'Petrol vs battery',
              prompt: r`Using the table, about how many times more energy does a kilogram of petrol hold than a kilogram of lithium-ion battery?`,
              unit: '×',
              answer: 51,
              tol: 4,
              wrong: [{ v: 0.02, tol: 0.005, why: 'You divided the wrong way round. Petrol holds more.' }, { v: 45, tol: 0.9, why: r`Divide rather than subtract: $46 / 0.9$.` }],
              explain: r`$46 / 0.9 \approx 50$. So how do electric cars compete? Mostly through **efficiency**.`,
            },
            {
              type: 'mcq',
              title: 'The efficiency gap',
              prompt: r`A petrol engine turns about 25–30% of its fuel energy into motion. An electric motor and battery manage about 85–90%. How much does this narrow the factor-of-50 gap?`,
              choices: [
                { t: 'To roughly a factor of 15', ok: true },
                { t: 'It closes it completely', why: r`Efficiency gains are about a factor of 3, not 50.` },
                { t: 'It makes no difference', why: 'What matters for driving is the useful energy, so efficiency counts.' },
              ],
              explain: r`Useful energy per kg: petrol about $46 \times 0.28 \approx 13$ MJ, battery about $0.9 \times 0.88 \approx 0.8$ MJ, so a gap of about 16×. Batteries are still much heavier per unit of useful energy, which is why EVs carry hundreds of kilograms of battery, and why batteries struggle in aircraft.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen versus petrol',
              prompt: r`Hydrogen stores about 33 kWh per kilogram and petrol about 12.9 kWh/kg. How many times more energy per kilogram does hydrogen hold? (1 decimal place.)`,
              unit: '×',
              answer: 33 / 12.9,
              tol: 0.06,
              explain: r`About **2.6 times** more per kilogram, but as a gas it’s so light that per **litre** it holds far less, even compressed to 700 bar. Tanks, not chemistry, are hydrogen’s big problem.`,
            },
            {
              type: 'interactive',
              title: 'A battery to match a tank',
              body: r`Petrol stores about 46 MJ/kg, but an engine turns only about 25% into motion. A lithium-ion battery stores about 0.9 MJ/kg, and an electric drive uses about 90% of it (after charging losses, call it 90% overall). Find the battery mass that delivers as much **useful** energy as **40 kg** of petrol.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: 0, ymax: 800, grid: false, height: 260, axes: { ylabel: 'useful energy (MJ)', yticks: 200, xticks: 10 },
                params: { m: { min: 50, max: 1000, step: 5, value: 300, label: 'battery mass', color: 'coral', format: (v) => `${v} kg` } },
                extra: ({ plot, p, s }) => { const pet = 40 * 46 * 0.25, bat = p.m * 0.9 * 0.9; return [s('rect', { x: plot.X(0.6), y: plot.Y(pet), width: plot.X(1.4) - plot.X(0.6), height: plot.Y(0) - plot.Y(pet), class: 'fl-amber' }), s('rect', { x: plot.X(2.6), y: plot.Y(Math.min(bat, 800)), width: plot.X(1.4) - plot.X(0.6), height: plot.Y(0) - plot.Y(Math.min(bat, 800)), class: 'fl-teal' }), s('text', { x: plot.X(1), y: plot.Y(pet) - 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: '40 kg petrol' }), s('text', { x: plot.X(3), y: plot.Y(Math.min(bat, 800)) - 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: `${p.m} kg battery` })]; },
                readout: (p) => `petrol: 40 × 46 × 0.25 = **460 MJ** useful · battery: ${p.m} × 0.9 × 0.9 = **${(p.m * 0.81).toFixed(0)} MJ** useful`,
                goal: (p) => Math.abs(p.m * 0.81 - 460) < 6,
                hint: 'Battery mass = 460 ÷ (0.9 × 0.9) kg.',
                solution: { m: 570 },
              },
              explain: r`About **570 kg** of battery replaces 40 kg of petrol. The raw energy density gap is about 50×, but the electric drive’s far better efficiency shrinks it to about 14×. That is why electric cars carry heavy batteries, and why batteries are hardest to use in aircraft.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A gram of uranium',
              prompt: r`Fully fissioning 1 gram of uranium-235 releases about $8 \times 10^{10}$ J. About how many kilograms of petrol (46 MJ/kg) hold the same energy?`,
              unit: 'kg',
              answer: 8e10 / 46e6,
              tol: 60,
              wrong: [{ v: 1.74, tol: 0.1, why: r`Check the powers of ten: $\frac{8 \times 10^{10}}{4.6 \times 10^{7}}$.` }, { v: 1739000, relTol: 0.05, tol: 50000, why: 'That’s the answer in grams. Give it in kilograms.' }],
              explain: r`$\dfrac{8 \times 10^{10}}{4.6 \times 10^{7}} \approx 1{,}700$ kg: nearly two tonnes of petrol for one gram of uranium. That huge ratio comes from $E = mc^2$: fission converts about 0.1% of the mass into energy, while burning converts only about a billionth.`,
            },
          ],
          recap: [
            'Petrol stores about 50× more energy per kg than a lithium-ion battery.',
            'Electric motors are about 3× more efficient than engines, narrowing the gap.',
            'Nuclear fuel stores millions of times more energy per kg than chemical fuel.',
          ],
        },
        {
          id: 'renewables',
          title: 'Sun & Wind',
          summary: 'How much power can they give?',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Sunlight',
              body: r`Above the atmosphere, sunlight delivers about **1,361 W per square metre** (the **solar constant**). After passing through the air, a clear midday sun gives roughly **1,000 W/m²** on a surface facing it. Averaged over nights, seasons and clouds, a typical location gets about **100–250 W/m²**.

Good solar panels convert about **20%** of the sunlight that hits them into electricity.`,
            },
            {
              type: 'numeric',
              title: 'A rooftop panel',
              prompt: r`A 2 m² solar panel with 20% efficiency faces the midday sun (1,000 W/m²). What power does it produce?`,
              unit: 'W',
              answer: 400,
              wrong: [{ v: 2000, why: 'That’s all the sunlight hitting it. Only 20% becomes electricity.' }, { v: 200, why: r`The panel is 2 m²: $2 \times 1000 \times 0.2$.` }],
              explain: r`$2\ \text{m}^2 \times 1000\ \text{W/m}^2 \times 0.20 = 400$ W at noon. Averaged over day and night it's far less, perhaps 40–60 W.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The wind’s cube law',
              body: r`The power carried by wind through a turbine's swept area $A$ is
$$P = \tfrac12 \rho A v^3$$
where $\rho \approx 1.2$ kg/m³ is the density of air. Adjust the blade length and wind speed.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 16, ymin: 0, ymax: 30, grid: 2, gridY: 5, height: 320, axes: { xlabel: 'wind speed (m/s)', ylabel: 'MW' },
                params: {
                  R: { min: 20, max: 80, step: 5, value: 50, label: 'blade length', color: 'teal', format: (v) => `${v} m` },
                  v: { min: 2, max: 15, step: 0.5, value: 8, label: 'wind speed', color: 'blue', format: (v) => `${fix(v, 1)} m/s` },
                },
                curves: [{ f: (x, p) => (0.5 * 1.2 * Math.PI * p.R * p.R * x ** 3) / 1e6, color: 'blue' }],
                points: [{ x: (p) => p.v, y: (p) => (0.5 * 1.2 * Math.PI * p.R * p.R * p.v ** 3) / 1e6, color: 'coral' }],
                readout: (p) => {
                  const P = 0.5 * 1.2 * Math.PI * p.R * p.R * p.v ** 3;
                  return r`wind power through the blades: $${f2(P / 1e6)}$ MW $\;$ (at most 59% of that can be captured)`;
                },
              },
              after: r`Because power grows as $v^3$, **doubling the wind speed gives 8 times the power**. That's why turbines are built tall (winds are stronger higher up) and placed on windy hills and out at sea. Longer blades help too: the area grows as the blade length squared.`,
            },
            {
              type: 'mcq',
              title: 'The Betz limit',
              prompt: r`Could a perfect turbine capture **all** of the wind's power?`,
              choices: [
                { t: 'No: at most 16/27 ≈ 59%', ok: true },
                { t: 'Yes, with perfect blades', why: 'To capture all the energy, the air would have to stop dead behind the turbine, and then no more air could flow through.' },
                { t: 'No: at most about 25%', why: 'The theoretical limit is higher, about 59%. Modern turbines achieve 40–50%.' },
              ],
              explain: r`If a turbine took **all** the wind's energy, the air would stop behind it and block the flow. Albert Betz showed in 1919 that the best possible turbine captures $\tfrac{16}{27} \approx 59.3\%$. Real turbines reach about 40–50%.`,
            },
            {
              type: 'numeric',
              title: 'A year of wind',
              prompt: r`A 2 MW wind turbine has a **capacity factor** of 35%: over a year it produces 35% of what it would running flat out. How many MWh does it generate in a year (8,760 hours)?`,
              unit: 'MWh',
              answer: 2 * 0.35 * 8760,
              tol: 5,
              explain: r`$2 \times 0.35 \times 8760 \approx 6{,}100$ MWh, enough for about 1,700 typical UK homes. Capacity factor is the honest way to compare power stations: solar in Britain manages about 11%, nuclear about 90%.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Calm versus breezy',
              prompt: r`A turbine produces 300 kW in a 6 m/s wind. Roughly how much would it produce at 9 m/s (assuming it stays below its maximum rating)?`,
              unit: 'kW',
              answer: 300 * 1.5 ** 3,
              tol: 15,
              wrong: [{ v: 450, why: r`Power isn't proportional to $v$: it grows as $v^3$.` }, { v: 675, why: r`That's $1.5^2$. Power goes as the **cube**: $1.5^3 = 3.375$.` }],
              explain: r`The speed ratio is $9/6 = 1.5$, so the power ratio is $1.5^3 \approx 3.4$: about **1,000 kW**. A modest increase in wind makes a big difference.`,
            },
          ],
          recap: [
            r`Sunlight: about 1,000 W/m² at noon. Panels convert about 20%.`,
            r`Wind power $= \tfrac12\rho A v^3$: doubling the wind speed gives 8× the power.`,
            'The Betz limit: no turbine can capture more than 59% of the wind’s power.',
          ],
        },
      ],
    },
    {
      title: 'A Planet in Balance',
      summary: 'Why Earth has the temperature it does.',
      lessons: [
        {
          id: 'balance',
          title: 'Earth’s Energy Balance',
          summary: 'Sunlight in, heat out',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'In equals out',
              body: r`Earth absorbs sunlight and radiates heat back to space as infrared. If it absorbs more than it emits, it warms up until the two match. So its temperature is set by **energy balance**.

Every object radiates at a rate given by the **Stefan–Boltzmann law**:
$$P = \sigma T^4 \ \text{per square metre}, \qquad \sigma = 5.67 \times 10^{-8}\ \text{W/m}^2\text{K}^4$$
with $T$ in kelvin. Hotter objects radiate **much** more: doubling $T$ means 16× the power.`,
            },
            {
              type: 'mcq',
              title: 'Divide by four',
              prompt: r`Sunlight arrives at 1,361 W/m² on a surface facing the Sun. Averaged over Earth's **whole surface**, what's the incoming rate?`,
              cols: 2,
              choices: [
                { t: 'About 340 W/m² (a quarter)', ok: true },
                { t: 'About 680 W/m² (a half)', why: 'Half the planet is in darkness, but the sunlit half is also hit at a slant. Together that gives a factor of 4.' },
                { t: '1,361 W/m²', why: 'Only a surface facing the Sun directly gets this. Most of the globe faces away or at an angle.' },
              ],
              explain: r`Earth intercepts sunlight over a **disc** of area $\pi R^2$ (its shadow), but spreads it over a **sphere** of area $4\pi R^2$. So the average is $\tfrac{1361}{4} \approx 340$ W/m².`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Earth’s temperature',
              body: r`Earth reflects about 30% of sunlight (its **albedo**, from clouds, ice and deserts). Balance the absorbed sunlight with the emitted heat:
$$(1 - \alpha)\frac{S}{4} = \sigma T^4$$
Adjust the albedo and the sunlight.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.9, ymin: 150, ymax: 320, grid: 0.1, gridY: 25, height: 320, axes: { xlabel: 'albedo α', ylabel: 'T (K)' },
                params: {
                  a: { min: 0, max: 0.9, step: 0.05, value: 0.3, label: 'albedo', color: 'teal', format: (v) => v.toFixed(2) },
                  S: { min: 1000, max: 1800, step: 20, value: 1360, label: 'sunlight', color: 'amber', format: (v) => `${v} W/m²` },
                },
                curves: [{ f: (x, p) => ((1 - x) * p.S / 4 / SIGMA) ** 0.25, color: 'coral' }],
                points: [{ x: (p) => p.a, y: (p) => ((1 - p.a) * p.S / 4 / SIGMA) ** 0.25, color: 'coral' }],
                readout: (p) => {
                  const T = ((1 - p.a) * p.S / 4 / SIGMA) ** 0.25;
                  return r`$T = ${f0(T)}$ K $= ${f0(T - 273)}$ °C`;
                },
              },
              after: r`With $\alpha = 0.3$ and $S = 1360$ W/m², the balance gives about **255 K (−18 °C)**. But Earth's actual average surface temperature is about **288 K (+15 °C)**. The missing 33 °C is the **greenhouse effect**. Notice also that a whiter planet (higher albedo) is colder: melting ice, which lowers albedo, adds to warming.`,
            },
            {
              type: 'numeric',
              title: 'Check the number',
              prompt: r`Absorbed sunlight is $(1 - 0.3) \times 340 = 238$ W/m². Solve $\sigma T^4 = 238$ for $T$ in kelvin.`,
              unit: 'K',
              answer: (238 / SIGMA) ** 0.25,
              tol: 1.5,
              wrong: [{ v: 64786, tol: 100, why: r`That's the square root. You need the **fourth** root: take the square root twice.` }, { v: 288, why: 'That’s the real surface temperature. The simple balance gives less: the greenhouse effect is missing.' }],
              explain: r`$T^4 = \dfrac{238}{5.67 \times 10^{-8}} \approx 4.2 \times 10^9$, so $T = \sqrt[4]{4.2 \times 10^9} \approx 255$ K. This is Earth's **effective radiating temperature**: the temperature at which it glows to space.`,
            },
            {
              type: 'numeric',
              title: 'What Earth absorbs',
              prompt: r`Sunlight arrives at an average of 340 W/m² over Earth’s whole surface, and Earth reflects 30% of it (its albedo). How much is absorbed, in W/m²?`,
              unit: 'W/m²',
              answer: 238,
              tol: 0.5,
              explain: r`$0.7 \times 340 = 238$ W/m². In balance, Earth must radiate the same amount back to space as infrared.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Doubling CO₂',
              prompt: r`Doubling the CO₂ in the air adds about 3.7 W/m² of extra heating (a "radiative forcing"). Climate models and past climates suggest about 0.8 °C of eventual warming per W/m². How much warming does that give for doubled CO₂? (1 decimal place.)`,
              unit: '°C',
              answer: 0.8 * 3.7,
              tol: 0.06,
              explain: r`$0.8 \times 3.7 \approx 3.0$ °C: the central estimate of the IPCC’s **climate sensitivity** (likely range about 2.5–4 °C). The direct effect of CO₂ alone is only about 1.1 °C; feedbacks from water vapour, melting ice and clouds nearly triple it.`,
            },
          ],
          recap: [
            r`Stefan–Boltzmann: radiated power per m² is $\sigma T^4$.`,
            'Earth absorbs (1 − albedo) × S/4. The factor 4 is sphere area ÷ disc area.',
            'Balance gives 255 K, but the surface is 288 K: the greenhouse effect makes up the gap.',
          ],
        },
        {
          id: 'greenhouse',
          title: 'The Greenhouse Effect',
          summary: 'Infrared, CO₂ and warming',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Two kinds of light',
              body: r`Hot objects glow most strongly at a wavelength given by **Wien's law**: $\lambda_{\max} = \dfrac{2.9 \times 10^{-3}\ \text{m·K}}{T}$.

- The Sun (5,800 K) peaks around 0.5 µm: **visible light**.
- Earth (about 288 K) peaks around 10 µm: **infrared**.

The atmosphere is mostly **transparent** to visible sunlight. But water vapour, CO₂ and methane **absorb** infrared. They catch some of the heat Earth radiates and send part of it back down, warming the surface.`,
            },
            {
              type: 'numeric',
              title: 'Earth’s glow',
              prompt: r`Using Wien's law, at what wavelength does Earth's thermal radiation peak? Take $T = 288$ K and give the answer in micrometres.`,
              unit: 'µm',
              answer: (2.9e-3 / 288) * 1e6,
              tol: 0.2,
              wrong: [{ v: 0.5, why: 'That’s the Sun’s peak. Earth is much cooler, so its peak wavelength is much longer.' }, { v: 0.835, tol: 0.05, why: r`Divide by $T$, don't multiply: $\frac{2.9 \times 10^{-3}}{288}$ m.` }],
              explain: r`$\lambda_{\max} = \dfrac{2.9 \times 10^{-3}}{288} \approx 1.0 \times 10^{-5}$ m $= 10$ µm: deep in the infrared, invisible to our eyes but strongly absorbed by CO₂ (around 15 µm) and water vapour.`,
            },
            {
              type: 'mcq',
              title: 'Not like a real greenhouse',
              prompt: r`Which gases are most responsible for the natural greenhouse effect?`,
              choices: [
                { t: 'Water vapour and carbon dioxide', ok: true },
                { t: 'Nitrogen and oxygen', why: 'N₂ and O₂ make up 99% of the air, but molecules made of two identical atoms barely absorb infrared.' },
                { t: 'Ozone only', why: 'Ozone is a greenhouse gas but a minor one. It’s better known for absorbing ultraviolet.' },
              ],
              explain: r`Water vapour contributes the largest share and CO₂ the next largest, with methane, ozone and others adding smaller amounts. Nitrogen and oxygen hardly absorb infrared at all. Without the natural greenhouse effect, Earth's average temperature would be around −18 °C.`,
            },
            {
              type: 'explain',
              title: 'Adding CO₂',
              body: r`Atmospheric CO₂ has risen from about **280 ppm** before the industrial era to over **420 ppm** today, mainly from burning fossil fuels. Extra CO₂ traps extra heat: a **radiative forcing** of approximately
$$\Delta F \approx 5.35 \ln\!\left(\frac{C}{C_0}\right)\ \text{W/m}^2$$
The logarithm means each **doubling** of CO₂ adds the same forcing, about 3.7 W/m². Climate models and past climates suggest a doubling eventually warms Earth by about **3 °C** (likely range roughly 2.5–4 °C), once feedbacks like water vapour and melting ice are included.`,
            },
            {
              type: 'interactive',
              title: 'One blanket of air',
              body: r`In the simplest model, the atmosphere absorbs a fraction $\varepsilon$ of the infrared that the ground emits and radiates half of it back down. The surface then settles at $T_s = 255\ \text{K} \times \left(\frac{2}{2 - \varepsilon}\right)^{1/4}$. Find the absorption that gives Earth’s actual average, **15 °C (288 K)**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 250, ymax: 310, grid: false, height: 260, axes: { xlabel: 'fraction of infrared absorbed ε', ylabel: 'surface temperature (K)', xticks: 0.2, yticks: 10, yAt: 0 },
                params: { eps: { min: 0, max: 1, step: 0.005, value: 0.3, label: 'absorbed', color: 'coral', format: (v) => v.toFixed(3) } },
                curves: [{ f: (x) => 255 * (2 / (2 - x)) ** 0.25, color: 'violet', width: 3 }, { f: () => 288, color: 'teal', dash: true }],
                points: [{ x: (p) => p.eps, y: (p) => 255 * (2 / (2 - p.eps)) ** 0.25, color: 'coral' }],
                readout: (p) => { const T = 255 * (2 / (2 - p.eps)) ** 0.25; return `surface **${T.toFixed(1)} K = ${(T - 273.15).toFixed(1)} °C**`; },
                goal: (p) => Math.abs(255 * (2 / (2 - p.eps)) ** 0.25 - 288) < 0.4,
                hint: 'Solve (2 / (2 − ε)) = (288/255)⁴ ≈ 1.63.',
                solution: { eps: 0.77 },
              },
              explain: r`About $\varepsilon \approx 0.77$: the air absorbs roughly three-quarters of the ground’s infrared. Without any greenhouse effect ($\varepsilon = 0$) Earth would sit at 255 K, a frozen −18 °C. Adding CO₂ nudges $\varepsilon$ upward, and the surface must warm to restore the balance.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Forcing so far',
              prompt: r`Use $\Delta F = 5.35 \ln(C / C_0)$ to estimate the forcing from CO₂ rising from 280 ppm to 420 ppm.`,
              unit: 'W/m²',
              answer: 5.35 * Math.log(1.5),
              tol: 0.05,
              wrong: [{ v: 0.94, tol: 0.03, why: r`Use the natural log (ln), not $\log_{10}$: $\ln 1.5 \approx 0.405$.` }, { v: 8.03, tol: 0.05, why: r`Take the log first: $5.35 \times \ln(1.5)$, not $5.35 \times 1.5$.` }],
              explain: r`$5.35 \times \ln(420/280) = 5.35 \times \ln 1.5 \approx 5.35 \times 0.405 \approx 2.2$ W/m². Spread over the whole Earth, that's about a petawatt ($10^{15}$ W) of extra heat retained, dozens of times humanity's total energy use.`,
            },
          ],
          recap: [
            'The Sun shines in visible light. Earth glows in infrared (about 10 µm).',
            'Water vapour and CO₂ absorb infrared, warming the surface by about 33 °C.',
            r`CO₂ forcing $\approx 5.35\ln(C/C_0)$ W/m²: about 3.7 W/m² per doubling.`,
          ],
        },
      ],
    },
    {
      title: 'How Much Warming?',
      summary: 'Sensitivity and budgets.',
      lessons: [
        {
          id: 'sensitivity',
          title: 'Climate Sensitivity',
          summary: 'Forcing, feedbacks and warming',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Radiative forcing',
              body: r`Adding CO₂ traps extra heat, measured as a **radiative forcing** $\Delta F$ in watts per square metre. Because CO₂'s absorption bands are already partly saturated, the forcing grows with the **logarithm** of the concentration:
$$\Delta F \approx 5.35 \ln\frac{C}{C_0}$$
where $C_0 = 280$ ppm (parts per million) is the pre-industrial level. The planet eventually warms until it radiates the extra energy away: $\Delta T = \lambda\,\Delta F$, where $\lambda$, the **climate sensitivity parameter**, is about 0.8 K per W/m² once feedbacks are included.`,
            },
            {
              type: 'numeric',
              title: 'Forcing from a doubling',
              prompt: r`What's the forcing from doubling CO₂ ($C = 2C_0$)? (W/m², 1 decimal place.)`,
              unit: 'W/m²',
              answer: 5.35 * Math.log(2),
              tol: 0.05,
              wrong: [{ v: 10.7, tol: 0.1, why: r`It's $5.35 \ln 2$, not $5.35 \times 2$.` }],
              explain: r`$5.35 \ln 2 \approx 3.7$ W/m². With $\lambda = 0.8$, that gives about 3 °C of eventual warming: the famous "equilibrium climate sensitivity", which the IPCC assesses as likely between 2.5 and 4 °C.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The 1.5 °C level',
              prompt: r`Using this simple model, find the CO₂ concentration whose **equilibrium** warming is 1.5 °C.`,
              widget: {
                kind: 'graph', xmin: 280, xmax: 800, ymin: 0, ymax: 5, grid: 50, gridY: 0.5, height: 260, axes: { xlabel: 'CO₂ (ppm)', ylabel: 'equilibrium warming (°C)', xAt: 280 },
                params: { c: { min: 280, max: 800, step: 1, value: 560, slider: false } },
                curves: [{ f: (x) => warming(x), color: 'coral', width: 3 }, { f: () => 1.5, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.c, y: (p) => warming(p.c), drag: { x: 'c' }, color: 'violet' }],
                readout: (p) => r`${p.c} ppm: forcing $${forcing(p.c).toFixed(2)}$ W/m², warming $${warming(p.c).toFixed(2)}$ °C`,
                goal: (p) => Math.abs(warming(p.c) - 1.5) < 0.01,
                hint: r`Solve $0.8 \times 5.35 \ln\frac{C}{280} = 1.5$.`,
                solution: { c: 397 },
              },
              explain: r`About **400 ppm**, a level we passed in 2015 (it's now over 420). Warming lags behind concentration because the oceans take decades to heat up, and other gases and aerosols complicate the picture, but the logarithmic shape is real: each doubling adds about the same warming.`,
            },
            {
              type: 'mcq',
              title: 'Ice-albedo feedback',
              prompt: r`As the Arctic warms, sea ice melts, exposing dark ocean. How does that affect warming?`,
              choices: [
                { t: 'It amplifies it: dark water absorbs far more sunlight than bright ice, causing more warming and more melting', ok: true },
                { t: 'It reduces it: water stores heat', why: 'Storing heat doesn’t reflect sunlight. Losing bright ice means absorbing more energy.' },
                { t: 'No effect', why: 'Ice reflects about 60% or more of sunlight, open ocean only about 6%: a big difference.' },
              ],
              explain: r`This is a **positive feedback**. Others include water vapour (warmer air holds more of this greenhouse gas). The main negative feedback is the planet radiating more heat as it warms ($\sigma T^4$). Feedbacks are why the sensitivity is about 0.8 rather than the 0.3 K per W/m² that CO₂ alone would give.`,
            },
            {
              type: 'numeric',
              title: 'The rest of the doubling',
              prompt: r`CO₂ is now about 420 ppm. Using $\Delta F = 5.35\ln\frac{C}{C_0}$, how much **more** forcing would a rise to 560 ppm (double pre-industrial) add? (2 decimal places.)`,
              unit: 'W/m²',
              answer: 5.35 * Math.log(560 / 420),
              tol: 0.01,
              wrong: [{ v: 3.71, tol: 0.02, why: r`That's the full doubling from 280 ppm. Here $C_0 = 420$, so use $\ln(560/420)$.` }],
              explain: r`$5.35 \ln\frac{560}{420} = 5.35 \ln\frac{4}{3} \approx 1.54$ W/m². We have already added about 2.17 of the 3.71 W/m² a doubling brings, so well over half the forcing of a doubling is already in place.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Without feedbacks',
              prompt: r`Without any feedbacks, the sensitivity would be about 0.3 K per W/m². How much warming would doubling CO₂ cause then? (1 decimal place.)`,
              unit: '°C',
              answer: 0.3 * 5.35 * Math.log(2),
              tol: 0.05,
              wrong: [{ v: 3, tol: 0.05, why: 'That’s with feedbacks (λ = 0.8).' }],
              explain: r`$0.3 \times 3.7 \approx 1.1$ °C. Feedbacks roughly triple it. Most of the uncertainty in future warming comes from the strength of feedbacks, especially from clouds.`,
            },
          ],
          recap: [
            r`CO₂ forcing $\Delta F \approx 5.35 \ln(C/C_0)$: logarithmic.`,
            r`Equilibrium warming $\Delta T = \lambda \Delta F$, about 3 °C per doubling.`,
            'Feedbacks (ice, water vapour, clouds) roughly triple the direct effect.',
          ],
        },
        {
          id: 'budget',
          title: 'Carbon Budgets',
          summary: 'Total emissions set the warming',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'It’s the total that counts',
              body: r`CO₂ stays in the atmosphere for centuries, so warming depends mainly on **cumulative** emissions, the total ever emitted, not on any single year's. Climate models find a roughly straight-line relationship: about **0.45 °C** of warming per 1,000 billion tonnes (gigatonnes, Gt) of CO₂.

So any temperature limit implies a total "carbon budget". Once it's used up, emissions must be at net zero.`,
            },
            {
              type: 'numeric',
              title: 'Warming so far',
              prompt: r`Humanity has emitted about 2,500 Gt of CO₂ since 1850. At 0.45 °C per 1,000 Gt, how much warming does that imply? (1 decimal place.)`,
              unit: '°C',
              answer: 2.5 * 0.45,
              tol: 0.05,
              wrong: [{ v: 1125, why: 'Use 0.45 °C per 1,000 Gt: 2.5 × 0.45.' }],
              explain: r`$2.5 \times 0.45 \approx 1.1$ °C, close to the observed warming of about 1.2–1.3 °C (other gases add a little more, while air pollution has masked some).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Fit the budget',
              prompt: r`Suppose emissions are 40 Gt a year and the remaining budget for a target is **400 Gt**. If emissions fall in a straight line to zero, find the number of years the decline can take.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 45, grid: 5, gridY: 10, height: 260, axes: { xlabel: 'years from now', ylabel: 'emissions (Gt CO₂ per year)' },
                params: { T: { min: 2, max: 40, step: 1, value: 30, label: 'years to net zero', color: 'coral', format: (v) => `${v}` } },
                extra: ({ plot, p, s }) => [s('path', { d: `M${plot.X(0)} ${plot.Y(0)} L${plot.X(0)} ${plot.Y(40)} L${plot.X(p.T)} ${plot.Y(0)} Z`, class: p.T * 20 <= 400 ? 'fl-teal' : 'fl-coral', opacity: 0.45, stroke: 'var(--ink-3)', 'stroke-width': 2 })],
                readout: (p) => `straight-line decline over ${p.T} years: total emitted ½ × 40 × ${p.T} = **${20 * p.T} Gt** ${20 * p.T <= 400 ? '(within budget)' : '(over budget)'}`,
                goal: (p) => p.T === 20,
                hint: 'The total is the area of the triangle: ½ × 40 × T.',
                solution: { T: 20 },
              },
              explain: r`$\frac12 \times 40 \times T = 400$ gives $T = 20$ years. Waiting 5 years at today's rate first would use 200 Gt, leaving only 10 years for the decline. Delay makes the necessary cuts much steeper.`,
            },
            {
              type: 'mcq',
              title: 'Why stopping matters',
              prompt: r`If CO₂ emissions stopped completely tomorrow, what would roughly happen to global temperature over the following decades, according to climate models?`,
              choices: [
                { t: 'It would stay roughly level, not fall back quickly, because CO₂ lingers for centuries', ok: true },
                { t: 'It would drop back to pre-industrial levels within a few years', why: 'CO₂ is removed only slowly by oceans and rocks, so the warming persists.' },
                { t: 'It would keep rising for centuries at the same rate', why: 'Models find warming largely stops once net emissions reach zero.' },
              ],
              explain: r`Ocean uptake of CO₂ and the ocean's slow warming roughly cancel out, so temperatures plateau. That's why net zero is the key goal: it stops warming, but undoing it would require actively removing CO₂.`,
            },
            {
              type: 'numeric',
              title: 'Years left',
              prompt: r`Suppose the remaining carbon budget for a given warming limit is 400 billion tonnes of CO₂, and the world emits 40 billion tonnes a year. At that rate, how many years until it is used up?`,
              unit: 'years',
              answer: 10,
              explain: r`$\frac{400}{40} = 10$ years. Since warming tracks cumulative emissions, cutting the rate stretches the budget: halving emissions would double the time.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Per person',
              prompt: r`Global CO₂ emissions are about 40 Gt per year, and there are about 8 billion people. What's the average per person, in tonnes per year?`,
              unit: 't',
              answer: 5,
              wrong: [{ v: 0.2, tol: 0.01, why: '40 × 10⁹ t ÷ 8 × 10⁹ people = 5 t.' }],
              explain: r`$\frac{40 \times 10^9}{8 \times 10^9} = 5$ tonnes each, though this varies hugely: around 15 t per person in the US, about 5 t in the UK, and under 1 t in many African countries.`,
            },
          ],
          recap: [
            'Warming tracks cumulative CO₂: about 0.45 °C per 1,000 Gt.',
            'Temperature limits imply finite carbon budgets.',
            'Reaching net zero stops further warming; delay steepens the cuts needed.',
          ],
        },
      ],
    },
  ],
};
