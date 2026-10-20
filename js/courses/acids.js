import { fix, sig } from '../lib/svg.js';
import { r, FS, arrows, pick } from './_chem.js';

const KW = 1e-14;
const PKA_ACETIC = 4.76;
// pH of a mixture: weak acid (total Ca, pKa) plus strong base Cb (Na+) plus strong acid Cs, from the charge balance
function phOf({ Ca = 0, pKa = 4.76, Cb = 0, Cs = 0 }) {
  const Ka = 10 ** -pKa;
  let lo = 0, hi = 14;
  for (let i = 0; i < 80; i++) {
    const ph = (lo + hi) / 2, H = 10 ** -ph;
    const f = H + Cb - (Ca * Ka) / (Ka + H) - KW / H - Cs; // positive → too acidic a guess, raise pH
    if (f > 0) lo = ph; else hi = ph;
  }
  return (lo + hi) / 2;
}
// 25 mL of 0.10 M acid titrated with 0.10 M NaOH
const titr = (V, pKa = PKA_ACETIC) => { const Vt = (25 + V) / 1000; return phOf({ Ca: (0.1 * 0.025) / Vt, pKa, Cb: (0.1 * V) / 1000 / Vt }); };

// ---------- indicator colours ----------
const mixc = (a, b, f) => `color-mix(in srgb, ${b} ${fix(Math.max(0, Math.min(1, f)) * 100, 0)}%, ${a})`;
const INDICATORS = [
  ['methyl orange', 3.7, '#d7301f', '#f2c12e'],
  ['bromothymol blue', 7.1, '#e3c62a', '#2f5bd3'],
  ['phenolphthalein', 9.3, 'rgba(255,255,255,0.0)', '#d6338a'],
];
const indColour = ([, pk, a, b], ph) => mixc(a, b, 1 / (1 + 10 ** (pk - ph)));
// red cabbage: a rough colour scale through the pH range
const CABBAGE = [[1, '#c0143c'], [3, '#d6338a'], [5, '#8e3fa8'], [7, '#5b4fc4'], [8, '#2f6fd3'], [10, '#2aa36b'], [12, '#c9c62a'], [14, '#e8d23a']];
function cabbage(ph) {
  for (let i = 1; i < CABBAGE.length; i++) if (ph <= CABBAGE[i][0]) { const [x0, c0] = CABBAGE[i - 1], [x1, c1] = CABBAGE[i]; return mixc(c0, c1, (ph - x0) / (x1 - x0)); }
  return CABBAGE[CABBAGE.length - 1][1];
}
const tube = (plot, s, x, colour, label) => {
  const x0 = plot.X(x - 0.55), x1 = plot.X(x + 0.55), top = plot.Y(4.6), bot = plot.Y(0.9), mid = plot.Y(3.4);
  return [
    s('path', { d: `M${x0} ${mid}V${bot - 20}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 20}V${mid}Z`, style: `fill:${colour}` }),
    s('path', { d: `M${x0} ${top}V${bot - 20}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 20}V${top}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
    label ? s('text', { x: (x0 + x1) / 2, y: plot.Y(0.25), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: label }) : null,
  ];
};

// ---------- glycine's charge ----------
const glyCharge = (ph) => 1 / (1 + 10 ** (ph - 2.34)) - 1 / (1 + 10 ** (9.6 - ph));
// ---------- carbonate in seawater (pKa1 5.9, pKa2 9.0) ----------
function carb(ph) {
  const h = 10 ** -ph, k1 = 10 ** -5.9, k2 = 10 ** -9.0, d = h * h + k1 * h + k1 * k2;
  return [(h * h) / d, (k1 * h) / d, (k1 * k2) / d];
}

// a curly-arrow proton transfer: water takes the proton from HCl
const PT = {
  atoms: [['O', 160, 130, { lp: 2 }], ['H', 110, 190], ['H', 210, 190], ['H', 330, 130], ['Cl', 420, 130, { lp: 3 }]],
  bonds: [[0, 1, 1], [0, 2, 1], [3, 4, 1]],
  answer: [['lp:0', 'a:3'], ['b:3-4', 'a:4']],
  product: { atoms: [['O', 180, 130, { q: 1, lp: 1 }], ['H', 130, 190], ['H', 230, 190], ['H', 270, 85], ['Cl', 440, 130, { q: -1, lp: 4 }]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
};

// ---------- the proton relay: an extra proton's charge hops along a chain of hydrogen-bonded water ----------
const RELAY_SM = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const RELAY_O = [0, 1, 2, 3, 4].map((k) => [1.15 + 1.92 * k, k % 2 ? 3.65 : 2.75]);
const relayHop = (k, t) => RELAY_SM((t - (1.2 + 1.1 * k)) / 0.55);

// ---------- the same acid dropped into water and into an acetate buffer (1 L each, 8 mmol HA + 8 mmol A−) ----------
const BUF_SM = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const BUF_DROPS = [1, 2.6, 4.2, 5.8]; // each drop is 1 mmol of strong acid
const BUF_SPOTS = (() => {
  const spots = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) spots.push([5.9 + i * 1.0 + (j % 2) * 0.4, 0.9 + j * 0.85, (i + j) % 2 === 1]);
  return spots; // [x, y, starts as A−]
})();
// which A− each drop lands on
const BUF_TARGET = BUF_SPOTS.map((q, k) => k).filter((k) => BUF_SPOTS[k][2]).slice(0, 4);
const bufAdded = (t) => BUF_DROPS.filter((d) => t >= d + 0.9).length;

// ---------- 25 mL of 0.10 M acetic acid titrated with 0.10 M NaOH, solved exactly by charge balance ----------
const titPH = (vb) => {
  const Ka = 10 ** -4.76, Kw = 1e-14, V = 25 + vb, ct = (0.1 * 25) / V, na = (0.1 * vb) / V;
  let lo = 0, hi = 14;
  for (let k = 0; k < 60; k++) {
    const pH = (lo + hi) / 2, h = 10 ** -pH;
    const excess = na + h - (ct * Ka) / (Ka + h) - Kw / h; // positive: too many + charges, so the true pH is higher
    if (excess > 0) lo = pH; else hi = pH;
  }
  return (lo + hi) / 2;
};
const titV = (t) => Math.min(40, Math.max(0, (t - 0.5) * 3.2));

export default {
  id: 'acids',
  subject: 'physics',
  title: 'Acids, Bases & Buffers',
  level: 'Intermediate',
  cover: 'acids',
  tagline: 'Proton swaps, weak acids, buffers that hold pH steady, indicators and an acidifying ocean.',
  description: r`An acid is a proton donor and a base a proton acceptor: draw the swap with curly arrows and find the conjugate pairs. Then go beyond strong acids: work out the pH of vinegar, build a buffer that holds blood at pH 7.4, fight off a stream of acid with buffer capacity, find a pKa from a titration curve, choose the right indicator, follow an amino acid's charge as the pH changes, and see what extra carbon dioxide is doing to the sea.`,
  prereq: 'Chemical Reactions, and Chemical Equilibrium',
  chapters: [
    {
      title: 'Proton Swaps',
      summary: 'What makes an acid an acid.',
      lessons: [
        {
          id: 'bronsted',
          title: 'Proton Swaps',
          summary: 'Donors and acceptors',
          icon: 'link',
          steps: [
            {
              type: 'explain',
              title: 'Passing a proton',
              body: r`A hydrogen atom stripped of its electron is a bare **proton**, $\mathrm{H^+}$. Brønsted and Lowry (1923) defined acids and bases by what they do with it:
- an **acid** donates a proton,
- a **base** accepts one, using a lone pair.

When hydrogen chloride meets water, water's oxygen uses a lone pair to grab the proton, and the H–Cl bond's electrons stay behind on chlorine. Chemists draw this with **curly arrows**, each showing a pair of electrons moving from where it is to where it goes.`,
            },
            {
              type: 'interactive',
              title: 'Draw the swap',
              prompt: r`Draw two curly arrows: tap a lone pair (or a bond) where electrons start, then the atom they move to. First, the oxygen's lone pair attacks the proton; second, the H–Cl bond's electrons go to chlorine.`,
              widget: arrows({ ...PT, h: 250, hints: { 'lp:4>a:3': 'Chlorine keeps its electrons; it’s water’s oxygen that grabs the proton.', 'b:3-4>a:3': 'The H–Cl bond’s electrons leave with chlorine, not with the proton.' } }),
              explain: r`$\mathrm{H_2O + HCl \to H_3O^+ + Cl^-}$. Oxygen gains a third bond and becomes positive (the **hydronium** ion); chlorine leaves with the bonding pair as chloride. A "free $\mathrm{H^+}$" never really floats around in water: it's always attached to a water molecule.`,
            },
            { /*chemanim:acids.bronsted*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A relay race for protons',
              body: r`In water, every molecule is hydrogen-bonded to its neighbours. Start with one hydronium ion at the left end of a chain. Watch the hydrogens between the oxygens: each one only shifts a short way along its hydrogen bond.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0.8, ymax: 5.4, grid: false, axes: false, height: 250,
                animate: { param: 't', speed: 0.8, max: 7.5, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t;
                  const atoms = [], bonds = [];
                  const addH = (x, y, ox, oy, solid) => { bonds.push([ox, oy, x, y, solid]); atoms.push([x, y, 'H']); };
                  RELAY_O.forEach(([ox, oy], k) => {
                    const up = k % 2 ? 1 : -1;
                    if (k === 0) { addH(ox - 0.45, oy + 0.48, ox, oy, true); addH(ox - 0.45, oy - 0.48, ox, oy, true); }
                    else if (k === 4) { addH(ox + 0.45, oy + 0.48, ox, oy, true); addH(ox + 0.45, oy - 0.48, ox, oy, true); }
                    else addH(ox, oy + up * 0.66, ox, oy, true);
                    if (k < 4) {
                      // the hydrogen between O(k) and O(k+1) slides across during hop k
                      const [nx, ny] = RELAY_O[k + 1], f = 0.35 + 0.3 * relayHop(k, t);
                      const hx = ox + (nx - ox) * f, hy = oy + (ny - oy) * f;
                      bonds.push([ox, oy, hx, hy, f < 0.5]);
                      bonds.push([nx, ny, hx, hy, f >= 0.5]);
                      atoms.push([hx, hy, 'H']);
                    }
                  });
                  for (const [x1, y1, x2, y2, solid] of bonds) out.push(s('line', { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), stroke: 'var(--ink)', 'stroke-opacity': solid ? 0.7 : 0.45, 'stroke-width': solid ? 4 : 2, 'stroke-dasharray': solid ? null : '3 4' }));
                  for (const [x, y] of atoms) {
                    out.push(s('circle', { cx: X(x), cy: Y(y), r: 10, fill: 'var(--card)', stroke: 'var(--ink-3)', 'stroke-width': 1.8 }));
                    out.push(s('text', { x: X(x), y: Y(y) + 4.5, 'text-anchor': 'middle', class: 'lbl', style: FS(11), text: 'H' }));
                  }
                  // which oxygen carries three hydrogens (and the + charge) right now
                  let at = 0;
                  for (let k = 0; k < 4; k++) if (relayHop(k, t) >= 0.5) at = k + 1;
                  RELAY_O.forEach(([ox, oy], k) => {
                    out.push(s('circle', { cx: X(ox), cy: Y(oy), r: 16, fill: k === at ? 'var(--coral)' : 'var(--coral-soft)', stroke: 'var(--coral)', 'stroke-width': 2 }));
                    out.push(s('text', { x: X(ox), y: Y(oy) + 5, 'text-anchor': 'middle', class: 'lbl', style: `fill:${k === at ? '#fff' : 'var(--ink)'};${FS(14)}`, text: 'O' }));
                  });
                  const [cx, cy] = RELAY_O[at];
                  out.push(s('text', { x: X(cx), y: Y(cy + (at % 2 ? -0.95 : 0.95)) + 5, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--coral);${FS(14)}`, text: 'H₃O⁺' }));
                  return out;
                },
                readout: (p) => (p.t < 1.2 ? 'The left molecule is H₃O⁺: three hydrogens and the + charge.' : p.t < 5.8 ? 'Each hydrogen hops one short step; the + charge races along the chain.' : 'Now the right-hand molecule is H₃O⁺. No atom travelled far.'),
              },
              after: r`The positive charge crossed the whole chain, yet every hydrogen moved only about a tenth of a nanometre, from one oxygen to the next. This hand-off (the **Grotthuss mechanism**, proposed in 1806) is why hydrochloric acid conducts electricity more than three times better than salt water of the same concentration: $\mathrm{H^+}$ doesn't have to push through the water, it is passed along it.`,
            },
            {
              type: 'explain',
              title: 'Conjugate pairs',
              body: r`Every acid–base reaction has two pairs that differ by one proton. HCl loses a proton to become $\mathrm{Cl^-}$, its **conjugate base**; $\mathrm{H_2O}$ gains one to become $\mathrm{H_3O^+}$, its **conjugate acid**:
$$\underbrace{\mathrm{HCl}}_{\text{acid}} + \underbrace{\mathrm{H_2O}}_{\text{base}} \to \underbrace{\mathrm{H_3O^+}}_{\text{conj. acid}} + \underbrace{\mathrm{Cl^-}}_{\text{conj. base}}$$
The stronger an acid, the weaker its conjugate base: chloride has almost no urge to take a proton back.`,
            },
            {
              type: 'mcq',
              title: 'Ammonia as a base',
              prompt: r`In $\mathrm{NH_3 + H_2O \rightleftharpoons NH_4^+ + OH^-}$, what is the conjugate acid of ammonia?`,
              choices: [
                { t: r`$\mathrm{NH_4^+}$`, ok: true },
                { t: r`$\mathrm{OH^-}$`, why: 'Hydroxide is water’s conjugate base (water lost a proton).' },
                { t: r`$\mathrm{H_2O}$`, why: 'Water is the acid here: it gives the proton to ammonia.' },
              ],
              explain: r`Ammonia accepts a proton with its lone pair and becomes ammonium. Here water acts as the **acid**, while with HCl it acted as a base.`,
            },
            {
              type: 'mcq',
              title: 'Both at once',
              prompt: 'Water can be an acid or a base depending on its partner. What does that imply for pure water?',
              choices: [
                { t: 'A few water molecules pass protons to each other: H₂O + H₂O ⇌ H₃O⁺ + OH⁻', ok: true },
                { t: 'Pure water contains no ions at all', why: 'Pure water conducts electricity very slightly, because of those few ions.' },
                { t: 'Water is always neutral, so it can’t react with itself', why: 'Neutral means equal amounts of H₃O⁺ and OH⁻, not none.' },
              ],
              explain: r`Water's **autoionisation**: $K_w = [\mathrm{H_3O^+}][\mathrm{OH^-}] = 1.0 \times 10^{-14}$ at 25 °C. In pure water both are $10^{-7}$ M, which is why neutral is pH 7.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Find the acidic proton',
              prompt: r`In acetic acid, tap the hydrogen that is given away when it acts as an acid.`,
              widget: pick({ smiles: 'CC(=O)O', explicitH: true, pick: 'H', h: 250, bond: 78, answer: [7], extraMsg: 'Hydrogens on carbon are very hard to remove.', missMsg: 'Look for the hydrogen on oxygen.' }),
              explain: r`The H on oxygen. Its conjugate base, acetate, spreads the negative charge over both oxygens by resonance (see Chemical Bonding), which makes giving up that proton much easier. The carbon-bound hydrogens stay put.`,
            },
          ],
          recap: [
            'Acid: proton donor. Base: proton acceptor (uses a lone pair).',
            'Conjugate pairs differ by one H⁺; strong acid ↔ weak conjugate base.',
            'Water is both: Kw = [H₃O⁺][OH⁻] = 10⁻¹⁴.',
          ],
        },
        {
          id: 'strength',
          title: 'Strong & Weak',
          summary: 'How completely acids ionise',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'All or a little',
              body: r`A **strong acid** (HCl, $\mathrm{HNO_3}$, and the first proton of $\mathrm{H_2SO_4}$) gives up essentially every proton to water. A **weak acid** like acetic acid only does so partly: an equilibrium
$$\mathrm{HA + H_2O \rightleftharpoons H_3O^+ + A^-} \qquad K_a = \frac{[\mathrm{H_3O^+}][\mathrm{A^-}]}{[\mathrm{HA}]}$$
Chemists usually quote $\mathrm{p}K_a = -\log_{10} K_a$: the **smaller** the $\mathrm pK_a$, the **stronger** the acid. Slide it and watch a 0.10 M solution:`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 3, ymin: 0, ymax: 0.1, grid: false, height: 280, padB: 50, padL: 58,
                axes: { xticks: 0, yticks: 0.025, ylabel: 'concentration (M)', yAt: 0 },
                params: { pk: { min: -2, max: 10, step: 0.5, value: 4.5, label: 'pKa', format: (v) => fix(v, 1) } },
                under: ({ plot, p, s }) => {
                  const H = 10 ** -phOf({ Ca: 0.1, pKa: p.pk }), A = (0.1 * 10 ** -p.pk) / (10 ** -p.pk + H), HA = 0.1 - A;
                  return [[HA, 'blue'], [A, 'coral'], [H, 'violet']].map(([v, c], j) => s('rect', { x: plot.X(j + 0.25), y: plot.Y(v), width: plot.X(0.5) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 5, class: `fl-${c}` }));
                },
                extra: ({ plot, s }) => ['HA', 'A⁻', 'H₃O⁺'].map((t, j) => s('text', { x: plot.X(j + 0.5), y: plot.bottom + 22, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: t })),
                readout: (p) => { const ph = phOf({ Ca: 0.1, pKa: p.pk }); const A = 10 ** -p.pk / (10 ** -p.pk + 10 ** -ph); return `${fix(A * 100, 1)}% ionised · pH ${fix(ph, 2)}`; },
              },
            },
            {
              type: 'mcq',
              title: 'Which is stronger?',
              prompt: 'Formic acid (in ant stings) has pKa 3.75; acetic acid (vinegar) has pKa 4.76. Which is the stronger acid?',
              choices: [
                { t: 'Formic acid', ok: true },
                { t: 'Acetic acid', why: 'A larger pKa means a smaller Ka: a weaker acid.' },
                { t: 'They’re equally strong', why: 'One pKa unit is a factor of 10 in Ka.' },
              ],
              explain: r`Lower $\mathrm pK_a$ = stronger. A difference of about 1 unit means formic acid's $K_a$ is about ten times larger.`,
            },
            {
              type: 'numeric',
              title: 'From pKa to Ka',
              prompt: r`Acetic acid's $\mathrm pK_a$ is 4.76. What is its $K_a$? (Write it like 1.2e-5.)`,
              answer: 1.74e-5,
              relTol: 0.02,
              explain: r`$K_a = 10^{-4.76} = 1.74 \times 10^{-5}$.`,
            },
            {
              type: 'mcq',
              title: 'Strong is not concentrated',
              prompt: 'Which statement is right?',
              choices: [
                { t: 'A dilute solution of a strong acid can be less acidic than a concentrated weak acid', ok: true },
                { t: 'Strong acids are always more acidic than weak acids', why: 'Strength is about the fraction ionised; concentration is how much acid there is.' },
                { t: '“Strong” and “concentrated” mean the same', why: 'Strong = fully ionised. Concentrated = lots of acid per litre.' },
              ],
              explain: r`$10^{-5}$ M HCl has pH 5; 1 M acetic acid has pH about 2.4. "Strong" describes how completely the acid ionises, not how much of it there is.`,
            },
            {
              type: 'order',
              kicker: 'Challenge',
              title: 'Rank the acids',
              prompt: 'Order these acids from strongest to weakest.',
              items: ['Hydrochloric acid (pKa ≈ −6)', 'Phosphoric acid (pKa 2.1)', 'Acetic acid (pKa 4.76)', 'Carbonic acid (pKa 6.35)', 'Ammonium ion (pKa 9.25)'],
              explain: r`Smallest $\mathrm pK_a$ first. The ammonium ion is a (very weak) acid too: it's the conjugate acid of ammonia.`,
            },
          ],
          recap: [
            'Strong acids ionise completely; weak acids set up an equilibrium with Ka.',
            'pKa = −log Ka: smaller pKa, stronger acid.',
            'Strength ≠ concentration.',
          ],
        },
        {
          id: 'weak-ph',
          title: 'The pH of Vinegar',
          summary: 'Calculating weak-acid pH',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'A small x',
              body: r`For a weak acid at concentration $C$, let $x$ ionise: $[\mathrm{H_3O^+}] = [\mathrm{A^-}] = x$ and $[\mathrm{HA}] = C - x$. Then
$$K_a = \frac{x^2}{C - x} \approx \frac{x^2}{C} \quad\Rightarrow\quad x \approx \sqrt{K_a C}$$
The approximation works when only a few percent ionises, which is true for most weak acids.`,
            },
            {
              type: 'numeric',
              title: 'Vinegar',
              prompt: r`Vinegar is about 0.85 M acetic acid ($K_a = 1.74 \times 10^{-5}$). Estimate its pH (two decimal places).`,
              answer: 2.42,
              tol: 0.03,
              wrong: [{ v: 0.07, why: r`That’s the pH if it were a strong acid at 0.85 M. Use $x = \sqrt{K_a C}$.` }],
              explain: r`$x = \sqrt{1.74 \times 10^{-5} \times 0.85} = 3.85 \times 10^{-3}$ M, so pH $= -\log(3.85 \times 10^{-3}) \approx 2.42$. Only 0.45% of the acid is ionised.`,
            },
            {
              type: 'explain',
              title: 'Strong versus weak on one chart',
              body: r`Here is pH against concentration for a strong acid (HCl) and a weak one (acetic acid). Diluting tenfold raises a strong acid's pH by a whole unit, but a weak acid's by only about half a unit, because dilution coaxes more of it to ionise.`,
              widget: {
                kind: 'graph', xmin: -4, xmax: 0, ymin: 0, ymax: 5, height: 300, grid: false,
                axes: { xticks: 1, yticks: 1, xlabel: 'concentration (M)', ylabel: 'pH', yAt: 0, xAt: -4, xfmt: (v) => sig(10 ** v, 1) },
                curves: [{ f: (x) => phOf({ Cs: 10 ** x }), color: 'coral' }, { f: (x) => phOf({ Ca: 10 ** x, pKa: PKA_ACETIC }), color: 'blue' }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(-1.2), y: plot.Y(0.6), class: 'lbl halo-text', style: `fill:var(--coral);${FS(14)}`, text: 'HCl (strong)' }), s('text', { x: plot.X(-3.6), y: plot.Y(4.4), class: 'lbl halo-text', style: `fill:var(--blue);${FS(14)}`, text: 'acetic acid (weak)' })],
              },
            },
            {
              type: 'numeric',
              title: 'Work backwards',
              prompt: r`A 0.10 M solution of a weak acid has pH 3.00. Using $K_a \approx x^2 / C$, what is its $\mathrm pK_a$?`,
              answer: 5,
              tol: 0.05,
              wrong: [{ v: 3, why: 'pH and pKa are different things. Find x = 10⁻³, then Ka = x²/C.' }],
              explain: r`$x = 10^{-3}$, so $K_a = (10^{-3})^2 / 0.10 = 10^{-5}$ and $\mathrm pK_a = 5.0$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A weak base',
              prompt: r`Ammonia is a weak base: $\mathrm{NH_3 + H_2O \rightleftharpoons NH_4^+ + OH^-}$, $K_b = 1.8 \times 10^{-5}$. What is the pH of 0.10 M ammonia? (Find $[\mathrm{OH^-}]$ the same way, then pH = 14 − pOH.)`,
              answer: 11.13,
              tol: 0.03,
              wrong: [{ v: 2.87, why: 'That’s the pOH. Subtract it from 14.' }],
              explain: r`$[\mathrm{OH^-}] = \sqrt{1.8 \times 10^{-6}} = 1.34 \times 10^{-3}$, pOH $= 2.87$, pH $= 11.13$. Household ammonia cleaners are more concentrated and sit around pH 11.5.`,
            },
          ],
          recap: [
            'Weak acid: [H₃O⁺] ≈ √(Ka·C).',
            'Weak acids’ pH rises only ~0.5 per tenfold dilution.',
            'Weak bases: same method for [OH⁻], then pH = 14 − pOH.',
          ],
        },
      ],
    },
    {
      title: 'Buffers',
      summary: 'Holding pH steady.',
      lessons: [
        {
          id: 'buffers',
          title: 'Buffers',
          summary: 'A weak acid and its partner',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Shock absorbers for pH',
              body: r`A **buffer** is a mixture of a weak acid HA and its conjugate base $\mathrm{A^-}$. Add strong acid and $\mathrm{A^-}$ mops it up; add strong base and HA neutralises it. Either way the pH barely moves. Rearranging $K_a$ gives the **Henderson–Hasselbalch equation**:
$$\mathrm{pH} = \mathrm pK_a + \log_{10}\frac{[\mathrm{A^-}]}{[\mathrm{HA}]}$$
With equal amounts of each, pH = $\mathrm pK_a$.`,
            },
            { /*chemanim:acids.buffers*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Same acid, two beakers',
              body: r`Two beakers, a litre each: pure water on the left, an acetate buffer on the right (8 mmol of acetic acid HA and 8 mmol of acetate $\mathrm{A^-}$). Drip the same strong acid into both, 1 mmol at a time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5.6, grid: false, axes: false, height: 290,
                animate: { param: 't', speed: 0.7, max: 7.5, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t;
                  for (const [x0, x1, name] of [[0.3, 4.6, 'water'], [5.4, 9.7, 'buffer']]) {
                    out.push(s('rect', { x: X(x0), y: Y(4.2), width: X(x1) - X(x0), height: Y(0.4) - Y(4.2), fill: 'var(--blue)', opacity: 0.1 }));
                    out.push(s('path', { d: `M${X(x0)} ${Y(4.6)}V${Y(0.4)}H${X(x1)}V${Y(4.6)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }));
                    out.push(s('text', { x: X((x0 + x1) / 2), y: Y(5.15), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(13)}`, text: name }));
                  }
                  const pill = (x, y, txt, fill, stroke) => {
                    out.push(s('rect', { x: X(x) - 17, y: Y(y) - 11, width: 34, height: 22, rx: 11, fill, stroke, 'stroke-width': 1.8 }));
                    out.push(s('text', { x: X(x), y: Y(y) + 4.5, 'text-anchor': 'middle', class: 'lbl', style: FS(11), text: txt }));
                  };
                  // buffer: HA and A−; an A− that catches a drop becomes HA
                  BUF_SPOTS.forEach(([x, y, isA], k) => {
                    const di = BUF_TARGET.indexOf(k), caught = di >= 0 && t >= BUF_DROPS[di] + 0.9;
                    const jx = x + 0.06 * Math.sin(1.7 * t + k), jy = y + 0.05 * Math.cos(1.3 * t + 2 * k);
                    if (isA && !caught) pill(jx, jy, 'A⁻', 'var(--coral-soft)', 'var(--coral)');
                    else pill(jx, jy, 'HA', 'var(--blue-soft)', 'var(--blue)');
                  });
                  // the drops: falling, then either caught (buffer) or left free (water)
                  BUF_DROPS.forEach((d, i) => {
                    if (t < d) return;
                    const f = BUF_SM((t - d) / 0.9);
                    const [tx, ty] = BUF_SPOTS[BUF_TARGET[i]];
                    if (f < 1) pill(tx + 0.0, 5.0 + (ty + 0.35 - 5.0) * f, 'H⁺', 'var(--amber)', 'var(--warn)');
                    const wx = 0.9 + i * 1.05, wy = 5.0 + (1.2 + (i % 2) * 1.3 - 5.0) * f;
                    pill(wx + 0.08 * Math.sin(2 * t + i), wy, 'H⁺', 'var(--amber)', 'var(--warn)');
                  });
                  return out;
                },
                readout: (p) => {
                  const n = bufAdded(p.t);
                  const water = n ? -Math.log10(n * 1e-3) : 7, buf = 4.76 + Math.log10((8 - n) / (8 + n));
                  return `acid added: ${n} mmol · water pH ${fix(water, 2)} · buffer pH ${fix(buf, 2)}`;
                },
              },
              after: r`In water every drop of acid stays free, so 1 mmol takes the pH from 7.00 to 3.00. In the buffer, each $\mathrm{H^+}$ is caught by an acetate and becomes acetic acid; only the **ratio** $[\mathrm{A^-}]/[\mathrm{HA}]$ changes, from 8:8 to 4:12, and the pH slips just from 4.76 to 4.28. The buffer keeps working until its acetate runs out.`,
            },
            {
              type: 'numeric',
              title: 'An acetate buffer',
              prompt: r`A buffer has 0.20 M sodium acetate and 0.10 M acetic acid ($\mathrm pK_a$ 4.76). What is its pH?`,
              answer: 5.06,
              tol: 0.01,
              wrong: [{ v: 4.46, why: 'The ratio is base over acid: log(0.20/0.10) = +0.30.' }],
              explain: r`$4.76 + \log_{10}(0.20/0.10) = 4.76 + 0.30 = 5.06$.`,
            },
            {
              type: 'interactive',
              title: 'Blood’s buffer',
              prompt: r`Blood is buffered by carbonic acid and bicarbonate, with an effective $\mathrm pK_a$ of 6.1. Set the bicarbonate-to-acid ratio that gives the healthy pH of 7.40.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 2, ymin: 5, ymax: 8, height: 300, grid: false,
                axes: { xticks: 1, yticks: 0.5, xlabel: '[HCO₃⁻] ÷ [H₂CO₃]', ylabel: 'pH', yAt: 5, xAt: -1, xfmt: (v) => sig(10 ** v, 1) },
                params: { lr: { min: -1, max: 2, step: 0.01, value: 0, label: 'Ratio', format: (v) => `${fix(10 ** v, 1)} : 1` } },
                curves: [{ f: (x) => 6.1 + x, color: 'blue' }, { f: () => 7.4, color: 'muted', dash: true }],
                points: [{ x: (p) => p.lr, y: (p) => 6.1 + p.lr, color: 'coral' }],
                readout: (p) => `pH **${fix(6.1 + p.lr, 2)}**`,
                goal: (p) => (Math.abs(6.1 + p.lr - 7.4) <= 0.015 ? true : { ok: false, msg: 6.1 + p.lr < 7.4 ? 'Too acidic: more bicarbonate.' : 'Too basic: less bicarbonate.' }),
                solution: { lr: 1.3 },
              },
              explain: r`$7.40 = 6.1 + \log r$ gives $r = 10^{1.3} \approx 20$: twenty bicarbonates for each carbonic acid. Your lungs tune the carbonic acid (by breathing out $\mathrm{CO_2}$) and your kidneys tune the bicarbonate, keeping blood between 7.35 and 7.45.`,
            },
            {
              type: 'mcq',
              title: 'Pick a buffer',
              prompt: 'To make a buffer at pH 7.2 for a biology experiment, which weak acid should you choose?',
              choices: [
                { t: 'Dihydrogen phosphate, pKa 7.21', ok: true },
                { t: 'Acetic acid, pKa 4.76', why: 'A buffer works best within about 1 unit of its pKa.' },
                { t: 'Ammonium, pKa 9.25', why: 'Too far from 7.2: you’d need an extreme ratio.' },
              ],
              explain: r`Choose $\mathrm pK_a$ close to the target pH, so the acid and base forms are in similar amounts and both are ready to absorb a disturbance. Phosphate buffers are the workhorses of biology labs.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'What ratio?',
              prompt: r`What ratio $[\mathrm{A^-}]/[\mathrm{HA}]$ makes an acetate buffer of pH 4.00? (Two decimal places.)`,
              answer: 0.17,
              tol: 0.01,
              explain: r`$\log r = 4.00 - 4.76 = -0.76$, so $r = 10^{-0.76} \approx 0.17$: about six times as much acetic acid as acetate.`,
            },
          ],
          recap: [
            'Buffer = weak acid + its conjugate base.',
            'pH = pKa + log([A⁻]/[HA]); choose pKa near the target pH.',
          ],
        },
        {
          id: 'capacity',
          title: 'Buffer Battles',
          summary: 'How much a buffer can take',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'Water versus buffer',
              body: r`Drip 0.10 M hydrochloric acid into 100 mL of pure water and into 100 mL of a buffer at pH 7.4. Pure water's pH collapses after the first drop; the buffer barely moves until its base runs out.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 30, ymin: 1, ymax: 8, height: 320, grid: false,
                axes: { xticks: 5, yticks: 1, xlabel: 'acid added (mL)', ylabel: 'pH', yAt: 1, xAt: 0 },
                curves: [{ f: (v) => phOf({ Cs: (0.1 * v) / (100 + v) }), color: 'coral', n: 300 }, { f: (v) => bufPH(0.2, v), color: 'blue', n: 300 }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(12), y: plot.Y(2.4), class: 'lbl halo-text', style: `fill:var(--coral);${FS(14)}`, text: 'pure water' }), s('text', { x: plot.X(3), y: plot.Y(7.65), class: 'lbl halo-text', style: `fill:var(--blue);${FS(14)}`, text: '0.20 M buffer' })],
              },
            },
            {
              type: 'interactive',
              title: 'Strong enough',
              prompt: r`Your buffer (pKa 7.4, equal acid and base) must keep 100 mL of solution within 0.10 of pH 7.40 when 10 mL of 0.10 M acid is added. Find the **weakest** (lowest-concentration) buffer that survives.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 15, ymin: 6, ymax: 8, height: 320, grid: false,
                axes: { xticks: 5, yticks: 0.5, xlabel: 'acid added (mL)', ylabel: 'pH', yAt: 6, xAt: 0 },
                params: { C: { min: 0.02, max: 0.4, step: 0.01, value: 0.05, label: 'Buffer', color: 'blue', format: (v) => `${fix(v, 2)} M` } },
                curves: [{ f: (v, p) => bufPH(p.C, v), color: 'blue', n: 200 }, { f: () => 7.3, color: 'muted', dash: true }, { param: { x: () => 10, y: (t) => t, t0: 6, t1: 8 }, color: 'muted', dash: true }],
                points: [{ x: () => 10, y: (p) => bufPH(p.C, 10), color: 'coral' }],
                readout: (p) => `after 10 mL: pH **${fix(bufPH(p.C, 10), 2)}**`,
                goal: (p) => (bufPH(p.C, 10) >= 7.3 && bufPH(p.C - 0.01, 10) < 7.3 ? true : { ok: false, msg: bufPH(p.C, 10) < 7.3 ? 'The pH drops too far: a stronger buffer is needed.' : 'That survives, but a weaker one would too.' }),
                solution: { C: 0.18 },
              },
              explain: r`About 0.18 M. A buffer's **capacity** grows with its concentration: 10 mL of 0.10 M acid is 1 mmol of $\mathrm{H^+}$, and the buffer needs enough base that converting 1 mmol of it barely changes the ratio. With 9 mmol of each form, the ratio goes from 9:9 to 8:10, a pH change of $\log(0.8) \approx -0.1$.`,
            },
            {
              type: 'mcq',
              title: 'Running out',
              prompt: 'Keep adding acid to a buffer. What eventually happens?',
              choices: [
                { t: 'Its base form is used up and the pH suddenly plunges', ok: true },
                { t: 'It keeps the pH steady forever', why: 'Each H⁺ uses up one A⁻. When the A⁻ is gone, nothing absorbs the acid.' },
                { t: 'It turns basic', why: 'Adding acid can only make it more acidic.' },
              ],
              explain: r`A buffer is a reservoir, not a magic wall. That's why diabetic ketoacidosis or kidney failure can overwhelm the blood's buffers, with dangerous results.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Count the protons',
              prompt: r`A buffer contains 5.0 mmol of acetate and 5.0 mmol of acetic acid. 2.0 mmol of HCl is added. What is the new pH? ($\mathrm pK_a$ 4.76; two decimal places.)`,
              answer: 4.39,
              tol: 0.01,
              wrong: [{ v: 4.76, why: 'The added acid converts 2.0 mmol of acetate into acetic acid.' }],
              explain: r`Acetate: $5.0 - 2.0 = 3.0$ mmol; acetic acid: $5.0 + 2.0 = 7.0$ mmol. pH $= 4.76 + \log(3/7) = 4.76 - 0.37 = 4.39$. The same 2.0 mmol in 100 mL of water would give pH 1.7.`,
            },
          ],
          recap: [
            'Buffers absorb acid or base until one form runs out.',
            'Capacity grows with concentration.',
            'Track amounts (mmol): added H⁺ turns A⁻ into HA.',
          ],
        },
        {
          id: 'titration',
          title: 'Titrating a Weak Acid',
          summary: 'Reading pKa off a curve',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A different curve',
              body: r`Titrate 25 mL of 0.10 M acetic acid with 0.10 M sodium hydroxide. Unlike a strong acid, the curve starts higher, rises gently through a long **buffer region**, then jumps at the equivalence point (25 mL), which lies **above** pH 7.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 14, height: 320, grid: false,
                axes: { xticks: 5, yticks: 2, xlabel: 'NaOH added (mL)', ylabel: 'pH', yAt: 0, xAt: 0 },
                curves: [{ f: (v) => titr(v), color: 'blue', n: 400 }, { f: (v) => (v < 25 ? phOf({ Cs: (0.1 * (25 - v)) / (25 + v) }) : phOf({ Cb: (0.1 * (v - 25)) / (25 + v) })), color: 'muted', dash: true, n: 400 }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(1), y: plot.Y(1.4), class: 'lbl halo-text', style: `fill:var(--ink-3);${FS(13)}`, text: 'strong acid (dashed)' })],
              },
            },
            { /*chemanim:acids.titration*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Run the titration',
              body: r`Sodium hydroxide drips from the burette into 25 mL of 0.10 M acetic acid, with a few drops of phenolphthalein. Watch the pH curve being drawn, and the bars underneath: how much of the acid is still HA and how much has become acetate, $\mathrm{A^-}$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.2, grid: false, axes: false, height: 330,
                animate: { param: 't', speed: 1, max: 13.5, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], vb = titV(p.t), pH = titPH(vb);
                  // burette, a falling drop, the flask
                  out.push(s('rect', { x: X(1.3), y: Y(6.0), width: X(1.7) - X(1.3), height: Y(3.9) - Y(6.0), rx: 3, fill: 'var(--blue)', 'fill-opacity': 0.12 + 0.2 * (1 - vb / 40), stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  out.push(s('line', { x1: X(1.5), x2: X(1.5), y1: Y(3.9), y2: Y(3.6), stroke: 'var(--ink-3)', 'stroke-width': 3 }));
                  if (vb > 0 && vb < 40) {
                    const f = (p.t * 4) % 1;
                    out.push(s('circle', { cx: X(1.5), cy: Y(3.5 - 1.0 * f), r: 4, fill: 'var(--blue)', opacity: 0.8 }));
                  }
                  const pink = Math.max(0, Math.min(1, (pH - 8.2) / 1.6));
                  const fl = `M${X(1.15)} ${Y(2.45)}L${X(0.45)} ${Y(1.25)}Q${X(0.4)} ${Y(1.05)} ${X(0.65)} ${Y(1.05)}H${X(2.35)}Q${X(2.6)} ${Y(1.05)} ${X(2.55)} ${Y(1.25)}L${X(1.85)} ${Y(2.45)}`;
                  out.push(s('path', { d: `${fl}Z`, fill: 'var(--blue)', opacity: 0.12, stroke: 'none' }));
                  out.push(s('path', { d: `${fl}Z`, style: `fill:color-mix(in srgb, #e0429a ${fix(pink * 75, 0)}%, transparent)`, stroke: 'none' }));
                  out.push(s('path', { d: `${fl}M${X(1.15)} ${Y(2.45)}V${Y(2.85)}M${X(1.85)} ${Y(2.45)}V${Y(2.85)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }));
                  // HA and A− amounts (mmol): 2.5 mmol in total
                  const nA = Math.min(2.5, 0.1 * vb), nHA = 2.5 - nA;
                  for (const [k, n, col, name] of [[0, nHA, 'var(--blue)', 'HA'], [1, nA, 'var(--coral)', 'A⁻']]) {
                    const y = 0.55 - k * 0.42;
                    out.push(s('rect', { x: X(0.75), y: Y(y + 0.13), width: (X(2.45) - X(0.75)) * (n / 2.5), height: Y(0) - Y(0.26), rx: 3, fill: col }));
                    out.push(s('text', { x: X(0.65), y: Y(y) + 4, 'text-anchor': 'end', class: 'lbl', style: `fill:${col};${FS(11)}`, text: name }));
                  }
                  // the curve so far
                  const gx0 = 3.6, gx1 = 9.7, gy0 = 0.6, gy1 = 5.8;
                  const GX = (v) => gx0 + ((gx1 - gx0) * v) / 40, GY = (ph) => gy0 + ((gy1 - gy0) * ph) / 14;
                  out.push(s('path', { d: `M${X(gx0)} ${Y(gy1)}V${Y(gy0)}H${X(gx1)}`, fill: 'none', stroke: 'var(--axis)', 'stroke-width': 1.5 }));
                  for (const ph of [4, 7, 10]) {
                    out.push(s('line', { x1: X(gx0), x2: X(gx1), y1: Y(GY(ph)), y2: Y(GY(ph)), stroke: 'var(--grid)', 'stroke-width': 1 }));
                    out.push(s('text', { x: X(gx0) - 5, y: Y(GY(ph)) + 4, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-3);${FS(11)}`, text: String(ph) }));
                  }
                  for (const v of [12.5, 25]) out.push(s('text', { x: X(GX(v)), y: Y(gy0) + 16, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-3);${FS(11)}`, text: `${v} mL` }));
                  let d = '';
                  for (let v = 0; v <= vb + 1e-9; v += 0.25) d += `${d ? 'L' : 'M'}${X(GX(v)).toFixed(1)} ${Y(GY(titPH(v))).toFixed(1)}`;
                  if (d) out.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3 }));
                  if (vb >= 12.5) {
                    out.push(s('circle', { cx: X(GX(12.5)), cy: Y(GY(titPH(12.5))), r: 5.5, fill: 'var(--success)' }));
                    out.push(s('text', { x: X(GX(12.5)), y: Y(GY(titPH(12.5))) - 12, 'text-anchor': 'middle', class: 'lbl halo-text', style: `fill:var(--success);${FS(12)}`, text: 'pH = pKa' }));
                  }
                  out.push(s('text', { x: X(gx0), y: Y(gy1) - 6, class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'pH' }));
                  return out;
                },
                readout: (p) => {
                  const vb = titV(p.t);
                  return `NaOH added: ${fix(vb, 1)} mL · pH ${fix(titPH(vb), 2)}`;
                },
              },
              after: r`Through the long flat stretch, the flask holds both {blue:HA} and {coral:$\mathrm{A^-}$}: it is a buffer, so each drop barely moves the pH. Halfway, at 12.5 mL, the two bars are equal and pH = $\mathrm pK_a$ = 4.76. When the HA bar is gone (25 mL) nothing is left to absorb the hydroxide, the pH leaps, and the phenolphthalein turns pink.`,
            },
            {
              type: 'interactive',
              title: 'Half-way there',
              prompt: r`At the **half-equivalence point**, half the acid has become acetate, so $[\mathrm{A^-}] = [\mathrm{HA}]$ and pH = $\mathrm pK_a$. Drag along the curve to that point.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 14, height: 320, grid: false,
                axes: { xticks: 5, yticks: 2, xlabel: 'NaOH added (mL)', ylabel: 'pH', yAt: 0, xAt: 0 },
                params: { V: { min: 0, max: 40, step: 0.25, value: 3, slider: false } },
                curves: [{ f: (v) => titr(v), color: 'blue', n: 400 }],
                points: [{ x: (p) => p.V, y: (p) => titr(p.V), color: 'coral', drag: { fn: (x) => ({ V: x }) }, ariaLabel: 'Volume added' }],
                readout: (p) => `${fix(p.V, 2)} mL added · pH ${fix(titr(p.V), 2)}`,
                goal: (p) => (Math.abs(p.V - 12.5) <= 0.25 ? true : { ok: false, msg: 'Equivalence is at 25 mL: half of that.' }),
                solution: { V: 12.5 },
              },
              explain: r`At 12.5 mL the pH is 4.76: the $\mathrm pK_a$ of acetic acid, read straight off the curve. This is how $\mathrm pK_a$ values are measured.`,
            },
            {
              type: 'mcq',
              title: 'Why above 7?',
              prompt: 'Why is the pH at the equivalence point about 8.7, not 7?',
              choices: [
                { t: 'All the acid has become acetate, a weak base that takes protons from water', ok: true },
                { t: 'Too much NaOH was added', why: 'At equivalence exactly enough has been added.' },
                { t: 'Acetic acid is a base', why: 'It’s the conjugate base, acetate, that makes the solution basic.' },
              ],
              explain: r`$\mathrm{CH_3COO^- + H_2O \rightleftharpoons CH_3COOH + OH^-}$. Sodium acetate solution is mildly basic. Choosing an indicator that changes colour near pH 8.7 matters (next lesson).`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'An unknown acid',
              prompt: r`An unknown weak acid takes 18.0 mL of base to reach equivalence. At 9.0 mL added, the pH meter reads 3.86. What is the acid's $\mathrm pK_a$?`,
              answer: 3.86,
              tol: 0.01,
              explain: r`9.0 mL is half of 18.0 mL, so this is the half-equivalence point and pH = $\mathrm pK_a$ = 3.86, close to lactic acid (3.86), the acid of sour milk.`,
            },
          ],
          recap: [
            'Weak acid titration: buffer region, then a jump; equivalence pH > 7.',
            'At half-equivalence, pH = pKa.',
          ],
        },
      ],
    },
    {
      title: 'Acids Everywhere',
      summary: 'Colour, life and the ocean.',
      lessons: [
        {
          id: 'indicators',
          title: 'Indicators',
          summary: 'Molecules that change colour',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'An acid that changes colour',
              body: r`An **indicator** is itself a weak acid whose acid form HIn and base form $\mathrm{In^-}$ have different colours. It switches over a range of about 2 pH units around its $\mathrm pK_a$. Slide the pH:`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 260,
                params: { ph: { min: 1, max: 13, step: 0.1, value: 7, label: 'pH', format: (v) => fix(v, 1) } },
                extra: ({ plot, p, s }) => [
                  ...tube(plot, s, 2, indColour(INDICATORS[0], p.ph), 'methyl orange'),
                  ...tube(plot, s, 5, indColour(INDICATORS[1], p.ph), 'bromothymol blue'),
                  ...tube(plot, s, 8, `color-mix(in srgb, #d6338a ${fix(100 / (1 + 10 ** (9.3 - p.ph)), 0)}%, #f6f4f2)`, 'phenolphthalein'),
                ],
                readout: (p) => `pH ${fix(p.ph, 1)}`,
              },
            },
            {
              type: 'interactive',
              title: 'Choose the indicator',
              prompt: r`You are titrating acetic acid with sodium hydroxide; the equivalence point is at pH 8.7. Pick the indicator that changes colour right at the jump.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 40, ymin: 0, ymax: 14, height: 320, grid: false,
                axes: { xticks: 5, yticks: 2, xlabel: 'NaOH added (mL)', ylabel: 'pH', yAt: 0, xAt: 0 },
                params: { k: { min: 0, max: 2, step: 1, value: 0, label: 'Indicator', format: (v) => INDICATORS[v][0] } },
                under: ({ plot, p, s }) => { const pk = INDICATORS[p.k][1]; return [s('rect', { x: plot.left, y: plot.Y(pk + 1), width: plot.right - plot.left, height: plot.Y(pk - 1) - plot.Y(pk + 1), fill: 'var(--amber)', 'fill-opacity': 0.18 })]; },
                curves: [{ f: (v) => titr(v), color: 'blue', n: 400 }],
                readout: (p) => `${INDICATORS[p.k][0]} changes between pH ${fix(INDICATORS[p.k][1] - 1, 1)} and ${fix(INDICATORS[p.k][1] + 1, 1)} (shaded)`,
                goal: (p) => (p.k === 2 ? true : { ok: false, msg: 'This one changes colour well before the equivalence point, in the gentle buffer region.' }),
                solution: { k: 2 },
              },
              explain: r`Phenolphthalein (colourless → pink, pH 8.2–10) changes exactly on the steep part of the curve. Methyl orange would change early, in the gently sloping buffer region, giving a badly wrong end point.`,
            },
            {
              type: 'explain',
              title: 'Red cabbage',
              body: r`Red cabbage juice contains anthocyanins, natural indicators that run through a whole rainbow: red in strong acid, purple near neutral, blue, then green and yellow in strong alkali.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 230,
                params: { ph: { min: 1, max: 13, step: 0.5, value: 7, label: 'pH', format: (v) => fix(v, 1) } },
                extra: ({ plot, p, s }) => tube(plot, s, 5, cabbage(p.ph), null),
                readout: (p) => `pH ${fix(p.ph, 1)}: ${p.ph < 3 ? 'red (lemon juice)' : p.ph < 6 ? 'pink to purple' : p.ph < 7.5 ? 'violet (pure water)' : p.ph < 9 ? 'blue (baking soda)' : p.ph < 11.5 ? 'green' : 'yellow (drain cleaner)'}`,
              },
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Strong acid, strong base',
              prompt: 'For HCl titrated with NaOH, the jump at equivalence runs from about pH 4 to 10. Which indicators would work?',
              choices: [
                { t: 'Methyl orange, bromothymol blue and phenolphthalein all change within the jump', ok: true },
                { t: 'Only bromothymol blue, since equivalence is exactly pH 7', why: 'The jump is so steep that anything changing between pH 4 and 10 changes within a drop of the end point.' },
                { t: 'None of them', why: 'All three change on or right next to the steep part, within a drop or so of the end point.' },
              ],
              explain: r`With a strong acid and strong base, a drop or two takes the pH from about 4 to 10, so any indicator that finishes changing in that range gives the same end point to within a drop (methyl orange, which finishes at 4.4, is right at the edge). Weak acids are pickier.`,
            },
          ],
          recap: [
            'Indicators are weak acids with different-coloured acid and base forms.',
            'They change over about pKa ± 1.',
            'Choose one whose range sits on the steep jump of the titration.',
          ],
        },
        {
          id: 'amino',
          title: 'Charged Molecules of Life',
          summary: 'Amino acids and pH',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Two groups, two pKa values',
              body: r`Amino acids carry an acidic group (–COOH, $\mathrm pK_a \approx 2.3$) and a basic group (–$\mathrm{NH_2}$, whose conjugate acid has $\mathrm pK_a \approx 9.6$). At low pH both are protonated (net charge +1); at high pH both have lost a proton (net −1); in between it is a **zwitterion**, with a + and a − on the same molecule.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 14, ymin: -1, ymax: 1, height: 300, grid: false,
                axes: { xticks: 2, yticks: 0.5, xlabel: 'pH', ylabel: 'net charge of glycine', yAt: -1, xAt: 0 },
                params: { ph: { min: 0, max: 14, step: 0.1, value: 7, label: 'pH', format: (v) => fix(v, 1) } },
                curves: [{ f: (x) => glyCharge(x), color: 'violet' }, { f: () => 0, color: 'muted', dash: true }],
                points: [{ x: (p) => p.ph, y: (p) => glyCharge(p.ph), color: 'coral' }],
                readout: (p) => `net charge **${fix(glyCharge(p.ph), 2)}**`,
              },
            },
            {
              type: 'interactive',
              title: 'No net charge',
              prompt: r`Find the pH at which glycine has no overall charge (its **isoelectric point**).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 14, ymin: -1, ymax: 1, height: 300, grid: false,
                axes: { xticks: 2, yticks: 0.5, xlabel: 'pH', ylabel: 'net charge', yAt: -1, xAt: 0 },
                params: { ph: { min: 0, max: 14, step: 0.01, value: 2, label: 'pH', format: (v) => fix(v, 2) } },
                curves: [{ f: (x) => glyCharge(x), color: 'violet' }, { f: () => 0, color: 'muted', dash: true }],
                points: [{ x: (p) => p.ph, y: (p) => glyCharge(p.ph), color: 'coral' }],
                readout: (p) => `pH ${fix(p.ph, 2)} · net charge ${fix(glyCharge(p.ph), 3)}`,
                goal: (p) => (Math.abs(p.ph - 5.97) <= 0.3 ? true : { ok: false, msg: 'Not zero yet. The flat middle of the curve is where it crosses zero.' }),
                solution: { ph: 5.97 },
              },
              explain: r`Midway between the two $\mathrm pK_a$ values: $(2.34 + 9.60)/2 = 5.97$. The curve is very flat there, so the charge is essentially zero over a wide range, but the exact isoelectric point is the average.`,
            },
            {
              type: 'mcq',
              title: 'Sorting proteins',
              prompt: 'In gel electrophoresis, proteins move through a gel under an electric field. At pH 8, which way does a protein with isoelectric point 5 move?',
              choices: [
                { t: 'Towards the positive electrode: above its pI it is negatively charged', ok: true },
                { t: 'Towards the negative electrode', why: 'Above the isoelectric point the molecule has lost protons: net negative.' },
                { t: 'It doesn’t move', why: 'Only at pH = pI is the net charge zero.' },
              ],
              explain: r`At a pH above its pI, a protein has given up protons and carries a net negative charge, so it drifts towards +. Separating proteins by charge (and size) this way is a staple of biochemistry.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Fraction charged',
              prompt: r`At pH 7.4, what fraction of glycine's amino groups ($\mathrm pK_a$ 9.60) are still protonated ($\mathrm{NH_3^+}$)? Give a percentage to one decimal place.`,
              unit: '%',
              answer: 99.4,
              tol: 0.1,
              explain: r`Fraction protonated $= 1/(1 + 10^{7.4 - 9.6}) = 1/(1 + 0.0063) \approx 99.4\%$. Two pH units below the $\mathrm pK_a$, almost every group holds its proton.`,
            },
          ],
          recap: [
            'Each acidic group is protonated below its pKa and deprotonated above.',
            'Amino acids are zwitterions near neutral pH; pI = average of the two pKa values.',
          ],
        },
        {
          id: 'ocean',
          title: 'Acid Oceans',
          summary: 'Carbon dioxide and the sea',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Carbonic acid',
              body: r`Carbon dioxide dissolves in water and forms carbonic acid, which can lose one proton (giving bicarbonate) and then another (carbonate):
$$\mathrm{CO_2 + H_2O \rightleftharpoons H_2CO_3 \rightleftharpoons H^+ + HCO_3^- \rightleftharpoons 2H^+ + CO_3^{2-}}$$
In seawater the two $\mathrm pK_a$ values are about 5.9 and 9.0. Slide the pH to see which form dominates.`,
              widget: {
                kind: 'graph', xmin: 4, xmax: 11, ymin: 0, ymax: 1, height: 300, grid: false,
                axes: { xticks: 1, yticks: 0.25, xlabel: 'pH', ylabel: 'share of dissolved carbon', yAt: 0, xAt: 4, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { ph: { min: 4, max: 11, step: 0.05, value: 8.1, label: 'pH', format: (v) => fix(v, 2) } },
                curves: [{ f: (x) => carb(x)[0], color: 'muted' }, { f: (x) => carb(x)[1], color: 'blue' }, { f: (x) => carb(x)[2], color: 'coral' }, { param: { x: (t, p) => p.ph, y: (t) => t, t0: 0, t1: 1 }, color: 'ink', dash: true }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(4.4), y: plot.Y(0.9), class: 'lbl halo-text', style: `fill:var(--ink-2);${FS(13)}`, text: 'CO₂' }), s('text', { x: plot.X(7.2), y: plot.Y(0.92), class: 'lbl halo-text', style: `fill:var(--blue);${FS(13)}`, text: 'HCO₃⁻' }), s('text', { x: plot.X(10.2), y: plot.Y(0.9), class: 'lbl halo-text', style: `fill:var(--coral);${FS(13)}`, text: 'CO₃²⁻' })],
                readout: (p) => { const [a, b, c] = carb(p.ph); return `CO₂ ${fix(a * 100, 1)}% · bicarbonate ${fix(b * 100, 1)}% · carbonate ${fix(c * 100, 1)}%`; },
              },
            },
            {
              type: 'numeric',
              title: 'A small number, a big change',
              prompt: r`Since pre-industrial times, average surface-ocean pH has fallen from about 8.2 to 8.1. By what percentage has the hydrogen-ion concentration increased?`,
              unit: '%',
              answer: 26,
              tol: 1,
              wrong: [{ v: 1.2, why: 'pH is logarithmic: a drop of 0.1 multiplies [H⁺] by 10^0.1.' }, { v: 10, why: 'A change of 1 pH unit would be ×10; 0.1 units is 10^0.1.' }],
              explain: r`$10^{0.1} = 1.26$: about 26% more $\mathrm{H^+}$. The ocean has absorbed roughly a quarter of the $\mathrm{CO_2}$ humans have emitted, which has slowed warming but changed the sea's chemistry.`,
            },
            {
              type: 'interactive',
              title: 'Carbonate for shells',
              prompt: r`Corals, oysters and many plankton build shells of calcium carbonate, so they need carbonate ions. Lower the pH from 8.2 to 7.8 and read off the share of carbonate at 7.8.`,
              widget: {
                kind: 'graph', xmin: 7, xmax: 9, ymin: 0, ymax: 0.2, height: 280, grid: false,
                axes: { xticks: 0.5, yticks: 0.05, xlabel: 'pH', ylabel: 'carbonate share', yAt: 0, xAt: 7, yfmt: (v) => `${Math.round(v * 100)}%` },
                params: { ph: { min: 7, max: 9, step: 0.05, value: 8.2, label: 'pH', format: (v) => fix(v, 2) } },
                curves: [{ f: (x) => carb(x)[2], color: 'coral' }],
                points: [{ x: (p) => p.ph, y: (p) => carb(p.ph)[2], color: 'coral' }],
                readout: (p) => `carbonate: **${fix(carb(p.ph)[2] * 100, 1)}%** of dissolved carbon`,
                goal: (p) => (Math.abs(p.ph - 7.8) < 0.01 ? true : { ok: false, msg: 'Set the pH to 7.80.' }),
                solution: { ph: 7.8 },
              },
              explain: r`In this simple model carbonate falls from about 14% of dissolved carbon at pH 8.2 to about 6% at 7.8, less than half. Extra $\mathrm{H^+}$ turns carbonate into bicarbonate, so shell-builders must spend more energy to grab what they need, and in the most corrosive waters their shells begin to dissolve.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why does adding CO₂ remove carbonate?',
              prompt: 'Adding CO₂ to seawater adds acid. Why does that reduce carbonate rather than increase it?',
              choices: [
                { t: 'The H⁺ released reacts with carbonate to form bicarbonate: CO₂ + H₂O + CO₃²⁻ → 2HCO₃⁻', ok: true },
                { t: 'CO₂ destroys carbon atoms', why: 'Carbon is conserved; it moves between forms.' },
                { t: 'Carbonate evaporates', why: 'Carbonate ions stay dissolved; they are converted, not lost to the air.' },
              ],
              explain: r`Each $\mathrm{CO_2}$ that dissolves effectively consumes one carbonate ion and makes two bicarbonates. The total dissolved carbon rises, but the share in the form shell-builders need falls.`,
            },
          ],
          recap: [
            'CO₂ ⇌ HCO₃⁻ ⇌ CO₃²⁻: which form dominates depends on pH.',
            'A 0.1 pH drop is 26% more H⁺.',
            'Ocean acidification turns carbonate into bicarbonate.',
          ],
        },
      ],
    },
  ],
};

// 100 mL of buffer (pKa 7.4, total concentration C, equal acid and base) after V mL of 0.10 M HCl
function bufPH(C, V) {
  const a = (0.1 * C) / 2, n = (0.1 * V) / 1000; // mol of each form; mol of acid added
  const Vt = (100 + V) / 1000;
  return phOf({ Ca: (2 * a) / Vt, pKa: 7.4, Cb: a / Vt, Cs: n / Vt });
}
