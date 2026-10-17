const r = String.raw;

// ── circuits ─────────────────────────────────────────────
const andDemo = {
  kind: 'gates', width: 560, height: 230, ready: true,
  inputs: [{ id: 'A', x: 70, y: 70 }, { id: 'B', x: 70, y: 160 }],
  gates: [{ id: 'g', type: 'AND', in: ['A', 'B'], x: 250, y: 115 }],
  outputs: [{ id: 'L', from: 'g', x: 460, y: 115, label: 'lamp' }],
  readout: (v) => `A = ${v.A}, B = ${v.B} → lamp = **${v.L}**`,
};

const combo = {
  kind: 'gates', width: 600, height: 280,
  inputs: [{ id: 'A', x: 60, y: 60 }, { id: 'B', x: 60, y: 140 }, { id: 'C', x: 60, y: 220 }],
  gates: [
    { id: 'g1', type: 'AND', in: ['A', 'B'], x: 200, y: 100 },
    { id: 'g2', type: 'NOT', in: ['C'], x: 200, y: 220 },
    { id: 'g3', type: 'OR', in: ['g1', 'g2'], x: 360, y: 160 },
  ],
  outputs: [{ id: 'L', from: 'g3', x: 520, y: 160, label: 'lamp' }],
  goal: (v) => v.L === 0,
  hint: 'The OR gate lights the lamp if **either** of its inputs is 1. Make both 0.',
  solution: { C: 1 },
};

const mystery = {
  kind: 'gates', width: 560, height: 240, ready: true,
  inputs: [{ id: 'A', x: 70, y: 75 }, { id: 'B', x: 70, y: 165 }],
  gates: [{ id: 'g', type: 'XOR', in: ['A', 'B'], x: 250, y: 120, hidden: true }],
  outputs: [{ id: 'L', from: 'g', x: 460, y: 120, label: 'lamp' }],
  readout: (v) => `A = ${v.A}, B = ${v.B} → lamp = **${v.L}**`,
};

const nandNot = {
  kind: 'gates', width: 520, height: 200, ready: true,
  inputs: [{ id: 'A', x: 80, y: 100 }],
  gates: [{ id: 'g', type: 'NAND', in: ['A', 'A'], x: 240, y: 100, via: [170, 170] }],
  outputs: [{ id: 'L', from: 'g', x: 430, y: 100, label: 'out' }],
  readout: (v) => `A = ${v.A} → out = **${v.L}**`,
};

const nandAnd = {
  kind: 'gates', width: 600, height: 230,
  inputs: [{ id: 'A', x: 60, y: 70 }, { id: 'B', x: 60, y: 160 }],
  gates: [
    { id: 'g1', type: 'NAND', in: ['A', 'B'], x: 200, y: 115 },
    { id: 'g2', type: 'NAND', in: ['g1', 'g1'], x: 350, y: 115, via: [305, 305] },
  ],
  outputs: [{ id: 'L', from: 'g2', x: 530, y: 115, label: 'lamp' }],
  readout: (v) => `A = ${v.A}, B = ${v.B} → first NAND = ${v.g1} → lamp = **${v.L}**`,
  goal: (v) => v.L === 1,
  hint: 'The second NAND has both inputs tied together: it’s a NOT gate.',
  solution: { A: 1, B: 1 },
};

const halfAdder = {
  kind: 'gates', width: 600, height: 260,
  inputs: [{ id: 'A', x: 60, y: 80 }, { id: 'B', x: 60, y: 190 }],
  gates: [
    { id: 'x', type: 'XOR', in: ['A', 'B'], x: 270, y: 91, via: [null, 180] },
    { id: 'a', type: 'AND', in: ['A', 'B'], x: 270, y: 190, via: [140, 180] },
  ],
  outputs: [{ id: 'S', from: 'x', x: 470, y: 91, label: 'sum' }, { id: 'C', from: 'a', x: 470, y: 190, label: 'carry' }],
  readout: (v) => `$${v.A} + ${v.B} = ${v.C}${v.S}_2$ $\\;$ (carry ${v.C}, sum ${v.S})`,
  goal: (v) => v.S === 0 && v.C === 1,
  hint: 'Which single-bit addition produces a carry?',
  solution: { A: 1, B: 1 },
};

const latch = {
  kind: 'gates', width: 600, height: 300,
  inputs: [{ id: 'R', x: 115, y: 89, label: 'Reset' }, { id: 'S', x: 115, y: 211, label: 'Set' }],
  gates: [
    { id: 'q', type: 'NOR', in: ['R', 'nq'], x: 240, y: 100, init: 0, via: [null, [[336, 200], [336, 175], [212, 136], [212, 111]]] },
    { id: 'nq', type: 'NOR', in: ['q', 'S'], x: 240, y: 200, init: 1, via: [[[322, 100], [322, 125], [224, 164], [224, 189]], null] },
  ],
  outputs: [{ id: 'Q', from: 'q', x: 500, y: 100, label: 'Q' }],
  readout: (v) => `Set = ${v.S}, Reset = ${v.R} → **Q = ${v.Q}**${!v.S && !v.R ? ' (holding its memory)' : ''}`,
  goal: (v) => v.Q === 1 && v.S === 0 && v.R === 0,
  hint: 'Flip Set on, then off again. Watch whether Q changes when you let go.',
  solution: [{ S: 1 }, { S: 0 }],
};

const majority = {
  kind: 'gates', width: 600, height: 300,
  inputs: [{ id: 'A', x: 60, y: 60 }, { id: 'B', x: 60, y: 150 }, { id: 'C', x: 60, y: 240 }],
  gates: [
    { id: 'g1', type: 'AND', in: ['A', 'B'], x: 250, y: 90, via: [130, 145] },
    { id: 'g2', type: 'AND', in: ['B', 'C'], x: 250, y: 170, via: [160, 175] },
    { id: 'g3', type: 'AND', in: ['A', 'C'], x: 250, y: 250, via: [115, 190] },
    { id: 'o', type: 'OR', in: ['g1', 'g2', 'g3'], x: 420, y: 170, via: [360, 375, 390] },
  ],
  outputs: [{ id: 'L', from: 'o', x: 545, y: 170, label: 'yes' }],
  readout: (v) => `votes for: ${v.A + v.B + v.C} of 3 → decision = **${v.L ? 'yes' : 'no'}**`,
  goal: (v) => v.L === 1 && v.A + v.B + v.C === 2,
  hint: 'Each AND gate checks one pair of voters.',
  solution: { A: 1, B: 1 },
};

const mux = {
  kind: 'gates', width: 620, height: 290,
  inputs: [{ id: 'A', x: 60, y: 60 }, { id: 'S', x: 60, y: 150 }, { id: 'B', x: 60, y: 240 }],
  gates: [
    { id: 'n', type: 'NOT', in: ['S'], x: 170, y: 110, via: [130] },
    { id: 'a1', type: 'AND', in: ['A', 'n'], x: 300, y: 70, via: [250, 260] },
    { id: 'a2', type: 'AND', in: ['S', 'B'], x: 300, y: 230, via: [200, 230] },
    { id: 'o', type: 'OR', in: ['a1', 'a2'], x: 440, y: 150, via: [395, 410] },
  ],
  outputs: [{ id: 'L', from: 'o', x: 565, y: 150, label: 'out' }],
  readout: (v) => `select = ${v.S} → passing input **${v.S ? 'B' : 'A'}** (A = ${v.A}, B = ${v.B}) → out = **${v.L}**`,
  goal: (v) => v.S === 1 && v.B === 1 && v.A === 0 && v.L === 1,
  hint: 'Set the select switch to choose B, then make B carry a 1 while A carries a 0.',
  solution: { S: 1, B: 1 },
};

const comparator = {
  kind: 'gates', width: 620, height: 320,
  inputs: [{ id: 'A1', x: 70, y: 50 }, { id: 'B1', x: 70, y: 120 }, { id: 'A0', x: 70, y: 200 }, { id: 'B0', x: 70, y: 270 }],
  gates: [
    { id: 'x1', type: 'XNOR', in: ['A1', 'B1'], x: 260, y: 85, via: [190, 190] },
    { id: 'x0', type: 'XNOR', in: ['A0', 'B0'], x: 260, y: 235, via: [190, 190] },
    { id: 'e', type: 'AND', in: ['x1', 'x0'], x: 420, y: 160, via: [370, 370] },
  ],
  outputs: [{ id: 'L', from: 'e', x: 550, y: 160, label: 'equal' }],
  readout: (v) => `A = ${v.A1}${v.A0}₂ = ${2 * v.A1 + v.A0}, B = ${v.B1}${v.B0}₂ = ${2 * v.B1 + v.B0} → equal = **${v.L}**`,
  goal: (v) => v.A1 === 1 && v.A0 === 0 && v.L === 1,
  hint: 'Each XNOR lights when its two bits match.',
  solution: { A1: 1, B1: 1 },
};

export default {
  id: 'digital',
  subject: 'math',
  title: 'Digital Logic',
  level: 'Intermediate',
  cover: 'digital',
  tagline: 'Logic gates, adders, memory, circuit design and multiplexers: how computers think in 0s and 1s.',
  description: r`Every computer is built from tiny switches combined into **logic gates**. Flip switches to explore AND, OR and NOT, discover the one gate that can build all the others, wire up a circuit that adds binary numbers, build a circuit that remembers, then design circuits from truth tables and build the selectors and comparators inside every processor.`,
  prereq: 'Binary & Information',
  chapters: [
    {
      title: 'Logic Gates',
      summary: 'Switches that decide.',
      lessons: [
        {
          id: 'gates',
          title: 'AND, OR, NOT',
          summary: 'The basic building blocks',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Bits as voltages',
              body: r`Inside a chip, a bit is a voltage on a wire: **high** means 1, **low** means 0. A **logic gate** is a tiny circuit that takes one or more input bits and produces an output bit by a fixed rule.

The three basic gates:
- **AND**: the output is 1 only if **all** inputs are 1.
- **OR**: the output is 1 if **at least one** input is 1.
- **NOT**: flips its input: 0 becomes 1, 1 becomes 0.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'An AND gate',
              body: r`Click the switches. Live wires glow coral.`,
              widget: andDemo,
              after: r`The lamp lights only when **both** A and B are on. Listing every input combination gives the gate's **truth table**:

| A | B | A AND B |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Turn off the lamp',
              prompt: r`This circuit computes **(A AND B) OR (NOT C)**. Right now the lamp is on. Set the switches to turn it **off**.`,
              widget: combo,
              explain: r`The OR gate is off only when both of its inputs are 0. That needs NOT C = 0, so **C = 1**, and A AND B = 0, so A and B must not both be on.`,
            },
            {
              type: 'numeric',
              title: 'Rows in the table',
              prompt: r`How many rows does the truth table of a circuit with **3** inputs have?`,
              answer: 8,
              wrong: [{ v: 3, why: r`Each input can be 0 or 1, so the rows are all combinations: $2 \times 2 \times 2$.` }, { v: 6, why: r`It's $2^3$, not $2 \times 3$.` }, { v: 9, why: r`It's $2^3$: each input has two possible values, not three.` }],
              explain: r`Each input is 0 or 1, so there are $2^3 = 8$ combinations, one per row. With $n$ inputs there are $2^n$ rows.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'A mystery gate',
              body: r`This gate's type is hidden. Try every combination of inputs and work out its rule.`,
              widget: mystery,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Name that gate',
              prompt: r`Which rule did the mystery gate follow?`,
              choices: [
                { t: 'The output is 1 when exactly one input is 1', ok: true },
                { t: 'The output is 1 when at least one input is 1 (OR)', why: 'Try A = 1 and B = 1: the lamp goes off, which an OR gate wouldn’t do.' },
                { t: 'The output is 1 when both inputs are equal', why: 'That rule is called XNOR. Here, the lamp lights when the inputs are different.' },
              ],
              explain: r`It's an **XOR** ("exclusive or") gate: 1 when the inputs **differ**. It answers "one or the other, but not both". XOR will turn out to be exactly what we need for adding bits.`,
            },
          ],
          recap: [
            'AND: 1 only if all inputs are 1. OR: 1 if any input is 1. NOT: flips.',
            r`A truth table lists the output for all $2^n$ input combinations.`,
            'XOR outputs 1 when its inputs differ.',
          ],
        },
        {
          id: 'nand',
          title: 'One Gate to Rule Them All',
          summary: 'NAND is universal',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'NAND',
              body: r`A **NAND** gate is an AND followed by a NOT. Its output is 0 only when **both** inputs are 1. The little circle on its tip means "then flip".

| A | B | A NAND B |
|---|---|---|
| 0 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

Surprisingly, NAND gates **alone** can build **any** logic circuit. Let's see how.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'NOT from NAND',
              body: r`Feed the same signal into both inputs of a NAND.`,
              widget: nandNot,
              after: r`A NAND A $=$ NOT(A AND A) $=$ NOT A. A NAND with its inputs tied together is a **NOT gate**.`,
            },
            {
              type: 'interactive',
              title: 'AND from NANDs',
              prompt: r`This circuit is a NAND followed by a NAND-as-NOT. Find the inputs that light the lamp.`,
              widget: nandAnd,
              explain: r`NOT(NAND) is just AND, so the lamp lights only when A = B = 1. Two NAND gates make an **AND** gate.`,
            },
            {
              type: 'explain',
              title: 'De Morgan’s laws',
              body: r`To get OR, we use two rules discovered by Augustus De Morgan:
$$\text{NOT}(A \text{ AND } B) = (\text{NOT } A) \text{ OR } (\text{NOT } B)$$
$$\text{NOT}(A \text{ OR } B) = (\text{NOT } A) \text{ AND } (\text{NOT } B)$$
"It's not true that both hold" means "at least one fails".`,
            },
            {
              type: 'numeric',
              title: 'XOR from NAND',
              prompt: r`Exclusive OR (XOR) outputs 1 when exactly one input is 1. What is the smallest number of NAND gates that can build it?`,
              answer: 4,
              explain: r`Four NAND gates make an XOR: one NAND of the inputs, two NANDs combining each input with that, and a final NAND. XOR is the heart of binary addition and of many ciphers.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'OR from NANDs',
              prompt: r`Flip A and B with NOTs, then feed them into a NAND: $(\text{NOT } A) \text{ NAND } (\text{NOT } B)$. What does this compute?`,
              cols: 2,
              choices: [
                { t: 'A OR B', ok: true },
                { t: 'A AND B', why: r`Check $A = 1, B = 0$: NOT A = 0 and NOT B = 1, and 0 NAND 1 = 1. But A AND B = 0.` },
                { t: 'A NOR B', why: r`Check $A = B = 0$: NOT A = NOT B = 1, and 1 NAND 1 = 0. A NOR B would be 1.` },
                { t: 'A XOR B', why: r`Check $A = B = 1$: both NOTs give 0, and 0 NAND 0 = 1. XOR would be 0.` },
              ],
              explain: r`$(\text{NOT } A) \text{ NAND } (\text{NOT } B) = \text{NOT}((\text{NOT } A) \text{ AND } (\text{NOT } B)) = A \text{ OR } B$, by De Morgan. Since NOT, AND and OR can all be built from NAND, so can **every** circuit. (NOR is universal too: the Apollo Guidance Computer was built almost entirely from NOR gates.)`,
            },
          ],
          recap: [
            'NAND = NOT AND. NAND with both inputs tied together is NOT.',
            'De Morgan: NOT(A AND B) = NOT A OR NOT B, and NOT(A OR B) = NOT A AND NOT B.',
            'NAND alone can build any logic circuit.',
          ],
        },
      ],
    },
    {
      title: 'Computing',
      summary: 'Adding and remembering.',
      lessons: [
        {
          id: 'adders',
          title: 'Adding Machines',
          summary: 'Half adders and full adders',
          icon: 'sigma',
          steps: [
            {
              type: 'explain',
              title: 'Adding single bits',
              body: r`Adding two bits has only four cases:
$$0 + 0 = 0, \qquad 0 + 1 = 1, \qquad 1 + 0 = 1, \qquad 1 + 1 = 10_2$$
The answer needs two bits: a **sum** bit and a **carry** bit.

| A | B | carry | sum |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 0 |

Look at the columns. Do you recognise them?`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A half adder',
              prompt: r`The sum is an **XOR** and the carry is an **AND**. Set the inputs to produce **sum 0, carry 1**.`,
              widget: halfAdder,
              explain: r`$1 + 1 = 10_2$: sum 0, carry 1. This two-gate circuit is a **half adder**. "Half", because it can't accept a carry coming in from the previous column.`,
            },
            {
              type: 'explain',
              title: 'Full adders in a chain',
              body: r`To add longer numbers, each column must add **three** bits: $A$, $B$ and the carry from the column to its right. A **full adder** does this (it's built from two half adders and an OR gate).

Chain full adders together, each passing its carry to the next, and you get a **ripple-carry adder** that adds numbers of any length, just like column addition by hand:
$$\begin{array}{r} \scriptstyle 1\,1\,1\phantom{0} \\ 1011 \\ +\ 0111 \\ \hline 10010 \end{array}$$`,
            },
            {
              type: 'numeric',
              title: 'Add in binary',
              prompt: r`Compute $1101_2 + 0110_2$. Give the answer in **binary**.`,
              answer: 10011,
              wrong: [{ v: 19, why: 'That’s right in decimal! Now write 19 in binary.' }, { v: 1011, why: r`Remember the carries: $1 + 1 = 10_2$ carries a 1 to the next column.` }, { v: 11011, why: r`Check the carries again: $13 + 6 = 19 = 10011_2$.` }],
              explain: r`$1101_2 = 13$ and $0110_2 = 6$, so the sum is $19 = 10011_2$. Column by column from the right: $1 + 0 = 1$; $0 + 1 = 1$; $1 + 1 = 0$ carry 1; $1 + 0 + 1 = 0$ carry 1; and the final carry gives the leading 1.`,
            },
            {
              type: 'numeric',
              title: 'Room for the carry',
              prompt: r`Adding two 8-bit numbers can give at most $255 + 255$. How many bits are needed to hold any such sum?`,
              answer: 9,
              explain: r`$510$ needs 9 bits ($2^9 = 512$). The extra bit is the final carry out of the adder, which processors store as a "carry flag".`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Why it ripples',
              prompt: r`In a 64-bit ripple-carry adder, why can the top bit's answer take the longest?`,
              choices: [
                { t: 'It has to wait for a carry that may ripple through all 63 columns below it', ok: true },
                { t: 'The top bit uses a different kind of gate', why: 'Every column uses the same full adder.' },
                { t: 'Bigger numbers need more electricity', why: 'The delay comes from waiting: each column needs the carry from the column before.' },
              ],
              explain: r`Adding $0111\ldots1 + 1$ makes a carry ripple from the bottom all the way to the top, one gate delay after another. Real processors use cleverer **carry-lookahead** adders that work out many carries at once, trading extra gates for speed.`,
            },
          ],
          recap: [
            'Half adder: sum = A XOR B, carry = A AND B.',
            'A full adder also takes a carry in. Chained together, they add numbers of any length.',
            'Ripple carries are slow, so fast chips predict carries in advance.',
          ],
        },
        {
          id: 'memory',
          title: 'Circuits That Remember',
          summary: 'Feedback and latches',
          icon: 'clock',
          steps: [
            {
              type: 'explain',
              title: 'Feedback',
              body: r`Every circuit so far has been a one-way street: inputs flow to outputs, and the output depends only on the current inputs. To **remember**, a circuit needs **feedback**: outputs that loop back into its own inputs.

The simplest memory is the **SR latch**: two NOR gates, each feeding its output into the other. It has two inputs: **Set** (store a 1) and **Reset** (store a 0).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Store a bit',
              prompt: r`Make Q light up, and then turn **both** switches off. Does the latch remember?`,
              widget: latch,
              explain: r`Turning Set on forces Q to 1. When you let go, the two NOR gates hold each other in place: Q = 1 keeps the lower gate's output at 0, which keeps Q at 1. The circuit **remembers** one bit until you press Reset.`,
            },
            {
              type: 'mcq',
              title: 'Both at once',
              prompt: r`What happens if Set and Reset are **both** 1?`,
              choices: [
                { t: 'Both NOR outputs are forced to 0: an invalid state designers avoid', ok: true },
                { t: 'Q becomes 1', why: 'A NOR with any input at 1 outputs 0, so both outputs go to 0.' },
                { t: 'The circuit stores whichever was pressed first', why: 'While both are held, both outputs are 0. What happens when you release them depends on timing, which is unpredictable.' },
              ],
              explain: r`Each NOR gate has a 1 input, so both output 0, and $Q$ and $\bar Q$ are no longer opposites. When both are released together, the result depends on which gate is fractionally faster. Practical designs (like the **D flip-flop**) are wired so this can't happen.`,
            },
            {
              type: 'explain',
              title: 'From latches to computers',
              body: r`Add a **clock** (a signal ticking billions of times a second) so that latches only update on each tick, and you get **flip-flops**. Rows of flip-flops make **registers**, and huge grids of memory cells make **RAM**. (Fast SRAM uses about 6 transistors per bit. Dense DRAM stores each bit as charge on a tiny capacitor that must be refreshed many times a second.)

Gates for computing, plus memory for remembering, plus a clock to keep time: that's a computer.`,
            },
            {
              type: 'numeric',
              title: 'Storing a kibibyte',
              prompt: r`Each flip-flop stores one bit. How many flip-flops would store 1 KiB (1,024 bytes)?`,
              answer: 8192,
              explain: r`$1{,}024 \times 8 = 8{,}192$. Main memory uses far denser cells (a transistor and a tiny capacitor per bit, refreshed constantly), but processor registers and caches use flip-flop-like circuits.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Moore’s law',
              prompt: r`The first microprocessor (Intel 4004, 1971) had about 2,300 transistors. If transistor counts doubled every 2 years for 50 years, by what factor would they grow?`,
              unit: '×',
              answer: 2 ** 25,
              relTol: 0.02,
              wrong: [{ v: 50, why: r`Doubling multiplies: 50 years is 25 doublings, so $2^{25}$.` }, { v: 2 ** 50, tol: 2 ** 50 * 0.02, why: 'It doubles every 2 years, not every year: 25 doublings.' }, { v: 25, why: r`25 is the number of doublings. The factor is $2^{25}$.` }],
              explain: r`50 years is 25 doublings: $2^{25} \approx 33.5$ million. Then $2{,}300 \times 33.5$ million $\approx 77$ billion, which is indeed the scale of today's biggest chips, with tens of billions of transistors. Gordon Moore made this prediction in 1965 (revised to two years in 1975), and it held up remarkably well for decades.`,
            },
          ],
          recap: [
            'Memory needs feedback: outputs looping back into inputs.',
            'An SR latch (two cross-coupled NOR gates) stores one bit.',
            'Clocked latches become flip-flops, registers and RAM.',
          ],
        },
      ],
    },
    {
      title: 'Designing with Gates',
      summary: 'From truth tables to useful circuits.',
      lessons: [
        {
          id: 'design',
          title: 'Designing Circuits',
          summary: 'From a truth table to gates',
          icon: 'pencil',
          steps: [
            {
              type: 'explain',
              title: 'Sum of products',
              body: r`Any truth table can be turned into a circuit:
1. For each row where the output should be 1, build an **AND** of the inputs, using NOT on any input that's 0 in that row.
2. **OR** all those AND terms together.

For example, XOR is 1 for the rows (A = 1, B = 0) and (A = 0, B = 1), so $\text{XOR} = (A \text{ AND NOT } B) \text{ OR } (\text{NOT } A \text{ AND } B)$. This "sum of products" recipe proves that AND, OR and NOT can build **any** logic function.`,
            },
            {
              type: 'numeric',
              title: 'Majority rules',
              prompt: r`Three judges vote yes (1) or no (0), and the decision is yes when **at least two** vote yes. In the 8-row truth table, how many rows give "yes"?`,
              answer: 4,
              wrong: [{ v: 3, why: 'Don’t forget the row where all three vote yes.' }, { v: 1, why: 'Any two yes votes are enough, not just all three.' }],
              explain: r`110, 101, 011 and 111: four rows.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'A voting machine',
              prompt: r`This circuit checks each pair of judges with an AND gate, then combines the three with OR. Make it decide **yes** with exactly two judges voting yes.`,
              widget: majority,
              explain: r`Any two yes votes switch on one of the AND gates, and the OR passes it on. The recipe would have needed four AND terms (one per row), but $AB + BC + AC$ covers all four rows with three: simplifying circuits saves gates, power and space.`,
            },
            {
              type: 'mcq',
              title: 'Simplify',
              prompt: r`A circuit computes $(A \text{ AND } B) \text{ OR } (A \text{ AND NOT } B)$. What is it equivalent to?`,
              cols: 2,
              choices: [
                { t: 'Just A', ok: true },
                { t: 'A AND B', why: 'Check A = 1, B = 0: the second term is 1.' },
                { t: 'A XOR B', why: 'Check A = 1, B = 1: the first term is 1, but XOR gives 0.' },
                { t: 'Always 1', why: 'Check A = 0: both terms are 0.' },
              ],
              explain: r`Factor out A: $A \text{ AND } (B \text{ OR NOT } B) = A \text{ AND } 1 = A$. Boolean algebra, invented by George Boole in 1854, lets engineers simplify circuits like algebra, long before anyone built a computer.`,
            },
            {
              type: 'numeric',
              title: 'Truth table size',
              prompt: r`A circuit has 4 inputs. How many rows does its truth table have?`,
              answer: 16,
              explain: r`$2^4 = 16$ combinations of inputs. Each output can be on or off for each row, so there are $2^{16} = 65{,}536$ different 4-input Boolean functions.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How many gates are there?',
              prompt: r`A two-input logic function is defined by its outputs for the 4 possible input rows. How many different two-input functions are there?`,
              answer: 16,
              wrong: [{ v: 4, why: 'There are 4 rows, but each row’s output can be 0 or 1 independently.' }, { v: 8, why: r`Each of the 4 rows has 2 choices: $2^4$.` }],
              explain: r`$2^4 = 16$. They include AND, OR, NAND, NOR, XOR, XNOR, "always 0", "always 1", "just A", "NOT B" and others. With $n$ inputs there are $2^{2^n}$ functions: 256 for three inputs, over 4 billion for five.`,
            },
          ],
          recap: [
            'Sum of products: AND each “yes” row, then OR them together.',
            'AND, OR and NOT can build any logic function.',
            'Boolean algebra simplifies circuits, saving gates.',
          ],
        },
        {
          id: 'select',
          title: 'Selecting & Comparing',
          summary: 'Multiplexers and comparators',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'A railway junction for data',
              body: r`A **multiplexer** chooses which of several inputs reaches the output, controlled by a **select** signal, like points on a railway line. With one select bit, it chooses between two inputs:
$$\text{out} = (A \text{ AND NOT } S) \text{ OR } (B \text{ AND } S)$$
When $S = 0$, A passes through; when $S = 1$, B does.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Route the signal',
              prompt: r`Make the output show **B's** value: use the select switch S to choose B, set B to 1 and A to 0, and check the lamp lights.`,
              widget: mux,
              explain: r`With select = 1, the NOT gate blocks A's AND gate and opens B's. Whatever B does, the output follows. Computers use huge multiplexers to pick which memory location, register or result goes where.`,
            },
            {
              type: 'numeric',
              title: 'Eight inputs',
              prompt: r`How many select bits does a multiplexer need to choose among 8 inputs?`,
              answer: 3,
              wrong: [{ v: 8, why: 'Each select bit doubles the number of choices.' }, { v: 4, why: r`$2^3 = 8$, so 3 bits are enough.` }],
              explain: r`$2^3 = 8$: three select bits give a binary "address" from 000 to 111 for the input.`,
            },
            {
              type: 'explain',
              title: 'Are two numbers equal?',
              body: r`An **XNOR** gate outputs 1 exactly when its two inputs are **the same**. To test whether two binary numbers are equal, compare them bit by bit with XNOR gates and AND the results: only if every pair of bits matches does the output light.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Equal or not?',
              prompt: r`Set $A = 2$ (binary 10), then choose B so the **equal** lamp lights.`,
              widget: comparator,
              explain: r`B must also be 10: both XNOR gates then output 1, and the AND lights the lamp. Change any single bit and the lamp goes out.`,
            },
            {
              type: 'mcq',
              title: 'Inside a processor',
              prompt: r`A processor's arithmetic logic unit (ALU) can add, subtract, AND, OR and compare. How does it switch between operations so quickly?`,
              choices: [
                { t: 'Circuits for every operation work in parallel, and a multiplexer selects the result the instruction asks for', ok: true },
                { t: 'It rewires itself for each instruction', why: 'Ordinary processors don’t rewire. All the circuits exist permanently.' },
                { t: 'It performs only one operation, addition, and fakes the others', why: 'Subtraction uses addition, but logic operations and comparisons have their own circuits.' },
              ],
              explain: r`Building every circuit and choosing a result is faster than doing one thing at a time. The instruction's bits drive the multiplexer's select inputs: the hardware equivalent of an if-statement, billions of times a second.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Comparing big numbers',
              prompt: r`How many XNOR gates does an equality comparator for two 32-bit numbers need?`,
              answer: 32,
              wrong: [{ v: 64, why: 'Each XNOR compares one pair of bits: 32 pairs.' }, { v: 1, why: 'One XNOR handles one pair of bits.' }],
              explain: r`32 XNOR gates, one per bit position, feeding a big AND (built from 31 two-input ANDs, or a tree of them). Real processors compare numbers this way in a fraction of a nanosecond.`,
            },
          ],
          recap: [
            'A multiplexer uses select bits to choose an input; n select bits choose among 2ⁿ inputs.',
            'XNOR detects equal bits; AND-ing them tests whether numbers are equal.',
            'ALUs compute many results in parallel and select one.',
          ],
        },
        {
          id: 'seven-segment',
          title: 'Seven-Segment Displays',
          summary: 'Turning binary into digits',
          icon: 'bulb',
          steps: [
            {
              type: 'explain',
              title: 'Seven bars make ten digits',
              body: r`Calculators, alarm clocks and microwave ovens show numbers with seven light-up bars, labelled **a** (top), **b** (top right), **c** (bottom right), **d** (bottom), **e** (bottom left), **f** (top left) and **g** (middle).

Inside, a **decoder** circuit takes a digit as a 4-bit binary number and decides, for each of the seven segments, whether it should be on. Each segment is just a Boolean function of the four input bits.`,
            },
            {
              type: 'mcq',
              title: 'Lighting a 7',
              prompt: r`Which segments light up to show the digit 7?`,
              choices: [
                { t: 'a, b and c', ok: true },
                { t: 'a, b, c and f', why: 'Some displays add f for a fancier 7, but the standard 7 uses only the top bar and the right side.' },
                { t: 'b and c', why: 'That’s the digit 1. A 7 also needs the top bar a.' },
              ],
              explain: r`The top bar plus the right-hand side: **a, b, c**. Only 1 uses fewer segments (b and c).`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Inside the decoder',
              prompt: r`Choose a digit to see its binary input and lit segments. Find the only digit that lights segment **e** (bottom left) but **not** segment **c** (bottom right).`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 10, ymin: 0, ymax: 8, grid: false, axes: false, maxWidth: 380, pad: 6,
                params: { d: { min: 0, max: 9, step: 1, value: 4, label: 'digit', color: 'coral' } },
                extra: ({ plot, p, s }) => { const SEG = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'][p.d], R = { a: [[1.6, 7], [4.4, 7]], b: [[4.6, 6.8], [4.6, 4.2]], c: [[4.6, 3.8], [4.6, 1.2]], d: [[1.6, 1], [4.4, 1]], e: [[1.4, 3.8], [1.4, 1.2]], f: [[1.4, 6.8], [1.4, 4.2]], g: [[1.6, 4], [4.4, 4]] }, out = []; for (const [k, [[x1, y1], [x2, y2]]] of Object.entries(R)) { const on = SEG.includes(k); out.push(s('line', { x1: plot.X(x1), y1: plot.Y(y1), x2: plot.X(x2), y2: plot.Y(y2), stroke: on ? 'var(--coral)' : 'var(--line-2)', 'stroke-width': 13, 'stroke-linecap': 'round', opacity: on ? 1 : 0.5 }), s('text', { x: plot.X((x1 + x2) / 2 + (x1 === x2 ? (x1 < 3 ? -0.6 : 0.6) : 0)), y: plot.Y((y1 + y2) / 2 + (y1 === y2 ? 0.55 : 0)) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: k })); } const bits = p.d.toString(2).padStart(4, '0'); [...bits].forEach((b, i) => out.push(s('rect', { x: plot.X(6.4 + i * 0.85), y: plot.Y(4.6), width: plot.X(0.7) - plot.X(0), height: plot.Y(0) - plot.Y(1.2), rx: 4, class: b === '1' ? 'fl-blue' : 'fl-card', stroke: 'var(--line-2)' }), s('text', { x: plot.X(6.75 + i * 0.85), y: plot.Y(4) + 6, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(16px * var(--fs, 1)), var(--fmin, 0px))', fill: b === '1' ? 'var(--card)' : 'var(--ink-2)', text: b }))); out.push(s('text', { x: plot.X(8.05), y: plot.Y(5.2), 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(12px * var(--fs, 1)), var(--fmin, 0px))', fill: 'var(--ink-3)', text: 'binary input' })); return out; },
                readout: (p) => { const SEG = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'][p.d]; return `digit ${p.d} = ${p.d.toString(2).padStart(4, '0')} · segments **${SEG.split('').join(', ')}** (${SEG.length} lit)`; },
                goal: (p) => p.d === 2,
                hint: 'Segment c is on for almost every digit. Which digit leaves the bottom right dark?',
                solution: { d: 2 },
              },
              explain: r`Only **2** (segments a, b, d, e, g) uses the bottom-left bar without the bottom-right one; c is off for no other digit. The decoder’s logic for segment c is therefore simple: "on unless the input is 0010".`,
            },
            {
              type: 'mcq',
              title: 'Segment e',
              prompt: r`For which digits is segment **e** (bottom left) lit?`,
              choices: [
                { t: '0, 2, 6 and 8', ok: true },
                { t: 'All the even digits', why: '4 is even, but its bottom-left bar is dark.' },
                { t: '0, 6 and 8', why: 'Don’t forget 2, which uses the bottom-left bar.' },
              ],
              explain: r`0, 2, 6 and 8: all even, so all have last bit 0. A circuit designer would write e as (last bit is 0) AND NOT (input is 4), and then simplify it with Boolean algebra or a Karnaugh map.`,
            },
            {
              type: 'numeric',
              title: 'Counting segments',
              prompt: r`Add up the number of segments lit for each of the ten digits 0 to 9. What is the total?`,
              answer: 49,
              hint: '0:6, 1:2, 2:5, 3:5, 4:4, 5:5, 6:6, 7:3, 8:7, 9:6.',
              explain: r`$6 + 2 + 5 + 5 + 4 + 5 + 6 + 3 + 7 + 6 = 49$. Battery-powered displays care about this: a clock that shows 8 draws over three times the current of one showing 1.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'Read the input',
              prompt: r`The decoder receives the binary input 0110. How many segments light up?`,
              answer: 6,
              wrong: [{ v: 2, why: r`0110 in binary is 6, not two ones. The digit 6 lights a, c, d, e, f, g.` }],
              explain: r`$0110_2 = 6$, and the digit 6 lights a, c, d, e, f and g: **6** segments.`,
            },
          ],
          recap: [
            'Seven segments a–g, each driven by a Boolean function of the 4-bit input.',
            'A decoder turns binary digits into segment patterns.',
            'Simplifying each segment’s function is classic logic design.',
          ],
        },
      ],
    },
  ],
};
