import { fix } from '../lib/svg.js';

const r = String.raw;
// live readouts keep a fixed 2 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 2);

// approximate colour of a wavelength (nm) for display
function wl2rgb(l) {
  let R = 0, G = 0, B = 0;
  if (l >= 380 && l < 440) [R, G, B] = [-(l - 440) / 60, 0, 1];
  else if (l < 490) [R, G, B] = [0, (l - 440) / 50, 1];
  else if (l < 510) [R, G, B] = [0, 1, -(l - 510) / 20];
  else if (l < 580) [R, G, B] = [(l - 510) / 70, 1, 0];
  else if (l < 645) [R, G, B] = [1, -(l - 645) / 65, 0];
  else if (l <= 780) [R, G, B] = [1, 0, 0];
  const fade = l < 420 ? 0.3 + (0.7 * (l - 380)) / 40 : l > 700 ? 0.3 + (0.7 * (780 - l)) / 80 : 1;
  const c = (x) => Math.round(255 * Math.max(0, x * fade) ** 0.8);
  return l < 380 || l > 780 ? null : `rgb(${c(R)},${c(G)},${c(B)})`;
}
const colourName = (l) => (l < 380 ? 'ultraviolet (invisible)' : l < 450 ? 'violet' : l < 495 ? 'blue' : l < 570 ? 'green' : l < 590 ? 'yellow' : l < 620 ? 'orange' : l <= 750 ? 'red' : 'infrared (invisible)');

const VT = 0.02585;
const diodeI = (V) => 1e-12 * (Math.exp(V / VT) - 1) * 1000; // in mA

// a solar cell in sunlight: short-circuit current 3 A, open-circuit voltage 0.62 V
const ISC = 3, I0 = ISC / (Math.exp(0.62 / VT) - 1);
const cellI = (V) => Math.max(0, ISC - I0 * (Math.exp(V / VT) - 1));
const PMAX = (() => { let m = 0; for (let v = 0; v <= 0.62; v += 0.0005) m = Math.max(m, v * cellI(v)); return m; })();
// transistor counts of landmark chips
const CHIPS = [[1971, 2300, '4004'], [1978, 29000, '8086'], [1985, 275000, '386'], [1993, 3.1e6, 'Pentium'], [2000, 42e6, 'Pentium 4'], [2006, 291e6, 'Core 2'], [2010, 1.17e9, 'Core i7'], [2015, 1.75e9, 'Skylake'], [2020, 16e9, 'M1'], [2023, 134e9, 'M2 Ultra']];

// carriers on a jittered grid: holes on the p side (x < 0), electrons on the n side (x > 0); each sits on a fixed ion
const PN_SITES = (() => { const out = []; for (let i = 0; i < 16; i++) for (let j = 0; j < 6; j++) out.push([-3.75 + 0.5 * i, 0.4 + 0.5 * j, (i * 7 + j * 13) % 10]); return out; })();
const pnWidth = (t) => 1.4 * (1 - Math.exp(-Math.max(0, t - 0.8) / 1.6));

export default {
  id: 'semiconductors',
  subject: 'physics',
  title: 'Semiconductors',
  level: 'Advanced',
  cover: 'semiconductors',
  tagline: 'Band gaps, diodes, LEDs, solar cells, transistors and Moore’s law.',
  description: r`Silicon is neither a good conductor nor a good insulator, and that's exactly what makes modern technology possible. Learn how band gaps, doping and junctions produce diodes, LEDs, solar cells and the transistors inside every chip, then squeeze the most power from a solar cell and test fifty years of Moore's law.`,
  prereq: 'Electricity & Circuits',
  chapters: [
    {
      title: 'In-Between Materials',
      summary: 'Bands and doping.',
      lessons: [
        {
          id: 'bands',
          title: 'Band Gaps',
          summary: 'Conductors, insulators and in between',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Energy bands',
              body: r`In a solid, electrons can only have energies in certain ranges called **bands**. Two matter most:
- the **valence band**: electrons bound into chemical bonds, unable to move freely;
- the **conduction band**: electrons free to roam and carry current.

The energy gap between them, the **band gap**, decides everything:

| Material | Band gap | Behaviour |
|---|---|---|
| Metal (copper) | none: the bands overlap | conducts easily |
| Silicon | 1.1 eV | semiconductor |
| Diamond | 5.5 eV | insulator |

(1 eV, an electronvolt, is the energy an electron gains crossing 1 volt.)`,
            },
            {
              type: 'mcq',
              kicker: 'Predict',
              title: 'Heat it up',
              prompt: r`What happens to the electrical resistance of pure silicon as it gets hotter?`,
              choices: [
                { t: 'It decreases: it conducts better', ok: true },
                { t: 'It increases, like a metal', why: 'Metals do get more resistive when hot. Semiconductors behave the opposite way.' },
                { t: 'It stays the same', why: 'Temperature has a big effect on semiconductors.' },
              ],
              explain: r`Heat gives some electrons enough energy to jump the band gap into the conduction band, creating more charge carriers. So a hot semiconductor conducts **better**, the opposite of a metal, where hotter atoms just scatter electrons more. Thermistors in thermostats and fire alarms use exactly this effect.`,
            },
            {
              type: 'numeric',
              title: 'A big jump',
              prompt: r`At room temperature, the typical thermal energy of an electron is about $0.026$ eV. How many times larger is silicon's band gap of $1.1$ eV? (Nearest whole number.)`,
              unit: '×',
              answer: 1.1 / 0.026,
              tol: 1,
              wrong: [{ v: 0.024, tol: 0.002, why: 'Divide the band gap by the thermal energy, not the other way round.' }],
              explain: r`$\frac{1.1}{0.026} \approx 42$. Only electrons with exceptional luck get enough thermal energy to jump the gap, so pure silicon has very few free electrons: about one for every few trillion atoms at room temperature. That's why it conducts so poorly, and why tiny amounts of impurity change it so much.`,
            },
            {
              type: 'numeric',
              title: 'Silicon’s threshold',
              prompt: r`Silicon’s band gap is 1.12 eV. What is the longest wavelength of light whose photons can lift an electron across it? ($\lambda = 1240/E$ nm; nearest 10 nm.)`,
              unit: 'nm',
              answer: 1240 / 1.12,
              tol: 6,
              explain: r`$\frac{1240}{1.12} \approx 1100$ nm, in the near infrared. Silicon absorbs all visible light (which is why solar cells look dark) but is transparent to longer infrared wavelengths, which is used to inspect silicon chips from behind.`,
            },
            {
              type: 'interactive',
              title: 'The colour of an LED',
              body: r`In an LED, an electron falls across the band gap and emits one photon carrying the gap energy. Its wavelength is $\lambda = \frac{1240\ \text{nm·eV}}{E_g}$. Choose the band gap for a **red** LED at **650 nm**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5.5, grid: false, axes: false, maxWidth: 420, height: 280,
                params: { Eg: { min: 1, max: 3.5, step: 0.01, value: 2.5, label: 'band gap', color: 'violet', format: (v) => `${v.toFixed(2)} eV` } },
                extra: ({ plot, p, s, arrow }) => { const lam = 1239.84 / p.Eg, hue = lam > 700 ? 0 : lam < 400 ? 275 : 275 * (700 - lam) / 300, col = lam > 780 || lam < 380 ? 'var(--ink-3)' : `hsl(${hue.toFixed(0)}, 85%, 50%)`, y0 = 0.6, y1 = 0.6 + p.Eg; return [s('rect', { x: plot.X(1), y: plot.Y(y0), width: plot.X(5) - plot.X(1), height: plot.Y(0) - plot.Y(y0), class: 'fl-blue-soft', stroke: 'var(--blue)' }), s('rect', { x: plot.X(1), y: plot.Y(y1 + 0.6), width: plot.X(5) - plot.X(1), height: plot.Y(y1) - plot.Y(y1 + 0.6), class: 'fl-coral-soft', stroke: 'var(--coral)' }), s('text', { x: plot.X(3), y: plot.Y(0.3) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'valence band' }), s('text', { x: plot.X(3), y: plot.Y(y1 + 0.3) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', text: 'conduction band' }), arrow(plot.X(2), plot.Y(y1), plot.X(2), plot.Y(y0), { color: 'var(--ink-2)', width: 2.5 }), s('circle', { cx: plot.X(2), cy: plot.Y(y1 + 0.05), r: 6, class: 'fl-ink' }), s('path', { d: Array.from({ length: 41 }, (_, i) => `${i ? 'L' : 'M'}${plot.X(2.4 + (i / 40) * 5).toFixed(1)} ${plot.Y((y0 + y1) / 2 + 0.25 * Math.sin((i / 40) * Math.PI * 2 * (4 + (lam < 2000 ? 2000 / lam : 1)))).toFixed(1)}`).join(''), fill: 'none', stroke: col, 'stroke-width': 3 })]; },
                readout: (p) => { const l = 1239.84 / p.Eg; const name = l < 380 ? 'ultraviolet' : l < 450 ? 'violet' : l < 495 ? 'blue' : l < 570 ? 'green' : l < 590 ? 'yellow' : l < 620 ? 'orange' : l < 750 ? 'red' : 'infrared'; return `photon wavelength **${l.toFixed(0)} nm** (${name})`; },
                goal: (p) => Math.abs(1239.84 / p.Eg - 650) < 5,
                hint: 'E = 1240 / 650 eV.',
                solution: { Eg: 1.91 },
              },
              explain: r`$E_g = 1240/650 \approx 1.9$ eV, the gap of the alloys used in red LEDs. Blue LEDs need about 2.7 eV, which took until the 1990s to achieve with gallium nitride (a Nobel Prize in 2014). Silicon’s 1.1 eV gap would emit in the infrared, and it is very inefficient at emitting light at all.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Holes',
              prompt: r`When an electron jumps up into the conduction band, it leaves a gap in a bond behind. Neighbouring electrons can shuffle into that gap. How does this **hole** behave?`,
              choices: [
                { t: 'Like a positive charge moving the opposite way to the electrons', ok: true },
                { t: 'Like a negative charge', why: 'The hole is where an electron is missing, so the region is left with a net positive charge.' },
                { t: 'It doesn’t move', why: 'As electrons hop into it one after another, the hole effectively travels.' },
              ],
              explain: r`When the electron next door hops into the hole, the hole moves the other way. A hole acts like a **positive** charge carrier. In semiconductors, current is carried by electrons **and** holes.`,
            },
          ],
          recap: [
            'The band gap separates bound (valence) and free (conduction) electrons.',
            'Metals: no gap. Silicon: 1.1 eV. Insulators: large gaps.',
            'Semiconductors conduct better when hot. Holes act as positive carriers.',
          ],
        },
        {
          id: 'doping',
          title: 'Doping',
          summary: 'n-type and p-type',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A pinch of impurity',
              body: r`Pure silicon conducts poorly. Engineers add tiny amounts of other elements, a process called **doping**. Silicon has 4 outer electrons, each forming a bond with a neighbour.

- **n-type:** add phosphorus, which has **5** outer electrons. Four form bonds, and the fifth is left loose and free to conduct. The extra carriers are **negative** electrons.
- **p-type:** add boron, which has **3** outer electrons. One bond is left missing an electron: a **hole**. The extra carriers are **positive** holes.

Even one dopant atom per million silicon atoms can raise conductivity enormously.`,
            },
            {
              type: 'mcq',
              title: 'Arsenic',
              prompt: r`Arsenic, like phosphorus, has 5 outer electrons. Adding it to silicon makes…`,
              cols: 2,
              choices: [
                { t: 'n-type silicon', ok: true },
                { t: 'p-type silicon', why: 'p-type needs atoms with 3 outer electrons, like boron or gallium.' },
              ],
              explain: r`Five outer electrons means one spare electron per arsenic atom, so the silicon becomes **n-type** (the n stands for negative carriers).`,
            },
            {
              type: 'numeric',
              title: 'A little goes a long way',
              prompt: r`Silicon has about $5 \times 10^{22}$ atoms per cm³. If one atom in a million is replaced by phosphorus, each donating one free electron, how many free electrons per cm³ does that add? (In units of $10^{16}$.)`,
              unit: r`$\times 10^{16}$ per cm³`,
              answer: 5,
              wrong: [{ v: 0.5, why: r`$5 \times 10^{22} \div 10^6 = 5 \times 10^{16}$.` }, { v: 50, why: r`One in a million: divide by $10^6$, giving $5 \times 10^{16}$.` }],
              explain: r`$5 \times 10^{22} / 10^6 = 5 \times 10^{16}$ free electrons per cm³, about five million times more than pure silicon's roughly $10^{10}$. Doping with one atom in a million multiplies the conductivity millions of times: that's why chip factories need such extraordinary purity.`,
            },
            {
              type: 'numeric',
              title: 'Minority carriers',
              prompt: r`In silicon at room temperature, (free electrons per cm³) × (holes per cm³) $\approx 10^{20}$, however it is doped. (In pure silicon both are $10^{10}$.) An n-type crystal has $10^{16}$ free electrons per cm³. How many holes per cm³ does it have?`,
              unit: 'per cm³',
              answer: 1e4,
              relTol: 0.02,
              wrong: [{ v: 1e10, relTol: 0.02, why: r`That's pure silicon. With $10^{16}$ electrons, the product rule gives $10^{20} / 10^{16}$.` }, { v: 1e36, relTol: 0.02, why: r`Divide, don't multiply: holes $= 10^{20} / 10^{16}$.` }],
              explain: r`$10^{20} / 10^{16} = 10^4$ holes per cm³, a million times fewer than in pure silicon. The flood of extra electrons fills almost every hole. Electrons are the **majority carriers** here and holes the rare **minority carriers**, and the reverse in p-type silicon. Minority carriers turn out to matter a great deal in junctions and solar cells.`,
            },
            {
              type: 'interactive',
              title: 'A pinch of phosphorus',
              body: r`Pure silicon has only about $10^{10}$ free electrons per cm³. Each phosphorus atom adds one. Silicon has $5 \times 10^{22}$ atoms per cm³. Find the doping level that multiplies the free electrons by a **million**.`,
              widget: {
                kind: 'graph', xmin: 10, xmax: 19, ymin: 9, ymax: 19, grid: false, height: 260, axes: { xlabel: 'dopant atoms per cm³ (power of 10)', ylabel: 'free electrons per cm³ (power of 10)', xticks: 1, yticks: 2, xAt: 10, yAt: 9 },
                params: { x: { min: 10, max: 18, step: 0.5, value: 12, label: 'doping', color: 'coral', format: (v) => `$10^{${fix(v, 1)}}$ per cm³` } },
                curves: [{ f: (x) => { const N = 10 ** x; return Math.log10(N / 2 + Math.sqrt(N * N / 4 + 1e20)); }, color: 'violet', width: 3 }, { f: () => 10, color: 'muted', dash: true }],
                points: [{ x: (p) => p.x, y: (p) => { const N = 10 ** p.x; return Math.log10(N / 2 + Math.sqrt(N * N / 4 + 1e20)); }, color: 'coral' }],
                readout: (p) => { const N = 10 ** p.x, n = N / 2 + Math.sqrt(N * N / 4 + 1e20); return `free electrons ×**${(n / 1e10).toExponential(1)}** · one phosphorus per **${(5e22 / N).toExponential(1)}** silicon atoms`; },
                goal: (p) => p.x === 16,
                hint: 'A million times 10¹⁰ is 10¹⁶.',
                solution: { x: 16 },
              },
              explain: r`At $10^{16}$ phosphorus atoms per cm³, only **one atom in 5 million** is replaced, yet the free electrons, and so the conductivity, rise a millionfold. Below about $10^{10}$ the dopant makes no difference: the silicon’s own thermally freed electrons dominate.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Is doped silicon charged?',
              prompt: r`An n-type silicon crystal has lots of free electrons. Is the crystal as a whole negatively charged?`,
              choices: [
                { t: 'No: each phosphorus nucleus has one extra proton to balance its extra electron', ok: true },
                { t: 'Yes: it has extra electrons', why: 'The phosphorus atoms brought those electrons with them, along with matching protons.' },
                { t: 'It’s positively charged', why: 'Every atom added is neutral, so the crystal stays neutral overall.' },
              ],
              explain: r`Phosphorus atoms are neutral: 15 protons and 15 electrons. Doping adds **mobile** electrons, but each one is balanced by a fixed positive phosphorus ion. The crystal stays neutral. This becomes important at a junction, where mobile carriers move away and leave the fixed ions behind.`,
            },
          ],
          recap: [
            'n-type: 5-electron dopants (P, As) donate free electrons.',
            'p-type: 3-electron dopants (B, Ga) create holes.',
            'Doped crystals stay electrically neutral overall.',
          ],
        },
      ],
    },
    {
      title: 'Devices',
      summary: 'Junctions that do useful things.',
      lessons: [
        {
          id: 'diodes',
          title: 'Diodes',
          summary: 'One-way streets for current',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'The p–n junction',
              body: r`Join p-type and n-type silicon. Near the boundary, free electrons from the n side fill holes on the p side. This leaves a thin **depletion zone** with no free carriers, and the fixed ions left behind create an electric field across it.

- **Forward bias** (+ on the p side): the external voltage pushes against this barrier and shrinks it. Above about 0.6 V for silicon, current flows freely.
- **Reverse bias:** the barrier grows wider. Almost no current flows.

A **diode** is a one-way valve for current.`,
            },
            { /*anim:semiconductors*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Building the barrier',
              body: r`Left: p-type silicon, full of {blue:holes} (open circles), each balanced by a fixed negative ion (−). Right: n-type, full of free {coral:electrons} (dots), each balanced by a fixed positive ion (+). Watch the two sides meet.`,
              widget: {
                kind: 'graph', equal: true, xmin: -4.1, xmax: 4.1, ymin: -0.85, ymax: 3.35, grid: false, axes: false, maxWidth: 600,
                animate: { param: 't', speed: 1, max: 9, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const w = pnWidth(p.t), els = [];
                  els.push(s('rect', { x: plot.X(-4), y: plot.Y(3.2), width: plot.X(4) - plot.X(-4), height: plot.Y(0.15) - plot.Y(3.2), class: 'fl-surface', stroke: 'var(--line-2)' }));
                  if (w > 0.02) els.push(s('rect', { x: plot.X(-w), y: plot.Y(3.2), width: plot.X(w) - plot.X(-w), height: plot.Y(0.15) - plot.Y(3.2), class: 'fl-amber-soft' }));
                  els.push(s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(3.2), y2: plot.Y(0.15), stroke: 'var(--ink-3)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }));
                  for (const [x, y, ph] of PN_SITES) {
                    const pSide = x < 0, gone = Math.abs(x) < w;
                    // the fixed ion: a small minus on the p side, a small plus on the n side
                    els.push(s('path', { d: pSide ? `M${plot.X(x) - 4} ${plot.Y(y)}h8` : `M${plot.X(x) - 4} ${plot.Y(y)}h8M${plot.X(x)} ${plot.Y(y) - 4}v8`, stroke: gone ? 'var(--ink)' : 'var(--ink-3)', 'stroke-width': gone ? 2.5 : 1.3 }));
                    if (gone) continue;
                    const jx = 0.09 * Math.sin(3.1 * p.t + ph), jy = 0.09 * Math.cos(2.3 * p.t + 1.7 * ph);
                    els.push(s('circle', pSide ? { cx: plot.X(x + jx), cy: plot.Y(y + jy) - 9, r: 4.5, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2 } : { cx: plot.X(x + jx), cy: plot.Y(y + jy) - 9, r: 4.5, class: 'fl-coral' }));
                  }
                  // the built-in field points from the + ions to the − ions: right to left
                  if (w > 0.15) {
                    const y0 = -0.35, X0 = plot.X(w), X1 = plot.X(-w), Y = plot.Y(y0);
                    els.push(s('path', { d: `M${X0} ${Y}L${X1} ${Y}M${X1 + 9} ${Y - 5}L${X1} ${Y}L${X1 + 9} ${Y + 5}`, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
                  }
                  els.push(s('text', { x: plot.X(-2.4), y: plot.Y(-0.35) + 5, 'text-anchor': 'middle', class: 'tick', text: 'p-type' }));
                  els.push(s('text', { x: plot.X(2.4), y: plot.Y(-0.35) + 5, 'text-anchor': 'middle', class: 'tick', text: 'n-type' }));
                  return els;
                },
                readout: (p) => { const w = pnWidth(p.t), n = PN_SITES.filter(([x]) => Math.abs(x) < w).length; return w < 0.05 ? 'just joined' : `{amber:depletion zone}: ${n / 2} electrons have filled ${n / 2} holes · {violet:built-in field} ${fix((100 * w) / 1.4, 0)}% of its final strength`; },
              },
              after: r`Electrons near the boundary wander across and fill holes on the other side, and both carriers vanish. What they leave behind is a zone with no free carriers, only the fixed ions: negative on the p side, positive on the n side. Those charges set up an electric field that pushes back on any more electrons trying to cross, so the zone stops growing. This **depletion zone** is the diode's one-way barrier. A forward voltage squashes it so current flows; a reverse voltage widens it, and almost nothing gets through.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The diode curve',
              body: r`This is the current through a silicon diode as you change the voltage across it.`,
              widget: {
                kind: 'graph', xmin: -1, xmax: 0.8, ymin: -5, ymax: 50, grid: 0.2, gridY: 10, height: 320, axes: { xlabel: 'V (volts)', ylabel: 'I (mA)' },
                params: { V: { min: -1, max: 0.72, step: 0.02, value: 0.5, label: 'voltage', color: 'blue', format: (v) => `${v.toFixed(2)} V` } },
                curves: [{ f: (V) => diodeI(V), color: 'coral' }],
                points: [{ x: (p) => p.V, y: (p) => Math.min(55, diodeI(p.V)), color: 'blue' }],
                readout: (p) => {
                  const I = diodeI(p.V);
                  return I < 0 ? r`reverse bias: $I \approx 0$ (just $${(-I * 1e9).toFixed(1)}$ pA)` : r`$I = ${I < 0.01 ? I.toExponential(1) : f2(I)}$ mA`;
                },
              },
              after: r`Almost nothing flows until about 0.6 V, then the current shoots up **exponentially**: each extra 0.06 V multiplies it by about 10. In reverse, only a tiny leakage current trickles through.`,
            },
            {
              type: 'numeric',
              title: 'Ten times per 60 millivolts',
              prompt: r`A diode's current grows like $e^{V/0.026\text{ V}}$ in its forward direction. By roughly what factor does the current grow when the voltage rises by 60 mV? (Nearest whole number.)`,
              unit: '×',
              answer: Math.exp(0.06 / 0.026),
              tol: 0.6,
              wrong: [{ v: 2.3, tol: 0.1, why: r`That's the exponent, $\frac{0.06}{0.026}$. The factor is $e^{2.3}$.` }],
              explain: r`$e^{0.06/0.026} = e^{2.3} \approx 10$. So every extra 60 mV multiplies the current tenfold: that's why a diode's current seems to switch on suddenly near 0.6–0.7 V, and why a small change in voltage across an LED makes a big change in brightness.`,
            },
            {
              type: 'numeric',
              title: 'Double the current',
              prompt: r`A diode’s current rises tenfold for every 60 mV of extra forward voltage. How many millivolts more does it take to **double** the current? ($\log_{10} 2 \approx 0.301$.)`,
              unit: 'mV',
              answer: 60 * Math.log10(2),
              tol: 0.3,
              wrong: [{ v: 30, why: r`Doubling isn’t half of ×10. It’s 0.301 of a decade.` }],
              explain: r`$60 \times 0.301 \approx 18$ mV. That exponential sensitivity is why LEDs need a current-limiting resistor: a tiny change in voltage would otherwise cause a huge surge in current.`,
            },
            {
              type: 'numeric',
              title: 'Current through a diode',
              prompt: r`A silicon diode drops about 0.7 V when conducting. In series with a 1 kΩ resistor on a 5 V supply, how much current flows, in milliamps?`,
              unit: 'mA',
              answer: 4.3,
              tol: 0.01,
              explain: r`The resistor gets $5 - 0.7 = 4.3$ V, so $I = \frac{4.3}{1000} = 4.3$ mA. Treating the diode as a fixed 0.7 V drop is the standard first approximation.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Charging from the mains',
              prompt: r`Mains electricity is AC: it switches direction 50 or 60 times a second. A phone needs DC. What does a single diode do to AC?`,
              choices: [
                { t: 'It passes only the half of each cycle going one way, giving a bumpy one-way current', ok: true },
                { t: 'It turns AC into perfectly smooth DC', why: 'One diode just removes the reverse halves. Smoothing needs capacitors and more circuitry.' },
                { t: 'It blocks AC completely', why: 'It only blocks the half-cycles in the reverse direction.' },
              ],
              explain: r`A single diode is a **half-wave rectifier**: it chops off the reverse half-cycles. Four diodes in a **bridge** flip the reverse halves around instead, and capacitors smooth out the bumps. Every phone charger contains this circuit.`,
            },
          ],
          recap: [
            'A p–n junction forms a depletion zone with a built-in field.',
            'Forward bias above about 0.6 V conducts. Reverse bias blocks.',
            'Diodes rectify AC into one-way current.',
          ],
        },
        {
          id: 'leds',
          title: 'LEDs & Solar Cells',
          summary: 'Light in, light out',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Light from a junction',
              body: r`In a forward-biased junction, electrons drop from the conduction band into holes, releasing their energy. In some materials that energy comes out as a **photon** of light, with energy equal to the band gap. That's a **light-emitting diode** (LED).

Photon energy and wavelength are linked by $E = hc/\lambda$. A handy form:
$$\lambda\ (\text{nm}) \approx \frac{1240}{E\ (\text{eV})}$$`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Design a green LED',
              prompt: r`Choose a band gap that makes a **green** LED, around 530 nm.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4, grid: false, axes: false, height: 200,
                params: { E: { min: 1.2, max: 3.4, step: 0.05, value: 1.9, label: 'band gap', color: 'violet', format: (v) => `${v.toFixed(2)} eV` } },
                extra: ({ plot, p, s }) => {
                  const l = 1240 / p.E, c = wl2rgb(l);
                  return [
                    s('circle', { cx: plot.X(5), cy: plot.Y(2), r: 70, fill: c || 'var(--surface)', opacity: 0.25 }),
                    s('circle', { cx: plot.X(5), cy: plot.Y(2), r: 44, fill: c || 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3 }),
                    c ? null : s('text', { x: plot.X(5), y: plot.Y(2) + 6, 'text-anchor': 'middle', class: 'lbl', text: 'invisible' }),
                  ];
                },
                readout: (p) => r`$\lambda \approx \dfrac{1240}{${p.E.toFixed(2)}} = ${Math.round(1240 / p.E)}$ nm: **${colourName(1240 / p.E)}**`,
                goal: (p) => { const l = 1240 / p.E; return l >= 520 && l <= 545; },
                hint: r`Solve $1240 / E = 530$.`,
                solution: { E: 2.35 },
              },
              explain: r`$E = 1240 / 530 \approx 2.34$ eV. Real green LEDs use indium gallium nitride, tuned to around this band gap. Red LEDs need only about 1.9 eV and were invented first, in 1962. A bright, efficient **blue** LED, needing about 2.7 eV, took until the 1990s and won the 2014 Nobel Prize in Physics. It made white LED lighting possible.`,
            },
            {
              type: 'numeric',
              title: 'A TV remote',
              prompt: r`A TV remote control flashes an infrared LED at 940 nm. What band gap does its semiconductor need, in eV? (2 decimal places.)`,
              unit: 'eV',
              answer: 1240 / 940,
              tol: 0.01,
              wrong: [{ v: 1165600, relTol: 0.01, why: r`It's $1240 / \lambda$, not $1240 \times \lambda$.` }],
              explain: r`$E \approx 1240 / 940 \approx 1.32$ eV, below the roughly 1.65 eV of the reddest light we can see, so the flashes are invisible. Point a remote at a phone camera and press a button: the camera's silicon sensor, sensitive out to about 1100 nm, shows the flashes as a purple-white glow.`,
            },
            {
              type: 'numeric',
              title: 'A blue LED',
              prompt: r`A blue LED emits light at 450 nm. What band gap does its semiconductor need? ($E = 1240/\lambda$; 2 decimal places.)`,
              unit: 'eV',
              answer: 1240 / 450,
              tol: 0.01,
              explain: r`$\frac{1240}{450} \approx 2.76$ eV. Making efficient blue LEDs from gallium nitride took decades; Akasaki, Amano and Nakamura won the 2014 Nobel Prize in Physics for it, because blue made white LED lighting possible.`,
            },
            {
              type: 'numeric',
              title: 'Powering an LED',
              prompt: r`An LED drops 2 V and is run at 20 mA. How much power does it use, in milliwatts?`,
              unit: 'mW',
              answer: 40,
              explain: r`$2 \times 0.020 = 0.04$ W $= 40$ mW. A modern LED turns perhaps 40% of that into light, versus about 5% for an old filament bulb.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'One pure colour',
              prompt: r`A filament bulb glows in every colour at once, but a red LED gives out a narrow band of red. Why?`,
              choices: [
                { t: 'Every photon comes from an electron falling across the same band gap, so all photons have nearly the same energy', ok: true },
                { t: 'The LED has a red plastic filter that blocks the other colours', why: 'Some LED cases are tinted, but the light is created red: clear-cased LEDs glow in a single colour too.' },
                { t: 'LEDs run cooler, and cool things glow red', why: 'A cool glowing object would emit mostly infrared and a broad spread of colours. The LED’s colour is set by its band gap, not its temperature.' },
              ],
              explain: r`A hot filament emits a broad thermal spectrum, mostly as infrared heat. An LED's photons all come from the same jump, so they share nearly the same energy: a spread of only about 20–30 nm. "White" LEDs cheat: a blue LED shines on a yellow phosphor, and the mixture looks white to our eyes. Run the same junction in reverse, letting photons create the electrons, and you have a solar cell: the next lessons.`,
            },
          ],
          recap: [
            r`LED: photon energy ≈ band gap; $\lambda(\text{nm}) \approx 1240 / E(\text{eV})$.`,
            'Bigger gaps give bluer light. Blue LEDs enabled white LED lighting.',
            'An LED’s light is nearly one colour, because every photon crosses the same gap.',
          ],
        },
        {
          id: 'transistors',
          title: 'Transistors',
          summary: 'The switch that changed the world',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'A switch with no moving parts',
              body: r`A **transistor** lets a small signal control a larger current. The most common type today is the **MOSFET**:

- Current can flow between two terminals, the **source** and the **drain**, through a channel of silicon.
- A third terminal, the **gate**, sits above the channel, separated by a thin insulating layer.
- A voltage on the gate attracts charge carriers into the channel, turning it **on**. Remove the voltage and the channel switches **off**.

Used as on/off switches, transistors build the logic gates of the Digital Logic course. Used partly on, they **amplify**: a small change in gate voltage makes a large change in current.`,
            },
            {
              type: 'mcq',
              title: 'Amplifiers',
              prompt: r`A microphone produces a tiny wobbling voltage. How can a transistor make it loud enough to drive a speaker?`,
              choices: [
                { t: 'The tiny voltage on the gate controls a much bigger current drawn from a battery or power supply', ok: true },
                { t: 'The transistor creates energy', why: 'The extra energy comes from the power supply. The transistor just controls its flow.' },
                { t: 'It stores up the signal and releases it all at once', why: 'An amplifier works continuously: the output follows the input’s shape, only bigger.' },
              ],
              explain: r`It's like a small hand on a big water tap: the input signal controls the flow, and the power comes from the supply. The output current copies the input's shape at a much larger size. Before transistors, amplifiers used fragile, hot vacuum tubes.`,
            },
            {
              type: 'numeric',
              title: 'Current gain',
              prompt: r`A bipolar transistor has a current gain of 100: the current through it (collector current) is 100 times the small control current (base current). If the base current is 20 µA, what is the collector current, in mA?`,
              unit: 'mA',
              answer: 2,
              wrong: [{ v: 2000, why: 'That’s in µA. 2000 µA = 2 mA.' }, { v: 0.2, why: r`$100 \times 20$ µA $= 2000$ µA $= 2$ mA.` }],
              explain: r`$100 \times 20$ µA $= 2$ mA. A small signal controlling a big one is **amplification**: the first transistor radios and hearing aids used exactly this.`,
            },
            {
              type: 'mcq',
              title: 'Why chips use CMOS',
              prompt: r`Almost every chip is built from **CMOS** logic, in which each gate pairs an n-type and a p-type transistor so that one is always off. What's the big advantage?`,
              choices: [
                { t: 'When not switching, there is almost no path for current, so gates use power only when they change state', ok: true },
                { t: 'It makes transistors bigger and easier to manufacture', why: 'CMOS transistors are tiny. The advantage is that one of each pair is always off, blocking steady current.' },
                { t: 'It lets chips run without any power supply', why: 'Chips still need power, mostly when switching.' },
              ],
              explain: r`In a CMOS inverter, the output connects either to the supply through a p-type transistor or to ground through an n-type one, never both. In a steady state, no current flows straight through. That's how billions of transistors can share a phone battery. (Heat still comes from switching, which is why chips get hot when working hard.)`,
            },
            {
              type: 'interactive',
              title: 'Moore’s law',
              body: r`In 1971 the first microprocessor had 2,300 transistors. Gordon Moore’s rule: the count **doubles every two years**. The dots are real chips. Find the first year the rule predicts more than **10 billion** transistors.`,
              widget: {
                kind: 'graph', xmin: 1970, xmax: 2025, ymin: 3, ymax: 11, grid: false, height: 280, axes: { xlabel: 'year', ylabel: 'transistors (power of 10)', xticks: 10, yticks: 1, xAt: 1970, yAt: 3 },
                params: { y: { min: 1971, max: 2025, step: 1, value: 1990, label: 'year', color: 'coral', format: (v) => String(v) } },
                curves: [{ f: (x) => Math.log10(2300) + ((x - 1971) / 2) * Math.log10(2), color: 'violet', width: 3 }, { f: () => 10, color: 'teal', dash: true }],
                points: [{ x: (p) => p.y, y: (p) => Math.log10(2300) + ((p.y - 1971) / 2) * Math.log10(2), color: 'coral' }],
                extra: ({ plot, s }) => [[1971, 2300], [1978, 29000], [1989, 1.2e6], [1993, 3.1e6], [2000, 4.2e7], [2008, 7.3e8], [2012, 1.4e9], [2017, 1.9e10], [2020, 1.6e10], [2023, 1.3e11]].map(([x, n]) => s('circle', { cx: plot.X(x), cy: plot.Y(Math.log10(n)), r: 5, class: 'fl-amber' })),
                readout: (p) => { const n = 2300 * 2 ** ((p.y - 1971) / 2); return `${p.y}: rule predicts **${n >= 1e9 ? (n / 1e9).toFixed(1) + ' billion' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' million' : Math.round(n).toLocaleString('en-US')}** transistors`; },
                goal: (p) => p.y === 2016,
                hint: 'You need about 22 doublings: 2300 × 2²² ≈ 9.6 billion is just short.',
                solution: { y: 2016 },
              },
              explain: r`Twenty-two doublings (44 years, 2015) give 9.6 billion; by **2016** the rule passes 10 billion. Real chips (amber dots) tracked the rule remarkably well for half a century. A straight line on this log scale means exponential growth: a factor of a million every 40 years.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Tiny switches',
              prompt: r`The first transistor (Bell Labs, 1947) was about a centimetre across. Modern transistors have features around 20 nm across. Roughly how many times smaller is that, in length?`,
              unit: '×',
              answer: 0.01 / 20e-9,
              relTol: 0.05,
              wrong: [{ v: 2000, why: r`1 cm $= 10^{-2}$ m and 20 nm $= 2 \times 10^{-8}$ m: the ratio is $5 \times 10^5$.` }, { v: 50000000, why: r`Check the powers of ten: $\frac{10^{-2}}{2 \times 10^{-8}} = 5 \times 10^5$.` }],
              explain: r`$\dfrac{10^{-2}\ \text{m}}{2 \times 10^{-8}\ \text{m}} = 500{,}000$ times smaller in length, and about $2.5 \times 10^{11}$ times smaller in area. That's why billions of transistors fit on a chip the size of a fingernail. John Bardeen, Walter Brattain and William Shockley shared the 1956 Nobel Prize for inventing the transistor.`,
            },
          ],
          recap: [
            'A MOSFET’s gate voltage switches a channel between source and drain on or off.',
            'Transistors act as switches (logic) or amplifiers (signals).',
            'Shrinking transistors put billions on a single chip.',
          ],
        },
      ],
    },
    {
      title: 'Power and Progress',
      summary: 'Solar cells and the march of the transistor.',
      lessons: [
        {
          id: 'solar',
          title: 'Solar Cells',
          summary: 'Finding the maximum power point',
          icon: 'sun',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'A diode in sunlight',
              prompt: 'A solar cell is a large p–n junction. When sunlight hits it, what makes a current flow?',
              choices: [
                { t: 'Photons free electron–hole pairs, and the junction’s built-in field sweeps electrons one way and holes the other', ok: true },
                { t: 'The light heats the cell, and heat makes current', why: 'Heat actually lowers a solar cell’s output. The current comes from photons freeing charges.' },
                { t: 'Sunlight contains electric current', why: 'Light carries energy in photons; the cell turns that energy into separated charges.' },
              ],
              explain: r`A photon with more energy than the band gap lifts an electron into the conduction band, leaving a hole. Near the junction, the built-in electric field drives the electron to the n side and the hole to the p side. Connect a wire and they flow round to meet again: a current driven by light, the **photovoltaic effect**.`,
            },
            {
              type: 'interactive',
              title: 'The maximum power point',
              body: r`The blue curve is the cell's current at each voltage; the amber curve is the power, $P = IV$. Short-circuited (0 V) the current is large but no power is delivered; open-circuited (0.62 V) there's voltage but no current. Choose the operating voltage that delivers the **most power**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 0.7, ymin: 0, ymax: 3.4, grid: false, height: 300, axes: { xlabel: 'voltage (V)', ylabel: 'A / W', xticks: 0.1, yticks: 0.5, xfmt: (v) => v.toFixed(1) },
                params: { V: { min: 0, max: 0.62, step: 0.01, value: 0.3, label: 'operating voltage', color: 'violet', format: (v) => `${v.toFixed(2)} V` } },
                curves: [{ f: (v) => cellI(v), to: 0.62, color: 'blue', width: 3, n: 400 }, { f: (v) => v * cellI(v), to: 0.62, color: 'amber', width: 3, n: 400 }],
                points: [{ x: (p) => p.V, y: (p) => cellI(p.V), color: 'blue' }, { x: (p) => p.V, y: (p) => p.V * cellI(p.V), color: 'amber' }],
                readout: (p) => `Current **${cellI(p.V).toFixed(2)} A** × voltage **${p.V.toFixed(2)} V** = power **${(p.V * cellI(p.V)).toFixed(3)} W** (best possible ${PMAX.toFixed(3)} W)`,
                goal: (p) => p.V * cellI(p.V) >= 0.99 * PMAX,
                hint: 'The power peaks just before the current starts to plunge.',
                solution: { V: 0.54 },
              },
              explain: r`The power peaks at about 0.54 V, where the current is still close to its maximum but the voltage is nearly at its highest: about 1.55 W from this cell. Solar inverters constantly hunt for this **maximum power point**, because it shifts as the sunlight and temperature change.`,
            },
            {
              type: 'numeric',
              title: 'Efficiency',
              prompt: r`A 1.6 m² solar panel in full sunlight (1000 W/m²) delivers 340 W. What is its efficiency, as a percentage? (Nearest whole number.)`,
              unit: '%',
              answer: (340 / 1600) * 100,
              tol: 0.6,
              wrong: [{ v: 34, why: 'The panel receives 1.6 × 1000 = 1600 W of sunlight, not 1000 W.' }, { v: 4.7, tol: 0.1, why: 'Divide the output by the input: 340 ÷ 1600.' }],
              explain: r`$\frac{340}{1600} \approx 21\%$, typical of today's silicon panels. The rest of the sunlight's energy is reflected, passes through, or ends up as heat.`,
            },
            {
              type: 'mcq',
              title: 'Why not 100%?',
              prompt: r`Even a perfect single-junction silicon cell can't convert more than about a third of sunlight into electricity. Why?`,
              choices: [
                { t: 'Photons below the band gap aren’t absorbed, and the extra energy of photons above it is lost as heat', ok: true },
                { t: 'Silicon reflects two-thirds of all light', why: 'Anti-reflection coatings cut reflection to a few per cent. The real limit is the band gap.' },
                { t: 'Electricity always loses two-thirds in wires', why: 'Wiring losses are small. The fundamental limit comes from how photons interact with the band gap.' },
              ],
              explain: r`Infrared photons with less than 1.1 eV pass straight through. A blue photon with 3 eV still produces just one electron–hole pair, and the extra 1.9 eV becomes heat. Balancing these losses gives the **Shockley–Queisser limit**, about 33% for a single junction. Stacking cells with different band gaps (multi-junction cells, used on satellites) has reached over 47%.`,
            },
            {
              type: 'numeric',
              title: 'Fill factor',
              prompt: r`A solar cell has open-circuit voltage 0.6 V and short-circuit current 3 A, but its best operating point delivers only 1.4 W. Its **fill factor** is the maximum power divided by $V_{oc}I_{sc}$. What is it? (2 decimal places.)`,
              answer: 1.4 / 1.8,
              tol: 0.01,
              explain: r`$\frac{1.4}{0.6 \times 3} \approx 0.78$. The current–voltage curve has a rounded "knee", so you can never have the full voltage and full current at once.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'A rooftop’s worth',
              prompt: r`A house uses about 3,500 kWh of electricity per year. Its panels receive the equivalent of about 1,000 hours of full sunlight a year, and each square metre of panel gives 200 W in full sunlight. How many square metres of panels would cover the house's yearly use?`,
              unit: 'm²',
              answer: 3500000 / (1000 * 200),
              tol: 0.3,
              wrong: [{ v: 3.5, tol: 0.1, why: 'Each m² gives 200 W × 1000 h = 200 kWh per year. Divide 3500 by 200.' }, { v: 17500, tol: 10, why: 'Check the units: 3500 kWh is 3,500,000 Wh.' }],
              hint: r`Each square metre gives $200 \text{ W} \times 1000 \text{ h} = 200$ kWh per year.`,
              explain: r`Each m² gives 200 kWh a year, so $\frac{3500}{200} = 17.5$ m², about ten typical panels, fitting on many rooftops. In sunnier places (2000 hours of full-sun equivalent) half that area would do.`,
            },
          ],
          recap: [
            'Solar cells separate light-made electron–hole pairs with a junction’s built-in field.',
            'Power peaks at the maximum power point, below the open-circuit voltage.',
            'Band-gap physics limits single-junction cells to about 33%; real panels reach about 20–23%.',
          ],
        },
        {
          id: 'moore',
          title: 'Moore’s Law',
          summary: 'Fifty years of doubling',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Gordon Moore’s guess',
              prompt: r`In 1965, Gordon Moore (later a founder of Intel) noticed that the number of transistors on a chip was doubling at a regular pace. In 1975 he revised his prediction to doubling about every two years. Over 50 years, how many doublings is that?`,
              choices: [
                { t: '25 doublings, a factor of about 33 million', ok: true },
                { t: '25 doublings, a factor of 50', why: r`25 doublings multiply by $2^{25}$, not by $25 \times 2$.` },
                { t: '100 doublings', why: 'Doubling every two years for 50 years is 50 ÷ 2 = 25 doublings.' },
              ],
              explain: r`$2^{25} \approx 3.4 \times 10^7$. No other technology has improved this steadily for this long. Let's test the claim against real chips.`,
            },
            {
              type: 'interactive',
              title: 'Fit the doubling time',
              body: r`Dots show the transistor counts of landmark chips (on a logarithmic scale, so steady doubling makes a straight line). The line starts from Intel's first microprocessor, the 4004 (1971), and doubles at the rate you choose. Find the doubling time that fits the data best.`,
              widget: {
                kind: 'graph', xmin: 1968, xmax: 2026, ymin: 3, ymax: 11.5, grid: false, height: 320, padL: 52, axes: { xlabel: 'year', ylabel: 'transistors', xticks: 10, yticks: 1, xAt: 1968, yAt: 3, xfmt: (v) => String(v), yfmt: (v) => `10${['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰', '¹¹'][Math.round(v)] ?? ''}` },
                params: { T: { min: 1, max: 4, step: 0.1, value: 3, label: 'doubling time', color: 'coral', format: (v) => `${v.toFixed(1)} years` } },
                curves: [{ f: (y, p) => Math.log10(2300) + ((y - 1971) / p.T) * Math.log10(2), from: 1971, color: 'coral', width: 2.5 }],
                extra: ({ plot, s }) => CHIPS.flatMap(([y, n, name]) => [s('circle', { cx: plot.X(y), cy: plot.Y(Math.log10(n)), r: 5, class: 'fl-blue' }), s('text', { x: plot.X(y) + 7, y: plot.Y(Math.log10(n)) + 13, class: 'tick', text: name })]),
                readout: (p) => { const err = Math.sqrt(CHIPS.reduce((s, [y, n]) => s + (Math.log10(n) - Math.log10(2300) - ((y - 1971) / p.T) * Math.log10(2)) ** 2, 0) / CHIPS.length); return `Typical miss: a factor of **${(10 ** err).toFixed(1)}**`; },
                goal: (p) => p.T >= 1.9 && p.T <= 2.3,
                hint: 'From 2,300 transistors in 1971 to over 100 billion in 2023 is about 26 doublings in 52 years.',
                solution: { T: 2.1 },
              },
              explain: r`A doubling time of about 2 years fits half a century of chips, from 2,300 transistors to over 100 billion: about 26 doublings. The straight line on a logarithmic plot is the signature of exponential growth.`,
            },
            {
              type: 'numeric',
              title: 'Shrinking transistors',
              prompt: r`If the number of transistors on a chip of the same size doubles, each transistor must take up half the area. By what factor must its width shrink? (3 decimal places.)`,
              answer: 1 / Math.SQRT2,
              tol: 0.001,
              wrong: [{ v: 0.5, why: r`Area goes as width squared, so halving the area shrinks the width by $\frac{1}{\sqrt2}$.` }],
              explain: r`Half the area means $\frac{1}{\sqrt2} \approx 0.707$ of the width: about 30% narrower every two years. Today's smallest features are only a few dozen atoms across, which is why Moore's law has slowed and chips now grow by stacking transistors in 3D and packaging several chips together.`,
            },
            {
              type: 'mcq',
              title: 'Limits',
              prompt: 'Why can’t transistors keep shrinking forever?',
              choices: [
                { t: 'At a few nanometres, electrons tunnel through barriers that should block them, and you run out of atoms', ok: true },
                { t: 'Smaller transistors are always slower', why: 'Smaller transistors have generally been faster. The problems are quantum leakage and atomic size.' },
                { t: 'Silicon becomes radioactive when small', why: 'Size doesn’t make silicon radioactive. Quantum tunnelling and the size of atoms are the real limits.' },
              ],
              explain: r`A silicon atom is about 0.2 nm across, so a 5 nm feature is only about 25 atoms wide. At that scale electrons **tunnel** through thin insulating layers (a quantum effect from the Quantum Physics course), leaking current and heat. Engineers keep finding clever workarounds, from 3D "gate-all-around" transistors to stacked chips.`,
            },
            {
              type: 'numeric',
              title: 'Shrinking features',
              prompt: r`If the area of a transistor halves every 2 years, its linear size shrinks by $\sqrt2$ every 2 years. By what factor does the linear size shrink in 10 years? (2 decimal places.)`,
              answer: Math.pow(2, 2.5),
              tol: 0.01,
              explain: r`Five halvings of area: linear size shrinks by $\sqrt{2}^5 = 2^{2.5} \approx 5.66$. Over 50 years that compounding took features from about 10 µm to a few tens of nanometres.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Predict a chip',
              prompt: r`Starting from 2,300 transistors in 1971 and doubling every 2 years, how many transistors would you predict for 2021, in billions? (1 decimal place.)`,
              unit: 'billion',
              answer: (2300 * 2 ** 25) / 1e9,
              tol: 0.1,
              wrong: [{ v: (2300 * 2 ** 50) / 1e9, relTol: 0.05, why: '50 years at one doubling every 2 years is 25 doublings, not 50.' }, { v: (2300 * 25 * 2) / 1e9, tol: 0.001, why: r`Doubling multiplies: $2300 \times 2^{25}$.` }],
              hint: r`$2^{25} = 33{,}554{,}432$.`,
              explain: r`$2300 \times 2^{25} \approx 7.7 \times 10^{10}$, about 77 billion. The biggest chips of the early 2020s held tens of billions (Apple's M1 Max had 57 billion), so the prediction is in the right ballpark after 50 years, a remarkable run for a prediction made with a handful of data points.`,
            },
          ],
          recap: [
            'Moore’s law: transistor counts doubled about every two years for half a century.',
            'Exponential growth appears as a straight line on a logarithmic scale.',
            'Shrinking now faces atomic and quantum limits; progress continues through 3D designs.',
          ],
        },
      ],
    },
  ],
};
