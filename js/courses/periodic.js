const r = String.raw;
const SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr'.split(' ');
const NAME = 'hydrogen helium lithium beryllium boron carbon nitrogen oxygen fluorine neon sodium magnesium aluminium silicon phosphorus sulfur chlorine argon potassium calcium scandium titanium vanadium chromium manganese iron cobalt nickel copper zinc gallium germanium arsenic selenium bromine krypton'.split(' ');
const SUB = [['1s', 1], ['2s', 1], ['2p', 3], ['3s', 1], ['3p', 3], ['4s', 1], ['3d', 5], ['4p', 3]]; // [label, boxes]
// first ionisation energies (eV), Z = 1..20
const IE = [13.6, 24.59, 5.39, 9.32, 8.3, 11.26, 14.53, 13.62, 17.42, 21.56, 5.14, 7.65, 5.99, 8.15, 10.49, 10.36, 12.97, 15.76, 4.34, 6.11];
const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = (n) => String(n).split('').map((d) => SUPS[d]).join('');
const fill = (z) => {
  let left = z;
  return SUB.map(([lab, boxes]) => {
    const n = Math.min(left, 2 * boxes);
    left -= n;
    return [lab, boxes, n];
  });
};
const config = (z) => fill(z).filter(([, , n]) => n > 0).map(([lab, , n]) => `${lab}${sup(n)}`).join(' ');

// calculated atomic radii (pm), Z = 1..20 (Clementi et al.)
const RADIUS = [53, 31, 167, 112, 87, 67, 56, 48, 42, 38, 190, 145, 118, 111, 98, 88, 79, 71, 243, 194];
// orbital shapes: angular part along a slice through the z-axis (θ from the z-axis)
const ORBITALS = [
  ['s', () => 1],
  ['p (pz)', (t) => Math.cos(t)],
  ['d (dz²)', (t) => (3 * Math.cos(t) ** 2 - 1) / 2],
  ['d (dxz)', (t) => Math.sin(2 * t)],
  ['f (fz³)', (t) => (5 * Math.cos(t) ** 3 - 3 * Math.cos(t)) / 2],
];
// Pauling electronegativities for Z = 1..20 (noble gases have none)
const EN = { H: 2.2, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.9, P: 2.19, S: 2.58, Cl: 3.16, K: 0.82, Ca: 1.0 };
const ENL = Object.keys(EN);
const bondType = (d) => (d < 0.4 ? 'nonpolar covalent' : d <= 1.7 ? 'polar covalent' : 'mostly ionic');
// element symbols up to 118, for the heavy-element lesson
const ALL = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');

export default {
  id: 'periodic',
  subject: 'physics',
  title: 'Atoms & the Periodic Table',
  level: 'Advanced',
  cover: 'periodic',
  tagline: 'How quantum rules for electrons build the periodic table, explain bonding, and even make gold golden.',
  description: r`Mendeleev arranged the elements by their properties and predicted ones nobody had found yet. Half a century later, quantum mechanics explained why his table works. Learn the quantum numbers and the Pauli exclusion principle, fill electron shells element by element, use them to explain the patterns in reactivity, size and ionisation energy, predict which bonds are ionic, and discover why relativity makes gold golden.`,
  prereq: 'Quantum Physics',
  chapters: [
    {
      title: 'Building Atoms',
      summary: 'Shells, subshells and the exclusion principle.',
      lessons: [
        {
          id: 'mendeleev',
          title: 'Mendeleev’s Table',
          summary: 'Patterns before explanations',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A bold arrangement',
              body: r`In 1869, Dmitri Mendeleev arranged the 63 known elements in order of atomic weight, starting a new row whenever properties began to repeat, so that similar elements (like lithium, sodium and potassium) lined up in columns.

Where the pattern demanded it, he left **gaps**, and predicted the missing elements' properties. He called one "eka-aluminium": below aluminium, with an atomic weight around 68 and a density around 6 g/cm³.`,
            },
            {
              type: 'mcq',
              title: 'The prediction',
              prompt: r`In 1875, Paul-Émile Lecoq de Boisbaudran discovered gallium, with atomic weight about 69.7 and (after re-measurement) density 5.9 g/cm³. Why was this such a triumph for Mendeleev?`,
              choices: [
                { t: 'It matched his predicted eka-aluminium, showing the table captured real underlying patterns', ok: true },
                { t: 'It proved that atoms contain electrons', why: 'Electrons were discovered in 1897. Gallium confirmed the table’s pattern, not the electron.' },
                { t: 'It showed atomic weights are always whole numbers', why: 'Gallium’s atomic weight is about 69.7, not a whole number.' },
              ],
              explain: r`Successful predictions (gallium in 1875, scandium in 1879, germanium in 1886) convinced chemists that the periodic table reflected something deep. Nobody yet knew what. In 1913, Henry Moseley showed that the true ordering is by **atomic number**, the number of protons, which fixed a few anomalies in Mendeleev's weight ordering.`,
            },
            {
              type: 'numeric',
              title: 'Predicting germanium',
              prompt: r`Mendeleev estimated properties of the missing "eka-silicon" by averaging its four neighbours in the table: silicon (28.1) above, tin (118.7) below, gallium (69.7) to the left and arsenic (74.9) to the right. What atomic weight does that average give? (1 decimal place.)`,
              answer: (28.09 + 118.71 + 69.72 + 74.92) / 4,
              tol: 0.15,
              wrong: [{ v: (28.09 + 118.71) / 2, tol: 0.2, why: 'Average all four neighbours, not just the ones above and below.' }],
              explain: r`$\frac{28.1 + 118.7 + 69.7 + 74.9}{4} \approx 72.9$. Germanium, discovered in 1886, has atomic weight 72.6. Mendeleev had predicted 72, along with its density (5.5 g/cm³; actual 5.3) and the formulas of its compounds.`,
            },
            {
              type: 'interactive',
              title: 'Moseley’s X-rays',
              body: r`In 1913 Henry Moseley fired electrons at metal targets and measured the X-rays they emitted. The strongest line has energy close to $10.2\ \text{eV} \times (Z - 1)^2$, where $Z$ is the number of protons. A copper target gives X-rays of 8.0 keV. Find copper's atomic number.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 25, grid: false, height: 280, axes: { xlabel: 'atomic number Z', ylabel: 'X-ray energy (keV)', xticks: 10, yticks: 5 },
                params: { z: { min: 2, max: 50, step: 1, value: 20, label: 'Z', color: 'violet', format: (v) => `${v} (${ALL[v - 1]})` } },
                curves: [{ f: (x) => (0.0102 * (x - 1) ** 2), color: 'violet', width: 3 }, { f: () => 8.0, color: 'teal', dash: true }],
                points: [{ x: (p) => p.z, y: (p) => 0.0102 * (p.z - 1) ** 2, color: 'coral' }],
                readout: (p) => `${ALL[p.z - 1]} (Z = ${p.z}): predicted X-rays **${(0.0102 * (p.z - 1) ** 2).toFixed(2)} keV**`,
                goal: (p) => p.z === 29,
                hint: r`Solve $10.2\,(Z - 1)^2 = 8000$.`,
                solution: { z: 29 },
              },
              explain: r`$Z = 29$. Plotting $\sqrt{E}$ against $Z$ gives a straight line, so Moseley could read off each element's atomic number directly, and spot **gaps** at $Z = 43, 61, 72$ and $75$: elements not yet discovered (technetium, promethium, hafnium and rhenium). Moseley was killed at Gallipoli in 1915, aged 27.`,
            },
            {
              type: 'numeric',
              title: 'Moseley’s law',
              prompt: r`Moseley found that an element’s characteristic X-ray frequency is proportional to $(Z - 1)^2$. How many times higher is the frequency for zinc ($Z = 30$) than for calcium ($Z = 20$)? (2 decimal places.)`,
              answer: (29 / 19) ** 2,
              tol: 0.01,
              explain: r`$\left(\frac{29}{19}\right)^2 \approx 2.33$. Plotting these frequencies revealed that atomic number, not atomic mass, orders the table, and exposed gaps for undiscovered elements.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Out of order',
              prompt: r`Argon (atomic weight 39.9) comes **before** potassium (39.1) in the periodic table, even though it's heavier. Why is that the right order?`,
              choices: [
                { t: 'Elements are ordered by atomic number: argon has 18 protons and potassium 19', ok: true },
                { t: 'It’s a mistake that nobody has corrected', why: 'It’s deliberate. Argon is a noble gas like neon and krypton; potassium is an alkali metal like sodium.' },
                { t: 'Argon’s weight was measured wrongly', why: 'The weights are correct. Argon’s common isotope (argon-40) has extra neutrons, which add weight but don’t change the chemistry.' },
              ],
              explain: r`Chemistry depends on the number of protons (and so electrons), not on weight. Argon is heavy for its atomic number because its common isotope carries 22 neutrons. Moseley's atomic numbers put argon with the noble gases and potassium with the alkali metals, exactly where their properties say they belong.`,
            },
          ],
          recap: [
            'Mendeleev (1869) arranged elements so that properties repeat periodically.',
            'He left gaps and correctly predicted elements like gallium and germanium.',
            'The true order is by atomic number (Moseley, 1913).',
          ],
        },
        {
          id: 'shells',
          title: 'Shells & Subshells',
          summary: 'Quantum numbers and Pauli',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'An address for each electron',
              body: r`Quantum mechanics gives each electron in an atom a set of **quantum numbers**:

- $n = 1, 2, 3, \dots$: the **shell** (roughly, energy and distance from the nucleus).
- $\ell = 0, 1, \dots, n - 1$: the **subshell**, labelled s, p, d, f for $\ell = 0, 1, 2, 3$.
- $m_\ell$ from $-\ell$ to $+\ell$: one of $2\ell + 1$ **orbitals** in the subshell.
- Spin: up or down.

In 1925, Wolfgang Pauli stated the **exclusion principle**: no two electrons in an atom can share all four quantum numbers. So each orbital holds at most **2** electrons (spin up and spin down), and a subshell holds $2(2\ell + 1)$: 2 for s, 6 for p, 10 for d, 14 for f.`,
            },
            {
              type: 'numeric',
              title: 'Shell capacity',
              prompt: r`How many electrons can the $n = 3$ shell hold in total? (It has subshells $\ell = 0, 1, 2$.)`,
              unit: 'electrons',
              answer: 18,
              wrong: [{ v: 8, why: r`That's s + p only. The $n = 3$ shell also has a d subshell ($\ell = 2$) with room for 10.` }, { v: 9, why: r`There are 9 orbitals, but each holds 2 electrons.` }],
              explain: r`$2 + 6 + 10 = 18$. In general, shell $n$ holds $2n^2$ electrons: 2, 8, 18, 32, …`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Orbital shapes',
              body: r`Each subshell's orbitals have characteristic shapes. Here is a slice through each one (the distance from the centre shows how likely the electron is to be found in that direction; colours show the sign of the wave).`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 1.2, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 360,
                params: { k: { min: 0, max: 4, step: 1, value: 1, label: 'orbital', color: 'violet', format: (v) => ORBITALS[v][0] } },
                extra: ({ plot, p, s }) => { const f = ORBITALS[p.k][1], N = 360, pos = [], neg = []; let mx = 0; for (let i = 0; i <= N; i++) mx = Math.max(mx, Math.abs(f((2 * Math.PI * i) / N))); for (let i = 0; i <= N; i++) { const t = (2 * Math.PI * i) / N, v = f(t) / mx, r = v * v, pt = `${plot.X(r * Math.sin(t)).toFixed(1)} ${plot.Y(r * Math.cos(t)).toFixed(1)}`; (v >= 0 ? pos : neg).push(pt); } const path = (arr) => (arr.length ? 'M' + arr.join('L') : ''); return [s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.15), y2: plot.Y(1.15), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' }), s('text', { x: plot.X(0.05), y: plot.Y(1.1), class: 'tick', text: 'z' }), s('path', { d: path(pos), fill: 'none', stroke: 'var(--coral)', 'stroke-width': 3 }), s('path', { d: path(neg), fill: 'none', stroke: 'var(--blue)', 'stroke-width': 3 }), s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 4, class: 'fl-ink' })]; },
                readout: (p) => ['s: a sphere, the same in every direction (1 orbital per subshell)', 'p: two lobes along an axis (3 orbitals: along x, y and z)', 'd: here a dumbbell with a ring (one of 5 d orbitals)', 'd: four lobes between the axes (one of 5 d orbitals)', 'f: even more lobes (one of 7 f orbitals)'][p.k],
              },
              after: r`Higher $\ell$ means more angular "nodes" (directions where the electron is never found) and more orbitals per subshell: $2\ell + 1$. These shapes decide how atoms bond: the four bonds of carbon point toward the corners of a tetrahedron because of how its s and p orbitals mix.`,
            },
            {
              type: 'numeric',
              title: 'Counting orbitals',
              prompt: r`How many orbitals are there in the $n = 4$ shell (subshells s, p, d and f)?`,
              unit: 'orbitals',
              answer: 16,
              wrong: [{ v: 32, why: 'That’s the number of electrons (2 per orbital).' }, { v: 4, why: r`Each subshell has $2\ell + 1$ orbitals: 1 + 3 + 5 + 7.` }],
              explain: r`$1 + 3 + 5 + 7 = 16 = n^2$ orbitals, holding $2n^2 = 32$ electrons. The 4f subshell fills in the lanthanides, the long row of rare-earth metals usually printed below the main table.`,
            },
            {
              type: 'mcq',
              title: 'Hund’s rule',
              prompt: r`Carbon has two electrons in its 2p subshell, which has three orbitals. How do they arrange themselves?`,
              choices: [
                { t: r`In two different orbitals with parallel spins`, ok: true },
                { t: r`Paired in the same orbital`, why: r`Electrons repel each other, so they spread out into separate orbitals first.` },
                { t: r`One in 2p and one in 3s`, why: r`The 2p subshell has plenty of room for both.` },
              ],
              explain: r`Hund’s rule: electrons occupy empty orbitals of a subshell singly, with parallel spins, before pairing up. That leaves carbon with two unpaired electrons, ready to form bonds, and makes oxygen atoms (with two unpaired 2p electrons) weakly magnetic.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Without Pauli',
              prompt: r`Suppose the exclusion principle didn't exist, so any number of electrons could share an orbital. What would atoms be like?`,
              choices: [
                { t: 'All electrons would crowd into 1s, every element would behave much the same, and there would be no chemistry as we know it', ok: true },
                { t: 'Atoms would be much bigger', why: 'Without Pauli, electrons would all drop into the smallest, lowest orbital: atoms would be smaller.' },
                { t: 'Nothing would change', why: 'The periodic table’s whole structure comes from electrons being forced into higher shells.' },
              ],
              explain: r`It's Pauli's principle that forces electrons into successively higher shells, giving each element its own outer arrangement and so its own chemistry. Freeman Dyson showed that without it, matter couldn't even be stable in bulk: it would collapse.`,
            },
          ],
          recap: [
            'Electrons have quantum numbers n, ℓ, mℓ and spin.',
            'Pauli exclusion: at most 2 electrons per orbital.',
            r`Subshells hold 2 (s), 6 (p), 10 (d), 14 (f); shell $n$ holds $2n^2$.`,
          ],
        },
        {
          id: 'filling',
          title: 'Filling Order',
          summary: 'Building the table element by element',
          icon: 'up',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Adding electrons one by one',
              body: r`Electrons fill the lowest-energy subshells first. The order is not simply shell by shell: **4s fills before 3d**, because the 4s orbital penetrates closer to the nucleus. Within a subshell, electrons spread out one per orbital before pairing up (Hund's rule). Change the atomic number.`,
              widget: {
                kind: 'graph', xmin: 0.3, xmax: 7.6, ymin: -0.5, ymax: 8, grid: false, axes: false, height: 400,
                params: { z: { min: 1, max: 36, step: 1, value: 11, label: 'atomic number', color: 'violet', format: (v) => `${v}: ${NAME[v - 1]} (${SYM[v - 1]})` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  fill(p.z).forEach(([lab, boxes, n], row) => {
                    const y = row + 0.2;
                    els.push(s('text', { x: plot.X(1.2), y: plot.Y(y) + 6, class: 'lbl', 'text-anchor': 'end', text: lab }));
                    for (let b = 0; b < boxes; b++) {
                      const x0 = 1.6 + b * 1.1;
                      els.push(s('rect', { x: plot.X(x0), y: plot.Y(y + 0.38), width: plot.X(x0 + 0.9) - plot.X(x0), height: plot.Y(y - 0.38) - plot.Y(y + 0.38), rx: 4, class: 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 }));
                      const up = n > b, down = n > boxes + b;
                      if (up) els.push(s('text', { x: plot.X(x0 + (down ? 0.28 : 0.45)), y: plot.Y(y) + 7, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--blue)', text: '↑' }));
                      if (down) els.push(s('text', { x: plot.X(x0 + 0.62), y: plot.Y(y) + 7, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--coral)', text: '↓' }));
                    }
                  });
                  els.push(s('text', { x: plot.X(7.5), y: plot.Y(7.6), class: 'tick', 'text-anchor': 'end', text: 'higher energy ↑' }));
                  return els;
                },
                readout: (p) => `${SYM[p.z - 1]}: ${config(p.z)}${p.z === 24 ? ' (actually 3d⁵ 4s¹)' : p.z === 29 ? ' (actually 3d¹⁰ 4s¹)' : ''}`,
              },
              after: r`Sodium (11) has a single electron in 3s beyond a full neon core, just like lithium (2s¹) and potassium (4s¹). That's why they form a family: chemistry is decided by the outermost electrons. (Real atoms have a few exceptions, like chromium and copper, where a half-full or full d subshell is especially stable.)`,
            },
            {
              type: 'numeric',
              title: 'Period lengths',
              prompt: r`The 4th row of the periodic table fills the 4s, 3d and 4p subshells. How many elements does it contain?`,
              unit: 'elements',
              answer: 18,
              wrong: [{ v: 8, why: 'That’s 4s and 4p only. The 3d subshell (10 electrons) is filled in this row too.' }, { v: 32, why: 'That’s the length of rows 6 and 7, which also fill an f subshell.' }],
              explain: r`$2 + 10 + 6 = 18$: from potassium to krypton. The ten 3d elements (scandium to zinc) are the first row of **transition metals**. Rows have lengths 2, 8, 8, 18, 18, 32, 32: exactly what subshell filling predicts.`,
            },
            {
              type: 'numeric',
              title: 'Unpaired electrons',
              prompt: r`Iron (Z = 26) ends in $3d^6$. Following Hund's rule (one electron per orbital before pairing), how many **unpaired** electrons does it have in 3d?`,
              unit: 'electrons',
              answer: 4,
              wrong: [{ v: 6, why: 'Five electrons go in one per orbital; the sixth must pair up with one of them.' }, { v: 2, why: 'Only one 3d orbital ends up with a pair. The other four have one electron each.' }],
              explain: r`Five 3d orbitals take one electron each; the sixth pairs up in one of them, leaving **4 unpaired**. Their aligned spins are the root of iron's magnetism.`,
            },
            {
              type: 'interactive',
              title: 'Name that element',
              body: r`Use the filling diagram again. Find the element whose configuration ends in $4s^2\,3d^{10}\,4p^5$: one electron short of a full shell.`,
              widget: {
                kind: 'graph', xmin: 0.3, xmax: 7.6, ymin: -0.5, ymax: 8, grid: false, axes: false, height: 360,
                params: { z: { min: 1, max: 36, step: 1, value: 20, label: 'atomic number', color: 'violet', format: (v) => `${v}: ${NAME[v - 1]} (${SYM[v - 1]})` } },
                extra: ({ plot, p, s }) => { const els = []; fill(p.z).forEach(([lab, boxes, n], row) => { const y = row + 0.2; els.push(s('text', { x: plot.X(1.2), y: plot.Y(y) + 6, class: 'lbl', 'text-anchor': 'end', text: lab })); for (let b = 0; b < boxes; b++) { const x0 = 1.6 + b * 1.1; els.push(s('rect', { x: plot.X(x0), y: plot.Y(y + 0.38), width: plot.X(x0 + 0.9) - plot.X(x0), height: plot.Y(y - 0.38) - plot.Y(y + 0.38), rx: 4, class: 'fl-card', stroke: 'var(--line-2)', 'stroke-width': 2 })); const up = n > b, down = n > boxes + b; if (up) els.push(s('text', { x: plot.X(x0 + (down ? 0.28 : 0.45)), y: plot.Y(y) + 7, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--blue)', text: '↑' })); if (down) els.push(s('text', { x: plot.X(x0 + 0.62), y: plot.Y(y) + 7, class: 'lbl', 'text-anchor': 'middle', style: 'fill: var(--coral)', text: '↓' })); } }); return els; },
                readout: (p) => `${SYM[p.z - 1]}: ${config(p.z)}`,
                goal: (p) => p.z === 35,
                hint: 'Count: argon’s core (18), then 2 + 10 + 5 more.',
                solution: { z: 35 },
              },
              explain: r`$18 + 2 + 10 + 5 = 35$: **bromine**. Like fluorine and chlorine above it, it's one electron short of a noble-gas shell, so it grabs electrons eagerly: the **halogens** are among the most reactive elements.`,
            },
            {
              type: 'numeric',
              title: 'Chromium breaks the rule',
              prompt: r`Chromium ($Z = 24$) "should" be $[\text{Ar}]\,4s^2\,3d^4$, but really it's $[\text{Ar}]\,4s^1\,3d^5$: one electron moves from 4s into 3d to half-fill it. How many **unpaired** electrons does chromium have?`,
              answer: 6,
              wrong: [{ v: 4, why: r`That's the "expected" $3d^4$ with a paired 4s. In the real configuration, 4s has one electron and each of the five 3d orbitals has one.` }, { v: 5, why: r`Don't forget the lone 4s electron, which is unpaired too.` }],
              explain: r`Five 3d orbitals with one electron each, plus the single 4s electron: **6** unpaired, all with parallel spins. A half-filled (or full) d subshell is especially stable, which is why chromium and copper ($4s^1\,3d^{10}$) break the simple filling order.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Where does the table end?',
              prompt: r`Row 7 ends with oganesson (Z = 118), made in 2002. If an element 119 were made, where would it go?`,
              choices: [
                { t: 'At the start of a new row 8, in the alkali-metal column, with one electron in 8s', ok: true },
                { t: 'At the end of row 7', why: 'Row 7 is full at 118 (a noble-gas configuration). The next electron starts a new shell.' },
                { t: 'Nowhere: the table can’t be extended', why: 'Nothing forbids heavier elements in principle; they’re just extremely hard to make and decay quickly.' },
              ],
              explain: r`After 118 the 8s subshell fills next, so element 119 should be an alkali metal below francium. Labs are trying to make it now. Beyond that, a "g" subshell ($\ell = 4$) is predicted to appear, though relativistic effects in such heavy atoms may blur the familiar patterns.`,
            },
          ],
          recap: [
            'Electrons fill subshells in energy order: 1s 2s 2p 3s 3p 4s 3d 4p …',
            'Elements with the same outer configuration form chemical families.',
            'Row lengths 2, 8, 8, 18, 18, 32, 32 follow from subshell capacities.',
          ],
        },
      ],
    },
    {
      title: 'Periodic Trends',
      summary: 'Explaining chemical behaviour.',
      lessons: [
        {
          id: 'trends',
          title: 'Ionisation Energy',
          summary: 'How tightly electrons are held',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Pulling off an electron',
              body: r`The **first ionisation energy** is the energy needed to remove the outermost electron from an atom. Highlight an element to see its value.`,
              widget: {
                kind: 'graph', xmin: 0.5, xmax: 20.5, ymin: 0, ymax: 27, grid: false, height: 300, padL: 48, axes: { xlabel: 'atomic number', ylabel: 'eV', xticks: 1, yticks: 5, xfmt: (v) => ([2, 10, 18].includes(Math.round(v)) || Math.round(v) % 5 === 0 ? String(Math.round(v)) : ''), xAt: 0.5 },
                params: { z: { min: 1, max: 20, step: 1, value: 11, label: 'element', color: 'violet', format: (v) => `${SYM[v - 1]} (${v})` } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  const d = IE.map((e, i) => `${i ? 'L' : 'M'}${plot.X(i + 1)} ${plot.Y(e)}`).join(' ');
                  els.push(s('path', { d, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  IE.forEach((e, i) => {
                    const noble = [2, 10, 18].includes(i + 1), alkali = [3, 11, 19].includes(i + 1);
                    els.push(s('circle', { cx: plot.X(i + 1), cy: plot.Y(e), r: i + 1 === p.z ? 9 : 5.5, class: noble ? 'fl-teal' : alkali ? 'fl-coral' : 'fl-blue', stroke: i + 1 === p.z ? 'var(--ink)' : 'none', 'stroke-width': 2.5 }));
                  });
                  return els;
                },
                readout: (p) => `${NAME[p.z - 1]}: **${IE[p.z - 1]} eV** · ${config(p.z)}`,
              },
              after: r`Two clear patterns. Across a row, ionisation energy rises: more protons pull on electrons in the same shell. It peaks at the **noble gases** (teal: helium, neon, argon), whose full shells make them famously unreactive. Then it plunges at the **alkali metals** (coral: lithium, sodium, potassium), whose lone outer electron sits in a new, more distant shell, shielded by the electrons inside.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Atomic sizes',
              body: r`Here are calculated atomic radii for the first 20 elements. Find the patterns.`,
              widget: {
                kind: 'graph', xmin: 0.5, xmax: 20.5, ymin: 0, ymax: 260, grid: false, height: 300, padL: 48, axes: { xlabel: 'atomic number', ylabel: 'radius (pm)', xticks: 1, yticks: 50, xfmt: (v) => ([2, 10, 18].includes(Math.round(v)) || Math.round(v) % 5 === 0 ? String(Math.round(v)) : ''), xAt: 0.5 },
                params: { z: { min: 1, max: 20, step: 1, value: 11, label: 'element', color: 'violet', format: (v) => `${SYM[v - 1]} (${v})` } },
                extra: ({ plot, p, s }) => { const els = [s('path', { d: RADIUS.map((r0, i) => `${i ? 'L' : 'M'}${plot.X(i + 1)} ${plot.Y(r0)}`).join(''), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 })]; RADIUS.forEach((r0, i) => { const noble = [2, 10, 18].includes(i + 1), alkali = [3, 11, 19].includes(i + 1); els.push(s('circle', { cx: plot.X(i + 1), cy: plot.Y(r0), r: i + 1 === p.z ? 9 : 5.5, class: noble ? 'fl-teal' : alkali ? 'fl-coral' : 'fl-blue', stroke: i + 1 === p.z ? 'var(--ink)' : 'none', 'stroke-width': 2.5 })); }); return els; },
                readout: (p) => `${NAME[p.z - 1]}: radius **${RADIUS[p.z - 1]} pm** · ionisation energy ${IE[p.z - 1]} eV`,
              },
              after: r`The pattern mirrors ionisation energy, upside down. Across a row, atoms **shrink**: more protons pull the same shell in tighter. Down a column they grow, as each new shell sits farther out. Big atoms hold their outer electrons loosely; small ones hold them tightly.`,
            },
            {
              type: 'numeric',
              title: 'Successive ionisations',
              prompt: r`Magnesium's first three ionisation energies are 7.6, 15.0 and 80.1 eV. The huge jump tells you when you start pulling electrons from a full inner shell. How many **outer** (valence) electrons does magnesium have?`,
              unit: 'electrons',
              answer: 2,
              wrong: [{ v: 3, why: 'The third electron is the expensive one: it comes from the full inner shell. Only the first two are outer electrons.' }, { v: 1, why: 'The second ionisation energy is only about twice the first: still an outer electron.' }],
              explain: r`Removing the first two electrons is fairly cheap; the third costs over five times as much because it comes from the neon-like core. So magnesium has **2** valence electrons, matching its place in column 2 and its habit of forming Mg²⁺ ions.`,
            },
            {
              type: 'mcq',
              title: 'Salt',
              prompt: r`Sodium (ionisation energy 5.1 eV) reacts violently with chlorine, which readily gains one electron to complete its outer shell. What happens in the reaction?`,
              choices: [
                { t: 'Each sodium atom gives its lone outer electron to a chlorine atom, forming Na⁺ and Cl⁻ ions that attract each other', ok: true },
                { t: 'Sodium takes electrons from chlorine', why: 'Sodium holds its outer electron weakly (low ionisation energy) and gives it away; chlorine gains it.' },
                { t: 'They share all their electrons equally', why: 'This bond is ionic: an electron is transferred, leaving oppositely charged ions.' },
              ],
              explain: r`Both end up with the electron arrangement of a noble gas: Na⁺ like neon, Cl⁻ like argon. The ions arrange into a crystal lattice: table salt. The periodic table, built on quantum rules for electrons, predicts this behaviour.`,
            },
            {
              type: 'numeric',
              title: 'Helium’s lone electron',
              prompt: r`The energy to remove hydrogen’s electron is 13.6 eV. For a one-electron ion with nuclear charge $Z$ it is $13.6 Z^2$ eV. How much energy does it take to remove the last electron from helium ($Z = 2$)?`,
              unit: 'eV',
              answer: 54.4,
              tol: 0.01,
              explain: r`$13.6 \times 4 = 54.4$ eV. With no other electron to shield it, the remaining electron feels the full double charge, and sits much closer to the nucleus.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A small dip',
              prompt: r`Ionisation energy generally rises across row 2, but oxygen (13.6 eV) is slightly **lower** than nitrogen (14.5 eV). Why?`,
              choices: [
                { t: 'Oxygen’s 4th p electron must pair up in an already occupied orbital, and the repulsion makes it easier to remove', ok: true },
                { t: 'Oxygen has fewer protons than nitrogen', why: 'Oxygen has 8 protons, nitrogen 7. The dip is about electron pairing.' },
                { t: 'Oxygen’s outer electron is in a new shell', why: 'Both have their outer electrons in the 2p subshell.' },
              ],
              explain: r`Nitrogen's three 2p electrons occupy one orbital each (Hund's rule), a stable half-filled arrangement. Oxygen's fourth 2p electron has to share an orbital, and the extra repulsion makes it easier to remove. The same dip appears between phosphorus and sulfur in row 3.`,
            },
          ],
          recap: [
            'Ionisation energy rises across a row and peaks at the noble gases.',
            'Alkali metals have low ionisation energies: one electron in a new shell.',
            'Electron transfer between sodium and chlorine creates the ions of salt.',
          ],
        },
      ],
    },
    {
      title: 'Chemistry from Quantum Rules',
      summary: 'Bonds, and the strange chemistry of heavy atoms.',
      lessons: [
        {
          id: 'bonds',
          title: 'Tug of War for Electrons',
          summary: 'Electronegativity and bond types',
          icon: 'hand',
          steps: [
            {
              type: 'explain',
              title: 'Who pulls harder?',
              body: r`When two atoms bond, they share a pair of electrons. But the sharing is rarely equal. **Electronegativity**, a scale invented by Linus Pauling in 1932, measures how strongly an atom pulls on shared electrons: from about 0.8 (potassium) to 4.0 (fluorine).

Small, nearly full atoms near the top right of the table pull hardest; big atoms with lone outer electrons, at the left, pull weakest. The **difference** decides the bond type.`,
            },
            {
              type: 'interactive',
              title: 'Pick two atoms',
              body: r`Choose two elements. The bar shows where the shared electrons sit: in the middle for equal sharing, or pulled toward the hungrier atom. Find a pair whose bond is as ionic as possible, with an electronegativity difference of **at least 3**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 3, grid: false, axes: false, height: 180,
                params: { a: { min: 0, max: ENL.length - 1, step: 1, value: ENL.indexOf('H'), label: 'atom A', color: 'blue', format: (v) => `${ENL[v]} (${EN[ENL[v]]})` }, b: { min: 0, max: ENL.length - 1, step: 1, value: ENL.indexOf('O'), label: 'atom B', color: 'coral', format: (v) => `${ENL[v]} (${EN[ENL[v]]})` } },
                extra: ({ plot, p, s }) => { const A = EN[ENL[p.a]], B = EN[ENL[p.b]], d = B - A, share = Math.max(-1, Math.min(1, d / 3.2)); const cx = 5 + 2.6 * share; return [s('line', { x1: plot.X(2), x2: plot.X(8), y1: plot.Y(1.5), y2: plot.Y(1.5), stroke: 'var(--ink-3)', 'stroke-width': 4 }), s('circle', { cx: plot.X(2), cy: plot.Y(1.5), r: 26, class: 'fl-blue-soft', stroke: 'var(--blue)', 'stroke-width': 2 }), s('circle', { cx: plot.X(8), cy: plot.Y(1.5), r: 26, class: 'fl-coral-soft', stroke: 'var(--coral)', 'stroke-width': 2 }), s('ellipse', { cx: plot.X(cx), cy: plot.Y(1.5), rx: 22, ry: 12, class: 'fl-violet', opacity: 0.8 }), s('text', { x: plot.X(2), y: plot.Y(1.5) + 7, 'text-anchor': 'middle', class: 'lbl halo-text', style: 'font-size:20px;font-weight:700', text: ENL[p.a] }), s('text', { x: plot.X(8), y: plot.Y(1.5) + 7, 'text-anchor': 'middle', class: 'lbl halo-text', style: 'font-size:20px;font-weight:700', text: ENL[p.b] })]; },
                readout: (p) => { const d = Math.abs(EN[ENL[p.b]] - EN[ENL[p.a]]); return `difference **${d.toFixed(2)}** · ${bondType(d)}`; },
                goal: (p) => Math.abs(EN[ENL[p.b]] - EN[ENL[p.a]]) >= 3,
                hint: 'Pair the weakest puller (far left of the table) with the strongest (fluorine).',
                solution: { a: ENL.indexOf('K'), b: ENL.indexOf('F') },
              },
              explain: r`Potassium and fluorine differ by 3.16 (sodium and fluorine by 3.05): fluorine effectively takes the electron, leaving K⁺ and F⁻ ions. A rough rule: a difference under 0.4 is **nonpolar covalent** (like C–H or H–H), 0.4 to about 1.7 is **polar covalent** (like O–H), and beyond that mostly **ionic**. Bonds form a continuum, not separate boxes.`,
            },
            {
              type: 'numeric',
              title: 'The water bond',
              prompt: r`Oxygen's electronegativity is 3.44 and hydrogen's is 2.20. What is the difference? (2 decimal places.)`,
              answer: 1.24,
              tol: 0.005,
              wrong: [{ v: 5.64, tol: 0.01, why: 'Subtract, don’t add.' }],
              explain: r`$3.44 - 2.20 = 1.24$: a strongly **polar** covalent bond. Each O–H bond leaves the oxygen slightly negative and the hydrogens slightly positive.`,
            },
            {
              type: 'mcq',
              title: 'Why water is special',
              prompt: r`Water's two polar O–H bonds meet at an angle of 104.5°, not in a straight line. Why does that matter so much?`,
              choices: [
                { t: 'The bent shape keeps the polarities from cancelling, so each molecule has a negative end and a positive end', ok: true },
                { t: 'It makes water molecules heavier', why: 'Shape doesn’t change mass. It decides whether the bond polarities cancel.' },
                { t: 'Straight molecules can’t form', why: 'Carbon dioxide (O=C=O) is straight, so its two polar bonds cancel exactly: it’s nonpolar overall.' },
              ],
              explain: r`Because it's bent, water is a **polar molecule**. The positive hydrogens of one molecule attract the negative oxygen of another (**hydrogen bonds**), which gives water its unusually high boiling point, its surface tension, and its power to dissolve salts. Without that angle, Earth's oceans would boil away.`,
            },
            {
              type: 'numeric',
              title: 'Ionic or covalent?',
              prompt: r`Electronegativities: chlorine 3.16, sodium 0.93. A difference above about 1.7 usually means an ionic bond. What is the difference for NaCl? (2 decimal places.)`,
              answer: 3.16 - 0.93,
              tol: 0.01,
              explain: r`$3.16 - 0.93 = 2.23$: well above 1.7, so chlorine essentially takes sodium’s electron, forming $\text{Na}^+$ and $\text{Cl}^-$ ions held together in a crystal.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The hungriest atom',
              prompt: r`Why is fluorine the most electronegative element?`,
              choices: [
                { t: 'It is small, with a nearly full outer shell close to a nucleus that is only weakly shielded', ok: true },
                { t: 'It has the most protons', why: 'Many elements have more protons. What matters is how strongly the nucleus is felt at the outer shell.' },
                { t: 'It has the most electrons', why: 'It has only 9. Its outer electrons sit very close to the nucleus, with little shielding.' },
              ],
              explain: r`Fluorine's outer shell is the second shell: close to the nucleus, with only two inner electrons shielding a charge of 9. An extra electron would complete that shell and feel a strong pull. Across a row, electronegativity rises with nuclear charge; down a column, it falls as shells move outward.`,
            },
          ],
          recap: [
            'Electronegativity measures an atom’s pull on shared electrons (0.8 to 4.0).',
            'Small differences give covalent bonds, large differences ionic ones.',
            'Water’s bent, polar shape gives it hydrogen bonds and remarkable properties.',
          ],
        },
        {
          id: 'heavy',
          title: 'Why Gold Is Golden',
          summary: 'Relativity inside heavy atoms',
          icon: 'star',
          steps: [
            {
              type: 'explain',
              title: 'Electrons near light speed',
              body: r`In a heavy atom, the innermost (1s) electrons feel the full charge of a huge nucleus and move astonishingly fast. A simple estimate gives their speed as
$$\frac{v}{c} \approx \frac{Z}{137}$$
where $Z$ is the atomic number and 137 is the inverse of the **fine-structure constant**. At those speeds, special relativity matters: the electrons' effective mass grows by $\gamma$, and their orbitals shrink.`,
            },
            {
              type: 'interactive',
              title: 'How fast?',
              body: r`Slide through the elements. Find the first element whose innermost electrons move at more than **half the speed of light**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 120, ymin: 0, ymax: 1, grid: false, height: 260, axes: { xlabel: 'atomic number Z', ylabel: 'v / c', xticks: 20, yticks: 0.25 },
                params: { z: { min: 1, max: 118, step: 1, value: 47, label: 'element', color: 'violet', format: (v) => `${v} (${ALL[v - 1]})` } },
                curves: [{ f: (x) => x / 137, color: 'violet', width: 3 }, { f: () => 0.5, color: 'teal', dash: true }],
                points: [{ x: (p) => p.z, y: (p) => p.z / 137, color: 'coral' }],
                readout: (p) => { const b = p.z / 137, g = 1 / Math.sqrt(1 - b * b); return `${ALL[p.z - 1]}: $v \\approx ${b.toFixed(3)}c$ · $\\gamma = ${g.toFixed(3)}$ · 1s orbital shrinks by about **${(100 * (1 - 1 / g)).toFixed(0)}%**`; },
                goal: (p) => p.z === 69,
                hint: r`You need $Z/137 > 0.5$.`,
                solution: { z: 69 },
              },
              explain: r`$Z = 69$ (thulium) is the first with $Z/137 > \frac12$. For gold ($Z = 79$), $v \approx 0.58c$ and $\gamma \approx 1.22$, so its 1s orbital is about 18% smaller than non-relativistic quantum mechanics predicts. Outer s orbitals shrink along with it.`,
            },
            {
              type: 'numeric',
              title: 'Gold’s factor',
              prompt: r`For gold, $v/c \approx 79/137 \approx 0.577$. What is the Lorentz factor $\gamma = 1/\sqrt{1 - (v/c)^2}$? (2 decimal places.)`,
              lhs: r`$\gamma =$`,
              answer: 1 / Math.sqrt(1 - (79 / 137) ** 2),
              tol: 0.006,
              wrong: [{ v: 1 / (1 - (79 / 137) ** 2), tol: 0.01, why: 'Take the square root before inverting.' }],
              explain: r`$\gamma = \frac{1}{\sqrt{1 - 0.333}} \approx 1.22$. A 22% increase in effective mass shrinks the orbital by the same factor, enough to change gold's chemistry and colour.`,
            },
            {
              type: 'mcq',
              title: 'The colour of gold',
              prompt: r`Silver and gold sit in the same column, yet silver is white and gold is yellow. What does relativity have to do with it?`,
              choices: [
                { t: 'It shrinks gold’s 6s orbital and lifts its 5d level, narrowing the energy gap so gold absorbs blue light and reflects the rest', ok: true },
                { t: 'Gold’s electrons move so fast that they emit yellow light', why: 'Gold isn’t glowing. Its colour comes from which light it absorbs.' },
                { t: 'Nothing: it’s due to impurities', why: 'Pure gold is yellow. Calculations without relativity predict a silvery gold.' },
              ],
              explain: r`In silver the gap between the filled 4d band and the 5s level is about 3.7 eV, in the ultraviolet, so all visible light is reflected: silver looks white. In gold, relativity narrows the corresponding gap to about 2.4 eV, so gold absorbs blue light and reflects yellow and red. Without relativity, gold would look like silver.`,
            },
            {
              type: 'mcq',
              title: 'Liquid mercury',
              prompt: r`Mercury (Z = 80) is the only metal that's liquid at room temperature. Calculations in 2013 confirmed the reason. What is it?`,
              choices: [
                { t: 'Relativity pulls its two 6s electrons in tightly, so they barely take part in bonding between atoms', ok: true },
                { t: 'Mercury atoms are too heavy to stick together', why: 'Heaviness doesn’t prevent bonding. The issue is how willing the outer electrons are to be shared.' },
                { t: 'Mercury is always a little hot', why: 'Its melting point is −39 °C. The question is why it’s so low.' },
              ],
              explain: r`Mercury's filled 6s² shell, contracted and stabilised by relativity, behaves almost like a noble-gas shell, so the bonds between mercury atoms are weak. Calculations that switch off relativity predict a melting point about 100 °C higher: mercury would be a solid at room temperature.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'The end of the table?',
              prompt: r`The simple estimate $v/c = Z/137$ reaches the speed of light at some atomic number. Which?`,
              lhs: r`$Z =$`,
              answer: 137,
              wrong: [{ v: 118, why: 'That’s the heaviest element made so far. The estimate hits v = c at Z = 137.' }],
              explain: r`At $Z = 137$ the naive estimate gives $v = c$, which led to speculation that the table ends there (the hypothetical element was nicknamed "feynmanium"). The proper relativistic theory (the Dirac equation, with a nucleus of finite size) pushes the real limit to around $Z \approx 170$. Nobody knows how far the table can truly go.`,
            },
          ],
          recap: [
            r`Inner electrons of heavy atoms move at roughly $Z/137$ of light speed.`,
            'Relativistic contraction changes chemistry: gold is yellow and mercury is liquid because of it.',
            r`The simple estimate breaks down near $Z = 137$; the true limit of the table is unknown.`,
          ],
        },
        {
          id: 'crystals',
          title: 'Atoms in Crystals',
          summary: 'Unit cells and density',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Repeating boxes',
              body: r`In a metal, atoms sit in a regular 3D pattern built by repeating a small box, the **unit cell**. Three common patterns:
- **simple cubic**: an atom at each corner of a cube;
- **body-centred cubic (BCC)**: corners plus one atom in the centre (iron, chromium, tungsten);
- **face-centred cubic (FCC)**: corners plus one atom in the middle of each face (copper, gold, aluminium).

Corner atoms are shared by 8 neighbouring cells and face atoms by 2, so a BCC cell contains $8 \times \frac18 + 1 = 2$ atoms.`,
            },
            {
              type: 'numeric',
              title: 'Counting FCC atoms',
              prompt: r`How many atoms belong to one face-centred cubic unit cell?`,
              answer: 4,
              explain: r`$8 \times \frac18$ (corners) $+ 6 \times \frac12$ (faces) $= 1 + 3 = 4$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Measure the iron cell',
              prompt: r`Iron is BCC, with molar mass 55.85 g/mol, and its density is 7.87 g/cm³. Each cell holds 2 atoms, so density $= \frac{2 \times 55.85}{N_A\,a^3}$. Adjust the cell side $a$ until the density matches.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1, xmax: 2.6, ymin: -0.8, ymax: 2.3, grid: false, axes: false, maxWidth: 340, pad: 6,
                params: { a: { min: 200, max: 400, step: 0.1, value: 320, label: 'cell side a', color: 'violet', format: (v) => `${v.toFixed(1)} pm` } },
                extra: ({ plot, p, s }) => { const k = p.a / 300, P = (x, y, z) => [k * (x + 0.45 * z), k * (y + 0.35 * z)], C = []; for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) C.push(P(x, y, z)); const E = [[0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7]], out = E.map(([i, j]) => s('line', { x1: plot.X(C[i][0]), y1: plot.Y(C[i][1]), x2: plot.X(C[j][0]), y2: plot.Y(C[j][1]), stroke: 'var(--ink-3)', 'stroke-width': 1.5 })); C.forEach(([x, y]) => out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 9, class: 'fl-blue' }))); const c = P(0.5, 0.5, 0.5); out.push(s('circle', { cx: plot.X(c[0]), cy: plot.Y(c[1]), r: 11, class: 'fl-coral' })); return out; },
                readout: (p) => { const rho = (2 * 55.85) / (6.022e23 * (p.a * 1e-10) ** 3); return `cell volume ${((p.a * 1e-10) ** 3 * 1e24).toFixed(4)} × 10⁻²⁴ cm³ · density **${rho.toFixed(2)} g/cm³**`; },
                goal: (p) => Math.abs((2 * 55.85) / (6.022e23 * (p.a * 1e-10) ** 3) - 7.87) < 0.025,
                hint: r`$a^3 = \frac{2 \times 55.85}{6.022 \times 10^{23} \times 7.87}$ cm³; then take the cube root (1 pm = $10^{-10}$ cm).`,
                solution: { a: 286.7 },
              },
              explain: r`$a \approx 287$ pm, matching X-ray measurements (286.7 pm). Run the other way, this is how Avogadro’s number was pinned down precisely: measure the cell size by X-ray diffraction and the density on a balance.`,
            },
            {
              type: 'numeric',
              title: 'How full?',
              prompt: r`In BCC, the atoms (treated as touching spheres) fill $\frac{\pi\sqrt3}{8}$ of the space. What percentage is that? (Nearest whole number.)`,
              unit: '%',
              answer: (Math.PI * Math.sqrt(3) / 8) * 100,
              tol: 0.6,
              explain: r`$\frac{\pi\sqrt3}{8} \approx 0.68$: 68%. FCC does better, 74%, the greengrocer’s packing, which is the densest possible for equal spheres.`,
            },
            {
              type: 'mcq',
              title: 'Bendy metals',
              prompt: r`FCC metals such as copper, gold and aluminium are typically very ductile (easily drawn into wire). Why does the crystal structure matter?`,
              choices: [
                { t: 'FCC has many closely packed planes along which layers of atoms can slip past each other', ok: true },
                { t: 'FCC atoms are softer', why: 'The atoms themselves aren’t soft; the arrangement provides easy slip planes.' },
                { t: 'FCC metals have fewer atoms', why: 'They are actually more densely packed than BCC.' },
              ],
              explain: r`Metals deform when planes of atoms slide over each other, helped by defects called dislocations. FCC has 12 easy slip systems on its close-packed planes; BCC metals like iron are often stiffer and can turn brittle in the cold.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Density of copper',
              prompt: r`Copper is FCC with cell side 361.5 pm and molar mass 63.55 g/mol. What is its density in g/cm³? (2 decimal places; $N_A = 6.022 \times 10^{23}$.)`,
              unit: 'g/cm³',
              answer: (4 * 63.55) / (6.022e23 * (3.615e-8) ** 3),
              tol: 0.02,
              explain: r`$\frac{4 \times 63.55}{6.022 \times 10^{23} \times (3.615 \times 10^{-8})^3} \approx 8.94$ g/cm³, matching the measured 8.96 g/cm³. Four atoms per cell, a cube a third of a nanometre wide: that’s copper.`,
            },
          ],
          recap: [
            'Crystals repeat a unit cell: simple cubic, BCC (2 atoms) or FCC (4 atoms).',
            r`Density $= \frac{nM}{N_A a^3}$ links cell size, atomic mass and density.`,
            'FCC packs 74% of space and has many slip planes, making metals ductile.',
          ],
        },
      ],
    },
  ],
};
