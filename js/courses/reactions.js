import { fix } from '../lib/svg.js';

const r = String.raw;
const FS = (px) => `font-size:max(calc(${px}px * var(--fs, 1)), var(--fmin, 0px))`;
const R_GAS = 8.314; // J/(mol·K)
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// ---------- balancing equations ----------
const EL = { H: 'fl-muted', C: 'fl-ink', O: 'fl-coral', N: 'fl-blue' };
const SUB = (t) => t.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
// species: [formula, {element: count}]; eq: { left: [...], right: [...] }
function balanceWidget(eq, sol, { hint } = {}) {
  const all = [...eq.left, ...eq.right];
  const els = [...new Set(all.flatMap(([, a]) => Object.keys(a)))];
  const params = {};
  all.forEach(([f], i) => { params['c' + i] = { min: 1, max: 8, step: 1, value: 1, label: SUB(f), color: i < eq.left.length ? 'blue' : 'coral' }; });
  const count = (p, side, el) => (side === 'L' ? eq.left : eq.right).reduce((t, [, a], i) => t + (a[el] || 0) * p['c' + (side === 'L' ? i : i + eq.left.length)], 0);
  const text = (p) => {
    const part = (list, off) => list.map(([f], i) => `${p['c' + (i + off)] === 1 ? '' : p['c' + (i + off)] + ' '}${SUB(f)}`).join(' + ');
    return `${part(eq.left, 0)}  →  ${part(eq.right, eq.left.length)}`;
  };
  const rows = els.length;
  return {
    kind: 'graph', xmin: 0, xmax: 30, ymin: 0, ymax: 2.6 + rows * 2.2, grid: false, axes: false, height: 120 + rows * 70,
    params,
    extra: ({ plot, p, s }) => {
      const out = [s('text', { x: plot.X(15), y: plot.Y(1.2 + rows * 2.2) + 8, 'text-anchor': 'middle', class: 'lbl', style: FS(24), text: text(p) })];
      els.forEach((el, k) => {
        const y = 0.4 + (rows - 1 - k) * 2.2;
        const L = count(p, 'L', el), Rr = count(p, 'R', el), ok = L === Rr;
        const dots = (n, x0) => Array.from({ length: n }, (_, i) => s('circle', { cx: plot.X(x0 + (i % 12) * 1.02), cy: plot.Y(y + 1.35 - Math.floor(i / 12) * 0.9), r: 7, class: EL[el], stroke: 'var(--card)', 'stroke-width': 1.5 }));
        out.push(s('text', { x: plot.X(0.3), y: plot.Y(y + 0.9) + 6, class: 'lbl', style: FS(17), text: el }));
        out.push(...dots(Math.min(L, 24), 2), ...dots(Math.min(Rr, 24), 16.5));
        out.push(s('text', { x: plot.X(14.9), y: plot.Y(y + 0.9) + 6, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(${ok ? '--success' : '--error'});${FS(17)}`, text: ok ? '=' : '≠' }));
      });
      return out;
    },
    readout: (p) => {
      const tally = els.map((el) => `${el}: ${count(p, 'L', el)} | ${count(p, 'R', el)}`).join(' · ');
      const bad = els.filter((el) => count(p, 'L', el) !== count(p, 'R', el));
      return `${tally} · ${bad.length ? `unbalanced: ${bad.join(', ')}` : 'every element balances ✓'}`;
    },
    goal: (p) => {
      if (els.some((el) => count(p, 'L', el) !== count(p, 'R', el))) return { ok: false, msg: hint || 'Some element still has different numbers of atoms on the two sides.' };
      const g = all.reduce((acc, _, i) => gcd(acc, p['c' + i]), 0);
      return g === 1 ? true : { ok: false, msg: 'It balances, but every number shares a common factor. Use the smallest whole numbers.' };
    },
    solution: Object.fromEntries(sol.map((v, i) => ['c' + i, v])),
  };
}
const WATER = { left: [['H2', { H: 2 }], ['O2', { O: 2 }]], right: [['H2O', { H: 2, O: 1 }]] };
const METHANE = { left: [['CH4', { C: 1, H: 4 }], ['O2', { O: 2 }]], right: [['CO2', { C: 1, O: 2 }], ['H2O', { H: 2, O: 1 }]] };
const PROPANE = { left: [['C3H8', { C: 3, H: 8 }], ['O2', { O: 2 }]], right: [['CO2', { C: 1, O: 2 }], ['H2O', { H: 2, O: 1 }]] };

// ---------- bars for amounts ----------
function bars({ plot, s }, items, max) {
  // items: [label, value, color]
  const n = items.length, w = 10 / n;
  return items.flatMap(([lab, v, col], i) => {
    const x = i * w + w * 0.2, bw = w * 0.6, ht = Math.max(0, v);
    return [
      s('rect', { x: plot.X(x), y: plot.Y(ht), width: plot.X(x + bw) - plot.X(x), height: Math.max(0, plot.Y(0) - plot.Y(ht)), rx: 4, class: `fl-${col}` }),
      s('text', { x: plot.X(x + bw / 2), y: plot.Y(ht) - 8, 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(15), text: fix(v, 1) }),
      s('text', { x: plot.X(x + bw / 2), y: plot.Y(0) + 20, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(14)}`, text: lab }),
    ];
  });
}

// ---------- energy distributions ----------
function erfc(x) {
  const t = 1 / (1 + 0.3275911 * x);
  return t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
}
// fraction of molecules (3D Maxwell–Boltzmann) with energy above Ea (kJ/mol) at T
const above = (Ea, T) => { const x = (Ea * 1000) / (R_GAS * T); return erfc(Math.sqrt(x)) + 2 * Math.sqrt(x / Math.PI) * Math.exp(-x); };
const mb = (E, T) => { const kT = (R_GAS * T) / 1000; return (2 / Math.sqrt(Math.PI)) * Math.sqrt(E) * kT ** -1.5 * Math.exp(-E / kT); };
const arr = (Ea, T1, T2) => Math.exp(((Ea * 1000) / R_GAS) * (1 / T1 - 1 / T2));

// energy profile: reactants at 0, products at dH, hump of height Ea above reactants
function profile(x, Ea, dH) {
  const base = dH / (1 + Math.exp(-(x - 5) * 1.6));
  return base + (Ea - dH / 2) * Math.exp(-((x - 5) ** 2) / 1.6);
}

// ---------- titration: 25 mL of 0.1 M HCl, base of concentration cb added ----------
function titrationPH(V, cb = 0.1) {
  const na = 0.1 * 0.025, nb = (cb * V) / 1000, Vt = (25 + V) / 1000;
  const d = (na - nb) / Vt, Kw = 1e-14;
  const H = (d + Math.sqrt(d * d + 4 * Kw)) / 2;
  return -Math.log10(H);
}

// ---------- equilibrium A ⇌ B ----------
// starting from all A (amount 1); extra A added at time t0
function eqAB(t, kf, kb, add = 0, t0 = 20) {
  const k = kf + kb, Aeq = kb / k;
  const A1 = (tt) => Aeq + (1 - Aeq) * Math.exp(-k * tt);
  if (!add || t < t0) { const a = A1(t); return [a, 1 - a]; }
  const a0 = A1(t0) + add, tot = 1 + add, Aeq2 = tot * Aeq;
  const a = Aeq2 + (a0 - Aeq2) * Math.exp(-k * (t - t0));
  return [a, tot - a];
}

export default {
  id: 'reactions',
  subject: 'physics',
  title: 'Chemical Reactions',
  level: 'Intermediate',
  cover: 'reactions',
  tagline: 'Balancing equations, moles, reaction rates, catalysts, equilibrium and pH.',
  description: r`In a chemical reaction atoms trade partners, but none are made or lost. Balance equations by counting atoms, weigh out molecules by the mole, find which ingredient runs out first, watch molecules collide in a box to see why heat and catalysts speed reactions up, and explore reactions that run both ways, ending with the logarithmic pH scale and a titration.`,
  prereq: 'Ratios & Percentages, and Heat & Thermodynamics',
  chapters: [
    {
      title: 'Counting Atoms',
      summary: 'Equations, moles and recipes.',
      lessons: [
        {
          id: 'balancing',
          title: 'Balancing Equations',
          summary: 'No atom created or destroyed',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Atoms change partners',
              body: r`When hydrogen burns, hydrogen molecules ($\mathrm{H_2}$) and oxygen molecules ($\mathrm{O_2}$) become water ($\mathrm{H_2O}$). A **chemical equation** records this:
$$\mathrm{H_2 + O_2 \to H_2O} \quad \text{(not yet balanced)}$$
In a reaction, atoms are rearranged but never created or destroyed. In the 1780s Antoine Lavoisier showed by careful weighing that the total mass doesn't change. So both sides must contain the **same atoms**, and we balance an equation by choosing how many of each molecule take part: the numbers in front, called **coefficients**.`,
            },
            {
              type: 'interactive',
              title: 'Make water',
              prompt: r`Choose the coefficients so that every kind of atom balances. Each dot is one atom: {coral:oxygen} and grey hydrogen.`,
              widget: balanceWidget(WATER, [2, 1, 2], { hint: 'Count the oxygen atoms first: O₂ brings two, but each water molecule takes only one.' }),
              explain: r`$\mathrm{2H_2 + O_2 \to 2H_2O}$. One $\mathrm{O_2}$ has two oxygen atoms, enough for **two** water molecules, which need four hydrogen atoms: two $\mathrm{H_2}$ molecules. Fix one element at a time, then recheck the others.`,
            },
            {
              type: 'mcq',
              title: 'A tempting shortcut',
              prompt: r`Why can't we balance the equation by just writing $\mathrm{H_2 + O_2 \to H_2O_2}$?`,
              choices: [
                { t: r`$\mathrm{H_2O_2}$ is a different substance (hydrogen peroxide), not water`, ok: true },
                { t: 'It doesn’t balance the hydrogen', why: 'It does balance: 2 H and 2 O on each side. The problem is what the formula means.' },
                { t: 'Subscripts can only be 1 or 2', why: r`Plenty of molecules have larger subscripts, like $\mathrm{C_6H_{12}O_6}$ (glucose).` },
              ],
              explain: r`The small numbers (subscripts) say what a molecule **is**; changing them changes the substance. $\mathrm{H_2O_2}$ is a bleach, quite unlike water. To balance, you may only change the coefficients: how **many** of each molecule.`,
            },
            {
              type: 'interactive',
              title: 'Burning methane',
              prompt: r`Natural gas is mostly methane, $\mathrm{CH_4}$. Balance its burning in oxygen: carbon is shown in dark dots.`,
              widget: balanceWidget(METHANE, [1, 2, 1, 2], { hint: 'Carbon first, then hydrogen, and oxygen last (it appears in two products).' }),
              explain: r`$\mathrm{CH_4 + 2O_2 \to CO_2 + 2H_2O}$. One carbon goes to one $\mathrm{CO_2}$; four hydrogens make two waters. Then count oxygen on the right: $2 + 2 = 4$ atoms, which is two $\mathrm{O_2}$ molecules. Leaving the element that appears in several places until last saves a lot of back-and-forth.`,
            },
            {
              type: 'numeric',
              title: 'Count the oxygen',
              prompt: r`How many oxygen atoms are there in $\mathrm{2CO_2 + 3H_2O}$?`,
              unit: 'atoms',
              answer: 7,
              wrong: [{ v: 5, why: r`The coefficient multiplies the whole molecule: $2 \times 2 = 4$ oxygen in the $\mathrm{CO_2}$, and $3 \times 1 = 3$ in the water.` }, { v: 3, why: 'Don’t forget the oxygen in the carbon dioxide.' }],
              explain: r`$2\,\mathrm{CO_2}$ contains $2 \times 2 = 4$ oxygen atoms and $3\,\mathrm{H_2O}$ contains $3 \times 1 = 3$: seven in total. A coefficient multiplies every atom in the molecule after it.`,
            },
            {
              type: 'numeric',
              title: 'Mass is conserved',
              prompt: r`16 g of methane burns completely in 64 g of oxygen, producing 44 g of carbon dioxide and some water. How much water?`,
              unit: 'g',
              answer: 36,
              wrong: [{ v: 80, why: 'That’s the total mass of reactants. Some of it went into the carbon dioxide.' }, { v: 20, why: r`Subtract from the total: $(16 + 64) - 44$.` }],
              explain: r`The total mass stays the same: $16 + 64 = 80$ g of reactants, so $80 - 44 = 36$ g of water. (It's hard to see in everyday life because the gases escape: burning seems to destroy matter, but the products just float away.)`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Propane',
              prompt: r`Camping stoves burn propane, $\mathrm{C_3H_8}$. Balance its burning in oxygen.`,
              widget: balanceWidget(PROPANE, [1, 5, 3, 4], { hint: 'Three carbons need three CO₂; eight hydrogens need four H₂O. Then count the oxygen.' }),
              explain: r`$$\mathrm{C_3H_8 + 5O_2 \to 3CO_2 + 4H_2O}$$
On the right there are $3 \times 2 + 4 \times 1 = 10$ oxygen atoms, which is five $\mathrm{O_2}$ molecules. Burning one propane molecule takes five oxygen molecules, which is why stoves need plenty of air.`,
            },
          ],
          recap: [
            'Reactions rearrange atoms: each element must balance.',
            'Change coefficients (how many), never subscripts (what).',
            'Total mass is conserved.',
          ],
        },
        {
          id: 'moles',
          title: 'The Mole',
          summary: 'Counting by weighing',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Counting by the scoop',
              body: r`Atoms are far too small to count one by one, so chemists count them by **weighing**, the way a bank counts coins by weighing bags of them.

The counting unit is the **mole**: $6.022 \times 10^{23}$ particles (**Avogadro's number**). It's chosen so that a mole of atoms weighs, in grams, the same number as the atom's relative mass:
- hydrogen H: 1, carbon C: 12, nitrogen N: 14, oxygen O: 16 (to the nearest whole number).

So 12 g of carbon contains one mole of atoms, and a mole of water, $\mathrm{H_2O}$, weighs $1 + 1 + 16 = 18$ g. That's the **molar mass**: 18 g/mol.`,
            },
            {
              type: 'numeric',
              title: 'Molar mass',
              prompt: r`What is the molar mass of carbon dioxide, $\mathrm{CO_2}$?`,
              unit: 'g/mol',
              answer: 44,
              wrong: [{ v: 28, why: 'That counts only one oxygen. CO₂ has two: 12 + 16 + 16.' }, { v: 30, why: 'Carbon is 12 and each oxygen 16: 12 + 2 × 16.' }],
              explain: r`$12 + 2 \times 16 = 44$ g/mol. So 44 g of carbon dioxide contains $6.022 \times 10^{23}$ molecules.`,
            },
            {
              type: 'interactive',
              title: 'Equal numbers',
              prompt: r`A flask holds 64 g of oxygen gas, $\mathrm{O_2}$ (molar mass 32 g/mol). Weigh out the amount of water that contains **the same number of molecules**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4.6, grid: false, axes: false, height: 260,
                params: { g: { min: 0, max: 72, step: 2, value: 10, label: 'water', color: 'blue', format: (v) => `${v} g` } },
                extra: (ctx) => bars(ctx, [['O₂ (moles)', 2, 'coral'], ['H₂O (moles)', ctx.p.g / 18, 'blue']], 3),
                readout: (p) => `oxygen: 64 g ÷ 32 = **2.0 mol** · water: ${p.g} g ÷ 18 = **${fix(p.g / 18, 1)} mol**`,
                goal: (p) => p.g === 36,
                solution: { g: 36 },
                hint: 'First find how many moles of oxygen there are. Each mole of water weighs 18 g.',
              },
              explain: r`64 g of $\mathrm{O_2}$ is $64 \div 32 = 2$ mol. Two moles of water weigh $2 \times 18 = 36$ g. Equal moles mean equal numbers of molecules, even though the masses differ: each water molecule is lighter than an oxygen molecule.`,
            },
            {
              type: 'numeric',
              title: 'How many moles?',
              prompt: r`How many moles of water are in 90 g of water?`,
              unit: 'mol',
              answer: 5,
              wrong: [{ v: 1620, why: 'Divide the mass by the molar mass, don’t multiply.' }, { v: 0.2, why: r`That's $18 \div 90$. Moles $=$ mass $\div$ molar mass $= 90 \div 18$.` }],
              explain: r`$90 \div 18 = 5$ mol. The rule is $\text{moles} = \dfrac{\text{mass}}{\text{molar mass}}$.`,
            },
            {
              type: 'mcq',
              title: 'Light molecules',
              prompt: r`Which contains more molecules: 1 g of hydrogen gas ($\mathrm{H_2}$, 2 g/mol) or 1 g of oxygen gas ($\mathrm{O_2}$, 32 g/mol)?`,
              choices: [
                { t: 'The hydrogen, by a factor of 16', ok: true },
                { t: 'They contain the same number', why: 'Equal masses aren’t equal numbers: each hydrogen molecule is much lighter.' },
                { t: 'The oxygen, by a factor of 16', why: 'Heavier molecules mean fewer of them in the same mass.' },
              ],
              explain: r`1 g of $\mathrm{H_2}$ is $\frac12$ mol; 1 g of $\mathrm{O_2}$ is $\frac{1}{32}$ mol. Since $\frac{1}{2} \div \frac{1}{32} = 16$, the hydrogen has 16 times as many molecules.`,
            },
            {
              type: 'numeric',
              title: 'A gram of water',
              prompt: r`About how many molecules are in **1 g** of water? (Answer like 3.3e22, meaning $3.3 \times 10^{22}$.)`,
              answer: 6.022e23 / 18,
              relTol: 0.02,
              wrong: [{ v: 6.022e23, tol: 1.5e22, why: 'That’s a whole mole, which weighs 18 g. One gram is an eighteenth of that.' }, { v: 1.08e25, tol: 3e23, why: 'Divide by 18, don’t multiply.' }],
              explain: r`$\frac{1}{18}$ mol $\times 6.022 \times 10^{23} \approx 3.3 \times 10^{22}$ molecules: thirty thousand billion billion, in a single drop's worth of water.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Atoms in a diamond',
              prompt: r`A one-carat diamond weighs 0.2 g and is pure carbon (12 g/mol). About how many carbon atoms does it contain? (Answer like 1e22.)`,
              answer: (0.2 / 12) * 6.022e23,
              relTol: 0.02,
              wrong: [{ v: 0.2 / 12, tol: 0.0005, why: 'That’s the number of moles. Multiply by Avogadro’s number.' }, { v: 0.2 * 6.022e23, tol: 3e21, why: 'Divide the mass by 12 g/mol first to get moles.' }],
              explain: r`$0.2 \div 12 \approx 0.0167$ mol, and $0.0167 \times 6.022 \times 10^{23} \approx 1.0 \times 10^{22}$ atoms. Ten thousand billion billion atoms, each sharing electrons with four neighbours in a rigid 3D network.`,
            },
          ],
          recap: [
            'A mole is 6.022 × 10²³ particles.',
            'Molar mass in g/mol = sum of the atoms’ relative masses (H 1, C 12, O 16).',
            'moles = mass ÷ molar mass; equal moles mean equal numbers.',
          ],
        },
        {
          id: 'recipes',
          title: 'Recipes & Leftovers',
          summary: 'Limiting reagents',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'An equation is a recipe',
              body: r`A balanced equation is a recipe in **moles**:
$$\mathrm{2H_2 + O_2 \to 2H_2O}$$
reads "2 mol of hydrogen plus 1 mol of oxygen make 2 mol of water". The ratio is $2 : 1 : 2$, whatever the amounts: 10 mol of $\mathrm{H_2}$ needs 5 mol of $\mathrm{O_2}$ and makes 10 mol of water.

It works just like a sandwich recipe: 2 slices of bread + 1 slice of cheese → 1 sandwich. With 10 slices of bread and 3 of cheese, you make only 3 sandwiches: the cheese **runs out first** and limits the amount you can make.`,
            },
            {
              type: 'interactive',
              title: 'Nothing left over',
              prompt: r`A tank holds 3 mol of oxygen. How much hydrogen should you add so that **both** are used up completely?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 9, grid: false, axes: false, height: 280,
                params: { h: { min: 0, max: 10, step: 0.5, value: 2, label: 'H₂', color: 'blue', format: (v) => `${fix(v, 1)} mol` } },
                extra: (ctx) => {
                  const o = 3, ext = Math.min(ctx.p.h / 2, o);
                  return bars(ctx, [['H₂ left', ctx.p.h - 2 * ext, 'blue'], ['O₂ left', o - ext, 'coral'], ['H₂O made', 2 * ext, 'teal']], 9);
                },
                readout: (p) => { const ext = Math.min(p.h / 2, 3); return `water made: **${fix(2 * ext, 1)} mol** · left over: ${fix(p.h - 2 * ext, 1)} mol H₂, ${fix(3 - ext, 1)} mol O₂`; },
                goal: (p) => p.h === 6,
                solution: { h: 6 },
                hint: 'The recipe uses hydrogen and oxygen in the ratio 2 : 1.',
              },
              explain: r`3 mol of $\mathrm{O_2}$ needs $2 \times 3 = 6$ mol of $\mathrm{H_2}$, and they make 6 mol of water (108 g). Less hydrogen leaves oxygen over; more leaves hydrogen over.`,
            },
            {
              type: 'numeric',
              title: 'Grams of water',
              prompt: r`4 g of hydrogen ($\mathrm{H_2}$, 2 g/mol) burns in plenty of oxygen. How many grams of water form?`,
              unit: 'g',
              answer: 36,
              wrong: [{ v: 4, why: 'The water also contains the oxygen that combined with the hydrogen.' }, { v: 18, why: r`4 g of $\mathrm{H_2}$ is 2 mol, which makes 2 mol of water: $2 \times 18$ g.` }, { v: 72, why: r`The recipe gives one $\mathrm{H_2O}$ per $\mathrm{H_2}$, not two.` }],
              explain: r`Convert grams to moles, use the recipe, convert back: $4 \div 2 = 2$ mol $\mathrm{H_2}$ → 2 mol $\mathrm{H_2O}$ → $2 \times 18 = 36$ g. Always do the recipe step in moles, never in grams.`,
            },
            {
              type: 'numeric',
              title: 'Which runs out?',
              prompt: r`5 mol of $\mathrm{H_2}$ and 3 mol of $\mathrm{O_2}$ react. How many moles of water form?`,
              unit: 'mol',
              answer: 5,
              wrong: [{ v: 6, why: r`3 mol of $\mathrm{O_2}$ would need 6 mol of $\mathrm{H_2}$, but there are only 5. Hydrogen runs out first.` }, { v: 8, why: 'Reactants combine in a fixed ratio; you can’t just add the amounts.' }, { v: 3, why: r`Oxygen isn't the limit here: 5 mol of $\mathrm{H_2}$ uses only 2.5 mol of $\mathrm{O_2}$.` }],
              explain: r`5 mol of $\mathrm{H_2}$ needs only 2.5 mol of $\mathrm{O_2}$, which we have. So hydrogen is the **limiting reagent**: it makes 5 mol of water, and 0.5 mol of oxygen is left over.`,
            },
            {
              type: 'mcq',
              title: 'Grams can fool you',
              prompt: r`10 g of hydrogen and 10 g of oxygen are sparked. Which runs out first?`,
              choices: [
                { t: 'The oxygen', ok: true },
                { t: 'The hydrogen', why: r`10 g of $\mathrm{H_2}$ is 5 mol, a huge amount; 10 g of $\mathrm{O_2}$ is only 0.31 mol.` },
                { t: 'Neither: equal masses are used up together', why: 'The recipe is in moles, and equal masses of these two gases are very different numbers of molecules.' },
              ],
              explain: r`$10 \div 32 \approx 0.31$ mol of $\mathrm{O_2}$ can use up just $0.63$ mol of $\mathrm{H_2}$, leaving most of the 5 mol of hydrogen unreacted. Comparing masses directly is the classic mistake: always convert to moles first.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Percentage yield',
              prompt: r`Heating limestone, $\mathrm{CaCO_3 \to CaO + CO_2}$ (molar masses 100 and 56 g/mol), should turn 50 g of limestone into 28 g of quicklime, $\mathrm{CaO}$. A furnace produces 25.2 g. What percentage of the expected amount is that?`,
              unit: '%',
              answer: 90,
              wrong: [{ v: 50.4, tol: 0.1, why: 'Compare with the expected 28 g of quicklime, not with the 50 g of limestone.' }, { v: 10, why: 'That’s how far short it fell. The yield is the fraction obtained.' }],
              explain: r`50 g is 0.5 mol of $\mathrm{CaCO_3}$, which should give 0.5 mol of $\mathrm{CaO}$: $0.5 \times 56 = 28$ g. The **percentage yield** is $\frac{25.2}{28} = 90\%$. Real reactions fall short through incomplete reactions, side reactions and losses when collecting the product.`,
            },
          ],
          recap: [
            'Balanced equations are recipes in moles.',
            'Convert grams → moles, apply the ratio, convert back.',
            'The limiting reagent runs out first and fixes how much product forms.',
          ],
        },
      ],
    },
    {
      title: 'How Fast?',
      summary: 'Collisions, temperature and catalysts.',
      lessons: [
        {
          id: 'rates',
          title: 'Reaction Rates',
          summary: 'Collisions make reactions',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Molecules in a box',
              body: r`Molecules of {blue:A} and {coral:B} rush around a box. When an A hits a B hard enough, they react: $\mathrm{A + B \to C + D}$ (violet and teal). The graph tracks how many A are left. Change the **concentration**: how many pairs share the box.`,
              widget: { kind: 'reactor', params: { n: { min: 8, max: 40, step: 4, value: 24, label: 'pairs', color: 'blue' } } },
              after: r`Every time you change a setting, the last run stays on the graph as a dashed line for comparison. More crowded molecules collide more often, so the reaction starts faster. As the reactants are used up, collisions between A and B get rarer and the reaction slows: the curve flattens out.`,
            },
            {
              type: 'mcq',
              title: 'Why crowding helps',
              prompt: 'Why does a more concentrated solution usually react faster?',
              choices: [
                { t: 'Reactant molecules collide with each other more often', ok: true },
                { t: 'Each molecule moves faster', why: 'Speed depends on temperature, not concentration.' },
                { t: 'Each collision is more energetic', why: 'Collision energies also depend on temperature. Concentration changes how often molecules meet.' },
              ],
              explain: r`Doubling the concentration of A doubles the number of A molecules a B molecule can bump into per second, so the rate roughly doubles. This **collision theory** explains why powders burn faster than lumps (more surface, more collisions) and why stirring helps.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Rates and half-lives',
              body: r`The **rate** of a reaction is how fast the concentration changes. For many reactions in which one substance breaks down, the rate is proportional to how much is left, which gives exponential decay:
$$[A] = [A]_0\, e^{-kt}$$
where $k$ is the **rate constant**. Change $k$ and watch the half-life markers.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 1.05, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: '[A] / [A]₀', xticks: 10, yticks: 0.25 },
                params: { k: { min: 0.02, max: 0.3, step: 0.01, value: 0.07, label: '$k$', color: 'coral', format: (v) => `${fix(v, 2)} s⁻¹` } },
                curves: [{ f: (x, p) => Math.exp(-p.k * x), color: 'blue', width: 3 }],
                extra: ({ plot, p, s }) => {
                  const th = Math.LN2 / p.k, els = [];
                  for (let i = 1; i <= 4 && i * th <= 60; i++) {
                    els.push(s('line', { x1: plot.X(i * th), x2: plot.X(i * th), y1: plot.Y(0), y2: plot.Y(0.5 ** i), stroke: 'var(--violet)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
                    els.push(s('circle', { cx: plot.X(i * th), cy: plot.Y(0.5 ** i), r: 5, class: 'fl-violet' }));
                  }
                  return els;
                },
                readout: (p) => `half-life $t_{1/2} = \\ln 2 / k = ${fix(Math.LN2 / p.k, 1)}$ s`,
              },
              after: r`Each half-life halves what's left: after one, $\frac12$ remains; after two, $\frac14$; after three, $\frac18$. The half-life $t_{1/2} = \frac{\ln 2}{k}$ doesn't depend on how much you start with, exactly like radioactive decay.`,
            },
            {
              type: 'interactive',
              title: 'Set the half-life',
              prompt: r`Choose the rate constant $k$ so that the half-life is **10 seconds**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 60, ymin: 0, ymax: 1.05, grid: false, height: 280, axes: { xlabel: 'time (s)', ylabel: '[A] / [A]₀', xticks: 10, yticks: 0.25 },
                params: { k: { min: 0.02, max: 0.3, step: 0.005, value: 0.15, label: '$k$', color: 'coral', format: (v) => `${fix(v, 3)} s⁻¹` } },
                curves: [{ f: (x, p) => Math.exp(-p.k * x), color: 'blue', width: 3 }],
                points: [{ x: () => 10, y: () => 0.5, color: 'green', r: 8 }],
                readout: (p) => `$t_{1/2} = ${fix(Math.LN2 / p.k, 1)}$ s`,
                goal: (p) => Math.abs(Math.LN2 / p.k - 10) < 0.3,
                solution: { k: 0.07 },
                hint: 'Make the curve pass through the green point: half left after 10 s.',
              },
              explain: r`$k = \frac{\ln 2}{10} \approx 0.069\ \text{s}^{-1}$. A smaller rate constant means a longer half-life: the two are inversely proportional.`,
            },
            {
              type: 'numeric',
              title: 'Average rate',
              prompt: r`The concentration of a reactant falls from 0.80 mol/L to 0.50 mol/L in 15 s. What is the average rate of reaction over that time, in mol/L per second?`,
              answer: 0.02,
              tol: 0.0005,
              wrong: [{ v: 0.3, tol: 0.001, why: 'That’s the total change. Divide by the 15 seconds.' }, { v: 0.0333, tol: 0.001, why: r`$0.50 \div 15$ uses the final value. Rate uses the **change**: $0.30 \div 15$.` }],
              explain: r`$\frac{0.80 - 0.50}{15} = \frac{0.30}{15} = 0.02$ mol/L per second. That's an average: the rate is fastest at the start (when there's most reactant) and slows as the reactant runs down.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Fading bleach',
              prompt: r`A solution of hydrogen peroxide (a bleach) breaks down with a half-life of about 6 months on the shelf. What fraction of the original is left after 2 years?`,
              answer: 1 / 16,
              tol: 0.002,
              wrong: [{ v: 0.25, why: '2 years is 4 half-lives of 6 months, not 2.' }, { v: 0.125, why: 'Count the half-lives: 24 months ÷ 6 = 4, so the fraction is (1/2)⁴.' }],
              explain: r`2 years is $24 \div 6 = 4$ half-lives: $\left(\frac12\right)^4 = \frac{1}{16} \approx 0.06$. That's why old bottles of peroxide barely fizz on a cut: there's almost none left.`,
            },
          ],
          recap: [
            'Reactions happen through collisions; more concentration means more collisions.',
            'Many reactions decay exponentially: [A] = [A]₀e^(−kt).',
            'Half-life = ln 2 / k, independent of the starting amount.',
          ],
        },
        {
          id: 'heat',
          title: 'Heat It Up',
          summary: 'Activation energy and temperature',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hard enough to react',
              body: r`Most collisions don't cause a reaction: the molecules just bounce off. To react, they must collide hard enough to start breaking bonds. The minimum energy needed is the **activation energy**, $E_a$. In the box, change the temperature and the activation energy.`,
              widget: {
                kind: 'reactor',
                params: {
                  T: { min: 200, max: 500, step: 25, value: 300, label: 'temperature', color: 'coral', format: (v) => `${v} K` },
                  Ea: { min: 30, max: 70, step: 5, value: 50, label: '$E_a$', color: 'violet', format: (v) => `${v} kJ/mol` },
                },
              },
              after: r`Heating does two things: molecules collide more often (they move faster), and, much more importantly, a larger share of collisions carry enough energy to beat $E_a$. Raising $E_a$ makes successful collisions rarer. (The energies in this box are scaled up so you can see it happen in seconds.)`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The energetic few',
              body: r`At any temperature, molecules share a spread of energies. The curve shows that spread, and the shaded tail beyond $E_a$ is the fraction with enough energy to react.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 25, ymin: 0, ymax: 0.42, grid: false, height: 300, axes: { xlabel: 'energy (kJ/mol)', ylabel: 'share of molecules', xticks: 5, yticks: 0.1, yfmt: () => '' },
                params: { T: { min: 200, max: 600, step: 10, value: 300, label: 'temperature', color: 'coral', format: (v) => `${v} K` } },
                under: ({ plot, p, s }) => {
                  let d = `M${plot.X(12)} ${plot.Y(0)}`;
                  for (let E = 12; E <= 25; E += 0.25) d += `L${plot.X(E).toFixed(1)} ${plot.Y(mb(E, p.T)).toFixed(1)}`;
                  return [s('path', { d: d + `L${plot.X(25)} ${plot.Y(0)}Z`, class: 'fl-coral', opacity: 0.45 })];
                },
                curves: [{ f: (x, p) => mb(Math.max(x, 1e-6), p.T), color: 'blue', width: 3, n: 300 }],
                extra: ({ plot, s }) => [s('line', { x1: plot.X(12), x2: plot.X(12), y1: plot.Y(0), y2: plot.Y(0.4), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }), s('text', { x: plot.X(12) + 6, y: plot.Y(0.37), class: 'lbl halo-text', style: `fill:var(--violet);${FS(15)}`, text: 'Eₐ' })],
                readout: (p) => `fraction above $E_a$: **${fix(100 * above(12, p.T), 1)}%** (${fix(above(12, p.T) / above(12, 300), 2)}× the value at 300 K)`,
              },
              after: r`As the temperature rises, the hump spreads to higher energies and the tail beyond $E_a$ fattens **much faster** than the temperature itself grows. For typical reactions, with $E_a$ around 50 kJ/mol, the fraction roughly **doubles for every 10 °C** near room temperature.`,
            },
            {
              type: 'numeric',
              title: 'From 20 °C to 40 °C',
              prompt: r`The **Arrhenius equation** says a rate constant changes with temperature as $k \propto e^{-E_a/RT}$, so $\dfrac{k_2}{k_1} = e^{\frac{E_a}{R}\left(\frac{1}{T_1} - \frac{1}{T_2}\right)}$. For $E_a = 50$ kJ/mol, by what factor does the rate rise from 20 °C (293 K) to 40 °C (313 K)? ($R = 8.314$ J/(mol·K); 1 decimal place.)`,
              answer: arr(50, 293, 313),
              tol: 0.06,
              wrong: [{ v: 2, why: 'That’s for 10 degrees. Twenty degrees is two doublings, roughly.' }, { v: 1.07, tol: 0.02, why: 'That’s the ratio of the temperatures. The exponential makes the rate far more sensitive.' }],
              hint: r`Work in joules: $E_a = 50{,}000$ J/mol. $\frac{1}{293} - \frac{1}{313} \approx 0.000218$.`,
              explain: r`$\frac{50{,}000}{8.314} \times (0.003413 - 0.003195) \approx 6014 \times 0.000218 \approx 1.31$, and $e^{1.31} \approx 3.7$. A 7% rise in absolute temperature makes the reaction almost four times faster.`,
            },
            {
              type: 'interactive',
              title: 'Ten times faster',
              prompt: r`A reaction has $E_a = 60$ kJ/mol. Find the temperature at which it runs **10 times faster** than at 300 K.`,
              widget: {
                kind: 'graph', xmin: 280, xmax: 380, ymin: 0, ymax: 40, grid: false, height: 300, axes: { xlabel: 'temperature (K)', ylabel: 'rate ÷ rate at 300 K', xticks: 20, yticks: 10, xAt: 280, yAt: 0 },
                params: { T: { min: 280, max: 380, step: 1, value: 310, label: 'temperature', color: 'coral', format: (v) => `${v} K` } },
                curves: [{ f: (x) => arr(60, 300, x), color: 'blue', width: 3 }, { f: () => 10, color: 'muted', dash: true }],
                points: [{ x: (p) => p.T, y: (p) => arr(60, 300, p.T), color: 'coral' }],
                readout: (p) => `at ${p.T} K the rate is **${fix(arr(60, 300, p.T), 2)}×** faster`,
                goal: (p) => Math.abs(arr(60, 300, p.T) - 10) < 0.35,
                solution: { T: 332 },
                hint: 'Slide until the point meets the dashed line at 10.',
              },
              explain: r`About **332 K** (59 °C): a rise of just 32 degrees makes the reaction ten times faster. Solving exactly: $\frac{1}{T} = \frac{1}{300} - \frac{R\ln 10}{E_a}$. The rate climbs exponentially, which is why cooking times shorten so much at higher temperatures.`,
            },
            {
              type: 'numeric',
              title: 'Why fridges work',
              prompt: r`Suppose food spoils at a rate that halves for every 10 °C of cooling. About how many times longer does food last in a fridge at 4 °C than in a room at 20 °C? (1 decimal place.)`,
              answer: 2 ** 1.6,
              tol: 0.06,
              wrong: [{ v: 3.2, tol: 0.05, why: 'A 16-degree drop is 1.6 halvings, not 3.2: the factor is 2^1.6.' }, { v: 5, why: 'That treats 20 ÷ 4 as the factor. Temperature differences act through powers of 2.' }],
              explain: r`A 16 °C drop is $1.6$ halvings: the rate falls by $2^{1.6} \approx 3.0$, so food lasts about **3 times** longer. By the same rule, a freezer at $-18$ °C would add another $2.2$ halvings (about 5 times slower again), and in reality freezing does even better, because ice stops most microbes growing at all.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Striking a match',
              prompt: 'A match won’t burst into flame by itself, though burning releases lots of energy. Why does striking it work?',
              choices: [
                { t: 'Friction heats a small spot past the activation energy; the burning then releases enough heat to keep itself going', ok: true },
                { t: 'Striking adds oxygen to the match head', why: 'The oxygen is already in the air (and in chemicals in the head). It needs an energy kick to start reacting.' },
                { t: 'Friction lowers the activation energy', why: 'Friction supplies energy; it doesn’t change the barrier itself. (Changing the barrier is what catalysts do, next lesson.)' },
              ],
              explain: r`Burning has a high activation energy, so at room temperature almost no collisions succeed and the match sits safely in its box. Striking heats a tiny region enough to start reacting; the heat released then lifts neighbouring molecules over the barrier, and the reaction spreads on its own: a **chain** of self-heating.`,
            },
          ],
          recap: [
            'Only collisions with energy above Eₐ react.',
            'Heating fattens the high-energy tail: rates rise exponentially (Arrhenius).',
            'Near room temperature, rates often double for each 10 °C.',
          ],
        },
        {
          id: 'catalysts',
          title: 'Catalysts',
          summary: 'A lower hill to climb',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'An energy hill',
              body: r`An **energy profile** follows a reaction from reactants (left) to products (right). The hill in between is the activation energy $E_a$: the high-energy, half-broken arrangement at the top is the **transition state**. The overall drop or rise is the energy released or absorbed, $\Delta H$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -70, ymax: 110, grid: false, height: 320, axes: { ylabel: 'energy (kJ/mol)', yticks: 25, xticks: 0, xAt: 0, yAt: -70 },
                params: {
                  Ea: { min: 45, max: 100, step: 5, value: 70, label: '$E_a$', color: 'violet', format: (v) => `${v} kJ/mol` },
                  dH: { min: -60, max: 40, step: 5, value: -40, label: '$\\Delta H$', color: 'coral', format: (v) => `${v} kJ/mol` },
                },
                curves: [{ f: (x, p) => profile(x, p.Ea, p.dH), color: 'blue', width: 3.5 }, { f: () => 0, color: 'muted', dash: true, from: 0, to: 4 }],
                extra: ({ plot, p, s }) => [
                  s('text', { x: plot.X(0.3), y: plot.Y(0) - 10, class: 'lbl halo-text', style: FS(14), text: 'reactants' }),
                  s('text', { x: plot.X(9.7), y: plot.Y(p.dH) - 10, 'text-anchor': 'end', class: 'lbl halo-text', style: FS(14), text: 'products' }),
                ],
                readout: (p) => `$E_a = ${p.Ea}$ kJ/mol · $\\Delta H = ${p.dH}$ kJ/mol: **${p.dH < 0 ? 'exothermic (gives out heat)' : p.dH > 0 ? 'endothermic (takes in heat)' : 'thermoneutral'}**`,
              },
              after: r`Burning fuel is **exothermic** ($\Delta H < 0$): the products sit lower, and the difference comes out as heat. Cold packs use **endothermic** reactions, which absorb heat. Either way, the height of the hill, not the depth of the valley, sets how fast the reaction goes.`,
            },
            {
              type: 'explain',
              title: 'Catalysts',
              body: r`A **catalyst** speeds up a reaction without being used up. It offers a different route, often by holding reactant molecules on its surface in just the right position, with a **lower hill**. Since the rate depends exponentially on $E_a$, even a modest drop has an enormous effect.

A catalyst doesn't change the starting or ending energies, so it doesn't change $\Delta H$ or how much product you can eventually get; it just gets there faster (and speeds up the reverse reaction equally).`,
            },
            {
              type: 'interactive',
              title: 'A thousand times faster',
              prompt: r`Without a catalyst, $E_a = 80$ kJ/mol. Design a catalyst that makes the reaction at least **1000 times faster** at 300 K by lowering the hill as little as possible.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: -70, ymax: 100, grid: false, height: 300, axes: { ylabel: 'energy (kJ/mol)', yticks: 25, xticks: 0, xAt: 0, yAt: -70 },
                params: { Ea: { min: 40, max: 80, step: 1, value: 75, label: 'catalysed $E_a$', color: 'violet', format: (v) => `${v} kJ/mol` } },
                curves: [{ f: (x) => profile(x, 80, -40), color: 'muted', width: 2.5, dash: true }, { f: (x, p) => profile(x, p.Ea, -40), color: 'blue', width: 3.5 }],
                readout: (p) => `hill lowered by ${80 - p.Ea} kJ/mol: the reaction runs about **${fix(Math.exp(((80 - p.Ea) * 1000) / (R_GAS * 300)), 0)}×** faster at 300 K`,
                goal: (p) => (Math.exp(((80 - p.Ea) * 1000) / (R_GAS * 300)) >= 1000 ? (p.Ea === 62 ? true : { ok: false, msg: 'That’s fast enough, but you’ve lowered the hill more than necessary. Find the smallest drop that still gives 1000×.' }) : { ok: false, msg: 'Not fast enough yet: lower the hill further.' }),
                solution: { Ea: 62 },
              },
              explain: r`Lowering $E_a$ by $\Delta$ multiplies the rate by $e^{\Delta/RT}$. For 1000×: $\Delta = RT\ln 1000 = 8.314 \times 300 \times 6.91 \approx 17.2$ kJ/mol, so $E_a$ must drop to about 62 kJ/mol. A drop of just 22% in the barrier gives a thousandfold speed-up.`,
            },
            {
              type: 'mcq',
              title: 'What a catalyst can’t do',
              prompt: 'A catalyst is added to a reaction. Which of these does it change?',
              choices: [
                { t: 'How fast the reaction reaches its end point', ok: true },
                { t: 'How much heat the reaction gives out overall', why: 'The reactants and products have the same energies with or without the catalyst, so ΔH is unchanged.' },
                { t: 'How much product there is once everything has settled', why: 'A catalyst speeds up the forward and backward reactions equally, so the final balance is the same, only reached sooner.' },
              ],
              explain: r`Only the route, and so the speed, changes. Catalysts are everywhere: the platinum and rhodium in a car's **catalytic converter** turn poisonous carbon monoxide and nitrogen oxides into harmless gases in the fraction of a second the exhaust spends inside, and iron catalysts make the ammonia in fertilisers.`,
            },
            {
              type: 'numeric',
              title: 'Enzymes',
              prompt: r`Enzymes are the body's catalysts. Suppose an enzyme lowers a reaction's activation energy by 34 kJ/mol at body temperature (310 K). By roughly what factor does it speed the reaction up? (Answer like 5e5.)`,
              answer: Math.exp(34000 / (R_GAS * 310)),
              relTol: 0.06,
              wrong: [{ v: 34, why: r`The speed-up is exponential: $e^{\Delta E_a / RT}$.` }, { v: 13.2, tol: 0.2, why: r`That's the exponent $\frac{34{,}000}{8.314 \times 310}$. Now take $e$ to that power.` }],
              explain: r`$\frac{34{,}000}{8.314 \times 310} \approx 13.2$, and $e^{13.2} \approx 5 \times 10^5$: half a million times faster. Real enzymes do even better, some speeding reactions up by factors of $10^{10}$ or more, which is what makes life's chemistry fast enough at body temperature.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Going backwards',
              prompt: r`A reaction is **endothermic**: its products sit 30 kJ/mol **above** its reactants, and the forward activation energy is 90 kJ/mol. What is the activation energy of the **reverse** reaction (products back to reactants)?`,
              unit: 'kJ/mol',
              answer: 60,
              wrong: [{ v: 120, why: 'The products start higher, so their climb to the top of the hill is shorter, not longer.' }, { v: 90, why: 'The hill is the same, but the reverse reaction starts from the products’ level, 30 kJ/mol higher.' }],
              explain: r`The top of the hill is $90$ kJ/mol above the reactants, and the products start $30$ above the reactants, so they climb only $90 - 30 = 60$ kJ/mol. Forward and reverse barriers always differ by $\Delta H$: $E_{a,\text{forward}} - E_{a,\text{reverse}} = \Delta H$.`,
            },
          ],
          recap: [
            'Energy profiles: reactants, a hill (Eₐ) at the transition state, products (ΔH).',
            'Catalysts provide a lower hill; rates rise by e^(ΔEₐ/RT).',
            'Catalysts don’t change ΔH or the final balance, only the speed.',
          ],
        },
      ],
    },
    {
      title: 'Balance',
      summary: 'Equilibrium, acids and bases.',
      lessons: [
        {
          id: 'equilibrium',
          title: 'Equilibrium',
          summary: 'Reactions that go both ways',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Forwards and backwards',
              body: r`Many reactions can run in both directions: $\mathrm{A \rightleftharpoons B}$. A turns into B at a rate $k_f[\mathrm{A}]$, and B turns back into A at a rate $k_b[\mathrm{B}]$. Start with pure A and change the two rate constants.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 1.05, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: 'fraction', xticks: 10, yticks: 0.25 },
                params: {
                  kf: { min: 0.02, max: 0.4, step: 0.02, value: 0.2, label: '$k_f$', color: 'blue', format: (v) => fix(v, 2) },
                  kb: { min: 0.02, max: 0.4, step: 0.02, value: 0.1, label: '$k_b$', color: 'coral', format: (v) => fix(v, 2) },
                },
                curves: [{ f: (x, p) => eqAB(x, p.kf, p.kb)[0], color: 'blue', width: 3 }, { f: (x, p) => eqAB(x, p.kf, p.kb)[1], color: 'coral', width: 3 }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(1), y: plot.Y(0.93), class: 'lbl halo-text', style: `fill:var(--blue);${FS(14)}`, text: 'A' }), s('text', { x: plot.X(1), y: plot.Y(0.1), class: 'lbl halo-text', style: `fill:var(--coral);${FS(14)}`, text: 'B' })],
                readout: (p) => `at equilibrium: A **${fix((100 * p.kb) / (p.kf + p.kb), 0)}%**, B **${fix((100 * p.kf) / (p.kf + p.kb), 0)}%** · $K = k_f / k_b = ${fix(p.kf / p.kb, 2)}$`,
              },
              after: r`At first B forms quickly. But as B builds up, the backward reaction speeds up, until the two rates are equal: $k_f[\mathrm A] = k_b[\mathrm B]$. Then nothing seems to change, although molecules keep reacting both ways. This is **dynamic equilibrium**, and the ratio $K = \frac{[\mathrm B]}{[\mathrm A]} = \frac{k_f}{k_b}$ is the **equilibrium constant**.`,
            },
            {
              type: 'interactive',
              title: 'Three quarters B',
              prompt: r`With $k_f = 0.3$, choose $k_b$ so that at equilibrium **75%** of the material is B.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 1.05, grid: false, height: 280, axes: { xlabel: 'time (s)', ylabel: 'fraction', xticks: 10, yticks: 0.25 },
                params: { kb: { min: 0.02, max: 0.4, step: 0.02, value: 0.3, label: '$k_b$', color: 'coral', format: (v) => fix(v, 2) } },
                curves: [{ f: (x, p) => eqAB(x, 0.3, p.kb)[0], color: 'blue', width: 3 }, { f: (x, p) => eqAB(x, 0.3, p.kb)[1], color: 'coral', width: 3 }, { f: () => 0.75, color: 'muted', dash: true }],
                readout: (p) => `B at equilibrium: **${fix((100 * 0.3) / (0.3 + p.kb), 1)}%**`,
                goal: (p) => Math.abs(0.3 / (0.3 + p.kb) - 0.75) < 1e-6,
                solution: { kb: 0.1 },
                hint: r`75% B and 25% A means $K = 3$, so $k_b = k_f / 3$.`,
              },
              explain: r`$\frac{[\mathrm B]}{[\mathrm A]} = \frac{75}{25} = 3 = \frac{k_f}{k_b}$, so $k_b = 0.1$. Notice the curves also settle faster when both rate constants are larger: the speed of approach depends on $k_f + k_b$, the balance on their ratio.`,
            },
            {
              type: 'numeric',
              title: 'An equilibrium constant',
              prompt: r`At equilibrium a mixture contains $[\mathrm B] = 0.60$ mol/L and $[\mathrm A] = 0.20$ mol/L, for $\mathrm{A \rightleftharpoons B}$. What is $K$?`,
              answer: 3,
              wrong: [{ v: 0.333, tol: 0.002, why: r`$K$ puts the product on top: $\frac{[\mathrm B]}{[\mathrm A]}$.` }, { v: 0.4, tol: 0.001, why: 'K is a ratio, not a difference.' }],
              explain: r`$K = \frac{0.60}{0.20} = 3$. A large $K$ means the products are favoured; a small one, the reactants.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Disturbing the balance',
              body: r`At $t = 20$ s, extra A is suddenly added. Watch how the mixture responds.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 1.6, grid: false, height: 300, axes: { xlabel: 'time (s)', ylabel: 'amount', xticks: 10, yticks: 0.5 },
                params: { add: { min: 0, max: 0.8, step: 0.1, value: 0.5, label: 'A added', color: 'blue', format: (v) => fix(v, 1) } },
                curves: [{ f: (x, p) => eqAB(x, 0.2, 0.1, p.add)[0], color: 'blue', width: 3, n: 400 }, { f: (x, p) => eqAB(x, 0.2, 0.1, p.add)[1], color: 'coral', width: 3, n: 400 }],
                readout: (p) => `new equilibrium: A ${fix(eqAB(50, 0.2, 0.1, p.add)[0], 2)}, B ${fix(eqAB(50, 0.2, 0.1, p.add)[1], 2)} (before: A 0.33, B 0.67)`,
              },
              after: r`The extra A makes the forward reaction faster than the backward one, so some of the added A turns into B, until the ratio is back to $K = 2$. This is **Le Chatelier's principle**: a system at equilibrium shifts to partly undo a disturbance.`,
            },
            {
              type: 'mcq',
              title: 'Removing the product',
              prompt: r`In an equilibrium $\mathrm{A \rightleftharpoons B}$, a chemist keeps removing B as it forms. What happens?`,
              choices: [
                { t: 'More A keeps turning into B, so the reaction can run almost to completion', ok: true },
                { t: 'The reaction stops, because the equilibrium is upset', why: 'Upsetting the equilibrium makes the system shift to restore it: here, by making more B.' },
                { t: 'B starts turning back into A faster', why: 'With less B present, the backward reaction slows down, not speeds up.' },
              ],
              explain: r`Removing B slows the backward reaction, so the forward one wins, and the system keeps trying to rebuild B. Industry uses this trick constantly: draw off the product (by boiling it away or letting a gas escape) and a reaction with an unfavourable $K$ still gives a good yield.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Squeezing ammonia',
              prompt: r`Fertilisers are made from ammonia by the Haber process: $\mathrm{N_2 + 3H_2 \rightleftharpoons 2NH_3}$, all gases. Raising the pressure gives more ammonia. Why?`,
              choices: [
                { t: 'The forward reaction turns 4 gas molecules into 2, which partly relieves the extra pressure', ok: true },
                { t: 'Pressure lowers the activation energy', why: 'Pressure changes how crowded the molecules are, not the height of the energy hill.' },
                { t: 'Ammonia molecules are heavier', why: 'Mass doesn’t matter here. What matters is the number of gas molecules on each side.' },
              ],
              explain: r`Fewer gas molecules exert less pressure, so the equilibrium shifts towards the side with fewer molecules: from $1 + 3 = 4$ on the left to $2$ on the right. Haber plants run at around 200 times atmospheric pressure, with an iron catalyst to make it fast. About half the nitrogen atoms in your body passed through this reaction.`,
            },
          ],
          recap: [
            'Reversible reactions settle where forward and backward rates are equal.',
            'K = [products]/[reactants] = k_f/k_b at equilibrium.',
            'Le Chatelier: an equilibrium shifts to partly undo a disturbance.',
          ],
        },
        {
          id: 'ph',
          title: 'Acids, Bases & pH',
          summary: 'A logarithmic scale',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Counting hydrogen ions',
              body: r`Acids release hydrogen ions, $\mathrm{H^+}$, into water; bases soak them up. The concentration of $\mathrm{H^+}$ ranges over a huge span, from about 1 mol/L in strong acid to $10^{-14}$ mol/L in strong alkali, so chemists use a logarithmic scale:
$$\mathrm{pH} = -\log_{10}[\mathrm{H^+}]$$
Pure water has $[\mathrm{H^+}] = 10^{-7}$ mol/L: pH 7, **neutral**. Lower pH means more acidic (lemon juice is about 2); higher means more alkaline (soap is about 10).`,
            },
            {
              type: 'numeric',
              title: 'From concentration to pH',
              prompt: r`A solution has $[\mathrm{H^+}] = 0.001$ mol/L. What is its pH?`,
              answer: 3,
              wrong: [{ v: -3, why: r`The minus sign in the definition makes pH positive: $-\log_{10}(10^{-3}) = 3$.` }, { v: 0.001, why: 'Take the negative logarithm of the concentration.' }],
              explain: r`$0.001 = 10^{-3}$, so $\mathrm{pH} = -(-3) = 3$. Each step down the pH scale means ten times more $\mathrm{H^+}$.`,
            },
            {
              type: 'numeric',
              title: 'How much more acidic?',
              prompt: r`How many times more $\mathrm{H^+}$ does a solution of pH 3 have than one of pH 6?`,
              answer: 1000,
              wrong: [{ v: 2, why: 'pH is logarithmic: each unit is a factor of 10, so 3 units is 10 × 10 × 10.' }, { v: 3, why: 'Each pH unit multiplies the concentration by 10.' }],
              explain: r`3 pH units = $10^3 = 1000$ times more $\mathrm{H^+}$. Like decibels and earthquake magnitudes, pH turns multiplication into addition.`,
            },
            {
              type: 'interactive',
              title: 'Dilute it',
              prompt: r`You have 10 mL of a strong acid at pH 1. How much water must you add to raise the pH to **3**?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 14, grid: false, height: 220, axes: false,
                params: { w: { min: 0, max: 2000, step: 10, value: 90, label: 'water added', color: 'blue', format: (v) => `${v} mL` } },
                extra: ({ plot, p, s }) => {
                  const ph = 1 + Math.log10((10 + p.w) / 10);
                  const els = [];
                  for (let i = 0; i <= 14; i++) {
                    const hue = i < 7 ? `rgb(${230},${70 + i * 25},${60})` : i === 7 ? 'rgb(90,190,90)' : `rgb(${60},${120 + (14 - i) * 10},${150 + (i - 7) * 14})`;
                    els.push(s('rect', { x: plot.X(0.3 + i * (9.4 / 15)), y: plot.Y(9), width: plot.X(9.4 / 15) - plot.X(0) - 2, height: plot.Y(5) - plot.Y(9), fill: hue, rx: 3 }));
                    els.push(s('text', { x: plot.X(0.3 + (i + 0.5) * (9.4 / 15)), y: plot.Y(3.2), 'text-anchor': 'middle', class: 'tick', text: String(i) }));
                  }
                  const xm = plot.X(0.3 + (ph + 0.5) * (9.4 / 15));
                  els.push(s('path', { d: `M${xm} ${plot.Y(9.4)} l-9 -16 h18 Z`, class: 'fl-ink' }));
                  return els;
                },
                readout: (p) => `total volume ${10 + p.w} mL: the acid is diluted ${fix((10 + p.w) / 10, 0)}× · **pH ${fix(1 + Math.log10((10 + p.w) / 10), 2)}**`,
                goal: (p) => Math.abs(1 + Math.log10((10 + p.w) / 10) - 3) < 0.02,
                solution: { w: 990 },
                hint: 'Raising the pH by 2 means making the H⁺ a hundred times more dilute.',
              },
              explain: r`Going from pH 1 to pH 3 needs the $\mathrm{H^+}$ concentration cut by $10^2 = 100$, so the total volume must become $100 \times 10 = 1000$ mL: add **990 mL** of water. To raise it to pH 5 you'd need 100 litres!`,
            },
            {
              type: 'mcq',
              title: 'Diluting forever',
              prompt: 'A drop of acid at pH 5 is diluted a million times. What is the pH of the result?',
              choices: [
                { t: 'Just under 7', ok: true },
                { t: '11', why: r`Diluting an acid can never make it alkaline. Water itself provides $10^{-7}$ mol/L of $\mathrm{H^+}$, which takes over.` },
                { t: '5', why: 'Diluting lowers the concentration of H⁺, so the pH rises.' },
              ],
              explain: r`The acid's own $\mathrm{H^+}$ would fall to $10^{-11}$ mol/L, far below the $10^{-7}$ mol/L that water's own molecules supply by splitting into $\mathrm{H^+}$ and $\mathrm{OH^-}$. So the pH approaches 7 from below and stops. A formula used outside the range where its assumptions hold gives nonsense like "pH 11".`,
            },
            {
              type: 'interactive',
              title: 'A titration',
              prompt: r`25 mL of 0.1 mol/L hydrochloric acid is slowly neutralised with 0.1 mol/L sodium hydroxide. Find the volume of alkali at the **equivalence point**, where acid and base exactly cancel (pH 7).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 14, grid: false, height: 320, axes: { xlabel: 'NaOH added (mL)', ylabel: 'pH', xticks: 10, yticks: 2 },
                params: { V: { min: 0, max: 50, step: 0.5, value: 15, label: 'NaOH added', color: 'blue', format: (v) => `${fix(v, 1)} mL` } },
                curves: [{ f: (x) => titrationPH(x), color: 'violet', width: 3, n: 600 }, { f: () => 7, color: 'muted', dash: true }],
                points: [{ x: (p) => p.V, y: (p) => titrationPH(p.V), color: 'coral' }],
                readout: (p) => `after ${fix(p.V, 1)} mL: **pH ${fix(titrationPH(p.V), 2)}**`,
                goal: (p) => Math.abs(p.V - 25) < 1e-6,
                solution: { V: 25 },
                hint: 'Look for the middle of the steep jump.',
              },
              explain: r`25 mL of 0.1 mol/L acid contains 0.0025 mol of $\mathrm{H^+}$; the same volume of 0.1 mol/L alkali supplies 0.0025 mol of $\mathrm{OH^-}$, and $\mathrm{H^+ + OH^- \to H_2O}$ cancels them exactly. The pH barely moves for most of the titration, then leaps from about 3 to 11 within a fraction of a millilitre either side of the equivalence point. That leap is what an indicator's colour change detects.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Stronger alkali',
              prompt: r`The same 25 mL of 0.1 mol/L acid is titrated with **0.2** mol/L sodium hydroxide instead. How many mL are needed to reach the equivalence point?`,
              unit: 'mL',
              answer: 12.5,
              wrong: [{ v: 50, why: 'A more concentrated alkali needs less volume, not more.' }, { v: 25, why: 'Each millilitre now carries twice as much hydroxide.' }],
              explain: r`The acid has $0.1 \times 0.025 = 0.0025$ mol of $\mathrm{H^+}$. At 0.2 mol/L, the alkali supplies that in $\frac{0.0025}{0.2} = 0.0125$ L $= 12.5$ mL. Titrations are how chemists measure unknown concentrations: the volume at the jump reveals how much acid was there.`,
            },
          ],
          recap: [
            'pH = −log₁₀[H⁺]; 7 is neutral, lower is acidic, higher is alkaline.',
            'Each pH unit is a factor of 10 in H⁺ concentration.',
            'At the equivalence point of a titration, acid and base cancel exactly.',
          ],
        },
      ],
    },
  ],
};
