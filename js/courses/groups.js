const r = String.raw;

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// necklaces of 6 beads, two colours: pattern p is a 6-bit number; its rotations
const rot6 = (p, k) => ((p << k) | (p >> (6 - k))) & 63;
const orbit6 = (p) => [...new Set([0, 1, 2, 3, 4, 5].map((k) => rot6(p, k)))];

export default {
  id: 'groups',
  subject: 'math',
  title: 'Symmetry & Groups',
  level: 'Advanced',
  cover: 'groups',
  tagline: 'The mathematics of symmetry: from triangles to clocks, necklaces, Rubik’s cubes and physics.',
  description: r`What do a snowflake, a Rubik's cube, clock arithmetic and the conservation of energy have in common? Symmetry. Flip and rotate shapes to discover how symmetries combine, learn the four simple rules that define a **group**, see why symmetry is one of the deepest ideas in physics, and use groups to count necklaces and molecules.`,
  prereq: 'Logic & Proof',
  chapters: [
    {
      title: 'Symmetries',
      summary: 'Moves that change nothing.',
      lessons: [
        {
          id: 'symmetries',
          title: 'Symmetries of Shapes',
          summary: 'Rotations and flips',
          icon: 'sparkle',
          steps: [
            {
              type: 'explain',
              title: 'What is a symmetry?',
              body: r`A **symmetry** of a shape is a move that leaves it looking exactly the same: it fits perfectly back into its own outline. Imagine the shape cut out of a board. If someone moved it while you weren't looking, a symmetry is a move you couldn't detect.

To keep track, we'll **number the corners**. The numbers let us see which symmetry was applied, even though the outline looks identical.`,
            },
            {
              type: 'interactive',
              kicker: 'Try it',
              title: 'Match the target',
              prompt: r`Use the buttons to make your square match the target.`,
              widget: { kind: 'symmetry', n: 4, target: { k: 2, f: 0 }, hint: 'Look at where corner 1 needs to go.' },
              explain: r`Two quarter-turns, a **rotation by 180°**, put corner 1 in the bottom-right, matching the target.`,
            },
            {
              type: 'numeric',
              title: 'Count them',
              prompt: r`How many different symmetries does a square have? (Count "do nothing" as one.)`,
              answer: 8,
              wrong: [{ v: 4, why: 'That counts the rotations (0°, 90°, 180°, 270°). Don’t forget the flips.' }, { v: 7, why: 'Include the identity, “do nothing”: it always counts.' }, { v: 6, why: 'There are four mirror lines: two through opposite corners and two through midpoints of opposite sides.' }],
              explain: r`**4 rotations** (0°, 90°, 180°, 270°) and **4 reflections** (two diagonal mirror lines, plus the horizontal and vertical ones): 8 in total. Another way to see it: corner 1 can go to any of 4 places, and then the shape is either flipped or not: $4 \times 2 = 8$.`,
            },
            {
              type: 'numeric',
              title: 'Hexagons',
              prompt: r`A regular hexagon (like a snowflake) has how many symmetries?`,
              answer: 12,
              wrong: [{ v: 6, why: 'That counts only the rotations. There are also 6 mirror lines.' }, { v: 720, why: r`That's $6!$, every possible rearrangement of the corners. Most rearrangements tear the hexagon apart: neighbours must stay neighbours.` }],
              explain: r`Corner 1 can go to any of 6 positions, and the shape can be flipped or not: $6 \times 2 = 12$. In general, a regular $n$-gon has $2n$ symmetries: $n$ rotations and $n$ reflections. This collection is called the **dihedral group** $D_n$.`,
            },
            {
              type: 'numeric',
              title: 'Turning a cube',
              prompt: r`How many rotations (including doing nothing) take a cube onto itself?`,
              answer: 24,
              explain: r`Any of the 6 faces can be on top, and then the cube can be turned 4 ways about the vertical axis: $6 \times 4 = 24$. Including reflections doubles it to 48.`,
            },
            {
              type: 'interactive',
              kicker: 'Challenge',
              title: 'A trickier target',
              prompt: r`Match this target. Notice the numbers now run the other way around: you'll need a flip.`,
              widget: { kind: 'symmetry', n: 4, target: { k: 1, f: 1 }, hint: 'Flip first, then see what rotation is needed.' },
              explain: r`One way: **flip, then rotate 90°**. Every symmetry of the square can be built from just these two moves, R and F, so we say they **generate** the group.`,
            },
          ],
          recap: [
            'A symmetry is a move that leaves a shape looking the same.',
            r`A regular $n$-gon has $2n$ symmetries: $n$ rotations and $n$ reflections.`,
            'Every symmetry of a square can be built from one rotation and one flip.',
          ],
        },
        {
          id: 'combining',
          title: 'Combining Symmetries',
          summary: 'Order matters',
          icon: 'layers',
          steps: [
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Moves in sequence',
              body: r`Doing one symmetry and then another always gives **another symmetry**: the shape still fits its outline. Try sequences of moves on the triangle. The readout names the single symmetry each sequence adds up to.`,
              widget: { kind: 'symmetry', n: 3 },
              after: r`Try **R then R then R**: three turns of 120° bring you back to the start, the **identity**. Try **F then F**: flipping twice also undoes itself.`,
            },
            {
              type: 'mcq',
              title: 'Does order matter?',
              prompt: r`Start with corner 1 at the top of the triangle (corners numbered 1, 2, 3 clockwise). Do **R then F**. Which corner ends up on top? (R is a 120° counterclockwise rotation, F a flip across the vertical axis.)`,
              cols: 3,
              choices: [
                { t: 'Corner 2', ok: true },
                { t: 'Corner 3', why: 'That’s what F then R gives. Try it in the widget: order matters!' },
                { t: 'Corner 1', why: 'The rotation moves corner 1 down to the bottom left, and the flip keeps it at the bottom.' },
              ],
              explain: r`R turns corner 2 (bottom right) up to the top. F flips left and right, which leaves the top corner in place. So corner 2 is on top. But **F then R** puts corner 3 on top. The two results differ: combining symmetries is **not commutative**.`,
            },
            {
              type: 'numeric',
              title: 'Back to the start',
              prompt: r`On the square, how many times must you apply R (a 90° rotation) to get back to the starting position for the first time?`,
              answer: 4,
              wrong: [{ v: 2, why: 'Two quarter-turns make a half-turn: corner 1 is on the opposite side.' }, { v: 90, why: 'Count the number of times you apply R, not degrees.' }],
              explain: r`$4 \times 90° = 360°$. We say R has **order 4**. A flip F has order 2, because flipping twice returns to the start.`,
            },
            {
              type: 'mcq',
              title: 'Undoing a move',
              prompt: r`On the triangle, which move **undoes** R (a 120° counterclockwise rotation)?`,
              choices: [
                { t: r`R then R (240° counterclockwise)`, ok: true },
                { t: 'F', why: 'A flip reverses the order of the corners, but a rotation doesn’t, so a flip can’t undo it.' },
                { t: 'R again', why: 'R and then R again makes 240°, not a full 360°. You need two more R’s after the first.' },
              ],
              explain: r`R followed by R R makes three 120° turns: 360°, back to the start. So $R^{-1} = R^2$, which is the same as rotating 120° clockwise. Every symmetry has an **inverse** that undoes it.`,
            },
            {
              type: 'numeric',
              title: 'Counting flips',
              prompt: r`An equilateral triangle has 6 symmetries. How many of them are reflections?`,
              answer: 3,
              explain: r`Three: one across each line from a corner to the middle of the opposite side. The other three are rotations by 0°, 120° and 240°.`,
            },
            {
              type: 'explain',
              kicker: 'Challenge',
              title: 'A familiar pattern',
              body: r`Look at just the rotations of the triangle: $e$ (do nothing), $R$, and $R^2$. Here's what you get combining them:

| then → | $e$ | $R$ | $R^2$ |
|---|---|---|---|
| $e$ | $e$ | $R$ | $R^2$ |
| $R$ | $R$ | $R^2$ | $e$ |
| $R^2$ | $R^2$ | $e$ | $R$ |

Replace $e, R, R^2$ with $0, 1, 2$ and this is exactly **addition mod 3**: $2 + 2 = 4 \equiv 1$. Rotating a triangle and clock arithmetic are the same structure in disguise. Spotting such hidden sameness is what group theory is for.`,
            },
          ],
          recap: [
            'Doing one symmetry after another gives another symmetry.',
            'Order matters: R then F differs from F then R.',
            'Every symmetry has an inverse, and the identity does nothing.',
          ],
        },
      ],
    },
    {
      title: 'Groups',
      summary: 'The structure behind symmetry.',
      lessons: [
        {
          id: 'what-is-a-group',
          title: 'What Is a Group?',
          summary: 'Four simple rules',
          icon: 'book',
          steps: [
            {
              type: 'explain',
              title: 'The rules',
              body: r`A **group** is a set with a way of combining two elements (write it $a \ast b$) that obeys four rules:

1. **Closure:** combining two elements gives another element of the set.
2. **Associativity:** $(a \ast b) \ast c = a \ast (b \ast c)$.
3. **Identity:** there's an element $e$ with $e \ast a = a \ast e = a$.
4. **Inverses:** every $a$ has an $a^{-1}$ with $a \ast a^{-1} = a^{-1} \ast a = e$.

The symmetries of any shape form a group. But so do many things that have nothing to do with shapes.`,
            },
            {
              type: 'mcq',
              title: 'Integers and addition',
              prompt: r`The integers $\dots, -2, -1, 0, 1, 2, \dots$ with addition. What are the identity and the inverse of 5?`,
              cols: 2,
              choices: [
                { t: r`Identity 0, inverse $-5$`, ok: true },
                { t: r`Identity 1, inverse $\tfrac15$`, why: r`Those are the identity and inverse for **multiplication**. For addition, $5 + 0 = 5$ and $5 + (-5) = 0$.` },
                { t: r`Identity 0, inverse $\tfrac15$`, why: r`The inverse must combine with 5 to give the identity, 0: $5 + (-5) = 0$.` },
              ],
              explain: r`$a + 0 = a$, so 0 is the identity, and $5 + (-5) = 0$, so $-5$ is the inverse. The integers under addition form a group.`,
            },
            {
              type: 'multi',
              title: 'Group or not?',
              prompt: r`Which of these are groups? Select all that apply.`,
              choices: [
                { t: 'Hours on a 12-hour clock, with addition', ok: true },
                { t: r`$\{1, -1\}$ with multiplication`, ok: true },
                { t: 'Even integers with addition', ok: true },
                { t: 'Integers with multiplication', why: r`2 has no inverse: there's no integer $x$ with $2x = 1$.` },
                { t: r`Odd integers with addition`, why: r`Not closed: $1 + 3 = 4$ is even. (There's no identity either: 0 isn't odd.)` },
                { t: r`Whole numbers $0, 1, 2, \dots$ with addition`, why: r`No inverses: nothing in the set adds to 3 to give 0.` },
              ],
              explain: r`Clock arithmetic works (the inverse of 5 o'clock is 7, since $5 + 7 \equiv 0$). $\{1, -1\}$ works ($-1$ is its own inverse). The even integers are closed, contain 0 and include negatives. The failures each break one rule: inverses, closure, or inverses again.`,
            },
            {
              type: 'numeric',
              title: 'A multiplicative inverse',
              prompt: r`The numbers $1, 2, 3, 4, 5, 6$ with multiplication mod 7 form a group, with identity 1. What is the inverse of 3?`,
              answer: 5,
              wrong: [{ v: 4, why: r`That's the inverse for **addition** mod 7 ($3 + 4 \equiv 0$). Here you need $3 \times ? \equiv 1$.` }],
              explain: r`$3 \times 5 = 15 = 2 \times 7 + 1 \equiv 1 \pmod 7$, so $3^{-1} = 5$. Every nonzero number mod a prime has an inverse like this, which is why "division" works in modular arithmetic with a prime modulus, and why primes are everywhere in cryptography.`,
            },
            {
              type: 'interactive',
              title: 'Undo a turn',
              body: r`Every element of a group has an **inverse** that undoes it. $R$ turns the triangle 120° anticlockwise. Using only these buttons, build the symmetry $R^{-1}$, so that doing $R$ and then $R^{-1}$ gets you back to the start.`,
              widget: {
                kind: 'symmetry', n: 3, target: { k: 2, f: 0 }, hint: 'Turning anticlockwise only, how many more turns bring a 120° turn back to the start?',
              },
              explain: r`$R^{-1} = R^2$: after one 120° turn, two more complete the full 360°. Flips are their own inverses ($F^{-1} = F$). In any group, every element must have an inverse: that is one of the four group rules.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Commutative or not',
              prompt: r`A group where $a \ast b = b \ast a$ always is called **abelian**. Which of these is **not** abelian?`,
              choices: [
                { t: 'The 6 symmetries of a triangle', ok: true },
                { t: 'The integers with addition', why: r`$a + b = b + a$ always. Addition is commutative.` },
                { t: 'The 3 rotations of a triangle', why: 'Rotations about the same centre commute: 120° then 240° is the same as 240° then 120°.' },
              ],
              explain: r`We saw that R then F differs from F then R, so the triangle's full symmetry group (with 6 elements) isn't abelian. In fact it's the **smallest** non-abelian group: every group with fewer than 6 elements is commutative.`,
            },
          ],
          recap: [
            'A group: closure, associativity, an identity and inverses.',
            'Symmetries, clock arithmetic and integer addition are all groups.',
            'Abelian groups are commutative. The triangle’s 6 symmetries are the smallest non-abelian group.',
          ],
        },
        {
          id: 'lagrange',
          title: 'Order & Lagrange',
          summary: 'Counting inside groups',
          icon: 'target',
          steps: [
            {
              type: 'explain',
              title: 'Lagrange’s theorem',
              body: r`The **order** of a group is how many elements it has. The **order of an element** is how many times you apply it to get back to the identity.

A remarkable fact, **Lagrange's theorem**: if a smaller group sits inside a bigger one (a **subgroup**), its order divides the bigger group's order. One consequence:

::: key
In a finite group, the order of every element divides the order of the group.
:::

For example, the square's group has 8 elements, and its elements have orders 1, 2 or 4, all divisors of 8.`,
            },
            {
              type: 'mcq',
              title: 'An impossible element',
              prompt: r`A group has 10 elements. Could one of them have order 3?`,
              cols: 2,
              choices: [
                { t: 'No', ok: true },
                { t: 'Yes', why: r`3 doesn't divide 10, so Lagrange's theorem rules it out.` },
                { t: 'It depends on the group', why: 'Lagrange’s theorem applies to every finite group.' },
              ],
              explain: r`Element orders must divide 10, so the only possibilities are 1, 2, 5 and 10. Order 3 is impossible, whatever the group.`,
            },
            {
              type: 'numeric',
              title: 'Corner to corner',
              prompt: r`The cube's 24 rotations form a group. Hold a cube by two opposite corners and turn it about the long diagonal joining them, by the smallest turn that maps it onto itself. What is the order of that rotation?`,
              answer: 3,
              wrong: [{ v: 4, why: 'That’s a turn about an axis through the centres of two faces. Around a corner, three faces meet.' }, { v: 2, why: 'That’s a half-turn about an axis through the midpoints of two opposite edges.' }],
              explain: r`Three faces meet at each corner, and a $120°$ turn about the diagonal cycles them, so the rotation has order **3**. The cube's rotations have orders 1, 2, 3 and 4, and all of them divide 24, as Lagrange's theorem requires.`,
            },
            {
              type: 'numeric',
              title: 'Possible subgroup sizes',
              prompt: r`A group has 12 elements. By Lagrange’s theorem, the size of any subgroup divides 12. How many different sizes are possible?`,
              answer: 6,
              wrong: [{ v: 12, why: r`Only the **divisors** of 12 are possible sizes.` }],
              explain: r`The divisors of 12 are 1, 2, 3, 4, 6 and 12: **6** possible sizes. (A surprise: the converse fails. The group of even permutations of 4 objects has 12 elements but no subgroup of size 6.)`,
            },
            {
              type: 'interactive',
              title: 'Subgroups of the clock',
              body: r`The numbers $0$ to $11$ under addition mod 12 form a group. Pick an element $g$ and keep adding it: the numbers you reach form the **subgroup generated by $g$**. Find an element whose subgroup has exactly **4** elements.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.35, xmax: 1.35, ymin: -1.35, ymax: 1.35, grid: false, axes: false, maxWidth: 320,
                params: { g: { min: 0, max: 11, step: 1, value: 2, label: 'element g', color: 'violet' } },
                extra: ({ plot, p, s }) => { const pos = (k) => { const a = Math.PI / 2 - (2 * Math.PI * k) / 12; return [Math.cos(a), Math.sin(a)]; }; const orb = []; let k = 0; do { orb.push(k); k = (k + p.g) % 12; } while (k !== 0); const out = [s('path', { d: orb.map((k, i) => { const [x, y] = pos(k); return `${i ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; }).join('') + 'Z', class: 'fl-violet-soft', stroke: 'var(--violet)', 'stroke-width': 2.5 })]; for (let k = 0; k < 12; k++) { const [x, y] = pos(k), on = orb.includes(k); out.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 15, class: on ? 'fl-violet' : 'fl-card', stroke: 'var(--line-2)' }), s('text', { x: plot.X(x), y: plot.Y(y) + 5, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:max(calc(13px * var(--fs, 1)), var(--fmin, 0px))', fill: on ? 'var(--card)' : 'var(--ink-2)', text: String(k) })); } return out; },
                readout: (p) => { const orb = []; let k = 0; do { orb.push(k); k = (k + p.g) % 12; } while (k !== 0); return `subgroup {${orb.join(', ')}} · **${orb.length} element${orb.length > 1 ? 's' : ''}** · 12 ÷ ${orb.length} = ${12 / orb.length}`; },
                goal: (p) => p.g === 3 || p.g === 9,
                hint: 'You need to come back to 0 after exactly 4 steps, so 4g must be a multiple of 12.',
                solution: { g: 3 },
              },
              explain: r`$g = 3$ gives $\{0, 3, 6, 9\}$ (and $g = 9$ the same set, backwards). Try every $g$: the subgroup sizes are always 1, 2, 3, 4, 6 or 12, the divisors of 12, exactly as Lagrange’s theorem demands. No element generates a subgroup of size 5.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Prime-sized groups',
              prompt: r`A group has a **prime** number of elements, say 7. What must be true?`,
              choices: [
                { t: 'Every element except the identity has order 7, so one element generates the whole group', ok: true },
                { t: 'Every element has order 1', why: 'Only the identity has order 1.' },
                { t: 'There must be an element of order 2', why: '2 doesn’t divide 7, so that’s impossible.' },
              ],
              explain: r`Element orders must divide 7, so each is 1 or 7. Only the identity has order 1, so any other element $g$ has order 7: its powers $g, g^2, \dots, g^7 = e$ are all 7 elements. Such a group is **cyclic**: it's just rotations of a 7-gon, or addition mod 7, in disguise.`,
            },
          ],
          recap: [
            'The order of an element is how many applications return to the identity.',
            'Lagrange: subgroup orders, and so element orders, divide the group’s order.',
            'Every group of prime order is cyclic.',
          ],
        },
        {
          id: 'nature',
          title: 'Symmetry in Nature',
          summary: 'Crystals, cubes and conservation laws',
          icon: 'atom',
          steps: [
            {
              type: 'explain',
              title: 'Groups everywhere',
              body: r`- **Crystals:** every possible repeating pattern of atoms in 3D belongs to one of exactly **230** symmetry groups (space groups). Flat wallpaper patterns fall into exactly **17** groups.
- **Snowflakes:** water ice forms a hexagonal crystal, so snowflakes have six-fold symmetry.
- **Rubik's cube:** its moves form a group with $43{,}252{,}003{,}274{,}489{,}856{,}000$ elements (positions). In 2010, a computer search proved every position can be solved in at most **20** moves.`,
            },
            {
              type: 'explain',
              title: 'Noether’s theorem',
              body: r`In 1918, Emmy Noether proved one of the most beautiful results in physics: **every continuous symmetry of the laws of nature gives a conservation law.**

| If the laws are the same… | then this is conserved |
|---|---|
| at every **time** | energy |
| at every **place** | momentum |
| in every **direction** | angular momentum |

Conservation of energy isn't an extra rule bolted on. It follows from the fact that physics works the same today as it did yesterday.`,
            },
            {
              type: 'mcq',
              title: 'Match the symmetry',
              prompt: r`An experiment gives the same result whichever way the lab is rotated. By Noether's theorem, what is conserved?`,
              choices: [
                { t: 'Angular momentum', ok: true },
                { t: 'Energy', why: 'Energy comes from symmetry in time (the same laws today and tomorrow).' },
                { t: 'Momentum', why: 'Momentum comes from symmetry in space (the same laws here and there).' },
              ],
              explain: r`Rotational symmetry gives conservation of **angular momentum**. That's why a spinning ice skater speeds up when pulling their arms in, and why planets sweep out equal areas in equal times.`,
            },
            {
              type: 'numeric',
              title: 'Every position',
              prompt: r`The Rubik's cube group has about $4.33 \times 10^{19}$ elements. A computer checking a billion positions per second would take how many years to visit them all? (A year is about $3.16 \times 10^7$ s; nearest ten years.)`,
              unit: 'years',
              answer: 4.3252e19 / 1e9 / 3.156e7,
              tol: 15,
              wrong: [{ v: 4.33e10, relTol: 0.02, why: 'That’s the time in seconds. Divide by the seconds in a year.' }],
              explain: r`$\frac{4.33 \times 10^{19}}{10^9} \approx 4.3 \times 10^{10}$ s, about **1,370 years**. The 2010 proof that every position needs at most 20 moves didn't check positions one by one: it used the group's symmetries to split the problem into about 56 million cases, each solved quickly, and still took 35 CPU-years donated by Google.`,
            },
            {
              type: 'interactive',
              title: 'A snowflake’s turns',
              body: r`A snowflake grows the same way along six arms because of the hexagonal arrangement of water molecules in ice. Rotate the snowflake (colour) over its original outline (grey) and find the **smallest** turn, other than 0°, that maps it exactly onto itself.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.2, xmax: 1.2, ymin: -1.2, ymax: 1.2, grid: false, axes: false, maxWidth: 320,
                params: { a: { min: 0, max: 180, step: 5, value: 25, label: 'rotation', color: 'teal', format: (v) => `${v}°` } },
                extra: ({ plot, p, s }) => { const flake = (rot, stroke, w) => { let d = ''; for (let i = 0; i < 6; i++) { const t = rot + (i * Math.PI) / 3, P = (r, dt) => `${plot.X(r * Math.cos(t + dt)).toFixed(1)} ${plot.Y(r * Math.sin(t + dt)).toFixed(1)}`; d += `M${P(0, 0)} L${P(1, 0)}`; for (const [r, l] of [[0.45, 0.3], [0.72, 0.2]]) { const bx = r * Math.cos(t), by = r * Math.sin(t); for (const sg of [1, -1]) { const ex = bx + l * Math.cos(t + sg * 1.05), ey = by + l * Math.sin(t + sg * 1.05); d += `M${plot.X(bx).toFixed(1)} ${plot.Y(by).toFixed(1)} L${plot.X(ex).toFixed(1)} ${plot.Y(ey).toFixed(1)}`; } } d += `M${P(0.25, 0)} L${P(0.25 / Math.cos(Math.PI / 6), Math.PI / 6)}`; } return s('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round' }); }; return [flake(0, 'var(--line-2)', 9), flake((p.a * Math.PI) / 180, 'var(--teal)', 3.5)]; },
                readout: (p) => (p.a % 60 === 0 ? (p.a === 0 ? 'no turn at all: trivially the same' : `**${p.a}°: a perfect match**`) : `${p.a}°: the arms don’t line up`),
                goal: (p) => p.a === 60,
                hint: 'Six identical arms share 360° between them.',
                solution: { a: 60 },
              },
              explain: r`**60°**, one sixth of a turn. The rotations 0°, 60°, 120°, …, 300° form a group of six; with the six mirror lines as well the snowflake’s full symmetry group has 12 elements, the same as a regular hexagon’s.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Particles from symmetry',
              prompt: r`In the 1960s, Murray Gell-Mann arranged known particles using a symmetry group (SU(3)). One slot in his pattern was empty. What happened next?`,
              choices: [
                { t: 'He predicted a new particle, the Ω⁻, which was discovered in 1964', ok: true },
                { t: 'He concluded the theory was wrong', why: 'The gap turned out to be a prediction, not a flaw.' },
                { t: 'The gap was filled by the electron', why: 'Electrons aren’t made of quarks. The missing slot was for a heavy, strange particle.' },
              ],
              explain: r`The symmetry pattern predicted the missing particle's charge, strangeness and approximate mass. The **omega-minus** was found at Brookhaven in 1964, a triumph for symmetry and an early step toward the quark model.`,
            },
          ],
          recap: [
            'Crystals fall into 230 space groups, and wallpaper patterns into 17.',
            'Noether: time symmetry → energy, space → momentum, rotation → angular momentum.',
            'Symmetry groups have predicted new particles.',
          ],
        },
      ],
    },
    {
      title: 'Groups in Action',
      summary: 'Clock arithmetic and counting with symmetry.',
      lessons: [
        {
          id: 'cyclic',
          title: 'Clock Groups',
          summary: 'Generators and star polygons',
          icon: 'clock',
          steps: [
            {
              type: 'numeric',
              kicker: 'Warm-up',
              title: 'Clock arithmetic',
              prompt: r`On a 12-hour clock, it's 9 o'clock. What time will it be in 7 hours?`,
              answer: 4,
              wrong: [{ v: 16, why: 'The clock wraps around after 12: 16 − 12.' }],
              explain: r`$9 + 7 = 16 \equiv 4 \pmod{12}$. The hours with addition "wrapping round" form a group called $\mathbb Z_{12}$: adding is the operation, 0 (12 o'clock) is the identity, and every hour has an inverse (the time back to 12).`,
            },
            {
              type: 'interactive',
              title: 'Step around the clock',
              body: r`Start at 0 and keep jumping forward $k$ hours on a clock with $n$ hours, drawing a line for each jump. Some step sizes visit every hour; others get stuck in a smaller loop. On the 12-hour clock, find a step size **other than 1 or 11** that visits all 12 hours.`,
              widget: {
                kind: 'graph', equal: true, xmin: -1.3, xmax: 1.3, ymin: -1.3, ymax: 1.3, grid: false, axes: false, maxWidth: 360,
                params: {
                  n: { min: 5, max: 16, step: 1, value: 12, label: 'hours on the clock', color: 'blue' },
                  k: { min: 1, max: 15, step: 1, value: 4, label: 'step size', color: 'coral' },
                },
                extra: ({ plot, p, s }) => {
                  const pt = (i) => [Math.sin((2 * Math.PI * i) / p.n), Math.cos((2 * Math.PI * i) / p.n)], els = [];
                  let cur = 0, d = '';
                  const steps = p.n / gcd(p.n, p.k % p.n || p.n);
                  for (let j = 0; j <= steps; j++) { const [x, y] = pt(cur); d += `${j ? 'L' : 'M'}${plot.X(x).toFixed(1)} ${plot.Y(y).toFixed(1)}`; cur = (cur + p.k) % p.n; }
                  els.push(s('path', { d, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2.5 }));
                  for (let i = 0; i < p.n; i++) { const [x, y] = pt(i); els.push(s('circle', { cx: plot.X(x), cy: plot.Y(y), r: 9, class: 'fl-card', stroke: 'var(--ink)', 'stroke-width': 1.5 })); els.push(s('text', { x: plot.X(x * 1.17), y: plot.Y(y * 1.17) + 4, class: 'tick', 'text-anchor': 'middle', text: String(i) })); }
                  return els;
                },
                readout: (p) => { const g = gcd(p.n, p.k % p.n || p.n), c = p.n / g; return c === p.n ? `Step ${p.k} visits **all ${p.n}** hours: it **generates** the whole group.` : `Step ${p.k} returns to 0 after visiting only **${c}** of the ${p.n} hours.`; },
                goal: (p) => p.n === 12 && p.k % 12 !== 1 && p.k % 12 !== 11 && gcd(12, p.k % 12) === 1,
                hint: 'Try steps that share no factor with 12.',
                solution: { n: 12, k: 5 },
              },
              explain: r`Steps 5 and 7 (as well as 1 and 11) visit every hour, drawing a 12-pointed star. A step $k$ visits all $n$ hours exactly when $k$ and $n$ share no common factor: then $k$ **generates** the group. Otherwise the jumps stay in a smaller loop of $\frac{n}{\gcd(n, k)}$ hours, a **subgroup**.`,
            },
            {
              type: 'numeric',
              title: 'The order of an element',
              prompt: r`In $\mathbb Z_{12}$, the **order** of an element is how many steps of it bring you back to 0. What is the order of 8?`,
              answer: 3,
              wrong: [{ v: 8, why: 'Count the jumps: 8, 16 ≡ 4, 12 ≡ 0. That’s 3 jumps.' }, { v: 4, why: r`$8 + 8 + 8 = 24 \equiv 0$: three jumps.` }],
              explain: r`$8 \to 16 \equiv 4 \to 24 \equiv 0$: order 3, equal to $\frac{12}{\gcd(12, 8)} = \frac{12}{4}$. As Lagrange's theorem demands, it divides 12.`,
            },
            {
              type: 'mcq',
              title: 'Prime clocks',
              prompt: r`On a clock with a **prime** number of hours, say 7, which step sizes (other than 0) visit every hour?`,
              choices: [
                { t: 'All of them', ok: true },
                { t: 'Only 1 and 6', why: 'Try 3 on a 7-hour clock: 0, 3, 6, 2, 5, 1, 4. Every hour!' },
                { t: 'None except 1', why: 'With a prime number of hours, every nonzero step shares no factor with it.' },
              ],
              explain: r`A prime $p$ shares no factor with any of $1, 2, \ldots, p - 1$, so every nonzero step generates the whole group. That's also why a group of prime size has no subgroups except itself and the trivial one, and why prime moduli are popular in cryptography.`,
            },
            {
              type: 'explain',
              title: 'Every cyclic group is a clock',
              body: r`A group generated by a single element is called **cyclic**. Every finite cyclic group is the same as a clock group $\mathbb Z_n$ in disguise: the rotations of a regular $n$-gon, the $n$th roots of unity under multiplication, the hours on a clock. Mathematicians say they're all **isomorphic**: the same structure with different labels.

Recognising that very different-looking systems share one structure is the great power of group theory.`,
            },
            {
              type: 'numeric',
              kicker: 'Challenge',
              title: 'How many generators?',
              prompt: r`How many elements of $\mathbb Z_{12}$ generate the whole group?`,
              answer: 4,
              wrong: [{ v: 12, why: 'Steps sharing a factor with 12 (like 2, 3, 4, 6, 8, 9, 10) get stuck in smaller loops.' }, { v: 2, why: 'Besides 1 and 11, the steps 5 and 7 also work.' }],
              explain: r`The generators are 1, 5, 7 and 11, the numbers below 12 sharing no factor with it. Their count is **Euler's totient** $\varphi(12) = 4$, the same function that powers RSA encryption (see the Cryptography course).`,
            },
          ],
          recap: [
            'Clock arithmetic forms the cyclic group ℤₙ.',
            'A step k generates ℤₙ exactly when gcd(k, n) = 1; otherwise it makes a smaller subgroup.',
            'Every cyclic group is a clock in disguise; ℤₙ has φ(n) generators.',
          ],
        },
        {
          id: 'burnside',
          title: 'Counting with Symmetry',
          summary: 'Necklaces and Burnside’s lemma',
          icon: 'grip',
          steps: [
            {
              type: 'mcq',
              kicker: 'Warm-up',
              title: 'The same necklace?',
              prompt: r`A necklace has 6 beads around a circle, each black or white. If two necklaces differ only by a rotation, they count as the same. Is the number of different necklaces equal to $2^6 = 64$?`,
              cols: 2,
              choices: [
                { t: 'No, fewer', ok: true },
                { t: 'Yes', why: 'Rotating a necklace gives the same necklace, so many of the 64 patterns are duplicates.' },
              ],
              explain: r`Rotations identify patterns: "black, then five white" looks the same wherever the black bead sits, so 6 patterns collapse into one necklace. But not every necklace has 6 versions: an all-white necklace has just 1. Counting needs care.`,
            },
            {
              type: 'explain',
              kicker: 'Explore',
              title: 'Orbits',
              body: r`Choose a pattern (as a number from 0 to 63, read in binary around the necklace). The row shows all its rotations, and the readout counts how many **different** patterns they produce: the size of its **orbit**.`,
              widget: {
                kind: 'graph', equal: true, xmin: 0, xmax: 6.3, ymin: 0, ymax: 1.25, grid: false, axes: false, maxWidth: 600,
                params: { pat: { min: 0, max: 63, step: 1, value: 5, label: 'pattern', color: 'violet' } },
                extra: ({ plot, p, s }) => {
                  const els = [];
                  for (let k = 0; k < 6; k++) {
                    const q = rot6(p.pat, k), cx = 0.55 + k * 1.04;
                    els.push(s('circle', { cx: plot.X(cx), cy: plot.Y(0.62), r: plot.X(0.38) - plot.X(0), fill: 'none', stroke: 'var(--line-2)' }));
                    for (let b = 0; b < 6; b++) { const a = (2 * Math.PI * b) / 6; els.push(s('circle', { cx: plot.X(cx + 0.38 * Math.sin(a)), cy: plot.Y(0.62 + 0.38 * Math.cos(a)), r: 7, class: (q >> b) & 1 ? 'fl-ink' : 'fl-card', stroke: 'var(--ink)', 'stroke-width': 1.5 })); }
                  }
                  return els;
                },
                readout: (p) => { const o = orbit6(p.pat).length; return `Rotating gives **${o}** different pattern${o > 1 ? 's' : ''} (orbit size ${o}), and ${6 / o} rotation${6 / o > 1 ? 's' : ''} leave it unchanged.`; },
              },
              after: r`Orbit sizes can be 1, 2, 3 or 6, always dividing 6, and (orbit size) × (number of rotations that fix the pattern) is always 6. That relationship is the key to counting.`,
            },
            {
              type: 'explain',
              title: 'Burnside’s lemma',
              body: r`Instead of listing orbits, count **fixed points**: for each symmetry, how many patterns does it leave unchanged? Then

::: key
number of distinct objects $=$ the **average** number of patterns fixed by each symmetry.
:::

For 6-bead necklaces and the 6 rotations:
- rotating by 0: fixes all $2^6 = 64$ patterns;
- by 1 or 5 places: only the 2 single-colour necklaces;
- by 2 or 4 places: patterns repeating every 2 beads: $2^2 = 4$ each;
- by 3 places: patterns repeating every 3 beads: $2^3 = 8$.`,
            },
            {
              type: 'numeric',
              title: 'Count the necklaces',
              prompt: r`Average the fixed-pattern counts: $\dfrac{64 + 2 + 2 + 4 + 4 + 8}{6}$. How many different necklaces are there?`,
              answer: 14,
              wrong: [{ v: 64, why: 'That counts rotated versions separately.' }, { v: 84, why: 'That’s the total of fixed points. Divide by the 6 rotations.' }, { v: 11, why: r`$64 + 2 + 2 + 4 + 4 + 8 = 84$, and $84 / 6 = 14$.` }],
              explain: r`$\frac{84}{6} = 14$ necklaces. (If flipping the necklace over also counts as the same, a few more pairs merge, leaving 13.) The lemma, usually credited to Burnside but known earlier to Cauchy and Frobenius, turns a tricky counting problem into simple arithmetic.`,
            },
            {
              type: 'numeric',
              title: 'Colouring a square',
              prompt: r`Each corner of a square is coloured red or blue. Rotations of the square count as the same colouring. Using Burnside: rotation by 0 fixes all $2^4 = 16$; by $90°$ or $270°$, 2 each; by $180°$, 4. How many distinct colourings are there?`,
              answer: 6,
              wrong: [{ v: 16, why: 'Rotations identify many of the 16 patterns.' }, { v: 24, why: 'That’s the total of fixed points. Divide by 4 rotations.' }],
              explain: r`$\frac{16 + 2 + 4 + 2}{4} = 6$: all red, all blue, one blue, one red, two blues adjacent, two blues opposite. Listing them confirms the count.`,
            },
            {
              type: 'mcq',
              kicker: 'Challenge',
              title: 'Chemistry by symmetry',
              prompt: r`Chemists want to know how many different molecules can be made by attaching hydrogen or chlorine atoms to the six corners of a benzene ring (which has the symmetry of a hexagon, including flips). What tool fits?`,
              choices: [
                { t: 'Burnside-style counting with the hexagon’s 12 symmetries, which gives 13', ok: true },
                { t: 'Just 2⁶ = 64', why: 'Rotated and flipped versions are the same molecule, so 64 overcounts.' },
                { t: 'It can only be done by building every molecule', why: 'Symmetry counting gives the answer without building anything.' },
              ],
              explain: r`With rotations and reflections (12 symmetries in total), Burnside's lemma gives 13 distinct patterns, matching the 13 chlorobenzenes chemists know (counting benzene itself). George Pólya extended Burnside's lemma in 1937 into a general method that counts chemical isomers, graphs and colourings of every kind.`,
            },
          ],
          recap: [
            'Symmetries group patterns into orbits; orbit size × fixing symmetries = size of the group.',
            'Burnside’s lemma: number of distinct objects = average number of patterns each symmetry fixes.',
            'It counts necklaces (14), square colourings (6) and chemical isomers (13 chlorobenzenes).',
          ],
        },
      ],
    },
  ],
};
