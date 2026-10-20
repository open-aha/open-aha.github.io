import { fix, sig } from '../lib/svg.js';
import { r, FS, view, pick, bars } from './_chem.js';

// ---------- phase diagrams (temperature in °C, pressure on a log scale in atm) ----------
const K = 273.15;
const SUBST = {
  water: { tp: [0.01, 0.00604], bp: [100, 1], cp: [374, 218], subB: 6140, melt: -0.0074, name: 'water', solid: 'ice' },
  co2: { tp: [-56.6, 5.11], bp: null, cp: [31.0, 72.8], subB: 3140, melt: 0.02, name: 'carbon dioxide', solid: 'dry ice' },
};
// vapour pressure of the liquid (through the triple point, the normal boiling point if there is one, and the critical point)
function vap(S, Tc) {
  const t = Tc + K, [t0, p0] = S.tp, [tc, pc] = S.cp;
  if (S.bp && Tc <= S.bp[0]) { const B = Math.log(S.bp[1] / p0) / (1 / (t0 + K) - 1 / (S.bp[0] + K)); return p0 * Math.exp(B * (1 / (t0 + K) - 1 / t)); }
  const [ta, pa] = S.bp ? S.bp : S.tp;
  const B = Math.log(pc / pa) / (1 / (ta + K) - 1 / (tc + K));
  return pa * Math.exp(B * (1 / (ta + K) - 1 / t));
}
const subl = (S, Tc) => S.tp[1] * Math.exp(S.subB * (1 / (S.tp[0] + K) - 1 / (Tc + K)));
const meltT = (S, P) => S.tp[0] + S.melt * (P - S.tp[1]);
function phaseOf(S, Tc, P) {
  if (Tc > S.cp[0] && P > S.cp[1]) return 'supercritical fluid';
  if (Tc < meltT(S, P)) return P > (Tc < S.tp[0] ? subl(S, Tc) : 0) ? 'solid' : 'gas';
  if (Tc > S.cp[0]) return 'gas';
  return P > vap(S, Tc) ? 'liquid' : 'gas';
}
function phaseDiagram(key, { T0, lp0, xmin, xmax, ymin, ymax, xticks, goal, solution, readout } = {}) {
  const S = SUBST[key];
  return {
    kind: 'graph', xmin, xmax, ymin, ymax, height: 380, padL: 66, grid: false,
    axes: { xticks, yticks: 1, xlabel: 'temperature (°C)', ylabel: 'pressure (atm)', yAt: ymin, xAt: xmin, yfmt: (v) => sig(10 ** v, 1, true) },
    params: { T: { min: xmin, max: xmax, step: 1, value: T0, slider: false }, lp: { min: ymin, max: ymax, step: 0.05, value: lp0, slider: false } },
    curves: [
      { f: (x) => Math.log10(subl(S, x)), from: xmin, to: S.tp[0], color: 'ink' },
      { f: (x) => Math.log10(vap(S, x)), from: S.tp[0], to: S.cp[0], color: 'ink' },
      { param: { x: (t) => meltT(S, 10 ** t), y: (t) => t, t0: Math.log10(S.tp[1]), t1: ymax }, color: 'ink' },
      { f: () => 0, color: 'muted', dash: true },
    ],
    under: ({ plot, s }) => [
      s('text', { x: plot.X((xmin + S.tp[0]) / 2), y: plot.Y(ymax - (ymax - ymin) * 0.3), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--blue);${FS(16)}`, text: 'SOLID' }),
      s('text', { x: plot.X(S.tp[0] + (S.cp[0] - S.tp[0]) * 0.4), y: plot.Y(ymax - (ymax - ymin) * 0.12), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--teal);${FS(16)}`, text: 'LIQUID' }),
      s('text', { x: plot.X(S.tp[0] + (xmax - S.tp[0]) * 0.6), y: plot.Y(ymin + (ymax - ymin) * 0.14), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--coral);${FS(16)}`, text: 'GAS' }),
    ],
    extra: ({ plot, s }) => [
      s('circle', { cx: plot.X(S.tp[0]), cy: plot.Y(Math.log10(S.tp[1])), r: 5, fill: 'var(--ink)' }),
      s('circle', { cx: plot.X(S.cp[0]), cy: plot.Y(Math.log10(S.cp[1])), r: 5, fill: 'var(--ink)' }),
      s('text', { x: plot.X(S.tp[0]) + 8, y: plot.Y(Math.log10(S.tp[1])) + 18, class: 'lbl halo-text', style: `fill:var(--ink-2);${FS(12)}`, text: 'triple point' }),
      s('text', { x: plot.X(S.cp[0]) - 6, y: plot.Y(Math.log10(S.cp[1])) - 10, 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--ink-2);${FS(12)}`, text: 'critical point' }),
    ],
    points: [{ x: (p) => p.T, y: (p) => p.lp, color: 'violet', drag: { x: 'T', y: 'lp' }, ariaLabel: 'Temperature and pressure' }],
    readout: readout || ((p) => `${fix(p.T, 0)} °C, ${sig(10 ** p.lp, 2, true)} atm: **${phaseOf(S, p.T, 10 ** p.lp)}**`),
    goal, solution,
  };
}

// ---------- vapour pressure and boiling ----------
const VAPB = 5209;
const boilAt = (P) => 1 / (1 / 373.15 - Math.log(P) / VAPB) - K;

// ---------- thin-layer chromatography: three dyes of different polarity ----------
const DYES = [['yellow', 0.25, 'amber'], ['pink', 0.5, 'pink'], ['blue', 0.75, 'blue']];
const rf = (pol, sv) => 1 / (1 + Math.exp(6 * (pol - sv)));

// ---------- distillation: equilibrium stages with relative volatility 2.4 ----------
const ALPHA = 2.4;
const yOf = (x) => (ALPHA * x) / (1 + (ALPHA - 1) * x);
const stages = (x0, n) => { const xs = [x0]; for (let i = 0; i < n; i++) xs.push(yOf(xs[xs.length - 1])); return xs; };

// ---------- London forces: two electron clouds that flicker in step ----------
// how far each cloud has slid sideways (left atom, then the right one, which follows it a moment later)
const lonL = (t) => 0.55 * Math.sin(2.1 * t) + 0.35 * Math.sin(3.7 * t + 1) + 0.22 * Math.sin(5.9 * t + 2);
const lonR = (t) => 0.85 * lonL(t - 0.15);

// ---------- a closed flask: molecules escape at a steady rate and return at a rate that grows ----------
// precomputed once (seeded), then played back frame by frame
let VAP = null;
const vapSim = () => {
  if (VAP) return VAP;
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const DT = 0.02, STEPS = 1100, x0 = 0.6, x1 = 5.4, yS = 1.3, yT = 5.1, RATE = 4;
  let gas = [], frames = [], escT = [], retT = [], next = 0.1;
  for (let k = 0; k <= STEPS; k++) {
    const t = k * DT;
    if (t >= next) {
      next += 1 / RATE;
      const a = 0.35 + rnd() * 2.44;
      gas.push({ x: x0 + 0.2 + rnd() * (x1 - x0 - 0.4), y: yS + 0.02, vx: 1.6 * Math.cos(a), vy: 1.6 * Math.sin(a) });
      escT.push(t);
    }
    const keep = [];
    for (const g of gas) {
      g.x += g.vx * DT; g.y += g.vy * DT;
      if (g.x < x0 + 0.08) { g.x = 2 * (x0 + 0.08) - g.x; g.vx = -g.vx; }
      if (g.x > x1 - 0.08) { g.x = 2 * (x1 - 0.08) - g.x; g.vx = -g.vx; }
      if (g.y > yT - 0.08) { g.y = 2 * (yT - 0.08) - g.y; g.vy = -g.vy; }
      if (g.y <= yS) { retT.push(t); continue; } // hit the surface: back into the liquid
      keep.push(g);
    }
    gas = keep;
    frames.push(gas.map((g) => [g.x, g.y]));
  }
  VAP = { DT, STEPS, frames, escT, retT, x0, x1, yS, yT };
  return VAP;
};
const vapFrame = (t) => { const v = vapSim(); return Math.max(0, Math.min(v.STEPS, Math.round(t / v.DT))); };
const vapRate = (list, t) => list.filter((q) => q <= t && q > t - 5).length / Math.min(5, Math.max(t, 1));

// ---------- salt dissolving: water molecules turn the right way round each ion and carry it off ----------
const DIS_SM = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const DISSOLVE = (() => {
  let seed = 31;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ions = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) ions.push({ x: 2.6 + i * 0.95, y: 0.75 + j * 0.95, na: (i + j) % 2 === 0, leave: null });
  // the exposed ions (top row and the ends) leave one after another
  const order = [[0, 2], [5, 2], [2, 2], [3, 2], [0, 1], [5, 1], [1, 2], [4, 2]];
  order.forEach(([i, j], k) => {
    const ion = ions.find((q) => Math.abs(q.x - (2.6 + i * 0.95)) < 1e-6 && Math.abs(q.y - (0.75 + j * 0.95)) < 1e-6);
    ion.leave = 0.8 + k * 1.15;
    [ion.tx, ion.ty] = [[0.8, 3.95], [2.0, 5.35], [3.2, 3.95], [4.4, 5.35], [5.6, 3.95], [6.8, 5.35], [8.0, 3.95], [9.2, 5.35]][k];
    ion.spin = rnd() * 6.28;
  });
  return { ions };
})();

// ---------- osmosis: water crosses a membrane both ways, more often into the sugar side, until the height pushes back ----------
const OSM_H = (t) => 1.7 * (1 - Math.exp(-t / 3.2)); // height difference between the two sides
const OSMOSIS = (() => {
  let seed = 41;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const water = [];
  for (const side of [0, 1]) for (let k = 0; k < 26; k++) water.push({ side, u: rnd(), v: rnd(), ph: rnd() * 6.28, w: 0.8 + rnd() * 1.4 });
  const sugar = [];
  for (let k = 0; k < 9; k++) sugar.push({ u: 0.17 + (k % 3) * 0.33 + 0.1 * (rnd() - 0.5), v: 0.17 + Math.floor(k / 3) * 0.33 + 0.1 * (rnd() - 0.5), ph: rnd() * 6.28 });
  // crossings: into the sugar side at a steady rate; back out at a rate that catches up as the height grows
  const cross = [];
  for (let t = 0.2; t < 16; t += 0.42) cross.push({ t: t + 0.2 * rnd(), dir: 1, y: rnd() });
  for (let t = 0.3; t < 16; t += 0.42) if (rnd() < 0.3 + 0.7 * OSM_H(t) / 1.7) cross.push({ t: t + 0.2 * rnd(), dir: -1, y: rnd() });
  return { water, sugar, cross };
})();

export default {
  id: 'imf',
  subject: 'physics',
  title: 'Forces Between Molecules',
  level: 'Intermediate',
  cover: 'imf',
  tagline: 'Why water boils at 100 °C, oil and water don’t mix, and how chemists pull mixtures apart.',
  description: r`Molecules attract one another, weakly but constantly, and those attractions decide whether a substance is a gas, a liquid or a solid at room temperature. Play boiling-point detective with dispersion forces, dipoles and hydrogen bonds, steer a point around the phase diagrams of water and carbon dioxide, see why salt melts ice, and finish by separating mixtures yourself: tune a solvent to pull dyes apart on a chromatography plate and count the stages a still needs to purify a liquid.`,
  prereq: 'Molecular Shapes',
  chapters: [
    {
      title: 'Sticky Molecules',
      summary: 'Three kinds of attraction.',
      lessons: [
        {
          id: 'forces',
          title: 'Sticky Molecules',
          summary: 'Attractions between neighbours',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'Between, not within',
              body: r`The covalent bonds **inside** a molecule are strong: hundreds of kJ per mole. The attractions **between** molecules, called **intermolecular forces**, are typically ten to a hundred times weaker. Yet they decide whether a substance is a gas, a liquid or a solid, because boiling and melting only pull molecules **apart**; they don't break molecules up.

There are three main kinds, from weakest to strongest:
- **London dispersion forces** between all molecules,
- **dipole–dipole forces** between polar molecules,
- **hydrogen bonds**, a specially strong dipole attraction involving H on N, O or F.`,
            },
            {
              type: 'mcq',
              title: 'What breaks when water boils?',
              prompt: 'When water boils, what happens to the molecules?',
              choices: [
                { t: 'They separate from one another; each H₂O stays intact', ok: true },
                { t: 'The O–H bonds break, giving hydrogen and oxygen gas', why: 'That takes far more energy (electrolysis). Steam is still H₂O.' },
                { t: 'The molecules get bigger', why: 'The molecules are unchanged; only the gaps between them grow.' },
              ],
              explain: r`Bubbles in boiling water are water vapour, made of whole $\mathrm{H_2O}$ molecules. Boiling overcomes only the forces **between** molecules.`,
            },
            {
              type: 'explain',
              title: 'A sign of strength',
              body: r`The boiling point is a good gauge of how strongly molecules stick together. These four molecules are all about the same size, yet their boiling points span more than 140 °C:`,
              widget: bars([['propane\nnon-polar', -42, 'muted'], ['dimethyl ether\npolar', -24, 'violet'], ['ethanol\nH-bonds', 78, 'blue'], ['water\nH-bonds', 100, 'blue']], { ymin: -60, ymax: 120, yticks: 30, ylabel: 'boiling point (°C)', height: 300, labelSize: 12 }),
              after: r`Propane ($\mathrm{C_3H_8}$, 44 g/mol) is non-polar; dimethyl ether ($\mathrm{CH_3OCH_3}$, 46 g/mol) is polar; ethanol ($\mathrm{C_2H_5OH}$, 46 g/mol) has the same atoms as dimethyl ether but an O–H group that can hydrogen-bond. Water is smaller still, but every molecule can make up to four hydrogen bonds.`,
            },
            {
              type: 'mcq',
              title: 'Same formula, different boiling points',
              prompt: r`Ethanol and dimethyl ether are both $\mathrm{C_2H_6O}$. Why does ethanol boil about 100 °C higher?`,
              choices: [
                { t: 'Ethanol has an O–H group, so its molecules hydrogen-bond to each other', ok: true },
                { t: 'Ethanol is heavier', why: 'They have exactly the same atoms, so the same mass.' },
                { t: 'Dimethyl ether is non-polar', why: 'Dimethyl ether is polar (bent C–O–C), just without an O–H.' },
              ],
              explain: r`In ethanol the H on oxygen can bond to a lone pair on the oxygen of a neighbouring molecule. Dimethyl ether's hydrogens are all on carbon, which isn't electronegative enough, so it has only weaker dipole–dipole forces.`,
            },
            {
              type: 'order',
              title: 'Rank the forces',
              prompt: 'Put these interactions in order of typical strength, weakest first.',
              items: ['London dispersion between two small molecules', 'Dipole–dipole attraction', 'Hydrogen bond', 'Covalent bond inside a molecule'],
              explain: r`Typical energies: dispersion between small molecules a few kJ/mol, dipole–dipole a few more, hydrogen bonds about 20 kJ/mol, and covalent bonds 200–1000 kJ/mol. (Dispersion grows with size: between long molecules it can beat the others.)`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How much weaker?',
              prompt: r`Boiling water takes 41 kJ/mol. Breaking all the O–H bonds in a mole of water takes about 930 kJ. How many times more energy is that?`,
              answer: 22.7,
              relTol: 0.03,
              wrong: [{ v: 0.044, why: 'Divide the larger by the smaller: 930 ÷ 41.' }],
              explain: r`$930 \div 41 \approx 23$. That's why water evaporates in the sun but needs an electric current or a furnace at thousands of degrees to come apart into hydrogen and oxygen.`,
            },
          ],
          recap: [
            'Intermolecular forces are much weaker than bonds, but set boiling and melting points.',
            'Dispersion (all molecules) < dipole–dipole (polar) < hydrogen bonds (H on N, O, F).',
          ],
        },
        {
          id: 'dispersion',
          title: 'London Forces',
          summary: 'Even non-polar molecules stick',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Flickering dipoles',
              body: r`Even non-polar molecules attract. The electron cloud of a molecule is always sloshing about, so at any instant one side may be slightly negative. That momentary dipole nudges the electrons of a neighbour, creating a matching dipole, and the two attract. These **London dispersion forces** (after Fritz London, 1930) act between all atoms and molecules.

Bigger molecules have bigger, floppier electron clouds and more surface to touch, so the forces grow with size:`,
              widget: bars([['CH₄', -162, 'teal'], ['C₂H₆', -89, 'teal'], ['C₃H₈', -42, 'teal'], ['C₄H₁₀', -0.5, 'teal'], ['C₅H₁₂', 36, 'teal'], ['C₆H₁₄', 69, 'teal'], ['C₇H₁₆', 98, 'teal'], ['C₈H₁₈', 126, 'teal']], { ymin: -180, ymax: 150, yticks: 60, ylabel: 'boiling point (°C)', height: 320, labelSize: 12 }),
              after: r`The straight-chain alkanes from methane to octane. The first four are gases at room temperature (fuel gas, lighter fuel); pentane to octane are liquids (petrol).`,
            },
            { /*chemanim:imf.dispersion*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Clouds that flicker together',
              body: r`Two neighbouring atoms, each a nucleus inside a cloud of electrons. Each cloud wobbles at random, so on average neither atom has a dipole at all. But watch the right one: whenever the left cloud slides towards it, its own electrons are pushed away.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.2, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: 600, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t, u = X(1) - X(0);
                  const atoms = [[2.9, lonL(t), 'var(--blue)'], [7.1, lonR(t), 'var(--coral)']];
                  for (const [x, d, col] of atoms) {
                    out.push(s('circle', { cx: X(x + d * 0.4), cy: Y(4.3), r: 1.1 * Math.min(u, Y(0) - Y(1)), fill: col, opacity: 0.22 }));
                    out.push(s('circle', { cx: X(x + d * 0.4), cy: Y(4.3), r: 1.1 * Math.min(u, Y(0) - Y(1)), fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
                    out.push(s('circle', { cx: X(x), cy: Y(4.3), r: 6, fill: 'var(--ink)' }));
                    if (Math.abs(d) > 0.2) {
                      const side = d > 0 ? 1 : -1;
                      out.push(s('text', { x: X(x + side * 1.8), y: Y(4.3) + 6, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink);${FS(16)}`, text: 'δ−' }));
                      out.push(s('text', { x: X(x - side * 1.8), y: Y(4.3) + 6, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink);${FS(16)}`, text: 'δ+' }));
                    }
                  }
                  // the last few seconds of both wobbles: they move together
                  const x0 = 0.8, x1 = 9.2, span = 5, yc = 1.45;
                  out.push(s('line', { x1: X(x0), x2: X(x1), y1: Y(yc), y2: Y(yc), stroke: 'var(--axis)', 'stroke-width': 1.2 }));
                  for (const [f, col] of [[lonL, 'var(--blue)'], [lonR, 'var(--coral)']]) {
                    let d = '';
                    for (let k = 0; k <= 160; k++) {
                      const tt = t - span + (span * k) / 160;
                      d += `${k ? 'L' : 'M'}${X(x0 + ((x1 - x0) * k) / 160).toFixed(1)} ${Y(yc + 0.85 * f(tt)).toFixed(1)}`;
                    }
                    out.push(s('path', { d, fill: 'none', stroke: col, 'stroke-width': 2.5 }));
                  }
                  out.push(s('text', { x: X(x0), y: Y(2.75), class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'how far each cloud has slid →, over the last few seconds' }));
                  return out;
                },
              },
              after: r`The two traces rise and fall together. Because the second cloud always follows the first, the facing sides are nearly always $\delta-$ next to $\delta+$, so the atoms attract at almost every instant, even though each atom's dipole averages out to zero. That correlation is the London force. A bigger, floppier cloud wobbles further, which is why the force grows with size.`,
            },
            {
              type: 'numeric',
              title: 'Read the trend',
              prompt: r`From the chart, roughly how much does the boiling point rise for each extra $\mathrm{CH_2}$ between pentane and octane? (°C per carbon)`,
              unit: '°C',
              answer: 30,
              tol: 3,
              explain: r`From 36 °C to 126 °C over three steps: about 30 °C per carbon. The jumps shrink slowly as chains get longer (methane to ethane is 73 °C).`,
            },
            {
              type: 'mcq',
              title: 'Branches',
              prompt: r`Pentane (a straight chain) boils at 36 °C. Neopentane, with the same formula $\mathrm{C_5H_{12}}$ but a compact ball shape, boils at:`,
              widget: view('CC(C)(C)C', { h: 170, style: 'skeletal', bond: 60 }),
              choices: [
                { t: '9.5 °C: lower', ok: true },
                { t: '36 °C: the same', why: 'Same atoms, but the shape changes how much surface touches its neighbours.' },
                { t: '60 °C: higher', why: 'A compact molecule touches its neighbours less, not more.' },
              ],
              explain: r`A ball-shaped molecule touches its neighbours over less area than a long chain, so the dispersion forces are weaker and it boils at only 9.5 °C. Think of how spaghetti tangles but marbles roll apart.`,
            },
            {
              type: 'explain',
              title: 'Halogens',
              body: r`Down the halogen group the molecules get bigger, with more electrons: fluorine and chlorine are gases at room temperature, bromine is a liquid, iodine a solid. All are non-polar, so this is dispersion alone.`,
              widget: bars([['F₂', -188, 'teal'], ['Cl₂', -34, 'teal'], ['Br₂', 59, 'coral'], ['I₂', 184, 'violet']], { ymin: -200, ymax: 220, yticks: 100, ylabel: 'boiling point (°C)', height: 280 }),
            },
            {
              type: 'mcq',
              title: 'Geckos',
              prompt: 'A gecko can hang from a glass ceiling by one toe. Each toe has millions of tiny hairs that split into billions of tips. What holds it up?',
              choices: [
                { t: 'Dispersion forces between the hair tips and the glass', ok: true },
                { t: 'Suction cups', why: 'Geckos stick just as well in a vacuum.' },
                { t: 'A sticky glue', why: 'Gecko feet are dry and leave no residue.' },
              ],
              explain: r`Each tip comes within a nanometre of the surface, and the dispersion forces of billions of tips add up to enough to hold the animal. Engineers have copied the idea for reusable dry adhesives.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Predict nonane',
              prompt: r`Using the 30-degrees-per-carbon trend from octane (126 °C), predict the boiling point of nonane, $\mathrm{C_9H_{20}}$.`,
              unit: '°C',
              answer: 156,
              tol: 6,
              explain: r`$126 + 30 = 156$ °C; the measured value is 151 °C. Trends like this let chemists estimate properties of molecules they haven't made yet, and they are the basis of separating crude oil into fractions by boiling point.`,
            },
          ],
          recap: [
            'Dispersion forces come from fleeting dipoles and act between all molecules.',
            'Bigger molecules and longer, straighter shapes → stronger dispersion → higher boiling point.',
          ],
        },
        {
          id: 'hbonds',
          title: 'Hydrogen Bonds',
          summary: 'Why water is so strange',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'A naked proton',
              body: r`When hydrogen is bonded to a very electronegative atom (N, O or F), the bond's electrons are pulled so far away that the hydrogen is almost a bare proton. It is strongly attracted to a lone pair on a nearby N, O or F. That attraction is a **hydrogen bond**: about a tenth as strong as a covalent bond, but much stronger than other intermolecular forces.

The molecule offering the H is the **donor**; the one offering the lone pair is the **acceptor**.`,
            },
            {
              type: 'interactive',
              title: 'Find the donor',
              prompt: r`In ethanol, tap the hydrogen atom that can be donated in a hydrogen bond.`,
              widget: pick({ smiles: 'CCO', explicitH: true, pick: 'H', h: 240, bond: 76, answer: [8], extraMsg: 'That hydrogen is on carbon. Carbon isn’t electronegative enough to leave it bare.', missMsg: 'Look for the hydrogen attached to oxygen.' }),
              explain: r`Only the H on oxygen. The five hydrogens on carbon share their electrons almost equally (C–H is barely polar), so they can't form hydrogen bonds. The oxygen's two lone pairs make ethanol an acceptor as well.`,
            },
            {
              type: 'explain',
              title: 'Water breaks the pattern',
              body: r`Down a group, boiling points of the hydrides normally rise with size (more dispersion). Water should boil around −80 °C to fit its group. Instead it boils at 100 °C.`,
              widget: bars([['H₂O', 100, 'blue'], ['H₂S', -60, 'muted'], ['H₂Se', -41, 'muted'], ['H₂Te', -2, 'muted']], { ymin: -80, ymax: 120, yticks: 40, ylabel: 'boiling point (°C)', height: 280 }),
              after: r`The same happens in other groups: HF and ammonia also boil far higher than their heavier cousins. Without hydrogen bonds there would be no liquid water on Earth, and no life as we know it.`,
            },
            {
              type: 'numeric',
              title: 'Four per molecule',
              prompt: r`A water molecule has two hydrogens it can donate and two lone pairs that can accept. In ice, how many hydrogen bonds does each molecule take part in?`,
              unit: 'hydrogen bonds',
              answer: 4,
              wrong: [{ v: 2, why: 'Count both what it donates (2) and what it accepts (2).' }],
              explain: r`Four: two as donor, two as acceptor, pointing to the corners of a tetrahedron. Each bond is shared by two molecules, so there are two hydrogen bonds per molecule in total.`,
            },
            {
              type: 'mcq',
              title: 'Floating ice',
              prompt: 'Almost every solid sinks in its own liquid. Why does ice float on water?',
              choices: [
                { t: 'Hydrogen bonds lock ice into an open framework that takes more room than the liquid', ok: true },
                { t: 'Ice contains trapped air bubbles', why: 'Even bubble-free ice floats: it is about 9% less dense than liquid water.' },
                { t: 'Cold things always rise', why: 'Cold liquid water near 0 °C is actually slightly less dense than at 4 °C, but solids usually sink.' },
              ],
              explain: r`In ice every molecule is held at tetrahedral angles to four others, forming an open hexagonal lattice with lots of empty space. When ice melts, the framework partly collapses and the molecules pack closer. That's why lakes freeze from the top down and fish survive winter beneath the ice.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Donors and acceptors',
              prompt: r`In acetic acid, tap every atom that can **accept** a hydrogen bond (one with a lone pair on N, O or F).`,
              widget: pick({ smiles: 'CC(=O)O', h: 230, bond: 80, pick: 'heavy', answer: [2, 3], extraMsg: 'Carbon has no lone pairs to offer.', missMsg: 'Both oxygens have lone pairs.' }),
              explain: r`Both oxygens accept, and the OH hydrogen donates. So acetic acid molecules pair up face to face with two hydrogen bonds, even in the vapour: a "dimer" that behaves like one bigger molecule.`,
            },
          ],
          recap: [
            'Hydrogen bonds: H on N, O or F attracted to a lone pair on N, O or F.',
            'They give water its high boiling point and make ice float.',
          ],
        },
      ],
    },
    {
      title: 'States of Matter',
      summary: 'Solid, liquid, gas and in between.',
      lessons: [
        {
          id: 'phases',
          title: 'Phase Diagrams',
          summary: 'A map of solid, liquid and gas',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A map for a substance',
              body: r`A **phase diagram** shows which state a substance is in at every temperature and pressure. The lines are where two states coexist: melting, boiling or subliming. At the **triple point** all three coexist; beyond the **critical point** liquid and gas merge into one fluid.

Drag the point around water's diagram. The pressure axis is logarithmic, and the dashed line is 1 atmosphere.`,
              widget: phaseDiagram('water', { T0: 25, lp0: 0, xmin: -80, xmax: 400, ymin: -3.5, ymax: 3.5, xticks: 100 }),
            },
            {
              type: 'mcq',
              title: 'Going up a mountain',
              prompt: 'On a high mountain the air pressure is lower. Following water’s boiling line, what happens to the boiling point?',
              choices: [
                { t: 'It falls', ok: true },
                { t: 'It rises', why: 'The boiling line slopes up to the right: lower pressure meets it at a lower temperature.' },
                { t: 'It stays at 100 °C', why: '100 °C is the boiling point only at 1 atmosphere.' },
              ],
              explain: r`Lower pressure, lower boiling point. On top of Everest (about 0.33 atm) water boils at about 71 °C, too cool to cook pasta properly. A pressure cooker does the opposite.`,
            },
            {
              type: 'numeric',
              title: 'Pressure cooker',
              prompt: r`A pressure cooker raises the pressure to about 2 atm. Drag the point onto the boiling line at 2 atm: at what temperature does water boil? (Nearest degree.)`,
              widget: phaseDiagram('water', { T0: 100, lp0: 0, xmin: -80, xmax: 400, ymin: -3.5, ymax: 3.5, xticks: 100 }),
              unit: '°C',
              answer: 121,
              tol: 3,
              explain: r`About 120 °C. Food cooks much faster at 120 °C than 100 °C, which is the whole point of a pressure cooker (and of the autoclaves that sterilise surgical tools).`,
            },
            {
              type: 'interactive',
              title: 'Freeze-drying',
              prompt: r`Freeze-dried coffee is made by turning ice **straight into vapour**, without melting. Put the point where ice sublimes: in the solid region, below the triple-point pressure.`,
              widget: phaseDiagram('water', { T0: 25, lp0: 0, xmin: -80, xmax: 400, ymin: -3.5, ymax: 3.5, xticks: 100, goal: (p) => (phaseOf(SUBST.water, p.T, 10 ** p.lp) === 'solid' && 10 ** p.lp < 0.00604 ? true : { ok: false, msg: 'The point must be in the solid region and below the triple point (about 0.006 atm).' }), solution: { T: -20, lp: -2.6 } }),
              explain: r`Below 0.006 atm, warming ice takes it straight across the sublimation line into vapour. Freeze-dryers chill food and pump the air out so the ice sublimes, leaving the food's structure intact.`,
            },
            {
              type: 'explain',
              title: 'Water’s backwards line',
              body: r`Look closely at the line between ice and liquid water: it leans slightly to the **left**. Squeezing ice can melt it, because liquid water is denser than ice. For nearly every other substance the melting line leans right.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Liquid carbon dioxide',
              prompt: r`Dry ice never melts in your freezer: at 1 atm it sublimes at −78 °C. Find conditions where carbon dioxide is a **liquid**.`,
              widget: phaseDiagram('co2', { T0: -78, lp0: 0, xmin: -120, xmax: 60, ymin: -1, ymax: 3, xticks: 30, goal: (p) => (phaseOf(SUBST.co2, p.T, 10 ** p.lp) === 'liquid' ? true : { ok: false, msg: 'Liquid CO₂ needs more than its triple-point pressure (5.1 atm).' }), solution: { T: 0, lp: 1.7 } }),
              explain: r`Carbon dioxide's triple point is at 5.1 atm, so at ordinary pressure there is no liquid at all. Squeeze it above 5.1 atm (a fire extinguisher holds it at about 60 atm) and between −57 °C and 31 °C it's a liquid. Above 31 °C and 73 atm it becomes supercritical, used to decaffeinate coffee.`,
            },
          ],
          recap: [
            'Lines are where two phases coexist; the triple point is where all three do.',
            'Lower pressure → lower boiling point.',
            'CO₂ has no liquid below 5.1 atm; water’s melting line leans backwards.',
          ],
        },
        {
          id: 'vapour',
          title: 'Vapour Pressure & Boiling',
          summary: 'Escaping molecules',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Molecules escaping',
              body: r`At any temperature a few molecules at a liquid's surface have enough energy to break free. In a closed container they build up a **vapour pressure**, which rises steeply with temperature. A liquid **boils** when its vapour pressure equals the pressure of the air above it: bubbles of vapour can then form inside it.

Change the air pressure and watch where the boiling point lands.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 130, ymin: 0, ymax: 2.2, height: 330, grid: false,
                axes: { xticks: 20, yticks: 0.5, xlabel: 'temperature (°C)', ylabel: 'pressure (atm)', yAt: 0, xAt: 0 },
                params: { P: { min: 0.2, max: 2, step: 0.01, value: 1, label: 'Air pressure', format: (v) => `${fix(v, 2)} atm` } },
                curves: [{ f: (x) => Math.exp(VAPB * (1 / 373.15 - 1 / (x + K))), color: 'blue' }, { f: (x, p) => p.P, color: 'muted', dash: true }],
                points: [{ x: (p) => boilAt(p.P), y: (p) => p.P, color: 'coral' }],
                readout: (p) => `water boils at **${fix(boilAt(p.P), 1)} °C** under ${fix(p.P, 2)} atm`,
              },
            },
            { /*chemanim:imf.vapour*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A balance in a closed flask',
              body: r`Water in a sealed flask, with empty space above it. Molecules escape from the surface at a steady rate. Any molecule of vapour that hits the surface again is recaptured, and the more vapour there is, the more often that happens.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5.6, grid: false, axes: false, height: 290,
                animate: { param: 't', speed: 1.5, max: 22, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], v = vapSim(), k = vapFrame(p.t);
                  // flask, liquid, vapour molecules
                  out.push(s('rect', { x: X(v.x0), y: Y(v.yS), width: X(v.x1) - X(v.x0), height: Y(0.3) - Y(v.yS), fill: 'var(--blue)', opacity: 0.3 }));
                  out.push(s('rect', { x: X(v.x0), y: Y(v.yT), width: X(v.x1) - X(v.x0), height: Y(0.3) - Y(v.yT), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5, rx: 6 }));
                  for (const [x, y] of v.frames[k]) out.push(s('circle', { cx: X(x), cy: Y(y), r: 4.5, fill: 'var(--blue)' }));
                  // molecules in the vapour against time
                  const gx0 = 6.3, gx1 = 9.7, gy0 = 1.0, gy1 = 4.6, NMAX = 45;
                  const GX = (t) => gx0 + ((gx1 - gx0) * t) / 22, GY = (n) => gy0 + ((gy1 - gy0) * n) / NMAX;
                  out.push(s('path', { d: `M${X(gx0)} ${Y(gy1)}V${Y(gy0)}H${X(gx1)}`, fill: 'none', stroke: 'var(--axis)', 'stroke-width': 1.5 }));
                  let d = '';
                  for (let j = 0; j <= k; j += 5) d += `${d ? 'L' : 'M'}${X(GX(j * v.DT)).toFixed(1)} ${Y(GY(v.frames[j].length)).toFixed(1)}`;
                  out.push(s('path', { d, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2.5 }));
                  out.push(s('text', { x: X(gx0), y: Y(gy1) - 8, class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'molecules in the vapour' }));
                  out.push(s('text', { x: X(gx1), y: Y(gy0) + 18, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'time →' }));
                  return out;
                },
                readout: (p) => {
                  const v = vapSim();
                  return `escaping: ${fix(vapRate(v.escT, p.t), 1)} per second · returning: ${fix(vapRate(v.retT, p.t), 1)} per second`;
                },
              },
              after: r`At first nothing comes back, so the vapour builds up. As it fills, more molecules land on the surface each second, until returning matches escaping. From then on the amount of vapour stays roughly constant even though molecules never stop swapping: a **dynamic equilibrium**. The pressure of that vapour is the liquid's **vapour pressure**. Heat the liquid and more molecules escape each second, so the balance settles at a higher pressure.`,
            },
            {
              type: 'interactive',
              title: 'Everest tea',
              prompt: r`Set the pressure so that water boils at 70 °C.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 130, ymin: 0, ymax: 2.2, height: 330, grid: false,
                axes: { xticks: 20, yticks: 0.5, xlabel: 'temperature (°C)', ylabel: 'pressure (atm)', yAt: 0, xAt: 0 },
                params: { P: { min: 0.2, max: 2, step: 0.01, value: 1, label: 'Air pressure', format: (v) => `${fix(v, 2)} atm` } },
                curves: [{ f: (x) => Math.exp(VAPB * (1 / 373.15 - 1 / (x + K))), color: 'blue' }, { f: (x, p) => p.P, color: 'muted', dash: true }],
                points: [{ x: (p) => boilAt(p.P), y: (p) => p.P, color: 'coral' }],
                readout: (p) => `boils at **${fix(boilAt(p.P), 1)} °C**`,
                goal: (p) => (Math.abs(boilAt(p.P) - 70) <= 0.6 ? true : { ok: false, msg: boilAt(p.P) > 70 ? 'Still too hot: lower the pressure.' : 'Too cool: raise the pressure a little.' }),
                solution: { P: 0.3 },
              },
              explain: r`About 0.3 atm, close to the pressure on the summit of Everest. Tea made there never gets hotter than about 70 °C.`,
            },
            {
              type: 'mcq',
              title: 'Evaporating without boiling',
              prompt: 'A puddle dries up on a 20 °C day, far below 100 °C. How?',
              choices: [
                { t: 'The fastest molecules escape from the surface; this evaporation happens at any temperature', ok: true },
                { t: 'The sun heats the puddle to 100 °C', why: 'Puddles dry on cloudy days too, and never get near 100 °C.' },
                { t: 'Water soaks into the ground only', why: 'Puddles on glass or plastic dry up too.' },
              ],
              explain: r`Molecules have a spread of energies, and at the surface some always have enough to escape. Boiling is just the temperature at which escaping becomes so vigorous that vapour forms inside the liquid as well.`,
            },
            {
              type: 'mcq',
              title: 'Which evaporates fastest?',
              prompt: 'At room temperature, which of these liquids has the highest vapour pressure?',
              choices: [
                { t: 'Acetone (boils at 56 °C)', ok: true },
                { t: 'Water (boils at 100 °C)', why: 'A higher boiling point means a lower vapour pressure at any given temperature.' },
                { t: 'Glycerol (boils at 290 °C)', why: 'Glycerol has three OH groups and barely evaporates at all.' },
              ],
              explain: r`Weaker intermolecular forces → molecules escape more easily → higher vapour pressure → lower boiling point. Nail-polish remover (acetone) vanishes in seconds; glycerol stays for weeks.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sweating it out',
              prompt: r`Evaporating water takes 2.4 kJ per gram at body temperature. How many kJ does your body lose by sweating away 500 g of water during a workout?`,
              unit: 'kJ',
              answer: 1200,
              tol: 1,
              explain: r`$500 \times 2.4 = 1200$ kJ, about what a 60 kg person burns in an hour of brisk exercise. The escaping molecules carry off the most energetic ones, which is why evaporation cools.`,
            },
          ],
          recap: [
            'Vapour pressure rises steeply with temperature.',
            'Boiling: vapour pressure = outside pressure.',
            'Weaker intermolecular forces → higher vapour pressure, lower boiling point.',
          ],
        },
      ],
    },
    {
      title: 'Mixtures',
      summary: 'Dissolving, and taking apart again.',
      lessons: [
        {
          id: 'dissolving',
          title: 'Like Dissolves Like',
          summary: 'Why oil and water don’t mix',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Swapping partners',
              body: r`Dissolving means replacing contacts between like molecules with contacts between unlike ones. If the new contacts are about as strong as the old ones, things mix; if not, they don't. Hence the rule **like dissolves like**: polar dissolves polar, non-polar dissolves non-polar.

Oil doesn't dissolve in water because water molecules would have to give up their strong hydrogen bonds to each other to make room for oil molecules that can't hydrogen-bond back.`,
            },
            {
              type: 'mcq',
              title: 'Stain removal',
              prompt: 'A grease stain won’t wash out with water. Which liquid is most likely to dissolve it?',
              choices: [
                { t: 'Hexane (a non-polar hydrocarbon)', ok: true },
                { t: 'Salt water', why: 'Even more polar than plain water: worse for grease.' },
                { t: 'Vinegar', why: 'Mostly water, so still polar.' },
              ],
              explain: r`Grease is long non-polar chains, so a non-polar solvent like hexane mixes with it freely. Dry cleaning uses non-polar solvents for exactly this reason.`,
            },
            {
              type: 'explain',
              title: 'A tug of war inside one molecule',
              body: r`Alcohols have a polar OH head and a non-polar carbon tail. As the tail grows, the molecule behaves more and more like oil:`,
              widget: bars([['methanol\nC1', 100, 'blue'], ['ethanol\nC2', 100, 'blue'], ['propanol\nC3', 100, 'blue'], ['butanol\nC4', 7.7, 'violet'], ['pentanol\nC5', 2.2, 'violet'], ['hexanol\nC6', 0.59, 'violet']], { ymax: 110, yticks: 25, ylabel: 'dissolves (g per 100 g water)', height: 300, fmt: (v) => (v >= 100 ? 'all' : fix(v, v < 1 ? 2 : 1)), labelSize: 12 }),
              after: r`The first three mix with water in any proportion ("all"). From four carbons on, the tail wins.`,
            },
            {
              type: 'explain',
              title: 'Soap: both at once',
              body: r`A soap molecule has a charged, water-loving head and a long greasy tail. In water, soap molecules gather into tiny balls called **micelles**, tails inward, heads outward. Grease dissolves in the oily core and the whole ball washes away in water.`,
              widget: {
                kind: 'graph', xmin: -5, xmax: 5, ymin: -3, ymax: 3, grid: false, axes: false, height: 260, equal: true,
                extra: ({ plot, s }) => {
                  const out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1.1) - plot.X(0), fill: 'var(--amber-soft)', stroke: 'var(--amber)', 'stroke-width': 2 })];
                  for (let k = 0; k < 16; k++) {
                    const a = (k / 16) * 2 * Math.PI, c = Math.cos(a), sn = Math.sin(a);
                    let d = `M${plot.X(2.35 * c)} ${plot.Y(2.35 * sn)}`;
                    for (let j = 1; j <= 6; j++) { const rr = 2.35 - j * 0.2, w = (j % 2 ? 0.08 : -0.08); d += `L${plot.X(rr * c - w * sn)} ${plot.Y(rr * sn + w * c)}`; }
                    out.push(s('path', { d, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
                    out.push(s('circle', { cx: plot.X(2.5 * c), cy: plot.Y(2.5 * sn), r: 9, fill: 'var(--blue)' }));
                  }
                  out.push(s('text', { x: plot.X(0), y: plot.Y(0) + 5, 'text-anchor': 'middle', class: 'lbl', style: FS(13), text: 'grease' }));
                  return out;
                },
              },
            },
            { /*chemanim:imf.dissolving*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Water takes a crystal apart',
              body: r`Salt is a stack of $\mathrm{Na^+}$ and $\mathrm{Cl^-}$ ions held by strong attractions. Water can still dissolve it, because each water molecule is a small dipole: oxygen slightly negative, hydrogens slightly positive. Watch how the water molecules turn as they crowd round each ion.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.3, grid: false, axes: false, height: 310,
                animate: { param: 't', speed: 0.9, max: 13, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), u = X(1) - X(0), out = [], t = p.t;
                  // a water molecule: O at (x, y), its two H's on the far side from direction a (a points from the H's to O)
                  const water = (x, y, a, op = 1) => {
                    const els = [];
                    for (const sd of [-1, 1]) {
                      const b = a + Math.PI + sd * 0.912, hx = x + Math.cos(b) * 0.24, hy = y + Math.sin(b) * 0.24;
                      els.push(s('line', { x1: X(x), y1: Y(y), x2: X(hx), y2: Y(hy), stroke: 'var(--ink)', 'stroke-opacity': 0.5, 'stroke-width': 2.5, opacity: op }));
                      els.push(s('circle', { cx: X(hx), cy: Y(hy), r: 0.075 * u, fill: 'var(--card)', stroke: 'var(--ink-3)', 'stroke-width': 1.3, opacity: op }));
                    }
                    els.push(s('circle', { cx: X(x), cy: Y(y), r: 0.13 * u, fill: 'var(--coral)', opacity: op }));
                    return els;
                  };
                  for (const ion of DISSOLVE.ions) {
                    let x = ion.x, y = ion.y, shell = 0;
                    if (ion.leave != null) {
                      shell = DIS_SM((t - ion.leave + 0.6) / 0.6);
                      const go = DIS_SM((t - ion.leave) / 2.2);
                      x = ion.x + (ion.tx - ion.x) * go + 0.08 * go * Math.sin(1.3 * t + ion.spin);
                      y = ion.y + (ion.ty - ion.y) * go;
                    }
                    // hydration shell: oxygen inwards for Na+, a hydrogen inwards for Cl−
                    if (shell > 0) for (let k = 0; k < 4; k++) {
                      const g = ion.spin + (k * Math.PI) / 2 + 0.2 * Math.sin(t + k), dist = ion.na ? 0.42 : 0.56;
                      const wx = x + Math.cos(g) * dist * (2 - shell), wy = y + Math.sin(g) * dist * (2 - shell);
                      const toIon = Math.atan2(y - wy, x - wx);
                      out.push(...water(wx, wy, ion.na ? toIon : toIon - 2.23, shell));
                    }
                    out.push(s('circle', { cx: X(x), cy: Y(y), r: (ion.na ? 0.22 : 0.33) * u, fill: ion.na ? 'var(--violet-soft)' : 'var(--teal-soft)', stroke: ion.na ? 'var(--violet)' : 'var(--teal)', 'stroke-width': 2.2 }));
                    out.push(s('text', { x: X(x), y: Y(y) + 4, 'text-anchor': 'middle', class: 'lbl', style: FS(ion.na ? 10 : 11), text: ion.na ? '+' : '−' }));
                  }
                  return out;
                },
                readout: (p) => (p.t < 0.8 ? 'Violet: Na⁺. Green: Cl⁻. Water (red O, white H) closes in.' : 'Oxygen ends face each Na⁺; hydrogen ends face each Cl⁻.'),
              },
              after: r`Each ion that leaves trades its neighbours in the crystal for a shell of water molecules, all turned the right way: the negative oxygen ends point at {violet:sodium}, a positive hydrogen points at {teal:chloride}. Those many small attractions together nearly pay for breaking the crystal apart. Oil has no dipoles to offer, which is why salt won't dissolve in it.`,
            },
            {
              type: 'multi',
              kicker: 'Challenge',
              title: 'Will it dissolve in water?',
              prompt: 'Which of these dissolve well in water?',
              choices: [
                { t: 'Table salt (ionic)', ok: true },
                { t: 'Sugar (many OH groups)', ok: true },
                { t: 'Ethanol', ok: true },
                { t: 'Candle wax (long hydrocarbon chains)', why: 'Wax is non-polar: like oil, it doesn’t mix with water.' },
                { t: 'Iodine, I₂', why: 'I₂ is non-polar; it dissolves only slightly in water (better in alcohol or hexane).' },
              ],
              explain: r`Water's polarity lets it surround ions (the negative oxygen end towards $\mathrm{Na^+}$, the hydrogens towards $\mathrm{Cl^-}$) and hydrogen-bond to sugar and ethanol. Wax and iodine have nothing for water to grab.`,
            },
          ],
          recap: [
            'Like dissolves like: polar with polar, non-polar with non-polar.',
            'Long non-polar tails make molecules less soluble in water.',
            'Soap bridges the two with a polar head and a greasy tail.',
          ],
        },
        {
          id: 'colligative',
          title: 'Salt on Ice',
          summary: 'Dissolved particles shift boiling and freezing',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Counting particles',
              body: r`Dissolve something in water and it freezes at a lower temperature and boils at a higher one. Remarkably, the size of the shift depends only on **how many** dissolved particles there are, not what they are. For water,
$$\Delta T_{\text{freeze}} = 1.86\ ^\circ\text{C} \times m \times i$$
where $m$ is moles of solute per kilogram of water and $i$ is the number of particles each unit splits into: 1 for sugar, 2 for NaCl ($\mathrm{Na^+}$ and $\mathrm{Cl^-}$), 3 for $\mathrm{CaCl_2}$.`,
            },
            {
              type: 'numeric',
              title: 'Salted water',
              prompt: r`58.5 g of salt (1 mole of NaCl) is dissolved in 1 kg of water. By how many degrees does its freezing point drop?`,
              unit: '°C',
              answer: 3.72,
              tol: 0.02,
              wrong: [{ v: 1.86, why: r`NaCl splits into two ions, so $i = 2$.` }],
              explain: r`$1.86 \times 1 \times 2 = 3.72$ °C: the water now freezes at about −3.7 °C. (Real salt water deviates a little because the ions cling together.)`,
            },
            {
              type: 'interactive',
              title: 'De-icing the road',
              prompt: r`Calcium chloride ($i = 3$) is used to de-ice roads in very cold places. How many moles per kg of water lower the freezing point to −20 °C?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 5, ymin: -30, ymax: 2, height: 300, grid: false,
                axes: { xticks: 1, yticks: 10, xlabel: 'moles per kg of water', ylabel: 'freezing point (°C)', yAt: -30, xAt: 0 },
                params: { m: { min: 0, max: 5, step: 0.05, value: 1, label: 'Calcium chloride', format: (v) => `${fix(v, 2)} mol/kg` } },
                curves: [{ f: (x) => -1.86 * 3 * x, color: 'blue' }, { f: () => -20, color: 'muted', dash: true }],
                points: [{ x: (p) => p.m, y: (p) => -1.86 * 3 * p.m, color: 'coral' }],
                readout: (p) => `freezes at **${fix(-1.86 * 3 * p.m, 1)} °C**`,
                goal: (p) => (Math.abs(-5.58 * p.m + 20) <= 0.5 ? true : { ok: false, msg: -5.58 * p.m > -20 ? 'Not cold enough yet: add more.' : 'That’s more than you need.' }),
                solution: { m: 3.6 },
              },
              explain: r`$20 \div (1.86 \times 3) \approx 3.6$ mol/kg. Calcium chloride does more per mole than NaCl because each unit releases three ions, and dissolving it gives off heat too.`,
            },
            {
              type: 'mcq',
              title: 'Antifreeze',
              prompt: 'Car antifreeze (ethylene glycol) also raises the boiling point of the coolant. Why is that useful?',
              choices: [
                { t: 'The engine can run hotter without the coolant boiling over', ok: true },
                { t: 'It makes the engine use less fuel directly', why: 'It protects the cooling system; it doesn’t burn.' },
                { t: 'It stops the water evaporating in the radiator cap', why: 'The main benefit is a wider liquid range: lower freezing and higher boiling.' },
              ],
              explain: r`Dissolved particles widen the liquid range at both ends: they make it harder for the water molecules to line up into ice and harder for them to escape as vapour.`,
            },
            {
              type: 'explain',
              title: 'Osmosis',
              body: r`Particles also pull water through membranes. If a membrane lets water through but not the dissolved particles, water flows towards the side with more particles, building up an **osmotic pressure**:
$$\Pi = i\,c\,R\,T$$
That's why salted cucumbers shrivel into pickles, why drinking seawater dehydrates you, and why hospital drips must match the particle concentration of blood.`,
            },
            { /*chemanim:imf.colligative*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Water through a membrane',
              body: r`Pure water on the left, sugar solution on the right, separated by a membrane with pores big enough for water molecules but too small for sugar. Water molecules cross in both directions, but dissolved sugar makes water less inclined to leave its side (the same effect that lowers its vapour pressure and freezing point), so more crosses in than out.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 300,
                animate: { param: 't', speed: 1, max: 16, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), u = X(1) - X(0), out = [], t = p.t, h = OSM_H(t);
                  const lv = [3 - h / 2, 3 + h / 2], xs = [[0.6, 4.85], [5.15, 9.4]];
                  for (const side of [0, 1]) out.push(s('rect', { x: X(xs[side][0]), y: Y(lv[side]), width: X(xs[side][1]) - X(xs[side][0]), height: Y(0.3) - Y(lv[side]), fill: 'var(--blue)', opacity: 0.16 }));
                  out.push(s('path', { d: `M${X(0.6)} ${Y(5.7)}V${Y(0.3)}H${X(9.4)}V${Y(5.7)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }));
                  out.push(s('line', { x1: X(5), x2: X(5), y1: Y(5.7), y2: Y(0.3), stroke: 'var(--ink-2)', 'stroke-width': 3, 'stroke-dasharray': '7 5' }));
                  const place = (side, a, b, pad) => [xs[side][0] + pad + a * (xs[side][1] - xs[side][0] - 2 * pad), 0.3 + pad + b * (lv[side] - 0.3 - 2 * pad)];
                  for (const w of OSMOSIS.water) {
                    const [x, y] = place(w.side, (w.u + 0.04 * Math.sin(w.w * t + w.ph) + 1) % 1, (w.v + 0.04 * Math.cos(w.w * t)) % 1, 0.12);
                    out.push(s('circle', { cx: X(x), cy: Y(y), r: 0.07 * u, fill: 'var(--blue)', opacity: 0.8 }));
                  }
                  for (const q of OSMOSIS.sugar) {
                    const [x, y] = place(1, q.u + 0.05 * Math.sin(1.1 * t + q.ph), q.v + 0.05 * Math.cos(0.9 * t + q.ph), 0.25);
                    out.push(s('circle', { cx: X(x), cy: Y(y), r: 0.17 * u, fill: 'var(--amber)', stroke: 'var(--warn)', 'stroke-width': 1.5 }));
                  }
                  // molecules passing through the membrane right now
                  for (const c of OSMOSIS.cross) {
                    const f = (t - c.t) / 0.8;
                    if (f < 0 || f > 1) continue;
                    const x = c.dir > 0 ? 4.3 + 1.4 * f : 5.7 - 1.4 * f, y = 0.6 + c.y * (Math.min(lv[0], lv[1]) - 0.9);
                    out.push(s('circle', { cx: X(x), cy: Y(y), r: 0.1 * u, fill: 'var(--blue)', stroke: 'var(--card)', 'stroke-width': 1.5 }));
                  }
                  out.push(s('text', { x: X(2.7), y: Y(5.6) + 12, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(13)}`, text: 'pure water' }));
                  out.push(s('text', { x: X(7.3), y: Y(5.6) + 12, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(13)}`, text: 'sugar solution' }));
                  if (h > 0.4) {
                    out.push(s('line', { x1: X(9.7), x2: X(9.7), y1: Y(lv[0]), y2: Y(lv[1]), stroke: 'var(--coral)', 'stroke-width': 2.5 }));
                    out.push(s('line', { x1: X(4.85), x2: X(9.85), y1: Y(lv[0]), y2: Y(lv[0]), stroke: 'var(--coral)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
                  }
                  return out;
                },
                readout: (p) => (p.t < 0.6 ? 'Both sides start at the same level.' : p.t < 9 ? 'More water crosses into the sugar side than comes back: its level rises.' : 'The extra height pushes back; now water crosses equally both ways.'),
              },
              after: r`Water keeps flowing into the sugar side until the weight of the extra column (the {coral:coral bar}) pushes water back through the membrane as fast as it arrives. The pressure needed to stop the flow is the **osmotic pressure**, $\Pi = icRT$. Notice that it depends only on how many dissolved particles there are, not what they are: that's why it belongs with the freezing-point drop.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The pressure in your cells',
              prompt: r`Blood has about 0.30 moles of dissolved particles per litre. What osmotic pressure does that correspond to at body temperature, 310 K? (Use $R = 0.0821$ L·atm/(mol·K).)`,
              unit: 'atm',
              answer: 7.64,
              relTol: 0.02,
              explain: r`$\Pi = 0.30 \times 0.0821 \times 310 \approx 7.6$ atm, the pressure under nearly 80 m of water. Red blood cells put in pure water swell and burst because of it.`,
            },
          ],
          recap: [
            'Freezing-point drop and boiling-point rise depend on the number of dissolved particles.',
            'ΔT_f = 1.86 °C × m × i for water.',
            'Osmotic pressure Π = icRT pulls water towards more particles.',
          ],
        },
        {
          id: 'chromatography',
          title: 'Chromatography',
          summary: 'A race on a plate',
          icon: 'play',
          steps: [
            {
              type: 'explain',
              title: 'A race on a plate',
              body: r`In **thin-layer chromatography** a spot of mixture is put near the bottom of a plate coated with polar silica, and a solvent creeps up the plate. Each compound is pulled two ways: it sticks to the polar plate and it dissolves in the moving solvent. Less polar compounds stick less and travel further. The distance travelled divided by how far the solvent got is the compound's $R_f$.

Here three dyes run in a fairly non-polar solvent. Press play.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 10, grid: false, axes: false, height: 300,
                params: { sv: { min: 0, max: 1, step: 0.05, value: 0.3, slider: false } },
                animate: { param: 't', speed: 0.35, max: 1, loop: false },
                under: ({ plot, s }) => [s('rect', { x: plot.X(2), y: plot.Y(9.6), width: plot.X(8) - plot.X(2), height: plot.Y(0.4) - plot.Y(9.6), rx: 6, fill: 'var(--card)', stroke: 'var(--line-2)', 'stroke-width': 2 })],
                extra: ({ plot, p, s }) => tlc(plot, p, s),
                readout: (p) => (p.t < 1 ? 'The solvent is rising…' : DYES.map(([n, pol]) => `${n} ${fix(rf(pol, p.sv), 2)}`).join(' · ') + ' (Rf values)'),
              },
            },
            {
              type: 'mcq',
              title: 'Who wins the race?',
              prompt: 'In that run the yellow dye travelled furthest. What does that tell you?',
              choices: [
                { t: 'Yellow is the least polar of the three', ok: true },
                { t: 'Yellow is the most polar', why: 'Polar compounds stick to the polar plate and lag behind.' },
                { t: 'Yellow is the heaviest', why: 'The race is decided by polarity here, not mass.' },
              ],
              explain: r`The polar silica grabs polar molecules. The least polar dye spends the most time dissolved in the moving solvent, so it runs furthest.`,
            },
            {
              type: 'interactive',
              title: 'Tune the solvent',
              prompt: r`Too weak a solvent leaves everything near the start; too strong a solvent sweeps everything to the top. Choose a solvent polarity that separates all three dyes clearly (each $R_f$ between 0.1 and 0.9, and at least 0.2 apart). Run it to check.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 10, grid: false, axes: false, height: 300,
                params: { sv: { min: 0, max: 1, step: 0.05, value: 0.05, label: 'Solvent polarity', color: 'teal', format: (v) => `${fix(v * 100, 0)}% ethyl acetate` } },
                animate: { param: 't', speed: 0.5, max: 1, loop: false },
                under: ({ plot, s }) => [s('rect', { x: plot.X(2), y: plot.Y(9.6), width: plot.X(8) - plot.X(2), height: plot.Y(0.4) - plot.Y(9.6), rx: 6, fill: 'var(--card)', stroke: 'var(--line-2)', 'stroke-width': 2 })],
                extra: ({ plot, p, s }) => tlc(plot, p, s),
                readout: (p) => (p.t < 1 ? 'Choose a solvent, then press Play to run the plate.' : DYES.map(([n, pol]) => `${n} ${fix(rf(pol, p.sv), 2)}`).join(' · ') + ' (Rf)'),
                goal: (p) => {
                  const v = DYES.map(([, pol]) => rf(pol, p.sv));
                  if (v.some((x) => x < 0.1)) return { ok: false, msg: 'Some dye barely leaves the start line. Make the solvent more polar.' };
                  if (v.some((x) => x > 0.9)) return { ok: false, msg: 'Some dye runs with the solvent front. Make the solvent less polar.' };
                  if (Math.abs(v[0] - v[1]) < 0.2 || Math.abs(v[1] - v[2]) < 0.2) return { ok: false, msg: 'Two spots are still too close together.' };
                  return true;
                },
                solution: { sv: 0.5 },
              },
              explain: r`Anything from about 40% to 60% ethyl acetate in hexane spreads the three dyes over the plate. Chemists choose solvents this way every day, to check reactions and to plan how to purify their products.`,
            },
            {
              type: 'numeric',
              title: 'Measure an Rf',
              prompt: r`On a plate, the solvent front moved 8.0 cm and a spot moved 2.0 cm. What is the spot's $R_f$?`,
              answer: 0.25,
              tol: 0.005,
              wrong: [{ v: 4, why: r`$R_f$ is the spot's distance divided by the solvent's, so it's always between 0 and 1.` }],
              explain: r`$2.0 \div 8.0 = 0.25$. Because $R_f$ is a ratio, it stays the same however far the plate is run, so it can identify a compound (in a given solvent).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Is it pure?',
              prompt: 'A chemist runs a TLC plate of a product and sees two spots. What does that suggest?',
              choices: [
                { t: 'The product is a mixture of at least two compounds', ok: true },
                { t: 'The product is pure', why: 'A pure compound gives one spot.' },
                { t: 'The solvent was too polar', why: 'A too-polar solvent would push everything together into one spot near the top, not split it.' },
              ],
              explain: r`One compound, one spot. Two spots mean at least two substances, perhaps leftover starting material. Larger versions of the same race (column chromatography) are then used to separate them.`,
            },
          ],
          recap: [
            'Compounds split between a polar plate and a moving solvent.',
            'Less polar → travels further → higher Rf.',
            'Choose the solvent to spread spots between Rf 0.1 and 0.9.',
          ],
        },
        {
          id: 'distillation',
          title: 'Distillation',
          summary: 'Separating by boiling point',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Richer in the vapour',
              body: r`When a mixture of two liquids boils, the vapour is richer in the one that boils lower (it's more volatile). Condense that vapour and you have a richer liquid; boil it again and it gets richer still. Each boil-and-condense is one **equilibrium stage**.

The curve shows vapour composition against liquid composition for a mixture like benzene and toluene; the staircase steps from a 30% starting mixture through successive stages.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, height: 360, equal: true, grid: false,
                axes: { xticks: 0.2, yticks: 0.2, xlabel: 'in the liquid', ylabel: 'in the vapour', yAt: 0, xAt: 0, xfmt: (v) => `${Math.round(v * 100)}%`, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { n: { min: 1, max: 7, step: 1, value: 1, label: 'Stages', control: 'buttons' } },
                curves: [{ f: (x) => yOf(x), color: 'blue' }, { f: (x) => x, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => staircase(plot, s, p.n),
                readout: (p) => `after ${p.n} stage${p.n > 1 ? 's' : ''}: **${fix(100 * stages(0.3, p.n)[p.n], 1)}%** of the more volatile liquid`,
              },
            },
            {
              type: 'interactive',
              title: 'Ninety-five percent',
              prompt: r`What is the smallest number of stages that takes the 30% mixture to at least 95% purity?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, height: 360, equal: true, grid: false,
                axes: { xticks: 0.2, yticks: 0.2, xlabel: 'in the liquid', ylabel: 'in the vapour', yAt: 0, xAt: 0, xfmt: (v) => `${Math.round(v * 100)}%`, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { n: { min: 1, max: 7, step: 1, value: 1, label: 'Stages', control: 'buttons' } },
                curves: [{ f: (x) => yOf(x), color: 'blue' }, { f: (x) => x, color: 'muted', dash: true }],
                extra: ({ plot, p, s }) => staircase(plot, s, p.n),
                readout: (p) => `after ${p.n} stage${p.n > 1 ? 's' : ''}: **${fix(100 * stages(0.3, p.n)[p.n], 1)}%**`,
                goal: (p) => { const v = stages(0.3, p.n)[p.n]; return v >= 0.95 && stages(0.3, p.n - 1)[p.n - 1] < 0.95 ? true : { ok: false, msg: v < 0.95 ? 'Not pure enough yet.' : 'That works, but fewer stages would do.' }; },
                solution: { n: 5 },
              },
              explain: r`Five stages: 30% → 51% → 71% → 86% → 93% → 97%. A **fractionating column** packed with glass beads or trays gives many stages in one tall tube, with vapour condensing and re-boiling all the way up. Oil refineries use columns tens of metres high.`,
            },
            {
              type: 'mcq',
              title: 'Close boiling points',
              prompt: 'Two liquids boil at 98 °C and 100 °C. Compared with liquids boiling at 60 °C and 100 °C, separating them needs:',
              choices: [
                { t: 'Many more stages', ok: true },
                { t: 'Fewer stages', why: 'With close boiling points the vapour is only slightly richer at each stage.' },
                { t: 'The same number', why: 'The bigger the difference in volatility, the fewer stages needed.' },
              ],
              explain: r`When boiling points are close, the vapour curve hugs the diagonal and each stage gains very little. Separating such mixtures can need hundreds of stages, or a different method altogether.`,
            },
            {
              type: 'explain',
              title: 'A limit: azeotropes',
              body: r`Distilling wine or beer gives stronger spirits, but no amount of distillation gets past about 95.6% ethanol. At that composition the vapour has exactly the same make-up as the liquid, an **azeotrope**, and the curve crosses the diagonal. Pure ethanol is made by other tricks, such as drying the azeotrope with molecular sieves.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How strong is the spirit?',
              prompt: r`A distiller collects 600 mL of liquid from a wash that contained 60 mL of ethanol. If all the ethanol ended up in the collected liquid, what percentage of it is ethanol?`,
              unit: '%',
              answer: 10,
              tol: 0.1,
              explain: r`$60 \div 600 = 10\%$. Not very strong: collecting less (only the early, richest vapour) and re-distilling gives a much stronger spirit, which is just the staircase above in practice.`,
            },
          ],
          recap: [
            'Each boil-and-condense stage enriches the more volatile liquid.',
            'Close boiling points need many stages: fractionating columns.',
            'Azeotropes (like 95.6% ethanol) can’t be beaten by distillation alone.',
          ],
        },
      ],
    },
  ],
};

function tlc(plot, p, s) {
  const front = Math.min(1, p.t || 0) * 8.2;
  const out = [s('line', { x1: plot.X(2.2), x2: plot.X(7.8), y1: plot.Y(1.2), y2: plot.Y(1.2), stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' })];
  out.push(s('rect', { x: plot.X(2), y: plot.Y(1.2 + front), width: plot.X(8) - plot.X(2), height: plot.Y(0.4) - plot.Y(1.2 + front), fill: 'var(--teal)', 'fill-opacity': 0.12 }));
  out.push(s('line', { x1: plot.X(2), x2: plot.X(8), y1: plot.Y(1.2 + front), y2: plot.Y(1.2 + front), stroke: 'var(--teal)', 'stroke-width': 2 }));
  DYES.forEach(([, pol, col], i) => {
    const y = 1.2 + rf(pol, p.sv) * front;
    out.push(s('ellipse', { cx: plot.X(3.5 + i * 1.5), cy: plot.Y(y), rx: 13, ry: 9, class: `fl-${col}`, 'fill-opacity': 0.9 }));
  });
  out.push(s('text', { x: plot.X(8.3), y: plot.Y(1.2 + front) + 5, class: 'lbl', style: `fill:var(--teal);${FS(13)}`, text: 'solvent front' }));
  return out;
}

function staircase(plot, s, n) {
  const xs = stages(0.3, n), out = [];
  let d = `M${plot.X(xs[0])} ${plot.Y(xs[0])}`;
  for (let i = 0; i < n; i++) d += `L${plot.X(xs[i])} ${plot.Y(xs[i + 1])}L${plot.X(xs[i + 1])} ${plot.Y(xs[i + 1])}`;
  out.push(s('path', { d, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  out.push(s('circle', { cx: plot.X(xs[n]), cy: plot.Y(xs[n]), r: 6, fill: 'var(--coral)' }));
  return out;
}
