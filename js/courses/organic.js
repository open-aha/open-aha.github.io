import { neighbours } from '../lib/chem.js';
import { r, FS, build, view, pick, bars } from './_chem.js';

// carbon-only builder (hydrogens fill in automatically)
const skel = (o) => build({ implicitH: true, h: 320, ...o });
// do the picked atoms form one unbranched chain (a path) in the molecule?
function isPath(atoms, bonds, sel) {
  if (!sel.length) return false;
  const set = new Set(sel), m = { atoms, bonds };
  const deg = sel.map((i) => neighbours(m, i).filter((j) => set.has(j)).length);
  if (sel.length === 1) return true;
  if (deg.filter((d) => d === 1).length !== 2 || deg.some((d) => d > 2 || d === 0)) return false;
  const seen = new Set([sel[0]]), st = [sel[0]];
  while (st.length) { const u = st.pop(); for (const v of neighbours(m, u)) if (set.has(v) && !seen.has(v)) { seen.add(v); st.push(v); } }
  return seen.size === sel.length;
}

export default {
  id: 'organic',
  subject: 'physics',
  title: 'Organic Chemistry',
  level: 'Intermediate',
  cover: 'organic',
  tagline: 'Carbon skeletons, isomer hunts, names, functional groups, rings and benzene.',
  description: r`Carbon can bond to itself in chains, branches and rings, and that one talent produces millions of compounds, from petrol to perfume to DNA. Build carbon skeletons on screen, read the chemist's shorthand of zig-zag lines, then hunt down every isomer of a formula while the builder catches you drawing the same molecule twice. Learn to name what you build, recognise the functional groups that give molecules their personalities, count rings and double bonds from a formula alone, and meet benzene, the ring that broke the rules.`,
  prereq: 'Chemical Bonding',
  chapters: [
    {
      title: 'Carbon Skeletons',
      summary: 'Chains, shorthand and isomers.',
      lessons: [
        {
          id: 'carbon',
          title: 'Carbon’s Four Bonds',
          summary: 'Why carbon builds everything',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'An element that links to itself',
              body: r`Carbon makes four bonds, and carbon–carbon bonds are strong and stable. So carbon atoms can link into chains thousands of atoms long, branch, close into rings, and carry other atoms along the way. **Organic chemistry** is the chemistry of carbon compounds: over 100 million are known.

To keep drawings readable, the builder below fills in hydrogens automatically: each carbon shows how many it carries ($\mathrm{CH_3}$, $\mathrm{CH_2}$...). Tap **+ C** to add a carbon; with a carbon selected, the new one bonds to it.`,
            },
            {
              type: 'interactive',
              title: 'Propane',
              prompt: r`Build propane: three carbons in a row.`,
              widget: skel({ palette: { C: 3 }, target: 'CCC' }),
              explain: r`$\mathrm{CH_3{-}CH_2{-}CH_3}$, or $\mathrm{C_3H_8}$. The end carbons have three hydrogens each, the middle one two. Written like that it's a **condensed formula**: $\mathrm{CH_3CH_2CH_3}$.`,
            },
            {
              type: 'explain',
              title: 'The alkanes',
              body: r`Chains of carbons joined by single bonds, with hydrogens everywhere else, are **alkanes**: methane ($\mathrm{CH_4}$), ethane, propane, butane, pentane, hexane... Each extra carbon adds a $\mathrm{CH_2}$, so the formula is always
$$\mathrm{C}_n\mathrm{H}_{2n+2}$$
The names after butane come from Greek numbers: pent-5, hex-6, hept-7, oct-8.`,
            },
            {
              type: 'numeric',
              title: 'Octane',
              prompt: r`Octane, the namesake of petrol's octane rating, has 8 carbons. How many hydrogens?`,
              answer: 18,
              wrong: [{ v: 16, why: 'Don’t forget the extra two: 2n + 2.' }, { v: 32, why: 'Each carbon in the chain has only two or three hydrogens, not four.' }],
              explain: r`$2 \times 8 + 2 = 18$: $\mathrm{C_8H_{18}}$. Every interior carbon carries two hydrogens and the two ends carry an extra one each.`,
            },
            {
              type: 'mcq',
              title: 'Why not silicon?',
              prompt: 'Silicon is right below carbon and also makes four bonds. Why isn’t there a silicon-based chemistry as rich as carbon’s?',
              choices: [
                { t: 'Si–Si bonds are weak and silicon prefers to bond to oxygen, so long silicon chains fall apart', ok: true },
                { t: 'Silicon is too rare', why: 'Silicon is the second most common element in Earth’s crust.' },
                { t: 'Silicon can’t form any bonds', why: 'It forms plenty, but mostly with oxygen (sand, quartz, rocks).' },
              ],
              explain: r`A C–C bond (348 kJ/mol) is about as strong as a C–O bond, so carbon chains survive in air and water. Si–Si (about 226 kJ/mol) is much weaker than Si–O (about 450), so silicon chains readily turn into silica: rock, not life.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'A branch',
              prompt: r`Build a four-carbon molecule in which one carbon is bonded to **three** other carbons.`,
              widget: skel({ palette: { C: 4 }, target: 'CC(C)C', wrongIsomer: 'That’s a straight chain. Make one carbon the hub with three others around it.' }),
              explain: r`This is isobutane, $\mathrm{CH(CH_3)_3}$, formula $\mathrm{C_4H_{10}}$: the same formula as straight-chain butane, but a different molecule. It's used as a refrigerant and in aerosol cans. Same formula, different structure: the next lessons explore exactly that.`,
            },
          ],
          recap: [
            'Carbon makes 4 bonds and bonds strongly to itself: chains, branches, rings.',
            'Alkanes: CₙH₂ₙ₊₂.',
          ],
        },
        {
          id: 'skeletal',
          title: 'Skeletal Formulas',
          summary: 'The chemist’s shorthand',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Only the skeleton',
              body: r`Chemists draw organic molecules as **skeletal formulas**: zig-zag lines where every corner and every line end is a carbon, and the hydrogens on carbon aren't drawn at all (you work them out: each carbon has enough to make four bonds). Other atoms (O, N, Cl...) are written in, with their hydrogens.

Here is hexane with every carbon and its hydrogens written out:`,
              widget: view('CCCCCC', { h: 150, bond: 66 }),
              after: r`Every carbon here is written out with its hydrogens. Next, the same molecule in shorthand.`,
            },
            {
              type: 'explain',
              title: 'Hexane, the shorthand way',
              body: r`Six corners and ends, so six carbons. Hydrogens are implied.`,
              widget: view('CCCCCC', { h: 140, style: 'skeletal', bond: 66 }),
            },
            {
              type: 'numeric',
              title: 'Count the carbons',
              prompt: r`How many carbon atoms are in this molecule?`,
              widget: view('CC(C)CC(C)C', { h: 190, style: 'skeletal', bond: 64 }),
              answer: 7,
              wrong: [{ v: 5, why: 'Count the branch ends too: every line end is a carbon.' }],
              explain: r`Five along the main zig-zag plus two branch ends: seven. This is 2,4-dimethylpentane, $\mathrm{C_7H_{16}}$.`,
            },
            {
              type: 'interactive',
              title: 'Spot the CH₂ groups',
              prompt: r`Tap every carbon that carries exactly **two** hydrogens. (A carbon with two carbon neighbours has two hydrogens.)`,
              widget: pick({ smiles: 'CC(C)CCCC', style: 'skeletal', bond: 66, h: 220, answer: [3, 4, 5], extraMsg: 'A line end has three H’s, and the branch point has only one.', missMsg: 'Some CH₂ corners are still unmarked.' }),
              explain: r`The three corners in the middle of the long chain are $\mathrm{CH_2}$. The three line ends are $\mathrm{CH_3}$, and the branch point, with three carbon neighbours, is a $\mathrm{CH}$.`,
            },
            {
              type: 'numeric',
              title: 'Hidden hydrogens',
              prompt: r`How many hydrogen atoms does this molecule have in total?`,
              widget: view('OCC1CCCCC1', { h: 200, style: 'skeletal', bond: 60 }),
              answer: 14,
              wrong: [{ v: 13, why: 'Don’t forget the H written on the oxygen.' }, { v: 16, why: 'The ring carbon with the side chain has only one hydrogen.' }],
              explain: r`The ring has five $\mathrm{CH_2}$ (10 H) and one CH (1 H); the side chain is $\mathrm{CH_2}$ (2 H) and OH (1 H): 14 in all. Cyclohexylmethanol, $\mathrm{C_7H_{14}O}$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Same or different?',
              prompt: 'Are these two drawings the same molecule?',
              widget: view(null, { style: 'skeletal', h: 180, atoms: [['C', 60, 115], ['C', 120, 80], ['C', 180, 115], ['C', 240, 80], ['C', 360, 70], ['C', 385, 130], ['C', 450, 130], ['C', 475, 70]], bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [4, 5, 1], [5, 6, 1], [6, 7, 1]], extra: ({ s }) => [s('text', { x: 150, y: 168, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'A' }), s('text', { x: 418, y: 168, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'B' })] }),
              choices: [
                { t: 'Yes: a zig-zag can be drawn bending either way; only the connections matter', ok: true },
                { t: 'No: they bend in different directions', why: 'The bends of a skeletal drawing are just a convention; the molecule twists freely around single bonds.' },
              ],
              explain: r`Both are butane: four carbons in a row. A skeletal drawing records which atoms are joined, not a fixed shape: single bonds rotate freely, so the real molecule flexes between both pictures and many more.`,
            },
          ],
          recap: [
            'Skeletal formula: corners and line ends are carbons; C–H hydrogens are implied.',
            'H on carbon = 4 − (bonds to other atoms).',
          ],
        },
        {
          id: 'isomers',
          title: 'Isomers',
          summary: 'Same formula, different molecule',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Same atoms, different arrangement',
              body: r`Molecules with the same formula but different structures are **isomers**. They are genuinely different substances: butane boils at −0.5 °C and isobutane at −12 °C.

In the hunts below, build a molecule and tap **Save this one**. The builder knows when two drawings are secretly the same molecule (a chain bent differently, or the same branch drawn on the other side) and won't count it twice.`,
            },
            {
              type: 'interactive',
              title: 'Both butanes',
              prompt: r`Find both isomers of $\mathrm{C_4H_{10}}$.`,
              widget: skel({ palette: { C: 4 }, formula: 'C4H10', find: { n: 2, solutions: ['CCCC', 'CC(C)C'] } }),
              explain: r`Butane (straight) and isobutane (methylpropane, branched). There is no third: any other drawing of four carbons is one of these two.`,
            },
            {
              type: 'interactive',
              title: 'Pentanes',
              prompt: r`Now find **all** the isomers of $\mathrm{C_5H_{12}}$.`,
              widget: skel({ palette: { C: 5 }, formula: 'C5H12', find: { n: 3, solutions: ['CCCCC', 'CC(C)CC', 'CC(C)(C)C'] } }),
              explain: r`Three: pentane (a straight chain), 2-methylbutane (one branch) and 2,2-dimethylpropane (neopentane, a carbon surrounded by four methyls). Putting a methyl on the third carbon of butane gives 2-methylbutane again, just drawn from the other end.`,
            },
            {
              type: 'mcq',
              title: 'A tempting duplicate',
              prompt: 'Is “3-methylbutane” a different isomer from 2-methylbutane?',
              choices: [
                { t: 'No: count from the other end and it’s 2-methylbutane', ok: true },
                { t: 'Yes: the methyl is on a different carbon', why: 'Carbon 3 from one end is carbon 2 from the other end of a four-carbon chain.' },
              ],
              explain: r`That's why naming rules say to number from the end that gives the lowest numbers: one structure, one name.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'All five hexanes',
              prompt: r`$\mathrm{C_6H_{14}}$ has five isomers. Find them all.`,
              widget: skel({ palette: { C: 6 }, formula: 'C6H14', h: 340, find: { n: 5, solutions: ['CCCCCC', 'CC(C)CCC', 'CCC(C)CC', 'CC(C)C(C)C', 'CC(C)(C)CC'] } }),
              explain: r`Hexane; 2-methylpentane; 3-methylpentane; 2,3-dimethylbutane; and 2,2-dimethylbutane. The count grows fast: 9 heptanes, 18 octanes, 75 decanes, and over 366,000 isomers of $\mathrm{C_{20}H_{42}}$.`,
            },
            {
              type: 'explain',
              title: 'An explosion of possibilities',
              body: r`The number of alkane isomers grows almost exponentially with the number of carbons:`,
              widget: bars([['C4', 2, 'blue'], ['C5', 3, 'blue'], ['C6', 5, 'blue'], ['C7', 9, 'blue'], ['C8', 18, 'blue'], ['C9', 35, 'blue'], ['C10', 75, 'blue']], { ymax: 80, yticks: 20, ylabel: 'structural isomers', height: 270 }),
              after: r`Counting them is a famous puzzle: Arthur Cayley tackled it with mathematical "trees" in 1875, and George Pólya's counting theorem (1937) finally gave a general method.`,
            },
          ],
          recap: [
            'Isomers: same formula, different structure, different properties.',
            'Butane 2, pentane 3, hexane 5 isomers; the count grows fast.',
          ],
        },
        {
          id: 'naming',
          title: 'Naming Molecules',
          summary: 'One name per structure',
          icon: 'book',
          steps: [
            {
              type: 'explain',
              title: 'The rules',
              body: r`IUPAC names give every structure exactly one name:
1. Find the **longest chain** of carbons; it gives the parent name (pentane, hexane...).
2. **Number** the chain from the end nearer a branch.
3. Name each branch (methyl $\mathrm{CH_3}$, ethyl $\mathrm{C_2H_5}$) with its position: 2-methylpentane.
4. Repeated branches get di-, tri-: 2,3-dimethylbutane.`,
            },
            {
              type: 'interactive',
              title: 'Find the longest chain',
              prompt: r`Tap the carbons of the **longest** continuous chain. (It doesn't have to be the horizontal one.)`,
              widget: pick({ smiles: 'CC(CC)C(C)C', style: 'skeletal', bond: 70, h: 240, answer: [3, 2, 1, 4, 5], goal: (st) => { const ok = isPath(st.atoms, st.bonds, st.sel); return st.sel.length === 5 && ok ? true : !ok ? { ok: false, msg: 'Pick carbons that form one unbroken chain, with no branches.' } : { ok: false, msg: `That chain has ${st.sel.length} carbons. There’s a longer one.` }; } }),
              explain: r`Five carbons: through the ethyl group and across. So the parent is **pentane**, and the molecule is 2,3-dimethylpentane, not "2-ethyl-3-methylbutane", which follows a shorter chain.`,
            },
            {
              type: 'interactive',
              title: 'Build from a name',
              prompt: r`Build **2-methylbutane**.`,
              widget: skel({ palette: { C: 5 }, target: 'CC(C)CC', wrongIsomer: 'Right formula, wrong arrangement: a four-carbon chain with one methyl on carbon 2.' }),
              explain: r`Butane chain (4 carbons) with a methyl on carbon 2. Also called isopentane, it's a component of petrol.`,
            },
            {
              type: 'mcq',
              title: 'Name it',
              prompt: 'What is the correct name of this molecule?',
              widget: view('CCC(C)(C)C', { h: 180, style: 'skeletal', bond: 66 }),
              choices: [
                { t: '2,2-dimethylbutane', ok: true },
                { t: '3,3-dimethylbutane', why: 'Number from the end nearer the branches: that gives 2, not 3.' },
                { t: '2-ethyl-2-methylpropane', why: 'The longest chain has four carbons (through the ethyl group).' },
                { t: 'Hexane', why: 'Hexane is the straight-chain isomer.' },
              ],
              explain: r`Longest chain: four carbons (butane). Both methyls sit on carbon 2 when numbered from the nearer end: 2,2-dimethylbutane, one of the five hexanes.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'A longer name',
              prompt: r`Build **3-ethyl-2-methylpentane**.`,
              widget: skel({ palette: { C: 8 }, target: 'CCC(CC)C(C)C', h: 340, wrongIsomer: 'Five-carbon chain; a methyl on carbon 2 and an ethyl (two carbons) on carbon 3.' }),
              explain: r`Five-carbon chain; methyl on C2; ethyl ($\mathrm{CH_2CH_3}$) on C3. Formula $\mathrm{C_8H_{18}}$: it's one of octane's 18 isomers.`,
            },
          ],
          recap: [
            'Parent = longest chain; number from the end nearest a branch.',
            'Branches named methyl, ethyl...; di-/tri- for repeats.',
          ],
        },
      ],
    },
    {
      title: 'Personalities',
      summary: 'Functional groups, rings and benzene.',
      lessons: [
        {
          id: 'functional',
          title: 'Functional Groups',
          summary: 'Where the chemistry happens',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'The working parts',
              body: r`The hydrocarbon skeleton is mostly inert. The action happens at **functional groups**, small clusters of atoms that behave the same way whatever skeleton they sit on:

| group | looks like | example |
|---|---|---|
| alcohol | C–OH | ethanol (drinks) |
| ether | C–O–C | diethyl ether (old anaesthetic) |
| aldehyde | C(=O)H at a chain end | ethanal |
| ketone | C(=O) mid-chain | acetone (nail-polish remover) |
| carboxylic acid | C(=O)OH | acetic acid (vinegar) |
| ester | C(=O)O–C | ethyl ethanoate (pear drops) |
| amine | C–N | methylamine (fishy smell) |`,
            },
            {
              type: 'interactive',
              title: 'Alcohol or acid?',
              prompt: r`Lactic acid (from sour milk and tired muscles) has two OH groups. Tap the oxygen that belongs to the **alcohol** group, not the acid.`,
              widget: pick({ smiles: 'CC(O)C(=O)O', style: 'skeletal', bond: 72, h: 230, pick: (i, a) => a.el === 'O', answer: [2], extraMsg: 'That oxygen is part of the C(=O)OH carboxylic acid group.', missMsg: 'Find the OH on a carbon with no double-bonded oxygen.' }),
              explain: r`The OH on the middle carbon is an alcohol: that carbon has no C=O. The other two oxygens make up the –COOH acid group together. Lactic acid is a **hydroxy acid**, both an alcohol and an acid.`,
            },
            {
              type: 'interactive',
              title: 'Three isomers, two families',
              prompt: r`$\mathrm{C_3H_8O}$ has three isomers. Find them all.`,
              widget: skel({ palette: { C: 3, O: 1 }, formula: 'C3H8O', find: { n: 3, solutions: ['CCCO', 'CC(C)O', 'CCOC'] } }),
              explain: r`Propan-1-ol and propan-2-ol (alcohols, OH on the end or the middle) and methoxyethane (an ether, oxygen in the chain). Same formula, two families: the alcohols boil near 90 °C, the ether at 7 °C, because only alcohols can hydrogen-bond.`,
            },
            {
              type: 'mcq',
              title: 'Name the group',
              prompt: 'Which functional group does this molecule (a component of banana flavour) contain?',
              widget: view('CC(=O)OCCC(C)C', { h: 190, style: 'skeletal', bond: 60 }),
              choices: [
                { t: 'An ester', ok: true },
                { t: 'A ketone', why: 'A ketone’s C=O carbon is bonded to two carbons. This one is also bonded to an O.' },
                { t: 'A carboxylic acid', why: 'An acid has C(=O)OH. Here the O is bonded to another carbon, not H.' },
                { t: 'An ether', why: 'There is a C–O–C, but it’s attached to a C=O: together that’s an ester.' },
              ],
              explain: r`C(=O)–O–C is an **ester**: isoamyl acetate, the smell of bananas and pear drops. Esters are made from an acid and an alcohol and are responsible for many fruit smells.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Pear drops',
              prompt: r`Build ethyl ethanoate (ethyl acetate), $\mathrm{C_4H_8O_2}$: an acetyl group $\mathrm{CH_3C(=O)}$– joined through an oxygen to an ethyl group.`,
              widget: skel({ palette: { C: 4, O: 2 }, target: 'CCOC(C)=O', h: 330 }),
              explain: r`$\mathrm{CH_3C(=O)OCH_2CH_3}$. Tap a bond twice to make it double. Ethyl acetate is the solvent in many nail-polish removers and smells of pear drops.`,
            },
          ],
          recap: [
            'Functional groups (OH, C=O, COOH, COOR, NH₂...) carry a molecule’s chemistry.',
            'Isomers can belong to different families (alcohol vs ether).',
          ],
        },
        {
          id: 'unsaturation',
          title: 'Rings & Double Bonds',
          summary: 'Reading a formula for hidden structure',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Missing hydrogens',
              body: r`An alkane with $n$ carbons has $2n + 2$ hydrogens: it is **saturated**. Every ring or double bond removes two hydrogens (a triple bond, four). So from a formula alone you can count the **degree of unsaturation**:
$$\text{DoU} = \frac{2C + 2 - H}{2}$$
(Halogens count like H; oxygen doesn't change it.) Each unit is one ring or one double bond.`,
            },
            {
              type: 'numeric',
              title: 'Benzene’s formula',
              prompt: r`Benzene is $\mathrm{C_6H_6}$. What is its degree of unsaturation?`,
              answer: 4,
              wrong: [{ v: 3, why: r`$(2 \times 6 + 2 - 6)/2 = 4$.` }],
              explain: r`$(14 - 6)/2 = 4$: one ring plus three double bonds. Before anyone knew its structure, this number told chemists that benzene must be very unsaturated, which made its unreactivity all the more puzzling.`,
            },
            {
              type: 'interactive',
              title: 'Five ways to lose two hydrogens',
              prompt: r`$\mathrm{C_4H_8}$ has one degree of unsaturation: one double bond **or** one ring. Find all five structural isomers. (Tap a bond again to make it double; join a chain back to its start to make a ring.)`,
              widget: skel({ palette: { C: 4 }, formula: 'C4H8', h: 340, find: { n: 5, solutions: ['C=CCC', 'CC=CC', 'C=C(C)C', 'C1CCC1', 'CC1CC1'] } }),
              explain: r`Three alkenes (but-1-ene, but-2-ene, 2-methylpropene) and two rings (cyclobutane, methylcyclopropane). But-2-ene also comes as cis and trans forms that can't interconvert, but those are **stereoisomers**, the subject of Stereochemistry.`,
            },
            {
              type: 'mcq',
              title: 'Bromine water test',
              prompt: 'Orange bromine water is shaken with an unknown hydrocarbon and goes colourless. What does that suggest?',
              choices: [
                { t: 'The hydrocarbon has a C=C double bond', ok: true },
                { t: 'It is an alkane', why: 'Alkanes don’t react with bromine water in the dark.' },
                { t: 'It contains a ring', why: 'Simple rings (like cyclohexane) don’t decolourise bromine water; a double bond does.' },
              ],
              explain: r`Bromine adds across a double bond ($\mathrm{C{=}C + Br_2 \to CBr{-}CBr}$), using up the orange $\mathrm{Br_2}$. It's a classic quick test for unsaturation, and it distinguishes an alkene from a ring with the same formula.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Read the formula',
              prompt: r`Vitamin C is $\mathrm{C_6H_8O_6}$. How many rings plus double bonds does it have?`,
              answer: 3,
              wrong: [{ v: 6, why: 'Oxygen doesn’t count: use only C and H.' }],
              explain: r`$(2 \times 6 + 2 - 8)/2 = 3$. Indeed ascorbic acid has one ring, a C=C and a C=O.`,
            },
          ],
          recap: [
            'DoU = (2C + 2 − H)/2; each ring or double bond counts 1 (triple 2).',
            'Halogens count as H; oxygen is ignored.',
          ],
        },
        {
          id: 'benzene',
          title: 'Benzene',
          summary: 'A ring with a secret',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Kekulé’s dream',
              body: r`In 1865 August Kekulé proposed that benzene is a ring of six carbons with alternating single and double bonds (he later said the idea came to him in a daydream of a snake biting its tail). But that predicts two different C–C bond lengths, and all six bonds turn out to be identical: 140 pm, between single (154) and double (134).

As with ozone (see Chemical Bonding), the real molecule is a blend of the two drawings: the six π electrons are spread evenly around the whole ring. Chemists often draw a circle inside the hexagon.`,
              widget: view('C1=CC=CC=C1', { h: 200, style: 'skeletal', bond: 70 }),
            },
            {
              type: 'numeric',
              title: 'Extra stability',
              prompt: r`Adding hydrogen to one C=C in cyclohexene releases 120 kJ/mol. Three isolated double bonds would release three times that. Benzene actually releases only 208 kJ/mol when fully hydrogenated. How much more stable is benzene than expected, in kJ/mol?`,
              unit: 'kJ/mol',
              answer: 152,
              tol: 1,
              wrong: [{ v: 360, why: 'That’s the expected value. Subtract what benzene actually releases.' }],
              explain: r`$3 \times 120 - 208 = 152$ kJ/mol of **resonance (aromatic) energy**. That's why benzene shrugs off bromine water: adding across a double bond would sacrifice this stability.`,
            },
            {
              type: 'interactive',
              title: 'Three dichlorobenzenes',
              prompt: r`Put two chlorines on the benzene ring in every possible way. (Select a ring carbon, then tap + Cl. Use Delete on a chlorine to move it.)`,
              widget: build({ smiles: 'C1=CC=CC=C1', implicitH: true, keepStart: true, palette: { Cl: 2 }, formula: 'C6H4Cl2', bond: 70, h: 320, find: { n: 3, solutions: ['ClC1=CC=CC=C1Cl', 'ClC1=CC=CC(Cl)=C1', 'ClC1=CC=C(Cl)C=C1'] } }),
              explain: r`Neighbours (**ortho**, 1,2), one apart (**meta**, 1,3) and opposite (**para**, 1,4). Any other placement is one of these rotated or flipped. Para-dichlorobenzene is the smell of old-fashioned mothballs.`,
            },
            {
              type: 'mcq',
              title: 'Why only one 1,2-isomer?',
              prompt: 'With Kekulé’s alternating bonds, there should be two different 1,2-dichlorobenzenes: Cl–C=C–Cl and Cl–C–C–Cl. Only one exists. Why?',
              choices: [
                { t: 'All six ring bonds are the same, so there’s no difference', ok: true },
                { t: 'One of them is unstable and falls apart', why: 'Neither ever existed as a separate compound.' },
                { t: 'The chlorines repel each other', why: 'The number of isomers is about structure, not repulsion.' },
              ],
              explain: r`The π electrons are shared equally around the ring, so there's no "double" or "single" side for the chlorines to sit on. Counting isomers like this was historical evidence that benzene's bonds are all equal.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Rings everywhere',
              prompt: 'Which of these contains a benzene-type (aromatic) ring?',
              choices: [
                { t: 'Aspirin', ok: true },
                { t: 'Ethanol', why: 'Ethanol is a two-carbon chain.' },
                { t: 'Cyclohexane', why: 'Cyclohexane is a ring of single bonds: no shared π electrons.' },
              ],
              explain: r`Aspirin is built on a benzene ring, as are paracetamol, many dyes, TNT, the amino acids phenylalanine and tyrosine, and the bases of DNA (aromatic rings containing nitrogen).`,
            },
          ],
          recap: [
            'Benzene: six equal bonds, π electrons spread round the ring.',
            'Aromatic stability ≈ 150 kJ/mol; benzene resists addition.',
            'Disubstituted benzenes: ortho (1,2), meta (1,3), para (1,4).',
          ],
        },
        {
          id: 'making',
          title: 'Making Molecules',
          summary: 'Addition and esterification',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Joining and swapping',
              body: r`Two of the most common ways organic molecules react:
- **Addition**: a small molecule adds across a C=C double bond, which becomes single. Ethene + bromine → 1,2-dibromoethane; ethene + water (with an acid catalyst) → ethanol.
- **Condensation**: two molecules join and give off a small one, often water. A carboxylic acid + an alcohol → an **ester** + water.`,
            },
            {
              type: 'interactive',
              title: 'Add bromine',
              prompt: r`Ethene ($\mathrm{CH_2{=}CH_2}$) reacts with bromine ($\mathrm{Br_2}$). Build the product, 1,2-dibromoethane.`,
              widget: skel({ palette: { C: 2, Br: 2 }, target: 'BrCCBr', h: 300 }),
              explain: r`$\mathrm{BrCH_2{-}CH_2Br}$. The double bond opens and each carbon gains a bromine. No atoms are lost: addition reactions have 100% "atom economy".`,
            },
            {
              type: 'numeric',
              title: 'What’s given off?',
              prompt: r`Acetic acid ($\mathrm{C_2H_4O_2}$) and ethanol ($\mathrm{C_2H_6O}$) combine into ethyl acetate ($\mathrm{C_4H_8O_2}$) plus one small molecule. What is that molecule's molar mass? (H = 1, C = 12, O = 16.)`,
              unit: 'g/mol',
              answer: 18,
              wrong: [{ v: 88, why: 'That’s ethyl acetate itself.' }],
              explain: r`$\mathrm{C_2H_4O_2 + C_2H_6O = C_4H_{10}O_3}$; take away $\mathrm{C_4H_8O_2}$ and $\mathrm{H_2O}$ is left: 18 g/mol. Esterification is a condensation.`,
            },
            {
              type: 'interactive',
              title: 'Hydrate ethene',
              prompt: r`Ethene plus water (with an acid catalyst) gives an alcohol. Build it.`,
              widget: skel({ palette: { C: 2, O: 1 }, target: 'CCO', h: 300 }),
              explain: r`Ethanol: H adds to one carbon and OH to the other. Much industrial ethanol (not for drinking) is made this way from ethene obtained from oil; fuel ethanol mostly comes from fermenting sugar instead.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Plastic from a double bond',
              prompt: 'Polyethylene (polythene) is made from ethene molecules. Which reaction type joins them?',
              choices: [
                { t: 'Addition: each double bond opens and links to the next molecule', ok: true },
                { t: 'Condensation, releasing water', why: 'Ethene has no OH or COOH groups to lose water from.' },
                { t: 'Combustion', why: 'Combustion would turn it into CO₂ and water.' },
              ],
              explain: r`Thousands of ethene units add end to end: $n\,\mathrm{CH_2{=}CH_2} \to (\mathrm{{-}CH_2{-}CH_2{-}})_n$. Polyesters and nylons, on the other hand, are made by condensation, releasing water at every link.`,
            },
          ],
          recap: [
            'Addition: across C=C, nothing lost.',
            'Condensation: two molecules join, releasing water (acid + alcohol → ester).',
          ],
        },
      ],
    },
  ],
};
