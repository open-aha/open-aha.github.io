import { sig } from '../lib/svg.js';

const r = String.raw;

const SM = {
  kind: 'figure', w: 600, h: 330, label: 'The Standard Model of particle physics',
  draw: ({ s }) => {
    const cells = [
      ['u', 'up', '+2/3', 0, 0, 'coral'], ['c', 'charm', '+2/3', 1, 0, 'coral'], ['t', 'top', '+2/3', 2, 0, 'coral'],
      ['d', 'down', '−1/3', 0, 1, 'coral'], ['s', 'strange', '−1/3', 1, 1, 'coral'], ['b', 'bottom', '−1/3', 2, 1, 'coral'],
      ['e', 'electron', '−1', 0, 2, 'blue'], ['μ', 'muon', '−1', 1, 2, 'blue'], ['τ', 'tau', '−1', 2, 2, 'blue'],
      ['νₑ', 'e-neutrino', '0', 0, 3, 'blue'], ['ν_μ', 'μ-neutrino', '0', 1, 3, 'blue'], ['ν_τ', 'τ-neutrino', '0', 2, 3, 'blue'],
      ['g', 'gluon', '0', 3.3, 0, 'teal'], ['γ', 'photon', '0', 3.3, 1, 'teal'], ['Z', 'Z boson', '0', 3.3, 2, 'teal'], ['W', 'W boson', '±1', 3.3, 3, 'teal'],
      ['H', 'Higgs', '0', 4.55, 1.5, 'amber'],
    ];
    const els = [];
    for (const [sym, name, q, cx, cy, col] of cells) {
      const x = 12 + cx * 104, y = 20 + cy * 74;
      els.push(s('rect', { x, y, width: 96, height: 66, rx: 10, class: `fl-${col}-soft`, stroke: `var(--${col})`, 'stroke-width': 2 }));
      els.push(s('text', { x: x + 48, y: y + 34, 'text-anchor': 'middle', style: 'font-size:24px;font-weight:800;font-family:var(--font-display);font-style:italic;fill:var(--ink)', text: sym.replace('_', '') }));
      els.push(s('text', { x: x + 48, y: y + 54, 'text-anchor': 'middle', class: 'tick', style: 'font-size:max(calc(10.5px * var(--fs, 1)), var(--fmin, 0px))', text: name }));
      els.push(s('text', { x: x + 90, y: y + 15, 'text-anchor': 'end', class: 'tick', style: 'font-size:max(calc(10px * var(--fs, 1)), var(--fmin, 0px))', text: q }));
    }
    return els;
  },
};

// quark builder: charges and the baryons you can make from u, d, s
const QUARKS = ['u', 'd', 's'];
const QCHARGE = { u: 2 / 3, d: -1 / 3, s: -1 / 3 };
const BARYONS = { duu: 'proton', ddu: 'neutron', uuu: 'Δ⁺⁺', ddd: 'Δ⁻', suu: 'Σ⁺', dds: 'Σ⁻', dsu: 'Λ⁰ (or Σ⁰)', ssu: 'Ξ⁰', dss: 'Ξ⁻', sss: 'Ω⁻' };
const baryon = (q) => BARYONS[[...q].sort().join('')] || '';
const fracCharge = (x) => { const t = Math.round(x * 3); return t % 3 === 0 ? `${t / 3 > 0 ? '+' : ''}${t / 3}` : `${t > 0 ? '+' : '−'}${Math.abs(t)}/3`; };
// masses in eV (neutrino: rough upper scale)
const MASSES = [['neutrino', 0.05], ['electron', 0.511e6], ['up quark', 2.2e6], ['down quark', 4.7e6], ['strange quark', 95e6], ['muon', 105.7e6], ['proton (not fundamental)', 938.3e6], ['charm quark', 1.27e9], ['tau', 1.777e9], ['bottom quark', 4.18e9], ['W boson', 80.4e9], ['Z boson', 91.2e9], ['Higgs boson', 125.1e9], ['top quark', 172.7e9]];
const eV = (m) => (m < 1e3 ? `${m} eV` : m < 1e6 ? `${(m / 1e3).toFixed(1)} keV` : m < 1e9 ? `${(m / 1e6).toFixed(1)} MeV` : `${(m / 1e9).toFixed(1)} GeV`);
// Higgs search toy model: expected events per 1 GeV bin of diphoton mass, for data amount L
const higgsBg = (m) => 900 * Math.exp(-(m - 100) / 30) / 8;
const higgsSig = (m) => (30 / (2 * Math.sqrt(2 * Math.PI))) * Math.exp(-((m - 125) ** 2) / 8);
const noise = (i, seed) => { let a = (i * 2654435761 + seed * 97) >>> 0; const u = () => { a = (a * 1664525 + 1013904223) >>> 0; return (a + 0.5) / 4294967296; }; return Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u()); };
const higgsZ = (L) => { let S = 0, B = 0; for (let m = 121; m <= 129; m++) { S += higgsSig(m) * L; B += higgsBg(m) * L; } return S / Math.sqrt(B); };

export default {
  id: 'particles',
  subject: 'physics',
  title: 'Particle Physics',
  level: 'Advanced',
  cover: 'particles',
  tagline: 'Quarks, leptons, forces, antimatter, colliders and the hunt for the Higgs.',
  description: r`Zoom inside the proton to find quarks, meet the full cast of the Standard Model, compare the four fundamental forces, and discover antimatter, which annihilates on contact with matter in a flash of pure energy. Then see why colliders collide and hunt for the Higgs boson in a histogram.`,
  prereq: 'Nuclear Physics, and Special Relativity',
  chapters: [
    {
      title: 'The Building Blocks',
      summary: 'Quarks, leptons and the Standard Model.',
      lessons: [
        {
          id: 'quarks',
          title: 'Inside the Proton',
          summary: 'Quarks',
          icon: 'atom',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Smaller still',
              prompt: 'Atoms contain nuclei, and nuclei contain protons and neutrons. Are protons fundamental (made of nothing smaller)?',
              choices: [
                { t: 'No: each is made of three quarks', ok: true },
                { t: 'Yes, they’re the smallest particles', why: 'Experiments in the late 1960s, which fired electrons at protons, revealed point-like particles inside them: quarks.' },
              ],
              explain: r`Protons and neutrons are each made of three **quarks**, bound by the strong force. As far as we know, electrons and quarks are truly fundamental, with no smaller parts.`,
            },
            {
              type: 'explain',
              title: 'Up and down quarks',
              body: r`Ordinary matter needs just two kinds of quark:
- the **up** quark, with charge $+\tfrac23$,
- the **down** quark, with charge $-\tfrac13$

(in units of the proton's charge). A proton is **uud**: $\tfrac23 + \tfrac23 - \tfrac13 = +1$. A neutron is **udd**: $\tfrac23 - \tfrac13 - \tfrac13 = 0$.

Quarks are never found alone. They're always confined inside composite particles. Try to pull one out, and the energy you put in creates new quark–antiquark pairs instead.`,
            },
            {
              type: 'numeric',
              title: 'A strange particle',
              prompt: r`The $\Delta^{++}$ particle is made of three up quarks (uuu). What is its charge?`,
              answer: 2,
              wrong: [{ v: 1, why: r`Each up quark has charge $+\tfrac23$: $3 \times \tfrac23$.` }],
              explain: r`$3 \times \tfrac23 = +2$. That's twice the proton's charge, hence the "++".`,
            },
            {
              type: 'interactive',
              title: 'Build a baryon',
              body: r`Particles made of three quarks are **baryons**. Add the **strange** quark (charge $-\tfrac13$, heavier than up and down) to your toolkit, and build a **neutral** baryon that contains at least one strange quark.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 9, ymin: -0.5, ymax: 3.9, grid: false, axes: false, height: 260,
                params: Object.fromEntries([0, 1, 2].map((k) => [`q${k}`, { min: 0, max: 2, step: 1, value: [0, 0, 1][k], label: `quark ${k + 1}`, color: ['coral', 'blue', 'teal'][k], format: (v) => QUARKS[v] }])),
                extra: ({ plot, p, s }) => { const q = [p.q0, p.q1, p.q2].map((v) => QUARKS[v]); const cols = ['coral', 'blue', 'teal'], els = [s('circle', { cx: plot.X(4.5), cy: plot.Y(1.7), r: plot.Y(0) - plot.Y(1.95), fill: 'var(--surface-2)', stroke: 'var(--ink-3)', 'stroke-width': 2 })]; q.forEach((x, i) => { const a = (i * 2 * Math.PI) / 3 - Math.PI / 2, k = (plot.Y(0) - plot.Y(1)) / (plot.X(1) - plot.X(0)), cx = 4.5 + 1.1 * k * Math.cos(a), cy = 1.7 - 1.1 * Math.sin(a); els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: 30, class: `fl-${cols[i]}-soft`, stroke: `var(--${cols[i]})`, 'stroke-width': 2 }), s('text', { x: plot.X(cx), y: plot.Y(cy) + 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:22px;font-weight:700;font-style:italic', text: x })); }); return els; },
                readout: (p) => { const q = [p.q0, p.q1, p.q2].map((v) => QUARKS[v]), c = q.reduce((a, x) => a + QCHARGE[x], 0), nm = baryon(q.join('')); return `${q.join('')}: charge **${fracCharge(c)}**${nm ? ` · this is the **${nm}**` : ''}`; },
                goal: (p) => { const q = [p.q0, p.q1, p.q2].map((v) => QUARKS[v]); return q.includes('s') && Math.abs(q.reduce((a, x) => a + QCHARGE[x], 0)) < 1e-9; },
                hint: 'Up has +2/3; down and strange have −1/3 each. You need the charges to cancel.',
                solution: { q0: 0, q1: 1, q2: 2 },
              },
              explain: r`**uds** ($+\tfrac23 - \tfrac13 - \tfrac13 = 0$) is the $\Lambda^0$ (or its sibling the $\Sigma^0$), and **uss** is the $\Xi^0$. Physicists in the 1950s found dozens of these "strange" particles in cosmic rays. Murray Gell-Mann's "Eightfold Way" (1961) organised them into neat patterns and predicted a missing particle, the $\Omega^-$, found exactly as predicted in 1964. That same year Gell-Mann explained the patterns with quarks, and the $\Omega^-$ turned out to be **sss**.`,
            },
            {
              type: 'numeric',
              title: 'A quark and an antiquark',
              prompt: r`Particles made of a quark and an **antiquark** are **mesons**. An antiquark has the opposite charge of its quark. What is the charge of the pion $\pi^+$, made of an up quark and an anti-down quark ($u\bar d$)?`,
              answer: 1,
              wrong: [{ v: 1 / 3, tol: 0.01, why: r`The anti-down has charge $+\tfrac13$, not $-\tfrac13$: $\tfrac23 + \tfrac13$.` }, { v: -1, why: 'Both parts are positive here.' }],
              explain: r`$+\tfrac23 + \tfrac13 = +1$. Pions are the lightest mesons; they carry the residual strong force that binds protons and neutrons together inside nuclei.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Beta decay, deeper',
              prompt: 'In beta decay a neutron (udd) turns into a proton (uud). What happens at the quark level?',
              choices: [
                { t: 'A down quark turns into an up quark, emitting an electron and an antineutrino', ok: true },
                { t: 'An up quark is added from outside', why: 'Nothing comes from outside. One quark changes type.' },
                { t: 'The neutron splits into separate quarks', why: 'Quarks are never released on their own. One quark changes flavour.' },
              ],
              explain: r`Via the **weak force**, one down quark ($-\tfrac13$) becomes an up quark ($+\tfrac23$), and the charge difference leaves as an electron (with an antineutrino). The weak force is the only force that can change a quark's type ("flavour").`,
            },
          ],
          recap: [
            'Protons (uud) and neutrons (udd) are made of up and down quarks.',
            'Up: +2/3, down: −1/3. Quarks are always confined inside composite particles.',
            'The weak force can change a quark’s flavour, as in beta decay.',
          ],
        },
        {
          id: 'standard-model',
          title: 'The Standard Model',
          summary: 'The full cast',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'The particle table',
              body: r`Everything we know is built from a small set of particles: the **Standard Model**.`,
              widget: SM,
              after: r`- **{coral:Quarks}** (6): they feel the strong force and make up protons and neutrons.
- **{blue:Leptons}** (6): the electron and its heavier cousins (muon, tau), plus three nearly massless **neutrinos**.
- **{teal:Force carriers}**: the gluon (strong force), photon (electromagnetism), and W and Z (weak force).
- The **{amber:Higgs boson}**, linked to how particles get mass. It was discovered at CERN in 2012.`,
            },
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Three generations',
              prompt: 'Each row of matter particles (like electron → muon → tau) gets heavier from left to right. What is everyday matter made of?',
              choices: [
                { t: 'Only the lightest, first column: up, down, electron (and electron neutrinos)', ok: true },
                { t: 'All three columns equally', why: 'The heavier versions are unstable. They decay within tiny fractions of a second into lighter particles.' },
              ],
              explain: r`The second and third "generations" are heavier copies that quickly decay. They're made in particle accelerators and cosmic-ray collisions. Why nature has exactly three generations is still a mystery.`,
            },
            {
              type: 'mcq',
              title: 'Ghost particles',
              prompt: 'About 60 billion neutrinos from the Sun pass through each square centimetre of your skin every second. Why don’t you notice?',
              choices: [
                { t: 'They have no charge and barely interact: almost all pass straight through Earth', ok: true },
                { t: 'They’re stopped by your skin', why: 'They pass through you, and through the entire Earth, almost unaffected.' },
                { t: 'They only exist at night', why: 'They come straight through the Earth, so it’s the same day and night.' },
              ],
              explain: r`Neutrinos feel only the weak force (and gravity), so they interact extraordinarily rarely. A neutrino could typically pass through light-years of lead. Detecting them needs enormous detectors and patience.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A huge range of masses',
              body: r`The fundamental particles have wildly different masses. Here they are on a logarithmic scale (each step is 10 times heavier).`,
              widget: {
                kind: 'graph', xmin: -2, xmax: 12, ymin: 0, ymax: 3, grid: false, height: 200, padR: 48, axes: { xlabel: 'mass (eV, log scale)', xlabelBelow: 'edge', xAt: -2, xticks: 2, yticks: 0, xfmt: (v) => `10${String(v).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`, yAt: 0.5 },
                params: { k: { min: 0, max: MASSES.length - 1, step: 1, value: 1, label: 'particle', color: 'violet', format: (v) => MASSES[v][0] } },
                extra: ({ plot, p, s }) => MASSES.map(([nm, m], i) => s('circle', { cx: plot.X(Math.log10(m)), cy: plot.Y(1.2 + (i % 3) * 0.5), r: i === p.k ? 9 : 5, class: i === p.k ? 'fl-coral' : nm.includes('quark') ? 'fl-coral-soft' : nm.includes('boson') ? 'fl-teal' : 'fl-blue', stroke: 'var(--ink-3)' })),
                readout: (p) => `${MASSES[p.k][0]}: **${p.k === 0 ? 'less than 0.1 eV' : eV(MASSES[p.k][1])}**`,
              },
              after: r`From neutrinos (under 0.1 eV) to the top quark (173 GeV) spans more than 12 powers of ten. In the Standard Model these masses come from how strongly each particle interacts with the **Higgs field**, but nobody knows why the strengths are what they are. (Most of a proton's mass isn't from its quarks' masses at all, but from the energy of the gluons binding them.)`,
            },
            {
              type: 'numeric',
              title: 'Top versus electron',
              prompt: r`The top quark's mass is about 172.7 GeV and the electron's is 0.511 MeV. How many times heavier is the top quark? (To 2 significant figures.)`,
              unit: '×',
              answer: 172.7e9 / 0.511e6,
              relTol: 0.02,
              wrong: [{ v: 172.7 / 0.511, relTol: 0.02, why: 'Convert GeV to MeV first: 172.7 GeV = 172,700 MeV.' }],
              explain: r`$\frac{172{,}700}{0.511} \approx 338{,}000$: a single top quark weighs about as much as a gold atom. It decays in about $5 \times 10^{-25}$ s, too fast even to form hadrons.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'What’s missing?',
              prompt: 'Which of these does the Standard Model NOT explain?',
              choices: [
                { t: 'Gravity, and dark matter', ok: true },
                { t: 'Why atoms have electrons', why: 'Electrons and electromagnetism are core parts of the Standard Model.' },
                { t: 'How the Sun’s fusion works', why: 'Fusion involves the strong and weak forces, both in the Standard Model.' },
              ],
              explain: r`The Standard Model is spectacularly successful, but it leaves out gravity, and it has no particle that could be **dark matter** (which seems to outweigh ordinary matter about five to one). Finding what lies beyond it is one of physics' biggest quests.`,
            },
          ],
          recap: [
            'Standard Model: 6 quarks, 6 leptons, the force carriers, and the Higgs boson.',
            'Everyday matter uses only up and down quarks, and electrons.',
            'The Standard Model doesn’t include gravity or dark matter.',
          ],
        },
      ],
    },
    {
      title: 'Forces and Antimatter',
      summary: 'How particles interact.',
      lessons: [
        {
          id: 'four-forces',
          title: 'The Four Forces',
          summary: 'Strong, electromagnetic, weak, gravity',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Four fundamental forces',
              body: r`| Force | Relative strength | Range | What it does |
|---|---|---|---|
| Strong | 1 | ~10⁻¹⁵ m | binds quarks and nuclei |
| Electromagnetic | ~1/137 | infinite | atoms, chemistry, light |
| Weak | ~10⁻⁶ | ~10⁻¹⁸ m | radioactive decay, fusion |
| Gravity | ~10⁻³⁹ | infinite | planets, stars, galaxies |

Every force you've ever felt (friction, tension, a push) is electromagnetism between atoms, apart from gravity.`,
            },
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The weakest wins',
              prompt: 'Gravity is by far the weakest force. Why does it dominate the motion of planets and galaxies?',
              choices: [
                { t: 'It always attracts and has infinite range, while large objects are electrically neutral', ok: true },
                { t: 'It becomes stronger at large distances', why: 'Like electromagnetism, it weakens as 1/r². What matters is that it never cancels.' },
                { t: 'The other forces don’t exist in space', why: 'They exist everywhere. But the strong and weak forces are short-range, and electric charges cancel out.' },
              ],
              explain: r`The strong and weak forces only reach across a nucleus. Electromagnetism has infinite range, but positive and negative charges cancel in bulk matter. Gravity only ever adds up, so with enough mass, it wins.`,
            },
            {
              type: 'numeric',
              title: 'Electric versus gravity',
              prompt: r`Two protons repel electrically with force $\frac{ke^2}{r^2}$ and attract gravitationally with $\frac{Gm_p^2}{r^2}$. The ratio doesn't depend on distance. Using $ke^2 = 2.31 \times 10^{-28}$ N·m² and $Gm_p^2 = 1.87 \times 10^{-64}$ N·m², what is it? (Give the power of ten, rounded.)`,
              lhs: r`ratio $\approx 10^{\,?}$`,
              answer: 36,
              wrong: [{ v: 92, why: 'Divide, don’t multiply: 10⁻²⁸ ÷ 10⁻⁶⁴.' }, { v: -36, why: 'The electric force is the bigger one, so the ratio is a huge positive power.' }],
              explain: r`$\frac{2.31 \times 10^{-28}}{1.87 \times 10^{-64}} \approx 1.2 \times 10^{36}$. Gravity is absurdly weak: a fridge magnet holding up a paperclip beats the gravitational pull of the entire Earth on it. Why gravity is so weak (the "hierarchy problem") is an open question.`,
            },
            {
              type: 'mcq',
              title: 'Messenger particles',
              prompt: 'In the Standard Model, how do two electrons repel each other?',
              choices: [
                { t: 'By exchanging (virtual) photons', ok: true },
                { t: 'By exchanging gluons', why: 'Gluons carry the strong force between quarks. Electrons don’t feel the strong force.' },
                { t: 'Through direct contact', why: 'There’s no "contact" at the particle level. Forces are carried by exchanged particles.' },
              ],
              explain: r`In quantum field theory, forces come from exchanging force-carrying particles: photons for electromagnetism, gluons for the strong force, and W and Z bosons for the weak force. The heavy W and Z are why the weak force has such a short range.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Which force wins?',
              body: r`Compare the potential energy between two protons from the electric repulsion ($1.44\ \text{MeV·fm} / r$) and from a simple model of the nuclear force ($50\ \text{MeV·fm} \times e^{-r/1.4\,\text{fm}} / r$). Gravity is off the chart, 36 powers of ten below the electric force. Slide the distance.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 2, ymin: -5, ymax: 3, grid: false, height: 280, axes: { xlabel: 'distance (powers of 10 fm)', ylabel: 'energy (powers of 10 MeV)', xticks: 0.5, yticks: 1, xAt: -1, yAt: -5 },
                params: { L: { min: -1, max: 2, step: 0.01, value: 0, label: 'distance', color: 'coral', format: (v) => `${(10 ** v).toFixed(2)} fm` } },
                curves: [{ f: (x) => Math.log10(1.44 / 10 ** x), color: 'blue', width: 3 }, { f: (x) => Math.log10((50 * Math.exp(-(10 ** x) / 1.4)) / 10 ** x), color: 'coral', width: 3 }],
                extra: ({ plot, p, s }) => [s('line', { x1: plot.X(p.L), x2: plot.X(p.L), y1: plot.Y(-5), y2: plot.Y(3), stroke: 'var(--ink-3)', 'stroke-dasharray': '4 4' })],
                readout: (p) => { const r = 10 ** p.L, em = 1.44 / r, nu = (50 * Math.exp(-r / 1.4)) / r; return `electric (blue) **${em.toPrecision(3)} MeV** · nuclear (coral) **${nu.toPrecision(3)} MeV** · ${nu > em ? 'the nuclear force wins' : 'the electric force wins'}`; },
              },
              after: r`Inside a nucleus (a few fm) the nuclear force is far stronger and binds protons together despite their repulsion. But it dies off exponentially, so beyond about 5 fm the electric force takes over. That short range is why big nuclei, with many protons all repelling each other, become unstable.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Range from mass',
              prompt: r`A force carried by a particle of mass $m$ has a range of roughly $\frac{\hbar c}{mc^2}$, with $\hbar c = 197$ MeV·fm. In 1935 Hideki Yukawa noted that the nuclear force reaches about 1.4 fm and predicted a new particle to carry it. What mass did that imply, in MeV? (Nearest 10 MeV.)`,
              unit: 'MeV',
              answer: 197.3 / 1.4,
              tol: 6,
              wrong: [{ v: 197.3 * 1.4, tol: 6, why: r`Mass and range are inversely related: $mc^2 = \frac{\hbar c}{\text{range}}$.` }],
              explain: r`$\frac{197}{1.4} \approx 140$ MeV. The **pion**, at 140 MeV, was found in cosmic rays in 1947, and Yukawa won the 1949 Nobel Prize. The same reasoning explains the weak force's tiny range: the W boson's 80 GeV mass gives about $2.5 \times 10^{-18}$ m.`,
            },
          ],
          recap: [
            'Four forces: strong, electromagnetic, weak and gravity, in decreasing strength.',
            'Gravity dominates large scales because it always attracts and never cancels.',
            'Forces are carried by exchanged particles: gluons, photons, W and Z.',
          ],
        },
        {
          id: 'antimatter',
          title: 'Antimatter',
          summary: 'Mirror particles',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A mirror electron',
              body: r`In 1928, Paul Dirac's equation for the electron predicted a twin particle with the same mass but the opposite charge. In 1932, Carl Anderson found it in cosmic rays.`,
              prompt: 'What is this particle called?',
              cols: 2,
              choices: [
                { t: 'The positron', ok: true },
                { t: 'The proton', why: 'The proton is positive too, but it’s about 1836 times heavier than an electron. The electron’s antiparticle has exactly the same mass.' },
                { t: 'The neutron', why: 'The neutron has no charge.' },
              ],
              explain: r`The **positron** ($e^+$) is the electron's antimatter twin. Every particle has an antiparticle with opposite charge: antiprotons, antineutrons, antiquarks, and so on.`,
            },
            {
              type: 'numeric',
              title: 'Annihilation',
              body: r`When an electron meets a positron, they **annihilate**: both vanish, turning their mass entirely into energy (two gamma-ray photons). Each has a rest energy of $mc^2 = 0.511$ MeV.`,
              prompt: 'How much energy is released when an electron and a positron (both nearly at rest) annihilate?',
              unit: 'MeV',
              answer: 1.022,
              tol: 0.002,
              wrong: [{ v: 0.511, tol: 0.001, why: 'Both particles are converted into energy: 2 × 0.511.' }],
              explain: r`$2 \times 0.511 = 1.022$ MeV, shared between two gamma photons of 0.511 MeV each, flying off in opposite directions. **PET scans** in hospitals detect exactly these photon pairs to map activity in the body.`,
            },
            {
              type: 'numeric',
              title: 'Making antiprotons',
              prompt: r`Energy can also turn into matter: **pair production**. Antiprotons are made in pairs with ordinary protons. A proton's rest energy is 938.3 MeV. What is the minimum energy needed to create a proton–antiproton pair, in MeV? (1 decimal place.)`,
              unit: 'MeV',
              answer: 2 * 938.3,
              tol: 0.5,
              wrong: [{ v: 938.3, tol: 0.5, why: 'It must create two particles: a proton and an antiproton.' }],
              explain: r`At least $2 \times 938.3 = 1876.6$ MeV, available in the centre-of-mass frame: $E = mc^2$ run backwards. Firing a proton at a stationary target wastes most of the energy on motion, so the Bevatron at Berkeley was built with 6.2 GeV beams, and in 1955 it produced the first antiprotons.`,
            },
            {
              type: 'mcq',
              title: 'Storing antimatter',
              prompt: r`At CERN, scientists make antihydrogen (a positron orbiting an antiproton) and keep it for minutes at a time. How can they store antimatter without it touching anything?`,
              choices: [
                { t: 'They trap it in a vacuum with magnetic fields, which hold the atoms away from the walls', ok: true },
                { t: 'In a special antimatter-proof glass jar', why: 'Any material is made of matter: contact means annihilation.' },
                { t: 'They freeze it solid', why: 'Freezing doesn’t stop annihilation on contact. It must be kept from touching anything.' },
              ],
              explain: r`Charged antiparticles can be held by electric and magnetic fields in an ultra-high vacuum; neutral antihydrogen is held by its tiny magnetic moment in a "magnetic bottle". Experiments in 2023 showed that antihydrogen falls **down** under gravity, just like ordinary matter.`,
            },
            {
              type: 'interactive',
              title: 'A pinch of antimatter',
              body: r`When matter meets antimatter, all of the mass becomes energy: $E = mc^2$. The Hiroshima bomb released about 63 TJ ($6.3 \times 10^{13}$ J). Find the **total** mass (matter plus antimatter) that would release the same.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 2, ymin: 0, ymax: 180, grid: false, height: 260, axes: { xlabel: 'mass annihilated (grams)', ylabel: 'energy (TJ)', xticks: 0.25, yticks: 30 },
                params: { m: { min: 0.01, max: 2, step: 0.01, value: 0.3, label: 'mass', color: 'violet', format: (v) => `${v.toFixed(2)} g` } },
                curves: [{ f: (x) => (x / 1000) * 9e16 / 1e12, color: 'violet', width: 3 }, { f: () => 63, color: 'coral', dash: true }],
                points: [{ x: (p) => p.m, y: (p) => (p.m / 1000) * 9e16 / 1e12, color: 'violet' }],
                readout: (p) => `${p.m.toFixed(2)} g → **${((p.m / 1000) * 9e16 / 1e12).toFixed(1)} TJ** (${((p.m / 1000) * 9e16 / 6.3e13).toFixed(2)} Hiroshimas)`,
                goal: (p) => Math.abs(p.m - 0.7) < 0.006,
                hint: 'm = E / c² = 6.3 × 10¹³ / 9 × 10¹⁶ kg.',
                solution: { m: 0.7 },
              },
              explain: r`$m = \frac{6.3 \times 10^{13}}{9 \times 10^{16}} \approx 7 \times 10^{-4}$ kg: **0.7 grams**, less than a paperclip. The bomb itself converted only about the same 0.7 g of its uranium’s mass into energy. CERN has made only nanograms of antihydrogen in total, so antimatter bombs and engines remain fiction.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Where did it go?',
              prompt: 'The Big Bang should have made equal amounts of matter and antimatter. What does the existence of our universe imply?',
              choices: [
                { t: 'Some tiny imbalance favoured matter, which is one of physics’ great unsolved puzzles', ok: true },
                { t: 'Antimatter is hiding in distant galaxies', why: 'Astronomers see no sign of the annihilation radiation that would mark boundaries between matter and antimatter regions.' },
                { t: 'Nothing: equal amounts are exactly what we see', why: 'Our universe is overwhelmingly made of matter.' },
              ],
              explain: r`If matter and antimatter had been made in perfectly equal amounts, they would have annihilated, leaving only light. Roughly one extra matter particle for every billion pairs survived to make everything we see. Why that happened is still unknown.`,
            },
          ],
          recap: [
            'Every particle has an antiparticle with the same mass and opposite charge.',
            r`Annihilation turns all the mass into energy: $e^+e^- \to$ two 0.511 MeV photons.`,
            'Why the universe is made of matter, not antimatter, is unsolved.',
          ],
        },
      ],
    },
    {
      title: 'Discovering Particles',
      summary: 'Colliders, and how the Higgs was found.',
      lessons: [
        {
          id: 'colliders',
          title: 'Smashing Things Together',
          summary: 'Why colliders collide',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Energy you can use',
              body: r`To create a heavy new particle, you need enough energy in the **centre-of-mass frame**: the frame where the total momentum is zero. Fire a beam of energy $E$ at a stationary proton, and most of the energy goes into moving the debris forward, not into making new particles. The usable energy is only about
$$E_{\text{cm}} \approx \sqrt{2 E\, m_p c^2}$$
Collide two beams head-on, each of energy $E$, and **all** of it is usable: $E_{\text{cm}} = 2E$.`,
            },
            {
              type: 'interactive',
              title: 'Fixed target or collider?',
              body: r`The LHC collides protons of 6.8 TeV each, for 13.6 TeV of usable energy. How energetic would a beam need to be, fired at a **stationary** target, to give the same usable energy? (The slider is logarithmic, in TeV.)`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 6, ymin: 0, ymax: 16, grid: false, height: 280, axes: { xlabel: 'fixed-target beam energy (TeV, log scale)', ylabel: 'usable energy (TeV)', xticks: 1, yticks: 4, xfmt: (v) => `10${'⁰¹²³⁴⁵⁶'[v]}` },
                params: { e: { min: 0, max: 6, step: 0.01, value: 2, label: 'beam energy', color: 'coral', format: (v) => `${sig(10 ** v, 3, true)} TeV` } },
                curves: [{ f: (x) => Math.sqrt(2 * 10 ** x * 0.000938), color: 'violet', width: 3 }, { f: () => 13.6, color: 'teal', dash: true }],
                points: [{ x: (p) => p.e, y: (p) => Math.sqrt(2 * 10 ** p.e * 0.000938), color: 'coral' }],
                readout: (p) => `beam ${sig(10 ** p.e, 3, true)} TeV on a fixed target → usable energy **${Math.sqrt(2 * 10 ** p.e * 0.000938).toFixed(2)} TeV**`,
                goal: (p) => Math.abs(Math.sqrt(2 * 10 ** p.e * 0.000938) - 13.6) < 0.2,
                hint: r`Solve $\sqrt{2E \times 0.000938\ \text{TeV}} = 13.6$ TeV.`,
                solution: { e: 4.99 },
              },
              explain: r`About **100,000 TeV**, over 14,000 times the LHC's beam energy. Because usable energy grows only as the square root of beam energy for a fixed target, every modern energy-frontier machine collides beams head-on.`,
            },
            {
              type: 'numeric',
              title: 'Bending the beam',
              prompt: r`A magnetic field $B$ bends a particle of momentum $p$ into a circle of radius $r = \frac{p}{eB}$. For a 6.8 TeV proton, $p/e \approx 2.27 \times 10^{4}$ T·m. With the LHC's 8.3 T magnets, what is the bending radius, in km? (2 decimal places.)`,
              unit: 'km',
              answer: 2.27e4 / 8.3 / 1000,
              tol: 0.03,
              wrong: [{ v: 2.27e4 / 8.3, tol: 20, why: 'That’s in metres. Convert to km.' }],
              hint: r`$r = \frac{2.27 \times 10^4}{8.3}$ m.`,
              explain: r`$r \approx 2.7$ km. The LHC's 27 km ring isn't all magnets: it also has straight sections for experiments and acceleration, which is why the ring's radius (4.3 km) is bigger than the bending radius.`,
            },
            {
              type: 'mcq',
              title: 'Why protons, not electrons?',
              prompt: r`Particles moving in a circle radiate energy (**synchrotron radiation**), and at the same energy the loss grows like $(1/m)^4$. Why does the LHC use protons rather than electrons?`,
              choices: [
                { t: 'A proton is 1836 times heavier, so it radiates about 10¹³ times less energy at the same beam energy', ok: true },
                { t: 'Protons are easier to find', why: 'Both are easy to obtain. The issue is energy loss in a ring.' },
                { t: 'Electrons can’t be accelerated', why: 'Electrons are accelerated easily, but at high energies in a ring they radiate away almost all of it.' },
              ],
              explain: r`$1836^4 \approx 1.1 \times 10^{13}$. The LEP collider, which used the same tunnel for electrons before the LHC, maxed out at about 0.1 TeV per beam because of this loss. Future electron colliders are likely to be linear, or much bigger rings.`,
            },
            {
              type: 'numeric',
              title: 'Laps per second',
              prompt: r`The LHC ring is 26.66 km around, and its protons travel at 99.999999% of the speed of light ($3.00 \times 10^8$ m/s). How many laps does each proton complete per second? (Nearest 10.)`,
              unit: 'laps/s',
              answer: 3e8 / 26660,
              tol: 15,
              wrong: [{ v: 11.25, tol: 0.1, why: 'Convert the ring to metres: 26.66 km is 26,660 m.' }],
              explain: r`$\frac{3.00 \times 10^8}{26{,}660} \approx 11{,}250$ laps every second. A beam can circulate for ten hours or more, covering over ten billion kilometres, further than the distance to Neptune and back.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Messy collisions',
              prompt: r`Electron–positron collisions are "clean", while proton–proton collisions are messy. Why?`,
              choices: [
                { t: 'Protons are bags of quarks and gluons; each collision is really between two of those constituents, carrying unknown shares of the energy', ok: true },
                { t: 'Protons are bigger, so they hit more often', why: 'Size isn’t the main issue. It’s that protons have internal structure.' },
                { t: 'Protons have more charge', why: 'They have the same magnitude of charge as electrons.' },
              ],
              explain: r`Electrons are fundamental, so an electron–positron collision uses all the beam energy in a known way. In a proton collision, only one quark or gluon from each proton usually takes part, carrying a random fraction of the energy, while the rest of the protons spray debris everywhere. Protons give higher energies; electrons give precision.`,
            },
          ],
          recap: [
            r`Colliders beat fixed targets: $E_{\text{cm}} = 2E$ versus about $\sqrt{2Emc^2}$.`,
            r`Magnets bend beams in circles of radius $p/eB$.`,
            'Protons radiate far less than electrons in rings; electrons give cleaner collisions.',
          ],
        },
        {
          id: 'higgs',
          title: 'Finding the Higgs',
          summary: 'Bumps, backgrounds and five sigma',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Reconstructing a particle',
              body: r`The Higgs boson decays almost instantly, so it's never seen directly. Instead, physicists look at its decay products. In one rare channel it decays into **two photons**. From their energies $E_1, E_2$ and the angle $\theta$ between them, they compute the **invariant mass**
$$m c^2 = \sqrt{2E_1E_2\,(1 - \cos\theta)}$$
which equals the mass of whatever produced them. Photon pairs from a Higgs all give the same value; pairs from other processes give a smooth spread.`,
            },
            {
              type: 'numeric',
              title: 'Back to back',
              prompt: r`Two photons of 62.5 GeV each fly off in exactly opposite directions ($\theta = 180°$). What invariant mass do they give?`,
              unit: 'GeV',
              answer: 125,
              tol: 0.5,
              wrong: [{ v: 62.5, why: r`With $\cos\theta = -1$: $\sqrt{2 \times 62.5 \times 62.5 \times 2}$.` }, { v: 88.4, tol: 0.5, why: r`$1 - \cos 180° = 2$, not 1.` }],
              explain: r`$\sqrt{2 \times 62.5^2 \times 2} = 2 \times 62.5 = 125$ GeV: exactly what a Higgs at rest would give. In real collisions the Higgs is moving, so the photons aren't back to back, but the invariant mass always comes out the same.`,
            },
            {
              type: 'interactive',
              title: 'Hunting for a bump',
              body: r`Here's a simulated histogram of two-photon invariant masses. Most pairs come from ordinary processes (a falling background); a Higgs adds a small bump at 125 GeV. Collect more data until the bump reaches **5 standard deviations** (5σ), the discovery threshold.`,
              widget: {
                kind: 'graph', xmin: 100, xmax: 160, ymin: 0, ymax: 1.25, grid: false, height: 300, axes: { xlabel: 'two-photon mass (GeV)', ylabel: 'events (scaled)', xticks: 10, yticks: 2 },
                params: { L: { min: 1, max: 40, step: 1, value: 4, label: 'amount of data', color: 'violet', format: (v) => `${v} units` } },
                extra: ({ plot, p, s }) => { const els = [], peak = (higgsBg(100) + 0) * p.L * 1.15; for (let m = 100; m < 160; m++) { const mu = (higgsBg(m + 0.5) + higgsSig(m + 0.5)) * p.L, n = Math.max(0, mu + Math.sqrt(mu) * noise(m, p.L)); els.push(s('rect', { x: plot.X(m) + 1, y: plot.Y(n / peak), width: plot.X(1) - plot.X(0) - 2, height: plot.Y(0) - plot.Y(n / peak), class: m >= 121 && m <= 128 ? 'fl-coral' : 'fl-blue', opacity: 0.85 })); } let d = ''; for (let m = 100; m <= 160; m += 0.5) d += `${m === 100 ? 'M' : 'L'}${plot.X(m).toFixed(1)} ${plot.Y((higgsBg(m) * p.L) / peak).toFixed(1)}`; els.push(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 4' })); return els; },
                readout: (p) => `signal significance in the 121–129 GeV window: **${higgsZ(p.L).toFixed(1)}σ**${higgsZ(p.L) >= 5 ? ' · discovery!' : ''}`,
                goal: (p) => higgsZ(p.L) >= 5,
                hint: 'Significance grows like the square root of the amount of data.',
                solution: { L: 26 },
              },
              explain: r`The bump stands out once the significance reaches 5σ: with 4 times the data, the signal grows 4 times but the background's random wobble only doubles, so the significance doubles. On 4 July 2012, the ATLAS and CMS experiments announced exactly this: a new boson near 125 GeV. Peter Higgs and François Englert, who predicted it in 1964, won the 2013 Nobel Prize.`,
            },
            {
              type: 'mcq',
              title: 'Why five sigma?',
              prompt: r`A 5σ result means that, if there were really no new particle, a background fluctuation this large would happen by chance only about once in 3.5 million tries. Why do particle physicists demand such a high bar?`,
              choices: [
                { t: 'They search many mass ranges and channels, so modest flukes are expected somewhere; and past 3σ “discoveries” have vanished with more data', ok: true },
                { t: 'Because 5 is the standard in all of science', why: 'Most fields use far lower thresholds, like p < 0.05 (about 2σ).' },
                { t: 'To make experiments run longer', why: 'The threshold protects against false discoveries.' },
              ],
              explain: r`Looking across a wide mass range is like testing many hypotheses at once (the "look-elsewhere effect" from the multiple-comparisons problem). Several 3σ bumps, like a famous 750 GeV two-photon excess in 2015, faded away with more data. Five sigma keeps false alarms rare.`,
            },
            {
              type: 'numeric',
              title: 'Not back to back',
              prompt: r`A moving Higgs decays into photons of 100 GeV and 50 GeV, with an angle between them where $\cos\theta = -0.5625$. Using $mc^2 = \sqrt{2E_1E_2(1 - \cos\theta)}$, what is the invariant mass, in GeV?`,
              unit: 'GeV',
              answer: Math.sqrt(2 * 100 * 50 * 1.5625),
              tol: 0.5,
              wrong: [{ v: 150, tol: 0.5, why: r`Simply adding the energies ignores the angle between the photons. Use the formula: $\sqrt{2 \times 100 \times 50 \times 1.5625}$.` }],
              explain: r`$\sqrt{10{,}000 \times 1.5625} = \sqrt{15{,}625} = 125$ GeV. The photons have unequal energies and aren't back to back, because the Higgs was moving, yet the invariant mass comes out the same. That's what lets physicists pile up decays from Higgs bosons moving every which way into one sharp bump.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Doubling the significance',
              prompt: r`An analysis sees a 2.5σ bump. Significance grows as $\sqrt{\text{data}}$. How many times more data are needed to reach 5σ?`,
              unit: '×',
              answer: 4,
              wrong: [{ v: 2, why: r`Doubling the significance needs $2^2$ times the data.` }],
              explain: r`$\left(\frac{5}{2.5}\right)^2 = 4$ times the data. That's why discoveries often take years after the first hints: each step in certainty costs quadratically more collisions.`,
            },
          ],
          recap: [
            'The invariant mass of decay products reveals the parent particle’s mass.',
            'Signals appear as bumps on a smooth background; significance grows as √(data).',
            'Particle physics requires 5σ before claiming a discovery.',
          ],
        },
        {
          id: 'tracks',
          title: 'Reading Particle Tracks',
          summary: 'Momentum from curvature',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Bent by a magnet',
              body: r`Particle detectors sit inside powerful magnets. A charged particle crossing a magnetic field $B$ curves in a circle, and the faster (more momentum) it is, the straighter its path. For a particle with one unit of charge,
$$p = 0.3\,B\,r,$$
with momentum $p$ in GeV/$c$, field $B$ in tesla and radius $r$ in metres. Positive and negative particles curve in **opposite** directions, so the track also reveals the sign of the charge.`,
            },
            {
              type: 'numeric',
              title: 'A gentle curve',
              prompt: r`In a 2 T field, a track curves with radius 1 m. What is the particle’s momentum, in GeV/$c$?`,
              unit: 'GeV/c',
              answer: 0.6,
              tol: 0.001,
              explain: r`$p = 0.3 \times 2 \times 1 = 0.6$ GeV/$c$.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Inside the detector',
              prompt: r`The CMS detector at CERN has a 4 T field. Tracks start at the collision point (centre). Find the momentum of a particle whose track curves with radius **2 m**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.4, xmax: 1.4, ymin: -1.4, ymax: 1.4, grid: false, axes: false, maxWidth: 360, pad: 6,
                params: { p: { min: 0.2, max: 20, step: 0.1, value: 1, label: 'momentum', color: 'coral', format: (v) => `${v.toFixed(1)} GeV/c` } },
                extra: ({ plot, p, s }) => { const out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(1.2) - plot.X(0), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 2 })]; for (const rr of [0.3, 0.6, 0.9]) out.push(s('circle', { cx: plot.X(0), cy: plot.Y(0), r: plot.X(rr) - plot.X(0), fill: 'none', stroke: 'var(--line)', 'stroke-dasharray': '3 5' })); const arc = (pp, ang, sgn, col, w) => { const R = pp / (0.3 * 4), pts = []; for (let i = 0; i <= 200; i++) { const t = (i / 200) * Math.min(Math.PI, 2.4 / R); const x = R * Math.sin(t), y = sgn * R * (1 - Math.cos(t)); const X = x * Math.cos(ang) - y * Math.sin(ang), Y = x * Math.sin(ang) + y * Math.cos(ang); if (Math.hypot(X, Y) > 1.2) break; pts.push([X, Y]); } return s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: col, 'stroke-width': w }); }; [[0.5, 1.2, 1], [1.5, 2.6, -1], [8, 4.0, 1], [0.8, 5.2, -1]].forEach(([pp, a, sg]) => out.push(arc(pp, a, sg, 'var(--ink-3)', 1.3))); out.push(arc(p.p, 0.3, 1, 'var(--coral)', 3)); return out; },
                readout: (p) => `radius of curvature **${(p.p / (0.3 * 4)).toFixed(2)} m** (the tracker reaches 1.2 m from the centre)`,
                goal: (p) => Math.abs(p.p - 2.4) < 0.05,
                hint: 'p = 0.3 × 4 × 2.',
                solution: { p: 2.4 },
              },
              explain: r`$p = 0.3 \times 4 \times 2 = 2.4$ GeV/$c$. A 100 GeV muon would curve with a radius of 83 m, barely bending inside the detector, so physicists measure tiny deviations from a straight line with silicon sensors precise to about 10 µm.`,
            },
            {
              type: 'mcq',
              title: 'Opposite curls',
              prompt: r`Two tracks come out of the same point with the same curvature, but one curls clockwise and the other anticlockwise. What can you conclude?`,
              choices: [
                { t: 'They have the same momentum and opposite charges, for example an electron and a positron', ok: true },
                { t: 'They have different masses', why: 'Curvature depends on momentum and charge, not directly on mass.' },
                { t: 'One is moving backwards in time', why: 'A fun idea from Feynman diagrams, but the plain reading is opposite charges.' },
              ],
              explain: r`The magnetic force $q\,\mathbf v \times \mathbf B$ flips direction with the sign of $q$. Carl Anderson discovered the positron in 1932 from exactly such a track: an "electron" curving the wrong way.`,
            },
            {
              type: 'numeric',
              title: 'How bent is a fast track?',
              prompt: r`A track of radius 8.33 m crosses 1 m of detector. The **sagitta** (how far the middle of the arc bulges from a straight line) is about $\frac{L^2}{8r}$. How many centimetres is that? (1 decimal place.)`,
              unit: 'cm',
              answer: (1 / (8 * 8.33)) * 100,
              tol: 0.05,
              explain: r`$\frac{1^2}{8 \times 8.33} \approx 0.015$ m $= 1.5$ cm. Higher momentum means a smaller sagitta, so the precision of momentum measurements falls as momentum rises.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why such strong magnets?',
              prompt: r`CMS uses a 4 T superconducting magnet (about 100,000 times Earth’s field) and a large tracker. Why?`,
              choices: [
                { t: 'At very high momenta tracks are nearly straight; a strong field and long lever arm make the tiny curvature measurable', ok: true },
                { t: 'To speed the particles up', why: 'Magnetic fields bend particles but don’t change their speed.' },
                { t: 'To stop the particles', why: 'Calorimeters stop particles; the magnet bends their paths for measuring momentum.' },
              ],
              explain: r`The sagitta scales as $\frac{BL^2}{p}$: doubling the field doubles it, and doubling the tracker size quadruples it. That’s why detectors like CMS (Compact Muon Solenoid) and ATLAS are built around huge magnets.`,
            },
          ],
          recap: [
            r`A charged track curves with $p = 0.3\,B\,r$ (GeV/$c$, tesla, metres).`,
            'The direction of curl gives the sign of the charge.',
            'Fast particles bend little; strong fields and big trackers measure them.',
          ],
        },
      ],
    },
  ],
};
