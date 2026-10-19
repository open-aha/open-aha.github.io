import { fix } from '../lib/svg.js';

const r = String.raw;
const f1 = (v) => (Math.round(v * 10) / 10).toString();
// Kleiber's law: basal metabolic rate ≈ 3.4 W × (mass in kg)^0.75
const kleiber = (m) => 3.4 * m ** 0.75;
const ANIMALS = [[0.02, 'mouse'], [4, 'cat'], [70, 'human'], [500, 'horse'], [4000, 'elephant']];
const G = 9.8;
// mean arterial pressure (mmHg) at height h (m) in a standing adult, heart at 1.3 m
const RHO_B = 1060, MMHG = 133.3;
const bodyP = (h) => 100 + ((1.3 - h) * RHO_B * G) / MMHG;
// forearm: 40 N ball at 35 cm, 15 N forearm weight at 15 cm; biceps force with insertion d cm
const biceps = (d) => (40 * 35 + 15 * 15) / d;
// simplified eye: object 25 cm away, retina 2 cm behind the lens
const eyeImage = (P) => 100 / (P - 4);
// live = true keeps one decimal on tonnes, so the slider label does not change length (axis ticks pass false)
const fmtMass = (m, live = true) => (m < 1 ? `${Math.round(m * 1000)} g` : m < 1000 ? `${Math.round(m)} kg` : `${live ? fix(m / 1000, 1) : f1(m / 1000)} t`);

export default {
  id: 'bodyphysics',
  subject: 'physics',
  title: 'Physics of the Human Body',
  level: 'Intermediate',
  cover: 'bodyphysics',
  tagline: 'Metabolism, blood flow, nerves, scaling, muscles, walking and the eye.',
  description: r`Your body obeys the same physics as engines, pumps and electrical circuits. Calculate how much you sweat, how hard your heart works, how fast your nerves carry signals and how sensitive your eyes and ears are, then see how the rules change from mice to elephants. Finally, treat your arms as levers, your legs as pendulums and your eyes as cameras.`,
  prereq: 'Energy',
  chapters: [
    {
      title: 'Energy and Pumps',
      summary: 'Metabolism, sweat and the heart.',
      lessons: [
        {
          id: 'metabolism',
          title: 'Burning and Cooling',
          summary: 'Metabolism and sweat',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'An inefficient engine',
              body: r`At rest, your body converts food energy at about 80–100 W. During hard exercise this can rise to over 1,000 W. But muscles are only about **25% efficient**: three-quarters of the energy becomes heat, which must be removed or your temperature would soar.

Your main cooling system is **sweat**. Evaporating water absorbs a lot of energy: about **2.4 MJ per kilogram** at skin temperature (its latent heat).`,
            },
            {
              type: 'numeric',
              title: 'Mechanical work',
              prompt: r`A cyclist's muscles use energy at 800 W, with 25% efficiency. How much mechanical power reaches the pedals?`,
              unit: 'W',
              answer: 200,
              wrong: [{ v: 600, why: 'That’s the 75% wasted as heat.' }, { v: 3200, why: 'Efficiency means only a fraction is useful: multiply by 0.25.' }],
              explain: r`$0.25 \times 800 = 200$ W to the pedals, and **600 W** of heat that the body has to get rid of.`,
            },
            {
              type: 'numeric',
              title: 'A day at rest',
              prompt: r`At rest, a body uses about 80 W. How much energy is that over 24 hours, in megajoules? (1 decimal place.)`,
              unit: 'MJ',
              answer: (80 * 86400) / 1e6,
              tol: 0.05,
              wrong: [{ v: 1.92, tol: 0.01, why: 'That’s kilowatt-hours (80 W × 24 h). Multiply 80 W by the 86,400 seconds in a day.' }, { v: 0.0019, tol: 0.0001, why: 'Use seconds: 24 × 3,600 = 86,400.' }],
              explain: r`$80 \times 86{,}400 \approx 6.9$ MJ, or about **1,650 kcal** (1 kcal = 4,184 J). That's the basal metabolic rate: the energy just to stay alive, before any activity. Food labels' "Calories" are kilocalories.`,
            },
            {
              type: 'mcq',
              title: 'Why a fan cools you',
              prompt: r`An electric fan doesn't lower the air temperature at all. So why does it make you feel cooler?`,
              choices: [
                { t: 'It sweeps away the warm, humid layer of air next to your skin, speeding up convection and evaporation', ok: true },
                { t: 'Moving air is colder than still air', why: 'The fan’s motor actually warms the room slightly. The cooling comes from what moving air does at your skin.' },
                { t: 'It blows the heat out of the room', why: 'A fan doesn’t remove heat from the room. It speeds up heat loss from your body.' },
              ],
              explain: r`Still air next to your skin warms up and fills with water vapour, so it insulates you and slows evaporation. Moving air keeps replacing it with cooler, drier air. That's also why wind feels colder than still air at the same temperature (the "wind chill").`,
            },
            {
              type: 'interactive',
              title: 'How much sweat?',
              body: r`Evaporating 1 kg of sweat removes about 2.4 MJ of heat. Find the heating power your body must shed for sweating at **1 litre per hour** to keep up.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1200, ymin: 0, ymax: 2, grid: false, height: 260, axes: { xlabel: 'heat to remove (W)', ylabel: 'sweat (litres per hour)', xticks: 200, yticks: 0.5 },
                params: { P: { min: 50, max: 1200, step: 1, value: 300, label: 'power', color: 'coral', format: (v) => `${v} W` } },
                curves: [{ f: (x) => (x * 3600) / 2.4e6, color: 'violet', width: 3 }, { f: () => 1, color: 'teal', dash: true }],
                points: [{ x: (p) => p.P, y: (p) => (p.P * 3600) / 2.4e6, color: 'coral' }],
                readout: (p) => `${p.P} W needs **${((p.P * 3600) / 2.4e6).toFixed(2)} litres** of sweat per hour`,
                goal: (p) => Math.abs((p.P * 3600) / 2.4e6 - 1) < 0.003,
                hint: '1 litre per hour carries away 2.4 MJ in 3,600 s.',
                solution: { P: 667 },
              },
              explain: r`About **670 W**: the waste heat of hard running. Marathon runners can lose over a litre an hour, which is why dehydration (not lack of energy) often limits endurance in the heat. Sweat that drips off without evaporating cools you not at all.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sweat for one ride',
              prompt: r`That cyclist must shed 600 W of heat, all by evaporating sweat, for one hour. How many kilograms of sweat must evaporate? (Latent heat: 2.4 MJ/kg.)`,
              unit: 'kg',
              answer: (600 * 3600) / 2.4e6,
              tol: 0.02,
              wrong: [{ v: 250, why: r`Convert MJ to J: $\frac{600 \times 3600}{2.4 \times 10^6}$.` }, { v: 0.00025, tol: 0.00002, why: r`Multiply the power by 3,600 seconds to get the energy for one hour.` }],
              explain: r`Energy $= 600 \times 3600 = 2.16$ MJ, so sweat $= 2.16 / 2.4 = 0.9$ kg: almost a litre an hour, which is why endurance athletes must drink so much. In humid air, sweat can't evaporate as easily, and that's what makes humid heat so dangerous.`,
            },
          ],
          recap: [
            'Muscles are about 25% efficient. The rest of the energy becomes heat.',
            'Evaporating sweat absorbs about 2.4 MJ per kg.',
            'Hard exercise can demand close to a litre of sweat per hour.',
          ],
        },
        {
          id: 'heart',
          title: 'The Heart as a Pump',
          summary: 'Pressure times flow',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Blood pressure',
              body: r`Blood pressure is written like "120/80 mmHg": the peak (systolic) and resting (diastolic) pressures, in millimetres of mercury above atmospheric pressure. One mmHg is about 133 Pa, so 120 mmHg ≈ 16 kPa.

A pump's power is **pressure × volume flow rate**. At rest, the heart pumps about 5 litres of blood per minute.`,
            },
            {
              type: 'numeric',
              title: 'Heart power',
              prompt: r`Take an average pressure of 100 mmHg (13.3 kPa) and a flow of 5 litres per minute ($8.3 \times 10^{-5}$ m³/s). What's the heart's mechanical power output?`,
              unit: 'W',
              answer: 13300 * 8.3e-5,
              tol: 0.05,
              wrong: [{ v: 66500, tol: 500, why: 'Convert the flow to m³/s first: 5 L/min = 8.3 × 10⁻⁵ m³/s.' }, { v: 0.0011, tol: 0.0001, why: 'Use pascals, not kilopascals: 13.3 kPa = 13,300 Pa.' }],
              explain: r`$P = 13{,}300 \times 8.3 \times 10^{-5} \approx 1.1$ W. The heart does this nonstop for a lifetime: about 3 billion beats. During heavy exercise, the flow can rise to 25 litres per minute or more.`,
            },
            {
              type: 'numeric',
              title: 'One beat',
              prompt: r`A resting heart pumps 5 litres per minute at 70 beats per minute. How much blood does it push out per beat, in millilitres? (Nearest whole number.)`,
              unit: 'mL',
              answer: Math.round(5000 / 70),
              tol: 1,
              wrong: [{ v: 0.071, tol: 0.002, why: 'That’s in litres. Convert to millilitres.' }, { v: 350, why: 'Divide the flow by the heart rate: 5,000 mL ÷ 70.' }],
              explain: r`$\frac{5000}{70} \approx 71$ mL per beat: the **stroke volume**. Athletes' hearts have bigger stroke volumes, so they can pump the same blood with fewer beats: resting heart rates in the 40s are common in endurance athletes.`,
            },
            {
              type: 'mcq',
              title: 'Measuring on the arm',
              prompt: r`Blood pressure is measured with a cuff on the upper arm, held at the level of the heart. Why does the height matter?`,
              choices: [
                { t: 'Blood pressure increases with depth below the heart, like water pressure, so readings change with height', ok: true },
                { t: 'The cuff squeezes harder when raised', why: 'The cuff pressure is controlled by the machine. It’s the blood’s own pressure that varies with height.' },
                { t: 'It doesn’t matter', why: r`A column of blood exerts pressure $\rho g h$: about 0.8 mmHg per centimetre of height.` },
              ],
              explain: r`Just like water in a tank, blood pressure grows by $\rho g h$ with depth. Standing, the pressure in your feet is much higher than in your head: roughly 90 mmHg more over 1.2 m. A giraffe needs a blood pressure around twice ours to lift blood up its long neck.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Pressure from head to toe',
              body: r`In a standing adult, the average arterial pressure is about 100 mmHg at heart height (1.3 m). Above and below, it changes by $\rho g h$. Slide up and down the body.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1.8, ymin: 0, ymax: 220, grid: 0.2, gridY: 20, height: 280, padL: 48, axes: { xlabel: 'height above the floor (m)', ylabel: 'pressure (mmHg)' },
                params: { h: { min: 0, max: 1.7, step: 0.05, value: 1.3, label: 'height', color: 'teal', format: (v) => `${v.toFixed(2)} m` } },
                curves: [{ f: (h) => bodyP(h), from: 0, to: 1.7, color: 'coral', width: 3 }],
                points: [{ x: (p) => p.h, y: (p) => bodyP(p.h), color: 'teal' }],
                extra: ({ plot, s }) => [
                  s('line', { x1: plot.X(1.3), x2: plot.X(1.3), y1: plot.Y(0), y2: plot.Y(220), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' }),
                  s('text', { x: plot.X(1.3) + 6, y: plot.Y(200), class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'heart' }),
                ],
                readout: (p) => r`at ${p.h.toFixed(2)} m: about $${Math.round(bodyP(p.h))}$ mmHg ${p.h < 0.15 ? '(feet)' : p.h > 1.55 ? '(head)' : ''}`,
              },
              after: r`Your feet see about 200 mmHg and your head only about 70. Stand up too quickly and pressure in the head drops before your blood vessels react, which is why you can feel dizzy. Varicose veins in the legs come from this extra pressure too.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A giraffe’s neck',
              prompt: r`A giraffe's brain is about 2 m above its heart. How much extra pressure must the heart supply, just to lift blood that high? (Blood: $\rho = 1060$ kg/m³; 1 mmHg = 133.3 Pa. Nearest whole mmHg.)`,
              unit: 'mmHg',
              answer: Math.round((RHO_B * G * 2) / MMHG),
              tol: 2,
              wrong: [{ v: 20776, tol: 50, why: 'That’s in pascals. Divide by 133.3 to convert to mmHg.' }],
              explain: r`$\rho g h = 1060 \times 9.8 \times 2 \approx 20{,}800$ Pa $\approx 156$ mmHg, on top of the pressure needed to push blood through the brain. Giraffes have among the highest blood pressures of any animal (roughly double ours), thick-walled arteries, and tight skin on their legs that works like compression stockings.`,
            },
          ],
          recap: [
            'Pump power = pressure × flow rate.',
            'The resting heart puts out only about 1 W of mechanical power.',
            r`Blood pressure varies with height by $\rho g h$.`,
          ],
        },
        {
          id: 'flow',
          title: 'Flow in Tubes',
          summary: 'Why narrow vessels matter so much',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Poiseuille’s law',
              body: r`Blood vessels and airways are tubes, and smooth flow through a tube obeys **Poiseuille's law**:
$$Q = \frac{\pi r^4\, \Delta p}{8 \eta L}$$
where $Q$ is the volume flow rate, $r$ the radius, $\Delta p$ the pressure difference along a length $L$, and $\eta$ the viscosity. The striking part is the **fourth power** of the radius.`,
            },
            {
              type: 'numeric',
              title: 'Half the radius',
              prompt: r`If a vessel's radius halves, with the same pressure difference, what fraction of the original flow gets through? Enter it as "1 in ___".`,
              lhs: '1 in',
              answer: 16,
              wrong: [{ v: 2, why: r`Flow depends on $r^4$, not $r$.` }, { v: 4, why: r`That would be $r^2$. Poiseuille's law has $r^4$: $2^4 = 16$.` }],
              explain: r`$\left(\tfrac12\right)^4 = \tfrac{1}{16}$. Tiny changes in radius have huge effects, which is how the body controls blood flow: muscles in artery walls widen or narrow vessels slightly to send blood where it's needed.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A narrowing artery',
              prompt: r`Fatty deposits narrow an artery. Drag to find the radius (as a fraction of normal) at which the flow is **halved**, at the same pressure.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1.05, ymin: 0, ymax: 1.1, grid: 0.1, gridY: 0.1, height: 280, axes: { xlabel: 'radius (fraction of normal)', ylabel: 'flow (fraction)', xfmt: (v) => v.toFixed(1), yfmt: (v) => v.toFixed(1) },
                params: { r: { min: 0.5, max: 1, step: 0.01, value: 1, slider: false } },
                curves: [{ f: (x) => x ** 4, color: 'coral', width: 3 }, { f: () => 0.5, color: 'ink', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.r, y: (p) => p.r ** 4, drag: { x: 'r' }, color: 'teal' }],
                readout: (p) => r`radius $${p.r.toFixed(2)}$ → flow $${(p.r ** 4).toFixed(3)}$ of normal`,
                goal: (p) => Math.abs(p.r ** 4 - 0.5) < 0.01,
                hint: 'Look for where the curve crosses the dashed line at 0.5.',
                solution: { r: 0.84 },
              },
              explain: r`$r = 2^{-1/4} \approx 0.84$: narrowing the radius by just 16% halves the flow. To compensate, the heart would have to double the pressure difference, which is one reason narrowed arteries lead to high blood pressure.`,
            },
            {
              type: 'numeric',
              title: 'Slowing down in capillaries',
              prompt: r`Blood leaves the heart through the aorta (cross-section about 3 cm²) at 83 cm³/s. How fast is it moving there, in cm/s? (Speed = flow ÷ area; nearest whole number.)`,
              unit: 'cm/s',
              answer: 28,
              tol: 1,
              wrong: [{ v: 249, tol: 2, why: 'Divide the flow by the area, don’t multiply.' }],
              explain: r`$\frac{83}{3} \approx 28$ cm/s. The aorta branches into billions of capillaries whose **total** cross-section is about 2,000 cm², so blood slows to under 1 mm/s there: slow enough for oxygen and nutrients to diffuse in and out.`,
            },
            {
              type: 'numeric',
              title: 'Widening a vessel',
              prompt: r`Poiseuille’s law says flow is proportional to the fourth power of the radius. If a blood vessel widens by 10%, by what factor does the flow increase (at the same pressure)? (2 decimal places.)`,
              answer: Math.pow(1.1, 4),
              tol: 0.01,
              explain: r`$1.1^4 \approx 1.46$: a 10% wider vessel carries 46% more blood. That’s how the body redirects blood so effectively, just by slightly relaxing the muscles around arteries.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Bubbles in the lungs',
              prompt: r`The lungs contain about 500 million tiny air sacs (alveoli), lined with a thin film of water. The pressure inside a bubble is $p = \frac{2\gamma}{r}$ ($\gamma$: surface tension). What problem does this cause, and how does the body solve it?`,
              choices: [
                { t: 'Small sacs would have higher pressure and collapse into big ones; a soap-like surfactant lowers the surface tension', ok: true },
                { t: 'Big sacs would burst; the body adds extra water', why: r`Pressure grows as $r$ **shrinks**, so it's small bubbles that are unstable.` },
                { t: 'There’s no problem: bubbles are always stable', why: 'Two connected bubbles of different sizes are unstable: the smaller empties into the larger.' },
              ],
              explain: r`Connect a small and a big bubble and the small one empties into the big one. The lungs produce **surfactant**, which cuts surface tension more as the sacs shrink, keeping them all open. Premature babies often lack it, and artificial surfactant has saved many lives.`,
            },
          ],
          recap: [
            r`Poiseuille's law: flow $\propto r^4\,\Delta p$.`,
            'Narrowing a vessel by 16% halves its flow.',
            'Blood slows in capillaries because their total area is huge.',
            'Surfactant keeps the lungs’ tiny air sacs from collapsing.',
          ],
        },
      ],
    },
    {
      title: 'Signals and Scaling',
      summary: 'Nerves, senses, and size.',
      lessons: [
        {
          id: 'nerves',
          title: 'Nerves & Senses',
          summary: 'Fast wires and sensitive detectors',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Electrical signals',
              body: r`Nerves carry electrical pulses, but not like current in a copper wire: a pulse travels as a wave of ions flowing in and out through the cell membrane. In 1850, Hermann von Helmholtz first measured the speed, in a frog's nerve: about 27 m/s. In humans, the fastest nerves, wrapped in insulating **myelin**, reach about 100 m/s, while thin, unmyelinated nerves crawl at around 1 m/s.`,
            },
            {
              type: 'numeric',
              title: 'Stubbing a toe',
              prompt: r`A pain signal travels 1.8 m from your toe to your brain at 60 m/s. How long does it take, in milliseconds?`,
              unit: 'ms',
              answer: 30,
              wrong: [{ v: 0.03, why: 'That’s in seconds. Convert to milliseconds.' }, { v: 108, why: 'Divide distance by speed: 1.8 ÷ 60.' }],
              explain: r`$1.8 / 60 = 0.03$ s $= 30$ ms. A tall person really does feel a stubbed toe a few milliseconds later than a short person. Dull, aching pain travels on slower fibres, which is why you often feel a sharp pain first and the throbbing a moment later.`,
            },
            {
              type: 'numeric',
              title: 'Catch the ruler',
              prompt: r`A friend drops a ruler between your fingers and you catch it after it has fallen 15 cm. Using $d = \tfrac12 g t^2$, what's your reaction time, in milliseconds? (Nearest 5 ms.)`,
              unit: 'ms',
              answer: 175,
              tol: 3,
              wrong: [{ v: 0.175, tol: 0.005, why: 'That’s in seconds. Convert to milliseconds.' }, { v: 30.6, tol: 1, why: r`Solve $t = \sqrt{2d/g}$, with $d$ in metres.` }],
              explain: r`$t = \sqrt{\frac{2 \times 0.15}{9.8}} \approx 0.175$ s. The nerve signals themselves take only tens of milliseconds: most of a reaction time is spent in the brain, recognising the fall and deciding to act.`,
            },
            {
              type: 'mcq',
              title: 'Why myelin helps',
              prompt: r`Myelin wraps nerve fibres in insulation, with small gaps every millimetre or so. How does this speed up signals?`,
              choices: [
                { t: 'The signal jumps from gap to gap, only being regenerated at the gaps', ok: true },
                { t: 'Myelin conducts electricity like copper', why: 'Myelin is an insulator. It stops the signal leaking out between the gaps.' },
                { t: 'It makes the fibres shorter', why: 'The fibres are the same length; the signal skips along them.' },
              ],
              explain: r`Between the gaps (nodes of Ranvier), the insulated fibre passes the signal on almost instantly. Only at the nodes does the slow process of ions crossing the membrane need to happen. This "saltatory" (leaping) conduction is up to 100 times faster. Multiple sclerosis damages myelin, slowing or blocking signals.`,
            },
            {
              type: 'mcq',
              title: 'Extreme sensitivity',
              prompt: r`How sensitive are human senses, at their best?`,
              choices: [
                { t: 'Rods in a dark-adapted eye respond to single photons, and the eardrum detects motions smaller than an atom', ok: true },
                { t: 'They detect only large signals, thousands of times above the physical limits', why: 'Our senses are astonishingly close to physical limits.' },
                { t: 'The eye is sensitive but the ear is not', why: 'Both are extraordinarily sensitive: the faintest sound we hear moves the eardrum by less than an atom’s width.' },
              ],
              explain: r`A single photon can trigger a rod cell, and in experiments people can sometimes report flashes of just a handful of photons. The faintest sound we can hear, a pressure variation of $2 \times 10^{-5}$ Pa (0 dB), moves the eardrum by around $10^{-11}$ m, smaller than an atom. Evolution has pushed both senses close to the limits set by physics.`,
            },
            {
              type: 'explain',
              title: 'Decibels',
              body: r`The ear handles sound intensities from about $10^{-12}$ W/m² (the faintest sound) to around 1 W/m² (painful): a trillion-fold range. To cope with such a range, we use a logarithmic scale, the **decibel**:
$$L = 10 \log_{10}\frac{I}{I_0}, \qquad I_0 = 10^{-12}\ \text{W/m}^2$$
Every **+10 dB** means **10 times** the intensity. Our sense of loudness is roughly logarithmic too: +10 dB sounds about twice as loud.`,
            },
            {
              type: 'interactive',
              title: 'Signal speed',
              body: r`A signal from your toe travels about 1.8 m to your brain. Choose the nerve speed for which it arrives in **18 ms**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 130, ymin: 0, ymax: 100, grid: false, height: 260, axes: { xlabel: 'nerve speed (m/s)', ylabel: 'travel time (ms)', xticks: 20, yticks: 20 },
                params: { v: { min: 2, max: 130, step: 1, value: 30, label: 'speed', color: 'coral', format: (v) => `${v} m/s` } },
                curves: [{ f: (x) => (x > 0.5 ? 1800 / x : NaN), color: 'violet', width: 3 }, { f: () => 18, color: 'teal', dash: true }],
                points: [{ x: (p) => p.v, y: (p) => Math.min(100, 1800 / p.v), color: 'coral' }],
                readout: (p) => `${p.v} m/s: **${(1800 / p.v).toFixed(1)} ms** from toe to brain`,
                goal: (p) => p.v === 100,
                hint: 'time = distance ÷ speed.',
                solution: { v: 100 },
              },
              explain: r`**100 m/s**, about right for fast, myelinated touch fibres. Pain from a stubbed toe travels on slow, unmyelinated fibres at around 1 m/s, nearly two seconds: that’s why you feel the impact first and the ache a moment later.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A rock concert',
              prompt: r`Conversation is about 60 dB; a rock concert can reach 110 dB. How many times more intense is the concert?`,
              unit: '×',
              answer: 100000,
              wrong: [{ v: 50, why: 'Decibels are logarithmic: each 10 dB is a factor of 10.' }, { v: 5, why: r`50 dB is five factors of 10: $10^5$.` }],
              explain: r`50 dB more means $10^{5} = 100{,}000$ times the intensity, though it sounds "only" about $2^5 = 32$ times as loud. Long exposure above about 85 dB damages the hair cells in the inner ear, and they don't grow back.`,
            },
          ],
          recap: [
            'Nerve pulses travel at about 1–100 m/s, much faster with myelin.',
            'Toe-to-brain signals take tens of milliseconds.',
            'Eyes and ears approach physical limits of sensitivity.',
            r`Decibels are logarithmic: +10 dB means 10 times the intensity.`,
          ],
        },
        {
          id: 'scaling',
          title: 'From Mice to Elephants',
          summary: 'Kleiber’s law',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Metabolism and size',
              body: r`In the 1930s, Max Kleiber noticed that an animal's resting metabolic rate grows with its mass $M$ as roughly
$$P \propto M^{3/4}$$
Slide from a mouse to an elephant.`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 4, ymin: -1, ymax: 1.5, grid: 1, gridY: 1, height: 300, padL: 56, axes: { xlabel: 'mass (log scale)', ylabel: 'watts per kg', xfmt: (v) => fmtMass(10 ** v, false), yfmt: (v) => `${10 ** v}`, xAt: -2, yAt: -1 },
                params: { lg: { min: -1.7, max: 3.6, step: 0.01, value: 1.845, label: 'mass', color: 'teal', format: (v) => fmtMass(10 ** v) } },
                curves: [{ f: (x) => Math.log10(kleiber(10 ** x) / 10 ** x), color: 'coral', width: 3 }],
                extra: ({ plot, s }) => ANIMALS.map(([m, n]) => s('text', { x: plot.X(Math.log10(m)), y: plot.Y(Math.log10(kleiber(m) / m)) - 12, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: n })),
                points: [{ x: (p) => p.lg, y: (p) => Math.log10(kleiber(10 ** p.lg) / 10 ** p.lg), color: 'teal' }],
                readout: (p) => {
                  const m = 10 ** p.lg;
                  return r`${fmtMass(m)}: resting power $\approx ${fix(kleiber(m), 1)}$ W, $\;$ or $${fix(kleiber(m) / m, 1)}$ W per kg`;
                },
              },
              after: r`A big animal uses more energy in total, but much **less per kilogram**: a mouse burns energy roughly 8 times faster per kilogram than a human. That's why small animals must eat almost constantly, breathe fast and have racing heartbeats.`,
            },
            {
              type: 'numeric',
              title: 'Sixteen times heavier',
              prompt: r`If one animal is 16 times heavier than another, how many times greater is its metabolic rate, by Kleiber's law?`,
              unit: '×',
              answer: 8,
              wrong: [{ v: 16, why: r`Metabolism grows more slowly than mass: $16^{3/4}$.` }, { v: 12, why: r`$16^{3/4} = (16^{1/4})^3 = 2^3$.` }, { v: 2, why: r`That's $16^{1/4}$. Cube it: $16^{3/4} = 8$.` }],
              explain: r`$16^{3/4} = \left(16^{1/4}\right)^3 = 2^3 = 8$. Sixteen times the mass needs only eight times the energy, so each kilogram of the bigger animal runs at half the rate.`,
            },
            {
              type: 'numeric',
              title: 'Heart rate and size',
              prompt: r`Resting heart rate scales roughly as $M^{-1/4}$. If one animal is 81 times heavier than another, how many times **slower** does its heart beat?`,
              unit: '×',
              answer: 3,
              wrong: [{ v: 81, why: r`Take the fourth root: $81^{1/4}$.` }, { v: 9, why: r`That's the square root. The fourth root of 81 is 3.` }],
              explain: r`$81^{1/4} = 3$, since $3^4 = 81$. A 70 kg human (about 70 beats/min) versus a 5.6 t elephant (80 times heavier) predicts about 23 beats/min, close to the real 25–30.`,
            },
            {
              type: 'mcq',
              title: 'Giant ants?',
              prompt: r`Ants can lift many times their own weight. If an ant were scaled up 100 times in every length, what would happen?`,
              choices: [
                { t: 'It would struggle even to stand: muscle strength grows 10,000×, but weight grows 1,000,000×', ok: true },
                { t: 'It could lift cars, keeping its strength-to-weight ratio', why: 'Strength depends on muscle cross-section (length²), but weight on volume (length³).' },
                { t: 'Nothing would change', why: 'Area and volume scale differently, so proportions that work small fail big.' },
              ],
              explain: r`Strength $\propto L^2$ and weight $\propto L^3$, so strength-per-weight falls as $1/L$: 100 times worse. Giant creatures need thicker legs in proportion: compare an elephant's legs with a gazelle's. Insects also breathe by diffusion through tubes, which only works when they're small.`,
            },
            {
              type: 'numeric',
              title: 'Per kilogram',
              prompt: r`Metabolic rate grows like $M^{3/4}$, so per kilogram it goes like $M^{-1/4}$. How many times faster, per kilogram, is a 20 g mouse’s metabolism than a 4,000 kg elephant’s? (Nearest whole number.)`,
              answer: Math.pow(4000 / 0.02, 0.25),
              tol: 0.6,
              explain: r`$\left(\frac{4000}{0.02}\right)^{1/4} = (200{,}000)^{1/4} \approx 21$. Gram for gram, a mouse burns food about 21 times faster, which is why small mammals must eat almost constantly.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Heartbeats in a lifetime',
              prompt: r`A mouse's heart beats about 600 times a minute and it lives about 2 years. An elephant's beats about 30 times a minute and it lives about 60 years. Roughly how do their total lifetime heartbeats compare?`,
              choices: [
                { t: 'They’re similar: around 0.6–1 billion each', ok: true },
                { t: 'The mouse has 20 times more', why: r`The mouse's heart is 20× faster, but its life is 30× shorter. Multiply them out.` },
                { t: 'The elephant has 30 times more', why: 'Its life is 30× longer, but its heart beats 20× slower.' },
              ],
              explain: r`Mouse: $600 \times 60 \times 24 \times 365 \times 2 \approx 630$ million. Elephant: $30 \times 60 \times 24 \times 365 \times 60 \approx 950$ million. Many mammals get roughly a billion heartbeats: a curious consequence of how heart rate and lifespan both scale with size (humans are an outlier, with closer to 3 billion).`,
            },
          ],
          recap: [
            r`Kleiber's law: metabolic rate $\propto M^{3/4}$.`,
            'Per kilogram, small animals burn energy much faster.',
            'Many mammals live for roughly a billion heartbeats.',
          ],
        },
      ],
    },
    {
      title: 'Moving and Seeing',
      summary: 'Muscles as levers, legs as pendulums, the eye as a camera.',
      lessons: [
        {
          id: 'levers',
          title: 'Muscles & Levers',
          summary: 'Big forces for fast hands',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'The forearm lever',
              body: r`Your forearm is a lever pivoting at the elbow. The biceps attaches just **4 cm** from the elbow, while a ball in your hand sits about **35 cm** away. For the arm to stay still, the torques must balance:
$$F_{\text{biceps}} \times 4 = W \times 35$$`,
              widget: {
                kind: 'figure', w: 560, h: 270, maxWidth: 520, label: 'Forearm as a lever with the elbow as pivot',
                draw: ({ s, arrow }) => {
                  const ex = 100, ey = 150, sc = 11.4;
                  const hx = ex + 35 * sc, bx = ex + 4 * sc;
                  return [
                    s('rect', { x: ex - 18, y: 10, width: 36, height: ey - 10, rx: 16, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('rect', { x: ex - 14, y: ey - 14, width: hx - ex + 28, height: 28, rx: 14, class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('circle', { cx: ex, cy: ey, r: 7, class: 'fl-ink' }),
                    s('circle', { cx: hx, cy: ey - 36, r: 22, class: 'fl-coral' }),
                    arrow(bx, ey - 10, bx, ey - 110, { color: 'var(--teal)', width: 4.5 }),
                    arrow(hx, ey + 16, hx, ey + 80, { color: 'var(--violet)', width: 4.5 }),
                    s('text', { x: bx + 10, y: ey - 92, class: 'lbl fl-teal', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: 'biceps' }),
                    s('text', { x: hx - 12, y: ey + 64, 'text-anchor': 'end', class: 'lbl fl-violet', style: 'font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px))', text: 'weight W' }),
                    s('text', { x: ex - 26, y: ey + 5, 'text-anchor': 'end', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'elbow' }),
                    s('line', { x1: ex, x2: bx, y1: ey + 26, y2: ey + 26, stroke: 'var(--teal)', 'stroke-width': 2 }),
                    s('text', { x: (ex + bx) / 2, y: ey + 46, 'text-anchor': 'middle', class: 'lbl fl-teal', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: '4 cm' }),
                    s('line', { x1: ex, x2: hx, y1: ey + 96, y2: ey + 96, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }),
                    s('text', { x: (ex + hx) / 2, y: ey + 116, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: '35 cm' }),
                  ];
                },
              },
            },
            {
              type: 'numeric',
              title: 'Holding a ball',
              prompt: r`You hold a 40 N ball (about 4 kg) with your forearm horizontal. Ignoring the forearm's own weight, what force must the biceps provide?`,
              unit: 'N',
              answer: 350,
              tol: 1,
              wrong: [{ v: 40, why: 'The biceps is much closer to the pivot, so it must pull far harder than the weight.' }, { v: 4.57, tol: 0.05, why: r`Balance torques: $F \times 4 = 40 \times 35$.` }],
              explain: r`$F = \frac{40 \times 35}{4} = 350$ N: almost nine times the weight of the ball. Muscles and tendons routinely carry forces many times the loads we handle.`,
            },
            {
              type: 'mcq',
              title: 'A bad design?',
              prompt: r`Why would evolution attach the biceps so close to the elbow, forcing it to pull so hard?`,
              choices: [
                { t: 'A small muscle contraction moves the hand a long way, fast: the lever trades force for speed', ok: true },
                { t: 'It’s a flaw that evolution never fixed', why: 'It’s a trade-off. A short lever arm multiplies speed and range of motion.' },
                { t: 'It makes the biceps stronger', why: 'It makes the biceps pull harder for the same load, which is a cost, not a strength.' },
              ],
              explain: r`When the biceps shortens by 1 cm, the hand moves about $\frac{35}{4} \approx 9$ cm, and 9 times as fast. Fast hands matter for throwing, catching and grabbing: most of our limbs are third-class levers built for speed.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Moving the attachment',
              prompt: r`Now include the forearm's own weight (15 N, acting 15 cm from the elbow), so the biceps force is $\frac{40 \times 35 + 15 \times 15}{d}$. A chimpanzee's biceps attaches farther from the elbow. Drag to find the attachment distance $d$ at which the biceps needs only 250 N.`,
              widget: {
                kind: 'graph', xmin: 2, xmax: 10, ymin: 0, ymax: 900, grid: 1, gridY: 100, height: 280, padL: 48, axes: { xlabel: 'attachment distance d (cm)', ylabel: 'biceps force (N)', xAt: 2 },
                params: { d: { min: 2.5, max: 9.5, step: 0.1, value: 4, slider: false } },
                curves: [{ f: (d) => biceps(d), from: 2, to: 10, color: 'teal', width: 3 }, { f: () => 250, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.d, y: (p) => biceps(p.d), drag: { x: 'd' }, color: 'violet' }],
                readout: (p) => r`$d = ${p.d.toFixed(1)}$ cm: biceps force $${Math.round(biceps(p.d))}$ N, $\;$ hand moves $${(35 / p.d).toFixed(1)}\times$ faster than the muscle`,
                goal: (p) => Math.abs(biceps(p.d) - 250) < 2,
                hint: 'Find where the curve meets the dashed 250 N line.',
                solution: { d: 6.5 },
              },
              explain: r`$d = \frac{1625}{250} = 6.5$ cm. The arm is stronger, but the hand now moves only $\frac{35}{6.5} \approx 5.4$ times faster than the muscle instead of about 9. This is part of why chimpanzees are much stronger than humans for their size, while humans are far better throwers.`,
            },
            {
              type: 'numeric',
              title: 'Standing on tiptoe',
              prompt: r`On tiptoe, your weight (700 N) presses down through the ball of the foot, 15 cm in front of the ankle, while the Achilles tendon pulls up 5 cm behind it. Roughly what force must the tendon supply, in newtons?`,
              unit: 'N',
              answer: 2100,
              explain: r`Torques about the ankle: $T \times 5 = 700 \times 15$, so $T = 2{,}100$ N, three times your weight. Like the biceps, the Achilles tendon trades force for speed and range of movement.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Lifting with your back',
              prompt: r`Bending over to lift, your back muscles act about 5 cm from the pivot in your lower spine, while your upper body (about 400 N) acts about 30 cm away. What force must the back muscles supply just to hold your upper body bent over?`,
              unit: 'N',
              answer: 2400,
              tol: 10,
              wrong: [{ v: 400, why: 'The muscles act much closer to the pivot than the weight does.' }, { v: 66.7, tol: 0.5, why: r`Balance torques: $F \times 5 = 400 \times 30$.` }],
              explain: r`$F = \frac{400 \times 30}{5} = 2400$ N, six times your upper body's weight, before you've even picked anything up. The spine is squeezed by even more. That's why the advice is to lift with a straight back and bent knees, keeping loads close to your body.`,
            },
          ],
          recap: [
            'Limbs are levers: torques about the joint must balance.',
            'Muscles attach close to joints, pulling with many times the load.',
            'The trade-off buys speed and range of motion.',
          ],
        },
        {
          id: 'walking',
          title: 'Walking & Running',
          summary: 'Legs as pendulums',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'An inverted pendulum',
              body: r`When you walk, each leg acts like an upside-down pendulum: your body vaults over the straight planted leg, rising and falling along a circular arc of radius $L$ (your leg length).

Moving along a circle at speed $v$ needs a centripetal acceleration $\frac{v^2}{L}$, and when walking, gravity supplies it. So walking is only possible while
$$\frac{v^2}{L} \le g \quad\Longrightarrow\quad v \le \sqrt{gL}$$
Faster than that, you'd lift off the ground: you have to **run**.`,
            },
            { /*anim:bodyphysics*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Vaulting over a stiff leg',
              body: r`Watch a walker's hips vault over each planted leg (leg length 0.9 m). Speed up and compare the two arrows at the top of each arc: the {coral:acceleration needed to follow the arc}, $v^2/L$, and the {blue:most gravity can provide}, $g$.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.2, xmax: 3.8, ymin: -0.15, ymax: 1.85, grid: false, axes: false, maxWidth: 560,
                animate: { param: 't', speed: 1, max: 1000, autoplay: true },
                params: { v: { min: 0.5, max: 4, step: 0.5, value: 1.5, label: 'walking speed', color: 'coral', format: (v) => `${fix(v, 1)} m/s` } },
                clipExtra: true,
                extra: ({ plot, p, s }) => {
                  const L = 0.9, half = 0.32, step = 2 * half, run = p.v * p.t, n = Math.floor(run / step), u = run / step - n;
                  const shift = (n * step) % (4 * step), foot = shift + step / 2 + 0.2, hx = foot - half + u * step, hy = Math.sqrt(L * L - (hx - foot) ** 2);
                  const X = (x) => plot.X(x), Y = (y) => plot.Y(y), els = [];
                  const lift = p.v * p.v / L > 9.8;
                  els.push(s('line', { x1: X(-0.2), x2: X(3.8), y1: Y(0), y2: Y(0), stroke: 'var(--axis)', 'stroke-width': 2 }));
                  // the arc the hip follows over this foot
                  const arc = [];
                  for (let i = 0; i <= 30; i++) { const x = foot - half + (step * i) / 30; arc.push([X(x), Y(Math.sqrt(L * L - (x - foot) ** 2))]); }
                  els.push(s('path', { d: arc.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(''), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }));
                  // swing leg: swings from the previous footprint to the next one
                  const prev = foot - step, next = foot + step, sw = prev + (next - prev) * u, swy = 0.06 * Math.sin(Math.PI * u);
                  els.push(s('line', { x1: X(hx), y1: Y(hy), x2: X(sw), y2: Y(swy), stroke: 'var(--ink-3)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
                  els.push(s('line', { x1: X(hx), y1: Y(hy), x2: X(foot), y2: Y(0), stroke: lift ? 'var(--coral)' : 'var(--ink)', 'stroke-width': 7, 'stroke-linecap': 'round' }));
                  els.push(s('line', { x1: X(hx), y1: Y(hy), x2: X(hx + 0.05), y2: Y(hy + 0.6), stroke: 'var(--ink)', 'stroke-width': 8, 'stroke-linecap': 'round' }));
                  els.push(s('circle', { cx: X(hx + 0.07), cy: Y(hy + 0.75), r: X(0.11) - X(0), class: 'fl-ink' }));
                  // arrows at the top of the arc, scaled 1 m/s² = 0.03 m
                  const ax = 3.35, top = 1.55, k = 0.03, need = (p.v * p.v) / L;
                  const arr = (x, len, col) => { const y2 = top - len; return [s('line', { x1: X(x), y1: Y(top), x2: X(x), y2: Y(y2) - 6, stroke: `var(--${col})`, 'stroke-width': 4 }), s('path', { d: `M${X(x) - 7} ${Y(y2) - 8}L${X(x) + 7} ${Y(y2) - 8}L${X(x)} ${Y(y2) + 2}Z`, fill: `var(--${col})` })]; };
                  els.push(arr(ax - 0.15, Math.min(1.5, need * k), 'coral'), arr(ax + 0.15, 9.8 * k, 'blue'));
                  const lab = (x, text, col) => s('text', { x: X(x), y: Y(top) - 10, 'text-anchor': 'middle', class: 'halo-text', style: `font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px));font-weight:700;fill:var(--${col})`, text });
                  els.push(lab(ax - 0.17, 'v²/L', 'coral'), lab(ax + 0.17, 'g', 'blue'));
                  return els;
                },
                readout: (p) => { const need = (p.v * p.v) / 0.9; return `needed $v^2/L$ = ${fix(need, 1)} m/s² · gravity $g$ = 9.8 m/s² · ${need > 9.8 ? '**not enough gravity: the walker would take off, so this has to be a run**' : 'gravity can hold the hips on the arc'}`; },
              },
              after: r`To move along a circle of radius $L$ at speed $v$, the hips need a downward acceleration of $v^2/L$ at the top, and only gravity supplies it: the leg can push but never pull. So walking only works while $v^2/L \le g$, that is $v \le \sqrt{gL} \approx 3$ m/s for a 0.9 m leg. In practice people switch to running a little before that, at about 70% of the limit (around 2 m/s), but the limit explains why children break into a run sooner than adults, and why astronauts on the Moon, with a sixth of the gravity, bounded instead of walking.`,
            },
            {
              type: 'numeric',
              title: 'Top walking speed',
              prompt: r`An adult has legs about 0.9 m long. What's their theoretical maximum walking speed, $\sqrt{gL}$? (1 decimal place.)`,
              unit: 'm/s',
              answer: Math.sqrt(G * 0.9),
              tol: 0.05,
              wrong: [{ v: 8.8, tol: 0.1, why: 'Take the square root of gL.' }],
              explain: r`$\sqrt{9.8 \times 0.9} \approx 3.0$ m/s (about 11 km/h). In practice, people switch to running at around 2 m/s, about 70% of this limit, because running becomes more efficient. Race walkers reach about 4 m/s only by swinging their hips to flatten the arc.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Short legs',
              prompt: r`Drag along the Earth curve to find the leg length at which the maximum walking speed is 2 m/s: the walking limit of a small child.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1.3, ymin: 0, ymax: 4, grid: 0.1, gridY: 0.5, height: 280, axes: { xlabel: 'leg length L (m)', ylabel: 'top walking speed (m/s)', xfmt: (v) => v.toFixed(1) },
                params: { L: { min: 0.2, max: 1.2, step: 0.01, value: 0.9, slider: false } },
                curves: [
                  { f: (L) => Math.sqrt(G * L), color: 'teal', width: 3 },
                  { f: (L) => Math.sqrt(1.62 * L), color: 'violet', width: 2, dash: true },
                ],
                points: [{ x: (p) => p.L, y: (p) => Math.sqrt(G * p.L), drag: { x: 'L' }, color: 'coral' }],
                extra: ({ plot, s }) => [
                  s('text', { x: plot.X(1.15), y: plot.Y(Math.sqrt(G * 1.15)) - 10, 'text-anchor': 'middle', class: 'lbl fl-teal', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'Earth' }),
                  s('text', { x: plot.X(1.15), y: plot.Y(Math.sqrt(1.62 * 1.15)) - 10, 'text-anchor': 'middle', class: 'lbl fl-violet', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'Moon' }),
                ],
                readout: (p) => r`$L = ${p.L.toFixed(2)}$ m: top walking speed $${Math.sqrt(G * p.L).toFixed(2)}$ m/s on Earth, $\;${Math.sqrt(1.62 * p.L).toFixed(2)}$ m/s on the Moon`,
                goal: (p) => Math.abs(Math.sqrt(G * p.L) - 2) < 0.02,
                hint: r`Solve $\sqrt{9.8 L} = 2$, or drag until the readout shows 2.00.`,
                solution: { L: 0.41 },
              },
              explain: r`$L = \frac{4}{9.8} \approx 0.41$ m. A small child has to break into a run to keep up with an adult who is strolling. The same physics explains why small animals scurry.`,
            },
            {
              type: 'numeric',
              title: 'Walking on the Moon',
              prompt: r`On the Moon, $g = 1.62$ m/s². What's the top walking speed for an astronaut with 0.9 m legs? (2 decimal places.)`,
              unit: 'm/s',
              answer: Math.sqrt(1.62 * 0.9),
              tol: 0.01,
              wrong: [{ v: 1.458, tol: 0.01, why: 'Take the square root of gL.' }],
              explain: r`$\sqrt{1.62 \times 0.9} \approx 1.21$ m/s: a slow stroll. Apollo astronauts found walking awkward and instead used a bounding, hopping gait to get around, just as this model predicts.`,
            },
            {
              type: 'numeric',
              title: 'Legs as pendulums',
              prompt: r`A swinging leg acts like a pendulum. Modelling it as a uniform rod of length 0.9 m, its natural period is $2\pi\sqrt{\frac{2L}{3g}}$. What is that, in seconds? (2 decimal places.)`,
              unit: 's',
              answer: 2 * Math.PI * Math.sqrt(2 * 0.9 / (3 * 9.8)),
              tol: 0.02,
              explain: r`$T \approx 1.55$ s. Swinging a leg forward takes about half a period, roughly 0.8 s. Strolling at that natural rhythm lets gravity do much of the work; walking faster than the leg’s natural swing takes extra muscular effort.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Springs in your legs',
              prompt: r`In walking, the body trades kinetic and potential energy like a pendulum. What plays the equivalent role in running?`,
              choices: [
                { t: 'Tendons, like the Achilles tendon, stretch on landing and spring back, storing and returning elastic energy', ok: true },
                { t: 'Nothing: all the energy is supplied fresh by the muscles each stride', why: 'Much of it is recycled: stretched tendons return around half the energy of each landing.' },
                { t: 'The arms swinging', why: 'Arm swing helps with balance and twisting, but the main energy store is in the stretched tendons.' },
              ],
              explain: r`Running is like bouncing on a pogo stick. On landing, the Achilles tendon and the arch of the foot stretch, storing elastic energy, and they recoil on push-off. Kangaroos take this to an extreme: above a certain speed, hopping faster costs them hardly any extra energy.`,
            },
          ],
          recap: [
            'Walking is an inverted pendulum: the body vaults over each leg.',
            r`Gravity limits walking to $v \le \sqrt{gL}$, about 3 m/s for adults.`,
            'Running is bouncing on springy tendons.',
          ],
        },
        {
          id: 'eye',
          title: 'The Eye as a Camera',
          summary: 'Focusing with a living lens',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Dioptres',
              body: r`The eye focuses light onto the retina using the curved **cornea** (which does about two-thirds of the bending) and the flexible **lens**. Opticians measure focusing power in **dioptres**: $P = \frac{1}{f}$, with $f$ in metres. Powers simply add, and the lens equation becomes
$$P = \frac{1}{d_o} + \frac{1}{d_i}$$
In a simplified eye, the retina is $d_i = 2$ cm behind the lens. For a distant object ($\frac{1}{d_o} \approx 0$), that needs $P = \frac{1}{0.02} = 50$ D.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Focus on the page',
              prompt: r`You look at a page 25 cm away. Muscles squeeze the lens to make it more powerful. Adjust the eye's power until the rays meet exactly on the retina.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.6, xmax: 3.2, ymin: -1.5, ymax: 1.5, grid: false, axes: false, maxWidth: 560,
                params: { P: { min: 48, max: 60, step: 0.5, value: 50, label: 'power', color: 'violet', format: (v) => `${fix(v, 1)} D` } },
                extra: ({ plot, p, s }) => {
                  const di = eyeImage(p.P);
                  const cx = 1, rx = 1, ry = 1.15;
                  const wall = (y) => cx + rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
                  const els = [
                    s('ellipse', { cx: plot.X(cx), cy: plot.Y(0), rx: plot.X(cx + rx) - plot.X(cx), ry: plot.Y(-ry) - plot.Y(0), class: 'fl-surface', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
                    s('ellipse', { cx: plot.X(0), cy: plot.Y(0), rx: 7 + (p.P - 48) * 0.7, ry: plot.Y(-0.85) - plot.Y(0), class: 'fl-blue', opacity: 0.35, stroke: 'var(--blue)', 'stroke-width': 2 }),
                    s('path', { d: `M${plot.X(wall(0.8))} ${plot.Y(0.8)} Q${plot.X(2.12)} ${plot.Y(0)} ${plot.X(wall(-0.8))} ${plot.Y(-0.8)}`, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 4 }),
                    s('text', { x: plot.X(2.3), y: plot.Y(0.95), class: 'lbl fl-coral', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: 'retina' }),
                    s('text', { x: plot.X(-4.4), y: plot.Y(1.2), class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: '← from a point 25 cm away' }),
                  ];
                  for (const h of [0.7, 0.35, -0.35, -0.7]) {
                    const yIn = (x) => (h * (x + 25)) / 25;
                    const yOut = (x) => h * (1 - x / di);
                    let lo = 0, hi = 3;
                    for (let i = 0; i < 40; i++) {
                      const m = (lo + hi) / 2;
                      if (m < wall(yOut(m))) lo = m; else hi = m;
                    }
                    const xe = lo;
                    els.push(s('path', { d: `M${plot.X(-4.6)} ${plot.Y(yIn(-4.6))} L${plot.X(0)} ${plot.Y(h)} L${plot.X(xe)} ${plot.Y(yOut(xe))}`, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2 }));
                    if (di > xe + 0.02) els.push(s('path', { d: `M${plot.X(xe)} ${plot.Y(yOut(xe))} L${plot.X(di)} ${plot.Y(0)}`, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                  }
                  return els;
                },
                readout: (p) => {
                  const di = eyeImage(p.P);
                  const where = Math.abs(di - 2) < 0.03 ? 'on the retina: sharp!' : di > 2 ? 'behind the retina: blurred' : 'in front of the retina: blurred';
                  return r`power $${fix(p.P, 1)}$ D: rays meet $${di.toFixed(2)}$ cm behind the lens, ${where}`;
                },
                goal: (p) => Math.abs(eyeImage(p.P) - 2) < 0.03,
                hint: r`You need $P = \frac{1}{0.25} + \frac{1}{0.02}$.`,
                solution: { P: 54 },
              },
              explain: r`$P = 4 + 50 = 54$ D. Focusing on a near object needs 4 extra dioptres compared with a distant one. This ability to change power is **accommodation**. Young children can add 10 D or more, but the lens stiffens with age.`,
            },
            {
              type: 'numeric',
              title: 'Short-sighted',
              prompt: r`A short-sighted eye is too powerful: it can focus no farther than 50 cm. A correcting lens must make distant objects look as if they were 50 cm away, so its power is $-\frac{1}{0.5}$. What power of glasses is needed?`,
              unit: 'D',
              answer: -2,
              wrong: [{ v: 2, why: 'The eye is already too strong, so the correcting lens must be diverging: negative power.' }, { v: -0.5, why: 'Power is 1 divided by the distance in metres.' }],
              explain: r`$-2$ D, a diverging lens. Prescriptions for short sight are negative numbers; for long sight, positive. Most short sight comes from an eyeball that's slightly too long.`,
            },
            {
              type: 'numeric',
              title: 'Reading glasses',
              prompt: r`At 60, someone's eye can only add 1 D of accommodation, so they can't focus closer than 1 m. What power of reading glasses lets them read at 25 cm? (Needed: $\frac{1}{0.25}$ D extra; the eye supplies 1 D.)`,
              unit: 'D',
              answer: 3,
              wrong: [{ v: 4, why: 'The eye can still supply 1 D of the 4 D needed.' }, { v: -3, why: 'They need extra converging power: a positive lens.' }],
              explain: r`$4 - 1 = +3$ D. This stiffening of the lens with age (**presbyopia**) happens to everyone, which is why almost all of us need reading glasses eventually.`,
            },
            {
              type: 'numeric',
              title: 'The eye’s focal length',
              prompt: r`The cornea and lens together have a power of about 60 dioptres. What focal length is that, in millimetres? (1 decimal place.)`,
              unit: 'mm',
              answer: 1000 / 60,
              tol: 0.1,
              explain: r`$\frac{1}{60}$ m $\approx 16.7$ mm, about the distance from the eye’s optics to the retina. Most of the focusing (about 40 D) is done by the curved cornea, which is why it stops working underwater.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Blurry underwater',
              prompt: r`Why is everything blurry when you open your eyes underwater, but sharp again with goggles?`,
              choices: [
                { t: 'Water has nearly the same refractive index as the cornea, so the cornea stops bending light; goggles restore the air in front of it', ok: true },
                { t: 'Water scatters the light', why: 'Clear water barely scatters light over short distances. The problem is focusing.' },
                { t: 'The salt irritates the eye', why: 'Even fresh water causes blur. It’s about refraction at the cornea.' },
              ],
              explain: r`The cornea bends light because of the jump in refractive index from air (1.00) to the eye (about 1.38). Water (1.33) nearly removes that jump, erasing about 40 D of power: you become extremely long-sighted. A layer of air in goggles restores it. Some diving birds and seals have specially adapted lenses for this.`,
            },
          ],
          recap: [
            r`Power in dioptres: $P = 1/f$, and $P = \frac{1}{d_o} + \frac{1}{d_i}$.`,
            'The eye adds power (accommodation) to focus on near objects.',
            'Short sight needs negative lenses; long sight and age need positive ones.',
            'The cornea does most of the focusing, but only in air.',
          ],
        },
      ],
    },
  ],
};
