import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed number of decimals, so they never change length (DESIGN.md, Live numbers)
const f1 = (v) => fix(v, 1);
const f2 = (v) => fix(v, 2);

// gravity assist: planet velocity U = (13, 0) km/s, probe arrives with (5, 8) km/s
const assist = (deg) => {
  const rx = 5 - 13, ry = 8, c = Math.cos((deg * Math.PI) / 180), sn = Math.sin((deg * Math.PI) / 180);
  return [13 + rx * c - ry * sn, rx * sn + ry * c];
};
// mass ratio needed for Δv = 4 km/s at exhaust speed ve (km/s)
const massRatio = (ve) => Math.exp(4 / ve);

export default {
  id: 'rockets',
  subject: 'physics',
  title: 'Rockets & Spaceflight',
  level: 'Intermediate',
  cover: 'rockets',
  tagline: 'The rocket equation, staging, orbital manoeuvres, gravity assists, engines and re-entry.',
  description: r`Why are rockets mostly fuel? Why do they come in stages? Why do you slow down to catch up with a space station? Learn the rocket equation, the strange rules of orbital driving, how spacecraft steal speed from planets, why ion engines are patient, and how capsules survive coming home.`,
  prereq: 'Gravity & Orbits',
  chapters: [
    {
      title: 'Getting Up There',
      summary: 'Thrust and the rocket equation.',
      lessons: [
        {
          id: 'thrust',
          title: 'How Rockets Push',
          summary: 'Momentum, not air',
          icon: 'flame',
          steps: [
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'Pushing on nothing',
              prompt: r`In the vacuum of space there's no air to push against. How does a rocket accelerate?`,
              choices: [
                { t: 'It throws exhaust backwards; by conservation of momentum, the rocket moves forwards', ok: true },
                { t: 'It can’t: rockets only work in air', why: 'Rockets work best in a vacuum. They don’t need anything to push against.' },
                { t: 'The exhaust pushes against the launch pad', why: 'The pad is long gone once the rocket is in space, and it keeps accelerating.' },
              ],
              explain: r`A rocket is like a person on frictionless ice throwing heavy balls backwards: each throw pushes them forwards. The total momentum of rocket plus exhaust stays zero (if it started at rest), so as exhaust rushes back, the rocket moves forward. No air required.`,
            },
            {
              type: 'explain',
              title: 'Thrust',
              body: r`If a rocket expels mass at a rate $\dot m$ (kg per second) with exhaust speed $v_e$ relative to the rocket, the push it gets is
$$F = \dot m\, v_e$$
That's just "momentum thrown out per second". So rockets want **fast** exhaust. Chemical rockets reach $v_e \approx 3$–$4.5$ km/s, and ion engines reach 20–50 km/s, but only with tiny mass flow.`,
            },
            {
              type: 'numeric',
              title: 'A big engine',
              prompt: r`An engine burns 2,500 kg of propellant per second with an exhaust speed of 3,000 m/s. What is its thrust, in meganewtons (MN)?`,
              unit: 'MN',
              answer: 7.5,
              wrong: [{ v: 7500000, why: 'That’s in newtons. 1 MN = 1,000,000 N.' }, { v: 0.83, tol: 0.01, why: r`Multiply, don't divide: $F = \dot m\, v_e$.` }],
              explain: r`$F = 2500 \times 3000 = 7.5 \times 10^6$ N $= 7.5$ MN, about the thrust of one of the giant F-1 engines that powered the Saturn V's first stage (it had five).`,
            },
            {
              type: 'numeric',
              title: 'Thrust-to-weight',
              prompt: r`The Saturn V produced about 35 MN of thrust at lift-off and weighed about 2,900 tonnes. What was its thrust-to-weight ratio? ($g = 9.8$ m/s²; 2 decimal places.)`,
              answer: 35e6 / (2.9e6 * 9.8),
              tol: 0.01,
              wrong: [{ v: 12.1, tol: 0.2, why: r`Convert tonnes to kg and multiply by $g$ to get the weight in newtons.` }],
              explain: r`$\frac{3.5 \times 10^7}{2.9 \times 10^6 \times 9.8} \approx 1.23$. Only 23% of the thrust accelerated the rocket at first, so it rose painfully slowly, but as fuel burned off the ratio climbed steeply.`,
            },
            {
              type: 'interactive',
              title: 'Enough to climb',
              body: r`A 300 t rocket’s engines throw out exhaust at 3,000 m/s, so the thrust is $F = \dot m\, v_e$, where $\dot m$ is the mass of propellant burned each second. Find the burn rate that gives a lift-off acceleration of **half a g** (net upward force $= 0.5\,mg$).`,
              widget: {
                kind: 'graph', xmin: -3, xmax: 3, ymin: -4, ymax: 6, grid: false, axes: false, maxWidth: 300, height: 320,
                params: { md: { min: 500, max: 2500, step: 10, value: 800, label: 'burn rate', color: 'coral', format: (v) => `${v.toLocaleString('en-US')} kg/s` } },
                extra: ({ plot, p, s, arrow }) => { const T = p.md * 3000, Wt = 300000 * 9.8, k = 3 / Wt; return [s('path', { d: `M${plot.X(-0.5)} ${plot.Y(-1)} L${plot.X(-0.5)} ${plot.Y(3)} L${plot.X(0)} ${plot.Y(4.2)} L${plot.X(0.5)} ${plot.Y(3)} L${plot.X(0.5)} ${plot.Y(-1)} Z`, class: 'fl-card', stroke: 'var(--ink-2)', 'stroke-width': 2 }), s('path', { d: `M${plot.X(-0.4)} ${plot.Y(-1)} L${plot.X(0)} ${plot.Y(-1 - Math.min(3, T * k * 0.7))} L${plot.X(0.4)} ${plot.Y(-1)} Z`, class: 'fl-amber' }), arrow(plot.X(1.3), plot.Y(1), plot.X(1.3), plot.Y(1 + Math.min(4.8, T * k)), { color: 'var(--teal)', width: 4 }), arrow(plot.X(-1.3), plot.Y(1), plot.X(-1.3), plot.Y(1 - Wt * k), { color: 'var(--coral)', width: 4 })]; },
                readout: (p) => { const T = p.md * 3000, a = (T - 300000 * 9.8) / 300000; return `thrust (teal) **${(T / 1e6).toFixed(2)} MN** · weight (coral) 2.94 MN · ${a > 0 ? `acceleration **${a.toFixed(2)} m/s² = ${(a / 9.8).toFixed(2)} g**` : 'not enough to lift off'}`; },
                goal: (p) => Math.abs((p.md * 3000 - 300000 * 9.8) / 300000 / 9.8 - 0.5) < 0.005,
                hint: 'The thrust must be 1.5 times the weight: 1.5 × 300,000 × 9.8 N.',
                solution: { md: 1470 },
              },
              explain: r`Thrust $= 1.5 \times 2.94$ MN $= 4.41$ MN, so $\dot m = 4.41 \times 10^6 / 3000 = 1{,}470$ kg/s: over a tonne of propellant every second. As the propellant burns away the rocket gets lighter, so the same thrust gives ever more acceleration.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Lift-off',
              prompt: r`A 500-tonne rocket has engines producing 7.5 MN of thrust. What's its acceleration just after lift-off? (Weight = $mg$ with $g = 9.8$ m/s²; 1 decimal place.)`,
              unit: 'm/s²',
              answer: (7.5e6 - 5e5 * 9.8) / 5e5,
              tol: 0.06,
              wrong: [{ v: 15, why: 'Subtract the weight first: the engines must also hold the rocket up.' }],
              explain: r`Net force $= 7.5 \times 10^6 - 5 \times 10^5 \times 9.8 = 2.6 \times 10^6$ N, so $a = 5.2$ m/s². Launches start slowly, then accelerate harder and harder as fuel burns off and the rocket gets lighter.`,
            },
          ],
          recap: [
            'Rockets push by throwing mass backwards: conservation of momentum.',
            r`Thrust $F = \dot m\, v_e$.`,
            'Faster exhaust means more push per kilogram of propellant.',
          ],
        },
        {
          id: 'rocket-equation',
          title: 'The Rocket Equation',
          summary: 'The tyranny of the logarithm',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Tsiolkovsky’s equation',
              body: r`As a rocket burns fuel it gets lighter, so each kilogram of fuel gives more speed than the last. Adding up the tiny pushes (an integral) gives the **rocket equation**, found by Konstantin Tsiolkovsky in 1903:
$$\Delta v = v_e \ln\frac{m_0}{m_f}$$
- $\Delta v$: the change in speed the rocket can achieve;
- $m_0$: starting mass (with fuel); $m_f$: final mass (fuel used up);
- $m_0/m_f$: the **mass ratio**.

Because of the logarithm, more speed requires **exponentially** more fuel.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Reaching orbit',
              prompt: r`Getting to low Earth orbit needs about $\Delta v = 9.4$ km/s (7.8 km/s of orbital speed, plus losses to gravity and air). With hydrogen–oxygen engines ($v_e = 4.4$ km/s), find the **smallest** mass ratio (to the nearest 0.5) that gets there.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 20, ymin: 0, ymax: 14, grid: 2, gridY: 2, height: 320, axes: { xlabel: 'mass ratio', ylabel: 'Δv (km/s)' },
                params: { R: { min: 1.5, max: 20, step: 0.5, value: 4, label: 'mass ratio', color: 'blue', format: (v) => f1(v) } },
                curves: [{ f: (x) => 4.4 * Math.log(x), color: 'blue' }, { f: () => 9.4, color: 'coral', dash: true }],
                points: [{ x: (p) => p.R, y: (p) => 4.4 * Math.log(p.R), color: 'blue' }],
                readout: (p) => {
                  const dv = 4.4 * Math.log(p.R);
                  return r`$\Delta v = 4.4 \ln(${f1(p.R)}) = ${f2(dv)}$ km/s ${dv >= 9.4 ? '✓ orbit!' : ''} $\;$ (fuel is ${Math.round((1 - 1 / p.R) * 100)}% of the starting mass)`;
                },
                goal: (p) => 4.4 * Math.log(p.R) >= 9.4 && 4.4 * Math.log(p.R - 0.5) < 9.4,
                hint: r`Solve $\ln R = 9.4 / 4.4$, so $R = e^{2.14}$.`,
                solution: { R: 8.5 },
              },
              explain: r`$R = e^{9.4/4.4} = e^{2.14} \approx 8.5$. So about **88%** of the rocket's starting mass must be propellant, leaving just 12% for tanks, engines, structure **and** payload. Rockets are basically flying fuel tanks.`,
            },
            {
              type: 'numeric',
              title: 'Kerosene',
              prompt: r`With kerosene engines ($v_e \approx 3.0$ km/s), what mass ratio is needed for the same 9.4 km/s? (Nearest whole number.)`,
              answer: Math.exp(9.4 / 3),
              tol: 1,
              wrong: [{ v: 3.1, tol: 0.1, why: r`That's $9.4 / 3$, the logarithm of the mass ratio. Now take $e$ to that power.` }, { v: 8.5, tol: 0.5, why: 'That’s for hydrogen engines. Slower exhaust needs a much bigger ratio.' }],
              explain: r`$R = e^{9.4/3.0} = e^{3.13} \approx 23$: about **96%** fuel. A modest drop in exhaust speed makes the job vastly harder. That's the "tyranny of the rocket equation", and it's why no rocket reaches orbit in one piece with today's chemistry and materials.`,
            },
            {
              type: 'numeric',
              title: 'Methane engines',
              prompt: r`Modern methane–oxygen engines reach an exhaust speed of about 3.7 km/s. What mass ratio $m_0/m_f = e^{\Delta v / v_e}$ would a single stage need for the same 9.4 km/s? (Nearest whole number.)`,
              answer: Math.exp(9.4 / 3.7),
              tol: 0.6,
              wrong: [{ v: 9.4 / 3.7, tol: 0.02, why: r`That’s the exponent. Take $e$ to that power.` }],
              explain: r`$e^{9.4/3.7} = e^{2.54} \approx 13$: about 92% propellant, between kerosene (23) and hydrogen (8.5). Methane is denser than hydrogen and burns cleaner than kerosene, which suits reusable rockets.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen fuel',
              prompt: r`Hydrogen–oxygen engines have an exhaust speed of about 4.4 km/s. What $\Delta v$ does a mass ratio of 8 give, in km/s? (2 decimal places.)`,
              unit: 'km/s',
              answer: 4.4 * Math.log(8),
              tol: 0.02,
              explain: r`$4.4 \ln 8 \approx 9.15$ km/s, nearly enough for orbit with a single stage. But liquid hydrogen is very bulky, so tanks are heavy, which eats into the mass ratio.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'What’s left for cargo?',
              prompt: r`A single-stage hydrogen rocket needs a mass ratio of 8.5 to reach orbit, so its final mass is $\frac{1}{8.5}$ of its starting mass. If the empty tanks, engines and structure alone make up 10% of the starting mass, what percentage is left for payload? (1 decimal place.)`,
              unit: '%',
              answer: 100 / 8.5 - 10,
              tol: 0.06,
              wrong: [{ v: 100 / 8.5, tol: 0.06, why: r`That's the whole final mass, $\frac{1}{8.5} \approx 11.8\%$. The tanks, engines and structure take 10% of it.` }],
              explain: r`The final mass is $\frac{100\%}{8.5} \approx 11.8\%$ of the start; take away 10% for the rocket itself and only about **1.8%** is payload. A little extra structure would leave nothing at all. That's why real rockets use **stages**, dropping empty tanks and engines on the way up so the rest doesn't have to keep pushing them.`,
            },
          ],
          recap: [
            r`Rocket equation: $\Delta v = v_e \ln(m_0/m_f)$.`,
            'Orbit needs about 9.4 km/s, so rockets are mostly propellant.',
            'Lower exhaust speed means an exponentially larger mass ratio.',
          ],
        },
        {
          id: 'staging',
          title: 'Staging',
          summary: 'Why rockets drop pieces',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Throwing away dead weight',
              body: r`Once a fuel tank is empty, it's just dead weight that the engines must keep accelerating. **Staging** solves this: a rocket is built as a stack of smaller rockets. When the bottom stage runs dry, it's dropped, and the next stage carries on with a much lighter load.

The speed gains from each stage **add up**:
$$\Delta v_{\text{total}} = v_e \ln R_1 + v_e \ln R_2 + \dots$$`,
            },
            {
              type: 'numeric',
              title: 'Two stages',
              prompt: r`Each stage of a two-stage rocket has a mass ratio of 4, with $v_e = 3.5$ km/s. What's the total $\Delta v$? (1 decimal place.)`,
              unit: 'km/s',
              answer: 2 * 3.5 * Math.log(4),
              tol: 0.06,
              wrong: [{ v: 4.85, tol: 0.06, why: 'That’s one stage. The stages’ Δv values add up.' }, { v: 7.3, tol: 0.06, why: r`Check the logarithm: $\ln 4 \approx 1.386$, so each stage gives $3.5 \times 1.386 \approx 4.85$ km/s.` }],
              explain: r`Each stage gives $3.5 \ln 4 \approx 4.85$ km/s, so together they give $\approx 9.7$ km/s: enough for orbit. A single stage would need a mass ratio of $4 \times 4 = 16$ to match, which is much harder to build, because the tanks and engines alone weigh too much.`,
            },
            {
              type: 'numeric',
              title: 'Three stages',
              prompt: r`A three-stage rocket has a mass ratio of 3 in each stage and $v_e = 3.5$ km/s. What's its total $\Delta v$? (1 decimal place.)`,
              unit: 'km/s',
              answer: 3 * 3.5 * Math.log(3),
              tol: 0.06,
              wrong: [{ v: 3.5 * Math.log(3), tol: 0.06, why: 'That’s one stage; add all three.' }],
              explain: r`$3 \times 3.5 \ln 3 \approx 11.5$ km/s. A single stage would need a mass ratio of $3^3 = 27$ to match.`,
            },
            {
              type: 'mcq',
              title: 'Why not ten stages?',
              prompt: r`If two stages beat one and three beat two, why don’t rockets use ten stages?`,
              choices: [
                { t: r`Each stage adds engines, structure and complexity, and the gains shrink with every extra stage`, ok: true },
                { t: r`The rocket equation forbids it`, why: r`The equation actually favours more stages; the practical costs are what stop it.` },
                { t: r`There isn’t room for more engines`, why: r`Space isn’t the problem. Extra engines, tanks, separation systems and failure points add up.` },
              ],
              explain: r`The first extra stage helps enormously, the next less, and so on, while every stage brings heavy engines, separation hardware and more chances to fail. Two or three stages is the usual sweet spot; reusable rockets push designers toward fewer, larger stages.`,
            },
            {
              type: 'interactive',
              title: 'The tyranny of the rocket equation',
              body: r`A rocket’s total speed change is $\Delta v = v_e \ln\frac{m_0}{m_f}$, where $m_0/m_f$ is the ratio of full to empty mass. Reaching low orbit takes about **9.4 km/s** (including losses to gravity and drag). With $v_e = 3.5$ km/s, find the mass ratio a single stage would need.`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 25, ymin: 0, ymax: 12, grid: false, height: 260, axes: { xlabel: 'mass ratio (full ÷ empty)', ylabel: 'Δv (km/s)', xticks: 4, yticks: 2, xAt: 1, yAt: 0 },
                params: { R: { min: 1, max: 25, step: 0.1, value: 5, label: 'mass ratio', color: 'coral', format: (v) => v.toFixed(1) } },
                curves: [{ f: (x) => 3.5 * Math.log(x), color: 'violet', width: 3 }, { f: () => 9.4, color: 'teal', dash: true }],
                points: [{ x: (p) => p.R, y: (p) => 3.5 * Math.log(p.R), color: 'coral' }],
                readout: (p) => `Δv = **${(3.5 * Math.log(p.R)).toFixed(2)} km/s** · propellant is **${(100 * (1 - 1 / p.R)).toFixed(1)}%** of the launch mass`,
                goal: (p) => Math.abs(3.5 * Math.log(p.R) - 9.4) < 0.05,
                hint: 'm₀/m_f = e^(9.4/3.5).',
                solution: { R: 14.7 },
              },
              explain: r`$e^{9.4/3.5} \approx 14.7$: **93%** of the rocket must be propellant, leaving 7% for tanks, engines, structure **and** payload. The logarithm means each extra km/s multiplies the mass ratio, which is why real rockets drop empty stages on the way up.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Saturn V',
              prompt: r`The Saturn V weighed about 2,900 tonnes at launch and could put about 140 tonnes into low Earth orbit. What fraction of its launch mass reached orbit?`,
              cols: 2,
              choices: [
                { t: 'About 5%', ok: true },
                { t: 'About 50%', why: r`$140 / 2900 \approx 0.048$.` },
                { t: 'About 0.5%', why: r`$140 / 2900 \approx 0.048$, nearly 5%.` },
                { t: 'About 20%', why: r`$140 / 2900$ is less than a tenth.` },
              ],
              explain: r`$140 / 2900 \approx 5\%$. Even with three stages, about 95% of the launch mass was propellant and discarded hardware. Reusable boosters, which fly back and land, attack the cost problem by recovering the expensive hardware instead of throwing it away.`,
            },
          ],
          recap: [
            'Staging drops empty tanks so later stages push less dead weight.',
            r`Stage $\Delta v$ values add: $\Delta v = \sum v_e \ln R_i$.`,
            'Only a few percent of a rocket’s launch mass reaches orbit.',
          ],
        },
      ],
    },
    {
      title: 'Moving Around Up There',
      summary: 'Orbital driving lessons.',
      lessons: [
        {
          id: 'orbital',
          title: 'Orbital Manoeuvres',
          summary: 'Slow down to speed up',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Faster when lower',
              body: r`For a circular orbit, gravity provides the centripetal force: $\dfrac{GMm}{r^2} = \dfrac{mv^2}{r}$, so
$$v = \sqrt{\frac{GM}{r}}$$
**Lower orbits are faster.** The International Space Station, about 400 km up, circles Earth every 92 minutes. The Moon, 384,000 km away, takes about 27 days.`,
            },
            {
              type: 'mcq',
              title: 'Catching the station',
              prompt: r`Your capsule is in the same circular orbit as the space station, but 50 km **behind** it. To catch up, what should you do first?`,
              choices: [
                { t: 'Fire your engine backwards (slow down), dropping into a lower, faster orbit', ok: true },
                { t: 'Fire forwards to speed up', why: 'Speeding up raises your orbit, where you move more slowly, so you fall even further behind.' },
                { t: 'Point at the station and fire straight at it', why: 'That would put you into a new orbit that curves away. In orbit, you can’t just point and go.' },
              ],
              explain: r`Braking drops you into a slightly **lower** orbit, which is **faster**, so you gain on the station. Then you burn forward to rise back up to match it. In orbit, "slow down to speed up" really works. Early Gemini astronauts discovered this the hard way.`,
            },
            {
              type: 'explain',
              title: 'Hohmann transfers',
              body: r`To move from a low orbit to a higher one, the most fuel-efficient two-burn route is the **Hohmann transfer** (1925): one burn forward to stretch the orbit into an ellipse that just touches the higher orbit, then a second burn at the top to circularise. Missions to Mars use the same idea between the orbits of Earth and Mars, which is why launch windows come only about every 26 months, when the planets line up.`,
            },
            {
              type: 'numeric',
              title: 'Around in 90 minutes',
              prompt: r`The ISS orbits about 400 km up, so its orbital radius is $r = 6{,}771$ km. Using $T = 2\pi\sqrt{r^3 / GM}$ with $GM = 3.986 \times 10^{14}$ m³/s², what is its period in minutes? (Nearest minute.)`,
              unit: 'min',
              answer: 2 * Math.PI * Math.sqrt((6771e3) ** 3 / 3.986e14) / 60,
              tol: 0.6,
              wrong: [{ v: 5545, tol: 10, why: r`That’s in seconds. Divide by 60.` }],
              explain: r`$T \approx 5{,}545$ s $\approx 92$ minutes. The astronauts see 16 sunrises and sunsets every day.`,
            },
            {
              type: 'interactive',
              title: 'A geostationary orbit',
              body: r`A circular orbit at height $h$ has period $T = 2\pi\sqrt{\frac{(R+h)^3}{GM}}$. A satellite that orbits once per **sidereal day** (23 h 56 min) stays above the same spot on the equator. Find that height.`,
              widget: {
                kind: 'graph', equal: true, xmin: -50000, xmax: 50000, ymin: -50000, ymax: 50000, grid: false, axes: false, maxWidth: 340,
                params: { h: { min: 200, max: 45000, step: 10, value: 10000, label: 'height', color: 'violet', format: (v) => `${v.toLocaleString('en-US')} km` } },
                extra: ({ plot, p, s }) => { const r = 6371 + p.h; return [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(6371) - plot.X(0), class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(r) - plot.X(0), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }), s('circle', { cx: plot.X(r), cy: plot.Y(0), r: 7, class: 'fl-coral' })]; },
                readout: (p) => { const r = (6371 + p.h) * 1000, T = 2 * Math.PI * Math.sqrt(r ** 3 / 3.986e14); return `period **${(T / 3600).toFixed(2)} h** · speed ${(Math.sqrt(3.986e14 / r) / 1000).toFixed(2)} km/s`; },
                goal: (p) => { const r = (6371 + p.h) * 1000, T = 2 * Math.PI * Math.sqrt(r ** 3 / 3.986e14); return Math.abs(T / 3600 - 23.934) < 0.02; },
                hint: 'Solve for R + h = (GM T² / 4π²)^(1/3), with T = 86,164 s, then subtract 6,371 km.',
                solution: { h: 35790 },
              },
              explain: r`About **35,800 km** up, nearly six Earth radii, moving at 3.07 km/s. From the ground such a satellite seems to hang motionless, so a dish can stay pointed at it: that is where TV and weather satellites live. Lower orbits are faster: the ISS laps Earth in 92 minutes.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Orbit speed',
              prompt: r`Using $v = \sqrt{GM/r}$ with $GM = 3.99 \times 10^{14}$ m³/s² for Earth and $r = 6{,}780$ km (the ISS's distance from Earth's centre), find the ISS's orbital speed in km/s. (1 decimal place.)`,
              unit: 'km/s',
              answer: Math.sqrt(3.99e14 / 6.78e6) / 1000,
              tol: 0.06,
              wrong: [{ v: 242, tol: 3, why: r`Convert $r$ to metres: 6,780 km $= 6.78 \times 10^6$ m.` }, { v: 58.8, tol: 1, why: r`Take the square root: that's $GM/r$ in units of $10^6$ m²/s².` }],
              explain: r`$v = \sqrt{\dfrac{3.99 \times 10^{14}}{6.78 \times 10^{6}}} = \sqrt{5.88 \times 10^7} \approx 7{,}670$ m/s $\approx 7.7$ km/s: about 27,600 km/h, crossing the Atlantic in roughly 12 minutes.`,
            },
          ],
          recap: [
            r`Circular orbit speed $v = \sqrt{GM/r}$: lower orbits are faster.`,
            'To catch something ahead in your orbit, slow down first.',
            'Hohmann transfers use two burns to move between orbits efficiently.',
          ],
        },
        {
          id: 'gravity-assist',
          title: 'Gravity Assists',
          summary: 'Stealing speed from planets',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'The slingshot',
              body: r`A spacecraft flying past a planet swings around it. **In the planet's frame**, the craft leaves with the same speed it arrived with: gravity just bends its path. But the planet is moving around the Sun. If the craft swings around **behind** the planet, it comes out carrying some of the planet's motion, gaining speed in the Sun's frame.

It's like a tennis ball bouncing off the front of a moving train: it leaves faster than it arrived.`,
            },
            {
              type: 'mcq',
              title: 'Where does the energy come from?',
              prompt: r`A gravity assist adds kinetic energy to the spacecraft. Where does it come from?`,
              choices: [
                { t: 'From the planet’s orbital motion: the planet slows down by an immeasurably tiny amount', ok: true },
                { t: 'From the spacecraft’s fuel', why: 'No fuel is needed for the assist itself: it’s a free boost from gravity.' },
                { t: 'Nowhere: energy isn’t conserved in gravity assists', why: 'Energy is conserved. The planet pays for the boost.' },
              ],
              explain: r`Momentum and energy are conserved: the planet loses exactly what the spacecraft gains. But Jupiter is about $10^{24}$ times heavier than a probe, so its change in speed is utterly negligible.`,
            },
            {
              type: 'numeric',
              title: 'Head-on bounce',
              prompt: r`A ball approaches a train head-on at 10 m/s while the train moves towards it at 30 m/s. After a perfect bounce, how fast is the ball moving (relative to the ground)?`,
              unit: 'm/s',
              answer: 70,
              wrong: [{ v: 10, why: 'Relative to the train it arrives at 40 m/s and leaves at 40 m/s; add the train’s 30 m/s.' }, { v: 40, why: 'That’s relative to the train. Add the train’s own speed.' }],
              explain: r`Relative to the train: in at $10 + 30 = 40$ m/s, out at 40 m/s. Relative to the ground: $40 + 30 = 70$ m/s. The maximum gain is twice the train's speed.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Plan a flyby',
              prompt: r`Jupiter moves at 13 km/s (to the right). A probe arrives with velocity (5, 8) km/s. The flyby rotates its velocity **relative to Jupiter** by an angle you choose (set by how it passes the planet). Find the deflection that gives the **fastest** departure from the Sun's point of view.`,
              widget: {
                kind: 'graph', equal: true, xmin: -6, xmax: 26, ymin: -10, ymax: 12, grid: 2, axes: false, maxWidth: 560,
                params: { del: { min: -180, max: 180, step: 5, value: 0, label: 'deflection', color: 'violet', format: (v) => `${v}°` } },
                extra: ({ plot, p, s, arrow }) => {
                  const o = assist(p.del), v = (x0, y0, x1, y1, c, w = 4) => arrow(plot.X(x0), plot.Y(y0), plot.X(x1), plot.Y(y1), { color: `var(--${c})`, width: w, head: 13 });
                  return [
                    v(0, 0, 13, 0, 'amber'),
                    v(13, 0, 13 + (5 - 13) * Math.cos(p.del * Math.PI / 180) - 8 * Math.sin(p.del * Math.PI / 180), (5 - 13) * Math.sin(p.del * Math.PI / 180) + 8 * Math.cos(p.del * Math.PI / 180), 'teal', 3),
                    v(0, 0, o[0], o[1], 'violet', 5),
                    v(0, 0, 5, 8, 'ink-3', 2.5),
                    s('text', { x: plot.X(6.5), y: plot.Y(0) + 18, 'text-anchor': 'middle', class: 'lbl fl-amber', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'Jupiter 13' }),
                    s('text', { x: plot.X(5), y: plot.Y(8) - 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'arriving' }),
                  ];
                },
                readout: (p) => { const o = assist(p.del); return r`departure speed $${Math.hypot(o[0], o[1]).toFixed(2)}$ km/s (arrived at $${Math.hypot(5, 8).toFixed(2)}$ km/s)`; },
                goal: (p) => Math.hypot(...assist(p.del)) > 24.3,
                hint: 'The departure velocity is Jupiter’s velocity plus the rotated relative velocity (teal). Make them point the same way.',
                solution: { del: -135 },
              },
              explain: r`Turning the relative velocity by $-135°$ lines it up with Jupiter's motion: $13 + 11.3 \approx 24.3$ km/s, up from 9.4 km/s. The probe has stolen orbital energy from Jupiter (which slows down by an immeasurably tiny amount). Voyager 2 used assists at Jupiter, Saturn and Uranus to reach Neptune in 12 years instead of 30.`,
            },
            {
              type: 'mcq',
              title: 'Speeding up or slowing down',
              prompt: r`A spacecraft swings past a planet. When does the flyby speed it up (relative to the Sun)?`,
              choices: [
                { t: r`When it passes behind the planet, relative to the planet’s motion around the Sun`, ok: true },
                { t: r`Always: gravity always speeds things up`, why: r`Relative to the planet, speed is unchanged; relative to the Sun it can go up or down.` },
                { t: r`When it passes in front of the planet`, why: r`Passing in front slows the spacecraft; missions to Mercury use this to brake.` },
              ],
              explain: r`Passing behind, the spacecraft is dragged along in the planet’s direction of motion and gains energy (the planet loses a tiny amount). Passing in front does the reverse, which is how MESSENGER and BepiColombo shed speed on their way to Mercury.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The Grand Tour',
              prompt: r`The two Voyager probes launched in 1977. Why was that year special?`,
              choices: [
                { t: 'The outer planets were lined up so one probe could slingshot from planet to planet', ok: true },
                { t: 'It was the first year rockets could reach the outer planets', why: 'Earlier probes (Pioneer 10 and 11) had already flown past Jupiter.' },
                { t: 'The Sun’s gravity was weakest that year', why: 'The Sun’s gravity doesn’t change from year to year. It was about planetary alignment.' },
              ],
              explain: r`A rare alignment of Jupiter, Saturn, Uranus and Neptune, recurring roughly every 175 years, let Voyager 2 use each planet to fling it to the next. It's still the only spacecraft to have visited Uranus and Neptune. Both Voyagers are now in interstellar space, travelling at about 15–17 km/s.`,
            },
          ],
          recap: [
            'In the planet’s frame the flyby speed is unchanged. In the Sun’s frame, it can increase.',
            'The planet loses an immeasurably small amount of orbital energy.',
            'Gravity assists sent Voyager 2 past all four giant planets.',
          ],
        },
      ],
    },
    {
      title: 'Engines and Re-entry',
      summary: 'Better exhaust, and getting home.',
      lessons: [
        {
          id: 'engines',
          title: 'Engines Compared',
          summary: 'Exhaust speed is everything',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Specific impulse',
              body: r`Engineers rate engines by their **specific impulse**, $I_{sp} = \frac{v_e}{g_0}$, measured in seconds ($g_0 = 9.81$ m/s²). It's the number of seconds one kilogram of propellant could produce a thrust equal to its own weight. Higher is better:
- solid boosters: about 250 s;
- kerosene–oxygen: about 300 s;
- hydrogen–oxygen: about 450 s;
- ion engines: 3,000 s or more.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen’s rating',
              prompt: r`A hydrogen–oxygen engine has $v_e = 4.4$ km/s. What's its specific impulse, in seconds? (Nearest whole number.)`,
              unit: 's',
              answer: Math.round(4400 / 9.81),
              tol: 1,
              wrong: [{ v: 0.45, tol: 0.01, why: 'Use metres per second: 4,400 m/s ÷ 9.81.' }],
              explain: r`$\frac{4400}{9.81} \approx 449$ s. Hydrogen gives the fastest chemical exhaust because its molecules are so light: at a given temperature, lighter molecules move faster.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Halve the fuel',
              prompt: r`A spacecraft needs $\Delta v = 4$ km/s (roughly what it takes to get from low Earth orbit to a path heading for Mars). Drag to the exhaust speed at which the mass ratio is just **2**, so half the starting mass is propellant.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 10, grid: 2, gridY: 1, height: 260, axes: { xlabel: 'exhaust speed (km/s)', ylabel: 'mass ratio needed' },
                params: { ve: { min: 1, max: 20, step: 0.01, value: 3, slider: false } },
                curves: [{ f: (x) => (x > 0.3 ? massRatio(x) : NaN), color: 'violet', width: 3 }, { f: () => 2, color: 'coral', dash: true, width: 1.5 }],
                points: [{ x: (p) => p.ve, y: (p) => Math.min(10, massRatio(p.ve)), drag: { x: 've' }, color: 'teal' }],
                readout: (p) => r`$v_e = ${p.ve.toFixed(2)}$ km/s: mass ratio $e^{4/${p.ve.toFixed(2)}} = ${massRatio(p.ve).toFixed(2)}$, propellant $${(100 * (1 - 1 / massRatio(p.ve))).toFixed(0)}\%$`,
                goal: (p) => Math.abs(massRatio(p.ve) - 2) < 0.01,
                hint: r`Solve $e^{4/v_e} = 2$: $v_e = \frac{4}{\ln 2}$.`,
                solution: { ve: 5.77 },
              },
              explain: r`$v_e = \frac{4}{\ln 2} \approx 5.8$ km/s, faster than any chemical rocket. At 3 km/s the mass ratio is 3.8 (74% propellant), while an ion engine at 30 km/s needs only 13% propellant.`,
            },
            {
              type: 'mcq',
              title: 'Why not ion engines everywhere?',
              prompt: r`Ion engines have exhaust speeds 10 times higher than chemical rockets. Why can't they launch rockets from the ground?`,
              choices: [
                { t: 'Their thrust is tiny, a fraction of a newton, far too weak to lift anything against gravity', ok: true },
                { t: 'They only work in the dark', why: 'Many are solar-powered! The issue is their minuscule thrust.' },
                { t: 'Their exhaust is too slow', why: 'Their exhaust is very fast; their mass flow is tiny, so thrust is small.' },
              ],
              explain: r`An ion engine pushes about as hard as the weight of a sheet of paper. In space that's fine if you're patient: thrusting for months adds up to huge speed changes. Launching from Earth needs thrust greater than the rocket's weight, which only chemical rockets can provide.`,
            },
            {
              type: 'numeric',
              title: 'Patience pays',
              prompt: r`NASA's Dawn probe (about 1,200 kg) used an ion engine with 0.09 N of thrust. Ignoring the small change in mass, how much speed would it gain from a year of continuous thrusting ($3.15 \times 10^7$ s)? (km/s, 1 decimal place.)`,
              unit: 'km/s',
              answer: (0.09 / 1200) * 3.15e7 / 1000,
              tol: 0.06,
              wrong: [{ v: (0.09 / 1200) * 3.15e7, relTol: 0.01, why: 'That’s in m/s. Convert to km/s.' }],
              explain: r`$a = \frac{0.09}{1200} = 7.5 \times 10^{-5}$ m/s², and over a year $\Delta v \approx 2.4$ km/s. Over its mission Dawn gained about 11 km/s, more than any other spacecraft's own engine, visiting both Vesta and Ceres.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Hot and light',
              prompt: r`In a "nuclear thermal" rocket, a reactor heats pure hydrogen to about 2,500 °C and expels it, reaching $v_e \approx 9$ km/s. Why use hydrogen alone rather than, say, water vapour heated to the same temperature?`,
              choices: [
                { t: 'At the same temperature, lighter molecules move faster, so hydrogen gives the fastest exhaust', ok: true },
                { t: 'Water would put out the reactor', why: 'The reason is molecular mass: speed goes as 1/√m at a given temperature.' },
                { t: 'Hydrogen is cheaper', why: 'Liquid hydrogen is actually tricky and costly to store. Its advantage is speed.' },
              ],
              explain: r`Thermal speed $\propto \sqrt{T/m}$: H₂ (mass 2) is 3 times faster than H₂O (mass 18) at the same temperature. Nuclear thermal rockets were tested on the ground in the 1960s (NERVA) and are being studied again for crewed Mars missions.`,
            },
          ],
          recap: [
            r`Specific impulse $I_{sp} = v_e/g_0$: chemical about 300–450 s, ion engines thousands.`,
            'Faster exhaust shrinks the mass ratio dramatically.',
            'Ion engines trade thrust for efficiency: tiny pushes for months.',
          ],
        },
        {
          id: 'reentry',
          title: 'Coming Home',
          summary: 'Re-entry and heat shields',
          icon: 'down',
          steps: [
            {
              type: 'explain',
              title: 'Getting rid of orbital energy',
              body: r`A returning spacecraft in low orbit moves at 7.8 km/s. To land, it must lose almost all that kinetic energy, and using rockets to slow down would need nearly as much fuel as launching. Instead, it uses the atmosphere as a brake, turning kinetic energy into heat.`,
            },
            {
              type: 'numeric',
              title: 'Energy per kilogram',
              prompt: r`What is the kinetic energy of each kilogram of spacecraft at 7.8 km/s? (MJ, nearest whole number.)`,
              unit: 'MJ/kg',
              answer: Math.round((0.5 * 7800 ** 2) / 1e6),
              tol: 1,
              wrong: [{ v: Math.round((7800 ** 2) / 1e6), tol: 1, why: r`Don't forget the $\frac12$.` }],
              explain: r`$\frac12 \times 7800^2 \approx 30$ MJ per kg: about 7 times the energy in a kilogram of TNT. All of it must be dissipated in a few minutes.`,
            },
            {
              type: 'mcq',
              title: 'Not friction',
              prompt: r`Where does most of the heat during re-entry actually come from?`,
              choices: [
                { t: 'Air rammed and compressed in a shock wave in front of the craft, heating to thousands of degrees', ok: true },
                { t: 'Friction of air rubbing along the surface', why: 'Friction contributes a little, but compression of air in the shock wave dominates.' },
                { t: 'The engines', why: 'Engines are off during re-entry.' },
              ],
              explain: r`Air can't get out of the way fast enough, so it's squeezed violently ahead of the craft, reaching temperatures hotter than the Sun's surface. The glowing plasma blocks radio signals, causing a few minutes of communications blackout.`,
            },
            {
              type: 'explain',
              title: 'Blunt is better',
              body: r`In the 1950s, Harvey Allen and Alfred Eggers made a surprising discovery: a **blunt**, rounded nose survives re-entry far better than a sharp one. The blunt shape pushes the shock wave away from the surface, so most of the heat stays in the air and flows away.

Heat shields then protect against what's left, often by **ablation**: the shield material chars and boils away, carrying heat off with it.`,
            },
            {
              type: 'numeric',
              title: 'Back from the Moon',
              prompt: r`Apollo capsules returned from the Moon at about 11 km/s. How many times more kinetic energy per kilogram is that than returning from low orbit (7.8 km/s)? (1 decimal place.)`,
              unit: '×',
              answer: (11 / 7.8) ** 2,
              tol: 0.06,
              wrong: [{ v: 11 / 7.8, tol: 0.03, why: 'Kinetic energy goes as speed squared.' }],
              explain: r`$\left(\frac{11}{7.8}\right)^2 \approx 2.0$: twice the energy to shed. Apollo's ablative heat shield was designed for temperatures around 2,700 °C on its surface.`,
            },
            {
              type: 'interactive',
              title: 'Faster than explosives',
              body: r`An object’s kinetic energy per kilogram is $\frac12 v^2$. TNT releases about 4.2 MJ per kilogram. Find the speed at which a kilogram of spacecraft carries as much energy as a **kilogram of TNT**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 12, ymin: 0, ymax: 40, grid: false, height: 260, axes: { xlabel: 'speed (km/s)', ylabel: 'energy (MJ per kg)', xticks: 2, yticks: 10 },
                params: { v: { min: 0.5, max: 12, step: 0.01, value: 7.8, label: 'speed', color: 'coral', format: (v) => `${v.toFixed(2)} km/s` } },
                curves: [{ f: (x) => 0.5 * x * x, color: 'violet', width: 3 }, { f: () => 4.2, color: 'amber', dash: true }],
                points: [{ x: (p) => p.v, y: (p) => 0.5 * p.v * p.v, color: 'coral' }],
                readout: (p) => `${(0.5 * p.v * p.v).toFixed(1)} MJ/kg · **${((0.5 * p.v * p.v) / 4.2).toFixed(2)}×** TNT · orbit (7.8 km/s) is ${((0.5 * 7.8 * 7.8) / 4.2).toFixed(1)}×`,
                goal: (p) => Math.abs(0.5 * p.v * p.v - 4.2) < 0.03,
                hint: 'v = √(2 × 4.2 × 10⁶) m/s.',
                solution: { v: 2.9 },
              },
              explain: r`Just **2.9 km/s**, under 40% of orbital speed. A spacecraft coming home from orbit carries over seven times the energy of its own weight in TNT, and from the Moon (11 km/s) about fourteen times. All of it must be turned into heat in the air, which is why heat shields matter so much.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The entry corridor',
              prompt: r`A capsule must enter the atmosphere within a narrow range of angles, the "entry corridor". What happens outside it?`,
              choices: [
                { t: 'Too steep: deadly deceleration and heating. Too shallow: the capsule skips off the atmosphere back into space', ok: true },
                { t: 'Nothing: any angle works with a good heat shield', why: 'The angle controls both how hard the braking is and whether the capsule is captured at all.' },
                { t: 'Too shallow is safest', why: 'Too shallow, and the capsule can bounce off the atmosphere like a stone on water.' },
              ],
              explain: r`For Apollo, the corridor was only about 2° wide. Navigators aimed for it from 380,000 km away, like hitting the edge of a coin at the end of a football pitch.`,
            },
          ],
          recap: [
            'Orbital speed means about 30 MJ of energy per kilogram to shed.',
            'Most re-entry heating comes from compressed air in the shock wave.',
            'Blunt shapes and ablative shields protect spacecraft; the entry angle must be just right.',
          ],
        },
      ],
    },
  ],
};
