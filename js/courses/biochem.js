import { fix } from '../lib/svg.js';
import { r, FS, bars, view } from './_chem.js';

// ---------- Michaelis–Menten ----------
const MM_DATA = [[0.5, 2.1], [1, 3.2], [2, 5.1], [4, 6.6], [8, 8.1], [16, 8.8]];
const mmErr = (V, K) => MM_DATA.reduce((t, [S, v]) => t + (v - (V * S) / (K + S)) ** 2, 0);

// ---------- DNA base pairing ----------
const BASES = ['A', 'T', 'G', 'C'];
const PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
function dnaPuzzle(top) {
  const params = {};
  top.split('').forEach((_, i) => { params['b' + i] = { min: 0, max: 3, step: 1, value: 0, label: `Base ${i + 1}`, format: (v) => BASES[v], control: 'buttons' }; });
  const n = top.length;
  const COL = { A: 'var(--coral)', T: 'var(--amber)', G: 'var(--teal)', C: 'var(--blue)' };
  return {
    kind: 'graph', xmin: 0, xmax: n, ymin: 0, ymax: 4, grid: false, axes: false, height: 230, stackSliders: false,
    params,
    extra: ({ plot, p, s }) => {
      const out = [];
      out.push(s('path', { d: `M${plot.X(0.2)} ${plot.Y(3.3)}H${plot.X(n - 0.2)}M${plot.X(0.2)} ${plot.Y(0.7)}H${plot.X(n - 0.2)}`, stroke: 'var(--ink-3)', 'stroke-width': 6, 'stroke-linecap': 'round' }));
      top.split('').forEach((b, i) => {
        const bot = BASES[p['b' + i]], ok = PAIR[b] === bot, x = plot.X(i + 0.5);
        const hb = ok ? (b === 'G' || b === 'C' ? 3 : 2) : 0;
        for (let k = 0; k < hb; k++) out.push(s('line', { x1: x - 8 * (hb - 1) + 16 * k, x2: x - 8 * (hb - 1) + 16 * k, y1: plot.Y(2.35), y2: plot.Y(1.65), stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '3 4' }));
        if (!ok) out.push(s('text', { x, y: plot.Y(2) + 8, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--error);${FS(20)}`, text: '×' }));
        out.push(s('rect', { x: x - 20, y: plot.Y(3.3), width: 40, height: plot.Y(2.4) - plot.Y(3.3), rx: 8, style: `fill:${COL[b]}` }));
        out.push(s('text', { x, y: plot.Y(2.85) + 7, 'text-anchor': 'middle', style: `fill:#fff;font-weight:700;${FS(18)}`, text: b }));
        out.push(s('rect', { x: x - 20, y: plot.Y(1.6), width: 40, height: plot.Y(0.7) - plot.Y(1.6), rx: 8, style: `fill:${COL[bot]}` }));
        out.push(s('text', { x, y: plot.Y(1.15) + 7, 'text-anchor': 'middle', style: `fill:#fff;font-weight:700;${FS(18)}`, text: bot }));
      });
      return out;
    },
    readout: (p) => { const bad = top.split('').filter((b, i) => PAIR[b] !== BASES[p['b' + i]]).length; return bad ? `${bad} mismatched pair${bad > 1 ? 's' : ''}` : 'Every pair matches ✓'; },
    goal: (p) => (top.split('').every((b, i) => PAIR[b] === BASES[p['b' + i]]) ? true : { ok: false, msg: 'Some bases don’t pair. A pairs with T, G with C.' }),
    solution: Object.fromEntries(top.split('').map((b, i) => ['b' + i, BASES.indexOf(PAIR[b])])),
  };
}

export default {
  id: 'biochem',
  subject: 'physics',
  title: 'Molecules of Life',
  level: 'Intermediate',
  cover: 'biochem',
  tagline: 'Fold a protein, pair DNA, fit an enzyme’s speed curve, and follow the energy in sugar and fat.',
  description: r`Living things are made from a handful of molecular building blocks strung into enormous chains. Find out how amino acids join into proteins, then fold protein chains yourself on a grid, tucking oily beads away from water the way real proteins do. Pair up the bases of DNA, fit the speed curve of an enzyme, see why soap-like molecules build cell walls by themselves, and trace the energy in a sugar molecule all the way to ATP.`,
  prereq: 'Organic Chemistry, and Forces Between Molecules',
  chapters: [
    {
      title: 'Proteins',
      summary: 'Chains that fold themselves.',
      lessons: [
        {
          id: 'building-blocks',
          title: 'Life’s Building Blocks',
          summary: 'Small pieces, long chains',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Four families',
              body: r`Almost everything in a cell belongs to four families of molecules:
- **proteins**, chains of amino acids (enzymes, muscle, hair),
- **nucleic acids**, chains of nucleotides (DNA and RNA),
- **carbohydrates**, sugars and their chains (glucose, starch, cellulose),
- **lipids**, fats and oils (membranes, energy stores).

The first three are **polymers** made by **condensation**: each link joins two pieces and releases a molecule of water. Digestion does the reverse, adding water to break the links (hydrolysis).`,
            },
            {
              type: 'explain',
              title: 'The peptide bond',
              body: r`Amino acids have an amino group ($\mathrm{NH_2}$) at one end and a carboxylic acid (COOH) at the other. The acid of one joins the amine of the next, losing water and forming a **peptide bond**, C(=O)–NH. Here are two glycines joined:`,
              widget: view('NCC(=O)NCC(=O)O', { h: 170, style: 'skeletal', bond: 62 }),
            },
            {
              type: 'numeric',
              title: 'Count the water',
              prompt: r`How many water molecules are released when 100 amino acids join into a single protein chain?`,
              answer: 99,
              wrong: [{ v: 100, why: 'A chain of 100 beads has 99 links between them.' }],
              explain: r`99 links, one water each. A typical protein has 300 or so amino acids; the largest, titin in muscle, has about 34,000.`,
            },
            {
              type: 'order',
              title: 'From small to huge',
              prompt: 'Order these by molar mass, smallest first.',
              items: ['Water (18)', 'Glucose (180)', 'ATP (507)', 'Haemoglobin (about 64,500)', 'A human chromosome’s DNA (about 10¹¹)'],
              explain: r`Biological molecules span ten orders of magnitude, from water to DNA molecules several centimetres long if stretched out.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'So many proteins',
              prompt: r`With 20 kinds of amino acid, how many different sequences of length 100 are possible? Give the answer as a power of ten, $10^x$: what is $x$, to the nearest whole number?`,
              answer: 130,
              tol: 0.6,
              wrong: [{ v: 2000, why: 'Not 20 × 100: each position has 20 choices independently, so it’s 20 to the power 100.' }],
              explain: r`$20^{100} = 10^{100 \log_{10} 20} = 10^{130}$, vastly more than the number of atoms in the observable universe ($\sim 10^{80}$). Evolution has explored only a tiny corner of protein space.`,
            },
          ],
          recap: [
            'Proteins, nucleic acids, carbohydrates, lipids.',
            'Condensation joins monomers (releasing water); hydrolysis splits them.',
          ],
        },
        {
          id: 'amino',
          title: 'Amino Acids',
          summary: 'Twenty side chains',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Same backbone, different side chains',
              body: r`All 20 amino acids share the same backbone, $\mathrm{H_2N{-}CH(R){-}COOH}$, and differ only in the **side chain** R. Some side chains are oily (**hydrophobic**: leucine, valine, phenylalanine), some are polar or charged (**hydrophilic**: serine, lysine, aspartate). This mix of oily and water-loving beads is what makes proteins fold.`,
              widget: view('CC(C)CC(N)C(=O)O', { h: 170, style: 'skeletal', bond: 60, extra: ({ s }) => [s('text', { x: 300, y: 160, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(13)}`, text: 'leucine: an oily, branched side chain' })] }),
            },
            {
              type: 'multi',
              title: 'Oily or not?',
              prompt: 'Which of these side chains are hydrophobic?',
              choices: [
                { t: r`Valine, $\mathrm{{-}CH(CH_3)_2}$`, ok: true },
                { t: r`Phenylalanine, a benzene ring`, ok: true },
                { t: r`Leucine, $\mathrm{{-}CH_2CH(CH_3)_2}$`, ok: true },
                { t: r`Serine, $\mathrm{{-}CH_2OH}$`, why: 'The OH can hydrogen-bond with water.' },
                { t: r`Lysine, $\mathrm{{-}(CH_2)_4NH_3^+}$`, why: 'It ends in a charged group that loves water.' },
              ],
              explain: r`Hydrocarbon side chains (and rings) are oily. OH, $\mathrm{NH_3^+}$ and $\mathrm{COO^-}$ groups make side chains hydrophilic.`,
            },
            {
              type: 'order',
              title: 'Levels of structure',
              prompt: 'Order the levels of protein structure from simplest to most complex.',
              items: ['Primary: the sequence of amino acids', 'Secondary: helices and sheets held by backbone hydrogen bonds', 'Tertiary: the whole chain folded into a 3D shape', 'Quaternary: several folded chains fitting together'],
              explain: r`Haemoglobin shows all four: its sequence folds into helices, each chain folds into a compact globin, and four globins assemble into the oxygen-carrying unit.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'One letter changed',
              prompt: 'In sickle-cell disease, a single glutamate (charged) in haemoglobin is replaced by valine (oily). Why does such a small change matter?',
              choices: [
                { t: 'The oily patch on the surface makes haemoglobin molecules stick together into fibres', ok: true },
                { t: 'It changes the protein’s formula so it can’t carry oxygen at all', why: 'It still carries oxygen; the problem is aggregation.' },
                { t: 'Valine is toxic', why: 'Valine is a normal amino acid found in every protein.' },
              ],
              explain: r`An oily side chain on the outside of the protein seeks other oily surfaces, so deoxygenated haemoglobin molecules stack into long fibres that bend red cells into sickles. One amino acid out of 146: chemistry at the scale of a single side chain.`,
            },
          ],
          recap: [
            'All amino acids share a backbone; side chains differ.',
            'Hydrophobic vs hydrophilic side chains drive folding.',
          ],
        },
        {
          id: 'folding',
          title: 'Protein Folding',
          summary: 'Hide the oily beads',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'The hydrophobic effect',
              body: r`Water molecules around an oily side chain can't hydrogen-bond to it, so they are forced into ordered cages, an entropy cost. Folding the chain so that oily side chains cluster in the middle, away from water, frees those water molecules. That **hydrophobic effect** is the main force folding a protein.

A classic toy model (the HP model) puts the chain on a grid: orange beads are oily (H), blue are polar (P). Each pair of orange beads that touch, other than neighbours along the chain, is a **contact** worth a little energy. Tap a bead to bend the chain there; tap again to bend it the other way, and a third time to straighten it.`,
            },
            {
              type: 'interactive',
              title: 'A small fold',
              prompt: r`Fold this seven-bead chain to make **2** oily contacts.`,
              widget: { kind: 'fold', seq: 'HPPHPPH', target: 2, solution: 'LLSRR', h: 280 },
              explain: r`Bending it into a compact shape brings the end beads together with the middle oily bead. Even this short chain has many possible shapes; only a couple are best.`,
            },
            {
              type: 'interactive',
              title: 'Ten beads',
              prompt: r`Fold this chain to make **4** oily contacts.`,
              widget: { kind: 'fold', seq: 'HPHPPHHPHH', target: 4, solution: 'LSLLRSLL', h: 320 },
              explain: r`The orange beads gather into a small core while the blue ones stay on the outside, in contact with water. Real proteins do this with hundreds of residues, in milliseconds.`,
            },
            {
              type: 'mcq',
              title: 'Levinthal’s paradox',
              prompt: 'A 100-residue protein could take about 3¹⁰⁰ ≈ 10⁴⁷ shapes. Trying one per picosecond would take far longer than the age of the universe, yet proteins fold in milliseconds. How?',
              choices: [
                { t: 'They don’t search at random: small local folds form first and guide the rest downhill', ok: true },
                { t: 'Proteins try all shapes in parallel', why: 'A single molecule can only be in one shape at a time.' },
                { t: 'Most proteins never fold', why: 'Most proteins fold reliably into one shape.' },
              ],
              explain: r`The energy landscape is shaped like a funnel: almost every move that buries an oily residue or makes a hydrogen bond goes downhill towards the native fold. Predicting the final shape from the sequence was solved, to a large extent, by the AlphaFold program in 2020 (Nobel Prize 2024).`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'A famous benchmark',
              prompt: r`This 20-bead sequence is a standard test for folding algorithms; the best possible fold has 9 contacts. Get at least **8**.`,
              widget: { kind: 'fold', seq: 'HPHPPHHPHPPHPHHPPHPH', target: 8, solution: 'LSLLRRLSLLRLRRLLSL', h: 360 },
              explain: r`The best folds wrap the chain around an oily core of about ten orange beads. Computers find them by search; citizen scientists playing the game **Foldit** have even beaten algorithms on real proteins.`,
            },
          ],
          recap: [
            'Oily side chains cluster inside; polar ones face water.',
            'The hydrophobic effect is mainly about water’s entropy.',
            'Proteins fold down an energy funnel, not by random search.',
          ],
        },
        {
          id: 'enzymes',
          title: 'Enzymes',
          summary: 'Catalysts made of protein',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'A pocket that fits',
              body: r`Enzymes are protein catalysts. Their folded shape leaves a pocket, the **active site**, that holds a particular molecule (the **substrate**) in just the right position and electric environment, lowering the activation energy of its reaction. Some speed reactions up by a factor of $10^{17}$ (see Chemical Reactions).

As substrate concentration rises, the rate climbs and then levels off, once every enzyme molecule is busy. Michaelis and Menten (1913) described it as
$$v = \frac{V_{\max}[S]}{K_m + [S]}$$`,
            },
            {
              type: 'interactive',
              title: 'Fit the curve',
              prompt: r`These are measured rates. Adjust $V_{\max}$ and $K_m$ until the curve fits the data.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 17, ymin: 0, ymax: 12, height: 320, grid: false, stackSliders: true,
                axes: { xticks: 4, yticks: 2, xlabel: '[S] (mM)', ylabel: 'rate v', yAt: 0, xAt: 0 },
                params: {
                  V: { min: 4, max: 16, step: 0.2, value: 6, label: 'Vmax', color: 'violet' },
                  K: { min: 0.5, max: 6, step: 0.1, value: 4.5, label: 'Km', color: 'coral', format: (v) => `${fix(v, 1)} mM` },
                },
                curves: [{ f: (x, p) => (p.V * x) / (p.K + x), color: 'violet' }, { f: (x, p) => p.V, color: 'muted', dash: true }],
                points: MM_DATA.map(([x, y]) => ({ x: () => x, y: () => y, color: 'coral' })),
                readout: (p) => `misfit ${fix(mmErr(p.V, p.K), 2)}`,
                goal: (p) => (mmErr(p.V, p.K) < 0.35 ? true : { ok: false, msg: 'The curve misses some points: try matching the plateau first (Vmax), then the steepness (Km).' }),
                solution: { V: 10, K: 2 },
              },
              explain: r`$V_{\max} \approx 10$ and $K_m \approx 2$ mM. The dashed line is $V_{\max}$, the ceiling; $K_m$ is the concentration at which the enzyme works at half speed, a measure of how tightly it grabs its substrate (smaller $K_m$, tighter).`,
            },
            {
              type: 'numeric',
              title: 'Half speed',
              prompt: r`At $[S] = K_m$, what fraction of $V_{\max}$ is the rate?`,
              answer: 0.5,
              tol: 0.001,
              explain: r`$v = V_{\max}K_m/(K_m + K_m) = V_{\max}/2$. That's the definition of $K_m$ in practice: read it off as the concentration giving half the maximum rate.`,
            },
            {
              type: 'mcq',
              title: 'A competitive inhibitor',
              prompt: 'A drug resembling the substrate competes for the active site. What happens to the rate curve?',
              choices: [
                { t: 'It rises more slowly (larger apparent Km), but enough substrate still reaches the same Vmax', ok: true },
                { t: 'Vmax drops and Km stays the same', why: 'That’s non-competitive inhibition, where the inhibitor binds elsewhere.' },
                { t: 'Nothing changes', why: 'Occupied active sites can’t work.' },
              ],
              explain: r`Flood the enzyme with substrate and it outcompetes the inhibitor, so $V_{\max}$ is unchanged, but more substrate is needed to reach half speed. Many drugs work this way (see Drug Design).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Too hot',
              prompt: 'Most human enzymes work fastest near 37 °C and slow sharply above about 45 °C. Why, if reactions normally speed up with temperature?',
              choices: [
                { t: 'Heat unfolds the protein (denaturation), destroying the active site', ok: true },
                { t: 'The substrate evaporates', why: 'The substrate is dissolved and stays put; the enzyme’s shape is what fails.' },
                { t: 'Enzymes only work at body temperature by definition', why: 'Bacteria in hot springs have enzymes that work at 80 °C or more.' },
              ],
              explain: r`Folding is held together by many weak interactions; too much heat shakes them apart. Enzymes from hot-spring bacteria are extra stable, which is why one of them (Taq polymerase, 72 °C) powers the PCR test.`,
            },
          ],
          recap: [
            'Enzymes lower activation energy at a shaped active site.',
            'v = Vmax[S]/(Km + [S]); Km = substrate at half speed.',
            'Heat denatures enzymes; competitive inhibitors raise Km.',
          ],
        },
      ],
    },
    {
      title: 'Information and Energy',
      summary: 'DNA, membranes, fuel.',
      lessons: [
        {
          id: 'dna',
          title: 'DNA',
          summary: 'A code written in pairs',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'Two strands, four letters',
              body: r`DNA is two long strands twisted into a double helix. Each strand is a chain of nucleotides carrying one of four bases: adenine (A), thymine (T), guanine (G) and cytosine (C). The strands are held together by hydrogen bonds between bases, and the shapes only fit in two ways: **A with T** (two hydrogen bonds) and **G with C** (three). So each strand fixes the other: the basis of copying genes.`,
            },
            {
              type: 'interactive',
              title: 'Write the partner strand',
              prompt: r`Choose the bases of the lower strand so that every pair matches.`,
              widget: dnaPuzzle('ATGCGT'),
              explain: r`ATGCGT pairs with TACGCA. (The strands also run in opposite directions, so the partner is conventionally read backwards: ACGCAT.)`,
            },
            {
              type: 'numeric',
              title: 'Count the hydrogen bonds',
              prompt: r`How many hydrogen bonds hold together the pairs in the six-base stretch you just built (ATGCGT with its partner)?`,
              answer: 15,
              wrong: [{ v: 12, why: 'G–C pairs have three hydrogen bonds, not two.' }, { v: 18, why: 'A–T pairs have only two.' }],
              explain: r`Three A–T pairs (positions 1, 2 and 6) give $3 \times 2 = 6$; three G–C pairs (positions 3, 4 and 5) give $3 \times 3 = 9$. Total 15.`,
            },
            {
              type: 'numeric',
              title: 'Chargaff’s rule',
              prompt: r`In a sample of double-stranded DNA, 30% of the bases are adenine. What percentage are guanine?`,
              unit: '%',
              answer: 20,
              wrong: [{ v: 30, why: 'Adenine pairs with thymine, so T is also 30%. G and C share the rest.' }, { v: 40, why: 'That’s G and C together; G is half of it.' }],
              explain: r`A = T = 30%, so G + C = 40% and G = C = 20%. Erwin Chargaff noticed these equalities before anyone knew the structure; they were a key clue for Watson and Crick (with Rosalind Franklin's X-ray photo).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Melting DNA',
              prompt: 'Heating DNA separates its strands ("melting"). Which DNA melts at a higher temperature?',
              choices: [
                { t: 'DNA rich in G–C pairs', ok: true },
                { t: 'DNA rich in A–T pairs', why: 'A–T pairs have only two hydrogen bonds (and stack less strongly).' },
                { t: 'They melt at the same temperature', why: 'Base composition makes a big difference.' },
              ],
              explain: r`G–C pairs hold together more strongly (three hydrogen bonds and stronger stacking), so G–C-rich DNA needs more heat. Microbes from hot springs have especially G–C-rich ribosomal RNA, which has to stay folded at 80 °C and above.`,
            },
          ],
          recap: [
            'A pairs with T (2 H-bonds), G with C (3 H-bonds).',
            'Each strand templates the other.',
            'Chargaff: A = T and G = C.',
          ],
        },
        {
          id: 'membranes',
          title: 'Fats & Membranes',
          summary: 'Walls that build themselves',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Two-faced molecules',
              body: r`Membrane lipids (phospholipids) have a polar, charged head and two oily tails, like soap but bulkier. In water they arrange themselves spontaneously into a **bilayer**: two sheets, tails tucked inside, heads facing the water on both sides. Every cell, and every compartment inside it, is wrapped in one of these self-assembling sheets, only about 5 nm thick.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 220,
                extra: ({ plot, s }) => {
                  const out = [s('rect', { x: 0, y: plot.Y(5), width: 600, height: plot.Y(3.6) - plot.Y(5), fill: 'var(--blue)', 'fill-opacity': 0.1 }), s('rect', { x: 0, y: plot.Y(1.4), width: 600, height: plot.Y(0) - plot.Y(1.4), fill: 'var(--blue)', 'fill-opacity': 0.1 })];
                  for (let k = 0; k < 16; k++) {
                    const x = 0.35 + k * 0.6;
                    for (const [y, dir] of [[3.5, -1], [1.5, 1]]) {
                      out.push(s('path', { d: `M${plot.X(x - 0.08)} ${plot.Y(y)}L${plot.X(x - 0.12)} ${plot.Y(y + dir * 0.9)}M${plot.X(x + 0.08)} ${plot.Y(y)}L${plot.X(x + 0.1)} ${plot.Y(y + dir * 0.9)}`, stroke: 'var(--amber)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
                      out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 9, fill: 'var(--blue)' }));
                    }
                  }
                  out.push(s('text', { x: plot.X(9.9), y: plot.Y(4.4), 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--blue);${FS(13)}`, text: 'water outside' }));
                  out.push(s('text', { x: plot.X(9.9), y: plot.Y(0.5), 'text-anchor': 'end', class: 'lbl halo-text', style: `fill:var(--blue);${FS(13)}`, text: 'water inside' }));
                  return out;
                },
              },
            },
            {
              type: 'mcq',
              title: 'What gets through?',
              prompt: 'Which can cross a bare lipid bilayer most easily?',
              choices: [
                { t: 'Oxygen (small and non-polar)', ok: true },
                { t: 'Sodium ions', why: 'Charged ions can’t pass the oily middle; cells use protein channels for them.' },
                { t: 'Glucose', why: 'Glucose is large and polar; it needs a transporter protein.' },
              ],
              explain: r`The oily core blocks charged and polar molecules. Small non-polar gases ($\mathrm{O_2}$, $\mathrm{CO_2}$) slip straight through; everything else needs protein channels and pumps, which is how cells control what goes in and out.`,
            },
            {
              type: 'numeric',
              title: 'Dense fuel',
              prompt: r`Fat stores about 37 kJ per gram, carbohydrate about 17 kJ/g. How many times more energy per gram is stored in fat? (One decimal place.)`,
              answer: 2.2,
              tol: 0.05,
              explain: r`$37 / 17 \approx 2.2$. Fat chains are almost pure hydrocarbon, already low in oxygen, so burning them releases more energy per gram; and fat is stored without water, while glycogen holds about three times its weight of water.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Cold-water fish',
              prompt: 'Fish living in icy water have membranes with more unsaturated (cis double bond) fatty-acid tails. Why?',
              choices: [
                { t: 'Kinked tails pack loosely, keeping the membrane fluid instead of setting like butter', ok: true },
                { t: 'Double bonds make the fats taste better to predators', why: 'It’s about physics: fluidity at low temperature.' },
                { t: 'Unsaturated fats store more energy', why: 'They store slightly less; the point is flexibility.' },
              ],
              explain: r`Cis double bonds kink the tails (see Stereochemistry), lowering the melting point so the membrane stays fluid in the cold. Fish oils are rich in such fats for exactly this reason.`,
            },
          ],
          recap: [
            'Phospholipids self-assemble into bilayers: oily tails in, heads out.',
            'Bilayers block ions and polar molecules; proteins let them through.',
            'Fat stores ~2× the energy per gram of carbohydrate.',
          ],
        },
        {
          id: 'energy',
          title: 'Sugar to ATP',
          summary: 'The cell’s energy currency',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Burning sugar slowly',
              body: r`Respiration is combustion done in about thirty careful steps:
$$\mathrm{C_6H_{12}O_6 + 6O_2 \to 6CO_2 + 6H_2O} \qquad \Delta G \approx -2870 \text{ kJ/mol}$$
Instead of releasing all that energy as heat at once, cells capture it in small packets by making **ATP** (adenosine triphosphate) from ADP and phosphate. Splitting ATP back releases about 30.5 kJ/mol wherever energy is needed: contracting muscles, pumping ions, building proteins.`,
              widget: bars([['glucose\n(per mol)', 2870, 'amber'], ['ATP made\n(about 30)', 915, 'teal'], ['lost as\nheat', 1955, 'coral']], { ymax: 3200, yticks: 800, ylabel: 'energy (kJ)', height: 260, labelSize: 12 }),
            },
            {
              type: 'numeric',
              title: 'Efficiency',
              prompt: r`If about 30 ATP are made per glucose, each storing 30.5 kJ/mol, what percentage of glucose's 2870 kJ/mol is captured?`,
              unit: '%',
              answer: 32,
              tol: 1,
              explain: r`$30 \times 30.5 = 915$ kJ, and $915/2870 \approx 32\%$; inside the cell, where concentrations differ from standard, the real figure is closer to 40%. Better than a car engine; the rest keeps you warm.`,
            },
            {
              type: 'numeric',
              title: 'Your daily ATP',
              prompt: r`A person uses roughly 8000 kJ a day. If all of it passed through ATP (30.5 kJ/mol, molar mass about 507 g/mol), how many kilograms of ATP would be split per day?`,
              unit: 'kg',
              answer: 133,
              relTol: 0.04,
              wrong: [{ v: 0.133, why: 'Convert grams to kilograms correctly: 262 mol × 507 g/mol = 133,000 g.' }],
              explain: r`$8000/30.5 \approx 262$ mol, × 507 g/mol ≈ 133 kg. Not all energy flows through ATP, so real estimates are about half that: roughly your own body weight, every day. Yet you hold only about 250 g of ATP at any moment: each molecule is recycled over a thousand times a day.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why not just glucose?',
              prompt: 'Why do cells use ATP as the go-between instead of spending glucose directly wherever energy is needed?',
              choices: [
                { t: 'ATP delivers a small, standard packet of free energy that enzymes can couple to almost any reaction', ok: true },
                { t: 'Glucose contains no energy', why: 'Glucose holds a lot; the issue is delivering it in usable amounts.' },
                { t: 'ATP is cheaper to make than glucose', why: 'It’s made from glucose’s energy.' },
              ],
              explain: r`Releasing 2870 kJ in one go would waste most of it as heat. ATP is the cell's small change: its 30.5 kJ/mol is just right to drive one uphill step at a time (see Thermochemistry, Driving Uphill).`,
            },
          ],
          recap: [
            'Respiration: glucose + O₂ → CO₂ + H₂O, ΔG ≈ −2870 kJ/mol, captured stepwise.',
            'ATP: the cell’s energy currency (~30.5 kJ/mol per split), recycled constantly.',
          ],
        },
      ],
    },
  ],
};
