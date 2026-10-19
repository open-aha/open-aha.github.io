import { fix } from '../lib/svg.js';

const r = String.raw;
const f0 = (v) => Math.round(v).toLocaleString('en-US').replace(/,/g, '{,}');
// live readouts keep a fixed 3 decimals, so they never change length (DESIGN.md, Live numbers)
const f3 = (v) => fix(v, 3);

// a 10 m² wall: 10 cm of brick plus a layer of insulation, 20 °C warmer inside
const A = 10, DT = 20;
const Rbrick = 0.1 / (0.7 * A);
const loss = (d) => DT / (Rbrick + d / (0.04 * A));

const SIGMA = 5.67e-8;
const wienPeak = (T) => 2.898e-3 / T * 1e9; // nm
// Planck spectrum, relative units, wavelength in nm
const planck = (nm, T) => { const l = nm * 1e-9; return 1 / (l ** 5 * (Math.exp(0.014388 / (l * T)) - 1)); };
const towerGrowth = (dT) => 12e-6 * 300 * dT * 100; // cm, 300 m of iron

export default {
  id: 'heat',
  subject: 'physics',
  title: 'Heat Transfer',
  level: 'Intermediate',
  cover: 'heat',
  tagline: 'Conduction, convection, radiation, insulation, glowing hot objects and thermal expansion.',
  description: r`Why does metal feel colder than wood at the same temperature? How does a vacuum flask keep tea hot for hours? Learn the three ways heat moves, calculate how much a wall leaks, design insulation like an engineer, find star temperatures from their colour, and see why bridges need gaps.`,
  prereq: 'Heat & Thermodynamics',
  chapters: [
    {
      title: 'How Heat Moves',
      summary: 'Three mechanisms.',
      lessons: [
        {
          id: 'three-ways',
          title: 'Three Ways Heat Travels',
          summary: 'Conduction, convection, radiation',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Three mechanisms',
              body: r`Heat always flows from hot to cold, in three ways:
- **Conduction**: vibrating particles jostle their neighbours, passing energy along through a material. (A metal spoon in hot soup.)
- **Convection**: a warm fluid (liquid or gas) moves, carrying its heat with it. Warm fluid is less dense, so it rises. (A radiator warming a room.)
- **Radiation**: every object emits infrared light, which can cross empty space. (Sunlight warming your face, or the warmth from a campfire.)`,
            },
            {
              type: 'mcq',
              title: 'Across space',
              prompt: r`Which way does the Sun's heat reach Earth?`,
              cols: 3,
              choices: [
                { t: 'Radiation', ok: true },
                { t: 'Conduction', why: 'Conduction needs matter, but the space between the Sun and Earth is nearly empty.' },
                { t: 'Convection', why: 'Convection needs a moving fluid. Space has none.' },
              ],
              explain: r`Space is an almost perfect vacuum, so only **radiation** can cross it. Electromagnetic waves need no medium.`,
            },
            {
              type: 'numeric',
              title: 'Warming a room',
              prompt: r`A radiator, a hair dryer and the Sun's warmth on your face each rely mainly on one mechanism. Which number corresponds to the Sun on your face: 1 = conduction, 2 = convection, 3 = radiation?`,
              answer: 3,
              wrong: [{ v: 2, why: 'There’s no air between the Sun and Earth to carry heat: it arrives as light.' }, { v: 1, why: 'Conduction needs contact.' }],
              explain: r`Radiation: sunlight crosses 150 million km of empty space. A hair dryer works by convection (blowing hot air), and a "radiator", despite its name, heats a room mostly by convection too.`,
            },
            {
              type: 'mcq',
              title: 'The vacuum flask',
              prompt: r`A vacuum flask has a double wall with a vacuum between the layers, and the inner surfaces are silvered like a mirror. Which kinds of heat transfer do these features block?`,
              choices: [
                { t: 'The vacuum blocks conduction and convection; the silvering reflects radiation', ok: true },
                { t: 'The vacuum blocks radiation', why: 'Radiation crosses a vacuum easily: that’s how sunlight reaches us. The silvering deals with radiation.' },
                { t: 'The silvering blocks conduction', why: 'A thin metal coating doesn’t stop conduction. It reflects infrared radiation back inside.' },
              ],
              explain: r`With no matter in the gap, there's nothing to conduct heat and no fluid to convect it. Radiation could still cross, but the shiny surfaces reflect most of it back. James Dewar invented the design in 1892 to store very cold liquefied gases. The same flask keeps hot drinks hot and cold drinks cold.`,
            },
            {
              type: 'interactive',
              title: 'Twice the glow',
              body: r`Every surface radiates heat at a rate proportional to the **fourth power** of its absolute temperature: $P = \sigma T^4$ per square metre. A wall at 20 °C radiates about 420 W/m². Find the temperature at which a surface radiates **twice** as much.`,
              widget: {
                kind: 'graph', xmin: -20, xmax: 150, ymin: 0, ymax: 1600, grid: false, height: 260, axes: { xlabel: 'temperature (°C)', ylabel: 'radiated power (W/m²)', xticks: 20, yticks: 400, xAt: -20 },
                params: { T: { min: -20, max: 150, step: 0.5, value: 40, label: 'temperature', color: 'coral', format: (v) => `${v.toFixed(1)} °C` } },
                curves: [{ f: (x) => 5.67e-8 * (x + 273.15) ** 4, color: 'violet', width: 3 }, { f: () => 2 * 5.67e-8 * 293.15 ** 4, color: 'teal', dash: true }],
                points: [{ x: (p) => p.T, y: (p) => 5.67e-8 * (p.T + 273.15) ** 4, color: 'coral' }],
                readout: (p) => `${(p.T + 273.15).toFixed(1)} K radiates **${(5.67e-8 * (p.T + 273.15) ** 4).toFixed(0)} W/m²** · ${((p.T + 273.15) ** 4 / 293.15 ** 4).toFixed(2)}× the 20 °C wall`,
                goal: (p) => Math.abs((p.T + 273.15) ** 4 / 293.15 ** 4 - 2) < 0.02,
                hint: 'Double the power needs the absolute temperature multiplied by the fourth root of 2, about 1.19.',
                solution: { T: 75.5 },
              },
              explain: r`$293 \times \sqrt[4]{2} \approx 349$ K, about **75 °C**. Because of the fourth power, a modest rise in absolute temperature doubles the radiation. Work in kelvin: 40 °C is not "twice as hot" as 20 °C.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Glowing in the room',
              prompt: r`Your skin (310 K, about 1.8 m²) radiates heat and absorbs radiation from walls at 293 K. The net loss is $\sigma A (T_\text{skin}^4 - T_\text{room}^4)$ with $\sigma = 5.67 \times 10^{-8}$ W/m²K⁴. About how many watts is that? (Nearest 10 W.)`,
              unit: 'W',
              answer: 5.67e-8 * 1.8 * (310 ** 4 - 293 ** 4),
              tol: 6,
              wrong: [{ v: 943, tol: 10, why: r`That’s the total emitted. Subtract what you absorb from the room at 293 K.` }],
              explain: r`About **190 W**, more than your resting metabolism (about 100 W)! Clothing cuts this drastically by placing a cooler surface between you and the room. That’s why a cold room feels chilly even without any draught.`,
            },
          ],
          recap: [
            'Conduction: through materials, particle to particle.',
            'Convection: carried by moving fluids. Warm fluid rises.',
            'Radiation: infrared light, which can cross a vacuum.',
          ],
        },
        {
          id: 'conduction',
          title: 'Conduction',
          summary: 'Good and bad conductors',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Fourier’s law',
              body: r`The rate of heat flow through a slab is
$$P = \frac{kA\,\Delta T}{d}$$
where $A$ is the area, $d$ the thickness, $\Delta T$ the temperature difference, and $k$ the material's **thermal conductivity**:

| Material | $k$ (W/m·K) |
|---|---|
| Copper | about 400 |
| Glass | about 1 |
| Brick | about 0.7 |
| Wood | about 0.15 |
| Fibreglass insulation | about 0.04 |
| Still air | about 0.025 |

Metals conduct heat well because their free electrons carry energy quickly.`,
            },
            { /*anim:heat*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Heat soaking through',
              body: r`A cold metal rod (0 °C) has its left end suddenly held at 100 °C and its right end kept at 0 °C. Watch the temperature along the rod, and compare the heat flowing **in** at the hot end with the heat flowing **out** at the cold end.`,
              widget: {
                kind: 'graph', xmin: -0.05, xmax: 1.05, ymin: -28, ymax: 108, grid: false, axes: false, height: 300,
                animate: { param: 't', speed: 0.035, max: 0.6, autoplay: true },
                curves: [{ f: (x, p) => { let T = 100 * (1 - x); for (let n = 1; n <= 60; n++) T -= (200 / (n * Math.PI)) * Math.sin(n * Math.PI * x) * Math.exp(-n * n * Math.PI * Math.PI * p.t); return Math.max(0, T); }, from: 0, to: 1, color: 'coral', width: 3, n: 300 }],
                under: ({ plot, p, s }) => {
                  const els = [];
                  for (let i = 0; i < 40; i++) {
                    const x = (i + 0.5) / 40;
                    let T = 100 * (1 - x);
                    for (let n = 1; n <= 60; n++) T -= (200 / (n * Math.PI)) * Math.sin(n * Math.PI * x) * Math.exp(-n * n * Math.PI * Math.PI * p.t);
                    els.push(s('rect', { x: plot.X(i / 40), y: plot.Y(-8), width: plot.X(1 / 40) - plot.X(0) + 0.5, height: plot.Y(-22) - plot.Y(-8), class: 'fl-coral', opacity: (0.08 + 0.9 * Math.max(0, T) / 100).toFixed(2) }));
                  }
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(1), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(1), y1: plot.Y(100), y2: plot.Y(0), stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '5 5' }));
                  return els;
                },
                readout: (p) => {
                  // heat flow ∝ −dT/dx at each end (in units where the final steady flow is 100)
                  let inn = 100, out = 100;
                  for (let n = 1; n <= 400; n++) { const e = Math.exp(-n * n * Math.PI * Math.PI * Math.max(p.t, 1e-4)); inn += 200 * e; out += 200 * (n % 2 ? -1 : 1) * e; }
                  return `heat flowing in at the hot end: ${fix(inn, 0)} · out at the cold end: ${fix(Math.max(0, out), 0)} (in units of the final steady flow)`;
                },
              },
              after: r`At first, heat pours into the hot end but none comes out of the cold end: it's being stored, warming the rod. The difference shrinks as the profile fills in, and eventually the temperature falls in a **straight line** (dashed) from 100 °C to 0 °C. Then heat flows in and out at the same steady rate, just as Fourier's law $P = \frac{kA\,\Delta T}{d}$ describes. Thicker or less conductive objects take longer to reach that steady state, which is why a thick wall stays cool for hours on a hot day.`,
            },
            {
              type: 'mcq',
              title: 'Cold to the touch',
              prompt: r`On a cool morning, a metal bench and a wooden bench are both at 10 °C. Why does the metal feel much colder?`,
              choices: [
                { t: 'Metal conducts heat away from your skin much faster', ok: true },
                { t: 'The metal is actually colder', why: 'Both have been outside all night: they’re at the same temperature.' },
                { t: 'Metal contains more “cold”', why: 'There’s no such thing as “cold” flowing. Heat flows out of your warm hand, faster into the metal.' },
              ],
              explain: r`Your skin senses how fast it **loses heat**, not the object's temperature. Metal's high conductivity whisks heat away from your hand, so it feels cold. Wood barely conducts, so the surface quickly warms to near skin temperature and feels mild.`,
            },
            {
              type: 'numeric',
              title: 'A single-glazed window',
              prompt: r`Builders rate windows by their U-value: heat loss per square metre per degree of temperature difference. A single-glazed window has $U = 5.8$ W/(m²·K). How much heat does a 1.5 m² window lose when it's 20 °C warmer inside? (Nearest whole watt.)`,
              unit: 'W',
              answer: Math.round(5.8 * 1.5 * 20),
              tol: 1,
              wrong: [{ v: 116, why: 'Multiply by the area too: U × A × ΔT.' }],
              explain: r`$5.8 \times 1.5 \times 20 = 174$ W, nearly a small heater's worth, through one window. Modern triple glazing has $U \approx 0.8$, cutting that to about 24 W.`,
            },
            {
              type: 'numeric',
              title: 'A leaky wall',
              prompt: r`A 10 m² brick wall is 0.2 m thick ($k = 0.7$ W/m·K). Inside is 20 °C warmer than outside. How much heat flows through it?`,
              unit: 'W',
              answer: (0.7 * 10 * 20) / 0.2,
              tol: 2,
              wrong: [{ v: 28, why: r`Divide by the thickness, don't multiply: $\frac{0.7 \times 10 \times 20}{0.2}$.` }, { v: 7, why: r`Include the temperature difference: $\Delta T = 20$ K.` }],
              explain: r`$P = \dfrac{0.7 \times 10 \times 20}{0.2} = 700$ W, about the same as running seven old 100 W bulbs, all day and all night. Insulation can cut this dramatically.`,
            },
            {
              type: 'interactive',
              title: 'Insulating a loft',
              body: r`A 50 m² loft floor separates a 20 °C house from the 0 °C roof space above. Heat flows through insulation at $P = \frac{kA\,\Delta T}{d}$, with $k = 0.04$ W/(m·K) for mineral wool. Find the thickness that cuts the loss to **200 W**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 2000, grid: false, height: 270, axes: { xlabel: 'insulation thickness (cm)', ylabel: 'heat loss (W)', xticks: 5, yticks: 500 },
                params: { d: { min: 1, max: 30, step: 0.5, value: 3, label: 'thickness', color: 'coral', format: (v) => `${v.toFixed(1)} cm` } },
                curves: [{ f: (x) => (0.04 * 50 * 20) / (x / 100), color: 'violet', width: 3, from: 2 }, { f: () => 200, color: 'teal', dash: true }],
                points: [{ x: (p) => p.d, y: (p) => Math.min(2000, (0.04 * 50 * 20) / (p.d / 100)), color: 'coral' }],
                readout: (p) => `heat loss **${((0.04 * 50 * 20) / (p.d / 100)).toFixed(0)} W** · about ${((0.04 * 50 * 20) / (p.d / 100) * 24 / 1000).toFixed(1)} kWh a day`,
                goal: (p) => p.d === 20,
                hint: 'd = kAΔT / P = 0.04 × 50 × 20 / 200 metres.',
                solution: { d: 20 },
              },
              explain: r`$d = \frac{0.04 \times 50 \times 20}{200} = 0.2$ m: **20 cm**, close to the depth recommended for lofts. The curve shows diminishing returns: the first 5 cm cut the loss from 4,000 W to 800 W, but going from 20 cm to 30 cm saves only about 70 W more.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Copper versus steel',
              prompt: r`Copper’s thermal conductivity is about 400 W/(m·K); stainless steel’s about 16. How many times faster does heat flow through a copper bar than a steel one of the same size and temperature difference?`,
              unit: '×',
              answer: 400 / 16,
              tol: 0.1,
              explain: r`$\frac{400}{16} = 25$ times. That’s why good saucepans have a copper or aluminium base (to spread heat evenly) but stainless-steel handles (which stay cool).`,
            },
          ],
          recap: [
            r`Fourier's law: $P = kA\Delta T / d$.`,
            'Metals conduct heat well. Air, foam and wood conduct poorly.',
            'Touch senses the rate of heat loss, not the temperature itself.',
          ],
        },
        {
          id: 'insulation',
          title: 'Insulation',
          summary: 'Layers in series',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Thermal resistance',
              body: r`Each layer of a wall has a **thermal resistance** $R = \dfrac{d}{kA}$ (in K/W). Heat flow is like current through resistors in series: the resistances simply **add**, and
$$P = \frac{\Delta T}{R_1 + R_2 + \dots}$$
Insulating materials trap still air in tiny pockets: fibres, foam bubbles or fluffy feathers. Still air is a very poor conductor, so they have a high $R$ per centimetre.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Insulate the wall',
              prompt: r`A 10 m² wall of 10 cm brick loses heat with a 20 °C difference. Add fibreglass insulation ($k = 0.04$) until the heat loss is **100 W or less**. Use the thinnest layer that works.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.2, ymin: 0, ymax: 1500, grid: 0.02, gridY: 250, height: 300, padL: 58, axes: { xlabel: 'insulation thickness (m)', ylabel: 'heat loss (W)' },
                params: { d: { min: 0, max: 0.2, step: 0.01, value: 0, label: 'insulation', color: 'amber', format: (v) => `${Math.round(v * 100)} cm` } },
                curves: [{ f: (d) => loss(d), color: 'coral' }, { f: () => 100, color: 'teal', dash: true }],
                points: [{ x: (p) => p.d, y: (p) => loss(p.d), color: 'coral' }],
                readout: (p) => r`brick $R = ${f3(Rbrick)}$ K/W, insulation $R = ${f3(p.d / (0.04 * A))}$ K/W $\;\Rightarrow\;$ heat loss $= ${f0(loss(p.d))}$ W`,
                goal: (p) => loss(p.d) <= 100 && loss(p.d - 0.01) > 100,
                hint: r`You need a total resistance of $20 / 100 = 0.2$ K/W.`,
                solution: { d: 0.08 },
              },
              explain: r`You need $R_{\text{total}} \geq 0.2$ K/W. The brick gives only $0.014$, so the insulation must supply about $0.186$: $d = 0.186 \times 0.04 \times 10 \approx 0.074$ m. So **8 cm** of fibreglass cuts the loss from 1,400 W to under 100 W. The first few centimetres make the biggest difference.`,
            },
            {
              type: 'mcq',
              title: 'Air pockets',
              prompt: r`Wool, feathers, foam and fibreglass are all excellent insulators. What do they have in common?`,
              choices: [
                { t: 'They trap lots of still air in small pockets, and still air is a very poor conductor', ok: true },
                { t: 'They’re all made of the same material', why: 'Very different materials, one shared trick: trapped air.' },
                { t: 'They reflect heat', why: 'Shiny foils reflect radiation, but fluffy materials work by trapping air.' },
              ],
              explain: r`Air conducts heat about 20 times worse than brick, but only if it can't move: moving air carries heat by convection. Tiny pockets stop convection. That's why a wet woollen jumper (pockets full of water) loses much of its warmth.`,
            },
            {
              type: 'mcq',
              title: 'Double glazing',
              prompt: r`Why does a double-glazed window (two panes with a thin gap of air or argon) lose much less heat than a single pane?`,
              choices: [
                { t: 'The trapped gas layer is a poor conductor and adds a large thermal resistance', ok: true },
                { t: 'Two panes of glass are twice as thick', why: 'Glass is a fairly good conductor. Doubling it would help only a little. The gas gap does the real work.' },
                { t: 'The gap reflects heat', why: 'Ordinary gas doesn’t reflect infrared. It insulates because it conducts so poorly.' },
              ],
              explain: r`Gas conducts heat about 40 times worse than glass. The gap is kept thin (about 1–2 cm) so the gas can't set up strong convection currents. Many windows also add a thin coating that reflects infrared, cutting radiation losses too.`,
            },
            {
              type: 'numeric',
              title: 'Heat through a wall',
              prompt: r`A wall of area 10 m² has a U-value of 0.3 W/(m²·K). How much heat does it lose when it is 20 °C warmer inside than out, in watts?`,
              unit: 'W',
              answer: 60,
              explain: r`$0.3 \times 10 \times 20 = 60$ W. U-values add up the effect of all the layers; modern regulations require low values (around 0.2–0.3) for new walls.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Layers add up',
              prompt: r`Thermal resistances in layers add. A wall has a brick layer with $R = 0.5$ m²K/W and insulation with $R = 2.0$. Its U-value is $U = 1/R_\text{total}$. What is $U$, in W/(m²·K)?`,
              unit: 'W/(m²K)',
              answer: 1 / 2.5,
              tol: 0.005,
              wrong: [{ v: 2.5, why: r`That’s the total resistance. The U-value is its reciprocal.` }],
              explain: r`$R_\text{total} = 2.5$, so $U = 0.4$ W/(m²·K): each square metre loses 0.4 W per degree of temperature difference. Adding the insulation cut the heat loss fivefold compared with bare brick ($U = 2$).`,
            },
          ],
          recap: [
            r`Thermal resistance $R = d/(kA)$. Layers in series add.`,
            'Insulators trap still air or gas, which conducts very poorly.',
            'The first layer of insulation gives the biggest benefit.',
          ],
        },
        {
          id: 'convection-radiation',
          title: 'Convection & Radiation',
          summary: 'Breezes, frost and colour',
          icon: 'sun',
          steps: [
            {
              type: 'mcq',
              title: 'Sea breezes',
              prompt: r`On a sunny day at the beach, the land heats up faster than the sea. Which way does the breeze blow during the afternoon?`,
              choices: [
                { t: 'From the sea toward the land', ok: true },
                { t: 'From the land toward the sea', why: 'That’s the night-time land breeze, when the land cools faster than the sea.' },
                { t: 'There’s no breeze', why: 'The temperature difference drives a convection current.' },
              ],
              explain: r`Air over the hot land warms and rises, and cooler air from over the sea flows in to replace it: a **sea breeze**. At night the land cools faster, and the circulation reverses. It's a convection cell on the scale of kilometres.`,
            },
            {
              type: 'mcq',
              title: 'Frost on clear nights',
              prompt: r`Why does frost form more easily on clear nights than on cloudy ones, even at the same air temperature?`,
              choices: [
                { t: 'Surfaces radiate heat straight to the cold sky; clouds would radiate some back', ok: true },
                { t: 'Clouds produce heat', why: 'Clouds don’t generate heat, but they absorb and re-emit infrared back down.' },
                { t: 'Cold air sinks from space', why: 'The effect is radiative: surfaces lose heat by radiation to a clear, cold sky.' },
              ],
              explain: r`A car roof or a blade of grass radiates infrared upwards all night. Under a clear sky, very little comes back from the cold upper atmosphere, so surfaces can cool below the air temperature and frost forms. Clouds act like a blanket, sending infrared back down.`,
            },
            {
              type: 'numeric',
              title: 'Losing heat to the sky',
              prompt: r`On a clear night, a car roof at 280 K radiates upwards, while the clear sky sends back only as much as a surface at about 250 K would. Using $P = \sigma (T^4 - T_{\text{sky}}^4)$ with $\sigma = 5.67 \times 10^{-8}$ W/(m²K⁴), what is the net loss per square metre? (Nearest 10 W.)`,
              unit: 'W/m²',
              answer: SIGMA * (280 ** 4 - 250 ** 4),
              tol: 6,
              wrong: [{ v: SIGMA * 280 ** 4, tol: 6, why: 'That ignores the radiation coming back down from the sky. Use T⁴ − T_sky⁴.' }],
              explain: r`$5.67 \times 10^{-8} \times (280^4 - 250^4) \approx 130$ W/m², enough to chill the roof below the air temperature, so frost forms on it first. A cloud layer near 275 K would cut the loss to about 25 W/m², which is why cloudy nights stay frost-free.`,
            },
            {
              type: 'mcq',
              title: 'Painting a house',
              prompt: r`In a hot sunny climate, which colour roof keeps a house coolest?`,
              cols: 2,
              choices: [
                { t: 'White', ok: true },
                { t: 'Black', why: 'Black absorbs most of the sunlight that hits it, heating the roof.' },
              ],
              explain: r`White reflects most visible sunlight, so less is absorbed. That's why buildings around the Mediterranean are often whitewashed. Researchers have even made "super-white" paints that reflect about 98% of sunlight and radiate heat away through the clear sky, cooling surfaces below air temperature even in direct sun.`,
            },
            {
              type: 'interactive',
              title: 'The colour of hot things',
              body: r`A hot object’s glow peaks at a wavelength $\lambda_{\max} = \frac{2898\ \mu\text{m·K}}{T}$ (Wien’s law). Find the surface temperature that puts the peak at **0.30 µm**, in the ultraviolet, just beyond violet.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3, ymin: 0, ymax: 1.15, grid: false, height: 260, axes: { xlabel: 'wavelength (µm)', ylabel: 'brightness (scaled to peak)', xticks: 0.5, yticks: 0.25 },
                params: { T: { min: 2500, max: 12000, step: 10, value: 3000, label: 'temperature', color: 'coral', format: (v) => `${v} K` } },
                curves: [{ f: (x, p) => { const B = (l) => 1 / (l ** 5 * (Math.exp(14388 / (l * p.T)) - 1)); return B(x) / B(2897.8 / p.T); }, color: 'violet', width: 3, from: 0.05 }],
                under: ({ plot, s }) => [s('rect', { x: plot.X(0.38), y: plot.Y(1.15), width: plot.X(0.75) - plot.X(0.38), height: plot.Y(0) - plot.Y(1.15), class: 'fl-amber-soft', opacity: 0.6 })],
                extra: ({ plot, s }) => [s('text', { x: plot.X(0.565), y: plot.Y(0) - 8, 'text-anchor': 'middle', class: 'lbl halo-text', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-2)', text: 'visible' })],
                readout: (p) => `peak at **${(2897.8 / p.T).toFixed(3)} µm** ${2897.8 / p.T < 0.38 ? '(ultraviolet)' : 2897.8 / p.T > 0.75 ? '(infrared)' : '(visible)'}`,
                goal: (p) => Math.abs(2897.8 / p.T - 0.3) < 0.003,
                hint: 'T = 2898 / 0.30 kelvin.',
                solution: { T: 9660 },
              },
              explain: r`About **9,700 K**, like the bright star Vega. Its peak is invisible ultraviolet, yet its spectrum still pours out plenty of blue light, so it looks blue-white. Cooler objects peak at longer wavelengths: the Sun (5,800 K) in the green, a filament bulb (3,000 K) in the infrared.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A glowing stove ring',
              prompt: r`Wien’s law gives a body’s peak emission wavelength as $\lambda = \frac{2898\ \mu\text{m·K}}{T}$. An electric stove ring glows dull red at about 900 K. Where does its glow peak? (1 decimal place, in micrometres.)`,
              unit: 'µm',
              answer: 2898 / 900,
              tol: 0.06,
              explain: r`$\frac{2898}{900} \approx 3.2\ \mu$m, in the infrared. Only the faint short-wavelength tail of its spectrum reaches visible red; nearly all the heat you feel from it is invisible.`,
            },
          ],
          recap: [
            'Convection drives sea breezes, weather and ocean currents.',
            'Surfaces radiate heat to the sky. Clouds send some back.',
            'Light colours reflect sunlight and stay cooler.',
          ],
        },
      ],
    },
    {
      title: 'Temperature’s Effects',
      summary: 'Glowing hot and growing longer.',
      lessons: [
        {
          id: 'glow',
          title: 'Glowing Hot',
          summary: 'The colours of hot things',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Blackbody radiation',
              body: r`Everything gives off electromagnetic radiation according to its temperature. A perfect emitter (a "blackbody") radiates a total power per square metre of $\sigma T^4$ (the **Stefan–Boltzmann law**), with a spectrum that peaks at a wavelength
$$\lambda_{\text{peak}} = \frac{2.9 \times 10^{-3}\ \text{m·K}}{T}$$
(**Wien's law**). Hotter objects glow brighter and bluer: a stove ring glows dull red, a lamp filament yellowish-white.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Match the Sun',
              prompt: r`Sunlight peaks around **500 nm**, in the blue-green. Find the temperature whose blackbody spectrum peaks there.`,
              widget: {
                kind: 'graph', xmin: 100, xmax: 2000, ymin: 0, ymax: 1.1, grid: 200, gridY: 0.25, height: 260, axes: { xlabel: 'wavelength (nm)', ylabel: 'brightness (scaled)', yfmt: () => '', xAt: 100 },
                params: { T: { min: 2000, max: 9000, step: 10, value: 3500, label: 'temperature', color: 'coral', format: (v) => `${v} K` } },
                curves: [{ f: (x, p) => planck(x, p.T) / planck(wienPeak(p.T), p.T), color: 'coral', width: 3 }],
                under: ({ plot, s }) => [s('rect', { x: plot.X(400), y: plot.Y(1.1), width: plot.X(700) - plot.X(400), height: plot.Y(0) - plot.Y(1.1), class: 'fl-amber-soft', opacity: 0.6 })],
                extra: ({ plot, s }) => [s('text', { x: plot.X(550), y: plot.Y(0) - 8, 'text-anchor': 'middle', class: 'lbl halo-text', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'visible' })],
                readout: (p) => r`${p.T} K: peak at $\frac{2.898 \times 10^{-3}}{${p.T}} = ${wienPeak(p.T).toFixed(0)}$ nm`,
                goal: (p) => Math.abs(wienPeak(p.T) - 500) < 2,
                hint: r`$T = \frac{2.898 \times 10^{-3}}{500 \times 10^{-9}}$.`,
                solution: { T: 5800 },
              },
              explain: r`About **5,800 K**, the temperature of the Sun's surface. Astronomers find star temperatures this way: red stars like Betelgeuse are about 3,500 K, blue-white stars like Rigel over 10,000 K. A 2,700 K incandescent bulb peaks in the infrared, which is why it wastes most of its energy as heat.`,
            },
            {
              type: 'numeric',
              title: 'Your infrared glow',
              prompt: r`At what wavelength does your skin (about 306 K) radiate most strongly? Give it in micrometres. (1 decimal place.)`,
              unit: 'µm',
              answer: 2.898e-3 / 306 * 1e6,
              tol: 0.05,
              wrong: [{ v: 2.898e-3 / 306 * 1e9, relTol: 0.01, why: 'That’s in nanometres; convert to micrometres.' }],
              explain: r`$\frac{2.898 \times 10^{-3}}{306} \approx 9.5\ \mu$m, deep in the infrared. Thermal cameras are tuned to 8–14 µm, which is why they see people glowing in the dark.`,
            },
            {
              type: 'numeric',
              title: 'Twice as hot',
              prompt: r`If an object's absolute temperature doubles, by what factor does its total radiated power increase?`,
              unit: '×',
              answer: 16,
              wrong: [{ v: 2, why: r`Power goes as $T^4$.` }, { v: 4, why: r`It's the fourth power: $2^4$.` }],
              explain: r`$2^4 = 16$. This steep dependence is why a light bulb's filament, at 2,700 K, outshines a stove ring at 900 K by about 80 times per square centimetre.`,
            },
            {
              type: 'numeric',
              title: 'A filament’s peak',
              prompt: r`A tungsten filament runs at about 3,000 K. Where does its glow peak, by Wien’s law $\lambda_{\max} = \frac{2898\ \mu\text{m·K}}{T}$? (2 decimal places, in µm.)`,
              unit: 'µm',
              answer: 2898 / 3000,
              tol: 0.01,
              explain: r`About 0.97 µm, in the infrared. Most of a filament bulb’s output is invisible heat, which is why LEDs, which emit only visible light, use a fraction of the power.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Red hot, white hot',
              prompt: r`Heating a poker, it glows dull red at about 800 °C, then orange, then yellowish-white at 1,300 °C. Why doesn't it ever look green?`,
              choices: [
                { t: 'When the peak is in the green, the spectrum still spreads across all visible colours, which together look white', ok: true },
                { t: 'Metals can’t emit green light', why: 'They emit a broad spectrum including green; the mix just never looks green.' },
                { t: 'It would need to be colder', why: 'Colder objects peak further into the red and infrared.' },
              ],
              explain: r`A blackbody spectrum is broad. Peaking at 500 nm (like the Sun) means plenty of red and blue too, so it looks white. There are no green stars for the same reason.`,
            },
          ],
          recap: [
            r`Stefan–Boltzmann: power $\propto T^4$; Wien: $\lambda_{\text{peak}} = 2.9 \times 10^{-3}/T$.`,
            'The Sun’s 5,800 K surface peaks in visible light; people peak near 10 µm.',
            'Hot objects go from red to white as they heat up.',
          ],
        },
        {
          id: 'expansion',
          title: 'Thermal Expansion',
          summary: 'Why bridges have gaps',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Growing with heat',
              body: r`Heat makes atoms jiggle more and push slightly further apart, so most materials **expand** when warmed. A bar of length $L$ grows by
$$\Delta L = \alpha L\,\Delta T$$
where $\alpha$ is the coefficient of linear expansion: about $12 \times 10^{-6}$ per kelvin for steel and iron, $23 \times 10^{-6}$ for aluminium, and almost zero for some special glasses.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A growing tower',
              prompt: r`The Eiffel Tower is about 300 m of iron ($\alpha = 12 \times 10^{-6}$ per K). Find the temperature rise that makes it **15 cm** taller.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 25, grid: 10, gridY: 5, height: 250, axes: { xlabel: 'temperature rise (K)', ylabel: 'height gain (cm)' },
                params: { dT: { min: 1, max: 60, step: 0.5, value: 20, slider: false } },
                curves: [{ f: (x) => towerGrowth(x), color: 'coral', width: 3 }, { f: () => 15, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.dT, y: (p) => towerGrowth(p.dT), drag: { x: 'dT' }, color: 'violet' }],
                readout: (p) => r`$\Delta T = ${fix(p.dT, 1)}$ K: $\Delta L = 12 \times 10^{-6} \times 300 \times ${fix(p.dT, 1)} = ${towerGrowth(p.dT).toFixed(1)}$ cm`,
                goal: (p) => Math.abs(towerGrowth(p.dT) - 15) < 0.2,
                hint: r`$\Delta T = \frac{0.15}{12 \times 10^{-6} \times 300}$.`,
                solution: { dT: 41.5 },
              },
              explain: r`$\Delta T \approx 42$ K. Between a cold winter night and a hot summer day (with sunlit iron getting much hotter than the air), the tower really does change height by around 15 cm. On sunny days it also leans slightly away from the Sun, as its sunlit side expands more.`,
            },
            {
              type: 'numeric',
              title: 'Rail gaps',
              prompt: r`A 25 m steel rail ($\alpha = 12 \times 10^{-6}$ per K) is laid when the temperature is 10 °C. How much longer is it at 40 °C, in millimetres?`,
              unit: 'mm',
              answer: 12e-6 * 25 * 30 * 1000,
              tol: 0.05,
              wrong: [{ v: 12e-6 * 25 * 30, tol: 0.0001, why: 'That’s in metres; convert to millimetres.' }],
              explain: r`$12 \times 10^{-6} \times 25 \times 30 = 0.009$ m $= 9$ mm. Old railways left gaps between rails (the clickety-clack sound). Modern continuous welded rail is stretched when laid, so it doesn't buckle in heatwaves.`,
            },
            {
              type: 'mcq',
              title: 'Bimetallic strips',
              prompt: r`A strip of brass bonded to a strip of steel bends when heated. Why?`,
              choices: [
                { t: 'Brass expands more than steel, so the strip curls with brass on the outside of the curve', ok: true },
                { t: 'The metals melt slightly', why: 'No melting is needed: unequal expansion bends the strip.' },
                { t: 'Heat makes metals magnetic', why: 'The bending is purely from different expansion rates.' },
              ],
              explain: r`The longer brass ends up on the outside of a curve. Old thermostats used coiled bimetallic strips to open and close a switch, and kettles still use bimetallic discs that snap when they get hot.`,
            },
            {
              type: 'numeric',
              title: 'A growing bridge',
              prompt: r`Steel expands by about $12 \times 10^{-6}$ of its length per kelvin. How much longer is a 500 m steel bridge on a day 40 °C warmer, in centimetres?`,
              unit: 'cm',
              answer: 500 * 12e-6 * 40 * 100,
              tol: 0.1,
              explain: r`$500 \times 12 \times 10^{-6} \times 40 = 0.24$ m $= 24$ cm. Bridges sit on rollers and have expansion joints, the toothed gaps you drive over, to cope.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Water is weird',
              prompt: r`Water contracts as it cools, but only down to 4 °C; below that it expands, and ice is less dense than water. What does this mean for lakes in winter?`,
              choices: [
                { t: 'The densest 4 °C water sinks to the bottom while ice forms on top, so lakes freeze from the top down and fish survive below', ok: true },
                { t: 'Lakes freeze solid from the bottom up', why: 'Ice floats, and the coldest water stays at the top.' },
                { t: 'Lakes never freeze', why: 'The surface does freeze, but the ice insulates the water below.' },
              ],
              explain: r`If ice sank, lakes and seas could freeze solid from the bottom, with dramatic consequences for life. Water's density maximum at 4 °C comes from hydrogen bonds forming an open, ice-like structure as it nears freezing.`,
            },
          ],
          recap: [
            r`Linear expansion: $\Delta L = \alpha L \Delta T$.`,
            'Structures need gaps or pre-stressing to cope with expansion.',
            'Water is unusual: densest at 4 °C, and ice floats.',
          ],
        },
        {
          id: 'cooling',
          title: 'Cooling a Cup of Coffee',
          summary: 'Newton’s law of cooling',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'The bigger the gap, the faster',
              body: r`A hot drink loses heat faster the hotter it is compared with the room. Newton proposed that the rate of cooling is proportional to the temperature difference. That makes the difference shrink exponentially:
$$T(t) = T_{\text{room}} + (T_0 - T_{\text{room}})\,e^{-kt},$$
where $k$ depends on the cup (its size, material, whether it has a lid…).`,
            },
            {
              type: 'numeric',
              title: 'Ten minutes later',
              prompt: r`Coffee starts at 90 °C in a 20 °C room, with $k = 0.05$ per minute. What is its temperature after 10 minutes? (1 decimal place.)`,
              unit: '°C',
              answer: 20 + 70 * Math.exp(-0.5),
              tol: 0.1,
              explain: r`$20 + 70e^{-0.5} = 20 + 70 \times 0.607 \approx 62.5$ °C. The 70-degree gap shrank to about 42.5 degrees.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Ready to drink',
              prompt: r`Coffee is comfortable to drink at about **60 °C**. Find when this cup gets there.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 15, ymax: 95, grid: false, height: 260, axes: { xlabel: 'minutes', ylabel: 'temperature (°C)', xticks: 10, yticks: 10, yAt: 15 },
                params: { t: { min: 0, max: 60, step: 0.05, value: 5, label: 'time', color: 'coral', format: (v) => `${v.toFixed(2)} min` } },
                curves: [{ f: (x) => 20 + 70 * Math.exp(-0.05 * x), color: 'violet', width: 3 }, { f: () => 60, color: 'teal', dash: true }, { f: () => 20, color: 'muted', dash: true }],
                points: [{ x: (p) => p.t, y: (p) => 20 + 70 * Math.exp(-0.05 * p.t), color: 'coral' }],
                readout: (p) => `coffee at **${(20 + 70 * Math.exp(-0.05 * p.t)).toFixed(1)} °C** · cooling at ${(0.05 * 70 * Math.exp(-0.05 * p.t)).toFixed(2)} °C per minute`,
                goal: (p) => Math.abs(20 + 70 * Math.exp(-0.05 * p.t) - 60) < 0.1,
                hint: r`Solve $70e^{-0.05t} = 40$, so $t = 20\ln\frac{70}{40}$.`,
                solution: { t: 11.19 },
              },
              explain: r`$t = 20 \ln 1.75 \approx 11.2$ minutes. Notice how the cooling rate falls as the coffee approaches room temperature: 3.5 °C per minute at the start, 2 °C per minute at 60 °C.`,
            },
            {
              type: 'mcq',
              title: 'Milk now or later?',
              prompt: r`You want your coffee as cool as possible in 10 minutes’ time, and you will add some cold milk. Should you add it straight away or just before drinking?`,
              choices: [
                { t: 'Just before drinking: hotter coffee loses heat faster in the meantime', ok: true },
                { t: 'Straight away: the milk starts cooling it sooner', why: 'Adding milk early lowers the temperature gap with the room, so the coffee then cools more slowly.' },
                { t: 'It makes no difference', why: 'It does, because the cooling rate depends on the temperature difference.' },
              ],
              explain: r`Keeping the coffee hot while it waits means it sheds heat faster (bigger gap with the room). Adding the milk at the end then gives the same drop it would have given at the start. (If you want it to stay **hot**, add the milk first.)`,
            },
            {
              type: 'numeric',
              title: 'Check the milk',
              prompt: r`Mixing 4 parts of coffee with 1 part of milk at 5 °C gives the average temperature (weighted 4 : 1). If the coffee waited 10 minutes first (reaching 62.46 °C), what is the temperature after adding the milk? (1 decimal place.)`,
              unit: '°C',
              answer: (4 * (20 + 70 * Math.exp(-0.5)) + 5) / 5,
              tol: 0.1,
              explain: r`$\frac{4 \times 62.46 + 5}{5} \approx 51.0$ °C. Adding the milk first (to get 73 °C) and then waiting 10 minutes gives $20 + 53e^{-0.5} \approx 52.1$ °C: about a degree warmer.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Halving the gap',
              prompt: r`Tea cools from 80 °C to 50 °C in 15 minutes in a 20 °C room. How many minutes (from the start) until it reaches 35 °C?`,
              unit: 'min',
              answer: 30,
              tol: 0.2,
              wrong: [{ v: 22.5, why: 'Think in terms of the gap above room temperature: 60 → 30 → 15.' }],
              explain: r`The gap above room temperature went from 60 to 30 degrees: it halves every 15 minutes. Reaching 35 °C means a gap of 15, two halvings: **30 minutes**. Exponential decay always has a fixed "half-life".`,
            },
          ],
          recap: [
            'Cooling rate is proportional to the temperature difference with the surroundings.',
            r`So the difference decays exponentially: $T = T_{\text{room}} + (T_0 - T_{\text{room}})e^{-kt}$.`,
            'To cool a drink fastest, add cold milk at the end.',
          ],
        },
      ],
    },
  ],
};
