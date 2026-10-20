import { fix, sig } from '../lib/svg.js';
import { r, FS, pick } from './_chem.js';

// ---------- NMR: peaks [shift δ, hydrogens, neighbours] → a spectrum (x axis runs right-to-left) ----------
const binom = (n, k) => { let v = 1; for (let i = 1; i <= k; i++) v = (v * (n - k + i)) / i; return v; };
function nmrY(d, peaks) {
  let y = 0;
  for (const [c, nH, nb] of peaks) {
    const lines = nb + 1, tot = 2 ** nb;
    for (let k = 0; k < lines; k++) {
      const pos = c + (k - nb / 2) * 0.11, h = (nH * binom(nb, k)) / tot;
      y += h / (1 + ((d - pos) / 0.016) ** 2);
    }
  }
  return y;
}
function nmr(peaks, { ymax, height = 260, extraCurves = [], params, goal, solution, readout, labels, from = 6, to = 0 } = {}) {
  const top = ymax || Math.max(...peaks.map(([, nH, nb]) => nH / 2 ** nb * binom(nb, Math.floor(nb / 2)))) * 1.25;
  return {
    kind: 'graph', xmin: -from, xmax: -to, ymin: 0, ymax: top, grid: false, height, padL: 24,
    axes: { xticks: from - to > 4 ? 1 : 0.5, yticks: 0, xlabel: 'shift δ (ppm)', yAt: 0, xAt: -from, xfmt: (v) => fix(-v, from - to > 4 ? 0 : 1) },
    params, goal, solution, readout,
    curves: [{ f: (x, p) => nmrY(-x, typeof peaks === 'function' ? peaks(p) : peaks), color: 'blue', n: 1200 }, ...extraCurves],
    extra: labels ? ({ plot, s }) => labels.map(([d, y, t]) => s('text', { x: plot.X(-d), y: plot.Y(y), 'text-anchor': 'middle', class: 'lbl halo-text', style: FS(13), text: t })) : undefined,
  };
}

// ---------- IR: dips [wavenumber, depth, width] (x axis runs from 4000 down to 500) ----------
function ir(dips, { height = 260 } = {}) {
  return {
    kind: 'graph', xmin: -4000, xmax: -500, ymin: 0, ymax: 105, grid: false, height, padL: 52,
    axes: { xticks: 500, yticks: 50, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'transmittance (%)', yAt: 0, xAt: -4000, xfmt: (v) => String(-v) },
    curves: [{ f: (x) => 100 - dips.reduce((t, [c, d, w]) => t + d / (1 + ((-x - c) / w) ** 2), 0), color: 'violet', n: 900 }],
  };
}
const IR_ETHANOL = [[3350, 70, 140], [2970, 55, 30], [2900, 30, 25], [1450, 25, 20], [1050, 70, 25], [880, 30, 15]];
const IR_ACETONE = [[3005, 15, 20], [2920, 12, 20], [1715, 90, 18], [1420, 35, 20], [1360, 50, 15], [1220, 60, 20]];
const IR_HEXANE = [[2960, 80, 18], [2930, 80, 18], [2870, 60, 15], [1465, 40, 15], [1380, 25, 12], [725, 20, 10]];
const IR_ACID = [[3000, 60, 300], [1710, 90, 20], [1410, 30, 20], [1290, 50, 20], [940, 30, 30]];

// ---------- mass spectra: isotope patterns from n Cl and n Br ----------
function pattern(nCl, nBr) {
  let dist = [1];
  const conv = (a, b) => { const out = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; })); return out; };
  for (let i = 0; i < nCl; i++) dist = conv(dist, [0.758, 0, 0.242]);
  for (let i = 0; i < nBr; i++) dist = conv(dist, [0.507, 0, 0.493]);
  const mx = Math.max(...dist);
  return dist.map((v) => v / mx);
}
function isotopes(target) {
  const want = pattern(...target);
  return {
    kind: 'graph', xmin: -1, xmax: 9, ymin: 0, ymax: 1.15, grid: false, height: 280, padB: 50,
    axes: { xticks: 0, yticks: 0.5, ylabel: 'relative height', yAt: 0, xAt: -1 },
    params: {
      cl: { min: 0, max: 3, step: 1, value: 0, label: 'Chlorine atoms', color: 'teal' },
      br: { min: 0, max: 2, step: 1, value: 0, label: 'Bromine atoms', color: 'pink' },
    },
    under: ({ plot, s }) => want.map((v, k) => (v > 0.005 ? s('rect', { x: plot.X(k - 0.38), y: plot.Y(v), width: plot.X(0.76) - plot.X(0), height: plot.Y(0) - plot.Y(v), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 4' }) : null)),
    extra: ({ plot, p, s }) => {
      const got = pattern(p.cl, p.br), out = [];
      got.forEach((v, k) => { if (v > 0.005) out.push(s('rect', { x: plot.X(k - 0.22), y: plot.Y(v), width: plot.X(0.44) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 3, fill: 'var(--blue)' })); });
      for (let k = 0; k <= 8; k += 2) out.push(s('text', { x: plot.X(k), y: plot.bottom + 22, 'text-anchor': 'middle', class: 'lbl', style: FS(14), text: k ? `M+${k}` : 'M' }));
      return out;
    },
    readout: (p) => `blue: your molecule · dashed: the measured spectrum`,
    goal: (p) => (p.cl === target[0] && p.br === target[1] ? true : { ok: false, msg: 'The blue bars don’t match the dashed ones yet. Count the peaks first, then compare their heights.' }),
    solution: { cl: target[0], br: target[1] },
  };
}

// ---------- Beer–Lambert ----------
const EPS = 11000; // L/(mol·cm), a typical dye at its peak
const cuvette = (plot, s, A) => {
  const tr = 10 ** -A;
  return [
    s('rect', { x: plot.X(1), y: plot.Y(4), width: plot.X(2) - plot.X(0), height: plot.Y(0.6) - plot.Y(4), rx: 4, fill: '#2f5bd3', 'fill-opacity': Math.min(0.92, 1 - tr * 0.92), stroke: 'var(--ink)', 'stroke-width': 2 }),
    s('line', { x1: plot.X(0), x2: plot.X(1), y1: plot.Y(2.3), y2: plot.Y(2.3), stroke: 'var(--amber)', 'stroke-width': 10 }),
    s('line', { x1: plot.X(3), x2: plot.X(5.5), y1: plot.Y(2.3), y2: plot.Y(2.3), stroke: 'var(--amber)', 'stroke-width': 10, 'stroke-opacity': tr }),
    s('circle', { cx: plot.X(6.2), cy: plot.Y(2.3), r: 20, fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 2.5 }),
    s('text', { x: plot.X(6.2), y: plot.Y(2.3) - 30, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'detector' }),
  ];
};

// propan-2-ol with every H drawn, laid out by hand (a skeleton layout crowds the CH hydrogen between the
// two methyls). Atom order matches SMILES CC(C)O with hydrogens after: C0 C1 C2 O3, H4–6 on C0, H7 on C1,
// H8–10 on C2, H11 on O.
const PROPANOL = {
  atoms: [['C', 195, 186], ['C', 300, 186], ['C', 405, 186], ['O', 300, 118], ['H', 195, 118], ['H', 127, 186], ['H', 195, 254], ['H', 300, 254], ['H', 405, 118], ['H', 473, 186], ['H', 405, 254], ['H', 300, 52]],
  bonds: [[0, 1, 1], [1, 2, 1], [1, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [2, 8, 1], [2, 9, 1], [2, 10, 1], [3, 11, 1]],
};

// ---------- identical slabs of solution, each letting through the same fraction (A = 0.20 each) ----------
const SLAB_T = 10 ** -0.2; // 63% of the light gets through each slab
const slabN = (t) => Math.min(5, Math.floor(Math.max(0, t) / 1.3));

// ---------- carbon dioxide's three ways to vibrate, and what each does to the dipole ----------
// each mode: displacements of [O, C, O] in x and y per unit of the oscillation, plus the oscillation rate
// (each rate is a whole number of cycles in 6 s, the animation's length, so the loop is seamless)
const CO2_MODES = [
  { name: 'symmetric stretch', dx: [-1, 0, 1], dy: [0, 0, 0], w: Math.PI, note: '~1340 cm⁻¹ · no IR absorption' },
  { name: 'asymmetric stretch', dx: [1, -1.1, 1], dy: [0, 0, 0], w: (4 * Math.PI) / 3, note: '2349 cm⁻¹ · absorbs' },
  { name: 'bend', dx: [0, 0, 0], dy: [1, -1.1, 1], w: (2 * Math.PI) / 3, note: '667 cm⁻¹ · absorbs' },
];

// ---------- time of flight: ions from acetone get the same push; the light ones arrive first ----------
// [m/z, label, share of the ions (roughly as in acetone's spectrum), colour]
const TOF_IONS = [[15, 'CH₃⁺', 0.2, 'var(--teal)'], [43, 'CH₃CO⁺', 0.5, 'var(--coral)'], [58, '(CH₃)₂CO⁺', 0.3, 'var(--blue)']];
const TOF_PULSE = 3.0; // seconds between pulses
// every pulse sends one of each ion; flight time grows as √(m/z)
const tofTime = (m) => 0.3 * Math.sqrt(m);

// ---------- why a CH2 next to a CH3 is a 1:3:3:1 quartet: the 8 ways three neighbours can point ----------
const SPLIT_COMBOS = Array.from({ length: 8 }, (_, k) => [0, 1, 2].map((b) => ((k >> b) & 1 ? 1 : -1)));
const SPLIT_STEP = 1.1; // seconds per combination

export default {
  id: 'spectroscopy',
  subject: 'physics',
  title: 'Spectroscopy',
  level: 'Advanced',
  cover: 'spectroscopy',
  tagline: 'How chemists see molecules: light absorption, infrared, mass spectra and NMR puzzles.',
  description: r`Nobody can look at a molecule, yet chemists routinely work out structures of compounds they have never seen. They shine light of every kind through them and read the clues. Measure concentrations with the Beer–Lambert law, treat bonds as springs that absorb infrared, weigh molecules and read chlorine and bromine from their isotope patterns, then master NMR: colour equivalent hydrogens, predict splitting patterns, and combine all the evidence to solve unknown structures.`,
  prereq: 'Organic Chemistry, and Light & Optics',
  chapters: [
    {
      title: 'Light and Matter',
      summary: 'Absorbing and measuring.',
      lessons: [
        {
          id: 'light',
          title: 'Molecules Meet Light',
          summary: 'Each region probes something different',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'A ladder of energies',
              body: r`Light comes in photons of energy $E = hc/\lambda$. Molecules absorb a photon only if it matches the energy of some change they can make, and different regions of the spectrum match different changes:
- **ultraviolet and visible** light lifts **electrons** to higher orbitals (colour),
- **infrared** makes **bonds vibrate** (stretching and bending),
- **microwaves** make molecules **rotate**,
- **radio waves**, in a strong magnet, flip **nuclear spins** (NMR).

Per mole of photons, $E \approx 119{,}600 / \lambda$ kJ/mol with $\lambda$ in nanometres.`,
            },
            {
              type: 'numeric',
              title: 'Green light',
              prompt: r`What is the energy of a mole of 500 nm photons, in kJ/mol?`,
              unit: 'kJ/mol',
              answer: 239,
              tol: 1,
              explain: r`$119{,}600 / 500 = 239$ kJ/mol, comparable to the energy of a weak chemical bond. That's why visible and UV light can drive chemistry: photosynthesis, vision, sunburn.`,
            },
            {
              type: 'mcq',
              title: 'Which light for which job?',
              prompt: 'To find out which kinds of bonds (O–H, C=O...) a molecule contains, which region is most useful?',
              choices: [
                { t: 'Infrared', ok: true },
                { t: 'Radio', why: 'Radio waves in NMR tell you about hydrogen (or carbon) environments, not bond types directly.' },
                { t: 'X-rays', why: 'X-rays knock out inner electrons; good for crystal structures, not for spotting bond types quickly.' },
              ],
              explain: r`Each kind of bond vibrates at its own characteristic frequency, so an infrared spectrum is a checklist of functional groups.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'An infrared photon',
              prompt: r`A C=O bond absorbs infrared at a wavelength of about 5800 nm. What is the energy per mole of those photons, in kJ/mol (one decimal place)?`,
              unit: 'kJ/mol',
              answer: 20.6,
              tol: 0.2,
              explain: r`$119{,}600 / 5800 \approx 20.6$ kJ/mol, more than ten times less than visible light: enough to set a bond vibrating, nowhere near enough to break it.`,
            },
          ],
          recap: [
            'E = hc/λ; about 119,600/λ(nm) kJ/mol.',
            'UV/visible: electrons; infrared: vibrations; microwaves: rotation; radio + magnet: nuclear spins.',
          ],
        },
        {
          id: 'beer',
          title: 'Measuring Concentration',
          summary: 'The Beer–Lambert law',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Darker means more',
              body: r`Shine light through a coloured solution and some is absorbed. The **absorbance** $A = \log_{10}(I_0/I)$ is proportional to the concentration $c$ and the path length $l$:
$$A = \varepsilon\,c\,l$$
where $\varepsilon$, the molar absorptivity, is a property of the substance at that wavelength. Every absorbance unit cuts the light tenfold.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 7, ymin: 0, ymax: 4.6, grid: false, axes: false, height: 200,
                params: { c: { min: 0, max: 200, step: 5, value: 50, label: 'Concentration', color: 'blue', format: (v) => `${v} µM` } },
                extra: ({ plot, p, s }) => cuvette(plot, s, (EPS * p.c * 1e-6)),
                readout: (p) => { const A = EPS * p.c * 1e-6; return `A = ${fix(A, 2)} · ${fix(100 * 10 ** -A, 1)}% of the light gets through`; },
              },
            },
            { /*chemanim:spectroscopy.beer*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Slice the cuvette',
              body: r`Think of a thick sample as a stack of thin identical slices. Each slice absorbs the **same fraction** of whatever light reaches it (here 37%), not the same amount. Watch the beam as slices are added.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5.6, grid: false, axes: false, height: 290,
                animate: { param: 't', speed: 1, max: 7.2, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], n = slabN(p.t);
                  const yb = 3.5, x0 = 2.3, w = 1.1;
                  // the beam: full width and brightness entering, dimming after each slab
                  let I = 1;
                  out.push(s('rect', { x: X(0.3), y: Y(yb + 0.45), width: X(x0) - X(0.3), height: Y(yb - 0.45) - Y(yb + 0.45), fill: 'var(--amber)', opacity: 0.85 }));
                  for (let k = 0; k < 5; k++) {
                    const xa = x0 + k * w, on = k < n;
                    out.push(s('rect', { x: X(xa + 0.1), y: Y(yb + 0.9), width: X(w - 0.2) - X(0), height: Y(yb - 0.9) - Y(yb + 0.9), rx: 4, fill: on ? 'var(--violet)' : 'none', 'fill-opacity': 0.3, stroke: on ? 'var(--violet)' : 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': on ? null : '4 4' }));
                    if (on) I *= SLAB_T;
                    out.push(s('rect', { x: X(xa + w), y: Y(yb + 0.45), width: X(k === 4 ? 9.7 : xa + 2 * w) - X(xa + w), height: Y(yb - 0.45) - Y(yb + 0.45), fill: 'var(--amber)', opacity: 0.85 * I }));
                    // remaining light just after this slab, as a bar underneath
                    if (on) {
                      const bx = xa + w * 0.5, bh = 2.0 * I;
                      out.push(s('rect', { x: X(bx - 0.28), y: Y(0.55 + bh), width: X(0.56) - X(0), height: Y(0.55) - Y(0.55 + bh), fill: 'var(--amber)' }));
                      out.push(s('text', { x: X(bx), y: Y(0.55 + bh) - 5, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: `${fix(100 * I, 0)}%` }));
                    }
                  }
                  out.push(s('rect', { x: X(1.3 - 0.28), y: Y(2.55), width: X(0.56) - X(0), height: Y(0.55) - Y(2.55), fill: 'var(--amber)' }));
                  out.push(s('text', { x: X(1.3), y: Y(2.55) - 5, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: '100%' }));
                  out.push(s('line', { x1: X(0.6), x2: X(9.4), y1: Y(0.55), y2: Y(0.55), stroke: 'var(--axis)', 'stroke-width': 1.5 }));
                  return out;
                },
                readout: (p) => {
                  const n = slabN(p.t);
                  return `slices: ${n} · light through: ${fix(100 * SLAB_T ** n, 0)}% · absorbance A = ${fix(0.2 * n, 2)}`;
                },
              },
              after: r`The light left goes 100% → 63% → 40% → 25% → 16% → 10%: each slice multiplies it by the same 0.63, so the intensity falls **exponentially** with thickness. Taking a logarithm turns that repeated multiplication into adding: each slice adds 0.20 to the absorbance. That is why $A = \log_{10}(I_0/I)$ grows in a straight line with path length, and with concentration (twice the molecules per slice is just like two slices).`,
            },
            {
              type: 'interactive',
              title: 'Hit A = 0.50',
              prompt: r`Spectrometers are most accurate for absorbances around 0.2–1. Dilute the dye ($\varepsilon = 11{,}000$ L/(mol·cm), 1 cm cuvette) so that $A = 0.50$.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 7, ymin: 0, ymax: 4.6, grid: false, axes: false, height: 200,
                params: { c: { min: 0, max: 200, step: 0.5, value: 150, label: 'Concentration', color: 'blue', format: (v) => `${fix(v, 1)} µM` } },
                extra: ({ plot, p, s }) => cuvette(plot, s, EPS * p.c * 1e-6),
                readout: (p) => `A = **${fix(EPS * p.c * 1e-6, 3)}**`,
                goal: (p) => (Math.abs(EPS * p.c * 1e-6 - 0.5) <= 0.006 ? true : { ok: false, msg: EPS * p.c * 1e-6 > 0.5 ? 'Still too dark: dilute more.' : 'Too pale now.' }),
                solution: { c: 45.5 },
              },
              explain: r`$c = A/(\varepsilon l) = 0.50 / 11{,}000 = 4.5 \times 10^{-5}$ M, about 45 µM. At that concentration, $10^{-0.5} = 32\%$ of the light gets through.`,
            },
            {
              type: 'numeric',
              title: 'Absorbance of 2',
              prompt: r`What percentage of the light gets through a sample with absorbance 2.0?`,
              unit: '%',
              answer: 1,
              tol: 0.01,
              wrong: [{ v: 50, why: 'Absorbance is logarithmic: A = 2 means a factor of 10² less light.' }],
              explain: r`$10^{-2} = 1\%$. At high absorbances so little light reaches the detector that measurements get unreliable, which is why samples are diluted.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Read an unknown',
              prompt: r`A calibration line was measured with known standards. An unknown sample has $A = 0.62$. Slide along the line to find its concentration.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 100, ymin: 0, ymax: 1.2, height: 300, grid: false,
                axes: { xticks: 20, yticks: 0.2, xlabel: 'concentration (µM)', ylabel: 'absorbance', yAt: 0, xAt: 0 },
                params: { c: { min: 0, max: 100, step: 0.5, value: 20, label: 'Concentration', format: (v) => `${fix(v, 1)} µM` } },
                curves: [{ f: (x) => 0.011 * x, color: 'blue' }, { f: () => 0.62, color: 'muted', dash: true }],
                under: ({ plot, s }) => [10, 25, 40, 60, 80].map((x) => s('circle', { cx: plot.X(x), cy: plot.Y(0.011 * x + (x % 20 === 0 ? 0.008 : -0.006)), r: 5, fill: 'var(--ink-3)' })),
                points: [{ x: (p) => p.c, y: (p) => 0.011 * p.c, color: 'coral' }],
                readout: (p) => `${fix(p.c, 1)} µM → A = ${fix(0.011 * p.c, 3)}`,
                goal: (p) => (Math.abs(0.011 * p.c - 0.62) <= 0.008 ? true : { ok: false, msg: 'Match the absorbance to 0.62.' }),
                solution: { c: 56.5 },
              },
              explain: r`$0.62 / 0.011 \approx 56$ µM. A calibration line built from standards automatically includes $\varepsilon$, the path length and any quirks of the instrument. This is how blood glucose, water pollutants and protein concentrations are measured every day.`,
            },
          ],
          recap: [
            'A = log(I₀/I) = εcl.',
            'Each unit of A cuts the light tenfold.',
            'Calibration lines turn absorbance into concentration.',
          ],
        },
        {
          id: 'ir',
          title: 'Bonds as Springs',
          summary: 'Infrared spectroscopy',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Vibrating bonds',
              body: r`A bond behaves like a spring between two balls. Its vibration frequency rises with the spring's stiffness $k$ and falls with the masses:
$$\tilde\nu \propto \sqrt{\frac{k}{\mu}}, \qquad \mu = \frac{m_1 m_2}{m_1 + m_2}$$
Light bonds to hydrogen (C–H, O–H, N–H) vibrate fastest, near 3000 cm⁻¹; stiff double bonds such as C=O come around 1700 cm⁻¹. Infrared spectra are plotted with wavenumber decreasing to the right, and absorptions as dips.`,
              widget: ir(IR_HEXANE),
              after: r`Hexane: only C–H stretches (2850–2960) and bends (about 1460 and 1380). No O–H, no C=O.`,
            },
            { /*chemanim:spectroscopy.ir*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Which vibrations absorb?',
              body: r`A vibration can only absorb infrared light if it makes the molecule's **dipole** rock back and forth: the oscillating electric field of the light needs something electrical to push on. Carbon dioxide has no dipole at rest. Watch its three kinds of vibration, and the arrow showing the dipole at each instant.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.3, grid: false, axes: false, height: 340,
                animate: { param: 't', speed: 1, max: 6, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [];
                  CO2_MODES.forEach((m, i) => {
                    const yc = 5.2 - i * 2.05, q = Math.sin(m.w * p.t), amp = 0.22;
                    const xs = [4.6, 5.6, 6.6].map((x, k) => x + m.dx[k] * amp * q), ys = [0, 1, 2].map((k) => yc + m.dy[k] * amp * 1.4 * q);
                    out.push(s('text', { x: X(0.2), y: Y(yc) - 2, class: 'lbl', style: `fill:var(--ink);${FS(12)}`, text: m.name }));
                    out.push(s('text', { x: X(0.2), y: Y(yc) + 14, class: 'lbl', style: `fill:${i ? 'var(--success)' : 'var(--ink-3)'};${FS(11)}`, text: m.note }));
                    for (const k of [0, 2]) {
                      out.push(s('line', { x1: X(xs[1]), y1: Y(ys[1]) - 3, x2: X(xs[k]), y2: Y(ys[k]) - 3, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-opacity': 0.7 }));
                      out.push(s('line', { x1: X(xs[1]), y1: Y(ys[1]) + 3, x2: X(xs[k]), y2: Y(ys[k]) + 3, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-opacity': 0.7 }));
                    }
                    xs.forEach((x, k) => out.push(s('circle', { cx: X(x), cy: Y(ys[k]), r: k === 1 ? 11 : 13, fill: k === 1 ? 'var(--ink-2)' : 'var(--coral)' })));
                    // the dipole: C carries δ+, each O δ−; its size follows how far the charges' centre moves
                    const mx = (xs[0] + xs[2]) / 2 - xs[1], my = (ys[0] + ys[2]) / 2 - ys[1];
                    const ax = 8.7, ay = yc, sc = 2.6;
                    out.push(s('circle', { cx: X(ax), cy: Y(ay), r: 3, fill: 'var(--ink-3)' }));
                    if (Math.hypot(mx, my) > 0.01) out.push(s('line', { x1: X(ax), y1: Y(ay), x2: X(ax + sc * mx), y2: Y(ay + sc * my), stroke: 'var(--violet)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
                    out.push(s('text', { x: X(ax), y: Y(ay - 0.62), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--violet);${FS(11)}`, text: i ? 'dipole swings' : 'dipole: always zero' }));
                  });
                  return out;
                },
              },
              after: r`In the symmetric stretch both oxygens move out and in together, so the molecule stays perfectly balanced: no dipole ever appears, and this vibration is invisible to infrared. The asymmetric stretch and the bend both shift the negative oxygens relative to the positive carbon, so the dipole swings and the molecule absorbs. The bend, at 667 cm⁻¹ (wavelength 15 µm), falls in the part of the infrared where the warm Earth radiates strongly: it is the main reason carbon dioxide is a greenhouse gas, while $\mathrm{N_2}$ and $\mathrm{O_2}$, with no dipole to swing, are not.`,
            },
            {
              type: 'numeric',
              title: 'Heavy hydrogen',
              prompt: r`A C–H stretch absorbs at 2900 cm⁻¹. Replacing H with deuterium (mass 2) changes $\mu$ from $12 \times 1/13$ to $12 \times 2/14$, with the same spring. Where does C–D absorb (cm⁻¹)?`,
              unit: 'cm⁻¹',
              answer: 2128,
              relTol: 0.01,
              wrong: [{ v: 1450, why: 'Doubling the H mass doesn’t double μ, and the frequency goes as the square root.' }],
              explain: r`$\mu_H = 0.923$, $\mu_D = 1.714$. $2900 \times \sqrt{0.923/1.714} \approx 2128$ cm⁻¹. Chemists use deuterium labels to prove which hydrogens move in a reaction.`,
            },
            {
              type: 'mcq',
              title: 'Read a spectrum',
              prompt: 'Which compound gave this spectrum?',
              widget: ir(IR_ETHANOL),
              choices: [
                { t: 'Ethanol', ok: true },
                { t: 'Acetone', why: 'Acetone would show a strong sharp C=O dip near 1715; there’s none here.' },
                { t: 'Hexane', why: 'Hexane has no O–H: no broad band at 3300.' },
              ],
              explain: r`The broad, deep band around 3300 is an O–H stretch, broadened by hydrogen bonding; the strong band near 1050 is C–O. No C=O. An alcohol: ethanol.`,
            },
            {
              type: 'mcq',
              title: 'Another unknown',
              prompt: 'And this one?',
              widget: ir(IR_ACETONE),
              choices: [
                { t: 'Acetone', ok: true },
                { t: 'Ethanol', why: 'There’s no broad O–H band near 3300.' },
                { t: 'Acetic acid', why: 'An acid would show a very broad O–H band (2500–3300) as well as the C=O.' },
              ],
              explain: r`One huge, sharp dip at 1715 cm⁻¹: a ketone C=O. No O–H. Acetone. The C=O band is the strongest and most useful landmark in infrared spectra.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Both at once',
              prompt: 'A very broad band from 2500 to 3300 cm⁻¹ plus a strong dip at 1710. Which functional group?',
              widget: ir(IR_ACID),
              choices: [
                { t: 'A carboxylic acid', ok: true },
                { t: 'An alcohol', why: 'An alcohol has no C=O.' },
                { t: 'A ketone', why: 'A ketone has no O–H.' },
              ],
              explain: r`C=O plus a hugely broadened O–H (acids pair up through two hydrogen bonds) means –COOH. This is how you'd tell vinegar's acetic acid from acetone or ethanol in seconds.`,
            },
          ],
          recap: [
            'ν̃ ∝ √(k/μ): stiff bonds and light atoms vibrate faster.',
            'Landmarks: O–H broad ~3300, C–H ~2900, C=O sharp ~1700, C–O ~1050.',
          ],
        },
        {
          id: 'mass',
          title: 'Weighing Molecules',
          summary: 'Mass spectrometry',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Fly and sort',
              body: r`A **mass spectrometer** knocks an electron off molecules, making positive ions, and sorts them by mass-to-charge ratio, $m/z$. The heaviest peak is usually the **molecular ion**, $\mathrm{M^+}$: the mass of the whole molecule. Lighter peaks are **fragments**: pieces it broke into.

Elements also come as **isotopes**. Chlorine is 76% $^{35}$Cl and 24% $^{37}$Cl (about 3:1); bromine is about 50:50 $^{79}$Br and $^{81}$Br. So molecules containing them show tell-tale clusters of peaks two mass units apart.`,
            },
            { /*chemanim:spectroscopy.mass*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A race down a tube',
              body: r`In a **time-of-flight** mass spectrometer, a burst of ions gets exactly the same electrical push. Same energy means the light ions fly fastest (½mv² is fixed), so they reach the detector first. Here are three ions made from acetone.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: 18, loop: false, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t;
                  const x0 = 0.9, x1 = 9.2, yt = 4.6;
                  out.push(s('rect', { x: X(x0), y: Y(yt + 0.7), width: X(x1) - X(x0), height: Y(yt - 0.7) - Y(yt + 0.7), rx: 10, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }));
                  out.push(s('rect', { x: X(x1 - 0.1), y: Y(yt + 0.7), width: X(0.35) - X(0), height: Y(yt - 0.7) - Y(yt + 0.7), fill: 'var(--ink-2)' }));
                  out.push(s('text', { x: X(x0), y: Y(yt + 0.7) - 6, class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: 'push' }));
                  out.push(s('text', { x: X(x1 + 0.1), y: Y(yt + 0.7) - 6, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: 'detector' }));
                  const u = t % TOF_PULSE, pulses = Math.floor(t / TOF_PULSE);
                  TOF_IONS.forEach(([m, name, , col], k) => {
                    const f = u / tofTime(m);
                    if (f < 1) {
                      const x = x0 + 0.2 + (x1 - x0 - 0.3) * f, y = yt + (k - 1) * 0.42;
                      out.push(s('circle', { cx: X(x), cy: Y(y), r: 4 + 0.12 * m, fill: col, opacity: 0.85 }));
                      out.push(s('text', { x: X(x), y: Y(y) + 4, 'text-anchor': 'middle', class: 'lbl', style: `fill:#fff;${FS(9)}`, text: String(m) }));
                    }
                  });
                  // the record: signal against arrival time, building up pulse by pulse
                  const gx0 = 0.9, gx1 = 9.2, gy0 = 0.6, gy1 = 3.0, tmax = tofTime(64);
                  const GX = (tt) => gx0 + ((gx1 - gx0) * tt) / tmax;
                  out.push(s('path', { d: `M${X(gx0)} ${Y(gy1)}V${Y(gy0)}H${X(gx1)}`, fill: 'none', stroke: 'var(--axis)', 'stroke-width': 1.5 }));
                  out.push(s('text', { x: X(gx1), y: Y(gy0) + 16, 'text-anchor': 'end', class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: 'arrival time →' }));
                  TOF_IONS.forEach(([m, name, share, col]) => {
                    const arrived = pulses + (u >= tofTime(m) ? 1 : 0), h = Math.min(1, arrived / 6) * share * (gy1 - gy0) * 1.9;
                    if (arrived > 0) {
                      out.push(s('rect', { x: X(GX(tofTime(m))) - 4, y: Y(gy0 + h), width: 8, height: Y(gy0) - Y(gy0 + h), fill: col }));
                      out.push(s('text', { x: X(GX(tofTime(m))), y: Y(gy0 + h) - 5, 'text-anchor': 'middle', class: 'lbl', style: `fill:${col};${FS(11)}`, text: `${name} ${m}` }));
                    }
                  });
                  return out;
                },
                readout: () => 'Flight time grows with √(m/z): measure the time, and you have the mass.',
              },
              after: r`Because ½mv² is the same for every ion, its speed goes as $1/\sqrt{m}$, and the flight time as $\sqrt{m/z}$. So the timings convert straight into masses: here the methyl ion (15), the acetyl ion (43, the tallest peak, the **base peak**) and the whole molecule (58, the molecular ion). The heights record how many ions of each mass arrived. Each burst takes only microseconds, so a real instrument can record thousands of spectra a second.`,
            },
            {
              type: 'interactive',
              title: 'One halogen',
              prompt: r`The dashed bars show a measured molecular-ion cluster. How many chlorine and bromine atoms does the molecule contain?`,
              widget: isotopes([1, 0]),
              explain: r`Two peaks, M and M+2, in a 3:1 ratio: one chlorine atom (75% with $^{35}$Cl, 25% with $^{37}$Cl).`,
            },
            {
              type: 'interactive',
              title: 'A harder cluster',
              prompt: r`Now this cluster: M, M+2 and M+4.`,
              widget: isotopes([1, 1]),
              explain: r`One chlorine and one bromine: M (both light isotopes), M+2 (one heavy), M+4 (both heavy), in roughly 3 : 4 : 1. Two bromines would give 1 : 2 : 1, two chlorines 9 : 6 : 1.`,
            },
            {
              type: 'numeric',
              title: 'Losing a methyl',
              prompt: r`Acetone ($\mathrm{CH_3COCH_3}$, M = 58) shows a tall fragment peak at m/z 43. What mass was lost?`,
              answer: 15,
              wrong: [{ v: 43, why: 'That’s the fragment that remains. What broke off?' }],
              explain: r`$58 - 43 = 15$: a methyl group ($\mathrm{CH_3}$). The remaining $\mathrm{CH_3CO^+}$ ion is especially stable, so it's the biggest peak (the **base peak**).`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'Two of something',
              prompt: r`Identify the halogens in this cluster.`,
              widget: isotopes([0, 2]),
              explain: r`Three peaks in 1 : 2 : 1: two bromine atoms, like flipping two coins (79 or 81 each). The same binomial pattern shows up in NMR splitting, later in this course.`,
            },
          ],
          recap: [
            'Mass spec sorts ions by m/z; M⁺ gives the molar mass.',
            'One Cl: M : M+2 = 3 : 1. One Br: 1 : 1. Two Br: 1 : 2 : 1.',
            'Fragments reveal pieces of the structure.',
          ],
        },
      ],
    },
    {
      title: 'NMR',
      summary: 'Listening to hydrogen nuclei.',
      lessons: [
        {
          id: 'nmr-env',
          title: 'Hydrogen Environments',
          summary: 'One signal per kind of H',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Magnets inside molecules',
              body: r`Hydrogen nuclei are tiny magnets. In a strong magnetic field they absorb radio waves at a frequency that depends very slightly on the electrons around them. **Nuclear magnetic resonance** (NMR, the same physics as an MRI scanner) therefore gives one signal for each **set of equivalent hydrogens**: hydrogens in identical surroundings.

Hydrogens are equivalent if a symmetry of the molecule (or free rotation, as in a $\mathrm{CH_3}$ group) swaps them.`,
            },
            {
              type: 'interactive',
              title: 'Colour ethanol',
              prompt: r`Tap each hydrogen to colour it. Give equivalent hydrogens the same colour, and different environments different colours.`,
              widget: pick({ smiles: 'CCO', explicitH: true, pick: 'H', colors: 3, h: 250, bond: 78, answer: [[3, 4, 5], [6, 7], [8]], splitMsg: 'The hydrogens on one carbon are equivalent: they swap as the group spins.', mergeMsg: 'Hydrogens on different atoms here are in different environments.' }),
              explain: r`Three environments: $\mathrm{CH_3}$ (3 H), $\mathrm{CH_2}$ (2 H) and OH (1 H), so ethanol gives three NMR signals.`,
            },
            {
              type: 'interactive',
              title: 'Symmetry helps',
              prompt: r`Now propan-2-ol, $\mathrm{(CH_3)_2CHOH}$. Colour the hydrogens by environment.`,
              widget: pick({ ...PROPANOL, pick: 'H', colors: 3, h: 300, answer: [[4, 5, 6, 8, 9, 10], [7], [11]], splitMsg: 'Both methyl groups sit on the same carbon in identical positions: all six hydrogens are equivalent.', mergeMsg: 'The CH, the OH and the methyls are three different environments.' }),
              explain: r`The two methyl groups are swapped by the molecule's mirror symmetry, so all six methyl hydrogens are equivalent. Three signals, in a 6 : 1 : 1 ratio.`,
            },
            {
              type: 'numeric',
              title: 'Benzene',
              prompt: r`How many NMR signals does benzene, $\mathrm{C_6H_6}$, give?`,
              answer: 1,
              wrong: [{ v: 6, why: 'All six hydrogens are equivalent by the ring’s symmetry.' }],
              explain: r`One: the six-fold symmetry makes every hydrogen identical.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Methyl acetate',
              prompt: r`How many signals does methyl acetate, $\mathrm{CH_3COOCH_3}$, give?`,
              answer: 2,
              wrong: [{ v: 1, why: 'The two methyl groups are in different places: one on carbon next to C=O, one on oxygen.' }],
              explain: r`Two: the $\mathrm{CH_3}$ on the carbonyl carbon and the $\mathrm{CH_3}$ on oxygen. They look alike but have different neighbours, so they resonate at different frequencies.`,
            },
          ],
          recap: [
            'One NMR signal per set of equivalent hydrogens.',
            'Symmetry and free rotation make hydrogens equivalent.',
          ],
        },
        {
          id: 'nmr-shift',
          title: 'Shift & Integration',
          summary: 'Where and how big',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'The δ scale',
              body: r`Electrons around a nucleus shield it from the magnet. An electronegative neighbour pulls electrons away, **deshielding** the hydrogen, so it resonates at a higher **chemical shift**, $\delta$, measured in parts per million (ppm) and plotted increasing to the **left**:
- C–H next to nothing special: 0.9–1.5
- C–H next to C=O: about 2.1
- C–H next to O (as in C–O–C or C–OH): 3.3–4.1
- O–H: anywhere from 1 to 5, often broad
- benzene ring H: about 7.3; aldehyde H: about 9.7

The **area** under each signal (its **integral**) is proportional to the number of hydrogens.`,
              widget: nmr([[3.7, 3, 0], [2.1, 3, 0]], { labels: [[3.7, 3.4, 'OCH₃'], [2.1, 3.4, 'C(=O)CH₃']], ymax: 3.9 }),
              after: r`Methyl acetate: two singlets of equal size (3 H each), at 2.1 (next to C=O) and 3.7 (next to O).`,
            },
            {
              type: 'mcq',
              title: 'Which is further left?',
              prompt: r`In chloromethane ($\mathrm{CH_3Cl}$) and methane ($\mathrm{CH_4}$), whose hydrogens appear at the higher δ?`,
              choices: [
                { t: 'Chloromethane: chlorine pulls electrons away (deshields)', ok: true },
                { t: 'Methane', why: 'Methane’s hydrogens are well shielded: δ ≈ 0.2.' },
              ],
              explain: r`$\mathrm{CH_3Cl}$ appears at about 3.1 ppm, methane at 0.2. The more electronegative the neighbour, the further left.`,
            },
            {
              type: 'numeric',
              title: 'Integrals',
              prompt: r`A compound shows two signals with integrals in the ratio 1 : 3. It has 8 hydrogens in total. How many hydrogens does the larger signal represent?`,
              answer: 6,
              wrong: [{ v: 3, why: 'The ratio is 1 : 3, but there are 8 hydrogens: scale up.' }],
              explain: r`$8 \times 3/4 = 6$ and $8 \times 1/4 = 2$. Integrals give ratios; the formula sets the scale.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Match the spectrum',
              prompt: r`A compound $\mathrm{C_2H_4O_2}$ shows just two NMR signals: a singlet at 2.1 ppm (3 H) and a broad singlet at 11.5 ppm (1 H). Which compound is it?`,
              choices: [
                { t: 'Acetic acid, CH₃COOH', ok: true },
                { t: 'Methyl formate, HCOOCH₃', why: 'Methyl formate would have a CH₃ next to O (about 3.8) and an H on C=O (about 8).' },
              ],
              explain: r`A methyl next to C=O (2.1) and a very deshielded acidic O–H (10–12 ppm): acetic acid.`,
            },
          ],
          recap: [
            'Chemical shift δ: electronegative neighbours move signals left (higher δ).',
            'Integrals are proportional to numbers of hydrogens.',
          ],
        },
        {
          id: 'nmr-split',
          title: 'Splitting Patterns',
          summary: 'The n + 1 rule',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Neighbours’ magnets',
              body: r`Each hydrogen feels the tiny magnets of hydrogens on the **neighbouring** carbon. Each neighbour can point with or against the field, and every combination shifts the signal slightly. A signal with $n$ equivalent neighbouring hydrogens splits into $n + 1$ lines, with heights from **Pascal's triangle**: 1:1, 1:2:1, 1:3:3:1...

It's exactly like flipping $n$ coins: the middle outcomes have the most ways to happen.`,
              widget: nmr((p) => [[3, 1, p.n]], { params: { n: { min: 0, max: 6, step: 1, value: 3, label: 'Neighbours', control: 'buttons' } }, ymax: 1.1, from: 4, to: 2, readout: (p) => `${p.n + 1} line${p.n ? 's' : ''}: ${Array.from({ length: p.n + 1 }, (_, k) => binom(p.n, k)).join(' : ')} · ${['singlet', 'doublet', 'triplet', 'quartet', 'quintet', 'sextet', 'septet'][p.n]}` }),
            },
            { /*chemanim:spectroscopy.nmr-split*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Flip three coins',
              body: r`The $\mathrm{CH_2}$ protons in bromoethane have three neighbours, the $\mathrm{CH_3}$ protons. Each neighbour's tiny magnet points with the field (↑) or against it (↓), nudging the $\mathrm{CH_2}$ signal slightly one way or the other. In a sample of billions of molecules, every combination occurs equally often.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: 8 * SPLIT_STEP + 1.5, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t;
                  const shown = Math.min(8, Math.floor(t / SPLIT_STEP) + 1), cur = SPLIT_COMBOS[Math.min(7, Math.floor(t / SPLIT_STEP))];
                  // the current combination of the three neighbours
                  cur.forEach((d, b) => {
                    const x = 3.6 + b * 1.4;
                    out.push(s('circle', { cx: X(x), cy: Y(4.9), r: 18, fill: 'var(--card)', stroke: d > 0 ? 'var(--blue)' : 'var(--coral)', 'stroke-width': 2.5 }));
                    out.push(s('text', { x: X(x), y: Y(4.9) + 7, 'text-anchor': 'middle', class: 'lbl', style: `fill:${d > 0 ? 'var(--blue)' : 'var(--coral)'};${FS(20)}`, text: d > 0 ? '↑' : '↓' }));
                  });
                  out.push(s('text', { x: X(1.2), y: Y(4.9) + 5, class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'CH₃ neighbours:' }));
                  // tally: each combination adds a block at (number up − number down)
                  const count = { '-3': 0, '-1': 0, '1': 0, '3': 0 };
                  for (let k = 0; k < shown; k++) count[SPLIT_COMBOS[k].reduce((a, b) => a + b, 0)]++;
                  const base = 0.9, bh = 0.62;
                  for (const [sum, n] of Object.entries(count)) {
                    const x = 5 + Number(sum) * 1.15;
                    for (let j = 0; j < n; j++) {
                      const isNew = j === n - 1 && Number(sum) === cur.reduce((a, b) => a + b, 0) && (t % SPLIT_STEP) < 0.5 && shown <= 8 && t < 8 * SPLIT_STEP;
                      out.push(s('rect', { x: X(x - 0.45), y: Y(base + (j + 1) * bh), width: X(0.9) - X(0), height: Y(0) - Y(bh) - 2, rx: 4, fill: isNew ? 'var(--amber)' : 'var(--violet)', opacity: 0.85 }));
                    }
                    out.push(s('text', { x: X(x), y: Y(base) + 16, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: { '-3': '0 up', '-1': '1 up', 1: '2 up', 3: '3 up' }[sum] }));
                  }
                  out.push(s('line', { x1: X(0.9), x2: X(9.1), y1: Y(base), y2: Y(base), stroke: 'var(--axis)', 'stroke-width': 1.5 }));
                  return out;
                },
                readout: (p) => {
                  const shown = Math.min(8, Math.floor(p.t / SPLIT_STEP) + 1);
                  return shown < 8 ? `combination ${shown} of 8` : 'All 8 combinations: four lines in the ratio 1 : 3 : 3 : 1, a quartet';
                },
              },
              after: r`Only the **number** of neighbours pointing up matters, not which ones. There is one way to have all three up, three ways to have two up, three ways to have one up, and one way to have none: 1 : 3 : 3 : 1, the row of Pascal's triangle for three coins. With $n$ neighbours there are $n + 1$ possible totals, hence $n + 1$ lines. The $\mathrm{CH_3}$ signal, with the two $\mathrm{CH_2}$ protons as neighbours, gets 1 : 2 : 1: a triplet.`,
            },
            {
              type: 'interactive',
              title: 'The ethyl group',
              prompt: r`Bromoethane, $\mathrm{CH_3CH_2Br}$, has a $\mathrm{CH_2}$ signal at 3.4 and a $\mathrm{CH_3}$ signal at 1.7. Set the number of neighbours each one sees to match the measured spectrum (dashed).`,
              widget: nmr((p) => [[3.4, 2, p.a], [1.7, 3, p.b]], {
                params: { a: { min: 0, max: 4, step: 1, value: 0, label: 'CH₂ neighbours', color: 'blue' }, b: { min: 0, max: 4, step: 1, value: 0, label: 'CH₃ neighbours', color: 'teal' } },
                extraCurves: [{ f: (x) => nmrY(-x, [[3.4, 2, 3], [1.7, 3, 2]]), color: 'muted', dash: true, n: 1200 }],
                ymax: 3.3, from: 4.2, to: 1,
                readout: (p) => `CH₂: ${p.a + 1} line${p.a ? 's' : ''} · CH₃: ${p.b + 1} line${p.b ? 's' : ''}`,
                goal: (p) => (p.a === 3 && p.b === 2 ? true : { ok: false, msg: 'Count the hydrogens on the neighbouring carbon for each group.' }),
                solution: { a: 3, b: 2 },
              }),
              explain: r`The $\mathrm{CH_2}$ is next to a $\mathrm{CH_3}$ (3 neighbours) → **quartet**; the $\mathrm{CH_3}$ is next to a $\mathrm{CH_2}$ (2 neighbours) → **triplet**. A quartet plus a triplet, 2 : 3 in area, is the fingerprint of an ethyl group.`,
            },
            {
              type: 'mcq',
              title: 'Isopropyl',
              prompt: r`In 2-bromopropane, $\mathrm{(CH_3)_2CHBr}$, how is the CH signal split?`,
              choices: [
                { t: 'Into 7 lines (a septet): six neighbouring H', ok: true },
                { t: 'Into 4 lines', why: 'Both methyl groups are neighbours: 3 + 3 = 6 equivalent hydrogens.' },
                { t: 'Not at all', why: 'It has six neighbouring hydrogens.' },
              ],
              explain: r`Six equivalent neighbours → 7 lines (1:6:15:20:15:6:1); the methyl signal (one neighbour) is a doublet. Doublet + septet: the isopropyl fingerprint.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'No neighbours',
              prompt: r`Why are both signals of methyl acetate, $\mathrm{CH_3COOCH_3}$, singlets?`,
              choices: [
                { t: 'Neither methyl has hydrogens on the neighbouring atom (C=O carbon, or O)', ok: true },
                { t: 'Methyl groups never split', why: 'The methyl in an ethyl group is a triplet.' },
                { t: 'The two methyls cancel each other', why: 'They’re too far apart to affect each other; it’s their immediate neighbours that matter.' },
              ],
              explain: r`Splitting comes from hydrogens on the **adjacent** carbon (three bonds away). Here both methyls are attached to atoms with no hydrogens, so each signal is a single line.`,
            },
          ],
          recap: [
            'n equivalent neighbouring H → n + 1 lines, heights from Pascal’s triangle.',
            'Ethyl: quartet + triplet. Isopropyl: septet + doublet.',
          ],
        },
        {
          id: 'solve',
          title: 'Solve the Structure',
          summary: 'Putting the clues together',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'A detective’s method',
              body: r`1. **Formula** (from mass spec and analysis): count the degree of unsaturation (see Organic Chemistry).
2. **Infrared**: which functional groups are present (O–H? C=O?).
3. **NMR**: how many hydrogen environments, how many H in each (integrals), how they neighbour each other (splitting), what they're next to (shift).
4. Assemble pieces and check every clue.`,
            },
            {
              type: 'mcq',
              title: 'Case 1',
              prompt: r`$\mathrm{C_3H_6O}$. IR: strong sharp band at 1715 cm⁻¹, nothing near 3300. NMR: a single singlet at 2.1 ppm. What is it?`,
              widget: nmr([[2.1, 6, 0]], { ymax: 7 }),
              choices: [
                { t: 'Acetone, CH₃COCH₃', ok: true },
                { t: 'Propanal, CH₃CH₂CHO', why: 'An aldehyde would show an H near 9.7 ppm and splitting.' },
                { t: 'Prop-2-en-1-ol (an alcohol with C=C)', why: 'No O–H band, and the NMR would be complex.' },
              ],
              explain: r`C=O (1715), no O–H; all six hydrogens equivalent, next to C=O (2.1), no neighbours to split them: two methyls on a carbonyl. Acetone.`,
            },
            {
              type: 'mcq',
              title: 'Case 2',
              prompt: r`$\mathrm{C_2H_6O}$. IR: broad band at 3350 cm⁻¹. NMR: triplet (3 H) at 1.2, quartet (2 H) at 3.7, broad singlet (1 H) at 2.6. What is it?`,
              widget: nmr([[1.2, 3, 2], [3.7, 2, 3], [2.6, 1, 0]], { ymax: 1.6 }),
              choices: [
                { t: 'Ethanol', ok: true },
                { t: 'Dimethyl ether', why: 'Dimethyl ether has one environment (a singlet, 6 H) and no O–H.' },
              ],
              explain: r`O–H in the IR; an ethyl group (triplet + quartet) with its $\mathrm{CH_2}$ deshielded by oxygen (3.7); one exchangeable H. $\mathrm{CH_3CH_2OH}$.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Case 3',
              prompt: r`$\mathrm{C_4H_8O_2}$. IR: strong band at 1740 cm⁻¹, no O–H. NMR: triplet (3 H) at 1.25, singlet (3 H) at 2.05, quartet (2 H) at 4.1. What is it?`,
              widget: nmr([[1.25, 3, 2], [2.05, 3, 0], [4.1, 2, 3]], { ymax: 3.4 }),
              choices: [
                { t: 'Ethyl acetate, CH₃COOCH₂CH₃', ok: true },
                { t: 'Methyl propanoate, CH₃CH₂COOCH₃', why: 'Its ethyl CH₂ would sit next to C=O (about 2.3, quartet) and its OCH₃ would be a singlet near 3.7.' },
                { t: 'Butanoic acid', why: 'An acid would show a broad O–H in both spectra.' },
              ],
              explain: r`An ester C=O (1740); an ethyl whose $\mathrm{CH_2}$ is on oxygen (quartet at 4.1); an isolated methyl next to C=O (singlet at 2.05). Ethyl acetate, the pear-drop smell from Organic Chemistry, now identified from its spectra alone.`,
            },
          ],
          recap: [
            'Formula → unsaturation; IR → functional groups; NMR → the hydrogen map.',
            'Every clue must fit the final structure.',
          ],
        },
      ],
    },
  ],
};
