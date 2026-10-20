import { fix } from '../lib/svg.js';
import { r, FS, build, view, transfer, pick, row, bars } from './_chem.js';

// the electron sea: ions on a grid, electrons wandering among them (and drifting when a battery is on)
const SEA = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 30 }, () => ({ x: rnd() * 10, y: 0.5 + rnd() * 4, a: 0.25 + rnd() * 0.35, w: 0.7 + rnd() * 1.2, ph: rnd() * 6.28, v: (rnd() - 0.5) * 0.6 }));
})();
let seaDrift = 0, seaLast = 0;

// ---------- ionic bonding: where the energy really comes from ----------
const IONIC_SM = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
// energy (kJ/mol, from separate gas atoms): remove Na's electron, give it to Cl, then let the ions build a crystal
const ionicE = (t) => 496 * IONIC_SM((t - 1) / 0.5) - 349 * IONIC_SM((t - 1.6) / 0.5) - 787 * IONIC_SM((t - 2.8) / 1.8);
// a 4 x 4 patch of rock-salt: the first pair plus seven more pairs that drift in from scattered spots
const IONIC_GRID = (() => {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cells = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cells.push({ gx: 3.2 + (i - 1.5) * 0.92, gy: 2.75 + (j - 1.5) * 0.92, na: (i + j) % 2 === 0 });
  // the original pair lands in the middle of the patch
  const na0 = cells.findIndex((c) => c.na && Math.abs(c.gx - 2.74) < 0.01 && Math.abs(c.gy - 2.29) < 0.01);
  const cl0 = cells.findIndex((c) => !c.na && Math.abs(c.gx - 3.66) < 0.01 && Math.abs(c.gy - 2.29) < 0.01);
  cells.forEach((c, k) => {
    if (k === na0) Object.assign(c, { sx: 1.5, sy: 2.75, first: true });
    else if (k === cl0) Object.assign(c, { sx: 4.9, sy: 2.75, first: true });
    else Object.assign(c, { sx: 0.5 + rnd() * 5.4, sy: 0.45 + rnd() * 4.6 });
  });
  return cells;
})();

// ---------- H2: energy against distance (a Morse curve with H2's real bond length and depth) ----------
const H2_E = (r) => 436 * ((1 - Math.exp(-0.0194 * (r - 74))) ** 2 - 1);
const H2_SM = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
// distance between the nuclei (pm) over time: approach, get squeezed too close, spring back
const h2R = (t) => (t < 3 ? 400 - 326 * H2_SM(t / 3) : t < 4 ? 74 - 41 * H2_SM(t - 3) : t < 5 ? 33 + 41 * H2_SM(t - 4) : 74);

export default {
  id: 'bonding',
  subject: 'physics',
  title: 'Chemical Bonding',
  level: 'Intermediate',
  cover: 'bonding',
  tagline: 'Build molecules atom by atom: ions, shared pairs, Lewis structures, resonance and metals.',
  description: r`Why do atoms stick together at all, and why in such particular numbers: two hydrogens to one oxygen, four to one carbon? Hand electrons from metals to non-metals to make ions, then build molecules yourself by joining atoms on the screen while their electrons pair up live. Learn to draw Lewis structures, use formal charge to pick the best one, see why ozone and benzene need more than one drawing, and finish with the atoms that break the octet rule and the sea of electrons that holds a metal together.`,
  prereq: 'Chemical Reactions',
  chapters: [
    {
      title: 'Why Atoms Bond',
      summary: 'Outer electrons, ions and shared pairs.',
      lessons: [
        {
          id: 'valence',
          title: 'Valence Electrons',
          summary: 'Only the outer shell takes part',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'The outermost electrons',
              body: r`An atom is a tiny nucleus wrapped in shells of electrons. Only the electrons in the **outermost** shell, the **valence electrons**, take part in bonding: the inner ones sit too deep to be shared or handed over.

A **Lewis symbol** draws each valence electron as a dot around the element's symbol. The dots go one per side first, and only then start to pair up.`,
              widget: view(null, { atoms: row(['H', 'C', 'N', 'O', 'F', 'Ne'], 95), h: 190, extra: ({ s, M }) => M.atoms.map((a, i) => s('text', { x: a.x, y: 165, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(14)}`, text: String([1, 4, 5, 6, 7, 8][i]) })) }),
              after: r`For the main-group elements the count can be read straight off the periodic table: group 1 atoms have 1 valence electron, group 2 have 2, and groups 13 to 18 have 3 to 8. Elements in the same column have the same number, which is why they behave alike.`,
            },
            {
              type: 'numeric',
              title: 'Count the dots',
              prompt: r`Phosphorus sits in group 15, directly below nitrogen. How many valence electrons does a phosphorus atom have?`,
              unit: 'electrons',
              answer: 5,
              wrong: [{ v: 15, why: 'For groups 13 to 18, take away 10 from the group number: group 15 atoms have 5 outer electrons.' }, { v: 3, why: 'That is how many bonds phosphorus usually makes (three unpaired dots), not how many outer electrons it has.' }],
              explain: r`Five, the same as nitrogen above it. Its Lewis symbol has one pair and three single dots, just like nitrogen's.`,
            },
            {
              type: 'mcq',
              title: 'Family resemblance',
              prompt: 'Which element has the same number of valence electrons as oxygen?',
              choices: [
                { t: 'Sulfur', ok: true },
                { t: 'Nitrogen', why: 'Nitrogen is oxygen’s neighbour in the same row, with one electron fewer (5).' },
                { t: 'Neon', why: 'Neon has a full shell of 8, two more than oxygen.' },
                { t: 'Fluorine', why: 'Fluorine has 7, one more than oxygen.' },
              ],
              explain: r`Sulfur is directly below oxygen in group 16, so it also has six valence electrons. That's why hydrogen sulfide ($\mathrm{H_2S}$) has the same formula pattern as water ($\mathrm{H_2O}$).`,
            },
            {
              type: 'explain',
              title: 'Full shells are content',
              body: r`The **noble gases** (helium, neon, argon and the rest) almost never react. Their outer shells are full: two electrons for helium, eight for the others.

Other atoms bond in ways that leave every atom with a full outer shell like a noble gas's: eight electrons, the **octet rule**, or two for hydrogen. There are two main ways to get there:
- **hand electrons over**, from an atom with a few spare ones to an atom that is nearly full (ionic bonding), or
- **share** pairs of electrons, so that each pair counts for both atoms (covalent bonding).`,
              widget: view(null, { atoms: row(['He', 'Ne', 'Ar'], 90, 150), h: 170 }),
            },
            {
              type: 'interactive',
              title: 'One dot, one bond',
              prompt: r`Each single (orange) dot is an electron looking for a partner. Tap the oxygen, then a hydrogen, to join them with a shared pair. Join both hydrogens.`,
              widget: build({ atoms: [['O', 300, 150], ['H', 170, 150], ['H', 430, 150]], target: 'O', h: 260 }),
              explain: r`Oxygen has two single electrons, so it makes **two** bonds; hydrogen has one, so it makes one. Each bond is one shared pair. Afterwards oxygen is surrounded by 8 electrons (two bonds and two lone pairs) and each hydrogen by 2: water, $\mathrm{H_2O}$.`,
            },
            {
              type: 'numeric',
              title: 'How many bonds?',
              prompt: r`Nitrogen's Lewis symbol has one pair and three single dots. How many bonds does a nitrogen atom usually make?`,
              unit: 'bonds',
              answer: 3,
              wrong: [{ v: 5, why: 'Five is the number of valence electrons. The pair is already paired up: only the single dots go into bonds.' }],
              explain: r`Three. Each single electron pairs with one from a partner atom, so nitrogen with three hydrogens makes ammonia, $\mathrm{NH_3}$, with one lone pair left over.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Natural gas',
              prompt: r`Give this carbon atom a full shell using hydrogen. Tip: tap the carbon to select it, then each tap on **+ H** adds a hydrogen already bonded to it.`,
              widget: build({ atoms: [['C', 300, 150]], palette: { H: 5 }, target: 'C', h: 280 }),
              explain: r`Carbon has four single electrons, so it bonds to **four** hydrogens: methane, $\mathrm{CH_4}$, the main part of natural gas. A fifth hydrogen has nowhere to go: carbon's shell is already full with eight.`,
            },
          ],
          recap: [
            'Valence (outer) electrons do the bonding; group number tells how many.',
            'Atoms bond to reach a full shell: 8 electrons, or 2 for hydrogen.',
            'Each single dot in a Lewis symbol usually becomes one bond.',
          ],
        },
        {
          id: 'ionic',
          title: 'Ionic Bonds',
          summary: 'Handing electrons over',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Giving electrons away',
              body: r`Metals on the left of the periodic table have only one, two or three valence electrons, held loosely. Non-metals on the right are a few electrons short of a full shell and pull hard on extra ones.

When they meet, electrons move from the metal to the non-metal. Both end up with full shells, but now they are **ions**: the metal has lost negative charge and become positive, the non-metal has gained it and become negative. Opposite charges attract, and that attraction is an **ionic bond**.
$$\mathrm{Na \to Na^+ + e^-} \qquad \mathrm{Cl + e^- \to Cl^-}$$`,
            },
            {
              type: 'interactive',
              title: 'Make table salt',
              prompt: r`Tap the sodium atom, then the chlorine atom, to move one electron across. Give both atoms a noble-gas shell.`,
              widget: transfer([['Na', 200, 110], ['Cl', 400, 110]], { solution: [1, -1] }),
              explain: r`Sodium's one valence electron moves to chlorine. Sodium is left with its full inner shell (like neon) and becomes $\mathrm{Na^+}$; chlorine now has eight (like argon) and becomes $\mathrm{Cl^-}$. Together they are sodium chloride, NaCl.`,
            },
            {
              type: 'mcq',
              title: 'Which way?',
              prompt: 'Why doesn’t chlorine give its seven electrons to sodium instead?',
              choices: [
                { t: 'Moving one electron is far easier than moving seven', ok: true, why: null },
                { t: 'Electrons can only move from left to right on the periodic table', why: 'Electrons don’t care about the layout of the table. It’s about how tightly each atom holds them.' },
                { t: 'Sodium would end up with too many protons', why: 'Moving electrons never changes how many protons an atom has.' },
              ],
              explain: r`Both routes would give full shells, but pulling seven electrons off chlorine would cost an enormous amount of energy, while sodium gives up its single outer electron cheaply. Atoms take the route with the fewest electrons moved.`,
            },
            { /*chemanim:bonding.ionic*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Who pays for the transfer?',
              body: r`Even moving **one** electron is uphill. Pulling it off sodium costs 496 kJ/mol; chlorine gives back only 349 kJ/mol when it takes it. So why does salt form at all? Watch the energy as the electron moves and the ions get together.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 300,
                animate: { param: 't', speed: 0.8, max: 6, loop: false },
                extra: ({ plot, p, s }) => {
                  const t = p.t, X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [];
                  const gather = IONIC_SM((t - 2.8) / 1.8), fadeIn = IONIC_SM((t - 2.5) / 0.4), moved = IONIC_SM((t - 1) / 1.1);
                  // ions (or, before the hop, the two neutral atoms)
                  for (const c of IONIC_GRID) {
                    if (!c.first && fadeIn <= 0) continue;
                    const x = c.sx + (c.gx - c.sx) * gather, y = c.sy + (c.gy - c.sy) * gather;
                    const ion = !c.first || moved >= 1;
                    const rad = c.na ? (ion ? 0.27 : 0.46) : ion ? 0.43 : 0.38;
                    const op = c.first ? 1 : fadeIn;
                    out.push(s('circle', { cx: X(x), cy: Y(y), r: (X(rad) - X(0)), fill: c.na ? 'var(--violet-soft)' : 'var(--teal-soft)', stroke: c.na ? 'var(--violet)' : 'var(--teal)', 'stroke-width': 2.5, opacity: op }));
                    out.push(s('text', { x: X(x), y: Y(y) + 5, 'text-anchor': 'middle', class: 'lbl', style: `opacity:${op};${FS(c.first ? 14 : 12)}`, text: (c.na ? 'Na' : 'Cl') + (ion ? (c.na ? '⁺' : '⁻') : '') }));
                  }
                  // the travelling electron: circles sodium, hops across, then circles chlorine until the crystal forms
                  const ang = t * 4;
                  let ex, ey;
                  if (t < 1) { ex = 1.5 + 0.62 * Math.cos(ang); ey = 2.75 + 0.62 * Math.sin(ang); }
                  else if (t < 2.1) { const u = IONIC_SM((t - 1) / 1.1); ex = 1.5 + 0.62 + (4.9 - 0.55 - 1.5 - 0.62) * u; ey = 2.75 + 1.1 * Math.sin(Math.PI * u); }
                  else { ex = 4.9 - 0.55 * Math.cos(ang); ey = 2.75 + 0.55 * Math.sin(ang); }
                  const eOp = 1 - IONIC_SM((t - 2.6) / 0.3);
                  if (eOp > 0) out.push(s('circle', { cx: X(ex), cy: Y(ey), r: 6, fill: 'var(--amber)', stroke: 'var(--warn)', 'stroke-width': 1.5, opacity: eOp }));
                  // energy ladder on the right
                  const E = ionicE(t), EY = (e) => 0.5 + ((e + 700) / 1250) * 5.1;
                  out.push(s('line', { x1: X(7.2), x2: X(7.2), y1: Y(EY(560)), y2: Y(EY(-690)), stroke: 'var(--axis)', 'stroke-width': 2 }));
                  out.push(s('text', { x: X(7.2), y: Y(EY(560)) - 8, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'energy' }));
                  const level = (e, txt, col, on) => {
                    if (!on) return;
                    out.push(s('line', { x1: X(7.0), x2: X(7.6), y1: Y(EY(e)), y2: Y(EY(e)), stroke: col, 'stroke-width': 2.5 }));
                    out.push(s('text', { x: X(7.75), y: Y(EY(e)) + 5, class: 'lbl', style: `fill:${col};${FS(12)}`, text: txt }));
                  };
                  level(0, 'atoms: 0', 'var(--ink-2)', true);
                  level(496, 'e⁻ off Na: +496', 'var(--coral)', t > 1.5);
                  level(147, 'onto Cl: +147', 'var(--coral)', t > 2.1);
                  level(-640, 'crystal: −640', 'var(--success)', t > 4.6);
                  out.push(s('circle', { cx: X(7.3), cy: Y(EY(E)), r: 7, fill: E > 0 ? 'var(--coral)' : 'var(--success)' }));
                  return out;
                },
                readout: (p) => {
                  const t = p.t, E = fix(ionicE(t), 0);
                  if (t < 1) return `Two neutral atoms · energy ${E} kJ/mol`;
                  if (t < 2.5) return `Handing over the electron: energy ${E} kJ/mol, uphill`;
                  if (t < 4.6) return `The ions pull together into a crystal: energy ${E} kJ/mol`;
                  return `Salt crystal: energy ${E} kJ/mol, far below the atoms`;
                },
              },
              after: r`The electron transfer on its own costs about $+147$ kJ/mol. What pays for it is the attraction afterwards: packing the ions into a crystal, each one surrounded by opposite charges, releases about 787 kJ/mol (the **lattice energy**). Overall the salt ends up about 640 kJ/mol below the separate atoms. Ionic bonding is not really about atoms "wanting" full shells; it is about the huge pull between opposite charges.`,
            },
            {
              type: 'interactive',
              title: 'Magnesium chloride',
              prompt: r`Magnesium has two valence electrons. Move electrons until every atom has a full shell.`,
              widget: transfer([['Cl', 140, 110], ['Mg', 300, 110], ['Cl', 460, 110]], { solution: [-1, 2, -1] }),
              explain: r`Magnesium gives one electron to each chlorine and becomes $\mathrm{Mg^{2+}}$. It takes **two** chloride ions to balance one magnesium ion, so the formula is $\mathrm{MgCl_2}$. The formula of an ionic compound just records the ratio that makes the charges cancel.`,
            },
            {
              type: 'numeric',
              title: 'Charges must cancel',
              prompt: r`Aluminium forms $\mathrm{Al^{3+}}$ ions and oxygen forms $\mathrm{O^{2-}}$ ions. In aluminium oxide, how many oxide ions are there for every **two** aluminium ions?`,
              unit: 'oxide ions',
              answer: 3,
              wrong: [{ v: 2, why: r`Two of each gives $2 \times (+3) + 2 \times (-2) = +2$: not neutral.` }, { v: 1.5, why: 'That is per aluminium ion. The question asks per two, so the answer is a whole number.' }],
              explain: r`Two $\mathrm{Al^{3+}}$ carry $+6$; three $\mathrm{O^{2-}}$ carry $-6$. So aluminium oxide is $\mathrm{Al_2O_3}$, the material of sapphires and rubies.`,
            },
            {
              type: 'explain',
              title: 'Stronger charges, harder solids',
              body: r`An ionic solid is not made of separate molecules: it is a huge three-dimensional grid of alternating ions, each surrounded by neighbours of the opposite charge. The attraction between two ions grows with the product of their charges and falls with the distance between them, which shows up in how much heat it takes to melt the crystal.`,
              widget: bars([['NaF', 993, 'teal'], ['NaCl', 801, 'teal'], ['NaBr', 747, 'teal'], ['NaI', 661, 'teal'], ['CaO', 2613, 'coral'], ['MgO', 2852, 'coral']], { ymax: 3200, yticks: 800, ylabel: 'melting point (°C)', height: 300 }),
              after: r`Going from fluoride to iodide the negative ion gets bigger, the ions sit further apart and the melting point drops. Magnesium oxide has charges of $+2$ and $-2$, four times the product of sodium chloride's $+1$ and $-1$, and it melts at over 2800 °C. It lines furnaces for exactly that reason.`,
            },
            {
              type: 'mcq',
              title: 'Salt and electricity',
              prompt: 'Solid salt does not conduct electricity, but salt melted or dissolved in water does. Why?',
              choices: [
                { t: 'In the solid the ions are locked in place; in a liquid they can move', ok: true },
                { t: 'Water adds free electrons to the salt', why: 'Pure water barely conducts at all. The charge is carried by the salt’s own ions.' },
                { t: 'Melting turns the ions back into neutral atoms', why: 'The ions stay ions when salt melts: that’s why the melt conducts.' },
              ],
              explain: r`A current is moving charge. The solid is full of charged ions, but they can only vibrate in place. Melt or dissolve it and the ions are free to drift, $\mathrm{Na^+}$ one way and $\mathrm{Cl^-}$ the other.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Sapphire’s recipe',
              prompt: r`Make aluminium oxide: give every atom a noble-gas shell. (Each aluminium has three electrons to give; each oxygen needs two.)`,
              widget: transfer([['Al', 200, 70], ['Al', 400, 70], ['O', 130, 180], ['O', 300, 180], ['O', 470, 180]], { h: 250, solution: [3, 3, -2, -2, -2] }),
              explain: r`Six electrons move in all: three from each aluminium, two to each oxygen. The result is two $\mathrm{Al^{3+}}$ and three $\mathrm{O^{2-}}$, with charges $+6$ and $-6$ that cancel exactly. Which aluminium feeds which oxygen doesn't matter, only the totals.`,
            },
          ],
          recap: [
            'Metals lose electrons to become positive ions; non-metals gain them to become negative ions.',
            'An ionic formula is the ratio that makes the charges cancel: NaCl, MgCl₂, Al₂O₃.',
            'Bigger charges and smaller ions make stronger ionic solids.',
          ],
        },
        {
          id: 'covalent',
          title: 'Sharing Electrons',
          summary: 'The covalent bond',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'When neither will give',
              body: r`Two non-metal atoms both pull hard on electrons, so neither hands any over. Instead they **share**: one electron from each atom forms a **shared pair** that sits between the two nuclei and is attracted by both. That shared pair is a **covalent bond**, drawn as a line.

The trick is that a shared pair counts towards the shell of **both** atoms. In $\mathrm{H_2}$ each hydrogen sees two electrons, a full shell like helium's.`,
              widget: view(null, { atoms: [['H', 250, 90], ['H', 350, 90]], bonds: [[0, 1, 1]], h: 170 }),
            },
            { /*chemanim:bonding.covalent*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Two atoms meet',
              body: r`Bring two hydrogen atoms together and watch the energy. Far apart they ignore each other. As their electron clouds overlap, both electrons can sit between the two nuclei, attracted by both, and the energy drops.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.4, grid: false, axes: false, height: 330,
                animate: { param: 't', speed: 0.7, max: 6, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [];
                  const r = h2R(p.t), E = H2_E(r);
                  // atoms on top: 400 pm spans 6.8 units
                  const half = (r / 400) * 3.4, c = 5, yA = 5.2, R = 0.95;
                  const overlap = Math.max(0, 1 - r / 190);
                  out.push(s('ellipse', { cx: X(c), cy: Y(yA), rx: X(half + R * 0.8) - X(0), ry: (Y(0) - Y(R * 0.75)), fill: 'var(--blue)', opacity: 0.32 * overlap }));
                  for (const sx of [-1, 1]) {
                    out.push(s('circle', { cx: X(c + sx * half), cy: Y(yA), r: X(R) - X(0), fill: 'var(--blue)', opacity: 0.16 }));
                    out.push(s('circle', { cx: X(c + sx * half), cy: Y(yA), r: 6, fill: 'var(--ink)' }));
                  }
                  out.push(s('text', { x: X(c), y: Y(yA - 1.2), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(13)}`, text: `${fix(r, 0)} pm apart` }));
                  // energy curve below
                  const RX = (rr) => 1.0 + ((rr - 25) / 385) * 8.6, EY = (e) => 1.85 + (e / 500) * 1.6;
                  out.push(s('line', { x1: X(1.0), x2: X(9.7), y1: Y(EY(0)), y2: Y(EY(0)), stroke: 'var(--axis)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }));
                  out.push(s('text', { x: X(9.7), y: Y(EY(0)) - 7, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(12)}`, text: 'far apart: 0' }));
                  let d = '';
                  for (let rr = 31; rr <= 410; rr += 2) d += `${d ? 'L' : 'M'}${X(RX(rr)).toFixed(1)} ${Y(EY(Math.min(500, H2_E(rr)))).toFixed(1)}`;
                  out.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }));
                  if (p.t > 2.6) {
                    out.push(s('line', { x1: X(RX(74)), x2: X(RX(74)), y1: Y(EY(0)), y2: Y(EY(-436)), stroke: 'var(--success)', 'stroke-width': 2, 'stroke-dasharray': '3 4' }));
                    out.push(s('text', { x: X(RX(74) + 0.25), y: Y(EY(-436)) + 18, class: 'lbl', style: `fill:var(--success);${FS(12)}`, text: '74 pm, −436 kJ/mol' }));
                  }
                  out.push(s('circle', { cx: X(RX(r)), cy: Y(EY(Math.min(500, E))), r: 8, fill: 'var(--amber)', stroke: 'var(--warn)', 'stroke-width': 2 }));
                  out.push(s('text', { x: X(9.7), y: Y(0.15), 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'distance between the nuclei →' }));
                  return out;
                },
                readout: (p) => {
                  const r = h2R(p.t), E = fix(H2_E(r), 0);
                  if (p.t < 0.6) return `Far apart: energy ${E} kJ/mol`;
                  if (p.t < 3) return `Clouds overlapping: energy ${E} kJ/mol`;
                  if (p.t < 4.5) return `Squeezed too close, the nuclei repel: energy ${E} kJ/mol`;
                  return `The bottom of the well: energy ${E} kJ/mol`;
                },
              },
              after: r`The bond is the bottom of the energy well. At 74 pm the pull of both nuclei on the shared pair is balanced by the nuclei repelling each other; push closer and the energy shoots up. The depth of the well, 436 kJ/mol, is the energy you'd have to put in to pull the atoms apart again: the **bond energy** of $\mathrm{H_2}$.`,
            },
            {
              type: 'interactive',
              title: 'Chlorine gas',
              prompt: r`Chlorine atoms have seven valence electrons each. Join the two atoms so both have a full shell.`,
              widget: build({ atoms: [['Cl', 220, 140], ['Cl', 380, 140]], target: 'ClCl', h: 240 }),
              explain: r`One shared pair does it. Each chlorine now has 6 electrons in lone pairs plus 2 in the bond: 8. Pairs that are not shared are called **lone pairs**; each Cl in $\mathrm{Cl_2}$ has three.`,
            },
            {
              type: 'interactive',
              title: 'Ammonia',
              prompt: r`Build ammonia from one nitrogen and three hydrogens.`,
              widget: build({ palette: { N: 1, H: 3 }, target: 'N', h: 280 }),
              explain: r`Nitrogen makes three bonds and keeps one lone pair. That lone pair matters a lot: it is what lets ammonia grab a proton and act as a base, and (as you'll see in Molecular Shapes) it pushes the hydrogens into a pyramid.`,
            },
            {
              type: 'numeric',
              title: 'Lone pairs in water',
              prompt: r`How many lone pairs does the oxygen atom in a water molecule have?`,
              unit: 'lone pairs',
              answer: 2,
              wrong: [{ v: 3, why: 'Oxygen starts with six valence electrons and uses two of them in bonds, leaving four: two pairs.' }, { v: 4, why: 'That counts electrons. Two electrons make a pair.' }],
              explain: r`Two. Oxygen's six valence electrons go into two bonds (one electron each) and two lone pairs. Around the oxygen: $2 \times 2 + 2 \times 2 = 8$ electrons.`,
            },
            {
              type: 'mcq',
              title: 'Oxygen’s cousin',
              prompt: 'Sulfur is in the same group as oxygen. What is the formula of its simplest compound with hydrogen?',
              choices: [
                { t: r`$\mathrm{H_2S}$`, ok: true },
                { t: r`$\mathrm{HS}$`, why: 'That would leave sulfur with an unpaired electron: it has two single dots to pair, like oxygen.' },
                { t: r`$\mathrm{H_6S}$`, why: 'Six is the number of valence electrons, but four of them are already paired up as lone pairs.' },
              ],
              explain: r`Hydrogen sulfide, $\mathrm{H_2S}$, the gas that smells of rotten eggs. Same column, same number of bonds.`,
            },
            {
              type: 'interactive',
              title: 'Wood alcohol',
              prompt: r`Build methanol, $\mathrm{CH_4O}$: one carbon, one oxygen and four hydrogens, every atom with a full shell.`,
              widget: build({ palette: { C: 1, O: 1, H: 4 }, target: 'CO', h: 300 }),
              explain: r`Carbon's four bonds go to three hydrogens and the oxygen; the oxygen's second bond goes to the last hydrogen: $\mathrm{CH_3OH}$. Counting bonds first (C 4, O 2, H 1) tells you which atoms can sit in the middle: hydrogen, with one bond, can only ever be on the outside.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Two carbons',
              prompt: r`Build ethane, $\mathrm{C_2H_6}$.`,
              widget: build({ palette: { C: 2, H: 6 }, target: 'CC', h: 300 }),
              explain: r`The two carbons bond to each other, and each uses its three remaining bonds on hydrogens. Carbon's ability to bond to other carbons, in chains and rings of any length, is the basis of organic chemistry.`,
            },
          ],
          recap: [
            'A covalent bond is a shared pair of electrons; it counts for both atoms.',
            'Usual bond counts: H 1, O 2, N 3, C 4, halogens 1.',
            'Unshared pairs are lone pairs.',
          ],
        },
      ],
    },
    {
      title: 'Lewis Structures',
      summary: 'Drawing every electron.',
      lessons: [
        {
          id: 'multiple',
          title: 'Double & Triple Bonds',
          summary: 'Sharing more than one pair',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'When one pair isn’t enough',
              body: r`Two atoms can share **two** pairs (a double bond, drawn as two lines) or **three** pairs (a triple bond). Each extra shared pair counts towards both atoms' shells.

In the builder, tap a bond to cycle it from single to double to triple. Or tap one atom and then the other again.`,
              widget: view(null, { atoms: [['O', 140, 90], ['O', 230, 90], ['N', 370, 90], ['N', 460, 90]], bonds: [[0, 1, 2], [2, 3, 3]], h: 170 }),
            },
            {
              type: 'interactive',
              title: 'Oxygen gas',
              prompt: r`Join the two oxygen atoms so that each has eight electrons around it.`,
              widget: build({ atoms: [['O', 230, 140], ['O', 370, 140]], target: 'O=O', h: 240 }),
              explain: r`With a single bond each oxygen would have only 7 electrons and one left unpaired. A **double** bond shares two pairs: $2 \times 2 + 2 \times 2 = 8$ around each oxygen, with two lone pairs apiece.`,
            },
            {
              type: 'interactive',
              title: 'Nitrogen gas',
              prompt: r`Now the two nitrogen atoms that make up 78% of the air.`,
              widget: build({ atoms: [['N', 230, 140], ['N', 370, 140]], target: 'N#N', h: 240 }),
              explain: r`Nitrogen needs three more electrons, so the atoms share **three** pairs: a triple bond, with one lone pair on each atom. It is one of the strongest bonds in chemistry, which is why nitrogen gas is so unreactive and why making fertiliser from it takes so much energy.`,
            },
            {
              type: 'interactive',
              title: 'Carbon dioxide',
              prompt: r`Build $\mathrm{CO_2}$ with every atom's shell full.`,
              widget: build({ palette: { C: 1, O: 2 }, target: 'O=C=O', h: 280 }),
              explain: r`O=C=O: carbon makes two double bonds (four bonds in all) and each oxygen makes one double bond (two bonds) with two lone pairs.`,
            },
            {
              type: 'explain',
              title: 'Shorter and stronger',
              body: r`More shared electrons pull the two nuclei closer together and hold them more tightly. For carbon–carbon bonds:`,
              widget: bars([['C–C\n154 pm', 348, 'blue'], ['C=C\n134 pm', 614, 'violet'], ['C≡C\n120 pm', 839, 'coral']], { ymax: 1000, yticks: 250, ylabel: 'bond energy (kJ/mol)', height: 280, labelSize: 14 }),
              after: r`The numbers under each bar are bond lengths in picometres (trillionths of a metre). A triple bond is the shortest and takes the most energy to break.`,
            },
            {
              type: 'numeric',
              title: 'Twice as strong?',
              prompt: r`Using the chart, how many times stronger is a C=C double bond than a C–C single bond? (Two decimal places.)`,
              answer: 1.76,
              tol: 0.02,
              wrong: [{ v: 2, why: r`Work it out from the chart: $614 \div 348$.` }],
              explain: r`$614 \div 348 \approx 1.76$: less than double. The second pair sits off to the sides of the line between the nuclei (a "π bond", see Molecular Shapes), where it overlaps less and holds less tightly than the first.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Hydrogen cyanide',
              prompt: r`Build HCN.`,
              widget: build({ palette: { H: 1, C: 1, N: 1 }, target: 'C#N', h: 280 }),
              explain: r`H–C≡N. Hydrogen can only make one bond, so it must be on the end; carbon in the middle uses one bond on hydrogen and three on nitrogen, and nitrogen keeps one lone pair.`,
            },
          ],
          recap: [
            'Atoms can share two pairs (double bond) or three (triple bond).',
            'More shared pairs: shorter, stronger bonds, but each extra pair adds less.',
          ],
        },
        {
          id: 'lewis',
          title: 'Drawing Lewis Structures',
          summary: 'A recipe that always works',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'An electron budget',
              body: r`For bigger molecules, guessing gets hard. A **Lewis structure** shows every valence electron, and there's a recipe for drawing one:
1. **Count** all the valence electrons (add one for each negative charge, take one away for each positive charge).
2. **Connect** the atoms with single bonds. Hydrogen always goes on the outside; the atom that makes the most bonds usually goes in the middle.
3. **Spend** the remaining electrons as lone pairs, outer atoms first, until each has eight.
4. If the middle atom is still short, turn a lone pair from a neighbour into an extra shared pair (a double bond).`,
            },
            {
              type: 'numeric',
              title: 'Budget for CO₂',
              prompt: r`How many valence electrons are there in total in a $\mathrm{CO_2}$ molecule?`,
              unit: 'electrons',
              answer: 16,
              wrong: [{ v: 10, why: 'Count both oxygens: 4 + 6 + 6.' }, { v: 12, why: 'Oxygen has 6 valence electrons, carbon 4.' }],
              explain: r`$4 + 2 \times 6 = 16$. In O=C=O they are spent as 4 bonds (8 electrons) and 4 lone pairs (8 electrons).`,
            },
            {
              type: 'numeric',
              title: 'Budget for an ion',
              prompt: r`How many valence electrons does the nitrate ion, $\mathrm{NO_3^-}$, have?`,
              unit: 'electrons',
              answer: 24,
              wrong: [{ v: 23, why: 'The minus sign means one extra electron: add it on.' }, { v: 22, why: 'A negative ion has an extra electron, not one fewer.' }],
              explain: r`$5 + 3 \times 6 + 1 = 24$. The charge tells you the ion has one electron more than the neutral atoms would.`,
            },
            {
              type: 'mcq',
              title: 'Who goes in the middle?',
              prompt: 'In hydrogen cyanide, HCN, which atom sits in the middle?',
              choices: [
                { t: 'Carbon', ok: true },
                { t: 'Hydrogen', why: 'Hydrogen can make only one bond, so it can never be between two atoms.' },
                { t: 'Nitrogen', why: 'Nitrogen makes three bonds, carbon four: the atom making the most bonds usually goes in the middle.' },
              ],
              explain: 'Carbon, the atom that makes the most bonds. Hydrogen, with one bond, is always on the outside.',
            },
            {
              type: 'interactive',
              title: 'Formaldehyde',
              prompt: r`Build formaldehyde, $\mathrm{CH_2O}$ (the preserving liquid in old museum jars).`,
              widget: build({ palette: { C: 1, O: 1, H: 2 }, target: 'C=O', h: 300 }),
              explain: r`Carbon in the middle with two hydrogens and a **double** bond to oxygen. Recipe check: $4 + 2 + 6 = 12$ valence electrons. Two C–H bonds and the C=O double bond use 8 of them, and oxygen's two lone pairs use the last 4.`,
            },
            {
              type: 'numeric',
              title: 'Where the rest went',
              prompt: r`In the formaldehyde you built, how many lone pairs are there in total (on all atoms)?`,
              unit: 'lone pairs',
              answer: 2,
              wrong: [{ v: 4, why: 'Carbon and hydrogen have none here: only oxygen has lone pairs.' }],
              explain: r`Two, both on oxygen. Carbon uses all four of its electrons in bonds, and hydrogens never have lone pairs.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Vinegar’s acid',
              prompt: r`Acetic acid, $\mathrm{C_2H_4O_2}$, has a $\mathrm{CH_3}$ group joined to a carbon that carries one oxygen by a double bond and an OH group. Build it.`,
              widget: build({ palette: { C: 2, O: 2, H: 4 }, target: 'CC(=O)O', h: 320 }),
              explain: r`$\mathrm{CH_3}$–C(=O)–O–H. This C(=O)OH arrangement, a **carboxylic acid** group, appears in everything from vinegar to fatty acids and amino acids.`,
            },
          ],
          recap: [
            'Count electrons (adjusting for charge), connect, fill outer atoms, then fix the middle with multiple bonds.',
            'The atom making the most bonds usually goes in the middle; H is always outside.',
          ],
        },
        {
          id: 'formal',
          title: 'Formal Charge',
          summary: 'Which drawing is best?',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Electrons an atom can call its own',
              body: r`In a Lewis structure, give each atom its own lone-pair electrons plus **half** of each shared pair. If that adds up to more or fewer than the atom's valence electrons, it carries a **formal charge**:
$$\text{formal charge} = \text{valence electrons} - \text{lone-pair electrons} - \text{bonds}$$
Formal charges must add up to the charge of the whole molecule or ion. When there's a choice of structures, the best one usually has formal charges as small as possible, with any negative charge on the most electronegative atom.`,
            },
            {
              type: 'numeric',
              title: 'Ammonium',
              prompt: r`In the ammonium ion, $\mathrm{NH_4^+}$, nitrogen makes four bonds and has no lone pairs. What is its formal charge?`,
              answer: 1,
              wrong: [{ v: -1, why: r`$5 - 0 - 4 = +1$: nitrogen "owns" four electrons but has five valence electrons.` }, { v: 0, why: 'Nitrogen normally makes three bonds; with four it has given away a share of one more electron.' }],
              explain: r`$5 - 0 - 4 = +1$. The ion's positive charge sits on the nitrogen. That happens when ammonia's lone pair grabs a proton ($\mathrm{H^+}$): the lone pair becomes a fourth bond.`,
            },
            {
              type: 'interactive',
              title: 'Build ammonium',
              prompt: r`Build $\mathrm{NH_4^+}$. Select an atom and tap **Charge ±** to give it a charge.`,
              widget: build({ palette: { N: 1, H: 4 }, charges: true, target: '[NH4+]', netCharge: 1, h: 300 }),
              explain: r`With four bonds and no lone pair, nitrogen keeps only four electrons of its own instead of five: formal charge $+1$. The builder only accepts the structure once the charge is shown.`,
            },
            {
              type: 'mcq',
              title: 'Two ways to draw CO₂',
              prompt: r`Both structures below use 16 electrons and give every atom eight. Which is the better description of carbon dioxide?`,
              widget: view(null, { atoms: [['O', 70, 80, { lp: 2 }], ['C', 150, 80], ['O', 230, 80, { lp: 2 }], ['O', 370, 80, { q: 1, lp: 1 }], ['C', 450, 80], ['O', 530, 80, { q: -1, lp: 3 }]], bonds: [[0, 1, 2], [1, 2, 2], [3, 4, 3], [4, 5, 1]], h: 170, extra: ({ s }) => [s('text', { x: 150, y: 155, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'A' }), s('text', { x: 450, y: 155, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'B' })] }),
              choices: [
                { t: 'A: no formal charges', ok: true },
                { t: 'B: it has a stronger triple bond', why: 'A triple bond alone doesn’t make a structure better. B has to separate charges to get it.' },
                { t: 'Both describe it equally well', why: 'B needs a + and a − on two oxygens, which costs energy. A has none.' },
              ],
              explain: r`A, O=C=O, has zero formal charge everywhere; B puts $+1$ on one oxygen and $-1$ on the other. Separating charges costs energy, so A is the better picture, and experiments agree: both C–O bonds in $\mathrm{CO_2}$ are the same length.`,
            },
            {
              type: 'interactive',
              title: 'Hydroxide',
              prompt: r`Build the hydroxide ion, $\mathrm{OH^-}$.`,
              widget: build({ palette: { O: 1, H: 1 }, charges: true, target: '[OH-]', netCharge: -1, h: 260 }),
              explain: r`Oxygen with one bond and three lone pairs owns $6 + 1 = 7$ electrons, one more than its six valence electrons: formal charge $-1$. Hydroxide is what's left when water loses a proton.`,
            },
            {
              type: 'numeric',
              title: 'Cyanide',
              prompt: r`In the cyanide ion, $[\mathrm{C{\equiv}N}]^-$, carbon and nitrogen each have one lone pair. What is the formal charge on carbon?`,
              answer: -1,
              wrong: [{ v: 1, why: r`$4 - 2 - 3$ is negative.` }, { v: 0, why: r`Carbon owns $2 + 3 = 5$ electrons, one more than its four.` }],
              explain: r`$4 - 2 - 3 = -1$, and nitrogen's is $5 - 2 - 3 = 0$, adding up to the ion's $-1$. The negative charge sits on carbon, which is why cyanide bonds to metals through its carbon: that is how it poisons, by locking onto the iron in cytochrome c oxidase, the enzyme cells use to burn oxygen.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Carbon monoxide',
              prompt: r`Build CO so that both atoms have eight electrons. You'll need a triple bond, and charges.`,
              widget: build({ palette: { C: 1, O: 1 }, charges: true, target: '[C-]#[O+]', netCharge: 0, h: 260 }),
              explain: r`$\mathrm{^-C{\equiv}O^+}$. With a triple bond each atom has one lone pair. Carbon then owns 5 electrons (charge $-1$) and oxygen 5 (charge $+1$). It's a surprising structure, the negative charge on the less electronegative atom, but it's the only way to give both atoms an octet, and it explains why CO binds so strongly through its carbon to the iron in haemoglobin.`,
            },
          ],
          recap: [
            'Formal charge = valence electrons − lone-pair electrons − bonds.',
            'Formal charges add up to the overall charge.',
            'Prefer structures with the smallest formal charges.',
          ],
        },
        {
          id: 'resonance',
          title: 'Resonance',
          summary: 'When one drawing isn’t enough',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Ozone’s two faces',
              body: r`Ozone, $\mathrm{O_3}$, can be drawn with the double bond on the left or on the right. Both drawings are equally good, so which is right?`,
              widget: view(null, {
                atoms: [['O', 60, 120, { q: -1, lp: 3 }], ['O', 140, 75, { q: 1, lp: 1 }], ['O', 220, 120, { lp: 2 }], ['O', 380, 120, { lp: 2 }], ['O', 460, 75, { q: 1, lp: 1 }], ['O', 540, 120, { q: -1, lp: 3 }]],
                bonds: [[0, 1, 1], [1, 2, 2], [3, 4, 2], [4, 5, 1]], h: 190,
                extra: ({ s }) => [s('text', { x: 300, y: 112, 'text-anchor': 'middle', class: 'lbl', style: FS(26), text: '↔' })],
              }),
              after: r`Neither. Measurements show that **both** O–O bonds in ozone are the same length, 128 pm, between an O–O single bond (148 pm) and an O=O double bond (121 pm). The real molecule is a blend of the two drawings, called **resonance**: the second shared pair is spread over both bonds.`,
            },
            {
              type: 'interactive',
              title: 'Draw ozone',
              prompt: r`Draw one of ozone's two structures: three oxygens, every atom with eight electrons, charges shown.`,
              widget: build({ palette: { O: 3 }, charges: true, target: '[O-][O+]=O', netCharge: 0, h: 280 }),
              explain: r`The middle oxygen makes three bonds and keeps one lone pair (charge $+1$); one end makes a double bond (no charge), the other a single bond with three lone pairs (charge $-1$). Swap the ends and you have the other resonance structure.`,
            },
            {
              type: 'numeric',
              title: 'Half a bond',
              prompt: r`Ozone shares three bonding pairs over two O–O links. What is the average **bond order** (number of shared pairs per link)?`,
              answer: 1.5,
              wrong: [{ v: 2, why: 'Only one of the two links is double in each drawing.' }, { v: 3, why: 'That’s the total, spread over two links.' }],
              explain: r`$3 \div 2 = 1.5$: each bond is "one and a half", which matches its length between a single and a double bond.`,
            },
            {
              type: 'mcq',
              title: 'A common misunderstanding',
              prompt: 'What does resonance NOT mean?',
              choices: [
                { t: 'The molecule flips rapidly back and forth between the two structures', ok: true },
                { t: 'The real electron arrangement is in between the drawings', why: 'That is exactly what resonance means.' },
                { t: 'A single Lewis structure can’t describe the molecule', why: 'That’s true: it’s why we draw several.' },
              ],
              explain: r`A mule is a cross between a horse and a donkey; it isn't a horse one moment and a donkey the next. Likewise ozone is always the blend. The separate drawings are just a limitation of drawing electron pairs as lines.`,
            },
            {
              type: 'explain',
              title: 'Three ways to share',
              body: r`The nitrate ion, $\mathrm{NO_3^-}$, has **three** equally good structures: the double bond can go to any of the three oxygens. All three N–O bonds turn out identical.`,
              widget: view(null, { atoms: [['N', 300, 110, { q: 1 }], ['O', 300, 40, { lp: 2 }], ['O', 230, 150, { q: -1, lp: 3 }], ['O', 370, 150, { q: -1, lp: 3 }]], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1]], h: 200 }),
            },
            {
              type: 'numeric',
              title: 'Nitrate’s bond order',
              prompt: r`Nitrate spreads four bonding pairs over three N–O links. What is the bond order of each? (Two decimal places.)`,
              answer: 1.33,
              tol: 0.01,
              wrong: [{ v: 1.5, why: 'That would be three pairs over two links (ozone). Here it’s four pairs over three.' }],
              explain: r`$4 \div 3 \approx 1.33$. Spreading electrons over several atoms like this, **delocalisation**, lowers their energy and makes the ion extra stable.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Sharing the charge',
              prompt: r`In the acetate ion (from vinegar), the negative charge isn't stuck on one atom. Tap every atom that carries the negative charge in **some** resonance structure.`,
              widget: pick({ atoms: [['C', 150, 150], ['C', 270, 150], ['O', 340, 80, { lp: 2 }], ['O', 340, 220, { q: -1, lp: 3 }]], bonds: [[0, 1, 1], [1, 2, 2], [1, 3, 1]], overrides: [[0, { h: 3 }]], h: 290, answer: [2, 3], extraMsg: 'The carbons never carry the charge: the double bond only moves between the oxygens.', missMsg: 'There is a second resonance structure: move the double bond to the other oxygen.' }),
              explain: r`Both oxygens. Move the C=O double bond to the other oxygen and the $-1$ moves with it. The charge is shared, half on each oxygen, and both C–O bonds are the same length (127 pm). This is why acetic acid gives up its proton fairly easily.`,
            },
          ],
          recap: [
            'When several equally good Lewis structures exist, the real molecule is a blend (resonance).',
            'Bond order = shared pairs ÷ links: 1.5 in ozone, 1.33 in nitrate.',
            'Delocalised electrons make molecules more stable.',
          ],
        },
      ],
    },
    {
      title: 'Beyond the Octet',
      summary: 'Exceptions and metals.',
      lessons: [
        {
          id: 'exceptions',
          title: 'Breaking the Octet Rule',
          summary: 'Too few, too many, and odd numbers',
          icon: 'flag',
          steps: [
            {
              type: 'explain',
              title: 'Rules of thumb',
              body: r`The octet rule works remarkably well for carbon, nitrogen, oxygen and fluorine, but it is a rule of thumb, and there are three kinds of exception:
- **Too few:** boron and beryllium compounds often have only six or four electrons around the central atom.
- **Odd numbers:** a molecule with an odd number of electrons can't pair them all. These **radicals** (such as NO and $\mathrm{NO_2}$) tend to be very reactive.
- **Too many:** atoms from the third period down (phosphorus, sulfur, chlorine, xenon...) are big enough to bond to five or six neighbours.`,
            },
            {
              type: 'interactive',
              title: 'Boron trifluoride',
              prompt: r`Build $\mathrm{BF_3}$. Boron has only three valence electrons, so it can't reach eight with fluorine.`,
              widget: build({ palette: { B: 1, F: 3 }, target: 'FB(F)F', lenient: ['B'], h: 300 }),
              explain: r`Three single bonds give each fluorine its octet, but boron has only six electrons around it. A B=F double bond would fix boron but put a $+1$ formal charge on fluorine, the most electronegative element of all, so the structure with only six around boron is preferred.`,
            },
            {
              type: 'mcq',
              title: 'An empty seat',
              prompt: r`$\mathrm{BF_3}$ reacts instantly with ammonia, $\mathrm{NH_3}$, to form a single molecule. What happens?`,
              choices: [
                { t: 'Nitrogen’s lone pair forms a bond to boron, filling its octet', ok: true },
                { t: 'Boron gives electrons to nitrogen', why: 'Boron is the one that is short of electrons. It can’t spare any.' },
                { t: 'A fluorine moves from boron to nitrogen', why: 'No atoms swap places: the two molecules simply join.' },
              ],
              explain: r`Ammonia's lone pair becomes a shared pair between N and B, a bond in which both electrons came from the same atom. Molecules that accept a lone pair like this are called **Lewis acids**; donors like ammonia are **Lewis bases**.`,
            },
            {
              type: 'interactive',
              title: 'Sulfur hexafluoride',
              prompt: r`Build $\mathrm{SF_6}$, a gas used to insulate high-voltage switches.`,
              widget: build({ palette: { S: 1, F: 6 }, target: 'FS(F)(F)(F)(F)F', h: 320 }),
              explain: r`Sulfur bonds to all six fluorines, using all six of its valence electrons. Each fluorine has its octet; sulfur is surrounded by six bonding pairs.`,
            },
            {
              type: 'numeric',
              title: 'A crowded atom',
              prompt: r`How many electrons are shared around the sulfur atom in $\mathrm{SF_6}$?`,
              unit: 'electrons',
              answer: 12,
              wrong: [{ v: 6, why: 'Six bonds, but each bond is a pair of electrons.' }, { v: 8, why: 'Sulfur breaks the octet rule here: count the bonds.' }],
              explain: r`Six bonds × 2 electrons = 12. A second-period atom like oxygen couldn't do this: it is too small to fit six neighbours around it, and its shell can hold only eight.`,
            },
            {
              type: 'mcq',
              title: 'Spot the radical',
              prompt: 'Which of these molecules must have an unpaired electron?',
              choices: [
                { t: r`$\mathrm{NO_2}$ (17 valence electrons)`, ok: true },
                { t: r`$\mathrm{CO_2}$ (16 valence electrons)`, why: 'An even number of electrons can all be paired.' },
                { t: r`$\mathrm{H_2O}$ (8 valence electrons)`, why: 'Eight electrons: four pairs, none left over.' },
                { t: r`$\mathrm{NH_3}$ (8 valence electrons)`, why: 'Eight electrons: four pairs, none left over.' },
              ],
              explain: r`Seventeen is odd, so one electron must be left unpaired. Nitrogen dioxide is the brown gas in city smog; its lone electron makes it reactive, and two $\mathrm{NO_2}$ molecules readily pair up into $\mathrm{N_2O_4}$.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Five neighbours',
              prompt: r`Build phosphorus pentachloride, $\mathrm{PCl_5}$.`,
              widget: build({ palette: { P: 1, Cl: 5 }, target: 'ClP(Cl)(Cl)(Cl)Cl', h: 320 }),
              explain: r`Phosphorus uses all five valence electrons in five bonds: ten electrons around it. Its smaller cousin nitrogen only forms $\mathrm{NCl_3}$: there's no $\mathrm{NCl_5}$.`,
            },
          ],
          recap: [
            'Boron often has only six electrons (BF₃) and accepts a lone pair readily.',
            'Odd electron counts mean radicals (NO, NO₂).',
            'Period-3 atoms and below can bond to 5 or 6 neighbours (PCl₅, SF₆).',
          ],
        },
        {
          id: 'metallic',
          title: 'Metallic Bonds',
          summary: 'A sea of shared electrons',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'A sea of electrons',
              body: r`In a metal, every atom lets its valence electrons go into a pool shared by the whole piece. What's left is a grid of positive ions held together by a "sea" of electrons that belongs to all of them: a **metallic bond**.

Switch on the battery to push the sea along.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 250,
                params: { V: { min: 0, max: 1, step: 1, value: 0, label: 'Battery', format: (v) => (v ? 'on' : 'off') } },
                animate: { param: 't', speed: 1, autoplay: true },
                extra: ({ plot, p, s }) => {
                  if (p.t < seaLast) seaDrift = 0;
                  seaDrift += (p.t - seaLast) * (p.V ? 0.9 : 0);
                  seaLast = p.t;
                  const out = [];
                  for (const e of SEA) {
                    const x = (((e.x + e.v * p.t + e.a * Math.sin(e.w * p.t + e.ph) - seaDrift) % 10) + 10) % 10;
                    const y = e.y + e.a * Math.cos(e.w * 1.3 * p.t + e.ph);
                    out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 5.5, fill: 'var(--blue)' }));
                  }
                  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
                    const x = 0.85 + i * 1.66, y = 0.9 + j * 1.6;
                    out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 20, fill: 'var(--violet-soft)', stroke: 'var(--violet)', 'stroke-width': 3 }));
                    out.push(s('text', { x: plot.X(x), y: plot.Y(y) + 7, 'text-anchor': 'middle', class: 'lbl', style: FS(19), text: '+' }));
                  }
                  return out;
                },
                readout: (p) => (p.V ? 'The whole sea drifts towards the battery’s + end: an electric current.' : 'The electrons wander at random: no overall flow.'),
              },
              after: r`The sea explains what makes metals metals: free electrons carry electric current and heat, and they absorb and re-emit light at almost any colour, which gives metals their shine.`,
            },
            {
              type: 'mcq',
              title: 'Bend or break',
              prompt: 'Hit a metal and it dents; hit a salt crystal and it shatters. Why the difference?',
              choices: [
                { t: 'Sliding a layer of a salt brings like charges face to face; in a metal the sea keeps holding the ions', ok: true },
                { t: 'Metal atoms are softer than ions', why: 'The ions in a metal are just as hard. It’s about how the bonding responds when layers slide.' },
                { t: 'Salt crystals contain water that freezes', why: 'Dry salt shatters just as well.' },
              ],
              explain: r`In NaCl, shift a layer by one ion and $\mathrm{Na^+}$ sits next to $\mathrm{Na^+}$, $\mathrm{Cl^-}$ next to $\mathrm{Cl^-}$: they repel and the crystal splits. In a metal every ion is positive and the electron sea flows around them wherever they move, so layers can slide without the bonding breaking.`,
            },
            {
              type: 'explain',
              title: 'More electrons, stronger metal',
              body: r`Across the third period, sodium gives one electron per atom to the sea, magnesium two and aluminium three. More electrons and more highly charged ions mean a stronger metallic bond, which shows in the temperature needed to boil the metal.`,
              widget: bars([['Na\n1 e⁻', 883, 'violet'], ['Mg\n2 e⁻', 1090, 'violet'], ['Al\n3 e⁻', 2519, 'violet']], { ymax: 3000, yticks: 1000, ylabel: 'boiling point (°C)', height: 280, labelSize: 14 }),
            },
            {
              type: 'numeric',
              title: 'Counting the sea',
              prompt: r`Copper gives about one electron per atom to the sea. A cubic centimetre of copper weighs 8.96 g, and copper's molar mass is 63.55 g/mol. Roughly how many free electrons are in it? (Use $6.02 \times 10^{23}$ per mole; write it like 1.2e22.)`,
              answer: 8.49e22,
              relTol: 0.03,
              wrong: [{ v: 0.141, why: 'That’s the number of moles. Multiply by Avogadro’s number.' }],
              explain: r`$8.96 \div 63.55 = 0.141$ mol of atoms, times $6.02 \times 10^{23}$ gives about $8.5 \times 10^{22}$ free electrons, in a sugar-cube-sized piece. With so many carriers, a current needs them to drift only a fraction of a millimetre per second.`,
            },
            {
              type: 'mcq',
              title: 'Why alloys are harder',
              prompt: 'Steel (iron with a little carbon) and bronze (copper with tin) are harder than the pure metals. Why?',
              choices: [
                { t: 'Atoms of a different size jam the layers so they can’t slide as easily', ok: true },
                { t: 'The added atoms remove electrons from the sea', why: 'The sea is still there; alloys still conduct and bend.' },
                { t: 'Alloys are ionic compounds', why: 'Alloys are still metallic: there are no separate positive and negative ions.' },
              ],
              explain: r`Pure metals are soft because their neat layers of identical atoms slide over each other. A few odd-sized atoms act like grit between the layers. That's why the Bronze Age was a big step up from copper.`,
            },
            {
              type: 'order',
              title: 'Hot enough to melt',
              prompt: 'Put these in order of melting point, lowest first.',
              items: [r`Oxygen, $\mathrm{O_2}$ (separate molecules)`, 'Sodium (a weak metal)', 'Sodium chloride (an ionic crystal)', 'Tungsten (a strong metal)'],
              explain: r`Oxygen $-218$ °C, sodium 98 °C, sodium chloride 801 °C, tungsten 3422 °C (the highest of any metal, hence light-bulb filaments). Oxygen is lowest because melting it only separates whole molecules, which barely attract each other; the covalent bonds inside the molecules don't break. More on those weak forces in Forces Between Molecules.`,
            },
            {
              type: 'multi',
              kicker: 'Challenge',
              title: 'What the sea explains',
              prompt: 'Which of these properties of metals come from the shared electron sea?',
              choices: [
                { t: 'Conducting electricity', ok: true },
                { t: 'Conducting heat well', ok: true },
                { t: 'Being shiny', ok: true },
                { t: 'Bending without shattering', ok: true },
                { t: 'Being magnetic', why: 'Only a few metals (iron, nickel, cobalt) are magnetic, which comes from their unpaired inner (d) electrons, not the sea as such.' },
              ],
              explain: r`All but magnetism. Free electrons carry charge and heat, reflect light, and keep holding the ions as layers slide. Most metals, from copper to gold to aluminium, aren't magnetic at all.`,
            },
          ],
          recap: [
            'Metals: positive ions in a shared sea of electrons.',
            'The sea explains conduction, shine and malleability.',
            'More electrons per atom: stronger metallic bonding.',
          ],
        },
      ],
    },
  ],
};
