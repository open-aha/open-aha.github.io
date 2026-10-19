import { run } from '../widgets/turing-core.js';

const r = String.raw;

const INC = { A: { 0: ['1', 'N', 'H'], 1: ['0', 'L', 'A'], _: ['1', 'N', 'H'] } };
const FLIP = { A: { 0: ['0', 'R', 'A'], 1: ['1', 'R', 'A'], _: ['_', 'N', 'H'] } };
const ADD = { A: { 1: ['1', 'R', 'A'], _: ['_', 'R', 'B'] }, B: { 1: ['1', 'R', 'B'], _: ['_', 'L', 'C'] }, C: { 1: ['1', 'N', 'H'] } };
const PAR = { E: { 0: ['0', 'R', 'E'], 1: ['1', 'R', 'O'], _: ['0', 'N', 'H'] }, O: { 0: ['0', 'R', 'O'], 1: ['1', 'R', 'E'], _: ['1', 'N', 'H'] } };
const DEC = { A: { 0: ['0', 'L', 'A'], 1: ['1', 'N', 'H'] } };
const PRED = { A: { 1: ['1', 'R', 'A'], _: ['_', 'R', 'B'] }, B: { 1: ['_', 'N', 'H'] } };
const BB3 = { A: { 0: ['1', 'R', 'B'], 1: ['1', 'R', 'H'] }, B: { 0: ['0', 'R', 'C'], 1: ['1', 'R', 'B'] }, C: { 0: ['1', 'L', 'C'], 1: ['1', 'L', 'A'] } };
const BB2 = { A: { 0: ['1', 'R', 'B'], 1: ['1', 'L', 'B'] }, B: { 0: ['1', 'L', 'A'], 1: ['1', 'R', 'H'] } };

const passes2 = (rules, tests) => tests.every(([input, out]) => {
  const m = run({ start: 'A', halt: ['H'], head: input.length - 1, maxSteps: 200 }, rules, input);
  return m.halted && m.output === out;
});
const passes = (rules, tests) => tests.every(([input, out]) => {
  const m = run({ start: 'A', halt: ['H'], head: 0, maxSteps: 200 }, rules, input);
  return m.halted && m.output === out;
});

// finite automaton reading a binary number left to right; state = remainder so far
const DFA3 = [[0, 1], [2, 0], [1, 2]];
const bin = (n) => n.toString(2);
const dfaRun = (T, n, k) => { let st = 0; const b = bin(n); for (let i = 0; i < Math.min(k, b.length); i++) st = T[st][+b[i]]; return st; };
const DPOS = [[-1.6, -0.9], [1.6, -0.9], [0, 1.5]];
// draw a 3-state automaton: states as circles, transitions as labelled arrows
const dfaDraw = ({ plot, s }, T, active) => {
  const els = [], R = 0.42, X = (q) => plot.X(q[0]), Y = (q) => plot.Y(q[1]);
  const head = (x, y, ux, uy, col) => s('path', { d: `M${x} ${y}L${x - 11 * ux - 6 * uy} ${y - 11 * uy + 6 * ux}L${x - 11 * ux + 6 * uy} ${y - 11 * uy - 6 * ux}Z`, fill: col });
  for (let a = 0; a < 3; a++) for (const bit of [0, 1]) {
    const b = T[a][bit], both = a !== b && T[a][0] === T[a][1];
    if (both && bit) continue; // both digits lead to the same state: one arrow labelled "0, 1"
    const col = both ? 'var(--ink-2)' : bit ? 'var(--coral)' : 'var(--blue)';
    const [ax, ay] = DPOS[a];
    if (a === b) {
      const dir = Math.atan2(ay + 0.1, ax) + (bit ? 0.5 : -0.5), cx = ax + 0.68 * Math.cos(dir), cy = ay + 0.68 * Math.sin(dir), rr = 0.3;
      els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(cy), r: plot.X(rr) - plot.X(0), fill: 'none', stroke: col, 'stroke-width': 2.5 }));
      els.push(s('text', { x: plot.X(cx + 0.45 * Math.cos(dir)), y: plot.Y(cy + 0.45 * Math.sin(dir)) + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:23px;font-weight:700', fill: col, text: String(bit) }));
      continue;
    }
    const [bx, by] = DPOS[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, off = 0.32;
    const sx = ax + ux * R + nx * off * 0.5, sy = ay + uy * R + ny * off * 0.5, ex = bx - ux * R + nx * off * 0.5, ey = by - uy * R + ny * off * 0.5;
    const mx = (ax + bx) / 2 + nx * off * 1.6, my = (ay + by) / 2 + ny * off * 1.6;
    els.push(s('path', { d: `M${plot.X(sx)} ${plot.Y(sy)}Q${plot.X(mx)} ${plot.Y(my)} ${plot.X(ex)} ${plot.Y(ey)}`, fill: 'none', stroke: col, 'stroke-width': 2.5 }));
    const tx = ex - mx, ty = ey - my, tl = Math.hypot(tx, ty);
    els.push(head(plot.X(ex), plot.Y(ey), tx / tl, -ty / tl, col));
    els.push(s('text', { x: plot.X((ax + bx) / 2 + nx * off * 1.25), y: plot.Y((ay + by) / 2 + ny * off * 1.25) + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:23px;font-weight:700', fill: col, text: both ? '0, 1' : String(bit) }));
  }
  DPOS.forEach(([x, y], i) => {
    els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: plot.X(R) - plot.X(0), class: i === active ? 'fl-amber-soft' : 'fl-card', stroke: i === active ? 'var(--amber)' : 'var(--ink-3)', 'stroke-width': i === active ? 4 : 2 }));
    if (i === 0) els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: plot.X(R - 0.08) - plot.X(0), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    els.push(s('text', { x: plot.X(x), y: plot.Y(y) + 7, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:22px;font-weight:700', text: `R${i}` }));
  });
  const sa = (2 * Math.PI) / 3, ux0 = Math.cos(sa), uy0 = Math.sin(sa);
  els.push(s('path', { d: `M${plot.X(-1.6 + 1.1 * ux0)} ${plot.Y(-0.9 + 1.1 * uy0)}L${plot.X(-1.6 + (R + 0.04) * ux0)} ${plot.Y(-0.9 + (R + 0.04) * uy0)}`, stroke: 'var(--ink)', 'stroke-width': 2.5 }), head(plot.X(-1.6 + (R + 0.02) * ux0), plot.Y(-0.9 + (R + 0.02) * uy0), -ux0, uy0, 'var(--ink)'));
  return els;
};
const digitsShown = (n, k) => { const b = bin(n); return b.split('').map((c, i) => (i < k ? `**${c}**` : c)).join(' '); };

// an imagined table: does program i halt when given program j as its input? (1 = halts, 0 = loops)
const HALT_TABLE = [[1, 0, 1, 1, 0, 1], [0, 0, 1, 0, 1, 1], [1, 1, 1, 0, 0, 0], [0, 1, 0, 1, 1, 0], [1, 1, 0, 0, 0, 1], [0, 0, 1, 1, 1, 1]];
const haltPhase = (t) => (t < 1 ? { stage: 0, k: -1 } : t < 8.2 ? { stage: 1, k: Math.min(5, Math.floor((t - 1) / 1.2)) } : { stage: 2, k: Math.min(5, Math.floor((t - 8.2) / 1.3)) });

export default {
  id: 'computability',
  subject: 'math',
  title: 'Computability',
  level: 'Advanced',
  cover: 'computability',
  tagline: 'Program the simplest possible computer, build automata, and discover questions no computer can ever answer.',
  description: r`In 1936, Alan Turing imagined a machine that reads and writes symbols on a tape, and showed it can carry out any computation at all. Program Turing machines yourself, meet the universal machine behind every computer, and follow Turing's proof that some problems, like predicting whether a program will ever stop, are impossible to solve. Then design a finite automaton, and play a domino puzzle that no algorithm can solve in general.`,
  prereq: 'Algorithms',
  chapters: [
    {
      title: 'Turing Machines',
      summary: 'The simplest computer.',
      lessons: [
        {
          id: 'machines',
          title: 'What Is Computation?',
          summary: 'Tape, head and rules',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'Hilbert’s challenge',
              body: r`In 1928, David Hilbert asked for a **mechanical procedure** that could decide whether any mathematical statement is provable. To answer, someone first had to say precisely what a "mechanical procedure" is.

In 1936, a 23-year-old Alan Turing did it by imagining a person following instructions with pencil and paper, then stripping that down to the bare minimum:

- An endless **tape** divided into cells, each holding one symbol (or blank).
- A **head** that reads the cell under it.
- A current **state**, and a table of **rules**: *in state A, reading symbol s: write this, move left or right, switch to state B*.

That's a **Turing machine**. It stops when it reaches the special **halt** state.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Adding one',
              body: r`This machine adds 1 to a binary number. It starts on the rightmost digit. Press **Step** to follow it one rule at a time; the highlighted row is the rule about to be used.`,
              widget: {
                kind: 'turing', rules: INC, tape: '1011', head: (t) => t.length - 1, start: 'A', halt: ['H'], speed: 600,
                readout: (m) => `step **${m.steps}**${m.state === 'H' ? ' · halted' : ''}`,
              },
              after: r`It's exactly how you add 1 by hand: turn trailing 1s into 0s (carrying), then turn the first 0 (or blank) into a 1. $1011 + 1 = 1100$.`,
            },
            {
              type: 'numeric',
              title: 'Run it in your head',
              prompt: r`The same machine starts on the rightmost digit of $0111$. When it halts, what number (in decimal) is on the tape?`,
              answer: 8,
              wrong: [{ v: 7, why: 'That’s the input, 0111. The machine adds one.' }, { v: 1000, why: 'The tape reads 1000 in binary. In decimal that’s 8.' }],
              explain: r`It turns the three trailing 1s into 0s, then the 0 into a 1: $1000_2 = 8$. Indeed $7 + 1 = 8$.`,
            },
            {
              type: 'numeric',
              title: 'Counting steps',
              prompt: r`The adding-one machine starts on the rightmost digit of $1111$. How many steps does it take before it halts?`,
              unit: 'steps',
              answer: 5,
              wrong: [{ v: 4, why: 'Four steps turn the 1s into 0s. One more step writes the final 1 into the blank cell.' }],
              explain: r`Four steps change $1111$ to $0000$ while moving left, and a fifth writes a 1 in the blank: $10000_2 = 16$. A number made of $n$ ones takes $n + 1$ steps, so the worst case grows with the length of the input.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'States are memory',
              body: r`This machine has two working states, **E** and **O**. It reads a binary number from left to right without changing it, and writes one extra digit at the end. Run it on the input and work out what the states mean.`,
              widget: {
                kind: 'turing', rules: PAR, tape: '1101', head: 0, start: 'E', halt: ['H'], speed: 550,
                readout: (m) => `step **${m.steps}** · state **${m.state}**${m.state === 'H' ? ' · halted' : ''}`,
              },
              after: r`The state flips every time the head reads a 1, and stays put on a 0. So the state **remembers** one bit of information about everything read so far. A machine with $k$ states can remember one of $k$ possibilities; for anything bigger, it has to write notes on the tape.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'What does it compute?',
              prompt: r`The E/O machine halts after writing a 0 or a 1 at the end of the input. What does that final digit tell you?`,
              choices: [
                { t: 'Whether the input contains an odd number of 1s (1 = odd)', ok: true },
                { t: 'Whether the input number is odd', why: 'The last digit already tells you that. The machine counts every 1 it reads.' },
                { t: 'How many 1s there are', why: 'One digit can’t hold a count. It only tracks whether the count is even or odd.' },
              ],
              explain: r`E means "even number of 1s so far" and O means "odd". On $1101$ (three 1s) it ends in O and writes 1. This **parity bit** is used in real hardware: append it to data, and any single flipped bit is detected because the parity no longer matches.`,
            },
          ],
          recap: [
            'A Turing machine has a tape, a head, a state, and a table of rules.',
            'Each rule says what to write, which way to move, and the next state.',
            'Simple rules can carry out arithmetic.',
          ],
        },
        {
          id: 'programming',
          title: 'Programming a Machine',
          summary: 'Write your own rules',
          icon: 'pencil',
          steps: [
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Flip every bit',
              prompt: r`Fix the dashed cells so the machine **flips every bit** of its input (0 ↔ 1), moving right until it reaches a blank. Click a dashed cell to change it, then press Run to test.`,
              widget: {
                kind: 'turing', rules: FLIP, tape: '1011', head: 0, start: 'A', halt: ['H'], speed: 400,
                edit: [['A', '0', 0], ['A', '1', 0]], symbols: ['0', '1', '_'],
                goal: (rules) => passes(rules, [['1011', '0100'], ['0011', '1100'], ['1', '0']]) || { ok: false, msg: 'Test 1011: it should become 0100. Check what each rule writes.' },
                hint: 'Reading 0 should write 1, and reading 1 should write 0.',
                solution: [['A', '0', 0, '1'], ['A', '1', 0, '0']],
              },
              explain: r`Two rules, one state. The machine sweeps right, flipping as it goes, and halts at the first blank. It works on inputs of any length, because the rules don't care how long the tape is.`,
            },
            {
              type: 'explain',
              title: 'Counting in unary',
              body: r`Turing machines often use **unary** notation: the number $n$ is written as $n$ ones. So $3 + 2$ looks like $\texttt{111\_11}$ (a blank separates the numbers), and the answer should be $\texttt{11111}$.

A plan: fill the gap with a 1 (now there are six 1s), run to the end, then erase the last 1.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'An adding machine',
              prompt: r`Two write cells are wrong. Fix them so the machine turns $\texttt{111\_11}$ into $\texttt{11111}$.`,
              widget: {
                kind: 'turing', rules: ADD, tape: '111_11', head: 0, start: 'A', halt: ['H'], speed: 350,
                edit: [['A', '_', 0], ['C', '1', 0]], symbols: ['1', '_'],
                goal: (rules) => passes(rules, [['111_11', '11111'], ['1_1', '11'], ['11_111', '11111']]) || { ok: false, msg: 'Run it on 111_11 and count the ones at the end: there should be exactly five.' },
                hint: 'State A should fill the gap with a 1. State C, standing on the last 1, should erase it.',
                solution: [['A', '_', 0, '1'], ['C', '1', 0, '_']],
              },
              explain: r`State A walks right and fills the gap; state B walks to the end and steps back; state C erases one 1 to make up for the one added. Clumsy compared with a calculator, but it shows that addition is just symbol-shuffling, which a machine can do.`,
            },
            {
              type: 'interactive',
              title: 'Subtract one',
              prompt: r`This machine should **subtract 1** from a binary number (bigger than zero), starting on the rightmost digit. Fix its two dashed write cells.`,
              widget: {
                kind: 'turing', rules: DEC, tape: '1000', head: (t) => t.length - 1, start: 'A', halt: ['H'], speed: 450,
                edit: [['A', '0', 0], ['A', '1', 0]], symbols: ['0', '1', '_'],
                goal: (rules) => passes2(rules, [['1000', '0111'], ['1011', '1010'], ['110', '101']]) || { ok: false, msg: 'Test 1000: it should become 0111. Subtracting is adding in reverse: what happens to trailing 0s?' },
                hint: 'Trailing 0s become 1s (borrowing), and the first 1 becomes 0.',
                solution: [['A', '0', 0, '1'], ['A', '1', 0, '0']],
              },
              explain: r`It's the adding-one machine in a mirror: trailing 0s turn into 1s as the borrow moves left, and the first 1 turns into 0. $1000 - 1 = 0111$, that is, $8 - 1 = 7$.`,
            },
            {
              type: 'interactive',
              title: 'Which way?',
              prompt: r`This machine should **subtract 1 in unary**: starting on the first 1, walk right to the end of the input, step back, and erase the last 1. One move is wrong. Fix the dashed move cell.`,
              widget: {
                kind: 'turing', rules: PRED, tape: '1111', head: 0, start: 'A', halt: ['H'], speed: 450,
                edit: [['A', '_', 1]], symbols: ['1', '_'],
                goal: (rules) => passes(rules, [['1111', '111'], ['11', '1'], ['111111', '11111']]) || { ok: false, msg: 'Run it: after reaching the blank, the head must get back onto the last 1. Which direction is that?' },
                hint: 'On reaching the blank past the end, move left (L) to stand on the last 1.',
                solution: [['A', '_', 1, 'L']],
              },
              explain: r`Reading a blank, the machine must move **left** to land on the last 1, which state B then erases. With the wrong move it wanders off to the right, finds nothing it has a rule for, and gets stuck. Moves are as much part of the program as the symbols written.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Timing the adder',
              prompt: r`The working adding machine from before computes $4 + 3$ from the tape $\texttt{1111\_111}$, starting on the leftmost 1. How many steps does it take?`,
              unit: 'steps',
              answer: 10,
              wrong: [{ v: 8, why: 'That’s the count for 3 + 2. Count again for 1111_111.' }, { v: 7, why: 'Walking over the 1s takes 7 steps, but filling the gap, turning back and erasing take steps too.' }],
              hint: 'State A walks over four 1s, then fills the gap. State B walks over three 1s, then turns back. State C erases.',
              explain: r`4 steps over the first number, 1 to fill the gap, 3 over the second number, 1 to step back, and 1 to erase: **10**. In general $m + n + 3$ steps for $m + n$. Turing machines are slow, but for computability only "finitely many steps" matters.`,
            },
          ],
          recap: [
            'Programming a Turing machine means designing its rule table.',
            'The same rules work for inputs of any length.',
            'Unary arithmetic is easy to implement with a few states.',
          ],
        },
      ],
    },
    {
      title: 'The Limits of Computation',
      summary: 'Universal machines and unsolvable problems.',
      lessons: [
        {
          id: 'universal',
          title: 'Universal Machines',
          summary: 'One machine to run them all',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'Rules as data',
              body: r`A Turing machine's rule table is just a list of symbols, so it can be written on a tape. In the same 1936 paper, Turing described a **universal machine**: one fixed machine that reads the description of *any* other machine, plus that machine's input, and simulates it step by step.

That's the idea behind every computer: one piece of hardware that runs any program you load into it. Turing had imagined the stored-program computer more than a decade before one was built.`,
            },
            {
              type: 'mcq',
              title: 'The Church–Turing thesis',
              prompt: r`Alonzo Church (with lambda calculus) and Turing (with machines) independently defined "computable" in very different ways in 1936. What did they find?`,
              choices: [
                { t: 'The two definitions describe exactly the same set of computable functions', ok: true },
                { t: 'Lambda calculus can compute more than Turing machines', why: 'Turing proved they compute exactly the same functions.' },
                { t: 'Turing machines can compute more, because they have a tape', why: 'They’re equivalent: each can simulate the other.' },
              ],
              explain: r`Every reasonable model of computation proposed since (modern programming languages, cellular automata like Rule 110 and the Game of Life, even DNA computing) turns out to compute exactly the same functions. The **Church–Turing thesis** is the claim that this class captures everything that can be computed by any mechanical procedure. It can't be proved, since "mechanical procedure" is informal, but nothing has ever contradicted it.`,
            },
            {
              type: 'multi',
              title: 'Accidentally universal',
              prompt: r`A system is **Turing complete** if it can simulate any Turing machine (given enough memory). Which of these are Turing complete? Select all.`,
              choices: [
                { t: 'Conway’s Game of Life', ok: true },
                { t: 'The card game Magic: The Gathering', ok: true },
                { t: 'The Python programming language', ok: true },
                { t: 'A basic four-function pocket calculator', why: 'It has a fixed, tiny memory and no way to loop or branch, so it can’t simulate an arbitrary machine.' },
              ],
              explain: r`Python was designed to be universal, but the Game of Life (patterns acting as logic gates) and Magic: The Gathering (a 2019 proof built a Turing machine out of cards) got there by accident. Universality is surprisingly easy to stumble into: all it takes is memory that can grow and a way to make decisions that depend on it.`,
            },
            {
              type: 'mcq',
              title: 'Programs are countable',
              prompt: r`Every program is a finite string of symbols, so programs can be listed in order: 1st, 2nd, 3rd, …. But there are **uncountably** many yes/no problems about whole numbers (one for every set of numbers). What follows?`,
              choices: [
                { t: 'Most yes/no problems can’t be solved by any program at all', ok: true },
                { t: 'Every problem has a program, if it’s long enough', why: 'A countable list of programs can’t cover an uncountable collection of problems.' },
                { t: 'Nothing: the two kinds of infinity are equal', why: 'Cantor’s diagonal argument shows they are not equal. See the Infinity course.' },
              ],
              explain: r`There are only countably many programs but uncountably many problems, so almost all problems are **unsolvable** by computers. That argument doesn't name a single one, though. Turing's achievement was to find a specific, natural one: the halting problem.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A universal pattern',
              body: r`An elementary cellular automaton updates a row of cells using a rule that looks only at each cell and its two neighbours. The 8 possible neighbourhoods give $2^8 = 256$ rules. Starting from one black cell, each new row is the next generation. Try rules 30, 90 and **110**.`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 101, ymin: -60, ymax: 0, grid: false, axes: false, maxWidth: 600, height: 360,
                params: { rule: { min: 0, max: 255, step: 1, value: 110, label: 'rule', color: 'violet' } },
                extra: ({ plot, p, s }) => { const W = 101; let row = new Uint8Array(W); row[80] = 1; let d = ''; const cw = plot.X(1) - plot.X(0), ch = plot.Y(-1) - plot.Y(0); for (let g = 0; g < 60; g++) { for (let i = 0; i < W; i++) if (row[i]) d += `M${plot.X(i).toFixed(1)} ${plot.Y(-g).toFixed(1)}h${cw.toFixed(2)}v${ch.toFixed(2)}h${(-cw).toFixed(2)}Z`; const nx = new Uint8Array(W); for (let i = 0; i < W; i++) { const k = ((i > 0 ? row[i - 1] : 0) << 2) | (row[i] << 1) | (i < W - 1 ? row[i + 1] : 0); nx[i] = (p.rule >> k) & 1; } row = nx; } return [s('path', { d, class: 'fl-violet' })]; },
                readout: (p) => `rule ${p.rule} = ${p.rule.toString(2).padStart(8, '0')} in binary: the new cell for neighbourhoods 111, 110, …, 000${{ 30: ' · **chaotic**: used as a random number generator', 90: ' · **Sierpiński triangle**', 110: ' · **Turing complete**: it can simulate any computer', 184: ' · a model of **traffic flow**' }[p.rule] || ''}`,
              },
              after: r`Rule 110 looks like a tangle of colliding triangles, but in 2004 Matthew Cook proved that those moving structures can be arranged to simulate any Turing machine. A rule you can write down in 8 bits is a universal computer: universality is cheap and turns up almost by accident.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Faster, not stronger',
              prompt: r`Your laptop runs billions of operations per second; a Turing machine moves one cell at a time. Which statement is true?`,
              choices: [
                { t: 'Given enough time and tape, a Turing machine can compute anything your laptop can', ok: true },
                { t: 'Your laptop can solve problems no Turing machine can', why: 'Speed isn’t power. Anything a laptop computes, a Turing machine can too, just far more slowly.' },
                { t: 'A Turing machine is more powerful, because its tape is infinite', why: 'In practice a laptop is limited by memory, but with extra storage it’s just as powerful. Neither escapes the limits of computability.' },
              ],
              explain: r`Computability is about what can be computed **at all**, not how fast. Efficiency is a separate question, studied in complexity theory (P versus NP). And as we'll see next, some problems are out of reach for every computer, however fast.`,
            },
          ],
          recap: [
            'A universal Turing machine can simulate any other Turing machine.',
            'This is the principle of the stored-program computer.',
            'Church–Turing thesis: Turing machines capture everything that can be computed.',
          ],
        },
        {
          id: 'halting',
          title: 'The Halting Problem',
          summary: 'A question no program can answer',
          icon: 'cross',
          steps: [
            {
              type: 'explain',
              title: 'Will it ever stop?',
              body: r`Some programs finish; others loop forever. It would be enormously useful to have a program **HALTS(P, x)** that looks at any program $P$ and input $x$ and correctly answers "halts" or "loops forever", always in a finite time.

Turing proved that **no such program can exist**. The proof is a contradiction in the style of the liar paradox ("this sentence is false").`,
            },
            {
              type: 'multi',
              title: 'Will these halt?',
              prompt: r`Which of these little programs eventually stop? Select all that halt.`,
              choices: [
                { t: r`$n \leftarrow 7$; while $n \ne 1$: $n \leftarrow n - 2$`, ok: true },
                { t: r`$n \leftarrow 8$; while $n \ne 1$: $n \leftarrow n - 2$`, why: r`8, 6, 4, 2, 0, −2, …: it skips over 1 and runs forever.` },
                { t: r`$n \leftarrow 27$; while $n \ne 1$: if $n$ is even, halve it, otherwise $n \leftarrow 3n + 1$`, ok: true },
                { t: r`$n \leftarrow 1$; while $n > 0$: $n \leftarrow n + 1$`, why: 'n only grows, so the condition n > 0 is always true.' },
              ],
              explain: r`The first stops after 3 rounds. The third is the Collatz process: from 27 it wanders as high as 9232 before reaching 1 after 111 steps. Nobody knows whether **every** starting number halts. For some programs, deciding is easy; for others, it's an open problem; Turing showed no single method can settle them all.`,
            },
            {
              type: 'order',
              title: 'Turing’s proof',
              prompt: 'Put the steps of the proof in order.',
              items: [
                'Suppose a program HALTS(P, x) always correctly decides whether program P halts on input x.',
                'Build a program D that takes any program P, asks HALTS whether P halts when given its own code, and then does the opposite: it loops forever if the answer is “halts”, and halts if the answer is “loops”.',
                'Now run D on its own code: D(D).',
                'If D(D) halts, HALTS must have said it loops; if D(D) loops, HALTS must have said it halts. Either way, HALTS was wrong.',
                'So no program HALTS can exist.',
              ],
              explain: r`The program D is built to contradict whatever HALTS predicts about it. Since HALTS is assumed to be right about **every** program, including D, the assumption must be false. The halting problem is **undecidable**. As a corollary, Turing showed that Hilbert's decision problem has no solution either.`,
            },
            { /*anim:computability*/
              type: 'explain',
              kicker: 'Explore',
              title: 'The diagonal trap',
              body: r`Suppose HALTS existed. Then we could fill in this table for every program: row $i$, column $j$ says whether program $P_i$ halts ({teal:✓}) or loops forever ({coral:∞}) when fed program $P_j$ as input. Now build a new program $D$: given $P_j$, it asks HALTS about $P_j$ run on itself, then does the **opposite**.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.6, xmax: 6.2, ymin: -1.6, ymax: 6.4, grid: false, axes: false, maxWidth: 420,
                animate: { param: 't', speed: 1, max: 17, autoplay: true },
                extra: ({ plot, p, s }) => {
                  const { stage, k } = haltPhase(p.t), els = [], W = plot.X(1) - plot.X(0) - 4;
                  const T = (x, y, text, col, wt = 400) => s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', class: 'halo-text', style: `font-size:max(calc(14px * var(--fs, 1)), var(--fmin, 0px));font-weight:${wt};fill:var(--${col})`, text });
                  const cell = (i, j, v, hl, row) => {
                    const cx = j + 0.5, cy = 5.5 - i;
                    els.push(s('rect', { x: plot.X(j) + 2, y: plot.Y(6 - i) + 2, width: W, height: W, rx: 4, class: hl ? 'fl-amber' : 'fl-card', opacity: hl ? 0.65 : 1, stroke: row ? 'var(--violet)' : 'var(--line-2)', 'stroke-width': row ? 2 : 1 }));
                    if (v != null) els.push(T(cx, cy, v ? '✓' : '∞', v ? 'teal' : 'coral', 700));
                  };
                  for (let j = 0; j < 6; j++) els.push(T(j + 0.5, 6.15, `P${j + 1}`, 'ink-3'));
                  for (let i = 0; i < 6; i++) {
                    els.push(T(-0.6, 5.5 - i, `P${i + 1}`, 'ink-3'));
                    for (let j = 0; j < 6; j++) cell(i, j, HALT_TABLE[i][j], (stage === 1 && i === j && j <= k) || (stage === 2 && i === k && j === k), stage === 2 && i === k);
                  }
                  // D's row underneath
                  els.push(T(-0.6, -0.9, 'D', 'violet', 700));
                  for (let j = 0; j < 6; j++) {
                    const known = stage === 2 || (stage === 1 && j <= k);
                    els.push(s('rect', { x: plot.X(j) + 2, y: plot.Y(-0.4) + 2, width: W, height: W, rx: 4, class: stage === 2 && j === k ? 'fl-amber' : 'fl-violet-soft', opacity: stage === 2 && j === k ? 0.65 : 1, stroke: 'var(--violet)' }));
                    if (known) els.push(T(j + 0.5, -0.9, HALT_TABLE[j][j] ? '∞' : '✓', HALT_TABLE[j][j] ? 'coral' : 'teal', 700));
                  }
                  return els;
                },
                readout: (p) => { const { stage, k } = haltPhase(p.t); return stage === 0 ? 'the table of every program on every input' : stage === 1 ? `$D$ on $P_${k + 1}$: the diagonal says $P_${k + 1}$ ${HALT_TABLE[k][k] ? 'halts' : 'loops'} on itself, so $D$ ${HALT_TABLE[k][k] ? 'loops' : 'halts'}` : `is $D$ the same as $P_${k + 1}$? No: they disagree on input $P_${k + 1}$`; },
              },
              after: r`$D$ is a perfectly good program (if HALTS exists), so it must be one of the rows. But it can't be row $i$ for any $i$: by construction, $D$ disagrees with $P_i$ on input $P_i$, the diagonal square. So $D$ is nowhere in a table that lists every program. The only way out is that HALTS can't exist. It's the same diagonal trick Cantor used to show the real numbers can't be listed.`,
            },
            {
              type: 'mcq',
              title: 'What it means',
              prompt: r`Which of these does the halting theorem imply?`,
              choices: [
                { t: 'No program can perfectly detect, for every program, whether it ever gets stuck in an infinite loop', ok: true },
                { t: 'It’s impossible to tell whether any particular program halts', why: 'For many specific programs it’s easy. What’s impossible is one method that works for every program.' },
                { t: 'Computers will eventually be fast enough to solve it', why: 'Speed doesn’t help. The proof shows that no program at all can do it.' },
              ],
              explain: r`Undecidability means there's no **general** method. Tools that check programs for bugs can be very good, but never perfect: Rice's theorem extends Turing's result to show that any non-trivial question about what a program does (will it ever print "hello"? is it a virus?) is undecidable in general.`,
            },
            {
              type: 'explain',
              title: 'Gödel’s shadow',
              body: r`Five years before Turing, in 1931, Kurt Gödel proved his **incompleteness theorem**: any consistent set of axioms strong enough for arithmetic contains true statements it cannot prove.

The halting problem gives a quick route to a version of it. If some axioms could prove, for every program, either "it halts" or "it runs forever" (and only true things), then a computer could search through all proofs until it found one, solving the halting problem. Since that's impossible, some true statements of the form "program $P$ never halts" must be **unprovable**.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Will it reach 1?',
              body: r`The Collatz rule: if $n$ is even, halve it; if odd, take $3n + 1$. Every number anyone has tried eventually reaches 1, but nobody can prove it always will. Pick a start (heights on a log scale).`,
              widget: {
                kind: 'graph', xmin: 0, xmax: 180, ymin: 0, ymax: 5.6, grid: false, height: 260, axes: { xlabel: 'step', ylabel: 'value (power of 10)', xticks: 30, yticks: 1 },
                params: { n: { min: 1, max: 1000, step: 1, value: 27, label: 'start', color: 'coral' } },
                extra: ({ plot, p, s }) => { let n = p.n, k = 0, d = `M${plot.X(0)} ${plot.Y(Math.log10(n))}`; while (n !== 1 && k < 400) { n = n % 2 ? 3 * n + 1 : n / 2; k++; d += `L${plot.X(k).toFixed(1)} ${plot.Y(Math.log10(n)).toFixed(1)}`; } return [s('path', { d, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 2 })]; },
                readout: (p) => { let n = p.n, k = 0, top = n; while (n !== 1) { n = n % 2 ? 3 * n + 1 : n / 2; k++; top = Math.max(top, n); } return `${p.n} reaches 1 after **${k} steps**, climbing as high as **${top.toLocaleString('en-US')}**`; },
              },
              after: r`Starting at 27 the sequence wanders for 111 steps and climbs to 9,232 before crashing down to 1. A program that runs this rule and stops at 1 is tiny, yet nobody knows whether it halts for every input. The halting problem says no general method can settle such questions for all programs.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'A halting oracle for mathematics',
              prompt: r`Write a program that checks 4, 6, 8, 10, … in turn and **stops** if it finds an even number that is not the sum of two primes. If a magic box could tell you whether this program halts, what would you learn?`,
              choices: [
                { t: 'Whether Goldbach’s conjecture is true, without checking infinitely many numbers', ok: true },
                { t: 'Only whether the program has a bug', why: 'The program halts exactly when a counterexample to Goldbach exists.' },
                { t: 'Nothing, since the program obviously runs forever', why: 'That’s only obvious if you already know Goldbach’s conjecture is true, and nobody does.' },
              ],
              explain: r`The program halts **if and only if** Goldbach's conjecture is false. A halting oracle would settle Goldbach, the Riemann hypothesis and many other open problems that can be phrased as searches. That's a sign of how powerful (and impossible) a halting decider would be.`,
            },
          ],
          recap: [
            'The halting problem asks whether a program will ever stop.',
            'Turing proved (1936) that no program can solve it for all programs.',
            'Many questions about program behaviour are undecidable in general.',
          ],
        },
        {
          id: 'beaver',
          title: 'Busy Beavers',
          summary: 'The fastest-growing function',
          icon: 'trophy',
          steps: [
            {
              type: 'explain',
              title: 'A competition',
              body: r`In 1962, Tibor Radó posed a game. Among all Turing machines with $n$ states (plus halt), using symbols 0 and 1 on a tape of all 0s, which machine runs the **longest before halting**? Machines that never halt are disqualified. The winner is the $n$-state **busy beaver**. Here's the champion with 2 states.`,
              widget: {
                kind: 'turing', rules: BB2, tape: '', head: 0, start: 'A', halt: ['H'], blank: '0', speed: 700, cells: 9,
                readout: (m) => `step **${m.steps}** · ones on tape: **${[...m.tape.values()].filter((v) => v === '1').length}**${m.state === 'H' ? ' · halted' : ''}`,
              },
              after: r`Run it to the end and watch it shuffle back and forth, laying down 1s.`,
            },
            {
              type: 'numeric',
              title: 'How long?',
              prompt: r`How many steps does the 2-state busy beaver take before it halts?`,
              unit: 'steps',
              answer: 6,
              wrong: [{ v: 4, why: 'It leaves four 1s on the tape, but it takes more steps than that. Count the steps.' }],
              explain: r`It halts after **6 steps**, leaving four 1s. No 2-state machine runs longer and still halts.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Three states',
              body: r`With three states the machines get more inventive. This one writes the most 1s of any halting 3-state machine. Run it and count.`,
              widget: {
                kind: 'turing', rules: BB3, tape: '', head: 0, start: 'A', halt: ['H'], blank: '0', speed: 450, cells: 11,
                readout: (m) => `step **${m.steps}** · ones on tape: **${[...m.tape.values()].filter((v) => v === '1').length}**${m.state === 'H' ? ' · halted' : ''}`,
              },
              after: r`It halts after 14 steps with **six** 1s, the record for 3 states. (A different 3-state machine holds the record for running time: 21 steps.) Notice state B: it skips over a 0 without writing, which is how the machine leaves room to come back.`,
            },
            {
              type: 'numeric',
              title: 'How many contestants?',
              prompt: r`Each rule of an $n$-state machine chooses a symbol to write (2 options), a direction (2 options) and a next state ($n$ states or halt: $n + 1$ options). There are $2n$ rules (each state, reading 0 or 1). How many different 2-state machines are there?`,
              answer: 20736,
              wrong: [{ v: 1728, why: r`Each 2-state machine has $2 \times 2 = 4$ rules, not 3.` }, { v: 48, why: r`That's $12 \times 4$. The choices multiply: $12^4$.` }],
              hint: r`Each rule has $2 \times 2 \times 3 = 12$ options, and there are 4 rules.`,
              explain: r`$12^4 = 20{,}736$. For 5 states it's $24^{10} \approx 6 \times 10^{13}$, which is why the 2024 proof had to group machines cleverly rather than run each one. The hard part is proving that a non-halting machine **never** halts.`,
            },
            {
              type: 'explain',
              title: 'Unimaginably big',
              body: r`The record step counts grow explosively:

| States | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Most steps | 1 | 6 | 21 | 107 | 47,176,870 |

The 5-state value was confirmed only in 2024, by an online collaboration (the Busy Beaver Challenge) that classified millions of machines, backed by a computer-checked proof. For 6 states, the champion is known to run for more than a tower of fifteen 10s stacked as exponents.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why can’t we compute it?',
              prompt: r`Suppose you had a program that computes the busy-beaver step count $S(n)$ for any $n$. Why would that solve the halting problem (for machines started on a blank tape)?`,
              choices: [
                { t: 'Run any n-state machine for S(n) steps: if it hasn’t halted by then, it never will', ok: true },
                { t: 'It wouldn’t: the two problems are unrelated', why: 'Knowing S(n) gives a deadline. Any n-state machine still running past it must run forever.' },
                { t: 'Because S(n) is always even', why: 'It isn’t (S(3) = 21). The connection is that S(n) is a deadline for halting.' },
              ],
              explain: r`Since the halting problem is undecidable, $S(n)$ can't be computable. In fact, it grows faster than **any** computable function. It's a concrete number for each $n$, but beyond small values no algorithm can find it.`,
            },
          ],
          recap: [
            'The n-state busy beaver is the longest-running halting n-state machine.',
            'Step records: 1, 6, 21, 107, 47,176,870 (proved 2024).',
            'The busy-beaver function is uncomputable: it grows faster than any computable function.',
          ],
        },
      ],
    },
    {
      title: 'Weaker Machines, Harder Puzzles',
      summary: 'Finite automata and undecidable dominoes.',
      lessons: [
        {
          id: 'automata',
          title: 'Machines Without Memory',
          summary: 'Finite automata',
          icon: 'grip',
          steps: [
            {
              type: 'explain',
              title: 'A Turing machine with no tape',
              body: r`Take away the tape's ability to be written on, and make the head move only to the right. What's left is a **finite automaton**: a handful of states, and arrows saying which state to go to after reading each symbol. When the input runs out, the machine **accepts** if it's in a special accepting state.

Finite automata are everywhere: in vending machines, traffic lights, the search box that finds a word in a document, and the circuits that check network data.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Divisible by three?',
              body: r`This automaton reads a binary number from left to right, starting in state R0 (blue arrows for 0, coral for 1). Pick a number and step through its digits. It accepts if it finishes in the double circle, R0.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.9, xmax: 2.6, ymin: -1.9, ymax: 2.4, grid: false, axes: false, maxWidth: 440,
                params: {
                  n: { min: 1, max: 63, step: 1, value: 21, label: 'number', color: 'violet', format: (v) => `${v} = ${bin(v)}₂` },
                  k: { min: 0, max: 6, step: 1, value: 0, label: 'digits read', color: 'amber' },
                },
                extra: (ctx) => dfaDraw(ctx, DFA3, dfaRun(DFA3, ctx.p.n, ctx.p.k)),
                readout: (p) => { const L = bin(p.n).length, k = Math.min(p.k, L), st = dfaRun(DFA3, p.n, k); return `Read ${digitsShown(p.n, k)} → state **R${st}**` + (k === L ? (st === 0 ? `: accepted, and ${p.n} = 3 × ${p.n / 3} ✓` : `: rejected (${p.n} leaves remainder ${p.n % 3})`) : ''); },
              },
              after: r`The state is the **remainder** of the digits read so far when divided by 3. Reading a digit doubles the number so far and adds the digit, so the remainder $r$ becomes $2r + \text{digit}$, reduced mod 3. Three states are all the memory it needs, however long the number.`,
            },
            {
              type: 'numeric',
              title: 'Follow the arrows',
              prompt: r`Feed the automaton the binary number $1011$. Which state does it end in? (Enter 0, 1 or 2.)`,
              lhs: 'R',
              answer: 2,
              wrong: [{ v: 0, why: r`$1011_2 = 11$, which isn't a multiple of 3.` }, { v: 1, why: r`Track it: R0 → R1 → R2 → R2 → R2. Or: $11 = 3 \times 3 + 2$.` }],
              explain: r`R0 →(1) R1 →(0) R2 →(1) R2 →(1) R2. Check: $1011_2 = 11 = 3 \times 3 + 2$, remainder 2, so it's rejected.`,
            },
            {
              type: 'interactive',
              title: 'Build it yourself',
              body: r`The arrows out of R0 are done, but R1's and R2's arrows are scrambled. Set where each one points so the automaton accepts **exactly** the multiples of 3. It's checked on every number from 1 to 63.`,
              widget: {
                kind: 'graph', equal: true, xmin: -2.9, xmax: 2.6, ymin: -1.9, ymax: 2.4, grid: false, axes: false, maxWidth: 440,
                params: Object.fromEntries([['a', 'R1 on 0', 1], ['b', 'R1 on 1', 1], ['c', 'R2 on 0', 2], ['d', 'R2 on 1', 0]].map(([k, label, v]) => [k, { min: 0, max: 2, step: 1, value: v, label, color: k === 'a' || k === 'c' ? 'blue' : 'coral', format: (x) => `→ R${x}` }])),
                extra: (ctx) => dfaDraw(ctx, [[0, 1], [ctx.p.a, ctx.p.b], [ctx.p.c, ctx.p.d]], -1),
                readout: (p) => { const T = [[0, 1], [p.a, p.b], [p.c, p.d]]; const bad = []; for (let n = 1; n <= 63; n++) if ((dfaRun(T, n, 9) === 0) !== (n % 3 === 0)) bad.push(n); return bad.length ? `Wrong on ${bad.length} numbers, e.g. **${bad[0]}** = ${bin(bad[0])}₂` : 'Correct on all 63 numbers ✓'; },
                goal: (p) => { const T = [[0, 1], [p.a, p.b], [p.c, p.d]]; for (let n = 1; n <= 63; n++) if ((dfaRun(T, n, 9) === 0) !== (n % 3 === 0)) return false; return true; },
                hint: 'State Rr means "remainder r so far". Reading digit d leads to remainder 2r + d, reduced mod 3.',
                solution: { a: 2, b: 0, c: 1, d: 2 },
              },
              explain: r`From R1: reading 0 gives $2 \cdot 1 + 0 = 2$, reading 1 gives $3 \equiv 0$. From R2: reading 0 gives $4 \equiv 1$, reading 1 gives $5 \equiv 2$. The same trick builds an automaton for divisibility by any number $m$, with $m$ states.`,
            },
            {
              type: 'mcq',
              title: 'What they can’t do',
              prompt: r`Can a finite automaton check whether a string of brackets like $\texttt{(()(()))}$ is **balanced**?`,
              choices: [
                { t: 'No: it would need to count unboundedly many open brackets, but it has only finitely many states', ok: true },
                { t: 'Yes, with one state for each bracket', why: 'The number of states is fixed in advance, but inputs can be any length.' },
                { t: 'Yes, but only if it reads right to left', why: 'Direction doesn’t help. The problem is the fixed amount of memory.' },
              ],
              explain: r`Say the automaton has $k$ states. Feed it $k + 1$ different numbers of open brackets: by the **pigeonhole principle**, two different counts $i \ne j$ land in the same state. From then on it can't tell them apart, so it treats $\texttt{(}^i\texttt{)}^i$ and $\texttt{(}^j\texttt{)}^i$ alike, accepting a wrong one or rejecting a right one. Checking brackets needs a **stack**, which is why programming-language parsers use more powerful machines.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Multiples of four',
              prompt: r`What is the **smallest** number of states a finite automaton needs to accept exactly the binary numbers divisible by 4 (reading left to right)?`,
              unit: 'states',
              answer: 3,
              wrong: [{ v: 4, why: 'Four remainders work, but remainders 1 and 3 behave identically from then on: after any further digit they lead to the same state. Merge them.' }, { v: 2, why: 'Two states can track only the last digit. Divisibility by 4 depends on the last two.' }],
              hint: 'A binary number is divisible by 4 when it ends in 00. What do you need to remember about the digits read so far?',
              explain: r`It only needs to remember the last two digits, and only three situations matter: "ends in 00" (accept), "ends in 10" (one more 0 would make it divisible), and "ends in 1" (needs two more 0s). So **3 states**. Remainders 1 and 3 merge, since doubling either gives 2 mod 4.`,
            },
          ],
          recap: [
            'A finite automaton reads input once, left to right, with a fixed number of states.',
            'Remainders make good states: divisibility by m needs m states (or fewer).',
            'Finite memory can’t count without limit, so balanced brackets are out of reach.',
          ],
        },
        {
          id: 'dominoes',
          title: 'Undecidable Dominoes',
          summary: 'Post’s correspondence problem',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              title: 'A puzzle with no algorithm',
              body: r`In 1946 Emil Post invented a puzzle. You're given a few kinds of domino, each with a string on top and a string below. Using as many copies of each as you like, in any order, line them up so that the **top row reads exactly the same as the bottom row**.

It sounds like a children's game, but Post proved it is **undecidable**: no algorithm can look at an arbitrary set of dominoes and always say whether a match exists.`,
            },
            {
              type: 'interactive',
              title: 'Make a match',
              body: r`Click dominoes to add them to the row. Letters shaded teal agree; a red letter means the rows have already disagreed. Find a sequence where both rows read the same.`,
              widget: {
                kind: 'pcp', dominoes: [['b', 'ca'], ['a', 'ab'], ['ca', 'a'], ['abc', 'c']], solution: [1, 0, 2, 1, 3],
                hint: 'The first domino must start the same letter on top and bottom. Only one domino does that.',
              },
              explain: r`Dominoes 2, 1, 3, 2, 4 spell $\texttt{abcaaabc}$ on both rows. Notice the strategy: each domino has to repair the overhang left by the last one, so your choices are forced most of the time.`,
            },
            {
              type: 'interactive',
              title: 'A harder set',
              body: r`Here's another set. This time the bottom row tends to run ahead, and you have to catch the top row up.`,
              widget: {
                kind: 'pcp', dominoes: [['a', 'baa'], ['ab', 'aa'], ['bba', 'bb']], solution: [2, 1, 2, 0],
                hint: 'Domino 1 starts with a on top but b below, so it can’t go first. Try starting with domino 3.',
              },
              explain: r`Dominoes 3, 2, 3, 1 give $\texttt{bbaabbbaa}$ on both rows. These were short, but lengths can explode: the innocent-looking set $\tfrac{\texttt{a}}{\texttt{b}}, \tfrac{\texttt{b}}{\texttt{ab}}, \tfrac{\texttt{abb}}{\texttt{a}}$ has a match, but the shortest one uses **30 dominoes**.`,
            },
            {
              type: 'mcq',
              title: 'Spotting a dead end',
              prompt: r`Why does the set $\tfrac{\texttt{ab}}{\texttt{a}}, \tfrac{\texttt{ba}}{\texttt{b}}, \tfrac{\texttt{aab}}{\texttt{aa}}$ have **no** match at all?`,
              choices: [
                { t: 'Every top string is longer than its bottom string, so the top row is always longer', ok: true },
                { t: 'There is no domino whose top and bottom start with the same letter', why: 'All three do: ab/a, ba/b and aab/aa start with matching letters.' },
                { t: 'There are only three dominoes', why: 'The two puzzles you solved had three or four dominoes.' },
              ],
              explain: r`Each domino adds one more letter to the top than to the bottom, so after $k$ dominoes the top is $k$ letters longer: they can never be equal. Simple arguments like this rule out many sets, but Post's theorem says no collection of tricks can handle **every** set.`,
            },
            {
              type: 'explain',
              title: 'Dominoes that compute',
              body: r`Why is it undecidable? Given any Turing machine, you can design dominoes that write out the machine's run, one configuration (tape, head position and state) after another. The bottom row always runs one configuration **ahead** of the top, and the dominoes are designed so the top can catch up only once the machine reaches its halt state.

So the dominoes have a match **exactly when the machine halts**. A domino-solving algorithm would therefore solve the halting problem, which is impossible. This technique, turning one problem into another, is called a **reduction**, and it's how most problems are shown to be undecidable.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Just search!',
              prompt: r`A computer tries every sequence of 1 domino, then every sequence of 2, then 3, and so on. What goes wrong?`,
              choices: [
                { t: 'If a match exists it will find it, but if none exists it searches forever and never knows when to give up', ok: true },
                { t: 'It might miss a match', why: 'Trying every sequence in order of length is guaranteed to reach any match eventually.' },
                { t: 'Nothing: that solves the problem', why: 'It only answers "yes". For sets with no match, it never produces an answer.' },
              ],
              explain: r`The search confirms every "yes" but can never confirm a "no". Problems like this are called **semi-decidable**, and the halting problem is one too: just run the program and wait. Undecidability means no program can ever know, in general, when to stop waiting.`,
            },
          ],
          recap: [
            'Post’s correspondence problem: line up dominoes so top and bottom match.',
            'It is undecidable: dominoes can simulate any Turing machine.',
            'Searching finds every match that exists, but can never prove that none does.',
          ],
        },
      ],
    },
  ],
};
