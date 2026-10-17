import { fix } from '../lib/svg.js';

const r = String.raw;
const KB = 1.380649e-23, AMU = 1.6605e-27;
const GASES = [['helium', 4], ['nitrogen', 28], ['carbon dioxide', 44]];
const mb = (v, T, m) => {
  const a = m / (2 * KB * T);
  return 4 * Math.PI * (a / Math.PI) ** 1.5 * v * v * Math.exp(-a * v * v);
};

// Ehrenfest's model: each step, one randomly chosen molecule hops to the other side of the box
const ehrenfest = (N, seed, steps = 1500) => { let a = (seed * 2654435761) >>> 0; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; let left = N; const out = [left]; for (let t = 0; t < steps; t++) { if (u() < left / N) left--; else left++; out.push(left); } return out; };
// Einstein solid: ln of the number of ways to share q quanta among N oscillators
const LF = (() => { const t = [0]; for (let i = 1; i <= 3000; i++) t.push(t[i - 1] + Math.log(i)); return t; })();
const lnOmega = (N, q) => LF[q + N - 1] - LF[q] - LF[N - 1];
const splitCurve = (NA, NB, q) => { const v = []; for (let a = 0; a <= q; a++) v.push(lnOmega(NA, a) + lnOmega(NB, q - a)); const m = Math.max(...v); return v.map((x) => Math.exp(x - m)); };
const solidT = (N, q) => 1 / Math.log((q + N) / (q + 1)); // temperature in units of (quantum)/k_B
// heat capacity of hydrogen gas, in units of R: translation + rotation (θ ≈ 85 K) + vibration (θ ≈ 6300 K)
const cvH2 = (T) => { const rot = 1 / (1 + Math.exp(-(T - 2.2 * 85) / 55)), x = 6300 / T, vib = x > 60 ? 0 : (x * x * Math.exp(x)) / (Math.exp(x) - 1) ** 2; return 1.5 + rot + vib; };

export default {
  id: 'statmech',
  subject: 'physics',
  title: 'Statistical Mechanics',
  level: 'Advanced',
  cover: 'statmech',
  tagline: 'How trillions of molecules give temperature, entropy, heat flow and phase transitions.',
  description: r`You can't track every molecule in a glass of water, but you can predict their collective behaviour with stunning accuracy. Count microstates, discover why entropy increases, meet the Boltzmann factor that governs everything from chemistry to stars, explore the speeds of molecules in the air, see why heat flows from hot to cold, and watch a simulated magnet form as it cools.`,
  prereq: 'Heat & Thermodynamics',
  chapters: [
    {
      title: 'Counting',
      summary: 'Microstates and entropy.',
      lessons: [
        {
          id: 'microstates',
          title: 'Microstates & Macrostates',
          summary: 'Why disorder wins',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Two levels of description',
              body: r`Flip 4 coins. A **microstate** lists every coin (HTHH, say). A **macrostate** only says how many heads there are. Different macrostates contain different numbers of microstates:

| Heads | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Microstates | 1 | 4 | 6 | 4 | 1 |

If every microstate is equally likely, the macrostate with the **most** microstates is the most likely. For a handful of coins the difference is modest. For trillions of molecules, it becomes overwhelming.`,
            },
            {
              type: 'numeric',
              title: 'A hundred coins',
              prompt: r`With 100 coins, how many microstates have **all** heads?`,
              answer: 1,
              wrong: [{ v: 100, why: 'There’s only one way for every single coin to be heads.' }, { v: 0, why: 'All-heads is possible: there’s exactly one microstate.' }],
              explain: r`Exactly **1**. Compare 50 heads and 50 tails: $\binom{100}{50} \approx 10^{29}$ microstates. Even flipping a billion times a second since the Big Bang, you'd never expect to see all heads. Macrostates with overwhelmingly many microstates are what we observe.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Molecules finding their way',
              body: r`Start with every molecule in the left half of a box. Each step, one molecule chosen at random hops to the other side (Paul and Tatiana Ehrenfest's model, 1907). Watch the number on the left, and change how many molecules there are.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1500, ymin: 0, ymax: 1, grid: false, height: 280, axes: { xlabel: 'steps', ylabel: 'fraction on the left', xticks: 500, yticks: 0.25 },
                params: { N: { min: 10, max: 400, step: 10, value: 40, label: 'molecules', color: 'violet' }, seed: { min: 1, max: 30, step: 1, value: 1, label: 'new run', color: 'blue', format: (v) => `#${v}` } },
                curves: [{ f: () => 0.5, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => { const w = ehrenfest(p.N, p.seed); return [s('path', { d: 'M' + w.map((v, i) => `${plot.X(i).toFixed(1)} ${plot.Y(v / p.N).toFixed(1)}`).join('L'), fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2 })]; },
                readout: (p) => { const w = ehrenfest(p.N, p.seed).slice(1000); const m = w.reduce((a, b) => a + b, 0) / w.length; return `after settling: on average **${Math.round((100 * m) / p.N)}%** on the left, wobbling by about ±${Math.round(50 / Math.sqrt(p.N))}%`; },
              },
              after: r`The fraction slides to one half and stays there, wobbling. The wobbles shrink like $1/\sqrt N$: for 40 molecules they're obvious, for 400 they're small, and for $10^{23}$ they're utterly invisible. A return to "all on the left" is possible in principle, but for $N$ molecules it takes around $2^N$ steps.`,
            },
            {
              type: 'explain',
              title: 'Boltzmann’s entropy',
              body: r`Ludwig Boltzmann defined the **entropy** of a macrostate as
$$S = k_B \ln W$$
where $W$ is its number of microstates and $k_B = 1.38 \times 10^{-23}$ J/K is **Boltzmann's constant**. (This formula is engraved on his tombstone in Vienna.)

The second law of thermodynamics ("entropy increases") is then just overwhelming probability: systems wander into the macrostates with the most microstates, because there are so many more ways to be there.`,
            },
            {
              type: 'numeric',
              title: 'Entropy of spreading',
              prompt: r`When gas spreads into twice the volume, each molecule has twice as many places to be, so $W$ is multiplied by $2^N$ and the entropy rises by $\Delta S = k_B \ln 2^N = N k_B \ln 2$. For one mole ($N k_B = R = 8.31$ J/K), what is $\Delta S$? (1 decimal place.)`,
              unit: 'J/K',
              answer: 8.314 * Math.LN2,
              tol: 0.06,
              wrong: [{ v: 8.31, tol: 0.05, why: r`Multiply by $\ln 2 \approx 0.693$.` }, { v: 16.6, tol: 0.1, why: r`It's $R \ln 2$, not $2R$.` }],
              explain: r`$\Delta S = R \ln 2 \approx 5.8$ J/K. This statistical answer agrees exactly with the thermodynamic one ($\Delta S = \int dQ/T$ for an isothermal expansion), which was one of the great early successes of Boltzmann's idea.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Gas in a box',
              prompt: r`A box has a partition with gas on the left and vacuum on the right. Remove the partition. Why does the gas never gather back into the left half by itself?`,
              choices: [
                { t: 'It’s not forbidden, just astronomically improbable: each molecule has a ½ chance of being on the left, so all N of them at once is (½)^N', ok: true },
                { t: 'A force pushes molecules to spread out', why: 'No special force is needed. Random motion plus counting does it.' },
                { t: 'Molecules repel each other strongly', why: 'Even an ideal gas with no forces spreads out, purely through probability.' },
              ],
              explain: r`For $N = 10^{23}$ molecules, the chance that all are on the left at once is $\left(\tfrac12\right)^{10^{23}}$: a number so small that, written as a decimal, it would start with about $3 \times 10^{22}$ zeros after the decimal point. If you wrote one zero per second, you'd need tens of thousands of times the age of the universe just to write them all. Irreversibility emerges from probability.`,
            },
          ],
          recap: [
            'A macrostate is a coarse description containing many microstates.',
            r`Entropy $S = k_B \ln W$.`,
            'The second law is overwhelming probability: systems move to macrostates with more microstates.',
          ],
        },
        {
          id: 'boltzmann',
          title: 'The Boltzmann Factor',
          summary: 'Energy versus temperature',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'How likely is high energy?',
              body: r`In a system at temperature $T$, the probability of finding a molecule in a state of energy $E$ is proportional to the **Boltzmann factor**:
$$P(E) \propto e^{-E / k_B T}$$
High-energy states are exponentially rare, unless the temperature is high. The key comparison is $E$ versus the thermal energy $k_B T$. At room temperature (300 K), $k_B T \approx 0.026$ eV.`,
            },
            {
              type: 'numeric',
              title: 'Population ratio',
              prompt: r`Two energy levels are 0.1 eV apart. At room temperature ($k_B T \approx 0.025$ eV), what's the ratio of molecules in the upper level to the lower level? (3 decimal places.)`,
              answer: Math.exp(-4),
              tol: 0.0006,
              wrong: [{ v: 0.25, why: r`It's exponential: $e^{-0.1/0.025} = e^{-4}$, not $0.025/0.1$.` }, { v: 54.6, tol: 0.5, why: r`That's $e^{+4}$. The upper level is **less** populated: $e^{-4}$.` }],
              explain: r`$e^{-0.1/0.025} = e^{-4} \approx 0.018$: about 1.8% as many in the upper level. Double the gap to 0.2 eV and the ratio drops to $e^{-8} \approx 0.0003$. This exponential sensitivity is why chemical reactions speed up so dramatically when heated.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Filling the ladder',
              body: r`A molecule has energy levels equally spaced by $\varepsilon$, like the rungs of a ladder. The bars show what fraction of molecules sit on each rung. Change the temperature, measured as $k_BT/\varepsilon$.`,
              widget: {
                kind: 'graph', xmin: -0.7, xmax: 10.7, ymin: 0, ymax: 1.05, grid: false, height: 260, axes: { xlabel: 'rung', ylabel: 'fraction', xticks: 1, yticks: 0.25 },
                params: { t: { min: 0.1, max: 5, step: 0.05, value: 1, label: '$k_BT / \\varepsilon$', color: 'coral', format: (v) => v.toFixed(2) } },
                extra: ({ plot, p, s }) => { const x = Math.exp(-1 / p.t); return Array.from({ length: 11 }, (_, n) => { const f = (1 - x) * x ** n; return s('rect', { x: plot.X(n - 0.35), y: plot.Y(f), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(f), rx: 3, class: 'fl-coral' }); }); },
                readout: (p) => { const x = Math.exp(-1 / p.t); return `ground rung: **${(100 * (1 - x)).toFixed(0)}%** · each rung up holds ${x.toFixed(2)}× the one below · average energy ${(x / (1 - x)).toFixed(2)} ε`; },
              },
              after: r`Each rung holds a fixed fraction $e^{-\varepsilon/k_BT}$ of the one below. When $k_BT \ll \varepsilon$, almost everything sits on the ground rung; when $k_BT \gg \varepsilon$, many rungs fill and the average energy approaches $k_BT$, the classical value.`,
            },
            {
              type: 'numeric',
              title: 'Thinning air',
              prompt: r`In the atmosphere, a molecule at height $h$ has extra energy $mgh$, so air density falls like $e^{-mgh/k_BT}$. It drops by a factor of $e$ over the **scale height** $H = \dfrac{k_BT}{mg}$. For nitrogen ($m = 4.65 \times 10^{-26}$ kg) at 290 K, with $g = 9.8$ m/s², what is $H$ in km? (1 decimal place.)`,
              unit: 'km',
              answer: (1.380649e-23 * 290) / (4.65e-26 * 9.8) / 1000,
              tol: 0.1,
              wrong: [{ v: (1.380649e-23 * 290) / (4.65e-26 * 9.8), relTol: 0.01, why: 'That’s in metres. Convert to km.' }],
              hint: r`$H = \dfrac{1.38 \times 10^{-23} \times 290}{4.65 \times 10^{-26} \times 9.8}$ m.`,
              explain: r`$H \approx 8.8$ km. That's roughly why the air pressure at the top of Everest (8.8 km) is only about a third of its sea-level value: the Boltzmann factor at work on a planetary scale. Lighter molecules have larger scale heights.`,
            },
            {
              type: 'mcq',
              title: 'Cooking',
              prompt: r`A rough chemistry rule: many reactions roughly double in rate for every 10 °C rise in temperature. Which idea explains this?`,
              choices: [
                { t: 'Only molecules with energy above an activation barrier react, and the Boltzmann factor for that tail grows quickly with T', ok: true },
                { t: 'Molecules get bigger when hot', why: 'Molecules don’t meaningfully grow. A much larger fraction of them have enough energy to react.' },
                { t: 'The number of molecules doubles', why: 'The number stays the same. The fraction energetic enough to react increases.' },
              ],
              explain: r`A reaction needs molecules to collide with at least the **activation energy** $E_a$. The fraction with that much energy goes like $e^{-E_a/k_B T}$. For typical $E_a$ (around 0.5 eV), a 10 °C rise near room temperature roughly doubles that fraction. That's why fridges slow food spoilage and cooking speeds it up.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Ten degrees warmer',
              prompt: r`A reaction has activation energy $E_a = 0.5$ eV, so its rate goes like $e^{-E_a/k_BT}$. By what factor does the rate increase from 300 K to 310 K? ($k_B = 8.62 \times 10^{-5}$ eV/K; 2 decimal places.)`,
              unit: '×',
              answer: Math.exp((0.5 / 8.617333e-5) * (1 / 300 - 1 / 310)),
              tol: 0.02,
              wrong: [{ v: 310 / 300, tol: 0.01, why: 'That’s the ratio of temperatures. The rate depends exponentially on 1/T.' }],
              hint: r`Ratio $= \exp\!\left[\dfrac{E_a}{k_B}\left(\dfrac1{300} - \dfrac1{310}\right)\right]$, and $\dfrac{E_a}{k_B} \approx 5800$ K.`,
              explain: r`$\frac{E_a}{k_B} \approx 5800$ K and $\frac1{300} - \frac1{310} \approx 1.08 \times 10^{-4}$ K⁻¹, so the ratio is $e^{0.62} \approx 1.87$: nearly double, just as the rule of thumb says, from a temperature change of only 3%.`,
            },
          ],
          recap: [
            r`Boltzmann factor: $P(E) \propto e^{-E/k_B T}$.`,
            r`At room temperature, $k_B T \approx 0.026$ eV.`,
            'Exponential sensitivity explains why reaction rates rise steeply with temperature.',
          ],
        },
      ],
    },
    {
      title: 'Molecules in Motion',
      summary: 'Speeds and energy sharing.',
      lessons: [
        {
          id: 'speeds',
          title: 'Molecular Speeds',
          summary: 'The Maxwell–Boltzmann distribution',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A spread of speeds',
              body: r`Molecules in a gas don't all move at the same speed. James Clerk Maxwell (1860) and Boltzmann worked out the distribution of speeds. Change the gas and the temperature.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3500, ymin: 0, ymax: 0.0045, grid: 500, gridY: 0.001, height: 300, axes: { xlabel: 'speed (m/s)', ylabel: 'share', yfmt: () => '' },
                params: {
                  g: { min: 0, max: 2, step: 1, value: 1, label: 'gas', color: 'violet', format: (v) => GASES[v][0] },
                  T: { min: 100, max: 1000, step: 50, value: 300, label: 'temperature', color: 'coral', format: (v) => `${v} K` },
                },
                curves: [{ f: (v, p) => mb(v, p.T, GASES[p.g][1] * AMU), color: 'violet', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const m = GASES[p.g][1] * AMU, vp = Math.sqrt((2 * KB * p.T) / m);
                  return [s('line', { x1: plot.X(vp), x2: plot.X(vp), y1: plot.Y(0), y2: plot.Y(mb(vp, p.T, m)), stroke: 'var(--coral)', 'stroke-width': 2.5, 'stroke-dasharray': '6 5' })];
                },
                readout: (p) => {
                  const m = GASES[p.g][1] * AMU;
                  return r`most likely speed $\sqrt{2k_BT/m} = ${Math.round(Math.sqrt((2 * KB * p.T) / m))}$ m/s, $\;$ rms speed $\sqrt{3k_BT/m} = ${Math.round(Math.sqrt((3 * KB * p.T) / m))}$ m/s`;
                },
              },
              after: r`Hotter gases and lighter molecules move faster: speeds scale as $\sqrt{T/m}$. And there's always a long tail of unusually fast molecules. At room temperature, nitrogen molecules typically move at about 500 m/s, faster than the speed of sound (which is carried by these very molecules).`,
            },
            {
              type: 'numeric',
              title: 'Helium versus nitrogen',
              prompt: r`A helium atom (mass 4) and a nitrogen molecule (mass 28) are at the same temperature. How many times faster is helium's typical speed? (2 decimal places.)`,
              unit: '×',
              answer: Math.sqrt(7),
              tol: 0.01,
              wrong: [{ v: 7, why: r`Speed goes as $1/\sqrt{m}$: the ratio is $\sqrt{28/4}$, not $28/4$.` }, { v: 0.38, tol: 0.01, why: 'Helium is lighter, so it’s faster: the ratio should be greater than 1.' }],
              explain: r`Speed $\propto 1/\sqrt{m}$, so the ratio is $\sqrt{28/4} = \sqrt7 \approx 2.65$. Same temperature means same average **kinetic energy**, $\tfrac12 mv^2$, so lighter particles must move faster.`,
            },
            {
              type: 'numeric',
              title: 'How fast is air?',
              prompt: r`The root-mean-square speed is $\sqrt{3k_BT/m}$. For nitrogen ($m = 4.65 \times 10^{-26}$ kg) at 300 K, what is it? (Nearest 10 m/s.)`,
              unit: 'm/s',
              answer: Math.sqrt((3 * 1.380649e-23 * 300) / 4.65e-26),
              tol: 6,
              wrong: [{ v: Math.sqrt((2 * 1.380649e-23 * 300) / 4.65e-26), tol: 6, why: r`That's the most likely speed, $\sqrt{2k_BT/m}$. Use the 3 for the rms speed.` }],
              explain: r`$\sqrt{\frac{3 \times 1.38 \times 10^{-23} \times 300}{4.65 \times 10^{-26}}} \approx 517$ m/s, about 1,900 km/h. Each molecule collides billions of times per second, so it never gets far in any one direction.`,
            },
            {
              type: 'interactive',
              title: 'Same speeds, different gases',
              body: r`Helium atoms are 7 times lighter than nitrogen molecules. Cool the helium until its speed distribution (coral) matches nitrogen's at 300 K (violet).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2500, ymin: 0, ymax: 0.0024, grid: false, height: 260, axes: { xlabel: 'speed (m/s)', xticks: 500, yticks: 1 },
                params: { T: { min: 10, max: 300, step: 1, value: 300, label: 'helium temperature', color: 'coral', format: (v) => `${v} K` } },
                curves: [{ f: (v) => mb(v, 300, 28 * AMU), color: 'violet', width: 3 }, { f: (v, p) => mb(v, p.T, 4 * AMU), color: 'coral', width: 3 }],
                readout: (p) => `most likely speed: helium **${Math.round(Math.sqrt((2 * KB * p.T) / (4 * AMU)))}** m/s · nitrogen at 300 K **${Math.round(Math.sqrt((2 * KB * 300) / (28 * AMU)))}** m/s`,
                goal: (p) => Math.abs(p.T - 300 / 7) <= 1,
                hint: 'Speed depends on T/m. Helium’s mass is 1/7 of nitrogen’s, so it needs 1/7 of the temperature.',
                solution: { T: 43 },
              },
              explain: r`At about **43 K** ($300/7$) the curves coincide: speed distributions depend only on $T/m$. Helium at room temperature is as fast as nitrogen at 2,100 K.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen versus oxygen',
              prompt: r`Typical molecular speed is proportional to $\frac{1}{\sqrt m}$. At the same temperature, how many times faster are hydrogen molecules (mass 2) than oxygen molecules (mass 32)?`,
              answer: 4,
              explain: r`$\sqrt{\frac{32}{2}} = 4$. Same average energy, so the lighter molecules move faster, fast enough for Earth to lose its hydrogen to space over time.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Losing hydrogen',
              prompt: r`Earth's escape velocity is 11.2 km/s, and hydrogen molecules in the upper atmosphere move at a typical 2–3 km/s. Yet Earth has lost almost all its free hydrogen. How?`,
              choices: [
                { t: 'The fast tail of the distribution: a few molecules always exceed escape speed, and over billions of years they leak away', ok: true },
                { t: 'The Sun’s gravity pulls hydrogen off Earth', why: 'The Sun’s pull is similar for all gases. The loss comes from the high-speed tail of light molecules.' },
                { t: 'Hydrogen is destroyed by lightning', why: 'Chemistry plays a role, but the escape is due to the speed distribution’s tail.' },
              ],
              explain: r`Only a tiny fraction of hydrogen molecules exceed 11.2 km/s at any moment, but the tail is continually refilled by collisions. Over geological time, light gases like hydrogen and helium leak away, while heavier nitrogen and oxygen, which are much slower, remain. The Moon, with a weaker gravity, couldn't hold on to an atmosphere at all.`,
            },
          ],
          recap: [
            r`Molecular speeds follow the Maxwell–Boltzmann distribution; they scale as $\sqrt{T/m}$.`,
            'At equal temperature, lighter molecules move faster.',
            'The fast tail lets light gases escape from planets.',
          ],
        },
        {
          id: 'equipartition',
          title: 'Sharing Energy',
          summary: 'Equipartition and heat capacity',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Fair shares',
              body: r`The **equipartition theorem** says that in thermal equilibrium, every independent way a molecule can store energy as a squared quantity (like $\tfrac12 mv_x^2$) gets, on average, the same share: $\tfrac12 k_B T$.

A helium atom can move in 3 directions, so its average kinetic energy is $\tfrac32 k_B T$. That's what temperature **is**, at the molecular level: a measure of average energy per degree of freedom.`,
            },
            {
              type: 'numeric',
              title: 'Average energy',
              prompt: r`What is the average kinetic energy of a helium atom at 300 K? Give it in units of $10^{-21}$ J. ($k_B = 1.38 \times 10^{-23}$ J/K.)`,
              unit: r`$\times 10^{-21}$ J`,
              answer: 1.5 * 1.38e-23 * 300 / 1e-21,
              tol: 0.02,
              wrong: [{ v: 4.14, tol: 0.02, why: r`That's $k_B T$. The average kinetic energy is $\tfrac32 k_B T$.` }, { v: 2.07, tol: 0.02, why: r`That's $\tfrac12 k_B T$, one direction only. Helium moves in three directions.` }],
              explain: r`$\tfrac32 \times 1.38 \times 10^{-23} \times 300 \approx 6.2 \times 10^{-21}$ J. Tiny for one atom, but a mole of helium holds about 3.7 kJ of thermal kinetic energy at room temperature.`,
            },
            {
              type: 'numeric',
              title: 'Heat capacity of a gas',
              prompt: r`A mole of helium has 3 energy shares per atom, so its energy is $\tfrac32 RT$ and it takes $\tfrac32 R$ joules to warm it by 1 K. A diatomic molecule like nitrogen can also **rotate** about two axes, adding 2 more shares. What is nitrogen's molar heat capacity (at constant volume)? ($R = 8.31$ J/(mol·K); 1 decimal place.)`,
              unit: 'J/(mol·K)',
              answer: 2.5 * 8.314,
              tol: 0.1,
              wrong: [{ v: 1.5 * 8.314, tol: 0.1, why: 'That’s helium’s value. Add the 2 rotational shares: 5 halves of R.' }, { v: 3.5 * 8.314, tol: 0.1, why: 'That includes vibration (2 more shares), which is frozen out at room temperature.' }],
              explain: r`$\tfrac52 R \approx 20.8$ J/(mol·K), matching measurements for nitrogen and oxygen at room temperature. Solids have 3 kinetic and 3 potential shares per atom, giving $3R \approx 25$ J/(mol·K): the **Dulong–Petit law** (1819).`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hydrogen’s staircase',
              body: r`Measure the heat capacity of hydrogen gas from very cold to very hot. Slide the temperature (on a logarithmic scale).`,
              widget: {
                kind: 'graph', xmin: 1, xmax: 4, ymin: 0, ymax: 4.2, grid: false, height: 280, axes: { xlabel: 'temperature (K)', ylabel: 'heat capacity (units of R)', xticks: 1, yticks: 0.5, xfmt: (v) => `${Math.round(10 ** v)}` },
                params: { lt: { min: 1, max: 4, step: 0.02, value: 2.48, label: 'temperature', color: 'coral', format: (v) => `${Math.round(10 ** v)} K` } },
                curves: [{ f: (x) => cvH2(10 ** x), color: 'violet', width: 3, n: 300 }, { f: () => 1.5, color: 'muted', dash: true }, { f: () => 2.5, color: 'muted', dash: true }, { f: () => 3.5, color: 'muted', dash: true }],
                points: [{ x: (p) => p.lt, y: (p) => cvH2(10 ** p.lt), color: 'coral' }],
                readout: (p) => { const c = cvH2(10 ** p.lt); return `${Math.round(10 ** p.lt)} K: heat capacity **${c.toFixed(2)} R** · ` + (c < 1.8 ? 'only moving (3 shares)' : c < 2.7 ? 'moving and rotating (5 shares)' : 'vibrating too (approaching 7 shares)'); },
              },
              after: r`The heat capacity climbs in **steps**: $\tfrac32 R$ when only translation is active, $\tfrac52 R$ once rotation switches on (around 100–300 K), and towards $\tfrac72 R$ as vibration wakes up above a few thousand kelvin. Each motion joins in only when $k_BT$ is comparable to its quantum energy step. (Real hydrogen dissociates before reaching the last step.)`,
            },
            {
              type: 'numeric',
              title: 'Energy in a mole of air',
              prompt: r`Nitrogen molecules have 5 energy shares each (3 for moving, 2 for rotating), so a mole holds $\tfrac52 RT$ of thermal energy. How much is that at 300 K, in kJ? ($R = 8.31$ J/(mol·K); 2 decimal places.)`,
              unit: 'kJ',
              answer: 2.5 * 8.31 * 300 / 1000,
              tol: 0.01,
              wrong: [{ v: 3.74, tol: 0.01, why: r`That's $\tfrac32 RT$, only the moving part. Nitrogen also rotates, adding 2 more shares.` }],
              explain: r`$\tfrac52 \times 8.31 \times 300 \approx 6230$ J $= 6.23$ kJ for 28 grams of nitrogen, enough to lift a person about 9 metres. A room full of air holds several megajoules of this random molecular motion, but the second law stops you from turning it into useful work without somewhere colder to dump heat.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A quantum surprise',
              prompt: r`Classically, a nitrogen molecule's two atoms could also vibrate against each other, adding energy shares. Yet at room temperature, nitrogen's heat capacity shows no sign of vibration. Why?`,
              choices: [
                { t: 'Vibrational energy is quantised, with steps much larger than k_BT at room temperature, so vibrations stay "frozen out"', ok: true },
                { t: 'Nitrogen molecules can’t vibrate', why: 'They can, and they do at high temperatures. At room temperature, there isn’t enough thermal energy to excite them.' },
                { t: 'Equipartition is simply wrong', why: 'It works when energy levels are closely spaced compared with k_BT. The puzzle was a clue to quantum mechanics.' },
              ],
              explain: r`Vibrations of $\text{N}_2$ need about 0.29 eV per quantum, over 10 times $k_B T$ at room temperature. By the Boltzmann factor, hardly any molecules are excited. This failure of classical equipartition was one of the clues, in the late 1800s, that classical physics was incomplete.`,
            },
          ],
          recap: [
            r`Equipartition: each quadratic degree of freedom averages $\tfrac12 k_B T$.`,
            r`A monatomic gas atom has average kinetic energy $\tfrac32 k_B T$.`,
            'Quantised motions with large energy steps are “frozen out” at low temperature.',
          ],
        },
      ],
    },
    {
      title: 'Collective Behaviour',
      summary: 'Why heat flows, and how magnets form.',
      lessons: [
        {
          id: 'einstein',
          title: 'Why Heat Flows',
          summary: 'Two Einstein solids sharing energy',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Einstein’s solid',
              body: r`In 1907 Einstein modelled a solid as $N$ atoms vibrating independently, each able to hold any whole number of energy **quanta**. The number of ways to share $q$ quanta among $N$ oscillators is
$$\Omega(N, q) = \binom{q + N - 1}{q}$$
(think of arranging $q$ dots and $N - 1$ dividers in a row).`,
            },
            {
              type: 'numeric',
              title: 'Three oscillators',
              prompt: r`How many ways can 2 quanta be shared among 3 oscillators? (List them, or use the formula.)`,
              answer: 6,
              wrong: [{ v: 3, why: 'Both quanta can go to the same oscillator (3 ways), or to two different ones (3 more ways).' }, { v: 9, why: r`Quanta are identical, so order doesn't matter: $\binom{4}{2}$.` }],
              explain: r`$\binom{4}{2} = 6$: (2,0,0), (0,2,0), (0,0,2), (1,1,0), (1,0,1), (0,1,1). These numbers grow astronomically fast: 100 oscillators sharing 100 quanta have about $10^{59}$ microstates.`,
            },
            {
              type: 'interactive',
              title: 'Sharing between two solids',
              body: r`Solid A (300 oscillators) and solid B (200 oscillators) touch and share 100 quanta. The curve shows how many microstates each split has (relative to the most likely). Move the split to the **most likely** one, and compare the two solids' temperatures.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 100, ymin: 0, ymax: 1.08, grid: false, height: 280, axes: { xlabel: 'quanta in solid A', ylabel: 'relative probability', xticks: 10, yticks: 0.25 },
                params: { qa: { min: 0, max: 100, step: 1, value: 20, label: 'quanta in A', color: 'coral' } },
                curves: [{ f: (x) => splitCurve(300, 200, 100)[Math.round(x)], color: 'violet', width: 3, n: 101 }],
                points: [{ x: (p) => p.qa, y: (p) => splitCurve(300, 200, 100)[p.qa], color: 'coral' }],
                readout: (p) => { const r = splitCurve(300, 200, 100)[p.qa]; return `this split is ${r > 0.999 ? '**the most likely**' : r < 1e-4 ? `less than 1/10,000 as likely as the best` : `${(100 * r).toFixed(1)}% as likely as the best`} · temperature of A **${solidT(300, p.qa).toFixed(3)}**, of B **${solidT(200, 100 - p.qa).toFixed(3)}**`; },
                goal: (p) => p.qa === 60,
                hint: 'Find the peak of the curve. A has 3/5 of the oscillators.',
                solution: { qa: 60 },
              },
              explain: r`The peak is at **60 quanta in A**: energy splits in proportion to the number of oscillators, and at that split the two temperatures are equal. Even with only 500 oscillators the peak is sharp; with $10^{23}$ atoms, any noticeably different split is essentially impossible.`,
            },
            {
              type: 'mcq',
              title: 'Hot to cold',
              prompt: r`Start with A holding only 20 quanta (cold) and B holding 80 (hot). Why does energy flow from B to A?`,
              choices: [
                { t: 'Splits with more energy in A have vastly more microstates, so random exchanges almost always move toward them', ok: true },
                { t: 'Heat is a fluid that flows downhill', why: 'That was the old "caloric" theory. Here nothing pushes the energy: it just wanders to where the microstates are.' },
                { t: 'Energy is conserved, so it has to spread out evenly', why: 'Conservation keeps the total fixed but says nothing about which split occurs. That’s decided by counting.' },
              ],
              explain: r`Random exchanges of quanta wander through all microstates equally. Since the splits near 60:40 contain overwhelmingly more microstates than 20:80, the system drifts there and stays. "Heat flows from hot to cold" is the second law in action: total entropy $k_B \ln(\Omega_A \Omega_B)$ increases.`,
            },
            {
              type: 'explain',
              title: 'What temperature is',
              body: r`The most likely split is where adding one quantum to A gains exactly as many microstates (in log terms) as removing it from B loses. That suggests a definition:
$$\frac{1}{T} = \frac{\partial S}{\partial E}$$
**Temperature measures how little a system's entropy grows when you give it energy.** A cold object gains a lot of entropy per quantum, so it "wants" energy; a hot one gains little, so it gives energy away. Energy flows until the two values of $\partial S / \partial E$, and so the temperatures, are equal. The temperatures in the readout were computed exactly this way.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A bigger partner',
              prompt: r`Solid A has 300 oscillators and solid B has 100. They share 400 quanta. In the most likely split, about how many quanta does A hold?`,
              unit: 'quanta',
              answer: 300,
              tol: 3,
              wrong: [{ v: 200, why: 'Energy doesn’t split equally: it splits in proportion to the number of oscillators.' }, { v: 100, why: 'A has three times as many oscillators, so it holds three times as much energy.' }],
              explain: r`In equilibrium each oscillator holds about the same energy on average (equipartition again), so A gets $\frac{300}{400}$ of the quanta: about **300**. Equal temperature means equal energy **per oscillator**, not equal total energy.`,
            },
          ],
          recap: [
            r`Ways to share $q$ quanta among $N$ oscillators: $\binom{q+N-1}{q}$.`,
            'Energy flows to the split with the most microstates: where the temperatures are equal.',
            r`Temperature is defined by $1/T = \partial S / \partial E$.`,
          ],
        },
        {
          id: 'ising',
          title: 'Magnets and Phase Transitions',
          summary: 'The Ising model',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'A toy magnet',
              body: r`In iron, each atom acts like a tiny magnet (a **spin**) pointing up or down. Neighbouring spins save energy by pointing the same way, but heat jostles them randomly. This is the **Ising model** (Ernst Ising, 1925).

A computer can simulate it with the **Metropolis rule**: pick a spin at random and consider flipping it. If the flip lowers the energy, do it; if it raises the energy by $\Delta E$, do it only with probability $e^{-\Delta E/k_BT}$, the Boltzmann factor.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hot and cold',
              body: r`Here are 4,096 spins (coral up, blue down) evolving by the Metropolis rule. Temperature is measured in units where neighbouring spins interact with energy 1. Try hot (4), warm (2.3) and cold (1.5), and watch the patches.`,
              widget: { kind: 'ising', size: 64, T: 4, start: 'random', speed: 2 },
              after: r`Hot: a salt-and-pepper mess with no net magnetisation. Cold: patches (**domains**) grow and merge until one direction takes over, and the material becomes a magnet by itself. In between, near $T \approx 2.27$, domains of every size flicker in and out.`,
            },
            {
              type: 'interactive',
              title: 'Make a magnet',
              body: r`Cool the spins below 2 and get the magnetisation above $0.7$ (in either direction). Domains can take a while to merge.`,
              widget: {
                kind: 'ising', size: 64, T: 3.5, start: 'random', speed: 3,
                goal: (s) => s.T < 2 && Math.abs(s.m) > 0.7,
                hint: 'Lower the temperature below 2 and wait, or start from all spins up.',
                solution: { T: 1.6, start: 'up', sweeps: 5 },
              },
              explain: r`Below the critical temperature, aligned spins win: the energy saved by agreeing outweighs the entropy of disorder. Which direction wins is decided by chance, a phenomenon called **spontaneous symmetry breaking**. Heat a magnet above its **Curie temperature** (1043 K for iron) and the magnetism vanishes.`,
            },
            {
              type: 'numeric',
              title: 'Onsager’s number',
              prompt: r`In 1944 Lars Onsager solved the 2D Ising model exactly, a landmark of physics. The critical temperature is $T_c = \dfrac{2}{\ln\left(1 + \sqrt 2\right)}$ in these units. Compute it. (3 decimal places.)`,
              lhs: r`$T_c =$`,
              answer: 2 / Math.log(1 + Math.SQRT2),
              tol: 0.002,
              wrong: [{ v: 1 / Math.log(1 + Math.SQRT2), tol: 0.002, why: 'Don’t forget the 2 in the numerator.' }],
              hint: r`$\ln(1 + \sqrt2) = \ln 2.414 \approx 0.881$.`,
              explain: r`$T_c = \frac{2}{0.8814} \approx 2.269$. Below it the model magnetises spontaneously; above it, it doesn't. Onsager's solution proved that simple local rules can produce a sharp **phase transition**, something many physicists had doubted.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Push with a field',
              body: r`Now add an external magnetic field. Start cold and magnetised, then push the field the other way. Then try the same thing hot.`,
              widget: { kind: 'ising', size: 64, T: 1.8, h: 0, field: true, start: 'up', speed: 2 },
              after: r`Cold, the magnet resists a weak opposing field, then suddenly flips as a domain of the new direction sweeps across: that's **hysteresis**, the memory that makes permanent magnets and magnetic data storage possible. Hot, the spins simply follow the field, with no memory at all.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Universality',
              prompt: r`Near its critical point, water's liquid and gas phases become indistinguishable, and density fluctuations of every size appear. Measured precisely, these fluctuations scale with the **same exponents** as a 3D Ising magnet. Why?`,
              choices: [
                { t: 'Near a critical point only large-scale features matter (dimension and symmetry), not the microscopic details', ok: true },
                { t: 'Water molecules are tiny magnets', why: 'Magnetism plays no part: a lattice cell being "full" or "empty" of molecules plays the role of up or down.' },
                { t: 'It’s a coincidence', why: 'It happens across many systems, and it was explained by the renormalisation group (Nobel Prize 1982).' },
              ],
              explain: r`This is **universality**: at a critical point, fluctuations span all length scales, and the microscopic details wash out. Magnets, fluids and alloys fall into a few universality classes. Kenneth Wilson won the 1982 Nobel Prize for explaining why, and it's why a toy model of spins on a grid is taken seriously in physics.`,
            },
          ],
          recap: [
            'Ising model: neighbouring spins prefer to align; temperature randomises them.',
            r`Below $T_c \approx 2.27$ (2D), spins align spontaneously: a phase transition.`,
            'Near critical points, very different systems behave identically (universality).',
          ],
        },
        {
          id: 'landauer',
          title: 'The Cost of Forgetting',
          summary: 'Landauer’s principle',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Information is physical',
              body: r`In 1961 Rolf Landauer argued that **erasing** a bit of information, resetting a memory cell to 0 whatever it held, must release at least
$$E = k_BT\ln 2$$
of heat into the surroundings. Erasing destroys a choice between two states, which lowers the memory’s entropy by $k_B\ln 2$; the second law demands that at least as much entropy appears elsewhere, as heat. Experiments in 2012 confirmed this limit using a single trapped bead.`,
            },
            {
              type: 'numeric',
              title: 'One bit at room temperature',
              prompt: r`At 300 K, what is $k_BT\ln 2$? Give the answer in units of $10^{-21}$ J (2 decimal places; $k_B = 1.38 \times 10^{-23}$ J/K).`,
              unit: r`$\times 10^{-21}$ J`,
              answer: (1.380649e-23 * 300 * Math.log(2)) / 1e-21,
              tol: 0.01,
              explain: r`$1.38 \times 10^{-23} \times 300 \times 0.693 \approx 2.87 \times 10^{-21}$ J: an extraordinarily small amount, about a hundredth of the energy of a single photon of visible light.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Erasing on a budget',
              prompt: r`With 1 watt of power, the Landauer limit allows at most $\frac{1}{k_BT\ln 2}$ bit erasures per second. Colder computers can erase more per joule. Find the temperature at which 1 W allows $10^{21}$ erasures per second.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 400, ymin: 0, ymax: 5, grid: false, height: 260, axes: { xlabel: 'temperature (K)', ylabel: 'erasures per second per watt (×10²¹)', xticks: 50, yticks: 1 },
                params: { T: { min: 20, max: 400, step: 0.5, value: 300, label: 'temperature', color: 'blue', format: (v) => `${fix(v, 1)} K` } },
                curves: [{ f: (x) => 1 / (1.380649e-23 * x * Math.log(2)) / 1e21, color: 'violet', width: 3, from: 20 }, { f: () => 1, color: 'teal', dash: true }],
                points: [{ x: (p) => p.T, y: (p) => Math.min(5, 1 / (1.380649e-23 * p.T * Math.log(2)) / 1e21), color: 'blue' }],
                readout: (p) => `minimum energy per bit **${(1.380649e-23 * p.T * Math.log(2) * 1e21).toFixed(2)} × 10⁻²¹ J** · up to **${(1 / (1.380649e-23 * p.T * Math.log(2)) / 1e21).toFixed(2)} × 10²¹** erasures per joule`,
                goal: (p) => Math.abs(p.T - 104.5) < 0.6,
                hint: r`$T = \frac{1}{10^{21} \times k_B \ln 2}$.`,
                solution: { T: 104.5 },
              },
              explain: r`$T = \frac{1}{10^{21} \times 1.38 \times 10^{-23} \times 0.693} \approx 104$ K. The limit is proportional to temperature, though refrigerating a computer costs energy too, so in practice there is no free lunch.`,
            },
            {
              type: 'mcq',
              title: 'Exorcising the demon',
              prompt: r`Maxwell imagined a tiny "demon" that opens a trapdoor only for fast molecules, sorting a gas into hot and cold halves without doing work, seemingly breaking the second law. Where does Landauer’s principle say the catch is?`,
              choices: [
                { t: 'The demon must record each molecule’s speed, and eventually erase its memory, which releases at least as much entropy as it removed', ok: true },
                { t: 'Opening the door takes a lot of energy', why: 'The door can in principle be frictionless. The unavoidable cost is in handling information.' },
                { t: 'Such a demon is impossible to build', why: 'Microscopic "demons" have been built in labs. The second law survives because of the information cost.' },
              ],
              explain: r`Charles Bennett (1982) completed the argument: measuring can be done without cost, but a finite memory must eventually be erased, and that erasure pays the entropy bill. Information and thermodynamics are two sides of the same coin.`,
            },
            {
              type: 'numeric',
              title: 'Real chips',
              prompt: r`A logic operation in a modern chip dissipates roughly $10^{-17}$ J. About how many times the Landauer limit at 300 K is that? (To the nearest hundred.)`,
              answer: 1e-17 / (1.380649e-23 * 300 * Math.log(2)),
              relTol: 0.03,
              explain: r`$\frac{10^{-17}}{2.87 \times 10^{-21}} \approx 3{,}500$. Computers are still thousands of times above the fundamental limit, so there is plenty of physics left before efficiency hits the wall.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Computing for free?',
              prompt: r`Landauer’s limit applies to **erasing** information. What follows for computers that never erase anything?`,
              choices: [
                { t: 'Reversible computing could in principle use arbitrarily little energy per operation', ok: true },
                { t: 'They would violate the second law', why: 'No: if no information is destroyed, no entropy has to be dumped as heat.' },
                { t: 'Nothing: every operation costs kT ln 2', why: 'Only logically irreversible operations (that lose information, like erasing) carry the cost.' },
              ],
              explain: r`Operations like AND lose information (two inputs, one output), but they can be redone in a reversible way that keeps the inputs. Such reversible computing, and quantum computing (which is reversible by nature), could in principle sidestep Landauer’s cost, at the price of keeping track of a lot of junk bits.`,
            },
          ],
          recap: [
            r`Erasing one bit releases at least $k_BT\ln 2 \approx 3 \times 10^{-21}$ J at room temperature.`,
            'The erasure cost saves the second law from Maxwell’s demon.',
            'Only irreversible operations must pay it; today’s chips use thousands of times more.',
          ],
        },
      ],
    },
  ],
};
