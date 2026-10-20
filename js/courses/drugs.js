import { fix, sig } from '../lib/svg.js';
import { r, FS, pick, bars } from './_chem.js';

const RT = (8.314 * 310) / 1000; // kJ/mol at body temperature

// ---------- a binding pocket with three sites; the drug has three positions to decorate ----------
const GROUPS = ['H', 'OH', 'CH₃', 'Cl', 'NH₃⁺', 'COO⁻'];
// contribution of each group (kJ/mol) at site A (H-bond acceptor), B (oily pocket), C (positive lysine)
const SCORE = [
  { H: 0, OH: -12, 'CH₃': 0, Cl: 2, 'NH₃⁺': -10, 'COO⁻': 6 },
  { H: 0, OH: 4, 'CH₃': -8, Cl: -10, 'NH₃⁺': 12, 'COO⁻': 12 },
  { H: 0, OH: -4, 'CH₃': 2, Cl: 0, 'NH₃⁺': 15, 'COO⁻': -18 },
];
const SITE = [['H-bond acceptor', 'var(--coral)', 'C=O'], ['oily pocket', 'var(--amber)', ''], ['positive charge', 'var(--blue)', '+']];
const dG = (p) => -12 + SCORE[0][GROUPS[p.a]] + SCORE[1][GROUPS[p.b]] + SCORE[2][GROUPS[p.c]];
const kd = (g) => Math.exp((g * 1) / RT); // mol/L
const kdText = (K) => (K < 1e-6 ? `${sig(K * 1e9, 2)} nM` : K < 1e-3 ? `${sig(K * 1e6, 2)} µM` : `${sig(K * 1e3, 2)} mM`);
function pocket({ goal, solution, a = 0, b = 0, c = 0 } = {}) {
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 300, stackSliders: true,
    params: {
      a: { min: 0, max: 5, step: 1, value: a, label: 'Position 1', color: 'coral', format: (v) => GROUPS[v] },
      b: { min: 0, max: 5, step: 1, value: b, label: 'Position 2', color: 'amber', format: (v) => GROUPS[v] },
      c: { min: 0, max: 5, step: 1, value: c, label: 'Position 3', color: 'blue', format: (v) => GROUPS[v] },
    },
    extra: ({ plot, p, s }) => {
      const out = [];
      // the pocket: a U-shaped protein wall with three coloured sites
      out.push(s('path', { d: `M${plot.X(1)} ${plot.Y(5.6)}V${plot.Y(0.6)}H${plot.X(9)}V${plot.Y(5.6)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 26, 'stroke-linejoin': 'round', 'stroke-opacity': 0.35 }));
      const sites = [[1, 4.2], [5, 0.6], [9, 4.2]];
      sites.forEach(([x, y], k) => {
        out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 20, style: `fill:${SITE[k][1]}`, 'fill-opacity': 0.85 }));
        if (SITE[k][2]) out.push(s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', style: `fill:#fff;font-weight:700;${FS(13)}`, text: SITE[k][2] }));
      });
      // the drug: a ring with three arms
      const cx = plot.X(5), cy = plot.Y(3.4), R = 34;
      out.push(s('path', { d: Array.from({ length: 6 }, (_, k) => `${k ? 'L' : 'M'}${cx + R * Math.cos((k * Math.PI) / 3)} ${cy + R * Math.sin((k * Math.PI) / 3)}`).join('') + 'Z', fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 3.5 }));
      const arms = [[2.3, 4.0], [5, 1.8], [7.7, 4.0]];
      ['a', 'b', 'c'].forEach((k, i) => {
        const [x, y] = arms[i], g = GROUPS[p[k]], sc = SCORE[i][g];
        out.push(s('line', { x1: cx, y1: cy, x2: plot.X(x), y2: plot.Y(y), stroke: 'var(--ink)', 'stroke-width': 3.5 }));
        out.push(s('rect', { x: plot.X(x) - 30, y: plot.Y(y) - 16, width: 60, height: 32, rx: 16, fill: sc < 0 ? 'var(--success-tint)' : sc > 0 ? 'var(--error-tint)' : 'var(--card)', stroke: sc < 0 ? 'var(--success)' : sc > 0 ? 'var(--error)' : 'var(--line-2)', 'stroke-width': 2 }));
        out.push(s('text', { x: plot.X(x), y: plot.Y(y) + 6, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: g }));
      });
      return out;
    },
    readout: (p) => { const g = dG(p); return `binding energy ΔG = **${fix(g, 0)} kJ/mol** · Kd ≈ ${kdText(kd(g))}`; },
    goal, solution,
  };
}

// ---------- receptor occupancy and dose-response ----------
const occ = (L, Kd) => L / (L + Kd);
const hill = (dose, ec50, n = 1, top = 100) => top / (1 + (ec50 / dose) ** n);

// ---------- repeated dosing: one compartment, IV bolus ----------
const HALF = 6, VOL = 40; // hours, litres
function conc(t, D, tau) {
  const k = Math.LN2 / HALF;
  let c = 0;
  for (let t0 = 0; t0 <= t + 1e-9; t0 += tau) c += (D / VOL) * Math.exp(-k * (t - t0));
  return c;
}
function inWindow(D, tau) {
  for (let t = 24; t <= 72; t += 0.25) { const c = conc(t, D, tau); if (c < 5 || c > 15) return false; }
  return true;
}

export default {
  id: 'drugs',
  subject: 'physics',
  title: 'Drug Design',
  level: 'Advanced',
  cover: 'drugs',
  tagline: 'How medicines are made: binding pockets, affinity, dose curves, getting into the body and dosing schedules.',
  description: r`A medicine is a molecule shaped to fit a particular protein, strongly enough to change what it does, and then it has to survive the journey through the body. Decorate a drug to fit a binding pocket, turn binding energies into dissociation constants, read dose–response curves, use Lipinski's rules to judge whether a pill can be absorbed, design a dosing schedule that keeps a drug in its therapeutic window, and follow the long odds from a hit in the lab to a medicine on the shelf.`,
  prereq: 'Molecules of Life, and Acids, Bases & Buffers',
  chapters: [
    {
      title: 'Finding a Fit',
      summary: 'Binding and affinity.',
      lessons: [
        {
          id: 'binding',
          title: 'Lock and Key',
          summary: 'Matching a pocket',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A pocket on a protein',
              body: r`Most drugs work by binding to a protein (an enzyme, a receptor, an ion channel) and changing its behaviour. The protein has a **binding pocket** lined with chemical features: places that can accept a hydrogen bond, oily patches, charged groups. A good drug presents the complementary feature at each spot: an H-bond donor opposite an acceptor, something oily in the oily patch, an opposite charge facing a charge.

Each good match lowers the **binding free energy** $\Delta G$; each clash raises it. Colours on the drug show whether each group helps (green) or hurts (red).`,
              widget: pocket({ a: 2, b: 1, c: 0 }),
            },
            {
              type: 'interactive',
              title: 'Design a binder',
              prompt: r`Choose a group for each position so that the drug binds with $\Delta G$ of −45 kJ/mol or better.`,
              widget: pocket({ goal: (p) => (dG(p) <= -45 ? true : { ok: false, msg: `ΔG is ${fix(dG(p), 0)} kJ/mol. Match each site: something to hydrogen-bond, something oily, something negative.` }), solution: { a: 1, b: 3, c: 5 } }),
              explain: r`OH donates a hydrogen bond to the acceptor, Cl fills the oily pocket, and the carboxylate (COO⁻) pairs with the positive lysine: $\Delta G = -52$ kJ/mol, a dissociation constant of about 2 nM. Medicinal chemists make and test variations like these by the hundred.`,
            },
            {
              type: 'mcq',
              title: 'Why not charge everywhere?',
              prompt: 'Why does putting a charged group (NH₃⁺) into the oily pocket make binding worse?',
              choices: [
                { t: 'Charges are surrounded by water; stripping it away to enter an oily pocket costs energy that nothing repays', ok: true },
                { t: 'Charged groups are too large', why: 'Size isn’t the problem; it’s the loss of water around the charge.' },
                { t: 'The pocket repels all groups', why: 'The pocket welcomes oily groups such as Cl and CH₃.' },
              ],
              explain: r`Before binding, every part of the drug is surrounded by water. A charge loves water (it's strongly **solvated**); burying it in an oily pocket loses that for nothing in return. This **desolvation** penalty is why drug design is subtle.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Induced fit',
              prompt: 'Real binding pockets are not rigid locks. What does “induced fit” mean?',
              choices: [
                { t: 'The protein changes shape a little as the drug binds, wrapping around it', ok: true },
                { t: 'The drug forces the protein to unfold completely', why: 'The protein stays folded; it just adjusts.' },
                { t: 'Drugs change their atoms to fit', why: 'The drug’s atoms and bonds stay the same.' },
              ],
              explain: r`Daniel Koshland's 1958 idea: both partners flex. Modern drug design runs computer simulations of the flexible protein, not just a frozen snapshot.`,
            },
          ],
          recap: [
            'Drugs bind pockets by matching H-bonds, oily patches and charges.',
            'Each match lowers ΔG; mismatches and desolvation raise it.',
          ],
        },
        {
          id: 'affinity',
          title: 'Binding Strength',
          summary: 'Kd and occupancy',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'How tight?',
              body: r`For a drug L binding a protein P, the **dissociation constant** $K_d = [\mathrm P][\mathrm L]/[\mathrm{PL}]$ is the drug concentration at which **half** of the protein molecules are occupied. Smaller $K_d$ means tighter binding. The fraction occupied is
$$\theta = \frac{[\mathrm L]}{[\mathrm L] + K_d}$$
and the binding free energy is $\Delta G = RT\ln K_d$ (with $K_d$ in mol/L).`,
            },
            {
              type: 'interactive',
              title: 'Ninety percent occupied',
              prompt: r`A drug has $K_d = 10$ nM. Find the concentration that occupies 90% of the receptors.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 3, ymin: 0, ymax: 1, height: 300, grid: false,
                axes: { xticks: 1, yticks: 0.25, xlabel: 'drug (nM)', ylabel: 'receptors occupied', yAt: 0, xAt: -1, xfmt: (v) => sig(10 ** v, 1, true), yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { l: { min: -1, max: 3, step: 0.02, value: 0, label: 'Drug', format: (v) => `${sig(10 ** v, 2, true)} nM` } },
                curves: [{ f: (x) => occ(10 ** x, 10), color: 'violet' }, { f: () => 0.9, color: 'muted', dash: true }],
                points: [{ x: (p) => p.l, y: (p) => occ(10 ** p.l, 10), color: 'coral' }],
                readout: (p) => `${fix(100 * occ(10 ** p.l, 10), 1)}% occupied`,
                goal: (p) => (Math.abs(occ(10 ** p.l, 10) - 0.9) <= 0.006 ? true : { ok: false, msg: occ(10 ** p.l, 10) < 0.9 ? 'More drug.' : 'Less drug: you’re past 90%.' }),
                solution: { l: 1.96 },
              },
              explain: r`$\theta = 0.9$ means $[\mathrm L] = 9K_d = 90$ nM. Going from 50% to 90% occupancy takes nine times the concentration; 99% would take 99 times. Diminishing returns are built into binding.`,
            },
            {
              type: 'numeric',
              title: 'Ten times tighter',
              prompt: r`At body temperature, $RT = 2.58$ kJ/mol. How much more negative must $\Delta G$ be for a drug to bind ten times more tightly (a $K_d$ ten times smaller)? (kJ/mol, one decimal place.)`,
              unit: 'kJ/mol',
              answer: 5.9,
              tol: 0.1,
              explain: r`$\Delta G$ changes by $RT \ln 10 = 2.58 \times 2.303 \approx 5.9$ kJ/mol. One extra good hydrogen bond can be worth roughly that, which is why a single atom can change potency tenfold.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'From energy to Kd',
              prompt: r`A drug binds with $\Delta G = -46$ kJ/mol. Using $K_d = e^{\Delta G / RT}$ with $RT = 2.58$ kJ/mol, what is $K_d$ in nanomolar? (Nearest whole number.)`,
              unit: 'nM',
              answer: 18,
              tol: 1.5,
              explain: r`$e^{-46/2.58} = e^{-17.8} \approx 1.8 \times 10^{-8}$ M $\approx 18$ nM: a typical potency for a modern drug.`,
            },
          ],
          recap: [
            'Kd: concentration at half occupancy; smaller is tighter.',
            'θ = [L]/([L] + Kd); 90% needs 9 × Kd.',
            'Each 10× in Kd ≈ 5.9 kJ/mol in ΔG at 37 °C.',
          ],
        },
        {
          id: 'dose',
          title: 'Dose–Response',
          summary: 'Potency and efficacy',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'An S-shaped curve',
              body: r`Plot a drug's effect against the **logarithm** of its dose and you usually get an S-shaped curve. Two numbers describe it:
- **potency**: the $\mathrm{EC_{50}}$, the dose giving half the maximum effect (further left = more potent),
- **efficacy**: the height of the plateau, the biggest effect the drug can produce at all.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 3, ymin: 0, ymax: 110, height: 300, grid: false,
                axes: { xticks: 1, yticks: 25, xlabel: 'dose (mg)', ylabel: 'effect (%)', yAt: 0, xAt: -1, xfmt: (v) => sig(10 ** v, 1, true) },
                curves: [{ f: (x) => hill(10 ** x, 1), color: 'blue' }, { f: (x) => hill(10 ** x, 30), color: 'coral' }, { f: (x) => hill(10 ** x, 3, 1, 55), color: 'teal' }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(-0.6), y: plot.Y(85), class: 'lbl halo-text', style: `fill:var(--blue);${FS(13)}`, text: 'A' }), s('text', { x: plot.X(2.4), y: plot.Y(75), class: 'lbl halo-text', style: `fill:var(--coral);${FS(13)}`, text: 'B' }), s('text', { x: plot.X(2.4), y: plot.Y(45), class: 'lbl halo-text', style: `fill:var(--teal);${FS(13)}`, text: 'C' })],
              },
            },
            {
              type: 'mcq',
              title: 'Most potent',
              prompt: 'Which drug in the chart is the most potent?',
              choices: [
                { t: 'A', ok: true },
                { t: 'B', why: 'B needs about 30 times more drug for the same effect.' },
                { t: 'C', why: 'C’s EC₅₀ is 3 mg, and its maximum effect is lower.' },
              ],
              explain: r`A reaches half its maximum at only 1 mg. B is less potent but just as effective once the dose is high enough. C is a **partial agonist**: even a huge dose gives only 55%.`,
            },
            {
              type: 'interactive',
              title: 'Read the EC₅₀',
              prompt: r`Slide the dose to find drug B's $\mathrm{EC_{50}}$: the dose giving 50% effect.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 3, ymin: 0, ymax: 110, height: 300, grid: false,
                axes: { xticks: 1, yticks: 25, xlabel: 'dose (mg)', ylabel: 'effect (%)', yAt: 0, xAt: -1, xfmt: (v) => sig(10 ** v, 1, true) },
                params: { d: { min: -1, max: 3, step: 0.02, value: 0, label: 'Dose', format: (v) => `${sig(10 ** v, 2, true)} mg` } },
                curves: [{ f: (x) => hill(10 ** x, 30), color: 'coral' }, { f: () => 50, color: 'muted', dash: true }],
                points: [{ x: (p) => p.d, y: (p) => hill(10 ** p.d, 30), color: 'coral' }],
                readout: (p) => `effect ${fix(hill(10 ** p.d, 30), 1)}%`,
                goal: (p) => (Math.abs(hill(10 ** p.d, 30) - 50) <= 1.2 ? true : { ok: false, msg: 'Get the effect to 50%.' }),
                solution: { d: 1.48 },
              },
              explain: r`About 30 mg. On a log axis the curve is symmetrical about the $\mathrm{EC_{50}}$, so it's the easiest point to read precisely.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The safety margin',
              prompt: 'A drug’s ED₅₀ (effective dose for half of patients) is 10 mg and its TD₅₀ (toxic dose for half) is 1000 mg. A second drug has ED₅₀ 10 mg and TD₅₀ 30 mg. Which would you rather take, all else equal?',
              choices: [
                { t: 'The first: its therapeutic index (TD₅₀/ED₅₀) is 100, versus 3', ok: true },
                { t: 'The second: it’s just as potent', why: 'They’re equally potent; the difference is how close the toxic dose is.' },
              ],
              explain: r`The **therapeutic index** measures the safety margin. Drugs with small indices (such as warfarin or digoxin) need careful blood-level monitoring.`,
            },
          ],
          recap: [
            'Dose–response on a log scale is S-shaped.',
            'Potency = EC₅₀ (lower is more potent); efficacy = maximum effect.',
            'Therapeutic index = TD₅₀ / ED₅₀.',
          ],
        },
      ],
    },
    {
      title: 'Into the Body',
      summary: 'Absorption, half-life, dosing.',
      lessons: [
        {
          id: 'lipinski',
          title: 'Getting In',
          summary: 'Lipinski’s rule of five',
          icon: 'flag',
          steps: [
            {
              type: 'explain',
              title: 'The rule of five',
              body: r`A pill must dissolve in the gut, then slip through the oily membranes of the gut wall. Christopher Lipinski (1997) noticed that most oral drugs obey four limits, all multiples of five:
- molar mass under **500** g/mol,
- **logP** (how much it prefers oil to water, log scale) under **5**,
- no more than **5** hydrogen-bond donors (OH and NH),
- no more than **10** hydrogen-bond acceptors (N and O atoms).

Too big, too greasy or too polar, and a molecule usually isn't absorbed well.`,
            },
            {
              type: 'interactive',
              title: 'Count the donors',
              prompt: r`Paracetamol (acetaminophen). Tap every hydrogen-bond **donor** (an N or O carrying a hydrogen).`,
              widget: pick({ smiles: 'CC(=O)NC1=CC=C(O)C=C1', style: 'skeletal', bond: 56, h: 220, pick: (i, a) => a.el === 'N' || a.el === 'O', answer: [3, 8], extraMsg: 'The C=O oxygen has no hydrogen: it’s an acceptor, not a donor.', missMsg: 'There’s another N–H or O–H.' }),
              explain: r`The N–H of the amide and the phenol O–H: two donors. With three N/O acceptors and a molar mass of 151, paracetamol passes all of Lipinski's rules comfortably, and is absorbed within an hour.`,
            },
            {
              type: 'multi',
              title: 'Rule breakers',
              prompt: 'Which of these break at least one of Lipinski’s rules?',
              choices: [
                { t: 'A molecule of molar mass 820 g/mol', ok: true },
                { t: 'A molecule with 7 OH groups', ok: true },
                { t: 'A molecule with logP of 7', ok: true },
                { t: 'Aspirin (180 g/mol, 1 donor, 4 acceptors, logP 1.2)', why: 'Aspirin passes every rule.' },
              ],
              explain: r`Size, too many donors and too much greasiness each break a rule. (Some important drugs, such as many antibiotics and ciclosporin, break them anyway and use other routes or tricks: the rules are guidelines.)`,
            },
            {
              type: 'numeric',
              title: 'Aspirin in the stomach',
              prompt: r`Aspirin is a weak acid (pKa 3.5). In stomach acid (pH 1.5), what percentage is in the neutral, un-ionised form that crosses membranes? (Fraction neutral $= 1/(1 + 10^{\mathrm{pH} - \mathrm pK_a})$; one decimal place.)`,
              unit: '%',
              answer: 99,
              tol: 0.1,
              explain: r`$1/(1 + 10^{-2}) = 0.990$: 99% neutral, so aspirin is absorbed partly in the stomach. In the small intestine (pH about 6.5) it is mostly ionised, but the huge surface area still lets plenty through (see Acids, Bases & Buffers).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Brain drugs',
              prompt: 'Drugs for the brain must also cross the blood–brain barrier, a tightly sealed layer of cells. Which property helps most?',
              choices: [
                { t: 'Small, fairly oily and with few hydrogen-bond donors', ok: true },
                { t: 'Many charged groups', why: 'Charges keep molecules out of oily membranes.' },
                { t: 'Very large size', why: 'Large molecules generally can’t cross; antibodies, for instance, barely enter the brain.' },
              ],
              explain: r`Brain-penetrant drugs tend to have molar mass under about 450, few donors and moderate logP: stricter versions of Lipinski's rules. That's partly why many promising brain drugs fail.`,
            },
          ],
          recap: [
            'Lipinski: MW < 500, logP < 5, ≤ 5 donors, ≤ 10 acceptors.',
            'Neutral forms cross membranes; pH sets how much is neutral.',
          ],
        },
        {
          id: 'pk',
          title: 'Half-Life & Dosing',
          summary: 'Staying in the window',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Down by half',
              body: r`After a dose, the body clears a drug at a rate proportional to how much is there: its concentration falls exponentially, halving every **half-life**. A drug works when its blood level is inside the **therapeutic window**: high enough to act, low enough to avoid toxicity.

Repeated doses stack up until each dose just replaces what was cleared since the last: **steady state**, reached after about four or five half-lives.`,
            },
            {
              type: 'interactive',
              title: 'Design the schedule',
              prompt: r`This drug has a half-life of 6 hours. Choose a dose and dosing interval that keep the blood level between 5 and 15 mg/L (shaded) from day 2 onwards.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 72, ymin: 0, ymax: 30, height: 320, grid: false, stackSliders: true,
                axes: { xticks: 12, yticks: 5, xlabel: 'time (hours)', ylabel: 'blood level (mg/L)', yAt: 0, xAt: 0 },
                params: {
                  D: { min: 50, max: 600, step: 25, value: 500, label: 'Dose', color: 'coral', format: (v) => `${v} mg` },
                  tau: { min: 4, max: 24, step: 2, value: 12, label: 'Every', format: (v) => `${v} h` },
                },
                under: ({ plot, s }) => [s('rect', { x: plot.left, y: plot.Y(15), width: plot.right - plot.left, height: plot.Y(5) - plot.Y(15), fill: 'var(--success)', 'fill-opacity': 0.1 })],
                curves: [{ f: (t, p) => conc(t, p.D, p.tau), color: 'blue', n: 720 }],
                readout: (p) => (inWindow(p.D, p.tau) ? 'Inside the window from day 2 ✓' : 'Leaves the window at some point after 24 h.'),
                goal: (p) => (inWindow(p.D, p.tau) ? true : { ok: false, msg: 'The level swings outside the shaded band. Smaller doses, more often, give smaller swings.' }),
                solution: { D: 250, tau: 6 },
              },
              explain: r`With doses every half-life (6 h), each dose doubles the trough: from 250 mg the level swings between about 6.3 and 12.5 mg/L. Long intervals are impossible here: by twelve hours the level falls to a quarter, wider than the window's 3-fold range. That's why short-half-life drugs come in slow-release forms.`,
            },
            {
              type: 'numeric',
              title: 'Washing out',
              prompt: r`What percentage of a drug is left five half-lives after the last dose? (One decimal place.)`,
              unit: '%',
              answer: 3.1,
              tol: 0.05,
              explain: r`$0.5^5 = 0.031$: about 3%. "Five half-lives" is the usual rule of thumb for a drug to be essentially gone, and for a new dosing regime to reach steady state.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A loading dose',
              prompt: 'A drug with a 24-hour half-life would take four or five days to build up to steady state. How do doctors get it working on day one?',
              choices: [
                { t: 'Give a larger first dose (a loading dose), then smaller maintenance doses', ok: true },
                { t: 'Give the normal dose more often forever', why: 'That would overshoot the window once steady state is reached.' },
                { t: 'Nothing can be done', why: 'A loading dose jumps straight to the steady-state level.' },
              ],
              explain: r`A loading dose fills the body up to the target level at once; maintenance doses then replace only what is cleared. Used for drugs like digoxin and some antibiotics.`,
            },
          ],
          recap: [
            'Drug levels fall by half every half-life.',
            'Steady state after ~4–5 half-lives; shorter intervals give smaller swings.',
            'Loading doses reach the target level quickly.',
          ],
        },
        {
          id: 'inhibitors',
          title: 'Blocking Enzymes',
          summary: 'Inhibitors as medicines',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Jam the machine',
              body: r`Many drugs are enzyme **inhibitors**. A **competitive** inhibitor looks like the substrate and occupies the active site; it can be outcompeted by lots of substrate, so it raises the apparent $K_m$:
$$K_m^{\text{apparent}} = K_m\left(1 + \frac{[\mathrm I]}{K_i}\right)$$
where $K_i$ is the inhibitor's dissociation constant. Statins (cholesterol), ACE inhibitors (blood pressure) and many antivirals work this way. Others bind **irreversibly**, forming a covalent bond: aspirin and penicillin.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 11, height: 300, grid: false,
                axes: { xticks: 5, yticks: 2, xlabel: 'substrate (mM)', ylabel: 'rate', yAt: 0, xAt: 0 },
                params: { I: { min: 0, max: 40, step: 1, value: 10, label: 'Inhibitor', color: 'coral', format: (v) => `${v} nM` } },
                curves: [{ f: (x) => (10 * x) / (2 + x), color: 'muted', dash: true }, { f: (x, p) => (10 * x) / (2 * (1 + p.I / 5) + x), color: 'coral' }],
                readout: (p) => `apparent Km = ${fix(2 * (1 + p.I / 5), 1)} mM (Ki = 5 nM) · Vmax unchanged`,
              },
            },
            {
              type: 'numeric',
              title: 'How much inhibitor?',
              prompt: r`An enzyme has $K_m = 2$ mM. A competitive inhibitor has $K_i = 5$ nM. What inhibitor concentration (nM) makes the apparent $K_m$ ten times bigger?`,
              unit: 'nM',
              answer: 45,
              tol: 0.5,
              wrong: [{ v: 50, why: r`$1 + [I]/K_i = 10$ means $[I] = 9K_i$.` }],
              explain: r`$1 + [\mathrm I]/5 = 10$ gives $[\mathrm I] = 45$ nM. At normal substrate levels the enzyme then runs at a small fraction of its uninhibited speed.`,
            },
            {
              type: 'mcq',
              title: 'Aspirin’s trick',
              prompt: 'Aspirin transfers its acetyl group onto a serine in the COX enzyme’s active site. Why does one low dose protect against blood clots for days?',
              choices: [
                { t: 'The enzyme is permanently disabled; platelets, which can’t make new protein, stay blocked for their whole life', ok: true },
                { t: 'Aspirin stays in the blood for days', why: 'Aspirin itself is cleared within hours.' },
                { t: 'Aspirin thins the blood like water', why: 'It works by blocking an enzyme, not by diluting anything.' },
              ],
              explain: r`Covalent, irreversible inhibition outlasts the drug. Platelets have no nucleus, so they can't replace the acetylated COX; the effect lasts until the blocked platelets are replaced by new ones, over 7 to 10 days.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Penicillin',
              prompt: 'Penicillin kills bacteria but is harmless to us. Why?',
              choices: [
                { t: 'It blocks an enzyme that builds bacterial cell walls, which human cells don’t have', ok: true },
                { t: 'Human cells are too big for it to enter', why: 'Selectivity comes from the target, not size.' },
                { t: 'It only works in the gut', why: 'Penicillin works throughout the body.' },
              ],
              explain: r`Penicillin's strained four-membered ring mimics part of the cell-wall building block and acylates the bacterial transpeptidase irreversibly. No such enzyme exists in human cells: a perfect drug target. Bacteria fight back with enzymes (β-lactamases) that destroy the ring, one route to antibiotic resistance.`,
            },
          ],
          recap: [
            'Competitive inhibitors raise apparent Km: Km(1 + [I]/Ki).',
            'Irreversible (covalent) inhibitors like aspirin and penicillin outlast the drug.',
            'Good targets exist in the pathogen but not in us.',
          ],
        },
        {
          id: 'discovery',
          title: 'From Hit to Medicine',
          summary: 'The long odds',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'A funnel',
              body: r`Discovering a drug typically takes 10–15 years: screen hundreds of thousands of compounds for a **hit**, improve it into a **lead** by making and testing analogues, then test the candidate in cells, animals and finally people (clinical phases I, II and III). Most candidates fail along the way:`,
              widget: bars([['phase I\n→ II', 52, 'blue'], ['phase II\n→ III', 29, 'violet'], ['phase III\n→ filing', 58, 'teal'], ['filing\n→ approval', 91, 'green']], { ymax: 100, yticks: 25, ylabel: 'chance of passing (%)', height: 280, unit: '%', labelSize: 12 }),
              after: r`Typical success rates for each step (industry-wide averages over the last decade; they vary a lot by disease).`,
            },
            {
              type: 'numeric',
              title: 'Multiply the odds',
              prompt: r`Using the chart, what is the chance that a drug entering phase I is eventually approved? (Percentage, one decimal place.)`,
              unit: '%',
              answer: 8,
              tol: 0.3,
              wrong: [{ v: 57.5, why: 'Multiply the probabilities; don’t average them.' }],
              explain: r`$0.52 \times 0.29 \times 0.58 \times 0.91 \approx 0.080$: about 8%, roughly one in twelve. Phase II, where a drug first has to show it actually works in patients, is the biggest hurdle.`,
            },
            {
              type: 'mcq',
              title: 'Structure–activity',
              prompt: 'Analogues of a lead were tested: replacing a CH₃ with Cl improved potency 8×; with Br, 10×; with I, 2×; with OH, it was 50× worse. What does that suggest about that part of the pocket?',
              choices: [
                { t: 'It is an oily pocket of limited size: medium halogens fit best', ok: true },
                { t: 'It wants a hydrogen bond', why: 'The OH, the only H-bonding group, was by far the worst.' },
                { t: 'It is positively charged', why: 'None of these groups is charged; the trend follows size and oiliness.' },
              ],
              explain: r`Bigger oily groups help until they become too big (iodine). The polar OH is penalised. Reading these **structure–activity relationships** tells chemists the shape of a pocket they can't see.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why so expensive?',
              prompt: 'Estimates of the cost of bringing one new drug to market often exceed a billion dollars. What is the biggest reason?',
              choices: [
                { t: 'Paying for all the candidates that failed along the way', ok: true },
                { t: 'The cost of the chemicals in the final pill', why: 'Making the drug itself is usually cheap; the research isn’t.' },
                { t: 'Advertising', why: 'Marketing costs are large, but these estimates are of research and development.' },
              ],
              explain: r`With only about 1 in 12 clinical candidates succeeding (and many more failing before the clinic), each success has to cover the failures. Better prediction of which molecules will work, through structural biology, AI-based structure prediction and smarter chemistry, is the big hope for making medicines cheaper.`,
            },
          ],
          recap: [
            'Hit → lead → candidate → phases I–III → approval.',
            'Only ~8% of drugs entering trials are approved.',
            'Structure–activity relationships map an unseen pocket.',
          ],
        },
      ],
    },
  ],
};
