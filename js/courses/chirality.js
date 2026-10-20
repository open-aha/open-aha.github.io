import { fix } from '../lib/svg.js';
import { r, FS, view, pick } from './_chem.js';

// ---------- a carbon with four groups, built with a chosen handedness ----------
// groups: four [element, label] pairs in priority order (1 highest). 'R' or 'S' sets the arrangement.
const T = Math.acos(-1 / 3);
const DIRS = [[0, 1, 0], [Math.sin(T), Math.cos(T), 0], [Math.sin(T) * Math.cos(2.0944), Math.cos(T), Math.sin(T) * Math.sin(2.0944)], [Math.sin(T) * Math.cos(4.1888), Math.cos(T), Math.sin(T) * Math.sin(4.1888)]];
function centre(groups, config, { length = 1.3, mirror = false } = {}) {
  // lowest priority up; with a,b,c in slots 1,2,3 the centre is S, so R swaps the last two
  const slot = config === 'S' ? [1, 2, 3, 0] : [1, 3, 2, 0];
  const atoms = [['C', 0, 0, 0]];
  groups.forEach(([el, label], k) => {
    const d = DIRS[slot[k]];
    atoms.push([el, d[0] * length, d[1] * length, (mirror ? -1 : 1) * d[2] * length, label ? { label } : undefined].filter((x) => x !== undefined));
  });
  return { atoms, bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] };
}
const HALO = [['Br'], ['Cl'], ['F'], ['H']];
const BCF = centre(HALO, 'R');
const BCF_MIRROR = centre(HALO, 'R', { mirror: true });
// CH2BrCl: Br and Cl in the z = 0 plane, the hydrogens either side of it, so reflecting z gives the same molecule
const ch2 = (sign) => ({ atoms: [['C', 0, 0, 0], ['Br', 0, 1.3, 0], ['Cl', 1.3 * DIRS[1][0], 1.3 * DIRS[1][1], 0], ['H', 1.3 * DIRS[2][0], 1.3 * DIRS[2][1], sign * 1.3 * DIRS[2][2]], ['H', 1.3 * DIRS[3][0], 1.3 * DIRS[3][1], sign * 1.3 * DIRS[3][2]]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] });
const CH2 = ch2(1);
const CH2_MIRROR = ch2(-1);
// alanine as groups: NH2 > COOH > CH3 > H
const ALA = [['N', 'NH₂'], ['C', 'COOH'], ['C', 'CH₃'], ['H']];

// a molecule to turn so it lines up with a fixed ghost on the left
const GHOST_TURN = [20, 35];
const matchWidget = (ghost, mover, o = {}) => ({ kind: 'mol3d', mode: 'match', h: 300, scale: 70, match: { ...ghost, turn: GHOST_TURN, label: o.label || 'target' }, ...mover, turn: o.turn || [70, 160], ...o });

// polarimeter: light through an analyser at angle a, sample turns the plane by rot
const bright = (a, rot) => Math.cos(((a - rot) * Math.PI) / 180) ** 2;

export default {
  id: 'chirality',
  subject: 'physics',
  title: 'Stereochemistry',
  level: 'Advanced',
  cover: 'chirality',
  tagline: 'Left- and right-handed molecules: stereocentres, R and S, cis and trans, and mirror-image drugs.',
  description: r`Some molecules come in left- and right-handed versions that are mirror images but can't be superimposed, like a pair of hands. Turn 3D molecules with your finger to try to make them match, find the stereocentres that cause handedness, rank groups by the Cahn–Ingold–Prelog rules and name each centre R or S. Then meet molecules with two centres, cis–trans isomers (one of them is how you see), the way chiral molecules twist light, and why the two hands of a drug can act completely differently in the body.`,
  prereq: 'Organic Chemistry, and Molecular Shapes',
  chapters: [
    {
      title: 'Handedness',
      summary: 'Mirror images that don’t match.',
      lessons: [
        {
          id: 'hands',
          title: 'Mirror Images',
          summary: 'Molecules with a left and a right hand',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Your two hands',
              body: r`Your left hand is the mirror image of your right, yet you can't lay one exactly on top of the other: a left glove won't fit a right hand. Objects like this are **chiral** (from the Greek for hand). A cup, a spoon or a ball is **achiral**: its mirror image is the same object.

Molecules can be chiral too. On the next screens you'll try to turn a molecule until it matches its mirror image. Drag to turn it; the readout counts how many atoms line up with the faded target.`,
            },
            {
              type: 'interactive',
              title: 'A molecule that matches',
              prompt: r`On the left is $\mathrm{CH_2BrCl}$; on the right, its mirror image, turned. Rotate the right one until every atom lines up with the target.`,
              widget: matchWidget(CH2, CH2_MIRROR, { solution: { turn: GHOST_TURN }, label: 'CH₂BrCl', hint: 'Get the bromine and chlorine in place first; the two hydrogens can swap.' }),
              explain: r`It fits: with two identical hydrogens, the mirror image is just the original molecule turned around. $\mathrm{CH_2BrCl}$ has a **mirror plane** through C, Br and Cl, and any molecule with a mirror plane is achiral.`,
            },
            {
              type: 'explain',
              title: 'Now one that won’t',
              body: r`Replace one hydrogen with fluorine: $\mathrm{CHBrClF}$, with four **different** groups on the carbon. Try to match it with its mirror image.`,
              widget: matchWidget(BCF, BCF_MIRROR, { label: 'CHBrClF' }),
              after: r`However you turn it, at most three atoms line up (the carbon and two groups); the other two are always swapped. The two forms are different molecules, called **enantiomers**.`,
            },
            {
              type: 'mcq',
              title: 'The test',
              prompt: 'Which is a reliable sign that a molecule is achiral?',
              choices: [
                { t: 'It has a mirror plane: one half reflects onto the other', ok: true },
                { t: 'It contains a carbon atom', why: 'Most carbon compounds are achiral (methane, ethanol, benzene...).' },
                { t: 'It is flat-ish when drawn on paper', why: 'Drawings are flat; the real molecule is 3D.' },
              ],
              explain: r`A molecule with an internal mirror plane is identical to its mirror image, so it can't be chiral. (Strictly, any "improper" symmetry rules out chirality, but a mirror plane is by far the commonest.)`,
            },
            {
              type: 'multi',
              kicker: 'Challenge',
              title: 'Chiral or not?',
              prompt: 'Which of these everyday objects are chiral?',
              choices: [
                { t: 'A screw', ok: true },
                { t: 'A glove', ok: true },
                { t: 'A spiral staircase', ok: true },
                { t: 'A coffee mug (plain)', why: 'A plane through the handle reflects the mug onto itself.' },
                { t: 'A football', why: 'A sphere has endless mirror planes.' },
              ],
              explain: r`Helices (screws, staircases, DNA) twist one way and their mirror image twists the other. Gloves and shoes come in pairs for the same reason.`,
            },
          ],
          recap: [
            'Chiral: not superimposable on its mirror image. The two forms are enantiomers.',
            'A mirror plane makes a molecule achiral.',
          ],
        },
        {
          id: 'centres',
          title: 'Stereocentres',
          summary: 'Four different groups',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Four different neighbours',
              body: r`The commonest cause of chirality is a carbon carrying **four different groups**: a **stereocentre** (or chiral centre). Swapping any two of its groups turns the molecule into its mirror image.

To spot one, check each carbon: does it have four single bonds to four groups that are all different, counting the whole group (a $\mathrm{CH_2CH_3}$ is different from a $\mathrm{CH_3}$)?`,
            },
            {
              type: 'interactive',
              title: 'Butan-2-ol',
              prompt: r`Tap the stereocentre in butan-2-ol.`,
              widget: pick({ smiles: 'CC(O)CC', style: 'skeletal', bond: 72, h: 220, pick: (i, a) => a.el === 'C', answer: [1], extraMsg: 'That carbon has two or three identical hydrogens.' }),
              explain: r`Carbon 2 carries H, OH, $\mathrm{CH_3}$ and $\mathrm{CH_2CH_3}$: four different groups. The other carbons have two or three hydrogens, so they can't be stereocentres.`,
            },
            {
              type: 'interactive',
              title: 'Ibuprofen',
              prompt: r`Ibuprofen has one stereocentre. Tap it.`,
              widget: pick({ smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', style: 'skeletal', bond: 46, h: 240, pick: (i, a) => a.el === 'C', answer: [10], extraMsg: 'That carbon has two identical groups (or is in a flat ring with a double bond).' }),
              explain: r`The carbon between the ring and the COOH group: it carries H, $\mathrm{CH_3}$, COOH and the ring. The branch point on the left has two identical $\mathrm{CH_3}$ groups, and ring carbons with double bonds have only three neighbours.`,
            },
            {
              type: 'interactive',
              title: 'Menthol',
              prompt: r`Menthol (the cooling taste of mint) has three stereocentres, all in its ring. Tap all three.`,
              widget: pick({ smiles: 'CC(C)C1CCC(C)CC1O', style: 'skeletal', bond: 56, h: 260, pick: (i, a) => a.el === 'C', answer: [3, 6, 9], extraMsg: 'That carbon has two identical groups (two H, or two CH₃).', missMsg: 'Some stereocentres are still unmarked: look at each ring carbon that carries a substituent.' }),
              explain: r`The three ring carbons carrying the isopropyl group, the methyl group and the OH. In each, the two ways round the ring are different, so the four groups are all distinct. Three centres allow $2^3 = 8$ stereoisomers, but only one, (−)-menthol, has the strong cooling effect.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sugar',
              prompt: r`Open-chain glucose is $\mathrm{HOCH_2{-}CH(OH){-}CH(OH){-}CH(OH){-}CH(OH){-}CHO}$. How many stereocentres does it have?`,
              answer: 4,
              wrong: [{ v: 6, why: r`The end carbons can’t be stereocentres: one has two H’s, the other is a C=O.` }, { v: 5, why: r`The $\mathrm{CH_2OH}$ carbon has two hydrogens.` }],
              explain: r`The four CH(OH) carbons in the middle. With $2^4 = 16$ possible arrangements, glucose has 15 stereoisomer siblings, including galactose and mannose, which taste and behave differently.`,
            },
          ],
          recap: [
            'A carbon with four different groups is a stereocentre.',
            'CH₂, CH₃, C=O and flat ring carbons with double bonds are never stereocentres.',
          ],
        },
      ],
    },
    {
      title: 'Naming Hands',
      summary: 'Priorities, R and S.',
      lessons: [
        {
          id: 'cip',
          title: 'Ranking Groups',
          summary: 'The Cahn–Ingold–Prelog rules',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'Who comes first?',
              body: r`To name a stereocentre, first rank its four groups (Cahn, Ingold and Prelog, 1956):
1. Look at the atom directly attached: higher **atomic number** wins (Br > Cl > S > F > O > N > C > H).
2. If those tie, compare the sets of atoms one bond further out, highest first, until there's a difference.
3. A double bond counts as two single bonds to that atom (C=O counts as C bonded to O, O).`,
            },
            {
              type: 'interactive',
              title: 'Rank by atomic number',
              prompt: r`Tap the four groups on this carbon in priority order, highest first.`,
              widget: { kind: 'mol3d', mode: 'pick', h: 280, scale: 80, ...BCF, pick: { ordered: true, answer: [1, 2, 3, 4] }, hint: 'Rank by atomic number: Br (35), Cl (17), F (9), H (1).' },
              explain: r`Bromine (35), chlorine (17), fluorine (9), hydrogen (1). Hydrogen is always last when it's present.`,
            },
            {
              type: 'order',
              title: 'Common groups',
              prompt: r`Order these groups by CIP priority, highest first.`,
              items: [r`$-\mathrm{OH}$`, r`$-\mathrm{NH_2}$`, r`$-\mathrm{COOH}$`, r`$-\mathrm{CH_3}$`, r`$-\mathrm{H}$`],
              explain: r`O (8) beats N (7) beats C (6). COOH and $\mathrm{CH_3}$ both start with carbon, so look further out: COOH's carbon carries (O, O, O) (the double bond counts twice), $\mathrm{CH_3}$'s carries (H, H, H). O beats H, so COOH ranks above $\mathrm{CH_3}$.`,
            },
            {
              type: 'interactive',
              title: 'Alanine',
              prompt: r`Alanine, an amino acid, has $\mathrm{NH_2}$, COOH, $\mathrm{CH_3}$ and H on its stereocentre. Tap them in priority order.`,
              widget: { kind: 'mol3d', mode: 'pick', h: 280, scale: 80, ...centre(ALA, 'S'), pick: { ordered: true, answer: [1, 2, 3, 4] }, hint: 'Nitrogen first; then decide between the two carbon groups by what is attached to them.' },
              explain: r`$\mathrm{NH_2}$ (N), then COOH (C carrying O, O, O), then $\mathrm{CH_3}$ (C carrying H, H, H), then H.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A closer call',
              prompt: r`Which ranks higher: $-\mathrm{CH_2OH}$ or $-\mathrm{CH(CH_3)_2}$ (isopropyl)?`,
              choices: [
                { t: r`$-\mathrm{CH_2OH}$`, ok: true },
                { t: r`$-\mathrm{CH(CH_3)_2}$`, why: 'Compare the sets attached to the first carbon, highest first: (O, H, H) versus (C, C, H). The first difference decides: O beats C.' },
              ],
              explain: r`Both start with C. Next sets: $\mathrm{CH_2OH}$ has (O, H, H), isopropyl (C, C, H). Compare the highest atom first: O beats C, so $\mathrm{CH_2OH}$ wins, even though isopropyl has more carbons. It's the first point of difference that counts, not the total.`,
            },
          ],
          recap: [
            'Rank by atomic number of the attached atom; break ties one bond further out.',
            'Double bonds count their atom twice; first difference wins.',
          ],
        },
        {
          id: 'rs',
          title: 'R or S?',
          summary: 'Clockwise or anticlockwise',
          icon: 'reset',
          steps: [
            {
              type: 'explain',
              title: 'Steering wheel rule',
              body: r`With priorities known:
1. Turn the molecule so the **lowest-priority** group (usually H) points **away** from you, behind the carbon.
2. Trace 1 → 2 → 3 around the other three groups.
3. **Clockwise** is **R** (Latin *rectus*, right); **anticlockwise** is **S** (*sinister*, left).

It's like holding a steering wheel with the column (the H) pointing away from you.`,
            },
            {
              type: 'interactive',
              title: 'Point the H away',
              prompt: r`Turn this $\mathrm{CHBrClF}$ until the hydrogen points straight away from you, hidden behind the carbon.`,
              widget: { kind: 'mol3d', mode: 'point', h: 300, scale: 85, ...BCF, point: 4, pointName: 'hydrogen', turn: [20, 30], solution: { turn: [-90, 0] } },
              explain: r`Now the bromine, chlorine and fluorine fan out towards you like the spokes of a steering wheel, and you can read their order.`,
            },
            {
              type: 'mcq',
              title: 'Read it',
              prompt: r`With H pointing away, go Br (1) → Cl (2) → F (3). Is this centre R or S? (Turn it again if you need to.)`,
              widget: { kind: 'mol3d', mode: 'point', h: 280, scale: 85, ...BCF, point: 4, pointName: 'hydrogen', turn: [-90, 0] },
              choices: [
                { t: 'R: clockwise', ok: true },
                { t: 'S: anticlockwise', why: 'Look again with the H directly behind the carbon: Br → Cl → F turns clockwise.' },
              ],
              explain: r`Clockwise: this is (R)-bromochlorofluoromethane. Its mirror image, with any two groups swapped, is the (S) enantiomer.`,
            },
            {
              type: 'mcq',
              title: 'Alanine in your body',
              prompt: r`This is the alanine found in proteins. Priorities: $\mathrm{NH_2}$ > COOH > $\mathrm{CH_3}$ > H. Turn H away and decide: R or S?`,
              widget: { kind: 'mol3d', mode: 'point', h: 280, scale: 85, ...centre(ALA, 'S'), point: 4, pointName: 'hydrogen', turn: [10, 60] },
              choices: [
                { t: 'S', ok: true },
                { t: 'R', why: r`With H pointing away, $\mathrm{NH_2}$ → COOH → $\mathrm{CH_3}$ runs anticlockwise.` },
              ],
              explain: r`(S)-alanine. Nearly all amino acids in living things have the same handedness (called L; in R/S terms that is S for all of them except cysteine, and glycine has no stereocentre at all). Why life chose one hand is still an open question.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'H towards you',
              prompt: 'In a drawing, the hydrogen points towards you and 1 → 2 → 3 runs clockwise. What is the configuration?',
              choices: [
                { t: 'S: viewed from the wrong side, the answer flips', ok: true },
                { t: 'R', why: 'Clockwise means R only when the lowest priority points away. Seen from the front, the direction is reversed.' },
              ],
              explain: r`Looking from the opposite side reverses clockwise and anticlockwise, so read the answer and swap it. A handy shortcut when you can't turn a drawing.`,
            },
          ],
          recap: [
            'Lowest priority away; trace 1→2→3: clockwise R, anticlockwise S.',
            'If the lowest priority points towards you, swap your answer.',
          ],
        },
        {
          id: 'two',
          title: 'Two Stereocentres',
          summary: 'Enantiomers and diastereomers',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'More centres, more isomers',
              body: r`Each stereocentre can be R or S, so a molecule with $n$ centres has up to $2^n$ stereoisomers. With two centres: RR, SS, RS and SR.
- RR and SS are mirror images of each other: **enantiomers**.
- RR and RS are stereoisomers but **not** mirror images: **diastereomers**.

Enantiomers have identical physical properties (except how they twist light and how they interact with other chiral things). Diastereomers differ in everything: melting point, solubility, taste.`,
            },
            {
              type: 'numeric',
              title: 'Three centres',
              prompt: r`What is the maximum number of stereoisomers of a molecule with three stereocentres?`,
              answer: 8,
              wrong: [{ v: 6, why: 'Each centre doubles the count: 2 × 2 × 2.' }],
              explain: r`$2^3 = 8$: four pairs of enantiomers. Cholesterol, with 8 centres, could in principle have 256 forms; nature makes just one.`,
            },
            {
              type: 'mcq',
              title: 'Name the relationship',
              prompt: '(2R,3R)- and (2R,3S)-2,3-dibromopentane are:',
              choices: [
                { t: 'Diastereomers', ok: true },
                { t: 'Enantiomers', why: 'Mirror images have every centre inverted: (2R,3R) ↔ (2S,3S).' },
                { t: 'The same molecule', why: 'One centre is different, so they are different stereoisomers.' },
              ],
              explain: r`Only one centre differs, so they aren't mirror images: diastereomers. The enantiomer of (2R,3R) is (2S,3S).`,
            },
            {
              type: 'explain',
              title: 'Meso: a hidden mirror',
              body: r`Tartaric acid (from grapes) has two stereocentres carrying the same four groups. Its RS form has an internal **mirror plane** between the two centres: one half reflects onto the other. It is therefore achiral, and RS and SR are the same molecule. This is called a **meso** compound.

So tartaric acid has only **three** stereoisomers, not four: RR, SS and meso. Louis Pasteur discovered molecular handedness in 1848 by sorting crystals of tartrate salts by hand, under a magnifying glass.`,
              widget: view('OC(=O)C(O)C(O)C(=O)O', { h: 200, style: 'skeletal', bond: 60 }),
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Separating them',
              prompt: 'A mixture contains two diastereomers. Can they be separated by ordinary distillation or crystallisation?',
              choices: [
                { t: 'Yes: diastereomers have different physical properties', ok: true },
                { t: 'No: stereoisomers always have identical properties', why: 'Only enantiomers have identical (non-chiral) properties.' },
              ],
              explain: r`Diastereomers boil and crystallise differently, so ordinary methods work. Enantiomers need a chiral helper: the classic trick is to react them with a single enantiomer of something else, which turns the pair into separable diastereomers.`,
            },
          ],
          recap: [
            'Up to 2ⁿ stereoisomers for n centres.',
            'Enantiomers: all centres inverted (mirror images). Diastereomers: some inverted.',
            'Meso compounds have stereocentres but a mirror plane: achiral.',
          ],
        },
      ],
    },
    {
      title: 'Handedness at Work',
      summary: 'Double bonds, light and drugs.',
      lessons: [
        {
          id: 'cistrans',
          title: 'Cis & Trans',
          summary: 'Locked by a double bond',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'No turning',
              body: r`A C=C double bond can't rotate (its π bond would break; see Molecular Shapes). So when each carbon of the double bond carries two different groups, there are two arrangements: **cis** (similar groups on the same side) and **trans** (opposite sides). They are diastereomers.`,
              widget: view(null, { atoms: [['C', 110, 105], ['C', 190, 105], ['C', 60, 45], ['C', 240, 45], ['C', 410, 105], ['C', 490, 105], ['C', 360, 45], ['C', 540, 165]], bonds: [[0, 1, 2], [0, 2, 1], [1, 3, 1], [4, 5, 2], [4, 6, 1], [5, 7, 1]], h: 200, style: 'skeletal', extra: ({ s }) => [s('text', { x: 150, y: 185, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'cis-but-2-ene' }), s('text', { x: 450, y: 185, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: 'trans-but-2-ene' })] }),
            },
            {
              type: 'multi',
              title: 'Which can be cis or trans?',
              prompt: 'Which of these alkenes have cis and trans forms?',
              choices: [
                { t: r`$\mathrm{CH_3CH{=}CHCH_3}$ (but-2-ene)`, ok: true },
                { t: r`$\mathrm{ClCH{=}CHCl}$`, ok: true },
                { t: r`$\mathrm{CH_2{=}CHCH_3}$ (propene)`, why: 'One carbon of the double bond carries two identical H atoms.' },
                { t: r`$\mathrm{(CH_3)_2C{=}CH_2}$`, why: 'Both carbons carry a pair of identical groups.' },
              ],
              explain: r`Each carbon of the C=C must carry two **different** groups. If either end has two identical groups, flipping makes no difference.`,
            },
            {
              type: 'mcq',
              title: 'Fats',
              prompt: '“Trans fats” are linked to heart disease. Natural vegetable oils have mostly cis double bonds. Why does the shape matter physically?',
              choices: [
                { t: 'Cis bonds kink the chain, so the molecules pack loosely and stay liquid; trans chains are straight and pack like saturated fat', ok: true },
                { t: 'Trans fats contain more calories', why: 'The calories are about the same; the shape changes how the chains pack.' },
                { t: 'Cis fats are not fats', why: 'Both are fats; their shapes differ.' },
              ],
              explain: r`A cis double bond puts a 30° bend in the fatty acid chain, so the chains can't line up neatly: oils stay liquid. Partial hydrogenation, used to harden margarine, turned some cis bonds trans, giving straight chains that pack like butter but behave badly in the body.`,
            },
            {
              type: 'explain',
              title: 'Seeing is a cis–trans switch',
              body: r`In your eye, the molecule **retinal** sits in a protein with one double bond in the cis form. When a photon hits it, that π bond briefly breaks and the molecule snaps to trans in about 200 femtoseconds. The change of shape triggers the nerve signal: every image you see starts with millions of cis-to-trans flips.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'E and Z',
              prompt: r`For crowded alkenes, chemists use **Z** (higher-priority groups on the same side, from German *zusammen*) and **E** (opposite, *entgegen*). In $\mathrm{BrClC{=}CHF}$, Br and F are on the same side. Which is it?`,
              choices: [
                { t: 'Z', ok: true },
                { t: 'E', why: 'On the left carbon Br outranks Cl; on the right, F outranks H. Those two are on the same side.' },
              ],
              explain: r`On each carbon pick the higher-priority group (CIP rules): Br on one, F on the other. Same side: **Z**. E/Z works even when "cis" and "trans" would be ambiguous.`,
            },
          ],
          recap: [
            'Rigid C=C plus two different groups on each carbon → cis/trans (E/Z) isomers.',
            'Shape changes properties: oils vs trans fats; retinal’s flip lets you see.',
          ],
        },
        {
          id: 'light',
          title: 'Twisting Light',
          summary: 'Optical activity',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'A polarimeter',
              body: r`Shine polarised light (vibrating in one plane) through a solution of a chiral substance and the plane turns. One enantiomer turns it clockwise by some angle (labelled +), the other turns it anticlockwise by exactly the same angle (−). That's **optical activity**, measured with a **polarimeter**: a polariser, the sample tube, and an analyser you rotate until the light is brightest again.`,
            },
            {
              type: 'interactive',
              title: 'Measure a rotation',
              prompt: r`A sugar solution is in the tube. Rotate the analyser to find the angle where the light is brightest.`,
              widget: {
                kind: 'graph', xmin: -90, xmax: 90, ymin: 0, ymax: 1.1, height: 300, grid: false,
                axes: { xticks: 30, yticks: 0.5, xlabel: 'analyser angle (°)', ylabel: 'brightness', yAt: 0, xAt: -90 },
                params: { a: { min: -90, max: 90, step: 1, value: -40, label: 'Analyser', format: (v) => `${v}°` } },
                under: ({ plot, p, s }) => [s('circle', { cx: plot.X(60), cy: plot.Y(0.8), r: 34, fill: 'var(--amber)', 'fill-opacity': bright(p.a, 33), stroke: 'var(--ink-3)', 'stroke-width': 2 })],
                points: [{ x: (p) => p.a, y: (p) => bright(p.a, 33), color: 'violet' }],
                readout: (p) => `analyser at ${p.a}° · brightness ${fix(bright(p.a, 33) * 100, 0)}%`,
                goal: (p) => (Math.abs(p.a - 33) <= 1 ? true : { ok: false, msg: 'Not the brightest point yet.' }),
                solution: { a: 33 },
              },
              explain: r`Brightest at +33°: the sample turned the plane of polarisation 33° clockwise, so it's **dextrorotatory** (+). The size of the rotation depends on the concentration, the length of the tube and the substance.`,
            },
            {
              type: 'mcq',
              title: 'A 50:50 mix',
              prompt: 'What rotation does a 50:50 mixture of two enantiomers (a racemic mixture) produce?',
              choices: [
                { t: 'None: equal and opposite rotations cancel', ok: true },
                { t: 'Twice the rotation of either one', why: 'The two rotate in opposite directions.' },
                { t: 'Half the rotation of the + form', why: 'The − form cancels the + form exactly.' },
              ],
              explain: r`Racemic mixtures are optically inactive. Most reactions that make a stereocentre from achiral starting materials give racemic mixtures, unless a chiral catalyst or enzyme is involved.`,
            },
            {
              type: 'numeric',
              title: 'Enantiomeric excess',
              prompt: r`A pure enantiomer rotates light by +40°. A sample of the same concentration rotates it by +30°. What is its **enantiomeric excess** (the % of extra + form over the − form)?`,
              unit: '%',
              answer: 75,
              tol: 0.5,
              explain: r`$30 / 40 = 75\%$ e.e. That means 87.5% of the + form and 12.5% of the − form: the 12.5% of each cancels, leaving 75% net.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'R is not +',
              prompt: 'Does knowing a molecule is (R) tell you it rotates light clockwise (+)?',
              choices: [
                { t: 'No: R/S is a naming rule; the direction of rotation must be measured', ok: true },
                { t: 'Yes: R always means clockwise rotation', why: 'R/S comes from a drawing convention; optical rotation is a physical measurement. They aren’t linked by any simple rule.' },
              ],
              explain: r`(R)-glyceraldehyde happens to be (+), but (R)-lactic acid is (−). R and S label the 3D arrangement; + and − report what the light does.`,
            },
          ],
          recap: [
            'Enantiomers rotate polarised light by equal and opposite angles.',
            'Racemic mixtures don’t rotate light; e.e. = observed ÷ pure rotation.',
            'R/S and +/− are independent.',
          ],
        },
        {
          id: 'medicines',
          title: 'Mirror-Image Medicines',
          summary: 'When the other hand matters',
          icon: 'flag',
          steps: [
            {
              type: 'explain',
              title: 'Chiral bodies',
              body: r`Your body is built from chiral molecules: proteins from L-amino acids, DNA twisting right-handed. Receptors and enzymes are like gloves, and a drug molecule is the hand: one enantiomer may fit perfectly while its mirror image fits badly, or does something else entirely.`,
            },
            {
              type: 'mcq',
              title: 'Mint or caraway?',
              prompt: '(R)-carvone smells of spearmint; (S)-carvone smells of caraway seeds. What does that tell you about smell receptors?',
              choices: [
                { t: 'They are chiral, so the two enantiomers fit them differently', ok: true },
                { t: 'The two carvones have different formulas', why: 'Enantiomers have exactly the same formula and connectivity.' },
                { t: 'One of them is impure', why: 'Pure samples of each smell different.' },
              ],
              explain: r`An achiral detector couldn't tell enantiomers apart. Your nose can, because its receptors are proteins, made of chiral amino acids.`,
            },
            {
              type: 'explain',
              title: 'Thalidomide',
              body: r`In the late 1950s thalidomide was sold as a sedative and for morning sickness, as a racemic mixture. It caused severe birth defects in over ten thousand children. One enantiomer is the sedative; the other is linked to the harm. Worse, the body interconverts the two, so even a pure enantiomer would not have been safe.

The disaster transformed drug regulation: today, regulators expect both enantiomers of a chiral drug to be studied separately.`,
            },
            {
              type: 'mcq',
              title: 'Ibuprofen',
              prompt: 'Ibuprofen is sold as a racemic mixture, though only (S)-ibuprofen relieves pain. Why is that acceptable?',
              choices: [
                { t: 'The body slowly converts much of the (R) form into the (S) form, and (R) is harmless', ok: true },
                { t: 'Both forms are equally effective', why: 'Only (S) blocks the target enzyme well.' },
                { t: 'Enantiomers always have the same effects', why: 'Often they don’t: carvone and thalidomide show the difference.' },
              ],
              explain: r`An enzyme in the body converts (R)-ibuprofen to (S). Some countries sell pure (S)-ibuprofen (dexibuprofen), which works at a lower dose.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Wasted dose',
              prompt: r`A racemic drug contains 400 mg per tablet. If only the (S) form is active and none converts, how many mg of active drug are in each tablet?`,
              unit: 'mg',
              answer: 200,
              tol: 0.5,
              explain: r`Racemic = 50:50, so 200 mg is active and 200 mg is "isomeric ballast". Making single-enantiomer drugs ("chiral switches") is a major part of modern pharmaceutical chemistry; the 2001 Nobel Prize went to chemists who invented catalysts that make one hand selectively.`,
            },
          ],
          recap: [
            'Receptors and enzymes are chiral: enantiomers can act differently.',
            'Thalidomide led to separate testing of enantiomers.',
            'Racemic drugs carry 50% of each hand.',
          ],
        },
      ],
    },
  ],
};
