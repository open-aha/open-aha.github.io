import { fix } from '../lib/svg.js';

const r = String.raw;
const D = Math.PI / 180;
const S2 = Math.SQRT1_2;
const H = ([a, b]) => [(a + b) * S2, (a - b) * S2];
// amplitudes keep a fixed 3 decimals, so they never change length (DESIGN.md, Live numbers)
const f2 = (v) => fix(v, 3);

// draw a qubit state on the unit circle (horizontal = amplitude of |0⟩, vertical = amplitude of |1⟩), plus probability bars
const qubitPicture = ({ plot, s, arrow }, [a, b], extra = []) => {
  const u = plot.X(1) - plot.X(0);
  const bar = (x, pr, label, cls) => [
    s('rect', { x: plot.X(x - 0.22), y: plot.Y(-1.05 + 2.1 * pr), width: plot.X(x + 0.22) - plot.X(x - 0.22), height: Math.max(0, plot.Y(-1.05) - plot.Y(-1.05 + 2.1 * pr)), rx: 4, class: cls }),
    s('rect', { x: plot.X(x - 0.22), y: plot.Y(1.05), width: plot.X(x + 0.22) - plot.X(x - 0.22), height: plot.Y(-1.05) - plot.Y(1.05), rx: 4, fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 1.5 }),
    s('text', { x: plot.X(x), y: plot.Y(-1.05) + 22, class: 'lbl', 'text-anchor': 'middle', text: label }),
    s('text', { x: plot.X(x), y: plot.Y(1.05) - 8, class: 'tick', 'text-anchor': 'middle', text: `${Math.round(pr * 100)}%` }),
  ];
  return [
    s('circle', { cx: plot.X(0), cy: plot.Y(0), r: u, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2 }),
    s('line', { x1: plot.X(-1.15), x2: plot.X(1.15), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--line-2)', 'stroke-width': 1.5 }),
    s('line', { x1: plot.X(0), x2: plot.X(0), y1: plot.Y(-1.15), y2: plot.Y(1.15), stroke: 'var(--line-2)', 'stroke-width': 1.5 }),
    s('text', { x: plot.X(1.08), y: plot.Y(0) + 20, class: 'lbl', text: '|0⟩' }),
    s('text', { x: plot.X(0) + 8, y: plot.Y(1.12), class: 'lbl', text: '|1⟩' }),
    ...extra,
    arrow(plot.X(0), plot.Y(0), plot.X(a), plot.Y(b), { color: 'var(--violet)', width: 4 }),
    ...bar(2.0, a * a, 'P(0)', 'fl-blue'),
    ...bar(2.75, b * b, 'P(1)', 'fl-coral'),
  ];
};

const X = ([a, b]) => [b, a];
const Zg = ([a, b]) => [a, -b];
const MIDGATES = [['nothing', (v) => v], ['X', X], ['Z', Zg]];
const seeded = (seed) => { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
// BB84: 24 photons with random bits and bases; Eve (optionally) measures each in a random basis and resends
const bb84 = (seed, eve) => { const u = seeded(seed * 7 + 1), rows = []; for (let i = 0; i < 24; i++) { const bit = u() < 0.5 ? 0 : 1, aB = u() < 0.5 ? '+' : '×', bB = u() < 0.5 ? '+' : '×', eB = u() < 0.5 ? '+' : '×'; let sent = bit, basis = aB; if (eve) { const eBit = eB === aB ? bit : u() < 0.5 ? 0 : 1; sent = eBit; basis = eB; } const got = bB === basis ? sent : u() < 0.5 ? 0 : 1; rows.push({ bit, aB, bB, got, keep: aB === bB }); } return rows; };

// 16 items, item 11 is marked. Each Grover round: flip the marked amplitude's sign, then reflect every amplitude about the mean.
const GROVER = (() => {
  const st = [new Array(16).fill(0.25)];
  for (let r = 0; r < 3; r++) {
    const f = st[st.length - 1].slice(); f[11] = -f[11];
    const m = f.reduce((a, b) => a + b, 0) / 16;
    st.push(f, f.map((a) => 2 * m - a));
  }
  return st; // [start, flipped 1, after 1, flipped 2, after 2, flipped 3, after 3]
})();
const groverAt = (t) => {
  const r = Math.min(3, Math.floor(t / 4.2)), u = t - 4.2 * r;
  if (r >= 3) return { amps: GROVER[6], mean: null, round: 3, stage: 'done' };
  const a = GROVER[2 * r], f = GROVER[2 * r + 1], b = GROVER[2 * r + 2], m = f.reduce((x, y) => x + y, 0) / 16, mix = (x, y, e) => x.map((v, i) => v + (y[i] - v) * e);
  const e = (lo, hi) => { const q = Math.min(1, Math.max(0, (u - lo) / (hi - lo))); return q * q * (3 - 2 * q); };
  if (u < 2.1) return { amps: mix(a, f, e(0.6, 1.4)), mean: u > 1.6 ? m : null, round: r, stage: 'flip' };
  return { amps: mix(f, b, e(2.4, 3.4)), mean: m, round: r, stage: 'reflect' };
};

export default {
  id: 'quantumcomp',
  subject: 'physics',
  title: 'Quantum Computing',
  level: 'Advanced',
  cover: 'quantumcomp',
  tagline: 'Qubits, interference, entanglement, unbreakable keys and error correction.',
  description: r`A quantum computer stores information in qubits, which can be in superpositions of 0 and 1. Learn how qubits are described by amplitudes, how gates rotate and reflect them, how interference makes wrong answers cancel, why entanglement makes quantum states so hard to simulate, what Grover's and Shor's algorithms really promise, how quantum physics catches eavesdroppers, and how fragile qubits are protected from errors.`,
  prereq: 'Quantum Physics',
  chapters: [
    {
      title: 'Qubits',
      summary: 'Amplitudes and measurement.',
      lessons: [
        {
          id: 'qubit',
          title: 'The Qubit',
          summary: 'Superposition and measurement',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'More than a bit',
              body: r`An ordinary bit is 0 or 1. A **qubit** (quantum bit) can be in a **superposition** of both:
$$|\psi\rangle = \alpha\,|0\rangle + \beta\,|1\rangle$$
The numbers $\alpha$ and $\beta$ are called **amplitudes**. When you measure the qubit, you get 0 with probability $|\alpha|^2$ and 1 with probability $|\beta|^2$, and afterwards the qubit **is** whatever you measured. Since the probabilities add to 1:
$$|\alpha|^2 + |\beta|^2 = 1$$
In general amplitudes are complex numbers, but real amplitudes (which can be negative!) already show the key ideas.`,
            },
            {
              type: 'numeric',
              title: 'Measuring',
              prompt: r`A qubit is in the state $0.6\,|0\rangle + 0.8\,|1\rangle$. What's the probability of measuring 1?`,
              answer: 0.64,
              tol: 0.001,
              wrong: [{ v: 0.8, tol: 0.001, why: r`That's the amplitude. The probability is its square.` }, { v: 0.36, tol: 0.001, why: r`That's $0.6^2$, the probability of measuring **0**.` }],
              explain: r`$0.8^2 = 0.64$. And $0.6^2 + 0.8^2 = 0.36 + 0.64 = 1$ ✓.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'The qubit circle',
              prompt: r`With real amplitudes, a qubit is a point on a circle: $\alpha = \cos\theta$, $\beta = \sin\theta$. Drag the arrow to a state that gives 1 with probability **75%**.`,
              widget: {
                kind: 'graph', xmin: -1.4, xmax: 3.2, ymin: -1.35, ymax: 1.35, grid: false, axes: false, equal: true, maxWidth: 560,
                params: { th: { min: 0, max: 359, step: 1, value: 0, slider: false } },
                points: [{ x: (p) => Math.cos(p.th * D), y: (p) => Math.sin(p.th * D), color: 'violet', drag: { key: 'th', fn: (x, y) => { let a = Math.round(Math.atan2(y, x) / D); if (a < 0) a += 360; return { th: a % 360 }; } }, ariaLabel: 'Rotate the qubit state' }],
                extra: (ctx) => qubitPicture(ctx, [Math.cos(ctx.p.th * D), Math.sin(ctx.p.th * D)]),
                readout: (p) => r`$\theta = ${p.th}°$: $\;|\psi\rangle = ${f2(Math.cos(p.th * D))}\,|0\rangle ${Math.sin(p.th * D) < 0 ? '-' : '+'} ${f2(Math.abs(Math.sin(p.th * D)))}\,|1\rangle$`,
                goal: (p) => Math.abs(Math.sin(p.th * D) ** 2 - 0.75) < 0.01,
                hint: r`You need $\sin^2\theta = 0.75$, so $\sin\theta = \pm\frac{\sqrt3}{2}$.`,
                solution: { th: 60 },
              },
              explain: r`$\theta = 60°$ gives $\frac12|0\rangle + \frac{\sqrt3}{2}|1\rangle$, with $P(1) = \frac34$. So do $120°$, $240°$ and $300°$: states with different signs give the **same** probabilities. Those signs are invisible to a single measurement, but they matter enormously when amplitudes combine, as you'll see.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Measuring many copies',
              body: r`One measurement gives a single 0 or 1. To learn the probabilities, you prepare many identical copies and measure each. Choose a state and see the results of 200 measurements.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 20, ymin: 0, ymax: 10, grid: false, axes: false, height: 220,
                params: { th: { min: 0, max: 90, step: 5, value: 30, label: 'θ', color: 'violet', format: (v) => `${v}°` }, seed: { min: 1, max: 20, step: 1, value: 1, label: 'new batch', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ plot, p, s }) => { const u = seeded(p.seed * 31 + p.th), P1 = Math.sin(p.th * D) ** 2, els = []; for (let i = 0; i < 200; i++) { const one = u() < P1; els.push(s('rect', { x: plot.X(i % 20) + 2, y: plot.Y(10 - Math.floor(i / 20)) + 2, width: plot.X(1) - plot.X(0) - 4, height: plot.Y(0) - plot.Y(1) - 4, rx: 3, class: one ? 'fl-coral' : 'fl-blue' })); } return els; },
                readout: (p) => { const u = seeded(p.seed * 31 + p.th), P1 = Math.sin(p.th * D) ** 2; let n1 = 0; for (let i = 0; i < 200; i++) if (u() < P1) n1++; return `measured 1 (coral): **${n1}** of 200 = ${(n1 / 2).toFixed(1)}% · predicted $\\sin^2\\theta$ = ${(100 * P1).toFixed(1)}%`; },
              },
              after: r`Each outcome is random, but the fractions settle near $\sin^2\theta$, with the usual statistical wobble of a few percent. After a measurement the qubit **is** the result: measure the same qubit again and you'll get the same answer every time.`,
            },
            {
              type: 'numeric',
              title: 'Amplitudes for ten qubits',
              prompt: r`Describing $n$ qubits takes $2^n$ amplitudes, one for every bit string. How many amplitudes describe 10 qubits?`,
              answer: 1024,
              explain: r`$2^{10} = 1{,}024$. For 300 qubits you would need more amplitudes than there are atoms in the observable universe, which is why quantum computers can’t easily be simulated.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Measure twice',
              prompt: r`A qubit in the state $\frac{1}{\sqrt2}(|0\rangle + |1\rangle)$ is measured and gives 1. It is immediately measured again. What happens?`,
              choices: [
                { t: 'It gives 1 again, with certainty: the first measurement left it in |1⟩', ok: true },
                { t: 'It gives 0 or 1 with equal probability again', why: 'The superposition is gone. Measurement leaves the qubit in the state that was observed.' },
                { t: 'It gives 0, to balance out', why: 'There’s no balancing. The qubit is now simply |1⟩.' },
              ],
              explain: r`Measurement **collapses** the superposition: the qubit is left in $|1\rangle$. This is why a quantum computer must avoid measuring (or letting its environment "measure") its qubits mid-calculation: any leak of information destroys the superposition. Keeping qubits isolated is the central engineering challenge.`,
            },
          ],
          recap: [
            r`A qubit is $\alpha|0\rangle + \beta|1\rangle$, with $|\alpha|^2 + |\beta|^2 = 1$.`,
            'Measurement gives 0 or 1 with probabilities equal to the squared amplitudes.',
            'Amplitudes can be negative; signs don’t change probabilities directly.',
          ],
        },
        {
          id: 'gates',
          title: 'Gates & Interference',
          summary: 'Amplitudes that cancel',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'Quantum gates',
              body: r`Quantum programs are built from **gates** that transform amplitudes. The **X gate** is a quantum NOT: it swaps $|0\rangle$ and $|1\rangle$. The **Hadamard gate** $H$ creates superpositions:
$$H|0\rangle = \tfrac{1}{\sqrt2}\big(|0\rangle + |1\rangle\big), \qquad H|1\rangle = \tfrac{1}{\sqrt2}\big(|0\rangle - |1\rangle\big)$$
On the qubit circle, $H$ is a **reflection** across the dashed line at $22.5°$.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Hadamard twice',
              body: r`Choose a starting state and apply $H$ zero, one or two times.`,
              widget: {
                kind: 'graph', xmin: -1.4, xmax: 3.2, ymin: -1.35, ymax: 1.35, grid: false, axes: false, equal: true, maxWidth: 560,
                params: {
                  start: { min: 0, max: 1, step: 1, value: 0, label: 'start in', color: 'violet', format: (v) => (v ? '$|1\\rangle$' : '$|0\\rangle$') },
                  n: { min: 0, max: 2, step: 1, value: 0, label: 'H gates applied', color: 'teal' },
                },
                extra: (ctx) => {
                  const { plot, p, s } = ctx;
                  let st = p.start ? [0, 1] : [1, 0];
                  for (let i = 0; i < p.n; i++) st = H(st);
                  const c = Math.cos(22.5 * D), sn = Math.sin(22.5 * D);
                  const line = s('line', { x1: plot.X(-1.2 * c), y1: plot.Y(-1.2 * sn), x2: plot.X(1.2 * c), y2: plot.Y(1.2 * sn), stroke: 'var(--teal)', 'stroke-width': 2, 'stroke-dasharray': '6 5' });
                  return qubitPicture(ctx, st, [line]);
                },
                readout: (p) => {
                  let st = p.start ? [0, 1] : [1, 0];
                  for (let i = 0; i < p.n; i++) st = H(st);
                  return r`state: $${f2(st[0])}\,|0\rangle ${st[1] < -1e-9 ? '-' : '+'} ${f2(Math.abs(st[1]))}\,|1\rangle$`;
                },
              },
              after: r`One $H$ gives a 50–50 superposition. A second $H$ brings it **back** to where it started, with certainty. A coin flipped twice would still be random; a qubit isn't.`,
            },
            {
              type: 'mcq',
              title: 'Where did the randomness go?',
              prompt: r`Starting from $|0\rangle$, apply $H$ twice. Writing out the second step: $H\Big(\tfrac{1}{\sqrt2}|0\rangle + \tfrac{1}{\sqrt2}|1\rangle\Big) = \tfrac12\big(|0\rangle + |1\rangle\big) + \tfrac12\big(|0\rangle - |1\rangle\big)$. Why is the result exactly $|0\rangle$?`,
              choices: [
                { t: 'The two |1⟩ amplitudes, +½ and −½, cancel, while the |0⟩ amplitudes add up to 1', ok: true },
                { t: 'The qubit was secretly 0 all along', why: 'Starting from |1⟩, two H gates give |1⟩. The outcome comes from interference, not a hidden value.' },
                { t: 'Measuring in between resets it', why: 'There’s no measurement here. If you measured in between, the result would be random.' },
              ],
              explain: r`This is **interference**: amplitudes, unlike probabilities, can be negative and cancel out. Every quantum algorithm is choreographed interference, arranging for the amplitudes of wrong answers to cancel and the right answer's to add up. (Measure between the two gates and you destroy the superposition: then the final result is 50–50.)`,
            },
            {
              type: 'interactive',
              title: 'Sandwich a gate',
              body: r`Start in $|0\rangle$, apply $H$, then a middle gate of your choice, then $H$ again. The **Z gate** flips the sign of the $|1\rangle$ amplitude, a change no measurement can see on its own. Choose the middle gate so the output is $|1\rangle$ with certainty.`,
              widget: {
                kind: 'graph', xmin: -1.4, xmax: 3.2, ymin: -1.35, ymax: 1.35, grid: false, axes: false, equal: true, maxWidth: 560,
                params: { g: { min: 0, max: 2, step: 1, value: 0, label: 'middle gate', color: 'violet', format: (v) => MIDGATES[v][0] } },
                extra: (ctx) => qubitPicture(ctx, H(MIDGATES[ctx.p.g][1](H([1, 0])))),
                readout: (p) => { const mid = MIDGATES[p.g][1](H([1, 0])), out = H(mid); return `after H: $${f2(H([1, 0])[0])}|0\\rangle + ${f2(H([1, 0])[1])}|1\\rangle$ · after ${MIDGATES[p.g][0]}: $${f2(mid[0])}|0\\rangle ${mid[1] < 0 ? '-' : '+'} ${f2(Math.abs(mid[1]))}|1\\rangle$ · output: $${f2(out[0])}|0\\rangle ${out[1] < -1e-9 ? '-' : '+'} ${f2(Math.abs(out[1]))}|1\\rangle$`; },
                goal: (p) => p.g === 2,
                hint: 'X does nothing to an equal superposition. Try the gate that flips a sign.',
                solution: { g: 2 },
              },
              explain: r`With Z in the middle, $H Z H$ turns $|0\rangle$ into $|1\rangle$: the hidden sign flip is converted, by interference, into a definite bit flip. ($HZH = X$.) Surprisingly, X in the middle does **nothing**: $\frac{1}{\sqrt2}(|0\rangle + |1\rangle)$ is unchanged by swapping. Hidden signs (**phases**) are where quantum algorithms do their work.`,
            },
            {
              type: 'mcq',
              title: 'Phases that matter',
              prompt: r`The Z gate flips the sign of the $|1\rangle$ amplitude. Applied to a qubit and then measured straight away, it never changes the probabilities. So why is it useful?`,
              choices: [
                { t: r`Sign changes affect how amplitudes interfere in later gates, such as a Hadamard`, ok: true },
                { t: r`It isn’t: it does nothing`, why: r`H·Z·H equals X, a bit flip: the sign change becomes visible after interference.` },
                { t: r`It speeds up measurement`, why: r`Measurement speed has nothing to do with it.` },
              ],
              explain: r`Probabilities are squares of amplitudes, so signs are invisible to immediate measurement. But when amplitudes are later combined, signs decide whether they add or cancel. Steering these signs is the whole art of quantum algorithms.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Three Hadamards',
              prompt: r`Start in $|0\rangle$ and apply $H$ three times, then measure. What's the probability of getting 1?`,
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: 0, why: 'Two Hs cancel, but there are three: the result is the same as one H.' }, { v: 1, why: r`$HHH = H$, which gives an equal superposition.` }],
              explain: r`$HH$ is the identity, so $HHH = H$: the result is $\frac{1}{\sqrt2}(|0\rangle + |1\rangle)$ and $P(1) = \frac12$. Gates compose like moves on the circle: two reflections in the same line undo each other.`,
            },
          ],
          recap: [
            'Gates transform amplitudes; H creates and undoes superpositions.',
            r`$HH = $ identity: amplitudes interfere.`,
            'Quantum algorithms arrange for wrong answers to cancel.',
          ],
        },
      ],
    },
    {
      title: 'Many Qubits',
      summary: 'Entanglement and algorithms.',
      lessons: [
        {
          id: 'entangle',
          title: 'Entanglement',
          summary: 'States that can’t be split',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Two qubits',
              body: r`Two qubits have four basis states, $|00\rangle, |01\rangle, |10\rangle, |11\rangle$, and a general state has an amplitude for each. A famous example is the **Bell state**:
$$\tfrac{1}{\sqrt2}\big(|00\rangle + |11\rangle\big)$$
Measure either qubit and you get 0 or 1 with equal probability, but the two results always **agree**. This state can't be written as "qubit A is in some state, and qubit B is in some state": the qubits are **entangled**.`,
            },
            {
              type: 'mcq',
              title: 'Spooky?',
              prompt: r`Alice and Bob share a Bell pair and travel far apart. Alice measures her qubit and gets 1. Can she use this to send Bob a message instantly?`,
              choices: [
                { t: 'No: Bob’s result is now certain to be 1, but he just sees a random outcome and can’t tell anything happened', ok: true },
                { t: 'Yes: choosing to measure sends a signal faster than light', why: 'Alice can’t choose her outcome, and Bob’s results look random either way. The correlation only shows when they compare notes by ordinary means.' },
                { t: 'Yes, if she measures fast enough', why: 'Speed doesn’t matter. Entanglement creates correlations, not a communication channel.' },
              ],
              explain: r`Entanglement gives correlations stronger than any classical system can produce (as Bell's theorem shows, and experiments confirmed, earning the 2022 Nobel Prize in Physics), but it never transmits information faster than light. Still, it's a resource: quantum teleportation and quantum cryptography both rely on it.`,
            },
            {
              type: 'interactive',
              title: 'Tilted detectors',
              body: r`Alice and Bob measure the two halves of a Bell pair with detectors turned to angles $a$ and $b$. For this entangled state, their results agree with probability $\cos^2(a - b)$. Set Bob's detector so that they agree exactly **75%** of the time.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 90, ymin: 0, ymax: 1.05, grid: false, height: 260, axes: { xlabel: 'angle between detectors (°)', ylabel: 'P(agree)', xticks: 15, yticks: 0.25 },
                params: { b: { min: 0, max: 90, step: 0.5, value: 10, label: 'Bob’s angle', color: 'coral', format: (v) => `${fix(v, 1)}°` } },
                curves: [{ f: (x) => Math.cos(x * D) ** 2, color: 'violet', width: 3 }, { f: (x) => 1 - x / 90, color: 'muted', dash: true }, { f: () => 0.75, color: 'teal', dash: true }],
                points: [{ x: (p) => p.b, y: (p) => Math.cos(p.b * D) ** 2, color: 'coral' }],
                readout: (p) => `Alice at 0°, Bob at ${fix(p.b, 1)}°: they agree **${(100 * Math.cos(p.b * D) ** 2).toFixed(1)}%** of the time`,
                goal: (p) => Math.abs(Math.cos(p.b * D) ** 2 - 0.75) < 0.004,
                hint: r`Solve $\cos^2 b = \frac34$.`,
                solution: { b: 30 },
              },
              explain: r`At $30°$ they agree 75% of the time. The dashed straight line is what a simple **local hidden-variable** model (pre-set answers carried by each particle) predicts. The quantum curve bulges above it, and in 1964 John Bell proved that no theory of that kind, however clever, can reproduce the quantum correlations at every angle. Experiments by Clauser, Aspect and Zeilinger confirmed the quantum prediction.`,
            },
            {
              type: 'numeric',
              title: 'Breaking Bell’s limit',
              prompt: r`In the CHSH version of Bell's test, any local hidden-variable theory gives a score $S \le 2$. Quantum mechanics predicts a maximum of $2\sqrt 2$. What is that? (3 decimal places.)`,
              lhs: r`$S =$`,
              answer: 2 * Math.SQRT2,
              tol: 0.001,
              wrong: [{ v: Math.SQRT2, tol: 0.001, why: r`Multiply by 2: $2\sqrt2$.` }],
              explain: r`$2\sqrt2 \approx 2.828$, about 41% above the classical limit. Experiments since 1982 have measured values near 2.7–2.8, and "loophole-free" tests in 2015 closed the last escape routes. Nature is not locally realistic.`,
            },
            {
              type: 'numeric',
              title: 'Sixty degrees apart',
              prompt: r`Alice and Bob share a Bell pair and set their detectors $60°$ apart. Their results agree with probability $\cos^2(a - b)$. How often do they agree? (Give a decimal.)`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 0.5, tol: 0.001, why: r`That's $\cos 60°$. Square it: $\cos^2 60° = \frac14$.` }],
              explain: r`$\cos^2 60° = \frac14$: they agree only a quarter of the time. At $0°$ they always agree, at $90°$ never, and at $30°$ three times in four. It's these specific numbers, compared across several angles, that no pre-set "hidden instructions" can reproduce: the heart of Bell's theorem.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Simulating 50 qubits',
              prompt: r`To simulate 50 qubits on an ordinary computer, you'd store $2^{50}$ amplitudes at 16 bytes each. How many **petabytes** is that? (1 PB $= 10^{15}$ bytes; 1 decimal place.)`,
              unit: 'PB',
              answer: (2 ** 50 * 16) / 1e15,
              tol: 0.06,
              wrong: [{ v: (2 ** 50) / 1e15, tol: 0.01, why: 'Each amplitude takes 16 bytes. Multiply by 16.' }],
              explain: r`$2^{50} \times 16 \approx 1.8 \times 10^{16}$ bytes $\approx 18$ PB, about the storage of a large data centre. At 300 qubits, there'd be more amplitudes than atoms in the observable universe. That's why Richard Feynman suggested in 1981 that simulating quantum systems needs quantum computers.`,
            },
          ],
          recap: [
            'Entangled qubits have correlated outcomes and can’t be described separately.',
            'Entanglement doesn’t allow faster-than-light communication.',
            r`$n$ qubits need $2^n$ amplitudes, which quickly overwhelms classical computers.`,
          ],
        },
        {
          id: 'algorithms',
          title: 'Quantum Algorithms',
          summary: 'What quantum computers are good for',
          icon: 'bolt',
          steps: [
            {
              type: 'mcq',
              title: 'A common myth',
              prompt: r`A popular claim: "A quantum computer tries every answer at once, so it's exponentially faster at everything." What's wrong with it?`,
              choices: [
                { t: 'Measuring gives just one random outcome; speed-ups only come when interference can be arranged to favour the right answer, which works only for special problems', ok: true },
                { t: 'Nothing: it’s exactly right', why: 'A superposition of all answers is easy to make, but measuring it gives a random one. That alone is no better than guessing.' },
                { t: 'Quantum computers are actually slower at everything', why: 'For some problems, like factoring and simulating molecules, they’re expected to be dramatically faster.' },
              ],
              explain: r`Superposition alone is useless: measurement picks one outcome at random. The art is designing interference so that wrong answers cancel. That's possible only for problems with special structure, so quantum computers will be specialised accelerators, not universal speed-ups.`,
            },
            {
              type: 'numeric',
              title: 'Grover’s search',
              prompt: r`To find one marked item among $N$ unsorted items, a classical search needs about $N/2$ checks on average. Lov Grover's quantum algorithm (1996) needs about $\frac{\pi}{4}\sqrt N$. How many steps for $N = 1{,}000{,}000$? (Nearest whole number.)`,
              unit: 'steps',
              answer: Math.round((Math.PI / 4) * 1000),
              tol: 2,
              wrong: [{ v: 500000, why: 'That’s the classical average. Grover needs about (π/4)√N.' }, { v: 1000, why: r`That's $\sqrt N$. Multiply by $\frac{\pi}{4}$.` }],
              explain: r`$\frac{\pi}{4} \times \sqrt{10^6} = \frac{\pi}{4} \times 1000 \approx 785$, compared with about 500,000 classically. A **quadratic** speed-up: impressive, but not exponential. And it's proven that no quantum algorithm can do unstructured search much faster.`,
            },
            {
              type: 'interactive',
              title: 'Grover’s rotation',
              body: r`Grover's algorithm keeps the state in a plane: the horizontal axis is "all the wrong answers", the vertical axis is "the right answer". Starting from an equal superposition of $N = 16$ items, each Grover iteration rotates the state by the same angle toward the answer. Choose how many iterations give the **highest** chance of success.`,
              widget: {
                kind: 'graph', xmin: -1.4, xmax: 3.2, ymin: -1.35, ymax: 1.35, grid: false, axes: false, equal: true, maxWidth: 560,
                params: { k: { min: 0, max: 6, step: 1, value: 1, label: 'iterations', color: 'violet' } },
                extra: (ctx) => { const t0 = Math.asin(1 / 4), a = (2 * ctx.p.k + 1) * t0; return qubitPicture(ctx, [Math.cos(a), Math.sin(a)]); },
                readout: (p) => { const t0 = Math.asin(1 / 4), a = (2 * p.k + 1) * t0; return `${p.k} iteration${p.k === 1 ? '' : 's'}: angle ${((a * 180) / Math.PI).toFixed(1)}° · chance of finding the marked item **${(100 * Math.sin(a) ** 2).toFixed(1)}%**`; },
                goal: (p) => p.k === 3,
                hint: 'Watch for the moment the arrow passes the vertical.',
                solution: { k: 3 },
              },
              explain: r`After **3** iterations the arrow sits just past vertical: a 96% chance of success, versus $\frac1{16}$ for a random guess. Keep going and it overshoots: 4 iterations drop to 58%. The optimal count is about $\frac{\pi}{4}\sqrt{N}$, here $\approx 3.1$, because each step rotates by about $\frac{2}{\sqrt N}$ radians.`,
            },
            { /*anim:quantumcomp*/
              type: 'explain',
              kicker: 'Explore',
              title: 'Grover, bar by bar',
              body: r`Sixteen possible answers start with equal amplitudes (bars). One answer is {coral:marked}. Each round has two moves: the oracle **flips the sign** of the marked amplitude, then every amplitude is **reflected about the average** (the {violet:dashed line}).`,
              widget: {
                kind: 'graph', xmin: -0.8, xmax: 16, ymin: -0.45, ymax: 1.05, grid: false, height: 300, axes: false,
                animate: { param: 't', speed: 1, max: 16, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { amps, mean } = groverAt(p.t), els = [];
                  amps.forEach((a, i) => {
                    const y0 = plot.Y(Math.max(0, a)), y1 = plot.Y(Math.min(0, a));
                    els.push(s('rect', { x: plot.X(i - 0.35 + 0.2), y: y0, width: plot.X(0.7) - plot.X(0), height: Math.max(0.5, y1 - y0), class: i === 11 ? 'fl-coral' : 'fl-blue', opacity: 0.8 }));
                  });
                  els.push(s('line', { x1: plot.X(-0.6), x2: plot.X(15.8), y1: plot.Y(0), y2: plot.Y(0), stroke: 'var(--axis)', 'stroke-width': 1.3 }));
                  if (mean != null) els.push(s('line', { x1: plot.X(-0.6), x2: plot.X(15.8), y1: plot.Y(mean), y2: plot.Y(mean), stroke: 'var(--violet)', 'stroke-width': 2, 'stroke-dasharray': '6 4' }));
                  return els;
                },
                readout: (p) => { const { amps, round, stage } = groverAt(p.t); return `${stage === 'done' ? 'after 3 rounds' : `round ${round + 1}, ${stage === 'flip' ? 'flip the marked sign' : 'reflect about the average'}`} · chance of measuring the marked answer: ${fix(100 * amps[11] ** 2, 1)}%`; },
              },
              after: r`Flipping makes the marked bar stick out below the average; reflecting about the average then throws it far above, while the others shrink a little. Each round is one turn of the same fixed angle in the rotation picture from before, so after about $\frac{\pi}{4}\sqrt{N}$ rounds (here 3, for $N = 16$) it's almost certain to be measured: 96%. A classical search would need about 8 guesses on average. One round too many, though, and the amplitude starts falling again.`,
            },
            {
              type: 'numeric',
              title: 'Grover against a key',
              prompt: r`Guessing a 128-bit encryption key means searching $N = 2^{128}$ possibilities. Grover's algorithm needs about $\sqrt N$ steps (ignoring the $\frac{\pi}{4}$). That's $2^k$ steps for what $k$?`,
              answer: 64,
              wrong: [{ v: 127, why: r`That's the classical average, $N/2 = 2^{127}$. Grover needs about $\sqrt{N}$.` }],
              explain: r`$\sqrt{2^{128}} = 2^{64}$: Grover effectively halves a key's length. $2^{64}$ slow quantum steps is still an enormous job, and switching to 256-bit keys restores $2^{128}$, which is why symmetric ciphers like AES are considered safe against quantum computers.`,
            },
            {
              type: 'mcq',
              title: 'What breaks?',
              prompt: r`Which kind of encryption would a large quantum computer threaten most?`,
              choices: [
                { t: r`Public-key systems like RSA and elliptic curves, which Shor’s algorithm breaks`, ok: true },
                { t: r`Symmetric ciphers like AES-256`, why: r`Grover’s algorithm only halves the effective key length; AES-256 stays very strong.` },
                { t: r`One-time pads`, why: r`One-time pads are information-theoretically secure, quantum computer or not.` },
              ],
              explain: r`Shor’s algorithm makes factoring and discrete logarithms easy, breaking RSA and elliptic-curve cryptography. That’s why "post-quantum" public-key algorithms are now being standardised and rolled out.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Shor’s algorithm',
              prompt: r`In 1994, Peter Shor found a quantum algorithm that factors large numbers efficiently, exponentially faster than the best known classical methods. Why does this matter?`,
              choices: [
                { t: 'Much of today’s internet security (RSA and related systems) relies on factoring and similar problems being hard', ok: true },
                { t: 'It makes all encryption breakable', why: 'Not all: the one-time pad is unbreakable, and new “post-quantum” schemes are believed to resist quantum attacks.' },
                { t: 'It has already broken RSA', why: 'Not yet. Today’s quantum computers are far too small and error-prone; the largest numbers factored with Shor’s algorithm are tiny.' },
              ],
              explain: r`Shor's algorithm uses interference to find the period of a function, which reveals the factors. Running it against real RSA keys would need large, error-corrected quantum computers, with estimates ranging from about a million to tens of millions of physical qubits. Anticipating this, standards bodies published **post-quantum** encryption standards in 2024, based on problems that quantum computers aren't known to speed up.`,
            },
          ],
          recap: [
            'Quantum speed-ups come from interference, and only for special problems.',
            r`Grover: search in about $\frac{\pi}{4}\sqrt N$ steps (quadratic speed-up).`,
            'Shor: efficient factoring, which threatens RSA and motivates post-quantum cryptography.',
          ],
        },
      ],
    },
    {
      title: 'Quantum Technology',
      summary: 'Unbreakable keys and fragile qubits.',
      lessons: [
        {
          id: 'bb84',
          title: 'Quantum Cryptography',
          summary: 'Catching an eavesdropper',
          icon: 'eye',
          steps: [
            {
              type: 'explain',
              title: 'Two kinds of measurement',
              body: r`In 1984, Charles Bennett and Gilles Brassard proposed a way to share a secret key that physics itself protects (**BB84**). Alice sends single photons, each encoding a bit in one of two **bases**: "+" (vertical/horizontal polarisation) or "×" (diagonal). Bob measures each photon in a randomly chosen basis.

If Bob's basis matches Alice's, he reads her bit correctly. If not, his result is a coin flip. Afterwards they announce (publicly) **which bases** they used, never the bits, and keep only the photons where the bases matched.`,
            },
            {
              type: 'numeric',
              title: 'How much survives?',
              prompt: r`If Alice and Bob each choose their basis at random, what fraction of the photons do they keep?`,
              answer: 0.5,
              tol: 0.001,
              wrong: [{ v: 0.25, why: 'Whatever Alice chooses, Bob matches her with probability ½.' }, { v: 1, why: 'Only photons with matching bases are kept.' }],
              explain: r`Bob's random choice matches Alice's half the time, so about **half** the photons become key bits. The rest are discarded, a price worth paying for security.`,
            },
            {
              type: 'interactive',
              title: 'Enter Eve',
              body: r`Each column is a photon. Shaded columns are the ones Alice and Bob keep (matching bases). Coral marks a kept bit where Bob's result **disagrees** with Alice's bit. Switch on Eve, who measures every photon in a random basis and resends what she saw. Then look for errors.`,
              widget: {
                kind: 'graph', xmin: -2.5, xmax: 24, ymin: -0.2, ymax: 4.4, grid: false, axes: false, height: 200,
                params: { eve: { min: 0, max: 1, step: 1, value: 0, label: 'eavesdropper', color: 'coral', format: (v) => (v ? 'Eve listening' : 'no Eve') }, seed: { min: 1, max: 30, step: 1, value: 1, label: 'new photons', color: 'blue', format: (v) => `#${v}` } },
                extra: ({ plot, p, s }) => { const rows = bb84(p.seed, p.eve), els = [], lab = ['Alice bit', 'Alice basis', 'Bob basis', 'Bob result']; lab.forEach((t, j) => els.push(s('text', { x: plot.X(-0.3), y: plot.Y(3.6 - j) + 5, 'text-anchor': 'end', class: 'tick', style: 'font-size:max(calc(11px * var(--fs, 1)), var(--fmin, 0px))', text: t }))); rows.forEach((r0, i) => { const bad = r0.keep && r0.got !== r0.bit; els.push(s('rect', { x: plot.X(i + 0.06), y: plot.Y(4.1), width: plot.X(0.88) - plot.X(0), height: plot.Y(0) - plot.Y(4), rx: 3, class: bad ? 'fl-coral-soft' : r0.keep ? 'fl-teal-soft' : 'fl-card', stroke: bad ? 'var(--coral)' : 'none' })); [r0.bit, r0.aB, r0.bB, r0.got].forEach((v, j) => els.push(s('text', { x: plot.X(i + 0.5), y: plot.Y(3.6 - j) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', text: String(v) }))); }); return els; },
                readout: (p) => { const rows = bb84(p.seed, p.eve).filter((r0) => r0.keep), bad = rows.filter((r0) => r0.got !== r0.bit).length; return `kept ${rows.length} bits · errors in the kept bits: **${bad}** (${rows.length ? Math.round((100 * bad) / rows.length) : 0}%)`; },
                goal: (p) => p.eve === 1,
                hint: 'Switch on the eavesdropper and compare the error counts.',
                solution: { eve: 1 },
              },
              explain: r`Without Eve the kept bits match perfectly. With Eve, errors appear: whenever she guesses the wrong basis (half the time), she sends Bob a photon in the wrong basis, and he then gets a random result. Alice and Bob sacrifice a sample of their key, compare it publicly, and if the error rate is too high, they know someone was listening.`,
            },
            {
              type: 'numeric',
              title: 'Eve’s footprint',
              prompt: r`Eve picks the wrong basis with probability $\frac12$. When she does, Bob's result (in the kept positions) is wrong with probability $\frac12$. What fraction of the kept bits will contain errors?`,
              answer: 0.25,
              tol: 0.001,
              wrong: [{ v: 0.5, why: 'Errors need both events: Eve’s wrong basis (½) and then Bob’s unlucky result (½).' }],
              explain: r`$\frac12 \times \frac12 = \frac14$: an intercept-and-resend attack causes about **25%** errors, impossible to miss. Cleverer attacks cause fewer errors, but none can avoid disturbing the photons, because measuring an unknown quantum state inevitably changes it.`,
            },
            {
              type: 'numeric',
              title: 'Catching Eve',
              prompt: r`If Eve intercepts every photon, each bit Alice and Bob compare shows an error with probability $\frac14$. How many bits must they compare so that the chance of seeing **no** errors (missing Eve) falls below 1%?`,
              answer: 17,
              explain: r`They need $\left(\frac34\right)^k < 0.01$: $k = 16$ gives 1.0%, $k = 17$ gives 0.75%. Sacrificing a few dozen bits makes undetected eavesdropping astronomically unlikely.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why can’t Eve copy?',
              prompt: r`Why doesn't Eve simply make a perfect copy of each photon, keep the copy, and send the original on untouched?`,
              choices: [
                { t: 'The no-cloning theorem: no process can copy an unknown quantum state', ok: true },
                { t: 'Photons are too fast to copy', why: 'Speed isn’t the issue. Copying is forbidden by the mathematics of quantum mechanics.' },
                { t: 'She can, but it’s illegal', why: 'It’s physically impossible, proved in 1982 (Wootters, Zurek and Dieks).' },
              ],
              explain: r`The **no-cloning theorem** follows directly from the linearity of quantum mechanics: a machine that copied $|0\rangle$ and $|1\rangle$ perfectly would turn a superposition into an entangled state, not two copies. That's what makes quantum key distribution secure, and also why quantum error correction can't just make backup copies.`,
            },
          ],
          recap: [
            'BB84: bits encoded in random bases; keep only the photons where bases match.',
            'An intercept-resend eavesdropper causes about 25% errors in the kept key.',
            'The no-cloning theorem makes undetected copying impossible.',
          ],
        },
        {
          id: 'errors',
          title: 'Fixing Fragile Qubits',
          summary: 'Quantum error correction',
          icon: 'check',
          steps: [
            {
              type: 'explain',
              title: 'Noise everywhere',
              body: r`Real qubits are disturbed by heat, stray fields and imperfect gates. Today's best qubits make an error roughly once in every thousand operations, but useful algorithms need billions of operations. The solution is **error correction**: spread one "logical" qubit over many physical qubits, so that errors can be detected and undone.`,
            },
            {
              type: 'interactive',
              title: 'Three are safer than one',
              body: r`The simplest code stores 0 as $|000\rangle$ and 1 as $|111\rangle$ (by entangling, not copying). If any **one** qubit flips, a majority vote recovers the bit; two or more flips fool it. If each qubit flips with probability $p$, the code fails with probability $3p^2 - 2p^3$. Find the error rate above which the code makes things **worse**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 1, ymin: 0, ymax: 1, grid: false, height: 280, axes: { xlabel: 'physical error rate p', ylabel: 'failure probability', xticks: 0.25, yticks: 0.25 },
                params: { p: { min: 0, max: 1, step: 0.01, value: 0.2, label: '$p$', color: 'coral', format: (v) => v.toFixed(2) } },
                curves: [{ f: (x) => x, color: 'muted', dash: true }, { f: (x) => 3 * x * x - 2 * x ** 3, color: 'violet', width: 3 }],
                points: [{ x: (p) => p.p, y: (p) => 3 * p.p ** 2 - 2 * p.p ** 3, color: 'coral' }],
                readout: (p) => { const L = 3 * p.p ** 2 - 2 * p.p ** 3; return `one qubit fails ${(100 * p.p).toFixed(0)}% of the time · the 3-qubit code fails **${(100 * L).toFixed(1)}%** · ${L < p.p - 1e-9 ? 'the code helps' : L > p.p + 1e-9 ? 'the code hurts' : 'break-even'}`; },
                goal: (p) => Math.abs(p.p - 0.5) < 1e-9,
                hint: 'Find where the violet curve crosses the dashed line y = p (other than at 0 and 1).',
                solution: { p: 0.5 },
              },
              explain: r`The curves cross at $p = \frac12$. Below that, redundancy helps, and dramatically so for small $p$: the failure rate drops from $p$ to about $3p^2$. This crossing is a simple example of an **error threshold**: if physical qubits are good enough, adding more of them makes the logical qubit better.`,
            },
            {
              type: 'numeric',
              title: 'A big improvement',
              prompt: r`With $p = 0.01$, what is the 3-qubit code's failure probability $3p^2 - 2p^3$? (Give a decimal; the $2p^3$ term is tiny.)`,
              answer: 3e-4 - 2e-6,
              relTol: 0.03,
              wrong: [{ v: 0.01, why: 'That’s the unprotected error rate.' }, { v: 3e-3, relTol: 0.03, why: r`Square $p$: $0.01^2 = 0.0001$, so $3p^2 = 0.0003$.` }],
              explain: r`$3 \times 10^{-4} - 2 \times 10^{-6} = 0.000298$: about 34 times better than a single qubit. Stacking codes inside codes (or using larger codes) pushes errors down exponentially, as long as $p$ stays below the threshold.`,
            },
            {
              type: 'mcq',
              title: 'Checking without looking',
              prompt: r`Measuring a qubit destroys its superposition. How can a code find out which qubit flipped without ruining the stored information?`,
              choices: [
                { t: 'It measures only whether neighbouring qubits agree (parity), which reveals the error but nothing about the stored value', ok: true },
                { t: 'It measures each qubit and rebuilds the state', why: 'Measuring each qubit would collapse the superposition and destroy the information.' },
                { t: 'It can’t: quantum errors can’t be corrected', why: 'Peter Shor showed in 1995 that they can, which was a turning point for the field.' },
              ],
              explain: r`Asking "do qubits 1 and 2 agree?" and "do qubits 2 and 3 agree?" pinpoints a single flip while saying nothing about whether the logical qubit is 0, 1 or a superposition. These **syndrome measurements** are the heart of every quantum error-correcting code.`,
            },
            {
              type: 'mcq',
              title: 'The overhead',
              prompt: r`Today’s leading designs (surface codes) protect one "logical" qubit by spreading it over many physical qubits. Roughly how many might a useful logical qubit need?`,
              choices: [
                { t: r`Hundreds to about a thousand physical qubits`, ok: true },
                { t: r`Exactly three`, why: r`Three is enough for the simple bit-flip code, but full protection against all errors needs far more.` },
                { t: r`One: logical and physical qubits are the same`, why: r`Without encoding, a single physical qubit is far too error-prone for long computations.` },
              ],
              explain: r`Estimates of hundreds to around a thousand physical qubits per logical qubit, depending on error rates, mean that breaking RSA might need millions of physical qubits. Lower error rates shrink the overhead dramatically.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Below threshold',
              prompt: r`In 2024, Google reported that making their surface code bigger (from 3×3 to 5×5 to 7×7 grids of qubits) **halved** the logical error rate at each step. Why was that a milestone?`,
              choices: [
                { t: 'It showed their qubits were below the threshold: adding qubits made the logical qubit better, not worse', ok: true },
                { t: 'It meant the computer could break RSA', why: 'That needs millions of physical qubits. This was one logical qubit.' },
                { t: 'It proved error correction is unnecessary', why: 'The opposite: it showed error correction working as theory predicts.' },
              ],
              explain: r`Above threshold, extra qubits bring extra errors and the code gets worse as it grows. Seeing the logical error rate fall with size is the signature of being below threshold, the essential first step toward large, fault-tolerant quantum computers.`,
            },
          ],
          recap: [
            'Error correction spreads one logical qubit across many physical qubits.',
            r`A 3-qubit code turns error rate $p$ into about $3p^2$, if $p < \frac12$.`,
            'Parity (syndrome) measurements find errors without reading the data.',
          ],
        },
        {
          id: 'shor',
          title: 'Factoring by Periods',
          summary: 'The idea behind Shor’s algorithm',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'From factors to rhythms',
              body: r`Shor’s algorithm factors a number $N$ by turning factoring into finding a **period**. Pick a number $a$ that shares no factor with $N$ and look at the powers
$$a^0, a^1, a^2, \dots \pmod N.$$
They repeat with some period $r$. If $r$ is even, then $a^r - 1 = (a^{r/2} - 1)(a^{r/2} + 1)$ is a multiple of $N$, and usually $\gcd(a^{r/2} \pm 1, N)$ gives a factor.

Finding $r$ is hard for classical computers when $N$ is huge. A quantum computer finds it efficiently using interference (the quantum Fourier transform).`,
            },
            {
              type: 'numeric',
              title: 'Powers of 7',
              prompt: r`Compute $7^x \bmod 15$ for $x = 0, 1, 2, \dots$: $1, 7, 4, 13, 1, \dots$ What is the period $r$?`,
              answer: 4,
              explain: r`$7^4 = 2401 = 160 \times 15 + 1$, so the pattern $1, 7, 4, 13$ repeats every **4** steps.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Choose a base',
              prompt: r`For $N = 15$, the bars show $a^x \bmod 15$. Change $a$ and watch the rhythm. Find a base whose period is **2**.`,
              widget: {
                kind: 'graph', xmin: -0.6, xmax: 11.6, ymin: 0, ymax: 15, grid: false, height: 240, axes: { xlabel: 'x', ylabel: 'aˣ mod 15', xticks: 1, yticks: 5, xAt: -0.6 },
                params: { a: { min: 2, max: 14, step: 1, value: 7, label: 'base a', color: 'violet' } },
                extra: ({ plot, p, s }) => { const out = []; let v = 1; for (let x = 0; x < 12; x++) { out.push(s('rect', { x: plot.X(x - 0.35), y: plot.Y(v), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(v), rx: 2, class: v === 1 ? 'fl-coral' : 'fl-violet' })); v = (v * p.a) % 15; } return out; },
                readout: (p) => { const g = (x, y) => (y ? g(y, x % y) : x); if (g(p.a, 15) > 1) return `${p.a} shares the factor **${g(p.a, 15)}** with 15: lucky, no quantum computer needed!`; let r = 1, v = p.a % 15; while (v !== 1) { v = (v * p.a) % 15; r++; } let m = 1; for (let i = 0; i < r / 2; i++) m = (m * p.a) % 15; return `period **r = ${r}**${r % 2 === 0 ? ` · a^(r/2) mod 15 = ${m} · gcd(${m} − 1, 15) = ${g(Math.abs(m - 1), 15)}, gcd(${m} + 1, 15) = ${g(m + 1, 15)}` : ' (odd: try another a)'}`; },
                goal: (p) => [4, 11, 14].includes(p.a),
                hint: r`You need $a^2 \equiv 1 \pmod{15}$: try $a = 4$.`,
                solution: { a: 4 },
              },
              explain: r`$a = 4$, $11$ or $14$ give period 2 (for example $4^2 = 16 \equiv 1$). With $a = 4$: $\gcd(4 - 1, 15) = 3$ and $\gcd(4 + 1, 15) = 5$, the two factors. ($a = 14$ fails, since $14 + 1 = 15$: occasionally a base gives only trivial factors and you pick again.)`,
            },
            {
              type: 'numeric',
              title: 'Extract the factor',
              prompt: r`With $a = 7$ and period $r = 4$, compute $\gcd(7^2 - 1, 15)$.`,
              answer: 3,
              explain: r`$7^2 - 1 = 48$ and $\gcd(48, 15) = 3$. Also $\gcd(7^2 + 1, 15) = \gcd(50, 15) = 5$. So $15 = 3 \times 5$.`,
            },
            {
              type: 'mcq',
              title: 'Where’s the quantum part?',
              prompt: r`Which step of Shor’s algorithm needs a quantum computer?`,
              choices: [
                { t: 'Finding the period r of aˣ mod N', ok: true },
                { t: 'Computing the gcd', why: 'Euclid’s algorithm computes gcds quickly on any computer.' },
                { t: 'Choosing a', why: 'Choosing a random base is trivial.' },
              ],
              explain: r`Everything except period finding is fast classically. For a 2048-bit RSA number the period could be astronomically long, but a quantum computer puts all $x$ values in superposition and uses the quantum Fourier transform to make the period stand out. That is why large, error-corrected quantum computers would threaten today’s public-key encryption.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Factor 21',
              prompt: r`For $N = 21$ and $a = 2$, the powers mod 21 are $1, 2, 4, 8, 16, 11, 1, \dots$ (period 6). Compute $\gcd(2^3 - 1, 21)$ to find a factor of 21.`,
              answer: 7,
              wrong: [{ v: 3, why: r`$2^3 - 1 = 7$, and $\gcd(7, 21) = 7$. (The other factor, 3, comes from $\gcd(2^3 + 1, 21) = \gcd(9, 21)$.)` }],
              explain: r`$2^3 - 1 = 7$ and $\gcd(7, 21) = 7$; also $\gcd(9, 21) = 3$. So $21 = 3 \times 7$. In 2012 a quantum computer ran a version of Shor’s algorithm on exactly this number.`,
            },
          ],
          recap: [
            'Shor’s algorithm reduces factoring N to finding the period of aˣ mod N.',
            r`With even period $r$, $\gcd(a^{r/2} \pm 1, N)$ usually gives the factors.`,
            'Only the period finding needs a quantum computer.',
          ],
        },
      ],
    },
  ],
};
