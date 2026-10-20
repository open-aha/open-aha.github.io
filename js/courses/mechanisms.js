import { fix } from '../lib/svg.js';
import { r, FS, arrows, pick, view } from './_chem.js';

const ch3 = { h: 3 };

// ---------- mechanism drawings: [el, x, y, {q, lp, h}] ----------
// ammonia takes a proton
const NH3_H = {
  atoms: [['N', 200, 140, { lp: 1 }], ['H', 145, 175], ['H', 255, 175], ['H', 200, 205], ['H', 340, 70, { q: 1 }]],
  bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
  answer: [['lp:0', 'a:4']],
  product: { atoms: [['N', 210, 140, { q: 1, lp: 0 }], ['H', 155, 175], ['H', 265, 175], ['H', 210, 205], ['H', 210, 75]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
};
// ammonia gives its lone pair to boron trifluoride
const NH3_BF3 = {
  atoms: [['N', 170, 130, { lp: 1 }], ['H', 115, 100], ['H', 115, 165], ['H', 170, 200], ['B', 340, 130], ['F', 340, 55, { lp: 3 }], ['F', 405, 170, { lp: 3 }], ['F', 275, 175, { lp: 3 }]],
  bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [4, 5, 1], [4, 6, 1], [4, 7, 1]],
  answer: [['lp:0', 'a:4']],
  product: { atoms: [['N', 190, 130, { q: 1, lp: 0 }], ['H', 135, 100], ['H', 135, 165], ['H', 190, 200], ['B', 290, 130, { q: -1 }], ['F', 300, 55, { lp: 3 }], ['F', 360, 165, { lp: 3 }], ['F', 270, 205, { lp: 3 }]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [4, 5, 1], [4, 6, 1], [4, 7, 1], [0, 4, 1]] },
};
// hydroxide + bromomethane (SN2)
const SN2 = {
  atoms: [['O', 110, 130, { q: -1, lp: 3 }], ['H', 60, 165], ['C', 255, 130], ['H', 240, 65], ['H', 215, 185], ['H', 290, 190], ['Br', 360, 130, { lp: 3 }]],
  bonds: [[0, 1, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1], [2, 6, 1]],
  answer: [['lp:0', 'a:2'], ['b:2-6', 'a:6']],
  hints: { 'b:2-6>a:2': 'The C–Br electrons leave with bromine, the more electronegative atom.', 'lp:6>a:2': 'Bromine is the leaving group: it takes electrons away, it doesn’t give them.' },
  product: { atoms: [['O', 175, 130, { lp: 2 }], ['H', 125, 165], ['C', 255, 130], ['H', 285, 68], ['H', 300, 185], ['H', 225, 192], ['Br', 430, 130, { q: -1, lp: 4 }]], bonds: [[0, 1, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1], [0, 2, 1]] },
};
// 2-bromo-2-methylpropane ionises (SN1 step 1)
const TBU = [['C', 240, 135], ['C', 175, 95, ch3], ['C', 175, 180, ch3], ['C', 260, 60, ch3]];
const SN1_A = {
  atoms: [...TBU, ['Br', 335, 150, { lp: 3 }]],
  bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
  answer: [['b:0-4', 'a:4']],
  hints: { 'b:0-4>a:0': 'Bromine is more electronegative: it keeps the bonding pair as it leaves.' },
  product: { atoms: [['C', 240, 135, { q: 1 }], ['C', 175, 95, ch3], ['C', 175, 180, ch3], ['C', 260, 60, ch3], ['Br', 420, 150, { q: -1, lp: 4 }]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
};
// water attacks the carbocation (SN1 step 2)
const SN1_B = {
  atoms: [['C', 240, 135, { q: 1 }], ['C', 175, 95, ch3], ['C', 175, 180, ch3], ['C', 260, 60, ch3], ['O', 380, 150, { lp: 2 }], ['H', 420, 105], ['H', 430, 195]],
  bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [4, 5, 1], [4, 6, 1]],
  answer: [['lp:4', 'a:0']],
  product: { atoms: [['C', 240, 135], ['C', 175, 95, ch3], ['C', 175, 180, ch3], ['C', 260, 60, ch3], ['O', 330, 150, { q: 1, lp: 1 }], ['H', 365, 100], ['H', 380, 195]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [4, 5, 1], [4, 6, 1], [0, 4, 1]] },
};
// hydroxide + bromoethane (E2): H and Br anti to each other
const E2 = {
  atoms: [['O', 90, 70, { q: -1, lp: 3 }], ['H', 45, 105], ['C', 245, 140], ['H', 205, 90], ['H', 200, 185], ['H', 265, 205], ['C', 345, 140], ['H', 375, 85], ['H', 330, 205], ['Br', 425, 190, { lp: 3 }]],
  bonds: [[0, 1, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1], [2, 6, 1], [6, 7, 1], [6, 8, 1], [6, 9, 1]],
  answer: [['lp:0', 'a:3'], ['b:2-3', 'b:2-6'], ['b:6-9', 'a:9']],
  hints: { 'lp:0>a:6': 'That would be substitution (SN2). Here hydroxide acts as a base: it grabs a proton.', 'lp:0>a:2': 'Hydroxide acts as a base here: aim at a hydrogen.', 'b:2-3>a:2': 'The C–H electrons don’t stay on one carbon: they swing in between the carbons to make the new π bond.' },
  product: { atoms: [['O', 120, 70, { lp: 2 }], ['H', 75, 105], ['C', 245, 140], ['H', 170, 80], ['H', 205, 195], ['H', 285, 200], ['C', 345, 140], ['H', 385, 90], ['H', 330, 205], ['Br', 480, 200, { q: -1, lp: 4 }]], bonds: [[0, 1, 1], [0, 3, 1], [2, 4, 1], [2, 5, 1], [2, 6, 2], [6, 7, 1], [6, 8, 1]] },
};
// HBr adds to propene, step 1: π bond takes the proton
const ADD_A = {
  atoms: [['C', 170, 165, { h: 2 }], ['C', 260, 125, { h: 1 }], ['C', 350, 165, ch3], ['H', 210, 50], ['Br', 300, 35, { lp: 3 }]],
  bonds: [[0, 1, 2], [1, 2, 1], [3, 4, 1]],
  answer: [['b:0-1', 'a:3'], ['b:3-4', 'a:4']],
  hints: { 'lp:4>a:0': 'Bromine has to leave first: the alkene’s π electrons attack the hydrogen.' },
  product: { atoms: [['C', 170, 165, { h: 2 }], ['C', 260, 125, { h: 1, q: 1 }], ['C', 350, 165, ch3], ['H', 150, 95], ['Br', 400, 50, { q: -1, lp: 4 }]], bonds: [[0, 1, 1], [1, 2, 1], [0, 3, 1]] },
};
// step 2: bromide joins the carbocation
const ADD_B = {
  atoms: [['C', 170, 165, ch3], ['C', 260, 125, { h: 1, q: 1 }], ['C', 350, 165, ch3], ['Br', 330, 45, { q: -1, lp: 4 }]],
  bonds: [[0, 1, 1], [1, 2, 1]],
  answer: [['lp:3', 'a:1']],
  product: { atoms: [['C', 170, 165, ch3], ['C', 260, 125, { h: 1 }], ['C', 350, 165, ch3], ['Br', 260, 50, { lp: 3 }]], bonds: [[0, 1, 1], [1, 2, 1], [1, 3, 1]] },
};
// cyanide adds to acetone
const CYAN = {
  atoms: [['C', 100, 140, { q: -1, lp: 1 }], ['N', 30, 140, { lp: 1 }], ['C', 260, 140], ['O', 260, 60, { lp: 2 }], ['C', 330, 185, ch3], ['C', 190, 200, ch3]],
  bonds: [[0, 1, 3], [2, 3, 2], [2, 4, 1], [2, 5, 1]],
  answer: [['lp:0', 'a:2'], ['b:2-3', 'a:3']],
  hints: { 'b:2-3>a:2': 'The π electrons move onto oxygen, the more electronegative atom.', 'lp:1>a:2': 'Cyanide attacks through its negatively charged carbon.' },
  product: { atoms: [['C', 180, 150], ['N', 110, 150, { lp: 1 }], ['C', 260, 140], ['O', 260, 60, { q: -1, lp: 3 }], ['C', 330, 185, ch3], ['C', 260, 215, ch3]], bonds: [[0, 1, 3], [2, 3, 1], [2, 4, 1], [2, 5, 1], [0, 2, 1]] },
};

// ---------- SN2 umbrella flip ----------
function umbrella() {
  return {
    kind: 'graph', xmin: -5, xmax: 5, ymin: -2.2, ymax: 2.2, grid: false, axes: false, height: 240, equal: true,
    animate: { param: 't', speed: 0.25, max: 1, loop: false },
    extra: ({ plot, p, s }) => {
      const t = Math.min(1, p.t || 0), e = t * t * (3 - 2 * t);
      const lean = -0.55 + 1.1 * e, nu = -3.8 + 2.2 * e, lg = 1.6 + 2.2 * e;
      const H = [[lean, 1.2], [lean - 0.25, -0.9], [lean + 0.25, -0.75]];
      const out = [];
      const bond = (x1, y1, x2, y2, partial) => s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), stroke: 'var(--ink)', 'stroke-opacity': 0.75, 'stroke-width': 4, 'stroke-dasharray': partial ? '6 6' : null });
      out.push(bond(nu, 0, 0, 0, e < 0.98), bond(0, 0, lg, 0, e > 0.02));
      H.forEach(([x, y]) => out.push(bond(0, 0, x, y, false)));
      const atom = (x, y, rr, fill, ring, text) => [s('circle', { cx: plot.X(x), cy: plot.Y(y), r: rr, fill, stroke: ring, 'stroke-width': 3 }), s('text', { x: plot.X(x), y: plot.Y(y) + 6, 'text-anchor': 'middle', class: 'lbl', style: `fill:${fill === 'var(--ink)' ? 'var(--card)' : 'var(--ink)'};${FS(15)}`, text })];
      H.forEach(([x, y]) => out.push(...atom(x, y, 14, 'var(--card)', 'var(--ink-3)', 'H')));
      out.push(...atom(0, 0, 19, 'var(--ink)', 'var(--ink)', 'C'));
      out.push(...atom(nu, 0, 22, 'var(--coral-soft)', 'var(--coral)', 'HO'));
      out.push(...atom(lg, 0, 22, 'var(--pink-soft)', 'var(--pink)', 'Br'));
      return out;
    },
    readout: (p) => ((p.t || 0) < 0.05 ? 'Press play: hydroxide approaches from the side opposite bromine.' : (p.t || 0) < 0.6 ? 'Transition state: O–C forming, C–Br breaking, the three hydrogens flattening.' : 'The hydrogens have flipped like an umbrella in the wind: inversion.'),
  };
}

// ---------- synthesis planner ----------
const ROUTES = {
  'ethene': { 'water, acid catalyst': 'ethanol', 'HBr': 'bromoethane', 'bromine': '1,2-dibromoethane' },
  'ethanol': { 'HBr': 'bromoethane', 'dichromate, gentle': 'ethanal', 'dichromate, reflux': 'ethanoic acid', 'conc. acid, hot': 'ethene' },
  'bromoethane': { 'NaOH in water': 'ethanol', 'NaOH in ethanol, hot': 'ethene' },
  'ethanal': { 'dichromate, reflux': 'ethanoic acid', 'NaBH₄': 'ethanol' },
  'ethanoic acid': { 'ethanol, acid': 'ethyl ethanoate', 'LiAlH₄': 'ethanol' },
};
const REAGENTS = ['skip', 'water, acid catalyst', 'HBr', 'NaOH in water', 'dichromate, gentle', 'dichromate, reflux', 'ethanol, acid'];
function planner(start, target, steps, solution) {
  const params = {};
  for (let k = 0; k < steps; k++) params['s' + k] = { min: 0, max: REAGENTS.length - 1, step: 1, value: 0, label: `Step ${k + 1}`, format: (v) => REAGENTS[v], control: 'buttons' };
  const run = (p) => {
    const path = [start];
    for (let k = 0; k < steps; k++) {
      const rg = REAGENTS[p['s' + k]], cur = path[path.length - 1];
      if (rg === 'skip' || cur === null) { path.push(cur); continue; }
      path.push(ROUTES[cur]?.[rg] ?? null);
    }
    return path;
  };
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: steps + 1.6, grid: false, axes: false, height: 90 + steps * 64, stackSliders: true,
    params,
    extra: ({ plot, p, s }) => {
      const path = run(p), out = [];
      path.forEach((c, k) => {
        const y = plot.Y(steps + 1.1 - k), done = c === target;
        out.push(s('rect', { x: plot.X(2.3), y: y - 20, width: plot.X(7.7) - plot.X(2.3), height: 40, rx: 12, fill: done ? 'var(--success-tint)' : c === null ? 'var(--error-tint)' : 'var(--card)', stroke: done ? 'var(--success)' : c === null ? 'var(--error)' : 'var(--line-2)', 'stroke-width': 2 }));
        out.push(s('text', { x: plot.X(5), y: y + 6, 'text-anchor': 'middle', class: 'lbl', style: FS(16), text: c === null ? 'no reaction / mess' : c }));
        if (k > 0) out.push(s('text', { x: plot.X(2.1), y: y - 26, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(12)}`, text: REAGENTS[p['s' + (k - 1)]] === 'skip' ? '' : REAGENTS[p['s' + (k - 1)]] }));
      });
      out.push(s('text', { x: plot.X(9.9), y: plot.Y(steps + 1.1) + 6, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--success);${FS(13)}`, text: `goal: ${target}` }));
      return out;
    },
    readout: (p) => { const path = run(p), last = path[path.length - 1]; return last === target ? `**${target}** reached ✓` : last === null ? 'A reagent was used on something it doesn’t react with.' : `you have **${last}**`; },
    goal: (p) => { const path = run(p); return path[path.length - 1] === target ? true : { ok: false, msg: path.includes(null) ? 'One of those reagents doesn’t do anything useful to the compound in front of it.' : `That ends at ${path[path.length - 1]}, not ${target}.` }; },
    solution,
  };
}

// ---------- SN1 energy profile: a high first hill, a valley for the carbocation, a low second hill ----------
// a smooth schematic curve through (reaction progress, energy) points
const SN1_PTS = [[0, 1.0], [2.2, 4.6], [4.4, 2.85], [5.9, 3.55], [8.2, 0.45], [9.6, 0.45]];
const sn1E = (x) => {
  let i = 0;
  while (i < SN1_PTS.length - 2 && x > SN1_PTS[i + 1][0]) i++;
  const [x0, y0] = SN1_PTS[i], [x1, y1] = SN1_PTS[i + 1], u = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
  return y0 + (y1 - y0) * (u * u * (3 - 2 * u));
};
const sn1X = (t) => {
  // the dot waits in the valley: the carbocation lives long enough to meet a water molecule
  if (t < 3) return 0.3 + (4.4 - 0.3) * (t / 3);
  if (t < 4) return 4.4;
  return Math.min(9.4, 4.4 + (9.4 - 4.4) * ((t - 4) / 2.5));
};

export default {
  id: 'mechanisms',
  subject: 'physics',
  title: 'Reaction Mechanisms',
  level: 'Advanced',
  cover: 'mechanisms',
  tagline: 'Push electrons with curly arrows: substitution, elimination, addition, and planning a synthesis.',
  description: r`A balanced equation says what goes in and what comes out; a **mechanism** says how, one electron pair at a time. Draw curly arrows yourself, from lone pairs and bonds to the atoms that receive them, and watch each step produce its products. Meet nucleophiles and electrophiles, the one-step SN2 with its umbrella flip, the carbocations of SN1, eliminations that make double bonds, additions that break them, and attacks on the carbonyl group, then string reactions together to plan a synthesis.`,
  prereq: 'Organic Chemistry, and Acids, Bases & Buffers',
  chapters: [
    {
      title: 'Pushing Electrons',
      summary: 'The grammar of curly arrows.',
      lessons: [
        {
          id: 'arrows',
          title: 'Curly Arrows',
          summary: 'Electrons move in pairs',
          icon: 'right',
          steps: [
            {
              type: 'explain',
              title: 'The rules',
              body: r`A curly arrow shows **one pair of electrons** moving. It always starts at electrons, either
- a **lone pair**, which becomes a new bond to the atom it points at, or
- a **bond**, whose pair moves onto one of its atoms (the bond breaks) or into a new bond nearby,

and it ends where the pair goes. Arrows never start at an atom or a positive charge: electrons move, nuclei follow.

In these puzzles, tap where the pair starts (a lone pair or a bond), then where it goes (an atom or a bond). Tap an arrow to remove it.`,
            },
            {
              type: 'interactive',
              title: 'One arrow',
              prompt: r`Ammonia picks up a proton ($\mathrm{H^+}$). Draw the arrow.`,
              widget: arrows({ ...NH3_H, h: 250, hints: { 'lp:0>a:0': 'Point the arrow at the proton.' } }),
              explain: r`From nitrogen's lone pair to the proton: the pair becomes the fourth N–H bond, and the + charge moves to nitrogen, giving ammonium, $\mathrm{NH_4^+}$.`,
            },
            {
              type: 'interactive',
              title: 'Filling a gap',
              prompt: r`Boron in $\mathrm{BF_3}$ has only six electrons. Draw the arrow for ammonia sharing its lone pair with boron.`,
              widget: arrows({ ...NH3_BF3, h: 260 }),
              explain: r`Nitrogen's lone pair forms an N–B bond. Count formal charges after: nitrogen (four bonds, no lone pair) is +1 and boron (four bonds) is −1, though the molecule is neutral overall.`,
            },
            {
              type: 'mcq',
              title: 'Where arrows start',
              prompt: 'Which of these can never be the start of a curly arrow?',
              choices: [
                { t: 'A positive charge with no electrons', ok: true },
                { t: 'A lone pair', why: 'Lone pairs are the commonest starting point.' },
                { t: 'A π bond', why: 'π bonds are electron-rich and often attack.' },
                { t: 'A σ bond', why: 'A σ bond that breaks sends its pair somewhere: the arrow starts at the bond.' },
              ],
              explain: r`An arrow shows electrons moving, so it must start where electrons are. A positive charge marks a shortage of electrons: arrows end there, never start there.`,
            },
            {
              type: 'explain',
              title: 'Two ways to break a bond',
              body: r`When a bond breaks with both electrons going to one atom, it is **heterolytic**: one fragment ends up positive, the other negative. The more electronegative atom usually takes the pair. (When each atom takes one electron, giving radicals, chemists use half-headed "fish-hook" arrows instead.)`,
              widget: view(null, { atoms: [['C', 120, 110], ['C', 60, 70, ch3], ['C', 60, 150, ch3], ['C', 140, 40, ch3], ['Br', 210, 120, { lp: 3 }], ['C', 400, 110, { q: 1 }], ['C', 340, 70, ch3], ['C', 340, 150, ch3], ['C', 420, 40, ch3], ['Br', 540, 120, { q: -1, lp: 4 }]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [5, 6, 1], [5, 7, 1], [5, 8, 1]], h: 200, extra: ({ s }) => [s('text', { x: 285, y: 122, 'text-anchor': 'middle', class: 'lbl', style: FS(24), text: '→' })] }),
            },
          ],
          recap: [
            'A curly arrow = one electron pair moving, from a lone pair or bond to an atom or bond.',
            'Arrows never start at a positive charge or an empty orbital.',
            'Heterolysis: both electrons go to one atom, giving ions.',
          ],
        },
        {
          id: 'nucleophiles',
          title: 'Nucleophiles & Electrophiles',
          summary: 'Electron-rich meets electron-poor',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Rich and poor',
              body: r`Most reactions are electron-rich sites attacking electron-poor ones:
- a **nucleophile** ("nucleus-loving") has electrons to share: a lone pair, often a negative charge, or a π bond. Examples: $\mathrm{OH^-}$, $\mathrm{CN^-}$, $\mathrm{NH_3}$, $\mathrm{H_2O}$.
- an **electrophile** ("electron-loving") wants electrons: a positive charge, an empty orbital, or an atom made $\delta^+$ by an electronegative neighbour, like the carbon in C–Br or C=O.

Curly arrows almost always run from nucleophile to electrophile.`,
            },
            {
              type: 'interactive',
              title: 'Spot the nucleophiles',
              prompt: r`Tap every atom here that can act as a nucleophile.`,
              widget: pick({ atoms: [['O', 70, 100], ['H', 30, 150], ['H', 115, 150], ['C', 225, 105], ['H', 225, 45], ['H', 180, 150], ['H', 270, 150], ['H', 225, 170], ['N', 385, 100], ['H', 340, 150], ['H', 430, 150], ['H', 385, 165], ['O', 525, 100, { q: -1 }], ['H', 565, 150]], bonds: [[0, 1, 1], [0, 2, 1], [3, 4, 1], [3, 5, 1], [3, 6, 1], [3, 7, 1], [8, 9, 1], [8, 10, 1], [8, 11, 1], [12, 13, 1]], h: 210, pick: 'heavy', answer: [0, 8, 12], extraMsg: 'Methane’s carbon has no lone pairs: nothing to share.', missMsg: 'Look for every atom with a lone pair.' }),
              explain: r`Water's oxygen, ammonia's nitrogen and hydroxide's oxygen all have lone pairs. Hydroxide, with its negative charge, is the strongest of the three; methane has no lone pairs and is not a nucleophile.`,
            },
            {
              type: 'mcq',
              title: 'The electrophilic carbon',
              prompt: r`In bromomethane, $\mathrm{CH_3{-}Br}$, which atom does a nucleophile attack?`,
              choices: [
                { t: 'The carbon: it is δ+ because bromine pulls electrons away', ok: true },
                { t: 'The bromine: it has lone pairs', why: 'Lone pairs make bromine electron-rich; nucleophiles look for electron-poor atoms.' },
                { t: 'A hydrogen', why: 'C–H bonds are barely polar. The carbon next to Br is the poor one.' },
              ],
              explain: r`Bromine is more electronegative than carbon, leaving carbon slightly positive. A nucleophile's lone pair heads for that carbon, and the C–Br pair leaves with bromine.`,
            },
            {
              type: 'mcq',
              title: 'Carbonyl carbon',
              prompt: 'In a C=O group, which atom is electrophilic?',
              choices: [
                { t: 'Carbon', ok: true },
                { t: 'Oxygen', why: 'Oxygen pulls the π electrons towards itself: it’s the δ− end.' },
              ],
              explain: r`Oxygen hogs the C=O electrons, leaving carbon $\delta^+$. Nucleophiles attack the carbon, and the π pair moves up onto oxygen: the heart of carbonyl chemistry, later in this course.`,
            },
            {
              type: 'multi',
              kicker: 'Challenge',
              title: 'Sort them',
              prompt: 'Which of these are electrophiles?',
              choices: [
                { t: r`$\mathrm{H^+}$`, ok: true },
                { t: r`$\mathrm{BF_3}$`, ok: true },
                { t: r`$\mathrm{(CH_3)_3C^+}$, a carbocation`, ok: true },
                { t: r`$\mathrm{CN^-}$`, why: 'Cyanide is negatively charged with lone pairs: a nucleophile.' },
                { t: r`$\mathrm{NH_3}$`, why: 'Ammonia shares its lone pair: a nucleophile (and a base).' },
              ],
              explain: r`Electrophiles are electron-poor: a bare proton, an atom with an empty orbital (boron in $\mathrm{BF_3}$), a carbon with only six electrons. Each can accept a pair.`,
            },
          ],
          recap: [
            'Nucleophiles share electrons (lone pairs, negative charge, π bonds).',
            'Electrophiles accept them (positive charge, empty orbital, δ+ atoms).',
            'Arrows run from nucleophile to electrophile.',
          ],
        },
      ],
    },
    {
      title: 'Substitution & Elimination',
      summary: 'Swapping groups and making double bonds.',
      lessons: [
        {
          id: 'sn2',
          title: 'SN2',
          summary: 'One step, from the back',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Swap in one move',
              body: r`In a **nucleophilic substitution**, a nucleophile replaces a **leaving group** (such as $\mathrm{Br^-}$) on carbon. In the **SN2** route (Substitution, Nucleophilic, 2 species in the slow step), it all happens in one concerted step: the new bond forms as the old one breaks.`,
            },
            {
              type: 'interactive',
              title: 'Hydroxide meets bromomethane',
              prompt: r`Draw the two arrows: the nucleophile's attack, and the leaving group's departure.`,
              widget: arrows({ ...SN2, h: 260 }),
              explain: r`Oxygen's lone pair forms the O–C bond while the C–Br pair leaves with bromine, giving methanol and bromide. Two arrows, one step.`,
            },
            {
              type: 'explain',
              title: 'Inside out',
              body: r`The nucleophile attacks from the side **opposite** the leaving group, where the C–Br antibonding orbital points. As it comes in, the three other groups flip over, like an umbrella turning inside out in the wind.`,
              widget: umbrella(),
              after: r`If the carbon is a stereocentre, its configuration is **inverted**: usually R becomes S, though the letter can stay the same if the new group changes the priorities. This Walden inversion is the signature of SN2.`,
            },
            {
              type: 'order',
              title: 'Crowding slows it down',
              prompt: 'Order these bromides from fastest to slowest in an SN2 reaction.',
              items: [r`$\mathrm{CH_3Br}$ (methyl)`, r`$\mathrm{CH_3CH_2Br}$ (primary)`, r`$\mathrm{(CH_3)_2CHBr}$ (secondary)`, r`$\mathrm{(CH_3)_3CBr}$ (tertiary)`],
              explain: r`The nucleophile must reach the back of the carbon. Each extra methyl group blocks the way; for tertiary bromides SN2 is so slow that another mechanism takes over (SN1, next lesson).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Rate law',
              prompt: 'In an SN2 reaction, what happens to the rate if you double the concentration of the nucleophile?',
              choices: [
                { t: 'It doubles', ok: true },
                { t: 'Nothing', why: 'Both the nucleophile and the bromide are in the single step, so both concentrations matter.' },
                { t: 'It quadruples', why: 'Rate = k[Nu][RBr]: doubling one concentration doubles the rate.' },
              ],
              explain: r`Rate $= k[\mathrm{Nu^-}][\mathrm{RBr}]$: both species meet in the only step. That "2" is the 2 in SN2.`,
            },
          ],
          recap: [
            'SN2: nucleophile in, leaving group out, in one step.',
            'Backside attack inverts the stereocentre.',
            'Rate = k[Nu][RX]; methyl > primary > secondary ≫ tertiary.',
          ],
        },
        {
          id: 'sn1',
          title: 'SN1 & Carbocations',
          summary: 'Leave first, then attack',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Two steps',
              body: r`A crowded tertiary bromide can't be attacked from behind. Instead, in a polar solvent like water, the leaving group departs **first**, leaving a flat **carbocation**; then a nucleophile attacks. This is **SN1** (only one species in the slow first step).`,
            },
            {
              type: 'interactive',
              title: 'Step 1: the bromide leaves',
              prompt: r`Draw the arrow for the C–Br bond breaking, with bromine keeping the pair.`,
              widget: arrows({ ...SN1_A, h: 240 }),
              explain: r`The C–Br pair goes to bromine, leaving a carbon with only three bonds and a positive charge: the tert-butyl **carbocation**. This slow step sets the rate: Rate $= k[\mathrm{RBr}]$.`,
            },
            {
              type: 'interactive',
              title: 'Step 2: water attacks',
              prompt: r`A water molecule attacks the carbocation. Draw the arrow.`,
              widget: arrows({ ...SN1_B, h: 240 }),
              explain: r`Water's lone pair bonds to the carbocation. The oxygen, now with three bonds, carries the + charge; a third step (another water taking a proton from it) gives the neutral alcohol, 2-methylpropan-2-ol.`,
            },
            { /*chemanim:mechanisms.sn1*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Two hills to climb',
              body: r`Put both steps on one energy diagram. Each step has its own **transition state** (a hilltop). Between them sits a valley: the carbocation, a real **intermediate** that exists for a moment before water finds it.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 0.8, max: 7, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [];
                  out.push(s('path', { d: `M${X(0.2)} ${Y(5.6)}V${Y(0.1)}H${X(9.8)}`, fill: 'none', stroke: 'var(--axis)', 'stroke-width': 1.5 }));
                  out.push(s('text', { x: X(0.35), y: Y(5.6) + 2, class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'energy' }));
                  out.push(s('text', { x: X(9.8), y: Y(0.1) + 16, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'reaction progress →' }));
                  let d = '';
                  for (let x = 0.3; x <= 9.41; x += 0.05) d += `${d ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(sn1E(x)).toFixed(1)}`;
                  out.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }));
                  // the climb for each step
                  out.push(s('line', { x1: X(1.1), x2: X(1.1), y1: Y(1.0), y2: Y(4.6), stroke: 'var(--coral)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
                  out.push(s('line', { x1: X(0.9), x2: X(2.2), y1: Y(4.6), y2: Y(4.6), stroke: 'var(--coral)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
                  out.push(s('text', { x: X(1.0), y: Y(2.8), 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--coral);${FS(11)}`, text: 'slow' }));
                  out.push(s('line', { x1: X(5.2), x2: X(5.2), y1: Y(2.85), y2: Y(3.55), stroke: 'var(--teal)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
                  out.push(s('text', { x: X(5.05), y: Y(3.2) + 4, 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--teal);${FS(11)}`, text: 'fast' }));
                  // what is in the flask at each stage
                  const lab = (x, y, txt, col) => out.push(s('text', { x: X(x), y: Y(y), 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:${col};${FS(12)}`, text: txt }));
                  lab(0.95, 0.45, '(CH₃)₃C–Br', 'var(--ink)');
                  lab(2.2, 5.05, '(CH₃)₃C···Br', 'var(--coral)');
                  lab(4.4, 2.3, '(CH₃)₃C⁺ + Br⁻', 'var(--ink)');
                  lab(5.9, 4.0, 'C···OH₂', 'var(--teal)');
                  lab(8.6, 0.95, '(CH₃)₃C–OH₂⁺', 'var(--ink)');
                  const x = sn1X(p.t);
                  out.push(s('circle', { cx: X(x), cy: Y(sn1E(x)), r: 8, fill: 'var(--amber)', stroke: 'var(--warn)', 'stroke-width': 2 }));
                  return out;
                },
                readout: (p) => {
                  const x = sn1X(p.t);
                  return x < 2.1 ? 'Step 1: the C–Br bond stretches. The highest hill: this sets the rate.' : x < 4.39 ? 'Over the top: bromide leaves, the carbocation forms.' : p.t < 4 ? 'The intermediate: a flat carbocation, waiting for a water molecule.' : x < 5.95 ? 'Step 2: water attacks over a small hill.' : 'Product, before a final proton is lost to make the alcohol.';
                },
              },
              after: r`The overall rate is set by the **highest** hill on the route, the first one: the bond to bromine breaking with nothing helping it along. Water only takes part after that hill, which is why its concentration doesn't appear in the rate law, $\text{rate} = k[\mathrm{RBr}]$. Anything that steadies the carbocation lowers the first hill (and the valley), which is why tertiary halides react this way and methyl halides don't.`,
            },
            {
              type: 'order',
              title: 'Carbocation stability',
              prompt: 'Order these carbocations from most to least stable.',
              items: [r`tertiary, $\mathrm{(CH_3)_3C^+}$`, r`secondary, $\mathrm{(CH_3)_2CH^+}$`, r`primary, $\mathrm{CH_3CH_2^+}$`, r`methyl, $\mathrm{CH_3^+}$`],
              explain: r`Alkyl groups feed electron density into the empty orbital (by induction and hyperconjugation), spreading out the positive charge. More alkyl groups, more stable: the exact opposite of the SN2 order.`,
            },
            {
              type: 'mcq',
              title: 'Flat in the middle',
              prompt: 'An SN1 reaction starts from a single enantiomer of a chiral bromide. What does the product usually look like?',
              choices: [
                { t: 'A nearly 50:50 mix of both enantiomers', ok: true },
                { t: 'Pure inverted product', why: 'That’s SN2. Here the carbocation is flat.' },
                { t: 'Pure product with the same configuration', why: 'The flat carbocation forgets which side the bromine was on.' },
              ],
              explain: r`The carbocation is flat ($\mathrm{sp^2}$), so the nucleophile can attack either face equally: the product is (nearly) racemic. SN2 inverts; SN1 scrambles.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which mechanism?',
              prompt: r`2-bromo-2-methylpropane reacts with water. Doubling the water concentration doesn’t change the rate. What does that tell you?`,
              choices: [
                { t: 'It’s SN1: water isn’t in the rate-determining step', ok: true },
                { t: 'It’s SN2', why: 'In SN2 the nucleophile’s concentration appears in the rate law.' },
                { t: 'Water isn’t involved at all', why: 'Water does end up in the product; it just arrives after the slow step.' },
              ],
              explain: r`Rate $= k[\mathrm{RBr}]$: only the slow ionisation matters. Kinetics like this is how mechanisms were worked out in the first place, by Hughes and Ingold in the 1930s.`,
            },
          ],
          recap: [
            'SN1: leaving group leaves (slow), then nucleophile attacks.',
            'Rate = k[RX]; carbocation stability tertiary > secondary > primary > methyl.',
            'Flat carbocation → racemic product.',
          ],
        },
        {
          id: 'elimination',
          title: 'Elimination',
          summary: 'Making a double bond',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Pull off a proton instead',
              body: r`A nucleophile is usually also a **base**. Instead of attacking carbon, it can pull off a proton from the carbon **next to** the one carrying the leaving group. The C–H electrons swing in to form a C=C double bond and the leaving group departs: an **E2 elimination**, all in one step. It works best when the H and the leaving group are on opposite sides of the C–C bond.`,
            },
            {
              type: 'interactive',
              title: 'Three arrows',
              prompt: r`Draw the E2 elimination of bromoethane by hydroxide: base takes the proton, the C–H pair forms the π bond (aim it at the C–C bond), and bromide leaves.`,
              widget: arrows({ ...E2, h: 260 }),
              explain: r`Three arrows, one step: hydroxide removes the proton (making water), the C–H pair becomes the new π bond between the carbons, and the C–Br pair leaves with bromide. Product: ethene.`,
            },
            {
              type: 'mcq',
              title: 'Substitute or eliminate?',
              prompt: 'Which conditions favour elimination over substitution?',
              choices: [
                { t: 'A strong, bulky base, heat, and a crowded (tertiary) halide', ok: true },
                { t: 'A small nucleophile, cool water, a methyl halide', why: 'Those favour substitution: methyl halides can’t even eliminate (no neighbouring carbon).' },
                { t: 'It’s random', why: 'Conditions shift the balance strongly.' },
              ],
              explain: r`A bulky base can't reach the carbon to substitute but can grab an outer hydrogen; heat favours elimination because it makes more molecules (entropy). Chemists choose conditions to steer between the two.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Zaitsev’s rule',
              prompt: r`2-bromobutane can lose H from either neighbouring carbon, giving but-1-ene or but-2-ene. With hydroxide, which is the main product?`,
              choices: [
                { t: 'But-2-ene: the more substituted double bond', ok: true },
                { t: 'But-1-ene', why: 'Small bases favour the more stable, more substituted alkene.' },
              ],
              explain: r`Alkyl groups stabilise a double bond, so the more substituted alkene (but-2-ene) is favoured, as Alexander Zaitsev noted in 1875. A very bulky base can reverse this, grabbing the more exposed $\mathrm{CH_3}$ hydrogens.`,
            },
          ],
          recap: [
            'E2: base removes β-H, C=C forms, leaving group leaves, in one step.',
            'Bulky bases and heat favour elimination; Zaitsev: more substituted alkene.',
          ],
        },
      ],
    },
    {
      title: 'Building Molecules',
      summary: 'Additions, carbonyls and planning.',
      lessons: [
        {
          id: 'addition',
          title: 'Adding to Double Bonds',
          summary: 'π electrons as a nucleophile',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'The π bond attacks',
              body: r`A C=C π bond is a cloud of electrons above and below the molecule, so alkenes act as **nucleophiles**. With HBr, the π electrons grab the proton, making a carbocation, which bromide then captures: an **electrophilic addition**, in two steps.`,
            },
            {
              type: 'interactive',
              title: 'Step 1: grab the proton',
              prompt: r`Propene meets HBr. Draw the arrows: the π bond attacks the hydrogen, and the H–Br pair leaves with bromine. (The proton goes to the $\mathrm{CH_2}$ end.)`,
              widget: arrows({ ...ADD_A, h: 240 }),
              explain: r`The π electrons form a C–H bond at the $\mathrm{CH_2}$ end, leaving the positive charge on the middle carbon, a **secondary** carbocation, and bromide splits off.`,
            },
            {
              type: 'interactive',
              title: 'Step 2: bromide joins',
              prompt: r`Finish it: bromide attacks the carbocation.`,
              widget: arrows({ ...ADD_B, h: 240 }),
              explain: r`Product: 2-bromopropane. The bromine ends up on the middle carbon.`,
            },
            {
              type: 'mcq',
              title: 'Markovnikov’s rule',
              prompt: 'Why does the H go to the CH₂ end, putting Br in the middle?',
              choices: [
                { t: 'That route gives the more stable (secondary) carbocation', ok: true },
                { t: 'Hydrogen prefers ends of chains', why: 'It’s about the carbocation that forms, not a preference of hydrogen.' },
                { t: 'Bromine is too big for the end', why: 'Size has nothing to do with it; carbocation stability decides.' },
              ],
              explain: r`Adding H to the end gives a secondary carbocation; adding it to the middle would give a less stable primary one. The reaction runs through the more stable intermediate. Vladimir Markovnikov stated the rule in 1869, long before anyone knew why.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Water adds the same way',
              prompt: r`Propene plus water, with an acid catalyst, gives mainly which alcohol?`,
              choices: [
                { t: 'Propan-2-ol (OH in the middle)', ok: true },
                { t: 'Propan-1-ol (OH at the end)', why: 'The proton adds first, to the CH₂ end, putting the cation (and then the OH) in the middle.' },
              ],
              explain: r`Same mechanism: $\mathrm{H^+}$ adds to make the secondary carbocation, water attacks it, and a proton is lost. That's how industry makes propan-2-ol (rubbing alcohol).`,
            },
          ],
          recap: [
            'Alkenes are nucleophiles: the π bond attacks electrophiles.',
            'Addition of HX goes via the more stable carbocation (Markovnikov).',
          ],
        },
        {
          id: 'carbonyl',
          title: 'Carbonyl Chemistry',
          summary: 'Attacking C=O',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'The most useful bond',
              body: r`The C=O carbon is electrophilic and its π electrons can retreat onto oxygen. A nucleophile adds to the carbon while the π pair moves up onto oxygen, making an alkoxide ($\mathrm{O^-}$), which then picks up a proton. This **nucleophilic addition** is how aldehydes and ketones react with cyanide, hydride and carbon nucleophiles.`,
            },
            {
              type: 'interactive',
              title: 'Cyanide adds to acetone',
              prompt: r`Draw the two arrows for cyanide attacking acetone's carbonyl carbon.`,
              widget: arrows({ ...CYAN, h: 250 }),
              explain: r`The cyanide carbon's lone pair forms the new C–C bond and the C=O π pair moves onto oxygen. Adding a proton gives a **cyanohydrin**. Making a new C–C bond like this lengthens carbon chains, which is why cyanide is so useful in synthesis. Cyanohydrins occur in nature too: bitter almonds store one, which releases hydrogen cyanide when the nut is crushed.`,
            },
            {
              type: 'mcq',
              title: 'Hydride',
              prompt: r`Sodium borohydride, $\mathrm{NaBH_4}$, delivers a hydride ion ($\mathrm{H^-}$, a hydrogen nucleus with two electrons) to a ketone. What forms after adding acid?`,
              choices: [
                { t: 'An alcohol', ok: true },
                { t: 'A carboxylic acid', why: 'Adding hydride is a reduction, not an oxidation.' },
                { t: 'An alkene', why: 'The C=O becomes C–O–H, no C=C forms.' },
              ],
              explain: r`$\mathrm{H^-}$ adds to the carbonyl carbon, the π pair goes to oxygen, and protonation gives an alcohol: ketones give secondary alcohols, aldehydes primary ones.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Faster or slower?',
              prompt: 'Aldehydes (R–CHO) react with nucleophiles faster than ketones (R–CO–R). Why?',
              choices: [
                { t: 'The carbonyl carbon is less crowded and less stabilised by electron-donating alkyl groups', ok: true },
                { t: 'Aldehydes contain more oxygen', why: 'Both have one C=O.' },
                { t: 'Ketones have no δ+ carbon', why: 'Both do; ketones’ is just more shielded and less positive.' },
              ],
              explain: r`Two alkyl groups both crowd the ketone's carbon and push electron density into it, making it a weaker electrophile. Aldehydes have a small H on one side.`,
            },
          ],
          recap: [
            'Nucleophiles add to the C=O carbon; the π pair moves to O.',
            'Cyanide lengthens chains; hydride reduces to alcohols.',
          ],
        },
        {
          id: 'synthesis',
          title: 'Planning a Synthesis',
          summary: 'Chaining reactions together',
          icon: 'flag',
          steps: [
            {
              type: 'explain',
              title: 'A map of reactions',
              body: r`Each reaction is a road between two kinds of compound. Planning a synthesis means finding a route on this map from what you can buy to what you want:

| from | reagent | gives |
|---|---|---|
| alkene | water, acid catalyst | alcohol |
| alkene | HBr | bromoalkane |
| bromoalkane | NaOH in water | alcohol (SN2) |
| primary alcohol | dichromate, gentle (distil off) | aldehyde |
| primary alcohol or aldehyde | dichromate, reflux | carboxylic acid |
| carboxylic acid | alcohol, acid catalyst | ester |`,
            },
            {
              type: 'interactive',
              title: 'Ethene to vinegar',
              prompt: r`Turn ethene into ethanoic acid (acetic acid) in two steps.`,
              widget: planner('ethene', 'ethanoic acid', 2, { s0: 1, s1: 5 }),
              explain: r`Hydrate ethene to ethanol, then oxidise fully (reflux keeps the intermediate aldehyde in the flask until it is oxidised too).`,
            },
            {
              type: 'interactive',
              title: 'Gentle or full?',
              prompt: r`Make ethanal (acetaldehyde) from bromoethane in two steps.`,
              widget: planner('bromoethane', 'ethanal', 2, { s0: 3, s1: 4 }),
              explain: r`SN2 with aqueous NaOH gives ethanol; gentle oxidation, distilling the low-boiling aldehyde (20 °C) out as it forms, stops at ethanal before it can oxidise further.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Pear drops from ethene',
              prompt: r`Make ethyl ethanoate starting from ethene, in three steps. (Assume you can borrow extra ethanol for the last step.)`,
              widget: planner('ethene', 'ethyl ethanoate', 3, { s0: 1, s1: 5, s2: 6 }),
              explain: r`Ethene → ethanol (hydration) → ethanoic acid (full oxidation) → ethyl ethanoate (esterification with ethanol). Working backwards from the target (**retrosynthesis**), the strategy E. J. Corey formalised and won the 1990 Nobel Prize for, is usually the fastest way to plan.`,
            },
          ],
          recap: [
            'Reactions chain into routes; plan by working backwards from the target.',
            'Reagent and conditions matter: gentle vs reflux oxidation.',
          ],
        },
      ],
    },
  ],
};
