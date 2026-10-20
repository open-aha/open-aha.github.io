import { fix } from '../lib/svg.js';
import { shape3d } from '../lib/chem.js';
import { r, FS, view, pick } from './_chem.js';

// a VSEPR model with sliders for bonded atoms (n) and lone pairs (l)
const lab = ({ center = 'X', label = 'A', ligand = 'H', n = 4, l = 0, nMin = 1, nMax = 6, lMax = 3, fixN = false, fixL = false, ...o } = {}) => ({
  kind: 'mol3d', h: 300,
  vsepr: { center, ligand, label: center === 'X' ? label : undefined },
  params: {
    n: { min: nMin, max: nMax, step: 1, value: n, label: 'Bonded atoms', slider: !fixN, control: 'buttons' },
    l: { min: 0, max: lMax, step: 1, value: l, label: 'Lone pairs', slider: !fixL, color: 'teal', control: 'buttons' },
  },
  ...o,
});
// a fixed molecule built from a centre, its ligands and lone pairs
const fixed = (center, ligands, lone = 0, o = {}) => ({ kind: 'mol3d', h: 280, ...shape3d({ center, ligands, lone }), ...o });

// ---------- s + p hybrid in cross-section ----------
const MIX = [0, 0.25, 1 / 3, 0.5, 1];
const MIXNAME = ['pure p', 'sp³', 'sp²', 'sp', 'pure s'];
function hybridPaths(plot, fs) {
  const pos = [], neg = [];
  for (let k = 0; k <= 360; k++) {
    const th = (k * Math.PI) / 180;
    const psi = Math.sqrt(fs) + Math.sqrt(1 - fs) * Math.sqrt(3) * Math.cos(th);
    const rr = Math.abs(psi);
    const pt = `${plot.X(rr * Math.cos(th))} ${plot.Y(rr * Math.sin(th))}`;
    (psi >= 0 ? pos : neg).push(pt);
  }
  return [pos, neg];
}

// ---------- molecular-orbital diagrams for second-row pairs ----------
const MOLS = [['B₂', 6], ['C₂', 8], ['N₂', 10], ['O₂', 12], ['F₂', 14], ['Ne₂', 16]];
// levels in energy order: [name, boxes, bonding?]; up to N₂ the π2p pair sits below σ2p
const levels = (light) => [['σ2s', 1, true], ['σ*2s', 1, false], ...(light ? [['π2p', 2, true], ['σ2p', 1, true]] : [['σ2p', 1, true], ['π2p', 2, true]]), ['π*2p', 2, false], ['σ*2p', 1, false]];
function fillMO(n, light) {
  let left = n;
  return levels(light).map(([name, boxes, bond]) => {
    const take = Math.max(0, Math.min(2 * boxes, left));
    left -= take;
    // Hund's rule: one electron in each box of a pair before any pairs up
    const occ = boxes === 1 ? [take] : take <= 2 ? [Math.min(1, take), Math.max(0, take - 1)] : [2, take - 2];
    return { name, boxes, bond, occ, e: take };
  });
}
const moInfo = (n, light) => {
  const f = fillMO(n, light);
  const b = f.filter((x) => x.bond).reduce((t, x) => t + x.e, 0), a = f.filter((x) => !x.bond).reduce((t, x) => t + x.e, 0);
  return { f, order: (b - a) / 2, unpaired: f.reduce((t, x) => t + x.occ.filter((o) => o === 1).length, 0) };
};
function moFigure({ withCharge = false, goal, solution, mol = 3 } = {}) {
  const params = { m: { min: 0, max: 5, step: 1, value: mol, label: 'Molecule', format: (v) => MOLS[v][0] } };
  if (withCharge) params.q = { min: -1, max: 1, step: 1, value: 0, label: 'Charge', color: 'coral', format: (v) => (v > 0 ? '+1' : v < 0 ? '−1' : '0') };
  const count = (p) => MOLS[p.m][1] - (p.q || 0);
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 10, grid: false, axes: false, height: 380,
    params,
    extra: ({ plot, s, p }) => {
      const light = p.m <= 2, { f } = moInfo(count(p), light);
      const Y = light ? [0.8, 2.1, 4.3, 5.6, 7.3, 9.0] : [0.8, 2.1, 4.0, 5.3, 7.3, 9.0];
      const out = [s('text', { x: plot.X(9.7), y: plot.Y(9.6), 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: 'energy ↑' })];
      f.forEach((lv, k) => {
        const xs = lv.boxes === 1 ? [5] : [4, 6];
        const col = lv.bond ? 'var(--blue)' : 'var(--coral)';
        out.push(s('text', { x: plot.X(1.2), y: plot.Y(Y[k]) + 6, class: 'lbl', style: `fill:${col};${FS(16)}`, text: lv.name }));
        xs.forEach((x, j) => {
          out.push(s('line', { x1: plot.X(x - 0.75), x2: plot.X(x + 0.75), y1: plot.Y(Y[k]), y2: plot.Y(Y[k]), stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round' }));
          const o = lv.occ[j];
          if (o >= 1) out.push(s('text', { x: plot.X(x - (o === 2 ? 0.25 : 0)), y: plot.Y(Y[k]) - 6, 'text-anchor': 'middle', class: 'lbl', style: FS(24), text: '↑' }));
          if (o === 2) out.push(s('text', { x: plot.X(x + 0.25), y: plot.Y(Y[k]) - 6, 'text-anchor': 'middle', class: 'lbl', style: FS(24), text: '↓' }));
        });
      });
      return out;
    },
    readout: (p) => {
      const n = count(p), { order, unpaired } = moInfo(n, p.m <= 2);
      const name = MOLS[p.m][0] + (p.q ? (p.q > 0 ? '⁺' : '⁻') : '');
      return `**${name}**: ${n} valence electrons · bond order **${fix(order, 1)}** · ${unpaired ? `${unpaired} unpaired (attracted to magnets)` : 'all paired'}`;
    },
    goal, solution,
  };
}

export default {
  id: 'shapes',
  subject: 'physics',
  title: 'Molecular Shapes',
  level: 'Intermediate',
  cover: 'shapes',
  tagline: 'Turn molecules in 3D: electron domains, lone pairs, polarity, hybrid orbitals and molecular orbitals.',
  description: r`A Lewis structure says which atoms are joined, but molecules are three-dimensional, and their shapes decide almost everything: why water is a liquid, why carbon dioxide is a gas, how a drug fits its target. Build shapes from repelling electron pairs and turn them with your finger, watch lone pairs squeeze bond angles, add up bond dipoles to see whether a molecule is polar, mix orbitals into hybrids, and fill molecular-orbital diagrams to find out why liquid oxygen sticks to a magnet.`,
  prereq: 'Chemical Bonding',
  chapters: [
    {
      title: 'Electron Domains',
      summary: 'Pairs that push each other apart.',
      lessons: [
        {
          id: 'domains',
          title: 'Pushing Apart',
          summary: 'The VSEPR idea',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Electron pairs keep their distance',
              body: r`Electron pairs repel one another, so the groups of electrons around a central atom spread out **as far apart as possible**. This idea has a clumsy name, **VSEPR** (valence-shell electron-pair repulsion), and it predicts molecular shapes astonishingly well.

Each bond counts as one **electron domain**, whether it is single, double or triple, and so does each lone pair. Change the number of bonded atoms and drag the model to turn it.`,
              widget: lab({ n: 4, fixL: true, nMin: 2, spin: true }),
            },
            {
              type: 'mcq',
              title: 'Carbon dioxide',
              prompt: r`In O=C=O the carbon has two double bonds and no lone pairs. What shape is the molecule?`,
              choices: [
                { t: 'Straight (linear), 180°', ok: true },
                { t: 'Bent, like water', why: 'Water’s oxygen has two lone pairs as well as two bonds. Carbon here has no lone pairs.' },
                { t: 'Triangular, 120°', why: 'A double bond counts as one domain, not two: carbon has just two domains.' },
              ],
              explain: r`Two domains get as far apart as possible on opposite sides: **linear**. A double bond holds more electrons than a single one, but they all sit between the same two atoms, so they count as one domain.`,
            },
            {
              type: 'interactive',
              title: 'Hit 120°',
              prompt: r`Set the model so the bonds are 120° apart and all in one flat plane.`,
              widget: lab({ n: 2, fixL: true, nMin: 2, goal: (st) => (st.n === 3 ? true : { ok: false, msg: st.n < 3 ? 'Two bonds sit 180° apart. Add another.' : 'With that many bonds they can’t all be 120° apart: try fewer.' }), solution: { params: { n: 3 } } }),
              explain: r`Three domains spread into a flat triangle, **trigonal planar**, 120° apart, like the boron trifluoride molecule $\mathrm{BF_3}$ or the carbon in formaldehyde.`,
            },
            {
              type: 'numeric',
              title: 'The tetrahedral angle',
              prompt: r`Methane's four bonds point to the corners of a tetrahedron. Using the model with four bonded atoms, what is the H–C–H angle, in degrees, to one decimal place?`,
              widget: lab({ center: 'C', ligand: 'H', n: 4, fixN: true, fixL: true, spin: true }),
              unit: '°',
              answer: 109.5,
              tol: 0.15,
              wrong: [{ v: 90, why: 'That would be a flat square. In 3D the bonds can get further apart than 90°.' }, { v: 120, why: 'Only three bonds fit at 120°, and only in a flat plane.' }],
              explain: r`$109.5°$ (exactly $\cos^{-1}(-\tfrac13)$). Four bonds in a flat square would be only 90° apart; going into three dimensions lets them spread out much more. This shape underlies nearly all of organic chemistry.`,
            },
            {
              type: 'explain',
              title: 'Six around one',
              body: r`Sulfur hexafluoride has six bonds and no lone pairs. Six domains point to the corners of an **octahedron**: up, down, and four around the middle, every neighbouring pair at 90°.`,
              widget: lab({ center: 'S', ligand: 'F', n: 6, fixN: true, fixL: true, spin: true, readout: false, h: 290 }),
            },
            {
              type: 'mcq',
              title: 'Why not a square?',
              prompt: 'Why isn’t methane a flat square, with its hydrogens at 90° to each other?',
              choices: [
                { t: 'In 3D the four pairs can be further apart (109.5°), which lowers their repulsion', ok: true },
                { t: 'Carbon atoms are round, so the bonds must point in every direction', why: 'The shape comes from the electron pairs repelling, not from the atom’s outline.' },
                { t: 'Hydrogen atoms attract one another', why: 'They don’t; the bonding pairs repel.' },
              ],
              explain: r`Repulsion falls quickly with distance, so the pairs settle where they are furthest apart. In a flat square the nearest pairs are 90° apart; in a tetrahedron, every pair is 109.5° apart.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Two kinds of angle',
              prompt: r`In most shapes every bond angle is the same. Find the shape (with no lone pairs) that has **two different** bond angles between neighbouring bonds.`,
              widget: lab({ n: 2, fixL: true, nMin: 2, goal: (st) => (st.n === 5 ? true : { ok: false, msg: 'In this shape every neighbouring pair is the same angle apart. Keep looking.' }), solution: { params: { n: 5 } } }),
              explain: r`Five domains make a **trigonal bipyramid**: three bonds around the middle 120° apart (the **equatorial** positions) and two on the axis at 90° to them (the **axial** positions). There is no way to put five points on a sphere all equally far apart.`,
            },
          ],
          recap: [
            'Electron domains (bonds of any order, and lone pairs) spread out as far as possible.',
            '2 → linear 180°, 3 → trigonal planar 120°, 4 → tetrahedral 109.5°, 5 → trigonal bipyramid, 6 → octahedral 90°.',
          ],
        },
        {
          id: 'lone',
          title: 'Lone Pairs Take Space',
          summary: 'Ammonia, water and squeezed angles',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Invisible but bulky',
              body: r`Lone pairs count as electron domains too, but we can't "see" them in the molecule's shape: the **shape** is named after where the atoms are. A lone pair is held by only one nucleus, so it spreads out wider than a bonding pair and squeezes the bonds a little closer together.

Lone pairs are drawn as dashed teal lobes. Add some and watch the bonds close up.`,
              widget: lab({ n: 3, l: 0, nMax: 4, lMax: 2, spin: true }),
            },
            {
              type: 'interactive',
              title: 'Ammonia',
              prompt: r`Ammonia's nitrogen has three bonds and one lone pair. Set up the model.`,
              widget: lab({ center: 'N', ligand: 'H', n: 4, l: 0, nMax: 4, lMax: 2, goal: (st) => (st.n === 3 && st.l === 1 ? true : { ok: false, msg: 'Nitrogen has five valence electrons: three go into bonds, two into a lone pair.' }), solution: { params: { n: 3, l: 1 } } }),
              explain: r`Four domains still point roughly to the corners of a tetrahedron, but only three hold atoms. The shape is a **trigonal pyramid**: nitrogen at the top, three hydrogens below, like a squat tripod.`,
            },
            {
              type: 'numeric',
              title: 'A squeezed angle',
              prompt: r`In the model of ammonia, what is the H–N–H angle? (Nearest whole degree.)`,
              widget: lab({ center: 'N', ligand: 'H', n: 3, l: 1, fixN: true, fixL: true, spin: true }),
              unit: '°',
              answer: 107,
              tol: 1,
              wrong: [{ v: 109.5, why: 'That would be true if the lone pair were no bigger than a bonding pair. Read the model.' }],
              explain: r`About 107°: measured in real ammonia, 106.8°. The fat lone pair pushes the three N–H bonds 2.5° closer than the perfect tetrahedral angle.`,
            },
            {
              type: 'interactive',
              title: 'Water',
              prompt: r`Now set up water: oxygen with two bonds and two lone pairs. Then turn it to see its shape.`,
              widget: lab({ center: 'O', ligand: 'H', n: 4, l: 0, nMax: 4, lMax: 2, goal: (st) => (st.n === 2 && st.l === 2 ? true : { ok: false, msg: 'Oxygen has six valence electrons: two in bonds, four in two lone pairs.' }), solution: { params: { n: 2, l: 2 } } }),
              explain: r`Two lone pairs squeeze harder still: the H–O–H angle is about 104.5°. The shape is **bent**. Water's bend is why it is polar, and that in turn is behind its high boiling point and its talent for dissolving things.`,
            },
            {
              type: 'mcq',
              title: 'Water versus carbon dioxide',
              prompt: r`$\mathrm{CO_2}$ and $\mathrm{H_2O}$ both have a central atom with two bonds. Why is one straight and the other bent?`,
              choices: [
                { t: 'Oxygen in water also has two lone pairs; carbon in CO₂ has none', ok: true },
                { t: 'Hydrogen atoms are lighter, so they bend more easily', why: 'Shape comes from electron domains, not from the mass of the atoms.' },
                { t: 'Double bonds are stiffer than single bonds', why: 'Stiffness doesn’t set the angle; the number of domains does.' },
              ],
              explain: r`Water's oxygen has **four** domains (tetrahedral arrangement, two of them invisible lone pairs), so the two bonds are about 104.5° apart. Carbon in $\mathrm{CO_2}$ has just two domains, on opposite sides.`,
            },
            {
              type: 'order',
              title: 'Rank the angles',
              prompt: 'Order these molecules by bond angle, largest first.',
              items: [r`$\mathrm{CH_4}$ (no lone pairs)`, r`$\mathrm{NH_3}$ (one lone pair)`, r`$\mathrm{H_2O}$ (two lone pairs)`],
              explain: r`109.5°, 107°, 104.5°. Each extra lone pair squeezes the bonds a little more.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Sulfur dioxide',
              prompt: r`In $\mathrm{SO_2}$ (drawn O=S–O with charges), sulfur has two bonded atoms and one lone pair. Set the model and note its shape.`,
              widget: lab({ center: 'S', ligand: 'O', n: 4, l: 0, nMax: 4, lMax: 2, goal: (st) => (st.n === 2 && st.l === 1 ? true : { ok: false, msg: 'Count domains on sulfur: two bonds (whatever their order) plus one lone pair.' }), solution: { params: { n: 2, l: 1 } } }),
              explain: r`Three domains in a triangle with one of them a lone pair: **bent**, with an angle a bit under 120° (119° in real $\mathrm{SO_2}$). Same name as water's shape, but from a different number of domains.`,
            },
          ],
          recap: [
            'Shape is named from the atoms; lone pairs still take up space.',
            'Lone pairs squeeze bond angles: CH₄ 109.5°, NH₃ 107°, H₂O 104.5°.',
          ],
        },
        {
          id: 'bigger',
          title: 'Five and Six Domains',
          summary: 'Seesaws, T-shapes and squares',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Two kinds of seat',
              body: r`In a trigonal bipyramid the five positions are not alike. An **axial** position (top or bottom) has three neighbours at 90°; an **equatorial** position (around the middle) has only two at 90° and two further away at 120°.

A lone pair, being bulky, takes the roomier **equatorial** seat. Sulfur tetrafluoride, $\mathrm{SF_4}$, has four bonds and one lone pair, which gives this **seesaw** shape.`,
              widget: lab({ center: 'S', ligand: 'F', n: 4, l: 1, fixN: true, fixL: true, spin: true }),
            },
            {
              type: 'interactive',
              title: 'Pick a seat',
              prompt: r`Here are five domains around phosphorus. Tap the atom whose place a lone pair would take if one bond were swapped for a lone pair.`,
              widget: { kind: 'mol3d', h: 290, mode: 'pick', ...shape3d({ center: 'P', ligands: ['Cl', 'Cl', 'Cl', 'Cl', 'Cl'] }), goal: (st) => (st.picked.length === 1 && [1, 2, 3].includes(st.picked[0]) ? true : st.picked.length !== 1 ? { ok: false, msg: 'Tap just one atom.' } : { ok: false, msg: 'That’s an axial position: it has three neighbours at 90°. Turn the model to find a roomier one.' }), pick: { answer: [1] } },
              explain: r`Any of the three **equatorial** atoms. From there a lone pair has only two neighbours at 90°, instead of three from an axial position. Fewer close neighbours, less repulsion.`,
            },
            {
              type: 'numeric',
              title: 'Close neighbours',
              prompt: r`In a trigonal bipyramid, how many of the other four positions are at 90° to an **axial** position?`,
              answer: 3,
              wrong: [{ v: 2, why: 'That’s the count for an equatorial position.' }, { v: 4, why: 'The opposite axial position is 180° away.' }],
              explain: r`Three: all of the equatorial positions. The other axial position is straight across, 180° away.`,
            },
            {
              type: 'interactive',
              title: 'Make a T',
              prompt: r`Chlorine trifluoride, $\mathrm{ClF_3}$, is T-shaped. Find the combination of bonds and lone pairs that gives a T.`,
              widget: lab({ center: 'Cl', ligand: 'F', n: 4, l: 0, nMin: 2, lMax: 3, goal: (st) => (st.shape === 'T-shaped' ? true : { ok: false, msg: `That’s ${st.shape || 'not a shape that fits'}. Think five domains, with two of the three equatorial seats taken by lone pairs.` }), solution: { params: { n: 3, l: 2 } } }),
              explain: r`Three bonds and two lone pairs: five domains, with both lone pairs equatorial. What's left is one equatorial and two axial fluorines: a T. Chlorine has seven valence electrons, three in bonds and four in two lone pairs.`,
            },
            {
              type: 'mcq',
              title: 'A noble gas compound',
              prompt: r`Xenon, a "noble" gas, forms $\mathrm{XeF_4}$: four bonds and two lone pairs. What shape?`,
              choices: [
                { t: 'Square planar', ok: true },
                { t: 'Tetrahedral', why: 'Tetrahedral is four domains in all. Xenon has six.' },
                { t: 'Seesaw', why: 'The seesaw is four bonds and one lone pair (five domains).' },
              ],
              explain: r`Six domains make an octahedron, and the two lone pairs go **opposite** each other (180° apart, as far as possible). The four fluorines left form a flat square around the xenon.`,
              widget: lab({ center: 'Xe', ligand: 'F', n: 4, l: 2, fixN: true, fixL: true, readout: false, h: 260 }),
            },
            {
              type: 'interactive',
              title: 'Straight again',
              prompt: r`Xenon difluoride, $\mathrm{XeF_2}$, is perfectly straight, even though xenon has three lone pairs. Show how.`,
              widget: lab({ center: 'Xe', ligand: 'F', n: 4, l: 0, nMin: 2, lMax: 3, goal: (st) => (st.n === 2 && st.l === 3 ? true : { ok: false, msg: 'Xenon has two bonds here. How many lone pairs make the molecule straight?' }), solution: { params: { n: 2, l: 3 } } }),
              explain: r`Two bonds plus three lone pairs make five domains. The three lone pairs take all three equatorial seats, leaving the two fluorines on the axis: **linear**, 180°.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why not flat?',
              prompt: r`$\mathrm{ClF_3}$ has three fluorines. Why isn't it a flat triangle like $\mathrm{BF_3}$?`,
              choices: [
                { t: 'Chlorine also has two lone pairs, making five domains, not three', ok: true },
                { t: 'Fluorine atoms repel each other more on chlorine', why: 'The fluorines are the same; the difference is the central atom’s lone pairs.' },
                { t: 'Chlorine is too small for a triangle', why: 'Chlorine is bigger than boron. It’s about the number of electron domains.' },
              ],
              explain: r`Boron in $\mathrm{BF_3}$ has three domains, so it's trigonal planar. Chlorine has five (three bonds, two lone pairs), arranged as a trigonal bipyramid, so its three fluorines form a T. Always count all the domains first, then name the shape from the atoms.`,
            },
          ],
          recap: [
            'Trigonal bipyramid: lone pairs go equatorial (fewer 90° neighbours).',
            'Seesaw (4+1), T-shape (3+2), linear (2+3); octahedral family: square pyramid (5+1), square planar (4+2).',
          ],
        },
      ],
    },
    {
      title: 'Polarity',
      summary: 'Uneven sharing, and when it cancels.',
      lessons: [
        {
          id: 'polar-bonds',
          title: 'Polar Bonds',
          summary: 'Tug of war for the shared pair',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Unequal sharing',
              body: r`Atoms differ in how hard they pull on a shared pair: their **electronegativity**. Fluorine pulls hardest (3.98), then oxygen (3.44), nitrogen and chlorine (about 3.0), carbon (2.55), hydrogen (2.20), and metals much less.

When the two atoms of a bond differ, the shared pair sits closer to the greedier atom. That end becomes slightly negative ($\delta^-$), the other slightly positive ($\delta^+$): a **polar bond**. Slide the difference and watch the shared electrons move.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 230,
                params: { d: { min: 0, max: 2.5, step: 0.1, value: 1.2, label: 'Difference', color: 'coral' } },
                under: ({ plot, p, s }) => {
                  const shift = Math.min(2.2, p.d * 1.0);
                  return [s('ellipse', { cx: plot.X(5 + shift), cy: plot.Y(2.5), rx: plot.X(2.6 - shift * 0.35) - plot.X(0), ry: 52 - shift * 6, fill: 'var(--blue)', 'fill-opacity': 0.22, stroke: 'var(--blue)', 'stroke-opacity': 0.5, 'stroke-width': 2 })];
                },
                extra: ({ plot, p, s }) => [
                  s('circle', { cx: plot.X(3.5), cy: plot.Y(2.5), r: 24, fill: 'var(--card)', stroke: 'var(--ink-3)', 'stroke-width': 3 }),
                  s('circle', { cx: plot.X(6.5), cy: plot.Y(2.5), r: 24, fill: 'var(--coral-soft)', stroke: 'var(--coral)', 'stroke-width': 3 }),
                  s('text', { x: plot.X(3.5), y: plot.Y(2.5) + 6, 'text-anchor': 'middle', class: 'lbl', style: FS(17), text: 'A' }),
                  s('text', { x: plot.X(6.5), y: plot.Y(2.5) + 6, 'text-anchor': 'middle', class: 'lbl', style: FS(17), text: 'B' }),
                  s('text', { x: plot.X(3.5), y: plot.Y(4.3), 'text-anchor': 'middle', class: 'lbl', style: `opacity:${Math.min(1, p.d / 0.5)};${FS(18)}`, text: p.d >= 1.8 ? '+' : 'δ+' }),
                  s('text', { x: plot.X(6.5), y: plot.Y(4.3), 'text-anchor': 'middle', class: 'lbl', style: `opacity:${Math.min(1, p.d / 0.5)};${FS(18)}`, text: p.d >= 1.8 ? '−' : 'δ−' }),
                ],
                readout: (p) => `electronegativity difference ${fix(p.d, 1)} · ${p.d < 0.4 ? '**non-polar** covalent: shared almost equally' : p.d < 1.8 ? '**polar** covalent: shared unequally' : 'mostly **ionic**: the pair has all but moved over'}`,
              },
              after: r`These cut-offs (0.4 and about 1.8) are rules of thumb: bonding shades smoothly from equal sharing to complete transfer.`,
            },
            {
              type: 'mcq',
              title: 'Most polar',
              prompt: 'Which bond is the most polar?',
              choices: [
                { t: 'H–F', ok: true },
                { t: 'H–Cl', why: 'Chlorine (3.16) is less electronegative than fluorine (3.98).' },
                { t: 'H–Br', why: 'Bromine (2.96) pulls less than fluorine or chlorine.' },
                { t: 'H–I', why: 'Iodine (2.66) is barely more electronegative than hydrogen (2.20).' },
              ],
              explain: r`H–F: the difference is $3.98 - 2.20 = 1.78$, the largest of the four. Electronegativity falls going down the halogen column, so the bonds get less polar from F to I.`,
            },
            {
              type: 'numeric',
              title: 'The O–H bond',
              prompt: r`Oxygen's electronegativity is 3.44 and hydrogen's 2.20. What is the difference?`,
              answer: 1.24,
              tol: 0.005,
              explain: r`$3.44 - 2.20 = 1.24$: a strongly polar bond, with the oxygen end negative. Every O–H bond in water, alcohols and sugars carries this charge split.`,
            },
            {
              type: 'explain',
              title: 'Bond dipoles as arrows',
              body: r`A polar bond is a small **dipole**: a separated pair of charges. Chemists draw it as an arrow along the bond pointing towards the negative end, its length showing how polar the bond is. In hydrogen chloride the arrow points at chlorine.`,
              widget: { kind: 'mol3d', h: 220, atoms: [['H', -0.65, 0, 0], ['Cl', 0.65, 0, 0]], bonds: [[0, 1, 1]], dipoles: true, turn: [0, 0], scale: 110, readout: false },
            },
            {
              type: 'mcq',
              title: 'Carbon and hydrogen',
              prompt: r`Is the C–H bond polar? (C 2.55, H 2.20)`,
              choices: [
                { t: 'Barely: the difference is only 0.35', ok: true },
                { t: 'Strongly: carbon is far more electronegative', why: 'A difference of 0.35 is small: less than the 0.4 rule of thumb.' },
                { t: 'It’s ionic', why: 'Carbon and hydrogen share electrons nearly equally.' },
              ],
              explain: r`$2.55 - 2.20 = 0.35$, almost equal sharing. That's why hydrocarbons such as oil, wax and petrol are non-polar, and why they don't mix with water.`,
            },
            {
              type: 'order',
              kicker: 'Challenge',
              title: 'Least to most polar',
              prompt: 'Order these bonds from least to most polar. (Electronegativities: H 2.20, C 2.55, N 3.04, O 3.44, F 3.98.)',
              items: ['C–H', 'N–H', 'O–H', 'F–H'],
              explain: r`Differences 0.35, 0.84, 1.24, 1.78. Moving right along the second row, atoms pull harder on electrons, so bonds to hydrogen get steadily more polar.`,
            },
          ],
          recap: [
            'Electronegativity: how hard an atom pulls on a shared pair (F > O > N ≈ Cl > C > H).',
            'Bigger difference → more polar bond; very large → ionic.',
            'Bond dipole arrows point to the negative end.',
          ],
        },
        {
          id: 'polar-molecules',
          title: 'Polar or Non-polar?',
          summary: 'When bond dipoles cancel',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Adding arrows',
              body: r`A molecule's overall polarity is the **sum** of its bond dipoles, added as arrows. In carbon dioxide each C=O bond is polar, but the two arrows point in opposite directions and cancel exactly: $\mathrm{CO_2}$ is non-polar. Turn it to check.`,
              widget: lab({ center: 'C', ligand: 'O', n: 2, fixN: true, fixL: true, dipoles: true, vsepr: { center: 'C', ligand: 'O', order: 2 }, spin: true }),
              after: r`The violet arrow, when there is one, is the molecule's net dipole.`,
            },
            {
              type: 'explain',
              title: 'Water doesn’t cancel',
              body: r`Water's two O–H dipoles both point up towards the oxygen. Because the molecule is bent they don't cancel: they add to a net dipole pointing from the hydrogens to the oxygen. Water is strongly **polar**.`,
              widget: lab({ center: 'O', ligand: 'H', n: 2, l: 2, fixN: true, fixL: true, dipoles: true }),
            },
            {
              type: 'interactive',
              title: 'Polar bonds, non-polar molecule',
              prompt: r`Each C–Cl bond here is polar. Find a shape with **at least three** chlorines whose bond dipoles cancel completely.`,
              widget: lab({ center: 'C', ligand: 'Cl', n: 3, l: 1, nMin: 2, lMax: 2, dipoles: true, goal: (st) => (st.n + st.l > 6 ? { ok: false, msg: 'Too many domains.' } : st.n >= 3 && st.dipole < 0.05 ? true : st.n < 3 ? { ok: false, msg: 'Use at least three chlorines.' } : { ok: false, msg: 'There’s still a violet net-dipole arrow: the shape isn’t symmetrical enough.' }), solution: { params: { n: 4, l: 0 } } }),
              explain: r`Many work: trigonal planar (3 + 0), tetrahedral (4 + 0, like $\mathrm{CCl_4}$), square planar (4 + 2), trigonal bipyramid and octahedron. What they share is **symmetry**: identical bonds arranged evenly in every direction cancel.`,
            },
            {
              type: 'mcq',
              title: 'Swap one atom',
              prompt: r`Carbon tetrachloride, $\mathrm{CCl_4}$, is non-polar. What about chloroform, $\mathrm{CHCl_3}$, with one chlorine replaced by hydrogen?`,
              widget: { kind: 'mol3d', h: 250, ...shape3d({ center: 'C', ligands: ['H', 'Cl', 'Cl', 'Cl'] }), dipoles: true, spin: true },
              choices: [
                { t: 'Polar: the bonds are no longer all the same, so they don’t cancel', ok: true },
                { t: 'Non-polar: it’s still tetrahedral', why: 'The shape is (nearly) the same, but the C–H dipole is much smaller than the C–Cl ones, so they no longer balance.' },
              ],
              explain: r`Same shape, different bonds. The three C–Cl dipoles are no longer balanced by a fourth, so there's a net dipole pointing towards the chlorines. Chloroform is polar.`,
            },
            {
              type: 'interactive',
              title: 'Make it polar',
              prompt: r`With exactly three bonded atoms, find a shape that **is** polar.`,
              widget: lab({ center: 'N', ligand: 'F', n: 3, l: 0, fixN: true, lMax: 2, dipoles: true, goal: (st) => (st.dipole > 0.05 ? true : { ok: false, msg: 'Still symmetrical. Try adding lone pairs.' }), solution: { params: { l: 1 } } }),
              explain: r`Add a lone pair: three bonds plus one lone pair is a trigonal pyramid, like $\mathrm{NF_3}$ or ammonia. The three bonds all lean the same way, so their dipoles add up. (With two lone pairs you get a T-shape, also polar.)`,
            },
            {
              type: 'mcq',
              title: 'Mirror twins',
              prompt: 'These two molecules have the same atoms and bonds, but the chlorines are placed differently around a rigid C=C double bond. Which is polar?',
              widget: view(null, { atoms: [['C', 110, 110], ['C', 190, 110], ['Cl', 60, 45], ['Cl', 240, 45], ['H', 60, 175], ['H', 240, 175], ['C', 410, 110], ['C', 490, 110], ['Cl', 360, 45], ['H', 540, 45], ['H', 360, 175], ['Cl', 540, 175]], bonds: [[0, 1, 2], [0, 2, 1], [1, 3, 1], [0, 4, 1], [1, 5, 1], [6, 7, 2], [6, 8, 1], [7, 9, 1], [6, 10, 1], [7, 11, 1]], lonePairs: false, h: 220, extra: ({ s }) => [s('text', { x: 150, y: 212, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'cis (same side)' }), s('text', { x: 450, y: 212, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'trans (opposite)' })] }),
              choices: [
                { t: 'The cis one', ok: true },
                { t: 'The trans one', why: 'In the trans molecule the two C–Cl dipoles point in opposite directions and cancel.' },
                { t: 'Both', why: 'One of them is symmetrical enough for the dipoles to cancel.' },
              ],
              explain: r`In *cis*-1,2-dichloroethene both chlorines are on the same side, so their dipoles add; in *trans* they point opposite ways and cancel. Same formula, different shape, different properties: cis boils at 60 °C, trans at 48 °C.`,
            },
            {
              type: 'multi',
              kicker: 'Challenge',
              title: 'Sort them',
              prompt: 'Which of these molecules are polar?',
              choices: [
                { t: r`$\mathrm{H_2O}$ (bent)`, ok: true },
                { t: r`$\mathrm{NH_3}$ (trigonal pyramidal)`, ok: true },
                { t: r`$\mathrm{SO_2}$ (bent)`, ok: true },
                { t: r`$\mathrm{CH_2Cl_2}$ (tetrahedral, two kinds of bond)`, ok: true },
                { t: r`$\mathrm{CO_2}$ (linear)`, why: 'Two equal dipoles in opposite directions cancel.' },
                { t: r`$\mathrm{BF_3}$ (trigonal planar)`, why: 'Three equal dipoles at 120° cancel.' },
                { t: r`$\mathrm{SF_6}$ (octahedral)`, why: 'Six equal dipoles in opposite pairs cancel.' },
              ],
              explain: r`A molecule is non-polar when identical bonds are arranged symmetrically (linear, trigonal planar, tetrahedral, octahedral with all-identical atoms). Lone pairs on the central atom, or a mix of different atoms around it, usually leave a net dipole.`,
            },
          ],
          recap: [
            'Net polarity = sum of bond dipoles as arrows.',
            'Symmetrical shapes with identical bonds are non-polar (CO₂, BF₃, CCl₄, SF₆).',
            'Lone pairs or mixed substituents usually make a molecule polar.',
          ],
        },
      ],
    },
    {
      title: 'Orbitals',
      summary: 'What the bonds are made of.',
      lessons: [
        {
          id: 'hybrid',
          title: 'Hybrid Orbitals',
          summary: 'Mixing s and p',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'A puzzle about carbon',
              body: r`Carbon's valence electrons live in one round **s** orbital and three dumbbell-shaped **p** orbitals at 90° to each other. Yet methane's four bonds are identical and 109.5° apart. How?

The orbitals **mix** into **hybrids**: one s plus three p make four identical $\mathrm{sp^3}$ hybrids pointing to the corners of a tetrahedron. Each hybrid is lopsided, with a big lobe on one side that reaches out to overlap with a partner. Here is a slice through one orbital as the s share changes:`,
              widget: {
                kind: 'graph', xmin: -2.6, xmax: 2.9, ymin: -2, ymax: 2, grid: false, axes: false, height: 260, equal: true,
                params: { k: { min: 0, max: 4, step: 1, value: 1, label: 'Orbital', format: (v) => MIXNAME[v] } },
                extra: ({ plot, p, s }) => {
                  const [pos, neg] = hybridPaths(plot, MIX[p.k]);
                  const out = [];
                  if (pos.length > 1) out.push(s('path', { d: 'M' + pos.join('L') + 'Z', fill: 'var(--blue)', 'fill-opacity': 0.28, stroke: 'var(--blue)', 'stroke-width': 3 }));
                  if (neg.length > 1) out.push(s('path', { d: 'M' + neg.join('L') + 'Z', fill: 'var(--coral)', 'fill-opacity': 0.28, stroke: 'var(--coral)', 'stroke-width': 3 }));
                  out.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 5, fill: 'var(--ink)' }));
                  return out;
                },
                readout: (p) => `**${MIXNAME[p.k]}** · ${Math.round(MIX[p.k] * 100)}% s character · the two colours are the two signs of the wave`,
              },
            },
            {
              type: 'mcq',
              title: 'Count the domains',
              prompt: 'How do you know which hybrid an atom uses?',
              choices: [
                { t: 'Count its electron domains: 4 → sp³, 3 → sp², 2 → sp', ok: true },
                { t: 'Count only its bonded atoms', why: 'Lone pairs need hybrid orbitals too: ammonia’s N has three atoms but four domains (sp³).' },
                { t: 'It’s always sp³ for carbon', why: 'Carbon in ethene (three domains) is sp², and in ethyne (two) is sp.' },
              ],
              explain: r`One hybrid per domain: four domains need four hybrids (one s + three p = $\mathrm{sp^3}$); three need three ($\mathrm{sp^2}$, leaving one p orbital unmixed); two need two (sp, leaving two p orbitals).`,
            },
            {
              type: 'numeric',
              title: 'How much s?',
              prompt: r`An $\mathrm{sp^2}$ hybrid is made from one s orbital and two p orbitals. What percentage of it is s character? (One decimal place.)`,
              unit: '%',
              answer: 33.3,
              tol: 0.06,
              wrong: [{ v: 50, why: 'That’s sp (one s, one p).' }, { v: 25, why: 'That’s sp³ (one s, three p).' }],
              explain: r`One part s in three parts total: $\tfrac13 \approx 33.3\%$. More s character pulls electrons closer to the nucleus, so sp carbons are slightly more electronegative than $\mathrm{sp^3}$ ones.`,
            },
            {
              type: 'mcq',
              title: 'Ammonia’s nitrogen',
              prompt: r`What hybridisation does the nitrogen in $\mathrm{NH_3}$ have?`,
              choices: [
                { t: r`$\mathrm{sp^3}$`, ok: true },
                { t: r`$\mathrm{sp^2}$`, why: 'Three bonded atoms, but the lone pair is a fourth domain.' },
                { t: 'sp', why: 'Nitrogen here has four domains.' },
              ],
              explain: r`Four domains (three N–H bonds and a lone pair) means four $\mathrm{sp^3}$ hybrids, one of them holding the lone pair. That's why the angles are close to tetrahedral.`,
            },
            {
              type: 'interactive',
              title: 'Colour by hybrid',
              prompt: r`Tap each carbon to give it a colour. Carbons with the same hybridisation should share a colour; different kinds need different colours.`,
              widget: pick({ smiles: 'CC#CC=C', colors: 3, h: 240, bond: 80, splitMsg: 'Two carbons with the same number of domains have different colours.', mergeMsg: 'Two different kinds of carbon share a colour. Count each carbon’s domains.' , answer: [[0], [1, 2], [3, 4]] }),
              explain: r`The $\mathrm{CH_3}$ carbon has four single bonds: $\mathrm{sp^3}$. The two carbons of the triple bond each have two domains: sp. The two carbons of the double bond each have three: $\mathrm{sp^2}$.`,
            },
            {
              type: 'explain',
              title: 'Leftover p orbitals',
              body: r`An $\mathrm{sp^2}$ carbon has one p orbital left over, standing at right angles to its three hybrids. In ethene the leftover p orbitals on the two carbons lie side by side and overlap above and below the molecule: the second bond of the C=C. That is why ethene is completely flat.`,
              widget: { kind: 'mol3d', h: 240, atoms: [['C', -0.67, 0, 0], ['C', 0.67, 0, 0], ['H', -1.25, 0.93, 0], ['H', -1.25, -0.93, 0], ['H', 1.25, 0.93, 0], ['H', 1.25, -0.93, 0]], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], turn: [-25, 35], spin: true, readout: false, h: 270, scale: 88 },
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Acetone',
              prompt: r`Acetone (nail-polish remover) is $\mathrm{(CH_3)_2C{=}O}$. How many of its three carbons are $\mathrm{sp^3}$?`,
              answer: 2,
              wrong: [{ v: 3, why: 'The middle carbon has a double bond to oxygen: three domains.' }, { v: 1, why: 'Both methyl ($\\mathrm{CH_3}$) carbons have four single bonds.' }],
              explain: r`The two $\mathrm{CH_3}$ carbons are $\mathrm{sp^3}$; the central carbon, with three domains (two C–C and one C=O), is $\mathrm{sp^2}$, so the C=O end of acetone is flat.`,
            },
          ],
          recap: [
            'Hybrids: one per electron domain (4 → sp³, 3 → sp², 2 → sp).',
            'Leftover p orbitals form π bonds.',
          ],
        },
        {
          id: 'sigma-pi',
          title: 'Sigma & Pi Bonds',
          summary: 'Head-on and side by side',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'Two ways to overlap',
              body: r`A **σ (sigma) bond** forms when orbitals overlap **head-on**, along the line between the two nuclei. Every single bond is a σ bond.

A **π (pi) bond** forms when two parallel p orbitals overlap **side by side**, above and below that line. A double bond is one σ plus one π; a triple bond is one σ plus two π.`,
            },
            {
              type: 'numeric',
              title: 'Count σ in ethene',
              prompt: r`How many σ bonds are there in ethene, $\mathrm{H_2C{=}CH_2}$?`,
              unit: 'σ bonds',
              answer: 5,
              wrong: [{ v: 6, why: 'The double bond contains only one σ bond; its second bond is π.' }, { v: 4, why: 'Don’t forget the σ part of the C=C double bond.' }],
              explain: r`Four C–H bonds plus the σ part of the C=C: five σ bonds and one π bond.`,
            },
            {
              type: 'numeric',
              title: 'Count π in HCN',
              prompt: r`How many π bonds are there in hydrogen cyanide, H–C≡N?`,
              unit: 'π bonds',
              answer: 2,
              wrong: [{ v: 3, why: 'One of the triple bond’s three is a σ bond.' }],
              explain: r`A triple bond is one σ + two π, the two π bonds at right angles to each other. The C–H bond is σ only.`,
            },
            {
              type: 'interactive',
              title: 'Twist a double bond',
              prompt: r`The π bond needs the two p orbitals to stay parallel. Twist one end of ethene until the π bond is completely broken.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 250,
                params: { a: { min: 0, max: 90, step: 5, value: 0, label: 'Twist', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => {
                  const c = Math.cos((p.a * Math.PI) / 180), out = [];
                  const lobe = (x, k, sign) => s('ellipse', { cx: plot.X(x), cy: plot.Y(2.5) - sign * 42 * k, rx: 22 + 12 * (1 - k), ry: 40 * k + 14 * (1 - k), fill: sign > 0 ? 'var(--blue)' : 'var(--coral)', 'fill-opacity': 0.25, stroke: sign > 0 ? 'var(--blue)' : 'var(--coral)', 'stroke-width': 2.5 });
                  out.push(s('line', { x1: plot.X(3.6), x2: plot.X(6.4), y1: plot.Y(2.5), y2: plot.Y(2.5), stroke: 'var(--ink-2)', 'stroke-width': 8, 'stroke-linecap': 'round' }));
                  out.push(lobe(3.6, 1, 1), lobe(3.6, 1, -1), lobe(6.4, Math.abs(c), 1), lobe(6.4, Math.abs(c), -1));
                  if (c > 0.05) out.push(s('rect', { x: plot.X(3.9), y: plot.Y(2.5) - 92, width: plot.X(6.1) - plot.X(3.9), height: 20, rx: 10, fill: 'var(--violet)', 'fill-opacity': 0.35 * c }), s('rect', { x: plot.X(3.9), y: plot.Y(2.5) + 72, width: plot.X(6.1) - plot.X(3.9), height: 20, rx: 10, fill: 'var(--violet)', 'fill-opacity': 0.35 * c }));
                  out.push(s('circle', { cx: plot.X(3.6), cy: plot.Y(2.5), r: 17, fill: 'var(--ink)' }), s('circle', { cx: plot.X(6.4), cy: plot.Y(2.5), r: 17, fill: 'var(--ink)' }));
                  return out;
                },
                readout: (p) => `side-by-side overlap: **${fix(100 * Math.cos((p.a * Math.PI) / 180), 0)}%**${p.a === 90 ? ' · the π bond is broken' : ''}`,
                goal: (p) => (p.a === 90 ? true : { ok: false, msg: 'There is still some overlap. Keep twisting.' }),
                solution: { a: 90 },
              },
              explain: r`At 90° the p orbitals are at right angles and don't overlap at all: the π bond is gone. That costs about 270 kJ/mol, far more than everyday heat supplies, so double bonds don't twist. This is why *cis* and *trans* isomers don't turn into one another.`,
            },
            {
              type: 'mcq',
              title: 'Free to spin?',
              prompt: 'The two ends of ethane (C–C single bond) spin freely, but those of ethene (C=C) don’t. Why?',
              choices: [
                { t: 'A σ bond overlaps the same however it turns; a π bond needs the p orbitals parallel', ok: true },
                { t: 'Double bonds are twice as long', why: 'Double bonds are shorter, not longer.' },
                { t: 'Hydrogen atoms lock the double bond', why: 'It’s the π overlap, not the hydrogens, that resists twisting.' },
              ],
              explain: r`A σ bond is symmetric around the bond axis, like an axle, so turning doesn't change the overlap. A π bond is like two flat planks glued side by side: twist one and they come apart.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Vinegar’s σ bonds',
              prompt: r`Count the σ bonds in acetic acid, $\mathrm{CH_3{-}C({=}O){-}O{-}H}$.`,
              unit: 'σ bonds',
              answer: 7,
              wrong: [{ v: 8, why: 'The C=O double bond contributes only one σ bond.' }, { v: 6, why: 'Count: three C–H, C–C, C=O (σ part), C–O and O–H.' }],
              explain: r`Three C–H, one C–C, the σ part of C=O, one C–O and one O–H: 7 σ bonds, plus 1 π bond.`,
            },
          ],
          recap: [
            'σ: head-on overlap (every single bond); π: side-by-side p overlap.',
            'Double = σ + π, triple = σ + 2π.',
            'π bonds stop rotation: the reason cis/trans isomers exist.',
          ],
        },
        {
          id: 'mo',
          title: 'Molecular Orbitals',
          summary: 'Why oxygen is magnetic',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Orbitals that belong to the whole molecule',
              body: r`When two atoms bond, their atomic orbitals combine into **molecular orbitals** spread over both. Two waves can add in step (a **bonding** orbital, lower in energy, electrons between the nuclei) or out of step (an **antibonding** orbital, marked *, higher in energy, electrons pushed outside).

Electrons fill the lowest orbitals first, two per orbital. The **bond order** is
$$\text{bond order} = \frac{\text{bonding electrons} - \text{antibonding electrons}}{2}$$
For $\mathrm{H_2}$: two electrons in σ1s and none in σ*1s, bond order 1.`,
            },
            {
              type: 'numeric',
              title: 'No helium molecule',
              prompt: r`Two helium atoms bring four electrons: two go into σ1s and two into σ*1s. What is the bond order of $\mathrm{He_2}$?`,
              answer: 0,
              wrong: [{ v: 2, why: 'Subtract the antibonding electrons: (2 − 2) ÷ 2.' }, { v: 1, why: 'The two antibonding electrons cancel the two bonding ones.' }],
              explain: r`$(2 - 2) \div 2 = 0$: no bond, which is why helium is a gas of single atoms. Lewis structures can't easily explain this; orbitals can.`,
            },
            {
              type: 'explain',
              title: 'The second row',
              body: r`For pairs of second-row atoms the valence orbitals are 2s and 2p, giving the ladder below (blue bonding, coral antibonding). In degenerate pairs (π and π*), electrons go one per orbital before pairing up (Hund's rule). Up to $\mathrm{N_2}$ the π2p pair lies below σ2p; from $\mathrm{O_2}$ on the order swaps.`,
              widget: moFigure({ mol: 2 }),
            },
            {
              type: 'numeric',
              title: 'Bond order of O₂',
              prompt: r`Here is the diagram for $\mathrm{O_2}$, with its 12 valence electrons. What is its bond order?`,
              widget: moFigure({ mol: 3 }),
              answer: 2,
              wrong: [{ v: 3, why: 'Count the two electrons in π*2p as antibonding.' }],
              explain: r`Bonding: 2 (σ2s) + 2 (σ2p) + 4 (π2p) = 8; antibonding: 2 (σ*2s) + 2 (π*2p) = 4. $(8 - 4) \div 2 = 2$, a double bond, matching the Lewis structure O=O.`,
            },
            {
              type: 'mcq',
              title: 'Liquid oxygen on a magnet',
              prompt: 'Pour liquid oxygen between the poles of a strong magnet and it hangs there, while liquid nitrogen pours straight through. Why?',
              choices: [
                { t: 'O₂ has two unpaired electrons in its π* orbitals; N₂ has none', ok: true },
                { t: 'Oxygen atoms contain iron', why: 'No iron involved: it’s the electrons of the O₂ molecule itself.' },
                { t: 'Oxygen is denser than nitrogen', why: 'Density doesn’t make something stick to a magnet.' },
              ],
              explain: r`Hund's rule puts O₂'s last two electrons in **separate** π* orbitals, unpaired. Unpaired electrons act like tiny magnets, so oxygen is **paramagnetic**. The Lewis structure O=O, with every electron paired, gets this wrong: one of the triumphs of molecular-orbital theory.`,
            },
            {
              type: 'numeric',
              title: 'The triple bond',
              prompt: r`Here is $\mathrm{N_2}$, with 10 valence electrons. What is its bond order?`,
              widget: moFigure({ mol: 2 }),
              answer: 3,
              wrong: [{ v: 2, why: 'Check which orbitals hold nitrogen’s 10 valence electrons: none are in π*.' }],
              explain: r`Bonding 8 (σ2s, π2p ×4, σ2p), antibonding 2 (σ*2s): $(8 - 2) \div 2 = 3$, the famous N≡N triple bond.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Two and a half',
              prompt: r`Bond orders don't have to be whole numbers. Find a molecule or ion with bond order exactly 2.5.`,
              widget: moFigure({ withCharge: true, mol: 3, goal: (p) => { const n = MOLS[p.m][1] - (p.q || 0); return moInfo(n, p.m <= 2).order === 2.5 ? true : { ok: false, msg: 'Not 2.5 yet. Try removing or adding one electron from a molecule with bond order 2 or 3.' }; }, solution: { m: 3, q: 1 } }),
              explain: r`$\mathrm{O_2^+}$ (remove one π* electron from $\mathrm{O_2}$), $\mathrm{N_2^+}$ (remove a bonding electron from $\mathrm{N_2}$) and $\mathrm{N_2^-}$ (add one to π*) all have bond order 2.5. Taking an electron out of an antibonding orbital makes the bond **stronger**: $\mathrm{O_2^+}$ has a shorter bond than $\mathrm{O_2}$.`,
            },
          ],
          recap: [
            'Bonding orbitals lower the energy; antibonding (*) raise it.',
            'Bond order = (bonding − antibonding electrons) ÷ 2.',
            'O₂ has two unpaired π* electrons: it is paramagnetic.',
          ],
        },
      ],
    },
  ],
};
