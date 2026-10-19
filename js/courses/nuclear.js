import { sig } from '../lib/svg.js';

const r = String.raw;

// semi-empirical (liquid-drop) binding energy in MeV for mass number A and proton number Z
const semf = (A, Z) => { const N = A - Z; const d = Z % 2 === 0 && N % 2 === 0 ? 11.18 / Math.sqrt(A) : Z % 2 === 1 && N % 2 === 1 ? -11.18 / Math.sqrt(A) : 0; return 15.75 * A - 17.8 * A ** (2 / 3) - (0.711 * Z * (Z - 1)) / A ** (1 / 3) - (23.7 * (A - 2 * Z) ** 2) / A + d; };
const bestZ = (A) => { let bz = 1, bb = -Infinity; for (let Z = 1; Z < A; Z++) { const b = semf(A, Z); if (b > bb) { bb = b; bz = Z; } } return bz; };
const VALLEY = Array.from({ length: 251 }, (_, A) => (A < 2 ? NaN : semf(A, bestZ(A)) / A));
const ELEM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U'.split(' ');
// moderation: average logarithmic energy loss per collision with a nucleus of mass number A
const xi = (A) => (A === 1 ? 1 : 1 + ((A - 1) ** 2 / (2 * A)) * Math.log((A - 1) / (A + 1)));
const MODS = [['water (hydrogen)', 1], ['heavy water (deuterium)', 2], ['graphite (carbon)', 12], ['uranium-238 itself', 238]];

// the uranium-238 series: [symbol, mass number A, atomic number Z, how it decays, half-life]
const U_CHAIN = [['U', 238, 92, 'α', '4.5 billion years'], ['Th', 234, 90, 'β', '24 days'], ['Pa', 234, 91, 'β', '1.2 minutes'], ['U', 234, 92, 'α', '245,000 years'], ['Th', 230, 90, 'α', '75,000 years'], ['Ra', 226, 88, 'α', '1,600 years'], ['Rn', 222, 86, 'α', '3.8 days'], ['Po', 218, 84, 'α', '3.1 minutes'], ['Pb', 214, 82, 'β', '27 minutes'], ['Bi', 214, 83, 'β', '20 minutes'], ['Po', 214, 84, 'α', '164 microseconds'], ['Pb', 210, 82, 'β', '22 years'], ['Bi', 210, 83, 'β', '5.0 days'], ['Po', 210, 84, 'α', '138 days'], ['Pb', 206, 82, '', 'stable']];
const uStep = (t) => Math.min(14, Math.floor(t / 1.1));

// two lumps of uranium, radius 0.9 and 3 (same material). A neutron travels in a straight line and causes a fission after 2 units on
// average; each fission frees 2 or 3 new neutrons in random directions. Neutrons that leave the lump are lost.
let CHAIN = null;
const chainRun = () => {
  if (CHAIN) return CHAIN;
  const run = (R, seed) => {
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let ns = Array.from({ length: 4 }, () => { const a = 2 * Math.PI * rnd(); return { x: 0, y: 0, ux: Math.cos(a), uy: Math.sin(a) }; });
    const frames = [], flashes = [];
    let fissions = 0;
    for (let k = 0; k <= 500; k++) {
      if (k % 2 === 0) frames.push({ ns: ns.map((n) => [n.x, n.y]), fissions, nflash: flashes.length });
      const next = [];
      for (const n of ns) {
        n.x += 1.5 * 0.02 * n.ux; n.y += 1.5 * 0.02 * n.uy;
        if (n.x * n.x + n.y * n.y > R * R) continue;
        if (rnd() < 0.015) {
          fissions++; flashes.push([n.x, n.y, k]);
          const kids = rnd() < 0.5 ? 2 : 3;
          for (let j = 0; j < kids && ns.length + next.length < 400; j++) { const a = 2 * Math.PI * rnd(); next.push({ x: n.x, y: n.y, ux: Math.cos(a), uy: Math.sin(a) }); }
        } else next.push(n);
      }
      ns = next;
    }
    return { frames, flashes };
  };
  const runs = [run(0.9, 5), run(3, 23)];
  // stop the picture once the big lump has 240 neutrons in flight (a real one would keep multiplying)
  const stop = runs[1].frames.findIndex((f) => f.ns.length >= 240);
  return (CHAIN = { runs, stop: stop < 0 ? 250 : stop });
};
const chainFrame = (t) => Math.min(chainRun().stop, Math.floor(t * 25));

export default {
  id: 'nuclear',
  subject: 'physics',
  title: 'Nuclear Physics',
  level: 'Advanced',
  cover: 'nuclear',
  tagline: 'The atomic nucleus, radioactivity, binding energy, fission, fusion and radiation safety.',
  description: r`Discover the tiny, dense nucleus at the heart of every atom, the three kinds of radiation, the clockwork randomness of half-lives that lets us date ancient bones, how splitting or joining nuclei releases enormous energy, how reactors keep a chain reaction steady, and how we protect ourselves from radiation.`,
  prereq: 'Special Relativity (for E = mc²)',
  chapters: [
    {
      title: 'The Nucleus and Radiation',
      summary: 'What’s inside, and what comes out.',
      lessons: [
        {
          id: 'nucleus',
          title: 'Inside the Atom',
          summary: 'Rutherford and the nucleus',
          icon: 'atom',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Bullets and tissue paper',
              body: r`Around 1909, Ernest Rutherford's team fired alpha particles (small, fast, positively charged) at a very thin sheet of gold foil. Most passed straight through, but about 1 in 8,000 bounced back sharply.`,
              prompt: 'What did this reveal?',
              choices: [
                { t: 'An atom’s positive charge and mass are packed into a tiny, dense nucleus', ok: true },
                { t: 'Gold atoms are completely solid', why: 'Then almost every alpha particle would have bounced. Most went straight through: atoms are mostly empty space.' },
                { t: 'Alpha particles are unreliable', why: 'The rare, sharp bounces were the key clue: something small and very dense was in the way.' },
              ],
              explain: r`Rutherford said it was "as if you fired a 15-inch shell at a piece of tissue paper and it came back and hit you." The rare bounces meant the atom's positive charge is concentrated in a tiny **nucleus**, about 100,000 times smaller across than the atom itself.`,
            },
            {
              type: 'explain',
              title: 'Protons, neutrons, isotopes',
              body: r`The nucleus contains **protons** (positive charge) and **neutrons** (no charge), together called **nucleons**.

- The **atomic number** $Z$ (number of protons) decides the element.
- The **mass number** $A$ = protons + neutrons.

We write a nucleus as $ {}^{A}_{Z}\text{X}$, for example $ {}^{12}_{6}\text{C}$. Atoms of the same element with different numbers of neutrons are **isotopes**: carbon-12 has 6 neutrons, while carbon-14 has 8.

If an atom were the size of a football stadium, its nucleus would be a pea at the centre, yet it holds over 99.9% of the atom's mass.`,
            },
            {
              type: 'numeric',
              title: 'Count the neutrons',
              prompt: r`How many neutrons are in uranium-238, $ {}^{238}_{92}\text{U}$?`,
              answer: 146,
              wrong: [{ v: 92, why: 'That’s the number of protons. Neutrons = A − Z.' }, { v: 330, why: 'Subtract, don’t add: 238 − 92.' }],
              explain: r`Neutrons $= A - Z = 238 - 92 = 146$.`,
            },
            {
              type: 'mcq',
              title: 'What holds it together?',
              prompt: 'Protons repel each other electrically, and they’re crammed incredibly close together in the nucleus. What stops the nucleus flying apart?',
              choices: [
                { t: 'The strong nuclear force, which is very powerful but acts only over tiny distances', ok: true },
                { t: 'Gravity', why: 'Gravity between protons is about 10³⁶ times weaker than their electric repulsion. It’s far too weak.' },
                { t: 'The electrons', why: 'The electrons are far away, outside the nucleus.' },
              ],
              explain: r`The **strong nuclear force** attracts nucleons to each other. At nuclear distances (about $10^{-15}$ m) it overpowers the electric repulsion, but it fades to almost nothing a few nucleon-widths away. Neutrons help, adding strong-force "glue" without adding repulsion.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Rutherford’s surprise',
              body: r`Alpha particles are fired at a gold nucleus (the dot), each with a different sideways offset. The nucleus repels them with an electric force growing as $1/r^2$. Change their energy and watch the paths.`,
              widget: {
                kind: 'graph', equal: true, xmin: -10, xmax: 10, ymin: -6.5, ymax: 6.5, grid: false, axes: false, maxWidth: 560,
                params: { E: { min: 0.3, max: 3, step: 0.1, value: 1, label: 'alpha energy', color: 'coral', format: (v) => v.toFixed(1) } },
                extra: ({ plot, p, s }) => { const dmin = 0.6 / p.E, out = [s('circle', { cx: plot.X(0), cy: plot.Y(0), r: 6, class: 'fl-amber' })]; for (let b = -6; b <= 6.01; b += 0.5) { let x = -10, y = b + 0.0001, vx = 1, vy = 0; const acc = (x, y) => { const r3 = Math.pow(x * x + y * y, 1.5); return [(dmin / 2) * x / r3, (dmin / 2) * y / r3]; }; let d = `M${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; for (let k = 0; k < 4000; k++) { const dt = Math.min(0.02, 0.02 * Math.hypot(x, y)); let [ax, ay] = acc(x, y); vx += (ax * dt) / 2; vy += (ay * dt) / 2; x += vx * dt; y += vy * dt; [ax, ay] = acc(x, y); vx += (ax * dt) / 2; vy += (ay * dt) / 2; if (k % 4 === 0) d += `L${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; if (Math.abs(x) > 10.5 || Math.abs(y) > 7) break; } out.push(s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 1.4, opacity: 0.8 })); } return out; },
                readout: (p) => `head-on, an alpha gets within **${(0.6 / p.E).toFixed(2)}** units of the nucleus before bouncing straight back · paths that pass close are deflected sharply`,
              },
              after: r`Most alphas pass far from the nucleus and barely bend; the few aimed almost straight at it swing round and come back. Thomson’s spread-out "plum pudding" atom could never do that. In 1911 Rutherford concluded that the positive charge is packed into a tiny nucleus, about 100,000 times smaller than the atom.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How small is a nucleus?',
              prompt: r`A nucleus with $A$ nucleons has radius about $1.2\,A^{1/3}$ femtometres ($1\ \text{fm} = 10^{-15}$ m). What is the radius of a gold-197 nucleus, in fm? (1 decimal place.)`,
              unit: 'fm',
              answer: 1.2 * 197 ** (1 / 3),
              tol: 0.06,
              wrong: [{ v: 1.2 * 197, tol: 1, why: r`Take the cube root of 197 first: $197^{1/3} \approx 5.8$.` }],
              explain: r`$1.2 \times 197^{1/3} \approx 1.2 \times 5.82 \approx 7.0$ fm. A gold atom is about 0.14 nm $= 140{,}000$ fm in radius, about **20,000 times** bigger. Since $r \propto A^{1/3}$, volume is proportional to $A$: every nucleus has about the same density, $2 \times 10^{17}$ kg/m³, like a drop of incompressible liquid.`,
            },
          ],
          recap: [
            'Atoms are mostly empty space around a tiny, dense nucleus (Rutherford).',
            'Z = protons (decides the element), A = protons + neutrons. Isotopes differ in neutron number.',
            'The strong nuclear force holds the nucleus together against electric repulsion.',
          ],
        },
        {
          id: 'radiation',
          title: 'Radioactive Decay',
          summary: 'Alpha, beta, gamma',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Stopping radiation',
              prompt: 'Which kind of radiation is stopped by a single sheet of paper?',
              cols: 2,
              choices: [
                { t: 'Alpha', ok: true },
                { t: 'Beta', why: 'Beta particles get through paper but are stopped by a few millimetres of aluminium.' },
                { t: 'Gamma', why: 'Gamma rays need thick lead or concrete to reduce them substantially.' },
              ],
              explain: r`Alpha particles are heavy and highly charged, so they interact strongly with matter and stop quickly: paper or skin stops them. Beta particles go further (stopped by aluminium). Gamma rays penetrate furthest (reduced by lead or concrete).`,
            },
            {
              type: 'explain',
              title: 'Three kinds of decay',
              body: r`Unstable nuclei release energy by **decaying**:

| Type | What’s emitted | Effect on the nucleus |
|---|---|---|
| Alpha (α) | a helium nucleus, $ {}^4_2\text{He}$ | $A$ drops by 4, $Z$ drops by 2 |
| Beta (β⁻) | an electron (a neutron turns into a proton) | $A$ unchanged, $Z$ rises by 1 |
| Gamma (γ) | a high-energy photon | no change in $A$ or $Z$ |

In every nuclear equation, both the mass numbers and the charges (atomic numbers) must balance.`,
            },
            {
              type: 'mcq',
              title: 'Alpha decay of uranium',
              prompt: r`Uranium-238 ($ {}^{238}_{92}\text{U}$) undergoes alpha decay. What nucleus does it become?`,
              choices: [
                { t: r`$ {}^{234}_{90}\text{Th}$ (thorium-234)`, ok: true },
                { t: r`$ {}^{234}_{92}\text{U}$`, why: r`Alpha decay also removes 2 protons, so the element changes: $Z = 92 - 2 = 90$.` },
                { t: r`$ {}^{236}_{90}\text{Th}$`, why: r`An alpha particle carries away 4 nucleons, so $A = 238 - 4 = 234$.` },
                { t: r`$ {}^{238}_{93}\text{Np}$`, why: 'That would be beta decay (Z goes up by 1).' },
              ],
              explain: r`$$ {}^{238}_{92}\text{U} \to {}^{234}_{90}\text{Th} + {}^{4}_{2}\text{He}$$. Check: $238 = 234 + 4$ and $92 = 90 + 2$. ✓ Element 90 is thorium.`,
            },
            {
              type: 'numeric',
              title: 'Beta decay of carbon-14',
              prompt: r`Carbon-14 ($ {}^{14}_{6}\text{C}$) decays by beta emission. What is the atomic number Z of the product?`,
              answer: 7,
              wrong: [{ v: 5, why: 'In beta decay a neutron turns into a proton, so Z goes **up** by 1.' }, { v: 6, why: 'The element changes: a neutron becomes a proton.' }],
              explain: r`A neutron turns into a proton (emitting an electron), so $Z = 6 + 1 = 7$: nitrogen. $$ {}^{14}_{6}\text{C} \to {}^{14}_{7}\text{N} + e^-$$ (plus a nearly undetectable antineutrino).`,
            },
            { /*anim:nuclear*/
              type: 'explain',
              kicker: 'Explore',
              title: 'From uranium to lead',
              body: r`Uranium-238 doesn't decay just once. Each nucleus is plotted by its neutrons $N$ (across) and protons $Z$ (up), labelled with its element. An {coral:alpha decay} removes 2 protons and 2 neutrons (a step down and to the left); a {blue:beta decay} turns a neutron into a proton (a step up and to the left).`,
              widget: {
                kind: 'graph', equal: true, xmin: 122.5, xmax: 147, ymin: 80.6, ymax: 93.4, grid: false, axes: { xticks: 2, yticks: 2, xAt: 123, yAt: 81, xlabel: 'N', ylabel: 'Z' }, maxWidth: 640,
                animate: { param: 't', speed: 1, max: 20, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const k = uStep(p.t), els = [], w = plot.X(0.86) - plot.X(0);
                  for (let i = 0; i <= k; i++) {
                    const [sym, A, Z, mode] = U_CHAIN[i], N = A - Z;
                    if (i < k) {
                      const [, A2, Z2] = U_CHAIN[i + 1], N2 = A2 - Z2;
                      els.push(s('line', { x1: plot.X(N), y1: plot.Y(Z), x2: plot.X(N2), y2: plot.Y(Z2), stroke: mode === 'α' ? 'var(--coral)' : 'var(--blue)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
                    }
                    els.push(s('rect', { x: plot.X(N) - w / 2, y: plot.Y(Z) - w / 2, width: w, height: w, rx: 3, class: i === k ? 'fl-amber' : 'fl-card', stroke: i === k ? 'var(--ink)' : 'var(--line-2)', 'stroke-width': i === k ? 2 : 1 }));
                    els.push(s('text', { x: plot.X(N), y: plot.Y(Z) + 4, 'text-anchor': 'middle', style: `font-size:max(${Math.max(10, w * 0.5).toFixed(1)}px, var(--fmin, 0px));font-weight:700;fill:var(--${i === k ? 'night' : 'ink'})`, text: sym })); // the mass number is in the readout
                  }
                  return els;
                },
                readout: (p) => { const k = uStep(p.t), [sym, A, , mode, hl] = U_CHAIN[k]; return k === 14 ? `**lead-206** is stable: the chain ends after 8 alpha and 6 beta decays` : `**${sym}-${A}**: ${mode === 'α' ? '{coral:alpha}' : '{blue:beta}'} decay, half-life ${hl}`; },
              },
              after: r`Fourteen decays take uranium-238 down to stable lead-206: 8 alphas (losing $8 \times 4 = 32$ nucleons, from 238 to 206) and 6 betas (which turn 6 neutrons into protons, so the proton count falls by $16 - 6 = 10$, from 92 to 82). The half-lives span from 164 microseconds to 4.5 billion years. The slowest step sets the pace, so old rocks slowly fill up with lead; comparing a rock's uranium and lead tells us its age, which is how Earth was dated to 4.5 billion years.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Sorting radiation',
              body: r`Alpha, beta and gamma rays leave a source on the left. A magnetic field bends charged particles: the heavy, positive alpha only slightly; the light, negative beta strongly the other way; gamma (no charge) not at all. Then they meet an absorber.`,
              widget: {
                kind: 'graph', equal: true, xmin: -0.5, xmax: 10, ymin: -4, ymax: 4, grid: false, axes: false, maxWidth: 540,
                params: { B: { min: 0, max: 1, step: 0.05, value: 0.5, label: 'magnetic field', color: 'blue', format: (v) => v.toFixed(2) }, wall: { min: 0, max: 3, step: 1, value: 0, label: 'absorber', color: 'ink', format: (v) => ['none', 'paper', '3 mm aluminium', '5 cm lead'][v] } },
                extra: ({ plot, p, s }) => { const X = 6, rays = [['α', 0.04, 'coral', 1], ['β', -0.32, 'blue', 2], ['γ', 0, 'violet', 3]], out = [], labels = []; if (p.wall) out.push(s('rect', { x: plot.X(X), y: plot.Y(4), width: plot.X([0, 0.12, 0.35, 0.9][p.wall]) - plot.X(0), height: plot.Y(-4) - plot.Y(4), class: ['', 'fl-amber-soft', 'fl-muted', 'fl-ink'][p.wall], opacity: p.wall === 3 ? 0.6 : 0.9 })); for (const [n, kk, c, stop] of rays) { const k = kk * p.B, pts = []; for (let t = 0; t <= 10.5; t += 0.05) { const x = Math.abs(k) < 1e-6 ? t : Math.sin(k * t) / k, y = Math.abs(k) < 1e-6 ? 0 : (1 - Math.cos(k * t)) / k; if (x > 10 || Math.abs(y) > 3.9) break; const blocked = p.wall && x > X && stop < 3 && p.wall >= stop; if (blocked) break; pts.push([x, y]); } out.push(s('path', { d: pts.map(([x, y], i) => `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`).join(''), fill: 'none', stroke: `var(--${c})`, 'stroke-width': 3, 'stroke-dasharray': stop === 3 && p.wall === 3 ? '3 6' : '' })); const [lx, ly] = pts[pts.length - 1]; labels.push({ x: plot.X(lx) + 8, y: plot.Y(ly) + 5, c, n }); } labels.sort((a, b) => a.y - b.y); for (let i = 1; i < labels.length; i++) if (Math.abs(labels[i].x - labels[i - 1].x) < 24) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 17); /* rays that end together get stacked labels */ for (const L of labels) out.push(s('text', { x: L.x, y: L.y, class: 'lbl', style: 'font-size:max(calc(15px * var(--fs, 1)), var(--fmin, 0px))', fill: `var(--${L.c})`, text: L.n })); out.push(s('rect', { x: plot.X(-0.5), y: plot.Y(0.4), width: plot.X(0.5) - plot.X(0), height: plot.Y(-0.4) - plot.Y(0.4), class: 'fl-ink' })); return out; },
                readout: (p) => ['nothing in the way: all three reach the end', 'paper stops **alpha**', 'aluminium stops **alpha and beta**', 'lead stops alpha and beta, and **weakens gamma** (dashed) without stopping it all'][p.wall],
              },
              after: r`Alpha particles are big and doubly charged, so they lose energy fast and stop in a sheet of paper (or the dead outer layer of your skin), but are very dangerous if swallowed. Beta particles get through paper but not a few millimetres of metal. Gamma rays are only gradually absorbed: each few centimetres of lead halves them.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Inside vs. outside',
              prompt: 'Which is most dangerous if swallowed or inhaled, even though it is the easiest to block outside the body?',
              cols: 2,
              choices: [
                { t: 'An alpha emitter', ok: true },
                { t: 'A gamma emitter', why: 'Gamma rays mostly pass through tissue. Alpha particles dump all their energy in a tiny region, which is devastating to nearby cells.' },
              ],
              explain: r`Outside the body, alpha particles are stopped by the dead outer layer of skin. Inside, they deposit all their energy in a very small volume of living tissue, causing intense damage. That's why inhaled radon gas is a significant health hazard.`,
            },
          ],
          recap: [
            'Alpha (a helium nucleus): stopped by paper. Beta (an electron): stopped by aluminium. Gamma: reduced by lead.',
            'Alpha decay: A − 4, Z − 2. Beta⁻ decay: Z + 1.',
            'Nuclear equations must balance in both A and Z.',
          ],
        },
        {
          id: 'half-life',
          title: 'Half-Life',
          summary: 'Random, yet predictable',
          icon: 'clock',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Which atom next?',
              prompt: 'In a sample of radioactive atoms, can you predict which atom will decay next?',
              choices: [
                { t: 'No: each atom’s decay is random, though the overall rate is very predictable', ok: true },
                { t: 'Yes: the oldest ones decay first', why: 'Atoms don’t age. A nucleus that has lasted a billion years is exactly as likely to decay in the next second as a fresh one.' },
              ],
              explain: r`Each nucleus has a fixed chance of decaying per second, regardless of its history. You can't predict any single atom, but with huge numbers, the fraction decaying each second is extremely reliable.`,
            },
            {
              type: 'explain',
              kicker: 'Experiment',
              title: 'Watch them decay',
              body: r`Each atom independently has a 50% chance of decaying in each **half-life**. Press **Start**.`,
              widget: { kind: 'decay', N: 400, halfLife: 1, tmax: 5 },
              gate: true,
              after: r`Random individual decays add up to a smooth curve: after each half-life, about half of the remaining atoms are left.
$$N = N_0 \left(\tfrac12\right)^{t/T_{1/2}}$$`,
            },
            {
              type: 'numeric',
              title: 'Three half-lives',
              prompt: 'What percentage of a radioactive sample remains after 3 half-lives?',
              unit: '%',
              answer: 12.5,
              wrong: [{ v: 0, why: 'It halves each time: 100 → 50 → 25 → 12.5. It never quite reaches zero.' }, { v: 25, why: 'That’s after 2 half-lives.' }],
              explain: r`$100\% \to 50\% \to 25\% \to 12.5\%$. As a formula: $(\tfrac12)^3 = \tfrac18$.`,
            },
            {
              type: 'numeric',
              title: 'Carbon dating',
              body: r`Living things keep a steady level of carbon-14. After death, it decays with a half-life of about 5,730 years.`,
              prompt: 'A bone has 25% of the carbon-14 found in living bone. About how old is it?',
              unit: 'years',
              answer: 11460,
              tol: 10,
              wrong: [{ v: 5730, why: '25% means two halvings: 100 → 50 → 25.' }, { v: 4297.5, tol: 1, why: '25% left means two full half-lives have passed.' }],
              explain: r`25% is two half-lives: $2 \times 5730 = 11{,}460$ years. Willard Libby developed radiocarbon dating in the late 1940s and won a Nobel Prize for it. It works for remains up to about 50,000 years old.`,
            },
            {
              type: 'numeric',
              title: 'Find the half-life',
              prompt: r`A Geiger counter near a sample reads 800 counts per minute. A day (24 hours) later it reads 100. What is the half-life, in hours?`,
              unit: 'hours',
              answer: 8,
              wrong: [{ v: 3, why: r`That's the number of half-lives ($800 \to 400 \to 200 \to 100$). Divide 24 hours by it.` }, { v: 12, why: r`Halving once would leave 400, not 100. Count the halvings: three.` }],
              explain: r`$800 \to 400 \to 200 \to 100$ is three halvings in 24 hours, so $T_{1/2} = 8$ hours. Medical isotopes are chosen with half-lives like this: long enough to do their job, short enough to vanish from the body within days. (Technetium-99m, the most used, has 6 hours.)`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Dating rocks',
              prompt: 'Why can’t carbon-14 date a 100-million-year-old dinosaur fossil?',
              choices: [
                { t: 'After so many half-lives, essentially no carbon-14 is left to measure', ok: true },
                { t: 'Dinosaurs had no carbon', why: 'They did, but 100 million years is over 17,000 half-lives of carbon-14.' },
              ],
              explain: r`100 million years is about 17,500 half-lives, which leaves $(\tfrac12)^{17500}$, effectively nothing. Geologists instead use isotopes with much longer half-lives, such as uranium-238 (4.5 billion years) and potassium-40 (1.3 billion years), to date rocks.`,
            },
          ],
          recap: [
            'Each nucleus decays at random, but large samples follow a smooth half-life curve.',
            r`$N = N_0 (\tfrac12)^{t/T_{1/2}}$: after $n$ half-lives, $\frac{1}{2^n}$ remains.`,
            'Match the half-life to the timescale: carbon-14 for archaeology, uranium for rocks.',
          ],
        },
      ],
    },
    {
      title: 'Nuclear Energy',
      summary: 'Fission and fusion.',
      lessons: [
        {
          id: 'binding',
          title: 'Binding Energy',
          summary: 'Why both fission and fusion release energy',
          icon: 'sparkle',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Missing mass',
              body: r`A helium-4 nucleus contains 2 protons and 2 neutrons. Weigh the nucleus, then weigh 2 separate protons and 2 separate neutrons.`,
              prompt: 'How do the masses compare?',
              choices: [
                { t: 'The nucleus weighs slightly less than its separate parts', ok: true },
                { t: 'They are exactly equal', why: 'Surprisingly not. Binding the nucleons together releases energy, and that energy carries away mass.' },
                { t: 'The nucleus weighs more', why: 'It weighs less: you would have to add energy (mass) to pull it apart.' },
              ],
              explain: r`The nucleus is about 0.7% lighter. That **mass defect** is the **binding energy**, $E = \Delta m\, c^2$, released when the nucleus formed, and needed to pull it apart again.`,
            },
            {
              type: 'numeric',
              title: 'Weighing helium',
              prompt: r`A proton has mass 1.007276 u, a neutron 1.008665 u, and a helium-4 nucleus 4.001506 u. The mass defect times 931.5 MeV/u is the binding energy. What is it for helium-4? (1 decimal place.)`,
              unit: 'MeV',
              answer: (2 * 1.007276 + 2 * 1.008665 - 4.001506) * 931.494,
              tol: 0.1,
              wrong: [{ v: (2 * 1.007276 + 2 * 1.008665 - 4.001506), tol: 0.001, why: 'That’s the mass defect in u. Multiply by 931.5 MeV per u.' }],
              hint: r`$\Delta m = 2(1.007276) + 2(1.008665) - 4.001506$.`,
              explain: r`$\Delta m = 0.0304$ u, so the binding energy is $0.0304 \times 931.5 \approx 28.3$ MeV, or about 7.1 MeV per nucleon. Compare: binding an electron in hydrogen takes 13.6 **eV**, two million times less.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'The curve of binding energy',
              body: r`Treat a nucleus like a drop of liquid: each nucleon is bound by its neighbours (a **volume** term), those at the surface less so (a **surface** term), protons repel each other (a **Coulomb** term), and nuclei prefer balanced numbers of protons and neutrons (an **asymmetry** term). This **liquid-drop model** (Weizsäcker, 1935) predicts the binding energy per nucleon of the most stable nucleus for each mass number.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 250, ymin: 5, ymax: 9.5, grid: false, height: 280, axes: { xlabel: 'mass number A', ylabel: 'MeV per nucleon', xticks: 50, yticks: 1 },
                params: { A: { min: 4, max: 240, step: 1, value: 56, label: 'mass number', color: 'violet', format: (v) => `${v} (${ELEM[bestZ(v) - 1] || '?'}-${v})` } },
                curves: [{ f: (x) => VALLEY[Math.round(x)], from: () => 4, color: 'violet', width: 3, n: 247 }],
                points: [{ x: (p) => p.A, y: (p) => VALLEY[p.A], color: 'coral' }],
                extra: ({ plot, s }) => [s('text', { x: plot.X(25), y: plot.Y(5.5), class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--teal)', text: '← fusion releases energy' }), s('text', { x: plot.X(140), y: plot.Y(6.3), class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--coral)', text: 'fission releases energy →' })],
                readout: (p) => `most stable nucleus with A = ${p.A}: **${ELEM[bestZ(p.A) - 1] || '?'}-${p.A}** · ${VALLEY[p.A].toFixed(2)} MeV per nucleon`,
              },
              after: r`The curve peaks near **iron and nickel** (A ≈ 56–62). Light nuclei have too much surface; heavy ones suffer from the protons' mutual repulsion. Moving toward the peak releases energy, so **fusing** light nuclei and **splitting** heavy ones both work. (The formula misses special cases like helium-4, which is unusually tightly bound.)`,
            },
            {
              type: 'interactive',
              title: 'The valley of stability',
              body: r`For nuclei with 56 nucleons, the liquid-drop binding energy depends on how many are protons. Find the number of protons that binds an $A = 56$ nucleus most tightly.`,
              widget: {
                kind: 'graph', xmin: 20, xmax: 32, ymin: 7.2, ymax: 9, grid: false, height: 260, padL: 52, axes: { xlabel: 'protons Z', ylabel: 'MeV per nucleon', xticks: 2, yticks: 0.2, yfmt: (v) => v.toFixed(1), xAt: 20 },
                params: { z: { min: 20, max: 32, step: 1, value: 22, label: 'protons', color: 'coral', format: (v) => `${v} (${ELEM[v - 1]}-56)` } },
                extra: ({ plot, p, s }) => Array.from({ length: 13 }, (_, i) => { const Z = 20 + i, b = semf(56, Z) / 56; return s('circle', { cx: plot.X(Z), cy: plot.Y(b), r: Z === p.z ? 8 : 5, class: Z === p.z ? 'fl-coral' : 'fl-violet' }); }),
                readout: (p) => `${ELEM[p.z - 1]}-56 (${p.z} protons, ${56 - p.z} neutrons): **${(semf(56, p.z) / 56).toFixed(3)} MeV** per nucleon`,
                goal: (p) => p.z === 26,
                hint: 'Too many neutrons costs asymmetry energy; too many protons costs Coulomb energy.',
                solution: { z: 26 },
              },
              explain: r`**26 protons**: iron-56, the stable form. Nuclei to the left have too many neutrons and undergo beta-minus decay (a neutron becomes a proton); those to the right have too many protons and decay the other way. All of them roll "downhill" toward the bottom of this **valley of stability**. Heavier nuclei need ever more extra neutrons to dilute the protons' repulsion.`,
            },
            {
              type: 'numeric',
              title: 'The binding of iron',
              prompt: r`Iron-56 holds its 56 nucleons with about 8.8 MeV each, the most tightly bound of all. What is its total binding energy, in MeV? (Nearest 10.)`,
              unit: 'MeV',
              answer: 56 * 8.8,
              tol: 5,
              explain: r`$56 \times 8.8 \approx 490$ MeV: the energy needed to pull an iron nucleus completely apart, equivalent to about half a proton’s mass.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'The end of a star',
              prompt: 'Why does a massive star’s core collapse once it has fused elements up to iron?',
              choices: [
                { t: 'Fusing iron absorbs energy instead of releasing it, so the core loses the pressure holding it up', ok: true },
                { t: 'Iron is too heavy for gravity to hold', why: 'It’s the opposite: with no more energy from fusion, gravity wins.' },
                { t: 'Iron is radioactive', why: 'Iron-56 is very stable. That’s exactly the problem: no more energy can be extracted from it.' },
              ],
              explain: r`Iron sits at the peak of the curve, so fusing it (or splitting it) costs energy. With no energy source left, the core can't support itself, and it collapses in under a second, triggering a supernova. Elements heavier than iron are made mostly in such explosions and in neutron-star collisions.`,
            },
          ],
          recap: [
            'A nucleus weighs less than its separate parts. The difference is the binding energy (E = Δm c²).',
            'Binding energy per nucleon peaks near iron and nickel; the liquid-drop model explains why.',
            'Fusing light nuclei, or splitting heavy ones, moves toward iron and releases energy.',
          ],
        },
        {
          id: 'fission-fusion',
          title: 'Fission & Fusion',
          summary: 'Reactors and stars',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'Chain reaction',
              body: r`When a uranium-235 nucleus absorbs a neutron, it splits into two smaller nuclei and releases about 2 or 3 more neutrons.`,
              prompt: 'What can those released neutrons do?',
              choices: [
                { t: 'Split more uranium nuclei, starting a chain reaction', ok: true },
                { t: 'Nothing, they just escape', why: 'Some escape, but in enough uranium they trigger further fissions.' },
              ],
              explain: r`Each fission can trigger 2 or 3 more. In a reactor, **control rods** absorb the extra neutrons so that, on average, exactly one goes on to cause another fission: a steady chain reaction. In a bomb, the number grows explosively.`,
            },
            {
              type: 'interactive',
              title: 'Critical',
              body: r`Each fission's neutrons go on to cause, on average, $k$ new fissions (the **multiplication factor**). Starting from 1,000 neutrons, the graph shows the number in each generation (log scale). Set $k$ so the chain reaction runs **steadily**, as in a power reactor.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 50, ymin: 0, ymax: 8, grid: false, height: 260, axes: { xlabel: 'generation', ylabel: 'neutrons', xticks: 10, yticks: 2, yfmt: (v) => `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[v] || ''}` },
                params: { k: { min: 0.8, max: 1.4, step: 0.01, value: 1.1, label: '$k$', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (g, p) => Math.min(8.2, Math.max(-0.2, 3 + g * Math.log10(p.k))), color: 'violet', width: 3 }, { f: () => 3, color: 'muted', dash: true }],
                readout: (p) => `k = ${p.k.toFixed(2)}: ${p.k > 1.0001 ? '**supercritical**: the reaction grows' : p.k < 0.9999 ? '**subcritical**: the reaction dies out' : '**critical**: a steady chain reaction'} · after 50 generations: ${(1000 * p.k ** 50).toExponential(1)} neutrons`,
                goal: (p) => Math.abs(p.k - 1) < 1e-9,
                hint: 'Each fission should lead to exactly one more.',
                solution: { k: 1 },
              },
              explain: r`At $k = 1$ exactly, each generation is the same size: a steady power output. Reactor operators keep $k$ at 1 with control rods; a bomb is designed for $k$ near 2. Even $k = 1.01$ grows a thousandfold in under 700 generations.`,
            },
            { /*anim2:nuclear*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Too small, big enough',
              body: r`Two lumps of the same uranium, one small and one large, each starting with four stray neutrons (black dots). An {amber:amber flash} is a nucleus splitting, which frees 2 or 3 new neutrons. Neutrons that reach the edge escape and are lost.`,
              widget: {
                kind: 'graph', equal: true, xmin: -5, xmax: 5.9, ymin: -3.3, ymax: 3.3, grid: false, axes: false, maxWidth: 600,
                animate: { param: 't', speed: 1, max: 12, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const C = chainRun().runs, k = chainFrame(p.t), els = [], R = (q) => plot.X(q) - plot.X(0);
                  [[-3.8, 0.9, C[0]], [2.7, 3, C[1]]].forEach(([cx, rad, run]) => {
                    els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(0), r: R(rad), class: 'fl-teal-soft', stroke: 'var(--teal)', 'stroke-width': 2 }));
                    const f = run.frames[k];
                    // recent flashes fade out over 0.4 s
                    for (let i = 0; i < f.nflash; i++) {
                      const [x, y, born] = run.flashes[i], age = (2 * k - born) / 50;
                      if (age < 0.4) els.push(s('circle', { cx: plot.X(cx + x), cy: plot.Y(y), r: 9 * (1 - age), class: 'fl-amber', opacity: 1 - age / 0.4 }));
                    }
                    const d = f.ns.map(([x, y]) => `M${plot.X(cx + x).toFixed(1)} ${plot.Y(y).toFixed(1)}h0`).join('');
                    if (d) els.push(s('path', { d, stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round' }));
                  });
                  return els;
                },
                readout: (p) => { const C = chainRun().runs, k = chainFrame(p.t), a = C[0].frames[k], b = C[1].frames[k]; const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`; return `small lump: ${pl(a.fissions, 'fission')}, ${pl(a.ns.length, 'neutron')} left · large lump: ${pl(b.fissions, 'fission')}, ${pl(b.ns.length, 'neutron')}${k === chainRun().stop ? ' and still multiplying' : ''}`; },
              },
              after: r`In the small lump, most neutrons reach the surface and escape before they hit anything, so each fission leads to fewer than one more on average ($k < 1$) and the reaction fizzles. In the big lump a neutron has to travel much further to get out, so more of them cause fissions: $k > 1$, and the numbers multiply generation after generation. The size at which $k$ reaches exactly 1 is the **critical mass**, about 52 kg for a bare sphere of uranium-235.`,
            },
            {
              type: 'numeric',
              title: 'How fast is a bomb?',
              prompt: r`With $k = 2$, how many generations does it take for 1 neutron to grow into about $10^{24}$ fissions (roughly half a kilogram of uranium)? ($2^{10} \approx 10^3$.)`,
              unit: 'generations',
              answer: Math.log2(1e24),
              tol: 1,
              wrong: [{ v: 24, why: 'Each generation doubles, it doesn’t multiply by 10.' }],
              hint: r`$2^{80} = (2^{10})^8 \approx (10^3)^8$.`,
              explain: r`About **80 generations**. With prompt neutrons taking about 10 nanoseconds per generation, the whole chain takes under a microsecond. Reactors are controllable only because about 0.65% of neutrons are **delayed**, emitted seconds later by fission fragments, which slows the response enough for control rods to keep up.`,
            },
            {
              type: 'numeric',
              title: 'Energy per fission',
              body: r`One U-235 fission releases about 200 MeV. One chemical reaction (burning a carbon atom) releases about 4 eV.`,
              prompt: 'Roughly how many times more energy does one fission release than one chemical reaction? (1 MeV = 10⁶ eV.) Give the answer in millions.',
              unit: 'million times',
              answer: 200e6 / 4 / 1e6,
              tol: 1,
              wrong: [{ v: 5e7, tol: 1e5, why: 'That’s the raw ratio. The question asks for it in millions.' }],
              explain: r`$\frac{2 \times 10^8 \text{ eV}}{4 \text{ eV}} = 5 \times 10^7$: about **50 million** times more. That's why a nuclear power station's fuel fits in a few lorries per year, while a coal station burns millions of tonnes.`,
            },
            {
              type: 'explain',
              title: 'Fusion: the power of the stars',
              body: r`In the Sun's core, hydrogen nuclei fuse into helium at about 15 million K. On Earth, scientists are trying to fuse hydrogen isotopes (deuterium and tritium) in reactors. That needs temperatures over **100 million K**, so the fuel is a plasma held by magnetic fields or squeezed by lasers.

Fusion would offer abundant fuel (deuterium from seawater) and no long-lived high-level waste. But sustaining it long enough to produce more energy than it consumes remains a major engineering challenge, and power plants are still in the experimental stage.`,
            },
            {
              type: 'numeric',
              title: 'Deuterium plus tritium',
              prompt: r`In the reaction D + T → He-4 + n, the masses are 2.014102 u, 3.016049 u, 4.002603 u and 1.008665 u (atomic masses; the electrons cancel). Using 931.5 MeV/u, how much energy is released? (1 decimal place.)`,
              unit: 'MeV',
              answer: (2.014102 + 3.016049 - 4.002603 - 1.008665) * 931.494,
              tol: 0.1,
              wrong: [{ v: (2.014102 + 3.016049 - 4.002603 - 1.008665), tol: 0.001, why: 'That’s the mass defect in u. Multiply by 931.5.' }],
              explain: r`$\Delta m = 0.0189$ u, releasing about **17.6 MeV**, most of it carried by the neutron (14.1 MeV). Per kilogram of fuel that's about four times more than fission, and over ten million times more than burning coal.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Hotter than the Sun',
              prompt: 'Why do fusion reactors on Earth need temperatures far higher than the Sun’s core?',
              choices: [
                { t: 'The Sun has enormous pressure and size (and time), so even rare fusion events add up. Reactors must make up for that with heat', ok: true },
                { t: 'Earth’s gravity is stronger', why: 'The Sun’s gravity is far stronger, and that crushing pressure is part of what helps it.' },
                { t: 'Reactors use a different kind of physics', why: 'It’s the same physics. The difference is the conditions.' },
              ],
              explain: r`The Sun's core is incredibly dense and vast, so even though any individual proton almost never fuses (it relies on quantum tunnelling), the total output is huge. A reactor is tiny and far less dense, so it needs much higher temperatures to get enough fusions per second.`,
            },
          ],
          recap: [
            'Fission: heavy nuclei split, releasing neutrons that can sustain a chain reaction.',
            'Nuclear reactions release millions of times more energy per atom than chemical ones.',
            'Fusion powers stars. On Earth it needs over 100 million K and is still experimental.',
          ],
        },
      ],
    },
    {
      title: 'Living with Radiation',
      summary: 'Doses and shielding, and how reactors are tamed.',
      lessons: [
        {
          id: 'safety',
          title: 'Radiation and Safety',
          summary: 'Doses, distance and shielding',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Measuring dose',
              body: r`The biological effect of radiation is measured by the **effective dose**, in sieverts (Sv). Everyday doses are tiny, so we use millisieverts (mSv) and microsieverts (µSv):

| Source | Dose |
|---|---|
| Eating a banana (potassium-40) | 0.1 µSv |
| Flight across the US | about 40 µSv |
| Chest X-ray | about 0.02 mSv |
| Natural background, per year (world average) | about 2.4 mSv |
| CT scan of the chest | about 7 mSv |
| Level linked to a measurable rise in cancer risk | about 100 mSv |`,
            },
            {
              type: 'numeric',
              title: 'A year of background',
              prompt: r`How many chest X-rays (0.02 mSv each) add up to a year of natural background radiation (2.4 mSv)?`,
              unit: 'X-rays',
              answer: 120,
              wrong: [{ v: 12, why: '2.4 ÷ 0.02 = 120.' }, { v: 0.048, tol: 0.001, why: 'Divide the background by the X-ray dose, not multiply.' }],
              explain: r`$\frac{2.4}{0.02} = 120$. Most of the background comes from radon gas seeping out of rocks, with smaller parts from cosmic rays, food (like potassium-40 in bananas) and the ground. Medical scans are the largest man-made contribution.`,
            },
            {
              type: 'interactive',
              title: 'Lead shielding',
              body: r`Gamma rays aren't stopped completely by a shield; each **half-value layer** of material cuts their intensity in half. For this source, the half-value layer of lead is 1 cm. How thick a shield reduces the intensity to **1%** or less?`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 10, ymin: 0, ymax: 105, grid: false, height: 260, axes: { xlabel: 'lead thickness (cm)', ylabel: 'intensity (%)', xticks: 1, yticks: 25 },
                params: { x: { min: 0, max: 10, step: 0.1, value: 2, label: 'thickness', color: 'coral', format: (v) => `${v.toFixed(1)} cm` } },
                curves: [{ f: (x) => 100 * 2 ** -x, color: 'violet', width: 3 }, { f: () => 1, color: 'teal', dash: true }],
                points: [{ x: (p) => p.x, y: (p) => 100 * 2 ** -p.x, color: 'coral' }],
                readout: (p) => `${p.x.toFixed(1)} cm of lead lets through **${sig(100 * 2 ** -p.x, 3)}%**`,
                goal: (p) => 100 * 2 ** -p.x <= 1 && p.x <= 6.75,
                hint: r`You need $2^{-x} \le 0.01$: how many halvings make 1/100?`,
                solution: { x: 6.7 },
              },
              explain: r`About **6.7 cm**: $2^{-6.64} = \frac{1}{100}$. Seven halvings give $\frac{1}{128}$. Alpha particles are stopped by paper and beta particles by a few millimetres of aluminium, but gammas only fade exponentially, which is why reactors and X-ray rooms use thick lead and concrete.`,
            },
            {
              type: 'numeric',
              title: 'Distance is a shield',
              prompt: r`Radiation from a small source spreads out like light, so its intensity falls as $\frac{1}{r^2}$. A technician moves from 1 m to 3 m away from a source. By what factor does their dose rate drop?`,
              unit: '×',
              answer: 9,
              wrong: [{ v: 3, why: 'Intensity falls as the square of the distance.' }],
              explain: r`$3^2 = 9$ times lower. **Time, distance and shielding** are the three rules of radiation protection: spend less time near a source, stay farther away, and put material in between.`,
            },
            {
              type: 'mcq',
              title: 'Grays and sieverts',
              prompt: r`Absorbed radiation energy is measured in grays (joules per kg). Doses for health are quoted in **sieverts**. Why the different unit?`,
              choices: [
                { t: r`Sieverts weight the dose by the type of radiation and the sensitivity of the tissue`, ok: true },
                { t: r`Sieverts are just smaller grays`, why: r`They have the same basic dimension, but sieverts include weighting factors.` },
                { t: r`Grays are only for X-rays`, why: r`Grays apply to any radiation; sieverts estimate biological harm.` },
              ],
              explain: r`One gray of alpha particles does about 20 times the biological damage of one gray of gamma rays, and some organs are more sensitive than others. The sievert folds these factors in to estimate health risk.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Iodine tablets',
              prompt: r`After a reactor accident releases radioactive iodine-131, people nearby may be told to take potassium iodide tablets. How do the tablets help?`,
              choices: [
                { t: 'They fill the thyroid gland with ordinary iodine, so it absorbs little of the radioactive kind', ok: true },
                { t: 'They make the iodine-131 decay faster', why: 'Nothing chemical changes a nucleus’s decay rate. The tablets work on the body, not the isotope.' },
                { t: 'They shield the body from gamma rays', why: 'A tablet can’t block radiation from outside. It changes what the body takes in.' },
              ],
              explain: r`The thyroid concentrates iodine to make hormones, and it can't tell iodine-131 from stable iodine-127. Saturate it with the stable kind first and the radioactive iodine passes out of the body instead. With an 8-day half-life, iodine-131 is mostly gone within a couple of months; after Chernobyl it caused thousands of thyroid cancers in children who drank contaminated milk.`,
            },
          ],
          recap: [
            'Doses are measured in sieverts; natural background is about 2.4 mSv per year.',
            'Each half-value layer halves gamma intensity; distance cuts dose as 1/r².',
            'Internal contamination (alpha emitters, iodine-131) is the most dangerous kind.',
          ],
        },
        {
          id: 'reactor',
          title: 'Taming the Chain Reaction',
          summary: 'Moderators, delayed neutrons and control',
          icon: 'bolt',
          steps: [
            {
              type: 'explain',
              title: 'Slow neutrons work best',
              body: r`Fission neutrons are born fast, at about 2 MeV. But uranium-235 is hundreds of times more likely to absorb a **slow** neutron (about 0.025 eV, the energy of thermal motion at room temperature). Most reactors therefore surround the fuel with a **moderator**: a material whose nuclei slow the neutrons down by collisions, like a ball bouncing off other balls.`,
            },
            {
              type: 'interactive',
              title: 'Choosing a moderator',
              body: r`A neutron loses the most energy in a collision with something of similar mass, as in a head-on collision of two billiard balls. Choose a moderator to see how many collisions it takes to slow a neutron from 2 MeV to 0.025 eV. Find the material that needs the **fewest** collisions.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 4, ymin: 0, ymax: 130, grid: false, height: 260, axes: { xlabel: 'moderator', ylabel: 'collisions needed', xticks: 10, yticks: 25 },
                params: { m: { min: 0, max: 2, step: 1, value: 2, label: 'moderator', color: 'violet', format: (v) => MODS[v][0] } },
                extra: ({ plot, p, s }) => [0, 1, 2].map((i) => { const n = Math.log(2e6 / 0.025) / xi(MODS[i][1]); return [s('rect', { x: plot.X(i + 0.6), y: plot.Y(n), width: plot.X(0.8) - plot.X(0), height: plot.Y(0) - plot.Y(n), rx: 4, class: i === p.m ? 'fl-coral' : 'fl-violet-soft' }), s('text', { x: plot.X(i + 1), y: plot.Y(n) - 8, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: MODS[i][0].split(' ')[0] })]; }),
                readout: (p) => { const A = MODS[p.m][1], n = Math.log(2e6 / 0.025) / xi(A); return `${MODS[p.m][0]}: about **${Math.round(n)} collisions**`; },
                goal: (p) => p.m === 0,
                hint: 'Which nucleus has the same mass as a neutron?',
                solution: { m: 0 },
              },
              explain: r`**Hydrogen** (in ordinary water) needs only about 18 collisions, because a proton has almost the same mass as a neutron. Carbon (graphite) needs about 115. But hydrogen also **absorbs** some neutrons, so ordinary-water reactors need fuel enriched in U-235, while heavy-water reactors (deuterium absorbs far fewer neutrons) can burn natural uranium.`,
            },
            {
              type: 'numeric',
              title: 'Billiard-ball physics',
              prompt: r`In a head-on elastic collision, a neutron (mass 1) hitting a carbon nucleus (mass 12) at rest keeps a fraction $\left(\frac{A-1}{A+1}\right)^2$ of its energy. What fraction does it keep after a head-on hit on carbon? (3 decimal places.)`,
              answer: (11 / 13) ** 2,
              tol: 0.002,
              wrong: [{ v: 11 / 13, tol: 0.002, why: 'Square it: energy goes as speed squared.' }],
              explain: r`$\left(\frac{11}{13}\right)^2 \approx 0.716$: even a direct hit only removes 28% of the energy, and glancing hits remove less. Against hydrogen ($A = 1$) a head-on collision can stop the neutron dead.`,
            },
            {
              type: 'mcq',
              title: 'Delayed neutrons',
              prompt: r`Prompt neutrons cause the next fission within about a ten-thousandth of a second in a power reactor. If all neutrons were prompt, why would a reactor be almost impossible to control?`,
              choices: [
                { t: 'Power could multiply many times over in a fraction of a second, far faster than control rods can move', ok: true },
                { t: 'The neutrons would be too slow to cause fission', why: 'Speed of the neutrons isn’t the issue; the timescale of growth is.' },
                { t: 'Control rods only absorb delayed neutrons', why: 'Rods absorb all neutrons. The issue is how fast the population can change.' },
              ],
              explain: r`About 0.65% of fission neutrons are emitted seconds later by decaying fission fragments. Reactors are designed to be critical only when these **delayed neutrons** are counted, so the power changes over seconds to minutes, slow enough for control rods and automatic systems. A reactor that goes critical on prompt neutrons alone ("prompt critical"), as at Chernobyl in 1986, can surge uncontrollably.`,
            },
            {
              type: 'numeric',
              title: 'Neutrons to spare',
              prompt: r`Each uranium fission releases about 2.4 neutrons. For a steady chain reaction, on average exactly 1 must go on to cause another fission. What percentage of the neutrons must be lost or absorbed elsewhere? (Nearest whole number.)`,
              unit: '%',
              answer: 1.4 / 2.4 * 100,
              tol: 0.6,
              explain: r`$\frac{1.4}{2.4} \approx 58\%$. Control rods absorb just enough to keep the multiplication factor at exactly 1; pull them out a little and the power rises, push them in and it falls.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Built-in safety',
              prompt: r`In a water-moderated reactor, if the core overheats and the water boils into steam, what happens to the chain reaction?`,
              choices: [
                { t: 'It slows down: steam is a poor moderator, so fewer neutrons are slowed enough to cause fission', ok: true },
                { t: 'It speeds up: hotter means more fission', why: 'In a water-moderated design, losing moderator removes slow neutrons and reduces fission.' },
                { t: 'Nothing changes', why: 'The moderator is essential to the chain reaction in these reactors.' },
              ],
              explain: r`This **negative void coefficient** is a built-in safety feature of most water-cooled, water-moderated reactors: overheating automatically reduces power. Chernobyl's RBMK design, moderated by graphite, had a **positive** void coefficient at low power: steam bubbles made it more reactive, which helped turn an accident into a disaster.`,
            },
          ],
          recap: [
            'Moderators slow fast neutrons by collisions; hydrogen works best per collision.',
            'Delayed neutrons (about 0.65%) make reactors controllable.',
            'A negative void coefficient makes overheating reduce power automatically.',
          ],
        },
      ],
    },
  ],
};
