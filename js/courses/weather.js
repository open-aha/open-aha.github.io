import { fix } from '../lib/svg.js';

const r = String.raw;
const H = 8; // scale height, km
const es = (T) => 6.1094 * Math.exp((17.625 * T) / (T + 243.04)); // saturation vapour pressure, hPa
const E_AIR = 14; // vapour pressure of our air parcel, hPa

const updraft = (cape) => Math.sqrt(2 * cape); // m/s, ideal
const hurricaneWind = (dp) => 7 * Math.sqrt(dp); // rough rule of thumb, dp in hPa

// a parcel of air starting at rest, pushed towards low pressure (north) and turned by the Coriolis effect
const GEO = (() => {
  const f = 1, G = 1, lam = 0.15, dt = 0.01, out = [];
  let x = 0, y = 0, u = 0, w = 0;
  for (let i = 0; i <= 2600; i++) {
    out.push([x, y, u, w]);
    const du = f * w - lam * (u - G / f), dw = G - f * u - lam * w; // the loops slowly die away
    u += du * dt; w += dw * dt; x += u * dt; y += w * dt;
  }
  return out;
})();

export default {
  id: 'weather',
  subject: 'physics',
  title: 'Weather & the Atmosphere',
  level: 'Intermediate',
  cover: 'weather',
  tagline: 'Why mountains are cold, where clouds begin, and what makes the wind blow.',
  description: r`Weather is physics in action. Find out why air thins exponentially with height, why rising air cools by almost 10 °C per kilometre, how the dew point predicts the height of clouds, how pressure differences and the Earth's spin drive the winds, and what powers thunderstorms and hurricanes.`,
  prereq: 'Heat & Thermodynamics',
  chapters: [
    {
      title: 'The Air Above',
      summary: 'Pressure and temperature with height.',
      lessons: [
        {
          id: 'pressure',
          title: 'Thinning Air',
          summary: 'Exponential pressure',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              title: 'A pile of air',
              body: r`Air pressure at any height is the weight of all the air above it, per square metre. Climb higher and there's less air above you, so the pressure drops.

But air is **compressible**: the lower layers are squashed by the weight above, so they're denser. Each layer's density is proportional to its pressure, and that makes pressure fall off **exponentially** with height $h$:
$$P = P_0\, e^{-h/H}$$
The **scale height** $H$ is about 8 km for Earth's atmosphere.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Half an atmosphere',
              prompt: r`Drag the altitude marker to the height where the air pressure is **half** its sea-level value (101 kPa).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 110, grid: 5, gridY: 25, height: 300, padL: 52,
                axes: { xlabel: 'altitude (km)', ylabel: 'pressure (kPa)' },
                params: { h: { min: 0, max: 20, step: 0.1, value: 2, slider: false } },
                curves: [{ f: (x) => 101 * Math.exp(-x / H), color: 'blue', width: 3 }],
                points: [{ x: (p) => p.h, y: (p) => 101 * Math.exp(-p.h / H), drag: { x: 'h' }, color: 'coral' }],
                extra: ({ plot, p, s }) => {
                  const y = 101 * Math.exp(-p.h / H);
                  const marks = [[8.85, 'Everest'], [11, 'airliner']];
                  return [
                    s('line', { x1: plot.X(p.h), x2: plot.X(p.h), y1: plot.Y(0), y2: plot.Y(y), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
                    s('line', { x1: plot.X(0), x2: plot.X(20), y1: plot.Y(50.5), y2: plot.Y(50.5), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 6' }),
                    ...marks.flatMap(([x, t]) => [
                      s('circle', { cx: plot.X(x), cy: plot.Y(101 * Math.exp(-x / H)), r: 4, class: 'fl-ink' }),
                      s('text', { x: plot.X(x) + 6, y: plot.Y(101 * Math.exp(-x / H)) - 10, class: 'tick', text: t }),
                    ]),
                  ];
                },
                readout: (p) => r`at ${p.h.toFixed(1)} km: $P = 101\,e^{-${p.h.toFixed(1)}/8} = ${(101 * Math.exp(-p.h / H)).toFixed(1)}$ kPa`,
                goal: (p) => Math.abs(101 * Math.exp(-p.h / H) - 50.5) < 0.8,
                hint: r`Solve $e^{-h/8} = \frac12$: $h = 8 \ln 2$.`,
                solution: { h: 5.5 },
              },
              explain: r`$h = 8 \ln 2 \approx 5.5$ km. Half of all the air in the atmosphere is below 5.5 km, and every further 5.5 km halves the pressure again. At an airliner's cruising height, about three-quarters of the atmosphere lies beneath you.`,
            },
            {
              type: 'numeric',
              title: 'The top of the world',
              prompt: r`Using $H = 8$ km, what fraction of sea-level pressure is there at the summit of Everest (8.85 km)? (2 decimal places.)`,
              answer: Math.exp(-8.85 / H),
              tol: 0.006,
              wrong: [{ v: 1 - 8.85 / H, tol: 0.01, why: 'Pressure falls exponentially, not in a straight line.' }],
              explain: r`$e^{-8.85/8} \approx 0.33$: about a third of the oxygen in every breath. Climbers above 8,000 m enter the "death zone", where the body can't acclimatise. Reinhold Messner and Peter Habeler first climbed Everest without bottled oxygen in 1978.`,
            },
            {
              type: 'numeric',
              title: 'Ninety per cent below',
              prompt: r`With $P = P_0 e^{-h/8\,\text{km}}$, at what height is the pressure only **10%** of its sea-level value? (In km, 1 decimal place.)`,
              unit: 'km',
              answer: 8 * Math.log(10),
              tol: 0.06,
              wrong: [{ v: 72, tol: 0.5, why: r`Pressure falls exponentially, not linearly. Solve $e^{-h/8} = 0.1$, so $h = 8\ln 10$.` }],
              explain: r`$h = 8 \ln 10 \approx 18.4$ km. Nine-tenths of all the air in the atmosphere lies below that height, roughly twice the height of Everest. Spy planes and weather balloons above it are flying through a thin wisp of the atmosphere.`,
            },
            {
              type: 'numeric',
              title: 'At cruising altitude',
              prompt: r`Pressure falls roughly as $e^{-h/8\,\text{km}}$. Airliners cruise at about 11 km. What percentage of sea-level pressure is left there? (Nearest whole number.)`,
              unit: '%',
              answer: 100 * Math.exp(-11 / 8),
              tol: 0.6,
              explain: r`$e^{-11/8} \approx 25\%$. That’s why cabins are pressurised (to the equivalent of about 2 km altitude) and why oxygen masks drop if the pressure is lost.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Tea on Everest',
              prompt: r`On the summit of Everest, water boils at about 70 °C. Why?`,
              choices: [
                { t: 'Boiling happens when the vapour pressure equals the air pressure; with only a third of the pressure, a lower temperature is enough', ok: true },
                { t: 'The cold air steals the heat', why: 'Cold air slows heating, but the boiling point itself drops because of the low pressure.' },
                { t: 'Water is different up there', why: 'It’s the same water; the surrounding pressure sets the boiling point.' },
              ],
              explain: r`Bubbles of vapour can only form when the water's vapour pressure matches the pressure pushing down on it. At a third of an atmosphere, that happens near 70 °C, too cool for a proper cup of tea or to cook pasta quickly. Pressure cookers do the opposite, raising the boiling point to about 120 °C.`,
            },
          ],
          recap: [
            'Pressure is the weight of the air above.',
            r`It falls exponentially: $P = P_0 e^{-h/H}$, with $H \approx 8$ km.`,
            'Pressure halves roughly every 5.5 km.',
          ],
        },
        {
          id: 'lapse',
          title: 'Why Mountains Are Cold',
          summary: 'Rising air cools',
          icon: 'down',
          steps: [
            {
              type: 'mcq',
              title: 'Closer to the Sun?',
              prompt: r`Mountaintops are closer to the Sun, yet colder than the valleys. What's the main reason?`,
              choices: [
                { t: 'Rising air expands as the pressure drops, and expanding gas cools', ok: true },
                { t: 'Sunlight is weaker at altitude', why: 'Sunlight is actually stronger at altitude (less air to pass through). The cooling comes from expansion.' },
                { t: 'Cold air rises', why: 'It’s warm air that rises. As it rises, it expands and cools.' },
              ],
              explain: r`The air is heated mainly from below, by the ground. When a pocket of air rises, the surrounding pressure falls, so the air expands, pushing its surroundings away. That takes energy, which comes from the air's own thermal energy, so it cools. A process with no heat exchange like this is called **adiabatic**.`,
            },
            {
              type: 'explain',
              title: 'The lapse rate',
              body: r`For dry air, the cooling rate works out as $\frac{g}{c_p}$, where $c_p \approx 1005$ J/(kg·K) is the specific heat of air:
$$\frac{9.8 \text{ m/s}^2}{1005 \text{ J/(kg·K)}} \approx 9.8 \text{ °C per km}$$
This is the **dry adiabatic lapse rate**. Sinking air warms up at the same rate. The real atmosphere averages about **6.5 °C per km**, because moisture and mixing complicate things.`,
            },
            {
              type: 'numeric',
              title: 'A rising parcel',
              prompt: r`Dry air at 25 °C rises 2 km up a mountainside. What is its temperature at the top? (Use 9.8 °C per km.)`,
              unit: '°C',
              answer: 25 - 19.6,
              tol: 0.1,
              wrong: [{ v: 15.2, tol: 0.1, why: 'That’s for 1 km. It rose 2 km.' }, { v: 44.6, tol: 0.1, why: 'Rising air cools; it doesn’t warm.' }],
              explain: r`$25 - 2 \times 9.8 = 5.4$ °C. Plenty of mountains in the tropics have snow on top for exactly this reason: Kilimanjaro's summit, almost 6 km high, sits just south of the equator.`,
            },
            {
              type: 'numeric',
              title: 'Warming as it sinks',
              prompt: r`Sinking dry air is squeezed and warms by about 9.8 °C per kilometre. Air at −10 °C, 3 km up, sinks to sea level without gaining or losing heat. What is its temperature there? (1 decimal place.)`,
              unit: '°C',
              answer: -10 + 3 * 9.8,
              tol: 0.05,
              wrong: [{ v: -10 - 3 * 9.8, tol: 0.1, why: 'Sinking air is compressed, so it warms up rather than cooling.' }],
              explain: r`$-10 + 29.4 = 19.4$ °C. No heat needs to flow in: compression alone warms it. That's why air sinking under a high-pressure system is warm and dry, and why winds blowing down mountainsides (Chinook and Foehn winds) feel so warm.`,
            },
            {
              type: 'interactive',
              title: 'Making a warm wind',
              body: r`Air at 20 °C is pushed over a mountain. Rising dry air cools 9.8 °C per km; above the cloud base (1 km here) condensation releases heat, so it cools only about 6 °C per km. On the far side it descends dry, warming 9.8 °C per km. Find the mountain height that delivers **30 °C** air to the far valley.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, height: 280, axes: { ylabel: 'height (km)', yticks: 1, xticks: 20 },
                params: { H: { min: 1, max: 4.5, step: 0.01, value: 2, label: 'mountain height', color: 'amber', format: (v) => `${v.toFixed(2)} km` } },
                extra: ({ plot, p, s }) => { const Ts = 20 - 9.8 - 6 * (p.H - 1), Tl = Ts + 9.8 * p.H, T = (x, y, t, c) => s('text', { x: plot.X(x), y: plot.Y(y), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: c, text: t }); return [s('path', { d: `M${plot.X(1)} ${plot.Y(0)} L${plot.X(5)} ${plot.Y(p.H)} L${plot.X(9)} ${plot.Y(0)} Z`, class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 }), s('rect', { x: plot.X(1 + 4 / p.H), y: plot.Y(p.H + 0.3), width: plot.X(5) - plot.X(1 + 4 / p.H), height: plot.Y(1) - plot.Y(p.H + 0.3), rx: 12, class: 'fl-muted', opacity: 0.35 }), T(0.8, 0.25, '20.0 °C', 'var(--blue)'), T(2.2, 1.15, `${(20 - 9.8).toFixed(1)} °C`, 'var(--blue)'), T(5, p.H + 0.45, `${Ts.toFixed(1)} °C`, 'var(--ink-2)'), T(9.2, 0.25, `${Tl.toFixed(1)} °C`, 'var(--coral)')]; },
                readout: (p) => { const Ts = 20 - 9.8 - 6 * (p.H - 1); return `summit **${Ts.toFixed(1)} °C** · far valley **${(Ts + 9.8 * p.H).toFixed(1)} °C**`; },
                goal: (p) => Math.abs(20 - 9.8 - 6 * (p.H - 1) + 9.8 * p.H - 30) < 0.1,
                hint: 'Each km climbed in cloud gains a net 9.8 − 6 = 3.8 °C by the time the air is back down.',
                solution: { H: 3.63 },
              },
              explain: r`The net gain is $3.8$ °C for every km of cloudy climb, so you need $10/3.8 \approx 2.6$ km above the cloud base: a **3.6 km** mountain. The moisture rained out on the windward side leaves the air warmer and drier: this is the foehn (or chinook) wind.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The snow-eater',
              prompt: r`Moist air rises over a mountain range. As it cools, its water vapour condenses into cloud and rain, releasing heat, so it cools at only about 5 °C per km on the way up. On the far side it descends as dry air. What happens?`,
              choices: [
                { t: 'It warms at 9.8 °C per km on the way down, arriving warmer and drier than it started', ok: true },
                { t: 'It arrives at exactly its starting temperature', why: 'It cooled slowly going up (condensation released heat) but warms quickly going down, so it ends warmer.' },
                { t: 'It arrives colder, because mountains are cold', why: 'Descending air is compressed and warms.' },
              ],
              explain: r`Up 3 km at 5 °C/km and down 3 km at 9.8 °C/km gives a net warming of about 14 °C. These warm, dry winds are called **föhn** winds in the Alps and **chinooks** in the Rockies, where they can raise temperatures by 20 °C in hours and melt snow so fast that "chinook" is sometimes translated as "snow-eater".`,
            },
          ],
          recap: [
            'Rising air expands and cools adiabatically.',
            r`Dry adiabatic lapse rate: $g/c_p \approx 9.8$ °C per km.`,
            'Condensation slows cooling, which leads to warm föhn winds on the lee side of mountains.',
          ],
        },
      ],
    },
    {
      title: 'Clouds & Wind',
      summary: 'Water vapour and moving air.',
      lessons: [
        {
          id: 'clouds',
          title: 'Dew Point & Clouds',
          summary: 'When vapour condenses',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Saturation',
              body: r`Water molecules are constantly escaping from liquid water and returning to it. When the two rates balance, the air is **saturated**. The vapour pressure at saturation depends strongly on temperature: it rises by about 7% per °C, roughly **doubling** every 10 °C.

**Relative humidity** compares the actual vapour pressure with the saturation value at the current temperature. If air is cooled without changing its water content, the relative humidity rises until it hits 100% at the **dew point**. Below that, vapour condenses into dew, fog or cloud.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Find the dew point',
              prompt: r`A pocket of air at 25 °C has a vapour pressure of 14 hPa (the dashed line). Cool it down until it becomes saturated.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 35, ymin: 0, ymax: 60, grid: 5, gridY: 10, height: 300, padL: 48,
                axes: { xlabel: 'temperature (°C)', ylabel: 'vapour pressure (hPa)', xAt: -5 },
                params: { T: { min: -5, max: 30, step: 0.5, value: 25, label: 'air temperature', color: 'blue', format: (v) => `${fix(v, 1)} °C` } },
                curves: [{ f: (x) => es(x), color: 'violet', width: 3 }, { f: () => E_AIR, color: 'coral', dash: true }],
                points: [{ x: (p) => p.T, y: () => E_AIR, color: 'blue' }],
                readout: (p) => {
                  const rh = (100 * E_AIR) / es(p.T);
                  return rh >= 99 ? `relative humidity **100%**: saturated, condensation begins` : `saturation at ${fix(p.T, 1)} °C: ${es(p.T).toFixed(1)} hPa, relative humidity **${rh.toFixed(0)}%**`;
                },
                goal: (p) => Math.abs(p.T - 12) < 0.3,
                hint: 'Slide the blue dot left along the dashed line until it meets the violet saturation curve.',
                solution: { T: 12 },
              },
              explain: r`The dew point is **12 °C**: there, the saturation vapour pressure equals the 14 hPa actually present. At 25 °C, the same air has a relative humidity of only $14 / 31.6 \approx 44\%$. The same amount of water can feel dry or muggy depending on the temperature.`,
            },
            {
              type: 'numeric',
              title: 'Cloud base',
              prompt: r`Rising air cools at about 9.8 °C per km, while its dew point falls more slowly, by about 1.8 °C per km. So the gap between temperature and dew point closes at about 8 °C per km, which means cloud forms about **125 m higher for every 1 °C of gap** at the ground. If it's 20 °C with a dew point of 12 °C, at what height will cumulus clouds form?`,
              unit: 'm',
              answer: 1000,
              tol: 10,
              wrong: [{ v: 125, why: 'That’s for a 1 °C gap. Here the gap is 20 − 12 = 8 °C.' }, { v: 2500, why: 'Use the gap between temperature and dew point (8 °C), not the temperature itself.' }],
              explain: r`Gap $= 20 - 12 = 8$ °C, so the base is about $8 \times 125 = 1000$ m. That's why summer cumulus clouds have such flat bottoms: rising air everywhere reaches its dew point at the same height.`,
            },
            {
              type: 'mcq',
              title: 'Why rising air makes clouds',
              prompt: r`Why do clouds form when moist air rises?`,
              choices: [
                { t: r`It expands and cools until it can no longer hold all its water vapour, which condenses on tiny particles`, ok: true },
                { t: r`It gets closer to the cold upper atmosphere, which freezes it`, why: r`The cooling comes mostly from the air’s own expansion, not from contact with colder air.` },
                { t: r`The vapour is pushed together by higher pressure aloft`, why: r`Pressure is lower aloft. Lower pressure lets the air expand and cool.` },
              ],
              explain: r`Saturation vapour pressure drops steeply as temperature falls, so rising, cooling air reaches its dew point and droplets condense onto dust, salt and smoke particles (cloud condensation nuclei). Flat cloud bases mark the height where rising air hits its dew point.`,
            },
            {
              type: 'numeric',
              title: 'Warm air holds more',
              prompt: r`The amount of water vapour air can hold roughly doubles for every 10 °C of warming. About how many times more can air at 30 °C hold than air at 10 °C?`,
              answer: 4,
              explain: r`Two doublings: $2 \times 2 = 4$. That’s why tropical air brings such heavy rain, and why a warmer climate means more intense downpours (about 7% more moisture per degree).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Relative humidity',
              prompt: r`Air at 30 °C (saturation vapour pressure 42.4 hPa) holds water vapour at 21.2 hPa. What's its relative humidity?`,
              unit: '%',
              answer: 50,
              wrong: [{ v: 200, why: 'Divide the actual vapour pressure by the saturation value.' }],
              explain: r`$\frac{21.2}{42.4} = 50\%$. Since saturation pressure roughly doubles every 10 °C, the same air cooled to about 20 °C would be close to 100%: misty and damp. That's why mornings are dewy even after dry afternoons.`,
            },
          ],
          recap: [
            'Saturation vapour pressure roughly doubles every 10 °C.',
            'The dew point is the temperature where air becomes saturated.',
            'Cloud base is about 125 m per °C of gap between temperature and dew point.',
          ],
        },
        {
          id: 'wind',
          title: 'What Makes the Wind',
          summary: 'Pressure, heat and spin',
          icon: 'right',
          steps: [
            {
              type: 'mcq',
              title: 'The sea breeze',
              prompt: r`On a sunny day at the coast, a breeze blows from the sea onto the land in the afternoon. Why?`,
              choices: [
                { t: 'Land heats up faster than water; warm air rises over the land and cooler sea air flows in to replace it', ok: true },
                { t: 'The sea heats up faster and pushes air inland', why: 'Water has a high specific heat and mixes heat downwards, so it warms slowly. The land heats faster.' },
                { t: 'Tides push the air', why: 'Tides move water, not air. The breeze is driven by uneven heating.' },
              ],
              explain: r`Rising warm air over the land lowers the pressure near the ground; the higher-pressure air over the cool sea flows in. At night the land cools faster and the breeze often reverses: a **land breeze**. All wind comes from uneven heating producing pressure differences.`,
            },
            {
              type: 'numeric',
              title: 'Pushed by pressure',
              prompt: r`The pressure difference between two places 100 km apart is 1 hPa (100 Pa). For air of density 1.2 kg/m³, the acceleration is $a = \dfrac{\Delta P}{\rho\, \Delta x}$. If nothing else acted, how fast (in m/s) would the air be moving after one hour?`,
              unit: 'm/s',
              answer: (100 / (1.2 * 1e5)) * 3600,
              tol: 0.05,
              wrong: [{ v: 100 / (1.2 * 1e5), relTol: 0.05, why: 'That’s the acceleration in m/s². Multiply by the 3600 seconds in an hour.' }],
              explain: r`$a = \frac{100}{1.2 \times 10^5} \approx 8.3 \times 10^{-4}$ m/s², and after 3600 s the speed is $\approx 3$ m/s. A tiny pressure gradient, acting for hours, makes a real wind. But on large scales something else soon takes over…`,
            },
            {
              type: 'mcq',
              title: 'Along the isobars',
              prompt: r`On weather maps, large-scale winds blow almost **along** the lines of equal pressure (isobars), not straight from high to low pressure. Why?`,
              choices: [
                { t: 'The Coriolis effect deflects moving air until it balances the pressure force, so the wind flows parallel to the isobars', ok: true },
                { t: 'Mountains steer all winds', why: 'Mountains matter locally, but the pattern holds over open oceans too. It’s the Earth’s rotation.' },
                { t: 'Weather maps are drawn incorrectly', why: 'The maps are right: above the ground, winds really do follow the isobars.' },
              ],
              explain: r`Air starts flowing towards low pressure, but the Coriolis effect deflects it (to the right in the northern hemisphere) until the two forces balance. The result, called the **geostrophic wind**, flows along the isobars. That's Buys Ballot's law (1857): in the northern hemisphere, stand with your back to the wind and low pressure is on your **left**. Near the ground, friction lets the wind cross the isobars slightly towards the low.`,
            },
            { /*anim:weather*/
              type: 'explain',
              kicker: 'Explore',
              title: 'How the wind turns',
              body: r`A parcel of air starts at rest between a {blue:high} (south) and a {coral:low} (north) in the northern hemisphere. The pressure difference pushes it north; the Earth's spin deflects any moving air to the **right**. Follow its path.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 30, ymin: -0.9, ymax: 3.1, grid: false, axes: false, height: 260,
                animate: { param: 't', speed: 2.2, max: 27, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const k = Math.min(GEO.length - 1, Math.round(p.t / 0.01)), [x, y, u, w] = GEO[k], els = [];
                  [[-0.6, '1008 hPa'], [0.6, '1004 hPa'], [1.8, '1000 hPa'], [3.0, '996 hPa']].forEach(([yy, lab]) => {
                    els.push(s('line', { x1: plot.X(-1), x2: plot.X(30), y1: plot.Y(yy), y2: plot.Y(yy), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '6 6' }));
                    els.push(s('text', { x: plot.X(29.8), y: plot.Y(yy) - 4, 'text-anchor': 'end', class: 'tick', text: lab }));
                  });
                  els.push(s('text', { x: plot.X(-0.6), y: plot.Y(2.75), class: 'halo-text', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));font-weight:800;fill:var(--coral)', text: 'LOW' }));
                  els.push(s('text', { x: plot.X(-0.6), y: plot.Y(-0.75), class: 'halo-text', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));font-weight:800;fill:var(--blue)', text: 'HIGH' }));
                  const pts = GEO.filter((q, i) => i <= k && i % 5 === 0);
                  els.push(s('path', { d: pts.map(([a, b], i) => `${i ? 'L' : 'M'}${plot.X(a).toFixed(1)} ${plot.Y(b).toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 }));
                  // forces on the parcel (drawn in pixels): pressure pushes north, Coriolis pushes at right angles to the right of the motion
                  const cx = plot.X(x), cy = plot.Y(y), sc = 32, sp = Math.hypot(u, w);
                  const arr = (dx, dy, col) => { const x2 = cx + dx * sc, y2 = cy - dy * sc, a = Math.atan2(y2 - cy, x2 - cx); return [s('line', { x1: cx, y1: cy, x2, y2, stroke: `var(--${col})`, 'stroke-width': 3 }), s('path', { d: `M${x2} ${y2}L${x2 - 9 * Math.cos(a - 0.4)} ${y2 - 9 * Math.sin(a - 0.4)}M${x2} ${y2}L${x2 - 9 * Math.cos(a + 0.4)} ${y2 - 9 * Math.sin(a + 0.4)}`, stroke: `var(--${col})`, 'stroke-width': 3 })]; };
                  els.push(arr(0, 1, 'blue'));
                  if (sp > 0.05) els.push(arr(w, -u, 'coral'));
                  els.push(s('circle', { cx, cy, r: 7, class: 'fl-violet', stroke: 'var(--card)', 'stroke-width': 2 }));
                  return els;
                },
                readout: (p) => { const k = Math.min(GEO.length - 1, Math.round(p.t / 0.01)), [, , u, w] = GEO[k], ang = (Math.atan2(w, u) * 180) / Math.PI; return `{blue:pressure push} · {coral:Coriolis push} · wind direction: ${fix(Math.abs(ang), 0)}° ${ang >= 0 ? 'towards' : 'away from'} the low, measured from the isobars`; },
              },
              after: r`The parcel sets off towards the low, but as it picks up speed the Coriolis push grows and swings it to the right, until the two pushes balance: pressure pulling north, Coriolis pushing south. Then the wind blows **along** the isobars, with low pressure on its left: the **geostrophic** wind. (Left alone it would keep looping around that balance for ever; here the loops are allowed to fade away.) That's Buys Ballot's law: in the northern hemisphere, stand with your back to the wind and low pressure is on your left.`,
            },
            {
              type: 'numeric',
              title: 'The geostrophic wind',
              prompt: r`When the pressure force balances the Coriolis force, the wind speed is $v = \dfrac{\Delta P}{\rho f \Delta x}$, where $f = 2\Omega\sin(\text{latitude})$ is the **Coriolis parameter**. At 45° latitude $f \approx 1.03 \times 10^{-4}$ s⁻¹. For the same 100 Pa per 100 km and $\rho = 1.2$ kg/m³, what is the wind speed? (1 decimal place.)`,
              unit: 'm/s',
              answer: 100 / (1.2 * 1.03e-4 * 1e5),
              tol: 0.06,
              wrong: [{ v: (100 / (1.2 * 1e5)) * 3600, tol: 0.1, why: 'That’s the speed after an hour with no Coriolis effect. Use the balance formula.' }],
              hint: r`$v = \dfrac{100}{1.2 \times 1.03 \times 10^{-4} \times 10^5}$.`,
              explain: r`$v \approx 8.1$ m/s, a fresh breeze, blowing **along** the isobars rather than across them. Closely packed isobars on a weather map mean strong winds; widely spaced ones mean calm.`,
            },
            {
              type: 'interactive',
              title: 'Wind and latitude',
              body: r`For the same pressure gradient (1 hPa per 100 km), the geostrophic wind speed is $v = \frac{1}{\rho f}\frac{\Delta p}{\Delta x}$, where $f = 2\Omega\sin\varphi$ is the Coriolis parameter. At 45° that gives about 8 m/s. Find the latitude where the same gradient drives a wind **twice** as fast.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 0, ymax: 50, grid: false, height: 260, axes: { xlabel: 'latitude (°)', ylabel: 'wind speed (m/s)', xticks: 15, yticks: 10 },
                params: { lat: { min: 5, max: 90, step: 0.1, value: 60, label: 'latitude', color: 'teal', format: (v) => `${v.toFixed(1)}°` } },
                curves: [{ f: (x) => 100 / (1.2 * 2 * 7.292e-5 * Math.sin((x * Math.PI) / 180) * 1e5), color: 'violet', width: 3, from: 1 }, { f: () => 2 * 100 / (1.2 * 2 * 7.292e-5 * Math.sin(Math.PI / 4) * 1e5), color: 'teal', dash: true }],
                points: [{ x: (p) => p.lat, y: (p) => 100 / (1.2 * 2 * 7.292e-5 * Math.sin((p.lat * Math.PI) / 180) * 1e5), color: 'coral' }],
                readout: (p) => { const f = 2 * 7.292e-5 * Math.sin((p.lat * Math.PI) / 180); return `f = ${(f * 1e4).toFixed(3)} × 10⁻⁴ /s · wind **${(100 / (1.2 * f * 1e5)).toFixed(1)} m/s**`; },
                goal: (p) => { const v = (x) => 1 / Math.sin((x * Math.PI) / 180); return Math.abs(v(p.lat) / v(45) - 2) < 0.01; },
                hint: 'You need sin φ to be half of sin 45° ≈ 0.354.',
                solution: { lat: 20.7 },
              },
              explain: r`$\sin\varphi = 0.354$ gives about **21°**. Near the equator the Coriolis effect fades away, so the geostrophic balance breaks down: pressure differences simply fill in rather than driving winds around them. That is also why hurricanes cannot form within about 5° of the equator.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'No hurricanes at the equator',
              prompt: r`Hurricanes almost never form within about 5° of the equator, even though the sea there is very warm. Why?`,
              choices: [
                { t: 'The Coriolis effect vanishes at the equator, so air rushing toward a low can’t be set spinning', ok: true },
                { t: 'The equator has too little water vapour', why: 'Equatorial air is very humid. The missing ingredient is spin.' },
                { t: 'Hurricanes are blown away by trade winds', why: 'Trade winds steer hurricanes, but the reason they can’t form is the lack of Coriolis effect.' },
              ],
              explain: r`$f = 2\Omega\sin(\text{latitude})$ is zero at the equator. Without it, air simply flows into a low and fills it, rather than spiralling around it. Hurricanes spin anticlockwise in the northern hemisphere and clockwise in the southern, and no hurricane has ever crossed the equator.`,
            },
          ],
          recap: [
            'Uneven heating creates pressure differences, which drive winds.',
            'Sea breezes blow onshore by day because land heats faster than water.',
            'Large-scale winds follow isobars because of the Coriolis effect (geostrophic balance).',
          ],
        },
      ],
    },
    {
      title: 'Extreme Weather',
      summary: 'Thunderstorms and hurricanes.',
      lessons: [
        {
          id: 'storms',
          title: 'Thunderstorms',
          summary: 'Rising air, hail and lightning',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Fuel for storms',
              body: r`When rising air stays warmer than its surroundings, buoyancy keeps pushing it up, faster and faster. Meteorologists measure this with **CAPE** (convective available potential energy), in joules per kilogram of air. If all of it became kinetic energy, the updraft speed would be
$$w = \sqrt{2\,\text{CAPE}}$$
Real updrafts are slower, because rising air mixes with its surroundings and carries rain, but the idea is the same.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Strong enough for hail',
              prompt: r`To hold up large hailstones, a storm needs updrafts around **40 m/s**. Find the CAPE that would give that speed in the ideal case.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4000, ymin: 0, ymax: 100, grid: 500, gridY: 10, height: 250, axes: { xlabel: 'CAPE (J/kg)', ylabel: 'updraft speed (m/s)' },
                params: { c: { min: 100, max: 4000, step: 50, value: 2500, slider: false } },
                curves: [{ f: (x) => updraft(x), color: 'violet', width: 3 }, { f: () => 40, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.c, y: (p) => updraft(p.c), drag: { x: 'c' }, color: 'teal' }],
                readout: (p) => r`CAPE ${p.c} J/kg: ideal updraft $\sqrt{2 \times ${p.c}} = ${updraft(p.c).toFixed(1)}$ m/s`,
                goal: (p) => Math.abs(updraft(p.c) - 40) < 0.3,
                hint: r`Solve $\sqrt{2\,\text{CAPE}} = 40$.`,
                solution: { c: 800 },
              },
              explain: r`CAPE $= \frac{40^2}{2} = 800$ J/kg, a moderately unstable day. On the US Great Plains, CAPE can exceed 4,000 J/kg, powering supercell storms with hail the size of grapefruit.`,
            },
            {
              type: 'numeric',
              title: 'Counting to thunder',
              prompt: r`You see lightning and hear the thunder 9 seconds later. Sound travels at about 340 m/s, while the light arrives almost instantly. How far away was the strike, in km? (1 decimal place.)`,
              unit: 'km',
              answer: 9 * 0.34,
              tol: 0.05,
              wrong: [{ v: 3060, tol: 10, why: 'That’s in metres; convert to km.' }],
              explain: r`$9 \times 340 \approx 3{,}060$ m $\approx 3.1$ km. Rule of thumb: divide the seconds by 3 for kilometres (or by 5 for miles). If the gap is under 30 seconds, you're within range of the next strike: seek shelter.`,
            },
            {
              type: 'mcq',
              title: 'How hail grows',
              prompt: r`Cut a large hailstone in half and you'll see layers, like an onion. What do they record?`,
              choices: [
                { t: 'Trips up and down through the storm: it gains ice layers each time strong updrafts carry it back up', ok: true },
                { t: 'Years of growth', why: 'A hailstone forms in minutes, inside a single storm.' },
                { t: 'Different kinds of water', why: 'The layers differ in how quickly the ice froze, clear or cloudy, on each trip.' },
              ],
              explain: r`Hailstones grow as supercooled droplets freeze onto them. Each cycle adds a layer, until the stone is too heavy for the updraft and falls. The heaviest hailstone on record, in Bangladesh in 1986, weighed about 1 kg.`,
            },
            {
              type: 'numeric',
              title: 'Energy in a storm',
              prompt: r`A thunderstorm condenses about $10^8$ kg of water vapour, releasing 2.26 MJ per kg as heat. How many kilotons of TNT is that? (1 kiloton $= 4.18 \times 10^{12}$ J; nearest whole number.)`,
              unit: 'kt',
              answer: 1e8 * 2.26e6 / 4.184e12,
              tol: 1,
              explain: r`$\frac{2.26 \times 10^{14}}{4.18 \times 10^{12}} \approx 54$ kilotons, several atomic bombs’ worth, released gently as warmth that drives the updraughts.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Hotter than the Sun',
              prompt: r`A lightning channel heats air to about 30,000 K in microseconds. The Sun's surface is about 5,800 K. How many times hotter is the lightning channel? (1 decimal place.)`,
              unit: '×',
              answer: 30000 / 5800,
              tol: 0.06,
              wrong: [{ v: 24200, why: 'Divide, don’t subtract.' }],
              explain: r`$\frac{30{,}000}{5{,}800} \approx 5.2$ times. The air expands explosively, creating the shock wave we hear as thunder. Earth sees about 40–50 lightning flashes every second.`,
            },
          ],
          recap: [
            r`Ideal updraft speed $w = \sqrt{2\,\text{CAPE}}$.`,
            'Divide the flash-to-bang seconds by 3 for kilometres.',
            'Hail grows in layers on trips through strong updrafts.',
          ],
        },
        {
          id: 'hurricanes',
          title: 'Hurricanes',
          summary: 'Heat engines over warm oceans',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Fuelled by warm water',
              body: r`A hurricane (typhoon or tropical cyclone) is a giant heat engine. Warm ocean water, at least about 26.5 °C, evaporates into the air; as that moist air rises in towering thunderstorms, the vapour condenses, releasing latent heat that powers the storm. Air spirals in towards low pressure at the centre, spun up by the Coriolis effect.`,
            },
            {
              type: 'mcq',
              title: 'Hurricane season',
              prompt: r`In the North Atlantic, hurricane season peaks around early September, more than two months after midsummer. Why so late?`,
              choices: [
                { t: 'The sea surface is warmest then: water’s huge heat capacity means the ocean keeps warming for months after midsummer', ok: true },
                { t: 'The Coriolis effect is strongest in September', why: 'The Coriolis effect depends on latitude and Earth’s spin, not on the season.' },
                { t: 'The Sun is strongest in September', why: 'Sunlight peaks at midsummer in June. The ocean lags behind it.' },
              ],
              explain: r`Hurricanes feed on warm water (at least about 26.5 °C). Because water has such a high specific heat, the sea keeps soaking up summer heat and reaches its warmest weeks after the strongest sunshine, just as the warmest part of a day comes in mid-afternoon rather than at noon.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Pressure and wind',
              prompt: r`A rough rule of thumb links a hurricane's top wind speed to how far its central pressure is below 1010 hPa: $v \approx 7\sqrt{\Delta P}$ m/s (with $\Delta P$ in hPa). Find the pressure drop that gives **70 m/s** winds, Category 5 strength.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 150, ymin: 0, ymax: 90, grid: 25, gridY: 10, height: 250, axes: { xlabel: 'pressure drop (hPa)', ylabel: 'top wind (m/s)' },
                params: { dp: { min: 5, max: 150, step: 1, value: 40, slider: false } },
                curves: [{ f: (x) => hurricaneWind(x), color: 'violet', width: 3 }, { f: () => 70, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.dp, y: (p) => hurricaneWind(p.dp), drag: { x: 'dp' }, color: 'teal' }],
                readout: (p) => r`central pressure ${1010 - p.dp} hPa: top winds about $${hurricaneWind(p.dp).toFixed(0)}$ m/s ($${(hurricaneWind(p.dp) * 3.6).toFixed(0)}$ km/h)`,
                goal: (p) => Math.abs(hurricaneWind(p.dp) - 70) < 0.4,
                hint: r`Solve $7\sqrt{\Delta P} = 70$.`,
                solution: { dp: 100 },
              },
              explain: r`$\Delta P = 100$ hPa, a central pressure around 910 hPa. The most intense hurricanes ever recorded, like Typhoon Tip (1979, 870 hPa), had pressure drops of over 130 hPa. Since wind force goes as $v^2$, a Category 5's 70 m/s winds push about 4 times harder than a Category 1's 35 m/s.`,
            },
            {
              type: 'numeric',
              title: 'Energy from rain',
              prompt: r`A hurricane might rain 2 cm of water per day over a circle of radius 300 km. Condensing each kilogram of vapour releases 2.3 MJ. How much energy is that per day, in units of $10^{18}$ J? (Water: 1000 kg/m³; nearest whole number.)`,
              unit: r`$\times 10^{18}$ J`,
              answer: Math.round((Math.PI * 3e5 ** 2 * 0.02 * 1000 * 2.3e6) / 1e18),
              tol: 1,
              wrong: [{ v: Math.round((3e5 ** 2 * 0.02 * 1000 * 2.3e6) / 1e18), tol: 1, why: r`The area of the circle is $\pi r^2$.` }],
              hint: r`Mass of rain = area × depth × density.`,
              explain: r`Area $\approx 2.8 \times 10^{11}$ m², rain $\approx 5.7 \times 10^{12}$ kg per day, energy $\approx 1.3 \times 10^{19}$ J per day: about 150 trillion watts, many times humanity's total power use. Only a tiny fraction becomes wind.`,
            },
            {
              type: 'numeric',
              title: 'Twice the wind',
              prompt: r`The power of wind (and roughly its damage potential) grows with the cube of its speed. How many times more powerful is a 70 m/s hurricane wind than a 35 m/s gale?`,
              answer: 8,
              explain: r`$2^3 = 8$. That’s why each step up the hurricane scale brings far more than proportionally more damage.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Landfall',
              prompt: r`Why do hurricanes weaken rapidly once they move over land?`,
              choices: [
                { t: 'They’re cut off from their fuel, warm moist ocean air, and land friction slows the winds', ok: true },
                { t: 'Mountains block the Coriolis effect', why: 'The Coriolis effect doesn’t depend on terrain; the fuel supply does.' },
                { t: 'Land is colder than air', why: 'Land can be warm, but it can’t supply the huge amounts of water vapour the storm needs.' },
              ],
              explain: r`Without evaporation from warm water, condensation (the storm's engine) dwindles within a day or two, though the heavy rain can still cause devastating floods far inland. Cool water has the same effect: hurricanes weaken over the cold wake they stir up themselves.`,
            },
          ],
          recap: [
            'Hurricanes are heat engines fuelled by warm ocean water and latent heat.',
            'They need the Coriolis effect, so they don’t form at the equator.',
            'Lower central pressure means stronger winds; land cuts off their fuel.',
          ],
        },
        {
          id: 'forecasting',
          title: 'How Far Ahead Can We Forecast?',
          summary: 'Chaos and the limits of prediction',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'A rounding error',
              body: r`In 1961 Edward Lorenz restarted a weather simulation halfway through, typing in a value of 0.506 instead of the computer’s stored 0.506127. Within a couple of simulated months the new run looked completely different from the old one. The atmosphere is **chaotic**: tiny differences in the starting state grow exponentially.

In today’s weather models, small errors in the starting state roughly **double every two days** or so, until they are as large as the natural day-to-day variation of the weather. After that, the forecast is no better than climate averages.`,
            },
            {
              type: 'numeric',
              title: 'Ten days on',
              prompt: r`If forecast errors double every 2 days, by what factor has an initial error grown after 10 days?`,
              answer: 32,
              explain: r`10 days is 5 doublings: $2^5 = 32$. After 20 days it’s about a thousandfold.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Buying more days',
              prompt: r`A forecast stays useful while its error is below **half** the natural spread of the weather. Errors double every 2 days. Find the initial error (as a percentage of that spread) that keeps the forecast useful for **14 days**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 24, ymin: -3, ymax: 0.3, grid: false, height: 260, axes: { xlabel: 'days ahead', ylabel: 'error (fraction of natural spread, log scale)', xticks: 2, yticks: 1, yfmt: (v) => (v === 0 ? '1' : `10^${v}`), yAt: -3 },
                params: { e: { min: 0.1, max: 10, step: 0.01, value: 2, label: 'initial error', color: 'coral', format: (v) => `${v.toFixed(2)}%` } },
                curves: [{ f: (t, p) => Math.min(0, Math.log10((p.e / 100) * 2 ** (t / 2))), color: 'coral', width: 3 }, { f: () => Math.log10(0.5), color: 'teal', dash: true }],
                readout: (p) => { const days = 2 * Math.log2(0.5 / (p.e / 100)); return `useful for about **${days.toFixed(1)} days** (until the error reaches half the natural spread)`; },
                goal: (p) => Math.abs(2 * Math.log2(0.5 / (p.e / 100)) - 14) < 0.05,
                hint: r`You need $e_0 \times 2^{14/2} = 0.5$, so $e_0 = \frac{0.5}{128}$.`,
                solution: { e: 0.39 },
              },
              explain: r`$e_0 = \frac{0.5}{2^7} \approx 0.0039$: an initial error of only **0.4%** of the natural variability. Each halving of the starting error buys just one more doubling time, two days. That is why better satellites and data improve forecasts by only about a day per decade, and why a limit of roughly two weeks seems unavoidable.`,
            },
            {
              type: 'mcq',
              title: 'Ensembles',
              prompt: r`Forecast centres run their model 50 times from slightly different starting states. Why?`,
              choices: [
                { t: 'The spread of outcomes shows how predictable the weather is, and gives probabilities like “70% chance of rain”', ok: true },
                { t: 'To find the one correct starting state', why: 'The exact state can never be known; the ensemble samples the uncertainty instead.' },
                { t: 'Because computers make random mistakes', why: 'The variations are deliberate, to represent uncertainty in the measurements.' },
              ],
              explain: r`If all 50 runs agree, the forecast is reliable; if they fan out, it isn’t. This is how chaos is tamed in practice: not by predicting one future, but by forecasting the odds.`,
            },
            {
              type: 'numeric',
              title: 'Better measurements',
              prompt: r`Engineers cut the initial error by a factor of 4. How many extra days of useful forecast does that buy?`,
              unit: 'days',
              answer: 4,
              explain: r`A factor of 4 is two doublings, each worth 2 days: **4 days**. Exponential error growth means huge improvements in measurement give only modest gains in range.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Weather versus climate',
              prompt: r`If we can’t forecast the weather beyond about two weeks, how can scientists make projections of climate decades ahead?`,
              choices: [
                { t: 'Climate is the statistics of weather (averages and ranges), which depend on things like greenhouse gases, not on today’s exact state', ok: true },
                { t: 'Climate models are simply far more accurate weather models', why: 'They can’t predict the weather on a particular day in 2050 either. They predict its statistics.' },
                { t: 'They can’t: climate projections are guesses', why: 'Averages over many years respond predictably to changes in energy balance, even though individual days don’t.' },
              ],
              explain: r`You can’t predict whether it will rain on 3 July 2050, but you can predict that summers will be warmer on average if the planet traps more heat, just as you can’t predict a single coin flip but can predict a loaded coin’s long-run frequency.`,
            },
          ],
          recap: [
            'The atmosphere is chaotic: small errors grow exponentially, doubling every couple of days.',
            'Each halving of the initial error buys only one doubling time, so forecasts are limited to about two weeks.',
            'Ensembles forecast probabilities; climate projections forecast statistics, not days.',
          ],
        },
      ],
    },
  ],
};
