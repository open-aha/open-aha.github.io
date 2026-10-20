import { fix } from '../lib/svg.js';
import { r, FS } from './_chem.js';

// standard reduction potentials (V) for M^n+ + n e- → M
const METALS = [
  ['Mg', -2.37, 2, '#9aa3ad'],
  ['Zn', -0.76, 2, '#8c9aa6'],
  ['Fe', -0.44, 2, '#6b6f73'],
  ['Pb', -0.13, 2, '#5d6470'],
  ['Cu', 0.34, 2, '#c8743f'],
  ['Ag', 0.8, 1, '#c9ccd1'],
];
const ion = (i) => `${METALS[i][0]}${METALS[i][2] === 1 ? '⁺' : '²⁺'}`;
const F = 96485;

// ---------- a galvanic cell: two beakers, a salt bridge, a voltmeter ----------
function cell({ a0 = 1, c0 = 1, fixed = false, conc = false, goal, solution, readout } = {}) {
  const params = {
    a: { min: 0, max: 5, step: 1, value: a0, label: 'Left metal', format: (v) => METALS[v][0], slider: !fixed },
    c: { min: 0, max: 5, step: 1, value: c0, label: 'Right metal', color: 'coral', format: (v) => METALS[v][0], slider: !fixed },
  };
  if (conc) {
    params.la = { min: -3, max: 0, step: 0.1, value: 0, label: 'Left ions', color: 'teal', format: (v) => `${fix(10 ** v, 3)} M` };
    params.lc = { min: -3, max: 0, step: 0.1, value: 0, label: 'Right ions', color: 'teal', format: (v) => `${fix(10 ** v, 3)} M` };
  }
  const volts = (p) => {
    const E0 = METALS[p.c][1] - METALS[p.a][1];
    if (!conc) return E0;
    const n = 2; // both ions in the concentration examples are 2+
    return E0 - (0.0592 / n) * ((p.la ?? 0) - (p.lc ?? 0));
  };
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: -0.8, ymax: 6, grid: false, axes: false, height: 330,
    params, stackSliders: conc,
    animate: { param: 't', speed: 1, max: 600, autoplay: true, controls: false },
    extra: ({ plot, p, s }) => {
      const V = volts(p), out = [];
      const beaker = (x0, metal, label) => {
        const L = plot.X(x0), R = plot.X(x0 + 3), T = plot.Y(3.2), B = plot.Y(0.3);
        out.push(s('rect', { x: L, y: plot.Y(2.4), width: R - L, height: B - plot.Y(2.4), fill: 'var(--blue)', 'fill-opacity': 0.12 }));
        out.push(s('path', { d: `M${L} ${T}V${B}H${R}V${T}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
        out.push(s('rect', { x: plot.X(x0 + 1.2), y: plot.Y(4.4), width: plot.X(0.6) - plot.X(0), height: plot.Y(0.9) - plot.Y(4.4), rx: 3, style: `fill:${METALS[metal][3]}`, stroke: 'var(--ink-2)', 'stroke-width': 1.5 }));
        out.push(s('text', { x: plot.X(x0 + 1.5), y: plot.Y(-0.4), 'text-anchor': 'middle', class: 'lbl', style: FS(14), text: label }));
      };
      beaker(0.5, p.a, `${METALS[p.a][0]} in ${ion(p.a)}`);
      beaker(6.5, p.c, `${METALS[p.c][0]} in ${ion(p.c)}`);
      // salt bridge
      out.push(s('path', { d: `M${plot.X(2.9)} ${plot.Y(1.6)}V${plot.Y(3.7)}H${plot.X(7.1)}V${plot.Y(1.6)}`, fill: 'none', stroke: 'var(--teal)', 'stroke-opacity': 0.45, 'stroke-width': 14, 'stroke-linejoin': 'round' }));
      out.push(s('text', { x: plot.X(5), y: plot.Y(3.7) + 28, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--teal);${FS(12)}`, text: 'salt bridge' }));
      // wire and meter
      const wy = plot.Y(5.4);
      out.push(s('path', { d: `M${plot.X(2)} ${plot.Y(4.4)}V${wy}H${plot.X(8)}V${plot.Y(4.4)}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      // electrons drift from the metal that is oxidised (lower potential) to the other
      if (Math.abs(V) > 0.005) {
        const pathPts = [[plot.X(2), plot.Y(4.4)], [plot.X(2), wy], [plot.X(8), wy], [plot.X(8), plot.Y(4.4)]];
        const lens = [wy - plot.Y(4.4), plot.X(8) - plot.X(2), plot.Y(4.4) - wy].map(Math.abs), tot = lens.reduce((a, b) => a + b, 0);
        for (let k = 0; k < 9; k++) {
          let d = ((((p.t * 60 * Math.min(1, Math.abs(V)) + (k * tot) / 9) % tot) + tot) % tot);
          if (V < 0) d = tot - d;
          let seg = 0;
          while (seg < 2 && d > lens[seg]) { d -= lens[seg]; seg++; }
          const [x1, y1] = pathPts[seg], [x2, y2] = pathPts[seg + 1], f = d / lens[seg];
          out.push(s('circle', { cx: x1 + (x2 - x1) * f, cy: y1 + (y2 - y1) * f, r: 5, fill: 'var(--blue)' }));
        }
      }
      out.push(s('rect', { x: plot.X(4.1), y: wy - 22, width: plot.X(1.8) - plot.X(0), height: 44, rx: 10, fill: 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      out.push(s('text', { x: plot.X(5), y: wy + 7, 'text-anchor': 'middle', class: 'lbl', style: FS(17), text: `${V < 0 ? '−' : ''}${fix(Math.abs(V), 2)} V` }));
      return out;
    },
    readout: readout || ((p) => {
      const V = volts(p);
      if (p.a === p.c && !conc) return 'Same metal on both sides: no voltage.';
      const neg = V < 0 ? p.c : p.a, pos = V < 0 ? p.a : p.c;
      return `${METALS[neg][0]} is oxidised (−), ${ion(pos)} is reduced (+) · cell voltage **${fix(Math.abs(V), 2)} V**`;
    }),
    goal, solution,
  };
}

// ---------- balancing a half-equation: MnO4- + x H+ + y e- → Mn2+ + z H2O ----------
function permanganate() {
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4, grid: false, axes: false, height: 220, stackSliders: true,
    params: {
      x: { min: 0, max: 10, step: 1, value: 1, label: 'H⁺', color: 'blue' },
      y: { min: 0, max: 8, step: 1, value: 1, label: 'electrons', color: 'violet' },
      z: { min: 0, max: 6, step: 1, value: 1, label: 'H₂O', color: 'teal' },
    },
    extra: ({ plot, p, s }) => {
      const rows = [['O', 4, p.z], ['H', p.x, 2 * p.z], ['charge', -1 + p.x - p.y, 2]];
      const out = [s('text', { x: plot.X(5), y: plot.Y(3.3), 'text-anchor': 'middle', class: 'lbl', style: FS(19), text: `MnO₄⁻ + ${p.x} H⁺ + ${p.y} e⁻  →  Mn²⁺ + ${p.z} H₂O` })];
      rows.forEach(([n, L, R], k) => {
        const ok = L === R, y = plot.Y(2.2 - k * 0.75);
        out.push(s('text', { x: plot.X(3.2), y, 'text-anchor': 'end', class: 'lbl', style: FS(15), text: n }));
        out.push(s('text', { x: plot.X(4.4), y, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: `${L > 0 && n === 'charge' ? '+' : ''}${L}` }));
        out.push(s('text', { x: plot.X(5.4), y, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(${ok ? '--success' : '--error'});${FS(15)}`, text: ok ? '=' : '≠' }));
        out.push(s('text', { x: plot.X(6.4), y, 'text-anchor': 'middle', class: 'lbl', style: FS(15), text: `${R > 0 && n === 'charge' ? '+' : ''}${R}` }));
      });
      return out;
    },
    readout: (p) => (p.z === 4 && p.x === 8 && p.y === 5 ? 'Oxygen, hydrogen and charge all balance ✓' : 'Balance oxygen with water, hydrogen with H⁺, then charge with electrons.'),
    goal: (p) => {
      if (p.z !== 4) return { ok: false, msg: 'Four oxygens on the left must end up in water molecules.' };
      if (p.x !== 2 * p.z) return { ok: false, msg: 'Count hydrogens: each water needs two, all from H⁺.' };
      if (-1 + p.x - p.y !== 2) return { ok: false, msg: 'Now balance the charge with electrons: the right side is +2.' };
      return true;
    },
    solution: { x: 8, y: 5, z: 4 },
  };
}

// ---------- the reactivity series in a test tube ----------
function displacement({ goal, solution, m0 = 1, s0 = 4 } = {}) {
  return {
    kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 240,
    params: {
      m: { min: 0, max: 5, step: 1, value: m0, label: 'Metal strip', format: (v) => METALS[v][0] },
      sol: { min: 0, max: 5, step: 1, value: s0, label: 'Solution of', color: 'teal', format: (v) => ion(v) },
    },
    extra: ({ plot, p, s }) => {
      const react = METALS[p.sol][1] > METALS[p.m][1];
      const x0 = plot.X(4.2), x1 = plot.X(5.8), top = plot.Y(4.7), bot = plot.Y(0.4), mid = plot.Y(3.2);
      const tint = p.sol === 4 ? '#7fb2e5' : 'var(--blue)';
      const out = [s('path', { d: `M${x0} ${mid}V${bot - 24}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 24}V${mid}Z`, style: `fill:${tint}`, 'fill-opacity': p.sol === 4 ? 0.6 : 0.14 })];
      out.push(s('rect', { x: plot.X(4.75), y: plot.Y(4.9), width: plot.X(0.5) - plot.X(0), height: plot.Y(0.9) - plot.Y(4.9), rx: 3, style: `fill:${METALS[p.m][3]}` }));
      if (react) for (let k = 0; k < 14; k++) out.push(s('circle', { cx: plot.X(4.75) + ((k * 41) % 100) / 100 * (plot.X(0.5) - plot.X(0)), cy: plot.Y(1.0 + ((k * 23) % 100) / 100 * 2.1), r: 4 + (k % 3), style: `fill:${METALS[p.sol][3]}`, stroke: 'var(--ink-3)', 'stroke-width': 0.8 }));
      out.push(s('path', { d: `M${x0} ${top}V${bot - 24}A${(x1 - x0) / 2} ${(x1 - x0) / 2} 0 0 0 ${x1} ${bot - 24}V${top}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
      return out;
    },
    readout: (p) => (p.m === p.sol ? 'A metal in a solution of its own ions: nothing happens.' : METALS[p.sol][1] > METALS[p.m][1] ? `**Reaction:** ${METALS[p.m][0]} dissolves and ${METALS[p.sol][0]} coats the strip` : '**No reaction**'),
    goal, solution,
  };
}

// ---------- a Hofmann voltameter: every 4 electrons make 2 H2 at the − electrode and 1 O2 at the + one ----------
const hofN = (t) => 4 * Math.floor(Math.max(0, t - 0.5) * 3); // electrons passed (counted in molecules' worth)

// ---------- Evans's water drop: iron dissolves under the oxygen-poor middle, oxygen is used at the airy rim ----------
const DROP_SM = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const dropTop = (x) => 1.3 + 2.4 * Math.sqrt(Math.max(0, 1 - ((x - 5) / 3.6) ** 2)); // the drop's surface

// ---------- a proton-exchange-membrane fuel cell: protons through the membrane, electrons round the circuit ----------
// a point a fraction f of the way along a polyline
const fcAlong = (pts, f) => {
  const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = segs.reduce((a, b) => a + b, 0);
  let d = f * tot, i = 0;
  while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
  const g = d / segs[i];
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * g, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * g];
};

export default {
  id: 'electrochem',
  subject: 'physics',
  title: 'Electrochemistry & Batteries',
  level: 'Intermediate',
  cover: 'electrochem',
  tagline: 'Redox, the reactivity series, cells you can build, electrolysis, batteries and rust.',
  description: r`Whenever electrons move from one substance to another, you can make them do work on the way. Track electrons with oxidation numbers and balance half-equations, race metals against each other's ions, then build galvanic cells from pairs of metals and read their voltage, stack them into batteries and see how concentration shifts the voltage. Run the process backwards to plate copper and make aluminium, look inside a lithium-ion cell, and save a ship's hull from rust.`,
  prereq: 'Chemical Reactions, and Electricity & Circuits',
  chapters: [
    {
      title: 'Moving Electrons',
      summary: 'Redox and reactivity.',
      lessons: [
        {
          id: 'redox',
          title: 'Electron Transfer',
          summary: 'Oxidation and reduction',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Losing and gaining',
              body: r`Drop a zinc strip into blue copper sulfate solution and it turns black with copper while the blue fades:
$$\mathrm{Zn + Cu^{2+} \to Zn^{2+} + Cu}$$
Two electrons pass from each zinc atom to a copper ion. Losing electrons is **oxidation**; gaining them is **reduction**. They always happen together, so these are called **redox** reactions. A memory aid: **OIL RIG**, Oxidation Is Loss, Reduction Is Gain.`,
            },
            {
              type: 'mcq',
              title: 'Who is oxidised?',
              prompt: r`In $\mathrm{Zn + Cu^{2+} \to Zn^{2+} + Cu}$, which species is oxidised?`,
              choices: [
                { t: 'Zinc', ok: true },
                { t: r`$\mathrm{Cu^{2+}}$`, why: 'Copper ions gain electrons: that’s reduction.' },
                { t: 'Both', why: 'One loses, the other gains.' },
              ],
              explain: r`Zinc loses two electrons (oxidised) and copper ions gain them (reduced). Zinc is the **reducing agent** (it causes the reduction), $\mathrm{Cu^{2+}}$ the **oxidising agent**.`,
            },
            {
              type: 'explain',
              title: 'Oxidation numbers',
              body: r`For molecules, chemists track electrons with **oxidation numbers**: pretend every bond is ionic, giving the shared electrons to the more electronegative atom. Rules of thumb:
- free elements: 0; simple ions: their charge,
- oxygen is usually −2, hydrogen +1 (with non-metals),
- the numbers add up to the overall charge.

An increase in oxidation number is oxidation; a decrease is reduction.`,
            },
            {
              type: 'numeric',
              title: 'Manganese in permanganate',
              prompt: r`What is the oxidation number of manganese in the permanganate ion, $\mathrm{MnO_4^-}$?`,
              answer: 7,
              wrong: [{ v: -7, why: 'Four oxygens give −8; the ion is −1 overall, so Mn must be +7.' }, { v: 8, why: 'The total must be −1, not 0.' }],
              explain: r`$x + 4(-2) = -1$, so $x = +7$, manganese's highest oxidation state. That's why permanganate is such a powerful oxidising agent: manganese is hungry for electrons.`,
            },
            {
              type: 'interactive',
              title: 'Balance a half-equation',
              prompt: r`In acid, purple permanganate is reduced to colourless $\mathrm{Mn^{2+}}$. Balance the half-equation: oxygen first (with water), then hydrogen (with $\mathrm{H^+}$), then charge (with electrons).`,
              widget: permanganate(),
              explain: r`$\mathrm{MnO_4^- + 8H^+ + 5e^- \to Mn^{2+} + 4H_2O}$. Five electrons: manganese goes from +7 to +2. This disappearing purple is a handy built-in indicator in titrations.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Sulfur in sulfuric acid',
              prompt: r`What is the oxidation number of sulfur in $\mathrm{H_2SO_4}$?`,
              answer: 6,
              wrong: [{ v: -2, why: 'That’s sulfur in H₂S. Here it’s bonded to four oxygens.' }],
              explain: r`$2(+1) + x + 4(-2) = 0$, so $x = +6$. Sulfur ranges from −2 in hydrogen sulfide to +6 here: oxidation numbers track how much of an atom's electron share has been pulled away.`,
            },
          ],
          recap: [
            'Oxidation is loss of electrons, reduction is gain (OIL RIG); they come together.',
            'Oxidation numbers track electrons; they add up to the overall charge.',
            'Balance half-equations: O with H₂O, H with H⁺, charge with e⁻.',
          ],
        },
        {
          id: 'activity',
          title: 'The Reactivity Series',
          summary: 'Which metal wins the electrons',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'A league table of metals',
              body: r`Put a metal into a solution of another metal's ions. If the metal in the strip gives up electrons more readily, it dissolves and the other metal comes out of solution. Try some pairs:`,
              widget: displacement({}),
            },
            {
              type: 'interactive',
              title: 'Silver crystals',
              prompt: r`Pick a strip and a solution that make crystals of **silver** grow on the strip.`,
              widget: displacement({ m0: 4, s0: 1, goal: (p) => (p.sol === 5 && p.m !== 5 ? true : { ok: false, msg: p.sol !== 5 ? 'To grow silver, the solution must contain silver ions.' : 'A silver strip in silver ions does nothing.' }), solution: { m: 4, sol: 5 } }),
              explain: r`Any metal more reactive than silver, in silver nitrate solution. Copper wire in silver nitrate grows a beautiful "silver tree" of crystals while the solution turns blue with $\mathrm{Cu^{2+}}$.`,
            },
            {
              type: 'order',
              title: 'Build the series',
              prompt: 'Observations: zinc displaces iron; iron displaces copper; copper displaces silver; magnesium displaces zinc. Order the metals, most reactive first.',
              items: ['Magnesium', 'Zinc', 'Iron', 'Copper', 'Silver'],
              explain: r`Each metal displaces those below it. The same order shows up everywhere: magnesium burns brilliantly, iron rusts, copper tarnishes slowly, silver barely at all, and gold not at all.`,
            },
            {
              type: 'mcq',
              title: 'Coins in vinegar',
              prompt: 'Which metal would fizz, giving off hydrogen, in dilute acid?',
              choices: [
                { t: 'Zinc', ok: true },
                { t: 'Copper', why: 'Copper is below hydrogen in the series: it can’t push H⁺ to become H₂.' },
                { t: 'Silver', why: 'Silver is even less reactive than copper.' },
              ],
              explain: r`Metals above hydrogen in the series (Mg, Zn, Fe, Pb barely) give electrons to $\mathrm{H^+}$, making hydrogen gas. Copper, silver and gold don't, which is part of why they've been used for coins and jewellery for millennia.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Storing a solution',
              prompt: 'You need to store copper(II) sulfate solution. Which container should you avoid?',
              choices: [
                { t: 'A galvanised (zinc-coated) bucket', ok: true },
                { t: 'A glass bottle', why: 'Glass doesn’t react with copper ions.' },
                { t: 'A silver-plated jug', why: 'Silver is less reactive than copper, so copper ions can’t take its electrons.' },
              ],
              explain: r`Zinc would displace the copper, dissolving the bucket's coating and fouling the solution. Farmers once learned this the hard way mixing copper-sulfate sprays in galvanised tanks.`,
            },
          ],
          recap: [
            'A more reactive metal displaces a less reactive one from solution.',
            'Series: Mg > Zn > Fe > Pb > (H) > Cu > Ag.',
          ],
        },
      ],
    },
    {
      title: 'Cells and Batteries',
      summary: 'Electrons that do work.',
      lessons: [
        {
          id: 'cells',
          title: 'Galvanic Cells',
          summary: 'Splitting a redox reaction in two',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Separate the halves',
              body: r`If zinc meets copper ions directly, the electron transfer just makes heat. Put the two halves in **separate beakers** joined by a wire and a **salt bridge**, and the electrons must travel through the wire, where they can light a bulb. That's a **galvanic cell**.

The metal that is oxidised is the **negative** electrode (anode); the one where ions are reduced is the **positive** electrode (cathode). The salt bridge lets ions drift to keep both beakers electrically neutral.`,
              widget: cell({ a0: 1, c0: 4, fixed: true }),
            },
            {
              type: 'interactive',
              title: 'Build the Daniell cell',
              prompt: r`John Daniell's 1836 cell powered the early telegraph. Build a cell that reads **1.10 V**.`,
              widget: cell({ a0: 0, c0: 0, goal: (p) => (Math.abs(METALS[p.c][1] - METALS[p.a][1] - 1.1) < 0.005 ? true : Math.abs(Math.abs(METALS[p.c][1] - METALS[p.a][1]) - 1.1) < 0.005 ? { ok: false, msg: 'Right pair, but the meter reads backwards: swap the sides so the right one is positive.' } : { ok: false, msg: 'Not 1.10 V. Try zinc with copper.' }), solution: { a: 1, c: 4 } }),
              explain: r`Zinc on the left (oxidised) and copper on the right (reduced): $0.34 - (-0.76) = 1.10$ V.`,
            },
            {
              type: 'interactive',
              title: 'Maximum voltage',
              prompt: r`Using these metals, build the cell with the **highest** voltage.`,
              widget: cell({ a0: 2, c0: 3, goal: (p) => (p.a === 0 && p.c === 5 ? true : { ok: false, msg: 'Pair the metal that gives up electrons most eagerly with the ion that wants them most.' }), solution: { a: 0, c: 5 } }),
              explain: r`Magnesium (most eager to lose electrons) with silver ions (most eager to gain): $0.80 - (-2.37) = 3.17$ V. The further apart two metals are in the series, the bigger the voltage.`,
            },
            {
              type: 'mcq',
              title: 'Without the bridge',
              prompt: 'What happens if you take away the salt bridge?',
              choices: [
                { t: 'The current stops almost immediately', ok: true },
                { t: 'The voltage doubles', why: 'Without a path for ions, charge builds up in each beaker and blocks the flow.' },
                { t: 'Nothing changes', why: 'The circuit has to be complete, including through the solutions.' },
              ],
              explain: r`Electrons leaving the zinc side would leave its beaker positively charged and the copper beaker negative. Within a tiny fraction of a second that charge would stop any more electrons flowing. The bridge's ions cancel the build-up.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Which way do electrons go?',
              prompt: 'In a cell made from iron and copper, which way do electrons flow through the wire?',
              choices: [
                { t: 'From iron to copper', ok: true },
                { t: 'From copper to iron', why: 'Iron has the more negative potential: it’s the one oxidised.' },
              ],
              explain: r`Iron ($-0.44$ V) is oxidised and pushes electrons through the wire to the copper side, where $\mathrm{Cu^{2+}}$ is reduced. The cell gives $0.34 - (-0.44) = 0.78$ V.`,
            },
          ],
          recap: [
            'Galvanic cell: oxidation and reduction in separate halves, electrons through a wire.',
            'Negative electrode = oxidised metal; salt bridge carries ions.',
            'Cell voltage = E(right, reduced) − E(left, oxidised).',
          ],
        },
        {
          id: 'potentials',
          title: 'Standard Potentials',
          summary: 'A table that predicts voltages',
          icon: 'book',
          steps: [
            {
              type: 'explain',
              title: 'Measured against hydrogen',
              body: r`Each half-cell has a **standard reduction potential** $E^\circ$, measured against a hydrogen electrode set to 0 V (1 M ions, 1 atm, 25 °C). The more positive, the more the ion wants electrons:

| half-reaction | $E^\circ$ (V) |
|---|---|
| $\mathrm{Li^+ + e^- \to Li}$ | −3.04 |
| $\mathrm{Mg^{2+} + 2e^- \to Mg}$ | −2.37 |
| $\mathrm{Zn^{2+} + 2e^- \to Zn}$ | −0.76 |
| $\mathrm{Fe^{2+} + 2e^- \to Fe}$ | −0.44 |
| $\mathrm{2H^+ + 2e^- \to H_2}$ | 0.00 |
| $\mathrm{Cu^{2+} + 2e^- \to Cu}$ | +0.34 |
| $\mathrm{Ag^+ + e^- \to Ag}$ | +0.80 |
| $\mathrm{O_2 + 4H^+ + 4e^- \to 2H_2O}$ | +1.23 |

A cell's voltage is $E^\circ_{\text{cell}} = E^\circ_{\text{cathode}} - E^\circ_{\text{anode}}$.`,
            },
            {
              type: 'numeric',
              title: 'Zinc–silver',
              prompt: r`What voltage does a zinc–silver cell give (button-cell chemistry)?`,
              unit: 'V',
              answer: 1.56,
              tol: 0.005,
              wrong: [{ v: 0.04, why: r`Subtract the anode from the cathode: $0.80 - (-0.76)$.` }, { v: 2.36, why: 'Don’t multiply by 2 for the two silver ions: E° doesn’t scale with amounts.' }],
              explain: r`$0.80 - (-0.76) = 1.56$ V. Note that you don't double silver's potential even though two $\mathrm{Ag^+}$ are needed per zinc: a potential is energy **per electron**, so it doesn't depend on how many react.`,
            },
            {
              type: 'interactive',
              title: 'Stack them up',
              prompt: r`A white LED needs about 3.0 V. How few zinc–copper cells (1.10 V each) in series will light it?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 4, grid: false, axes: false, height: 200,
                params: { n: { min: 1, max: 6, step: 1, value: 1, label: 'Cells in series', control: 'buttons' } },
                extra: ({ plot, p, s }) => {
                  const out = [], on = 1.1 * p.n >= 3;
                  for (let k = 0; k < p.n; k++) {
                    const x = plot.X(0.6 + k * 1.15);
                    out.push(s('rect', { x, y: plot.Y(2.6), width: plot.X(0.9) - plot.X(0), height: plot.Y(1.0) - plot.Y(2.6), rx: 6, fill: 'var(--amber-soft)', stroke: 'var(--amber)', 'stroke-width': 2.5 }));
                    out.push(s('text', { x: x + (plot.X(0.45) - plot.X(0)), y: plot.Y(1.8) + 5, 'text-anchor': 'middle', class: 'lbl', style: FS(13), text: '1.1 V' }));
                  }
                  out.push(s('circle', { cx: plot.X(8.6), cy: plot.Y(1.8), r: 26, fill: on ? 'var(--amber)' : 'var(--card)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  if (on) out.push(s('circle', { cx: plot.X(8.6), cy: plot.Y(1.8), r: 42, fill: 'var(--amber)', 'fill-opacity': 0.25 }));
                  return out;
                },
                readout: (p) => `${p.n} × 1.10 V = **${fix(1.1 * p.n, 2)} V** · LED ${1.1 * p.n >= 3 ? 'lit' : 'dark'}`,
                goal: (p) => (1.1 * p.n >= 3 && 1.1 * (p.n - 1) < 3 ? true : { ok: false, msg: 1.1 * p.n < 3 ? 'Not enough voltage yet.' : 'That lights it, but you could use fewer.' }),
                solution: { n: 3 },
              },
              explain: r`Three cells give 3.30 V. Voltages add in series, which is all a "battery" originally meant: a battery of cells, like a battery of cannons. A 9 V battery holds six 1.5 V cells.`,
            },
            {
              type: 'mcq',
              title: 'Why lithium?',
              prompt: 'Why is lithium so attractive for batteries?',
              choices: [
                { t: 'It has the most negative potential and is the lightest metal', ok: true },
                { t: 'It is the cheapest metal', why: 'Lithium is not especially cheap. Its chemistry is what makes it valuable.' },
                { t: 'It doesn’t react with anything', why: 'Lithium reacts vigorously, even with water: that eagerness gives the voltage.' },
              ],
              explain: r`At −3.04 V lithium gives the biggest voltages, and at 6.9 g/mol it stores a lot of charge per gram: high energy density.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Energy from a cell',
              prompt: r`The energy a cell delivers is $\Delta G = -nFE$. For the Daniell cell ($n = 2$, $E = 1.10$ V, $F = 96{,}485$ C/mol), what is $\Delta G$ per mole of zinc, in kJ?`,
              unit: 'kJ',
              answer: -212,
              tol: 1,
              wrong: [{ v: 212, why: 'A cell that runs by itself has ΔG < 0.' }, { v: -106, why: 'Two electrons per zinc: n = 2.' }],
              explain: r`$-2 \times 96{,}485 \times 1.10 = -212{,}000$ J $\approx -212$ kJ. A positive cell voltage means a negative $\Delta G$: the reaction is spontaneous (see Thermochemistry).`,
            },
          ],
          recap: [
            'E°cell = E°cathode − E°anode; positive means spontaneous.',
            'Voltages add in series.',
            'ΔG = −nFE.',
          ],
        },
        {
          id: 'nernst',
          title: 'Concentration Matters',
          summary: 'The Nernst equation',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Off-standard',
              body: r`$E^\circ$ is for 1 M ions. At other concentrations the voltage shifts, following the **Nernst equation** (at 25 °C):
$$E = E^\circ - \frac{0.0592}{n}\log_{10} Q$$
For the Daniell cell $Q = [\mathrm{Zn^{2+}}]/[\mathrm{Cu^{2+}}]$. More copper ions (the reactant) push the voltage up; more zinc ions (the product) pull it down.`,
              widget: cell({ a0: 1, c0: 4, fixed: true, conc: true }),
            },
            {
              type: 'numeric',
              title: 'Running low on copper',
              prompt: r`A Daniell cell has $[\mathrm{Zn^{2+}}] = 1.0$ M and $[\mathrm{Cu^{2+}}] = 0.010$ M. What is its voltage? (Two decimal places.)`,
              unit: 'V',
              answer: 1.04,
              tol: 0.005,
              wrong: [{ v: 1.16, why: r`$Q = 1.0/0.010 = 100$, and $\log 100 = 2$: subtract, since Q > 1.` }],
              explain: r`$E = 1.10 - (0.0592/2)\log 100 = 1.10 - 0.059 = 1.04$ V. As a battery runs, products build up and reactants run down, so $Q$ grows and the voltage sags.`,
            },
            {
              type: 'interactive',
              title: 'Squeeze out more volts',
              prompt: r`Set the concentrations so the cell reads at least 1.17 V.`,
              widget: cell({ a0: 1, c0: 4, fixed: true, conc: true, goal: (p) => (1.1 - 0.0296 * (p.la - p.lc) >= 1.17 - 1e-9 ? true : { ok: false, msg: 'Lower the zinc-ion concentration or raise the copper-ion one.' }), solution: { la: -3, lc: 0 } }),
              explain: r`Diluting the zinc side and keeping copper concentrated makes $Q$ small, so $\log Q$ is negative and $E$ rises above 1.10 V: with 0.001 M zinc ions and 1 M copper ions, $E = 1.10 + 0.089 = 1.19$ V. The effect is real but modest: concentrations change voltages by tens of millivolts, not volts.`,
            },
            {
              type: 'mcq',
              title: 'A flat battery',
              prompt: 'What is true of a cell that has run completely flat?',
              choices: [
                { t: 'Its reaction has reached equilibrium: Q = K and E = 0', ok: true },
                { t: 'It has run out of all its electrons', why: 'Electrons are never used up; the reaction has just stopped being driven.' },
                { t: 'Its E° has become zero', why: 'E° is fixed; it is E that falls to zero.' },
              ],
              explain: r`A battery is a reaction far from equilibrium. Discharging moves it towards equilibrium, and when it gets there, $\Delta G = 0$ and the voltage is zero.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Nerves run on Nernst',
              prompt: r`A concentration cell has the same metal on both sides; only the ion concentrations differ. Nerve cells work like this with potassium ($n = 1$): about 140 mM inside and 5 mM outside. Using $E = 0.0615\log_{10}(c_{\text{out}}/c_{\text{in}})$ at body temperature, what is the voltage, in mV?`,
              unit: 'mV',
              answer: -89,
              tol: 2,
              wrong: [{ v: 89, why: 'The outside concentration is smaller, so the log is negative.' }],
              explain: r`$0.0615 \times \log_{10}(5/140) = 0.0615 \times (-1.447) = -0.089$ V, about −89 mV, close to a resting neuron's potential (about −70 mV, since a little sodium leaks in too). Every thought you have runs on concentration cells.`,
            },
          ],
          recap: [
            'E = E° − (0.0592/n) log Q at 25 °C.',
            'Voltage sags as products build up; zero at equilibrium.',
            'Concentration cells: same chemistry, different concentrations.',
          ],
        },
      ],
    },
    {
      title: 'Electrons at Work',
      summary: 'Electrolysis, batteries and rust.',
      lessons: [
        {
          id: 'electrolysis',
          title: 'Electrolysis',
          summary: 'Driving reactions backwards',
          icon: 'flame',
          steps: [
            {
              type: 'explain',
              title: 'Pushing uphill',
              body: r`A power supply can push electrons the "wrong" way, forcing a non-spontaneous reaction: **electrolysis**. It splits water into hydrogen and oxygen, plates metals onto objects, and makes aluminium and chlorine.

Michael Faraday found that the amount of product is set by the **charge** passed. One mole of electrons is $F = 96{,}485$ coulombs (the **Faraday constant**), so
$$\text{moles of metal} = \frac{I\,t}{n\,F}$$
with $I$ in amps, $t$ in seconds and $n$ the electrons per ion.`,
            },
            {
              type: 'interactive',
              title: 'Plate a gram of copper',
              prompt: r`Choose a current and time that deposit **1.00 g** of copper ($M = 63.55$ g/mol, $\mathrm{Cu^{2+}}$, so $n = 2$), within 2%.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 2, grid: false, axes: false, height: 150, stackSliders: true,
                params: {
                  I: { min: 0.5, max: 5, step: 0.1, value: 1, label: 'Current', color: 'amber', format: (v) => `${fix(v, 1)} A` },
                  t: { min: 1, max: 90, step: 1, value: 10, label: 'Time', format: (v) => `${v} min` },
                },
                extra: ({ plot, p, s }) => {
                  const g = (p.I * p.t * 60 * 63.55) / (2 * F), w = Math.min(1, g / 2);
                  return [
                    s('rect', { x: plot.X(1), y: plot.Y(1.4), width: plot.X(8) - plot.X(0), height: 30, rx: 8, fill: 'var(--surface-2)' }),
                    s('rect', { x: plot.X(1), y: plot.Y(1.4), width: (plot.X(8) - plot.X(0)) * w, height: 30, rx: 8, style: 'fill:#c8743f' }),
                    s('line', { x1: plot.X(1 + 4), x2: plot.X(1 + 4), y1: plot.Y(1.4) - 8, y2: plot.Y(1.4) + 38, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
                    s('text', { x: plot.X(5), y: plot.Y(1.4) - 14, 'text-anchor': 'middle', class: 'lbl', style: FS(13), text: '1 g' }),
                  ];
                },
                readout: (p) => `charge ${fix(p.I * p.t * 60, 0)} C · copper plated **${fix((p.I * p.t * 60 * 63.55) / (2 * F), 3)} g**`,
                goal: (p) => { const g = (p.I * p.t * 60 * 63.55) / (2 * F); return Math.abs(g - 1) <= 0.02 ? true : { ok: false, msg: g < 1 ? 'Not enough copper yet: more current or more time.' : 'Too much copper: less current or less time.' }; },
                solution: { I: 1, t: 51 },
              },
              explain: r`You need $1.00/63.55 = 0.0157$ mol of copper, which takes $2 \times 0.0157 = 0.0315$ mol of electrons $= 3040$ C. For instance 1.0 A for about 51 minutes, or 2.5 A for 20 minutes. Only the product $I \times t$ matters.`,
            },
            {
              type: 'numeric',
              title: 'Making aluminium',
              prompt: r`Aluminium is made by electrolysing molten aluminium oxide ($\mathrm{Al^{3+}}$, $n = 3$; $M = 26.98$ g/mol). How many coulombs does 1.00 kg of aluminium take? (Like 1.2e7.)`,
              unit: 'C',
              answer: 1.073e7,
              relTol: 0.02,
              wrong: [{ v: 3.58e6, why: 'Three electrons for every aluminium ion: multiply by 3.' }],
              explain: r`$1000/26.98 = 37.1$ mol of Al, × 3 = 111 mol of electrons, × 96,485 = $1.07 \times 10^7$ C. At about 4.5 V that's 48 MJ, roughly 13 kWh per kilogram: why aluminium smelters are built next to cheap hydroelectric power, and why recycling a can saves 95% of the energy.`,
            },
            {
              type: 'mcq',
              title: 'Splitting water',
              prompt: 'In the electrolysis of water, which gas collects at the negative electrode?',
              choices: [
                { t: 'Hydrogen', ok: true },
                { t: 'Oxygen', why: 'The negative electrode supplies electrons: reduction happens there.' },
              ],
              explain: r`At the negative electrode $\mathrm{H^+}$ (or water) is reduced to $\mathrm{H_2}$; at the positive one water is oxidised to $\mathrm{O_2}$. Twice as much hydrogen as oxygen bubbles off, matching $\mathrm{2H_2O \to 2H_2 + O_2}$.`,
            },
            { /*chemanim:electrochem.electrolysis*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Count the bubbles',
              body: r`Hofmann's apparatus: two closed tubes of slightly acidified water, joined at the bottom, with an electrode in each. Switch on the current and gas collects at the top of each tube, pushing the water down.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6.2, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: 10.5, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t, n = hofN(t);
                  const tubes = [[2.6, 'H₂', 'var(--blue)', n / 2, '−', '4H₂O + 4e⁻ → 2H₂ + 4OH⁻'], [7.4, 'O₂', 'var(--coral)', n / 4, '+', '2H₂O → O₂ + 4H⁺ + 4e⁻']];
                  const top = 5.6, bot = 1.6, perMol = 0.045;
                  // the shared reservoir at the bottom
                  out.push(s('rect', { x: X(2.1), y: Y(1.6), width: X(7.9) - X(2.1), height: Y(0.9) - Y(1.6), fill: 'var(--blue)', opacity: 0.3 }));
                  out.push(s('path', { d: `M${X(2.1)} ${Y(1.6)}V${Y(0.9)}H${X(7.9)}V${Y(1.6)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }));
                  for (const [x, gas, col, mol, sign, eq] of tubes) {
                    const gasH = mol * perMol, water = top - gasH;
                    out.push(s('rect', { x: X(x - 0.5), y: Y(water), width: X(x + 0.5) - X(x - 0.5), height: Y(bot) - Y(water), fill: 'var(--blue)', opacity: 0.3 }));
                    if (gasH > 0) out.push(s('rect', { x: X(x - 0.5), y: Y(top), width: X(x + 0.5) - X(x - 0.5), height: Y(water) - Y(top), fill: 'var(--card)' }));
                    out.push(s('path', { d: `M${X(x - 0.5)} ${Y(1.6)}V${Y(top)}H${X(x + 0.5)}V${Y(1.6)}`, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }));
                    // electrode and its rising bubbles (the − side bubbles twice as fast)
                    out.push(s('rect', { x: X(x - 0.12), y: Y(2.3), width: X(0.24) - X(0), height: Y(1.6) - Y(2.3), fill: 'var(--ink-2)' }));
                    out.push(s('text', { x: X(x), y: Y(0.4), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(16)}`, text: sign }));
                    if (t > 0.5) {
                      const nb = gas === 'H₂' ? 6 : 3;
                      for (let k = 0; k < nb; k++) {
                        const f = (t * 0.8 + k / nb) % 1, y = 2.4 + f * (water - 2.4);
                        if (y < water - 0.05) out.push(s('circle', { cx: X(x + 0.22 * Math.sin(k * 2.3 + 6 * f)), cy: Y(y), r: 3.5, fill: 'none', stroke: col, 'stroke-width': 1.5 }));
                      }
                    }
                    out.push(s('text', { x: X(x), y: Y(top) - 8, 'text-anchor': 'middle', class: 'lbl', style: `fill:${col};${FS(15)}`, text: gas }));
                    out.push(s('text', { x: X(x + (x < 5 ? -0.65 : 0.65)), y: Y(3.6), 'text-anchor': x < 5 ? 'end' : 'start', class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: eq.split(' → ')[0] + ' →' }));
                    out.push(s('text', { x: X(x + (x < 5 ? -0.65 : 0.65)), y: Y(3.6) + 16, 'text-anchor': x < 5 ? 'end' : 'start', class: 'lbl', style: `fill:var(--ink-2);${FS(11)}`, text: eq.split(' → ')[1] }));
                  }
                  return out;
                },
                readout: (p) => {
                  const n = hofN(p.t);
                  return `electrons passed: ${n} · H₂ molecules: ${n / 2} · O₂ molecules: ${n / 4}`;
                },
              },
              after: r`Each $\mathrm{O_2}$ molecule needs four electrons taken away, while each $\mathrm{H_2}$ needs only two given. So the same current makes **twice as many** hydrogen molecules as oxygen ones, and since equal numbers of gas molecules take up equal volumes, the hydrogen tube fills twice as fast. The 2 : 1 volumes were one of the first clues that water is $\mathrm{H_2O}$.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Silver plating',
              prompt: r`A spoon is plated with silver ($\mathrm{Ag^+}$, $n = 1$, $M = 107.9$ g/mol) at 0.50 A for 30 minutes. How many grams of silver are deposited?`,
              unit: 'g',
              answer: 1.006,
              relTol: 0.02,
              explain: r`$0.50 \times 1800 = 900$ C $= 0.00933$ mol of electrons $= 0.00933$ mol Ag $\times 107.9 = 1.01$ g. Silver needs only one electron per atom, so it plates more mass per coulomb than copper.`,
            },
          ],
          recap: [
            'Electrolysis uses electrical energy to drive non-spontaneous redox.',
            'Moles deposited = It / (nF), F = 96,485 C/mol.',
          ],
        },
        {
          id: 'batteries',
          title: 'Inside a Battery',
          summary: 'Lithium-ion and friends',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'The rocking chair',
              body: r`A lithium-ion cell shuttles lithium ions between two layered materials: graphite on one side, a metal oxide such as $\mathrm{LiCoO_2}$ on the other. Discharging, lithium ions leave the graphite and slot into the oxide through the electrolyte, while electrons go round the outside circuit to do work. Charging pushes them all back. Nothing dissolves or plates, which is why these cells last for thousands of cycles.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 280,
                params: { mode: { min: 0, max: 1, step: 1, value: 0, label: 'Mode', format: (v) => (v ? 'charging' : 'discharging') } },
                animate: { param: 't', speed: 1, max: 600, autoplay: true, controls: false },
                extra: ({ plot, p, s }) => {
                  const out = [];
                  for (let k = 0; k < 6; k++) out.push(s('line', { x1: plot.X(0.6), x2: plot.X(3), y1: plot.Y(0.8 + k * 0.7), y2: plot.Y(0.8 + k * 0.7), stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-opacity': 0.7 }));
                  for (let k = 0; k < 6; k++) out.push(s('line', { x1: plot.X(7), x2: plot.X(9.4), y1: plot.Y(0.8 + k * 0.7), y2: plot.Y(0.8 + k * 0.7), stroke: 'var(--coral)', 'stroke-width': 4, 'stroke-opacity': 0.7 }));
                  out.push(s('text', { x: plot.X(1.8), y: plot.Y(0.25), 'text-anchor': 'middle', class: 'lbl', style: FS(13), text: 'graphite (−)' }));
                  out.push(s('text', { x: plot.X(8.2), y: plot.Y(0.25), 'text-anchor': 'middle', class: 'lbl', style: FS(13), text: 'metal oxide (+)' }));
                  out.push(s('path', { d: `M${plot.X(1.8)} ${plot.Y(4.7)}V${plot.Y(5.6)}H${plot.X(8.2)}V${plot.Y(4.7)}`, fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2.5 }));
                  const dir = p.mode ? -1 : 1;
                  for (let k = 0; k < 8; k++) {
                    const f = (((p.t * 0.12 + k / 8) % 1) + 1) % 1, ff = dir > 0 ? f : 1 - f;
                    out.push(s('circle', { cx: plot.X(3.2 + ff * 3.6), cy: plot.Y(1.1 + ((k * 37) % 7) * 0.5), r: 9, fill: 'var(--violet)' }));
                    out.push(s('text', { x: plot.X(3.2 + ff * 3.6), y: plot.Y(1.1 + ((k * 37) % 7) * 0.5) + 4, 'text-anchor': 'middle', style: `fill:#fff;font-weight:700;${FS(9)}`, text: 'Li⁺' }));
                    const g = (((p.t * 0.2 + k / 8) % 1) + 1) % 1, gg = dir > 0 ? g : 1 - g;
                    out.push(s('circle', { cx: plot.X(1.8 + gg * 6.4), cy: plot.Y(5.6), r: 5, fill: 'var(--blue)' }));
                  }
                  return out;
                },
                readout: (p) => (p.mode ? 'Charging: the charger drives Li⁺ back into the graphite and electrons back to the graphite side.' : 'Discharging: Li⁺ moves inside the cell, electrons move through your phone.'),
              },
            },
            {
              type: 'numeric',
              title: 'A phone battery',
              prompt: r`A phone battery is rated 4000 mAh at 3.85 V. How much energy does it store, in watt-hours?`,
              unit: 'Wh',
              answer: 15.4,
              tol: 0.05,
              wrong: [{ v: 15400, why: 'Convert mAh to Ah first: 4000 mAh = 4.0 Ah.' }],
              explain: r`$4.0 \text{ Ah} \times 3.85 \text{ V} = 15.4$ Wh $\approx 55$ kJ, about the energy in a teaspoon of sugar. Phones are remarkably efficient.`,
            },
            {
              type: 'mcq',
              title: 'Why rechargeable?',
              prompt: 'Why can lithium-ion cells be recharged thousands of times, while a basic zinc–carbon cell can’t?',
              choices: [
                { t: 'Lithium ions slip in and out of solid layers without rebuilding the electrodes', ok: true },
                { t: 'Lithium never reacts', why: 'Lithium is very reactive; the trick is that its ions only move between host structures.' },
                { t: 'Zinc–carbon cells have too few electrons', why: 'The problem is that their electrodes dissolve and change shape irreversibly.' },
              ],
              explain: r`In a zinc–carbon cell the zinc can dissolves as it works; pushing current back doesn't rebuild it neatly. Intercalation (sliding ions into layers) is gentle and reversible, which earned Goodenough, Whittingham and Yoshino the 2019 Nobel Prize in Chemistry.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'An electric car',
              prompt: r`An electric car has a 60 kWh battery and uses about 0.16 kWh per kilometre. Roughly how far can it go on a full charge, in km?`,
              unit: 'km',
              answer: 375,
              tol: 5,
              explain: r`$60 / 0.16 = 375$ km. The same battery holds 60 kWh = 216 MJ, about the energy in 6 litres of petrol, but electric motors convert about 90% of it to motion versus about 30% for an engine.`,
            },
          ],
          recap: [
            'Li-ion: Li⁺ shuttles between graphite and a metal oxide.',
            'Energy (Wh) = capacity (Ah) × voltage (V).',
          ],
        },
        {
          id: 'corrosion',
          title: 'Rust & Protection',
          summary: 'Fighting an unwanted cell',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Rust is a tiny battery',
              body: r`Rusting is electrochemistry. On a wet steel surface, iron at one spot is oxidised ($\mathrm{Fe \to Fe^{2+} + 2e^-}$), the electrons travel through the metal, and at another spot oxygen is reduced ($\mathrm{O_2 + 2H_2O + 4e^- \to 4OH^-}$). The ions meet and, with more oxygen, form rust. Salt water conducts ions well, so it speeds rusting up: cars rot faster where roads are salted.`,
            },
            { /*chemanim:electrochem.corrosion*/
              type: 'explain',
              kicker: 'Explore',
              title: 'A drop on steel',
              body: r`A drop of salty water on clean iron, seen from the side. Oxygen from the air dissolves into the drop, but it reaches the thin edge far more easily than the deep middle. Watch where the iron actually dissolves.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5.5, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: 16, loop: false },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t;
                  const grow = DROP_SM(t / 14), pit = 0.35 * grow;
                  // the drop
                  let d = `M${X(1.4)} ${Y(1.3)}`;
                  for (let x = 1.4; x <= 8.61; x += 0.1) d += `L${X(x).toFixed(1)} ${Y(dropTop(x)).toFixed(1)}`;
                  out.push(s('path', { d: d + 'Z', fill: 'var(--blue)', opacity: 0.16, stroke: 'var(--blue)', 'stroke-opacity': 0.5, 'stroke-width': 1.5 }));
                  // iron, with a pit growing under the middle
                  let fe = `M${X(0.3)} ${Y(1.3)}`;
                  for (let x = 0.3; x <= 9.71; x += 0.1) fe += `L${X(x).toFixed(1)} ${Y(1.3 - pit * Math.exp(-(((x - 5) / 0.8) ** 2))).toFixed(1)}`;
                  fe += `L${X(9.7)} ${Y(0.2)}H${X(0.3)}Z`;
                  out.push(s('path', { d: fe, fill: 'var(--ink-3)', opacity: 0.55 }));
                  out.push(s('text', { x: X(0.5), y: Y(0.5), class: 'lbl halo-text', style: `fill:var(--ink);${FS(13)}`, text: 'iron' }));
                  // oxygen entering near the rims
                  for (let k = 0; k < 6; k++) {
                    const side = k % 2 ? 1 : -1, f = (t * 0.45 + k / 6) % 1, x = 5 + side * (2.9 + 0.35 * Math.sin(k * 1.7)), y = 4.4 - f * 3.0;
                    if (y > 1.45) {
                      out.push(s('circle', { cx: X(x - 0.07), cy: Y(y), r: 4, fill: 'var(--coral)' }));
                      out.push(s('circle', { cx: X(x + 0.07), cy: Y(y), r: 4, fill: 'var(--coral)' }));
                    }
                  }
                  // electrons flow through the iron from the middle to the rims
                  for (let k = 0; k < 8; k++) {
                    const side = k % 2 ? 1 : -1, f = (t * 0.7 + k / 8) % 1;
                    out.push(s('circle', { cx: X(5 + side * (0.4 + 2.6 * f)), cy: Y(0.95), r: 4, fill: 'var(--blue)' }));
                  }
                  // Fe2+ drifting out from the pit, OH− drifting in from the rims; rust where they meet
                  for (let k = 0; k < 6; k++) {
                    const side = k % 2 ? 1 : -1, f = (t * 0.35 + k / 6) % 1;
                    out.push(s('circle', { cx: X(5 + side * (0.3 + 1.5 * f)), cy: Y(1.75 + 0.35 * Math.sin(k)), r: 5, fill: 'var(--violet)' }));
                    out.push(s('circle', { cx: X(5 + side * (3.1 - 1.2 * f)), cy: Y(1.6 + 0.25 * Math.cos(k)), r: 5, fill: 'var(--teal)' }));
                  }
                  for (const side of [-1, 1]) for (let k = 0; k < 5; k++) {
                    const r = 0.08 + 0.05 * grow * (k % 3);
                    if (grow * 5 > k) out.push(s('circle', { cx: X(5 + side * (1.6 + 0.2 * k)), cy: Y(1.4 + 0.07 * (k % 2)), r: r * (X(1) - X(0)), style: 'fill:#b5651d', opacity: 0.85 }));
                  }
                  out.push(s('text', { x: X(5), y: Y(5.2), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'middle (little O₂): iron dissolves, the anode' }));
                  out.push(s('text', { x: X(5), y: Y(5.2) + 17, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--coral);${FS(12)}`, text: 'edges (plenty of O₂): O₂ is used, the cathode' }));
                  return out;
                },
                readout: (p) => (p.t < 4 ? 'Blue: electrons, flowing through the iron from the middle to the edges. Red pairs: O₂.' : 'Violet: Fe²⁺ leaving the pit. Green: OH⁻ from the edges. Rust forms where they meet.'),
              },
              after: r`Ulick Evans showed this in the 1920s with an indicator drop: the middle turns blue (iron dissolving), the edge turns pink (hydroxide forming), and a brown ring of rust appears in between. The surprise is that iron dissolves where oxygen is **scarce**, because the oxygen-rich part becomes the cathode. That's why steel rusts worst in crevices, under paint blisters and beneath dirt, where air can't reach.`,
            },
            {
              type: 'interactive',
              title: 'Protect the hull',
              prompt: r`A steel ship's hull can be protected by bolting on a block of another metal that corrodes **instead**. Pick a metal that protects the iron.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 5, grid: false, axes: false, height: 220,
                params: { m: { min: 0, max: 5, step: 1, value: 4, label: 'Block of', format: (v) => METALS[v][0] } },
                extra: ({ plot, p, s }) => {
                  const prot = METALS[p.m][1] < METALS[2][1];
                  return [
                    s('rect', { x: 0, y: plot.Y(2.4), width: 600, height: plot.Y(0) - plot.Y(2.4), fill: 'var(--blue)', 'fill-opacity': 0.12 }),
                    s('path', { d: `M${plot.X(0.8)} ${plot.Y(3.6)}H${plot.X(9.2)}L${plot.X(8.4)} ${plot.Y(1.2)}H${plot.X(1.6)}Z`, fill: 'var(--surface-2)', stroke: 'var(--ink)', 'stroke-width': 3 }),
                    s('rect', { x: plot.X(4.4), y: plot.Y(1.2), width: plot.X(1.2) - plot.X(0), height: 18, rx: 4, style: `fill:${METALS[p.m][3]}`, stroke: 'var(--ink-2)' }),
                    ...(prot ? [] : [0, 1, 2, 3, 4].map((k) => s('circle', { cx: plot.X(2 + k * 1.4), cy: plot.Y(1.9 + (k % 2) * 0.5), r: 7, fill: '#a0522d', 'fill-opacity': 0.85 }))),
                  ];
                },
                readout: (p) => (p.m === 2 ? 'An iron block just rusts along with the hull.' : METALS[p.m][1] < METALS[2][1] ? `**${METALS[p.m][0]}** is oxidised in place of iron: the hull is protected` : `**${METALS[p.m][0]}** is less reactive than iron: it makes the hull rust **faster**`),
                goal: (p) => (METALS[p.m][1] < METALS[2][1] ? true : { ok: false, msg: 'The block must give up electrons more readily than iron does.' }),
                solution: { m: 1 },
              },
              explain: r`Zinc or magnesium: both sit above iron in the series, so they become the anode of the little cell and dissolve, feeding electrons into the iron and keeping it as metal. These **sacrificial anodes** are replaced every few years. A copper block would make the iron the anode and speed rusting up.`,
            },
            {
              type: 'mcq',
              title: 'Galvanised versus tinned',
              prompt: 'Steel is coated with zinc (galvanised) or with tin (food cans). Once scratched, which rusts faster?',
              choices: [
                { t: 'Tinned steel: tin is less reactive, so the exposed iron becomes the anode', ok: true },
                { t: 'Galvanised steel', why: 'Zinc is more reactive than iron, so it keeps protecting the scratch sacrificially.' },
                { t: 'They rust equally', why: 'The coating metal’s place in the series makes all the difference at a scratch.' },
              ],
              explain: r`Zinc protects even where scratched; tin only protects while intact, and at a scratch it actually speeds up the iron's corrosion. That's why dented cans rust at the dent.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Lady Liberty',
              prompt: 'The Statue of Liberty’s copper skin was originally held on an iron frame, with only a layer of shellac-soaked asbestos between them. What went wrong over a century?',
              choices: [
                { t: 'Where the insulation failed, the iron frame corroded badly, acting as the anode to the copper', ok: true },
                { t: 'The copper rusted away', why: 'Copper is the less reactive metal here; it was the iron that suffered.' },
                { t: 'Nothing: copper protects iron', why: 'Copper is below iron in the series, so it makes iron corrode faster.' },
              ],
              explain: r`Iron in contact with copper in salty sea air is the anode of a galvanic cell. By the 1980s much of the iron armature had corroded and was replaced with stainless steel during the 1986 restoration. The copper's green coat (patina) actually protects the copper.`,
            },
          ],
          recap: [
            'Rusting is a galvanic cell: iron oxidised, oxygen reduced.',
            'Sacrificial anodes (Zn, Mg) corrode instead of iron.',
            'A less reactive metal touching iron makes iron rust faster.',
          ],
        },
        {
          id: 'fuelcells',
          title: 'Fuel Cells',
          summary: 'Burning hydrogen without a flame',
          icon: 'sun',
          steps: [
            {
              type: 'explain',
              title: 'Combustion, split in two',
              body: r`A **fuel cell** is a galvanic cell whose reactants are supplied continuously. In a hydrogen fuel cell, hydrogen is oxidised at one electrode ($\mathrm{H_2 \to 2H^+ + 2e^-}$) and oxygen reduced at the other ($\mathrm{O_2 + 4H^+ + 4e^- \to 2H_2O}$). The only exhaust is water.`,
            },
            { /*chemanim:electrochem.fuelcells*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Inside a fuel cell',
              body: r`In a car's fuel cell, hydrogen and oxygen never meet directly. They are kept apart by a thin plastic **membrane** that lets protons through but not electrons, so the electrons have to take the long way round, through the motor (here, a light bulb).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 6, grid: false, axes: false, height: 320,
                animate: { param: 't', speed: 1, max: 4, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const X = (v) => plot.X(v), Y = (v) => plot.Y(v), out = [], t = p.t;
                  // chambers, electrodes and the membrane
                  out.push(s('rect', { x: X(0.4), y: Y(4.0), width: X(9.6) - X(0.4), height: Y(0.5) - Y(4.0), rx: 8, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2.5 }));
                  out.push(s('rect', { x: X(4.6), y: Y(4.0), width: X(5.4) - X(4.6), height: Y(0.5) - Y(4.0), fill: 'var(--amber)', opacity: 0.3 }));
                  for (const x of [3.7, 6.3]) out.push(s('rect', { x: X(x - 0.15), y: Y(4.0), width: X(0.3) - X(0), height: Y(0.5) - Y(4.0), fill: 'var(--ink-2)', opacity: 0.8 }));
                  out.push(s('text', { x: X(5), y: Y(0.12), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--ink-2);${FS(12)}`, text: 'membrane' }));
                  out.push(s('text', { x: X(2.3), y: Y(0.12), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--blue);${FS(12)}`, text: 'H₂ in' }));
                  out.push(s('text', { x: X(7.7), y: Y(0.12), 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--coral);${FS(12)}`, text: 'O₂ in, water out' }));
                  // the outer circuit with a bulb
                  const wire = [[3.7, 4.0], [3.7, 5.3], [6.3, 5.3], [6.3, 4.0]];
                  out.push(s('path', { d: `M${X(3.7)} ${Y(4.0)}V${Y(5.3)}H${X(6.3)}V${Y(4.0)}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
                  out.push(s('circle', { cx: X(5), cy: Y(5.3), r: 15, fill: 'var(--amber)', opacity: 0.55 + 0.25 * Math.sin(t * 4 * Math.PI) ** 2, stroke: 'var(--warn)', 'stroke-width': 2 }));
                  for (let k = 0; k < 6; k++) {
                    const [x, y] = fcAlong(wire, (t * 0.5 + k / 6) % 1);
                    out.push(s('circle', { cx: X(x), cy: Y(y), r: 4.5, fill: 'var(--blue)' }));
                  }
                  // hydrogen molecules drift to the anode and split
                  for (let k = 0; k < 5; k++) {
                    const f = (t * 0.25 + k / 5) % 1, x = 0.8 + 2.6 * f, y = 1.0 + ((k * 0.61) % 1) * 2.6;
                    out.push(s('circle', { cx: X(x - 0.09), cy: Y(y), r: 5.5, fill: 'var(--blue-soft)', stroke: 'var(--blue)', 'stroke-width': 1.5 }));
                    out.push(s('circle', { cx: X(x + 0.09), cy: Y(y), r: 5.5, fill: 'var(--blue-soft)', stroke: 'var(--blue)', 'stroke-width': 1.5 }));
                  }
                  // protons cross the membrane
                  for (let k = 0; k < 7; k++) {
                    const f = (t * 0.5 + k / 7) % 1, x = 3.95 + 2.1 * f, y = 0.9 + ((k * 0.43) % 1) * 2.8;
                    out.push(s('text', { x: X(x), y: Y(y) + 4, 'text-anchor': 'middle', class: 'lbl', style: `fill:var(--coral);${FS(12)}`, text: 'H⁺' }));
                  }
                  // oxygen in on the right, water leaving lower down
                  for (let k = 0; k < 4; k++) {
                    const f = (t * 0.25 + k / 4) % 1, x = 9.3 - 2.7 * f, y = 2.6 + ((k * 0.57) % 1) * 1.1;
                    out.push(s('circle', { cx: X(x - 0.09), cy: Y(y), r: 5.5, fill: 'var(--coral)' }));
                    out.push(s('circle', { cx: X(x + 0.09), cy: Y(y), r: 5.5, fill: 'var(--coral)' }));
                    const g = (t * 0.25 + k / 4 + 0.5) % 1, wx = 6.65 + 2.7 * g, wy = 0.9 + ((k * 0.37) % 1) * 1.1;
                    out.push(s('circle', { cx: X(wx), cy: Y(wy), r: 6, fill: 'var(--coral)' }));
                    out.push(s('circle', { cx: X(wx - 0.13), cy: Y(wy - 0.12), r: 3.5, fill: 'var(--card)', stroke: 'var(--ink-3)', 'stroke-width': 1 }));
                    out.push(s('circle', { cx: X(wx + 0.13), cy: Y(wy - 0.12), r: 3.5, fill: 'var(--card)', stroke: 'var(--ink-3)', 'stroke-width': 1 }));
                  }
                  return out;
                },
              },
              after: r`At the left electrode each $\mathrm{H_2}$ splits into two protons and two electrons. The {coral:protons} pass through the membrane; the {blue:electrons} can't, so they flow round the outer circuit and light the bulb on the way. At the right electrode they all meet oxygen and make water. It's the same reaction as burning hydrogen, but split into two halves with a wire in between, so the energy comes out as electricity instead of a flame.`,
            },
            {
              type: 'numeric',
              title: 'Its voltage',
              prompt: r`Using the table ($E^\circ$ = +1.23 V for $\mathrm{O_2}$/$\mathrm{H_2O}$ and 0.00 V for $\mathrm{H^+}$/$\mathrm{H_2}$), what is the standard voltage of a hydrogen fuel cell?`,
              unit: 'V',
              answer: 1.23,
              tol: 0.005,
              explain: r`$1.23 - 0.00 = 1.23$ V. Real cells deliver about 0.7 V under load, so they are stacked in series by the hundred.`,
            },
            {
              type: 'numeric',
              title: 'Better than a heat engine',
              prompt: r`For $\mathrm{H_2 + \tfrac12 O_2 \to H_2O(l)}$, $\Delta H = -286$ kJ and $\Delta G = -237$ kJ. The best a fuel cell can do is turn all of $\Delta G$ into electrical work. What is its maximum efficiency, as a percentage of $\Delta H$?`,
              unit: '%',
              answer: 83,
              tol: 1,
              explain: r`$237 / 286 \approx 83\%$. A heat engine burning the same hydrogen is limited by the Carnot efficiency, typically well under 50%, because it must first turn the energy into heat (see Heat & Thermodynamics).`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Where does the hydrogen come from?',
              prompt: 'Most hydrogen today is made from natural gas, releasing CO₂. What makes a fuel-cell vehicle truly low-carbon?',
              choices: [
                { t: 'Making the hydrogen by electrolysis powered by renewable electricity', ok: true },
                { t: 'The fuel cell absorbing CO₂', why: 'Fuel cells don’t capture CO₂; it’s about how the hydrogen was made.' },
                { t: 'Using a bigger fuel cell', why: 'Size doesn’t change where the hydrogen came from.' },
              ],
              explain: r`A fuel cell is only as clean as its hydrogen. Electrolysis with wind or solar power ("green hydrogen") closes the loop: water → hydrogen + oxygen → water, with sunlight doing the pushing.`,
            },
          ],
          recap: [
            'Fuel cells: continuously fed galvanic cells; H₂/O₂ gives 1.23 V.',
            'Max efficiency ΔG/ΔH ≈ 83% for hydrogen.',
          ],
        },
      ],
    },
  ],
};
