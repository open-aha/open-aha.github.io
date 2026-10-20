import { fix } from '../lib/svg.js';
import { chem } from '../lib/chem.js';
import { r, FS, bars } from './_chem.js';

// ---------- Hess's law cards ----------
// cards: [{ l: {species: n}, r: {species: n}, dH }], target: { l, r }. Each card can be used reversed and/or scaled.
const MULTS = [-2, -1, -0.5, 0, 0.5, 1, 2];
const coefText = (c) => ({ 1: '', 0.5: '½', 1.5: '3/2', 2.5: '5/2', 0.25: '¼' }[c] ?? String(+c.toFixed(2)));
const side = (o) => Object.entries(o).filter(([, n]) => n > 1e-9).map(([k, n]) => `${coefText(n)}${n === 1 ? '' : ' '}${chem(k)}`.trim()).join(' + ') || '∅';
function eqText(l, rr, m = 1) {
  const sc = (o) => Object.fromEntries(Object.entries(o).map(([k, n]) => [k, n * Math.abs(m)]));
  return m < 0 ? `${side(sc(rr))}  →  ${side(sc(l))}` : `${side(sc(l))}  →  ${side(sc(rr))}`;
}
function netOf(cards, ms) {
  const net = {};
  cards.forEach((c, i) => {
    for (const [k, n] of Object.entries(c.r)) net[k] = (net[k] || 0) + n * ms[i];
    for (const [k, n] of Object.entries(c.l)) net[k] = (net[k] || 0) - n * ms[i];
  });
  for (const k of Object.keys(net)) if (Math.abs(net[k]) < 1e-9) delete net[k];
  return net;
}
function hess(cards, target, solution, { note } = {}) {
  const params = {};
  cards.forEach((c, i) => { params['c' + i] = { min: 0, max: 6, step: 1, value: 3, label: `Card ${'ABCD'[i]}`, color: ['blue', 'coral', 'teal', 'violet'][i], control: 'buttons', format: (v) => ['−2', '−1', '−½', 'off', '×½', '×1', '×2'][v] }; });
  const want = netOf([target], [1]);
  const ms = (p) => cards.map((_, i) => MULTS[p['c' + i]]);
  const rows = cards.length;
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: rows + 2.6, grid: false, axes: false, height: 80 + rows * 62 + 140, stackSliders: true,
    params,
    extra: ({ plot, p, s }) => {
      const m = ms(p), out = [];
      cards.forEach((c, i) => {
        const y = plot.Y(rows + 2.6 - 0.6 - i), on = m[i] !== 0;
        const col = ['var(--blue)', 'var(--coral)', 'var(--teal)', 'var(--violet)'][i];
        out.push(s('rect', { x: plot.X(0.05), y: y - 25, width: plot.X(9.95) - plot.X(0.05), height: 46, rx: 12, fill: on ? 'var(--card)' : 'none', stroke: col, 'stroke-width': on ? 2.5 : 1.5, 'stroke-dasharray': on ? null : '5 5', opacity: on ? 1 : 0.55 }));
        out.push(s('text', { x: plot.X(0.3), y: y + 5, class: 'lbl', style: `fill:${col};${FS(18)}`, text: 'ABCD'[i] }));
        out.push(s('text', { x: plot.X(0.8), y: y + 5, class: 'lbl', style: `opacity:${on ? 1 : 0.55};${FS(18)}`, text: eqText(c.l, c.r, on ? m[i] : 1) }));
        out.push(s('text', { x: plot.X(9.75), y: y + 5, 'text-anchor': 'end', class: 'lbl', style: `opacity:${on ? 1 : 0.55};${FS(18)}`, text: `${on && c.dH * m[i] > 0 ? '+' : ''}${fix(on ? c.dH * m[i] : c.dH, 1)} kJ` }));
      });
      const net = netOf(cards, m), dH = cards.reduce((t, c, i) => t + c.dH * m[i], 0);
      const L = Object.fromEntries(Object.entries(net).filter(([, n]) => n < 0).map(([k, n]) => [k, -n])), R = Object.fromEntries(Object.entries(net).filter(([, n]) => n > 0));
      const yS = plot.Y(1.55);
      out.push(s('line', { x1: plot.X(0.05), x2: plot.X(9.95), y1: yS - 34, y2: yS - 34, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
      const sum = Object.keys(net).length ? `${side(L)}  →  ${side(R)}` : 'nothing yet';
      // a long sum (cards at ×2 or −2) gets a full-width line of its own, under the label and kJ total
      const long = sum.length > 30, yT = long ? yS - 8 : yS + 5;
      out.push(s('text', { x: plot.X(0.3), y: yT, class: 'lbl', style: `fill:var(--ink-2);${FS(15)}`, text: 'sum' }));
      out.push(s('text', { x: plot.X(long ? 0.3 : 1.3), y: long ? yS + 20 : yS + 5, class: 'lbl', style: FS(18), text: sum }));
      out.push(s('text', { x: plot.X(9.75), y: yT, 'text-anchor': 'end', class: 'lbl', style: FS(18), text: `${dH > 0 ? '+' : ''}${fix(dH, 1)} kJ` }));
      out.push(s('text', { x: plot.X(0.3), y: plot.Y(0.55) + 5, class: 'lbl', style: `fill:var(--success);${FS(15)}`, text: 'goal' }));
      out.push(s('text', { x: plot.X(1.3), y: plot.Y(0.55) + 5, class: 'lbl', style: `fill:var(--success);${FS(18)}`, text: eqText(target.l, target.r) }));
      return out;
    },
    readout: (p) => {
      const net = netOf(cards, ms(p));
      const extra = Object.keys({ ...net, ...want }).filter((k) => Math.abs((net[k] || 0) - (want[k] || 0)) > 1e-9);
      return extra.length ? `still to cancel or fix: ${extra.map((k) => chem(k)).join(', ')}` : `matches the goal ✓ · ΔH = ${fix(cards.reduce((t, c, i) => t + c.dH * ms(p)[i], 0), 1)} kJ`;
    },
    goal: (p) => {
      const net = netOf(cards, ms(p));
      const bad = Object.keys({ ...net, ...want }).filter((k) => Math.abs((net[k] || 0) - (want[k] || 0)) > 1e-9);
      return bad.length ? { ok: false, msg: note || `The sum doesn’t match the goal yet: look at ${bad.map((k) => chem(k)).join(', ')}.` } : true;
    },
    solution: Object.fromEntries(solution.map((m, i) => ['c' + i, MULTS.indexOf(m)])),
  };
}

// ---------- bond enthalpies (average, kJ/mol) ----------
const BE = { 'C–H': 413, 'O=O': 498, 'C=O': 799, 'O–H': 463 };
function bondLadder() {
  const keys = ['C–H', 'O=O', 'C=O', 'O–H'], want = [4, 2, 2, 4];
  const params = {};
  keys.forEach((k, i) => { params['b' + i] = { min: 0, max: 4, step: 1, value: 0, label: `${i < 2 ? 'break' : 'make'} ${k}`, color: i < 2 ? 'coral' : 'blue', control: 'buttons' }; });
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: -1500, ymax: 3800, grid: false, height: 400, padL: 64, clipExtra: true,
    axes: { xticks: 0, yticks: 1000, ylabel: 'energy (kJ)', xAt: 0, yAt: -1500 },
    params, stackSliders: true,
    extra: ({ plot, p, s }) => {
      const brk = p.b0 * BE['C–H'] + p.b1 * BE['O=O'], mk = p.b2 * BE['C=O'] + p.b3 * BE['O–H'];
      const lvl = (x0, x1, y, col, t) => [s('line', { x1: plot.X(x0), x2: plot.X(x1), y1: plot.Y(y), y2: plot.Y(y), stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round' }), s('text', { x: plot.X((x0 + x1) / 2), y: plot.Y(y) - 9, 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(13), text: t })];
      const out = [...lvl(0.6, 3, 0, 'var(--ink)', 'CH₄ + 2O₂'), ...lvl(3.8, 6.2, brk, 'var(--coral)', 'separate atoms'), ...lvl(7, 9.4, brk - mk, 'var(--blue)', 'CO₂ + 2H₂O')];
      if (brk > 0) out.push(s('path', { d: `M${plot.X(3.4)} ${plot.Y(0)}V${plot.Y(brk) + 6}`, stroke: 'var(--coral)', 'stroke-width': 3, 'marker-end': 'url(#arrow-coral)' }));
      if (mk > 0) out.push(s('path', { d: `M${plot.X(6.6)} ${plot.Y(brk)}V${plot.Y(brk - mk) - 6}`, stroke: 'var(--blue)', 'stroke-width': 3, 'marker-end': 'url(#arrow-blue)' }));
      return out;
    },
    readout: (p) => {
      const brk = p.b0 * BE['C–H'] + p.b1 * BE['O=O'], mk = p.b2 * BE['C=O'] + p.b3 * BE['O–H'];
      return `broken: +${brk} kJ · made: −${mk} kJ · ΔH ≈ ${brk - mk > 0 ? '+' : ''}${brk - mk} kJ`;
    },
    goal: (p) => {
      const got = [p.b0, p.b1, p.b2, p.b3];
      if (got[0] !== 4) return { ok: false, msg: 'Count the C–H bonds in one methane molecule.' };
      if (got[1] !== 2) return { ok: false, msg: 'How many O₂ molecules does one methane need? Each has one O=O.' };
      if (got[2] !== 2) return { ok: false, msg: 'Each CO₂ has two C=O bonds, and one CO₂ forms.' };
      if (got[3] !== 4) return { ok: false, msg: 'Two water molecules form, with two O–H bonds each.' };
      return got.every((v, i) => v === want[i]);
    },
    solution: { b0: 4, b1: 2, b2: 2, b3: 4 },
  };
}

// ---------- ΔG = ΔH − TΔS ----------
function gibbsPlot({ H0 = -50, S0 = -100, goal, solution, fixed = false } = {}) {
  return {
    kind: 'graph', xmin: 0, xmax: 1500, ymin: -300, ymax: 300, height: 340, grid: false, padL: 60,
    axes: { xticks: 300, yticks: 100, xlabel: 'temperature (K)', ylabel: 'ΔG (kJ)', yAt: 0, xAt: 0, xticksBelow: true, xlabelBelow: 'edge' },
    params: {
      H: { min: -200, max: 200, step: 10, value: H0, label: 'ΔH', color: 'coral', format: (v) => `${v > 0 ? '+' : ''}${v} kJ`, slider: !fixed },
      S: { min: -300, max: 300, step: 10, value: S0, label: 'ΔS', color: 'blue', format: (v) => `${v > 0 ? '+' : ''}${v} J/K`, slider: !fixed },
    },
    under: ({ plot, s }) => [s('rect', { x: plot.left, y: plot.Y(0), width: plot.right - plot.left, height: plot.Y(-300) - plot.Y(0), fill: 'var(--success)', 'fill-opacity': 0.08 }), s('text', { x: plot.right - 8, y: plot.Y(-300) - 10, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--success);${FS(13)}`, text: 'ΔG < 0: goes by itself' })],
    curves: [{ f: (T, p) => p.H - (T * p.S) / 1000, color: 'violet' }],
    readout: (p) => {
      const cross = p.S !== 0 ? (1000 * p.H) / p.S : null;
      const spont = (T) => p.H - (T * p.S) / 1000 < 0;
      const where = spont(1) && spont(1500) ? 'at every temperature' : !spont(1) && !spont(1500) ? 'at no temperature' : spont(1) ? `below ${fix(cross, 0)} K` : `above ${fix(cross, 0)} K`;
      return `spontaneous **${where}**`;
    },
    goal, solution,
  };
}

// ---------- Ellingham lines: ΔG per mole of O2 ----------
const ELL = {
  co: { H: -221.0, S: 178.8, name: '2C + O₂ → 2CO', color: 'ink' },
  zno: { H: -701.0, S: -201.0, name: '2Zn + O₂ → 2ZnO', color: 'teal' },
  fe: { H: -549.5, S: -183.3, name: '⁴⁄₃Fe + O₂ → ⅔Fe₂O₃', color: 'coral' },
  al: { H: -1117.1, S: -208.4, name: '⁴⁄₃Al + O₂ → ⅔Al₂O₃', color: 'violet' },
};
const gE = (k, T) => ELL[k].H - (T * ELL[k].S) / 1000;

export default {
  id: 'thermochem',
  subject: 'physics',
  title: 'Thermochemistry',
  level: 'Intermediate',
  cover: 'thermochem',
  tagline: 'Where reaction heat comes from, Hess’s law puzzles, entropy and free energy.',
  description: r`Every reaction either gives out heat or takes it in. Measure it with a calorimeter, predict it by adding up the bonds that break and form, and solve Hess's law puzzles by flipping and scaling known reactions until they add up to one you can't measure directly. Then meet entropy and Gibbs free energy, the quantity that decides whether a reaction will run at all, and use it to find the temperature at which ice melts, limestone turns to lime and carbon can pull a metal out of its ore.`,
  prereq: 'Chemical Reactions, and Heat & Thermodynamics',
  chapters: [
    {
      title: 'Heat of Reaction',
      summary: 'Measuring and predicting ΔH.',
      lessons: [
        {
          id: 'enthalpy',
          title: 'Heat In, Heat Out',
          summary: 'Exothermic and endothermic',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Hot packs and cold packs',
              body: r`A reaction that gives out heat is **exothermic**; one that takes heat in is **endothermic**. Chemists measure the heat at constant pressure as the **enthalpy change**, $\Delta H$, counted from the reaction's point of view:
- exothermic: the chemicals lose energy, so $\Delta H < 0$,
- endothermic: the chemicals gain energy, so $\Delta H > 0$.

For example, $\mathrm{CH_4 + 2O_2 \to CO_2 + 2H_2O(l)}$ has $\Delta H = -890$ kJ: every mole of methane burned releases 890 kJ.`,
              widget: bars([['burning methane', -890, 'coral'], ['hand warmer\n(rusting iron)', -824, 'coral'], ['photosynthesis\n(per CO₂)', 467, 'blue'], ['cold pack\n(per mol NH₄NO₃)', 26, 'blue']], { ymin: -1000, ymax: 600, yticks: 250, ylabel: 'ΔH (kJ)', height: 300, labelSize: 12 }),
              after: r`Hand warmers rust iron powder quickly: $\mathrm{4Fe + 3O_2 \to 2Fe_2O_3}$ releases 824 kJ per mole of $\mathrm{Fe_2O_3}$. Photosynthesis runs the other way from burning sugar, so it has to soak up energy from sunlight.`,
            },
            {
              type: 'mcq',
              title: 'The cold pack',
              prompt: 'A cold pack gets icy when ammonium nitrate dissolves in water inside it. What is the sign of ΔH for dissolving?',
              choices: [
                { t: 'Positive: endothermic', ok: true },
                { t: 'Negative: exothermic', why: 'The pack gets colder: the dissolving takes heat in from the water and your hand.' },
                { t: 'Zero', why: 'If no heat were involved, the temperature wouldn’t change.' },
              ],
              explain: r`The dissolving absorbs heat from its surroundings (the water, then your sprained ankle), so the chemicals gain energy: $\Delta H > 0$.`,
            },
            {
              type: 'numeric',
              title: 'Burning gas',
              prompt: r`How much heat is released by burning 8.0 g of methane ($M = 16$ g/mol)? ($\Delta H = -890$ kJ per mole.)`,
              unit: 'kJ',
              answer: 445,
              tol: 1,
              wrong: [{ v: 890, why: '8 g is only half a mole.' }, { v: 7120, why: 'Divide by the molar mass, don’t multiply.' }],
              explain: r`$8.0 / 16 = 0.50$ mol, and $0.50 \times 890 = 445$ kJ, enough to bring about 1.3 litres of water from room temperature to the boil.`,
            },
            {
              type: 'numeric',
              title: 'Per mole of what?',
              prompt: r`$\mathrm{2H_2 + O_2 \to 2H_2O(l)}$ has $\Delta H = -572$ kJ. What is $\Delta H$ for making **one** mole of liquid water this way?`,
              unit: 'kJ',
              answer: -286,
              tol: 0.5,
              wrong: [{ v: 286, why: 'Halving the reaction doesn’t change the sign: it is still exothermic.' }, { v: -572, why: 'That’s for two moles of water, as written.' }],
              explain: r`$\Delta H$ scales with the amounts: half the reaction, half the heat. Writing $\mathrm{H_2 + \tfrac12 O_2 \to H_2O(l)}$, $\Delta H = -286$ kJ. Fractions of a molecule look odd, but they just mean fractions of a mole.`,
            },
            {
              type: 'mcq',
              title: 'Steam or water?',
              prompt: r`Making a mole of **liquid** water from hydrogen and oxygen releases 286 kJ; making a mole of **steam** releases only 242 kJ. Where did the other 44 kJ go?`,
              choices: [
                { t: 'It is the heat needed to evaporate the water', ok: true },
                { t: 'It is lost to friction', why: 'There’s no friction in a reaction; the difference is a real energy difference between steam and liquid.' },
                { t: 'Steam forms more slowly', why: 'Speed doesn’t affect ΔH.' },
              ],
              explain: r`Steam holds 44 kJ/mol more energy than liquid water: the energy needed to pull the molecules apart. So states matter, and chemists label them: (s), (l), (g), (aq).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Rocket fuel',
              prompt: r`The Space Shuttle's main engines burned hydrogen to steam. How much heat comes from 1.0 kg of hydrogen ($M = 2.0$ g/mol), forming $\mathrm{H_2O(g)}$ at 242 kJ per mole of hydrogen? Answer in MJ.`,
              unit: 'MJ',
              answer: 121,
              tol: 1,
              explain: r`$1000 / 2.0 = 500$ mol, $\times 242$ kJ = 121,000 kJ = 121 MJ per kilogram, nearly three times as much as petrol (about 46 MJ/kg). That's why hydrogen is the fuel of choice for the most demanding rocket stages.`,
            },
          ],
          recap: [
            'Exothermic: ΔH < 0 (heat out). Endothermic: ΔH > 0 (heat in).',
            'ΔH scales with amounts and depends on states.',
          ],
        },
        {
          id: 'calorimetry',
          title: 'Measuring Heat',
          summary: 'Calorimeters and q = mcΔT',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Let water do the measuring',
              body: r`To measure a reaction's heat, run it in water and watch the temperature. The heat that warms the water is
$$q = m\,c\,\Delta T$$
with $m$ the mass of water, $c = 4.18$ J/(g·°C) its specific heat and $\Delta T$ the temperature rise. A simple **coffee-cup calorimeter** (two nested polystyrene cups and a thermometer) is surprisingly accurate.`,
            },
            {
              type: 'interactive',
              title: 'Mix acid and alkali',
              prompt: r`50 mL of 1.0 M hydrochloric acid is mixed with 50 mL of 1.0 M sodium hydroxide in a coffee-cup calorimeter at the 60-second mark. Move the dashed line to the highest temperature reached after mixing.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 300, ymin: 18, ymax: 30, height: 320, grid: false,
                axes: { xticks: 60, yticks: 2, xlabel: 'time (s)', ylabel: 'temperature (°C)', yAt: 18, xAt: 0 },
                params: { T: { min: 20, max: 30, step: 0.1, value: 20, label: 'Your reading', format: (v) => `${fix(v, 1)} °C` } },
                curves: [{ f: (x) => (x < 60 ? 20 : 20 + 6.8 * (1 - Math.exp(-(x - 60) / 8)) - 0.002 * (x - 60)), color: 'coral', n: 300 }, { f: (x, p) => p.T, color: 'muted', dash: true }],
                readout: (p) => `temperature rise: **${fix(p.T - 20, 1)} °C**`,
                goal: (p) => (Math.abs(p.T - 26.8) <= 0.25 ? true : { ok: false, msg: 'Read the top of the curve just after mixing (before it slowly cools).' }),
                solution: { T: 26.8 },
              },
              explain: r`The temperature jumps from 20.0 °C to about 26.7 °C, then drifts down slowly as heat leaks out. Extrapolating the slow cooling back to the moment of mixing corrects for that leak and gives a rise of 6.8 °C.`,
            },
            {
              type: 'numeric',
              title: 'Heat of neutralisation',
              prompt: r`The 100 g of solution warmed by 6.8 °C. Using $c = 4.18$ J/(g·°C), how much heat (in J) did the reaction release?`,
              unit: 'J',
              answer: 2842,
              relTol: 0.01,
              explain: r`$q = 100 \times 4.18 \times 6.8 \approx 2840$ J.`,
            },
            {
              type: 'numeric',
              title: 'Per mole',
              prompt: r`That came from 0.050 mol of acid reacting with 0.050 mol of alkali. What is $\Delta H$ for neutralisation, in kJ per mole of water formed?`,
              unit: 'kJ/mol',
              answer: -56.8,
              relTol: 0.02,
              wrong: [{ v: 56.8, why: 'Heat was given out, so ΔH is negative.' }, { v: -2.84, why: 'Divide by the moles: 2.84 kJ ÷ 0.050 mol.' }],
              explain: r`$2.84 \text{ kJ} \div 0.050 \text{ mol} = 57$ kJ/mol released, so $\Delta H \approx -57$ kJ/mol. Every strong acid with every strong alkali gives about the same value, because the reaction is always the same: $\mathrm{H^+ + OH^- \to H_2O}$.`,
            },
            {
              type: 'numeric',
              title: 'Burning a peanut',
              prompt: r`A 0.50 g peanut is burned under a can holding 100 g of water, which warms by 25 °C. How much energy did each gram of peanut give the water, in kJ/g?`,
              unit: 'kJ/g',
              answer: 20.9,
              relTol: 0.02,
              explain: r`$q = 100 \times 4.18 \times 25 = 10{,}450$ J $= 10.45$ kJ from 0.50 g: about 21 kJ/g. Food tables say about 24 kJ/g for peanuts; the rest of the heat escaped into the air. Professional **bomb calorimeters** seal the sample in oxygen inside a steel can submerged in water, so almost nothing escapes.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A careless calorimeter',
              prompt: 'Someone uses a metal cup instead of polystyrene. Their measured ΔH will be:',
              choices: [
                { t: 'Too small in size, because heat leaks out through the metal', ok: true },
                { t: 'Too large in size', why: 'Lost heat means a smaller temperature rise, so a smaller measured q.' },
                { t: 'Unaffected', why: 'Metal conducts heat away quickly, so the water warms less.' },
              ],
              explain: r`Heat escaping makes $\Delta T$ smaller than it should be, so the calculated heat (and $|\Delta H|$) comes out too small. Insulation matters.`,
            },
          ],
          recap: [
            'q = m c ΔT, with c = 4.18 J/(g·°C) for water.',
            'Divide q by moles reacted to get ΔH per mole; heat out means ΔH < 0.',
          ],
        },
        {
          id: 'bonds',
          title: 'Bond Enthalpies',
          summary: 'Breaking costs, making pays',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'An energy ledger',
              body: r`Imagine a reaction in two steps: first break every bond in the reactants (this **costs** energy), then join the atoms into products (this **releases** energy). Using average **bond enthalpies**,
$$\Delta H \approx \sum(\text{bonds broken}) - \sum(\text{bonds formed})$$
If the new bonds are stronger than the old ones, more energy comes out than went in: exothermic.`,
              widget: bars([['C–H', 413, 'muted'], ['O=O', 498, 'muted'], ['C=O\n(in CO₂)', 799, 'muted'], ['O–H', 463, 'muted'], ['H–H', 436, 'muted'], ['Cl–Cl', 243, 'muted'], ['H–Cl', 432, 'muted']], { ymax: 900, yticks: 300, ylabel: 'bond enthalpy (kJ/mol)', height: 280, labelSize: 12 }),
            },
            {
              type: 'interactive',
              title: 'Burning methane, bond by bond',
              prompt: r`For $\mathrm{CH_4 + 2O_2 \to CO_2 + 2H_2O}$, set how many of each bond are broken and made.`,
              widget: bondLadder(),
              explain: r`Break 4 C–H and 2 O=O: $4(413) + 2(498) = 2648$ kJ in. Make 2 C=O and 4 O–H: $2(799) + 4(463) = 3450$ kJ out. $\Delta H \approx 2648 - 3450 = -802$ kJ, close to the measured −802 kJ for forming steam.`,
            },
            {
              type: 'numeric',
              title: 'Hydrogen chloride',
              prompt: r`Use the chart to estimate $\Delta H$ for $\mathrm{H_2 + Cl_2 \to 2HCl}$.`,
              unit: 'kJ',
              answer: -185,
              tol: 1,
              wrong: [{ v: -253, why: 'Two H–Cl bonds form, not one.' }, { v: 185, why: 'Bonds made (864) outweigh bonds broken (679): exothermic, so negative.' }],
              explain: r`Broken: $436 + 243 = 679$ kJ. Made: $2 \times 432 = 864$ kJ. $\Delta H \approx 679 - 864 = -185$ kJ. A mixture of hydrogen and chlorine explodes when lit by bright light.`,
            },
            {
              type: 'mcq',
              title: 'Only an estimate',
              prompt: 'Why do bond-enthalpy calculations give only approximate answers?',
              choices: [
                { t: 'The values are averages; a bond’s strength depends a little on the rest of the molecule', ok: true },
                { t: 'Bonds have no fixed energy at all', why: 'They are quite consistent, just not perfectly identical across molecules.' },
                { t: 'Energy isn’t conserved in reactions', why: 'Energy is always conserved; the averages are the approximation.' },
              ],
              explain: r`A C–H bond in methane is not quite the same as one in benzene. Averages over many molecules are usually within a few percent, good enough for estimates. For accurate values, use measured enthalpies of formation (next lessons).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Why fuels burn hot',
              prompt: r`Making one C=O bond releases 799 kJ/mol; breaking one O=O costs 498. In combustion, how much more energy is released by forming the **two** C=O bonds of $\mathrm{CO_2}$ than is spent breaking **one** O=O bond?`,
              unit: 'kJ',
              answer: 1100,
              tol: 1,
              explain: r`$2 \times 799 - 498 = 1100$ kJ. The very strong bonds in $\mathrm{CO_2}$ and $\mathrm{H_2O}$ are where the energy of burning comes from: oxygen's own double bond is relatively weak. The fuel isn't "full of energy" so much as its products are very stable.`,
            },
          ],
          recap: [
            'ΔH ≈ bonds broken − bonds formed (average bond enthalpies).',
            'Strong bonds in the products make a reaction exothermic.',
          ],
        },
      ],
    },
    {
      title: 'Hess’s Law',
      summary: 'Adding reactions like equations.',
      lessons: [
        {
          id: 'hess',
          title: 'Hess’s Law',
          summary: 'The route doesn’t matter',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Any route, same total',
              body: r`Germain Hess found in 1840 that the heat of a reaction is the same whether it happens in one step or several. Enthalpy is like altitude: walk from the valley to the summit by any path and you climb the same height.

So reactions can be **added like equations**. Reverse a reaction and its $\Delta H$ changes sign; multiply it by a number and $\Delta H$ is multiplied too. Species that appear on both sides cancel.

In the puzzles that follow, each card can be switched off, used as written (×1), scaled (×½, ×2) or reversed (the negative choices).`,
            },
            {
              type: 'interactive',
              title: 'Carbon monoxide',
              prompt: r`Burning carbon always makes some $\mathrm{CO_2}$, so the heat of $\mathrm{C + \tfrac12 O_2 \to CO}$ can't be measured directly. Combine cards A and B to make it.`,
              widget: hess([{ l: { C: 1, O2: 1 }, r: { CO2: 1 }, dH: -393.5 }, { l: { CO: 1, O2: 0.5 }, r: { CO2: 1 }, dH: -283.0 }], { l: { C: 1, O2: 0.5 }, r: { CO: 1 } }, [1, -1]),
              explain: r`Use A forwards and B **reversed**: $\mathrm{C + O_2 \to CO_2}$ then $\mathrm{CO_2 \to CO + \tfrac12 O_2}$. The $\mathrm{CO_2}$ cancels and half the oxygen cancels, leaving $\mathrm{C + \tfrac12 O_2 \to CO}$ with $\Delta H = -393.5 + 283.0 = -110.5$ kJ.`,
            },
            {
              type: 'numeric',
              title: 'Reverse it',
              prompt: r`Water's formation is $\mathrm{H_2 + \tfrac12 O_2 \to H_2O(l)}$, $\Delta H = -285.8$ kJ. What is $\Delta H$ for splitting one mole of liquid water back into hydrogen and oxygen?`,
              unit: 'kJ',
              answer: 285.8,
              tol: 0.05,
              wrong: [{ v: -285.8, why: 'Reversing a reaction flips the sign of ΔH.' }],
              explain: r`$+285.8$ kJ: whatever comes out going one way must go back in on the way back. An electrolyser has to supply this much in total (at least 237 kJ of it as electricity; the rest can come in as heat).`,
            },
            {
              type: 'interactive',
              title: 'Methane from scratch',
              prompt: r`Nobody can make methane by simply mixing carbon and hydrogen, but combustion data are easy to measure. Combine the cards to give $\mathrm{C + 2H_2 \to CH_4}$.`,
              widget: hess([{ l: { C: 1, O2: 1 }, r: { CO2: 1 }, dH: -393.5 }, { l: { H2: 1, O2: 0.5 }, r: { 'H2O(l)': 1 }, dH: -285.8 }, { l: { CH4: 1, O2: 2 }, r: { CO2: 1, 'H2O(l)': 2 }, dH: -890.3 }], { l: { C: 1, H2: 2 }, r: { CH4: 1 } }, [1, 2, -1]),
              explain: r`A ×1, B ×2 and C reversed: $-393.5 + 2(-285.8) + 890.3 = -74.8$ kJ. All the $\mathrm{CO_2}$, water and oxygen cancel. This is how most enthalpies of formation are found: burn things, then use Hess's law.`,
            },
            {
              type: 'numeric',
              title: 'Read your answer',
              prompt: r`From that puzzle, what is $\Delta H$ for $\mathrm{C + 2H_2 \to CH_4}$?`,
              unit: 'kJ',
              answer: -74.8,
              tol: 0.15,
              explain: r`$-74.8$ kJ per mole, the **enthalpy of formation** of methane.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Diamonds aren’t forever',
              prompt: r`Burning diamond and burning graphite both give $\mathrm{CO_2}$, but release slightly different heats. Find $\Delta H$ for turning diamond into graphite.`,
              widget: hess([{ l: { 'C(diamond)': 1, O2: 1 }, r: { CO2: 1 }, dH: -395.4 }, { l: { 'C(graphite)': 1, O2: 1 }, r: { CO2: 1 }, dH: -393.5 }], { l: { 'C(diamond)': 1 }, r: { 'C(graphite)': 1 } }, [1, -1]),
              explain: r`$-395.4 + 393.5 = -1.9$ kJ: diamond is very slightly **less** stable than graphite, so every diamond is, in principle, turning into graphite. In practice the rate at room temperature is so tiny that no change would be noticeable in billions of years: a reaction can be downhill and still never get going.`,
            },
          ],
          recap: [
            'Reactions add like equations; so do their ΔH values.',
            'Reverse → flip the sign; multiply → multiply ΔH.',
          ],
        },
        {
          id: 'formation',
          title: 'Enthalpies of Formation',
          summary: 'One table for every reaction',
          icon: 'book',
          steps: [
            {
              type: 'explain',
              title: 'Measuring from sea level',
              body: r`The **standard enthalpy of formation**, $\Delta H_f^\circ$, is $\Delta H$ for making one mole of a compound from its elements in their standard states (such as $\mathrm{O_2(g)}$, C as graphite). Elements themselves are the "sea level": their $\Delta H_f^\circ = 0$.

With one table of formation enthalpies, Hess's law gives any reaction:
$$\Delta H^\circ = \sum \Delta H_f^\circ(\text{products}) - \sum \Delta H_f^\circ(\text{reactants})$$`,
              widget: bars([['O₂', 0, 'muted'], ['CH₄', -74.8, 'blue'], ['C₂H₅OH(l)', -277.7, 'blue'], ['H₂O(l)', -285.8, 'blue'], ['CO₂', -393.5, 'blue'], ['Fe₂O₃', -824.2, 'coral'], ['Al₂O₃', -1675.7, 'coral']], { ymin: -1800, ymax: 100, yticks: 400, ylabel: 'ΔHf° (kJ/mol)', height: 300, labelSize: 12 }),
            },
            {
              type: 'mcq',
              title: 'Why zero?',
              prompt: r`Why is $\Delta H_f^\circ$ of $\mathrm{O_2(g)}$ zero?`,
              choices: [
                { t: 'Forming O₂ from O₂ is no change at all', ok: true },
                { t: 'Oxygen has no energy', why: 'Oxygen has plenty of energy; zero is just the reference point.' },
                { t: 'It hasn’t been measured', why: 'It’s zero by definition: the element in its standard state is the starting line.' },
              ],
              explain: r`"Forming" an element from itself changes nothing. Choosing elements as zero is like measuring heights from sea level: only differences matter.`,
            },
            {
              type: 'numeric',
              title: 'Burning ethanol',
              prompt: r`Use the chart: $\Delta H^\circ$ for $\mathrm{C_2H_5OH(l) + 3O_2 \to 2CO_2 + 3H_2O(l)}$?`,
              unit: 'kJ',
              answer: -1366.7,
              tol: 1,
              wrong: [{ v: -1922.1, why: 'Subtract the reactants: ethanol’s −277.7 counts against you, so add 277.7 back.' }, { v: -401.6, why: 'Multiply by the coefficients: 2 CO₂ and 3 H₂O.' }],
              explain: r`Products: $2(-393.5) + 3(-285.8) = -1644.4$. Reactants: $-277.7 + 0$. Difference: $-1644.4 - (-277.7) = -1366.7$ kJ per mole of ethanol.`,
            },
            {
              type: 'numeric',
              title: 'Thermite',
              prompt: r`The thermite reaction welds railway lines: $\mathrm{2Al + Fe_2O_3 \to Al_2O_3 + 2Fe}$. What is $\Delta H^\circ$?`,
              unit: 'kJ',
              answer: -851.5,
              tol: 1,
              wrong: [{ v: -2499.9, why: 'Fe₂O₃ is a reactant: subtract its value.' }],
              explain: r`$-1675.7 - (-824.2) = -851.5$ kJ. Aluminium oxide is so much more stable than iron oxide that the aluminium snatches the oxygen and releases enough heat to melt the iron, which pours out at around 2500 °C.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The most stable oxide',
              prompt: 'Using the chart, which metal should be best at pulling oxygen away from the other?',
              choices: [
                { t: 'Aluminium: its oxide has the more negative ΔHf° (per mole of O as well)', ok: true },
                { t: 'Iron: it’s the stronger metal', why: 'Mechanical strength has nothing to do with it. Compare formation enthalpies.' },
              ],
              explain: r`Per oxygen atom, $\mathrm{Al_2O_3}$ is $-1675.7/3 = -559$ kJ and $\mathrm{Fe_2O_3}$ is $-824.2/3 = -275$ kJ. Oxygen moves to where it's held most tightly. (Strictly, it's free energy that decides, which we meet next, but here enthalpy dominates.)`,
            },
          ],
          recap: [
            'ΔHf°: one mole from elements; elements are zero.',
            'ΔH° = Σ products − Σ reactants (times coefficients).',
          ],
        },
      ],
    },
    {
      title: 'Will It Go?',
      summary: 'Entropy and free energy.',
      lessons: [
        {
          id: 'entropy',
          title: 'Entropy in Chemistry',
          summary: 'Counting the ways',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Not just downhill',
              body: r`If only energy mattered, endothermic reactions would never happen by themselves. Yet a cold pack dissolves and ice melts in a warm room. The other ingredient is **entropy**, $S$: roughly, the number of ways the particles and their energy can be arranged. Things left alone drift towards more arrangements.

Rough rules: gases have far more entropy than liquids, liquids more than solids; dissolving and mixing usually raise entropy; and a reaction that makes **more gas molecules** than it uses gains entropy.`,
              widget: bars([['diamond\nC(s)', 2.4, 'muted'], ['iron\nFe(s)', 27.3, 'muted'], ['water\nH₂O(l)', 70.0, 'blue'], ['steam\nH₂O(g)', 188.8, 'coral'], ['CO₂(g)', 213.8, 'coral']], { ymax: 250, yticks: 50, ylabel: 'S° (J/(mol·K))', height: 280, labelSize: 12 }),
            },
            {
              type: 'mcq',
              title: 'More or less?',
              prompt: r`Does $\mathrm{N_2(g) + 3H_2(g) \to 2NH_3(g)}$ increase or decrease entropy?`,
              choices: [
                { t: 'Decrease: four gas molecules become two', ok: true },
                { t: 'Increase: ammonia is a bigger molecule', why: 'Fewer gas molecules means fewer ways to arrange things.' },
                { t: 'No change: everything stays a gas', why: 'The number of gas molecules halves.' },
              ],
              explain: r`Four moles of gas become two, so the entropy falls. That turns out to matter a great deal for the Haber process (see Chemical Equilibrium).`,
            },
            {
              type: 'numeric',
              title: 'Calculate ΔS°',
              prompt: r`Standard entropies: $\mathrm{N_2}$ 191.6, $\mathrm{H_2}$ 130.7, $\mathrm{NH_3}$ 192.8 J/(mol·K). What is $\Delta S^\circ$ for $\mathrm{N_2 + 3H_2 \to 2NH_3}$?`,
              unit: 'J/K',
              answer: -198.1,
              tol: 0.3,
              wrong: [{ v: -129.5, why: 'Multiply H₂ by 3 and NH₃ by 2.' }],
              explain: r`$2(192.8) - [191.6 + 3(130.7)] = 385.6 - 583.7 = -198.1$ J/K. Negative, as predicted from counting gas molecules.`,
            },
            {
              type: 'order',
              title: 'Rank by entropy',
              prompt: 'Put these in order of entropy per mole, lowest first.',
              items: ['Ice', 'Liquid water', 'Steam', 'Steam heated to 500 °C'],
              explain: r`Solid < liquid < gas, and a hotter gas has its energy spread over more ways still. Melting and boiling are both big entropy gains.`,
            },
            {
              type: 'multi',
              kicker: 'Challenge',
              title: 'Entropy goes up',
              prompt: 'In which of these does the entropy of the chemicals increase?',
              choices: [
                { t: r`$\mathrm{CaCO_3(s) \to CaO(s) + CO_2(g)}$`, ok: true },
                { t: 'Sugar dissolving in tea', ok: true },
                { t: 'Dry ice subliming', ok: true },
                { t: 'Water freezing', why: 'Liquid to solid: fewer arrangements, entropy falls.' },
                { t: r`$\mathrm{2H_2(g) + O_2(g) \to 2H_2O(l)}$`, why: 'Three gas molecules become two of liquid: a big drop.' },
              ],
              explain: r`Making gas from a solid, dissolving and subliming all spread things out. Freezing and condensing gases into liquids do the opposite. (When water freezes, the entropy of the surroundings still goes up, because of the heat released: overall the second law is never broken.)`,
            },
          ],
          recap: [
            'Entropy: number of arrangements. Gas ≫ liquid > solid.',
            'More gas molecules made → entropy rises.',
          ],
        },
        {
          id: 'gibbs',
          title: 'Gibbs Free Energy',
          summary: 'The deciding number',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Energy versus spreading',
              body: r`Josiah Willard Gibbs combined the two into one number. A reaction runs by itself (it is **spontaneous**) when
$$\Delta G = \Delta H - T\Delta S < 0$$
with $T$ in kelvin. Giving out heat helps ($\Delta H < 0$); gaining entropy helps ($\Delta S > 0$), and the entropy term counts for more the hotter it is. Change the signs and watch where the line crosses into the green.`,
              widget: gibbsPlot({ H0: 100, S0: 200 }),
            },
            {
              type: 'interactive',
              title: 'Only when hot',
              prompt: r`Set $\Delta H$ and $\Delta S$ so that the reaction is spontaneous only **above** 500 K.`,
              widget: gibbsPlot({ H0: -50, S0: -100, goal: (p) => (p.H > 0 && p.S > 0 && Math.abs((1000 * p.H) / p.S - 500) < 1 ? true : p.H > 0 && p.S > 0 ? { ok: false, msg: `Right signs, but the crossover is at ${fix((1000 * p.H) / p.S, 0)} K.` } : { ok: false, msg: 'To win only at high temperature, the reaction must be held back by ΔH and helped by ΔS.' }), solution: { H: 100, S: 200 } }),
              explain: r`Endothermic ($\Delta H > 0$) but entropy-increasing ($\Delta S > 0$), with $T = \Delta H / \Delta S = 500$ K, for example $\Delta H = +100$ kJ and $\Delta S = +200$ J/K. At low temperature the heat cost wins; at high temperature the $T\Delta S$ term takes over.`,
            },
            {
              type: 'numeric',
              title: 'Where ice melts',
              prompt: r`For melting ice, $\Delta H = +6.01$ kJ/mol and $\Delta S = +22.0$ J/(mol·K). At what temperature is $\Delta G = 0$?`,
              unit: 'K',
              answer: 273,
              tol: 1,
              wrong: [{ v: 0.273, why: 'Convert kJ to J first: 6010 ÷ 22.0.' }],
              explain: r`$T = \Delta H / \Delta S = 6010 / 22.0 = 273$ K, which is 0 °C. Above it $\Delta G < 0$ and ice melts; below it water freezes. Gibbs's equation predicts the melting point.`,
            },
            {
              type: 'numeric',
              title: 'Making lime',
              prompt: r`Heating limestone makes quicklime: $\mathrm{CaCO_3 \to CaO + CO_2}$, with $\Delta H = +178$ kJ and $\Delta S = +161$ J/K. Above what temperature (in °C) does it become spontaneous?`,
              unit: '°C',
              answer: 833,
              tol: 4,
              wrong: [{ v: 1106, why: 'That’s in kelvin; subtract 273.' }],
              explain: r`$T = 178{,}000 / 161 = 1106$ K $= 833$ °C. Lime kilns run at about 900 °C, just above this, and people have been burning lime for thousands of years.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Never by itself',
              prompt: 'Which combination can never be spontaneous at any temperature?',
              choices: [
                { t: 'ΔH > 0 and ΔS < 0', ok: true },
                { t: 'ΔH < 0 and ΔS > 0', why: 'Both terms help: that one is spontaneous at every temperature.' },
                { t: 'ΔH > 0 and ΔS > 0', why: 'This one goes at high temperature.' },
                { t: 'ΔH < 0 and ΔS < 0', why: 'This one goes at low temperature.' },
              ],
              explain: r`With $\Delta H > 0$ and $\Delta S < 0$, both terms in $\Delta H - T\Delta S$ are positive at every temperature. Such a reaction only runs if something else drives it, which is the subject of the next lesson.`,
            },
          ],
          recap: [
            'ΔG = ΔH − TΔS; spontaneous when ΔG < 0.',
            'Crossover temperature T = ΔH / ΔS.',
          ],
        },
        {
          id: 'coupling',
          title: 'Driving Uphill',
          summary: 'Coupled reactions and smelting',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Pair it with a winner',
              body: r`A reaction with $\Delta G > 0$ won't run on its own, but it can be **coupled** to one with a large negative $\Delta G$, so that the total is negative. Free energies add, just like enthalpies.

Your cells do this constantly. Attaching phosphate to glucose costs $+13.8$ kJ/mol. Splitting ATP releases $-30.5$ kJ/mol. An enzyme makes both happen together, as one reaction.`,
            },
            {
              type: 'numeric',
              title: 'ATP pays the bill',
              prompt: r`What is $\Delta G$ for the coupled reaction (glucose + ATP → glucose-6-phosphate + ADP)?`,
              unit: 'kJ/mol',
              answer: -16.7,
              tol: 0.05,
              explain: r`$13.8 + (-30.5) = -16.7$ kJ/mol: negative, so the pair goes. ATP is the cell's universal currency for paying off uphill reactions.`,
            },
            {
              type: 'explain',
              title: 'Getting metals out of rocks',
              body: r`Most metals are found as oxides. Carbon can pull the oxygen away, but only when the coupled reaction has $\Delta G < 0$. An **Ellingham diagram** plots $\Delta G$ (per mole of $\mathrm{O_2}$) against temperature for each oxide; carbon wins wherever its line lies **below** the metal's.

Carbon's line slopes **down** because $\mathrm{2C + O_2 \to 2CO}$ makes more gas (entropy rises), while metal oxides slope up (gas is used up).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2000, ymin: -1200, ymax: 0, height: 360, grid: false, padL: 64,
                axes: { xticks: 500, yticks: 200, xlabel: 'temperature (K)', ylabel: 'ΔG (kJ per mol O₂)', yAt: -1200, xAt: 0 },
                curves: [{ f: (T) => gE('co', T), color: 'ink', width: 4 }, { f: (T) => gE('fe', T), color: 'coral' }, { f: (T) => gE('zno', T), color: 'teal' }, { f: (T) => gE('al', T), color: 'violet' }],
                extra: ({ plot, s }) => [['co', 1700], ['fe', 1650], ['zno', 400], ['al', 300]].map(([k, T]) => s('text', { x: plot.X(T), y: plot.Y(gE(k, T)) - 10, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--${k === 'co' ? 'ink' : ELL[k].color});${FS(13)}`, text: ELL[k].name })),
              },
              after: r`Aluminium's line is far below carbon's at any temperature a furnace can reach, which is why aluminium is made by electrolysis instead (see Electrochemistry & Batteries).`,
            },
            {
              type: 'interactive',
              title: 'Smelting zinc',
              prompt: r`Slide the furnace temperature to the lowest point where carbon can reduce zinc oxide.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2000, ymin: -800, ymax: 0, height: 340, grid: false, padL: 64,
                axes: { xticks: 500, yticks: 200, xlabel: 'temperature (K)', ylabel: 'ΔG (kJ per mol O₂)', yAt: -800, xAt: 0 },
                params: { T: { min: 300, max: 2000, step: 5, value: 600, label: 'Furnace', format: (v) => `${v} K` } },
                curves: [{ f: (T) => gE('co', T), color: 'ink', width: 4 }, { f: (T) => gE('zno', T), color: 'teal' }, { param: { x: (t, p) => p.T, y: (t) => t, t0: -800, t1: 0 }, color: 'muted', dash: true }],
                readout: (p) => { const d = gE('co', p.T) - gE('zno', p.T); return `ΔG for 2ZnO + 2C → 2Zn + 2CO: **${d > 0 ? '+' : ''}${fix(d, 0)} kJ** · ${d < 0 ? 'carbon wins' : 'no reaction'}`; },
                goal: (p) => { const d = gE('co', p.T) - gE('zno', p.T); return d < 0 && gE('co', p.T - 5) - gE('zno', p.T - 5) >= 0 ? true : { ok: false, msg: d >= 0 ? 'Carbon’s line is still above zinc’s: hotter.' : 'That works, but it isn’t the lowest temperature that does.' }; },
                solution: { T: 1265 },
              },
              explain: r`The lines cross near 1264 K (about 990 °C). Above that, $\mathrm{2ZnO + 2C \to 2Zn + 2CO}$ has $\Delta G < 0$. This simple picture ignores zinc boiling at 907 °C, which changes the slope a little, but real zinc smelters do run at about 1000 °C and above.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Iron age',
              prompt: r`For iron oxide, $\Delta G = -549.5 + 0.1833\,T$ kJ per mol $\mathrm{O_2}$; for carbon, $\Delta G = -221.0 - 0.1788\,T$. At what temperature (in K) do the lines cross?`,
              unit: 'K',
              answer: 907,
              tol: 3,
              explain: r`Set them equal: $-549.5 + 0.1833T = -221.0 - 0.1788T$, so $0.3621T = 328.5$ and $T \approx 907$ K (634 °C). Charcoal fires reach that easily, which is part of why people were smelting iron 3000 years ago, long before aluminium.`,
            },
          ],
          recap: [
            'Free energies add: a big downhill reaction can drive an uphill one.',
            'ATP hydrolysis powers uphill reactions in cells.',
            'Carbon reduces an oxide where its Ellingham line lies below the metal’s.',
          ],
        },
      ],
    },
  ],
};
