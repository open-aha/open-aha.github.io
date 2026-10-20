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

// ---------- retinal: light twists the C11=C12 bond, turning the bent 11-cis form into straight all-trans ----------
const RET_SM = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
// the all-trans chain: C6 (on the ring), C7 … C15, then the nitrogen that links it to the protein
const RET_CHAIN = Array.from({ length: 11 }, (_, i) => [2.25 + i * 0.56, 3.05 + (i % 2 ? 0.32 : 0)]);
const RET_DOUBLE = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]; // C7=C8, C9=C10, C11=C12, C13=C14, C15=N
const RET_METHYL = [3, 7]; // methyl groups on C9 and C13
// turn a point of the tail by angle a about the C11=C12 axis (a = 0: trans, π: cis); returns [x, y, depth]
const retRot = ([x, y], a) => {
  const [ax, ay] = RET_CHAIN[5], [bx, by] = RET_CHAIN[6], L = Math.hypot(bx - ax, by - ay), ex = (bx - ax) / L, ey = (by - ay) / L;
  const along = (x - ax) * ex + (y - ay) * ey, d = (x - ax) * -ey + (y - ay) * ex;
  return [ax + along * ex - ey * d * Math.cos(a), ay + along * ey + ex * d * Math.cos(a), d * Math.sin(a)];
};
const retPos = (i, a) => (i <= 6 ? [...RET_CHAIN[i], 0] : retRot(RET_CHAIN[i], a));
const retAngle = (t) => Math.PI * (1 - RET_SM((t - 1.3) / 0.9));

// ---------- polarised light through a sugar solution: the plane of vibration turns steadily along the tube ----------
const ROT_X0 = 3.0, ROT_X1 = 7.2, ROT_DEG = 33;
const rotPhi = (x) => ((ROT_DEG * Math.min(1, Math.max(0, (x - ROT_X0) / (ROT_X1 - ROT_X0)))) * Math.PI) / 180;

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
            { /*chemanim:chirality.cistrans*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The fastest switch in your body',
              body: r`Retinal sits in its protein with a kink: the double bond between carbons 11 and 12 is **cis**. When a photon is absorbed, that π bond briefly loses its grip, the tail of the molecule swings round the C11–C12 axis, and the chain straightens out.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0.6, ymax: 5.4, grid: false, axes: false, height: 260,
                animate: { param: 't', speed: 0.7, max: 3.6, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], a = retAngle(p.t);
                  // depth is shown by sliding a little down and right
                  const P = (i) => { const [x, y, z] = retPos(i, a); return [X(x + 0.18 * z), Y(y - 0.3 * z)]; };
                  // the β-ionone ring, attached at C6
                  const [r6x, r6y] = RET_CHAIN[0], ring = [0, 1, 2, 3, 4, 5].map((k) => [r6x - 0.56 + 0.56 * Math.cos((k * Math.PI) / 3), r6y + 0.56 * Math.sin((k * Math.PI) / 3)]);
                  out.push(s('path', { d: ring.map(([x, y], k) => `${k ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join('') + 'Z', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  const bond = (i, j, dbl) => {
                    const [x1, y1] = P(i), [x2, y2] = P(j);
                    out.push(s('line', { x1, y1, x2, y2, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
                    if (dbl) {
                      const L = Math.hypot(x2 - x1, y2 - y1), nx = (-(y2 - y1) / L) * 5, ny = ((x2 - x1) / L) * 5;
                      out.push(s('line', { x1: x1 + nx + (x2 - x1) * 0.15, y1: y1 + ny + (y2 - y1) * 0.15, x2: x2 + nx - (x2 - x1) * 0.15, y2: y2 + ny - (y2 - y1) * 0.15, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                    }
                  };
                  for (let i = 0; i < 10; i++) {
                    const twisting = i === 5;
                    bond(i, i + 1, RET_DOUBLE.some(([u, v]) => u === i && v === i + 1) && !(twisting && a > 0.25 && a < Math.PI - 0.25));
                  }
                  // methyls: a short stub pointing away from the chain
                  for (const m of RET_METHYL) {
                    const [x, y, z] = retPos(m, a), up = RET_CHAIN[m][1] > 3.1 ? 1 : -1;
                    const stub = [RET_CHAIN[m][0], RET_CHAIN[m][1] + 0.55 * up], [x2, y2, z2] = m > 6 ? retRot(stub, a) : [...stub, 0];
                    out.push(s('line', { x1: X(x + 0.18 * z), y1: Y(y - 0.3 * z), x2: X(x2 + 0.18 * z2), y2: Y(y2 - 0.3 * z2), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  }
                  // highlight the bond that turns, and the protein end
                  const [h1x, h1y] = P(5), [h2x, h2y] = P(6);
                  out.push(s('line', { x1: h1x, y1: h1y, x2: h2x, y2: h2y, stroke: 'var(--coral)', 'stroke-width': 7, opacity: 0.35, 'stroke-linecap': 'round' }));
                  const [nx, ny] = P(10);
                  out.push(s('text', { x: nx + 6, y: ny + 5, class: 'lbl halo-text', style: `fill:var(--blue);${FS(13)}`, text: 'N–protein' }));
                  out.push(s('text', { x: (h1x + h2x) / 2, y: Math.min(h1y, h2y) - 12, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--coral);${FS(11)}`, text: 'C11=C12' }));
                  // the incoming photon
                  if (p.t < 1.4) {
                    const x0 = 0.4 + 2.8 * Math.min(1, p.t / 1.3);
                    let d = '';
                    for (let k = 0; k <= 22; k++) d += `${k ? 'L' : 'M'}${X(x0 + k * 0.05).toFixed(1)} ${Y(4.7 - k * 0.03 + 0.13 * Math.sin(k * 1.1)).toFixed(1)}`;
                    out.push(s('path', { d, fill: 'none', stroke: 'var(--success)', 'stroke-width': 3 }));
                  }
                  return out;
                },
                readout: (p) => (retAngle(p.t) > Math.PI - 0.05 ? '11-cis-retinal: bent at C11=C12.' : retAngle(p.t) > 0.05 ? 'The C11=C12 bond twists: the tail swings round…' : 'All-trans-retinal: straight. About 200 femtoseconds after the photon.'),
              },
              after: r`The straightened retinal no longer fits its pocket, so the protein (rhodopsin) changes shape, and that change sets off the nerve signal. It is one of the fastest chemical reactions known, finished in about 200 femtoseconds, and it works with a single photon. Afterwards, enzymes turn all-trans retinal back into 11-cis so the switch can be used again.`,
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
            { /*chemanim:chirality.light*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Light with a twist',
              body: r`A polariser lets through light whose electric field vibrates in one plane (here, straight up and down). Inside the tube of sugar solution, watch that plane: it doesn't jump, it turns a little more with every millimetre the light travels.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: Math.PI, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], yc = 3.6, A = 1.15;
                  // oblique 3D: depth (z) is drawn up and to the right
                  const proj = (x, ey, ez) => [X(x + 0.8 * ez), Y(yc + ey + 0.25 * ez)];
                  // the tube
                  out.push(s('rect', { x: X(ROT_X0), y: Y(yc + 1.45), width: X(ROT_X1) - X(ROT_X0), height: Y(yc - 1.45) - Y(yc + 1.45), rx: 14, fill: 'var(--amber)', opacity: 0.14, stroke: 'var(--amber)', 'stroke-opacity': 0.6, 'stroke-width': 2 }));
                  out.push(s('text', { x: X((ROT_X0 + ROT_X1) / 2), y: Y(yc - 1.45) + 16, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'sugar solution' }));
                  // polariser before the tube
                  const [p1x, p1y] = proj(1.6, 1.4, 0), [p2x, p2y] = proj(1.6, -1.4, 0);
                  out.push(s('line', { x1: p1x, y1: p1y, x2: p2x, y2: p2y, stroke: 'var(--ink-2)', 'stroke-width': 6, opacity: 0.5 }));
                  out.push(s('text', { x: X(1.6), y: Y(yc - 1.45) + 16, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'polariser' }));
                  // the beam axis and the travelling wave
                  const [a1x, a1y] = proj(0.4, 0, 0), [a2x, a2y] = proj(9.6, 0, 0);
                  out.push(s('line', { x1: a1x, y1: a1y, x2: a2x, y2: a2y, stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }));
                  let d = '';
                  for (let x = 1.6; x <= 9.0; x += 0.04) {
                    const e = A * Math.cos(3.4 * x - 4 * p.t), ph = rotPhi(x), [px, py] = proj(x, e * Math.cos(ph), e * Math.sin(ph));
                    d += `${d ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
                  }
                  // field arrows at regular spots show the plane of vibration
                  for (let x = 1.8; x <= 9.0; x += 0.25) {
                    const e = A * Math.cos(3.4 * x - 4 * p.t), ph = rotPhi(x), [qx, qy] = proj(x, e * Math.cos(ph), e * Math.sin(ph)), [ox, oy] = proj(x, 0, 0);
                    out.push(s('line', { x1: ox, y1: oy, x2: qx, y2: qy, stroke: 'var(--violet)', 'stroke-width': 1.6, 'stroke-opacity': 0.8 }));
                  }
                  out.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2.5 }));
                  // end-on views: before and after the tube
                  for (const [cx, ph, txt] of [[1.6, 0, 'before'], [8.6, (ROT_DEG * Math.PI) / 180, `after: ${ROT_DEG}°`]]) {
                    const cy = 0.75, R = 0.48;
                    out.push(s('circle', { cx: X(cx), cy: Y(cy), r: X(R) - X(0), fill: 'var(--card)', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
                    out.push(s('line', { x1: X(cx), x2: X(cx), y1: Y(cy - R), y2: Y(cy + R), stroke: 'var(--ink-3)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));
                    out.push(s('line', { x1: X(cx - R * 0.9 * Math.sin(ph)), y1: Y(cy - R * 0.9 * Math.cos(ph)), x2: X(cx + R * 0.9 * Math.sin(ph)), y2: Y(cy + R * 0.9 * Math.cos(ph)), stroke: 'var(--violet)', 'stroke-width': 3 }));
                    out.push(s('text', { x: X(cx + (cx < 5 ? 0.7 : -0.7)), y: Y(cy) + 4, 'text-anchor': cx < 5 ? 'start' : 'end', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: txt }));
                  }
                  return out;
                },
                readout: () => 'Looking into the beam, the plane ends up turned 33° clockwise.',
              },
              after: r`The rotation builds up along the whole path: double the tube length, or the concentration, and the angle doubles. Underneath, the light can be thought of as two circular waves, one twisting left and one right; in a chiral liquid they travel at very slightly different speeds, and their sum is a plane that slowly turns. A non-chiral liquid treats both alike, so nothing turns.`,
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
